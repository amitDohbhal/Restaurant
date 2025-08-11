"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import React from 'react'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "./ui/carousel";

const Activity = ({ data }) => {
  // console.log(data)
  const [openIndex, setOpenIndex] = useState(0);
  return (
    <div className="w-full min-h-screen bg-[#fcf7f1]">
      {/* Banner */}
      <div className="relative w-full h-[150px] md:h-[320px] flex items-center justify-center">
        <Image src={data.bannerImage?.url} alt="Banner" layout="fill" objectFit="cover" className="z-0 opacity-100" priority />
        <div className="hidden md:flex absolute top-20 z-10 container w-fit mx-auto px-4 flex-col justify-center h-full bg-[#fcf7f1] rounded-xl">
          <div className="max-w-2xl flex flex-col items-center justify-center px-10">
            <h1 className="text-2xl font-semibold text-black mb-2 drop-shadow-lg">{data.firstTitle}</h1>
              <div className="w-96 rounded-lg overflow-hidden">
              <Image src={data.imageFirst?.url} alt="Intro" width={550} height={300} className="object-cover w-full h-[250px]" />
            </div>
          </div>
        </div>
      </div>
      <div className="md:hidden relative container w-fit mx-auto flex flex-col justify-center h-full bg-[#fcf7f1] rounded-xl">
          <div className="flex flex-col items-center justify-center px-2">
            <h1 className="text-2xl font-semibold text-black mb-2 drop-shadow-lg">{data.firstTitle}</h1>
              <div className="w-full rounded-lg overflow-hidden">
              <Image src={data.imageFirst?.url} alt="Intro" width={550} height={300} className="object-cover w-full h-[250px]" />
            </div>
          </div>
        </div>

      {/* Main Content */}
      <section className="py-10 md:py-20">
        <div className="w-full max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-5 items-start">
            {/* Left Side */}
            <div className="lg:w-1/2 w-full">
              <div className="px-5 mb-8">
                <h4 className="pacifico-h2 text-green-800 text-2xl md:text-3xl mb-4">{data.secondTitle}</h4>
                <p className="text-base text-gray-700 mb-4">
                  {data.shortPara && (
                    <div
                      className="custom-desc-list my-4"
                      dangerouslySetInnerHTML={{ __html: data.shortPara }}
                    />
                  )}

                </p>
                {/* Third Paragraph */}
                {data.thirdPara && data.thirdTitle && (
                  <div className="max-w-xl mx-auto px-6 py-4 border border-gray-300 rounded-2xl relative">
                    <blockquote className="relative">
                      <h2 className="text-2xl font-bold mb-4 text-gray-900">{data.thirdTitle}</h2>

                      <ul className="space-y-3 text-gray-800 font-medium list-none">
                        {data.thirdPara && (
                          <div
                            className="custom-desc-list my-4"
                            dangerouslySetInnerHTML={{ __html: data.thirdPara }}
                          />
                        )}
                      </ul>
                      <div className="flex justify-between items-center mt-6">
                        <div className="flex gap-2">
                          <hr className="my-6 border-t border-black w-10" />
                          <img src="/A1.jpg" alt="Logo Image" className="h-16 w-auto" />
                        </div>
                        <span className="text-7xl text-black font-serif">”</span>
                      </div>
                    </blockquote>
                  </div>
                )}
                {/* Video */}
                {data.videoUrl && (
                  <>
                    {(data.videoUrl.includes("youtube.com") || data.videoUrl.includes("youtu.be")) ? (() => {
                      let videoId = "";
                      let start = "";
                      try {
                        if (data.videoUrl.includes("youtube.com")) {
                          const urlObj = new URL(data.videoUrl);
                          videoId = urlObj.searchParams.get("v");
                          start = urlObj.searchParams.get("t");
                        } else if (data.videoUrl.includes("youtu.be")) {
                          const match = data.videoUrl.match(/youtu\.be\/([^?&]+)/);
                          videoId = match ? match[1] : "";
                          const urlObj = new URL(data.videoUrl);
                          start = urlObj.searchParams.get("t");
                        }
                      } catch (e) { videoId = ""; start = ""; }
                      // Convert start time if present (remove 's' if present)
                      let startParam = "";
                      if (start) {
                        const sec = parseInt(start.replace('s', ''));
                        if (!isNaN(sec)) startParam = `?start=${sec}`;
                      }
                      const embedUrl = videoId
                        ? `https://www.youtube.com/embed/${videoId}${startParam}`
                        : data.videoUrl;
                      return (
                        <iframe
                          width="100%"
                          height="300"
                          className="my-4 rounded-lg"
                          src={embedUrl}
                          title="YouTube video player"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        ></iframe>
                      );
                    })() : (
                      <video controls width="100%" className="my-4 rounded-lg">
                        <source src={data.videoUrl} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    )}
                  </>
                )}

                {/* Accordion */}
                {data.ifAccording && (
                  <div className="w-full max-w-2xl mx-auto mb-8 mt-10">
                    {data.ifAccording.map((item, idx) => {
                      const contentRef = React.useRef(null);
                      const isOpen = openIndex === idx;
                      const [height, setHeight] = React.useState(0);

                      React.useEffect(() => {
                        if (isOpen && contentRef.current) {
                          setHeight(contentRef.current.scrollHeight);
                        } else {
                          setHeight(0);
                        }
                      }, [isOpen]);

                      return (
                        <div key={idx} className="mb-2 border border-gray-200 rounded-lg bg-white">
                          <button
                            className={`w-full flex justify-between items-center px-4 py-3 text-left font-semibold text-lg transition focus:outline-none ${isOpen ? 'text-amber-700' : 'text-gray-800'}`}
                            onClick={() => setOpenIndex(isOpen ? -1 : idx)}
                            aria-expanded={isOpen}
                          >
                            <span className="text-sm md:text-xl">{item.title}</span>
                            <span className="text-3xl">{isOpen ? '-' : '+'}</span>
                          </button>
                          <div
                            ref={contentRef}
                            style={{
                              maxHeight: isOpen ? height : 0,
                              opacity: isOpen ? 1 : 0,
                              overflow: 'hidden',
                              transition: 'max-height 0.4s cubic-bezier(0.4,0,0.2,1), opacity 0.3s',
                            }}
                            className="px-6 py-2"
                          >
                            <p className="text-gray-700 text-base whitespace-pre-line">{item.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            {/* Right Side - keep width fixed and separated */}
            <div className="lg:w-1/2 px-2 w-full flex flex-col items-center justify-start lg:static relative">
              {data.mainProfileImage && (
                <div className="w-full  max-w-md rounded-xl overflow-hidden">
                  <Image
                    src={data.mainProfileImage.url}
                    alt="Rishikesh"
                    width={400}
                    height={400}
                    className="object-cover w-full h-auto"
                    style={{ objectFit: 'cover' }}
                    priority
                  />
                </div>
              )}
              {/* Gallery */}
              {Array.isArray(data.imageGallery) && data.imageGallery.length > 0 && (
                <div className="my-6">
                  <Carousel className="w-full max-w-xl mx-auto">
                    <CarouselContent className="flex gap-4 flex-nowrap w-full">
                      {data.imageGallery.map((img, idx) => (
                        <CarouselItem key={idx} className="flex justify-center min-w-0">
                          <Image
                            src={img.url}
                            alt={`Gallery Image ${idx + 1}`}
                            width={400}
                            height={300}
                            className="rounded-lg object-cover w-full h-72"
                            style={{ maxHeight: 320, objectFit: 'cover' }}
                            priority={idx === 0}
                          />
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <div className="flex items-center gap-3 mt-4 justify-center">
                      <CarouselNext className="!right-2 !top-1/2 !-translate-y-1/2 z-10" />
                      <CarouselPrevious className="!left-1 !top-1/2 !-translate-y-1/2 z-10" />
                    </div>
                  </Carousel>
                </div>
              )}
            </div>
          </div>
          {/* Long Paragraph */}
          <div className="px-2">

          {data.longPara && (
            <div className="mt-4 w-full rounded-xl overflow-hidden border-2 border-black p-5">
              <div
                className="custom-desc-list my-4"
                dangerouslySetInnerHTML={{ __html: data.longPara }}
                />
            </div>
          )}
        </div>
          </div>
      </section>
    </div>
  );
};

export default Activity;