import { GetAllUsers } from "@/actions/GetAllUsers"
import SendPromoEmailPage from "@/components/Admin/SendPromotionalEmail"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";

export const dynamic = "force-dynamic";

const page = async () => {
    let allUsers = await GetAllUsers();
    if (allUsers) {
        allUsers = allUsers.map(user => {
            // Convert all object fields to plain values
            const plainUser = {};
            for (const [key, value] of Object.entries(user)) {
                if (key === '_id' && value && value.toString) {
                    plainUser._id = value.toString();
                } else if (Array.isArray(value)) {
                    // Convert array of ObjectIds or objects
                    plainUser[key] = value.map(v => (v && v.toString ? v.toString() : v));
                } else if (value && typeof value === 'object' && value.type === 'Buffer') {
                    // Skip buffer fields (not serializable)
                    continue;
                } else {
                    plainUser[key] = value;
                }
            }
            // Ensure reviews and products are arrays of strings
            plainUser.reviews = (user.reviews || []).map(r => r && r.toString ? r.toString() : r);
            plainUser.products = (user.products || []).map(p => p && p.toString ? p.toString() : p);
            return plainUser;
        });
    }

    return (
        <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2">
                <div className="flex items-center gap-2 px-4">
                    <SidebarTrigger className="-ml-1" />
                </div>
            </header>
            <SendPromoEmailPage allUsers={allUsers} />
        </SidebarInset>
    )
}

export default page