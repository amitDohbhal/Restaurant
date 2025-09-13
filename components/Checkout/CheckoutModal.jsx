"use client";
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useRouter } from 'next/navigation';

// Helper function to prevent body scroll
const usePreventBodyScroll = (isOpen) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = '15px'; // Prevent layout shift when scrollbar disappears
    } else {
      document.body.style.overflow = 'unset';
      document.body.style.paddingRight = '0';
    }

    // Cleanup function
    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.paddingRight = '0';
    };
  }, [isOpen]);
};
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { Loader } from 'lucide-react';

const CheckoutModal = ({ isOpen, onClose, cart: initialCart, totalAmount: initialTotalAmount }) => {
  usePreventBodyScroll(isOpen);

  const { data: session } = useSession();
  // Get step from localStorage or default to 1
  const [currentStep, setCurrentStep] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedStep = localStorage.getItem('checkoutCurrentStep');
      return savedStep ? parseInt(savedStep, 10) : 1;
    }
    return 1;
  });
  const [guestInfo, setGuestInfo] = useState({
    name: '',
    phone: '',
    email: ''
  });
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [isGuestFound, setIsGuestFound] = useState(false);
  const [orderConfirmation, setOrderConfirmation] = useState(null);
  const [cart, setCart] = useState(initialCart);
  const [totalAmount, setTotalAmount] = useState(initialTotalAmount);
  // Add this state with your other useState declarations
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  // Check for existing guest when session changes
  // useEffect(() => {
  //   // Don't modify step if we're already on the thank you page (step 3)
  //   if (currentStep === 3) return;

  //   const initializeGuestCheck = async () => {
  //     if (session?.user?.email) {
  //       const email = session.user.email;

  //       // First try to find guest by email
  //       const { found: foundByEmail, guest: emailGuest } = await searchGuestByEmail(email);

  //       if (foundByEmail) {
  //         // If found by email, proceed to step 2
  //         if (currentStep < 2) {
  //           setCurrentStep(2);
  //         }
  //         return;
  //       }

  //       // If not found by email, try to find by phone if available in session
  //       if (session?.user?.phone) {
  //         const phone = session.user.phone;
  //         const { found: foundByPhone, guest: phoneGuest } = await searchGuestByPhone(phone);

  //         if (foundByPhone) {
  //           // If found by phone, update guest info and proceed to step 2
  //           setGuestInfo(prev => ({
  //             ...prev,
  //             email: email, // Set the email from session
  //             phone: phoneGuest?.phone || phone,
  //             name: phoneGuest?.name || prev.name
  //           }));
  //           setSelectedGuest(phoneGuest);
  //           if (currentStep < 2) {
  //             setCurrentStep(2);
  //           }
  //           return;
  //         }
  //       }

  //       // If not found by either email or phone, stay on step 1
  //       setCurrentStep(1);
  //     }
  //   };

  //   initializeGuestCheck();
  // }, [session, currentStep]);
  useEffect(() => {
    // Don't modify step if we're already on the thank you page (step 3)
    if (currentStep === 3) return;

    // Only run automatic check if we haven't manually entered step 1 yet
    // and if the form hasn't been filled out
    if (currentStep === 1 && !guestInfo.email && !guestInfo.phone && !guestInfo.name) {
      const initializeGuestCheck = async () => {
        if (session?.user?.email) {
          const email = session.user.email;

          // First try to find guest by email
          const { found: foundByEmail, guest: emailGuest } = await searchGuestByEmail(email);

          if (foundByEmail) {
            // If found by email, proceed to step 2
            setCurrentStep(2);
            setSelectedGuest(emailGuest);
            setGuestInfo({
              name: emailGuest.name || '',
              phone: emailGuest.phone || '',
              email: emailGuest.email || email
            });
            return;
          }

          // If not found by email, pre-fill the form with session data but stay on step 1
          setGuestInfo(prev => ({
            ...prev,

          }));
        }
      };

      initializeGuestCheck();
    }
  }, [session]); // Remove currentStep from dependencies to avoid re-running

  // Persist step changes to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('checkoutCurrentStep', currentStep);
    }
  }, [currentStep]);

  // Clean up localStorage when modal is closed
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && !isOpen) {
        localStorage.removeItem('checkoutCurrentStep');
      }
    };
  }, [isOpen]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setGuestInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Search for existing guest by phone number
  const searchGuestByPhone = async (phone) => {
    if (!phone) return { found: false, guest: null };

    setIsSearching(true);
    try {
      console.log('Searching guest by phone:', phone);
      const response = await fetch(`/api/addGuestToRoom?search=${encodeURIComponent(phone)}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Phone search results:', data);

      if (Array.isArray(data) && data.length > 0) {
        // The API now does exact phone matching, so we can use the first result
        const guest = data[0];

        if (guest) {
          console.log('Found guest by phone:', guest);
          // Map the guest data to the expected format
          const formattedGuest = {
            _id: guest._id,
            guestId: guest.guestId || guest._id,
            name: guest.name,
            email: guest.email,
            phone: guest.phone,
            roomNumber: guest.roomNumber,
            roomId: guest.roomId,
            checkIn: guest.checkIn,
            checkOut: guest.checkOut,
            ...guest
          };

          setSelectedGuest(formattedGuest);
          setGuestInfo(prev => ({
            ...prev,
            name: formattedGuest.name || '',
            phone: formattedGuest.phone || phone,
            email: formattedGuest.email || '',
            roomNumber: formattedGuest.roomNumber || ''
          }));

          setIsGuestFound(true);
          return { found: true, guest: formattedGuest };
        }
      }

      console.log('No guest found with phone:', phone);
      return { found: false, guest: null };

    } catch (error) {
      console.error('Error searching for guest by phone:', error);
      return { found: false, guest: null };
    } finally {
      setIsSearching(false);
    }
  };

  // Search for existing guest by email
  const searchGuestByEmail = async (email) => {
    if (!email) return { found: false, guest: null };

    try {
      console.log('Searching guest by email:', email);
      const response = await fetch(`/api/addGuestToRoom?search=${encodeURIComponent(email)}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Search results:', data);

      if (Array.isArray(data) && data.length > 0) {
        // Find exact email match
        const guest = data.find(g => g.email?.toLowerCase() === email.toLowerCase());

        if (guest) {
          console.log('Found guest by email:', guest);
          // Map the guest data to the expected format
          const formattedGuest = {
            _id: guest._id,
            guestId: guest.guestId || guest._id,
            name: guest.name,
            email: guest.email,
            phone: guest.phone,
            roomNumber: guest.roomNumber,
            roomId: guest.roomId,
            checkIn: guest.checkIn,
            checkOut: guest.checkOut,
            ...guest
          };
          return { found: true, guest: formattedGuest };
        }
      }

      console.log('No guest found with email:', email);
      return { found: false, guest: null };

    } catch (error) {
      console.error('Error searching for guest by email:', error);
      return { found: false, guest: null };
    }
  };
  // Select a guest from search results
  const selectGuest = (guest) => {
    setSelectedGuest(guest);
    setGuestInfo({
      name: guest.name,
      phone: guest.phone,
      email: guest.email || ''
    });
  };

  const handleGuestSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!guestInfo.name || !guestInfo.phone || !guestInfo.email) {
      toast.error('Please provide your name, email, and phone number');
      return;
    }

    setIsSearching(true);
    try {
      // First try to find by email
      const { found: foundByEmail, guest: emailGuest } = await searchGuestByEmail(guestInfo.email);

      if (foundByEmail) {
        // If found by email, update guest info and proceed to step 2
        setSelectedGuest(emailGuest);
        setGuestInfo(prev => ({
          ...prev,
          name: emailGuest.name || prev.name,
          phone: emailGuest.phone || prev.phone,
          roomNumber: emailGuest.roomNumber || prev.roomNumber
        }));
        setCurrentStep(2);
        return;
      }

      // If not found by email, try by phone
      const { found: foundByPhone, guest: phoneGuest } = await searchGuestByPhone(guestInfo.phone);

      if (foundByPhone) {
        // If found by phone, update guest info and proceed to step 2
        setSelectedGuest(phoneGuest);
        setGuestInfo(prev => ({
          ...prev,
          name: phoneGuest.name || prev.name,
          email: phoneGuest.email || prev.email,
          roomNumber: phoneGuest.roomNumber || prev.roomNumber
        }));
        setCurrentStep(2);
        return;
      }

      // If not found by either, show error
      toast.error('No guest found with these details. Please check your information.');
      setSearchResults([]);
      setIsGuestFound(false);

    } catch (error) {
      console.error('Error searching for guest:', error);
      toast.error('Error searching for guest information');
    } finally {
      setIsSearching(false);
    }

    try {
      // Prepare guest data with room information
      const guestData = {
        name: guestInfo.name.trim(),
        phone: guestInfo.phone.trim(),
        email: guestInfo.email?.trim() || '',
        roomId: cart[0]?.roomId,
        roomNumber: cart[0]?.roomNumber,
        // Add any other required fields from cart or form
      };

      let guestResponse;

      // If we have a selected guest or found by search
      if (selectedGuest?._id || isGuestFound) {
        const guestId = selectedGuest?._id || searchResults[0]?._id;

        // Update existing guest
        const updateResponse = await fetch(`/api/addGuestToRoom`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            guestId,
            ...guestData,
            // Ensure we don't overwrite important fields if they're not in the form
            _id: guestId
          })
        });

        if (!updateResponse.ok) {
          throw new Error('Failed to update guest information');
        }

        guestResponse = await updateResponse.json();
        setSelectedGuest(guestResponse);
      } else {
        // Create new guest
        const createResponse = await fetch('/api/addGuestToRoom', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(guestData)
        });

        if (!createResponse.ok) {
          throw new Error('Failed to create guest');
        }

        guestResponse = await createResponse.json();
        setSelectedGuest(guestResponse);
        setIsGuestFound(true);
      }

      // Update guest info with the response from server
      if (guestResponse) {
        setGuestInfo(prev => ({
          ...prev,
          ...guestResponse,
          name: guestResponse.name || prev.name,
          phone: guestResponse.phone || prev.phone,
          email: guestResponse.email || prev.email
        }));
      }

      // Proceed to payment
      setCurrentStep(2);

    } catch (error) {
      console.error('Error processing guest:', error);
      toast.error(error.message || 'Error processing your request');
    }
  };

  // Handle payment method selection
  const handlePaymentMethod = async (method) => {
    try {
      if (method === 'payonline') {
        await handleRazorpayPayment();
      } else if (method === 'paylater') {
        await handlePayAtHotel();
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error(error.message || 'Error processing payment');
    }
  };

  // Handle Pay at Hotel
  const handlePayAtHotel = async () => {
    try {
      setIsProcessingPayment(true);
      // Get room number from URL if it exists (for room service)
      const urlParams = new URLSearchParams(window.location.search);
      const roomNumber = urlParams.get('roomNumber') || null;

      // Use selected guest data if available, otherwise use form data
      const guestData = selectedGuest || guestInfo;

      // Prepare customer data with priority to selected guest data
      const customerData = {
        _id: selectedGuest?._id || guestData._id,
        name: selectedGuest?.name?.trim() || guestData.name?.trim() || 'Guest Customer',
        phone: selectedGuest?.phone?.trim() || guestData.phone?.trim() || '0000000000',
        email: selectedGuest?.email?.trim() || guestData.email?.trim() || 'guest@example.com',
        roomNumber: roomNumber || selectedGuest?.roomNumber || guestData.roomNumber,
        ...(selectedGuest?.guestId && { guestId: selectedGuest.guestId }),
        ...(selectedGuest?.roomId && { roomId: selectedGuest.roomId }),
        ...(selectedGuest?.checkIn && { checkIn: selectedGuest.checkIn }),
        ...(selectedGuest?.checkOut && { checkOut: selectedGuest.checkOut }),
        ...(selectedGuest && { isDummy: false })
      };

      // Prepare order data
      const orderData = {
        items: cart.map(item => ({
          ...item,
          productId: item.id || item._id,
          name: item.name,
          price: parseFloat(item.price),
          qty: parseInt(item.qty),
          cgstAmount: parseFloat(item.cgstAmount) || 0,
          sgstAmount: parseFloat(item.sgstAmount) || 0,
          cgstPercent: parseFloat(item.cgstPercent) || 0,
          sgstPercent: parseFloat(item.sgstPercent) || 0
        })),
        customer: customerData,
        paymentMethod: 'pay_at_hotel',
        roomNumber: customerData.roomNumber,
        orderType: customerData.roomNumber ? 'room-service' : 'takeaway',
        total: parseFloat(totalAmount).toFixed(2),
        subtotal: cart.reduce((sum, item) => sum + (parseFloat(item.price) * parseInt(item.qty)), 0).toFixed(2),
        tax: cart.reduce((sum, item) => {
          const cgst = parseFloat(item.cgstAmount) || 0;
          const sgst = parseFloat(item.sgstAmount) || 0;
          return sum + ((cgst + sgst) * parseInt(item.qty));
        }, 0).toFixed(2),
        status: 'pending',
        paymentStatus: 'pending',
        notes: `Order placed by ${customerData.name} (${customerData.phone}) to pay at hotel`,
        source: 'web-checkout',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Create order in database
      const orderResponse = await fetch('/api/runningOrder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to create order');
      }

      const orderResponseData = await orderResponse.json();

      // If this is a room account, add to unpaid orders
      if (customerData.roomNumber) {
        await fetch(`/api/roomAccount/${customerData.roomNumber}/addUnpaidOrder`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId: orderResponseData._id,
            orderNumber: orderResponseData.orderNumber,
            items: orderData.items.map(item => ({
              productId: item.productId,
              name: item.name,
              price: item.price,
              quantity: item.qty,
              total: item.price * item.qty
            })),
            totalAmount: orderData.total
          })
        });
      }

      // Clear the cart
      if (typeof window !== 'undefined') {
        localStorage.removeItem('cart');
      }

      // Show success message
      toast.success('Order placed successfully! Please pay at the hotel.');

      // Show order confirmation
      setOrderConfirmation({
        orderNumber: orderResponseData.orderNumber,
        orderId: orderResponseData._id,
        paymentMethod: 'Pay at Hotel',
        status: 'pending',
        items: cart.map(item => ({
          ...item,
          cgstAmount: parseFloat(item.cgstAmount) || 0,
          cgstPercent: parseFloat(item.cgstPercent) || 0,
          sgstAmount: parseFloat(item.sgstAmount) || 0,
          sgstPercent: parseFloat(item.sgstPercent) || 0
        })),
        total: totalAmount,
        customer: customerData,
        timestamp: new Date().toISOString(),
        promoDiscount: cart.reduce((sum, item) => sum + (parseFloat(item.discountAmount) || 0) * item.qty, 0).toFixed(2)
      });

      // Move to confirmation step
      setCurrentStep(3);

    } catch (error) {
      console.error('Error creating pay at hotel order:', error);
      toast.error(error.message || 'Failed to place order. Please try again.');
    }
    finally {
      setIsProcessingPayment(false);
    }
  };

  // Handle Razorpay payment
  const handleRazorpayPayment = async () => {
    try {
      // Get room number from URL if it exists (for room service)
      const urlParams = new URLSearchParams(window.location.search);
      const roomNumber = urlParams.get('roomNumber') || null;

      // Use selected guest data if available, otherwise use form data
      const guestData = selectedGuest || guestInfo;

      // Prepare customer data with priority to selected guest data
      const customerData = {
        // Use guest ID from selected guest if available
        _id: selectedGuest?._id || guestData._id,
        // Use guest details from selected guest or form data
        name: selectedGuest?.name?.trim() || guestData.name?.trim() || 'Guest Customer',
        phone: selectedGuest?.phone?.trim() || guestData.phone?.trim() || '0000000000',
        email: selectedGuest?.email?.trim() || guestData.email?.trim() || 'guest@example.com',
        // Use room number from URL, then selected guest, then form data
        roomNumber: roomNumber || selectedGuest?.roomNumber || guestData.roomNumber,
        // Include guest ID if available from selected guest
        ...(selectedGuest?.guestId && { guestId: selectedGuest.guestId }),
        // Include any additional guest data from the selected guest
        ...(selectedGuest?.roomId && { roomId: selectedGuest.roomId }),
        ...(selectedGuest?.checkIn && { checkIn: selectedGuest.checkIn }),
        ...(selectedGuest?.checkOut && { checkOut: selectedGuest.checkOut }),
        // Make sure we're not using the dummy data if we have a real guest
        ...(selectedGuest && { isDummy: false })
      };

      console.log('Using customer data:', customerData);

      // Prepare order data with all guest and room information
      const orderData = {
        items: cart.map(item => ({
          ...item,
          productId: item.id || item._id,
          name: item.name,
          price: parseFloat(item.price),
          qty: parseInt(item.qty),
          cgstAmount: parseFloat(item.cgstAmount) || 0,
          sgstAmount: parseFloat(item.sgstAmount) || 0,
          cgstPercent: parseFloat(item.cgstPercent) || 0,
          sgstPercent: parseFloat(item.sgstPercent) || 0
        })),
        customer: {
          // Guest identification
          _id: customerData._id,
          guestId: customerData.guestId,

          // Contact information
          name: customerData.name || 'Guest Customer',
          phone: customerData.phone || '0000000000',
          email: customerData.email || 'guest@example.com',

          // Room information
          ...(customerData.roomNumber && { roomNumber: customerData.roomNumber }),
          ...(customerData.roomId && { roomId: customerData.roomId }),
          ...(customerData.checkIn && { checkIn: customerData.checkIn }),
          ...(customerData.checkOut && { checkOut: customerData.checkOut }),

          // Additional guest data
          ...(customerData.address && { address: customerData.address }),
          ...(customerData.idProof && { idProof: customerData.idProof }),
          ...(customerData.idNumber && { idNumber: customerData.idNumber })
        },

        // Order details
        paymentMethod: 'online',
        roomNumber: customerData.roomNumber || roomNumber || cart[0]?.roomNumber || null,
        orderType: (customerData.roomNumber || roomNumber || cart[0]?.roomNumber) ? 'room-service' : 'takeaway',
        total: parseFloat(totalAmount).toFixed(2),
        subtotal: cart.reduce((sum, item) => sum + (parseFloat(item.price) * parseInt(item.qty)), 0).toFixed(2),
        tax: cart.reduce((sum, item) => {
          const cgst = parseFloat(item.cgstAmount) || 0;
          const sgst = parseFloat(item.sgstAmount) || 0;
          return sum + ((cgst + sgst) * parseInt(item.qty));
        }, 0).toFixed(2),

        // Order metadata
        notes: `Order placed by ${customerData.name || 'Guest'} (${customerData.phone || 'No Phone'})`,
        source: 'web-checkout',

        // Add timestamps
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),

        // Add any additional metadata from the selected guest
        ...(selectedGuest?.bookingReference && { bookingReference: selectedGuest.bookingReference }),
        ...(selectedGuest?.reservationId && { reservationId: selectedGuest.reservationId })
      };

      console.log('Submitting order with data:', orderData);

      // Create order in database
      const orderResponse = await fetch('/api/runningOrder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json().catch(() => ({}));
        console.error('Order creation failed:', errorData);
        throw new Error(errorData.message || 'Failed to create order');
      }

      const orderResponseData = await orderResponse.json();

      // Create Razorpay order
      const razorpayResponse = await fetch('/api/razorpay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(parseFloat(totalAmount) * 100), // Convert to paise and ensure it's a number
          currency: 'INR',
          receipt: `order_${orderResponseData.orderId || orderResponseData._id}`,
          notes: {
            orderId: orderResponseData.orderId || orderResponseData._id,
            customerName: customerData.name
          },
          customer: {
            name: customerData.name,
            email: customerData.email,
            contact: customerData.phone,
            ...(customerData._id && { guestId: customerData._id })
          }
        })
      });

      const { id: orderId, amount, currency } = await razorpayResponse.json();
      // Load Razorpay script
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => {
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: amount,
          currency: currency,
          name: 'Hotel Shivam',
          description: 'Order Payment',
          order_id: orderId,
          handler: async function (response) {
            // Prepare verification data
            const verificationData = {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId: orderResponseData.orderId || orderResponseData._id || orderId
            };

            console.log('Verifying payment with data:', verificationData);

            // Verify payment on your server
            const verificationResponse = await fetch('/api/razorpay', {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                orderId: verificationData.orderId,
                razorpay_order_id: verificationData.razorpay_order_id,
                razorpay_payment_id: verificationData.razorpay_payment_id,
                razorpay_signature: verificationData.razorpay_signature
              })
            });

            const result = await verificationResponse.json();

            if (result.success) {
              toast.success('Payment successful! Order #' + result.orderNumber);

              // Clear the cart
              if (typeof window !== 'undefined') {
                localStorage.removeItem('cart');

              }

              // Show order confirmation
              setOrderConfirmation({
                orderNumber: result.orderNumber,
                orderId: verificationData.orderId,
                paymentMethod: 'Online',
                status: 'pending',
                paymentId: verificationData.razorpay_payment_id,
                items: cart.map(item => ({
                  ...item,
                  cgstAmount: parseFloat(item.cgstAmount) || 0,
                  cgstPercent: parseFloat(item.cgstPercent) || 0,
                  sgstAmount: parseFloat(item.sgstAmount) || 0,
                  sgstPercent: parseFloat(item.sgstPercent) || 0
                })),
                total: totalAmount,
                customer: customerData,
                timestamp: new Date().toISOString(),
                promoDiscount: cart.reduce((sum, item) => sum + (parseFloat(item.discountAmount) || 0) * item.qty, 0).toFixed(2)
              });

              // Move to confirmation step
              setCurrentStep(3);
            } else {
              toast.error('Payment verification failed');
            }
          },
          prefill: {
            name: guestInfo.name,
            email: guestInfo.email,
            contact: guestInfo.phone
          },
          theme: {
            color: '#3399cc'
          }
        };

        const rzp = new window.Razorpay({
          ...options,
          modal: {
            ondismiss: function () {
              toast.info('Payment was cancelled');
            }
          }
        });

        rzp.open();
      };
      script.onerror = () => {
        console.error('Failed to load Razorpay script');
        toast.error('Failed to load payment gateway. Please try again.');
      };
      document.head.appendChild(script);

    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Failed to process payment');
    }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-6 relative">
        <div className="flex justify-between items-center border-b pb-2 mb-4">
          <h2 className="text-xl font-bold text-center w-full">
            {currentStep === 1 ? "Guest Information" : "Review & Payment"}
          </h2>

        </div>

        {/* Progress Steps */}
        <div className="flex justify-between mb-6">
          <div className={`text-center ${currentStep >= 1 ? 'text-blue-600 font-bold' : 'text-gray-400'}`}>
            1. Guest Info
          </div>
          <div className={`text-center ${currentStep >= 2 ? 'text-blue-600 font-bold' : 'text-gray-400'} ${currentStep === 3 ? 'hidden' : ''}`}>
            2. Payment
          </div>
          <div className={`text-center ${currentStep >= 3 ? 'text-green-600 font-bold' : 'text-gray-400'}`}>
            {currentStep === 3 ? '3. Order Confirmation' : ''}
          </div>
        </div>

        {currentStep === 1 ? (
          // Step 1: Guest Information
          <form onSubmit={handleGuestSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                name="name"
                placeholder='Enter Name'
                value={guestInfo.name}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
                disabled={isSearching}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                name="email"
                placeholder='Enter Email'
                value={guestInfo.email}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
                disabled={isSearching}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input
                type="tel"
                name="phone"
                placeholder='Enter Phone'
                pattern="[0-9]{10}"
                maxLength={10}
                value={guestInfo.phone}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
                disabled={isSearching}
              />

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="mt-2 border rounded p-2 max-h-40 overflow-y-auto">
                  <p className="text-sm text-gray-600 mb-2">Existing guests found:</p>
                  {searchResults.map(guest => (
                    <div
                      key={guest._id}
                      className={`p-2 cursor-pointer hover:bg-gray-100 ${selectedGuest?._id === guest._id ? 'bg-blue-50' : ''}`}
                      onClick={() => selectGuest(guest)}
                    >
                      {guest.name} - {guest.phone}
                    </div>
                  ))}
                </div>
              )}

              {searchResults.length === 0 && guestInfo.phone && !isSearching && (
                <p className="text-sm text-gray-600 mt-1">No existing guest found. Please enter your details.</p>
              )}
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-blue-300 flex items-center gap-2"
                disabled={!guestInfo.name || !guestInfo.phone || !guestInfo.email || isSearching}
              >
                {isSearching ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Searching...
                  </>
                ) : 'Continue to Payment'}
              </button>
            </div>

          </form>
        ) : (
          // Step 2: Cart Review & Payment
          <div className="space-y-2">
            {currentStep === 3 && orderConfirmation ? (
              <div className="text-center p-2 bg-green-50 rounded-lg">
                <div className="text-green-500 text-2xl mb-4">✓</div>
                <h2 className="text-2xl font-bold mb-2">Dear Guest, {selectedGuest?.name || guestInfo?.name || 'Valued Customer'}!</h2>
                <p className="text-gray-600 my-2">Thank You !Your food order has been {orderConfirmation.status === 'Paid' ? 'placed and paid successfully' : 'confirmed'}</p>
                <p className="text-gray-600 my-2">We will notify you once your order is ready.</p>
                <div className="bg-white p-4 rounded-lg shadow-sm mb-6 text-left h-[50vh] overflow-y-auto">
                  <div className="flex justify-between items-center border-b pb-3 mb-3">
                    <h3 className="font-semibold">Order #{orderConfirmation.orderNumber}</h3>
                    <span className={`px-3 py-1 rounded-full text-sm ${orderConfirmation.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                      {orderConfirmation.status}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4 ">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date:</span>
                      <span>{new Date(orderConfirmation.timestamp).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment Method:</span>
                      <span>{orderConfirmation.paymentMethod}</span>
                    </div>
                    {orderConfirmation.paymentId && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Payment ID:</span>
                        <span className="text-sm">{orderConfirmation.paymentId}</span>
                      </div>
                    )}
                  </div>

                  <h4 className="font-medium mb-2">Order Summary</h4>
                  <div className="space-y-3 mb-4">
                    {orderConfirmation.items.map((item, index) => {
                      return (
                        <div key={index} className="border-b pb-2">
                          <div className="flex justify-between">
                            <span className="font-medium">{item.qty} × {item.name}</span>
                            <span>₹{(item.price * item.qty).toFixed(2)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="space-y-2 border-t pt-3">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>₹{orderConfirmation.items.reduce((sum, item) =>
                        sum + (item.price * item.qty), 0).toFixed(2)}
                      </span>
                    </div>
                    {(orderConfirmation.items.some(item => (item.cgstAmount && parseFloat(item.cgstAmount) > 0) || (item.cgstPercent && parseFloat(item.cgstPercent) > 0))) && (() => {
                      const totalCGST = orderConfirmation.items.reduce((sum, item) => {
                        if (item.cgstAmount) {
                          return sum + (parseFloat(item.cgstAmount) * item.qty) || 0;
                        } else if (item.cgstPercent && item.price) {
                          return sum + ((item.price * parseFloat(item.cgstPercent) / 100) * item.qty) || 0;
                        }
                        return sum;
                      }, 0);

                      return (
                        <div className="flex justify-between text-gray-600 text-sm">
                          <span>Total CGST</span>
                          <span>₹{totalCGST.toFixed(2)}</span>
                        </div>
                      );
                    })()}
                    {(orderConfirmation.items.some(item => (item.sgstAmount && parseFloat(item.sgstAmount) > 0) || (item.sgstPercent && parseFloat(item.sgstPercent) > 0))) && (() => {
                      const totalSGST = orderConfirmation.items.reduce((sum, item) => {
                        if (item.sgstAmount) {
                          return sum + (parseFloat(item.sgstAmount) * item.qty) || 0;
                        } else if (item.sgstPercent && item.price) {
                          return sum + ((item.price * parseFloat(item.sgstPercent) / 100) * item.qty) || 0;
                        }
                        return sum;
                      }, 0);
                      return (
                        <div className="flex justify-between text-gray-600 text-sm">
                          <span>Total SGST</span>
                          <span>₹{totalSGST.toFixed(2)}</span>
                        </div>
                      );
                    })()}
                    {orderConfirmation.promoDiscount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Promo Discount:</span>
                        <span>-₹{parseFloat(orderConfirmation.promoDiscount).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold border-t pt-2 mt-2">
                      <span>Total Amount:</span>
                      <span>₹{parseFloat(orderConfirmation.total).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 justify-center">
                  <button
                    onClick={async () => {
                      const html2pdf = (await import('html2pdf.js')).default;
                      
                      // Create a temporary div to hold our HTML content
                      const element = document.createElement('div');
                      element.style.padding = '20px';
                      element.style.fontFamily = 'Arial, sans-serif';
                      
                      // Calculate values
                      const subtotal = orderConfirmation.items.reduce((sum, item) => sum + (item.price * item.qty), 0);
                      const totalCGST = orderConfirmation.items.reduce((sum, item) => {
                        if (item.cgstAmount) return sum + (parseFloat(item.cgstAmount) * item.qty) || 0;
                        if (item.cgstPercent && item.price) return sum + ((item.price * parseFloat(item.cgstPercent) / 100) * item.qty) || 0;
                        return sum;
                      }, 0);
                      const totalSGST = orderConfirmation.items.reduce((sum, item) => {
                        if (item.sgstAmount) return sum + (parseFloat(item.sgstAmount) * item.qty) || 0;
                        if (item.sgstPercent && item.price) return sum + ((item.price * parseFloat(item.sgstPercent) / 100) * item.qty) || 0;
                        return sum;
                      }, 0);
                      const totalIGST = orderConfirmation.items.reduce((sum, item) => {
                        if (item.igstAmount) return sum + (parseFloat(item.igstAmount) * item.qty) || 0;
                        if (item.igstPercent && item.price) return sum + ((item.price * parseFloat(item.igstPercent) / 100) * item.qty) || 0;
                        return sum;
                      }, 0);
                      const grandTotal = subtotal + totalCGST + totalSGST + totalIGST;
                      // Build HTML content
                      element.innerHTML = `
                        <div style="width: 100%; max-width: 800px; margin: 0 auto; border: 1px solid #eee; border-radius: 5px; overflow: hidden;">
                          <!-- Header -->
                          <div style="background-color: #1e1e1e; color: white; padding: 10px 0; text-align: center;">
                            <h1 style="margin: 0; font-size: 20px; font-weight: bold;">RESTAURANT INVOICE</h1>
                          </div>
                          
                          <!-- Company Name -->
                          <div style="background-color: #228b78; color: white; padding: 10px 0; text-align: center;">
                            <h2 style="margin: 0; font-size: 22px; font-weight: bold;">HOTEL SHIVAN RESIDENCE</h2>
                          </div>
                          
                          <!-- Invoice Info -->
                          <div style="border: 1px solid #e0e0e0; border-radius: 5px; margin: 15px; padding: 10px; font-size: 12px;">
                            <div style="display: flex; justify-content: space-between; flex-wrap: wrap;">
                              <div>
                                <p style="margin: 5px 0;"><strong>Invoice #:</strong> ${orderConfirmation.orderNumber}</p>
                                <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date(orderConfirmation.timestamp).toLocaleString()}</p>
                                <p style="margin: 5px 0;"><strong>Status:</strong> ${orderConfirmation.status}</p>
                              </div>
                              <div style="text-align: right;">
                                <p style="margin: 5px 0;"><strong>Contact:</strong> +91 1234567890</p>
                                <p style="margin: 5px 0;"><strong>Email:</strong> info@hotelshivan.com</p>
                                <p style="margin: 5px 0;"><strong>GSTIN:</strong> 12ABCDE3456F7Z8</p>
                              </div>
                            </div>
                          </div>
                          
                          <!-- Guest Info -->
                          <div style="background-color: #f5f5f5; border: 1px solid #e0e0e0; border-radius: 5px; margin: 0 15px 15px; padding: 10px;">
                            <h3 style="margin: 0 0 10px 0; font-size: 14px;">Guest Information</h3>
                              <p style="margin: 5px 0;"><strong>Name:</strong> ${selectedGuest?.name || guestInfo?.name || 'Customer'}</p>
                              ${(selectedGuest?.phone || guestInfo?.phone) ? `<p style="margin: 5px 0;"><strong>Phone:</strong> ${selectedGuest?.phone || guestInfo?.phone}</p>` : ''}
                              ${(selectedGuest?.email || guestInfo?.email) ? `<p style="margin: 5px 0;"><strong>Email:</strong> ${selectedGuest?.email || guestInfo?.email}</p>` : ''}
                              ${selectedGuest?.address ? `<p style="margin: 5px 0;"><strong>Address:</strong> ${selectedGuest.address}</p>` : ''}
                          </div>
                          
                          <!-- Items Table -->
                          <table style="width: 100%; border-collapse: collapse; margin: 0 15px 15px; font-size: 12px;">
                            <thead>
                              <tr style="background-color: #228b78; color: white;">
                                <th style="padding: 10px; text-align: left;">Item</th>
                                <th style="padding: 10px; text-align: center;">Qty</th>
                                <th style="padding: 10px; text-align: center;">Rate</th>
                                <th style="padding: 10px; text-align: center;">Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              ${orderConfirmation.items.map(item => `
                                <tr style="border-bottom: 1px solid #eee;">
                                  <td style="padding: 10px;">${item.name}</td>
                                  <td style="padding: 10px; text-align: center;">${item.qty}</td>
                                  <td style="padding: 10px; text-align: center;">₹${item.price.toFixed(2)}</td>
                                  <td style="padding: 10px; text-align: center;">₹${(item.price * item.qty).toFixed(2)}</td>
                                </tr>
                              `).join('')}
                            </tbody>
                          </table>
                          <!-- Totals -->
                          <div style="margin: 0 15px 15px; text-align: right; font-size: 12px;">
                            <p style="margin: 5px 0;"><strong>Subtotal:</strong> ₹${subtotal.toFixed(2)}</p>
                            ${totalCGST > 0 ? `<p style="margin: 5px 0;"><strong>CGST:</strong> ₹${totalCGST.toFixed(2)}</p>` : ''}
                            ${totalSGST > 0 ? `<p style="margin: 5px 0;"><strong>SGST:</strong> ₹${totalSGST.toFixed(2)}</p>` : ''}
                            ${totalIGST > 0 ? `<p style="margin: 5px 0;"><strong>IGST:</strong> ₹${totalIGST.toFixed(2)}</p>` : ''}
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
                        filename: `invoice-${orderConfirmation.orderNumber}.pdf`,
                        image: { type: 'jpeg', quality: 0.98 },
                        html2canvas: { scale: 2 },
                        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
                        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
                      };

                      // Generate and download the PDF
                      html2pdf().set(opt).from(element).save();
                    }}
                    className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 transition-colors"
                  >
                    Download Invoice
                  </button>

                  <button
                    onClick={() => {
                      setCart([]);
                      setTotalAmount(0);
                      if (typeof window !== 'undefined') {
                        localStorage.removeItem('cart');
                        localStorage.removeItem('checkoutCurrentStep');
                      }
                      onClose();
                      window.location.href = '/';
                    }}
                    className="border border-gray-300 px-6 py-2 rounded hover:bg-gray-50 transition-colors"
                  >
                    New Order
                  </button>
                </div>

              </div>
            ) : (
              <>
                <div className="border rounded p-4 h-[55vh] overflow-y-auto">

                  <h3 className="font-bold mb-2">Order Summary</h3>
                  {cart.map(item => (
                    <div key={item.id} className="flex justify-between py-2 border-b">
                      <div className='flex items-center gap-5'>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-600">Qty: {item.qty}</p>
                        <div className='flex items-center gap-2'>
                          {item.cgstPercent ? (
                            <p className="text-sm text-gray-600">CGST: {item.cgstPercent}%</p>
                          ) : (
                            <p className="text-sm text-gray-600">CGST: ₹{(item.cgstAmount * item.qty).toFixed(2)}</p>
                          )}
                          {item.sgstPercent ? (
                            <p className="text-sm text-gray-600">SGST: {item.sgstPercent}%</p>
                          ) : (
                            <p className="text-sm text-gray-600">SGST: ₹{(item.sgstAmount * item.qty).toFixed(2)}</p>
                          )}
                        </div>
                      </div>
                      <p>₹{(item.price * item.qty).toFixed(2)}</p>
                    </div>
                  ))}
                  <div className="space-y-2 mt-4 pt-2 border-t">
                    <div className="flex justify-between">
                      <span className='text-black'>Subtotal:</span>
                      <span>₹{cart.reduce((sum, item) => sum + (item.price * item.qty), 0).toFixed(2)}</span>
                    </div>
                    {(cart[0]?.cgstPercent || cart[0]?.cgstAmount) && (
                      <div className="flex justify-between text-sm text-black">
                        <span>CGST Amount:</span>
                        <span>₹{cart.reduce((sum, item) => {
                          if (item.cgstPercent) {
                            // Calculate tax based on percentage
                            return sum + (item.price * item.qty * (parseFloat(item.cgstPercent) / 100) || 0);
                          } else {
                            // Use fixed amount
                            return sum + (parseFloat(item.cgstAmount || 0) * item.qty || 0);
                          }
                        }, 0).toFixed(2)}</span>
                      </div>
                    )}
                    {(cart[0]?.sgstPercent || cart[0]?.sgstAmount) && (
                      <div className="flex justify-between text-sm text-black">
                        <span>SGST Amount:</span>
                        <span>₹{cart.reduce((sum, item) => {
                          if (item.sgstPercent) {
                            // Calculate tax based on percentage
                            return sum + (item.price * item.qty * (parseFloat(item.sgstPercent) / 100) || 0);
                          } else {
                            // Use fixed amount
                            return sum + (parseFloat(item.sgstAmount || 0) * item.qty || 0);
                          }
                        }, 0).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold pt-2 border-t">
                      <span className='text-black'>Total Amount:</span>
                      <span className="text-lg">₹{parseFloat(totalAmount).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-bold">Select Payment Method</h3>
                  <button
                    onClick={() => handlePaymentMethod('payonline')}
                    className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600"
                  >
                    Pay Online
                  </button>
                  <button
                    onClick={() => handlePaymentMethod('paylater')}
                    className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
                    disabled={isProcessingPayment}
                  >
                    {isProcessingPayment ? (
                      <>
                        <span className='flex items-center justify-center gap-2'>
                          <Loader className='animate-spin mr-2' />
                          Processing order...
                        </span>
                      </>
                    ) : (
                      'Pay at Hotel'
                    )}
                  </button>
                </div>

                <div className="flex justify-between pt-4 border-t border-black">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="text-blue-500 hover:underline"
                  >
                    ← Back to Guest Info
                  </button>
                  <button
                    onClick={onClose}
                    className="text-gray-500 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
export default CheckoutModal;