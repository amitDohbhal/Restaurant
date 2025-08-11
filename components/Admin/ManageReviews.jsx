"use client";
import React, { useState, useEffect } from "react";
import ReviewDetails from "./ReviewDetails";
import toast from "react-hot-toast";
import { Switch } from "../ui/switch";


const typeOptions = [
    { label: "All Types", value: "all" },
    { label: "Products", value: "product" },
    { label: "Management", value: "management" }
];

const columns = [
    "Date",
    "Title",
    "Name",
    "Type",
    "Rating",
    "Thumb",
    "Approved",
    "View",
];

function EyeIcon() {
    return (
        <svg width="20" height="20" fill="none" stroke="#222" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" /><path d="M2 12C4.5 7 12 7 12 7s7.5 0 10 5c-2.5 5-10 5-10 5s-7.5 0-10-5z" /></svg>
    );
}


const ManageReviews = () => {
    const [allReviews, setAllReviews] = useState([]);
    const [filteredReviews, setFilteredReviews] = useState([]);
    const [statusFilter, setStatusFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");
    const [selectedReview, setSelectedReview] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [reviewsPerPage] = useState(10);
    const [loading, setLoading] = useState(false);
    // console.log(allReviews)

    useEffect(() => {
        fetchReviews();
    }, []);

    useEffect(() => {
        filterReviews();
    }, [allReviews, statusFilter, typeFilter]);

    const fetchReviews = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/saveReviews');
            const data = await response.json();
            if (response.ok && data.success) {
                // Ensure all data is properly serialized
                const processedReviews = data.reviews.map(review => ({
                    ...review,
                    // Ensure all object IDs are strings
                    _id: review._id?.toString(),
                    packages: review.packages
                        ? typeof review.packages === 'object' && review.packages._id
                            ? {
                                _id: review.packages._id.toString(),
                                title: review.packages.title
                            }
                            : review.packages.toString()
                        : null,
                    artisan: review.artisan
                        ? typeof review.artisan === 'object' && review.artisan._id
                            ? {
                                _id: review.artisan._id.toString(),
                                name: review.artisan.name
                            }
                            : review.artisan.toString()
                        : null,
                    // Ensure thumb is properly formatted
                    thumb: review.thumb?.url ? {
                        url: review.thumb.url,
                        key: review.thumb.key || ''
                    } : null,
                    // Ensure dates are properly formatted
                    createdAt: review.createdAt ? new Date(review.createdAt).toISOString() : new Date().toISOString(),
                    updatedAt: review.updatedAt ? new Date(review.updatedAt).toISOString() : new Date().toISOString()
                }));

                setAllReviews(processedReviews);
                setFilteredReviews(processedReviews);
            } else {
                console.error('Failed to fetch reviews:', data.message);
            }
        } catch (error) {
            console.error('Error fetching reviews:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterReviews = () => {
        let filtered = [...allReviews];

        // Filter by status
        if (statusFilter === 'approved') {
            filtered = filtered.filter(review => review.approved && !review.deleted);
        } else if (statusFilter === 'disapproved') {
            filtered = filtered.filter(review => !review.approved && !review.deleted);
        } else {
            filtered = filtered.filter(review => !review.deleted);
        }

        // Filter by type
        if (typeFilter !== 'all') {
            filtered = filtered.filter(review => review.type === typeFilter);
        }
        setFilteredReviews(filtered);
    };

    const handleAction = async (id, action) => {
        try {
            let updates = { _id: id };

            // Determine the updates based on the action
            switch (action) {
                case 'active':
                    updates.deleted = false;
                    break;
                case 'inactive':
                    updates.deleted = true;
                    break;
                default:
                    throw new Error('Invalid action');
            }

            // Send the update
            const res = await fetch('/api/saveReviews', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });

            const data = await res.json();

            if (res.ok) {
                toast.success(data.message || 'Action completed successfully');
                fetchReviews();
            } else {
                throw new Error(data.message || 'Failed to perform action');
            }
        } catch (error) {
            console.error('Error performing action:', error);
            toast.error(error.message || 'An error occurred');
        }
    };

    const handleToggleApproved = async (review) => {
        try {
            const isApproving = !review.approved;
            const updates = {
                _id: review._id,
                approved: isApproving,
                // If approving, ensure the review is also active and not deleted
                ...(isApproving && {
                    deleted: false
                })
            };

            // Only create promotion when approving an artisan review
            if (isApproving && review.type === 'artisan' && review.artisan?._id) {
                updates.createPromotion = true;
            }

            const res = await fetch(`/api/saveReviews`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updates)
            });

            const data = await res.json();

            if (res.ok) {
                toast.success(data.message || `Review ${isApproving ? 'approved' : 'disapproved'} successfully`);
                if (isApproving && review.type === 'artisan') {
                    toast.success('Promotion created for this review');
                }
                fetchReviews();
            } else {
                throw new Error(data.message || `Failed to ${isApproving ? 'approve' : 'disapprove'} review`);
            }
        } catch (error) {
            console.error('Approval error:', error);
            toast.error(error.message || "Failed to update review status");
        }
    };
    // Pagination logic
    const indexOfLast = currentPage * reviewsPerPage;
    const indexOfFirst = indexOfLast - reviewsPerPage;
    const currentReviews = filteredReviews.slice(indexOfFirst, indexOfLast);
    const totalPages = Math.ceil(filteredReviews.length / reviewsPerPage);
    // console.log(currentReviews)
    return (
        <div className="w-full max-w-[1100px] mx-auto rounded-[14px] shadow-md px-4 py-6 md:py-8">
            {/* Filter Row */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-6">


                {/* New type filter */}
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        {typeOptions.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto bg-white rounded-xl">
                <table className="min-w-full border-separate border-spacing-0">
                    <thead>
                        <tr>
                            {columns.map((col) => (
                                <th key={col} className="py-3 px-4 border border-black  font-semibold text-left text-base">{col}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={columns.length} className="text-center py-6">Loading...</td>
                            </tr>
                        ) : currentReviews.length > 0 ? (
                            currentReviews.map((review) => (
                                <tr key={review._id} className="hover:bg-gray-100 transition">
                                    {/* Date */}
                                    <td className="align-middle min-w-[200px] px-5">{review.createdAt ? new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: 'numeric' }) : "-"}</td>
                                    {/* Title */}
                                    <td className="align-middle truncate max-w-[180px] px-5">{review.title || '-'}</td>
                                    {/* Name */}
                                    <td className="align-middle min-w-[120px] px-5">{review.name || '-'}</td>
                                    {/* Type */}
                                    <td className="align-middle px-5">{review.type || '-'}</td>
                                    {/* Rating */}
                                    <td className="align-middle px-5">{review.rating || '-'}</td>
                                    {/* Thumb */}
                                    <td className="align-middle px-5">
                                        {review.thumb && review.thumb.url ? (
                                            <img
                                                src={review.thumb.url}
                                                alt="thumb"
                                                className="w-10 h-10 object-cover rounded border shadow"
                                            />
                                        ) : '-'}
                                    </td>
                                    {/* Approved */}
                                    <td className="align-middle px-5">
                                        <Switch
                                            checked={!!review.approved}
                                            onCheckedChange={() => handleToggleApproved(review)}
                                            className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-gray-300"
                                        />
                                    </td>
                                    {/* View */}
                                    <td className="align-middle px-5">
                                        <button className="icon-btn hover:bg-gray-200 rounded p-1" onClick={() => setSelectedReview(review)}>
                                            <EyeIcon size={20} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={columns.length} className="text-center py-6">No reviews found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-start gap-2 mt-6">
                    <button
                        className="border px-4 py-1.5 rounded-full text-[15px] disabled:opacity-50"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    >
                        PREV
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => (
                        <button
                            key={i}
                            className={`border px-4 py-1.5 rounded-full text-[15px] ${currentPage === i + 1 ? "bg-black text-white" : "bg-white text-black"}`}
                            onClick={() => setCurrentPage(i + 1)}
                        >
                            {i + 1}
                        </button>
                    ))}
                    <button
                        className="border px-4 py-1.5 rounded-full text-[15px] disabled:opacity-50"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    >
                        NEXT
                    </button>
                </div>
            )}

            {/* Modal for review details */}
            {selectedReview && (
                <ReviewDetails
                    review={selectedReview}
                    onClose={() => setSelectedReview(null)}
                    onUpdate={fetchReviews}
                    onAction={handleAction}
                />
            )}

            {/* Styles (copied from ManageReviewLog for consistency) */}

        </div>
    );

};

export default ManageReviews;