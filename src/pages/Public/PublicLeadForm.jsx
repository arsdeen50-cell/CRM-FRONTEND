import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { publicApi, errMsg } from "@/lib/publicApi";

// Public enquiry form (no login). Works standalone or embedded in an iframe (?embed=1).
const field = "w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900";
const PublicLeadForm = () => {
  const { key } = useParams();
  const [params] = useSearchParams();
  const embed = params.get("embed") === "1";
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const [values, setValues] = useState({});
  const [state, setState] = useState("idle");
  const [thanks, setThanks] = useState("");
  useEffect(() => {
    publicApi.get(`/forms/${key}`).then((r) => setForm(r.data.form)).catch((e) => setError(errMsg(e, "This form isn't available")));
  }, [key]);
  const set = (k) => (e) => setValues((v) => ({ ...v, [k]: e.target.value }));
  const submit = async (e) => {
    e.preventDefault();
    setState("sending");
    setError("");
    try {
      const page = embed ? document.referrer : window.location.href;
      const res = await publicApi.post(`/forms/${key}/submit`, { ...values, page, utm_source: params.get("utm_source") || "", utm_medium: params.get("utm_medium") || "", utm_campaign: params.get("utm_campaign") || "" });
      if (res.data.redirectUrl && !embed) return window.location.assign(res.data.redirectUrl);
      setThanks(res.data.message);
      setState("done");
    } catch (err) {
      setError(errMsg(err));
      setState("idle");
    }
  };
  if (!form) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-600 p-4">{error || "Loading..."}</div>;
  const f = form.fields || {};
  return (
    <div className={`${embed ? "" : "min-h-screen bg-gray-50 py-10"} px-4 text-gray-900`} style={{ colorScheme: "light" }}>
      <div className={`max-w-lg mx-auto bg-white ${embed ? "" : "rounded-xl shadow-sm border"} p-6`}>
        {!embed && <p className="text-sm font-semibold text-gray-500 mb-1">{form.company}</p>}
        <h1 className="text-2xl font-semibold mb-2">{form.title}</h1>
        {form.intro && <p className="text-gray-600 mb-4 whitespace-pre-wrap">{form.intro}</p>}
        {state === "done" ? (
          <p className="text-green-700 bg-green-50 border border-green-200 rounded-md p-4">{thanks}</p>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <input name="website_url_confirm" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" onChange={set("website_url_confirm")} />
            <input className={field} placeholder="Your name *" required maxLength={120} onChange={set("name")} />
            {f.company && <input className={field} placeholder="Company / brand" maxLength={150} onChange={set("company")} />}
            {f.email && <input className={field} type="email" placeholder={f.phone ? "Email" : "Email *"} required={!f.phone} maxLength={200} onChange={set("email")} />}
            {f.phone && <input className={field} type="tel" placeholder={f.email ? "Phone / WhatsApp" : "Phone / WhatsApp *"} required={!f.email} maxLength={30} onChange={set("phone")} />}
            {f.instagram && <input className={field} placeholder="Instagram handle or link" maxLength={200} onChange={set("instagram")} />}
            {f.website && <input className={field} placeholder="Website" maxLength={200} onChange={set("website")} />}
            {f.service && form.serviceOptions?.length > 0 && (
              <select className={field} defaultValue="" onChange={set("service")}>
                <option value="" disabled>What do you need help with?</option>
                {form.serviceOptions.map((s) => <option key={s}>{s}</option>)}
              </select>
            )}
            {f.budget && form.budgetOptions?.length > 0 && (
              <select className={field} defaultValue="" onChange={set("budget")}>
                <option value="" disabled>Budget</option>
                {form.budgetOptions.map((s) => <option key={s}>{s}</option>)}
              </select>
            )}
            {f.message && <textarea className={field} rows={4} placeholder="Tell us a little about it" maxLength={3000} onChange={set("message")} />}
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={state === "sending"} className="w-full text-white font-medium rounded-md py-2.5 disabled:opacity-60" style={{ background: form.accentColor || "#2563eb" }}>
              {state === "sending" ? "Sending..." : "Send"}
            </button>
            <p className="text-xs text-gray-400">We only use your details to reply to this enquiry.</p>
          </form>
        )}
      </div>
    </div>
  );
};

export default PublicLeadForm;
