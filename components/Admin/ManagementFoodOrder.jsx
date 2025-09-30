"use client"
import { Minus, Plus, Printer, X } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Textarea } from '../ui/textarea';

const initialFoodRow = {
    category: '',
    inventory: '',
    qtyType: '',
    qty: '',
    amount: '',
    tax: '',
};

const ManagementFoodOrder = () => {
    const [guest, setGuest] = useState('');

    // Utility for unique ids
    function uuid() {
        return '_' + Math.random().toString(36).substr(2, 9);
    }
    const [foodRows, setFoodRows] = useState([{ ...initialFoodRow, id: uuid() }]);
    const [foodInventoryData, setFoodInventoryData] = useState([]);
    const [loadingFoodInventory, setLoadingFoodInventory] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [discount, setDiscount] = useState(0);
    const [extraCharges, setExtraCharges] = useState(0);
    const [totalAmount, setTotalAmount] = useState(0);
    const [gstAmount, setGstAmount] = useState(0);
    const [cgstAmount, setCGSTAmount] = useState(0);
    const [sgstAmount, setSGSTAmount] = useState(0);
    const [finalTotal, setFinalTotal] = useState(0);
    const [invoices, setInvoices] = useState([]);
    const [reason, setReason] = useState('');
    const [loadingInvoices, setLoadingInvoices] = useState(false);
    const [hotelData, setHotelData] = useState(null);
    // console.log(invoices)
    // Fetch invoices
    const fetchInvoices = async () => {
        setLoadingInvoices(true);
        try {
            const res = await fetch('/api/managementFoodOrderInvoice');
            const data = await res.json();
            if (data && data.invoices) {
                setInvoices(data.invoices);
            }
        } catch (error) {
            toast.error('Failed to load invoices');
        } finally {
            setLoadingInvoices(false);
        }
    };
    const fetchFoodInventory = async () => {
        setLoadingFoodInventory(true);
        try {
            const res = await fetch('/api/foodInventory');
            const data = await res.json();
            if (data) {
                setFoodInventoryData(data);
            }
        } catch (err) {
            toast.error(`Failed to load food inventory: ${err.message}`);
        } finally {
            setLoadingFoodInventory(false);
        }
    };
    const fetchHotelData = async () => {
        try {
            const response = await fetch('/api/addBasicInfo');
            const data = await response.json();
            if (data && data[0]) {
                setHotelData(data[0]);
            }
        } catch (error) {
            console.error('Error fetching hotel data:', error);
        }
    };
    useEffect(() => {
        fetchFoodInventory();
        fetchInvoices();
        fetchHotelData();
    }, []);

    // Format date to display
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 2
        }).format(amount || 0);
    };

    // Update food item details when selected
    const handleFoodItemSelect = (idx, foodItemId) => {
        const selectedItem = foodInventoryData.find(item => item._id === foodItemId);
        if (selectedItem) {
            const newRows = [...foodRows];
            newRows[idx] = {
                ...newRows[idx],
                foodItem: selectedItem,
                // qtyType: 'full' // Default to full quantity type
            };
            setFoodRows(newRows);
        }
    };
    // Add new food row
    const handleAddRow = () => {
        setFoodRows([...foodRows, { ...initialFoodRow, id: uuid() }]);
    };
    const handleDeleteRow = (idx) => {
        if (idx === 0) return; // Prevent deleting the first row
        const newRows = [...foodRows];
        newRows.splice(idx, 1);
        setFoodRows(newRows);
    };

    // Update food row
    const handleFoodRowChange = (idx, field, value) => {
        setFoodRows(foodRows.map((row, i) => i === idx ? { ...row, [field]: value } : row));
    };

    // Function to get price based on quantity type
    const getPriceForQtyType = (product, qtyType) => {
        switch (qtyType?.toLowerCase()) {
            case 'quarter':
                return parseFloat(product.quarterPrice || 0);
            case 'half':
                return parseFloat(product.halfPrice || 0);
            case 'full':
                return parseFloat(product.fullPrice || 0);
            case 'per piece':
                return parseFloat(product.perPiecePrice || 0);
            default:
                return 0;
        }
    };

    // Calculate GST for a given amount and GST percentage
    const calculateGST = (amount, percent) => {
        const gstAmount = (amount * (parseFloat(percent) || 0)) / 100;
        return parseFloat(gstAmount.toFixed(2));
    };

    // Calculate totals whenever food rows change
    useEffect(() => {
        let foodTotal = 0;
        let totalCGST = 0;
        let totalSGST = 0;

        foodRows.forEach(row => {
            if (row.foodItem && row.qty && row.qtyType) {
                const itemPrice = getPriceForQtyType(row.foodItem, row.qtyType);
                const itemTotal = itemPrice * parseFloat(row.qty || 0);
                const cgst = calculateGST(itemTotal, row.foodItem.cgstPercent || 0);
                const sgst = calculateGST(itemTotal, row.foodItem.sgstPercent || 0);

                foodTotal += itemTotal;
                totalCGST += cgst;
                totalSGST += sgst;
            }
        });

        const total = parseFloat((foodTotal + totalCGST + totalSGST).toFixed(2));
        setTotalAmount(parseFloat(foodTotal.toFixed(2)));
        setGstAmount(parseFloat((totalCGST + totalSGST).toFixed(2)));
        setFinalTotal(total);
        setCGSTAmount(parseFloat(totalCGST.toFixed(2)));
        setSGSTAmount(parseFloat(totalSGST.toFixed(2)));
    }, [foodRows]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        // Basic validation
        if (!guest) {
            toast.error('Please fill Guest Name');
            setSubmitting(false);
            return;
        }
        if (!reason) {
            toast.error('Please fill Reason');
            setSubmitting(false);
            return;
        }

        if (foodRows.length === 0 || foodRows.some(row => !row.foodItem || !row.qty || !row.qtyType)) {
            toast.error('Please add at least one food item with quantity');
            setSubmitting(false);
            return;
        }
        // Prepare food items data with prices
        const foodItems = foodRows
            .filter(row => row.foodItem && row.qty && row.qtyType)
            .map(row => {
                const itemPrice = getPriceForQtyType(row.foodItem, row.qtyType);
                const amount = itemPrice * parseFloat(row.qty || 0);

                const cgst = calculateGST(amount, row.foodItem.cgstPercent || 0);
                const sgst = calculateGST(amount, row.foodItem.sgstPercent || 0);

                return {
                    categoryName: row.foodItem.categoryName,
                    foodName: row.foodItem.foodName,
                    qtyType: row.qtyType,
                    qty: Number(row.qty),
                    price: itemPrice,
                    amount: amount,
                    cgstPercent: row.foodItem.cgstPercent || 0,
                    cgstAmount: cgst,
                    sgstPercent: row.foodItem.sgstPercent || 0,
                    sgstAmount: sgst,
                    tax: cgst + sgst,
                    foodItem: row.foodItem._id // Store reference to the food item
                };
            });


        const invoiceWithPayment = {
            foodItems,
            guestFirst: guest,
            discount: parseFloat(discount || 0),
            extraCharges: parseFloat(extraCharges || 0),
            totalFoodAmount: totalAmount,
            gstOnFood: gstAmount,
            totalAmount: finalTotal,
            reason,

            paidAmount: 0, // Update this based on payment
            dueAmount: finalTotal // Update this based on payment
        };

        // Always create the invoice firt
        const response = await fetch('/api/managementFoodOrderInvoice', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(invoiceWithPayment)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to create invoice');
        }

        // For non-online payments, mark as completed immediately
        await fetch('/api/managementFoodOrderInvoice', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: data.invoice._id, // Include ID in the request body
                paidAmount: finalTotal,
                dueAmount: 0
            })
        });
        toast.success('Invoice Created Successfully!');


        // Clear form and refresh invoices
        try {
            setGuest('');
            setReason('');
            setDiscount(0);
            setExtraCharges(0);
            setFoodRows([{ foodItem: '', qty: '', qtyType: 'plate' }]);
            await fetchInvoices();
        } catch (error) {
            console.error('Error clearing form:', error);
            toast.error('Error clearing form');
        } finally {
            setSubmitting(false);
        }
    };
    const handlePrint = (inv) => {
        // Create a new window for printing
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            toast.error('Pop-up blocked. Please allow pop-ups for this site.');
            return;
        }

        // Calculate amounts
        const roomPrice = parseFloat(inv.roomPrice || 0);
        // Initialize tax percentages and amounts
        let cgstPercent = parseFloat(inv.cgstPercent || 0);
        let sgstPercent = parseFloat(inv.sgstPercent || 0);
        let cgstAmount, sgstAmount;

        // Handle CGST
        if (inv.cgstAmount !== undefined && inv.cgstAmount !== null && inv.cgstAmount !== "") {
            cgstAmount = parseFloat(inv.cgstAmount) || 0;
            if (!cgstPercent && roomPrice > 0) {
                cgstPercent = (cgstAmount / roomPrice) * 100;
            }
        } else {
            cgstAmount = (roomPrice * cgstPercent / 100) || 0;
        }

        // Handle SGST
        if (inv.sgstAmount !== undefined && inv.sgstAmount !== null && inv.sgstAmount !== "") {
            sgstAmount = parseFloat(inv.sgstAmount) || 0;
            if (!sgstPercent && roomPrice > 0) {
                sgstPercent = (sgstAmount / roomPrice) * 100;
            }
        } else {
            sgstAmount = (roomPrice * sgstPercent / 100) || 0;
        }
        // Format guest name
        const guestName = `${inv.guestFirst || ''} ${inv.guestMiddle || ''} ${inv.guestLast || ''}`.trim();

        // Format dates
        const formatDate = (dateString) => {
            if (!dateString) return 'N/A';
            const date = new Date(dateString);
            return date.toLocaleDateString('en-IN');
        };

        // Format currency
        const formatCurrency = (amount) => {
            return parseFloat(amount || 0).toLocaleString('en-IN', {
                style: 'currency',
                currency: 'INR',
                maximumFractionDigits: 2
            });
        };
        const invoiceHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Invoice #${inv.invoiceNo || ''}</title>
                <style>
                    @media print {
                        @page { 
                            size: 80mm auto;
                            margin: 0;
                        }
                        body { 
                            margin: 0;
                            padding: 5mm;
                            font-family: monospace;
                            font-size: 12px;
                            color: #000;
                        }
                        .invoice-container {
                            width: 100%;
                            max-width: 72mm;
                            margin: 0 auto;
                        }
                        .center { text-align: center; }
                        .right { text-align: right; }
                        .line { border-top: 1px dashed #000; margin: 5px 0; }
                        .title { 
                            font-size: 14px; 
                            font-weight: bold; 
                            margin-bottom: 5px;
                            text-align: center;
                        }
                        table { 
                            width: 100%; 
                            border-collapse: collapse;
                            margin: 5px 0;
                        }
                        th, td {
                            padding: 2px 0;
                            font-size: 11px;
                        }
                        th { 
                            border-bottom: 1px solid #000;
                            text-align: left;
                        }
                        .footer {
                            margin-top: 10px;
                            font-size: 10px;
                            text-align: center;
                        }
                        .text-right {
                            text-align: right;
                        }
                        .text-center {
                            text-align: center;
                        }
                    }
                </style>
            </head>
            <body onload="window.print();window.close()">
                <div class="invoice-container">
                    <!-- Hotel Info -->
                    <div class="">
                        <div class="title">${hotelData?.hotelName || 'Hotel Shivan Residence'}</div>
                        <div><b>GSTIN:</b> ${hotelData?.gstNumber || 'XXXXXXXXXXXXXXX'}</div>
                        <div><b>Address:</b> ${hotelData?.address1 || ''}</div>
                        <div><b>Contact:</b> ${hotelData?.contactNumber1 || ''}</div>
                    </div>
                    <div class="line"></div>
            
                    <!-- Guest + Invoice Info -->
                    <div>
                        <div><b>Bill To:</b> ${guestName}</div>
                        <div><b>Invoice:</b> ${inv.invoiceNo || 'N/A'}</div>
                        <div><b>Date:</b> ${formatDate(inv.invoiceDate || inv.createdAt) || 'N/A'}</div>
                    </div>
                    <div class="line"></div>
            
                    <!-- Items -->
                    <table>
                        <tr>
                            <th>Item</th>
                            <th>Qty</th>
                            <th class="right">Rate</th>
                            <th class="right">Amount</th>
                        </tr>
                        ${(inv.foodItems || []).map(item => `
                            <tr>
                                <td>${item.foodName || item.foodItem?.foodName || 'N/A'}</td>
                                <td class="">${item.qty || 0}</td>
                                <td class="right">${formatCurrency(item.price || 0)}</td>
                                <td class="right">${formatCurrency(item.amount || 0)}</td>
                            </tr>
                        `).join('')}
                    </table>
                    <div class="line"></div>
            
                    <!-- Totals -->
                    <table>
                        ${inv.discount > 0 ? `
                            <tr>
                                <td colspan="3">Discount</td>
                                <td class="right">-${formatCurrency(inv.discount)}</td>
                            </tr>
                        ` : ''}
                        ${inv.extraCharges > 0 ? `
                            <tr>
                                <td colspan="3">Extra Charges</td>
                                <td class="right">${formatCurrency(inv.extraCharges)}</td>
                            </tr>
                        ` : ''}
                        ${cgstAmount > 0 ? `
                            <tr>
                                <td colspan="3">CGST</td>
                                <td class="right">${formatCurrency(cgstAmount)}</td>
                            </tr>
                        ` : ''}
                        ${sgstAmount > 0 ? `
                            <tr>
                                <td colspan="3">SGST</td>
                                <td class="right">${formatCurrency(sgstAmount)}</td>
                            </tr>
                        ` : ''}
                        <tr>
                            <td colspan="3"><b>Total Amount</b></td>
                            <td class="right"><b>${formatCurrency(inv.totalAmount || 0)}</b></td>
                        </tr>
                    </table>
                    <div class="line"></div>
                    
                    <!-- Footer -->
                    <div class="footer">
                        Thank you for your visit!<br>
                        This is a computer-generated invoice.<br>
                        ${new Date().toLocaleString()}
                    </div>
                </div>
            </body>
            </html>`;

        // Write the invoice to the new window and trigger print
        printWindow.document.open();
        printWindow.document.write(invoiceHtml);
        printWindow.document.close();
    };

    return (
        <div className="p-4 max-w-5xl mx-auto">

            <div className="border border-black p-5 rounded ">
                {/* Room & Guest Section */}
                <div className="flex flex-col gap-5 mb-4">
                    <div className="flex flex-col gap-2">
                        <label className="font-bold">Management Person Name</label>
                        <input
                            type="text"
                            className="rounded w-full p-2 bg-white border border-black text-black font-bold outline-none"
                            placeholder="Management Person Name Come Here"
                            value={guest}
                            onChange={(e) => setGuest(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="font-bold">Reason</label>
                        <Textarea
                            rows={4}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            type="text"
                            className="rounded w-full p-2 bg-white border border-black text-black font-bold outline-none"
                            placeholder="Reason Come Here"
                        />
                    </div>
                </div>
                {/* Food Entry Section */}
                <div className="bg-cyan-100 rounded-xl p-6 mb-6">
                    {foodRows.map((row, idx) => {
                        // Unique food categories from foodInventoryData
                        const categories = Array.from(new Set(foodInventoryData.map(item => item.categoryName)));

                        return (
                            <div key={`food-row-${row.foodItem?._id || idx}-${row.qtyType || ''}`} className="flex flex-wrap gap-4 items-center mb-4 border-b pb-4 last:border-b-0 last:pb-0">
                                <select
                                    className="rounded p-2 bg-white border border-black text-black font-bold outline-none "
                                    value={row.category}
                                    onChange={e => handleFoodRowChange(idx, 'category', e.target.value)}
                                >
                                    <option value="">Select Food Category</option>
                                    {categories.map(cat => (
                                        <option key={`cat-${cat}-${idx}`} value={cat}>
                                            {cat}
                                        </option>
                                    ))}
                                </select>
                                <div className="flex-1">
                                    <select
                                        className="w-64 p-2 border rounded bg-white border-black text-black font-bold outline-none"
                                        value={row.foodItem?._id || ''}
                                        onChange={(e) => handleFoodItemSelect(idx, e.target.value)}
                                        required
                                    >
                                        <option value="">Select Food Item</option>
                                        {foodInventoryData.map((item) => (
                                            <option
                                                key={`food-${item._id}-${idx}`}
                                                value={item._id}
                                            >
                                                {item.foodName}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="w-44">
                                    <select
                                        className="w-full p-2 border rounded bg-white border-black text-black font-bold outline-none"
                                        value={row.qtyType || ''}
                                        onChange={(e) => handleFoodRowChange(idx, 'qtyType', e.target.value)}
                                        required
                                        disabled={!row.foodItem}
                                    >
                                        <option value="">Qty Type</option>
                                        {row.foodItem?.quarterPrice && <option value="quarter">Quarter (₹{row.foodItem.quarterPrice})</option>}
                                        {row.foodItem?.halfPrice && <option value="half">Half (₹{row.foodItem.halfPrice})</option>}
                                        {row.foodItem?.fullPrice && <option value="full">Full (₹{row.foodItem.fullPrice})</option>}
                                        {row.foodItem?.perPiecePrice && <option value="per piece">Per Piece (₹{row.foodItem.perPiecePrice})</option>}
                                    </select>
                                </div>
                                <input type="number" min="1" className="rounded px-4 py-2 bg-white border border-black text-black font-bold outline-none w-28" placeholder="Qty" value={row.qty} onChange={e => handleFoodRowChange(idx, 'qty', e.target.value)} />
                                <button type="button" className="bg-blue-700 text-white rounded p-1 text-md flex items-center" onClick={handleAddRow}>
                                    <span className="text-2xl font-bold"><Plus /></span>
                                </button>
                                {idx > 0 && (
                                    <button type="button" className="bg-blue-700 text-white rounded p-1 text-md flex items-center" onClick={() => handleDeleteRow(idx)}>
                                        <span className="text-2xl font-bold"><Minus /></span>
                                    </button>
                                )}
                            </div>
                        )
                    })}

                </div>
                {/* Table Display Section */}
                <form onSubmit={handleSubmit} className="container mx-auto p-4">
                    <label className="font-bold block mb-2">Display</label>
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr>
                                    <th className="bg-gray-300 text-black font-bold py-2 px-4 border">Food Item Name</th>
                                    <th className="bg-gray-300 text-black font-bold py-2 px-4 border">Qty Type</th>
                                    <th className="bg-gray-300 text-black font-bold py-2 px-4 border">Total Qty</th>
                                    <th className="bg-gray-300 text-black font-bold py-2 px-4 border">Amount</th>
                                    <th className="bg-gray-300 text-black font-bold py-2 px-4 border">Total</th>
                                    {/* <th className="bg-gray-300 text-black font-bold py-2 px-4 border">Edit</th> */}
                                </tr>
                            </thead>
                            <tbody>
                                {foodRows
                                    .filter(row => row.foodItem && row.qty && row.qtyType)
                                    .map((row, idx) => {
                                        const itemPrice = getPriceForQtyType(row.foodItem, row.qtyType);
                                        const amount = itemPrice * parseFloat(row.qty || 0);
                                        const tax = amount * 0.05; // 5% GST

                                        return (
                                            <tr key={`food-row-${row.foodItem?._id || idx}-${row.qtyType || ''}`}>
                                                <td className="bg-white border text-black text-center">{row.foodItem.foodName}</td>
                                                <td className="bg-white border text-black text-center">{row.qtyType}</td>
                                                <td className="bg-white border text-black text-center">{row.qty}</td>
                                                <td className="bg-white border text-black text-center">₹{amount.toFixed(2)}</td>
                                                <td className="bg-white border text-black text-center">₹{(amount + (row.cgstAmount || 0) + (row.sgstAmount || 0)).toFixed(2)}</td>
                                            </tr>
                                        );
                                    })}
                                {/* Totals Row */}
                                <tr>
                                    <td colSpan={4} className="bg-white border text-black font-bold text-right pr-4">Subtotal</td>
                                    <td className="bg-white border text-black font-bold text-center">₹{totalAmount.toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td colSpan={4} className="bg-white border text-black font-bold text-right pr-4">CGST</td>
                                    <td className="bg-white border text-black font-bold text-center">₹{cgstAmount.toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td colSpan={4} className="bg-white border text-black font-bold text-right pr-4">SGST</td>
                                    <td className="bg-white border text-black font-bold text-center">₹{sgstAmount.toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td colSpan={4} className="bg-white border text-black font-bold text-right pr-4">Total Tax</td>
                                    <td className="bg-white border text-black font-bold text-center">₹{gstAmount.toFixed(2)}</td>
                                </tr>
                                {/* <tr>
                                <td colSpan={4} className="bg-white border text-black font-bold text-right pr-4">Extra Charges</td>
                                <td className="bg-white border text-black font-bold text-center">
                                    <input 
                                        type="number" 
                                        min="0" 
                                        className="w-24 text-center border-b border-gray-400 outline-none"
                                        value={extraCharges}
                                        onChange={(e) => setExtraCharges(parseFloat(e.target.value) || 0)}
                                    />
                                </td>
                            </tr>
                            <tr>
                                <td colSpan={4} className="bg-white border text-black font-bold text-right pr-4">Discount</td>
                                <td className="bg-white border text-black font-bold text-center">
                                    <input 
                                        type="number" 
                                        min="0" 
                                        className="w-24 text-center border-b border-gray-400 outline-none"
                                        value={discount}
                                        onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                                    />
                                </td>
                            </tr> */}
                                <tr className="bg-gray-100">
                                    <td colSpan={4} className="border text-black font-bold text-right pr-4">Final Total</td>
                                    <td className="border text-black font-bold text-center">₹{finalTotal.toFixed(2)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    {/* Submit Button */}
                    <div className="mt-8 text-center">
                        <button
                            type="submit"
                            className="bg-blue-700 text-white px-8 py-3 rounded-lg text-lg font-bold hover:bg-blue-800 transition-colors disabled:opacity-50"
                            disabled={submitting || foodRows.length === 0}
                        >
                            {submitting ? 'Creating Invoice...' : 'Create Invoice'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Invoices Table */}
            <div className="mt-12 border border-black rounded p-2">
                <h2 className="text-2xl font-bold mb-4">Recent Invoices</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-black overflow-hidden">
                        <thead className="bg-gray-100 border border-black">
                            <tr>
                                <th className="px-2 py-2 text-center text-xs font-medium text-gray-600 uppercase tracking-wider border border-black"># Invoice</th>
                                <th className="px-2 py-2 text-center text-xs font-medium text-gray-600 uppercase tracking-wider border border-black">Date</th>
                                <th className="px-2 py-2 text-center text-xs font-medium text-gray-600 uppercase tracking-wider border border-black">Guest</th>
                                <th className="px-2 py-2 text-center text-xs font-medium text-gray-600 uppercase tracking-wider border border-black">Reason</th>
                                <th className="px-2 py-2 text-center text-xs font-medium text-gray-600 uppercase tracking-wider border border-black">Total</th>
                                <th className="px-2 py-2 text-center text-xs font-medium text-gray-600 uppercase tracking-wider border border-black">Status</th>
                                <th className="px-2 py-2 text-center text-xs font-medium text-gray-600 uppercase tracking-wider border border-black">Print Invoice</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {loadingInvoices ? (
                                <tr>
                                    <td colSpan="7" className="text-center py-8 text-gray-500">
                                        Loading invoices...
                                    </td>
                                </tr>
                            ) : invoices.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="text-center py-8 text-gray-500">
                                        No invoices found
                                    </td>
                                </tr>
                            ) : (
                                invoices.map((invoice) => (
                                    <tr key={invoice._id} className="hover:bg-gray-50 border border-black">
                                        <td className="px-2 py-2 whitespace-nowrap text-sm font-medium border border-black text-blue-600 text-center">
                                            {invoice.invoiceNo}
                                        </td>
                                        <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500 border border-black text-center">
                                            {formatDate(invoice.invoiceDate)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-black text-center">
                                            {invoice.guestFirst} {invoice.guestLast}
                                        </td>
                                        <td className="px-2 py-4 whitespace-wrap text-sm text-gray-900 text-center border border-black">
                                            {invoice.reason}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center border border-black">
                                            {formatCurrency(invoice.paidAmount)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium border border-black">
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded 
                                                ${invoice.paymentStatus === 'completed' ? 'bg-green-100 text-green-800' :
                                                    invoice.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-gray-100 text-gray-800'}`}>
                                                {invoice.paymentStatus?.charAt(0).toUpperCase() + invoice.paymentStatus?.slice(1) || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="p-2 whitespace-nowrap text-right text-sm font-medium border border-black">
                                            <button
                                                type="button"
                                                className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 flex items-center justify-center rounded"
                                                onClick={() => handlePrint(invoice)}
                                            >
                                                <Printer className="mr-2" /> Print
                                            </button>
                                        </td>
                                    </tr>
                                )))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>


    );
}

export default ManagementFoodOrder;