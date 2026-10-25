// Signup.js - Updated (don't store file in localStorage)

import AuthShell from "./AuthShell";
import React, { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useDispatch, useSelector } from "react-redux";
import { Loader } from "lucide-react";
import { Eye, EyeOff } from "lucide-react";
import darkText from "@/assets/blacktext.png";
import whiteText from "@/assets/whitetext.png";

const Signup = () => {
    const [input, setInput] = useState({
        fullname: "",
        email: "",
        phoneNumber: "",
        password: "",
        file: null,
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const { user } = useSelector((store) => store.auth);

    useEffect(() => {
        if (user) {
            navigate("/");
        }
    }, [user]);

    const changeEventhandler = (e) => {
        setInput({ ...input, [e.target.name]: e.target.value });
    };

    const changeFileHandler = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            // Check file size (max 2MB)
            if (file.size > 2 * 1024 * 1024) {
                toast.error("Profile image size should be less than 2MB");
                return;
            }
            setInput({ ...input, file: file });
        }
    };

    const submitHandler = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Store signup credentials WITHOUT the file to avoid size issues
            const signupData = {
                fullname: input.fullname.trim(),
                email: input.email.trim().toLowerCase(),
                phoneNumber: input.phoneNumber.trim(),
                password: input.password,
                role: 'employee',
                createdAt: new Date().toISOString(),
            };

            // Store in localStorage (text only)
            localStorage.setItem('signupCredentials', JSON.stringify(signupData));

            toast.success("Thanks! Complete your onboarding details next. HR will review them and activate your login.");
            navigate("/crm/create-goonboarding");
            
        } catch (error) {
            console.error("Signup error:", error);
            toast.error("Signup failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthShell title="Join the team" subtitle="Fill in your details to create your account.">
                <form
                    onSubmit={submitHandler}
                    className="space-y-4"
                >
                    <div className="flex items-center gap-10">
                        <div className="my-2 w-full">
                            <Label>Full Name</Label>
                            <Input
                                type="text"
                                value={input.fullname}
                                name="fullname"
                                onChange={changeEventhandler}
                                placeholder="Enter Full Name"
                                required
                            />
                        </div>

                        <div className="my-2 w-full">
                            <Label>Email</Label>
                            <Input
                                type="email"
                                value={input.email}
                                name="email"
                                onChange={changeEventhandler}
                                placeholder="Enter Email"
                                required
                            />
                        </div>
                    </div>

                    <div className="my-2">
                        <Label>Phone Number</Label>
                        <Input
                            type="number"
                            value={input.phoneNumber}
                            name="phoneNumber"
                            onChange={changeEventhandler}
                            placeholder="Enter Phone Number"
                            required
                        />
                    </div>

                    <div className="relative my-2">
                        <Label>Password</Label>
                        <Input
                            type={showPassword ? "text" : "password"}
                            value={input.password}
                            name="password"
                            onChange={changeEventhandler}
                            placeholder="Enter Password"
                            className="pr-10"
                            required
                            minLength={6}
                        />
                        <div
                            className="absolute right-3 top-[38px] cursor-pointer"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? (
                                <EyeOff
                                    size={20}
                                    className="bg-white transition-colors dark:bg-slate-900"
                                />
                            ) : (
                                <Eye
                                    size={20}
                                    className="bg-white transition-colors dark:bg-slate-900"
                                />
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Label>Profile</Label>
                        <Input
                            accept="image/*"
                            type="file"
                            onChange={changeFileHandler}
                            className="cursor-pointer"
                        />
                        <span className="text-xs text-muted-foreground">Max 2MB</span>
                    </div>

                    {loading ? (
                        <Button className="my-4 w-full" disabled>
                            <Loader className="mr-2 h-4 w-4 animate-spin" /> Please Wait
                        </Button>
                    ) : (
                        <Button
                            type="submit"
                            className="my-4 w-full"
                        >
                            Sign Up & Continue
                        </Button>
                    )}
                </form>
        </AuthShell>
    );
};

export default Signup;