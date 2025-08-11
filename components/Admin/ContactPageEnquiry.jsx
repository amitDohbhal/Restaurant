'use client'

import { useEffect, useState } from "react";
import { Button } from "../ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import toast from "react-hot-toast";
import { Calendar, Mail, MessageSquare, ScanSearch, Trash2, ChevronLeft, ChevronRight, PhoneCall } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";

const ContactPageEnquiry = () => {
    const [allEnquiry, setAllEnquiry] = useState([])
    const [filteredEnquiry, setFilteredEnquiry] = useState([])
    const [selectedEnquiry, setSelectedEnquiry] = useState(null)
    const [isOpen, setIsOpen] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [selectedMonth, setSelectedMonth] = useState('all')
    const itemsPerPage = 10

    const [typeFilter, setTypeFilter] = useState('all');
    useEffect(() => {
        const fetchEnquiries = async () => {
            try {
                const url = typeFilter === 'all' ? '/api/askExpertsEnquiry' : `/api/askExpertsEnquiry?type=${typeFilter}`;
                const response = await fetch(url);
                let data = await response.json();
                
                // Handle different response formats
                if (Array.isArray(data)) {
                    // If data is already an array, use it as is
                    setAllEnquiry(data);
                    setFilteredEnquiry(data);
                } else if (data && typeof data === 'object') {
                    // If data is an object, convert it to an array of its values
                    const dataArray = Object.values(data);
                    setAllEnquiry(dataArray);
                    setFilteredEnquiry(dataArray);
                } else {
                    // If data is not in expected format, set to empty array
                    console.warn('Unexpected API response format:', data);
                    setAllEnquiry([]);
                    setFilteredEnquiry([]);
                }
            } catch (error) {
                console.error('Error fetching enquiries:', error);
                toast.error("Failed to load enquiries", { 
                    style: { 
                        borderRadius: "10px", 
                        border: "2px solid red" 
                    } 
                });
                setAllEnquiry([]);
                setFilteredEnquiry([]);
            }
        }
        fetchEnquiries();
    }, [typeFilter]);

    // Group enquiries by month
    const groupByMonth = (enquiries) => {
        const months = {}
        if (!Array.isArray(enquiries)) {
            console.error('Expected an array of enquiries but got:', enquiries)
            return months
        }
        enquiries.forEach(enquiry => {
            const date = new Date(enquiry.createdAt)
            const monthYear = `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`
            if (!months[monthYear]) {
                months[monthYear] = []
            }
            months[monthYear].push(enquiry)
        })
        return months
    }

    const monthGroups = groupByMonth(allEnquiry)

    // Filter enquiries by selected month
    useEffect(() => {
        if (selectedMonth === 'all') {
            setFilteredEnquiry(allEnquiry)
            setCurrentPage(1)
        } else {
            const filtered = monthGroups[selectedMonth] || []
            setFilteredEnquiry(filtered)
            setCurrentPage(1)
        }
    }, [selectedMonth, allEnquiry])

    // Pagination logic
    const totalPages = Math.ceil(filteredEnquiry.length / itemsPerPage)
    const indexOfLastItem = currentPage * itemsPerPage
    const indexOfFirstItem = indexOfLastItem - itemsPerPage
    const currentItems = filteredEnquiry.slice(indexOfFirstItem, indexOfLastItem)

    const handleView = (enquiry) => {
        setSelectedEnquiry(enquiry)
        setIsOpen(true)
    }
    const handlePageChange = (page) => {
        setCurrentPage(page)
    }

    return (
        <div className="my-20 font-barlow w-full max-w-7xl mx-auto flex flex-col gap-8 items-center justify-center bg-blue-100 p-4 rounded-lg">
            {/* Type & Month Filter */}
            <div className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          
                <div className="flex items-center gap-4">
                    <span className="text-sm">Filter by type:</span>
                    <select
                        value={typeFilter}
                        onChange={e => setTypeFilter(e.target.value)}
                        className="border rounded-md px-3 py-1 text-sm"
                    >
                        <option value="all">All</option>
                        <option value="artisan">Artisan</option>
                        <option value="product">Product</option>
                    </select>
                    <span className="text-sm">Filter by month:</span>
                    <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="border rounded-md px-3 py-1 text-sm"
                    >
                        <option value="all">All Months</option>
                        {Object.keys(monthGroups).map((month) => (
                            <option key={month} value={month}>{month}</option>
                        ))}
                    </select>
                </div>
            </div>

            <Table className="w-full mx-auto">
                <TableHeader>
                    <TableRow className={"border-blue-600"}>
                        <TableHead className="w-[150px]">Date</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Query Name</TableHead>
                        <TableHead>Question</TableHead>
                        <TableHead className="w-[200px]">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {currentItems.length > 0 ? currentItems.map((enquiry) => (
                        <TableRow key={enquiry._id} className="border-blue-400">
                            <TableCell>{new Date(enquiry.createdAt).toLocaleDateString('en-In', { day: 'numeric', month: 'long', year: 'numeric', })}</TableCell>
                            <TableCell>{enquiry.name}</TableCell>
                            <TableCell>+91 {enquiry.phone}</TableCell>
                            <TableCell>{enquiry.email}</TableCell>
                            <TableCell className="capitalize">{enquiry.type}</TableCell>
                            <TableCell>{enquiry.queryName || '-'}</TableCell>
                            <TableCell>{enquiry.question}</TableCell>
                            <TableCell>
                                <div className="flex gap-2">
                                    <Button onClick={() => handleView(enquiry)} variant="outline" size="sm" className="h-8 flex-1">
                                        <ScanSearch className="w-3 h-3 mr-1" /> View
                                    </Button>
                                    {/* Optionally keep delete if needed */}
                                </div>
                            </TableCell>
                        </TableRow>
                    )) : (
                        <TableRow>
                            <TableCell colSpan={8} className="h-24 text-center">
                                No enquiries found
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            {/* Pagination */}
            {filteredEnquiry.length > itemsPerPage && (
                <div className="flex items-center justify-center gap-4 font-barlow">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                    >
                        <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                    </Button>
                    <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <Button
                                key={`page-${page}`}
                                variant={currentPage === page ? "default" : "outline"}
                                size="sm"
                                onClick={() => handlePageChange(page)}
                                className={`w-10 h-10 p-0 ${currentPage === page ? "bg-blue-600 text-white" : "text-blue-600"}`}
                            >
                                {page}
                            </Button>
                        ))}
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

            {/* Enquiry Details Dialog */}
            {isOpen && (
                <Dialog open={isOpen} onOpenChange={() => setIsOpen(false)}>
                    <DialogContent className="max-w-[95vw]  font-barlow text-justify sm:max-w-lg md:max-w-2xl p-0 overflow-hidden">
                        <DialogHeader>
                            <DialogTitle className="hidden" />
                        </DialogHeader>
                        <div className="pt-4 sm:pt-4 px-4 sm:px-6 pb-4 sm:pb-6">
                            <div className="flex flex-col gap-6">
                                {/* Left: Personal and Contact Info */}
                                <div className="flex flex-col gap-2">
                                    <h2 className="text-2xl font-bold mb-2">{selectedEnquiry.name}</h2>
                                    <div className="flex items-center gap-2 text-gray-700">
                                        <span className="font-semibold">Type:</span>
                                        <Badge className="capitalize" variant="outline">{selectedEnquiry.type}</Badge>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-700">
                                        <span className="font-semibold">Enquiry Come from:</span>
                                        <span>{selectedEnquiry.queryName || '-'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-700">
                                        <span className="font-semibold">Asked For:</span>
                                        <span>{selectedEnquiry.need}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-700">
                                        <span className="font-semibold">Can Contact Via:</span>
                                        {selectedEnquiry.contactMethod === 'Both' ? (
                                            <span className="flex items-center gap-2">
                                                <Mail className="w-4 h-4 inline-block" />
                                                <span>{selectedEnquiry.email}</span>
                                                <span className="mx-1">&amp;</span>
                                                <PhoneCall className="w-4 h-4 inline-block" />
                                                <span>{selectedEnquiry.phone}</span>
                                            </span>
                                        ) : selectedEnquiry.contactMethod === 'Email' ? (
                                            <span className="flex items-center gap-2">
                                                <Mail className="w-4 h-4 inline-block" />
                                                <span>{selectedEnquiry.email}</span>
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-2">
                                                <PhoneCall className="w-4 h-4 inline-block" />
                                                <span>{selectedEnquiry.phone}</span>
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-700">
                                        <span className="font-semibold">Date:</span>
                                        <Calendar className="w-4 h-4" />
                                        <span>{new Date(selectedEnquiry.createdAt).toLocaleDateString('en-In', { day: 'numeric', month: 'long', year: 'numeric', })}</span>
                                    </div>
                                </div>
                                {/* Right: Question/Message */}
                                <div className="flex flex-col gap-3">
                                    <div>
                                        <h3 className="text-lg font-semibold flex items-center gap-2 mb-1">
                                            <MessageSquare className="w-5 h-5 text-blue-600" />
                                            Message
                                        </h3>
                                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                            <p className="italic text-base text-gray-700 max-h-96 overflow-y-auto">{selectedEnquiry.question}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 border-t flex-col sm:flex-row gap-2 sm:gap-3">
                            <Button variant="outline" onClick={() => setIsOpen(false)} className="sm:order-1 w-full sm:w-auto">
                                Close
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    )
}

export default ContactPageEnquiry