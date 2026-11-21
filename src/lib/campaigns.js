// Shared bits for influencer campaign pages (CRM and the public client report)
export const CAMPAIGN_STATUS_STYLE = { Planning: "bg-slate-100 text-slate-700", Live: "bg-violet-100 text-violet-800", Completed: "bg-green-100 text-green-700", Cancelled: "bg-gray-100 text-gray-500" };
export const ENTRY_STATUS_STYLE = {
  Shortlisted: "bg-slate-100 text-slate-700",
  Contacted: "bg-sky-100 text-sky-800",
  Confirmed: "bg-indigo-100 text-indigo-800",
  "Content in review": "bg-amber-100 text-amber-800",
  Posted: "bg-green-100 text-green-700",
  Paid: "bg-emerald-100 text-emerald-800",
  Dropped: "bg-gray-100 text-gray-500",
};
export const METRICS = [
  ["views", "Views"],
  ["reach", "Reach"],
  ["impressions", "Impressions"],
  ["likes", "Likes"],
  ["comments", "Comments"],
  ["shares", "Shares"],
  ["saves", "Saves"],
  ["clicks", "Link clicks"],
];
export const compactNum = (n) => {
  const v = Number(n) || 0;
  if (!v) return "0";
  if (v >= 1e7) return `${(v / 1e7).toFixed(1).replace(/\.0$/, "")}Cr`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(1).replace(/\.0$/, "")}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(v >= 1e4 ? 0 : 1).replace(/\.0$/, "")}K`;
  return String(Math.round(v));
};
export const inr = (n) => `₹${Math.round(Number(n) || 0).toLocaleString("en-IN")}`;
export const dateRange = (a, b) => {
  const f = (d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  if (!a && !b) return "";
  if (a && b) return `${f(a)} – ${f(b)}`;
  return a ? `From ${f(a)}` : `Until ${f(b)}`;
};
export const entryEngagement = (m = {}) => (Number(m.likes) || 0) + (Number(m.comments) || 0) + (Number(m.shares) || 0) + (Number(m.saves) || 0);
