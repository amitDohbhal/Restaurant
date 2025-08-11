'use client'

import { createContext, useContext } from "react";

const PackageContext = createContext(null);

// Custom hook to use the context
export const usePackage = () => {
    return useContext(PackageContext);
};

// Context Provider Component
export const PackageProvider = ({ packages, children }) => {
    return (
        <PackageContext.Provider value={packages}>
            {children}
        </PackageContext.Provider>
    );
};
