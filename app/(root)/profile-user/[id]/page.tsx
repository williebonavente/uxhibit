
import { createClient } from "@/utils/supabase/client";
import { notFound } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import { IconArrowLeft } from "@tabler/icons-react";
import Link from "next/link";
import DesignsGallery from "@/components/designs-gallery";
import Image from "next/image";
import {
  ArrowUpRight, Mail, Globe,
  Users, Heart, Eye, LayoutGrid, Accessibility, Star, FileText, Check
} from "lucide-react";
import { getInitials } from "../../dashboard/page";
import { ProfileSkillRow } from "@/lib/declaration/profileTypes";
import ProfileSkillsSection from "@/components/profile_management/skills/profile-skills-client";
import ProfileAboutSectionClient from "@/components/profile_management/about/profile-about-client";
import ProfileDesignPhiloClient from "@/components/profile_management/design-philo/profile-design-philo-client";
import ProfileCareerHighlightsClient from "@/components/profile_management/career-highlights/profile-career-high-client";
import ProfileContactClient from "@/components/profile_management/contacts/profile-contact-cilent";
import ProfileStatsGrid from "@/components/profile_management/profie-stats/profile-stats-grid";
import ProfileStatsGridContainer from "@/components/profile_management/profie-stats/profile-stats-grid-container";
// import dynamicImport from "next/dynamic";

export const dynamicMode = "force-dynamic";
export const revalidate = 0;

type ProfilePages = {
  params: { id: string };
}

