'use client'

import { useForm } from "react-hook-form"
import { Input } from "../ui/input"
import { NumericFormat } from "react-number-format"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Button } from "../ui/button"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"
import { Copy, Loader2, Pencil, Trash2 } from "lucide-react"
import { Switch } from "../ui/switch"
import { Label } from "../ui/label"

const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
};

const AddDirectPackage = () => {
    const { handleSubmit, register, setValue, reset } = useForm()
    const [packageCode, setPackageCode] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [subMenuItems, setSubMenuItems] = useState([])

    useEffect(() => {
        setPackageCode(generateCode());
        setValue('packages.packageCode', packageCode)

        const fetchSubMenuItems = async () => {
            try {
                const response = await fetch(`/api/admin/website-manage/addDirectPackage`);
                const data = await response.json();
                setSubMenuItems(data || []);
            } catch (error) {
                console.error("Error fetching direct packages:", error);
            }
        }

        fetchSubMenuItems();
    }, [])

    const deletePackage = async (id) => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/admin/website-manage/addDirectPackage`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });

            if (response.ok) {
                toast.success("Package deleted successfully!");
                setSubMenuItems(prev => ({
                    ...prev,
                    packages: prev.packages.filter(pkg => pkg._id !== id)
                }));
            } else {
                const error = await response.json();
                toast.error(error.message || "Failed to delete package");
            }
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    const toggleSwitch = async (pkgId, currentStatus) => {
        try {
            const response = await fetch(`/api/admin/website-manage/addDirectPackage`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pkgId, active: !currentStatus }),
            });

            if (response.ok) {
                setSubMenuItems(prev => ({
                    ...prev,
                    packages: prev.packages.map(pkg =>
                        pkg._id === pkgId ? { ...pkg, active: !pkg.active } : pkg
                    )
                }));
            } else {
                const error = await response.json();
                toast.error(error.message || "Failed to update status");
            }
        } catch (error) {
            toast.error("Something went wrong");
        }
    };

    const onSubmit = async (data) => {

        if (!data.packages.packageName || !data.packages.price || !data.packages.priceUnit) {
            toast.error("All fields are required", { style: { borderRadius: "10px", border: "2px solid red" } })
            return
        }

        data.packages.link = packageCode;
        data.packages.packageCode = packageCode;

        try {
            const response = await fetch("/api/admin/website-manage/addDirectPackage", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });

            const res = await response.json();

            if (response.ok) {
                toast.success("Package added successfully!", { style: { borderRadius: "10px", border: "2px solid green" } })
                setSubMenuItems(prev => ({
                    ...prev,
                    packages: [...(prev?.packages || []), res.package]
                }));
                reset();
                setPackageCode(generateCode());
            } else {
                toast.error("Failed to add package", { style: { borderRadius: "10px", border: "2px solid red" } })
            }
        } catch (error) {
            toast.error("Something went wrong", { style: { borderRadius: "10px", border: "2px solid red" } })
        }
    }

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text)
            .then(() => toast.success("Link copied to clipboard!"))
            .catch(() => toast.error("Failed to copy link"));
    };

    return (
        <>
            <form className="flex flex-col items-center justify-center gap-8 my-20 bg-blue-100 w-full max-w-xl md:max-w-7xl mx-auto p-4 rounded-lg" onSubmit={handleSubmit(onSubmit)}>
                <div className="flex md:flex-row flex-col items-center md:items-end gap-6">
                    <div className="flex flex-col gap-2">
                        <label htmlFor="packageCode" className="font-semibold">Package Code</label>
                        <Input name="packageCode" className="w-32 border-2 border-blue-600 focus:border-dashed focus:border-blue-500 focus:outline-none focus-visible:ring-0 font-bold" readOnly value={packageCode} />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label htmlFor="packageName" className="font-semibold">Package Name</label>
                        <Input name="packageName" className="w-full border-2 font-bold border-blue-600 focus:border-dashed focus:border-blue-500 focus:outline-none focus-visible:ring-0" {...register('packages.packageName')} />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label htmlFor="price" className="font-semibold">Package Price</label>
                        <NumericFormat thousandSeparator={true} prefix="₹" name="price" className="px-2 font-bold py-1 w-full border-2 rounded-md border-blue-600 focus:border-dashed focus:border-blue-500 bg-transparent focus:outline-none focus-visible:ring-0" onValueChange={(values) => setValue('packages.price', values.floatValue)} />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label htmlFor="priceUnit" className="font-semibold">Price Unit</label>
                        <Select name="priceUnit" className="p-2 border border-gray-300 rounded-md" onValueChange={(value) => setValue('packages.priceUnit', value)}>
                            <SelectTrigger className="w-52 border-2 bg-transparent border-blue-600 focus:border-blue-500 focus:ring-0 focus:outline-none focus-visible:outline-none focus-visible:ring-0">
                                <SelectValue placeholder="Select Price Unit" />
                            </SelectTrigger>
                            <SelectContent className="border-2 border-blue-600 bg-blue-100">
                                <SelectGroup>
                                    <SelectItem className="focus:bg-blue-300 font-bold" value="Per Person">Per Person</SelectItem>
                                    <SelectItem className="focus:bg-blue-300 font-bold" value="2 Person">2 Person</SelectItem>
                                    <SelectItem className="focus:bg-blue-300 font-bold" value="Group">Group</SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-500">Add Package</Button>
            </form>

            <div className="bg-blue-100 p-4 rounded-lg shadow max-w-5xl mx-auto w-full overflow-x-auto lg:overflow-visible text-center">
                <Table className="w-full min-w-max lg:min-w-0">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-center !text-black w-1/3">Package Name</TableHead>
                            <TableHead className="text-center !text-black w-1/3">Package Link</TableHead>
                            <TableHead className="w-1/3 !text-black text-center">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {subMenuItems?.packages?.length > 0 ? (
                            subMenuItems?.packages?.map((pkg) => (
                                <TableRow key={pkg._id}>
                                    <TableCell className="border font-semibold border-blue-600">{pkg.packageName}</TableCell>
                                    <TableCell className="border font-semibold border-blue-600">
                                        <div className="flex items-center justify-center gap-2">
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => pkg.active && copyToClipboard(`${window.location.origin}/package/${pkg._id}`)}
                                                disabled={!pkg.active}
                                            >
                                                <Copy className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                    <TableCell className="border font-semibold border-blue-600">
                                        <div className="flex items-center justify-center gap-6">
                                            <Button size="icon" variant="outline" asChild>
                                                <Link href={`/admin/editPackage/${pkg._id}`}>
                                                    <Pencil className="w-4 h-4" />
                                                </Link>
                                            </Button>
                                            <Button size="icon" disabled={isLoading} onClick={() => deletePackage(pkg._id)} variant="destructive">
                                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                            </Button>
                                            <div className="flex items-center gap-2">
                                                <Switch
                                                    id={`switch-${pkg._id}`}
                                                    checked={pkg.active}
                                                    onCheckedChange={() => toggleSwitch(pkg._id, pkg.active)}
                                                    className={`rounded-full transition-colors ${pkg.active ? "!bg-green-500" : "!bg-red-500"}`}
                                                />
                                                <Label htmlFor={`switch-${pkg._id}`} className="text-black">
                                                    {pkg.active ? "ON" : "OFF"}
                                                </Label>
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan="3" className="text-center border font-semibold border-blue-600">
                                    No packages available.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </>
    )
}

export default AddDirectPackage