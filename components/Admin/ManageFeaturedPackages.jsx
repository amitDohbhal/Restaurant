"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import Image from "next/image";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
// import { UploadButton } from "@uploadthing/react"; // Removed UploadThing
// import { deleteFileFromUploadthing } from "@/utils/Utapi"; // Removed UploadThing
import { X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
const ManageFeaturedPackages = () => {
    const [packages, setPackages] = useState([]);
    const [editingPackage, setEditingPackage] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        image: { url: "", key: "" }, // Storing both URL & Key
        link: "",
    });
    const [uploading, setUploading] = useState(false);
    // Add this line to fix delete button bug
    const [packageToDelete, setPackageToDelete] = useState({ id: null, imageKey: null });

    const fetchPackages = async () => {
        try {
            const response = await fetch("/api/featured-packages");
            const data = await response.json();
            // console.log('API Response:', data);

            if (data.success && Array.isArray(data.data)) {
                setPackages(data.data);
            } else {
                console.error('Unexpected data format:', data);
                setPackages([]);
                toast.error("Failed to load packages: Invalid data format");
            }
        } catch (error) {
            console.error('Error fetching packages:', error);
            toast.error("Failed to fetch packages");
            setPackages([]);
        }
    };
    useEffect(() => {
        fetchPackages();
    }, []);

    const handleEdit = (pkg) => {
        setEditingPackage(pkg._id);
        setFormData({
            title: pkg.title,
            image: pkg.image || { url: "", key: "" },
            link: pkg.link || ""
        })
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Prepare the data to send
            const dataToSend = {
                title: formData.title,
                link: formData.link,
                image: formData.image
            };

            const url = editingPackage
                ? `/api/featured-packages/${editingPackage}`
                : '/api/featured-packages';

            const method = editingPackage ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dataToSend)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to save package');
            }

            // Show success message
            toast.success(editingPackage ? 'Package updated successfully!' : 'Package added successfully!');

            // Reset form and refresh list
            setFormData({ title: '', image: { url: '', key: '' }, link: '' });
            setEditingPackage(null);
            await fetchPackages();

        } catch (error) {
            console.error('Error saving package:', error);
            toast.error(error.message || 'Failed to save package');
        }
    };

    const handleRemoveBanner = () => {
        setFormData({ ...formData, image: { url: "", key: "" } });
    };

    const handleDelete = (id, imageKey) => {
        setPackageToDelete({ id, imageKey });
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        const { id, imageKey } = packageToDelete;
        try {
            // Delete the image from Uploadthing first
            if (imageKey) {
                // Removed UploadThing delete, now just clear image from state(imageKey);
            }

            // Then delete the package from database
            const response = await fetch(`/api/featured-packages/${id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error("Failed to delete package");
            }

            toast.success("Product deleted successfully");

            // Refresh the list of packages
            await fetchPackages();

            // If we were editing this package, clear the form
            if (editingPackage === id) {
                setEditingPackage(null);
                setFormData({ title: "", image: { url: "", key: "" }, link: "" });
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setShowDeleteModal(false);
            setPackageToDelete({ id: null, imageKey: null });
        }
    };

    const cancelDelete = () => {
        setShowDeleteModal(false);
        setPackageToDelete({ id: null, imageKey: null });
    };
    const handleCancelEdit = () => {
        setEditingPackage(null);
        setFormData({ title: "", image: { url: "", key: "" }, link: "" });
    };

    return (
        <div className="p-6 mt-12 mx-auto max-w-7xl w-full ">
            <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-lg p-6 space-y-4">
                <Label>Title</Label>
                <Input name="title" placeholder="e.g. Add Product Title" value={formData.title} onChange={handleChange} required />
                <Label>Link</Label>
                <Input name="link" placeholder="e.g. Add Product Link" value={formData.link} onChange={handleChange} required />
                <br />
                {/* Uploadthing Image Upload */}
                <Label >Upload Image</Label>
                <br />
                {formData?.image?.url === "" && (
                    <>
                        <input
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            id="featured-image-upload-input"
                            onChange={async (event) => {
                                const file = event.target.files[0];
                                if (!file) return;
                                setUploading(true);
                                try {
                                    const formDataUpload = new FormData();
                                    formDataUpload.append('file', file);
                                    const res = await fetch('/api/cloudinary', {
                                        method: 'POST',
                                        body: formDataUpload
                                    });
                                    if (!res.ok) throw new Error('Image upload failed');
                                    const result = await res.json();
                                    setFormData((prev) => ({
                                        ...prev,
                                        image: { url: result.url, key: result.key },
                                    }));
                                    toast.success('Image uploaded successfully!');
                                } catch (err) {
                                    toast.error('Upload failed');
                                } finally {
                                    setUploading(false);
                                }
                            }}
                            disabled={uploading}
                        />
                        <Button
                            type="button"
                            className="bg-blue-600 text-white px-4 py-2 rounded mt-2"
                            onClick={() => document.getElementById('featured-image-upload-input').click()}
                            disabled={uploading}
                        >
                            {uploading ? 'Uploading...' : 'Upload Image'}
                        </Button>
                    </>
                )}

                {formData?.image?.url && (
                    <div
                        className="relative aspect-video rounded-lg h-52 w-fit   overflow-hidden border-2 border-blue-600 group"
                    >
                        <Image
                            src={formData?.image?.url || 'https://dummyimage.com/600x400'}
                            alt={`Banner Preview`}
                            fill
                            sizes="100vw"
                            className={`object-contain w-full transition-opacity duration-500`}
                        />

                        <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button
                                type="button"
                                onClick={() => handleRemoveBanner(formData?.image?.key)}
                                className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
                <br />
                {editingPackage && (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancelEdit}
                        className="bg-gray-100 hover:bg-gray-200 mx-5"
                    >
                        Cancel
                    </Button>
                )}



                <Button className="mt-4 bg-blue-600 hover:bg-blue-700" type="submit">
                    {editingPackage ? "Update Product" : "Add Product"}
                </Button>
            </form >

            {/* Display Existing Packages */}
            < div className="mt-6" >
                <h2 className="text-xl font-bold">Existing Products</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                    {packages && packages.length > 0 ? (
                        packages.map((pkg) => (
                            <div key={pkg._id} className="p-4 border rounded-lg shadow-md">
                                <Image src={pkg.image.url} alt={pkg.title} width={300} height={200} className="rounded-md" />
                                <h3 className="font-bold text-lg mt-2">{pkg.title}</h3>
                                <Button onClick={() => handleEdit(pkg)} className="mt-2 bg-blue-600 hover:bg-blue-700">
                                    Edit
                                </Button>
                                <Button
                                    onClick={() => handleDelete(pkg._id, pkg.image.key)}
                                    className="bg-red-600 hover:bg-red-700 ml-2"
                                >
                                    Delete
                                </Button>
                            </div>
                        ))
                    ) : (
                        <p>No featured packages found.</p>
                    )}
                </div>
            </div >
            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Featured Product</DialogTitle>
                    </DialogHeader>
                    <p>Are you sure you want to delete this product?</p>
                    <DialogFooter>
                        <Button variant="secondary" onClick={cancelDelete}>Cancel</Button>
                        <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    );
};

export default ManageFeaturedPackages;
