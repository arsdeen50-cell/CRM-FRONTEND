import { SalesRoute } from "@/components/crm/AccessRoute";
import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CalendarClock, CalendarPlus, Download, PhoneCall, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import QuickContactDialog from "@/components/crm/QuickContactDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { STAGE_COLORS } from "@/hooks/Pipelineconstants";
import axiosInstance from "@/utils/axiosConfig";
import {
  TIER_STYLES,
  buildIcs,
  daysAgo,
  downloadFile,
  followUpAt,
  formatDay,
  fromDateInput,
  googleCalendarUrl,
  toDateInput,
} from "@/lib/crmOutreach";

const TABS = [
  { key: "overdue", label: "Overdue", empty: "Nothing overdue. Nice." },
  { key: "today", label: "Today", empty: "No follow-ups due today." },
  { key: "upcoming", label: "Next 7 days", empty: "Nothing scheduled this week." },
  { key: "later", label: "Later", empty: "Nothing scheduled further out." },
  { key: "unscheduled", label: "No date set", empty: "Every open lead has a follow-up date." },
];

const FollowUps = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [tab, setTab] = useState("overdue");
  const [loading, setLoading] = useState(false);
  const [contactLead, setContactLead] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/v1/leadsource/followups");
      setData(res.data);
      setTab((current) => (res.data.counts?.[current] ? current : TABS.find((t) => res.data.counts?.[t.key])?.key || current));
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not load follow-ups");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const reschedule = async (lead, date) => {
    try {
      await axiosInstance.patch(`/v1/leadsource/${lead._id}/followup`, { nextFollowUpDate: date ? date.toISOString() : "" });
      toast.success(date ? `Moved to ${formatDay(date)}` : "Follow-up cleared");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update");
    }
  };

  const rows = data?.[tab] || [];
  const exportIcs = () => {
    const scheduled = ["overdue", "today", "upcoming", "later"].flatMap((k) => data?.[k] || []);
    if (!scheduled.length) return toast.info("No scheduled follow-ups to export");
    const ics = buildIcs(
      scheduled.map((l) => ({
        uid: `${l._id}-${new Date(l.nextFollowUpDate).getTime()}`,
        title: `Follow up: ${l.clientId?.brandName || l.clientName}`,
        details: `${l.series || ""} · ${l.pipelineStage} · ${l.priority || ""}`,
        start: l.nextFollowUpDate,
      }))
    );
    downloadFile("follow-ups.ics", ics, "text/calendar");
  };

  return (
    <SalesRoute>
      <div className="p-4 md:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate("/crm")} title="Back to CRM">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl md:text-2xl font-semibold flex items-center gap-2">
                <CalendarClock className="h-6 w-6 text-brand" /> Follow-ups
              </h1>
              <p className="text-sm text-muted-foreground">Open leads by follow-up date. Contact, log the outcome and set the next date in one step.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportIcs} title="Download all scheduled follow-ups as a calendar file">
              <Download className="h-4 w-4 mr-1" /> Calendar (.ics)
            </Button>
            <Button variant="outline" onClick={load} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {TABS.map((t) => (
            <Card
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`cursor-pointer transition ${tab === t.key ? "ring-2 ring-brand" : "hover:bg-accent"}`}
            >
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">{t.label}</p>
                <p className={`text-2xl font-semibold ${t.key === "overdue" && data?.counts?.overdue ? "text-red-600" : ""}`}>{data?.counts?.[t.key] ?? "–"}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Last contact</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                      {loading ? "Loading..." : TABS.find((t) => t.key === tab)?.empty}
                    </TableCell>
                  </TableRow>
                )}
                {rows.map((lead) => {
                  const client = lead.clientId || {};
                  const tier = client.research?.tier;
                  const ago = daysAgo(lead.lastContactedAt);
                  return (
                    <TableRow key={lead._id}>
                      <TableCell>
                        <div className="font-medium">{client.brandName || lead.clientName || "—"}</div>
                        <div className="text-xs text-muted-foreground">{lead.series} · {client.industry || "—"}</div>
                      </TableCell>
                      <TableCell>
                        {tier ? <span className={`text-xs border rounded-full px-2 py-0.5 whitespace-nowrap ${TIER_STYLES[tier] || ""}`}>{tier}{client.research?.score ? ` · ${client.research.score}` : ""}</span> : "—"}
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs border rounded-full px-2 py-0.5 ${STAGE_COLORS[lead.pipelineStage] || ""}`}>{lead.pipelineStage}</span>
                      </TableCell>
                      <TableCell>{lead.priority || "—"}</TableCell>
                      <TableCell className={tab === "overdue" ? "text-red-600 font-medium" : ""}>{formatDay(lead.nextFollowUpDate)}</TableCell>
                      <TableCell className="text-sm">
                        {ago === null ? <span className="text-muted-foreground/70">Never</span> : `${ago === 0 ? "Today" : `${ago}d ago`}${lead.lastOutcome ? ` · ${lead.lastOutcome}` : ""}`}
                      </TableCell>
                      <TableCell className="text-sm">{lead.projectAccountHandledBy || "—"}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1 flex-wrap">
                          <Button size="sm" onClick={() => setContactLead(lead)} className="bg-primary hover:bg-primary/90">
                            <PhoneCall className="h-3 w-3 mr-1" /> Contact
                          </Button>
                          {[1, 3, 7].map((d) => (
                            <Button key={d} size="sm" variant="ghost" title={`Move to ${formatDay(followUpAt(d))}`} onClick={() => reschedule(lead, followUpAt(d))}>
                              +{d}d
                            </Button>
                          ))}
                          <Input
                            type="date"
                            className="h-8 w-36"
                            value={toDateInput(lead.nextFollowUpDate)}
                            onChange={(e) => reschedule(lead, fromDateInput(e.target.value))}
                            title="Pick a follow-up date"
                          />
                          {lead.nextFollowUpDate && (
                            <Button asChild size="icon" variant="ghost" title="Add to Google Calendar">
                              <a
                                href={googleCalendarUrl({ title: `Follow up: ${client.brandName || lead.clientName}`, details: lead.series || "", start: lead.nextFollowUpDate })}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <CalendarPlus className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <QuickContactDialog
          open={!!contactLead}
          onOpenChange={(o) => !o && setContactLead(null)}
          lead={contactLead}
          onLogged={() => load()}
        />
      </div>
    </SalesRoute>
  );
};

export default FollowUps;
