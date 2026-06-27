import React, { useEffect, useState, useMemo } from "react";
import { useSelector } from "react-redux";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Search,
  Download,
  Edit,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import axiosInstance from "@/utils/axiosConfig";

const LeadClientList = () => {
  const { user } = useSelector((state) => state.auth);
  const currentUser = user?.fullname || "Unknown";

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [formData, setFormData] = useState({
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
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch clients
  const fetchClients = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/v1/leadclient");
      setClients(res.data?.clients || []);
    } catch (err) {
      toast.error("Failed to fetch clients");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  // Filter clients
  const filteredClients = useMemo(() => {
    if (!searchTerm) return clients;
    const lower = searchTerm.toLowerCase();
    return clients.filter(
      (client) =>
        client.brandName?.toLowerCase().includes(lower) ||
        client.contactPerson?.toLowerCase().includes(lower) ||
        client.email?.toLowerCase().includes(lower) ||
        client.phone?.includes(searchTerm) ||
        client.leadId?.toLowerCase().includes(lower)
    );
  }, [clients, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const paginatedClients = filteredClients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.brandName || !formData.contactPerson || !formData.email || !formData.phone) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const payload = {
        ...formData,
        createdBy: editingClient ? editingClient.createdBy : currentUser,
        updatedBy: editingClient ? currentUser : undefined,
      };

      if (editingClient) {
        await axiosInstance.put(`/v1/leadclient/${editingClient._id}`, payload);
        toast.success("Client updated successfully");
      } else {
        await axiosInstance.post("/v1/leadclient", payload);
        toast.success("Client created successfully");
      }
      fetchClients();
      handleCloseModal();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save client");
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this client?")) return;
    try {
      await axiosInstance.delete(`/v1/leadclient/${id}`);
      toast.success("Client deleted successfully");
      fetchClients();
    } catch (err) {
      toast.error("Failed to delete client");
    }
  };

  // Handle edit
  const handleEdit = (client) => {
    setEditingClient(client);
    setFormData({
      leadInformation: client.leadInformation || "",
      brandName: client.brandName || "",
      contactPerson: client.contactPerson || "",
      email: client.email || "",
      phone: client.phone || "",
      role: client.role || "",
      industry: client.industry || "",
      location: client.location || "",
      instagramLink: client.instagramLink || "",
      websiteLink: client.websiteLink || "",
    });
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setEditingClient(null);
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
    });
  };

  // Export
  const handleExport = () => {
    const headers = [
      "Lead ID",
      "Brand Name",
      "Contact Person",
      "Email",
      "Phone",
      "Role",
      "Industry",
      "Location",
      "Instagram",
      "Website",
      "Lead Information",
      "Created At",
    ];

    const rows = filteredClients.map((client) => [
      client.leadId || "",
      client.brandName || "",
      client.contactPerson || "",
      client.email || "",
      client.phone || "",
      client.role || "",
      client.industry || "",
      client.location || "",
      client.instagramLink || "",
      client.websiteLink || "",
      client.leadInformation || "",
      client.createdAt ? new Date(client.createdAt).toLocaleDateString() : "",
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `lead-clients-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4">
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">Client List</h2>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-[250px]"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
            <Button variant="outline" onClick={handleExport} disabled={filteredClients.length === 0}>
              <Download className="h-4 w-4 mr-2" /> Export
            </Button>
            <Button
              onClick={() => {
                setEditingClient(null);
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
                });
                setOpenModal(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" /> Add Client
            </Button>
          </div>
        </div>
        <div className="text-sm text-gray-500 mt-2">
          Showing {filteredClients.length} clients
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center p-8">Loading clients...</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lead ID</TableHead>
                    <TableHead>Brand Name</TableHead>
                    <TableHead>Contact Person</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedClients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        No clients found
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedClients.map((client) => (
                      <TableRow key={client._id}>
                        <TableCell className="font-mono text-xs">{client.leadId}</TableCell>
                        <TableCell className="font-medium">{client.brandName}</TableCell>
                        <TableCell>{client.contactPerson}</TableCell>
                        <TableCell>{client.email}</TableCell>
                        <TableCell>{client.phone}</TableCell>
                        <TableCell>{client.location || "—"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-blue-600 hover:text-blue-800"
                              onClick={() => handleEdit(client)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-600 hover:text-red-800"
                              onClick={() => handleDelete(client._id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-3 py-4">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Client Modal - Client Information only */}
      <Dialog open={openModal} onOpenChange={handleCloseModal}>
        <DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingClient ? "Edit Client" : "Add New Client"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div className="col-span-full">
                <Label>Lead Information *</Label>
                <Input
                  value={formData.leadInformation}
                  onChange={(e) =>
                    setFormData({ ...formData, leadInformation: e.target.value })
                  }
                  placeholder="Enter lead information"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Brand Name *</Label>
                <Input
                  value={formData.brandName}
                  onChange={(e) =>
                    setFormData({ ...formData, brandName: e.target.value })
                  }
                  placeholder="Enter brand name"
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label>Contact Person *</Label>
                <Input
                  value={formData.contactPerson}
                  onChange={(e) =>
                    setFormData({ ...formData, contactPerson: e.target.value })
                  }
                  placeholder="Enter contact person name"
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="Enter email"
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label>Phone *</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="Enter phone number"
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label>Role</Label>
                <Input
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  placeholder="Enter role"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Industry</Label>
                <Input
                  value={formData.industry}
                  onChange={(e) =>
                    setFormData({ ...formData, industry: e.target.value })
                  }
                  placeholder="Enter industry"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Location</Label>
                <Input
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  placeholder="Enter location"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Instagram Link</Label>
                <Input
                  value={formData.instagramLink}
                  onChange={(e) =>
                    setFormData({ ...formData, instagramLink: e.target.value })
                  }
                  placeholder="Enter Instagram URL"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Website Link</Label>
                <Input
                  value={formData.websiteLink}
                  onChange={(e) =>
                    setFormData({ ...formData, websiteLink: e.target.value })
                  }
                  placeholder="Enter website URL"
                  className="mt-1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                {editingClient ? "Update" : "Create"} Client
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LeadClientList;