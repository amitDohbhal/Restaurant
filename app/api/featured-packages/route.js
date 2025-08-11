import { NextResponse } from 'next/server';
import connectDB from "@/lib/connectDB";
import FeaturedPackageCard from "@/models/FeaturedPackageCard";
import cloudinary from 'cloudinary';

// Cloudinary configuration
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Function to shuffle array (Fisher-Yates algorithm)
const shuffleArray = (array) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
};

export const GET = async () => {
    try {
        await connectDB();
        const packages = await FeaturedPackageCard.find();
        const shuffledPackages = shuffleArray(packages);
        return NextResponse.json({
            success: true,
            data: shuffledPackages
        });
    } catch (error) {
        console.error('Error fetching packages:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch packages' },
            { status: 500 }
        );
    }
};

export const POST = async (req) => {
    try {
        await connectDB();
        const body = await req.json();
        const { title, image, link } = body;

        if (!title || !image) {
            return NextResponse.json(
                { success: false, message: 'Title and image are required' },
                { status: 400 }
            );
        }

        let imageUrl = '';
        let imagePublicId = '';

        // Handle image upload
        if (typeof image === 'string' && image.startsWith('data:')) {
            // New image upload
            try {
                const uploadResponse = await cloudinary.v2.uploader.upload(image, {
                    folder: 'featured-packages',
                });
                imageUrl = uploadResponse.secure_url;
                imagePublicId = uploadResponse.public_id;
            } catch (uploadError) {
                console.error('Error uploading image to Cloudinary:', uploadError);
                throw new Error('Failed to upload image');
            }
        } else if (image && typeof image === 'object' && image.url) {
            // Existing image (shouldn't normally happen in create, but just in case)
            imageUrl = image.url;
            imagePublicId = image.public_id || '';
        } else {
            return NextResponse.json(
                { success: false, message: 'Invalid image format' },
                { status: 400 }
            );
        }

        // Create new package
        const newPackage = new FeaturedPackageCard({
            title,
            link: link || '',
            image: {
                url: imageUrl,
                public_id: imagePublicId
            }
        });

        await newPackage.save();

        return NextResponse.json(
            { 
                success: true, 
                data: newPackage 
            },
            { status: 201 }
        );

    } catch (error) {
        console.error('Error creating package:', error);
        return NextResponse.json(
            { 
                success: false, 
                message: 'Failed to create package',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            },
            { status: 500 }
        );
    }
};