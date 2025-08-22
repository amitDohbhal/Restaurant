import connectDB from '../../../lib/connectDB';
import FoodQuantityType from '../../../models/StockQuantityType';

export async function GET() {
  await connectDB();
  try {
    const types = await FoodQuantityType.find().sort({ createdAt: -1 });
    return Response.json(types);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  await connectDB();
  try {
    const { name } = await req.json();
    if (!name) return Response.json({ error: 'Name is required' }, { status: 400 });
    const exists = await FoodQuantityType.findOne({ name });
    if (exists) return Response.json({ error: 'Already exists' }, { status: 409 });
    const type = await FoodQuantityType.create({ name });
    return Response.json(type, { status: 201 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}