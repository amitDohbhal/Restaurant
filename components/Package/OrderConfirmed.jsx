import Link from "next/link"
import Image from "next/image"
import { Calendar, Clock, MapPin, Phone, Mail, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
// import ShareButton from "./ShareButton"
import { addDays, format } from "date-fns"

export default function ConfirmationPage({ packages, session, order }) {
    const travelDate = order?.travelDate ? new Date(order?.travelDate) : new Date();
    const duration = Number(packages?.basicDetails?.duration) || 0;
    const updatedDate = addDays(travelDate, duration);

    const totalPersons = order?.customPackageForm?.numAdults + order?.customPackageForm?.numChildren

    return (
        <div className="min-h-screen rounded-xl  font-barlow bg-gradient-to-b from-primary/5 to-background">

            <div className="bg-blue-700 rounded-t-xl text-primary-foreground py-8 text-center relative overflow-hidden">
                <div className="animate-fadeIn relative z-10">
                    <div className="mx-auto w-16 h-16 bg-primary-foreground rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M20 6L9 17L4 12"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold">Booking Confirmed!</h1>
                    <p className="text-primary-foreground/80 mt-2">Get ready for your amazing journey</p>
                </div>

                
                <div className="absolute top-0 left-0 w-full h-full">
                    {[...Array(6)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute rounded-full bg-primary-foreground/10"
                            style={{
                                width: `${Math.random() * 100 + 50}px`,
                                height: `${Math.random() * 100 + 50}px`,
                                top: `${Math.random() * 100}%`,
                                left: `${Math.random() * 100}%`,
                                animationDuration: `${Math.random() * 10 + 10}s`,
                                animationDelay: `${Math.random() * 5}s`,
                            }}
                        />
                    ))}
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 py-8">
                {/* Personal greeting section */}
                <Card className="mb-8 bg-card shadow-md border-none">
                    <CardContent className="p-6">
                        <div className="space-y-4">
                            <div className="flex items-start">
                                <div className="flex-1">
                                    <h2 className="text-2xl font-semibold text-card-foreground">Dear <span className="font-bold text-blue-600 capitalize">{session?.user?.name}</span>,</h2>
                                    <p className="text-muted-foreground mt-2">
                                        Thank you for your order! We're excited to help you plan your journey.
                                    </p>
                                    <div className="mt-4 flex items-center text-primary font-medium">
                                        <span>Your Order ID is:</span>
                                        <span className="ml-2 bg-blue-600/25 px-3 py-1 rounded-md text-primary">{order.orderId}</span>
                                    </div>
                                </div>
                                <div className="hidden sm:block">
                                    <Image
                                        src={session?.user?.image || '/user.png'}
                                        alt="Tour logo"
                                        width={80}
                                        height={80}
                                        className="rounded-full"
                                    />
                                </div>
                            </div>

                            <Separator />

                            <div>
                                <h3 className="font-medium text-card-foreground">What happens next?</h3>
                                <ol className="mt-3 space-y-3">
                                    <li className="flex gap-3">
                                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium">
                                            1
                                        </div>
                                        <span className="text-muted-foreground">
                                            Our team will connect with you shortly to discuss the details and help you create an amazing
                                            travel experience.
                                        </span>
                                    </li>
                                    <li className="flex gap-3">
                                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium">
                                            2
                                        </div>
                                        <span className="text-muted-foreground">
                                            We'll finalize your itinerary based on your preferences and requirements.
                                        </span>
                                    </li>
                                    <li className="flex gap-3">
                                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium">
                                            3
                                        </div>
                                        <span className="text-muted-foreground">
                                            All your travel documents will be prepared and sent to you for review.
                                        </span>
                                    </li>
                                </ol>
                            </div>

                            <Separator />

                            <div>
                                <h3 className="font-medium text-card-foreground">Need assistance?</h3>
                                <p className="text-muted-foreground mt-1">
                                    If you have any immediate questions or preferences, feel free to share with us!
                                </p>
                                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                        <a href="mailto:info@yatrazone.com" className="font-medium text-primary hover:underline">
                                            info@yatrazone.com
                                        </a>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-4 w-4 text-muted-foreground " />
                                        <a href="tel:+918006000325" className="text-primary font-medium hover:underline">
                                            +91 8006000325
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Package preview section */}
                <Card className="mb-8 bg-card shadow-md border-none overflow-hidden">
                    <div className="bg-blue-500/50 p-4">
                        <h2 className="font-semibold text-xl">Your Tour Package Preview</h2>
                    </div>
                    <CardContent className="p-0">
                        <div className="relative h-96">
                            <Image src={packages?.gallery[0]?.url || packages?.basicDetails?.thumbnail?.url || 'https://dummyimage.com/800x400'} alt="Tour destination" fill className="object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent">
                                <div className="absolute bottom-4 left-4 text-white">
                                    <h3 className="text-xl font-bold">{packages?.packageName}</h3>
                                    <div className="flex items-center mt-1">
                                        <MapPin className="h-4 w-4 mr-1" />
                                        <span className="text-sm">{packages?.basicDetails?.location}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="flex items-start gap-2">
                                    <Calendar className="h-5 w-5 text-primary" />
                                    <div>
                                        <p className="font-medium">Departure Date</p>
                                        <p className="text-muted-foreground">{format((order?.travelDate || new Date()), "MMM dd, yyyy")}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2">
                                    <Calendar className="h-5 w-5 text-primary" />
                                    <div>
                                        <p className="font-medium">Return Date</p>
                                        <p className="text-muted-foreground">{format(updatedDate, "MMMM dd, yyyy")}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2">
                                    <Clock className="h-5 w-5 text-primary" />
                                    <div>
                                        <p className="font-medium">Duration</p>
                                        <p className="text-muted-foreground">{packages?.basicDetails?.duration} Days, {packages?.basicDetails?.duration - 1} Nights</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2">
                                    <svg
                                        className="h-5 w-5 text-primary"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                        <path
                                            d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                        <path
                                            d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                        <path
                                            d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                    <div>
                                        <p className="font-medium">Travelers</p>
                                        <p className="text-muted-foreground">{order?.totalPerson || totalPersons}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3">
                                {/* <ShareButton /> */}
                                <Button asChild className="bg-blue-600 hover:bg-blue-700">
                                    <Link href={`/account/invoice/${order?.orderId}`}>
                                        View Invoice
                                        <ArrowRight className="h-4 w-4 ml-2" />
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Account and support section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                    <Card className="bg-card shadow-md border-none">
                        <CardContent className="p-4">
                            <div className="flex items-start gap-4">
                                <div className="bg-primary/10 p-3 rounded-full">
                                    <svg
                                        className="h-6 w-6 text-primary"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                        <path
                                            d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-medium">Check Your Account</h3>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        You can check your account here to see your orders.
                                    </p>
                                    <Button variant="link" className="px-0 mt-2">
                                        <Link href={`/account/${order.userId}`} className="flex items-center">
                                            Go To Account
                                            <ArrowRight className="h-4 w-4 ml-1" />
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-card shadow-md border-none">
                        <CardContent className="p-4">
                            <div className="flex items-start gap-4">
                                <div className="bg-primary/10 p-3 rounded-full">
                                    <svg
                                        className="h-6 w-6 text-primary"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0035 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92179 4.44061 8.37488 5.27072 7.03258C6.10083 5.69028 7.28825 4.6056 8.7 3.90003C9.87812 3.30496 11.1801 2.99659 12.5 3.00003H13C15.0843 3.11502 17.053 3.99479 18.5291 5.47089C20.0052 6.94699 20.885 8.91568 21 11V11.5Z"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-medium">Need Help?</h3>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Our travel experts are available to assist you with any questions.
                                    </p>
                                    <Button variant="link" className="px-0 mt-2">
                                        <Link href="/contact" className="flex items-center">
                                            Contact Support
                                            <ArrowRight className="h-4 w-4 ml-1" />
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}