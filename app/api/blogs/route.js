import { NextResponse } from "next/server";
import connectDB from "@/lib/connectDB";
import Blog from "@/models/Blog";

// GET: Fetch all blogs
export async function GET() {
  await connectDB();
  try {
    const blogs = await Blog.find().sort({ date: -1 });
    return NextResponse.json({ blogs }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Create a new blog
export async function POST(req) {
  try {
        await connectDB();
        const data = await req.json();
        // Minimal validation
        if (!data.title) {
          return new Response(JSON.stringify({ message: 'Missing required fields' }), { status: 400 });
        }
        // Ensure only one of youtubeUrl or images is set
        const isYoutube = data.youtubeUrl && data.youtubeUrl.trim() !== '';
        const isImages = Array.isArray(data.images) && data.images.length > 0;
        const youtubeUrl = isYoutube ? data.youtubeUrl : '';
        const images = isImages && !isYoutube ? data.images : [];
    
        const blog = new Blog({
          title: data.title,
          youtubeUrl,
          shortDescription: data.shortDescription || '',
          longDescription: data.longDescription || '',
          images,
        });
    // const blog = new Blog(body);
    await blog.save();
     return new Response(JSON.stringify({ message: 'Blog created successfully', blog }), { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
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
    const updatedBlog = await Blog.findByIdAndUpdate(id, updateFields, { new: true, overwrite: false });
    if (!updatedBlog) {
      return new Response(JSON.stringify({ message: 'Blog not found' }), { status: 404 });
    }
    return new Response(JSON.stringify({ message: 'Blog updated successfully', blog: updatedBlog }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ message: 'Error updating blog', error: error.message }), { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    await connectDB();
    const { id } = await req.json();
    const blog = await Blog.findById(id);
    if (!blog) {
      return new Response(JSON.stringify({ message: 'Blog not found' }), { status: 404 });
    }
    await Blog.findByIdAndDelete(id);
    return new Response(JSON.stringify({ message: 'Blog deleted successfully' }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message || "Internal Server Error" }), { status: 500 });
  }
}
