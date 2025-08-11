import { NextResponse } from 'next/server';
import ZipCode from '@/models/ZipCode';
import connectDB from '@/lib/connectDB';

// POST: Check by pincode only, return city, district, state if all active
export async function POST(req) {
  await connectDB();
  try {
    const { pincode } = await req.json();
    if (!pincode) {
      return NextResponse.json({ success: false, message: 'Missing pincode' }, { status: 400 });
    }
    const normalizedInput = String(pincode).trim();
    // Search all states and districts for this pincode
    const stateDocs = await ZipCode.find({ active: true });
    for (const stateDoc of stateDocs) {
      if (!Array.isArray(stateDoc.districts)) continue;
      for (const districtObj of stateDoc.districts) {
        if (!districtObj.active) continue;
        if (!Array.isArray(districtObj.cities)) continue;
        const cityObj = districtObj.cities.find(
          c => String(c.pincode).trim() === normalizedInput && c.active !== false
        );
        if (cityObj) {
          return NextResponse.json({
            success: true,
            pincode: cityObj.pincode,
            city: cityObj.city || '',
            district: districtObj.district,
            state: stateDoc.state
          });
        }
      }
    }
    return NextResponse.json({ success: false, message: 'Delivery not available for this pincode' }, { status: 404 });
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}