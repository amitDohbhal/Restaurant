"use client"
import React from 'react';
import Image from 'next/image';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { toast } from 'react-hot-toast';
const downloadInvoiceAsPdf = async (orderData) => {
  try {
    // Create a temporary div to render the HTML
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.width = '800px';
    tempDiv.style.padding = '20px';
    document.body.appendChild(tempDiv);

    // Generate the HTML content
    const {
      orderId,
      orderDate,
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      items,
      subTotal,
      totalDiscount,
      promoCode,
      totalTax,
      shippingCost,
      cartTotal
    } = orderData;

    // Generate items HTML
    const itemsHtml = items.map(item => `
      <tr>
         <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">
      <img 
        src="${item.image || 'https://via.placeholder.com/60'}" 
        alt="${item.name || 'Product'}" 
        style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;"
        onerror="this.onerror=null; this.src='https://via.placeholder.com/50';"
      />
    </td>
         <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${item.name}</td>
         <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${item.qty}</td>
         <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">₹${item.price.toFixed(2)}</td>
         <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">₹${(item.price * item.qty).toFixed(2)}</td>
      </tr>
    `).join('');

    // Set the HTML content
    tempDiv.innerHTML = `
      <div style="max-width: 800px; margin: 0 auto; padding: 24px; background: #fff; border-radius: 10px; font-family: Arial, sans-serif;">
        <div style="text-align: center; margin-bottom: 24px;">
          <img src="/logo.png" alt="Rishikesh Handmade" style="max-height: 80px; margin-bottom: 16px;">
          <h1 style="margin: 0; color: #333; font-size: 24px;">INVOICE</h1>
          <p style="margin: 8px 0 0; color: #666;">Order #${orderId}</p>
          <p style="margin: 4px 0 0; color: #666;">${new Date(orderDate).toLocaleDateString()}</p>
        </div>

        <div style="display: flex; justify-content: space-between; margin-bottom: 32px;">
          <div>
            <h3 style="margin: 0 0 8px; color: #333; font-size: 16px;">Bill To:</h3>
            <p style="margin: 4px 0; color: #555;">${customerName}</p>
            <p style="margin: 4px 0; color: #555;">${shippingAddress}</p>
            <p style="margin: 4px 0; color: #555;">${customerEmail}</p>
            <p style="margin: 4px 0; color: #555;">${customerPhone}</p>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
          <thead>
            <tr style="background: #f5f5f5;">
              <th style="text-align: left; padding: 12px; border: 1px solid #ddd;">Image</th>
              <th style="text-align: left; padding: 12px; border: 1px solid #ddd;">Item</th>
              <th style="text-align: right; padding: 12px; border: 1px solid #ddd;">Qty</th>
              <th style="text-align: right; padding: 12px; border: 1px solid #ddd;">Price</th>
              <th style="text-align: right; padding: 12px; border: 1px solid #ddd;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div style="margin-left: auto; width: 300px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span>Subtotal:</span>
            <span>₹${Number(subTotal).toFixed(2)}</span>
          </div>
          ${totalDiscount > 0 ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; color: #10b981;">
              <span>Discount${promoCode ? ` (${promoCode})` : ''}:</span>
              <span>-₹${Number(totalDiscount).toFixed(2)}</span>
            </div>
          ` : ''}
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span>Tax (GST):</span>
            <span>₹${Number(totalTax).toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #eee;">
            <span>Shipping:</span>
            <span>${Number(shippingCost) > 0 ? `₹${Number(shippingCost).toFixed(2)}` : 'Free'}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold; margin-bottom: 16px;">
            <span>Total Amount:</span>
            <span>₹${Number(cartTotal).toFixed(2)}</span>
          </div>
        </div>

        <div style="margin-top: 32px; padding: 16px; background: #f9f9f9; border-radius: 6px; text-align: center;">
          <p style="margin: 0; color: #666;">Thank you for your order!</p>
          <p style="margin: 8px 0 0; color: #666;">For any queries, please contact support@info@adventureaxis.in</p>
        </div>
      </div>
    `;

    // Convert HTML to canvas
    const canvas = await html2canvas(tempDiv, {
      scale: 2, // Higher quality
      useCORS: true,
      allowTaint: true,
      scrollY: -window.scrollY
    });

    // Convert canvas to PDF
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 295; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Add new page if content is too long
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Save the PDF
    pdf.save(`Invoice-${orderId}.pdf`);

    // Clean up
    document.body.removeChild(tempDiv);
  } catch (error) {
    // console.error('Error generating PDF:', error);
    toast.error('Failed to generate invoice. Please try again.');
  }
};

const CheckOutOverview = ({ checkoutData, paymentMethod, onEdit, onConfirm, loading, error, showConfirmationModal, orderId, onGoToDashboard }) => {
  // Scroll to top when component mounts
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  // In your component, use it like this:
  const handleDownloadInvoice = () => {
    if (!checkoutData) return;
  
    const orderData = {
      orderId: orderId || `ORD-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
      orderDate: new Date().toISOString(),
      customerName: `${checkoutData.firstName || ''} ${checkoutData.lastName || ''}`.trim(),
      customerEmail: checkoutData.email || '',
      customerPhone: checkoutData.phone || '',
      shippingAddress: `${checkoutData.street || ''}, ${checkoutData.city || ''}, ${checkoutData.state || ''} ${checkoutData.pincode || ''}`,
      items: (checkoutData.cart || []).map(item => ({
        name: item.name || 'Product',
        qty: item.qty || 1,
        price: item.price || 0,
        total: (item.qty || 1) * (item.price || 0),
        image: item.image?.url || item.image || ''
      })),
      subTotal: checkoutData.subTotal || 0,
      totalDiscount: checkoutData.totalDiscount || 0,
      promoCode: checkoutData.promoCode || '',
      totalTax: checkoutData.taxTotal || checkoutData.totalTax || '', // Changed from totalTax to taxTotal based on your data
      shippingCost: checkoutData?.shippingCost || checkoutData?.shipping || 0,
      cartTotal: checkoutData.cartTotal || 0
    };
  
    downloadInvoiceAsPdf(orderData);
  };
  if (!checkoutData) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-gray-500">Loading order summary...</div>
      </div>
    );
  }

  // Dummy/fallbacks for demonstration; replace with real data as needed
  const {
    cart: items = [],
    subTotal = 0,
    totalDiscount = 0,
    promo,
    finalShipping = 0,
    taxTotal = 0,
    cartTotal = 0,
    firstName = '',
    lastName = '',
    email = '',
    phone = '',
    altPhone = '',
    street = '',
    city = '',
    district = '',
    state = '',
    pincode = '',
    address = '',
  } = checkoutData;

  // Calculate total quantity
  const totalQty = items.reduce((sum, item) => sum + (item.qty || 0), 0);

  // Confirmation Modal (shown after successful payment/order)


  return (
    <div className="min-h-screen bg-[#fcf7f2] flex items-start justify-center py-10 px-2 md:px-10">
      {showConfirmationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-2xl w-full relative flex flex-col items-center" id="invoice-print-section">
            {/* Rest of the modal content */}
            <h2 className="text-xl font-bold mb-2 text-center">Thank You for Confirming Your Order</h2>
            <p className="mb-4 text-center text-gray-700">
              Thank you for confirming your order with us! We've received your details and your order is now being processed. Our team is preparing your package with care to ensure it reaches you in perfect condition and on time. You’ll receive updates on your order status and tracking information shortly.
            </p>
            <p className="mb-4 text-center text-gray-700">
              If you have any questions or need assistance, our support team is here to help. We truly appreciate your trust in us and look forward to serving you again!
            </p>
            {/* <div className="mb-2 font-semibold">Order ID & Date:</div> */}
            {/* <div className="mb-4 text-center text-base text-black">{orderId} &nbsp;|&nbsp; {new Date().toLocaleDateString()}</div> */}
            <div className="flex flex-col md:flex-row gap-4 w-full items-center justify-center">
              <button
                onClick={handleDownloadInvoice}
                className="w-fit bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-md transition duration-200 mb-4 flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Invoice
              </button>
              <button
              className="w-fit bg-black hover:bg-gray-800 text-white font-medium py-2 px-4 rounded-md transition duration-200 mb-4 flex items-center justify-center"

                onClick={onGoToDashboard}
              >
                Or Go To Dashboard &gt;&gt;
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="w-full max-w-6xl flex flex-col md:flex-row gap-8">
        {/* LEFT: Billing/Shipping Summary */}
        <div className="flex-1 bg-[#fcf7f2] p-0">
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-2">Checkout: <span className="font-normal">Quick Overview</span></h2>
            <hr className="my-4 border-gray-300" />
          </div>

          {/* Basic Billing Information */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-base text-[#8b6f63]">Basic Billing Information</span>
              <span className="text-teal-600 flex items-center gap-1 text-sm">✓</span>
              <button className="ml-1 text-sm text-black underline hover:text-orange-500" onClick={onEdit}>Edit</button>
            </div>
            <table className="w-full text-sm">
              <tbody>
                <tr><td className="py-1 w-32 text-gray-700">Name</td><td>{firstName} {lastName}</td></tr>
                <tr><td className="py-1 text-gray-700">Email</td><td>{email}</td></tr>
                <tr><td className="py-1 text-gray-700">Call No.</td><td>{phone}</td></tr>
                <tr><td className="py-1 text-gray-700">Alt. Call No.</td><td>{altPhone}</td></tr>
              </tbody>
            </table>
          </div>

          {/* Shipping Address */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-base text-[#8b6f63]">Shipping Address</span>
              <span className="text-teal-600 flex items-center gap-1 text-sm">✓</span>
              <button className="ml-1 text-sm text-black underline hover:text-orange-500" onClick={onEdit}>Edit</button>
            </div>
            <div className="pl-1 text-gray-800 text-sm">{address || `${street}, ${city}, ${district}, ${state} ${pincode}`}</div>
          </div>

          {/* Shipping Availability */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-base text-[#8b6f63]">Shipping Availability</span>
              <span className="text-teal-600 flex items-center gap-1 text-sm">✓</span>
              <button className="ml-1 text-sm text-black underline hover:text-orange-500" onClick={onEdit}>Edit</button>
            </div>
            <table className="w-full text-sm">
              <tbody>
                <tr><td className="py-1 w-32 text-gray-700">State</td><td>{state}</td></tr>
                <tr><td className="py-1 text-gray-700">Dist.</td><td>{district}</td></tr>
                <tr><td className="py-1 text-gray-700">Available Pin Code</td><td>{pincode}</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT: Order Summary Card */}
        <div className="w-full md:w-[390px] flex-shrink-0">
          <div className="bg-white rounded-lg shadow-lg p-6 sticky top-10">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-lg">Order Summary</h3>
              <span className="text-sm text-gray-600">{items.length} Item{items.length !== 1 ? 's' : ''}</span>
              <span className="text-sm text-gray-600">Qty {totalQty}</span>
              <button className="text-black underline text-sm ml-2" onClick={onEdit}>Edit Order</button>
            </div>
            <hr className="mb-4" />
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>₹{subTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="underline cursor-pointer">GST and Fees</span>
                <span>₹{taxTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-semibold mt-3">
                <span>Total (INR)</span>
                <span className="text-green-700 text-lg">₹{cartTotal.toFixed(2)}</span>
              </div>
              {totalDiscount > 0 && (
                <div className="text-green-700 text-xs mt-2">Nice! You saved ₹{totalDiscount.toFixed(2)} on your order.</div>
              )}
            </div>
            <button
              className="w-full py-3 bg-black text-white rounded font-semibold text-base mt-2 mb-4 flex items-center justify-center gap-2 hover:bg-gray-900 transition-colors"

              onClick={() => {
                // console.log('Overview confirm button clicked');
                onConfirm();
              }}
              disabled={loading}
            >
              {loading ? 'Processing...' : (
                <>
                  Make Confirm Order
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                </>
              )}
            </button>
            {error && <div className="text-red-600 text-xs text-center mb-2">{error}</div>}
            <div className="text-xs text-gray-600 mt-2">
              Thank you for choosing to shop with us!<br />
              To complete your purchase, please confirm your order by selecting a payment method below. You can choose <span className="underline">Cash on Delivery (COD)</span> for a safe and convenient payment at your doorstep, or opt for <span className="underline">Online Payment</span> for faster processing and instant confirmation.<br /><br />
              Once your payment option is selected, we will begin preparing your order for dispatch. Your satisfaction is our priority – shop confidently with us!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckOutOverview;
