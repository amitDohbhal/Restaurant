import { NextResponse } from "next/server"

export async function POST(request) {
    const { to, subject, htmlContent } = await request.json()

    try {
        const response = await fetch("https://api.brevo.com/v3/smtp/email", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "api-key": process.env.BREVO_API_KEY,
            },
            body: JSON.stringify({
                sender: { email: "info@adventureaxis.in", name: "Adventure Axis" },
                to: [{ email: to }],
                subject,
                htmlContent,
            }),
        })

        const responseBody = await response.text();
        if (!response.ok) {
            console.error("Brevo error response:", response.status, responseBody);
            throw new Error("Failed to send email")
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error sending email:", error)
        return NextResponse.json({ error: "Failed to send email" }, { status: 500 })
    }
}