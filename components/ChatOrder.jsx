"use client"
import React from 'react'
import Chat from './Chat';

import { useSession } from "next-auth/react";

/**
 * ChatOrder component
 * @param {Object} props
 * @param {Object} props.order - The order object to chat about.
 * @param {Function} [props.onBack] - Optional callback for back button.
 * @param {Function} [props.onViewOrder] - Optional callback to view order details.
 */
const ChatOrder = ({ order, onBack, onViewOrder }) => {
    const { data: session } = useSession();
    if (!order) return <div className="p-6">No order selected.</div>;

    // Prefer order.orderId, fallback to order._id
    const orderId = order.orderId || order._id;
    // Prefer order.userId as string (MongoDB), fallback to order.userId._id
    let userId = typeof order.userId === 'string' ? order.userId : order.userId?._id;
    // Fallback: use logged-in user's id if missing
    if (!userId && session?.user) {
        userId = session.user.id || session.user._id;
    }
    const userName = order.userName || order.name || order.userEmail || 'User';

    if (!userId) {
        return <div className="p-6 text-red-500 font-semibold">Chat unavailable: userId is missing for this order.</div>;
    }

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b bg-gray-50 flex items-center gap-4 justify-between">
                <div className="flex items-center justify-between gap-4 w-full">
                    <div>
                        {onBack && (
                            <button
                                onClick={onBack}
                                className="px-4 py-1 bg-gray-200 hover:bg-gray-300 rounded text-md font-medium"
                            >
                                ← Back
                            </button>
                        )}
                    </div>
                    <div>
                        <span className="font-bold text-blue-700">Order ID:</span>
                        <span className="font-mono text-base">{orderId}</span>
                        {onViewOrder && (
                            <button
                                onClick={() => onViewOrder(order)}
                                className="ml-4 px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm font-medium"
                            >
                                View Order
                            </button>
                        )}
                    </div>
                </div>
            </div>
            <div className="flex-1 min-h-0">
                {/* Inline chat UI and logic for this order */}
                <OrderChat
                    userId={userId}
                    orderId={orderId}
                    userName={userName}
                    userImage={order.userImage}
                    onBack={onBack}
                />
            </div>
        </div>
    );
}


// Inline chat logic and UI for order chat only
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Paperclip, X, Loader2 } from "lucide-react";
import Image from "next/image";

