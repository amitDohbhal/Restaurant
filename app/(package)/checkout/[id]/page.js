import Checkout from "@/components/Package/Checkout";

const CheckoutPage = async ({ params }) => {

    const { id } = await params;
    const packages = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/getPackageById/${id}`).then(res => res.json())

    return (
        <>
            <Checkout packages={packages} />
        </>
    )
}

export default CheckoutPage