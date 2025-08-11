import connectDB from "@/lib/connectDB";
import mongoose from 'mongoose';
import "@/models/Promotion";
import "@/models/ArtisanBlog";
import "@/models/ArtisanStory";
import "@/models/ArtisanCertificate";
import "@/models/ArtisanPlugin";
import "@/models/ArtisanBanner";



import Artisan from '@/models/Artisan';

export async function GET(req, { params }) {
  await connectDB();
  const slug = await params.slug;
  // console.log('Requested artisan id:', id);
  const artisan = await Artisan.findOne({ slug })
    .populate('promotions')
    .populate('artisanBlogs')
    .populate('artisanStories')
    .populate('certificates')
    .populate('socialPlugin')
    .populate('artisanBanner')
  if (!artisan || artisan.active !== true) {
    // console.log('Artisan not found for id:', id, 'Result:', artisan);
    return new Response(JSON.stringify({ message: 'Artisan not found', debug: { slug, artisan } }), { status: 404 });
  }
  return new Response(JSON.stringify(artisan), { status: 200 });
}