import Blog from "@/models/Blog";
import connectDB from "@/lib/connectDB";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  await connectDB();
  const { id } = await params;
  try {
    const blog = await Blog.findById(id);
    if (!blog) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }
    return NextResponse.json(blog, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