function formatTime(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function OrderChat({ userId, orderId, userName, userImage, onBack }) {
    const { data: session } = useSession()
    const messagesEndRef = useRef(null);

    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");
    const [attachments, setAttachments] = useState([]);
    const [zoomImage, setZoomImage] = useState(null);
    const [attachmentUploading, setAttachmentUploading] = useState(false);
    // 
    const fileInputRef = useRef();

    // Fetch messages for this order
    useEffect(() => {
        if (!userId || !orderId) return;
        const fetchMessages = async () => {
            const res = await fetch(`/api/getOrderChat?userId=${userId}&orderId=${orderId}`);
            const data = await res.json();
            setMessages(Array.isArray(data.messages) ? data.messages : []);
        };
        fetchMessages();
        const interval = setInterval(fetchMessages, 3000);
        return () => clearInterval(interval);
    }, [userId, orderId]);

    const handleUpload = () => fileInputRef.current?.click();

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
            if (typeof toast !== 'undefined') toast.success('Attachment uploaded successfully');
        } catch (err) {
            if (typeof toast !== 'undefined') toast.error('Attachment upload failed');
        } finally {
            setAttachmentUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const removeAttachment = (key) => {
        setAttachments(prev => prev.filter(f => f.key !== key));
    };

    const sendMessage = async () => {
        if (!message.trim() && attachments.length === 0) return;

        const adminNameToSet = session?.user?.isAdmin ? (session.user.name || session.user.email) : null;
        const isAdmin = !!session?.user?.isAdmin;
        const newMessage = {
            sender: isAdmin ? "admin" : userId,
            ...(isAdmin && { adminName: adminNameToSet }),
            text: message,
            userId: userId,
            status: "sent",
            createdAt: new Date().toISOString(),
            images: attachments, // send the full attachments array
            type: "order-chat",
        };

        // Optimistically update UI
        setMessages((prev) => [...prev, newMessage]);

        try {
            const res = await fetch('/api/sendOrderMessage', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    orderId,
                    text: message,
                    images: attachments, // send full attachments array
                    sender: isAdmin ? "admin" : userId,
                    ...(isAdmin && { adminName: adminNameToSet }),
                }),
            });
            if (res.ok) {
                setMessage("");
                setAttachments([]);
                const data = await res.json();
                if (data.messages) setMessages(data.messages);
            } else {
                // Rollback optimistic update if needed
                setMessages((prev) => prev.slice(0, -1));
            }
        } catch (err) {
            // Rollback optimistic update if needed
            setMessages((prev) => prev.slice(0, -1));
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };



    return (
        <Card className="flex flex-col h-[500px]">
            <CardContent className="flex-1 min-h-0 p-4">
                <div className="flex flex-col gap-3 h-full">
                    <div className="flex-1 min-h-0 overflow-y-auto">
                        {messages.length === 0 && (
                            <div className="text-gray-500 text-center py-4">No messages yet for this order.</div>
                        )}
                        {messages.map((msg, idx) => {
                            // Determine alignment based on sender and current viewer (admin/user)
                            const sender = msg.from || msg.sender;
                            let isRight = false;
                            let bubbleColor = "bg-gray-100 text-left";
                            if (session?.user?.isAdmin) {
                                // Admin viewing: admin messages right, user messages left
                                if (sender === 'admin' || sender === 'Admin' || msg.adminName) {
                                    isRight = true;
                                    bubbleColor = "bg-blue-100 text-right";
                                } else {
                                    isRight = false;
                                    bubbleColor = "bg-gray-100 text-left";
                                }
                            } else {
                                // User viewing: user messages right, admin messages left
                                if (sender === userId || sender === 'user' || sender === msg.userId) {
                                    isRight = true;
                                    bubbleColor = "bg-gray-100 text-right";
                                } else if (sender === 'admin' || sender === 'Admin' || msg.adminName) {
                                    isRight = false;
                                    bubbleColor = "bg-blue-100 text-left";
                                } else {
                                    isRight = false;
                                    bubbleColor = "bg-gray-100 text-left";
                                }
                            }
                            return (
                                <div key={msg._id || idx} className={`flex ${isRight ? 'justify-end' : 'justify-start'} items-end gap-2`}>
                                    {/* Avatar */}
                                    {!isRight && (
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={userImage || '/user.png'} alt="User" />
                                            <AvatarFallback>U</AvatarFallback>
                                        </Avatar>
                                    )}
                                    <div className={`max-w-xs p-2 rounded-lg shadow text-sm ${bubbleColor}`} style={{ wordBreak: 'break-word' }}>
                                        {/* Display images/attachments */}
                                        {Array.isArray(msg.images) && msg.images.length > 0 && (
                                            <div className="flex gap-2 mb-1 flex-wrap">
                                                {msg.images.map((img, i) => {
                                                    // Defensive: fallback to placeholder if url is missing/invalid
                                                    const url = (img && typeof img === 'object' && img.url) ? img.url : '/placeholder.jpeg';
                                                    return (
                                                        <div key={img.key || url || i} className="relative w-24 h-24">
                                                            <Image
                                                                src={url}
                                                                alt="attachment"
                                                                fill
                                                                className="object-cover rounded cursor-pointer"
                                                                onClick={() => setZoomImage(url)}
                                                                style={{ cursor: 'pointer' }}
                                                            />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                        {/* Display text */}
                                        {msg.text && <div>{msg.text}</div>}
                                        <div className="text-[11px] text-gray-400 mt-1">{formatTime(msg.createdAt)}</div>
                                    </div>
                                    {/* Avatar */}
                                    {isRight && (
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={session?.user?.image || '/admin.png'} alt="Admin" />
                                            <AvatarFallback>A</AvatarFallback>
                                        </Avatar>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    <div ref={messagesEndRef} />
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
                </div>
            </CardContent>
            <CardFooter className="gap-2 flex-col items-start">
                {/* Attachments preview with loading state */}
                {attachments.length > 0 && (
                    <div className="flex space-x-2 overflow-x-auto mb-2">
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
                )}
                <div className="flex w-full gap-2">
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
                </div>
            </CardFooter>
        </Card>
    );
}

export default ChatOrder