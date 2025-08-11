import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/connectDB';
let ArtisanPlugin
try {
  ArtisanPlugin = mongoose.model('ArtisanPlugin');
} catch {
  ArtisanPlugin = require('@/models/ArtisanPlugin');
}
import Artisan from '@/models/Artisan';

// GET all plugins or by artisan
export async function GET(req) {
  await connectDB();
  const url = new URL(req.url);
  const artisanId = url.searchParams.get('artisanId');
  try {
    let plugins;
    if (artisanId) {
      plugins = await ArtisanPlugin.findOne({ artisan: artisanId }).populate('artisan');
      return NextResponse.json({ success: true, plugin: plugins });
    } else {
      plugins = await ArtisanPlugin.find().populate('artisan');
      return NextResponse.json({ success: true, plugins });
    }
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Failed to fetch plugins', error: err.message }, { status: 500 });
  }
}

// CREATE a new plugin
export async function POST(req) {
  await connectDB();
  try {
    const body = await req.json();

    // Validate required fields
    if (!body.artisan) {
      return NextResponse.json({ success: false, message: 'Artisan ID is required.' }, { status: 400 });
    }

    // Check if artisan exists
    const artisan = await Artisan.findById(body.artisan);
    if (!artisan) {
      return NextResponse.json({ success: false, message: 'Artisan not found.' }, { status: 404 });
    }

    // Check for existing plugin
    const existing = await ArtisanPlugin.findOne({ artisan: body.artisan });
    if (existing) {
      // If plugin exists but is empty, allow update
      const hasContent = existing.facebook || existing.google || existing.instagram || existing.youtube || existing.website;
      if (hasContent) {
        return NextResponse.json({ success: false, message: 'Social plugin already exists for this artisan.' }, { status: 400 });
      }
      // If empty, delete the existing one
      await ArtisanPlugin.findByIdAndDelete(existing._id);
    }

    // Create new plugin
    const plugin = await ArtisanPlugin.create(body);
    
    // Update artisan's reference
    await Artisan.findByIdAndUpdate(
      body.artisan,
      { socialPlugin: plugin._id },
      { new: true }
    );

    return NextResponse.json({ success: true, plugin });
  } catch (err) {
    console.error('Error in POST /api/artisanPlugins:', err);
    return NextResponse.json({ 
      success: false, 
      message: err.name === 'ValidationError' ? 'Invalid plugin data provided.' : 'Failed to create plugin',
      error: err.message
    }, { status: 500 });
  }
}

// UPDATE a plugin
export async function PUT(req) {
  await connectDB();
  try {
    const body = await req.json();
    const { _id, ...updateData } = body;
    const updated = await ArtisanPlugin.findByIdAndUpdate(_id, updateData, { new: true });
    if (!updated) return NextResponse.json({ success: false, message: 'Plugin not found' }, { status: 404 });
    return NextResponse.json({ success: true, plugin: updated });
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Failed to update plugin', error: err.message }, { status: 500 });
  }
}

// DELETE a plugin
export async function DELETE(req) {
  await connectDB();
  try {
    const { id } = await req.json();
    const deleted = await ArtisanPlugin.findByIdAndDelete(id);
    if (!deleted) return NextResponse.json({ success: false, message: 'Plugin not found' }, { status: 404 });
    // Remove plugin _id from artisan's socialPlugin field
    if (deleted.artisan) {
      await Artisan.findByIdAndUpdate(
        deleted.artisan,
        { $set: { socialPlugin: null } },
        { new: true }
      );
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Failed to delete plugin', error: err.message }, { status: 500 });
  }
}
