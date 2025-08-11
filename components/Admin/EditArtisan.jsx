"use client"
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "react-hot-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import Link from "next/link";



export default function EditArtisan({ artisan }) {
  const router = useRouter();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [artisanToDelete, setArtisanToDelete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);

  // Filter states
  const [filterName, setFilterName] = useState('');
  const [filterNumber, setFilterNumber] = useState('');
  const [filterPhone, setFilterPhone] = useState('');
  const handleDeleteClick = (artisan) => {
    setArtisanToDelete(artisan);
    setShowDeleteModal(true);
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/createArtisan');
      if (!res.ok) throw new Error('Failed to fetch management');
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      toast.error("Failed to fetch management. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!artisanToDelete) return;
    try {
      setLoading(true)
      const res = await fetch("/api/createArtisan", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: artisanToDelete._id, imageKey: artisanToDelete.profileImage?.key || undefined })
      });
      if (!res.ok) throw new Error("Failed to delete management");
      toast.success("Management deleted successfully");
      if (onDeleted) onDeleted(artisanToDelete._id);
    } catch (err) {
      toast.error("Failed to delete management");
    } finally {
      setShowDeleteModal(false);
      setArtisanToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setArtisanToDelete(null);
  };
  useEffect(() => {
    fetchUsers();
  }, []);

  // Filtered users
  const filteredUsers = users.filter(artisan => {
    const matchesName = `${artisan.firstName} ${artisan.lastName}`.toLowerCase().includes(filterName.toLowerCase());
    const matchesNumber = !filterNumber || (artisan.artisanNumber || '').toLowerCase().includes(filterNumber.toLowerCase());
    const matchesPhone = !filterPhone || (
      (artisan.contact.callNumber && artisan.contact.callNumber.toLowerCase().includes(filterPhone.toLowerCase())) ||
      (artisan.contact.whatsappNumber && artisan.contact.whatsappNumber.toLowerCase().includes(filterPhone.toLowerCase()))
    );
    return matchesName && matchesNumber && matchesPhone;
  });

  return (
    <div className="w-full">
      {/* Filter Section */}
      <div className="flex flex-wrap gap-4 mb-4 items-end bg-gray-50 p-4 rounded-lg border border-gray-200">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            type="text"
            value={filterName}
            onChange={e => setFilterName(e.target.value)}
            className="border rounded px-2 py-1"
            placeholder="Search by name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Management Number</label>
          <input
            type="text"
            value={filterNumber}
            onChange={e => setFilterNumber(e.target.value)}
            className="border rounded px-2 py-1"
            placeholder="Search by number"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Phone Number</label>
          <input
            type="text"
            value={filterPhone}
            maxLength={10}
            onChange={e => setFilterPhone(e.target.value)}
            className="border rounded px-2 py-1"
            placeholder="Search by phone"
          />
        </div>
        <button
          className="ml-4 px-3 py-1 bg-gray-300 rounded"
          onClick={() => { setFilterName(''); setFilterNumber(''); setFilterPhone(''); }}
        >
          Reset Filters
        </button>
      </div>
      <div className="bg-white shadow-lg rounded-xl p-6 mt-6 w-full overflow-x-auto">
        <Table className="min-w-full divide-y divide-gray-200">
          <TableHeader>
            <TableRow className="bg-gray-100">
              <TableHead className="px-4 py-3">S.No.</TableHead>
              <TableHead className="px-4 py-3">Management Name</TableHead>
              <TableHead className="px-4 py-3">Edit Info</TableHead>
              <TableHead className="px-4 py-3">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6">Loading...</TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6">No Management found.</TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((artisan, idx) => (
                <TableRow key={artisan._id} className="hover:bg-gray-200 transition">
                  <TableCell className="px-4 py-3 font-medium">{idx + 1}</TableCell>
                  <TableCell className="px-4 py-3">{artisan.firstName} {artisan.lastName}</TableCell>
                  <TableCell className="px-4 py-3">

                    <Link
                      href={`/admin/artisan/${artisan._id}`}
                      onClick={() => {
                        if (typeof window !== 'undefined') {
                          sessionStorage.setItem(`artisan_${artisan._id}`, JSON.stringify(artisan));
                        }
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white rounded px-4 py-2 text-sm font-medium transition"
                    >
                      Edit Info
                    </Link>
                  </TableCell>
                  <TableCell className="px-4 py-3 space-x-2">
                    <Link href={`/admin/management_dashboard/${artisan._id}`}>
                      <Button size="sm" variant="outline">View</Button>
                    </Link>
                    {/* <Button size="sm" variant="secondary" onClick={() => onEdit && onEdit(artisan)}>Edit</Button> */}
                    <Button size="sm" variant="destructive" onClick={() => handleDeleteClick(artisan)}>Delete</Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Management</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this management?</p>
          <DialogFooter>
            <Button variant="secondary" onClick={cancelDelete}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
