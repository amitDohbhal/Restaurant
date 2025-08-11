"use client"
import React, { useState, useEffect } from "react";
import ReturnRequest from "./ReturnRequest";
import CancelOrder from "./CancelOrder";
import { Clock, CheckCircle, Truck, XCircle, Info, ArrowLeft } from 'lucide-react';
const getStatusBadge = (status) => {
  const statusMap = {
    'Paid': { bg: 'bg-green-100 text-green-800', icon: <CheckCircle size={18} className="mr-1" /> },
    'Pending': { bg: 'bg-yellow-100 text-yellow-800', icon: <Clock size={18} className="mr-1" /> },
    'Processing': { bg: 'bg-blue-100 text-blue-800', icon: <Info size={18} className="mr-1" /> },
    'Shipped': { bg: 'bg-indigo-100 text-indigo-800', icon: <Truck size={18} className="mr-1" /> },
    'Delivered': { bg: 'bg-green-100 text-green-800', icon: <CheckCircle size={18} className="mr-1" /> },
    'Cancelled': { bg: 'bg-red-100 text-red-800', icon: <XCircle size={18} className="mr-1" /> },
    'default': { bg: 'bg-gray-100 text-gray-800', icon: <Info size={18} className="mr-1" /> }
  };
  return statusMap[status] || statusMap['default'];
};
// import './globals.css'
const tabList = [
  { key: "history", label: "Order History" },
  { key: "items", label: "Item Details" },
  // { key: "courier", label: "Courier" },
  // { key: "receiver", label: "Receiver" },
];

