import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { cn } from "@/lib/utils";
import { ChevronsUpDown, Paperclip, Trash2 } from "lucide-react";
import { Command, CommandGroup, CommandItem } from "../ui/command";
import { Checkbox } from "../ui/checkbox";
import { useSelector } from "react-redux";
import { Input } from "../ui/input";

const AddLeadsDialog = ({ open, onOpenChange, onCreate, editData }) => {
    const isEditMode = !!editData;
    const { user } = useSelector((state) => state.auth);

    const [formData, setFormData] = useState({
        serviceType: [],
        leadSourceType: "",
        leadStatusType: "",
        priority: "",
        projectAccountHandledBy: "",
        teamAssigned: "",
        teamMember: "",
        proposalSent: "",
        convertedToProject: "",
        createdBy: user?.fullname || "",
    });

    const [files, setFiles] = useState([]);
    const [existingDocuments, setExistingDocuments] = useState([]);

    const teamOptions = {
        "Website Team": ["UI Developer", "Backend Developer", "SEO Specialist"],
        "Mobile App Team": ["React Native Dev", "Flutter Dev", "QA Tester"],
        "SMM Team": ["Social Strategist", "Content Creator", "Ad Manager"],
        "Branding & Design Team": ["Graphic Designer", "Art Director", "Copywriter"],
        "Influencer Management Team": ["Influencer Lead", "Outreach Specialist", "Campaign Manager"],
        "Production Team": ["Photographer", "Videographer", "Production Manager"],
        "Cross-functional Team": ["Project Coordinator", "Designer", "Dev Lead"],
    };

    const serviceOptions = [
        "Website Development",
        "Mobile App Development",
        "Graphic designing",
        "Social Media Marketing",
        "Branding & Design",
        "Influencer Marketing",
        "Production / Shoot",
         "SEO",
         "PR",
         "performance marketing"
    ];

    // Handle Edit and Reset states
    useEffect(() => {
        if (isEditMode && editData) {
            setFormData({
                serviceType: editData.serviceType || [],
                leadSourceType: editData.leadSourceType || "",
                leadStatusType: editData.leadStatusType || "",
                priority: editData.priority || "",
                projectAccountHandledBy: editData.projectAccountHandledBy || "",
                teamAssigned: editData.teamAssigned || "",
                teamMember: editData.teamMember || "",
                proposalSent: editData.proposalSent || "",
                convertedToProject: editData.convertedToProject || "",
                createdBy: editData.createdBy || user?.fullname || "",
            });
            setExistingDocuments(editData.documents || []);
        } else if (!open) {
            // Reset on close
            setFormData({
                serviceType: [],
                leadSourceType: "",
                leadStatusType: "",
                priority: "",
                projectAccountHandledBy: "",
                teamAssigned: "",
                teamMember: "",
                proposalSent: "",
                convertedToProject: "",
                createdBy: user?.fullname || "",
            });
            setFiles([]);
            setExistingDocuments([]);
        }
    }, [editData, isEditMode, open, user]);

    const handleChange = (field, value) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
            ...(field === "teamAssigned" ? { teamMember: "" } : {}),
        }));
    };

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        // Limit to 5 files maximum
        setFiles(prev => {
            const combined = [...prev, ...selectedFiles];
            return combined.slice(0, 5);
        });
    };

    const removeFile = (index) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const removeExistingDocument = (index) => {
        setExistingDocuments(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.serviceType.length || !formData.leadSourceType || !formData.leadStatusType) {
            alert("Please fill in required fields: Service Type, Lead Source, and Lead Status");
            return;
        }

        try {
            const submitData = new FormData();

            // Append all form fields
            Object.keys(formData).forEach(key => {
                if (key === 'serviceType') {
                    formData.serviceType.forEach(value => {
                        submitData.append('serviceType', value);
                    });
                } else {
                    submitData.append(key, formData[key]);
                }
            });

            // Append existing documents (for edit mode)
            if (isEditMode && existingDocuments.length > 0) {
                existingDocuments.forEach((doc, index) => {
                    submitData.append(`existingDocuments[${index}][fileName]`, doc.fileName);
                    submitData.append(`existingDocuments[${index}][fileUrl]`, doc.fileUrl);
                });
            }

            // Append new files
            files.forEach(file => {
                submitData.append('documents', file);
            });

            await onCreate(submitData);

            // Reset files after successful submission for new leads
            if (!isEditMode) {
                setFiles([]);
            }

        } catch (error) {
            console.error("Error submitting lead:", error);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto p-4 sm:max-w-[900px] sm:p-6">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle className="text-xl font-semibold">
                            {isEditMode ? "Edit Lead" : "Add New Lead"}
                        </DialogTitle>
                        <DialogDescription>
                            {isEditMode
                                ? "Update the details below and save changes."
                                : "Fill in the details below to create a new lead. Required fields: Service Type, Lead Source, Lead Status."}
                        </DialogDescription>
                    </DialogHeader>

                    {/* FORM FIELDS */}
                    <div className="grid grid-cols-1 gap-7 py-6 sm:grid-cols-2 lg:grid-cols-3">

                        {/* Service Type */}
                        <div className="grid gap-2">
                            <Label>Service Type *</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        className={cn("w-full justify-between", !formData.serviceType?.length && "text-muted-foreground")}
                                    >
                                        {formData.serviceType?.length ? `${formData.serviceType.length} selected` : "Select Service Type"}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[300px] p-0">
                                    <Command>
                                        <CommandGroup>
                                            {serviceOptions.map((option) => (
                                                <CommandItem
                                                    key={option}
                                                    onSelect={() => {
                                                        setFormData((prev) => {
                                                            const alreadySelected = prev.serviceType.includes(option);
                                                            return {
                                                                ...prev,
                                                                serviceType: alreadySelected
                                                                    ? prev.serviceType.filter((v) => v !== option)
                                                                    : [...prev.serviceType, option],
                                                            };
                                                        });
                                                    }}
                                                >
                                                    <Checkbox
                                                        checked={formData.serviceType.includes(option)}
                                                        className="mr-2"
                                                    />
                                                    {option}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Lead Source */}
                        <div className="grid gap-2">
                            <Label htmlFor="leadSourceType">Lead Source *</Label>
                            <Select
                                value={formData.leadSourceType}
                                onValueChange={(v) => handleChange("leadSourceType", v)}
                            >
                                <SelectTrigger id="leadSourceType">
                                    <SelectValue placeholder="Select Lead Source" />
                                </SelectTrigger>
                                <SelectContent>
                                    {[
                                        "Website Enquiry",
                                        "Instagram DM",
                                        "Facebook Ad",
                                        "Google Ad",
                                        "Referral",
                                        "Cold Call / Email",
                                        "WhatsApp",
                                        "Event / Exhibition",
                                        "Existing Client",
                                        "Others",
                                    ].map((source) => (
                                        <SelectItem key={source} value={source}>
                                            {source}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Lead Status */}
                        <div className="grid gap-2">
                            <Label htmlFor="leadStatusType">Lead Status *</Label>
                            <Select
                                value={formData.leadStatusType}
                                onValueChange={(v) => handleChange("leadStatusType", v)}
                            >
                                <SelectTrigger id="leadStatusType">
                                    <SelectValue placeholder="Select Lead Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    {[
                                        "New Lead",
                                        "Hot Lead",
                                        "Contacted",
                                        "Discussion in Progress",
                                        "Proposal Sent",
                                        "Negotiation",
                                        "Converted to Project",
                                        "Lost",
                                        "On Hold",
                                    ].map((status) => (
                                        <SelectItem key={status} value={status}>
                                            {status}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Priority */}
                        <div className="grid gap-2">
                            <Label htmlFor="priority">Priority</Label>
                            <Select
                                value={formData.priority}
                                onValueChange={(v) => handleChange("priority", v)}
                            >
                                <SelectTrigger id="priority">
                                    <SelectValue placeholder="Select Priority" />
                                </SelectTrigger>
                                <SelectContent>
                                    {["Low", "Medium", "High", "Critical"].map((p) => (
                                        <SelectItem key={p} value={p}>
                                            {p}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Project Account Handled By */}
                        <div className="grid gap-2">
                            <Label htmlFor="projectAccountHandledBy">Project Account Handled By</Label>
                            <Select
                                value={formData.projectAccountHandledBy}
                                onValueChange={(v) => handleChange("projectAccountHandledBy", v)}
                            >
                                <SelectTrigger id="projectAccountHandledBy">
                                    <SelectValue placeholder="Select Account Handler" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Arsalan">Arsalan</SelectItem>
                                    <SelectItem value="Fardeen">Fardeen</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Team Assigned */}
                        <div className="grid gap-2">
                            <Label htmlFor="teamAssigned">Team Assigned</Label>
                            <Select
                                value={formData.teamAssigned}
                                onValueChange={(v) => handleChange("teamAssigned", v)}
                            >
                                <SelectTrigger id="teamAssigned">
                                    <SelectValue placeholder="Select Team" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.keys(teamOptions).map((team) => (
                                        <SelectItem key={team} value={team}>
                                            {team}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Team Member (Dependent) */}
                        {formData.teamAssigned && (
                            <div className="grid gap-2">
                                <Label htmlFor="teamMember">{formData.teamAssigned} Members</Label>
                                <Select
                                    value={formData.teamMember}
                                    onValueChange={(v) => handleChange("teamMember", v)}
                                >
                                    <SelectTrigger id="teamMember">
                                        <SelectValue placeholder="Select Team Member" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {teamOptions[formData.teamAssigned]?.map((member) => (
                                            <SelectItem key={member} value={member}>
                                                {member}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {/* Proposal Sent */}
                        <div className="grid gap-2">
                            <Label htmlFor="proposalSent">Proposal Sent?</Label>
                            <Select
                                value={formData.proposalSent}
                                onValueChange={(v) => handleChange("proposalSent", v)}
                            >
                                <SelectTrigger id="proposalSent">
                                    <SelectValue placeholder="Select Option" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Yes">Yes</SelectItem>
                                    <SelectItem value="No">No</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Converted to Project */}
                        <div className="grid gap-2">
                            <Label htmlFor="convertedToProject">Converted to Project?</Label>
                            <Select
                                value={formData.convertedToProject}
                                onValueChange={(v) => handleChange("convertedToProject", v)}
                            >
                                <SelectTrigger id="convertedToProject">
                                    <SelectValue placeholder="Select Option" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Yes">Yes</SelectItem>
                                    <SelectItem value="No">No</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Documents Upload */}
                        <div className="grid gap-2 col-span-full">
                            <Label htmlFor="documents">Documents</Label>
                            <Input
                                id="documents"
                                type="file"
                                multiple
                                onChange={handleFileChange}
                                className="cursor-pointer"
                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                disabled={files.length >= 5}
                            />
                            <p className="text-xs text-gray-500">
                                {files.length >= 5
                                    ? "Maximum 5 files reached"
                                    : `You can upload ${5 - files.length} more files (PDF, Word, Images)`}
                            </p>
                        </div>

                        {/* Selected Files Preview */}
                        {files.length > 0 && (
                            <div className="col-span-full">
                                <Label>Selected Files:</Label>
                                <div className="mt-2 space-y-2">
                                    {files.map((file, index) => (
                                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                                            <div className="flex items-center gap-2">
                                                <Paperclip className="h-4 w-4" />
                                                <span className="text-sm">{file.name}</span>
                                                <span className="text-xs text-gray-500">
                                                    ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                                </span>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeFile(index)}
                                            >
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Existing Documents */}
                        {existingDocuments.length > 0 && (
                            <div className="col-span-full">
                                <Label>Existing Documents:</Label>
                                <div className="mt-2 space-y-2">
                                    {existingDocuments.map((doc, index) => (
                                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                                            <div className="flex items-center gap-2">
                                                <Paperclip className="h-4 w-4" />
                                                <a
                                                    href={doc.fileUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-sm text-blue-600 hover:underline"
                                                >
                                                    {doc.fileName}
                                                </a>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeExistingDocument(index)}
                                            >
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="flex flex-col justify-end gap-2 sm:flex-row sm:gap-4">
                        <Button
                            type="submit"
                            className="w-full bg-blue-600 text-white hover:bg-blue-700 sm:w-auto"
                        >
                            {isEditMode ? "Update Lead" : "Submit Lead"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default AddLeadsDialog;