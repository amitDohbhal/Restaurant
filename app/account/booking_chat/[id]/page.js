import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import Chat from "@/components/Chat"
import Sidebar from "@/components/MyAccount/AccountSidebar"
import { getServerSession } from "next-auth"


const BookingChat = async ({ params }) => {
    const { id } = await params

    const session = await getServerSession(authOptions)

    return (
        <div className="min-h-screen bg-muted/30 md:pt-40">
            <main className="max-w-[100rem] mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row gap-8">
                    <Sidebar session={session} user={session?.user} />
                    <Chat className="max-h-96 md:max-h-full" type="booking" userId={session?.user?.id} bookingId={id} />
                </div>
            </main>
        </div>
    )
}

export default BookingChat