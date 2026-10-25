// CreateGoOnBoardingForm.js - Updated to handle localStorage properly

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
import { useSelector } from "react-redux";
import SuccessPopup from "./SuccessPopup";
import { toast } from "sonner";
import useDesignation from "@/hooks/useDesignation";
import axiosInstance from "@/utils/axiosConfig";
import { ONBOARDING_API_END_POINT } from "@/constants";

const CreateGoOnBoardingForm = ({ onClose }) => {
    const navigate = useNavigate();
    const { createOnboarding, loading, previewOfferLetter } = useGoOnBoarding();
    const { onboardings, fetchOnboardings } = useGoOnBoarding();
    const { user } = useSelector((state) => state.auth);

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

    // Add state for designation manager
    const [showDesignationManager, setShowDesignationManager] = useState(false);
    const { designations, fetchDesignations } = useDesignation();
    
    // POPUP STATES
    const [showResponsibilitiesPopup, setShowResponsibilitiesPopup] = useState(false);
    const [showWhatYoullGainPopup, setShowWhatYoullGainPopup] = useState(false);

    const [showOfferLetterPreview, setShowOfferLetterPreview] = useState(false);
    const [offerLetterPdfUrl, setOfferLetterPdfUrl] = useState(null);
    const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const [showDuplicatePopup, setShowDuplicatePopup] = useState(false);
    const [isDuplicate, setIsDuplicate] = useState(false);
    const [isDataLoaded, setIsDataLoaded] = useState(false);

    // Load signup credentials from localStorage
    useEffect(() => {
        try {
            const signupData = localStorage.getItem('signupCredentials');
            if (signupData) {
                const data = JSON.parse(signupData);
                setCandidateName(data.fullname || "");
                setEmail(data.email || "");
                setMobileNo(data.phoneNumber || "");
                toast.success("Welcome! Your signup data has been loaded.");
            }
        } catch (error) {
            console.error("Error loading signup data:", error);
        }
        setIsDataLoaded(true);
    }, []);

    // Fetch onboardings and designations
    useEffect(() => {
        // Only HR can list onboarding records; new joiners filling the signup form get a yes/no duplicate check instead
        if (user?.role === "admin") fetchOnboardings();
        fetchDesignations().catch(() => {
            // Silently fail - designations are optional
            console.log("Designations not available");
        });
    }, []);

    // Check for duplicates - only run when data is loaded and we have onboardings
    useEffect(() => {
        if (!isDataLoaded || !onboardings.length || !candidateName || !email || !mobileNo) {
            return;
        }

        const duplicate = onboardings.some((item) =>
            item.candidateName?.toLowerCase() === candidateName.toLowerCase() &&
            item.email?.toLowerCase() === email.toLowerCase() &&
            item.mobileNo === mobileNo
        );

        setIsDuplicate(duplicate);

        if (duplicate) {
            setShowDuplicatePopup(true);
        }
    }, [candidateName, email, mobileNo, onboardings, isDataLoaded]);

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
        toast.info("Please create the onboarding first, then you can preview the offer letter.");
        return;
    };

    // File handling functions
    const handleSingleFileUpload = (file, setter) => {
        if (file) {
            // Check file size (max 5MB for documents)
            if (file.size > 5 * 1024 * 1024) {
                toast.error("File size should be less than 5MB");
                return;
            }
            setter(file);
        }
    };

    const handleMultipleFileUpload = (files, setter) => {
        if (files && files.length > 0) {
            const validFiles = [];
            let hasError = false;
            Array.from(files).forEach(file => {
                if (file.size > 5 * 1024 * 1024) {
                    toast.error(`File "${file.name}" is too large (max 5MB)`);
                    hasError = true;
                } else {
                    validFiles.push(file);
                }
            });
            if (!hasError && validFiles.length > 0) {
                setter(prev => [...prev, ...validFiles]);
            }
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

    // Submit handler - uses createOnboarding API
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate required fields
        if (!candidateName || !email || !mobileNo) {
            toast.error("Please fill in all required fields");
            return;
        }

        // Check for duplicates
        if (onboardings.length > 0) {
            const duplicate = onboardings.some((item) =>
                item.candidateName?.toLowerCase() === candidateName.toLowerCase() &&
                item.email?.toLowerCase() === email.toLowerCase() &&
                item.mobileNo === mobileNo
            );

            if (duplicate) {
                setShowDuplicatePopup(true);
                return;
            }
        }
        if (user?.role !== "admin") {
            try {
                const res = await axiosInstance.post(`${ONBOARDING_API_END_POINT}/check-duplicate`, { candidateName, email, mobileNo });
                if (res.data?.duplicate) {
                    setShowDuplicatePopup(true);
                    return;
                }
            } catch {
                // the server checks again when saving
            }
        }

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

        keyResponsibilities.forEach((responsibility) => {
            formData.append("keyResponsibilities", responsibility);
        });
        whatYoullGain.forEach((gain) => {
            formData.append("whatYoullGain", gain);
        });

        // Get signup credentials from localStorage and append to formData
        const signupData = localStorage.getItem('signupCredentials');
        if (signupData) {
            try {
                const data = JSON.parse(signupData);
                // Only append text data, no file
                formData.append("signupCredentials", JSON.stringify({
                    fullname: data.fullname,
                    email: data.email,
                    phoneNumber: data.phoneNumber,
                    password: data.password,
                    role: data.role || 'employee',
                    createdAt: new Date().toISOString(),
                }));
                
                formData.append("signupFullname", data.fullname);
                formData.append("signupEmail", data.email);
                formData.append("signupPhone", data.phoneNumber);
                formData.append("signupPassword", data.password);
            } catch (error) {
                console.error("Error parsing signup data:", error);
            }
        }

        // Append files - only if they exist
        if (uploadProfile) {
            formData.append("uploadProfile", uploadProfile);
        }
        if (aadharFront) formData.append("aadharFront", aadharFront);
        if (aadharBack) formData.append("aadharBack", aadharBack);
        if (resume) formData.append("resume", resume);

        // Append multiple files
        lastThreeMonthSalary.forEach((file) => {
            formData.append("lastThreeMonthSalary", file);
        });

        try {
            const loadingToast = toast.loading("Creating onboarding...");
            await createOnboarding(formData);
            toast.dismiss(loadingToast);
            
            // Clear signup data from localStorage after successful submission
            localStorage.removeItem('signupCredentials');
            setShowSuccessPopup(true);
        } catch (error) {
            console.error("Error creating onboarding:", error);
            const errorMsg = error.response?.data?.message || error.message || "Failed to create onboarding. Please try again.";
            toast.error(errorMsg);
        }
    };

    // If data is not loaded yet, show loading
    if (!isDataLoaded) {
        return (
            <div className="flex justify-center items-center py-10 bg-gray-50 min-h-screen">
                <div className="text-center">
                    <p className="text-lg">Loading...</p>
                </div>
            </div>
        );
    }

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
                                {user?.role === "admin" && (
                                    <div>
                                        <Label>Recruiter Name</Label>
                                        <Input
                                            value={recruiterName}
                                            onChange={(e) => setRecruiterName(e.target.value)}
                                        />
                                    </div>
                                )}

                                <div>
                                    <Label>Profile Picture (Max 5MB)</Label>
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
                                                index={0}
                                            />
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <Label>Candidate Name *</Label>
                                    <Input 
                                        value={candidateName} 
                                        onChange={(e) => setCandidateName(e.target.value)} 
                                        required 
                                    />
                                </div>

                                <div>
                                    <Label>Email *</Label>
                                    <Input 
                                        type="email" 
                                        value={email} 
                                        onChange={(e) => setEmail(e.target.value)} 
                                        required 
                                    />
                                </div>

                                <div>
                                    <Label>Father's Name</Label>
                                    <Input 
                                        value={fatherName} 
                                        onChange={(e) => setFatherName(e.target.value)} 
                                    />
                                </div>

                                <div>
                                    <Label>Date of Birth</Label>
                                    <Input 
                                        type="date" 
                                        value={DOB} 
                                        onChange={(e) => setDOB(e.target.value)} 
                                    />
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
                                    <Label>Mobile No *</Label>
                                    <Input 
                                        value={mobileNo} 
                                        onChange={(e) => setMobileNo(e.target.value)} 
                                        required 
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Professional Information */}
                        <section className="space-y-4">
                            <h3 className="text-lg font-semibold">Professional Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {user?.role === "admin" && (
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <Label>Designation</Label>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setShowDesignationManager(true)}
                                                className="text-brand hover:text-blue-800"
                                            >
                                                Manage
                                            </Button>
                                        </div>
                                        <Select onValueChange={setDesignation} value={designation}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select designation" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {designations.length > 0 ? (
                                                    designations.map((des) => (
                                                        <SelectItem key={des._id} value={des.name}>
                                                            {des.name}
                                                        </SelectItem>
                                                    ))
                                                ) : (
                                                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                                        No designations available
                                                    </div>
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                <div>
                                    <Label>Date of Joining *</Label>
                                    <Input 
                                        type="date" 
                                        value={doj} 
                                        onChange={(e) => setDoj(e.target.value)} 
                                        required 
                                    />
                                </div>
                                
                                {user?.role === "admin" && (
                                    <div>
                                        <Label>Date of Ending (DOE)</Label>
                                        <Input 
                                            type="date" 
                                            value={doe} 
                                            onChange={(e) => setDoe(e.target.value)} 
                                        />
                                    </div>
                                )}

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
                            {user?.role === "admin" && (
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
                                                                <li className="text-muted-foreground">+{keyResponsibilities.length - 3} more...</li>
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
                                                                <li className="text-muted-foreground">+{whatYoullGain.length - 3} more...</li>
                                                            )}
                                                        </ul>
                                                    </CardContent>
                                                </Card>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
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
                                        <Input 
                                            value={residingCity} 
                                            onChange={(e) => setResidingCity(e.target.value)} 
                                        />
                                    </div>

                                    <div>
                                        <Label>State</Label>
                                        <Input 
                                            value={residingState} 
                                            onChange={(e) => setResidingState(e.target.value)} 
                                        />
                                    </div>

                                    <div>
                                        <Label>Pincode</Label>
                                        <Input 
                                            value={pincode} 
                                            onChange={(e) => setPincode(e.target.value)} 
                                        />
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
                                    <Label>Aadhar Front (Max 5MB)</Label>
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
                                                index={0}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Aadhar Back */}
                                <div>
                                    <Label>Aadhar Back (Max 5MB)</Label>
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
                                                index={0}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Resume */}
                                <div>
                                    <Label>Resume (Max 5MB)</Label>
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
                                                index={0}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Last 3 Month Salary Slips (Multiple) */}
                                <div>
                                    <Label>Last 3 Month Salary Slips (Max 5MB each)</Label>
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

                                {user?.role === "admin" && (
                                    <div>
                                        <Label>Offered Fixed CTC</Label>
                                        <Input
                                            type="number"
                                            value={offeredFixedCtc}
                                            onChange={(e) => setOfferedFixedCtc(e.target.value)}
                                        />
                                    </div>
                                )}

                                {user?.role === "admin" && (
                                    <div>
                                        <Label>Offered Variable CTC</Label>
                                        <Input
                                            type="number"
                                            value={offeredVariableCtc}
                                            onChange={(e) => setOfferedVariableCtc(e.target.value)}
                                        />
                                    </div>
                                )}

                                {user?.role === "admin" && (
                                    <div>
                                        <Label>Offered Total CTC (Auto Calculated)</Label>
                                        <Input 
                                            type="number" 
                                            value={offeredTotalCtc} 
                                            readOnly 
                                            className="bg-gray-100 cursor-not-allowed" 
                                        />
                                    </div>
                                )}

                                {user?.role === "admin" && (
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
                                )}
                            </div>
                        </section>

                        {/* Form Actions */}
                        <div className="flex justify-end gap-3 pt-4">
                            <Button type="submit" disabled={loading || isDuplicate}>
                                {loading ? "Creating..." : "Create Onboarding"}
                            </Button>
                        </div>
                    </form>
                </CardContent>

                {/* Popups */}
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

                <SuccessPopup
                    isOpen={showSuccessPopup}
                    message="Onboarding Created Successfully 🎉"
                    onClose={() => {
                        setShowSuccessPopup(false);
                        navigate("/crm/goonboardingdata");
                    }}
                />

                <SuccessPopup
                    isOpen={showDuplicatePopup}
                    message="Form already submitted 🚫 You cannot fill it again"
                    onClose={() => setShowDuplicatePopup(false)}
                />
            </div>
        </div>
    );
};

export default CreateGoOnBoardingForm;