export default async function ProfilePage(propsPromise: Promise<ProfilePages>) {

  const props = await propsPromise;
  const params = await props.params;
  console.log("Resolved route params:", params);


  const supabase = createClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, first_name, middle_name, last_name, avatar_url")
    .eq("id", params.id)
    .single();

  if (error) console.error("Profile error:", error);

  if (error || !profile) {
    notFound();
  }

  const { data: skillsData, error: skillsError } = await supabase
    .from("profile_skills")
    .select("skills(name)")
    .eq("profile_id", params.id);

  // console.error(skillsData);

  if (skillsError) console.error("Skills error:", skillsError);

  const { data: details, error: detailsError } = await supabase
    .from("profile_details")
    .select("id, about, design_philo, career_highlights")
    .eq("profile_id", params.id)
    .maybeSingle();

  // console.error(details);

  if (detailsError) console.error("Details error:", detailsError.message);
  const fullName = [profile.first_name, profile.middle_name, profile.last_name]
    .filter(Boolean)
    .join(" ") || "John D Doe";


  const avatarUrl = profile.avatar_url || undefined;

  const bio = details?.about || "";
  const designPhilo = details?.design_philo || "";
  const careerHighlights = details?.career_highlights || [];

  const profileDetailsId = details?.id;

  const role = "UI/UX Designer";

  const skills = (skillsData as ProfileSkillRow[] | null)
    ?.map((row) => row.skills?.name)
    .filter((name): name is string => !!name) || [];

  const portfolioLink = "https://yourportfolio.com";

  const featuredWorks = [
    {
      title: "Mobile Banking App",
      image: "https://assets.awwwards.com/awards/element/2022/05/627be98fa9616400863515.png",
      description: "Redesigned for better accessibility and intuitive navigation.",
      link: "https://yourwebsite.com/mobile-banking-case-study",
    },
    {
      title: "E-Commerce Website",
      image: "https://kinsta.com/wp-content/uploads/2019/01/portfolio-website-thumbnail-gallery.jpeg",
      description: "Boosted conversion rates with streamlined checkout and product filtering.",
      link: "https://yourwebsite.com/ecommerce-case-study",
    },
    {
      title: "Fitness Tracker Dashboard",
      image: "https://s3-alpha.figma.com/hub/file/1712964412/01a3dfa4-6614-4801-9617-932b46d23c6b-cover.png",
      description: "Designed a responsive dashboard for tracking workouts and goals.",
      link: "https://yourwebsite.com/fitness-tracker-case-study",
    },
    {
      title: "Online Learning Platform",
      image: "https://uihut-data.fra1.cdn.digitaloceanspaces.com/design/web-app/pack/thumbnail/UH27pM1N8dTXtxVq.webp",
      description: "Enhanced course discovery and accessibility for diverse learners.",
      link: "https://yourwebsite.com/learning-platform-case-study",
    },
  ];

  const caseStudies = [
    {
      title: "Inclusive Travel App",
      image: "https://s3-alpha.figma.com/hub/file/5171202716/bc6c04cc-1149-4577-8c6d-bde4eddc3259-cover.png",
      summary: "Designed for WCAG 2.1 AA compliance, improving usability for low-vision users.",
      outcome: "Increased user retention by 35%",
      link: "https://www.figma.com/file/5171202716/Inclusive-Travel-App-Case-Study",
    },
    {
      title: "Accessible E-Learning Platform",
      image: "https://elements-resized.envatousercontent.com/elements-cover-images/bbd576b4-5842-49f1-995a-c52037bff2fc?w=433&cf_fit=scale-down&q=85&format=auto&s=ecae5006537ed362c9a196379797d9729eca2a8dfc7456461287b2e771e33eca",
      summary: "Applied POUR principles to restructure content hierarchy and navigation.",
      outcome: "Reduced bounce rate by 42%",
      link: "https://yourwebsite.com/e-learning-case-study",
    },
    {
      title: "Voice-Controlled Smart Home UI",
      image: "https://mir-s3-cdn-cf.behance.net/projects/404/90bcea159012677.Y3JvcCwxNTM0LDEyMDAsMzQsMA.png",
      summary: "Designed for hands-free interaction and screen reader compatibility.",
      outcome: "Improved task completion rate by 28%",
      link: "https://yourwebsite.com/smart-home-ui-case-study",
    },
    {
      title: "Accessible Job Board",
      image: "https://ictsolved.github.io/assets/images/blog/2019-11-30-bookstore-app-ui-designs-for-inspiration/bookstore-app-ui-cover.png",
      summary: "Implemented semantic HTML and ARIA roles for screen reader support.",
      outcome: "Increased job application submissions by 22%",
      link: "https://yourwebsite.com/job-board-accessibility-case-study",
    },
  ];
  // TODO: TO BE IMPLEMENTED LATER
  // const metrics = [
  //   { label: "Avg. Accessibility Score", value: "98/100" },
  //   { label: "User Satisfaction", value: "4.8/5" },
  //   { label: "Designs Published", value: 27 },
  //   { label: "WCAG Success Criteria Met", value: "100%" },
  // ];

  return (
    <div className="bg-accent/25 dark:bg-[#120F12]">
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
          <div className="text-start">
            <p className="font-semibold text-base sm:text-lg truncate max-w-[240px]">{fullName}</p>
            <p className="text-sm sm:text-base text-black/80 truncate max-w-[240px]">{role}</p>
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="flex flex-col gap-10 mt-10 bg-accent/25 dark:bg-[#120F12]">

        {/* Profile stats  */}
        <ProfileStatsGridContainer profileId={profile.id} />

        <div className="flex flex-col gap-4">
          {/* About Section */}
          <ProfileAboutSectionClient bio={bio} profileId={profile.id} />

          {/* Skills Section */}
          <ProfileSkillsSection initialSkills={skills} profileId={profile.id} />

          {/* Design Philosophy Section */}
          <ProfileDesignPhiloClient designPhilo={designPhilo} profileId={profile.id} />

          {/* Career Highlights Section */}
          <ProfileCareerHighlightsClient
            initialHighlights={careerHighlights}
            profileId={profile.id}
          />
        </div>

        {/* UXhibit Evaluations */}
        <div className="bg-white/50 dark:bg-[#1A1A1A]/25 rounded-xl p-5 shadow-md">
          <h2 className="text-lg font-semibold mb-2 text-[#1A1A1A] dark:text-white">UXhibit Evaluations</h2>
          <DesignsGallery />
        </div>

        {/* Portfolio & Case Studies */}
        <div className="flex flex-col gap-4">
          <div className="bg-white dark:bg-[#1A1A1A]/25 rounded-xl p-5 shadow-md">
            <h2 className="text-lg font-semibold mb-3 text-[#1A1A1A] dark:text-white">Portfolio</h2>
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <Globe size={20} className="text-blue-400" />
              <Link href={portfolioLink} target="_blank" className="text-sm text-orange-300 dark:text-[#ED5E20] hover:underline truncate cursor-pointer">{portfolioLink}</Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {featuredWorks.map((work, i) => (
                <Link key={i} href={work.link} target="_blank" className="group bg-white dark:bg-[#1A1A1A] shadow-md rounded-xl p-3 gap-2 hover:scale-[1.05] transition-transform duration-200 cursor-pointer">
                  <Image src={work.image} alt={work.title} width={400} height={200} className="rounded-md mb-3 object-cover w-full h-40" />
                  <h3 className="font-semibold break-words leading-5 text-[#ED5E20] mb-3">{work.title}</h3>
                  <p className="text-xs text-gray-800 dark:text-gray-400">{work.description}</p>
                </Link>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-[#1A1A1A]/25 rounded-xl p-5 shadow-md">
            <h2 className="text-lg font-semibold mb-3 text-[#1A1A1A] dark:text-white">Case Studies</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {caseStudies.map((study, i) => (
                <Link key={i} href={study.link} target="_blank" className="group bg-white dark:bg-[#1A1A1A] shadow-md rounded-xl p-3 gap-2 hover:scale-[1.05] transition-transform duration-200 cursor-pointer">
                  <Image src={study.image} alt={study.title} width={400} height={200} className="rounded-md mb-3 object-cover w-full h-40 border" />
                  <h3 className="font-semibold break-words leading-5 text-[#ED5E20] mb-3">{study.title}</h3>
                  <p className="text-xs text-gray-800 dark:text-gray-400 mb-2">{study.summary}</p>
                  <p className="text-xs text-gray-400 italic flex items-center gap-1"><ArrowUpRight size={12} /> {study.outcome}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Impact Metrics */}
        <div className="bg-white dark:bg-[#1A1A1A]/25 rounded-xl p-5 shadow-md">
          <h2 className="text-lg font-semibold mb-3 text-[#1A1A1A] dark:text-white">Impact Metrics</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[{
              label: "Accessibility Score", value: "98/100", icon: <Accessibility size={25} className="text-white" />
            }, {
              label: "User Satisfaction", value: "4.8/5", icon: <Star size={25} className="text-white" />
            }, {
              label: "Designs Published", value: 27, icon: <FileText size={25} className="text-white" />
            }, {
              label: "WCAG Criteria Met", value: "100%", icon: <Check size={25} className="text-white" />
            }].map((metric, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="bg-[#ED5E20] p-3 rounded-full shrink-0">{metric.icon}</div>
                <div>
                  <p className="text-xl font-bold text-[#1A1A1A] dark:text-white">{metric.value}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-300">{metric.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonials & Contact */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 bg-white dark:bg-[#1A1A1A]/25 rounded-xl p-5 shadow-md">
            <h2 className="text-lg font-semibold mb-3 text-[#1A1A1A] dark:text-white">Testimonials</h2>
            <div className="space-y-4">
              <blockquote className="text-sm text-gray-500 dark:text-gray-300 italic border-l-4 border-green-400 pl-4">
                “Vanness has a rare ability to blend accessibility with stunning design. A true collaborator.”
                <footer className="mt-2 text-xs text-gray-400">— Jane Smith, Product Manager</footer>
              </blockquote>
              <blockquote className="text-sm text-gray-500 dark:text-gray-300 italic border-l-4 border-green-400 pl-4">
                “His attention to detail and POUR principles made our app usable for everyone.”
                <footer className="mt-2 text-xs text-gray-400">— Alex Tan, Frontend Engineer</footer>
              </blockquote>
            </div>
          </div>
          {/* Contact Testimonials here */}
          <ProfileContactClient profileDetailsId={profileDetailsId} />
        </div>
      </div>
    </div>
  );
}