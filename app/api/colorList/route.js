import connectDB from '@/lib/connectDB';
import ColorList from '@/models/ColorList';

export async function GET(req) {
  await connectDB();
  try {
    const colors = await ColorList.find();
    return Response.json(colors);
  } catch (err) {
    return Response.json({ error: 'Failed to fetch color list' }, { status: 500 });
  }
}

export async function POST(req) {
  await connectDB();
  try {
    const { name, hex } = await req.json();
    if (!name || !hex) {
      return Response.json({ error: 'Name and hex are required' }, { status: 400 });
    }
    // Check for duplicate
    const exists = await ColorList.findOne({ $or: [{ name }, { hex }] });
    if (exists) {
      return Response.json({ error: 'Color with this name or hex already exists' }, { status: 409 });
    }
    const color = await ColorList.create({ name, hex });
    return Response.json(color, { status: 201 });
  } catch (err) {
    return Response.json({ error: 'Failed to add color' }, { status: 500 });
  }
}
