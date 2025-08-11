import { NextResponse } from 'next/server';
import connectDB from '@/lib/connectDB';
import Activity from '@/models/Activity';

export async function GET(req, { params }) {
  await connectDB();
  const { slug } = await params;
  const activity = await Activity.findOne({ slug });
  if (!activity) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(activity);
}