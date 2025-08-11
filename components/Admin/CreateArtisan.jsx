"use client";

import React, { useState, useEffect, useRef } from "react";

// DetailBox helper for view modal
const DetailBox = ({ label, value }) => (
  <div className="mb-2">
    <div className="font-semibold text-gray-700">{label}</div>
    <div className="text-gray-600">{value}</div>
  </div>
);

import { Switch } from "../ui/switch";
import { useForm } from "react-hook-form";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Textarea } from "../ui/textarea";
import toast from "react-hot-toast";
import { Plus } from "lucide-react";

const CreateArtisan = () => {
  // ...existing state
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null); // { url, key }
  // ...other state
  const [imageUploading, setImageUploading] = useState(false); // NEW: for UI feedback
  const [showModal, setShowModal] = useState(false);
  const [newSpecialization, setNewSpecialization] = useState("");
  const [loading, setLoading] = useState(false);
  const [allSpecializations, setAllSpecializations] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [uploadProgress, setUploadProgress] = useState(0);
  // Inline delete modal state for the table
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [artisanToDelete, setArtisanToDelete] = useState(null);
  const INDIAN_STATES = [
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chhattisgarh",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
    "Andaman and Nicobar Islands",
    "Chandigarh",
    "Dadra and Nagar Haveli and Daman and Diu",
    "Delhi",
    "Jammu and Kashmir",
    "Ladakh",
    "Lakshadweep",
    "Puducherry",
  ];
  const fileInputRef = useRef(null);
  // Remove image from Cloudinary and UI state
  const handleRemoveImage = async () => {
    // Remove from UI immediately
    setUploadedImage(null);
    setSelectedImage(null);
    // Delete from Cloudinary in the background
    if (uploadedImage && uploadedImage.key) {
      try {
        const res = await fetch('/api/cloudinary', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ publicId: uploadedImage.key }),
        });
        const data = await res.json();
        if (!res.ok) {
          toast.error('Cloudinary error: ' + (data.error || 'Failed to delete image from Cloudinary'));
          // console.error('Cloudinary deletion error:', data.error);
        }
      } catch (err) {
        toast.error('Failed to delete image from Cloudinary (network or server error)');
        // console.error('Cloudinary deletion network/server error:', err);
      }
    } else {
      // console.error('No Cloudinary key found for image:', uploadedImage);
    }
  };
  // Backend image upload handler for file input
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
        body: formData,
        onUploadProgress: (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(progress);
        },
      });
      if (!res.ok) throw new Error("Image upload failed");
      const result = await res.json();
      setUploadedImage(result); // { url, key }
      setSelectedImage(result.url);
      toast.success("Image uploaded successfully");
    } catch (err) {
      toast.error("Image upload failed");
    } finally {
      setImageUploading(false);
      setUploadProgress(0);
    }
  };
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/createArtisan");
      if (!res.ok) throw new Error("Failed to fetch management");
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      //  console.error("Error in fetchUsers:", err);
      toast.error("Failed to fetch users. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const { register, handleSubmit, setValue, reset, watch, formState: { errors } } = useForm({
    defaultValues: {
      pincode: '',
      city: '',
      title: "Mr.",
      // Add other defaults if needed
    },
  });

  const [selectedSpecs, setSelectedSpecs] = useState(
    Array.isArray(editForm?.specializations) ? editForm.specializations : []
  );

  // Always keep selectedSpecs and react-hook-form in sync
  useEffect(() => {
    setValue("specializations", selectedSpecs, { shouldValidate: true });
  }, [selectedSpecs, setValue]);

  const fetchSpecializations = async () => {
    try {
      const res = await fetch("/api/specialization");
      const data = await res.json();
      // console.log("Specialization API response:", data);
      if (Array.isArray(data) && data.length > 0 && data[0].name) {
        setAllSpecializations(data.map((s) => s.name));
      } else if (Array.isArray(data) && data.length === 0) {
        setAllSpecializations([]);
        // toast.error("No specializations found.");
      } else {
        setAllSpecializations([]);
        toast.error("Specialization API returned unexpected data.");
      }
    } catch (err) {
      toast.error("Failed to fetch specializations");
      setAllSpecializations([]);
    }
  };
  function slugify(str) {
    if (!str) return '';
    return String(str)
      .toLowerCase()
      .trim() // Remove leading/trailing spaces
      .replace(/\s+/g, '-') // Replace spaces with -
      .replace(/[^\w\-]+/g, '') // Remove all non-word chars
      .replace(/\-\-+/g, '-') // Replace multiple - with single -
      .replace(/^-+/, '') // Trim - from start of text
      .replace(/-+$/, ''); // Trim - from end of text
  }
  const onSubmit = async (data) => {
    if (imageUploading) {
      toast.error("Please wait for the image to finish uploading.");
      return;
    }
    // Always use selectedSpecs for specializations
    const payload = {
      title: data.title,
      slug: slugify(`${data.firstName} ${data.lastName}`),
      firstName: data.firstName,
      lastName: data.lastName,
      yearsOfExperience: data.yearsOfExperience,
      specializations: selectedSpecs,
      callNumber: data.callNumber,
      whatsappNumber: data.whatsappNumber,
      email: data.email,
      address: data.address,
      city: data.city,
      pincode: data.pincode,
      state: data.state,
      profileImage:
        uploadedImage && uploadedImage.url && uploadedImage.key
          ? uploadedImage
          : { url: "", key: "" },
      order: data.order,
    };
    setLoading(true);
    try {
      const res = await fetch("/api/createArtisan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        if (
          (err.error && err.error.includes("duplicate key")) ||
          err.code === 11000 ||
          (err.message && err.message.includes("Management number already exists"))
        ) {
          toast.error("Management number already exists");
        } else {
          toast.error(err.message || "Failed to create management");
          toast.error(err.message || "Data not submitted! Please try again.");
        }
      }
      await fetchUsers();
      toast.success("Artisan created successfully!");
      // Reset form and clear image state after successful creation
      reset();
      setUploadedImage(null);
      setSelectedImage(null);
      setSelectedSpecs([]);
      setEditForm({});
      setEditingUser(null);
      setShowEditModal(false);
      // Add any other state resets as needed
    } catch (e) {
      toast.error(
        "Data not submitted! Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Helper to show error messages for each field
  const renderError = (field) => errors[field] && (
    <span style={{ color: 'red', fontSize: '0.9em' }}>{errors[field].message || 'This field is required'}</span>
  );

  const handleAddSpecialization = async () => {
    if (!newSpecialization.trim()) return;
    try {
      await fetch("/api/specialization", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newSpecialization.trim() }),
      });
      setNewSpecialization("");
      setShowModal(false);
      fetchSpecializations();
      toast.success("Specialization added");
    } catch {
      toast.error("Failed to add specialization");
    }
  };

  // Toggle artisan active status
  const handleToggleActive = async (artisan) => {
    try {
      const res = await fetch("/api/createArtisan", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: artisan._id, active: !artisan.active }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      setUsers((prev) =>
        prev.map((a) =>
          a._id === artisan._id ? { ...a, active: !a.active } : a
        )
      );
      toast.success(`Management ${!artisan.active ? 'activated' : 'deactivated'} successfully!`);
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  // View artisan modal
  const handleTableView = (artisan) => {
    setSelectedUser(artisan);
    setShowUserModal(true);
  };
  const closeUserModal = () => {
    setShowUserModal(false);
    setSelectedUser(null);
  };

  // Edit artisan logic (no modal)
  const handleTableEdit = (artisan) => {
    setEditingUser(artisan);
    setEditForm({
      ...artisan,
      callNumber: artisan.contact?.callNumber || "",
      whatsappNumber: artisan.contact?.whatsappNumber || "",
      email: artisan.contact?.email || "",
      address: artisan.address?.fullAddress || "",
      city: artisan.address?.city || "",
      pincode: artisan.address?.pincode || "",
      state: artisan.address?.state || "",
      profileImage: artisan.profileImage || "",
      order: artisan.order || 1,
    });
    // Specializations: support both string and array
    let specs = [];
    if (Array.isArray(artisan.specializations)) {
      specs = artisan.specializations;
    } else if (artisan.specializations) {
      specs = [artisan.specializations];
    }
    setSelectedSpecs(specs);
    setValue("specializations", specs, { shouldValidate: true });
    // Populate form fields
    setValue("title", artisan.title || "Mr.");
    setValue("order", artisan.order || 1, { shouldValidate: true });
    setValue("firstName", artisan.firstName || "");
    setValue("lastName", artisan.lastName || "");
    setValue("yearsOfExperience", artisan.yearsOfExperience || "");
    setValue(
      "specialization",
      Array.isArray(artisan.specializations)
        ? artisan.specializations[0]
        : artisan.specializations || ""
    );
    setValue("callNumber", artisan.contact?.callNumber || "");
    setValue("whatsappNumber", artisan.contact?.whatsappNumber || "");
    setValue("email", artisan.contact?.email || "");
    setValue("address", artisan.address?.fullAddress || "");
    setValue("city", artisan.address?.city || "");
    setValue("pincode", artisan.address?.pincode || "");
    setValue("state", artisan.address?.state || "");
    setSelectedImage(artisan.profileImage?.url || "");
    setValue("order", artisan.order || 1, { shouldValidate: true });
    // Ensure uploadedImage is set for editing (needed for Cloudinary removal)
    setUploadedImage(
      artisan.profileImage?.url && artisan.profileImage?.key
        ? { url: artisan.profileImage.url, key: artisan.profileImage.key }
        : null
    );
  };


  // Edit form change handler
  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditForm({});
    reset();
    setSelectedImage("");
    setUploadedImage(null);
    setUploadProgress(0);
    setSelectedSpecs([]); // <-- Clear specialization UI state
    // Set order to next available for new artisan
    setValue('order', users.length + 1, { shouldValidate: true });
    setValue('specializations', [], { shouldValidate: true });
  };

  const clearEditState = () => {
    setEditForm({});
    setEditingUser(null);
    setShowEditModal(false);
    setUploadedImage(null);
    setSelectedImage(null);
    setSelectedSpecs([]); // <-- Clear specialization UI state
    setUploadProgress(0);
    reset();
    // Set order to next available for new artisan
    setValue('order', users.length + 1, { shouldValidate: true });
    setValue('specializations', [], { shouldValidate: true });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    // Get all current form values using watch()
    const formData = watch();
    const payload = {
      id: editingUser._id,
      title: formData.title,
      firstName: formData.firstName,
      lastName: formData.lastName,
      yearsOfExperience: formData.yearsOfExperience,
      specializations: selectedSpecs,
      contact: {
        callNumber: formData.callNumber || "",
        whatsappNumber: formData.whatsappNumber || "",
        email: formData.email || "",
      },
      address: {
        fullAddress: formData.address || "",
        city: formData.city || "",
        pincode: formData.pincode || "",
        state: formData.state || "",
      },
      order: formData.order,
      ...(uploadedImage && uploadedImage.url && uploadedImage.key
        ? { profileImage: uploadedImage }
        : {})
    };
    try {
      const res = await fetch("/api/createArtisan", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.message || "Failed to update artisan");
        return;
      }
      await fetchUsers();
      clearEditState();
      toast.success("Artisan updated successfully!");
    } catch (e) {
      toast.error("Failed to update artisan. Please try again.");
    }
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingUser(null);
    setEditForm({});
    setSelectedImage("");
    setUploadedImage(null);
  };
  // Inline delete handlers for the table
  const handleInlineDelete = (artisan) => {
    setArtisanToDelete(artisan);
    setShowDeleteModal(true);
  };
  const cancelDelete = () => {
    setShowDeleteModal(false);
    setArtisanToDelete(null);
  };
  const confirmDelete = async () => {
    if (!artisanToDelete) return;
    try {
      const res = await fetch("/api/createArtisan", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: artisanToDelete._id,
          imageKey: artisanToDelete.profileImage?.key || undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed to delete artisan");
      toast.success("Artisan deleted successfully");
      setUsers((prev) => prev.filter((a) => a._id !== artisanToDelete._id));
    } catch (err) {
      toast.error("Failed to delete artisan");
    } finally {
      setShowDeleteModal(false);
      setArtisanToDelete(null);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchSpecializations();
  }, []);

  const [order, setOrder] = useState(users.length + 1);

  // Only set order for new artisan when not editing and edit modal is closed
  useEffect(() => {
    if (!editingUser && !showEditModal) {
      setValue('order', users.length + 1, { shouldValidate: true });
    }
    // When entering edit mode, set order to artisan's order
    if (editingUser && showEditModal) {
      setValue('order', editingUser.order || 1, { shouldValidate: true });
    }
  }, [users, editingUser, showEditModal, setValue]);



  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 py-10">
      <form
        className="flex flex-col md:flex-row gap-8 bg-white shadow-lg rounded-lg p-6 w-full max-w-5xl"
        onSubmit={handleSubmit(onSubmit)}
      >
        {/* Left: Form Fields */}
        <div className="flex-1 space-y-4">
          {/* Artisan Name & Father/Husband Info */}
          <div>
            <div className="font-semibold mb-1">Management Name</div>
            {/* Name/Title Row */}
            <div className="flex gap-2 mb-3">
              <Select
                value={watch("title") || ""}
                onValueChange={(val) =>
                  setValue("title", val, { shouldValidate: true })
                }
              >
                <SelectTrigger className="w-24">
                  <SelectValue placeholder="Mr." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mr.">Mr.</SelectItem>
                  <SelectItem value="Mrs.">Mrs.</SelectItem>
                  <SelectItem value="Ms.">Ms.</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="First Name"
                {...register("firstName", { required: "First Name is required" })}
              />
              {renderError("firstName")}
              <Input
                placeholder="Last Name"
                {...register("lastName", { required: "Last Name is required" })}
              />
              {renderError("lastName")}
            </div>
          </div>
          {/* Management Detail */}
          <div>
            <div className="font-semibold mb-1">Management Detail</div>
            <div className="flex gap-2">
              <Input
                placeholder="Year's Of Experience"
                type="number"
                {...register("yearsOfExperience", { required: "Year's Of Experience is required" })}
              />
              {renderError("yearsOfExperience")}
              {/* Multi-specialization select and chips */}
              <div className="flex flex-col gap-2 w-full">
                <div className="flex gap-2 w-full">
                  <Select
                    value=""
                    onValueChange={(val) => {
                      if (!selectedSpecs.includes(val)) {
                        const updated = [...selectedSpecs, val];
                        setSelectedSpecs(updated);
                        setValue("specializations", updated, { shouldValidate: true });
                      }
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Specialized In" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {allSpecializations.filter((spec) => !selectedSpecs.includes(spec)).map((spec, i) => (
                          <SelectItem key={i} value={spec}>
                            {spec}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setShowModal(true)}
                  >
                    <Plus />
                  </Button>
                </div>
                {/* Chips for selected specializations */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedSpecs.map((spec) => (
                    <span key={spec} className="flex items-center bg-amber-100 px-3 py-1 rounded-full text-sm font-medium">
                      {spec}
                      <button
                        type="button"
                        className="ml-2 text-red-500 hover:text-red-700"
                        onClick={() => {
                          const updated = selectedSpecs.filter((s) => s !== spec);
                          setSelectedSpecs(updated);
                          setValue("specializations", updated, { shouldValidate: true });
                        }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
          {/* Contact Number */}
          <div>
            <div className="font-semibold mb-1">Contact Number</div>
            <div className="flex flex-row gap-3 w-full">
              <div className="flex items-center w-1/2">
                <input
                  type="text"
                  value="+91"
                  disabled
                  className="w-12 p-2 bg-gray-100 border border-gray-300 rounded-l text-center text-sm"
                  tabIndex={-1}
                  style={{ pointerEvents: "none" }}
                />
                <Input
                  placeholder="Call Number"
                  maxLength={10}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  {...register("callNumber", { required: "Call Number is required" })}
                  className="rounded-l-none w-full"
                />
                {renderError("callNumber")}
              </div>
              <div className="flex items-center w-1/2">
                <input
                  type="text"
                  value="+91"
                  disabled
                  className="w-12 p-2 bg-gray-100 border border-gray-300 rounded-l text-center text-sm"
                  tabIndex={-1}
                  style={{ pointerEvents: "none" }}
                />
                <Input
                  placeholder="Whats App Number"
                  maxLength={10}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  {...register("whatsappNumber")}
                  className="rounded-l-none w-full"
                />
              </div>
            </div>
          </div>
          {/* Email */}
          <div>
            <div className="font-semibold mb-1">Email (Optional)</div>
            <Input
              placeholder="Type Email Here"
              type="email"
              {...register("email")}
            />
          </div>
          {/* Address */}
          <div>
            <div className="font-semibold mb-1">Address</div>
            <Textarea
              placeholder="Full Address"
              {...register("address", { required: "Address is required" })}
            />
            {renderError("address")}
            <div className="flex gap-2 mt-2">
              <Input
                placeholder="City"
                {...register("city", { required: "City is required" })}
              />
              {renderError("city")}
              <Input
                placeholder="Pincode"
                {...register("pincode", { required: "Pincode is required" })}
              />
              {renderError("pincode")}
              <Select
                value={watch("state") || ""}
                onValueChange={(val) =>
                  setValue("state", val, { shouldValidate: true })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="State" />
                </SelectTrigger>
                <SelectContent>
                  {INDIAN_STATES.map((state, i) => (
                    <SelectItem key={i} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label>Order</label>
            <Input
              placeholder="Type Order Here"
              type="number"
              {...register("order", { required: "Order is required" })}
              value={watch("order") || ""}
              onChange={e => setValue("order", e.target.value, { shouldValidate: true })}
            />
          </div>
          {editingUser ? (
            <div className="flex gap-4 mt-4">
              <Button
                type="button"
                onClick={handleEditSubmit}
                className="hover:bg-green-900 bg-blue-900 w-32 flex items-center justify-center"
                disabled={loading}
              >
                {loading && (
                  <span className="inline-block w-4 h-4 mr-2 border-2 border-t-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></span>
                )}
                {loading ? "Updating..." : "Update"}
              </Button>
              <Button
                type="button"
                onClick={handleCancelEdit}
                className="hover:bg-gray-700 bg-gray-500 w-32 flex items-center justify-center"
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              type="submit"
              className="hover:bg-red-900 bg-blue-900 w-32 mt-4 flex items-center justify-center"
              disabled={loading}
            >
              {loading && (
                <span className="inline-block w-4 h-4 mr-2 border-2 border-t-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></span>
              )}
              {loading ? "Saving..." : "Data Save"}
            </Button>
          )}
        </div>
        {/* Right: Image Upload with Cloudinary */}
        <div className="relative border rounded-lg p-4 mb-4 h-[400px] flex flex-col items-center justify-center gap-4">
          <input
            type="file"
            onChange={handleImageChange}
            accept="image/*"
            className="hidden"
            id="profileImage"
            ref={fileInputRef}
          />
          <div className="flex flex-col items-center gap-4">
            {selectedImage ? (
              <div className="relative w-48 h-48">
                <img
                  src={selectedImage}
                  alt="Profile"
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
            ) : (
              <div className="w-48 h-48 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                <span className="text-gray-500">Image Preview</span>
              </div>
            )}
            <Button
              type="button"
              variant={selectedImage ? "destructive" : "outline"}
              size="sm"
              className="flex items-center gap-2"
              disabled={imageUploading}
              onClick={async (e) => {
                if (selectedImage) {
                  // toast.success('Image removal requested');
                  // Remove image from Cloudinary if uploadedImage.key is present
                  if (uploadedImage && uploadedImage.key) {
                    try {
                      // console.log('Attempting to delete from Cloudinary:', uploadedImage.key);
                      const res = await fetch('/api/cloudinary', {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ publicId: uploadedImage.key }),
                      });
                      const data = await res.json();
                      if (!res.ok) {
                        toast.error('Cloudinary error: ' + (data.error || 'Failed to delete image from Cloudinary'));
                        // console.error('Cloudinary deletion error:', data.error);
                        return;
                      }
                      toast.success('Image deleted from Cloudinary');
                    } catch (err) {
                      toast.error('Failed to delete image from Cloudinary (network or server error)');
                      // console.error('Cloudinary deletion network/server error:', err);
                    }
                  } else {
                    toast.error('No Cloudinary key found for this image.');
                    // console.error('No Cloudinary key found for image:', uploadedImage);
                  }
                  setSelectedImage('');
                  setUploadedImage(null);
                } else {
                  fileInputRef.current.click();
                }
              }}
            >
              {selectedImage ? (
                "Remove Image"
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Choose Image
                </>
              )}
            </Button>
          </div>
          {imageUploading && (
            <div className="mt-4 w-full max-w-xs">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-center mt-1">{uploadProgress}%</p>
            </div>
          )}
        </div>
      </form>
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Specialization</DialogTitle>
          </DialogHeader>
          <Input
            value={newSpecialization}
            onChange={(e) => setNewSpecialization(e.target.value)}
            placeholder="Specialization Name"
            className="mb-4"
          />
          <DialogFooter>
            <Button type="button" onClick={handleAddSpecialization}>
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="w-full max-w-5xl mx-auto mt-10">
        <div className="w-full">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Management Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-4 whitespace-nowrap text-center"
                  >
                    No management found.
                  </td>
                </tr>
              ) : (
                users.map((artisan, idx) => (
                  <tr key={artisan._id}>
                    <td className="px-6 py-4 whitespace-nowrap">{artisan.order}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {artisan.firstName} {artisan.lastName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Switch
                        checked={artisan.active}
                        onCheckedChange={() => handleToggleActive(artisan)}
                        className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-gray-300"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        className="mr-2 px-2 py-1 border rounded"
                        onClick={() => handleTableView(artisan)}
                      >
                        View
                      </button>
                      <button
                        className="mr-2 px-2 py-1 border rounded bg-gray-200"
                        onClick={() => handleTableEdit(artisan)}
                      >
                        Edit
                      </button>
                      <button
                        className="px-2 py-1 border rounded bg-red-500 text-white"
                        onClick={() => handleInlineDelete(artisan)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {/* Delete Confirmation Modal */}
          {showDeleteModal && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
              <div className="bg-white rounded shadow-lg p-8">
                <h2 className="text-lg font-semibold mb-4">Delete Management</h2>
                <p>Are you sure you want to delete this management?</p>
                <div className="flex justify-end mt-6 gap-3">
                  <button
                    className="px-4 py-2 border rounded"
                    onClick={cancelDelete}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 border rounded bg-red-500 text-white"
                    onClick={confirmDelete}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* View Artisan Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div
            className="bg-white rounded-lg max-w-4xl w-full p-6 overflow-y-auto"
            style={{ maxHeight: "90vh" }}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Management Profile</h2>
              <button
                onClick={closeUserModal}
                className="text-gray-500 hover:text-black text-4xl leading-none focus:outline-none transition-transform duration-150 transform hover:scale-110"
                aria-label="Close"
              >
                &times;
              </button>
            </div>
            <div className="flex flex-col md:flex-row gap-6">
              {/* Image + Address Column */}
              <div className="md:w-1/3 w-full">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center bg-white mb-6">
                  {selectedUser.profileImage ? (
                    <img
                      src={selectedUser.profileImage?.url}
                      alt="Profile"
                      className="w-full h-72 object-cover rounded"
                    />
                  ) : (
                    <div className="text-gray-400">No Image</div>
                  )}
                </div>
                <div className="bg-white p-3 rounded shadow-sm mb-2">
                  <div className="font-semibold text-gray-800">
                    Full Address
                  </div>
                  <div className="text-gray-600">
                    {selectedUser.address?.fullAddress || "-"}
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="bg-white p-3 rounded shadow-sm w-1/2">
                    <div className="font-semibold text-gray-800">City</div>
                    <div className="text-gray-600">
                      {selectedUser.address?.city || "-"}
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded shadow-sm w-1/2">
                    <div className="font-semibold text-gray-800">Pincode</div>
                    <div className="text-gray-600">
                      {selectedUser.address?.pincode || "-"}
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded shadow-sm w-1/2">
                    <div className="font-semibold text-gray-800">State</div>
                    <div className="text-gray-600">
                      {selectedUser.address?.state || "-"}
                    </div>
                  </div>
                </div>
              </div>
              {/* Details Section */}
              <div className="md:w-2/3 w-full">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DetailBox
                    label="Full Name"
                    value={`${selectedUser.title} ${selectedUser.firstName} ${selectedUser.lastName}`}
                  />
                  <DetailBox
                    label="Years of Experience"
                    value={selectedUser.yearsOfExperience}
                  />
                  <DetailBox
                    label="Specializations"
                    value={
                      Array.isArray(selectedUser.specializations)
                        ? selectedUser.specializations.join(", ")
                        : selectedUser.specializations
                    }
                  />
                  <DetailBox
                    label="Email"
                    value={
                      selectedUser.email || selectedUser.contact?.email || "-"
                    }
                  />
                  <DetailBox
                    label="Call Number"
                    value={
                      selectedUser.callNumber ||
                      selectedUser.contact?.callNumber ||
                      "-"
                    }
                  />
                  <DetailBox
                    label="WhatsApp Number"
                    value={
                      selectedUser.whatsappNumber ||
                      selectedUser.contact?.whatsappNumber ||
                      "-"
                    }
                  />
                       <DetailBox
                    label="Order Number"
                    value={
                      selectedUser.order ||
                      "-"
                    }
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={closeUserModal}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded shadow transition-colors duration-150"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Artisan Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div
            className="bg-white rounded-lg max-w-3xl w-full p-6 overflow-y-auto"
            style={{ maxHeight: "90vh" }}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Edit Management</h2>
              <button
                onClick={closeEditModal}
                className="text-gray-500 hover:text-black"
              >
                X
              </button>
            </div>
            <form
              onSubmit={handleEditSubmit}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {/* Image upload input */}
              <div className="flex flex-col items-center">
                {selectedImage && (
                  <div className="mb-2 flex flex-col items-center">
                    <img
                      src={selectedImage}
                      alt="Selected"
                      className="w-32 h-32 object-cover rounded-full border-2 border-blue-500"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      className="mt-2"
                      onClick={handleRemoveImage}
                      disabled={imageUploading}
                    >
                      Remove Image
                    </Button>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  disabled={imageUploading}
                >
                  {imageUploading ? 'Uploading...' : 'Upload Image'}
                </Button>

              </div>
              <div>
                <label className="font-semibold">First Name</label>
                <Input
                  name="firstName"
                  value={editForm.firstName || ""}
                  onChange={handleEditFormChange}
                  required
                />
              </div>
              <div>
                <label className="font-semibold">Last Name</label>
                <Input
                  name="lastName"
                  value={editForm.lastName || ""}
                  onChange={handleEditFormChange}
                  required
                />
              </div>
              <div>
                <label className="font-semibold">Title</label>
                <Input
                  name="title"
                  value={editForm.title || ""}
                  onChange={handleEditFormChange}
                  required
                />
              </div>
              <div>
                <label className="font-semibold">Years of Experience</label>
                <Input
                  name="yearsOfExperience"
                  value={editForm.yearsOfExperience || ""}
                  onChange={handleEditFormChange}
                  required
                />
              </div>
              <div>
                <label className="font-semibold">Specializations</label>
                <Select
                  value={
                    editForm.specializations
                      ? Array.isArray(editForm.specializations)
                        ? editForm.specializations[0]
                        : editForm.specializations
                      : ""
                  }
                  onValueChange={(val) => {
                    setEditForm((prev) => ({
                      ...prev,
                      specializations: [val],
                    }));
                    setValue("specialization", val, { shouldValidate: true });
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Specialization" />
                  </SelectTrigger>
                  <SelectContent>
                    {allSpecializations.map((spec, i) => (
                      <SelectItem key={i} value={spec}>
                        {spec}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="font-semibold">Email</label>
                <Input
                  name="email"
                  value={editForm.email || ""}
                  onChange={handleEditFormChange}
                />
              </div>
              <div>
                <label className="font-semibold">Call Number</label>
                <Input
                  name="callNumber"
                  value={editForm.callNumber || ""}
                  onChange={handleEditFormChange}
                />
              </div>
              <div>
                <label className="font-semibold">WhatsApp Number</label>
                <Input
                  name="whatsappNumber"
                  value={editForm.whatsappNumber || ""}
                  onChange={handleEditFormChange}
                />
              </div>
              <div>
                <label className="font-semibold">Address</label>
                <Input
                  name="address"
                  value={editForm.address || ""}
                  onChange={handleEditFormChange}
                />
              </div>
              <div>
                <label className="font-semibold">City</label>
                <Input
                  name="city"
                  placeholder="Enter city"
                  {...register("city", { required: "City is required" })}
                  value={watch("city") || editForm.city || ""}
                  onChange={handleEditFormChange}
                />
                {errors.city && <span className="text-red-500 text-xs">{errors.city.message}</span>}
              </div>
              <div>
                <label className="font-semibold">Pincode</label>
                <Input
                  name="pincode"
                  placeholder="Enter pincode"
                  {...register("pincode", { required: "Pincode is required" })}
                  value={watch("pincode") || editForm.pincode || ""}
                  onChange={handleEditFormChange}
                />
                {errors.pincode && <span className="text-red-500 text-xs">{errors.pincode.message}</span>}
              </div>
              <div>
                <label className="font-semibold">State</label>
                <Select
                  value={editForm.state || ""}
                  onValueChange={(val) => {
                    setEditForm((prev) => ({ ...prev, state: val }));
                    setValue("state", val, { shouldValidate: true });
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="State" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDIAN_STATES.map((state, i) => (
                      <SelectItem key={i} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="font-semibold">Order</label>
                <Input
                  name="order"
                  type="number"
                  placeholder="Enter order"
                  {...register("order", { required: "Order is required" })}
                  value={watch("order") || editForm.order || ""}
                  onChange={e => {
                    handleEditFormChange(e);
                    setValue("order", e.target.value, { shouldValidate: true });
                  }}
                />
                {errors.order && <span className="text-red-500 text-xs">{errors.order.message}</span>}
              </div>
              <div className="col-span-2 flex justify-end mt-4">
                <Button type="submit">Update</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateArtisan;
