import "@/app/globals.css";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ModeToggle } from "@/components/mode-toggle";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Debug toggles via cookies (dev only)
  const cookieStore = cookies();
  const force404 = (await cookieStore).get("force404")?.value === "1";
  const forceError = (await cookieStore).get("forceError")?.value === "1";

  if (force404) notFound();
  if (forceError) throw new Error("Forced layout error (testing error boundary)");

  // Example auth gate (uncomment if needed)
  // const supabase = await createClient();
  // const { data: { user } } = await supabase.auth.getUser();
  // if (!user) redirect("/login");

  return (
    <main className="root">
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <main className="flex-1 p-8 bg-accent/25 dark:bg-[#120F12] text-black dark:text-white overflow-y-auto overflow-x-hidden h-full">
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