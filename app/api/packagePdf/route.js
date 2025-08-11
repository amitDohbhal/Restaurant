import connectDB from "@/lib/connectDB";
import PackagePdf from "@/models/PackagePdf";
import Product from "@/models/Product";
import { deletePdfFromCloudinary } from "@/utils/pdfDelete";

import mongoose from "mongoose";
export async function GET(req) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId");
  try {
    let pdfs;
    if (productId) {
      pdfs = await PackagePdf.find({ productId: new mongoose.Types.ObjectId(productId) });
    } else {
      pdfs = await PackagePdf.find();
    }
    return Response.json({ success: true, data: pdfs });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  await connectDB();
  try {
    const body = await req.json();
    const { productId, name, url, key } = body;
    if (!productId || !name || !url || !key) {
      return Response.json({ success: false, error: "All fields required" }, { status: 400 });
    }
    const pdf = await PackagePdf.create({ productId, name, url, key });
    // Optionally add to Per model
    await Product.findByIdAndUpdate(productId, { $push: { pdfs: pdf._id } });
    return Response.json({ success: true, data: pdf });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}


export async function PATCH(req) {
  await connectDB();
  try {
    const body = await req.json();
    const { id, name, url, key } = body;
    if (!id) return Response.json({ success: false, error: "id required" }, { status: 400 });
    // Find the old PDF for possible Cloudinary cleanup
    const oldPdf = await PackagePdf.findById(id);
    if (!oldPdf) return Response.json({ success: false, error: "PDF not found" }, { status: 404 });
    // If key/url is being changed, delete old file from Cloudinary
    let shouldDeleteCloudinary = false;
    if ((key && key !== oldPdf.key) || (url && url !== oldPdf.url)) {
      shouldDeleteCloudinary = true;
    }
    const update = {};
    if (name) update.name = name;
    if (url) update.url = url;
    if (key) update.key = key;
    const pdf = await PackagePdf.findByIdAndUpdate(id, update, { new: true });
    // Delete old Cloudinary file if needed
    if (shouldDeleteCloudinary && oldPdf.key) {
      try {
        await deletePdfFromCloudinary(oldPdf.key);
      } catch (e) {
        // log but don't fail the request
        console.error("Failed to delete old PDF from Cloudinary:", e);
      }
    }
    return Response.json({ success: true, data: pdf });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  await connectDB();
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return Response.json({ success: false, error: "id required" }, { status: 400 });
    const pdf = await PackagePdf.findByIdAndDelete(id);
    if (pdf) {
      // Delete from Cloudinary
      if (pdf.key) {
        try {
          await deletePdfFromCloudinary(pdf.key);
        } catch (e) {
          console.error("Failed to delete PDF from Cloudinary:", e);
        }
      }
      await Product.findByIdAndUpdate(pdf.productId, { $pull: { pdfs: pdf._id } });
    }
    return Response.json({ success: true, data: pdf });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
