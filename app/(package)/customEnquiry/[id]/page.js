import CustomEnquiry from "@/components/Package/CustomEnquiry";

const CustomEnquiryPage = async ({ params }) => {
    const { id } = await params;
    const packages = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/getPackageById/${id}`).then(res => res.json())

    return (
        <>
            <CustomEnquiry packages={packages} />
        </>
    )
}

export default CustomEnquiryPage