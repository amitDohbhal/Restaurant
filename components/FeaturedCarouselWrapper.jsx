"use client";

import React from 'react';
import ResponsiveFeaturedCarousel from "./ResponsiveFeaturedCarousel";

const FeaturedCarouselWrapper = ({ featuredPackages }) => {
  return (
    <ResponsiveFeaturedCarousel 
      featuredPackages={featuredPackages} 
    />
  );
};

export default FeaturedCarouselWrapper;
