import { NavLink } from "react-router-dom";
import { LayoutDashboard, Briefcase, Users, Clock, UserCheck, FileText, Calendar, Receipt, Settings, TrendingUp, Shield, Code } from "lucide-react";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader } from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
const items = [{
  title: "Dashboard",
  url: "/dashboard",
  icon: LayoutDashboard
}, {
  title: "Cases",
  url: "/cases",
  icon: Briefcase
}, {
  title: "Time Tracking",
  url: "/time",
  icon: Clock
}, {
  title: "Staff",
  url: "/staff",
  icon: Users
}, {
  title: "Contacts",
  url: "/contacts",
  icon: UserCheck
}, {
  title: "CRM",
  url: "/crm",
  icon: TrendingUp
}, {
  title: "Documents",
  url: "/documents",
  icon: FileText
}, {
  title: "Calendar",
  url: "/calendar",
  icon: Calendar
}, {
  title: "Invoices",
  url: "/invoices",
  icon: Receipt
}, {
  title: "Settings",
  url: "/settings",
  icon: Settings
}];
export function AppSidebar() {
  const { user } = useAuth();
  
  return <Sidebar className="border-r">
      <SidebarHeader className="h-20 flex items-center px-4 border-b bg-sidebar">
        <div className="flex items-center w-full">
          <img 
            src="/logo-horizontal.png" 
            alt="LegalTrack" 
            className="h-16 w-full object-contain"
          />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map(item => <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={({
                  isActive
                }) => isActive ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "hover:bg-sidebar-accent/50"}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>)}
              {(user?.role === "Admin" || user?.role === "Developer") && (
                <>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink to="/admin" className={({
                    isActive
                  }) => isActive ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "hover:bg-sidebar-accent/50"}>
                        <Shield className="h-4 w-4" />
                        <span>Admin</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink to="/billing-codes" className={({
                    isActive
                  }) => isActive ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "hover:bg-sidebar-accent/50"}>
                        <Code className="h-4 w-4" />
                        <span>Billing Codes</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>;
}