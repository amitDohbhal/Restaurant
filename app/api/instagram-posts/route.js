import connectDB from "@/lib/connectDB";
import InstagramPost from '@/models/InstagramPost';

export async function GET(req) {
  await connectDB();
  const posts = await InstagramPost.find().sort({ createdAt: -1 });
  return Response.json(posts);
}

export async function POST(req) {
  await connectDB();
  const body = await req.json();
  const { image, url } = body;
  if (!image || !url) {
    return new Response(JSON.stringify({ error: 'Image and url are required.' }), { status: 400 });
  }
  const post = await InstagramPost.create({ image, url, type: "instagram" });
  return Response.json(post, { status: 201 });
}

export async function PATCH(req) {
  await connectDB();
  const body = await req.json();
  const { image, url, id } = body;
  if (!image || !url || !id) {
    return new Response(JSON.stringify({ error: 'Image, url, and id are required.' }), { status: 400 });
  }
  const post = await InstagramPost.findByIdAndUpdate(id, { image, url, type: "instagram" }, { new: true });
  return Response.json(post, { status: 200 });
}

export async function DELETE(req) {
  await connectDB();
  const body = await req.json();
  const { id } = body;
  if (!id) {
    return new Response(JSON.stringify({ error: 'ID is required.' }), { status: 400 });
  }
  const post = await InstagramPost.findByIdAndDelete(id);
  return Response.json(post, { status: 200 });
}