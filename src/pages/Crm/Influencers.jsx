import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Papa from "papaparse";
import { Download, Edit, FileUp, Plus, Search, Star, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import PageHeader, { Stat, Pill } from "@/components/crm/PageHeader";
import InfluencerEditor, { STATUS_STYLE, compact } from "@/components/crm/InfluencerEditor";
import RowActions from "@/components/ui/row-actions";
import { useAccess } from "@/components/crm/AccessRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { confirmDialog } from "@/components/ui/app-dialogs";
import axiosInstance from "@/utils/axiosConfig";
import { errMsg } from "@/lib/publicApi";
import { downloadFile } from "@/lib/crmOutreach";

const TEMPLATE_COLUMNS = ["name", "instagram", "instagramFollowers", "instagramEngagement", "instagramAvgViews", "youtube", "youtubeSubscribers", "youtubeEngagement", "youtubeAvgViews", "facebook", "facebookFollowers", "x", "xFollowers", "linkedin", "linkedinFollowers", "niches", "languages", "city", "state", "country", "gender", "email", "phone", "managerName", "managerPhone", "managerEmail", "rateReel", "ratePost", "rateStory", "rateYoutube", "openToBarter", "status", "owner", "tags", "notes"];
const FOLLOWER_RANGES = [
  ["", "Any size"],
  ["0-10000", "Under 10K (Nano)"],
  ["10000-100000", "10K–100K (Micro)"],
  ["100000-500000", "100K–500K (Mid)"],
  ["500000-1000000", "500K–1M (Macro)"],
  ["1000000-", "1M+ (Mega)"],
];
const ANY = "__any";
const blankFilters = { q: "", platform: "", niche: "", city: "", language: "", status: "", owner: "", range: "", barter: false, sort: "followers" };

const ImportDialog = ({ open, onOpenChange, onDone }) => {
  const [rows, setRows] = useState(null);
  const [busy, setBusy] = useState(false);
  const input = useRef(null);
  useEffect(() => {
    if (!open) setRows(null);
  }, [open]);
  const template = () => downloadFile("influencers-template.csv", `${TEMPLATE_COLUMNS.join(",")}\n`, "text/csv");
  const pick = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => {
        const key = h.trim().replace(/\s+/g, "").toLowerCase();
        return TEMPLATE_COLUMNS.find((c) => c.toLowerCase() === key) || h.trim();
      },
      complete: (r) => setRows(r.data.filter((x) => Object.values(x).some((v) => String(v || "").trim()))),
      error: () => toast.error("Could not read that file"),
    });
  };
  const run = async () => {
    setBusy(true);
    try {
      const r = await axiosInstance.post("/v1/influencer/import", { rows });
      toast.success(`${r.data.created} added${r.data.skipped ? `, ${r.data.skipped} already in the CRM (skipped)` : ""}${r.data.errors.length ? `, ${r.data.errors.length} with problems` : ""}`, { description: r.data.errors.slice(0, 5).map((e) => `Row ${e.row}: ${e.message}`).join("\n") || undefined });
      onDone();
      onOpenChange(false);
    } catch (err) {
      toast.error(errMsg(err, "Import failed"));
    } finally {
      setBusy(false);
    }
  };
  const missingName = rows ? rows.filter((r) => !String(r.name || "").trim()).length : 0;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Import influencers from CSV</DialogTitle>
          <DialogDescription>{'Use the template\'s column names. Only "name" is required. Anyone already in the CRM (same handle, email or phone) is skipped.'}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 text-sm">
          <ol className="list-decimal pl-5 space-y-1 text-muted-foreground">
            <li>Download the template and fill it in (Excel or Google Sheets), then save it as CSV.</li>
            <li>For Instagram / YouTube you can put the @handle or the profile link. Niches, languages and tags: separate with commas.</li>
            <li>Rates are in rupees. Status is one of: Prospect, Contacted, In talks, Worked with, Not interested, Do not use.</li>
          </ol>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={template}><Download className="h-4 w-4 mr-1" /> Template</Button>
            <Button size="sm" onClick={() => input.current?.click()}><FileUp className="h-4 w-4 mr-1" /> Choose CSV</Button>
            <input ref={input} type="file" accept=".csv,text/csv" className="hidden" onChange={pick} />
          </div>
          {rows && (
            <div className="rounded-md border p-3 space-y-1">
              <p><b>{rows.length}</b> rows found{missingName ? `, ${missingName} without a name (will be skipped)` : ""}.</p>
              <p className="text-xs text-muted-foreground truncate">First: {rows.slice(0, 3).map((r) => r.name).filter(Boolean).join(", ") || "—"}</p>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={run} disabled={!rows?.length || busy}>{busy ? "Importing..." : `Import ${rows?.length || ""}`}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const FilterSelect = ({ value, onChange, placeholder, options, className = "w-40" }) => (
  <Select value={value || ANY} onValueChange={(v) => onChange(v === ANY ? "" : v)}>
    <SelectTrigger className={className}><SelectValue placeholder={placeholder} /></SelectTrigger>
    <SelectContent>
      <SelectItem value={ANY}>{placeholder}</SelectItem>
      {options.map((o) => (Array.isArray(o) ? <SelectItem key={o[0]} value={o[0]}>{o[1]}</SelectItem> : <SelectItem key={o} value={o}>{o}</SelectItem>))}
    </SelectContent>
  </Select>
);

/* Influencer database: search and filter creators by platform, niche, city, size and status; add, import, export. */
const Influencers = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAccess();
  const [filters, setFilters] = useState(blankFilters);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [editing, setEditing] = useState(undefined);
  const [importing, setImporting] = useState(false);

  const params = useCallback(() => {
    const [minFollowers, maxFollowers] = (filters.range || "-").split("-");
    const p = { ...filters, minFollowers, maxFollowers, barter: filters.barter ? "true" : "", page };
    delete p.range;
    return Object.fromEntries(Object.entries(p).filter(([, v]) => v !== "" && v !== undefined));
  }, [filters, page]);

  const load = useCallback(async () => {
    try {
      setData((await axiosInstance.get("/v1/influencer", { params: params() })).data);
    } catch (err) {
      toast.error(errMsg(err, "Could not load influencers"));
    }
  }, [params]);
  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      setFilters((f) => (f.q === q ? f : { ...f, q }));
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const setF = (k, v) => {
    setPage(1);
    setFilters((f) => ({ ...f, [k]: v }));
  };
  const remove = async (inf) => {
    if (!(await confirmDialog(`Delete ${inf.name}? Their campaign history is kept for records but they no longer show in the list.`))) return;
    try {
      await axiosInstance.delete(`/v1/influencer/${inf._id}`);
      toast.success("Deleted");
      load();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };
  // The list leaves out notes; edit the full record so nothing is overwritten
  const openEditor = async (inf) => {
    try {
      setEditing((await axiosInstance.get(`/v1/influencer/${inf._id}`)).data.influencer);
    } catch (err) {
      toast.error(errMsg(err, "Could not open"));
    }
  };
  const exportCsv = async () => {
    try {
      const p = params();
      delete p.page;
      const r = await axiosInstance.get("/v1/influencer/export", { params: p, responseType: "blob" });
      downloadFile(`influencers-${new Date().toISOString().slice(0, 10)}.csv`, r.data);
    } catch {
      toast.error("Export failed");
    }
  };

  const o = data?.options || { platforms: [], statuses: [], niches: [], cities: [], languages: [], owners: [] };
  const s = data?.summary || { byStatus: {}, byTier: {} };
  const filtered = JSON.stringify({ ...filters, q }) !== JSON.stringify(blankFilters);

  return (
    <div className="p-4 md:p-6 space-y-4">
      <PageHeader icon={Star} title="Influencers" subtitle="Creators you work with or want to: reach, rates, contacts and every campaign done for clients.">
        <Button variant="outline" onClick={() => setImporting(true)}><FileUp className="h-4 w-4 mr-1" /> Import</Button>
        {isAdmin && <Button variant="outline" onClick={exportCsv}><Download className="h-4 w-4 mr-1" /> Export</Button>}
        <Button onClick={() => setEditing(null)} className="bg-primary hover:bg-primary/90"><Plus className="h-4 w-4 mr-1" /> Add influencer</Button>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Influencers" value={s.total ?? "–"} sub={Object.entries(s.byTier).map(([t, n]) => `${n} ${t}`).join(" · ") || undefined} />
        <Stat label="Worked with" value={s.byStatus["Worked with"] || 0} tone="good" />
        <Stat label="In talks" value={(s.byStatus["In talks"] || 0) + (s.byStatus.Contacted || 0)} sub="contacted or in talks" />
        <Stat label="Prospects" value={s.byStatus.Prospect || 0} />
      </div>

      <Card>
        <CardContent className="p-3 flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-8" placeholder="Name, @handle, niche, client..." value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <FilterSelect value={filters.platform} onChange={(v) => setF("platform", v)} placeholder="Any platform" options={o.platforms} className="w-36" />
          <FilterSelect value={filters.range} onChange={(v) => setF("range", v)} placeholder="Any size" options={FOLLOWER_RANGES.slice(1)} className="w-44" />
          <FilterSelect value={filters.niche} onChange={(v) => setF("niche", v)} placeholder="Any niche" options={o.niches} className="w-36" />
          <FilterSelect value={filters.city} onChange={(v) => setF("city", v)} placeholder="Any city" options={o.cities} className="w-36" />
          {o.languages.length > 0 && <FilterSelect value={filters.language} onChange={(v) => setF("language", v)} placeholder="Any language" options={o.languages} className="w-36" />}
          <FilterSelect value={filters.status} onChange={(v) => setF("status", v)} placeholder="Any status" options={o.statuses} className="w-36" />
          {o.owners.length > 0 && <FilterSelect value={filters.owner} onChange={(v) => setF("owner", v)} placeholder="Anyone" options={o.owners} className="w-36" />}
          <label className="flex items-center gap-2 text-sm px-1"><input type="checkbox" checked={filters.barter} onChange={(e) => setF("barter", e.target.checked)} /> Barter OK</label>
          <Select value={filters.sort} onValueChange={(v) => setF("sort", v)}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="followers">Most followers</SelectItem><SelectItem value="rating">Best rated</SelectItem><SelectItem value="recent">Recently updated</SelectItem><SelectItem value="name">Name A–Z</SelectItem></SelectContent>
          </Select>
          {filtered && <Button variant="ghost" size="sm" onClick={() => { setQ(""); setPage(1); setFilters(blankFilters); }}><X className="h-4 w-4 mr-1" /> Clear</Button>}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Influencer</TableHead>
                <TableHead>Platforms</TableHead>
                <TableHead className="text-right">Reach</TableHead>
                <TableHead>Niche · City</TableHead>
                <TableHead className="text-right">Rate from</TableHead>
                <TableHead>Campaigns</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.influencers || []).length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center py-10 text-muted-foreground">{!data ? "Loading..." : filtered ? "No influencers match these filters." : "No influencers yet. Add one, or import your spreadsheet."}</TableCell></TableRow>
              )}
              {(data?.influencers || []).map((inf) => {
                const minRate = Math.min(...(inf.rates || []).map((r) => r.amount).filter((n) => n > 0));
                return (
                  <TableRow key={inf._id} className="cursor-pointer" onClick={() => navigate(`/crm/influencers/${inf._id}`)}>
                    <TableCell>
                      <Link to={`/crm/influencers/${inf._id}`} className="font-medium hover:underline" onClick={(e) => e.stopPropagation()}>{inf.name}</Link>
                      <p className="text-xs text-muted-foreground">{[inf.tier, inf.rating ? "★".repeat(inf.rating) : "", inf.owner].filter(Boolean).join(" · ")}</p>
                    </TableCell>
                    <TableCell className="text-xs">
                      {(inf.platforms || []).slice(0, 3).map((p, i) => (
                        <div key={i} className="whitespace-nowrap">
                          <span className="text-muted-foreground">{p.platform}</span>{" "}
                          {p.url ? <a href={p.url} target="_blank" rel="noreferrer" className="text-brand hover:underline" onClick={(e) => e.stopPropagation()}>{p.handle ? `@${p.handle}` : "link"}</a> : p.handle ? `@${p.handle}` : ""}
                          {p.followers ? <span className="text-muted-foreground"> · {compact(p.followers)}</span> : null}
                        </div>
                      ))}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <span className="font-medium">{compact(inf.followers)}</span>
                      {(() => {
                        const er = (inf.platforms || []).find((p) => p.engagementRate)?.engagementRate;
                        return er ? <div className="text-xs text-muted-foreground">{er}% ER</div> : null;
                      })()}
                    </TableCell>
                    <TableCell className="text-xs max-w-[220px]"><div className="truncate">{(inf.niches || []).join(", ") || "—"}</div><div className="text-muted-foreground">{[inf.city, (inf.languages || []).join("/")].filter(Boolean).join(" · ")}</div></TableCell>
                    <TableCell className="text-right whitespace-nowrap text-sm">{Number.isFinite(minRate) ? `₹${minRate.toLocaleString("en-IN")}` : "—"}{inf.openToBarter && <div className="text-xs text-muted-foreground">barter OK</div>}</TableCell>
                    <TableCell className="text-xs">{inf.collabCount ? <><span className="font-medium">{inf.collabCount}</span>{inf.clients?.length ? <div className="text-muted-foreground truncate max-w-[160px]">{inf.clients.join(", ")}</div> : null}</> : <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell><Pill className={STATUS_STYLE[inf.status]}>{inf.status}</Pill></TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <RowActions items={[{ label: "Edit", icon: Edit, onClick: () => openEditor(inf) }, ...(isAdmin ? ["-", { label: "Delete", icon: Trash2, onClick: () => remove(inf), danger: true }] : [])]} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {data?.pages > 1 && (
        <div className="flex items-center justify-center gap-2 text-sm">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
          <span className="text-muted-foreground">Page {data.page} of {data.pages} · {data.total} influencers</span>
          <Button variant="outline" size="sm" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}

      <InfluencerEditor open={editing !== undefined} onOpenChange={(v) => !v && setEditing(undefined)} influencer={editing} owners={o.owners} onSaved={(inf) => (editing ? load() : navigate(`/crm/influencers/${inf._id}`))} />
      <ImportDialog open={importing} onOpenChange={setImporting} onDone={load} />
    </div>
  );
};

export default Influencers;
