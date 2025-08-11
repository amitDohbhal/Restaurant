import React from "react";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Dialog, DialogContent, DialogHeader, DialogTrigger, DialogTitle } from '@/components/ui/dialog';

// Add delete dialog state
const Address = () => {
  const { data: session } = useSession();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newAddress, setNewAddress] = useState({
    label: "Shipping address",
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    state: "",
    country: "India",
    postalCode: "",
    phone: "",
    email: "",
  });
  const [editIndex, setEditIndex] = useState(null);
  const [editAddress, setEditAddress] = useState(null);

  // Add delete dialog state
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });

  const startEdit = (idx, addr) => {
    setEditIndex(idx);
    setEditAddress({ ...addr });
  };

  const cancelEdit = () => {
    setEditIndex(null);
    setEditAddress(null);
  };

  // Handler for saving edited address
  const handleEditSave = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/shippingAddress", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editAddress),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message);
      } else {
        setAddresses(prev => prev.map((a, i) => i === editIndex ? data.shippingAddress : a));
        setEditIndex(null);
        setEditAddress(null);
        toast.success("Address updated!");
      }
    } catch (e) {
      toast.error("Failed to update address");
    }
    setLoading(false);
  };

  // Handler for deleting address
  const handleDelete = async (_id) => {
    setLoading(true);
    try {
      const res = await fetch("/api/shippingAddress", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _id }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message);
      } else {
        setAddresses(prev => prev.filter(a => a._id !== _id));
        toast.success("Address deleted!");
      }
    } catch (e) {
      toast.error("Failed to delete address");
    }
    setLoading(false);
    setDeleteDialog({ open: false, id: null }); // Close dialog after delete
  };

  // Fetch addresses utility
  const fetchShippingAddresses = async () => {
    try {
      const res = await fetch('/api/shippingAddress', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      // console.log(data);
      if (res.ok && data.addresses) {
        setAddresses(data.addresses);
      } else {
        setAddresses([]);
      }
    } catch (e) {
      setAddresses([]);
    }
  };

  useEffect(() => {
    if (!session?.user?.email) return;
    fetchShippingAddresses();
  }, [session?.user?.email]);

  const handleAdd = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/shippingAddress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAddress),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message);
      } else {
        await fetchShippingAddresses();
        setNewAddress({ label: "Shipping address", firstName: "", lastName: "", address: "", city: "", state: "", country: "India", postalCode: "", phone: "", email: "" });
        toast.success("Address added!");
      }
    } catch (e) {
      toast.error("Failed to add address");
    }
    setLoading(false);
  };
  return (
    <div className="bg-[#fcf7f1] min-h-[400px] p-6 rounded-2xl">
      <div className="mb-4 flex items-center text-gray-700">
        <span className="w-3 h-3 rounded-full bg-pink-500 mr-2 inline-block"></span>
        <span className="text-sm">The following addresses will be used on the checkout page by default.</span>
      </div>
      <div className="flex flex-wrap gap-6 mb-10">
        {addresses.map((addr, idx) => (
          <div
            key={idx}
            className="flex-1 min-w-[320px] max-w-[400px] bg-[#fdf6ee] border border-gray-400 rounded-lg flex flex-col justify-between relative p-0"
            style={{ boxShadow: 'none' }}
          >
            {/* Pink radio button at top left */}
            <div className="absolute top-2 right-3 flex gap-2">
             
            </div>
            {editIndex === idx ? (
              <form
                className="flex flex-col gap-2 p-4"
                onSubmit={e => { e.preventDefault(); handleEditSave(); }}
              >
                <label className="block text-left text-[15px] font-medium">Label</label>
                <input
                  className="border rounded-lg px-4 py-2 bg-white"
                  value={editAddress.label}
                  onChange={e => setEditAddress({ ...editAddress, label: e.target.value })}
                  required
                />
                <label className="block text-left text-[15px] font-medium">First Name</label>
                <input
                  className="border rounded-lg px-4 py-2 bg-white"
                  value={editAddress.firstName}
                  onChange={e => setEditAddress({ ...editAddress, firstName: e.target.value })}
                  required
                />
                <label className="block text-left text-[15px] font-medium">Last Name</label>
                <input
                  className="border rounded-lg px-4 py-2 bg-white"
                  value={editAddress.lastName}
                  onChange={e => setEditAddress({ ...editAddress, lastName: e.target.value })}
                  required
                />
                <label className="block text-left text-[15px] font-medium">Address</label>
                <input
                  className="border rounded-lg px-4 py-2 bg-white"
                  value={editAddress.address}
                  onChange={e => setEditAddress({ ...editAddress, address: e.target.value })}
                  required
                />
                <label className="block text-left text-[15px] font-medium">City</label>
                <input
                  className="border rounded-lg px-4 py-2 bg-white"
                  value={editAddress.city}
                  onChange={e => setEditAddress({ ...editAddress, city: e.target.value })}
                  required
                />
                <label className="block text-left text-[15px] font-medium">State</label>
                <input
                  className="border rounded-lg px-4 py-2 bg-white"
                  value={editAddress.state}
                  onChange={e => setEditAddress({ ...editAddress, state: e.target.value })}
                  required
                />
                <label className="block text-left text-[15px] font-medium">Country</label>
                <input
                  className="border rounded-lg px-4 py-2 bg-white"
                  value={editAddress.country}
                  onChange={e => setEditAddress({ ...editAddress, country: e.target.value })}
                  required
                />
                <label className="block text-left text-[15px] font-medium">Postal Code</label>
                <input
                  className="border rounded-lg px-4 py-2 bg-white"
                  value={editAddress.postalCode}
                  onChange={e => setEditAddress({ ...editAddress, postalCode: e.target.value })}
                  required
                />
                <label className="block text-left text-[15px] font-medium">Phone</label>
                <input
                  className="border rounded-lg px-4 py-2 bg-white"
                  value={editAddress.phone}
                  onChange={e => setEditAddress({ ...editAddress, phone: e.target.value })}
                  required
                />
                <label className="block text-left text-[15px] font-medium">Email</label>
                <input
                  className="border rounded-lg px-4 py-2 bg-white"
                  type="email"
                  value={editAddress.email}
                  onChange={e => setEditAddress({ ...editAddress, email: e.target.value })}
                  required
                />
                <div className="flex gap-4 mt-2">
                  <button
                    type="submit"
                    className="bg-blue-700 text-white px-8 py-2 rounded-lg font-semibold text-base hover:bg-blue-800 transition"
                    disabled={loading}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    className="bg-gray-300 text-black px-8 py-2 rounded-lg font-semibold text-base hover:bg-gray-400 transition"
                    onClick={cancelEdit}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <>
                <span className="absolute -top-3 left-5 w-5 h-5 bg-white rounded-full flex items-center justify-center border-2 border-pink-500">
                  <span className="w-2.5 h-2.5 rounded-full border-2 border-pink-500 block"></span>
                </span>
                <div className="px-5 pt-5 pb-2">
                  <div className="font-bold mb-2 text-[15px]">{addr.label}</div>
                  <div className="text-[15px] mb-1">{addr.firstName} {addr.lastName}</div>
                  <div className="text-[15px] mb-1">{addr.city}</div>
                  <div className="text-[15px] mb-1">Mo. {addr.phone}</div>
                  <div className="text-[15px] mb-1">{addr.email}</div>
                </div>
              </>
            )}
            <span className="absolute -top-3 left-5 w-5 h-5 bg-white rounded-full flex items-center justify-center border-2 border-pink-500">
              <span className="w-2.5 h-2.5 rounded-full border-2 border-pink-500 block"></span>
            </span>
            <hr className="border-t border-gray-300 mx-0" />
            <div className="flex border-t-0 bg-white rounded-b-lg px-5 py-2 gap-4 items-center">
              <button className="flex items-center gap-1 text-sm text-gray-800 hover:text-pink-600 font-medium" onClick={() => startEdit(idx, addr)}>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" d="M4 21v-4.586a1 1 0 0 1 .293-.707l9.586-9.586a2 2 0 0 1 2.828 0l1.586 1.586a2 2 0 0 1 0 2.828l-9.586 9.586A1 1 0 0 1 8.586 21H4Z"/><path stroke="currentColor" strokeWidth="2" d="M15 6l3 3"/></svg>
                Edit
              </button>
              <Dialog open={deleteDialog.open && deleteDialog.id === addr._id} onOpenChange={open => setDeleteDialog(open ? { open: true, id: addr._id } : { open: false, id: null })}>
                <DialogTrigger asChild>
                  <button className="flex items-center gap-1 text-sm text-gray-800 hover:text-red-600 font-medium">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" d="M6 7V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1"/><path stroke="currentColor" strokeWidth="2" d="M19 7v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7m5 4v6m4-6v6"/><path stroke="currentColor" strokeWidth="2" d="M9 7h6"/></svg>
                    Remove
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete Address</DialogTitle>
                  </DialogHeader>
                  <p>Are you sure you want to delete this address?</p>
                  <div className="flex gap-4 mt-4 justify-end">
                    <button className="bg-gray-200 px-4 py-2 rounded" onClick={() => setDeleteDialog({ open: false, id: null })}>Cancel</button>
                    <button className="bg-red-600 text-white px-4 py-2 rounded" onClick={() => handleDelete(addr._id)} disabled={loading}>Delete</button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        ))}
      </div>
      {/* Add New Address section */}
      <div className="border-2 border-dashed border-gray-300 rounded-xl p-10 flex flex-col items-center bg-white">
        <div className="flex flex-col items-center mb-4">
          <span className="bg-pink-700 text-white rounded-full p-5 mb-2">
            <svg width="36" height="36" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" strokeWidth="2" d="M12 3l7 6v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V9l7-6Z"/>
              <path stroke="currentColor" strokeWidth="2" d="M9 21V9h6v12"/>
              <circle cx="16.5" cy="13.5" r="2.5" stroke="white" strokeWidth="2" fill="#d72660"/>
              <path stroke="white" strokeWidth="2" d="M16.5 12v3M15 13.5h3"/>
            </svg>
          </span>
          <div className="font-bold text-lg mb-2 text-center">Add New Address</div>
        </div>
        {!loading && !newAddress.showForm && (
          <button
            className="bg-pink-700 text-white px-8 py-2 rounded-lg font-semibold text-base hover:bg-pink-800 transition"
            onClick={() => setNewAddress({ ...newAddress, showForm: true })}
          >
            Add
          </button>
        )}
        {newAddress.showForm && (
          <form
            className="w-full max-w-md flex flex-col gap-4"
            onSubmit={e => {
              e.preventDefault();
              const requiredFields = [
                "label", "firstName", "lastName", "address", "city", "state", "country", "postalCode", "phone", "email"
              ];
              for (let field of requiredFields) {
                if (!newAddress[field]) {
                  toast.error("Please fill all required fields.");
                  return;
                }
              }
              handleAdd();
              setNewAddress({
                label: "Shipping address",
                firstName: "",
                lastName: "",
                address: "",
                city: "",
                state: "",
                country: "India",
                postalCode: "",
                phone: "",
                email: "",
                showForm: false
              });
            }}
          >
            <label className="block text-left text-[15px] font-medium">Address Label</label>
            <input
              className="border rounded-lg px-4 py-2 bg-white"
              value={newAddress.label}
              onChange={e => setNewAddress({ ...newAddress, label: e.target.value })}
              placeholder="e.g. Home, Billing address, Shipping address"
              required
            />
            <label className="block text-left text-[15px] font-medium">First Name</label>
            <input
              className="border rounded-lg px-4 py-2 bg-white"
              value={newAddress.firstName}
              onChange={e => setNewAddress({ ...newAddress, firstName: e.target.value })}
              required
            />
            <label className="block text-left text-[15px] font-medium">Last Name</label>
            <input
              className="border rounded-lg px-4 py-2 bg-white"
              value={newAddress.lastName}
              onChange={e => setNewAddress({ ...newAddress, lastName: e.target.value })}
              required
            />
            <label className="block text-left text-[15px] font-medium">Address</label>
            <input
              className="border rounded-lg px-4 py-2 bg-white"
              value={newAddress.address}
              onChange={e => setNewAddress({ ...newAddress, address: e.target.value })}
              required
            />
            <label className="block text-left text-[15px] font-medium">City</label>
            <input
              className="border rounded-lg px-4 py-2 bg-white"
              value={newAddress.city}
              onChange={e => setNewAddress({ ...newAddress, city: e.target.value })}
              required
            />
            <label className="block text-left text-[15px] font-medium">State</label>
            <input
              className="border rounded-lg px-4 py-2 bg-white"
              value={newAddress.state}
              onChange={e => setNewAddress({ ...newAddress, state: e.target.value })}
              required
            />
            <label className="block text-left text-[15px] font-medium">Country</label>
            <input
              className="border rounded-lg px-4 py-2 bg-white"
              value={newAddress.country}
              onChange={e => setNewAddress({ ...newAddress, country: e.target.value })}
              required
            />
            <label className="block text-left text-[15px] font-medium">Postal Code</label>
            <input
              className="border rounded-lg px-4 py-2 bg-white"
              value={newAddress.postalCode}
              onChange={e => setNewAddress({ ...newAddress, postalCode: e.target.value })}
              required
            />
            <label className="block text-left text-[15px] font-medium">Phone</label>
            <input
              className="border rounded-lg px-4 py-2 bg-white"
              value={newAddress.phone}
              onChange={e => setNewAddress({ ...newAddress, phone: e.target.value })}
              required
            />
            <label className="block text-left text-[15px] font-medium">Email</label>
            <input
              className="border rounded-lg px-4 py-2 bg-white"
              type="email"
              value={newAddress.email}
              onChange={e => setNewAddress({ ...newAddress, email: e.target.value })}
              required
            />
            <div className="flex gap-4 mt-2">
              <button
                type="submit"
                className="bg-pink-700 text-white px-8 py-2 rounded-lg font-semibold text-base hover:bg-pink-800 transition"
                disabled={loading}
              >
                Save
              </button>
              <button
                type="button"
                className="bg-gray-300 text-black px-8 py-2 rounded-lg font-semibold text-base hover:bg-gray-400 transition"
                onClick={() => setNewAddress({
                  type: "Shipping address",
                  name: "",
                  city: "",
                  phone: "",
                  email: "",
                  showForm: false
                })}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Address;