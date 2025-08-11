"use client";
import React, { useState, useRef, useEffect } from "react";
import { useCart } from "../context/CartContext";
import toast from "react-hot-toast";
import { Globe, Heart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Mail, Phone, Share2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import QuickViewProductCard from "./QuickViewProductCard";
import Autoplay from "embla-carousel-autoplay";
import BlogQuickViewModal from "./BlogQuickViewModal";
import { Star } from 'lucide-react';
import ReviewModal from "./ReviewModal";
const CertificateSectionCarousel = ({ certificates, onImageClick }) => {
  if (!certificates || certificates.length === 0) return <div className="text-gray-500 text-center">No certificates available.</div>;
  return (
    <div className="w-full py-5">
      <Carousel className="w-full">
        <CarouselContent className="w-full">
          {certificates.map((cert, idx) => (
            <CarouselItem key={cert._id} className="basis-full md:basis-1/2 flex justify-center">
              <div
                className="flex flex-col w-full max-w-3xl bg-white rounded-2xl overflow-hidden border border-gray-200"
                style={{ minHeight: 320 }}
              >
                {/* Image Section */}
                <div className="w-full flex items-center justify-center bg-gray-50">
                  <img
                    src={cert.imageUrl?.url || cert.imageUrl}
                    alt={cert.title}
                    className="object-cover w-full h-full max-h-72 rounded-none"
                    style={{ maxHeight: 200 }}
                    onClick={() => { onImageClick(cert); }}
                  />
                </div>
                {/* Info Section */}
                <div className="w-full flex flex-col items-start p-4 md:p-6">
                  <div className="font-bold text-xl md:text-2xl mb-2 text-gray-900">Name: {cert.title}</div>
                  {cert.issueDate && (
                    <div className="text-base text-gray-700 mb-1">
                      <span className="font-bold">Issue Date:</span> {cert.issueDate}
                    </div>
                  )}
                  {cert.issuedBy && (
                    <div className="text-base text-gray-700 mb-1">
                      <span className="font-bold">Issued By:</span> {cert.issuedBy}
                    </div>
                  )}
                  {cert.description && (
                    <div className="text-base text-gray-700 mb-1">
                      <span className="font-semibold">Specialization:</span> {cert.description}
                    </div>
                  )}
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="flex justify-end w-full mt-2">
          <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 p-5" />
          <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 p-5" />
        </div>
      </Carousel>
    </div>
  );
};

const ArtisanDetails = ({ artisan }) => {
  // console.log(artisan)
  const { addToCart, addToWishlist, removeFromWishlist, wishlist } = useCart();

  // ...existing state
  const [otherArtisans, setOtherArtisans] = useState([]);
  const [showBlogModal, setShowBlogModal] = useState(false);
  const [modalBlog, setModalBlog] = useState(null);
  const [modalCertificate, setModalCertificate] = useState(null);

  // Fetch other artisans (excluding current one)
  useEffect(() => {
    if (!artisan._id) return;
    fetch(`/api/createArtisan?exclude=${artisan._id}`)
      .then(res => res.json())
      .then(data => setOtherArtisans(data))
      .catch(err => setOtherArtisans([]));
  }, [artisan._id]);
  // console.log(artisan)
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [showShareBox, setShowShareBox] = useState(false);
  const [copied, setCopied] = useState(false);
  const shareBoxRef = useRef(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);
  const [artisanReviews, setArtisanReviews] = useState([]);
  // Handle closing share box on outside click or Escape
  useEffect(() => {
    if (!showShareBox) return;
    function handleClick(e) {
      if (shareBoxRef.current && !shareBoxRef.current.contains(e.target)) {
        setShowShareBox(false);
      }
    }
    function handleEsc(e) {
      if (e.key === 'Escape') setShowShareBox(false);
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [showShareBox]);

  // Copy URL handler
  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };
  // Prevent background scroll when Quick View is open
  useEffect(() => {
    if (quickViewProduct) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
    return () => document.body.classList.remove("overflow-hidden");
  }, [quickViewProduct]);

  const [showExpertModal, setShowExpertModal] = useState(false);

  // Form state
  const [expertForm, setExpertForm] = useState({
    name: '',
    email: '',
    phone: '',
    need: 'Pricing',
    question: '',
    contactMethod: 'Phone',
  });

  const handleExpertInputChange = (e) => {
    const { name, value, type } = e.target;
    setExpertForm((prev) => ({
      ...prev,
      [name]: type === 'radio' ? value : value,
    }));
  };

  const handleExpertSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...expertForm, type: 'management', artisanId: artisan._id, queryName: artisan.title + artisan.firstName + artisan.lastName };
      const res = await fetch('/api/askExpertsEnquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const error = await res.json();
        toast.error(error.message || 'Failed to submit your question.');
        return;
      }
      setShowExpertModal(false);
      setExpertForm({
        name: '',
        email: '',
        phone: '',
        need: 'Pricing',
        question: '',
        contactMethod: 'Phone',
      });
      toast.success('Your question has been submitted!');
    } catch (err) {
      toast.error('Failed to submit your question.');
    }
  };
  const [isExpanded, setIsExpanded] = useState(false);

  const fullText = artisan.artisanStories?.longDescription || "Long description";
  const wordLimit = 130;

  const getPreview = (text) => {
    const words = text.split(" ");
    if (words.length <= wordLimit) return text;
    return words.slice(0, wordLimit).join(" ") + "...";
  };


  // Add these state variables at the top of your component with other states
  const [customReviews, setCustomReviews] = useState([]);

  // Add this function to fetch custom reviews
  const fetchCustomReviews = async () => {
    if (!artisan?._id) return;

    try {
      setIsLoadingReviews(true);
      const response = await fetch(
        `/api/saveReviews?artisanId=${artisan._id}&type=artisan&approved=true&active=true`
      );
      const data = await response.json();

      if (response.ok) {
        setCustomReviews(data.reviews || []);
      }
    } catch (error) {
      // console.error('Error fetching custom reviews:', error);
      toast.error('Failed to load custom reviews');
      setCustomReviews([]);
    } finally {
      setIsLoadingReviews(false);
    }
  };

  // Add this useEffect to fetch reviews when component mounts or artisan changes
  useEffect(() => {
    fetchCustomReviews();
  }, [artisan?._id]);

  // Get direct artisan reviews from the artisan object
  const directReviews = Array.isArray(artisan?.promotions) ? artisan.promotions : [];

  // Combine with custom reviews
  const allArtisanReviews = [...directReviews, ...customReviews];

  // Normalize the reviews
  const normalizeReview = (review) => {
    return {
      _id: review._id?.toString(),
      rating: review.rating || 0,
      title: review.title || 'No Title',
      description: review.description || review.shortDescription || '',
      name: review.name || review.createdBy || 'Anonymous',
      date: review.date || review.createdAt,
      image: review.image?.url || review.thumb?.url || '/placeholder.jpeg',
      source: review.source || 'artisan' // 'direct' for artisan.reviews, 'custom' for API
    };
  };

  // Get normalized and sorted reviews
  const normalizedReviews = allArtisanReviews
    .map(normalizeReview)
    .sort((a, b) => {
      if (a.date && b.date) return new Date(b.date) - new Date(a.date);
      return (b._id || '').localeCompare(a._id || '');
    });

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-amber-50 to-white flex flex-col items-center px-2 md:px-0">
      {/* Top section: Image left, details right */}
      <div className="relative w-full overflow-visible mb-10">
        {/* Banner Background Image */}
        <div className="inset-0 h-[100px] md:h-[300px] w-full object-cover object-center brightness-100 z-0 overflow-hidden object-cover">
          <img src={artisan.artisanBanner?.image?.url || artisan.artisanBanner?.image || "/placeholder.jpeg"} className="w-full h-full object-cover brightness-100 " alt="Office" />
        </div>
        {/* Overlay Content */}
        <div className="relative bg-[##FCF7F1] w-full px-2 md:w-full justify-center mx-auto flex flex-col md:flex-row md:items-start items-center pt-0 px-0 pb-8">
          {/* Profile Image: Overlapping Banner */}
          <div className="hidden md:flex absoute flex-shrink-0 -mt-32 ml-12 mr-10">
            <div className="bg-white rounded-lg shadow-xl border-4 border-white overflow-hidden w-72 md:h-[350px] flex items-center justify-center">
              <img src={artisan.image || artisan.profileImage?.url || 'https://randomuser.me/api/portraits/men/32.jpg'} alt={artisan.firstName + ' ' + artisan.lastName} className="object-cover w-full h-full" />
            </div>
          </div>
          <div className="flex md:hidden flex-shrink-0 mx-auto">
            <div className="bg-white rounded-lg shadow-xl border-4 border-white overflow-hidden w-60 h-[250px] md:h-[300px] flex items-center justify-center">
              <img src={artisan.image || artisan.profileImage?.url || 'placeholder.jpeg'} alt={artisan.firstName + ' ' + artisan.lastName} className="object-cover w-full h-full" />
            </div>
          </div>
          {/* Details Card */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 mt-8 md:mt-8 md:ml-0 bg-transparent">
            <div className="flex flex-col gap-2 md:border-r-2 md:border-black px-2">
              <div className="text-md  font-bold leading-tight flex items-center">Name: <span className="text-md align-middle font-normal"> {artisan.title}{artisan.firstName} {artisan.lastName}</span></div>
              <div className="font-bold text-md flex items-center">SHG Name: <span className="font-normal text-md">{artisan.shgName || 'No SHG Name Avaiable'}</span></div>
              <div className="font-bold text-md flex items-center"> Artisan No: <span className="font-normal text-md">{artisan.artisanNumber || 'Artisan Number Not Available'}</span></div>
              <div className="text-md font-semibold text-black">{artisan.yearsOfExperience || '0'} Years of Experience</div>
              <div className="font-bold text-md mt-2">Specializations:</div>
              <div className="flex gap-3 flex-wrap mb-2 px-10">
                {(artisan.specializations || ['No Specializations']).map((spec, i) => (
                  <span key={i} className="bg-gray-200 rounded-full px-2 md:px-4 py-1 text-sm md:text-base font-semibold tracking-tight border border-gray-300">{spec}</span>
                ))}
              </div>
              {/* Social Icons Row */}
              <div className="flex items-center gap-2">
                <div className="font-bold text-md">Social:</div>
                {artisan.socialPlugin?.facebook && (
                  <a href={artisan.socialPlugin.facebook} target="_blank" rel="noopener noreferrer" title="Facebook">
                    <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-facebook-icon lucide-facebook"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
                  </a>
                )}
                {artisan.socialPlugin?.instagram && (
                  <a href={artisan.socialPlugin.instagram} target="_blank" rel="noopener noreferrer" title="Instagram">
                    <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-instagram-icon lucide-instagram"><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></svg>
                  </a>
                )}
                {artisan.socialPlugin?.youtube && (
                  <a href={artisan.socialPlugin.youtube} target="_blank" rel="noopener noreferrer" title="YouTube">
                    <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-youtube-icon lucide-youtube"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" /><path d="m10 15 5-3-5-3z" /></svg>
                  </a>
                )}
                {artisan.socialPlugin?.google && (
                  <a href={artisan.socialPlugin.google} target="_blank" rel="noopener noreferrer" title="Google">
                    <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="black" viewBox="0 0 24 24">
                      <path d="M21.35 11.1h-9.18v2.83h5.43c-.24 1.38-1.42 4.04-5.43 4.04-3.27 0-5.94-2.71-5.94-6.05s2.67-6.05 5.94-6.05c1.86 0 3.11.8 3.82 1.49l2.6-2.57C17.36 3.43 15.01 2.5 12 2.5 6.95 2.5 2.9 6.53 2.9 11.5S6.95 20.5 12 20.5c6.89 0 9.1-4.82 9.1-7.22 0-.48-.05-.8-.15-1.18z" />
                    </svg>
                  </a>
                )}

                {artisan.socialPlugin?.website && (
                  <a href={artisan.socialPlugin.website} target="_blank" rel="noopener noreferrer" title="Website">
                    <Globe />
                  </a>
                )}
              </div>
              <div className="md:hidden flex flex-col gap-2">
                <div className="font-bold mt-2 text-md">City: <span className="font-normal text-md">{artisan.address?.city || 'No City'}</span></div>
                <div className="font-bold mt-2 text-md">State: <span className="font-normal text-md">{artisan.address?.state || 'No State'}</span></div>
                <div className=" flex flex-col items-start gap-4 mt-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className='flex items-center gap-2 mt-2 mb-2'>
                      <h3 className="font-bold text-md">Share Profile:</h3>
                      {/* Email icon */}
                      {artisan.contact.email && (
                        <a href={`mailto:${artisan.contact?.email}`} className="text-gray-700 hover:text-emerald-600" title="Email">
                          <Mail size={25} />
                        </a>
                      )}
                      {/* Phone icon */}
                      {artisan.contact.callNumber && (
                        <a href={`tel:${artisan.contact?.callNumber}`} className="text-gray-700 hover:text-lime-600" title="Call">
                          <Phone size={25} />
                        </a>
                      )}
                      {artisan.contact?.whatsappNumber && (
                        <a
                          href={`https://wa.me/${artisan.contact.whatsappNumber}`}
                          className="text-gray-700 hover:text-lime-600 flex items-center "
                          title="WhatsApp"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <img src="/whatapp.png" alt="WhatsApp" width={35} height={35} style={{ display: 'inline', verticalAlign: 'middle' }} />
                        </a>
                      )}
                      {/* Share icon */}
                      <button
                        type="button"
                        className="text-gray-700 hover:text-orange-600 focus:outline-none relative"
                        title="Share profile"
                        onClick={() => setShowShareBox((prev) => !prev)}
                      >
                        <Share2 size={25} />
                      </button>
                      {/* Share box */}
                      {showShareBox && (
                        <div ref={shareBoxRef} className="absolute left-50 bottom-[100px] z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 flex items-center gap-2 animate-fade-in" style={{ minWidth: 260 }}>
                          <input
                            type="text"
                            readOnly
                            value={typeof window !== 'undefined' ? window.location.href : ''}
                            className="border px-2 py-1 rounded flex-1 text-gray-800 bg-gray-100 text-xs"
                            style={{ minWidth: 120 }}
                          />
                          <button
                            onClick={handleCopy}
                            className={`ml-2 p-1 rounded hover:bg-gray-200 transition ${copied ? 'bg-green-100' : ''}`}
                            title={copied ? 'Copied!' : 'Copy URL'}
                          >
                            <Copy size={18} className={copied ? 'text-green-600' : 'text-gray-700'} />
                          </button>
                          {copied && <span className="ml-2 text-green-600 text-xs font-semibold">Copied!</span>}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-center">
                    <button
                      className="bg-black text-white font-bold w-full px-10 py-2 rounded-md shadow hover:bg-gray-900 transition-all text-base"
                      onClick={() => setShowExpertModal(true)}
                    >
                      Ask An Expert
                    </button>
                  </div>
                  {/* Modal for Ask An Expert */}
                  {showExpertModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative animate-fade-in">
                        <button
                          className="absolute top-2 right-2 text-gray-500 hover:text-black text-4xl font-bold"
                          onClick={() => setShowExpertModal(false)}
                          aria-label="Close"
                        >
                          ×
                        </button>
                        <h2 className="text-xl font-bold mb-2 text-center">Ask An Expert</h2>
                        <form onSubmit={handleExpertSubmit} className="flex flex-col gap-4">
                          <div className="text-center text-gray-500 text-sm mb-2">We will follow up with you via email within 24–36 hours</div>
                          <hr className="" />
                          <div className="text-center text-base mb-2">Please answer the following questionnaire</div>
                          <input
                            type="text"
                            name="name"
                            value={expertForm.name}
                            onChange={handleExpertInputChange}
                            placeholder="Your Name"
                            className="border rounded px-3 py-2"
                            required
                          />
                          <input
                            type="email"
                            name="email"
                            value={expertForm.email}
                            onChange={handleExpertInputChange}
                            placeholder="Email Address"
                            className="border rounded px-3 py-2"
                            required
                          />
                          <input
                            type="text"
                            name="phone"
                            value={expertForm.phone}
                            onChange={handleExpertInputChange}
                            placeholder="Phone Number"
                            className="border rounded px-3 py-2"
                            required
                          />
                          <div className="flex flex-row gap-6 items-center mt-2">
                            <span className="text-sm">Do You Need</span>
                            <label className="flex items-center gap-1 text-sm">
                              <input
                                type="radio"
                                name="need"
                                value="Appointment"
                                checked={expertForm.need === 'Appointment'}
                                onChange={handleExpertInputChange}
                                required
                              /> Appointment
                            </label>
                            <label className="flex items-center gap-1 text-sm">
                              <input
                                type="radio"
                                name="need"
                                value="Business"
                                checked={expertForm.need === 'Business'}
                                onChange={handleExpertInputChange}
                                required
                              /> Business
                            </label>
                            <label className="flex items-center gap-1 text-sm">
                              <input
                                type="radio"
                                name="need"
                                value="Personal"
                                checked={expertForm.need === 'Personal'}
                                onChange={handleExpertInputChange}
                              /> Personal
                            </label>
                          </div>
                          <div>
                            <label className="block text-sm mb-1">What Can I Help You With Today?</label>
                            <textarea
                              name="question"
                              value={expertForm.question}
                              onChange={handleExpertInputChange}
                              placeholder="Describe your question or issue"
                              className="border rounded px-3 py-2 w-full h-24 "
                              rows={4}
                              required
                            />
                          </div>
                          <div className="mt-2">
                            <span className="block text-sm mb-1">How Would You Like Me To Contact You?</span>
                            <div className="flex flex-row gap-6">
                              <label className="flex items-center gap-1 text-sm">
                                <input
                                  type="radio"
                                  name="contactMethod"
                                  value="Phone"
                                  checked={expertForm.contactMethod === 'Phone'}
                                  onChange={handleExpertInputChange}
                                /> Phone
                              </label>
                              <label className="flex items-center gap-1 text-sm">
                                <input
                                  type="radio"
                                  name="contactMethod"
                                  value="Email"
                                  checked={expertForm.contactMethod === 'Email'}
                                  onChange={handleExpertInputChange}
                                /> Email
                              </label>
                              <label className="flex items-center gap-1 text-sm">
                                <input
                                  type="radio"
                                  name="contactMethod"
                                  value="Both"
                                  checked={expertForm.contactMethod === 'Both'}
                                  onChange={handleExpertInputChange}
                                /> Both
                              </label>
                            </div>
                          </div>
                          <button
                            type="submit"
                            className="bg-black text-white rounded px-6 py-2 font-bold hover:bg-gray-900 transition mt-2"
                          >
                            SEND QUESTION
                          </button>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="hidden md:flex flex-col gap-2">
              <div className="font-bold mt-2 text-md">City: <span className="font-normal text-md">{artisan.address?.city || 'No City'}</span></div>
              <div className="font-bold mt-2 text-md">State: <span className="font-normal text-md">{artisan.address?.state || 'No State'}</span></div>
              {/* <div className="font-bold mt-2 text-md w-44">Address: <span className="font-normal text-md">{artisan.address?.fullAddress || 'No Address'}</span></div> */}
              <div className="flex flex-col items-center gap-4 mt-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className='flex items-center gap-2 mt-2 mb-2'>
                    <h3 className="font-bold text-md">Share Profile:</h3>
                    {/* Email icon */}
                    {artisan.contact.email && (
                      <a href={`mailto:${artisan.contact?.email}`} className="text-gray-700 hover:text-emerald-600" title="Email">
                        <Mail size={25} />
                      </a>
                    )}
                    {/* Phone icon */}
                    {artisan.contact.callNumber && (
                      <a href={`tel:${artisan.contact?.callNumber}`} className="text-gray-700 hover:text-lime-600" title="Call">
                        <Phone size={25} />
                      </a>
                    )}
                    {artisan.contact?.whatsappNumber && (
                      <a
                        href={`https://wa.me/${artisan.contact.whatsappNumber}`}
                        className="text-gray-700 hover:text-lime-600 flex items-center "
                        title="WhatsApp"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <img src="/whatapp.png" alt="WhatsApp" width={35} height={35} style={{ display: 'inline', verticalAlign: 'middle' }} />
                      </a>
                    )}
                    {/* Share icon */}
                    <button
                      type="button"
                      className="text-gray-700 hover:text-orange-600 focus:outline-none relative"
                      title="Share profile"
                      onClick={() => setShowShareBox((prev) => !prev)}
                    >
                      <Share2 size={25} />
                    </button>
                    {/* Share box */}
                    {showShareBox && (
                      <div ref={shareBoxRef} className="absolute left-50 bottom-[100px] z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 flex items-center gap-2 animate-fade-in" style={{ minWidth: 260 }}>
                        <input
                          type="text"
                          readOnly
                          value={typeof window !== 'undefined' ? window.location.href : ''}
                          className="border px-2 py-1 rounded flex-1 text-gray-800 bg-gray-100 text-xs"
                          style={{ minWidth: 120 }}
                        />
                        <button
                          onClick={handleCopy}
                          className={`ml-2 p-1 rounded hover:bg-gray-200 transition ${copied ? 'bg-green-100' : ''}`}
                          title={copied ? 'Copied!' : 'Copy URL'}
                        >
                          <Copy size={18} className={copied ? 'text-green-600' : 'text-gray-700'} />
                        </button>
                        {copied && <span className="ml-2 text-green-600 text-xs font-semibold">Copied!</span>}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  <button
                    className="bg-black text-white font-bold w-full px-10 py-2 rounded-md shadow hover:bg-gray-900 transition-all text-base"
                    onClick={() => setShowExpertModal(true)}
                  >
                    Ask An Expert
                  </button>
                </div>
                {/* Modal for Ask An Expert */}
                {showExpertModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative animate-fade-in">
                      <button
                        className="absolute top-2 right-2 text-gray-500 hover:text-black text-4xl font-bold"
                        onClick={() => setShowExpertModal(false)}
                        aria-label="Close"
                      >
                        ×
                      </button>
                      <h2 className="text-xl font-bold mb-2 text-center">Ask An Expert</h2>
                      <form onSubmit={handleExpertSubmit} className="flex flex-col gap-4">
                        <div className="text-center text-gray-500 text-sm mb-2">We will follow up with you via email within 24–36 hours</div>
                        <hr className="" />
                        <div className="text-center text-base mb-2">Please answer the following questionnaire</div>
                        <input
                          type="text"
                          name="name"
                          value={expertForm.name}
                          onChange={handleExpertInputChange}
                          placeholder="Your Name"
                          className="border rounded px-3 py-2"
                          required
                        />
                        <input
                          type="email"
                          name="email"
                          value={expertForm.email}
                          onChange={handleExpertInputChange}
                          placeholder="Email Address"
                          className="border rounded px-3 py-2"
                          required
                        />
                        <input
                          type="text"
                          name="phone"
                          value={expertForm.phone}
                          onChange={handleExpertInputChange}
                          placeholder="Phone Number"
                          className="border rounded px-3 py-2"
                          required
                        />
                        <div className="flex flex-row gap-6 items-center mt-2">
                          <span className="text-sm">Do You Need</span>
                          <label className="flex items-center gap-1 text-sm">
                            <input
                              type="radio"
                              name="need"
                              value="Appointment"
                              checked={expertForm.need === 'Appointment'}
                              onChange={handleExpertInputChange}
                              required
                            /> Appointment
                          </label>
                          <label className="flex items-center gap-1 text-sm">
                            <input
                              type="radio"
                              name="need"
                              value="Business"
                              checked={expertForm.need === 'Business'}
                              onChange={handleExpertInputChange}
                              required
                            /> Business
                          </label>
                          <label className="flex items-center gap-1 text-sm">
                            <input
                              type="radio"
                              name="need"
                              value="Personal"
                              checked={expertForm.need === 'Personal'}
                              onChange={handleExpertInputChange}
                            /> Personal
                          </label>
                        </div>
                        <div>
                          <label className="block text-sm mb-1">What Can I Help You With Today?</label>
                          <textarea
                            name="question"
                            value={expertForm.question}
                            onChange={handleExpertInputChange}
                            placeholder="Describe your question or issue"
                            className="border rounded px-3 py-2 w-full h-24 "
                            rows={4}
                            required
                          />
                        </div>
                        <div className="mt-2">
                          <span className="block text-sm mb-1">How Would You Like Me To Contact You?</span>
                          <div className="flex flex-row gap-6">
                            <label className="flex items-center gap-1 text-sm">
                              <input
                                type="radio"
                                name="contactMethod"
                                value="Phone"
                                checked={expertForm.contactMethod === 'Phone'}
                                onChange={handleExpertInputChange}
                              /> Phone
                            </label>
                            <label className="flex items-center gap-1 text-sm">
                              <input
                                type="radio"
                                name="contactMethod"
                                value="Email"
                                checked={expertForm.contactMethod === 'Email'}
                                onChange={handleExpertInputChange}
                              /> Email
                            </label>
                            <label className="flex items-center gap-1 text-sm">
                              <input
                                type="radio"
                                name="contactMethod"
                                value="Both"
                                checked={expertForm.contactMethod === 'Both'}
                                onChange={handleExpertInputChange}
                              /> Both
                            </label>
                          </div>
                        </div>
                        <button
                          type="submit"
                          className="bg-black text-white rounded px-6 py-2 font-bold hover:bg-gray-900 transition mt-2"
                        >
                          SEND QUESTION
                        </button>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* My Story Section */}
      {artisan.artisanStories && (
        <div className="w-full max-w-7xl md:py-5 py-5 px-2 md:px-0">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 w-fit ">
            <span className='border-t-4 border-black'>
              My Story
            </span>
          </h2>
          <div className="mb-4 text-md text-justify font-medium">
            <span className="">{artisan.artisanStories?.shortDescription || 'No short description available.'}</span>
          </div>
          <div className="flex flex-col md:flex-row gap-8 items-center md:p-6 ">
            {/* Left: Image */}
            <div className="flex-shrink-0 w-full md:w-1/2 flex justify-center items-center">
              <img
                src={artisan.artisanStories?.images?.url || '/placeholder.jpeg'}
                alt="Artisan"
                className="rounded-2xl object-cover w-[500px] h-[500px] shadow-md"
              />
            </div>
            {/* Right: Detail Description */}
            <div className="w-1/2 flex flex-col h-full justify-between w-full">
              <div>
                <h3 className="text-xl md:text-2xl font-bold mb-2 underline">Detail Description</h3>
                <div className="text-md font-sans mb-5">
                  {artisan.artisanStories?.title || (
                    <>
                      {artisan.artisanStories?.title || "Story title"}
                    </>
                  )}
                </div>
                <div className="text-md font-sans mb-8 h-80 text-justify overflow-y-auto">
                  {isExpanded ? fullText : getPreview(fullText)}

                  {fullText.split(" ").length > wordLimit && (
                    <button
                      className="text-blue-600 font-semibold ml-2"
                      onClick={() => setIsExpanded(!isExpanded)}
                    >
                      {isExpanded ? "Show less" : "Read more"}
                    </button>
                  )}
                </div>

              </div>
              {/* Share Row */}
              <div className="flex flex-row items-center gap-6 border-t pt-4 mt-auto justify-end">
                <span className="text-xl font-bold">Share</span>
                {/* Share Link */}
                <button
                  className="hover:scale-110 transition p-1"
                  title="Copy profile link"
                  onClick={() => {
                    navigator.clipboard.writeText(typeof window !== 'undefined' ? window.location.href : '');
                    toast.success('Profile link copied!');
                  }}
                >
                  <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-share-2"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><path d="M8.59 13.51l6.83 3.98"></path><path d="M15.41 6.51l-6.82 3.98"></path></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Blogs Section */}
      {Array.isArray(artisan.artisanBlogs) && artisan.artisanBlogs.length > 0 && (
        <div className="w-full md:px-20 px-2 py-10 mb-5">
          <h3 className="text-2xl md:text-3xl font-bold mb-4 text-gray-800">
            <span className='border-t-4 border-black'>
              Blogs
            </span></h3>
          <div className="flex flex-col gap-6">
            {artisan.artisanBlogs.length === 0 && (
              <div className="text-gray-500 text-center">No blogs available.</div>
            )}
            {artisan.artisanBlogs && artisan.artisanBlogs?.length > 0 && artisan.artisanBlogs.reduce((rows, blog, idx) => {
              if (idx % 2 === 0) rows.push([blog]);
              else rows[rows.length - 1].push(blog);
              return rows;
            }, []).map((row, rowIdx) => (
              <div key={rowIdx} className="flex flex-col md:flex-row gap-6">
                {row.map((blog, colIdx) => {
                  const firstImage = Array.isArray(blog.images) && blog.images.length > 0 ? blog.images[0].url || blog.images[0] : undefined;
                  // Format date (assuming blog.date is ISO or similar)
                  let blogDate = '';
                  if (blog.date) {
                    const d = new Date(blog.date);
                    blogDate = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                  }
                  return (
                    <div
                      key={blog._id}
                      className="flex flex-col md:flex-row bg-[#FFF3C9] rounded-3xl shadow-md min-h-[220px] w-full md:w-1/2 overflow-hidden"
                    >
                      {/* Image section */}
                      <div className="flex-shrink-0 w-full md:w-2/5 flex items-center justify-center bg-[#E8A57B]">
                        {(() => {
                          // Prefer image if present, else youtubeUrl
                          let mediaUrl = undefined;
                          if (Array.isArray(blog.images) && blog.images?.length > 0) {
                            mediaUrl = blog.images[0].url || blog.images[0];
                          } else if (blog.youtubeUrl) {
                            mediaUrl = blog.youtubeUrl;
                          }

                          if (mediaUrl) {
                            // Check if it's a YouTube URL
                            if (/^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//.test(mediaUrl)) {
                              // Convert to embed URL
                              let embedUrl = mediaUrl;
                              if (embedUrl.includes('youtube.com/watch?v=')) {
                                const videoId = embedUrl.split('v=')[1].split('&')[0];
                                embedUrl = `https://www.youtube.com/embed/${videoId}`;
                              } else if (embedUrl.includes('youtu.be/')) {
                                const videoId = embedUrl.split('youtu.be/')[1].split(/[?&]/)[0];
                                embedUrl = `https://www.youtube.com/embed/${videoId}`;
                              }
                              return (
                                <div className="w-full h-full aspect-video rounded-l-3xl overflow-hidden flex items-center justify-center">
                                  <iframe
                                    src={embedUrl}
                                    title={blog.title}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    className="w-full h-full min-h-[160px] max-h-[220px] border-0"
                                  />
                                </div>
                              );
                            } else {
                              // Regular image
                              return (
                                <img
                                  src={mediaUrl}
                                  alt={blog.title}
                                  className="object-cover w-full h-full max-h-[220px] rounded-l-3xl"
                                />
                              );
                            }
                          } else {
                            // No image or video
                            return (
                              <div className="w-full h-full flex items-center justify-center bg-gray-200 rounded-l-3xl text-gray-400">
                                No Image
                              </div>
                            );
                          }
                        })()}
                      </div>
                      {/* Content section */}
                      <div className="flex flex-col justify-between p-6 flex-1">
                        <div>
                          {blogDate && (
                            <div className="text-xs font-semibold bg-black text-white inline-block px-3 py-1 rounded mb-2">{blogDate}</div>
                          )}
                          <div className="font-bold text-lg md:text-xl text-black mb-2 leading-snug">{blog.title || 'No title available.'}</div>
                          <div className="text-gray-800 text-base mb-4 line-clamp-3 min-h-[48px]">{blog.shortDescription || 'No description available.'}</div>
                        </div>
                        <div className="flex items-center mt-auto">
                          <button
                            onClick={() => { setModalBlog(blog); setShowBlogModal(true); }}
                            className="text-gray-700 font-semibold hover:underline flex items-center group transition focus:outline-none"
                          >
                            Read More  &gt;
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {/* If odd number of blogs, fill the row with an empty div for alignment */}
                {row.length === 1 && <div className="hidden md:block w-1/2"></div>}
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Certificate And Awards Section */}
      {Array.isArray(artisan.certificates) && artisan.certificates.length > 0 && (
        <div className="w-full md:px-20 py-10 px-2 mx-auto bg-[#FCF7F1]">
          <div className="w-full h-full md:h-[500px] mx-auto flex flex-col md:flex-row items-start justify-center px-5 py-1 gap-8">
            {/* Left Column: Text */}
            <div className="w-full md:w-1/2 flex flex-col justify-center gap-5 md:gap-10 h-full">
              <h2 className="text-2xl md:text-3xl font-bold mb-2 md:mt-10">
                <span className="border-t-4 border-black">
                  Certificate And Awards
                </span>
              </h2>
              <p className="text-gray-700 text-md text-justify leading-relaxed">
                We extend our heartfelt congratulations to you on the remarkable achievement of reaching your goal. Your dedication, skill, and unwavering commitment to excellence have truly set you apart. As an artisan, your work reflects not only your talent but also the passion and perseverance that define true craftsmanship. It is with great pride and admiration that we recognize your outstanding accomplishment. May this milestone be a stepping stone to even greater success in your journey. We are honored to celebrate this moment with you and look forward to your continued excellence.
              </p>
              <Link href="/contact" className="bg-black text-white py-3 px-6 my-2 rounded-lg font-semibold text-lg w-fit mb-6">Connect With Us</Link>
            </div>
            {/* Right Column: Certificate Grid */}
            <div className="w-full md:w-1/2 h-full flex flex-col items-center overflow-hidden">
              <CertificateSectionCarousel
                certificates={artisan.certificates}
                onImageClick={(cert) => { setModalCertificate(cert); }}
              />
            </div>
          </div>
        </div>
      )}
      {/* Meet Other Artisans Section */}
      <div className="w-full max-w-[90%] mx-auto py-10 md:py-20 mt-5">
        <div className="flex flex-col md:flex-row items-start gap-5 ">
          {/* Left: Heading and description */}
          <div className="flex-1 flex flex-col justify-center my-4 md:pr-8">
            <h2 className="text-2xl md:text-3xl font-bold text-start mb-2 uppercase">
              <span className="border-t-4 border-black">
                Meet Our Artisans
              </span>
            </h2>
            <h2 className="text-2xl font-bold mb-4">Celebrating the Art of Craftsmanship. Honoring the Hands That Shape Beauty</h2>
            <div className="text-md text-gray-700 mb-6">
              We are proud to recognize and celebrate your exceptional talent and dedication as a skilled handicraft artisan. Your ability to transform raw materials into beautiful, meaningful works of art speaks to your creativity, precision, and passion for the craft. Each piece you create is a testament to the enduring value of handmade artistry and the cultural richness it preserves. With deep appreciation, we commend you for achieving this milestone and look forward to witnessing your continued journey of artistic excellence.
            </div>
          </div>
          {/* Right: Top 2 artisan cards in new style */}
          <div className="hidden md:flex flex-row  gap-4 justify-end">
            {(otherArtisans && otherArtisans.slice(0, 2).map((item, idx) => {
              const card = {
                id: item._id || idx,
                slug: item.slug,
                name: `${item.title ? item.title + " " : ""}${item.firstName || ''} ${item.lastName || ''}`.trim() || "Unknown Artisan",
                date: item.createdAt ? new Date(item.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase() : "N/A",
                image: item.profileImage?.url || item.image || "/bg-custom-1.jpg",
                title: item.specializations && item.specializations.length > 0 ? item.specializations.join(", ") : "Artisan",
                subtitle: item.shgName || "",
                experience: item.yearsOfExperience ? `${item.yearsOfExperience} years experience` : "",
                location: item.address ? `${item.address.city}, ${item.address.state}` : "",
                socials: [
                  {
                    icon: (
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-facebook-icon lucide-facebook"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
                    ), url: item.socialPlugin?.facebook || "#"
                  },
                  {
                    icon: (
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-instagram-icon lucide-instagram"><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></svg>
                    ), url: item.socialPlugin?.instagram || "#"
                  },
                  {
                    icon: (
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-youtube-icon lucide-youtube"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" /><path d="m10 15 5-3-5-3z" /></svg>
                    ), url: item.socialPlugin?.youtube || "#"
                  },
                  {
                    icon: (
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="black" viewBox="0 0 24 24">
                        <path d="M21.35 11.1h-9.18v2.83h5.43c-.24 1.38-1.42 4.04-5.43 4.04-3.27 0-5.94-2.71-5.94-6.05s2.67-6.05 5.94-6.05c1.86 0 3.11.8 3.82 1.49l2.6-2.57C17.36 3.43 15.01 2.5 12 2.5 6.95 2.5 2.9 6.53 2.9 11.5S6.95 20.5 12 20.5c6.89 0 9.1-4.82 9.1-7.22 0-.48-.05-.8-.15-1.18z" />
                      </svg>
                    ), url: item.socialPlugin?.google || "#"
                  },
                  {
                    icon: (
                      <Globe />
                    ), url: item.socialPlugin?.website || "#"
                  },
                ],
              };
              return (
                <div key={card.id} className="relative rounded-2xl overflow-hidden shadow-md group transition-all h-full  w-[340px]  flex flex-col bg-[#fbeff2] ">
                  {/* Date Badge */}
                  <div className="absolute top-5 left-5 z-20 flex items-center gap-2">
                    <span className="bg-white rounded px-3 py-1 text-md font-bold shadow text-gray-800">{card.subtitle}</span>
                  </div>
                  {/* Card Image */}
                  <div className="relative w-full h-96">
                    <img
                      src={card.image}
                      alt={card.name}
                      className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                  {/* Card Content Overlay */}
                  <div className="absolute left-0 bottom-0 w-full flex justify-between items-end p-6 bg-gradient-to-t from-black/70 via-black/30 to-transparent">
                    <div>
                      <Link
                        href={`/artisan/${card.slug}`}
                        className="font-bold text-2xl text-white mb-3 leading-tight drop-shadow-md hover:underline hover:decoration-2 hover:underline-offset-4 transition cursor-pointer"
                        title={card.name}
                      >
                        {card.name}
                      </Link>
                      <div className="text-md text-white drop-shadow-md">{card.title}</div>
                    </div>
                    {/* Arrow Button with Socials on Hover */}
                    <div className="relative group/arrow">
                      <button className="bg-white text-black rounded-full w-12 h-12 flex items-center justify-center shadow transition group-hover/arrow:bg-[#e84393] group-hover/arrow:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                      {/* Social Icons: show on arrow hover */}
                      <div className="absolute bottom-12 right-0 flex flex-col gap-4 opacity-0 group-hover/arrow:opacity-100 transition-opacity duration-300 z-30 items-center">
                        {card.socials.slice(0, 6).map((s, i) => (
                          <a
                            key={i}
                            href={s.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`
                              bg-white rounded-full w-12 h-12 flex items-center justify-center shadow hover:bg-gray-100 transition
                              transform translate-y-5 group-hover/arrow:translate-y-0
                              `}
                            style={{
                              transitionProperty: 'transform, opacity, background-color, box-shadow',
                              transitionDuration: '0.6s',
                              transitionTimingFunction: 'cubic-bezier(0.4,0,0.2,1)',
                              transitionDelay: `${i * 60}ms`
                            }}
                          >
                            {s.icon}
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            }))}
          </div>
        </div>
        {/* Carousel for remaining artisans in new style */}
        {otherArtisans && otherArtisans.length > 2 && (
          <div className="hidden md:flex mt-10">
            <Carousel className="w-full">
              <CarouselContent className="flex gap-6">
                {otherArtisans.slice(2).map((item, idx) => {
                  const card = {
                    id: item._id || idx,
                    slug: item.slug,
                    name: `${item.title ? item.title + " " : ""}${item.firstName || ''} ${item.lastName || ''}`.trim() || "Unknown Artisan",
                    date: item.createdAt ? new Date(item.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase() : "N/A",
                    image: item.profileImage?.url || item.image || "/bg-custom-1.jpg",
                    title: item.specializations && item.specializations.length > 0 ? item.specializations.join(", ") : "Artisan",
                    subtitle: item.shgName || "",
                    experience: item.yearsOfExperience ? `${item.yearsOfExperience} years experience` : "",
                    location: item.address ? `${item.address.city}, ${item.address.state}` : "",
                    socials: [
                      {
                        icon: (
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-facebook-icon lucide-facebook"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
                        ), url: item.socialPlugin?.facebook || "#"
                      },
                      {
                        icon: (
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-instagram-icon lucide-instagram"><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></svg>
                        ), url: item.socialPlugin?.instagram || "#"
                      },
                      {
                        icon: (
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-youtube-icon lucide-youtube"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" /><path d="m10 15 5-3-5-3z" /></svg>
                        ), url: item.socialPlugin?.youtube || "#"
                      },
                      {
                        icon: (
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="black" viewBox="0 0 24 24">
                            <path d="M21.35 11.1h-9.18v2.83h5.43c-.24 1.38-1.42 4.04-5.43 4.04-3.27 0-5.94-2.71-5.94-6.05s2.67-6.05 5.94-6.05c1.86 0 3.11.8 3.82 1.49l2.6-2.57C17.36 3.43 15.01 2.5 12 2.5 6.95 2.5 2.9 6.53 2.9 11.5S6.95 20.5 12 20.5c6.89 0 9.1-4.82 9.1-7.22 0-.48-.05-.8-.15-1.18z" />
                          </svg>
                        ), url: item.socialPlugin?.google || "#"
                      },
                      {
                        icon: (
                          <Globe />
                        ), url: item.socialPlugin?.website || "#"
                      },
                    ],
                  };
                  return (
                    <CarouselItem key={card.id} className="pl-5 md:basis-1/2 lg:basis-1/4 min-w-0 snap-start">
                      <div className="relative rounded-2xl overflow-hidden shadow-md group transition-all h-full flex flex-col bg-[#fbeff2]">
                        {/* Date Badge */}
                        <div className="absolute top-5 left-5 z-20 flex items-center gap-2">
                          <span className="bg-white rounded px-3 py-1 text-md font-bold shadow text-gray-800">{card.subtitle}</span>
                        </div>
                        {/* Card Image */}
                        <div className="relative w-full h-96">
                          <img
                            src={card.image}
                            alt={card.name}
                            className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                            style={{ objectFit: 'cover' }}
                          />
                        </div>
                        {/* Card Content Overlay */}
                        <div className="absolute left-0 bottom-0 w-full flex justify-between items-end p-6 bg-gradient-to-t from-black/70 via-black/30 to-transparent">
                          <div>
                            <Link
                              href={`/artisan/${card.slug}`}
                              className="font-bold text-2xl text-white mb-3 leading-tight drop-shadow-md hover:underline hover:decoration-2 hover:underline-offset-4 transition cursor-pointer"
                              title={card.name}
                            >
                              {card.name}
                            </Link>
                            <div className="text-md text-white drop-shadow-md">{card.title}</div>
                          </div>
                          {/* Arrow Button with Socials on Hover */}
                          <div className="relative group/arrow">
                            <button className="bg-white text-black rounded-full w-12 h-12 flex items-center justify-center shadow transition group-hover/arrow:bg-[#e84393] group-hover/arrow:text-white">
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                            {/* Social Icons: show on arrow hover */}
                            <div className="absolute bottom-14 right-0 flex flex-col gap-4 opacity-0 group-hover/arrow:opacity-100 transition-opacity duration-300 z-30 items-center">
                              {card.socials.slice(0, 6).map((s, i) => (
                                <a
                                  key={i}
                                  href={s.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`
                                    bg-white rounded-full w-12 h-12 flex items-center justify-center shadow hover:bg-gray-100 transition
                                    transform translate-y-5 group-hover/arrow:translate-y-0
                                  `}
                                  style={{
                                    transitionProperty: 'transform, opacity, background-color, box-shadow',
                                    transitionDuration: '0.6s',
                                    transitionTimingFunction: 'cubic-bezier(0.4,0,0.2,1)',
                                    transitionDelay: `${i * 60}ms`
                                  }}
                                >
                                  {s.icon}
                                </a>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CarouselItem>
                  );
                })}
              </CarouselContent>
              <div className="flex items-center gap-3 mt-4 justify-center">
                <CarouselPrevious className="bg-[#f7eedd] !rounded-full !w-12 !h-12 !flex !items-center !justify-center transition" />
                <CarouselNext className="bg-[#f7eedd] !rounded-full !w-12 !h-12 !flex !items-center !justify-center transition" />
              </div>
            </Carousel>
          </div>
        )}
        {otherArtisans && otherArtisans.length > 1 && (
          <div className="md:hidden mt-10">
            <Carousel className="w-full">
              <CarouselContent className="flex gap-6">
                {otherArtisans.map((item, idx) => {
                  const card = {
                    id: item._id || idx,
                    slug: item.slug,
                    name: `${item.title ? item.title + " " : ""}${item.firstName || ''} ${item.lastName || ''}`.trim() || "Unknown Artisan",
                    date: item.createdAt ? new Date(item.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase() : "N/A",
                    image: item.profileImage?.url || item.image || "/bg-custom-1.jpg",
                    title: item.specializations && item.specializations.length > 0 ? item.specializations.join(", ") : "Artisan",
                    subtitle: item.shgName || "",
                    experience: item.yearsOfExperience ? `${item.yearsOfExperience} years experience` : "",
                    location: item.address ? `${item.address.city}, ${item.address.state}` : "",
                    socials: [
                      {
                        icon: (
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-facebook-icon lucide-facebook"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
                        ), url: item.socialPlugin?.facebook || "#"
                      },
                      {
                        icon: (
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-instagram-icon lucide-instagram"><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></svg>
                        ), url: item.socialPlugin?.instagram || "#"
                      },
                      {
                        icon: (
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-youtube-icon lucide-youtube"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" /><path d="m10 15 5-3-5-3z" /></svg>
                        ), url: item.socialPlugin?.youtube || "#"
                      },
                      {
                        icon: (
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="black" viewBox="0 0 24 24">
                            <path d="M21.35 11.1h-9.18v2.83h5.43c-.24 1.38-1.42 4.04-5.43 4.04-3.27 0-5.94-2.71-5.94-6.05s2.67-6.05 5.94-6.05c1.86 0 3.11.8 3.82 1.49l2.6-2.57C17.36 3.43 15.01 2.5 12 2.5 6.95 2.5 2.9 6.53 2.9 11.5S6.95 20.5 12 20.5c6.89 0 9.1-4.82 9.1-7.22 0-.48-.05-.8-.15-1.18z" />
                          </svg>
                        ), url: item.socialPlugin?.google || "#"
                      },
                      {
                        icon: (
                          <Globe />
                        ), url: item.socialPlugin?.website || "#"
                      },
                    ],
                  };
                  return (
                    <CarouselItem key={card.id} className="pl-5 md:basis-1/2 lg:basis-1/4 min-w-0 snap-start">
                      <div className="relative rounded-2xl overflow-hidden shadow-md group transition-all h-full flex flex-col bg-[#fbeff2]">
                        {/* Date Badge */}
                        <div className="absolute top-5 left-5 z-20 flex items-center gap-2">
                          <span className="bg-white rounded px-3 py-1 text-md font-bold shadow text-gray-800">{card.subtitle}</span>
                        </div>
                        {/* Card Image */}
                        <div className="relative w-full h-96">
                          <img
                            src={card.image}
                            alt={card.name}
                            className="object-cover w-full h-full"
                            style={{ objectFit: 'cover' }}
                          />
                        </div>
                        {/* Card Content Overlay */}
                        <div className="absolute left-0 bottom-0 w-full flex justify-between items-end p-6 bg-gradient-to-t from-black/70 via-black/30 to-transparent">
                          <div>
                            <Link
                              href={`/artisan/${card.slug}`}
                              className="font-bold text-2xl text-white mb-3 leading-tight drop-shadow-md hover:underline hover:decoration-2 hover:underline-offset-4 transition cursor-pointer"
                              title={card.name}
                            >
                              {card.name}
                            </Link>
                            <div className="text-md text-white drop-shadow-md">{card.title}</div>
                          </div>
                          {/* Arrow Button with Socials on Hover */}
                          <div className="relative group/arrow">
                            <button className="bg-white text-black rounded-full w-12 h-12 flex items-center justify-center shadow transition group-hover/arrow:bg-[#e84393] group-hover/arrow:text-white">
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                            {/* Social Icons: show on arrow hover */}
                            <div className="absolute bottom-14 right-0 flex flex-col gap-4 opacity-0 group-hover/arrow:opacity-100 transition-opacity duration-300 z-30 items-center">
                              {card.socials.slice(0, 6).map((s, i) => (
                                <a
                                  key={i}
                                  href={s.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`
                                    bg-white rounded-full w-12 h-12 flex items-center justify-center shadow hover:bg-gray-100 transition
                                    transform translate-y-5 group-hover/arrow:translate-y-0
                                  `}
                                  style={{
                                    transitionProperty: 'transform, opacity, background-color, box-shadow',
                                    transitionDuration: '0.6s',
                                    transitionTimingFunction: 'cubic-bezier(0.4,0,0.2,1)',
                                    transitionDelay: `${i * 60}ms`
                                  }}
                                >
                                {s.icon}
                                </a>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CarouselItem>
                  );
                })}
              </CarouselContent>
              <div className="flex items-center gap-3 mt-4 justify-center">
                <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 p-5 " />
                <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 p-5" />
              </div>
            </Carousel>
          </div>
        )}
      </div>
      {/* Reviews Section */}
      {Array.isArray(normalizedReviews) && normalizedReviews.length > 0 && (
        <div className="w-full mx-auto relative py-10 md:min-h-[600px] flex items-center justify-end md:px-0">
          {/* Background Image */}
          <div className="hidden md:flex absolute inset-0 w-full h-full z-0">
            <img
              src="/blogs.jpg"
              alt="Happy client"
              className="w-full h-full object-cover bg-[#FCEED5]"
              style={{ objectPosition: 'top' }}
            />
          </div>

          {/* Review Card Overlay */}
          <div className="hidden md:flex flex flex-col justify-start w-full items-end ">
            <div className="button px-10 mb-2">
              <Button className="bg-white text-black hover:bg-black hover:text-white transition-colors duration-300" onClick={() => setShowReviewModal(true)}>Write Reviews</Button>
            </div>
            <Carousel className="w-full md:w-[600px]"
              plugins={[Autoplay({ delay: 4000 })]}>

              <CarouselContent className="w-full">
                {normalizedReviews.map((review) => (
                  <CarouselItem
                    key={review._id}
                    className="min-w-0 snap-center w-full"
                  >
                    <div className="bg-white rounded-3xl px-8 py-5 flex flex-col justify-between h-full min-h-[320px] relative overflow-visible">
                      {/* Review text */}
                      <div className="text-md md:text-2xl text-gray-800 font-bold leading-relaxed my-4 flex-wrap text-left">
                        {review.title || 'No review text.'}
                      </div>
                      <div className="text-md md:text-md text-gray-800 font-medium leading-relaxed mb-2 text-left">
                        {review.description || 'No review text.'}
                      </div>

                      {/* Bottom row: avatar, name, subtitle */}
                      <div className="flex items-center justify-between w-full mt-auto">
                        <div className="flex items-center">
                          <img
                            src={review.image || "/placeholder-user.jpg"}
                            alt={review.createdBy || 'Anonymous'}
                            className="w-14 h-14 rounded-full border-4 border-white shadow object-cover"
                          />
                          <div className="ml-4 text-left flex flex-col items-center gap-2">
                            <div className="font-bold text-xl text-black">{review.createdBy || review.title || 'Anonymous'}</div>

                            <div className="flex items-center gap-1">
                              {review.rating && (
                                <>
                                  {[...Array(review.rating)].map((_, i) => (
                                    <Star key={i} size={15} className="text-yellow-400 fill-yellow-400" />
                                  ))}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="flex items-center gap-3">
                <CarouselPrevious className="absolute top-[85%] left-[65%] bg-[#f7eedd] !rounded-full !w-12 !h-12 !flex !items-center !justify-center transition" />
                <CarouselNext className="absolute top-[85%] left-[80%] bg-[#f7eedd] !rounded-full !w-12 !h-12 !flex !items-center !justify-center transition" />

              </div>
            </Carousel>
          </div>
          {/* Review Card Overlay */}
          <div className="md:hidden py-10 flex flex-col justify-start w-full items-start bg-[#FCF7F1]">
            <h3 className="text-2xl font-bold mb-4 px-2 text-gray-800">
              <span className='border-t-4 border-black '>
                Review Section
              </span></h3>
            <Carousel className="w-full"
              plugins={[Autoplay({ delay: 4000 })]}>
              <div className="button px-5 mb-2">
                <Button className="bg-white text-black hover:bg-black hover:text-white transition-colors duration-300" onClick={() => setShowReviewModal(true)}>Write Reviews</Button>
              </div>
              <CarouselContent className="w-full pl-5">
                {normalizedReviews.map((review) => (
                  <CarouselItem
                    key={review._id}
                    className="min-w-0 snap-center w-full"
                  >
                    <div className="bg-white rounded-3xl px-8 py-5 flex flex-col justify-between h-[350px] relative overflow-visible">
                      {/* Review text */}
                      <div className="text-md text-gray-800 font-bold leading-relaxed mb-2 text-left">
                        {review.title || 'No review text.'}
                      </div>
                      <div className="text-sm md:text-md text-gray-800 font-medium leading-relaxed mb-2 text-left">
                        {review.description || 'No review text.'}
                      </div>

                      {/* Bottom row: avatar, name, subtitle */}
                      <div className="flex items-center justify-between w-full mt-auto">
                        <div className="flex items-center">
                          <img
                            src={review.image || "/placeholder.jpeg"}
                            alt={review.createdBy || 'Anonymous'}
                            className="w-14 h-14 rounded-full border-4 border-white shadow object-cover object-top"
                          />
                          <div className="ml-4 text-left flex flex-col items-center gap-2">
                            <div className="font-bold text-sm text-black">{review.createdBy || review.title || 'Anonymous'}</div>

                            <div className="flex items-center gap-1">
                              {review.rating && (
                                <>
                                  {[...Array(review.rating)].map((_, i) => (
                                    <Star key={i} size={15} className="text-yellow-400 fill-yellow-400" />
                                  ))}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>

              <div className="flex items-center gap-3">
              <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 p-5 " />
              <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 p-5" />
              </div>
            </Carousel>
          </div>
        </div>
      )}
      {/* Quick View Modal */}
      {quickViewProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setQuickViewProduct(null)}>
          <div className="bg-white rounded-2xl shadow-xl mx-auto md:max-w-4xl w-full relative overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
            {/* Close Button */}
            <button
              className="absolute top-4 right-4 text-2xl font-bold text-gray-500 z-50 rounded-full w-8 h-8 border border-black bg-black text-white flex items-center justify-center hover:bg-gray-100 hover:text-black focus:outline-none"
              onClick={() => setQuickViewProduct(null)}
              aria-label="Close quick view"
            >
              &times;
            </button>
            <QuickViewProductCard product={quickViewProduct} onClose={() => setQuickViewProduct(null)} />
          </div>
        </div>
      )}
      {/* Blog Quick View Modal */}
      <BlogQuickViewModal
        open={showBlogModal}
        blog={modalBlog}
        onClose={() => { setShowBlogModal(false); setModalBlog(null); }}
      />
      <ReviewModal
        open={showReviewModal}
        artisan={artisan}
        type="artisan"
        onClose={() => setShowReviewModal(false)}
        onSubmit={(data) => {
          setShowReviewModal(false);
          // fetchArtisanReviews(); // Refresh reviews after submission
          toast.success('Thank you for your review! It will be visible after approval.');
        }}
      />
    </div >
  );
};

export default ArtisanDetails;