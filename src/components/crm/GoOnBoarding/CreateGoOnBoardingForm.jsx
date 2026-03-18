import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import useGoOnBoarding from "@/hooks/useGoOnBoarding";
import FilePreview from "./FilePreview";
import ResponsibilitiesPopup from "./ResponsibilitiesPopup";
import OfferLetterPreviewPopup from "./OfferLetterPreviewPopup";


const CreateGoOnBoardingForm = ({ onClose }) => {
    const navigate = useNavigate();
    const { createOnboarding, loading, previewOfferLetter } = useGoOnBoarding();

    // Personal Information
    const [recruiterName, setRecruiterName] = useState("");
    const [uploadProfile, setUploadProfile] = useState(null);
    const [candidateName, setCandidateName] = useState("");
    const [email, setEmail] = useState("");
    const [fatherName, setFatherName] = useState("");
    const [DOB, setDOB] = useState("");
    const [gender, setGender] = useState("");
    const [mobileNo, setMobileNo] = useState("");
    const [designation, setDesignation] = useState("");
    const [doj, setDoj] = useState("");
    const [doe, setDoe] = useState("");
    const [positionType, setPositionType] = useState("Full Time");
    const [currentAddress, setCurrentAddress] = useState("");
    const [permanentAddress, setPermanentAddress] = useState("");
    const [residingCity, setResidingCity] = useState("");
    const [residingState, setResidingState] = useState("");
    const [pincode, setPincode] = useState("");

    // Documents with preview support
    const [aadharFront, setAadharFront] = useState(null);
    const [aadharBack, setAadharBack] = useState(null);
    const [resume, setResume] = useState(null);
    const [lastThreeMonthSalary, setLastThreeMonthSalary] = useState([]);

    // Experience & CTC
    const [workExperience, setWorkExperience] = useState("");
    const [previousTotalCtc, setPreviousTotalCtc] = useState("");
    const [offeredFixedCtc, setOfferedFixedCtc] = useState("");
    const [offeredVariableCtc, setOfferedVariableCtc] = useState("");
    const [offeredTotalCtc, setOfferedTotalCtc] = useState("");
    const [candidateStatus, setCandidateStatus] = useState("Pending");

    
    // NEW FIELDS
    const [keyResponsibilities, setKeyResponsibilities] = useState([]);
    const [whatYoullGain, setWhatYoullGain] = useState([]);
    
    // POPUP STATES
    const [showResponsibilitiesPopup, setShowResponsibilitiesPopup] = useState(false);
    const [showWhatYoullGainPopup, setShowWhatYoullGainPopup] = useState(false);

    const [showOfferLetterPreview, setShowOfferLetterPreview] = useState(false);
    const [offerLetterPdfUrl, setOfferLetterPdfUrl] = useState(null);
    const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);

    useEffect(() => {
        const fixed = parseFloat(offeredFixedCtc) || 0;
        const variable = parseFloat(offeredVariableCtc) || 0;
        setOfferedTotalCtc(fixed + variable);
    }, [offeredFixedCtc, offeredVariableCtc]);

    useEffect(() => {
        return () => {
          if (offerLetterPdfUrl) {
            URL.revokeObjectURL(offerLetterPdfUrl);
          }
        };
      }, [offerLetterPdfUrl]);

    const handlePreviewOfferLetter = async () => {
        try {
          setIsGeneratingPreview(true);
          const pdfUrl = await previewOfferLetter(id);
          setOfferLetterPdfUrl(pdfUrl);
          setShowOfferLetterPreview(true);
        } catch (error) {
          console.error("Error generating offer letter preview:", error);
        } finally {
          setIsGeneratingPreview(false);
        }
      };

    // File handling functions
    const handleSingleFileUpload = (file, setter) => {
        if (file) {
            setter(file);
        }
    };

    const handleMultipleFileUpload = (files, setter) => {
        if (files && files.length > 0) {
            setter(prev => [...prev, ...Array.from(files)]);
        }
    };

    const removeSingleFile = (setter) => {
        setter(null);
    };

    const removeMultipleFile = (index, setter) => {
        if (typeof setter !== "function") return;
        setter(prev => prev.filter((_, i) => i !== index));
    };

    const handleResponsibilitiesSave = (responsibilities) => {
        setKeyResponsibilities(responsibilities);
    };

    const handleWhatYoullGainSave = (gains) => {
        setWhatYoullGain(gains);
    };

    // Submit handler
    const handleSubmit = async (e) => {
        e.preventDefault();

        const formData = new FormData();

        // Append text fields
        formData.append("recruiterName", recruiterName);
        formData.append("candidateName", candidateName);
        formData.append("email", email);
        formData.append("fatherName", fatherName);
        formData.append("DOB", DOB);
        formData.append("gender", gender);
        formData.append("mobileNo", mobileNo);
        formData.append("designation", designation);
        formData.append("doj", doj);
        formData.append("doe", doe);
        formData.append("positionType", positionType);
        formData.append("currentAddress", currentAddress);
        formData.append("permanentAddress", permanentAddress);
        formData.append("residingCity", residingCity);
        formData.append("residingState", residingState);
        formData.append("pincode", pincode);
        formData.append("workExperience", workExperience);
        formData.append("previousTotalCtc", previousTotalCtc);
        formData.append("offeredFixedCtc", offeredFixedCtc);
        formData.append("offeredVariableCtc", offeredVariableCtc);
        formData.append("offeredTotalCtc", offeredTotalCtc);
        formData.append("candidateStatus", candidateStatus);

        keyResponsibilities.forEach((responsibility, index) => {
            formData.append("keyResponsibilities", responsibility);
        });
        whatYoullGain.forEach((gain, index) => {
            formData.append("whatYoullGain", gain);
        });

        // Append single files
        if (uploadProfile) formData.append("uploadProfile", uploadProfile);
        if (aadharFront) formData.append("aadharFront", aadharFront);
        if (aadharBack) formData.append("aadharBack", aadharBack);
        if (resume) formData.append("resume", resume);

        // Append multiple files
        lastThreeMonthSalary.forEach((file, index) => {
            formData.append("lastThreeMonthSalary", file);
        });

        try {
            await createOnboarding(formData);
            navigate("/crm/goonboardingdata");
        } catch (error) {
            console.error("Error creating onboarding:", error);
        }
    };

    return (
        <div className="flex justify-center items-start py-10 bg-gray-50 min-h-screen overflow-y-auto">
            <div className="w-full max-w-4xl shadow-md">
                <CardHeader>
                    <CardTitle>Create New Onboarding</CardTitle>
                    <CardDescription>Fill in candidate details for onboarding process</CardDescription>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-8">

                        {/* Personal Information Section */}
                        <section className="space-y-4">
                            <h3 className="text-lg font-semibold">Personal Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label>Recruiter Name</Label>
                                    <Input value={recruiterName} onChange={(e) => setRecruiterName(e.target.value)} required />
                                </div>

                                <div>
                                    <Label>Profile Picture</Label>
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleSingleFileUpload(e.target.files[0], setUploadProfile)}
                                    />
                                    {uploadProfile && (
                                        <div className="mt-2">
                                            <FilePreview
                                                file={uploadProfile}
                                                onRemove={() => removeSingleFile(setUploadProfile)}
                                                index={0} // Add index for single files
                                            />
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <Label>Candidate Name</Label>
                                    <Input value={candidateName} onChange={(e) => setCandidateName(e.target.value)} required />
                                </div>

                                <div>
                                    <Label>Email</Label>
                                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                                </div>

                                <div>
                                    <Label>Father's Name</Label>
                                    <Input value={fatherName} onChange={(e) => setFatherName(e.target.value)} />
                                </div>

                                <div>
                                    <Label>Date of Birth</Label>
                                    <Input type="date" value={DOB} onChange={(e) => setDOB(e.target.value)} />
                                </div>

                                <div>
                                    <Label>Gender</Label>
                                    <Select onValueChange={setGender}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select gender" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Male">Male</SelectItem>
                                            <SelectItem value="Female">Female</SelectItem>
                                            <SelectItem value="Other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label>Mobile No</Label>
                                    <Input value={mobileNo} onChange={(e) => setMobileNo(e.target.value)} required />
                                </div>
                            </div>
                        </section>

                        {/* Professional Information */}
                        <section className="space-y-4">
                            <h3 className="text-lg font-semibold">Professional Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label>Designation</Label>
                                    <Input value={designation} onChange={(e) => setDesignation(e.target.value)} required />
                                </div>

                                <div>
                                    <Label>Date of Joining</Label>
                                    <Input type="date" value={doj} onChange={(e) => setDoj(e.target.value)} required />
                                </div>
                                <div>
                                    <Label>Date of Ending (DOE)</Label>
                                    <Input 
                                        type="date" 
                                        value={doe} 
                                        onChange={(e) => setDoe(e.target.value)} 
                                    />
                                </div>

                                <div>
                                    <Label>Position Type</Label>
                                    <Select value={positionType} onValueChange={setPositionType}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select position type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Full Time">Full Time</SelectItem>
                                            <SelectItem value="Internship">Internship</SelectItem>
                                            <SelectItem value="Contract">Contract</SelectItem>
                                            <SelectItem value="Part Time">Part Time</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                                    <div className="space-y-3">
                                        <Label>Key Responsibilities</Label>
                                        <div className="space-y-2">
                                            <Button 
                                                type="button" 
                                                variant="outline" 
                                                onClick={() => setShowResponsibilitiesPopup(true)}
                                                className="w-full"
                                            >
                                                Edit Key Responsibilities
                                            </Button>
                                            {keyResponsibilities.length > 0 && (
                                                <Card>
                                                    <CardContent className="pt-4">
                                                        <h4 className="font-semibold mb-2">Current Responsibilities:</h4>
                                                        <ul className="list-disc list-inside space-y-1 text-sm">
                                                            {keyResponsibilities.slice(0, 3).map((item, index) => (
                                                                <li key={index} className="truncate">{item}</li>
                                                            ))}
                                                            {keyResponsibilities.length > 3 && (
                                                                <li className="text-gray-500">+{keyResponsibilities.length - 3} more...</li>
                                                            )}
                                                        </ul>
                                                    </CardContent>
                                                </Card>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <Label>What You'll Gain</Label>
                                        <div className="space-y-2">
                                            <Button 
                                                type="button" 
                                                variant="outline" 
                                                onClick={() => setShowWhatYoullGainPopup(true)}
                                                className="w-full"
                                            >
                                                Edit What You'll Gain
                                            </Button>
                                            {whatYoullGain.length > 0 && (
                                                <Card>
                                                    <CardContent className="pt-4">
                                                        <h4 className="font-semibold mb-2">Current Benefits:</h4>
                                                        <ul className="list-disc list-inside space-y-1 text-sm">
                                                            {whatYoullGain.slice(0, 3).map((item, index) => (
                                                                <li key={index} className="truncate">{item}</li>
                                                            ))}
                                                            {whatYoullGain.length > 3 && (
                                                                <li className="text-gray-500">+{whatYoullGain.length - 3} more...</li>
                                                            )}
                                                        </ul>
                                                    </CardContent>
                                                </Card>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </section>

                        {/* Address Information */}
                        <section className="space-y-4">
                            <h3 className="text-lg font-semibold">Address Information</h3>
                            <div className="space-y-4">
                                <div>
                                    <Label>Current Address</Label>
                                    <Textarea
                                        value={currentAddress}
                                        onChange={(e) => setCurrentAddress(e.target.value)}
                                        rows={3}
                                    />
                                </div>

                                <div>
                                    <Label>Permanent Address</Label>
                                    <Textarea
                                        value={permanentAddress}
                                        onChange={(e) => setPermanentAddress(e.target.value)}
                                        rows={3}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <Label>City</Label>
                                        <Input value={residingCity} onChange={(e) => setResidingCity(e.target.value)} />
                                    </div>

                                    <div>
                                        <Label>State</Label>
                                        <Input value={residingState} onChange={(e) => setResidingState(e.target.value)} />
                                    </div>

                                    <div>
                                        <Label>Pincode</Label>
                                        <Input value={pincode} onChange={(e) => setPincode(e.target.value)} />
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Documents Section with Preview */}
                        <section className="space-y-4">
                            <h3 className="text-lg font-semibold">Document Uploads</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Aadhar Front */}
                                <div>
                                    <Label>Aadhar Front</Label>
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleSingleFileUpload(e.target.files[0], setAadharFront)}
                                    />
                                    {aadharFront && (
                                        <div className="mt-2">
                                            <FilePreview
                                                file={aadharFront}
                                                onRemove={() => removeSingleFile(setAadharFront)}
                                                index={0} // Add index for single files
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Aadhar Back */}
                                <div>
                                    <Label>Aadhar Back</Label>
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleSingleFileUpload(e.target.files[0], setAadharBack)}
                                    />
                                    {aadharBack && (
                                        <div className="mt-2">
                                            <FilePreview
                                                file={aadharBack}
                                                onRemove={() => removeSingleFile(setAadharBack)}
                                                index={0} // Add index for single files
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Resume */}
                                <div>
                                    <Label>Resume</Label>
                                    <Input
                                        type="file"
                                        accept=".pdf,.doc,.docx"
                                        onChange={(e) => handleSingleFileUpload(e.target.files[0], setResume)}
                                    />
                                    {resume && (
                                        <div className="mt-2">
                                            <FilePreview
                                                file={resume}
                                                onRemove={() => removeSingleFile(setResume)}
                                                index={0} // Add index for single files
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Last 3 Month Salary Slips (Multiple) */}
                                <div>
                                    <Label>Last 3 Month Salary Slips</Label>
                                    <Input
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        multiple
                                        onChange={(e) => handleMultipleFileUpload(e.target.files, setLastThreeMonthSalary)}
                                    />
                                    {lastThreeMonthSalary.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {lastThreeMonthSalary.map((file, index) => (
                                                <FilePreview
                                                    key={index}
                                                    file={file}
                                                    index={index}
                                                    onRemove={(i) => removeMultipleFile(i, setLastThreeMonthSalary)}
                                                />
                                            ))}
                                        </div>
                                    )}

                                </div>
                            </div>
                        </section>

                        {/* Experience & CTC Section */}
                        <section className="space-y-4">
                            <h3 className="text-lg font-semibold">Experience & CTC Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label>Work Experience (Years)</Label>
                                    <Input
                                        type="number"
                                        step="0.1"
                                        value={workExperience}
                                        onChange={(e) => setWorkExperience(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <Label>Previous Total CTC</Label>
                                    <Input
                                        type="number"
                                        value={previousTotalCtc}
                                        onChange={(e) => setPreviousTotalCtc(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <Label>Offered Fixed CTC</Label>
                                    <Input
                                        type="number"
                                        value={offeredFixedCtc}
                                        onChange={(e) => setOfferedFixedCtc(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <Label>Offered Variable CTC</Label>
                                    <Input
                                        type="number"
                                        value={offeredVariableCtc}
                                        onChange={(e) => setOfferedVariableCtc(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label>Offered Total CTC (Auto Calculated)</Label>
                                    <Input type="number" value={offeredTotalCtc} readOnly className="bg-gray-100 cursor-not-allowed" />
                                </div>

                                <div>
                                    <Label>Candidate Status</Label>
                                    <Select value={candidateStatus} onValueChange={setCandidateStatus}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Pending">Pending</SelectItem>
                                            <SelectItem value="Send Link To Candidate">Send Link To Candidate</SelectItem>
                                            <SelectItem value="Documents Submitted">Documents Submitted</SelectItem>
                                            <SelectItem value="In Progress">In Progress</SelectItem>
                                            <SelectItem value="Approved">Approved</SelectItem>
                                            <SelectItem value="Rejected">Rejected</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                      {/* NEW: Preview Offer Letter Button */}
                                      {/* <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="font-semibold text-blue-800">Offer Letter Preview</h4>
                                            <p className="text-sm text-blue-600 mt-1">
                                                Generate and preview the offer letter before sending it to the candidate.
                                            </p>
                                        </div>
                                        <Button 
                                            type="button" 
                                            onClick={handlePreviewOfferLetter}
                                            disabled={isGeneratingPreview || loading}
                                            className="bg-blue-600 hover:bg-blue-700"
                                        >
                                            {isGeneratingPreview ? "Generating..." : "Preview Offer Letter"}
                                        </Button>
                                    </div>
                                </div> */}
                            </div>
                        </section>


                        {/* Form Actions */}
                        <div className="flex justify-end gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose || (() => navigate("/crm/goonboarding"))}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? "Creating..." : "Create Onboarding"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
                <ResponsibilitiesPopup
                isOpen={showResponsibilitiesPopup}
                onClose={() => setShowResponsibilitiesPopup(false)}
                onSave={handleResponsibilitiesSave}
                title="Key Responsibilities"
                initialData={keyResponsibilities}
                fieldName="keyResponsibilities"
            />

            <ResponsibilitiesPopup
                isOpen={showWhatYoullGainPopup}
                onClose={() => setShowWhatYoullGainPopup(false)}
                onSave={handleWhatYoullGainSave}
                title="What You'll Gain"
                initialData={whatYoullGain}
                fieldName="whatYoullGain"
            />

<OfferLetterPreviewPopup
                    isOpen={showOfferLetterPreview}
                    onClose={() => {
                        setShowOfferLetterPreview(false);
                        if (offerLetterPdfUrl) {
                            URL.revokeObjectURL(offerLetterPdfUrl);
                            setOfferLetterPdfUrl(null);
                        }
                    }}
                    pdfUrl={offerLetterPdfUrl}
                    isLoading={isGeneratingPreview}
                />
            </div>
        </div>
    );
};

export default CreateGoOnBoardingForm;