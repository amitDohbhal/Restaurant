import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import AllInvoiceOverview from "@/components/Admin/AllInvoiceOverview"

// export const dynamic = "force-dynamic"

const AllInvoiceOverviewPage = async () => {

    return (
        <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2">
                <div className="flex items-center gap-2 px-4">
                    <SidebarTrigger className="-ml-1" />
                </div>
            </header>
            <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                <h1 className="text-4xl px-12 font-semibold mb-5">All Invoice Overview</h1>
                <AllInvoiceOverview />
            </div>
        </SidebarInset>
    )
}

export default AllInvoiceOverviewPage
