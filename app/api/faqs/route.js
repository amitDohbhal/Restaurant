import connectDB from "@/lib/connectDB";
import Faq from '@/models/Faq';
// GET: Return all FAQs grouped by category, or filter by category
export async function GET(req) {
  try {
    await connectDB();
    const url = req?.url ? new URL(req.url, "http://localhost") : null;
    const category = url?.searchParams.get('category');
    if (category) {
      // Return only the selected category's FAQs
      const faqs = await Faq.find({ category });
      return new Response(JSON.stringify(faqs), { status: 200 });
    } else {
      // Return all FAQs grouped by category
      const allFaqs = await Faq.find();
      const grouped = {};
      for (const cat of ['General', 'Returns', 'Gift', 'Refunds', 'Payments', 'Shipping']) {
        grouped[cat] = allFaqs.filter(faq => faq.category === cat);
      }
      return new Response(JSON.stringify(grouped), { status: 200 });
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

// POST: Add a new FAQ
export async function POST(req) {
  try {
    await connectDB();
    const data = await req.json();
    const { question, answer, category } = data;
    if (!question || !answer || !category) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }
    const faq = await Faq.create({ question, answer, category });
    return new Response(JSON.stringify(faq), { status: 201 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

// PATCH: Edit an existing FAQ by id
export async function PATCH(req) {
  try {
    await connectDB();
    const data = await req.json();
    const { id, question, answer, category } = data;
    if (!id) {
      return new Response(JSON.stringify({ error: 'Missing FAQ id' }), { status: 400 });
    }
    const updated = await Faq.findByIdAndUpdate(
      id,
      { question, answer, category },
      { new: true }
    );
    if (!updated) {
      return new Response(JSON.stringify({ error: 'FAQ not found' }), { status: 404 });
    }
    return new Response(JSON.stringify(updated), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

// DELETE: Remove an FAQ by id or all by category
export async function DELETE(req) {
  try {
    await connectDB();
    const url = req?.url ? new URL(req.url, "http://localhost") : null;
    const category = url?.searchParams.get('category');
    if (category) {
      await Faq.deleteMany({ category });
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }
    const data = await req.json();
    const { id } = data;
    if (!id) {
      return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400 });
    }
    await Faq.findByIdAndDelete(id);
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}