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
    Eye,
    X,
} from "lucide-react";

import { useEffect } from "react";

const FoodInventoryLog = () => {
    // Pagination state
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 10;
    const [search, setSearch] = useState("");
    const [items, setItems] = useState([]);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [viewItem, setViewItem] = useState(null);

    useEffect(() => {
        const fetchInventory = async () => {
            try {
                const res = await fetch(`/api/foodInventory?limit=${limit}&skip=${(page - 1) * limit}`);
                if (res.ok) {
                    const data = await res.json();
                    const items = Array.isArray(data) ? data : (data.data || []);
                    setItems(items);
                    setTotal(data.total || items.length);
                } else {
                    setItems([]);
                    setTotal(0);
                }
            } catch (err) {
                setItems([]);
                setTotal(0);
            }
        };
        fetchInventory();
    }, [page]);

    const handleReset = () => {
        setSearch("");
    };

    // Filter logic for inventory items
    const filteredItems = Array.isArray(items)
        ? items.filter((item) => {
            let matches = true;
            if (search && !String(item.foodName || '').toLowerCase().includes(search.toLowerCase())) {
                matches = false;
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
                            placeholder="Search by Food Name"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
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
            {/* Food Inventory Table */}
            <div className="flex-1 overflow-x-auto p-4">
                <table className="min-w-full bg-white rounded-lg shadow overflow-hidden text-sm">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="p-3 text-center">#</th>
                            <th className="p-3 text-left">Food Name</th>
                            <th className="p-3 text-left">Category</th>
                            <th className="p-3 text-left">Category Type</th>
                            <th className="p-3 text-left">Qty Type</th>
                            <th className="p-3 text-left">Image</th>
                            <th className="p-3 text-center">View</th>
                            <th className="p-3 text-center">Delete</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredItems.map((item, idx) => (
                            <tr
                                key={item._id || idx}
                                className="border-b hover:bg-blue-50 transition-colors"
                            >
                                <td className="p-3 text-center">{idx + 1}</td>
                                <td className="p-3 font-semibold">{item.foodName || 'N/A'}</td>
                                <td className="p-3">{item.categoryName || 'N/A'}</td>
                                <td className="p-3">{item.categoryType || 'N/A'}</td>
                                <td className="p-3">{item.qtyType || 'N/A'}</td>
                                <td className="p-3">
                                    {item.image?.url ? (
                                        <img src={item.image.url} alt="Food" className="w-16 h-12 object-cover rounded" />
                                    ) : 'N/A'}
                                </td>
                                <td className="p-3 text-center">
                                    <button className="text-blue-600 cursor-pointer" onClick={() => { setViewItem(item); setViewModalOpen(true); }}><Eye /></button>
                                </td>
                                <td className="p-3 text-center flex gap-2 justify-center">
                                    <button
                                        className="p-2 rounded bg-red-500"
                                        title="Delete"
                                        onClick={() => {
                                            setDeleteTarget(item._id);
                                            setShowDeleteModal(true);
                                        }}
                                    >
                                        <Trash2 className="text-white" size={20} />
                                    </button>
                                </td>
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

            {/* Food Inventory Details Modal */}
            {viewModalOpen && viewItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                    <div className="max-w-3xl w-full bg-white rounded-lg p-6 relative flex flex-col md:flex-row gap-6 h-fit overflow-y-auto">
                        <button className="absolute top-2 right-2 text-xl font-bold" onClick={() => { setViewModalOpen(false); setViewItem(null); }}><X /></button>
                        {/* Left: Product Image */}
                        <div className="flex-shrink-0 flex flex-col items-center md:items-start w-full md:w-60">
                            <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden mb-4 border">
                                {viewItem.image?.url ? (
                                    <img src={viewItem.image.url} alt="Product" className="object-cover w-full h-full" />
                                ) : (
                                    <span className="text-gray-400">No Image</span>
                                )}
                            </div>
                            <span className="font-bold text-base text-center md:text-left">Product Image</span>
                        </div>
                        {/* Right: Product Details */}
                        <div className="flex-1 flex flex-col gap-3">
                            <div className="flex flex-row gap-2">
                                <span className="font-semibold">Food Name:</span> <span>{viewItem.foodName || '-'}</span>
                            </div>
                            <div className="flex flex-row gap-2">
                                <span className="font-semibold">Proudct Name:</span> <span>{viewItem.productTitle || '-'}</span>
                            </div>
                            <div className="flex flex-row gap-2">
                                <span className="font-semibold">Product Desciption:</span> <span>{viewItem.productDescription || '-'}</span>
                            </div>
                            <div className="border-t border-black" />
                            <div className="flex flex-col gap-2">
                                <div>
                                    <span className="font-semibold">Category Name:</span> <span>{viewItem.categoryName || '-'}</span>
                                </div>
                                <div>
                                    <span className="font-semibold">Category Type:</span> <span>{viewItem.categoryType || '-'}</span>
                                </div>

                            </div>
                            <div className="border-t border-black" />
                            <div>
                                <span className="font-semibold">Food Type Price:</span>
                                <table className="table-auto border-collapse border-black mt-2 ml-3">
                                    <tbody>
                                        {viewItem.halfPrice && (
                                            <tr>
                                                <td className="border border-black px-2 py-2 font-semibold">Half</td>
                                                <td className="border border-black px-2 py-2">₹{viewItem.halfPrice}</td>
                                            </tr>
                                        )}
                                        {viewItem.fullPrice && (
                                            <tr>
                                                <td className="border border-black px-2 py-2 font-semibold">Full</td>
                                                <td className="border border-black px-2 py-2">₹{viewItem.fullPrice}</td>
                                            </tr>
                                        )}
                                        {viewItem.quarterPrice && (
                                            <tr>
                                                <td className="border border-black px-2 py-2 font-semibold">Quarter</td>
                                                <td className="border border-black px-2 py-2">₹{viewItem.quarterPrice}</td>
                                            </tr>
                                        )}
                                        {viewItem.perPiecePrice && (
                                            <tr>
                                                <td className="border border-black px-2 py-2 font-semibold">Per Piece</td>
                                                <td className="border border-black px-2 py-2">₹{viewItem.perPiecePrice}</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="border-t my-2 flex flex-col gap-4">
                                <div className="border-t border-black">
                                    <span className="font-semibold">Qty Type:</span> <span>{viewItem.qtyType || '-'}</span>
                                </div>
                                <div className="border-t border-black">
                                    <span className="font-semibold">Tax CGST:</span> <span>{viewItem.cgstPercent ? `${viewItem.cgstPercent}%` : '-'} {viewItem.cgstAmount ? `(₹${viewItem.cgstAmount})` : ''}</span>
                                </div>
                                <div className="border-t border-black">
                                    <span className="font-semibold">Tax SGST:</span> <span>{viewItem.sgstPercent ? `${viewItem.sgstPercent}%` : '-'} {viewItem.sgstAmount ? `(₹${viewItem.sgstAmount})` : ''}</span>
                                </div>
                            </div>
                        </div>
                        <button className="absolute bottom-2 right-2 border px-2 py-1 border-black rounded-md text-md bg-red-500 text-white font-bold" onClick={() => { setViewModalOpen(false); setViewItem(null); }}>Close</button>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                    <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
                        <h2 className="text-lg font-semibold mb-4">Confirm Delete</h2>
                        <p className="mb-6">Are you sure you want to delete this food item? This action cannot be undone.</p>
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
                                        const res = await fetch('/api/foodInventory', {
                                            method: 'DELETE',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ id: deleteTarget })
                                        });
                                        const data = await res.json();
                                        if (res.ok) {
                                            setItems(prev => prev.filter(item => item._id !== deleteTarget));
                                            toast.success('Food item deleted');
                                        } else {
                                            toast.error(data.error || 'Failed to delete item');
                                        }
                                    } catch {
                                        toast.error('Failed to delete item');
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

export default FoodInventoryLog;