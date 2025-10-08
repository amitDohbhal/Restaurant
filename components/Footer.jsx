'use client'

import { Handshake, Phone, Send, MapPin } from "lucide-react"
import Link from "next/link"
import { usePathname } from 'next/navigation'
import { useEffect, useState } from "react"
import { Card, CardContent, CardFooter } from "./ui/card"
import Image from "next/image"
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import toast from "react-hot-toast"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "./ui/accordion"
import CurrentYear from './CurrentYear';
const Footer = () => {
    const pathName = usePathname()
    const [pages, setPages] = useState([])
    const [contactInfo, setContactInfo] = useState({
        phoneNumbers: [],
        emails: [],
        address1: '',
        address2: '',
        city1: '',
        state1: '',
        pincode1: ''
    })

    useEffect(() => {
        const fetchContactInfo = async () => {
            try {
                const response = await fetch('/api/addBasicInfo');
                const data = await response.json();
                if (data && data.length > 0) {
                    // Assuming the first document contains the contact info
                    const info = data[0];
                    console.log('Contact Info:', info);
                    setContactInfo({
                        phoneNumbers: [
                            info.contactNumber1,
                            info.contactNumber2,
                            info.contactNumber3
                        ].filter(Boolean), // This removes any empty/undefined numbers
                        emails: [
                            info.email1,
                            info.email2
                        ].filter(Boolean), // This removes any empty/undefined emails
                        address1: info.address1 || '',
                        address2: info.address2 || '',
                        city1: info.city1 || '',
                        state1: info.state1 || '',
                        pincode1: info.pincode1 || ''
                    });
                }
            } catch (error) {
                console.error('Failed to fetch contact info:', error);
            }
        };

        const fetchPages = async () => {
            try {
                const response = await fetch("/api/getAllPages")
                const data = await response.json()
                setPages(data.pages)
            } catch (error) {
                // console.error("Error fetching pages:", error)
            }
        }
        fetchPages();
        fetchContactInfo();
    }, [])

    const handleSubmit = async (e) => {
        e.preventDefault();
        const email = e.target.elements.email.value.trim();
        if (!email) {
            return toast.error("Please Enter Your Email", { style: { borderRadius: "10px", border: "2px solid red" } });
        }
        try {
            const res = await fetch('/api/newsLetter', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success("Thank you for Subscribing!", { style: { borderRadius: "10px", border: "2px solid green" } });
                e.target.reset();
            } else {
                toast.error(data.message || "Subscription failed.", { style: { borderRadius: "10px", border: "2px solid red" } });
            }
        } catch {
            toast.error("An error occurred.", { style: { borderRadius: "10px", border: "2px solid red" } });
        }
    };

    return (
        <footer className={`print:hidden ${pathName.includes('admin') && 'hidden'}
         ${pathName.includes('artisan') && 'block'} ${pathName.includes('product') && 'block'} ${pathName.includes('customEnquiry') && 'hidden'} ${pathName.includes('checkout') && 'hidden'}  ${pathName.includes('category') && 'block'} bg-black py-4 text-white`}>
            {/* <div className="w-full flex justify-center pb-8">
                <div className="h-[3px] bg-black w-full mx-auto px-4" />
            </div> */}
            <div className="hidden md:flex flex-wrap lg:justify-between px-10 justify-start md:gap-20 lg:gap-0 gap-12 max-w-[22rem] md:maxw-[45rem] lg:max-w-[60rem] xl:max-w-6xl mx-auto">
                <div className="flex flex-col gap-2 px-5">
                    <h1 className="font-semibold text-xl my-4">Main Menu</h1>
                    <Link href={'/'} className="block text-white font-barlow ">Home</Link>
                    {pages.filter(page => !page?.link?.includes('policy')).map(page => (
                        <Link key={page._id} href={page.url} className="block text-white font-barlow ">
                            {page.title}
                        </Link>
                    ))}
                    <Link href={'/contact'} className="block text-white font-barlow ">Contact</Link>
                </div>

                <div className="flex flex-col gap-2 px-6">
                    <h1 className="font-semibold text-xl my-4">Our Policy</h1>
                    {pages.filter(page => page?.link?.includes('policy')).map(page => (
                        <Link key={page._id} href={page.url} className="block text-white font-barlow">
                            {page.title}
                        </Link>
                    ))}
                    <Link href={'/faq'} className="block text-white font-barlow ">FAQ</Link>
                </div>

                <div className="flex flex-col gap-1">
                    <h1 className="font-semibold text-xl flex items-center gap-2">More Inquiry</h1>
                    <div className="flex items-start gap-2">
                        {contactInfo.phoneNumbers && contactInfo.phoneNumbers.length > 0 ? (
                            contactInfo.phoneNumbers.map((phone, index) => (
                                <Link key={index} href={`tel:${phone}`} className="my-2 rounded-full py-1 font-barlow text-white flex items-center gap-2">
                                    {index === 0 && <Phone size={20} className="text-blue-600" />}
                                    {phone}
                                </Link>
                            ))
                        ) : (
                           null
                        )}
                    </div>
                    <div className="flex items-start gap-2">
                        <div className="py-2">
                            <Send className="text-blue-600" size={20} />
                        </div>
                        <div className="flex items-start flex-col gap-1 py-2">
                            {contactInfo.emails && contactInfo.emails.length > 0 ? (
                                contactInfo.emails.map((email, index) => (
                                    <Link key={index} href={`mailto:${email}`} className="rounded-full font-barlow text-white flex items-center gap-2">
                                        {email}
                                    </Link>
                                ))
                            ) : (
                                null
                            )}
                        </div>
                    </div>
                    <div className="gap-2 my-2 font-barlow text-white mb-5">
                        <div className="flex items-start gap-2">
                            <MapPin className="text-blue-600 mt-1 flex-shrink-0" size={20} />
                            <div>
                                <p>{contactInfo.address1}</p>
                                {contactInfo.address2 && <p>{contactInfo.address2}</p>}
                                <p>{contactInfo.city1}, {contactInfo.state1} - {contactInfo.pincode1}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="md:hidden flex items-center gap-2 justify-start px-5">
                <div className="flex flex-col gap-2 px-2">
                    <h1 className="font-semibold text-xl my-4">Main Menu</h1>
                    <Link href={'/'} className="block text-white font-barlow ">Home</Link>
                    {pages.filter(page => !page?.link?.includes('policy')).map(page => (
                        <Link key={page._id} href={page.url} className="text-sm block text-white font-barlow ">
                            {page.title}
                        </Link>
                    ))}
                    <Link href={'/contact'} className="text-sm block text-white font-barlow ">Contact</Link>
                </div>

                <div className="flex flex-col gap-2 px-2">
                    <h1 className="font-semibold text-xl my-4">Our Policy</h1>
                    {pages.filter(page => page?.link?.includes('policy')).map(page => (
                        <Link key={page._id} href={page.url} className="text-sm block text-white font-barlow">
                            {page.title}
                        </Link>
                    ))}
                    <Link href={'/faq'} className="text-sm block text-white font-barlow ">FAQ</Link>
                </div>
            </div>
            <div className="md:hidden flex flex-col gap-1 p-5">
                <h1 className="font-semibold text-xl flex items-center gap-2">More Inquiry</h1>
                <div className="flex items-start gap-2">
                    {contactInfo.phoneNumbers && contactInfo.phoneNumbers.length > 0 ? (
                        contactInfo.phoneNumbers.map((phone, index) => (
                            <Link key={index} href={`tel:${phone}`} className="my-2 text-sm rounded-full py-1 font-barlow text-white flex items-center gap-2">
                                {index === 0 && <Phone size={20} className="text-blue-600" />}
                                {phone}
                            </Link>
                        ))
                    ) : (
                        null
                    )}
                </div>
                <div className="flex items-start gap-2">
                    <div className="py-2">
                        <Send className="text-blue-600" size={20} />
                    </div>
                    <div className="flex items-start flex-col gap-1 py-2">
                        {contactInfo.emails && contactInfo.emails.length > 0 ? (
                            contactInfo.emails.map((email, index) => (
                                <Link key={index} href={`mailto:${email}`} className="text-sm rounded-full font-barlow text-white flex items-center gap-2">
                                    {email}
                                </Link>
                            ))
                        ) : (
                            null
                        )}
                    </div>
                </div>
                <div className="my-2 text-sm font-barlow text-white mb-5">
                    <div className="flex items-start gap-2">
                        <MapPin className="text-blue-600 mt-1 flex-shrink-0" size={20} />
                        <div>
                            <p>{contactInfo.address1}</p>
                            {contactInfo.address2 && <p>{contactInfo.address2}</p>}
                            <p>{contactInfo.city1}, {contactInfo.state1} - {contactInfo.pincode1}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Accordance Section */}
            <div className="w-full flex justify-center my-4">
                <div className="w-[85%]">
                    <Accordion type="single" collapsible className="bg-[#fff] rounded-md  mb-8">
                        <AccordionItem value="item-1">
                            <AccordionTrigger className="text-black px-6 py-4 text-base ">IMPORTANT NOTICE</AccordionTrigger>
                            <AccordionContent className="text-gray-900 px-6 pb-6 pt-1 text-sm space-y-3">
                                <p>
                                    <strong>Purchasing Policy</strong><br />
                                    At Adventure Axis, we strive to offer a seamless and secure shopping experience. Our purchasing policy outlines everything you need to know when placing an order with us.
                                </p>

                                <ul className="list-disc list-inside space-y-2">
                                    <li>
                                        <strong>1. Product Availability</strong><br />
                                        We aim to keep our inventory up-to-date. However, due to demand, some items may go out of stock. In such cases:
                                        <ul className="list-disc list-inside ml-4">
                                            <li>You will be notified promptly.</li>
                                            <li>We may offer an alternative or initiate a full refund as per your preference.</li>
                                        </ul>
                                    </li>

                                    <li>
                                        <strong>2. Order Placement</strong>
                                        <ul className="list-disc list-inside ml-4">
                                            <li>Select your items and proceed to checkout.</li>
                                            <li>Provide accurate billing and shipping details.</li>
                                            <li>Complete payment through our secure gateway.</li>
                                        </ul>
                                        <p className="ml-4">Note: Orders with incomplete or incorrect information may be delayed or canceled.</p>
                                    </li>

                                    <li>
                                        <strong>3. Payment Methods</strong>
                                        <ul className="list-disc list-inside ml-4">
                                            <li>Credit/Debit Cards (Visa, MasterCard, etc.)</li>
                                            <li>UPI / Wallets / Net Banking (for India)</li>
                                            <li>PayPal / Razorpay / Stripe (International Orders)</li>
                                        </ul>
                                        <p className="ml-4">All transactions are encrypted and 100% secure.</p>
                                    </li>

                                    <li>
                                        <strong>4. Order Confirmation</strong>
                                        <ul className="list-disc list-inside ml-4">
                                            <li>You will receive an email confirmation with your order number and details.</li>
                                            <li>A separate email will be sent once the order is dispatched, along with tracking info.</li>
                                        </ul>
                                    </li>

                                    <li>
                                        <strong>5. Pricing & Taxes</strong>
                                        <ul className="list-disc list-inside ml-4">
                                            <li>All prices are listed in [INR/USD] and include applicable taxes unless otherwise stated.</li>
                                            <li>Shipping charges, if any, will be calculated at checkout based on location and package size.</li>
                                            <li>Promotional discounts cannot be combined unless explicitly stated.</li>
                                        </ul>
                                    </li>

                                    <li>
                                        <strong>6. Cancellations</strong>
                                        <ul className="list-disc list-inside ml-4">
                                            <li>You may cancel your order within 12 hours of placing it or before shipment.</li>
                                            <li>Once dispatched, orders cannot be canceled. Please refer to our Return Policy instead.</li>
                                        </ul>
                                    </li>

                                    <li>
                                        <strong>7. Fraud Prevention</strong>
                                        <ul className="list-disc list-inside ml-4">
                                            <li>We may verify orders manually for high-value purchases.</li>
                                            <li>We reserve the right to cancel orders suspected of fraudulent activity, with or without notice.</li>
                                        </ul>
                                    </li>

                                    <li>
                                        <strong>8. Bulk or Custom Orders</strong><br />
                                        We welcome bulk purchases or custom requests (e.g., branded adventure kits, expedition gear).<br />
                                        Contact our team at support@adventureaxis.in for quotations and lead times.
                                    </li>

                                    <li>
                                        <strong>9. Customer Support</strong>
                                        <ul className="list-disc list-inside ml-4">
                                            <li>📧 Email: support@adventureaxis.in</li>
                                            <li>☎ Call/WhatsApp: +91 07669280002</li>
                                            <li>🕒 Hours: Monday to Saturday, 10:00 AM – 6:00 PM IST</li>
                                        </ul>
                                    </li>

                                    <li>
                                        <strong>10. Acceptance of Policy</strong><br />
                                        By placing an order on our website, you agree to the terms outlined in this Purchasing Policy.
                                    </li>
                                </ul>
                            </AccordionContent>

                        </AccordionItem>
                    </Accordion>
                </div>
            </div>

            <Card className="my-2 px-2 py-8 max-w-xl lg:max-w-4xl xl:max-w-7xl mx-auto">
                <CardContent className="flex flex-col lg:flex-row items-start justify-between">
                    <div className="text-justify">
                        <Image src="/HeaderLogo.png" priority width={250} height={250} alt="footer" />
                        <p className="text-black text-sm lg:w-[40vw] xl:w-[35vw] font-barlow mt-6">Adventure Axis offers a comprehensive range of adventure sports equipment under one roof. Our categories include Water Sports Equipment such as rafts, kayaks, dry bags, paddles, life jackets, helmets, and repair kits. In Safety & Rescue, we provide harnesses, carabiners, ropes, pulleys, fall arresters, rescue devices, and helmets. Our Clothing & Footwear range features tactical eyewear, base layers, fleece, insulated wear, and high-performance outdoor footwear. We also specialize in Camping & Outdoor gear and Expedition Equipment, ensuring you're fully equipped for any terrain or challenge.</p>
                        <p className="text-black text-sm lg:w-[40vw] xl:w-[35vw] font-barlow mt-6">Our website is your gateway to the heart of Rishikesh, offering rich and soulful handmade creations crafted by local artisans.</p>
                    </div>
                    <div className="font-barlow mt-10 lg:mt-0">
                        <h1 className="font-semibold text-xl ">Subscribe to our newsletter</h1>
                        <form onSubmit={handleSubmit} className="mt-4 flex overflow-hidden rounded-lg bg-gray-200">
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="Enter your email"
                                className="border-0 rounded-none focus:ring-0 focus-visible:ring-0 focus:outline-none bg-gray-200"
                            />
                            <button
                                type="submit"
                                className="bg-red-600 text-white text-sm p-2 h-full"
                            >
                                Subscribe
                            </button>
                        </form>


                        <p className="text-black text-sm lg:w-[30vw] xl:w-[20vw]  mt-6">Stay Informed. Stay Ahead.</p>
                        <p className="text-black text-sm lg:w-[30vw] xl:w-[23vw]">Subscribe to our newsletter to get the latest updates.</p>
                    </div>
                </CardContent>
                <CardFooter className="mt-8 flex flex-col items-start md:w-fit">
                    <div className="w-full h-[1px] bg-gray-400" />
                    <div className="flex items-center justify-between font-barlow">
                        <div className="flex flex-col md:flex-row items-start  md:items-center gap-2">
                            <Link href={'/terms-condition'} className="0 !text-sm font-semibold">Terms of Use</Link>
                            <p className="text-gray-900 md:block hidden">|</p>
                            <Link href={'/privacy-policy'} className="0 !text-sm font-semibold">Privacy and Cookies Policy</Link>
                        </div>
                    </div>
                </CardFooter>
            </Card>
            <div className="flex flex-col lg:flex-row items-center justify-center max-w-[25rem] md:max-w-[60rem] xl:max-w-6xl mx-auto font-barlow">
                <p className="text-white font-bold text-center my-4">
                    &copy; <CurrentYear /> <Link href={'/'} className="font-bold text-white">Hotel Royal Shivam</Link>. All rights reserved
                </p>
            </div>
        </footer >
    )
}

export default Footer
