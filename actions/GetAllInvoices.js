import connectDB from "@/lib/connectDB";
import CreateRoomInvoice from "@/models/CreateRoomInvoice";
import CreateRestaurantInvoice from "@/models/CreateRestaurantInvoice";
import CreateDirectFoodInvoice from "@/models/CreateDirectFoodInvoice";
import CreateManagementInvoice from "@/models/CreateManagementInvoice";
import RoomInvoice from "@/models/RoomInvoice";
import RunningOrder from "@/models/RunningOrder";
export async function GetAllInvoices(page = 1, itemsPerPage = 15) {
    try {
        await connectDB();
        
        // Fetch all invoice types in parallel without pagination
        const [
            roomInvoices,
            restaurantInvoices,
            directFoodInvoices,
            managementInvoices,
            roomInvoicesV2,
            runningOrders
        ] = await Promise.all([
            CreateRoomInvoice.find({}).sort({ createdAt: -1 }).lean(),
            CreateRestaurantInvoice.find({}).sort({ createdAt: -1 }).lean(),
            CreateDirectFoodInvoice.find({}).sort({ createdAt: -1 }).lean(),
            CreateManagementInvoice.find({}).sort({ createdAt: -1 }).lean(),
            RoomInvoice.find({}).sort({ createdAt: -1 }).lean(),
            RunningOrder.find({}).sort({ createdAt: -1 }).lean()
        ]);
        console.log(managementInvoices)

        // Get total counts for pagination
        const [
            totalRoomInvoices,
            totalRestaurantInvoices,
            totalDirectFoodInvoices,
            totalManagementInvoices,
            totalRoomInvoicesV2,
            totalRunningOrders
        ] = await Promise.all([
            CreateRoomInvoice.countDocuments({}),
            CreateRestaurantInvoice.countDocuments({}),
            CreateDirectFoodInvoice.countDocuments({}),
            CreateManagementInvoice.countDocuments({}),
            RoomInvoice.countDocuments({}),
            RunningOrder.countDocuments({})
        ]);

        // Map and normalize all invoices to a common format
        const allInvoices = [
            ...roomInvoices.map(invoice => ({
                ...invoice,
                invoiceType: 'room',
                invoiceNumber: invoice.invoiceNo || invoice.invoiceNumber,
                customerName: invoice.guestFirst || 'Room Customer',
                amount: invoice.totalAmount || 0,
                date: invoice.createdAt || invoice.invoiceDate,
                status: invoice.orderStatus || 'completed',
                paymentStatus: invoice.paymentStatus || 'completed'
            })),
            ...restaurantInvoices.map(invoice => ({
                ...invoice,
                invoiceType: 'restaurant',
                invoiceNumber: invoice.invoiceNo || invoice.invoiceNumber,
                customerName: invoice.guestFirst || 'Restaurant Customer',
                amount: invoice.totalAmount || 0,
                date: invoice.createdAt || invoice.invoiceDate,
                status: invoice.orderStatus || 'completed',
                paymentStatus: invoice.paymentStatus || 'completed'
            })),
            ...directFoodInvoices.map(invoice => ({
                ...invoice,
                invoiceType: 'direct_food',
                invoiceNumber: invoice.invoiceNo || invoice.invoiceNumber,
                customerName: invoice.guestFirst || 'Direct Food Customer',
                amount: invoice.totalAmount || 0,
                date: invoice.createdAt || invoice.invoiceDate,
                status: invoice.orderStatus || 'completed',
                paymentStatus: invoice.paymentStatus || 'completed'
            })),
            ...managementInvoices.map(invoice => ({
                ...invoice,
                invoiceType: 'management',
                invoiceNumber: invoice.invoiceNo || invoice.invoiceNumber,
                customerName: invoice.guestFirst || 'Management Order',
                amount: invoice.totalAmount || 0,
                date: invoice.createdAt || invoice.invoiceDate,
                status: invoice.orderStatus || 'completed',
                paymentStatus: invoice.paymentStatus || 'completed'
            })),
            ...runningOrders.map(invoice => ({
                ...invoice,
                invoiceType: 'running_order',
                invoiceNumber: invoice.orderNumber,
                customerName: invoice.customer.name || 'Customer Name Come Here',
                amount: invoice.total || 0,
                date: invoice.createdAt || invoice.invoiceDate,
                status: invoice.status || 'completed',
                paymentStatus: invoice.paymentStatus || 'completed',
                paymentMode: invoice.orderType === 'room-service' ? 'Room Order' : (invoice.paymentMode || '')
            })),
            ...roomInvoicesV2.map(invoice => {
                // Calculate total amount including GST if not already calculated
                const cgstAmount = invoice.cgstAmount || (invoice.paidAmount * (invoice.cgstPercent || 0) / 100) || 0;
                const sgstAmount = invoice.sgstAmount || (invoice.paidAmount * (invoice.sgstPercent || 0) / 100) || 0;
                const totalAmount = invoice.totalAmount || (invoice.paidAmount + cgstAmount + sgstAmount);



                return {
                    ...invoice,
                    invoiceType: 'room',
                    invoiceNumber: invoice.invoiceNo || invoice.invoiceNumber,
                    customerName: invoice.guestFirst || 'Room Customer',
                    amount: totalAmount,
                    date: invoice.createdAt || invoice.invoiceDate,
                    status: invoice.orderStatus|| invoice.orderType || 'completed',
                    paymentStatus: invoice.paymentStatus || 'completed',
                    // Include breakdown for reference
                    amountBreakdown: {
                        baseAmount: invoice.paidAmount,
                        cgstPercent: invoice.cgstPercent,
                        cgstAmount,
                        sgstPercent: invoice.sgstPercent,
                        sgstAmount,
                        totalAmount
                    }
                };
            })
        ];

        // Sort all invoices by date (newest first) - already sorted by createdAt in the query

        // Calculate total pages for pagination
        const totalInvoices = totalRoomInvoices + totalRestaurantInvoices + 
                            totalDirectFoodInvoices + totalManagementInvoices + totalRoomInvoicesV2 + totalRunningOrders;
        const totalPages = Math.ceil(totalInvoices / itemsPerPage);

        // Apply pagination to the combined results
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedInvoices = allInvoices.slice(startIndex, endIndex);

        return {
            success: true,
            invoices: paginatedInvoices,
            totalPages,
            totalInvoices,
            currentPage: page
        };

    } catch (error) {
        console.error('Error fetching invoices:', error);
        return {
            success: false,
            error: error.message,
            invoices: [],
            totalPages: 0,
            totalInvoices: 0,
            currentPage: page
        };
    }
}
