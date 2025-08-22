"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import toast from "react-hot-toast";
import { PencilIcon, Trash2Icon, Plus, Minus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const Vendor = () => {
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [vendorToDelete, setVendorToDelete] = useState(null);
    const [vendors, setVendors] = useState([]);
    const [editVendor, setEditVendor] = useState(null);
    const [formData, setFormData] = useState({
        vendors: [{
            vendorName: "",
            vendorCallNo1: "",
            vendorCallNo2: "",
            vendorGstNo: ""
        }],
    });

    // Fetch vendors and determine the next order number
    useEffect(() => {
        const fetchVendors = async () => {
            try {
                const response = await fetch("/api/createVendor");
                const data = await response.json();
                setVendors(data);
            } catch (error) {
                toast.error("Failed to fetch vendors");
            }
        };
        fetchVendors();
    }, []);

    // Handle vendor input changes
    const handleVendorInputChange = (index, field, value) => {
        const updatedVendors = [...formData.vendors];
        updatedVendors[index][field] = value;
        setFormData({ ...formData, vendors: updatedVendors });
    };

    // Add new vendor input
    const addVendor = () => {
        setFormData({
            ...formData,
            vendors: [...formData.vendors, {
                vendorName: "",
                vendorCallNo1: "",
                vendorCallNo2: "",
                vendorGstNo: ""
            }]
        });
    };

    // Remove vendor input
    const removeVendor = (index) => {
        if (formData.vendors.length > 1) {
            const updatedVendors = formData.vendors.filter((_, i) => i !== index);
            setFormData({ ...formData, vendors: updatedVendors });
        }
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validate that at least one vendor has required fields
        const hasValidVendor = formData.vendors.some(vendor => 
            vendor.vendorName.trim() && vendor.vendorCallNo1.trim()
        );
        
        if (!hasValidVendor) {
            return toast.error("Please fill in at least one vendor with name and phone number");
        }

        try {
            const method = editVendor ? "PATCH" : "POST";
            const payload = {
                vendors: formData.vendors.filter(vendor => 
                    vendor.vendorName.trim() && vendor.vendorCallNo1.trim()
                ),
                id: editVendor,
            };

            const response = await fetch("/api/createVendor", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success(`Vendors ${editVendor ? "updated" : "added"} successfully`);
                setEditVendor(null);

                // Refresh vendor list
                const updatedVendors = await fetch("/api/createVendor").then((res) => res.json());
                setVendors(updatedVendors);

                // Reset form
                setFormData({
                    vendors: [{
                        vendorName: "",
                        vendorCallNo1: "",
                        vendorCallNo2: "",
                        vendorGstNo: ""
                    }],
               });
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error("Something went wrong");
        }
    };

    const handleEdit = (vendor) => {
        setEditVendor(vendor._id);
        setFormData({
            vendors: vendor.vendors,
        });
    };

    const handleDelete = async (id) => {
        try {
            const response = await fetch("/api/createVendor", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success("Vendor deleted successfully");
                setVendors((prev) => prev.filter((vendor) => vendor._id !== id));

                // Update order numbers
                const updatedVendors = await fetch("/api/createVendor").then((res) => res.json());
                setVendors(updatedVendors);
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error("Something went wrong");
        }
    };

    const confirmDelete = async () => {
        if (vendorToDelete) {
            await handleDelete(vendorToDelete);
            setVendorToDelete(null);
            setShowDeleteModal(false);
        }
    };

    const cancelDelete = () => {
        setShowDeleteModal(false);
        setVendorToDelete(null);
    };

    return (
        <div className="max-w-5xl mx-auto py-10 w-full">
            <h2 className="text-2xl font-bold mb-6">{editVendor ? "Edit Vendors" : "Add New Vendors"}</h2>
            <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-lg p-6 space-y-4">
                
                {/* Dynamic Vendor Inputs */}
                {formData.vendors.map((vendor, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold">Vendor {index + 1}</h3>
                            {formData.vendors.length > 1 && (
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => removeVendor(index)}
                                >
                                    <Minus className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                        
                        <div>
                            <Label>Vendor Name *</Label>
                            <Input 
                                placeholder="Enter vendor name" 
                                type="text" 
                                value={vendor.vendorName} 
                                onChange={(e) => handleVendorInputChange(index, 'vendorName', e.target.value)}
                                required
                            />
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <div className="flex-1">
                                <Label>Vendor Call No 1st *</Label>
                                <Input 
                                    placeholder="Enter vendor Call No 1st" 
                                    type="number" 
                                    maxLength={10}
                                    value={vendor.vendorCallNo1} 
                                    onChange={(e) => handleVendorInputChange(index, 'vendorCallNo1', e.target.value)}
                                    required
                                />
                            </div>
                            <div className="flex-1">
                                <Label>Vendor Call No 2nd</Label>
                                <Input 
                                    placeholder="Enter vendor Call No 2nd" 
                                    type="number" 
                                    maxLength={10}
                                    value={vendor.vendorCallNo2} 
                                    onChange={(e) => handleVendorInputChange(index, 'vendorCallNo2', e.target.value)}
                                />
                            </div>
                        </div>
                        
                        <div>
                            <Label>Vendor GST No</Label>
                            <Input 
                                placeholder="Enter vendor GST No" 
                                type="text" 
                                value={vendor.vendorGstNo} 
                                onChange={(e) => handleVendorInputChange(index, 'vendorGstNo', e.target.value)}
                            />
                        </div>
                    </div>
                ))}

                {/* Add Vendor Button */}
                <div className="flex justify-center">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={addVendor}
                        className="flex items-center gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        Add Another Vendor
                    </Button>
                </div>
                <div className="flex gap-3">
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-500">
                        {editVendor ? "Update Vendors" : "Add Vendors"}
                    </Button>
                    {editVendor && (
                        <Button
                            type="button"
                            variant="outline"
                            className="bg-gray-300 hover:bg-gray-200 text-black"
                            onClick={() => {
                                setEditVendor(null);
                                setFormData({
                                    vendors: [{
                                        vendorName: "",
                                        vendorCallNo1: "",
                                        vendorCallNo2: "",
                                        vendorGstNo: ""
                                    }],
                                });
                            }}
                        >
                            Cancel Edit
                        </Button>
                    )}
                </div>
            </form>

            <h2 className="text-2xl font-bold mt-10 mb-4">Existing Vendors</h2>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Vendors Count</TableHead>
                        <TableHead>Vendor Names</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {vendors.length > 0 ? (
                        vendors.map((vendorGroup) => (
                            <TableRow key={vendorGroup._id}>
                                <TableCell className="px-10">{vendorGroup.vendors.length}</TableCell>
                                <TableCell>
                                    <div className="space-y-1">
                                        {vendorGroup.vendors.map((vendor, index) => (
                                            <div key={index} className="text-sm">
                                                <strong>{vendor.vendorName}</strong> - {vendor.vendorCallNo1}
                                                {vendor.vendorCallNo2 && `, ${vendor.vendorCallNo2}`}
                                                {vendor.vendorGstNo && (
                                                    <div className="text-xs text-gray-500">GST: {vendor.vendorGstNo}</div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Button variant="outline" size="icon" onClick={() => handleEdit(vendorGroup)} className="mr-2">
                                        <PencilIcon />
                                    </Button>
                                    <Button size="icon" onClick={() => { setShowDeleteModal(true); setVendorToDelete(vendorGroup._id); }} variant="destructive">
                                        <Trash2Icon />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan="4" className="text-center py-4">No vendors found</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Vendor Group</DialogTitle>
                    </DialogHeader>
                    <p>Are you sure you want to delete this vendor group?</p>
                    <DialogFooter>
                        <Button variant="secondary" onClick={cancelDelete}>Cancel</Button>
                        <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Vendor