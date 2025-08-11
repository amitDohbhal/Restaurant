"use client"
import React from 'react'
import Image from "next/image";

const CategoryAds = ({ categoryAdList }) => {
  return (
    categoryAdList.length > 0 ? (
      <>
        {categoryAdList.map((ad, idx) => (
          <div key={ad._id || idx} className="hidden md:flex w-full max-w-xl rounded-2xl overflow-hidden shadow mb-4 flex flex-col items-center">
            {ad.image && ad.buttonLink ? (
              <a href={ad.buttonLink} target="_blank" rel="noopener noreferrer">
                <Image
                  src={ad.image?.url || ad.image || "/placeholder.jpeg"}
                  alt={"Category Advertisement"}
                  width={600}
                  height={400}
                  className="object-contain w-full max-h-[500px] cursor-pointer hover:opacity-90 transition"
                  style={{ height: "auto", maxHeight: "500px" }}
                />
              </a>
            ) : ad.image ? (
              <Image
                src={ad.image?.url || ad.image || "/placeholder.jpeg"}
                alt={"Category Advertisement"}
                width={600}
                height={400}
                className="object-contain w-full max-h-[500px]"
                style={{ height: "auto", maxHeight: "500px" }}
              />
            ) : (
              <div className="w-full flex-1 flex items-center justify-center text-gray-400" style={{ minHeight: "120px" }}>No Image</div>
            )}
          </div>
        ))}
      </>
    ) : (
      <div className="w-full max-w-xl h-full rounded-2xl overflow-hidden shadow flex items-center justify-center text-gray-400">
        No Advertisement
      </div>
    )
  );
};

export default CategoryAds;