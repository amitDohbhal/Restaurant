"use client"
import React from 'react'
import Link from "next/link";
import { useEffect, useState } from "react"
import ViewNews from "./ViewNews";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";
import { Button } from "./ui/button";
import { Star } from 'lucide-react';
import ReviewModal from "./ReviewModal";
import toast from "react-hot-toast"
const InstaBlog = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [blogs, setBlogs] = useState([]);
    const [isBlogsLoading, setIsBlogsLoading] = useState(true);
    const [instagramPosts, setInstagramPosts] = useState([]);
    const [isInstaLoading, setIsInstaLoading] = useState(true);
    const [facebookPosts, setFacebookPosts] = useState([]);
    const [isFbLoading, setIsFbLoading] = useState(true);
    const [news, setNews] = useState([])
    const [quickViewNews, setQuickViewNews] = useState(null); // For news modal
    const [selectedArtisan, setSelectedArtisan] = useState(null); // For news modal
    const [artisanReviews, setArtisanReviews] = useState([]);
    const [isLoadingReviews, setIsLoadingReviews] = useState(true);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [customReview, setcustomReview] = useState([]);
    const [allReviews, setAllReviews] = useState([]);
    const [loadingPromotions, setIsLoadingPromotions] = useState(true);

    // State and effect for fetching all reviews

    const allArtisanReviews = [...artisanReviews, ...allReviews];
    // console.log(allArtisanReviews)


    // Normalize reviews to a standard format
    function normalizeReview(review) {
        // console.log('Raw review data:', review);

        let imageUrl = '';
        if (review.thumb?.url) {
            imageUrl = review.thumb.url.startsWith('http') ? review.thumb.url : `https:${review.thumb.url}`;
        } else if (review.image?.url) {
            imageUrl = review.image.url.startsWith('http') ? review.image.url : `https:${review.image.url}`;
        } else if (review.thumb) {
            imageUrl = review.thumb.startsWith('http') ? review.thumb : `https:${review.thumb}`;
        } else if (review.image) {
            imageUrl = review.image.startsWith('http') ? review.image : `https:${review.image}`;
        } else {
            imageUrl = '/placeholder.jpeg';
        }

        // console.log('Processed Image URL:', imageUrl);

        return {
            _id: review._id?.toString(),
            rating: review.rating || 5,
            title: review.title || review.name || 'No Title',
            shortDescription: review.description || review.shortDescription || '',
            image: imageUrl,
            thumb: imageUrl, // Add thumb for backward compatibility
            createdBy: review.name || review.title || 'Anonymous',
            date: review.date ? new Date(review.date).toLocaleDateString() : ''
        };
    }

    const normalizedReviews = allArtisanReviews.map(normalizeReview).sort((a, b) => {
        // Sort by date if available, otherwise by ID
        if (a.date && b.date) return new Date(b.date) - new Date(a.date);
        return (b._id || '').localeCompare(a._id || '');
    });

    const fetchBlogs = async () => {
        try {
            const res = await fetch("/api/blogs");
            const data = await res.json();
            // console.log(data);
            if (Array.isArray(data)) {
                setBlogs(data);
            } else if (Array.isArray(data.blogs)) {
                setBlogs(data.blogs);
            } else {
                setBlogs([]);
            }
        } catch (error) {
            // console.error("Error fetching blogs:", error);
            setBlogs([]);
        } finally {
            setIsBlogsLoading(false);
        }
    };
    const fetchNews = async () => {
        try {
            const res = await fetch("/api/addNews");
            const data = await res.json();
            // console.log("News API response:", data);
            if (data && data.length > 0) {
                setNews(data);
            } else {
                setNews([]);
            }
        } catch (error) {
            // console.error("Error fetching products:", error);
            setNews([]);
        } finally {
            setIsLoading(false);
        }
    };
    const fetchFacebookPosts = async () => {
        try {
            const res = await fetch("/api/facebook-posts");
            const data = await res.json();
            // console.log(data);
            setFacebookPosts(data);
        } catch (error) {
            setFacebookPosts([]);
        } finally {
            setIsFbLoading(false);
        }
    };
    const fetchInstagramPosts = async () => {
        try {
            const res = await fetch("/api/instagram-posts");
            const data = await res.json();
            // console.log(data);
            setInstagramPosts(data);
        } catch (error) {
            setInstagramPosts([]);
        } finally {
            setIsInstaLoading(false);
        }
    };
    // Fetch Promotions
    const fetchPromotions = async () => {
        try {
            const res = await fetch("/api/promotion");
            const data = await res.json();

            if (data.success && Array.isArray(data.promotions)) {
                setAllReviews(data.promotions);
            } else {
                setAllReviews([]);
            }
        } catch (error) {
            // console.error("Error fetching promotions:", error);
            setAllReviews([]);
        } finally {
            setIsLoadingPromotions(false);
        }
    };
    // Fetch artisan reviews
    const fetchArtisanReviews = async () => {
        try {
            setIsLoadingReviews(true);
            const response = await fetch('/api/saveReviews?type=all&approved=true&active=true');
            const data = await response.json();
            // console.log('Fetched artisan reviews:', data);
            if (response.ok) {
                // Only show approved and active reviews
                const approvedReviews = data.reviews.filter(review =>
                    review.approved !== false &&
                    review.deleted !== true &&
                    (review.active !== false && review.active !== undefined)
                );
                setArtisanReviews(approvedReviews || []);
            }
        } catch (error) {
            // console.error('Error fetching artisan reviews:', error);
            toast.error('Failed to load reviews');
        } finally {
            setIsLoadingReviews(false);
        }
    };
    useEffect(() => {
        fetchBlogs();
        fetchFacebookPosts();
        fetchNews();
        fetchInstagramPosts();
        fetchPromotions();
        fetchArtisanReviews();
        // fetchReviews();
    }, [])

    // Handle review submission for 'all' type reviews
    const handleReviewSubmit = async (reviewData) => {
        try {
            // The ReviewModal already sends all required fields
            // We just need to ensure the type is set to 'all' and it's auto-approved
            const response = await fetch('/api/saveReviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...reviewData,
                    type: 'all',
                    approved: true,
                    active: true,
                    deleted: false
                })
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.message || 'Failed to submit review');
            }

            // Refresh reviews after submission
            fetchReviews();
            fetchArtisanReviews();
            setShowReviewModal(false);
            toast.success('Thank you for your review!');
        } catch (error) {
            // console.error('Error submitting review:', error);
            toast.error(error.message || 'Failed to submit review');
        }
    };

    // Combine and sort posts by createdAt date
    const allPosts = [...instagramPosts, ...facebookPosts]
        .sort((a, b) => {
            // Sort by createdAt field (newest first)
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return dateB - dateA; // Sort from newest to oldest
        });

    // Determine card width based on number of posts
    const cardBasis =
        allPosts.length <= 3 ? `basis-1/${allPosts.length}` : "md:basis-1/5";

    return (
        <div className='bg-[#fcf7f1] w-full overflow-hidden max-w-screen overflow-x-hidden'>
            {/*Blogs /  News & Announcement Section */}
            {!isBlogsLoading && !news && blogs.length > 0 && (
                <div className="w-full flex flex-col items-center md:py-20 py-10 bg-[#FCF7F1]">
                    <div className="w-full flex flex-col md:flex-row gap-8 min-h-[350px]">
                        <div className="flex flex-col md:flex-row w-full gap-8 px-2">
                            {/* Blogs Section */}
                            {!isBlogsLoading && blogs && blogs.length > 0 && (
                                <div className="flex-1 bg-[#fcf7f1] rounded-lg flex flex-col justify-between min-h-[350px] px-5 py-5 md:px-10">
                                    <div className="font-bold text-xl md:text-3xl mb-4 p-2">
                                        <span className='border-b-2 border-black'>
                                            <span className='italic'>Blog</span> and Events
                                        </span></div>
                                    <h2 className='font-semibold text-xl p-1 '>Experience , Engage, Explore, Event by Event.</h2>
                                    <p className="text-gray-800 mb-8 text-md font-medium">
                                        "We're preparing exciting new content and updates for our users, including upcoming news and events. We’re working behind the scenes to bring you fresh news, upcoming events, and new features to enhance your experience.
                                        <br /><br />
                                        Stay connected — great things are coming soon!"
                                    </p>
                                    <div className="w-full mx-auto md:max-w-7xl mb-8 p-1 md:p-2">
                                        <Carousel className="w-full" plugins={[Autoplay({ delay: 4000 })]}>
                                            <CarouselContent className="">
                                                {blogs.map((blog, idx) => {
                                                    // Determine media (YouTube or image)
                                                    let mediaUrl = blog.image || (Array.isArray(blog.images) && blog.images.length > 0 ? blog.images[0].url || blog.images[0] : undefined) || blog.youtubeUrl;
                                                    let isYoutube = false;
                                                    let embedUrl = '';
                                                    if (mediaUrl && /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//.test(mediaUrl)) {
                                                        isYoutube = true;
                                                        embedUrl = mediaUrl;
                                                        if (embedUrl.includes('youtube.com/watch?v=')) {
                                                            const videoId = embedUrl.split('v=')[1].split('&')[0];
                                                            embedUrl = `https://www.youtube.com/embed/${videoId}`;
                                                        } else if (embedUrl.includes('youtu.be/')) {
                                                            const videoId = embedUrl.split('youtu.be/')[1].split(/[?&]/)[0];
                                                            embedUrl = `https://www.youtube.com/embed/${videoId}`;
                                                        }
                                                    }
                                                    return (
                                                        <CarouselItem key={blog._id || idx} className="w-full">
                                                            <div className="flex flex-col md:flex-row bg-x[#FFF3C9] rounded-xl min-h-[220px] w-full overflow-hidden">
                                                                {/* Image/Video section */}
                                                                <div className="w-full h-40 md:w-2/5 md:h-auto flex items-center justify-center rounded-t-xl md:rounded-l-xl md:rounded-t-none overflow-hidden">
                                                                    {isYoutube ? (
                                                                        <div className="w-full h-full aspect-video overflow-hidden flex items-center justify-center">
                                                                            <iframe
                                                                                src={embedUrl}
                                                                                title={blog.title}
                                                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                                                allowFullScreen
                                                                                className="w-full h-full min-h-[160px] max-h-[220px] border-0"
                                                                            />
                                                                        </div>
                                                                    ) : mediaUrl ? (
                                                                        <img
                                                                            src={mediaUrl}
                                                                            alt={blog.title}
                                                                            className="object-cover w-full h-full max-h-[220px]"
                                                                        />
                                                                    ) : (
                                                                        <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
                                                                            No Image
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                {/* Content section */}
                                                                <div className="flex flex-col justify-between p-2 md:p-4 flex-1 rounded-b-xl md:rounded-r-xl md:rounded-b-none">
                                                                    <div>
                                                                        <div className="font-bold text-base md:text-xl text-black mb-2 leading-snug">{blog.title || 'No title available.'}</div>
                                                                        <div className="text-gray-800 text-sm md:text-base mb-1 md:mb-2 line-clamp-3 min-h-[48px] overflow-y-auto">{blog.shortDescription || blog.shortDesc || 'No description available.'}</div>
                                                                    </div>
                                                                    <div className="flex items-center mt-auto">
                                                                        <Link
                                                                            href={`/blogs/${blog._id}`}
                                                                            rel="noopener noreferrer"
                                                                            className="text-gray-700 font-semibold hover:underline flex items-center group transition focus:outline-none text-sm md:text-base"
                                                                        >
                                                                            Read More  &gt;
                                                                        </Link>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </CarouselItem>
                                                    );
                                                })}
                                            </CarouselContent>
                                            <div className="hidden md:flex items-center gap-2 mt-2 md:mt-0 justify-center md:justify-end">
                                                <CarouselPrevious className="bg-black text-white py-2 font-bold rounded hover:bg-gray-800 transition-colors text-base md:text-lg" />
                                                <CarouselNext className="bg-black text-white py-2 font-bold rounded hover:bg-gray-800 transition-colors text-base md:text-lg" />
                                            </div>
                                        </Carousel>
                                    </div>
                                    <Link href="/blogs">
                                        <button className="w-full bg-black text-white py-3 font-bold rounded hover:bg-gray-800 transition-colors text-lg">
                                            Read More
                                        </button>
                                    </Link>
                                </div>
                            )}
                            {/* News box */}
                            {news && news.length > 0 && (
                                <div className="flex-1 bg-[#fcf7f1] rounded-lg p-4 flex flex-col min-h-[350px] border-[1px] border-black">
                                    <div className="flex-1 pr-2 mb-4">
                                        <div className="font-bold text-2xl mb-4 px-2">
                                            <span className='border-b-2 border-black'>
                                                Upcoming News & Notice
                                            </span></div>
                                        <div className="h-[400px] overflow-y-auto p-0 border-none rounded-xl">
                                            {news && news.length > 0 ? (
                                                <>
                                                    {/* First News - plain heading and description, not in a box */}
                                                    <div className="mb-4 px-2">
                                                        <div className="font-bold text-lg md:text-xl mb-1">{news[0].title || 'News'}</div>
                                                        <div className="text-gray-700 mb-1">
                                                            {(() => {
                                                                const desc = news[0].description ?? "";
                                                                const words = desc.trim().split(/\s+/);
                                                                return words.slice(0, 24).join(" ") + (words.length > 24 ? " ..." : "");
                                                            })()} &nbsp;
                                                            <button
                                                                onClick={() => setQuickViewNews(news[0])}
                                                                className="inline-block text-purple-700 hover:underline font-bold mt-1"
                                                            >
                                                                See more
                                                            </button>
                                                        </div>
                                                    </div>
                                                    {/* Remaining News - alternating color cards */}
                                                    <div className="flex flex-col gap-3">
                                                        {news.slice(1).map((item, idx) => {
                                                            const colorClasses = [
                                                                'bg-[#fff7eb] border-[#ffe7c7]', // light orange
                                                                'bg-[#f2fff6] border-[#c7ffe6]', // light green
                                                                'bg-[#f2f6ff] border-[#c7d6ff]'  // light blue
                                                            ];
                                                            const colorIdx = idx % 3;
                                                            return (
                                                                <div
                                                                    key={item._id}
                                                                    className={`rounded-xl border font-barlow px-4 py-3 ${colorClasses[colorIdx]} shadow-md`}
                                                                >
                                                                    <div className="font-bold text-base md:text-lg mb-1">{item.title || 'News'}</div>
                                                                    <div className="text-gray-700 mb-2">
                                                                        {(() => {
                                                                            const desc = item.description ?? "";
                                                                            const words = desc.trim().split(/\s+/);
                                                                            return words.slice(0, 30).join(" ") + (words.length > 30 ? " ..." : "");
                                                                        })()}&nbsp;
                                                                        <button
                                                                            onClick={() => setQuickViewNews(item)}
                                                                            className="inline-block text-blue-600 hover:underline font-semibold my-1"
                                                                        >
                                                                            See more
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="text-gray-500 text-center py-8">No news available at the moment.</div>
                                            )}
                                        </div>
                                    </div>
                                    <Link href="/contact">
                                        <button className="w-full bg-lime-400 text-black font-bold py-3 rounded hover:bg-lime-500 transition-colors text-lg mt-2">
                                            Get Connected
                                        </button>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Instagram-like Image Carousel using Carousel classes */}
            {!isInstaLoading && !isFbLoading && allPosts.length > 0 && (
                <div className="w-full flex flex-col items-center py-10 px-4">
                    <h2 className="text-center font-bold text-xl md:text-3xl lg:text-4xl uppercase">
                        Don’t just watch the trends — live them!
                    </h2>
                    <p className="text-gray-600 py-4 text-center font-barlow w-full md:w-[90%] mx-auto">
                        Follow us on social media for your daily dose of Trending
                        Packages, exclusive offers, behind-the-scenes peeks, and
                        real-time updates. Join our community of trendsetters and be the
                        first to explore what’s new, what’s hot, and what everyone’s
                        talking about. Your next favorite find is just a follow away!
                    </p>
                    <div className="w-full px-3">
                        <Carousel className="w-full" plugins={[Autoplay({ delay: 4000 })]}>
                            <CarouselContent >
                                {allPosts.map((post, idx) => (
                                    <CarouselItem
                                        key={post._id || idx}
                                        className={`pl-5 ${allPosts.length <= 3 ? cardBasis : "md:basis-1/5"}`}
                                        style={
                                            allPosts.length <= 3
                                                ? { minWidth: `calc(100%/${allPosts.length})` }
                                                : {}
                                        }
                                    >
                                        <div className="relative group border-4 border-white overflow-hidden w-full h-60">
                                            <Image
                                                src={post.image}
                                                alt={`${post.type === "facebook" ? "Facebook" : "Instagram"} ${idx}`}
                                                width={400}
                                                height={400}
                                                className="object-cover md:object-cover w-full h-full"
                                            />
                                            <a
                                                href={post.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center"
                                            >
                                                {post.type === "facebook" ? (
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-facebook-icon lucide-facebook"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
                                                ) : (
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-instagram-icon lucide-instagram"><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></svg>

                                                )}
                                            </a>
                                        </div>
                                    </CarouselItem>
                                ))}
                            </CarouselContent >
                            <CarouselPrevious className="absolute left-1 top-1/2 -translate-y-1/2 p-5" />
                            <CarouselNext className="absolute right-1 top-1/2 -translate-y-1/2 p-5" />
                        </Carousel>
                    </div>
                </div>
            )}

            {/* Reviews Section */}
            <div className="w-full mx-auto relative md:min-h-[650px] min-h-[450px] flex items-center justify-end relative">
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
                <div className="hidden md:flex absolute right-1 gap-2 top-[30%] z-10 flex flex-col justify-start w-full md:w-1/2 items-end pr-1">
                    <div className="px-20">
                        <Button className="bg-white text-black hover:bg-black hover:text-white transition-colors duration-300" onClick={() => setShowReviewModal(true)}>Write Reviews</Button>
                    </div>
                    <Carousel className="w-full md:w-[600px]"
                        plugins={[Autoplay({ delay: 4000 })]}>

                        <CarouselContent className="w-full">
                            {(normalizedReviews && normalizedReviews.length > 0 ? normalizedReviews : [].map(normalizeReview)).map((review, idx) => (
                                <CarouselItem
                                    key={review._id}
                                    className="min-w-0 snap-center w-full"
                                >
                                    <div className="bg-white rounded-3xl px-8 py-5 flex flex-col justify-center gap-5 h-full min-h-[320px] relative overflow-visible">
                                        {/* Review text */}
                                        <div className='py-5'>
                                            <div className="text-md md:text-2xl text-gray-800 font-bold leading-relaxed text-left mb-2">
                                                {review?.title || 'No review text.'}
                                            </div>
                                            <div className="text-sm md:text-md text-gray-800 font-medium leading-relaxed text-left">
                                                {review?.shortDescription || 'No review text.'}
                                            </div>
                                        </div>
                                        {/* Bottom row: avatar, name, subtitle, nav buttons */}
                                        {/* Avatar, Name, Subtitle */}
                                        <div className="flex items-center justify-between pt-5">
                                            <div className="flex items-center">
                                                <img
                                                    src={review?.image || "/placeholder.jpeg"}
                                                    alt={review?.createdBy || 'Anonymous'}
                                                    className="w-14 h-14 rounded-full border-4 border-white shadow object-cover"
                                                    onError={(e) => {
                                                        // console.log('Image failed to load:', e.target.src);
                                                        e.target.src = '/placeholder.jpeg';
                                                    }}
                                                />
                                                <div className="ml-4 text-left flex flex-col items-start gap-2">
                                                    <div className="font-bold text-xl text-black">{review?.createdBy || review?.title || 'Anonymous'}</div>

                                                    <div className="flex items-center gap-1">
                                                        {review?.rating && (
                                                            <>
                                                                {[...Array(review?.rating)].map((_, i) => (
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
                            <CarouselPrevious className="absolute top-[8%] left-[70%] bg-[#f7eedd] !rounded-full !w-12 !h-12 !flex !items-center !justify-center transition" />
                            <CarouselNext className="absolute top-[8%] left-[83%] bg-[#f7eedd] !rounded-full !w-12 !h-12 !flex !items-center !justify-center transition" />
                        </div>
                    </Carousel>
                </div>

                {/* Review Card (Mobile) */}
                <div className="block md:hidden gap-2 flex flex-col justify-start w-full md:w-1/2 items-end pr-1">
                    <div className="button">
                        <Button
                            className="bg-white text-black hover:bg-black hover:text-white transition-colors duration-300"
                            onClick={() => setShowReviewModal(true)}
                        >
                            Write a Review
                        </Button>
                    </div>
                    <Carousel className="w-full md:w-[600px]"
                        plugins={[Autoplay({ delay: 4000 })]}>

                        <CarouselContent className="w-full">
                            {(normalizedReviews && normalizedReviews.length > 0 ? normalizedReviews : [
                                {
                                    _id: 1,
                                    rating: 3,
                                    title: 'No Review',
                                    subtitle: 'No Subtitle',
                                    shortDescription: "No Review",
                                    image: '/placeholder.jpeg',
                                },
                            ].map(normalizeReview)).map((review, idx) => (
                                <CarouselItem
                                    key={review._id}
                                    className="min-w-0 snap-center w-full"
                                >
                                    <div className="bg-white rounded-3xl px-8 py-5 flex flex-col justify-between h-full md:min-h-[320px] relative overflow-visible">
                                        {/* Review text */}

                                        <div className="text-md text-gray-800 font-bold leading-relaxed mt-4 text-left">
                                            {review?.title || 'No review text.'}
                                        </div>
                                        <div className="text-sm text-gray-800 font-medium leading-relaxed my-2 text-left">
                                            {review?.shortDescription || 'No review text.'}
                                        </div>
                                        {/* Bottom row: avatar, name, subtitle, nav buttons */}
                                        <div className="flex items-center justify-between w-full mt-auto">
                                            {/* Avatar, Name, Subtitle */}
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-2">
                                                    <img
                                                        src={review?.image || "/placeholder.jpeg"}
                                                        alt={review?.createdBy || 'Anonymous'}
                                                        className="w-14 h-14 rounded-full object-top border-4 border-white shadow object-cover"
                                                        onError={(e) => {
                                                            // console.log('Image failed to load:', e.target.src);
                                                            e.target.src = '/placeholder.jpeg';
                                                        }}
                                                    />
                                                </div>
                                                <div className="flex flex-col items-start gap-1">
                                                    <div className="px-3 text-left">
                                                        <div className="font-bold text-md text-black">{review?.createdBy || review?.title || 'Anonymous'}</div>
                                                    </div>
                                                    <div className="flex px-3">

                                                        {review?.rating && (
                                                            <>
                                                                {[...Array(review?.rating)].map((_, i) => (
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
                        <CarouselPrevious />
                        <CarouselNext />

                    </Carousel>
                </div>
            </div>
            {/* News Quick View Modal */}
            {quickViewNews && (
                <ViewNews news={quickViewNews} onClose={() => setQuickViewNews(null)} />
            )}

            {showReviewModal && (
                <ReviewModal
                    key={`review-modal-${Date.now()}`}
                    open={showReviewModal}
                    artisan={selectedArtisan}
                    type="all"
                    onClose={() => {
                        setShowReviewModal(false);
                        // Small delay to allow the modal to close before potentially reopening
                        setTimeout(() => setSelectedArtisan(null), 300);
                    }}
                    onSubmit={(data) => {
                        handleReviewSubmit(data);
                        setShowReviewModal(false);
                        setSelectedArtisan(null);
                    }}
                />
            )}

        </div>
    )
}

export default InstaBlog