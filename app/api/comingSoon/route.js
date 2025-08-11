import { NextResponse } from "next/server";
import connectDB from "@/lib/connectDB";
import ComingSoon from "@/models/ComingSoon";
import { nanoid } from "nanoid";

export async function POST(req) {
  try {
    await connectDB();
    const formData = await req.json();
    const { title, location, days, tourType, bannerUrl, thumbUrl } = formData;
    if (!title || !location || !days || !tourType || !bannerUrl || !thumbUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    // Generate a unique URL slug
    const slug = `${title.toLowerCase().replace(/\s+/g, "-")}-${nanoid(6)}`;
    const url = `/coming-soon/${slug}`;
    const comingSoon = await ComingSoon.create({
      title,
      location,
      days,
      tourType,
      bannerUrl,
      thumbUrl,
      url,
    });
    return NextResponse.json({ success: true, url, data: comingSoon });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    await connectDB();
    const packages = await ComingSoon.find().sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: packages });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// --- PATCH: Update a package ---
export async function PATCH(req) {
  try {
    await connectDB();
    const { id, ...updateFields } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "Missing package id" }, { status: 400 });
    }
    const updated = await ComingSoon.findByIdAndUpdate(id, updateFields, { new: true });
    if (!updated) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// --- DELETE: Remove a package ---
export async function DELETE(req) {
  try {
    await connectDB();
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "Missing package id" }, { status: 400 });
    }
    const deleted = await ComingSoon.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}