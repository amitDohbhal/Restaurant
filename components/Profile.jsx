"use client"
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { statesIndia } from "@/lib/IndiaStates";
import Image from "next/image";
const Profile = () => {
  // Ensure sortedStates is a sorted copy for dropdown
  const sortedStates = [...statesIndia].sort();
  const { data: session } = useSession();
  const [newsletter, setNewsletter] = useState(false);

  const form = useForm({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      postalCode: "",
      country: "India",
      dateOfBirth: "",
      // newPassword: "",
      // confirmPassword: "",
    },
  });

  useEffect(() => {
    if (session?.user?.email) {
      form.setValue("email", session.user.email);
    }
  }, [session?.user?.email, form]);

  useEffect(() => {
    if (!session?.user?.email) return;
    const fetchUserData = async () => {
      try {
        const response = await fetch(`/api/getUserByEmail?email=${encodeURIComponent(session.user.email)}`);
        const data = await response.json();
        if (response.ok) {
          form.reset({
            firstName: data.firstName || "",
            lastName: data.lastName || "",
            phone: data.phone || "",
            address: data.address || "",
            email: data.email || "",
            city: data.city || "",
            state: data.state || "",
            postalCode: data.postalCode || "",
            country: data.country || "India",
            dateOfBirth: data.dateOfBirth ? data.dateOfBirth.slice(0, 10) : "",
          });
        } else {
          throw new Error(data.message || "Failed to fetch user data");
        }
      } catch (error) {
        toast.error(error.message, { style: { borderRadius: "10px", border: "2px solid red" } });
      }
    };
    fetchUserData();
  }, [session?.user?.email]);

  const onSubmit = async (data) => {
    data.name = `${data.firstName} ${data.lastName}`;
    try {
      const response = await fetch("/api/updateUser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const res = await response.json();
      if (!response.ok) {
        toast.error(res.message, { style: { borderRadius: "10px", border: "2px solid red" } });
      } else {
        toast.success("Profile updated successfully!", { style: { borderRadius: "10px", border: "2px solid green" } });
      }
    } catch (error) {
      toast.error(error.message, { style: { borderRadius: "10px", border: "2px solid red" } });
    }
  };

  const user = session?.user || {
    name: "John Doe",
    email: "johndoe@example.com",
    image: "/placeholder.jpeg",
  };

  return (
    <div className="bg-[#fcf7f1] min-h-[600px] p-6 rounded-2xl max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center gap-5 mb-6 border-b pb-6">
        <div className="relative">
          <Image
            src={user.image}
            alt="avatar"
            width={96}
            height={96}
            className="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover"
          />
        </div>
        <div className="flex items-center flex-col">
          <div className="text-2xl font-bold mb-1">{user.name}</div>
          <div className="text-pink-600 text-[15px] font-medium">{user.email}</div>
        </div>
      </div>
      {/* Form */}
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 mt-4">
        {/* First Name */}
        <div>
          <label className="block mb-1 font-medium text-[15px]">First Name</label>
          <input {...form.register("firstName")} className="w-full border rounded-lg px-4 py-2 bg-white focus:outline-pink-600" />
        </div>
        {/* Last Name */}
        <div>
          <label className="block mb-1 font-medium text-[15px]">Last Name</label>
          <input {...form.register("lastName")} className="w-full border rounded-lg px-4 py-2 bg-white focus:outline-pink-600" />
        </div>
        {/* Email (readonly) */}
        <div>
          <label className="block mb-1 font-medium text-[15px]">Email address</label>
          <input {...form.register("email")} className="w-full border rounded-lg px-4 py-2 bg-white focus:outline-pink-600" readOnly disabled />
        </div>
        {/* Phone */}
        <div>
          <label className="block mb-1 font-medium text-[15px]">Phone</label>
          <input {...form.register("phone")} maxLength={10} className="w-full border rounded-lg px-4 py-2 bg-white focus:outline-pink-600" />
        </div>
        {/* Date of Birth */}
        <div>
          <label className="block mb-1 font-medium text-[15px]">Date of Birth</label>
          <input type="date" {...form.register("dateOfBirth")} className="w-full border rounded-lg px-4 py-2 bg-white focus:outline-pink-600" />
        </div>
        {/* Street Address */}
        <div>
          <label className="block mb-1 font-medium text-[15px]">Street Address</label>
          <input {...form.register("address")} className="w-full border rounded-lg px-4 py-2 bg-white focus:outline-pink-600" />
        </div>
        {/* City */}
        <div>
          <label className="block mb-1 font-medium text-[15px]">City</label>
          <input {...form.register("city")} className="w-full border rounded-lg px-4 py-2 bg-white focus:outline-pink-600" />
        </div>
        {/* State */}
        <div>
          <label className="block mb-1 font-medium text-[15px]">State</label>
          <select {...form.register("state")} className="w-full border rounded-lg px-4 py-2 bg-white focus:outline-pink-600">
            <option value="">Select State</option>
            {sortedStates.map((state, idx) => (
              <option key={idx} value={state}>{state}</option>
            ))}
          </select>
        </div>
        {/* Postal Code */}
        <div>
          <label className="block mb-1 font-medium text-[15px]">Postal Code</label>
          <input {...form.register("postalCode")} className="w-full border rounded-lg px-4 py-2 bg-white focus:outline-pink-600" />
        </div>
        {/* Country */}
        <div>
          <label className="block mb-1 font-medium text-[15px]">Country</label>
          <select {...form.register("country")} className="w-full border rounded-lg px-4 py-2 bg-white focus:outline-pink-600">
            <option value="India">India</option>
          </select>
        </div>
        {/* Newsletter */}
        {/* <div className="col-span-2 flex items-center mt-2">
          <input
            type="checkbox"
            id="newsletter"
            checked={newsletter}
            onChange={() => setNewsletter((v) => !v)}
            className="mr-2 accent-pink-600 w-4 h-4"
          />
          <label htmlFor="newsletter" className="text-[15px]">Subscribe me to Newsletter</label>
        </div> */}
        {/* Submit Button */}
        <div className="flex justify-end mt-2">
          <button
            type="submit"
            className="bg-pink-600 text-white px-8 py-2 rounded-lg font-semibold text-base hover:bg-pink-700 transition"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? "Updating..." : "Update Profile"}
          </button>
        </div>
      </form>
    </div>


  )
}
export default Profile