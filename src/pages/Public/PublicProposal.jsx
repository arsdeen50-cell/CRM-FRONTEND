import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { publicApi, money, day, errMsg } from "@/lib/publicApi";
import { backend_url } from "@/constants";

// Signature pad: draws with mouse / finger, exports a PNG data URL
const SignaturePad = ({ onChange }) => {
  const ref = useRef(null);
  const drawing = useRef(false);
  const dirty = useRef(false);
  useEffect(() => {
    const c = ref.current;
    const ratio = window.devicePixelRatio || 1;
    c.width = c.offsetWidth * ratio;
    c.height = c.offsetHeight * ratio;
    const ctx = c.getContext("2d");
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#111827";
  }, []);
  const pos = (e) => {
    const r = ref.current.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  };
  const down = (e) => {
    drawing.current = true;
    ref.current.setPointerCapture(e.pointerId);
    const ctx = ref.current.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(...pos(e));
  };
  const move = (e) => {
    if (!drawing.current) return;
    const ctx = ref.current.getContext("2d");
    ctx.lineTo(...pos(e));
    ctx.stroke();
    dirty.current = true;
  };
  const up = () => {
    drawing.current = false;
    if (dirty.current) onChange(ref.current.toDataURL("image/png"));
  };
  const clear = () => {
    const c = ref.current;
    c.getContext("2d").clearRect(0, 0, c.width, c.height);
    dirty.current = false;
    onChange("");
  };
  return (
    <div>
      <canvas ref={ref} className="w-full h-32 border border-dashed border-gray-400 rounded-md bg-white touch-none" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up} />
      <button type="button" onClick={clear} className="text-xs text-muted-foreground underline mt-1">Clear signature</button>
    </div>
  );
};

