'use client'

import { ChevronDown, Loader2, LogOutIcon, Mail, Menu, Phone, User2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import SearchBar from "../SearchBar";
import { useEffect, useRef, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { SidebarTrigger } from "../ui/sidebar";
import Image from "next/image";
import { usePathname } from "next/navigation";
import LanguageSelector from "../LanguageSelector";

const Navbar = ({ className }) => {
  const [isAuthDropdownOpen, setIsAuthDropdownOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { data: session, status } = useSession()
  const [user, setUser] = useState({});
  const dropdownRef = useRef(null);
  const pathName = usePathname();

  useEffect(() => {
    // Only skip fetch if admin or on a /product route
    if (pathName.includes('admin') || pathName.startsWith('product')) return

    if (session?.user?.isAdmin) return

    const fetchUser = async () => {
      try {
        const res = await fetch(`/api/getUserById/${session.user.id}`);
        const data = await res.json();
        setUser(data);
      } catch (error) {
        console.error(error);
      }
    }
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    if (session) {
      fetchUser();
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [session]);

  const isUser = session && !session.user.isAdmin;

  return (
    <header className={`${className} font-barlow print:hidden`}>
      <div className="flex items-center gap-10">
      <SidebarTrigger className="scale-110" />

          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-4">
              <Mail size={20} className="text-black" />
              <Link href={"mailto:info@info@adventureaxis.in"}>
                <p className="text-sm font-semibold hover:underline">info@info@adventureaxis.in</p>
              </Link>
            </div>

            <div className="h-4 w-0.5 bg-black rounded-full"></div>

            <div className="flex items-center gap-4">
              <Phone size={20} className="text-black" />
              <Link href={"tel:+918006000325"}>
                <p className="text-sm font-semibold tracking-widest hover:underline">+91 8006000325</p>
              </Link>
            </div>
          </div>
 
      </div>

      <div className="flex items-center gap-8">
        <SearchBar placeholder={"Destination, Attraction"} />
        <div className='relative' ref={dropdownRef}>
          {status === "loading" ? (
            <Loader2 className="animate-spin text-blue-600" size={36} />
          ) : isUser ? (
            <>
              {/* Profile Picture Button */}
              <button onClick={() => { setIsProfileOpen(!isProfileOpen) }} className="focus:outline-none border-dashed border-4 border-blue-600 rounded-full">
                <Image
                  src={session.user.image || "/user.png"}
                  alt="Profile"
                  width={44}
                  height={44}
                  className="rounded-full cursor-pointer"
                />
              </button>

              {/* Dropdown Menu */}
              {isProfileOpen && (
                <div className="absolute top-14 right-0 mt-2 w-fit bg-white shadow-lg rounded-lg border z-50">
                  <p className="px-4 pt-2 text-sm font-bold text-gray-700">{session.user.name}</p>
                  <p className="px-4 pb-2 text-sm text-gray-700">{session.user.email}</p>
                  <div className="h-px bg-gray-200" />
                  <Link href="/profile" className="flex items-center rounded-lg w-full text-left px-4 py-2 hover:bg-blue-100" onClick={() => { setIsProfileOpen(false) }}>
                    <User2Icon size={20} className="mr-2" /> Profile
                  </Link>
                  <Link href={`/account/${user._id}`} className="flex items-center rounded-lg w-full text-left px-4 py-2 hover:bg-blue-100" onClick={() => setIsProfileOpen(false)}>
                    <User2Icon size={20} className="mr-2" /> My Account
                  </Link>
                  <button className="flex items-center rounded-lg w-full text-red-600 text-left px-4 py-2 hover:bg-blue-100" onClick={() => signOut()}>
                    <LogOutIcon size={20} className="mr-2" /> Sign Out
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="relative">
              <button onClick={() => setIsAuthDropdownOpen(!isAuthDropdownOpen)} className="font-medium flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-800">
                Account <ChevronDown className="ml-2" size={16} />
              </button>
              {isAuthDropdownOpen && (
                <div className="absolute top-12 right-0 mt-2 w-48 text-black bg-white shadow-lg rounded-lg border">
                  <Link href="/sign-in" onClick={() => setIsAuthDropdownOpen(false)} className="block px-4 py-2 hover:bg-blue-100">Sign In</Link>
                  <Link href="/sign-up" onClick={() => setIsAuthDropdownOpen(false)} className="block px-4 py-2 hover:bg-blue-100">Create Account</Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;