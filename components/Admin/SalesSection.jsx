'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { ViewFormPopup } from "./ViewFormPopup";
import { Badge } from "../ui/badge";

export default function SalesSectionPage({ enquirys, orders }) {

    return (
        <>
            <div className="p-6">
                <h1 className="text-2xl font-bold mb-6">Sales Section</h1>

                <Tabs defaultValue="package">
                    <TabsList className="grid w-fit py-2 grid-cols-2">
                        <TabsTrigger value="package" className="py-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">product Checkout</TabsTrigger>
                        <TabsTrigger value="enquiry" className="py-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">Custom Enquiry</TabsTrigger>
                    </TabsList>

                    <TabsContent value="package">
                        <SalesTable
                            data={orders}
                            type="package"
                            columns={[
                                "S.No.",
                                "Package Name",
                                "User Name",
                                "Date",
                                "Status",
                                "Actions"
                            ]}
                        />
                    </TabsContent>

                    <TabsContent value="enquiry">
                        <SalesTable
                            data={enquirys}
                            type="enquiry"
                            columns={[
                                "S.No.",
                                "Package Name",
                                "User Name",
                                "Date",
                                "Status",
                                "Actions"
                            ]}
                        />
                    </TabsContent>
                </Tabs>
            </div>
        </>
    );
}

function SalesTable({ data, type, columns }) {
    const [monthFilter, setMonthFilter] = useState('all');
    const [selectedItem, setSelectedItem] = useState(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const currentYear = new Date().getFullYear();
    const [yearFilter, setYearFilter] = useState(currentYear.toString());
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

    // Filter data based on selected month and year
    const filteredData = data.filter(item => {
        const date = new Date(item.createdAt || item.travelDate);
        const itemYear = date.getFullYear().toString();
        const itemMonth = (date.getMonth() + 1).toString();

        const yearMatch = yearFilter === 'all' || itemYear === yearFilter;
        const monthMatch = monthFilter === 'all' || itemMonth === monthFilter;

        return yearMatch && monthMatch;
    });

    // Sort by date (newest first)
    const sortedData = [...filteredData].sort((a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
    );

    // Pagination logic
    const totalPages = Math.ceil(sortedData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = sortedData.slice(startIndex, startIndex + itemsPerPage);

    // Handle page change
    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    return (
        <div className="mt-4">
            <ViewFormPopup
                data={selectedItem}
                type={type}
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
            />
            <div className="flex gap-4 mb-4">
                <Select onValueChange={setMonthFilter} defaultValue="all">
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select month" />
                    </SelectTrigger>
                    <SelectContent className="font-barlow">
                        <SelectItem value="all">All Months</SelectItem>
                        <SelectItem value="1">January</SelectItem>
                        <SelectItem value="2">February</SelectItem>
                        <SelectItem value="3">March</SelectItem>
                        <SelectItem value="4">April</SelectItem>
                        <SelectItem value="5">May</SelectItem>
                        <SelectItem value="6">June</SelectItem>
                        <SelectItem value="7">July</SelectItem>
                        <SelectItem value="8">August</SelectItem>
                        <SelectItem value="9">September</SelectItem>
                        <SelectItem value="10">October</SelectItem>
                        <SelectItem value="11">November</SelectItem>
                        <SelectItem value="12">December</SelectItem>
                    </SelectContent>
                </Select>

                <Select onValueChange={setYearFilter} defaultValue={currentYear.toString()}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent className="font-barlow">
                        <SelectItem value="all">All Years</SelectItem>
                        {years.map(year => (
                            <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                        {columns.map((column, index) => (
                            <TableHead key={index}>{column}</TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody className="font-barlow font-semibold">
                    {paginatedData.map((item, index) => {
                        
                        return (
                            <TableRow key={item._id}>
                                <TableCell>{startIndex + index + 1}</TableCell>
                                <TableCell>
                                    {item.packageId?.packageName || 'Custom Package'}
                                </TableCell>
                                <TableCell>{item.name || item.formData?.name}</TableCell>
                                <TableCell>
                                    {format(
                                        new Date(item.createdAt || item.travelDate),
                                        'dd MMM yyyy'
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Badge className={`px-2 py-1 capitalize rounded-full text-xs ${(item.status).toLowerCase() === 'resolved'
                                        ? 'bg-green-500/50 text-sm hover:bg-green-500/70 text-black border-2 border-green-500'
                                        : (item.status).toLowerCase() === 'failed'
                                            ? 'bg-red-500/50 text-sm hover:bg-red-500/70 text-black border-2 border-red-500'
                                            : (item.status).toLowerCase() === 'pending'
                                                ? 'bg-amber-500/50 text-sm hover:bg-amber-500/70 text-black border-2 border-amber-500'
                                                : 'bg-green-500/50 text-sm hover:bg-green-500/70 text-black border-2 border-green-500'
                                        }`}>
                                        {(item.status)}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="sm" onClick={() => {
                                        setSelectedItem(item);
                                        setIsDialogOpen(true);
                                    }} className="font-semibold">
                                        <Eye className="h-4 w-4 mr-2" />
                                        View Form
                                    </Button>
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>

            {/* Pagination Controls */}
            {sortedData.length > itemsPerPage && (
                <div className="flex justify-between items-center mt-4">
                    <div className="text-sm text-gray-500">
                        Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, sortedData.length)} of {sortedData.length} entries
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                        >
                            Previous
                        </Button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <Button
                                key={page}
                                variant={currentPage === page ? "default" : "outline"}
                                size="sm"
                                onClick={() => handlePageChange(page)}
                                className={`${currentPage === page ? "bg-blue-600 text-white" : ""}`}
                            >
                                {page}
                            </Button>
                        ))}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}

            {filteredData.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                    No {type} records found for the selected filters
                </div>
            )}
        </div>
    );
}