'use client'

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn, useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { useRouter } from "nextjs-toploader/app";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export function LoginForm({ className, ...props }) {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (session?.user?.isAdmin || session?.user?.isSubAdmin) {
      router.push("/admin");
    }
  }, [session, router]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const data = new FormData(e.target);
    const email = data.get("email");
    const password = data.get("password");

    const res = await signIn("admin-login", {
      redirect: false,
      email,
      password,
      callbackUrl: '/admin/login'
    });

    if (res?.error) {
      setIsLoading(false);
      toast.error("Invalid email or password", {
        style: {
          borderRadius: "10px",
          border: "2px solid red",
        },
      });
    } else {
      router.push("/admin");
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <img className="w-52 mx-auto" src="/logo.png" alt="logo" />
          <CardTitle className="text-2xl">Admin Login</CardTitle>
          <CardDescription>
            Enter your admin email and password
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="m@example.com" required />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                </div>
                <Input id="password" name="password" type="password" required />
              </div>
              <Button type="submit" className="w-full bg-blue-700 hover:bg-blue-500">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? "Logging in..." : "Login"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
