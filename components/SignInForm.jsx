"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation";
import { Eye, EyeOff, Mail, Lock, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { signIn } from "next-auth/react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "./ui/input-otp"
import { REGEXP_ONLY_DIGITS } from "input-otp"
import toast from "react-hot-toast"

export default function SignIn() {
    const searchParams = useSearchParams();
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState("")
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        newPassword: "",
        confirmPassword: "",
        otp: ""
    })
    const [showForgotPassword, setShowForgotPassword] = useState(false)
    const [showOtpDialog, setShowOtpDialog] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [timer, setTimer] = useState(0)

    const callbackUrl = searchParams.get("callbackUrl") || "/";

    useEffect(() => {
        let interval
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1)
            }, 1000)
        }
        return () => clearInterval(interval)
    }, [timer])

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    const handleOtpChange = (value) => {
        setFormData(prev => ({ ...prev, otp: value }));
    };

    const handleSendOtp = async () => {
        setIsLoading(true)
        setError("")
        try {
            const response = await fetch('/api/auth/forgot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.email }),
            })

            const data = await response.json()
            if (response.ok) {
                setShowOtpDialog(true)
                setTimer(600) // 10 minutes
            } else {
                setError(data.message || "Failed to send OTP")
            }
        } catch (error) {
            setError("Failed to send OTP")
        } finally {
            setIsLoading(false)
        }
    }

    const handleVerifyOtp = async () => {
        setIsLoading(true)
        setError("")
        try {
            const response = await fetch('/api/auth/forgot/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: formData.email,
                    otp: formData.otp
                }),
            })

            const data = await response.json()
            if (response.ok) {
                setShowOtpDialog(false)
                setShowNewPassword(true)
            } else {
                setError(data.message || "Invalid OTP")
            }
        } catch (error) {
            setError("Verification failed")
        } finally {
            setIsLoading(false)
        }
    }

    const handlePasswordReset = async () => {
        if (formData.newPassword !== formData.confirmPassword) {
            setError("Passwords do not match")
            return
        }

        setIsLoading(true)
        setError("")
        try {
            const response = await fetch('/api/auth/forgot/reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: formData.email,
                    newPassword: formData.newPassword,
                    confirmPassword: formData.confirmPassword
                }),
            })

            const data = await response.json()
            if (response.ok) {
                setShowForgotPassword(false)
                setShowNewPassword(false)
                setFormData({
                    email: "",
                    password: "",
                    newPassword: "",
                    confirmPassword: "",
                    otp: ""
                })
                toast.success("Password reset successfully!", {
                    style: { borderRadius: "10px", border: "2px solid green" },
                })
            } else {
                setError(data.message || "Password reset failed")
            }
        } catch (error) {
            setError("Password reset failed")
        } finally {
            setIsLoading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsLoading(true)
        setError("")

        try {
            const res = await signIn("user-login", {
                redirect: false,
                email: formData.email,
                password: formData.password,
                callbackUrl: callbackUrl,
            })

            if (res?.error) {
                setError("Invalid email or password. Please try again.")
            } else {
                if (res?.ok) {
                    router.push(callbackUrl)
                }
            }
        } catch (err) {
            setError("Invalid email or password. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    const handleGoogleSignIn = async () => {
        try {
            setIsLoading(true);
            await new Promise((resolve) => setTimeout(resolve, 500)); // Small delay before stopping loading
            await signIn("google", { callbackUrl });
        } catch (error) {
            setError("Failed to sign in with Google");
            setIsLoading(false); // Stop loading if an error occurs
        }
    };


    return (
        <div className="min-h-screen flex items-center justify-center font-barlow px-4 py-12 bg-[#f8f5f0]">
            <Card className="w-full max-w-md shadow-2xl">
                <CardHeader className="space-y-1">
                    <Link href="/"><img src="/logo.png" alt="logo" className="mx-auto w-64" /></Link>
                    <CardTitle className="text-2xl font-bold text-center font-barlow">
                        {showForgotPassword ? "Reset Password" : "Sign in to your account"}
                    </CardTitle>
                    <CardDescription className="text-center">
                        {showForgotPassword ? "Enter your email to reset password" : "Enter your email and password to sign in"}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    {!showForgotPassword ? (
                        <>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            placeholder="name@example.com"
                                            className="pl-10 border-2 border-blue-600 focus-visible:ring-0"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2 !mb-4">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="password">Password</Label>
                                        <p className="text-sm font-medium cursor-pointer text-primary hover:underline" onClick={() => setShowForgotPassword(true)}>
                                            Forgot password?
                                        </p>
                                    </div>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                                        <Input
                                            id="password"
                                            name="password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            className="pl-10 border-2 border-blue-600 focus-visible:ring-0"
                                            value={formData.password}
                                            onChange={handleChange}
                                            required
                                            disabled={isLoading}
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                            onClick={() => setShowPassword(!showPassword)}
                                            disabled={isLoading}
                                        >
                                            {showPassword ? (
                                                <Eye className="h-5 w-5 text-muted-foreground" />
                                            ) : (
                                                <EyeOff className="h-5 w-5 text-muted-foreground" />
                                            )}
                                            <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                                        </Button>
                                    </div>
                                </div>

                                <Button type="submit" className="!my-4 w-full bg-blue-600 hover:bg-blue-800" disabled={isLoading}>
                                    {isLoading ? "Signing in..." : "Sign in"}
                                </Button>
                            </form>

                            <div className="relative !my-4">
                                <div className="absolute inset-0 flex items-center">
                                    <Separator className="w-full" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                                </div>
                            </div>

                            <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading}>
                                <svg viewBox="0 0 24 24" className="h-5 w-5 mr-2" aria-hidden="true">
                                    <path
                                        d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z"
                                        fill="#EA4335"
                                    />
                                    <path
                                        d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z"
                                        fill="#4285F4"
                                    />
                                    <path
                                        d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z"
                                        fill="#FBBC05"
                                    />
                                    <path
                                        d="M12.0004 24C15.2404 24 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.2654 14.29L1.27539 17.385C3.25539 21.31 7.3104 24 12.0004 24Z"
                                        fill="#34A853"
                                    />
                                </svg>
                                Sign in with Google
                            </Button>
                        </>
                    ) : (
                        // Forgot Password Flow
                        <div className="space-y-4">
                            {!showNewPassword ? (
                                // Email Input for Password Reset
                                <>
                                    <div className="space-y-2 !mb-4">
                                        <Label htmlFor="email">Email</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                                            <Input
                                                id="email"
                                                name="email"
                                                type="email"
                                                placeholder="name@example.com"
                                                className="pl-10 border-2 border-blue-600 focus-visible:ring-0"
                                                value={formData.email}
                                                onChange={handleChange}
                                                required
                                                disabled={isLoading}
                                            />
                                        </div>
                                    </div>

                                    <Button
                                        className="w-full !mb-4 bg-blue-600 hover:bg-blue-800"
                                        onClick={handleSendOtp}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? "Sending OTP..." : "Send OTP"}
                                    </Button>
                                </>
                            ) : (
                                // New Password Form
                                <>
                                    <div className="space-y-2">
                                        <Label htmlFor="newPassword">New Password</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                                            <Input
                                                id="newPassword"
                                                name="newPassword"
                                                type={showPassword ? "text" : "password"}
                                                placeholder="••••••••"
                                                className="pl-10 border-2 border-blue-600 focus-visible:ring-0"
                                                value={formData.newPassword}
                                                onChange={handleChange}
                                                required
                                                disabled={isLoading}
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                                onClick={() => setShowPassword(!showPassword)}
                                                disabled={isLoading}
                                            >
                                                {showPassword ? (
                                                    <Eye className="h-5 w-5 text-muted-foreground" />
                                                ) : (
                                                    <EyeOff className="h-5 w-5 text-muted-foreground" />
                                                )}
                                                <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="space-y-2 !mb-4">
                                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                                            <Input
                                                id="confirmPassword"
                                                name="confirmPassword"
                                                type={showPassword ? "text" : "password"}
                                                placeholder="••••••••"
                                                className="pl-10 border-2 border-blue-600 focus-visible:ring-0"
                                                value={formData.confirmPassword}
                                                onChange={handleChange}
                                                required
                                                disabled={isLoading}
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                                onClick={() => setShowPassword(!showPassword)}
                                                disabled={isLoading}
                                            >
                                                {showPassword ? (
                                                    <Eye className="h-5 w-5 text-muted-foreground" />
                                                ) : (
                                                    <EyeOff className="h-5 w-5 text-muted-foreground" />
                                                )}
                                                <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                                            </Button>
                                        </div>
                                    </div>

                                    <Button
                                        className="w-full bg-blue-600 hover:bg-blue-800"
                                        onClick={handlePasswordReset}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? "Resetting Password..." : "Reset Password"}
                                    </Button>
                                </>
                            )}

                            <Button
                                variant="ghost"
                                className="w-full"
                                onClick={() => {
                                    setShowForgotPassword(false)
                                    setShowNewPassword(false)
                                    setError("")
                                }}
                            >
                                Back to Sign In
                            </Button>
                        </div>
                    )}

                    <Dialog open={showOtpDialog} onOpenChange={setShowOtpDialog}>
                        <DialogContent className="font-barlow">
                            <DialogHeader>
                                <DialogTitle>Verify OTP</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Enter OTP sent to your email</Label>
                                    {error && (
                                        <Alert variant="destructive">
                                            <AlertDescription>{error}</AlertDescription>
                                        </Alert>
                                    )}
                                    <InputOTP
                                        maxLength={6}
                                        pattern={REGEXP_ONLY_DIGITS}
                                        value={formData.otp}
                                        onChange={handleOtpChange}>
                                        <InputOTPGroup className="scale-125 !py-12 flex items-center justify-center w-full">
                                            <InputOTPSlot index={0} />
                                            <InputOTPSlot index={1} />
                                            <InputOTPSlot index={2} />
                                            <InputOTPSlot index={3} />
                                            <InputOTPSlot index={4} />
                                            <InputOTPSlot index={5} />
                                        </InputOTPGroup>
                                    </InputOTP>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">
                                        {timer > 0 ? `Resend OTP in ${Math.floor(timer / 60)}:${timer % 60 < 10 ? '0' : ''}${timer % 60}` : "Didn't receive OTP?"}
                                    </span>
                                    <Button
                                        variant="link"
                                        className="p-0 h-auto"
                                        onClick={handleSendOtp}
                                        disabled={timer > 0}
                                    >
                                        Resend OTP
                                    </Button>
                                </div>

                                <Button
                                    className="w-full bg-blue-600 hover:bg-blue-800"
                                    onClick={handleVerifyOtp}
                                    disabled={isLoading}
                                >
                                    Verify OTP
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </CardContent>

                {!showForgotPassword && (
                    <CardFooter className="flex flex-col space-y-4">
                        <div className="text-center text-sm">
                            Don't have an account?{" "}
                            <Link href="/sign-up" className="font-medium text-primary hover:underline">
                                Sign up
                            </Link>
                        </div>
                    </CardFooter>
                )}
            </Card>
        </div>
    )
}