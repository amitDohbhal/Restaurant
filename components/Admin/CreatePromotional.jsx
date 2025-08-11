"use client"
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Table } from '@/components/ui/table';
import { Star } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'react-hot-toast';
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { Switch } from '@/components/ui/switch';
// Placeholder for TiptapEditor, replace with your actual implementation
const TiptapEditor = ({ value, onChange }) => (
  <textarea className="w-full border rounded p-2" value={value} onChange={e => onChange(e.target.value)} placeholder="Review Description (Min 50 words)" />
);
// Helper to format date as 'DD-MM-YYYY'
function formatDateDDMMYYYY(date) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d)) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}
// Helper to convert timestamp to 'YYYY-MM-DD' for input type="date"
function dateToInputValue(date) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d)) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
import { useRef } from 'react';

const CreatePromotional = ({ artisanId, artisanDetails = null }) => {
  const [imageUploading, setImageUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imageObj, setImageObj] = useState({ url: '', key: '' }); // { url, key }
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef();

  // Handler for file input change
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageUploading(true);
    setUploadProgress(0);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/cloudinary", {
        method: "POST",
        body: formData
      });
      if (!res.ok) throw new Error("Image upload failed");
      const result = await res.json();
      setImageObj({ url: result.url, key: result.key });
      setImagePreview(result.url);
      toast.success("Image uploaded successfully");
    } catch (err) {
      toast.error("Image upload failed");
    } finally {
      setImageUploading(false);
      setUploadProgress(0);
    }
  };

  // Handler to remove uploaded image and delete from Cloudinary
  const handleRemoveImageUpload = async () => {
    if (imageObj && imageObj.key) {
      toast.loading('Deleting image...', { id: 'cloud-delete-promo' });
      try {
        const res = await fetch('/api/cloudinary', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ publicId: imageObj.key }),
        });
        const data = await res.json();
        if (res.ok) {
          toast.success('Image deleted!', { id: 'cloud-delete-promo' });
        } else {
          toast.error('Cloudinary error: ' + (data.error || 'Failed to delete image'), { id: 'cloud-delete-promo' });
        }
      } catch (err) {
        toast.error('Failed to delete image (network or server error)', { id: 'cloud-delete-promo' });
      }
    }
    setImageObj({ url: '', key: '' });
    setImagePreview(null);
  };

  // Modal state for view, edit, delete
  const [showViewModal, setShowViewModal] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Inline update handler
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!selectedPromotion) return;
    try {
      const updatedPromotion = {
        ...selectedPromotion,
        title,
        shortDescription,
        createdBy,
        date: date ? new Date(date).getTime() : undefined,
        rating,
        artisan: selectedArtisan,
        image: imageObj,
      };
      const res = await fetch('/api/promotion', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...updatedPromotion, id: selectedPromotion._id }),
      });
      if (!res.ok) throw new Error('Failed to update promotion');
      setReviews(reviews.map(r => r._id === selectedPromotion._id ? { ...r, ...updatedPromotion } : r));
      toast.success('Promotion updated!');
      handleCancelEdit();
    } catch (err) {
      toast.error('Failed to update promotion');
    }
  };

  // Cancel edit handler
  const formRef = useRef();
  const handleCancelEdit = () => {
    setSelectedPromotion(null);
    setIsEditing(false);
    setTitle('')
    setShortDescription('');
    setCreatedBy('');
    setDate('');
    setRating(0);
    setSelectedArtisan(artisanId || '');
    setImageObj({ url: '', key: '' });
    setImagePreview(null);
    // Remove focus from any input to prevent validation errors
    setTimeout(() => {
      if (document.activeElement) document.activeElement.blur();
      if (formRef.current) formRef.current.reset && formRef.current.reset();
    }, 0);
  };

  // Handler for deleting
  const [deleting, setDeleting] = useState(false);
  const handleDeletePromotion = async () => {
    if (!selectedPromotion) return;
    setDeleting(true);
    try {
      const res = await fetch('/api/promotion', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedPromotion._id }),
      });
      if (!res.ok) throw new Error('Failed to delete promotion');
      setReviews(reviews.filter(r => r._id !== selectedPromotion._id));
      setShowDeleteModal(false);
      setSelectedPromotion(null);
      toast.success('Promotion deleted!');
    } catch (err) {
      toast.error('Failed to delete promotion');
    } finally {
      setDeleting(false);
    }
  };


  // Replace these with real data fetching and state logic
  const [title, setTitle] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [createdBy, setCreatedBy] = useState('');
  const [date, setDate] = useState('');
  const [rating, setRating] = useState(0);
  const [artisans, setArtisans] = useState([]); // Fetch artisans from API
  const [selectedArtisan, setSelectedArtisan] = useState(artisanId || '');
  const [reviews, setReviews] = useState([]); // Fetch reviews from API
  const [loadingReviews, setLoadingReviews] = useState(false);
  // Dialog/modal states
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState(null);
// console.log(reviews)
  // Fetch artisans and reviews

    async function fetchArtisansAndPromotions() {
      // If artisanDetails is present, use it directly
      if (artisanDetails) {
        setSelectedArtisan(artisanDetails._id);
        // setCreatedBy(`${artisanDetails.firstName} ${artisanDetails.lastName}`);
        // setTitle(artisanDetails.title || '');
      } else {
        try {
          // Fetch artisans
          const res = await fetch('/api/createArtisan');
          const data = await res.json();
          setArtisans(data);
          // If artisanId is present, set selectedArtisan and prefill
          if (artisanId) {
            const found = data.find(a => a._id === artisanId);
            if (found) {
              setSelectedArtisan(found._id);
              // setCreatedBy(`${found.firstName} ${found.lastName}`);
              // setTitle(found.title || '');
            }
          }
        } catch (err) {
          toast.error('Failed to fetch artisans');
        }
      }
      // Fetch reviews/promotions
      try {
        setLoadingReviews(true);
        const res = await fetch((artisanDetails?._id || artisanId) ? `/api/promotion?artisanId=${artisanDetails?._id || artisanId}` : '/api/promotion');
        const data = await res.json();
        setReviews(data.promotions);
      } catch (err) {
        toast.error('Failed to fetch promotions');
      } finally {
        setLoadingReviews(false);
      }
    }
    useEffect(() => {
    fetchArtisansAndPromotions();
  }, [artisanId, artisanDetails]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedArtisan) {
      toast.error('Please select an management');
      return;
    }
    try {
      const payload = {
        title,
        shortDescription,
        rating,
        createdBy,
        date: date ? new Date(date).getTime() : undefined,
        artisan: selectedArtisan,
        image: imageObj,
      };
      // console.log("imageObj before submit:", imageObj);
      const res = await fetch('/api/promotion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Promotion saved!');
        setTitle('');
        setShortDescription('');
        setRating(0);
        setCreatedBy('');
        setDate('');
        setImageObj({ url: '', key: '' });
        setImagePreview(null);
        // Refresh reviews
        const promoRes = await fetch(selectedArtisan ? `/api/promotion?artisanId=${selectedArtisan}` : '/api/promotion');
        const promos = await promoRes.json();
        setReviews(promos.promotions);
      } else {
        toast.error(data?.error || 'Failed to save promotion');
      }
    } catch (err) {
      toast.error('Error saving promotion');
    }
  };

  const handleDelete = async () => {
    // Delete review logic
    setShowDeleteDialog(false);
    toast.success('Promotion deleted (demo)!');
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <h3 className="text-2xl font-bold mb-4 text-center">Create Promotions Testimonial / Review</h3>
      <form ref={formRef} onSubmit={isEditing ? handleUpdate : handleSubmit} className="bg-white shadow rounded p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block font-semibold mb-1">Title</label>
            <Input type="text" value={title} placeholder="Review Title" onChange={e => setTitle(e.target.value)} required />
          </div>
          <div>
            <label className="block font-semibold mb-1">Management User</label>
            <Input
              type="text"
              className="w-full border rounded p-2 bg-gray-100"
              value={
                artisanDetails
                  ? `${artisanDetails.title ? artisanDetails.title + ' ' : ''}${artisanDetails.firstName} ${artisanDetails.lastName}`
                  : (() => {
                    const found = artisans.find(a => a._id === selectedArtisan);
                    return found ? `${found.title ? found.title + ' ' : ''}${found.firstName} ${found.lastName}` : '';
                  })()
              }
              readOnly
              required
            />
          </div>
        </div>
        <div className="mb-4">
          <label className="block font-semibold mb-1">Star Rating</label>
          <div className="flex gap-2 justify-center">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="focus:outline-none"
                style={{ fontSize: '1.5rem' }}
              >
                <Star className={
                  star <= rating
                    ? "text-yellow-500 fill-yellow-500"
                    : "text-black"
                } />
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block font-semibold mb-1">Name</label>
            <Input type="text" value={createdBy} placeholder="Review Name" onChange={e => setCreatedBy(e.target.value)} required />
          </div>
          <div>
            <label className="block font-semibold mb-1">Date</label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} required />
          </div>
        </div>
        <div className="mb-4">
          <label className="block font-semibold mb-1"> Description</label>
          <TiptapEditor value={shortDescription} onChange={value => {
            const wordCount = value.trim().split(/\s+/).filter(Boolean).length;
            if (wordCount > 100) {
              toast.error('Word limit exceeded! Maximum 100 words allowed.');
              return;
            }
            setShortDescription(value);
          }} />
        </div>
        {/* Image Upload Section (Certificate style) */}
        <div className="mb-4">
          <label className="block font-semibold mb-1">Thumb Image</label>
          <div className="border rounded p-4 text-center">
            {imagePreview && (
              <img src={imagePreview} alt="Promotion Preview" className="w-32 h-32 object-cover rounded border mx-auto mb-2" />
            )}
            <div className="upload-placeholder cursor-pointer flex flex-col items-center">
              <img src="/upload-img.png" width="50" alt="Upload" className="mb-2" />
              <h5 className="mb-1">Browse Image</h5>
              <p className="text-gray-500">From Drive</p>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleImageChange}
              />
              <button
                type="button"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                onClick={() => fileInputRef.current.click()}
                disabled={imageUploading}
              >
                Browse Image
              </button>
              {imageUploading && (
                <div className="mt-2 w-full max-w-xs mx-auto">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-center mt-1">Uploading...</p>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex justify-center gap-4 mt-6">
          {isEditing ? (
            <>
              <Button type="button" onClick={handleCancelEdit} variant="secondary">Cancel</Button>
              <Button type="submit" variant="default">Update</Button>
            </>
          ) : (
            <Button type="submit">Create</Button>
          )}
        </div>
      </form>
      <div className="bg-white shadow rounded p-6">
        <h5 className="text-lg font-semibold mb-4">All Reviews</h5>
        <Table className="min-w-full divide-y divide-gray-200">
          <TableHeader>
            <TableRow className="bg-gray-100">
              <TableHead className="px-4 py-3">S.no</TableHead>
              <TableHead className="px-4 py-3">Image</TableHead>
              <TableHead className="px-4 py-3">Created By</TableHead>
              <TableHead className="px-4 py-3">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loadingReviews ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-6">Loading...</TableCell>
              </TableRow>
            ) : reviews?.length > 0 ? (
              reviews.map((review, idx) => (
                <TableRow key={review._id} className="hover:bg-gray-200 transition">
                  <TableCell className="px-4 py-3 font-medium">{idx + 1}</TableCell>
                  <TableCell className="px-4 py-3">
                    {(review.image?.url || review.image) ? (
                      <img src={review.image?.url || review.image} alt="Promotion" className="w-12 h-12 object-cover rounded border" />
                    ) : (
                      <span className="text-gray-400">No Image</span>
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-3">{review.createdBy || <span className="text-gray-400">-</span>}</TableCell>
                  <TableCell className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Button size="sm" onClick={() => {
                        setSelectedPromotion(review);
                        setShowViewModal(true);
                      }}>View</Button>
                      <Button size="sm" variant="outline" onClick={() => {
                        setSelectedPromotion(review);
                        setTitle(review.title || '');
                        setShortDescription(review.shortDescription || '');
                        setCreatedBy(review.createdBy || '');
                        setDate(dateToInputValue(review.date));
                        setRating(review.rating || 0);
                        setSelectedArtisan(review.artisan || '');
                        if (review.image && typeof review.image === 'object') {
                          setImageObj({ url: review.image.url || '', key: review.image.key || '' });
                          setImagePreview(review.image.url || null);
                        } else if (typeof review.image === 'string') {
                          setImageObj({ url: review.image, key: '' });
                          setImagePreview(review.image);
                        } else {
                          setImageObj({ url: '', key: '' });
                          setImagePreview(null);
                        }
                        setIsEditing(true);
                      }}>Edit</Button>
                      <Button size="sm" variant="destructive" onClick={() => {
                        setSelectedPromotion(review);
                        setShowDeleteModal(true);
                      }}>Delete</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-6">No reviews found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {/* Inline Modals for Promotion View/Edit/Delete */}
      {selectedPromotion && (
        <>
          {/* View Modal */}
          <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Promotion Details</DialogTitle>
              </DialogHeader>
              <div className="space-y-2">
                <div className="bg-white p-3 rounded border border-gray-200 shadow-md mb-2">
                  <div className="font-semibold text-gray-800">Title</div>
                  <div className="text-gray-600">{selectedPromotion.title}</div>
                </div>
                <div className="bg-white p-3 rounded border border-gray-200 shadow-md mb-2">
                  <div className="font-semibold text-gray-800">Rating</div>
                  <div className="text-gray-600">{selectedPromotion.rating}</div>
                </div>
                <div className="flex gap-2">
                  <div className="bg-white p-3 rounded border border-gray-200 shadow-md mb-2 w-1/2">
                    <div className="font-semibold text-gray-800">Created By</div>
                    <div className="text-gray-600">{selectedPromotion.createdBy}</div>
                  </div>
                  <div className="bg-white p-3 rounded border border-gray-200 shadow-md mb-2 w-1/2">
                    <div className="font-semibold text-gray-800">Date</div>
                    <div className="text-gray-600">{formatDateDDMMYYYY(selectedPromotion.date)}</div>
                  </div>
                </div>
                <div className="bg-white p-3 rounded border border-gray-200 shadow-md mb-2 max-h-28 overflow-y-auto">
                  <div className="font-semibold text-gray-800">Short Description</div>
                  <div className="text-gray-600">{selectedPromotion.shortDescription}</div>
                </div>
                {(selectedPromotion.image?.url || selectedPromotion.image?.key) && (
                  <div className="bg-white p-3 rounded border border-gray-200 shadow-md mb-2">
                    <div className="font-semibold text-gray-800">Image</div>
                    <img src={selectedPromotion.image?.url || "No Image"} alt="Promotion" className="w-24 h-24 object-cover rounded border mt-2" />
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="secondary" onClick={() => setShowViewModal(false)}>Close</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>



          {/* Delete Modal */}
          <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Promotion</DialogTitle>
              </DialogHeader>
              <p>Are you sure you want to delete this promotion?</p>
              <DialogFooter>
                <Button variant="secondary" onClick={() => setShowDeleteModal(false)} disabled={deleting}>Cancel</Button>
                <Button variant="destructive" onClick={handleDeletePromotion} disabled={deleting}>
                  {deleting ? (
                    <span className="flex items-center"><svg className="animate-spin mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>Deleting...</span>
                  ) : (
                    'Delete'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
};


export default CreatePromotional;
