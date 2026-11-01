import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CalendarDays, CalendarCheck, CheckSquare, PhoneCall, Receipt, Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import axiosInstance from "@/utils/axiosConfig";

const ICON = { leave: CalendarDays, correction: CalendarCheck, task: CheckSquare, followup: PhoneCall, invoice: Receipt };
const ago = (d) => {
  const m = Math.round((Date.now() - new Date(d)) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

/* Header bell: unread count, refreshed every minute; opening an item marks it read and goes to its page. */
const NotificationBell = () => {
  const navigate = useNavigate();
  const [data, setData] = useState({ items: [], unread: 0 });
  const [open, setOpen] = useState(false);

  const load = useCallback(() => axiosInstance.get("/v1/notifications").then((r) => setData(r.data)).catch(() => {}), []);
  useEffect(() => {
    load();
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, [load]);

  const markRead = async (ids) => {
    await axiosInstance.post("/v1/notifications/read", ids ? { ids } : {}).catch(() => {});
    load();
  };
  const openItem = (n) => {
    if (!n.read) markRead([n._id]);
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (o) load(); }}>
      <PopoverTrigger asChild>
        <button className="btn-ghost relative size-9 shrink-0" title="Notifications">
          <Bell size={18} />
          {data.unread > 0 && <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-semibold text-brand-foreground">{data.unread > 9 ? "9+" : data.unread}</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[22rem] p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-sm font-semibold">Notifications</p>
          {data.unread > 0 && <button onClick={() => markRead()} className="text-xs text-brand hover:underline">Mark all read</button>}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {data.items.length === 0 && <p className="px-4 py-8 text-center text-sm text-muted-foreground">Nothing yet. Leave requests, approvals and new tasks show up here.</p>}
          {data.items.map((n) => {
            const Icon = ICON[n.kind] || Info;
            return (
              <button key={n._id} onClick={() => openItem(n)} className={`flex w-full items-start gap-3 border-b border-border/60 px-4 py-3 text-left last:border-0 hover:bg-accent ${n.read ? "" : "bg-brand-soft/60"}`}>
                <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${n.read ? "text-muted-foreground" : "text-brand"}`} />
                <span className="min-w-0 flex-1">
                  <span className={`block text-sm ${n.read ? "" : "font-medium"}`}>{n.title}</span>
                  {n.body && <span className="block truncate text-xs text-muted-foreground">{n.body}</span>}
                  <span className="block text-[11px] text-muted-foreground/80">{ago(n.createdAt)}</span>
                </span>
                {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand" />}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
