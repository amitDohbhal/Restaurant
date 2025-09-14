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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1 p-2 md:p-10">
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
                title: item.title || item.foodName,
                name: item.title || item.foodName,
                image: item.image || item.gallery?.mainImage || { url: item.image?.url || "/placeholder.jpeg" },
                price: item.price || item.fullPrice || 0,
                originalPrice: item.originalPrice || item.fullPrice || 0,
                fullPrice: item.fullPrice || item.price || 0,
                halfPrice: item.halfPrice,
                quarterPrice: item.quarterPrice,
                perPiecePrice: item.perPiecePrice,
                coupon: item.coupon,
                description: item.description || item.productDescription,
                cgstPercent: item.cgstPercent,
                sgstPercent: item.sgstPercent
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