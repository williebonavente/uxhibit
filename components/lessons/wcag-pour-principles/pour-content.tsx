import { Book, Eye, Keyboard, FileText, Lightbulb } from "lucide-react";

export default function WcagPourContent() {
  return (
    <div className="mt-5 space-y-5">
      
      {/* Header */}
      <div className="space-y-2 w-full">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white w-full">
          WCAG 2.1 Accessibility: Learning POUR Principles
        </h1>
        <p className="text-start text-gray-600 dark:text-gray-300 w-full">
          Welcome to your interactive lesson! We'll explore the four principles that guide web accessibility: Perceivable, Operable, Understandable, and Robust. Think of me as your virtual instructor walking you through each concept.
        </p>
      </div>

      {/* Principles Overview Card */}
      <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-neutral-700">
        <h2 className="text-2xl font-semibold mb-4 text-[#ED5E20]">POUR Principles Overview</h2>
        <p className="mb-4">
          Let's break down POUR. Each principle ensures your website is usable by all people, including those with disabilities. 
          We'll cover what it means, why it matters, and practical ways to implement it.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 justify-center">
          {[
            { title: "Perceivable", desc: "Make content detectable by sight, sound, or touch.", icon: <Eye className="w-10 h-10 text-[#ED5E20]" /> },
            { title: "Operable", desc: "Ensure users can navigate and interact with the interface using various input methods.", icon: <Keyboard className="w-10 h-10 text-[#ED5E20]" /> },
            { title: "Understandable", desc: "Make content clear, predictable, and easy to follow.", icon: <FileText className="w-10 h-10 text-[#ED5E20]" /> },
            { title: "Robust", desc: "Ensure compatibility across browsers, devices, and assistive technologies.", icon: <Lightbulb className="w-10 h-10 text-[#ED5E20]" /> },
          ].map((principle) => (
            <div key={principle.title} className="flex items-center space-x-5 p-5 bg-gray-50 dark:bg-neutral-700 rounded-lg shadow-sm hover:shadow-md transition">
              {principle.icon}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{principle.title}</h3>
                <p className="text-gray-600 dark:text-gray-300">{principle.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Lessons */}
      {[
        {
          title: "Perceivable",
          icon: <Eye className="w-6 h-6 text-[#ED5E20]" />,
          content: (
            <div className="leading-7">
              The Perceivable principle ensures that all users can receive and process the content on your website or application, no matter their abilities or the devices they use. This means information should be presented in ways that can be detected through sight, sound, or touch. For example, images should always have descriptive alt text so that screen readers can convey the visual information to users who are blind or have low vision. Multimedia content like videos or audio clips should include captions and transcripts, benefiting not only those who are deaf or hard of hearing but also users in sound-sensitive environments or those with temporary hearing issues. It's also important to make sure that text and background colors have sufficient contrast, making it easier for people with visual impairments, including color blindness, to read content. Semantic HTML should be used wherever possible so that assistive technologies can correctly interpret the structure and meaning of the content. Designers should avoid relying solely on color to communicate meaning; for instance, using red for errors or green for success without labels or icons can exclude users who cannot distinguish colors. By thoughtfully applying these techniques, content becomes perceivable to a broader audience, establishing a foundation for accessibility and inclusive user experience.
              <br /><br />
              <p className="text-lg font-semibold">Key examples include:</p>
              <ul className="list-disc pl-5 mt-2">
                <li>Alt text for all meaningful images (WCAG 1.1.1)</li>
                <li>Captions and transcripts for audio/video content (WCAG 1.2.2)</li>
                <li>Sufficient color contrast and resizable text (WCAG 1.4.3)</li>
                <li>Use of semantic HTML and proper heading structures</li>
                <li>Icons or labels to reinforce meaning instead of color alone</li>
              </ul>
            </div>
          ),
          img: "https://miro.medium.com/v2/resize:fit:720/format:webp/1*_HXLnIM_2VzbaYxZs3a0qw.png",
        },
        {
          title: "Operable",
          icon: <Keyboard className="w-6 h-6 text-[#ED5E20]" />,
          content: (
            <div className="leading-7">
              The Operable principle is about making sure users can interact with your content in multiple ways, regardless of the device or input method they are using. This includes keyboard navigation, voice commands, and other assistive technologies. Websites and apps should avoid designing interactions that rely solely on complex gestures, fast reactions, or mouse-only actions. Users should be able to navigate through the site logically and predictably, with visible focus indicators showing which element is active. Time limits for tasks should be adjustable or extendable, allowing users with slower interaction speeds to complete actions comfortably. Content that flashes or blinks rapidly should be avoided because it can trigger seizures or cause discomfort. By designing interfaces that are operable, you make your site usable for people with motor impairments, cognitive challenges, or temporary disabilities.
              <br /><br />
              <p className="text-lg font-semibold">Key examples include:</p>
              <ul className="list-disc pl-5 mt-2">
                <li>Keyboard accessibility for all functionality (WCAG 2.1.1)</li>
                <li>Avoid flashing or blinking content (WCAG 2.3.1)</li>
                <li>Logical tab order and clear focus indicators (WCAG 2.4.3, 2.4.7)</li>
                <li>Adjustable time limits for forms or quizzes (WCAG 2.2.1)</li>
                <li>Design interactions that work for assistive devices and users with motor limitations</li>
              </ul>
            </div>
          ),
          img: "https://miro.medium.com/v2/1*ZaUc9ZP09F9so9O9TFQG_w.png",
        },
        {
          title: "Understandable",
          icon: <FileText className="w-6 h-6 text-[#ED5E20]" />,
          content: (
            <div className="leading-7">
              The Understandable principle focuses on clarity and predictability, ensuring that users can easily comprehend how to use your website or app. This includes using simple, plain language for instructions, labels, and content, so that users of all literacy levels and cognitive abilities can understand the information. Navigation should be consistent across pages, and error messages should clearly explain what went wrong and how to fix it. Users should not encounter unexpected changes in context, such as sudden page redirects or interface changes that might confuse them. Ensuring content is understandable reduces errors, frustration, and the cognitive load required to complete tasks, making the site more inclusive and approachable for everyone.
              <br /><br />
              <p className="text-lg font-semibold">Key examples include:</p>
              <ul className="list-disc pl-5 mt-2">
                <li>Plain language usage (WCAG 3.1.5)</li>
                <li>Consistent navigation and page layouts (WCAG 3.2.3)</li>
                <li>Clear labels, instructions, and error messages (WCAG 3.3.1, 3.3.3)</li>
                <li>Avoid sudden changes in content or context (WCAG 3.2.1)</li>
                <li>Support for users with cognitive or learning difficulties</li>
              </ul>
            </div>
          ),
          img: "https://appinventiv.com/wp-content/uploads/2019/02/Tips-to-Improve-UI-UX-Design.png",
        },
        {
          title: "Robust",
          icon: <Lightbulb className="w-6 h-6 text-[#ED5E20]" />,
          content: (
            <div className="leading-7">
              The Robust principle ensures that content can be reliably interpreted by a wide variety of user agents, including current and future technologies. This means using valid HTML and semantic markup, employing ARIA roles when needed, and thoroughly testing across different browsers and assistive tools. By following robust practices, developers can make sure that content remains accessible even as technology changes, reducing the risk that a site becomes outdated or unusable for certain users. Designers should avoid creating interactions that are device-specific or overly complex, as these can prevent certain users from accessing content. Building robust content is a forward-thinking approach to accessibility, ensuring inclusivity and longevity.
              <br /><br />
              <p className="text-lg font-semibold">Key examples include:</p>
              <ul className="list-disc pl-5 mt-2">
                <li>Use valid HTML and semantic markup (WCAG 4.1.1)</li>
                <li>Apply ARIA roles and landmarks for dynamic content (WCAG 4.1.2)</li>
                <li>Test content with screen readers and across multiple browsers</li>
                <li>Avoid gestures or interactions that only work on specific devices</li>
                <li>Ensure the site is future-proof for evolving technology</li>
              </ul>
            </div>
          ),
          img: "https://miro.medium.com/v2/resize:fit:720/format:webp/1*QLaQWdVMux9F2qVWLtjOgg.jpeg",
        },
      ].map((section) => (
        <div key={section.title} className="bg-white dark:bg-neutral-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-neutral-700 space-y-4">
          <div className="flex items-center space-x-3">
            {section.icon}
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">{section.title}</h2>
          </div>
          {section.content}
          <img src={section.img} alt={`${section.title} example`} className="w-full rounded-lg shadow-md" />
          <div className="bg-[#ED5E20]/25 dark:bg-[#ED5E20]/50 p-3 rounded-lg border-l-4 border-[#ED5E20] dark:border-[#ED5E20]">
            <strong>Tip:</strong> Think about users with limitations and ask yourself, "Can they access this easily?"
          </div>
        </div>
      ))}

      {/* Real-World Examples Section */}
      <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-neutral-700 space-y-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Real-World Examples</h2>
        <ul className="list-disc pl-5 text-gray-700 dark:text-gray-300 space-y-2">
          <li><strong>Perceivable:</strong> A news site uses high-contrast text and captions for all videos.</li>
          <li><strong>Operable:</strong> An e-commerce site allows full checkout via keyboard navigation.</li>
          <li><strong>Understandable:</strong> A government portal uses simple language and consistent layouts.</li>
          <li><strong>Robust:</strong> A blog validates HTML and uses ARIA roles for dynamic content.</li>
        </ul>
      </div>

      {/* Lesson Footer */}
      <div className="text-center space-y-2">
        <p className="text-gray-600 dark:text-gray-300">
          Congrats! You've gone through the POUR principles. Apply these lessons in your next web project to make it accessible to everyone.
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Learn more from the official <a href="https://www.w3.org/WAI/WCAG21/quickref/" target="_blank" className="hover:underline text-orange-300 hover:text-[#ED5E20]">WCAG 2.1 Quick Reference</a>.
        </p>
      </div>
    </div>
  );
}