const OrderDetail = ({ order, onBack }) => {
  const [activeTab, setActiveTab] = useState("history");
  const [showCancelRequest, setShowCancelRequest] = useState(false);
  const [showTrackingInfo, setShowTrackingInfo] = useState(false);
  const [showMessage, setShowMessage] = useState(null);
  const [showReturnRequest, setShowReturnRequest] = useState(false);
  const [showCancelOrder, setShowCancelOrder] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [ordersData, setOrdersData] = useState(order);
  const [isCancelling, setIsCancelling] = useState(false);
  const [hasRequestedCancel, setHasRequestedCancel] = useState(false);
  // Debug function to check modal state
  // useEffect(() => {
  //   console.log('Modal state - showCancelOrder:', showCancelOrder);
  // }, [showCancelOrder]);

  if (!order) {
    return (
      <div className="text-center text-red-500 mt-10">
        No order data found. Please access this page from your order list or dashboard.
      </div>
    );
  }
  // console.log(order)
  const orderData = order;
  const isShipped = orderData.status === 'Shipped' || orderData.status === 'Delivered';
  const hasTracking = orderData.trackingNumber && orderData.trackingUrl;

  const isCancellable = true; // Temporarily force to true for testing


  const hasPendingCancellation = orderData.statusHistory?.some(
    status => status.status.toLowerCase() === 'cancellation requested'
  );
  useEffect(() => {
    const checkCancellation = async () => {
      try {
        const response = await fetch(`/api/checkCancelRequest?orderId=${orderData._id}`);
        const data = await response.json();
        if (data.hasRequest) {
          setHasRequestedCancel(true);
        }
      } catch (error) {
        console.error('Error checking cancellation:', error);
      }
    };

    if (orderData?._id) {
      checkCancellation();
    }
  }, [orderData?._id]);
  return (
    <>
      {onBack && (
        <button
          onClick={onBack}
          className="px-4 py-1 bg-gray-200 hover:bg-gray-300 rounded text-md font-medium"
        >
          ← Back to Order Details
        </button>
      )}

      <div className="bg-white rounded-2xl shadow p-8 max-w-4xl mx-auto mt-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="flex flex-col items-center">
            {(orderData.product?.image || (orderData.products && orderData.products[0]?.image)) ? (
              <img
                src={orderData.product?.image || (orderData.products && orderData.products[0]?.image)}
                alt="product"
                className="w-24 h-24 rounded-lg border mb-2"
              />
            ) : null}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              {/* <span className={`px-2 py-1 rounded text-xs font-bold ${getStatusColor(orderData.status)}`}>{orderData.status}</span> */}
              <span className="text-lg font-bold">Order #{orderData.orderId || orderData.transactionId || orderData._id}</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-2 gap-4 text-md text-black mb-4">
              <div>
                <div className="text-xs text-black pb-2">Item</div>
                <div className="font-semibold text-md">{orderData.product?.name || (orderData.products && orderData.products[0]?.name) || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-black pb-2">Price</div>
                <div className="font-semibold text-md">₹{orderData.product?.price || (orderData.products && orderData.products[0]?.price) || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-black pb-2">Quantity</div>
                <div className="font-semibold text-md">{orderData.product?.qty || (orderData.products && orderData.products[0]?.qty) || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-black pb-2">Size</div>
                <div className="font-semibold text-md">{orderData.product?.size || (orderData.products && orderData.products[0]?.size) || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-black pb-2">Color</div>
                <div
                  className="font-semibold w-6 h-6 border-2 border-black rounded-full flex items-center justify-center"
                  style={{ backgroundColor: orderData.product?.color || (orderData.products?.[0]?.color) || '#ccc' }}
                ></div>
              </div>

            </div>

            <div className="flex gap-3 mb-2 flex-wrap">



              {/* Replace your button rendering logic with this */}
              {orderData.status !== 'Shipped' &&
                orderData.status !== 'Delivered' &&
                !orderData.statusHistory?.some(status => status.status.toLowerCase() === 'cancelled') ? (
                hasRequestedCancel ? (
                  <button
                    disabled
                    className="border border-yellow-400 text-yellow-600 px-5 py-2 rounded-lg font-semibold flex items-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Cancellation Requested
                  </button>
                ) : (
                  <button
                    onClick={() => setShowCancelOrder(true)}
                    className="border border-red-400 text-red-600 px-5 py-2 rounded-lg font-semibold hover:bg-red-50 transition flex items-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Cancel Order
                  </button>
                )
              ) : orderData.statusHistory?.some(status => status.status.toLowerCase() === 'cancelled') ? (
                <button
                  disabled
                  className="border border-gray-300 text-gray-500 px-5 py-2 rounded-lg font-semibold cursor-not-allowed flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Order Cancelled
                </button>
              ) : null}

              {orderData.statusHistory?.some(status => status.status === 'Delivered') && (
                <button
                  className="border border-green-600 text-green-700 px-5 py-2 rounded-lg font-semibold hover:bg-green-50 transition flex items-center gap-2"
                  onClick={() => {
                    if (typeof window !== 'undefined' && window.handleReturnOrder) {
                      window.handleReturnOrder(orderData);
                    } else if (onBack) {
                      // If not in dashboard, navigate directly
                      window.location.href = `/dashboard?section=return&orderId=${orderData._id}`;
                    }
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 01-1.555.832L10 14.202l-4.445 2.63A1 1 0 014 16V4z" clipRule="evenodd" />
                  </svg>
                  Request Return
                </button>
              )}
            </div>
          </div>
        </div>

        <hr className="my-6" />
        {/* Tabs */}
        <div className="flex gap-7 border-b">
          {tabList.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-2 text-[15px] font-semibold transition border-b-2 ${activeTab === tab.key ? "border-pink-500 text-pink-600" : "border-transparent text-gray-600"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {/* Tab Content */}
        {activeTab === "history" && (
          <div className="mt-6">
            {orderData.statusHistory?.length > 0 ? (
              <ol className="relative border-l-2 border-gray-200 ml-8 pl-5 space-y-6">
                {[...orderData.statusHistory]
                  .sort((a, b) => {
                    const statusOrder = {
                      'Pending': 1,
                      'Processing': 2,
                      'Shipped': 3,
                      'Delivered': 4,
                      'Cancelled': 5
                    };
                    return statusOrder[a.status] - statusOrder[b.status] ||
                      new Date(a.updatedAt) - new Date(b.updatedAt);
                  })
                  .map((status, idx) => {
                    const badge = getStatusBadge(status.status);
                    return (
                      <li key={idx} className="relative pb-6">
                        {/* Timeline Circle with dynamic color */}
                        <span className={`absolute -left-[30px] top-1 w-5 h-5 rounded-full border-2 flex items-center justify-center ${badge.bg.replace('bg-', 'border-')} border-opacity-50`}>
                          <span className="w-3 h-3 rounded-full block" style={{ backgroundColor: badge.bg.split('-')[1] === 'red' ? '#DC2626' : badge.bg.split('-')[1] === 'green' ? '#059669' : badge.bg.split('-')[1] === 'blue' ? '#2563EB' : '#4B5563' }} />
                        </span>

                        <div className="flex flex-col">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              {badge.icon}
                              <h3 className="font-bold text-md text-black">{status.status}</h3>
                            </div>
                            <span className="text-xs text-gray-500">
                              {new Date(status.updatedAt).toLocaleString()}
                            </span>
                          </div>

                          {status.message && (
                            <>
                              <button
                                onClick={() => setShowMessage(showMessage === idx ? null : idx)}
                                className="text-sm text-blue-600 hover:underline mt-1 text-left"
                              >
                                {showMessage === idx ? 'Hide Details' : 'View Details'}
                              </button>

                              {showMessage === idx && (
                                <div className="mt-2 p-3 bg-gray-50 rounded-md text-sm">
                                  {status.message}
                                  {status.status === 'Shipped' && status.trackingNumber && (
                                    <div className="mt-3 bg-green-50 rounded-md p-2">
                                      <div className="flex items-center gap-2 text-md font-medium">
                                        <span>Tracking Number:</span>
                                        <span className="font-mono bg-white px-2 rounded border">
                                          {status.trackingNumber}
                                        </span>
                                        {status.trackingUrl && (
                                          <a
                                            href={status.trackingUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center text-blue-600 hover:underline"
                                          >
                                            Track Your Package
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                            </svg>
                                          </a>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </li>
                    );
                  })}
              </ol>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No status history available for this order.
              </div>
            )}
          </div>
        )}
        {activeTab === "items" && (
          <div className="mt-6 text-gray-800 text-[15px] space-y-6 bg-[#fefaf6] p-2 md:p-6 rounded-xl">
            <h2 className="text-lg font-bold mb-2">Item Details</h2>
            {/* Product Card */}
            {orderData.products.map((product, index) => (
              <div key={index} className="flex flex-col md:flex-row gap-2 items-start justify-between border bg-gray-100 rounded p-2">
                <div className="flex items-center gap-2">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-24 h-24 object-cover rounded-lg border"
                  />
                  <div>
                    <h3 className="font-semibold text-lg">{product.name}</h3>
                    <p className="text-gray-700"><span className="font-medium">Price :</span> ₹{product.price}</p>
                    <p className="text-gray-700"><span className="font-medium">Size :</span> {product.size || "N/A"}</p>
                    <div className="text-gray-700 flex items-center gap-2">
                      <span className="font-medium">Color :</span>
                      <span
                        className="inline-block w-6 h-6 border-2 border-black rounded-full"
                        style={{ backgroundColor: product.color || '#ccc' }}
                        title={product.color || 'N/A'}
                      ></span>
                    </div>
                    <p className="text-gray-700"> Quantity :<span className="font-medium"> {product.qty}</span></p>
                  </div>
                </div>
                {/* Payment & Order Info */}
                <div className="">
                  <div className="rounded-lg">
                    <h3 className="font-semibold mb-2">Payment Information</h3>
                    <div className="space-y-1 text-sm">
                      <p><span className="text-gray-600">Payment Method:</span> {orderData.paymentMethod || orderData.payment || 'N/A'}</p>
                      <p><span className="text-gray-600">Payment Status:</span> <span className={`px-2 py-0.5 rounded text-xs ${orderData.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>{orderData.status}</span></p>
                      {orderData.transactionId && (
                        <p className="truncate"><span className="text-gray-600">Transaction ID:</span> {orderData.transactionId}</p>
                      )}
                      {orderData.razorpayOrderId && (
                        <p className="truncate"><span className="text-gray-600">Razorpay Order ID:</span> {orderData.razorpayOrderId}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Divider */}
            <hr className="my-6 border-gray-300" />
            <div className="p-4 rounded-lg">
              <h3 className="font-semibold mb-3 text-md">Order Summary</h3>
              <div className="space-y-2 text-[15px]">
                <div className="flex justify-between">
                  <span>Subtotal ({orderData.products?.reduce((sum, item) => sum + item.qty, 0)} items):</span>
                  <span>₹{orderData.subTotal?.toFixed(2)}</span>
                </div>
                {orderData.totalDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount ({orderData.promoCode}):</span>
                    <span>-₹{orderData.totalDiscount?.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Tax (GST):</span>
                  <span>₹{orderData.totalTax?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t pt-2 mt-2">
                  <span className="font-medium">Shipping:</span>
                  <span>{orderData.shippingCost ? `₹${orderData.shippingCost.toFixed(2)}` : 'Free'}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg pt-2 border-t mt-2">
                  <span>Total Amount:</span>
                  <span>₹{orderData.cartTotal?.toFixed(2)}</span>
                </div>
              </div>



            </div>

          </div>
        )}
        {activeTab === "courier" && (
          <div className="mt-6 text-gray-700 text-[15px]">Courier section (implement as needed)</div>
        )}
        {activeTab === "receiver" && (
          <div className="mt-6 text-gray-700 text-[15px]">Receiver section (implement as needed)</div>
        )}
      </div >

      {/* Return Request Modal */}
      {
        showReturnRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Return Request</h2>
                <button
                  onClick={() => setShowReturnRequest(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <ReturnRequest orderId={orderData.orderId} onClose={() => setShowReturnRequest(false)} />
            </div>
          </div>
        )
      }

      {/* Cancel Order Modal */}
      {
        showCancelOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Cancel Order</h2>
                <button
                  onClick={() => setShowCancelOrder(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <CancelOrder
                order={orderData}
                orderId={orderData.orderId || orderData._id}
                onClose={() => setShowCancelOrder(false)}
                setHasRequestedCancel={setHasRequestedCancel}
                onSubmitStart={() => {
                  setIsCancelling(true);
                }}
                onSubmitComplete={() => {
                  setIsCancelling(false);
                }}
              />
            </div>
          </div>
        )
      }
    </>
  );
};

export default OrderDetail;