const PublicProposal = () => {
  const { token } = useParams();
  const [p, setP] = useState(null);
  const [error, setError] = useState("");
  const [sign, setSign] = useState({ name: "", title: "", email: "", agree: false, signature: "" });
  const [state, setState] = useState("idle");
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState("");
  useEffect(() => {
    publicApi.get(`/proposal/${token}`).then((r) => setP(r.data.proposal)).catch((e) => setError(errMsg(e, "Proposal not found")));
  }, [token]);
  const accept = async (e) => {
    e.preventDefault();
    setState("sending");
    setError("");
    try {
      const r = await publicApi.post(`/proposal/${token}/accept`, sign);
      setP((x) => ({ ...x, ...r.data.proposal }));
      setState("idle");
    } catch (err) {
      setError(errMsg(err));
      setState("idle");
    }
  };
  const decline = async () => {
    try {
      await publicApi.post(`/proposal/${token}/decline`, { reason });
      setP((x) => ({ ...x, status: "Rejected" }));
      setDeclining(false);
    } catch (err) {
      setError(errMsg(err));
    }
  };
  if (!p) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-muted-foreground p-4">{error || "Loading proposal..."}</div>;
  const cur = p.currency;
  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 text-gray-900" style={{ colorScheme: "light" }}>
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border p-6 md:p-10 space-y-6">
        <div className="flex flex-wrap justify-between gap-4">
          <div>
            <p className="text-2xl font-bold">{p.company?.name}</p>
            <p className="text-sm text-muted-foreground">{p.company?.tagline}</p>
            <p className="text-xs text-muted-foreground mt-1">{[p.company?.address, p.company?.email, p.company?.phone].filter(Boolean).join(" · ")}</p>
          </div>
          <div className="text-right text-sm">
            <p className="text-lg font-semibold">Proposal {p.proposalNo}</p>
            <p>Date: {day(p.createdAt)}</p>
            <p>Valid until: {day(p.validUntil)}</p>
          </div>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Prepared for</p>
          <p className="font-semibold text-lg">{p.clientName}</p>
          {p.contactPerson && <p className="text-sm">{p.contactPerson}</p>}
        </div>
        <div>
          <h1 className="text-xl font-semibold">{p.title}</h1>
          {p.intro && <p className="text-gray-700 mt-2 whitespace-pre-wrap">{p.intro}</p>}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 text-left"><th className="p-2">Service</th><th className="p-2 text-right">Qty</th><th className="p-2 text-right">Rate</th><th className="p-2 text-right">Amount</th></tr></thead>
            <tbody>
              {p.items.map((it, i) => (
                <tr key={i} className="border-b">
                  <td className="p-2"><p className="font-medium">{it.service}</p>{it.description && <p className="text-xs text-muted-foreground">{it.description}</p>}</td>
                  <td className="p-2 text-right whitespace-nowrap">{it.quantity} {it.unit}</td>
                  <td className="p-2 text-right whitespace-nowrap">{money(it.rate, cur)}</td>
                  <td className="p-2 text-right whitespace-nowrap">{money(it.quantity * it.rate, cur)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="ml-auto w-full sm:w-72 text-sm space-y-1">
          <div className="flex justify-between"><span>Subtotal</span><span>{money(p.subtotal, cur)}</span></div>
          {p.discount > 0 && <div className="flex justify-between"><span>Discount</span><span>- {money(p.discount, cur)}</span></div>}
          <div className="flex justify-between"><span>GST ({p.taxPercent}%)</span><span>{money(p.tax, cur)}</span></div>
          <div className="flex justify-between font-semibold text-base border-t pt-1"><span>Total</span><span>{money(p.total, cur)}</span></div>
        </div>
        {p.terms && <div><p className="font-semibold text-sm">Terms</p><p className="text-sm text-muted-foreground whitespace-pre-wrap">{p.terms}</p></div>}
        <a href={`${backend_url}/v1/public/proposal/${token}/pdf`} target="_blank" rel="noreferrer" className="inline-block text-sm text-brand underline">Download PDF</a>

        {p.status === "Accepted" && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4 text-green-800">
            Accepted{p.signature ? ` by ${p.signature.name}${p.signature.title ? `, ${p.signature.title}` : ""} on ${new Date(p.signature.signedAt).toLocaleString("en-IN")}` : ""}. Thank you - we'll be in touch to kick off.
          </div>
        )}
        {p.status === "Rejected" && <div className="bg-gray-50 border rounded-md p-4 text-gray-700">This proposal was declined. If anything changes, just reply to our email.</div>}
        {p.status === "Sent" && p.expired && <div className="bg-amber-50 border border-amber-200 rounded-md p-4 text-amber-800">This proposal has expired. Please contact us for an updated version.</div>}
        {p.status === "Sent" && !p.expired && (
          <form onSubmit={accept} className="border-t pt-6 space-y-3">
            <p className="font-semibold text-lg">Accept this proposal</p>
            <div className="grid sm:grid-cols-3 gap-3">
              <input className="border rounded-md px-3 py-2 text-sm" placeholder="Full name *" required value={sign.name} onChange={(e) => setSign({ ...sign, name: e.target.value })} />
              <input className="border rounded-md px-3 py-2 text-sm" placeholder="Title (e.g. Founder)" value={sign.title} onChange={(e) => setSign({ ...sign, title: e.target.value })} />
              <input className="border rounded-md px-3 py-2 text-sm" type="email" placeholder="Email" value={sign.email} onChange={(e) => setSign({ ...sign, email: e.target.value })} />
            </div>
            <div><p className="text-sm text-muted-foreground mb-1">Sign below</p><SignaturePad onChange={(signature) => setSign((s) => ({ ...s, signature }))} /></div>
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" className="mt-1" checked={sign.agree} onChange={(e) => setSign({ ...sign, agree: e.target.checked })} />
              <span>I agree to this proposal, its pricing of {money(p.total, cur)} and the terms above, on behalf of {p.clientName}. My typed name and signature count as my signature.</span>
            </label>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex flex-wrap gap-2">
              <button type="submit" disabled={state === "sending" || !sign.agree || !sign.name.trim()} className="bg-green-600 hover:bg-green-700 text-white font-medium rounded-md px-5 py-2.5 disabled:opacity-50">{state === "sending" ? "Submitting..." : "Accept & sign"}</button>
              <button type="button" onClick={() => setDeclining(true)} className="border rounded-md px-5 py-2.5 text-gray-700">Decline</button>
            </div>
            {declining && (
              <div className="space-y-2 bg-gray-50 p-3 rounded-md">
                <textarea className="w-full border rounded-md p-2 text-sm" rows={3} placeholder="Optional: tell us why, so we can improve" value={reason} onChange={(e) => setReason(e.target.value)} />
                <button type="button" onClick={decline} className="bg-gray-800 text-white rounded-md px-4 py-2 text-sm">Confirm decline</button>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
};

export default PublicProposal;
