import { Globe, Book, Eye, Lightbulb, Image, Keyboard } from "lucide-react";

export default function WcagContent() {
  return (
    <div className="mt-5 space-y-10">
      {/* Header */}
      <div className="space-y-2 w-full">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white w-full">
          Introduction to WCAG 2.1 Principles
        </h1>
        <p className="text-gray-600 dark:text-gray-300 w-full">
          The Web Content Accessibility Guidelines (WCAG) 2.1 provide
          international standards for making web content accessible to people
          with disabilities. These guidelines ensure that websites,
          applications, and digital content are usable by as many people as
          possible, regardless of ability, device, or context. WCAG 2.1 is built
          around four key principles, often remembered with the acronym{" "}
          <strong>POUR</strong>: Perceivable, Operable, Understandable, and
          Robust. If any one of these principles is not met, people with
          disabilities will likely face barriers when using the content.
        </p>
      </div>

      {/* What is WCAG Card */}
      <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-neutral-700 space-y-4">
        <div className="flex items-center space-x-3">
          <Globe className="w-6 h-6 text-[#ED5E20]" />
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            What is WCAG 2.1?
          </h2>
        </div>
        <p className="text-gray-700 dark:text-gray-300">
          The <strong>Web Content Accessibility Guidelines (WCAG) 2.1</strong>{" "}
          provide international standards for making web content accessible to
          people with disabilities. These guidelines ensure that websites,
          applications, and digital content are usable by as many people as
          possible, regardless of ability, device, or context.
          <br />
          <br />
          WCAG 2.1 is built around <strong>four key principles</strong>. These
          principles form the foundation of accessibility and are often
          remembered with the acronym{" "}
          <strong>
            POUR: Perceivable, Operable, Understandable, and Robust
          </strong>
          . If any one of these principles is not met, people with disabilities
          will likely face barriers when using the content.
        </p>
      </div>

      {/* POUR Principles Overview Card */}
      <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-neutral-700 space-y-4">
        <div className="flex items-center space-x-3">
          <Book className="w-6 h-6 text-[#ED5E20]" />
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            The Four Principles of WCAG 2.1
          </h2>
        </div>
        <p className="text-gray-700 dark:text-gray-300">
          These four principles form the foundation of accessibility. Each
          principle ensures digital content can be used effectively by everyone.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              title: "Perceivable",
              desc: "Information and user interface components must be presented in ways that users can recognize, regardless of their abilities. This means content should not rely on only one sense (like sight or hearing). Example: Providing text alternatives for images, captions for videos, and ensuring sufficient color contrast.",
              icon: (
                <Eye className="w-16 h-16 md:w-20 md:h-20 text-[#ED5E20]" />
              ),
            },
            {
              title: "Operable",
              desc: "Users must be able to interact with and use the interface. This includes navigation, buttons, controls, and input methods. Example: Making sure a website is keyboard-accessible, avoiding flashing content that could trigger seizures, and giving users enough time to complete tasks.",
              icon: (
                <Keyboard className="w-16 h-16 md:w-20 md:h-20 text-[#ED5E20]" />
              ),
            },
            {
              title: "Understandable",
              desc: "Content and operation must be clear and predictable. Users should be able to comprehend the information and know how to interact with the interface without confusion. Example: Using simple language, consistent navigation, clear instructions, and helpful error messages.",
              icon: (
                <Book className="w-16 h-16 md:w-20 md:h-20 text-[#ED5E20]" />
              ),
            },
            {
              title: "Robust",
              desc: "Content should be built to work across different technologies, including current and future assistive tools. Clean, well-structured code ensures compatibility with screen readers and other devices. Example: Using valid HTML, labeling elements properly, and ensuring status messages are announced to assistive technologies.",
              icon: (
                <Lightbulb className="w-16 h-16 md:w-20 md:h-20 text-[#ED5E20]" />
              ),
            },
          ].map((principle) => (
            <div
              key={principle.title}
              className="flex flex-col items-center sm:flex-row sm:items-center sm:space-x-5 p-5 bg-white dark:bg-neutral-700 rounded-lg shadow-sm hover:shadow-md transition text-center sm:text-left"
            >
              <div className="p-3">{principle.icon}</div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
                  {principle.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-justify">
                  {principle.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Visual Overview */}
      <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-neutral-700 space-y-4">
        <div className="flex items-center space-x-3">
          <Image className="w-6 h-6 text-[#ED5E20]" />
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            Visual Overview
          </h2>
        </div>
        <p className="text-gray-700 dark:text-gray-300 leading-7">
          The POUR principles interact to make websites accessible. Perceivable
          ensures information is available to the senses, Operable focuses on
          interaction, Understandable guarantees clarity, and Robust ensures
          compatibility across technologies. Together, they form a strong
          accessibility foundation.
        </p>
        <img
          src="https://www.webyes.com/wp-content/uploads/2024/11/wcag-pour-accessibility-1-1024x576.jpg"
          alt="WCAG POUR Principles Diagram"
          className="w-full rounded-lg shadow-sm"
        />
      </div>

      {/* Why These Principles Matter */}
      <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-neutral-700 space-y-4">
        <div className="flex items-center space-x-3">
          <Lightbulb className="w-6 h-6 text-[#ED5E20]" />
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            Why These Principles Matter
          </h2>
        </div>
        <p className="text-gray-700 dark:text-gray-300">
          Together, these four principles ensure that digital content is
          accessible, inclusive, and future-proof. They help developers and
          designers create experiences that serve everyone—whether a user has a
          visual, auditory, cognitive, or motor disability, or is simply
          accessing content in a different context (like using a mobile phone in
          bright sunlight).
        </p>
        <br />
        <br />
        When applying WCAG 2.1, always remember the foundation:
        <br />
        <br />
        <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-1">
          <li>
            Can users <strong>perceive</strong> the content?
          </li>
          <li>
            Can they <strong>operate</strong> it?
          </li>
          <li>
            Do they <strong>understand</strong> it?
          </li>
          <li>
            Is it <strong>robust</strong> enough to work with various tools and
            technologies?
          </li>
        </ul>
        <p className="text-gray-700 dark:text-gray-300">
          If the answer is “yes” to all four, you’re on the right track to
          accessibility.
        </p>
      </div>

      {/* Lesson Footer */}
      <div className="text-center space-y-2">
        <p className="text-gray-600 dark:text-gray-300">
          Congrats! You now understand the POUR principles. Apply them to make
          your web projects accessible to everyone.
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Learn more from the official{" "}
          <a
            href="https://www.w3.org/WAI/WCAG21/quickref/"
            target="_blank"
            className="hover:underline text-orange-300 hover:text-[#ED5E20]"
          >
            WCAG 2.1 Quick Reference
          </a>
          .
        </p>
      </div>
    </div>
  );
}
