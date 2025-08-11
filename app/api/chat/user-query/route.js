import { NextResponse } from "next/server";
import connectDB from "@/lib/connectDB";
import UserQuery from "@/models/UserQuery";
import { getServerSession } from "next-auth";
// import { authOptions } from "@/utils/authOptions";

export async function POST(req) {
  await connectDB();
  const body = await req.json();
  let { question, userId, userName, userEmail } = body;

  // If not provided, try to get user info from session
  if (!userId || !userEmail || !userName) {
    const session = await getServerSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    userId = session.user.id;
    userEmail = session.user.email;
    userName = session.user.name || session.user.email;
  }

  if (!question || !userId || !userEmail) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Save the query
  const newQuery = new UserQuery({
    question,
    userId,
    userName,
    userEmail,
    status: "pending",
    createdAt: new Date(),
  });
  await newQuery.save();
}

// GET: Return all user queries for admin
export async function GET() {
  await connectDB();
  const queries = await UserQuery.find().sort({ createdAt: -1 });
  return NextResponse.json({ queries });
}

// PATCH: Admin replies to a user query
export async function PATCH(req) {
  await connectDB();
  const { id, answer } = await req.json();
  if (!id || !answer) {
    return NextResponse.json({ error: "Missing id or answer" }, { status: 400 });
  }
  const updated = await UserQuery.findByIdAndUpdate(
    id,
    {
      answer,
      status: "answered",
      answeredAt: new Date(),
    },
    { new: true }
  );
  if (!updated) {
    return NextResponse.json({ error: "Query not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true, query: updated });

  return NextResponse.json({ success: true, message: "Query sent to admin." });
}
