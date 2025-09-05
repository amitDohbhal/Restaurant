"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Label } from "../ui/label";
import toast from "react-hot-toast"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
import { Plus, Trash2,Loader2, Image as ImageIcon, X } from 'lucide-react';
import Image from 'next/image';
const QuantityManagement = ({ productData, productId }) => {
  // Remove a row by index, but always keep at least one row
  const handleRemoveRow = async (idx) => {
    const row = rows[idx];
    // Clean up Cloudinary images if they exist
    if (row.profileImage?.key) {
      try {
        await fetch('/api/cloudinary', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ publicId: row.profileImage.key })
        });
      } catch (err) {
        console.error('Error deleting profile image:', err);
      }
    }
    
    if (row.subImages?.length > 0) {
      try {
        await Promise.all(
          row.subImages
            .filter(img => img?.key)
            .map(img => 
              fetch('/api/cloudinary', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ publicId: img.key })
              })
            )
        );
      } catch (err) {
        console.error('Error deleting sub images:', err);
      }
    }
    
    setRows(rows => rows.length > 1 ? rows.filter((_, i) => i !== idx) : rows);
  };

  const [rows, setRows] = useState([
    { 
      size: '', 
      price: '', 
      qty: '', 
      color: '', 
      weight: '', // always in grams
      profileImage: null,      // { url, key }
      subImages: [],          // array of { url, key }
      uploadingProfile: false,
      uploadingSubImages: false
    }
  ]);
  const [sizes, setSizes] = useState([]); // fetched from API
  const [allColors, setAllColors] = useState([]); // fetched from API

  useEffect(() => {
    if (!productId) return;
    // Fetch sizes
    fetch(`/api/productSize?product=${productId}`)
      .then(async res => {
        if (!res.ok) { setSizes([]); return; }
        const data = await res.json();
        setSizes(Array.isArray(data?.sizes) ? data.sizes : []);
      })
      .catch(() => setSizes([]));
    // Fetch colors
    fetch(`/api/productColor?product=${productId}`)
      .then(async res => {
        if (!res.ok) { setAllColors([]); return; }
        const data = await res.json();
        setAllColors(Array.isArray(data?.colors) ? data.colors : []);
      })
      .catch(() => setAllColors([]));

  }, [productId]);

  const productName = productData?.title || "";

  const handleRowChange = (idx, field, value) => {
    setRows(rows => rows.map((row, i) => i === idx ? { ...row, [field]: value } : row));
  };

  const handleProfileImageUpload = async (event, rowIdx) => {
    // console.log('Starting profile image upload...');
    const file = event.target.files?.[0];
    if (!file) {
      // console.log('No file selected');
      return;
    }
    
    // console.log('Selected file:', file.name, 'Size:', file.size, 'Type:', file.type);
    
    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    
    // Reset file input
    event.target.value = '';
    
    // Get the current row and old image key
    const currentRow = rows[rowIdx];
    const oldImageKey = currentRow?.profileImage?.key;
    
    // Set uploading state with preview
    setRows(prevRows => 
      prevRows.map((row, i) => 
        i === rowIdx 
          ? { 
              ...row, 
              uploadingProfile: true,
              profileImage: { url: previewUrl, key: 'uploading', isPreview: true }
            } 
          : row
      )
    );
    
    // Update modal state if open
    if (imageModal.open && imageModal.rowIndex === rowIdx) {
      setImageModal(prev => ({
        ...prev,
        variant: {
          ...prev.variant,
          uploadingProfile: true,
          profileImage: { url: previewUrl, key: 'uploading', isPreview: true }
        }
      }));
    }
    
    try {
      // First, delete the old image if it exists
      if (oldImageKey) {
        // console.log('Deleting old image with key:', oldImageKey);
        try {
          const deleteResponse = await fetch('/api/cloudinary', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ publicId: oldImageKey })
          });
          
          if (!deleteResponse.ok) {
            const error = await deleteResponse.text();
            console.error('Error deleting old image:', error);
            // Continue with upload even if delete fails
          }
        } catch (err) {
          console.error('Error in delete request:', err);
          // Continue with upload even if delete fails
        }
      }
      
      // Upload new image
      // console.log('Uploading new image...');
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/cloudinary', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload failed with status:', response.status, 'Error:', errorText);
        throw new Error(errorText || `Upload failed with status ${response.status}`);
      }
      
      const result = await response.json();
      // console.log('Upload successful. Response:', result);
      
      // Match the response structure from Cloudinary
      const imageUrl = result.secure_url || result.url;
      const imageKey = result.public_id || result.key;
      
      if (!imageUrl || !imageKey) {
        console.error('Invalid Cloudinary response:', result);
        throw new Error('Invalid response from Cloudinary: missing URL or key');
      }
      
      const newProfileImage = {
        url: imageUrl,
        key: imageKey
      };
      
      // Update the rows state with final image
      setRows(prevRows => 
        prevRows.map((row, i) => 
          i === rowIdx 
            ? { 
                ...row, 
                profileImage: newProfileImage,
                uploadingProfile: false
              } 
            : row
        )
      );
      
      // Update image modal state if open
      if (imageModal.open && imageModal.rowIndex === rowIdx) {
        setImageModal(prev => ({
          ...prev,
          variant: {
            ...prev.variant,
            profileImage: newProfileImage,
            uploadingProfile: false
          }
        }));
      }
      
      // console.log('Profile image updated in state');
      toast.success('Profile image uploaded successfully');
    } catch (error) {
      console.error('Error in profile image upload:', error);
      toast.error(`Upload failed: ${error.message || 'Unknown error'}`);
      
      // Reset uploading state on error
      setRows(prevRows => 
        prevRows.map((row, i) => 
          i === rowIdx 
            ? { ...row, uploadingProfile: false } 
            : row
        )
      );
    }
  };

  const handleSubImagesUpload = async (event, rowIdx) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) {
      // console.log('No files selected');
      return;
    }
    

    
    // Create preview URLs
    const previews = files.map(file => ({
      url: URL.createObjectURL(file),
      key: `preview-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      isPreview: true
    }));
    
    // Reset file input
    event.target.value = '';
    
    // Set uploading state with previews
    setRows(prevRows => 
      prevRows.map((row, i) => 
        i === rowIdx 
          ? { 
              ...row, 
              uploadingSubImages: true,
              subImages: [
                ...(row.subImages || []),
                ...previews
              ]
            } 
          : row
      )
    );
    
    // Update modal state if open
    if (imageModal.open && imageModal.rowIndex === rowIdx) {
      setImageModal(prev => ({
        ...prev,
        variant: {
          ...prev.variant,
          uploadingSubImages: true,
          subImages: [
            ...(prev.variant.subImages || []),
            ...previews
          ]
        }
      }));
    }
    
    try {
      // console.log('Starting upload of', files.length, 'files...');
      const uploadPromises = files.map((file, index) => {
        // console.log(`Uploading file ${index + 1}/${files.length}:`, file.name);
        const formData = new FormData();
        formData.append('file', file);
        
        return fetch('/api/cloudinary', {
          method: 'POST',
          body: formData,
        })
        .then(async response => {
          // console.log(`File ${index + 1} upload response status:`, response.status);
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Upload failed for ${file.name}:`, errorText);
            throw new Error(`Failed to upload ${file.name}: ${errorText}`);
          }
          return response.json();
        })
        .then(result => {
          // console.log(`File ${index + 1} upload successful:`, result.public_id);
          return result;
        });
      });
      
      // console.log('Waiting for all uploads to complete...');
      const results = await Promise.all(uploadPromises);
      // console.log('All uploads completed successfully. Results:', results);
      
      // Process the results to handle both response formats
      const newSubImages = results.map(result => ({
        url: result.secure_url || result.url,
        key: result.public_id || result.key
      }));
      
      // console.log('Processed new sub-images:', newSubImages);
      
      // Update the rows state with the new images
      setRows(prevRows => {
        const currentRow = prevRows[rowIdx];
        // console.log('Current row data before update:', JSON.stringify(currentRow, null, 2));
        
        // Filter out any preview images before adding the new uploaded ones
        const existingImages = (currentRow.subImages || []).filter(img => !img.isPreview);
        
        const updatedRows = prevRows.map((row, i) => {
          if (i === rowIdx) {
            const updatedRow = { 
              ...row,
              // Keep only non-preview images and add the newly uploaded ones
              subImages: [
                ...existingImages,
                ...newSubImages
              ],
              uploadingSubImages: false
            };
            // console.log('Updated row with new sub-images:', JSON.stringify(updatedRow, null, 2));
            return updatedRow;
          }
          return row;
        });
        
        // Update image modal state if open
        if (imageModal.open && imageModal.rowIndex === rowIdx) {
          setImageModal(prev => {
            const currentVariant = prev.variant;
            // Filter out any preview images before adding the new uploaded ones
            const existingImages = (currentVariant.subImages || []).filter(img => !img.isPreview);
            
            const updatedVariant = {
              ...currentVariant,
              // Keep only non-preview images and add the newly uploaded ones
              subImages: [
                ...existingImages,
                ...newSubImages
              ],
              uploadingSubImages: false
            };
        
            
            return {
              ...prev,
              variant: updatedVariant
            };
          });
        }
        
        return updatedRows;
      });
      
      // console.log('Sub-images updated in state');
      toast.success(`${results.length} image(s) uploaded successfully`);
    } catch (error) {
      // console.error('Error in sub-images upload:', error);
      toast.error(`Upload failed: ${error.message || 'Unknown error'}`);
      
      // Reset uploading state on error
      setRows(prevRows => 
        prevRows.map((row, i) => 
          i === rowIdx 
            ? { ...row, uploadingSubImages: false } 
            : row
        )
      );
    }
  };

  const removeProfileImage = async (rowIdx) => {
    const row = rows[rowIdx];
    if (!row?.profileImage?.key) return;
    
    try {
      // Delete from Cloudinary
      await fetch('/api/cloudinary', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicId: row.profileImage.key })
      });
      
      // Update state
      const updatedRows = rows.map((row, i) => 
        i === rowIdx 
          ? { ...row, profileImage: null } 
          : row
      );
      
      setRows(updatedRows);
      
      // Update image modal state if open
      if (imageModal.open && imageModal.rowIndex === rowIdx) {
        setImageModal(prev => ({
          ...prev,
          variant: updatedRows[rowIdx]
        }));
      }
      
      toast.success('Profile image removed');
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('Failed to delete image');
    }
  };
  
  const removeSubImage = async (rowIdx, imgIdx, imgKey) => {
    try {
      if (imgKey) {
        // console.log('Deleting image from Cloudinary with key:', imgKey);
        const response = await fetch('/api/cloudinary', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ publicId: imgKey })
        });
        
        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Failed to delete image: ${error}`);
        }
      }
      
      // Update state using functional update to ensure we have the latest state
      setRows(prevRows => {
        const updatedRows = prevRows.map((row, i) => 
          i === rowIdx 
            ? { 
                ...row, 
                subImages: (row.subImages || []).filter((_, idx) => idx !== imgIdx)
              } 
            : row
        );
        
        // Update image modal state if open
        if (imageModal.open && imageModal.rowIndex === rowIdx) {
          setImageModal(prev => ({
            ...prev,
            variant: {
              ...prev.variant,
              subImages: (prev.variant.subImages || []).filter((_, idx) => idx !== imgIdx)
            }
          }));
        }
        
        return updatedRows;
      });
      
      toast.success('Image removed successfully');
    } catch (error) {
      console.error('Error removing sub-image:', error);
      toast.error(error.message || 'Failed to remove image');
    }
  };

  const handleAddRow = () => {
    setRows(rows => [...rows, { 
      size: '', 
      price: '', 
      qty: '', 
      color: '', 
      weight: '',
      profileImage: null,
      subImages: [],
      uploadingProfile: false,
      uploadingSubImages: false
    }]);
  };

  const [saving, setSaving] = useState(false);
  const [allQuantities, setAllQuantities] = useState([]);
  const [viewDialog, setViewDialog] = useState({ open: false, data: null });
  const [editMode, setEditMode] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });
  
  // State for image management modal
  const [imageModal, setImageModal] = useState({
    open: false,
    rowIndex: null,
    variant: null
  });
  
  // Open image management modal
  const openImageModal = (rowIndex) => {
    // Make sure we're using the latest row data
    setRows(prevRows => {
      const row = prevRows[rowIndex];
      setImageModal({
        open: true,
        rowIndex,
        variant: { ...row } // Create a new object to ensure reactivity
      });
      return prevRows;
    });
  };
  
  // Close image management modal
  const closeImageModal = () => {
    setImageModal({ open: false, rowIndex: null, variant: null });
  };
  
  // Update variant images after modal operations
  const updateVariantImages = (rowIndex, updatedVariant) => {
    setRows(prevRows => 
      prevRows.map((row, i) => 
        i === rowIndex ? updatedVariant : row
      )
    );
  };

  // Fetch quantity records for the current product only
  const fetchQuantities = async () => {
    if (!productId) return;
    try {
      const res = await fetch(`/api/productQuantity?product=${productId}`);
      const data = await res.json();
      // If API returns a single object, wrap in array for consistency
      if (res.ok && data && (Array.isArray(data) ? data.length : data._id)) {
        setAllQuantities(Array.isArray(data) ? data : [data]);
      } else {
        setAllQuantities([]);
      }
    } catch {
      setAllQuantities([]);
    }
  };

  useEffect(() => { fetchQuantities(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // console.log('Submitting form with rows:', JSON.stringify(rows, null, 2));
      
      const variants = rows.map(row => {
        // Ensure size is a string (not an object) before sending to the server
        let sizeValue = row.size;
        if (Array.isArray(sizes)) {
          const found = sizes.find(s => (typeof s === 'object' ? (s._id === row.size || s.label === row.size) : s === row.size));
          if (found) sizeValue = found.label || found.name || found._id || found;
        }

        // Always treat weight as grams and convert to kg
        let weightValue = row.weight;
        if (row.weight !== '' && !isNaN(row.weight)) {
          weightValue = (Number(row.weight) / 1000).toFixed(3);
        }
        
        // Process images - ensure we're sending the correct structure
        const variantData = {
          size: sizeValue,
          color: row.color,
          price: Number(row.price),
          qty: Number(row.qty),
          weight: Number(weightValue),
          optional: false,
          // Include both the new structure (images) and the old structure (for backward compatibility)
          images: {
            profile: row.profileImage || null,
            subImages: Array.isArray(row.subImages) ? row.subImages : []
          },
          // Keep the old structure for backward compatibility
          profileImage: row.profileImage || null,
          subImages: Array.isArray(row.subImages) ? row.subImages : []
        };

        // console.log('Processed variant data:', JSON.stringify(variantData, null, 2));
        return variantData;
      });
      const payload = {
        product: productId,
        variants
      };
      const res = await fetch('/api/productQuantity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to save quantity');
      }
      toast.success(editMode ? 'Quantity data updated successfully' : 'Quantity data saved successfully');
      setRows([{ size: '', price: '', color: '', }]); // clear form
      setEditMode(false);
      fetchQuantities();
    } catch (err) {
      toast.error(err.message || 'Failed to save quantity');
    } finally {
      setSaving(false);
    }
  };

  // Edit
  const handleEdit = (record) => {
    setRows(record.variants.map(v => {
      let sizeValue = v.size;
      if (Array.isArray(sizes)) {
        // Try to find the object whose label or name matches v.size, and use its _id
        const found = sizes.find(s => (typeof s === 'object' ? (s.label === v.size || s.name === v.size) : s === v.size));
        if (found && found._id) sizeValue = found._id;
      }
      
      // Handle images from existing variant data - check both new and legacy formats
      const profileImage = v.images?.profile || v.profileImage || null;
      const subImages = Array.isArray(v.images?.subImages) ? v.images.subImages : 
                       (Array.isArray(v.subImages) ? v.subImages : []);
      
      return {
        size: sizeValue || '',
        price: v.price || '',
        qty: v.qty || '',
        color: v.color || '',
        weight: v.weight ? (Number(v.weight) * 1000): '',
        profileImage: profileImage,
        subImages: subImages,
        uploadingProfile: false,
        uploadingSubImages: false
      };
    }));
    setEditMode(true);
  };


  // Cancel edit
  const handleCancelEdit = () => {
    // Clear the form immediately
    setRows([{ 
      size: '', 
      price: '', 
      qty: '', 
      color: '', 
      weight: '',
      profileImage: null,
      subImages: [],
      uploadingProfile: false,
      uploadingSubImages: false
    }]);
    setEditMode(false);
    
    // Clean up uploaded images in the background
    const cleanupPromises = rows.flatMap(row => {
      const promises = [];
      if (row.profileImage?.key) {
        promises.push(
          fetch('/api/cloudinary', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ publicId: row.profileImage.key })
          }).catch(console.error)
        );
      }
      
      if (row.subImages?.length) {
        row.subImages.forEach(img => {
          if (img?.key) {
            promises.push(
              fetch('/api/cloudinary', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ publicId: img.key })
              }).catch(console.error)
            );
          }
        });
      }
      return promises;
    });
    
    // Don't await the cleanup, let it happen in the background
    Promise.all(cleanupPromises).catch(console.error);
  };

  // Delete
  const handleDelete = async () => {
    if (!deleteDialog.id) return;
    try {
      // Include productId in the DELETE request so backend can clear Product.quantity
      const res = await fetch(`/api/productQuantity?id=${deleteDialog.id}&productId=${productId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success('Deleted successfully');
      setDeleteDialog({ open: false, id: null });
      fetchQuantities();
    } catch {
      toast.error('Failed to delete');
    }
  };

  // --- FORM ---
  const form = (
    <form className="flex flex-col items-center" style={{ maxWidth: 1200 }} onSubmit={handleSubmit}>
      <h3 className="font-semibold my-2 text-center text-xl">Product Total Quantity Management</h3>
      <div className="w-full bg-white rounded shadow p-4">
        <div className="mb-6 flex flex-col items-center justify-center">
          <Label className="font-bold mb-2 text-md">Product Name</Label>
          <Input
            className="mb-4 w-80 font-black text-center border-gray-300"
            value={productName}
            disabled
            // {productName ? {} : { border: '2px solid red', color: 'red' }}
            placeholder={productName ? "Product Name" : "Product Name not found"}
          />
          {!productName && (
            <div style={{ color: 'red', marginTop: '4px', fontWeight: 'bold' }}>
              Product name not found! Please check if the product was created successfully.
            </div>
          )}
        </div>
        <h5 className="font-semibold mb-2 text-center text-xl">Product Quantity Table</h5>
        <div className="overflow-x-auto">
          <table className="min-w-full border text-sm">
            <thead>
              <tr>
                <th className="border px-2 py-1 text-center">Size</th>
                <th className="border px-2 py-1 text-center">Color</th>
                <th className="border px-2 py-1 text-center">Price</th>
                <th className="border px-2 py-1 text-center">Quantity</th>
                <th className="border px-2 py-1 text-center">Weight (g)</th>
                <th className="border px-2 py-1 text-center">Images</th>
                <th className="border px-2 py-1 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={idx}>
                  <td className="border px-1 py-1"><div className="flex justify-center">
                    <Select value={row.size ?? ''} onValueChange={val => handleRowChange(idx, 'size', val)}>
                      <SelectTrigger className="bg-gray-50 rounded border w-24">
                        <SelectValue placeholder="Select Size"/>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {sizes.map((size, i) => {
                            let value = typeof size === 'string' ? size : (size._id || size.label || String(i));
                            let label = typeof size === 'string' ? size : (size.label || size._id || String(value));
                            return (
                              <SelectItem key={value} value={String(value)}>{label}</SelectItem>
                            );
                          })}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div></td>

                  <td className="border px-1 py-1"><div className="flex justify-center">
                    <Select value={row.color ?? ''} onValueChange={val => handleRowChange(idx, 'color', val)}>
                      <SelectTrigger className="bg-gray-50 rounded border w-24">
                        <SelectValue placeholder="Select Color" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {allColors.map((c, i) => {
                            let value = typeof c === 'string' ? c : (c.hex || c.name || String(i));
                            let label = typeof c === 'string' ? c : (c.name || c.hex || String(value));
                            return (
                              <SelectItem key={value} value={String(value)}>{label}</SelectItem>
                            );
                          })}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div></td>
                  <td className="border px-1 py-1"><div className="flex justify-center">
                    <Input
                      type="number"
                      min={0}
                      className="w-32 bg-gray-100 rounded"
                      placeholder="Set Price"
                      value={row.price ?? ''}
                      onChange={e => handleRowChange(idx, 'price', e.target.value)}
                    />
                  </div></td>
                  <td className="border px-2 py-1"><div className="flex justify-center">
                    <Input
                      type="number"
                      min={0}
                      className="w-24 bg-gray-50 rounded"
                      placeholder="Qty"
                      value={row.qty ?? ''}
                      onChange={e => handleRowChange(idx, 'qty', e.target.value)}
                    />
                  </div></td>
                  <td className="border px-2 py-1"><div className="flex justify-center">
                    <Input
                      type="number"
                      min={0}
                      className="w-24 bg-gray-50 rounded"
                      placeholder="Weight"
                      value={row.weight ?? ''}
                      onChange={e => handleRowChange(idx, 'weight', e.target.value)}
                    />
                  </div></td>
                  <td className="border px-2 py-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                      onClick={() => openImageModal(idx, row)}
                    >
                      <ImageIcon className="h-4 w-4" />
                      <span>Manage Images</span>
                      {(row.profileImage || (row.subImages?.length > 0)) && (
                        <span className="ml-1 text-xs bg-primary text-primary-foreground rounded-full h-5 w-5 flex items-center justify-center">
                          {row.profileImage ? 1 : 0 + (row.subImages?.length || 0)}
                        </span>
                      )}
                    </Button>
                  </td>
                  <td className="border px-2 py-1 text-center">
                    <div className="flex justify-center gap-2">
                      {idx === rows.length - 1 && (
                        <Button type="button" className="bg-green-500 font-bold px-3 py-1 flex items-center justify-center gap-1" onClick={handleAddRow}>
                          <Plus size={18} />
                        </Button>
                      )}
                      {rows.length > 1 && (
                        <Button type="button" className="bg-red-500 font-bold px-3 py-1 flex items-center justify-center" onClick={() => handleRemoveRow(idx)}>
                          <Trash2 size={18} />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-center gap-4 mt-4">
          <Button type="submit" className="bg-red-500 font-bold px-5" disabled={saving}>{editMode ? 'Update' : 'Data Save'}</Button>
          {editMode && (
            <Button type="button" className="bg-gray-400 font-bold px-5" onClick={handleCancelEdit}>Cancel</Button>
          )}
        </div>
      </div>
    </form>
  );

  // --- TABLE ---
  const table = (
    <div className="w-full mt-10">
      <h4 className="font-bold mb-2 text-lg">All Product Quantities</h4>
      <div className="overflow-x-auto">
        <table className="min-w-full border text-sm">
          <thead>
            <tr>
              <th className="border px-2 py-1 text-center">S.No</th>
              <th className="border px-2 py-1 text-center">Product Name</th>
              <th className="border px-2 py-1 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {allQuantities.map((q, i) => (
              <tr key={q._id}>
                <td className="border px-2 py-1 text-center">{i + 1}</td>
                <td className="border px-2 py-1 text-center">{productName || '-'}</td>
                <td className="border px-2 py-1 text-center flex flex-wrap gap-2 justify-center">
                  {/* View Dialog Trigger */}
                  <Dialog open={viewDialog.open && viewDialog.data?._id === q._id} onOpenChange={open => setViewDialog(open ? { open: true, data: q } : { open: false, data: null })}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="bg-blue-500 text-white">View</Button>
                    </DialogTrigger>
                    <DialogContent style={{ maxWidth: 650 }}>
                      <DialogTitle>Product Quantity Details</DialogTitle>
                      <div className="bg-gray-50 rounded p-4 mb-2">
                        <div><b>Product:</b> {productName || '-'}</div>
                        <div className="mt-2">
                          <b className=''>Variants:</b>
                          <div className="flex flex-col gap-2 items-start justify-center mt-2">
                            {q.variants.map((v, idx) => {
                              // Try to find the size label from sizes array
                              let sizeLabel = v.size;
                              if (Array.isArray(sizes)) {
                                const found = sizes.find(s => (typeof s === 'object' ? (s._id === v.size || s.label === v.size) : s === v.size));
                                if (found) sizeLabel = found.label || found.name || found._id || found;
                              }
                              return (
                                <div key={idx} className="flex flex-wrap gap-2 ">
                                  <span className="bg-gray-200 rounded px-2 py-1 font-medium">Size: {sizeLabel}</span>
                                  <span className="bg-blue-100 rounded px-2 py-1 font-medium">Price: ₹{v.price}</span>
                                  <span className="bg-green-100 rounded px-2 py-1 font-medium">Qty: {v.qty}</span>
                                  <span className="bg-yellow-100 rounded px-2 py-1 font-medium">Color: {v.color}</span>
                                  <span className="bg-yellow-100 rounded px-2 py-1 font-medium">Weight: {Math.round(v.weight * 1000)}g</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  {/* Edit Button */}
                  <Button size="sm" className="bg-yellow-500 text-white" onClick={() => handleEdit(q)}>
                    Edit
                  </Button>
                  {/* Delete Dialog Trigger */}
                  <Dialog open={deleteDialog.open && deleteDialog.id === q._id} onOpenChange={open => setDeleteDialog(open ? { open: true, id: q._id } : { open: false, id: null })}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="bg-red-500 text-white">Delete</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Delete Quantity</DialogTitle>
                      </DialogHeader>
                      <p>Are you sure you want to delete this quantity record?</p>
                      <div className="flex gap-4 mt-4 justify-end">
                        <Button variant="secondary" onClick={() => setDeleteDialog({ open: false, id: null })}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete}>Delete</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col items-center w-full">
      {form}
      {table}
      
      {/* Image Management Modal */}
      <Dialog open={imageModal.open} onOpenChange={closeImageModal}>
        <DialogContent 
          className="max-w-3xl" 
          onInteractOutside={(e) => {
            // Prevent closing when clicking outside
            e.preventDefault();
          }}
          onEscapeKeyDown={(e) => {
            // Allow closing with escape key
            closeImageModal();
          }}
        >
          <DialogHeader>
            <DialogTitle>Manage Images</DialogTitle>
            <DialogDescription className="flex items-center gap-2">
              {imageModal.variant && (
                <>
                  <span>Variant: </span>
                  {imageModal.variant.color && (
                    <span 
                      className="inline-block h-8 w-8 rounded-full border border-gray-300" 
                      style={{ backgroundColor: imageModal.variant.color }}
                      title={imageModal.variant.color}
                    />
                  )}
                
                  <span> - </span>
                  <span className='font-medium text-xl'>
                    {Array.isArray(sizes) ? (
                      sizes.find(s => s._id === imageModal.variant.size)?.label || 
                      sizes.find(s => s.label === imageModal.variant.size)?.label || 
                      imageModal.variant.size
                    ) : imageModal.variant.size}
                  </span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {imageModal.variant && (
            <div className="space-y-6">
              {/* Profile Image Section */}
              <div>
                <h3 className="text-sm font-medium mb-2">Profile Image</h3>
                <div className="border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center">
                  {imageModal.variant.profileImage?.url ? (
                    <div className="relative group">
                      <div className="relative h-48 w-48 mx-auto">
                        <div className="absolute inset-0">
                          {imageModal.variant.profileImage?.url ? (
                            <>
                              <Image
                                src={imageModal.variant.profileImage.url}
                                alt="Profile"
                                fill
                                className="rounded-md object-cover"
                                onError={(e) => {
                                  console.error('Error loading profile image:', imageModal.variant.profileImage?.url);
                                  e.target.src = '/placeholder.jpeg';
                                }}
                              />
                              {imageModal.variant.uploadingProfile && (
                                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                  <Loader2 className="h-8 w-8 text-white animate-spin" />
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="w-full h-full bg-gray-100 rounded-md flex items-center justify-center">
                              <span className="text-gray-400">No image</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="mt-2 flex justify-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = 'image/*';
                            input.onchange = (e) => handleProfileImageUpload(e, imageModal.rowIndex);
                            input.click();
                          }}
                          disabled={imageModal.variant.uploadingProfile}
                        >
                          {imageModal.variant.uploadingProfile ? (
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Uploading...</span>
                            </div>
                          ) : 'Change'}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeProfileImage(imageModal.rowIndex)}
                          disabled={!imageModal.variant.profileImage}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-8">
                      <ImageIcon className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500 mb-4">No profile image uploaded</p>
                      <Button
                        variant="outline"
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/*';
                          input.onchange = (e) => handleProfileImageUpload(e, imageModal.rowIndex);
                          input.click();
                        }}
                        disabled={imageModal.variant.uploadingProfile}
                      >
                        {imageModal.variant.uploadingProfile ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Uploading...</span>
                          </div>
                        ) : 'Upload Profile Image'}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Sub Images Section */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium">Additional Images</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.multiple = true;
                      input.accept = 'image/*';
                      input.onchange = (e) => handleSubImagesUpload(e, imageModal.rowIndex);
                      input.click();
                    }}
                    disabled={imageModal.variant.uploadingSubImages}
                  >
                    {imageModal.variant.uploadingSubImages ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Uploading...</span>
                      </div>
                    ) : 'Add Images'}
                  </Button>
                </div>
                
                {imageModal.variant.subImages?.length > 0 ? (
                  <div className="max-h-[200px] overflow-y-auto pr-2">
                    <div className="grid grid-cols-3 gap-4">
                      {imageModal.variant.subImages.map((img, imgIdx) => (
                        <div key={imgIdx} className="relative group h-32">
                          <div className="relative h-full w-full">
                            <div className="absolute inset-0">
                              {img?.url ? (
                                <>
                                  <Image
                                    src={img.url}
                                    alt={`Sub ${imgIdx + 1}`}
                                    fill
                                    className="rounded-md object-cover"
                                    onError={(e) => {
                                      console.error('Error loading sub-image:', img.url);
                                      e.target.src = '/placeholder.jpeg';
                                    }}
                                  />
                                  {img.isPreview && (
                                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                      <Loader2 className="h-6 w-6 text-white animate-spin" />
                                    </div>
                                  )}
                                </>
                              ) : (
                                <div className="w-full h-full bg-gray-100 rounded-md flex items-center justify-center">
                                  <span className="text-gray-400 text-xs">Image {imgIdx + 1}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeSubImage(imageModal.rowIndex, imgIdx, img.key)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <ImageIcon className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">No additional images uploaded</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={closeImageModal}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuantityManagement;
