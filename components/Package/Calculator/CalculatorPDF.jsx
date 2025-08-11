'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Image from "next/image"
import ItinerarySchedule from "./ItinerarySchedule"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

const CalculatorPDF = ({ packages, plans, customOrderVisitors }) => {
    const formatNumber = (num) => {
        return new Intl.NumberFormat('en-IN').format(num)
    }

    return (
        <div className="min-h-screen mb-20 font-barlow p-4 mx-auto print:p-0">
            <div className="relative h-[300px] md:h-[300px] rounded-xl overflow-hidden w-fit print:hidden">
                <Image
                    src={packages.basicDetails?.imageBanner?.url || "https://dummyimage.com/600x400/000/fff"}
                    alt={packages.packageName}
                    width={1920}
                    height={1080}
                    quality={50}
                    className="object-cover"
                    priority
                />
            </div>


            <Card className="mt-4 print:mt-0">
                <CardHeader>
                    <Image src="/logo.png" alt="logo" width={200} height={200} className="w-[10rem] mt-4 hidden print:block" />
                    <CardTitle className="text-2xl font-bold">{packages.packageName}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2 flex items-center gap-8">
                            <p className=" flex flex-col"><span className="font-semibold">Tour Duration:</span> {packages.basicDetails?.duration}</p>
                            <p className=" flex flex-col"><span className="font-semibold">Destination:</span> {packages.basicDetails?.location}</p>
                        </div>

                        <div className="md:col-span-2"><span className="font-semibold">Package Overview:</span> <p className="prose max-w-none">
                            <span className="mb-4 capitalize font-semibold text-justify whitespace-pre-line" dangerouslySetInnerHTML={{ __html: packages.basicDetails?.smallDesc }} />
                        </p></div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="mt-4 h-fit">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold">Updated Itinerary Plan Price Chart</CardTitle>
                    </CardHeader>
                    <CardContent className="max-w-2xl">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="font-bold">#</TableHead>
                                    <TableHead className="font-bold">Particular</TableHead>
                                    <TableHead className="font-bold">Description</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="font-semibold">
                                <TableRow >
                                    <TableCell className="!py-4">1</TableCell>
                                    <TableCell>Package Plan Type</TableCell>
                                    <TableCell>{customOrderVisitors.customPackageForm.packagePlan}</TableCell>
                                </TableRow>
                                <TableRow >
                                    <TableCell className="!py-4">2</TableCell>
                                    <TableCell>Accommodation Plan</TableCell>
                                    <TableCell className="uppercase">{customOrderVisitors.customPackageForm.mealPlan}</TableCell>
                                </TableRow>
                                <TableRow >
                                    <TableCell className="!py-4">3</TableCell>
                                    <TableCell>No. of Adult</TableCell>
                                    <TableCell>{customOrderVisitors.customPackageForm.numAdults}</TableCell>
                                </TableRow>
                                <TableRow >
                                    <TableCell className="!py-4">4</TableCell>
                                    <TableCell>No. of Child</TableCell>
                                    <TableCell>{customOrderVisitors.customPackageForm.numChildren}</TableCell>
                                </TableRow>
                                <TableRow >
                                    <TableCell className="!py-4">5</TableCell>
                                    <TableCell>No. of Mattress</TableCell>
                                    <TableCell>{customOrderVisitors.customPackageForm.numMattress}</TableCell>
                                </TableRow>
                                <TableRow >
                                    <TableCell className="!py-4">6</TableCell>
                                    <TableCell>Vehicle Category Type</TableCell>
                                    <TableCell>{customOrderVisitors.customPackageForm.vehicleType}</TableCell>
                                </TableRow>
                                <TableRow >
                                    <TableCell className="!py-4">7</TableCell>
                                    <TableCell>Pick Up</TableCell>
                                    <TableCell>{customOrderVisitors.customPackageForm.pickupDetails.city}:{customOrderVisitors.customPackageForm.pickupDetails.vehicleType}</TableCell>
                                </TableRow>
                                <TableRow >
                                    <TableCell className="!py-4">8</TableCell>
                                    <TableCell>Drop Off</TableCell>
                                    <TableCell>{customOrderVisitors.customPackageForm.dropoffDetails.city}:{customOrderVisitors.customPackageForm.dropoffDetails.vehicleType}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                        <div className="flex flex-col items-start justify-end gap-2 mt-8">
                            <p><span className="font-semibold">Total Package Price:</span> ₹<span className="font-bold text-xl text-blue-600">{formatNumber(customOrderVisitors.totalAmount)}</span></p>
                            <p className="text-red-600"><span className="font-semibold">Note:</span> The tour package pricing and the minimum rate indicated above may change based on the hotels and transportation options available on that particular date.</p>
                        </div>
                    </CardContent>
                </Card>
                <div className="mt-4 print:break-before-page">
                    <ItinerarySchedule packageDetails={packages} packagePlan={'Budget'} allPlans={plans} pickupRequired={customOrderVisitors.customPackageForm.pickupRequired}
                        pickupDetails={customOrderVisitors.customPackageForm.pickupDetails}
                        dropOffRequired={customOrderVisitors.customPackageForm.dropoffRequired}
                        dropoffDetails={customOrderVisitors.customPackageForm.dropoffDetails} />
                </div>
            </div>

            <Card className="mt-4 print:break-before-page">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold">Include/Exclude</CardTitle>
                </CardHeader>
                <CardContent>
                    {packages.info?.filter((info) => info.typeOfSelection === "Inclusions").length > 0 && (
                        <div className="flex md:flex-row flex-col items-start justify-evenly gap-6">
                            {/* Inclusions */}
                            <div className="w-full overflow-x-auto">
                                <h3 className="text-2xl font-bold mb-4">• Inclusions</h3>
                                <table className="min-w-full table-auto border-collapse">
                                    <thead>
                                        <tr className="bg-gray-100">
                                            <th className="border px-4 py-2 text-left">#</th>
                                            <th className="border px-4 py-2 text-left">Description</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {packages.info
                                            ?.filter((info) => info.typeOfSelection === "Inclusions")
                                            ?.map((item, index) =>
                                                item.selectionDesc.split("\n")?.map((line, lineIndex) => (
                                                    <tr key={`${index}-${lineIndex}`} className="border-t">
                                                        <td className="border px-4 py-2 text-left">{lineIndex + 1}</td>
                                                        <td className="border px-4 py-2 text-left">{line}</td>
                                                    </tr>
                                                ))
                                            )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Exclusions */}
                            <div className="w-full overflow-x-auto">
                                <h3 className="text-2xl font-bold mb-4">• Exclusions</h3>
                                <table className="min-w-full table-auto border-collapse">
                                    <thead>
                                        <tr className="bg-gray-100">
                                            <th className="border px-4 py-2 text-left">#</th>
                                            <th className="border px-4 py-2 text-left">Description</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {packages.info
                                            ?.filter((info) => info.typeOfSelection === "Exclusions")
                                            ?.map((item, index) =>
                                                item.selectionDesc.split("\n")?.map((line, lineIndex) => (
                                                    <tr key={`${index}-${lineIndex}`} className="border-t">
                                                        <td className="border px-4 py-2 text-left">{lineIndex + 1}</td>
                                                        <td className="border px-4 py-2 text-left">{line}</td>
                                                    </tr>
                                                ))
                                            )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="mt-4 print:break-before-page">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold">Day Plan as Per Standard Itinerary</CardTitle>
                </CardHeader>
                <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                        {packages.info?.filter((info) => info.typeOfSelection === "Day Plan")?.map((day) => (
                            <AccordionItem key={day._id} value={`day-${day.selectionTitle}`} className="my-4 border-black ">
                                <AccordionTrigger className="text-left px-4 rounded-xl !no-underline">
                                    <div>
                                        <span className="font-bold text-lg">{day.selectionTitle}</span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <p className="py-2 px-6 text-base whitespace-pre-line">{day.selectionDesc}</p>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </CardContent>
            </Card>

            <Card className="mt-4 print:break-before-page">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold">
                        Terms and Conditions Of Services
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                    <ul className="list-disc list-inside space-y-1">
                        <li>Once the booking is done and advance paid, minimum 10% of the package cost to be deducted.</li>
                        <li>If postponed or preponed of the service date made on or before 30 days, only 5% of the package cost.</li>
                        <li>30 days before of service starts, 20% of the total package cost will be deducted.</li>
                        <li>From 29 days up to 15 days before of service, 40% of total cost will be deducted.</li>
                        <li>From 14 days up to 10 days before of service, 50% of total cost will be deducted.</li>
                        <li>From 09 days up to 06 days before of service, 60% of total cost will be deducted.</li>
                        <li>From 05 days up to 48hrs before of service, 90% of total cost will be deducted.</li>
                        <li>Between 48 hours to the day of service starts, 100% of total cost will be deducted.</li>
                        <li>In case of NO SHOW, 100% of the total cost will be deducted.</li>
                    </ul>
                </CardContent>
            </Card>


            <Card className="mt-4 print:break-before-page">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold">Our Banking Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="font-bold">#</TableHead>
                                <TableHead className="font-bold">Particular</TableHead>
                                <TableHead className="font-bold">Description</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="font-semibold">
                            <TableRow >
                                <TableCell className="!py-4">1</TableCell>
                                <TableCell>Account Name</TableCell>
                                <TableCell>M/S Yatra Zone</TableCell>
                            </TableRow>
                            <TableRow >
                                <TableCell className="!py-4">2</TableCell>
                                <TableCell>Account Number</TableCell>
                                <TableCell>XXXX XXXX XX XX XX</TableCell>
                            </TableRow>
                            <TableRow >
                                <TableCell className="!py-4">3</TableCell>
                                <TableCell>Bank Name</TableCell>
                                <TableCell>Axis Bank</TableCell>
                            </TableRow>
                            <TableRow >
                                <TableCell className="!py-4">4</TableCell>
                                <TableCell>Account Type</TableCell>
                                <TableCell>Current / Business Account</TableCell>
                            </TableRow>
                            <TableRow >
                                <TableCell className="!py-4">5</TableCell>
                                <TableCell>Bank IFSC Code</TableCell>
                                <TableCell>AXIS 0000 00</TableCell>
                            </TableRow>
                            <TableRow >
                                <TableCell className="!py-4">6</TableCell>
                                <TableCell>Bank Address</TableCell>
                                <TableCell>Rishikesh, Uttarakhand, India</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Card className="mt-4 print:break-before-page">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold">
                        Our Agreement: Important Notice
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                    <p>
                        By accessing, using, browsing or booking through our Web Site(s) or Directly or indirectly through YatraDwar Your Spiritual Travel Solution or its representative(s), you agree that you have read, understood and agree to be bound by these terms and conditions privacy and you agree to comply with all applicable laws, rules and regulations. By accepting our booking terms & conditions, user is also agreeing to terms & conditions of the Spiritual Travel, Hotels, aviation services, Airlines and other associate service provider from us. All services are neither legal or illegal, modify, change, cancel or vary due to these Policies/Rules or the arrangements and context found on our website from time to time in particular pages. Please check our website regularly for updates to Policy/Rules. Any modification to these Policy/Rules that occurs before your departure is considered a part of your reservations agreement with us.
                    </p>
                    <p>
                        <em>*Kindly read T&C Policy and all remarks carefully before making your bookings. Once you made your booking you bound to accept these Terms and Conditions.</em>
                        <br />
                        The information contained in this Web Site is intended solely to provide general information for the personal use of the reader, who accepts full responsibility for its use. While we have made every attempt to verify the correctness, or the results obtained from the use of this information. All information is provided in “as-is” principle, including but not limited to completeness, accuracy, timeliness, or of the results obtained from the use of this information, and without warranty of any kind, expressed or implied. It is no guarantee of merchantability or of fitness for a particular purpose. Nothing herein shall to any contracts, unless in the independent written agreement executed and sanctioned by verified business judgement of the reader. YatraDwar reserves the right to change the terms, conditions and notices under which the Services are offered through the Website, including but not limited to the charges for the Services provided through the Website. The User shall be responsible for regularly reviewing these terms and conditions.
                    </p>
                </CardContent>
            </Card>
            <div className="flex justify-center mt-6 print:hidden">
                <button
                    onClick={() => window.print()}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-all"
                >
                    🖨️ Print this Page
                </button>
            </div>

        </div>
    )
}

export default CalculatorPDF