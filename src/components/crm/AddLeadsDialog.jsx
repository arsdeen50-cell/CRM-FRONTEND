import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { cn } from "@/lib/utils";
import { ChevronsUpDown, Paperclip, Trash2, RefreshCw, Clock, Mail, Phone, Calendar } from "lucide-react";
import { Command, CommandGroup, CommandItem } from "../ui/command";
import { Checkbox } from "../ui/checkbox";
import { useSelector } from "react-redux";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import axiosInstance from "@/utils/axiosConfig";
import { toast } from "sonner";
import { useTeams } from "@/hooks/useTeams";

const AddLeadsDialog = ({ open, onOpenChange, onCreate, editData }) => {
    const isEditMode = !!editData;
    const { user } = useSelector((state) => state.auth);
    const currentUser = user?.fullname || "Unknown";

    // Lead Details Form (Step 2 only)
    const [formData, setFormData] = useState({
        // Client fields (from LeadClientList)
        leadInformation: "",
        brandName: "",
        contactPerson: "",
        email: "",
        phone: "",
        role: "",
        industry: "",
        location: "",
        instagramLink: "",
        websiteLink: "",
        // Lead fields
        serviceType: [],
        leadSourceType: "",
        leadStatusType: "",
        priority: "",
        projectAccountHandledBy: "",
        teamAssigned: "",
        teamMember: "",
        proposalSent: "",
        convertedToProject: "",
        createdBy: currentUser,
    });

    const [files, setFiles] = useState([]);
    const [existingDocuments, setExistingDocuments] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Activity Logs
    const [activityLogs, setActivityLogs] = useState([]);
    const [loadingLogs, setLoadingLogs] = useState(false);

    // Won Stage Popup
    const [showWonPopup, setShowWonPopup] = useState(false);
    const [pendingSubmitData, setPendingSubmitData] = useState(null);

    // Teams come from Role Based Access. Members are the people in that team (with their sub-role);
    // a team with nobody in it yet falls back to its sub-roles, like before.
    const { teams } = useTeams();
    const teamOptions = Object.fromEntries(
        teams
            .filter((t) => t.isActive)
            .map((t) => [
                t.name,
                t.members?.length
                    ? t.members.map((m) => ({ value: m.fullname, label: `${m.fullname}${m.subRole ? ` · ${m.subRole}` : ""}${m.isLead ? " (Lead)" : ""}` }))
                    : (t.subRoles || []).map((r) => ({ value: r, label: r })),
            ])
    );

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

    // Fetch activity logs for a specific lead
    const fetchActivityLogs = async (leadId) => {
        if (!leadId) return;
        try {
            setLoadingLogs(true);
            const res = await axiosInstance.get(`/v1/leadsource/${leadId}/activity`);
            setActivityLogs(res.data?.activityLog || []);
        } catch (err) {
            console.error("Failed to fetch activity logs:", err);
        } finally {
            setLoadingLogs(false);
        }
    };

    useEffect(() => {
        if (open) {
            if (isEditMode && editData?._id) {
                fetchActivityLogs(editData._id);
            }
        }
    }, [open, isEditMode, editData]);

    // Handle Edit and Reset states
    useEffect(() => {
        if (isEditMode && editData) {
            setFormData({
                // Client fields from editData
                leadInformation: editData.leadInformation || "",
                brandName: editData.brandName || "",
                contactPerson: editData.contactPerson || "",
                email: editData.email || "",
                phone: editData.phone || "",
                role: editData.role || "",
                industry: editData.industry || "",
                location: editData.location || "",
                instagramLink: editData.instagramLink || "",
                websiteLink: editData.websiteLink || "",
                // Lead fields
                serviceType: editData.serviceType || [],
                leadSourceType: editData.leadSourceType || "",
                leadStatusType: editData.leadStatusType || "",
                priority: editData.priority || "",
                projectAccountHandledBy: editData.projectAccountHandledBy || "",
                teamAssigned: editData.teamAssigned || "",
                teamMember: editData.teamMember || "",
                proposalSent: editData.proposalSent || "",
                convertedToProject: editData.convertedToProject || "",
                createdBy: editData.createdBy || currentUser,
            });
            setExistingDocuments(editData.documents || []);
        } else if (!open) {
            // Reset on close
            setFormData({
                leadInformation: "",
                brandName: "",
                contactPerson: "",
                email: "",
                phone: "",
                role: "",
                industry: "",
                location: "",
                instagramLink: "",
                websiteLink: "",
                serviceType: [],
                leadSourceType: "",
                leadStatusType: "",
                priority: "",
                projectAccountHandledBy: "",
                teamAssigned: "",
                teamMember: "",
                proposalSent: "",
                convertedToProject: "",
                createdBy: currentUser,
            });
            setFiles([]);
            setExistingDocuments([]);
            setActivityLogs([]);
            setShowWonPopup(false);
            setPendingSubmitData(null);
        }
    }, [editData, isEditMode, open, currentUser]);

    const handleChange = (field, value) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
            ...(field === "teamAssigned" ? { teamMember: "" } : {}),
        }));
    };

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
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

    // Create client entry in LeadClient
    const createLeadClient = async (clientData) => {
        try {
            const payload = {
                leadInformation: clientData.leadInformation,
                brandName: clientData.brandName,
                contactPerson: clientData.contactPerson,
                email: clientData.email,
                phone: clientData.phone,
                role: clientData.role || "",
                industry: clientData.industry || "",
                location: clientData.location || "",
                instagramLink: clientData.instagramLink || "",
                websiteLink: clientData.websiteLink || "",
                createdBy: currentUser,
            };

            const res = await axiosInstance.post("/v1/leadclient", payload);
            return res.data.client;
        } catch (err) {
            console.error("Error creating lead client:", err);
            throw err;
        }
    };

    const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.brandName || !formData.contactPerson) {
        toast.error("Please fill in all required client fields: Brand Name and Contact Person");
        return;
    }

    if (!formData.serviceType.length || !formData.leadSourceType || !formData.leadStatusType) {
        toast.error("Please fill in required fields: Service Type, Lead Source, and Lead Status");
        return;
    }

    // Check if stage is Won - only for new leads (not edit mode)
    // In edit mode, the parent component handles the stage change
    if (formData.leadStatusType === "Won" && !isEditMode) {
        // Show popup before creating
        setPendingSubmitData(formData);
        setShowWonPopup(true);
        return;
    }

    // Proceed with normal submit
    await performSubmit(formData);
};

    const performSubmit = async (data) => {
        try {
            setLoading(true);
            const submitData = new FormData();

            // Append all client fields
            submitData.append('leadInformation', data.leadInformation || "");
            submitData.append('brandName', data.brandName || "");
            submitData.append('contactPerson', data.contactPerson || "");
            submitData.append('email', data.email || "");
            submitData.append('phone', data.phone || "");
            submitData.append('role', data.role || "");
            submitData.append('industry', data.industry || "");
            submitData.append('location', data.location || "");
            submitData.append('instagramLink', data.instagramLink || "");
            submitData.append('websiteLink', data.websiteLink || "");

            // Append all form fields
            Object.keys(data).forEach(key => {
                if (key === 'serviceType') {
                    data.serviceType.forEach(value => {
                        submitData.append('serviceType', value);
                    });
                } else if (!['leadInformation', 'brandName', 'contactPerson', 'email', 'phone', 'role', 'industry', 'location', 'instagramLink', 'websiteLink'].includes(key)) {
                    submitData.append(key, data[key]);
                }
            });

            if (isEditMode && existingDocuments.length > 0) {
                existingDocuments.forEach((doc, index) => {
                    submitData.append(`existingDocuments[${index}][fileName]`, doc.fileName);
                    submitData.append(`existingDocuments[${index}][fileUrl]`, doc.fileUrl);
                });
            }

            files.forEach(file => {
                submitData.append('documents', file);
            });

            await onCreate(submitData);

            if (!isEditMode) {
                setFiles([]);
                setFormData({
                    leadInformation: "",
                    brandName: "",
                    contactPerson: "",
                    email: "",
                    phone: "",
                    role: "",
                    industry: "",
                    location: "",
                    instagramLink: "",
                    websiteLink: "",
                    serviceType: [],
                    leadSourceType: "",
                    leadStatusType: "",
                    priority: "",
                    projectAccountHandledBy: "",
                    teamAssigned: "",
                    teamMember: "",
                    proposalSent: "",
                    convertedToProject: "",
                    createdBy: currentUser,
                });
            }

            setShowWonPopup(false);
            setPendingSubmitData(null);

        } catch (error) {
            console.error("Error submitting lead:", error);
        } finally {
            setLoading(false);
        }
    };

    // Handle Won popup confirmation
    const handleWonConfirm = async () => {
        try {
            // First, create the client entry
            const clientData = {
                leadInformation: pendingSubmitData.leadInformation,
                brandName: pendingSubmitData.brandName,
                contactPerson: pendingSubmitData.contactPerson,
                email: pendingSubmitData.email,
                phone: pendingSubmitData.phone,
                role: pendingSubmitData.role,
                industry: pendingSubmitData.industry,
                location: pendingSubmitData.location,
                instagramLink: pendingSubmitData.instagramLink,
                websiteLink: pendingSubmitData.websiteLink,
            };

            const newClient = await createLeadClient(clientData);
            toast.success("Client created successfully!");

            // Now submit the lead with the client ID
            const leadData = {
                ...pendingSubmitData,
                clientId: newClient._id,
                clientName: newClient.brandName,
            };

            await performSubmit(leadData);

        } catch (err) {
            toast.error("Failed to create client entry. Please try again.");
            console.error(err);
        }
    };

    const handleWonCancel = () => {
        setShowWonPopup(false);
        setPendingSubmitData(null);
    };

    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Get icon for activity type
    const getActivityIcon = (type) => {
        switch(type) {
            case 'Call': return <Phone className="h-4 w-4 text-green-500" />;
            case 'Email': return <Mail className="h-4 w-4 text-blue-500" />;
            case 'Meeting': return <Calendar className="h-4 w-4 text-purple-500" />;
            default: return <Clock className="h-4 w-4 text-gray-500" />;
        }
    };

    return (
        <>
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
                                    : "Fill in the client and lead details below."}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="py-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {/* CLIENT FIELDS - Top Section */}
                                <div className="col-span-full">
                                    <h3 className="text-sm font-semibold text-gray-700 mb-2 border-b pb-1">Client Information</h3>
                                </div>

                                <div className="grid gap-2">
                                    <Label>Lead Information *</Label>
                                    <Input
                                        value={formData.leadInformation}
                                        onChange={(e) => handleChange("leadInformation", e.target.value)}
                                        placeholder="Enter lead information"
                                        required
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label>Brand Name *</Label>
                                    <Input
                                        value={formData.brandName}
                                        onChange={(e) => handleChange("brandName", e.target.value)}
                                        placeholder="Enter brand name"
                                        required
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label>Contact Person *</Label>
                                    <Input
                                        value={formData.contactPerson}
                                        onChange={(e) => handleChange("contactPerson", e.target.value)}
                                        placeholder="Enter contact person name"
                                        required
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label>Email</Label>
                                    <Input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => handleChange("email", e.target.value)}
                                        placeholder="Enter email (optional)"
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label>Phone</Label>
                                    <Input
                                        value={formData.phone}
                                        onChange={(e) => handleChange("phone", e.target.value)}
                                        placeholder="Enter phone number (optional)"
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label>Role</Label>
                                    <Input
                                        value={formData.role}
                                        onChange={(e) => handleChange("role", e.target.value)}
                                        placeholder="Enter role"
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label>Industry</Label>
                                    <Input
                                        value={formData.industry}
                                        onChange={(e) => handleChange("industry", e.target.value)}
                                        placeholder="Enter industry"
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label>Location</Label>
                                    <Input
                                        value={formData.location}
                                        onChange={(e) => handleChange("location", e.target.value)}
                                        placeholder="Enter location"
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label>Instagram Link</Label>
                                    <Input
                                        value={formData.instagramLink}
                                        onChange={(e) => handleChange("instagramLink", e.target.value)}
                                        placeholder="Enter Instagram URL"
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label>Website Link</Label>
                                    <Input
                                        value={formData.websiteLink}
                                        onChange={(e) => handleChange("websiteLink", e.target.value)}
                                        placeholder="Enter website URL"
                                    />
                                </div>

                                {/* LEAD FIELDS - Below Client Fields */}
                                <div className="col-span-full mt-4">
                                    <h3 className="text-sm font-semibold text-gray-700 mb-2 border-b pb-1">Lead Details</h3>
                                </div>

                                <div className="grid gap-2">
                                    <Label>Service Type *</Label>
                                    <Select
                                        value={formData.serviceType?.length > 0 ? formData.serviceType[0] : ""}
                                        onValueChange={(value) => {
                                            setFormData((prev) => {
                                                const current = prev.serviceType || [];
                                                if (current.includes(value)) {
                                                    return { ...prev, serviceType: current.filter((v) => v !== value) };
                                                } else {
                                                    return { ...prev, serviceType: [...current, value] };
                                                }
                                            });
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Service Type">
                                                {formData.serviceType?.length > 0 
                                                    ? `${formData.serviceType.length} selected` 
                                                    : "Select Service Type"}
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {serviceOptions.map((option) => (
                                                <SelectItem key={option} value={option}>
                                                    <div className="flex items-center gap-2">
                                                        <Checkbox
                                                            checked={formData.serviceType.includes(option)}
                                                            className="h-4 w-4"
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                        {option}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid gap-2">
                                    <Label>Lead Source *</Label>
                                    <Select
                                        value={formData.leadSourceType}
                                        onValueChange={(v) => handleChange("leadSourceType", v)}
                                    >
                                        <SelectTrigger>
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

                                <div className="grid gap-2">
                                    <Label>Lead Status *</Label>
                                    <Select
                                        value={formData.leadStatusType}
                                        onValueChange={(v) => handleChange("leadStatusType", v)}
                                    >
                                        <SelectTrigger>
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
                                                "Won",
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

                                <div className="grid gap-2">
                                    <Label>Priority</Label>
                                    <Select
                                        value={formData.priority}
                                        onValueChange={(v) => handleChange("priority", v)}
                                    >
                                        <SelectTrigger>
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

                                <div className="grid gap-2">
                                    <Label>Project Account Handled By</Label>
                                    <Select
                                        value={formData.projectAccountHandledBy}
                                        onValueChange={(v) => handleChange("projectAccountHandledBy", v)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Account Handler" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Arsalan">Arsalan</SelectItem>
                                            <SelectItem value="Fardeen">Fardeen</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid gap-2">
                                    <Label>Team Assigned</Label>
                                    <Select
                                        value={formData.teamAssigned}
                                        onValueChange={(v) => handleChange("teamAssigned", v)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Team" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.keys(teamOptions).map((team) => (
                                                <SelectItem key={team} value={team}>
                                                    {team}
                                                </SelectItem>
                                            ))}
                                            {formData.teamAssigned && !teamOptions[formData.teamAssigned] && (
                                                <SelectItem value={formData.teamAssigned}>{formData.teamAssigned}</SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {formData.teamAssigned && (
                                    <div className="grid gap-2">
                                        <Label>{formData.teamAssigned} Members</Label>
                                        <Select
                                            value={formData.teamMember}
                                            onValueChange={(v) => handleChange("teamMember", v)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Team Member" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {teamOptions[formData.teamAssigned]?.map((member) => (
                                                    <SelectItem key={member.value} value={member.value}>
                                                        {member.label}
                                                    </SelectItem>
                                                ))}
                                                {formData.teamMember && !teamOptions[formData.teamAssigned]?.some((m) => m.value === formData.teamMember) && (
                                                    <SelectItem value={formData.teamMember}>{formData.teamMember}</SelectItem>
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                <div className="grid gap-2">
                                    <Label>Proposal Sent?</Label>
                                    <Select
                                        value={formData.proposalSent}
                                        onValueChange={(v) => handleChange("proposalSent", v)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Option" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Yes">Yes</SelectItem>
                                            <SelectItem value="No">No</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid gap-2">
                                    <Label>Converted to Project?</Label>
                                    <Select
                                        value={formData.convertedToProject}
                                        onValueChange={(v) => handleChange("convertedToProject", v)}
                                    >
                                        <SelectTrigger>
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
                                    <Label>Documents</Label>
                                    <Input
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

                            <DialogFooter className="flex flex-col justify-end gap-2 mt-6 sm:flex-row sm:gap-4">
                                <Button
                                    type="submit"
                                    className="w-full bg-blue-600 text-white hover:bg-blue-700 sm:w-auto"
                                    disabled={loading}
                                >
                                    {loading ? "Processing..." : (isEditMode ? "Update Lead" : "Create Lead")}
                                </Button>
                            </DialogFooter>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Won Stage Popup */}
            <Dialog open={showWonPopup} onOpenChange={setShowWonPopup}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-semibold text-green-600">
                            🎉 Won Stage Selected
                        </DialogTitle>
                        <DialogDescription>
                            This lead is marked as <span className="font-bold text-green-600">Won</span>. 
                            A new client entry will be created in the Client List with the following information:
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                            <p><span className="font-medium">Brand Name:</span> {pendingSubmitData?.brandName}</p>
                            <p><span className="font-medium">Contact Person:</span> {pendingSubmitData?.contactPerson}</p>
                            <p><span className="font-medium">Email:</span> {pendingSubmitData?.email}</p>
                            <p><span className="font-medium">Phone:</span> {pendingSubmitData?.phone}</p>
                            {pendingSubmitData?.role && <p><span className="font-medium">Role:</span> {pendingSubmitData?.role}</p>}
                            {pendingSubmitData?.industry && <p><span className="font-medium">Industry:</span> {pendingSubmitData?.industry}</p>}
                            {pendingSubmitData?.location && <p><span className="font-medium">Location:</span> {pendingSubmitData?.location}</p>}
                            {pendingSubmitData?.instagramLink && <p><span className="font-medium">Instagram:</span> {pendingSubmitData?.instagramLink}</p>}
                            {pendingSubmitData?.websiteLink && <p><span className="font-medium">Website:</span> {pendingSubmitData?.websiteLink}</p>}
                            <p className="text-xs text-gray-500 mt-2">This will create a new entry in the Client List.</p>
                        </div>
                    </div>
                    <DialogFooter className="flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleWonCancel}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={handleWonConfirm}
                        >
                            Yes, Create Client & Lead
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default AddLeadsDialog;