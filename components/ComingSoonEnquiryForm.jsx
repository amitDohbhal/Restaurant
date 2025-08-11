"use client";
import { useState } from "react";
import { toast } from "react-hot-toast";

export default function ComingSoonEnquiryForm({ packageId }) {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    const form = e.target;
    const data = {
      packageId: packageId ? (typeof packageId === "string" ? packageId : String(packageId)) : undefined,
      firstName: form.firstName.value,
      lastName: form.lastName.value,
      phone: form.phone.value,
      email: form.email.value,
      address: form.address.value,
      travelDate: form.travelDate.value,
      startFrom: form.startFrom.value,
      whichLocation: form.whichLocation.value,
      adults: form.adults.value,
      children: form.children.value === '' ? 0 : form.children.value,
      infants: form.infants.value === '' ? 0 : form.infants.value
    };
    // console.log(data)
    const res = await fetch("/api/comingSoonEnquiry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    setLoading(false);

    if (res.ok) {
      setSubmitted(true);
      // console.log(res)
      toast.success("Enquiry submitted!");
      form.reset();
    } else {
      toast.error("Failed to submit enquiry");
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center bg-gray-100 rounded-xl p-0 mt-8 max-w-md mx-auto shadow-lg animate-fade-in">
        <div className="w-full bg-blue-400 rounded-t-xl flex flex-col items-center pt-8 pb-6">
          <svg className="w-20 h-20 text-white mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2" fill="none" />
            <path stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2l4-4" />
          </svg>
          <span className="text-white text-lg tracking-widest mb-2">SUCCESS</span>
        </div>
        <div className="bg-white w-full rounded-b-xl flex flex-col items-center px-8 pt-8 pb-8">
          <p className="text-gray-700 text-center text-lg mb-6">
            Thank you for your interest in Yatrazone. One of our dedicated executives will connect with you shortly to assist with your travel needs and provide personalized support. We look forward to helping you plan your perfect journey.
          </p>
          <a
            href="/"
            className="inline-block px-10 py-3 bg-blue-400 text-white font-semibold rounded-full shadow hover:bg-blue-500 transition text-lg"
          >
            Back to Home
          </a>
        </div>
      </div>
    );
  }
  return (
    <form className="bg-white rounded-xl border border-gray-300 shadow-lg p-8 max-w-2xl mx-auto mt-8 animate-fade-in" onSubmit={handleSubmit}>

      <h2 className="text-2xl font-bold mb-2 text-gray-800 text-center">Tell us a bit about yourself.</h2>
      <p className="text-center text-gray-600 mb-4">Your info helps us serve you better—securely and personally.Please take a moment to share a few details about yourself.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <label className="font-semibold text-gray-700">First Name</label>
          <input className="rounded px-4 py-2 border border-gray-300 focus:border-orange-500 focus:outline-none" placeholder="Enter your first name" name="firstName" required />
        </div>
        <div className="flex flex-col gap-2">
          <label className="font-semibold text-gray-700">Last Name</label>
          <input className="rounded px-4 py-2 border border-gray-300 focus:border-orange-500 focus:outline-none" placeholder="Enter your last name" name="lastName" required />
        </div>
        <div className="flex flex-col gap-2 md:col-span-2">
          <label className="font-semibold text-gray-700">Email</label>
          <input className="rounded px-4 py-2 border border-gray-300 focus:border-orange-500 focus:outline-none" placeholder="Enter your email" name="email" required />
        </div>
        <div className="flex flex-col gap-2">
          <label className="font-semibold text-gray-700">Phone Number</label>
          <input className="rounded px-4 py-2 border border-gray-300 focus:border-orange-500 focus:outline-none" placeholder="Enter your phone number" name="phone" required />
        </div>
        <div className="flex flex-col gap-2 md:col-span-2">
          <label className="font-semibold text-gray-700">Address</label>
          <input className="rounded px-4 py-2 border border-gray-300 focus:border-orange-500 focus:outline-none" placeholder="Enter your address" name="address" required />
        </div>
        <div className="flex flex-col gap-2 md:col-span-2">
          <h2 className="text-center font-bold text-xl text-gray-600 mb-1">"Planning your perfect trip—just tell us who's on board."</h2>
          <p className="text-center text-gray-600 mb-2">To ensure accurate availability, pricing, and a seamless booking experience, please indicate the number of adults and children in your travel group.</p>
        </div>
        <div className="flex flex-col gap-2 md:col-span-2">
          <label className="font-semibold text-gray-700">Travel Date</label>
          <input className="rounded px-4 py-2 border border-gray-300 focus:border-orange-500 focus:outline-none" type="date" name="travelDate" required />
        </div>
        <div className="flex flex-col gap-2 md:col-span-1">
          <label className="font-semibold text-gray-700">Start From</label>
          <input className="rounded px-4 py-2 border border-gray-300 focus:border-orange-500 focus:outline-none" placeholder="City of Departure" name="startFrom" required />
        </div>
        <div className="flex flex-col gap-2 md:col-span-1">
          <label className="font-semibold text-gray-700">Which Location</label>
          <input className="rounded px-4 py-2 border border-gray-300 focus:border-orange-500 focus:outline-none" placeholder="Destination" name="whichLocation" required />
        </div>
        <div className="w-full md:col-span-2">
          <div className="flex flex-col md:flex-row gap-2 w-full mt-1">
            <div className="flex-1">
              <label className="font-semibold text-gray-700">Adults</label>
              <input className="w-full rounded px-4 py-2 border border-gray-300 focus:border-orange-500 focus:outline-none" type="number" min="1" placeholder="No. of Adults" name="adults" required />
            </div>
            <div className="flex-1">
              <label className="font-semibold text-gray-700">Children</label>
              <input className="w-full rounded px-4 py-2 border border-gray-300 focus:border-orange-500 focus:outline-none" type="number" min="0" placeholder="No. of Children" name="children" />
            </div>
            <div className="flex-1">
              <label className="font-semibold text-gray-700">Infants</label>
              <input className="w-full rounded px-4 py-2 border border-gray-300 focus:border-orange-500 focus:outline-none" type="number" min="0" placeholder="No. of Infants" name="infants" />
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-center mt-8">
        <button type="submit" className="bg-orange-500 px-10 py-3 rounded-full text-white font-bold text-lg shadow hover:bg-orange-600 transition-all duration-200" disabled={loading}>
          {loading ? "Submitting..." : "Submit Enquiry"}
        </button>
      </div>
    </form>
  );
}
