import { NextResponse } from "next/server";
import connectDB from "@/lib/connectDB";
import CustomOrderVisitors from "@/models/CustomOrderVisitors";

export const POST = async (req) => {
    try {
        await connectDB();
        const body = await req.json();
        const { userId, packageId, totalAmount, amount, formData, bookingDetails, heliFormData, customPackageForm } = body;

        // Check if an order already exists for this user and package
        const existingOrder = await CustomOrderVisitors.findOne({ 
            userId, 
            packageId 
        });

        if (existingOrder) {
            // Update the existing order
            await CustomOrderVisitors.updateOne(
                { _id: existingOrder._id },
                {
                    $set: {
                        amount,
                        totalAmount,
                        formData,
                        bookingDetails,
                        heliFormData,
                        customPackageForm,
                        updatedAt: new Date()
                    }
                }
            );

            return NextResponse.json({ 
                message: "Custom order visitor updated successfully",
                updated: true 
            }, { status: 200 });
        } else {
            // Create a new order
            const customOrderVisitors = new CustomOrderVisitors({
                userId,
                packageId,
                amount,
                totalAmount,
                formData,
                bookingDetails,
                heliFormData,
                customPackageForm
            });

            await customOrderVisitors.save();

            return NextResponse.json({ 
                message: "Custom order visitor saved successfully",
                updated: false 
            }, { status: 201 });
        }
    } catch (error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
};