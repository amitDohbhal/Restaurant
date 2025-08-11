"use client"

import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavProjects({
  projects
}) {
  const pathName = usePathname()

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarMenu>
        {projects.map((item, index) => {
          // If it's a divider
          if (item.divider) {
            return (
              <div key={`divider-${index}`} className="border-t border-blue-200 my-2 rounded-full" />
            )
          }
          
          return (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton asChild>
                <Link 
                  href={item.url} 
                  className={`${(pathName === item.url) ? 'bg-blue-600 text-white' : ''} font-semibold hover:!bg-blue-600 hover:!text-white !my-1`}
                >
                  {item.icon !== null && <item.icon className={`${pathName === item.url ? '!size-5' : '!size-4'}`} />}
                  <span>{item.name}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}