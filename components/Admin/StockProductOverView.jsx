"use client"
import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { X } from 'lucide-react';

const StockProductOverView = () => {
  const [inventoryList, setInventoryList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [search, setSearch] = useState('');
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Fetch products for filter
  useEffect(() => {
    fetch('/api/stockProduct')
      .then(res => res.json())
      .then(data => setProducts(Array.isArray(data) ? data : []));
  }, []);

  // Fetch inventory list
  const fetchInventoryList = () => {
    let url = '/api/stockInventory?';
    if (selectedProduct) {
      url += `search=${encodeURIComponent(selectedProduct)}&`;
    }
    if (search) url += `search=${encodeURIComponent(search)}&`;
    fetch(url)
      .then(res => res.json())
      .then(data => setInventoryList(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (selectedProduct) {
      setLoading(true);
      fetchInventoryList();
    } else {
      setInventoryList([]);
      setLoading(false);
    }
    // eslint-disable-next-line
  }, [selectedProduct, search]);

  // Delete handler
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

  return (
    <div className="w-full mx-auto p-1">
      <div className="mb-6 flex flex-wrap gap-4 items-center bg-gray-200 border border-black p-2">
        <select
          className="border border-gray-400 rounded-md w-1/2 h-10 px-3"
          value={selectedProduct}
          onChange={e => setSelectedProduct(e.target.value)}
        >
          <option value="">Select Product</option>
          {products.map(prod => (
            <option key={prod._id} value={prod.productName}>{prod.productName}</option>
          ))}
        </select>
        <button
          type="button"
          className="bg-green-600 text-white px-4 py-2 rounded mr-4 print:hidden"
          onClick={() => window.print()}
          disabled={!selectedProduct || loading || inventoryList.length === 0}
        >
          Print Table
        </button>
        {/* <input
          type="text"
          className="border border-gray-400 rounded-md h-10 px-3"
          placeholder="Search by product name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        /> */}
      </div>
        <table className="w-full border border-black overflow-hidden">
          <thead className="bg-gray-200 border">
            <tr>
              <th className="py-2 px-4 text-center border border-black">Date</th>
              <th className="py-2 px-4 text-center border border-black">Opening Stock</th>
              <th className="py-2 px-4 text-center border border-black">Qty In</th>
              <th className="py-2 px-4 text-center border border-black">Qty Out</th>
              <th className="py-2 px-4 text-center border border-black">Current Qty</th>
              <th className="py-2 px-4 text-center border border-black print:hidden">Action</th>
            </tr>
          </thead>
          <tbody>
            {selectedProduct ? (
              loading ? (
                <tr><td colSpan={6} className="text-center py-6"><span className="animate-spin inline-block mr-2"></span><span className="sr-only">Loading...</span></td></tr>
              ) : inventoryList.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-6">No data</td></tr>
              ) : (
                inventoryList.map(item => (
                  <tr key={item._id} className="border border-black hover:bg-gray-100">
                    <td className="py-2 px-4 text-center border border-black">{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}</td>
                    <td className="py-2 px-4 text-center border border-black">{item.openingStock || 'N/A'}</td>
                    <td className="py-2 px-4 text-center border border-black">{item.stockIn || 'N/A'}</td>
                    <td className="py-2 px-4 text-center border border-black">{item.stockOut || 'N/A'}</td>
                    <td className="py-2 px-4 text-center border border-black">{item.finalStockQty || 'N/A'} {item.qtyType}</td>
                    <td className="py-2 px-4 flex gap-2 justify-center print:hidden">
                      <button onClick={() => handleView(item)} className="bg-blue-500 text-white px-3 py-1 rounded">View</button>
                      <button onClick={() => handleDelete(item._id)} className="bg-red-600 text-white px-3 py-1 rounded">Delete</button>
                    </td>
                  </tr>
                ))
              )
            ) : (
              <tr><td colSpan={6} className="text-center py-6">Select any product to show its data</td></tr>
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
              <div className="border rounded p-3 bg-gray-50"><b>Date:</b><div className="mt-1">{selectedItem.createdAt ? new Date(selectedItem.createdAt).toLocaleDateString() : ''}</div></div>
              <div className="border rounded p-3 bg-gray-50"><b>Product Name:</b><div className="mt-1">{selectedItem.productName || 'N/A'}</div></div>
              <div className="border rounded p-3 bg-gray-50"><b>Category:</b><div className="mt-1">{selectedItem.category || 'N/A'}</div></div>
              <div className="border rounded p-3 bg-gray-50"><b>Vendor:</b><div className="mt-1">{selectedItem.vendor || 'N/A'}</div></div>
              <div className="border rounded p-3 bg-gray-50"><b>Opening Stock:</b><div className="mt-1">{selectedItem.openingStock || 'N/A'}</div></div>
              <div className="border rounded p-3 bg-gray-50"><b>Qty Type:</b><div className="mt-1">{selectedItem.qtyType || 'N/A'}</div></div>
              <div className="border rounded p-3 bg-gray-50"><b>Qty In:</b><div className="mt-1">{selectedItem.stockIn || 'N/A'}</div></div>
              <div className="border rounded p-3 bg-gray-50"><b>Qty Out:</b><div className="mt-1">{selectedItem.stockOut || 'N/A'}</div></div>
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

export default StockProductOverView;