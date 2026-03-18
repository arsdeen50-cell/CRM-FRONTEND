import React from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { FileText, FileImage } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import ExistingFilePreview from "./ExistingFilePreview";

const InfoItem = ({ label, value }) => (
    <div className="bg-gray-50 p-3 rounded-lg border">
        <p className="text-sm text-gray-500">{label}</p>
        <p className="font-medium text-gray-800">{value || "Not provided"}</p>
    </div>
);

const CandidateInfoCard = ({ candidateData }) => {
    if (!candidateData) return null;

    const [previewUrl, setPreviewUrl] = React.useState(null);
    const [previewOpen, setPreviewOpen] = React.useState(false);
    const [previewFileName, setPreviewFileName] = React.useState("");

    const handlePreview = (fileUrl, fileName) => {
        setPreviewUrl(fileUrl);
        setPreviewFileName(fileName);
        setPreviewOpen(true);
    };

    const handleDownload = (fileUrl, fileName) => {
        const link = document.createElement("a");
        link.href = fileUrl;
        link.download = fileName;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const hasBankingInfo =
        candidateData.uanNo ||
        candidateData.bankName ||
        candidateData.esic ||
        candidateData.bankAccountNo ||
        candidateData.branchName ||
        candidateData.IfcCode;

    const hasDocuments =
        candidateData.chequePassBookImage ||
        (candidateData.educationCertificateImage &&
            candidateData.educationCertificateImage.length > 0) ||
        (candidateData.previousEmployeImage &&
            candidateData.previousEmployeImage.length > 0);

    return (
        <>
            <Card className="w-full max-w-6xl mx-auto shadow-lg">
                <CardHeader className="border-b bg-gradient-to-r from-indigo-50 to-teal-50">
                    <CardTitle className="text-xl font-semibold">
                        Candidate Additional Details
                    </CardTitle>
                    <CardDescription>
                        Banking, statutory, and document details submitted by the candidate
                    </CardDescription>
                </CardHeader>

                <CardContent className="p-6 space-y-6">
                    {/* Banking Info */}
                    {hasBankingInfo && (
                        <section>
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-indigo-700">
                                <FileText className="h-5 w-5" />
                                Banking & Statutory Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <InfoItem label="UAN Number" value={candidateData.uanNo} />
                                <InfoItem label="ESIC Number" value={candidateData.esic} />
                                <InfoItem label="Bank Name" value={candidateData.bankName} />
                                <InfoItem
                                    label="Account Number"
                                    value={candidateData.bankAccountNo}
                                />
                                <InfoItem label="Branch Name" value={candidateData.branchName} />
                                <InfoItem label="IFSC Code" value={candidateData.IfcCode} />
                                {candidateData.emergencyContactName && (
                                    <InfoItem
                                        label="Emergency Contact"
                                        value={`${candidateData.emergencyContactName} - ${candidateData.emergencyContactNo}`}
                                    />
                                )}
                            </div>
                        </section>
                    )}

                    {/* Documents Section */}
                    {hasDocuments && (
                        <section>
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-teal-700">
                                <FileImage className="h-5 w-5" />
                                Submitted Documents
                            </h3>

                            <div className="flex flex-row flex-wrap gap-8">
                                {/* Cheque / Passbook */}
                                {candidateData.chequePassBookImage && (
                                    <div className="flex flex-col">
                                        <h4 className="font-medium mb-2 text-gray-800">
                                            Cheque / Passbook
                                        </h4>
                                        <div className="flex flex-row flex-wrap gap-3">
                                            <ExistingFilePreview
                                                file={candidateData.chequePassBookImage}
                                                index={0}
                                                onPreview={(url, name) => handlePreview(url, name)}
                                                onRemove={() => { }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Education Certificates */}
                                {candidateData.educationCertificateImage?.length > 0 && (
                                    <div className="flex flex-col">
                                        <h4 className="font-medium mb-2 text-gray-800">
                                            Education Certificates
                                        </h4>
                                        <div className="flex flex-row flex-wrap gap-3">
                                            {candidateData.educationCertificateImage.map((doc, index) => (
                                                <ExistingFilePreview
                                                    key={doc._id || index}
                                                    file={doc}
                                                    index={index}
                                                    onPreview={(url, name) => handlePreview(url, name)}
                                                    onRemove={() => { }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Previous Employment Documents */}
                                {candidateData.previousEmployeImage?.length > 0 && (
                                    <div className="flex flex-col">
                                        <h4 className="font-medium mb-2 text-gray-800">
                                            Previous Employment Documents
                                        </h4>
                                        <div className="flex flex-row flex-wrap gap-3">
                                            {candidateData.previousEmployeImage.map((doc, index) => (
                                                <ExistingFilePreview
                                                    key={doc._id || index}
                                                    file={doc}
                                                    index={index}
                                                    onPreview={(url, name) => handlePreview(url, name)}
                                                    onRemove={() => { }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>
                    )}

                </CardContent>
            </Card>

            {/* Preview Dialog */}
            <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>{previewFileName}</DialogTitle>
                    </DialogHeader>
                    {previewUrl && (
                        <div className="mt-4 flex justify-center">
                            {/\.(jpg|jpeg|png|gif|webp)$/i.test(previewFileName) ? (
                                <img
                                    src={previewUrl}
                                    alt={previewFileName}
                                    className="max-h-[70vh] rounded-lg border"
                                />
                            ) : (
                                <iframe
                                    src={previewUrl}
                                    title={previewFileName}
                                    className="w-full h-[70vh] border rounded-lg"
                                />
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
};

export default CandidateInfoCard;
