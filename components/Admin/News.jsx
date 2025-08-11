"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Image from "next/image";
import toast from "react-hot-toast";

import { PencilIcon, Trash2Icon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useRef } from "react";
import { UploadIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

const News = () => {
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [bannerToDelete, setBannerToDelete] = useState(null);
    const [banners, setBanners] = useState([]);
    const [editBanner, setEditBanner] = useState(null);
    const [formData, setFormData] = useState({
        title: "",
        date: "",
        description: "",
        image: { url: "", key: "" },
        order: 1,
    });

    // Fetch banners and determine the next order number
    useEffect(() => {
        const fetchBanners = async () => {
            try {
                const response = await fetch("/api/addNews");
                const data = await response.json();
                setBanners(data);

                // Auto-set next order number
                if (data.length > 0) {
                    const highestOrder = Math.max(...data.map((b) => b.order));
                    setFormData((prev) => ({ ...prev, order: highestOrder + 1 }));
                }
            } catch (error) {
                toast.error("Failed to fetch banners");
            }
        };
        fetchBanners();
    }, []);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Cloudinary-style image upload (like AddGallery.jsx)
    const [uploading, setUploading] = useState(false);
    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        const formDataUpload = new FormData();
        formDataUpload.append('file', file);
        try {
            const res = await fetch('/api/cloudinary', {
                method: 'POST',
                body: formDataUpload
            });
            const data = await res.json();
            if (res.ok && data.url) {
                setFormData(prev => ({ ...prev, image: { url: data.url, key: data.key || '' } }));
                toast.success('Image uploaded!');
            } else {
                toast.error('Cloudinary upload failed: ' + (data.error || 'Unknown error'));
            }
        } catch (err) {
            toast.error('Cloudinary upload error: ' + err.message);
        }
        setUploading(false);
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.image.url || !formData.image.key) return toast.error("Please upload an image");
        try {
            const method = editBanner ? "PATCH" : "POST";
            const response = await fetch("/api/addNews", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...formData, id: editBanner }),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success(`Banner ${editBanner ? "updated" : "added"} successfully`);
                setEditBanner(null);

                // Refresh banner list
                const updatedBanners = await fetch("/api/addNews").then((res) => res.json());
                setBanners(updatedBanners);

                // Reset form
                setFormData({
                    title: "",
                    date: "",
                    description: "",
                    order: updatedBanners.length + 1,
                    image: { url: "", key: "" },
                });

            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error("Something went wrong");
        }
    };

    const handleEdit = (banner) => {
        setEditBanner(banner._id);
        // console.log(banner)
        setFormData({
            title: banner.title,
            date: banner.date,
            description: banner.description,
            order: banner.order,
            image: banner.image,
        });
    };

    const handleDelete = async (id) => {
        try {
            const response = await fetch("/api/addNews", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success("Banner deleted successfully");

                setBanners((prev) => prev.filter((banner) => banner._id !== id));

                // Update order numbers
                const updatedBanners = await fetch("/api/addNews").then((res) => res.json());
                setBanners(updatedBanners);
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

    // Remove image from formData only
    const handleDeleteImage = () => {
        setFormData(prev => ({ ...prev, image: { url: '', key: '' } }));
    };


    // Ref for file input
    const fileInputRef = useRef(null);

    return (
        <div className="max-w-5xl mx-auto py-10 w-full">
            <h2 className="text-2xl font-bold mb-6">{editBanner ? "Edit News" : "Add New News"}</h2>
            <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-lg p-6 space-y-4">
                {/* Banner Image Upload */}
                <div className="mb-4">
                    <Label className="block mb-2 font-bold">News Image</Label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        ref={fileInputRef}
                        className="hidden"
                        id="banner-image-input"
                    />
                    <Button
                        type="button"
                        variant="outline"
                        className="mb-2 flex items-center gap-2 bg-blue-500 text-white"
                        onClick={() => fileInputRef.current && fileInputRef.current.click()}
                    >
                        <span>Select News Image</span>
                        <UploadIcon className="w-4 h-4" />
                    </Button>
                    {uploading && <div className="text-blue-600 font-semibold">Uploading...</div>}
                    {formData.image.url && (
                        <div className="relative w-48 h-28 border rounded overflow-hidden mb-2">
                            <Image
                                src={formData.image.url}
                                alt="News Image Preview"
                                fill
                                className="object-cover"
                            />
                            <button
                                type="button"
                                onClick={handleDeleteImage}
                                className="absolute top-1 right-1 bg-white bg-opacity-80 rounded-full p-1 hover:bg-red-200"
                                title="Remove image"
                            >
                                <Trash2Icon className="w-5 h-5 text-red-600" />
                            </button>
                        </div>
                    )}
                </div>
                <div>
                    <Label>Title</Label>
                    <Input name="title" placeholder="Enter title" value={formData.title} onChange={handleInputChange} />
                </div>
                <div>
                    <Label>Date </Label>
                    <Input name="date" type="date" placeholder="Enter Date" value={formData.date} onChange={handleInputChange} />
                </div>
                <div>
                    <Label>Description</Label>
                    <Textarea name="description" placeholder="Enter Description" rows={5} value={formData.description} onChange={handleInputChange} />
                </div>
                <div>
                    <Label>Order</Label>
                    <Input name="order" placeholder="Enter order" type="number" value={formData.order} readOnly className="bg-gray-100 cursor-not-allowed" />
                </div>

                <div className="flex gap-3">
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-500">
                        {editBanner ? "Update News" : "Add News"}
                    </Button>
                    {editBanner && (
                        <Button
                            type="button"
                            variant="outline"
                            className="bg-gray-300 hover:bg-gray-200 text-black"
                            onClick={() => {
                                setEditBanner(null);
                                setFormData({
                                    title: "",
                                    date: "",
                                    description: "",
                                    order: banners.length > 0 ? Math.max(...banners.map(b => b.order)) + 1 : 1,
                                    image: { url: "", key: "" },
                                });
                            }}
                        >
                            Cancel Edit
                        </Button>
                    )}
                </div>
            </form>

            <h2 className="text-2xl font-bold mt-10 mb-4">Existing News</h2>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Order</TableHead>
                        <TableHead>Image</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {banners.length > 0 ? (
                        banners.map((banner) => (
                            <TableRow key={banner._id}>
                                <TableCell>{banner.title}</TableCell>
                                {/* <TableCell>{banner.coupon}</TableCell> */}
                                <TableCell>{banner.date}</TableCell>
                                <TableCell style={{ wordBreak: "break-all", maxWidth: 200 }}>
                                    {(() => {
                                        const desc = banner.description ?? "";
                                        const words = desc.trim().split(/\s+/);
                                        if (words.length === 1 && desc.length > 30) {
                                            // Single long word, truncate by chars
                                            return desc.slice(0, 30) + " ...";
                                        }
                                        // Normal: show up to 10 words
                                        return words.slice(0, 10).join(" ") + (words.length > 10 ? " ..." : "");
                                    })()}
                                </TableCell>
                                <TableCell>{banner.order}</TableCell>
                                <TableCell>
                                    <Image src={banner.image.url} alt="News Image" width={100} height={50} className="rounded-xl" />
                                </TableCell>
                                <TableCell>
                                    <Button variant="outline" size="icon" onClick={() => handleEdit(banner)} className="mr-2 "><PencilIcon /></Button>
                                    <Button size="icon" onClick={() => { setShowDeleteModal(true); setBannerToDelete(banner._id); }} variant="destructive"><Trash2Icon /></Button>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan="5" className="text-center py-4">No News found</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete News</DialogTitle>
                    </DialogHeader>
                    <p>Are you sure you want to delete this news?</p>
                    <DialogFooter>
                        <Button variant="secondary" onClick={cancelDelete}>Cancel</Button>
                        <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default News