"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { CalendarIcon, Users, Hotel, MapPin, CreditCard, Check, Car, House, Download, Banknote } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useRouter } from "next/navigation"

export default function PackageSummary({
  packagePlan,
  packageDetails,
  accommodationPlan,
  adults,
  adultPrice,
  childrenPrice,
  vehicleType,
  vehiclePrice,
  children,
  extraMattress,
  mattressTotal,
  pickupRequired,
  dropOffRequired,
  dropoffDetails,
  pickupDetails,
  totalPrice,
  travelDate,
  handlePayment,
  disabled,
  previewFormSave
}) {
  const [isSticky, setIsSticky] = useState(false)
  const router = useRouter()

  const advancePayment = Math.round(totalPrice * 0.25)

  // Handle sticky behavior on mobile
  useEffect(() => {
    const handleScroll = () => {
      const summaryElement = document.getElementById("package-summary")
      if (!summaryElement) return

      const rect = summaryElement.getBoundingClientRect()
      const isOutOfView = rect.bottom < 0

      setIsSticky(isOutOfView && window.innerWidth < 1024)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleDownloadPDF = async () => {
    if (!packageDetails) return
    try {
      await fetch(`/api/saveCustomOrderVisitors`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(previewFormSave)
      })
    } catch (error) {
      console.error(error)
    }
  
    // Open PDF in new tab
    window.open(`/package/calculator/pdf/${packageDetails._id}`, "_blank")
  }
  

  if (!packageDetails) return null

  const formatNumeric = (num) => new Intl.NumberFormat('en-IN').format(num)

  return (
    <form action={handlePayment} id="package-summary" className={`relative ${isSticky ? "lg:static" : ""}`}>
      <Card className="border-2 border-blue-600 overflow-hidden shadow-2xl">
        <CardHeader className="bg-blue-600/10 pb-4 space-y-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Package Summary
            </CardTitle>
            <Badge className={"font-semibold bg-blue-500 hover:bg-blue-700 uppercase tracking-widest text-white border-2 border-blue-600 py-2"}>
              {packagePlan || "Select Plan"}
            </Badge>
          </div>

          <div className="flex justify-between items-center pt-2">
            <span className="text-sm font-medium text-gray-600">
              {packageDetails.basicDetails.duration} days / {packageDetails.basicDetails.duration - 1} nights
            </span>
            {travelDate && (
              <span className="text-sm font-medium flex items-center gap-1">
                <CalendarIcon className="h-3.5 w-3.5" />
                {format(travelDate, "MMM d, yyyy")}
              </span>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-4">
          <div className="rounded-lg bg-blue-200/30 p-4 border border-blue-600/50">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="h-5 w-5 text-primary" />
              <span className="font-semibold text-lg">{packageDetails.packageName}</span>
            </div>

            <div className="space-y-2 pl-4">
              <div className="flex items-start gap-2">
                <Check className="h-6 w-6 text-primary mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Accommodation:</strong> {accommodationPlan}
                </span>
              </div>
            </div>

            {vehicleType && <div className="space-y-2 pl-4">
              <div className="flex items-start gap-2">
                <Car className="h-6 w-6 text-primary mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Vehicle Type:</strong> {vehicleType}
                </span>
              </div>
            </div>}

            {pickupDetails.vehicleType !== "" && <div className="space-y-2 pl-4">
              <div className="flex items-start gap-2">
                <Car className="h-6 w-6 text-primary mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Pickup Vehicle Type:</strong> {pickupDetails.vehicleType}
                </span>
              </div>
            </div>}

            {pickupDetails.city !== "" && <div className="space-y-2 pl-4">
              <div className="flex items-start gap-2">
                <House className="h-6 w-6 text-primary mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Pickup City:</strong> {pickupDetails.city}
                </span>
              </div>
            </div>}

            {dropoffDetails.vehicleType !== "" && <div className="space-y-2 pl-4">
              <div className="flex items-start gap-2">
                <Car className="h-6 w-6 text-primary mt-0.5 flex-shrink-0" />
                <span>
                  <strong>DropOff Vehicle Type:</strong> {dropoffDetails.vehicleType}
                </span>
              </div>
            </div>}

            {dropoffDetails.city !== "" && <div className="space-y-2 pl-4">
              <div className="flex items-start gap-2">
                <House className="h-6 w-6 text-primary mt-0.5 flex-shrink-0" />
                <span>
                  <strong>DropOff City:</strong> {dropoffDetails.city}
                </span>
              </div>
            </div>}
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <span className="font-semibold">Charges</span>
            </div>

            <div className="pl-7 space-y-2">
              <div className="flex justify-between">
                <span>
                  {adults} {adults <= 1 ? "Adult" : "Adults"}
                </span>
                <span className="text-muted-foreground font-semibold">
                  ₹{formatNumeric(adultPrice || 0)}
                </span>
              </div>

              {children > 0 && (
                <div className="flex justify-between">
                  <span>
                    {children} {children <= 1 ? "Child" : "Children"}
                  </span>
                  <span className="text-muted-foreground font-semibold">
                    ₹{formatNumeric(childrenPrice || 0)}
                  </span>
                </div>
              )}
              {vehicleType && (
                <div className="flex justify-between">
                  <span>
                    {vehicleType} {vehicleType <= 1 ? "Vehicle" : "Vehicles"}
                  </span>
                  <span className="text-muted-foreground font-semibold">
                    ₹{formatNumeric(vehiclePrice || 0)}
                  </span>
                </div>
              )}

              {extraMattress > 0 && (
                <div className="flex justify-between">
                  <span>
                    {extraMattress} Extra {extraMattress <= 1 ? "Mattress" : "Mattresses"}
                  </span>
                  <span className="text-muted-foreground font-semibold">₹{formatNumeric(mattressTotal || 0)}</span>
                </div>
              )}
            </div>
          </div>

          {(pickupRequired) && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Hotel className="h-5 w-5 text-primary" />
                <span className="font-semibold">Transfer Services</span>
              </div>

              <div className="pl-7 space-y-2">
                {pickupRequired && (
                  <div className="flex justify-between">
                    <span>Pickup Service Charge</span>
                    <span className="text-muted-foreground font-semibold">₹{formatNumeric(pickupDetails.vehiclePrice || 0)}</span>
                  </div>
                )}

                {dropOffRequired && (
                  <div className="flex justify-between">
                    <span>Drop-off Service Charge</span>
                    <span className="text-muted-foreground font-semibold">₹{formatNumeric(dropoffDetails.vehiclePrice || 0)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="pt-4 mt-2 border-t">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">Total Price:</span>
              <div className="text-right">
                <span className="text-2xl font-bold text-blue-600">₹<span className="text-3xl">{formatNumeric(totalPrice)}</span></span>
                <div className="text-xs text-muted-foreground">All taxes included</div>
              </div>
            </div>
          </div>
          <div className="pt-4 mt-2 border-t">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">Advance Payment (25%):</span>
              <div className="text-right">
                <span className="text-2xl font-bold text-blue-600">₹<span className="text-3xl">{formatNumeric(advancePayment)}</span></span>
                <div className="text-xs text-muted-foreground">Payable now to confirm booking</div>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="bg-muted/20 pt-4 flex flex-col gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className={`w-full ${disabled ? 'cursor-not-allowed' : ''}`}>
                  <Button
                    type="button"
                    onClick={handleDownloadPDF}
                    className="w-full bg-blue-600 text-lg hover:bg-blue-700 uppercase"
                    size="lg"
                    disabled={disabled}
                  >
                    <Download /> Preview Form PDF
                  </Button>
                </span>
              </TooltipTrigger>

              {/* Tooltip content displayed when the button is disabled */}
              {disabled && (
                <TooltipContent className="font-barlow bg-blue-600">
                  <p>Please fill all required fields to enable PDF download</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className={`w-full ${disabled ? 'cursor-not-allowed' : ''}`}>
                  <Button
                    type="submit"
                    className="w-full bg-blue-600 text-lg hover:bg-blue-700 uppercase"
                    size="lg"
                    disabled={disabled}
                  >
                    <Banknote />  Pay ₹{formatNumeric(advancePayment)} Now
                  </Button>
                </span>
              </TooltipTrigger>

              {/* Tooltip content displayed when the button is disabled */}
              {disabled && (
                <TooltipContent className="font-barlow bg-blue-600">
                  <p>Please fill all required fields to enable payment</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </CardFooter>
      </Card>

      {/* Mobile sticky summary */}
      {isSticky && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-primary/20 p-4 shadow-lg flex flex-col justify-between items-center lg:hidden z-50">
          <div>
            <div className="font-semibold">{packageDetails.packageName}</div>
            <div className="text-2xl font-bold text-blue-600">Total: ₹{formatNumeric(totalPrice)}</div>
          </div>
          <Button disabled type="submit" className="disabled:cursor-not-allowed w-full bg-blue-600 text-lg hover:bg-blue-700 uppercase"><Banknote />  Pay ₹{formatNumeric(advancePayment)} (25%) Now</Button>
        </div>
      )}
    </form>
  )
}