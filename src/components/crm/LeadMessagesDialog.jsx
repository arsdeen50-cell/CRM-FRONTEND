import React, { useEffect, useState } from "react";
import { Mail, MessageCircle, Eye, MousePointerClick, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import axiosInstance from "@/utils/axiosConfig";
import { errMsg } from "@/lib/publicApi";

const when = (d) => new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

/* Every email and WhatsApp message with this lead, oldest first, with open / click tracking for emails. */
const LeadMessagesDialog = ({ open, onOpenChange, lead }) => {
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!open || !lead?._id) return;
    setItems(null);
    setError("");
    axiosInstance
      .get(`/v1/messages/lead/${lead._id}`)
      .then((res) => setItems(res.data.items || []))
      .catch((err) => setError(errMsg(err, "Could not load messages")));
  }, [open, lead?._id]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Messages · {lead?.clientId?.brandName || lead?.clientName}</DialogTitle>
          <DialogDescription>Emails and WhatsApp messages sent from or received by the CRM.</DialogDescription>
        </DialogHeader>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {!items && !error && <p className="text-sm text-muted-foreground">Loading...</p>}
        {items?.length === 0 && <p className="text-sm text-muted-foreground py-6 text-center">No messages yet. Use Contact to send one from the CRM.</p>}
        <div className="space-y-3">
          {items?.map((m) => {
            const inbound = m.direction === "in";
            return (
              <div key={m._id} className={`flex ${inbound ? "justify-start" : "justify-end"}`}>
                <div className={`max-w-[85%] rounded-lg border p-3 text-sm ${inbound ? "bg-white dark:bg-slate-800" : m.kind === "email" ? "bg-brand-soft border-brand/20" : "bg-brand-soft border-emerald-200"}`}>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    {m.kind === "email" ? <Mail className="h-3 w-3" /> : <MessageCircle className="h-3 w-3" />}
                    <span>{inbound ? m.profileName || "Client" : m.sentBy || "You"}</span>
                    <span>· {when(m.createdAt)}</span>
                    {m.source && m.source !== "manual" && <span>· {m.source}</span>}
                  </div>
                  {m.kind === "email" && <p className="font-medium">{m.subject}</p>}
                  <p className="whitespace-pre-wrap">{m.kind === "email" ? m.body : m.text}</p>
                  <div className="flex flex-wrap gap-3 mt-2 text-xs">
                    {m.kind === "email" && m.status === "Failed" && (
                      <span className="text-red-600 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Failed: {m.error}</span>
                    )}
                    {m.kind === "email" && m.status === "Sent" && (
                      <>
                        <span className={`flex items-center gap-1 ${m.openCount ? "text-green-700" : "text-muted-foreground"}`}>
                          <Eye className="h-3 w-3" /> {m.openCount ? `Opened ${m.openCount}× · last ${when(m.lastOpenedAt)}` : "Not opened yet"}
                        </span>
                        {m.clicks?.length > 0 && (
                          <span className="flex items-center gap-1 text-green-700" title={m.clicks.map((c) => c.url).join("\n")}>
                            <MousePointerClick className="h-3 w-3" /> {m.clicks.length} click{m.clicks.length > 1 ? "s" : ""}
                          </span>
                        )}
                      </>
                    )}
                    {m.kind === "whatsapp" && !inbound && m.status && <span className={m.status === "failed" ? "text-red-600" : "text-muted-foreground"}>{m.status}{m.error ? `: ${m.error}` : ""}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {items?.some((m) => m.kind === "email") && (
          <p className="text-xs text-muted-foreground/70">Opens are approximate: some email apps load images automatically (counts an open) or block them (no open recorded).</p>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LeadMessagesDialog;
