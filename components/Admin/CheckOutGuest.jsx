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
  const [hotelData, setHotelData] = useState(null);
  const hotelLogo = hotelData?.image?.url || '';
  const [invoiceUrl, setInvoiceUrl] = useState('');
  const [checkedOutGuests, setCheckedOutGuests] = useState([]);
  const [isLoadingCheckedOut, setIsLoadingCheckedOut] = useState(true);
  const[isGeneratingPdf,setisGeneratingPdf]=useState(false)
  console.log(hotelLogo)

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/addGuestToRoom?search=${encodeURIComponent(searchTerm)}`);
      if (!response.ok) throw new Error('Failed to search guests');

      const guests = await response.json();
      console.log(response)
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

  const handleCheckout = async () => {
    if (!selectedGuest) return;

    // Check if there are unpaid orders
    const hasUnpaidOrders = selectedGuest.unpaidOrders?.length > 0;
    if (hasUnpaidOrders) {
      toast.error('Cannot check out with unpaid orders. Please process payments first.');
      return;
    }

    setIsCheckingOut(true);
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
        })
      });

      if (!response.ok) throw new Error('Failed to process checkout');

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
      toast.error('Failed to process checkout');
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

  const processRazorpayPayment = async (orderIds) => {
    if (!selectedGuest) return;

    try {
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

      // Create a payment order on the server
      const amount = calculateTotal(selectedGuest.unpaidOrders) * 100; // Convert to paise
      // Generate a shorter receipt ID (max 40 chars for Razorpay)
      const receipt = `INV-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      console.log('Generated receipt ID:', receipt, 'Length:', receipt.length);

      const orderResponse = await fetch('/api/razorpay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          currency: 'INR',
          receipt,
          notes: {
            guestId: selectedGuest._id,
            orderIds: orderIds
          }
        })
      });

      const orderData = await orderResponse.json();
      console.log('Razorpay order response:', {
        status: orderResponse.status,
        data: orderData,
        ok: orderResponse.ok
      });

      if (!orderResponse.ok) {
        console.error('Failed to create payment order:', {
          status: orderResponse.status,
          error: orderData.error,
          details: orderData.details
        });
        throw new Error(orderData.error?.description ||
          orderData.error?.message ||
          'Failed to create payment order. Please check the server logs for more details.');
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: 'INR',
        name: 'Hotel Shivan Residence',
        description: `Payment for Order #${receipt}`,
        order_id: orderData.id,
        handler: async function (response) {
          try {
            // Verify the payment on the server
            const verifyResponse = await fetch('/api/razorpay', {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                guestId: selectedGuest._id,
                orderId: orderIds[0], // Use the first order ID for verification
                orderIds: orderIds
              })
            });

            if (!verifyResponse.ok) throw new Error('Payment verification failed');

            // Update the room account with the payment
            const processPaymentResponse = await fetch('/api/processPayment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                guestId: selectedGuest._id,
                paymentMethod: 'online',
                orderIds: orderIds.map(id => id.toString()) // Ensure orderIds are strings
              })
            });

            const paymentResult = await processPaymentResponse.json();

            if (!processPaymentResponse.ok) {
              throw new Error(paymentResult.message || 'Failed to update room account');
            }

            // Update local state to reflect the payment
            setSelectedGuest(prev => ({
              ...prev,
              unpaidOrders: [],
              paidOrders: [...(prev.paidOrders || []), ...prev.unpaidOrders]
            }));

            // Set invoice data for PDF generation
            setInvoiceData({
              guest: {
                ...selectedGuest,
                unpaidOrders: [],
                paidOrders: [...(selectedGuest.paidOrders || []), ...selectedGuest.unpaidOrders]
              },
              orderIds: orderIds,
              paymentId: response.razorpay_payment_id,
              timestamp: new Date().toISOString()
            });

            toast.success('Payment processed and room account updated successfully. Click the download button to get your invoice.');
          } catch (error) {
            console.error('Payment processing error:', error);
            toast.error(error.message || 'Payment processing failed');
          }
        },
        prefill: {
          name: selectedGuest.name,
          email: selectedGuest.email || '',
          contact: selectedGuest.phone || ''
        },
        theme: {
          color: '#4f46e5'
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (error) {
      console.error('Payment processing error:', error);
      toast.error(error.message || 'Failed to process payment');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleProcessPayment = async () => {
    if (!selectedGuest || !selectedGuest.unpaidOrders?.length) return;

    setIsProcessingPayment(true);

    try {
      const orderIds = selectedGuest.unpaidOrders.map(order => order.orderId);

      if (paymentMethod === 'online') {
        await processRazorpayPayment(orderIds);
        return; // Exit after initiating online payment
      }

      // Process cash payment directly since we don't have a processPayment endpoint
      // First, create the invoice
      const invoiceResponse = await fetch('/api/CreateRoomInvoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          guestId: selectedGuest._id,
          guestName: selectedGuest.name,
          guestEmail: selectedGuest.email,
          guestPhone: selectedGuest.phone,
          roomNumber: selectedGuest.roomNumber,
          roomType: selectedGuest.roomType,
          checkInDate: selectedGuest.checkInDate,
          checkOutDate: selectedGuest.checkOutDate,
          paymentMethod: 'cash',
          paymentStatus: 'completed',
          orderIds,
          foodItems: selectedGuest.unpaidOrders.map(order => ({
            foodItem: order._id,
            name: order.name,
            qty: order.quantity,
            price: order.price,
          })),
          roomPrice: selectedGuest.roomPrice || 0,
          totalDays: selectedGuest.totalDays || 1,
          extraCharges: 0,
          discount: 0,
        }),
      });

      if (!invoiceResponse.ok) {
        const errorData = await invoiceResponse.json().catch(() => ({}));
        console.error('Invoice generation failed:', errorData);
        throw new Error(errorData.error || 'Failed to generate invoice');
      }

      const invoiceData = await invoiceResponse.json();

      // Update local state with the new invoice data
      const paymentId = `cash-${Date.now()}`;
      const invoiceState = {
        ...invoiceData,
        guest: selectedGuest,
        orderIds,
        paymentId,
        timestamp: new Date().toISOString(),
        invoiceUrl: invoiceData.invoiceUrl || null
      };

      setInvoiceData(invoiceState);

      // Update local state to reflect the payment
      setSelectedGuest(prev => ({
        ...prev,
        unpaidOrders: [],
        paidOrders: [...(prev.paidOrders || []), ...prev.unpaidOrders]
      }));

      // If we have an invoice URL, download it
      if (invoiceState.invoiceUrl) {
        setInvoiceUrl(invoiceState.invoiceUrl);
        const link = document.createElement('a');
        link.href = invoiceState.invoiceUrl;
        link.download = `invoice-${Date.now()}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // If no URL, generate PDF client-side
        generateAndDownloadPdf(invoiceState);
      }

      toast.success('Payment processed successfully');
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error(error.message || 'Failed to process payment');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleDownloadInvoice = () => {
    if (!invoiceData) return;

    setLoadingStates(prev => ({ ...prev, sendEmail: false }));

    // Use setTimeout to ensure the DOM is updated before generating PDF
    setTimeout(() => {
      try {
        const element = invoiceRef.current;
        if (!element) return;

        const { guest, orderIds, paymentId, timestamp } = invoiceData;
        const orderItems = guest.unpaidOrders.filter(order => orderIds.includes(order._id));

        // Calculate totals
        const subtotal = orderItems.reduce((sum, item) => sum + (parseFloat(item.price || 0) * (parseInt(item.quantity) || 1)), 0);
        
        // Calculate CGST and SGST for each item
        const itemsWithTaxes = orderItems.map(item => {
          const price = parseFloat(item.price || 0);
          const quantity = parseInt(item.quantity) || 1;
          const cgstRate = parseFloat(item.cgstPercent || 0);
          const sgstRate = parseFloat(item.sgstPercent || 0);
          const cgstAmount = (price * cgstRate / 100) * quantity;
          const sgstAmount = (price * sgstRate / 100) * quantity;
          const itemSubtotal = price * quantity;
          const itemTotal = itemSubtotal + cgstAmount + sgstAmount;
          
          return {
            ...item,
            _cgstAmount: cgstAmount,
            _sgstAmount: sgstAmount,
            _itemSubtotal: itemSubtotal,
            _itemTotal: itemTotal
          };
        });
        
        // Calculate total taxes and grand total
        const totalCGST = itemsWithTaxes.reduce((sum, item) => sum + (item._cgstAmount || 0), 0);
        const totalSGST = itemsWithTaxes.reduce((sum, item) => sum + (item._sgstAmount || 0), 0);
        const grandTotal = subtotal + totalCGST + totalSGST;

        // Generate HTML for the invoice
        element.innerHTML = `
          <div style="width: 100%; max-width: 800px; margin: 0 auto; border: 1px solid #eee; border-radius: 5px; overflow: hidden;">
            <!-- Header with Logo -->
            <div style="display: flex; justify-content: space-between; align-items: center; background-color: #1e1e1e; color: white; padding: 10px 20px;">
              ${hotelLogo ? `
                <div style="width: 80px; height: 80px; display: flex; align-items: center;">
                  <img src="${hotelLogo}" alt="Hotel Logo" style="max-width: 100%; max-height: 100%; object-fit: contain;"/>
                </div>
              ` : ''}
              <div style="flex-grow: 1; text-align: center;">
                <h1 style="margin: 0; font-size: 20px; font-weight: bold;">RESTAURANT INVOICE</h1>
              </div>
              ${hotelLogo ? '<div style="width: 80px;"></div>' : ''} <!-- Empty div for balance -->
            </div>
            
            <!-- Company Name -->
            <div style="background-color: #228b78; color: white; padding: 10px 0; text-align: center;">
              <h2 style="margin: 0; font-size: 22px; font-weight: bold;">HOTEL SHIVAN RESIDENCE</h2>
            </div>
            
            <!-- Invoice Info -->
            <div style="border: 1px solid #e0e0e0; border-radius: 5px; margin: 15px; padding: 10px; font-size: 12px;">
              <div style="display: flex; justify-content: space-between; flex-wrap: wrap;">
                <div>
                  <p style="margin: 5px 0;"><strong>Invoice #:</strong> INV-${Date.now().toString().slice(-4)}</p>
                  <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date(timestamp).toLocaleString()}</p>
                  <p style="margin: 5px 0;"><strong>Payment ID:</strong> ${paymentId || 'N/A'}</p>
                </div>
                <div style="text-align: right;">
                  <p style="margin: 5px 0;"><strong>Contact:</strong> ${hotelData?.contactNumber1 || '+91 1234567890'}</p>
                  <p style="margin: 5px 0;"><strong>Email:</strong> ${hotelData?.email1 || 'info@hotelshivan.com'}</p>
                  <p style="margin: 5px 0;"><strong>GSTIN:</strong> ${hotelData?.gstNumber || '12ABCDE3456F7Z8'}</p>
                </div>
              </div>
            </div>
            
            <!-- Guest Info -->
            <div style="background-color: #f5f5f5; border: 1px solid #e0e0e0; border-radius: 5px; margin: 0 15px 15px; padding: 10px;">
              <h3 style="margin: 0 0 10px 0; font-size: 14px;">Guest Information</h3>
              <p style="margin: 5px 0;"><strong>Name:</strong> ${guest.name || 'Guest'}</p>
              ${guest.phone ? `<p style="margin: 5px 0;"><strong>Phone:</strong> ${guest.phone}</p>` : ''}
              ${guest.email ? `<p style="margin: 5px 0;"><strong>Email:</strong> ${guest.email}</p>` : ''}
              ${guest.roomNumber ? `<p style="margin: 5px 0;"><strong>Room:</strong> ${guest.roomNumber}</p>` : ''}
            </div>
            
            <!-- Items Table -->
            <table style="width: 100%; border-collapse: collapse; margin: 0 15px 15px; font-size: 12px;">
              <thead>
                <tr style="background-color: #228b78; color: white;">
                  <th style="padding: 10px; text-align: left;">Item</th>
                  <th style="padding: 10px; text-align: right;">Price</th>
                  <th style="padding: 10px; text-align: center;">Qty</th>
                  <th style="padding: 10px; text-align: right;">CGST</th>
                  <th style="padding: 10px; text-align: right;">SGST</th>
                  <th style="padding: 10px; text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsWithTaxes.map((item, index) => {
                  const itemPrice = parseFloat(item.price) || 0;
                  const quantity = parseInt(item.quantity) || 1;
                  const cgstRate = parseFloat(item.cgstPercent) || 0;
                  const sgstRate = parseFloat(item.sgstPercent) || 0;
                  
                  return `
                    <tr key="${index}">
                      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name || 'N/A'}</td>
                      <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">₹${itemPrice.toFixed(2)}</td>
                      <td style="padding: 10px; text-align: center; border-bottom: 1px solid #eee;">${quantity}</td>
                      <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">${cgstRate > 0 ? `₹${item._cgstAmount.toFixed(2)} (${cgstRate}%)` : '-'}</td>
                      <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">${sgstRate > 0 ? `₹${item._sgstAmount.toFixed(2)} (${sgstRate}%)` : '-'}</td>
                      <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">₹${item._itemTotal.toFixed(2)}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="3" style="text-align: right; padding: 10px; font-weight: bold; border-top: 1px solid #ddd;">Subtotal:</td>
                  <td colspan="2" style="text-align: right; padding: 10px; font-weight: bold; border-top: 1px solid #ddd;">₹${subtotal.toFixed(2)}</td>
                  <td style="text-align: right; padding: 10px; font-weight: bold; border-top: 1px solid #ddd;">₹${subtotal.toFixed(2)}</td>
                </tr>
                ${totalCGST > 0 ? `
                <tr>
                  <td colspan="3" style="text-align: right; padding: 5px 10px;">Total CGST:</td>
                  <td colspan="2" style="text-align: right; padding: 5px 10px;">₹${totalCGST.toFixed(2)}</td>
                  <td style="text-align: right; padding: 5px 10px;"></td>
                </tr>
                ` : ''}
                ${totalSGST > 0 ? `
                <tr>
                  <td colspan="3" style="text-align: right; padding: 5px 10px;">Total SGST:</td>
                  <td colspan="2" style="text-align: right; padding: 5px 10px;">₹${totalSGST.toFixed(2)}</td>
                  <td style="text-align: right; padding: 5px 10px;"></td>
                </tr>
                ` : ''}
                <tr>
                  <td colspan="3" style="text-align: right; padding: 10px; font-weight: bold; font-size: 1.1em; border-top: 2px solid #228b78;">Total Amount:</td>
                  <td colspan="2" style="text-align: right; padding: 10px; font-weight: bold; font-size: 1.1em; border-top: 2px solid #228b78;">
                    ${totalCGST > 0 || totalSGST > 0 ? `(Incl. Tax)` : ''}
                  </td>
                  <td style="text-align: right; padding: 10px; font-weight: bold; font-size: 1.1em; border-top: 2px solid #228b78;">₹${grandTotal.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
            
            <!-- Totals -->
            <div style="margin: 0 15px 15px; text-align: right; font-size: 12px;">
              <p style="margin: 5px 0;"><strong>Subtotal:</strong> ₹${subtotal.toFixed(2)}</p>
              ${totalCGST > 0 ? `<p style="margin: 5px 0;"><strong>CGST:</strong> ₹${totalCGST.toFixed(2)}</p>` : ''}
              ${totalSGST > 0 ? `<p style="margin: 5px 0;"><strong>SGST:</strong> ₹${totalSGST.toFixed(2)}</p>` : ''}
              <p style="margin: 15px 0 5px 0; font-size: 14px; font-weight: bold;">
                <strong>GRAND TOTAL: ₹${grandTotal.toFixed(2)}</strong>
              </p>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f9f9f9; padding: 10px; text-align: center; color: #666; font-size: 10px; border-top: 1px solid #eee;">
              <p style="margin: 5px 0;">* This is a computer generated invoice, no signature required.</p>
              <p style="margin: 5px 0;">* Thank you for dining with us!</p>
            </div>
          </div>
        `;

        // Generate PDF
        const opt = {
          margin: 10,
          filename: `invoice-${guest.name ? guest.name.replace(/\s+/g, '-').toLowerCase() : 'guest'}-${Date.now()}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        };

        // Generate and download the PDF
        if (typeof window !== 'undefined' && html2pdf) {
          html2pdf().set(opt).from(element).save();
        }
      } catch (error) {
        console.error('Error generating PDF:', error);
        toast.error('Failed to generate invoice');
      } finally {
        setLoadingStates(prev => ({ ...prev, downloadInvoice: false }));
      }
    }, 100);
  };
  const handleSendInvoiceEmail = async (guest) => {
    if (!guest?.email) {
      toast.error('No email address available for this guest');
      return;
    }

    setLoadingStates(prev => ({ ...prev, sendEmail: true }));

    try {
      // Get all items from all orders
      const allItems = (guest.paidOrders || []).flatMap(order => order.items || []);

      // Calculate taxes and totals for each item
      const itemsWithTaxes = allItems.map(item => {
        const price = parseFloat(item.price || 0);
        const quantity = parseInt(item.quantity) || 1;
        const cgstRate = parseFloat(item.cgstPercent || 0);
        const sgstRate = parseFloat(item.sgstPercent || 0);
        const cgstAmount = (price * cgstRate / 100) * quantity;
        const sgstAmount = (price * sgstRate / 100) * quantity;
        const itemSubtotal = price * quantity;
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
            
            <div style="max-width: 800px; margin: 0 auto; padding: 0 20px; ">
              <div style="background-color: #f5f5f5; border: 1px solid #e0e0e0; border-radius: 5px;padding:15px; margin-bottom: 20px; display: flex; align-items: center; justify-content:space-between; flex-direction: column">
                <div>
                  <p style="margin: 5px 0;"><strong>Invoice #:</strong> INV-${Date.now().toString().slice(-4)}</p>
                  <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date().toLocaleString()}</p>
                  <p style="margin: 5px 0;"><strong>Status:</strong> ${guest.paymentStatus || 'Paid'}</p>
                </div>
                <div style="text-align: right;">
                  <p style="margin: 5px 0;"><strong>Contact:</strong> ${hotelData?.contactNumber1 || '+91 1234567890'}</p>
                  <p style="margin: 5px 0;"><strong>Email:</strong> ${hotelData?.email1 || 'info@hotelshivan.com'}</p>
                  <p style="margin: 5px 0;"><strong>GSTIN:</strong> ${hotelData?.gstNumber || '12ABCDE3456F7Z8'}</p>
                </div>
              </div>
            
            <div style="background-color: #f5f5f5; border: 1px solid #e0e0e0; border-radius: 5px; padding: 15px; margin-bottom: 20px;">
              <h3 style="margin: 0 0 10px 0; font-size: 16px; font-weight: 600; color: #333;">Guest Information</h3>
              <div style="display: flex; justify-content: space-between; flex-wrap: wrap; gap: 20px;">
                <div style="flex: 1; min-width: 200px;">
                  <p style="margin: 8px 0;"><strong>Name:</strong> ${guest.name || 'N/A'}</p>
                  <p style="margin: 8px 0;"><strong>Email:</strong> ${guest.email || 'N/A'}</p>
                  <p style="margin: 8px 0;"><strong>Phone:</strong> ${guest.phone || 'N/A'}</p>
                </div>
                <div style="flex: 1; min-width: 200px;">
                  <p style="margin: 8px 0;"><strong>Room:</strong> ${guest.roomNumber || 'N/A'} (${guest.roomType || 'N/A'})</p>
                  <p style="margin: 8px 0;"><strong>Check-in:</strong> ${guest.checkIn ? new Date(guest.checkIn).toLocaleString() : 'N/A'}</p>
                  <p style="margin: 8px 0;"><strong>Check-out:</strong> ${guest.checkOut ? new Date(guest.checkOut).toLocaleString() : 'N/A'}</p>
                </div>
              </div>
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
                    <td>${item._cgstRate > 0 ? `₹${item._cgstAmount.toFixed(2)} (${item._cgstRate}%)` : '-'}</td>
                    <td>${item._sgstRate > 0 ? `₹${item._sgstAmount.toFixed(2)} (${item._sgstRate}%)` : '-'}</td>
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
      setLoadingStates(prev => ({ ...prev, downloadInvoice: false }));
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
        console.log('Hotel Data:', data);
        if (data && data[0]) {
          setHotelData(data[0]);
        } else {
          console.log('No hotel data found in the response');
        }
      } catch (error) {
        console.error('Error fetching hotel data:', error);
      }
    };

    fetchHotelData();
    fetchCheckedOutGuests();
  }, []);

  const handleDownloadCheckedOutInvoice = async (guest) => {
    console.log(guest)
    try {
      setLoadingStates(prev => ({ ...prev, downloadInvoice: true }));

      // Format dates
      const checkInDate = guest.checkInDate ? new Date(guest.checkInDate) : null;
      const checkOutDate = guest.checkOutDate ? new Date(guest.checkOutDate) : null;
      const totalNights = checkInDate && checkOutDate ?
        Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)) : 0;

      // Get orders (use paidOrders if available, otherwise use empty array)
      const orders = guest.paidOrders || [];

      // Flatten all items from all orders and calculate taxes
      const itemsWithTaxes = orders.flatMap(order => {
        return (order.items || []).map(item => {
          const price = parseFloat(item.price || 0);
          const quantity = parseInt(item.quantity) || 1;
          
          // Get tax rates from the item data
          const cgstRate = parseFloat(item.cgstPercent || 0);
          const sgstRate = parseFloat(item.sgstPercent || 0);
          const cgstAmount = parseFloat(item.cgstAmount || (price * cgstRate / 100 * quantity));
          const sgstAmount = parseFloat(item.sgstAmount || (price * sgstRate / 100 * quantity));
          const itemSubtotal = price * quantity;
          const itemTotal = parseFloat(item.total || (itemSubtotal + cgstAmount + sgstAmount));
          
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
      });

      // Calculate totals
      const subtotal = itemsWithTaxes.reduce((sum, item) => sum + item._itemSubtotal, 0);
      const totalCGST = itemsWithTaxes.reduce((sum, item) => sum + item._cgstAmount, 0);
      const totalSGST = itemsWithTaxes.reduce((sum, item) => sum + item._sgstAmount, 0);
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
                  <th style="padding: 10px; text-align: left; border: 1px solid #1a6b5d;">Item</th>
                  <th style="padding: 10px; text-align: right; border: 1px solid #1a6b5d;">Price</th>
                  <th style="padding: 10px; text-align: center; border: 1px solid #1a6b5d;">Qty</th>
                  <th style="padding: 10px; text-align: right; border: 1px solid #1a6b5d;">CGST</th>
                  <th style="padding: 10px; text-align: right; border: 1px solid #1a6b5d;">SGST</th>
                  <th style="padding: 10px; text-align: right; border: 1px solid #1a6b5d;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsWithTaxes.length > 0 ? itemsWithTaxes.map((item, index) => (
                  `<tr key="${index}">
                    <td style="padding: 10px; border: 1px solid #e0e0e0;">${item.name || 'N/A'}</td>
                    <td style="padding: 10px; text-align: right; border: 1px solid #e0e0e0;">₹${item._price.toFixed(2)}</td>
                    <td style="padding: 10px; text-align: center; border: 1px solid #e0e0e0;">${item._quantity}</td>
                    <td style="padding: 10px; text-align: right; border: 1px solid #e0e0e0;">
                      ${item._cgstRate > 0 ? `₹${item._cgstAmount.toFixed(2)} (${item._cgstRate}%)` : '-'}
                    </td>
                    <td style="padding: 10px; text-align: right; border: 1px solid #e0e0e0;">
                      ${item._sgstRate > 0 ? `₹${item._sgstAmount.toFixed(2)} (${item._sgstRate}%)` : '-'}
                    </td>
                    <td style="padding: 10px; text-align: right; border: 1px solid #e0e0e0;">₹${item._itemTotal.toFixed(2)}</td>
                  </tr>`
                )).join('') : `
                  <tr>
                    <td colspan="6" style="padding: 10px; text-align: center; border: 1px solid #e0e0e0;">No items found</td>
                  </tr>
                `}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="3" style="text-align: right; padding: 10px; font-weight: bold; border-top: 1px solid #ddd;">Subtotal:</td>
                  <td colspan="2" style="text-align: right; padding: 10px; font-weight: bold; border-top: 1px solid #ddd;">₹${subtotal.toFixed(2)}</td>
                  <td style="text-align: right; padding: 10px; font-weight: bold; border-top: 1px solid #ddd;">₹${subtotal.toFixed(2)}</td>
                </tr>
                ${totalCGST > 0 ? `
                <tr>
                  <td colspan="3" style="text-align: right; padding: 5px 10px;">Total CGST:</td>
                  <td colspan="2" style="text-align: right; padding: 5px 10px;">₹${totalCGST.toFixed(2)}</td>
                  <td style="text-align: right; padding: 5px 10px;"></td>
                </tr>
                ` : ''}
                ${totalSGST > 0 ? `
                <tr>
                  <td colspan="3" style="text-align: right; padding: 5px 10px;">Total SGST:</td>
                  <td colspan="2" style="text-align: right; padding: 5px 10px;">₹${totalSGST.toFixed(2)}</td>
                  <td style="text-align: right; padding: 5px 10px;"></td>
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
          <div style="background-color: #f9f9f9; padding: 15px; text-align: center; color: #666; font-size: 10px; border-top: 1px solid #eee;">
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
        filename: `invoice-${guest.bookingId || guest._id || 'guest'}-${Date.now()}.pdf`,
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
          link.download = `invoice-${guest.bookingId || guest._id || 'guest'}-${Date.now()}.pdf`;
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
      setLoadingStates(prev => ({ ...prev, downloadInvoice: false }));
    }
  };
  console.log(checkedOutGuests)
  return (
    <div className="space-y-6">
      {invoiceData && (
        <div className="flex justify-end">
          <button
            onClick={handleDownloadInvoice}
            disabled={isGeneratingPdf}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            {isGeneratingPdf ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Printer className="h-4 w-4" />
                <span>Download Invoice</span>
              </>
            )}
          </button>
        </div>
      )}
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
                    <tr className="bg-gray-50">
                      <td colSpan="2" className="px-4 py-2 text-right font-medium">Total Due:</td>
                      <td className="px-4 py-2 text-right font-medium">
                        ₹{calculateTotal(selectedGuest.unpaidOrders).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tbody>
                </table>
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
                    <tr className="bg-gray-50">
                      <td colSpan="2" className="px-4 py-2 text-right font-medium">Total Paid:</td>
                      <td className="px-4 py-2 text-right font-medium">
                        ₹{calculateTotal(selectedGuest.paidOrders).toLocaleString('en-IN')}
                      </td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
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
                          {guest.paidOrders?.length > 0 && (
                            <div className="font-medium">
                              Total: ₹{guest.paidOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0)}
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
                          {guest.invoiceId && (
                            <a
                              href={`/api/invoices/${guest.invoiceId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                              View Invoice
                            </a>
                          )}
                        </div>
                        <div className="flex flex-col space-y-2">
                          <button
                            onClick={() => handleSendInvoiceEmail(guest)}
                            disabled={loadingStates.sendEmail}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-md font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-75"
                          >
                            {loadingStates.sendEmail ? (
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
