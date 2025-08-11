import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import toast from "react-hot-toast";

export default function ReviewModal({ open, onClose, onSubmit, artisan, type = 'artisan' }) {
  const [uploading, setUploading] = useState(false);
  // Initial form state
  const initialFormState = {
    name: "",
    date: "",
    thumb: null,
    rating: 0,
    title: "",
    description: ""
  };

  const [form, setForm] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [thumbPreview, setThumbPreview] = useState(null);
  
  // Reset form to initial state
  const resetForm = () => {
    setForm(initialFormState);
    setThumbPreview(null);
  };
  
  // Handle modal close
  const handleClose = () => {
    if (!isSubmitting) {
      resetForm();
      onClose();
    }
  };
  
  // Clean up object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (thumbPreview) {
        URL.revokeObjectURL(thumbPreview);
      }
    };
  }, [thumbPreview]);

  // Use a key to force remount when modal is reopened
  const modalKey = open ? 'review-modal-open' : 'review-modal-closed';

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "thumb") {
      setForm((f) => ({ ...f, thumb: files[0] }));
      setThumbPreview(files[0] ? URL.createObjectURL(files[0]) : null);
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };

  const handleRating = (val) => setForm((f) => ({ ...f, rating: val }));

  const handleThumbUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/cloudinary', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setForm((prev) => ({ ...prev, thumb: { url: data.url, key: data.key || '' } }));
        if (window.toast) window.toast.success('Image uploaded!');
      } else {
        if (window.toast) window.toast.error('Cloudinary upload failed: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      if (window.toast) window.toast.error('Cloudinary upload error: ' + err.message);
    }
    setUploading(false);
  };

  const handleRemoveThumb = () => {
    setForm((prev) => ({ ...prev, thumb: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSubmitting) return; // Prevent double submission
    
    // Ensure we have all form values with proper trimming
    const formValues = {
      name: String(form.name || '').trim(),
      title: String(form.title || '').trim(),
      description: String(form.description || '').trim(),
      rating: Number(form.rating || 0),
      thumb: form.thumb || null,
      type: type || 'all' // Default to 'all' if type is not specified
    };
    
    // Client-side validation
    const requiredFields = ['name', 'title', 'description', 'rating'];
    const missingFields = requiredFields.filter(field => {
      const value = formValues[field];
      return value === undefined || value === null || value === '' || (field === 'rating' && (isNaN(value) || value < 1 || value > 5));
    });
    
    if (missingFields.length > 0) {
      toast.error(`Please fill all required fields: ${missingFields.join(', ')}`);
      return;
    }

    // Prepare the payload with all required fields
    const payload = {
      name: formValues.name,
      title: formValues.title,
      description: formValues.description,
      rating: formValues.rating,
      date: Date.now(),
      thumb: formValues.thumb,
      type: formValues.type,
      approved: false,
      active: true,
      deleted: false
    };

    // Add artisan reference if this is an artisan review
    if (formValues.type === 'artisan' && artisan?._id) {
      payload.artisan = String(artisan._id);
    }

    const toastId = toast.loading('Submitting your review...');
    setIsSubmitting(true);

    try {
      // console.log('Submitting review with payload:', payload);
      const response = await fetch("/api/saveReviews", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json().catch(() => ({}));
      
      if (!response.ok) {
        // console.error('Server validation error:', responseData);
        throw new Error(responseData.message || "Failed to submit review. Please try again.");
      }

      // Show success message
      toast.success("Thank you for your review! It is pending admin approval and will be visible once approved.", {
        id: toastId,
        duration: 5000
      });
      
      // Reset form and close modal
      resetForm();
      onClose();
      
      // Notify parent component if needed
      if (onSubmit && responseData._id) {
        onSubmit({
          _id: responseData._id,
          type: payload.type
        });
      }
      
    } catch (error) {
      // console.error("Error submitting review:", error);
      toast.error(`Failed to submit review: ${error.message}`, {
        id: toastId
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div key={modalKey} className="fixed inset-0 z-[99999] bg-black/40 flex items-center justify-center p-0 overflow-y-auto">
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg md:h-screen h-[90vh] p-6 md:p-4 flex flex-col overflow-y-auto scrollbar-none" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <style>{`.scrollbar-none::-webkit-scrollbar { display: none; }`}</style>
        {/* Close X top right */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-black text-2xl"
          aria-label="Close"
        >
          <X size={28} />
        </button>
        <h2 className="text-xl font-bold text-center mb-2">Write Review</h2>
        <p className="text-center text-sm text-gray-600 mb-2">Help us improve — share your feedback.</p>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div>
            <label className="block mb-1">Name</label>
            <input
              name="name"
              type="text"
              className="w-full border border-gray-300 rounded px-3 py-2 outline-none focus:border-black"
              placeholder="Enter your name"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className="block mb-1">Thumb Image</label>
            <label className="block w-full cursor-pointer">
              <input
                name="thumb"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleThumbUpload}
              />
              <div className="w-full bg-black text-white py-2 rounded text-center flex items-center justify-center gap-2">
                Select Image
                {uploading && <span className="ml-2 text-xs text-yellow-400 animate-pulse">Uploading...</span>}
              </div>
            </label>
            {form.thumb && form.thumb.url && (
              <div className="relative inline-block mt-2">
                <img src={form.thumb.url} alt="Preview" className="h-20 w-20 object-cover rounded" />
                <button
                  type="button"
                  onClick={handleRemoveThumb}
                  className="absolute top-0 right-0 bg-white bg-opacity-80 rounded-full p-1 text-black hover:bg-red-500 hover:text-white transition-colors"
                  style={{ transform: 'translate(40%,-40%)' }}
                  aria-label="Remove image"
                >
                  &#10005;
                </button>
              </div>
            )}
          </div>
          <div className="flex flex-col flex-1">
            <label className="font-semibold mb-1">Date</label>
            <input
              name="date"
              type="date"
              value={form.date}
              onChange={handleChange}
              className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00b67a]"
            />
          </div>
          <div>
            <label className="block mb-1">Rating</label>
            <div className="flex gap-1 items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => handleRating(star)}
                  className="focus:outline-none"
                >
                  <span className={`text-2xl ${form.rating >= star ? "text-yellow-400" : "text-gray-300"}`}>&#9733;</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block mb-1">Review Title</label>
            <input
              name="title"
              type="text"
              className="w-full border border-gray-300 rounded px-3 py-2 outline-none focus:border-black"
              placeholder="Give your review a title"
              value={form.title}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className="block mb-1">Body Of Review (100)</label>
            <textarea
              name="description"
              rows={4}
              maxLength={100}
              className="w-full border border-gray-300 rounded px-3 py-2 outline-none focus:border-black resize-none"
              placeholder="Write your comments here"
              value={form.description}
              onChange={handleChange}
              required
            />
          </div>
          <div className="flex w-full justify-between items-center mt-2">
            <button
              type="submit"
              className="bg-black text-white font-bold px-8 py-2 rounded hover:bg-gray-800 transition-colors"
            >
              SUBMIT REVIEW
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-600 hover:text-black border border-gray-400 rounded px-4 py-2"
            >
              Close
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

