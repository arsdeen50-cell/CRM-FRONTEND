import { useTheme } from "@/hooks/use-theme";

import { LogOut, Moon, PanelLeft, Search, Sun, User2 } from "lucide-react";
import { useEffect, useState } from "react";
import CommandPalette from "@/components/CommandPalette";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";


import PropTypes from "prop-types";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { USER_API_END_POINT } from "@/constants";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import axios from "axios";
import { logout, setUser } from "@/redux/authSlice";
import axiosInstance from "@/utils/axiosConfig";

export const Header = ({ collapsed, setCollapsed }) => {
    const { theme, setTheme } = useTheme();
    const { user } = useSelector((store) => store.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const logOutHandler = async () => {
        try {
            const res = await axiosInstance.get(`${USER_API_END_POINT}/logout`, {
                withCredentials: true,
            });

            if (res.data.success) {
                // Clear all auth storage
                localStorage.removeItem("token");
                sessionStorage.removeItem("token");
                delete axios.defaults.headers.common["Authorization"];

                // Dispatch logout action
                dispatch(logout());

                // Navigate to login
                navigate("/login");
                toast.success(res.data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Logout failed");
        }
    };

    const stringToColor = (str) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        const color = `hsl(${hash % 360}, 70%, 50%)`;
        return color;
    };

    const [searchOpen, setSearchOpen] = useState(false);
    useEffect(() => {
        const onKey = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                setSearchOpen((o) => !o);
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);
    const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

    const avatar = (size = "h-8 w-8", text = "text-sm") =>
        user?.profile?.profilePhoto ? (
            <Avatar className={size}><AvatarImage src={user.profile.profilePhoto} alt="Profile" /></Avatar>
        ) : (
            <div className={`flex ${size} items-center justify-center rounded-full ${text} font-semibold text-white`} style={{ backgroundColor: stringToColor(user?.fullname || "Guest") }}>
                {(user?.fullname?.[0] || "G").toUpperCase()}
            </div>
        );

    return (
        <header className="sticky top-0 z-40 flex h-[60px] items-center justify-between gap-3 border-b border-border bg-card/90 px-3 backdrop-blur md:px-5">
            <div className="flex min-w-0 flex-1 items-center gap-2">
                <button className="btn-ghost size-9 shrink-0" onClick={() => setCollapsed(!collapsed)} title={collapsed ? "Open menu" : "Collapse menu"}>
                    <PanelLeft className="h-5 w-5" />
                </button>
                <button onClick={() => setSearchOpen(true)} className="flex h-9 w-full min-w-0 max-w-sm items-center gap-2 rounded-md border border-input bg-background px-3 text-sm text-muted-foreground transition-colors hover:border-ring/40 hover:text-foreground">
                    <Search className="h-4 w-4 shrink-0" />
                    <span className="truncate">Search pages, clients, people...</span>
                    <kbd className="ml-auto hidden rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium sm:inline">{isMac ? "⌘" : "Ctrl"} K</kbd>
                </button>
            </div>
            <div className="flex shrink-0 items-center gap-1">
                <button className="btn-ghost size-9 shrink-0" onClick={() => setTheme(theme === "light" ? "dark" : "light")} title="Light / dark">
                    <Sun size={18} className="dark:hidden" />
                    <Moon size={18} className="hidden dark:block" />
                </button>
                <Popover>
                    <PopoverTrigger asChild>
                        <button className="ml-1 flex items-center gap-2 rounded-full p-0.5 pr-2 hover:bg-accent" title="Account">
                            {avatar()}
                            <span className="hidden max-w-[140px] truncate text-sm font-medium lg:block">{user?.fullname?.split(" ")[0]}</span>
                        </button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-72 p-0">
                        <div className="flex items-center gap-3 border-b border-border p-4">
                            {avatar("h-10 w-10", "text-base")}
                            <div className="min-w-0">
                                <p className="truncate font-medium">{user?.fullname || "Guest"}</p>
                                <p className="truncate text-sm text-muted-foreground">{user?.email}</p>
                                <p className="text-xs capitalize text-muted-foreground">{user?.role}</p>
                            </div>
                        </div>
                        <div className="p-1">
                            <Link to={`/hr/people/${user?._id}`} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent"><User2 size={16} /> My profile</Link>
                            <button onClick={logOutHandler} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive hover:bg-accent"><LogOut size={16} /> Log out</button>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
            <CommandPalette open={searchOpen} onOpenChange={setSearchOpen} />
        </header>
    );
};

Header.propTypes = {
    collapsed: PropTypes.bool,
    setCollapsed: PropTypes.func,
};
