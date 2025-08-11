import { NextResponse } from 'next/server';
import ShippingCharge from '../../../models/ShippingCharges';
import connectDB from '@/lib/connectDB';

export async function POST(request) {
  await connectDB();
  try {
    const { weight } = await request.json();
    // console.log(weight);
    if (!weight) {
      return NextResponse.json({ available: false, message: 'Missing weight' }, { status: 400 });
    }
    // Find the shipping charge by weight (if provided)
    let shippingCharge = null;
    let tierLabel = null;
    let tierWeightLimit = null;
    let perUnitCharge = null;
    // Fetch all global shipping charges (not pincode-specific)
    const shippingConfig = await ShippingCharge.findOne();
    if (!shippingConfig || !Array.isArray(shippingConfig.charges) || shippingConfig.charges.length === 0) {
      return NextResponse.json({ available: false, message: 'No shipping charges set' });
    }

    // Parse upper limit from label (e.g., '0-1kg' => 1000g, '1-5kg' => 5000g)
    function parseUpperLimit(label) {
      // Match 'x-yk' or 'x-yk' or 'x-ykgs' (case insensitive)
      const match = label.match(/-(\d+(?:\.\d+)?)(?:\s*)k(?:g|gs)?/i);
      if (match) {
        return Math.round(parseFloat(match[1]) * 1000); // convert kg to grams
      }
      // fallback: try to find any number
      const fallback = label.match(/(\d+(?:\.\d+)?)/);
      if (fallback) {
        return Math.round(parseFloat(fallback[1]) * 1000);
      }
      return null;
    }

    // Map charges with upper limits and ensure label and shippingCharge are set
    const mapped = shippingConfig.charges.map(tier => ({
      label: tier.label || null,
      shippingCharge: tier.shippingCharge != null ? Number(tier.shippingCharge) : null,
      upperLimit: parseUpperLimit(tier.label)
    })).filter(tier => tier.upperLimit !== null);

    // Sort by upper limit ascending
    mapped.sort((a, b) => a.upperLimit - b.upperLimit);

    let found = null;
    if (weight !== undefined && weight !== null) {
      found = mapped.find(tier => weight <= tier.upperLimit);
      if (!found) found = mapped[mapped.length - 1]; // fallback to highest
    } else {
      found = mapped[0];
    }
    if (found) {
      shippingCharge = Number(found.shippingCharge);
      tierLabel = found.label || null;
      tierWeightLimit = found.upperLimit || null; // in grams
      if (tierWeightLimit && shippingCharge) {
        perUnitCharge = shippingCharge / tierWeightLimit;
      }
    }
    if (shippingCharge === null) {
      return NextResponse.json({ available: false, message: 'Shipping charge not set' });
    }
    return NextResponse.json({ available: true, shippingCharge, tierLabel, perUnitCharge, tierWeightLimit });
  } catch (error) {
    // console.error('Error checking shipping:', error);
    return NextResponse.json({ available: false, message: 'Server error' }, { status: 500 });
  }
}
