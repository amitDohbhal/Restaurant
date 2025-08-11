"use client";

import React from "react";
import { Share2, ArrowUpCircle } from "lucide-react";

const Social = () => {
  // Share handler
  const handleShare = async () => {
    const shareData = {
      title: document.title,
      text: "Check this out!",
      url: window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // User cancelled or error
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert("Link copied to clipboard!");
      } catch (err) {
        alert("Could not share or copy link.");
      }
    }
  };

  // Scroll to top
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div
      style={{
        position: "fixed",
        top: "50%",
        right: 0,
        transform: "translateY(-50%)",
        zIndex: 1000,
        background: "#fff",
        borderRadius: "16px 0 0 16px",
        boxShadow: "0 2px 16px rgba(0,0,0,0.09)",
        padding: "18px 5px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "22px",
      }}
    >
      <button
        aria-label="Share"
        onClick={handleShare}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
          outline: "none",
        }}
      >
        <Share2 size={32} color="#222" />
      </button>
      <button
        aria-label="Go to top"
        onClick={scrollToTop}
        className="border border-t border-black"
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
          outline: "none",
        }}
      >
        <ArrowUpCircle size={32} color="#222" />
      </button>
    </div>
  );
};

export default Social;