import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Receipt,
  PieChart,
  TrendingUp,
  Wallet,
  Settings,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { data } from "@/lib/dashboard-data";

const items = [
  { title: "Resumen", url: "/", icon: LayoutDashboard, exact: true },
  { title: "Gastos mensuales", url: "/expenses", icon: Receipt },
  { title: "Portfolio", url: "/portfolio", icon: PieChart },
  { title: "Patrimonio", url: "/net-worth", icon: TrendingUp },
  { title: "Saldos y cierres", url: "/balances", icon: Wallet },
  { title: "Configuración", url: "/settings", icon: Settings },
] as const;

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-3 py-4">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground font-display text-base font-semibold">
            W
          </div>
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="font-display text-sm font-semibold tracking-tight">
              Wealth Studio
            </span>
            <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              {data.owner}
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-1.5 py-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/80">
            Espacios
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = item.exact
                  ? pathname === item.url
                  : pathname === item.url || pathname.startsWith(item.url + "/");
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.title}
                      className="data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground data-[active=true]:font-medium"
                    >
                      <Link to={item.url} className="gap-3">
                        <item.icon className="h-4 w-4 shrink-0" />
                        <span className="text-[13.5px]">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border px-3 py-3 group-data-[collapsible=icon]:hidden">
        <div className="rounded-md bg-accent/60 px-3 py-2.5 text-[11px] leading-snug text-muted-foreground">
          <div className="font-medium text-foreground">Modo demo</div>
          Lectura sobre datos semilla. Edición deshabilitada.
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
