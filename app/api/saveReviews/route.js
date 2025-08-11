import Review from "@/models/Review";
import connectDB from "@/lib/connectDB";
import { NextResponse } from "next/server";

export const GET = async (req) => {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');
        const productId = searchParams.get('productId');
        // const packageId = searchParams.get('packageId') || productId;
        const type = searchParams.get('type');
        const artisanId = searchParams.get('artisanId');
        const approved = searchParams.get('approved');

        let filter = { deleted: false };

        // Handle approved filter robustly (only set once)
        if (approved !== null && approved !== undefined) {
            filter.approved = approved === 'true';
        }

        // Filter by package ID if provided
        if (productId) {
            filter.product = productId;
        }

        // Filter by artisan ID if provided
        if (artisanId) {
            filter.artisan = artisanId;
        }

        // Handle type filtering (set type if provided and not 'all')
        if (type && type !== 'all') {
            filter.type = type;
        }

        const reviews = await Review.find(filter)
            .sort({ createdAt: -1 })
            .populate('artisan', 'name')
            .populate('product', 'title')
            .lean();

        // Convert MongoDB documents to plain objects
        const safeReviews = reviews.map(review => {
            const serialized = {
                ...review,
                _id: review._id?.toString(),
                product: review.product ? {
                    _id: review.product._id?.toString(),
                    title: review.product.title
                } : null,
                artisan: review.artisan ? {
                    _id: review.artisan._id?.toString(),
                    name: review.artisan.name
                } : null,
                thumb: review.thumb ? {
                    url: review.thumb.url,
                    key: review.thumb.key
                } : null,
                date: review.date ? Number(review.date) : null,
                createdAt: review.createdAt ? new Date(review.createdAt).toISOString() : null,
                updatedAt: review.updatedAt ? new Date(review.updatedAt).toISOString() : null,
            };

            // Remove any undefined values
            Object.keys(serialized).forEach(key => {
                if (serialized[key] === undefined) {
                    delete serialized[key];
                }
            });

            return serialized;
        });

        return new NextResponse(JSON.stringify({ success: true, reviews: safeReviews }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Error in GET /api/saveReviews:', error);
        return new NextResponse(JSON.stringify({
            success: false,
            message: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
export const POST = async (req) => {
    try {
        await connectDB();
        const data = await req.json();
        // For all review types, ensure they require admin approval
        const reviewData = { ...data };
        // Remove artisan/product references for 'all' type reviews
        if (reviewData.type === 'all') {
            delete reviewData.artisan;
            delete reviewData.product;
        }
        // All new reviews require admin approval
        reviewData.approved = false;

        // Convert date to timestamp if it's a string
        if (reviewData.date && typeof reviewData.date === 'string') {
            reviewData.date = new Date(reviewData.date).getTime();
        } else if (!reviewData.date) {
            // If no date provided, use current timestamp
            reviewData.date = Date.now();
        }

        // Create the review
        const review = new Review({
            name: reviewData.name,
            date: reviewData.date || Date.now(),
            thumb: reviewData.thumb,
            rating: reviewData.rating,
            title: reviewData.title,
            description: reviewData.description,
            type: reviewData.type,
            product: reviewData.product,
            artisan: reviewData.artisan,
            approved: reviewData.approved,
            deleted: false
        });

        const savedReview = await review.save();


        return NextResponse.json({
            message: "Review submitted successfully",
            review: savedReview
        }, { status: 201 });
    } catch (error) {
        console.error("REVIEW ERROR", error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
};

export const PUT = async (req) => {
    try {
        await connectDB();
        const data = await req.json();
        const review = await Review.findOne({ _id: data._id });
        if (!review) {
            return NextResponse.json({ message: "Review not found" }, { status: 404 });
        }

        // Handle deleted status changes
        if (typeof data.deleted === 'boolean') {
            review.deleted = data.deleted;
        }

        if (typeof data.approved === 'boolean') {
            review.approved = data.approved;
        }

        // Save the review updates
        await review.save();

        const responseData = {
            message: `Review ${data.approved !== undefined ?
                (data.approved ? 'approved' : 'disapproved') :
                'updated'} successfully`,
            review
        };

        return NextResponse.json(responseData);

    } catch (error) {
        console.error('Error updating review:', error);
        return NextResponse.json(
            { message: error.message || 'Failed to update review' },
            { status: 500 }
        );
    }
};

export const DELETE = async (req) => {
    try {
        await connectDB();
        const { _id } = await req.json();
        const review = await Review.findById(_id);
        if (!review) {
            return NextResponse.json({ message: "Review not found" }, { status: 404 });
        }
        review.deleted = true;
        await review.save();
        return NextResponse.json({ message: "Review deleted (soft)!" }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
};