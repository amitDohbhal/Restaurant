"use client";
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Star, Upload, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useRef } from 'react';
import { Label } from "../ui/label";
import Image from 'next/image';
const ProductReview = ({ productData, productId }) => {
  // Image upload state
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageObj, setImageObj] = useState({ url: '', key: '' });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Image handlers
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    setImageFile(file);
    if (file) {
      setUploading(true);
      toast.loading('Uploading image to Cloudinary...', { id: 'review-image-upload' });
      
      // Preview
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);

      // Upload to Cloudinary
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'product_reviews');

      try {
        const res = await fetch('/api/cloudinary', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (res.ok && data.url && data.key) {
          setImageObj({ url: data.url, key: data.key });
          toast.success('Image uploaded!', { id: 'review-image-upload' });
        } else {
          toast.error('Cloudinary upload failed: ' + (data.error || 'Unknown error'), { id: 'review-image-upload' });
        }
      } catch (err) {
        toast.error('Cloudinary upload error: ' + err.message, { id: 'review-image-upload' });
      } finally {
        setUploading(false);
      }
    } else {
      setImagePreview(null);
      setImageObj({ url: '', key: '' });
    }
  };

  // Reset file input after successful upload
  useEffect(() => {
    if (imageObj.url && fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [imageObj.url]);

  // Image delete handler
  const handleRemoveImage = async () => {
    // Remove from UI immediately
    setImageFile(null);
    setImagePreview(null);
    const prevKey = imageObj.key;
    setImageObj({ url: '', key: '' });
    if (prevKey) {
      toast.loading('Deleting image from Cloudinary...', { id: 'review-image-delete' });
      try {
        const res = await fetch('/api/cloudinary', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ publicId: prevKey }),
        });
        const data = await res.json();
        if (res.ok) {
          toast.success('Image deleted from Cloudinary!', { id: 'review-image-delete' });
        } else {
          toast.error('Cloudinary error: ' + (data.error || 'Failed to delete image from Cloudinary'), { id: 'review-image-delete' });
        }
      } catch (err) {
        toast.error('Failed to delete image from Cloudinary (network or server error)', { id: 'review-image-delete' });
      }
    }
  };

  // Existing state and handlers
  const [viewModal, setViewModal] = useState(false);
  const [createdBy, setCreatedBy] = useState("");
  // const [viewModal, setViewModal] = useState(false);
  const [viewedReview, setViewedReview] = useState(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [review, setReview] = useState("");
  const [loading, setLoading] = useState(false);
  const productTitle = productData?.title || "";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!productId || !rating || !review || !createdBy) {
      toast.error('Please provide a rating, review, createdBy, and valid product.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/productReviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          productId, 
          rating, 
          title, 
          review, 
          createdBy,
          image: imageObj.url ? {
            url: imageObj.url,
            key: imageObj.key
          } : null
        })
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        toast.error(data.error || 'Failed to submit review');
      } else {
        toast.success('Review submitted successfully!');
        setRating(0);
        setHoverRating(0);
        setTitle("");
        setReview("");
        setCreatedBy("");
        // Clear image state
        setImageFile(null);
        setImagePreview(null);
        setImageObj({ url: '', key: '' });
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        fetchReviews();
      }
    } catch (err) {
      toast.error('Error submitting review.');
    } finally {
      setLoading(false);
    }
  };

  // State for reviews, modal, and edit mode
  const [reviews, setReviews] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalReview, setModalReview] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [tableLoading, setTableLoading] = useState(false);

  // Fetch reviews for this product
  const fetchReviews = async () => {
    if (!productId) return;
    setTableLoading(true);
    try {
      const res = await fetch(`/api/productReviews?productId=${productId}`);
      const data = await res.json();
      if (res.ok && data.reviews) {
        setReviews(data.reviews);
      }
    } catch (err) {
      toast.error('Error fetching reviews.');
    } finally {
      setTableLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  // Handle edit: populate form
  const handleEdit = (review) => {
    setRating(review.rating);
    setTitle(review.title || "");
    setReview(review.review || "");
    setCreatedBy(review.createdBy || "");
    if (review.image?.url) {
      setImagePreview(review.image.url);
      setImageObj({
        url: review.image.url,
        key: review.image.key
      });
    } else {
      setImagePreview(null);
      setImageObj({ url: '', key: '' });
    }
    setEditMode(true);
    setEditId(review._id);
  };

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

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
    try {
      const res = await fetch('/api/productReviews', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId: deleteTargetId, productId })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error || 'Failed to delete review');
        return;
      }
      
      // Update UI immediately
      setReviews(reviews.filter(r => r._id !== deleteTargetId));
      toast.success('Review deleted successfully!');
      
      // Refresh reviews to ensure consistency
      fetchReviews();
    } catch (err) {
      toast.error('Error deleting review.');
    } finally {
      setShowDeleteModal(false);
      setDeleteTargetId(null);
    }
  };
  // Handle update (edit mode)
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editId || !rating || !review) {
      toast.error('Please provide a rating and review.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/productReviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          reviewId: editId, 
          productId,
          rating, 
          title, 
          review,
          image: imageObj.url ? {
            url: imageObj.url,
            key: imageObj.key
          } : null
        })
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        toast.error(data.error || 'Failed to update review');
      } else {
        setEditMode(false);
        setEditId(null);
        setRating(0);
        setHoverRating(0);
        setTitle("");
        setReview("");
        setCreatedBy("");
        // Clear image state
        setImageFile(null);
        setImagePreview(null);
        setImageObj({ url: '', key: '' });
        // Reset file input
        // fileInputRef.current?.value = '';
        fetchReviews();
      }
    } catch (err) {
      toast.error('Error updating review.');
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditMode(false);
    setEditId(null);
    setRating(0);
    setHoverRating(0);
    setTitle("");
    setReview("");
    setCreatedBy("");
    setImageFile(null);
    setImagePreview(null);
    setImageObj({ url: '', key: '' });
  };


  return (
    <>
      {/* View Review Modal */}
      <Dialog open={viewModal} onOpenChange={setViewModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Details</DialogTitle>
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700"
              onClick={() => setViewModal(false)}
              aria-label="Close"
            >
              ×
            </button>
          </DialogHeader>
          {viewedReview && (
            <div className="mb-4">
              <div className="bg-white p-3 rounded border border-gray-200 shadow-md mb-2">
                <div className="font-semibold text-gray-800">Title</div>
                <div className="text-gray-600">{viewedReview.title}</div>
              </div>
              <div className="bg-white p-3 rounded border border-gray-200 shadow-md mb-2">
                <div className="font-semibold text-gray-800">Created By</div>
                <div className="text-gray-600">{viewedReview.createdBy}</div>
              </div>
              <div className="bg-white p-3 rounded border border-gray-200 shadow-md mb-2">
                <div className="font-semibold text-gray-800">Rating</div>
                <div className="text-gray-600">{viewedReview.rating} stars</div>
              </div>
              <div className="bg-white p-3 rounded border border-gray-200 shadow-md mb-2 h-24 overflow-y-auto">
                <div className="font-semibold text-gray-800">Review</div>
                <div className="text-gray-600">{viewedReview.review}</div>
              </div>
              <div className="bg-white p-3 rounded border border-gray-200 shadow-md mb-2 h-24 overflow-y-auto">
                <div className="font-semibold text-gray-800">Image</div>
                <div className="w-12 h-12 rounded-full">
                  <img src={viewedReview.image?.url} alt="" /></div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setViewModal(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Review Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Review</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this review?</p>
          <DialogFooter>
            <Button variant="secondary" onClick={cancelDelete}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <form className="page-content" onSubmit={editMode ? handleUpdate : handleSubmit}>
        <div className="container-fluid">
          <div className="row justify-content-center">
            <div className="col-12 col-md-12 col-lg-12">
              <h3 className="my-4 text-center">Product Review</h3>
              <div className="card my-2">
                <div className="card-body px-4 py-2">
                  <div className="mb-4">
                    <label className="font-semibold">Product Name</label>
                    <Input
                      type="text"
                      className="form-control"
                      value={productTitle}
                      disabled
                      readOnly
                    />
                  </div>
                  {/* Review Image Upload */}
                  <div className="mb-4">
                    <Label className="block mb-2 font-bold">Review Image</Label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      ref={fileInputRef}
                      className="hidden"
                      id="review-image-input"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="mb-2 flex items-center gap-2 bg-blue-500 text-white"
                      onClick={() => fileInputRef.current && fileInputRef.current.click()}
                    >
                      <span>Select Review Image</span>
                      <Upload className="w-4 h-4" />
                    </Button>
                    {uploading && <div className="text-blue-600 font-semibold">Uploading...</div>}
                    {imagePreview && (
                      <div className="relative w-48 h-28 border rounded overflow-hidden mb-2">
                        <Image
                          src={imagePreview}
                          alt="Review Image Preview"
                          width={192}
                          height={112}
                          className="object-cover"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="absolute top-1 right-1 bg-white bg-opacity-80 rounded-full p-1 hover:bg-red-200"
                          title="Remove image"
                        >
                          <Trash2 className="w-5 h-5 text-red-600" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="mb-4">
                    <label htmlFor="createdBy" className="block text-sm font-medium text-gray-700">Created By</label>
                    <Input
                      id="createdBy"
                      value={createdBy}
                      onChange={e => setCreatedBy(e.target.value)}
                      className="w-full border rounded mt-1 px-3 py-2"
                      placeholder="Your name"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="font-semibold">Rating</label>
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star
                          key={star}
                          size={28}
                          className={
                            (hoverRating || rating) >= star ? 'text-yellow-500 cursor-pointer' : 'text-gray-400 cursor-pointer'
                          }
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setRating(star)}
                          fill={(hoverRating || rating) >= star ? '#FBBF24' : 'none'}
                        />
                      ))}
                    </div>
                  </div>

                  
                  <div className="mb-4">
                    <label className="form-label">Review Title</label>
                    <Input type="text" className="form-control" placeholder="Review title" value={title} onChange={e => setTitle(e.target.value)} />
                  </div>
                  <div className="mb-4">
                    <label className="form-label">Review</label>
                    <Textarea
                      id="review"
                      value={review}
                      onChange={e => {
                        const value = e.target ? e.target.value : e; // fallback for direct string
                        const safeValue = typeof value === 'string' ? value : String(value ?? '');
                        const wordCount = safeValue.trim().split(/\s+/).filter(Boolean).length;
                        if (wordCount >100) {
                          toast.error('Word limit exceeded! Maximum 100 words allowed.');
                          return;
                        }
                        setReview(safeValue);
                      }}
                      // onChange={(e) => setReview(e.target.value)}
                      rows={4}
                      className="w-full border rounded mt-1 px-3 py-2"
                      placeholder="Write your review here... (max 100 characters)"
                      required
                    />
                  </div>
                  
                  <div className="text-center space-x-2">
                    <Button type="submit" className="bg-blue-600 px-5" disabled={loading}>{loading ? (editMode ? 'Updating...' : 'Saving...') : (editMode ? 'Update Review' : 'Submit Review')}</Button>
                    {editMode && <Button type="button" className="bg-gray-400 px-5" onClick={handleCancelEdit}>Cancel</Button>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Reviews Table */}
      <div className="container-fluid mt-4">
        <div className="row justify-content-center">
          <div className="col-12 col-md-12 col-lg-12">
            <div className="card">
              <div className="card-body px-4 py-2">
                <h5 className="mb-3">Reviews</h5>
                {tableLoading ? (
                  <div>Loading...</div>
                ) : (
                  <Table className="min-w-full divide-y divide-gray-200">
                    <TableHeader>
                      <TableRow className="bg-gray-100">
                        <TableHead className="px-4 py-3 text-center">S.No</TableHead>
                        <TableHead className="px-4 py-3 text-center">Product Name</TableHead>
                        <TableHead className="px-4 py-3 text-center">Created By</TableHead>
                        <TableHead className="px-4 py-3 text-center">Rating</TableHead>
                        <TableHead className="px-4 py-3 text-center">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reviews.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-4">No reviews found.</TableCell>
                        </TableRow>
                      ) : (
                        reviews.map((r, idx) => (
                          <TableRow key={r._id}>
                            <TableCell className="px-4 py-3 text-center font-medium">{idx + 1}</TableCell>
                            <TableCell className="px-4 py-3 text-center whitespace-nowrap ">{productTitle}</TableCell>
                            <TableCell className="px-4 py-3 text-center whitespace-nowrap ">{r.createdBy}</TableCell>
                            <TableCell className="px-4 py-3 text-center whitespace-nowrap ">{r.rating}</TableCell>
                            <TableCell className="px-4 py-3 flex gap-2 justify-center">
                              <Button size="sm" variant="default" className="bg-blue-500 text-white px-3 py-1 rounded mr-2" onClick={() => {
                                setViewedReview(r);
                                setViewModal(true);
                              }}>
                                View
                              </Button>
                              <Button size="sm" variant="default" className="bg-yellow-500 text-white px-3 py-1 rounded mr-2" onClick={() => handleEdit(r)}>
                                Edit
                              </Button>
                              <Button size="sm" variant="destructive" className="bg-red-600 text-white px-3 py-1 rounded" onClick={() => openDeleteModal(r._id)}>
                                Delete
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* View Modal */}
      {modalOpen && modalReview && (
        <div className="modal show d-block" tabIndex="-1" role="dialog" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Review Details</h5>
                <button type="button" className="close" aria-label="Close" onClick={() => setModalOpen(false)}>
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
              <div className="modal-body">
                <p><strong>Product Name:</strong> {productTitle}</p>
                <p><strong>Rating:</strong> {modalReview.rating}</p>
                <p><strong>Review Title:</strong> {modalReview.title}</p>
                <p><strong>Description:</strong> {modalReview.review}</p>
              </div>
              <div className="modal-footer">
                <Button className="bg-gray-400" onClick={() => setModalOpen(false)}>Close</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductReview;
