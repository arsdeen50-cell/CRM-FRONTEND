// components/DesignationManager.jsx
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Plus } from "lucide-react";
import useDesignation from "@/hooks/useDesignation";
import { toast } from "sonner";
import { confirmDialog } from "@/components/ui/app-dialogs";

const DesignationManager = ({ isOpen, onClose }) => {
  const [newDesignation, setNewDesignation] = useState("");
  const { designations, loading, fetchDesignations, createDesignation, deleteDesignation } = useDesignation();

  useEffect(() => {
    if (isOpen) {
      fetchDesignations();
    }
  }, [isOpen]);

  const handleAddDesignation = async () => {
    if (!newDesignation.trim()) {
      toast.error("Please enter a designation name");
      return;
    }

    try {
      await createDesignation(newDesignation.trim());
      setNewDesignation("");
    } catch (error) {
      // Error is handled in the hook
    }
  };

  const handleDeleteDesignation = async (id, name) => {
    if (await confirmDialog(`Are you sure you want to delete "${name}"?`)) {
      await deleteDesignation(id);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Designations</DialogTitle>
          <DialogDescription>
            Add or remove designations for the onboarding process.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add Designation Input */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Enter designation name..."
                value={newDesignation}
                onChange={(e) => setNewDesignation(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleAddDesignation();
                  }
                }}
                disabled={loading}
              />
            </div>
            <Button onClick={handleAddDesignation} disabled={loading}>
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>

          {/* Designation List */}
          <div className="max-h-60 overflow-y-auto border rounded-md p-2">
            {loading ? (
              <p className="text-center text-muted-foreground py-4">Loading...</p>
            ) : designations.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No designations added yet.</p>
            ) : (
              <div className="space-y-2">
                {designations.map((designation) => (
                  <div
                    key={designation._id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded-md hover:bg-gray-100"
                  >
                    <span className="text-sm font-medium">{designation.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteDesignation(designation._id, designation.name)}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DesignationManager;