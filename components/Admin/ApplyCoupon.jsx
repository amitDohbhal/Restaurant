import React, { useEffect, useState } from 'react';
import { Badge } from '../ui/badge';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '../ui/select';
import { X, Edit2, Trash2 } from 'lucide-react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '../ui/dialog';
import toast from "react-hot-toast"
const ApplyCoupon = ({ productData, productId }) => {
  const [coupons, setCoupons] = useState([]); // All available coupons
  // Only one coupon per product
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [productCouponEntries, setProductCouponEntries] = useState([]); // Only this product's coupon mapping
  const [products, setProducts] = useState([]); // All products
  const [editProductId, setEditProductId] = useState(null); // For editing
  const [deleteDialog, setDeleteDialog] = useState({ open: false, productId: null });
  const productTitle = productData?.title || "";

  // Fetch only this product's coupon mapping
  const fetchProductCouponEntries = async () => {
    if (!productId) return;
    try {
      const res = await fetch(`/api/productCoupon?productId=${productId}`);
      const data = await res.json();
      if (res.ok && data && data.productId) setProductCouponEntries([data]);
      else setProductCouponEntries([]);
    } catch {
      setProductCouponEntries([]);
    }
  };

  useEffect(() => {
    fetchProductCouponEntries();

    const fetchCoupons = async () => {
      setLoading(true);
      try {
        // Fetch all available coupons
        const res = await fetch('/api/discountCoupon');
        const data = await res.json();
        if (Array.isArray(data)) setCoupons(data);
      } catch (err) {
        // handle error
      } finally {
        setLoading(false);
      }
    };


    // Fetch all product-coupon mappings for table
    const fetchAllProductCoupons = async () => {
      try {
        const res = await fetch('/api/productCoupon');
        const data = await res.json();
        setAllProductCoupons(Array.isArray(data) ? data : []);
      } catch (err) {

      }
    };

    // Fetch all products (for product name lookup)
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/product'); // You may need to implement this endpoint if not present
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : []);
      } catch (err) {
        setProducts([]);
      }
    };

    fetchAllProductCoupons();

    fetchCoupons();
    fetchProducts();
  }, []);

  useEffect(() => {
    if (!editProductId) return;
    const fetchProductCoupon = async () => {
      try {
        const res = await fetch(`/api/productCoupon?productId=${editProductId}`);
        const data = await res.json();
        setSelectedCoupon(data.coupon || null);
      } catch (err) {
        setSelectedCoupon(null);
      }
    };
    fetchProductCoupon();
  }, [editProductId]);

  useEffect(() => {
    if (editProductId === null) {
      setSelectedCoupon(null);
    }
  }, [editProductId]);

  const handleSelectCoupon = (couponCode) => {
    setSelectedCoupon({
      couponCode,
    });
  };

  const handleRemoveCoupon = () => {
    setSelectedCoupon(null);
  };

  return (
    <div className="space-y-6 w-full mx-auto">
      <div className="w-[80%] mx-auto">

        <div>
          <label className="block text-sm font-medium mb-1">Product Name</label>
          <input
            className="w-full border rounded px-3 py-2 bg-gray-50 text-gray-700"
            value={productTitle || 'N/A'}
            readOnly
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Select Discount Coupon</label>
          <Select onValueChange={handleSelectCoupon}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={loading ? 'Loading...' : 'Select coupon'} />
            </SelectTrigger>
            <SelectContent>
              {(Array.isArray(coupons) && coupons.length === 0) && (
                <div className="p-2 text-gray-400">No coupons found</div>
              )}
              {(Array.isArray(coupons) ? coupons : []).map(coupon => (
                <SelectItem key={coupon._id} value={coupon.couponCode} disabled={selectedCoupon?.couponCode === coupon.couponCode}>
                  {coupon.couponCode} {coupon.percent ? `(${coupon.percent}% off)` : coupon.amount ? `(-₹${coupon.amount})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedCoupon && (
            <div className="flex flex-col gap-2 mt-2">
              <div className="flex flex-wrap items-center gap-2 border p-2 rounded bg-gray-50">
                <Badge variant="secondary" className="flex items-center gap-1 pr-1">
                  {selectedCoupon.couponCode}
                  <button className="ml-1" onClick={handleRemoveCoupon}>
                    <X size={12} />
                  </button>
                </Badge>
              </div>
            </div>
          )}
        </div>
        <div>
          <button
            className="mt-4 px-4 py-2 rounded bg-primary text-white hover:bg-primary/80 disabled:opacity-60"
            disabled={saving || !(editProductId || productId)}
            onClick={async () => {
              setSaving(true);
              try {
                // Validate coupon before sending
                const couponObj = coupons.find(c => c.couponCode === selectedCoupon.couponCode) || {};
                const couponPayload = {
                  couponCode: selectedCoupon.couponCode,
                  startDate: couponObj.startDate,
                  endDate: couponObj.endDate,
                  percent: couponObj.percent,
                  amount: couponObj.amount
                };
                const payload = { productId: editProductId || productId, coupon: couponPayload };
                const res = await fetch('/api/productCoupon', {
                  method: editProductId ? 'PATCH' : 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(payload),
                });
                const data = await res.json();
                if (res.ok) {
                  toast.success('Coupons saved!');
                  setEditProductId(null);
                  setSelectedCoupon(null);
                  // Refresh table after update or create
                  await fetchProductCouponEntries();

                } else {
                  toast.error(data.error || 'Failed to save coupon');
                }
              } catch (err) {
                toast.error('Failed to save coupon');
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? (editProductId ? 'Updating...' : 'Saving...') : (editProductId ? 'Update Coupons' : 'Save Coupons')}
          </button>
          {editProductId && (
            <button
              className="ml-2 px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
              onClick={() => {
                setEditProductId(null);
                setSelectedCoupon(null);
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </div>
      {/* Table of this product's coupon mapping only */}
      <div className="mt-10 w-[80%] mx-auto overflow-x-auto" >
        <h3 className="font-semibold mb-2">Product Coupon</h3>
        <table className="min-w-full border text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">S.No</th>
              <th className="border p-2">Product Name</th>
              <th className="border p-2">Coupons</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>
          {productCouponEntries.filter(row => !!row.coupon).length > 0 && (
            <tbody>
              {productCouponEntries.filter(row => !!row.coupon).map((row, idx) => {
                const prod = products.find(p => p._id === row.productId) || {};
                return (
                  <tr key={row.productId}>
                    <td className="border p-2 text-center">{idx + 1}</td>
                    <td className="border p-2 text-center">{prod.title || "N/A"}</td>
                    <td className="border p-2 text-center">
                      <div className="flex flex-wrap gap-1 justify-center">
                        {row.coupon ? (
                          <Badge variant="secondary">{row.coupon.couponCode}</Badge>
                        ) : (
                          <span className="text-gray-400">No coupon</span>
                        )}
                      </div>
                    </td>
                    <td className="border p-2 text-center">
                      <button className="mr-2 text-blue-600 bg-blue-600 hover:bg-blue-700 text-white border rounded-2 px-2 py-1 rounded font-semibold" title="Edit" onClick={() => {
                        setEditProductId(row.productId);
                      }}>Edit</button>
                      <Dialog open={deleteDialog.open && deleteDialog.productId === row.productId} onOpenChange={open => setDeleteDialog({ open, productId: open ? row.productId : null })}>
                        <DialogTrigger asChild>
                          <button className="text-red-600 bg-red-600 hover:bg-red-700 text-white border rounded-2 px-2 py-1 rounded font-semibold" title="Delete" onClick={() => setDeleteDialog({ open: true, productId: row.productId })}>Delete</button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Delete Coupon</DialogTitle>
                          </DialogHeader>
                          <div className="my-4">Are you sure you want to delete coupons for <b>{prod.title || prod.name || row.productId}</b>?</div>
                          <DialogFooter>
                            <button className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300" onClick={() => setDeleteDialog({ open: false, productId: null })}>Cancel</button>
                            <button
                              className="ml-2 px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
                              disabled={saving}
                              onClick={async () => {
                                setSaving(true);
                                try {
                                  const res = await fetch('/api/productCoupon', {
                                    method: 'DELETE',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ productId: row.productId })
                                  });
                                  const data = await res.json();
                                  if (res.ok) {
                                    toast.success('Coupon deleted!');
                                    setDeleteDialog({ open: false, productId: null });
                                    // Refresh table
                                    // Re-fetch only this product's coupon
                                    const res2 = await fetch(`/api/productCoupon?productId=${productId}`);
                                    const data2 = await res2.json();
                                    if (res2.ok && data2 && data2.productId) setProductCouponEntries([data2]);
                                    else setProductCouponEntries([]);
                                  } else {
                                    toast.error(data.error || 'Failed to delete coupon');
                                  }
                                } catch (err) {
                                  toast.error('Failed to delete coupon');
                                } finally {
                                  setSaving(false);
                                }
                              }}
                            >
                              {saving ? 'Deleting...' : 'Delete'}
                            </button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          )}
          </table>
      </div>
    </div>


  );
}

export default ApplyCoupon