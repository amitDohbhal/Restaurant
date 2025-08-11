'use client'

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Share2 } from "lucide-react"
import { useState } from "react"
import { Button } from "../ui/button"

const ShareButton = () => {
    const [showShareDialog, setShowShareDialog] = useState(false)
    return (
        <>
            <Button variant="outline" onClick={() => setShowShareDialog(true)}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
            </Button>
            <AlertDialog open={showShareDialog} onOpenChange={setShowShareDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Share your journey</AlertDialogTitle>
                        <AlertDialogDescription>
                            Let your friends and family know about your upcoming adventure!
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="flex flex-wrap gap-3 justify-center my-4">
                        {["Facebook", "Twitter", "WhatsApp", "Email"].map((platform) => (
                            <Button key={platform} variant="outline" className="gap-2">
                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        d="M18 2H15C13.6739 2 12.4021 2.52678 11.4645 3.46447C10.5268 4.40215 10 5.67392 10 7V10H7V14H10V22H14V14H17L18 10H14V7C14 6.73478 14.1054 6.48043 14.2929 6.29289C14.4804 6.10536 14.7348 6 15 6H18V2Z"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                                {platform}
                            </Button>
                        ))}
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogAction>Close</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}

export default ShareButton