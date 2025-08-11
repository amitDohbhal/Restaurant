import { NextResponse } from 'next/server';
import CancelOrder from '@/models/CancelOrder';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get('orderId');

  try {
    const cancelRequest = await CancelOrder.findOne({ orderId });
    return NextResponse.json({ hasRequest: !!cancelRequest });
  } catch (error) {
    return NextResponse.json({ hasRequest: false, error: error.message }, { status: 500 });
  }
}