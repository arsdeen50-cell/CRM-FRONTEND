import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import AuthShell from "./AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import axiosInstance from "@/utils/axiosConfig";
import { USER_API_END_POINT } from "@/constants";
import { logout, setUser } from "@/redux/authSlice";

/* /change-password - change your own password. When HR set or generated the current one, the CRM sends people
   here and keeps them here (the server refuses everything else) until they have chosen their own. */
const ChangePassword = () => {
  const { user, token } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  if (!user) return <Navigate to="/login" replace />;
  const forced = !!user.mustChangePassword;

  const submit = async (e) => {
    e.preventDefault();
    if (next.length < 8) return toast.error("Use at least 8 characters");
    if (next !== confirm) return toast.error("The two new passwords don't match");
    try {
      setSaving(true);
      const r = await axiosInstance.post(`${USER_API_END_POINT}/change-password`, { currentPassword: current, newPassword: next });
      dispatch(setUser({ user: { ...user, mustChangePassword: false }, token }));
      toast.success(r.data.message);
      navigate("/", { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not change the password");
    } finally {
      setSaving(false);
    }
  };
  const signOut = async () => {
    await axiosInstance.get(`${USER_API_END_POINT}/logout`).catch(() => {});
    dispatch(logout());
    navigate("/login", { replace: true });
  };

  return (
    <AuthShell title={forced ? "Choose your own password" : "Change password"} subtitle={forced ? "Your current password was set by HR. Pick a new one that only you know to continue." : `For ${user.email}`}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-1.5"><Label htmlFor="cp-current">Current password</Label><Input id="cp-current" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} /></div>
        <div className="grid gap-1.5"><Label htmlFor="cp-new">New password</Label><Input id="cp-new" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} placeholder="At least 8 characters" /></div>
        <div className="grid gap-1.5"><Label htmlFor="cp-confirm">Type the new one again</Label><Input id="cp-confirm" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} /></div>
        <Button type="submit" className="w-full" disabled={saving}>{saving ? "Saving..." : "Change password"}</Button>
        {forced ? (
          <button type="button" onClick={signOut} className="w-full text-center text-sm text-muted-foreground hover:underline">Log out</button>
        ) : (
          <button type="button" onClick={() => navigate(-1)} className="w-full text-center text-sm text-muted-foreground hover:underline">Cancel</button>
        )}
      </form>
    </AuthShell>
  );
};

export default ChangePassword;
