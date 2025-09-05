"use client";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Button } from "./ui/button";
import Link from "next/link";
import Image from "next/image";

const RandomTourPackageSection = () => {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch Categories
  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/foodCategory", { cache: 'no-store' });
      const data = await res.json();
      console.log(data)
      setProducts(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };


  useEffect(() => {
    fetchProducts();
  }, []);



  const formatNumeric = (num) => {
    return new Intl.NumberFormat("en-IN").format(num);
  };


  return (
    <section className="bg-[#fcf7f1] md:mt-19 w-full overflow-hidden max-w-screen overflow-x-hidden">
      <div className="w-full h-full overflow-hidden max-w-screen">
        {/* Product Section */}
        <div className="w-full py-10 px-2 bg-[#FCF7F1]">
          <h1 className="text-xl md:text-3xl lg:text-4xl font-bold text-center md:mt-10 uppercase">
            "Don't miss out on what everyone's craving!"
          </h1>
          <p className="text-gray-600 py-4 text-center font-barlow md:w-[50%] w-full mx-auto">
            Highlight a trending offer or special food promotion
          </p>
          <Carousel
            className={`w-full md:w-[95%] mx-auto my-4 ${
              products.length > 0 ? "block" : "hidden"
            }`}
          >
            <CarouselContent className="w-full gap-2">
              {products.length > 0 &&
                products.map((category, index) => (
                  <CarouselItem
                    key={index}
                    className="pl-5 md:basis-1/2 lg:basis-1/4 min-w-0 snap-start"
                  >
                    <Link href={`/category/${category.slug}`} className="block group">
                      <div className="relative aspect-square rounded-2xl overflow-hidden">
                          <Image
                            src={category.categoryProfileImage?.url || '/placeholder.jpg'}
                            alt={category.categoryName}
                            width={300}
                            height={300}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                          />
                      </div>
                    </Link>
                    <Link href={`/category/${category.slug}`} className="block group">
                          <h3 className="text-black font-semibold group-hover:underline text-lg p-3">{category.categoryName}</h3>
                    </Link>
                  </CarouselItem>
                ))}
            </CarouselContent>
            <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 p-5" />
            <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 p-5" />
          </Carousel>
        </div>
      </div>
    </section>
  );
}
export default RandomTourPackageSection