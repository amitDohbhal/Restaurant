'use client'

import { createContext, useContext, useState } from "react";

const ProductContext = createContext(null);

// Custom hook to use the context
export const useProduct = () => {
    return useContext(ProductContext);
};

// Context Provider Component
export const ProductProvider = ({ children }) => {
    const [selectedProductId, setSelectedProductId] = useState(null);

    const value = {
        productId: selectedProductId,
        setProductId: setSelectedProductId
    };

    return (
        <ProductContext.Provider value={value}>
            {children}
        </ProductContext.Provider>
    );
};