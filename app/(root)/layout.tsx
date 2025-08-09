import "@/app/globals.css";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ModeToggle } from "@/components/mode-toggle";

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="root">
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <main className="flex-1 p-8 bg-white dark:bg-[#120F12] text-black dark:text-white overflow-y-auto overflow-x-hidden h-full">
            <div className="flex w-full">
              <div className="w-1/2 flex justify-start items-center">
                <SidebarTrigger />
              </div>
              <div className="w-1/2 flex justify-end">
                <ModeToggle />
              </div>
            </div>
            {children}
          </main>
        </div>
      </SidebarProvider>
    </main>
  );
}
