"use client";
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import axiosInstance from "@/utils/axiosConfig";
import { Loader } from "lucide-react";
import { USER_API_END_POINT } from "@/constants";

const ForgotPassword = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // STEP 1 → SEND OTP
  const sendOtp = async () => {
    if (!email) return toast.error("Email is required");

    try {
      setLoading(true);
      const res = await axiosInstance.post(
        `${USER_API_END_POINT}/send-otp`,
        { email }
      );

      if (res.data.success) {
        toast.success(res.data.message);
        setStep(2);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  // STEP 2 → VERIFY OTP
  const verifyOtp = async () => {
    if (!otp) return toast.error("OTP is required");

    try {
      setLoading(true);
      const res = await axiosInstance.post(
        `${USER_API_END_POINT}/verify-otp`,
        { email, otp }
      );

      if (res.data.success) {
        toast.success(res.data.message);
        setStep(3);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  // STEP 3 → RESET PASSWORD
  const resetPassword = async () => {
    if (!newPassword || !confirmPassword)
      return toast.error("All fields are required");

    if (newPassword !== confirmPassword)
      return toast.error("Passwords do not match");

    try {
      setLoading(true);
      const res = await axiosInstance.post(
        `${USER_API_END_POINT}/reset-password`,
        { email, password: newPassword }
      );

      if (res.data.success) {
        toast.success(res.data.message);
        navigate("/login");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md border rounded-lg p-6 shadow-sm">

        {/* STEP 1 */}
        {step === 1 && (
          <>
            <h2 className="text-xl font-bold mb-4 text-center">
              Forgot Password
            </h2>

            <Label>Email</Label>
            <Input
              type="email"
              placeholder="Enter registered email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Button
              className="w-full mt-4"
              onClick={sendOtp}
              disabled={loading}
            >
              {loading ? <Loader className="animate-spin" /> : "Send OTP"}
            </Button>

            <p className="text-sm text-center mt-4">
              <Link to="/login" className="text-blue-600">
                Back to Login
              </Link>
            </p>
          </>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <>
            <h2 className="text-xl font-bold mb-4 text-center">
              Verify OTP
            </h2>

            <Label>OTP</Label>
            <Input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />

            <Button
              className="w-full mt-4"
              onClick={verifyOtp}
              disabled={loading}
            >
              {loading ? <Loader className="animate-spin" /> : "Verify OTP"}
            </Button>
          </>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <>
            <h2 className="text-xl font-bold mb-4 text-center">
              Reset Password
            </h2>

            <Label>New Password</Label>
            <Input
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />

            <Label className="mt-3">Confirm Password</Label>
            <Input
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            <Button
              className="w-full mt-4"
              onClick={resetPassword}
              disabled={loading}
            >
              {loading ? <Loader className="animate-spin" /> : "Reset Password"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
