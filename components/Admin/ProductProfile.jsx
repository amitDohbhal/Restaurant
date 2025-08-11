"use client"
import React, { useState, useEffect } from 'react';
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import toast from 'react-hot-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Copy, Loader2, QrCode } from "lucide-react";
import ProductQrModal from "./ProductQrModal";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";

const ProductProfile = ({ id }) => {
    const [title, setTitle] = useState("");
    const [code, setCode] = useState(""); // Will be auto-generated
    const [loading, setLoading] = useState(false);
    const [refreshTable, setRefreshTable] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [brands, setBrands] = useState([]);
    const [selectedBrand, setSelectedBrand] = useState('');
    const [isLoadingBrands, setIsLoadingBrands] = useState(false);

    // QR Modal state  
    const [qrModalCode, setQrModalCode] = useState('');
    const [qrModalOpen, setQrModalOpen] = useState(false);
    const [qrModalUrl, setQrModalUrl] = useState("");
    const [qrModalTitle, setQrModalTitle] = useState("");
    const [qrModalSizes, setQrModalSizes] = useState([]);
    const [qrModalColors, setQrModalColors] = useState([]);
    const [qrModalPrice, setQrModalPrice] = useState('');
    const [qrModalOldPrice, setQrModalOldPrice] = useState('');
    const [qrModalDescription, setQrModalDescription] = useState('');
    const [qrModalCoupon, setQrModalCoupon] = useState({ code: '', amount: 0 });


    // Slugify utility
    function slugify(str) {
        return str
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .replace(/-+/g, '-');
    }
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim()) return toast.error('Title cannot be empty');
        if (!code.trim()) return toast.error('Code cannot be empty');
        
        setLoading(true);
        
        try {
            // Always create direct product
            let payload = { 
                title, 
                code, 
                slug: slugify(title), 
                isDirect: true,
                ...(selectedBrand && { brand: selectedBrand }) // Include selected brand if exists
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
            
            const newProduct = await res.json();
            const productId = newProduct._id || newProduct.product?._id;
            
            // If a brand is selected, add this product to the brand's category
            if (selectedBrand && productId) {
                try {
                    // First, check if the brand category exists for this brand
                    let brandCategory = null;
                    try {
                        const brandCategoryResponse = await fetch(`/api/brand-categories/${selectedBrand}`);
                        if (brandCategoryResponse.ok) {
                            brandCategory = await brandCategoryResponse.json();
                        }
                    } catch (error) {
                        // Brand category doesn't exist yet, will create a new one
                    }
                    
                    // Prepare the update data
                    const updateData = brandCategory 
                        ? {
                            ...brandCategory,
                            $push: {
                                products: {
                                    product: productId,
                                    productName: title
                                }
                            }
                        }
                        : {
                            _id: selectedBrand,
                            title: brands.find(b => b._id === selectedBrand)?.buttonLink || 'New Brand Category',
                            slug: (brands.find(b => b._id === selectedBrand)?.buttonLink || 'new-brand-category').toLowerCase().replace(/\s+/g, '-'),
                            products: [{
                                product: productId,
                                productName: title
                            }]
                        };
                    
                    // Create or update the brand category with the product
                    const brandResponse = await fetch(`/api/brand-categories/${selectedBrand}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(updateData)
                    });
                    
                    if (!brandResponse.ok) {
                        const errorData = await brandResponse.json();
                        throw new Error(errorData.message || 'Failed to update brand category');
                    }
                } catch (error) {
                    // Don't fail the whole operation if updating brand category fails
                    console.error('Error updating brand category:', error);
                    toast.error('Product saved, but there was an error updating brand category: ' + error.message);
                }
            }
            
            // Reset form and refresh table
            setTitle(""); 
            setCode("");
            setSelectedBrand('');
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
            // First, remove the product from all brand categories
            const removeFromBrandsResponse = await fetch('/api/brand-categories/remove-product', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId: deleteTarget })
            });
            
            if (!removeFromBrandsResponse.ok) {
                const errorData = await removeFromBrandsResponse.json().catch(() => ({}));
                console.error('Error removing product from brand categories:', errorData);
                throw new Error('Failed to remove product from brand categories');
            }

            // Only proceed with product deletion if brand category update was successful
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

    // Fetch brands on component mount
    useEffect(() => {
        const fetchBrands = async () => {
            setIsLoadingBrands(true);
            try {
                const response = await fetch('/api/addBrand');
                const data = await response.json();
                if (Array.isArray(data)) {
                    setBrands(data);
                }
            } catch (error) {
                console.error('Failed to fetch brands:', error);
                toast.error('Failed to load brands');
            } finally {
                setIsLoadingBrands(false);
            }
        };

        fetchBrands();
    }, []);

    return (
        <>
            <form className="flex flex-col items-center justify-center gap-8 my-20 bg-gray-200 w-full max-w-xl md:max-w-3xl mx-auto p-4 rounded-lg" onSubmit={async e => {
                e.preventDefault();
                if (!title.trim()) return toast.error('Title cannot be empty');
                if (!code.trim()) return toast.error('Code cannot be empty');
                
                setLoading(true);
      
                try {
                    if (editingId) {
                        // Get the current product being edited
                        const currentProduct = products.find(p => p._id === editingId);
                        const previousBrandId = currentProduct?.brand?._id || currentProduct?.brand;
                        
                        // Update the product first
                        const res = await fetch(`/api/product/${editingId}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                                title, 
                                code,
                                ...(selectedBrand && { brand: selectedBrand })
                            })
                        });
                        
                        if (!res.ok) {
                            const err = await res.json().catch(() => ({}));
                            throw new Error(err.error || 'Failed to update product');
                        }
                        
                        const updated = await res.json();
                        
                        // Handle brand category updates if brand was changed
                        if (selectedBrand !== previousBrandId) {
                            try {
                                // Remove from previous brand category if it existed
                                if (previousBrandId) {
                                    await fetch('/api/brand-categories/remove-product', {
                                        method: 'PATCH',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ productId: editingId })
                                    });
                                }
                                
                                // Add to new brand category if selected
                                if (selectedBrand) {
                                    const brandData = {
                                        $push: {
                                            products: {
                                                product: editingId,
                                                productName: title
                                            }
                                        }
                                    };
                                    
                                    await fetch(`/api/brand-categories/${selectedBrand}`, {
                                        method: 'PATCH',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify(brandData)
                                    });
                                }
                            } catch (error) {
                                console.error('Error updating brand categories:', error);
                                // Don't fail the operation, just log the error
                            }
                        }
                        
                        // Update local state
                        setProducts(ps => ps.map(p => p._id === editingId ? { ...updated, brand: selectedBrand } : p));
                        setEditingId(null);
                        setTitle("");
                        setCode("");
                        setSelectedBrand('');
                        
                        toast.success('Product updated successfully!');
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
                        <label htmlFor="productCode" className="font-semibold">Product Code</label>
                        <Input name="productCode" className="w-full border-2 font-bold border-blue-600 focus:border-dashed focus:border-blue-500 focus:outline-none focus-visible:ring-0 bg-gray-100" placeholder="Type Here:" value={code} onChange={e => setCode(e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-2 w-full">
                        <label htmlFor="productTitle" className="font-semibold">Product Title</label>
                        <Input name="productTitle" className="w-full border-2 font-bold border-blue-600 focus:border-dashed focus:border-blue-500 focus:outline-none focus-visible:ring-0" placeholder="Type Here:" value={title} onChange={e => setTitle(e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-2 w-full">
                        <label htmlFor="brand" className="font-semibold">Brand</label>
                        <Select 
                            value={selectedBrand} 
                            onValueChange={setSelectedBrand}
                            disabled={isLoadingBrands}
                        >
                            <SelectTrigger className="w-full border-2 border-blue-600">
                                <SelectValue placeholder="Select a brand" />
                            </SelectTrigger>
                            <SelectContent>
                                {brands.map((brand) => (
                                    <SelectItem key={brand._id} value={brand._id}>
                                        {brand.buttonLink || `Brand ${brand.order}`}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
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
                        <Button type="button" className="bg-gray-400" onClick={() => { setEditingId(null); setTitle(""); setCode(""); setSelectedBrand(''); }}>Cancel</Button>
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
                                Add Product
                               </>
                            )}
                        </Button>
                    </div>
                )}
            </form>
            {/* Product Table copied inline */}
            <div className="mt-10 flex flex-col items-center">
                <h3 className="text-xl font-semibold mb-4">Product List</h3>
                <table className="w-full border border-black rounded-lg">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="py-2 px-4 text-center">Title</th>
          
                            <th className="py-2 px-4 text-center">URL</th>
                            <th className="py-2 px-4 text-center">QR</th>
                            <th className="py-2 px-4 text-center">Active</th>
                            <th className="py-2 px-4 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((prod, idx) => (
                            <tr key={prod._id} className="border-t">
                                <td className="py-2 px-4 text-center">{prod.title}</td>
                               
                                {/* <td className="py-2 px-4 text-center">{prod.code}</td> */}
                                {/* <td className="py-2 px-4 text-center">
                                    <div className="flex flex-col items-center">
                                        <span>{prod.title}</span>
                                    </div>
                                </td> */}
                                <td className="py-2 px-4 text-center">
                                    {/* Product URL Copy Button Only */}
                                    {prod.title && (() => {
                                        const url = `${window.location.origin}/product/${slugify(prod.slug)}`;
                                        return (
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => copyToClipboard(url)}
                                                disabled={!url}
                                                title="Copy Product URL"
                                            >
                                                <Copy className="w-4 h-4" />
                                            </Button>
                                        );
                                    })()}
                                </td>
                                <td className="py-2 px-4 text-center">
                                    {/* Product QR Copy/View Button */}
                                    {prod.title && (() => {
                                        const qr = `${window.location.origin}/product/${slugify(prod.slug)}`;
                                        return (
                                            <div className="flex gap-2 justify-center">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => {
                                                        setQrModalUrl(qr);
                                                        setQrModalTitle(prod.title);
                                                        setQrModalCode(prod.code);
                                                        setQrModalDescription(prod.description?.overview || '');
                                                        
                                                        // Safely handle variants
                                                        const variants = prod.quantity?.variants || [];
                                                        const allSizes = Array.from(new Set(variants.map(v => v?.size).filter(Boolean)));
                                                        const allColors = Array.from(new Set(variants.map(v => v?.color).filter(Boolean)));
                                                        setQrModalSizes(allSizes);
                                                        setQrModalColors(allColors);
                                                        
                                                        // Coupon logic with safe access
                                                        let basePrice = variants[0]?.price ?? '';
                                                        let discount = 0;
                                                        let couponCode = '';
                                                        if (prod.coupons && prod.coupons.coupon) {
                                                            discount = prod.coupons.coupon.amount || 0;
                                                            couponCode = prod.coupons.coupon.couponCode || '';
                                                        }
                                                        let discountedPrice = basePrice;
                                                        if (discount && basePrice) {
                                                            discountedPrice = basePrice - discount;
                                                        }
                                                        setQrModalPrice(discountedPrice);
                                                        setQrModalOldPrice(basePrice);
                                                        setQrModalCoupon({ code: couponCode, amount: discount });
                                                        setQrModalOpen(true);
                                                    }}
                                                    title="View QR & Download"
                                                >
                                                    <QrCode className="w-6 h-6" />
                                                </Button>
                                            </div>
                                        );
                                    })()}
                                </td>
                                <td className="py-2 px-4 text-center">
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
                                <td className="py-2 px-4">
                                    <div className="flex gap-2 justify-center">
                                        <button
                                            className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-800"
                                            onClick={() => window.location.href = `/admin/add_direct_product/${prod._id}`}
                                        >
                                            Add Info
                                        </button>
                                        <button
                                            className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-800"
                                            onClick={() => {
                                                setEditingId(prod._id);
                                                setTitle(prod.title);
                                                setCode(prod.code);
                                                setSelectedBrand(prod.brand?._id || prod.brand || '');
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
            {/* QR Modal for viewing/downloading QR code */}
            <ProductQrModal
                 open={qrModalOpen}
                 onOpenChange={setQrModalOpen}
                 qrUrl={qrModalUrl}
                 productTitle={qrModalTitle}
                 productDescription={qrModalDescription}
                 productCode={qrModalCode}
                 sizes={qrModalSizes}
                 colors={qrModalColors}
                 price={qrModalPrice}
                 oldPrice={qrModalOldPrice}
                 logoUrl="/logo.png"
                 coupon={qrModalCoupon}
            />

            {/* Delete Product Modal */}
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
        </>
    );
}

export default ProductProfile;
