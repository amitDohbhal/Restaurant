"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Image from "next/image";
import toast from "react-hot-toast";

import { PencilIcon, Trash2Icon, Plus } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useRef } from "react";
import { UploadIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const StockCategory = () => {
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [bannerToDelete, setBannerToDelete] = useState(null);
    const [banners, setBanners] = useState([]);
    const [editBanner, setEditBanner] = useState(null);
    // Form state

    const [formData, setFormData] = useState({
        categoryName: "",
        stockType: "",
        quantityType: "",
        order: 1,
    });

    // Modal state for adding new stock types
    const [showStockTypeModal, setShowStockTypeModal] = useState(false);
    const [stockTypes, setStockTypes] = useState([]);
    const [newStockType, setNewStockType] = useState("");

    // Modal state for adding new quantity types
    const [showQuantityTypeModal, setShowQuantityTypeModal] = useState(false);
    const [quantityTypes, setQuantityTypes] = useState([]);
    const [newQuantityType, setNewQuantityType] = useState("");

    // Fetch food categories and stock types
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await fetch("/api/stockCategory");
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

        const fetchStockTypes = async () => {
            try {
                // Initialize with some default stock types
                setStockTypes(['Raw Materials', 'Finished Goods', 'Work in Progress', 'Consumables']);
            } catch (error) {
                toast.error("Failed to fetch stock types");
            }
        };

        const fetchQuantityTypes = async () => {
            try {
                const response = await fetch("/api/stockQuantityType");
                const data = await response.json();
                setQuantityTypes(data);
            } catch (error) {
                toast.error("Failed to fetch quantity types");
            }
        };

        fetchCategories();
        fetchStockTypes();
        fetchQuantityTypes();
    }, []);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const method = editBanner ? "PATCH" : "POST";
            const payload = {
                ...formData,
                id: editBanner,
            };
            const response = await fetch("/api/stockCategory", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success(`Category ${editBanner ? "updated" : "added"} successfully`);
                setEditBanner(null);

                // Refresh category list
                const updatedCategories = await fetch("/api/stockCategory").then((res) => res.json());
                setBanners(updatedCategories);

                // Reset form
                setFormData({
                    categoryName: "",
                    stockType: "",
                    quantityType: "",
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
            stockType: category.stockType || "",
            quantityType: category.quantityType || "",
            order: category.order,
        });
    };

    const handleDelete = async (id) => {
        try {
            const response = await fetch("/api/stockCategory", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success("Category deleted successfully");

                setBanners((prev) => prev.filter((c) => c._id !== id));

                // Update order numbers
                const updatedCategories = await fetch("/api/stockCategory").then((res) => res.json());
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

    // Handle adding new stock type
    const handleAddStockType = () => {
        if (newStockType.trim() && !stockTypes.includes(newStockType.trim())) {
            setStockTypes([...stockTypes, newStockType.trim()]);
            setNewStockType("");
            setShowStockTypeModal(false);
            toast.success("Stock type added successfully");
        } else if (stockTypes.includes(newStockType.trim())) {
            toast.error("Stock type already exists");
        } else {
            toast.error("Please enter a valid stock type");
        }
    };

    // Handle adding new quantity type
    const handleAddQuantityType = async () => {
        if (!newQuantityType.trim()) {
            toast.error("Please enter a valid quantity type");
            return;
        }

        try {
            const response = await fetch("/api/stockQuantityType", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newQuantityType.trim() }),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success("Quantity type added successfully");
                setQuantityTypes([...quantityTypes, data]);
                setNewQuantityType("");
                setShowQuantityTypeModal(false);
            } else {
                toast.error(data.error || "Failed to add quantity type");
            }
        } catch (error) {
            toast.error("Something went wrong");
        }
    };

    return (
        <div className="mx-auto py-10 w-full">
            <form onSubmit={handleSubmit} className="bg-white max-w-xl mx-auto shadow-lg rounded-lg p-6 space-y-4 ">
                <h2 className="text-xl font-bold mb-6">{editBanner ? "Edit Stock Category" : "Add New Stock Category"}</h2>
                <div className="flex  items-center gap-4">
                    <div className="flex items-center gap-5 w-full">
                        <div className="w-full">
                            <Label>Category Name</Label>
                            <Input name="categoryName" placeholder="Enter category name" type="text" value={formData.categoryName} onChange={handleInputChange} />
                        </div>
                    </div>
                    {/* Quantity Type Select with Add Button */}
                    <div className="flex items-center gap-2 w-full">
                        <div className="flex-1">
                            <Label>Quantity Type</Label>
                            <Select value={formData.quantityType} onValueChange={(value) => setFormData({ ...formData, quantityType: value })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select quantity type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {quantityTypes.map((type) => (
                                        <SelectItem key={type._id} value={type.name}>
                                            {type.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            className="mt-6"
                            onClick={() => setShowQuantityTypeModal(true)}
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
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
                                    stockType: "",
                                    quantityType: "",
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
                        <TableHead className="text-center border border-black">Food Category Type</TableHead>
                        <TableHead className="text-center border border-black">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody className="w-fit">
                    {banners.length > 0 ? (
                        banners.map((category) => (
                            <TableRow key={category._id} className="hover:bg-gray-200 w-fit">
                                <TableCell className="text-center border border-black">{category.order}</TableCell>
                                <TableCell className="text-center border border-black">{category.categoryName}</TableCell>
                                <TableCell className="text-center border border-black">{category.quantityType}</TableCell>
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
                        <DialogTitle>Delete Category</DialogTitle>
                    </DialogHeader>
                    <p>Are you sure you want to delete this category?</p>
                    <DialogFooter>
                        <Button variant="secondary" onClick={cancelDelete}>Cancel</Button>
                        <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* Add Quantity Type Modal */}
            <Dialog open={showQuantityTypeModal} onOpenChange={setShowQuantityTypeModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Quantity Type</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Quantity Type Name</Label>
                            <Input
                                placeholder="Enter quantity type name (e.g., kg, liters, pieces)"
                                value={newQuantityType}
                                onChange={(e) => setNewQuantityType(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleAddQuantityType()}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="secondary" onClick={() => {
                            setShowQuantityTypeModal(false);
                            setNewQuantityType("");
                        }}>Cancel</Button>
                        <Button onClick={handleAddQuantityType}>Add Quantity Type</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default StockCategory