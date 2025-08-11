'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";

export function ViewFormPopup({ data, type, open, onOpenChange }) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto font-barlow">
                <DialogHeader>
                    <DialogTitle>
                        {type === 'package' ? 'Package Order' : type === 'custom' ? 'Custom Order' : 'Enquiry'} Details
                    </DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="order" className="mt-4">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="order">Order Info</TabsTrigger>
                        <TabsTrigger value="customer">Customer Details</TabsTrigger>
                        <TabsTrigger value="additional">Additional Info</TabsTrigger>
                    </TabsList>

                    <TabsContent value="order" className="font-barlow">
                        <div className="grid grid-cols-2 gap-4 mt-4">
                            <DetailItem label="Order ID" value={data?.orderId || data?.id} />
                            <DetailItem label="Travel Date" value={format(new Date(data?.travelDate || '10-10-2025'), 'dd MMM yyyy, hh:mm a')} />
                            <DetailItem label="Package" value={data?.packageId?.packageName || 'Custom Package'} />
                            {type !== 'enquiry' && (
                                <>
                                    <DetailItem label="Amount" value={`₹${data?.totalAmount?.toLocaleString('en-IN')}`} />
                                    <DetailItem label="Payment Method" value={data?.paymentMethod} />
                                    <DetailItem label="Status" value={data?.status} />
                                </>
                            )}
                            {type === 'enquiry' && (
                                <>
                                    <DetailItem label="Travel Date" value={format(new Date(data?.travelDate || '10-10-2025'), 'dd MMM yyyy')} />
                                    <DetailItem label="Pickup Location" value={data?.pickupLocation} />
                                </>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="customer" className="font-barlow">
                        <div className="grid grid-cols-2 gap-4 mt-4">
                            {type === 'package' && (
                                <>
                                    <DetailItem label="Name" value={data?.name} />
                                    <DetailItem label="Email" value={data?.email} />
                                    <DetailItem label="Phone" value={data?.phone} />
                                    <DetailItem label="Address" value={data?.address} />
                                    <DetailItem label="City" value={data?.city} />
                                    <DetailItem label="State" value={data?.state} />
                                    <DetailItem label="Pincode" value={data?.pincode} />
                                </>
                            )}
                            {type === 'custom' && (
                                <>
                                    <DetailItem label="Name" value={data?.formData?.name} />
                                    <DetailItem label="Email" value={data?.formData?.email} />
                                    <DetailItem label="Phone" value={data?.formData?.phone} />
                                    <DetailItem label="Address" value={data?.formData?.address} />
                                    <DetailItem label="City" value={data?.formData?.city} />
                                    <DetailItem label="State" value={data?.formData?.state} />
                                    <DetailItem label="Pincode" value={data?.formData?.pincode} />
                                </>
                            )}
                            {type === 'enquiry' && (
                                <>
                                    <DetailItem label="Name" value={data?.name} />
                                    <DetailItem label="Email" value={data?.email} />
                                    <DetailItem label="Phone" value={data?.phone} />
                                    <DetailItem label="Address" value={data?.address} />
                                    <DetailItem label="Apt Name" value={data?.aptName} />
                                    <DetailItem label="City" value={data?.city} />
                                    <DetailItem label="State" value={data?.state} />
                                    <DetailItem label="Pincode" value={data?.pincode} />
                                </>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="additional" className="font-barlow">
                        <div className="grid grid-cols-2 gap-4 mt-4">
                            {type === 'package' && (
                                <>
                                    <DetailItem label="Departure Location" value={data?.departureLocation} />
                                    <DetailItem label="Total Persons" value={data?.totalPerson} />
                                    <DetailItem label="Instructions" value={data?.instructions || 'None'} />
                                    {data?.packages?.basicDetails?.heliBooking === "Yes" && ['adults', 'children', 'infants'].map((group) => (
                                        data?.heliFormData?.[group]?.length > 0 && (
                                            <div key={group} className="col-span-2">
                                                <h4 className="text-lg font-semibold capitalize mb-2">{group}</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    {data?.heliFormData[group].map((person, index) => (
                                                        <div key={index} className="border p-3 rounded-md space-y-1">
                                                            <p><span className="font-medium">Name:</span> {person.fullName}</p>
                                                            <p><span className="font-medium">Age:</span> {person.age}</p>
                                                            <p><span className="font-medium">Weight:</span> {person.weight}</p>
                                                            {person.idProof?.url && (
                                                                <div className="mt-2">
                                                                    <p className="font-medium">ID Proof:</p>
                                                                    <img
                                                                        src={person.idProof.url}
                                                                        alt={`${person.fullName}'s ID`}
                                                                        className="w-full max-w-[200px] rounded border"
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )
                                    ))}
                                    {data?.heliFormData && (
                                        <>
                                            <DetailItem label="Passengers" value={`${data?.heliFormData?.numAdults || 0} Adults, ${data?.heliFormData?.numChildren || 0} Children`} />
                                            <DetailItem label="Pickup Location" value={data?.heliFormData?.pickupLocation} />
                                            <DetailItem label="Dropoff Location" value={data?.heliFormData?.dropoffLocation} />
                                            <DetailItem label="Medical Requirements" value={data?.heliFormData?.medicalRequirements || 'None'} />
                                            <DetailItem label="Special Requirements" value={data?.heliFormData?.specialRequirements || 'None'} />
                                        </>
                                    )}
                                </>
                            )}
                            {type === 'enquiry' && (
                                <>
                                    <DetailItem label="Adults" value={data?.adults} />
                                    <DetailItem label="Children" value={data?.children} />
                                    <DetailItem label="Extra Info" value={data?.extraInfo || 'None'} />
                                </>
                            )}
                            {type === 'custom' && (
                                <>
                                    <DetailItem label="Departure Location" value={data?.bookingDetails?.departureLocation} />
                                    {data?.heliFormData && (
                                        <>
                                            <DetailItem label="Passengers" value={`${data?.heliFormData?.numAdults || 0} Adults, ${data?.heliFormData?.numChildren || 0} Children`} />
                                            <DetailItem label="Medical Requirements" value={data?.heliFormData?.medicalRequirements || 'None'} />
                                            <DetailItem label="Special Requirements" value={data?.heliFormData?.specialRequirements || 'None'} />
                                        </>
                                    )}
                                    {['adults', 'children', 'infants'].map((group) => (
                                        data?.heliFormData?.[group]?.length > 0 && (
                                            <div key={group} className="col-span-2">
                                                <h4 className="text-lg font-semibold capitalize mb-2">{group}</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    {data?.heliFormData[group].map((person, index) => (
                                                        <div key={index} className="border p-3 rounded-md space-y-1">
                                                            <p><span className="font-medium">Name:</span> {person.fullName}</p>
                                                            <p><span className="font-medium">Age:</span> {person.age}</p>
                                                            <p><span className="font-medium">Weight:</span> {person.weight}</p>
                                                            {person.idProof?.url && (
                                                                <div className="mt-2">
                                                                    <p className="font-medium">ID Proof:</p>
                                                                    <img
                                                                        src={person.idProof.url}
                                                                        alt={`${person.fullName}'s ID`}
                                                                        className="w-full max-w-[200px] rounded border"
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )
                                    ))}
                                    {data?.customPackageForm && (
                                        <>
                                            <DetailItem label="Package Plan" value={data?.customPackageForm.packagePlan} />
                                            <DetailItem label="Meal Plan" value={data?.customPackageForm.mealPlan} />
                                            <DetailItem label="Vehicle Type" value={data?.customPackageForm.vehicleType} />
                                            <DetailItem label="Pickup City" value={data?.customPackageForm.pickupDetails?.city} />
                                            <DetailItem label="Dropoff City" value={data?.customPackageForm.dropoffDetails?.city} />
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}

function DetailItem({ label, value }) {
    return (
        <div className="space-y-1">
            <p className="text-sm font-medium text-gray-500">{label}</p>
            <p className="text-sm">{value || '-'}</p>
        </div>
    );
}