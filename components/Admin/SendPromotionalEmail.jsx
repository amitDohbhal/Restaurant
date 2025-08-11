"use client"

import dynamic from "next/dynamic"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Send, CheckSquare, Square } from "lucide-react"
import "react-quill-new/dist/quill.snow.css"
import toast from "react-hot-toast"

// Dynamically import ReactQuill
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false })

// 🔥 Full Toolbar Configuration
const toolbarOptions = [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    ["blockquote", "code-block"],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ indent: "-1" }, { indent: "+1" }],
    [{ align: [] }],
    [{ color: [] }, { background: [] }],
    ["link", "image", "video"],
    ["clean"],
]

const modules = {
    toolbar: toolbarOptions,
}

export default function SendPromoEmailPage({ allUsers = [] }) {
    const [subject, setSubject] = useState("")
    const [message, setMessage] = useState("")
    const [selectedEmails, setSelectedEmails] = useState([])
    const [loading, setLoading] = useState(false)
    const [newsletterEmails, setNewsletterEmails] = useState([])
    const handleToggleEmail = (email) => {
        setSelectedEmails((prev) =>
            prev.includes(email)
                ? prev.filter((e) => e !== email) // Remove if already selected
                : [...prev, email] // Add if not selected
        )
    }
    useEffect(() => {
        fetch('/api/newsLetter')
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              setNewsletterEmails(data.emails || []);
            }
          });
      }, []);
      
      const allEmails = [...allUsers.map(u => u.email), ...newsletterEmails]; // deduplicate if needed
      
      // Render allEmails in the sidebar for selection

    const handleSendEmail = async () => {
        setLoading(true)
        if (!subject || !message || selectedEmails.length === 0) {
            toast.error("Please fill all fields and select at least one recipient.", {
                style: {
                    borderRadius: "10px",
                    border: "2px solid red",
                },
            })
            return
        }

        try {
            const response = await fetch("/api/admin/send-promo-email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ subject, message, recipients: selectedEmails }),
            })
            const data = await response.json()

            if (data.success) {
                toast.success("Email sent successfully!", {
                    style: {
                        borderRadius: "10px",
                        border: "2px solid green",
                    },
                })
                window.location.reload()
            } else {
                toast.error("Failed to send email.", {
                    style: {
                        borderRadius: "10px",
                        border: "2px solid red",
                    },
                })
            }
        } catch (error) {
            console.error("Error sending email:", error.message)
        } finally {
            setLoading(false)
        }
    }

    const formatNumeric = (num) => new Intl.NumberFormat('en-IN').format(num);

    return (
        <div className="w-full mx-auto py-8 max-w-7xl md:mt-12 flex xl xl:flex-row flex-col gap-6">
            {/* Sidebar for Email Selection */}
            <div className="w-[500px] mx-auto p-4 border-2 border-blue-600 bg-muted/50 rounded-lg max-h-[700px] overflow-hidden">
                <p className="text-sm text-gray-600 mb-3">All Registered Users: {formatNumeric(allEmails.length)}</p>
                <h3 className="text-lg font-semibold mb-3">Select Recipients <span>({formatNumeric(selectedEmails.length)})</span></h3>
                <ul className="space-y-2 max-h-[600px] overflow-y-auto">
                    {(Array.isArray(allEmails) ? allEmails : []).map((user) => (
                        <li
                            key={user}
                            className="flex items-center gap-2 p-2 bg-white rounded-md cursor-pointer hover:bg-blue-50"
                            onClick={() => handleToggleEmail(user)}
                        >
                            {selectedEmails.includes(user) ? (
                                <CheckSquare className="text-blue-600" />
                            ) : (
                                <Square />
                            )}
                            <span>{user}</span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Email Form */}
            <div className="w-full max-w-4xl mx-auto">
                <Card className="shadow-md border-2 border-blue-600">
                    <CardHeader className="bg-muted/50">
                        <CardTitle className="text-xl">Send Promotional Email</CardTitle>
                    </CardHeader>

                    <CardContent className="pt-6 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="subject">Email Subject</Label>
                            <Input
                                className="border-2 border-blue-600"
                                id="subject"
                                placeholder="Enter email subject..."
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Email Message</Label>
                            <ReactQuill
                                theme="snow"
                                value={message}
                                onChange={setMessage}
                                modules={modules}
                                className="min-h-[400px] border-2 border-blue-600 rounded-lg overflow-hidden"
                            />
                        </div>
                    </CardContent>

                    <CardFooter className="bg-muted/20 flex justify-end gap-2">
                        <Button variant="outline">Cancel</Button>
                        <Button disabled={loading} className="disabled:cursor-not-allowed disabled:opacity-50 bg-blue-600 hover:bg-blue-700" onClick={handleSendEmail}>
                            <Send className="mr-2 h-4 w-4" />
                            Send to Selected
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}
