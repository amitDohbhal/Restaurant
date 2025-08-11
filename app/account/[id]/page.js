import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import Account from '@/components/MyAccount/Account';
import Order from '@/models/Order';
import connectDB from '@/lib/connectDB';
import CustomOrder from '@/models/CustomOrder';

export default async function AccountPage({ params }) {
    await connectDB();
    const session = await getServerSession(authOptions);
    const { id } = await params;

    // Fetch the user by ID
    const user = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/getUserById/${id}`).then(res => res.json()).then(data => data);

    if (!session) {
        return <p>Please log in to view your account.</p>;
    }

    // Check if the user is authorized to access this account
    if (id !== session.user.id) {
        return <p>You are not authorized to access this account.</p>;
    }

    // Fetch orders with package details using an aggregation pipeline
    const orders = await Order.aggregate([
        // Match orders for the current user
        { $match: { email: user.email } },
        // Lookup to join the Package collection
        {
            $lookup: {
                from: 'products', // The collection to join
                localField: 'packageId', // Field from the Order collection
                foreignField: '_id', // Field from the Package collection
                as: 'package', // Output array field
            },
        },
        // Unwind the package array (since $lookup returns an array)
        { $unwind: '$package' },
        // Convert ObjectId fields to strings
        {
            $project: {
                _id: { $toString: '$_id' },
                packageId: { $toString: '$packageId' },
                userId: { $toString: '$userId' },
                email: 1,
                orderId: 1,
                createdAt: 1,
                travelDate: 1,
                status: 1,
                'package._id': { $toString: '$package._id' },
                'package.packageName': 1,
            },
        },
    ]);

    // Fetch CustomOrders with package details using an aggregation pipeline
    const customOrders = await CustomOrder.aggregate([
        // Match orders for the current user
        { $match: { 'formData.email': user.email } },
        // Lookup to join the Package collection
        {
            $lookup: {
                from: 'products', // The collection to join
                localField: 'packageId', // Field from the Order collection
                foreignField: '_id', // Field from the Package collection
                as: 'package', // Output array field
            },
        },
        // Unwind the package array (since $lookup returns an array)
        { $unwind: '$package' },
        // Convert ObjectId fields to strings
        {
            $project: {
                _id: { $toString: '$_id' },
                packageId: { $toString: '$packageId' },
                userId: { $toString: '$userId' },
                'formData.email': 1,
                orderId: 1,
                createdAt: 1,
                'bookingDetails.travelDate': 1,
                status: 1,
                'package._id': { $toString: '$package._id' },
                'package.packageName': 1,
            },
        },
    ]);

    const enquiries = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/getEnquiryById/${id}`).then(res => res.json()).then(data => data);

    return (
        <>
            <Account session={session} user={user} orders={orders || []} customOrders={customOrders || []} enquiries={enquiries || []} />
        </>
    );
}