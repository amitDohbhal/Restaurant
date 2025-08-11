"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Link from "next/link";
import RelatedBlogs from './RelatedBlogs';
// Optionally import your modal component for news quick view
// import ViewNews from "./ViewNews";

// Carousel imports
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";

const BlogDetail = () => {
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [news, setNews] = useState([]);
  const [loadingNews, setLoadingNews] = useState(true);
  const [quickViewNews, setQuickViewNews] = useState(null);
  const params = useParams();
  const blogId = params?.id;

  const router = useRouter();

  // Fetch news
  useEffect(() => {
    const fetchNews = async () => {
      setLoadingNews(true);
      try {
        // Replace with your real API endpoint
        const res = await fetch("/api/addNews");
        if (!res.ok) throw new Error("Failed to fetch news");
        const data = await res.json();
        setNews(Array.isArray(data) ? data : data.news || []);
      } catch (err) {
        setNews([]);
      }
      setLoadingNews(false);
    };
    fetchNews();
  }, []);
  // console.log(news)

  useEffect(() => {
    if (!blogId) return;
    const fetchBlog = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/blogs/${blogId}`);
        if (!res.ok) throw new Error("Failed to fetch blog details");
        const data = await res.json();
        setBlog(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchBlog();
  }, [blogId]);


  // News Quick View Modal
  const handleCloseNewsModal = () => setQuickViewNews(null);

  return (
    <>
      {loading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <svg className="animate-spin h-10 w-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
          </svg>
        </div>
      )}
      {quickViewNews && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="rounded-2xl bg-white shadow-2xl w-full max-w-lg h-[90vh] relative flex flex-col overflow-y-auto animate-fadeIn">
            <button aria-label="Close" onClick={handleCloseNewsModal} className="absolute top-4 right-4 z-10 bg-gray-200 hover:bg-gray-400 rounded-full p-2">
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
            {quickViewNews.image?.url && (
              <div className="w-full h-64 relative rounded-t-2xl overflow-hidden">
                <img src={quickViewNews.image.url} alt="News Image" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex flex-col items-start px-6 py-4 flex-1 overflow-y-auto">
              <div className="font-bold text-2xl mb-2 text-gray-900">{quickViewNews.title}</div>
              <div className="text-sm border bg-yellow-200 rounded-xl px-2 text-gray-700 mb-2">{quickViewNews.date}</div>
              <div className="text-base text-gray-800 mb-4 whitespace-pre-line">{quickViewNews.description}</div>
            </div>
            <div className="flex justify-end pt-2 px-6 pb-4">
              <button onClick={handleCloseNewsModal} className="bg-black text-white px-6 py-2 rounded-full hover:bg-gray-800 shadow">Close</button>
            </div>
          </div>
        </div>
      )}
      {!loading && (
        <div className="w-full mx-auto md:p-4 my-4 mb-4 bg-[#fcf7f1]">
          <div className="w-full px-5 flex flex-col md:flex-row gap-8">
            {/* Left: Blog Details (scrollable) */}
            <div className="md:w-2/3 w-full md:h-screen md:overflow-y-auto pr-0 md:pr-2 scrollbar-none" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {loading ? (
                <div className="flex items-center justify-center h-full min-h-[400px]">
                  <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                  </svg>
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <h1 className="text-3xl md:text-5xl font-bold leading-tight text-gray-900 mb-4">{blog?.title}</h1>
                    <div className="flex flex-wrap items-center gap-4 mb-6">
                      <span className="bg-yellow-200 text-black text-base px-4 py-2 rounded-lg font-semibold">
                        {blog?.createdAt ? new Date(blog?.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
                      </span>

                    </div>
                  </div>
                  {/* Media Section */}
                  {blog?.youtubeUrl ? (
                    <div className="w-full aspect-video rounded-2xl overflow-hidden mb-8">
                      <iframe
                        src={`https://www.youtube.com/embed/${blog?.youtubeUrl.split('v=')[1]}`}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full"
                      ></iframe>
                    </div>
                  ) : blog?.images && blog?.images?.length > 0 ? (
                    <div className="w-full rounded-2xl overflow-hidden mb-8">
                      <img
                        loading="lazy"
                        src={blog?.images[0]?.url}
                        alt={blog?.title}
                        className="w-full object-cover rounded-2xl"
                        style={{ maxHeight: '480px' }}
                      />
                    </div>
                  ) : null}
                  <div className="rounded-2xl  p-6 md:p-5 mb-4">
                    {blog?.shortDescription && (
                      <blockquote className="bg-gray-100 border-l-4 border-green-400 p-4 mb-6 rounded">
                        <div className="font-semibold text-base" dangerouslySetInnerHTML={{ __html: blog?.shortDescription }} />
                      </blockquote>
                    )}
                    <div className="prose max-w-none text-lg" dangerouslySetInnerHTML={{ __html: blog?.longDescription || blog?.content || '' }} />
                  </div>
                </>
              )}
            </div>
            {/* Right: News Section (sticky/fixed on desktop) */}
            <div className="hidden md:flex md:w-1/3 w-full">
              <div className="sticky bottom-0 h-screen w-full flex flex-col">
                <div className="bg-[#fcf7f1] rounded-lg p-4 flex flex-col h-full">
                  <div className="flex-1 pr-2">
                    <div className="font-bold text-2xl mb-4">Latest News</div>
                    <div className="h-[calc(100vh-150px)] overflow-y-auto p-4 border border-black rounded-xl scrollbar-none" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                      {loadingNews ? (
                        <div className="flex items-center justify-center h-full min-h-[120px]">
                          <svg className="animate-spin h-7 w-7 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                          </svg>
                        </div>
                      ) : news && news.length > 0 ? (
                        news.map((item) => (
                          <div key={item._id} className="bg-gray-200 border border-black rounded-lg px-3 py-2 mb-2 text-base font-medium">
                            <div className="mb-2">
                              {(() => {
                                const desc = item.description ?? "";
                                const words = desc.trim().split(/\s+/);
                                return words.slice(0, 20).join(" ") + (words.length > 20 ? " ..." : "");
                              })()}
                            </div>
                            <button
                              onClick={() => setQuickViewNews(item)}
                              className="inline-block text-blue-600 hover:underline font-semibold mt-2"
                            >
                              Read More
                            </button>
                          </div>
                        ))
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
              </div>
            </div>
            {/* News Section for mobile (below blog on small screens) */}
            <div className="md:hidden w-full flex flex-col mt-8">
              <div className="bg-[#fcf7f1] rounded-lg p-4 flex flex-col min-h-[350px]">
                <div className="flex-1 pr-2">
                  <div className="font-bold text-2xl mb-4">Latest News</div>
                  <div className="h-[380px] overflow-y-auto p-4 border border-black rounded-xl scrollbar-none" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {loadingNews ? (
                      <div className="flex items-center justify-center h-full min-h-[120px]">
                        <svg className="animate-spin h-7 w-7 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                        </svg>
                      </div>
                    ) : news && news.length > 0 ? (
                      news.map((item) => (
                        <div key={item._id} className="bg-gray-200 border border-black rounded-lg px-3 py-2 mb-2 text-base font-medium">
                          <div className="mb-2">
                            {(() => {
                              const desc = item.description ?? "";
                              const words = desc.trim().split(/\s+/);
                              return words.slice(0, 20).join(" ") + (words.length > 20 ? " ..." : "");
                            })()}
                          </div>
                          <button
                            onClick={() => setQuickViewNews(item)}
                            className="inline-block text-blue-600 hover:underline font-semibold mt-2"
                          >
                            Read More
                          </button>
                        </div>
                      ))
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
            </div>
          </div>
        </div>
      )}
      {/* Related Blogs Section */}
      {blog && blog._id && (
        <RelatedBlogs excludeId={blog._id} />
      )}
    </>
  );
};

export default BlogDetail;