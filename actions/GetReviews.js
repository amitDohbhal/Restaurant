'use server'

import connectDB from "@/lib/connectDB";
import Review from "@/models/Review";
import User from "@/models/User";

export const getReviews = async () => {
    try {
        await connectDB();
        const reviews = await Review.find()
            .sort({ createdAt: -1 })
            .lean(); // Convert Mongoose objects to plain JS objects

        const formattedReviews = reviews?.map((review) => ({
            ...review,
            _id: review?._id?.toString()
        }));

        return formattedReviews;
    } catch (error) {
        console.error("Error fetching reviews:", error);
        return [];
    }
};
