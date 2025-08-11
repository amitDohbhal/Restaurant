"use client";

import { ChevronRight, CircleSmall, Siren } from "lucide-react";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    useSidebar,
} from "@/components/ui/sidebar";

export function NavPolicy({ policy }) {
    const { open } = useSidebar()
    return (
        <SidebarGroup>
            <SidebarGroupLabel>Pages</SidebarGroupLabel>
            <SidebarMenu>
                <Collapsible
                    asChild
                    className="group/collapsible"
                >
                    <SidebarMenuItem className="py-2">
                        <CollapsibleTrigger asChild className="hover:bg-blue-300 data-[state=open]:bg-blue-300">
                            <SidebarMenuButton tooltip={'All Policies'}>
                                <Siren className={`${open ? "!size-4" : "!size-6"} text-center`} />
                                <span className="text-base">All Pages</span>
                                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                            </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                            <SidebarMenuSub className="border-blue-300 mt-2">
                                {policy.length > 0 && policy?.map((policies) => (
                                    <SidebarMenuSubItem key={policies._id}>
                                        <SidebarMenuSubButton asChild className="hover:bg-blue-300">
                                            <a href={`/page/${policies.link}`} className="flex items-center">
                                                <CircleSmall className="!size-4 text-center" />
                                                <span className="text-sm">{policies.title}</span>
                                            </a>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                ))}
                            </SidebarMenuSub>
                        </CollapsibleContent>
                    </SidebarMenuItem>
                </Collapsible>
            </SidebarMenu>
        </SidebarGroup>
    );
}