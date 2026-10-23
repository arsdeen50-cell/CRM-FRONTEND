import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Mail, MessageCircle, Phone, MapPin, Instagram, Copy, ExternalLink, CalendarPlus, AlertTriangle, Send } from "lucide-react";
import { useIntegrations } from "@/hooks/useIntegrations";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import axiosInstance from "@/utils/axiosConfig";
import {
  ACTIVITY_OUTCOMES,
  fillTemplate,
  templateVars,
  realEmail,
  realPhone,
  whatsappNumber,
  telHref,
  followUpAt,
  toDateInput,
  fromDateInput,
  googleCalendarUrl,
} from "@/lib/crmOutreach";

const CHANNELS = [
  { key: "Email", icon: Mail },
  { key: "WhatsApp", icon: MessageCircle },
  { key: "Call", icon: Phone },
  { key: "Visit", icon: MapPin },
  { key: "Instagram DM", icon: Instagram },
];

/* One-click outreach: pick a channel + template, open your own email / WhatsApp / phone with the
   message filled in (nothing is sent automatically), then log the outcome and the next follow-up. */
const QuickContactDialog = ({ open, onOpenChange, lead, onLogged }) => {
  const { user } = useSelector((s) => s.auth);
  const client = (lead && typeof lead.clientId === "object" ? lead.clientId : null) || {};
  const email = realEmail(client);
  const phone = realPhone(client);
  const instagram = client.instagramLink || "";

  const [templates, setTemplates] = useState([]);
  const [channel, setChannel] = useState("Email");
  const [templateId, setTemplateId] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [outcome, setOutcome] = useState("Sent");
  const [note, setNote] = useState("");
  const [nextDate, setNextDate] = useState(toDateInput(followUpAt(3)));
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const integrations = useIntegrations();
  const canSendEmail = channel === "Email" && integrations.email?.configured && !!email;
  const canSendWhatsApp = channel === "WhatsApp" && integrations.whatsapp?.configured && !!phone;

  const vars = useMemo(() => templateVars(lead, user), [lead, user]);
  const available = { Email: !!email, WhatsApp: !!phone, Call: !!phone, Visit: true, "Instagram DM": !!instagram };

  useEffect(() => {
    if (!open) return;
    axiosInstance
      .get("/v1/template")
      .then((res) => setTemplates(res.data?.templates || []))
      .catch(() => setTemplates([]));
    const first = CHANNELS.find((c) => available[c.key])?.key || "Visit";
    setChannel(first);
    setOutcome("Sent");
    setNote("");
    setNextDate(toDateInput(followUpAt(3)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, lead?._id]);

  const channelTemplates = templates.filter((t) => t.channel === channel || (channel === "Instagram DM" && t.channel === "WhatsApp"));
  useEffect(() => {
    const t = channelTemplates[0];
    setTemplateId(t?._id || "");
    setSubject(t ? fillTemplate(t.subject, vars) : "");
    setBody(t ? fillTemplate(t.body, vars) : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel, templates.length, vars]);

  const pickTemplate = (id) => {
    setTemplateId(id);
    const t = templates.find((x) => x._id === id);
    if (t) {
      setSubject(fillTemplate(t.subject, vars));
      setBody(fillTemplate(t.body, vars));
    }
  };

  const unfilled = /\[(\w+)\]/.test(`${subject} ${body}`);
  const copy = async () => {
    await navigator.clipboard.writeText(channel === "Email" && subject ? `${subject}\n\n${body}` : body);
    toast.success("Message copied");
  };
  const openChannel = () => {
    if (channel === "Email") window.open(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, "_self");
    if (channel === "WhatsApp") window.open(`https://wa.me/${whatsappNumber(phone)}?text=${encodeURIComponent(body)}`, "_blank", "noopener");
    if (channel === "Call") window.open(telHref(phone), "_self");
    if (channel === "Instagram DM") {
      navigator.clipboard.writeText(body).catch(() => {});
      window.open(instagram, "_blank", "noopener");
      toast.info("Message copied - paste it into the Instagram DM");
    }
    if (channel === "Visit") copy();
  };

  // Send directly from the CRM (server email / WhatsApp Business API). The server logs the activity itself.
  const sendNow = async () => {
    if (!lead?._id) return;
    if (/\[(\w+)\]/.test(`${subject} ${body}`) && !window.confirm("The message still has [bracketed] gaps. Send anyway?")) return;
    setSending(true);
    try {
      const nextFollowUpDate = nextDate ? fromDateInput(nextDate).toISOString() : "";
      const res =
        channel === "Email"
          ? await axiosInstance.post("/v1/messages/email", { leadId: lead._id, subject, body, nextFollowUpDate })
          : await axiosInstance.post("/v1/messages/whatsapp", { leadId: lead._id, text: body, nextFollowUpDate });
      toast.success(channel === "Email" ? `Email sent to ${email}` : "WhatsApp message sent");
      onLogged?.(res.data?.lead);
      onOpenChange(false);
    } catch (err) {
      const data = err.response?.data || {};
      toast.error(data.message || "Could not send", data.outsideWindow ? { description: "Use 'Open WhatsApp' to send from your phone, or an approved template via a sequence." } : undefined);
    } finally {
      setSending(false);
    }
  };

  const logIt = async () => {
    if (!lead?._id) return;
    setSaving(true);
    try {
      const res = await axiosInstance.post(`/v1/leadsource/${lead._id}/activity`, {
        type: channel,
        outcome,
        note: [note, templateId && `Template: ${templates.find((t) => t._id === templateId)?.name || ""}`].filter(Boolean).join(" · "),
        loggedBy: user?.fullname,
        nextFollowUpDate: nextDate ? fromDateInput(nextDate).toISOString() : "",
      });
      toast.success("Logged");
      onLogged?.(res.data?.lead);
      onOpenChange(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not log activity");
    } finally {
      setSaving(false);
    }
  };

  if (!lead) return null;
  const actionLabel = { Email: "Open in email app", WhatsApp: "Open WhatsApp", Call: `Call ${phone}`, Visit: "Copy visit note", "Instagram DM": "Copy & open Instagram" }[channel];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Contact {client.brandName || lead.clientName}</DialogTitle>
          <DialogDescription>
            {canSendEmail || canSendWhatsApp
              ? "Send it from the CRM (logged and tracked automatically), or open your own app with the message filled in."
              : "Opens your own email, WhatsApp or phone with the message filled in. Nothing is sent automatically."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-2">
          {CHANNELS.map(({ key, icon: Icon }) => (
            <Button
              key={key}
              type="button"
              size="sm"
              variant={channel === key ? "default" : "outline"}
              disabled={!available[key]}
              title={available[key] ? key : `No ${key === "Email" ? "email" : key === "Instagram DM" ? "Instagram" : "phone"} on file`}
              onClick={() => setChannel(key)}
            >
              <Icon className="h-4 w-4 mr-1" /> {key}
            </Button>
          ))}
        </div>
        <p className="text-xs text-gray-500">
          {email ? `Email: ${email}` : "No real email on file"} · {phone ? `Phone: ${phone}` : "No real phone on file"}
          {client.location ? ` · ${client.location}` : ""}
        </p>

        <div className="grid gap-3">
          <div className="grid gap-1">
            <Label>Template</Label>
            <Select value={templateId} onValueChange={pickTemplate}>
              <SelectTrigger>
                <SelectValue placeholder={channelTemplates.length ? "Pick a template" : "No templates for this channel - write your own"} />
              </SelectTrigger>
              <SelectContent>
                {channelTemplates.map((t) => (
                  <SelectItem key={t._id} value={t._id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {channel === "Email" && (
            <div className="grid gap-1">
              <Label>Subject</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>
          )}
          <div className="grid gap-1">
            <Label>{channel === "Call" || channel === "Visit" ? "Script" : "Message"}</Label>
            <Textarea rows={8} value={body} onChange={(e) => setBody(e.target.value)} />
            {unfilled && (
              <p className="text-xs text-amber-700 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> {"Replace the [bracketed] parts before sending - that information isn't on this lead yet."}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {(canSendEmail || canSendWhatsApp) && (
              <Button type="button" onClick={sendNow} disabled={sending || !body.trim() || (channel === "Email" && !subject.trim())} className="bg-emerald-600 hover:bg-emerald-700">
                <Send className="h-4 w-4 mr-1" /> {sending ? "Sending..." : channel === "Email" ? "Send from CRM" : "Send via WhatsApp API"}
              </Button>
            )}
            <Button type="button" variant={canSendEmail || canSendWhatsApp ? "outline" : "default"} onClick={openChannel} disabled={!available[channel]}>
              <ExternalLink className="h-4 w-4 mr-1" /> {actionLabel}
            </Button>
            <Button type="button" variant="outline" onClick={copy}>
              <Copy className="h-4 w-4 mr-1" /> Copy
            </Button>
          </div>
        </div>

        <div className="border-t pt-4 mt-2 grid gap-3">
          <p className="font-medium text-sm">Log this contact</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="grid gap-1">
              <Label>Outcome</Label>
              <Select value={outcome} onValueChange={setOutcome}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACTIVITY_OUTCOMES.map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1">
              <Label>Next follow-up</Label>
              <div className="flex gap-1">
                <Input type="date" value={nextDate} onChange={(e) => setNextDate(e.target.value)} />
                {[1, 3, 7].map((d) => (
                  <Button key={d} type="button" size="sm" variant="ghost" onClick={() => setNextDate(toDateInput(followUpAt(d)))}>
                    +{d}d
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <div className="grid gap-1">
            <Label>Note (optional)</Label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Spoke to manager, owner back on Monday" />
          </div>
          <div className="flex flex-wrap gap-2 justify-end">
            {nextDate && (
              <Button asChild type="button" variant="outline">
                <a
                  href={googleCalendarUrl({ title: `Follow up: ${client.brandName || lead.clientName}`, details: `${lead.series || ""} · ${channel}`, start: fromDateInput(nextDate) })}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <CalendarPlus className="h-4 w-4 mr-1" /> Add to Google Calendar
                </a>
              </Button>
            )}
            <Button type="button" onClick={logIt} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
              {saving ? "Saving..." : "Save to activity log"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuickContactDialog;
