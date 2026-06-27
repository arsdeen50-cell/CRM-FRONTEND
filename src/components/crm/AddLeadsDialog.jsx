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

const AddLeadsDialog = ({ open, onOpenChange, onCreate, editData }) => {
    const isEditMode = !!editData;
    const { user } = useSelector((state) => state.auth);
    const currentUser = user?.fullname || "Unknown";

    // Lead Details Form (Step 2 only)
    const [formData, setFormData] = useState({
        clientId: "",
        clientName: "",
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
    const [clients, setClients] = useState([]);
    const [loadingClients, setLoadingClients] = useState(false);
    
    // Activity Logs
    const [activityLogs, setActivityLogs] = useState([]);
    const [loadingLogs, setLoadingLogs] = useState(false);

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

    // Fetch clients for dropdown
    const fetchClients = async () => {
        try {
            setLoadingClients(true);
            const res = await axiosInstance.get("/v1/leadclient");
            setClients(res.data?.clients || []);
        } catch (err) {
            toast.error("Failed to fetch clients");
            console.error("Fetch clients error:", err);
        } finally {
            setLoadingClients(false);
        }
    };

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
            fetchClients();
            if (isEditMode && editData?._id) {
                fetchActivityLogs(editData._id);
            }
        }
    }, [open, isEditMode, editData]);

    // Handle Edit and Reset states
    useEffect(() => {
        if (isEditMode && editData) {
            setFormData({
                clientId: editData.clientId || "",
                clientName: editData.clientName || "",
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
                clientId: "",
                clientName: "",
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
        }
    }, [editData, isEditMode, open, currentUser]);

    const handleChange = (field, value) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
            ...(field === "teamAssigned" ? { teamMember: "" } : {}),
        }));
    };

    // Handle client selection from dropdown
    const handleClientChange = (clientId) => {
        const selectedClient = clients.find(c => c._id === clientId);
        if (selectedClient) {
            setFormData((prev) => ({
                ...prev,
                clientId: selectedClient._id,
                clientName: selectedClient.brandName,
            }));
        }
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

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.clientId) {
            toast.error("Please select a client from the dropdown");
            return;
        }

        if (!formData.serviceType.length || !formData.leadSourceType || !formData.leadStatusType) {
            toast.error("Please fill in required fields: Service Type, Lead Source, and Lead Status");
            return;
        }

        try {
            const submitData = new FormData();

            // Append client info
            if (formData.clientId) {
                submitData.append('clientId', formData.clientId);
            }
            if (formData.clientName) {
                submitData.append('clientName', formData.clientName);
            }

            // Append all form fields
            Object.keys(formData).forEach(key => {
                if (key === 'serviceType') {
                    formData.serviceType.forEach(value => {
                        submitData.append('serviceType', value);
                    });
                } else if (!['clientId', 'clientName'].includes(key)) {
                    submitData.append(key, formData[key]);
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
                    clientId: "",
                    clientName: "",
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

        } catch (error) {
            console.error("Error submitting lead:", error);
        }
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
                                : "Select a client and fill in the lead details below."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Client Dropdown - Shows existing clients from other module */}
                            <div className="grid gap-2">
                                <Label>Select Client *</Label>
                                <div className="flex gap-2">
                                    <Select
                                        value={formData.clientId || ""}
                                        onValueChange={handleClientChange}
                                        disabled={isEditMode}
                                    >
                                        <SelectTrigger className="flex-1">
                                            <SelectValue placeholder="Select Client">
                                                {formData.clientName && (
                                                    <span className="font-medium">{formData.clientName}</span>
                                                )}
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {clients.length === 0 ? (
                                                <div className="p-2 text-sm text-gray-500 text-center">
                                                    No clients available. Please create a client first.
                                                </div>
                                            ) : (
                                                clients.map((client) => (
                                                    <SelectItem key={client._id} value={client._id}>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">{client.brandName}</span>
                                                            <span className="text-xs text-gray-500">
                                                                {client.contactPerson} • {client.email}
                                                            </span>
                                                        </div>
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        onClick={() => {
                                            fetchClients();
                                            toast.success("Clients refreshed");
                                        }}
                                        disabled={loadingClients}
                                        className="flex-shrink-0"
                                    >
                                        <RefreshCw className={`h-4 w-4 ${loadingClients ? 'animate-spin' : ''}`} />
                                    </Button>
                                </div>
                                {formData.clientId && (
                                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                                        <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                                        Selected: <span className="font-medium">{formData.clientName}</span>
                                    </p>
                                )}
                                {!formData.clientId && !isEditMode && (
                                    <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                                        <span className="inline-block w-2 h-2 bg-amber-500 rounded-full"></span>
                                        Please select a client
                                    </p>
                                )}
                            </div>

                           {/* Service Type - Alternative using Select */}
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
                                                <SelectItem key={member} value={member}>
                                                    {member}
                                                </SelectItem>
                                            ))}
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

                            {/* ACTIVITY LOGS SECTION - Shown below the form */}
                            {/* {isEditMode && (
                                <div className="col-span-full mt-6 pt-4 border-t">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Clock className="h-5 w-5 text-gray-600" />
                                        <h3 className="text-lg font-semibold">Activity Logs</h3>
                                        <span className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                            {activityLogs.length}
                                        </span>
                                    </div>
                                    
                                    {loadingLogs ? (
                                        <div className="text-center py-4 text-gray-500">
                                            Loading activity logs...
                                        </div>
                                    ) : activityLogs.length === 0 ? (
                                        <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-lg border border-dashed">
                                            <Clock className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                                            <p>No activity logs yet</p>
                                            <p className="text-xs">Activities will appear here as they are logged</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                                            {activityLogs.map((log, index) => (
                                                <div 
                                                    key={index} 
                                                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                                >
                                                    <div className="mt-0.5">
                                                        {getActivityIcon(log.type)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between">
                                                            <span className="font-medium text-sm">
                                                                {log.type || "Note"}
                                                            </span>
                                                            <span className="text-xs text-gray-400">
                                                                {formatDate(log.loggedAt)}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-gray-700 mt-1 break-words">
                                                            {log.note || "No details provided"}
                                                        </p>
                                                        {log.loggedBy && (
                                                            <p className="text-xs text-gray-400 mt-1">
                                                                By: {log.loggedBy}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )} */}
                        </div>

                        <DialogFooter className="flex flex-col justify-end gap-2 mt-6 sm:flex-row sm:gap-4">
                            <Button
                                type="submit"
                                className="w-full bg-blue-600 text-white hover:bg-blue-700 sm:w-auto"
                            >
                                {isEditMode ? "Update Lead" : "Create Lead"}
                            </Button>
                        </DialogFooter>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default AddLeadsDialog;