"use client";
import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
const ProductGallery = ({ productData, productId }) => {
  const imageInputRef = useRef(null);
  const [selectedMainImage, setSelectedMainImage] = useState(null); // { url, key }
  const [selectedSubImages, setSelectedSubImages] = useState([]); // array of { url, key }
  const [imageUploading, setImageUploading] = useState(false);
  const [subImagesUploading, setSubImagesUploading] = useState(false);
  const subImagesInputRef = useRef(null);

  // --- Gallery Actions State ---
  const [viewGallery, setViewGallery] = useState(null);

  const [deleteGallery, setDeleteGallery] = useState(null);

  // --- Handlers for Gallery Actions ---
  const handleViewGallery = (gallery) => setViewGallery(gallery);
  const handleEditGallery = (gallery) => {
    setEditGallery(gallery);
    setEditMainImage(gallery.mainImage);
    setEditSubImages(gallery.subImages || []);
  };
  // Remove uploaded main image before save
  const handleRemoveMainImageUpload = async () => {
    if (selectedMainImage && selectedMainImage.key) {
      toast.loading('Deleting main image from Cloudinary...', { id: 'cloud-delete-main' });
      try {
        const res = await fetch('/api/cloudinary', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ publicId: selectedMainImage.key }),
        });
        const data = await res.json();
        if (res.ok) {
          toast.success('Main image deleted from Cloudinary!', { id: 'cloud-delete-main' });
        } else {
          toast.error('Cloudinary error: ' + (data.error || 'Failed to delete main image'), { id: 'cloud-delete-main' });
        }
      } catch (err) {
        toast.error('Failed to delete main image from Cloudinary (network or server error)', { id: 'cloud-delete-main' });
      }
    }
    setSelectedMainImage(null);
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  // Remove uploaded sub image before save
  const handleRemoveSubImageUpload = async (idx) => {
    const img = selectedSubImages[idx];
    if (img && img.key) {
      toast.loading('Deleting sub image from Cloudinary...', { id: 'cloud-delete-sub' });
      try {
        const res = await fetch('/api/cloudinary', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ publicId: img.key }),
        });
        const data = await res.json();
        if (res.ok) {
          toast.success('Sub image deleted from Cloudinary!', { id: 'cloud-delete-sub' });
        } else {
          toast.error('Cloudinary error: ' + (data.error || 'Failed to delete sub image'), { id: 'cloud-delete-sub' });
        }
      } catch (err) {
        toast.error('Failed to delete sub image from Cloudinary (network or server error)', { id: 'cloud-delete-sub' });
      }
    }
    setSelectedSubImages(prev => prev.filter((_, i) => i !== idx));
  };


  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deletingGalleryId, setDeletingGalleryId] = useState(null);

  // Open delete modal
  const openDeleteModal = (id) => {
    setDeleteTargetId(id);
    setShowDeleteModal(true);
  };

  // Cancel delete
  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteTargetId(null);
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    setDeletingGalleryId(deleteTargetId);
    // Find the gallery to delete in state (to get image keys)
    const galleryToDelete = galleries.find(g => g._id === deleteTargetId);
    let mainImageKey = null;
    let subImageKeys = [];
    if (galleryToDelete) {
      // Use new schema: mainImage and subImages are objects with url and key
      if (galleryToDelete.mainImage && galleryToDelete.mainImage.key) {
        mainImageKey = galleryToDelete.mainImage.key;
      }
      if (Array.isArray(galleryToDelete.subImages)) {
        subImageKeys = galleryToDelete.subImages.map(img => img && img.key ? img.key : null).filter(Boolean);
      }
    }
    try {
      const res = await fetch('/api/productGallery', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ galleryId: deleteTargetId })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setGalleries(galleries => galleries.filter(g => g._id !== deleteTargetId));
        toast.success('Gallery deleted successfully');
        // Now delete images from Cloudinary
        if (mainImageKey) {
          fetch('/api/cloudinary', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ publicId: mainImageKey })
          });
        }
        if (subImageKeys.length > 0) {
          subImageKeys.forEach(key => {
            fetch('/api/cloudinary', {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ publicId: key })
            });
          });
        }
      } else {
        toast.error(data.error || 'Failed to delete gallery');
      }
    } catch (err) {
      toast.error('Failed to delete gallery');
    } finally {
      setShowDeleteModal(false);
      setDeleteTargetId(null);
      setDeletingGalleryId(null);
    }
  };

  const handleDeleteGallery = (gallery) => openDeleteModal(gallery._id);

  // Add missing handleFileUpload functions
  const handleFileUpload = () => {
    if (imageInputRef.current) {
      imageInputRef.current.click();
    }
  };

  const productTitle = productData?.title || "";

  // Gallery Table State
  const [galleries, setGalleries] = useState([]);
  const [loadingGalleries, setLoadingGalleries] = useState(false);

  const [editGallery, setEditGallery] = useState(null);
  const [editMainImage, setEditMainImage] = useState(null); // should be {url, key} or null
  const [editSubImages, setEditSubImages] = useState([]); // should be array of {url, key}

  // When entering edit mode, set edit images as objects
  // Only declare handleEditGallery once



  // Fetch galleries for this product
  useEffect(() => {
    if (!productId) return;
    setLoadingGalleries(true);
    fetch(`/api/productGallery?productId=${productId}`)
      .then(async res => {
        if (!res.ok) return setGalleries([]);
        const data = await res.json();
        if (Array.isArray(data)) {
          setGalleries(data.filter(g => g.product && g.product._id === productId));
        } else {
          setGalleries([]);
        }
      })
      .finally(() => setLoadingGalleries(false));
  }, [productId]);

  const handleMainImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setImageUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/cloudinary', {
        method: 'POST',
        body: formData
      });
      if (!res.ok) throw new Error('Image upload failed');
      const result = await res.json();
      if (editGallery) {
        setEditMainImage({ url: result.url, key: result.key });
      } else {
        setSelectedMainImage({ url: result.url, key: result.key });
      }
      toast.success('Main image uploaded successfully');
    } catch (err) {
      toast.error('Main image upload failed');
    } finally {
      setImageUploading(false);
      if (file && imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const handleSubImagesUploadClick = () => {
    if (subImagesInputRef.current) {
      subImagesInputRef.current.value = '';
      subImagesInputRef.current.click();
    }
  };

  const handleSubImagesUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (!files.length) return;
    // Determine current sub images state based on edit mode
    const currentSubImages = editGallery ? editSubImages : selectedSubImages;
    if (currentSubImages.length + files.length > 10) {
      toast.error('You can only add up to 10 sub images.');
      return;
    }
    setSubImagesUploading(true);
    try {
      const uploaded = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/cloudinary', {
          method: 'POST',
          body: formData
        });
        if (!res.ok) throw new Error('Sub image upload failed');
        const result = await res.json();
        uploaded.push({ url: result.url, key: result.key });
      }
      if (editGallery) {
        setEditSubImages(prev => [...prev, ...uploaded]);
      } else {
        setSelectedSubImages(prev => [...prev, ...uploaded]);
      }
      toast.success('Sub image(s) uploaded successfully');
    } catch (err) {
      toast.error('Sub image upload failed');
    } finally {
      setSubImagesUploading(false);
      if (files.length && subImagesInputRef.current) subImagesInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!productId) {
      toast.error('No product selected');
      return;
    }
    // Prepare mainImage and subImages for Gallery model
    if (!selectedMainImage || !selectedMainImage.url || !selectedMainImage.key) {
      toast.error('Please upload a main image');
      return;
    }
    // Use full {url, key} objects for both
    const mainImage = {
      url: selectedMainImage.url,
      key: selectedMainImage.key
    };
    const subImages = selectedSubImages
      .filter(img => img.url && img.key)
      .map(img => ({ url: img.url, key: img.key }));


    try {
      // Check if gallery exists for this product
      const resGallery = await fetch(`/api/productGallery?productId=${productId}`);
      let galleryData = null;
      if (resGallery.ok) {
        const galleriesRes = await resGallery.json();
        galleryData = Array.isArray(galleriesRes)
          ? galleriesRes.find(g => g.product && g.product._id === productId)
          : null;
      }
      // If gallery exists, prevent creating a duplicate
      if (galleryData && galleryData._id) {
        toast.error('A gallery for this product already exists. Please edit or delete the existing gallery.');
        return;
      }
      // Otherwise, create a new gallery
      const payload = { productId, mainImage, subImages };
      const apiRes = await fetch('/api/productGallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!apiRes.ok) throw new Error('Failed to save gallery');
      toast.success('Product gallery saved successfully');
      // Clear form state
      setSelectedMainImage(null);
      setSelectedSubImages([]);
      if (imageInputRef.current) imageInputRef.current.value = '';
      if (subImagesInputRef.current) subImagesInputRef.current.value = '';
      // Refresh galleries table
      refreshGalleries();
    } catch (err) {
      toast.error('Failed to save gallery');
    }
  };

  // Utility to refresh galleries table
  const refreshGalleries = () => {
    fetch(`/api/productGallery?productId=${productId}`)
      .then(async res => {
        if (!res.ok) return setGalleries([]);
        const data = await res.json();
        if (Array.isArray(data)) {
          setGalleries(data.filter(g => g.product && g.product._id === productId));
        } else {
          setGalleries([]);
        }
      })
      .catch(() => setGalleries([]));
  };

  // Edit handler for updating an existing gallery
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editGallery || !editGallery._id) {
      toast.error('No gallery selected for editing');
      return;
    }
    if (!editMainImage) {
      toast.error('Please provide a main image URL');
      return;
    }
    const mainImage = editMainImage;
    const subImages = editSubImages;
    try {
      const apiRes = await fetch('/api/productGallery', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ galleryId: editGallery._id, mainImage, subImages })
      });
      if (!apiRes.ok) throw new Error('Failed to update gallery');
      toast.success('Product gallery updated successfully');
      setEditGallery(null);
      refreshGalleries();
    } catch (err) {
      toast.error('Failed to update gallery');
    }
  };


  return (
    <div className="flex justify-center items-center py-5 w-full">
      <div className="w-full max-w-2xl">
        <h4 className="font-bold mb-4 text-center">Product Image Gallery</h4>
        <form onSubmit={editGallery ? handleEditSubmit : handleSubmit}>
          <div className="mb-4">
            <label className="font-semibold">Product Name</label>
            <Input
              type="text"
              className="form-control"
              placeholder="Product Name"
              value={productTitle}
              disabled
              readOnly
            />
          </div>
          <div className="mb-4">
            <label className="font-semibold">Product Main Photo</label>
            <div className="border rounded p-4 bg-gray-50">
              <div className="text-center">
                {(editGallery ? editMainImage?.url : selectedMainImage?.url) ? (
                  <div className="relative mb-3 inline-block">
                    <img
                      src={editGallery ? editMainImage?.url : selectedMainImage.url}
                      alt="Preview"
                      className="rounded object-contain mx-auto"
                      style={{ maxHeight: '150px', display: 'block' }}
                    />
                    <button
                      type="button"
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full px-2"
                      onClick={() => {
                        if (editGallery) setEditMainImage("");
                        else {
                          handleRemoveMainImageUpload();
                        }
                      }}
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div
                    className="upload-placeholder border border-dashed border-gray-400 rounded-lg p-6 bg-white cursor-pointer"
                    onClick={handleFileUpload}
                  >
                    <div className="flex flex-col items-center">
                      <span className="text-4xl">📷</span>
                      <h5 className="mb-2">Browse Image</h5>
                      <p className="text-md mb-0">From Drive</p>
                    </div>
                  </div>
                )}
              </div>
              <input
                type="file"
                id="imageUpload"
                className="hidden"
                accept="image/*"
                ref={imageInputRef}
                onChange={handleMainImageUpload}
              />
              <div className="text-center mt-3">
                <Button
                  type="button"
                  className="bg-gray-800 text-white px-4 py-2"
                  onClick={handleFileUpload}
                >
                  {imageUploading ? 'Uploading...' : ((editGallery ? editMainImage : selectedMainImage) ? 'Change Image' : 'Choose Image')}
                </Button>
              </div>
            </div>
          </div>
          {/* Sub Images */}
          <div className="mb-4">
            <label className="font-semibold">Product Sub Images</label>
            <div className="border rounded p-4 bg-gray-50">
              <div className="flex flex-wrap gap-2 mb-3">
                {(editGallery ? editSubImages : selectedSubImages).length > 0 ? (
                  (editGallery ? editSubImages : selectedSubImages).map((img, idx) => (
                    <div key={img.key || idx} className="relative inline-block group">
                      <img
                        src={img.url}
                        alt={`Sub ${idx + 1}`}
                        className="rounded object-contain"
                        style={{ maxHeight: '100px', maxWidth: '100px', display: 'block' }}
                      />
                      <button
                        type="button"
                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full px-2 text-md opacity-80 hover:opacity-100 group-hover:opacity-100"
                        style={{ transform: 'translate(40%,-40%)' }}
                        onClick={() => {
                          if (editGallery) {
                            setEditSubImages(editSubImages.filter((s, i) => i !== idx));
                          } else {
                            handleRemoveSubImageUpload(idx);
                          }
                        }}
                        aria-label={`Remove sub image ${idx + 1}`}
                      >
                        ×
                      </button>
                    </div>
                  ))
                ) : (
                  <span className="text-gray-400">No sub images selected.</span>
                )}
              </div>
              <input
                type="file"
                id="subImagesUpload"
                className="hidden"
                accept="image/*"
                multiple
                ref={subImagesInputRef}
                onChange={handleSubImagesUpload}
              />
              <div className="text-center mt-3">
                <Button
                  type="button"
                  className="bg-gray-800 text-white px-4 py-2"
                  onClick={handleSubImagesUploadClick}
                >
                  {subImagesUploading ? 'Uploading...' : ((editGallery ? editSubImages : selectedSubImages).length > 0 ? 'Add More Images' : 'Choose Images')}
                </Button>
                <div className="text-xs text-gray-500 mt-1">Max 10 images. Selected: {(editGallery ? editSubImages : selectedSubImages).length}</div>
              </div>
            </div>
            {/* Submit Button */}
            <div className="text-center">
              {editGallery ? (
                <>
                  <Button type="submit" className="bg-green-600 px-5 font-semibold mt-3 mr-2">Update</Button>
                  <Button type="button" className="bg-gray-400 px-5 font-semibold mt-3" onClick={() => setEditGallery(null)}>Cancel</Button>
                </>
              ) : (
                <Button type="submit" className="bg-red-500 px-5 font-semibold mt-3">
                  Save Data
                </Button>
              )}
            </div>
          </div>
        </form>
        {/* Gallery Table */}
        <div className="mt-8">
          <h5 className="font-semibold mb-2">Existing Galleries</h5>
          {loadingGalleries ? (
            <div>Loading galleries...</div>
          ) : (
            <table className="w-full border text-sm">
              <thead>
                <tr>
                  <th className="border px-2 py-1 text-center">Proudct Name</th>
                  <th className="border px-2 py-1 text-center">Main Image</th>
                  <th className="border px-2 py-1 text-center" >Actions</th>
                </tr>
              </thead>
              <tbody>
                {galleries.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-2">No galleries found.</td></tr>
                ) : (
                  galleries.map(gallery => (
                    <tr key={gallery._id}>
                      <td className="border px-2 py-1 text-center">{gallery.product && gallery.product.title ? gallery.product.title : 'N/A'}</td>
                      <td className="border px-2 py-1 text-center">
                        <div className="flex justify-center items-center">
                          <img src={gallery.mainImage && gallery.mainImage.url ? gallery.mainImage.url : ''} alt="main" width={100} />
                        </div>
                      </td>
                      <td className="border px-2 py-1 text-center">
                        <Button type="button" onClick={() => handleViewGallery(gallery)} className="bg-green-500 text-white px-2 py-1 mr-2">View</Button>
                        <Button type="button" onClick={() => handleEditGallery(gallery)} className="bg-blue-500 text-white px-2 py-1 mr-2">Edit</Button>
                        {deletingGalleryId === gallery._id ? (
                          <Button type="button" disabled className="bg-red-500 text-white px-2 py-1 flex items-center justify-center">
                            <svg className="animate-spin h-4 w-4 mr-1 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
                            Deleting...
                          </Button>
                        ) : (
                          <Button type="button" onClick={() => handleDeleteGallery(gallery)} className="bg-red-500 text-white px-2 py-1">Delete</Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        <Dialog open={!!viewGallery} onOpenChange={() => setViewGallery(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Gallery Details</DialogTitle>
            </DialogHeader>
            {viewGallery && (
              <div>
                <div className="mb-4">
                  <div className="font-semibold text-gray-800 mb-1">Main Image</div>
                  <img src={viewGallery.mainImage?.url} alt="main" className="mx-auto rounded border" width={200} />
                </div>
                <div className="mb-4">
                  <div className="font-semibold text-gray-800 mb-1">Sub Images</div>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {viewGallery.subImages && viewGallery.subImages.length > 0 ? (
                      viewGallery.subImages.map((img, i) => (
                        <img key={i} src={img.url} alt={`sub-${i}`} width={60} className="rounded border" />
                      ))
                    ) : (
                      <span className="text-gray-400">No sub images</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Gallery Dialog */}
        <Dialog open={showDeleteModal} onOpenChange={cancelDelete}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Gallery</DialogTitle>
            </DialogHeader>
            <div>Are you sure you want to delete this gallery?</div>
            <DialogFooter>
              <Button variant="secondary" onClick={cancelDelete}>Cancel</Button>
              <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>


      </div >
    </div>
  );
};

export default ProductGallery;
