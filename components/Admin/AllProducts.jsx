"use client";
import React, { useState } from "react";
import toast from "react-hot-toast";
import {
  Bell,
  UserCircle,
  Search,
  Edit,
  Trash2,
  ChevronDown,
} from "lucide-react";

import { useEffect } from "react";

const AllProducts = () => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [productType, setProductType] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [stockStatus, setStockStatus] = useState("");
  const [sort, setSort] = useState("");
  const [date, setDate] = useState("");
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");

  const [products, setProducts] = useState([]);
  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  // console.log(products)
  // Dynamic artisans from products
  const artisanObjs = Array.from(
    new Map(products.filter(p => p.artisan && typeof p.artisan === 'object')
      .map(p => [p.artisan._id, p.artisan])).values()
  );

  // Submenu filter state
  const [submenu, setSubmenu] = useState("");

  // Fetch categories (with subMenu.products) and build submenuObjs
  const [categoryObjs, setCategoryObjs] = useState([]);
  const [submenuObjs, setSubmenuObjs] = useState([]);
  // console.log(categoryObjs)
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Always fetch categories (with populated products)
        const catRes = await fetch("/api/getAllMenuItems");
        const categories = await catRes.json();
        setCategoryObjs(Array.isArray(categories) ? categories : []);

        // Build flat array of all submenus, each with parent title and submenu id
        let submenus = [];
        categories.forEach(cat => {
          if (Array.isArray(cat.subMenu)) {
            cat.subMenu.forEach(sub => {
              submenus.push({
                ...sub,
                parentTitle: cat.title,
                parentId: cat._id,
                submenuId: sub._id || sub.title // fallback if _id missing
              });
            });
          }
        });
        setSubmenuObjs(submenus);

        if (submenu) {
          // Find selected submenu
          const selected = submenus.find(s => s.submenuId === submenu);
          setProducts((selected && Array.isArray(selected.products)) ? selected.products : []);
        } else {
          // No submenu selected: show all products
          const prodRes = await fetch("/api/product");
          const allProducts = await prodRes.json();
          setProducts(allProducts || []);
        }
      } catch (err) {
        setCategoryObjs([]);
        setProducts([]);
        setSubmenuObjs([]);
      }
    };
    fetchData();
  }, [submenu]);

  const handleReset = () => {
    setSearch("");
    setSubmenu("");
    setProductType("");
    setMinPrice("");
    setMaxPrice("");
    setStockStatus("");
    setSort("");
    setDate("");
    setDay("");
    setMonth("");
    setYear("");
  };

  // Filtering logic
  const filteredProducts = Array.isArray(products) ? products.filter((p) => {
    let match = true;
    if (search) {
      const searchTerm = search.toLowerCase();
      match =
        (p.title && p.title.toLowerCase().includes(searchTerm)) ||
        (p.name && p.name.toLowerCase().includes(searchTerm)) ||
        (p.code && p.code.toLowerCase().includes(searchTerm)) ||
        (p.sku && p.sku.toLowerCase().includes(searchTerm))
    }
    if (category && match) match = p.categoryTag && p.categoryTag._id === category;
    if (productType && match) match = (p.isDirect ? "Direct" : "Category") === productType;
    if (stockStatus && match) {
      const inStock = Array.isArray(p?.quantity?.variants) && p.quantity.variants.length > 0 && p.quantity.variants[0].qty > 0;
      match = (inStock ? "In Stock" : "Out of Stock") === stockStatus;
    }
    if (minPrice && match && p.price) match = p.price >= Number(minPrice);
    if (maxPrice && match && p.price) match = p.price <= Number(maxPrice);
    return match;
  }) : [];

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sort === "newest") return b.id.localeCompare(a.id);
    if (sort === "oldest") return a.id.localeCompare(b.id);
    if (sort === "priceLow") return a.price - b.price;
    if (sort === "priceHigh") return b.price - a.price;
    return 0;
  });
  // console.log(sortedProducts)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Filter Bar */}
      <div className="w-full max-w-7xl bg-white px-4 py-4 shadow flex flex-wrap gap-3 items-center justify-between border-b">
        <div className="flex flex-wrap gap-3 items-center flex-1">
          <div className="relative">
            <input
              type="text"
              className="px-3 py-2 border rounded bg-gray-100 focus:outline-none min-w-[200px]"
              placeholder="Search by name, SKU, or code"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="px-3 py-2 border rounded bg-gray-100 focus:outline-none min-w-[220px]"
            value={submenu}
            onChange={(e) => setSubmenu(e.target.value)}
          >
            <option value="">All Submenus</option>
            {submenuObjs.map((s) => (
              <option key={s.submenuId} value={s.submenuId}>
                {s.parentTitle ? `${s.parentTitle} - ${s.title}` : s.title}
              </option>
            ))}
          </select>
          {/* Product Type Filter */}
          <select
            className="px-3 py-2 border rounded bg-gray-100 focus:outline-none min-w-[120px]"
            value={productType}
            onChange={(e) => setProductType(e.target.value)}
          >
            <option value="">All Types</option>
            <option value="Direct">Direct Product</option>
            <option value="Category">Category Product</option>
          </select>
          {/* Artisan Name Filter */}
          <select
            className="px-3 py-2 border rounded bg-gray-100 focus:outline-none min-w-[120px]"
            value={stockStatus}
            onChange={(e) => setStockStatus(e.target.value)}
          >
            <option value="">All Stock Status</option>
            <option value="In Stock">In Stock</option>
            <option value="Out of Stock">Out of Stock</option>
          </select>
          {/* <select
            className="px-3 py-2 border rounded bg-gray-100 focus:outline-none min-w-[160px]"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="">Sort By</option>
            {sortOptions.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select> */}
        </div>
        <div className="flex gap-2 mt-3 md:mt-0">
          <button
            className="px-4 py-2 rounded bg-blue-500 text-white font-medium"
            onClick={handleReset}
          >
            Reset Filters
          </button>
        </div>
      </div>
      {/* Products Table */}
      <div className="flex-1 overflow-x-auto p-4">
        <table className="min-w-full bg-white rounded-lg shadow overflow-hidden text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Image</th>
              <th className="p-3 text-left">Product Name</th>
              <th className="p-3 text-left">ID</th>
              <th className="p-3 text-center">Price</th>
              <th className="p-3 text-center">Stock</th>
              <th className="p-3 text-center">Type</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedProducts.map((product, idx) => (
              <tr
                key={
                  (typeof product._id === 'string' && product._id) ||
                    (typeof product._id === 'object' && product._id !== null && product._id.toString) ? product._id.toString() :
                    (typeof product.id === 'string' && product.id) ||
                      (typeof product.id === 'object' && product.id !== null && product.id.toString) ? product.id.toString() :
                      `row-${idx}`
                }
                className="border-b hover:bg-blue-50 transition-colors"
              >
                <td className="p-3">
                  <img
                    src={
                      (product.gallery && product.gallery.mainImage && product.gallery.mainImage.url)
                        ? product.gallery.mainImage.url
                        : (Array.isArray(product.gallery?.subImages) && product.gallery.subImages.length > 0 && product.gallery.subImages[0] && product.gallery.subImages[0].url)
                          ? product.gallery.subImages[0].url
                          : "/placeholder.jpeg"
                    }
                    alt={product.title || product.code || "Product"}
                    className="w-14 h-14 rounded border object-cover shadow-sm bg-white"
                  />
                </td>
                <td className="p-3 font-semibold">{product.title || 'No Title'}</td>
                <td className="p-3 font-mono text-xs">{product.code || (typeof product._id === 'string' ? product._id : (product._id && product._id.toString ? product._id.toString() : '-'))}</td>
                <td className="p-3 text-center">
                  ₹ {
                    Array.isArray(product?.quantity?.variants) && product.quantity.variants.length > 0 && product.quantity.variants[0].price
                      ? product.quantity.variants[0].price
                      : 'No Price'
                  }
                </td>
                <td className="p-3 text-center">
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold
    ${Array.isArray(product?.quantity?.variants) && product.quantity.variants.length > 0 && product.quantity.variants[0].qty > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}
  `}
                  >
                    {Array.isArray(product?.quantity?.variants) && product.quantity.variants.length > 0 && product.quantity.variants[0].qty > 0 ? "In Stock" : "Out of Stock"}
                  </span>
                </td>
                <td className="p-3 text-center">{product.isDirect ? "Direct" : "Category"}</td>
                <td className="p-3 text-center flex gap-2 justify-center">
                  <button
                    className="p-2 rounded hover:bg-red-100"
                    title="Delete"
                    onClick={() => {
                      setDeleteTarget(product._id);
                      setShowDeleteModal(true);
                    }}
                  >
                    <Trash2 className="text-red-600" size={20} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Delete Confirmation Dialog */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
            <h2 className="text-lg font-semibold mb-4">Confirm Delete</h2>
            <p className="mb-6">Are you sure you want to delete this product? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 font-medium"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteTarget(null);
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 font-medium"
                onClick={async () => {
                  if (!deleteTarget) return;
                  try {
                    const res = await fetch(`/api/product/${deleteTarget}`, { method: 'DELETE' });
                    if (res.ok) {
                      setProducts(prev => prev.filter(p => p._id !== deleteTarget));
                      toast.success('Product deleted successfully');
                    } else {
                      const err = await res.json().catch(() => ({}));
                      toast.error('Failed to delete product: ' + (err.error || 'Unknown error'));
                    }
                  } catch {
                    toast.error('Failed to delete product');
                  }
                  setShowDeleteModal(false);
                  setDeleteTarget(null);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AllProducts;