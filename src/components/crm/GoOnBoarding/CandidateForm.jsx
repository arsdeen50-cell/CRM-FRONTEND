// components/CandidateForm.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useParams, useNavigate } from "react-router-dom";
import FilePreview from "./FilePreview";
import { ONBOARDING_API_END_POINT } from "@/constants";

const CandidateForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [candidateData, setCandidateData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Form states
  const [uanNo, setUanNo] = useState("");
  const [esic, setEsic] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccountNo, setBankAccountNo] = useState("");
  const [branchName, setBranchName] = useState("");
  const [IfcCode, setIfcCode] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactNo, setEmergencyContactNo] = useState("");

  // File states
  const [chequePassBookImage, setChequePassBookImage] = useState(null);
  const [educationCertificateImages, setEducationCertificateImages] = useState([]);
  const [previousEmployeImages, setPreviousEmployeImages] = useState([]);

  const handleMultipleFileUpload = (files, setter) => {
    if (files && files.length > 0) {
      setter(prev => [...prev, ...Array.from(files)]);
    }
  };
  
  const removeFile = (index, setter, files) => {
    setter(files.filter((_, i) => i !== index));
  };

  // Fetch candidate data (Axios)
  useEffect(() => {
    const fetchCandidateData = async () => {
      try {
        const { data } = await axios.get(`${ONBOARDING_API_END_POINT}/${id}`);
        if (data.success) {
          setCandidateData(data.onboarding);

          if (data.onboarding.candidateFormSubmitted) {
            setIsSubmitted(true);
          }
        }
      } catch (error) {
        console.error("Error fetching candidate data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchCandidateData();
  }, [id]);

  // File handling
  const handleFileUpload = (file, setter) => {
    if (file) setter(file);
  };

  // Handle form submission (Axios)
  const handleSubmit = async (e) => {
  e.preventDefault();
  setIsSubmitting(true);

  const formData = new FormData();
  formData.append("uanNo", uanNo);
  formData.append("esic", esic);
  formData.append("bankName", bankName);
  formData.append("bankAccountNo", bankAccountNo);
  formData.append("branchName", branchName);
  formData.append("IfcCode", IfcCode);
  formData.append("emergencyContactName", emergencyContactName);
  formData.append("emergencyContactNo", emergencyContactNo);
  formData.append("candidateFormSubmitted", "true");
  formData.append("candidateFormSubmittedAt", new Date().toISOString());
  formData.append("candidateStatus", "Documents Submitted");

  // Single file
  if (chequePassBookImage)
    formData.append("chequePassBookImage", chequePassBookImage);

  // Multiple files - append each one
  educationCertificateImages.forEach((file, index) => {
    formData.append("educationCertificateImage", file);
  });

  previousEmployeImages.forEach((file, index) => {
    formData.append("previousEmployeImage", file);
  });

  try {
    const { data } = await axios.put(`${ONBOARDING_API_END_POINT}/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    if (data.success) {
      setIsSubmitted(true);
    } else {
      alert("Failed to submit form. Please try again.");
    }
  } catch (error) {
    console.error("Error submitting form:", error);
    alert("Error submitting form. Please try again.");
  } finally {
    setIsSubmitting(false);
  }
};
  

  // Loading State
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <p className="text-lg">Loading candidate information...</p>
      </div>
    );
  }

  // Candidate not found
  if (!candidateData) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-lg text-red-600">Candidate not found</p>
          {/* <Button onClick={() => navigate("/")} className="mt-4">
            Go Home
          </Button> */}
        </div>
      </div>
    );
  }

  // Form Submitted State
  if (isSubmitted) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              Form Submitted Successfully!
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Thank you for submitting your details. Your information has been received and will be processed shortly.
            </p>
            {/* <Button onClick={() => navigate("/")} className="mt-6">
              Close
            </Button> */}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="text-center border-b">
            <CardTitle className="text-2xl">Candidate Information Form</CardTitle>
            <CardDescription>
              Please fill in your complete details for onboarding process
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6">
            {/* Candidate Info */}
            <div className="mb-8 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">Candidate Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Candidate Name</Label>
                  <p className="text-lg font-semibold">{candidateData.candidateName}</p>
                </div>
                <div>
                  <Label>Email</Label>
                  <p className="text-lg font-semibold">{candidateData.email}</p>
                </div>
                <div>
                  <Label>Designation</Label>
                  <p className="text-lg font-semibold">{candidateData.designation}</p>
                </div>
                <div>
                  <Label>Mobile No</Label>
                  <p className="text-lg font-semibold">{candidateData.mobileNo}</p>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Banking Info */}
              <section className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">
                  Banking Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="uanNo">UAN Number</Label>
                    <Input id="uanNo" value={uanNo} onChange={(e) => setUanNo(e.target.value)} placeholder="Enter UAN number" />
                  </div>
                  <div>
                    <Label htmlFor="esic">ESIC Number</Label>
                    <Input id="esic" value={esic} onChange={(e) => setEsic(e.target.value)} placeholder="Enter ESIC number" />
                  </div>
                  <div>
                    <Label htmlFor="bankName">Bank Name</Label>
                    <Input id="bankName" value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="Enter bank name" required />
                  </div>
                  <div>
                    <Label htmlFor="bankAccountNo">Bank Account Number</Label>
                    <Input id="bankAccountNo" value={bankAccountNo} onChange={(e) => setBankAccountNo(e.target.value)} placeholder="Enter account number" required />
                  </div>
                  <div>
                    <Label htmlFor="branchName">Branch Name</Label>
                    <Input id="branchName" value={branchName} onChange={(e) => setBranchName(e.target.value)} placeholder="Enter branch name" required />
                  </div>
                  <div>
                    <Label htmlFor="IfcCode">IFC Code</Label>
                    <Input id="IfcCode" value={IfcCode} onChange={(e) => setIfcCode(e.target.value)} placeholder="Enter IFC code" required />
                  </div>
                </div>
              </section>

              {/* Emergency Contact */}
              <section className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Emergency Contact</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="emergencyContactName">Name</Label>
                    <Input id="emergencyContactName" value={emergencyContactName} onChange={(e) => setEmergencyContactName(e.target.value)} placeholder="Enter name" required />
                  </div>
                  <div>
                    <Label htmlFor="emergencyContactNo">Contact Number</Label>
                    <Input id="emergencyContactNo" value={emergencyContactNo} onChange={(e) => setEmergencyContactNo(e.target.value)} placeholder="Enter number" required />
                  </div>
                </div>
              </section>

             {/* Documents */}
<section className="space-y-4">
  <h3 className="text-lg font-semibold border-b pb-2">Required Documents</h3>
  <div className="grid grid-cols-1 gap-6">
    <div>
      <Label>Cheque/Passbook Image</Label>
      <Input type="file" accept="image/*" onChange={(e) => handleFileUpload(e.target.files[0], setChequePassBookImage)} required />
      {chequePassBookImage && <FilePreview file={chequePassBookImage} onRemove={() => removeFile(setChequePassBookImage)} />}
    </div>
    <div>
      <Label>Education Certificate (Multiple files allowed)</Label>
      <Input 
        type="file" 
        accept="image/*,.pdf" 
        multiple 
        onChange={(e) => handleMultipleFileUpload(e.target.files, setEducationCertificateImages)} 
        required 
      />
      {educationCertificateImages.map((file, index) => (
        <FilePreview 
          key={index} 
          file={file} 
          onRemove={() => removeFile(index, setEducationCertificateImages, educationCertificateImages)} 
        />
      ))}
    </div>
    <div>
      <Label>Previous Employment Proof (Multiple files allowed, optional)</Label>
      <Input 
        type="file" 
        accept="image/*,.pdf" 
        multiple 
        onChange={(e) => handleMultipleFileUpload(e.target.files, setPreviousEmployeImages)} 
      />
      {previousEmployeImages.map((file, index) => (
        <FilePreview 
          key={index} 
          file={file} 
          onRemove={() => removeFile(index, setPreviousEmployeImages, previousEmployeImages)} 
        />
      ))}
    </div>
  </div>
</section>

              <div className="flex justify-center pt-6">
                <Button type="submit" size="lg" disabled={isSubmitting} className="w-full md:w-auto px-8">
                  {isSubmitting ? "Submitting..." : "Submit Form"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CandidateForm;
