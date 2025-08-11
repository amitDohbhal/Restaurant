"use client";
import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
  
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// Placeholder for TiptapEditor. Replace with your actual implementation or import.
const TiptapEditor = ({ value, onChange }) => (
  <textarea className="w-full border rounded p-2" value={value} onChange={e => onChange(e.target.value)} placeholder="Rich text editor coming soon..." />
);

const ArtisonStory = ({ artisanId, artisanDetails = null }) => {
  const imageInputRef = useRef();
  const [artisans, setArtisans] = useState([]);
  const [selectedArtisan, setSelectedArtisan] = useState(artisanId || '');
  const [title, setTitle] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [longDescription, setLongDescription] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Image upload handler
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageUploading(true);
    setUploadProgress(0);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/cloudinary', {
        method: 'POST',
        body: formData
      });
      if (!res.ok) throw new Error('Image upload failed');
      const result = await res.json();
      setSelectedImage({ url: result.url, key: result.key });
      toast.success('Image uploaded successfully');
    } catch (err) {
      toast.error('Image upload failed');
    } finally {
      setImageUploading(false);
      setUploadProgress(0);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const [removingImage, setRemovingImage] = useState(false);

  const handleRemoveImage = async () => {
    if (!selectedImage || !selectedImage.key) {
      toast.error('No valid Cloudinary key found for this image.', { id: 'cloud-delete-story' });
      setSelectedImage(null);
      if (imageInputRef.current) imageInputRef.current.value = '';
      return;
    }
    setRemovingImage(true);
    toast.loading('Deleting image from Cloudinary...', { id: 'cloud-delete-story' });
    try {
      const res = await fetch('/api/cloudinary', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicId: selectedImage.key })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Image deleted from Cloudinary!', { id: 'cloud-delete-story' });
        setSelectedImage(null);
        if (imageInputRef.current) imageInputRef.current.value = '';
      } else {
        toast.error('Cloudinary error: ' + (data.error || 'Failed to delete image from Cloudinary'), { id: 'cloud-delete-story' });
      }
    } catch (err) {
      toast.error('Failed to delete image from Cloudinary (network or server error)', { id: 'cloud-delete-story' });
    } finally {
      setRemovingImage(false);
    }
  };



  const [stories, setStories] = useState([]);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedStory, setSelectedStory] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);


  // Placeholder fetchers (replace with your API calls)
