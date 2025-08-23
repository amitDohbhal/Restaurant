"use client"
"use client";
import React, { useEffect, useState } from 'react';
import { Controller } from 'react-hook-form';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '../ui/select';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { X } from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';

const StockInventory = () => {
  const [inventoryList, setInventoryList] = useState([]);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);

  // Fetch inventory list
  const fetchInventoryList = () => {
    fetch('/api/stockInventory')
      .then(res => res.json())
      .then(data => setInventoryList(Array.isArray(data) ? data : []));
  };
  useEffect(() => {
    fetchInventoryList();
  }, []);

  // Delete handler
  // Dialog state for delete confirmation
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const handleDelete = (id) => {
    setItemToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    const res = await fetch(`/api/stockInventory`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: itemToDelete }),
    });
    if (res.ok) {
      setInventoryList(prev => prev.filter(item => item._id !== itemToDelete));
      toast.success('Deleted successfully');
    } else {
      toast.error('Delete failed');
    }
    setShowDeleteModal(false);
    setItemToDelete(null);
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setItemToDelete(null);
  };

  // View handler
  const handleView = (item) => {
    setSelectedItem(item);
    setViewModalOpen(true);
  };

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [vendors, setVendors] = useState([]);
  useEffect(() => {
    fetch('/api/stockCategory')
      .then((res) => res.json())
      .then((data) => setCategories(data || []));
    fetch('/api/stockProduct')
      .then((res) => res.json())
      .then((data) => setProducts(data || []));
    fetch('/api/createVendor')
      .then((res) => res.json())
      .then((data) => setVendors(data || []));
  }, []);

  const { register, handleSubmit, reset, watch, setValue } = useForm({
    // We'll use reset() to fill form for editing

    defaultValues: {
      category: '',
      productName: '',
      qtyType: '',
      openingStock: '',
      stockIn: '',
      stockInDate: '',
      vendor: '',
      invoice: '',
      stockOut: '',
      stockOutDate: '',
      useType: '',
      finalStockDate: '',
      finalStockQty: '',
      finalStockQtyType: '',
    },
  });
  // Automatically set qtyType when productName changes
  const selectedProductName = watch('productName');
  const openingStock = Number(watch('openingStock')) || 0;
  const stockIn = Number(watch('stockIn')) || 0;
  const stockOut = Number(watch('stockOut')) || 0;

  // Auto-calculate final stock balance and date
  useEffect(() => {
    // Calculate current date in yyyy-mm-dd
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const formattedDate = `${yyyy}-${mm}-${dd}`;
    setValue('finalStockDate', formattedDate);
    setValue('finalStockQty', openingStock + stockIn - stockOut);
    setValue('finalStockQtyType', watch('qtyType'));
  }, [openingStock, stockIn, stockOut, setValue, watch]);
  useEffect(() => {
    if (selectedProductName && products.length > 0) {
      const selectedProduct = products.find(
        (prod) => prod.productName === selectedProductName
      );
      if (selectedProduct) {
        // Set qtyType
        if (selectedProduct.quantity) {
          setValue('qtyType', selectedProduct.quantity);
        } else {
          setValue('qtyType', '');
        }
        // Set openingStock
        if (selectedProduct.openingStock !== undefined && selectedProduct.openingStock !== null) {
          setValue('openingStock', selectedProduct.openingStock);
        } else {
          setValue('openingStock', '');
        }
      } else {
        setValue('qtyType', '');
        setValue('openingStock', '');
      }
    }
  }, [selectedProductName, products, setValue]);
  const onSubmit = async (data) => {
    // If editing, PATCH instead of POST
    if (editMode && editId) {
      // Validation (same as before)
      if (!data.category) {
        toast.error('Category name is required');
        return;
      }
      if (!data.productName) {
        toast.error('Product name is required');
        return;
      }
      if (!data.useType) {
        toast.error('Stock use for is required');
        return;
      }
      if (data.stockIn && !data.stockInDate) {
        toast.error('Stock In Date is required when Stock In is entered');
        return;
      }
      if (data.stockOut && !data.stockOutDate) {
        toast.error('Stock Out Date is required when Stock Out is entered');
        return;
      }
      if (Number(data.stockOut) > Number(data.openingStock)) {
        toast.error('Stock Out cannot be greater than current balance');
        return;
      }
      try {
        const res = await fetch(`/api/stockInventory?id=${editId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (res.ok) {
          toast.success('Stock Inventory Updated');
          reset();
          setEditMode(false);
          setEditId(null);
          fetchInventoryList();
        } else {
          const err = await res.json();
          toast.error(err.error || 'Update failed');
        }
      } catch (e) {
        toast.error('Error updating data');
      }
      return;
    }

    // Validation
    if (!data.category) {
      toast.error('Category name is required');
      return;
    }
    if (!data.productName) {
      toast.error('Product name is required');
      return;
    }
    if (!data.useType) {
      toast.error('Stock use for is required');
      return;
    }
    if (data.stockIn && !data.stockInDate) {
      toast.error('Stock In Date is required when Stock In is entered');
      return;
    }
    if (data.stockOut && !data.stockOutDate) {
      toast.error('Stock Out Date is required when Stock Out is entered');
      return;
    }
    // Custom validation: stockOut cannot be greater than current balance
    if (Number(data.stockOut) > Number(data.openingStock)) {
      toast.error('Stock Out cannot be greater than current balance');
      return;
    }
    try {
      const res = await fetch('/api/stockInventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        toast.success('Stock Inventory Saved');
        reset();
        fetchInventoryList();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Save failed');
      }
    } catch (e) {
      toast.error('Error saving data');
    }
  };
  // Handle edit button click
  function handleEdit(item) {
    setEditMode(true);
    setEditId(item._id);
    // Fill the form with item's data
    reset({
      category: item.category || '',
      productName: item.productName || '',
      qtyType: item.qtyType || '',
      openingStock: item.openingStock || '',
      stockIn: item.stockIn || '',
      stockInDate: item.stockInDate ? item.stockInDate.slice(0, 10) : '',
      vendor: item.vendor || '',
      invoice: item.invoice || '',
      stockOut: item.stockOut || '',
      stockOutDate: item.stockOutDate ? item.stockOutDate.slice(0, 10) : '',
      useType: item.useType || '',
      finalStockDate: item.finalStockDate ? item.finalStockDate.slice(0, 10) : '',
      finalStockQty: item.finalStockQty || '',
      finalStockQtyType: item.finalStockQtyType || '',
    });
  }
  return (
    <div className="max-w-4xl mx-auto p-6">
      <form className="bg-white border border-gray-300 rounded-lg shadow-md p-6 space-y-8" onSubmit={handleSubmit(onSubmit)}>
        {/* Section: Basic Info */}
        <div>
          <h3 className="text-lg font-bold text-gray-700 mb-4">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block font-semibold mb-1">Category Name <span className="text-red-500">*</span></label>
              <select {...register('category')} className="w-full border border-gray-400 rounded-md h-10 px-3 focus:ring-2 focus:ring-green-600">
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat.categoryName}>{cat.categoryName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Product Name <span className="text-red-500">*</span></label>
              <select {...register('productName')} className="w-full border border-gray-400 rounded-md h-10 px-3 focus:ring-2 focus:ring-green-600">
                <option value="">Select Product Name</option>
                {products.map((prod) => (
                  <option key={prod._id} value={prod.productName}>{prod.productName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Qty Type</label>
              <input {...register('qtyType')} type="text" placeholder="Product Qty Type" className="w-full border border-gray-400 rounded-md h-10 px-3 bg-white" readOnly />
            </div>
            <div>
              <label className="block font-semibold mb-1">Current Balance Stock</label>
              <input readOnly {...register('openingStock')} type="text" placeholder="Type Input" className="w-full border border-gray-400 rounded-md h-10 px-3 bg-white" />
            </div>
          </div>
        </div>
        {/* Section: Stock In/Out */}
        <div>
          <h3 className="text-lg font-bold text-gray-700 mb-4">Stock Movement</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block font-semibold mb-1">Stock In</label>
              <div className="flex gap-2">
                <input {...register('stockIn')} type="number" placeholder="Qty" className="w-1/2 border border-gray-400 rounded-md h-10 px-3" />
                <input {...register('stockInDate')} type="date" className="w-1/2 border border-gray-400 rounded-md h-10 px-3" />
              </div>
            </div>
            <div>
              <label className="block font-semibold mb-1">Stock Out</label>
              <div className="flex gap-2">
                <input {...register('stockOut')} type="number" placeholder="Qty" className="w-1/2 border border-gray-400 rounded-md h-10 px-3" />
                <input {...register('stockOutDate')} type="date" className="w-1/2 border border-gray-400 rounded-md h-10 px-3" />
              </div>
            </div>
            <div>
              <label className="block font-semibold mb-1">Vendor</label>
              <select {...register('vendor')} className="w-full border border-gray-400 rounded-md h-10 px-3">
                <option value="">Select Vendor</option>
                {vendors.flatMap((item) =>
                  item.vendors.map((ven) => (
                    <option key={ven._id} value={ven.vendorName}>{ven.vendorName}</option>
                  ))
                )}
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Invoice</label>
              <input {...register('invoice')} type="text" placeholder="Type Invoice Number" className="w-full border border-gray-400 rounded-md h-10 px-3" />
            </div>
            <div>
              <label className="block font-semibold mb-1">Stock Use For <span className="text-red-500">*</span></label>
              <select {...register('useType')} className="w-full border border-gray-400 rounded-md h-10 px-3">
                <option value="">Select Use Type</option>
                <option value="Personal">Personal</option>
                <option value="For Production">For Production</option>
                <option value="For Business">For Business</option>
              </select>
            </div>
          </div>
        </div>
        {/* Section: Final Stock */}
        <div>
          <h3 className="text-lg font-bold text-gray-700 mb-4">Final Stock Balance</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block font-semibold mb-1">Date</label>
              <input {...register('finalStockDate')} type="date" placeholder="Current Date" className="w-full border border-gray-400 rounded-md h-10 px-3 bg-white font-semibold" readOnly />
            </div>
            <div>
              <label className="block font-semibold mb-1">Current Qty</label>
              <input {...register('finalStockQty')} type="text" placeholder="Current Qty" className="w-full border border-gray-400 rounded-md h-10 px-3 bg-white font-semibold" readOnly />
            </div>
            <div>
              <label className="block font-semibold mb-1">Qty Type</label>
              <input {...register('finalStockQtyType')} type="text" placeholder="Qty Type" className="w-full border border-gray-400 rounded-md h-10 px-3 bg-white font-semibold" readOnly />
            </div>
          </div>
        </div>
        {/* Save Button */}
        <div className="flex justify-center mt-10 gap-5">
          <button type="submit" className="bg-green-700 hover:bg-green-800 transition text-white rounded px-16 py-2 text-xl font-bold shadow">Data Save</button>
        {editMode && (
            <button type="button" className="bg-gray-300 px-3 py-2 rounded" onClick={() => { setEditMode(false); setEditId(null); reset(); }}>Cancel Edit</button>
        )}
        </div>
      </form>
      {/* Inventory Table */}
      <h2 className="text-xl font-bold my-4">Stock Inventory List</h2>
      <table className="w-full border border-black overflow-hidden">
        <thead className="bg-gray-200 border">
          <tr>
            <th className="py-2 px-4 text-center border border-black">Date</th>
            <th className="py-2 px-4 text-center border border-black">Opening Stock</th>
            <th className="py-2 px-4 text-center border border-black">Qty In</th>
            <th className="py-2 px-4 text-center border border-black">Qty Out</th>
            <th className="py-2 px-4 text-center border border-black">Current Qty</th>
            <th className="py-2 px-4 text-center border border-black">Action</th>
          </tr>
        </thead>
        <tbody>
          {inventoryList.length === 0 ? (
            <tr><td colSpan={6} className="text-center py-6">No data</td></tr>
          ) : (
            inventoryList.map(item => (
              <tr key={item._id} className="border border-black hover:bg-gray-100">
                <td className="py-2 px-4 text-center border border-black">{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}</td>
                <td className="py-2 px-4 text-center border border-black">{item.openingStock || 'N/A'}</td>
                <td className="py-2 px-4 text-center border border-black">{item.stockIn || 'N/A'}</td>
                <td className="py-2 px-4 text-center border border-black">{item.stockOut || 'N/A'}</td>
                <td className="py-2 px-4 text-center border border-black">{item.finalStockQty || 'N/A'} {item.qtyType}</td>
                <td className="py-2 px-4 flex gap-2 justify-center">
                  <button onClick={() => handleView(item)} className="bg-blue-500 text-white px-3 py-1 rounded">View</button>
                  <button onClick={() => handleEdit(item)} className="bg-yellow-500 text-white px-3 py-1 rounded">Edit</button>
                  <button onClick={() => handleDelete(item._id)} className="bg-red-600 text-white px-3 py-1 rounded">Delete</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      {/* View Modal */}
      {viewModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="relative bg-white p-8 rounded-lg w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold mb-4">Stock Inventory Details</h3>
            <button onClick={() => setViewModalOpen(false)} className="absolute top-2 right-2 bg-gray-700 text-white p-1 rounded-full"><X /></button>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Row 1: Date and Product Name */}
              <div className="border rounded p-3 bg-gray-50"><b>Date:</b><div className="mt-1">{selectedItem.createdAt ? new Date(selectedItem.createdAt).toLocaleDateString() : ''}</div></div>
              <div className="border rounded p-3 bg-gray-50"><b>Product Name:</b><div className="mt-1">{selectedItem.productName || 'N/A'}</div></div>
              {/* Row 2: Category and Vendor */}
              <div className="border rounded p-3 bg-gray-50"><b>Category:</b><div className="mt-1">{selectedItem.category || 'N/A'}</div></div>
              <div className="border rounded p-3 bg-gray-50"><b>Vendor:</b><div className="mt-1">{selectedItem.vendor || 'N/A'}</div></div>
              {/* Row 3: Opening Stock and Qty Type */}
              <div className="border rounded p-3 bg-gray-50"><b>Opening Stock:</b><div className="mt-1">{selectedItem.openingStock || 'N/A'}</div></div>
              <div className="border rounded p-3 bg-gray-50"><b>Qty Type:</b><div className="mt-1">{selectedItem.qtyType || 'N/A'}</div></div>
              {/* Row 4: Qty In and Qty Out */}
              <div className="border rounded p-3 bg-gray-50"><b>Qty In:</b><div className="mt-1">{selectedItem.stockIn || 'N/A'}</div></div>
              <div className="border rounded p-3 bg-gray-50"><b>Qty Out:</b><div className="mt-1">{selectedItem.stockOut || 'N/A'}</div></div>
              {/* Row 5: Current Qty and Invoice */}
              <div className="border rounded p-3 bg-gray-50"><b>Current Qty:</b><div className="mt-1">{selectedItem.finalStockQty || 'N/A'}</div></div>
              <div className="border rounded p-3 bg-gray-50"><b>Invoice:</b><div className="mt-1">{selectedItem.invoice || 'N/A'}</div></div>
            </div>
            <button onClick={() => setViewModalOpen(false)} className="mt-6 bg-gray-700 text-white px-6 py-2 rounded">Close</button>
          </div>
        </div>
      )}
      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Inventory Item</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this inventory item?</p>
          <DialogFooter>
            <button className="bg-gray-200 px-4 py-2 rounded mr-2" onClick={cancelDelete}>Cancel</button>
            <button className="bg-red-600 text-white px-4 py-2 rounded" onClick={confirmDelete}>Delete</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};



export default StockInventory;