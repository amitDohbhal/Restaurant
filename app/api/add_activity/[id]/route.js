import { NextResponse } from 'next/server';
import connectDB from '@/lib/connectDB';
import Activity from '@/models/Activity';

export async function GET(req, { params }) {
  try {
    await connectDB();
    const { id } = params;
    const activity = await Activity.findById(id);
    if (!activity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
    }
    return NextResponse.json(activity, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  try {
    await connectDB();
    const { id } = params;
    if (!id || id === 'undefined') {
      return NextResponse.json({ error: 'Missing or invalid activity id' }, { status: 400 });
    }
    const body = await req.json();
    const update = { ...body };
    delete update._id; // never update _id
    const activity = await Activity.findByIdAndUpdate(id, update, { new: true });
    if (!activity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
    }
    return NextResponse.json(activity, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await connectDB();
    const { id } = params;
    const activity = await Activity.findByIdAndDelete(id);
    if (!activity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