const fetchStories = async () => {
    const currentArtisanId = artisanDetails?._id || artisanId || selectedArtisan;
    if (!currentArtisanId) {
      setStories([]);
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`/api/artisanStory?artisanId=${currentArtisanId}`);
      const data = await res.json();
      if (data.success) {
        setStories(data.stories || []);
      } else {
        toast.error(data.message || 'Failed to fetch stories');
        setStories([]);
      }
    } catch (err) {
      console.error('Error fetching stories:', err);
      toast.error('Failed to fetch stories');
      setStories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStories();
  }, [artisanId, artisanDetails, selectedArtisan]);
 
  const handleEditStory = (story) => {
    setEditMode(true);
    setEditingId(story._id);
    setTitle(story.title);
    setShortDescription(story.shortDescription);
    setLongDescription(story.longDescription || '');
    setSelectedArtisan(story.artisan?._id || '');
    setSelectedImage(story.images ? { url: story.images.url, key: story.images.key } : null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };


  const handleDeleteStory = (story) => {
    setShowDeleteModal(true);
    setDeleteId(story._id);
    setSelectedStory(story);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch('/api/artisanStory', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteId }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Story deleted successfully!');
        fetchStories();
      } else {
        toast.error(data.message || 'Failed to delete story');
      }
    } catch (err) {
      toast.error('Failed to delete story');
    } finally {
      setShowDeleteModal(false);
      setDeleteId(null);
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Prepare the story data
    const storyData = {
      title,
      shortDescription,
      longDescription,
      images: selectedImage ? { url: selectedImage.url, key: selectedImage.key } : undefined,
      artisan: artisanDetails?._id || selectedArtisan,
    };

    if (!storyData.artisan) {
      toast.error('Please select an artisan.');
      setIsSubmitting(false);
      return;
    }
    if (!storyData.title || !storyData.shortDescription || !storyData.longDescription) {
      toast.error('Please fill all required fields.');
      setIsSubmitting(false);
      return;
    }

    try {
      let res, data;
      if (editMode && editingId) {
        // Update existing story
        res = await fetch('/api/artisanStory', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ _id: editingId, ...storyData }),
        });
        data = await res.json();
        if (data.success) {
          toast.success('Story updated successfully!');
          clearForm();
          setEditMode(false);
          setEditingId(null);
          fetchStories();
        } else {
          if (data.message && data.message.includes('already exists')) {
            toast.error('This Management story already exists!');
          } else {
            toast.error(data.message || 'Failed to update story');
          }
        }
      } else {
        // Create new story
        res = await fetch('/api/artisanStory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(storyData),
        });
        data = await res.json();
        if (data.success) {
          toast.success('Story created successfully!');
          clearForm();
          fetchStories();
        } else {
          if (data.message && data.message.includes('already exists')) {
            toast.error('This Management story already exists!');
          } else {
            toast.error(data.message || 'Failed to create story');
          }
        }
      }
    } catch (err) {
      toast.error('Something went wrong!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearForm = () => {
    setTitle('');
    setShortDescription('');
    setLongDescription('');
    setSelectedImage(null);
    // Only reset selectedArtisan if there's no artisanId provided
    if (!artisanId) {
      setSelectedArtisan('');
    }
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setEditingId(null);
    clearForm();
  };

  useEffect(() => {
    fetchStories(selectedArtisan || artisanId);
  }, [selectedArtisan, artisanId]);

  // GROUP STORIES BY ARTISAN
  const groupedStories = stories.reduce((acc, story) => {
    const artisanId = story.artisan?._id;
    if (!artisanId) return acc;
    if (!acc[artisanId]) {
      acc[artisanId] = { artisan: story.artisan, stories: [] };
    }
    acc[artisanId].stories.push(story);
    return acc;
  }, {});

  const handleViewStories = (group) => {
    setSelectedStory(group.stories[0]);
    setShowViewModal(true);
  };

  return (
    <div className="page-content">
      <div className="container-fluid px-3">
        <div className="row justify-center">
          <div className="w-full max-w-5xl mx-auto">
            <h4 className="my-4 text-center font-bold text-2xl">Create Management Story</h4>
            <div className="bg-white rounded shadow p-6 mb-6">
              <form onSubmit={handleSubmit}>
                <div className="flex gap-4 mb-4">
                  <div className="flex-1">
                    <label className="block font-semibold mb-1">Story Title</label>
                    <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full border rounded px-3 py-2" required />
                  </div>
                  <div className="w-64">
                    <label className="block font-semibold mb-1">Management User</label>
                    {artisanDetails ? (
                      <input
                        type="text"
                        className="w-full border rounded p-2 bg-gray-100"
                        value={
                          artisanDetails.title
                            ? `${artisanDetails.title} ${artisanDetails.firstName} ${artisanDetails.lastName}`
                            : `${artisanDetails.firstName} ${artisanDetails.lastName}`
                        }
                        readOnly
                        required
                      />
                    ) : (
                      <select
                        value={selectedArtisan}
                        onChange={e => setSelectedArtisan(e.target.value)}
                        className="w-full border rounded px-3 py-2"
                        required
                      >
                        <option value="">Select Artisan</option>
                        {artisans && artisans.length > 0 && artisans.map(artisan => (
                          <option key={artisan._id} value={artisan._id}>
                            {artisan.firstName} {artisan.lastName}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block font-semibold mb-1">Upload Image</label>
                  <div className="border rounded p-4 text-center">
                    {selectedImage ? (
                      <div className="relative inline-block mb-3">
                        <img
                          src={selectedImage.url}
                          alt="Story Preview"
                          className="w-56 h-36 object-cover rounded mx-auto"
                        />
                        <button
                          type="button"
                          className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center"
                          onClick={handleRemoveImage}
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <div className="upload-placeholder cursor-pointer flex flex-col items-center">
                        <img src="/upload-img.png" width="50" alt="Upload" className="mb-2" />
                        <h5 className="mb-1">Browse Image</h5>
                        <p className="text-gray-500">From Drive</p>
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          ref={imageInputRef}
                          onChange={handleImageChange}
                        />
                        <button
                          type="button"
                          className="bg-blue-600 text-white px-4 py-2 rounded mt-2"
                          onClick={() => imageInputRef.current && imageInputRef.current.click()}
                          disabled={imageUploading}
                        >
                          {imageUploading ? 'Uploading...' : 'Browse Image'}
                        </button>
                        {imageUploading && (
                          <div className="w-full mt-2">
                            <div className="bg-gray-200 rounded h-2 overflow-hidden">
                              <div
                                className="bg-blue-500 h-2 rounded"
                                style={{ width: `${uploadProgress}%`, transition: 'width 0.3s' }}
                              />
                            </div>
                            <div className="text-sm text-gray-600 mt-1">Uploading... {uploadProgress}%</div>
                          </div>
                        )}
                      </div>
                    )}
                    {selectedImage && (
                      <div className="text-center mt-3">
                        <button
                          type="button"
                          className="bg-red-600 text-white px-4 py-2 rounded flex items-center justify-center gap-2"
                          onClick={handleRemoveImage}
                          disabled={removingImage}
                        >
                          {removingImage && (
                            <svg className="animate-spin h-4 w-4 mr-1 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                            </svg>
                          )}
                          Remove Image
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block font-semibold mb-1">Short Description</label>
                  <textarea
                    rows={2}
                    value={shortDescription}
                    onChange={e => setShortDescription(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block font-semibold mb-1">Long Description</label>
                  <TiptapEditor value={longDescription} onChange={setLongDescription} />
                </div>
                <div className="flex justify-center gap-4 mt-6">
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-5 py-2 rounded"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Creating...' : (editMode ? 'Update' : 'Create')}
                  </button>
                  {editMode && (
                    <button
                      type="button"
                      className="bg-gray-400 text-white px-5 py-2 rounded ml-2"
                      onClick={handleCancelEdit}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
          {/* Stories Table */}
          <div className="bg-white rounded shadow p-6">
            <h4 className="mb-3 font-semibold text-lg">Manage Stories</h4>
            <div className="overflow-x-auto">
              <Table className="min-w-full text-sm border border-gray-200 rounded">
                <TableHeader className="bg-gray-100">
                  <TableRow>
                    <TableHead className="py-2 px-3 border-b text-center">S.no</TableHead>
                    <TableHead className="py-2 px-3 border-b text-center">Story Image</TableHead>
                    <TableHead className="py-2 px-3 border-b text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stories.length === 0 || Object.keys(groupedStories).length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-4">No stories found.</TableCell></TableRow>
                  ) : (
                    Object.values(groupedStories).map((group, idx) => (
                      <TableRow key={group.artisan._id}>
                        <TableCell className="py-2 px-3 border-b text-center">{idx + 1}</TableCell>
                        <TableCell className="py-2 px-3 border-b text-center">
                          {group.stories[0] && group.stories[0].images && group.stories[0].images.url ? (
                            <div className="w-16 h-16 rounded-lg overflow-hidden border flex items-center justify-center bg-white mx-auto">
                              <img
                                src={group.stories[0].images.url}
                                alt="Story"
                                className="w-full h-full object-cover mx-auto"
                                onError={e => { e.target.onerror = null; e.target.src = '/placeholder.png'; }}
                              />
                            </div>
                          ) : (
                            <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center text-gray-500 border mx-auto">N/A</div>
                          )}
                        </TableCell>
                        <TableCell className="py-2 px-3 border-b text-center">
                          <button
                            type="button"
                            className="bg-blue-500 text-white px-3 py-1 rounded mr-2"
                            onClick={() => handleViewStories(group)}
                          >
                            View
                          </button>
                          <button
                            type="button"
                            className="bg-yellow-500 text-white px-3 py-1 rounded mr-2"
                            onClick={() => handleEditStory(group.stories[0])}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="bg-red-600 text-white px-3 py-1 rounded"
                            onClick={() => handleDeleteStory(group.stories[0])}
                          >
                            Delete
                          </button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
          {/* Stories Modal and other modals can be added here as needed */}
        </div>
      </div>
      {/* View Modal */}
      {showViewModal && selectedStory && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30">
          <div className="bg-white p-6 rounded shadow-lg max-w-lg w-full">
            <h3 className="font-bold text-xl mb-4">Story Details</h3>
            <div className="bg-white p-3 rounded border border-gray-200 shadow-md mb-2">
              <div className="font-semibold text-gray-800">Title</div>
              <div className="text-gray-600">{selectedStory.title}</div>
            </div>

            <div className="bg-white p-3 rounded border border-gray-200 shadow-md mb-2">
              <div className="font-semibold text-gray-800">Short Description</div>
              <div className="text-gray-600">{selectedStory.shortDescription}</div>
            </div>
            <div className="bg-white p-3 rounded border border-gray-200 shadow-md mb-2 max-h-24 overflow-y-auto">
              <div className="font-semibold text-gray-800">Long Description</div>
              <div className="text-gray-600">{selectedStory.longDescription}</div>
            </div>
            <div className="bg-white p-3 rounded border border-gray-200 shadow-md mb-2">
              <div className="font-semibold text-gray-800">Image</div>
              {selectedStory.images && selectedStory.images.url ? (
                <div className="text-gray-600"><img src={selectedStory.images.url} alt="Story" className="w-56 h-36 object-cover rounded mt-2" onError={e => { e.target.onerror = null; e.target.src = '/placeholder.png'; }} /></div>
              ) : (
                <div className="w-56 h-36 flex items-center justify-center bg-gray-200 rounded text-gray-400">No Image</div>
              )}
            </div>
            <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded" onClick={() => setShowViewModal(false)}>Close</button>
          </div>
        </div>
      )}
      {/* Delete Modal */}
      {showDeleteModal && selectedStory && (
        <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Story</DialogTitle>
            </DialogHeader>
            <p>Are you sure you want to delete this story?</p>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
              <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ArtisonStory;
