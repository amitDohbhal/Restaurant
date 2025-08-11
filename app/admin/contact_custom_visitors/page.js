import PackageCalculatorVisitors from "@/components/Admin/PackageCalculatorVisitors"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import CustomOrderVisitors from "@/models/CustomOrderVisitors"
import connectDB from "@/lib/connectDB"
import { format } from "date-fns"
import User from "@/models/User"
import Package from "@/models/Package"

const ITEMS_PER_PAGE = 10

export const dynamic = 'force-dynamic'

const PackageCalculatorVisitorsPage = async ({ searchParams }) => {
    await connectDB()
    const searchparams = await searchParams
    const page = parseInt(searchparams?.page) || 1
    const monthFilter = searchparams?.month || 'all'
    
    // Calculate date range for month filter
    let dateFilter = {}
    if (monthFilter !== 'all') {
        const [monthName, year] = monthFilter.split(' ')
        const monthIndex = new Date(`${monthName} 1, ${year}`).getMonth()
        const startDate = new Date(year, monthIndex, 1)
        const endDate = new Date(year, monthIndex + 1, 0)
        
        dateFilter = {
            createdAt: {
                $gte: startDate,
                $lte: endDate
            }
        }
    }

    // Get total count for pagination
    const totalCount = await CustomOrderVisitors.countDocuments(dateFilter)
    
    // Fetch paginated data
    const customOrdersVisitors = await CustomOrderVisitors.find(dateFilter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE)
        .populate("userId")
        .populate("packageId")
        .lean()

    // Get all available months for filter
    const monthsAggregation = await CustomOrderVisitors.aggregate([
        {
            $group: {
                _id: {
                    year: { $year: "$createdAt" },
                    month: { $month: "$createdAt" }
                },
                count: { $sum: 1 }
            }
        },
        { $sort: { "_id.year": -1, "_id.month": -1 } }
    ])

    const availableMonths = monthsAggregation.map(item => {
        const date = new Date(item._id.year, item._id.month - 1)
        return {
            value: `${format(date, 'MMMM')} ${item._id.year}`,
            label: `${format(date, 'MMMM yyyy')}`,
            count: item.count
        }
    })

    return (
        <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2">
                <div className="flex items-center gap-2 px-4">
                    <SidebarTrigger className="-ml-1" />
                </div>
            </header>
            <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                <h1 className="text-3xl md:text-4xl px-12 font-semibold">Package Calculator Visitors</h1>
                <PackageCalculatorVisitors 
                    totalVisitors={totalCount}
                    customOrdersVisitors={JSON.parse(JSON.stringify(customOrdersVisitors))}
                    currentPage={page}
                    totalPages={Math.ceil(totalCount / ITEMS_PER_PAGE)}
                    availableMonths={availableMonths}
                    selectedMonth={monthFilter}
                />
            </div>
        </SidebarInset>
    )
}

export default PackageCalculatorVisitorsPage