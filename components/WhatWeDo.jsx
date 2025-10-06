"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import React from 'react'

const accordionData = [
  {
    title: "What Sets Us Apart:",
    content: `At Adventure Axis, we’re more than an equipment supplier — we’re your adventure partner. Here’s what makes us truly unique:

✅ Experience That Speaks Volumes
With over 25 years of hands-on expertise in the adventure industry, we understand what it takes to perform in extreme conditions — because we’ve been there ourselves.

✅ Global Gear, Local Insight
We are authorized dealers of globally trusted brands like NRS, Camp, Wiley X, and Lafuma, while staying grounded in the needs of the Indian adventure landscape, especially the Himalayan region.

✅ Complete Outdoor Solutions
From water sports and trekking to mountaineering and rescue missions, we offer end-to-end gear solutions — not just products, but full expedition readiness.

✅ Field-Tested Reliability
All our gear is tested in real-world scenarios, ensuring performance, durability, and safety where it matters most.

✅ Sustainability & Community Focus
We prioritize eco-friendly practices, support local artisans and businesses, and promote responsible adventure tourism to protect both people and planet.

✅ People-Centric Culture
As a Great Place to Work®-Certified company, we foster a team culture built on trust, collaboration, and growth — reflected in the way we serve our clients.

✅ Customer Commitment
We believe in personalized service, honest advice, and long-term relationships. Your journey is our priority — from basecamp planning to summit success.

🧗 Adventure Axis — Where Experience Meets Innovation, and Passion Meets Performance.`
  },
  {
    title: "Fair Trade:",
    content: `At Adventure Axis, fairness isn't just a principle — it's part of our purpose. We are proud to support and promote Fair Trade practices that ensure transparency, equity, and dignity throughout our supply chain.

We collaborate with local artisans, grassroots suppliers, and ethical manufacturers, ensuring they receive fair compensation, safe working conditions, and respectful partnerships. By choosing Fair Trade, we contribute to:

Empowering local communities and small businesses in the Himalayan region

Encouraging sustainable craftsmanship and traditional skills

Reducing exploitation in the outdoor gear industry

Promoting ethical sourcing and responsible consumption

When you shop with Adventure Axis, you’re not just buying gear — you’re supporting a movement that values people over profit and helps build a more just and sustainable adventure economy.`
  },
];


