'use server'

import connectDB from "@/lib/connectDB";
import CustomOrder from "@/models/CustomOrder";
import Order from "@/models/Order";
import Package from "@/models/Package";

export async function GetAllOrders(page = 1, limit = 20) {
    await connectDB();

    const skip = (page - 1) * limit;

    const orders = await Order.find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

    const customOrders = await CustomOrder.find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

    const totalOrders = (await Order.countDocuments() + await CustomOrder.countDocuments()); // Get total orders count
    const totalPages = Math.ceil(totalOrders / limit); // Calculate total pages

    // Convert MongoDB ObjectIds to strings
    orders.forEach(order => {
        order._id = order._id.toString();
        if (order.userId) order.userId = order.userId.toString();
    });

    customOrders.forEach(order => {
        order._id = order._id.toString();
        if (order.packageId) {
            order.packageId._id = order.packageId._id.toString();
        }
        order.userId = order.userId.toString();
    });


    return { orders, customOrders, totalPages };
}
