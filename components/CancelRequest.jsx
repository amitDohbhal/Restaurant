"use client"
import React, { useState } from "react";

const mockProducts = [
  {
    id: "1374837",
    name: "Collar Casual Shirt",
    date: "2024-03-21",
    image: "https://cdn-icons-png.flaticon.com/512/892/892458.png",
    quantity: 1,
    price: 105,
  },
  {
    id: "1374837",
    name: "Collar Casual Shirt",
    date: "2024-03-21",
    image: "https://cdn-icons-png.flaticon.com/512/892/892460.png",
    quantity: 1,
    price: 304,
  },
];

const reasons = [
  "I have changed my mind",
  "Expected delivery time is very long",
  "I want to change address for the order",
  "I want to convert my order to Prepaid",
  "Price for the product has decreased",
  "I have purchased the product elsewhere",
];

const CancelRequest = () => {
  const [selectedReason, setSelectedReason] = useState("");

  return (
    <div className="bg-[#fcf7f1] min-h-[400px] p-6 rounded-2xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {mockProducts.map((item, idx) => (
          <div key={idx} className="bg-white border border-dashed rounded-xl p-5 flex flex-col gap-2 shadow-sm">
            <span className="font-semibold text-sm mb-2 block">
              Request No: <span className="text-pink-600 font-bold">#{item.id}</span>
            </span>
            <div className="flex gap-5 items-center">
              <img src={item.image} alt="product" className="w-20 h-20 rounded-lg border" />
              <div>
                <div className="text-[15px] text-gray-700 mb-1">{new Date(item.date).toLocaleDateString("en-US", { month: "long", day: "2-digit", year: "numeric" })}</div>
                <div className="font-bold text-[17px] mb-1">{item.name}</div>
                <div className="text-[15px] mb-1">Quantity: <span className="font-semibold">{item.quantity}</span></div>
                <div className="font-bold text-[15px]">${item.price}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
        {/* Reason For Cancellation */}
        <div>
          <h3 className="font-bold text-lg mb-4">Reason For Cancellation</h3>
          <form className="flex flex-col gap-2">
            {reasons.map((reason, idx) => (
              <label key={idx} className="flex items-center gap-2 text-[15px]">
                <input
                  type="radio"
                  name="reason"
                  value={reason}
                  checked={selectedReason === reason}
                  onChange={() => setSelectedReason(reason)}
                  className="accent-pink-600 w-4 h-4"
                />
                {reason}
              </label>
            ))}
          </form>
        </div>
        {/* Refund Status */}
        <div>
          <h3 className="font-bold text-lg mb-4">Refund status</h3>
          <div className="text-gray-700 text-[15px] mb-6">
            There will be no refund as the order is purchased using <b>Cash–On–Delivery</b>
          </div>
          <button className="bg-black text-white px-7 py-2 rounded-lg font-semibold text-base hover:bg-gray-900 transition">
            Submit Request
          </button>
        </div>
      </div>
    </div>
  );
};

export default CancelRequest;