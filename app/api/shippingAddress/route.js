import connectDB from "@/lib/connectDB";
import ShippingAddress from "@/models/ShippingAddress";
import User from "@/models/User";
import { getServerSession } from "next-auth/next";

async function handleGET(req) {
  await connectDB();
  const session = await getServerSession();

  if (!session || !session.user) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
  }

  // Find user by email to get Mongo _id
  const dbUser = await User.findOne({ email: session.user.email });
  if (!dbUser) {
    return new Response(JSON.stringify({ message: "User not found" }), { status: 404 });
  }

  // Find all shipping addresses for this user
  const addresses = await ShippingAddress.find({ user: dbUser._id }).lean();

  return new Response(JSON.stringify({ addresses }), { status: 200 });
}

// Edit (PUT) a shipping address
async function handlePUT(req) {
  await connectDB();
  const session = await getServerSession();
  if (!session || !session.user) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
  }
  const dbUser = await User.findOne({ email: session.user.email });
  if (!dbUser) {
    return new Response(JSON.stringify({ message: "User not found" }), { status: 404 });
  }
  const body = await req.json();
  const { _id, label, firstName, lastName, address, city, state, postalCode, country, phone, email } = body;
  if (!_id || !label || !firstName || !lastName || !address || !city || !state || !postalCode || !country || !phone || !email) {
    return new Response(JSON.stringify({ message: "All fields are required" }), { status: 400 });
  }
  // Only allow user to update their own address
  const shippingAddress = await ShippingAddress.findOne({ _id, user: dbUser._id });
  if (!shippingAddress) {
    return new Response(JSON.stringify({ message: "Address not found or unauthorized" }), { status: 404 });
  }
  shippingAddress.label = label;
  shippingAddress.firstName = firstName;
  shippingAddress.lastName = lastName;
  shippingAddress.address = address;
  shippingAddress.city = city;
  shippingAddress.state = state;
  shippingAddress.postalCode = postalCode;
  shippingAddress.country = country;
  shippingAddress.phone = phone;
  shippingAddress.email = email;
  await shippingAddress.save();
  return new Response(JSON.stringify({ success: true, shippingAddress }), { status: 200 });
}

// Delete (DELETE) a shipping address
async function handleDELETE(req) {
  await connectDB();
  const session = await getServerSession();
  if (!session || !session.user) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
  }
  const dbUser = await User.findOne({ email: session.user.email });
  if (!dbUser) {
    return new Response(JSON.stringify({ message: "User not found" }), { status: 404 });
  }
  const body = await req.json();
  const { _id } = body;
  if (!_id) {
    return new Response(JSON.stringify({ message: "Address ID required" }), { status: 400 });
  }
  // Only allow user to delete their own address
  const shippingAddress = await ShippingAddress.findOne({ _id, user: dbUser._id });
  if (!shippingAddress) {
    return new Response(JSON.stringify({ message: "Address not found or unauthorized" }), { status: 404 });
  }
  await ShippingAddress.deleteOne({ _id });
  await User.findByIdAndUpdate(dbUser._id, { $pull: { shippingAddresses: _id } });
  return new Response(JSON.stringify({ success: true }), { status: 200 });
}

async function handlePOST(req) {
  await connectDB();
  const session = await getServerSession();

  if (!session || !session.user) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
  }

  // Find user by email to get Mongo _id
  const dbUser = await User.findOne({ email: session.user.email });
  if (!dbUser) {
    return new Response(JSON.stringify({ message: "User not found" }), { status: 404 });
  }

  const body = await req.json();
  const { label, firstName, lastName, address, city, state, postalCode, country, phone, email } = body;

  if (!label || !firstName || !lastName || !address || !city || !state || !postalCode || !country || !phone || !email) {
    return new Response(JSON.stringify({ message: "All fields are required" }), { status: 400 });
  }

  const shippingAddress = await ShippingAddress.create({
    user: dbUser._id,
    label,firstName, lastName, address, city, state, postalCode, country, phone, email
  });

  // Add the address to the user's shippingAddresses array
  await User.findByIdAndUpdate(dbUser._id, { $push: { shippingAddresses: shippingAddress._id } });

  return new Response(JSON.stringify({ success: true, shippingAddress }), { status: 201 });
}

export { handleGET as GET, handlePOST as POST, handlePUT as PUT, handleDELETE as DELETE };