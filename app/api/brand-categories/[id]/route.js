// app/api/brand-categories/[id]/route.js
import { NextResponse } from 'next/server';
import connectDB from "@/lib/connectDB";
import BrandCategory from '@/models/BrandCategory';
import { deleteFileFromCloudinary } from '@/utils/cloudinary';

export async function GET(req, { params }) {
    await connectDB();
    try {
        const { id } =await params;
        const category = await BrandCategory.findById(id);
        
        if (!category) {
            return NextResponse.json(
                { error: 'Brand category not found' },
                { status: 404 }
            );
        }
        
        return NextResponse.json(category);
    } catch (error) {
        console.error('Error fetching brand category:', error);
        return NextResponse.json(
            { error: 'Failed to fetch brand category' },
            { status: 500 }
        );
    }
}
export async function PATCH(req, { params }) {
    await connectDB();
    try {
        const { id } = await params;
        const updateData = await req.json();
        
        // Always get the full document first
        let category = await BrandCategory.findById(id);

        if (!category) {
            // Create a new brand category if it doesn't exist
            const newCategory = new BrandCategory({
                _id: id,
                ...updateData
            });
            const savedCategory = await newCategory.save();
            return NextResponse.json(savedCategory, { status: 201 });
        }

        // If this is a product update
        if (updateData.$push?.products) {
            const { product, productName } = updateData.$push.products;
            
            // Check if product already exists
            const exists = category.products.some(p => 
                p.product.toString() === product
            );
            
            if (!exists) {
                category.products.push({
                    product,
                    productName
                });
                category.updatedAt = new Date();
                await category.save();
            }
            
            return NextResponse.json(category);
        }

        // For regular updates, ensure required fields are preserved
        const { title, slug, products, ...otherFields } = updateData;
        const updatePayload = {
            title: title || category.title,
            slug: slug || category.slug,
            ...otherFields,
            updatedAt: new Date()
        };

        // Only update products if they are provided
        if (products) {
            updatePayload.products = products.map(p => ({
                product: p.product,
                productName: p.productName || ''
            }));
        }

        const updatedCategory = await BrandCategory.findByIdAndUpdate(
            id,
            updatePayload,
            { new: true, runValidators: true }
        );

        if (!updatedCategory) {
            throw new Error('Failed to update brand category');
        }

        return NextResponse.json(updatedCategory);
    } catch (error) {
        console.error('Update error:', error);
        return NextResponse.json(
            { error: `Failed to update brand category: ${error.message}` },
            { status: 500 }
        );
    }
}

export async function DELETE(request, { params }) {
    try {
        const { id } =await params;
        if (!id) {
            return NextResponse.json({ error: 'Brand category ID is required' }, { status: 400 });
        }

        await connectDB();

        // Find the category first to get image keys
        const category = await BrandCategory.findById(id);
        if (!category) {
            return NextResponse.json({ error: 'Brand category not found' }, { status: 404 });
        }

        // Delete images from Cloudinary if they exist
        try {
            if (category.banner?.key) {
                await deleteFileFromCloudinary(category.banner.key);
            }
            if (category.profileImage?.key) {
                await deleteFileFromCloudinary(category.profileImage.key);
            }
        } catch (error) {
            // console.error('Error deleting images from Cloudinary:', error);
            // Continue with deletion even if image deletion fails
        }

        // Delete the category
        await BrandCategory.findByIdAndDelete(id);

        return NextResponse.json({ success: true, message: 'Brand category deleted successfully' });
    } catch (error) {
        // console.error('Error deleting brand category:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to delete brand category' },
            { status: 500 }
        );
    }
}