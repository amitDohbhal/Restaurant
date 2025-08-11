'use client'

import { useForm } from "react-hook-form";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog"
import { Pencil, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Badge } from "../ui/badge";
import { Label } from "../ui/label";

const CreatePackagePlanType = () => {
    const { register, handleSubmit, setValue, watch, reset } = useForm();
    const [editItem, setEditItem] = useState(null)
    const [allPlans, setAllPlans] = useState([]);

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const response = await fetch(`/api/admin/website-manage/addPlanType`);
                const res = await response.json();

                if (response.ok) {
                    setAllPlans(res);
                } else {
                    toast.error(res.message, { style: { borderRadius: "10px", border: "2px solid red" } });
                }
            } catch (error) {
                toast.error(error.message, { style: { borderRadius: "10px", border: "2px solid red" } });
            }
        }

        fetchPlans();
    }, [])

    const handleUpdate = async () => {
        try {
            const response = await fetch(`/api/admin/website-manage/addPlanType`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    planName: watch("planName"),
                    _id: editItem
                }),
            });

            const res = await response.json();

            if (response.ok) {
                toast.success("Plan Name updated successfully!", { style: { borderRadius: "10px", border: "2px solid green" } });
                setEditItem(null);
                window.location.reload();
            } else {
                toast.error(res.message, { style: { borderRadius: "10px", border: "2px solid red" } });
            }
        } catch (error) {
            toast.error("Error updating Plan Name", { style: { borderRadius: "10px", border: "2px solid red" } });
        }
    };

    const handleEdit = (id) => {
        const itemToEdit = allPlans.find((item) => item._id === id);
        setValue("planName", itemToEdit.planName);
        setEditItem(id);
    };

    const deleteItem = async (id) => {
        try {
            const response = await fetch(`/api/admin/website-manage/addPlanType`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });

            if (response.ok) {
                toast.success("Plan Name deleted successfully!", { style: { borderRadius: "10px", border: "2px solid green" } });
                window.location.reload();
            } else {
                toast.error("Failed to delete plan name", { style: { borderRadius: "10px", border: "2px solid red" } });
            }
        } catch (error) {
            console.error("Error deleting Plan Name:", error);
        }
    };

    const onSubmit = async (data) => {
        try {
            const response = await fetch("/api/admin/website-manage/addPlanType", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            })

            const res = await response.json()

            if (response.ok) {
                toast.success(res.message, { style: { borderRadius: "10px", border: "2px solid green" } });
                reset();
                window.location.reload();
            } else {
                toast.error(`Failed to add package plan: ${res.message}`, { style: { borderRadius: "10px", border: "2px solid red" } });
            }
        } catch (error) {
            toast.error("Something went wrong", { style: { borderRadius: "10px", border: "2px solid red" } });
        }
    }

    return (
        <div className="my-20 w-full bg-blue-100 p-4 rounded-lg">
            <form className="flex flex-col items-center gap-8" onSubmit={handleSubmit(onSubmit)}>
                <h1 className="text-4xl font-semibold">Package Plan</h1>
                <div className="flex items-end gap-6 mt-12">
                    <div className="flex flex-col gap-2">
                        <label htmlFor="planName" className="font-semibold">Plan Title</label>
                        <Input placeholder="e.g. Basic, Standard, Premium" name="planName" className="w-96 border-2 border-blue-600 focus:border-dashed focus:border-blue-500 focus:outline-none focus-visible:ring-0 font-bold capitalize" {...register('planName')} />
                    </div>
                </div>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-500">Add Package Plan</Button>
            </form>

            <Table className="max-w-lg mx-auto mt-20 mb-10">
                <TableHeader>
                    <TableRow>
                        <TableHead className="text-center !text-black w-2/3">Plan Name</TableHead>
                        <TableHead className="text-center !text-black w-1/2">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {allPlans.length > 0 ? allPlans.map((plan) => (
                        <TableRow key={plan._id} className="text-center">
                            <TableCell className="border font-semibold border-blue-600"><Badge className="bg-blue-300 border-2 border-blue-600 text-lg capitalize text-black hover:bg-blue-400">{plan.planName}</Badge></TableCell>
                            <TableCell className="border font-semibold border-blue-600 text-center">
                                <Button size="icon" onClick={() => handleEdit(plan._id)} variant="outline" className="mr-4">
                                    <Pencil className="w-4 h-4" />
                                </Button>
                                <Button size="icon" onClick={() => deleteItem(plan._id)} variant="destructive">
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    )) : (
                        <TableRow>
                            <TableCell className="border font-semibold border-blue-600 text-center" colSpan={2}>No Plans Found</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
            {editItem && (
                <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
                    <DialogContent className="font-barlow">
                        <DialogHeader>
                            <DialogTitle>Change Plan Name</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit(handleUpdate)}>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 w-full">
                                <div className="flex flex-col gap-2 col-span-3">
                                    <Label>Plan Name</Label>
                                    <Input {...register("planName")} className="capitalize border-2 border-blue-600 focus:border-dashed focus:border-blue-500 focus:outline-none focus-visible:ring-0 font-bold" />
                                </div>
                            </div>
                            <div className="flex justify-end mt-4">
                                <Button className="bg-blue-600 hover:bg-blue-500" type="submit">Save</Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    )
}

export default CreatePackagePlanType
