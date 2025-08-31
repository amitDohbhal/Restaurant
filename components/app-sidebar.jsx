"use client"

import * as React from "react"
import {
  BarChart,
  Boxes,
  ClipboardList,
  ClockArrowUp,
  Flame,
  Image,
  MapPin,
  MenuIcon,
  MessageCircleMore,
  Plus,
  Rss,
  Send,
  ShoppingBag,
  Star,
  StickyNote,
  User,
  Users,
  ShoppingCart,
} from "lucide-react"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
} from "@/components/ui/sidebar"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"

const data = {
  user: {
    name: "Welcome, Admin",
    email: "digitalservicesinrishikesh@gmail.com",
  },
  projects: [
    // First group: Admin management
    {
      name: "Create/Manage Admin",
      url: "/admin/create_user",
      icon: User,
    },
    { divider: true },
    {
      name: "Manage Banner",
      url: "/admin/change_banner_image",
      icon: Image,
    },
    { divider: true },
    {
      name: "Upload Basic Info",
      url: "/admin/upload_basic_info",
      icon: Image,
    },
    { divider: true },
    {
      name: "Create Room",
      url: "/admin/manage_products_category",
      icon: Boxes,
    },
    {
      name: "Direct Room",
      url: "/admin/room_info",
      icon: Boxes,
    },
    {
      name: "Room Invoice",
      url: "/admin/room_invoice",
      icon: Boxes,
    }, {
      name: "View Room Invoice Logs",
      url: "/admin/room_invoice_logs",
      icon: Image,
    },
    { divider: true },
    {
      name: "Create Food Category",
      url: "/admin/create_food_category",
      icon: User,
    },
    {
      name: "Create Food Inventory",
      url: "/admin/create_food_inventory",
      icon: User,
    }, {
      name: "Food Inventory Log",
      url: "/admin/food_inventory_log",
      icon: User,
    },
    { divider: true },
    {
      name: "Create Stock Category",
      url: "/admin/create_stock_category",
      icon: User,
    }, {
      name: "Create Vendor",
      url: "/admin/create_vendor",
      icon: User,
    },
    {
      name: "Create Stock Product",
      url: "/admin/create_stock_product",
      icon: User,
    },
    { divider: true },
    {
      name: "Create Stock Inventory",
      url: "/admin/create_stock_inventory",
      icon: User,
    },
    { divider: true },
    {
      name: "Stock Product Overview",
      url: "/admin/stock_product_overview",
      icon: User,
    },
    {
      name: "Stock Final Overview",
      url: "/admin/stock_final_overview",
      icon: User,
    },
    { divider: true },
    {
      name: "Create Room Invoice",
      url: "/admin/create_room_invoice",
      icon: Plus,
    },
    {
      name: "Create Restaurant Invoice",
      url: "/admin/create_restaurant_invoice",
      icon: Plus,
    },
    {
      name: "Direct/ Walking Food Order",
      url: "/admin/create_direct_food_order",
      icon: Plus,
    },
    {
      name: "Management Food Order",
      url: "/admin/management_food_order",
      icon: Plus,
    },
    { divider: true },
    {
      name: "All Invoice Overview",
      url: "/admin/all_invoice_overview",
      icon: BarChart
    },
    {
      name: "Payment Report",
      url: "/admin/payment_report",
      icon: BarChart,
    },
    {
      name: "Total Sale Report",
      url: "/admin/total_sale_report",
      icon: BarChart,
    },
    { divider: true },
    {
      name: "Create Discount",
      url: "/admin/create_discount",
      icon: Plus
    },
    { divider: true },
    {
      name: "PopUp Banner",
      url: "/admin/popup_banner",
      icon: Image
    },
    {
      name: "Promotional Banner",
      url: "/admin/promotional_banner",
      icon: Image
    },
    {
      name: "Featured Offered Banner",
      url: "/admin/featured_offered_banner",
      icon: Image
    },
    // Space (empty item)
    { divider: true },
    // Third group: Content management
    {
      name: "Manage Featured Product",
      url: "/admin/manage_featured_packages",
      icon: Image,
    },
    {
      name: "Manage Menu Section",
      url: "/admin",
      icon: MenuIcon,
    },
    {
      name: "Manage Sub Menu Section",
      url: "/admin/manage_sub_menu",
      icon: MenuIcon,
    },
    {
      name: "FAQ",
      url: "/admin/faq",
      icon: Star,
    },
    { divider: true },

    // Fourth group: Blog & pages
    {
      name: "Manage Webpages",
      url: "/admin/manage_webpage",
      icon: StickyNote,
    },

    // Space (empty item)
    { divider: true },

    // Fifth group: Enquiries
    {
      name: "Contact Page Enquiry",
      url: "/admin/contact_page_enquiry",
      icon: MessageCircleMore,
    },
    {
      name: "Enquiry Chat Page",
      url: "/admin/chat",
      icon: MessageCircleMore,
    },

    // Space (empty item)
    { divider: true },

    // Sixth group: Reports & tools

    {
      name: "Send Promotional Emails",
      url: "/admin/send_promotional_emails",
      icon: Send,
    },
    {
      name: "User Login Logs/Report",
      url: "/admin/user_login_logs",
      icon: Users,
    },
  ],
}

const dataManager = {
  user: {
    name: "Welcome, Manager",
    email: "info@adventureaxis1.in",
  },
  projects: [
    {
      name: "Enquiry Chat Page",
      url: "/admin/manager_enquiry_chat",
      icon: MessageCircleMore,
    },
    {
      name: "Send Promotional Emails",
      url: "/admin/send_promotional_emails",
      icon: Send,
    },
  ],
}

export function AppSidebar({
  ...props
}) {
  const { data: session } = useSession();

  const pathName = usePathname()

  return (
    (
      pathName !== "/admin/login" && (
        <Sidebar variant="inset"  {...props}>
          <NavUser user={session} />
          <SidebarContent {...props}>
            {session?.user?.isSubAdmin && <NavProjects projects={dataManager.projects} />}
            {(!session?.user?.isSubAdmin && session?.user?.isAdmin) && <NavProjects projects={data.projects} />}
          </SidebarContent>
        </Sidebar>
      ))
  );
}
