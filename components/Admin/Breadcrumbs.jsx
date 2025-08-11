"use client";
import React from "react";
import Link from "next/link";

/**
 * Breadcrumbs component
 * @param {Array<{ label: string, href?: string, active?: boolean }>} items
 */
const Breadcrumbs = ({ items }) => {
  return (
    <nav className="flex items-center gap-1 text-lg font-medium mb-4" aria-label="Breadcrumb">
      {items.map((item, idx) => (
        <span key={idx} className="flex items-center">
          {item.href && !item.active ? (
            <Link href={item.href} className="text-blue-700 hover:underline">
              {item.label}
            </Link>
          ) : (
            <span className={item.active ? "font-semibold text-black" : "text-gray-600"}>{item.label}</span>
          )}
          {idx < items.length - 1 && <span className="mx-2 text-gray-400">&gt;</span>}
        </span>
      ))}
    </nav>
  );
};

export default Breadcrumbs;
