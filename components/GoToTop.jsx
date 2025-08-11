'use client'

import { useEffect, useState } from "react";
import { ArrowUpCircle } from "lucide-react";

const GoToTop = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsVisible(window.scrollY > 300);
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    };
    return (
        <>
            {isVisible && (
                <button
                    onClick={scrollToTop}
                    className="fixed z-50 bottom-20 right-6 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all duration-300"
                >
                    <ArrowUpCircle size={36} />
                </button>
            )}
        </>
    )
}

export default GoToTop
