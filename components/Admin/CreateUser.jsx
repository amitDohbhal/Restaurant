'use client'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog"
import { useForm } from "react-hook-form";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { EyeIcon, EyeOffIcon, Pencil, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Badge } from "../ui/badge";
import { Label } from "../ui/label";

const CreateUser = () => {
    const { register, handleSubmit, setValue, watch, reset } = useForm();

    const [editItem, setEditItem] = useState(null)
    const [allUsers, setAllUsers] = useState([]);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await fetch(`/api/admin/createUser`);
                const res = await response.json();

                if (response.ok) {
                    setAllUsers(res.admins);
                } else {
                    toast.error(res.message, { style: { borderRadius: "10px", border: "2px solid red" } });
                }
            } catch (error) {
                toast.error(error.message, { style: { borderRadius: "10px", border: "2px solid red" } });
            }
        }

        fetchUsers();
    }, [])

    const handleUpdate = async (data) => {
        try {
            const response = await fetch(`/api/admin/createUser`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            const res = await response.json();

            if (response.ok) {
                toast.success("SubAdmin updated successfully!", { style: { borderRadius: "10px", border: "2px solid green" } });
                setEditItem(null);
                window.location.reload();
            } else {
                toast.error(res.message, { style: { borderRadius: "10px", border: "2px solid red" } });
            }
        } catch (error) {
            toast.error("Error updating SubAdmin", { style: { borderRadius: "10px", border: "2px solid red" } });
        }
    };

    const handleEdit = (id) => {
        const itemToEdit = allUsers.find((item) => item._id === id);
        setValue("fullName", itemToEdit.fullName);
        setValue("phoneNumber", itemToEdit.phoneNumber);
        setValue("email", itemToEdit.email);
        setEditItem(id);
    };

    const deleteItem = async (id) => {
        try {
            const response = await fetch(`/api/admin/createUser`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });

            if (response.ok) {
                toast.success("SubAdmin deleted successfully!", { style: { borderRadius: "10px", border: "2px solid green" } });
                window.location.reload();
            } else {
                toast.error("Failed to delete SubAdmin", { style: { borderRadius: "10px", border: "2px solid red" } });
            }
        } catch (error) {
            console.error("Error deleting SubAdmin:", error);
        }
    };

    const onSubmit = async (data) => {
        if (!data.password || !data.fullName || !data.phoneNumber || !data.email) {
            toast.error("All fields are required", { style: { borderRadius: "10px", border: "2px solid red" } });
            return
        }
        if (data.phoneNumber.length !== 10) {
            toast.error("Invalid phone number. Please enter a 10-digit number", { style: { borderRadius: "10px", border: "2px solid red" } });
            return
        }
        try {
            const response = await fetch("/api/admin/createUser", {
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
                toast.error(`Failed to add SubAdmin: ${res.message}`, { style: { borderRadius: "10px", border: "2px solid red" } });
            }
        } catch (error) {
            toast.error("Something went wrong", { style: { borderRadius: "10px", border: "2px solid red" } });
        }
    }

    return (
        <div className="my-20 w-full bg-blue-100 font-barlow p-4 rounded-lg">
            <form className="flex flex-col items-center gap-8" onSubmit={handleSubmit(onSubmit)}>
                <div className="grid grid-cols-2 gap-6 mt-12">
                    <div className="flex flex-col gap-2">
                        <label htmlFor="fullName" className="font-semibold">Full Name</label>
                        <Input placeholder="John Doe" name="fullName" className="w-72 xl:w-96 border-2 border-blue-600 focus:border-dashed focus:border-blue-500 focus:outline-none focus-visible:ring-0 font-bold capitalize" {...register('fullName')} />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label htmlFor="phoneNumber" className="font-semibold">Contact Number</label>
                        <Input placeholder="1234567890" maxLength={10} name="phoneNumber" className="w-72 xl:w-96 border-2 border-blue-600 focus:border-dashed focus:border-blue-500 focus:outline-none focus-visible:ring-0 font-bold" {...register('phoneNumber')} />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label htmlFor="email" className="font-semibold">Email</label>
                        <Input placeholder="johndoe@example" name="email" className="w-72 xl:w-96 border-2 border-blue-600 focus:border-dashed focus:border-blue-500 focus:outline-none focus-visible:ring-0 font-bold" {...register('email')} />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label htmlFor="password" className="font-semibold">Password</label>
                        <div className="relative">
                            <Input type={showPassword ? "text" : "password"} placeholder="**********" name="password" className="w-72 xl:w-96 border-2 border-blue-600 focus:border-dashed focus:border-blue-500 focus:outline-none focus-visible:ring-0 font-bold" {...register('password')} />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 transform -translate-y-1/2"
                            >
                                {showPassword ? (
                                    <EyeIcon className="h-5 w-5 text-black" />
                                ) : (
                                    <EyeOffIcon className="h-5 w-5 text-black" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-500">Create User</Button>
            </form>

            <Table className="max-w-6xl mx-auto mt-20 mb-10">
                <TableHeader>
                    <TableRow>
                        <TableHead className="text-center !text-black">#</TableHead>
                        <TableHead className="text-center !text-black w-2/7">Full Name</TableHead>
                        <TableHead className="text-center !text-black w-2/7">Contact Number</TableHead>
                        <TableHead className="text-center !text-black w-2/6">Email</TableHead>
                        <TableHead className="text-center !text-black w-1/7">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {allUsers.length > 0 ? allUsers.map((user, index) => (
                        <TableRow key={user._id} className="text-center">
                            <TableCell className="border font-semibold border-blue-600">{index + 1}</TableCell>
                            <TableCell className="border font-semibold border-blue-600"><Badge className="bg-blue-300 border-2 border-blue-600 text-sm xl:text-lg text-black hover:bg-blue-400">{user.fullName}</Badge></TableCell>
                            <TableCell className="border font-semibold border-blue-600"><Badge className="bg-blue-300 border-2 border-blue-600 text-sm xl:text-lg text-black hover:bg-blue-400">+91 {user.phoneNumber}</Badge></TableCell>
                            <TableCell className="border font-semibold border-blue-600"><Badge className="bg-blue-300 border-2 border-blue-600 text-sm xl:text-lg text-black hover:bg-blue-400">{user.email}</Badge></TableCell>
                            <TableCell className="border font-semibold border-blue-600 text-center">
                                <Button size="icon" onClick={() => handleEdit(user._id)} variant="outline" className="mr-4">
                                    <Pencil className="w-4 h-4" />
                                </Button>
                                <Button size="icon" onClick={() => deleteItem(user._id)} variant="destructive">
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    )) : (
                        <TableRow>
                            <TableCell className="border font-semibold border-blue-600 text-center" colSpan={5}>No Plans Found</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
            {editItem && (
                <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)} >
                    <DialogContent className="max-w-sm font-barlow">
                        <DialogHeader>
                            <DialogTitle>Change User Details</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit(handleUpdate)}>
                            <div className="grid grid-cols-1 gap-4 mt-4">
                                <div className="flex flex-col gap-2">
                                    <label htmlFor="fullName" className="font-semibold">Full Name</label>
                                    <Input placeholder="John Doe" name="fullName" className="w-full border-2 border-blue-600 focus:border-dashed focus:border-blue-500 focus:outline-none focus-visible:ring-0 font-bold capitalize" {...register('fullName')} />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label htmlFor="phoneNumber" className="font-semibold">Contact Number</label>
                                    <Input placeholder="1234567890" maxLength={10} name="phoneNumber" className="w-full border-2 border-blue-600 focus:border-dashed focus:border-blue-500 focus:outline-none focus-visible:ring-0 font-bold" {...register('phoneNumber')} />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label htmlFor="email" className="font-semibold">Email</label>
                                    <Input placeholder="johndoe@example" name="email" className="w-full border-2 border-blue-600 focus:border-dashed focus:border-blue-500 focus:outline-none focus-visible:ring-0 font-bold" disabled {...register('email')} />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label htmlFor="password" className="font-semibold">Password</label>
                                    <div className="relative">
                                        <Input type={showPassword ? "text" : "password"} placeholder="**********" name="password" className="w-full border-2 border-blue-600 focus:border-dashed focus:border-blue-500 focus:outline-none focus-visible:ring-0 font-bold" {...register('password')} />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 transform -translate-y-1/2"
                                        >
                                            {showPassword ? (
                                                <EyeIcon className="h-5 w-5 text-black" />
                                            ) : (
                                                <EyeOffIcon className="h-5 w-5 text-black" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            <Button type="submit" className="bg-blue-600 hover:bg-blue-500">Update User</Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    )
}

export default CreateUser
