"use client"
import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Image from "next/image";
// UI Components
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { Edit, Trash2, Search, Plus, RotateCw, Trash2Icon, PencilLine, UploadIcon, Eye } from 'lucide-react';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const FoodInventory = () => {
  // --- Quantity Type State ---
  const [qtyTypes, setQtyTypes] = useState([]);
  const [selectedQtyType, setSelectedQtyType] = useState('');
  const [showQtyModal, setShowQtyModal] = useState(false);
  const [newQtyType, setNewQtyType] = useState('');
  const [qtyLoading, setQtyLoading] = useState(false);

  // Fetch quantity types
  useEffect(() => {
    const fetchQtyTypes = async () => {
      try {
        const res = await fetch('/api/foodQuantityType');
        const data = await res.json();
        if (Array.isArray(data)) setQtyTypes(data);
      } catch (err) {
        toast.error('Failed to load quantity types');
      }
    };
    fetchQtyTypes();
  }, []);

  // Add new quantity type
  const handleAddQtyType = async () => {
    setQtyLoading(true);
    try {
      const res = await fetch('/api/foodQuantityType', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newQtyType.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add');
      setQtyTypes(prev => [data, ...prev]);
      setSelectedQtyType(data.name);
      setShowQtyModal(false);
      setNewQtyType('');
      toast.success('Qty Type added');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setQtyLoading(false);
    }
  };
  const [categories, setCategories] = useState([]);

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/foodCategory');
        const data = await response.json();
        if (Array.isArray(data)) {
          setCategories(data);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast.error('Failed to load categories');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const form = useForm({
    defaultValues: {
      category: '',
      categoryType: '',
      foodName: '',
      qtyType: '',
      halfPrice: '',
      fullPrice: '',
      quarterPrice: '',
      perPiecePrice: '',
      cgstPercent: '',
      cgstAmount: '',
      sgstPercent: '',
      sgstAmount: '',
      image: { url: '', key: '' },
      productTitle: '',
      productDescription: ''
    }
  });

  const router = useRouter();
  const [editingId, setEditingId] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // Fetch inventory data
  const fetchInventory = async (params = {}) => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: params.pagination?.current || pagination.current,
        pageSize: params.pagination?.pageSize || pagination.pageSize,
        ...params,
      }).toString();

      const response = await fetch(`/api/foodInventory?${query}`);

      if (!response.ok) {
        throw new Error('Failed to fetch inventory');
      }

      const result = await response.json();

      // Handle both array and paginated response formats
      const items = Array.isArray(result) ? result : (result.data || []);
      const total = result.total || items.length;

      setData(items);
      setPagination(prev => ({
        ...prev,
        total,
        current: result.page || 1,
        pageSize: result.pageSize || 10,
      }));
    } catch (error) {
      console.error('Error fetching inventory:', error);
      toast.error(error.message || 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    fetchInventory();
  }, []);

  // Handle form submission
  const onSubmit = async (values) => {
    // Validation checks
    if (!values.foodName || !values.category || !values.categoryType || !values.qtyType) {
      toast.error('Please fill all required fields.');
      return;
    }
    if (!values.image || !values.image.url) {
      toast.error('Product image is required.');
      return;
    }
    setLoading(true);
    try {
      const method = editingId ? 'PATCH' : 'POST';
      // For PATCH, include id as query param
      const url = editingId ? `/api/foodInventory?id=${editingId}` : '/api/foodInventory';

      // Find the selected category object to get its name
      let selectedCategoryObj = null;
      if (Array.isArray(categories)) {
        selectedCategoryObj = categories.find(cat => cat._id === values.category);
      }

      let bodyData = { ...values };
      if (selectedCategoryObj) {
        bodyData.categoryName = selectedCategoryObj.categoryName;
        bodyData.categoryId = selectedCategoryObj._id; // Add category ID
      }
      // Remove the form's category field as we're using categoryId and categoryName
      delete bodyData.category;
      if (editingId) {
        delete bodyData._id;
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bodyData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save item');
      }

      // Show success toast
      toast.success(`Item ${editingId ? 'updated' : 'added'} successfully`);
      form.reset({
        category: '',
        categoryType: '',
        foodName: '',
        qtyType: '',
        halfPrice: '',
        fullPrice: '',
        quarterPrice: '',
        perPiecePrice: '',
        cgstPercent: '',
        cgstAmount: '',
        sgstPercent: '',
        sgstAmount: '',
        image: { url: '', key: '' },
        productTitle: '',
        productDescription: '',
        categoryId: ''
      });
      setEditingId(null);
      fetchInventory();
    } catch (error) {
      console.error('Error saving item:', error);
      toast.error(error.message || 'Failed to save item');
    } finally {
      setLoading(false);
    }
  };

  // Dialog state for delete
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Actual delete logic
  const handleDelete = async (id) => {
    setLoading(true);
    try {
      const response = await fetch('/api/foodInventory', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete item');
      }
      toast.success('Item deleted successfully');
      fetchInventory();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error(error.message || 'Failed to delete item');
    } finally {
      setLoading(false);
    }
  };

  // Confirm and cancel handlers
  const confirmDelete = async () => {
    if (itemToDelete) {
      await handleDelete(itemToDelete);
      setItemToDelete(null);
      setShowDeleteModal(false);
    }
  };
  const cancelDelete = () => {
    setShowDeleteModal(false);
    setItemToDelete(null);
  };


  // Handle edit item
  const handleEdit = (item) => {
    form.reset({
      _id: item._id,
      foodName: item.foodName || '',
      category: item.category || '',
      categoryType: item.categoryType || '',
      qtyType: item.qtyType || item.quantityType || '',
      halfPrice: item.halfPrice || '',
      fullPrice: item.fullPrice || '',
      quarterPrice: item.quarterPrice || '',
      perPiecePrice: item.perPiecePrice || '',
      cgstPercent: item.cgstPercent || '',
      cgstAmount: item.cgstAmount || '',
      sgstPercent: item.sgstPercent || '',
      sgstAmount: item.sgstAmount || '',
      image: item.image || item.foodImage || { url: '', key: '' },
      productTitle: item.productTitle || item.foodTitleLine || '',
      productDescription: item.productDescription || item.foodDescription || '',
    });
    setEditingId(item._id);
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const [uploading, setUploading] = useState(false);
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);
    try {
      const res = await fetch('/api/cloudinary', {
        method: 'POST',
        body: formDataUpload
      });
      const data = await res.json();
      if (res.ok && data.url) {
        // If using react-hook-form
        form.setValue('image', { url: data.url, key: data.key || '' });
        toast.success('Image uploaded!');
      } else {
        toast.error('Cloudinary upload failed: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      toast.error('Cloudinary upload error: ' + err.message);
    }
    setUploading(false);
  };
  // Remove image from react-hook-form state
  const handleDeleteImage = () => {
    form.setValue('image', { url: '', key: '' });
  };
  // Ref for file input
  const fileInputRef = useRef(null);
  // Modal state for view
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewItem, setViewItem] = useState(null);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <Card className="mb-6 p-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Row 2: Category Name */}
            <div className="flex items-center gap-4">
              <div className="flex flex-col w-full">
                <Label className="mb-1">Select Category Name</Label>
                <Select onValueChange={(value) => form.setValue('category', value)} value={form.watch('category')}>
                  <SelectTrigger className="rounded border border-black h-10 px-4">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category._id} value={category._id}>
                        {category.categoryName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col w-full">
                <Label className="mb-1">Category Type</Label>
                <Select value={form.watch('categoryType')} onValueChange={value => form.setValue('categoryType', value)}>
                  <SelectTrigger className="rounded border border-black h-10 px-4">
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="readyToSell">Ready To Sell</SelectItem>
                    <SelectItem value="afterCooked">After Cooked</SelectItem>
                    <SelectItem value="liqueur">Liqueur</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {/* Row 3: Food Name Inventory + Qty Type */}
            <div className="flex flex-wrap items-center gap-4 mb-2">
              <div className="flex flex-col w-64">
                <Label className="mb-1">Food Name Inventory</Label>
                <Input className="rounded border border-black h-10 px-4" placeholder="Type Name" {...form.register('foodName')} />
              </div>
              <div className="flex flex-col w-64">
                <Label className="mb-2">Qty Type</Label>
                <Select
                  value={form.watch('qtyType')}
                  onValueChange={value => form.setValue('qtyType', value)}
                >
                  <SelectTrigger className=" rounded border border-black h-10 px-4">
                    <SelectValue placeholder="Select Qty Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {qtyTypes.map((type) => (
                      <SelectItem key={type._id} value={type.name}>{type.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col w-64 mt-5">

                <Button type="button" className="rounded-none h-10 w-10 bg-[#0099A8] text-white ml-2" onClick={() => setShowQtyModal(true)}>+</Button>
              </div>
              {/* Modal for adding new quantity type */}
              {showQtyModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                  <div className="bg-white p-6 rounded-lg shadow-lg w-96">
                    <h2 className="text-lg font-bold mb-4">Add Qty Type</h2>
                    <Input
                      className="mb-4"
                      placeholder="Type name"
                      value={newQtyType}
                      onChange={e => setNewQtyType(e.target.value)}
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" onClick={() => setShowQtyModal(false)}>Cancel</Button>
                      <Button
                        className="bg-green-700 text-white"
                        onClick={handleAddQtyType}
                        disabled={qtyLoading || !newQtyType.trim()}
                      >
                        {qtyLoading ? 'Saving...' : 'Save'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Row 4: Food Type Price */}
            <div className="flex gap-4 items-center mb-2">
              <div className="flex items-center gap-5">
                <div className="flex flex-col">
                  <Label className="mb-1">Food Type Price</Label>
                  <Input className=" rounded border border-black h-10 px-4 mb-2" placeholder="Type Half Price Here" {...form.register('halfPrice')} />
                  <Input className=" rounded border border-black h-10 px-4 mb-2" placeholder="Type Full Price Here" {...form.register('fullPrice')} />
                  <Input className=" rounded border border-black h-10 px-4 mb-2" placeholder="Type Quarter Price Here" {...form.register('quarterPrice')} />
                  <Input className=" rounded border border-black h-10 px-4" placeholder="Type Per Piece Here" {...form.register('perPiecePrice')} />
                </div>
                <div className="flex flex-col gap-2">
                  <span className='pt-5'>Half</span>
                  <span className='pt-5'>Full</span>
                  <span className='pt-4'>Quarter</span>
                  <span className='pt-5'>Per Piece</span>
                </div>
              </div>
            </div>

            {/* Row 5: Tax Fields */}
            <div className="flex flex-wrap gap-4 mb-2">
              <div className="flex-1 min-w-[200px]">
                <Label className="block text-sm font-semibold">Tax CGST</Label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      type="number"
                      placeholder="Tax Percent %"
                      className="w-full rounded border border-black px-3 py-1"
                      min="0"
                      max="100"
                      {...form.register('cgstPercent', {
                        onChange: (e) => {
                          if (e.target.value) form.setValue('cgstAmount', '');
                        }
                      })}
                      disabled={!!form.watch('cgstAmount')}
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      type="number"
                      placeholder="Tax Amount"
                      className="w-full rounded border border-black px-3 py-1"
                      min="0"
                      {...form.register('cgstAmount', {
                        onChange: (e) => {
                          if (e.target.value) form.setValue('cgstPercent', '');
                        }
                      })}
                      disabled={!!form.watch('cgstPercent')}
                    />
                  </div>
                </div>
              </div>
              <div className="flex-1 min-w-[200px]">
                <Label className="block text-sm font-semibold">Tax SGST</Label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      type="number"
                      placeholder="Tax Percent %"
                      className="w-full rounded border border-black px-3 py-1"
                      min="0"
                      max="100"
                      {...form.register('sgstPercent', {
                        onChange: (e) => {
                          if (e.target.value) form.setValue('sgstAmount', '');
                        }
                      })}
                      disabled={!!form.watch('sgstAmount')}
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      type="number"
                      placeholder="Tax Amount"
                      className="w-full rounded border border-black px-3 py-1"
                      min="0"
                      {...form.register('sgstAmount', {
                        onChange: (e) => {
                          if (e.target.value) form.setValue('sgstPercent', '');
                        }
                      })}
                      disabled={!!form.watch('sgstPercent')}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Row 6: Product Image */}
            <div className="mb-4">
              <Label className="block mb-2 font-bold">Product Image</Label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                ref={fileInputRef}
                className="hidden"
                id="banner-image-input"
              />
              <Button
                type="button"
                variant="outline"
                className="mb-2 flex items-center gap-2 bg-blue-500 text-white"
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
              >
                <span>Select Product Image</span>
                <UploadIcon className="w-4 h-4" />
              </Button>
              {uploading && <div className="text-blue-600 font-semibold">Uploading...</div>}
              {form.watch('image')?.url && (
                <div className="relative w-48 h-28 border rounded overflow-hidden mb-2">
                  <Image
                    src={form.watch('image').url}
                    alt="Promotinal Image Preview"
                    fill
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={handleDeleteImage}
                    className="absolute top-1 right-1 bg-white bg-opacity-80 rounded border border-black p-1 hover:bg-red-200"
                    title="Remove image"
                  >
                    <Trash2Icon className="w-5 h-5 text-red-600" />
                  </button>
                </div>
              )}
            </div>

            {/* Row 7: Product Title Line */}
            <div className="flex items-center gap-4 mb-2">
              <Label className="w-44">Product Title Line</Label>
              <Input className="rounded border border-black h-10 px-4 w-full" placeholder="Text input" {...form.register('productTitle')} />
            </div>

            {/* Row 8: Product Description */}
            <div className="flex items-center gap-4 mb-2">
              <Label className="w-44">Product Description</Label>
              <Textarea rows={4} className="rounded-md border border-black px-4 w-full" placeholder="Text input" {...form.register('productDescription')} />
            </div>

            {/* Save & Cancel Buttons */}
            <div className="flex justify-start mt-4 gap-4">
              <Button type="submit" className="bg-green-700 text-white rounded border border-black px-10 h-10">Data Save</Button>
              {editingId && (
                <Button
                  type="button"
                  className="bg-gray-400 text-white rounded border border-black px-10 h-10"
                  onClick={() => {
                    form.reset({
                      _id: undefined,
                      foodName: '',
                      category: '',
                      categoryType: '',
                      qtyType: '',
                      halfPrice: '',
                      fullPrice: '',
                      quarterPrice: '',
                      perPiecePrice: '',
                      cgstPercent: '',
                      cgstAmount: '',
                      sgstPercent: '',
                      sgstAmount: '',
                      image: { url: '', key: '' },
                      productTitle: '',
                      productDescription: '',
                    });
                    setEditingId(null);
                  }}
                >
                  Cancel Edit
                </Button>
              )}
            </div>
          </form>
        </Form>
      </Card>
      <Card className="overflow-x-auto p-6">
        <h2 className="text-lg font-semibold mb-4">Food Inventory</h2>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Food Name</TableHead>
                <TableHead>Category Type</TableHead>
                <TableHead>Quantity Type</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <RotateCw className="h-6 w-6 animate-spin" />
                      <span>Loading inventory...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No inventory items found
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item) => (
                  <TableRow key={item._id}>
                    <TableCell className="font-medium">{item.foodName}</TableCell>
                    <TableCell>{item.categoryType}</TableCell>
                    <TableCell>{item.qtyType}</TableCell>
                    <TableCell>
                      {new Date(item.lastUpdated).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(item)}
                          className="h-10 w-10 p-1 border-2 border-black"
                        >
                          <PencilLine className="text-black" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => { setViewItem(item); setViewModalOpen(true); }}
                          className="h-10 w-10 p-1 border-2 border-blue-500"
                          title="View Details"
                        >
                       <Eye/>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => { setShowDeleteModal(true); setItemToDelete(item._id); }}
                          className="h-10 w-10 p-1 border-2 border-red-500"
                        >
                          <Trash2/>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
      {/* View Details Modal (copied/adapted from FoodInventoryLog) */}
      {viewModalOpen && viewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="max-w-3xl w-full bg-white rounded-lg p-6 relative flex flex-col md:flex-row gap-6 h-fit overflow-y-auto">
            <button className="absolute top-2 right-2 text-xl font-bold" onClick={() => { setViewModalOpen(false); setViewItem(null); }}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            {/* Left: Product Image */}
            <div className="flex-shrink-0 flex flex-col items-center md:items-start w-full md:w-60">
              <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden mb-4 border">
                {viewItem.image?.url ? (
                  <img src={viewItem.image.url} alt="Product" className="object-cover w-full h-full" />
                ) : (
                  <span className="text-gray-400">No Image</span>
                )}
              </div>
              <span className="font-bold text-base text-center md:text-left">Product Image</span>
            </div>
            {/* Right: Product Details */}
            <div className="flex-1 flex flex-col gap-3">
              <div className="flex flex-row gap-2">
                <span className="font-semibold">Food Name:</span> <span>{viewItem.foodName || '-'}</span>
              </div>
              <div className="flex flex-row gap-2">
                <span className="font-semibold">Product Name:</span> <span>{viewItem.productTitle || '-'}</span>
              </div>
              <div className="flex flex-row gap-2">
                <span className="font-semibold">Product Description:</span> <span>{viewItem.productDescription || '-'}</span>
              </div>
              <div className="border-t border-black" />
              <div className="flex flex-col gap-2">
                <div>
                  <span className="font-semibold">Category Name:</span> <span>{viewItem.categoryName || '-'}</span>
                </div>
                <div>
                  <span className="font-semibold">Category Type:</span> <span>{viewItem.categoryType || '-'}</span>
                </div>
              </div>
              <div className="border-t border-black" />
              <div>
                <span className="font-semibold">Food Type Price:</span>
                <table className="table-auto border-collapse border-black mt-2 ml-3">
                  <tbody>
                    {viewItem.halfPrice && (
                      <tr>
                        <td className="border border-black px-2 py-2 font-semibold">Half</td>
                        <td className="border border-black px-2 py-2">₹{viewItem.halfPrice}</td>
                      </tr>
                    )}
                    {viewItem.fullPrice && (
                      <tr>
                        <td className="border border-black px-2 py-2 font-semibold">Full</td>
                        <td className="border border-black px-2 py-2">₹{viewItem.fullPrice}</td>
                      </tr>
                    )}
                    {viewItem.quarterPrice && (
                      <tr>
                        <td className="border border-black px-2 py-2 font-semibold">Quarter</td>
                        <td className="border border-black px-2 py-2">₹{viewItem.quarterPrice}</td>
                      </tr>
                    )}
                    {viewItem.perPiecePrice && (
                      <tr>
                        <td className="border border-black px-2 py-2 font-semibold">Per Piece</td>
                        <td className="border border-black px-2 py-2">₹{viewItem.perPiecePrice}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="border-t my-2 flex flex-col gap-4">
                <div className="border-t border-black">
                  <span className="font-semibold">Qty Type:</span> <span>{viewItem.qtyType || '-'}</span>
                </div>
                <div className="border-t border-black">
                  <span className="font-semibold">Tax CGST:</span> <span>{viewItem.cgstPercent ? `${viewItem.cgstPercent}%` : '-'} {viewItem.cgstAmount ? `(₹${viewItem.cgstAmount})` : ''}</span>
                </div>
                <div className="border-t border-black">
                  <span className="font-semibold">Tax SGST:</span> <span>{viewItem.sgstPercent ? `${viewItem.sgstPercent}%` : '-'} {viewItem.sgstAmount ? `(₹${viewItem.sgstAmount})` : ''}</span>
                </div>
              </div>
            </div>
            <button className="absolute bottom-2 right-2 border px-2 py-1 border-black rounded-md text-md bg-red-500 text-white font-bold" onClick={() => { setViewModalOpen(false); setViewItem(null); }}>Close</button>
          </div>
        </div>
      )}
      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Item</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this item?</p>
          <DialogFooter>
            <Button variant="secondary" onClick={cancelDelete}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FoodInventory;