import { SalesRoute } from "@/components/crm/AccessRoute";
import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Download, Edit, Send, CheckCircle2, XCircle, Trash2, Link2, Eye, Receipt, Mail } from "lucide-react";
import { toast } from "sonner";
import { useIsAdmin } from "@/components/crm/CrmMemberRoute";
import ProposalEditor from "@/components/crm/ProposalEditor";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/hooks/Pipelineconstants";
import axiosInstance from "@/utils/axiosConfig";
import { downloadFile, formatDay } from "@/lib/crmOutreach";

const STATUS_STYLE = {
  Draft: "bg-slate-100 text-slate-700",
  Sent: "bg-purple-100 text-purple-700",
  Accepted: "bg-green-100 text-green-700",
  Rejected: "bg-red-100 text-red-700",
  Expired: "bg-gray-100 text-gray-500",
};

export const downloadProposalPdf = async (p) => {
  try {
    const res = await axiosInstance.get(`/v1/proposal/${p._id}/pdf`, { responseType: "blob" });
    downloadFile(`${p.proposalNo}-${(p.clientName || "client").replace(/[^\w.-]+/g, "_")}.pdf`, res.data);
  } catch {
    toast.error("Could not download the PDF");
  }
};

const Proposals = () => {
  const navigate = useNavigate();
  const isAdmin = useIsAdmin();
  const [proposals, setProposals] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/v1/proposal");
      setProposals(res.data.proposals || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not load proposals");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const setStatus = async (p, status) => {
    const confirmText = {
      Sent: "Mark as sent? The lead moves to 'Proposal Sent' and its deal value becomes this proposal's total.",
      Accepted: "Mark as accepted? The lead becomes Won and a project + kickoff task are created.",
      Rejected: "Mark as rejected? The lead stage is left unchanged.",
    }[status];
    if (confirmText && !window.confirm(confirmText)) return;
    try {
      const res = await axiosInstance.patch(`/v1/proposal/${p._id}/status`, { status });
      toast.success(`Proposal ${status.toLowerCase()}${res.data.project ? ` - project ${res.data.project.projectNo} created` : ""}`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update status");
    }
  };

  // Client link: view tracking + online acceptance. Copies the link; optionally emails it from the CRM.
  const share = async (p, email) => {
    try {
      const res = await axiosInstance.post(`/v1/proposal/${p._id}/share`, { email });
      await navigator.clipboard.writeText(res.data.url).catch(() => {});
      toast.success(email ? "Proposal link emailed to the client" : "Client link copied", { description: res.data.url });
      load();
    } catch (err) {
      if (err.response?.data?.url) navigator.clipboard.writeText(err.response.data.url).catch(() => {});
      toast.error(err.response?.data?.message || "Could not create link");
    }
  };
  const toInvoice = async (p) => {
    try {
      const res = await axiosInstance.post(`/v1/invoice/from-proposal/${p._id}`);
      toast.success(`Draft invoice ${res.data.invoice.invoiceNo} created`);
      navigate("/crm/invoices");
    } catch (err) {
      if (err.response?.status === 409) {
        toast.info(err.response.data.message);
        navigate("/crm/invoices");
      } else toast.error(err.response?.data?.message || "Could not create invoice");
    }
  };

  const remove = async (p) => {
    if (!window.confirm(`Delete ${p.proposalNo}? This can't be undone.`)) return;
    try {
      await axiosInstance.delete(`/v1/proposal/${p._id}`);
      toast.success("Proposal deleted");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete");
    }
  };

  const totalOpen = proposals.filter((p) => p.status === "Sent").reduce((s, p) => s + p.total, 0);
  const totalWon = proposals.filter((p) => p.status === "Accepted").reduce((s, p) => s + p.total, 0);

  return (
    <SalesRoute>
      <div className="p-4 md:p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate("/crm")} title="Back to CRM">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl md:text-2xl font-semibold flex items-center gap-2">
              <FileText className="h-6 w-6 text-blue-600" /> Proposals
            </h1>
            <p className="text-sm text-gray-500">{'Create a proposal from a lead on the Leads page ("Proposal" button). Share the client link to see when they open it and let them accept and sign online.'}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Card><CardContent className="p-4"><p className="text-sm text-gray-500">Proposals</p><p className="text-2xl font-semibold">{proposals.length}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-sm text-gray-500">Awaiting decision</p><p className="text-2xl font-semibold">{formatCurrency(totalOpen)}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-sm text-gray-500">Accepted</p><p className="text-2xl font-semibold">{formatCurrency(totalWon)}</p></CardContent></Card>
        </div>

        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No.</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Valid until</TableHead>
                  <TableHead>Client activity</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {proposals.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-gray-500">{loading ? "Loading..." : "No proposals yet."}</TableCell>
                  </TableRow>
                )}
                {proposals.map((p) => (
                  <TableRow key={p._id}>
                    <TableCell className="font-medium whitespace-nowrap">{p.proposalNo}</TableCell>
                    <TableCell className="min-w-[140px]">{p.clientName}<div className="text-xs text-gray-500 whitespace-nowrap">{p.leadId?.series}</div></TableCell>
                    <TableCell className="max-w-xs truncate" title={p.title}>{p.title}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">{formatCurrency(p.total)}</TableCell>
                    <TableCell><span className={`text-xs rounded-full px-2 py-0.5 ${STATUS_STYLE[p.status] || ""}`}>{p.status}</span></TableCell>
                    <TableCell className={new Date(p.validUntil) < new Date() && ["Draft", "Sent"].includes(p.status) ? "text-red-600" : ""}>{formatDay(p.validUntil)}</TableCell>
                    <TableCell className="text-xs">
                      {p.signature?.signedAt ? (
                        <span className="text-green-700">Signed by {p.signature.name}</span>
                      ) : p.viewCount ? (
                        <span className="flex items-center gap-1 text-blue-700" title={`First opened ${formatDay(p.firstViewedAt)}`}><Eye className="h-3 w-3" /> Viewed {p.viewCount}× · {formatDay(p.lastViewedAt)}</span>
                      ) : p.publicToken ? (
                        <span className="text-gray-500">Link sent, not opened</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" title="Download PDF" onClick={() => downloadProposalPdf(p)}><Download className="h-4 w-4" /></Button>
                        {["Draft", "Sent"].includes(p.status) && (
                          <>
                            <Button size="icon" variant="ghost" title="Copy client link (view + accept online)" className="text-blue-600" onClick={() => share(p, false)}><Link2 className="h-4 w-4" /></Button>
                            <Button size="icon" variant="ghost" title="Email the client link" className="text-blue-600" onClick={() => window.confirm("Email the proposal link to the client now?") && share(p, true)}><Mail className="h-4 w-4" /></Button>
                          </>
                        )}
                        {p.status === "Accepted" && isAdmin && <Button size="icon" variant="ghost" title="Create invoice" className="text-emerald-600" onClick={() => toInvoice(p)}><Receipt className="h-4 w-4" /></Button>}
                        {p.status !== "Accepted" && <Button size="icon" variant="ghost" title="Edit" onClick={() => setEditing(p)}><Edit className="h-4 w-4" /></Button>}
                        {p.status === "Draft" && <Button size="icon" variant="ghost" title="Mark as sent" className="text-purple-600" onClick={() => setStatus(p, "Sent")}><Send className="h-4 w-4" /></Button>}
                        {["Draft", "Sent"].includes(p.status) && (
                          <>
                            <Button size="icon" variant="ghost" title="Mark accepted (lead becomes Won)" className="text-green-600" onClick={() => setStatus(p, "Accepted")}><CheckCircle2 className="h-4 w-4" /></Button>
                            <Button size="icon" variant="ghost" title="Mark rejected" className="text-red-600" onClick={() => setStatus(p, "Rejected")}><XCircle className="h-4 w-4" /></Button>
                          </>
                        )}
                        {isAdmin && <Button size="icon" variant="ghost" title="Delete" className="text-red-600" onClick={() => remove(p)}><Trash2 className="h-4 w-4" /></Button>}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <ProposalEditor open={!!editing} onOpenChange={(o) => !o && setEditing(null)} proposal={editing} onSaved={load} />
      </div>
    </SalesRoute>
  );
};

export default Proposals;
