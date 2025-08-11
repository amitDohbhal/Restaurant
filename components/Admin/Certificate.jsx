"use client";
import React, { useRef, useState, useEffect } from 'react';
import toast from 'react-hot-toast';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
const Certificate = ({ artisanId, artisanDetails = null }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null); // { url, key }
  const [imageUploading, setImageUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [removingImage, setRemovingImage] = useState(false);
  const fileInputRef = useRef();

  // Remove image from Cloudinary
  const handleRemoveImage = async () => {
    if (!selectedImage || !selectedImage.key) {
      toast.error('No valid Cloudinary key found for this image.', { id: 'cloud-delete-certificate' });
      setSelectedImage(null);
      setUploadedImage(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    setRemovingImage(true);
    toast.loading('Deleting image from Cloudinary...', { id: 'cloud-delete-certificate' });
    try {
      const res = await fetch('/api/cloudinary', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicId: selectedImage.key })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Image deleted from Cloudinary!', { id: 'cloud-delete-certificate' });
        setSelectedImage(null);
        setUploadedImage(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        toast.error('Cloudinary error: ' + (data.error || 'Failed to delete image from Cloudinary'), { id: 'cloud-delete-certificate' });
      }
    } catch (err) {
      toast.error('Failed to delete image from Cloudinary (network or server error)', { id: 'cloud-delete-certificate' });
    } finally {
      setRemovingImage(false);
    }
  };


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
  const [specializations, setSpecializations] = useState([]);
  const [selectedSpec, setSelectedSpec] = useState('');
  const [specializationLoading, setSpecializationLoading] = useState(false);
  const [certificateName, setCertificateName] = useState('');
  const [yearOfIssue, setYearOfIssue] = useState('');
  const [certificateIssueFrom, setCertificateIssueFrom] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedArtisan, setSelectedArtisan] = useState(artisanId || '');
  const [artisans, setArtisans] = useState([]);
  const [viewModal, setViewModal] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [id, setId] = useState(null);
  const [loadingCertificates, setLoadingCertificates] = useState(false);

  const fetchSpecializations = async () => {
    setSpecializationLoading(true);
    try {
      const res = await fetch('/api/specialization');
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0 && data[0].name) {
        setSpecializations(data);
      } else {
        setSpecializations([]);
        toast.error('No specializations found.');
      }
    } catch (err) {
      toast.error('Failed to fetch specializations');
      setSpecializations([]);
    } finally {
      setSpecializationLoading(false);
    }
  };
  const fetchCertificates = async () => {
    setLoadingCertificates(true);
    try {
      const currentArtisanId = selectedArtisan || artisanId;
      const res = await fetch(`/api/artisanCertificates?artisanId=${currentArtisanId}`);
      const data = await res.json();
      if (data.success) {
        setCertificates(data.certificates || []);
      } else {
        toast.error(data.message || 'Failed to fetch certificates');
        setCertificates([]);
      }
    } catch {
      toast.error('Failed to fetch certificates');
      setCertificates([]);
    } finally {
      setLoadingCertificates(false);
    }
  };

  useEffect(() => {
    fetchSpecializations();
  }, []);

  useEffect(() => {
    if (selectedArtisan || artisanId) {
      fetchCertificates();
    } else {
      setCertificates([]);
    }
  }, [selectedArtisan, artisanId]);
  // Helper: Group certificates by artisan
  const groupedByArtisan = React.useMemo(() => {
    const map = {};
    certificates.forEach(cert => {
      if (cert.artisan && cert.artisan._id) {
        if (!map[cert.artisan._id]) {
          map[cert.artisan._id] = {
            artisan: cert.artisan,
            certificates: []
          };
        }
        map[cert.artisan._id].certificates.push(cert);
      }
    });
    return Object.values(map);
  }, [certificates]);

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
  const removeImage = () => {
    setSelectedImage(null);
  };
  const handleEdit = (certificate) => {
    setCertificateName(certificate.title || '');
    setYearOfIssue(certificate.issueDate || '');
    setCertificateIssueFrom(certificate.issuedBy || '');
    setSelectedSpec(certificate.description || '');
    setSelectedArtisan(certificate.artisan ? certificate.artisan._id : '');
    setSelectedImage(certificate.imageUrl ? { url: certificate.imageUrl, file: null } : null);
    setIsEditMode(true);
    setId(certificate._id);
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
    if (!certificateName) {
      toast.error("Certificate name is required.");
      setLoading(false);
      return;
    }

    const payload = {
      title: certificateName,
      issueDate: yearOfIssue,
      issuedBy: certificateIssueFrom,
      description: selectedSpec,
      artisan: selectedArtisan,
      imageUrl: selectedImage || '',
    };

    try {
      let res, data;
      if (isEditMode && id) {
        // Update existing certificate
        res = await fetch('/api/artisanCertificates', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ _id: id, ...payload }),
        });
        data = await res.json();
        if (data.success) toast.success('Certificate updated successfully!');
        else toast.error(data.message || 'Failed to update certificate');
      } else {
        // Create new certificate
        res = await fetch('/api/artisanCertificates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        data = await res.json();
        if (data.success) toast.success('Certificate created successfully!');
        else toast.error((data.message || 'Failed to create certificate') + (data.error ? (': ' + data.error) : ''));
      }
      // Always reset form after create/update
      setCertificateName('');
      setYearOfIssue('');
      setCertificateIssueFrom('');
      setSelectedSpec('');
      setSelectedImage(null);
      if (!artisanId && !artisanDetails) setSelectedArtisan('');
      setIsEditMode(false);
      setId(null);
      fetchCertificates();
    } catch (err) {
      toast.error('Error saving certificate: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };


  const handleCancelEdit = () => {
    setCertificateName('');
    setYearOfIssue('');
    setCertificateIssueFrom('');
    setSelectedSpec('');
    setSelectedImage(null);
    setSelectedArtisan('');
    setIsEditMode(false);
    setId(null);
  };
  const handleDelete = async (id) => {
    setShowDeleteModal(false);
    try {
      const res = await fetch('/api/artisanCertificates', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Certificate deleted!');
        fetchCertificates();
      } else {
        toast.error(data.message || 'Failed to delete certificate');
      }
    } catch {
      toast.error('Failed to delete certificate');
    }
  };
  const cancelDelete = () => { setShowDeleteModal(false); setDeleteId(null); };
  const handleView = (certificate) => { setSelectedCertificate(certificate); setViewModal(true); };
  const handleCloseViewModal = () => { setSelectedCertificate(null); setViewModal(false); };

  return (
    <div className="page-content">
      <div className="container-fluid">
        <div className="row justify-center">
          <div className="w-full max-w-5xl mx-auto">
            <h3 className="my-4 text-center font-bold text-2xl">Create Management Certificate</h3>
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
                    placeholder="Management Name"
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="certificateName" className="block mb-1">Certificate Name</label>
                  <input type="text" className="w-full border rounded px-3 py-2" id="certificateName" placeholder="Type Here" value={certificateName} onChange={e => setCertificateName(e.target.value)} />
                </div>
                <div className="mb-3">
                  <label htmlFor="yearOfIssue" className="block mb-1">Year of Issue</label>
                  <input type="number" className="w-full border rounded px-3 py-2" id="yearOfIssue" placeholder="Year's Of Issue" value={yearOfIssue} onChange={e => setYearOfIssue(e.target.value)} />
                </div>
                <div className="mb-3">
                  <label htmlFor="specializedIn" className="block mb-1">Specialized In</label>
                  <select
                    className="w-full border rounded px-3 py-2"
                    id="specializedIn"
                    value={selectedSpec}
                    onChange={e => setSelectedSpec(e.target.value)}
                    required
                    disabled={specializationLoading}
                  >
                    <option value="" disabled>Specialized In</option>
                    {specializations && specializations.length > 0 && specializations.map((spec, idx) => (
                      <option key={spec._id || idx} value={spec.name}>{spec.name}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label htmlFor="certificateIssueFrom" className="block mb-1">Certificate Issue From</label>
                  <input type="text" className="w-full border rounded px-3 py-2" id="certificateIssueFrom" placeholder="Certificate Issue From" value={certificateIssueFrom} onChange={e => setCertificateIssueFrom(e.target.value)} />
                </div>
                <div className="mb-4">
                  <label className="block mb-1">Certificate Image</label>
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
                          onClick={removeImage}
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
                      <div className="flex justify-center mt-3">
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
                  <div className="text-center mt-3">

                    {isEditMode && (
                      <button type="button" className="bg-gray-400 text-white px-5 py-2 rounded mr-2" onClick={handleCancelEdit} disabled={loading}>
                        Cancel
                      </button>
                    )}
                    <button type="submit" className="bg-red-600 text-white px-5 py-2 rounded" disabled={loading}>
                      {loading ? 'Saving...' : (isEditMode ? 'Update' : 'Data Save')}
                    </button>
                  </div>
                </div>
              </form>
            </div>
            {/* Table for certificates: Grouped by artisan */}
            <div className="bg-white rounded shadow p-6 mt-6">
              <h4 className="mb-3 font-semibold text-lg">Certificates List</h4>
              <div className="overflow-x-auto">
                <Table className="min-w-full divide-y divide-gray-200">
                  <TableHeader>
                    <TableRow className="bg-gray-100">
                      <TableHead className="px-4 py-3 text-center">S.No</TableHead>
                      <TableHead className="px-4 py-3 text-center">Certificate Name</TableHead>
                      <TableHead className="px-4 py-3 text-center">Year</TableHead>
                      <TableHead className="px-4 py-3 text-center">Specialization</TableHead>
                      <TableHead className="px-4 py-3 text-center">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingCertificates ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12">
                          <div className="flex justify-center items-center gap-4">
                            <div className="w-6 h-6 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : groupedByArtisan && groupedByArtisan.length > 0 ? (
                      groupedByArtisan.map((group, idx) => (
                        group.certificates && group.certificates.length > 0 ? (
                          group.certificates.map((cert, cidx) => (
                            <TableRow key={cert._id}>
                              <TableCell className="px-4 py-3 text-center font-medium">{cidx + 1}</TableCell>
                              <TableCell className="px-4 py-3 text-center pl-4 whitespace-nowrap ">{cert.title}</TableCell>
                              <TableCell className="px-4 py-3 text-center pl-4 whitespace-nowrap ">{cert.issueDate}</TableCell>
                              <TableCell className="px-4 py-3 text-center pl-4 whitespace-nowrap ">{cert.description}</TableCell>
                              <TableCell className="px-4 py-3 flex gap-2 justify-center">
                                <Button size="sm" variant="outline" className="bg-gray-700 text-white px-3 py-1 rounded" onClick={() => handleView(cert)}>
                                  View
                                </Button>
                                <Button size="sm" variant="default" className="bg-blue-600 hover:bg-blue-700 text-white rounded" onClick={() => handleEdit(cert)}>
                                  Edit
                                </Button>
                                <Button size="sm" variant="destructive" className="bg-red-600 text-white px-3 py-1 rounded" onClick={() => { setDeleteId(cert._id); setShowDeleteModal(true); }}>
                                  Delete
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow key={group.artisan._id + '-empty'}>
                            <TableCell className="px-4 py-3 text-center font-medium">{idx + 1}</TableCell>
                            <TableCell className="px-4 py-3" colSpan={4}>No certificates for this Management.</TableCell>
                          </TableRow>
                        )
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4">No certificates found.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
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
              {viewModal && selectedCertificate && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                  <div className="bg-white rounded shadow-lg max-w-lg w-full p-8 relative">
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
                        <div className="text-gray-600"><img src={selectedCertificate.imageUrl?.url} alt="Certificate" className="w-56 h-36 object-cover rounded mt-2" /></div>
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
    </div>
  );
};

export default Certificate;
