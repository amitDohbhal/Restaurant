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
    // ...existing state
    const [allCategories, setAllCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [selectedBrand, setSelectedBrand] = useState('');
    const [isLoadingBrands, setIsLoadingBrands] = useState(false);

    // Editing state
    const [isEditing, setIsEditing] = useState(false);
    const formRef = useRef(null);

    // Handler to fill form for editing
    const handleEditProduct = (prod) => {
        reset({
            title: prod.title || '',
            order: prod.order || 1,
            active: typeof prod.active === 'boolean' ? prod.active : true,
            code: prod.code || '',
            setSelectedBrand:prod.brand || ''   
        });
        setActive(typeof prod.active === 'boolean' ? prod.active : true);
        setOrder(prod.order || 1);
        setTitle(prod.title || '');
        setCode(prod.code || '');
        setSelectedBrand(prod.brand || ''); // Set the selected brand if it exists
        setEditingId(prod._id); // Set the editing ID
        setIsEditing(true);
        if (formRef.current) {
            formRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    };

    // Cancel edit handler
    const handleCancelEdit = () => {
        reset({
            title: '',
            order: 1,
            active: true,
            code: ''
        });
        setCode('');
        setActive(true);
        setOrder(1);
        setTitle('');
        setSelectedBrand(''); // Reset the selected brand
        setIsEditing(false);
        setEditingId(null);
    };


    // QR Modal state
    const [qrModalOpen, setQrModalOpen] = useState(false);
    const [qrModalUrl, setQrModalUrl] = useState("");
    const [qrModalTitle, setQrModalTitle] = useState("");

    function slugify(str) {
        if (!str) return ''; // Return empty string if str is undefined, null, or empty
        return String(str)
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .replace(/-+/g, '-');
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
    const [code, setCode] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState("");
    const [order, setOrder] = useState(1);
    const [active, setActive] = useState(true);
    const [qrModalCode, setQrModalCode] = useState('');
    const [qrModalCategory, setQrModalCategory] = useState('');
    const [qrModalSizes, setQrModalSizes] = useState([]);
    const [qrModalColors, setQrModalColors] = useState([]);
    const [qrModalPrice, setQrModalPrice] = useState('');
    const [qrModalOldPrice, setQrModalOldPrice] = useState('');
    const [qrModalDescription, setQrModalDescription] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [qrModalCoupon, setQrModalCoupon] = useState({ code: '', amount: 0 });
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        // Fetch brands on component mount
        const fetchBrands = async () => {
            setIsLoadingBrands(true);
            try {
                const response = await fetch('/api/addBrand');
                const data = await response.json();
                if (Array.isArray(data)) {
                    setBrands(data);
                }
            } catch (error) {
                toast.error('Failed to load brands');
            } finally {
                setIsLoadingBrands(false);
            }
        };

        fetchBrands();
    }, []);

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
            // First, remove the product from all brand categories
            try {
                const brandResponse = await fetch('/api/brand-categories/remove-product', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ productId: id }),
                });

                if (!brandResponse.ok) {
                    const errorData = await brandResponse.json().catch(() => ({}));
                    console.error('Error removing from brand categories:', errorData);
                    // Continue with deletion even if brand removal fails
                }
            } catch (brandError) {
                console.error('Error during brand category removal:', brandError);
                // Continue with deletion even if brand removal fails
            }

            // Then delete the product itself
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
        if (!title) {
            toast.error("Title is required");
            return;
        }
        if (!code) {
            toast.error("Code is required");
            return;
        }
        setIsLoading(true);

        try {
            const payload = {
                title,
                slug: slugify(title),
                code,
                order,
                active: typeof active === 'boolean' ? active : true,
                isDirect: !subMenuId,
                ...(selectedBrand && { brand: selectedBrand }),
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
                // Get the current product being edited (if in edit mode) to get the previous brand
                let previousBrandId = null;
                if (isEditing) {
                    const currentProduct = products.find(p => p._id === editingId);
                    previousBrandId = currentProduct?.brand?._id || currentProduct?.brand;
                    // console.log('Previous brand ID:', previousBrandId, 'New brand ID:', selectedBrand);
                }

                // Get the product ID from the correct location in the response
                const productId = result.product?._id || result._id || editingId;

                if (!productId) {
                    throw new Error('Failed to get product ID from response');
                }

                // Handle brand category updates if brand was changed or this is a new product
                const isBrandChanged = isEditing && previousBrandId !== selectedBrand;
                // console.log('Is brand changed:', isBrandChanged, 'Previous:', previousBrandId, 'New:', selectedBrand);

                if (isBrandChanged || !isEditing) {
                    try {
                        // If this is an edit and the brand was changed, remove from old brand first
                        if (isBrandChanged && previousBrandId) {
                            // console.log('Removing product from old brand category:', previousBrandId);
                            const removeResponse = await fetch('/api/brand-categories/remove-product', {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ productId })
                            });
                            
                            if (!removeResponse.ok) {
                                const error = await removeResponse.json().catch(() => ({}));
                                console.error('Failed to remove from old brand:', error);
                                throw new Error('Failed to remove product from old brand category');
                            }
                            // console.log('Successfully removed from old brand category');
                        }

                        // Only proceed if we have a selected brand to add to
                        if (selectedBrand) {
                            const productData = {
                                product: productId,
                                productName: title
                            };

                            // Fetch all brands and find the selected one
                            const brandsResponse = await fetch('/api/addBrand');
                            if (!brandsResponse.ok) {
                                throw new Error('Failed to fetch brands');
                            }
                            const allBrands = await brandsResponse.json();
                            const selectedBrandData = allBrands.find(brand => brand._id === selectedBrand);

                            if (!selectedBrandData) {
                                throw new Error('Selected brand not found');
                            }

                            // First, check if the brand category exists for this brand
                            let brandCategory = null;
                            try {
                                // First try to find by brand ID
                                const brandCategoryResponse = await fetch(`/api/brand-categories?brand=${selectedBrand}`);
                                if (brandCategoryResponse.ok) {
                                    const categories = await brandCategoryResponse.json();
                                    brandCategory = categories[0] || null; // Take the first one if found
                                }
                            } catch (error) {
                                console.error('Error fetching brand category:', error);
                                // Brand category doesn't exist yet, will create a new one
                            }

                            // Check if product already exists in this brand category
                            const productExists = brandCategory?.products?.some(p => p.product === productId);
                            
                            if (!productExists) {
                                // Prepare the update data
                                let updateData;
                                const productUpdate = {
                                    product: productId,
                                    productName: title // Use the title from state
                                };

                                let brandResponse;
                                
                                if (brandCategory) {
                                    // Add the product to the existing brand category
                                    updateData = {
                                        $push: {
                                            products: productUpdate
                                        }
                                    };
                                    
                                    // Update existing brand category
                                    brandResponse = await fetch(`/api/brand-categories/${brandCategory._id}`, {
                                        method: 'PATCH',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify(updateData)
                                    });
                                } else {
                                    // Create a new brand category with this product
                                    const newCategoryData = {
                                        title: selectedBrandData.buttonLink || 'New Brand Category',
                                        slug: (selectedBrandData.buttonLink || 'new-brand-category').toLowerCase().replace(/\s+/g, '-'),
                                        buttonLink: selectedBrandData.buttonLink || '',
                                        brand: selectedBrand,
                                        brandCategory: selectedBrandData.buttonLink || '',
                                        products: [productUpdate],
                                        active: true,
                                        order: 0
                                    };
                                    
                                    // Create new brand category
                                    brandResponse = await fetch('/api/brand-categories', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify(newCategoryData)
                                    });
                                }

                                if (!brandResponse.ok) {
                                    const brandResult = await brandResponse.json();
                                    throw new Error(brandResult.message || 'Failed to update brand category');
                                }
                            }
                        }
                    } catch (error) {
                        console.error('Error updating brand categories:', error);
                        // Don't fail the operation, just log the error
                    }
                }
                toast.success(isEditing ? 'Product updated successfully!' : 'Product added successfully!');
                reset({
                    title: '',
                    order: 1,
                    active: true,
                    code: '',
                    setSelectedBrand: '' // Reset the selected brand

                });
                setTitle('');
                setCode('');
                setOrder(1);
                setActive(true);
                setSelectedBrand(''); // Reset the selected brand
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
            <form className="flex flex-col items-center justify-center gap-8 my-20 bg-gray-200 w-full md:w-fit mx-auto p-4 rounded-lg" onSubmit={handleSubmit(onSubmit)}>
                <div className="flex md:flex-row flex-col items-center md:items-end gap-6 w-full">
                    <div className="flex flex-col gap-2">
                        <label htmlFor="code" className="font-semibold">Product Code</label>
                        <Input name="code" placeholder="Enter Product Code Here" className="w-full border-2 border-blue-600 focus:border-dashed focus:border-blue-500 focus:outline-none focus-visible:ring-0 font-bold" value={code} onChange={e => setCode(e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label htmlFor="productTitle" className="font-semibold">Product Title</label>
                        <Input name="productTitle" placeholder="Enter Product Title Here" className="w-full border-2 font-bold border-blue-600" value={title} onChange={e => setTitle(e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-2 w-64">
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
                        ) : isEditing ? 'Update Product' : 'Add Product'}
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
                            <TableHead className="text-center !text-black w-1/4">Product Name</TableHead>
                            <TableHead className="text-center !text-black w-1/6">URL</TableHead>
                            <TableHead className="text-center !text-black w-1/6">QR</TableHead>
                            <TableHead className="w-1/6 !text-black text-center">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {products && products.length > 0 ? (
                            products.map((prod, index) => {
                                const url = typeof window !== 'undefined' ? `${window.location.origin}/product/${slugify(prod.slug)}` : '';
                                return (
                                    <TableRow key={prod._id}>
                                        <TableCell className="border font-semibold border-blue-600">{index + 1}</TableCell>
                                        <TableCell className="border font-semibold border-blue-600">{prod.title}</TableCell>
                                        <TableCell className="border font-semibold border-blue-600">
                                            <div className="flex items-center justify-center gap-2">
                                                {/* Copy URL Button */}
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => copyToClipboard(url)}
                                                    disabled={!url}
                                                    title="Copy Product URL"
                                                >
                                                    <Copy className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                        <TableCell className="border font-semibold border-blue-600">
                                            <div className="flex items-center justify-center gap-2">
                                                {/* QR Code Button */}
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => {
                                                        setQrModalUrl(url);
                                                        setQrModalTitle(prod.title);
                                                        setQrModalCode(prod.code);
                                                        setQrModalDescription(prod.description?.overview);
                                                        const allSizes = Array.from(new Set((prod.quantity?.variants || []).map(v => v.size)));
                                                        const allColors = Array.from(new Set((prod.quantity?.variants || []).map(v => v.color)));
                                                        setQrModalSizes(allSizes);
                                                        setQrModalColors(allColors);
                                                        // Coupon logic
                                                        let basePrice = prod.quantity.variants[0]?.price ?? '';
                                                        let oldPrice = prod.quantity.variants[0]?.oldPrice ?? '';
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
                                        </TableCell>
                                        <TableCell className="border font-semibold border-blue-600">
                                            <div className="flex items-center justify-center gap-6">
                                                <Button size="icon" variant="outline" asChild>
                                                    <Link href={`/admin/add_direct_product/${prod._id}`}>
                                                        Edit
                                                    </Link>
                                                </Button>
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
                                                    title="Delete Product"
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
                                    No packages available.
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
                productDescription={qrModalDescription}
                productCode={qrModalCode}
                sizes={qrModalSizes}
                colors={qrModalColors}
                price={qrModalPrice}
                oldPrice={qrModalOldPrice}
                logoUrl="/logo.png"
                coupon={qrModalCoupon}
            />
            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <div className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-destructive" />
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        </div>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the product and remove all its data.
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
