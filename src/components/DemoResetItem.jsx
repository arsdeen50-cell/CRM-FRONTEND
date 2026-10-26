import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { confirmDialog } from "@/components/ui/app-dialogs";
import { logout } from "@/redux/authSlice";
import { USER_API_END_POINT } from "@/constants/index";
import axiosInstance from "@/utils/axiosConfig";

/* Account-menu item in demo builds (VITE_DEMO_MODE=true), admins only: refills the demo data before a demo. */
const DemoResetItem = () => {
  const { user } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  if (import.meta.env.VITE_DEMO_MODE !== "true" || user?.role !== "admin") return null;

  const reset = async () => {
    if (!(await confirmDialog("Reset demo data? Everything changed in this demo is replaced with fresh data, and you'll need to log in again."))) return;
    setBusy(true);
    try {
      await axiosInstance.post("/v1/demo/reset");
      await axiosInstance.get(`${USER_API_END_POINT}/logout`).catch(() => {});
      localStorage.removeItem("token");
      dispatch(logout());
      toast.success("Demo data reset - log in again");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Reset failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <button onClick={reset} disabled={busy} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent disabled:opacity-60">
      <RotateCcw size={16} className={busy ? "animate-spin" : ""} /> {busy ? "Resetting..." : "Reset demo data"}
    </button>
  );
};

export default DemoResetItem;
