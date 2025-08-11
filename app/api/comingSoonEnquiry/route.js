import connectDB from "@/lib/connectDB";
import ComingSoonEnquiry from "@/models/ComingSoonEnquiry";
import "@/models/ComingSoon";

export async function POST(req) {
  try {
    await connectDB();
    const data = await req.json();
    const enquiry = await ComingSoonEnquiry.create(data);
    return new Response(JSON.stringify(enquiry), { status: 201 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message || "Internal Server Error" }), { status: 500 });
  }
}

export async function GET() {
  try {
    await connectDB();
    const enquiries = await ComingSoonEnquiry.find({})
      .populate("packageId")
      .sort({ createdAt: -1 })
      .lean();
    return new Response(JSON.stringify(enquiries), { status: 200 });
  } catch (error) {
 
    return new Response(JSON.stringify({ error: error.message || "Internal Server Error" }), { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    await connectDB();
    const { id } = await req.json();
    const deleted = await ComingSoonEnquiry.findByIdAndDelete(id);
    if (deleted) {
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    } else {
      return new Response(JSON.stringify({ success: false, error: "Not found" }), { status: 404 });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message || "Internal Server Error" }), { status: 500 });
  }
}
