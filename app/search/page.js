import PackageCard from "@/components/Category/package-card"
import { SidebarInset } from "@/components/ui/sidebar"

async function fetchPackages(query) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/getPackages/byQuery?q=${query}`, {
      cache: "no-store",
    })
    if (!response.ok) {
      throw new Error("Failed to fetch packages")
    }
    return response.json()
  } catch (error) {
    console.error("Error fetching packages:", error)
    return []
  }
}

export default async function SearchPage({ searchParams }) {
  const seachparamsAwait = await searchParams
  const query = seachparamsAwait.q || ""
  const { packages } = await fetchPackages(query)
  return (
    <SidebarInset>
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Search Results for: <span className="text-blue-600">{query}</span></h1>

        {/* Search Results */}
        {packages.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <PackageCard key={pkg.packageCode} pkg={pkg} />
            ))}
          </div>
        ) : (
          <p className="text-gray-600">No packages found. Try a different search.</p>
        )}
      </div>
    </SidebarInset>
  )
}