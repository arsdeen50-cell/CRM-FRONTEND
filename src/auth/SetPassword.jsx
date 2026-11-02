import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Loader } from "lucide-react";
import { toast } from "sonner";
import AuthShell from "./AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import axiosInstance from "@/utils/axiosConfig";
import { USER_API_END_POINT } from "@/constants";

/* /set-password/:token - a new joiner (or anyone HR sent a link) chooses their password. No login needed;
   the one-time link is the proof. */
const SetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [who, setWho] = useState(null);
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    axiosInstance
      .get(`${USER_API_END_POINT}/set-password/${encodeURIComponent(token)}`)
      .then((r) => setWho(r.data))
      .catch((err) => setError(err.response?.data?.message || "This link doesn't work any more."));
  }, [token]);

  const submit = async (e) => {
    e.preventDefault();
    if (password.length < 8) return toast.error("Use at least 8 characters");
    if (password !== confirm) return toast.error("The two passwords don't match");
    try {
      setSaving(true);
      const r = await axiosInstance.post(`${USER_API_END_POINT}/set-password`, { token, password });
      toast.success(r.data.message);
      navigate("/login", { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not set the password");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AuthShell title="Set your password" subtitle={who ? `Hi ${who.fullname} - choose the password for ${who.email}.` : "Choose the password for your CRM login."}>
      {error ? (
        <div className="space-y-4">
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
          <div className="flex gap-2">
            <Button asChild variant="outline" className="flex-1"><Link to="/forgot-password">Forgot password</Link></Button>
            <Button asChild className="flex-1"><Link to="/login">Log in</Link></Button>
          </div>
        </div>
      ) : !who ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader className="h-4 w-4 animate-spin" /> Checking your link...</p>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-1.5"><Label htmlFor="sp-new">New password</Label><Input id="sp-new" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" /></div>
          <div className="grid gap-1.5"><Label htmlFor="sp-confirm">Type it again</Label><Input id="sp-confirm" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} /></div>
          <Button type="submit" className="w-full" disabled={saving}>{saving ? "Saving..." : "Set password"}</Button>
        </form>
      )}
    </AuthShell>
  );
};

export default SetPassword;
