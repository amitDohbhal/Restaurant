"use client"
import Link from 'next/link';
import React, { useEffect, useState } from 'react';

const ViewBlogs = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [visibleCount, setVisibleCount] = useState(6);
  // console.log(blogs)
  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/blogs');
        if (!res.ok) throw new Error('Failed to fetch blogs');
        const data = await res.json();
        setBlogs(data.blogs || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
  }, []);

  return (
    <div className="bg-[#fff8f2] min-h-screen w-full">
      {/* Header with background image */}
      <div className="relative h-64 md:h-80 flex items-center justify-center">
        <img
          src="/BlogBanner.jpg"
          alt="Blog Light Half Image"
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>

      {/* Blog grid */}
      <div className="max-w-7xl mx-auto py-10 px-4 grid grid-cols-1 md:grid-cols-2 gap-8">
        {blogs.slice(0, visibleCount).map((blog, key) => (
          <div
            key={key}
            className="flex flex-col md:flex-row rounded-3xl overflow-hidden shadow group hover:shadow-lg transition bg-transparent"
            style={{ minHeight: '250px' }}
          >
            {/* Left: Image */}
            <div className="md:w-1/2 w-full flex items-center justify-center bg-white p-0 md:p-0">
              {blog.images && blog.images[0]?.url ? (
                <img
                  src={blog.images[0].url}
                  alt={blog.title}
                  className="object-cover w-full h-full md:h-auto md:w-full md:max-w-[340px] aspect-square md:aspect-auto md:rounded-l-3xl rounded-t-3xl md:rounded-t-none"
                  style={{ minHeight: '250px', maxHeight: '270px' }}
                />
              ) : blog.youtubeUrl ? (
                <div className="w-full h-full flex items-center justify-center md:max-w-[340px] aspect-video md:aspect-auto md:rounded-l-3xl rounded-t-3xl md:rounded-t-none overflow-hidden" style={{ minHeight: '250px', maxHeight: '270px' }}>
                  <iframe
                    width="100%"
                    height="100%"
                    src={
                      blog.youtubeUrl.includes('youtube.com') || blog.youtubeUrl.includes('youtu.be')
                        ? blog.youtubeUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')
                        : blog.youtubeUrl
                    }
                    title={blog.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  ></iframe>
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100 md:max-w-[340px] aspect-square md:aspect-auto md:rounded-l-3xl rounded-t-3xl md:rounded-t-none" style={{ minHeight: '250px', maxHeight: '270px' }}>
                  <span className="text-gray-400">No Media</span>
                </div>
              )}
            </div>
            {/* Right: Content */}
            <div className="flex-1 flex flex-col justify-between bg-yellow-100 p-4 md:rounded-r-3xl">
              <div>
                <span className="inline-block bg-black text-white text-sm px-4 py-1 rounded font-bold mb-6 mt-2 md:mt-0">{blog.createdAt ? new Date(blog.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}</span>
                <h3 className="font-bold text-xl md:text-xl text-gray-900 mb-4 mt-4">
                  {blog.title.split(" ").length > 10
                    ? blog.title.split(" ").slice(0, 10).join(" ") + "..."
                    : blog.title}
                </h3>

                {/* <p className="text-gray-800 text-lg mb-8 md:mb-10">{blog.shortDescription}</p> */}
              </div>
              <div className="flex items-center mt-auto">
                <Link
                  href={`/blogs/${blog._id}`}
                  className="text-gray-800 font-semibold hover:underline flex items-center group transition focus:outline-none text-lg"
                >
                  Read More <span className="ml-1">&gt;</span>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
      {blogs.length > visibleCount && (
        <div className="flex justify-center my-8">
          <button
            className="bg-black text-white px-8 py-3 rounded-full font-bold hover:bg-gray-800 transition-colors text-lg shadow"
            onClick={() => setVisibleCount(v => v + 6)}
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
};

export default ViewBlogs;