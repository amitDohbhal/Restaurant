import { NextResponse } from 'next/server';
import connectDB from "@/lib/connectDB";
import BrandCategory from '@/models/BrandCategory';

export async function POST(req) {
    await connectDB();
    try {
        const {
            title,
            slug,
            buttonLink,
            banner,
            brandId,
            products,
            profileImage,
            order,
            active,
            brandCategory,
            productCategory
        } = await req.json();

        const existingSlug = await BrandCategory.findOne({ slug });
        if (existingSlug) {
            return NextResponse.json(
                { 
                    success: false,
                    error: 'A brand category with this slug already exists. Please choose a different slug.',
                    field: 'slug'
                },
                { status: 400 }
            );
        }

        // Then check if the title-brand combination exists
        const existingTitleBrand = await BrandCategory.findOne({ 
            title, 
            brand: brandId 
        });
        
        if (existingTitleBrand) {
            return NextResponse.json(
                { 
                    success: false,
                    error: 'A brand category with this name already exists for the selected brand.',
                    existingId: existingTitleBrand._id 
                },
                { status: 400 }
            );
        }

        const newBrandCategory = new BrandCategory({
            title,
            slug,
            buttonLink,
            banner,
            profileImage,
            order,
            active,
            brand: brandId,
            products: products ? products.map(p => ({
                product: p.product,
                productName: p.productName
            })) : [],
            brandCategory
        });

        await newBrandCategory.save();

        // Optionally update the brand and product with this relationship
        // You might want to add these references if needed
        // await Brand.findByIdAndUpdate(brandId, { $push: { categories: newBrandCategory._id } });
        // await Product.findByIdAndUpdate(productId, { $push: { brandCategories: newBrandCategory._id } });

        return NextResponse.json(newBrandCategory, { status: 201 });
    } catch (error) {
        return NextResponse.json(
            { error: `Failed to create brand category: ${error.message}` },
            { status: 500 }
        );
    }
}

export async function GET(request) {
    await connectDB();
    try {
        const { searchParams } = new URL(request.url);
        const brandId = searchParams.get('brand');
        
        const query = {};
        if (brandId) {
            query.brand = brandId;
        }

        const brandCategories = await BrandCategory.find(query)
            .populate({
                path: 'brand',
                select: 'title buttonLink'
            })
            .populate({
                path: 'products.product',
                model: 'Product',
                select: 'title'
            })
            .lean();

        return NextResponse.json(brandCategories);
    } catch (error) {
        // console.error('Error fetching brand categories:', error);
        return NextResponse.json(
            { error: 'Failed to fetch brand categories' },
            { status: 500 }
        );
    }
}