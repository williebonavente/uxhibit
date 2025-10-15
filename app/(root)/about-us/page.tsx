"use client";
import Image from "next/image";

export default function AboutUs() {
  return (
    <div className="min-h-screen px-6 sm:px-12 py-16 text-gray-200 bg-[#0a0a0a]">
      <div className="max-w-6xl mx-auto space-y-16">
        {/* Hero Section */}
        <section className="text-center space-y-4">
          <h1 className="text-5xl font-extrabold text-white tracking-tight">
            About <span className="text-orange-400">UXhibit</span>
          </h1>
          <p className="max-w-3xl mx-auto text-gray-400 text-lg leading-relaxed">
            Empowering future UI/UX designers through{" "}
            <span className="text-orange-400 font-semibold">AI-driven insights</span>,{" "}
            <span className="text-orange-400 font-semibold">guided learning</span>, and{" "}
            <span className="text-orange-400 font-semibold">hands-on evaluation</span> — bridging
            design theory with real-world application.
          </p>
        </section>

        {/* About Section */}
        <section className="space-y-10">
          {/* Centered Intro Paragraph with Hoverable Logo */}
          <div className="flex flex-col items-center justify-center text-center text-gray-300 leading-relaxed space-y-6">
            <a
              href="https://www.facebook.com/profile.php?id=61581138719895"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-transform duration-300 hover:scale-110"
            >
              <Image
                src="/logo 1.svg"
                alt="UXhibit Logo"
                width={150}
                height={150}
                className="mx-auto drop-shadow-lg"
              />
            </a>

            <p className="max-w-3xl text-lg">
              <span className="text-orange-400 font-semibold">UXhibit</span> is a web-based design
              evaluation tool that empowers aspiring UI/UX designers to improve their craft through{" "}
              <span className="text-orange-400 font-semibold">AI-driven feedback</span> and{" "}
              <span className="text-orange-400 font-semibold">guided learning</span>. Designed as an
              academic project under the{" "}
              <span className="text-orange-400 font-semibold">
                Polytechnic University of the Philippines
              </span>
              , UXhibit bridges the gap between design theory and real-world application by helping
              learners identify usability issues, enhance creativity, and apply user-centered design
              principles.
            </p>
          </div>

          {/* Two Columns */}
          <div className="grid md:grid-cols-2 gap-10 text-gray-300 leading-relaxed">
            {/* Left Column */}
            <div>
              <p>
                With UXhibit, learners can upload their design projects, receive automated feedback
                based on{" "}
                <span className="text-orange-400 font-semibold">
                  Nielsen’s 10 Usability Heuristics
                </span>{" "}
                and{" "}
                <span className="text-orange-400 font-semibold">
                  Web Content Accessibility Guidelines (WCAG) 2.1
                </span>
                , and discover actionable suggestions for improvement. The platform encourages{" "}
                <span className="text-orange-400 font-semibold">self-directed growth</span>,
                allowing users to refine their designs iteratively while understanding how usability
                principles affect real users, including diverse demographics such as Gen Z audiences
                and different occupational groups.
              </p>
            </div>

            {/* Right Column */}
            <div>
              <p>
                Our goal is to make design evaluation{" "}
                <span className="text-orange-400 font-semibold">
                  accessible, insightful, and educational
                </span>
                . Whether you are a student, beginner designer, or enthusiast, UXhibit serves as your
                digital mentor, helping you create interfaces that are not just visually appealing
                but truly usable.
              </p>
              <p className="italic text-gray-400 mt-4">
                “Good design is not just how it looks — it’s how it works for everyone.”
              </p>
            </div>
          </div>
        </section>

        {/* Mission & Vision Section */}
        <section className="grid md:grid-cols-2 gap-10 mt-10">
          <div className="bg-[#141414] p-8 rounded-2xl border border-gray-800 hover:border-orange-400 transition">
            <h2 className="text-2xl font-semibold text-orange-400 mb-3">Our Mission</h2>
            <p className="text-gray-300 leading-relaxed">
              To empower the next generation of UI/UX designers through an intelligent feedback
              system that promotes usability awareness, self-learning, and human-centered design
              practices.
            </p>
          </div>
          <div className="bg-[#141414] p-8 rounded-2xl border border-gray-800 hover:border-orange-400 transition">
            <h2 className="text-2xl font-semibold text-orange-400 mb-3">Our Vision</h2>
            <p className="text-gray-300 leading-relaxed">
              To shape a community of designers who create meaningful, inclusive, and user-centered
              digital experiences through the integration of technology, creativity, and continuous
              learning.
            </p>
          </div>
        </section>

        {/* Team Section */}
        <section className="text-center mt-16">
          <h2 className="text-4xl font-bold text-orange-400 mb-12">Meet the Team</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10">
            {[
              {
                name: "Matthew E. Cucio",
                role: "Project Lead / Frontend Developer",
                img: "/team/OFC matthew.png",
                link: "https://www.linkedin.com/in/matthew-cucio-364724266/",
              },
              {
                name: "Kail Luisse D. Balbalec",
                role: "Database Designer / Quality Assurance",
                img: "/team/OFC kail.png",
                link: "https://www.linkedin.com/in/kail-balbalec-0124a8267/",
              },
              {
                name: "Vanness M. Lao",
                role: "UI/UX Designer / Frontend Developer",
                img: "/team/OFC van.png",
                link: "https://www.linkedin.com/in/vanness-lao-710607295/",
              },
              {
                name: "Willie M. Bonavente",
                role: "Backend Developer / AI Engineer",
                img: "/team/OFC willie.png",
                link: "https://www.linkedin.com/in/willie-bonavente-828180207/",
              },
            ].map((member) => (
              <a
                key={member.name}
                href={member.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center bg-[#141414] rounded-2xl p-6 hover:scale-105 hover:border-orange-400 border border-gray-800 transition-transform duration-300"
              >
                <Image
                  src={member.img}
                  alt={member.name}
                  width={120}
                  height={120}
                  className="rounded-full border-2 border-orange-400 object-cover mb-4"
                />
                <h3 className="font-semibold text-lg text-white">{member.name}</h3>
                <p className="text-gray-400 text-sm">{member.role}</p>
              </a>
            ))}
          </div>

          <p className="text-center mt-12 text-gray-400 italic">
            Guided by our adviser, we collaboratively built UXhibit to promote continuous learning
            and accessible design education.
          </p>
        </section>
      </div>
    </div>
  );
}
