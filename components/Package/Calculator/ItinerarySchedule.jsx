import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Hotel, Calendar, ArrowRight } from "lucide-react";

export default function ItinerarySchedule({ packageDetails, packagePlan, allPlans, pickupDetails, dropoffDetails, pickupRequired, dropOffRequired }) {
  if (!packageDetails || !packagePlan || !allPlans) return null;

  // Find the plan that matches the packagePlan
  const matchedPlan = allPlans.find(plan => plan.planName === packagePlan);

  return (
    <Card className="overflow-hidden border-2 border-blue-300 shadow-2xl">
      <CardHeader className="bg-blue-600/10 pb-4">
        <CardTitle className="flex flex-col lg:flex-row items-center gap-2">
          <div>
            <Calendar className="h-5 w-5" />
          </div>
          Your Updated Itinerary Schedule: Such as day schedule, hotel accommodation with meal plan, vehicle option on available dates.
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {pickupRequired === "Yes" && <div className={`p-4 transition-colors hover:bg-blue-600/5`}>
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600/25 text-primary font-bold">
                  0
                </div>
                <div className="font-medium w-[90%]">
                  <p>Day of arrival ( Day 0 Not Include In This Package ) : Greetings to all visitors arriving at the <span className="font-semibold text-blue-600">{packageDetails.createPlanType[0].city} : {pickupDetails.vehicleType}</span>.</p>
                  <p className="pt-2">All guests should receive pleasantries from the executive Yatrazone before heading to the location or hotel for the night's stay.</p>
                  <p className="pt-2">Arrival and Check-in: Depending on your time of arrival, you will check into your hotel or guest house.  <span className="font-semibold text-blue-600">{packageDetails.createPlanType[0].city}</span> has a range of accommodations, from budget-friendly to more luxurious options.
                  </p>
                  <p className="pt-2">Arrive at a hotel you've reserved in advance for dinner and the night stay. The same hotel or one comparable, lodging with a meal plan. Later, a city tour.
                  </p>
                  <p className="pt-2">Overnight Stay: Return to your accommodation for a restful night, preparing for the next day's spiritual journey.  The Journey Begins.</p>
                </div>
              </div>
            </div>
          </div>}
          {packageDetails.createPlanType.map((plan, index) => {
            const dayNumber = index + 1;
            const isLastDay = dayNumber === packageDetails.createPlanType.length;
            const cityName = plan.city;

            // Find the city in the matched plan
            const matchedCity = matchedPlan?.cities.find(c => c.city === cityName);
            const hotelName = matchedCity ? matchedCity.hotelName : "Hotel Not Available";

            return (
              <div key={plan._id} className={`p-4 transition-colors ${isLastDay ? "bg-blue-200" : "hover:bg-blue-600/5"}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600/25 text-primary font-bold">
                      {dayNumber}
                    </div>
                    <div className="font-medium">{plan.day}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-bold text-blue-600 text-lg">{cityName}</span>
                  </div>
                </div>

                <div className="ml-5 pl-5 border-l-2 border-dashed border-primary/20 mt-2 mb-1 py-1">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Hotel className="h-5 w-5 text-primary" />
                    <ArrowRight className="h-3 w-3 mr-2" />
                    {!isLastDay ? (
                      <span>Overnight stay at <span className="font-medium text-blue-600">{hotelName}</span></span>
                    ) : (
                      <span className="font-medium text-blue-600">N/A - Departure Day</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {dropOffRequired === "Yes" && <div className={`p-4 transition-colors hover:bg-blue-600/5`}>
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600/25 text-primary font-bold">
                  5
                </div>
                <div className="font-medium w-[90%]">
                  <p>Your journey with us comes to a delightful end as we arrive at your desired destination <span className="font-semibold text-blue-600">{dropoffDetails.city}: {dropoffDetails.vehicleType}</span>. We sincerely thank you for traveling with us and wish you all the best for your next adventure. May your future journeys be filled with joy and wonderful experiences. This tour officially concludes here.</p>
                </div>
              </div>
            </div>
          </div>}
        </div>
      </CardContent>
    </Card>
  );
}
