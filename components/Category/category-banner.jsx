import Image from "next/image"
import Link from "next/link"

const CategoryBanner = ({ title, bannerImage, subCategory }) => {
  return (
    <div className="relative w-full h-[150px] md:h-[300px] bg-gray-100">
      {/* Background image - only render if bannerImage exists */}
      {bannerImage && (
        <Image
          src={bannerImage}
          alt={title || 'Category banner'}
          fill
          className="object-cover w-full h-full"
          quality={100}
          priority
        />
      )}

      {/* Text on right-bottom */}
      <div className="absolute bottom-6 right-6 text-white text-right">
        <div className="text-sm md:text-xl font-medium mt-1">
          <Link href="/" className="hover:underline px-1">Home</Link>
          {title && <span className="px-1">|</span>}
          {title && <span>{title}</span>}
        </div>
      </div>
    </div>
  )
}

export default CategoryBanner
