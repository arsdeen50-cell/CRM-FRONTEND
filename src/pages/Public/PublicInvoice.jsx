import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { publicApi, money, day, errMsg } from "@/lib/publicApi";
import { backend_url } from "@/constants";

const PublicInvoice = () => {
  const { token } = useParams();
  const [params] = useSearchParams();
  const [inv, setInv] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    publicApi.get(`/invoice/${token}`).then((r) => setInv(r.data.invoice)).catch((e) => setError(errMsg(e, "Invoice not found")));
  }, [token]);
  if (!inv) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-600 p-4">{error || "Loading invoice..."}</div>;
  const cur = inv.currency;
  const paid = inv.status === "Paid";
  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 text-gray-900" style={{ colorScheme: "light" }}>
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border p-6 md:p-8 space-y-5">
        {params.get("paid") === "1" && !paid && <p className="bg-blue-50 border border-blue-200 text-blue-800 rounded-md p-3 text-sm">Thanks! Your payment is being confirmed - this page updates within a minute.</p>}
        <div className="flex flex-wrap justify-between gap-3">
          <div>
            <p className="text-xl font-bold">{inv.company?.name}</p>
            <p className="text-xs text-gray-500">{[inv.company?.address, inv.company?.email].filter(Boolean).join(" · ")}</p>
            {inv.company?.gstin && <p className="text-xs">GSTIN {inv.company.gstin}</p>}
          </div>
          <div className="text-right text-sm">
            <p className="font-semibold">Invoice {inv.invoiceNo}</p>
            <p>Date {day(inv.issueDate)}</p>
            <p className={inv.isOverdue ? "text-red-600 font-medium" : ""}>Due {day(inv.dueDate)}</p>
          </div>
        </div>
        <p className="text-sm">Billed to <b>{inv.clientName}</b>{inv.period ? ` · ${inv.period}` : ""}</p>
        <table className="w-full text-sm">
          <tbody>
            {inv.items.map((it, i) => (
              <tr key={i} className="border-b"><td className="py-2"><p className="font-medium">{it.service}</p>{it.description && <p className="text-xs text-gray-500">{it.description}</p>}</td><td className="py-2 text-right whitespace-nowrap">{money(it.quantity * it.rate, cur)}</td></tr>
            ))}
          </tbody>
        </table>
        <div className="ml-auto w-full sm:w-64 text-sm space-y-1">
          <div className="flex justify-between"><span>Taxable value</span><span>{money(inv.taxable, cur)}</span></div>
          {inv.interState ? <div className="flex justify-between"><span>IGST</span><span>{money(inv.igst, cur)}</span></div> : <><div className="flex justify-between"><span>CGST</span><span>{money(inv.cgst, cur)}</span></div><div className="flex justify-between"><span>SGST</span><span>{money(inv.sgst, cur)}</span></div></>}
          <div className="flex justify-between font-semibold border-t pt-1"><span>Total</span><span>{money(inv.total, cur)}</span></div>
          {inv.amountPaid > 0 && <div className="flex justify-between text-green-700"><span>Paid</span><span>- {money(inv.amountPaid, cur)}</span></div>}
          <div className="flex justify-between font-semibold text-base"><span>Balance due</span><span>{money(inv.balance, cur)}</span></div>
        </div>
        {paid ? (
          <p className="bg-green-50 border border-green-200 text-green-800 rounded-md p-3 text-center font-medium">Paid in full - thank you!</p>
        ) : inv.status === "Cancelled" ? (
          <p className="bg-gray-50 border rounded-md p-3 text-center">This invoice was cancelled.</p>
        ) : (
          <div className="space-y-3">
            {inv.payUrl && <a href={inv.payUrl} className="block text-center bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md py-3">Pay {money(inv.balance, cur)} online</a>}
            {(inv.bank?.account || inv.bank?.upi) && (
              <div className="text-sm bg-gray-50 rounded-md p-3">
                <p className="font-medium mb-1">{inv.payUrl ? "Or pay by bank transfer / UPI" : "Pay by bank transfer / UPI"}</p>
                {inv.bank.name && <p>Bank: {inv.bank.name}</p>}
                {inv.bank.account && <p>Account: {inv.bank.account}</p>}
                {inv.bank.ifsc && <p>IFSC: {inv.bank.ifsc}</p>}
                {inv.bank.upi && <p>UPI: {inv.bank.upi}</p>}
                <p className="text-xs text-gray-500 mt-1">Please mention {inv.invoiceNo} as the reference.</p>
              </div>
            )}
          </div>
        )}
        <a href={`${backend_url}/v1/public/invoice/${token}/pdf`} target="_blank" rel="noreferrer" className="inline-block text-sm text-blue-600 underline">Download PDF</a>
      </div>
    </div>
  );
};

export default PublicInvoice;
