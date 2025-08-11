"use client"

import { useRef } from "react"
import { Download, FileText, Mail, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Image from "next/image"
import { addDays } from "date-fns"

export default function InvoicePage({ orders }) {
    const invoiceRef = useRef(null)

    const handlePrint = () => {
        // if (invoiceRef.current) {
        //     const printWindow = window.open("", "_blank")
        //     if (printWindow) {
        //         const printContent = invoiceRef.current.innerHTML
        //         printWindow.document.write(`
        //   <html>
        //     <head>
        //       <title>Tour Package Invoice #INV-2023-0058</title>
        //       <style>
        //         body { font-family: Arial, sans-serif; color: #333; }
        //         table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        //         th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
        //         th { background-color: #f5f5f5; }
        //         .logo { max-width: 120px; }
        //         .container { max-width: 800px; margin: 0 auto; padding: 20px; }
        //         .header { display: flex; justify-content: space-between; align-items: center; }
        //         .invoice-title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
        //         .invoice-info { margin-bottom: 20px; }
        //         .invoice-info p { margin: 5px 0; }
        //         .address-block { margin-bottom: 20px; }
        //         .total-row { font-weight: bold; }
        //         .footer { margin-top: 30px; text-align: center; font-size: 14px; color: #666; }
        //       </style>
        //     </head>
        //     <body>
        //       <div class="container">
        //         ${printContent}
        //         <div class="footer">
        //           <p>Thank you for choosing Yatra Zone for your travel needs!</p>
        //         </div>
        //       </div>
        //     </body>
        //   </html>
        // `)
        //         printWindow.document.close()
        //         printWindow.print()
        //     }
        // }
        window.print()
    }

    const travelStartDate = new Date(orders[0].travelDate || orders[0].bookingDetails.travelDate)
    const travelEndDate = (orders[0].travelDate || orders[0].bookingDetails.travelDate) ? addDays(travelStartDate, orders[0]?.package?.basicDetails?.duration) : null

    const formatNumber = (number) => {
        return new Intl.NumberFormat('en-IN').format(number)
    }

    return (
        <div className="min-h-screen bg-muted/30 print:my-0 py-36 font-barlow px-4 print:px-0 print:py-0">
            <div className="max-w-4xl mx-auto">
                {/* Top navigation */}
                <div className="print:hidden flex justify-end items-center mb-6">
                    <div className="flex gap-2">
                        <Button variant="outline" className="gap-2" onClick={handlePrint}>
                            <Download className="h-4 w-4" />
                            Download Invoice
                        </Button>
                    </div>
                </div>

                {/* Invoice card */}
                <Card className="mb-6 shadow-md border-none overflow-hidden print:shadow-none">
                    <CardContent className="p-8" ref={invoiceRef}>
                        {/* Invoice header */}
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 mb-8">
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <Image priority src="/logo.png" alt="Logo" width={200} height={200} className="logo" />
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    <div className="flex items-center gap-2 mt-2">
                                        <Phone className="h-4 w-4" />
                                        <span>+91 8006000325</span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Mail className="h-4 w-4" />
                                        <span>info@info@adventureaxis.in</span>
                                    </div>
                                    <div className="mt-1">
                                        <span className="text-xs">Office Hours: Mon to Sat | 9:30 AM - 8:00 PM</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-muted/50 p-4 rounded-lg">
                                <div className="flex items-center gap-2 mb-3">
                                    <FileText className="h-5 w-5 text-primary" />
                                    <h2 className="font-semibold text-lg">Invoice</h2>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="text-muted-foreground">Invoice Number:</div>
                                    <div className="font-medium">{orders[0].orderId}</div>
                                    <div className="text-muted-foreground">Order Number:</div>
                                    <div className="font-medium">{orders[0].orderId}</div>
                                    <div className="text-muted-foreground">Issue Date:</div>
                                    <div className="font-medium">{new Date(orders[0].createdAt).toLocaleString('en-IN', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric',
                                        hour: 'numeric',
                                        minute: 'numeric',
                                        second: 'numeric'
                                    })}</div>
                                    <div className="text-muted-foreground">Status:</div>
                                    <div className="inline-flex w-fit items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-green-100 border-green-500 text-green-700">
                                        Paid
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Separator className="my-8" />

                        {/* Bill to & Bill from */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                            <div>
                                <h2 className="font-semibold text-sm text-muted-foreground mb-3">BILL TO:</h2>
                                <div>
                                    <h3 className="font-semibold">{orders[0].name || orders[0].formData.name}</h3>
                                    <address className="not-italic text-muted-foreground text-sm mt-1">
                                        {(orders[0]?.extraAddressInfo !== "" || orders[0]?.formData?.extraAddressInfo !== "") && <p>{orders[0]?.extraAddressInfo || orders[0]?.formData?.extraAddressInfo}</p>}
                                        <p>{orders[0].city || orders[0].formData.city}, {orders[0].state || orders[0].formData.state}, {orders[0].pincode || orders[0].formData.pincode}, India</p>
                                    </address>
                                    <div className="text-sm text-muted-foreground mt-2">
                                        <div className="flex items-center gap-2">
                                            <Mail className="h-4 w-4" />
                                            <span>{orders[0].email || orders[0].formData.email}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Phone className="h-4 w-4" />
                                            <span>+91 {orders[0].phone || orders[0].formData.phone}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h2 className="font-semibold text-sm text-muted-foreground mb-3">TOUR PACKAGE DETAILS:</h2>
                                <div className="text-sm space-y-2">
                                    <div className="flex items-start gap-2">
                                        <div className="w-28 text-muted-foreground">Package Name:</div>
                                        <div className="font-medium">{orders[0].package?.packageName}</div>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <div className="w-28 text-muted-foreground">Duration:</div>
                                        <div>{orders[0].package?.basicDetails?.duration} Days, {orders[0].package?.basicDetails?.duration - 1} Nights</div>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <div className="w-28 text-muted-foreground">Travel Dates:</div>
                                        <div>{new Date(travelStartDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })} - {travelEndDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <div className="w-28 text-muted-foreground">Total Persons:</div>
                                        <div>{orders[0]?.totalPerson} person(s)</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Table */}
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[150px]">Package Code</TableHead>
                                    <TableHead className="w-2/4">Package Name</TableHead>
                                    <TableHead className="w-[150px]">Total Persons</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <TableRow>
                                    <TableCell className="font-medium">{orders[0]?.package?.packageCode}</TableCell>
                                    <TableCell>
                                        <div>
                                            <p className="font-medium">{orders[0]?.package?.packageName}</p>
                                        </div>
                                    </TableCell>
                                    <TableCell>{orders[0]?.totalPerson} person(s)</TableCell>
                                    <TableCell className="text-right">₹{formatNumber(orders[0]?.amount)}</TableCell>
                                </TableRow>
                            </TableBody>
                            <TableFooter>
                                <TableRow>
                                    <TableCell colSpan={2} rowSpan={4} />
                                    <TableCell className="text-right font-medium text-sm">Total (Advance 25%)</TableCell>
                                    <TableCell className="text-right font-bold text-lg">₹{formatNumber(orders[0]?.amount)}</TableCell>
                                </TableRow>
                            </TableFooter>
                        </Table>

                        {/* Payment information */}
                        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-2 w-full">
                            <div className="w-full">
                                <h3 className="font-semibold text-sm mb-3">PAYMENT INFORMATION</h3>
                                <div className="bg-muted/30 p-4 rounded-lg text-sm w-full">
                                    <div className="grid grid-cols-2 gap-x-2 gap-y-2 w-full">
                                        <div className="text-muted-foreground">Payment Method:</div>
                                        <div className="uppercase font-medium">{orders[0]?.paymentMethod}</div>
                                        <div className="text-muted-foreground">Amount Paid:</div>
                                        <div className="font-medium">₹{formatNumber(orders[0]?.amount)}</div>
                                        <div className="text-muted-foreground">Payment Date:</div>
                                        <div className="font-medium">{new Date(orders[0]?.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' })}</div>
                                        <div className="text-muted-foreground">Transaction ID:</div>
                                        <div className="font-medium">{orders[0]?.transactionId}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Thank you note */}
                        <div className="mt-12 text-center">
                            <p className="text-muted-foreground font-medium">Thank you for choosing Yatra Zone for your travels!</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                For any questions regarding this invoice, please contact our support team.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}