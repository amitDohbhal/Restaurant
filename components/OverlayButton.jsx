'use client'

import { usePathname } from 'next/navigation';
import React, { useEffect } from 'react'

const OverlayButton = () => {
    const pathname = usePathname()

    if (pathname.includes('/admin') || pathname.includes('/invoice') || pathname.includes('/package/calculator/pdf')) {
        return null
    }

    useEffect(() => {
        const options = {
            call: "+910766928002 ", // Call phone number
            whatsapp: "+919897468886 ", // WhatsApp number
            call_to_action: "", // Call to action
            button_color: "#2563eb", // Color of button
            position: "left", // Position may be 'right' or 'left'
            order: "call,whatsapp", // Order of buttons
            pre_filled_message: "Chat With Us", // WhatsApp pre-filled message
            
        };

        const proto = "https:",
            host = "getbutton.io",
            url = `${proto}//static.${host}/widget-send-button/js/init.js`;

        const s = document.createElement("script");
        s.type = "text/javascript";
        s.async = true;
        s.src = url;
        s.onload = () => {
            if (typeof WhWidgetSendButton !== "undefined") {
                WhWidgetSendButton.init(host, proto, options);
            }
        };

        document.body.appendChild(s);

        return () => {
            document.body.removeChild(s)
        };
    }, []);
}

export default OverlayButton