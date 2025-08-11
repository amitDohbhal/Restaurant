"use client";
import React, { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import {
  Search,
  Bell,
  UserCircle,
  Edit,
  Trash2,
  Eye,
  LayoutDashboard,
  ShoppingCart,
  Users,
  Settings,
  Store,
  X
} from "lucide-react";



function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}


const orderStatusOptions = ["Select Status", "Pending", "Processing", "Shipped", "Delivered", "Cancelled"];


const EnquiryOrder = () => {
  const [orders, setOrders] = useState([]);
  // console.log(orders)
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [viewOrder, setViewOrder] = useState(null); // For view modal
  const [statusUpdateOrder, setStatusUpdateOrder] = useState(null); // For status update modal
  const [statusMessage, setStatusMessage] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const rowsPerPage = 8;
  // console.log(orders)
  // Filtering logic
  const filteredOrders = orders.filter(order => {
    const customerName = `${order.firstName || ''} ${order.lastName || ''}`.trim().toLowerCase();
    const searchTerm = search.toLowerCase();

    // Check status filter
    const statusMatch = !statusFilter || order.status === statusFilter;

    // Check date filter
    let dateMatch = true;
    if (dateFilter) {
      const orderDate = new Date(order.createdAt || order.datePurchased || new Date());
      const filterDate = new Date(dateFilter);

      // Set time to start of day for comparison
      const orderDateStr = orderDate.toISOString().split('T')[0];
      const filterDateStr = filterDate.toISOString().split('T')[0];
      dateMatch = orderDateStr === filterDateStr;
    }

    // Check search term against various fields
    const searchMatch = !search ||
      (order.orderId && order.orderId.toLowerCase().includes(searchTerm)) ||
      (order._id && order._id.toLowerCase().includes(searchTerm)) ||
      customerName.includes(searchTerm) ||
      (order.email && order.email.toLowerCase().includes(searchTerm)) ||
      (order.phone && order.phone.toLowerCase().includes(searchTerm)) ||
      (order.products && order.products.some(p =>
        p.name && p.name.toLowerCase().includes(searchTerm)
      ));

    return statusMatch && searchMatch && dateMatch;
  });
  const paginatedOrders = filteredOrders.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  const totalPages = Math.ceil(filteredOrders.length / rowsPerPage);
  useEffect(() => {
    async function fetchOrders() {
      try {
        let res = await fetch("/api/orders/admin");
        const data = await res.json();
        if (data.success && Array.isArray(data.orders)) {
          setOrders(data.orders);
        } else {
          setOrders([]);
        }
      } catch (err) {
        setOrders([]);
      }
    }
    fetchOrders();
  }, []);
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Topbar */}
        <header className="h-16 bg-white border-b flex items-center justify-between px-4">
          <div className="flex items-center gap-3 w-full">
            <div className="relative w-fit">
              <input
                type="text"
                placeholder="Search orders, customers, products..."
                className="w-fit pl-10 pr-4 py-2 rounded bg-gray-100 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <Search className="absolute left-3 top-3 text-gray-400" size={16} />
            </div>
            <div className="flex flex-col md:flex-row gap-2 items-center justify-between px-4 py-3">
              <div className="flex gap-2 items-center">
                <label className="font-medium text-gray-600">Status:</label>
                <select
                  className="px-3 py-2 border rounded bg-gray-100 focus:outline-none"
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                >
                  <option value="">All</option>
                  {orderStatusOptions.slice(1).map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
              {/* Date filter placeholder (implement as needed) */}
              <div className="flex gap-2 items-center">
                <label className="font-medium text-gray-600">Date:</label>
                <input
                  type="date"
                  className="px-3 py-2 border rounded bg-gray-100 focus:outline-none"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                />
                {dateFilter && (
                  <button
                    onClick={() => setDateFilter('')}
                    className="text-gray-500 hover:text-gray-700"
                    title="Clear date filter"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              <div className="flex gap-2 mt-2 md:mt-0">
                <button
                  className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-400 font-medium"
                  onClick={() => {
                    setStatusFilter('');
                    setSearch('');
                    setDateFilter('');
                    setPage(1);
                  }}
                >
                  Reset Filters
                </button>
              </div>
            </div>
          </div>
        </header>
        {/* Filters */}
        {/* Table */}
        <div className="flex-1 overflow-x-auto p-4">
          <table className="min-w-full bg-white rounded-lg shadow overflow-hidden text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">S.No</th>
                <th className="p-3 text-left">Customer</th>
                <th className="p-3 text-left">Products</th>
                <th className="p-3 text-center">Qty</th>
                <th className="p-3 text-right">Total</th>
                <th className="p-3 text-center">Order Status</th>
                <th className="p-3 text-center">Order Date</th>
                {/* <th className="p-3 text-left">Delivery Address</th> */}
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedOrders.length === 0 && (
                <tr>
                  <td colSpan={10} className="text-center py-8 text-gray-400">No orders found.</td>
                </tr>
              )}
              {paginatedOrders.map((order, idx) => (
                <tr key={order._id || idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="p-3 font-mono text-blue-700">{idx + 1}</td>
                  <td className="p-3">{`${order.firstName || ''} ${order.lastName || ''}`.trim() || order.email || order.phone}</td>
                  <td className="p-3 flex flex-col gap-1 items-start">
                    {order.products && order.products.slice(0, 2).map((p, i) => (
                      <span key={i} className="flex items-center gap-1">
                        {p.image && p.image.url && <img src={p.image.url} alt={p.name} className="w-8 h-8 rounded object-cover border" />}
                        <span>{p.name}</span>
                      </span>
                    ))}
                    {order.products && order.products.length > 2 && (
                      <span className="text-xs text-gray-500 ml-2">+{order.products.length - 2} more</span>
                    )}
                  </td>
                  <td className="p-3 text-center">{order.products && order.products.reduce((sum, p) => sum + (Number(p.qty) || 0), 0)}</td>
                  <td className="p-3 text-right font-semibold">₹{order.cartTotal || order.subTotal || 0}</td>
                  {/* <td className="p-3 text-center">
                    <span
                      className={classNames(
                        "px-2.5 py-1 rounded text-xs font-semibold transition-all duration-150",
                        order.status === "Delivered"
                          ? "bg-green-100 text-green-700 border border-green-300"
                          : order.status === "Cancelled"
                            ? "bg-red-100 text-red-700 border border-red-300"
                            : order.status === "Processing"
                              ? "bg-blue-100 text-blue-700 border border-blue-300"
                              : order.status === "Shipped"
                                ? "bg-purple-100 text-purple-700 border border-purple-300"
                                : "bg-gray-100 text-gray-700 border border-gray-200"
                      )}
                      title={order.status}
                    >
                      {order.status || "Pending"}
                    </span>
                  </td> */}
                  <td className="p-3 text-center">
                    <div className="relative inline-block w-32">
                      <select
                        className={classNames(
                          "block w-full px-3 py-2 pr-8 rounded border text-xs font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200 appearance-none cursor-pointer transition-all duration-150",
                          order.status === "Delivered"
                            ? "bg-green-50 border-green-400 text-green-800"
                            : order.status === "Cancelled"
                              ? "bg-red-50 border-red-400 text-red-800"
                              : order.status === "Processing"
                                ? "bg-blue-50 border-blue-400 text-blue-800"
                                : order.status === "Shipped"
                                  ? "bg-purple-50 border-purple-400 text-purple-800"
                                  : "bg-gray-50 border-gray-300 text-gray-700"
                        )}
                        value={order.status || "Select"} // default to "Select" if no status
                        onChange={(e) => {
                          setSelectedStatus(e.target.value);
                          setStatusUpdateOrder(order);
                          setStatusMessage('');
                          setTrackingNumber('');
                          setTrackingUrl('');
                        }}
                      >
                        {/* <option value="Select" disabled>Select Status</option> */}
                        {orderStatusOptions
                          .map(status => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                      </select>

                      <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                        ▼
                      </span>
                    </div>
                  </td>
                  <td className="p-3 text-center">{order.datePurchased ? new Date(order.datePurchased).toLocaleString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}</td>
                  {/* <td className="p-3 max-w-xs truncate">{order.address}</td> */}
                  <td className="py-3 text-center flex gap-2 justify-center items-center">
                    <button className="py-2 rounded" title="View" onClick={() => setViewOrder(order)}><Eye className="" size={20} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="flex justify-between items-center px-4 pb-4">
          <span className="text-sm text-gray-600">
            Showing {(page - 1) * rowsPerPage + 1} - {Math.min(page * rowsPerPage, filteredOrders.length)} of {filteredOrders.length} orders
          </span>
          <div className="flex gap-1">
            <button
              className="px-3 py-1 rounded border bg-white disabled:opacity-50"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >Prev</button>
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                className={classNames(
                  "px-3 py-1 rounded border",
                  page === i + 1 ? "bg-blue-100 border-blue-500 text-blue-700" : "bg-white"
                )}
                onClick={() => setPage(i + 1)}
              >{i + 1}</button>
            ))}
            <button
              className="px-3 py-1 rounded border bg-white disabled:opacity-50"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >Next</button>
          </div>
        </div>
      </div>

      {/* Modal for status update */}
      {statusUpdateOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative animate-fade-in">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl font-bold"
              onClick={() => setStatusUpdateOrder(null)}
              title="Close"
            >
              &times;
            </button>
            <h2 className="text-xl font-bold mb-4 text-blue-700">Update Order Status</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Status
              </label>
              <div className="relative">
                <select
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  {orderStatusOptions
                    .filter(status => status !== "Select")
                    .map(status => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}

                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Update Message (Optional)
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                rows="3"
                placeholder="Add a message about this status update..."
                value={statusMessage}
                onChange={(e) => setStatusMessage(e.target.value)}
              />
            </div>

            {/* Tracking Information (only shown when status is Shipped) */}
            {selectedStatus === 'Shipped' && (
              <div className="space-y-4 mt-4 p-4 bg-gray-50 rounded-md border border-gray-200">
                <h3 className="font-medium text-gray-700">Shipping Information</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tracking Number *
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter tracking number"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tracking URL (Optional)
                  </label>
                  <input
                    type="url"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://example.com/tracking/123"
                    value={trackingUrl}
                    onChange={(e) => setTrackingUrl(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={() => setStatusUpdateOrder(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={async () => {
                  try {
                    const updateData = {
                      status: selectedStatus,
                      message: statusMessage || `Status updated to ${selectedStatus}`,
                      // Always include these fields to ensure they're updated
                      ...(selectedStatus === 'Shipped' && {
                        trackingNumber: trackingNumber || '',
                        trackingUrl: trackingUrl || ''
                      })
                    };
                    const res = await fetch(`/api/orders/${statusUpdateOrder._id}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(updateData)
                    });

                    const data = await res.json();
                    // console.log('Update response:', data);
                    if (!data.success) {
                      throw new Error(data.error || 'Update failed');
                    }

                    // Update local state
                    setOrders(orders => orders.map(o =>
                      o._id === statusUpdateOrder._id
                        ? {
                          ...o,
                          status: selectedStatus,
                          statusHistory: [
                            ...(o.statusHistory || []),
                            {
                              status: selectedStatus,
                              message: statusMessage || `Status updated to ${selectedStatus}`,
                              ...(selectedStatus === 'Shipped' && {
                                trackingNumber: trackingNumber,
                                trackingUrl: trackingUrl
                              }),
                              updatedAt: new Date().toISOString()
                            }
                          ]
                        }
                        : o
                    ));

                    toast.success('Order status updated!');
                    setStatusUpdateOrder(null);
                  } catch (err) {
                    console.error('Error updating status:', err);
                    toast.error('Failed to update order status: ' + err.message);
                  }
                }}
              >
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Modal for viewing order details */}
      {viewOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl my-8 relative animate-fade-in">
            <button
              className="absolute border bg-white p-2 rounded top-3 right-3 text-black border-black hover:text-gray-700 text-2xl font-bold"
              onClick={() => setViewOrder(null)}
              title="Close"
            >
              <X size={18} />
            </button>

            {/* Header */}
            <div className="bg-blue-50 px-6 py-4 rounded-t-lg border-b">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Order #{viewOrder.orderId}</h2>
                  <div className="flex items-center mt-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${viewOrder.status === 'Paid' ? 'bg-green-100 text-green-800' :
                      viewOrder.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                      {viewOrder.status}
                    </span>
                    <span className="mx-2 text-gray-400">•</span>
                    <span className="text-sm text-gray-600">
                      {new Date(viewOrder.datePurchased).toLocaleString('en-IN', {
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
                  <div className="text-sm text-gray-600">{viewOrder.paymentMethod === 'online' ? 'Payment Method' : 'Enquiry Type'}</div>
                  <div className="font-medium">
                    {viewOrder.paymentMethod === 'online' ? 'Online Payment' : 'Booking Enquiry'}
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
                    <div className="font-medium">{viewOrder.firstName} {viewOrder.lastName}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Email</div>
                    <div className="font-medium">{viewOrder.email}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Phone</div>
                    <div className="font-medium">{viewOrder.phone}</div>
                  </div>
                  {viewOrder.altPhone && (
                    <div>
                      <div className="text-sm text-gray-500">Alternate Phone</div>
                      <div className="font-medium">{viewOrder.altPhone}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Shipping Address */}
              <div className="md:col-span-1">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">Shipping Address</h3>
                <div className="space-y-2">
                  <div className="font-medium">{viewOrder.firstName} {viewOrder.lastName}</div>
                  <div className="text-gray-700">
                    {viewOrder.street && <div>{viewOrder.street}</div>}
                    <div>{viewOrder.city}, {viewOrder.district}</div>
                    <div>{viewOrder.state}, {viewOrder.pincode}</div>
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div className="md:col-span-1">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">Order Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span>₹{viewOrder.subTotal?.toLocaleString('en-IN') || '0.00'}</span>
                  </div>
                  {viewOrder.totalDiscount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount ({viewOrder.promoCode})</span>
                      <span>-₹{viewOrder.totalDiscount?.toLocaleString('en-IN') || '0.00'}</span>
                    </div>
                  )}
                  {/* {viewOrder.promoCode && (
                    <div className="flex justify-between text-blue-600">
                      <span>Promo Code ({viewOrder.promoCode})</span>
                      <span>-₹{viewOrder.promoDiscount?.toLocaleString('en-IN') || '0.00'}</span>
                    </div>
                  )} */}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax (CGST+SGST)</span>
                    <span>₹{viewOrder.totalTax?.toLocaleString('en-IN') || '0.00'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span>₹{viewOrder.shippingCost?.toLocaleString('en-IN') || '0.00'}</span>
                  </div>
                  <div className="border-t pt-2 mt-2 flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>₹{viewOrder.cartTotal?.toLocaleString('en-IN') || '0.00'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Products */}
            <div className="px-6 pb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">Order Items</h3>
              <div className="space-y-4">
                {viewOrder.products?.map((product, index) => (
                  <div key={index} className="flex items-start p-3 border rounded-lg hover:bg-gray-50">
                    <img
                      src={product.image || '/placeholder.jpeg'}
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

            {/* Order Status History */}
            <div className="px-6 pb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">Order Status History</h3>
              <div className="space-y-4">
                {(viewOrder.statusHistory || []).length > 0 ? (
                  [...(viewOrder.statusHistory || [])]
                    .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0))
                    .map((history, idx) => (
                      <div key={idx} className="flex items-start">
                        <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${history.status === 'Delivered' ? 'bg-green-500' :
                          history.status === 'Shipped' ? 'bg-blue-500' :
                            history.status === 'Processing' ? 'bg-yellow-500' :
                              history.status === 'Cancelled' ? 'bg-red-500' : 'bg-gray-300'
                          }`}></div>
                        <div className="ml-3 flex-1">
                          <div className="flex justify-between">
                            <span className="font-medium">{history.status}</span>
                            <span className="text-sm text-gray-500">
                              {new Date(history.updatedAt).toLocaleString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          {history.message && (
                            <p className="text-sm text-gray-600 mt-1">{history.message}</p>
                          )}
                          {history.trackingNumber && (
                            <div className="mt-2 text-sm">
                              <div className="font-medium">Tracking Information:</div>
                              <div className="mt-1">
                                <div>Tracking #: {history.trackingNumber}</div>
                                {history.trackingUrl && (
                                  <div>
                                    <a
                                      href={history.trackingUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:underline"
                                    >
                                      Track Package
                                    </a>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          {idx < (viewOrder.statusHistory?.length - 1) && (
                            <div className="h-4 border-l-2 border-dashed border-gray-200 ml-1 mt-2"></div>
                          )}
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="text-gray-500 text-center py-4">No status history available</div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 rounded-b-lg border-t flex justify-end gap-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Print Order
              </button>
              <button
                className="border text-black px-5 bg-white rounded"
                onClick={() => setViewOrder(null)}
                title="Close"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnquiryOrder;