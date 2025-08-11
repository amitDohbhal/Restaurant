"use client";
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
// import artisanService from '../services/artisanService';
// import pluginsService from '../services/pluginsService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
const SocialPlugins = ({ artisanId, artisanDetails = null }) => {
  const [artisans, setArtisans] = useState([]);
  const [plugins, setPlugins] = useState([]);
  // console.log(plugins)
  const [selectedArtisan, setSelectedArtisan] = useState(artisanId || '');
  const [formData, setFormData] = useState({
    facebook: '',
    google: '',
    instagram: '',
    youtube: '',
    website: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editPluginData, setEditPluginData] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showPluginsModal, setShowPluginsModal] = useState(false);
  const [selectedArtisanPlugins, setSelectedArtisanPlugins] = useState([]);
  const [selectedArtisanInfo, setSelectedArtisanInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch plugins for selected artisan
  const fetchPlugins = async () => {
    const currentArtisanId = selectedArtisan || artisanId;
    if (!currentArtisanId) {
      setPlugins([]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/artisanPlugins?artisanId=${currentArtisanId}`);
      if (!res.ok) throw new Error('Network response was not ok');
      
      const data = await res.json();
      if (data.success) {
        if (data.plugins) {
          setPlugins(data.plugins);
        } else if (data.plugin) {
          setPlugins(data.plugin ? [data.plugin] : []);
        } else {
          setPlugins([]);
        }
      }
    } catch (error) {
      console.error('Fetch Error:', error);
      toast.error('Failed to fetch plugins');
      setPlugins([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedArtisan || artisanId) {
      fetchPlugins();
    }
  }, [selectedArtisan, artisanId]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedArtisan) {
      toast.error('Please select an Management.');
      return;
    }
    setIsSubmitting(true);
    try {
      let res, data;
      if (editMode && editPluginData) {
        // Update existing plugin
        res = await fetch('/api/artisanPlugins', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, artisan: selectedArtisan, _id: editPluginData._id }),
        });
        data = await res.json();
        if (data.success) {
          toast.success('Social plugin updated!');
        } else {
          toast.error(data.message || 'Failed to update plugin');
        }
      } else {
        // Create new plugin
        res = await fetch('/api/artisanPlugins', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, artisan: selectedArtisan }),
        });
        data = await res.json();
        if (data.success) {
          toast.success('Social plugin created!');
        } else {
          toast.error(data.message || 'Failed to create plugin');
        }
      }
      if (data.success) {
        setEditMode(false);
        setEditPluginData(null);
        setFormData({ facebook: '', google: '', instagram: '',youtube:'', website: '' });
        // Don't reset selectedArtisan if we have artisanId
        if (!artisanId) {
          setSelectedArtisan('');
        }
        // Fetch updated plugins
        fetchPlugins();
      }
      fetchPlugins();
    } catch {
      toast.error('Something went wrong!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch('/api/artisanPlugins', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteTarget }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Social plugin deleted!');
        // fetchArtisans();
        fetchPlugins();
      } else {
        toast.error(data.message || 'Failed to delete plugin');
      }
    } catch {
      toast.error('Failed to delete plugin');
    } finally {
      setShowDeleteModal(false);
      setDeleteTarget(null);

    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteTarget(null);

  };

  // GROUP PLUGINS BY ARTISAN
  const groupedPlugins = plugins.reduce((acc, plugin) => {
    const artisanId = plugin.artisan?._id;
    if (!artisanId) return acc;
    if (!acc[artisanId]) {
      acc[artisanId] = { artisan: plugin.artisan, plugins: [] };
    }
    acc[artisanId].plugins.push(plugin);
    return acc;
  }, {});

  return (
    <div className="page-content flex justify-center">
      <div className="w-full max-w-4xl mx-auto">
        <h4 className="text-center my-4 font-bold text-2xl">Management Social Plugin</h4>
        <div className="bg-white rounded shadow p-6 mb-6">
          <form id="socialPluginForm" onSubmit={handleSubmit}>
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
            {/* Facebook */}
            <div className="mb-3">
              <label className="block mb-1">Facebook</label>
              <input name="facebook" type="url" className="w-full border rounded px-3 py-2" placeholder=" Facebook URL :" value={formData.facebook} onChange={handleChange} />
            </div>
            {/* Google */}
            <div className="mb-3">
              <label className="block mb-1">Google</label>
              <input name="google" type="url" className="w-full border rounded px-3 py-2" placeholder="Google URL :" value={formData.google} onChange={handleChange} />
            </div>
            {/* Instagram */}
            <div className="mb-3">
              <label className="block mb-1">Instagram</label>
              <input name="instagram" type="url" className="w-full border rounded px-3 py-2" placeholder="Instagram URL :" value={formData.instagram} onChange={handleChange} />
            </div>
            {/* Youtube */}
            <div className="mb-3">
              <label className="block mb-1">Youtube</label>
              <input name="youtube" type="url" className="w-full border rounded px-3 py-2" placeholder="Youtube URL :" value={formData.youtube} onChange={handleChange} />
            </div>
            {/* Website */}
            <div className="mb-3">
              <label className="block mb-1">Website</label>
              <input name="website" type="url" className="w-full border rounded px-3 py-2" placeholder="Website URL :" value={formData.website} onChange={handleChange} />
            </div>
            <div className="text-center">
              <button type="submit" className="bg-blue-600 text-white px-5 py-2 rounded" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Data Save'}</button>
              {editMode && (
                <button type="button" className="bg-gray-400 text-white px-5 py-2 rounded ml-2" onClick={() => { setEditMode(false); setSelectedArtisan(''); setFormData({ facebook: '', google: '', instagram: '', youtube:'', website: '' }); }}>Cancel</button>
              )}
            </div>
          </form>
        </div>
        {/* Artisan Table */}
        <div className="bg-white rounded shadow p-6">
          <h4 className="mb-3 font-semibold text-lg">Manage Plugins</h4>
          <div className="overflow-x-auto">
            <Table className="min-w-full divide-y divide-gray-200">
              <TableHeader>
                <TableRow className="bg-gray-100">
                  <TableHead className="px-4 py-3 text-center">S.No</TableHead>
                  <TableHead className="px-4 py-3 text-center">Management Name</TableHead>
                  <TableHead className="px-4 py-3 text-center">Management Number</TableHead>
                  <TableHead className="px-4 py-3 text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plugins.length === 0 || Object.keys(groupedPlugins).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4">No plugins found.</TableCell>
                  </TableRow>
                ) : (
                  Object.values(groupedPlugins).map((group, idx) => (
                    <TableRow key={group.artisan._id}>
                      <TableCell className="px-4 py-3 text-center font-medium">{idx + 1}</TableCell>
                      <TableCell className="px-4 py-3 text-center whitespace-nowrap ">{group.artisan.title} {group.artisan.firstName} {group.artisan.lastName}</TableCell>
                      <TableCell className="px-4 py-3 text-center whitespace-nowrap ">{group.artisan.artisanNumber}</TableCell>
                      <TableCell className="px-4 py-3 flex gap-2 justify-center">
                        <Button size="sm" variant="default" className="bg-blue-500 text-white px-3 py-1 rounded mr-2" onClick={() => {
                          setSelectedArtisanPlugins(group.plugins);
                          setSelectedArtisanInfo(group.artisan);
                          setShowPluginsModal(true);
                        }}>
                          View
                        </Button>
                        <Button size="sm" variant="default" className="bg-yellow-500 text-white px-3 py-1 rounded mr-2" onClick={() => {
                          // Edit the first plugin for this artisan
                          const plugin = group.plugins[0];
                          setSelectedArtisan(plugin.artisan._id);
                          setEditMode(true);
                          setEditPluginData(plugin);
                          setFormData({
                            facebook: plugin.facebook || '',
                            google: plugin.google || '',
                            instagram: plugin.instagram || '',
                            youtube: plugin.youtube || '',
                            website: plugin.website || '',
                          });
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}>
                          Edit
                        </Button>
                        <Button size="sm" variant="destructive" className="bg-red-600 text-white px-3 py-1 rounded" onClick={() => {
                          // Delete the first plugin for this artisan
                          const plugin = group.plugins[0];
                          setDeleteTarget(plugin._id);
                          setShowDeleteModal(true);

                        }}>
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
        {/* Plugins Modal: Show all plugin URLs for the artisan */}
        {showPluginsModal && selectedArtisanPlugins && selectedArtisanInfo && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30">
            <div className="bg-white p-6 rounded shadow-lg max-w-xl w-full">
              <h3 className="font-bold text-xl mb-4">All Social Plugins for {selectedArtisanInfo.title} {selectedArtisanInfo.firstName} {selectedArtisanInfo.lastName}</h3>
              <div className="space-y-4">
                {selectedArtisanPlugins.map((plugin, idx) => (
                  <div key={plugin._id || idx} className="border rounded p-4">
                    <div className="bg-white p-3 rounded border border-gray-200 shadow-md mb-2">
                      <div className="font-semibold text-gray-800">Facebook</div>
                      <div className="text-gray-600">{plugin.facebook ? <a href={plugin.facebook} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">{plugin.facebook}</a> : <span className="text-gray-400">N/A</span>}</div>
                    </div>
                    <div className="bg-white p-3 rounded border border-gray-200 shadow-md mb-2">
                      <div className="font-semibold text-gray-800">Google</div>
                      <div className="text-gray-600">{plugin.google ? <a href={plugin.google} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">{plugin.google}</a> : <span className="text-gray-400">N/A</span>}</div>
                    </div>
                    <div className="bg-white p-3 rounded border border-gray-200 shadow-md mb-2">
                      <div className="font-semibold text-gray-800">Instagram</div>
                      <div className="text-gray-600">{plugin.instagram ? <a href={plugin.instagram} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">{plugin.instagram}</a> : <span className="text-gray-400">N/A</span>}</div>
                    </div>

                    <div className="bg-white p-3 rounded border border-gray-200 shadow-md mb-2">
                      <div className="font-semibold text-gray-800">Youtube</div>
                      <div className="text-gray-600">{plugin.youtube ? <a href={plugin.youtube} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">{plugin.youtube}</a> : <span className="text-gray-400">N/A</span>}</div>
                    </div>

                    <div className="bg-white p-3 rounded border border-gray-200 shadow-md mb-2">
                      <div className="font-semibold text-gray-800">Website</div>
                      <div className="text-gray-600">{plugin.website ? <a href={plugin.website} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">{plugin.website}</a> : <span className="text-gray-400">N/A</span>}</div>
                    </div>
                  </div>
                ))}
              </div>
              <button className="mt-6 bg-blue-600 text-white px-4 py-2 rounded" onClick={() => setShowPluginsModal(false)}>Close</button>
            </div>
          </div>
        )}
        {/* Delete Confirmation Modal (Dialog) */}
        <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Plugin</DialogTitle>
            </DialogHeader>
            <p>Are you sure you want to delete this plugin?</p>
            <DialogFooter>
              <Button variant="secondary" onClick={cancelDelete}>Cancel</Button>
              <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
// ...
export default SocialPlugins;
