import ArtisanDetails from '@/components/ArtisanDetails';

// Next.js 13+ server component: fetch artisan by id from API
export default async function Page({ params }) {
  const { slug } = await params;
  const decodedId = decodeURIComponent(slug);
  // console.log(id)
  // Adjust the API endpoint as per your backend route
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/createArtisan/byName/${decodedId}`, {
    cache: 'no-store' // Uncomment if you want fresh data every time
  });
  if (!res.ok) {
    // You can show a 404 or error message here
    return <div className="text-center py-20 text-2xl text-red-500">Artisan not found.</div>;
  }
  const artisan = await res.json();
  // console.log(artisan)
  return <ArtisanDetails artisan={artisan} />;
}
