// Shared pipeline-stage config (Change Request #1)
export const PIPELINE_STAGES = [
  "Lead",
  "Qualified",
  "Proposal Sent",
  "Negotiation",
  "Won",
  "Lost",
];

export const STAGE_COLORS = {
  Lead: "bg-slate-100 text-slate-700 border-slate-300",
  Qualified: "bg-blue-100 text-blue-700 border-blue-300",
  "Proposal Sent": "bg-purple-100 text-purple-700 border-purple-300",
  Negotiation: "bg-amber-100 text-amber-700 border-amber-300",
  Won: "bg-green-100 text-green-700 border-green-300",
  Lost: "bg-red-100 text-red-700 border-red-300",
};

export const formatCurrency = (value, currency = "INR") => {
  const amount = Number(value) || 0;
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency || "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency || ""} ${amount.toLocaleString()}`;
  }
};

export const isOverdue = (lead) => {
  if (!lead?.nextFollowUpDate) return false;
  if (["Won", "Lost"].includes(lead.pipelineStage)) return false;
  return new Date(lead.nextFollowUpDate) < new Date(new Date().setHours(0, 0, 0, 0));
};