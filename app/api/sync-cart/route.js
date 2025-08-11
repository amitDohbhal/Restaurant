import User from "@/models/User";
import CartList from "@/models/CartList";
import mongoose from "mongoose";

// POST: Sync cart with database
export async function POST(req) {
  try {
    const { userId, cart } = await req.json();
    // console.log('[sync-cart][POST] Received userId:', userId, 'cart:', cart);
    if (!userId || !Array.isArray(cart)) {
      // console.error('[sync-cart][POST] Missing userId or cart');
      return new Response(JSON.stringify({ error: "Missing userId or cart" }), { status: 400 });
    }
    // Find user by id or email (robust to ObjectId)
    const userQuery = mongoose.Types.ObjectId.isValid(userId)
      ? { $or: [{ _id: userId }, { email: userId }] }
      : { email: userId };
    const user = await User.findOne(userQuery);
    // console.log('[sync-cart][POST] User lookup result:', user ? user._id : 'not found');
    if (!user) {
      // console.error('[sync-cart][POST] User not found for query:', userQuery);
      return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
    }

    // Log cart state before update
    // console.log('[sync-cart][POST] User cart BEFORE update:', user.cart);

    // If cart is empty, treat as fetch (do not overwrite existing cart)
    if (cart.length === 0) {
      let cartList = await CartList.findOne({ user: user._id });
      // console.log('[sync-cart][POST] Fetch mode: returning user.cart and cartList.items');
      return new Response(JSON.stringify({
        success: true,
        cart: user.cart || [],
        cartList: cartList ? cartList.items : []
      }), { status: 200 });
    }

    // Otherwise, update cart as usual
    user.cart = cart;
    await user.save();
    // console.log('[sync-cart][POST] User cart AFTER update:', user.cart);

    // Update CartList collection
    let cartList = await CartList.findOne({ user: user._id });
    if (!cartList) {
      cartList = new CartList({ user: user._id, items: cart });
      // console.log('[sync-cart][POST] Created new CartList:', cartList._id);
    } else {
      cartList.items = cart;
      // console.log('[sync-cart][POST] Updated existing CartList:', cartList._id);
    }
    await cartList.save();
    // console.log('[sync-cart][POST] CartList items AFTER update:', cartList.items);

    return new Response(JSON.stringify({ success: true, cart: user.cart }), { status: 200 });
  } catch (err) {
    // console.error('[sync-cart][POST] Error:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }

  // try {
  //   const { userId, cart } = await req.json();
  //   if (!userId || !Array.isArray(cart)) {
  //     return new Response(JSON.stringify({ error: "Missing userId or cart" }), { status: 400 });
  //   }
  //   // Find user by id or email (robust to ObjectId)
  //   const userQuery = mongoose.Types.ObjectId.isValid(userId)
  //     ? { $or: [{ _id: userId }, { email: userId }] }
  //     : { email: userId };
  //   const user = await User.findOne(userQuery);
  //   if (!user) {
  //     return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
  //   }

  //   // If cart is empty, treat as fetch (do not overwrite existing cart)
  //   if (cart.length === 0) {
  //     // Optionally: fetch from CartList collection as well
  //     let cartList = await CartList.findOne({ user: user._id });
  //     return new Response(JSON.stringify({
  //       success: true,
  //       cart: user.cart || [],
  //       cartList: cartList ? cartList.items : []
  //     }), { status: 200 });
  //   }

  //   // Otherwise, update cart as usual
  //   user.cart = cart;
  //   await user.save();

  //   // Update CartList collection
  //   let cartList = await CartList.findOne({ user: user._id });
  //   if (!cartList) {
  //     cartList = new CartList({ user: user._id, items: cart });
  //   } else {
  //     cartList.items = cart;
  //   }
  //   await cartList.save();

  //   return new Response(JSON.stringify({ success: true, cart: user.cart }), { status: 200 });
  // } catch (err) {
  //   return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  // }
}

// DELETE: Clear cart from database
export async function DELETE(req) {
  try {
    const { userId } = await req.json();
    // console.log('DELETE request received with userId:', userId);
    
    if (!userId) {
      // console.error('No userId provided');
      return new Response(JSON.stringify({ error: "Missing userId" }), { status: 400 });
    }

    // Find user by id or email
    const userQuery = mongoose.Types.ObjectId.isValid(userId)
      ? { $or: [{ _id: userId }, { email: userId }] }
      : { email: userId };
    
    // console.log('Searching for user with query:', userQuery);
    const user = await User.findOne(userQuery);
    if (!user) {
      // console.error('User not found for query:', userQuery);
      return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
    }

    // console.log('Found user:', user._id);
    
    // Clear cart from User model
    user.cart = [];
    await user.save();
    // console.log('Successfully cleared cart from User model');

    // Extra: Check for multiple CartList docs for this user
    const cartListsBefore = await CartList.find({ user: user._id });
    // console.log('CartLists BEFORE clear:', cartListsBefore.map(c => ({ id: c._id, items: c.items })));

    // Force-clear ALL CartList docs for this user
    const updateResult = await CartList.updateMany({ user: user._id }, { $set: { items: [] } });
    // console.log('CartList updateMany result:', updateResult);

    const cartListsAfter = await CartList.find({ user: user._id });
    // console.log('CartLists AFTER clear:', cartListsAfter.map(c => ({ id: c._id, items: c.items })));

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}