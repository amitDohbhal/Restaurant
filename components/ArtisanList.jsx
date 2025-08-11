"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Star, Eye, Globe } from 'lucide-react';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import Image from "next/image";


const BannerSection = () => (
    <div className="relative h-64 md:h-80 flex items-center justify-center">
        <img
            src="/artisanBanner.jpg"
            alt="Artisan Banner"
            className="absolute inset-0 w-full h-full object-cover object-top px-2"
        />
    </div>
);

const LeftTextBlock = () => (
    <div className="bg-black text-white flex flex-col justify-center items-center p-8 h-96 w-full md:w-[25%] mt-4">
        <h2 className="text-5xl font-extrabold mb-4 text-center">ARTISAN</h2>
        <div className="text-md font-medium mb-2 text-center">Celebrating the Art of Craftsmanship.<br />Honoring the Hands That Shape Beauty</div>
    </div>
);

const ArtisanCard = ({ card }) => {
    return (
        <div key={card.id} className="relative group transition-all h-full w-[340px] flex flex-col bg-[#fbeff2] overflow-hidden">
            {/* Date Badge */}
            <div className="absolute top-5 left-5 z-20 flex items-center gap-2">
                <span className="bg-white rounded px-3 py-1 text-md font-bold shadow text-gray-800">{card.subtitle}</span>
            </div>
            {/* Card Image */}
            <div className="relative w-full h-96">
                <img
                    src={card.image}
                    alt={card.name}
                    className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                    style={{ objectFit: 'cover' }}
                />
            </div>
            {/* Card Content Overlay */}
            <div className="absolute left-0 bottom-0 w-full flex justify-between items-end p-6 bg-gradient-to-t from-black/70 via-black/30 to-transparent">
                <div>
                    <Link
                        href={`/artisan/${card.id}`}
                        className="font-bold text-2xl text-white mb-3 leading-tight drop-shadow-md hover:underline hover:decoration-2 hover:underline-offset-4 transition cursor-pointer"
                        title={card.name}
                    >
                        {card.name}
                    </Link>
                    <div className="text-md text-white drop-shadow-md">{card.title}</div>
                </div>
                {/* Arrow Button with Socials on Hover */}
                <div className="relative group/arrow">
                    <button className="bg-white text-black rounded-full w-12 h-12 flex items-center justify-center shadow transition group-hover/arrow:bg-[#e84393] group-hover/arrow:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                    {/* Social Icons: show on arrow hover */}
                    <div className="absolute bottom-12 right-0 flex flex-col gap-4 opacity-0 group-hover/arrow:opacity-100 transition-opacity duration-300 z-30 items-center">
                        {card.socials.slice(0, 6).map((s, i) => (
                            <a
                                key={i}
                                href={s.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={
                                    `bg-white rounded-full w-12 h-12 flex items-center justify-center shadow hover:bg-gray-100 transition transform translate-y-5 group-hover/arrow:translate-y-0`
                                }
                                style={{
                                    transitionProperty: 'transform, opacity, background-color, box-shadow',
                                    transitionDuration: '0.6s',
                                    transitionTimingFunction: 'cubic-bezier(0.4,0,0.2,1)',
                                    transitionDelay: `${i * 60}ms`
                                }}
                            >
                                {s.icon}
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const ArtisanList = () => {
    const [artisan, setArtisan] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const pageSize = 6; // for second row pagination
    const gridRef = useRef(null);
    useEffect(() => {
        if (gridRef.current) {
            gridRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }, [page]);
    // console.log(artisan)

    // Fetch Artisan (copied from RandomTourPackageSection)
    useEffect(() => {
        const fetchArtisan = async () => {
            try {
                const res = await fetch("/api/createArtisan");
                const data = await res.json();
                if (Array.isArray(data)) {
                    setArtisan(data);
                } else if (Array.isArray(data.artisans)) {
                    setArtisan(data.artisans);
                } else {
                    setArtisan([]);
                }
            } catch (error) {
                setArtisan([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchArtisan();
    }, []);


    // Row calculations
    const firstRowArtisans = artisan.slice(0, 6);
    const paginatedArtisans = artisan.slice(6 + (page - 1) * pageSize, 6 + page * pageSize);
    const totalPaginated = artisan.length > 6 ? artisan.length - 6 : 0;
    const totalPages = Math.ceil(totalPaginated / pageSize);
    const startIdx = 6 + (page - 1) * pageSize + 1;
    const endIdx = Math.min(6 + page * pageSize, artisan.length);

    if (isLoading) {
        return (
            <div className="w-full min-h-screen flex items-center justify-center bg-white">
                <div className="text-2xl font-bold text-gray-600 animate-pulse">Loading artisans...</div>
            </div>
        );
    }
    return (
        <div className="w-full min-h-screen bg-white " ref={gridRef}>
            <BannerSection />
            {/* Below banner: left text, right carousel */}
            <div className="w-full max-w-[1500px] mx-auto ">
                {/* Row 1: First 6 artisans */}
                <div className="flex flex-col md:flex-row w-full bg-black">
                    <LeftTextBlock />
                    <div className="flex-1 w-full px-2 flex flex-col overflow-hidden">
                        {isLoading ? (
                            <div className="text-center py-16 text-lg">Loading artisans...</div>
                        ) : (
                            <>
                                {/* Desktop Carousel: 4 per row */}
                                <div className="mt-4">
                                    <Carousel className="w-full">
                                        <CarouselContent className="flex gap-4 flex-nowrap w-full">
                                            {firstRowArtisans.map((item, idx) => {
                                                const card = {
                                                    id: item._id || idx,
                                                    name: `${item.title ? item.title + " " : ""}${item.firstName || ''} ${item.lastName || ''}`.trim() || "Unknown Artisan",
                                                    date: item.createdAt ? new Date(item.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase() : "N/A",
                                                    image: item.profileImage?.url || item.image || "/bg-custom-1.jpg",
                                                    title: item.specializations && item.specializations.length > 0 ? item.specializations.join(", ") : "Artisan",
                                                    subtitle: item.shgName || "",
                                                    experience: item.yearsOfExperience ? `${item.yearsOfExperience} years experience` : "",
                                                    location: item.address ? `${item.address.city}, ${item.address.state}` : "",
                                                    socials: [
                                                        {
                                                            icon: (
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-facebook-icon lucide-facebook"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
                                                            ), url: item.socialPlugin?.facebook || "#"
                                                        },
                                                        {
                                                            icon: (
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-instagram-icon lucide-instagram"><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></svg>
                                                            ), url: item.socialPlugin?.instagram || "#"
                                                        },
                                                        {
                                                            icon: (
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-youtube-icon lucide-youtube"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" /><path d="m10 15 5-3-5-3z" /></svg>
                                                            ), url: item.socialPlugin?.youtube || "#"
                                                        },
                                                        {
                                                            icon: (
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="black" viewBox="0 0 24 24">
                                                                    <path d="M21.35 11.1h-9.18v2.83h5.43c-.24 1.38-1.42 4.04-5.43 4.04-3.27 0-5.94-2.71-5.94-6.05s2.67-6.05 5.94-6.05c1.86 0 3.11.8 3.82 1.49l2.6-2.57C17.36 3.43 15.01 2.5 12 2.5 6.95 2.5 2.9 6.53 2.9 11.5S6.95 20.5 12 20.5c6.89 0 9.1-4.82 9.1-7.22 0-.48-.05-.8-.15-1.18z" />
                                                                </svg>
                                                            ), url: item.socialPlugin?.google || "#"
                                                        },
                                                        {
                                                            icon: (
                                                                <Globe />
                                                            ), url: item.socialPlugin?.website || "#"
                                                        },
                                                    ],
                                                };
                                                return (
                                                    <CarouselItem
                                                        key={card.id}
                                                        className="flex justify-center basis-1/3 min-w-0"
                                                    >
                                                        <ArtisanCard card={card} />
                                                    </CarouselItem>
                                                );
                                            })}
                                        </CarouselContent>
                                        <div className="flex items-center gap-3 mt-4 justify-center">
                                            <CarouselNext className="!right-2 !top-1/2 !-translate-y-1/2 z-10" />
                                            <CarouselPrevious className="!left-1 !top-1/2 !-translate-y-1/2 z-10" />
                                        </div>
                                    </Carousel>
                                </div>
                            </>
                        )}
                    </div>
                </div>
                {artisan.length > 6 && (
                    <h2 className="text-xl my-1 font-medium uppercase text-center md:text-left w-full bg-black text-white p-2">Meet Our Artisans</h2>
                )}
                {/* Row 2: Feature Table (full width) */}
                {artisan.length > 6 && (
                    <div className="w-full flex flex-row gap-2 md:w-[90%] mx-auto">
                        <div className="left w-[25%] p-2">
                            {/* Left: Heading and description */}
                            <div className="flex flex-col justify-center px-4">
                                <h2 className="text-xl font-bold mb-4">Celebrating the Art of Craftsmanship. Honoring the Hands That Shape Beauty</h2>
                                <div className="text-md text-gray-700 text-justify mb-6">
                                    We are proud to recognize and celebrate your exceptional talent and dedication as a skilled handicraft artisan. Your ability to transform raw materials into beautiful, meaningful works of art speaks to your creativity, precision, and passion for the craft. Each piece you create is a testament to the enduring value of handmade artistry and the cultural richness it preserves. With deep appreciation, we commend you for achieving this milestone and look forward to witnessing your continued journey of artistic excellence.
                                </div>
                            </div>
                        </div>
                        <div className="right w-[75%] p-2">
                            {(page === 1
                                ? artisan.slice(6)
                                : paginatedArtisans
                            ).map((item, idx) => {
                                return (
                                    <div key={item._id || idx} className="relative flex flex-col md:flex-row bg-[#f8f5ef] rounded-2xl my-2 md:items-center gap-6">
                                        {/* Image */}
                                        <div className="flex-shrink-0 flex justify-center items-center">
                                            <img
                                                src={item.profileImage?.url || item.image || "/bg-custom-1.jpg"}
                                                alt={item.firstName || 'Artisan'}
                                                className="w-72 h-72 rounded-xl object-cover"
                                            />
                                        </div>
                                        {/* Details */}
                                        <div className="flex-1 flex flex-col gap-2 justify-center">
                                            {/* Name and Specializations */}
                                            <div className="flex flex-col">
                                                <div className="flex items-center justify-between gap-4 mb-1 w-full">
                                                    {/* Name directly here without extra wrapping div */}
                                                    <h3 className="text-2xl font-extrabold text-gray-900 m-0 p-0">
                                                        {`${item.title ? item.title + " " : ""}${item.firstName || ''} ${item.lastName || ''}`.trim() || "Unknown Artisan"}
                                                    </h3>
                                                    {/* Reviews with stars */}
                                                    <div className="flex items-center gap-1 flex-shrink-0">
                                                        {(() => {
                                                            const avgRating =
                                                                item.promotions && item.promotions.length > 0
                                                                    ? item.promotions.reduce((sum, p) => sum + (p.rating || 0), 0) /
                                                                    item.promotions.length
                                                                    : 0;
                                                            return [...Array(5)].map((_, i) => (
                                                                <Star
                                                                    key={i}
                                                                    size={18}
                                                                    className={i < avgRating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
                                                                    fill={i < avgRating ? "#facc15" : "none"}
                                                                />
                                                            ));
                                                        })()}
                                                        <span className="ml-2 text-gray-500 text-sm">
                                                            {item.promotions?.length || 0} Reviews
                                                        </span>
                                                    </div>
                                                </div>
                                                {/* Specializations */}
                                                <div className="flex flex-wrap gap-2">
                                                    {(item.specializations && item.specializations.length > 0
                                                        ? item.specializations
                                                        : ["No Specialization"]
                                                    ).map((spec, i) => (
                                                        <span
                                                            key={i}
                                                            className="bg-[#fff7f0] text-[#ff4f00] font-medium px-2 rounded-full text-sm border border-[#ff4f00]"
                                                        >
                                                            {spec}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <div className="font-bold text-md flex items-center pr-2">SHG Name: <span className="font-normal text-md">{item.shgName || 'No SHG Name Avaiable'}</span></div>
                                                <div className="font-bold text-md flex items-center"> Artisan No: <span className="font-normal text-md">{item.artisanNumber || 'Artisan Number Not Available'}</span></div>
                                            </div>
                                            <div className="text-lg font-bold text-black">{item.yearsOfExperience || '0'} Years of Experience</div>
                                            <div className="font-bold text-md">
                                                {(item.artisanStories?.shortDescription?.split(" ").length > 40)
                                                    ? item.artisanStories.shortDescription.split(" ").slice(0, 40).join(" ") + "..."
                                                    : item.artisanStories?.shortDescription || "No Story"}
                                            </div>

                                            {/* Social icons top right */}
                                            <div className="flex justify-start gap-2 my-2">
                                                {item.socialPlugin?.facebook && (
                                                    <a href={item.socialPlugin.facebook} target="_blank" rel="noopener noreferrer" title="Facebook">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-facebook-icon lucide-facebook"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
                                                    </a>
                                                )}
                                                {item.socialPlugin?.instagram && (
                                                    <a href={item.socialPlugin.instagram} target="_blank" rel="noopener noreferrer" title="Instagram">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-instagram-icon lucide-instagram"><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></svg>
                                                    </a>
                                                )}
                                                {item.socialPlugin?.youtube && (
                                                    <a href={item.socialPlugin.youtube} target="_blank" rel="noopener noreferrer" title="YouTube">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-youtube-icon lucide-youtube"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" /><path d="m10 15 5-3-5-3z" /></svg>
                                                    </a>
                                                )}
                                                {item.socialPlugin?.google && (
                                                    <a href={item.socialPlugin.google} target="_blank" rel="noopener noreferrer" title="Google">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="black" viewBox="0 0 24 24">
                                                            <path d="M21.35 11.1h-9.18v2.83h5.43c-.24 1.38-1.42 4.04-5.43 4.04-3.27 0-5.94-2.71-5.94-6.05s2.67-6.05 5.94-6.05c1.86 0 3.11.8 3.82 1.49l2.6-2.57C17.36 3.43 15.01 2.5 12 2.5 6.95 2.5 2.9 6.53 2.9 11.5S6.95 20.5 12 20.5c6.89 0 9.1-4.82 9.1-7.22 0-.48-.05-.8-.15-1.18z" />
                                                        </svg>
                                                    </a>
                                                )}

                                                {item.socialPlugin?.website && (
                                                    <a href={item.socialPlugin.website} target="_blank" rel="noopener noreferrer" title="Website">
                                                        <Globe />
                                                    </a>
                                                )}
                                            </div>
                                            {/* Eye icon bottom right */}
                                            <Link href={`/artisan/${item._id || idx}`} className="absolute bottom-4 right-4 bg-black text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg hover:bg-[#ff4f00] transition-all z-10" title="View Artisan Details">
                                                <Eye size={28} />
                                            </Link>
                                        </div>
                                    </div>

                                );
                            })}
                            {totalPaginated > 0 && (
                                <div className="w-full mt-8">
                                    {/* Pagination Info and Controls */}
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-md font-medium text-gray-800">
                                            Showing {startIdx}-{endIdx} of {artisan.length} Results
                                        </span>
                                        <div className="flex items-center gap-3">
                                            {[...Array(totalPages)].map((_, i) => (
                                                <button
                                                    key={i}
                                                    className={`border rounded-full w-12 h-12 flex items-center justify-center text-lg ${page === i + 1 ? 'bg-black text-white' : 'bg-transparent text-black'} transition`}
                                                    onClick={() => setPage(i + 1)}
                                                >
                                                    {i + 1}
                                                </button>
                                            ))}
                                            <button
                                                className="border rounded-full px-4 h-12 flex items-center justify-center text-lg bg-transparent text-black transition"
                                                onClick={() => setPage(page < totalPages ? page + 1 : page)}
                                                disabled={page === totalPages}
                                            >
                                                NEXT
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ArtisanList;
