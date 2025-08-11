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

export const PUT = async (req, { params }) => {
    try {
        await connectDB();
        const { id } = await params; // Await the params
        
        const body = await req.json();
        const { title, image, link } = body;

        let imageUrl = null;
        let imagePublicId = null;

        // Handle image update if provided
        if (image) {
            // If image is a base64 string (new upload)
            if (typeof image === 'string' && image.startsWith('data:')) {
                const uploadResponse = await cloudinary.v2.uploader.upload(image, {
                    folder: 'featured-packages',
                });
                imageUrl = uploadResponse.secure_url;
                imagePublicId = uploadResponse.public_id;
            } 
            // If image is an object with url and public_id (existing image)
            else if (typeof image === 'object' && image.url && image.public_id) {
                imageUrl = image.url;
                imagePublicId = image.public_id;
            }
        }

        const updateData = { 
            ...(title && { title }),
            ...(link && { link }),
            ...(imageUrl && { 
                image: { 
                    url: imageUrl, 
                    public_id: imagePublicId 
                } 
            })
        };

        const updatedPackage = await FeaturedPackageCard.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedPackage) {
            return NextResponse.json(
                { success: false, message: 'Package not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: updatedPackage
        });

    } catch (error) {
        console.error('Error updating featured package:', error);
        return NextResponse.json(
            { 
                success: false, 
                message: 'Failed to update package',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            },
            { status: 500 }
        );
    }
};

export const DELETE = async (req, { params }) => {
    try {
        await connectDB();
        const { id } = await params; // Await the params

        const deletedPackage = await FeaturedPackageCard.findByIdAndDelete(id);
        
        if (!deletedPackage) {
            return NextResponse.json(
                { success: false, message: 'Package not found' },
                { status: 404 }
            );
        }

        // Delete image from Cloudinary if exists
        if (deletedPackage.image?.public_id) {
            try {
                await cloudinary.v2.uploader.destroy(deletedPackage.image.public_id);
            } catch (cloudinaryError) {
                console.error('Error deleting image from Cloudinary:', cloudinaryError);
                // Don't fail the request if image deletion fails
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Package deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting featured package:', error);
        return NextResponse.json(
            { 
                success: false, 
                message: 'Failed to delete package',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            },
            { status: 500 }
        );
    }
};