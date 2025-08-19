"use client"
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '../ui/select';
import { Textarea } from "@/components/ui/textarea";
const planTypes = [
  { label: 'EP ( Room Only )', value: 'EP' },
  { label: 'CP ( Include Breakfast Only )', value: 'CP' },
  { label: 'MAP ( Breakfast + Lunch / Dinner )', value: 'MAP' },
  { label: 'AP ( Include All Meals )', value: 'AP' },
];

const RoomInvoice = () => {
  const [form, setForm] = useState({
    roomNumber: '',
    roomType: '',
    roomPrice: '',
    planType: '',
    checkIn: '',
    checkOut: '',
    totalDays: '',
    cgst: '',
    sgst: '',
    guestFirst: '',
    guestMiddle: '',
    guestLast: '',
    email: '',
    contact: '',
    city: '',
    pin: '',
    state: '',
    address: '',
    company: '',
    companyGst: '',
    anyCompany: '',
  });

  const [roomInfoList, setRoomInfoList] = useState([]);

  useEffect(() => {
    fetch('/api/roomInfo')
      .then(res => res.json())
      .then(data => setRoomInfoList(Array.isArray(data) ? data : []));
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // When roomNumber changes, auto-select roomType
  useEffect(() => {
    const selectedRoom = roomInfoList.find(r => String(r.RoomNo) === String(form.roomNumber));
    if (selectedRoom) {
      setForm(f => ({ ...f, roomType: selectedRoom.type }));
    }
  }, [form.roomNumber, roomInfoList]);

  return (
    <div className="max-w-4xl mx-auto bg-white border border-black rounded p-4 mt-4">
      <div className="flex flex-wrap gap-4 mb-2">
        <div className="flex-1 min-w-[200px]">
          <Label className="block text-sm font-semibold">Room Number</Label>
          <Select name="roomNumber" value={form.roomNumber} onValueChange={value => setForm(f => ({ ...f, roomNumber: value }))} className="w-full rounded border border-black px-3 py-1">
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {roomInfoList.map(room => (
                <SelectItem key={room._id} value={String(room.RoomNo)}>{room.RoomNo}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <Label className="block text-sm font-semibold">Room Type</Label>
          <Select name="roomType" value={form.roomType} onValueChange={value => setForm(f => ({ ...f, roomType: value }))} className="w-full rounded border border-black px-3 py-1">
            <SelectTrigger>
              <SelectValue placeholder="Auto Select" />
            </SelectTrigger>
            <SelectContent>
              {Array.from(new Set(roomInfoList.map(room => room.type))).map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex flex-wrap gap-4 mb-2 items-end">
        <div className="flex-1 min-w-[200px]">
          <Label className="block text-sm font-semibold">Room Price</Label>
          <Input type="number" name="roomPrice" value={form.roomPrice} onChange={handleChange} placeholder="Input" className="w-full rounded border border-black px-3 py-1" />
        </div>
        <span className="text-md py-2">/ Per Night</span>
        <div className="flex-1 min-w-[200px]">
          <Label className="block text-sm font-semibold">Plan type</Label>
          <Select name="planType" value={form.planType} onChange={handleChange} className="w-full rounded border border-black px-3 py-1">
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {planTypes.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <hr className="border-cyan-500 my-2" />
      <div className="flex flex-wrap gap-4 mb-2">
        <div className="flex-1 min-w-[200px]">
          <Label className="block text-sm font-semibold">Check In Date</Label>
          <Input type="date" name="checkIn" value={form.checkIn} onChange={handleChange} className="w-full rounded border border-black px-3 py-1" />
        </div>
        <div className="flex-1 min-w-[200px]">
          <Label className="block text-sm font-semibold">Check Out Date</Label>
          <Input type="date" name="checkOut" value={form.checkOut} onChange={handleChange} className="w-full rounded border border-black px-3 py-1" />
        </div>
        <div className="flex-1 min-w-[200px]">
          <Label className="block text-sm font-semibold">Total Days</Label>
          <Input type="number" name="totalDays" value={form.totalDays} onChange={handleChange} placeholder="Type Input" className="w-full rounded border border-black px-3 py-1" />
        </div>
      </div>
      <hr className="border-cyan-500 my-2" />
      <div className="flex flex-wrap gap-4 mb-2">
        <div className="flex-1 min-w-[200px]">
          <Label className="block text-sm font-semibold">Tax CGST</Label>
          <Select name="cgst" value={form.cgst} onChange={handleChange} className="w-full rounded border border-black px-3 py-1">
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {/* Add options dynamically */}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <Label className="block text-sm font-semibold">Tax SGST</Label>
          <Select name="sgst" value={form.sgst} onChange={handleChange} className="w-full rounded border border-black px-3 py-1">
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {/* Add options dynamically */}
            </SelectContent>
          </Select>
        </div>
      </div>
      <hr className="border-cyan-500 my-2" />
      <div className="flex flex-wrap gap-4 mb-2">
        <div className="flex-1 min-w-[120px]">
          <Label className="block text-sm font-semibold">Guest Name</Label>
          <div className="flex gap-2">
            <Input type="text" name="guestFirst" value={form.guestFirst} onChange={handleChange} placeholder="First" className="rounded border border-black px-2 py-1 w-1/3" />
            <Input type="text" name="guestMiddle" value={form.guestMiddle} onChange={handleChange} placeholder="Middle" className="rounded border border-black px-2 py-1 w-1/3" />
            <Input type="text" name="guestLast" value={form.guestLast} onChange={handleChange} placeholder="Last" className="rounded border border-black px-2 py-1 w-1/3" />
          </div>
        </div>
        <div className="flex-1 min-w-[200px]">
          <Label className="block text-sm font-semibold">Email Id</Label>
          <Input type="email" name="email" value={form.email} onChange={handleChange} placeholder="Select" className="w-full rounded border border-black px-3 py-1" />
        </div>
        <div className="flex-1 min-w-[200px]">
          <Label className="block text-sm font-semibold">Contact Number</Label>
          <Input type="text" name="contact" value={form.contact} onChange={handleChange} placeholder="Auto Select" className="w-full rounded border border-black px-3 py-1" />
        </div>
      </div>
      <div className="flex flex-wrap gap-4 mb-2">
        <div className="flex-1 min-w-[120px]">
          <Label className="block text-sm font-semibold">City</Label>
          <Input type="text" name="city" value={form.city} onChange={handleChange} placeholder="Type" className="w-full rounded border border-black px-3 py-1" />
        </div>
        <div className="flex-1 min-w-[120px]">
          <Label className="block text-sm font-semibold">Pin Code</Label>
          <Input type="text" name="pin" value={form.pin} onChange={handleChange} placeholder="Pin Code" className="w-full rounded border border-black px-3 py-1" />
        </div>
        <div className="flex-1 min-w-[120px]">
          <Label className="block text-sm font-semibold">Select State</Label>
          <Input type="text" name="state" value={form.state} onChange={handleChange} placeholder="Select State" className="w-full rounded border border-black px-3 py-1" />
        </div>
      </div>
      <div className="mb-2">
        <Label className="block text-sm font-semibold">Address</Label>
        <Textarea name="address" value={form.address} onChange={handleChange} placeholder="Type Address" className="w-full rounded border border-black px-3 py-2" rows={2} />
      </div>
      <hr className="border-cyan-500 my-2" />
      <div className="flex flex-wrap gap-4 mb-2">
        <div className="flex-1 min-w-[120px]">
          <Label className="block text-sm font-semibold">Any Company</Label>
          <Input type="text" name="anyCompany" value={form.anyCompany} onChange={handleChange} placeholder="First" className="w-full rounded border border-black px-3 py-1" />
        </div>
        <div className="flex-1 min-w-[120px]">
          <Label className="block text-sm font-semibold">Company GST</Label>
          <Input type="text" name="companyGst" value={form.companyGst} onChange={handleChange} placeholder="First" className="w-full rounded border border-black px-3 py-1" />
        </div>
      </div>
      <div className="mt-4">
        <button className="bg-orange-500 text-black font-bold px-8 py-2 rounded shadow hover:bg-orange-600 transition-all" type="button">
          Data Save
        </button>
      </div>
      {/* Invoice Log Table */}
      <div className="mt-10">
        <h2 className="text-lg font-bold mb-2">Invoice Log</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr>
                <th className="bg-orange-500 text-black font-bold px-4 py-2 border border-white">#</th>
                <th className="bg-orange-500 text-black font-bold px-4 py-2 border border-white">Invoice Number</th>
                <th className="bg-orange-500 text-black font-bold px-4 py-2 border border-white">Date</th>
                <th className="bg-orange-500 text-black font-bold px-4 py-2 border border-white">View</th>
                <th className="bg-orange-500 text-black font-bold px-4 py-2 border border-white">Edit</th>
                <th className="bg-orange-500 text-black font-bold px-4 py-2 border border-white">Delete</th>
                <th className="bg-orange-500 text-black font-bold px-4 py-2 border border-white">Print Invoice</th>
                <th className="bg-orange-500 text-black font-bold px-4 py-2 border border-white">Pay Online</th>
              </tr>
            </thead>
            <tbody>
              {/* Placeholder row data */}
              {[1,2,3].map((row, idx) => (
                <tr key={idx} className="text-center">
                  <td className="border px-4 py-2">{row}</td>
                  <td className="border px-4 py-2">INV-000{row}</td>
                  <td className="border px-4 py-2">2025-08-19</td>
                  <td className="border px-4 py-2"><button className="underline text-blue-600">View</button></td>
                  <td className="border px-4 py-2"><button className="underline text-green-600">Edit</button></td>
                  <td className="border px-4 py-2"><button className="underline text-red-600">Delete</button></td>
                  <td className="border px-4 py-2"><button className="underline text-black">Print</button></td>
                  <td className="border px-4 py-2"><button className="bg-orange-500 text-white px-2 py-1 rounded">Pay Online</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
;

export default RoomInvoice;