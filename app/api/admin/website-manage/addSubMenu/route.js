import connectDB from "@/lib/connectDB";
import { NextResponse } from "next/server";
import MenuBar from "@/models/MenuBar";
import Product from "@/models/Product";

export async function GET(req) {
    await connectDB();
    const menu = await MenuBar.find({})
        .sort({ order: 1 })
        .populate({
            path: "subMenu.product",
            model: "Product",
        });
    return NextResponse.json(menu);
}

export async function PATCH(req) {
    await connectDB();
    const body = await req.json();

    if (!body.subMenuId && (!body.id || !body.subMenu || typeof body.subMenu.title !== "string" || typeof body.subMenu.url !== "string")) {
        return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
    }

    try {
        const existingMenu = body.id ? await MenuBar.findById(body.id) : await MenuBar.findOne({ "subMenu._id": body.subMenuId });

        if (!existingMenu) {
            return NextResponse.json({ message: "Menu not found" }, { status: 404 });
        }

        if (body.subMenu && body.subMenu.title && body.subMenu.url) {
            const isDuplicate = existingMenu.subMenu.some(sub =>
                (sub.title?.toLowerCase() === body.subMenu.title.toLowerCase() ||
                    sub.url?.toLowerCase() === body.subMenu.url.toLowerCase()) &&
                sub._id.toString() !== body.subMenuId
            );

            if (isDuplicate) {
                return NextResponse.json({ message: "Sub menu already exists" }, { status: 400 });
            }
        }

        if (body.subMenuId && body.active !== undefined) {
            const updatedMenu = await MenuBar.findOneAndUpdate(
                { "subMenu._id": body.subMenuId },
                { $set: { "subMenu.$.active": body.active } },
                { new: true }
            );

            if (!updatedMenu) return NextResponse.json({ message: "Submenu not found" }, { status: 404 });

            return NextResponse.json({ message: "Submenu status updated", menu: updatedMenu });
        }

        if (body.subMenuId) {
            const updateFields = {};

            if (body.subMenu.title) {
                updateFields["subMenu.$.title"] = body.subMenu.title;
                if (!body.subMenu.url) {
                    updateFields["subMenu.$.url"] = body.subMenu.title.toLowerCase().replace(/\s+/g, "-");
                }
            }

            if (body.subMenu.url) {
                updateFields["subMenu.$.url"] = body.subMenu.url;
            }

            if (body.subMenu.order !== undefined) updateFields["subMenu.$.order"] = body.subMenu.order;
            if (body.subMenu.active !== undefined) updateFields["subMenu.$.active"] = body.subMenu.active;

            if (body.subMenu.banner !== undefined) {
                updateFields["subMenu.$.banner"] = body.subMenu.banner;
            }
            if (body.subMenu.profileImage !== undefined) {
                updateFields["subMenu.$.profileImage"] = body.subMenu.profileImage;
            }

            const updatedMenu = await MenuBar.findOneAndUpdate(
                { "subMenu._id": body.subMenuId },
                { $set: updateFields },
                { new: true }
            );

            if (!updatedMenu) return NextResponse.json({ message: "Submenu not found" }, { status: 404 });

            return NextResponse.json({ message: "Submenu updated successfully!", menu: updatedMenu });
        }

        // Ensure profileImage is included in submenu data if sent from frontend
        // body.subMenu.profileImage should be an object { url, key }
        const updatedMenu = await MenuBar.findByIdAndUpdate(
            body.id,
            { $push: { subMenu: body.subMenu } },
            { new: true, runValidators: true }
        );

        if (!updatedMenu) return NextResponse.json({ message: "Menu not found" }, { status: 404 });

        return NextResponse.json({ message: "Submenu added successfully!", menu: updatedMenu });
    } catch (error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function DELETE(req) {
    await connectDB();
    const body = await req.json();

    try {
        if (!body.id) return NextResponse.json({ message: "Menu ID is required" }, { status: 400 });

        if (!body.subMenuId) return NextResponse.json({ message: "Submenu ID is required" }, { status: 400 });

        const menu = await MenuBar.findById(body.id);
        if (!menu) return NextResponse.json({ message: "Menu not found" }, { status: 404 });

        const submenu = menu.subMenu.find((sub) => sub._id.toString() === body.subMenuId);
        if (!submenu) return NextResponse.json({ message: "Submenu not found" }, { status: 404 });

        if (Array.isArray(submenu.product) && submenu.product.length > 0) {
            return NextResponse.json({ message: "Cannot delete submenu with products" }, { status: 400 });
        }

        const updatedMenu = await MenuBar.findByIdAndUpdate(
            body.id,
            { $pull: { subMenu: { _id: body.subMenuId } } },
            { new: true }
        );

        if (!updatedMenu) return NextResponse.json({ message: "Submenu not found" }, { status: 404 });

        return NextResponse.json({ message: "Submenu deleted successfully!", menu: updatedMenu });
    } catch (error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
