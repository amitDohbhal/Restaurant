"use client";
import React, { useState } from "react";
import toast from "react-hot-toast";
import {
    Bell,
    UserCircle,
    Search,
    Edit,
    Trash2,
    ChevronDown,
    Printer,
} from "lucide-react";

import { useEffect } from "react";

const RoomInvoiceLogs = () => {
    // Pagination state
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 10;
    const [search, setSearch] = useState("");
    const [invoices, setInvoices] = useState([]);
    // Modal state for viewing invoice details
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);

    useEffect(() => {
        const fetchInvoices = async () => {
            try {
                const res = await fetch(`/api/roomInvoice?limit=${limit}&skip=${(page - 1) * limit}`);
                if (res.ok) {
                    const data = await res.json();
                    setInvoices(data.invoices);
                    setTotal(data.total);
                } else {
                    setInvoices([]);
                    setTotal(0);
                }
            } catch (err) {
                setInvoices([]);
                setTotal(0);
            }
        };
        fetchInvoices();
    }, [page]);

    const handleReset = () => {
        setSearch("");
        setSearchContact("");
        setSearchDate("");
    };

    // Modal state for viewing invoice details
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [viewInvoice, setViewInvoice] = useState(null);

    // Filtering logic for invoices
    const [searchContact, setSearchContact] = useState("");
    const [searchDate, setSearchDate] = useState("");
    const filteredInvoices = Array.isArray(invoices)
        ? invoices.filter((inv) => {
            let matches = true;
            if (search && !String(inv.invoiceNo || '').toLowerCase().includes(search.toLowerCase())) {
                matches = false;
            }
            if (searchContact && !String(inv.contact || '').toLowerCase().includes(searchContact.toLowerCase())) {
                matches = false;
            }
            if (searchDate && inv.createdAt) {
                const invDate = new Date(inv.createdAt);
                const searchDateObj = new Date(searchDate);
                // Compare only date part
                if (
                    invDate.getFullYear() !== searchDateObj.getFullYear() ||
                    invDate.getMonth() !== searchDateObj.getMonth() ||
                    invDate.getDate() !== searchDateObj.getDate()
                ) {
                    matches = false;
                }
            }
            return matches;
        })
        : [];


    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Filter Bar */}
            <div className="w-full max-w-7xl bg-white px-4 py-4 shadow flex flex-wrap gap-3 items-center justify-between border-b">
                <div className="flex flex-wrap gap-3 items-center flex-1">
                    <div className="relative">
                        <input
                            type="text"
                            className="px-3 py-2 border rounded bg-gray-100 focus:outline-none min-w-[200px]"
                            placeholder="Search by Invoice Number"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="relative">
                        <input
                            className="px-3 py-2 border rounded bg-gray-100 focus:outline-none"
                            type="date"
                            value={searchDate}
                            onChange={e => setSearchDate(e.target.value)}
                        />
                    </div>
                    <div className="relative">
                        <input
                            type="text"
                            className="px-3 py-2 border rounded bg-gray-100 focus:outline-none min-w-[200px]"
                            placeholder="Search by Mobile Number"
                            value={searchContact}
                            onChange={(e) => setSearchContact(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex gap-2 mt-3 md:mt-0">
                    <button
                        className="px-4 py-2 rounded bg-blue-500 text-white font-medium"
                        onClick={handleReset}
                    >
                        Reset Filters
                    </button>
                </div>
            </div>
            {/* Invoice Table */}
            <div className="flex-1 overflow-x-auto p-4">
                <table className="min-w-full bg-white rounded-lg shadow overflow-hidden text-sm">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="p-3 text-center">#</th>
                            <th className="p-3 text-left">Invoice Number</th>
                            <th className="p-3 text-left">Invoice Date</th>
                            <th className="p-3 text-center">View</th>
                            <th className="p-3 text-center">Delete</th>
                            {/* <th className="p-3 text-center">Print Invoice</th> */}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredInvoices.map((invoice, idx) => (
                            <tr
                                key={invoice._id || idx}
                                className="border-b hover:bg-blue-50 transition-colors"
                            >
                                <td className="p-3 text-center">{idx + 1}</td>
                                <td className="p-3 font-semibold">{invoice.invoiceNo || 'N/A'}</td>
                                <td className="p-3 font-mono text-xs">{invoice.createdAt ? new Date(invoice.createdAt).toLocaleString() : 'N/A'}</td>
                                <td className="p-3 text-center">
                                    <button className="underline text-blue-600" onClick={() => { setViewInvoice(invoice); setViewModalOpen(true); }}>View</button>
                                </td>
                                <td className="p-3 text-center flex gap-2 justify-center">
                                    <button
                                        className="p-2 rounded bg-red-500"
                                        title="Delete"
                                        onClick={() => {
                                            setDeleteTarget(invoice._id);
                                            setShowDeleteModal(true);
                                        }}
                                    >
                                        <Trash2 className="text-white" size={20} />
                                    </button>
                                </td>
                                {/* <td className="text-center">
                                    <button className="p-2 rounded bg-green-500">
                                        <Printer className="text-white" size={20} />
                                    </button>
                                </td> */}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {/* Pagination Controls */}
            <div className="flex justify-center items-center gap-4 mt-4">
                <button
                    className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50"
                    disabled={page === 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                    Prev
                </button>
                <span>
                    Page {page} of {Math.ceil(total / limit) || 1}
                </span>
                <button
                    className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50"
                    disabled={page >= Math.ceil(total / limit)}
                    onClick={() => setPage(p => p + 1)}
                >
                    Next
                </button>
            </div>

            {/* Invoice Details Modal */}
            {viewModalOpen && viewInvoice && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 ">
                    <div className="max-w-2xl mx-auto bg-white rounded-lg p-6 relative h-[90%] overflow-y-auto">
                        <button className="absolute top-2 right-2 text-xl font-bold" onClick={() => { setViewModalOpen(false); setViewInvoice(null); }}>×</button>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">Room Invoice Details</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="mb-2 border border-black rounded-md px-5 py-2"><div className="font-semibold text-gray-700">Invoice Number</div><div className="text-gray-600">{viewInvoice.invoiceNo || viewInvoice._id || '-'}</div></div>
                            <div className="mb-2 border border-black rounded-md px-5 py-2"><div className="font-semibold text-gray-700">Date</div><div className="text-gray-600">{viewInvoice.createdAt ? new Date(viewInvoice.createdAt).toLocaleDateString() : '-'}</div></div>
                            <div className="mb-2 border border-black rounded-md px-5 py-2"><div className="font-semibold text-gray-700">Room Number</div><div className="text-gray-600">{viewInvoice.roomNumber|| 'N/A'}</div></div>
                            <div className="mb-2 border border-black rounded-md px-5 py-2"><div className="font-semibold text-gray-700">Room Type</div><div className="text-gray-600">{viewInvoice.roomType|| 'N/A'}</div></div>
                            <div className="mb-2 border border-black rounded-md px-5 py-2"><div className="font-semibold text-gray-700">Plan Type</div><div className="text-gray-600">{viewInvoice.planType|| 'N/A'}</div></div>
                            <div className="mb-2 border border-black rounded-md px-5 py-2"><div className="font-semibold text-gray-700">Check In</div><div className="text-gray-600">{viewInvoice.checkIn|| 'N/A'}</div></div>
                            <div className="mb-2 border border-black rounded-md px-5 py-2"><div className="font-semibold text-gray-700">Check Out</div><div className="text-gray-600">{viewInvoice.checkOut|| 'N/A'}</div></div>
                            <div className="mb-2 border border-black rounded-md px-5 py-2"><div className="font-semibold text-gray-700">Total Days</div><div className="text-gray-600">{viewInvoice.totalDays|| 'N/A'}</div></div>
                            <div className="mb-2 border border-black rounded-md px-5 py-2"><div className="font-semibold text-gray-700">Room Price</div><div className="text-gray-600">{viewInvoice.roomPrice|| 'N/A'}</div></div>
                            <div className="mb-2 border border-black rounded-md px-5 py-2"><div className="font-semibold text-gray-700">CGST</div><div className="text-gray-600">{viewInvoice.cgstPercent ? `${viewInvoice.cgstPercent}%` : viewInvoice.cgstAmount ? `₹${viewInvoice.cgstAmount}` : 'N/A'}</div></div>
                            <div className="mb-2 border border-black rounded-md px-5 py-2"><div className="font-semibold text-gray-700">SGST</div><div className="text-gray-600">{viewInvoice.sgstPercent ? `${viewInvoice.sgstPercent}%` : viewInvoice.sgstAmount ? `₹${viewInvoice.sgstAmount}` : 'N/A'}</div></div>
                            <div className="mb-2 border border-black rounded-md px-5 py-2"><div className="font-semibold text-gray-700">Guest Name</div><div className="text-gray-600">{`${viewInvoice.guestFirst || ''} ${viewInvoice.guestMiddle || ''} ${viewInvoice.guestLast || ''}`.trim()|| 'N/A'}</div></div>
                            <div className="mb-2 border border-black rounded-md px-5 py-2"><div className="font-semibold text-gray-700">Email</div><div className="text-gray-600">{viewInvoice.email|| 'N/A'}</div></div>
                            <div className="mb-2 border border-black rounded-md px-5 py-2"><div className="font-semibold text-gray-700">Contact</div><div className="text-gray-600">{viewInvoice.contact|| 'N/A'}</div></div>
                            <div className="mb-2 border border-black rounded-md px-5 py-2"><div className="font-semibold text-gray-700">City</div><div className="text-gray-600">{viewInvoice.city|| 'N/A'}</div></div>
                            <div className="mb-2 border border-black rounded-md px-5 py-2"><div className="font-semibold text-gray-700">Pin Code</div><div className="text-gray-600">{viewInvoice.pin|| 'N/A'}</div></div>
                            <div className="mb-2 border border-black rounded-md px-5 py-2"><div className="font-semibold text-gray-700">State</div><div className="text-gray-600">{viewInvoice.state|| 'N/A'}</div></div>
                            <div className="mb-2 border border-black rounded-md px-5 py-2"><div className="font-semibold text-gray-700">Address</div><div className="text-gray-600">{viewInvoice.address|| 'N/A'}</div></div>
                            <div className="mb-2 border border-black rounded-md px-5 py-2"><div className="font-semibold text-gray-700">Company</div><div className="text-gray-600">{viewInvoice.company || 'N/A'}</div></div>
                            <div className="mb-2 border border-black rounded-md px-5 py-2"><div className="font-semibold text-gray-700">Company GST</div><div className="text-gray-600">{viewInvoice.companyGst || 'N/A'}</div></div>
                            <div className="mb-2 border border-black rounded-md px-5 py-2"><div className="font-semibold text-gray-700">Any Company</div><div className="text-gray-600">{viewInvoice.anyCompany || 'N/A'}</div></div>
                            <div className="mb-2 border border-black rounded-md px-5 py-2"><div className="font-semibold text-gray-700">Payment Mode</div><div className="text-gray-600">{viewInvoice.paymentMode || 'N/A'}</div></div>
                            <div className="mb-2 border border-black rounded-md px-5 py-2"><div className="font-semibold text-gray-700">Payment Status</div><div className="text-gray-600">{viewInvoice.paymentStatus || 'N/A'}</div></div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                    <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
                        <h2 className="text-lg font-semibold mb-4">Confirm Delete</h2>
                        <p className="mb-6">Are you sure you want to delete this invoice? This action cannot be undone.</p>
                        <div className="flex justify-end gap-3">
                            <button
                                className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 font-medium"
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setDeleteTarget(null);
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 font-medium"
                                onClick={async () => {
                                    if (!deleteTarget) return;
                                    try {
                                        const res = await fetch('/api/roomInvoice', {
                                            method: 'DELETE',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ id: deleteTarget })
                                        });
                                        const data = await res.json();
                                        if (res.ok) {
                                            setInvoices(prev => prev.filter(inv => inv._id !== deleteTarget));
                                            toast.success('Invoice deleted');
                                        } else {
                                            toast.error(data.error || 'Failed to delete invoice');
                                        }
                                    } catch {
                                        toast.error('Failed to delete invoice');
                                    }
                                    setShowDeleteModal(false);
                                    setDeleteTarget(null);
                                }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default RoomInvoiceLogs;