'use client';

import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Pencil, Trash, X } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Badge } from "../ui/badge";

const CreateWebpage = () => {
    const { register, handleSubmit, setValue } = useForm();
    const [editItem, setEditItem] = useState(null);
    const [webpages, setWebpages] = useState([]);

    // Fetch webpages on component mount
    useEffect(() => {
        const fetchPages = async () => {
            try {
                const response = await fetch("/api/getAllPages");
                const data = await response.json();
                setWebpages(data.pages);
            } catch (error) {
                toast.error(`Error fetching pages: ${error.message}`);
            }
        };
        fetchPages();
    }, []);

    const onEdit = (page) => {
        setEditItem(page._id);
        setValue("title", page.title);
        setValue("url", page.url);
    };

    const onDelete = async (id) => {
        try {
            const response = await fetch("/api/getAllPages", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });

            if (response.ok) {
                toast.success("Webpage deleted successfully");
                setWebpages(webpages.filter((page) => page._id !== id));
            } else {
                toast.error("Failed to delete webpage");
            }
        } catch (error) {
            toast.error("Something went wrong");
        }
    };

    const onSubmit = async (data) => {
        try {
            const method = editItem === "new" ? "POST" : "PATCH";
            const response = await fetch("/api/getAllPages", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: editItem !== "new" ? editItem : undefined,
                    title: data.title,
                    url: data.url,
                }),
            });

            const res = await response.json();

            if (response.ok) {
                toast.success(`Webpage ${editItem === "new" ? "created" : "updated"} successfully`);
                setEditItem(null);
                const updatedPages = await fetch("/api/getAllPages").then((res) => res.json());
                setWebpages(updatedPages.pages);
                window.location.reload();
            } else {
                toast.error(`Failed to ${editItem === "new" ? "create" : "update"} webpage: ${res.message}`);
            }
        } catch (error) {
            toast.error(`Something went wrong: ${error.message}`, {
                style: {
                    borderRadius: "10px",
                    border: "2px solid red",
                },
            });
        }
    };

    return (
        <div className="my-20 w-full flex font-barlow flex-col gap-10 items-center bg-blue-100 p-6 rounded-lg">
            <Button onClick={() => setEditItem("new")} className="mb-4 bg-blue-600 hover:bg-blue-500">
                Create New Webpage
            </Button>
            <Table className="max-w-6xl mx-auto">
                <TableHeader>
                    <TableRow>
                        <TableHead className="text-center w-4/6">Webpage Title</TableHead>
                        <TableHead className="text-center w-1/2">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {webpages?.map((page) => (
                        <TableRow key={page._id}>
                            <TableCell className="border font-semibold border-blue-600">
                                <Badge className="py-1.5 text-base mr-4 hover:bg-blue-600 bg-blue-500 border-2 border-blue-600">
                                    <a href={'/page/' + page.link} target="_blank">{page.title}</a>
                                </Badge>
                            </TableCell>
                            <TableCell className="border font-semibold border-blue-600 text-center">
                                <Button onClick={() => onEdit(page)} variant="outline" className="mr-4">
                                    <Pencil className="w-4 h-4" /> Edit
                                </Button>
                                <Button onClick={() => onDelete(page._id)} variant="destructive">
                                    <Trash className="w-4 h-4" /> Delete
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            {editItem && (
                <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
                    <DialogContent className="max-w-2xl font-barlow">
                        <DialogHeader>
                            <DialogTitle>{editItem === "new" ? "Create Webpage" : "Edit Webpage"}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 max-h-[60vh] overflow-y-scroll">
                            <div className="grid gap-4 py-4">
                                <Label>Title</Label>
                                <Input {...register("title")} placeholder="Enter the title of the webpage" className="border-2 border-gray-600" />

                                <Label>Page URL</Label>
                                <Input
                                    {...register("url")}
                                    className="border-2 border-gray-600"
                                    placeholder="Enter the URL for the webpage"
                                />
                            </div>
                            <Button className="bg-blue-600 hover:bg-blue-500" type="submit">
                                Save
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
};

export default CreateWebpage;
