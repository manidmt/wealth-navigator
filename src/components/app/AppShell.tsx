import { type ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { data, formatMonth } from "@/lib/dashboard-data";
import { useAssistant } from "@/components/assistant/AssistantProvider";
import { AssistantMark } from "@/components/assistant/AssistantMark";

type Props = {
  children: ReactNode;
  /** Page title shown next to sidebar trigger in the topbar (optional). */
  pageEyebrow?: string;
};

export function AppShell({ children, pageEyebrow }: Props) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border bg-background/85 px-4 backdrop-blur md:px-6">
            <div className="flex items-center gap-3 min-w-0">
              <SidebarTrigger className="-ml-1" />
              <div className="hidden h-5 w-px bg-border sm:block" />
              <div className="flex min-w-0 items-baseline gap-2">
                {pageEyebrow ? (
                  <span className="truncate text-[12px] uppercase tracking-[0.16em] text-muted-foreground">
                    {pageEyebrow}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="flex items-center gap-3 text-[12px] text-muted-foreground">
              <div className="hidden items-center gap-1.5 sm:flex">
                <span className="h-1.5 w-1.5 rounded-full bg-positive" />
                <span>Cierre {formatMonth(data.latestMonth)}</span>
              </div>
              <span className="hidden text-border md:inline">·</span>
              <span className="hidden md:inline">EUR · es-ES</span>
            </div>
          </header>

          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
