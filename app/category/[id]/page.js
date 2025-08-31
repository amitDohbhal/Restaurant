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

// Get category information
const getCategoryInfo = async (categoryData) => {
  return (
    {
      title: categoryData?.title || "Category Title",
      bannerImage: categoryData?.banner?.url || `${process.env.NEXT_PUBLIC_BASE_URL}/categoryBanner.jpg`,
    }
  )
}

const CategoryPage = async ({ params }) => {
  const { id } = await params;
  // Fetch all menu items to get the main category name
  const menuRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/getAllMenuItems`);
  const menuItems = await menuRes.json();
  
  // Find the main category that contains this subcategory
  const mainCategory = menuItems.find(mainCat => 
    mainCat.subMenu?.some(subCat => subCat.url === id)
  );
  
  // Fetch category data
  const categoryRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/getCategoryBanner/${id}`);
  let categoryData = await categoryRes.json();
  
  // Combine main category title with category data
  categoryData = {
    ...categoryData,
    mainCategoryTitle: mainCategory?.title
  };
  // products is now an array of full product objects
  const products = Array.isArray(categoryData.products) ? categoryData.products : [];
  const visibleProducts = products.filter(prod => prod.active !== false);
  // console.log(visibleProducts)
  const categoryInfo = await getCategoryInfo(categoryData);
  // console.log(categoryAdList)
  // Fetch all categories for the category cards row
  const allCategoriesRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/getAllMenuItems`, { cache: 'no-store' });
  const allCategories = await allCategoriesRes.json();
  // console.log(allCategories)

  return (
    <SidebarInset>
      <div className="min-h-screen bg-[#fcf7f1]">
        {/* Category Banner at the top */}
        <CategoryBanner 
        title={categoryData.title} 
        bannerImage={categoryInfo.bannerImage} 
        mainCategory={categoryData.mainCategoryTitle || categoryData.title} 
      />

        <div className="flex flex-col md:flex-row gap-6 w-full mt-4">
          {/* Middle Section: Category Cards + Package Cards */}
          <div className="flex-1 min-w-0 gap-4 px-2">
            {/* Category Cards Row */}
            <div>
              <h2 className="text-2xl font-bold px-4 underline">Category</h2>
              <Carousel className="w-full mx-auto my-4">
                <CarouselContent className="w-full gap-5">
                  {Array.isArray(allCategories) && allCategories.flatMap(cat =>
                    Array.isArray(cat.subMenu) ? cat.subMenu.map((sub, idx) => (
                      <CarouselItem key={`${cat._id || cat.title || idx}-${sub._id || sub.url || idx}`} className="basis-1/2 md:basis-1/6 lg:basis-1/6 min-w-0 snap-start">
                        <CategoryCard category={{
                          title: sub.title,
                          profileImage: sub.profileImage,
                          url: `/category/${sub.url}`
                        }} />
                      </CarouselItem>
                    )) : []
                  )}
                </CarouselContent>
                <CarouselNext className="!right-2 !top-1/2 !-translate-y-1/2 z-10 " />
                <CarouselPrevious className="!left-1 !top-1/2 !-translate-y-1/2 z-10" />
              </Carousel>
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
