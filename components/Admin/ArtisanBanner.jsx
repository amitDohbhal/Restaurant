"use client";
import React, { useRef, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
const ArtisanBanner = ({ artisanId, artisanDetails = null }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null); // { url, key }
  const [imageUploading, setImageUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
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
      setUploadedImage(result); // { url, key }
      if (result.url) {
        setSelectedImage({ url: result.url, key: result.key });
      } else {
        setSelectedImage(null);
      }
      toast.success("Image uploaded successfully");
    } catch (err) {
      toast.error("Image upload failed");
    } finally {
      setImageUploading(false);
      setUploadProgress(0);
    }
  };

  const [certificates, setCertificates] = useState([]);
  const [certificateName, setCertificateName] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedArtisan, setSelectedArtisan] = useState(artisanId || '');
  const [artisans, setArtisans] = useState([]);
  const [viewModal, setViewModal] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [id, setId] = useState(null);
  const [loadingBanners, setLoadingBanners] = useState(false);
  const [banners, setBanners] = useState([]);
  
  const fetchBanners = async () => {
    setLoadingBanners(true);
    try {
      const currentArtisanId = selectedArtisan || artisanId;
      const res = await fetch(`/api/artisanBanner?artisanId=${currentArtisanId}`);
      const data = await res.json();
      // console.log(data);
      if (data.success) {
        setBanners(data.banner || []);
      } else {
        toast.error(data.message || 'Failed to fetch banners');
        setBanners([]);
      }
    } catch {
      toast.error('Failed to fetch banners');
      setBanners([]);
    } finally {
      setLoadingBanners(false);
    }
  };

  useEffect(() => {
    if (selectedArtisan || artisanId) {
      fetchBanners();
    } else {
      setBanners([]);
    }
  }, [selectedArtisan, artisanId]);
  // No grouping needed for banners, just show banners in the table

  // UploadThing image upload handler
  const handleUploadComplete = (res) => {
    if (res && res.length > 0) {
      setSelectedImage({ url: res[0].url, key: res[0].key });
      toast.success('Image uploaded successfully');
    }
  };
  const handleUploadError = (err) => {
    toast.error('Image upload failed');
  };
  const [removingImage, setRemovingImage] = useState(false);
  // Remove image from Cloudinary
  const handleRemoveImage = async () => {
    if (!selectedImage || !selectedImage.key) {
      toast.error('No valid Cloudinary key found for this image.', { id: 'cloud-delete-banner' });
      setSelectedImage(null);
      setUploadedImage(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    setRemovingImage(true);
    toast.loading('Deleting image from Cloudinary...', { id: 'cloud-delete-banner' });
    try {
      const res = await fetch('/api/cloudinary', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicId: selectedImage.key })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Image deleted from Cloudinary!', { id: 'cloud-delete-banner' });
        setSelectedImage(null);
        setUploadedImage(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        toast.error('Cloudinary error: ' + (data.error || 'Failed to delete image from Cloudinary'), { id: 'cloud-delete-banner' });
      }
    } catch (err) {
      toast.error('Failed to delete image from Cloudinary (network or server error)', { id: 'cloud-delete-banner' });
    } finally {
      setRemovingImage(false);
    }
  };

  const handleEdit = (banner) => {
    setSelectedArtisan(banner.artisan ? banner.artisan._id : '');
    setSelectedImage(
      banner.image
        ? typeof banner.image === 'string'
          ? { url: banner.image, file: null }
          : banner.image.url
            ? { url: banner.image.url, file: null }
            : null
        : null
    );
    setIsEditMode(true);
    setId(banner._id);
  };    
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Frontend validation
    if (!selectedArtisan) {
      toast.error("Please select an Management.");
      setLoading(false);
      return;
    }
    if (!selectedImage || !selectedImage.url) {
      toast.error("Please upload a banner image first.");
      setLoading(false);
      return;
    }

    const payload = {
      artisan: selectedArtisan,
      image: selectedImage || '',
    };

    try {
      let res, data;
      if (isEditMode && id) {
        // Update existing banner
        res = await fetch('/api/artisanBanner', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ _id: id, ...payload }),
        });
        data = await res.json();
        if (data.success) toast.success('Banner updated successfully!');
        else toast.error(data.message || 'Failed to update banner');
      } else {
        // Create new banner
        res = await fetch('/api/artisanBanner', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        data = await res.json();
        if (data.success) {
          toast.success('Banner created successfully!');
        } else if (res.status === 400 && data.message === 'Banner already exists for this Management.') {
          toast.error('A banner already exists for this Management. You can only have one banner per Management.');
        } else {
          toast.error((data.message || 'Failed to create certificate') + (data.error ? (': ' + data.error) : ''));
        }
      }
    } catch (err) {
      toast.error('Error saving banner: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
      // Always reset form after create/update
      setSelectedImage(null);
      if (!artisanId && !artisanDetails) setSelectedArtisan('');
      setIsEditMode(false);
      setId(null);
      fetchBanners();
    }
  };


  const handleCancelEdit = () => {
    setSelectedImage(null);
    setSelectedArtisan('');
    setIsEditMode(false);
    setId(null);
  };
  const handleDelete = async (id) => {
    setShowDeleteModal(false);
    try {
      const res = await fetch('/api/artisanBanner', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Banner deleted!');
        fetchBanners();
      } else {
        toast.error(data.message || 'Failed to delete banner');
      }
    } catch {
      toast.error('Failed to delete banner');
    }
  };
  const cancelDelete = () => { setShowDeleteModal(false); setDeleteId(null); };
  const handleView = (banner) => { setSelectedBanner(banner); setViewModal(true); };
  const handleCloseViewModal = () => { setSelectedBanner(null); setViewModal(false); };

  return (
    <div className="page-content">
      <div className="container-fluid">
        <div className="row justify-center">
          <div className="w-full max-w-5xl mx-auto">
            <h3 className="my-4 text-center font-bold text-2xl">Upload Management Banner</h3>
            <div className="bg-white rounded shadow p-6 mb-6">
              <form id="certificateForm" onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block font-semibold mb-1">Management User</label>
                  <input
                    type="text"
                    className="w-full border rounded px-3 py-2 bg-gray-100"
                    value={
                      artisanDetails
                        ? `${artisanDetails.title ? artisanDetails.title + ' ' : ''}${artisanDetails.firstName} ${artisanDetails.lastName}`
                        : (() => {
                          const found = artisans.find(a => a._id === selectedArtisan);
                          return found ? `${found.title ? found.title + ' ' : ''}${found.firstName} ${found.lastName}` : '';
                        })()
                    }
                    readOnly
                    placeholder="Artisan Name"
                  />
                </div>               
                <div className="mb-4">
                  <label className="block mb-1">Banner Image</label>
                  <div className="border rounded p-4 text-center">
                    {selectedImage && selectedImage.url ? (
                      <div className="relative inline-block mb-3">
                        <img
                          src={selectedImage.url}
                          alt="Certificate Preview"
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
                    )}
                    {selectedImage && (
                      <div className="text-center mt-3">
                        <button
                          type="button"
                          className="bg-red-600 text-white px-4 py-2 rounded"
                          onClick={handleRemoveImage}
                        >
                          Remove Image
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-center">
                  {isEditMode && (
                    <button type="button" className="bg-gray-400 text-white px-5 py-2 rounded mr-2" onClick={handleCancelEdit} disabled={loading}>
                      Cancel
                    </button>
                  )}
                  <button type="submit" className="bg-red-600 text-white px-5 py-2 rounded" disabled={loading}>
                    {loading ? 'Saving...' : (isEditMode ? 'Update' : 'Data Save')}
                  </button>
                </div>
              </form>
            </div>
            {/* Table for banners: Grouped by artisan */}
            <div className="bg-white rounded shadow p-6 mt-6">
              <h4 className="mb-3 font-semibold text-lg">Banner List</h4>
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
                    {loadingBanners ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12">
                          <div className="flex justify-center items-center gap-4">
                            <div className="w-6 h-6 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (Array.isArray(banners) ? banners.length > 0 : banners) ? (
                      (Array.isArray(banners) ? banners : [banners]).map((banner, idx) => (
                        <TableRow key={banner._id || idx}>
                          <TableCell className="px-4 py-3 text-center">{idx + 1}</TableCell>
                          <TableCell className="px-4 py-3 items-center flex justify-center">
                            {banner.image && banner.image.url ? (
                              <img src={banner?.image?.url} alt="Banner"  style={{ width: 200, objectFit: 'cover', borderRadius: 4 }} />
                            ) : 'No Image'}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-center gap-2">
                            <Button onClick={() => handleEdit(banner)}>Edit</Button>
                            <Button variant="destructive" className="ml-2" onClick={() => { setDeleteId(banner._id); setShowDeleteModal(true); }}>Delete</Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12">
                          No banners found
                        </TableCell>
                      </TableRow>
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
                      <DialogTitle>Delete Certificate</DialogTitle>
                    </DialogHeader>
                    <p>Are you sure you want to delete this certificate?</p>
                    <DialogFooter>
                      <Button variant="secondary" onClick={cancelDelete}>Cancel</Button>
                      <Button variant="destructive" onClick={() => handleDelete(deleteId)}>Delete</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}

              {/* View Modal */}
              {viewModal && selectedBanner && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                  <div className="bg-white rounded shadow-lg max-w-lg w-full p-8 relative">
                    <h4 className="font-bold text-lg mb-4">Banner Details</h4>
                    <h4 className="font-bold text-lg mb-4">Certificate Details</h4>
                    <div className="grid grid-cols-1 gap-4 mb-2">
                      <div className="bg-white p-3 rounded border border-gray-200 shadow-md mb-2">
                        <div className="font-semibold text-gray-800">Management</div>
                        <div className="text-gray-600">{selectedCertificate.artisan ? `${selectedCertificate.artisan.title ? selectedCertificate.artisan.title + ' ' : ''}${selectedCertificate.artisan.firstName} ${selectedCertificate.artisan.lastName}` : '-'}</div>
                      </div>
                      <div className="bg-white p-3 rounded border border-gray-200 shadow-md mb-2">
                        <div className="font-semibold text-gray-800">Certificate Name</div>
                        <div className="text-gray-600">{selectedCertificate.title}</div>
                      </div>
                      <div className="flex gap-2">
                        <div className="bg-white p-3 rounded border border-gray-200 shadow-md mb-2 w-1/2">
                          <div className="font-semibold text-gray-800">Year of Issue</div>
                          <div className="text-gray-600">{selectedCertificate.issueDate}</div>
                        </div>
                        <div className="bg-white p-3 rounded border border-gray-200 shadow-md mb-2 w-1/2">
                          <div className="font-semibold text-gray-800">Specialized In</div>
                          <div className="text-gray-600">{selectedCertificate.description}</div>
                        </div>
                      </div>
                      <div className="bg-white p-3 rounded border border-gray-200 shadow-md mb-2">
                        <div className="font-semibold text-gray-800">Issued By</div>
                        <div className="text-gray-600">{selectedCertificate.issuedBy}</div>
                      </div>
                      <div className="bg-white p-3 rounded border border-gray-200 shadow-md mb-2">
                        <div className="font-semibold text-gray-800">Image</div>
                        <div className="text-gray-600"><img src={selectedCertificate.imageUrl} alt="Certificate" className="w-56 h-36 object-cover rounded mt-2" /></div>
                      </div>
                    </div>
                    <button className=" absolute w-8 h-8 top-2 right-2 text-gray-700 hover:text-red-600" onClick={handleCloseViewModal}>
                      X
                    </button>
                    <button className=" absolute px-4 py-1 bottom-2 right-2 border border-gray-200 rounded  bg-red-500 text-white" onClick={handleCloseViewModal}>
                      Close
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
  );
};

export default ArtisanBanner;
