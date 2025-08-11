import connectDB from "@/lib/connectDB";
import AskExperts from "@/models/AskExperts";

export async function GET(req) {
  await connectDB();
  try {
    const { searchParams } = new URL(req.url, 'http://localhost');
    const type = searchParams.get('type');
    const filter = type ? { type } : {};
    const enquiries = await AskExperts.find(filter)
      .sort({ createdAt: -1 })
      .populate('artisanId')
      .populate('productId')
    return new Response(JSON.stringify(enquiries), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ message: "Failed to fetch enquiries.", error: err.message }), { status: 500 });
  }
}

export async function POST(req) {
  await connectDB();
  try {
    const data = await req.json();
    const { name, email, phone, question, type } = data;
    if (!name || !email || !phone || !question || !type) {
      return new Response(JSON.stringify({ message: "Missing required fields." }), { status: 400 });
    }
    const enquiry = new AskExperts({ ...data });
    await enquiry.save();
    return new Response(JSON.stringify({ message: "Enquiry submitted successfully." }), { status: 201 });
  } catch (err) {
    return new Response(JSON.stringify({ message: "Failed to submit enquiry.", error: err.message }), { status: 500 });
  }
}
