import { Outlet, useLocation } from "react-router-dom";
import { useMediaQuery } from "@uidotdev/usehooks";
import { useClickOutside } from "@/hooks/use-click-outside";

import { Sidebar } from "@/layouts/sidebar";
import { Header } from "@/layouts/header";
import { cn } from "@/utils/cn";
import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";

const Layout = () => {
  const { user } = useSelector((store) => store.auth);
  const isDesktopDevice = useMediaQuery("(min-width: 768px)");
  const [collapsed, setCollapsed] = useState(!isDesktopDevice);
  const sidebarRef = useRef(null);
  const location = useLocation();

  // 👇 Hide sidebar/header for specific routes
  const hideSidebarRoutes = ["/crm/lead-source"];
  const shouldHideSidebar = hideSidebarRoutes.includes(location.pathname);

  useEffect(() => {
    setCollapsed(!isDesktopDevice);
  }, [isDesktopDevice]);

  useClickOutside([sidebarRef], () => {
    if (!isDesktopDevice && !collapsed) {
      setCollapsed(true);
    }
  });

  if (shouldHideSidebar) {
    // Simple clean layout without sidebar/header
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 p-6">
        <Outlet />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 transition-colors dark:bg-slate-950">
      {user && (
        <>
          <div
            className={cn(
              "pointer-events-none fixed inset-0 -z-10 bg-black opacity-0 transition-opacity",
              !collapsed &&
                "max-md:pointer-events-auto max-md:z-50 max-md:opacity-30"
            )}
          />
          <Sidebar ref={sidebarRef} collapsed={collapsed} />
        </>
      )}
      <div
        className={cn(
          "transition-[margin] duration-300",
          user && (collapsed ? "md:ml-[70px]" : "md:ml-[240px]")
        )}
      >
        {user && <Header collapsed={collapsed} setCollapsed={setCollapsed} />}
        <div className="overflow-y-auto overflow-x-hidden p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;
