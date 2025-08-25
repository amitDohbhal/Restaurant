import { NextResponse } from "next/server";
import connectDB from "@/lib/connectDB";
import RoomInvoice from "@/models/RoomInvoice";

export async function GET(req) {
    try {
        await connectDB();       
        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get('limit')) || 10;
        const skip = parseInt(searchParams.get('skip')) || 0;
        
        console.log(`Query params - limit: ${limit}, skip: ${skip}`);
        
        const [invoices, total] = await Promise.all([
            RoomInvoice.find({})
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            RoomInvoice.countDocuments({})
        ]);
        
        console.log(`Found ${invoices.length} invoices out of ${total} total`);
        
        if (invoices.length === 0) {
            console.log('No invoices found in the database');
        }
        
        return NextResponse.json({ 
            success: true,
            count: invoices.length,
            total,
            invoices 
        }, { status: 200 });
        
    } catch (error) {
        console.error('Error in GET /api/roomInvoice:', error);
        return NextResponse.json({ 
            success: false,
            error: error.message || 'Failed to fetch invoices',
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}

export async function POST(req) {
    await connectDB();
    try {
        let data = await req.json();
        // Only allow one of percent or amount for CGST
        if (data.cgstPercent && data.cgstPercent !== '') {
          data.cgstAmount = null;
        } else if (data.cgstAmount && data.cgstAmount !== '') {
          data.cgstPercent = null;
        } else {
          data.cgstPercent = null;
          data.cgstAmount = null;
        }
        // Only allow one of percent or amount for SGST
        if (data.sgstPercent && data.sgstPercent !== '') {
          data.sgstAmount = null;
        } else if (data.sgstAmount && data.sgstAmount !== '') {
          data.sgstPercent = null;
        } else {
          data.sgstPercent = null;
          data.sgstAmount = null;
        }
        // Generate invoiceNo: HMD-YYYYMMDD-XXXX
        const today = new Date();
        const datePart = today.toISOString().slice(0,10).replace(/-/g, '');
        const randomPart = Math.floor(1000 + Math.random() * 9000);
        data.invoiceNo = `HMD-${datePart}-${randomPart}`;
        // Remove any invoiceNo sent from client
        if (data.invoiceNo && typeof data.invoiceNo !== 'string') delete data.invoiceNo;
        // Accept Razorpay payment details if present
        const razorpayPaymentFields = ['razorpayPaymentId', 'razorpayOrderId', 'razorpaySignature', 'paymentStatus', 'paymentResponse'];
        razorpayPaymentFields.forEach(field => {
          if (data[field]) {
            data[field] = data[field];
          }
        });
        const newInvoice = new RoomInvoice(data);
        await newInvoice.save();
        return NextResponse.json(newInvoice, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: `Failed to create invoice: ${error.message}` }, { status: 500 });
    }
}

export async function PATCH(req) {
    await connectDB();
    try {
        const { id, ...updateData } = await req.json();
        // Only allow one of percent or amount for CGST
        if (updateData.cgstPercent && updateData.cgstPercent !== '') {
          updateData.cgstAmount = null;
        } else if (updateData.cgstAmount && updateData.cgstAmount !== '') {
          updateData.cgstPercent = null;
        } else {
          updateData.cgstPercent = null;
          updateData.cgstAmount = null;
        }
        // Only allow one of percent or amount for SGST
        if (updateData.sgstPercent && updateData.sgstPercent !== '') {
          updateData.sgstAmount = null;
        } else if (updateData.sgstAmount && updateData.sgstAmount !== '') {
          updateData.sgstPercent = null;
        } else {
          updateData.sgstPercent = null;
          updateData.sgstAmount = null;
        }
        const updatedInvoice = await RoomInvoice.findByIdAndUpdate(id, updateData, { new: true });
        return NextResponse.json(updatedInvoice, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: `Failed to update invoice: ${error.message}` }, { status: 500 });
    }
}

export async function DELETE(req) {
    await connectDB();
    try {
        const { id } = await req.json();

        // Find the banner first
        const banner = await RoomInvoice.findById(id);
        if (!banner) {
            return NextResponse.json({ error: "Banner not found" }, { status: 404 });
        }

        // Delete banner from database
        await RoomInvoice.findByIdAndDelete(id);

        return NextResponse.json({ message: "Banner deleted successfully" }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: `Failed to delete banner: ${error.message}` }, { status: 500 });
    }
}
