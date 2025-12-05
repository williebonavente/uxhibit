"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export default function TermsPage() {
  const router = useRouter();

  const [canAccept, setCanAccept] = useState(false);
    const [accepted, setAccepted] = useState<boolean>(
    typeof window !== "undefined" && localStorage.getItem("termsAccepted") === "true"
  );
    const [isProcessing, setIsProcessing] = useState(false);

  const scrollRef = useRef<HTMLDivElement | null>(null)

  const handleAccept = () => {
    setIsProcessing(true);
    localStorage.setItem("termsAccepted", "true");
    router.push(`${process.env.NEXT_PUBLIC_APP_URL}/auth/signup`);
  };

  const whiteCursor: React.CSSProperties = {
    cursor:
      "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' stroke='%23ffffff' fill='none' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M3 3l7 17 2-7 7-2-16-8Z'/></svg>\") 2 2, pointer",
  };

  useEffect(() => {
  const el = scrollRef.current;
  if (!el) return;
  const onScroll = () => {
    const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 8;
    setCanAccept(nearBottom);
  };
  el.addEventListener("scroll", onScroll);
  onScroll();
  return () => el.removeEventListener("scroll", onScroll);
}, []);

useEffect(() => {
  setAccepted(localStorage.getItem("termsAccepted") === "true");
}, []);

  return (
    <div
      style={whiteCursor}
      className="relative min-h-screen flex items-center justify-center w-full overflow-hidden p-5"
    >
      {/* Background video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="/images/uxhibit-gif-3(webm).webm" type="video/webm" />
      </video>
      <div className="absolute inset-0 bg-black/40" />

      {/* Content box */}
      <div className="relative z-10 flex flex-col w-full max-w-3xl p-8 bg-[#1E1E1E]/40 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20">
        <div className="flex justify-center mb-2">
          <Image
            src="/images/dark-header-icon.png"
            alt="Uxhibit Logo"
            width={2280}
            height={899}
            className="w-auto h-20"
          />
        </div>

        <h2 className="text-xl font-bold text-center gradient-text">
         Privacy Policy 
        </h2>

        {/* Scrollable Terms Section */}
        <div ref={scrollRef} className="text-sm sm:text-base text-white dark:text-[#F5F5F5]/70 mb-6 space-y-6 max-h-[400px] overflow-y-auto leading-relaxed mt-10">



         

          {/* Privacy Policy */}
<section>
  <div className="pl-7 space-y-1">
    We take data privacy and security seriously. Our collection, processing,
    retention, and protection of personal data comply with the Philippines’
    Data Privacy Act of 2012 (DPA) and its Implementing Rules and Regulations.
    {" "}
    <Link
      href="https://privacy.gov.ph/data-privacy-act/"
      className="underline"
      target="_blank"
      rel="noopener noreferrer"
    >
        https://privacy.gov.ph/data-privacy-act/
    </Link>
    .
    <br /><br />
    By using the Services, you acknowledge and agree to the terms outlined in
    our Privacy Policy, which is incorporated into these Legal Terms. The
    Services are operated and hosted in the Philippines. If you access the
    Services from a region with data protection laws or requirements that
    differ from Philippine law, you understand and agree that your continued use
    of the Services constitutes your express consent to:
    <ul className="list-disc pl-7 space-y-1">
      <li>the transfer of your personal data to the Philippines;</li>
      <li>the processing of your data in accordance with the Data Privacy Act;</li>
      <li>the application of Philippine data protection standards to your information.</li>
    </ul>
    We implement organizational, physical, and technical security measures to
    safeguard personal data and ensure compliance with DPA requirements on
    transparency, legitimate purpose, and proportionality.
  </div>
</section>


          
          {/* Privacy Notice */}
          <section>
            <div className="pl-7 space-y-1">
              Last updated 10/02/2025
              <br />
              <br />
              For UXhibit (&quot;<strong>we</strong>,&quot; &quot;
              <strong>us</strong>,&quot; or &quot;<strong>our</strong>&quot;), describes how
              and why we might access, collect, store, use, and/or share (&quot;
              <strong>process</strong>&quot;) your personal information when you use
              our services (&quot;<strong>Services</strong>&quot;), including when you:{" "}
              <strong>Questions or concerns?</strong> Reading this Privacy
              Notice will help you understand your privacy rights and choices.
              We are responsible for making decisions about how your personal
              information is processed. If you do not agree with our policies
              and practices, please do not use our Services. as well as other
              related products and services that refer to these legal terms (the{" "}
              <strong>&quot;Legal Terms&quot;</strong>) (collectively, the{" "}
              <strong>&quot;Services&quot;</strong>).
            </div>
          </section>

          {/* Summary of Keypoints */}
          <section>
            <div className="pl-7 space-y-1">
              <br />
              <br />
              <strong>What personal Information do we process?</strong> When you
              visit, use, or navigate our Services, we may process personal
              information depending on how you interact with us and the
              Services, the choices you make, and the products and features you
              use. Learn more about personal information you disclose to us.
              <br />
              <br />
              <strong>
                Do we process any sensitive personal Information?
              </strong>{" "}
              Some of the information may be considered &quot;special&quot; or &quot;sensitive&quot;
              in certain jurisdictions, for example your racial or ethnic
              origins, sexual orientation, and religious beliefs. We do not
              process sensitive personal information.
              <br />
              <br />
              <strong>
                Do we collect any Information from third parties?
              </strong>{" "}
              We may collect information from public databases, marketing
              partners, social media platforms, and other outside sources. Learn
              more about information collected from other sources.
              <br />
              <br />
              <strong>How do we process your Information?</strong> We process
              your information to provide, improve, and administer our Services,
              communicate with you, for security and fraud prevention, and to
              comply with law. We may also process your information for other
              purposes with your consent. We process your information only when
              we have a valid legal reason to do so. Learn more about how we
              process your information.
              <br />
              <br />
              <strong>
                In what situations and with which parties do we share personal
                information?
              </strong>{" "}
              We may share information in specific situations and with specific
              third parties. Learn more about when and with whom we share your
              personal information.
              <br />
              <br />
              <strong>What are your rights?</strong> Depending on where you are
              located geographically, the applicable privacy law may mean you
              have certain rights regarding your personal information. Learn
              more about your privacy rights.
              <br />
              <br />
              <strong>How do you exercise your rights?</strong> The easiest way
              to exercise your rights is by submitting a data subject access
              request, or by contacting us. We will consider and act upon any
              request in accordance with applicable data protection laws.
              <br />
              <br />
              <i>
                Want to learn more about what we do with any information we
                collect?
              </i>{" "}
              Review the Privacy Notice in full.
            </div>
          </section>

          {/* Table of Contents */}
         <section>
      <h3 className="font-semibold text-lg mb-2">Table of Contents</h3>
      <ol className="list-decimal pl-7 space-y-1">
        <li><a href="#collect" className="underline hover:text-[#ED5E20]">What Information Do We Collect?</a></li>
        <li><a href="#process" className="underline hover:text-[#ED5E20]">How Do We Process Your Information?</a></li>
        <li><a href="#share" className="underline hover:text-[#ED5E20]">When and With Whom Do We Share Your Personal Information?</a></li>
        <li><a href="#cookies" className="underline hover:text-[#ED5E20]">Do We Use Cookies and Other Tracking Technologies?</a></li>
        <li><a href="#logins" className="underline hover:text-[#ED5E20]">How Do We Handle Your Account Logins?</a></li>
        <li><a href="#intl" className="underline hover:text-[#ED5E20]">Is Your Information Transferred Internationally?</a></li>
        <li><a href="#retention" className="underline hover:text-[#ED5E20]">How Long Do We Keep Your Information?</a></li>
        <li><a href="#minors" className="underline hover:text-[#ED5E20]">Do We Collect Information from Minors?</a></li>
        <li><a href="#rights" className="underline hover:text-[#ED5E20]">What Are Your Privacy Rights?</a></li>
        <li><a href="#dnt" className="underline hover:text-[#ED5E20]">Controls for Do-Not-Track Features</a></li>
        <li><a href="#updates" className="underline hover:text-[#ED5E20]">Do We Make Updates to This Notice?</a></li>
        <li><a href="#contact" className="underline hover:text-[#ED5E20]">How Can You Contact Us About This Notice?</a></li>
        <li><a href="#review-update-delete" className="underline hover:text-[#ED5E20]">How Can You Review, Update, or Delete the Data We Collect from You?</a></li>
      </ol>
    </section> 

          {/* What Information Do We Collect? */}
          <section>
            <h3 id="collect" className="font-semibold text-lg mb-2">
              1. What Information Do We Collect?
            </h3>
            <div className="pl-7 space-y-1">
              <strong>Personal information you disclose to us</strong>
              <br />
              <br />
              <i>
                <strong>In Short:</strong> We collect only the information that
                you provide directly and the minimal technical data required for
                system functionality.
              </i>
              <br />
              <br />
              When you participate in UXhibit, we may collect basic demographic
              information (such as your age group and learning background), your
              design submissions (fig files), and your responses to the research
              instrument like User Experience Questionnaire (UEQ) and user
              feedback surveys. This information is collected only for the
              purpose of evaluating the effectiveness of the system and for
              academic research reporting.
              <br />
              <br />
              We do not collect sensitive categories of personal data (such as
              health status, political opinions, religious beliefs, financial
              information, or biometric data).
              <br />
              <br />
              The UXhibit system may also gather minimal technical information,
              such as IP address, device type, operating system, and browser
              type. This is used only to ensure proper system functionality,
              maintain security, and improve usability of the platform. Unlike
              commercial platforms, this technical information will not be used
              for profiling or marketing.
              <br />
              <br />
            </div>
          </section>

          {/* How Do We Process Your Information? */}
          <section>
            <h3 id="process"className="font-semibold text-lg mb-2">
              2. How Do We Process Your Information?
            </h3>
            <div className="pl-7 space-y-1">
              <i>
                <strong>In Short:</strong> Your data is processed only for
                research and educational purposes.
              </i>
              <br />
              <br />
              Participant information is processed for the following:
              <br />
              <br />
              <ol className="list-disc pl-7 space-y-1">
                <li>
                  To provide AI-driven usability feedback on submitted designs.
                </li>
                <li>
                  To generate anonymized reports for defense, panel review, and
                  academic presentations.
                </li>
                <li>Conduct surveys like UEQ to measure system usability.</li>
                <li>
                  Analyze design revisions and learning progress for research
                  findings.
                </li>
                <li>
                  To maintain system security and improve platform performance.
                </li>
              </ol>
              <br />
              We do not process your information for advertising, marketing, or
              commercial purposes. Any use outside of these stated purposes will
              only be conducted with your explicit consent.
              <br />
              <br />
            </div>
          </section>

          {/* When and With Whom Do We Share Your Personal Information? */}
          <section>
            <h3 id="share" className="font-semibold text-lg mb-2">
              3. When and With Whom Do We Share Your Personal Information?
            </h3>
            <div className="pl-7 space-y-1">
              <i>
                <strong>In Short:</strong> Your data will not be shared outside
                the research team and adviser.
              </i>
              <br />
              <br />
              Participant information is processed for the following:
              <br />
              <br />
              <ol className="list-disc pl-7 space-y-1">
                <li>
                  <strong>Research Team:</strong> Your information will only be
                  accessible to the student researchers and their adviser.
                </li>
                <li>
                  <strong>Defense and Academic Review:</strong> Aggregated,
                  anonymized results may be shared with capstone panelists and
                  academic reviewers.
                </li>
                <li>
                  <strong>University Research Purposes:</strong> Data may be
                  included in final reports or published in academic venues, but
                  without any identifying details.
                </li>
                <li>
                  <strong>No Third-Party Sharing:</strong> We do not sell,
                  trade, or transfer personal information to outside companies,
                  affiliates, or partners.
                </li>
              </ol>
              <br />
              We do not process your information for advertising, marketing, or
              commercial purposes. Any use outside of these stated purposes will
              only be conducted with your explicit consent.
              <br />
              <br />
            </div>
          </section>

          {/* Do We Use Cookies and Other Tracking Technologies? */}
          <section>
            <h3 id="cookies"className="font-semibold text-lg mb-2">
              4. Do We Use Cookies and Other Tracking Technologies?
            </h3>
            <div className="pl-7 space-y-1">
              <i>
                <strong>In Short:</strong> We may use cookies and other tracking
                technologies to collect and store your information.
              </i>
              <br />
              <br />
              We may use cookies and similar tracking technologies (like web
              beacons and pixels) to gather information when you interact with
              our Services. Some online tracking technologies help us maintain
              the security of our Services, prevent crashes, fix bugs, save your
              preferences, and assist with basic site functions.
              <br />
              <br />
              We also permit third parties and service providers to use online
              tracking technologies on our Services for analytics and
              advertising, including to help manage and display advertisements,
              tailor advertisements to your interests, or send abandoned
              shopping cart reminders (depending on your communication
              preferences). The third parties and service providers use their
              technology to provide advertising about products and services
              tailored to your interests which may appear either on our Service
              or on other websites.
              <br />
              <br />
              Specific information about how we use such technologies and how
              you can refuse certain cookies is set out in our Cookie Notice.
              <br />
              <br />
            </div>
          </section>

          {/* How Do We Handle Your Account Logins? */}
          <section>
            <h3 id="logins" className="font-semibold text-lg mb-2">
              5. How Do We Handle Your Account Logins?
            </h3>
            <div className="pl-7 space-y-1">
              <i>
                <strong>In Short:</strong> If you choose to register or log in
                to our Services using a Google or Figma account, we may have
                access to certain information about you.
              </i>
              <br />
              <br />
              Our Services allow you to register and log in using your Google or
              Figma account credentials. When you choose to do this, we will
              receive certain profile information from these providers. The
              profile information we receive may vary depending on the provider
              but will often include your name, email address, and profile
              picture, as well as other information you choose to make public on
              such platforms.
              <br />
              <br />
              We will use the information we receive only for the purposes
              described in this Privacy Notice or that are otherwise made clear
              to you on the relevant Services. Please note that we do not
              control, and are not responsible for, the use of your personal
              information by Google or Figma. We recommend that you review their
              privacy notices to understand how they collect, use, and share
              your personal information, and how you can set your privacy
              preferences on their platforms.
              <br />
              <br />
            </div>
          </section>

          {/* Is Your Information Transferred Internationally? */}
          <section>
            <h3 id="intl" className="font-semibold text-lg mb-2">
              6. Is Your Information Transferred Internationally?
            </h3>
            <div className="pl-7 space-y-1">
              <i>
                <strong>In Short:</strong> No, your data will remain in the
                Philippines unless stored securely in encrypted cloud services.
              </i>
              <br />
              <br />
              All information collected through UXhibit will be stored and
              processed within the Philippines. In cases where cloud services
              like Google Drive are used, the data will remain encrypted and
              accessible only to the research team. We do not transfer your data
              to any foreign organizations or third parties.
              <br />
              <br />
            </div>
          </section>

          {/* How Long Do We Keep Your Information? */}
          <section>
            <h3 id="retention" className="font-semibold text-lg mb-2">
              7. How Long Do We Keep Your Information?
            </h3>
            <div className="pl-7 space-y-1">
              <i>
                <strong>In Short:</strong> Only as long as needed to finish the
                study and reporting requirements.
              </i>
              <br />
              <br />
              Participant data will be retained securely for the duration of the
              study and for one (1) year after its completion to comply with
              university reporting and defense requirements. After this period,
              all electronic files will be permanently deleted from storage
              devices and cloud systems, and any physical notes will be
              shredded. This ensures that no personal data will be stored
              indefinitely.
              <br />
              <br />
            </div>
          </section>

          {/* Do We Collect Information from Minors? */}
          <section>
            <h3 id="minors" className="font-semibold text-lg mb-2">
              8. Do We Collect Information from Minors?
            </h3>
            <div className="pl-7 space-y-1">
              <i>
                <strong>In Short:</strong> Yes, but only with proper consent.
              </i>
              <br />
              <br />
              UXhibit’s study population includes learners aged 13-28 (Gen Z).
              For participants aged 13-17, both parental/guardian consent and
              participant assent are required before joining the study. We do
              not knowingly collect information from children under the age of
              13, and any such information provided in error will be promptly
              deleted.
              <br />
              <br />
            </div>
          </section>

          {/* What Are Your Privacy Rights? */}
          <section>
            <h3 id="rights" className="font-semibold text-lg mb-2">
              9. What Are Your Privacy Rights?
            </h3>
            <div className="pl-7 space-y-1">
              <i>
                <strong>In Short:</strong> You may request access, correction,
                or withdrawal of your data.
              </i>
              <br />
              <br />
              Participants have the right to:
              <br />
              <br />
              <ul className="list-disc pl-7 space-y-1">
                <li>Review the data they submitted.</li>
                <li>Request corrections to any inaccurate information.</li>
                <li>
                  Withdraw their data up to two (2) weeks after participation.
                </li>
              </ul>
              <br />
              Withdrawal will not have any penalty or academic consequences.
              However, once data has been anonymized and included in the
              analysis, removal may no longer be possible.
              <br />
              <br />
            </div>
          </section>

          {/* Controls for Do-Not-Track Features */}
          <section>
            <h3 id="dnt" className="font-semibold text-lg mb-2">
              10. Controls for Do-Not-Track Features
            </h3>
            <div className="pl-7 space-y-1">
              <i>
                <strong>In Short:</strong> UXhibit does not use tracking
                technologies.
              </i>
              <br />
              <br />
              UXhibit does not support commercial tracking or advertising
              features such as Do-Not-Track (DNT) signals. Since the platform
              does not use cookies, targeted advertising, or tracking analytics,
              no additional tracking controls are required.
              <br />
              <br />
            </div>
          </section>

          {/* Do We Make Updates to This Notice? */}
          <section>
            <h3 id="updates" className="font-semibold text-lg mb-2">
              11. Do We Make Updates to This Notice?
            </h3>
            <div className="pl-7 space-y-1">
              <i>
                <strong>In Short:</strong> Yes, we may revise this notice if the
                study protocol changes.
              </i>
              <br />
              <br />
              This Privacy Notice may be updated to reflect changes in research
              procedures, ethics requirements, or university guidelines. Any
              updates will include a “Revised” date at the top of the document.
              Significant changes will be communicated to participants via email
              or through announcements during research activities.
              <br />
              <br />
            </div>
          </section>

          {/* How Can You Contact Us About This Notice? */}
          <section>
            <h3 id="contact" className="font-semibold text-lg mb-2">
              12. How Can You Contact Us About This Notice?
            </h3>
            <div className="pl-7 space-y-1">
              If you have questions or concerns about this Privacy Notice or how
              your data is handled, you may contact:
              <br />
              <br />
              <ul className="list-disc pl-7 space-y-1">
                <li>
                  Lead Researcher: Matthew E. Cucio (matthew.cucio@gmail.com)
                </li>
                <li>
                  Co-Researchers: Kail Luisse D. Balbalec, Vanness M. Lao,
                  Willie M. Bonavente
                </li>
                <li>
                  Institution: Polytechnic University of the Philippines -
                  College of Computer and Information Science
                </li>
                <li>Mobile Number: 09212750244</li>
              </ul>
              <br />
            </div>
          </section>

          {/* How Can You Review, Update, or Delete the Data We Collect from You? */}
          <section>
            <h3 id="review-update-delete" className="font-semibold text-lg mb-2">
              13. How Can You Review, Update, or Delete the Data We Collect from
              You?
            </h3>
            <div className="pl-7 space-y-1">
              Participants can request to review, update, or delete their
              submitted data by directly contacting the research team. Data
              withdrawal requests are honored within two weeks of participation.
              After this period, anonymized data may already be integrated into
              reports and cannot be removed.
              <br />
              <br />
            </div>
          </section>
        </div>

        <div className="flex gap-5 mt-6 h-12 w-full">
          {/* Decline Button */}
          <Button
            variant="secondary"
            onClick={() => {
              localStorage.removeItem("termsAccepted");
              localStorage.removeItem("registrationDraft");
              setAccepted(false);
              router.push(`${process.env.NEXT_PUBLIC_APP_URL}/auth/signup`);
            }}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl text-sm font-medium
                      border border-neutral-300/70 dark:border-neutral-600/60 cursor-pointer
                      bg-white/60 dark:bg-neutral-800/50 h-full
                      text-neutral-700 dark:text-neutral-200
                      shadow-sm backdrop-blur
                      hover:bg-white/80 dark:hover:bg-neutral-800/70
                      hover:border-neutral-400 dark:hover:border-neutral-500
                      transition-colors
                      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ED5E20]/60
                      focus:ring-offset-white dark:focus:ring-offset-[#1A1A1A]"
          >
            Decline
          </Button>

          {/* Accept Button */}
          <Button
            type="submit"
            onClick={handleAccept}
            disabled={!canAccept || isProcessing}
            className="group relative flex-1 inline-flex items-center justify-center
                      rounded-xl text-sm text-white font-semibold tracking-wide
                      transition-all duration-300 h-full overflow-hidden
                      focus:outline-none focus-visible:ring-4 focus-visible:ring-[#ED5E20]/40 cursor-pointer"
          >
            <span
              aria-hidden
              className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#ED5E20] via-[#f97316] to-[#f59e0b]"
            />
            <span
              aria-hidden
              className="absolute inset-[2px] rounded-[10px] bg-[linear-gradient(145deg,rgba(255,255,255,0.28),rgba(255,255,255,0.07))] backdrop-blur-[2px]"
            />
            <span
              aria-hidden
              className="absolute -left-1 -right-1 top-0 h-full overflow-hidden rounded-xl"
            >
              <span className="absolute inset-y-0 -left-full w-1/2 bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-0 transition-all duration-700 group-hover:translate-x-[220%] group-hover:opacity-70" />
            </span>
            <span
              aria-hidden
              className="absolute inset-0 rounded-xl ring-1 ring-white/30 group-hover:ring-white/50"
            />
              <span className="relative z-10">
    {!canAccept ? "Scroll to enable" : isProcessing ? "Processing..." : "Accept"}
  </span>
          </Button>
        </div>
      </div>
    </div>
  );
}
