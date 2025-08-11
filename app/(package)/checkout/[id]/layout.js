import "@/app/globals.css";
import { SidebarProvider } from "@/components/ui/sidebar";
import MainLayout from "@/components/MainLayout";

export default function RootLayout({ children }) {
  return (
    <SidebarProvider>
      <MainLayout>{children}</MainLayout>
    </SidebarProvider>
  );
}
