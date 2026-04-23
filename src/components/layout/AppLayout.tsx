import { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
import { MobileNav } from "./MobileNav";

interface AppLayoutProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function AppLayout({ title, description, actions, children }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <main className="flex-1 min-w-0 flex flex-col">
        <header className="border-b border-border bg-card/40 backdrop-blur px-4 md:px-8 py-3 md:py-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <h1 className="text-lg md:text-2xl font-semibold tracking-tight truncate">{title}</h1>
              {description && (
                <p className="text-xs md:text-sm text-muted-foreground mt-0.5 line-clamp-2">{description}</p>
              )}
            </div>
            {actions && (
              <div className="flex flex-wrap gap-2 [&>*]:flex-1 md:[&>*]:flex-initial">{actions}</div>
            )}
          </div>
        </header>
        <div className="flex-1 px-4 md:px-8 py-6 pb-24 md:pb-10 animate-fade-in">{children}</div>
        <MobileNav />
      </main>
    </div>
  );
}
