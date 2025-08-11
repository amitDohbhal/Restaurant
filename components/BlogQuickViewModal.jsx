"use client";
import React, { useState } from "react";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import { X } from "lucide-react";

export default function BlogQuickViewModal({ open, onClose, blog }) {
  if (!open || !blog) return null;
  // Gather all media: images (array) and youtubeUrl (string)
  let images = Array.isArray(blog.images) ? blog.images.filter(img => !!(img.url || img)).map(img => (typeof img === 'string' ? { url: img } : img)) : [];
  if (blog.youtubeUrl) {
    images = [{ url: blog.youtubeUrl, isYoutube: true }, ...images];
  }
  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-60 flex items-center justify-center">
      <div className="bg-[#fcf7f1] rounded-3xl shadow-lg max-w-xl w-full relative flex flex-col p-0">
        {/* Close button */}
        <button onClick={onClose} className="absolute top-4 right-4 z-20 bg-gray-200 hover:bg-gray-300 rounded-full p-2 shadow-md">
          <X size={24} />
        </button>
        {/* Media: image or YouTube */}
        {images.length > 0 ? (
          <Carousel className="w-full h-60 md:h-80">
            <CarouselContent className="">
              {images.map((img, idx) => {
                if (img.isYoutube || (img.url && /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//.test(img.url))) {
                  // YouTube video embed
                  let embedUrl = img.url;
                  if (embedUrl.includes('youtube.com/watch?v=')) {
                    const videoId = embedUrl.split('v=')[1].split('&')[0];
                    embedUrl = `https://www.youtube.com/embed/${videoId}`;
                  } else if (embedUrl.includes('youtu.be/')) {
                    const videoId = embedUrl.split('youtu.be/')[1].split(/[?&]/)[0];
                    embedUrl = `https://www.youtube.com/embed/${videoId}`;
                  }
                  return (
                    <CarouselItem key={idx} className="w-full h-full flex items-center justify-center">
                      <iframe
                        src={embedUrl}
                        title={blog.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-60 md:h-80 border-0 rounded-t-3xl"
                      />
                    </CarouselItem>
                  );
                } else {
                  // Image
                  return (
                    <CarouselItem key={idx} className="w-full h-full flex items-center justify-center">
                      <img
                        src={img.url}
                        alt={blog.title}
                        className="object-cover w-full h-60 md:h-80 rounded-t-3xl"
                      />
                    </CarouselItem>
                  );
                }
              })}
            </CarouselContent>
            {images.length > 1 && (
              <>
                <CarouselPrevious className="absolute top-1/2 left-2 -translate-y-1/2 bg-white/80 !rounded-full z-10" />
                <CarouselNext className="absolute top-1/2 right-2 -translate-y-1/2 bg-white/80 !rounded-full z-10" />
              </>
            )}
          </Carousel>
        ) : (
          <div className="w-full h-80 flex items-center justify-center bg-gray-100 rounded-t-3xl">
            <span className="text-gray-400">No Image</span>
          </div>
        )}
        {/* Blog content */}
        <div className="flex flex-col items-start px-6 py-4">
          <div className="font-bold text-xl md:text-3xl mb-4 text-gray-900">{blog.title}</div>
          {blog.shortText && <div className="text-xl text-gray-700 mb-2">{blog.shortText}</div>}
          {blog.shortDescription && <div className="text-base text-gray-800 mb-4">{blog.shortDescription}</div>}
          {blog.longDescription && <div className="text-base text-gray-700 whitespace-pre-line mb-2 max-h-32 overflow-y-auto">{blog.longDescription}</div>}
        </div>
        <div className="flex justify-end pt-2 px-6 pb-4">
          <button onClick={onClose} className="bg-black text-white px-6 py-2 rounded-full hover:bg-gray-800 shadow">Close</button>
        </div>
      </div>
    </div>
  );
}
