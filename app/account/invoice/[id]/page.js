import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import InvoicePage from "@/components/MyAccount/Invoice";
import connectDB from "@/lib/connectDB";
import CustomOrder from "@/models/CustomOrder";
import Order from "@/models/Order";
import Package from "@/models/Package";
import { getServerSession } from "next-auth";

const page = async ({ params }) => {
    const session = await getServerSession(authOptions);
    const { id } = await params;
    
    try {
        await connectDB();

        // Fetch orders from the Order collection
        const orders = await Order.aggregate([
            { $match: { orderId: id } },
            {
                $lookup: {
                    from: 'packages',
                    localField: 'packageId',
                    foreignField: '_id',
                    as: 'package',
                },
            },
            {
                $unwind: {
                    path: '$package',
                    preserveNullAndEmptyArrays: true // Add this to preserve empty packages
                }
            },
            {
                $project: {
                    _id: { $toString: '$_id' },
                    packageId: { $toString: '$packageId' },
                    userId: { $toString: '$userId' },
                    name: 1,
                    email: 1,
                    phone: 1,
                    address: 1,
                    extraAddressInfo: 1,
                    city: 1,
                    state: 1,
                    pincode: 1,
                    orderId: 1,
                    createdAt: 1,
                    amount: 1,
                    travelDate: 1,
                    totalPerson: 1,
                    status: 1,
                    paymentMethod: 1,
                    transactionId: 1,
                    'package._id': { $toString: '$package._id' },
                    'package.packageName': 1,
                    'package.basicDetails.duration': 1,
                    'package.packageCode': 1,
                },
            },
        ]);

        // Fetch custom orders from the CustomOrder collection
        const customOrders = await CustomOrder.aggregate([
            { $match: { orderId: id } },
            {
                $lookup: {
                    from: 'packages',
                    localField: 'packageId',
                    foreignField: '_id',
                    as: 'package',
                },
            },
            {
                $unwind: {
                    path: '$package',
                    preserveNullAndEmptyArrays: true // Add this to preserve empty packages
                }
            },
            {
                $project: {
                    _id: { $toString: '$_id' },
                    packageId: { $toString: '$packageId' },
                    userId: { $toString: '$userId' },
                    orderId: 1,
                    transactionId: 1,
                    paymentMethod: 1,
                    createdAt: 1,
                    amount: 1,
                    status: 1,
                    'package._id': { $toString: '$package._id' },
                    'package.packageName': 1,
                    'package.basicDetails.duration': 1,
                    'package.packageCode': 1,
                    'formData.name': 1,
                    'formData.email': 1,
                    'formData.phone': 1,
                    'formData.city': 1,
                    'formData.state': 1,
                    'formData.pincode': 1,
                    'formData.address': 1,
                    'formData.extraAddressInfo': 1,
                    'bookingDetails.travelDate': 1,
                    'bookingDetails.departureLocation': 1,
                    totalPerson: {
                        $sum: [
                            { $size: '$heliFormData.adults' },
                            { $size: '$heliFormData.children' },
                            { $size: '$heliFormData.infants' }
                        ]
                    },
                    'heliFormData.numAdults': 1,
                    'heliFormData.numChildren': 1,
                    'heliFormData.numInfants': 1,
                    'customPackageForm.packagePlan': 1,
                    'customPackageForm.mealPlan': 1,
                    'customPackageForm.numAdults': 1,
                    'customPackageForm.numChildren': 1,
                    'customPackageForm.numInfants': 1,
                    'customPackageForm.vehicleType': 1,
                    'customPackageForm.vehiclePrice': 1,
                    'customPackageForm.totalAmount': 1,
                    'customPackageForm.transactionId': 1
                },
            },
        ]);

        // Check if either `orders` or `customOrders` is found and user is authorized
        const userEmail = session.user.email?.toLowerCase(); // Ensure case-insensitive comparison
        const isAuthorized = (
            (orders.length > 0 && orders[0]?.email.toLowerCase() === userEmail) ||
            (customOrders.length > 0 && customOrders[0]?.formData?.email?.toLowerCase() === userEmail)
        );

        if (!isAuthorized) {
            return (
                <p className="text-red-500 p-20 text-2xl">You are not authorized to view this invoice.</p>
            );
        }

        // Return the invoice page with the relevant data
        return (
            <InvoicePage orders={orders.length > 0 ? orders : customOrders} />
        );
    } catch (error) {
        console.error('Error fetching order data:', error);
        return (
            <p className="text-red-500 p-20 text-2xl">An error occurred while fetching the invoice data.</p>
        );
    }
};

export default page;
