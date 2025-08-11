"use client";
import Image from "next/image";
import Link from "next/link";

const VisionMission = () => {
  return (
    <section className="w-full bg-[#fcf7f1] min-h-screen">
      <div className="w-full">
        <div className="relative w-full h-[100px] md:h-[250px] flex items-center justify-center bg-[#fcf7f1] overlay-black-light">
          <Image
            src="/bg1.jpg"
            alt="About Banner"
            layout="fill"
            objectFit="cover"
            className="z-0 opacity-80"
            priority
          />
          <div className="relative z-10 text-center text-white">
            <h1 className="text-4xl md:text-5xl font-bold mb-2 drop-shadow-lg"> We Are A "Great Place To Work-Certified" Company!</h1>
          </div>
        </div>
        <div className="w-full container mx-auto flex gap-5 md:gap-10 items-center mt-10 px-5 md:px-20">
          {/* Left: Intro & Image */}
          <div className="w-full flex flex-col items-start">
            <h2 className="text-xl md:text-4xl font-bold mb-6 text-gray-800 text-start lg:text-start">Certified to Inspire – Where Passion, People & Purpose Meet.</h2>
            <p className="text-md md:text-lg text-gray-700 leading-relaxed mb-6 text-start lg:text-justify">
              As a result of the analyzes and evaluations made by Great Place To Work for our company in 2023, we were awarded the Great Place To Work Certificate" by providing the 'great workplace' criteria with a high trust culture. Our company is based in Tapovan, Badrinath Highway, Rishikesh. The number one destination for adventure activities we have been serving numerous adventure companies all over in India, for there equipment need for rafting, camping, bungee jumping, trekking and expeditions. It’s not enough to be good at providing equipment solutions. You also need to be good at what comes next. Our leaders are skilled at both. Learn about who they are and their vision for industry and that’s just scratching the surface.
            </p>
          </div>

        </div> {/* Right: Vision & Mission */}
        <div className="container mx-auto w-full flex flex-col md:flex-row gap-8 px-5 md:px-20">
          <div className="w-full md:w-2/3 flex justify-center mb-6 ">
            <Image src="/Vision.jpg" alt="Vision" width={300} height={300} className="rounded-xl shadow-lg object-cover w-fit h-auto " />
          </div>
          {/* Vision */}
          <div className="w-full md:w-1/2 flex-col mb-4">
            <div className="rounded-xl  p-6 mb-4 border border-gray-400">
              <h3 className="text-2xl font-bold mb-2 text-amber-700">Our Vision</h3>
              <p className="text-gray-700 text-base">
                To become India’s most trusted and innovative adventure equipment brand — empowering explorers, protecting the planet, and uplifting local communities — one expedition at a time.
                <br />
                We envision a world where adventure is safe, sustainable, and accessible to all. Through global-quality gear, eco-conscious practices, and strong community partnerships, Adventure Axis strives to lead the outdoor industry with integrity, impact, and inspiration — from the Himalayan trails to the farthest frontiers of exploration.
              </p>
            </div>
            {/* Mission */}
            <div className=" rounded-xl  p-6 border border-gray-400">
              <h3 className="text-2xl font-bold mb-2 text-amber-700">Our Mission</h3>
              <ul className="list-disc pl-6 text-gray-700 text-base space-y-2">
                To deliver high-performance, safety-tested adventure equipment that empowers every explorer — from professionals to enthusiasts — with reliability, innovation, and responsibility.
                <br />
                At Adventure Axis, our mission is to:
                <br />
                Equip adventure seekers with world-class gear suited for extreme environments
                <br />
                Promote eco-friendly and sustainable outdoor practices
                <br />
                Strengthen and support local businesses and communities in the Himalayan region
                <br />
                Maintain global partnerships while staying deeply rooted in local expertise
                <br />
                Foster a workplace culture built on trust, teamwork, and growth
                <br />
                We’re not just outfitting journeys — we’re building a movement that celebrates nature, encourages exploration, and makes every expedition safer and more meaningful.
              </ul>
            </div>
          </div>
        </div>
      </div>
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
    </section>

  );
};

export default VisionMission;