import connectDB from "@/lib/connectDB";
import mongoose from 'mongoose';
let Promotion, Artisan;
try {
  Promotion = mongoose.model('Promotion');
} catch {
  Promotion = require('@/models/Promotion');
}
try {
  Artisan = mongoose.model('Artisan');
} catch {
  Artisan = require('@/models/Artisan').default;
}

export async function GET(req) {
  try {
    await connectDB();
    const url = req?.url ? new URL(req.url, "http://localhost") : null;
    const artisanId = url?.searchParams?.get('artisanId');
    let filter = {};
    if (artisanId) {
      filter.artisan = artisanId;
    }
    const promotions = await Promotion.find(filter)
      .populate('artisan', 'firstName lastName title artisanNumber')
      .sort({ date: -1 });

    return new Response(JSON.stringify({ success: true, promotions }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const data = await req.json();
    const { title, shortDescription, rating, createdBy, date, artisan, image } = data;
    if (!title || !shortDescription || !createdBy || !date || !artisan || !image || !image.url || !image.key) {
      return new Response(JSON.stringify({ success: false, error: 'Missing required fields' }), { status: 400 });
    }
    const dateTimestamp = date ? new Date(date).getTime() : Date.now();
    const promotion = await Promotion.create({
      title,
      shortDescription,
      rating,
      createdBy,
      date: dateTimestamp,
      artisan,
      image: { url: image.url, key: image.key }
    });
    // Update the artisan to include this promotion
    await Artisan.findByIdAndUpdate(
      artisan,
      { $push: { promotions: promotion._id } },
      { new: true }
    );
    return new Response(JSON.stringify({ success: true, promotion }), { status: 201 });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    await connectDB();
    const data = await req.json();
    const { id, title, shortDescription, rating, createdBy, date, artisan, image } = data;
    const dateTimestamp = date ? new Date(date).getTime() : Date.now();
    const existingPromotion = await Promotion.findById(id);
    if (!existingPromotion) {
      return new Response(JSON.stringify({ success: false, message: 'Promotion not found' }), { status: 404 });
    }
    // If artisan is updated
    if (artisan && existingPromotion.artisan.toString() !== artisan) {
      // Remove promotion reference from old artisan
      await Artisan.findByIdAndUpdate(existingPromotion.artisan, {
        $pull: { promotions: id }
      });
      // Add promotion reference to new artisan
      await Artisan.findByIdAndUpdate(artisan, {
        $addToSet: { promotions: id }
      });
    }
    // Update promotion fields
    const update = {
      title,
      shortDescription,
      rating,
      createdBy,
      date: dateTimestamp,
      artisan
    };
    if (image && image.url && image.key) {
      update.image = { url: image.url, key: image.key };
    }
    const updatedPromotion = await Promotion.findByIdAndUpdate(
      id,
      update,
      { new: true }
    );
    return new Response(JSON.stringify({ success: true, promotion: updatedPromotion }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
  }
}

import { deleteFileFromCloudinary } from '@/utils/cloudinary';

export async function DELETE(req) {
  try {
    await connectDB();
    const { id } = await req.json();
    const promotion = await Promotion.findById(id);
    if (!promotion) return new Response(JSON.stringify({ success: false, message: 'Promotion not found' }), { status: 404 });
    // Delete the image from Cloudinary if it exists
    if (promotion.image?.key) {
      try {
        await deleteFileFromCloudinary(promotion.image.key);
      } catch (err) {
        // Log and continue deletion
        console.error('Failed to delete promotion image from Cloudinary:', err.message);
      }
    }
    // Remove from artisan
    await Artisan.findByIdAndUpdate(
      promotion.artisan,
      { $pull: { promotions: promotion._id } }
    );
    // Delete the promotion from database
    await Promotion.findByIdAndDelete(id);
    return new Response(JSON.stringify({ success: true, message: 'Promotion deleted' }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
  }
}

// export async function GET(req) {
//   try {
//     await connectDB();
//     const url = req?.url ? new URL(req.url) : null;
//     const artisanId = url?.searchParams?.get('artisanId');
//     let promotions;
//     if (artisanId) {
//       promotions = await Promotion.find({ artisan: artisanId }).populate('artisan', 'firstName lastName title artisanNumber');
//     } else {
//       promotions = await Promotion.find().populate('artisan', 'firstName lastName title artisanNumber');
//     }
//     return new Response(JSON.stringify(promotions), { status: 200 });
//   } catch (err) {
//     return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
//   }
// }
