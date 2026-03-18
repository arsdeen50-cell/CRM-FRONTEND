import React, { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
// import { RadioGroup } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { USER_API_END_POINT } from "@/constants/index";
import { toast } from "sonner";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { Loader } from "lucide-react";
import { Eye, EyeOff } from "lucide-react";
import darkText from "@/assets/blacktext.png";
import whiteText from "@/assets/whitetext.png";
import axiosInstance from "@/utils/axiosConfig";

const Signup = () => {
    const [input, setInput] = useState({
        fullname: "",
        email: "",
        phoneNumber: "",
        password: "",
        // role: "",
        file: null,
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const { user } = useSelector((store) => store.auth);
    const dispatch = useDispatch();

    useEffect(() => {
        if (user) {
            navigate("/");
        }
    }, [user]);

    const changeEventhandler = (e) => {
        setInput({ ...input, [e.target.name]: e.target.value });
    };

    const changeFileHandler = (e) => {
        setInput({ ...input, file: e.target.files?.[0] });
    };

    const submitHandler = async (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append("fullname", input.fullname);
        formData.append("email", input.email);
        formData.append("phoneNumber", String(input.phoneNumber));
        formData.append("password", input.password);
        formData.append("role", input.role);

        // Only append file if it exists
        if (input.file) {
            formData.append("file", input.file);
        }
        try {
            setLoading(true);
            const res = await axiosInstance.post(`${USER_API_END_POINT}/register`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
                withCredentials: true,
            });

            if (res.data.success) {
                navigate("/");
                toast.success(res.data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="mx-auto flex max-w-7xl flex-col items-center justify-center py-10">
                <div className="flex w-[60%] items-center justify-center p-3 text-center">
                    <img
                        src={darkText}
                        alt="Logoipsum"
                        className="w-[60%] dark:hidden"
                    />
                    <img
                        src={whiteText}
                        alt="Logoipsum"
                        className="hidden w-[60%] dark:block"
                    />
                </div>
                <form
                    onSubmit={submitHandler}
                    className="w-3/3 my-10 h-[20%] rounded-md border border-gray-100 p-4 lg:h-full lg:w-2/3"
                >
                    <h1 className="mb-5 text-xl font-bold">Sign Up</h1>

                    <div className="flex items-center gap-10">
                        <div className="my-2 w-full">
                            <Label>Full Name</Label>
                            <Input
                                type="text"
                                value={input.fullname}
                                name="fullname"
                                onChange={changeEventhandler}
                                placeholder="Enter Full Name"
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
                    </div>

                    {loading ? (
                        <Button className="my-4 w-full">
                            <Loader className="mr-2 h-4 w-4 animate-spin" /> Please Wait
                        </Button>
                    ) : (
                        <Button
                            type="submit"
                            className="my-4 w-full"
                        >
                            Signup
                        </Button>
                    )}

                    <span className="text-sm">
                        Already have an account?{" "}
                        <Link
                            to="/"
                            className="text-blue-600"
                        >
                            Login
                        </Link>
                    </span>
                </form>
            </div>
        </div>
    );
};

export default Signup;
