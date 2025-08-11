import { NextResponse } from "next/server";
import Order from "@/models/Order";
import connectDB from "@/lib/connectDB";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function GET(req) {
  await connectDB();
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized", success: false }, { status: 401 });
  }
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const skip = (page - 1) * limit;

    let filter = { agree: true };

    // Apply filters based on type
    if (type === 'booking_enquiry') {
      filter.paymentMethod = { $in: ['booking_enquiry'] };
    } else if (type === 'online') {
      filter.paymentMethod = { $in: ['razorpay', 'online'] };
    }

    // Get total count for pagination
    const total = await Order.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    // Get paginated orders
    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return NextResponse.json({
      orders,
      pagination: {
        total,
        totalPages,
        currentPage: page,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      success: true
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message, success: false }, { status: 500 });
  }
}