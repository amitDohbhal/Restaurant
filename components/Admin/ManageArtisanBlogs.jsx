"use client";
import React, { useRef, useState, useEffect } from 'react';
// import uploadimg from './upload-img.png';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

// Placeholder for TiptapEditor. Replace with your actual implementation or import.
const TiptapEditor = ({ value, onChange }) => (
  <textarea className="w-full border rounded p-2" value={value} onChange={e => onChange(e.target.value)} placeholder="Rich text editor coming soon..." />
);

const ManageArtisanBlogs = ({ artisanId, artisanDetails = null }) => {
  // All the state and logic from your provided code, adapted for Next.js and UI kit usage
  const [selectedImages, setSelectedImages] = useState([]);
  const [imageUploading, setImageUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef();
  const [artisans, setArtisans] = useState([]);
  const [selectedArtisan, setSelectedArtisan] = useState(artisanId || '');
  const [title, setTitle] = useState('');
  const [createdBy, setCreatedBy] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [longDescription, setLongDescription] = useState('');
  const [blogs, setBlogs] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [editingBlogId, setEditingBlogId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteBlogId, setDeleteBlogId] = useState(null);
  const [showBlogsModal, setShowBlogsModal] = useState(false);
  const [selectedArtisanBlogs, setSelectedArtisanBlogs] = useState([]);
  const [selectedArtisanInfo, setSelectedArtisanInfo] = useState(null);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviews, setReviews] = useState([]);

  // Placeholder fetchers (replace with your API calls)
  const fetchArtisans = async ({ artisanId, artisanDetails = null } = {}) => {
    // Fetch artisans from API
    setArtisans([]);
  };
  const fetchBlogs = async (artisanIdToFetch) => {
    if (!artisanIdToFetch) {
      setBlogs([]);
      return;
    }
    try {
      setLoadingReviews(true);
      const res = await fetch(`/api/artisanBlog?artisanId=${artisanIdToFetch}`);
      if (!res.ok) throw new Error('Failed to fetch blogs');
      const data = await res.json();
      setBlogs(data.blogs || []);
    } catch (err) {
      toast.error('Failed to fetch blogs');
      setBlogs([]);
    } finally {
      setLoadingReviews(false);
    }
  };

  // Handler for file input change
  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    if (selectedImages.length + files.length > 10) {
      toast.error('You can only upload up to 10 images.');
      return;
    }
    setImageUploading(true);
    setUploadProgress(0);
    try {
      let newImages = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);
        // Progress not natively supported by fetch; for demo, just set 100% after upload
        const res = await fetch('/api/cloudinary', {
          method: 'POST',
          body: formData
        });
        if (!res.ok) throw new Error('Image upload failed');
        const result = await res.json();
        newImages.push({ url: result.url, key: result.key });
        setUploadProgress(Math.round(((i + 1) / files.length) * 100));
      }
      setSelectedImages(prev => [...prev, ...newImages].slice(0, 10));
      toast.success(`${newImages.length} image${newImages.length > 1 ? 's' : ''} uploaded!`);
    } catch (err) {
      toast.error('Image upload failed');
    } finally {
      setImageUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleBrowseClick = () => {
    if (selectedImages.length >= 10) {
      toast.error('Maximum 10 images allowed.');
      return;
    }
    fileInputRef.current?.click();
  };

  const removeImage = (index) => {
    setSelectedImages(prevImages => {
      const updatedImages = prevImages.filter((_, i) => i !== index);
      URL.revokeObjectURL(prevImages[index].url);
      return updatedImages;
    });
  };
  // Fetch artisans and reviews
  useEffect(() => {
    async function fetchArtisansAndPromotions() {
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
          } else {
            setCreatedBy('');
            setTitle('');
          }
        } else {
          setCreatedBy('');
          setTitle('');
        }
      } catch (err) {
        toast.error('Failed to fetch management');
        setCreatedBy('');
        setTitle('');
      }
      // Fetch reviews/promotions
      try {
        setLoadingReviews(true);
        const promoUrl = '/api/promotion';
        const res = await fetch(promoUrl);
        if (!res.ok) throw new Error('Failed to fetch promotions');
        const data = await res.json();
        // Accept either array or object with .promotions
        if (Array.isArray(data)) {
          setReviews(data);
        } else if (Array.isArray(data.promotions)) {
          setReviews(data.promotions);
        } else {
          setReviews([]);
          toast.error('No promotions found.');
        }
      } catch (err) {
        setReviews([]);
        toast.error('Failed to fetch promotions');
      } finally {
        setLoadingReviews(false);
      }
    }
    fetchArtisansAndPromotions();
  }, [artisanId]);

  useEffect(() => {
    fetchBlogs(selectedArtisan || artisanId);
    return () => {
      selectedImages.forEach(image => {
        URL.revokeObjectURL(image.url);
      });
    };
  }, [selectedArtisan, artisanId]);

  const handleEdit = (blog) => {
    setEditMode(true);
    setEditingBlogId(blog._id);
    setTitle(blog.title || '');
    setYoutubeUrl(blog.youtubeUrl || '');
    setShortDescription(blog.shortDescription || '');
    setLongDescription(blog.longDescription || '');
    setSelectedArtisan(blog.artisan?._id || blog.artisan || '');
    setSelectedImages(
      (Array.isArray(blog.images) ? blog.images : []).map((img, idx) => {
        // Support both {url, key} objects and plain url strings
        if (typeof img === 'string') {
          return { url: img, key: `img-string-${idx}`, file: null };
        } else if (typeof img === 'object' && img !== null) {
          return {
            url: img.url || '',
            key: img.key || `img-obj-${idx}`,
            file: null
          };
        }
        return { url: '', key: `img-unknown-${idx}`, file: null };
      })
    );
  };

  const handleDelete = async () => {
    if (!deleteBlogId) return;
    try {
      const res = await fetch('/api/artisanBlog', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteBlogId })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Blog deleted successfully!');
        fetchBlogs(selectedArtisan || artisanId);
      } else {
        toast.error(data?.message || 'Failed to delete blog');
      }
    } catch (err) {
      toast.error('Error deleting blog');
    } finally {
      setShowDeleteModal(false);
      setDeleteBlogId(null);
    }
  };

  const openDeleteModal = (id) => {
    setDeleteBlogId(id);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteBlogId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        title,
        youtubeUrl,
        shortDescription,
        longDescription,
        artisan: selectedArtisan,
        images: selectedImages.map(img => ({ url: img.url, key: img.key })),
      };
      let res, data;
      if (editMode && editingBlogId) {
        res = await fetch('/api/artisanBlog', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingBlogId, ...payload }),
        });
      } else {
        res = await fetch('/api/artisanBlog', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      data = await res.json();
      if (res.ok) {
        toast.success(editMode ? 'Blog updated successfully!' : 'Blog created successfully!');
        fetchBlogs(selectedArtisan || artisanId);
        handleCancelEdit();
      } else {
        toast.error(data?.message || 'Failed to save blog');
      }
    } catch (err) {
      toast.error('Error saving blog');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    fetchArtisans();
  }, []);

  const handleCancelEdit = () => {
    setEditMode(false);
    setEditingBlogId(null);
    setTitle('');
    setYoutubeUrl('');
    setShortDescription('');
    setLongDescription('');
    // Only reset selectedArtisan if artisanId is not present
    if (!artisanId) setSelectedArtisan('');
    setSelectedImages([]);
  };

  const [mediaTab, setMediaTab] = useState('image'); // 'image' or 'youtube'

  const handleTabChange = (tab) => {
    setMediaTab(tab);
    if (tab === 'image') {
      setYoutubeUrl('');
    } else {
      setSelectedImages([]);
    }
  };
  // GROUP BLOGS BY ARTISAN
  // const groupedBlogs = blogs.reduce((acc, blog) => {
  //   const artisanId = blog.artisan?._id;
  //   if (!artisanId) return acc;
  //   if (!acc[artisanId]) {
  //     acc[artisanId] = { artisan: blog.artisan, blogs: [] };
  //   }
  //   acc[artisanId].blogs.push(blog);
  //   return acc;
  // }, {});

  return (
    <div className="page-content">
      <div className="container-fluid">
        <div className="row justify-center">
          <div className="w-full max-w-5xl mx-auto">
            <h3 className="my-4 text-center font-bold text-2xl">Create Promotions Video / Image</h3>
            <div className="bg-white rounded shadow p-6 mb-6">
              <form onSubmit={handleSubmit}>
                <div className="mb-4 flex gap-4">
                  <div className="flex-1">
                    <label className="block font-semibold mb-1">Title Of Management Video</label>
                    <input
                      type="text"
                      placeholder="Enter Your Artisan Title:"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div className="w-64">
                    <label className="block font-semibold mb-1">Select Management</label>
                    <input
                      type="text"
                      className="w-full border rounded p-2 bg-gray-100"
                      value={(() => {
                        const found = artisans.find(a => a._id === selectedArtisan);
                        return found ? `${found.title ? found.title + ' ' : ''}${found.firstName} ${found.lastName}` : '';
                      })()}
                      readOnly
                      required
                    />
                  </div>
                </div>
                {/* Media Tab Section */}
                <div className="mb-4">
                  <div className="flex gap-2 mb-2">
                    <button
                      type="button"
                      className={`px-4 py-2 rounded-t ${mediaTab === 'image' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                      onClick={() => handleTabChange('image')}
                    >
                      Image
                    </button>
                    <button
                      type="button"
                      className={`px-4 py-2 rounded-t ${mediaTab === 'youtube' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                      onClick={() => handleTabChange('youtube')}
                    >
                      YouTube URL
                    </button>
                  </div>
                  {mediaTab === 'youtube' ? (
                    <div>
                      <label className="block font-semibold mb-1">YouTube URL</label>
                      <input
                        type="text"
                        placeholder="YouTube URL:"
                        value={youtubeUrl}
                        onChange={e => setYoutubeUrl(e.target.value)}
                        className="w-full border rounded px-3 py-2"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block font-semibold mb-1">Management Images</label>
                      <div className="border rounded p-4 mt-2">
                        <div className="text-center mb-3">
                          {selectedImages.length === 0 ? (
                            <div className="text-gray-400">No images uploaded yet.</div>
                          ) : (
                            <div className="flex flex-wrap gap-3 justify-center">
                              {selectedImages.map((image, index) => (
                                <div key={image.key || image.url || index} className="relative w-40 h-36">
                                  <img
                                    src={image.url}
                                    alt={`Preview ${index + 1}`}
                                    className="w-full h-full object-cover rounded"
                                  />
                                  <button
                                    type="button"
                                    className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center"
                                    onClick={() => removeImage(index)}
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="text-center mt-2">
                          <div className="mt-2">
                            <small className={selectedImages.length === 10 ? 'text-red-600' : 'text-gray-500'}>
                              {selectedImages.length}/10 images selected
                            </small>
                          </div>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          style={{ display: 'none' }}
                          ref={fileInputRef}
                          onChange={handleImageChange}
                        />
                        <Button
                          type="button"
                          className="bg-blue-600 text-white px-4 py-2 rounded mt-2"
                          onClick={handleBrowseClick}
                          disabled={imageUploading || selectedImages.length >= 10}
                        >
                          {imageUploading ? 'Uploading...' : 'Browse Image(s)'}
                        </Button>
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
                    </div>
                  )}
                </div>
                <div className="mb-4">
                  <label className="block font-semibold mb-1">Short Description</label>
                  <input
                    type="text"
                    value={shortDescription}
                    onChange={e => setShortDescription(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div className="mb-4">
                  <label className="block font-semibold mb-1">Long Description</label>
                  <TiptapEditor value={longDescription} onChange={setLongDescription} />
                </div>
                <div className="text-center">
                  <Button type="submit" className="bg-blue-600 text-white px-5 py-2 rounded" disabled={isSubmitting}>
                    {isSubmitting ? 'Creating...' : (editMode ? 'Update' : 'Save')}
                  </Button>
                  {editMode && (
                    <Button type="button" className="bg-gray-400 text-white px-5 py-2 rounded ml-2" onClick={handleCancelEdit} disabled={isSubmitting}>Cancel</Button>
                  )}
                </div>
              </form>
              {/* Blog Management Table */}
              <div className="bg-white rounded shadow p-6">
                <h4 className="mb-3 font-semibold text-lg">Manage Blogs</h4>
                <div className="overflow-x-auto">
                  <Table className="min-w-full divide-y divide-gray-200">
                    <TableHeader>
                      <TableRow className="bg-gray-100">
                        <TableHead className="px-4 py-3 text-center">S.No</TableHead>
                        <TableHead className="px-4 py-3 text-center">Image</TableHead>
                        <TableHead className="px-4 py-3 text-center">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {blogs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center py-4">No blogs found.</TableCell>
                        </TableRow>
                      ) : (
                        blogs.map((blog, idx) => (
                          <TableRow key={blog._id}>
                            <TableCell className="px-4 py-3 text-center font-medium">{idx + 1}</TableCell>
                            <TableCell className="px-4 py-3 text-center ">
                              {Array.isArray(blog.images) && blog.images.length > 0 ? (() => {
                                let imgObj = blog.images[0];
                                let url = typeof imgObj === 'object' && imgObj !== null ? imgObj.url : imgObj;
                                if (typeof url === 'string' && url.trim() && url !== 'undefined') {
                                  return (
                                    <div className="w-16 h-16 rounded-lg overflow-hidden border flex items-center justify-center bg-white mx-auto">
                                      <img
                                        src={url}
                                        alt="Blog Preview"
                                        className="w-full h-full object-cover mx-auto"
                                        onError={e => { e.target.style.display = 'none'; }}
                                      />
                                    </div>
                                  );
                                } else {
                                  return <span className="text-gray-400">No image</span>;
                                }
                              })() : (
                                <span className="text-gray-400">No image</span>
                              )}
                            </TableCell>
                            <TableCell className="px-4 py-3 text-center">
                              <div className="flex gap-2 justify-center">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="bg-blue-500 text-white px-3 py-1 rounded"
                                  onClick={() => {
                                    setSelectedArtisanBlogs([blog]);
                                    setSelectedArtisanInfo(blog.artisan);
                                    setShowBlogsModal(true);
                                  }}
                                >
                                  View
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="bg-yellow-500 text-white px-3 py-1 rounded"
                                  onClick={() => handleEdit(blog)}
                                >
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="bg-red-500 text-white px-3 py-1 rounded"
                                  onClick={() => openDeleteModal(blog._id)}
                                >
                                  Delete
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
              {/* Delete Modal */}
              {showDeleteModal && (
                <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete Blog</DialogTitle>
                    </DialogHeader>
                    <p>Are you sure you want to delete this blog?</p>
                    <DialogFooter>
                      <Button variant="secondary" onClick={closeDeleteModal}>Cancel</Button>
                      <Button variant="destructive" onClick={handleDelete}>Delete</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}

              {/* View Modal */}
              {showBlogsModal && selectedArtisanBlogs.length > 0 && selectedArtisanInfo && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                  <div className="bg-white rounded shadow-lg max-w-lg w-full p-8 relative">
                    <h4 className="font-bold text-lg mb-4">Blog Details</h4>
                    <div className="grid grid-cols-1 gap-4 mb-2">
                      <div className="bg-white p-3 rounded border border-gray-200 shadow-md mb-2">
                        <div className="font-semibold text-gray-800">Blog Title</div>
                        <div className="text-gray-600">{selectedArtisanBlogs[0].title}</div>
                      </div>

                      <div className="bg-white p-3 rounded border border-gray-200 shadow-md mb-2 ">
                        <div className="font-semibold text-gray-800">YouTube URL</div>
                        <div className="text-gray-600 break-all">
                          {selectedArtisanBlogs[0].youtubeUrl ? (
                            <a
                              href={selectedArtisanBlogs[0].youtubeUrl.startsWith('http') ? selectedArtisanBlogs[0].youtubeUrl : `https://${selectedArtisanBlogs[0].youtubeUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 underline hover:text-blue-800"
                            >
                              {selectedArtisanBlogs[0].youtubeUrl}
                            </a>
                          ) : (
                            '-'
                          )}
                        </div>
                      </div>
                      <div className="bg-white p-3 rounded border border-gray-200 shadow-md mb-2">
                        <div className="font-semibold text-gray-800">Short Description</div>
                        <div className="text-gray-600">{selectedArtisanBlogs[0].shortDescription || '-'}</div>
                      </div>

                      <div className="bg-white p-3 rounded border border-gray-200 shadow-md mb-2 max-h-24 overflow-y-auto">
                        <div className="font-semibold text-gray-800">Long Description</div>
                        <div className="text-gray-600 whitespace-pre-line">{selectedArtisanBlogs[0].longDescription || '-'}</div>
                      </div>
                      <div className="bg-white p-3 rounded border border-gray-200 shadow-md mb-2 max-h-32 overflow-y-auto">
                        <div className="font-semibold text-gray-800">Images</div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {Array.isArray(selectedArtisanBlogs[0].images) && selectedArtisanBlogs[0].images.length > 0 ? (
                            selectedArtisanBlogs[0].images.map((img, idx) => {
                              let url = typeof img === 'object' && img !== null ? img.url : img;
                              const key = (typeof img === 'object' && img !== null && img.key) ? img.key : (url ? url : idx);
                              // Only render if url is valid
                              if (typeof url !== 'string' || !url.trim() || url === 'undefined') {
                                return null;
                              }
                              return (
                                <img
                                  key={key}
                                  src={url}
                                  alt={`Blog Image ${idx + 1}`}
                                  className="w-28 h-20 object-cover rounded"
                                  onError={e => { e.target.style.display = 'none'; }}
                                />
                              );
                            })
                          ) : (
                            <span className="text-gray-400">No images</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button className="absolute w-8 h-8 top-2 right-2 text-gray-700 hover:text-red-600" onClick={() => setShowBlogsModal(false)}>
                      X
                    </button>
                    <button className="absolute px-4 py-1 bottom-2 right-2 border border-gray-200 rounded bg-red-500 text-white" onClick={() => setShowBlogsModal(false)}>
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageArtisanBlogs;
