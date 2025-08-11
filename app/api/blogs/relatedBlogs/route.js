import connectDB from '@/lib/connectDB';
import Blog from '@/models/Blog';
import { NextResponse } from 'next/server';

// GET /api/blogs/relatedBlogs?exclude=<blogId>
export async function GET(req) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const excludeId = searchParams.get('exclude');
  let filter = {};
  if (excludeId) {
    filter = { _id: { $ne: excludeId } };
  }
  try {
    const blogs = await Blog.find(filter).sort({ createdAt: -1 });
    return NextResponse.json(blogs, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch related blogs' }, { status: 500 });
  }
}
