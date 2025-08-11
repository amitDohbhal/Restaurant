'use client'

import { useEffect, useState } from "react"
import { SidebarInset } from "../ui/sidebar"
import { Input } from "../ui/input"
import { Textarea } from "../ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Button } from "../ui/button"
import { statesIndia } from "@/lib/IndiaStates"
import Image from "next/image"
import axios from "axios"
import { useSession } from "next-auth/react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import toast from "react-hot-toast"

const CustomEnquiry = ({ packages = [] }) => {
    const pathname = usePathname();
    const router = useRouter();
    const { data: session } = useSession();
    const [user, setUser] = useState({});
    const [step, setStep] = useState("form")
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        adults: '1',
        children: '0',
        name: "",
        phone: "",
        email: "",
        address: "",
        aptName: "",
        state: "",
        city: "",
        pincode: "",
        extraInfo: "",
    })
    const [bookingDetails, setBookingDetails] = useState({
        travelDate: "",
        pickupLocation: "",
    })

    useEffect(() => {
        const fetchUser = async () => {
            if (session && session.user.isAdmin === false) {
                try {
                    const res = await fetch(`/api/getUserById/${session.user.id}`);
                    const data = await res.json();
                    setUser(data);

                    // Auto-fill the form with user data
                    setFormData((prevFormData) => ({
                        ...prevFormData,
                        name: data.name || '',
                        email: data.email || '',
                        phone: data.phone || '',
                        address: data.address || '',
                        city: data.city || '',
                        state: data.state || '',
                        pincode: data.postalCode || '',
                    }));
                } catch (error) {
                    console.error('Error fetching user:', error);
                }
            }
        };

        fetchUser();
    }, [session]);


    const [isFormDirty, setIsFormDirty] = useState(false);

    useEffect(() => {
        const handleBeforeUnload = (event) => {
            if (isFormDirty) {
                event.preventDefault();
                event.returnValue = "";
            }
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [isFormDirty]);

    const handleNextStep = () => {
        setStep("booking")
    }

    const handleFormSubmit = async (e) => {
        setIsSubmitting(true);
        e.preventDefault();

        if (
            !bookingDetails.travelDate ||
            !bookingDetails.pickupLocation
        ) {
            return toast.error("Please fill all the booking details", {
                style: { borderRadius: "10px", border: "2px solid red" },
            });
        }

        // Validate required fields
        if (
            !formData.name ||
            !formData.email ||
            !formData.phone ||
            !formData.address ||
            !formData.city ||
            !formData.state ||
            !formData.pincode
        ) {
            return toast.error("Please fill all the required fields", {
                style: { borderRadius: "10px", border: "2px solid red" },
            });
        }

        // Prepare the data to send
        const payload = {
            adults: formData.adults,
            children: Number(formData.children) || 0, // Always send a number, default to 0 if empty or not set
            name: formData.name,
            phone: formData.phone,
            email: formData.email,
            address: formData.address,
            aptName: formData.aptName,
            state: formData.state,
            city: formData.city,
            pincode: formData.pincode,
            extraInfo: formData.extraInfo,
            travelDate: bookingDetails.travelDate,
            pickupLocation: bookingDetails.pickupLocation,
            packageId: packages._id,
            userId: user._id,
            id: enquiryId
        };

        try {
            const response = await axios.post("/api/saveEnquiry", payload, {
                headers: {
                    "Content-Type": "application/json",
                },
            });

            const data = response.data;

            if (response.status === 201) { // Success
                toast.success("Enquiry submitted successfully!", {
                    style: { borderRadius: "10px", border: "2px solid green" },
                });

                setFormData({
                    name: "",
                    adults: '1',
                    children: '0',
                    phone: "",
                    email: "",
                    address: "",
                    aptName: "",
                    state: "",
                    city: "",
                    pincode: "",
                    extraInfo: "",
                });
                setBookingDetails({
                    travelDate: "",
                    pickupLocation: "",
                });
                setStep("confirmed");
            } else if (response.status === 400) { // Duplicate enquiry
                toast.error(data.message, {
                    style: { borderRadius: "10px", border: "2px solid red" },
                });
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to submit enquiry. Please try again.", {
                style: { borderRadius: "10px", border: "2px solid red" },
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatNumber = (num) => {
        return new Intl.NumberFormat('en-IN').format(num)
    }

    if (!session || session.user.isAdmin === true) {
        router.push(`/sign-in?callbackUrl=${encodeURIComponent(pathname)}`);
    }

    const enquiryId = `ENQ-${Date.now()}-${Math.random().toString(36).substring(2, 12).toUpperCase()}`;

    return (
        <SidebarInset>
            <form onSubmit={handleFormSubmit} className="grid grid-cols-1 font-barlow md:grid-cols-2 gap-4 xl:gap-20 p-6">
                {/* Form Section */}
                {step === "form" && (
                    <div className="space-y-4 p-8 shadow-xl rounded-xl border-2 border-blue-300">
                        <h2 className="text-3xl font-bold mb-6 font-gilda">Booking Form</h2>
                        <div className="lg:grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {/* Adults and Childrens */}
                            <div>
                                <label className="block text-sm font-medium mb-1">Total No. of Adults</label>
                                <Select
                                    value={formData.adults}
                                    onValueChange={(value) => setFormData({ ...formData, adults: value })}
                                >
                                    <SelectTrigger className="outline-none border-2 border-blue-600 bg-transparent focus-visible:ring-0 focus:ring-0 focus-visible:outline-none focus:outline-none">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent className="outline-none border-2 border-blue-600 bg-blue-100 focus-visible:ring-0 focus:ring-0 focus-visible:outline-none focus:outline-none">
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                                            <SelectItem className="hover:bg-blue-600" key={num} value={num.toString()}>
                                                {num}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Total No. of Children</label>
                                <Select
                                    value={formData.children !== undefined ? formData.children.toString() : '0'}
                                    onValueChange={(value) => setFormData({ ...formData, children: value })}
                                >
                                    <SelectTrigger className="outline-none border-2 border-blue-600 bg-transparent focus-visible:ring-0 focus:ring-0 focus-visible:outline-none focus:outline-none">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="outline-none border-2 border-blue-600 bg-blue-100 focus-visible:ring-0 focus:ring-0 focus-visible:outline-none focus:outline-none">
                                        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                                            <SelectItem className="hover:bg-blue-600" key={num} value={num.toString()}>
                                                {num}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Full Name */}
                            <div>
                                <label className="block text-sm font-medium mb-1">Full Name</label>
                                <Input
                                    type="text"
                                    className="outline-none border-2 border-blue-600 bg-transparent focus-visible:ring-0 focus:ring-0 focus-visible:outline-none focus:outline-none"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>

                            {/* Mobile Number */}
                            <div>
                                <label className="block text-sm font-medium mb-1">10-Digit Mobile Number</label>
                                <Input
                                    type="number"
                                    className="outline-none border-2 border-blue-600 bg-transparent focus-visible:ring-0 focus:ring-0 focus-visible:outline-none focus:outline-none"
                                    value={formData.phone}
                                    onChange={(e) => {
                                        // Ensure the input value is no longer than 10 digits
                                        if (e.target.value.length <= 10) {
                                            setFormData({ ...formData, phone: e.target.value });
                                        }
                                    }}
                                    required
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium mb-1">Email</label>
                                <Input
                                    type="email"
                                    className="outline-none border-2 border-blue-600 bg-transparent focus-visible:ring-0 focus:ring-0 focus-visible:outline-none focus:outline-none"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                            </div>

                            {/* Permanent Address */}
                            <div className="col-span-2">
                                <label className="block text-sm font-medium mb-1">Permanent Address</label>
                                <Textarea
                                    className="resize-none outline-none border-2 border-blue-600 bg-transparent focus-visible:ring-0 focus:ring-0 focus-visible:outline-none focus:outline-none"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    required
                                />
                            </div>

                            {/* Apartment, Suite, etc. (Optional) */}
                            <div>
                                <label className="block text-sm font-medium mb-1">Apartment, Suite, etc. (Optional)</label>
                                <Input
                                    type="text"
                                    className="resize-none outline-none border-2 border-blue-600 bg-transparent focus-visible:ring-0 focus:ring-0 focus-visible:outline-none focus:outline-none"
                                    value={formData.aptName}
                                    onChange={(e) => setFormData({ ...formData, aptName: e.target.value })}
                                />
                            </div>

                            {/* State */}
                            <div>
                                <label className="block text-sm font-medium mb-1">State</label>
                                <Select
                                    required
                                    value={formData.state}
                                    onValueChange={(value) => setFormData({ ...formData, state: value })}
                                >
                                    <SelectTrigger className="resize-none outline-none border-2 border-blue-600 bg-transparent focus-visible:ring-0 focus:ring-0 focus-visible:outline-none focus:outline-none">
                                        <SelectValue placeholder="Select State" />
                                    </SelectTrigger>
                                    <SelectContent className="outline-none border-2 border-blue-600 bg-blue-100 focus-visible:ring-0 focus:ring-0 focus-visible:outline-none focus:outline-none">
                                        {statesIndia.sort().map((state) => (
                                            <SelectItem key={state} value={state}>
                                                {state}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* City */}
                            <div>
                                <label className="block text-sm font-medium mb-1">City</label>
                                <Input
                                    type="text"
                                    className="resize-none outline-none border-2 border-blue-600 bg-transparent focus-visible:ring-0 focus:ring-0 focus-visible:outline-none focus:outline-none"
                                    value={formData.city}
                                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                    required
                                />
                            </div>

                            {/* Pincode */}
                            <div>
                                <label className="block text-sm font-medium mb-1">Pincode</label>
                                <Input
                                    type="text"
                                    className="resize-none outline-none border-2 border-blue-600 bg-transparent focus-visible:ring-0 focus:ring-0 focus-visible:outline-none focus:outline-none"
                                    value={formData.pincode}
                                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                                    required
                                />
                            </div>

                            {/* Instructions/Notes */}
                            <div className="col-span-2">
                                <label className="block text-sm font-medium mb-1">Any Required Instructions/Notes</label>
                                <Textarea
                                    className="resize-none outline-none border-2 border-blue-600 bg-transparent focus-visible:ring-0 focus:ring-0 focus-visible:outline-none focus:outline-none"
                                    value={formData.extraInfo}
                                    onChange={(e) => setFormData({ ...formData, extraInfo: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div onClick={handleNextStep} className="w-full !mt-12 !py-4 text-lg border-2 text-center rounded-lg border-blue-600 bg-blue-200 hover:bg-blue-600 hover:text-white text-black">
                            Next
                        </div>
                    </div>
                )}

                {/* Booking Details Section */}
                {step === "booking" && (
                    <div className="flex flex-col gap-8">
                        <div className="space-y-4 p-8 shadow-xl rounded-xl border-2 border-blue-300 h-fit">
                            <h2 className="text-3xl font-bold mb-6 font-gilda">Date Schedule</h2>

                            {/* Travel Date */}
                            <div>
                                <label className="block text-sm font-medium mb-1">Travel Date</label>
                                <Input
                                    type="date"
                                    className="resize-none w-fit outline-none border-2 border-blue-600 bg-transparent focus-visible:ring-0 focus:ring-0 focus-visible:outline-none focus:outline-none"
                                    value={bookingDetails.travelDate}
                                    onChange={(e) => setBookingDetails({ ...bookingDetails, travelDate: e.target.value })}
                                    required
                                />
                            </div>

                            {/* Departure Location */}
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    From which location (city) Bus/Rail/Airport would you like to leave?
                                </label>
                                <Textarea
                                    className="resize-none h-24 outline-none border-2 border-blue-600 bg-transparent focus-visible:ring-0 focus:ring-0 focus-visible:outline-none focus:outline-none"
                                    value={bookingDetails.pickupLocation}
                                    onChange={(e) => setBookingDetails({ ...bookingDetails, pickupLocation: e.target.value })}
                                    required
                                />
                            </div>

                            {/* Previous Button */}
                            <Button
                                variant="outline"
                                className="outline-none w-full !mt-12 border-2 border-blue-600 bg-transparent focus-visible:ring-0 focus:ring-0 focus-visible:outline-none focus:outline-none"
                                onClick={() => setStep("form")}
                            >
                                Previous
                            </Button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
                            >
                                {isSubmitting ? "Submitting..." : "Submit Enquiry"}
                            </button>
                        </div>
                        {packages?.basicDetails?.heliBooking === "Yes" && <div className="space-y-4 p-8 bg-blue-100 rounded-xl border-2 border-blue-300 h-fit">
                            <h2 className="text-3xl font-bold mb-6 font-gilda">Special Note: Follow Heli Tour Policy</h2>

                            <div className="space-y-4 pt-8">
                                <p className="text-justify font-semibold">
                                    Each helicopter can accommodate up to 6 passengers with a total body weight limitation of 445 kg for 6 passengers.</p>
                                <p className="text-justify font-semibold">
                                    Yatrazone: Your Spiritual Travel Solution holds the right to de-board the passenger if the given body weight deviates from the actual body weight provided at the time of making the booking. In such a scenario, we will not be liable to provide the refund amount to any passenger de-boarded. Passengers are requested to share the exact body weight measured on an electronic measuring scale.</p>
                                <p className="text-justify font-semibold">
                                    Passengers with body weight above 75 kg will be charged INR 2,000. This amount will be collected in Dehradun to avoid last-minute hassle.</p>
                                <p className="text-justify font-semibold">
                                    In case the overall body weight exceeds more than 450 kg, passengers whose given body weight is wrong will be charged INR 2,500 per kg only on the final call of the pilot, else will be de-boarded without any refund.</p>
                                <p className="text-justify font-semibold">
                                    By submitting this information, you acknowledge that the details provided are accurate and complete. The service provider is not responsible for any inaccuracies or omissions in the provided data. Any medical or special requirements should be communicated clearly, and the service provider will make reasonable efforts to accommodate these needs.</p>
                                <p className="text-justify font-semibold">
                                    The transportation service is provided based on availability, and all applicable terms and conditions apply. The tour package pricing and the minimum rate indicated above may change based on the hotels and transportation options available on that particular date. While subject to change, providing an estimated date as early as possible helps streamline the planning process and ensures that you secure the best options for your travel. Be sure to review and update this date if your plans change to avoid any potential disruptions.</p>
                            </div>
                        </div>}
                        <div className="space-y-4 p-8 bg-blue-100 rounded-xl border-2 border-blue-300 h-fit">
                            <h2 className="text-3xl font-bold mb-6">Review Customer Information</h2>

                            {/* Customer Name */}
                            <div>
                                <p className="block mb-1 text-sm font-medium text-gray-800">Name of Traveller: <span className="font-bold text-base text-blue-600">{formData.name}</span></p>
                                <p className="block mb-1 text-sm font-medium text-gray-800">Contact Number: <span className="font-bold text-base text-blue-600">+91 {formData.phone}</span></p>
                                <p className="block mb-1 text-sm font-medium text-gray-800">Email: <span className="font-bold text-base text-blue-600">{formData.email}</span></p>
                                <p className="block mb-1 text-sm font-medium text-gray-800">Address: <span className="font-bold text-base text-blue-600">{formData.address}, {formData.city}, {formData.state}, {formData.pincode}</span></p>
                            </div>

                            <div className="space-y-8 pt-8">
                                <p className="text-justify font-semibold">Note: The tour package pricing and the minimum rate indicated above may change based on the hotels and transportation options available on that particular date. While subject to change, providing an estimated date as early as possible helps streamline the planning process and ensures that you secure the best options for your travel. Be sure to review and update this date if your plans change to avoid any potential disruptions.</p>

                                <p>Our team will connect with you shortly to discuss the details and help you create an amazing travel experience.</p>

                                <p>If you have any immediate questions or preferences,
                                    feel free to share with us!</p>

                                <p>Email: <Link href={"mailto:info@yatrazone.com"} className="text-blue-600 font-semibold">Info@yatrazone.com</Link> or call <Link href={"tel:+918006000325"} className="text-blue-600 font-semibold"> +91 8006000325</Link></p>
                            </div>
                        </div>
                    </div>
                )}

                {step === "confirmed" && (
                    <div className="flex flex-col gap-8">
                        <div className="flex flex-col gap-8">
                            <div className="space-y-4 p-8 bg-blue-100 rounded-xl border-2 border-blue-300 h-fit">
                                <h2 className="text-3xl font-bold mb-6">Enquiry Sent</h2>
                                <p>Dear <span className="font-bold text-blue-600">{session?.user?.name}</span>,</p>

                                <p>Your Enquiry ID is: <span className="font-bold text-blue-600">{enquiryId}</span></p>

                                <p>Thank you for your enquiry regarding a custom package! We&apos;re excited to help you create an unforgettable journey.</p>
                                <p>Our team will connect with you shortly to discuss the details and help you create an amazing travel experience.</p>

                                <p>If you have any immediate questions or preferences,
                                    feel free to share with us!</p>

                                <p>Email: <Link href={"mailto:info@yatrazone.com"} className="text-blue-600 font-semibold">Info@yatrazone.com</Link> or call <Link href={"tel:+918006000325"} className="text-blue-600 font-semibold"> +91 8006000325</Link></p>
                            </div>
                        </div>
                        <Link href={`/account/${user?._id}`} className="w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded">Go to My Account</Link>
                    </div>
                )}

                {/* Booking Preview Section */}
                <div className="p-8 rounded-xl bg-white shadow-xl border-2 border-blue-600 w-fit h-fit space-y-6">
                    {/* Header */}
                    <h2 className="text-3xl font-bold text-gray-900 font-gilda">Booking Preview</h2>

                    {/* Package Thumbnail */}
                    <div className="relative md:w-[15rem] lg:w-[25rem] xl:w-[30rem] aspect-video overflow-hidden rounded-lg">
                        <Image
                            src={packages.basicDetails?.thumbnail?.url}
                            alt={packages.packageName}
                            blurDataURL={packages.basicDetails?.thumbnail?.url}
                            placeholder="blur"
                            fill
                            className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                        <h3 className="absolute bottom-4 left-4 text-2xl font-semibold text-white">
                            {packages.packageName}
                        </h3>
                    </div>

                    {/* Package Details */}
                    <div className="space-y-4">
                        {/* Package Code */}
                        <p className="text-sm font-medium text-gray-600">
                            Package Code: <span className="text-blue-600 font-bold">{packages.packageCode}</span>
                        </p>

                        {/* Package Price */}
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-lg font-semibold text-gray-800">
                                Package Price: ₹<span className="text-2xl text-blue-600 font-bold">{formatNumber(packages.price)}</span>/
                                <span className="lowercase font-medium text-gray-600">{packages.priceUnit}</span>
                            </p>
                        </div>
                    </div>

                </div>
            </form>
        </SidebarInset>
    )
}

export default CustomEnquiry