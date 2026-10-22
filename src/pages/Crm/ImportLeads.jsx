import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Papa from "papaparse";
import { ArrowLeft, FileUp, Upload, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import CrmRoute from "@/components/crm/CrmRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import axiosInstance from "@/utils/axiosConfig";

// CRM field -> header names we recognise automatically (lower-case, punctuation removed)
const FIELDS = [
  { key: "brandName", label: "Brand / business name *", guess: ["brandname", "businessname", "brand", "business", "company", "companyname", "client", "clientname", "name"] },
  { key: "contactPerson", label: "Contact person", guess: ["contactperson", "contact", "decisionmaker", "person", "owner", "contactname"] },
  { key: "email", label: "Email", guess: ["email", "emailaddress", "mail"] },
  { key: "phone", label: "Phone", guess: ["phone", "mobile", "phonenumber", "whatsapp", "contactnumber"] },
  { key: "industry", label: "Industry", guess: ["industry", "category", "sector"] },
  { key: "location", label: "Location", guess: ["location", "city", "address", "area"] },
  { key: "websiteLink", label: "Website", guess: ["website", "websitelink", "officialwebsite", "url", "site"] },
  { key: "instagramLink", label: "Instagram", guess: ["instagram", "instagramlink", "ig"] },
  { key: "leadInformation", label: "Notes / lead information", guess: ["leadinformation", "notes", "note", "description", "information"] },
  { key: "research.score", label: "Research score (0-100)", guess: ["score", "scoretotal", "researchscore"] },
  { key: "research.tier", label: "Research tier (P1/P2/P3/Hold)", guess: ["tier", "researchtier", "prioritytier"] },
  { key: "research.gap", label: "Observed gap", guess: ["gap", "observedmarketinggap", "marketinggap"] },
  { key: "research.signal", label: "Buying signal", guess: ["signal", "buyingsignal"] },
  { key: "research.angle", label: "Outreach angle", guess: ["angle", "outreachangle"] },
  { key: "research.sourceUrls", label: "Source URLs", guess: ["sources", "sourceurls", "source"] },
  { key: "lead.serviceType", label: "Services (; separated)", guess: ["service", "services", "servicetype", "recommendedservice"] },
  { key: "lead.priority", label: "Priority (Low/Medium/High/Critical)", guess: ["priority", "crmpriority"] },
  { key: "lead.leadSourceType", label: "Lead source", guess: ["leadsource", "leadsourcetype"] },
  { key: "lead.projectAccountHandledBy", label: "Handled by", guess: ["handledby", "projectaccounthandledby", "accountmanager", "assignedto"] },
];
const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
const SERVICE_OPTIONS = ["Website Development", "Mobile App Development", "Graphic designing", "Social Media Marketing", "Branding & Design", "Influencer Marketing", "Production / Shoot", "SEO", "PR", "performance marketing"];
const SOURCE_OPTIONS = ["Cold Call / Email", "WhatsApp", "Instagram DM", "Referral", "Website Enquiry", "Google Ad", "Facebook Ad", "Event / Exhibition", "Existing Client", "Others"];
const PRIORITIES = ["Low", "Medium", "High", "Critical"];
const TIER_TO_PRIORITY = { p1: "High", p2: "Medium", p3: "Low", hold: "Low" };
const NONE = "__none__";

const setPath = (obj, path, value) => {
  const [a, b] = path.split(".");
  if (!b) obj[a] = value;
  else obj[a] = { ...(obj[a] || {}), [b]: value };
};

const STATUS_STYLE = {
  create: "text-blue-700 bg-blue-50",
  created: "text-green-700 bg-green-50",
  exists: "text-gray-600 bg-gray-100",
  invalid: "text-amber-700 bg-amber-50",
  failed: "text-red-700 bg-red-50",
};

const ImportLeads = () => {
  const navigate = useNavigate();
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState([]);
  const [records, setRecords] = useState([]);
  const [mapping, setMapping] = useState({});
  const [createLeads, setCreateLeads] = useState(true);
  const [defaults, setDefaults] = useState({ leadSourceType: "Cold Call / Email", priority: "Medium", serviceType: "Social Media Marketing" });
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  const onFile = (file) => {
    if (!file) return;
    setFileName(file.name);
    setResult(null);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: "greedy",
      complete: ({ data, meta, errors }) => {
        if (errors?.length) toast.warning(`${errors.length} row(s) had formatting problems and may be incomplete`);
        const hs = meta.fields || [];
        setHeaders(hs);
        setRecords(data);
        const auto = {};
        for (const f of FIELDS) {
          const hit = hs.find((h) => f.guess.includes(norm(h)));
          if (hit) auto[f.key] = hit;
        }
        setMapping(auto);
        toast.success(`Read ${data.length} rows from ${file.name}`);
      },
    });
  };

  const rows = useMemo(
    () =>
      records.map((rec) => {
        const row = {};
        for (const f of FIELDS) {
          const h = mapping[f.key];
          if (h && rec[h] !== undefined && String(rec[h]).trim() !== "") setPath(row, f.key, String(rec[h]).trim());
        }
        // Accept tiers like "P1" in a priority column, and map tier -> priority when no priority is given
        if (row.research?.tier) row.research.tier = row.research.tier.toUpperCase() === "HOLD" ? "Hold" : row.research.tier.toUpperCase();
        if (row.lead?.priority && TIER_TO_PRIORITY[row.lead.priority.toLowerCase()]) row.lead.priority = TIER_TO_PRIORITY[row.lead.priority.toLowerCase()];
        if (!row.lead?.priority && row.research?.tier) setPath(row, "lead.priority", TIER_TO_PRIORITY[row.research.tier.toLowerCase()]);
        if (row.lead?.serviceType) {
          const picked = row.lead.serviceType.split(/\s*[;,/+]\s*/).map((s) => SERVICE_OPTIONS.find((o) => o.toLowerCase() === s.toLowerCase()) || SERVICE_OPTIONS.find((o) => s.toLowerCase().includes(o.toLowerCase().split(" ")[0]))).filter(Boolean);
          row.lead.serviceType = [...new Set(picked)];
          if (!row.lead.serviceType.length) delete row.lead.serviceType;
        }
        return row;
      }),
    [records, mapping]
  );

  const send = async (dryRun) => {
    if (!mapping.brandName) return toast.error("Map the brand/business name column first");
    setBusy(true);
    try {
      const res = await axiosInstance.post("/v1/leadclient/import", {
        rows,
        dryRun,
        createLeads,
        defaults: { ...defaults, serviceType: [defaults.serviceType] },
      });
      setResult(res.data);
      if (!dryRun) toast.success(`Imported ${res.data.summary.created} client(s)`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Import failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <CrmRoute>
      <div className="p-4 md:p-6 space-y-4 max-w-6xl">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate("/crm")} title="Back to CRM">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl md:text-2xl font-semibold flex items-center gap-2">
              <FileUp className="h-6 w-6 text-blue-600" /> Import leads from CSV
            </h1>
            <p className="text-sm text-gray-500">Upload a sheet, match its columns, preview, then import. Brands already in the CRM are skipped, never duplicated.</p>
          </div>
        </div>

        <Card>
          <CardContent className="p-5 space-y-3">
            <Label className="font-medium">1. Choose a CSV file</Label>
            <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800">
              <Upload className="h-6 w-6 text-gray-400 mb-2" />
              <span className="text-sm">{fileName || "Click to choose a .csv file (export from Excel or Google Sheets as CSV)"}</span>
              <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            </label>
            {records.length > 0 && <p className="text-sm text-gray-600">{records.length} rows · {headers.length} columns</p>}
          </CardContent>
        </Card>

        {headers.length > 0 && (
          <Card>
            <CardContent className="p-5 space-y-4">
              <Label className="font-medium">2. Match columns to CRM fields</Label>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {FIELDS.map((f) => (
                  <div key={f.key} className="grid gap-1">
                    <span className="text-xs text-gray-600">{f.label}</span>
                    <Select value={mapping[f.key] || NONE} onValueChange={(v) => setMapping((m) => ({ ...m, [f.key]: v === NONE ? undefined : v }))}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>{"— Don't import —"}</SelectItem>
                        {headers.map((h) => (
                          <SelectItem key={h} value={h}>
                            {h}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 grid sm:grid-cols-4 gap-3 items-end">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={createLeads} onCheckedChange={(v) => setCreateLeads(!!v)} /> Also create a pipeline lead for each
                </label>
                {[
                  ["leadSourceType", "Default lead source", SOURCE_OPTIONS],
                  ["priority", "Default priority", PRIORITIES],
                  ["serviceType", "Default service", SERVICE_OPTIONS],
                ].map(([key, label, opts]) => (
                  <div key={key} className="grid gap-1">
                    <span className="text-xs text-gray-600">{label}</span>
                    <Select value={defaults[key]} onValueChange={(v) => setDefaults((d) => ({ ...d, [key]: v }))} disabled={!createLeads}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {opts.map((o) => (
                          <SelectItem key={o} value={o}>
                            {o}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => send(true)} disabled={busy}>
                  3. Preview import
                </Button>
                <Button
                  onClick={() => send(false)}
                  disabled={busy || !result?.dryRun || !result.summary.create}
                  className="bg-blue-600 hover:bg-blue-700"
                  title={!result?.dryRun ? "Preview first" : ""}
                >
                  4. Import {result?.dryRun ? result.summary.create : ""} new
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {result && (
          <Card>
            <CardContent className="p-5 space-y-3">
              <div className="flex flex-wrap gap-4 text-sm">
                {result.dryRun ? (
                  <span className="flex items-center gap-1 font-medium"><AlertTriangle className="h-4 w-4 text-amber-500" /> Preview only - nothing saved yet</span>
                ) : (
                  <span className="flex items-center gap-1 font-medium"><CheckCircle2 className="h-4 w-4 text-green-600" /> Import finished</span>
                )}
                <span>New: {result.dryRun ? result.summary.create : result.summary.created}</span>
                <span>Already in CRM: {result.summary.exists}</span>
                <span>Invalid: {result.summary.invalid}</span>
                {!result.dryRun && <span>Failed: {result.summary.failed}</span>}
              </div>
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Row</TableHead>
                      <TableHead>Brand</TableHead>
                      <TableHead>Result</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.results.map((r) => (
                      <TableRow key={`${r.row}-${r.brandName}`}>
                        <TableCell>{r.row}</TableCell>
                        <TableCell>{r.brandName}</TableCell>
                        <TableCell>
                          <span className={`text-xs rounded px-2 py-0.5 ${STATUS_STYLE[r.status] || ""}`}>{r.status}</span>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">{r.message || ""}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </CrmRoute>
  );
};

export default ImportLeads;
