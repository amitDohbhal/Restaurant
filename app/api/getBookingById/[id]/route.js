import connectDB from "@/lib/connectDB";
import CustomOrder from "@/models/CustomOrder";
import Order from "@/models/Order";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
    await connectDB();
    const { id } = await params; // No need for await here since params is not a promise

    try {
        // First try to find in Order collection
        let order = await Order.findOne({ orderId: id });

        // If not found, try CustomOrder collection
        if (!order) {
            order = await CustomOrder.findOne({ orderId: id });
        }


        if (!order) {
            return NextResponse.json(
                { success: false, message: "No order found" },
                { status: 404 }
            );
        }

        return NextResponse.json(
            {
                success: true,
                order,
                type: order.customOrder ? "custom" : "regular"
            },
            { status: 200 }
        );

    } catch (error) {
        console.error("Error fetching order:", error);
        return NextResponse.json(
            {
                success: false,
                message: "Server error while fetching order",
                error: error.message
            },
            { status: 500 }
        );
    }
}
export async function PUT(req, { params }) {
    const { id } = await params;
    await connectDB();

    try {
        const body = await req.json();

        // Try to find and update in Order collection
        let updatedOrder = await Order.findOneAndUpdate(
            { orderId: id },
            { chatStatus: body.status },
            { new: true }
        );

        // If not found in Order, try CustomOrder
        if (!updatedOrder) {
            updatedOrder = await CustomOrder.findOneAndUpdate(
                { orderId: id },
                { chatStatus: body.status },
                { new: true }
            );
        }

        if (!updatedOrder) {
            return NextResponse.json({ message: "Order not found" }, { status: 404 });
        }

        return NextResponse.json(updatedOrder, { status: 200 });
    } catch (error) {
        console.error("Error updating order:", error);
        return NextResponse.json({ message: "Error updating order" }, { status: 500 });
    }
}