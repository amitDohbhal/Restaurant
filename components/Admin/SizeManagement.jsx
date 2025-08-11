"use client";
import React, { useState, useEffect, useRef } from "react";
import { toast } from 'react-hot-toast';
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from "../ui/alert-dialog";
const SizeManagement = ({ productData, productId }) => {
  // console.log(productData,productId)
  // Modal state for image preview
  const [modalOpen, setModalOpen] = useState(false);
  const [modalImage, setModalImage] = useState(null);

  // --- New State for mutually exclusive input ---
  const [sizeInputMethod, setSizeInputMethod] = useState('optionals'); // 'custom' or 'optionals'
  const [customSizeInput, setCustomSizeInput] = useState("");
  const [customSizes, setCustomSizes] = useState([]);

  // --- New Handlers ---
  const handleSizeInputMethodChange = (method) => {
    setSizeInputMethod(method);
    if (method === 'custom') {
      // Clear optionals
      setOptionals([
        { label: "L", checked: false },
        { label: "M", checked: false },
        { label: "XL", checked: false },
        { label: "XXL", checked: false },
      ]);
    } else {
      // Clear custom
      setCustomSizes([]);
      setCustomSizeInput("");
    }
  };

  const handleAddCustomSize = () => {
    const trimmed = customSizeInput.trim();
    if (!trimmed) return;
    if (customSizes.some((item) => item.label === trimmed)) return;
    setCustomSizes([...customSizes, { label: trimmed, checked: true }]);
    setCustomSizeInput("");
  };

  const handleCustomSizeCheck = (idx) => {
    setCustomSizes((prev) =>
      prev.map((item, i) => i === idx ? { ...item, checked: !item.checked } : item)
    );
  };

  const handleRemoveCustomSize = (idx) => {
    setCustomSizes((prev) => prev.filter((_, i) => i !== idx));
  };

  const fileInputRef = useRef(null);
  const [sizeChart, setSizeChart] = useState(null);
  const [sizeChartPreview, setSizeChartPreview] = useState(null);
  const [sizeChartObj, setSizeChartObj] = useState({ url: '', key: '' });
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [optionals, setOptionals] = useState([
    { label: "L", checked: false },
    { label: "M", checked: false },
    { label: "XL", checked: false },
    { label: "XXL", checked: false },
  ]);
  // For size data table and edit logic
  const [sizeEntries, setSizeEntries] = useState([]); // All size docs for this product
  const [editId, setEditId] = useState(null); // If editing, contains the _id
  // Helper to fetch sizes for this product
  const fetchSizeEntries = async () => {
    if (!productId) return;
    try {
      const res = await fetch(`/api/productSize?product=${productId}`);
      const data = await res.json();
      // console.log(data)
      if (res.ok && data && data._id) setSizeEntries([data]);
      else setSizeEntries([]);
    } catch {
      setSizeEntries([]);
    }
  };
  useEffect(() => { fetchSizeEntries(); }, [productId]);

  const productName = productData?.title || "";

  const handleSizeChartChange = async (e) => {
    const file = e.target.files[0];
    setSizeChart(file);
    if (file) {
      setUploading(true);
      toast.loading('Uploading image to Cloudinary...', { id: 'cloud-upload' });
      // Preview
      const reader = new FileReader();
      reader.onloadend = () => setSizeChartPreview(reader.result);
      reader.readAsDataURL(file);
      // Upload to Cloudinary
      const formData = new FormData();
      formData.append('file', file);
      try {
        const res = await fetch('/api/cloudinary', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (res.ok && data.url && data.key) {
          setSizeChartObj({ url: data.url, key: data.key });
          toast.success('Image uploaded!', { id: 'cloud-upload' });
        } else {
          toast.error('Cloudinary upload failed: ' + (data.error || 'Unknown error'), { id: 'cloud-upload' });
        }
      } catch (err) {
        toast.error('Cloudinary upload error: ' + err.message, { id: 'cloud-upload' });
      } finally {
        setUploading(false);
      }
    } else {
      setSizeChartPreview(null);
      setSizeChartObj({ url: '', key: '' });
    }
  };

  const handleRemoveImage = async () => {
    // Remove from UI immediately
    setSizeChart(null);
    setSizeChartPreview(null);
    const prevKey = sizeChartObj.key;
    setSizeChartObj({ url: '', key: '' });
    if (prevKey) {
      toast.loading('Deleting image from Cloudinary...', { id: 'cloud-delete' });
      try {
        const res = await fetch('/api/cloudinary', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ publicId: prevKey }),
        });
        const data = await res.json();
        if (res.ok) {
          toast.success('Image deleted from Cloudinary!', { id: 'cloud-delete' });
        } else {
          toast.error('Cloudinary error: ' + (data.error || 'Failed to delete image from Cloudinary'), { id: 'cloud-delete' });
        }
      } catch (err) {
        toast.error('Failed to delete image from Cloudinary (network or server error)', { id: 'cloud-delete' });
      }
    }
  };

  const handleOptionalChange = (idx) => {
    setOptionals((prev) =>
      prev.map((item, i) =>
        i === idx ? { ...item, checked: !item.checked } : item
      )
    );
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!productId) {
      toast.error("Missing product ID");
      return;
    }
    // Required validation
    let sizesToSend = [];
    if (sizeInputMethod === 'custom') {
      sizesToSend = customSizes.filter((item) => item.checked);
      if (sizesToSend.length === 0) {
        toast.error("Please add and check at least one custom size.");
        return;
      }
    } else {
      sizesToSend = optionals.filter((item) => item.checked);
      if (sizesToSend.length === 0) {
        toast.error("Please select at least one size from checkboxes.");
        return;
      }
    }

    setSubmitting(true);
    try {
      // Prepare size data with the edit ID if available
      const sizeData = {
        product: productId,
        sizes: sizesToSend,
        sizeChartUrl: sizeChartObj,
        ...(editId && { id: editId }) // Include id (not _id) to match API expectation
      };

      let res, data;
      if (editId) {
        // PATCH update - ensure we have the required ID
        res = await fetch('/api/productSize', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sizeData),
        });
      } else {
        // Check if a Size document already exists for this product
        const getRes = await fetch(`/api/productSize?product=${productId}`);
        const existing = getRes.ok ? await getRes.json() : null;
        
        if (existing && existing._id) {
          toast.error('Sizes for this product already exist');
          setSubmitting(false);
          return;
        }
        
        // POST new
        res = await fetch('/api/productSize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sizeData),
        });
      }
      data = await res.json();
      if (res.status === 409 && data && data.error === 'Sizes for this product already exist') {
        toast.error('Sizes for this product already exist');
        setSubmitting(false);
        return;
      }
      if (res.ok) {
        toast.success(editId ? 'Size data updated' : 'Size data saved');
        // Clear form after creation or update
        setCustomSizes([]);
        setCustomSizeInput("");
        setOptionals([
          { label: "L", checked: false },
          { label: "M", checked: false },
          { label: "XL", checked: false },
          { label: "XXL", checked: false },
        ]);
        setSizeChart(null);
        setSizeChartPreview(null);
        setSizeChartObj({ url: '', key: '' });
        setEditId(null);
        setSizeInputMethod('optionals');
        await fetchSizeEntries();
      } else {
        toast.error('Failed to save: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      toast.error("Error saving size: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Edit size entry
  const handleEdit = (entry) => {
    setEditId(entry._id);
    setSizeChartObj(entry.sizeChartUrl || { url: '', key: '' });
    setSizeChartPreview((entry.sizeChartUrl && entry.sizeChartUrl.url) ? entry.sizeChartUrl.url : null);
    if (entry.sizes && entry.sizes.length > 0) {
      // Detect if optionals or custom: if all labels are among optionals, treat as optionals
      const optionLabels = ["L", "M", "XL", "XXL"];
      const isOptionals = entry.sizes.every(item => optionLabels.includes(item.label));
      if (isOptionals) {
        setSizeInputMethod('optionals');
        setOptionals(optionLabels.map(label => ({ label, checked: !!entry.sizes.find(i => i.label === label && i.checked) })));
        setCustomSizes([]);
      } else {
        setSizeInputMethod('custom');
        setCustomSizes(entry.sizes.map(item => ({ label: item.label, checked: !!item.checked })));
        setOptionals([
          { label: "L", checked: false },
          { label: "M", checked: false },
          { label: "XL", checked: false },
          { label: "XXL", checked: false },
        ]);
      }
    }
  };
  // Delete size entry using AlertDialog
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });
  const handleDelete = (id) => {
    setDeleteDialog({ open: true, id });
  };
  const confirmDelete = async () => {
    const id = deleteDialog.id;
    setDeleteDialog({ open: false, id: null });
    try {
      const res = await fetch(`/api/productSize?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Deleted');
        await fetchSizeEntries();
      } else {
        toast.error('Failed to delete');
      }
    } catch {
      toast.error('Failed to delete');
    }
  };
  return (
    <>
      {/* Modal for image preview */}
      {modalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="bg-white rounded shadow-lg p-4 relative"
            style={{ maxWidth: '90vw', maxHeight: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={e => e.stopPropagation()}
          >
            <img src={modalImage} alt="Size Chart Preview" style={{ maxHeight: '80vh', maxWidth: '80vw', objectFit: 'contain' }} />
          </div>
        </div>
      )}

      <form className="flex flex-col items-center w-full" onSubmit={handleSubmit}>

        <h3 className="text-2xl font-bold my-4 text-center">Product Size Management</h3>
        <div className="bg-white rounded shadow-md p-6 w-full">
          <div className="mb-6 flex flex-col items-center justify-center">
            <Label className="font-semibold mb-2">Product Name</Label>
            <Input
              className="mb-4 w-80 font-black text-center border-gray-300"
              value={productName}
              disabled
              readOnly
              placeholder={productName ? "Product Name" : "Product Name not found"}
              style={productName ? {} : { border: '2px solid red', color: 'red' }}
            />
            {!productName && (
              <div style={{ color: 'red', marginTop: '4px', fontWeight: 'bold' }}>
                Product name not found! Please check if the product was created successfully.
              </div>
            )}
          </div>
          <div className="mb-6 flex flex-col items-center justify-center">
            <Label className="font-semibold mb-2">Product Size Chart <span className="text-red-500">*</span></Label>
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-gray-300 bg-gray-100 w-80 h-40 mb-2 overflow-hidden">
              {sizeChartPreview ? (
                <div className="flex items-center justify-center w-full h-full" style={{ height: '100%', width: '100%' }}>
                  <img src={sizeChartPreview} alt="Size Chart Preview" style={{ maxHeight: '144px', maxWidth: '100%', objectFit: 'contain', display: 'block', margin: '0 auto' }} />
                </div>
              ) : (
                <>
                  <span className="text-3xl mb-2">📈</span>
                  <span className="font-semibold">Add Size Chart Image</span>
                  <span className="text-xs">Browse Image</span>
                </>
              )}
            </div>
            {/* Buttons below preview */}
            <div className="flex flex-col items-center gap-2 mb-2">
              {sizeChartPreview ? (
                <Button type="button" className="bg-red-500 text-white" onClick={handleRemoveImage} disabled={uploading}>
                  Remove Image
                </Button>
              ) : (
                <Button type="button" className="bg-blue-600 text-white" onClick={() => fileInputRef.current.click()} disabled={uploading}>
                  {uploading ? (
                    <span className="flex items-center"><span className="loader mr-2"></span>Uploading...</span>
                  ) : (
                    'Upload Image'
                  )}
                </Button>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleSizeChartChange}
              disabled={uploading}
            />
          </div>

          {/* Toggle for size input method */}
          <div className="mb-6 flex gap-6 items-center">
            <Label className="font-semibold">Choose Size Input Method:</Label>
            <button
              type="button"
              className={`px-4 py-2 rounded border font-semibold transition-colors duration-150 ${sizeInputMethod === 'optionals' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-600 border-blue-600 hover:bg-blue-50'}`}
              onClick={() => handleSizeInputMethodChange('optionals')}
            >
              Choose from Checkboxes
            </button>
            <button
              type="button"
              className={`px-4 py-2 rounded border font-semibold transition-colors duration-150 ${sizeInputMethod === 'custom' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-600 border-blue-600 hover:bg-blue-50'}`}
              onClick={() => handleSizeInputMethodChange('custom')}
            >
              Write Custom Sizes
            </button>

          </div>

          {/* Custom Sizes Input */}
          {sizeInputMethod === 'custom' && (
            <div className="mb-6">
              <Label className="font-semibold">Write Product Sizes <span className="text-red-500">*</span></Label>
              <div className="flex gap-2 mt-2">
                <Input
                  type="text"
                  placeholder="Type size (e.g., S, M, L)"
                  value={customSizeInput}
                  onChange={(e) => setCustomSizeInput(e.target.value)}
                  className="bg-yellow-200 font-semibold text-lg px-4 py-2 rounded w-96"
                />
                <Button type="button" className="bg-black text-white font-bold px-4" onClick={handleAddCustomSize}>
                  Add Size
                </Button>
              </div>
              {/* Show added custom sizes as checkboxes (with tick) */}
              <div className="flex flex-wrap gap-4 mt-4">
                {customSizes.map((item, idx) => (
                  <div key={item.label} className="flex items-center gap-2">
                    <div className="bg-green-300 px-4 py-1 rounded font-semibold min-w-[70px] text-center">
                      {item.label}
                    </div>
                    <Input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => handleCustomSizeCheck(idx)}
                      className="accent-green-600 w-5 h-5"
                    />
                    <Button type="button" className="bg-red-500 text-white px-2 py-1 text-xs" onClick={() => handleRemoveCustomSize(idx)}>
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Optionals Sizes (predefined checkboxes) */}
          {sizeInputMethod === 'optionals' && (
            <div className="mb-6">
              <Label className="font-semibold">Choose Product Sizes <span className="text-red-500">*</span></Label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                {optionals.map((item, idx) => (
                  <div key={item.label} className="flex items-center gap-2">
                    <div className="bg-green-300 px-4 py-1 rounded font-semibold min-w-[70px] text-center">
                      {item.label}
                    </div>
                    <Input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => handleOptionalChange(idx)}
                      className="accent-green-600 w-5 h-5"
                    />
                    <span className="text-sm font-medium">Check Box</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="flex justify-center mt-6">
            <Button type="submit" className="bg-red-500 text-white font-bold px-10 py-2 text-lg rounded-full" disabled={submitting || uploading}>
              {submitting ? (editId ? 'Updating...' : 'Creating...') : (editId ? 'Update' : 'Data Save')}
            </Button>
            {editId && (
              <Button type="button" className="ml-4 bg-gray-400 text-white font-bold px-6 py-2 rounded-full" onClick={() => {
                setEditId(null);
                setCustomSizes([]);
                setCustomSizeInput("");
                setOptionals([
                  { label: "L", checked: false },
                  { label: "M", checked: false },
                  { label: "XL", checked: false },
                  { label: "XXL", checked: false },
                ]);
                setSizeChart(null);
                setSizeChartPreview(null);
                setSizeChartObj({ url: '', key: '' });
                setSizeInputMethod('optionals');
              }}>
                Cancel
              </Button>
            )}
          </div>

          {/* Table of sizes */}
          <div className="mt-10">
            <h4 className="font-bold text-lg mb-2">All Size Entries</h4>
            <table className="min-w-full bg-white border border-gray-200 rounded">
              <thead>
                <tr>
                  <th className="px-3 py-2 border-b">Sizes</th>
                  <th className="px-3 py-2 border-b">Type</th>
                  <th className="px-3 py-2 border-b">Size Chart</th>
                  <th className="px-3 py-2 border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sizeEntries.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-4">No size entries found.</td></tr>
                ) : sizeEntries.map(entry => (
                  <tr key={entry._id} className="border-b">
                    <td className="px-3 py-2 text-center">{entry.sizes.map(s => s.label).join(', ')}</td>
                    <td className="px-3 py-2 text-center">{["L", "M", "XL", "XXL"].every(l => entry.sizes.some(s => s.label === l)) ? 'Optionals' : 'Custom'}</td>
                    <td className="px-3 py-2 text-center">
                      {entry.sizeChartUrl && entry.sizeChartUrl.url ? (
                        <button
                          type="button"
                          className="text-blue-600 underline"
                          onClick={() => {
                            setModalImage(entry.sizeChartUrl.url);
                            setModalOpen(true);
                          }}
                        >
                          View
                        </button>
                      ) : 'N/A'}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <Button type="button" className="bg-yellow-500 text-white px-3 py-1 rounded mr-2" onClick={() => handleEdit(entry)}>Edit</Button>
                      <Button type="button" className="bg-red-500 text-white px-3 py-1 rounded" onClick={() => handleDelete(entry._id)}>Delete</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </form>
    {/* Delete Confirmation Dialog */}
    <AlertDialog open={deleteDialog.open} onOpenChange={open => setDeleteDialog(d => ({ ...d, open }))}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Size Entry?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this size entry? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>);
};

export default SizeManagement;
