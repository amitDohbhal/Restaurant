"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Send, Check, CheckCheck, Pin, Paperclip, X, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { usePathname } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import toast from 'react-hot-toast';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { useSession } from "next-auth/react"

import PropTypes from "prop-types";

export default function Chat({
    className,
    userId,
    isAdmin = false,
    recipientName = "Adventure Axis",
    showBackButton = false,
    onBack,
    type = "chatbot",
}) {

    const { data: session } = useSession()
    const [messages, setMessages] = useState([])
    const [message, setMessage] = useState("")
    const [attachments, setAttachments] = useState([])
    const [zoomImage, setZoomImage] = useState(null)
    const messagesEndRef = useRef(null)
    const chatContainerRef = useRef(null)
    const pathname = usePathname()
    const [adminName, setAdminName] = useState(null);

    // Optionally, add logic to mark messages as read for admin/user if needed for e-commerce chat


    const fetchMessages = useCallback(async () => {
        try {
            // Fetch messages for user-admin/product chat
            const res = await fetch(`/api/getMessages?userId=${userId}`)
            const data = await res.json()

            if (data.messages && Array.isArray(data.messages)) {
                setMessages((prev) => (JSON.stringify(prev) !== JSON.stringify(data.messages) ? data.messages : prev))
                setAdminName(null);
                // Find the most recent admin message
                const adminMsg = [...data.messages].reverse().find(msg => msg.adminName);
                if (adminMsg?.adminName) {
                    setAdminName(adminMsg.adminName);
                }
            } else {
                setMessages([])
                setAdminName(null); // Reset when no messages
            }
        } catch (error) {
            // console.error("Error fetching messages:", error)
            setAdminName(null); // Reset on error
        }
    }, [userId])

    // Removed enquiry and booking details logic for e-commerce chat

    // And update your useEffect to call it when type is "booking"
    useEffect(() => {
        
        // Only merge chatbot_history once per session
        let mergedBotHistory = false;
        const botHistory = localStorage.getItem("chatbot_history");
        let parsedBotHistory = [];
        if (botHistory) {
            parsedBotHistory = JSON.parse(botHistory).map(msg => ({
                ...msg,
                from: msg.from === "bot" ? "Bot" : "You"
            }));
        }
        fetchMessages();
        setMessages(prev => {
            const hasBotHistory = prev.some(msg => msg.from === "Bot");
            if (!hasBotHistory && parsedBotHistory.length > 0 && !mergedBotHistory) {
                mergedBotHistory = true;
                // Clear chatbot_history so it doesn't keep merging
                localStorage.removeItem("chatbot_history");
                return [...parsedBotHistory, ...prev];
            }
            return prev;
        });
        const interval = setInterval(fetchMessages, 3000);
        return () => { clearInterval(interval); setAdminName(null); }
    }, [fetchMessages]);

    const fileInputRef = useRef();
    const [attachmentUploading, setAttachmentUploading] = useState(false);

    const handleUpload = () => {
        fileInputRef.current?.click();
    }

    const handleAttachmentUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        setAttachmentUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await fetch('/api/cloudinary', {
                method: 'POST',
                body: formData
            });
            if (!res.ok) throw new Error('Image upload failed');
            const result = await res.json();
            setAttachments(prev => [...prev, { url: result.url, key: result.key }]);
            toast.success('Attachment uploaded successfully');
        } catch (err) {
            toast.error('Attachment upload failed');
        } finally {
            setAttachmentUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    }

    const handleInputChange = (e) => {
        setMessage(e.target.value)
    }
    // console.log("Sending message", { text: message, attachments });
    const sendMessage = async () => {
        if (!message.trim() && attachments.length === 0) return;

        const adminNameToSet = isAdmin ? (session.user.name || session.user.email) : null;

        const newMessage = {
            sender: isAdmin ? "admin" : userId,
            ...(isAdmin && {
                adminName: adminNameToSet
            }),
            text: message,
            userId: userId,
            status: "sent",
            createdAt: new Date().toISOString(),
            images: attachments, // always use latest attachments
            type: type || "chatbot",
        };

        // Optimistically update UI
        setMessages((prev) => [...prev, newMessage]);
        if (isAdmin) {
            setAdminName(adminNameToSet);
        }
        setMessage("");

        let res;
        try {
            // Always send the latest attachments as images
            res = await fetch("/api/sendMessage", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sender: isAdmin ? "admin" : userId,
                    ...(isAdmin && { adminName: adminNameToSet }),
                    text: message,
                    userId: userId,
                    images: attachments, // <--- always current attachments
                    type: type || "chatbot",
                }),
            });
            // Only clear attachments after sending
            setAttachments([]);
        } catch (error) {
            // console.error("Error sending message:", error);
            // Rollback optimistic update if needed
            setMessages((prev) => prev.filter(msg => msg.createdAt !== newMessage.createdAt));
        }

        if (res && res.ok) {
            // Immediately fetch messages after successful send to sync UI
            await fetchMessages();
            const data = await res.json();

            // Update message status to delivered
            setTimeout(() => {
                setMessages((prev) =>
                    prev.map((msg) =>
                        msg.createdAt === newMessage.createdAt ?
                            { ...msg, status: "delivered" } : msg
                    ),
                );

                // Simulate read status after a delay if it's the recipient
                setTimeout(() => {
                    setMessages((prev) =>
                        prev.map((msg) =>
                            msg.createdAt === newMessage.createdAt ?
                                { ...msg, status: "read" } : msg
                        ),
                    );
                }, 2000);
            }, 1000);

            // Optionally update local unread count if needed
            // You might want to refresh the chat data here
        }
        
        // } catch (error) {
        //     console.error("Error sending message:", error);
        //     // Rollback optimistic update if needed
        //     setMessages((prev) => prev.filter(msg => msg.createdAt !== newMessage.createdAt));
        // }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            sendMessage()
        }
    }

    const formatTime = (dateString) => {
        const date = new Date(dateString)
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }

    const getInitials = (name) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
    }

    const getStatusIcon = (status) => {
        switch (status) {
            case "sent":
                return <Check className="h-3 w-3 text-gray-400" />
            case "delivered":
                return <CheckCheck className="h-3 w-3 text-gray-400" />
            case "read":
                return <CheckCheck className="h-3 w-3 text-blue-500" />
            default:
                return null
        }
    }

    const removeAttachment = (key) => {
        setAttachments(attachments.filter((file) => file.key !== key));
    }

    const formatDate = (dateString) => {
        if (!dateString) return "Not specified";
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Format number helper (for currency)
    const formatNumber = (num) => {
        if (!num) return "0";
        return new Intl.NumberFormat('en-IN').format(num);
    };

    return (
        <Card
            className={cn(
                "flex flex-col md:h-[75vh] bg-[#fcf7f1] font-barlow w-full max-w-6xl md:my-0 border-2 border-blue-600 shadow-lg"
            )}
        >
            <CardHeader className="lg:flex-row p-4 border-b flex justify-between items-center lg:items-start">
                <div className="flex items-center space-x-3">
                    <Avatar>
                        <AvatarImage src={`/apple-touch-icon.png`} alt={recipientName} />
                        <AvatarFallback>{getInitials(recipientName)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <h3 className="font-medium">{recipientName}</h3>
                        {adminName && (
                            <p className="text-xs text-muted-foreground">
                                Handled by: <span className="font-semibold">{adminName}</span>
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex flex-col items-end space-x-2">
                    {/* Legacy booking/enquiry/package UI removed. Only recipient/admin info shown. */}
                </div>
            </CardHeader>

            <CardContent ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                        <p>No messages yet. Start the conversation!</p>
                    </div>
                )}

                {Array.isArray(messages) &&
                    messages.map((msg, index) => {
                        // Determine if this message is sent by the "current" user (user or admin)
                        let isRight = false;
                        let bubbleColor = "bg-blue-600 text-primary-foreground rounded-tr-none"; // default: right
                        if (isAdmin) {
                            // Admin panel: admin and bot messages right, user left
                            if (msg.adminName || msg.sender === "admin" || msg.sender === "bot" || msg.from === "Bot") {
                                isRight = true;
                                bubbleColor = msg.sender === "bot" || msg.from === "Bot"
                                    ? "bg-yellow-100 text-yellow-900 rounded-tr-none"
                                    : "bg-blue-600 text-primary-foreground rounded-tr-none";
                            } else {
                                isRight = false;
                                bubbleColor = "bg-muted text-gray-900 rounded-tl-none";
                            }
                        } else {
                            // User panel: user messages right, admin/bot left
                            if (msg.sender === userId) {
                                isRight = true;
                                bubbleColor = "bg-blue-600 text-primary-foreground rounded-tr-none";
                            } else if (msg.from === "Bot") {
                                isRight = false;
                                bubbleColor = "bg-yellow-100 text-yellow-900 rounded-tl-none";
                            } else {
                                isRight = false;
                                bubbleColor = "bg-yellow-100 text-gray-900 rounded-tl-none";
                            }
                        }
                        if (!isAdmin) {
                            if (msg.sender === userId) {
                                isRight = true;
                                bubbleColor = "bg-blue-600 text-primary-foreground rounded-tr-none";
                            } else if (msg.sender === "admin" || msg.adminName) {
                                isRight = false;
                                bubbleColor = "bg-muted text-gray-900 rounded-tl-none";
                            } else if (msg.sender === "bot" || msg.from === "Bot") {
                                isRight = false;
                                bubbleColor = "bg-yellow-100 text-yellow-900 rounded-tl-none";
                            } else {
                                // Fallback: treat messages with missing sender as left-aligned (admin/bot)
                                isRight = false;
                                bubbleColor = "bg-muted text-gray-900 rounded-tl-none";
                            }
                        }
                        const showAvatar = index === 0 || messages[index - 1]?.sender !== msg.sender;

                        return (
                            <div
                                key={msg._id || (msg.createdAt + '-' + index)}
                                className={cn("flex items-end gap-2", isRight ? "justify-end" : "justify-start")}
                            >
                                {!isRight && showAvatar && (
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={`${pathname === '/admin/chat' ? '/user.png' : '/apple-touch-icon.png'}`} alt={recipientName} />
                                        <AvatarFallback>{getInitials(recipientName)}</AvatarFallback>
                                    </Avatar>
                                )}

                                {!isRight && !showAvatar && <div className="w-8" />}

                                <div
                                    className={cn(
                                        "max-w-[75%] px-4 py-2 rounded-2xl",
                                        bubbleColor,
                                    )}
                                >
                                    {/* Display Sent Images */}
                                    {Array.isArray(msg.images) && msg.images.length > 0 && (
                                         <div className="flex gap-2 mb-1 flex-wrap">
                                            {msg.images.map((img) => (
                                                <div key={img.key} className="relative w-20 md:w-32 h-20 md:h-32">
                                                    <Image onClick={() => setZoomImage(img.url)} src={img.url} alt="Sent Image" fill className="cursor-pointer rounded-lg object-cover" />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {/* Display Text Message */}
                                    {msg.text && <p className="break-words">{msg.text}</p>}

                                    <div className={cn("flex text-xs mt-1 gap-1", isRight ? "justify-end" : "justify-start")}>
                                        <span className={isRight ? "text-primary-foreground/70" : "text-muted-foreground"}>
                                            {formatTime(msg.createdAt)}
                                        </span>
                                        {isRight && getStatusIcon(msg.status)}
                                    </div>
                                </div>

                                {isRight && showAvatar && (
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={`${pathname === '/admin/chat' ? '/apple-touch-icon.png' : '/user.png'}`} alt="You" />
                                        <AvatarFallback>{getInitials("You")}</AvatarFallback>
                                    </Avatar>
                                )}

                                {isRight && !showAvatar && <div className="w-8" />}
                            </div>
                        );
                    })}

                <div ref={messagesEndRef} />
            </CardContent>

            <CardFooter className="p-3 border-t flex relative space-x-2">
                {/* Attachments preview with loading state */}
                <div className="absolute -top-24 left-10">
                    <div className="flex space-x-2 overflow-x-auto">
                        {attachments.map((file) => (
                            <div key={file.key} className="relative w-24 h-24">
                                {file.isUploading ? (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-md">
                                        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                                    </div>
                                ) : (
                                    <>
                                        <Image
                                            src={file.url}
                                            alt="Preview"
                                            fill
                                            className="rounded-md w-full h-full object-cover"
                                        />
                                        <button
                                            onClick={() => removeAttachment(file.key)}
                                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 text-xs"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* File upload button with loading state */}
                <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleAttachmentUpload}
                />
                <Button
                    className="bg-blue-600 hover:bg-blue-700"
                    size="icon"
                    aria-label="Attach file"
                    onClick={handleUpload}
                    disabled={attachmentUploading}
                >
                    {attachmentUploading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                        <Paperclip className="h-5 w-5" />
                    )}
                </Button>


                <Input
                    value={message}
                    onKeyDown={handleKeyDown}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type a message..."
                    disabled={attachmentUploading}
                />

                <Button
                    onClick={sendMessage}
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={(!message.trim() && attachments.length === 0) || attachmentUploading}
                >
                    {attachmentUploading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                        <Send className="h-5 w-5" />
                    )}
                </Button>
            </CardFooter>
            {zoomImage && (
                <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center z-[99999]">
                    <div className="relative w-4/5 h-4/5">
                        <Image src={zoomImage} alt="Zoomed Image" fill className="object-cover rounded-lg z-[99999]" />
                        <button
                            onClick={() => setZoomImage(false)}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 text-xs z-[99999]"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}
        </Card>
    )
}

Chat.propTypes = {
    userId: PropTypes.string.isRequired,
    isAdmin: PropTypes.bool,
    recipientName: PropTypes.string,
    className: PropTypes.string,
};