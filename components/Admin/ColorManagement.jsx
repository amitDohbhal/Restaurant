"use client";
import React, { useState, useEffect } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Switch } from "../ui/switch";
import { toast } from "react-hot-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const ColorManagement = ({ productData, productId }) => {
  // All hooks must be inside this function!
  const [COLOR_LIST, setColorList] = useState([]);

  // Fetch color list from backend on mount
  useEffect(() => {
    const fetchColors = async () => {
      try {
        const res = await fetch('/api/colorList');
        if (!res.ok) throw new Error('Failed to fetch colors');
        const data = await res.json();
        setColorList(data); // Expecting [{name, hex}, ...]
      } catch (err) {
        toast.error('Failed to load color list');
      }
    };
    fetchColors();
  }, []);

  const [showAddColorModal, setShowAddColorModal] = useState(false);
  const [newColorName, setNewColorName] = useState("");
  const [newColorHex, setNewColorHex] = useState("");

  const handleSaveNewColor = async () => {
    if (!newColorName || !/^#[0-9A-Fa-f]{6}$/.test(newColorHex)) return;
    // Prevent duplicates in current list
    if (COLOR_LIST.some(c => c.hex.toLowerCase() === newColorHex.toLowerCase())) {
      setShowAddColorModal(false);
      setNewColorName("");
      setNewColorHex("");
      toast.error("Color already exists");
      return;
    }
    // Add to DB
    try {
      const res = await fetch('/api/colorList', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newColorName, hex: newColorHex })
      });
      if (res.status === 409) {
        toast.error("Color with this name or hex already exists in DB");
        setShowAddColorModal(false);
        setNewColorName("");
        setNewColorHex("");
        return;
      }
      if (!res.ok) throw new Error('Failed to add color');
      const dbColor = await res.json();
      const updated = [{ name: dbColor.name, hex: dbColor.hex }, ...COLOR_LIST];
      setColorList(updated);
      setSelectedHexes([dbColor.hex]); // Select the new color for immediate use
      setShowAddColorModal(false);
      setNewColorName("");
      setNewColorHex("");
      toast.success("New color added!");
    } catch (err) {
      toast.error("Failed to add color");
    }
  };

  // Multiple color selection
  const [selectedHexes, setSelectedHexes] = useState([]); // array of hex codes
  const [customColors, setCustomColors] = useState([]); // array of custom color names
  const [customColorInput, setCustomColorInput] = useState(""); // input field for custom color

  const [fetchedTitle, setFetchedTitle] = useState("");

  const [colorTableData, setColorTableData] = useState([]);
  // API functions
  const fetchColor = async () => {
    if (!productId) return null;
    const res = await fetch(`/api/productColor?product=${productId}`);
    if (!res.ok) return null;
    return res.json();
  };

  const createOrUpdateColor = async (colorArr) => {
    const res = await fetch('/api/productColor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product: productId, colors: colorArr, active: true })
    });
    return res.json();
  };

  const patchColor = async ({ id, active, colors }) => {
    const res = await fetch('/api/productColor', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, active, colors })
    });
    return res.json();
  };


  const fetchColorTable = async () => {
    if (!productId) {
      setColorTableData([]);
      return;
    }
    try {
      const res = await fetch(`/api/productColor?product=${productId}`);
      if (!res.ok) return;
      const data = await res.json();
      setColorTableData(data ? [data] : []);
    } catch (e) {
      setColorTableData([]);
    }
  };


  useEffect(() => {
    fetchColorTable();
  }, []);

  // Toggle color active status via PATCH
  const handleSwitch = async (id, checked) => {
    try {
      await patchColor({ id, active: checked });
      toast.success("Status updated");
      fetchColorTable();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const [editRowId, setEditRowId] = useState(null);
  const handleEditRow = row => {
    setEditRowId(row._id);
    setSelectedHexes(row.colors.filter(c => c.hex).map(c => c.hex));
    setCustomColors(row.colors.filter(c => !c.hex && c.name).map(c => c.name));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditRowId(null);
    setSelectedHexes([]);
    setCustomColors([]);
    setCustomColorInput("");
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editRowId) return;
    let colorArr = [
      ...selectedHexes.map(hex => {
        const found = COLOR_LIST.find(c => c.hex === hex);
        return { name: found?.name || '', hex };
      }),
      ...customColors.map(name => ({ name, hex: '' }))
    ];
    if (colorArr.length === 0) {
      toast.error('Please select or enter at least one color');
      return;
    }
    try {
      await patchColor({ id: editRowId, colors: colorArr });
      toast.success('Color updated!');
      fetchColorTable();
      handleCancelEdit();
    } catch {
      toast.error('Failed to update color');
    }
  };


  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const openDeleteModal = (id) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteId(null);
  };

  const handleDeleteRow = async () => {
    if (!deleteId) return;
    try {
      await fetch(`/api/productColor/${deleteId}`, { method: "DELETE" });
      setColorTableData(prev => prev.filter(row => row._id !== deleteId));
      toast.success("Deleted");
    } catch {
      toast.error("Delete failed");
    }
    setShowDeleteModal(false);
    setDeleteId(null);
  };

  // Fetch product title on mount or productId change
  useEffect(() => {
    if (productData && productData.title) {
      setFetchedTitle(productData.title);
    } else if (productId) {
      fetch(`/api/product/${productId}`)
        .then(async res => {
          if (!res.ok) {
            setFetchedTitle("");
            return;
          }
          const text = await res.text();
          if (!text) {
            setFetchedTitle("");
            return;
          }
          const data = JSON.parse(text);
          setFetchedTitle(data.title || "");
        })
        .catch(() => setFetchedTitle(""));
    } else {
      setFetchedTitle("");
    }
  }, [productData, productId]);

  // Fetch existing color on mount
  useEffect(() => {
    if (productId) {
      fetchColor().then(data => {
        if (data && data.colors && data.colors.length > 0) {
          // Separate hex and custom colors
          const hexes = data.colors.filter(c => c.hex).map(c => c.hex);
          const customs = data.colors.filter(c => !c.hex && c.name).map(c => c.name);
          setSelectedHexes(hexes);
          setCustomColors(customs);
        } else {
          setSelectedHexes([]);
          setCustomColors([]);
        }
      });
    }
  }, [productId]);

  // Submit handler (POST)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!productId) {
      toast.error('No product selected');
      return;
    }
    // Build array of all selected colors
    let colorArr = [
      ...selectedHexes.map(hex => {
        const found = COLOR_LIST.find(c => c.hex === hex);
        return { name: found?.name || '', hex };
      }),
      ...customColors.map(name => ({ name, hex: '' }))
    ];
    if (colorArr.length === 0) {
      toast.error('Please select or enter at least one color');
      return;
    }
    try {
      const data = await createOrUpdateColor(colorArr);
      if (data.error) {
        toast.error(data.error || 'Failed to save color');
      } else {
        toast.success('Product color saved!');
        fetchColorTable();
      }
    } catch (err) {
      toast.error('Network error');
    }
  };

  // Toggle color swatch selection (mutually exclusive)
  const handleHexSelect = (hex) => {
    if (customColors.length > 0) return; // Prevent if custom color is present
    setSelectedHexes((prev) =>
      prev.includes(hex) ? prev.filter(h => h !== hex) : [...prev, hex]
    );
    setCustomColors([]);
    setCustomColorInput("");
  };

  // Custom color input handler (for input field)
  const handleCustomColorChange = (e) => {
    setCustomColorInput(e.target.value);
  };
  // Add custom color to list (mutually exclusive)
  const handleAddCustomColor = () => {
    if (selectedHexes.length > 0) return; // Prevent if swatch color is present
    const val = customColorInput.trim();
    if (val && !customColors.includes(val)) {
      setCustomColors([...customColors, val]);
      setCustomColorInput("");
      setSelectedHexes([]);
    }
  };
  // Remove custom color
  const handleRemoveCustomColor = (name) => {
    setCustomColors(customColors.filter(c => c !== name));
  };
  // Remove swatch color
  const handleRemoveHex = (hex) => {
    setSelectedHexes(selectedHexes.filter(h => h !== hex));
  };
  return (
    <div>
      <form className="page-content" onSubmit={handleSubmit}>
        <div className="container-fluid">
          <div className="row justify-content-center">
            <div className="col-12 col-md-12 col-lg-12">
              <h3 className="my-1 text-center font-semibold text-2xl">Color Management</h3>
              <div className="card my-2">
                <div className="card-body px-4 py-2">
                  <div className="mb-4">
                    {/* Product Name Display (like SizeManagement) */}
                    <div className="mb-4 flex flex-col items-center justify-center">
                      <label className="font-semibold mb-2">Product Name</label>
                      <Input
                        className="mb-4 w-80 font-black text-center border-gray-300"
                        value={fetchedTitle || ''}
                        disabled
                        readOnly
                        placeholder={fetchedTitle ? "Product Name" : "Product Name not found"}
                        style={fetchedTitle ? {} : { border: '2px solid red', color: 'red' }}
                      />
                      {!fetchedTitle && (
                        <div className="text-red-500 text-xs">Product not found</div>
                      )}
                    </div>
                  </div>
                  <div className="mb-4 ">
                    <label className="font-semibold text-lg ">Choose from Color List</label>
                    <Button style={{ marginBottom: 10, marginLeft: 10 }} onClick={() => setShowAddColorModal(true)} type="button">Add Color</Button>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 10, marginTop: 10, height: 300, overflowY: 'auto', border: "1px solid #ccc", padding: "10px" }}>
                      {COLOR_LIST.map((col) => (
                        <div
                          key={col.hex}
                          onClick={() => handleHexSelect(col.hex)}
                          style={{
                            cursor: customColors.length > 0 ? 'not-allowed' : 'pointer',
                            opacity: customColors.length > 0 ? 0.5 : 1,
                            border: selectedHexes.includes(col.hex) ? '3px solid #1976d2' : '1px solid #ccc',
                            borderRadius: 8,
                            padding: 8,
                            minWidth: 120,
                            textAlign: 'center',
                            background: '#f7f7f7',
                          }}
                        >
                          <div style={{ width: 32, height: 32, background: col.hex, borderRadius: '50%', margin: '0 auto 6px', border: '1px solid #888' }} />
                          <div style={{ fontSize: 13 }}>{col.name}</div>
                          <div style={{ fontSize: 12, color: '#888' }}>{col.hex}</div>
                          {selectedHexes.includes(col.hex) && (
                            <button onClick={e => { e.stopPropagation(); handleRemoveHex(col.hex); }} style={{ marginTop: 4, background: 'transparent', border: 'none', color: '#1976d2', cursor: 'pointer', fontSize: 12 }}>Remove</button>
                          )}
                        </div>
                      ))}
                    </div>
                    {/* Add Color Modal */}
                    {showAddColorModal && (
                      <Dialog open={showAddColorModal} onOpenChange={setShowAddColorModal}>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add Custom Color</DialogTitle>
                          </DialogHeader>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <Input placeholder="Color Name" value={newColorName} onChange={e => setNewColorName(e.target.value)} />
                            <Input placeholder="Hex Code (e.g. #123ABC)" value={newColorHex} onChange={e => setNewColorHex(e.target.value)} />
                          </div>
                          <DialogFooter>
                            <Button variant="secondary" onClick={() => setShowAddColorModal(false)}>Close</Button>
                            <Button onClick={handleSaveNewColor} disabled={!newColorName || !/^#[0-9A-Fa-f]{6}$/.test(newColorHex)}>Save</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                  <div style={{ margin: '12px 0', textAlign: 'center', fontWeight: 500, marginTop: "20px" }}>OR</div>
                  <div className="mb-4">
                    <label className="font-semibold ">Enter Custom Color Name</label>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                      <Input
                        type="text"
                        className="form-control mt-2 w-80"
                        placeholder="Type color name (e.g. Sky Blue, Olive, etc)"
                        value={customColorInput}
                        onChange={handleCustomColorChange}
                        disabled={selectedHexes.length > 0}
                      />
                      <Button type="button" onClick={handleAddCustomColor} disabled={!customColorInput.trim() || selectedHexes.length > 0}>Add</Button>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {customColors.map(name => (
                        <span key={name} style={{ background: '#eee', padding: '4px 10px', borderRadius: 12, display: 'flex', alignItems: 'center' }}>
                          {name}
                          <button onClick={() => handleRemoveCustomColor(name)} style={{ marginLeft: 6, background: 'none', border: 'none', color: '#d32f2f', cursor: 'pointer', fontWeight: 'bold' }}>x</button>
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-center">
                    {editRowId ? (
                      <>
                        <Button type="button" className="bg-yellow-500 px-5 py-2 mr-2" onClick={handleUpdate}>
                          Update
                        </Button>
                        <Button type="button" className="bg-gray-400 px-5 py-2" onClick={handleCancelEdit}>
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button type="submit" className="bg-red-500 px-5 py-2">
                        Data Save
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </form>

      <div style={{ marginTop: 40 }}>
        <h2 style={{ fontWeight: 600, marginBottom: 16 }}>All Product Colors</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ minWidth: 700, borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr style={{ background: '#f2f2f2' }}>
                <th style={{ padding: 8, border: '1px solid #ddd' }}>S.No</th>
                <th style={{ padding: 8, border: '1px solid #ddd' }}>Product Name</th>
                <th style={{ padding: 8, border: '1px solid #ddd' }}>Hex / Color Name</th>
                {/* <th style={{ padding: 8, border: '1px solid #ddd' }}>Active</th> */}
                <th style={{ padding: 8, border: '1px solid #ddd' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {colorTableData.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 16 }}>No entries</td></tr>
              )}
              {colorTableData.map((row, idx) => (
                <tr key={row._id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>{idx + 1}</td>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>{row.product?.title || '-'}</td>
                  <td style={{ padding: 8, border: '1px solid #ddd'  }}>
                    {row.colors.map((c, i) => (
                      <span key={i} style={{ marginRight: 8, display: 'inline-block' }}>
                        {c.hex ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                            <span style={{ display: 'inline-block', width: 16, height: 16, background: c.hex, border: '1px solid #888', borderRadius: 4, marginRight: 4 }}></span>
                            <span>{c.name}</span>
                          </span>
                        ) : (
                          <span>{c.name}</span>
                        )}
                      </span>
                    ))}
                  </td>
                  <td style={{ padding: 8, border: '1px solid #ddd', display: 'flex', gap: 8, justifyContent: 'center' }}>
                    <Button onClick={() => handleEditRow(row)} style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 12px', cursor: 'pointer' }}>Edit</Button>
                    <Button variant="destructive" onClick={() => openDeleteModal(row._id)}>
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Delete Modal */}
      {showDeleteModal && (
        <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Color Entry</DialogTitle>
            </DialogHeader>
            <p>Are you sure you want to delete this color entry?</p>
            <DialogFooter>
              <Button variant="secondary" onClick={cancelDelete}>Cancel</Button>
              <Button variant="destructive" onClick={handleDeleteRow}>Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ColorManagement;
