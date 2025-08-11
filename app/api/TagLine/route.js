import TagLine from '@/models/TagLine';
import connectDB from '@/lib/connectDB';

// GET: Fetch all tags
export async function GET() {
  await connectDB();
  const tags = await TagLine.find({});
  return Response.json({ tags });
}

// POST: Create a new tag
export async function POST(req) {
  await connectDB();
  try {
    const { name } = await req.json();
    if (!name) {
      return Response.json({ error: 'Tag Line name is required.' }, { status: 400 });
    }
    // Check for duplicate
    const exists = await TagLine.findOne({ name });
    if (exists) {
      return Response.json({ error: 'Tag Line already exists.' }, { status: 409 });
    }
    const tag = await TagLine.create({ name });
    return Response.json({ success: true, tag });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// PATCH: Update tag name
export async function PATCH(req) {
  await connectDB();
  try {
    const { id, name } = await req.json();
    if (!id || !name) {
      return Response.json({ error: 'Tag Line id and new name are required.' }, { status: 400 });
    }
    const tag = await TagLine.findByIdAndUpdate(id, { name }, { new: true });
    if (!tag) {
      return Response.json({ error: 'Tag Line not found.' }, { status: 404 });
    }
    return Response.json({ success: true, tag });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Remove a tag by id
export async function DELETE(req) {
  await connectDB();
  try {
    const { id } = await req.json();
    if (!id) {
      return Response.json({ error: 'Tag Line id is required.' }, { status: 400 });
    }
    const tag = await TagLine.findByIdAndDelete(id);
    if (!tag) {
      return Response.json({ error: 'Tag Line not found.' }, { status: 404 });
    }
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
