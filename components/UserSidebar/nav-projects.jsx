"use client"

import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar"

export function NavProjects({
    projects,
}) {
    const { open } = useSidebar()
    return (
        <SidebarGroup>
            <SidebarGroupLabel>Menu</SidebarGroupLabel>
            <SidebarMenu>
                {projects.map((item) => (
                    <SidebarMenuItem key={item.name} className="py-1">
                        <SidebarMenuButton tooltip={item.name} asChild className="hover:bg-blue-300">
                            <a href={item.url} className="flex items-center">
                                <item.icon className={`${open ? "!size-4" : "!size-6"} text-center`} />
                                <span className="text-base">{item.name}</span>
                            </a>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    )
}
