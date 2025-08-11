"use client"
import React, { useState } from "react";
import PackageCard from "@/components/Category/package-card"

export default function CategoryProductsGrid({ visibleProducts }) {
  const [page, setPage] = useState(1);
  const productsPerPage = 12;
  const totalPages = Math.ceil(visibleProducts.length / productsPerPage);
  const startIdx = (page - 1) * productsPerPage;
  const endIdx = Math.min(page * productsPerPage, visibleProducts.length);
  const paginatedProducts = visibleProducts.slice(startIdx, endIdx);
  // console.log(paginatedProducts)

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 my-4">
        {paginatedProducts.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <h3 className="text-xl font-medium text-gray-600">No products found for this category</h3>
            <p className="mt-2 text-gray-500">Please try another category</p>
          </div>
        ) : (
          paginatedProducts.map((item, index) => (
            <PackageCard
              key={index}
              pkg={{
                ...item,
                name: item.title,
                image: item.gallery?.mainImage.url,
                price: (item.quantity && Array.isArray(item.quantity.variants) && item.quantity.variants.length > 0 ? item.quantity.variants[0].price : 0),
                originalPrice: item.quantity?.originalPrice,
                coupon: item.coupon,
              }}
            />
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="w-full mt-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-md font-medium text-gray-800">
              Showing {startIdx + 1}-{endIdx} of {visibleProducts.length} Results
            </span>
            <div className="flex items-center gap-3">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  className={`border rounded-full w-12 h-12 flex items-center justify-center text-lg ${page === i + 1 ? 'bg-black text-white' : 'bg-transparent text-black'} transition`}
                  onClick={() => setPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
              <button
                className="border rounded-full px-4 h-12 flex items-center justify-center text-lg bg-transparent text-black transition"
                onClick={() => setPage(page < totalPages ? page + 1 : page)}
                disabled={page === totalPages}
              >
                NEXT
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}