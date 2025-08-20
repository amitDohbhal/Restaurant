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
import { Loader2, Pencil, Trash2, QrCode, Copy, AlertCircle } from "lucide-react"
import { Switch } from "../ui/switch"
import { Label } from "../ui/label"
import ProductQrModal from "./ProductQrModal";
import { useRef } from "react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "../ui/alert-dialog"

const AddProduct = ({ id }) => {
    // Editing state
    const [isEditing, setIsEditing] = useState(false);
    const formRef = useRef(null);

    // Handler to fill form for editing
    const handleEditProduct = (prod) => {
        reset({
            RoomNo: prod.RoomNo || '',
            RoomType: prod.RoomType || '',
            order: prod.order || 1,
            active: typeof prod.active === 'boolean' ? prod.active : true,
        });
        setActive(typeof prod.active === 'boolean' ? prod.active : true);
        setOrder(prod.order || 1);
        setRoomNo(prod.RoomNo || '');
        setRoomType(prod.RoomType || '');
        setEditingId(prod._id); // Set the editing ID
        setIsEditing(true);
        if (formRef.current) {
            formRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    };

    // Cancel edit handler
    const handleCancelEdit = () => {
        reset({
            RoomNo: '',
            RoomType: '',
            order: 1,
            active: true,
        });
        setActive(true);
        setOrder(1);
        setRoomNo('');
        setRoomType('');
        setIsEditing(false);
        setEditingId(null);
    };
    // Toggle product active status
    const toggleSwitch = async (productId, currentActive, isDirect) => {
        if (isDirect) {
            toast.error('Only non-direct products can be toggled.');
            return;
        }
        try {
            const response = await fetch('/api/admin/website-manage/addPackage', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pkgId: productId, active: !currentActive }),
            });
            const result = await response.json();
            if (response.ok) {
                setProducts(prev => prev.map(prod => prod._id === productId ? { ...prod, active: !currentActive } : prod));
                toast.success(`Product is now ${!currentActive ? 'active' : 'inactive'}`);
            } else {
                toast.error(result.message || 'Failed to update product status.');
            }
        } catch (error) {
            toast.error('Failed to update product status.');
        }
    }

    const { handleSubmit, register, setValue, reset } = useForm();
    const subMenuId = id;
    const [isLoading, setIsLoading] = useState(false);
    const [products, setProducts] = useState([]);
    const [RoomNo, setRoomNo] = useState("");
    const [RoomType, setRoomType] = useState("");
    const [order, setOrder] = useState(1);
    const [active, setActive] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        // Fetch products for this submenu/category or all direct products
        const fetchProducts = async () => {
            try {
                let url = '';
                if (subMenuId) {
                    url = `/api/getSubMenuById/${subMenuId}`;
                }
                const response = await fetch(url);
                const data = await response.json();
                if (subMenuId && Array.isArray(data.products)) {
                    setProducts(data.products);
                } else if (!subMenuId && Array.isArray(data)) {
                    setProducts(data);
                } else {
                    setProducts([]);
                }
            } catch (error) {
                setProducts([]);
            }
        };
        fetchProducts();
    }, [subMenuId]);

    const deletePackage = async (id) => {
        setIsDeleting(true);
        try {
            const response = await fetch('/api/admin/website-manage/addPackage', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });

            const result = await response.json();
            if (response.ok) {
                setProducts((prev) => prev.filter((prod) => prod._id !== id));
                toast.success('Product deleted successfully!');
            } else {
                throw new Error(result.message || 'Failed to delete product');
            }
        } catch (error) {
            toast.error('Failed to delete product.');
        } finally {
            setIsDeleting(false);
            setDeleteDialogOpen(false);
            setProductToDelete(null);
        }
    };

    const confirmDelete = (productId) => {
        setProductToDelete(productId);
        setDeleteDialogOpen(true);
    };

    const onSubmit = async () => {
        if (!RoomNo) {
            toast.error("Room Number is required");
            return;
        }
        if (!RoomType) {
            toast.error("Room Type is required");
            return;
        }
        setIsLoading(true);

        try {
            const payload = {
                RoomNo,
                RoomType,
                order,
                active: typeof active === 'boolean' ? active : true,
                isDirect: !subMenuId,
                ...(subMenuId ? { subMenuId, category: subMenuId } : {})
            };

            let response;
            if (isEditing) {
                response = await fetch('/api/admin/website-manage/addPackage', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ _id: editingId, ...payload })
                });
            } else {
                response = await fetch('/api/admin/website-manage/addPackage', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            }

            const result = await response.json();

            if (response.ok) {
                // Get the product ID from the correct location in the response
                const productId = result.product?._id || result._id || editingId;

                if (!productId) {
                    throw new Error('Failed to get product ID from response');
                }
                toast.success(isEditing ? 'Product updated successfully!' : 'Product added successfully!');
                reset({
                    RoomNo:'',
                    RoomType:'',
                    order: 1,
                    active: true,
                });
                setRoomNo('');
                setRoomType('');
                setOrder(1);
                setActive(true);
                setIsEditing(false);
                setEditingId(null);

                // Refetch products
                if (subMenuId) {
                    const res = await fetch(`/api/getSubMenuById/${subMenuId}`);
                    const data = await res.json();
                    if (data.products) {
                        setProducts(data.products);
                    }
                } else {
                    const res = await fetch('/api/admin/website-manage/getPackages');
                    const data = await res.json();
                    setProducts(data);
                }
            } else {
                toast.error(result.message || 'Failed to save product');
            }
        } catch (error) {
            toast.error('Failed to save product');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <form className="flex flex-col items-center justify-center gap-8 my-20 bg-gray-200 w-full max-w-2xl mx-auto p-4 rounded-lg" onSubmit={handleSubmit(onSubmit)}>
                <div className="flex md:flex-row flex-col items-center md:items-end gap-6 w-full">
                    <div className="flex flex-col gap-2 w-full">
                        <label htmlFor="code" className="font-semibold">Room Number</label>
                        <Input name="code" type="number" placeholder="Enter Room Number Here" className="w-full border-2 border-blue-600 font-bold bg-white" value={RoomNo} onChange={e => setRoomNo(e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-2 w-full">
                        <label htmlFor="productTitle" className="font-semibold">Room Type</label>
                        <Input name="productTitle" placeholder="Enter Room Type Here" className="w-full border-2 font-bold border-blue-600 bg-white" value={RoomType} onChange={e => setRoomType(e.target.value)} />
                    </div>
                </div>
                <div className="flex gap-4">
                    <Button
                        type="submit"
                        className="bg-red-600 hover:bg-red-500"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {isEditing ? 'Updating...' : 'Adding...'}
                            </>
                        ) : isEditing ? 'Update Room Info' : 'Add Room Info'}
                    </Button>
                    {isEditing && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleCancelEdit}
                            className="bg-white text-red-600 border-red-600 hover:bg-red-50"
                        >
                            Cancel Edit
                        </Button>
                    )}
                </div>
            </form>

            <div className="bg-blue-100 p-4 rounded-lg shadow max-w-5xl mx-auto w-full overflow-x-auto lg:overflow-visible text-center">
                <Table className="w-full min-w-max lg:min-w-0">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-center !text-black w-1/6">Order</TableHead>
                            <TableHead className="text-center !text-black w-1/4">Room Number</TableHead>
                            <TableHead className="text-center !text-black w-1/4">Room Type</TableHead>
                            <TableHead className="w-1/6 !text-black text-center">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {products && products.length > 0 ? (
                            products.map((prod, index) => {
                                return (
                                    <TableRow key={prod._id}>
                                        <TableCell className="border font-semibold border-blue-600">{index + 1}</TableCell>
                                        <TableCell className="border font-semibold border-blue-600">{prod.RoomNo}</TableCell>
                                        <TableCell className="border font-semibold border-blue-600">{prod.RoomType}</TableCell>
                                        <TableCell className="border font-semibold border-blue-600">
                                            <div className="flex items-center justify-center gap-6">
                                                <Button
                                                    size="icon"
                                                    variant="outline"
                                                    onClick={() => handleEditProduct(prod)}
                                                    title="Edit"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="destructive"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        confirmDelete(prod._id);
                                                    }}
                                                    disabled={isLoading}
                                                    title="Delete Room Info"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                                <div className="flex items-center gap-2">
                                                    <Switch
                                                        id={`switch-${prod._id}`}
                                                        checked={prod.active}
                                                        onCheckedChange={() => toggleSwitch(prod._id, prod.active, prod.isDirect)}
                                                        className={`rounded-full transition-colors ${prod.active ? "!bg-green-500" : "!bg-red-500"}`}
                                                        disabled={prod.isDirect}
                                                    />
                                                    <Label htmlFor={`switch-${prod._id}`} className="text-black">
                                                        {prod.active ? "ON" : "OFF"}
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
                                    No room info available.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <div className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-destructive" />
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        </div>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the room info and remove all its data.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => productToDelete && deletePackage(productToDelete)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )

}
export default AddProduct
