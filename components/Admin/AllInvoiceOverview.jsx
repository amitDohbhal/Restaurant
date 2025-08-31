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

const AllInvoiceOverview = () => {
    const router = useRouter();
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState('room');
    const [foodItemsMap, setFoodItemsMap] = useState({});

    // Filter states
    const [filters, setFilters] = useState({
        invoiceNumber: '',
        customer: '',
        status: '',
        paymentStatus: '',
        dateFrom: '',
        dateTo: ''
    });

    const statusOptions = [
        { value: 'pending', label: 'Pending' },
        { value: 'completed', label: 'Completed' },
        { value: 'cancelled', label: 'Cancelled' },
    ];

    const paymentStatusOptions = [
        { value: 'pending', label: 'Pending' },
        { value: 'completed', label: 'Paid' },
        { value: 'failed', label: 'Failed' },
    ];

    const sectionConfig = [
        {
            key: 'room',
            label: 'Room Invoices',
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

    // Fetch food items for inventory references
    useEffect(() => {
        const fetchFoodItems = async () => {
            try {
                const response = await fetch('/api/foodInventory');
                const data = await response.json();
                if (Array.isArray(data)) {
                    const itemsMap = data.reduce((acc, item) => ({
                        ...acc,
                        [item._id]: item
                    }), {});
                    setFoodItemsMap(itemsMap);
                }
            } catch (error) {
                console.error('Error fetching food items:', error);
            }
        };

        fetchFoodItems();
    }, []);

    useEffect(() => {
        const fetchInvoices = async () => {
            setLoading(true);
            try {
                const activeSectionConfig = sectionConfig.find(section => section.key === activeSection);
                if (!activeSectionConfig) return;

                const response = await fetch(activeSectionConfig.apiEndpoint);
                const data = await response.json();

                if (data.success) {
                    // Process invoices to handle food items
                    const processedInvoices = data.invoices?.map(invoice => ({
                        ...invoice,
                        foodItems: invoice.foodItems?.map(item => ({
                            ...item,
                            foodItem: typeof item.foodItem === 'string' 
                                ? foodItemsMap[item.foodItem] || { foodName: 'Unknown Item' }
                                : item.foodItem
                        })) || []
                    })) || [];
                    
                    setInvoices(processedInvoices);
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
    }, [activeSection, foodItemsMap]);

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const calculateTotal = (invoice) => {
        if (invoice.totalAmount) return invoice.totalAmount;
        // Fallback calculation if totalAmount is not available
        return invoice.foodItems?.reduce((sum, item) => {
            const qty = parseFloat(item.qty) || 0;
            const price = parseFloat(item.price) || 0;
            return sum + (qty * price);
        }, 0) || 0;
    };

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
                                        value={filters.status}
                                        onValueChange={(value) => handleFilterChange('status', value)}
                                    >
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder="Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {statusOptions.map(option => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
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
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Invoice #</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Items</TableHead>
                                        <TableHead>Total</TableHead>
                                        {/* <TableHead>Status</TableHead> */}
                                        <TableHead>Payment</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredInvoices.length > 0 ? (
                                        filteredInvoices.map((invoice) => (
                                            <TableRow key={invoice._id} className="hover:bg-gray-50">
                                                <TableCell className="font-medium">{invoice.invoiceNo || 'N/A'}</TableCell>
                                                <TableCell>{formatDate(invoice.invoiceDate)}</TableCell>
                                                <TableCell>
                                                    {invoice.guestFirst ||
                                                        (activeSection === 'restaurant' ? 'Walk-in Customer' : 'N/A')}
                                                </TableCell>
                                                <TableCell>
                                                    {invoice.foodItems?.length > 0
                                                        ? `${invoice.foodItems.length} items`
                                                        : 'No items'}
                                                </TableCell>
                                                <TableCell>₹ {calculateTotal(invoice).toFixed(2)}</TableCell>
                                                {/* <TableCell>
                                                    <span className={`px-2 py-1 text-xs rounded-full ${invoice.orderStatus === 'completed'
                                                            ? 'bg-green-100 text-green-800'
                                                            : invoice.orderStatus === 'cancelled'
                                                                ? 'bg-red-100 text-red-800'
                                                                : 'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                        {invoice.orderStatus || 'pending'}
                                                    </span>
                                                </TableCell> */}
                                                <TableCell>
                                                    <span className={`px-3 py-1 text-sm rounded ${invoice.paymentStatus === 'completed'
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                        {invoice.paymentStatus || 'pending'}
                                                    </span>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                                                {Object.values(filters).some(Boolean)
                                                    ? 'No invoices match your filters'
                                                    : 'No invoices found'}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AllInvoiceOverview;