"use client";
import React from "react";
import Breadcrumbs from "@/components/Admin/Breadcrumbs";
import { useSearchParams } from "next/navigation";

import { useEffect, useState } from "react";

function BreadcrumbBar() {
    const searchParams = useSearchParams();
    const category = searchParams.get("category");
    const subcategory = searchParams.get("subcategory");
    const product = searchParams.get("product");
    const isDirect = searchParams.get("isDirect");

    let items = [];
    if (isDirect === "true") {
        items = [
            { label: "Direct Product", href: "/admin/add_direct_product" },
            product ? { label: product, active: true } : { label: "Product", active: true }
        ];
    } else if (category) {
        items = [
            { label: category, href: "/admin/manage_products_category" },
            subcategory ? { label: subcategory, href: `/admin/add_product?category=${encodeURIComponent(category)}` } : null,
            product ? { label: product, active: true } : { label: "Product", active: true }
        ].filter(Boolean);
    } else {
        items = [{ label: "Product", active: true }];
    }

    return <Breadcrumbs items={items} />;
}

export default BreadcrumbBar;
