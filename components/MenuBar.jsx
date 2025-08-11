"use client";

import React, { useEffect, useState } from "react";
import * as NavigationMenu from "@radix-ui/react-navigation-menu";
import Link from "next/link";
import { ArrowDown, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
const staticMenuItems = [
    // {
    //     catTitle: "About Us",
    //     subCat: [
    //         {
    //             subCatPackage: [
    //                 { title: "About Us", url: "/about-us", active: true },
    //                 { title: "Vision & Mission", url: "/vision-mission", active: true },
    //                 { title: "Team", url: "/team", active: true },
    //                 { title: "What We Do ", url: "/what-we-do", active: true }
    //             ],
    //             active: true,
    //         }
    //     ],
    //     active: true,
    // },
    // {
    //     catTitle: "Our Policy",
    //     subCat: [
    //         {
    //             subCatPackage: [
    //                 { title: "Privacy Policy", url: "/privacy-policy", active: true },
    //                 { title: "Refund & Cancellation", url: "/refund-cancellation", active: true },
    //                 { title: "Return Policy", url: "/return-policy", active: true },
    //                 { title: "Shipping Policy", url: "/shipping-policy", active: true },
    //                 { title: "Terms & Conditions", url: "/terms-condition", active: true }
    //             ],
    //             active: true,
    //         }
    //     ],
    //     active: true,
    // },
    // {
    //     catTitle: "Contact Us",
    //     subCat: [
    //         {
    //             subCatPackage: [
    //                 { title: "", url: "", active: true }
    //             ],
    //             active: true,
    //         }
    //     ],
    //     active: true,
    // }
];
const MenuBar = (props) => {
    const menuRef = React.useRef(null);
    const [isOpen, setIsOpen] = useState(false);
    // Close menu when clicking outside (mobile)
    useEffect(() => {
        if (!isOpen) return;
        const handleClick = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        document.addEventListener('touchstart', handleClick);
        return () => {
            document.removeEventListener('mousedown', handleClick);
            document.removeEventListener('touchstart', handleClick);
        };
    }, [isOpen]);
    const [openMenu, setOpenMenu] = useState(null);
    const [openFixedMenu, setOpenFixedMenu] = useState(null);
    const [menuItems, setMenuItems] = useState(props.menuItems || []);
    const [fixedMenuItems, setFixedMenuItems] = useState(props.fixedMenuItems || []);
    const allMenuItems = [...fixedMenuItems, ...staticMenuItems];
    useEffect(() => {
        // Only fetch if menuItems not provided as prop
        if (!props.menuItems) {
            fetch("/api/getAllMenuItems")
                .then(res => res.json())
                .then(data => {
                    // console.log(data)
                    let arr = Array.isArray(data) ? data : (Array.isArray(data.packages) ? data.packages : []);
                    setMenuItems(arr.filter(item => item.active));
                });
        } else {
            setMenuItems(props.menuItems.filter(item => item.active));
        }
    }, [props.menuItems]);

    useEffect(() => {
        // Only fetch if fixedMenuItems not provided as prop
        if (!props.fixedMenuItems) {
            fetch("/api/subMenuFixed")
                .then(res => res.json())
                .then(data => {
                    let arr = Array.isArray(data) ? data : (Array.isArray(data.packages) ? data.packages : []);
                    setFixedMenuItems(arr.filter(item => item.active));
                });
        } else {
            setFixedMenuItems(props.fixedMenuItems.filter(item => item.active));
        }
    }, [props.fixedMenuItems]);

    useEffect(() => {
        const handleMenuItemsUpdated = () => {
            fetch("/api/getAllMenuItems")
                .then(res => res.json())
                .then(data => {
                    let arr = Array.isArray(data) ? data : (Array.isArray(data.packages) ? data.packages : []);
                    setMenuItems(arr.filter(item => item.active));
                });
            fetch("/api/subMenuFixed")
                .then(res => res.json())
                .then(data => {
                    let arr = Array.isArray(data) ? data : (Array.isArray(data.packages) ? data.packages : []);
                    setFixedMenuItems(arr.filter(item => item.active));
                });
        };
        window.addEventListener('menuItemsUpdated', handleMenuItemsUpdated);
        return () => {
            window.removeEventListener('menuItemsUpdated', handleMenuItemsUpdated);
        };
    }, []);

    const toggleMenu = (index) => {
        setOpenMenu(openMenu === index ? null : index);
    };
    const toggleFixedMenu = (index) => {
        setOpenFixedMenu(openFixedMenu === index ? null : index);
    };
    
    // Close mobile menu when a link is clicked
    const closeMobileMenu = () => {
        setIsOpen(false);
        setOpenMenu(null);
        setOpenFixedMenu(null);
    };

    return (
        <>
            {/* Mobile Menu */}
            <div className="lg:hidden">
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsOpen(prev => !prev);
                    }}
                >
                    {isOpen ? <X className="text-blue-600" size={24} /> : <Menu className="text-blue-600" size={24} />}
                </button>
            </div>

            <div className={clsx(
                "absolute top-8  md:top-12 mt-4 rounded-xl left-0 w-[90vw] text-black bg-white shadow-md lg:hidden transition-all duration-300 overflow-hidden",
                isOpen ? "max-h-[500px] overflow-y-auto" : "max-h-0"
            )} ref={menuRef}>
                {menuItems.map((item, index) => (
                    <div key={index} className="border-b">
                        <button
                            onClick={() => toggleMenu(index)}
                            className="w-full text-left p-3 text-sm font-medium  hover:bg-gray-100"
                        >
                            {item.title}
                        </button>
                        <div className={clsx(
                            "transition-all duration-300 overflow-hidden",
                            openMenu === index ? "max-h-[300px]" : "max-h-0"
                        )}>
                            <ul className="pl-4 pb-2">
                                {item.subMenu
                                    .filter(sub => sub.active)
                                    .sort((a, b) => a.order - b.order)
                                    .map((subItem, subIndex) => (
                                        <li key={subIndex} className="py-1">
                                            <Link 
                                                href={`/category/${subItem.url}`} 
                                                className="text-sm text-gray-700 block py-1"
                                                onClick={closeMobileMenu}
                                            >
                                                {subItem.title}
                                            </Link>
                                        </li>
                                    ))}
                            </ul>
                        </div>
                    </div>
                ))}

                {allMenuItems.length > 0 && allMenuItems.map((cat, index) => (
                    <div key={index} className="border-b">
                        {cat.catTitle === "Contact Us" ? (
                            <Link 
                                href="/contact" 
                                className="w-full block p-3 text-sm font-medium hover:bg-gray-100"
                                onClick={closeMobileMenu}
                            >
                                {cat.catTitle}
                            </Link>
                        ) : (
                            <>
                                <button
                                    onClick={() => toggleFixedMenu(index)}
                                    className="w-full text-left p-3 text-sm font-medium  hover:bg-gray-100"
                                >
                                    {cat.catTitle}
                                </button>
                                <div className={clsx(
                                    "transition-all duration-300 overflow-y-auto",
                                    openFixedMenu === index ? "max-h-[300px]" : "max-h-0"
                                )}>
                                    <ul className="pl-4 pb-2">
                                        {cat.subCat
                                            .filter(subCat => subCat.active)
                                            .map((category, idx) => (
                                                <React.Fragment key={idx}>
                                                    <li className="py-1">
                                                        {category.title}
                                                    </li>
                                                    {category.subCatPackage
                                                        .filter(pkg => pkg.active)
                                                        .map((pkg, pkgIdx) => (
                                                            <Link key={pkgIdx} href={`${pkg.url}`} className="flex flex-col gap-4 py-2 pl-4 text-sm text-gray-700 hover:text-blue-600" onClick={closeMobileMenu}>
                                                                - {pkg.title}
                                                            </Link>
                                                        ))}
                                                </React.Fragment>
                                            ))}
                                    </ul>
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>

            {/* Desktop Navigation */}
            <NavigationMenu.Root className="hidden lg:flex relative justify-center" >
                <NavigationMenu.List className="flex space-x-2">
                    {menuItems.map((item, index) => (
                        <NavigationMenu.Item key={index} className="relative flex justify-center">
                          <NavigationMenu.Trigger className="flex items-center whitespace-nowrap px-2 py-2 justify-center text-[12px] font-semibold hover:bg-blue-500 data-[state=open]:bg-blue-300 data-[state=open]:text-black rounded-md">
                                {item.title} <ArrowDown className="ml-2" size={12} />
                            </NavigationMenu.Trigger>
                            <AnimatePresence>
                                {item.subMenu.length > 0 && (
                                    <NavigationMenu.Content asChild>
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{ duration: 0.2, ease: "easeInOut" }}
                                            className="absolute top-full mt-2 -translate-x-1/2 bg-white text-black shadow-lg rounded-md w-64"
                                        >
                                            <ul className="grid gap-2 p-2 text-sm">
                                                {item.subMenu
                                                    .filter(sub => sub.active)
                                                    .sort((a, b) => a.order - b.order)
                                                    .map((subItem, subIndex) => (
                                                        <li key={subIndex}>
                                                            <NavigationMenu.Link asChild>
                                                                <Link
                                                                    className="block px-4 py-2 rounded-md hover:bg-gray-100"
                                                                    href={`/category/${subItem.url}`}
                                                                >
                                                                    {subItem.title}
                                                                </Link>
                                                            </NavigationMenu.Link>
                                                        </li>
                                                    ))}
                                            </ul>
                                        </motion.div>
                                    </NavigationMenu.Content>
                                )}
                            </AnimatePresence>
                        </NavigationMenu.Item>
                    ))}
                    {allMenuItems.length > 0 && allMenuItems.map((cat, index) => (
                        <NavigationMenu.Item key={index} className="relative flex justify-end">
                            {cat.catTitle === "Contact Us" ? (
                                <Link href="/contact" className="flex items-center whitespace-nowrap px-4 py-2 text-sm font-semibold hover:bg-blue-500 data-[state=open]:bg-blue-300 data-[state=open]:text-black rounded-md">
                                    {cat.catTitle}
                                </Link>
                            ) : (
                                <>
                                    <NavigationMenu.Trigger className="flex items-center whitespace-nowrap px-2 py-2 justify-center text-[12px] font-semibold hover:bg-blue-500 data-[state=open]:bg-blue-300 data-[state=open]:text-black rounded-md">
                                        {cat.catTitle} <ArrowDown className="ml-1" size={12} />
                                    </NavigationMenu.Trigger>
                                    <AnimatePresence>
                                        <NavigationMenu.Content asChild>
                                            {(() => {
                                                const activeSubCats = cat.subCat.filter(subCat => subCat.active);
                                                const singleCategory = activeSubCats.length === 1;
                                                return (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: -10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -10 }}
                                                        transition={{ duration: 0.2, ease: "easeInOut" }}
                                                        className={`absolute top-full mt-2 -translate-x-1/2 bg-white text-black shadow-lg rounded-md ${singleCategory ? 'w-48' : 'w-[400px] lg:min-w-[200px]'}`}
                                                    >
                                                        <div className={
                                                            singleCategory
                                                                ? "grid gap-4 px-3 py-3 grid-cols-2 lg:grid-cols-1"
                                                                : "grid gap-2 p-6 grid-cols-2 lg:grid-cols-3"
                                                        }>
                                                            {activeSubCats.map((category, idx) => (
                                                                Array.isArray(category.subCatPackage) && category.subCatPackage.length > 0 ? (
                                                                    <div key={idx} className={singleCategory ? "flex flex-col items-center w-full" : "flex flex-col"}>
                                                                        <h3 className={singleCategory ? "font-medium text-gray-700 mb-2 text-start w-full px-2" : "font-medium text-gray-700 mb-2"}>{category.title}</h3>
                                                                        <ul className={singleCategory ? "space-y-1 flex flex-col items-start w-full px-2 " : "space-y-2"}>
                                                                            {category.subCatPackage
                                                                                .filter(pkg => pkg.active)
                                                                                .map((pkg, pkgIdx) => (
                                                                                    <li key={pkgIdx} className={singleCategory ? "w-full" : undefined}>
                                                                                        <Link href={pkg.url} className={singleCategory ? "text-gray-900 hover:text-blue-600 text-sm  text-start w-full block py-1" : "text-gray-600 hover:text-blue-600 text-sm"}>
                                                                                            {pkg.title}
                                                                                        </Link>
                                                                                    </li>
                                                                                ))}
                                                                        </ul>
                                                                    </div>
                                                                ) : null
                                                            ))}
                                                        </div>
                                                    </motion.div>
                                                );
                                            })()}
                                        </NavigationMenu.Content>
                                    </AnimatePresence>
                                </>
                            )}
                        </NavigationMenu.Item>
                    ))}
                </NavigationMenu.List>
            </NavigationMenu.Root>
        </>
    );
};

export default MenuBar;