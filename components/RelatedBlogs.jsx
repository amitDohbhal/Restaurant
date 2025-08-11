import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
const RelatedBlogs = ({ excludeId }) => {
  const [relatedBlogs, setRelatedBlogs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!excludeId) return;
    setLoading(true);
    fetch(`/api/blogs/relatedBlogs?exclude=${excludeId}`)
      .then(res => res.json())
      .then(data => setRelatedBlogs(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, [excludeId]);

  if (loading) return <div className="py-8 text-center">Loading related blogs...</div>;
  if (!relatedBlogs.length) return null;

  // Import carousel UI
  // (Assume Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious are globally available or imported at top)
  return (
    <div className="mt-12 mb-5 w-full md:w-[95%] mx-auto px-10">
      <h2 className="text-3xl underline font-bold mb-4" >Related Blogs</h2>
      <div className="relative">
        <Carousel className="w-full" plugins={[Autoplay({ delay: 4000 })]}>
          <CarouselContent>
            {relatedBlogs.map((blog, idx) => (
              <CarouselItem key={idx} className="pl-1md:basis-1/2 lg:basis-1/2">
                <div className="flex flex-col md:flex-row rounded-3xl overflow-hidden shadow group hover:shadow-lg transition bg-transparent min-h-[250px]">
                  {/* Left: Image/Video/Placeholder */}
                  <div className="md:w-1/2 w-full flex items-center justify-center p-0 md:p-0">
                    {blog.images && blog.images[0]?.url ? (
                      <img
                        src={blog.images[0].url}
                        alt={blog.title}
                        className="object-cover w-full h-full md:h-auto md:w-full md:max-w-[340px] aspect-square md:aspect-auto md:rounded-l-3xl rounded-t-3xl md:rounded-t-none"
                        style={{ minHeight: '250px', maxHeight: '250px', objectFit: 'cover' }}
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
                  <div className="flex-1 flex flex-col justify-between bg-yellow-100 p-8 ">
                    <div className='gap-2'>
                      <span className="inline-block bg-black text-white text-sm px-4 rounded font-bold mb-6 md:mt-0">{blog.createdAt ? new Date(blog.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}</span>
                      <h3 className="font-bold text-xl text-gray-900 my-2">
                        {blog.title.split(' ').length > 10
                          ? blog.title.split(' ').slice(0, 10).join(' ') + '...'
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
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>
    </div>
  );
};

export default RelatedBlogs;
