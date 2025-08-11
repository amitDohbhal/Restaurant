"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

const accordionData = [
  {
    title: "What Makes Us Unique?",
    content: `At Adventure Axis, we don’t just sell gear — we build expedition readiness from the ground up. Here's what sets us apart:

✅ Legacy of Trust & Experience
With 25+ years in the adventure equipment industry, we bring unmatched field knowledge, technical expertise, and proven reliability to every product and solution we offer.

✅ Authorized Dealer for Global Brands
We are official partners of NRS, Camp, Wiley X, Lafuma, and other leading international names — ensuring authentic gear, world-class quality, and industry-grade safety standards.

✅ Complete Outdoor Equipment Hub
From water sports to mountaineering, trekking, camping, and high-altitude expeditions, we offer an all-in-one destination for professionals and enthusiasts alike.

✅ Innovation-Driven Solutions
Our gear isn’t just rugged — it’s smart, tested, and tailored for real-world challenges. We help optimize outdoor performance with innovative, practical solutions.

✅ Industry-Wide Trust
We are a preferred supplier for India’s top adventure tour operators, rescue teams, training schools, and outdoor institutions — trusted across the country.

✅ Recognized Workplace Excellence
Proud recipient of the Great Place to Work® Certification (2025), reflecting our commitment to ethical practices, team spirit, and professional excellence.

🎯 Adventure Axis – Where Every Expedition Begins with the Right Gear and the Right People.`
  },
  {
    title: "Sustainable & Eco-Friendly",
    content: `At Adventure Axis, sustainability isn’t just a trend — it’s a commitment woven into everything we do. As a responsible adventure gear provider, we recognize the importance of preserving the very landscapes we help people explore.

🌱 Eco-Conscious Product Selection
We prioritize partnerships with brands that focus on sustainable manufacturing, eco-friendly materials, and low-impact packaging. Many of our products are made from recycled, biodegradable, or responsibly sourced components — built to last, without costing the planet.

🌍 Leave No Trace Philosophy
We actively promote the "Leave No Trace" principles across our community. Whether it’s trekking, rafting, or camping, we encourage every adventurer to respect nature`
  },
  {
    title: "Global Accessibility with Local Roots",
    content: `At Adventure Axis, we proudly operate at the intersection of global standards and local soul. While our store is rooted in Tapovan, Rishikesh — the gateway to the Himalayas — our reach extends across India and beyond, serving adventurers, expedition teams, and outdoor professionals worldwide.

We offer globally recognized brands like NRS, Camp, Wiley X, and Lafuma, ensuring world-class quality and performance.

Through our efficient logistics and online accessibility, we make premium gear available across remote regions, metros, and mountain bases.

Yet, our foundation remains local — built on trust, regional expertise, and community connection within the Himalayan ecosystem.

We bridge the gap between international innovation and local understanding, delivering outdoor solutions that are both globally reliable and regionally relevant.`
  }
];
const AboutMe = () => {
  const [openIndex, setOpenIndex] = useState(0);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const res = await fetch("/api/team");
        if (!res.ok) throw new Error("Failed to fetch team data");
        const data = await res.json();
        setTeamMembers(data);
      } catch (err) {
      } finally {
        setLoading(false);
      }
    };
    fetchTeam();
  }, []);
  return (
    <div className="w-full min-h-screen bg-[#fcf7f1]">
      {/* Banner */}
      <div className="relative w-full h-[150px] md:h-[250px] flex items-center justify-center bg-secondary overlay-black-light">
        <Image
          src="/bg1.jpg"
          alt="About Banner"
          layout="fill"
          objectFit="cover"
          className="z-0 opacity-80"
          priority
        />
        <div className="relative z-10 text-center text-white">
          {/* <h1 className="text-xl md:text-5xl font-bold mb-2 drop-shadow-lg">About Rishikesh Handmade</h1> */}
        </div>
      </div>

      {/* Main Content */}
      <section className="content-inner md:p-10 p-4 overflow-hidden">
      <div className="container mx-auto md:px-20 px-5">
          <div className="flex flex-col md:flex-row gap-5 md:gap-10 items-stretch">
            {/* Left: Text and Accordion */}
            <div className="lg:w-1/2 w-full flex flex-col justify-center overflow-y-auto px-2">
              <div className="mb-8">
                <h2 className="text-xl md:text-5xl font-bold mb-6 text-gray-800">"Certified to Inspire – Where Passion, People & Purpose Meet."</h2>
                <p className="text-md text-gray-700 leading-relaxed mb-6">
                  Adventure Axis is not just a store — it’s a legacy in the making. Based in Tapovan, Rishikesh, on the scenic Badrinath Highway, we have grown to become a complete outdoor adventure equipment hub and a recognized name across the expedition and outdoor gear industry in India.
                  <br />

                  With over 25 years of relentless innovation and experience, Adventure Axis has become synonymous with trust, durability, and cutting-edge gear solutions for every kind of adventurer — from rafting guides and mountain trekkers to rescue professionals and global expedition teams.
                  <br />
                  We are proud to be authorized dealers for some of the most respected international brands in the world, including NRS, Camp, Wiley X, and Lafuma. Our extensive catalog features water sports gear, high-altitude expedition equipment, camping essentials, helmets, oars, dry bags, harnesses, safety & rescue tools, and professional trekking gear — everything you need for a safe and successful adventure.
                  <br />
                  Our goal is more than just supplying equipment — we deliver practical, innovative, and complete outdoor solutions tailored to meet the demands of today’s adventure businesses and extreme-condition professionals. Through our field-tested expertise and global sourcing, we help clients streamline operations, improve safety, and perform at the highest level.
                  <br />
                  Recognized for our excellence in service and work culture, Adventure Axis earned the prestigious Great Place to Work® Certification in 2025. This reflects our deep-rooted commitment to quality, service integrity, and continuous growth in the adventure equipment sector.
                  <br />
                  🌍 Adventure Axis — Where Exploration Meets Innovation.
                  The trusted partner of India's adventure community for complete expedition solutions.<br /><br />
                </p>
              </div>

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
                        className={`w-full flex justify-between items-center px-6 py-4 text-left font-semibold text-lg transition focus:outline-none ${isOpen ? 'text-amber-700' : 'text-gray-800'}`}
                        onClick={() => setOpenIndex(isOpen ? -1 : idx)}
                        aria-expanded={isOpen}
                      >
                        <span className="text-sm md:text-xl">{item.title}</span>
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

            {/* Right: Images Grid */}
            <div className="lg:w-1/2 min-h-[600px] h-full flex">
              <div className="grid grid-cols-5 gap-4 w-full ">
                <div className="col-span-3">
                  <Image src="/A1.jpg" alt="A1" width={900} height={400} className="rounded-lg shadow-lg object-cover w-full h-full" />
                </div>
                <div className="col-span-2">
                  <Image src="/A2.jpg" alt="A2" width={300} height={400} className="rounded-lg shadow-lg object-cover w-full h-full" />
                </div>

                <div className="col-span-5 row-span-2">
                  <Image src="/A3.jpg" alt="A3" width={800} height={300} className="rounded-lg shadow-lg object-cover w-full h-auto" />
                </div>
                <div className="col-span-5 row-span-2">
                  <Image src="/A4.jpg" alt="A4" width={400} height={300} className="rounded-lg shadow-lg object-cover w-full h-auto" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Get In Touch Section */}
      <section className="w-full bg-black py-5 text-white flex flex-col md:flex-row items-center justify-between  md:px-24 gap-6 ">
        <div className="md:mb-6 md:mb-0 md:px-3">
          <h3 className="text-xl md:text-3xl font-bold gap-2 text-center md:text-start">Questions?
            <br className="md:hidden" />
            <span className="text-sm md:text-lg font-normal px-2">Our experts will help find the gear that’s right for you</span>
          </h3>
        </div>
        <Link href="/contact" className="btn bg-white text-black font-bold px-8 py-3 rounded-lg shadow transition">Get In Touch</Link>
      </section>
    </div>
  );
};

export default AboutMe;