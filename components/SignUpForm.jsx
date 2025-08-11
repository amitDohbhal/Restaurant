"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Mail, Lock, User, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { signIn } from "next-auth/react"
import toast from "react-hot-toast"
import { REGEXP_ONLY_DIGITS } from "input-otp"
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from "@/components/ui/input-otp"

export default function SignUp() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [otpSent, setOtpSent] = useState(false)
    const [OTP, setOTP] = useState(null)
    const [lastSentTime, setLastSentTime] = useState(null);
    const [timeLeft, setTimeLeft] = useState(0);
    const [error, setError] = useState("")
    const [passwordStrength, setPasswordStrength] = useState(0)
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
    })

    useEffect(() => {
        if (!lastSentTime) return;

        const interval = setInterval(() => {
            const now = new Date().getTime();
            const difference = now - lastSentTime;
            const remaining = 600000 - difference;

            if (remaining > 0) {
                setTimeLeft(remaining);
            } else {
                setTimeLeft(0);
                clearInterval(interval);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [lastSentTime]);

    const formatTime = (milliseconds) => {
        const minutes = Math.floor(milliseconds / 60000);
        const seconds = Math.floor((milliseconds % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))

        // Calculate password strength when password field changes
        if (name === "password") {
            calculatePasswordStrength(value)
        }
    }

    const calculatePasswordStrength = (password) => {
        let strength = 0

        if (password.length >= 8) strength += 25
        if (/[A-Z]/.test(password)) strength += 25
        if (/[0-9]/.test(password)) strength += 25
        if (/[^A-Za-z0-9]/.test(password)) strength += 25

        setPasswordStrength(strength)
    }

    const getPasswordStrengthColor = () => {
        if (passwordStrength <= 25) return "bg-red-500"
        if (passwordStrength <= 50) return "bg-orange-500"
        if (passwordStrength <= 75) return "bg-yellow-500"
        return "bg-green-500"
    }

    const getPasswordStrengthText = () => {
        if (passwordStrength <= 25) return "Weak"
        if (passwordStrength <= 50) return "Fair"
        if (passwordStrength <= 75) return "Good"
        return "Strong"
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const response = await fetch("/api/auth/signup", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                }),
            });

            const res = await response.json();

            if (response.ok) {
                setOtpSent(true);
                toast.success("Please check your email to verify your account.", {
                    style: { borderRadius: "10px", border: "2px solid green" },
                });
            } else {
                setError(res.message);
            }
        } catch (err) {
            setError("Registration failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const response = await fetch("/api/auth/verify", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: formData.email,
                    otp: OTP,
                }),
            });

            const res = await response.json();

            if (response.ok) {
                signIn("user-login", {
                    email: formData.email,
                    password: formData.password,
                    callbackUrl: "/",
                }).then((res) => {
                    if (res?.error) {
                        setError("Invalid email or password. Please try again.");
                    } else {
                        router.push("/");
                    }
                });
            } else {
                setError(res.message);
            }
        } catch (err) {
            setError("Verification failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendOTP = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/auth/resend', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.email }),
            });

            if (response.ok) {
                setLastSentTime(new Date().getTime());
                setError('OTP Sent!');
                toast.success('New OTP sent!', {
                    style: { borderRadius: "10px", border: "2px solid green" },
                });
            }
        } catch (error) {
            setError("Failed to resend OTP");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center font-barlow px-4 py-12 bg-[#f8f5f0]">
            {otpSent ? (
                <Card className="w-full max-w-xl shadow-2xl">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl font-bold text-center">Verify your account</CardTitle>
                        <CardDescription className="text-center">Enter the OTP sent to your email</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                        <form onSubmit={handleVerify}>
                            <div className="flex items-center justify-center !py-12">
                                <InputOTP
                                    maxLength={6}
                                    pattern={REGEXP_ONLY_DIGITS}
                                    value={OTP}
                                    onChange={(value) => setOTP(value)}>
                                    <InputOTPGroup className="flex items-center justify-center w-full">
                                        <InputOTPSlot className="scale-125 mx-1 border-blue-600" index={0} />
                                        <InputOTPSlot className="scale-125 mx-1 border-blue-600" index={1} />
                                        <InputOTPSlot className="scale-125 mx-1 border-blue-600" index={2} />
                                        <InputOTPSlot className="scale-125 mx-1 border-blue-600" index={3} />
                                        <InputOTPSlot className="scale-125 mx-1 border-blue-600" index={4} />
                                        <InputOTPSlot className="scale-125 mx-1 border-blue-600" index={5} />
                                    </InputOTPGroup>
                                </InputOTP>
                            </div>
                            <div className="text-center text-sm">
                                {timeLeft > 0 ? (
                                    <span className="text-muted-foreground">
                                        Resend OTP available in {formatTime(timeLeft)}
                                    </span>
                                ) : (
                                    <Button
                                        type="button"
                                        onClick={handleResendOTP}
                                        className="bg-blue-100 border-2 hover:bg-blue-200 border-blue-600 text-blue-600 hover:underline cursor-pointer"
                                        disabled={isLoading || timeLeft > 0}
                                    >
                                        Resend OTP
                                    </Button>
                                )}
                            </div>
                            <Button type="submit" className="!mt-12 w-full bg-blue-600 hover:bg-blue-800" disabled={isLoading}>
                                {isLoading ? "Verifying..." : "Verify"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            ) : (<Card className="w-full max-w-md shadow-2xl">
                <CardHeader className="space-y-1">
                    <Link href="/"><img src="/logo.png" alt="logo" className="mx-auto w-64" /></Link>
                    <CardTitle className="text-2xl font-bold text-center">Create an account</CardTitle>
                    <CardDescription className="text-center">Enter your information to create an account</CardDescription>
                </CardHeader >
                <CardContent className="space-y-4">
                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}


                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                                <Input
                                    id="name"
                                    name="name"
                                    type="text"
                                    placeholder="John Doe"
                                    className="pl-10 border-2 border-blue-600 focus-visible:ring-0"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

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

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
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

                            {formData.password && (
                                <div className="space-y-2 mt-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-muted-foreground">Password strength:</span>
                                        <span
                                            className={`text-sm font-medium ${passwordStrength <= 25
                                                ? "text-red-500"
                                                : passwordStrength <= 50
                                                    ? "text-orange-500"
                                                    : passwordStrength <= 75
                                                        ? "text-yellow-500"
                                                        : "text-green-500"
                                                }`}
                                        >
                                            {getPasswordStrengthText()}
                                        </span>
                                    </div>
                                    <Progress value={passwordStrength} className={getPasswordStrengthColor()} />

                                    <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                                        <div className="flex items-center gap-1">
                                            {/[A-Z]/.test(formData.password) ? (
                                                <Check className="h-4 w-4 text-green-500" />
                                            ) : (
                                                <X className="h-4 w-4 text-red-500" />
                                            )}
                                            <span>Capital letter</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {/[0-9]/.test(formData.password) ? (
                                                <Check className="h-4 w-4 text-green-500" />
                                            ) : (
                                                <X className="h-4 w-4 text-red-500" />
                                            )}
                                            <span>Number</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {/[^A-Za-z0-9]/.test(formData.password) ? (
                                                <Check className="h-4 w-4 text-green-500" />
                                            ) : (
                                                <X className="h-4 w-4 text-red-500" />
                                            )}
                                            <span>Special character</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {formData.password.length >= 8 ? (
                                                <Check className="h-4 w-4 text-green-500" />
                                            ) : (
                                                <X className="h-4 w-4 text-red-500" />
                                            )}
                                            <span>8+ characters</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-800" disabled={isLoading}>
                            {isLoading ? "Creating account..." : "Create account"}
                        </Button>
                    </form>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <Separator className="w-full" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                        </div>
                    </div>

                    <Button variant="outline" className="w-full" onClick={() => signIn("google", { callbackUrl: "/" })} disabled={isLoading}>
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
                        Sign up with Google
                    </Button>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                    <div className="text-center text-sm">
                        Already have an account?{" "}
                        <Link href="/sign-in" className="font-medium text-primary hover:underline">
                            Sign in
                        </Link>
                    </div>
                </CardFooter>
            </Card >)
            }
        </div >
    )
}