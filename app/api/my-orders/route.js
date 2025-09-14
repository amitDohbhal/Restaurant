import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import RunningOrder from "@/models/RunningOrder";
import connectDB from "@/lib/connectDB";

export async function GET() {
  try {
    // Get the current user session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || !session.user.email) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await connectDB();

    // Find orders for the logged-in user by their ID
    const orders = await RunningOrder.find({ 
      $or: [
        { 'userId': session.user.id }, // Check for direct user ID match
        { 'customer.email': session.user.email } // Fallback to email for backward compatibility
      ]
    })
    .sort({ createdAt: -1 }) // Sort by most recent first
    .lean();

    return new Response(JSON.stringify(orders), {
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
