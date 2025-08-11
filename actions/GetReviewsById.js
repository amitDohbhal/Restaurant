'use server';

import mongoose from "mongoose";
import connectDB from "@/lib/connectDB";
import Review from "@/models/Review";
import User from "@/models/User";
import { NextResponse } from "next/server";

export const getReviewsById = async (id) => {
    try {
        await connectDB();

        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return []; // Return empty array for invalid ID
        }

        // Find reviews by packageId and populate user details
        const reviews = await Review.find({ packageId: id })
            .populate({
                path: 'user',
                select: 'name email', // Only return essential user fields
            })
            .sort({ createdAt: -1 })
            .lean();

        // Ensure reviews is always an array
        if (!reviews || reviews.length === 0) {
            return []; // Return empty array instead of { error: "No reviews found" }
        }

        // Convert _id fields to strings
        return reviews.map((review) => ({
            ...review,
            _id: review._id.toString(),
            packageId: review.packageId.toString(),
            user: {
                ...review.user,
                _id: review.user._id.toString(),
            },
        }));
    } catch (error) {
        console.error("Error fetching reviews:", error);
        return []; // Always return an empty array on error
    }
};
