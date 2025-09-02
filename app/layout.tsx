import type { Metadata } from "next";
import "./globals.css";
import { Poppins } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "600", "700"]
})
export const metadata: Metadata = {
  title: "UXhibit",
  description: "It's Time to Xhibit Greatness.",
};
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={poppins.className} suppressHydrationWarning>
      <body className="antialiased font-poppins" suppressHydrationWarning>
      <style>
  {`
    body {
      cursor: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='22' height='22' stroke='%23000000' fill='none' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M3 3l7 17 2-7 7-2-16-8Z'/></svg>") 3 3, pointer;
    }
    .dark body {
      cursor: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='22' height='22' stroke='%23ffffff' fill='none' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M3 3l7 17 2-7 7-2-16-8Z'/></svg>") 3 3, pointer;
    }
  `}
</style>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <Toaster position="top-center"></Toaster>
              {children}
        </ThemeProvider>
      </body>
    </html>
  );
}