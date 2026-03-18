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
import darkText from "@/assets/blacktext.png";
import whiteText from "@/assets/whitetext.png";
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
        <div>
            <div className="mx-auto flex max-w-7xl flex-col items-center justify-center py-10">
                   <div className="flex p-3 text-center justify-center items-center w-[60%]">
                                 <img
                                     src={darkText}
                                     alt="Logoipsum"
                                     className="dark:hidden w-[60%]"
                                 />
                                 <img
                                     src={whiteText}
                                     alt="Logoipsum"
                                     className="hidden dark:block w-[60%]"
                                 />
                               
                             </div>
                <form
                    onSubmit={submitHandler}
                    className="w-3/3 my-10 rounded-md border border-gray-200 p-4 lg:w-2/3"
                >
                    <h1 className="mb-5 text-xl font-bold">Login</h1>

                    <div className="my-2">
                        <Label>Email</Label>
                        <Input
                            type="email"
                            value={input.email}
                            name="email"
                            onChange={changeEventhandler}
                            placeholder="Enter Email"
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
                        <Link
  to="/forgot-password"
  className="text-sm text-blue-600 block mt-2"
>
  Forgot Password?
</Link>

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
                            Login
                        </Button>
                    )}

                    <span className="text-sm">
                        Dont have an account?{" "}
                        <Link
                            to="/signup"
                            className="text-blue-600"
                        >
                            Signup
                        </Link>
                    </span>
                </form>
            
            </div>
        </div>
    );
};

export default Login;
