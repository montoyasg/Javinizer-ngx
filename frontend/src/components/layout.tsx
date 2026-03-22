import { NavLink, Outlet } from "react-router-dom";
import {
  ArrowDownUp,
  Settings,
  Tv,
  History,
  Terminal,
} from "lucide-react";

const navItems = [
  { to: "/", label: "Sort", icon: ArrowDownUp },
  { to: "/settings", label: "Settings", icon: Settings },
  { to: "/emby", label: "Emby", icon: Tv },
  { to: "/history", label: "History", icon: History },
  { to: "/admin", label: "Admin", icon: Terminal },
];

export function Layout() {
  return (
    <div className="flex h-screen">
      <aside className="w-56 border-r bg-sidebar text-sidebar-foreground flex flex-col">
        <div className="p-4 border-b">
          <h1 className="text-lg font-semibold tracking-tight">Javinizer</h1>
          <p className="text-xs text-muted-foreground">NGX Dashboard</p>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                }`
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
