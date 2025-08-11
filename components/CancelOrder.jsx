"use client";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";
import { useRouter } from 'next/navigation';
const RefundForm = ({ order, orderId, onClose, onSubmitStart, onSubmitComplete,setHasRequestedCancel }) => {
  const searchParams = useSearchParams();
  const [selectedOrder, setSelectedOrder] = useState(order || null);
  const router = useRouter();
  const [formData, setFormData] = useState({
    reason: '',
    accountNumber: '',
    confirmAccountNumber: '',
    ifscCode: '',
    bankName: '',
    accountHolderName: '',
    upiId: '',
    contactNumber: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    onSubmitStart();
    if (formData.accountNumber !== formData.confirmAccountNumber) {
      toast.error('Account numbers do not match');
      return;
    }

    try {
      setIsSubmitting(true);

      // // Debug logs
      // console.log('Selected Order:', selectedOrder);
      // console.log('Order prop:', order);
      // console.log('Current Order ID:', currentOrderId);

      if (!selectedOrder?._id) {
        // console.error('No order ID found in selectedOrder:', selectedOrder);
        throw new Error('Order information is missing. Please refresh and try again.');
      }

      const response = await fetch('/api/cancelOrder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrder._id,
          userId: selectedOrder.userId,
          products: selectedOrder.products,
          reason: formData.reason,
          bankDetails: {
            accountNumber: formData.accountNumber,
            ifscCode: formData.ifscCode,
            bankName: formData.bankName,
            accountHolderName: formData.accountHolderName,
            upiId: formData.upiId
          },
          userDetails: {
            name: selectedOrder.shippingAddress?.name,
            contactNumber: formData.contactNumber
          },
          shippingAddress: selectedOrder.shippingAddress
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to submit request');
      // Update local state
      setHasRequestedCancel(true);
      if (onClose) onClose();
      toast.success('Cancellation request submitted successfully');
      router.refresh();
    } catch (error) {
      toast.error(error.message);
    } finally {
      if (onSubmitComplete) onSubmitComplete();
    }
  };
  const currentOrderId = orderId || searchParams?.get("orderId") || '';

  useEffect(() => {
    if (!selectedOrder && currentOrderId) {
      // TODO: Fetch order details if not passed as prop
    }
  }, [currentOrderId, selectedOrder]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }
  return (
    <div className="max-w-2xl mx-auto bg-[#f8f3ee] p-6 rounded-md shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-center w-full">Require Detail For Refund</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Order Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Order ID Number</label>
            <select
              className="w-full px-3 py-2 border rounded-md bg-gray-200"
              name="orderId"
              value={currentOrderId}
              onChange={handleChange}
            >
              <option value="">Select Order ID</option>
              <option value={selectedOrder?.orderId}>{selectedOrder?.orderId}</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Purchase Order Date</label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-md bg-gray-200"
              value={selectedOrder?.createdAt?.slice(0, 10) || ""}
              readOnly
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium">Product Name</label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-md bg-gray-200"
              value={selectedOrder?.products?.[0]?.name || ""}
              readOnly
            />
          </div>
        </div>

        {/* Bank Details */}
        <h3 className="font-semibold pt-4 border-t">Bank Detail</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Account Number</label>
            <input
              type="text"
              name="accountNumber"
              value={formData.accountNumber}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium">Confirm Account Number</label>
            <input
              type="text"
              name="confirmAccountNumber"
              value={formData.confirmAccountNumber}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium">IFSC Code</label>
            <input
              type="text"
              name="ifscCode"
              value={formData.ifscCode}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium">Bank Branch Address</label>
            <input
              type="text"
              name="bankBranch"
              value={formData.bankBranch}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium">Or Any UPI ID</label>
            <input
              type="text"
              name="upiId"
              value={formData.upiId}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
        </div>

        {/* Basic Info */}
        <h3 className="font-semibold pt-4 border-t">Basic Info</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Your Name</label>
            <input
              type="text"
              name="userName"
              value={formData.userName}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium">Contact Number</label>
            <input
              type="text"
              name="contactNumber"
              value={formData.contactNumber}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>
        </div>

        {/* Submit */}
        <div className="pt-6 text-center">
          <button
            type="submit"
            className="bg-black text-white px-6 py-2 rounded-md text-sm hover:bg-gray-800"
          >
            Submit Data
          </button>
        </div>
      </form>
      <p className="text-sm text-gray-600 mt-4">
        By submitting this form, you agree to our{' '}
        <a href="/refund-cancellation" target="_blank" className="text-blue-600 underline hover:text-blue-800">
          Refund & Cancellation Policy
        </a>.
      </p>

    </div>
  );
};

export default RefundForm;
