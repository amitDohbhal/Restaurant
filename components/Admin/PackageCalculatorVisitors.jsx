// components/Admin/PackageCalculatorVisitors.js
'use client'

import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const PackageCalculatorVisitors = ({ 
    totalVisitors, 
    customOrdersVisitors, 
    currentPage = 1, 
    totalPages = 1,
    availableMonths = [],
    selectedMonth = 'all'
}) => {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const formatNumber = (number) => {
        return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(number);
    };

    const handlePageChange = (page) => {
        const params = new URLSearchParams(searchParams);
        params.set('page', page);
        router.replace(`${pathname}?${params.toString()}`);
    };

    const handleMonthChange = (month) => {
        const params = new URLSearchParams(searchParams);
        params.set('month', month);
        params.set('page', '1'); // Reset to first page when changing month
        router.replace(`${pathname}?${params.toString()}`);
    };

    return (
        <Card className="p-6 mt-12 w-full overflow-x-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <h2 className="text-xl font-bold">Package Calculator Visitors</h2>
                <div className="flex items-center gap-2">
                    <span className="text-sm">Filter by month:</span>
                    <Select value={selectedMonth} onValueChange={handleMonthChange}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="All Months" />
                        </SelectTrigger>
                        <SelectContent className="font-barlow">
                            <SelectItem value="all">All Months</SelectItem>
                            {availableMonths.map((month) => (
                                <SelectItem key={month.value} value={month.value}>
                                    {month.label} ({month.count})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Table className="min-w-[600px]">
                <TableCaption>A list of package calculator visitors, Total Visitors: {totalVisitors}</TableCaption>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[200px]">Name</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead className="xl:w-[300px]">Total Amount</TableHead>
                        <TableHead className="text-right">Visited At</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody className="text-lg font-medium text-gray-700">
                    {customOrdersVisitors.length > 0 ? (
                        customOrdersVisitors.map((user) => (
                            <TableRow key={user._id}>
                                <TableCell className="font-medium">
                                    {user.formData.name || "N/A"}
                                </TableCell>
                                <TableCell>+91 {user.formData.phone || "N/A"}</TableCell>
                                <TableCell>{user.formData.email}</TableCell>
                                <TableCell>₹ <span className="font-semibold text-xl text-blue-600">{formatNumber(user.totalAmount)}</span></TableCell>
                                <TableCell className="text-right">
                                    {new Date(user.createdAt).toLocaleDateString("en-In", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                    })}
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center">
                                No users found
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                    >
                        <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                    </Button>
                    <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                                pageNum = i + 1;
                            } else if (currentPage <= 3) {
                                pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i;
                            } else {
                                pageNum = currentPage - 2 + i;
                            }
                            return (
                                <Button
                                    key={pageNum}
                                    variant={currentPage === pageNum ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => handlePageChange(pageNum)}
                                    className={`w-10 h-10 p-0 ${
                                        currentPage === pageNum ? "!bg-blue-500 text-white" : " text-gray-700"
                                    }`}
                                >
                                    {pageNum}
                                </Button>
                            );
                        })}
                        {totalPages > 5 && currentPage < totalPages - 2 && (
                            <span className="px-2">...</span>
                        )}
                        {totalPages > 5 && currentPage < totalPages - 2 && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(totalPages)}
                                className={`w-10 h-10 p-0 ${
                                    currentPage === totalPages ? "bg-blue-500 text-white" : "text-gray-700"
                                }`}
                            >
                                {totalPages}
                            </Button>
                        )}
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                    >
                        Next <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                </div>
            )}
        </Card>
    );
};

export default PackageCalculatorVisitors;