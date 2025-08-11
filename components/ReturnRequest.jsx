"use client"
import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";
import Link from "next/link";

const ReturnRequest = ({ order: propOrder, orderId, onClose }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [order, setOrder] = useState(propOrder || null);
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Get order from props or fetch using orderId
  const currentOrderId = orderId || searchParams?.get('orderId');
  
  // Redirect to dashboard if no order is found
  React.useEffect(() => {
    if (!currentOrderId && !order && typeof window !== 'undefined') {
      router.push('/dashboard?section=orders');
    }
  }, [currentOrderId, order, router]);

  useEffect(() => {
    // Only fetch if we don't have order data but have an ID
    if ((!order || !order.items) && currentOrderId) {
      fetchOrderDetails();
    } else if (order && order.items) {
      // Initialize selected items if we have order data
      const itemIds = order.items.map(item => item._id);

      setSelectedItems(itemIds);
    }
  }, [currentOrderId, order]);

  const fetchOrderDetails = async () => {
    if (!currentOrderId) {
      toast.error('Order ID is missing');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/orders/${currentOrderId}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const orderData = await response.json();
      
      if (!orderData) {
        throw new Error('No order data received from server');
      }

      // Check if we have items in the order
      const orderItems = orderData.products || orderData.items || [];
      
      // Set the order data
      setOrder(orderData);
      
      // Initialize with all item IDs that have _id
      const itemIds = orderItems
        .filter(item => item && (item._id || item.id))
        .map(item => item._id || item.id);
        
      setSelectedItems(itemIds);
    } catch (error) {
      // console.error('Error in fetchOrderDetails:', {
      //   error,
      //   message: error.message,
      //   stack: error.stack,
      // });
      toast.error(`Failed to load order details: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleItemToggle = (itemId) => {
    
    setSelectedItems(prev => {
      const newItems = prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId];
      return newItems;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!reason) {
      toast.error('Please select a reason for return');
      return;
    }
    
    if (selectedItems.length === 0) {
      toast.error('Please select at least one item to return');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch('/api/returns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: currentOrderId,
          items: selectedItems,
          reason,
          description,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Return request submitted successfully');
        if (onClose) {
          onClose();
        } else {
          router.push('/dashboard?section=orders');
        }
      } else {
        throw new Error(data.message || 'Failed to submit return request');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to submit return request');
    } finally {
      setIsSubmitting(false);
    }
  };

  // if (loading) {
  //   return (
  //     <div className="flex justify-center items-center p-8">
  //       <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
  //     </div>
  //   );
  // }

  if (!order) {
    // console.log('No order data yet, showing loading state');
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">Loading order details...</p>
        <div className="flex justify-center mt-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  const handleChatWithUs = () => {
    // Navigate to chatbot section with order ID
    if (order?.orderId) {
      window.location.href = `/dashboard?section=chatbot&orderId=${order.orderId}`;
    } else {
      window.location.href = '/dashboard?section=chatbot';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Return Policy & Procedure</h2>
        <button 
          onClick={onClose || (() => router.back())}
          className="text-gray-500 hover:text-gray-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="space-y-6">
        {/* How to Initiate Return */}
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">How to Initiate a Return</h3>
          <div className="space-y-4">
            <p className="text-gray-700">If you wish to return a product, please follow these steps:</p>
            
            <div className="bg-white p-4 rounded-lg shadow">
              <h4 className="font-medium text-gray-800 mb-2">1. Contact Our Customer Service</h4>
              <p className="text-gray-600 mb-3">Reach out to us through any of these methods:</p>
              <ul className="list-disc pl-5 space-y-1 text-gray-700">
                <li>Email: <a href="mailto:info@info@adventureaxis.in" className="text-blue-600 hover:underline">info@info@adventureaxis.in</a></li>
                <li>Phone: <a href="tel:917351009107" className="text-blue-600 hover:underline">917351009107</a></li>
              </ul>
            </div>

            <div className="bg-white p-4 rounded-lg shadow">
              <h4 className="font-medium text-gray-800 mb-2">2. Provide Required Information</h4>
              <p className="text-gray-600 mb-2">Please include the following details in your request:</p>
              <ul className="list-disc pl-5 space-y-1 text-gray-700">
                <li>Order number</li>
                <li>Reason for return</li>
                <li>Product photos (if damaged/defective)</li>
                <li>Guest name and contact details</li>
                <li>Product name and order/bill number</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Eligibility Criteria */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Eligibility Criteria</h3>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start">
              <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Return request must be made within 3 days of purchase
            </li>
            <li className="flex items-start">
              <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Product must be unused, in original packaging, and in resalable condition
            </li>
            <li className="flex items-start">
              <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Original invoice or proof of purchase is required
            </li>
          </ul>
        </div>

        {/* Return Process */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Return Process</h3>
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <h4 className="font-medium text-gray-800 mb-2">1. Verification</h4>
              <p className="text-gray-700">Our team will verify your request and the condition of the product. For damaged or defective products, photographic evidence may be required.</p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow">
              <h4 className="font-medium text-gray-800 mb-2">2. Approval & Instructions</h4>
              <p className="text-gray-700 mb-2">If approved, we'll confirm via email/phone and provide:</p>
              <ul className="list-disc pl-5 text-gray-700 space-y-1">
                <li>Return location or pickup instructions</li>
                <li>Estimated processing time</li>
              </ul>
            </div>

            <div className="bg-white p-4 rounded-lg shadow">
              <h4 className="font-medium text-gray-800 mb-2">3. Processing Time</h4>
              <p className="text-gray-700">Once we receive the returned item, it will be inspected for eligibility. If all conditions are met, a refund or exchange will be processed within 5-7 business days.</p>
            </div>
          </div>
        </div>

        {/* Refund & Exchange Terms */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Refund & Exchange Terms</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-800">Refund Method</h4>
              <p className="text-gray-700">Refunds will be issued via the original payment method (credit card, UPI, cash) or credited to the guest's room bill, based on the situation.</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-800">Exchange Option</h4>
              <p className="text-gray-700">Guests may opt to exchange the returned product with another item of equal or higher value (price difference payable).</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-800">Deductions (if any)</h4>
              <p className="text-gray-700">In some cases, a small handling or restocking fee may apply (this will be informed in advance).</p>
            </div>
          </div>
        </div>

        {/* Important Notes */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Important Notes</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>• Please ensure the item is properly packed to avoid damage during transit (if applicable).</p>
                <p>• Our team reserves the right to reject a return if the item does not meet return policy conditions.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Support Button */}
        <div className="flex justify-center mt-8">
          <button
            onClick={handleChatWithUs}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Need Help? Chat with Our Support Team
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReturnRequest;