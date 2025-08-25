"use client"
import React, { useEffect, useState } from 'react';

// Inventory modal view for a product
const ProductInventoryView = ({ productName }) => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!productName) return;
    setLoading(true);
    fetch(`/api/stockInventory?search=${encodeURIComponent(productName)}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setInventory(data);
        else setInventory([]);
      })
      .catch(e => setError('Failed to fetch inventory'))
      .finally(() => setLoading(false));
  }, [productName]);

  if (loading) return <div className="py-6 text-center">Loading inventory...</div>;
  if (error) return <div className="py-6 text-center text-red-500">{error}</div>;
  if (!inventory.length) return <div className="py-6 text-center">No inventory found for this product.</div>;

  // Show product name and qty balance (from first inventory entry)
  const main = inventory[0] || {};
  return (
    <>
      <div className="mb-4 flex flex-wrap gap-4 items-center">
        <div className="font-semibold text-base bg-gray-100 rounded px-3 py-2 border">
          Product Name: <span className="font-bold text-blue-700">{main.productName || productName || '-'}</span>
        </div>
        <div className="font-semibold text-base bg-gray-100 rounded px-3 py-2 border">
          Qty Balance: <span className="font-bold text-green-700">{main.finalStockQty ?? main.openingStock ?? 0} {main.finalStockQtyType ?? '-'}</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border border-gray-300 rounded shadow">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-2 py-1 border">Date</th>
              <th className="px-2 py-1 border">Stock In</th>
              <th className="px-2 py-1 border">Stock Out</th>
              <th className="px-2 py-1 border">Opening Stock</th>
              <th className="px-2 py-1 border">Final Qty</th>
              <th className="px-10 py-1 border">Vendor</th>
              <th className="px-10 py-1 border">Invoice</th>
          </tr>
        </thead>
        <tbody>
          {inventory.map((inv, idx) => (
            <tr key={inv._id || idx} className="hover:bg-gray-50">

              <td className="px-2 py-1 border text-center">{inv.finalStockDate ? new Date(inv.finalStockDate).toLocaleDateString() : '-'}</td>
              <td className="px-2 py-1 border text-center">{inv.stockIn ?? '-'}</td>
              <td className="px-2 py-1 border text-center">{inv.stockOut ?? '-'}</td>
              <td className="px-2 py-1 border text-center">{inv.openingStock ?? '-'}</td>
              <td className="px-2 py-1 border text-center">{inv.finalStockQty ?? '-'}</td>
              <td className="px-10 py-1 border text-center">{inv.vendor ?? '-'}</td>
              <td className="px-10 py-1 border text-center">{inv.invoice ?? '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </>
  );
};
const StockFinalOveriview = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch('/api/stockProduct')
      .then(res => res.json())
      .then(data => setProducts(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  const handleView = (product) => {
    setSelectedProduct(product);
    setViewModalOpen(true);
  };

  return (
    <div className="w-full mx-auto p-6">
      <table className="w-full border border-black overflow-hidden">
        <thead className="bg-gray-200 border">
          <tr>
            <th className="py-2 px-4 text-center border border-black">#</th>
            <th className="py-2 px-4 text-center border border-black">Product Name</th>
            <th className="py-2 px-4 text-center border border-black">Measurement Type</th>
            <th className="py-2 px-4 text-center border border-black">Qty Balance</th>
            <th className="py-2 px-4 text-center border border-black">Action</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={6} className="text-center py-6">Loading...</td></tr>
          ) : products.length === 0 ? (
            <tr><td colSpan={6} className="text-center py-6">No data</td></tr>
          ) : (
            products.map((prod, idx) => (
              <tr key={prod._id || idx} className="border border-black hover:bg-gray-100">
                <td className="py-2 px-4 text-center border border-black">{idx + 1}</td>
                <td className="py-2 px-4 text-center border border-black">{prod.productName || '-'}</td>
                <td className="py-2 px-4 text-center border border-black">{prod.quantity || '-'}</td>
                <td className="py-2 px-4 text-center border border-black">{prod.openingStock || 0} {prod.quantity || '-'}</td>
                <td className="py-2 px-4 flex gap-2 justify-center">
                  <button onClick={() => handleView(prod)} className="bg-blue-500 text-white px-3 py-1 rounded">View</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      {/* View Modal */}
      {viewModalOpen && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="relative bg-white p-8 rounded-lg w-full max-w-5xl shadow-xl max-h-[80vh] overflow-y-auto">
            <button onClick={() => setViewModalOpen(false)} className="absolute top-2 right-2 bg-gray-700 text-white px-2 rounded">✕</button>
            <h2 className="text-xl font-bold mb-4">Product Inventory Details</h2>
            <ProductInventoryView productName={selectedProduct.productName} />
            <button onClick={() => setViewModalOpen(false)} className="mt-6 bg-gray-700 text-white px-6 py-2 rounded">Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockFinalOveriview;