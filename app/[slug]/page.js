import Activity from "@/components/Activity";

export default async function ActivityPage({ params }) {
    const { slug } = await params;
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/add_activity/by_slug/${encodeURIComponent(slug)}`);
    const activity = await res.json();
    if (!activity || activity.error) return <div>Page Not found</div>;
    return <Activity data={activity} />;
}