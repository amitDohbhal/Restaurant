import EditInfo from '@/components/Admin/EditInfo'
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'

const page = () => {
    return (
        <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2">
                <div className="flex items-center gap-2 px-4">
                    <SidebarTrigger className="-ml-1" />
                </div>
            </header>
            <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                <h1 className="text-4xl px-12 font-semibold">Edit Artisan Info</h1>
                <EditInfo />
            </div>
        </SidebarInset>
    )
}

export default page