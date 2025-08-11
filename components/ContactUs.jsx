'use client'

import { House, Mail, MapPin, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useState, useEffect } from "react"
import toast from "react-hot-toast"
import { useSession } from "next-auth/react"
const ContactUs = () => {
    const { data: session } = useSession();
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
    });

    const [phoneError, setPhoneError] = useState("");

    // Auto-fill form when user signs in
    useEffect(() => {
        if (session?.user) {
            setFormData(prev => ({
                ...prev,
                name: session.user.name || "",
                email: session.user.email || "",
                phone: session.user.phone || "",
            }));
        }
    }, [session]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === "phone") {
            const numericValue = value.replace(/\D/g, "");
            if (numericValue.length > 10) return;

            setFormData({ ...formData, phone: numericValue });

            if (numericValue.length !== 10) {
                setPhoneError("Phone number must be exactly 10 digits.");
            } else {
                setPhoneError("");
            }
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.phone.length !== 10 || isNaN(formData.phone)) {
            setPhoneError("Phone number must be exactly 10 digits.");
            return;
        }

        try {
            const response = await fetch("/api/saveContact", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ...formData,
                    userId: session?.user?.id || null // Include user ID if available
                }),
            })

            const res = await response.json()
            if (!response.ok) {
                toast.error(res.message || "Something went wrong.");
                return;
            }

            toast.success("Form submitted successfully!", {
                style: { borderRadius: "10px", border: "2px solid green" }
            });

            // Don't reset if user is signed in (keep their info)
            setFormData(prev => ({
                ...prev,
                subject: "",
                message: "",
            }))
        } catch (error) {
            // console.error("Error submitting form:", error);
            toast.error("Something went wrong. Please try again later.", {
                style: { borderRadius: "10px", border: "2px solid red" },
            });
        }
    };
    return (
        <div className="bg-[#fdf7f2] min-h-screen w-full flex flex-col items-center justify-start pt-5">
            <div className="container mx-auto px-5 md:px-10">
                <div className="flex flex-col lg:flex-row gap-8 w-full justify-center mt-10 md:px-20 px-10">
                    {/* Contact Info */}
                    <div className="lg:w-1/2 w-full flex flex-col justify-center text-black">
                        <h2 className="text-2xl md:text-5xl font-bold mb-4">DISCOVER US</h2>
                        <p className="mb-6 text-base w-[90%] ">
                            <span className="underline text-xl md:text-3xl">Adventure Axis is an complete outdoor shop. </span>
                            <br />
                            <span className='text-xl md:text-3xl'> Our experts are available to answer any questions you might have. We’ve got the answers.</span>
                        </p>
                        <div className="mb-4">
                            <h3 className="font-bold text-xl md:text-2xl mb-2">Call Us</h3>
                            <ul className="mb-2">
                                <li className='flex flex-row gap-2'>
                                    <a href="tel:+9107669280002" className="hover:underline text-xl">+91 07669280002</a>
                                    <a href="tel:+919897468886" className="hover:underline text-xl">+91 9897468886</a>
                                </li>
                            </ul>
                        </div>
                        <div className=''>
                            <h3 className="font-bold text-xl md:text-2xl mb-2 ">E-mail</h3>
                            <ul className="mb-2">
                                <li className='text-xl'>
                                    For Sales:
                                    <a href="mailto:info@adventureaxis.in" className="hover:underline text-md md:text-xl"> info@adventureaxis.in</a>
                                </li>
                                <li className='text-xl'>
                                    For Support:
                                    <a href="mailto:Accounts@adventureaxis.in" className="hover:underline text-md md:text-xl"> Accounts@adventureaxis.in</a>
                                </li>
                                <li className='text-xl'>
                                    For Official:
                                    <a href="mailto:Sales@adventureaxis.in" className="hover:underline text-md md:text-xl"> Sales@adventureaxis.in</a>
                                </li>
                            </ul>
                        </div>
                    </div>
                    {/* Contact Form */}
                    <div className="lg:w-1/2 w-full flex justify-center items-center">
                        <div className="bg-white/95 rounded-xl shadow-lg p-8 w-full max-w-md flex flex-col gap-4">
                            <form className="space-y-6 font-barlow" onSubmit={handleSubmit}>
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="flex items-center gap-2 text-blue-600"><span><House className="h-5 w-5" /></span>Full Name</Label>
                                    <Input
                                        onChange={handleChange}
                                        value={formData.name}
                                        id="name"
                                        name="name"
                                        placeholder="John Doe"
                                        required
                                        readOnly={!!session?.user}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="flex items-center gap-2 text-blue-600"><span><Mail className="h-5 w-5" /></span>Email</Label>
                                    <Input
                                        onChange={handleChange}
                                        value={formData.email}
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder="john@example.com"
                                        required
                                        readOnly={!!session?.user}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone" className="flex items-center gap-2 text-blue-600"><span><Phone className="h-5 w-5" /></span>Phone Number</Label>
                                    <Input
                                        onChange={handleChange}
                                        id="phone"
                                        name="phone"
                                        type="text"
                                        placeholder="Enter Number here"
                                        value={formData.phone}
                                        required
                                    />
                                    {phoneError && (
                                        <p className="text-sm text-red-600">{phoneError}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="subject" className="flex items-center gap-2 text-blue-600"><span><MapPin className="h-5 w-5" /></span>Subject</Label>
                                    <Input
                                        onChange={handleChange}
                                        value={formData.subject}
                                        id="subject"
                                        name="subject"
                                        placeholder="Subject"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="message" className="flex items-center gap-2 text-blue-600"><span><Mail className="h-5 w-5" /></span>Message</Label>
                                    <Textarea
                                        onChange={handleChange}
                                        value={formData.message}
                                        id="message"
                                        name="message"
                                        placeholder="Your message..."
                                        rows={4}
                                        required
                                    />
                                </div>
                                <Button type="submit" className="w-full bg-blue-600 text-white font-bold py-2 rounded hover:bg-orange-400 hover:text-white transition-colors">SUBMIT</Button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
            {/* Google Maps */}
            <div className="w-full mt-10 flex justify-center">
                <div className="w-full h-[200px md:h-[400px]  overflow-hidden ">
                    <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3450.807271918314!2d78.32066657501376!3d30.128327914592454!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39093e6896b55a3f%3A0xe5c76dc9610b2d2d!2sAdventure%20Axis!5e0!3m2!1sen!2sin!4v1753099742860!5m2!1sen!2sin" width="100%"
                        height="100%"
                        style={{ border: 0 }} allowFullScreen="" loading="lazy" 
                    title="Adventure Axix Location" referrerPolicy="no-referrer-when-downgrade"></iframe>
                </div>
            </div>
        </div>
    );
};

export default ContactUs;
