import { createClient } from "@/utils/supabase/client";
import { notFound } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
} from "lucide-react";
import { getInitials } from "../../dashboard/page";
import { ProfileSkillRow } from "@/lib/declaration/profileTypes";
import ProfileSkillsSection from "@/components/profile_management/skills/profile-skills-client";
import ProfileAboutSectionClient from "@/components/profile_management/about/profile-about-client";
import ProfileDesignPhiloClient from "@/components/profile_management/design-philo/profile-design-philo-client";
import ProfileCareerHighlightsClient from "@/components/profile_management/career-highlights/profile-career-high-client";
import ProfileContactClient from "@/components/profile_management/contacts/profile-contact-cilent";
import ProfileStatsGridContainer from "@/components/profile_management/profie-stats/profile-stats-grid-container";
import ProfileOwnershipCheckSection from "@/components/profile_management/profile-owner-check/profile-ownership-check-section";
import PortfolioSection from "@/components/profile_management/portfolios/portfolio-section";
import TestimonialsSection from "@/components/profile_management/testimonials/testimonials-section";

export const dynamicMode = "force-dynamic";
export const revalidate = 0;

type ProfilePages = {
  params: { id: string };
};

export default async function ProfilePage(propsPromise: Promise<ProfilePages>) {
  const props = await propsPromise;
  const params = await props.params;
  // console.log("Resolved route params:", params);

  const supabase = createClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, first_name, middle_name, last_name, avatar_url")
    .eq("id", params.id)
    .single();

  if (error) console.error("Profile error:", error);

  if (error || !profile) { notFound(); }

  const { data: skillsData, error: skillsError } = await supabase
    .from("profile_skills")
    .select("skills(name)")
    .eq("profile_id", params.id);

  if (skillsError) console.error("Skills error:", skillsError);

  const { data: details, error: detailsError } = await supabase
    .from("profile_details")
    .select("id, about, design_philo, career_highlights, role")
    .eq("profile_id", params.id)
    .maybeSingle();


  if (detailsError) console.error("Details error:", detailsError.message);
  const fullName = [profile.first_name, profile.middle_name, profile.last_name]
    .filter(Boolean)
    .join(" ") || "John D Doe";

  const { data: portfolioLinkRow, error: portfolioLinkError } = await supabase
    .from("portfolio_links")
    .select("url")
    .eq("user_id", profile.id)
    .order("is_primary", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (portfolioLinkError) console.error("Portfolio link error:", portfolioLinkError);

  const avatarUrl = profile.avatar_url || undefined;
  const bio = details?.about || "";
  const designPhilo = details?.design_philo || "";
  const careerHighlights = details?.career_highlights || [];
  const profileDetailsId = details?.id;
  const role = details?.role || "UI/UX Designer";
  const skills = (skillsData as ProfileSkillRow[] | null)
    ?.map((row) => row.skills?.name)
    .filter((name): name is string => !!name) || [];


  // TODO: Currently doing here
  const portfolioLink = portfolioLinkRow?.url || "";

  const { data: featuredWorks, error: featuredWorksError } = await supabase
    .from("featured_works")
    .select("id, title, image, description, link, user_id, created_at")
    .eq("user_id", profile.id);

  if (featuredWorksError) console.error("Featured works error:", featuredWorksError);

  const { data: caseStudies, error: caseStudiesError } = await supabase
  .from("case_studies")
  .select("id, title, image, summary, outcome, link, user_id, created_at")
  .eq("user_id", profile.id);

  if (caseStudiesError) console.error("Case Studies error", caseStudiesError);

  return (
    <div className="bg-transparent lg:p-10">
      {/* Profile Header - centered layout */}
      <div className="site-header flex flex-col items-center justify-center text-center md:text-left gap-8 px-4 sm:px-6 py-12 sm:py-16 md:py-20 min-h-[250px] md:min-h-[200px] bg-accent/25 dark:bg-[#120F12]">
        {/* Avatar Card */}
        <div className="flex flex-col items-center md:flex-row md:items-center gap-1 w-full md:w-auto">
          <Avatar className="h-30 w-30 sm:h-30 sm:w-30 md:h-30 md:w-30 rounded-bl-full border-5 border-white/75">
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

          {/* Headline & Info */}
          <div className="flex flex-col md:items-start items-center mt-3 md:mt-0 md:ml-6 text-center md:text-left gap-1 md:gap-2">
            <p className="font-semibold text-white leading-tight text-xs sm:text-sm md:text-2xl max-w-full break-words">
              <span className="xhibit-gradient-text">{fullName}</span>
            </p>
            <p className="text-lg sm:text-sm md:text-lg text-white max-w-full break-words opacity-80">
              {role}
            </p>
          </div>
        </div>
      </div> 

      {/* Sections */}
      <div className="flex flex-col gap-10 mt-10 bg-accent/25 dark:bg-[#120F12]">
        {/* Profile stats  */}
        <ProfileStatsGridContainer profileId={profile.id} />

        <div className="flex flex-col gap-10">
          {/* Skills Section */}
          <ProfileSkillsSection initialSkills={skills} profileId={profile.id} />

          {/* About Section */}
          <ProfileAboutSectionClient bio={bio} profileId={profile.id} />

          {/* Design Philosophy Section */}
          <ProfileDesignPhiloClient
            designPhilo={designPhilo}
            profileId={profile.id}
          />

          {/* Career Highlights Section */}
          <ProfileCareerHighlightsClient
            initialHighlights={careerHighlights}
            profileId={profile.id}
          />
        </div>

        {/* UXhibit Evaluations */}
        <div className="bg-white/50 dark:bg-[#1A1A1A]/25 rounded-xl p-5 shadow-md">
          <h2 className="text-lg font-semibold mb-2 text-[#1A1A1A] dark:text-white">UXhibit Evaluations</h2>
          <ProfileOwnershipCheckSection profileId={profile.id} />
        </div>

        {/* Portfolio & Case Studies */}
        <PortfolioSection
          portfolioLink={portfolioLink}
          featuredWorks={featuredWorks ?? []}
          caseStudies={caseStudies ?? []}
          profileId={profile?.id}
        />

          {/*TODO: TO BE IMPLEMENTED  */}
        {/* Testimonials & Contact */}
        <div className="flex flex-col sm:flex-row gap-4">
          <TestimonialsSection profileId={profile.id} />
        </div>
        {/* Contact Testimonials here */}
        <ProfileContactClient profileDetailsId={profileDetailsId} />
      </div>
    </div>
  );
}
