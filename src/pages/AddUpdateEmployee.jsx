import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import useUpdateAttendance from "@/hooks/useUpdateAttendance"; // adjust path

const AddUpdateEmployee = ({ open, setOpen, record, onUpdate }) => {
    const { updateAttendance } = useUpdateAttendance();

    // Local state for form fields, prefilled on record change
    const [formData, setFormData] = useState({
        empId: "",
        fullname: "",
        email: "",
        punchIn: "",
        punchOut: "",
    });

    // Helper to format date as 'YYYY-MM-DDTHH:mm' in local time
    function toLocalDateTimeString(date) {
        if (!date) return "";
        const d = new Date(date);
        const pad = (n) => (n < 10 ? "0" + n : n);
        return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + "T" + pad(d.getHours()) + ":" + pad(d.getMinutes());
    }

    useEffect(() => {
        if (record) {
            setFormData({
                empId: record.userId?.empId || "",
                fullname: record.userId?.fullname || "",
                email: record.userId?.email || "",
                punchIn: toLocalDateTimeString(record.punchIn),
                punchOut: toLocalDateTimeString(record.punchOut),
            });
        }
    }, [record]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Prepare payload
        const payload = {
            userId: {
                empId: formData.empId,
                fullname: formData.fullname,
                email: formData.email,
            },
            punchIn: formData.punchIn ? new Date(formData.punchIn).toISOString() : null,
            punchOut: formData.punchOut ? new Date(formData.punchOut).toISOString() : null,
        };

        try {
            await updateAttendance(record._id, payload);
            setOpen(false);
            window.location.reload();
        } catch (err) {
            // error handled in hook (toast)
        }
    };

    return (
        <Sheet
            open={open}
            onOpenChange={setOpen}
        >
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>Edit Employee</SheetTitle>
                    <SheetDescription>Make changes to the employee profile. Click save when you're done.</SheetDescription>
                </SheetHeader>
                <form
                    onSubmit={handleSubmit}
                    className="mt-5 grid flex-1 auto-rows-min gap-6 px-4"
                >
                    <div className="grid gap-3">
                        <Label htmlFor="empId">Employee ID</Label>
                        <Input
                            id="empId"
                            name="empId"
                            value={formData.empId}
                            onChange={handleChange}
                            disabled
                        />
                    </div>
                    <div className="grid gap-3">
                        <Label htmlFor="fullname">Full Name</Label>
                        <Input
                            id="fullname"
                            name="fullname"
                            value={formData.fullname}
                            onChange={handleChange}
                            disabled
                        />
                    </div>
                    <div className="grid gap-3">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            disabled
                        />
                    </div>
                    <div className="grid gap-3">
                        <Label htmlFor="punchIn">Punch In</Label>
                        <Input
                            type="datetime-local"
                            id="punchIn"
                            name="punchIn"
                            value={formData.punchIn}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="grid gap-3">
                        <Label htmlFor="punchOut">Punch Out</Label>
                        <Input
                            type="datetime-local"
                            id="punchOut"
                            name="punchOut"
                            value={formData.punchOut}
                            onChange={handleChange}
                        />
                    </div>
                    <SheetFooter>
                        <Button type="submit">Save changes</Button>
                        {/* <SheetClose asChild>
              <Button variant="outline" type="button" onClick={() => setOpen(false)}>
                Close
              </Button>
            </SheetClose> */}
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
};

export default AddUpdateEmployee;
