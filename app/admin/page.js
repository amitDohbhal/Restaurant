'use client'

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Pencil, Trash2 } from "lucide-react"
import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import toast from "react-hot-toast"

const Page = () => {
    const { data: session } = useSession()
    const { handleSubmit, register, setValue } = useForm()
    const [menuItems, setMenuItems] = useState([])
    const [editItem, setEditItem] = useState(null);

    useEffect(() => {
        fetch("/api/getAllMenuItems")
            .then(res => res.json())
            .then(data => setMenuItems(data))
    }, [])

    const onSubmit = async (data) => {

       
        if (!data.title) {
            toast.error("Menu Title is required", {
                style: {
                    borderRadius: "10px",
                    border: "2px solid red",
                }
            })
            return;
        }

        data.active = true
        data.order = menuItems.length + 1

        try {
            const result = await fetch("/api/admin/website-manage/addMenu", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            })

            if (!result.ok) {
                toast.error("Failed To Add Menu", {
                    style: {
                        borderRadius: "10px",
                        border: "2px solid red",
                    },
                })
            } else {
                setValue("title", "");
                toast.success("Menu added successfully!", {
                    style: {
                        borderRadius: "10px",
                        border: "2px solid green",
                    },
                })
                window.location.reload()
            }
        } catch (error) {
            toast.error("Something went wrong", {
                style: {
                    borderRadius: "10px",
                    border: "2px solid red",
                },
            })
        }
    }

    const handleUpdate = async (data) => {
        try {
            const response = await fetch(`/api/admin/website-manage/addMenu`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: editItem._id, ...data }),
            });

            if (response.ok) {
                toast.success("Menu updated successfully!", {
                    style: {
                        borderRadius: "10px",
                        border: "2px solid green",
                    },
                });
                setMenuItems(menuItems.map(item => item._id === editItem._id ? { ...item, ...data } : item));
                setEditItem(null);
                window.location.reload();
            } else {
                toast.error("Failed to update menu", {
                    style: {
                        borderRadius: "10px",
                        border: "2px solid red",
                    },
                });
            }
        } catch (error) {
            toast.error("Error updating menu item", {
                style: {
                    borderRadius: "10px",
                    border: "2px solid red",
                },
            });
        }
    };

    const toggleSwitch = async (id, currentStatus) => {
        try {
            const response = await fetch(`/api/admin/website-manage/addMenu`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, active: !currentStatus }),
            });

            const result = await response.json();

            if (result.message === "Menu updated successfully!") {
                setMenuItems(menuItems.map(item =>
                    item._id === id ? { ...item, active: !item.active } : item
                ));
            } else {
                toast.error("Failed to update menu", {
                    style: {
                        borderRadius: "10px",
                        border: "2px solid red",
                    },
                });
            }
        } catch (error) {
            console.error("Error updating menu item:", error);
        }
    }

    const handleEdit = (item) => {
        setEditItem(item);
        setValue("title", item.title);
        setValue("order", item.order);
    };

    const deleteMenuItem = async (id) => {
        try {
            const response = await fetch(`/api/admin/website-manage/addMenu`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });

            if (response.ok) {
                setMenuItems(menuItems.filter(item => item._id !== id));
                toast.success("Menu deleted successfully!", {
                    style: {
                        borderRadius: "10px",
                        border: "2px solid green",
                    },
                });
            } else {
                toast.error("Failed to delete menu", {
                    style: {
                        borderRadius: "10px",
                        border: "2px solid red",
                    },
                });
            }
        } catch (error) {
            console.error("Error deleting menu item:", error);
        }
    }

    if (session?.user?.isSubAdmin) {
        return window.location.replace("/admin/send_promotional_emails")
    }

    return (
        <SidebarInset className=" font-barlow">
            <header className="flex h-16 shrink-0 items-center gap-2">
                <div className="flex items-center gap-2 px-4">
                    <SidebarTrigger className="-ml-1" />
                </div>
            </header>
            {session?.user?.isAdmin && <>
                <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                    <h1 className="text-3xl md:text-4xl px-12 font-semibold">Manage Menu Section</h1>
                    <form onSubmit={handleSubmit(onSubmit)} className="flex items-end justify-center gap-4 my-20">
                        <div className="flex flex-col justify-center gap-2">
                            <Label htmlFor="menu">Menu</Label>
                            <Input
                                name="title"
                                id="title"
                                placeholder="Enter Menu Title"
                                className="md:w-96 border-2 border-blue-600 focus:border-dashed focus:border-blue-500 focus:outline-none focus-visible:ring-0"
                                {...register("title")}
                            />
                        </div>
                        <Button className="bg-blue-600 hover:bg-blue-500" type="submit">
                            Add
                        </Button>
                    </form>

                    <div className="bg-blue-100 p-4 rounded-lg shadow max-w-5xl mx-auto w-full text-center">
                        <div className="min-w-[100px] md:min-w-0">
                            <Table className="w-full min-w-max lg:min-w-0">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-center !text-black w-1/3">Menu Title</TableHead>
                                        <TableHead className="text-center !text-black w-1/3">Order</TableHead>
                                        <TableHead className="w-1/3 !text-black text-center">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {menuItems.map((item) => (
                                        <TableRow key={item._id}>
                                            <TableCell className="border font-semibold border-blue-600">{item.title}</TableCell>
                                            <TableCell className="border font-semibold border-blue-600">{item.order}</TableCell>
                                            <TableCell className="border font-semibold border-blue-600">
                                                <div className="flex items-center justify-center gap-6">
                                                    <Button size="icon" onClick={() => handleEdit(item)} variant="outline">
                                                        <Pencil className="w-4 h-4" />
                                                    </Button>
                                                    <Button size="icon" onClick={() => deleteMenuItem(item._id)} variant="destructive">
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                    <div className="flex items-center gap-2">
                                                        <Switch
                                                            id={`switch-${item._id}`}
                                                            checked={item.active}
                                                            onCheckedChange={() => toggleSwitch(item._id, item.active)}
                                                            className={`rounded-full transition-colors ${item.active ? "!bg-green-500" : "!bg-red-500"}`}
                                                        />
                                                        <Label htmlFor={`switch-${item._id}`} className="text-black">
                                                            {item.active ? "ON" : "OFF"}
                                                        </Label>
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>
                {editItem && (
                    <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
                        <DialogContent className="font-barlow">
                            <DialogHeader>
                                <DialogTitle>Edit Menu Item</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit(handleUpdate)}>
                                <div className="flex flex-col gap-2">
                                    <Label>Title</Label>
                                    <Input {...register("title")} />
                                </div>
                                <div className="flex flex-col gap-2 mt-4">
                                    <Label>Order</Label>
                                    <Input {...register("order")} min={0} max={menuItems.length + 1} type="number" />
                                </div>
                                <DialogFooter>
                                    <Button className="bg-blue-600 hover:bg-blue-500 mt-4" type="submit">Save Changes</Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                )}
            </>}
        </SidebarInset>
    )
}

export default Page;
