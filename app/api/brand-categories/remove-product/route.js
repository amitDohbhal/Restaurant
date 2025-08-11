import { NextResponse } from 'next/server';
import connectDB from "@/lib/connectDB";
import BrandCategory from '@/models/BrandCategory';

export async function PATCH(req) {
    await connectDB();
    
    try {
        const { productId } = await req.json();
        
        if (!productId) {
            return NextResponse.json(
                { error: 'Product ID is required' },
                { status: 400 }
            );
        }

        // Remove the product from all brand categories
        const result = await BrandCategory.updateMany(
            { 'products.product': productId },
            { 
                $pull: { 
                    products: { product: productId } 
                },
                $set: { updatedAt: new Date() }
            }
        );

        return NextResponse.json({
            success: true,
            message: `Product removed from ${result.modifiedCount} brand categories`,
            modifiedCount: result.modifiedCount
        });

    } catch (error) {
        console.error('Error removing product from brand categories:', error);
        return NextResponse.json(
            { 
                error: 'Failed to remove product from brand categories',
                details: error.message 
            },
            { status: 500 }
        );
    }
}
