// CreateLeaveDialog.js
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import React, { useEffect, useState } from "react";
import axiosInstance from "@/utils/axiosConfig";
import DatePickerField from "@/components/DatePickerField";
import { toast } from "sonner";

const CreateLeaveDialog = ({ open, onOpenChange, onCreate }) => {
  const [formData, setFormData] = useState({
    leaveType: "Sick",
    startDate: "",
    endDate: "",
    reason: "",
    halfDay: false,
    halfDaySession: "First half",
  });
  const [balance, setBalance] = useState(null);
  useEffect(() => {
    if (open) axiosInstance.get("/v1/leave/balance").then((r) => setBalance(r.data.balance)).catch(() => setBalance(null));
  }, [open]);
  const sameDay = formData.startDate && formData.endDate && new Date(formData.startDate).toDateString() === new Date(formData.endDate).toDateString();
  const b = balance?.types?.[formData.leaveType];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      // Moving the start date past the end date clears the end date
      ...(name === "startDate" && prev.endDate && value && new Date(prev.endDate) < new Date(value) && { endDate: "" }),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.startDate || !formData.endDate) return toast.error("Pick a start and end date");
    if (new Date(formData.endDate) < new Date(formData.startDate)) return toast.error("End date can't be before the start date");
    onCreate({ ...formData, halfDay: sameDay && formData.halfDay });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Request Leave</DialogTitle>
            <DialogDescription>
              Fill in the details below to request a leave.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="leaveType">Leave Type</Label>
              <select
                id="leaveType"
                name="leaveType"
                value={formData.leaveType}
                onChange={handleChange}
                className="w-full rounded-md border px-3 py-2 text-sm shadow-sm dark:border-gray-700 dark:bg-zinc-900"
                required
              >
                <option value="Sick">Sick Leave</option>
                <option value="Vacation">Vacation Leave</option>
                <option value="Personal">Personal Leave</option>
                <option value="Other">Other</option>
              </select>
              {b && (
                <p className="text-xs text-gray-500">
                  {b.available === null ? `No limit${b.unpaid ? " (unpaid - deducted from salary)" : ""}` : `${b.available} day${b.available === 1 ? "" : "s"} left this leave year`}
                  {b.pending ? ` · ${b.pending} pending` : ""}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <DatePickerField
                label="Start Date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                required
              />
            </div>

            <div className="grid gap-2">
              <DatePickerField
                label="End Date"
                name="endDate"
                value={formData.endDate}
                minDate={formData.startDate}
                onChange={handleChange}
                required
              />
            </div>

            {sameDay && (
              <div className="flex flex-wrap items-center gap-3">
                <label className="text-sm flex items-center gap-2">
                  <input type="checkbox" checked={formData.halfDay} onChange={(e) => setFormData((p) => ({ ...p, halfDay: e.target.checked }))} /> Half day
                </label>
                {formData.halfDay && (
                  <select value={formData.halfDaySession} onChange={(e) => setFormData((p) => ({ ...p, halfDaySession: e.target.value }))} className="rounded-md border px-2 py-1 text-sm dark:border-gray-700 dark:bg-zinc-900">
                    <option>First half</option>
                    <option>Second half</option>
                  </select>
                )}
              </div>
            )}
            <p className="text-xs text-gray-500">Weekly offs and company holidays aren't counted.</p>

            <div className="grid gap-2">
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                placeholder="Enter the reason for your leave"
                required
              />
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit">Submit Request</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateLeaveDialog;