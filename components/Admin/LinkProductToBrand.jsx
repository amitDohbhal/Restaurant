"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import toast from "react-hot-toast";
import { Trash2, Loader2 as Loader2Icon } from "lucide-react";
import Image from "next/image";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
const LinkProductToBrand = () => {
    const fileInputRef = useRef(null);
    const bannerFileInputRef = useRef(null);
    // Add these state variables at the top of your component
    const [brands, setBrands] = useState([]);
    const [brandCategories, setBrandCategories] = useState([]);
    const [selectedBrand, setSelectedBrand] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingBrands, setIsLoadingBrands] = useState(false);
    const [uploadingBanner, setUploadingBanner] = useState(false);
    const [uploadingProfile, setUploadingProfile] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        slug: "",
        buttonLink: "",
        banner: { url: "", key: "" },
        profileImage: { url: "", key: "" },
        order: 1,
        brandId: "",
        active: true
    });

    // Fetch brands and categories on component mount
    useEffect(() => {
        fetchBrands();
        fetchBrandCategories();
    }, []);
    const fetchBrandCategories = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/brand-categories?populate=brand', {
                cache: 'no-store' // Ensure we're not getting cached data
            });


            const data = await response.json().catch(e => {

                throw new Error('Invalid response from server');
            });



            if (response.ok) {
                setBrandCategories(data);
            } else {
                const errorMsg = data.error || 'Failed to fetch brand categories';
                throw new Error(errorMsg);
            }
        } catch (error) {
            toast.error(error.message || 'Failed to fetch brand categories');
        } finally {
            setIsLoading(false);
        }
    };
    // Handle banner image upload
    const handleBannerUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploadingBanner(true); // Only set banner uploading to true
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
                    banner: { url: data.url, key: data.key || '' }
                }));
                toast.success('Banner image uploaded!');
            } else {
                toast.error('Failed to upload banner: ' + (data.error || 'Unknown error'));
            }
        } catch (err) {
            toast.error('Upload error: ' + err.message);
        } finally {
            setUploadingBanner(false); // Reset banner uploading state
        }
    };
    // Handle profile image upload
    const handleProfileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploadingProfile(true); // Set profile uploading to true
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
                    profileImage: { url: data.url, key: data.key || '' }
                }));
                toast.success('Profile image uploaded!');
            } else {
                toast.error('Failed to upload profile image: ' + (data.error || 'Unknown error'));
            }
        } catch (err) {
            toast.error('Upload error: ' + err.message);
        } finally {
            setUploadingProfile(false); // Reset profile uploading state
        }
    };
    const resetForm = () => {
        setFormData({
            title: '',
            slug: '',
            buttonLink: '',
            banner: { url: '', key: '' },
            profileImage: { url: '', key: '' },
            order: 0,
            active: true,
            brandId: '',
            brandCategory: ''
        });
        setSelectedBrand(null);
    };
    const fetchBrands = async () => {
        try {
            const response = await fetch('/api/addBrand');
            const data = await response.json();
          
            if (response.ok) {
                setBrands(data);
            } else {
                throw new Error(data.error || 'Failed to fetch brands');
            }
        } catch (error) {
            console.error('Error fetching brands:', error);
            toast.error(error.message || 'Failed to fetch brands');
        }
    };

    const handleBrandChange = async (brandCategoryId) => {
        try {
            setIsLoading(true);
            setSelectedBrand(brandCategoryId);

            // Find the selected brand category from the brandCategories list
            const selectedCategory = brandCategories.find(cat => cat._id === brandCategoryId);

            if (selectedCategory) {
                // Find the brand by matching the brandCategory name with brand's buttonLink
                const brand = brands.find(b =>
                    b.buttonLink === selectedCategory.brandCategory ||
                    b.title === selectedCategory.brandCategory
                );

                // Set the form data with the selected brand category's data
                const formDataUpdate = {
                    _id: selectedCategory._id,
                    brandId: brand?._id || null,
                    brandCategory: selectedCategory.brandCategory || '',
                    title: selectedCategory.title || '',
                    slug: selectedCategory.slug || '',
                    buttonLink: selectedCategory.buttonLink || '',
                    banner: selectedCategory.banner || { url: '', key: '' },
                    profileImage: selectedCategory.profileImage || { url: '', key: '' },
                    order: selectedCategory.order || 0,
                    active: selectedCategory.active !== false
                };

                setFormData(formDataUpdate);

                // Scroll to the form
                document.getElementById('brand-form')?.scrollIntoView({ behavior: 'smooth' });
            }
        } catch (error) {
            console.error('Error loading brand category data:', error);
            toast.error('Failed to load brand category data');
        } finally {
            setIsLoading(false);
        }
    };
    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.profileImage?.url) {
            return toast.error("Please upload a profile image");
        }

        if (!formData.brandId) {
            return toast.error("Please select a brand");
        }

        try {
            setIsLoading(true);

            // Get the selected brand
            const selectedBrandData = brands.find(b => b._id === formData.brandId);

            if (!selectedBrandData) {
                throw new Error("Invalid brand selected. Please refresh the page and try again.");
            }
            // Create a slug from the brand and product names
            const title = `${selectedBrandData.buttonLink}`;
            const slug = title.toLowerCase()
                .replace(/\s+/g, '-')           // Replace spaces with -
                .replace(/[^\w-]+/g, '')       // Remove all non-word chars
                .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
                .replace(/\-\-+/g, '-')         // Replace multiple - with single -
                .replace(/^-+/, '')             // Trim - from start of text
                .replace(/-+$/, '');            // Trim - from end of text

            const brandData = {
                title,
                slug,
                buttonLink: formData.buttonLink || `/brands/${slug}`,
                banner: formData.banner,
                profileImage: formData.profileImage,
                order: formData.order || 0,
                active: formData.active !== false, // Default to true if not set
                brandId: formData.brandId,
                brandCategory: selectedBrandData.buttonLink,
                _id: formData._id // Include the _id for updates
            };

            // Check if we're updating an existing brand category
            const isUpdating = formData._id; // Check if we have an _id for update
            const url = isUpdating
                ? `/api/brand-categories/${formData._id}`
                : '/api/brand-categories';

            const response = await fetch(url, {
                method: isUpdating ? 'PATCH' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(brandData)
            });

            const result = await response.json();

            if (!response.ok) {
                if (result.existingId) {
                    // Show a toast with an edit link
                    toast.error('A brand category with this name already exists.');
                    return;
                }
                throw new Error(result.error || 'Failed to save brand category');
            }

            toast.success(`Brand category ${isUpdating ? 'updated' : 'created'} successfully`);
            resetForm();
            await fetchBrandCategories(); // Refresh the list

            if (!isUpdating) {
                // Reset form for new entry if this was a create operation
                setFormData({
                    title: '',
                    slug: '',
                    buttonLink: '',
                    banner: { url: '', key: '' },
                    profileImage: { url: '', key: '' },
                    order: 0,
                    active: true,
                    brandId: '',
                    brandCategory: ''
                });
                setSelectedBrand(null);
            }

        } catch (error) {
            console.error('Error saving brand category:', error);
            toast.error(error.message || 'Failed to save brand category');
        } finally {
            setIsLoading(false);
        }
    };
    const handleDeleteImage = async (type) => {
        const image = formData[type];
        if (!image?.key) {
            toast.error('No valid image key found for deletion');
            return;
        }

        // Show loading toast
        toast.loading(`Deleting ${type} image from Cloudinary...`, { id: `delete-${type}-image` });

        try {
            const res = await fetch('/api/cloudinary', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ publicId: image.key })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to delete image from Cloudinary');
            }

            // Update form data to remove the image
            setFormData(prev => ({
                ...prev,
                [type]: { url: '', key: '' }
            }));

            toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} image deleted successfully!`, {
                id: `delete-${type}-image`
            });

        } catch (error) {
            console.error(`Error deleting ${type} image:`, error);
            toast.error(`Failed to delete ${type} image: ${error.message}`, {
                id: `delete-${type}-image`
            });
        }
    };
    // components/Admin/LinkProductToBrand.jsx
    const handleDeleteClick = (id) => {
       
        setCategoryToDelete(id);
        setDeleteDialogOpen(true);
    };



    const handleDeleteBrandCategory = async () => {
        if (!categoryToDelete) return;

        setIsDeleting(true);

        try {
            const response = await fetch(`/api/brand-categories/${categoryToDelete}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const result = await response.json();

            if (response.ok) {
                toast.success('Brand category deleted successfully');
            }
            else {
                throw new Error(result?.error || 'Failed to delete brand category');
            }
            await fetchBrandCategories();
            setDeleteDialogOpen(false);
            setCategoryToDelete(null);

        } catch (error) {
            console.error('Error deleting brand category:', error);
            toast.error(error.message || 'Failed to delete brand category');
        } finally {
            setIsDeleting(false);
        }
    };
    // Add this effect to debug the modal state
    return (
        <div className="max-w-5xl mx-auto py-10 w-full">
            <div className="grid grid-cols-1 gap-6">
                {/* Brand Form */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-6">
                        {selectedBrand ? 'Edit Brand' : 'Create New Brand'}
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-6" id="brand-form">
                        <div className="">
                            {/* Left Column */}
                            <div className="space-y-6">
                                {/* Brand Category Dropdown */}
                                <div className="space-y-2">
                                    <Label>Brand Category *</Label>
                                    <Select
                                        value={formData.brandId || ""}
                                        onValueChange={(value) => {
                                            const selected = brands.find(b => b._id === value);
                                            setFormData(prev => ({
                                                ...prev,
                                                brandId: value,
                                                brandCategory: selected?.buttonLink || '',
                                                title: selected?.buttonLink || '',
                                                buttonLink: selected?.buttonLink || ''
                                            }));
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a brand">
                                                {formData.brandId ? (
                                                    (() => {
                                                        const brand = brands.find(b => b._id === formData.brandId);
                                                       
                                                        return brand?.buttonLink || 'Brand not found';
                                                    })()
                                                ) : (
                                                    formData.brandCategory || 'Select a brand'
                                                )}
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {brands.length > 0 ? (
                                                brands.map((brand) => (
                                                    <SelectItem key={brand._id} value={brand._id}>
                                                        {brand.buttonLink}
                                                    </SelectItem>
                                                ))
                                            ) : (
                                                <div className="p-2 text-center">No brands found</div>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>



                                {/* Profile Image Upload */}
                                <div className="space-y-2">
                                    <Label>Profile Image *</Label>

                                    <div className="flex items-center gap-4">
                                        <div className="relative w-44 h-44 rounded border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                                            {formData.profileImage?.url ? (
                                                <div className="relative w-full h-full">
                                                    <Image
                                                        src={formData.profileImage.url}
                                                        alt="Profile"
                                                        width={128}
                                                        height={128}
                                                        className="w-full h-full object-cover rounded-full"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteImage('profileImage')}
                                                        className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                                        disabled={isLoading}
                                                        aria-label="Remove profile image"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="text-center">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={handleProfileUpload}
                                                        ref={fileInputRef}
                                                        className="hidden"
                                                        id="profile-image-input"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        className="bg-red-500 hover:bg-red-600 text-white hover:text-white"
                                                        onClick={() => fileInputRef.current?.click()}
                                                        disabled={uploadingProfile}
                                                    >
                                                        {uploadingProfile ? 'Uploading...' : 'Upload Profile'}
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>


                                {/* Banner Image Upload */}
                                <div className="space-y-2">
                                    <Label>Banner Image *</Label>
                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                                        <div className="relative w-full h-32 bg-gray-100 rounded flex items-center justify-center">
                                            {formData.banner?.url ? (
                                                <div className="relative">
                                                    <Image
                                                        src={formData.banner.url}
                                                        alt="Banner"
                                                        width={1200}
                                                        height={400}
                                                        className="w-full h-32 object-cover rounded-md"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteImage('banner')}
                                                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                                        disabled={isLoading}
                                                        aria-label="Remove banner image"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 ">
                                                    <div className="space-y-1 text-center">
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={handleBannerUpload}
                                                            ref={bannerFileInputRef}
                                                            className="hidden"
                                                            id="banner-image-input"
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            className="bg-red-500 hover:bg-red-600 text-white hover:text-white"
                                                            onClick={() => bannerFileInputRef.current?.click()}
                                                            disabled={uploadingBanner}
                                                        >
                                                            {uploadingBanner ? 'Uploading Banner...' : 'Upload Banner Image'}
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {/* Submit Buttons */}
                                <div className="flex justify-center gap-4 pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            setSelectedBrand('');
                                            setFormData({
                                                title: '',
                                                slug: '',
                                                banner: { url: '', key: '' },
                                                profileImage: { url: '', key: '' },
                                                order: 1,
                                                active: true,
                                                brandId: '',
                                                brandCategory: ''
                                            });
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="bg-blue-600 hover:bg-blue-700"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                                                {selectedBrand ? 'Updating...' : 'Creating...'}
                                            </>
                                        ) : selectedBrand ? 'Update Brand' : 'Create Brand'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
                {/* Brand Categories Table */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Brand
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {isLoadingBrands ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-4 text-center">
                                            <div className="flex justify-center">
                                                <Loader2Icon className="h-6 w-6 animate-spin text-gray-500" />
                                            </div>
                                        </td>
                                    </tr>
                                ) : brandCategories.length > 0 ? (
                                    brandCategories.map((brandCategory) => (
                                        <tr
                                            key={brandCategory._id}
                                            className={`hover:bg-gray-50 cursor-pointer ${selectedBrand === brandCategory._id ? 'bg-blue-50' : ''}`}
                                            onClick={() => handleBrandChange(brandCategory._id)}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    {brandCategory?.profileImage?.url ? (
                                                        <div className="flex-shrink-0 h-18 w-18">
                                                            <Image
                                                                src={brandCategory.profileImage?.url}
                                                                alt={brandCategory.buttonLink}
                                                                width={80}
                                                                height={80}
                                                                className="rounded"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                                            <span className="text-gray-400 text-xs">No Image</span>
                                                        </div>
                                                    )}
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {brandCategory.buttonLink || 'Untitled Brand'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                    ${brandCategory.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                    {brandCategory.active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
<button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleBrandChange(brandCategory._id);
                                                    }}
                                                    className="inline-flex items-center px-3 py-2 text-xs font-semibold text-white bg-yellow-500 hover:bg-yellow-600 rounded-md shadow-sm transition"
                                                >
                                                    Edit
                                                </button>

                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteClick(brandCategory._id);
                                                    }}
                                                    className="inline-flex items-center px-3 py-2 text-xs font-semibold text-white bg-red-500 hover:bg-red-600 rounded-md shadow-sm transition"
                                                >
                                                    Delete
                                                </button>
                                            </td>

                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                                            No brand categories found. Create your first brand category to get started.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>


            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the brand category.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleDeleteBrandCategory();
                            }}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {isDeleting ? <Loader2Icon className="mr-2 h-4 w-4 animate-spin" /> : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default LinkProductToBrand;