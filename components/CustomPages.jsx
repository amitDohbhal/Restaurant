"use client"

import { Card, CardContent } from "@/components/ui/card"
import MDEditor from "@uiw/react-md-editor"
import Image from "next/image"

export default function CustomPages({ page }) {

  return (
    <div className="min-h-screen py-20 bg-white">
      {/* Hero Section */}
      <section className="relative pb-24 px-4">
        <div className="w-full mx-auto text-center">
          {page.images && <Image src={page?.images?.url} alt={page.title} width={400} height={800} className="w-full h-[25rem] object-cover rounded-lg shadow-lg" />}
        </div>
      </section>

      {/* Main Content */}
      <section className="px-4 relative -mt-10">
        <div className="max-w-7xl bg-transparent mx-auto">
            <div className="prose bg-transparent prose-lg marker:prose-hr:bg-blue-600 marker:text-black max-w-none" data-color-mode="light">
              <MDEditor.Markdown 
                source={page.desc}
                className="!bg-transparent"
              />
              {/* <div dangerouslySetInnerHTML={{ __html: page.desc }} /> */}
            </div>
        </div>
      </section>
    </div>
  )
}

