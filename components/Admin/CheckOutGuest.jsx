"use client"
import React, { useState, useEffect, useRef } from 'react';
import { format, parseISO } from 'date-fns';
import { Search, User, Phone, Home, Loader2, Printer, Mail } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'react-hot-toast';
import dynamic from 'next/dynamic';

// Dynamically import html2pdf only on client side
let html2pdf;
if (typeof window !== 'undefined') {
  html2pdf = require('html2pdf.js');
}

const CheckOutGuest = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showCheckoutConfirm, setShowCheckoutConfirm] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isRazorpayLoaded, setIsRazorpayLoaded] = useState(false);
  const invoiceRef = useRef(null);
  const [invoiceData, setInvoiceData] = useState(null);
  const [loadingStates, setLoadingStates] = useState({
    downloadInvoice: false,
    sendEmail: false
  });
  const [isPdfDownload, setIsPdfDownload] = useState(false);

  const [hotelData, setHotelData] = useState(null);
  const hotelLogo = hotelData?.image?.url || '';
  const [invoiceUrl, setInvoiceUrl] = useState('');
  const [checkedOutGuests, setCheckedOutGuests] = useState([]);
  const [isLoadingCheckedOut, setIsLoadingCheckedOut] = useState(true);
  // console.log(hotelLogo)

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/addGuestToRoom?search=${encodeURIComponent(searchTerm)}`);
      if (!response.ok) throw new Error('Failed to search guests');

      const guests = await response.json();
      // console.log(searchResults)
      // Filter for checked-in guests only
      const checkedInGuests = guests.filter(guest => guest.status === 'checked-in');
      setSearchResults(checkedInGuests);

      if (checkedInGuests.length === 0) {
        toast.error('No checked-in guests found matching your search');
      }
    } catch (error) {
      console.error('Error searching guests:', error);
      toast.error('Failed to search guests');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTotal = (orders) => {
    return orders?.reduce((total, order) => total + (order.totalAmount || 0), 0) || 0;
  };

  const fetchCheckedOutGuests = async () => {
    try {
      setIsLoadingCheckedOut(true);
      const response = await fetch('/api/addGuestToRoom?status=checked-out');
      if (!response.ok) throw new Error('Failed to fetch checked-out guests');
      const data = await response.json();
      setCheckedOutGuests(data);
    } catch (error) {
      console.error('Error fetching checked-out guests:', error);
      toast.error('Failed to load checked-out guests');
    } finally {
      setIsLoadingCheckedOut(false);
    }
  };

  const completeCheckout = async () => {
    if (!selectedGuest) return;

    try {
      const response = await fetch(`/api/addGuestToRoom`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: selectedGuest._id,
          status: 'checked-out',
          actualCheckOut: new Date().toISOString(),
          roomId: selectedGuest.roomId,
          guestInfo: {
            name: selectedGuest.name,
            email: selectedGuest.email,
            phone: selectedGuest.phone,
            checkIn: selectedGuest.checkIn,
            checkOut: selectedGuest.checkOut,
            roomNumber: selectedGuest.roomNumber,
            roomType: selectedGuest.roomType,
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to process checkout');
      }

      // Update local state
      setSearchResults(prev => prev.filter(guest => guest._id !== selectedGuest._id));
      setSelectedGuest(null);
      setSearchTerm('');
      setShowCheckoutConfirm(false);

      // Refresh the checked-out guests list
      await fetchCheckedOutGuests();

      toast.success('Guest checked out successfully');
    } catch (error) {
      console.error('Error during checkout:', error);
      throw error;
    }
  };

  const handleCheckout = async () => {
    if (!selectedGuest) return;
    setIsCheckingOut(true);

    try {
      // Check for unpaid invoices
      const hasUnpaidOrders = selectedGuest.unpaidOrders?.length > 0;
      const hasUnpaidRoomInvoices = selectedGuest.unpaidRoomInvoices?.length > 0;
      const hasUnpaidInvoices = hasUnpaidOrders || hasUnpaidRoomInvoices;

      if (hasUnpaidInvoices) {
        // Calculate total amount from both orders and room invoices
        const ordersTotal = calculateTotal(selectedGuest.unpaidOrders || []);
        const roomInvoicesTotal = selectedGuest.unpaidRoomInvoices?.reduce((sum, invoice) => {
          const invoiceTotal = invoice.foodItems?.reduce((itemSum, item) =>
            itemSum + (item.totalAmount || 0), 0) || invoice.totalAmount || 0;
          return sum + invoiceTotal;
        }, 0) || 0;

        const totalAmount = ordersTotal + roomInvoicesTotal;

      }

      // If no unpaid invoices or total amount is zero, proceed with checkout
      await completeCheckout();
    } catch (error) {
      console.error('Error during checkout:', error);
      toast.error(error.message || 'Failed to process checkout');
    } finally {
      setIsCheckingOut(false);
    }
  };

  // Load Razorpay script
  const loadRazorpay = () => {
    return new Promise((resolve, reject) => {
      if (window.Razorpay) {
        setIsRazorpayLoaded(true);
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => {
        setIsRazorpayLoaded(true);
        resolve();
      };
      script.onerror = (error) => {
        toast.error('Failed to load payment processor');
        reject(new Error('Failed to load Razorpay'));
      };
      document.body.appendChild(script);
    });
  };

  useEffect(() => {
    // Load Razorpay script on component mount
    loadRazorpay().catch(error => {
      toast.error('Failed to load payment processor');
    });
  }, []);

  const processRazorpayPayment = async () => {
    if (!selectedGuest) return;

    setIsProcessingPayment(true);

    try {
      // Get all unpaid orders and invoices
      const orderIdsToProcess = selectedGuest.unpaidOrders?.map(order => order.orderId) || [];
      const roomInvoiceIdsToProcess = selectedGuest.unpaidRoomInvoices?.map(invoice => invoice._id?.toString()) || [];

      // console.log('Processing orders:', orderIdsToProcess, 'and invoices:', roomInvoiceIdsToProcess);

      // Calculate total amount from both orders and room invoices
      const ordersTotal = calculateTotal(selectedGuest.unpaidOrders || []);

      const roomInvoicesTotal = selectedGuest.unpaidRoomInvoices?.reduce((sum, invoice) => {
        const invoiceTotal = (invoice.foodItems || []).reduce((itemSum, item) =>
          itemSum + (item?.totalAmount || 0), 0) || invoice.totalAmount || 0;
        return sum + invoiceTotal;
      }, 0) || 0;

      const amount = Math.round((ordersTotal + roomInvoicesTotal) * 100); // Convert to paise and round

      if (amount <= 0) {
        // No payment needed, complete checkout directly
        await completeCheckout();
        return;
      }

      // Check if Razorpay is loaded
      if (!window.Razorpay) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Failed to load Razorpay'));
          document.body.appendChild(script);
        });
      }

      // Generate a shorter receipt ID (max 40 chars for Razorpay)
      const receipt = `INV-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      // console.log('Generated receipt ID:', receipt);

      // Determine the primary order type for Razorpay description
      let primaryType = '';
      if (roomInvoiceIdsToProcess.length > 0) {
        primaryType = 'room_invoice';
      } else if (orderIdsToProcess.length > 0) {
        primaryType = 'running_order';
      }

      // Create the Razorpay order with all order and invoice IDs in the notes
      const orderResponse = await fetch('/api/razorpay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amount,
          currency: 'INR',
          receipt,
          notes: {
            guestId: selectedGuest._id,
            orderIds: orderIdsToProcess,
            roomInvoiceIds: roomInvoiceIdsToProcess
          }
        })
      });

      const orderData = await orderResponse.json();

      if (!orderResponse.ok) {
        console.error('Failed to create payment order:', orderData);
        throw new Error(orderData.error?.description || 'Failed to create payment order');
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: amount,
        currency: 'INR',
        name: 'Hotel Shivan Residence',
        description: `Payment for ${orderIdsToProcess.length} order(s) and ${roomInvoiceIdsToProcess.length} invoice(s)`,
        order_id: orderData.order.id,
        handler: async function (response) {
          try {
            if (!response.razorpay_payment_id || !response.razorpay_order_id || !response.razorpay_signature) {
              throw new Error('Payment response is incomplete');
            }

            // Prepare the verification payload based on what we're processing
            const verificationPayload = {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              guestId: selectedGuest._id,
              // Only include what's actually being processed
              ...(orderIdsToProcess.length > 0 && { orderIds: orderIdsToProcess }),
              ...(roomInvoiceIdsToProcess.length > 0 && { roomInvoiceIds: roomInvoiceIdsToProcess }),
              // For backward compatibility
              orderId: orderIdsToProcess[0] || roomInvoiceIdsToProcess[0],
              // Only set type if we have a clear primary type
              ...(primaryType && { type: primaryType })
            };

            // Clean up the payload to remove undefined values
            Object.keys(verificationPayload).forEach(key =>
              verificationPayload[key] === undefined && delete verificationPayload[key]
            );

            // console.log('Verifying payment with payload:', verificationPayload);

            const verifyResponse = await fetch('/api/razorpay', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(verificationPayload)
            });

            const verifyResult = await verifyResponse.json();

            if (!verifyResponse.ok) {
              throw new Error(verifyResult.error || 'Payment verification failed');
            }

            // On successful payment verification, update the local state
            const updatedGuest = { ...selectedGuest };

            // Only update what was actually processed
            if (orderIdsToProcess.length > 0) {
              // Process orders
              updatedGuest.paidOrders = [
                ...(updatedGuest.paidOrders || []),
                ...(updatedGuest.unpaidOrders || [])
                  .filter(order => orderIdsToProcess.includes(order.orderId))
                  .map(order => ({
                    ...order,
                    paymentStatus: 'paid',
                    paidAt: new Date().toISOString(),
                    paymentMethod: 'online',
                    razorpayPaymentId: response.razorpay_payment_id,
                    razorpayOrderId: response.razorpay_order_id
                  }))
              ];

              // Remove processed orders from unpaid
              updatedGuest.unpaidOrders = (updatedGuest.unpaidOrders || [])
                .filter(order => !orderIdsToProcess.includes(order.orderId));
            }

            if (roomInvoiceIdsToProcess.length > 0) {
              // Process room invoices
              updatedGuest.paidRoomInvoices = [
                ...(updatedGuest.paidRoomInvoices || []),
                ...(updatedGuest.unpaidRoomInvoices || [])
                  .filter(invoice => roomInvoiceIdsToProcess.includes(invoice._id?.toString()))
                  .map(invoice => ({
                    ...invoice,
                    paymentStatus: 'completed',
                    paidAt: new Date().toISOString(),
                    paymentMethod: 'online',
                    razorpayPaymentId: response.razorpay_payment_id,
                    razorpayOrderId: response.razorpay_order_id
                  }))
              ];

              // Remove processed invoices from unpaid
              updatedGuest.unpaidRoomInvoices = (updatedGuest.unpaidRoomInvoices || [])
                .filter(invoice => !roomInvoiceIdsToProcess.includes(invoice._id?.toString()));
            }

            // Update the selected guest in state
            setSelectedGuest(updatedGuest);

            // Set invoice data for PDF generation
            setInvoiceData({
              guest: updatedGuest,
              orderIds: orderIdsToProcess,
              invoiceIds: roomInvoiceIdsToProcess,
              paymentId: response.razorpay_payment_id,
              timestamp: new Date().toISOString()
            });

            toast.success('Payment processed successfully!');

          } catch (error) {
            console.error('Payment processing error:', error);
            toast.error(error.message || 'Failed to process payment');
          } finally {
            setIsProcessingPayment(false);
          }
        },
        prefill: {
          name: selectedGuest.name || 'Guest',
          email: selectedGuest.email || '',
          contact: selectedGuest.phone || ''
        },
        theme: { color: '#4f46e5' },
        modal: {
          ondismiss: function () {
            // console.log('Payment modal dismissed');
            toast.error('Payment was cancelled');
            setIsProcessingPayment(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (error) {
      console.error('Payment processing error:', error);
      toast.error(error.message || 'Failed to process payment');
      setIsProcessingPayment(false);
    }
  };

  const handleProcessPayment = async () => {
    if (!selectedGuest) {
      toast.error('No guest selected');
      return;
    }

    const hasUnpaidOrders = selectedGuest.unpaidOrders?.length > 0;
    const hasUnpaidRoomInvoices = selectedGuest.unpaidRoomInvoices?.length > 0;

    if (!hasUnpaidOrders && !hasUnpaidRoomInvoices) {
      toast.error('No unpaid invoices found');
      return;
    }

    setIsProcessingPayment(true);

    try {
      const orderIds = selectedGuest.unpaidOrders?.map(order => order.orderId) || [];
      const roomInvoiceIds = selectedGuest.unpaidRoomInvoices?.map(invoice => invoice._id?.toString()) || [];

      // console.log('Processing payment for:', {
      //   orderIds,
      //   roomInvoiceIds,
      //   paymentMethod
      // });

      // Process both orders and room invoices in a single transaction
      if (paymentMethod === 'online') {
        // Pass both orderIds and roomInvoiceIds to the payment processor
        await processRazorpayPayment(orderIds);
        return;
      }

      // For cash payments - single API call for both orders and invoices
      const response = await fetch('/api/processPayment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestId: selectedGuest._id,
          orderIds: orderIds.length > 0 ? orderIds : undefined,
          roomInvoiceIds: roomInvoiceIds.length > 0 ? roomInvoiceIds : undefined,
          paymentMethod: 'cash',
          isCheckout: true // Indicate this is part of checkout
        })
      });

      const data = await response.json();
      // console.log('Payment API response:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Failed to process payment');
      }

      // Update local state to reflect the payment
      if (data.success) {
        // First update the local state for immediate UI feedback
        setSelectedGuest(prev => {
          const updatedState = { ...prev };

          // Mark orders as paid
          if (data.updatedOrders?.length > 0) {
            updatedState.unpaidOrders = prev.unpaidOrders?.filter(
              order => !data.updatedOrders.includes(order.orderId)
            ) || [];

            updatedState.paidOrders = [
              ...(prev.paidOrders || []),
              ...(prev.unpaidOrders?.filter(order =>
                data.updatedOrders.includes(order.orderId)
              ) || []).map(order => ({
                ...order,
                paymentMethod: 'cash',
                paymentStatus: 'paid',
                paidAt: new Date().toISOString()
              }))
            ];
          }

          // Mark room invoices as paid
          if (data.updatedRoomInvoices?.length > 0) {
            updatedState.unpaidRoomInvoices = prev.unpaidRoomInvoices?.filter(
              invoice => !data.updatedRoomInvoices.includes(invoice._id)
            ) || [];

            updatedState.paidRoomInvoices = [
              ...(prev.paidRoomInvoices || []),
              ...(prev.unpaidRoomInvoices?.filter(invoice =>
                data.updatedRoomInvoices.includes(invoice._id)
              ) || []).map(invoice => ({
                ...invoice,
                paymentMethod: 'cash',
                paymentStatus: 'paid',
                paidAt: new Date().toISOString()
              }))
            ];
          }

          return updatedState;
        });

        toast.success('Payment processed successfully');

        // Trigger a new search to refresh the table data
        if (searchTerm) {
          try {
            // First, reset the search results to show loading state
            setSearchResults([]);

            // Then perform a new search with the current search term
            const response = await fetch(`/api/addGuestToRoom?search=${encodeURIComponent(searchTerm)}`);
            if (!response.ok) throw new Error('Failed to refresh data');

            const guests = await response.json();
            const checkedInGuests = guests.filter(guest => guest.status === 'checked-in');
            setSearchResults(checkedInGuests);

            // If the selected guest is in the results, update it
            const updatedGuest = checkedInGuests.find(g => g._id === selectedGuest._id);
            if (updatedGuest) {
              setSelectedGuest(updatedGuest);
            }
          } catch (error) {
            console.error('Error refreshing data:', error);
            // Silently fail - the payment was still successful
          }
        }
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Failed to process payment');
    } finally {
      setIsProcessingPayment(false);
    }
  };
  const handleSendInvoiceEmail = async (guest) => {
    if (!guest?.email) {
      toast.error('No email address available for this guest');
      return;
    }

    setIsPdfDownload(true);

    try {
      // Get all items from all orders
      // Add this after the existing allItems mapping:
      const allItems = [
        // Paid orders items
        ...(guest.paidOrders || []).flatMap(order =>
          (order.items || []).map(item => ({
            ...item,
            _orderType: 'restaurant',
            _orderNumber: order.orderNumber,
            _orderDate: order.createdAt || new Date().toISOString()
          }))
        ),
        // Paid room invoices items
        ...(guest.paidRoomInvoices || []).flatMap(invoice => {
          if (!invoice) return [];
          const items = (invoice.foodItems || invoice.items || []).filter(Boolean);
          return items.map(item => ({
            ...item,
            _orderType: 'room_service',
            _orderNumber: invoice.orderNumber || invoice.invoiceNumber || 'N/A',
            _orderDate: invoice.createdAt || new Date().toISOString()
          }));
        })
      ];

      const itemsWithTaxes = allItems.map(item => {
        const price = parseFloat(item.price || 0);
        const quantity = parseInt(item.quantity) || 1;
        let cgstRate = parseFloat(item.cgstPercent || 0);
        let sgstRate = parseFloat(item.sgstPercent || 0);
        let cgstAmount = parseFloat(item.cgstAmount || 0);
        let sgstAmount = parseFloat(item.sgstAmount || 0);
        const itemSubtotal = price * quantity;

        // If tax amounts are 0 but we have rates, calculate them
        if ((!cgstAmount || cgstAmount === 0) && cgstRate > 0) {
          cgstAmount = (itemSubtotal * cgstRate) / 100;
        }
        if ((!sgstAmount || sgstAmount === 0) && sgstRate > 0) {
          sgstAmount = (itemSubtotal * sgstRate) / 100;
        }

        // If we have amounts but no rates, calculate the implied rates
        if ((!cgstRate || cgstRate === 0) && cgstAmount > 0) {
          cgstRate = (cgstAmount / itemSubtotal) * 100;
        }
        if ((!sgstRate || sgstRate === 0) && sgstAmount > 0) {
          sgstRate = (sgstAmount / itemSubtotal) * 100;
        }

        const itemTotal = itemSubtotal + cgstAmount + sgstAmount;

        return {
          ...item,
          _price: price,
          _quantity: quantity,
          _cgstRate: cgstRate,
          _sgstRate: sgstRate,
          _cgstAmount: cgstAmount,
          _sgstAmount: sgstAmount,
          _itemSubtotal: itemSubtotal,
          _itemTotal: itemTotal
        };
      });

      // Calculate totals
      const subtotal = itemsWithTaxes.reduce((sum, item) => sum + item._itemSubtotal, 0);
      const totalCGST = itemsWithTaxes.reduce((sum, item) => sum + item._cgstAmount, 0);
      const totalSGST = itemsWithTaxes.reduce((sum, item) => sum + item._sgstAmount, 0);
      const grandTotal = subtotal + totalCGST + totalSGST;

      // Generate the invoice HTML
      const invoiceHtml = `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; }
              .header { 
                background-color: #228b78; 
                color: white; 
                padding: 15px 0; 
                margin-bottom: 20px;
                text-align: center;
              }
              .header-content {
                max-width: 800px;
                margin: 0 auto;
                padding: 0 20px;
              }
              .logo-container {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
              }
              .logo {
                max-width: 100px;
                max-height: 80px;
                object-fit: contain;
                background-color: white;
                padding: 5px;
                border-radius: 4px;
              }
              .hotel-name {
                flex-grow: 1;
                text-align: center;
                margin: 0 20px;
              }
              .invoice-title {
                background-color: #1e1e1e;
                color: white;
                padding: 10px 0;
                margin: 0;
              }
              .invoice-info { 
                margin: 20px 0;
                padding: 0 20px;
              }
              table { 
                width: 100%; 
                border-collapse: collapse; 
                margin: 20px 0; 
                font-size: 14px;
              }
              th, td { 
                border: 1px solid #ddd; 
                padding: 10px; 
                text-align: left; 
              }
              th { 
                background-color: #f2f2f2; 
                font-weight: 600;
              }
              .total { 
                font-weight: bold; 
                text-align: right; 
              }
              .footer {
                margin-top: 30px;
                padding: 15px;
                background-color: #f9f9f9;
                border-top: 1px solid #eee;
                text-align: center;
                font-size: 12px;
                color: #666;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="header-content">
                <div class="logo-container">
                  ${hotelLogo ? `
                    <div>
                      <img src="${hotelLogo}" alt="Hotel Logo" class="logo" />
                    </div>
                  ` : ''}
                  <div class="hotel-name">
                    <h2 style="margin: 0; font-size: 24px;">HOTEL SHIVAN RESIDENCE</h2>
                    <p style="margin: 5px 0 0; font-size: 14px;">
                      ${hotelData?.address1 || 'Gali No 15, Canal Road, Gumaniwala, Rishikesh'}
                    </p>
                  </div>
                  <div style="width: 100px;"></div> <!-- For balance -->
                </div>
                <h1 class="invoice-title">RESTAURANT INVOICE</h1>
              </div>
            </div>
            
            <div style="max-width: 800px; margin: 0 auto; padding: 0 20px;">
              <!-- Invoice Header -->
              <div style="background-color: #f5f5f5; border: 1px solid #e0e0e0; border-radius: 5px; padding: 15px; margin-bottom: 20px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="width: 50%; vertical-align: top; padding: 5px 10px;">
                      <p style="margin: 8px 0;"><strong>Invoice #:</strong> INV-${Date.now().toString().slice(-4)}</p>
                      <p style="margin: 8px 0;"><strong>Date:</strong> ${new Date().toLocaleString()}</p>
                      <p style="margin: 8px 0;"><strong>Status:</strong> ${guest.paymentStatus || 'Paid'}</p>
                    </td>
                    <td style="width: 50%; vertical-align: top; text-align: right; padding: 5px 10px;">
                      <p style="margin: 8px 0;"><strong>Contact:</strong> ${hotelData?.contactNumber1 || '+91 1234567890'}</p>
                      <p style="margin: 8px 0;"><strong>Email:</strong> ${hotelData?.email1 || 'info@hotelshivan.com'}</p>
                      <p style="margin: 8px 0;"><strong>GSTIN:</strong> ${hotelData?.gstNumber || '12ABCDE3456F7Z8'}</p>
                    </td>
                  </tr>
                </table>
              </div>
              
              <!-- Guest Information -->
              <div style="background-color: #f5f5f5; border: 1px solid #e0e0e0; border-radius: 5px; padding: 15px; margin-bottom: 20px;">
                <h3 style="margin: 0 0 15px 0; font-size: 16px; font-weight: 600; color: #333; border-bottom: 1px solid #e0e0e0; padding-bottom: 8px;">Guest Information</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="width: 50%; vertical-align: top; padding: 5px 10px;">
                      <p style="margin: 8px 0;"><strong>Name:</strong> ${guest.name || 'N/A'}</p>
                      <p style="margin: 8px 0;"><strong>Email:</strong> ${guest.email || 'N/A'}</p>
                      <p style="margin: 8px 0;"><strong>Phone:</strong> ${guest.phone || 'N/A'}</p>
                    </td>
                    <td style="width: 50%; vertical-align: top; text-align: right; padding: 5px 10px;">
                      <p style="margin: 8px 0;"><strong>Room:</strong> ${guest.roomNumber || 'N/A'} (${guest.roomType || 'N/A'})</p>
                      <p style="margin: 8px 0;"><strong>Check-in:</strong> ${guest.checkIn ? new Date(guest.checkIn).toLocaleString() : 'N/A'}</p>
                      <p style="margin: 8px 0;"><strong>Check-out:</strong> ${guest.checkOut ? new Date(guest.checkOut).toLocaleString() : 'N/A'}</p>
                    </td>
                  </tr>
                </table>
            </div>
            
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Price</th>
                  <th>Qty</th>
                  <th>CGST</th>
                  <th>SGST</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsWithTaxes && itemsWithTaxes.length > 0 ? itemsWithTaxes.map((item, index) => (
        `<tr key="${index}">
                    <td>${item.name || 'N/A'}</td>
                    <td>₹${item._price.toFixed(2)}</td>
                    <td>${item._quantity}</td>
                    <td>${item._cgstRate > 0 ? `₹${item._cgstAmount.toFixed(2)}` : '-'}</td>
                    <td>${item._sgstRate > 0 ? `₹${item._sgstAmount.toFixed(2)}` : '-'}</td>
                    <td>₹${item._itemTotal.toFixed(2)}</td>
                  </tr>`
      )).join('') : `
                  <tr>
                    <td colspan="6" style="text-align: center;">No items found</td>
                  </tr>
                `}
              </tbody>
              <tfoot>
                <tr style="font-weight: bold; border-top: 1px solid #ddd;">
                  <td colspan="3" style="text-align: right; padding: 8px 12px;">Subtotal:</td>
                  <td colspan="2" style="text-align: right; padding: 8px 12px;">₹${subtotal.toFixed(2)}</td>
                  <td style="padding: 8px 12px;">₹${subtotal.toFixed(2)}</td>
                </tr>
                ${totalCGST > 0 ? `
                <tr style="font-weight: bold;">
                  <td colspan="3" style="text-align: right; padding: 8px 12px;">Total CGST:</td>
                  <td colspan="2" style="text-align: right; padding: 8px 12px;">₹${totalCGST.toFixed(2)}</td>
                  <td style="padding: 8px 12px;"></td>
                </tr>
                ` : ''}
                ${totalSGST > 0 ? `
                <tr style="font-weight: bold;">
                  <td colspan="3" style="text-align: right; padding: 8px 12px;">Total SGST:</td>
                  <td colspan="2" style="text-align: right; padding: 8px 12px;">₹${totalSGST.toFixed(2)}</td>
                  <td style="padding: 8px 12px;"></td>
                </tr>
                ` : ''}
                <tr style="font-weight: bold; border-top: 2px solid #228b78; font-size: 1.1em;">
                  <td colspan="3" style="text-align: right; padding: 12px;">Total Amount:</td>
                  <td colspan="2" style="text-align: right; padding: 12px;">${totalCGST > 0 || totalSGST > 0 ? '(Incl. Tax)' : ''}</td>
                  <td style="padding: 12px;">₹${grandTotal.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
            
            <p>Thank you for your stay with us!</p>
            </div>
            <div class="footer">
              <p>Thank you for choosing Hotel Shivan Residence. We look forward to serving you again!</p>
              <p>This is a computer-generated invoice. No signature is required.</p>
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
          to: guest.email,
          subject: `Your Invoice #INV-${Date.now().toString().slice(-6)}`,
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
      setIsPdfDownload(false);
    }
  };
  // Hidden div for PDF generation  
  const InvoiceTemplate = () => (
    <div style={{ position: 'absolute', left: '-9999px' }}>
      <div ref={invoiceRef}></div>
    </div>
  );

  // Fetch checked-out guests on component mount
  useEffect(() => {
    // Fetch hotel logo
    const fetchHotelData = async () => {
      try {
        const response = await fetch('/api/addBasicInfo');
        const data = await response.json();
        // console.log('Hotel Data:', data);
        if (data && data[0]) {
          setHotelData(data[0]);
        } else {
          // console.log('No hotel data found in the response');
        }
      } catch (error) {
        console.error('Error fetching hotel data:', error);
      }
    };

    fetchHotelData();
    fetchCheckedOutGuests();
  }, []);

  const handleDownloadCheckedOutInvoice = async (guest) => {
    try {
      // Set loading state for this specific guest
      setLoadingStates(prev => ({ ...prev, downloadInvoice: true }));

      // Format dates
      const checkInDate = guest.checkInDate ? new Date(guest.checkInDate) : null;
      const checkOutDate = guest.checkOutDate ? new Date(guest.checkOutDate) : null;
      const totalNights = checkInDate && checkOutDate ?
        Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)) : 0;

      // Process both paidOrders and paidRoomInvoices
      const processOrder = (order, type) => {
        if (!order) return [];
        const items = type === 'restaurant' 
          ? order.items || []
          : (order.foodItems || order.items || []);
          
        return items.map(item => {
          if (!item) return null;
          
          const price = parseFloat(item.price || 0);
          const quantity = parseInt(item.quantity || item.qty || 1);
          const itemSubtotal = price * quantity;

          // Get tax rates - use the item's tax data if available, otherwise default to 0
          let cgstRate = parseFloat(item.cgstPercent || 0);
          let sgstRate = parseFloat(item.sgstPercent || 0);

          // Calculate tax amounts - use pre-calculated amounts if available, otherwise calculate
          let cgstAmount = parseFloat(item.cgstAmount || 0);
          let sgstAmount = parseFloat(item.sgstAmount || 0);

          // If tax amounts are 0 but we have rates, calculate them
          if ((!cgstAmount || cgstAmount === 0) && cgstRate > 0) {
            cgstAmount = (itemSubtotal * cgstRate) / 100;
          }

          if ((!sgstAmount || sgstAmount === 0) && sgstRate > 0) {
            sgstAmount = (itemSubtotal * sgstRate) / 100;
          }

          // If we have amounts but no rates, calculate the implied rates
          if ((!cgstRate || cgstRate === 0) && cgstAmount > 0) {
            cgstRate = (cgstAmount / itemSubtotal) * 100;
          }

          if ((!sgstRate || sgstRate === 0) && sgstAmount > 0) {
            sgstRate = (sgstAmount / itemSubtotal) * 100;
          }

          const itemTotal = itemSubtotal + cgstAmount + sgstAmount;

          return {
            ...item,
            _price: price,
            _quantity: quantity,
            _cgstRate: cgstRate,
            _sgstRate: sgstRate,
            _cgstAmount: cgstAmount,
            _sgstAmount: sgstAmount,
            _itemSubtotal: itemSubtotal,
            _itemTotal: itemTotal,
            _orderType: type,
            _orderNumber: order.orderNumber || order.invoiceNumber,
            _orderDate: order.createdAt || new Date().toISOString()
          };
        }).filter(Boolean); // Remove any null items
      };

      // Process all orders and invoices
      const allItems = [
        ...(guest.paidOrders || []).flatMap(order => processOrder(order, 'restaurant')),
        ...(guest.paidRoomInvoices || []).flatMap(invoice => processOrder(invoice, 'room_service'))
      ];

      // Filter out any null/undefined items that might have snuck through
      const itemsWithTaxes = allItems.filter(Boolean);

      // Calculate totals
      const subtotal = itemsWithTaxes.reduce((sum, item) => sum + (item._itemSubtotal || 0), 0);
      const totalCGST = itemsWithTaxes.reduce((sum, item) => sum + (item._cgstAmount || 0), 0);
      const totalSGST = itemsWithTaxes.reduce((sum, item) => sum + (item._sgstAmount || 0), 0);
      const grandTotal = subtotal + totalCGST + totalSGST;
         
      // Create invoice HTML
      const invoiceHtml = `
        <div style="width: 100%; max-width: 800px; margin: 0 auto; border: 1px solid #eee; border-radius: 5px; overflow: hidden;">
          <!-- Header with Logo -->
          <div style="display: flex; justify-content: space-between; align-items: center; background-color: #228b78; color: white; padding: 10px 20px;">
            ${hotelLogo ? `
              <div style="width: 80px; height: 80px; display: flex; align-items: center;background-color: #fff">
                <img src="${hotelLogo}" alt="Hotel Logo" style="max-width: 100%; max-height: 100%; object-fit: contain;"/>
              </div>
            ` : ''}
                    <!-- Company Name -->
          <div style="color: white; padding: 10px 0; text-align: center;">
            <h2 style="margin: 0; font-size: 22px; font-weight: bold;">HOTEL SHIVAN RESIDENCE</h2>
          </div>
      
            ${hotelLogo ? '<div style="width: 80px;"></div>' : ''} <!-- Empty div for balance -->
          </div>
                <div style="flex-grow: 1; text-align: center;">
              <h1 style="margin: 0; font-size: 20px; font-weight: bold;">GUEST INVOICE</h1>
            </div>
          <!-- Invoice Info -->
          <div style="border: 1px solid #e0e0e0; border-radius: 5px; margin: 15px; padding: 12px; font-size: 12px;">
            <div style="display: flex; justify-content: space-between; flex-wrap: wrap;">
              <div>
                <p style="margin: 6px 0;"><strong>Invoice #:</strong> ${guest.bookingId || `INV-${Date.now().toString().slice(-6)}`}</p>
                <p style="margin: 6px 0;"><strong>Date:</strong> ${new Date().toLocaleString()}</p>
                <p style="margin: 6px 0;"><strong>Status:</strong> ${guest.paymentStatus || 'Paid'}</p>
              </div>
              <div style="text-align: right;">
                <p style="margin: 6px 0;"><strong>Contact:</strong> ${hotelData?.contactNumber1 || '+91 1234567890'}</p>
                <p style="margin: 6px 0;"><strong>Email:</strong> ${hotelData?.email1 || 'info@hotelshivan.com'}</p>
                <p style="margin: 6px 0;"><strong>GSTIN:</strong> ${hotelData?.gstNumber || '12ABCDE3456F7Z8'}</p>
              </div>
            </div>
          </div>
          
          <!-- Guest Info -->
          <div style="background-color: #f5f5f5; border: 1px solid #e0e0e0; border-radius: 5px; margin: 0 15px 15px; padding: 12px;">
            <h3 style="margin: 0 0 10px 0; font-size: 14px; font-weight: 600;">Guest Information</h3>
            <p style="margin: 6px 0;"><strong>Name:</strong> ${guest.guestName || 'Guest'}</p>
            ${guest.phoneNumber ? `<p style="margin: 6px 0;"><strong>Phone:</strong> ${guest.phoneNumber}</p>` : ''}
            ${guest.email ? `<p style="margin: 6px 0;"><strong>Email:</strong> ${guest.email}</p>` : ''}
            ${guest.roomNumber ? `<p style="margin: 6px 0;"><strong>Room:</strong> ${guest.roomNumber} ${guest.roomType ? `(${guest.roomType})` : ''}</p>` : ''}
            ${checkInDate ? `<p style="margin: 6px 0;"><strong>Check-in:</strong> ${format(checkInDate, 'PPpp')}</p>` : ''}
            ${checkOutDate ? `<p style="margin: 6px 0;"><strong>Check-out:</strong> ${format(checkOutDate, 'PPpp')}</p>` : ''}
            ${totalNights > 0 ? `<p style="margin: 6px 0;"><strong>Duration:</strong> ${totalNights} ${totalNights === 1 ? 'night' : 'nights'}</p>` : ''}
          </div>
          
          <!-- Items Table -->
          <div style="margin: 0 15px 20px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
              <thead>
                <tr style="background-color: #228b78; color: white;">
                  <th style="padding: 8px; text-align: left; border: 1px solid #1a6b5d;">Item</th>
                  <th style="padding: 8px; text-align: right; border: 1px solid #1a6b5d;">Price</th>
                  <th style="padding: 8px; text-align: center; border: 1px solid #1a6b5d;">Qty</th>
                  <th style="padding: 8px; text-align: right; border: 1px solid #1a6b5d;">CGST</th>
                  <th style="padding: 8px; text-align: right; border: 1px solid #1a6b5d;">SGST</th>
                  <th style="padding: 8px; text-align: right; border: 1px solid #1a6b5d;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsWithTaxes.length > 0 ? itemsWithTaxes.map((item, index) => (
        `<tr key="${index}">
                    <td style="padding: 8px; border: 1px solid #e0e0e0;">${item.name || 'N/A'}</td>
                    <td style="padding: 8px; text-align: right; border: 1px solid #e0e0e0;">₹${item._price.toFixed(2)}</td>
                    <td style="padding: 8px; text-align: center; border: 1px solid #e0e0e0;">${item._quantity}</td>
                    <td style="padding: 8px; text-align: right; border: 1px solid #e0e0e0;">
                      ${item._cgstRate > 0 ? `₹${item._cgstAmount.toFixed(2)}` : '-'}
                    </td>
                    <td style="padding: 8px; text-align: right; border: 1px solid #e0e0e0;">
                      ${item._sgstRate > 0 ? `₹${item._sgstAmount.toFixed(2)}` : '-'}
                    </td>
                    <td style="padding: 8px; text-align: right; border: 1px solid #e0e0e0;">₹${item._itemTotal.toFixed(2)}</td>
                  </tr>`
      )).join('') : `
                  <tr>
                    <td colspan="6" style="padding: 8px; text-align: center; border: 1px solid #e0e0e0;">No items found</td>
                  </tr>
                `}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="3" style="text-align: right; padding: 8px; font-weight: bold; border-top: 1px solid #ddd;">Subtotal:</td>
                  <td colspan="2" style="text-align: right; padding: 8px; font-weight: bold; border-top: 1px solid #ddd;">₹${subtotal.toFixed(2)}</td>
                  <td style="text-align: right; padding: 8px; font-weight: bold; border-top: 1px solid #ddd;">₹${subtotal.toFixed(2)}</td>
                </tr>
                ${totalCGST > 0 ? `
                <tr>
                  <td colspan="3" style="text-align: right; padding: 5px 8px;">Total CGST:</td>
                  <td colspan="2" style="text-align: right; padding: 5px 8px;">₹${totalCGST.toFixed(2)}</td>
         
                </tr>
                ` : ''}
                ${totalSGST > 0 ? `
                <tr>
                  <td colspan="3" style="text-align: right; padding: 5px 10px;">Total SGST:</td>
                  <td colspan="2" style="text-align: right; padding: 5px 10px;">₹${totalSGST.toFixed(2)}</td>
        
                </tr>
                ` : ''}
                <tr>
                  <td colspan="3" style="text-align: right; padding: 10px; font-weight: bold; font-size: 1.1em; border-top: 2px solid #228b78;">
                    Total Amount:
                  </td>
                  <td colspan="2" style="text-align: right; padding: 10px; font-weight: bold; font-size: 1.1em; border-top: 2px solid #228b78;">
                    ${totalCGST > 0 || totalSGST > 0 ? '(Incl. Tax)' : ''}
                  </td>
                  <td style="text-align: right; padding: 10px; font-weight: bold; font-size: 1.1em; border-top: 2px solid #228b78;">
                    ₹${grandTotal.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>         <!-- Footer -->
          <div style="background-color: #f9f9f9; padding: 10px; text-align: center; color: #666; font-size: 10px; border-top: 1px solid #eee;">
            <p style="margin: 5px 0;">* This is a computer generated invoice, no signature required.</p>
            <p style="margin: 5px 0;">* Thank you for staying with us!</p>
          </div>
        </div>
      `;

      // Create a temporary element to hold the invoice content
      const element = document.createElement('div');
      element.innerHTML = invoiceHtml;
      document.body.appendChild(element);

      // Generate PDF
      const opt = {
        margin: 10,
        filename: `invoice-${Date.now()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: true
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait'
        }
      };

      // Generate and save PDF
      if (typeof window === 'undefined' || !html2pdf) return;

      await html2pdf()
        .set(opt)
        .from(element)
        .toPdf()
        .get('pdf')
        .then(function (pdf) {
          // Get the PDF as a blob
          const blob = pdf.output('blob');
          // Create a download link
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `invoice-${Date.now()}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        });

      // Clean up
      document.body.removeChild(element);
      toast.success('Invoice downloaded successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate invoice: ' + (error.message || 'Unknown error'));
    } finally {
      // Always reset loading state when operation is complete
      setLoadingStates(prev => ({ ...prev, downloadInvoice: false }));
    }
  };
  // console.log(checkedOutGuests)
  return (
    <div className="space-y-6">
      <InvoiceTemplate />
      <Card>
        <CardHeader>
          <CardTitle>Check Out Guest</CardTitle>
          <CardDescription>
            Search for a guest by name, room number, or phone number to process checkout
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, room number, or phone"
                className="pl-9"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  if (!e.target.value.trim()) {
                    setSearchResults([]);
                  }
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                disabled={isLoading}
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={isLoading || !searchTerm.trim()}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : 'Search'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results</CardTitle>
            <CardDescription>
              {searchResults.length} guest{searchResults.length !== 1 ? 's' : ''} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {searchResults.map((guest) => (
                <div
                  key={guest._id}
                  className={`p-4 border rounded-lg ${selectedGuest?._id === guest._id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                    }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{guest.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span>{guest.phone || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4 text-muted-foreground" />
                        <span>Room {guest.roomNumber} - {guest.roomType || 'Standard'}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Check-in: {guest.checkIn ? format(parseISO(guest.checkIn), 'MMM d, yyyy') : 'N/A'}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedGuest(guest);
                        setShowCheckoutConfirm(true);
                      }}
                      className="whitespace-nowrap"
                    >
                      Check Order
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      {selectedGuest && (
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          {(selectedGuest?.unpaidOrders?.length > 0 || selectedGuest?.unpaidRoomInvoices?.length > 0) && (
            <div className="space-y-4">
              {/* Unpaid Orders */}
              {selectedGuest?.unpaidOrders?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Unpaid Orders</h4>
                  <div className="border rounded-md">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order #</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedGuest.unpaidOrders.map((order) => (
                          <tr key={order._id}>
                            <td className="px-4 py-2 text-sm">{order.orderNumber}</td>
                            <td className="px-4 py-2 text-sm text-muted-foreground">
                              {format(parseISO(order.createdAt), 'MMM d, yyyy HH:mm')}
                            </td>
                            <td className="px-4 py-2 text-sm text-right">
                              ₹{order.totalAmount?.toLocaleString('en-IN')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Unpaid Room Invoices */}
              {selectedGuest?.unpaidRoomInvoices?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Unpaid Room Invoices</h4>
                  <div className="border rounded-md">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice #</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedGuest.unpaidRoomInvoices.map((invoice) => {
                          const totalAmount = invoice.foodItems?.reduce((sum, item) => sum + (item.totalAmount || 0), 0) || invoice.totalAmount || 0;

                          return (
                            <tr key={invoice.invoiceId || invoice._id}>
                              <td className="px-4 py-2 text-sm">{invoice.invoiceNo}</td>
                              <td className="px-4 py-2 text-sm text-muted-foreground">
                                {format(parseISO(invoice.invoiceDate), 'MMM d, yyyy HH:mm')}
                              </td>
                              <td className="px-4 py-2 text-sm">
                                {invoice.paymentMode === 'room' ? 'Room Charge' : 'Restaurant'}
                              </td>
                              <td className="px-4 py-2 text-sm text-right">
                                ₹{totalAmount.toLocaleString('en-IN')}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Total Due */}
              <div className="border-t pt-2">
                <div className="flex justify-end">
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">
                      Orders: ₹{calculateTotal(selectedGuest.unpaidOrders || []).toLocaleString('en-IN')}
                    </div>
                    {selectedGuest?.unpaidRoomInvoices?.length > 0 && (
                      <div className="text-sm text-muted-foreground">
                        Room Invoices: ₹{(
                          selectedGuest.unpaidRoomInvoices.reduce((sum, invoice) => {
                            const invoiceTotal = invoice.foodItems?.reduce((itemSum, item) =>
                              itemSum + (item.totalAmount || 0), 0) || invoice.totalAmount || 0;
                            return sum + invoiceTotal;
                          }, 0)
                        ).toLocaleString('en-IN')}
                      </div>
                    )}
                    <div className="text-lg font-semibold mt-1">
                      Total Due: ₹{(
                        calculateTotal(selectedGuest.unpaidOrders || []) +
                        (selectedGuest.unpaidRoomInvoices?.reduce((sum, invoice) => {
                          const invoiceTotal = invoice.foodItems?.reduce((itemSum, item) =>
                            itemSum + (item.totalAmount || 0), 0) || invoice.totalAmount || 0;
                          return sum + invoiceTotal;
                        }, 0) || 0)
                      ).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="space-y-2 pt-4">
                <h4 className="font-medium">Payment Method</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                    onClick={() => setPaymentMethod('cash')}
                    className="justify-start"
                  >
                    💵 Cash
                  </Button>
                  <Button
                    variant={paymentMethod === 'online' ? 'default' : 'outline'}
                    onClick={() => setPaymentMethod('online')}
                    className="justify-start"
                  >
                    💳 Online Payment
                  </Button>
                </div>
              </div>

              <Button
                onClick={handleProcessPayment}
                className="w-full mt-4"
                disabled={isProcessingPayment}
              >
                {isProcessingPayment ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : 'Process Payment'}
              </Button>
            </div>
          )}
          {(selectedGuest?.paidOrders?.length > 0 || selectedGuest?.paidRoomInvoices?.length > 0) && (
            <div className="space-y-4">
              {/* Paid Orders */}
              {selectedGuest?.paidOrders?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Paid Orders</h4>
                  <div className="border rounded-md">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order #</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedGuest.paidOrders.map((order) => (
                          <tr key={order._id}>
                            <td className="px-4 py-2 text-sm">{order.orderNumber}</td>
                            <td className="px-4 py-2 text-sm text-muted-foreground">
                              {format(parseISO(order.createdAt), 'MMM d, yyyy HH:mm')}
                            </td>
                            <td className="px-4 py-2 text-sm text-right">
                              ₹{order.totalAmount?.toLocaleString('en-IN')}
                            </td>
                            <td className="px-4 py-2">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Paid
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Paid Room Invoices */}
              {selectedGuest?.paidRoomInvoices?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Paid Room Invoices</h4>
                  <div className="border rounded-md">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice #</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {(selectedGuest?.paidRoomInvoices || []).map((invoice) => {
                          if (!invoice) return null; // Skip if invoice is null/undefined
                          const totalAmount = Array.isArray(invoice.foodItems)
                            ? invoice.foodItems.reduce((sum, item) => sum + (item?.totalAmount || 0), 0)
                            : (invoice?.totalAmount || 0);

                          return (
                            <tr key={invoice.invoiceId || invoice._id}>
                              <td className="px-4 py-2 text-sm">{invoice.invoiceNo}</td>
                              <td className="px-4 py-2 text-sm text-muted-foreground">
                                {format(parseISO(invoice.invoiceDate || invoice.createdAt), 'MMM d, yyyy HH:mm')}
                              </td>
                              <td className="px-4 py-2 text-sm">
                                {invoice.paymentMode === 'room' ? 'Room Charge' : 'Restaurant'}
                              </td>
                              <td className="px-4 py-2 text-sm text-right">
                                ₹{totalAmount.toLocaleString('en-IN')}
                              </td>
                              <td className="px-4 py-2">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  {invoice.paymentStatus || 'Paid'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Total Summary */}
              <div className="border-t pt-2">
                <div className="flex justify-end">
                  <div className="text-right space-y-1">
                    {selectedGuest?.paidOrders?.length > 0 && (
                      <div className="text-sm text-muted-foreground">
                        Orders Total: ₹{calculateTotal(selectedGuest.paidOrders || []).toLocaleString('en-IN')}
                      </div>
                    )}
                    {selectedGuest?.paidRoomInvoices?.length > 0 && (
                      <div className="text-sm text-muted-foreground">
                        Room Invoices: ₹{(
                          (selectedGuest.paidRoomInvoices || []).reduce((sum, invoice) => {
                            if (!invoice) return sum;
                            const itemsTotal = Array.isArray(invoice.foodItems)
                              ? invoice.foodItems.reduce((itemSum, item) =>
                                itemSum + (item?.totalAmount || 0), 0)
                              : 0;
                            const invoiceTotal = itemsTotal || invoice?.totalAmount || 0;
                            return sum + invoiceTotal;
                          }, 0)
                        ).toLocaleString('en-IN')}
                      </div>
                    )}
                    <div className="text-lg font-semibold mt-1">
                      Grand Total: ₹{(
                        calculateTotal(selectedGuest?.paidOrders || []) +
                        ((selectedGuest?.paidRoomInvoices || []).reduce((sum, invoice) => {
                          if (!invoice) return sum;
                          const itemsTotal = Array.isArray(invoice.foodItems)
                            ? invoice.foodItems.reduce((itemSum, item) =>
                              itemSum + (item?.totalAmount || 0), 0)
                            : 0;
                          const invoiceTotal = itemsTotal || invoice?.totalAmount || 0;
                          return sum + invoiceTotal;
                        }, 0) || 0)
                      ).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="flex gap-2 items-center justify-end pt-4">
            {invoiceUrl && (
              <a
                href={invoiceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
              >
                <Printer className="mr-2 h-4 w-4" />
                Download Invoice
              </a>
            )}
            <div className="space-x-2">
              <span className="text-sm text-muted-foreground mr-2">
                {selectedGuest?.unpaidOrders?.length > 0
                  ? `${selectedGuest.unpaidOrders.length} unpaid order(s) remaining`
                  : 'All orders paid'}
              </span>
              <Button
                onClick={handleCheckout}
                disabled={isCheckingOut || isProcessingPayment || (selectedGuest?.unpaidOrders?.length > 0)}
                variant={selectedGuest?.unpaidOrders?.length > 0 ? 'outline' : 'default'}
              >
                {isCheckingOut ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : 'Complete Checkout'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Checked-out Guests</h2>

        {isLoadingCheckedOut ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          </div>
        ) : checkedOutGuests.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No checked-out guests found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Guest Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Room Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stay Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Billing
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {checkedOutGuests.map((guest) => {
                  const checkInDate = guest.checkIn ? new Date(guest.checkIn) : null;
                  const checkOutDate = guest.checkOut ? new Date(guest.checkOut) : null;
                  const totalNights = checkInDate && checkOutDate ?
                    Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)) : 0;

                  return (
                    <tr key={guest._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="font-medium text-gray-900">
                            {guest.name || 'N/A'}
                          </div>
                          {guest.phoneNumber && (
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {guest.phoneNumber}
                            </div>
                          )}
                          {guest.email && (
                            <div className="text-sm text-gray-500">
                              {guest.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="font-medium">
                            {guest.roomNumber || 'N/A'}
                            {guest.roomType && ` (${guest.roomType})`}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="text-sm">
                            <span className="font-medium">Check-in:</span>{" "}
                            {checkInDate ? format(checkInDate, 'PPp') : 'N/A'}
                          </div>
                          <div className="text-sm">
                            <span className="font-medium">Check-out:</span>{" "}
                            {checkOutDate ? format(checkOutDate, 'PPp') : 'N/A'}
                          </div>
                          {totalNights > 0 && (
                            <div className="text-sm text-gray-500">
                              {totalNights} {totalNights === 1 ? 'night' : 'nights'}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {(guest.paidOrders?.length > 0 || guest.paidRoomInvoices?.length > 0) && (
                            <div className="font-medium">
                              Total: ₹{
                                (guest.paidOrders?.reduce((sum, order) => sum + (order.totalAmount || 0), 0) || 0) +
                                (guest.paidRoomInvoices?.reduce((sum, invoice) => {
                                  if (!invoice) return sum;
                                  const invoiceTotal = Array.isArray(invoice?.foodItems)
                                    ? invoice.foodItems.reduce((sum, item) => sum + (item?.totalAmount || 0), 0)
                                    : (invoice?.totalAmount || 0);
                                  return sum + (invoiceTotal || 0);
                                }, 0) || 0)
                              }
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex items-center flex-row gap-5 justify-center">
                        <div className="flex flex-col space-y-2">
                          <button
                            onClick={() => handleDownloadCheckedOutInvoice(guest)}
                            disabled={loadingStates.downloadInvoice}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-md font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-75"
                          >
                            {loadingStates.downloadInvoice ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-1" />
                            ) : (
                              <Printer className="h-4 w-4 mr-1" />
                            )}
                            Invoice
                          </button>
                          {/* {guest.invoiceId && (
                            <a
                              href={`/api/invoices/${guest.invoiceId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                              View Invoice
                            </a>
                          )} */}
                        </div>
                        <div className="flex flex-col space-y-2">
                          <button
                            onClick={() => handleSendInvoiceEmail(guest)}
                            disabled={loadingStates.sendEmail}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-md font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-75"
                          >
                            {isPdfDownload ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-1" />
                            ) : (
                              <Mail className="h-4 w-4 mr-1" />
                            )}
                            Send Invoice To Email
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
export default CheckOutGuest;
