import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import ConfirmationPage from "@/components/Package/OrderConfirmed"
import { SidebarInset } from "@/components/ui/sidebar"
import connectDB from "@/lib/connectDB"
import CustomOrder from "@/models/CustomOrder"
import Order from "@/models/Order"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"

const OrderConfirmed = async ({ params }) => {
    const { id } = await params

    const session = await getServerSession(authOptions)

    if (!session) {
        return redirect('/sign-in')
    }

    await connectDB()

    const order = await Order.findOne({ orderId: id }).lean()
    if (order) {
        order._id = order._id.toString()
    }

    const customOrder = await CustomOrder.findOne({ orderId: id }).lean()
    if (customOrder) {
        customOrder._id = customOrder._id.toString()
    }


    if ((!order && !customOrder) || (order?.email !== session.user.email && customOrder?.formData?.email !== session.user.email)) {
        return redirect('/')
    }

    const packages = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/getPackageById/${order?.packageId || customOrder?.packageId}`).then(res => res.json());

    return (
        <>
            <SidebarInset>
                <ConfirmationPage order={order ? order : customOrder} session={session} packages={packages} />
            </SidebarInset>
        </>
    )
}

export default OrderConfirmed