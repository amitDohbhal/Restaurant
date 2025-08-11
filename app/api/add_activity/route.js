import connectDB from "@/lib/connectDB";
import Activity from '@/models/Activity';
import { deleteFileFromCloudinary } from "@/utils/cloudinary";

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();
    const { title, slug, active } = body;
    if (!title) {
      return new Response(JSON.stringify({ error: 'Missing required field: title' }), { status: 400 });
    }
    const activity = await Activity.create({
      title,
      slug,
      active: typeof active === 'boolean' ? active : true
    });
    return new Response(JSON.stringify(activity), { status: 201 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

export async function GET(req) {
  try {
    await connectDB();
    const activities = await Activity.find({}, 'title active slug');
    return new Response(JSON.stringify(activities), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    await connectDB();
    const body = await req.json();
    const { id, title, slug, active } = body;
    if (!id) {
      return new Response(JSON.stringify({ error: 'Missing required field: id' }), { status: 400 });
    }
    const update = {};
    if (title !== undefined) update.title = title;
    if (slug !== undefined) update.slug = slug;
    if (active !== undefined) update.active = active;
    const activity = await Activity.findByIdAndUpdate(id, update, { new: true });
    if (!activity) {
      return new Response(JSON.stringify({ error: 'Activity not found' }), { status: 404 });
    }
    return new Response(JSON.stringify(activity), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    await connectDB();
    const body = await req.json();
    const { id } = body;
    if (!id) {
      return new Response(JSON.stringify({ error: 'Missing required field: id' }), { status: 400 });
    }
    const activity = await Activity.findByIdAndDelete(id);
    if (!activity) {
      return new Response(JSON.stringify({ error: 'Activity not found' }), { status: 404 });
    }
    // Delete all associated images from Cloudinary
    const cloudinaryImages = [];
    if (activity.imageFirst && activity.imageFirst.key) cloudinaryImages.push(activity.imageFirst.key);
    if (activity.bannerImage && activity.bannerImage.key) cloudinaryImages.push(activity.bannerImage.key);
    if (activity.mainProfileImage && activity.mainProfileImage.key) cloudinaryImages.push(activity.mainProfileImage.key);
    if (Array.isArray(activity.imageGallery)) {
      activity.imageGallery.forEach(img => {
        if (img && img.key) cloudinaryImages.push(img.key);
      });
    }
    // Delete each image from Cloudinary using the utility
    for (const publicId of cloudinaryImages) {
      try {
        await deleteFileFromCloudinary(publicId);
      } catch (err) {
        // Log error but continue
        console.error('Failed to delete image from Cloudinary:', publicId, err?.message || err);
      }
    }
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
