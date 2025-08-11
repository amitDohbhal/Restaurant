"use client"

import {
  ChevronsUpDown,
  KeyRound,
  LogOut,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react"
import { useState } from "react";
import toast from "react-hot-toast";

export function NavUser({
  user
}) {
  const { isMobile } = useSidebar()
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("New password and confirm password must match!", {
        style: { borderRadius: "10px", border: "2px solid red" },
      });
      return;
    }

    try {
      const response = await fetch("/api/admin/changePassword", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user?.user.email,
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      toast.success("Password updated successfully!", {
        style: { borderRadius: "10px", border: "2px solid green" },
      });

      setOpen(false);
    } catch (error) {
      toast.error(error.message || "Something went wrong!", {
        style: { borderRadius: "10px", border: "2px solid red" },
      });
    }
  };

  return (
    (<SidebarMenu className="bg-blue-100">
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="hover:bg-blue-500 data-[state=open]:bg-blue-200 data-[state=open]:text-sidebar-accent-foreground">
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={'/placeholder.jpeg'} />
                <AvatarFallback className="rounded-lg bg-blue-600 text-white font-bold">AD</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Welcome, {user?.user.name}</span>
                <span className="truncate text-xs">{user?.user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg font-barlow"
            side={isMobile ? "bottom" : "right"}
            align="start"
            sideOffset={10}>
            {user?.user?.isSubAdmin === false && <>
              <DropdownMenuGroup>
                <Dialog open={open} onOpenChange={setOpen}>
                  <DialogTrigger className="focus:bg-blue-100" asChild>
                    <DropdownMenuItem className="cursor-pointer" onSelect={(e) => e.preventDefault()}>
                      <KeyRound />
                      Change Password
                    </DropdownMenuItem>
                  </DialogTrigger>
                  <DialogContent className="font-barlow">
                    <DialogHeader>
                      <DialogTitle>Change Password</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <Input
                        type="password"
                        name="currentPassword"
                        placeholder="Current Password"
                        required
                        value={formData.currentPassword}
                        onChange={handleChange}
                      />
                      <Input
                        type="password"
                        name="newPassword"
                        placeholder="New Password"
                        required
                        value={formData.newPassword}
                        onChange={handleChange}
                      />
                      <Input
                        type="password"
                        name="confirmPassword"
                        placeholder="Confirm Password"
                        required
                        value={formData.confirmPassword}
                        onChange={handleChange}
                      />
                      <DialogFooter>
                        <Button className="bg-blue-700 hover:bg-blue-500" type="submit">Update Password</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
            </>
            }
            <DropdownMenuItem onClick={() => signOut()} className="text-red-600 cursor-pointer focus:bg-red-100 focus:text-red-600">
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu >)
  );
}
