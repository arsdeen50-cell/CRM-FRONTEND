import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import axiosInstance from "@/utils/axiosConfig";
import { errMsg } from "@/lib/publicApi";

export const stepLabel = (s) => `Day +${s.dayOffset} · ${s.channel}${s.mode === "auto" ? " (auto)" : ""}`;

/* Add one or more leads to a follow-up sequence. */
const EnrollSequenceDialog = ({ open, onOpenChange, leads = [], onDone }) => {
  const [sequences, setSequences] = useState([]);
  const [picked, setPicked] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (!open) return;
    axiosInstance
      .get("/v1/sequence")
      .then((res) => {
        const active = (res.data.sequences || []).filter((s) => s.isActive);
        setSequences(active);
        setPicked(active[0]?._id || "");
      })
      .catch(() => setSequences([]));
  }, [open]);

  const enroll = async () => {
    setSaving(true);
    try {
      const res = await axiosInstance.post(`/v1/sequence/${picked}/enroll`, { leadIds: leads.map((l) => l._id) });
      const { enrolled, skipped } = res.data;
      toast.success(`${enrolled} lead${enrolled === 1 ? "" : "s"} added`, skipped?.length ? { description: skipped.map((s) => s.reason).join(", ") } : undefined);
      onDone?.();
      onOpenChange(false);
    } catch (err) {
      toast.error(errMsg(err, "Could not add to sequence"));
    } finally {
      setSaving(false);
    }
  };

  const name = leads.length === 1 ? leads[0].clientId?.brandName || leads[0].clientName : `${leads.length} leads`;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add {name} to a sequence</DialogTitle>
          <DialogDescription>Auto steps send by themselves in business hours; manual steps appear in Sequences → Steps due. It stops when they reply or the lead is Won/Lost.</DialogDescription>
        </DialogHeader>
        {sequences.length === 0 ? (
          <p className="text-sm text-gray-500">No active sequences yet. An admin can create one under CRM → Sequences.</p>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {sequences.map((s) => (
              <label key={s._id} className={`block border rounded-md p-3 cursor-pointer ${picked === s._id ? "ring-2 ring-blue-500" : ""}`}>
                <input type="radio" className="mr-2" checked={picked === s._id} onChange={() => setPicked(s._id)} />
                <span className="font-medium">{s.name}</span>
                <span className="block text-xs text-gray-500 mt-1">{s.steps.map(stepLabel).join("  →  ")}</span>
              </label>
            ))}
          </div>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={enroll} disabled={!picked || saving} className="bg-blue-600 hover:bg-blue-700">{saving ? "Adding..." : "Add to sequence"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EnrollSequenceDialog;
