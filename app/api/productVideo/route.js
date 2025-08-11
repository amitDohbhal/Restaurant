import connectDB from "@/lib/connectDB";
import Video from '@/models/Video';
import Product from '@/models/Product';
// POST: Add a video to a product
export async function POST(req) {
  await connectDB();
  try {
    const { productId, videoUrl, videoDescription } = await req.json();
    if (!productId || !videoUrl) {
      return Response.json({ error: 'Missing productId or videoUrl' }, { status: 400 });
    }
    let videoDoc = await Video.findOne({ product: productId });
    if (videoDoc) {
      // Add to existing
      if (videoDoc.videos.length >= 10) {
        return Response.json({ error: 'Max 10 videos allowed.' }, { status: 400 });
      }
      videoDoc.videos.push({ url: videoUrl, description: videoDescription || '' });
      await videoDoc.save();
    } else {
      videoDoc = await Video.create({ product: productId, videos: [{ url: videoUrl, description: videoDescription || '' }] });
    }
    // Always link videoDoc to Product
    await Product.findByIdAndUpdate(productId, { video: videoDoc._id });
    return Response.json({ success: true, video: videoDoc });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// GET: Get all videos for a product
export async function GET(req) {
  await connectDB();
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');
    if (!productId) {
      return Response.json({ error: 'Missing productId' }, { status: 400 });
    }
    const videoDoc = await Video.findOne({ product: productId });
    return Response.json({ video: videoDoc });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// PATCH: Update videos (replace all)
export async function PATCH(req) {
  await connectDB();
  try {
    const { productId, videos } = await req.json();
    if (!productId || !Array.isArray(videos)) {
      return Response.json({ error: 'Missing productId or videos' }, { status: 400 });
    }
    const videoDoc = await Video.findOneAndUpdate(
      { product: productId },
      { videos },
      { new: true }
    );
    return Response.json({ video: videoDoc });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// DELETE: Remove a video by productId and videoUrl
export async function DELETE(req) {
  await connectDB();
  try {
    const { productId, videoUrl, videoDescription } = await req.json();
    if (!productId || !videoUrl) {
      return Response.json({ error: 'Missing productId or videoUrl' }, { status: 400 });
    }
    const videoDoc = await Video.findOne({ product: productId });
    if (!videoDoc) {
      return Response.json({ error: 'Video document not found' }, { status: 404 });
    }
    videoDoc.videos = videoDoc.videos.filter(v => v.url !== videoUrl);
    await videoDoc.save();
    // If no videos left, remove video ref from Product and delete Video doc
    if (videoDoc.videos.length === 0) {
      await Product.findByIdAndUpdate(productId, { $unset: { video: "" } });
      await Video.deleteOne({ _id: videoDoc._id });
      return Response.json({ success: true, video: null });
    }
    return Response.json({ success: true, video: videoDoc });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
