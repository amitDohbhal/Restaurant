"use client"
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '../ui/select';
import { Textarea } from "@/components/ui/textarea";
import { statesIndia } from '@/lib/IndiaStates';
import toast from 'react-hot-toast';
import SimpleModal from '../SimpleModal';
import { Printer, Mail, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '../ui/dialog';
const planTypes = [
  { label: 'EP ( Room Only )', value: 'EP' },
  { label: 'CP ( Include Breakfast Only )', value: 'CP' },
  { label: 'MAP ( Breakfast + Lunch / Dinner )', value: 'MAP' },
  { label: 'AP ( Include All Meals )', value: 'AP' },
];
// DetailBox helper for view modal
const DetailBox = ({ label, value }) => (
  <div className="mb-2 border border-black rounded-md px-5 py-2">
    <div className="font-semibold text-gray-700">{label}</div>
    <div className="text-gray-600">{value}</div>
  </div>
);
const RoomInvoice = () => {
  const [form, setForm] = useState({
    roomNumber: '',
    roomType: '', // This will store the room type
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
  const [invoices, setInvoices] = useState([]);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewInvoice, setViewInvoice] = useState(null);
  const [printInvoice, setPrintInvoice] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isPrintingInvoice, setIsPrintingInvoice] = useState(false);
  const [hotelData, setHotelData] = useState(null);
  const hotelLogo = hotelData?.image?.url || '';
  const fetchInvoices = async () => {
    try {
      const res = await fetch('/api/roomInvoice');
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch invoices');
      }

      // console.log('API Response:', data);

      if (data.success && Array.isArray(data.invoices)) {
        setInvoices(data.invoices);
      } else {
        console.error('Unexpected API response format:', data);
        setInvoices([]);
        toast.error('Invalid data format received from server');
      }
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setInvoices([]);
      toast.error(err.message || 'Failed to fetch invoices. Please try again.');
    }
  };
  // console.log(invoices)
  useEffect(() => {
    const fetchHotelData = async () => {
      try {
        const response = await fetch('/api/addBasicInfo');
        const data = await response.json();
        if (data && data[0]) {
          setHotelData(data[0]);
        }
      } catch (error) {
        console.error('Error fetching hotel data:', error);
      }
    };

    fetchHotelData();
    fetch('/api/roomInfo')
      .then(res => res.json())
      .then(data => setRoomInfoList(Array.isArray(data) ? data : []));
    fetchInvoices();
  }, []);
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // When roomNumber changes, auto-select roomType
  useEffect(() => {
    if (form.roomNumber) {
      const selectedRoom = roomInfoList.find(r => String(r.RoomNo) === String(form.roomNumber));
      if (selectedRoom && selectedRoom.type) {
        setForm(f => ({
          ...f,
          roomType: selectedRoom.type,
          roomPrice: selectedRoom.price || f.roomPrice // Also update room price if available
        }));
      }
    } else {
      // Clear room type if no room is selected
      setForm(f => ({ ...f, roomType: '' }));
    }
  }, [form.roomNumber, roomInfoList]);
  // Handle sending invoice via email
  const handleSendInvoiceEmail = async (invoice) => {
    if (!invoice?.email) {
      toast.error('No email address available for this invoice');
      return;
    }

    setIsSendingEmail(true);

    try {
      // Generate the invoice HTML (similar to the print function but simplified for email)
      const invoiceHtml = `
       <html>
  <head>
    <style>
      body {
        font-family: Arial, sans-serif;
        line-height: 1.6;
        margin: 0;
        background-color: #f9f9f9;
      }
      .invoice-container {
        max-width: 900px;
        margin: auto;
        background: #fff;
        border-radius: 8px;
        box-shadow: 0 4px 10px rgba(0,0,0,0.1);
      }
      .header {
        background-color: #228b78;
        color: white;
        padding: 20px;
        border-radius: 6px 6px 0 0;
        margin-bottom: 25px;
      }
      .logo-container {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .logo {
        max-width: 120px;
        max-height: 100px;
        object-fit: contain;
        background: white;
        padding: 6px;
        border-radius: 4px;
      }
      .hotel-name {
        padding:10px 20px;
        text-align: center;
      }
      .hotel-name h1 {
        margin: 0;
        font-size: 26px;
        font-weight: 700;
      }
      .hotel-name p {
        margin: 4px 0 0;
        font-size: 14px;
        opacity: 0.9;
      }
      .invoice-title {
        background: #1e1e1e;
        color: white;
        padding: 10px 0;
        text-align: center;
        margin-top: 20px;
        border-radius: 4px;
      }
      h3 {
        margin-top: 30px;
        font-size: 18px;
        color: #333;
        border-bottom: 2px solid #eee;
        padding-bottom: 6px;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin: 10px 0;
        font-size: 14px;
      }
      th, td {
        border: 1px solid #ddd;
        padding: 10px;
        text-align: left;
      }
      th {
        background-color: #f5f5f5;
        font-weight: 600;
      }
      tbody tr:nth-child(even) {
        background: #fafafa;
      }
      tfoot td {
        font-weight: bold;
        font-size: 15px;
      }

      /* Special styling for details table */
      .details-table td {
        width: 50%;
      }
      .details-table p {
        margin: 3px 0;
        word-break: break-word;
      }

      /* Email styling */
      .email {
        color: #0073aa;
        word-break: break-all;
      }
      .footer {
        margin-top: 40px;
        padding-top: 15px;
        border-top: 1px solid #eee;
        font-size: 12px;
        color: #777;
        text-align: center;
      }
    </style>
  </head>
  <body>
    <div class="invoice-container">
      <!-- HEADER -->
      <div class="header">
        <div class="logo-container">
          <div>
            ${hotelLogo ? `<img src="${hotelLogo}" alt="Hotel Logo" class="logo"/>` : ""}
          </div>
          <div class="hotel-name">
            <h1>${hotelData?.hotelName || 'Hotel Shivan Residence'}</h1>
            <p>${hotelData?.tagline || 'Your Home Away From Home'}</p>
          </div>
          <div style="width: 120px;"></div>
        </div>
        <div class="invoice-title">
          <h2>INVOICE #${invoice._id?.slice(-6).toUpperCase() || 'N/A'}</h2>
          <p>Date: ${new Date(invoice.createdAt || Date.now()).toLocaleDateString()}</p>
        </div>
      </div>
      <!-- BILL TO & HOTEL DETAILS -->
      <h3>Details</h3>
      <table class="details-table">
        <tr>
          <td>
            <strong>Bill To:</strong>
            <p>${invoice.guestFirst || ''} ${invoice.guestMiddle || ''} ${invoice.guestLast || ''}</p>
            ${invoice.email ? `<p>Email: ${invoice.email}</p>` : ''}
            ${invoice.contact ? `<p>Phone: ${invoice.contact}</p>` : ''}
            ${invoice.address ? `<p>Address: ${invoice.address}</p>` : ''}
            ${invoice.city || invoice.state || invoice.pin ? `<p>${[invoice.city, invoice.state, invoice.pin].filter(Boolean).join(', ')}</p>` : ''}
          </td>
          <td>
            <strong>Hotel Details:</strong>
            ${hotelData?.address1 ? `<p>${hotelData.address1}</p>` : ''}
            ${hotelData?.contactNumber1 ? `<p>Phone: ${hotelData.contactNumber1}</p>` : ''}
            ${hotelData?.email1 ? `<p>Email: <span class="email">${hotelData.email1}</span></p>` : ''}
            ${hotelData?.gstNumber ? `<p>GST: ${hotelData.gstNumber}</p>` : ''}
          </td>
        </tr>
      </table>

      <!-- BOOKING -->
      <h3>Booking Details</h3>
      <table>
        <thead>
          <tr>
            <th>Room No</th>
            <th>Room Type</th>
            <th>Plan</th>
            <th>Check In</th>
            <th>Check Out</th>
            <th>Total Days</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${invoice.roomNumber || 'N/A'}</td>
            <td>${invoice.roomType || 'N/A'}</td>
            <td>${invoice.planType || 'N/A'}</td>
            <td>${invoice.checkIn ? new Date(invoice.checkIn).toLocaleDateString() : 'N/A'}</td>
            <td>${invoice.checkOut ? new Date(invoice.checkOut).toLocaleDateString() : 'N/A'}</td>
            <td>${invoice.totalDays || '1'}</td>
          </tr>
        </tbody>
      </table>

      <!-- PAYMENT -->
      <h3>Payment Summary</h3>
      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th>Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Room Charges (${invoice.roomType || 'N/A'})</td>
            <td>${parseFloat(invoice.roomPrice || 0).toFixed(2)}</td>
          </tr>
          ${invoice.cgst ? `
          <tr>
            <td>CGST (${invoice.cgstPercent || 0}%)</td>
            <td>${parseFloat(invoice.cgst || 0).toFixed(2)}</td>
          </tr>` : ''}
          ${invoice.sgst ? `
          <tr>
            <td>SGST (${invoice.sgstPercent || 0}%)</td>
            <td>${parseFloat(invoice.sgst || 0).toFixed(2)}</td>
          </tr>` : ''}
        </tbody>
        <tfoot>
          <tr>
            <td>Total Amount</td>
            <td>₹${(parseFloat(invoice.roomPrice || 0) + parseFloat(invoice.cgst || 0) + parseFloat(invoice.sgst || 0)).toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>

      <!-- FOOTER -->
      <div class="footer">
        <p>Thank you for choosing Hotel Shivan Residence. We look forward to serving you again!</p>
        <p>This is a computer-generated invoice. No signature is required.</p>
      </div>
    </div>
  </body>
</html>

      `;

      // Send the email via the Brevo API
      const response = await fetch('/api/brevo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: invoice.email,
          subject: `Your Invoice #${invoice._id?.slice(-6).toUpperCase() || 'N/A'}`,
          htmlContent: invoiceHtml,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send email');
      }

      toast.success('Invoice sent successfully!');
    } catch (error) {
      console.error('Error sending invoice email:', error);
      toast.error(error.message || 'Failed to send invoice email');
    } finally {
      setIsSendingEmail(false);
    }
  };

  // --- Handlers for CRUD actions ---
  function handleView(inv) {
    setViewInvoice(inv);
    setViewModalOpen(true);
  }
  function handleDelete(inv) {
    setDeleteTarget(inv);
    setDeleteDialogOpen(true);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      const res = await fetch('/api/roomInvoice', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteTarget._id })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Invoice deleted');
        fetchInvoices();
      } else {
        toast.error(data.error || 'Failed to delete invoice');
      }
    } catch (err) {
      toast.error('Failed to delete invoice');
    }
    setDeleteDialogOpen(false);
    setDeleteTarget(null);
  }

  function cancelDelete() {
    setDeleteDialogOpen(false);
    setDeleteTarget(null);
  }

  function handlePrint(inv) {
    const printWindow = window.open('', '_blank');



    // Calculate amounts
    const roomPrice = parseFloat(inv.roomPrice || 0);
    const totalDays = parseFloat(inv.totalDays || 0);

    // Initialize tax percentages and amounts
    let cgstPercent = parseFloat(inv.cgstPercent || 0);
    let sgstPercent = parseFloat(inv.sgstPercent || 0);
    let cgstAmount, sgstAmount;

    // Handle CGST
    if (inv.cgstAmount !== undefined && inv.cgstAmount !== null && inv.cgstAmount !== "") {
      cgstAmount = parseFloat(inv.cgstAmount) || 0;
      if (!cgstPercent && roomPrice > 0) {
        cgstPercent = (cgstAmount / roomPrice) * 100;
      }
    } else {
      cgstAmount = (roomPrice * cgstPercent / 100) || 0;
    }

    // Handle SGST
    if (inv.sgstAmount !== undefined && inv.sgstAmount !== null && inv.sgstAmount !== "") {
      sgstAmount = parseFloat(inv.sgstAmount) || 0;
      if (!sgstPercent && roomPrice > 0) {
        sgstPercent = (sgstAmount / roomPrice) * 100;
      }
    } else {
      sgstAmount = (roomPrice * sgstPercent / 100) || 0;
    }

    const total = (parseFloat(roomPrice) + parseFloat(cgstAmount) + parseFloat(sgstAmount)).toFixed(2);

    // Format guest name
    const guestName = `${inv.guestFirst || ''} ${inv.guestMiddle || ''} ${inv.guestLast || ''}`.trim();

    // Format dates
    const formatDate = (dateString) => {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN');
    };

    // Format currency
    const formatCurrency = (amount) => {
      return parseFloat(amount || 0).toLocaleString('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2
      });
    };

    const invoiceHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Room Food Invoice</title>
      <style>
        @media print {
          body { -webkit-print-color-adjust: exact; }
          .no-print { display: none !important; }
          @page { margin: 0; size: auto; }
        }
      </style>
    </head>
    <body style="font-family: Arial, sans-serif; margin:0; padding:10px; background:#f8f8f8;">
      <div style="max-width: 600px; margin: 0 auto;">
        <button onclick="window.print()" class="no-print" style="position:fixed; top:20px; right:20px; padding:10px 20px; background:#4CAF50; color:white; border:none; border-radius:4px; cursor:pointer; z-index:1000;">
          Print Invoice
        </button>
        
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff; border:1px solid #000; border-collapse:collapse; margin-bottom:20px;">
          <!-- Header -->
          <tr>
            <td colspan="6" style="background:#444; color:#fff; font-size:18px; font-weight:bold; padding:10px;">
              Room Invoice #${inv.invoiceNo || 'N/A'}
            </td>
          </tr>

          <!-- Company Name -->
          <tr>
            <td colspan="6" style="background:#5a8c80; color:#fff; text-align:center; font-size:20px; font-weight:bold; padding:8px;">
              Hotel Shivan Residence
            </td>
          </tr>

          <!-- Company Info -->
          <tr>
            <td colspan="6" style="padding:10px; font-size:14px; border-bottom:1px solid #000;">
              <table width="100%" cellpadding="6" cellspacing="0" style="font-size:14px;">
                <tr>
                  <td style="width:50%; vertical-align:top; text-align:left;">
                    Invoice #: ${inv.invoiceNo || 'N/A'}<br>
                    Date: ${formatDate(inv.createdAt) || 'N/A'}
                  </td>
                  <td style="width:50%; vertical-align:top; text-align:right;">
                    Contact: ${inv.contact || 'N/A'}<br>
                    Email: ${inv.email || 'N/A'}<br>
                    Address: ${inv.address ? inv.address.substring(0, 50) + (inv.address.length > 50 ? '...' : '') : 'N/A'}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Guest Info -->
          <tr style="background:#f2f2f2; border-bottom:1px solid #ddd;">
            <td colspan="6" style="padding:8px 12px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <strong>Room:</strong> ${inv.roomNumber || 'N/A'} (${inv.roomType || 'N/A'})
                </div>
                <div>
                  <strong>Plan:</strong> ${inv.planType || 'N/A'}
                </div>
              </div>
              
              <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
                <div>
                  <strong>Check-in:</strong> ${formatDate(inv.checkIn) || 'N/A'}
                </div>
                <div>
                  <strong>Check-out:</strong> ${formatDate(inv.checkOut) || 'N/A'}
                </div>
              </div>
            </td>
          </tr>
          <tr style="background:#f2f2f2; font-weight:bold; text-align:left;">
            <td colspan="6" style="padding:8px 12px; border-bottom:1px solid #000;">Guest: ${guestName || 'N/A'}</td>
          </tr>

          <!-- Table Header -->
          <tr style="background:#666; color:#fff; font-weight:bold; text-align:center;">
            <td style="padding:6px; border:1px solid #000;">S.no</td>
            <td style="padding:6px; border:1px solid #000;">Room Number</td>
            <td style="padding:6px; border:1px solid #000;">Room Type</td>
            <td style="padding:6px; border:1px solid #000;">Room Price</td>
            <td style="padding:6px; border:1px solid #000;">Days</td>
            <td style="padding:6px; border:1px solid #000;">Final Amount</td>
          </tr>

          <!-- Room Charges -->
          <tr>
            <td style="padding:8px; border:1px solid #000; text-align:center;">1</td>
            <td style="padding:8px; border:1px solid #000;">${inv.roomNumber || 'N/A'}</td>
            <td style="padding:8px; border:1px solid #000;">${inv.roomType || 'N/A'}</td>
            <td style="padding:8px; border:1px solid #000; text-align:center;">${formatCurrency(roomPrice)}</td>
            <td style="padding:8px; border:1px solid #000; text-align:center;">${totalDays}</td>
            <td style="padding:8px; border:1px solid #000; text-align:right;">${formatCurrency(roomPrice)}</td>
          </tr>
          <!-- Totals -->
          <tr>
            <td colspan="5" style="padding:8px; text-align:right; font-weight:bold; border:1px solid #000;">Room Charges</td>
            <td style="padding:8px; border:1px solid #000; text-align:right; background:#f0f0f0;">${formatCurrency(roomPrice)}</td>
          </tr>
          <tr>
  <td colspan="5" style="padding:8px; text-align:right; font-weight:bold; border:1px solid #000;">
    CGST ${inv.cgstAmount != null && inv.cgstAmount !== '' && !isNaN(inv.cgstAmount) && parseFloat(inv.cgstAmount) > 0
        ? `(₹ ${cgstAmount})`
        : `(${cgstPercent.toFixed(2)} %)`
      }
  </td>
  <td style="padding:8px; border:1px solid #000; text-align:right; background:#f0f0f0;">
    ${formatCurrency(cgstAmount)}
  </td>
