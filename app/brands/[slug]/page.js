import { Suspense } from "react"
import connectDB from "@/lib/connectDB";
import BrandCategory from "@/models/BrandCategory";
import Brand from "@/models/Brand";
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

export async function generateMetadata({ params }) {
    const { slug } = await params;
    await connectDB();

    try {
        const brandCategory = await BrandCategory.findOne({ slug })
            .populate('brand', 'title buttonLink')
            .populate({
                path: 'products.product',
                populate: 'gallery quantity coupons taxes',
            });


        if (!brandCategory) {
            return {
                title: 'Brand Not Found',
                description: 'The requested brand category was not found.'
            };
        }

        return {
            title: brandCategory.title || formatCategoryId(slug),
            description: `Explore ${brandCategory.title} - ${brandCategory.brand?.title || ''} collection`,
            openGraph: {
                images: [brandCategory.profileImage?.url || '/default-brand.jpg'],
            },
        };
    } catch (error) {
        // console.error('Error generating metadata:', error);
        return {
            title: formatCategoryId(slug),
            description: 'Explore our brand collection',
        };
    }
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

const BrandPage = async ({ params }) => {
    const { slug } = await params;

    // Fetch brand category data
    await connectDB();
    const brandCategory = await BrandCategory.findOne({ slug })
        .populate('brand', 'title buttonLink')
        .populate({
            path: 'products.product',
            populate: 'gallery quantity coupons taxes',
        })
        .lean();

    // Fetch all menu items for the category list
    const menuRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/brand-categories`, { cache: 'no-store' });
    const allCategories = await menuRes.json();
    // Create a clean, serializable version of the products
    const getCleanProduct = (product) => {
        if (!product) return null;

        // Process coupons
        const activeCoupons = Array.isArray(product.coupons)
            ? product.coupons
                .filter(coupon => coupon?.isActive !== false)
                .map(coupon => ({
                    code: coupon?.code || '',
                    discount: coupon?.discount || 0,
                    type: coupon?.type || 'percentage',
                    startDate: coupon?.startDate,
                    endDate: coupon?.endDate,
                    minimumPurchase: coupon?.minimumPurchase || 0
                }))
            : [];

        // Process taxes
        const productTaxes = Array.isArray(product.taxes)
            ? product.taxes.map(tax => ({
                name: tax?.name || '',
                rate: tax?.rate || 0,
                type: tax?.type || 'percentage',
                isIncludedInPrice: tax?.isIncludedInPrice || false
            }))
            : [];

        return {
            _id: product._id?.toString(),
            title: product.title,
            slug: product.slug,
            code: product.code || '',
            active: product.active,
            gallery: product.gallery ? {
                mainImage: product.gallery.mainImage || { url: '/placeholder.jpeg' },
                subImages: Array.isArray(product.gallery.subImages)
                    ? product.gallery.subImages.map(img => ({
                        url: img?.url || '',
                        key: img?.key || ''
                    }))
                    : []
            } : {
                mainImage: { url: '/placeholder.jpeg' },
                subImages: []
            },
            quantity: product.quantity ? {
                variants: Array.isArray(product.quantity.variants)
                    ? product.quantity.variants.map(v => ({
                        price: v?.price || 0,
                        originalPrice: v?.originalPrice || 0,
                        color: v?.color || '',
                        size: v?.size || '',
                        weight: v?.weight || 0,
                        qty: v?.qty || 0,
                        optional: v?.optional || false
                    }))
                    : [{ 
                        price: 0, 
                        originalPrice: 0, 
                        color: '',
                        size: '',
                        weight: 0,
                        qty: 0,
                        optional: false 
                    }]
            } : {
                variants: [{ 
                    price: 0, 
                    originalPrice: 0,
                    color: '',
                    size: '',
                    weight: 0,
                    qty: 0,
                    optional: false 
                }]
            },
            coupons: activeCoupons,
            taxes: productTaxes,
            hasActiveCoupons: activeCoupons.length > 0,
            // For backward compatibility
            coupon: activeCoupons.length > 0 ? activeCoupons[0] : null
        };
    };

    // Extract products from the products array which contains product objects
    const products = brandCategory?.products?.length 
        ? brandCategory.products.map(item => ({
            ...item.product,  // Spread the populated product data
            _id: item.product?._id,  // Ensure we have the product ID
            active: item.product?.active !== false  // Ensure active status is checked
        }))
        : [];
    const visibleProducts = products
        .filter(prod => prod && prod.active !== false)
        .map(getCleanProduct)
        .filter(Boolean);
    
    if (!brandCategory) {
        return (
            <div className="min-h-screen bg-[#fcf7f1] flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold">Brand Category Not Found</h1>
                    <p>The requested brand category could not be found.</p>
                </div>
            </div>
        );
    }

    return (
        <SidebarInset>
            <div className="min-h-screen bg-[#fcf7f1]">
                {/* Brand Category Banner */}
                <div className="relative h-64 w-full">
                    <Image
                        src={brandCategory.banner?.url || `${process.env.NEXT_PUBLIC_BASE_URL}/placeholder.jpeg`}
                        alt={brandCategory.title}
                        fill
                        className="object-cover"
                        priority
                    />
                    <div className="absolute inset-0 flex items-end justify-end p-10">
                        <div className="text-center text-white">
                            <h1 className="text-4xl md:text-6xl font-bold mb-4">{brandCategory.title}</h1>
                            {brandCategory.brand?.title && (
                                <p className="text-xl md:text-2xl">By {brandCategory.brand.title}</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-6 w-full mt-4 px-2">
                    {/* Middle Section: Category Cards + Product */}
                    <div className="flex-1 min-w-0 gap-4 px-2">
                        {/* Category Cards Row - Keep existing category list */}
                        <div>
                            <h2 className="text-2xl font-bold px-4 underline">Shop by Category</h2>
                            <Carousel className="w-full mx-auto my-4">
                                <CarouselContent className="w-full gap-5">
                                    {Array.isArray(allCategories) && allCategories.flatMap(cat =>

                                        <CarouselItem key={`${cat._id || cat.title}`}
                                            className="basis-1/2 md:basis-1/6 lg:basis-1/6 min-w-0 snap-start">
                                            <CategoryCard category={{
                                                title: cat.title,
                                                profileImage: cat.profileImage,
                                                url: `/brands/${cat.slug}`
                                            }} />
                                        </CarouselItem>
                                    )}
                                </CarouselContent>
                                <CarouselNext className="!right-2 !top-1/2 !-translate-y-1/2 z-10" />
                                <CarouselPrevious className="!left-1 !top-1/2 !-translate-y-1/2 z-10" />
                            </Carousel>
                        </div>

                        <div className="h-[1px] bg-gray-300 my-4"></div>

                        {/* Brand Category Profile and Info */}
                        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 p-6 bg-white rounded-lg shadow-sm mb-8">
                            <div className="flex-1 text-center md:text-left">
                                <h2 className="text-2xl font-bold mb-2">Category Product For {brandCategory.title}</h2>
                                <CategoryProducts visibleProducts={visibleProducts} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </SidebarInset>
    );
};

export default BrandPage
