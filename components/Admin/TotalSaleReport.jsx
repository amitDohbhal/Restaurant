"use client"
import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ArrowLeftIcon, FileText, Utensils, Home, Coffee, Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
const TotalSaleReport = () => {
    const router = useRouter();
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState('room');

    // Filter states
    const [filters, setFilters] = useState({
        invoiceNumber: '',
        customer: '',
        status: '',
        paymentStatus: '',
        dateFrom: '',
        dateTo: ''
    });


    const paymentStatusOptions = [
        { value: 'pending', label: 'Pending' },
        { value: 'completed', label: 'Paid' },
        { value: 'failed', label: 'Failed' },
    ];

    const sectionConfig = [
        {
            key: 'running_orders',
            label: 'Running Orders',
            icon: <Home className="w-4 h-4 mr-2" />,
            apiEndpoint: '/api/runningOrder',
        },
        {
            key: 'room',
            label: 'Room Invoices',
            icon: <Home className="w-4 h-4 mr-2" />,
            apiEndpoint: '/api/roomInvoice',
        },
        {
            key: 'create_room',
            label: 'Create Room Invoices',
            icon: <Home className="w-4 h-4 mr-2" />,
            apiEndpoint: '/api/CreateRoomInvoice',
        },
        {
            key: 'direct-food',
            label: 'Direct Food Invoices',
            icon: <Utensils className="w-4 h-4 mr-2" />,
            apiEndpoint: '/api/createDirectFoodInvoice',
        },
        {
            key: 'restaurant',
            label: 'Restaurant Invoices',
            icon: <Coffee className="w-4 h-4 mr-2" />,
            apiEndpoint: '/api/CreateRestaurantInvoice',
        },
        {
            key: 'management',
            label: 'Management Orders',
            icon: <FileText className="w-4 h-4 mr-2" />,
            apiEndpoint: '/api/managementFoodOrderInvoice',
        },
    ];

    useEffect(() => {
        const fetchInvoices = async () => {
            setLoading(true);
            try {
                const activeSectionConfig = sectionConfig.find(section => section.key === activeSection);
                if (!activeSectionConfig) return;

                const response = await fetch(activeSectionConfig.apiEndpoint);
                const data = await response.json();
                // console.log(data);

                if (data.success) {
                    if (activeSection === 'running_orders' && data.data) {
                        // Transform running orders data to match the expected structure
                        const transformedData = data.data.map(order => ({
                            ...order,
                            totalAmount: order.total,
                            totalFoodAmount: order.subtotal,
                            cgstAmount: order.tax ? order.tax / 2 : 0,
                            sgstAmount: order.tax ? order.tax / 2 : 0,
                            paymentStatus: order.paymentStatus || 'pending',
                            invoiceDate: order.createdAt ? new Date(order.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
                        }));
                        setInvoices(transformedData);
                    } else {
                        setInvoices(data.invoices || []);
                    }
                } else {
                    console.error('Failed to fetch invoices:', data.error);
                    setInvoices([]);
                }
            } catch (error) {
                console.error('Error fetching invoices:', error);
                setInvoices([]);
            } finally {
                setLoading(false);
            }
        };

        fetchInvoices();
    }, [activeSection]);


    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const clearFilters = () => {
        setFilters({
            invoiceNumber: '',
            customer: '',
            status: '',
            paymentStatus: '',
            dateFrom: '',
            dateTo: ''
        });
    };

    const filteredInvoices = invoices.filter(invoice => {
        // Filter by invoice number
        if (filters.invoiceNumber &&
            !invoice.invoiceNo?.toLowerCase().includes(filters.invoiceNumber.toLowerCase())) {
            return false;
        }

        // Filter by customer name
        const customerName = (invoice.guestFirst || '').toLowerCase();
        if (filters.customer && !customerName.includes(filters.customer.toLowerCase())) {
            return false;
        }

        // // Filter by status
        // if (filters.status && invoice.orderStatus !== filters.status) {
        //     return false;
        // }

        // Filter by payment status
        if (filters.paymentStatus && invoice.paymentStatus !== filters.paymentStatus) {
            return false;
        }

        // Filter by date range
        const invoiceDate = new Date(invoice.createdAt);
        if (filters.dateFrom && new Date(filters.dateFrom) > invoiceDate) {
            return false;
        }
        if (filters.dateTo) {
            const toDate = new Date(filters.dateTo);
            toDate.setHours(23, 59, 59, 999); // End of the day
            if (toDate < invoiceDate) {
                return false;
            }
        }

        return true;
    });
    // console.log(filteredInvoices);
   return (
        <div className="min-h-[85vh] bg-white p-4">
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Sidebar */}
                <div className="w-full lg:w-64 flex-shrink-0">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2">
                        <h2 className="text-lg font-semibold mb-4 px-2">Invoice Types</h2>
                        <nav className="space-y-1">
                            {sectionConfig.map((section) => (
                                <button
                                    key={section.key}
                                    onClick={() => setActiveSection(section.key)}
                                    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${activeSection === section.key
                                            ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-500'
                                            : 'text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    {section.icon}
                                    {section.label}
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <div className="p-4 border-b">
                                <div className="flex flex-wrap gap-4 mb-4">
                                    <div className="relative w-full sm:w-48">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            type="search"
                                            placeholder="Invoice #"
                                            className="pl-8"
                                            value={filters.invoiceNumber}
                                            onChange={(e) => handleFilterChange('invoiceNumber', e.target.value)}
                                        />
                                    </div>
                                    <div className="relative w-full sm:w-48">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            type="search"
                                            placeholder="Customer"
                                            className="pl-8"
                                            value={filters.customer}
                                            onChange={(e) => handleFilterChange('customer', e.target.value)}
                                        />
                                    </div>
                                    <Select
                                        value={filters.paymentStatus}
                                        onValueChange={(value) => handleFilterChange('paymentStatus', value)}
                                    >
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder="Payment Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {paymentStatusOptions.map(option => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="date"
                                            placeholder="From"
                                            value={filters.dateFrom}
                                            onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                                            className="w-42 px-2"
                                        />
                                        <span>to</span>
                                        <Input
                                            type="date"
                                            placeholder="To"
                                            value={filters.dateTo}
                                            onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                                            className="w-42 px-2"
                                        />
                                    </div>
                                    {(filters.invoiceNumber || filters.customer || filters.status || filters.paymentStatus || filters.dateFrom || filters.dateTo) && (
                                        <button
                                            onClick={clearFilters}
                                            className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                                        >
                                            <X className="h-4 w-4" />
                                            Clear filters
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-gray-100">
                                        <TableRow>
                                            <TableHead className="w-[120px] font-semibold text-gray-700">Date</TableHead>
                                            <TableHead className="font-semibold text-gray-700">Invoice No.</TableHead>
                                            <TableHead className="font-semibold text-gray-700">Customer</TableHead>
                                            <TableHead className="font-semibold text-gray-700">Payment Mode</TableHead>
                                            <TableHead className="text-center font-semibold text-gray-700">Amount</TableHead>
                                            <TableHead className="text-center font-semibold text-gray-700">CGST</TableHead>
                                            <TableHead className="text-center font-semibold text-gray-700">SGST</TableHead>
                                            <TableHead className="text-center font-semibold text-gray-700">Total Amount</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredInvoices.length > 0 ? (
                                            filteredInvoices.map((invoice) => {
                                                // Calculate base amount (use roomPrice directly without multiplying by days)
                                                const baseAmount = invoice.roomPrice || invoice.totalFoodAmount || 0;
                                                
                                                // Calculate CGST and SGST - use amount if available, otherwise calculate from percentage
                                                let cgst = invoice.cgstAmount || 0;
                                                let sgst = invoice.sgstAmount || 0;
                                                
                                                // If amounts are not set but percentages are, calculate them
                                                if (!invoice.cgstAmount && invoice.cgstPercent) {
                                                    cgst = (baseAmount * (invoice.cgstPercent || 0) / 100) || 0;
                                                }
                                                if (!invoice.sgstAmount && invoice.sgstPercent) {
                                                    sgst = (baseAmount * (invoice.sgstPercent || 0) / 100) || 0;
                                                }
                                                
                                                const taxableAmount = baseAmount;
                                                const totalRoomPrice = invoice.paidAmount || (baseAmount + cgst + sgst);
                                                
                                                return (
                                                    <TableRow key={invoice._id} className="hover:bg-gray-50 border-b border-gray-100">
                                                        <TableCell className="py-3 text-sm text-gray-600">
                                                            {new Date(invoice.invoiceDate || invoice.createdAt).toLocaleDateString('en-IN', {
                                                                day: '2-digit',
                                                                month: 'short',
                                                                year: 'numeric',
                                                            })}
                                                        </TableCell>
                                                        <TableCell className="font-medium text-sm text-gray-800">
                                                            {invoice.invoiceNo ||invoice.orderNumber|| 'N/A'}
                                                        </TableCell>
                                                        <TableCell className="text-sm">
                                                            <div className="font-medium text-gray-800">{invoice.guestFirst ||invoice.customer.name|| 'Walk-in Customer'}</div>
                                                            {invoice.phone && (
                                                                <div className="text-xs text-gray-500">{invoice.phone}</div>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="capitalize">
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                                invoice.paymentMode === 'online' 
                                                                    ? 'bg-green-100 text-green-800' 
                                                                    : 'bg-blue-100 text-blue-800'
                                                            }`}>
                                                                {invoice.paymentMode||invoice.orderType || 'N/A'}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="text-center font-medium text-gray-900">
                                                            ₹{taxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </TableCell>
                                                        <TableCell className="text-center text-gray-600">
                                                            ₹{cgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </TableCell>
                                                        <TableCell className="text-center text-gray-600">
                                                            ₹{sgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </TableCell>
                                                        <TableCell className="text-center font-medium text-gray-900">
                                                            ₹{(invoice.totalAmount || totalRoomPrice|| 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                                                    {Object.values(filters).some(Boolean)
                                                        ? 'No invoices match your filters'
                                                        : 'No invoices found'}
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                    {filteredInvoices.length > 0 && (
                                        <tfoot className="bg-gray-50">
                                            {/* Sub Total Row */}
                                            <tr className="border border-gray-200">
                                                <td colSpan={4} className="text-right border border-black pr-6 py-3 font-medium text-gray-700">Sub Total:</td>
                                                <td className="text-center border border-black py-3 font-medium text-gray-900">
                                                ₹{filteredInvoices.reduce((sum, inv) => {
                                                    // Use roomPrice directly for room invoices, or totalAmount for others
                                                    const baseAmount = inv.roomPrice || inv.totalFoodAmount || 0;
                                                    return sum + parseFloat(baseAmount);
                                                }, 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                                <td className="text-center py-3 font-medium border border-black text-gray-900">
                                                ₹{filteredInvoices.reduce((sum, inv) => {
                                                    // Use roomPrice directly for room invoices, or totalAmount for others
                                                    const baseAmount = inv.roomPrice || inv.totalAmount || 0;
                                                    
                                                    // If CGST amount is not set but percentage is, calculate it
                                                    if (!inv.cgstAmount && inv.cgstPercent) {
                                                        return sum + ((baseAmount * (inv.cgstPercent || 0) / 100) || 0);
                                                    }
                                                    return sum + (parseFloat(inv.cgstAmount) || 0);
                                                }, 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                                <td className="text-center py-3 font-medium border border-black text-gray-900">
                                                ₹{filteredInvoices.reduce((sum, inv) => {
                                                    // Use roomPrice directly for room invoices, or totalAmount for others
                                                    const baseAmount = inv.roomPrice || inv.totalAmount || 0;
                                                    
                                                    // If SGST amount is not set but percentage is, calculate it
                                                    if (!inv.sgstAmount && inv.sgstPercent) {
                                                        return sum + ((baseAmount * (inv.sgstPercent || 0) / 100) || 0);
                                                    }
                                                    return sum + (parseFloat(inv.sgstAmount) || 0);
                                                }, 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                                <td className="text-center py-3 font-bold border border-black text-gray-900">
                                                ₹{filteredInvoices.reduce((sum, inv) => {
                                                    // For the total, we should use the paidAmount if it exists, otherwise calculate it
                                                    if (inv.paidAmount) {
                                                        return sum + parseFloat(inv.paidAmount);
                                                    }
                                                    
                                                    // Fallback calculation if paidAmount is not available
                                                    const baseAmount = inv.roomPrice ||inv.subtotal|| inv.totalAmount || 0;
                                                    
                                                    // Calculate CGST and SGST - use amount if available, otherwise calculate from percentage
                                                    let cgst = inv.cgstAmount || 0;
                                                    let sgst = inv.sgstAmount || 0;
                                                    
                                                    // If amounts are not set but percentages are, calculate them
                                                    if (!inv.cgstAmount && inv.cgstPercent) {
                                                        cgst = (baseAmount * (parseFloat(inv.cgstPercent) || 0) / 100) || 0;
                                                    }
                                                    if (!inv.sgstAmount && inv.sgstPercent) {
                                                        sgst = (baseAmount * (parseFloat(inv.sgstPercent) || 0) / 100) || 0;
                                                    }
                                                    
                                                    const calculatedTotal = parseFloat(baseAmount) + parseFloat(cgst) + parseFloat(sgst);
                                                    return sum + calculatedTotal;
                                                }, 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                                <td></td>
                                            </tr>
                                            
                                            {/* Footer Content */}
                                            <tr>
                                                <td colSpan={9} className="py-4">
                                                    <div className="flex flex-col md:flex-row justify-between gap-6 px-4">
                                                        {/* Payment Summary */}
                                                        <div className="w-full md:w-1/3 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                                            <h3 className="font-semibold text-gray-800 text-sm uppercase tracking-wider mb-3">Payment Summary</h3>
                                                            <div className="space-y-3">
                                                                {/* Received Payments */}
                                                                <div className="space-y-2">
                                                                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Received</h4>
                                                                    <div className="space-y-1.5">
                                                                        <div className="flex justify-between items-center">
                                                                            <span className="text-sm text-gray-600">Cash:</span>
                                                                            <span className="font-medium text-gray-900">
                                                                                ₹{filteredInvoices
                                                                                    .filter(inv => inv.paymentMode === 'cash')
                                                                                    .reduce((sum, inv) => {
                                                                                        // Use paidAmount if available, otherwise calculate total
                                                                                        if (inv.paidAmount) return sum + parseFloat(inv.paidAmount);
                                                                                        
                                                                                        const baseAmount = inv.roomPrice || inv.totalAmount || 0;
                                                                                        let cgst = inv.cgstAmount || 0;
                                                                                        let sgst = inv.sgstAmount || 0;
                                                                                        
                                                                                        if (!inv.cgstAmount && inv.cgstPercent) {
                                                                                            cgst = (baseAmount * (parseFloat(inv.cgstPercent) || 0) / 100) || 0;
                                                                                        }
                                                                                        if (!inv.sgstAmount && inv.sgstPercent) {
                                                                                            sgst = (baseAmount * (parseFloat(inv.sgstPercent) || 0) / 100) || 0;
                                                                                        }
                                                                                        
                                                                                        return sum + parseFloat(baseAmount) + parseFloat(cgst) + parseFloat(sgst);
                                                                                    }, 0)
                                                                                    .toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex justify-between items-center">
                                                                            <span className="text-sm text-gray-600">Online:</span>
                                                                            <span className="font-medium text-gray-900">
                                                                                ₹{filteredInvoices
                                                                                    .filter(inv => inv.paymentMode === 'online' && inv.paymentStatus === 'completed')
                                                                                    .reduce((sum, inv) => {
                                                                                        // Use paidAmount if available, otherwise calculate total
                                                                                        if (inv.paidAmount) return sum + parseFloat(inv.paidAmount);
                                                                                        
                                                                                        const baseAmount = inv.roomPrice || inv.totalAmount || 0;
                                                                                        let cgst = inv.cgstAmount || 0;
                                                                                        let sgst = inv.sgstAmount || 0;
                                                                                        
                                                                                        if (!inv.cgstAmount && inv.cgstPercent) {
                                                                                            cgst = (baseAmount * (parseFloat(inv.cgstPercent) || 0) / 100) || 0;
                                                                                        }
                                                                                        if (!inv.sgstAmount && inv.sgstPercent) {
                                                                                            sgst = (baseAmount * (parseFloat(inv.sgstPercent) || 0) / 100) || 0;
                                                                                        }
                                                                                        
                                                                                        return sum + parseFloat(baseAmount) + parseFloat(cgst) + parseFloat(sgst);
                                                                                    }, 0)
                                                                                    .toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Pending Payments */}
                                                                <div className="space-y-2 pt-2 border-t border-gray-100">
                                                                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Pending</h4>
                                                                    <div className="space-y-1.5">
                                                                        <div className="flex justify-between items-center">
                                                                            <span className="text-sm text-gray-600">Cash:</span>
                                                                            <span className="font-medium text-yellow-600">
                                                                                ₹{filteredInvoices
                                                                                    .filter(inv => inv.paymentMode === 'cash' && inv.paymentStatus !== 'completed')
                                                                                    .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0)
                                                                                    .toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex justify-between items-center">
                                                                            <span className="text-sm text-gray-600">Online:</span>
                                                                            <span className="font-medium text-yellow-600">
                                                                                ₹{filteredInvoices
                                                                                    .filter(inv => inv.paymentMode === 'online' && inv.paymentStatus !== 'completed')
                                                                                    .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0)
                                                                                    .toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Tax Summary */}
                                                                <div className="space-y-2 pt-2 border-t border-gray-100">
                                                                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Tax Summary</h4>
                                                                    <div className="space-y-1.5">
                                                                        <div className="flex justify-between items-center">
                                                                            <span className="text-sm text-gray-600">Total CGST:</span>
                                                                            <span className="font-medium text-gray-900">
                                                                                ₹{filteredInvoices.reduce((sum, inv) => {
                                                                                    const baseAmount = parseFloat(inv.roomPrice || inv.totalAmount || 0);
                                                                                    if (inv.cgstAmount !== null && inv.cgstAmount !== undefined) {
                                                                                        return sum + (parseFloat(inv.cgstAmount) || 0);
                                                                                    } else if (inv.cgstPercent) {
                                                                                        return sum + ((baseAmount * (parseFloat(inv.cgstPercent) || 0) / 100) || 0);
                                                                                    }
                                                                                    return sum;
                                                                                }, 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex justify-between items-center">
                                                                            <span className="text-sm text-gray-600">Total SGST:</span>
                                                                            <span className="font-medium text-gray-900">
                                                                                ₹{filteredInvoices.reduce((sum, inv) => {
                                                                                    const baseAmount = parseFloat(inv.roomPrice || inv.totalAmount || 0);
                                                                                    if (inv.sgstAmount !== null && inv.sgstAmount !== undefined) {
                                                                                        return sum + (parseFloat(inv.sgstAmount) || 0);
                                                                                    } else if (inv.sgstPercent) {
                                                                                        return sum + ((baseAmount * (parseFloat(inv.sgstPercent) || 0) / 100) || 0);
                                                                                    }
                                                                                    return sum;
                                                                                }, 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex justify-between items-center font-medium pt-1 border-t border-gray-100">
                                                                            <span className="text-sm">Total Tax:</span>
                                                                            <span className="text-blue-700">
                                                                                ₹{filteredInvoices.reduce((sum, inv) => {
                                                                                    const baseAmount = parseFloat(inv.roomPrice || inv.totalAmount || 0);
                                                                                    let totalTax = 0;
                                                                                    
                                                                                    // Calculate CGST
                                                                                    if (inv.cgstAmount !== null && inv.cgstAmount !== undefined) {
                                                                                        totalTax += parseFloat(inv.cgstAmount) || 0;
                                                                                    } else if (inv.cgstPercent) {
                                                                                        totalTax += (baseAmount * (parseFloat(inv.cgstPercent) || 0) / 100) || 0;
                                                                                    }
                                                                                    
                                                                                    // Calculate SGST
                                                                                    if (inv.sgstAmount !== null && inv.sgstAmount !== undefined) {
                                                                                        totalTax += parseFloat(inv.sgstAmount) || 0;
                                                                                    } else if (inv.sgstPercent) {
                                                                                        totalTax += (baseAmount * (parseFloat(inv.sgstPercent) || 0) / 100) || 0;
                                                                                    }
                                                                                    
                                                                                    return sum + totalTax;
                                                                                }, 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Grand Total */}
                                                                <div className="border-t border-gray-200 pt-3 mt-2">
                                                                    <div className="flex justify-between items-center font-semibold text-gray-800 ">
                                                                        <span>Grand Total:</span>
                                                                        <span>
                                                                            ₹{filteredInvoices.reduce((sum, inv) => {
                                                                                // Use the same logic as the table's total column and bottom grand total
                                                                                if (inv.paidAmount) {
                                                                                    return sum + parseFloat(inv.paidAmount);
                                                                                }
                                                                                
                                                                                // Fallback calculation if paidAmount is not available
                                                                                const baseAmount = parseFloat(inv.roomPrice || inv.totalFoodAmount || 0);
                                                                                
                                                                                // Calculate CGST and SGST - use amount if available, otherwise calculate from percentage
                                                                                let cgst = 0;
                                                                                let sgst = 0;
                                                                                
                                                                                if (inv.cgstAmount !== null && inv.cgstAmount !== undefined) {
                                                                                    cgst = parseFloat(inv.cgstAmount) || 0;
                                                                                } else if (inv.cgstPercent) {
                                                                                    cgst = (baseAmount * (parseFloat(inv.cgstPercent) || 0) / 100) || 0;
                                                                                }
                                                                                
                                                                                if (inv.sgstAmount !== null && inv.sgstAmount !== undefined) {
                                                                                    sgst = parseFloat(inv.sgstAmount) || 0;
                                                                                } else if (inv.sgstPercent) {
                                                                                    sgst = (baseAmount * (parseFloat(inv.sgstPercent) || 0) / 100) || 0;
                                                                                }
                                                                                
                                                                                return sum + baseAmount + cgst + sgst;
                                                                            }, 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        
                                                        {/* Spacer */}
                                                        <div className="hidden md:block flex-1"></div>
                                                        
                                                        {/* Grand Total */}
                                                        <div className="w-full md:w-1/3 space-y-3">
                                                            <div className="flex justify-between items-center py-2 border-t border-b border-gray-500">
                                                                <span className="text-lg font-bold text-gray-800">Grand Total:</span>
                                                                <span className="text-xl font-bold text-blue-700">
                                                                    ₹{filteredInvoices.reduce((sum, inv) => {
                                                                        // Use the same logic as the table's total column
                                                                        if (inv.paidAmount) {
                                                                            return sum + parseFloat(inv.paidAmount);
                                                                        }
                                                                        
                                                                        // Fallback calculation if paidAmount is not available
                                                                        const baseAmount = parseFloat(inv.roomPrice || inv.totalFoodAmount || 0);
                                                                        
                                                                        // Calculate CGST and SGST - use amount if available, otherwise calculate from percentage
                                                                        let cgst = 0;
                                                                        let sgst = 0;
                                                                        
                                                                        if (inv.cgstAmount !== null && inv.cgstAmount !== undefined) {
                                                                            cgst = parseFloat(inv.cgstAmount) || 0;
                                                                        } else if (inv.cgstPercent) {
                                                                            cgst = (baseAmount * (parseFloat(inv.cgstPercent) || 0) / 100) || 0;
                                                                        }
                                                                        
                                                                        if (inv.sgstAmount !== null && inv.sgstAmount !== undefined) {
                                                                            sgst = parseFloat(inv.sgstAmount) || 0;
                                                                        } else if (inv.sgstPercent) {
                                                                            sgst = (baseAmount * (parseFloat(inv.sgstPercent) || 0) / 100) || 0;
                                                                        }
                                                                        
                                                                        return sum + baseAmount + cgst + sgst;
                                                                    }, 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        </tfoot>
                                    )}
                                </Table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TotalSaleReport;