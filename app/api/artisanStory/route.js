import { NextResponse } from 'next/server';
import connectDB from '@/lib/connectDB';
import ArtisanStory from '@/models/ArtisanStory';
import Artisan from '@/models/Artisan';

export async function GET(req) {
  await connectDB();
  const url = new URL(req.url);
  const artisanId = url.searchParams.get('artisanId');
  try {
    let stories;
    if (artisanId) {
      stories = await ArtisanStory.find({ artisan: artisanId }).populate('artisan');
      return NextResponse.json({ success: true, stories });
    } else {
      stories = await ArtisanStory.find().populate('artisan');
      return NextResponse.json({ success: true, stories });
    }
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Failed to fetch stories', error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  await connectDB();
  try {
    const body = await req.json();
    // Check if a story already exists for this artisan
    const existing = await ArtisanStory.findOne({ artisan: body.artisan });
    if (existing) {
      return NextResponse.json({ success: false, message: 'An artisan story already exists for this artisan.' }, { status: 400 });
    }
    // Ensure images is an object with url and key (if provided)
    let images = undefined;
    if (body.images && typeof body.images === 'object') {
      images = {
        url: body.images.url || '',
        key: body.images.key || ''
      };
    }
    const story = await ArtisanStory.create({
      ...body,
      images
    });
    // Push story _id to artisan's artisanStories array
    if (story.artisan) {
      await Artisan.findByIdAndUpdate(
        story.artisan,
        { $set: { artisanStories: story._id } },
        { new: true }
      );
    }
    return NextResponse.json({ success: true, story });
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Failed to create story', error: err.message }, { status: 500 });
  }
}

export async function PUT(req) {
  await connectDB();
  try {
    const body = await req.json();
    const { _id, ...updateData } = body;
    // Ensure images is an object with url and key (if provided)
    let images = undefined;
    if (updateData.images && typeof updateData.images === 'object') {
      images = {
        url: updateData.images.url || '',
        key: updateData.images.key || ''
      };
    }
    const updated = await ArtisanStory.findByIdAndUpdate(_id, { ...updateData, images }, { new: true });
    if (updateData.artisan) {
      const existing = await ArtisanStory.findOne({ artisan: updateData.artisan, _id: { $ne: _id } });
      if (existing) {
        return NextResponse.json({ success: false, message: 'An artisan story already exists for this artisan.' }, { status: 400 });
      }
    }
    if (!updated) return NextResponse.json({ success: false, message: 'Story not found' }, { status: 404 });
    return NextResponse.json({ success: true, story: updated });
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Failed to update story', error: err.message }, { status: 500 });
  }
}

import { deleteFileFromCloudinary } from '@/utils/cloudinary';

export async function DELETE(req) {
  await connectDB();
  try {
    const { id } = await req.json();
    const story = await ArtisanStory.findById(id);
    if (!story) return NextResponse.json({ success: false, message: 'Story not found' }, { status: 404 });
    // Delete story image from Cloudinary if present
    if (story.images && typeof story.images === 'object' && story.images.key) {
      try {
        await deleteFileFromCloudinary(story.images.key);
      } catch (err) {
        console.error('Failed to delete story image from Cloudinary:', err.message);
      }
    }
    await ArtisanStory.findByIdAndDelete(id);
    // Remove story _id from artisan's artisanStories field
    if (story.artisan) {
      await Artisan.findByIdAndUpdate(
        story.artisan,
        { $set: { artisanStories: null } },
        { new: true }
      );
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Failed to delete story', error: err.message }, { status: 500 });
  }
}
