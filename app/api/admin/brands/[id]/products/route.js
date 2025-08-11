import { NextResponse } from 'next/server';
import connectDB from '@/lib/connectDB';
import Brand from '@/models/Brand';
import Product from '@/models/Product';

export async function POST(req, { params }) {
    await connectDB();
    const { id: brandId } = params;
    const { productId } = await req.json();

    try {
        // Add product to brand
        const updatedBrand = await Brand.findByIdAndUpdate(
            brandId,
            { $addToSet: { products: productId } },
            { new: true }
        );

        // Also update the product with brand reference
        await Product.findByIdAndUpdate(
            productId,
            { $set: { brand: brandId } },
            { new: true }
        );

        return NextResponse.json(updatedBrand);
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to add product to brand' },
            { status: 500 }
        );
    }
}

export async function GET(req, { params }) {
    await connectDB();
    const { id: brandId } = params;

    try {
        const brand = await Brand.findById(brandId)
            .populate('products')
            .lean();
            
        if (!brand) {
            return NextResponse.json(
                { error: 'Brand not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(brand.products || []);
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to fetch brand products' },
            { status: 500 }
        );
    }
}

export async function DELETE(req, { params }) {
    await connectDB();
    const { id: brandId } = params;
    const { productId } = await req.json();

    try {
        // Remove product from brand
        const updatedBrand = await Brand.findByIdAndUpdate(
            brandId,
            { $pull: { products: productId } },
            { new: true }
        );

        // Also remove brand reference from product
        await Product.findByIdAndUpdate(
            productId,
            { $unset: { brand: "" } },
            { new: true }
        );

        return NextResponse.json(updatedBrand);
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to remove product from brand' },
            { status: 500 }
        );
    }
}
