"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Image from "next/image";
import toast from "react-hot-toast";

import { PencilIcon, Trash2Icon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useRef } from "react";
import { UploadIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const FoodCategory = () => {
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [bannerToDelete, setBannerToDelete] = useState(null);
    const [banners, setBanners] = useState([]);
    const [editBanner, setEditBanner] = useState(null);
    // Form state

    // Slugify utility
    function slugify(str) {
        return str
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .replace(/-+/g, '-');
    }
    const [formData, setFormData] = useState({
        slug: "",
        categoryName: "",
        categoryProfileImage:"",
        categoryBannerImage:"",
        order: 1,
    });

    // Fetch food categories and determine the next order number
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await fetch("/api/foodCategory");
                const data = await response.json();
                setBanners(data);

                // Auto-set next order number
                if (data.length > 0) {
                    const highestOrder = Math.max(...data.map((b) => b.order));
                    setFormData((prev) => ({ ...prev, order: highestOrder + 1 }));
                }
            } catch (error) {
                toast.error("Failed to fetch categories");
            }
        };
        fetchCategories();
    }, []);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };
    // Cloudinary-style image upload
    const [uploading, setUploading] = useState({ profile: false, banner: false });
    const profileFileInputRef = useRef(null);
    const bannerFileInputRef = useRef(null);

    const handleImageChange = async (e, type) => {
        const file = e.target.files[0];
        if (!file) return;
        
        setUploading(prev => ({ ...prev, [type]: true }));
        const formDataUpload = new FormData();
        formDataUpload.append('file', file);
        
        try {
            const res = await fetch('/api/cloudinary', {
                method: 'POST',
                body: formDataUpload
            });
            const data = await res.json();
            
            if (res.ok && data.url) {
                setFormData(prev => ({
                    ...prev,
                    [`category${type === 'profile' ? 'Profile' : 'Banner'}Image`]: {
                        url: data.url,
                        key: data.key || ''
                    }
                }));
                toast.success(`${type === 'profile' ? 'Profile' : 'Banner'} image uploaded!`);
            } else {
                toast.error(`Failed to upload ${type} image: ${data.error || 'Unknown error'}`);
            }
        } catch (err) {
            toast.error(`Error uploading ${type} image: ${err.message}`);
        } finally {
            setUploading(prev => ({ ...prev, [type]: false }));
        }
    };

    // Remove image from formData
    const handleDeleteImage = (type) => {
        setFormData(prev => ({
            ...prev,
            [`category${type === 'profile' ? 'Profile' : 'Banner'}Image`]: { url: '', key: '' }
        }));
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const method = editBanner ? "PATCH" : "POST";
            // Create a clean payload with only the necessary fields
            // Generate slug from category name
            const slug = slugify(formData.categoryName || '');
            
            const payload = {
                categoryName: formData.categoryName,
                slug: slug,
                order: formData.order,
                id: editBanner || undefined,
            };

            // Only include image data if it exists
            if (formData.categoryProfileImage?.url) {
                payload.categoryProfileImage = formData.categoryProfileImage;
            }
            if (formData.categoryBannerImage?.url) {
                payload.categoryBannerImage = formData.categoryBannerImage;
            }

            const response = await fetch("/api/foodCategory", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success(`Category ${editBanner ? "updated" : "added"} successfully`);
                setEditBanner(null);

                // Refresh category list
                const updatedCategories = await fetch("/api/foodCategory").then((res) => res.json());
                setBanners(updatedCategories);

                // Reset form with proper image object structure
                setFormData({
                    categoryName: "",
                    slug: "",
                    categoryProfileImage: { url: "", key: "" },
                    categoryBannerImage: { url: "", key: "" },
                    order: updatedCategories.length + 1,
                });

            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error("Something went wrong");
        }
    };

    const handleEdit = (category) => {
        setEditBanner(category._id);
        setFormData({
            categoryName: category.categoryName,
            slug: category.slug || slugify(category.categoryName || ''),
            categoryProfileImage: category.categoryProfileImage || { url: "", key: "" },
            categoryBannerImage: category.categoryBannerImage || { url: "", key: "" },
            order: category.order,
        });
    };

    const handleDelete = async (id) => {
        try {
            const response = await fetch("/api/foodCategory", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success("Category deleted successfully");

                setBanners((prev) => prev.filter((c) => c._id !== id));

                // Update order numbers
                const updatedCategories = await fetch("/api/foodCategory").then((res) => res.json());
                setBanners(updatedCategories);
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error("Something went wrong");
        }
    };

    const confirmDelete = async () => {
        if (bannerToDelete) {
            await handleDelete(bannerToDelete);
            setBannerToDelete(null);
            setShowDeleteModal(false);
        }
    };

    const cancelDelete = () => {
        setShowDeleteModal(false);
        setBannerToDelete(null);
    };
    return (
        <div className="mx-auto py-10 w-full">
            <form onSubmit={handleSubmit} className="bg-white max-w-md mx-auto shadow-lg rounded-lg p-6 space-y-4 ">
                <h2 className="text-xl font-bold mb-6">{editBanner ? "Edit Food Category" : "Add New Food Category"}</h2>
                <div className="flex items-center gap-5">
                    <div className="w-full">
                        <Label>Category Name</Label>
                        <Input name="categoryName" placeholder="Enter category name" type="text" value={formData.categoryName} onChange={handleInputChange} />
                    </div>
                </div>
                {/* Profile Image Upload */}
                <div className="mb-4">
                    <Label className="block mb-2 font-bold">Profile Image</Label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageChange(e, 'profile')}
                        ref={profileFileInputRef}
                        className="hidden"
                        id="profile-image-input"
                    />
                    <Button
                        type="button"
                        variant="outline"
                        className="mb-2 flex items-center gap-2 bg-blue-500 text-white"
                        onClick={() => profileFileInputRef.current?.click()}
                        disabled={uploading.profile}
                    >
                        <span>Select Profile Image</span>
                        <UploadIcon className="w-4 h-4" />
                    </Button>
                    {uploading.profile && <div className="text-blue-600 font-semibold">Uploading...</div>}
                    {formData.categoryProfileImage?.url && (
                        <div className="relative w-48 h-48 border rounded-full overflow-hidden mb-2">
                            <Image
                                src={formData.categoryProfileImage.url}
                                alt="Profile Preview"
                                fill
                                className="object-cover"
                            />
                            <button
                                type="button"
                                onClick={() => handleDeleteImage('profile')}
                                className="absolute top-1 right-1 bg-white bg-opacity-80 rounded-full p-1 hover:bg-red-200"
                                title="Remove profile image"
                            >
                                <Trash2Icon className="w-5 h-5 text-red-600" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Banner Image Upload */}
                <div className="mb-4">
                    <Label className="block mb-2 font-bold">Banner Image</Label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageChange(e, 'banner')}
                        ref={bannerFileInputRef}
                        className="hidden"
                        id="banner-image-input"
                    />
                    <Button
                        type="button"
                        variant="outline"
                        className="mb-2 flex items-center gap-2 bg-blue-500 text-white"
                        onClick={() => bannerFileInputRef.current?.click()}
                        disabled={uploading.banner}
                    >
                        <span>Select Banner Image</span>
                        <UploadIcon className="w-4 h-4" />
                    </Button>
                    {uploading.banner && <div className="text-blue-600 font-semibold">Uploading...</div>}
                    {formData.categoryBannerImage?.url && (
                        <div className="relative w-full h-48 border rounded-lg overflow-hidden mb-2">
                            <Image
                                src={formData.categoryBannerImage.url}
                                alt="Banner Preview"
                                fill
                                className="object-cover"
                            />
                            <button
                                type="button"
                                onClick={() => handleDeleteImage('banner')}
                                className="absolute top-1 right-1 bg-white bg-opacity-80 rounded-full p-1 hover:bg-red-200"
                                title="Remove banner image"
                            >
                                <Trash2Icon className="w-5 h-5 text-red-600" />
                            </button>
                        </div>
                    )}
                </div>
                <div className="flex gap-3">
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-500 px-10">
                        {editBanner ? "Update category" : "Add category"}
                    </Button>
                    {editBanner && (
                        <Button
                            type="button"
                            variant="outline"
                            className="bg-gray-300 hover:bg-gray-200 text-black"
                            onClick={() => {
                                setEditBanner(null);
                                setFormData({
                                    categoryName: "",
                                    order: banners.length > 0 ? Math.max(...banners.map(b => b.order)) + 1 : 1,
                                });
                            }}
                        >
                            Cancel Edit
                        </Button>
                    )}
                </div>
            </form>

            <h2 className="text-2xl font-bold mt-10 mb-4">Existing Food Categories</h2>
            <Table className="border border-black">
                <TableHeader>
                    <TableRow>
                        <TableHead className="text-center border border-black">Order</TableHead>
                        <TableHead className="text-center border border-black">Food Category Name</TableHead>
                        <TableHead className="text-center border border-black">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody className="w-fit">
                    {banners.length > 0 ? (
                        banners.map((category) => (
                            <TableRow key={category._id} className="hover:bg-gray-200 w-fit">
                                <TableCell className="text-center border border-black">{category.order}</TableCell>
                                <TableCell className="text-center border border-black">{category.categoryName}</TableCell>
                                <TableCell className="text-center border border-black" >
                                    <Button variant="outline" size="icon" onClick={() => handleEdit(category)} className="mr-2 "><PencilIcon /></Button>
                                    <Button size="icon" onClick={() => { setShowDeleteModal(true); setBannerToDelete(category._id); }} variant="destructive"><Trash2Icon /></Button>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan="5" className="text-center py-4">No categories found</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Banner</DialogTitle>
                    </DialogHeader>
                    <p>Are you sure you want to delete this banner?</p>
                    <DialogFooter>
                        <Button variant="secondary" onClick={cancelDelete}>Cancel</Button>
                        <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default FoodCategory