'use client'

// import { UploadButton } from "@/utils/cloudinary"; // Removed UploadThing
import { X } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Label } from "../ui/label";
import { usePackage } from "@/context/PackageContext";
import toast from "react-hot-toast";

const AddGallery = () => {
    const {
        formState: { errors },
        setValue,
        getValues
    } = useForm();

    const packages = usePackage();

    const [images, setImages] = useState([]);
    const [loadedImages, setLoadedImages] = useState([]);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useState(null);

    useEffect(() => {
        if (packages.gallery) {
            setImages(packages.gallery);
        }
    }, [packages]);

    const handleImageLoad = (index) => {
        setLoadedImages((prev) => {
            const updated = [...prev, index]; // Store loaded indexes
            return updated;
        });
    };

    const handleImageUpload = async (event) => {
        const files = Array.from(event.target.files);
        if (!files.length) return;
        setUploading(true);
        let newFiles = [];
        try {
            for (const file of files) {
                const formData = new FormData();
                formData.append('file', file);
                const res = await fetch('/api/cloudinary', {
                    method: 'POST',
                    body: formData
                });
                if (!res.ok) throw new Error('Image upload failed');
                const result = await res.json();
                newFiles.push({ url: result.url, key: result.key });
            }
            setImages(prev => [...prev, ...newFiles]);
            setValue("gallery", [...(getValues("gallery") || []), ...newFiles], { shouldValidate: true });
            saveImagesToDatabase(newFiles);
            toast.success('Images uploaded successfully');
        } catch (err) {
            toast.error('Image upload failed');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleRemoveImage = async (key) => {
        const deleteImage = await fetch("/api/admin/website-manage/addPackage/addGallery", {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                pkgId: packages._id,
                key: key,
            }),
        });

        if (!deleteImage.ok) {
            return toast.error(`Failed to delete image: ${deleteImage.message}`, {
                duration: 5000,
                icon: "❌",
                style: { borderRadius: "10px", border: "2px solid red" },
            });
        } else {
            setImages(prev => prev.filter(file => file.key !== key));

            toast.success("Image Deleted", {
                duration: 5000,
                icon: "📸",
                style: { borderRadius: "10px", border: "2px solid green" },
            });
        }
    };

    const saveImagesToDatabase = async (newImages) => {
        if (!newImages || newImages.length === 0) return; // ✅ Prevent unnecessary calls

        // ✅ Merge new images with existing ones before sending to the server
        const updatedGallery = [...images, ...newImages];

        try {
            const response = await fetch("/api/admin/website-manage/addPackage/addGallery", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    pkgId: packages._id,
                    images: updatedGallery, // ✅ Send all images (old + new)
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                return toast.error(`Failed to upload images: ${data.message}`, {
                    duration: 5000,
                    icon: "❌",
                    style: { borderRadius: "10px", border: "2px solid red" },
                });
            }

            // ✅ Update state with the full gallery
            setImages(updatedGallery);

            toast.success("Images Uploaded", {
                duration: 5000,
                icon: "📸",
                style: { borderRadius: "10px", border: "2px solid green" },
            });

        } catch (error) {
            console.error("Error saving images to database", error);
        }
    };

    return (
        <div className="flex flex-col items-center gap-8 my-20 w-full bg-blue-100 max-w-5xl p-4 rounded-lg">
            <h1 className="text-4xl font-semibold">Add Gallery</h1>
            <div className="space-y-2 w-full">
                <Label>Gallery Images</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 w-full gap-4">
                    {images.length > 0 ? (
                        images.map((file, index) => (
                            <div
                                key={index}
                                className="relative aspect-video rounded-lg overflow-hidden border-2 border-blue-600 group"
                            >
                                {!loadedImages.includes(index) && (
                                    <div className="absolute inset-0 animate-pulse bg-gray-300 flex items-center justify-center">
                                        <div className="w-8 h-8 border-4 border-gray-400 border-t-gray-600 rounded-full animate-spin"></div>
                                    </div>
                                )}

                                <Image
                                    src={file.url || 'https://dummyimage.com/600x400'}
                                    alt={`Preview ${index + 1}`}
                                    fill
                                    className={`object-cover transition-opacity duration-500 ${loadedImages.includes(index) ? 'opacity-100' : 'opacity-0'}`}
                                    onLoad={() => handleImageLoad(index)}
                                />

                                <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveImage(file.key)}
                                        className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500">No Images uploaded</p>
                    )}
                </div>
                <input
                    type="file"
                    accept="image/*"
                    multiple
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleImageUpload}
                />
                <button
                    type="button"
                    className="bg-blue-600 text-white px-4 py-2 rounded mt-12"
                    onClick={() => fileInputRef.current && fileInputRef.current.click()}
                    disabled={uploading}
                >
                    {uploading ? 'Uploading...' : 'Upload Images'}
                </button>
            </div>
        </div>
    );
};

export default AddGallery;
