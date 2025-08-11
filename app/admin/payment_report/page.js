import { GetAllOrders } from "@/actions/GetAllOrders";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

export const dynamic = "force-dynamic"

const Page = async ({ searchParams }) => {
    const searchparams = await searchParams;
    const page = Number(searchparams?.page) || 1; // Get page from URL, default to 1
    const itemsPerPage = 10;

    // Fetch server data
    const { orders, customOrders, totalPages } = await GetAllOrders(page, itemsPerPage);

    // Ensure both orders and customOrders are arrays
    const allOrders = [...(orders || []), ...(customOrders || [])];
// console.log(allOrders)
    const getStatusBadge = (status) => {
        switch (status?.toLowerCase()) {    
            case "confirmed":
            case "paid":
            case "completed":
            case "resolved":
                return <Badge className="bg-green-500/50 text-sm hover:bg-green-500/70 text-black border-2 border-green-500">{status}</Badge>;
            case "failed":
            case "cancelled":
                return <Badge className="bg-red-500/50 text-sm hover:bg-red-500/70 text-black border-2 border-red-500">{status}</Badge>;
            case "pending":
                return <Badge className="bg-amber-500/50 text-sm hover:bg-amber-500/70 text-black border-2 border-amber-500">{status}</Badge>;
            default:
                return <Badge variant="outline">{status || "Unknown"}</Badge>;
        }
    };

    const formatNumeric = (num) => new Intl.NumberFormat('en-IN').format(num);

    return (
        <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2">
                <div className="flex items-center gap-2 px-4">
                    <SidebarTrigger className="-ml-1" />
                </div>
            </header>
            <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                <h1 className="text-4xl px-12 font-semibold">Payment Report</h1>
                <div className="my-20 w-full mx-auto flex flex-col gap-20 items-center justify-center p-4 rounded-lg">
                    <Table className="w-full mx-auto font-semibold">
                        <TableHeader>
                            <TableRow className="border-blue-600">
                                <TableHead className="w-[50px]">#</TableHead>
                                <TableHead className="w-[150px]">Date</TableHead>
                                <TableHead className="w-[150px] xl:w-[250px]">Order ID</TableHead>
                                <TableHead className="w[100px] xl:w-[150px]">Amount Transfer</TableHead>
                                <TableHead className="w[100px] xl:w-[150px]">Payment Mode</TableHead>
                                <TableHead>Package Title</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead className="w-[100px]">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {allOrders.length > 0 ? (
                                allOrders.map((order, index) => {
                                    if (!order) return null; // Skip null orders

                                    return (
                                        <TableRow key={order._id || index} className="border-blue-400">
                                            <TableCell>{(page - 1) * itemsPerPage + index + 1}</TableCell>
                                            <TableCell>
                                                {order.createdAt
                                                    ? new Date(order.createdAt).toLocaleDateString("en-IN", {
                                                        day: "numeric",
                                                        month: "long",
                                                        year: "numeric",
                                                    })
                                                    : "N/A"}
                                            </TableCell>
                                            <TableCell>{order.orderId || "N/A"}</TableCell>
                                            <TableCell>₹{order.cartTotal ? formatNumeric(order.cartTotal) : "N/A"}</TableCell>
                                            <TableCell className="uppercase">{order.paymentMethod || "COD"}</TableCell>
                                            <TableCell>{order.product?.title || "N/A"}</TableCell>
                                            <TableCell>+91 {order.phone || order.formData?.phone || "N/A"}</TableCell>
                                            <TableCell>{getStatusBadge(order.status || "Unknown")}</TableCell>
                                        </TableRow>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={9} className="h-24 text-center">
                                        No payment report found
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination Controls (Server-Side) */}
                <div className="flex flex-col items-center justify-center gap-4 -mt-12">
                    <span className="text-lg font-semibold">
                        Page {page} of {totalPages}
                    </span>
                    <div className="flex gap-2">
                        {page > 1 && (
                            <Link href={`?page=${page - 1}`} className="bg-blue-500 text-white px-4 py-2 rounded">
                                Previous
                            </Link>
                        )}
                        {page < totalPages && (
                            <Link href={`?page=${page + 1}`} className="bg-blue-500 text-white px-4 py-2 rounded">
                                Next
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </SidebarInset>
    );
};

export default Page;
