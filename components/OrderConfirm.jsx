"use client"
import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const OrderConfirm = ({ orderId}) => {
  const router = useRouter();

  const handleViewOrders = () => {
    router.push('/dashboard?section=orders');
  };

  return (
    <div className="bg-[#fdf7f1] rounded-2xl max-w-[700px] mx-auto my-10 p-9 border border-[#f5e9d9] shadow-md text-center">
      <div className="mb-9">
        <Image
          src="/order-confirm.png"
          alt="Order Completed"
          width={320}
          height={200}
          className="mx-auto"
        />
      </div>

      <h2 className="font-bold text-2xl mb-2.5">
        Your Order Is Completed!
      </h2>

      <div className="text-gray-600 text-base mb-3">
        You will receive an order confirmation email with details of your order.
      </div>

      <div className="text-[#9c8a6d] text-[15px] mb-7">
        Order ID: <span className="text-[#6d5b3b] font-semibold">{orderId}</span>
      </div>

      <div className="flex justify-center gap-4">
        <button
          onClick={handleViewOrders}
          className="bg-black text-white rounded-lg px-7 py-3 font-semibold text-base shadow hover:bg-gray-900 transition-colors"
        >
          View My Orders
        </button>
      </div>
    </div>
  );
};

export default OrderConfirm;
