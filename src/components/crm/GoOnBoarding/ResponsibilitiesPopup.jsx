import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

const ResponsibilitiesPopup = ({ 
  isOpen, 
  onClose, 
  onSave, 
  title, 
  initialData = [],
  fieldName 
}) => {
  const [items, setItems] = useState(initialData.length > 0 ? initialData : Array(6).fill(""));
  const [preview, setPreview] = useState(false);

  const handleItemChange = (index, value) => {
    const newItems = [...items];
    newItems[index] = value;
    setItems(newItems);
  };

  const handleSave = () => {
    // Filter out empty items
    const filteredItems = items.filter(item => item.trim() !== "");
    onSave(filteredItems);
    onClose();
  };

  const handlePreview = () => {
    setPreview(!preview);
  };

  const addMoreFields = () => {
    setItems([...items, ""]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {!preview ? (
          <div className="space-y-4">
            {/* <div className="flex justify-between items-center">
              <Label>Enter {title} (one per line):</Label>
              <Button type="button" variant="outline" size="sm" onClick={addMoreFields}>
                Add More
              </Button>
            </div> */}
            
            {items.map((item, index) => (
              <div key={index} className="space-y-2">
                <Label htmlFor={`item-${index}`}>Point {index + 1}</Label>
                <Input
                  id={`item-${index}`}
                  value={item}
                  onChange={(e) => handleItemChange(index, e.target.value)}
                  placeholder={`Enter ${title.toLowerCase()} point ${index + 1}`}
                />
              </div>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <h4 className="font-semibold mb-4">Preview:</h4>
              <ul className="list-disc list-inside space-y-2">
                {items.filter(item => item.trim() !== "").map((item, index) => (
                  <li key={index} className="text-sm">{item}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <DialogFooter className="flex justify-between">
          <div className="space-x-2">
            <Button type="button" variant="outline" onClick={handlePreview}>
              {preview ? "Edit" : "Preview"}
            </Button>
          </div>
          <div className="space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSave}>
              Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ResponsibilitiesPopup;