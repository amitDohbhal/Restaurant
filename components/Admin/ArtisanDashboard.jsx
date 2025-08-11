"use client";
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'react-hot-toast';
import Link from "next/link"
import { ArrowLeftIcon } from 'lucide-react';
const sectionTitles = [
  'Profile',
  'Promotions Reviews',
  'Blog',
  'Artisan Story',
  'Social Plugins',
  'Certificates',
];

const boxStyle = {
  border: '1px solid #ced4da',
  borderRadius: '8px',
  padding: '15px',
  background: '#f8f9fa',
  minHeight: '100px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'start',
  marginBottom: '16px'
};



const ArtisanDashboard = () => {
  const params = useParams();
  const artisanId = params?.id;
  // State for artisan and all section data
  const [artisan, setArtisan] = useState(null);
  // console.log(artisan)
  const [loading, setLoading] = useState(true);
  const [promotions, setPromotions] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [stories, setStories] = useState([]);
  const [socialPlugin, setSocialPlugin] = useState(null);
  const [certificates, setCertificates] = useState([]);
  const [activeKey, setActiveKey] = useState('Profile');
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState(null);
  const [showBlogModal, setShowBlogModal] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [selectedStory, setSelectedStory] = useState(null);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ show: false, type: '', id: null });
  const [products, setProducts] = useState([]);
  const router = useRouter();
  // console.log(stories)
  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      try {
        const res = await fetch(`/api/createArtisan/${artisanId}`);
        const artisan = await res.json();
        if (!artisan || artisan.message === 'Artisan not found') {
          setArtisan(null);
          setProducts([]);
          setPromotions([]);
          setBlogs([]);
          setStories([]);
          setSocialPlugin([]);
          setCertificates([]);
        } else {
          setArtisan(artisan);
          setProducts(Array.isArray(artisan.products) ? artisan.products : []);
          setPromotions(Array.isArray(artisan.promotions) ? artisan.promotions : []);
          setBlogs(Array.isArray(artisan.artisanBlogs) ? artisan.artisanBlogs : []);
          setStories(artisan.artisanStories ? artisan.artisanStories : null);
          setSocialPlugin(artisan.socialPlugin ? artisan.socialPlugin : null);
          setCertificates(Array.isArray(artisan.certificates) ? artisan.certificates : []);
        }
      } catch (e) {
        setArtisan(null);
        setProducts([]);
        setPromotions([]);
        setBlogs([]);
        setStories([]);
        setSocialPlugin([]);
        setCertificates([]);
      } finally {
        setLoading(false);
      }
    }
    if (artisanId) fetchAll();
  }, [artisanId]);
  const handleDelete = (type, id) => setDeleteModal({ show: true, type, id });
  const handleConfirmDelete = async () => {
    try {
      let deleted = false;
      if (deleteModal.type === 'promotion') {
        await fetch(`/api/promotion`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: deleteModal.id }) });
        setPromotions(promotions.filter(p => p._id !== deleteModal.id));
        deleted = true;
      } else if (deleteModal.type === 'blog') {
        await fetch(`/api/artisanBlog`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: deleteModal.id }) });
        setBlogs(blogs.filter(b => b._id !== deleteModal.id));
        deleted = true;
      } else if (deleteModal.type === 'story') {
        await fetch(`/api/artisanStory`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: deleteModal.id }) });
        setStories(stories.filter(s => s._id !== deleteModal.id));
        deleted = true;
      }
      else if (deleteModal.type === 'certificate') {
        await fetch(`/api/artisanCertificates`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: deleteModal.id }) });
        setCertificates(certificates.filter(c => c._id !== deleteModal.id));
        deleted = true;
      } else if (deleteModal.type === 'plugin') {
        await fetch(`/api/artisanPlugins`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: deleteModal.id }) });
        setSocialPlugin((prev) => Array.isArray(prev) ? prev.filter(p => p._id !== deleteModal.id) : null);
        deleted = true;
      }
      if (deleted) toast.success('Deleted successfully.');
    } catch (err) {
      toast.error('Failed to delete.');
    } finally {
      setDeleteModal({ show: false, type: '', id: null });
    }
  }
  const handleCancelDelete = () => setDeleteModal({ show: false, type: '', id: null });

  if (loading) return (
    <div className="flex flex-col items-center justify-center my-10">
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-lg text-gray-700 font-medium">Loading management details...</span>
      </div>
    </div>
  );
  if (!artisan) return (
    <div className="flex flex-col items-center justify-center my-10">
      <div className="text-center text-lg mb-2">Management not found.</div>
      <Button href="/admin/create_management" className="inline-block mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">Create New Management</Button>
    </div>
  );

  return (
    <div className="flex relative" style={{ minHeight: '85vh', background: '#f8f9fa', padding: '20px' }}>
      {/* Sidebar */}
      <div className="absolute -top-5 z-10 ">
        <button className='px-4 py-1 bg-gray-500 text-white rounded flex items-center' onClick={() => router.back()}>
          <ArrowLeftIcon className="w-4 h-4 mr-2" /> Back to View Management
        </button>
      </div>
      <div className="h-fit me-4" style={{ border: '1px solid #ced4da', borderRadius: '8px', background: '#fff', overflowY: 'auto', padding: '15px' }}>
        <div className="flex flex-col gap-2">
          {sectionTitles.map(section => (
            <div
              key={section}
              onClick={() => setActiveKey(section)}
              className={`text-center cursor-pointer px-4 py-3 rounded mb-2 transition-all font-medium ${activeKey === section ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-900'} hover:bg-blue-400`}
            >
              {section}
            </div>
          ))}
        </div>
      </div>
      {/* Main Content */}
      <div className="flex-1" style={{ border: '1px solid #ced4da', borderRadius: '8px', background: '#fff', padding: '20px', height: '100%', overflowY: 'auto' }}>
        <h2 className="mb-4 text-center text-xl" style={{ fontWeight: 600 }}>{activeKey}</h2>
        {/* Profile Section */}
        {activeKey === 'Profile' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div style={boxStyle}><b>Name: &nbsp;</b>{artisan.title} {artisan.firstName} {artisan.lastName}</div>
            <div style={boxStyle}><b>{artisan.fatherHusbandType || 'Father/Husband'}'s Name: &nbsp;</b> {artisan.fatherHusbandTitle} {artisan.fatherHusbandName} {artisan.fatherHusbandLastName}</div>
            <div style={boxStyle}><b>Management Number: &nbsp;</b> {artisan.artisanNumber || 'N/A'}</div>
            <div style={boxStyle}><b>SHG Name: &nbsp;</b> {artisan.shgName || 'N/A'}</div>
            <div style={boxStyle}><b>Mobile: &nbsp;</b> {artisan.contact?.callNumber || artisan.contact?.whatsappNumber || 'N/A'}</div>
            <div style={boxStyle}><b>Email: &nbsp;</b> {artisan.contact?.email || artisan.email || 'N/A'}</div>
            <div style={boxStyle}><b>Years of Experience: &nbsp;</b> {artisan.yearsOfExperience || 'N/A'}</div>
            <div style={boxStyle}><b>Specializations: &nbsp;</b> {artisan.specializations && artisan.specializations.length > 0 ? artisan.specializations.join(', ') : 'N/A'}</div>
            <div style={boxStyle}><b>Address: &nbsp;</b><span className="text-gray-600 pt-5 max-h-24 overflow-y-auto">{artisan.address ? artisan.address.fullAddress : 'N/A'}</span></div>
            <div style={boxStyle}><b>City: &nbsp;</b> {artisan.address?.city || 'N/A'}</div>
            <div style={boxStyle}><b>Pincode: &nbsp;</b> {artisan.address?.pincode || 'N/A'}</div>
            <div style={boxStyle}><b>State: &nbsp;</b> {artisan.address?.state || 'N/A'}</div>
            <div className="col-span-2 text-center"><div style={{ ...boxStyle, background: '#fff', display: 'flex', justifyContent: 'center' }}>
              {artisan.profileImage?.url ? (
                <img src={artisan.profileImage.url} alt="Artisan" style={{ maxWidth: '200px', maxHeight: '200px', borderRadius: '10px' }} />
              ) : (
                <div>No Image Available</div>
              )}
            </div></div>
          </div>
        )}
        {/* Promotions Section */}
        {activeKey === 'Promotions Reviews' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {promotions.length === 0 ? (
              <div className="col-span-3 text-center">No promotions found for this management.</div>
            ) : (
              promotions.map((promotion, idx) => (
                <div key={promotion._id || idx} className="relative bg-white rounded-xl shadow-lg p-6 flex flex-col items-start min-h-[260px]">
                  {/* Promotion Image */}
                  <img
                    src={promotion.image?.url || '/promotion-placeholder.png'}
                    alt={promotion.title || 'Promotion Image'}
                    style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px', marginBottom: '10px' }}
                    onError={e => { e.target.onerror = null; e.target.src = '/promotion-placeholder.png'; }}
                  />
                  {/* Title */}
                  <div className="font-bold text-lg mb-1">{promotion.title || 'Promotion'}</div>
                  {/* Short Description */}
                  <div className="text-gray-700 mb-2" style={{ flexGrow: 1, minHeight: '40px', maxHeight: '70px', overflowY: 'auto' }}>
                    {promotion.shortDescription || 'No description available.'}
                  </div>
                  {/* Rating at top-right */}
                  <div className="absolute top-4 right-4 bg-yellow-100 text-yellow-800 rounded-full px-3 py-1 text-xs font-bold shadow">
                    ⭐ {promotion.rating || 'N/A'}
                  </div>
                  {/* View, Delete Buttons */}
                  <div className="flex gap-2 mt-2 self-end">
                    <Button size="sm" variant="default" onClick={() => { setSelectedPromotion(promotion); setShowPromotionModal(true); }}>View</Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete('promotion', promotion._id)}>Delete</Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
        {/* Blogs Section */}
        {activeKey === 'Blog' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {blogs.length === 0 ? (
              <div className="col-span-3 text-center">No blogs found for this management.</div>
            ) : (
              blogs.map((blog, idx) => (
                <div key={blog._id || idx} className="relative bg-white rounded-xl shadow-lg p-6 flex flex-col items-start min-h-[260px]">
                  {/* Blog Image */}
                  <img
                    src={
                      blog.images?.[0]?.url ||
                      blog.images?.[0] ||
                      '/blog-placeholder.png'
                    }
                    alt={blog.title || 'Blog Image'}
                    style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px', marginBottom: '10px' }}
                    onError={e => { e.target.onerror = null; e.target.src = '/blog-placeholder.png'; }}
                  />
                  {/* Blog Title at top */}
                  <div className="font-semibold mb-1">{blog.title || 'Untitled Blog'}</div>
                  {/* Blog Snippet */}
                  <div className="text-gray-700 mb-2" style={{ flexGrow: 1, minHeight: '60px', maxHeight: '70px', overflowY: 'auto' }} dangerouslySetInnerHTML={{ __html: blog.shortDescription || 'No description available.' }} />
                  {/* View, Delete Buttons */}
                  <div className="flex gap-2 mt-2 self-end">
                    <Button size="sm" variant="default" onClick={() => { setSelectedBlog(blog); setShowBlogModal(true); }}>View</Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete('blog', blog._id)}>Delete</Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
        {/* Artisan Story Section */}
        {activeKey === 'Artisan Story' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stories ? (
              <div className="relative bg-white rounded-xl shadow-lg p-6 flex flex-col items-start min-h-[260px]">
                {/* Story Image */}
                <img
                  src={stories.images?.url || '/story-placeholder.png'}
                  alt={stories.title || 'Story Image'}
                  style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px', marginBottom: '10px' }}
                  onError={e => { e.target.onerror = null; e.target.src = '/story-placeholder.png'; }}
                />
                {/* Story Title at top */}
                <div className="font-semibold mb-1">{stories.title || 'Untitled Story'}</div>
                {/* Story Snippet */}
                <div className="text-gray-700 mb-2" style={{ flexGrow: 1, minHeight: '60px', maxHeight: '70px', overflowY: 'auto' }} dangerouslySetInnerHTML={{ __html: stories.shortDescription || 'No description available.' }} />
                {/* View, Delete Buttons */}
                <div className="flex gap-2 mt-2 self-end">
                  <Button size="sm" variant="default" onClick={() => { setSelectedStory(stories); setShowStoryModal(true); }}>View</Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete('story', stories._id)}>Delete</Button>
                </div>
              </div>
            ) : (
              <div className="col-span-3 text-center">No stories found for this management.</div>
            )}
          </div>
        )}
        {/* Social Plugins Section */}
        {activeKey === 'Social Plugins' && (
          <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
            <div style={boxStyle}>
              <b>Facebook: &nbsp;</b>
              <a href={socialPlugin?.facebook} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'underline' }}>
                {socialPlugin?.facebook || "Not Avaliable"}
              </a>
            </div>
            <div style={boxStyle}>
              <b>Instagram: &nbsp;</b>
              <a href={socialPlugin?.instagram} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'underline' }}>
                {socialPlugin?.instagram || "Not Avaliable"}
              </a>
            </div>
            <div style={boxStyle}>
              <b>Youtube: &nbsp;</b>
              <a href={socialPlugin?.youtube} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'underline' }}>
                {socialPlugin?.youtube || "Not Avaliable"}
              </a>
            </div>
            <div style={boxStyle}>
              <b>Google: &nbsp;</b>
              <a href={socialPlugin?.google} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'underline' }}>
                {socialPlugin?.google || "Not Avaliable"}
              </a>
            </div>
            <div style={boxStyle}>
              <b>Website: &nbsp;</b>
              <a href={socialPlugin?.website} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'underline' }}>
                {socialPlugin?.website || "Not Avaliable"}
              </a>
            </div>
          </div>
        )}
        {/*Certificates*/}
        {activeKey === 'Certificates' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(!certificates || certificates.length === 0) ? (
              <div className="text-center">No certificates found for this management.</div>
            ) : (
              certificates.map((cert, idx) => (
                <div key={cert._id || idx} className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center min-h-[220px]">
                  {/* Certificate Image */}
                  <img
                    src={cert.imageUrl || '/certificate-placeholder.png'}
                    alt={cert.title || 'Certificate Image'}
                    style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px', marginBottom: '10px' }}
                    onError={e => { e.target.onerror = null; e.target.src = '/certificate-placeholder.png'; }}
                  />
                  {/* Certificate Title */}
                  <div className="font-semibold text-lg mb-1 text-center">{cert.title || 'Certificate'}</div>
                  {/* Issuer and Date */}
                  <div className="text-gray-700 mb-2">{cert.issuedBy ? `Issued by: ${cert.issuedBy}` : '-'}</div>
                  <div className="text-gray-600 text-xs mb-2">{cert.issueDate ? `Date: ${cert.issueDate}` : ''}</div>
                  {/* Actions */}
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" variant="default" onClick={() => { setSelectedCertificate(cert); setShowCertificateModal(true); }}>View</Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete('certificate', cert._id)}>Delete</Button>
                  </div>
                </div>
              ))

            )}
          </div>
        )}

        {/* VIEW MODEL START */}

        {/* Promotion Modal */}
        {showPromotionModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40">
            <div className="bg-white rounded-lg p-8 max-w-lg w-full shadow-lg relative">
              <button className="absolute top-2 right-2 text-xl" onClick={() => setShowPromotionModal(false)}>×</button>
              <h3 className="mb-4 text-lg font-semibold">Promotion Details</h3>
              {selectedPromotion && (
                <div>
                  <div className="bg-white p-3 rounded border border-gray-200 shadow-md mb-2">
                    <div className="font-semibold text-gray-800">Title</div>
                    <div className="text-gray-600">{selectedPromotion.title || '-'}</div>
                  </div>
                  <div className="bg-white p-3 rounded border border-gray-200 shadow-md mb-2">
                    <div className="font-semibold text-gray-800">Rating</div>
                    <div className="text-gray-600">{selectedPromotion.rating || '-'}</div>
                  </div>
                  <div className="flex gap-2">
                    <div className="bg-white p-3 rounded border border-gray-200 shadow-md mb-2 w-1/2">
                      <div className="font-semibold text-gray-800">Created By</div>
                      <div className="text-gray-600">{selectedPromotion.createdBy || '-'}</div>
                    </div>
                    <div className="bg-white p-3 rounded border border-gray-200 shadow-md mb-2 w-1/2">
                      <div className="font-semibold text-gray-800">Date</div>
                      <div className="text-gray-600">
                        {selectedPromotion.date
                          ? (() => {
                            const d = new Date(Number(selectedPromotion.date));
                            const day = String(d.getDate()).padStart(2, '0');
                            const month = String(d.getMonth() + 1).padStart(2, '0');
                            const year = d.getFullYear();
                            return `${day}-${month}-${year}`;
                          })()
                          : '-'}
                      </div>
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded border border-gray-200 shadow-md mb-2">
                    <div className="font-semibold text-gray-800">Description</div>
                    <div className="text-gray-600">{selectedPromotion.shortDescription || '-'}</div>
                  </div>
                </div>
              )}
              <div className="flex justify-end mt-4">
                <Button variant="destructive" onClick={() => setShowPromotionModal(false)}>Close</Button>
              </div>
            </div>
          </div>
        )}
        {/* Blog Modal */}
        {showBlogModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40">
            <div className="bg-white rounded-lg p-8 max-w-lg w-full shadow-lg relative">
              <button className="absolute top-2 right-2 text-xl" onClick={() => setShowBlogModal(false)}>×</button>
              <h3 className="mb-4 text-lg font-semibold">Blog Details</h3>
              <div className="grid grid-cols-1 gap-4 mb-2">
                <div className="bg-white p-3 rounded border border-gray-200 shadow-md mb-2">
                  <div className="font-semibold text-gray-800">Blog Title</div>
                  <div className="text-gray-600">{selectedBlog.title}</div>
                </div>
                <div className="bg-white p-3 rounded border border-gray-200 shadow-md mb-2 ">
                  <div className="font-semibold text-gray-800">YouTube URL</div>
                  <div className="text-gray-600 break-all">
                    {selectedBlog.youtubeUrl ? (
                      <a
                        href={selectedBlog.youtubeUrl.startsWith('http') ? selectedBlog.youtubeUrl : `https://${selectedBlog.youtubeUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline hover:text-blue-800"
                      >
                        {selectedBlog.youtubeUrl}
                      </a>
                    ) : (
                      '-'
                    )}
                  </div>
                </div>
                <div className="bg-white p-3 rounded border border-gray-200 shadow-md mb-2">
                  <div className="font-semibold text-gray-800">Short Description</div>
                  <div className="text-gray-600">{selectedBlog.shortDescription || '-'}</div>
                </div>
                <div className="bg-white p-3 rounded border border-gray-200 shadow-md mb-2 max-h-24 overflow-y-auto">
                  <div className="font-semibold text-gray-800">Long Description</div>
                  <div className="text-gray-600 whitespace-pre-line">{selectedBlog.longDescription || '-'}</div>
                </div>
                <div className="bg-white p-3 rounded border border-gray-200 shadow-md mb-2 max-h-32 overflow-y-auto">
                  <div className="font-semibold text-gray-800">Images</div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {Array.isArray(selectedBlog.images) && selectedBlog.images.length > 0 ? (
                      selectedBlog.images.map((img, idx) => {
                        let url = typeof img === 'object' && img !== null ? img.url : img;
                        const key = (typeof img === 'object' && img !== null && img.key) ? img.key : (url ? url : idx);
                        // Only render if url is valid
                        if (typeof url !== 'string' || !url.trim() || url === 'undefined') {
                          return null;
                        }
                        return (
                          <img
                            key={key}
                            src={url}
                            alt={`Blog Image ${idx + 1}`}
                            className="w-28 h-20 object-cover rounded"
                            onError={e => { e.target.style.display = 'none'; }}
                          />
                        );
                      })
                    ) : (
                      <span className="text-gray-400">No images</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <Button variant="secondary" onClick={() => setShowBlogModal(false)}>Close</Button>
              </div>
            </div>

          </div>
        )}
        {/* Story Modal */}
        {showStoryModal && selectedStory && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40">
            <div className="bg-white rounded-lg p-8 max-w-lg w-full shadow-lg relative">
              <button className="absolute top-2 right-2 text-xl" onClick={() => setShowStoryModal(false)}>×</button>
              <h3 className="mb-4 text-lg font-semibold">Management Story Details</h3>
              <div className="grid grid-cols-1 gap-4 mb-2">
                <div className="bg-white p-3 rounded border border-gray-200 shadow-md mb-2">
                  <div className="font-semibold text-gray-800">Story Title</div>
                  <div className="text-gray-600">{selectedStory.title}</div>
                </div>
                <div className="bg-white p-3 rounded border border-gray-200 shadow-md mb-2">
                  <div className="font-semibold text-gray-800">Short Description</div>
                  <div className="text-gray-600">{selectedStory.shortDescription || '-'}</div>
                </div>
                <div className="bg-white p-3 rounded border border-gray-200 shadow-md mb-2 max-h-24 overflow-y-auto">
                  <div className="font-semibold text-gray-800">Long Description</div>
                  <div className="text-gray-600 whitespace-pre-line">{selectedStory.longDescription || '-'}</div>
                </div>
                <div className="bg-white p-3 rounded border border-gray-200 shadow-md mb-2 max-h-32 overflow-y-auto">
                  <div className="font-semibold text-gray-800">Images</div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedStory.images && selectedStory.images.url ? (
                      <img
                        src={selectedStory.images.url}
                        alt="Story Image"
                        className="w-28 h-20 object-cover rounded"
                        onError={e => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <span className="text-gray-400">No images</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <Button variant="secondary" onClick={() => setShowStoryModal(false)}>Close</Button>
              </div>
            </div>
          </div>
        )}
        {/* Certificates Modal */}
        {showCertificateModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40">
            <div className="bg-white rounded-lg p-8 max-w-md w-full shadow-lg relative">
              <button className="absolute top-2 right-2 text-xl" onClick={() => setShowCertificateModal(false)}>×</button>
              <h3 className="mb-4 text-lg font-semibold">Certificate Details</h3>
              {selectedCertificate && (
                <div>
                  <div className="bg-white p-3 rounded border border-gray-200 shadow-md mb-2">
                    <div className="font-semibold text-gray-800">Certificate Name</div>
                    <div className="text-gray-600">{selectedCertificate.title || '-'}</div>
                  </div>
                  <div className="bg-white p-3 rounded border border-gray-200 shadow-md mb-2">
                    <div className="font-semibold text-gray-800">Issued By</div>
                    <div className="text-gray-600">{selectedCertificate.issuedBy || '-'}</div>
                  </div>
                  <div className="flex gap-2">
                    <div className="bg-white p-3 rounded border border-gray-200 shadow-md mb-2 w-1/2">
                      <div className="font-semibold text-gray-800">Issued Date</div>
                      <div className="text-gray-600">{selectedCertificate.issueDate || 'N/A'}</div>
                    </div>
                    <div className="bg-white p-3 rounded border border-gray-200 shadow-md mb-2 w-1/2">
                      <div className="font-semibold text-gray-800">Specialization In</div>
                      <div className="text-gray-600">{selectedCertificate.description || 'N/A'}</div>
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded border border-gray-200 shadow-md mb-2 max-h-48 overflow-y-auto">
                    <div className="font-semibold text-gray-800">Images</div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedCertificate.imageUrl
                        ? (Array.isArray(selectedCertificate.imageUrl)
                          ? selectedCertificate.imageUrl
                          : [selectedCertificate.imageUrl]
                        ).map((url, idx) => (
                          typeof url === 'string' && url.trim() && url !== 'undefined' ? (
                            <img
                              key={url + idx}
                              src={url}
                              alt={`Certificate Image ${idx + 1}`}
                              className="w-28 h-20 object-cover rounded"
                              onError={e => { e.target.style.display = 'none'; }}
                            />
                          ) : null
                        ))
                        : <span className="text-gray-400">No images</span>
                      }
                    </div>
                  </div>
                </div>
              )}
              <div className="flex justify-end mt-4">
                <Button variant="destructive" onClick={() => setShowCertificateModal(false)}>Close</Button>
              </div>
            </div>
          </div>
        )}
        {/* Delete Modal */}
        {deleteModal.show && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40">
            <div className="bg-white rounded-lg p-8 max-w-md w-full shadow-lg relative">
              <button className="absolute top-2 right-2 text-xl" onClick={handleCancelDelete}>×</button>
              <h3 className="mb-4 text-lg font-semibold">Confirm Delete</h3>
              <div className="mb-4">Are you sure you want to delete this item?</div>
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={handleCancelDelete}>Cancel</Button>
                <Button variant="destructive" onClick={handleConfirmDelete}>Delete</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArtisanDashboard;