import { NextResponse } from 'next/server';
import ZipCode from '@/models/ZipCode';
import connectDB from '@/lib/connectDB';

// GET: List all states/districts and their status
export async function GET() {
  await connectDB();
  try {
    const all = await ZipCode.find();
    return NextResponse.json({ success: true, data: all });
  } catch (error) {
    console.error("GET error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Upsert a state's district list (REPLACES all districts for that state)
export async function POST(req) {
  await connectDB();
  try {
    const { state, districts } = await req.json();
    if (!state?.trim() || !Array.isArray(districts)) {
      return NextResponse.json({ success: false, error: 'State and districts are required' }, { status: 400 });
    }

    const doc = await ZipCode.findOneAndUpdate(
      { state: state.trim() },
      { $set: { districts } },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, data: doc });
  } catch (error) {
    console.error("POST error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH: Toggle active status for state or district
// export async function PATCH(req) {
//   await connectDB();
//   try {
//     const { state, district, active } = await req.json();
//     if (!state || typeof active !== 'boolean') {
//       return NextResponse.json({ success: false, error: 'State and active required' }, { status: 400 });
//     }
//     let updatedDoc;
//     if (!district || district.trim() === '') {
//       // Toggle state active
//       updatedDoc = await ZipCode.findOneAndUpdate(
//         { state },
//         { $set: { active } },
//         { new: true }
//       );
//     } else {
//       // Toggle district active
//       const doc = await ZipCode.findOne({ state });
//       if (doc && Array.isArray(doc.districts)) {
//         const districtIndex = doc.districts.findIndex(d => d.district && d.district.trim().toLowerCase() === district.trim().toLowerCase());
//         if (districtIndex !== -1) {
//           updatedDoc = await ZipCode.findOneAndUpdate(
//             { state, [`districts._id`]: doc.districts[districtIndex]._id },
//             { $set: { [`districts.${districtIndex}.active`]: active } },
//             { new: true }
//           );
//         }
//       }
//     }
//     if (!updatedDoc) {
//       return NextResponse.json({ success: false, error: 'Document or district not found' }, { status: 404 });
//     }
//     return NextResponse.json({ success: true, data: updatedDoc });
//   } catch (error) {
//     console.error("PATCH error:", error);
//     return NextResponse.json({ success: false, error: error.message }, { status: 500 });
//   }
// }


// PATCH: Toggle active status for a state or district
export async function PATCH(req) {
  await connectDB();
  try {
    const { state, district, active } = await req.json();
    if (!state || typeof active !== 'boolean') {
      return NextResponse.json({ success: false, error: 'State and active required' }, { status: 400 });
    }
    // Case-insensitive state match
    const doc = await ZipCode.findOne({ state: { $regex: `^${state.trim()}$`, $options: 'i' } });
    if (!doc) {
      return NextResponse.json({ success: false, error: 'State not found' }, { status: 404 });
    }
    if (!district || district.trim() === '') {
      // Toggle state active
      const updatedDoc = await ZipCode.findOneAndUpdate(
        { state: { $regex: `^${state.trim()}$`, $options: 'i' } },
        { $set: { active } },
        { new: true }
      );
      return NextResponse.json({ success: true, data: updatedDoc });
    } else {
      // Toggle district active atomically using arrayFilters
      const districtObj = doc.districts.find(d => d.district && d.district.trim().toLowerCase() === district.trim().toLowerCase());
      if (!districtObj) {
        return NextResponse.json({ success: false, error: 'District not found' }, { status: 404 });
      }
      const updatedDoc = await ZipCode.findOneAndUpdate(
        { state: { $regex: `^${state.trim()}$`, $options: 'i' }, 'districts.district': { $regex: `^${district.trim()}$`, $options: 'i' } },
        { $set: { 'districts.$[elem].active': active } },
        { new: true, arrayFilters: [{ 'elem.district': { $regex: `^${district.trim()}$`, $options: 'i' } }] }
      );
      if (!updatedDoc) {
        return NextResponse.json({ success: false, error: 'District update failed' }, { status: 500 });
      }
      return NextResponse.json({ success: true, data: updatedDoc });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}