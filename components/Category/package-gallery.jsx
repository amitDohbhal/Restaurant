"use client";

import Image from "next/image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "../ui/carousel";
import { useState } from "react";

const chunkGalleryImages = (images) => {
  const slides = [];
  const allImages = [...images];
  
  // Create slides with up to 4 images each
  for (let i = 0; i < allImages.length; i += 4) {
    slides.push(allImages.slice(i, i + 4));
  }
  
  // If no images are available, return an empty slide to render the carousel
  if (slides.length === 0) {
    slides.push([]);
  }
  
  return slides;
};

const PackageGallery = ({ images }) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  
  // Use the provided images or an empty array
  const galleryImages = images && images.length ? images : [];
  
  const openModal = (index) => {
    setSelectedImageIndex(index);
    document.body.style.overflow = "hidden";
  };

  const closeModal = () => {
    setSelectedImageIndex(null);
    document.body.style.overflow = "auto";
  };

  const slides = chunkGalleryImages(galleryImages);
  const flatImages = galleryImages;

  // Responsive container width based on sidebar
  // const containerClass = sidebarOpen
  //   ? "space-y-4 overflow-visible px-5 relative w-full md:w-[calc(100%-var(--sidebar-width))] transition-all"
  //   : "space-y-4 overflow-visible px-5 relative w-full transition-all";

  return (
    <div className="space-y-4 overflow-visible px-5 relative w-full transition-all">
      <Carousel className="overflow-visible w-full">
        <CarouselContent>
          {slides.map((slide, slideIdx) => (
            <CarouselItem className="basis-full" key={slideIdx}>
         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 auto-rows-fr">
                {/* Col 1 */}
                <div className="flex flex-col gap-2 h-full ">
                  {slide[0] && (
                    <div
                      className=" cursor-pointer rounded-lg overflow-hidden bg-gray-200"
                      onClick={() => openModal(slideIdx * 4 + 0)}
                    >
                      <Image
                        src={slide[0].url}
                        alt="Gallery"
                        width={300}
                        height={200}
                        style={{ height: '200px', width: '100%', objectFit: 'cover', objectPosition: 'center' }}
                        className="object-cover w-full h-[200px] hover:scale-110 transition-all duration-300"
                      />
                    </div>
                  )}
                  {slide[1] && (
                    <div
                      className=" cursor-pointer rounded-lg overflow-hidden bg-gray-200"
                      onClick={() => openModal(slideIdx * 4 + 1)}
                    >
                      <Image
                        src={slide[1].url}
                        alt="Gallery"
                        width={300}
                        height={200}
                        style={{ height: '200px', width: '100%', objectFit: 'cover', objectPosition: 'center' }}
                        className="object-cover w-full h-[200px] hover:scale-110 transition-all duration-300"
                      />
                    </div>
                  )}
                </div>

                {/* Col 2 */}
                <div className="flex flex-col gap-2 h-full ">
                  {slide[2] && (
                    <div
                      className=" cursor-pointer rounded-lg overflow-hidden bg-gray-200 h-full"
                      onClick={() => openModal(slideIdx * 4 + 2)}
                    >
                      <Image
                        src={slide[2].url}
                        alt="Gallery"
                        width={300}
                        height={410}
                        style={{ height: '100%', width: '100%', objectFit: 'cover', objectPosition: 'center' }}
                        className="object-cover w-full h-full hover:scale-110 transition-all duration-300"
                      />
                    </div>
                  )}
                </div>
                {/* Col 3 */}
                <div className="flex flex-col gap-2 h-full">
                  {slide[3] && (
                    <div
                      className=" cursor-pointer rounded-lg overflow-hidden bg-gray-200 h-full"
                      onClick={() => openModal(slideIdx * 4 + 3)}
                    >
                      <Image
                        src={slide[3].url}
                        alt="Gallery"
                        width={300}
                        height={410}
                        style={{ height: '100%', width: '100%', objectFit: 'cover', objectPosition: 'center' }}
                        className="object-cover w-full h-full hover:scale-110 transition-all duration-300"
                      />
                    </div>
                  )}
                </div>

                {/* Col 4 */}
                <div className="flex flex-col gap-2 h-full">
                  {slide[0] && (
                    <div
                      className=" cursor-pointer rounded-lg overflow-hidden bg-gray-200"
                      onClick={() => openModal(slideIdx * 4 + 0)}
                    >
                      <Image
                        src={slide[0].url}
                        alt="Gallery"
                        width={300}
                        height={200}
                        style={{ height: '200px', width: '100%', objectFit: 'cover', objectPosition: 'center' }}
                        className="object-cover w-full h-[200px] hover:scale-110 transition-all duration-300"
                      />
                    </div>
                  )}
                  {slide[1] && (
                    <div
                      className=" cursor-pointer rounded-lg overflow-hidden bg-gray-200"
                      onClick={() => openModal(slideIdx * 4 + 1)}
                    >
                      <Image
                        src={slide[1].url}
                        alt="Gallery"
                        width={300}
                        height={200}
                        style={{ height: '200px', width: '100%', objectFit: 'cover', objectPosition: 'center' }}
                        className="object-cover w-full h-[200px] hover:scale-110 transition-all duration-300"
                      />
                    </div>
                  )}
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>


      {/* Modal */}
      {selectedImageIndex !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <button
            onClick={closeModal}
            className="absolute top-4 right-4 text-white text-2xl bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center"
          >
            &times;
          </button>
          <button
            onClick={() =>
              setSelectedImageIndex((prev) =>
                prev === 0 ? flatImages.length - 1 : prev - 1
              )
            }
            className="absolute left-8 text-white text-2xl bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center z-10"
          >
            &#10094;
          </button>
          <div className="relative w-full max-w-4xl h-full max-h-[90vh] flex items-center justify-center">
            <Image
              src={
                flatImages[selectedImageIndex]?.url ||
                "/placeholder-image.jpg"
              }
              alt={`Gallery image ${selectedImageIndex + 1}`}
              fill
              quality={50}
              className="object-contain"
              priority
            />
          </div>
          <button
            onClick={() =>
              setSelectedImageIndex((prev) =>
                prev === flatImages.length - 1 ? 0 : prev + 1
              )
            }
            className="absolute right-8 text-white text-2xl bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center z-10"
          >
            &#10095;
          </button>
          <div className="absolute bottom-4 text-white">
            {selectedImageIndex + 1} / {flatImages.length}
          </div>
        </div>
      )}
    </div>
  );
};

export default PackageGallery;
