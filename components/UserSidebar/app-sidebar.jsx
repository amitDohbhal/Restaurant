"use client"

import * as React from "react"
import {
  BadgeInfo,
  Home,
  MessagesSquare,
  Rss,
} from "lucide-react"

import { NavMain } from "@/components/UserSidebar/nav-main"
import { NavProjects } from "@/components/UserSidebar/nav-projects"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import Link from "next/link"
import { NavPolicy } from "./nav-policy"

// This is sample data.
const data = {
  projects: [
    {
      name: "Home",
      url: "/",
      icon: Home,
    },
    {
      name: "Contact",
      url: "/contact",
      icon: MessagesSquare,
    },
  ],
}

export function AppSidebar({ className, menuItems, fixedMenuItems, policy }) {
  const { open, setOpen } = useSidebar ? useSidebar() : { open: false, setOpen: () => {} };
  return (
  
      <Sidebar collapsible="icon" className={`${className}`}>
      <SidebarHeader className="pt-3 h-16 flex items-center justify-start">
        <Link href="/">
          {/* Desktop (md and up) */}
          <span className="hidden md:block">
            {open ? (
              <img src="/logo.png" alt="logo" className="w-[12rem] transition-all duration-200" />
            ) : (
              <img src="/small-logo.jpg" alt="small logo" className="w-[5rem] transition-all duration-200" />
            )}
          </span>

          {/* Mobile (below md) */}
          <span className="block md:hidden">
            <img src="/logo.png" alt="logo" className="w-[12rem] transition-all duration-200" />
          </span>
        </Link>


      </SidebarHeader>
      <SidebarContent className="lg:mt-2 items-center font-barlow">
        <NavMain items={menuItems} fixedItems={fixedMenuItems} />
        <NavProjects projects={data.projects} />
        <NavPolicy policy={policy} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
