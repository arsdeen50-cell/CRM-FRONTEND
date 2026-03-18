// AdminCreateTaskDialog.js
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
import React, { useState } from "react";
import DatePickerField from "@/components/DatePickerField";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import MultiSelect from "./MultiSelect";

const AdminCreateTaskDialog = ({ open, onOpenChange, onCreate, users }) => {
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        status: "Pending",
        startDate: "",
        endDate: "",
        assignedTo: [],
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleUserSelect = (selectedUserIds) => {
        setFormData(prev => ({
            ...prev,
            assignedTo: selectedUserIds
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onCreate(formData);
    };

   const userOptions = Array.isArray(users)
    ? users.map(user => ({
          value: user._id,
          label: user.fullname || user.email,
      }))
    : [];


    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Assign Task</DialogTitle>
                        <DialogDescription>
                            Fill in the details below to assign a new task.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="title">Title</Label>
                            <Input
                                id="title"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="Enter task title"
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                placeholder="Type your task here."
                                id="description"
                                name="description"
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>Assign To</Label>
                            <MultiSelect
                                options={userOptions}
                                selected={formData.assignedTo}
                                onChange={handleUserSelect}
                                placeholder="Select employees..."
                            />
                        </div>

                        <div className="grid gap-2">
                            <DatePickerField
                                label="Start Date"
                                name="startDate"
                                value={formData.startDate}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="grid gap-2">
                            <DatePickerField
                                label="End Date"
                                name="endDate"
                                value={formData.endDate}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="status">Status</Label>
                            <select
                                id="status"
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className="w-full rounded-md border px-3 py-2 text-sm shadow-sm dark:border-gray-700 dark:bg-zinc-900"
                            >
                                <option value="Pending">Pending</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Completed">Completed</option>
                            </select>
                        </div>
                    </div>

                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="outline">
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button type="submit">Assign Task</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default AdminCreateTaskDialog;