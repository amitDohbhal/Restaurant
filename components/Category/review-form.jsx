"use client"

import { useState } from "react"
import { CircleCheckBig, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useForm } from "react-hook-form"
import { useSession } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation";
import toast from "react-hot-toast"

const ReviewForm = ({ packageId, packageName, user }) => {
  const { register, setValue, handleSubmit, reset } = useForm()
  const { data: session, status } = useSession() // Get session and status
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const router = useRouter();
  const pathname = usePathname();

  const isUser = session?.user?.isAdmin === false || false

  const hasPurchased = user?.packages?.map(p => p.toString()).includes(packageId);

  const handleLogin = () => {
    router.push(`/sign-in?callbackUrl=${encodeURIComponent(pathname)}`);
  };

  const onSubmit = async (data) => {
    if (!isUser) return

    data.rating = rating
    data.packageName = packageName
    data.packageId = packageId
    data.email = session.user.email

    try {
      const response = await fetch("/api/saveReviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })
      const res = await response.json()
      if (response.ok) {
        reset()
        setRating(0)
        setIsSubmitting(false)
        setIsSubmitted(true)
        toast.success("Review Submitted!", { style: { borderRadius: "10px", border: "2px solid green" } });
        setTimeout(() => setIsSubmitted(false), 10000)
      } else {
        toast.error(res.message, { style: { borderRadius: "10px", border: "2px solid red" } });
      }
    } catch (error) {
      toast.error("Something went wrong", { style: { borderRadius: "10px", border: "2px solid red" } });
    }

  }

  // If the session is still loading, show a loading state
  if (status === "loading") {
    return <div>Loading...</div>
  }

  return (
    <div className="bg-blue-50 p-6 rounded-lg relative">
      {/* Overlay and login prompt if user is not logged in */}
      {!isUser && (
        <div className="absolute inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center rounded-lg z-10">
          <p className="text-xl font-semibold text-gray-700">
            Please <span onClick={handleLogin} className="text-blue-600 hover:underline cursor-pointer ">Sign in</span> to submit a review.
          </p>
        </div>
      )}
      {(!hasPurchased && isUser) && (
        <div className="absolute inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center rounded-lg z-10">
          <p className="text-xl font-semibold text-gray-700">
            You need to purchase this package to submit a review.
          </p>
        </div>
      )}

      {isSubmitted ? (
        <div className="text-center py-4">
          <CircleCheckBig className="w-16 h-16 text-green-600 mx-auto" />
          <h4 className="text-2xl font-semibold text-green-600">Thank you for your review!</h4>
          <p className="mt-1 text-lg font-medium text-gray-600">Your feedback has been submitted successfully.</p>
          <p className="mt-2 text-base font-medium text-gray-500">Your review is pending approval by the admin and will be published once reviewed.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="rating" className="block mb-2">
              Your Rating
            </Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="focus:outline-none"
                >
                  <Star
                    className={`h-6 w-6 ${star <= (hoveredRating || rating) ? "text-yellow-500 fill-yellow-500" : "text-black"
                      }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="comment" className="block mb-2">
              Your Review
            </Label>
            <Textarea
              id="comment"
              className="border-2 border-blue-600 focus-visible:ring-0"
              rows={4}
              {...register("message")}
              required
            />
          </div>

          <Button type="submit" disabled={isSubmitting || rating === 0 || !isUser || !hasPurchased} className="bg-blue-600 py-6 hover:bg-blue-700">
            {isSubmitting ? "Submitting..." : "Submit Review"}
          </Button>
        </form>
      )}
    </div>
  )
}

export default ReviewForm