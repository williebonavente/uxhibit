import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { IconArrowLeft } from "@tabler/icons-react";
import Link from "next/link";
import DesignsGallery from "@/components/designs-gallery";
import Image from "next/image";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getInitials(name: string | null) {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  if (!parts.length) return "";
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "";
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default async function ProfilePage({ params }: { params: { id: string } }) {
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, bio")
    .eq("id", params.id)
    .single();

  if (error || !profile) {
    notFound();
  }

  const fullName = profile.full_name || "John Doe";
  const avatarUrl = profile.avatar_url || undefined;
  const bio = profile.bio ||
    "UI/UX Designer passionate about building human-centered digital products.";

  // Dummy data for now — you can later fetch from DB
  const role = "UI/UX Designer";
  const skills = ["Figma", "Adobe XD", "Sketch", "React", "Usability Testing"];
  const portfolioLink = "https://yourportfolio.com";
  const featuredWorks = [
    { title: "Mobile Banking App", link: "#", description: "Redesigned for better accessibility." },
    { title: "E-Commerce Website", link: "#", description: "Improved conversion through better UI." },
  ];
  const contact = {
    email: "designer@example.com",
    website: "https://yourwebsite.com",
    openTo: "Collaboration, Freelance, Full-time",
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center w-full overflow-hidden p-10 ">
      {/* Background */}
      <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover">
        <source src="/images/uxhibit-gif-3(webm).webm" type="video/webm" />
      </video>
      <div className="absolute inset-0 bg-black/50" />

      {/* Card */}
      <div className="relative z-10 w-full max-w-7xl p-6 sm:p-10 md:p-12
                      bg-white/10 dark:bg-black/10 backdrop-blur-xl rounded-2xl
                      shadow-xl border border-white/20 space-y-6">

        {/* Back Button */}
        <Link href="/dashboard" className="flex items-center gap-2 text-sm text-gray-200 hover:text-orange-400">
          <IconArrowLeft size={20} />
        </Link>

        {/* Profile Header - centered layout */}
        <div className="site-header flex flex-col items-center justify-center text-center gap-6 sm:gap-8 px-4 sm:px-0">
          {/* Centered headline */}
          <p className="font-semibold text-white leading-tight text-[clamp(1.5rem,4vw,2.5rem)]">
            Discover the <span className="xhibit-gradient-text">Xhibition</span> of Talent.
          </p>

          {/* Centered avatar card */}
          <div className="user-card flex flex-col items-center gap-3 bg-white/5 rounded-xl p-4 sm:p-6 backdrop-blur supports-[backdrop-filter]:bg-white/10">
            <Avatar className="h-20 w-20 sm:h-24 sm:w-24 rounded-bl-full border-2 border-white/30">
              <AvatarImage
                src={
                  avatarUrl?.startsWith("http")
                    ? avatarUrl
                    : avatarUrl
                    ? `/api/avatars?path=${encodeURIComponent(avatarUrl)}`
                    : undefined
                }
                alt={fullName}
              />
              <AvatarFallback className="rounded-lg text-black dark:text-white text-xl">
                {getInitials(fullName)}
              </AvatarFallback>
            </Avatar>
            <div className="text-center">
              <p className="font-semibold text-base sm:text-lg truncate max-w-[240px]">{fullName}</p>
              <p className="text-sm sm:text-base text-black/80 truncate max-w-[240px]">{role}</p>
            </div>
          </div>
        </div>


        {/* Sections */}
        <div className="grid gap-5">
          
          <div className="flex justify-between gap-5">
            {/* About */}
            <div className=" w-1/2 bg-white/10 dark:bg-black/10 rounded-xl p-5 border border-white/20">
              <h2 className="text-lg font-semibold mb-2 text-white mb-5">About</h2>
              <p className="text-sm text-gray-200">{bio}</p>
            </div>

            {/* Skills */}
            <div className="w-1/2 bg-white/10 dark:bg-black/10 rounded-xl p-5 border border-white/20">
              <h2 className="text-lg font-semibold mb-2 text-white mb-5">Skills & Tools</h2>
              <ul className="flex flex-wrap gap-2">
                {skills.map((skill, i) => (
                  <li key={i} className="px-5 py-2 bg-orange-500/30 text-orange-200 rounded-full text-xs">
                    {skill}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Portfolio */}
          <div className="bg-white/10 dark:bg-black/10 rounded-xl p-5 border border-white/20">
            <h2 className="text-lg font-semibold mb-2 text-white mb-5">Portfolio</h2>
            <p className="text-sm text-gray-300 mb-3">
              View full portfolio: {" "}
              <Link href={portfolioLink} className="text-orange-300 hover:underline">
                {portfolioLink}
              </Link>
            </p>
            <ul className="space-y-3">
              {featuredWorks.map((work, i) => (
                <li key={i} className="border-b border-white/20 pb-2">
                  <Link href={work.link} className="font-medium text-orange-200 hover:underline">
                    {work.title}
                  </Link>
                  <p className="text-sm text-gray-300">{work.description}</p>
                </li>
              ))}
            </ul>
          </div>

          {/* My Works */}
          <div className="bg-white/10 dark:bg-black/10 rounded-xl p-5 border border-white/20">
            <h2 className="text-lg font-semibold mb-2 text-white mb-5">My Works</h2>
            <DesignsGallery />
          </div>

          {/* Contact */}
          <div className="bg-white/10 dark:bg-black/10 rounded-xl p-5 border border-white/20">
            <h2 className="text-lg font-semibold mb-2 text-white mb-5">Contact</h2>
            <p className="text-sm text-gray-200">📧 {contact.email}</p>
            <p className="text-sm text-gray-200">🌐 {contact.website}</p>
            <p className="text-sm text-gray-300">Open to: {contact.openTo}</p>
          </div>
        </div>
      </div>
    </div>
  );
}