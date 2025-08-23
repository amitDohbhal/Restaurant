"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import toast from "react-hot-toast";
import { PencilIcon, Trash2Icon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const StockProduct = () => {
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);
    const [products, setProducts] = useState([]);
    const [stockCategories, setStockCategories] = useState([]);
    const [editProduct, setEditProduct] = useState(null);
    const [formData, setFormData] = useState({
        stockCategory: "",
        quantity: "",
        productName: "",
        openingStock: "",
    });

    // Fetch products and stock categories
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await fetch("/api/stockProduct");
                const data = await response.json();
                setProducts(data);
            } catch (error) {
                toast.error("Failed to fetch products");
            }
        };

        const fetchStockCategories = async () => {
            try {
                const response = await fetch("/api/stockCategory");
                const data = await response.json();
                setStockCategories(data);
            } catch (error) {
                toast.error("Failed to fetch stock categories");
            }
        };

        fetchProducts();
        fetchStockCategories();
    }, []);

    // Handle input changes
    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };


    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate required fields
        if (!formData.stockCategory || !formData.quantity || !formData.productName) {
            return toast.error("Please fill in all required fields");
        }

        try {
            const method = editProduct ? "PATCH" : "POST";
            const payload = {
                stockCategory: formData.stockCategory,
                quantity: formData.quantity,
                productName: formData.productName,
                openingStock: formData.openingStock,
                id: editProduct,
            };

            const response = await fetch("/api/stockProduct", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success(`Product ${editProduct ? "updated" : "added"} successfully`);
                setEditProduct(null);

                // Refresh product list
                const updatedProducts = await fetch("/api/stockProduct").then((res) => res.json());
                setProducts(updatedProducts);

                // Reset form
                setFormData({
                    stockCategory: "",
                    quantity: "",
                    productName: "",
                    openingStock: "",
                });
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error("Something went wrong");
        }
    };

    const handleEdit = (product) => {
        setEditProduct(product._id);
        setFormData({
            stockCategory: product.stockCategory,
            quantity: product.quantity.toString(),
            productName: product.productName,
            openingStock: product.openingStock,
        });
    };


    const handleDelete = async (id) => {
        try {
            const response = await fetch("/api/stockProduct", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success("Product deleted successfully");
                setProducts((prev) => prev.filter((product) => product._id !== id));

                // Refresh product list
                const updatedProducts = await fetch("/api/stockProduct").then((res) => res.json());
                setProducts(updatedProducts);
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error("Something went wrong");
        }
    };

    const confirmDelete = async () => {
        if (productToDelete) {
            await handleDelete(productToDelete);
            setProductToDelete(null);
            setShowDeleteModal(false);
        }
    };

    const cancelDelete = () => {
        setShowDeleteModal(false);
        setProductToDelete(null);
    };

    return (
        <div className="max-w-5xl mx-auto py-10 w-full">
            <h2 className="text-2xl font-bold mb-6">{editProduct ? "Edit Stock Product" : "Add New Stock Product"}</h2>
            <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-lg p-6 space-y-4">

                {/* Stock Category Select */}
                <div>
                    <Label>Stock Category *</Label>
                    <Select value={formData.stockCategory} onValueChange={(value) => {
                        const selectedCategory = stockCategories.find(cat => cat._id === value);
                        setFormData(formData => ({
                            ...formData,
                            stockCategory: value,
                            quantity: selectedCategory && selectedCategory.quantityType && !editProduct
                                ? String(selectedCategory.quantityType)
                                : "",
                        }));
                    }}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select stock category" />
                        </SelectTrigger>
                        <SelectContent>
                            {stockCategories.map((category) => (
                                <SelectItem key={category._id} value={category._id}>
                                    {category.categoryName}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Quantity Input */}
                <div>
                    <Label>Quantity *</Label>
                    <Input
                        name="quantity"
                        placeholder="Enter quantity"
                        type="text"
                        readOnly
                        value={formData.quantity}
                        onChange={handleInputChange}
                        required
                    />
                </div>

                {/* Product Name Input */}
                <div>
                    <Label>Product Name *</Label>
                    <Input
                        name="productName"
                        placeholder="Enter product name"
                        type="text"
                        value={formData.productName}
                        onChange={handleInputChange}
                        required
                    />
                </div>
                  {/* Opening Stock Input */}
                <div>
                    <Label>Opening Stock *</Label>
                    <Input
                        name="openingStock"
                        placeholder="Enter opening stock"
                        type="number"
                        value={formData.openingStock}
                        onChange={handleInputChange}
                        required
                    />
                </div>

                <div className="flex gap-3">
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-500">
                        {editProduct ? "Update Product" : "Add Product"}
                    </Button>
                    {editProduct && (
                        <Button
                            type="button"
                            variant="outline"
                            className="bg-gray-300 hover:bg-gray-200 text-black"
                            onClick={() => {
                                setEditProduct(null);
                                setFormData({
                                    stockCategory: "",
                                    quantity: "",
                                    productName: "",
                                    openingStock: "",
                                });
                            }}
                        >
                            Cancel Edit
                        </Button>
                    )}
                </div>
            </form>

            <h2 className="text-2xl font-bold mt-10 mb-4">Existing Stock Products</h2>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Stock Category</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Product Name</TableHead>
                        <TableHead>Opening Stock</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {products.length > 0 ? (
                        products.map((product) => (
                            <TableRow key={product._id}>
                                <TableCell>{(stockCategories.find(cat => cat._id === product.stockCategory) || {}).categoryName || product.stockCategory}</TableCell>
                                <TableCell>{product.quantity}</TableCell>
                                <TableCell>{product.productName}</TableCell>
                                <TableCell>{product.openingStock}</TableCell>
                                <TableCell>
                                    <Button variant="outline" size="icon" onClick={() => handleEdit(product)} className="mr-2">
                                        <PencilIcon />
                                    </Button>
                                    <Button size="icon" onClick={() => { setShowDeleteModal(true); setProductToDelete(product._id); }} variant="destructive">
                                        <Trash2Icon />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan="5" className="text-center py-4">No products found</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Product</DialogTitle>
                    </DialogHeader>
                    <p>Are you sure you want to delete this product?</p>
                    <DialogFooter>
                        <Button variant="secondary" onClick={cancelDelete}>Cancel</Button>
                        <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default StockProduct