"use client"
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye } from "lucide-react";

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
    });
}

/**
 * AllOrders component
 * @param {Object} props
 * @param {Array} props.orders - Array of orders to display
 * @param {function} props.onViewOrder - Called with order object when 'View' is clicked
 * @param {boolean} props.loading - Loading state
 * @param {string} props.error - Error message if any
 */

function OrderDetailModal({ order, onClose }) {
    if (!order) return null;

    return (
        <div className="relative bg-white rounded-lg shadow-xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 md:p-6 ">
                <div className="flex justify-between items-start mb-4">
                    <h2 className="text-2xl font-bold">Order Details</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <h3 className="font-semibold text-gray-700 mb-2">Order Information</h3>
                        <div className="space-y-1 text-sm">
                            <p><span className="text-gray-500">Order #:</span> {order.orderNumber}</p>
                            <p><span className="text-gray-500">Status:</span>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${order.status === 'completed'
                                    ? 'bg-green-100 text-green-800'
                                    : order.status === 'cancelled'
                                        ? 'bg-red-100 text-red-800'
                                        : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                    {order.status || 'pending'}
                                </span>
                            </p>
                            <p><span className="text-gray-500">Order Type:</span> {order.orderType?.replace('-', ' ')}</p>
                            <p><span className="text-gray-500">Placed At:</span> {new Date(order.createdAt).toLocaleString()}</p>
                            {order.completedAt && (
                                <p><span className="text-gray-500">Completed At:</span> {new Date(order.completedAt).toLocaleString()}</p>
                            )}
                        </div>
                    </div>

                    <div>
                        <h3 className="font-semibold text-gray-700 mb-2">Customer Details</h3>
                        <div className="space-y-1 text-sm">
                            <p><span className="text-gray-500">Name:</span> {order.customer?.name || 'N/A'}</p>
                            <p><span className="text-gray-500">Room:</span> {order.customer?.roomNumber || 'N/A'}</p>
                            <p><span className="text-gray-500">Phone:</span> {order.customer?.phone || 'N/A'}</p>
                            <p><span className="text-gray-500">Email:</span> {order.customer?.email || 'N/A'}</p>
                        </div>
                    </div>
                </div>

                <div className="mb-6">
                    <h3 className="font-semibold text-gray-700 mb-3">Order Items</h3>
                    <div className="overflow-hidden border border-gray-200 rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {order.items?.map((item, index) => (
                                    <tr key={index}>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {item.name}
                                            <div className="text-xs text-gray-500">
                                                {item.cgst > 0 && `CGST ${item.cgst}%, `}
                                                {item.sgst > 0 && `SGST ${item.sgst}%`}
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 whitespace-nowrap text-sm text-black text-right">
                                            {item.quantity}
                                        </td>
                                        <td className="px-5 py-3 whitespace-nowrap text-sm text-black text-right">
                                            ₹{item.price?.toFixed(2) || '0.00'}
                                        </td>
                                        <td className="px-5 py-3 whitespace-nowrap text-sm text-black text-right">
                                            ₹{item.total?.toFixed(2) || '0.00'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-gray-50">
                                <tr>
                                    <td colSpan="3" className="px-5 py-3 text-sm font-medium text-gray-700 text-right">Subtotal:</td>
                                    <td className="px-5 py-3 text-sm text-gray-700 text-right">₹{order.subtotal?.toFixed(2) || '0.00'}</td>
                                </tr>
                                {order.tax > 0 && (
                                    <tr>
                                        <td colSpan="3" className="px-5 py-1 text-sm font-medium text-gray-700 text-right">Tax:</td>
                                        <td className="px-4 py-1 text-sm text-black text-right">₹{order.tax?.toFixed(2) || '0.00'}</td>
                                    </tr>
                                )}
                                <tr className="border-t border-gray-200">
                                    <td colSpan="3" className="px-4 py-3 text-base font-bold text-black text-right">Total:</td>
                                    <td className="px-4 py-3 text-base font-bold text-black text-right">₹{order.total?.toFixed(2) || '0.00'}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

const AllOrders = ({ orders = [], loading = false, error = null }) => {
    const router = useRouter();
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showOrderDetail, setShowOrderDetail] = useState(false);

    const handleViewOrder = (order) => {
        setSelectedOrder(order);
        setShowOrderDetail(true);
    };

    const handleCloseOrderDetail = () => {
        setShowOrderDetail(false);
        setSelectedOrder(null);
    };

    if (loading) {
        return <div className="p-4 text-center">Loading orders...</div>;
    }

    if (error) {
        return <div className="p-4 text-red-500">Error: {error}</div>;
    }

    if (!Array.isArray(orders) || orders.length === 0) {
        return <div className="p-4 text-center">No orders found</div>;
    }

    return (
        <>
            {/* Desktop Cards */}
            <div className="hidden sm:block flex-col">
                <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                        <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                                            Order #
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                                            Time
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                                            Orders
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                                            Items
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                                            Total
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-black uppercase tracking-wider">
                                            Action
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {orders.map((order) => (
                                        <tr key={order._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-black">
                                                {order.orderNumber}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                                                {new Date(order.createdAt).toLocaleTimeString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-wrap w-64">
                                                    {order.items.map(item => `${item.quantity}x ${item.name}`).join(', ')}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-black">{order.items?.length || 0} items</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                                                ₹{order.total?.toFixed(2) || '0.00'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-4 py-1 inline-flex text-xs leading-5 font-semibold rounded border border-black ${order.status === 'completed'
                                                    ? 'bg-green-100 text-green-800'
                                                    : order.status === 'cancelled' || order.status === 'refunded'
                                                        ? 'bg-red-100 text-red-800'
                                                        : order.status === 'pending' || order.status === 'pending_payment'
                                                            ? 'bg-yellow-400 text-yellow-800'
                                                            : order.status === 'preparing'
                                                                ? 'bg-blue-100 text-blue-800'
                                                                : order.status === 'ready'
                                                                    ? 'bg-purple-100 text-purple-800'
                                                                    : order.status === 'served'
                                                                        ? 'bg-indigo-100 text-indigo-800'
                                                                        : order.status === 'confirmed'
                                                                            ? 'bg-green-400 text-green-800'
                                                                            : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {order.status.replace('_', ' ') || 'pending'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-5 flex items-center justify-center">
                                                <button
                                                    onClick={() => handleViewOrder(order)}
                                                    className="text-blue-600 hover:text-blue-900"
                                                >
                                                    <Eye  size={30}/>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
            {/* Mobile Cards */}
            <div className="block sm:hidden space-y-4">
                {orders.map(order => (
                    <div
                        key={order._id}
                        className="p-4 border rounded-xl shadow-md bg-white"
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-lg font-semibold text-gray-900">
                                #{order.orderNumber}
                            </h3>
                            <span className="text-xs text-gray-500">
                                {new Date(order.createdAt).toLocaleString()}
                            </span>
                        </div>

                        {/* Order details */}
                        <div className="space-y-2 text-sm text-gray-700">
                            <p>
                                <span className="font-medium text-gray-500 text-wrap w-64">Items:</span>{" "}
                                {order.items.map(i => `${i.quantity}x ${i.name}`).join(", ")}
                            </p>
                            <p>
                                <span className="font-medium text-gray-500">Total:</span>{" "}
                                <span className="font-semibold text-black">
                                    ₹{order.total?.toFixed(2)}
                                </span>
                            </p>
                            <p className="flex items-center gap-2">
                                <span className="font-medium text-gray-500">Status:</span>
                                <span
                                    className={`px-3 py-1 text-xs font-semibold rounded-full border ${order.status === "completed"
                                        ? "bg-green-100 text-green-800 border-green-300"
                                        : order.status === "cancelled" || order.status === "refunded"
                                            ? "bg-red-100 text-red-800 border-red-300"
                                            : order.status === "pending" || order.status === "pending_payment"
                                                ? "bg-yellow-100 text-yellow-800 border-yellow-300"
                                                : order.status === "preparing"
                                                    ? "bg-blue-100 text-blue-800 border-blue-300"
                                                    : order.status === "ready"
                                                        ? "bg-purple-100 text-purple-800 border-purple-300"
                                                        : order.status === "served"
                                                            ? "bg-indigo-100 text-indigo-800 border-indigo-300"
                                                            : order.status === "confirmed"
                                                                ? "bg-green-200 text-green-900 border-green-400"
                                                                : "bg-gray-100 text-gray-800 border-gray-300"
                                        }`}
                                >
                                    {order.status.replace("_", " ") || "pending"}
                                </span>
                            </p>
                        </div>

                        {/* Action */}
                        <button
                            onClick={() => handleViewOrder(order)}
                            className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-blue-700 transition"
                        >
                            <Eye className="w-6 h-6" />
                            View Order
                        </button>
                    </div>
                ))}
            </div>


            {/* Order Detail Modal */}
            {showOrderDetail && selectedOrder && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div
                            className="fixed inset-0 transition-opacity"
                            aria-hidden="true"
                            onClick={handleCloseOrderDetail}
                        >
                            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                        </div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
                            <OrderDetailModal
                                order={selectedOrder}
                                onClose={handleCloseOrderDetail}
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export { OrderDetailModal };
export default AllOrders;