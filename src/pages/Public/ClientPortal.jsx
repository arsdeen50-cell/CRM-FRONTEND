import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { portalApi, money, day, errMsg } from "@/lib/publicApi";
import { downloadFile } from "@/lib/crmOutreach";
import { alertDialog } from "@/components/ui/app-dialogs";

const STATUS = {
  "Client Review": "bg-purple-100 text-purple-700",
  "Changes Requested": "bg-red-100 text-red-700",
  Approved: "bg-green-100 text-green-700",
  Scheduled: "bg-teal-100 text-teal-700",
  Published: "bg-emerald-600 text-white",
  Planning: "bg-slate-100 text-slate-700",
  "In Progress": "bg-blue-100 text-brand",
  "On Hold": "bg-amber-100 text-amber-800",
  Completed: "bg-green-100 text-green-700",
  Sent: "bg-blue-100 text-brand",
  "Partially Paid": "bg-amber-100 text-amber-800",
  Paid: "bg-green-100 text-green-700",
  Accepted: "bg-green-100 text-green-700",
};
const Pill = ({ s }) => <span className={`text-xs rounded-full px-2 py-0.5 whitespace-nowrap ${STATUS[s] || "bg-gray-100 text-muted-foreground"}`}>{s}</span>;
const isImage = (url = "") => /\.(png|jpe?g|gif|webp)(\?|$)/i.test(url) || /res\.cloudinary\.com\/.+\/image\//.test(url);

const ContentCard = ({ item, api, onChange }) => {
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const waiting = ["Client Review", "Changes Requested"].includes(item.status);
  const act = async (path, body) => {
    setBusy(true);
    try {
      const r = await api.post(`/content/${item._id}/${path}`, body);
      onChange(r.data.item);
      setComment("");
    } catch (err) {
      await alertDialog(errMsg(err));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className={`border rounded-lg p-4 bg-white ${waiting ? "border-purple-300" : ""}`}>
      <div className="flex justify-between gap-2">
        <div><p className="font-medium">{item.title}</p><p className="text-xs text-muted-foreground">{item.platform} {item.type} · {day(item.scheduledDate)}</p></div>
        <Pill s={item.status} />
      </div>
      {item.assets?.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {item.assets.map((a, i) => (isImage(a.url) ? <a key={i} href={a.url} target="_blank" rel="noreferrer"><img src={a.url} alt={a.name} className="h-28 rounded border object-cover" /></a> : <a key={i} href={a.url} target="_blank" rel="noreferrer" className="text-sm text-brand underline">{a.name}</a>))}
        </div>
      )}
      {item.caption && <p className="text-sm whitespace-pre-wrap mt-3 bg-gray-50 rounded p-2">{item.caption}</p>}
      {item.publishedUrl && <a href={item.publishedUrl} target="_blank" rel="noreferrer" className="text-sm text-brand underline block mt-2">View live post</a>}
      {item.comments?.length > 0 && <div className="mt-3 space-y-1">{item.comments.slice(-4).map((c, i) => <p key={i} className="text-xs text-muted-foreground"><b>{c.by}</b>: {c.text}</p>)}</div>}
      <div className="mt-3 flex flex-wrap gap-2">
        <input className="flex-1 min-w-[180px] border rounded-md px-2 py-1.5 text-sm" placeholder={waiting ? "What should we change? (or a comment)" : "Add a comment"} value={comment} onChange={(e) => setComment(e.target.value)} />
        {waiting && <button disabled={busy} onClick={() => act("approve", { comment })} className="bg-green-600 text-white text-sm rounded-md px-3 py-1.5 disabled:opacity-50">Approve</button>}
        {waiting && <button disabled={busy || !comment.trim()} onClick={() => act("request-changes", { comment })} className="border text-sm rounded-md px-3 py-1.5 disabled:opacity-50">Request changes</button>}
        {!waiting && <button disabled={busy || !comment.trim()} onClick={() => act("comments", { text: comment })} className="border text-sm rounded-md px-3 py-1.5 disabled:opacity-50">Comment</button>}
      </div>
    </div>
  );
};

