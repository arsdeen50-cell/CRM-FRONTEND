import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useState } from "react";
import DatePickerField from "./DatePickerField";
import MultiSelect  from "@/pages/MultiSelect";

const EditTaskSheet = ({ task, open, onOpenChange, onSave, isAdmin = false, users = []  }) => {
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        status: "Pending",
        startDate: "",
        endDate: "",
    assignedTo: [],
    });

    useEffect(() => {
        if (task) {
            // Format dates for the date input fields (YYYY-MM-DD)
            const formatDateForInput = (dateString) => {
                if (!dateString) return "";
                return new Date(dateString);
            };

            setFormData({
                title: task.title || "",
                description: task.description || "",
                status: task.status || "Pending",
                startDate: formatDateForInput(task.startDate),
                endDate: formatDateForInput(task.endDate),
                 assignedTo: task.assignedTo?.map(a => a.user._id) || [],
            });
        }
    }, [task]);

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
        onSave(formData);
    };

    if (!task) return null;

     const userOptions = users.map(user => ({
        value: user._id,
        label: user.fullname || user.email
    }));


    return (
        <Sheet
            open={open}
            onOpenChange={onOpenChange}
        >
            <SheetContent>
                <form onSubmit={handleSubmit}>
                    <SheetHeader>
                        <SheetTitle>Edit Task</SheetTitle>
                        <SheetDescription>Make changes to your task here. Click save when you're done.</SheetDescription>
                    </SheetHeader>
                    <div className="grid flex-1 auto-rows-min gap-6 px-4 py-4">
                        <div className="grid gap-3">
                            <Label htmlFor="title">Title</Label>
                            <Input
                                id="title"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="grid gap-3">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                required
                            />
                        </div>

                           {isAdmin && (
                            <div className="grid gap-2">
                                <Label>Assign To</Label>
                                <MultiSelect
                                    options={userOptions}
                                    selected={formData.assignedTo}
                                    onChange={handleUserSelect}
                                    placeholder="Select employees..."
                                />
                            </div>
                        )}
                        
                        <div className="grid gap-3">
                            <DatePickerField
                                label="Start Date"
                                name="startDate"
                                value={formData.startDate}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="grid gap-3">
                            <DatePickerField
                                label="End Date"
                                name="endDate"
                                value={formData.endDate}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="grid gap-3">
                            <Label htmlFor="status">Status</Label>
                            <select
                                id="status"
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className="w-full rounded-md border px-3 py-2 text-sm shadow-sm dark:border-gray-700 dark:bg-zinc-900"
                                required
                            >
                                <option value="Pending">Pending</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Completed">Completed</option>
                            </select>
                        </div>
                    </div>
                    <SheetFooter>
                        <SheetClose asChild>
                            <Button
                                type="button"
                                variant="outline"
                            >
                                Cancel
                            </Button>
                        </SheetClose>
                        <Button type="submit">Save changes</Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
};

export default EditTaskSheet;
