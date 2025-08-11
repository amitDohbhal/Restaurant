"use client"
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
// Helper to extract YouTube video ID from URL
const getYouTubeId = (url) => {
  const match = url.match(/(?:youtu.be\/|youtube.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  return match ? match[1] : null;
};

const ProductVideo = ({ product }) => {
  const videos = product?.video?.videos || [];
  if (!videos.length) return null;

  return (
    <div className="w-full md:px-10 mx-auto py-10 bg-blue-100">
      {videos.map((video, idx) => {
        const videoId = getYouTubeId(video.url);
        const isEven = idx % 2 === 1;
        return (
          <div
            key={video.url}
            className={`flex flex-col md:flex-row items-stretch justify-center mb-4 gap-6 w-full ${isEven ? 'md:flex-row-reverse' : ''}`}
          >
            {/* Video */}
            <div className="w-full h-60 md:h-auto md:w-[60%] aspect-video md:aspect-video rounded-2xl overflow-hidden bg-black flex items-center justify-center">
              {videoId ? (
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}`}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500">
                  Invalid YouTube URL
                </div>
              )}
            </div>
            {/* Description */}
            <div className="w-full min-h-60 md:h-auto md:flex-1 min-w-0 bg-white border border-gray-200 p-6 flex flex-col items-start justify-center text-start rounded-2xl shadow-sm">
              <h2 className="font-bold text-2xl mb-4">{video.title || "Product Video"}</h2>
              <p className="mb-6 text-gray-700 text-base md:text-lg">{video.description || 'Discover more about this product. Get inspired and connect with us for more details!'}</p>
              <Link
              href="/contact"
                className="bg-black text-white px-6 py-2 hover:bg-gray-800 transition-colors text-base font-semibold"
              >
                Get Connected
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ProductVideo;