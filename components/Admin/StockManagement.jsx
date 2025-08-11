"use client"
import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Switch } from "../ui/switch";
import { Loader2, Eye, Trash2, QrCode, QrCodeIcon, ViewIcon, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "react-hot-toast";
import ProductQrModal from "./ProductQrModal";

const columns = [
  "Image",
  "Product Name",
  "Product ID",
  "Price",
  "Stock",
  "Artisan",
  "Actions"
];

function SearchIcon() {
  return (
    <svg width="18" height="18" fill="none" stroke="#222" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="M16.65 16.65L21 21" /></svg>
  );
}

const StockManagementPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [variantsModalOpen, setVariantsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 10,
    hasNextPage: false,
    hasPreviousPage: false
  });

  // Fetch products from API with pagination
  const fetchProducts = async (page = 1) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/product?page=${page}&limit=${pagination.limit}`);
      const data = await response.json();
      if (response.ok) {
        setProducts(data.products || data); // Handle both paginated and non-paginated responses
        
        // If the response includes pagination data
        if (data.pagination) {
          setPagination({
            ...pagination,
            currentPage: data.pagination.currentPage || page,
            totalPages: data.pagination.totalPages || 1,
            totalItems: data.pagination.total || data.length || 0,
            hasNextPage: data.pagination?.hasNextPage || false,
            hasPreviousPage: data.pagination?.hasPreviousPage || false
          });
        }
      } else {
        toast.error(data.error || 'Failed to fetch products');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Error fetching products');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchProducts(pagination.currentPage);
  }, [pagination.currentPage]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchProducts(newPage);
    }
  };

  // Handle delete product
  const handleDelete = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        const response = await fetch(`/api/product/${productId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setProducts(products.filter(product => product._id !== productId));
          toast.success('Product deleted successfully');
        } else {
          toast.error('Failed to delete product');
        }
      } catch (error) {
        // console.error('Error deleting product:', error);
        toast.error('Error deleting product');
      }
    }
  };

  // Filter products based on search term
  const filteredProducts = products.filter(product =>
    product.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.artisan?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.categoryTag?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  // console.log(filteredProducts)
  const openQrModal = (product) => {
    setSelectedProduct(product);
    setQrModalOpen(true);
  };

  const getProductUrl = (product) => {
    return `${window.location.origin}/product/${product._id}`;
  };
  const [pendingChanges, setPendingChanges] = useState({});
  const [saving, setSaving] = useState(false);

  // Track quantity changes
  const handleQuantityChange = (productId, variantIndex, newQty) => {
    setPendingChanges(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [variantIndex]: newQty
      }
    }));
  };

  // Save all changes
  const saveAllChanges = async () => {
    if (Object.keys(pendingChanges).length === 0) {
      toast.info('No changes to save');
      return;
    }

    try {
      setSaving(true);
      const updates = [];
      
      // Prepare all updates
      for (const [productId, variants] of Object.entries(pendingChanges)) {
        for (const [index, qty] of Object.entries(variants)) {
          updates.push({
            productId,
            variantIndex: parseInt(index),
            newQty: qty
          });
        }
      }

      // Process updates sequentially
      for (const update of updates) {
        try {
          // console.log('Updating variant:', update);
          await updateVariantQty(update.productId, update.variantIndex, update.newQty);
        } catch (error) {
          // console.error(`Failed to update product ${update.productId}:`, error);
          toast.error(`Failed to update product ${update.productId}`);
          // Continue with other updates even if one fails
        }
      }

      // Clear pending changes
      setPendingChanges({});
      
      // Refresh the product list
      await fetchProducts();
      
      toast.success('All changes saved successfully');
    } catch (error) {
      // console.error('Error saving changes:', error);
      toast.error('Failed to save some changes');
    } finally {
      setSaving(false);
    }
  };
  // Add this function inside your StockManagement component, after the state declarations
  const updateVariantQty = async (productId, variantIndex, newQty) => {
    // console.log('Updating variant quantity:', { productId, variantIndex, newQty });
    
    if (newQty < 0) {
      throw new Error('Quantity cannot be negative');
    }

    try {
      const response = await fetch('/api/product/varients', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          variantIndex,
          newQty
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        // console.error('API Error:', data);
        throw new Error(data.error || 'Failed to update quantity');
      }

      // console.log('Update successful:', data);
      return data;
    } catch (error) {
      // console.error('Error in updateVariantQty:', error);
      throw error;
    }
  };
  // In your table row, update the QuantityCell usage:
  const renderQuantityCell = (product) => (
    <QuantityCell
      product={product}
      onQuantityChange={handleQuantityChange}
      hasPendingChanges={!!pendingChanges[product._id]}
    />
  );

  // In your table, add a save button in the header:
  const renderTableHeader = () => {
    const hasChanges = Object.keys(pendingChanges).length > 0;
    
    return (
      <div className="flex justify-end items-center m-2">
        <button
          onClick={saveAllChanges}
          disabled={!hasChanges || saving}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save All Changes'}
        </button>
      </div>
    );
  };
  const QuantityCell = ({ product, onQuantityChange }) => {
    const variants = product.quantity?.variants || [{}];
    const variant = variants[0] || {};

    // Get the pending quantity if it exists, otherwise use the variant's quantity
    const pendingQty = pendingChanges[product._id]?.[0];
    const displayQty = pendingQty !== undefined ? pendingQty : (variant.qty || 0);
    
    const [localQty, setLocalQty] = useState(displayQty);

    // Update local quantity when product prop changes or pending changes update
    useEffect(() => {
      setLocalQty(displayQty);
    }, [displayQty]);

    const handleChange = (newQty) => {
      const updatedQty = Math.max(0, newQty);
      setLocalQty(updatedQty);
      // Notify parent of the change
      if (onQuantityChange) {
        onQuantityChange(product._id, 0, updatedQty);
      }
    };

    return (
      <div className="flex items-center space-x-1">
        <button
          type="button"
          onClick={() => handleChange(localQty - 1)}
          className="w-6 h-6 flex items-center justify-center border rounded hover:bg-gray-100"
          disabled={saving}
        >
          -
        </button>
        <input
          type="number"
          min="0"
          value={localQty}
          onChange={(e) => handleChange(parseInt(e.target.value) || 0)}
          className="w-16 px-1 border rounded text-center"
          disabled={saving}
        />
        <button
          type="button"
          onClick={() => handleChange(localQty + 1)}
          className="w-6 h-6 flex items-center justify-center border rounded hover:bg-gray-100"
          disabled={saving}
        >
          +
        </button>
      </div>
    );
  };
  // Update the ProductVariantsModal component
  const ProductVariantsModal = ({ isOpen, onClose, product, onQuantityChange, saveAllChanges, pendingChanges, saving }) => {
    if (!isOpen || !product) return null;
    const hasChanges = product.quantity?.variants?.some((_, index) =>
      pendingChanges[product._id]?.[index] !== undefined
    );
    const VariantQuantityControl = ({ variant, variantIndex, pendingChanges, saving }) => {
      // Get the pending quantity if it exists, otherwise use the variant's quantity
      const pendingQty = pendingChanges[product._id]?.[variantIndex];
      const displayQty = pendingQty !== undefined ? pendingQty : (variant?.qty || 0);
      
      const [localQty, setLocalQty] = useState(displayQty);

      // Update localQty when the display quantity changes
      useEffect(() => {
        setLocalQty(displayQty);
      }, [displayQty]);

      // Handle quantity updates
      const handleUpdate = (newQty) => {
        const updatedQty = Math.max(0, newQty);
        setLocalQty(updatedQty);
        if (onQuantityChange) {
          onQuantityChange(product._id, variantIndex, updatedQty);
        }
      };

      // Handle input change
      const handleInputChange = (e) => {
        const value = parseInt(e.target.value) || 0;
        handleUpdate(value);
      };

      return (
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleUpdate(localQty - 1);
            }}
            className="w-6 h-6 flex items-center justify-center border rounded hover:bg-gray-100"
            disabled={saving}
          >
            -
          </button>
          <input
            type="number"
            min="0"
            value={localQty}
            onChange={handleInputChange}
            onFocus={(e) => e.target.select()}
            className="w-16 px-2 py-1 border rounded text-center"
            disabled={saving}
          />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleUpdate(localQty + 1);
            }}
            className="w-6 h-6 flex items-center justify-center border rounded hover:bg-gray-100"
            disabled={saving}
          >
            +
          </button>
        </div>
      );
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center border-b p-4 sticky top-0 bg-white z-10">
            <h3 className="text-lg font-semibold">Product Variants - {product.title}</h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-4">
            {product.quantity?.variants?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Color
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Size
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price (₹)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Weight (g)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {product.quantity.variants.map((variant, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div
                              className="h-4 w-4 rounded-full border border-gray-300 mr-2"
                              style={{ backgroundColor: variant.color || '#fff' }}
                            />
                            <span className="text-sm text-gray-900">
                              {variant.color || 'N/A'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {variant.size || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {variant.price?.toLocaleString('en-IN') || '0'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <VariantQuantityControl 
                            variant={variant} 
                            variantIndex={index} 
                            pendingChanges={pendingChanges}
                            saving={saving}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {variant.weight || '0'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No variants available for this product.
              </div>
            )}
          </div>

          <div className="border-t p-4 flex justify-end space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                await saveAllChanges();
                onClose();
              }}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-4 min-h-screen font-['Inter']">
      <div className="flex flex-wrap justify-between items-start mb-8 gap-4">
        <div className="flex items-center rounded-lg border border-black shadow-sm p-0.5 flex-[2_1_300px] max-w-[380px] min-w-[220px] mx-auto h-10">
          <input
            type="text"
            placeholder="Search products..."
            className="flex-1 px-3 py-2 text-sm border-0 focus:ring-0"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="px-3 h-full flex items-center">
            <SearchIcon />
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {renderTableHeader()}
        {loading ? (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {columns.map((column, index) => (
                    <th
                      key={index}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="px-6 py-4 text-center text-sm text-gray-500">
                      No products found
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr key={product._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex-shrink-0 h-10 w-10">
                          {product.gallery ? (
                            <Image
                              src={product.gallery.mainImage?.url}
                              alt={product.title}
                              width={40}
                              height={40}
                              className="h-10 w-10 rounded object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded bg-gray-200 flex items-center justify-center">
                              <span className="text-xs text-gray-500">No Image</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 line-clamp-1">
                          {product.title}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.code}
                      </td>
                      <td className="px-8 py-4 whitespace-nowrap text-sm text-gray-500">
                      ₹{product.quantity?.variants?.[0].price || 0}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {renderQuantityCell(product)}
                          {pendingChanges[product._id] && (
                            <span className="ml-2 text-xs text-yellow-600">Unsaved</span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-center">{
                        product.artisan?.name ||
                        ((product.artisan?.title) + (product.artisan?.firstName || "") + (product.artisan?.lastName ? " " + product.artisan.lastName : "")) ||
                        product.artisan?.name ||
                        '-'
                      }</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openQrModal(product)}
                            title="QR Code"
                          >
                            <QrCode className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedProduct(product);
                              setVariantsModalOpen(true);
                            }}
                            title="View Variants"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDelete(product._id)}
                            title="Delete Product"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      {selectedProduct && (
        <ProductQrModal
          open={qrModalOpen}
          onOpenChange={setQrModalOpen}
          qrUrl={getProductUrl(selectedProduct)}
          productTitle={selectedProduct.title}
        />
      )}
      {/* Product Variants Modal */}
      <ProductVariantsModal
        isOpen={variantsModalOpen}
        onClose={() => setVariantsModalOpen(false)}
        product={selectedProduct}
        onQuantityChange={handleQuantityChange}
        saveAllChanges={saveAllChanges}
        pendingChanges={pendingChanges}
        saving={saving}
      />
      {/* Pagination */}
      <div className="flex flex-col items-center justify-center gap-4 mt-6">
        <span className="text-lg font-semibold">
          Page {pagination.currentPage} of {pagination.totalPages}
        </span>
        <div className="flex gap-2">
          {pagination.currentPage > 1 && (
            <button
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
            >
              Previous
            </button>
          )}
          {pagination.currentPage < pagination.totalPages && (
            <button
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StockManagementPage;
