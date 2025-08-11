import connectDB from "@/lib/connectDB";
import { NextResponse } from "next/server";
import MenuBar from "@/models/MenuBar";
import Product from "@/models/Product";
import { deleteFileFromCloudinary } from "@/utils/cloudinary";

export async function POST(req) {
    await connectDB();
    const body = await req.json();

    try {
        await MenuBar.create(body);
        return NextResponse.json({ message: "Menu added successfully!" }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function PUT(req) {
    await connectDB();
    const { id, ...data } = await req.json();

    try {
        const updatedMenu = await MenuBar.findByIdAndUpdate(id, data, { new: true });

        if (!updatedMenu) {
            return NextResponse.json({ message: "Menu item not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Menu updated successfully!", menu: updatedMenu });
    } catch (error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function PATCH(req) {
    await connectDB();
    const { id, active } = await req.json();

    try {
        const updatedMenu = await MenuBar.findByIdAndUpdate(id, { active }, { new: true });

        if (!updatedMenu) {
            return NextResponse.json({ message: "Menu item not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Menu updated successfully!", menu: updatedMenu });
    } catch (error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function DELETE(req) {
    await connectDB();
    const { id } = await req.json();

    try {
        const menu = await MenuBar.findById(id);
        if (!menu) {
            return NextResponse.json({ message: "Menu not found" }, { status: 404 });
        }

        // Collect all package IDs from submenus
        const packageIds = menu.subMenu.flatMap(sub => sub.products);

        // Collect image keys from the menu's banners and submenus
        const imageKeysToDelete = [];

        // Add menu banner image key if it exists
        if (menu.subMenu.length > 0) {
            for (const subMenu of menu.subMenu) {
                if (subMenu.banner?.key) {
                    imageKeysToDelete.push(subMenu.banner.key);
                }

                // Loop through packages in submenus and gather image keys
                for (const productId of subMenu.products) {
                    // Fetch the package and collect the gallery image keys
                    const pkg = await Product.findById(productId);
                    if (pkg) {
                        for (const galleryItem of pkg.gallery) {
                            if (galleryItem.key) {
                                imageKeysToDelete.push(galleryItem.key);
                            }
                        }

                        // Add package banner image key if it exists
                        if (pkg.basicDetails?.imageBanner?.key) {
                            imageKeysToDelete.push(pkg.basicDetails.imageBanner.key);
                        }
                        if (pkg.basicDetails?.thumbnail?.key) {
                            imageKeysToDelete.push(pkg.basicDetails.thumbnail.key);
                        }
                    }
                }
            }
        }

        // Delete all associated packages
        if (packageIds.length > 0) {
            await Package.deleteMany({ _id: { $in: packageIds } });
        }

        // Now delete all images from UploadThing (or other external storage)
        for (const key of imageKeysToDelete) {
            await deleteFileFromCloudinary(key);
        }

        // Finally, delete the menu
        await MenuBar.findByIdAndDelete(id);

        return NextResponse.json({ message: "Menu and all related data deleted successfully!" }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}