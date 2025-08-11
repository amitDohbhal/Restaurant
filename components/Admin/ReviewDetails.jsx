"use client"

import { useState } from "react"
import Image from "next/image"
import { format } from "date-fns"
import { Star, Calendar, Package, MessageSquare, Mail, ImageDown, ImageIcon } from "lucide-react"
import { Dialog, DialogContent, DialogFooter, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

// Helper function to convert rating to array of stars
const getRatingStars = (rating) => {
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 >= 0.5
    const stars = []

    // Add full stars
    for (let i = 0; i < fullStars; i++) {
        stars.push(<Star key={`full-${i}`} className="w-4 h-4 sm:w-5 sm:h-5 fill-yellow-400 text-yellow-400" />)
    }

    // Add half star if needed
    if (hasHalfStar) {
        stars.push(
            <div key="half" className="relative">
                <Star className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
                <div className="absolute top-0 left-0 overflow-hidden w-1/2">
                    <Star className="w-4 h-4 sm:w-5 sm:h-5 fill-yellow-400 text-yellow-400" />
                </div>
            </div>,
        )
    }

    // Add empty stars
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)
    for (let i = 0; i < emptyStars; i++) {
        stars.push(<Star key={`empty-${i}`} className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300" />)
    }

    return stars
}


const ReviewDetails = ({ review, onClose, onUpdate }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    if (!review) return null;

    // Ensure we have proper data
    const safeReview = {
        ...review,
        _id: review._id?.toString(),
        product: typeof review.product === 'string' ? { _id: review.product } : (review.product || null),
        artisan: typeof review.artisan === 'string' ? { _id: review.artisan } : (review.artisan || null),
        thumb: review.thumb?.url ? review.thumb : null,
        createdAt: review.createdAt || new Date().toISOString(),
        updatedAt: review.updatedAt || new Date().toISOString()
    };
    // In ReviewDetails.jsx - Update the reviewTarget logic
    const reviewType = review.type === 'product' ? 'Product' : 'Artisan';
    const reviewTarget = review.type === 'product'
        ? (review.product?.title || 'Product')
        : (review.artisan?.name || 'Artisan');

    // Format date if it exists and is valid
    const formattedDate = safeReview.createdAt ? format(new Date(safeReview.createdAt), "MMM dd, yyyy") : "Date not available";

    return (
        <Dialog open={!!review} onOpenChange={onClose}>
            <DialogContent className="max-w-[95vw] sm:max-w-lg md:max-w-2xl p-0 overflow-hidden">
                <DialogTitle className="sr-only">Review Details</DialogTitle>

                <div className="pt-4 sm:pt-4 px-4 sm:px-6 pb-4 sm:pb-6">
                    <div className="flex flex-col items-center sm:flex-row sm:items-center gap-2 sm:gap-4">
                        <div className="flex items-center justify-between w-full">
                            <div>
                                <h2 className="text-xl sm:text-2xl font-bold">{review.name}</h2>
                            </div>
                            <Badge
                                variant="outline"
                                className="bg-blue-50 mr-8 text-blue-700 border-blue-200 flex items-center gap-1 text-xs w-fit"
                            >
                                <Calendar className="w-3 h-3" />
                                {formattedDate}
                            </Badge>
                        </div>
                    </div>

                    <Separator className="my-4 sm:my-6" />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-6">
                        <div>
                            <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                                <Package className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                                Review Title:
                            </h3>
                            <p className="text-base sm:text-lg font-medium mt-1 sm:mt-2 px-5">{review.title}</p>
                        </div>

                        <div>
                            <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                                <Star className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                                Rating
                            </h3>
                            <div className="flex items-center gap-2 mt-1 sm:mt-2">
                                <div className="flex">{getRatingStars(review.rating)}</div>
                                <span className="text-xs sm:text-sm text-gray-600">({review.rating}/5)</span>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                                <Star className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                                Type:
                            </h3>
                            <div className="flex items-start flex-col gap-2 mt-1 sm:mt-2">
                                <p className="text-md font-bold">Review From : {reviewType}</p>
                                
                                <h3 className="text-lg font-medium">Review for: {reviewTarget}</h3>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 sm:mt-6">
                        <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                            <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                            Thumb Image
                        </h3>
                        <div className="mt-1 sm:mt-2 p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200">
                            {review.thumb && review.thumb.url ? (
                                <Image
                                    src={review.thumb?.url}
                                    alt="thumb"
                                    width={100}
                                    height={100}
                                    className="object-cover rounded border shadow"
                                />
                            ) : '-'}
                        </div>
                    </div>

                    <div className="mt-4 sm:mt-6">
                        <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                            Message
                        </h3>
                        <div className="mt-1 sm:mt-2 p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="italic text-sm sm:text-base text-gray-700 max-h-24 overflow-y-auto">{review.description}</p>
                        </div>
                    </div>
                </div>

                <DialogFooter className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 border-t flex-col sm:flex-row gap-2 sm:gap-3">
                    <Button variant="outline" onClick={onClose} className="sm:order-1 w-full sm:w-auto">
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default ReviewDetails