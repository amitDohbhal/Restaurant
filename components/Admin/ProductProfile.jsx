"use client"
import React, { useState, useEffect } from 'react';
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import toast from 'react-hot-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Copy, Loader2 } from "lucide-react";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";

const ProductProfile = ({ id }) => {
    const [RoomNo, setRoomNo] = useState("");
    const [RoomType, setRoomType] = useState(""); // Will be auto-generated
    const [loading, setLoading] = useState(false);
    const [refreshTable, setRefreshTable] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!RoomNo.trim()) return toast.error('Room Number cannot be empty');
        if (!RoomType.trim()) return toast.error('Room Type cannot be empty');

        setLoading(true);

        try {
            // Always create direct product
            let payload = {
                RoomNo,
                RoomType,
                isDirect: true,
            };

            const res = await fetch('/api/product', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to save product');
            }

            // Reset form and refresh table
            setRoomNo("");
            setRoomType("");
            setRefreshTable(r => !r);
            toast.success('Product saved successfully!');
        } catch (error) {
            console.error('Error saving product:', error);
            toast.error(error.message || 'Failed to save product');
        } finally {
            setLoading(false);
        }
    };

    const [products, setProducts] = useState([]);
    useEffect(() => {
        fetch('/api/product?isDirect=true')
            .then(res => res.json())
            .then(data => setProducts(Array.isArray(data) ? data : []));
    }, [refreshTable]);

    // Modal state for deletion
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const handleDelete = (id) => {
        setDeleteTarget(id);
        setShowDeleteModal(true);
    };

    const cancelDelete = () => {
        setShowDeleteModal(false);
        setDeleteTarget(null);
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/product/${deleteTarget}`, {
                method: 'DELETE'
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to delete product');
            }

            // Update UI state after successful deletion
            setProducts(products => products.filter(p => p._id !== deleteTarget));
            toast.success('Product deleted successfully');

        } catch (error) {
            console.error('Error during product deletion:', error);
            toast.error(error.message || 'Failed to delete product');
        } finally {
            setLoading(false);
            setShowDeleteModal(false);
            setDeleteTarget(null);
        }
    };



    // Copy to clipboard helper
    function copyToClipboard(text) {
        navigator.clipboard.writeText(text);
        toast.success('URL copied!');
    }
    // Toggle product active status for direct products
    const toggleSwitch = async (productId, currentActive, isDirect) => {
        if (!isDirect) {
            toast.error('Only direct products can be toggled.');
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
    return (
        <>
            <form className="flex flex-col items-center justify-center gap-8 my-20 bg-gray-200 w-full max-w-xl md:max-w-3xl mx-auto p-4 rounded-lg" onSubmit={async e => {
                e.preventDefault();
                if (!RoomNo.trim()) return toast.error('Room Number cannot be empty');
                if (!RoomType.trim()) return toast.error('Room Type cannot be empty');

                setLoading(true);

                try {
                    if (editingId) {
                        // Update the product first
                        const res = await fetch(`/api/product/${editingId}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                RoomNo,
                                RoomType,
                            })
                        });

                        if (!res.ok) {
                            const err = await res.json().catch(() => ({}));
                            throw new Error(err.error || 'Failed to update product');
                        }

                        const updated = await res.json();
                        // Update local state
                        setProducts(ps => ps.map(p => p._id === editingId ? { ...updated } : p));
                        setEditingId(null);
                        setRoomNo("");
                        setRoomType("");
                        toast.success('Room Info updated successfully!');
                    } else {
                        // Create mode - use the handleSubmit function we already have
                        await handleSubmit(e);
                    }
                } catch (error) {
                    console.error('Error:', error);
                    toast.error(error.message || 'An error occurred');
                } finally {
                    setLoading(false);
                }
            }}>
                <div className="flex md:flex-row flex-col items-center gap-6 w-full">
                    <div className="flex flex-col gap-2 w-full">
                        <label htmlFor="productCode" className="font-semibold">Room Number</label>
                        <Input name="productCode" type="number" className="w-full border-2 font-bold border-blue-600 focus:border-dashed focus:border-blue-500 focus:outline-none focus-visible:ring-0 bg-white" placeholder="Type Room Number:" value={RoomNo} onChange={e => setRoomNo(e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-2 w-full">
                        <label htmlFor="productTitle" className="font-semibold">Room Type</label>
                        <Input name="productTitle" type="text" className="w-full border-2 font-bold border-blue-600 focus:border-dashed focus:border-blue-500 focus:outline-none focus-visible:ring-0 bg-white" placeholder="Type Room Type:" value={RoomType} onChange={e => setRoomType(e.target.value)} />
                    </div>
                </div>
                {editingId ? (
                    <div className="flex gap-4 mt-4">
                        <Button
                            type="submit"
                            className="bg-green-600 hover:bg-green-500"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                <>
                                    Update
                                </>
                            )}
                        </Button>
                        <Button type="button" className="bg-gray-400" onClick={() => { setEditingId(null); setRoomNo(""); setRoomType(""); }}>Cancel</Button>
                    </div>
                ) : (
                    <div className="flex gap-4 mt-4">
                        <Button
                            type="submit"
                            className="bg-red-600 hover:bg-red-500"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Adding...
                                </>
                            ) : (
                                <>
                                    Add Room Info
                                </>
                            )}
                        </Button>
                    </div>
                )}
            </form>
            {/* Product Table copied inline */}
            <div className="mt-10 max-w-5xl mx-auto w-full flex flex-col items-center">
                <h3 className="text-xl font-semibold mb-4">Room Info</h3>
                <table className="w-full border border-black rounded-lg">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="text-center !text-black w-1/6">Order</th>
                            <th className="py-2 px-4 text-center">Room Number</th>
                            <th className="py-2 px-4 text-center">Room Type</th>
                            <th className="py-2 px-4 text-center">Active</th>
                            <th className="py-2 px-4 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((prod, idx) => (
                            <tr key={prod._id} className="border-t">
                                <td className="py-2 px-4 text-center border border-black">{idx + 1}</td>
                                <td className="py-2 px-4 text-center border border-black">{prod.RoomNo}</td>
                                <td className="py-2 px-4 text-center border border-black">{prod.RoomType}</td>
                                <td className="py-2 px-4 text-center border border-black">
                                    <div className="flex flex-col items-center gap-1">
                                        <Switch
                                            id={`switch-${prod._id}`}
                                            checked={prod.active}
                                            onCheckedChange={() => toggleSwitch(prod._id, prod.active, prod.isDirect)}
                                            className={`rounded-full transition-colors ${prod.active ? "!bg-green-500" : "!bg-red-500"}`}
                                            disabled={!prod.isDirect}
                                        />
                                        <Label htmlFor={`switch-${prod._id}`} className="text-black text-xs">
                                            {prod.active ? "ON" : "OFF"}
                                        </Label>
                                    </div>
                                </td>
                                <td className="py-2 px-4 border border-black">
                                    <div className="flex gap-2 justify-center">
                                        <button
                                            className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-800"
                                            onClick={() => {
                                                setEditingId(prod._id);
                                                setRoomNo(prod.RoomNo);
                                                setRoomType(prod.RoomType);
                                            }}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-800 flex items-center gap-2"
                                            onClick={() => handleDelete(prod._id)}
                                            disabled={deleteTarget === prod._id && loading}
                                        >
                                            Delete
                                            {deleteTarget === prod._id && loading && (
                                                <span className="ml-2 w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"></span>
                                            )}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Delete Product Modal */}
            <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Room Info</DialogTitle>
                    </DialogHeader>
                    <p>Are you sure you want to delete this room info?</p>
                    <DialogFooter>
                        <Button variant="secondary" onClick={cancelDelete}>Cancel</Button>
                        <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

export default ProductProfile;
