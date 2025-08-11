"use client"

import { ChartBarStacked, ChevronRight, CircleSmall } from "lucide-react"

import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
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
} from "@/components/ui/sidebar"
const staticMenuItems = [
    {
        catTitle: "About Us",
        subCat: [
            {
                subCatPackage: [
                    { title: "About Us", url: "/about-us", active: true }
                ],
                active: true,
            }
        ],
        active: true,
    },
    {
        catTitle: "Our Policy",
        subCat: [
            {
                subCatPackage: [
                    { title: "Privacy Policy", url: "/privacy-policy", active: true },
                    { title: "Refund & Cancellation", url: "/refund-cancellation", active: true },
                    { title: "Shipping Policy", url: "/shipping-policy", active: true },
                    { title: "Terms & Conditions", url: "/terms-condition", active: true }
                ],
                active: true,
            }
        ],
        active: true,
    },
    {
        catTitle: "Contact Us",
        subCat: [
            {
                subCatPackage: [
                    { title: "Contact Us", url: "/contact-us", active: true }
                ],
                active: true,
            }
        ],
        active: true,
    }
];
export function  NavMain({
    items,
    fixedItems,
    // const allMenuItems = [...fixedMenuItems, ...staticMenuItems];
}) {
    const { open } = useSidebar()
    return (
        <SidebarGroup>
            <SidebarGroupLabel className="font-black">Category</SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) => (
                    <Collapsible
                        key={item.title}
                        asChild
                        defaultOpen={item.isActive}
                        className="group/collapsible"
                    >
                        <SidebarMenuItem className="py-2">
                            <CollapsibleTrigger asChild className="hover:bg-blue-300 h-auto data-[state=open]:bg-blue-300">
                                <SidebarMenuButton tooltip={item.title} >
                                    <ChartBarStacked className={`${open ? "!size-4" : "!size-6"} text-center`} />
                                    <span className="text-sm">{item.title}</span>
                                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                </SidebarMenuButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <SidebarMenuSub className="border-blue-300 mt-2">
                                    {item.subMenu?.map((subItem) => (
                                        <SidebarMenuSubItem key={subItem.title}>
                                            <SidebarMenuSubButton asChild className="hover:bg-blue-300">
                                                <a href={'/category/' + subItem.url} className="flex items-center">
                                                    <CircleSmall className="!size-3 text-center" />
                                                    <span className="text-sm">{subItem.title}</span>
                                                </a>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                    ))}
                                </SidebarMenuSub>
                            </CollapsibleContent>
                        </SidebarMenuItem>
                    </Collapsible>
                ))}
                {fixedItems.map((item) => (
                    <Collapsible key={item.catTitle} defaultOpen={item.isActive} className="group/collapsible">
                        <SidebarMenuItem className="py-2">
                            <CollapsibleTrigger asChild className="hover:bg-blue-300 h-auto data-[state=open]:bg-blue-300">
                                <SidebarMenuButton tooltip={item.catTitle}>
                                    <ChartBarStacked className={`${open ? "!size-4" : "!size-6"} text-center`} />
                                    <span className="text-semibold">{item.catTitle}</span>
                                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                </SidebarMenuButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <SidebarMenuSub className="border-blue-300 mt-2">
                                    {item.subCat?.map((subItem) => (
                                        <Collapsible key={subItem.title} defaultOpen={subItem.isActive} className="group/nested">
                                            <SidebarMenuSubItem>
                                                <CollapsibleTrigger asChild className="cursor-pointer py-2 hover:bg-blue-300 h-auto data-[state=open]:bg-blue-300">
                                                    <SidebarMenuSubButton>
                                                        <CircleSmall className="!size-3 text-center" />
                                                        <span className="text-sm">{subItem.title}</span>
                                                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/nested:rotate-90" />
                                                    </SidebarMenuSubButton>
                                                </CollapsibleTrigger>
                                                <CollapsibleContent>
                                                    <SidebarMenuSub className="border-blue-300 mt-2 pl-4">
                                                        {subItem.subCatPackage?.map((nestedItem) => (
                                                            <SidebarMenuSubItem key={nestedItem.title}>
                                                                <a href={nestedItem.url} className="flex items-center  gap-2 rounded-sm py-2  hover:bg-blue-300">
                                                                    <CircleSmall className="!size-2 text-center" />
                                                                    <span className="text-sm">{nestedItem.title}</span>
                                                                </a>
                                                            </SidebarMenuSubItem>
                                                        ))}
                                                    </SidebarMenuSub>
                                                </CollapsibleContent>
                                            </SidebarMenuSubItem>
                                        </Collapsible>
                                    ))}
                                </SidebarMenuSub>
                            </CollapsibleContent>
                        </SidebarMenuItem>
                    </Collapsible>
                ))}

            </SidebarMenu>
        </SidebarGroup>
    )
}
