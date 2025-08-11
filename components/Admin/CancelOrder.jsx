// components/Admin/CancelOrder.jsx
"use client";
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

const CancelOrder = () => {
    const [requests, setRequests] = useState([]);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [adminNotes, setAdminNotes] = useState('');
    // console.log(requests)

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const res = await fetch('/api/cancelOrder');
            const { data } = await res.json();
            setRequests(data);
        } catch (error) {
            toast.error('Failed to fetch requests');
        } finally {
            setIsLoading(false);
        }
    };

    const updateRequestStatus = async (status) => {
        if (!selectedRequest) return;

        try {
            const res = await fetch('/api/cancelOrder', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: selectedRequest._id,
                    status,
                    adminNotes
                })
            });

            const { data } = await res.json();
            if (!res.ok) throw new Error('Failed to update request');

            setRequests(prev => prev.map(req =>
                req._id === data._id ? data : req
            ));
            setSelectedRequest(null);
            setAdminNotes('');
            toast.success(`Request ${status} successfully`);
        } catch (error) {
            toast.error(error.message);
        }
    };

    if (isLoading) return <div>Loading...</div>;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Order Cancellation Requests</h1>

            <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                    <thead>
                        <tr>
                            <th className="py-2 px-4 border">Order Name</th>
                            {/* <th className="py-2 px-4 border">Customer</th> */}
                            {/* <th className="py-2 px-4 border">Reason</th> */}
                            <th className="py-2 px-4 border">Refund Amount</th>
                            <th className="py-2 px-4 border">Status</th>
                            <th className="py-2 px-4 border">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {requests.map((request) => (
                            <tr key={request._id}>
                                <td className="py-2 px-4 border text-center">{request.order.items[0].name}</td>
                                {/* <td className="py-2 px-4 border">
                                    {request.userDetails?.name}
                                </td> */}
                                {/* <td className="py-2 px-4 border">{request.reason}</td> */}
                                <td className="py-2 px-4 border text-center">₹{request.products[0].price}</td>
                                <td className="py-2 px-4 border text-center">
                                    <span className={`px-2 py-1 rounded-full text-xs ${request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                            request.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                'bg-red-100 text-red-800'
                                        }`}>
                                        {request.status}
                                    </span>
                                </td>
                                <td className="py-2 px-4 border text-center">
                                    <button
                                        onClick={() => setSelectedRequest(request)}
                                        className="text-blue-600 hover:underline"
                                    >
                                        View
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal for request details */}
            {selectedRequest && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                        <div className="flex items-center justify-between">

                        <h3 className="text-xl font-bold mb-4">Request Details</h3>
                        <button
                                onClick={() => {
                                    setSelectedRequest(null);
                                    setAdminNotes('');
                                }}
                                className="px-1 text-sm border rounded"
                                >
                                <X/>
                            </button>
                                </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <p className="font-semibold">Order ID:</p>
                                <p>{selectedRequest.orderId}</p>
                            </div>
                            <div>
                                <p className="font-semibold">Status:</p>
                                <p>{selectedRequest.status}</p>
                            </div>
                            <div>
                                <p className="font-semibold">Refund Amount:</p>
                                <p>₹{selectedRequest.products[0].price}</p>
                            </div>
                        </div>
                        <div className="mb-4">
                            <h4 className="font-semibold mb-2">Order Items:</h4>
                            {selectedRequest.order?.items?.map((item, index) => (
                                <div key={index} className="flex items-center space-x-4 mb-2 p-2 bg-gray-50 rounded">
                                    <img
                                        src={item.image}
                                        alt={item.name}
                                        className="w-16 h-16 object-cover rounded"
                                    />
                                    <div>
                                        <p className="font-medium">{item.name}</p>
                                        <p>Qty: {item.quantity}</p>
                                        <p>Price: ₹{item.price}</p>
                                        {item.size && <p>Size: {item.size}</p>}
                                        {item.color && <p>Color: {item.color}</p>}
                                    </div>
                                </div>
                            ))}
                            <div className="mt-4 p-3 bg-gray-100 rounded">
                                <p className="font-medium">Order Total: ₹{selectedRequest.order?.totalAmount}</p>
                                <p>Payment Method: {selectedRequest.order?.paymentMethod}</p>
                                <p>Order Date: {new Date(selectedRequest.order?.orderDate).toLocaleDateString()}</p>
                            </div>
                        </div>

                        {/* Shipping Address */}
                        {/* <div className="mb-4">
                            <h4 className="font-semibold mb-2">Shipping Address:</h4>
                            <div className="bg-gray-50 p-3 rounded">
                                <p>{selectedRequest.order?.shippingAddress?.name}</p>
                                <p>{selectedRequest.order?.shippingAddress?.address}</p>
                                <p>
                                    {selectedRequest.order?.shippingAddress?.city},
                                    {selectedRequest.order?.shippingAddress?.state} -
                                    {selectedRequest.order?.shippingAddress?.pincode}
                                </p>
                                <p>Phone: {selectedRequest.order?.shippingAddress?.contactNumber}</p>
                            </div>
                        </div> */}

                        <div className="mb-4">
                            <h4 className="font-semibold mb-2">Bank Details:</h4>
                            <div className="grid grid-cols-2 gap-2">
                                <p>Account Holder: {selectedRequest.bankDetails?.accountHolderName}</p>
                                <p>Account Number: {selectedRequest.bankDetails?.accountNumber}</p>
                                <p>IFSC: {selectedRequest.bankDetails?.ifscCode}</p>
                                {/* <p>Bank: {selectedRequest.bankDetails?.bankName}</p> */}
                                {selectedRequest.bankDetails?.upiId && (
                                    <p>UPI ID: {selectedRequest.bankDetails.upiId}</p>
                                )}
                            </div>
                        </div>

                        <div className="mb-4">
                            <h4 className="font-semibold mb-2">Status History:</h4>
                            <ul className="space-y-2">
                                {selectedRequest.statusHistory?.map((status, i) => (
                                    <li key={i} className="text-sm">
                                        <span className="font-medium">{status.status}</span> -
                                        <span className="text-gray-600 ml-2">
                                            {new Date(status.changedAt).toLocaleString()}
                                        </span>
                                        {status.note && <p className="text-gray-500">{status.note}</p>}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="mt-6">
                            <label className="block mb-2 font-medium">Admin Notes:</label>
                            <textarea
                                value={adminNotes}
                                onChange={(e) => setAdminNotes(e.target.value)}
                                className="w-full p-2 border rounded"
                                rows="3"
                                placeholder="Add notes here..."
                            />
                        </div>

                        <div className="flex justify-end space-x-3 mt-4">
                            <button
                                onClick={() => {
                                    setSelectedRequest(null);
                                    setAdminNotes('');
                                }}
                                className="px-4 py-2 border rounded"
                            >
                                Close
                            </button>
                            {selectedRequest.status === 'pending' && (
                                <>
                                    <button
                                        onClick={() => updateRequestStatus('rejected')}
                                        className="px-4 py-2 bg-red-600 text-white rounded"
                                    >
                                        Reject
                                    </button>
                                    <button
                                        onClick={() => updateRequestStatus('approved')}
                                        className="px-4 py-2 bg-green-600 text-white rounded"
                                    >
                                        Approve
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CancelOrder;