const WhatWeDo = () => {
  const [openIndex, setOpenIndex] = useState(0);
  return (
    <div className="w-full min-h-screen bg-[#fcf7f1]">
      {/* Banner */}
      <div className="relative w-full md:h-[320px] h-[100px] flex items-center justify-center">
        <Image src="/bg7.jpg" alt="Banner" layout="fill" className="z-0 md:object-cover object-contain" priority />
        <div className="hidden md:flex absolute left-[10%] top-10 z-10 container w-fit mx-auto px-4 flex-col justify-center h-full bg-[#fcf7f1] rounded-xl">
          <div className="max-w-2xl flex flex-col items-center justify-center px-10">
            <h1 className="text-3xl  font-semibold text-black mb-2 drop-shadow-lg">The Impact of What We Do How <br /> We Make a Difference</h1>
            <div className="w-96 rounded-lg overflow-hidden">
              <Image src="/pic7.jpg" alt="Intro" width={300} height={300} className="object-cover w-full h-full" />
            </div>
          </div>
        </div>
      </div>
      <div>
        <div className="md:hidden flex container w-full mx-auto p-5 flex-col justify-center h-full bg-[#fcf7f1] rounded-xl">
          <div className="w-full flex flex-col items-center justify-center">
            <h1 className="text-xl font-semibold text-black text-center mb-2 drop-shadow-lg">The Impact of What We Do How <br /> We Make a Difference</h1>
            <div className="w-full rounded-lg overflow-hidden">
              <Image src="/pic7.jpg" alt="Intro" width={300} height={300} className="object-cover w-full h-full" />
            </div>
          </div>
        </div>
      </div>
      <div className="md:hidden py-10 flex flex-col items-center justify-center">
        <h1 className="text-xl font-semibold text-center text-black mb-2 drop-shadow-lg">The Impact of What We Do How <br /> We Make a Difference</h1>
        <div className="w-96 rounded-lg overflow-hidden shadow-lg px-2">
          <Image src="/pic7.jpg" alt="Intro" width={300} height={300} className="object-cover w-full h-full" />
        </div>
      </div>

      {/* Main Content */}
      <section className="md:p-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-10">
            {/* Left Side */}
            <div className="lg:w-7/12 w-full">
              <div className="md:p-8 mb-8">
                <h4 className="text-xl md:text-3xl font-bold mb-4 text-amber-700">The Difference is in the Detail — Crafted for the Wild, Built on Trust.</h4>
                <p className="text-sm md:text-base text-gray-700 mb-4">
                  What Makes the Difference
                  At Adventure Axis, we go beyond just supplying gear — we create complete outdoor solutions rooted in experience, precision, and purpose. What sets us apart is our deep understanding of the adventure world — not just as suppliers, but as explorers ourselves.
                  <br />
                  Every product we offer is handpicked, field-tested, and quality-assured to perform in the toughest terrains — from roaring rivers to snow-capped summits. Our commitment to excellence lies in the details: customized equipment kits, expert guidance, reliable logistics, and ongoing support that makes our service truly expedition-ready.
                  <br />
                  We don’t just sell world-class brands — we build long-term partnerships with our customers by providing honest advice, responsive service, and a team that stands by you before, during, and after the journey. With a foundation built on local roots and global reach, we’re proud to be the trusted choice for India’s adventure community.
                  <br />
                  That’s the Adventure Axis difference — where gear meets grit, and trust powers every trail.
                </p>

                {/* Accordion */}
                <div className="w-full max-w-2xl mx-auto mb-8">
                  {accordionData.map((item, idx) => {
                    // Create a ref for each accordion item
                    const contentRef = React.useRef(null);
                    // Calculate maxHeight for transition
                    const isOpen = openIndex === idx;
                    const [height, setHeight] = React.useState(0);

                    React.useEffect(() => {
                      if (isOpen && contentRef.current) {
                        setHeight(contentRef.current.scrollHeight);
                      } else {
                        setHeight(0);
                      }
                    }, [isOpen]);

                    return (
                      <div key={idx} className="mb-2 border border-gray-200 rounded-lg bg-white shadow-sm">
                        <button
                          className={`w-full flex justify-between items-center px-4 py-3 text-left font-semibold text-lg transition focus:outline-none ${isOpen ? 'text-amber-700' : 'text-gray-800'}`}
                          onClick={() => setOpenIndex(isOpen ? -1 : idx)}
                          aria-expanded={isOpen}
                        >
                          <span>{item.title}</span>
                          <span className="text-3xl">{isOpen ? '-' : '+'}</span>
                        </button>
                        <div
                          ref={contentRef}
                          style={{
                            maxHeight: isOpen ? height : 0,
                            opacity: isOpen ? 1 : 0,
                            overflow: 'hidden',
                            transition: 'max-height 0.4s cubic-bezier(0.4,0,0.2,1), opacity 0.3s',
                          }}
                          className="px-6 py-2"
                        >
                          <p className="text-gray-700 text-base whitespace-pre-line">{item.content}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>
            </div>
            {/* Right Side - keep width fixed and separated */}
            <div className="lg:w-5/12 w-full flex items-center justify-center sticky top-20 self-start p-10 md:p-0">
              <div className="w-full max-w-md rounded-xl overflow-hidden bg-white shadow-lg">
                <Image
                  src="/Rishikesh.jpg"
                  alt="Rishikesh"
                  width={600}
                  height={800}
                  className="object-cover w-full h-auto"
                  style={{ aspectRatio: '3/4' }}
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default WhatWeDo;