import React, { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import axios from "axios";
import { USER_API_END_POINT } from "@/constants/index";
import { useDispatch, useSelector } from "react-redux";
import {  setUser } from "@/redux/authSlice";
import { Loader } from "lucide-react";
import { Eye, EyeOff } from "lucide-react";
import AuthShell from "./AuthShell";
import axiosInstance from "@/utils/axiosConfig";

const Login = () => {
    const [input, setInput] = useState({
        email: "",
        password: "",
        // role: "",
    });
    const [showPassword, setShowPassword] = useState(false);
     const [loading, setLoading] = useState(false); 

    const navigate = useNavigate();

    const {  user } = useSelector((store) => store.auth);
    const dispatch = useDispatch();

useEffect(() => {
  const token = localStorage.getItem('token');
  if (token && user) {
    navigate("/");
  }
}, [user, navigate]);


    const changeEventhandler = (e) => {
        setInput({ ...input, [e.target.name]: e.target.value });
    };

const submitHandler = async (e) => {
  e.preventDefault();

  try {
    setLoading(true);
    const res = await axiosInstance.post(`${USER_API_END_POINT}/login`, input, {
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true,
    });

    if (res.data.success) {
      const { token, user } = res.data;

      // Store in both localStorage and Redux
      localStorage.setItem("token", token);
      dispatch(setUser({ user, token })); // Pass both user and token
      
      // Set default axios header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      navigate("/");
      toast.success(res.data.message);
    }
  } catch (error) {
    toast.error(error.response?.data?.message || "Login failed");
  } finally {
    setLoading(false);
  }
};


    return (
        <AuthShell title="Welcome back" subtitle="Log in to your workspace">
            <form onSubmit={submitHandler} className="space-y-4">
                <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" autoComplete="email" value={input.email} name="email" onChange={changeEventhandler} placeholder="you@company.com" required />
                </div>
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="password">Password</Label>
                        <Link to="/forgot-password" className="text-xs font-medium text-brand hover:underline">Forgot password?</Link>
                    </div>
                    <div className="relative">
                        <Input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" value={input.password} name="password" onChange={changeEventhandler} placeholder="Your password" className="pr-10" required />
                        <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}>
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <><Loader className="mr-2 h-4 w-4 animate-spin" /> Logging in...</> : "Log in"}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                    New joiner? <Link to="/signup" className="font-medium text-brand hover:underline">Sign up for onboarding</Link>
                </p>
            </form>
        </AuthShell>
    );
};

export default Login;
