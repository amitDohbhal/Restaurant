import Image from "next/image"
import Link from "next/link"

const CategoryBanner = ({ title, bannerImage, mainCategory, subCategory }) => {
  return (
    <div className="relative w-full h-[100px] md:h-[300px]">
      {/* Background image */}
      <Image
        src={bannerImage}
        alt={title || mainCategory}
        fill
        className="object-cover w-full h-full"
        quality={100}
        priority
      />

      {/* Text on right-bottom */}
      <div className="absolute bottom-6 right-6 text-white text-right">
        <h1 className="text-xl md:text-5xl font-extrabold drop-shadow">
          {mainCategory|| "Main Category Name"}
        </h1>
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
