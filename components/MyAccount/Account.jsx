"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
    Package,
    MessageSquare,
    Eye,
    MessageCircle,
    Download,
    BellDot,
    RefreshCw
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { cn, formatDate } from "@/lib/utils"
import Sidebar from "./AccountSidebar"

export default function Account({ session, user, orders, customOrders, enquiries }) {
    const [activeTab, setActiveTab] = useState("bookings")
    const [unreadCounts, setUnreadCounts] = useState({
        bookings: 0,
        enquiries: 0
    });
    const [enhancedOrders, setEnhancedOrders] = useState([
        ...orders,
        ...customOrders
    ].map(order => ({ ...order, unreadCountUser: 0 })));
    const [enhancedEnquiries, setEnhancedEnquiries] = useState(
        enquiries.map(enquiry => ({ ...enquiry, unreadCountUser: 0 }))
    );

    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchData = async () => {
        setIsRefreshing(true);
        try {
            // 1. Fetch chat counts
            const countsResponse = await fetch(`/api/chat/user-unread-counts?userId=${user?._id}`);
            const countsData = await countsResponse.json();

            if (countsData.success) {
                const chatCounts = countsData.chatCounts;

                // 2. Enhance orders with unread counts
                const mergedOrders = [
                    ...orders,
                    ...customOrders
                ].map(item => ({
                    ...item,
                    unreadCountUser: chatCounts[item.orderId] || 0
                }));

                // 3. Enhance enquiries with unread counts
                const mergedEnquiries = enquiries.map(enquiry => ({
                    ...enquiry,
                    unreadCountUser: chatCounts[enquiry.id] || 0
                }));

                // 4. Calculate total unread counts
                const bookingsUnread = mergedOrders.reduce(
                    (sum, order) => sum + (order.unreadCountUser || 0), 0
                );
                const enquiriesUnread = mergedEnquiries.reduce(
                    (sum, enquiry) => sum + (enquiry.unreadCountUser || 0), 0
                );

                // 5. Update state
                setEnhancedOrders(mergedOrders);
                setEnhancedEnquiries(mergedEnquiries);
                setUnreadCounts({
                    bookings: bookingsUnread,
                    enquiries: enquiriesUnread
                });
            }
        } catch (error) {
            // console.error("Failed to fetch chat data:", error);
        } finally {
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        let timeoutId;

        const pollData = async () => {
            await fetchData();
            timeoutId = setTimeout(pollData, 10000); 
        };

        pollData();

        return () => clearTimeout(timeoutId);
    }, [user._id, orders, customOrders, enquiries]);

    const getStatusBadge = (status) => {
        switch (status.toLowerCase()) {
            case "confirmed":
                return <Badge className="hover:bg-green-500/75 bg-green-500/50 text-sm text-black border-2 border-green-500">Confirmed</Badge>
            case "paid":
                return <Badge className="hover:bg-green-500/75 bg-green-500/50 text-sm text-black border-2 border-green-500">Paid</Badge>
            case "failed":
                return <Badge className="hover:bg-red-500/75 bg-red-500/50 text-sm text-black border-2 border-red-500">Failed</Badge>
            case "pending":
                return (
                    <Badge variant="outline" className="hover:bg-amber-500/75 bg-amber-500/50 text-sm text-black border-2 border-amber-500">
                        Pending
                    </Badge>
                )
            case "completed":
                return <Badge className="hover:bg-green-500/75 bg-green-500/50 text-sm text-black border-2 border-green-500">Completed</Badge>
            case "cancelled":
                return <Badge className="hover:bg-red-500/75 bg-red-500/50 text-sm text-black border-2 border-red-500">Cancelled</Badge>
            case "resolved":
                return <Badge className="hover:bg-green-500/75 bg-green-500/50 text-sm text-black border-2 border-green-500">Resolved</Badge>
            default:
                return <Badge variant="outline">{status}</Badge>
        }
    }

    return (
        <div className="min-h-screen bg-muted/30 md:pt-40 font-barlow">

            <main className="max-w-[100rem] mx-auto px-4 py-8">
                <div className="flex flex-col lg:flex-row gap-8 md:mb-0 mb-32">
                    {/* Sidebar */}
                    <Sidebar session={session} user={user} />

                    {/* Main content */}
                    <div className="flex-1">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <div className="flex items-center mb-6">
                                <TabsList className="py-1 bg-blue-100">
                                    <TabsTrigger value="bookings" className="relative py-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white flex items-center gap-2">
                                        <Package className="h-4 w-4" />
                                        <span>My Bookings</span>
                                        {unreadCounts.bookings > 0 && (
                                            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                                {unreadCounts.bookings}
                                            </span>
                                        )}
                                    </TabsTrigger>
                                    <TabsTrigger value="enquiries" className="relative py-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white flex items-center gap-2">
                                        <MessageSquare className="h-4 w-4" />
                                        <span>My Enquiries</span>
                                        {unreadCounts.enquiries > 0 && (
                                            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                                {unreadCounts.enquiries}
                                            </span>
                                        )}
                                    </TabsTrigger>
                                </TabsList>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={fetchData} 
                                    disabled={isRefreshing}
                                    className="h-8 w-8 p-0"
                                    title="Refresh chats"
                                >
                                    <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                                </Button>
                            </div>

                            <TabsContent value="bookings" className="mt-0">
                                <Card className="border-2 border-blue-600">
                                    <CardContent className="p-0 overflow-hidden">
                                        {/* Responsive Scrollable Table Container */}
                                        <div className="lg:max-w-2xl xl:max-w-none mx-auto">
                                            <Table className="min-w-[900px] w-full">
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead className="w-[200px]">Order ID</TableHead>
                                                        <TableHead className="w-[250px]">Package Name</TableHead>
                                                        <TableHead className="w-[200px]">Booking Date</TableHead>
                                                        <TableHead className="w-[200px]">Travel Date</TableHead>
                                                        <TableHead className="w-[150px]">Status</TableHead>
                                                        <TableHead className="w-[200px] text-center">Actions</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {enhancedOrders.length > 0 ? (
                                                        enhancedOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map((order) => (
                                                            <TableRow key={order?._id}>
                                                                <TableCell className="font-medium">{order?.orderId}</TableCell>
                                                                <TableCell className="font-medium">{order?.package?.packageName}</TableCell>
                                                                <TableCell className="font-medium">{formatDate(order?.createdAt)}</TableCell>
                                                                <TableCell className="font-medium">{formatDate(order?.bookingDetails?.travelDate || order?.travelDate)}</TableCell>
                                                                <TableCell>{getStatusBadge(order?.status)}</TableCell>
                                                                <TableCell>
                                                                    <div className="flex flex-wrap xl:flex-nowrap items-center gap-2">
                                                                        <Button variant="ghost" asChild title="View Booking">
                                                                            <Link href={`/checkout/orderConfirmed/${order?.orderId}`}>
                                                                                <Eye className="h-4 w-4" />View
                                                                            </Link>
                                                                        </Button>
                                                                        <Button variant="ghost" asChild title="Chat with Admin" className="relative">
                                                                            <Link href={`/account/booking_chat/${order?.orderId}`}>
                                                                                <MessageCircle className="h-4 w-4" />Chat With Admin
                                                                                {order.unreadCountUser > 0 && (
                                                                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                                                                                        {order.unreadCountUser}
                                                                                    </span>
                                                                                )}
                                                                            </Link>
                                                                        </Button>
                                                                        <Button variant="ghost" asChild title="View Invoice">
                                                                            <Link href={`/account/invoice/${order?.orderId}`}>
                                                                                <Download className="h-4 w-4" />Invoice
                                                                            </Link>
                                                                        </Button>
                                                                    </div>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))
                                                    ) : (
                                                        <TableRow>
                                                            <TableCell colSpan={7} className="h-24 text-center">
                                                                No Bookings
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="enquiries" className="mt-0">
                                <Card className="border-2 border-blue-600">
                                    <CardContent className="p-0">
                                        <div className="lg:max-w-2xl xl:max-w-none mx-auto">
                                            <Table className="min-w-[900px] w-full">
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead className="w-[300px]">Enquiry ID</TableHead>
                                                        <TableHead className="w-[300px]">Package Name</TableHead>
                                                        <TableHead className="w-[200px]">Date</TableHead>
                                                        <TableHead className="w-[200px]">Status</TableHead>
                                                        <TableHead className="w-[200px] text-center">Actions</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {enhancedEnquiries?.length > 0 ? enhancedEnquiries?.map((enquiry) => (
                                                        <TableRow key={enquiry?._id}>
                                                            <TableCell className="font-medium">{enquiry?.id}</TableCell>
                                                            <TableCell className="font-medium">{enquiry?.packageId?.packageName}</TableCell>
                                                            <TableCell className="font-medium">{new Date(enquiry?.createdAt).toLocaleDateString("en-In", {
                                                                day: "numeric",
                                                                month: "short",
                                                                year: "numeric"
                                                            })}</TableCell>
                                                            <TableCell>{getStatusBadge(enquiry?.status)}</TableCell>
                                                            <TableCell>
                                                                <div className="flex items-center gap-2">
                                                                    <Button variant="ghost" size="icon" asChild title="Chat with Admin" className="relative w-full">
                                                                        <Link href={`/account/enquiry_chat/${enquiry?.id}`} >
                                                                            <MessageCircle className="h-4 w-4" />
                                                                            Chat with Admin
                                                                            {enquiry.unreadCountUser > 0 && (
                                                                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                                                                                    {enquiry.unreadCountUser}
                                                                                </span>
                                                                            )}
                                                                        </Link>
                                                                    </Button>
                                                                </div>

                                                            </TableCell>
                                                        </TableRow>
                                                    )) : (
                                                        <TableRow>
                                                            <TableCell colSpan={6} className="h-24 text-center">
                                                                No Enquiries
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </main>
        </div>
    )
}