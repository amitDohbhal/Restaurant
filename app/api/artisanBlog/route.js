import connectDB from "@/lib/connectDB";
import mongoose from 'mongoose';
let Artisan;
try {
  Artisan = mongoose.model('Artisan');
} catch {
  Artisan = require('@/models/Artisan').default;
}
let ArtisanBlog;
try {
  ArtisanBlog = mongoose.model('ArtisanBlog');
} catch {
  ArtisanBlog = require('@/models/ArtisanBlog');
}

export async function POST(req) {
  try {
    await connectDB();
    const data = await req.json();
    // Minimal validation
    if (!data.title || !data.artisan) {
      return new Response(JSON.stringify({ message: 'Missing required fields' }), { status: 400 });
    }
    // Ensure only one of youtubeUrl or images is set
    const isYoutube = data.youtubeUrl && data.youtubeUrl.trim() !== '';
    const isImages = Array.isArray(data.images) && data.images.length > 0;
    const youtubeUrl = isYoutube ? data.youtubeUrl : '';
    const images = isImages && !isYoutube ? data.images : [];

    const blog = new ArtisanBlog({
      title: data.title,
      youtubeUrl,
      shortDescription: data.shortDescription || '',
      longDescription: data.longDescription || '',
      images,
      artisan: data.artisan
    });
    await blog.save();
    // Push blog._id to artisan's blogs array
    await Artisan.findByIdAndUpdate(
      data.artisan,
      { $push: { artisanBlogs: blog._id } },
      { new: true }
    );
    return new Response(JSON.stringify({ message: 'Blog created successfully', blog }), { status: 201 });
  } catch (err) {
    return new Response(JSON.stringify({ message: 'Error creating blog', error: err.message }), { status: 500 });
  }
}

export async function GET(req) {
  try {
    await connectDB();
    const url = req?.url ? new URL(req.url) : null;
    const artisanId = url?.searchParams?.get('artisanId');
    let blogs;
    if (artisanId) {
      blogs = await ArtisanBlog.find({ artisan: artisanId }).populate('artisan').sort({ createdAt: -1 });
    } else {
      blogs = await ArtisanBlog.find().populate('artisan').sort({ createdAt: -1 });
    }
    return new Response(JSON.stringify({ blogs }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ message: 'Error fetching blogs', error: error.message }), { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    await connectDB();
    const data = await req.json();
    const { id, ...updateFields } = data;
    if (!id) {
      return new Response(JSON.stringify({ message: 'Missing blog ID' }), { status: 400 });
    }
    Object.keys(updateFields).forEach(key => updateFields[key] === undefined && delete updateFields[key]);
    const updatedBlog = await ArtisanBlog.findByIdAndUpdate(id, updateFields, { new: true, overwrite: false });
    if (!updatedBlog) {
      return new Response(JSON.stringify({ message: 'Blog not found' }), { status: 404 });
    }
    return new Response(JSON.stringify({ message: 'Blog updated successfully', blog: updatedBlog }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ message: 'Error updating blog', error: error.message }), { status: 500 });
  }
}

import { deleteFileFromCloudinary } from '@/utils/cloudinary';

export async function DELETE(req) {
  try {
    await connectDB();
    const { id } = await req.json();
    const blog = await ArtisanBlog.findById(id);
    if (!blog) {
      return new Response(JSON.stringify({ message: 'Blog not found' }), { status: 404 });
    }
    // Delete all blog images from Cloudinary if present
    if (blog.images && Array.isArray(blog.images)) {
      for (const img of blog.images) {
        let key = '';
        if (typeof img === 'object' && img.key) {
          key = img.key;
        } else if (typeof img === 'string' && img) {
          // Legacy: extract from URL
          const urlParts = img.split('/upload/');
          if (urlParts.length === 2) {
            key = urlParts[1].replace(/\.[^/.]+$/, "");
          }
        }
        if (key) {
          try {
            await deleteFileFromCloudinary(key);
          } catch (err) {
            console.error('Failed to delete blog image from Cloudinary:', err.message);
          }
        }
      }
    }
    await ArtisanBlog.findByIdAndDelete(id);
    // Remove blog._id from artisan's blogs array
    await Artisan.findByIdAndUpdate(
      blog.artisan,
      { $pull: { artisanBlogs: blog._id } },
    );
    return new Response(JSON.stringify({ message: 'Blog deleted successfully' }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message || "Internal Server Error" }), { status: 500 });
  }
}
