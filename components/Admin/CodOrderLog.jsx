"use client";
import React, { useState, useEffect } from "react";
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import Link from "next/link";
import { Eye, Loader, MessagesSquare, X } from "lucide-react";

const statusOptions = [
  "Pending",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled"
];

const columns = [
  "Date",
  "Order ID",
  "Customer Name",
  "Amount",
  "Status",
  // "Chat",
  "View Order"
];


const CodOrderLog = () => {
  const OrderDetailsModal = ({ order, onClose }) => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-30 flex items-start justify-center z-50 p-4 overflow-y-auto">
        <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl my-8 relative animate-fade-in">
          <button
            className="absolute border bg-white p-2 rounded top-3 right-3 text-black border-black hover:text-gray-700 text-2xl font-bold"
            onClick={onClose}
            title="Close"
          >
            <X size={18} />
          </button>

          {/* Header */}
          <div className="bg-blue-50 px-6 py-4 rounded-t-lg border-b">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Order #{order.orderId}</h2>
                <div className="flex items-center mt-1">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${order.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                    order.status === 'Paid' ? 'bg-green-100 text-green-800' :
                      order.status === 'Processing' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'Shipped' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                    }`}>
                    {order.status}
                  </span>
                  <span className="mx-2 text-gray-400">•</span>
                  <span className="text-sm text-gray-600">
                    {new Date(order.datePurchased || order.createdAt).toLocaleString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
              <div className="text-right px-10">
                <div className="text-sm text-gray-600">Booking Method</div>
                <div className="font-medium">
                  {order.paymentMethod === 'booking_enquiry' ? 'Booking Enquiry' : ''}
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Customer Information */}
            <div className="md:col-span-1">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">Customer Information</h3>
              <div className="space-y-2">
                <div>
                  <div className="text-sm text-gray-500">Name</div>
                  <div className="font-medium">{order.firstName} {order.lastName}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Email</div>
                  <div className="font-medium">{order.email}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Phone</div>
                  <div className="font-medium">{order.phone}</div>
                </div>
                {order.altPhone && (
                  <div>
                    <div className="text-sm text-gray-500">Alternate Phone</div>
                    <div className="font-medium">{order.altPhone}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Shipping Address */}
            <div className="md:col-span-1">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">Shipping Address</h3>
              <div className="space-y-2">
                <div className="font-medium">{order.firstName} {order.lastName}</div>
                <div className="text-gray-700">
                  {order.street && <div>{order.street}</div>}
                  <div>{order.city}, {order.district || order.state}</div>
                  <div>{order.state}, {order.pincode}</div>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="md:col-span-1">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">Order Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>₹{order.subTotal?.toLocaleString('en-IN') || '0.00'}</span>
                </div>
                {order.totalDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount ({order.promoCode || 'Coupon'})</span>
                    <span>-₹{order.totalDiscount?.toLocaleString('en-IN') || '0.00'}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax (CGST+SGST)</span>
                  <span>₹{order.totalTax?.toLocaleString('en-IN') || '0.00'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span>₹{order.shippingCost?.toLocaleString('en-IN') || '0.00'}</span>
                </div>
                <div className="border-t pt-2 mt-2 flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>₹{order.cartTotal?.toLocaleString('en-IN') || '0.00'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Products */}
          <div className="px-6 pb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">Order Items</h3>
            <div className="space-y-4">
              {order.products?.map((product, index) => (
                <div key={index} className="flex items-start p-3 border rounded-lg hover:bg-gray-50">
                  <img
                    src={typeof product.image === 'string' ? product.image : product.image?.url || '/placeholder.jpeg'}
                    alt={product.name}
                    className="w-20 h-20 object-cover rounded border mr-4"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/placeholder.jpeg';
                    }}
                  />
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <h4 className="font-medium text-gray-900">{product.name}</h4>
                      <span className="font-semibold">₹{product.price?.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="text-md text-gray-800 mt-1">
                      <span>Qty: {product.qty || 1}</span>
                      {product.size && <span className="mx-2">•</span>}
                      {product.size && <span>Size: {product.size}</span>}
                      {product.color && <span className="mx-2">•</span>}
                      {product.color && (
                        <span className="inline-flex items-center">
                          Color: <span className="w-5 h-5 rounded-full border border-gray-300 ml-1 inline-block" style={{ backgroundColor: product.color }}></span>
                        </span>
                      )}
                    </div>
                    {product.originalPrice > product.price && (
                      <div className="text-sm text-gray-800 line-through mt-1">
                        ₹{product.originalPrice?.toLocaleString('en-IN')}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t pt-4 p-6">
            <div className="flex justify-end space-x-4">
              <div className="text-right space-y-2">
                <p><span className="font-medium">Subtotal:</span> ₹{order.subTotal?.toFixed(2)}</p>
                {order.totalDiscount > 0 && (
                  <p><span className="font-medium">Discount:</span> -₹{order.totalDiscount?.toFixed(2)}</p>
                )}
                <p><span className="font-medium">Total:</span> ₹{order.cartTotal?.toFixed(2)}</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-6 py-4 rounded-b-lg border-t flex justify-end gap-2">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Print Order
            </button>
            <button
              className="border text-black px-5 bg-white rounded"
              onClick={onClose}
              title="Close"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };
  const [viewOrder, setViewOrder] = useState(null);
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 10,
    hasNextPage: false,
    hasPreviousPage: false
  });
  const [filters, setFilters] = useState({
    orderId: '',
    startDate: '',
    endDate: ''
  });
// console.log(orders)
  // Apply filters
  useEffect(() => {
    let result = [...orders];

    if (filters.orderId) {
      result = result.filter(order =>
        order.orderId.toLowerCase().includes(filters.orderId.toLowerCase())
      );
    }

    if (filters.startDate) {
      const start = new Date(filters.startDate);
      result = result.filter(order => new Date(order.createdAt) >= start);
    }

    if (filters.endDate) {
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999); // End of the day
      result = result.filter(order => new Date(order.createdAt) <= end);
    }

    setFilteredOrders(result);
  }, [filters, orders]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetFilters = () => {
    setFilters({
      orderId: '',
      startDate: '',
      endDate: ''
    });
  };

  const fetchOrders = async (page = 1) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/orders/admin?type=booking_enquiry&page=${page}&limit=${pagination.limit}`);
      const data = await response.json();

      if (data.success) {
        setOrders(data.orders);
        setFilteredOrders(data.orders);
        setPagination({
          ...pagination,
          currentPage: data.pagination.currentPage,
          totalPages: data.pagination.totalPages,
          totalItems: data.pagination.total,
          hasNextPage: data.pagination.hasNextPage,
          hasPreviousPage: data.pagination.hasPreviousPage
        });
      } else {
        throw new Error(data.error || 'Failed to fetch orders');
      }
    } catch (error) {
      console.error('Error fetching Booking orders:', error);
      toast.error('Failed to load Booking orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchOrders(newPage);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f6f1] p-6 flex items-start justify-center">
        <div className="text-lg flex items-center gap-2"><Loader className="animate-spin text-gray-600" /><span>
          Loading Booking Enquiry orders...
        </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f6f1] p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h1 className="text-2xl font-bold">Booking Enquiry Orders</h1>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="flex-1">
              <input
                type="text"
                name="orderId"
                placeholder="Search by Order ID"
                value={filters.orderId}
                onChange={handleFilterChange}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-2">
              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                className="p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span className="flex items-center">to</span>
              <input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                className="p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {(filters.orderId || filters.startDate || filters.endDate) && (
                <button
                  onClick={resetFilters}
                  className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-sm"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-gray-100">
                {columns.map((col) => (
                  <th key={col} className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">
                      {format(new Date(order.createdAt), 'dd MMM yyyy, hh:mm a')}
                    </td>
                    <td className="px-4 py-3 text-sm">{order.orderId}</td>
                    <td className="px-4 py-3 text-sm">
                      <div>
                        <p className="font-medium">{order.firstName} {order.lastName}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">₹{order.cartTotal?.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      {order.status || 'Pending'}
                    </td>
                    {/* <td className="px-4 py-3">
                      <Link
                        href={{
                          pathname: '/admin/chat',
                          query: {
                            userId: order.userId,  // The ID of the user who placed the order
                            orderId: order._id,    // The order ID
                            orderNumber: order.orderId // Human-readable order number
                          }
                        }}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <MessagesSquare />
                      </Link>
                    </td> */}
                    <td className="px-6 py-3">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="text-gray-600 hover:text-gray-900"
                        title="View Details"
                      >
                        <Eye />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-6 text-center text-gray-500">
                    {orders.length === 0 ? 'No Booking Enquiry orders found' : 'No orders match your filters'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex flex-col items-center justify-center gap-4 mt-6">
            <span className="text-lg font-semibold">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <div className="flex gap-2">
              {pagination.currentPage > 1 && (
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                >
                  Previous
                </button>
              )}
              {pagination.currentPage < pagination.totalPages && (
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {
        selectedOrder && (
          <OrderDetailsModal
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
          />
        )
      }
    </div >
  );
};

export default CodOrderLog;