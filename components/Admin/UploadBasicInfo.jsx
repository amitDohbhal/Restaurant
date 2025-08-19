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
import { Textarea } from "../ui/textarea";

const UploadBasicInfo = () => {
    // Only one info entry is managed
    const [infoId, setInfoId] = useState(null); // Store _id if entry exists
    const [formData, setFormData] = useState({
        image: { url: "", key: "" },
        footerImage: { url: "", key: "" },
        title: "",
        coupon: "",
        email1: "",
        email2: "",
        contactNumber1: "",
        contactNumber2: "",
        contactNumber3: "",
        address1: "",
        city1: "",
        pincode1: "",
        state1: "",
        address2: "",
        city2: "",
        pincode2: "",
        state2: "",
        googleMap1: "",
        googleMap2: "",
        gstNumber: "",
        companyNumber: "",
    });

    // Fetch the single basic info entry and populate form
    useEffect(() => {
        const fetchInfo = async () => {
            try {
                const response = await fetch("/api/addBasicInfo");
                const data = await response.json();
                if (Array.isArray(data) && data.length > 0) {
                    const info = data[0];
                    setInfoId(info._id);
                    setFormData({
                        image: info.image || { url: '', key: '' },
                        footerImage: info.footerImage || { url: '', key: '' },
                        title: info.title || '',
                        coupon: info.coupon || '',
                        email1: info.email1 || '',
                        email2: info.email2 || '',
                        contactNumber1: info.contactNumber1 || '',
                        contactNumber2: info.contactNumber2 || '',
                        contactNumber3: info.contactNumber3 || '',
                        address1: info.address1 || '',
                        city1: info.city1 || '',
                        pincode1: info.pincode1 || '',
                        state1: info.state1 || '',
                        address2: info.address2 || '',
                        city2: info.city2 || '',
                        pincode2: info.pincode2 || '',
                        state2: info.state2 || '',
                        googleMap1: info.googleMap1 || '',
                        googleMap2: info.googleMap2 || '',
                        gstNumber: info.gstNumber || '',
                        companyNumber: info.companyNumber || '',
                    });
                }
            } catch (error) {
                toast.error("Failed to fetch info");
            }
        };
        fetchInfo();
    }, []);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Cloudinary-style image upload (like AddGallery.jsx)
    const [mainUploading, setMainUploading] = useState(false);
    const [footerUploading, setFooterUploading] = useState(false);
    const handleImageChange = async (e, type = "main") => {
        const file = e.target.files[0];
        if (!file) return;
        if (type === "main") setMainUploading(true);
        else setFooterUploading(true);
        const formDataUpload = new FormData();
        formDataUpload.append('file', file);
        try {
            const res = await fetch('/api/cloudinary', {
                method: 'POST',
                body: formDataUpload
            });
            const data = await res.json();
            if (res.ok && data.url) {
                if (type === "main") {
                    setFormData(prev => ({ ...prev, image: { url: data.url, key: data.key || '' } }));
                    toast.success('Main Logo uploaded!');
                } else {
                    setFormData(prev => ({ ...prev, footerImage: { url: data.url, key: data.key || '' } }));
                    toast.success('Footer Image uploaded!');
                }
            } else {
                toast.error('Cloudinary upload failed: ' + (data.error || 'Unknown error'));
            }
        } catch (err) {
            toast.error('Cloudinary upload error: ' + err.message);
        }
        if (type === "main") setMainUploading(false);
        else setFooterUploading(false);
    };


    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation: required fields
        if (!formData.image.url || !formData.image.key) return toast.error("Please upload Main Logo image");
        if (!formData.footerImage?.url || !formData.footerImage?.key) return toast.error("Please upload Footer image");
        if (!formData.email1) return toast.error("1st Email Id is required");
        if (!formData.contactNumber1) return toast.error("1st Contact Number is required");
        if (!formData.address1) return toast.error("Address1 is required");
        if (!formData.pincode1) return toast.error("Pincode1 is required");
        if (!formData.state1) return toast.error("State1 is required");
        if (!formData.googleMap1) return toast.error("Google Map1 is required");
        if (!formData.companyNumber) return toast.error("Company Number is required");
        // Add more required fields as needed

        try {
            const method = infoId ? "PATCH" : "POST";
            const payload = infoId ? { ...formData, _id: infoId } : { ...formData };
            const response = await fetch("/api/addBasicInfo", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success(`Basic Info ${infoId ? "updated" : "added"} successfully`);
                if (!infoId && data._id) setInfoId(data._id);
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error("Something went wrong");
        }
    };
    const handleDelete = async (id) => {
        try {
            const response = await fetch("/api/addBasicInfo", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success("Banner deleted successfully");

                setBanners((prev) => prev.filter((banner) => banner._id !== id));

                // Update order numbers
                const updatedBanners = await fetch("/api/addBasicInfo").then((res) => res.json());
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
    const handleDeleteFooterImage = () => {
        setFormData(prev => ({ ...prev, footerImage: { url: '', key: '' } }));
    };

    // Ref for file input
    const fileInputRef = useRef(null);

    return (
        <div className="max-w-6xl mx-auto py-10 w-full">
            <h2 className="text-2xl font-bold mb-6">Basic Info</h2>
            <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-lg p-6 space-y-4">
                {/* Banner Image Upload */}
                <div className="flex gap-3 items-center">
                    <div className="mb-2">
                        <Label className="block mb-2 font-bold">Basic Main Logo Image</Label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={e => handleImageChange(e, "main")}
                            className="hidden"
                            id="banner-image-input-main"
                        />
                        <Button
                            type="button"
                            variant="outline"
                            className="mb-2 flex items-center gap-2 bg-blue-500 text-white"
                            onClick={() => document.getElementById('banner-image-input-main').click()}
                        >
                            <span>Upload Main Logo</span>
                            <UploadIcon className="w-4 h-4" />
                        </Button>
                        {mainUploading && <div className="text-blue-600 font-semibold">Uploading...</div>}
                        {formData.image.url && (
                            <div className="relative w-48 h-28 border rounded overflow-hidden mb-2">
                                <Image
                                    src={formData.image.url}
                                    alt="Basic Main Logo Image Preview"
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
                    {/* Footer Image */}
                    <div className="mb-2">
                        <Label className="block mb-2 font-bold">Upload Footer Image</Label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={e => handleImageChange(e, "footer")}
                            className="hidden"
                            id="banner-image-input-footer"
                        />
                        <Button
                            type="button"
                            variant="outline"
                            className="mb-2 flex items-center gap-2 bg-blue-500 text-white"
                            onClick={() => document.getElementById('banner-image-input-footer').click()}
                        >
                            <span>Upload Footer Image</span>
                            <UploadIcon className="w-4 h-4" />
                        </Button>
                        {footerUploading && <div className="text-blue-600 font-semibold">Uploading...</div>}
                        {formData.footerImage?.url && (
                            <div className="relative w-48 h-28 border rounded overflow-hidden mb-2">
                                <Image
                                    src={formData.footerImage.url}
                                    alt="Footer Image Preview"
                                    fill
                                    className="object-cover"
                                />
                                <button
                                    type="button"
                                    onClick={handleDeleteFooterImage}
                                    className="absolute top-1 right-1 bg-white bg-opacity-80 rounded-full p-1 hover:bg-red-200"
                                    title="Remove image"
                                >
                                    <Trash2Icon className="w-5 h-5 text-red-600" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                <hr className="h-px border border-gray-500 my-4" />
                {/* Email Id */}
                <div className="flex gap-3">
                    <div className="w-1/2">
                        <Label>1st Email Id</Label>
                        <Input name="email1" placeholder="Enter 1st Email Id" type="email" value={formData.email1} onChange={handleInputChange} />
                    </div>
                    <div className="w-1/2">
                        <Label>2nd Email Id</Label>
                        <Input name="email2" placeholder="Enter 2nd Email Id" type="email" value={formData.email2} onChange={handleInputChange} />
                    </div>
                </div>
                <hr className="h-px border border-gray-500 my-4" />
                {/* Contact Number */}
                <div>
                    <div className="flex gap-3">
                        <div className="w-1/2">
                            <Label>Contact Number 1st</Label>
                            <Input name="contactNumber1" placeholder="Enter Contact Number 1st" type="number" value={formData.contactNumber1} onChange={handleInputChange} />
                        </div>
                        <div className="w-1/2">
                            <Label>Contact Number 2nd</Label>
                            <Input name="contactNumber2" placeholder="Enter Contact Number 2nd" type="number" value={formData.contactNumber2} onChange={handleInputChange} />
                        </div>
                    </div>
                    <div className="w-1/2">
                        <Label>Contact Number 3rd</Label>
                        <Input name="contactNumber3" placeholder="Enter Contact Number 3rd" type="number" value={formData.contactNumber3} onChange={handleInputChange} />
                    </div>
                </div>
                <hr className="h-px border border-gray-500 my-4" />
                {/* Address */}
                <div className="flex gap-3">
                    <div className="w-1/2">
                        <div>
                            <Label>Address 1</Label>
                            <Textarea name="address1" placeholder="Enter Address 1" value={formData.address1} rows={4} onChange={handleInputChange} />
                        </div>
                        <div>
                            <Label>City 1</Label>
                            <Input name="city1" placeholder="Enter City 1" type="text" value={formData.city1} onChange={handleInputChange} />
                        </div>
                        <div>
                            <Label>PinCode 1</Label>
                            <Input name="pincode1" placeholder="Enter PinCode 1" type="number" value={formData.pincode1} onChange={handleInputChange} />
                        </div>
                        <div>
                            <Label>State 1</Label>
                            <Input name="state1" placeholder="Enter State 1" type="text" value={formData.state1} onChange={handleInputChange} />
                        </div>
                    </div>
                    <div className="w-1/2">
                        <div>
                            <Label>Address 2</Label>
                            <Textarea name="address2" placeholder="Enter Address 2" value={formData.address2} rows={4} onChange={handleInputChange} />
                        </div>
                        <div>
                            <Label>City 2</Label>
                            <Input name="city2" placeholder="Enter City 2" type="text" value={formData.city2} onChange={handleInputChange} />
                        </div>
                        <div>
                            <Label>PinCode 2</Label>
                            <Input name="pincode2" placeholder="Enter PinCode 2" type="number" value={formData.pincode2} onChange={handleInputChange} />
                        </div>
                        <div>
                            <Label>State 2</Label>
                            <Input name="state2" placeholder="Enter State 2" type="text" value={formData.state2} onChange={handleInputChange} />
                        </div>
                    </div>
                </div>
                <hr className="h-px border border-gray-500 my-4" />
                {/* Google Map */}
                <div className="flex gap-3">

                    <div className="w-1/2">
                        <Label>Google Map 1</Label>
                        <Textarea name="googleMap1" placeholder="Enter Google Map 1" value={formData.googleMap1} rows={4} onChange={handleInputChange} />
                    </div>
                    <div className="w-1/2">
                        <Label>Google Map 2</Label>
                        <Textarea name="googleMap2" placeholder="Enter Google Map 2" value={formData.googleMap2} rows={4} onChange={handleInputChange} />
                    </div>
                </div>
                <hr className="h-px border border-gray-500 my-4" />
                {/* Gst Number */}
                <div className="w-1/2">
                    <Label>Gst Number</Label>
                    <Input name="gstNumber" placeholder="Enter Gst Number" type="text" value={formData.gstNumber} onChange={handleInputChange} />
                </div>
                <hr className="h-px border border-gray-500 my-4" />
                {/* Company Number */}
                <div className="w-1/2">
                    <Label>Company Number</Label>
                    <Input name="companyNumber" placeholder="Enter Company Number" type="number" value={formData.companyNumber} onChange={handleInputChange} />
                </div>
                <hr className="h-px border border-gray-500 my-4" />
                {/* Submit Button */}
                <div className="flex gap-3">
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-500">
                        Save Basic Info
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default UploadBasicInfo