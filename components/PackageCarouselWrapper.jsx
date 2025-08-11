"use client";

import React from 'react';
import ResponsiveCarousel from "./ResponsiveCarousel";

const PackageCarouselWrapper = ({ packages, formatNumeric }) => {
  return (
    <ResponsiveCarousel 
      packages={packages} 
      formatNumericStr={formatNumeric} 
    />
  );
};

export default PackageCarouselWrapper;