const ClientPortal = () => {
  const { token } = useParams();
  const api = useMemo(() => portalApi(token), [token]);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("review");
  const load = useCallback(() => api.get("/overview").then((r) => setData(r.data)).catch((e) => setError(errMsg(e, "This link isn't valid"))), [api]);
  useEffect(() => {
    load();
  }, [load]);
  if (!data) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-muted-foreground p-4">{error || "Loading your portal..."}</div>;
  const review = data.content.filter((c) => ["Client Review", "Changes Requested"].includes(c.status));
  const calendar = data.content.filter((c) => !["Client Review", "Changes Requested"].includes(c.status));
  const due = data.invoices.filter((i) => i.balance > 0);
  const update = (item) => setData((d) => ({ ...d, content: d.content.map((c) => (c._id === item._id ? item : c)) }));
  const pdf = async (inv) => {
    const r = await api.get(`/invoices/${inv._id}/pdf`, { responseType: "blob" }).catch(() => null);
    if (r) downloadFile(`${inv.invoiceNo}.pdf`, r.data);
  };
  const tabs = [["review", `To approve${review.length ? ` (${review.length})` : ""}`], ["calendar", "Content"], ["projects", "Projects"], ["invoices", `Invoices${due.length ? ` (${due.length} due)` : ""}`], ["files", "Files"]];
  return (
    <div className="min-h-screen bg-gray-100 text-gray-900" style={{ colorScheme: "light" }}>
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-5">
          <p className="text-sm text-muted-foreground">{data.company} client portal</p>
          <h1 className="text-2xl font-semibold">{data.client.brandName}</h1>
          {data.accountManager && <p className="text-sm text-muted-foreground mt-1">Your account manager: {data.accountManager.name}{data.accountManager.email ? <> · <a className="text-brand" href={`mailto:${data.accountManager.email}`}>{data.accountManager.email}</a></> : null}</p>}
          <div className="flex gap-1 mt-4 overflow-x-auto">{tabs.map(([k, l]) => <button key={k} onClick={() => setTab(k)} className={`text-sm px-3 py-1.5 rounded-md whitespace-nowrap ${tab === k ? "bg-gray-900 text-white" : "text-muted-foreground hover:bg-gray-100"}`}>{l}</button>)}</div>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-3">
        {tab === "review" && (review.length ? review.map((c) => <ContentCard key={c._id} item={c} api={api} onChange={update} />) : <p className="text-muted-foreground">Nothing waiting for your approval right now.</p>)}
        {tab === "calendar" && (calendar.length ? calendar.map((c) => <ContentCard key={c._id} item={c} api={api} onChange={update} />) : <p className="text-muted-foreground">No approved or scheduled content yet.</p>)}
        {tab === "projects" && (data.projects.length ? data.projects.map((p) => (
          <div key={p._id} className="bg-white border rounded-lg p-4 flex justify-between gap-2">
            <div><p className="font-medium">{p.name}</p><p className="text-xs text-muted-foreground">{p.projectNo} · {(p.services || []).join(", ")}</p><p className="text-xs text-muted-foreground">Started {day(p.startDate)}{p.dueDate ? ` · due ${day(p.dueDate)}` : ""}</p></div>
            <Pill s={p.status} />
          </div>
        )) : <p className="text-muted-foreground">No projects yet.</p>)}
        {tab === "invoices" && (
          <>
            {data.invoices.length === 0 && <p className="text-muted-foreground">No invoices yet.</p>}
            {data.invoices.map((i) => (
              <div key={i._id} className="bg-white border rounded-lg p-4 flex flex-wrap items-center justify-between gap-3">
                <div><p className="font-medium">{i.invoiceNo}</p><p className="text-xs text-muted-foreground">{day(i.issueDate)} · due {day(i.dueDate)}</p></div>
                <div className="text-right"><p className="font-medium">{money(i.total)}</p>{i.balance > 0 && <p className={`text-xs ${i.isOverdue ? "text-red-600" : "text-muted-foreground"}`}>{money(i.balance)} due{i.isOverdue ? " (overdue)" : ""}</p>}</div>
                <div className="flex items-center gap-2">
                  <Pill s={i.isOverdue ? "Overdue" : i.status} />
                  <button onClick={() => pdf(i)} className="text-sm border rounded-md px-3 py-1.5">PDF</button>
                  {i.payUrl ? <a href={i.payUrl} className="text-sm bg-blue-600 text-white rounded-md px-3 py-1.5">Pay now</a> : i.balance > 0 && i.viewUrl ? <a href={i.viewUrl} className="text-sm border rounded-md px-3 py-1.5">How to pay</a> : null}
                </div>
              </div>
            ))}
            {data.proposals.length > 0 && <p className="font-medium pt-4">Proposals</p>}
            {data.proposals.map((p) => <a key={p.proposalNo} href={p.url} className="block bg-white border rounded-lg p-4"><span className="font-medium">{p.title}</span> <span className="text-sm text-muted-foreground">· {p.proposalNo} · {money(p.total)}</span> <Pill s={p.status} /></a>)}
          </>
        )}
        {tab === "files" && (data.files.length ? (
          <div className="bg-white border rounded-lg divide-y">{data.files.map((f, i) => <a key={i} href={f.url} target="_blank" rel="noreferrer" className="flex justify-between p-3 text-sm hover:bg-gray-50"><span className="text-brand truncate">{f.name}</span><span className="text-muted-foreground text-xs whitespace-nowrap ml-2">{f.source} · {day(f.at)}</span></a>)}</div>
        ) : <p className="text-muted-foreground">No shared files yet.</p>)}
      </div>
    </div>
  );
};

export default ClientPortal;
