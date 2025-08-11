'use client'

import { useForm } from "react-hook-form"
import { Input } from "../ui/input"
import { NumericFormat } from "react-number-format"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Button } from "../ui/button"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"
import { Loader2, Pencil, Trash2, QrCode, Copy } from "lucide-react"
import { Switch } from "../ui/switch"
import { Label } from "../ui/label"
import ProductQrModal from "./ProductQrModal";
import { useRef } from "react";

const Activity = ({ id }) => {
    // ...existing state and hooks...

    // Editing state
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);

    // Scroll ref for form
    const formRef = useRef(null);

    // Handler to fill form for editing
    const handleEditProduct = (activity) => {
        reset({
            title: activity.title || '',
            active: typeof activity.active === 'boolean' ? activity.active : true,
        });
        setActive(typeof activity.active === 'boolean' ? activity.active : true);
        setTitle(activity.title || '');
        setEditId(activity._id);
        setIsEditing(true);
        if (formRef.current) {
            formRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    };

    // Cancel edit handler
    const handleCancelEdit = () => {
        reset({
            title: '',
            active: true,
        });
        setActive(true);
        setTitle('');
        setSlug('');
        setEditId(null);
        setIsEditing(false);
    };


    // QR Modal state
    const [qrModalOpen, setQrModalOpen] = useState(false);
    const [qrModalUrl, setQrModalUrl] = useState("");
    const [qrModalTitle, setQrModalTitle] = useState("");
    // Slugify utility (copied from ProductProfile)
    function slugify(str) {
        return str
          .toString()
          .toLowerCase()
          .trim()
          .replace(/[\s\W-]+/g, '-') // Replace spaces and non-word chars with dash
          .replace(/^-+|-+$/g, '');  // Remove leading/trailing dashes
      }

    // Copy to clipboard helper
    function copyToClipboard(text) {
        navigator.clipboard.writeText(text);
        toast.success('URL copied!');
    }

    // Toggle product active status
    const toggleSwitch = async (productId, currentActive, isDirect) => {
        if (isDirect) {
            toast.error('Only non-direct products can be toggled.');
            return;
        }
        try {
            const response = await fetch('/api/add_activity', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: productId, active: !currentActive }),
            });
            const result = await response.json();
            if (response.ok) {
                setActivities(prev => prev.map(prod => prod._id === productId ? { ...prod, active: !currentActive } : prod));
                toast.success(`Product is now ${!currentActive ? 'active' : 'inactive'}`);
            } else {
                toast.error(result.message || 'Failed to update product status.');
            }
        } catch (error) {
            toast.error('Failed to update product status.');
        }
    }

    const { handleSubmit, register, setValue, reset } = useForm();
    const [isLoading, setIsLoading] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [activities, setActivities] = useState([]);
    const [title, setTitle] = useState("");
    const [slug, setSlug] = useState("");
    const [active, setActive] = useState(true);

    useEffect(() => {
        // Fetch products for this submenu/category or all direct products
        const fetchProducts = async () => {
            try {
                // Always fetch all activities from the new API
                const response = await fetch('/api/add_activity');
                const data = await response.json();
                if (Array.isArray(data)) {
                    setActivities(data);
                } else {
                    setActivities([]);
                }
            } catch (error) {
                setActivities([]);
            }
        };
        fetchProducts();
    }, []);

    const deletePackage = async (id) => {
        setDeletingId(id);
        try {
            const response = await fetch('/api/add_activity', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });
            const result = await response.json();
            if (response.ok) {
                setActivities((prev) => prev.filter((prod) => prod._id !== id));
                toast.success('Activity deleted successfully!');
            } else {
                toast.error(result.message || 'Failed to delete activity.');
            }
        } catch (error) {
            toast.error('Failed to delete activity.');
        } finally {
            setDeletingId(null);
        }
    };

    const onSubmit = async () => {
        setIsLoading(true);
        const slug = slugify(title);
        try {
            const payload = {
                title,
                slug,
                active: typeof active === 'boolean' ? active : true,
            };
            let response, res;
            if (isEditing && editId) {
                response = await fetch('/api/add_activity', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: editId, ...payload })
                });
                res = await response.json();
                if (response.ok) {
                    toast.success("Activity updated successfully!", { style: { borderRadius: "10px", border: "2px solid green" } });
                    setActivities(prev => prev.map(a => a._id === editId ? { ...a, ...payload } : a));
                    handleCancelEdit();
                } else {
                    toast.error(res.error || "Failed to update Activity", { style: { borderRadius: "10px", border: "2px solid red" } });
                }
            } else {
                response = await fetch('/api/add_activity', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                res = await response.json();
                if (response.ok) {
                    toast.success("Page added successfully!", { style: { borderRadius: "10px", border: "2px solid green" } })
                    setActivities(prev => [
                        ...prev,
                        { _id: res._id, title: res.title, active: res.active,slug:res.slug }
                    ]);
                    reset();
                } else {
                    toast.error("Failed to add Activity", { style: { borderRadius: "10px", border: "2px solid red" } })
                }
            }
        } catch (error) {
            toast.error("Something went wrong", { style: { borderRadius: "10px", border: "2px solid red" } })
        } finally {
            setIsLoading(false);
        }
    };
    return (
        <>
            <form className="flex items-center justify-center gap-8 my-20 bg-blue-100 w-[40%] max-w-xl md:max-w-7xl mx-auto p-4 rounded-lg" onSubmit={handleSubmit(onSubmit)}>
                <div className="flex md:flex-row flex-col items-center justify-center md:items-end gap-6 w-full">

                    <div className="flex flex-col gap-2 ">
                        <label htmlFor="productTitle" className="font-semibold">Activity Page Title</label>
                        <Input name="productTitle" placeholder="Enter Page Title.." className="w-full border-2 font-bold border-blue-600 " value={title} onChange={e => setTitle(e.target.value)} />
                    </div>

                    <Button type="submit" className="bg-blue-600 hover:bg-blue-500">Add Activity</Button>
                </div>
            </form>

            <div className="bg-blue-100 p-4 rounded-lg shadow max-w-5xl mx-auto w-full overflow-x-auto lg:overflow-visible text-center">
                <Table className="w-full min-w-max lg:min-w-0">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-center !text-black w-1/6">S.No</TableHead>
                            <TableHead className="text-center !text-black w-1/4">Activity Page Title</TableHead>
                            <TableHead className="text-center !text-black w-1/6">URL</TableHead>
                            {/* <TableHead className="text-center !text-black w-1/6">QR</TableHead> */}
                            <TableHead className="w-1/6 !text-black text-center">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {activities && activities.length > 0 ? (
                            activities.map((activity, index) => {
                                const url = typeof window !== 'undefined' ? `${window.location.origin}/${activity.slug}` : '';
                                return (
                                    <TableRow key={activity._id}>
                                        <TableCell className="border font-semibold border-blue-600">{index + 1}</TableCell>
                                        <TableCell className="border font-semibold border-blue-600">{activity.title}</TableCell>
                                        <TableCell className="border font-semibold border-blue-600">
                                            <div className="flex items-center justify-center gap-2">
                                                {/* Copy URL Button */}
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => copyToClipboard(url)}
                                                    disabled={!url}
                                                    title="Copy Activity URL"
                                                >
                                                    <Copy className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                        {/* <TableCell className="border font-semibold border-blue-600">
                                            <div className="flex items-center justify-center gap-2">
                                            
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => {
                                                        setQrModalUrl(url);
                                                        setQrModalTitle(prod.title);
                                                        setQrModalOpen(true);
                                                    }}
                                                    title="View QR & Download"
                                                >
                                                    <QrCode className="w-6 h-6" />
                                                </Button>
                                            </div>
                                        </TableCell> */}
                                        <TableCell className="border font-semibold border-blue-600">
                                            <div className="flex items-center justify-center gap-6">
                                                <Button size="icon" variant="outline" asChild>
                                                    <Link href={`/admin/edit_activity/${activity._id}`}>
                                                        Edit
                                                    </Link>
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="outline"
                                                    onClick={() => handleEditProduct(activity)}
                                                    title="Edit"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    disabled={deletingId === activity._id}
                                                    onClick={() => deletePackage(activity._id)}
                                                    variant="destructive"
                                                >
                                                    {deletingId === activity._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                                </Button>
                                                <div className="flex items-center gap-2">
                                                    <Switch
                                                        id={`switch-${activity._id}`}
                                                        checked={activity.active}
                                                        onCheckedChange={() => toggleSwitch(activity._id, activity.active, activity.isDirect)}
                                                        className={`rounded-full transition-colors ${activity.active ? "!bg-green-500" : "!bg-red-500"}`}
                                                        disabled={activity.isDirect}
                                                    />
                                                    <Label htmlFor={`switch-${activity._id}`} className="text-black">
                                                        {activity.active ? "ON" : "OFF"}
                                                    </Label>
                                                </div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        ) : (
                            <TableRow>
                                <TableCell colSpan="6" className="text-center border font-semibold border-blue-600">
                                    No activities page available.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            {/* QR Modal for viewing/downloading QR code */}
            <ProductQrModal
                open={qrModalOpen}
                onOpenChange={setQrModalOpen}
                qrUrl={qrModalUrl}
                productTitle={qrModalTitle}
            />
        </>
    )

}
export default Activity
