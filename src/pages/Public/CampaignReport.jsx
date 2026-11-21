import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { publicApi, errMsg } from "@/lib/publicApi";
import { METRICS, compactNum, dateRange, entryEngagement, inr } from "@/lib/campaigns";

const Kpi = ({ label, value, sub }) => (
  <div className="rounded-xl border border-gray-200 bg-white p-4">
    <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
    <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
    {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
  </div>
);

const STATUS_STYLE = { Posted: "bg-green-50 text-green-700", "In production": "bg-amber-50 text-amber-700", Confirmed: "bg-indigo-50 text-indigo-700", Planned: "bg-gray-100 text-gray-600" };

/* Read-only influencer campaign report for the client (or as a case study). No login; no influencer contacts. */
const CampaignReport = () => {
  const { token } = useParams();
  const [c, setC] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    publicApi.get(`/campaign/${token}`).then((r) => setC(r.data.campaign)).catch((e) => setError(errMsg(e, "This campaign report isn't available")));
  }, [token]);
  useEffect(() => {
    if (c) document.title = `${c.name} · ${c.clientName} · Campaign report`;
  }, [c]);
  if (!c) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500 p-4" style={{ colorScheme: "light" }}>{error || "Loading report..."}</div>;

  const t = c.totals || {};
  const kpis = [
    ["Creators", t.influencers, t.followers ? `${compactNum(t.followers)} combined followers` : undefined],
    ["Posts", t.posts || t.posted, undefined],
    ["Views", compactNum(t.views), t.reach ? `${compactNum(t.reach)} reach` : undefined],
    ["Engagements", compactNum(t.engagements), t.engagementRate ? `${t.engagementRate}% engagement rate` : undefined],
  ];
  if (t.spend !== undefined) kpis.push(["Spend", inr(t.spend), t.costPerView ? `₹${t.costPerView} per view` : undefined]);
  const hasMetrics = (e) => METRICS.some(([k]) => e.metrics?.[k]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 print:bg-white" style={{ colorScheme: "light" }}>
      <div className="mx-auto max-w-5xl px-4 py-8 md:py-12 space-y-8">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-lg font-bold">{c.company?.name}</p>
            {c.company?.tagline && <p className="text-sm text-gray-500">{c.company.tagline}</p>}
          </div>
          <button onClick={() => window.print()} className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 print:hidden">Save as PDF</button>
        </header>

        <section className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-wide text-gray-500">Influencer campaign report · {c.clientName}</p>
          <h1 className="text-3xl md:text-4xl font-bold leading-tight">{c.name}</h1>
          <p className="text-gray-600">{[dateRange(c.startDate, c.endDate), c.objective, (c.platforms || []).join(", ")].filter(Boolean).join(" · ")}</p>
          {(c.hashtags || []).length > 0 && <p className="text-sm font-medium text-indigo-700">{c.hashtags.join(" ")}</p>}
        </section>

        <section className={`grid gap-3 grid-cols-2 ${kpis.length === 5 ? "md:grid-cols-5" : "md:grid-cols-4"}`}>
          {kpis.map(([label, value, sub]) => <Kpi key={label} label={label} value={value ?? 0} sub={sub} />)}
        </section>

        {(c.brief || c.resultsSummary || c.budget) && (
          <section className="grid gap-4 md:grid-cols-2">
            {c.brief && <div className="rounded-xl border border-gray-200 bg-white p-5"><h2 className="font-semibold mb-2">The brief</h2><p className="whitespace-pre-wrap text-gray-700 text-sm leading-relaxed">{c.brief}</p></div>}
            {(c.resultsSummary || c.budget) && (
              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <h2 className="font-semibold mb-2">Results</h2>
                {c.resultsSummary && <p className="whitespace-pre-wrap text-gray-700 text-sm leading-relaxed">{c.resultsSummary}</p>}
                {c.budget ? <p className="text-sm text-gray-500 mt-2">Budget: {inr(c.budget)}</p> : null}
              </div>
            )}
          </section>
        )}

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">The creators</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {(c.entries || []).map((e, i) => {
              const eng = entryEngagement(e.metrics);
              const base = e.metrics?.reach || e.metrics?.views;
              return (
                <div key={i} className={`rounded-xl border bg-white p-4 space-y-3 break-inside-avoid ${e.featured ? "border-amber-300 ring-1 ring-amber-200" : "border-gray-200"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{e.name}</p>
                      <p className="text-sm text-gray-500">
                        {e.platform}
                        {e.handle && <> · {e.profileUrl ? <a href={e.profileUrl} target="_blank" rel="noreferrer" className="text-indigo-700 hover:underline">@{e.handle}</a> : `@${e.handle}`}</>}
                        {e.followers ? ` · ${compactNum(e.followers)} followers` : ""}
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${STATUS_STYLE[e.status] || STATUS_STYLE.Planned}`}>{e.featured ? "★ " : ""}{e.status}</span>
                  </div>
                  {(e.deliverables || e.postDate || e.fee !== undefined) && (
                    <p className="text-sm text-gray-600">{[e.deliverables, e.postDate && new Date(e.postDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }), e.fee !== undefined && (e.barter ? "Barter" : e.fee ? inr(e.fee) : "")].filter(Boolean).join(" · ")}</p>
                  )}
                  {hasMetrics(e) && (
                    <div className="grid grid-cols-4 gap-2 text-center">
                      {[["Views", e.metrics.views], ["Reach", e.metrics.reach], ["Engagement", eng], ["Rate", base && eng ? `${Math.round((eng / base) * 1000) / 10}%` : ""]].map(([l, v]) => (
                        <div key={l} className="rounded-lg bg-gray-50 p-2"><p className="font-semibold text-sm">{typeof v === "number" ? (v ? compactNum(v) : "—") : v || "—"}</p><p className="text-[11px] text-gray-500">{l}</p></div>
                      ))}
                    </div>
                  )}
                  {(e.links || []).length > 0 && (
                    <div className="flex flex-wrap gap-2 print:hidden">
                      {e.links.map((l, j) => <a key={j} href={l} target="_blank" rel="noreferrer" className="rounded-md border border-gray-200 px-2.5 py-1 text-xs text-indigo-700 hover:bg-indigo-50">View post{e.links.length > 1 ? ` ${j + 1}` : ""} ↗</a>)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <footer className="border-t border-gray-200 pt-4 text-xs text-gray-500 flex flex-wrap justify-between gap-2">
          <span>{c.company?.name}{c.company?.email ? ` · ${c.company.email}` : ""}{c.company?.phone ? ` · ${c.company.phone}` : ""}</span>
          <span>Results as reported by the creators and platforms · updated {new Date(c.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
        </footer>
      </div>
    </div>
  );
};

export default CampaignReport;
