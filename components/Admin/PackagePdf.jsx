"use client";
import React, { useState, useRef } from "react";
import { Button } from "../ui/button";
import toast from "react-hot-toast"
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
const PackagePdf = ({ productData, productId }) => {
  // State for PDF entries
  const [pdfRows, setPdfRows] = useState([]);
  const [saving, setSaving] = useState(false);
  const [uploadingIdx, setUploadingIdx] = useState(null);
  const [pdfLog, setPdfLog] = useState([]); // [{ name, url }]
  const [selectedPdfUrl, setSelectedPdfUrl] = useState(null);
  const [newPdf, setNewPdf] = useState({ name: "", file: null });
  const [uploading, setUploading] = useState(false);
  const productName = productData?.title || "";
  // console.log(pdfRows)
  // Cloudinary PDF upload handler
  const handlePdfUpload = async (file) => {
    if (!file) return;
    if (
      file.type !== "application/pdf" ||
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      toast.error("Only PDF files are allowed!");
      return;
    }
    if (!newPdf.name.trim()) {
      toast.error("First enter the PDF title before uploading the file.");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", newPdf.name || file.name || "Untitled");
      const res = await fetch("/api/uploadPdf", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("PDF upload failed");
      const result = await res.json();
      setNewPdf(prev => ({
        ...prev,
        url: result.secure_url || result.url,
        key: result.public_id || result.key,
      }));
      toast.success("PDF uploaded successfully");
    } catch (err) {
      toast.error("PDF upload failed");
    } finally {
      setUploading(false);
    }
  };
// State for editing
const [editIdx, setEditIdx] = useState(null);
const [editName, setEditName] = useState("");
const [editFile, setEditFile] = useState(null);
const [editUploading, setEditUploading] = useState(false);
const [editFileUrl, setEditFileUrl] = useState("");
const [editFileKey, setEditFileKey] = useState("");

// Start editing
const handleEdit = (idx, row) => {
  setEditIdx(idx);
  setEditName(row.name);
  setEditFile(null);
  setEditFileUrl("");
  setEditFileKey("");
};

// Handle file change in edit
const handleEditFileChange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  if (file.type !== "application/pdf" || !file.name.toLowerCase().endsWith(".pdf")) {
    toast.error("Only PDF files are allowed!");
    return;
  }
  setEditUploading(true);
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", editName || file.name || "Untitled");
    const res = await fetch("/api/uploadPdf", {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error("PDF upload failed");
    const result = await res.json();
    setEditFile(file);
    setEditFileUrl(result.url);
    setEditFileKey(result.key);
    toast.success("PDF uploaded for edit");
  } catch (err) {
    toast.error("PDF upload failed");
  }
  setEditUploading(false);
};

// Save edit
const handleEditSave = async (row) => {
  try {
    const body = { id: row._id, name: editName };
    if (editFileUrl && editFileKey) {
      body.url = editFileUrl;
      body.key = editFileKey;
    }
    const res = await fetch('/api/packagePdf', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (data.success) {
      toast.success("PDF updated");
      fetchAllPdfs();
      setEditIdx(null);
      setEditName("");
      setEditFile(null);
      setEditFileUrl("");
      setEditFileKey("");
    } else {
      toast.error(data.error || "Failed to update");
    }
  } catch {
    toast.error("Failed to update");
  }
};
  const handleSave = async (e) => {
    e.preventDefault();
    if (!newPdf.name || !newPdf.url || !newPdf.key) {
      toast.error("Please upload a PDF and enter a name before saving.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/packagePdf', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          name: newPdf.name,
          url: newPdf.url,
          key: newPdf.key
        })
      });
      const result = await res.json();
      if (!result.success) {
        toast.error(result.error || 'Failed to save PDF');
      } else {
        toast.success("PDF saved!");
        setNewPdf({ name: "", file: null, url: "", key: "" });
        fetchAllPdfs();
      }
    } catch (err) {
      toast.error('Error saving PDF to DB');
    }
    setSaving(false);
  };
  const fetchAllPdfs = async () => {
    const res = await fetch(`/api/packagePdf?productId=${productId}`);
    const data = await res.json();
    if (data.success && Array.isArray(data.data)) {
      setPdfRows(data.data);
    }
  };

  React.useEffect(() => {
    fetchAllPdfs();
  }, [productId]);
  // Modal state for PDF delete
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [rowToDelete, setRowToDelete] = useState(null);

  const handleDeleteRow = (row) => {
    setRowToDelete(row);
    setShowDeleteModal(true);
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setRowToDelete(null);
  };

  const [deleting, setDeleting] = useState(false);

  const confirmDelete = async () => {
    if (!rowToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/packagePdf?id=${rowToDelete._id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.success) {
        toast.success("PDF deleted");
        fetchAllPdfs();
      } else {
        toast.error(data.error || "Failed to delete");
      }
    } catch {
      toast.error("Failed to delete");
    }
    setDeleting(false);
    setShowDeleteModal(false);
    setRowToDelete(null);
  };

  const inputRef = useRef();
  return (
    <>
      <div className="max-w-2xl mx-auto mt-6">
        <h2 className="text-xl font-bold underline mb-2">Upload PDF</h2>
      <form onSubmit={handleSave} className="space-y-4">
        <div className="flex items-center gap-2 mb-3 bg-white rounded-lg shadow-sm px-2 py-2 border border-blue-100">
          <input
            type="text"
            value={newPdf.name}
            onChange={e => setNewPdf({ ...newPdf, name: e.target.value })}
            placeholder="PDF Name"
            className="bg-blue-50 text-gray-900 px-3 py-2 rounded-l-md border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 flex-1 font-medium text-base"
            style={{ minWidth: 0 }}
          />
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            ref={inputRef}
            onChange={async e => {
              const file = e.target.files[0];
              if (!file) return;
              setNewPdf(prev => ({ ...prev, file }));
              await handlePdfUpload(file);
            }}
          />

          <div
            className={`transition-colors duration-150 px-4 py-2 rounded-md font-semibold text-base flex items-center justify-center
              ${uploading ? 'bg-green-600 text-white' : 'bg-black text-white hover:bg-blue-700'}
            `}
            style={{ minWidth: 200, cursor: "pointer" }}
            onClick={() => inputRef.current && inputRef.current.click()}
          >
            {uploading
              ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="animate-spin px-2" />
                  Uploading...
                </span>
              )
              : (newPdf.file?.name || "Upload PDF")}
          </div>
        </div>
        {/* PDF Preview Section for main upload */}
        {newPdf.file && newPdf.url && (
          <div className="mb-4 flex flex-col items-start">
            <div className="font-medium text-gray-700 mb-1">Selected PDF: {newPdf.file.name}</div>
            <iframe
              src={newPdf.url}
              width="400px"
              height="300px"
              style={{ border: '1px solid #ccc', borderRadius: 6 }}
              title="PDF Preview"
            />
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-black text-white py-2 font-semibold text-lg mt-2"
          disabled={saving}
        >
          {saving ? "Saving..." : "Data Save"}
        </button>
      </form>
      <table className="w-full mt-6 border">
        <thead>
          <tr>
            <th>Name</th>
            <th>View</th>
            <th>Delete</th>
          </tr>
        </thead>
        <tbody>
          {pdfRows.map((row, idx) => (
            <tr key={row.key || idx}>
              <td className="px-2 py-2 border border-black text-center">
                {editIdx === idx ? (
                  <>
                    <input
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      className="border px-1"
                    />
                    <input
                      type="file"
                      accept="application/pdf"
                      style={{ display: 'inline-block', marginLeft: 8 }}
                      onChange={e => handleEditFileChange(e)}
                      disabled={editUploading}
                    />
                    {editUploading && <Loader2 className="animate-spin inline-block ml-2" />}
                    {/* PDF Preview Section for edit */}
                    {(editFile && editFileUrl) && (
                      <div className="mt-2">
                        <div className="text-xs text-gray-700 mb-1">Selected PDF: {editFile.name}</div>
                        <iframe
                          src={editFileUrl}
                          width="300px"
                          height="200px"
                          style={{ border: '1px solid #ccc', borderRadius: 6 }}
                          title="PDF Preview"
                        />
                      </div>
                    )}
                    <button onClick={() => handleEditSave(row)} className="ml-2 text-green-600" disabled={editUploading}>Save</button>
                    <button onClick={() => setEditIdx(null)} className="ml-2 text-gray-600" disabled={editUploading}>Cancel</button>
                  </>
                ) : (
                  <>
                    {row.name}
                    <button onClick={() => handleEdit(idx, row)} className="ml-2 text-blue-600">Edit</button>
                  </>
                )}
              </td>
              <td className="px-2 py-2 border border-black text-center">
                <a href={row.url} target="_blank" rel="noopener noreferrer" className="text-white font-bold border p-1 rounded bg-blue-400">View</a>
              </td>
              <td className="px-2 py-2 border border-black text-center">
                <button onClick={() => handleDeleteRow(row)} className="text-white font-bold border p-1 rounded bg-red-400">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* Modal PDF Viewer */}
      {selectedPdfUrl && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ background: '#fff', padding: 16, borderRadius: 8, maxWidth: '90vw', maxHeight: '90vh', boxShadow: '0 2px 16px #0008', position: 'relative' }}>
            <button style={{ position: 'absolute', top: 8, right: 8, fontSize: 24, background: 'transparent', border: 'none', cursor: 'pointer', color: '#333' }} onClick={() => setSelectedPdfUrl(null)}>&times;</button>
            <iframe
              src={selectedPdfUrl}
              width="800px"
              height="600px"
              style={{ border: 'none', maxWidth: '80vw', maxHeight: '80vh' }}
              title="PDF Viewer"
            />
          </div>
        </div>
      )}
    </div>

      {/* Delete PDF Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete PDF</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this PDF?</p>
          <DialogFooter>
            <Button variant="secondary" onClick={cancelDelete}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
              {deleting ? <Loader2 className="animate-spin mr-2 inline-block" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PackagePdf;