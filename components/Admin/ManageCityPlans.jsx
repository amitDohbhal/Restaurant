"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import { Badge } from "../ui/badge";
import { Button } from "../ui/button"
import toast from "react-hot-toast";
import { statesIndia } from "@/lib/IndiaStates";
import { Input } from "../ui/input";
import { NumericFormat } from "react-number-format";
import { Textarea } from "../ui/textarea";

const ManageCityPlans = () => {
    const { register, setValue, watch, handleSubmit } = useForm();

    const [cities, setCities] = useState([]);
    const [plans, setPlans] = useState([]);

    const [selectedState, setSelectedState] = useState("");
    const [selectedCity, setSelectedCity] = useState("");
    const [selectedPlan, setSelectedPlan] = useState("");

    watch()

    useEffect(() => {
        const fetchCities = async () => {
            try {
                const response = await fetch("/api/admin/website-manage/addCityName");
                const res = await response.json();
                if (response.ok) {
                    setCities(res.cities);
                } else {
                    toast.error(res.message, {
                        style: { borderRadius: "10px", border: "2px solid red" }
                    });
                }
            } catch (error) {
                toast.error("Failed to fetch cities", {
                    style: { borderRadius: "10px", border: "2px solid red" }
                });
            }
        };
        fetchCities();
    }, []);

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const response = await fetch("/api/admin/website-manage/addPlanType");
                const res = await response.json();
                if (response.ok) {
                    setPlans(res);
                } else {
                    toast.error(res.message, {
                        style: { borderRadius: "10px", border: "2px solid red" }
                    });
                }
            } catch (error) {
                toast.error("Failed to fetch plans", {
                    style: { borderRadius: "10px", border: "2px solid red" }
                });
            }
        };
        fetchPlans();
    }, []);

    useEffect(() => {
        if (selectedPlan && selectedCity) {
            const plan = plans.find(plan => plan.planName === selectedPlan);
            if (plan) {
                const cityData = plan.cities.find(city => city.city === selectedCity);
                if (cityData) {
                    // If data exists for the selected city and plan, populate the form fields
                    setValue("planName", plan.planName);
                    setValue("hotelName", cityData.hotelName);
                    setValue("adultPlan", cityData.adultPlan);
                    setValue("childPlan", cityData.childPlan);
                } else {
                    setValue("hotelName", "");
                    setValue("adultPlan", {
                        ep: { wem: { price: 0, margin: 0 }, em: { price: 0, margin: 0 } },
                        cp: { wem: { price: 0, margin: 0 }, em: { price: 0, margin: 0 } },
                        map: { wem: { price: 0, margin: 0 }, em: { price: 0, margin: 0 } },
                        ap: { wem: { price: 0, margin: 0 }, em: { price: 0, margin: 0 } },
                    });
                    setValue("childPlan", {
                        ep: { wem: { price: 0, margin: 0 } },
                        cp: { wem: { price: 0, margin: 0 } },
                        map: { wem: { price: 0, margin: 0 } },
                        ap: { wem: { price: 0, margin: 0 } },
                    });
                }
            } else {
                setValue("hotelName", "");
                setValue("adultPlan", {
                    ep: { wem: { price: 0, margin: 0 }, em: { price: 0, margin: 0 } },
                    cp: { wem: { price: 0, margin: 0 }, em: { price: 0, margin: 0 } },
                    map: { wem: { price: 0, margin: 0 }, em: { price: 0, margin: 0 } },
                    ap: { wem: { price: 0, margin: 0 }, em: { price: 0, margin: 0 } },
                });
                setValue("childPlan", {
                    ep: { wem: { price: 0, margin: 0 } },
                    cp: { wem: { price: 0, margin: 0 } },
                    map: { wem: { price: 0, margin: 0 } },
                    ap: { wem: { price: 0, margin: 0 } },
                });
            }
        }
    }, [selectedPlan, selectedCity, plans, setValue]);

    const onSubmit = async (data) => {
        const updatedData = {
            _id: plans.find(plan => plan.planName === selectedPlan)?._id,
            planName: data.planName,
            cities: [{
                city: selectedCity,
                hotelName: data.hotelName,
                adultPlan: data.adultPlan,
                childPlan: data.childPlan
            }]
        }
        try {
            const response = await fetch("/api/admin/website-manage/addPlanType/updatePlanType", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(updatedData)
            })

            const res = await response.json()

            if (response.ok) {
                toast.success(res.message, { style: { borderRadius: "10px", border: "2px solid green" } });
                window.location.reload();
            } else {
                toast.error(res.message, { style: { borderRadius: "10px", border: "2px solid red" } });
            }
        } catch (error) {
            toast.error("Something went wrong", { style: { borderRadius: "10px", border: "2px solid red" } });
        }
    }

    return (
        <div className="my-20 lg:max-w-full max-w-[45rem] bg-blue-100 p-4 rounded-lg">
            <div className="mx-auto max-w-5xl w-full my-10">
                <div className="flex items-center gap-4">
                    <Select
                        onValueChange={(value) => {
                            setSelectedState(value);
                        }}
                    >
                        <SelectTrigger className="border-2 bg-transparent border-blue-600 focus:border-blue-500 focus:ring-0 xl:w-96">
                            <SelectValue placeholder="Select State" />
                        </SelectTrigger>
                        <SelectContent className="font-barlow border-2 border-blue-600 bg-blue-100">
                            <SelectGroup>
                                {Array.isArray(statesIndia) ? statesIndia.sort().map((state, index) => (
                                    <SelectItem key={index} value={state} className="focus:bg-blue-300 font-bold truncate">
                                        {state}
                                    </SelectItem>
                                )) : null}
                            </SelectGroup>
                        </SelectContent>
                    </Select>

                    <Select
                        onValueChange={(value) => { setValue("city", value); setSelectedCity(value); }}
                        disabled={!selectedState}
                    >
                        <SelectTrigger className="border-2 bg-transparent border-blue-600 focus:border-blue-500 focus:ring-0 xl:w-96">
                            <SelectValue placeholder={"Select City"} />
                        </SelectTrigger>
                        <SelectContent className="font-barlow border-2 border-blue-600 bg-blue-100">
                            <SelectGroup>
                                {Array.isArray(cities) ?
                                    cities
                                        .filter(cityGroup => cityGroup.stateName === selectedState)
                                        .flatMap(cityGroup => cityGroup.cities)
                                        .map((city, index) => (
                                            <SelectItem key={index} value={city} className="focus:bg-blue-300 font-bold truncate">
                                                {city}
                                            </SelectItem>
                                        )) : null}
                            </SelectGroup>
                        </SelectContent>
                    </Select>

                    <Select disabled={!selectedCity} onValueChange={(value) => { setValue("planName", value); setSelectedPlan(value); }}>
                        <SelectTrigger className="border-2 bg-transparent border-blue-600 focus:border-blue-500 focus:ring-0 xl:w-96">
                            <SelectValue placeholder="Select Plan" />
                        </SelectTrigger>
                        <SelectContent className="font-barlow border-2 border-blue-600 bg-blue-100">
                            <SelectGroup>
                                {Array.isArray(plans) ? plans.map((plan, index) => (
                                    <SelectItem key={index} value={plan.planName} className="focus:bg-blue-300 font-bold truncate">
                                        {plan.planName}
                                    </SelectItem>
                                )) : null}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
                {selectedCity && selectedPlan && selectedCity && (
                    <div className="w-full overflow-x-auto lg:overflow-visible">
                        <div className="w-full min-w-max lg:min-w-0 mt-10 overflow-x-auto">
                            <Table className="w-full ">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead colSpan={9} className="text-center bg-blue-400 text-black py-2 text-lg border border-blue-600 align-middle">
                                            ADULT PLAN
                                        </TableHead>
                                    </TableRow>
                                    <TableRow>
                                        <TableHead rowSpan={2} className="w-32 text-center bg-blue-700 text-white border border-blue-600 align-middle">
                                            PAX
                                        </TableHead>
                                        <TableHead colSpan={2} className="text-center bg-red-200 border border-red-600 !text-black">
                                            EP
                                        </TableHead>
                                        <TableHead colSpan={2} className="text-center bg-yellow-200 border border-yellow-600 !text-black">
                                            CP
                                        </TableHead>
                                        <TableHead colSpan={2} className="text-center bg-orange-200 border border-orange-600 !text-black">
                                            MAP
                                        </TableHead>
                                        <TableHead colSpan={2} className="text-center bg-cyan-200 border border-cyan-600 !text-black">
                                            AP
                                        </TableHead>
                                    </TableRow>
                                    <TableRow>
                                        <TableHead className="text-center bg-blue-700 text-white border border-blue-600">
                                            Price
                                        </TableHead>
                                        <TableHead className="text-center bg-blue-700 text-white border border-blue-600">
                                            Margin %
                                        </TableHead>
                                        <TableHead className="text-center bg-blue-700 text-white border border-blue-600">
                                            Price
                                        </TableHead>
                                        <TableHead className="text-center bg-blue-700 text-white border border-blue-600">
                                            Margin %
                                        </TableHead>
                                        <TableHead className="text-center bg-blue-700 text-white border border-blue-600">
                                            Price
                                        </TableHead>
                                        <TableHead className="text-center bg-blue-700 text-white border border-blue-600">
                                            Margin %
                                        </TableHead>
                                        <TableHead className="text-center bg-blue-700 text-white border border-blue-600">
                                            Price
                                        </TableHead>
                                        <TableHead className="text-center bg-blue-700 text-white border border-blue-600">
                                            Margin %
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <TableRow>
                                        <TableCell className="border font-semibold border-blue-600 text-center align-middle">
                                            2
                                        </TableCell>
                                        <TableCell className="border border-blue-600">
                                            <NumericFormat thousandSeparator="," prefix="₹ " type="text" className="py-1.5 bg-transparent w-full text-center border rounded-md p-1 font-bold  border-blue-600" onValueChange={(value) => { setValue("adultPlan.ep.wem.price", value.floatValue); }} value={watch("adultPlan.ep.wem.price")} />
                                        </TableCell>
                                        <TableCell className="border border-blue-600">
                                            <Input type="number" step="0.01" min={0} className="w-full text-center border rounded-md p-1 font-bold  border-blue-600" {...register("adultPlan.ep.wem.margin", { setValueAs: (value) => value === "" ? 0 : parseFloat(value) })} />
                                        </TableCell>
                                        <TableCell className="border border-blue-600">
                                            <NumericFormat thousandSeparator="," prefix="₹ " type="text" className="py-1.5 bg-transparent w-full text-center border rounded-md p-1 font-bold  border-blue-600" onValueChange={(value) => { setValue("adultPlan.cp.wem.price", value.floatValue); }} value={watch("adultPlan.cp.wem.price")} />
                                        </TableCell>
                                        <TableCell className="border border-blue-600">
                                            <Input type="number" step="0.01" min={0} className="w-full text-center border rounded-md p-1 font-bold  border-blue-600" {...register("adultPlan.cp.wem.margin", { setValueAs: (value) => value === "" ? 0 : parseFloat(value) })} />
                                        </TableCell>
                                        <TableCell className="border border-blue-600">
                                            <NumericFormat thousandSeparator="," prefix="₹ " type="text" className="py-1.5 bg-transparent w-full text-center border rounded-md p-1 font-bold  border-blue-600" onValueChange={(value) => { setValue("adultPlan.map.wem.price", value.floatValue); }} value={watch("adultPlan.map.wem.price")} />
                                        </TableCell>
                                        <TableCell className="border border-blue-600">
                                            <Input type="number" step="0.01" min={0} className="w-full text-center border rounded-md p-1 font-bold  border-blue-600" {...register("adultPlan.map.wem.margin", { setValueAs: (value) => value === "" ? 0 : parseFloat(value) })} />
                                        </TableCell>
                                        <TableCell className="border border-blue-600">
                                            <NumericFormat thousandSeparator="," prefix="₹ " type="text" className="py-1.5 bg-transparent w-full text-center border rounded-md p-1 font-bold  border-blue-600" onValueChange={(value) => { setValue("adultPlan.ap.wem.price", value.floatValue); }} value={watch("adultPlan.ap.wem.price")} />
                                        </TableCell>
                                        <TableCell className="border border-blue-600">
                                            <Input type="number" step="0.01" min={0} className="w-full text-center border rounded-md p-1 font-bold  border-blue-600" {...register("adultPlan.ap.wem.margin", { setValueAs: (value) => value === "" ? 0 : parseFloat(value) })} />
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="border font-semibold border-blue-600 text-center align-middle">
                                            Extra Mattress
                                        </TableCell>
                                        <TableCell className="border border-blue-600">
                                            <NumericFormat thousandSeparator="," prefix="₹ " type="text" className="py-1.5 bg-transparent w-full text-center border rounded-md p-1 font-bold  border-blue-600" onValueChange={(value) => { setValue("adultPlan.ep.em.price", value.floatValue); }} value={watch("adultPlan.ep.em.price")} />
                                        </TableCell>
                                        <TableCell className="border border-blue-600">
                                            <Input type="number" step="0.01" min={0} className="w-full text-center border rounded-md p-1 font-bold  border-blue-600" {...register("adultPlan.ep.em.margin", { setValueAs: (value) => value === "" ? 0 : parseFloat(value) })} />
                                        </TableCell>
                                        <TableCell className="border border-blue-600">
                                            <NumericFormat thousandSeparator="," prefix="₹ " type="text" className="py-1.5 bg-transparent w-full text-center border rounded-md p-1 font-bold  border-blue-600" onValueChange={(value) => { setValue("adultPlan.cp.em.price", value.floatValue); }} value={watch("adultPlan.cp.em.price")} />
                                        </TableCell>
                                        <TableCell className="border border-blue-600">
                                            <Input type="number" step="0.01" min={0} className="w-full text-center border rounded-md p-1 font-bold  border-blue-600" {...register("adultPlan.cp.em.margin", { setValueAs: (value) => value === "" ? 0 : parseFloat(value) })} />
                                        </TableCell>
                                        <TableCell className="border border-blue-600">
                                            <NumericFormat thousandSeparator="," prefix="₹ " type="text" className="py-1.5 bg-transparent w-full text-center border rounded-md p-1 font-bold  border-blue-600" onValueChange={(value) => { setValue("adultPlan.map.em.price", value.floatValue); }} value={watch("adultPlan.map.em.price")} />
                                        </TableCell>
                                        <TableCell className="border border-blue-600">
                                            <Input type="number" step="0.01" min={0} className="w-full text-center border rounded-md p-1 font-bold  border-blue-600" {...register("adultPlan.map.em.margin", { setValueAs: (value) => value === "" ? 0 : parseFloat(value) })} />
                                        </TableCell>
                                        <TableCell className="border border-blue-600">
                                            <NumericFormat thousandSeparator="," prefix="₹ " type="text" className="py-1.5 bg-transparent w-full text-center border rounded-md p-1 font-bold  border-blue-600" onValueChange={(value) => { setValue("adultPlan.ap.em.price", value.floatValue); }} value={watch("adultPlan.ap.em.price")} />
                                        </TableCell>
                                        <TableCell className="border border-blue-600">
                                            <Input type="number" step="0.01" min={0} className="w-full text-center border rounded-md p-1 font-bold  border-blue-600" {...register("adultPlan.ap.em.margin", { setValueAs: (value) => value === "" ? 0 : parseFloat(value) })} />
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </div>
                        <div className="w-full min-w-max lg:min-w-0 mt-10 overflow-x-auto">
                            <Table className="w-full">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead colSpan={9} className="text-center bg-blue-400 text-black py-2 text-lg border border-blue-600 align-middle">
                                            CHILD PLAN
                                        </TableHead>
                                    </TableRow>
                                    <TableRow>
                                        <TableHead rowSpan={2} className="w-32 text-center bg-blue-700 text-white border border-blue-600 align-middle">
                                            PAX
                                        </TableHead>
                                        <TableHead colSpan={2} className="text-center bg-red-200 border border-red-600 !text-black">
                                            EP
                                        </TableHead>
                                        <TableHead colSpan={2} className="text-center bg-yellow-200 border border-yellow-600 !text-black">
                                            CP
                                        </TableHead>
                                        <TableHead colSpan={2} className="text-center bg-orange-200 border border-orange-600 !text-black">
                                            MAP
                                        </TableHead>
                                        <TableHead colSpan={2} className="text-center bg-cyan-200 border border-cyan-600 !text-black">
                                            AP
                                        </TableHead>
                                    </TableRow>
                                    <TableRow>
                                        <TableHead className="text-center bg-blue-700 text-white border border-blue-600">
                                            Price
                                        </TableHead>
                                        <TableHead className="text-center bg-blue-700 text-white border border-blue-600">
                                            Margin %
                                        </TableHead>
                                        <TableHead className="text-center bg-blue-700 text-white border border-blue-600">
                                            Price
                                        </TableHead>
                                        <TableHead className="text-center bg-blue-700 text-white border border-blue-600">
                                            Margin %
                                        </TableHead>
                                        <TableHead className="text-center bg-blue-700 text-white border border-blue-600">
                                            Price
                                        </TableHead>
                                        <TableHead className="text-center bg-blue-700 text-white border border-blue-600">
                                            Margin %
                                        </TableHead>
                                        <TableHead className="text-center bg-blue-700 text-white border border-blue-600">
                                            Price
                                        </TableHead>
                                        <TableHead className="text-center bg-blue-700 text-white border border-blue-600">
                                            Margin %
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <TableRow>
                                        <TableCell className="border font-semibold border-blue-600 text-center align-middle">
                                            1
                                        </TableCell>
                                        <TableCell className="border border-blue-600">
                                            <NumericFormat thousandSeparator="," prefix="₹ " type="text" className="py-1.5 bg-transparent w-full text-center border rounded-md p-1 font-bold  border-blue-600" onValueChange={(value) => { setValue("childPlan.ep.wem.price", value.floatValue); }} value={watch("childPlan.ep.wem.price")} />
                                        </TableCell>
                                        <TableCell className="border border-blue-600">
                                            <Input type="number" step="0.01" min={0} className="w-full text-center border rounded-md p-1 font-bold  border-blue-600" {...register("childPlan.ep.wem.margin", { setValueAs: (value) => value === "" ? 0 : parseFloat(value) })} />
                                        </TableCell>
                                        <TableCell className="border border-blue-600">
                                            <NumericFormat thousandSeparator="," prefix="₹ " type="text" className="py-1.5 bg-transparent w-full text-center border rounded-md p-1 font-bold  border-blue-600" onValueChange={(value) => { setValue("childPlan.cp.wem.price", value.floatValue); }} value={watch("childPlan.cp.wem.price")} />
                                        </TableCell>
                                        <TableCell className="border border-blue-600">
                                            <Input type="number" step="0.01" min={0} className="w-full text-center border rounded-md p-1 font-bold  border-blue-600" {...register("childPlan.cp.wem.margin", { setValueAs: (value) => value === "" ? 0 : parseFloat(value) })} />
                                        </TableCell>
                                        <TableCell className="border border-blue-600">
                                            <NumericFormat thousandSeparator="," prefix="₹ " type="text" className="py-1.5 bg-transparent w-full text-center border rounded-md p-1 font-bold  border-blue-600" onValueChange={(value) => { setValue("childPlan.map.wem.price", value.floatValue); }} value={watch("childPlan.map.wem.price")} />
                                        </TableCell>
                                        <TableCell className="border border-blue-600">
                                            <Input type="number" step="0.01" min={0} className="w-full text-center border rounded-md p-1 font-bold  border-blue-600" {...register("childPlan.map.wem.margin", { setValueAs: (value) => value === "" ? 0 : parseFloat(value) })} />
                                        </TableCell>
                                        <TableCell className="border border-blue-600">
                                            <NumericFormat thousandSeparator="," prefix="₹ " type="text" className="py-1.5 bg-transparent w-full text-center border rounded-md p-1 font-bold  border-blue-600" onValueChange={(value) => { setValue("childPlan.ap.wem.price", value.floatValue); }} value={watch("childPlan.ap.wem.price")} />
                                        </TableCell>
                                        <TableCell className="border border-blue-600">
                                            <Input type="number" step="0.01" min={0} className="w-full text-center border rounded-md p-1 font-bold  border-blue-600" {...register("childPlan.ap.wem.margin", { setValueAs: (value) => value === "" ? 0 : parseFloat(value) })} />
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                            <div className="mt-12 flex flex-col gap-2">
                                <label className="font-semibold">Hotel Name:</label>
                                <Textarea rows={4} className="border-2 border-blue-600" placeholder="Hotel Name" {...register("hotelName")} />
                            </div>
                        </div>
                    </div>
                )}
                <div className="flex justify-center mt-12">
                    <Button className="bg-blue-600 !px-8 !py-6 text-lg hover:bg-blue-500" type="submit">Save</Button>
                </div>
            </form>

        </div>
    );
};

export default ManageCityPlans;
