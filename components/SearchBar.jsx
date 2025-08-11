"use client";

import { Input } from "@/components/ui/input";
import { CalendarClock, MapPin, Search, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function SearchBar({ placeholder }) {
    const [query, setQuery] = useState("");
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [relatedPackages, setRelatedPackages] = useState([]);
    const [packages, setPackages] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [quickCategories, setQuickCategories] = useState([]);
    const [recentSearches, setRecentSearches] = useState([]);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const router = useRouter();
    // console.log(categories)

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await fetch('/api/getAllMenuItems');
                const data = await res.json();
                // Flatten all subMenu titles from menu
                // console.log(data)
                const categories = [];
                (Array.isArray(data) ? data : []).forEach(menuItem => {
                    if (menuItem.subMenu && Array.isArray(menuItem.subMenu)) {
                        menuItem.subMenu.forEach(sub => {
                            if (sub.title && sub._id) categories.push({ id: sub._id, title: sub.title });
                        });
                    }
                });
                setCategories(categories);
            } catch (e) {
                setCategories([]);
            }
        };

        const fetchPackages = async () => {
            try {
                const res = await fetch("/api/getSearchPackages");
                const data = await res.json();
                if (data.packages) setPackages(data.packages);
            } catch (error) {
                // console.error("Error fetching packages:", error);
            }
        };

        fetchCategories();
        fetchPackages();

        const storedSearches = JSON.parse(localStorage.getItem("recentSearches")) || [];
        setRecentSearches(storedSearches);
    }, []);

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.ctrlKey && event.key === "k") {
                event.preventDefault();
                setIsSearchOpen(true);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    const handleSearch = async (event) => {
        const value = event.target.value;
        setQuery(value);

        if (value.trim().length < 2) {
            setRelatedProducts([]);
            return;
        }

        try {
            let url = `/api/product/search?q=${encodeURIComponent(value)}`;
            // Always send category param, even if 'all' (backend can handle 'all')
            url += `&category=${encodeURIComponent(selectedCategory)}`;
            const res = await fetch(url);
            const data = await res.json();
            setRelatedProducts(data.products || []);
        } catch (error) {
            setRelatedProducts([]);
        }
    };

    const handleCategoryChange = (e) => {
        setSelectedCategory(e.target.value);
        if (query.trim().length > 1) {
            handleSearch({ target: { value: query } });
        }
    };

    const handleQuickCategory = (cat) => {
        setSelectedCategory(cat);
        if (query.trim().length > 1) {
            handleSearch({ target: { value: query } });
        }
    };

    // const handlePackageClick = (id, name) => {
    //     const updatedSearches = [{ id, name }, ...recentSearches.filter((item) => item.id !== id)].slice(0, 5);
    //     setRecentSearches(updatedSearches);
    //     localStorage.setItem("recentSearches", JSON.stringify(updatedSearches));

    //     router.push(`/package/${encodeURIComponent(id)}`);
    //     setIsSearchOpen(false);
    // };

    const handleSubmit = () => {
        if (!query.trim()) return;
        router.push(`/search?q=${encodeURIComponent(query)}`);
        setIsSearchOpen(false);
    };

    // const clearRecentSearches = () => {
    //     localStorage.removeItem("recentSearches");
    //     setRecentSearches([]);
    // };

    return (
        <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
            <DialogTrigger asChild>
                <button className="p-2" aria-label="Open search">
                    <Search className="h-6 w-6" />
                </button>
            </DialogTrigger>
            <DialogContent
                className={`fixed top-[30%] w-full max-w-7xl rounded-none shadow-lg border-none p-0 bg-[#fefaf4] z-[1000] transition-all duration-200 overflow-y-visible ${query && relatedProducts.length > 0 ? 'min-h-[50vh] max-h-[100vh]' : 'h-auto'}`}
                style={{ margin: 0 }}
            >

                <DialogTitle>
                    <span className="sr-only">Product Search</span>
                </DialogTitle>
                <div className="flex items-center gap-2 px-10 h-6 min-h-[48px] bg-white sticky top-0 z-10 w-full">
                    <select
                        className="border rounded px-4 py-2 font-semibold bg-white text-black"
                        value={selectedCategory}
                        onChange={e => setSelectedCategory(e.target.value)}
                        style={{ minWidth: 160 }}
                    >
                        <option value="all">All Categories</option>
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>{cat.title}</option>
                        ))}
                    </select>
                    <input
                        type="text"
                        value={query}
                        onChange={handleSearch}
                        placeholder={placeholder || "Search Product"}
                        className="flex-1 border-0 outline-none px-4 py-2 text-lg bg-transparent w-full"
                        onKeyDown={(e) => {
                            if (e.key === "Enter") handleSubmit();
                        }}
                    />
                    <button onClick={handleSubmit} className="p-2">
                        <Search className="h-5 w-5" />
                    </button>
                    <button onClick={() => setIsSearchOpen(false)} className="p-2">
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>
                <div className="h-px bg-black"></div>

                {/* <div className="flex gap-4 px-8 py-2 border-b items-center bg-[#fefaf4]">
                    <span className="font-semibold text-gray-600">Quick Search :</span>
                    {quickCategories.map((cat) => (
                        <button key={cat._id || cat.id || cat} onClick={() => handleQuickCategory(cat.name || cat)} className="hover:underline text-black font-medium">
                            {cat.name || cat}
                        </button>
                    ))}
                </div> */}

                {query && relatedProducts.length > 0 && (
                    <div className="w-full px-8 pb-2 mt-2">
                        <h2 className="text-lg font-bold mb-2">Your Search Products</h2>
                        <div className="flex gap-6 overflow-x-auto pb-2">
                            {relatedProducts.map((prod, i) => (
                                <div
                                    key={prod._id || i}
                                    className="flex-shrink-0 w-42 rounded-xl flex flex-col items-center justify-center transition-shadow duration-200"
                                >
                                    <button
                                        type="button"
                                        onClick={() => {
                                            router.push(`/product/${prod._id}`);
                                            setIsSearchOpen(false);
                                        }}
                                        className="focus:outline-none"
                                        style={{ background: 'none', border: 'none', padding: 0, margin: 0, cursor: 'pointer', width: '100%' }}
                                        tabIndex={0}
                                    >
                                        <img
                                            src={prod.image?.url || "/placeholder.jpeg"}
                                            alt={prod.title}
                                            className="w-40 h-42 object-cover rounded-lg mb-3 hover:opacity-90 transition-opacity"
                                        />
                                    </button>
                                    <div className="flex flex-row justify-between items-center w-full pr-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                router.push(`/product/${prod._id}`);
                                                setIsSearchOpen(false);
                                            }}
                                            className="font-semibold text-black truncate max-w-[70%] text-left hover:underline focus:outline-none"
                                            style={{ background: 'none', border: 'none', padding: 0, margin: 0, cursor: 'pointer' }}
                                            tabIndex={0}
                                            title={prod.title}
                                        >
                                            {prod.title || "Product"}
                                        </button>
                                        <span className="font-bold text-black whitespace-nowrap">₹{prod.price ? prod.price.toLocaleString("en-IN") : "—"}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* {query && relatedPackages.length > 0 && (
                    <div className="px-8">
                        <h2 className="mt-4 text-xl font-medium mb-2 font-barlow">Search Results: {query}</h2>
                        <ul className="mt-2 border rounded-md shadow-sm bg-white max-h-[25rem] overflow-y-auto">
                            {relatedPackages.map((pkg, index) => (
                                <li
                                    key={index}
                                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center space-x-4"
                                    onClick={() => handlePackageClick(pkg?._id, pkg?.packageName)}
                                >
                                    <Image src={pkg?.basicDetails?.thumbnail?.url} width={1280} height={720} quality={50} alt={pkg?.packageName} className="w-24 h-24 rounded-md object-cover" />
                                    <div>
                                        <p className="font-medium">{pkg?.packageName}</p>
                                        <p className="text-xs flex items-center text-gray-500">
                                            <MapPin className="h-4 w-4 mr-1" />
                                            {pkg?.basicDetails?.location}
                                        </p>
                                        <p className="flex items-center text-xs text-gray-500">
                                            <CalendarClock className="h-4 w-4 mr-1" />
                                            {pkg?.basicDetails?.duration} Days {pkg?.basicDetails?.duration - 1} Nights
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )} */}

                {/* {recentSearches.length > 0 && (
                    <div className="px-8 mt-4">
                        <p className="text-sm text-gray-500">Recent Packages</p>
                        <ul className="mt-2 border rounded-md shadow-sm bg-white">
                            {recentSearches.map((search, index) => (
                                <li
                                    key={index}
                                    className="flex justify-between items-center px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                    onClick={() => handlePackageClick(search.id, search.name)}
                                >
                                    <span>{search.name}</span>
                                    <X
                                        className="h-4 w-4 text-gray-400 hover:text-red-500"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const filteredSearches = recentSearches.filter((item) => item.id !== search.id);
                                            setRecentSearches(filteredSearches);
                                            localStorage.setItem("recentSearches", JSON.stringify(filteredSearches));
                                        }}
                                    />
                                </li>
                            ))}
                        </ul>
                        <button onClick={clearRecentSearches} className="text-sm text-red-500 mt-2 hover:underline">
                            Clear recent searches
                        </button>
                    </div>
                )} */}
            </DialogContent>
        </Dialog>
    );
}
