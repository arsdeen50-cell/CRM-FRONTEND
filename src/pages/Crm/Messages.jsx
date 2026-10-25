import { OutreachRoute } from "@/components/crm/AccessRoute";
import React, { useCallback, useEffect, useState } from "react";
import { Inbox, RefreshCw, Eye, MousePointerClick } from "lucide-react";
import { toast } from "sonner";
import PageHeader, { Stat, Pill } from "@/components/crm/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import axiosInstance from "@/utils/axiosConfig";
import { errMsg } from "@/lib/publicApi";
import { useIntegrations } from "@/hooks/useIntegrations";

const when = (d) => (d ? new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—");

const Messages = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const integrations = useIntegrations();
  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData((await axiosInstance.get("/v1/messages")).data);
    } catch (err) {
      toast.error(errMsg(err, "Could not load messages"));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  const s = data?.stats || {};
  const rate = (n) => (s.emailsSent ? `${Math.round((n / s.emailsSent) * 100)}%` : "—");

  return (
    <OutreachRoute>
      <div className="p-4 md:p-6 space-y-4">
        <PageHeader icon={Inbox} title="Messages" subtitle="Emails and WhatsApp messages sent from the CRM, with opens, clicks and replies.">
          <Button variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </PageHeader>
        {integrations.email && (!integrations.email.configured || !integrations.whatsapp?.configured) && (
          <p className="text-sm bg-amber-50 border border-amber-200 text-amber-800 rounded-md p-3">
            {!integrations.email.configured && "Sending email from the CRM is off (EMAIL / EMAIL_PASSWORD not set on the server). "}
            {!integrations.whatsapp?.configured && "WhatsApp Business API isn't connected yet, so WhatsApp opens on your phone instead. "}
            See CRM → Integrations.
          </p>
        )}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <Stat label="Emails sent" value={s.emailsSent ?? "–"} sub={s.failed ? `${s.failed} failed` : undefined} />
          <Stat label="Opened" value={rate(s.opened || 0)} sub={`${s.opened || 0} emails`} />
          <Stat label="Clicked" value={rate(s.clicked || 0)} sub={`${s.clicked || 0} emails`} />
          <Stat label="WhatsApp sent" value={s.whatsappOut ?? "–"} />
          <Stat label="WhatsApp replies" value={s.whatsappIn ?? "–"} sub={s.unread ? `${s.unread} unread` : undefined} tone={s.unread ? "bad" : undefined} />
        </div>
        <Tabs defaultValue="email">
          <TabsList>
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
          </TabsList>
          <TabsContent value="email">
            <Card>
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sent</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>By</TableHead>
                      <TableHead>Tracking</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data?.emails || []).length === 0 && (
                      <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">{loading ? "Loading..." : "No emails sent from the CRM yet."}</TableCell></TableRow>
                    )}
                    {(data?.emails || []).map((e) => (
                      <TableRow key={e._id}>
                        <TableCell className="whitespace-nowrap text-sm">{when(e.createdAt)}</TableCell>
                        <TableCell>{e.clientName}<div className="text-xs text-muted-foreground">{e.to}</div></TableCell>
                        <TableCell className="max-w-xs truncate" title={e.subject}>{e.subject}{e.source !== "manual" && <span className="text-xs text-muted-foreground/70"> · {e.source}</span>}</TableCell>
                        <TableCell className="text-sm">{e.sentBy}</TableCell>
                        <TableCell>
                          {e.status === "Failed" ? (
                            <Pill className="bg-red-100 text-red-700">Failed</Pill>
                          ) : (
                            <div className="flex gap-3 text-xs">
                              <span className={`flex items-center gap-1 ${e.openCount ? "text-green-700" : "text-muted-foreground/70"}`}><Eye className="h-3 w-3" />{e.openCount ? `${e.openCount}× · ${when(e.lastOpenedAt)}` : "No"}</span>
                              <span className={`flex items-center gap-1 ${e.clicks?.length ? "text-green-700" : "text-muted-foreground/70"}`}><MousePointerClick className="h-3 w-3" />{e.clicks?.length || 0}</span>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="whatsapp">
            <Card>
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>When</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead></TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data?.whatsapp || []).length === 0 && (
                      <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">{loading ? "Loading..." : "No WhatsApp API messages yet."}</TableCell></TableRow>
                    )}
                    {(data?.whatsapp || []).map((w) => (
                      <TableRow key={w._id} className={w.direction === "in" && !w.readByTeam ? "bg-brand-soft" : ""}>
                        <TableCell className="whitespace-nowrap text-sm">{when(w.createdAt)}</TableCell>
                        <TableCell>{w.clientName}<div className="text-xs text-muted-foreground">+{w.phone}</div></TableCell>
                        <TableCell><Pill className={w.direction === "in" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"}>{w.direction === "in" ? "Received" : "Sent"}</Pill></TableCell>
                        <TableCell className="max-w-md whitespace-pre-wrap text-sm">{w.text}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{w.status}{w.error ? `: ${w.error}` : ""}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </OutreachRoute>
  );
};

export default Messages;
