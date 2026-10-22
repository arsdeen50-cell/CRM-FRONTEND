// Shared helpers for outreach, follow-ups and calendar links.

export const ACTIVITY_TYPES = ["Call", "Email", "WhatsApp", "Visit", "Meeting", "Instagram DM", "Note"];
export const ACTIVITY_OUTCOMES = ["Sent", "Replied", "No answer", "Left message", "Meeting booked", "Interested", "Not interested", "Wrong contact"];
export const COMPANY_NAME = "Trends of Media";

// Imports write these when a business doesn't publish an email/phone
export const isPlaceholderEmail = (email = "") => !email || /placeholder\.invalid$/i.test(email);
export const isPlaceholderPhone = (phone = "") => !phone || /^not public$/i.test(String(phone).trim());
export const realEmail = (client) => (isPlaceholderEmail(client?.email) ? "" : client.email);
export const realPhone = (client) => (isPlaceholderPhone(client?.phone) ? "" : client.phone);

// wa.me needs digits with country code; assume India (+91) for 10-digit numbers
export const whatsappNumber = (phone = "") => {
  const digits = String(phone).replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 11 && digits.startsWith("0")) return `91${digits.slice(1)}`;
  return digits;
};
export const telHref = (phone = "") => `tel:${String(phone).replace(/[^\d+]/g, "")}`;

// Fill {{placeholders}} from the lead + client + current user
export const templateVars = (lead, user) => {
  const client = (lead && typeof lead.clientId === "object" ? lead.clientId : null) || {};
  const contact = client.contactPerson || "";
  const named = contact && !/^(owner|marketing|founder|not identified|ask )/i.test(contact);
  return {
    brandName: client.brandName || lead?.clientName || "",
    contactPerson: contact,
    firstName: named ? contact.split(/\s+/)[0] : "there",
    industry: client.industry || "",
    location: client.location || "",
    website: (client.websiteLink || "").replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "") || "your website",
    gap: client.research?.gap || "a few quick wins on your site",
    angle: client.research?.angle || "",
    signal: client.research?.signal || "",
    myName: user?.fullname || "",
    company: COMPANY_NAME,
  };
};
export const fillTemplate = (text = "", vars = {}) =>
  String(text).replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => (vars[key] !== undefined && vars[key] !== "" ? vars[key] : `[${key}]`));

// "Add to Google Calendar" link for a follow-up
export const googleCalendarUrl = ({ title, details = "", start, durationMinutes = 30 }) => {
  const s = new Date(start);
  const e = new Date(s.getTime() + durationMinutes * 60000);
  const fmt = (d) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const params = new URLSearchParams({ action: "TEMPLATE", text: title, details, dates: `${fmt(s)}/${fmt(e)}` });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

// .ics file (works with Google Calendar, Outlook and Apple Calendar) for one or many follow-ups
export const buildIcs = (events) => {
  const fmt = (d) => new Date(d).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const esc = (s = "") => String(s).replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/[,;]/g, (m) => `\\${m}`);
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Trends of Media CRM//Follow-ups//EN"];
  for (const ev of events) {
    const start = new Date(ev.start);
    const end = new Date(start.getTime() + (ev.durationMinutes || 30) * 60000);
    lines.push("BEGIN:VEVENT", `UID:${ev.uid}@crm`, `DTSTAMP:${fmt(new Date())}`, `DTSTART:${fmt(start)}`, `DTEND:${fmt(end)}`, `SUMMARY:${esc(ev.title)}`, `DESCRIPTION:${esc(ev.details || "")}`, "END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
};
export const downloadFile = (filename, content, type = "text/plain") => {
  const blob = content instanceof Blob ? content : new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

// Follow-up date helpers: default reminder time is 10:00 local
export const followUpAt = (daysFromNow) => {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(10, 0, 0, 0);
  return d;
};
export const toDateInput = (d) => {
  if (!d) return "";
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
};
export const fromDateInput = (value) => (value ? new Date(`${value}T10:00:00`) : null);
export const formatDay = (d) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—");
export const daysAgo = (d) => {
  if (!d) return null;
  return Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
};

export const TIER_STYLES = {
  P1: "bg-red-100 text-red-700 border-red-200",
  P2: "bg-amber-100 text-amber-700 border-amber-200",
  P3: "bg-slate-100 text-slate-700 border-slate-200",
  Hold: "bg-gray-100 text-gray-500 border-gray-200",
};
