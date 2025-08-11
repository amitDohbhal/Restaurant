"use client"; 

import Navbar from "@/components/UserSidebar/Navbar";
import { AppSidebar } from "@/components/UserSidebar/app-sidebar";
import { useSidebar } from "@/components/ui/sidebar";
import { useEffect, useState } from "react";
import Footer from "./UserSidebar/Footer";

export default function MainLayout({ children }) {
    const sidebar = useSidebar();
    const { open, isMobile } = sidebar;

    const [menuItems, setMenuItems] = useState([]);
    const [fixedMenuItems, setFixedMenuItems] = useState([]);
    const [policy, setPolicy] = useState([]);

    useEffect(() => {
        fetch("/api/getAllMenuItems")
            .then(res => res.json())
            .then(data => data.sort((a, b) => a.order - b.order))
            .then(data => data.filter(item => item.active))
            .then(data => setMenuItems(data))

        fetch("/api/subMenuFixed")
            .then(res => res.json())
            .then(data => data.filter(item => item.active))
            .then(data => setFixedMenuItems(data))

        async function fetchData() {
            try {
                const response = await fetch("/api/getAllPolicy");
                const data = await response.json();

                if (response.ok) {
                    setPolicy(data.data);
                }else{
                    setPolicy([]);
                }
            } catch (error) {
                // console.error("Failed to fetch policies:", error);
            }
        }

        fetchData();
    }, []);

    return (
        <>
            {/* Sidebar */}
            <AppSidebar menuItems={menuItems} fixedMenuItems={fixedMenuItems} policy={policy} className="bg-blue-100 transition-all duration-300" />

            {/* Main Content Wrapper */}
            <div
                className={`flex-1 transition-all duration-300`}
            >
                <Navbar
                    className={`fixed top-0 transition-all duration-300 bg-white flex items-center px-4 py-2 z-50 shadow-lg ${isMobile === false ? (open ? "w-[calc(100%-var(--sidebar-width))]" : "w-[calc(100%-var(--sidebar-width-icon))]") : ''} ${isMobile ? "w-full justify-between gap-5" : "justify-between"}`}
                />
                <div className="mt-16">
                    {children}
                </div>
                <Footer className={`${isMobile === false ? (open ? "w-[calc(100%-var(--sidebar-width))]" : "w-[calc(100%-var(--sidebar-width-icon))]") : ''}`} />
            </div>
        </>
    );
}