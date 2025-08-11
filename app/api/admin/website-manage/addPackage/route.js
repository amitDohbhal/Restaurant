import connectDB from "@/lib/connectDB";
import { NextResponse } from "next/server";
import Product from "@/models/Product";
import MenuBar from "@/models/MenuBar";
import mongoose from "mongoose";

export async function POST(req) {
    await connectDB();
    const body = await req.json();

    try {
        // Step 1: Check for existing product
        let productQuery = {
            title: body.title,
            slug: body.slug,
            code: body.code,
        };
        // Optionally, also check for subMenu/category if you want to scope uniqueness
        let existingProduct = await Product.findOne(productQuery);
        if (existingProduct) {
            // If already linked to submenu, skip push
            if (!body.isDirect && body.subMenuId) {
                const menuBarDoc = await MenuBar.findOne({ "subMenu._id": body.subMenuId });
                // console.log("[EXISTING PRODUCT] MenuBar doc for submenu:", JSON.stringify(menuBarDoc, null, 2));
                const updateResult = await MenuBar.updateOne(
                    { "subMenu._id": body.subMenuId, "subMenu.products": { $ne: existingProduct._id } },
                    { $push: { "subMenu.$.products": existingProduct._id } }
                );
                if (updateResult.matchedCount === 0) {
                    console.error("No submenu matched for existing product linkage!", body.subMenuId);
                }
            }
            return NextResponse.json({ message: "Product already exists!", product: existingProduct }, { status: 200 });
        }
        // Step 2: Create a new Product document
        const newProduct = await Product.create({
            title: body.title,
            slug: body.slug,
            code: body.code,
            isDirect: false,
            // Save subMenuId as category if present
            ...(body.subMenuId ? { category: body.subMenuId } : {})
        });

        // Step 3: Link new product to submenu
        if (!body.isDirect && body.subMenuId) {
            const menuBarDoc = await MenuBar.findOne({ "subMenu._id": body.subMenuId });
            // console.log("[NEW PRODUCT] MenuBar doc for submenu:", JSON.stringify(menuBarDoc, null, 2));
            const updateResult = await MenuBar.updateOne(
                { "subMenu._id": body.subMenuId, "subMenu.products": { $ne: newProduct._id } },
                { $push: { "subMenu.$.products": newProduct._id } }
            );
            if (updateResult.matchedCount === 0) {
                console.error("No submenu matched for new product linkage!", body.subMenuId);
            }
        }
        return NextResponse.json({ message: "Product added successfully!", product: newProduct }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}


export async function PUT(req) {
    await connectDB();
    try {
        const body = await req.json();
        // Support either code or _id as identifier
        const identifier = body._id ? { _id: body._id } : { code: body.code };
        if (!identifier._id && !identifier.code) {
            return NextResponse.json({ message: 'Product identifier (code or _id) required' }, { status: 400 });
        }
        // Find the product
        const existingProduct = await Product.findOne(identifier);
        if (!existingProduct) {
            return NextResponse.json({ message: 'Product not found' }, { status: 404 });
        }
        // Prepare update fields
        const updateFields = { ...body };
        delete updateFields._id;
        // Allow code updates by not deleting it from updateFields
        // Update product
        const updatedProduct = await Product.findOneAndUpdate(identifier, updateFields, { new: true });
        return NextResponse.json({ message: 'Product updated successfully!', product: updatedProduct }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
    }

}


export async function PATCH(req) {
    await connectDB();
    const body = await req.json();
    const { pkgId,...updateFields } = body;

    try {
        // Find the current product and its artisan
        const oldProduct = await Product.findById(pkgId);

        // Update the product
        const updatedProduct = await Product.findByIdAndUpdate(pkgId, updateFields, { new: true });

        if (!updatedProduct) {
            return NextResponse.json({ message: "Product not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Product updated successfully!", product: updatedProduct });
    } catch (error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function DELETE(req) {
    await connectDB();
    const { id } = await req.json();

    try {
        // Find the package to delete
        const packageToDelete = await Product.findById(id);
        if (!packageToDelete) {
            return NextResponse.json({ message: "Product not found!" }, { status: 404 });
        }
        
        // Remove package references from MenuBar
        await MenuBar.updateMany(
            { "subMenu.products": id },
            { $pull: { "subMenu.$.products": id } }
        );

        // Delete the product document
        await Product.findByIdAndDelete(id);

        return NextResponse.json({ message: "Product deleted successfully!" }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
