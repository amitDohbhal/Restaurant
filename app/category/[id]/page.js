import { Suspense } from "react"

import CategoryBanner from "@/components/Category/category-banner"
import PackageCard from "@/components/Category/package-card"
import CategoryProducts from "@/components/CategoryProducts"
import { Skeleton } from "@/components/ui/skeleton"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import CategoryAds from "@/components/CategoryAds";
import CategoryCard from "@/components/Category/category-card";
import { Heart } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
const formatCategoryId = (categoryId) => {
  return categoryId
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize each word
    .join(' '); // Join words with space
};
const formatNumeric = (num) => {
  return new Intl.NumberFormat("en-IN").format(num);
};

export async function generateMetadata({ params }) {
  const { id } = await params
  return {
    title: `${formatCategoryId(id)}`,
  };
}
const CategoryPage = async ({ params }) => {
  const { id } = await params;
  // Fetch category data
  const categoryRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/getCategoryBanner/${id}`, { cache: 'no-store' });
  const categoryData = await categoryRes.json();
  console.log('Category Data:', categoryData);
  
  // Use the products array from the API response which contains full product data
  const visibleProducts = Array.isArray(categoryData.products) ? categoryData.products : [];
  // console.log('Visible Products:', visibleProducts);
  
  // Fetch all categories for the category cards row
  const allCategoriesRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/foodCategory`, { cache: 'no-store' });
  const allCategories = await allCategoriesRes.json();

  return (
    <SidebarInset>
      <div className="min-h-screen bg-[#fcf7f1]">
        {/* Category Banner at the top */}
        <CategoryBanner 
          title={categoryData.categoryName} 
          bannerImage={categoryData.categoryBannerImage?.url}
          subCategory={categoryData.categoryName}
        />

        <div className="flex flex-col md:flex-row gap-6 w-full">
          {/* Middle Section: Category Cards + Package Cards */}
          <div className="flex-1 min-w-0 gap-4">
            {/* Category Cards Row */}
            <div className="bg-gray-200">
              <div className="flex items-center flex-col md:flex-row gap-5 p-2 md:p-5">
                <div className="flex flex-col gap-2 items-center">
                  <h1 className="text-2xl font-bold">Taste The Difference</h1> 
                  <p className="text-justify px-5 md:px-0 md:w-64">Deliciousness, Delivered in Every Slice Where Every Bite is a Flavour Explosion &quot;Experience the rich taste of our freshly prepared dishes, made with authentic flaviours and quanlity ingredients, Every bite promites confort, freshness, and unforgettable flavour.&quot;</p>          
                </div>
              <Carousel className="w-full mx-auto my-4 px-5">
                <CarouselContent className="w-full gap-5">
                  {Array.isArray(allCategories) && allCategories.map((category, idx) => (
                    <CarouselItem key={category._id || idx} className="pl-5 basis-1/3 md:basis-1/6 lg:basis-1/6 min-w-0 snap-start">
                      <CategoryCard category={{
                        title: category.categoryName,
                        profileImage: category.categoryProfileImage?.url ? { url: category.categoryProfileImage.url } : null,
                        url: `/category/${category.slug}`
                      }} />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselNext className="!right-2 !top-1/2 !-translate-y-1/2 z-10 " />
                <CarouselPrevious className="!left-1 !top-1/2 !-translate-y-1/2 z-10" />
              </Carousel>
              </div>
              </div>
            < div className="h-[1px] bg-gray-300"></div>
            {/* Product Cards Row */}
            <CategoryProducts visibleProducts={visibleProducts} />
          </div>
        </div>
      </div>
    </SidebarInset>
  )

}

export default CategoryPage
