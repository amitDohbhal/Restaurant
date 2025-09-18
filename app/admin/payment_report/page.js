import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Eye, FileText, Home, Utensils } from "lucide-react";
import { GetAllInvoices } from "@/actions/GetAllInvoices";
import Link from "next/link";

export const dynamic = "force-dynamic";

const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
        case "completed":
        case "paid":
        case "confirmed":
            return <Badge className="bg-green-100 text-green-800 text-xs">{status}</Badge>;
        case "pending":
        case "processing":
            return <Badge className="bg-yellow-100 text-yellow-800 text-xs">{status}</Badge>;
        case "failed":
        case "cancelled":
        case "rejected":
            return <Badge className="bg-red-100 text-red-800 text-xs">{status}</Badge>;
        default:
            return <Badge variant="outline" className="text-xs">{status || "N/A"}</Badge>;
    }
};

const getInvoiceTypeBadge = (type) => {
    const types = {
        'room': { label: 'Room', icon: <Home className="w-3 h-3 mr-1" /> },
        'restaurant': { label: 'Restaurant', icon: <Utensils className="w-3 h-3 mr-1" /> },
        'direct_food': { label: 'Direct Food', icon: <FileText className="w-3 h-3 mr-1" /> },
        'management': { label: 'Management', icon: <FileText className="w-3 h-3 mr-1" /> },
        'room_v2': { label: 'Room V2', icon: <Home className="w-3 h-3 mr-1" /> }
    };

    const typeInfo = types[type] || { label: type, icon: <FileText className="w-3 h-3 mr-1" /> };

    return (
        <Badge variant="outline" className="text-xs flex items-center">
            {typeInfo.icon}
            {typeInfo.label}
        </Badge>
    );
};

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount || 0);
};

const Page = async ({ searchParams }) => {
   const pages= await searchParams.page;
    const page = Number(pages) || 1;
    const itemsPerPage = 15;

    // Fetch all invoices
    const { invoices, totalPages, totalInvoices, currentPage } = await GetAllInvoices(page, itemsPerPage);

    return (
        <SidebarInset>
            <header className="flex h-16 shrink-0 items-center justify-between px-4">
                <div className="flex items-center gap-2">
                    <SidebarTrigger className="-ml-1" />
                    <h1 className="text-2xl font-semibold">Payment Report</h1>
                </div>
                {/* <Button variant="outline" size="sm" className="gap-2">
                    <Download className="h-4 w-4" />
                    Export
                </Button> */}
            </header>

            <div className="flex-1 p-6">
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[60px]">#</TableHead>
                                <TableHead className="w-[120px]">Invoice #</TableHead>
                                <TableHead className="w-[120px]">Transaction Id</TableHead>
                                <TableHead className="w-[150px]">Date & Time</TableHead>
                                <TableHead className="w-[120px] ">Customer</TableHead>
                                <TableHead className="w-[120px]">Type</TableHead>
                                <TableHead className="text-center w-[120px]">Amount</TableHead>
                                <TableHead className="text-center w-[120px]">Payment Mode</TableHead>
                                <TableHead className="text-center w-[120px]">Payment Status</TableHead>
                                {/* <TableHead className="w-[80px]">Actions</TableHead> */}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {invoices.length > 0 ? (
                                invoices.map((invoice, index) => (
                                    <TableRow key={`${invoice._id}-${index}`} className="hover:bg-gray-100">
                                        <TableCell>{(page - 1) * itemsPerPage + index + 1}</TableCell>
                                        <TableCell className="font-medium">
                                            {invoice.invoiceNumber || 'N/A'}
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm text-gray-500">
                                                {invoice.razorpayPaymentId || invoice.paymentResponse?.
                                                    razorpay_payment_id || 'N/A'}   
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm text-gray-500">
                                                {formatDate(invoice.date)}
                                            </div>
                                        </TableCell>
                                        <TableCell >
                                            <div className="font-medium">
                                                {invoice.customerName || 'N/A'}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {getInvoiceTypeBadge(invoice.invoiceType)}
                                        </TableCell>
                                        <TableCell className="text-center font-medium">
                                            {formatCurrency(invoice.amount)}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {invoice.paymentMode || 'N/A'}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {getStatusBadge(invoice.paymentStatus)}
                                        </TableCell>
                                        {/* <TableCell>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <Eye className="h-4 w-4" />
                                                <span className="sr-only">View</span>
                                            </Button>
                                        </TableCell> */}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                                        No invoices found
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex flex-col items-center justify-center gap-4 mt-8">
                        <div className="text-sm text-muted-foreground">
                            Showing <span className="font-medium">{(page - 1) * itemsPerPage + 1}</span> to{' '}
                            <span className="font-medium">
                                {Math.min(page * itemsPerPage, totalInvoices)}
                            </span>{' '}
                            of <span className="font-medium">{totalInvoices}</span> invoices
                        </div>
                        <div className="flex gap-4 items-center">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page <= 1}
                                href={`?page=${page - 1}`}
                                asChild
                            >
                                <a>Previous</a>
                            </Button>
                            <span className="text-sm text-muted-foreground">
                                Page {page} of {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page >= totalPages}
                                href={`?page=${page + 1}`}
                                asChild
                            >
                                <a>Next</a>
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </SidebarInset>
    );
};

export default Page;
