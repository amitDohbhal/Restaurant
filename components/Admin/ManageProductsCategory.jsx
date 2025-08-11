'use client'

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Pencil, Plus, Trash2, X } from "lucide-react"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import toast from "react-hot-toast"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog"
import Link from "next/link"
import Image from "next/image"
import { deleteFileFromCloudinary } from "@/utils/Utapi"
import { useRef } from "react"
import ProductProfile from './ProductProfile';
const ManageProductsCategory = () => {
    const { handleSubmit, register, setValue, reset } = useForm()
    const [menuItems, setMenuItems] = useState([])
    const [selectedMenu, setSelectedMenu] = useState("")
    const [editItem, setEditItem] = useState(null)
    const [bannerImage, setBannerImage] = useState(null)
    // const [profileImage, setProfileImage] = useState(null)
    // Separate state for edit dialog
    const [editBannerImage, setEditBannerImage] = useState(null);
    const [editProfileImage, setEditProfileImage] = useState(null);
    const [showProductProfile, setShowProductProfile] = useState(false);
    const [profileProps, setProfileProps] = useState({});
    // console.log(bannerImage)
    // Gallery state for product images
    // const [galleryImages, setGalleryImages] = useState([])
    // const [loadedGalleryImages, setLoadedGalleryImages] = useState([])
    // const [galleryUploading, setGalleryUploading] = useState(false)
    // const galleryFileInputRef = useRef(null);
    const [profileImage, setProfileImage] = useState(null);
    const profileFileInputRef = useRef();
    const handleRemoveImage = async (key, type) => {
        // Remove from UI immediately
        if (type === 'banner') {
            setBannerImage(null);
        } else if (type === 'profile') {
            setProfileImage(null);
        } else if (type === 'editBanner') {
            setEditBannerImage(null);
        } else if (type === 'editProfile') {
            setEditProfileImage(null);
        }
        if (!key) return;
        toast.loading('Deleting image from Cloudinary...', { id: 'cloud-delete' });
        try {
            const res = await fetch('/api/cloudinary', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ publicId: key }),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success('Image deleted from Cloudinary!', { id: 'cloud-delete' });
            } else {
                toast.error('Cloudinary error: ' + (data.error || 'Failed to delete image from Cloudinary'), { id: 'cloud-delete' });
            }
        } catch (err) {
            toast.error('Failed to delete image from Cloudinary (network or server error)', { id: 'cloud-delete' });
        }
    };
    const bannerFileInputRef = useRef(null);
    const profileImageFileInputRef = useRef(null);
    // const profileFileInputRef = useRef(null);
    // console.log(menuItems)
    useEffect(() => {
        fetch("/api/getAllMenuItems")
            .then(res => res.json())
            .then(data => setMenuItems(data))
        // console.log(menuItems)
    }, [])


    const onSubmit = async (data) => {
        // Attach gallery images to submenu data
        // data.gallery = galleryImages;

        if (!selectedMenu) {
            toast.error("Please select a Menu Type", { style: { borderRadius: "10px", border: "2px solid red" } })
            return
        }

        if (!data.subMenu.title) {
            toast.error("Sub Menu Title is required", {
                style: {
                    borderRadius: "10px",
                    border: "2px solid red",
                }
            })
            return
        }

        const url = data.subMenu.title ? data.subMenu.title.replace(/\s+/g, '_').toLowerCase() : ""

        data.id = menuItems.filter(item => item.title === selectedMenu)[0]._id
        data.subMenu = {
            title: data.subMenu.title,
            url: url,
            profileImage: profileImage,
            active: true,
            order: (menuItems.find(item => item.title === selectedMenu)?.subMenu.length || 0) + 1,
            banner: bannerImage,
            // gallery: galleryImages
        }

        try {
            const result = await fetch("/api/admin/website-manage/addSubMenu", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            })

            const res = await result.json()

            if (!result.ok) {
                toast.error(`Failed To Add Sub Menu: ${res.message}`, { style: { borderRadius: "10px", border: "2px solid red" } })
            } else {
                setMenuItems([...menuItems, data])
                reset()
                setSelectedMenu("")
                setBannerImage(null)
                setProfileImage(null)
                toast.success("Sub Menu added successfully!", { style: { borderRadius: "10px", border: "2px solid green" } })
                window.location.reload()
            }
        } catch (error) {
            toast.error("Something went wrong", {
                style: {
                    borderRadius: "10px",
                    border: "2px solid red",
                },
            })
        }
    }

    const handleUpdate = async (data) => {
        try {
            const response = await fetch(`/api/admin/website-manage/addSubMenu`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: data.id,
                    subMenuId: editItem._id,
                    subMenu: { title: data.subMenu.title, order: data.subMenu.order, banner: editBannerImage, profileImage: editProfileImage }
                }),
            })

            const res = await response.json()

            if (response.ok) {
                toast.success("Submenu updated successfully!", { style: { borderRadius: "10px", border: "2px solid green" } })
                setEditItem(null)
                setBannerImage(null)
                window.location.reload()
            } else {
                toast.error(`Failed to update submenu: ${res.message}`, { style: { borderRadius: "10px", border: "2px solid red" } })
            }
        } catch (error) {
            toast.error("Error updating submenu", { style: { borderRadius: "10px", border: "2px solid red" } })
        }
    }

    const toggleSwitch = async (subMenuId, currentStatus) => {
        const id = menuItems.find(item => item.subMenu.some(sub => sub._id === subMenuId))?._id
        try {
            const response = await fetch(`/api/admin/website-manage/addSubMenu`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, subMenuId, active: !currentStatus }),
            })

            if (response.ok) {
                setMenuItems(menuItems.map(menu =>
                    menu._id === id
                        ? {
                            ...menu,
                            subMenu: menu.subMenu.map(sub =>
                                sub._id === subMenuId ? { ...sub, active: !sub.active } : sub
                            )
                        }
                        : menu
                ))
            } else {
                toast.error("Failed to update submenu status", { style: { borderRadius: "10px", border: "2px solid red" } })
            }
        } catch (error) {
            console.error("Error updating submenu status:", error)
        }
    }

    const handleEdit = (item) => {
        setEditItem(item);
        setValue("subMenu.title", item.title);
        setValue("subMenu.order", item.order);
        // Defensive: only set image if it is an object with a non-empty url string
        if (item.banner && typeof item.banner === 'object' && typeof item.banner.url === 'string' && item.banner.url.trim() !== '') {
            setEditBannerImage(item.banner);
        } else {
            setEditBannerImage(null);
        }
        if (item.profileImage && typeof item.profileImage === 'object' && typeof item.profileImage.url === 'string' && item.profileImage.url.trim() !== '') {
            setEditProfileImage(item.profileImage);
        } else {
            setEditProfileImage(null);
        }
    };

    const deleteMenuItem = async (subMenuId) => {
        if (!menuItems || !Array.isArray(menuItems)) {
            toast.error("Menu items not loaded");
            return;
        }
        const menuItem = menuItems.find(item => Array.isArray(item.subMenu) && item.subMenu.some(sub => sub._id === subMenuId));
        if (!menuItem) {
            toast.error("Menu item not found");
            return;
        }
        const id = menuItem._id
        try {
            const response = await fetch(`/api/admin/website-manage/addSubMenu`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, subMenuId }),
            })

            const res = await response.json()

            if (response.ok) {
                setMenuItems(menuItems.map(menu =>
                    menu._id === id
                        ? { ...menu, subMenu: menu.subMenu.filter(sub => sub._id !== subMenuId) }
                        : menu
                ))
                toast.success("Submenu deleted successfully!", { style: { borderRadius: "10px", border: "2px solid green" } })
            } else {
                toast.error(res.message, { style: { borderRadius: "10px", border: "2px solid red" } })
            }
        } catch (error) {
            console.error("Error deleting submenu:", error)
        }
    }


    return (
        <>
            <form onSubmit={handleSubmit(onSubmit)} className="font-barlow flex flex-col items-center justify-center gap-4 my-8 md:my-20 px-4">
                <div className="flex flex-col justify-center gap-6">
                    <div className="flex flex-col gap-2">
                        <Label>Select Menu Type</Label>
                        <Select onValueChange={setSelectedMenu}>
                            <SelectTrigger className="border-2 border-blue-600 focus:border-blue-500 focus:ring-0 focus:outline-none focus-visible:outline-none focus-visible:ring-0">
                                <SelectValue placeholder="Select Menu" />
                            </SelectTrigger>
                            <SelectContent className="border-2 font-barlow border-blue-600" >
                                <SelectGroup>
                                    <SelectLabel>Menu</SelectLabel>
                                    {menuItems.map((item) => (
                                        <SelectItem className="focus:bg-blue-100" key={item._id} value={item.title} {...register("title")}>
                                            {item.title}
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="subMenu.title">Create Sub Menu</Label>
                        <Input
                            name="subMenu.title"
                            id="subMenu.title"
                            placeholder="Enter Sub Menu Title"
                            className="md:w-96 border-2 border-blue-600 focus:border-dashed focus:border-blue-500 focus:outline-none focus-visible:ring-0"
                            {...register("subMenu.title")}
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label>Upload Category Profile Image</Label>
                        {profileImage && (
                            <div className="relative">
                                <Image className="w-32 h-32 object-cover rounded-full" src={profileImage?.url} quality={50} alt="Profile" width={128} height={128} />
                                <button type="button" className="absolute top-2 right-2 bg-red-500 text-white rounded-full" onClick={() => handleRemoveImage(profileImage?.key, "profile")}><X className="w-6 h-6" /></button>
                            </div>
                        )}
                        <input
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            ref={profileFileInputRef}
                            onChange={async (event) => {
                                const file = event.target.files[0];
                                if (!file) return;
                                try {
                                    const formData = new FormData();
                                    formData.append('file', file);
                                    const res = await fetch('/api/cloudinary', {
                                        method: 'POST',
                                        body: formData
                                    });
                                    if (!res.ok) throw new Error('Profile upload failed');
                                    const result = await res.json();
                                    setProfileImage({ url: result.url, key: result.key });
                                    toast.success('Profile image uploaded successfully!');
                                } catch (err) {
                                    toast.error('Failed to upload profile image');
                                } finally {
                                    if (profileFileInputRef.current) profileFileInputRef.current.value = '';
                                }
                            }}
                            disabled={!selectedMenu || !!profileImage}
                        />
                        <button
                            type="button"
                            className="bg-blue-600 text-white px-4 py-2 rounded mt-2"
                            onClick={() => profileFileInputRef.current && profileFileInputRef.current.click()}
                            disabled={!selectedMenu || !!profileImage}
                        >
                            Upload Profile Image
                        </button>
                    </div>

                    <div className="flex flex-col gap-2">
                        <Label>Upload Banner</Label>
                        {bannerImage && (
                            <div className="relative">
                                <Image className="w-full object-cover rounded-lg" src={bannerImage?.url} quality={50} alt="Banner" width={600} height={400} />
                                <button type="button" className="absolute top-2 right-2 bg-red-500 text-white rounded-full" onClick={() => handleRemoveImage(bannerImage?.key, "banner")}><X className="w-6 h-6" /></button>
                            </div>
                        )}
                        <input
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            ref={bannerFileInputRef}
                            onChange={async (event) => {
                                const file = event.target.files[0];
                                if (!file) return;
                                try {
                                    const formData = new FormData();
                                    formData.append('file', file);
                                    const res = await fetch('/api/cloudinary', {
                                        method: 'POST',
                                        body: formData
                                    });
                                    if (!res.ok) throw new Error('Banner upload failed');
                                    const result = await res.json();
                                    setBannerImage({ url: result.url, key: result.key });
                                    toast.success('Banner uploaded successfully!');
                                } catch (err) {
                                    toast.error('Failed to upload banner');
                                } finally {
                                    if (bannerFileInputRef.current) bannerFileInputRef.current.value = '';
                                }
                            }}
                            disabled={!selectedMenu || !!bannerImage}
                        />
                        <button
                            type="button"
                            className="bg-blue-600 text-white px-4 py-2 rounded mt-2"
                            onClick={() => bannerFileInputRef.current && bannerFileInputRef.current.click()}
                            disabled={!selectedMenu || !!bannerImage}
                        >
                            Upload Banner Image
                        </button>
                    </div>
                </div>
                <button className="bg-blue-600 p-2 rounded-lg hover:bg-blue-500 text-lg text-white" type="submit">
                    Add SubMenu
                </button>
            </form>

            <div className="bg-blue-100 p-4 rounded-lg shadow max-w-5xl mx-auto w-full overflow-x-auto lg:overflow-visible text-center px-4">
                <div className="min-w-[200px] md:min-w-0">
                    <Table className="w-full">
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-center !text-black w-1/3">Add Product</TableHead>
                                <TableHead className="text-center !text-black w-1/3">Sub Menu Title</TableHead>
                                <TableHead className="text-center !text-black w-1/3">Order</TableHead>
                                <TableHead className="w-1/3 !text-black text-center">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {selectedMenu ? (
                                menuItems.some(item => item.title === selectedMenu && item.subMenu.length !== 0) ? (
                                    menuItems
                                        .filter(item => item.title === selectedMenu)
                                        .flatMap(menuItem => menuItem.subMenu.sort((a, b) => a.order - b.order).map((subItem) => (
                                            <TableRow key={subItem._id}>
                                                <TableCell className="border font-semibold border-blue-600">
                                                    <Link href={`/admin/manage_products_category/addSubMenuPackage/${subItem._id}`} variant="outline" className="bg-white border-2 border-blue-500 p-2 rounded-full text-blue-600 hover:text-blue-500 focus:text-blue-500 flex items-center justify-center">
                                                        <span className="xl:mr-6 mr-2 bg-blue-100 rounded py-1 px-3">{subItem?.products?.length !== 0 ? subItem?.products?.length : 0}</span>
                                                        <Plus className="w-4 h-4" />
                                                        <span>Add Product</span>
                                                    </Link>
                                                </TableCell>
                                                <TableCell className="border font-semibold border-blue-600">{subItem?.title}</TableCell>
                                                <TableCell className="border font-semibold border-blue-600">{subItem?.order}</TableCell>
                                                <TableCell className="border font-semibold border-blue-600">
                                                    <div className="flex items-center justify-center gap-6">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleEdit(subItem)}
                                                            className="bg-blue-600 hover:bg-blue-500 p-2 rounded-full text-white"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => deleteMenuItem(subItem._id)}
                                                            className="bg-red-500 hover:bg-red-600 p-2 rounded-full text-white"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                        <div className="flex items-center gap-2">
                                                            <Switch
                                                                id={`switch-${subItem._id}`}
                                                                checked={subItem.active}
                                                                onCheckedChange={() => toggleSwitch(subItem._id, subItem.active)}
                                                                className={`rounded-full transition-colors ${subItem.active ? "!bg-green-500" : "!bg-red-500"}`}
                                                            />
                                                            <Label htmlFor={`switch-${subItem._id}`} className="text-black">
                                                                {subItem.active ? "ON" : "OFF"}
                                                            </Label>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="border font-semibold border-blue-600 text-center">
                                            No Sub Menu Available
                                        </TableCell>
                                    </TableRow>
                                )
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="border font-semibold border-blue-600 text-center">
                                        No Menu Selected
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
                {editItem && (
                    <Dialog open={!!editItem} onOpenChange={() => { setEditItem(null) }}>
                        <DialogContent className="font-barlow">
                            <DialogHeader>
                                <DialogTitle>Edit Menu Item</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit(handleUpdate)}>
                                <div className="flex flex-col gap-2">
                                    <Label>Title</Label>
                                    <Input  {...register("subMenu.title")} />
                                </div>
                                <div className="flex flex-col gap-2 mt-4">
                                    <Label>Order</Label>
                                    <Input  {...register("subMenu.order")} min={0} max={menuItems.find(item => item.title === selectedMenu)?.subMenu.length + 1} type="number" />
                                </div>
                                <div className="flex flex-col gap-2 mt-4">
                                    <Label>Upload Banner</Label>
                                    {bannerImage && !editItem && (
                                        <div className="relative h-32">
                                            <Image className="w-full h-full w-full object-contain object-center rounded-lg" src={bannerImage?.url} quality={50} alt="Banner" width={400} height={192} />
                                            <button type="button" className="absolute top-2 right-2 bg-red-500 text-white rounded-full" onClick={() => handleRemoveImage(bannerImage?.key, "banner")}><X className="w-6 h-6" /></button>
                                        </div>
                                    )}
                                    {/* Edit dialog banner image */}
                                    {editBannerImage && editItem && typeof editBannerImage.url === 'string' && editBannerImage.url.trim() !== '' ? (
                                        <div className="relative h-32">
                                            <Image className="w-full h-full w-full object-contain object-center rounded-lg" src={editBannerImage.url} quality={50} alt="Banner" width={400} height={192} />
                                            <button type="button" className="absolute top-2 right-2 bg-red-500 text-white rounded-full" onClick={() => handleRemoveImage(editBannerImage.key, "editBanner")}><X className="w-6 h-6" /></button>
                                        </div>
                                    ) : null}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                        ref={bannerFileInputRef}
                                        onChange={async (event) => {
                                            const file = event.target.files[0];
                                            if (!file) return;
                                            try {
                                                const formData = new FormData();
                                                formData.append('file', file);
                                                const res = await fetch('/api/cloudinary', {
                                                    method: 'POST',
                                                    body: formData
                                                });
                                                if (!res.ok) throw new Error('Banner upload failed');
                                                const result = await res.json();
                                                if (editItem) {
                                                    setEditBannerImage({ url: result.url, key: result.key });
                                                } else {
                                                    setBannerImage({ url: result.url, key: result.key });
                                                }
                                                toast.success('Banner uploaded successfully!');
                                            } catch (err) {
                                                toast.error('Failed to upload banner');
                                            } finally {
                                                if (bannerFileInputRef.current) bannerFileInputRef.current.value = '';
                                            }
                                        }}
                                        disabled={editItem ? !!editBannerImage : !!bannerImage}
                                    />
                                    <button
                                        type="button"
                                        className="bg-blue-600 text-white px-4 py-2 rounded mt-2"
                                        onClick={() => bannerFileInputRef.current && bannerFileInputRef.current.click()}
                                        disabled={!!bannerImage}
                                    >
                                        Upload Banner Image
                                    </button>
                                </div>
                                <div className="flex flex-col gap-2 mt-4">
                                    <Label>Upload Profile Image</Label>
                                    {profileImage && !editItem && (
                                        <div className="relative h-32">
                                            <Image className="w-full h-full w-full object-contain object-center rounded-lg" src={profileImage?.url} quality={50} alt="Profile" width={400} height={192} />
                                            <button type="button" className="absolute top-2 right-2 bg-red-500 text-white rounded-full" onClick={() => handleRemoveImage(profileImage?.key, "profile")}><X className="w-6 h-6" /></button>
                                        </div>
                                    )}
                                    {/* Edit dialog profile image */}
                                    {editProfileImage && editItem && typeof editProfileImage.url === 'string' && editProfileImage.url.trim() !== '' ? (
                                        <div className="relative h-32">
                                            <Image className="w-full h-full w-full object-contain object-center rounded-lg" src={editProfileImage.url} quality={50} alt="Profile" width={400} height={192} />
                                            <button type="button" className="absolute top-2 right-2 bg-red-500 text-white rounded-full" onClick={() => handleRemoveImage(editProfileImage.key, "editProfile")}><X className="w-6 h-6" /></button>
                                        </div>
                                    ) : null}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                        ref={profileImageFileInputRef}
                                        onChange={async (event) => {
                                            const file = event.target.files[0];
                                            if (!file) return;
                                            try {
                                                const formData = new FormData();
                                                formData.append('file', file);
                                                const res = await fetch('/api/cloudinary', {
                                                    method: 'POST',
                                                    body: formData
                                                });
                                                if (!res.ok) throw new Error('Profile image upload failed');
                                                const result = await res.json();
                                                if (editItem) {
                                                    setEditProfileImage({ url: result.url, key: result.key });
                                                } else {
                                                    setProfileImage({ url: result.url, key: result.key });
                                                }
                                                toast.success('Profile Image uploaded successfully!');
                                            } catch (err) {
                                                toast.error('Failed to upload profile image');
                                            } finally {
                                                if (profileImageFileInputRef.current) profileImageFileInputRef.current.value = '';
                                            }
                                        }}
                                        disabled={editItem ? !!editProfileImage : !!profileImage}
                                    />
                                    <button
                                        type="button"
                                        className="bg-blue-600 text-white px-4 py-2 rounded mt-2"
                                        onClick={() => profileImageFileInputRef.current && profileImageFileInputRef.current.click()}
                                        disabled={editItem ? !!editProfileImage : !!profileImage}
                                    >
                                        Upload Profile Image
                                    </button>
                                </div>
                                <DialogFooter>
                                    <button className="bg-blue-600 rounded px-4 py-2 text-white font-semibold hover:bg-blue-500 mt-4" type="submit">Save Changes</button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                )}
            </div>
        </>
    )
}

export default ManageProductsCategory