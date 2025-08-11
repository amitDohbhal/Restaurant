// 👇 Add this at the top to force server-side rendering
export const dynamic = "force-dynamic";

import { SidebarInset } from "@/components/ui/sidebar";
import ResponsiveFeaturedCarousel from "@/components/ResponsiveFeaturedCarousel";

import { CategoryCarousel } from "@/components/Category/category-card";
import connectDB from "@/lib/connectDB";
import Product from "@/models/Product";

import ProductDetailView from "@/components/ProductDetailView";
import ProductVideo from "@/components/ProductVideo";
import ProductInfoTabs from "@/components/ProductInfoTabs";
import StickyAddToCartBar from "@/components/StickyAddToCartBar";
import Price from '@/models/Price';
import Gallery from '@/models/Gallery';
import Video from '@/models/Video';
import Description from '@/models/Description';
import Info from '@/models/Info';
import Size from '@/models/Size';
import CategoryTag from '@/models/CategoryTag';
import ProductReview from '@/models/ProductReview';
import ProductTax from '@/models/ProductTax';
import ProductCoupons from '@/models/ProductCoupons';
import Quantity from '@/models/Quantity';
import Color from '@/models/Color';
import PackagePdf from "@/models/PackagePdf"
import ProductTagLine from '@/models/ProductTagLine';
const ProductDetailPage = async ({ params }) => {
    await connectDB();
  
    const { slug } = await params;
const decodedId = decodeURIComponent(slug);
    const rawProduct = await Product.findOne({ slug: decodedId })
    .populate('size price gallery video description info categoryTag productTagLine reviews quantity coupons taxes pdfs')
    .lean();
  
  // ✅ Convert to plain JSON
  const product = JSON.parse(JSON.stringify(rawProduct));
  
    if (!product || !product.active) {
      return (
        <div className="text-center py-10">
          <h1 className="text-2xl font-bold mb-2">Product Not Available</h1>
          <p>This product may be disabled or removed by admin.</p>
        </div>
      );
    }

  // ✅ Frequently Bought Together
  let frequentlyBoughtTogether = [];
  try {
    const fbtRes = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/product/frequentlyBoughtTogether?id=${product._id}`,
      { cache: 'no-store' }
    );
    if (fbtRes.ok) {
      frequentlyBoughtTogether = await fbtRes.json();
    }
  } catch (error) {
    console.error("Error fetching FBT:", error.message);
  }

  // ✅ Fetch Categories
  let allCategories = [];
  try {
    if (product.category) {
      const allCategoriesRes = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/getAllMenuItems`,
        { cache: 'no-store' }
      );
      if (!allCategoriesRes.ok) throw new Error("Categories fetch failed");
      allCategories = await allCategoriesRes.json();
    }
  } catch (error) {
    console.error("Error fetching categories:", error.message);
  }

  // ✅ Render Product Detail Page
  return (
    <SidebarInset>
      <div className="w-full py-8 flex flex-col">
        <div className="space-y-4 px-4">
          {/* ✅ Force rerender when navigating between products */}
          <ProductDetailView key={product._id} product={product} />
        </div>
        <div className="space-y-4">
          <ProductVideo product={product} />
        </div>
        <div className="space-y-4">
          <ProductInfoTabs product={product} />
        </div>

        {frequentlyBoughtTogether.length > 0 && (
          <div className="mt-8 px-4 py-10 bg-[#FCF7F1]">
            <h2 className="text-2xl underline md:text-3xl font-semibold px-5 md:px-10">Frequently Bought Together</h2>
            <ResponsiveFeaturedCarousel products={frequentlyBoughtTogether} />
          </div>
        )}

        {allCategories.length > 0 && (
          <div className="mt-8 px-4 py-5">
            <h2 className="text-2xl md:text-3xl font-semibold md:px-10 px-5 underline">Categories</h2>
            <CategoryCarousel
              categories={allCategories.flatMap(cat =>
                Array.isArray(cat.subMenu)
                  ? cat.subMenu.map(sub => ({
                      title: sub.title,
                      profileImage: sub.profileImage,
                      url: `/category/${sub.url}`
                    }))
                  : []
              )}
            />
          </div>
        )}

        <StickyAddToCartBar product={product} />
      </div>
    </SidebarInset>
  );
};

export default ProductDetailPage;
