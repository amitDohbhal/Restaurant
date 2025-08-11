"use client";
import React, { useState, useEffect } from 'react';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell
} from "../ui/table";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { toast } from 'react-hot-toast';
import { Input } from "../ui/input";
import { Label } from "../ui/label";


const ProductTagLine = ({ productData, productId }) => {
  // ...existing state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [rowToDelete, setRowToDelete] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState("");

  // Tag creation state
  const [tags, setTags] = useState([]); // All tag options (suggestions)
  const [selectedTags, setSelectedTags] = useState([]); // Selected tags for current product

  const [newTagInput, setNewTagInput] = useState("");

  // Table state
  const [categoryRows, setCategoryRows] = useState([]); // [{ product, productName, tags, categoryTagId }]
  const [editRow, setEditRow] = useState(null); // { product, tags, categoryTagId }
//   console.log(categoryRows)
  const [productTitle, setProductTitle] = useState("")
  useEffect(() => {
    if (!productData && productId) {
      fetch(`/api/product/${productId}`)
        .then(async res => {
          if (!res.ok) {
            setProductTitle("");
            return;
          }
          const text = await res.text();
          if (!text) {
            setProductTitle("");
            return;
          }
          const data = JSON.parse(text);
          setProductTitle(data.title || "");
        })
        .catch(() => setProductTitle(""));
    }
  }, [productData, productId]);

  const productName = productData?.title || productTitle || "";
  // Fetch only the current product's category tags and all tags on mount or when product changes
  useEffect(() => {
    if (!productId) return;
    // Fetch category tags for this product only
    fetch(`/api/productTagLine?product=${productId}`)
      .then(res => res.json())
      .then(data => {
        // Only set a single row for the current product
        if (data && data.success && data.data && data.data.tagLine) {
          setCategoryRows([{
            product: productId,
            productName: productData?.title || productTitle || "",
            tagLine: data.data.tagLine,
            categoryTagId: data.data._id
          }]);
        } else {
          setCategoryRows([]); // No row if no category data
        }
      });
    // Fetch all tags from Tag model (for suggestions)
    fetch("/api/TagLine")
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data.tags)) {
          setTags(data.tags.map(tag => tag.name));
        }
      });
  }, [productId, productData, productTitle]);

  // Remove ALL code that sets or merges categoryRows with multiple products
  // categoryRows should always be an array with at most one object for the current product

  // Tag input and add logic with suggestions
  const handleTagInputChange = (e) => {
    setNewTagInput(e.target.value);
  };
  const handleAddTag = async () => {
    const trimmed = newTagInput.trim();
    if (!trimmed) {
      // No error toast, input is not required for form submission
      return;
    }
    if (selectedTags.includes(trimmed)) {
      toast.error("Product Tag Line already selected.");
      setNewTagInput("");
      return;
    }
    if (tags.includes(trimmed)) {
      // Tag already exists in dropdown, just add to selectedTags
      setSelectedTags([...selectedTags, trimmed]);
      setNewTagInput("");
      toast.success("Product Tag Line added to selection!");
      return;
    }
    // If tag does not exist, create it via API
    try {
      const res = await fetch("/api/TagLine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed })
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to create Product Tag Line.");
        return;
      } else {
        toast.success("Product Tag Line created!");
      }
      // Always re-fetch tags after adding
      const tagsRes = await fetch("/api/TagLine");
      const tagsData = await tagsRes.json();
      if (tagsData && Array.isArray(tagsData.tags)) {
        setTags(tagsData.tags.map(tag => tag.name));
      }
      setSelectedTags([...selectedTags, trimmed]);
      setNewTagInput("");
    } catch (err) {
      toast.error("API error while creating Product Tag Line");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const productToSend = productId || selectedProduct;
    const tagLineToSend = selectedTags[0] || '';
    if (!productToSend || !tagLineToSend.trim()) {
      toast.error("Product and tagLine are required.");
      return;
    }
    // console.log(selectedTags)
    try {
      const productToSend = productId || selectedProduct;
      let res, method, url;
      // If a tag line already exists for this product, PATCH, else POST
      if (categoryRows.length > 0 && categoryRows[0].categoryTagId) {
        method = "PATCH";
        url = "/api/productTagLine";
      } else {
        method = "POST";
        url = "/api/productTagLine";
      }
      res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product: productToSend, tagLine: tagLineToSend })
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success("Product Tag Line saved!");
        // Refresh the tag line for this product
        fetch(`/api/productTagLine?product=${productToSend}`)
          .then(res => res.json())
          .then(data => {
            if (data && data.success && data.data && data.data.tagLine) {
              setCategoryRows([{
                product: productToSend,
                productName: productData?.title || productTitle || "",
                tagLine: data.data.tagLine,
                categoryTagId: data.data._id
              }]);
            } else {
              setCategoryRows([]);
            }
          });
        setSelectedTags([]);
        setTags([]);
        setEditRow(null);
        setSelectedProduct("");
      } else {
        toast.error(json.error || "Error saving Product Tag Line");
      }
    } catch (err) {
      toast.error("API error");
    }
  };

  // Edit handler
  const handleEdit = (row) => {
    setEditRow(row);
    setSelectedProduct(row.product);
    setSelectedTags([row.tagLine]);
  };
  // Delete handler
  const handleDelete = async (row) => {
    const productToDelete = row.product || productId || selectedProduct;
    if (!productToDelete) {
      toast.error("No product ID found for deletion!");
      return;
    }
    try {
      const res = await fetch(`/api/productTagLine?product=${encodeURIComponent(productToDelete)}`, {
        method: "DELETE"
      });
      const json = await res.json();
      // console.log("Delete API response:", json, "Status:", res.status);
      if (res.ok && json.success) {
        toast.success("Product Tag Line deleted!");
        // Re-fetch the category rows for the current product
        fetch(`/api/productTagLine?product=${productToDelete}`)
          .then(res => res.json())
          .then(data => {
            if (data && data.success && data.data && data.data.tagLine) {
              setCategoryRows([{
                product: productToDelete,
                productName: productData?.title || productTitle || "",
                tagLine: data.data.tagLine,
                categoryTagId: data.data._id
              }]);
            } else {
              setCategoryRows([]);
            }
          });
      } else {
        toast.error(json.error || "Delete failed");
      }
    } catch (err) {
      toast.error("API error");
    //   console.error("Delete error:", err);
    }
  };


  return (
    <form className="page-content" onSubmit={handleSubmit}>
      {/* If in edit mode, show a banner and Cancel button */}
      <div className="container-fluid">
        <div className="row justify-content-center ">
          <div className="col-12 col-md-12 col-lg-12 bg-gray-100">
            {/* <h3 className="my-4 text-center">Product Tag Line</h3> */}
            <div className="card my-2">
              <div className="card-body px-4 py-2">
                <div className="mb-6 flex flex-col items-start justify-center">
                  <Label className="font-bold text-md mb-2 text-center">Product Name</Label>
                  <Input
                    className="mb-4 w-80 font-black text-start border-gray-300"
                    value={productName}
                    disabled
                    readOnly
                    placeholder={productName ? "Product Name" : "Product Name not found"}
                    style={productName ? {} : { border: '2px solid red', color: 'red' }}
                  />
                  {!productName && (
                    <div style={{ color: 'red', marginTop: '4px', fontWeight: 'bold' }}>
                      Product name not found! Please check if the product was created successfully.
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2 mb-4 items-start justify-center">
                  <label className="font-bold text-center">Product Tag Line</label>
                  <div className="flex flex-row gap-2 items-center justify-center mb-4">
                    {/* Select dropdown for existing tags */}
                    <select
                      className="border p-2 rounded w-48"
                      value=""
                      onChange={e => {
                        const val = e.target.value;
                        if (
                          val &&
                          !selectedTags.includes(val)
                        ) {
                          setSelectedTags([...selectedTags, val]);
                        }
                      }}
                    >
                      <option value="" disabled>Select Product Tag</option>
                      {tags.map((tag, idx) => (
                        <option key={tag} value={tag}>{tag}</option>
                      ))}
                    </select>
                    {/* Input for new tag */}
                    <input
                      type="text"
                      value={newTagInput}
                      onChange={handleTagInputChange}
                      className="border p-2 rounded w-48"
                      placeholder="Add new tag"
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                      autoComplete="off"
                    />
                    <button type="button" className="bg-blue-500 text-white px-3 py-1 rounded" onClick={handleAddTag}>
                      Add
                    </button>                  </div>
                  <div className="flex gap-2 flex-wrap mt-2">
                    {selectedTags.map((tag, idx) => (
                      <span key={tag} className="bg-gray-200 px-2 py-1 rounded-full flex items-center">
                        {tag}
                        <button type="button" className="ml-2 text-red-500" onClick={() => setSelectedTags(selectedTags.filter(t => t !== tag))}>
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  {/* Submit button: label changes depending on edit mode */}
                  <button type="submit" className="bg-red-600 text-white px-4 py-2 rounded mt-4 w-48 font-bold">
                    {categoryRows.length > 0 ? "Update Tag Line" : "Create Tag Line"}
                  </button>
                </div>
              </div>
            </div>
          </div>
          {/* Category Tag Table */}

          <div className="mt-8">
            <h4 className="mb-2 font-bold text-center">Product Tag Line for: {productData?.title || productTitle || "Current Product"}</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>S.No</TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Product Tag Line</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categoryRows.length > 0 ? (
                  categoryRows.map((row, idx) => (
                    <TableRow key={row.product}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>{row.productName}</TableCell>
                      <TableCell>
                        <span style={{ background: '#eee', padding: '6px', border: '1px solid #ccc', borderRadius: 12 }}>{row.tagLine}</span>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="default" className="bg-yellow-500 text-white px-3 py-1 rounded mr-2" type="button" onClick={() => handleEdit(row)}>Edit</Button>
                        <Button size="sm" variant="destructive" type="button" onClick={() => { setShowDeleteDialog(true); setRowToDelete(row); }}>Delete</Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-gray-500">No Product Tag Line found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure you want to delete this Product Tag Line?</DialogTitle>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={async () => {
              if (rowToDelete) await handleDelete(rowToDelete);
              setShowDeleteDialog(false);
              setRowToDelete(null);
            }}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </form>
  );
};

export default ProductTagLine;