</tr>

<tr>
  <td colspan="5" style="padding:8px; text-align:right; font-weight:bold; border:1px solid #000;">
    SGST ${inv.sgstAmount != null && inv.sgstAmount !== '' && !isNaN(inv.sgstAmount) && parseFloat(inv.sgstAmount) > 0
        ? `(₹ ${sgstAmount})`
        : `(${sgstPercent.toFixed(2)} %)`
      }
  </td>
  <td style="padding:8px; border:1px solid #000; text-align:right; background:#f0f0f0;">
    ${formatCurrency(sgstAmount)}
  </td>
</tr>

          <tr>
            <td colspan="5" style="padding:8px; text-align:right; font-weight:bold; border:1px solid #000; background:#e0e0e0;">Total Amount</td>
            <td style="padding:8px; border:1px solid #000; text-align:right; font-weight:bold; background:#5a8c80; color:white;">${formatCurrency(total)}</td>
          </tr>
          <!-- Footer Notes -->
          <tr>
            <td colspan="6" style="font-size:11px; padding:8px; border-top:1px solid #000; background:#f9f9f9;">
              <b>Note:</b> This is a computer-generated invoice. No signature is required.<br>
              <b>Disclaimer:</b> In case of any printing error or discrepancy, we sincerely apologize for the inconvenience.<br>
              Please verify all details before leaving the premises.<br>
              Thanks for your cooperation in advance.<br>
              <b>T&C Apply</b>
            </td>
          </tr>
        </table>
      </div>
    </body>
    </html>
  `;

    // Write the invoice to the new window
    printWindow.document.open();
    printWindow.document.write(invoiceHtml);
    printWindow.document.close();
    setPrintInvoice(null);
  }
  return (
    <div className="bg-white p-6 mt-4">
      <div className='w-[60vw] mx-auto border border-black p-4' >
        <div className="flex flex-wrap gap-4 mb-2">
          <div className="flex-1 min-w-[200px]">
            <Label className="block text-sm font-semibold">Room Number</Label>
            <Select
              name="roomNumber"
              value={form.roomNumber}
              onValueChange={value => {
                // Find the room by matching RoomNo as string
                const selectedRoom = roomInfoList.find(room =>
                  String(room.RoomNo) === String(value)
                );

                // Update form with selected room data
                setForm(prev => ({
                  ...prev,
                  roomNumber: value,
                  roomType: selectedRoom ? selectedRoom.type : '',
                  roomPrice: selectedRoom ? (selectedRoom.price || prev.roomPrice) : prev.roomPrice
                }));
              }}
              className="w-full rounded border border-black px-3 py-1"
            >
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
            <div className="flex items-center h-10 w-full rounded border border-black px-3 py-1">
              {form.roomType || 'Select a room to see type'}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 mb-2 items-end">
          <div className="flex-1 min-w-[200px]">
            <Label className="block text-sm font-semibold">Room Price</Label>
            <Input type="number" name="roomPrice" value={form.roomPrice} onChange={handleChange} placeholder="Enter Room Price" className="w-full rounded border border-black px-3 py-1" />
          </div>
          <span className="text-md py-2">/ Per Night</span>
          <div className="flex-1 min-w-[200px]">
            <Label className="block text-sm font-semibold">Plan type</Label>
            <Select name="planType" value={form.planType} onValueChange={value => setForm(f => ({ ...f, planType: value }))} className="w-full rounded border border-black px-3 py-1">
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {planTypes.map(p => <SelectItem key={p.label} value={p.label}>{p.label}</SelectItem>)}
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
            <Input type="number" name="totalDays" value={form.totalDays} onChange={handleChange} placeholder="Enter Total Days" className="w-full rounded border border-black px-3 py-1" />
          </div>
        </div>
        <hr className="border-cyan-500 my-2" />
        <div className="flex flex-wrap gap-4 mb-2">
          <div className="flex-1 min-w-[200px]">
            <Label className="block text-sm font-semibold">Tax CGST</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  type="number"
                  name="cgstPercent"
                  value={form.cgstPercent || ''}
                  onChange={e => setForm(f => ({ ...f, cgstPercent: e.target.value, cgstAmount: '' }))}
                  placeholder="%"
                  className="w-full rounded border border-black px-3 py-1"
                  min="0"
                  max="100"
                  disabled={!!form.cgstAmount} // Disable if cgstAmount has value
                />
              </div>
              <div className="flex-1">
                <Input
                  type="number"
                  name="cgstAmount"
                  value={form.cgstAmount || ''}
                  onChange={e => setForm(f => ({ ...f, cgstAmount: e.target.value, cgstPercent: '' }))}
                  placeholder="Amount"
                  className="w-full rounded border border-black px-3 py-1"
                  min="0"
                  disabled={!!form.cgstPercent} // Disable if cgstPercent has value
                />
              </div>
            </div>
          </div>
          <div className="flex-1 min-w-[200px]">
            <Label className="block text-sm font-semibold">Tax SGST</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  type="number"
                  name="sgstPercent"
                  value={form.sgstPercent || ''}
                  onChange={e => setForm(f => ({ ...f, sgstPercent: e.target.value, sgstAmount: '' }))}
                  placeholder="%"
                  className="w-full rounded border border-black px-3 py-1"
                  min="0"
                  max="100"
                  disabled={!!form.sgstAmount} // Disable if sgstAmount has value
                />
              </div>
              <div className="flex-1">
                <Input
                  type="number"
                  name="sgstAmount"
                  value={form.sgstAmount || ''}
                  onChange={e => setForm(f => ({ ...f, sgstAmount: e.target.value, sgstPercent: '' }))}
                  placeholder="Amount"
                  className="w-full rounded border border-black px-3 py-1"
                  min="0"
                  disabled={!!form.sgstPercent} // Disable if sgstPercent has value
                />
              </div>
            </div>
          </div>
        </div>
        <hr className="border-cyan-500 my-2" />
        <div className="flex-1 min-w-[150px]">
          <Label className="block text-sm font-semibold">Guest Name</Label>
          <div className="flex gap-2">
            <Input type="text" name="guestFirst" value={form.guestFirst} onChange={handleChange} placeholder="First" className="rounded border border-black px-2 py-1 w-1/3" />
            <Input type="text" name="guestMiddle" value={form.guestMiddle} onChange={handleChange} placeholder="Middle" className="rounded border border-black px-2 py-1 w-1/3" />
            <Input type="text" name="guestLast" value={form.guestLast} onChange={handleChange} placeholder="Last" className="rounded border border-black px-2 py-1 w-1/3" />
          </div>
        </div>
        <div className="flex flex-wrap gap-4 mb-2">
          <div className="flex-1 min-w-[120px]">
            <Label className="block text-sm font-semibold">Email Id</Label>
            <Input type="email" name="email" value={form.email} onChange={handleChange} placeholder="Select" className="w-full rounded border border-black px-3 py-1" />
          </div>
          <div className="flex-1 min-w-[150px]">
            <Label className="block text-sm font-semibold">Contact Number</Label>
            <Input type="text" name="contact" value={form.contact} onChange={handleChange} placeholder="Enter Contact Number" className="w-full rounded border border-black px-3 py-1" />
          </div>
        </div>
        <div className="flex flex-wrap gap-4 mb-2">
          <div className="flex-1 min-w-[120px]">
            <Label className="block text-sm font-semibold">City</Label>
            <Input type="text" name="city" value={form.city} onChange={handleChange} placeholder="Type" className="w-full rounded border border-black px-3 py-1" />
          </div>
          <div className="flex-1 min-w-[120px]">
            <Label className="block text-sm font-semibold">Pin Code</Label>
            <Input type="number" name="pin" value={form.pin} onChange={handleChange} placeholder="Pin Code" className="w-full rounded border border-black px-3 py-1" />
          </div>
          <div className="flex-1 min-w-[120px]">
            <Label className="block text-sm font-semibold">Select State</Label>
            <Select
              name="state"
              value={form.state}
              onValueChange={value => setForm(f => ({ ...f, state: value }))}
              className="w-full rounded border border-black px-3 py-1"
            >
              <SelectTrigger>
                <SelectValue placeholder="Select State" />
              </SelectTrigger>
              <SelectContent>
                {statesIndia.map((state) => (
                  <SelectItem key={state} value={state}>{state}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="mb-2">
          <Label className="block text-sm font-semibold">Address</Label>
          <Textarea name="address" value={form.address} onChange={handleChange} placeholder="Type Address" className="w-full rounded border border-black px-3 py-2" rows={2} />
        </div>
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
          <label className="block mb-2 font-semibold">Payment Method</label>
          <select
            name="paymentMode"
            value={form.paymentMode || ''}
            onChange={handleChange}
            className="w-full rounded border border-black px-3 py-2 mb-4"
          >
            <option value="">Select Payment Method</option>
            <option value="cash">Cash</option>
            <option value="online">Online</option>
          </select>
          {isEditing && (
            <Button type="button" className="bg-gray-300 hover:bg-gray-400 text-black font-bold px-8 py-2 rounded shadow" onClick={() => { setForm({ roomNumber: '', roomType: '', roomPrice: '', planType: '', checkIn: '', checkOut: '', totalDays: '', cgstPercent: '', cgstAmount: '', sgstPercent: '', sgstAmount: '', guestFirst: '', guestMiddle: '', guestLast: '', email: '', contact: '', city: '', pin: '', state: '', address: '', company: '', companyGst: '', anyCompany: '', paymentMode: '' }); setIsEditing(false); }}>
              Cancel Edit
            </Button>
          )}
          <Button
            type="submit" className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-2 rounded shadow mr-2"
            onClick={async () => {
              // Validation
              const requiredFields = [
                'roomNumber', 'roomType', 'roomPrice', 'planType', 'checkIn', 'checkOut', 'totalDays',
                'guestFirst', 'email', 'contact', 'city', 'pin', 'state'
              ];
              for (const field of requiredFields) {
                if (!form[field] || form[field].toString().trim() === '') {
                  toast.error('Please fill all required fields.');
                  return;
                }
              }
              // CGST: Only one filled, and at least one
              if (!(form.cgstPercent || form.cgstAmount)) {
                toast.error('Please fill either CGST percent or amount.');
                return;
              }
              if (form.cgstPercent && form.cgstAmount) {
                toast.error('Fill only one: CGST percent or amount.');
                return;
              }
              // SGST: Only one filled, and at least one
              if (!(form.sgstPercent || form.sgstAmount)) {
                toast.error('Please fill either SGST percent or amount.');
                return;
              }
              if (form.sgstPercent && form.sgstAmount) {
                toast.error('Fill only one: SGST percent or amount.');
                return;
              }
              if (form.paymentMode === 'cash') {
                try {
                  const res = await fetch('/api/roomInvoice', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      ...form,
                      cgstPercent: form.cgstPercent || null,
                      cgstAmount: form.cgstAmount || null,
                      sgstPercent: form.sgstPercent || null,
                      sgstAmount: form.sgstAmount || null,
                    }),
                  });
                  const data = await res.json();
                  if (res.ok) {
                    toast.success('Room Invoice saved successfully!');
                    setForm({
                      roomNumber: '', roomType: '', roomPrice: '', planType: '', checkIn: '', checkOut: '', totalDays: '',
                      cgstPercent: '', cgstAmount: '', sgstPercent: '', sgstAmount: '', guestFirst: '', guestMiddle: '', guestLast: '',
                      email: '', contact: '', city: '', pin: '', state: '', address: '', company: '', companyGst: '', anyCompany: '',
                      paymentMode: '',
                    });
                    fetchInvoices();
                  } else {
                    toast.error(data.error || 'Failed to save Room Invoice.');
                  }
                } catch (err) {
                  toast.error('Failed to save Room Invoice.');
                }
              } else if (form.paymentMode === 'online') {
                // Razorpay integration
                const loadRazorpayScript = () => {
                  return new Promise((resolve) => {
                    if (document.getElementById('razorpay-sdk')) {
                      return resolve(true);
                    }
                    const script = document.createElement('script');
                    script.id = 'razorpay-sdk';
                    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
                    script.onload = () => resolve(true);
                    script.onerror = () => resolve(false);
                    document.body.appendChild(script);
                  });
                };
                const roomPrice = parseFloat(form.roomPrice) || 0;
                let cgst = 0;
                let sgst = 0;
                if (form.cgstPercent) cgst = (roomPrice * parseFloat(form.cgstPercent) / 100);
                else if (form.cgstAmount) cgst = parseFloat(form.cgstAmount);
                if (form.sgstPercent) sgst = (roomPrice * parseFloat(form.sgstPercent) / 100);
                else if (form.sgstAmount) sgst = parseFloat(form.sgstAmount);
                const totalAmount = roomPrice + cgst + sgst;
                const loaded = await loadRazorpayScript();
                if (!loaded) {
                  toast.error('Failed to load Razorpay SDK.');
                  return;
                }
                // Create Razorpay order via backend
                let orderData;
                try {
                  const orderRes = await fetch('/api/razorpay', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      amount: Math.round(totalAmount * 100),
                      currency: 'INR',
                      receipt: `ROOM-${Date.now()}`,
                      notes: { roomNumber: form.roomNumber, guest: form.guestFirst }
                    })
                  });
                  orderData = await orderRes.json();
                  if (!orderRes.ok || !orderData.success || !orderData.order) {
                    toast.error(orderData.error || 'Failed to create payment order.');
                    return;
                  }
                } catch (err) {
                  toast.error('Failed to create Razorpay order.');
                  return;
                }
                // Open Razorpay modal
                const options = {
                  key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                  amount: Math.round(totalAmount * 100),
                  currency: 'INR',
                  name: 'Hotel Shivan Residence',
                  description: `Room Invoice Payment`,
                  order_id: orderData.order.id,
                  handler: async function (response) {
                    // Save invoice with Razorpay details
                    try {
                      const res = await fetch('/api/roomInvoice', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          ...form,
                          cgstPercent: form.cgstPercent || null,
                          cgstAmount: form.cgstAmount || null,
                          sgstPercent: form.sgstPercent || null,
                          sgstAmount: form.sgstAmount || null,
                          paymentMode: 'online',
                          paymentStatus: 'completed',
                          paymentResponse: response,
                          paidAmount: totalAmount,
                          dueAmount: 0,
                        }),
                      });
                      const data = await res.json();
                      if (res.ok) {
                        toast.success('Payment successful & Room Invoice saved!');
                        setForm({
                          roomNumber: '', roomType: '', roomPrice: '', planType: '', checkIn: '', checkOut: '', totalDays: '',
                          cgstPercent: '', cgstAmount: '', sgstPercent: '', sgstAmount: '', guestFirst: '', guestMiddle: '', guestLast: '',
                          email: '', contact: '', city: '', pin: '', state: '', address: '', company: '', companyGst: '', anyCompany: '',
                          paymentMode: '',
                        });
                        fetchInvoices();
                      } else {
                        toast.error(data.error || 'Failed to save Room Invoice after payment.');
                      }
                    } catch (err) {
                      toast.error('Failed to save Room Invoice after payment.');
                    }
                  },
                  prefill: {
                    name: form.guestFirst + ' ' + (form.guestLast || ''),
                    email: form.email,
                    contact: form.contact
                  },
                  theme: { color: '#3399cc' },
                  modal: {
                    ondismiss: function () {
                      toast.error('Payment cancelled.');
                    }
                  }
                };
                const rzp = new window.Razorpay(options);
                rzp.open();
              } else {
                toast.error('Please select a payment method.');
              }
            }}
          >
            {isEditing ? 'Update Invoice' : 'Save Invoice'}
          </Button>
        </div>
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
                <th className="bg-orange-500 text-black font-bold px-4 py-2 border border-white">Delete</th>
                <th className="bg-orange-500 text-black font-bold px-4 py-2 border border-white">Print Invoice</th>
                <th className="bg-orange-500 text-black font-bold px-4 py-2 border border-white">Send Invoice To Email</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-4">No invoices found.</td>
                </tr>
              ) : (
                invoices.map((inv, idx) => (
                  <tr key={inv._id || idx} className="text-center">
                    <td className="border px-4 py-2">{idx + 1}</td>
                    <td className="border px-4 py-2">{inv.invoiceNo || inv._id || '-'}</td>
                    <td className="border px-4 py-2">{inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : '-'}</td>
                    <td className="border px-4 py-2">
                      <button className="inline-flex items-center px-3 py-2 border border-transparent text-md font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-75" onClick={() => handleView(inv)}>View</button>
                    </td>
                    <td className="border px-4 py-2">
                      <button className="inline-flex items-center px-3 py-2 border border-transparent text-md font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-75" onClick={() => handleDelete(inv)}>Delete</button>
                    </td>
                    <td className="border px-4 py-2">
                      <button className="inline-flex items-center px-3 py-2 border border-transparent text-md font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-75" onClick={() => handlePrint(inv)}>
                        <Printer className="h-4 w-4 mr-1" />
                        Print
                      </button>
                    </td>
                    <td className="border py-2">
                      <button className="inline-flex items-center px-3 py-2 border border-transparent text-md font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-75" onClick={() => handleSendInvoiceEmail(inv)}>
                        {isSendingEmail ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        ) : (
                          <Mail className="h-4 w-4 mr-1" />
                        )}
                        Send Invoice To Email
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <SimpleModal open={viewModalOpen && !!viewInvoice} onClose={() => { setViewModalOpen(false); setViewInvoice(null); }}>
            {viewInvoice && (
              <div className="max-w-2xl mx-auto bg-white rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">Room Invoice Details</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DetailBox label="Invoice Number" value={viewInvoice.invoiceNo || viewInvoice._id || '-'} />
                  <DetailBox label="Date" value={viewInvoice.createdAt ? new Date(viewInvoice.createdAt).toLocaleDateString() : '-'} />
                  <DetailBox label="Room Number" value={viewInvoice.roomNumber || 'N/A'} />
                  <DetailBox label="Room Type" value={viewInvoice.roomType || 'N/A'} />
                  <DetailBox label="Room Price" value={`₹${parseFloat(viewInvoice.roomPrice || 0).toFixed(2)}`} />
                  <DetailBox label="Plan Type" value={viewInvoice.planType || 'N/A'} />
                  <DetailBox label="Check In" value={viewInvoice.checkIn || 'N/A'} />
                  <DetailBox label="Check Out" value={viewInvoice.checkOut || 'N/A'} />
                  <DetailBox label="Total Days" value={viewInvoice.totalDays || 'N/A'} />
                  <DetailBox label="CGST" value={viewInvoice.cgstPercent ? `${viewInvoice.cgstPercent}%` : viewInvoice.cgstAmount ? `₹${viewInvoice.cgstAmount}` : 'N/A'} />
                  <DetailBox label="SGST" value={viewInvoice.sgstPercent ? `${viewInvoice.sgstPercent}%` : viewInvoice.sgstAmount ? `₹${viewInvoice.sgstAmount}` : 'N/A'} />
                  <DetailBox
                    label="Total Amount Paid"
                    value={`₹${(
                      parseFloat(viewInvoice.roomPrice || 0) +
                      (viewInvoice.cgstPercent ? (parseFloat(viewInvoice.roomPrice || 0) * parseFloat(viewInvoice.cgstPercent) / 100) : parseFloat(viewInvoice.cgstAmount || 0)) +
                      (viewInvoice.sgstPercent ? (parseFloat(viewInvoice.roomPrice || 0) * parseFloat(viewInvoice.sgstPercent) / 100) : parseFloat(viewInvoice.sgstAmount || 0))
                    ).toFixed(2)}`}
                    className="font-bold border-t-2 border-gray-200 pt-2"
                  />
                  <DetailBox label="Guest Name" value={`${viewInvoice.guestFirst || ''} ${viewInvoice.guestMiddle || ''} ${viewInvoice.guestLast || ''}`.trim() || 'N/A'} />
                  <DetailBox label="Email" value={viewInvoice.email || 'N/A'} />
                  <DetailBox label="Contact" value={viewInvoice.contact || 'N/A'} />
                  <DetailBox label="City" value={viewInvoice.city || 'N/A'} />
                  <DetailBox label="Pin Code" value={viewInvoice.pin || 'N/A'} />
                  <DetailBox label="State" value={viewInvoice.state || 'N/A'} />
                  <DetailBox label="Address" value={viewInvoice.address || 'N/A'} />
                  <DetailBox label="Company" value={viewInvoice.company || 'N/A'} />
                  <DetailBox label="Company GST" value={viewInvoice.companyGst || 'N/A'} />
                  <DetailBox label="Payment Mode" value={viewInvoice.paymentMode || 'N/A'} />
                  <DetailBox label="Payment Status" value={viewInvoice.paymentStatus || 'N/A'} />
                </div>
              </div>
            )}
          </SimpleModal>
          <Dialog open={deleteDialogOpen} onOpenChange={open => { if (!open) cancelDelete(); }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Invoice</DialogTitle>
              </DialogHeader>
              <p>Are you sure you want to delete this invoice{deleteTarget ? ` #${deleteTarget.invoiceNo || deleteTarget._id}` : ''}?</p>
              <DialogFooter>
                <Button variant="secondary" onClick={cancelDelete}>Cancel</Button>
                <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          {/* Print-only invoice (hidden except during print) */}
          {printInvoice && (
            <div style={{ display: 'none' }}>
              <div id="print-section">
                <h2>Invoice #{printInvoice.invoiceNo || printInvoice._id}</h2>
                <pre>{JSON.stringify(printInvoice, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );


}


export default RoomInvoice;