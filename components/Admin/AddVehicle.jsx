'use client'

import { usePackage } from "@/context/PackageContext"
import { useForm } from "react-hook-form"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { statesIndia } from "@/lib/IndiaStates"
import toast from "react-hot-toast"
import { Input } from "../ui/input"
import { NumericFormat } from "react-number-format"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { useEffect, useState } from "react"
import { Checkbox } from "../ui/checkbox"
import { Label } from "../ui/label"


const AddVehicle = () => {
  const { handleSubmit, register, getValues, setValue, reset, watch } = useForm({
    defaultValues: {
      vehiclePlan: {
        vehicleName1: "",
        vehicleName2: "",
        vehicleName3: "",
        vehiclePrice1: 0,
        vehiclePrice2: 0,
        vehiclePrice3: 0,
        pickup: {
          state: "",
          city: "",
          price1: 0,
          price2: 0,
          price3: 0,
        },
        drop: {
          state: "",
          city: "",
          price1: 0,
          price2: 0,
          price3: 0,
        },
      },
    },
  });

  const dropState = watch("vehiclePlan.drop.state");
  const dropCity = watch("vehiclePlan.drop.city");
  const pickupState = watch("vehiclePlan.pickup.state");
  const pickupCity = watch("vehiclePlan.pickup.city");

  const packages = usePackage()
  const [selectedPickupState, setSelectedPickupState] = useState("");
  const [selectedDropState, setSelectedDropState] = useState("");
  const [selectedPickupCity, setSelectedPickupCity] = useState("");
  const [selectedDropCity, setSelectedDropCity] = useState("");
  const [cities, setCities] = useState([]);

  const [selectedPickupOptions, setSelectedPickupOptions] = useState([]);
  const [selectedDropOptions, setSelectedDropOptions] = useState([]);

  const handlePickupCheckboxChange = (value) => {
    setSelectedPickupOptions((prev) =>
      prev.includes(value)
        ? prev.filter((option) => option !== value)
        : [...prev, value]
    );
  };
  const handleDropCheckboxChange = (value) => {
    setSelectedDropOptions((prev) =>
      prev.includes(value)
        ? prev.filter((option) => option !== value)
        : [...prev, value]
    );
  };

  useEffect(() => {
    if (packages) {
      Object.entries(packages.vehiclePlan).forEach(([key, value]) => {
        setValue(`vehiclePlan.${key}`, value);
      });

      // Ensure state is updated
      setSelectedPickupState(packages?.vehiclePlan?.pickup?.state || "");
      setSelectedDropState(packages?.vehiclePlan?.drop?.state || "");
      setSelectedPickupOptions(packages?.vehiclePlan?.pickup?.vehicleType || []);
      setSelectedDropOptions(packages?.vehiclePlan?.drop?.vehicleType || []);
    }
  }, [packages]);

  // Ensure selected state is updated when form value changes
  useEffect(() => {
    if (pickupState) setSelectedPickupState(pickupState);
  }, [pickupState]);

  useEffect(() => {
    if (dropState) setSelectedDropState(dropState);
  }, [dropState]);

  useEffect(() => {
    if (pickupCity) setSelectedPickupCity(pickupCity);
  }, [pickupCity]);

  useEffect(() => {
    if (dropCity) setSelectedDropCity(dropCity);
  }, [dropCity]);

  // Fetch cities from API
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await fetch("/api/admin/website-manage/addCityName");
        const res = await response.json();
        if (response.ok) {
          setCities(res.cities);
        } else {
          toast.error(res.message, {
            style: { borderRadius: "10px", border: "2px solid red" },
          });
        }
      } catch (error) {
        toast.error("Failed to fetch cities", {
          style: { borderRadius: "10px", border: "2px solid red" },
        });
      }
    };

    fetchCities();
  }, []);

  const onSubmit = async (data) => {
    data.pkgId = packages._id
    data.vehiclePlan.pickup.vehicleType = selectedPickupOptions;
    data.vehiclePlan.drop.vehicleType = selectedDropOptions;
    data.vehiclePlan.pickup.state = selectedPickupState;
    data.vehiclePlan.pickup.city = selectedPickupCity;
    data.vehiclePlan.drop.state = selectedDropState;
    data.vehiclePlan.drop.city = selectedDropCity;

    if (data.vehiclePlan.vehicleName1 === "" || data.vehiclePlan.vehicleName2 === "" || data.vehiclePlan.vehicleName3 === "") {
      toast.error("Vehicle Name is required", {
        style: {
          border: "2px solid red",
          borderRadius: "10px",
        }
      })
      return
    }
    if (data.vehiclePlan.vehiclePrice1 === 0 || data.vehiclePlan.vehiclePrice2 === 0 || data.vehiclePlan.vehiclePrice3 === 0) {
      toast.error("Vehicle Price is required", {
        style: {
          border: "2px solid red",
          borderRadius: "10px",
        }
      })
      return
    }
    if (selectedPickupState === '' || selectedPickupCity === '') {
      toast.error("Pickup State/City is required", {
        style: {
          border: "2px solid red",
          borderRadius: "10px",
        }
      })
      return
    }
    if (data.vehiclePlan.pickup.price1 === 0 || data.vehiclePlan.pickup.price2 === 0 || data.vehiclePlan.pickup.price3 === 0) {
      toast.error("Pickup Price is required", {
        style: {
          border: "2px solid red",
          borderRadius: "10px",
        }
      })
      return
    }
    if (selectedDropState === '' || selectedDropCity === '') {
      toast.error("Drop State/City is required", {
        style: {
          border: "2px solid red",
          borderRadius: "10px",
        }
      })
      return
    }
    if (data.vehiclePlan.drop.price1 === 0 || data.vehiclePlan.drop.price2 === 0 || data.vehiclePlan.drop.price3 === 0) {
      toast.error("Drop Price is required", {
        style: {
          border: "2px solid red",
          borderRadius: "10px",
        }
      })
      return
    }

    try {
      const response = await fetch("/api/admin/website-manage/addPackage/addVehicle", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })
      const res = await response.json()
      if (response.ok) {
        toast.success(res.message, {
          style: {
            border: "2px solid green",
            borderRadius: "10px",
          }
        })
        window.location.reload();
      } else {
        toast.error(res.message, {
          style: {
            border: "2px solid red",
            borderRadius: "10px",
          }
        })
      }
    } catch (error) {
      toast.error("Something went wrong, Please try again", {
        style: {
          border: "2px solid red",
          borderRadius: "10px",
        }
      })
    }

  }

  return (
    <>
      <form className="flex flex-col items-center gap-8 my-20 w-full overflow-x-auto lg:overflow-visible bg-blue-100 max-w-7xl p-4 rounded-lg" onSubmit={handleSubmit(onSubmit)}>
        <h1 className="text-4xl font-semibold">Add Vehicle Plan</h1>
        <Table className="w-full min-w-max lg:min-w-0">
          <TableHeader>
            <TableRow>
              <TableHead className="text-center !text-black">Category</TableHead>
              <TableHead className="!text-black text-center">Vehicle Name</TableHead>
              <TableHead className="!text-black text-center">Fix Vehicle Price (For Entire Trip)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="border font-semibold border-yellow-500 bg-yellow-200 w-1/3">Category 1 (2-4 People)</TableCell>
              <TableCell className="border font-semibold border-blue-600 w-1/3">
                <Input type="text" className="border-2 border-blue-600 focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:outline-none focus:border-dashed"  {...register("vehiclePlan.vehicleName1")} />
              </TableCell>
              <TableCell className="border font-semibold border-blue-600 w-1/3">
                <NumericFormat thousandSeparator=","
                  decimalSeparator="."
                  prefix="₹ "
                  value={watch("vehiclePlan.vehiclePrice1")}
                  onValueChange={(values) => setValue("vehiclePlan.vehiclePrice1", values.floatValue)} className="w-full p-1.5 rounded-md bg-transparent border-2 border-blue-600 focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:outline-none focus:border-dashed" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="border font-semibold border-cyan-500 bg-cyan-200 w-1/3">Category 2 (5-7 People)</TableCell>
              <TableCell className="border font-semibold border-blue-600 w-1/3">
                <Input type="text" className="border-2 border-blue-600 focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:outline-none focus:border-dashed" {...register("vehiclePlan.vehicleName2")} />
              </TableCell>
              <TableCell className="border font-semibold border-blue-600 w-1/3">
                <NumericFormat thousandSeparator=","
                  decimalSeparator="."
                  prefix="₹ "
                  value={watch("vehiclePlan.vehiclePrice2")}
                  onValueChange={(values) => setValue("vehiclePlan.vehiclePrice2", values.floatValue)} className="w-full p-1.5 rounded-md bg-transparent border-2 border-blue-600 focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:outline-none focus:border-dashed" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="border font-semibold border-orange-500 bg-orange-200 w-1/3">Category 3 (8 and Above People)</TableCell>
              <TableCell className="border font-semibold border-blue-600 w-1/3">
                <Input type="text" className="border-2 border-blue-600 focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:outline-none focus:border-dashed" {...register("vehiclePlan.vehicleName3")} />
              </TableCell>
              <TableCell className="border font-semibold border-blue-600 w-1/3">
                <NumericFormat thousandSeparator=","
                  decimalSeparator="."
                  prefix="₹ "
                  value={watch("vehiclePlan.vehiclePrice3")}
                  onValueChange={(values) => setValue("vehiclePlan.vehiclePrice3", values.floatValue)} className="w-full p-1.5 rounded-md bg-transparent border-2 border-blue-600 focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:outline-none focus:border-dashed" />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <h1 className="text-4xl font-semibold mt-12">Pickup & Drop</h1>
        <Table className="w-full min-w-max lg:min-w-0">
          <TableHeader>
            <TableRow>
              <TableHead className="text-center !text-black border font-semibold border-blue-500 bg-blue-100 w-1/4">State/City</TableHead>
              <TableHead className="!text-black text-center border font-semibold border-yellow-500 bg-yellow-200 w-1/4">Cat-1 Price</TableHead>
              <TableHead className="!text-black text-center border font-semibold border-cyan-500 bg-cyan-200 w-1/4">Cat-2 Price</TableHead>
              <TableHead className="!text-black text-center border font-semibold border-orange-500 bg-orange-200 w-1/4">Cat-3 Price</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="border-l font-semibold border-blue-600 flex flex-col items-center gap-4">
                <Label>Pickup</Label>
                <div className="flex gap-4">
                  <Select
                    name="state"
                    className="p-2 border border-gray-300 rounded-md"
                    value={selectedPickupState}
                    onValueChange={(value) => { setValue(`vehiclePlan.pickup.state`, value); setSelectedPickupState(value) }}
                  >
                    <SelectTrigger className="border-2 bg-transparent border-blue-600 focus:border-blue-500 focus:ring-0 focus:outline-none focus-visible:outline-none focus-visible:ring-0 w-52">
                      <SelectValue placeholder="Select State" className="truncate" />
                    </SelectTrigger>
                    <SelectContent className="border-2 border-blue-600 font-barlow bg-blue-100">
                      <SelectGroup>
                        {statesIndia.sort().map((state, index) => (
                          <SelectItem
                            key={index}
                            className="focus:bg-blue-300 font-bold truncate"
                            value={state}
                          >
                            {state}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <Select
                    name="city"
                    className="p-2 border border-gray-300 rounded-md"
                    value={selectedPickupCity}
                    onValueChange={(value) => setValue(`vehiclePlan.pickup.city`, value)}
                  >
                    <SelectTrigger className="border-2 bg-transparent border-blue-600 focus:border-blue-500 focus:ring-0 focus:outline-none focus-visible:outline-none focus-visible:ring-0 w-52">
                      <SelectValue placeholder="Select City for Pickup" className="truncate" />
                    </SelectTrigger>
                    <SelectContent className="border-2 border-blue-600 font-barlow bg-blue-100">
                      <SelectGroup>
                        {cities
                          .filter(cityGroup => cityGroup.stateName === selectedPickupState)
                          .flatMap(cityGroup => cityGroup.cities.map((city, index) => (
                            <SelectItem
                              key={index}
                              className="focus:bg-blue-300 font-bold truncate"
                              value={city}
                            >
                              {city}
                            </SelectItem>
                          )))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </TableCell>
              <TableCell className="border font-semibold border-blue-600 w-1/4">
                <NumericFormat thousandSeparator=","
                  decimalSeparator="."
                  prefix="₹ "
                  value={watch("vehiclePlan.pickup.price1")}
                  onValueChange={(values) => setValue("vehiclePlan.pickup.price1", values.floatValue)} className="w-full p-1.5 rounded-md bg-transparent border-2 border-blue-600 focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:outline-none focus:border-dashed" />
              </TableCell>
              <TableCell className="border font-semibold border-blue-600 w-1/4">
                <NumericFormat thousandSeparator=","
                  decimalSeparator="."
                  prefix="₹ "
                  value={watch("vehiclePlan.pickup.price2")}
                  onValueChange={(values) => setValue("vehiclePlan.pickup.price2", values.floatValue)} className="w-full p-1.5 rounded-md bg-transparent border-2 border-blue-600 focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:outline-none focus:border-dashed" />
              </TableCell>
              <TableCell className="border font-semibold border-blue-600 w-1/4">
                <NumericFormat thousandSeparator=","
                  decimalSeparator="."
                  prefix="₹ "
                  value={watch("vehiclePlan.pickup.price3")}
                  onValueChange={(values) => setValue("vehiclePlan.pickup.price3", values.floatValue)} className="w-full p-1.5 rounded-md bg-transparent border-2 border-blue-600 focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:outline-none focus:border-dashed" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell colSpan={4} className="border font-semibold border-blue-600 w-1/4">
                <div className="flex items-center justify-center gap-8 my-2">
                  <div className="flex items-center space-x-2 border-2 border-blue-600 bg-blue-300 p-2 rounded-full">
                    <Checkbox
                      id="pickupRailwayStation"
                      className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                      checked={selectedPickupOptions.includes("Railway Station")}
                      onCheckedChange={() => handlePickupCheckboxChange("Railway Station")}
                    />
                    <label htmlFor="pickupRailwayStation" className="text-sm font-medium leading-none">
                      Railway Station
                    </label>
                  </div>
                  <div className="flex items-center space-x-2 border-2 border-blue-600 bg-blue-300 p-2 rounded-full">
                    <Checkbox
                      id="pickupBusStand"
                      className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                      checked={selectedPickupOptions.includes("Bus Stand")}
                      onCheckedChange={() => handlePickupCheckboxChange("Bus Stand")}
                    />
                    <label htmlFor="pickupBusStand" className="text-sm font-medium leading-none">
                      Bus Stand
                    </label>
                  </div>
                  <div className="flex items-center space-x-2 border-2 border-blue-600 bg-blue-300 p-2 rounded-full">
                    <Checkbox
                      id="pickupAirport"
                      className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                      checked={selectedPickupOptions.includes("Airport")}
                      onCheckedChange={() => handlePickupCheckboxChange("Airport")}
                    />
                    <label htmlFor="pickupAirport" className="text-sm font-medium leading-none">
                      Airport
                    </label>
                  </div>
                </div>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="border-l font-semibold border-blue-600 flex flex-col items-center gap-4">
                <Label>Drop</Label>
                <div className="flex gap-4">
                  <Select
                    name="state"
                    className="p-2 border border-gray-300 rounded-md"
                    value={selectedDropState}
                    onValueChange={(value) => { setValue(`vehiclePlan.drop.state`, value); setSelectedDropState(value) }}
                  >
                    <SelectTrigger className="border-2 bg-transparent border-blue-600 focus:border-blue-500 focus:ring-0 focus:outline-none focus-visible:outline-none focus-visible:ring-0 w-52">
                      <SelectValue placeholder="Select State" className="truncate" />
                    </SelectTrigger>
                    <SelectContent className="border-2 border-blue-600 font-barlow bg-blue-100">
                      <SelectGroup>
                        {statesIndia.sort().map((state, index) => (
                          <SelectItem
                            key={index}
                            className="focus:bg-blue-300 font-bold truncate"
                            value={state}
                          >
                            {state}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <Select
                    name="city"
                    className="p-2 border border-gray-300 rounded-md"
                    value={selectedDropCity}
                    onValueChange={(value) => setValue(`vehiclePlan.drop.city`, value)}
                  >
                    <SelectTrigger className="border-2 bg-transparent border-blue-600 focus:border-blue-500 focus:ring-0 focus:outline-none focus-visible:outline-none focus-visible:ring-0 w-52">
                      <SelectValue placeholder="Select City for Drop" className="truncate" />
                    </SelectTrigger>
                    <SelectContent className="border-2 border-blue-600 font-barlow bg-blue-100">
                      <SelectGroup>
                        {cities
                          .filter(cityGroup => cityGroup.stateName === selectedDropState)
                          .flatMap(cityGroup => cityGroup.cities.map((city, index) => (
                            <SelectItem
                              key={index}
                              className="focus:bg-blue-300 font-bold truncate"
                              value={city}
                            >
                              {city}
                            </SelectItem>
                          )))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </TableCell>
              <TableCell className="border font-semibold border-blue-600 w-1/4">
                <NumericFormat thousandSeparator=","
                  decimalSeparator="."
                  prefix="₹ "
                  value={watch("vehiclePlan.drop.price1")}
                  onValueChange={(values) => setValue("vehiclePlan.drop.price1", values.floatValue)} className="w-full p-1.5 rounded-md bg-transparent border-2 border-blue-600 focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:outline-none focus:border-dashed" />
              </TableCell>
              <TableCell className="border font-semibold border-blue-600 w-1/4">
                <NumericFormat thousandSeparator=","
                  decimalSeparator="."
                  prefix="₹ "
                  value={watch("vehiclePlan.drop.price2")}
                  onValueChange={(values) => setValue("vehiclePlan.drop.price2", values.floatValue)} className="w-full p-1.5 rounded-md bg-transparent border-2 border-blue-600 focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:outline-none focus:border-dashed" />
              </TableCell>
              <TableCell className="border font-semibold border-blue-600 w-1/4">
                <NumericFormat thousandSeparator=","
                  decimalSeparator="."
                  prefix="₹ "
                  value={watch("vehiclePlan.drop.price3")}
                  onValueChange={(values) => setValue("vehiclePlan.drop.price3", values.floatValue)} className="w-full p-1.5 rounded-md bg-transparent border-2 border-blue-600 focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:outline-none focus:border-dashed" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell colSpan={4} className="border font-semibold border-blue-600 w-1/4">
                <div className="flex items-center justify-center gap-8 my-2">
                  <div className="flex items-center space-x-2 border-2 border-blue-600 bg-blue-300 p-2 rounded-full">
                    <Checkbox
                      id="dropRailwayStation"
                      className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                      checked={selectedDropOptions.includes("Railway Station")}
                      onCheckedChange={() => handleDropCheckboxChange("Railway Station")}
                    />
                    <label htmlFor="dropRailwayStation" className="text-sm font-medium leading-none">
                      Railway Station
                    </label>
                  </div>
                  <div className="flex items-center space-x-2 border-2 border-blue-600 bg-blue-300 p-2 rounded-full">
                    <Checkbox
                      id="dropBusStand"
                      className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                      checked={selectedDropOptions.includes("Bus Stand")}
                      onCheckedChange={() => handleDropCheckboxChange("Bus Stand")}
                    />
                    <label htmlFor="dropBusStand" className="text-sm font-medium leading-none">
                      Bus Stand
                    </label>
                  </div>
                  <div className="flex items-center space-x-2 border-2 border-blue-600 bg-blue-300 p-2 rounded-full">
                    <Checkbox
                      id="dropAirport"
                      className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                      checked={selectedDropOptions.includes("Airport")}
                      onCheckedChange={() => handleDropCheckboxChange("Airport")}
                    />
                    <label htmlFor="dropAirport" className="text-sm font-medium leading-none">
                      Airport
                    </label>
                  </div>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <button type="submit" className="bg-blue-600 text-white py-2 px-6 rounded
          hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-opacity-50">Save</button>
      </form>
    </>
  )
}

export default AddVehicle
