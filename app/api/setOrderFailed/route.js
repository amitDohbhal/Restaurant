import connectDB from "@/lib/connectDB";
import Order from "@/models/Order";
import { NextResponse } from "next/server";

export async function POST(req) {
    await connectDB();
    const { id } = await req.json();

    try {
        const order = await Order.findOne({ orderId: id });
        if (!order) {
            return NextResponse.json({ message: "Order not found" }, { status: 404 });
        }

        order.status = "failed";
        await order.save();

        return NextResponse.json({ message: "Order status updated to failed" }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}