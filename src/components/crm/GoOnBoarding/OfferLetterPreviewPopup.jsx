import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const OfferLetterPreviewPopup = ({ 
  isOpen, 
  onClose, 
  pdfUrl,
  isLoading = false 
}) => {
  const handleDownload = () => {
    if (pdfUrl) {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = 'offer_letter_preview.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Offer Letter Preview</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col h-full">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-lg">Generating offer letter preview...</p>
            </div>
          ) : pdfUrl ? (
            <>
              <Card className="flex-1 overflow-hidden">
                <CardContent className="p-0 h-full">
                  <iframe 
                    src={pdfUrl} 
                    className="w-full h-full min-h-[500px] border-0"
                    title="Offer Letter Preview"
                  />
                </CardContent>
              </Card>
              
              <div className="flex justify-end gap-3 mt-4">
                <Button variant="outline" onClick={handleDownload}>
                  Download PDF
                </Button>
                <Button onClick={onClose}>
                  Close
                </Button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-64">
              <p className="text-lg text-red-500">Failed to load offer letter preview</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OfferLetterPreviewPopup;