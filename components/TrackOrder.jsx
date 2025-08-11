'use client';
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

const TrackOrder = ({ orderId: initialOrderId = '' }) => {
  const searchParams = useSearchParams();
  const [orderId, setOrderId] = useState(initialOrderId || searchParams.get('orderId') || '');
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Auto-fetch if orderId is provided as prop or in URL
    if (orderId) {
      handleTrack();
    }
  }, []);

  const handleTrack = async (e) => {
    if (e) e.preventDefault();
    if (!orderId.trim()) {
      setError('Please enter an order ID');
      return;
    }

    setLoading(true);
    setError('');
    setOrderData(null);

    try {
      // console.log(`Fetching order details for ID: ${orderId.trim()}`);
      const res = await fetch(`/api/orders/track/${orderId.trim()}`);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData.message || 
          `Failed to fetch order details (${res.status} ${res.statusText})`
        );
      }

      const result = await res.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch order details');
      }

      // console.log('Received order data:', result.data);
      setOrderData(result.data);
    } catch (err) {
      // console.error('Tracking error:', {
      //   message: err.message,
      //   stack: err.stack,
      //   orderId: orderId.trim()
      // });
      setError(err.message || 'Failed to track order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-md">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Track Your Order</h1>
      
      <form onSubmit={handleTrack} className="mb-8">
        <div className="flex gap-2">
          <input
            type="text"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="Enter your Tracking ID"
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Searching...' : 'Track'}
          </button>
        </div>
      </form>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {orderData && (
        <div className="space-y-6">
          {/* Order Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-3">Order Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Order ID</p>
                  <p className="font-medium">{orderData.orderId || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Order Date</p>
                  <p className="font-medium">{formatDate(orderData.orderDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Payment Method</p>
                  <p className="font-medium capitalize">
                    {orderData.paymentMethod === 'online' ? 'Online Payment' : 
                     orderData.paymentMethod === 'cod' ? 'Cash on Delivery' : 
                     orderData.paymentMethod || 'N/A'}
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    orderData.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                    orderData.status === 'Shipped' ? 'bg-blue-100 text-blue-800' :
                    orderData.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {orderData.status || 'Processing'}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Payment Status</p>
                  <p className="font-medium capitalize">{orderData.paymentStatus || 'Pending'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Amount</p>
                  <p className="font-medium">₹{orderData.totalAmount?.toFixed(2) || '0.00'}</p>
                </div>
              </div>
            </div>

          {/* Tracking Information */}
          {orderData.trackingNumber && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold mb-3">Tracking Information</h2>
              <div className="space-y-2">
                <p><span className="font-medium">Tracking Number:</span> {orderData.trackingNumber}</p>
                {orderData.trackingUrl && (
                  <a
                    href={orderData.trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-blue-600 hover:underline"
                  >
                    Track on Carrier's Website
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Status History */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Order Status History</h2>
            <div className="space-y-4">
              {orderData.statusHistory?.length > 0 ? (
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                  {orderData.statusHistory.map((status, index) => (
                    <div key={index} className="relative pl-10 pb-4">
                      <div className="absolute left-0 w-8 h-8 rounded-full bg-white border-2 border-blue-500 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-start">
                          <h3 className="font-medium">{status.status}</h3>
                          <span className="text-sm text-gray-500">
                            {formatDate(status.updatedAt || status.date)}
                          </span>
                        </div>
                        {status.message && (
                          <p className="mt-1 text-sm text-gray-600">{status.message}</p>
                        )}
                        {status.status === 'Shipped' && status.trackingNumber && (
                          <div className="mt-2 pt-2 border-t border-gray-100">
                            <p className="text-sm">
                              <span className="font-medium">Tracking #:</span> {status.trackingNumber}
                            </p>
                            {status.trackingUrl && (
                              <a
                                href={status.trackingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 text-sm hover:underline inline-flex items-center mt-1"
                              >
                                Track package
                                <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No status history available</p>
              )}
            </div>
          </div>
        </div>
        </div>
      )}
    </div>
  );
};

export default TrackOrder;
