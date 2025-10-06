import { NextResponse } from "next/server";
import connectDB from "@/lib/connectDB";
import CreateRoomInvoice from "@/models/CreateRoomInvoice";
import mongoose from 'mongoose';

// Generate invoice number (e.g., INV-20230824-001)
function generateInvoiceNumber() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(100 + Math.random() * 900);
  return `INV-${year}${month}${day}-${random}`;
}

// Helper function to handle errors
function handleError(error, defaultMessage = 'An error occurred') {
  console.error(error);
  return NextResponse.json(
    { success: false, error: error.message || defaultMessage },
    { status: 500 }
  );
}

export async function GET() {
  await connectDB();
  try {
    const invoices = await CreateRoomInvoice.find({})
      .populate('foodItems.foodItem')
      .sort({ createdAt: -1 });
    return NextResponse.json({ success: true, invoices });
  } catch (error) {
    return handleError(error, 'Failed to fetch invoices');
  }
}

export async function POST(req) {
  await connectDB();

  try {
    const body = await req.json();

    // Use the food items with taxes as sent from frontend
    const foodItemsWithTaxes = (body.foodItems || []).map(item => {
      try {
        const qty = parseFloat(item.qty) || 0;
        const price = parseFloat(item.price) || 0;
        const amount = qty * price;
        
        // Use the pre-calculated GST amounts from frontend
        const cgstAmount = parseFloat(item.cgstAmount) || 0;
        const sgstAmount = parseFloat(item.sgstAmount) || 0;
        const tax = cgstAmount + sgstAmount;

        return {
          ...item,
          amount: parseFloat(amount.toFixed(2)),
          cgstAmount: cgstAmount,
          sgstAmount: sgstAmount,
          tax: parseFloat(tax.toFixed(2))
        };
      } catch (error) {
        console.error('Error processing food item:', error);
        throw new Error(`Invalid food item data: ${error.message}`);
      }
    });

    // Use the totals calculated in the frontend
    const totalFoodAmount = parseFloat(body.totalFoodAmount) || 0;
    const totalCGST = parseFloat(body.cgstAmount) || 0;
    const totalSGST = parseFloat(body.sgstAmount) || 0;
    const totalGST = parseFloat(body.gstOnFood) || 0;

    // Calculate room charges
    const roomCharges = (parseFloat(body.roomPrice) || 0) * (parseInt(body.totalDays) || 1);

    // Calculate final total
    const subTotal = roomCharges + totalFoodAmount;
    const extraCharges = parseFloat(body.extraCharges) || 0;
    const discount = parseFloat(body.discount) || 0;
    const finalTotal = subTotal + totalGST + extraCharges - discount;

    // Create invoice data with a new ObjectId to prevent duplicate key errors
    const { _id, ...invoiceBody } = body; // Remove any existing _id from the request

    // Extract guest information with proper fallbacks
    const guestInfo = {
      guestFirst: body.guestFirst || body.guest?.split(' ')[0] || 'Guest',
      guestMiddle: body.guestMiddle || (body.guest?.split(' ').length > 2 ? body.guest.split(' ')[1] : ''),
      guestLast: body.guestLast || (body.guest?.split(' ').length > 1 ? body.guest.split(' ').slice(-1)[0] : ''),
      email: body.email || body.guestEmail || 'guest@example.com',
      contact: body.contact || body.guestContact || '0000000000',
    };

    // Handle room payment mode specifically
    const isRoomPayment = body.paymentMode === 'room';
    const paymentStatus = body.paymentStatus ||
      (isRoomPayment ? 'pending' :
        (body.paymentMode === 'online' ? 'pending' : 'completed'));

    const invoiceData = {
      ...invoiceBody,
      ...guestInfo,
      foodItems: foodItemsWithTaxes,
      totalFoodAmount: parseFloat(totalFoodAmount.toFixed(2)),
      cgstAmount: parseFloat(totalCGST.toFixed(2)),
      sgstAmount: parseFloat(totalSGST.toFixed(2)),
      gstAmount: parseFloat(totalGST.toFixed(2)),
      totalAmount: parseFloat(finalTotal.toFixed(2)),
      invoiceNo: body.invoiceNo || generateInvoiceNumber(),
      invoiceDate: body.invoiceDate || new Date().toISOString().split('T')[0],
      paymentStatus: paymentStatus,
      paymentMode: body.paymentMode || 'cash',
      // For room payments, set paidAmount to 0 and dueAmount to total
      paidAmount: isRoomPayment ? 0 : (body.paidAmount || (paymentStatus === 'completed' ? finalTotal : 0)),
      dueAmount: isRoomPayment ? finalTotal : (body.dueAmount || (paymentStatus === 'completed' ? 0 : finalTotal)),
      dueAmount: body.paymentStatus === 'completed' ? 0 : finalTotal,
      createdAt: new Date(),
      _id: new mongoose.Types.ObjectId() // Generate a new ObjectId
    };

    // Remove any undefined or null values
    Object.keys(invoiceData).forEach(key => {
      if (invoiceData[key] === undefined || invoiceData[key] === null) {
        delete invoiceData[key];
      }
    });



    // Create and save the invoice
    const invoice = new CreateRoomInvoice(invoiceData);
    await invoice.save();

    const responseData = {
      success: true,
      message: 'Invoice created successfully',
      invoice: invoice.toObject()
    };



    return NextResponse.json(responseData);

  } catch (error) {
    return handleError(error, 'Failed to create invoice');
  }
}

