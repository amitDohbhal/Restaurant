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
import { useRef } from "react"
import { X } from "lucide-react"

const Checkout = ({ packages }) => {
    const pathname = usePathname();
    const router = useRouter();
    const { data: session } = useSession();
    const [user, setUser] = useState({});
    const [step, setStep] = useState("form")
    const [formData, setFormData] = useState({
        totalPersons: '1',
        fullName: "",
        mobile: "",
        email: "",
        address: "",
        apartment: "",
        state: "",
        city: "",
        pincode: "",
        instructions: "",
    })
    const [heliFormData, setHeliFormData] = useState({
        numPassengers: 0,
        numAdults: 0,
        numChildren: 0,
        numInfants: 0,
        adults: [{
            fullname: "",
            age: 0,
            weight: 0,
            idProof: {
                url: "",
                key: ""
            }
        }],
        children: [{
            fullname: "",
            age: 0,
            weight: 0,
            idProof: {
                url: "",
                key: ""
            }
        }],
        infants: [{
            fullname: "",
            age: 0,
            weight: 0,
            idProof: {
                url: "",
                key: ""
            }
        }],
        pickupLocation: "",
        dropoffLocation: "",
        medicalRequirements: "",
        specialRequirements: "",
    });
    const [bookingDetails, setBookingDetails] = useState({
        travelDate: "",
        departureLocation: "",
    })

    // Cloudinary-style image upload (copied from AddGallery.jsx)
    const [images, setImages] = useState([]);
    const [loadedImages, setLoadedImages] = useState([]);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    const handleImageChange = async (e) => {
        const files = Array.from(e.target.files);
        setUploading(true);
        for (const file of files) {
            const formData = new FormData();
            formData.append('file', file);
            try {
                const res = await fetch('/api/cloudinary', {
                    method: 'POST',
                    body: formData
                });
                const data = await res.json();
                if (res.ok && data.url) {
                    setImages(prev => [...prev, data.url]);
                    toast.success('Image uploaded!');
                } else {
                    toast.error('Cloudinary upload failed: ' + (data.error || 'Unknown error'));
                }
            } catch (err) {
                toast.error('Cloudinary upload error: ' + err.message);
            }
        }
        setUploading(false);
    };
    const handleImageLoad = (index) => {
        setLoadedImages(prev => [...prev, index]);
    };


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
                        fullName: data.name || '',
                        email: data.email || '',
                        mobile: data.phone || '',
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

    const handleInputChange = (e, field, index = null, category = null) => {
        const { value } = e.target;
        if (category && index !== null) {
            // Handle nested fields (adults, children, infants)
            const updatedCategory = [...heliFormData[category]];
            updatedCategory[index] = { ...updatedCategory[index], [field]: value };
            setHeliFormData({ ...heliFormData, [category]: updatedCategory });
        } else {
            // Handle top-level fields
            setHeliFormData({ ...heliFormData, [field]: value });
        }
    };

    const handleFileUpload = (res, index, category) => {
        if (res && res[0]?.ufsUrl) {
            const updatedCategory = [...heliFormData[category]];
            updatedCategory[index] = { ...updatedCategory[index], idProof: { url: res[0].ufsUrl, key: res[0].key } };
            setHeliFormData({ ...heliFormData, [category]: updatedCategory });
        }
    };

    const handleDeleteImage = async (index, category) => {
        const fileKey = heliFormData[category][index].idProof.key;
        if (fileKey) {
            try {
                // Delete the file from UploadThing
                // Removed UploadThing delete, now just clear image from state(fileKey);

                // Remove the file from the state
                const updatedCategory = [...heliFormData[category]];
                updatedCategory[index] = { ...updatedCategory[index], idProof: { url: "", key: "" } };
                setHeliFormData({ ...heliFormData, [category]: updatedCategory });

            } catch (error) {
                console.error("Error deleting file:", error);
            }
        }
    };

    const handleFormSubmit = (e) => {
        e.preventDefault()

        if (!formData.fullName || !formData.email || !formData.mobile || !formData.address || !formData.city || !formData.state || !formData.pincode) {
            return toast.error("Please fill all the required fields", {
                style: { borderRadius: "10px", border: "2px solid red" },
            })
        }

        if (packages?.basicDetails?.heliBooking === "Yes") {
            if (parseInt(formData.totalPersons) !== parseInt(heliFormData.numAdults) + parseInt(heliFormData.numChildren) + parseInt(heliFormData.numInfants)) {
                return toast.error("Total Persons should be equal to sum of Adults + Children + Infants", {
                    style: { borderRadius: "10px", border: "2px solid red" },
                })
            }
            if (heliFormData.numAdults > 0 && heliFormData.adults.some((adult) => !adult.fullname || !adult.age || !adult.weight || !adult.idProof.url || !adult.idProof.key)) {
                return toast.error("Please fill all the required fields for Adults", {
                    style: { borderRadius: "10px", border: "2px solid red" },
                })
            }
            if (heliFormData.numChildren > 0 && heliFormData.children.some((child) => !child.fullname || !child.age || !child.weight || !child.idProof.url || !child.idProof.key)) {
                return toast.error("Please fill all the required fields for Children", {
                    style: { borderRadius: "10px", border: "2px solid red" },
                })
            }
            if (heliFormData.numInfants > 0 && heliFormData.infants.some((infant) => !infant.fullname || !infant.age || !infant.weight || !infant.idProof.url || !infant.idProof.key)) {
                return toast.error("Please fill all the required fields for Infants", {
                    style: { borderRadius: "10px", border: "2px solid red" },
                })
            }
        }
        setStep("booking")
    }

    const formatNumber = (num) => {
        return new Intl.NumberFormat('en-IN').format(num)
    }

    const totalPrice = packages.price * parseInt(formData.totalPersons)
    const advancePayment = Math.ceil(totalPrice * 0.25)

    const handlePayment = async () => {
        if (!formData.fullName || !formData.email || !formData.mobile || !formData.address || !formData.city || !formData.state || !formData.pincode) {
            return toast.error("Please fill all the required fields", {
                style: { borderRadius: "10px", border: "2px solid red" },
            })
        }
        if (packages?.basicDetails?.heliBooking === "Yes") {
            if (parseInt(formData.totalPersons) !== parseInt(heliFormData.numAdults) + parseInt(heliFormData.numChildren) + parseInt(heliFormData.numInfants)) {
                return toast.error("Total Persons should be equal to sum of Adults + Children + Infants", {
                    style: { borderRadius: "10px", border: "2px solid red" },
                })
            }
            if (heliFormData.numAdults > 0 && heliFormData.adults.some((adult) => !adult.fullname || !adult.age || !adult.weight || !adult.idProof.url || !adult.idProof.key)) {
                return toast.error("Please fill all the required fields for Adults", {
                    style: { borderRadius: "10px", border: "2px solid red" },
                })
            }
            if (heliFormData.numChildren > 0 && heliFormData.children.some((child) => !child.fullname || !child.age || !child.weight || !child.idProof.url || !child.idProof.key)) {
                return toast.error("Please fill all the required fields for Children", {
                    style: { borderRadius: "10px", border: "2px solid red" },
                })
            }
            if (heliFormData.numInfants > 0 && heliFormData.infants.some((infant) => !infant.fullname || !infant.age || !infant.weight || !infant.idProof.url || !infant.idProof.key)) {
                return toast.error("Please fill all the required fields for Infants", {
                    style: { borderRadius: "10px", border: "2px solid red" },
                })
            }
        }
        try {
            // Create a Razorpay order
            const orderResponse = await axios.post("/api/razorpay", {
                userId: user._id,
                packageId: packages._id,
                amount: advancePayment,
                totalAmount: totalPrice,
                currency: "INR",
                receipt: `order_${Date.now()}`,
                name: formData.fullName,
                email: formData.email,
                phone: formData.mobile,
                address: formData.address,
                extraAddressInfo: formData.apartment,
                city: formData.city,
                state: formData.state,
                pincode: formData.pincode,
                totalPersons: formData.totalPersons,
                instructions: formData.instructions || '',
                travelDate: bookingDetails.travelDate,
                departureLocation: bookingDetails.departureLocation,
                heliFormData: {
                    adults: heliFormData.adults,
                    children: heliFormData.children,
                    infants: heliFormData.infants,
                    numAdults: parseInt(heliFormData.numAdults),
                    numChildren: parseInt(heliFormData.numChildren),
                    numInfants: parseInt(heliFormData.numInfants),
                    numPassengers: (parseInt(heliFormData.numAdults) + parseInt(heliFormData.numChildren) + parseInt(heliFormData.numInfants)),
                    pickupLocation: heliFormData.pickupLocation,
                    dropoffLocation: heliFormData.dropoffLocation,
                    medicalRequirements: heliFormData.medicalRequirements,
                    specialRequirements: heliFormData.specialRequirements
                }
            })

            const { orderId, razorpayOrderId } = orderResponse.data;
            // Load Razorpay script
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => {
                const options = {
                    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                    amount: advancePayment * 100,
                    image: "/android-chrome-512x512.png",
                    currency: "INR",
                    name: "YatraZone",
                    description: "Booking Advance Payment",
                    order_id: razorpayOrderId, // Use Razorpay order ID for Razorpay modal
                    handler: async (response) => {
                        // Verify payment
                        const verificationResponse = await axios.put("/api/razorpay", {
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_signature: response.razorpay_signature,
                        })

                        if (verificationResponse.data.success) {
                            try {
                                await axios.post("/api/brevo", {
                                    to: formData.email,
                                    subject: "Booking Confirmation",
                                    htmlContent: `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Successful</title>
        <style type="text/css">
        .header {
                text-align: center;
                padding: 20px 0;
            }
            .header img {
                max-width: 300px;
            }
            @media only screen and (max-width: 600px) {
                .container {
                    width: 100% !important;
                }
                .content {
                    padding: 20px !important;
                }
                .payment-details {
                    padding: 15px !important;
                }
            }
            .footer {
                text-align: center;
                padding: 20px;
                font-size: 14px;
                color: #777777;
                border-top: 1px solid #eeeeee;
                margin-top: 20px;
            }
            .footer a {
                color: #007BFF;
                text-decoration: none;
            }
        </style>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
                <td align="center" style="padding: 20px 0;">
                    <table class="container" role="presentation" width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);">
                        <!-- Header -->
                        <tr>
        <td align="center" style="padding: 30px 0; background-color: #10B981; border-top-left-radius: 8px; border-top-right-radius: 8px;">
            <a href="https://yatrazone.vercel.app/" class="header">
                <img src="https://yatrazone.vercel.app/logo.png" alt="YatraZone Logo" style="max-width: 300px;">
            </a>
    
            <!-- Centered Table -->
            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 20px;">
                <tr>
                    <td align="center">
                        <img src="https://yatrazone.vercel.app/green-tick.gif" alt="Payment Successful Animation" style="width: 100px; height: 100px;">
                    </td>
                </tr>
                <tr>
                    <td align="center">
                        <p style="margin: 10px 0 5px; font-size: 32px; font-weight: 600;">₹${formatNumber(advancePayment)}</p>
                        <h1 style="margin: 0; font-size: 24px;">Payment Successful</h1>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
    
                        <!-- Content -->
                        <tr>
                            <td class="content" style="padding: 40px 30px;">
                                <p style="margin-top: 0; color: #333333; font-size: 16px; line-height: 1.5;">Hello, ${formData.fullName}</p>
                                <p style="color: #333333; font-size: 16px; line-height: 1.5;">Thank you for your payment (<span style="font-weight: 700; color: #00ABE9">${packages.packageName}</span>). Your transaction has been completed successfully.</p>
                                
                                <div class="payment-details" style="background-color: #f8f9fa; border-radius: 4px; padding: 25px; margin: 30px 0;">
                                    <h2 style="margin-top: 0; color: #333333; font-size: 18px;">Transaction Details</h2>
                                    
                                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 15px;">
                                        <tr>
                                            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">Amount</td>
                                            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold; color: #333333;">${formatNumber(advancePayment)}</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">Payment ID</td>
                                            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right; color: #333333;">${verificationResponse.data.paymentId}</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">Payment Method</td>
                                            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right; color: #333333; text-transform: uppercase">${verificationResponse.data.paymentMethod || 'N/A'}</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">Paid On</td>
                                            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right; color: #333333;">${new Date().toLocaleString()}</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">Email</td>
                                            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right; color: #333333;">${formData.email}</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Mobile Number</td>
                                            <td style="padding: 8px 0; text-align: right; color: #333333;">${formData.mobile}</td>
                                        </tr>
                                    </table>
                                </div>
                                
                                <p style="color: #333333; font-size: 16px; line-height: 1.5; text-align: center;">For any order related queries please reach out to <a href="mailto:yatrazone.experts@gmail.com" style="color: #00ABE0">yatrazone.experts@gmail.com</a> or Call on <a href="tel:+918006000325" style="color: #00ABE0">+91 8006000325</a> </p>
                                
                                <div style="margin-top: 30px; text-align: center;">
                                    <a href="https://yatrazone.vercel.app/profile/orders" style="display: inline-block; background-color: #10B981; text-decoration: none; padding: 12px 25px; border-radius: 4px; font-weight: bold;">View Your Account</a>
                                </div>
                            </td>
                        </tr>
                        <!-- Footer -->
                        <tr>
                            <td style="padding: 20px 30px; text-align: center; background-color: #f8f9fa; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px;">
                                <div class="footer">
                <p>If you have any questions, feel free to contact: <a href="mailto:info@yatrazone.com">info@yatrazone.com</a>.</p>
                <p>&copy; ${new Date().getFullYear()} YatraZone. All rights reserved.</p>
            </div>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>`,
                                })
                            } catch (error) {
                                console.error("Error sending email:", error);
                            }

                            router.push(`/checkout/orderConfirmed/${response.razorpay_order_id}`);

                            toast.success("Payment successful! Check your email for details.", {
                                style: { borderRadius: "10px", border: "2px solid green" },
                            })
                        }
                    },
                    prefill: {
                        name: formData.fullName,
                        email: formData.email,
                        contact: formData.mobile,
                    },
                    theme: {
                        color: "#2563EB",
                    },
                }

                const rzp = new window.Razorpay(options)
                const handlePaymentFailed = async (response) => {
                    const { error } = response;

                    const emailMessage = `
                            <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Failed</title>
    <style type="text/css">
    .header {
            text-align: center;
            padding: 20px 0;
        }
        .header img {
            max-width: 300px;
        }
        @media only screen and (max-width: 600px) {
            .container {
                width: 100% !important;
            }
            .content {
                padding: 20px !important;
            }
            .payment-details {
                padding: 15px !important;
            }
        }
        .footer {
            text-align: center;
            padding: 20px;
            font-size: 14px;
            color: #777777;
            border-top: 1px solid #eeeeee;
            margin-top: 20px;
        }
        .footer a {
            color: #007BFF;
            text-decoration: none;
        }
    </style>
    <script
  src="https://unpkg.com/@dotlottie/player-component@2.7.12/dist/dotlottie-player.mjs"
  type="module"
></script>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
        <tr>
            <td align="center" style="padding: 20px 0;">
                <table class="container" role="presentation" width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);">
                    <!-- Header -->
                    <tr>
    <td align="center" style="padding: 30px 0; background-color: #EF4444;; border-top-left-radius: 8px; border-top-right-radius: 8px;">
        <a href="https://yatrazone.vercel.app/" class="header">
            <img src="https://yatrazone.vercel.app/logo.png" alt="YatraZone Logo" style="max-width: 300px;">
        </a>

        <!-- Centered Table -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 20px;">
            <tr>
                <td align="center">
                    <img src="https://yatrazone.vercel.app/cancel.gif" alt="Payment Failed Animation" style="width: 100px; height: 100px;">
                </td>
            </tr>
            <tr>
                <td align="center">
                    <p style="margin: 10px 0 5px; font-size: 32px; font-weight: 600;">₹${formatNumber(advancePayment)}</p>
                    <h1 style="margin: 0; font-size: 24px;">Payment Failed</h1>
                </td>
            </tr>
        </table>
    </td>
</tr>
                    <!-- Content -->
                    <tr>
                        <td class="content" style="padding: 40px 30px;">
                            <p style="margin-top: 0; color: #333333; font-size: 16px; line-height: 1.5;">Hello, ${formData.fullName}</p>
                            <p style="color: #333333; font-size: 16px; line-height: 1.5;">
  We're sorry, but your recent payment for 
  <span style="font-weight: 700; color: #00ABE9">${packages.packageName}</span> could not be processed.
</p>

                             <p style="color: #333333; font-size: 16px; line-height: 1.5;">
  In case your money has been debited, it will be credited to your bank account within 5-7 business days.
</p>
                            <div class="payment-details" style="background-color: #f8f9fa; border-radius: 4px; padding: 25px; margin: 30px 0;">
                                <h2 style="margin-top: 0; color: #333333; font-size: 18px;">Transaction Attempt Details</h2>
                                
                                <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 15px;">
                                    <tr>
                                        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">Amount</td>
                                        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold; color: #333333;">₹${formatNumber(advancePayment)}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">Payment ID</td>
                                        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right; color: #333333;">${error.metadata.payment_id}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">Payment Method</td>
                                        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right; color: #333333;">${error.source || 'N/A'}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">Attempted On</td>
                                        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right; color: #333333;">${new Date().toLocaleString()}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">Email</td>
                                        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right; color: #333333;">${formData.email}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Mobile Number</td>
                                        <td style="padding: 8px 0; text-align: right; color: #333333;">${formData.mobile}</td>
                                    </tr>
                                </table>
                            </div>
                            <p style="color: #333333; font-size: 16px; line-height: 1.5;">Common reasons for payment failure include:</p>
                            <p>Reason: ${error.description}</p>
                            <ul style="color: #333333; font-size: 16px; line-height: 1.5;">
                                <li>Insufficient funds</li>
                                <li>Incorrect card details</li>
                                <li>Card expired</li>
                                <li>Transaction declined by bank</li>
                            </ul>
                            
                            <p style="color: #333333; font-size: 16px; line-height: 1.5; text-align: center; padding-top: 24px;">For any order related queries please reach out to <a href="mailto:yatrazone.experts@gmail.com" style="color: #00ABE0">yatrazone.experts@gmail.com</a> or Call on <a href="tel:+918006000325" style="color: #00ABE0">+91 8006000325</a> </p>
                            
                            <div style="margin-top: 30px; text-align: center;">
                                <a href="https://yatrazone.vercel.app/profile/orders" style="display: inline-block; background-color: #10B981; color: #ffffff; text-decoration: none; padding: 12px 25px; border-radius: 4px; font-weight: bold;">View Your Account</a>
                            </div>
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 20px 30px; text-align: center; background-color: #f8f9fa; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px;">
                            <div class="footer">
            <p>If you have any questions, feel free to contact: <a href="mailto:info@yatrazone.com">info@yatrazone.com</a>.</p>
            <p>&copy; ${new Date().getFullYear()} YatraZone. All rights reserved.</p>
        </div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
                        `
                    await axios.post('/api/setOrderFailed', {
                        id: orderId
                    })
                    try {
                        await axios.post("/api/brevo", {
                            to: formData.email,
                            subject: "Payment Failed",
                            htmlContent: emailMessage,
                        });
                    } catch (error) {
                        console.error("Error sending email:", error);
                    }

                    toast.error("Payment failed! Check your email for details.", {
                        style: { borderRadius: "10px", border: "2px solid red" },
                    });

                    // Clean up the event listener
                    rzp.off("payment.failed", handlePaymentFailed);
                };

                rzp.on("payment.failed", handlePaymentFailed);

                rzp.open()
            }
            document.body.appendChild(script)
        } catch (error) {
            console.error("Error during payment:", error);
            if (error.response) {
                // Server responded with a status code outside 2xx
                toast.error(`Error: ${error.response.data.error || "Payment failed"}`);
            } else if (error.request) {
                // No response received
                toast.error("No response from the server. Please try again.");
            } else {
                // Something went wrong in setting up the request
                toast.error("An error occurred. Please try again.");
            }
        }
    }

    if (!session || session.user.isAdmin === true) {
        router.push(`/sign-in?callbackUrl=${encodeURIComponent(pathname)}`);
    }

    return (
        <SidebarInset>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 xl:gap-20 p-6">
                {/* Form Section */}
                {step === "form" && (
                    <form onSubmit={handleFormSubmit} onChange={() => { setIsFormDirty(true) }} className="h-fit space-y-4 p-8 bg-white shadow-lg rounded-xl border-2 border-blue-300">
                        <div>
                            <h2 className="text-3xl font-bold mb-6">Booking Form</h2>
                            <div className="lg:grid grid-cols-1 lg:grid-cols-2 gap-4 font-barlow">
                                {/* Total Persons */}
                                <div>
                                    <label className="block text-sm font-medium mb-1">Total No. of Persons</label>
                                    <Select
                                        value={formData.totalPersons}
                                        onValueChange={(value) => setFormData({ ...formData, totalPersons: value })}
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

                                {/* Full Name */}
                                <div>
                                    <label className="block text-sm font-medium mb-1">Full Name</label>
                                    <Input
                                        type="text"
                                        className="outline-none border-2 border-blue-600 bg-transparent focus-visible:ring-0 focus:ring-0 focus-visible:outline-none focus:outline-none"
                                        value={formData.fullName}
                                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                        required
                                    />
                                </div>

                                {/* Mobile Number */}
                                <div>
                                    <label className="block text-sm font-medium mb-1">10-Digit Mobile Number</label>
                                    <Input
                                        type="number"
                                        className="outline-none border-2 border-blue-600 bg-transparent focus-visible:ring-0 focus:ring-0 focus-visible:outline-none focus:outline-none"
                                        value={formData.mobile}
                                        onChange={(e) => {
                                            // Ensure the input value is no longer than 10 digits
                                            if (e.target.value.length <= 10) {
                                                setFormData({ ...formData, mobile: e.target.value });
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
                                        value={formData.apartment}
                                        onChange={(e) => setFormData({ ...formData, apartment: e.target.value })}
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
                                        value={formData.instructions}
                                        onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                        {packages?.basicDetails?.heliBooking === "Yes" && <div className="space-y-4 pt-8 font-barlow">
                            <h2 className="text-2xl font-bold font-gilda">Helicopter Booking Form</h2>

                            {/* Number of Adults */}
                            <div>
                                <label className="block text-sm font-medium mb-1">Number of Adults</label>
                                <Input
                                    type="number"
                                    min={0}
                                    value={heliFormData.numAdults}
                                    onChange={(e) => handleInputChange(e, "numAdults")}
                                    className="outline-none border-2 border-blue-600 bg-transparent focus-visible:ring-0 focus:ring-0 focus-visible:outline-none focus:outline-none"
                                    required
                                />
                            </div>

                            {/* Adults Details */}
                            {Array.from({ length: heliFormData.numAdults }).map((_, index) => (
                                <div key={index} className="space-y-4 p-4 bg-white rounded-lg border border-gray-200">
                                    <h3 className="text-lg font-semibold">Adult {index + 1}</h3>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Full Name</label>
                                        <Input
                                            type="text"
                                            value={heliFormData.adults[index]?.fullname || ""}
                                            onChange={(e) => handleInputChange(e, "fullname", index, "adults")}
                                            className="outline-none border-2 border-blue-600 bg-transparent focus-visible:ring-0 focus:ring-0 focus-visible:outline-none focus:outline-none"

                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Age</label>
                                        <Input
                                            type="number"
                                            value={heliFormData.adults[index]?.age || ""}
                                            onChange={(e) => handleInputChange(e, "age", index, "adults")}
                                            className="outline-none border-2 border-blue-600 bg-transparent focus-visible:ring-0 focus:ring-0 focus-visible:outline-none focus:outline-none"

                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Weight (kg)</label>
                                        <Input
                                            type="number"
                                            value={heliFormData.adults[index]?.weight || ""}
                                            onChange={(e) => handleInputChange(e, "weight", index, "adults")}
                                            className="outline-none border-2 border-blue-600 bg-transparent focus-visible:ring-0 focus:ring-0 focus-visible:outline-none focus:outline-none"
                                        />
                                    </div>

                                    {/* ID Proof */}
                                    <div>
                                        <label className="block text-sm font-medium mb-1">ID Proof</label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleFileChange(e, index, "adults")}
                                        />
                                        {heliFormData.adults[index]?.idProof?.url && (
                                            <div className="mt-2 relative flex items-center gap-4 aspect-video">
                                                <Image
                                                    src={heliFormData.adults[index].idProof.url}
                                                    width={1280}
                                                    height={720}
                                                    quality={25}
                                                    alt="ID Proof"
                                                    className="w-full h-full object-cover rounded-lg"
                                                />
                                                <Button
                                                    type="button"
                                                    size={"icon"}
                                                    onClick={() => handleDeleteImage(index, "adults")}
                                                    className="bg-red-500 absolute top-0 right-0 rounded-full text-white hover:bg-red-600"
                                                >
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}

                            <div>
                                <label className="block text-sm font-medium mb-1">10-Digit Mobile Number</label>
                                <Input
                                    type="number"
                                    className="outline-none border-2 border-blue-600 bg-transparent focus-visible:ring-0 focus:ring-0 focus-visible:outline-none focus:outline-none"
                                    value={formData.mobile}
                                    onChange={(e) => {
                                        // Ensure the input value is no longer than 10 digits
                                        if (e.target.value.length <= 10) {
                                            setFormData({ ...formData, mobile: e.target.value });
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
                                    value={formData.apartment}
                                    onChange={(e) => setFormData({ ...formData, apartment: e.target.value })}
                                />
                            </div>
                        </div>
                        }
                        {/* Pickup Location */}
                        <div>
                            <label className="block text-sm font-medium mb-1">Pickup Location</label>
                            <Input
                                type="text"
                                value={heliFormData.pickupLocation}
                                onChange={(e) => handleInputChange(e, "pickupLocation")}
                                className="outline-none border-2 border-blue-600 bg-transparent focus-visible:ring-0 focus:ring-0 focus-visible:outline-none focus:outline-none"
                                required
                            />
                        </div>

                        {/* Dropoff Location */}
                        <div>
                            <label className="block text-sm font-medium mb-1">Dropoff Location</label>
                            <Input
                                type="text"
                                value={heliFormData.dropoffLocation}
                                onChange={(e) => handleInputChange(e, "dropoffLocation")}
                                className="outline-none border-2 border-blue-600 bg-transparent focus-visible:ring-0 focus:ring-0 focus-visible:outline-none focus:outline-none"
                                required
                            />
                        </div>

                        {/* Medical Requirements */}
                        <div>
                            <label className="block text-sm font-medium mb-1">Medical Requirements</label>
                            <Textarea
                                value={heliFormData.medicalRequirements}
                                onChange={(e) => handleInputChange(e, "medicalRequirements")}
                                className="outline-none border-2 border-blue-600 bg-transparent focus-visible:ring-0 focus:ring-0 focus-visible:outline-none focus:outline-none"
                            />
                        </div>

                        {/* Special Requirements */}
                        <div>
                            <label className="block text-sm font-medium mb-1">Special Requirements</label>
                            <Textarea
                                value={heliFormData.specialRequirements}
                                onChange={(e) => handleInputChange(e, "specialRequirements")}
                                className="outline-none border-2 border-blue-600 bg-transparent focus-visible:ring-0 focus:ring-0 focus-visible:outline-none focus:outline-none"
                            />
                        </div>


                        {/* Submit Button */}
                        <Button type="submit" className="w-full mt-8 !py-6 border-2 font-barlow text-lg border-blue-600 bg-blue-200 hover:bg-blue-600 hover:text-white text-black">
                            Continue to Booking Details
                        </Button>
                    </form>
                )}

                {/* Booking Details Section */}
                {step === "booking" && (
                    <div className="flex flex-col gap-8 font-barlow">
                        <div className="space-y-4 p-8 shadow-2xl rounded-xl border-2 border-blue-300 h-fit">
                            <h2 className="text-3xl font-bold mb-6 font-gilda">Booking Details</h2>

                            {/* Travel Date */}
                            <div className="font-barlow">
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
                                <Input
                                    type="text"
                                    className="resize-none outline-none border-2 border-blue-600 bg-transparent focus-visible:ring-0 focus:ring-0 focus-visible:outline-none focus:outline-none"
                                    value={bookingDetails.departureLocation}
                                    onChange={(e) =>
                                        setBookingDetails({ ...bookingDetails, departureLocation: e.target.value })
                                    }
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
                        </div>
                        {packages?.basicDetails?.heliBooking === "Yes" && <div className="space-y-4 p-8 bg-blue-100 rounded-xl border-2 border-blue-300 h-fit">
                            <h2 className="text-3xl font-bold mb-6 font-gilda">Special Note: Follow Heli Tour Policy</h2>

                            <div className="space-y-4 pt-8">
                                <p className="font-semibold text-justify">
                                    Each helicopter can accommodate up to 6 passengers with a total body weight limitation of 445 kg for 6 passengers.</p>
                                <p className="font-semibold text-justify">
                                    Yatrazone: Your Spiritual Travel Solution holds the right to de-board the passenger if the given body weight deviates from the actual body weight provided at the time of making the booking. In such a scenario, we will not be liable to provide the refund amount to any passenger de-boarded. Passengers are requested to share the exact body weight measured on an electronic measuring scale.</p>
                                <p className="font-semibold text-justify">
                                    Passengers with body weight above 75 kg will be charged INR 2,000. This amount will be collected in Dehradun to avoid last-minute hassle.</p>
                                <p className="font-semibold text-justify">
                                    In case the overall body weight exceeds more than 450 kg, passengers whose given body weight is wrong will be charged INR 2,500 per kg only on the final call of the pilot, else will be de-boarded without any refund.</p>
                                <p className="font-semibold text-justify">
                                    By submitting this information, you acknowledge that the details provided are accurate and complete. The service provider is not responsible for any inaccuracies or omissions in the provided data. Any medical or special requirements should be communicated clearly, and the service provider will make reasonable efforts to accommodate these needs.</p>
                                <p className="font-semibold text-justify">
                                    The transportation service is provided based on availability, and all applicable terms and conditions apply. The tour package pricing and the minimum rate indicated above may change based on the hotels and transportation options available on that particular date. While subject to change, providing an estimated date as early as possible helps streamline the planning process and ensures that you secure the best options for your travel. Be sure to review and update this date if your plans change to avoid any potential disruptions.</p>
                            </div>
                        </div>}
                        <div className="space-y-4 p-8 bg-blue-100 rounded-xl border-2 border-blue-300 h-fit">
                            <h2 className="text-3xl font-bold mb-6 font-gilda">Review Customer Information</h2>

                            {/* Customer Name */}
                            <div>
                                <p className="block mb-1 text-sm font-medium text-gray-800">Name of Traveller: <span className="font-bold text-base text-blue-600">{formData.fullName}</span></p>
                                <p className="block mb-1 text-sm font-medium text-gray-800">Contact Number: <span className="font-bold text-base text-blue-600">+91 {formData.mobile}</span></p>
                                <p className="block mb-1 text-sm font-medium text-gray-800">Email: <span className="font-bold text-base text-blue-600">{formData.email}</span></p>
                                <p className="block mb-1 text-sm font-medium text-gray-800">Address: <span className="font-bold text-base text-blue-600">{formData.address}, {formData.city}, {formData.state}, {formData.pincode}</span></p>
                            </div>

                            <div className="space-y-8 pt-8">
                                <p className="font-semibold text-justify">Note: The tour package pricing and the minimum rate indicated above may change based on the hotels and transportation options available on that particular date. While subject to change, providing an estimated date as early as possible helps streamline the planning process and ensures that you secure the best options for your travel. Be sure to review and update this date if your plans change to avoid any potential disruptions.</p>

                                <p>Our team will connect with you shortly to discuss the details and help you create an amazing travel experience.</p>

                                <p>If you have any immediate questions or preferences,
                                    feel free to share with us!</p>

                                <p>Email: <Link href={"mailto:info@yatrazone.com"} className="text-blue-600 font-semibold">Info@yatrazone.com</Link> or call <Link href={"tel:+918006000325"} className="text-blue-600 font-semibold"> +91 8006000325</Link></p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Booking Preview Section */}
                <div className="p-8 rounded-xl sticky top-24 font-barlow bg-white shadow-2xl w-fit h-fit space-y-6">
                    {/* Header */}
                    <h2 className="text-3xl font-bold text-gray-900 font-gilda">Booking Preview</h2>

                    {/* Package Thumbnail */}
                    <div className="relative aspect-video overflow-hidden rounded-lg">
                        <Image
                            src={packages.basicDetails?.thumbnail?.url}
                            alt={packages.packageName}
                            blurDataURL={packages.basicDetails?.thumbnail?.url}
                            placeholder="blur"
                            fill
                            className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                        <h3 className="absolute bottom-4 left-4 text-2xl md:text-4xl font-semibold font-gilda text-white">
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

                    {/* Total Price Section */}
                    <div className="p-6 bg-blue-50 rounded-lg">
                        <h4 className="text-xl font-bold text-blue-900 mb-3">Total Amount</h4>
                        <p className="text-lg font-semibold text-gray-800">
                            ₹<span className="text-2xl text-blue-600 font-bold">{formatNumber(totalPrice)}</span> (
                            <span className="text-xl text-blue-600 font-bold">{formData.totalPersons || 0}</span> persons)
                        </p>
                        <p className="text-sm text-gray-600 mt-2">
                            This is the total amount you need to pay for the booking.
                        </p>
                    </div>

                    {/* Advance Payment Section */}
                    <div className="p-6 bg-blue-50 rounded-lg">
                        <h4 className="text-xl font-bold text-blue-900 mb-3">Advance Payment (25%)</h4>
                        <p className="text-lg font-semibold text-gray-800">
                            ₹<span className="text-2xl text-blue-600 font-bold">{formatNumber(advancePayment)}</span>
                        </p>
                        <p className="text-sm text-gray-600 mt-2">
                            Pay this amount now to confirm your booking. The remaining amount will be paid later.
                        </p>
                    </div>

                    {/* Payment Button */}
                    <button onClick={handlePayment} disabled={step !== "booking" || !bookingDetails.travelDate || !bookingDetails.departureLocation} className="w-full disabled:bg-blue-600/50 disabled:cursor-not-allowed font-bold bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors duration-300">
                        Pay Now (₹<span className="text-xl text-white font-bold">{formatNumber(advancePayment)}</span>)
                    </button>
                </div>

            </div>
        </SidebarInset >
    );
}

export default Checkout;