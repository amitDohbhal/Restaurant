import ProductProfile from "@/components/Admin/ProductProfile"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import AddProduct from "@/components/Admin/AddProduct"
const page = async ({ params }) => {
    const { id } = await params
    // console.log(id)

    return (
        <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2">
                <div className="flex items-center gap-2 px-4">
                    <SidebarTrigger className="-ml-1" />
                </div>
            </header>
            <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                <h1 className="text-4xl px-12 font-semibold">Add Product</h1>
                <AddProduct id={id} />
                {/* <ProductProfile id={id}/> */}
            </div>
        </SidebarInset>
    )
}

export default page
