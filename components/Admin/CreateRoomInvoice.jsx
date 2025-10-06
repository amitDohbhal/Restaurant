"use client"
import { Loader, Mail, Minus, Plus, Printer } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
const paymentOptions = [
    { label: "Online Payment", value: "online", color: "bg-pink-500 text-white", icon: "💳" },
    { label: "Cash Payment", value: "cash", color: "bg-cyan-600 text-white", icon: "💵" },
    { label: "Send To Room Account", value: "room", color: "bg-blue-700 text-white", icon: "🏨" },
];

const initialFoodRow = {
    category: '',
    inventory: '',
    qtyType: '',
    qty: '',
    amount: '',
    tax: '',
};

const CreateRoomInvoice = () => {
    const router = useRouter();
    const [room, setRoom] = useState('');
    const [guest, setGuest] = useState('');
    const [guestInfo, setGuestInfo] = useState(null);
    // Utility for unique ids
    function uuid() {
        return '_' + Math.random().toString(36).substr(2, 9);
    }
    const [isRazorpayLoaded, setIsRazorpayLoaded] = useState(false);
    const [foodRows, setFoodRows] = useState([{ ...initialFoodRow, id: `food-row-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` }]);
    const [selectedPayment, setSelectedPayment] = useState('');
    const [roomsList, setRoomsList] = useState([]);
    const [loadingRooms, setLoadingRooms] = useState(false);
    const [foodInventoryData, setFoodInventoryData] = useState([]);
    const [loadingFoodInventory, setLoadingFoodInventory] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [discount, setDiscount] = useState(0);
    const [extraCharges, setExtraCharges] = useState(0);
    const [totalAmount, setTotalAmount] = useState(0);
    const [gstAmount, setGstAmount] = useState(0);
    const [cgstAmount, setCGSTAmount] = useState(0);
    const [sgstAmount, setSGSTAmount] = useState(0);
    const [finalTotal, setFinalTotal] = useState(0);
    const [invoices, setInvoices] = useState([]);
    const [loadingInvoices, setLoadingInvoices] = useState(false);
    const [printInvoice, setPrintInvoice] = useState(null);
    const [isSendingEmail, setIsSendingEmail] = useState(false);
    const [hotelData, setHotelData] = useState(null);
    const hotelLogo = hotelData?.image?.url || '';
    // Fetch hotel data
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
    }, []);

    // Fetch invoices
    const fetchInvoices = async () => {
        setLoadingInvoices(true);
        try {
            const res = await fetch('/api/CreateRoomInvoice');
            const data = await res.json();
            if (data && data.invoices) {
                setInvoices(data.invoices);
            }
        } catch (error) {
            toast.error('Failed to load invoices');
        } finally {
            setLoadingInvoices(false);
        }
    };
    const fetchRooms = async () => {
        setLoadingRooms(true);
        try {
            const res = await fetch('/api/roomInfo');

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`HTTP error! status: ${res.status}`);
            }

            const data = await res.json();

            if (Array.isArray(data)) {
                // Map the API response to the expected format
                const formattedRooms = data.map(room => ({
                    _id: room._id,
                    roomNumber: room.RoomNo || room.roomNumber || '',
                    type: room.type || '',
                    isBooked: room.isBooked || false,
                    active: room.active !== false // Default to true if not specified
                }));
                setRoomsList(formattedRooms);
            } else {
                toast.error('Failed to load room data: Invalid response format');
            }
        } catch (err) {
            toast.error(`Failed to load room data: ${err.message}`);
        } finally {
            setLoadingRooms(false);
        }
    };
    const fetchFoodInventory = async () => {
        setLoadingFoodInventory(true);
        try {
            const res = await fetch('/api/foodInventory');
            const data = await res.json();
            console.log(data);
            if (data) {
                setFoodInventoryData(data);
            }
        } catch (err) {
            toast.error(`Failed to load food inventory: ${err.message}`);
        } finally {
            setLoadingFoodInventory(false);
        }
    };
    useEffect(() => {
        fetchRooms();
        fetchFoodInventory();
        fetchInvoices();
    }, []);

    // Format date to display
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 2
        }).format(amount || 0);
    };

    // Update food item details when selected
    const handleFoodItemSelect = (idx, foodItemId) => {
        const selectedItem = foodInventoryData.find(item => item._id === foodItemId);
        if (selectedItem) {
            const newRows = [...foodRows];
            newRows[idx] = {
                ...newRows[idx],
                foodItem: selectedItem,
                // qtyType: 'full' // Default to full quantity type
            };
            setFoodRows(newRows);
        }
    };

    // Handle room change and fetch guest information
    const handleRoomChange = async (e) => {
        const selectedRoomNumber = e.target.value;
        setRoom(selectedRoomNumber);
        setGuest(''); // Reset guest when room changes

        if (selectedRoomNumber) {
            try {
                const response = await fetch(`/api/addGuestToRoom?roomNumber=${selectedRoomNumber}&status=checked-in`);

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Failed to fetch guest information: ${response.status} ${response.statusText}`);
                }


                const guests = await response.json();

                if (guests && guests.length > 0) {
                    // Get the first guest in the room
                    const currentGuest = guests[0];

                    // Try different possible property names for guest name
                    const guestName = currentGuest.name || currentGuest.guestName || 'Guest';

                    setGuest(guestName);
                    setGuestInfo(currentGuest);
                } else {
                    toast.error(`No guest found in room ${selectedRoomNumber}. Please check if a guest is checked in.`);
                    setGuest('No guest found');
                    setGuestInfo(null);
                }
            } catch (error) {
                toast.error('Failed to load guest information');
                setGuest('Error loading guest');
                setGuestInfo(null);
            }
        } else {
            setGuestInfo(null);
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

    // When room changes, set guest name
    React.useEffect(() => {
        if (!room) {
            setGuest('');
            return;
        }
        const selected = roomsList.find(r => r.roomNumber === room);
        if (selected) {
            const nameParts = [
                selected.guestFirst?.trim(),
                selected.guestMiddle?.trim(),
                selected.guestLast?.trim()
            ].filter(Boolean); // Remove any empty strings
            setGuest(nameParts.join(' '));
        } else {
            setGuest('');
        }
    }, [room, roomsList]);

    // Add new food row
    const handleAddRow = () => {
        setFoodRows([...foodRows, { ...initialFoodRow, id: uuid() }]);
    };

    const handleDeleteRow = (idx) => {
        if (idx === 0) return; // Prevent deleting the first row
        const newRows = [...foodRows];
        newRows.splice(idx, 1);
        setFoodRows(newRows);
    };

    // Update food row
    const handleFoodRowChange = (idx, field, value) => {
        setFoodRows(foodRows.map((row, i) => i === idx ? { ...row, [field]: value } : row));
    };

    // Function to get price based on quantity type
    const getPriceForQtyType = (product, qtyType) => {
        switch (qtyType?.toLowerCase()) {
            case 'quarter':
                return parseFloat(product.quarterPrice || 0);
            case 'half':
                return parseFloat(product.halfPrice || 0);
            case 'full':
                return parseFloat(product.fullPrice || 0);
            case 'per piece':
                return parseFloat(product.perPiecePrice || 0);
            default:
                return 0;
        }
    };

    // Calculate GST for a given amount and GST percentage
    const calculateGST = (amount, percent) => {
        const pct = parseFloat(percent) || 0;
        if (pct > 0) {
            const gstAmount = (amount * pct) / 100;
            return parseFloat(gstAmount.toFixed(2));
        }
        return 0;
    };

    // Calculate totals whenever food rows change
    useEffect(() => {
        let foodTotal = 0;
        let totalCGST = 0;
        let totalSGST = 0;

        foodRows.forEach(row => {
            if (row.foodItem && row.qty && row.qtyType) {
                const itemPrice = getPriceForQtyType(row.foodItem, row.qtyType);
                const itemTotal = itemPrice * parseFloat(row.qty || 0);

                // Calculate CGST - use fixed amount if available, otherwise use percentage
                let cgst = 0;
                if (row.foodItem.cgstAmount !== null && row.foodItem.cgstAmount !== undefined) {
                    cgst = parseFloat(row.foodItem.cgstAmount);
                } else if (row.foodItem.cgstPercent) {
                    cgst = calculateGST(itemTotal, row.foodItem.cgstPercent);
                }

                // Calculate SGST - use fixed amount if available, otherwise use percentage
                let sgst = 0;
                if (row.foodItem.sgstAmount !== null && row.foodItem.sgstAmount !== undefined) {
                    sgst = parseFloat(row.foodItem.sgstAmount);
                } else if (row.foodItem.sgstPercent) {
                    sgst = calculateGST(itemTotal, row.foodItem.sgstPercent);
                }

                console.log(`Item: ${row.foodItem.foodName} - Price: ${itemPrice}, Qty: ${row.qty}, Total: ${itemTotal}`);
                console.log(`CGST: ${cgst} (${row.foodItem.cgstPercent ? row.foodItem.cgstPercent + '%' : 'Fixed: ' + row.foodItem.cgstAmount})`);
                console.log(`SGST: ${sgst} (${row.foodItem.sgstPercent ? row.foodItem.sgstPercent + '%' : 'Fixed: ' + row.foodItem.sgstAmount})`);

                foodTotal += itemTotal;
                totalCGST += cgst;
                totalSGST += sgst;
            }
        });

        // Calculate the final totals
    const totalGST = parseFloat((totalCGST + totalSGST).toFixed(2));
    const finalTotal = parseFloat((foodTotal + totalGST).toFixed(2));

    console.log('Final Calculation:');
    console.log(`Food Total: ${foodTotal}`);
    console.log(`Total CGST: ${totalCGST}`);
    console.log(`Total SGST: ${totalSGST}`);
    console.log(`Total GST: ${totalGST}`);
    console.log(`Final Total: ${finalTotal}`);

    // Update state with all tax information
    setTotalAmount(parseFloat(foodTotal.toFixed(2)));
    setGstAmount(totalGST);
    setFinalTotal(finalTotal);
    setCGSTAmount(parseFloat(totalCGST.toFixed(2)));
    setSGSTAmount(parseFloat(totalSGST.toFixed(2)));
    }, [foodRows]);

    const processRazorpayPayment = async (invoiceData) => {
        try {
            // Ensure Razorpay is loaded
            if (!window.Razorpay) {
                await loadRazorpay();
                // Add a small delay to ensure Razorpay is fully loaded
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            // Ensure finalTotal is used instead of totalAmount and convert to paise
            const amount = Math.round((invoiceData.finalTotal || invoiceData.totalAmount) * 100); // amount in paise, integer


            if (isNaN(amount) || amount <= 0) {
                throw new Error('Invalid amount for payment. Amount must be greater than 0.');
            }
            // Generate a unique receipt ID
            const receipt = `ROOM-INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            // Create order on your server
            const orderResponse = await fetch('/api/razorpay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: amount, // Must be integer paise
                    currency: 'INR',
                    receipt: receipt,
                    notes: {
                        type: 'room_invoice',
                        invoice_id: invoiceData._id,
                        guest_name: invoiceData.guestFirst || 'Guest',
                        room_number: invoiceData.roomNumber || 'N/A',
                        customerName: invoiceData.guestFirst || 'Guest',
                        roomNumber: invoiceData.roomNumber || 'N/A'
                    },
                    customer: {
                        name: invoiceData.guestFirst || 'Guest',
                        email: invoiceData.email || '',
                        phone: invoiceData.contact || ''
                    },
                    products: invoiceData.foodItems?.map(item => ({
                        name: item.foodName,
                        quantity: item.qty,
                        amount: item.amount
                    })) || []
                })
            });

            const orderData = await orderResponse.json();

            if (!orderResponse.ok || !orderData.success) {
                const errorMsg = orderData.error || 'Failed to create payment order';
                throw new Error(errorMsg);
            }

            // Prepare Razorpay options
            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: orderData.order.amount || amount,
                currency: 'INR',
                name: 'Hotel Shivan Residence',
                description: 'Room Invoice Payment',
                order_id: orderData.order.id,
                modal: {
                    ondismiss: function () {
                        toast.error('Payment was dismissed');
                    }
                },
                // Add prefill if available
                prefill: {
                    name: invoiceData.guestFirst || 'Guest',
                    contact: invoiceData.contact || '',
                    email: invoiceData.email || ''
                },
                theme: {
                    color: '#3399cc'
                },
                handler: async function (response) {
                    try {
                        console.log('Razorpay response:', response);

                        // 1. Verify payment on your server
                        const verifyResponse = await fetch('/api/razorpay', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                type: 'room_invoice',
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_signature: response.razorpay_signature,
                                invoiceId: invoiceData._id
                            })
                        });

                        const verificationData = await verifyResponse.json();
                        console.log('Verification response:', verificationData);

                        if (!verifyResponse.ok || !verificationData.success) {
                            throw new Error(verificationData.error || 'Payment verification failed');
                        }

                        // 2. Update the existing invoice with payment details
                        const updateData = {
                            id: invoiceData._id, // Include ID in the request body
                            paymentStatus: 'completed',
                            paymentDetails: {
                                status: 'completed',
                                method: 'online',
                                transactionId: response.razorpay_payment_id,
                                orderId: response.razorpay_order_id,
                                amount: invoiceData.finalTotal || invoiceData.totalAmount,
                                date: new Date().toISOString()
                            },
                            paidAmount: invoiceData.finalTotal || invoiceData.totalAmount,
                            dueAmount: 0
                        };

                        const updateResponse = await fetch('/api/CreateRoomInvoice', {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(updateData)
                        });

                        if (!updateResponse.ok) {
                            const errorData = await updateResponse.json();
                            throw new Error(errorData.error || 'Failed to update invoice with payment details');
                        }

                        toast.success('Payment successful & invoice updated!');
                        await fetchInvoices();
                    } catch (error) {
                        console.error('Payment error:', error);
                        toast.error('Payment failed: ' + error.message);
                    }
                },
                modal: {
                    ondismiss: function () {
                        toast.error('Payment was cancelled or window was closed');
                    }
                }
            };

            // Initialize and open Razorpay payment
            try {
                if (!window.rzp) {
                    const rzp = new window.Razorpay(options);

                    // Add event handlers
                    rzp.on('payment.failed', function (response) {
                        console.error('Payment failed:', response.error);
                        toast.error(`Payment failed: ${response.error.description}`);
                    });

                    // Open the Razorpay payment modal
                    rzp.open();

                    window.rzp = rzp;
                }

            } catch (error) {
                console.error('Error initializing Razorpay:', error);
                toast.error('Failed to initialize payment. Please try again.');
            }

        } catch (error) {
            // Only show error if not already shown by a more specific handler
            if (!toast.isActive('payment-error')) {
                toast.error(error.message || 'Failed to process your request', {
                    id: 'payment-error'
                });
            }
        }
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        // Basic validation
        if (!room || !guest) {
            toast.error('Please fill in all required fields');
            setSubmitting(false);
            return;
        }

        if (foodRows.length === 0 || foodRows.some(row => !row.foodItem || !row.qty || !row.qtyType)) {
            toast.error('Please add at least one food item with quantity');
            setSubmitting(false);
            return;
        }

        if (!selectedPayment) {
            toast.error('Please select a payment method');
            setSubmitting(false);
            return;
        }
        const selectedRoom = roomsList.find(r => r.roomNumber === room);
        if (!selectedRoom) {
            toast.error('Selected room not found');
            return;
        }

        // Prepare food items data with prices
        const foodItems = foodRows
            .filter(row => row.foodItem && row.qty && row.qtyType)
            .map(row => {
                const itemPrice = getPriceForQtyType(row.foodItem, row.qtyType);
                const amount = itemPrice * parseFloat(row.qty || 0);

                // Debug log the input values
                console.log('Item:', row.foodItem.foodName, 'Amount:', amount);
                console.log('CGST - Percent:', row.foodItem.cgstPercent, 'Fixed:', row.foodItem.cgstAmount);
                console.log('SGST - Percent:', row.foodItem.sgstPercent, 'Fixed:', row.foodItem.sgstAmount);

                // First calculate GST from percentage if percentage is provided
                const cgstFromPercent = row.foodItem.cgstPercent > 0
                    ? calculateGST(amount, row.foodItem.cgstPercent, 0)
                    : 0;

                const sgstFromPercent = row.foodItem.sgstPercent > 0
                    ? calculateGST(amount, row.foodItem.sgstPercent, 0)
                    : 0;

                // Then add fixed amounts if they exist
                const cgstAmount = cgstFromPercent + (parseFloat(row.foodItem.cgstAmount) || 0);
                const sgstAmount = sgstFromPercent + (parseFloat(row.foodItem.sgstAmount) || 0);

                // Debug log the calculated values
                console.log('Calculated CGST:', cgstAmount, 'SGST:', sgstAmount);

                // Get the original percentages for storage
                const cgstPercent = row.foodItem.cgstPercent || 0;
                const sgstPercent = row.foodItem.sgstPercent || 0;

                return {
                    categoryName: row.foodItem.categoryName,
                    foodName: row.foodItem.foodName,
                    qtyType: row.qtyType,
                    qty: Number(row.qty),
                    price: itemPrice,
                    amount: amount,
                    cgstPercent: cgstPercent,
                    cgstAmount: cgstAmount,
                    sgstPercent: sgstPercent,
                    sgstAmount: sgstAmount,
                    tax: cgstAmount + sgstAmount,
                    foodItem: row.foodItem._id // Store reference to the food item
                };
            });

        const { roomPrice, ...roomData } = selectedRoom; // Exclude roomPrice from selectedRoom

        // Get current date and time for invoice
        const now = new Date();
        const invoiceDate = now.toISOString().split('T')[0]; // YYYY-MM-DD format

        // Get dates from room account or use current date as fallback
        const checkInDate = guestInfo?.checkIn ? new Date(guestInfo.checkIn) : new Date(now);
        const checkOutDate = guestInfo?.checkOut ? new Date(guestInfo.checkOut) : new Date(now);

        // Format dates as YYYY-MM-DD
        const formatDate = (date) => date.toISOString().split('T')[0];

        // Calculate total days
        const timeDiff = Math.abs(checkOutDate - checkInDate);
        const totalDays = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)) || 1;

        const invoiceWithPayment = {
            // Room details from selected room
            roomNumber: roomData.roomNumber || roomData.RoomNo || '',
            roomType: roomData.roomType || roomData.type || 'Standard',
            roomPrice: roomData.roomPrice || 0,
            planType: roomData.planType || 'Room Only',
            checkIn: formatDate(checkInDate),
            checkOut: formatDate(checkOutDate),
            totalDays: totalDays,

            // Guest details
            guestFirst: guest.split(' ')[0] || 'Guest',
            guestMiddle: guest.split(' ').length > 2 ? guest.split(' ')[1] : '',
            guestLast: guest.split(' ').length > 1 ? guest.split(' ').slice(-1)[0] : '',
            email: guestInfo?.email || 'guest@example.com',
            contact: guestInfo?.phone || '0000000000',

            // Payment details - handle room payment mode specifically
            paymentMode: selectedPayment,
            paymentStatus: selectedPayment === 'online' ? 'pending' :
                selectedPayment === 'room' ? 'pending' : 'completed',
            paymentDetails: selectedPayment === 'online' ? null : {
                status: selectedPayment === 'room' ? 'pending' : 'completed',
                method: selectedPayment,
                transactionId: selectedPayment === 'cash' ? `CASH-${Date.now()}` :
                    selectedPayment === 'online' ? `ONLINE-${Date.now()}` :
                        `ROOM-${Date.now()}`,
                amount: finalTotal,
                date: new Date().toISOString()
            },

            // Invoice details
            invoiceDate: invoiceDate,
            invoiceNo: `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`,

            // Food items and totals
            foodItems,
            totalFoodAmount: totalAmount, // This is the subtotal before GST
            gstOnFood: gstAmount,
            cgstAmount: cgstAmount,
            sgstAmount: sgstAmount,
            totalAmount: finalTotal, // This is the final total including GST
            subtotal: totalAmount,   // Explicitly set subtotal (food only)
            paidAmount: selectedPayment === 'room' ? 0 : finalTotal,
            dueAmount: selectedPayment === 'room' ? finalTotal : 0,
            // Ensure all guest info is included
            guestFirst: guest.split(' ')[0] || 'Guest',
            guestLast: guest.split(' ').length > 1 ? guest.split(' ').slice(-1)[0] : '',
        };

        // Always create the invoice firt
        const response = await fetch('/api/CreateRoomInvoice', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(invoiceWithPayment)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to create invoice');
        }

        // Prepare invoice data with payment details
        const invoiceData = {
            ...data.invoice,
            _id: data.invoice._id,
            finalTotal: data.invoice.finalTotal || data.invoice.totalAmount
        };

        // Helper function to update room account with invoice
        const updateRoomAccountInvoice = async (paymentMode) => {
            if (!room) return;

            try {
                const roomAccountUpdate = {
                    roomNumber: room,
                    invoiceData: {
                        // Basic invoice info
                        invoiceId: invoiceData._id,
                        invoiceNo: invoiceData.invoiceNo || `INV-${Date.now()}`,
                        invoiceDate: new Date().toISOString(),

                        // Payment details
                        totalAmount: invoiceData.finalTotal || invoiceData.totalAmount || 0,
                        dueAmount: paymentMode === 'room' ? (invoiceData.finalTotal || invoiceData.totalAmount || 0) : 0,
                        paymentMode: paymentMode,
                        paymentStatus: paymentMode === 'room' ? 'unpaid' : 'paid',
                        ...(paymentMode !== 'room' && { paidAt: new Date().toISOString() }),

                        // Tax details
                        cgstAmount: invoiceData.cgstAmount || 0,
                        sgstAmount: invoiceData.sgstAmount || 0,
                        gstAmount: invoiceData.gstAmount || 0,
                        taxTotal: (invoiceData.cgstAmount || 0) + (invoiceData.sgstAmount || 0),

                        // Room and guest info
                        roomNumber: roomData?.roomNumber || roomData?.RoomNo || room,
                        roomType: roomData?.roomType || roomData?.type || '',
                        guestName: guest,
                        guestFirst: guest?.split(' ')[0] || 'Guest',
                        guestLast: guest?.split(' ').length > 1 ? guest.split(' ').slice(-1)[0] : '',

                        // Food items with proper tax calculations
                        foodItems: foodItems.map(item => ({
                            name: item.foodName || item.name || '',
                            qtyType: item.qtyType || 'full',
                            quantity: item.quantity || item.qty || 1,
                            price: item.price || 0,
                            amount: (item.quantity || item.qty || 1) * (item.price || 0),
                            cgstPercent: item.cgstPercent || 0,
                            cgstAmount: item.cgstAmount || 0,
                            sgstPercent: item.sgstPercent || 0,
                            sgstAmount: item.sgstAmount || 0,
                            taxTotal: (item.cgstAmount || 0) + (item.sgstAmount || 0),
                            totalAmount: ((item.quantity || item.qty || 1) * (item.price || 0)) + (item.cgstAmount || 0) + (item.sgstAmount || 0)
                        }))
                    }
                };

                const updateResponse = await fetch('/api/room-account/update-invoice', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(roomAccountUpdate)
                });

                if (!updateResponse.ok) {
                    const errorData = await updateResponse.json();
                    console.error('Failed to update room account:', errorData);
                    // Don't fail the whole operation, just log the error
                }

                // Mark the invoice as paid for non-room payments
                if (paymentMode !== 'room') {
                    await fetch('/api/room-account/mark-paid', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            roomNumber: room,
                            invoiceId: invoiceData._id,
                            paymentMode: paymentMode
                        })
                    });
                }
            } catch (error) {
                console.error('Error updating room account:', error);
                // Don't fail the whole operation, just log the error
            }
        };

        // If room account is selected, update the room account with the invoice
        if (room) {
            if (selectedPayment === 'room') {
                await updateRoomAccountInvoice('room');
            }
        }

        // Process online payment if selected
        if (selectedPayment === 'online') {
            const invoiceData = {
                ...data.invoice,
                _id: data.invoice._id,
                finalTotal: data.invoice.finalTotal || data.invoice.totalAmount
            };
            try {
                // Process Razorpay payment and wait for it to complete
                if (room && selectedPayment === 'room') {
                    // For room account payments, don't process Razorpay
                    await updateRoomAccountInvoice('room');
                } else {
                    // For online payments, process Razorpay
                    await processRazorpayPayment(invoiceData);

                    // Update room account for online payment
                    if (room) {
                        await updateRoomAccountInvoice('online');
                    }
                }
            } catch (error) {
                console.error('Payment processing error:', error);
                // If payment fails, update invoice to failed
                await fetch('/api/CreateRoomInvoice', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: invoiceData._id, // Include ID in the request body
                        paymentStatus: 'failed',
                        paymentError: error.message || 'Payment processing failed',
                        paymentDetails: {
                            status: 'failed',
                            error: error.message || 'Payment processing failed',
                            date: new Date().toISOString()
                        }
                    })
                });
                throw error;
            }
        } else {
            // For non-online payments, mark as completed immediately
            await fetch('/api/CreateRoomInvoice', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: data.invoice._id, // Include ID in the request body
                    paymentStatus: selectedPayment === 'room' ? 'pending' : 'completed',
                    paymentMode: selectedPayment === 'cash' ? 'cash' : (selectedPayment === 'room' ? 'room' : 'online'),
                    paymentError: null,
                    paidAmount: finalTotal,
                    dueAmount: 0
                })
            });

            // Update room account for cash payment
            if (room && selectedPayment === 'cash') {
                await updateRoomAccountInvoice('cash');
            }

            toast.success('Invoice Created Successfully!');
        }

        // Clear form and refresh invoices
        try {
            setRoom('');
            setGuest('');
            setSelectedPayment('');
            setDiscount(0);
            setExtraCharges(0);
            setFoodRows([{ foodItem: '', qty: '', qtyType: 'plate' }]);
            await fetchInvoices();
        } catch (error) {
            console.error('Error clearing form:', error);
            toast.error('Error clearing form');
        } finally {
            setSubmitting(false);
        }
    };

    const handlePrint = (inv) => {
        // Create a new window for printing
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            toast.error('Pop-up blocked. Please allow pop-ups for this site.');
            return;
        }

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

        const paidAmount = parseFloat(inv.paidAmount || 0).toFixed(2);

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
            <title>Invoice #${inv.invoiceNo || ''}</title>
            <style>
                @media print {
                    @page { 
                        size: 80mm auto;
                        margin: 0;
                    }
                    body { 
                        margin: 0;
                        padding: 5mm;
                        font-family: monospace;
                        font-size: 12px;
                        color: #000;
                    }
                    .invoice-container {
                        width: 100%;
                        max-width: 72mm;
                        margin: 0 auto;
                    }
                    .center { text-align: center; }
                    .right { text-align: right; }
                    .line { border-top: 1px dashed #000; margin: 5px 0; }
                    .title { 
                        font-size: 14px; 
                        font-weight: bold; 
                        margin-bottom: 5px;
                        text-align: center;
                    }
                    table { 
                        width: 100%; 
                        border-collapse: collapse;
                        margin: 5px 0;
                    }
                    th, td {
                        padding: 2px 0;
                        font-size: 11px;
                    }
                    th { 
                        border-bottom: 1px solid #000;
                        text-align: left;
                    }
                    .footer {
                        margin-top: 10px;
                        font-size: 10px;
                        text-align: center;
                    }
                    .text-right {
                        text-align: right;
                    }
                    .text-center {
                        text-align: center;
                    }
                }
            </style>
        </head>
        <body onload="window.print();window.close()">
            <div class="invoice-container">
                <!-- Hotel Info -->
                <div class="text-center">
                    <div class="title">${hotelData?.hotelName || 'Hotel Shivan Residence'}</div>
                    <div><b>GSTIN:</b> ${hotelData?.gstNumber || 'XXXXXXXXXXXXXXX'}</div>
                    <div>${hotelData?.address1 || ''}</div>
                    <div>${hotelData?.contactNumber1 || ''}</div>
                </div>
                <div class="line"></div>
        
                <!-- Guest + Invoice Info -->
                <div>
                    <div><b>Bill To:</b> ${guestName}</div>
                    <div><b>Room:</b> ${inv.roomNumber || 'N/A'}</div>
                    <div><b>Invoice:</b> ${inv.invoiceNo || 'N/A'}</div>
                    <div><b>Date:</b> ${formatDate(inv.invoiceDate || inv.createdAt) || 'N/A'}</div>
                </div>
                <div class="line"></div>
        
                <!-- Items -->
                <table>
                    <tr>
                        <th>Item</th>
                        <th>Qty</th>
                        <th class="right">Rate</th>
                        <th class="right">Amount</th>
                    </tr>
                    ${(inv.foodItems || []).map(item => `
                        <tr>
                            <td>${item.foodName || item.foodItem?.foodName || 'N/A'}</td>
                            <td class="text-center">${item.qty || 0}</td>
                            <td class="right">${formatCurrency(item.price || 0)}</td>
                            <td class="right">${formatCurrency(item.amount || 0)}</td>
                        </tr>
                    `).join('')}
                </table>
                <div class="line"></div>
        
                <!-- Totals -->
                <table>
                    ${inv.discount > 0 ? `
                        <tr>
                            <td colspan="3">Discount</td>
                            <td class="right">-${formatCurrency(inv.discount)}</td>
                        </tr>
                    ` : ''}
                    ${cgstAmount > 0 ? `
                        <tr>
                            <td colspan="3">CGST</td>
                            <td class="right">${formatCurrency(cgstAmount)}</td>
                        </tr>
                    ` : ''}
                    ${sgstAmount > 0 ? `
                        <tr>
                            <td colspan="3">SGST</td>
                            <td class="right">${formatCurrency(sgstAmount)}</td>
                        </tr>
                    ` : ''}
                    <tr>
                        <td colspan="3"><b>Total Amount</b></td>
                        <td class="right"><b>${formatCurrency(inv.totalAmount || 0)}</b></td>
                    </tr>
                </table>
                <div class="line"></div>
        
                <!-- Payment Info -->
                <div>
                    <div><b>Payment Mode:</b> ${(inv.paymentMode || '').toUpperCase()}</div>
                    <div><b>Status:</b> ${(inv.paymentStatus || '').toUpperCase()}</div>
                </div>
        
                <!-- Footer -->
                <div class="footer">
                    Thank you for your visit!<br>
                    This is a computer-generated invoice.<br>
                    ${new Date().toLocaleString()}
                </div>
            </div>
        </body>
        </html>`;

        // Write the invoice to the new window and trigger print
        printWindow.document.open();
        printWindow.document.write(invoiceHtml);
        printWindow.document.close();
    };

    const handleSendInvoiceEmail = async (invoice) => {
        if (!invoice?.email) {
            toast.error('No email address available for this guest');
            return;
        }

        setIsSendingEmail(true);

        try {
            // Format dates
            const formatDateForEmail = (dateString) => {
                if (!dateString) return 'N/A';
                const options = { day: '2-digit', month: 'short', year: 'numeric' };
                return new Date(dateString).toLocaleDateString('en-US', options);
            };

            // Format currency
            const formatCurrency = (amount) => {
                if (amount === undefined || amount === null) return '₹0.00';
                return new Intl.NumberFormat('en-IN', {
                    style: 'currency',
                    currency: 'INR',
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }).format(amount);
            };

            // Prepare the email content
            const emailContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>ROOM Invoice #${invoice.invoiceNo || ''}</title>
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
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
                        padding: 10px 20px;
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
                    .details-table td {
                        width: 50%;
                    }
                    .details-table p {
                        margin: 3px 0;
                        word-break: break-word;
                    }
                    .email {
                        color: #0073aa;
                        word-break: break-all;
                    }
                    .footer {
                        margin-top: 10px;
                        border-top: 1px solid #eee;
                        font-size: 12px;
                        color: #777;
                        text-align: center;
                    }
                </style>
            </head>
            <body>
                <div class="invoice-container">
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
                        <h2>ROOM INVOICE</h2>
                            <h2>INVOICE #${invoice.invoiceNo || invoice._id?.slice(-6).toUpperCase() || 'N/A'}</h2>
                            <p>Date: ${new Date(invoice.invoiceDate || Date.now()).toLocaleDateString()}</p>
                        </div>
                    </div>
                <h3>Details</h3>
                <table class="details-table">
                    <tr>
            <td>
  <strong>Bill To:</strong><br/>
  ${invoice.guestFirst || ''} ${invoice.guestMiddle || ''} ${invoice.guestLast || ''}<br/>
  ${invoice.email ? `Email: <span class="email">${invoice.email}</span><br/>` : ''}
  ${invoice.contact ? `Phone: ${invoice.contact}<br/>` : ''}
  ${invoice.roomNumber ? `Room: ${invoice.roomNumber}<br/>` : ''}
</td>
                        <td style="text-align: right;">
                            <p><strong>Invoice #:</strong> ${invoice.invoiceNo || ''}</p>
                            <p><strong>Date:</strong> ${formatDateForEmail(invoice.invoiceDate)}</p>
                            <p><strong>Payment Status:</strong> ${invoice.paymentStatus?.toUpperCase() || 'PENDING'}</p>
                            <p><strong>Payment Mode:</strong> ${invoice.paymentMode?.toLowerCase() === 'room' ? 'SEND TO ROOM ACCOUNT' : invoice.paymentMode?.toUpperCase() || 'N/A'}</p>
                        </td>
                    </tr>
                </table>
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Item</th>
                            <th>Qty</th>
                            <th>Rate</th>
                            <th>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                    ${(invoice.foodItems || []).map((item, i) =>
                `<tr>
                          <td>${i + 1}</td>
                          <td>${item.foodName || item.name || ''}${item.qtyType ? ` (${item.qtyType})` : ''}</td>
                          <td>${item.quantity || item.qty || 0}</td>
                          <td>${formatCurrency(item.price || 0)}</td>
                          <td>${formatCurrency(item.amount || 0)}</td>
                        </tr>`
            ).join('')}                      
                        ${invoice.cgstAmount > 0 ? `
                            <tr>
                                <td colspan="4" class="text-right">CGST </td>
                                <td>${formatCurrency(invoice.cgstAmount || 0)}</td>
                            </tr>
                        ` : ''}
                        ${invoice.sgstAmount > 0 ? `
                            <tr>
                                <td colspan="4" class="text-right">SGST </td>
                                <td>${formatCurrency(invoice.sgstAmount || 0)}</td>
                            </tr>
                        ` : ''}
                        ${invoice.discount > 0 ? `
                            <tr>
                                <td colspan="4" class="text-right">Discount</td>
                                <td>-${formatCurrency(invoice.discount || 0)}</td>
                            </tr>
                        ` : ''}
                        ${invoice.extraCharges > 0 ? `
                            <tr>
                                <td colspan="4" class="text-right">Extra Charges</td>
                                <td>${formatCurrency(invoice.extraCharges || 0)}</td>
                            </tr>
                        ` : ''}
                        <tr>
                            <td colspan="4" class="text-right">Total</td>
                            <td>${formatCurrency(invoice.totalAmount || 0)}</td>
                        </tr>
                    </tbody>
                </table>
                <div class="footer">
                    <p>Thank you for your business!</p>
                    <p>This is a computer-generated invoice. No signature required.</p>
                </div>
            </body>
            </html>
            `;

            // Send the email using Brevo
            const response = await fetch('/api/brevo', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    to: invoice.email,
                    subject: `Invoice #${invoice.invoiceNo || ''}`,
                    htmlContent: emailContent,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Failed to send email');
            }

            toast.success('Invoice has been sent to the guest\'s email');
        } catch (error) {
            console.error('Error sending invoice email:', error);
            toast.error('Failed to send invoice email: ' + (error.message || 'Unknown error'));
        } finally {
            setIsSendingEmail(false);
        }
    };

    return (
        <div className="">
            <div className="border border-black p-5 rounded max-w-5xl mx-auto">
                {/* Room & Guest Section */}
                <div className="flex flex-wrap gap-5 items-center mb-4">
                    <div className="flex items-center gap-2">
                        <label className="font-bold">Select Room Number</label>
                        <select
                            className="rounded px-8 py-2 bg-white border border-black text-black font-bold outline-none"
                            value={room}
                            onChange={handleRoomChange}
                            disabled={loadingRooms}
                            required
                        >
                            <option value="">Select</option>
                            {roomsList.map((r) => (
                                <option key={`room-${r._id || r.roomNumber}`} value={r.roomNumber}>
                                    {r.roomNumber}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="font-bold">Guest Name</label>
                        <input
                            type="text"
                            className="rounded px-8 py-2 bg-white border border-black text-black font-bold outline-none"
                            placeholder="Guest Name Come Here"
                            value={guest || ''}
                            disabled
                        />
                    </div>
                </div>
                {/* Food Entry Section */}
                <div className="bg-cyan-100 rounded-xl p-6 mb-6">
                    {foodRows.map((row, idx) => {
                        // Unique food categories from foodInventoryData
                        const categories = Array.from(new Set(foodInventoryData.map(item => item.categoryName)));

                        return (
                            <div key={`food-row-${row.id || idx}`} className="flex flex-wrap gap-4 items-center mb-4 border-b pb-4 last:border-b-0 last:pb-0">
                                <select
                                    className="rounded w-64 p-2 bg-white border border-black text-black font-bold outline-none"
                                    value={row.categoryName}
                                    onChange={e => handleFoodRowChange(idx, 'categoryName', e.target.value)}
                                >
                                    <option value="">Select Food Category</option>
                                    {categories.map(cat => (
                                        <option key={`cat-${cat}-${idx}`} value={cat}>
                                            {cat}
                                        </option>
                                    ))}
                                </select>
                                <div className="flex-1">
                                    <select
                                        className="w-64 px-10 py-2 bg-white border border-black text-black font-bold outline-none"
                                        value={row.foodItem?._id || ''}
                                        onChange={(e) => handleFoodItemSelect(idx, e.target.value)}
                                        required
                                    >
                                        <option value="">Select Food Item</option>
                                        {foodInventoryData.map((item) => (
                                            <option
                                                key={`food-${item._id}-${idx}`}
                                                value={item._id}
                                            >
                                                {item.foodName}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex-1">
                                    <select
                                        className="w-full p-2 bg-white border border-black text-black font-bold outline-none"
                                        value={row.qtyType || ''}
                                        onChange={(e) => handleFoodRowChange(idx, 'qtyType', e.target.value)}
                                        required
                                        disabled={!row.foodItem}
                                    >
                                        <option value="">Qty Type</option>
                                        {row.foodItem?.quarterPrice && <option value="quarter">Quarter (₹{row.foodItem.quarterPrice})</option>}
                                        {row.foodItem?.halfPrice && <option value="half">Half (₹{row.foodItem.halfPrice})</option>}
                                        {row.foodItem?.fullPrice && <option value="full">Full (₹{row.foodItem.fullPrice})</option>}
                                        {row.foodItem?.perPiecePrice && <option value="per piece">Per Piece (₹{row.foodItem.perPiecePrice})</option>}
                                    </select>
                                </div>
                                <input type="number" min="1" className="rounded w-28 px-4 py-2 bg-white border border-black text-black font-bold outline-none" placeholder="Qty" value={row.qty} onChange={e => handleFoodRowChange(idx, 'qty', e.target.value)} />
                                <button type="button" className="bg-blue-700 text-white rounded p-1 text-md flex items-center" onClick={handleAddRow}>
                                    <span className="text-2xl font-bold"><Plus /></span>
                                </button>
                                {idx > 0 && (
                                    <button type="button" className="bg-blue-700 text-white rounded p-1 text-md flex items-center" onClick={() => handleDeleteRow(idx)}>
                                        <span className="text-2xl font-bold"><Minus /></span>
                                    </button>
                                )}
                            </div>
                        )
                    })}

                </div>
                {/* Payment Buttons Section */}
                <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-3">Select Payment Method</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {paymentOptions.map((option, idx) => (
                            <button
                                key={`payment-${option.value}-${idx}`}
                                type="button"
                                className={`flex items-center justify-between px-4 py-3 rounded-lg border-2 transition-all ${selectedPayment === option.value ? 'border-green-500' : 'border-gray-200 hover:border-gray-300'}`}
                                onClick={() => setSelectedPayment(option.value)}
                            >
                                <div className="flex items-center">
                                    <span className="text-xl mr-2">{option.icon}</span>
                                    <span>{option.label}</span>
                                </div>
                                {selectedPayment === option.value && (
                                    <span className="text-green-500 ml-2">✓</span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
                {/* Table Display Section */}
                <form onSubmit={handleSubmit} className="container mx-auto p-4">
                    <label className="font-bold block mb-2">Display</label>
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr>
                                    <th className="bg-gray-300 text-black font-bold py-2 px-4 border">Food Item Name</th>
                                    <th className="bg-gray-300 text-black font-bold py-2 px-4 border">Qty Type</th>
                                    <th className="bg-gray-300 text-black font-bold py-2 px-4 border">Total Qty</th>
                                    <th className="bg-gray-300 text-black font-bold py-2 px-4 border">Amount</th>
                                    <th className="bg-gray-300 text-black font-bold py-2 px-4 border">Total</th>
                                    {/* <th className="bg-gray-300 text-black font-bold py-2 px-4 border">Edit</th> */}
                                </tr>
                            </thead>
                            <tbody>
                                {foodRows
                                    .filter(row => row.foodItem && row.qty && row.qtyType)
                                    .map((row, idx) => {
                                        const itemPrice = getPriceForQtyType(row.foodItem, row.qtyType);
                                        const amount = itemPrice * parseFloat(row.qty || 0);
                                        return (
                                            <tr key={`food-row-${row.foodItem?._id || idx}-${row.qtyType || ''}`}>
                                                <td className="bg-white border text-black text-center">{row.foodItem.foodName}</td>
                                                <td className="bg-white border text-black text-center">{row.qtyType}</td>
                                                <td className="bg-white border text-black text-center">{row.qty}</td>
                                                <td className="bg-white border text-black text-center">₹{amount.toFixed(2)}</td>
                                                <td className="bg-white border text-black text-center">₹{(amount + (row.cgstAmount || 0) + (row.sgstAmount || 0)).toFixed(2)}</td>
                                            </tr>
                                        );
                                    })}
                                {/* Totals Row */}
                                <tr>
                                    <td colSpan={4} className="bg-white border text-black font-bold text-right pr-4">Subtotal</td>
                                    <td className="bg-white border text-black font-bold text-center">₹{totalAmount.toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td colSpan={4} className="bg-white border text-black font-bold text-right pr-4">CGST</td>
                                    <td className="bg-white border text-black font-bold text-center">₹{cgstAmount.toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td colSpan={4} className="bg-white border text-black font-bold text-right pr-4">SGST</td>
                                    <td className="bg-white border text-black font-bold text-center">₹{sgstAmount.toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td colSpan={4} className="bg-white border text-black font-bold text-right pr-4">Total Tax</td>
                                    <td className="bg-white border text-black font-bold text-center">₹{gstAmount.toFixed(2)}</td>
                                </tr>
                                {/* <tr>
                                <td colSpan={4} className="bg-white border text-black font-bold text-right pr-4">Extra Charges</td>
                                <td className="bg-white border text-black font-bold text-center">
                                    <input 
                                        type="number" 
                                        min="0" 
                                        className="w-24 text-center border-b border-gray-400 outline-none"
                                        value={extraCharges}
                                        onChange={(e) => setExtraCharges(parseFloat(e.target.value) || 0)}
                                    />
                                </td>
                            </tr>
                            <tr>
                                <td colSpan={4} className="bg-white border text-black font-bold text-right pr-4">Discount</td>
                                <td className="bg-white border text-black font-bold text-center">
                                    <input 
                                        type="number" 
                                        min="0" 
                                        className="w-24 text-center border-b border-gray-400 outline-none"
                                        value={discount}
                                        onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                                    />
                                </td>
                            </tr> */}
                                <tr className="bg-gray-100">
                                    <td colSpan={4} className="border text-black font-bold text-right pr-4">Final Total</td>
                                    <td className="border text-black font-bold text-center">₹{finalTotal.toFixed(2)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    {/* Submit Button */}
                    <div className="mt-8 text-center">
                        <button
                            type="submit"
                            className="bg-blue-700 text-white px-8 py-3 rounded-lg text-lg font-bold hover:bg-blue-800 transition-colors disabled:opacity-50"
                            disabled={submitting || !room || !selectedPayment || foodRows.length === 0}
                        >
                            {submitting ? 'Creating Invoice...' : 'Create Invoice'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Invoices Table */}
            <div className="mt-12 border border-black rounded p-2">
                <h2 className="text-2xl font-bold mb-4">Recent Invoices</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-black overflow-hidden">
                        <thead className="bg-gray-100 border border-black">
                            <tr>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider border border-black">Invoice #</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider border border-black">Date</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider border border-black">Room</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider border border-black">Guest</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider border border-black">Payment</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider border border-black">Total</th>
                                <th className="px-2 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider border border-black">Print Invoice</th>
                                <th className="px-2 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider border border-black">Send Invoice Email</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {loadingInvoices ? (
                                <tr>
                                    <td colSpan="8" className="text-center py-8 text-gray-500">
                                        Loading invoices...
                                    </td>
                                </tr>
                            ) : invoices.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="text-center py-8 text-gray-500">
                                        No invoices found
                                    </td>
                                </tr>
                            ) : (
                                invoices.map((invoice) => (
                                    <tr key={invoice._id} className="hover:bg-gray-50 border border-black">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium border border-black text-blue-600 text-center">
                                            {invoice.invoiceNo}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border border-black text-center">
                                            {formatDate(invoice.invoiceDate)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-black text-center">
                                            {invoice.roomNumber}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-black text-center">
                                            {invoice.guestFirst} {invoice.guestLast}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border border-black text-center">
                                            {invoice.paymentMode === 'room' ? (
                                                <div className="flex flex-col">
                                                    <span>Room Account</span>
                                                    <span className="text-xs text-yellow-600">
                                                        {invoice.paymentStatus === 'pending' ? '(Pending)' : ''}
                                                    </span>
                                                </div>
                                            ) : (
                                                paymentOptions.find(opt => opt.value === invoice.paymentMode)?.label || invoice.paymentMode
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center border border-black">
                                            {formatCurrency(invoice.totalAmount)}
                                        </td>
                                        <td className="p-2 whitespace-nowrap text-right text-sm font-medium border border-black ">
                                            <button
                                                type="button"
                                                className="bg-blue-500 hover:bg-blue-600 text-white mx-auto px-2 py-1 flex items-center justify-center rounded"
                                                onClick={() => handlePrint(invoice)}
                                            >
                                                <Printer className="mr-2" /> Print
                                            </button>
                                        </td>
                                        <td className="p-2 whitespace-nowrap text-right text-sm font-medium border border-black ">
                                            <button
                                                type="button"
                                                className={`bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 mx-auto flex items-center justify-center rounded ${isSendingEmail ? 'opacity-75 cursor-not-allowed' : ''}`}
                                                onClick={() => handleSendInvoiceEmail(invoice)}
                                                disabled={isSendingEmail}
                                            >
                                                {isSendingEmail ? (
                                                    <>
                                                        <Loader />
                                                        Sending...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Mail className="mr-2 h-4 w-4" /> Send Email
                                                    </>
                                                )}
                                            </button>
                                        </td>
                                    </tr>
                                )))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default CreateRoomInvoice