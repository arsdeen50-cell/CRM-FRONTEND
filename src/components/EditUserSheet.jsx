import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KeyRound, Copy } from "lucide-react";
import { toast } from "sonner";
import axiosInstance from "@/utils/axiosConfig";
import { USER_API_END_POINT } from "@/constants";

const EditUserSheet = ({ open, setOpen, user, onUpdate }) => {
  const [formData, setFormData] = useState({
    fullname: "",
    email: "",
    phoneNumber: "",
    role: "employee",
    mustChangePassword: false,
  });
  const [link, setLink] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        fullname: user.fullname || "",
        email: user.email || "",
        phoneNumber: user.phoneNumber || "",
        role: user.role || "employee",
        mustChangePassword: !!user.mustChangePassword,
      });
      setLink("");
    }
  }, [user]);

  // Email them a one-time "set your password" link (also shown here, to send another way if needed)
  const sendLink = async () => {
    try {
      setSending(true);
      const r = await axiosInstance.post(`${USER_API_END_POINT}/admin/users/${user._id}/password-link`);
      setLink(r.data.link);
      toast.success(r.data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not create the link");
    } finally {
      setSending(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate({
      _id: user._id,
      ...formData
    });
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit User</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <Label htmlFor="fullname">Full Name</Label>
            <Input
              id="fullname"
              name="fullname"
              value={formData.fullname}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input
              id="phoneNumber"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="role">Role</Label>
            <Select
              value={formData.role}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, role: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="employee">Employee</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={formData.mustChangePassword}
              onChange={(e) => setFormData((prev) => ({ ...prev, mustChangePassword: e.target.checked }))}
            />
            <span>Must choose a new password at next login<span className="block text-xs text-muted-foreground">Until they do, they can't use the CRM. Use it when someone else knows their password.</span></span>
          </label>
          <div className="space-y-2 rounded-md border border-border p-3">
            <p className="text-sm font-medium">Password</p>
            <p className="text-xs text-muted-foreground">Sends a one-time link (valid 24 hours) so they choose their own password. Nobody else sees it.</p>
            <Button type="button" variant="outline" size="sm" onClick={sendLink} disabled={sending || user?.isActive === false}>
              <KeyRound className="mr-1 h-4 w-4" /> {sending ? "Creating..." : "Send set-password link"}
            </Button>
            {link && (
              <div className="flex items-center gap-1">
                <Input readOnly value={link} className="h-8 text-xs" onFocus={(e) => e.target.select()} />
                <Button type="button" variant="ghost" size="icon" title="Copy" onClick={() => navigator.clipboard?.writeText(link).then(() => toast.success("Link copied"))}><Copy className="h-4 w-4" /></Button>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default EditUserSheet;