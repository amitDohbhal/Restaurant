
"use client"
import Image from "next/image";
import Link from "next/link";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

// CategoryCarousel: displays categories in a row carousel (5 per row)
export const CategoryCarousel = ({ categories = [] }) => {
  if (!Array.isArray(categories) || categories.length === 0) {
    return <div>No categories found.</div>;
  }
  return (
    <Carousel className={`w-full md:w-[95%] mx-auto my-4 ${categories.length > 0 ? "block" : "hidden"}`}>
      <CarouselContent className="w-full gap-2">
        {categories.map((category, index) => (
          <CarouselItem
            key={index}
            className="pl-5 basis-1/2 md:basis-1/2 lg:basis-1/6 min-w-0 snap-start"
          >
            <CategoryCard category={category} />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 p-5" />
      <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 p-5" />
    </Carousel>
  );
};


const CategoryCard = ({ category }) => {
  if (!category || !category.url) {
    return null; // Don't render if no category or URL
  }
  
  return (
    <Link href={category.url} className="group w-52 max-h-72 transition-transform mx-2 my-2 flex flex-col">
      <div className="relative w-full h-60 overflow-hidden rounded-xl mb-2">
        <Image
          src={category?.profileImage?.url || "/placeholder.jpeg"}
          alt={category?.title || 'Category image'}
          fill
          className="object-cover object-top h-full w-full rounded-xl group-hover:-translate-y-3 transition-transform duration-200"
          sizes="176px"
          priority={false}
        />
      </div>
      <h3 className="text-center font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
        {category?.title}
      </h3>
    </Link>
  );
};

export default CategoryCard;