export async function PATCH(req) {
  await connectDB();

  try {
    const { id, ...updateData } = await req.json();

    // If updating food items, recalculate totals
    if (updateData.foodItems) {
      const foodItemsWithTaxes = updateData.foodItems.map(item => {
        const amount = parseFloat(item.qty) * parseFloat(item.price);
        const cgstAmount = (amount * (item.cgstPercent || 0)) / 100;
        const sgstAmount = (amount * (item.sgstPercent || 0)) / 100;
        const tax = cgstAmount + sgstAmount;

        return {
          ...item,
          amount: parseFloat(amount.toFixed(2)),
          cgstAmount: parseFloat(cgstAmount.toFixed(2)),
          sgstAmount: parseFloat(sgstAmount.toFixed(2)),
          tax: parseFloat(tax.toFixed(2))
        };
      });

      const totalFoodAmount = foodItemsWithTaxes.reduce((sum, item) => sum + item.amount, 0);
      const totalCGST = foodItemsWithTaxes.reduce((sum, item) => sum + item.cgstAmount, 0);
      const totalSGST = foodItemsWithTaxes.reduce((sum, item) => sum + item.sgstAmount, 0);
      const totalGST = totalCGST + totalSGST;

      updateData.foodItems = foodItemsWithTaxes;
      updateData.totalFoodAmount = parseFloat(totalFoodAmount.toFixed(2));
      updateData.cgstAmount = parseFloat(totalCGST.toFixed(2));
      updateData.sgstAmount = parseFloat(totalSGST.toFixed(2));
      updateData.gstAmount = parseFloat(totalGST.toFixed(2));

      // Recalculate total amount if room price or days are being updated
      if (updateData.roomPrice || updateData.totalDays) {
        const existingInvoice = await CreateRoomInvoice.findById(id);
        const roomCharges = parseFloat(updateData.roomPrice || existingInvoice.roomPrice) *
          parseInt(updateData.totalDays || existingInvoice.totalDays);
        const subTotal = roomCharges + totalFoodAmount;
        const finalTotal = subTotal + totalGST +
          parseFloat(updateData.extraCharges || existingInvoice.extraCharges || 0) -
          parseFloat(updateData.discount || existingInvoice.discount || 0);

        updateData.totalAmount = parseFloat(finalTotal.toFixed(2));
      }
    }

    const updatedInvoice = await CreateRoomInvoice.findByIdAndUpdate(id, updateData, { new: true });

    if (!updatedInvoice) {
      return NextResponse.json(
        { success: false, error: 'Invoice not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Invoice updated successfully',
      invoice: updatedInvoice
    });

  } catch (error) {
    return handleError(error, 'Failed to update invoice');
  }
}

export async function DELETE(req) {
  await connectDB();

  try {
    const { id } = await req.json();

    // Find the invoice first
    const invoice = await CreateRoomInvoice.findById(id);
    if (!invoice) {
      return NextResponse.json(
        { success: false, error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // Delete invoice from database
    await CreateRoomInvoice.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'Invoice deleted successfully'
    });

  } catch (error) {
    return handleError(error, 'Failed to delete invoice');
  }
}
