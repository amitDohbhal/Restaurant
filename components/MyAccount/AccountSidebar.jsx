"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Package,
  Settings,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import toast from "react-hot-toast";

export default function Sidebar({ session, user }) {
  const pathname = usePathname();
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)

  const handlePasswordChange = async () => {
    setPasswordError("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("All fields are required");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords don't match");
      return;
    }

    try {
      const response = await fetch("/api/changePassword", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: session?.user?.email,
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setPasswordError(data.message || "Something went wrong");
        toast.error(data.message || "Something went wrong", {
          style: {
            borderRadius: "10px",
            border: "2px solid red",
          },
        });
        return;
      }

      toast.success("Password updated successfully!"), {
        style: {
          borderRadius: "10px",
          border: "2px solid green",
        },
      };
      setShowPasswordDialog(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setPasswordError("Failed to update password");
      toast.error("Failed to update password", {
        style: {
          borderRadius: "10px",
          border: "2px solid red",
        },
      });
      return;
    }
  };

  const handleLogout = () => {
    signOut({
      callbackUrl: "/",
    });
  };

  return (
    <aside className="w-full md:w-64 md:mt-0 mt-32 shrink-0 font-barlow">
      <Card className="border-blue-600 border-2">
        <CardContent className="p-6">
          <div className="flex flex-col items-center text-center mb-6">
            <Avatar className="h-20 w-20 mb-4">
              <AvatarImage src={"/user.png"} alt="User" />
              <AvatarFallback>User</AvatarFallback>
            </Avatar>
            <h2 className="font-bold text-xl">{session?.user?.name}</h2>
            <p className="text-muted-foreground text-sm">{session?.user?.email}</p>
          </div>

          <Separator className="my-4 bg-blue-200" />

          <nav className="space-y-1">
            <Button
              variant="ghost"
              className={`w-full justify-start bg-transparent hover:bg-blue-700 hover:text-white text-black ${pathname === `/account/${session?.user?.id}` ? "bg-blue-600 text-white" : ""
                }`}
              asChild
            >
              <Link href={`/account/${session?.user?.id}`}>
                <Package className="h-4 w-4 mr-2" />
                Bookings & Enquiries
              </Link>
            </Button>
            {user?.provider !== "Google" && (
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => setShowPasswordDialog(true)}
              >
                <Settings className="h-4 w-4 mr-2" />
                Change Password
              </Button>
            )}
            <Button
              variant="ghost"
              className="w-full justify-start hover:bg-red-200 hover:text-red-600 text-red-500"
              onClick={() => setShowLogoutDialog(true)}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </nav>
        </CardContent>
      </Card>

      <Card className="mt-4 border-2 border-blue-600">
        <CardContent className="p-6">
          <h3 className="font-medium mb-2">Need Help?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Our support team is here to assist you with any questions or concerns.
          </p>
          <Button variant="outline" className="w-full" asChild>
            <Link href="/contact">Contact Support</Link>
          </Button>
        </CardContent>
      </Card>

      {/* Change Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="font-barlow">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter a new password to update your credentials.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="current-password" className="text-sm font-medium">
                Current Password
              </label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="new-password" className="text-sm font-medium">
                New Password
              </label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="confirm-password" className="text-sm font-medium">
                Confirm New Password
              </label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            {passwordError && <p className="text-sm text-red-500">{passwordError}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
              Cancel
            </Button>
            <Button className="border-2 border-blue-600 bg-blue-100 text-black hover:bg-blue-200" onClick={handlePasswordChange}>Update Password</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent className="font-barlow">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to logout?</AlertDialogTitle>
            <AlertDialogDescription>
              You will be logged out of your account and redirected to the home page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout} className="bg-red-500 hover:bg-red-600">
              Sign Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </aside>
  );
}