import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { confirmDialog } from "@/components/ui/app-dialogs";
import { logout } from "@/redux/authSlice";
import { USER_API_END_POINT } from "@/constants/index";
import axiosInstance from "@/utils/axiosConfig";

/* Shown only in demo builds (VITE_DEMO_MODE=true). Admins can refill the sample data before a demo. */
const DemoBanner = () => {
  const { user } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const reset = async () => {
    if (!(await confirmDialog("Reset all sample data? Everything changed in this demo is replaced with fresh sample data, and you'll need to log in again."))) return;
    setBusy(true);
    try {
      await axiosInstance.post("/v1/demo/reset");
      await axiosInstance.get(`${USER_API_END_POINT}/logout`).catch(() => {});
      localStorage.removeItem("token");
      dispatch(logout());
      toast.success("Sample data reset - log in again");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Reset failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-brand px-3 py-1.5 text-center text-xs font-medium text-brand-foreground">
      <span>Demo workspace · all people, clients and numbers here are sample data</span>
      {user?.role === "admin" && (
        <button onClick={reset} disabled={busy} className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 hover:bg-white/25 disabled:opacity-60">
          <RotateCcw className={`h-3 w-3 ${busy ? "animate-spin" : ""}`} /> {busy ? "Resetting..." : "Reset sample data"}
        </button>
      )}
    </div>
  );
};

export default DemoBanner;
