import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import RunningOrder from "@/models/RunningOrder";
import connectDB from "@/lib/connectDB";

export async function GET() {
  try {
    // Get the current user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await connectDB();

    // Base query for finding orders
    const query = {
      $or: []
    };

    // Add user ID to query if available
    if (session.user.id) {
      query.$or.push({ 'userId': session.user.id });
    }

    // Add email to query if available
    if (session.user.email) {
      query.$or.push({ 'customer.email': session.user.email });
    }

    // If no valid query conditions, return empty array
    if (query.$or.length === 0) {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Find and return orders
    const orders = await RunningOrder.find(query)
      .sort({ createdAt: -1 })
      .lean();

    return new Response(JSON.stringify(orders || []), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching user orders:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch orders' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}