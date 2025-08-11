'use server'

import connectDB from "@/lib/connectDB";
import Order from "@/models/Order";
// import Package from "@/models/Package";
import Product from "@/models/Product";

export async function GetAllOrder() {
    await connectDB();

    const orders = await Order.find({})
        .sort({ createdAt: -1 })
        .lean();

    orders.forEach(order => {
        order._id = order._id.toString();
        if (order.userId) order.userId = order.userId.toString();
    });


    return { orders };
}
