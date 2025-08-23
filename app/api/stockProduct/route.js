// food category
import { NextResponse } from "next/server";
import connectDB from "@/lib/connectDB";
import StockProduct from "@/models/StockProduct";


export async function GET() {
    await connectDB();
    try {
        const products = await StockProduct.find();
        return NextResponse.json(products, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
    }
}

export async function POST(req) {
    await connectDB();
    try {
        const { stockCategory, quantity: quantity, productName: productName, openingStock: openingStock } = await req.json();
        const newProduct = new StockProduct({ stockCategory, quantity: quantity, productName: productName, openingStock: openingStock });
        await newProduct.save();
        return NextResponse.json(newProduct, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: `Failed to create product: ${error.message}` }, { status: 500 });
    }
}

export async function PATCH(req) {
    await connectDB();
    try {
        const { id, stockCategory, quantity: quantity, productName: productName, openingStock: openingStock } = await req.json();
        const updatedProduct = await StockProduct.findByIdAndUpdate(id, { stockCategory, quantity: quantity, productName: productName, openingStock: openingStock }, { new: true });
        return NextResponse.json(updatedProduct, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
    }
}

export async function DELETE(req) {
    await connectDB();
    try {
        const { id } = await req.json();

        // Find the product first
        const product = await StockProduct.findById(id);
        if (!product) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        // Delete product from database
        await StockProduct.findByIdAndDelete(id);

        return NextResponse.json({ message: "Product deleted successfully" }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: `Failed to delete product: ${error.message}` }, { status: 500 });
    }
}
