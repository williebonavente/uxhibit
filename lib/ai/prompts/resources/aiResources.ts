
export const recommendedResources = [
    {
        "title": "UX Playbook: UI Fundamentals Best Practices for UX Designers",
        "url": "https://uxplaybook.org/articles/ui-fundamentals-best-practices-for-ux-designers",
        "description": "Covers foundational UI design principles, visual consistency, and UX coherence across products."
    },
    {
        "title": "Agami Technologies: 10 Best Practices for Effective UI/UX Design",
        "url": "https://medium.com/@agamitechnologies2011/10-best-practices-for-effective-ui-ux-design-fac8e30cc9e4",
        "description": "A concise list of proven design strategies that enhance usability and user engagement."
    },
    {
        "title": "UIDesignz: 8 Best Practices for Effective UI/UX Design",
        "url": "https://medium.com/@uidesign0005/8-best-practices-for-effective-ui-ux-design-4611c8cfc4d3",
        "description": "Practical design principles for building accessible, modern, and responsive interfaces."
    },
    {
        "title": "Nearshore.io: 10 Timeless UI/UX Practices",
        "url": "https://www.nearshore.io/post/10-timeless-ui-ux-practices",
        "description": "Explores evergreen UX strategies that remain relevant across evolving design trends."
    },
    {
        "title": "Guvi: UI/UX Best Practices for Designers",
        "url": "https://www.guvi.in/blog/ui-ux-best-practices-for-designers",
        "description": "Breaks down key UX design guidelines for building user-centric digital experiences."
    },
    {
        "title": "UXPeak: Best Free UX/UI Design Resources",
        "url": "https://www.uxpeak.com/resources",
        "description": "Curated free UX/UI resources, design systems, and inspiration for designers."
    },
    {
        "title": "UiPedia: Top Design Tools & Resource Hub",
        "url": "https://www.uipedia.design/resources",
        "description": "Comprehensive directory of design tools, systems, and assets for professional UI/UX work."
    },
    {
        "title": "WebAIM: Contrast and Color Accessibility",
        "url": "https://webaim.org/articles/contrast/",
        "description": "Guidelines on ensuring sufficient color contrast and visual accessibility in design."
    },
    {
        "title": "Material Design 3: Spacing & Layout Guidelines",
        "url": "https://m3.material.io/foundations/layout/understanding-layout/overview",
        "description": "Google's official guidance on layout, spacing, and visual structure for modern interfaces."
    },
    {
        "title": "Jakob Nielsen's 10 Usability Heuristics",
        "url": "https://www.nngroup.com/articles/ten-usability-heuristics/",
        "description": "The classic usability heuristics that serve as the foundation of all good UI/UX design."
    },
    {
        "title": "WCAG 2.1 Quick Reference",
        "url": "https://www.w3.org/WAI/WCAG21/quickref/",
        "description": "Official accessibility guidelines reference for creating inclusive digital content."
    },
    {
        "title": "Google Fonts Knowledge: Typography Essentials",
        "url": "https://fonts.google.com/knowledge",
        "description": "Educational resource explaining typography principles and font pairing techniques."
    },
    {
        "title": "Figma: Designing for Touch Interfaces",
        "url": "https://help.figma.com/hc/en-us/articles/360040451373-Designing-for-touch",
        "description": "How to design optimal tap targets and interactive touch-friendly interfaces."
    },
    {
        "title": "MDN Web Docs: Error Prevention & Live Region Patterns",
        "url": "https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions",
        "description": "ARIA and accessibility patterns for handling live updates and error prevention in UIs."
    }
];

export const wcagHeuristicMapping = {
    title: "WCAG 2.1 Quick Reference",
    url: "https://www.w3.org/WAI/WCAG21/quickref/",
    description: "Official accessibility guidelines reference for creating inclusive digital content.",
    related_to: "Jakob Nielsen's 10 Usability Heuristics",
    mappings: [
        {
            heuristic: "1. Visibility of System Status",
            wcag_section: "2.2.1 Timing Adjustable, 4.1.3 Status Messages",
            url: "https://www.w3.org/WAI/WCAG21/quickref/#status-messages",
            relation: "Both emphasize providing timely and perceivable feedback to users about system status changes."
        },
        {
            heuristic: "2. Match Between System and the Real World",
            wcag_section: "3.1.5 Reading Level, 3.1.6 Pronunciation",
            url: "https://www.w3.org/WAI/WCAG21/quickref/#reading-level",
            relation: "Ensures content uses familiar concepts and terminology consistent with users' expectations and context."
        },
        {
            heuristic: "3. User Control and Freedom",
            wcag_section: "2.2.2 Pause, Stop, Hide",
            url: "https://www.w3.org/WAI/WCAG21/quickref/#pause-stop-hide",
            relation: "Users can control animations or auto-updating content, aligning with the principle of giving users freedom and control."
        },
        {
            heuristic: "4. Consistency and Standards",
            wcag_section: "3.2.3 Consistent Navigation, 3.2.4 Consistent Identification",
            url: "https://www.w3.org/WAI/WCAG21/quickref/#consistent-navigation",
            relation: "Promotes consistent layout, terminology, and navigation patterns throughout a site."
        },
        {
            heuristic: "5. Error Prevention",
            wcag_section: "3.3.6 Error Prevention (All)",
            url: "https://www.w3.org/WAI/WCAG21/quickref/#error-prevention-all",
            relation: "Ensures systems help users avoid errors through validation, confirmation steps, or clear input requirements."
        },
        {
            heuristic: "6. Recognition Rather Than Recall",
            wcag_section: "2.4.6 Headings and Labels",
            url: "https://www.w3.org/WAI/WCAG21/quickref/#headings-and-labels",
            relation: "Proper headings and labels help users recognize where they are and what actions are possible, minimizing memory load."
        },
        {
            heuristic: "7. Flexibility and Efficiency of Use",
            wcag_section: "2.1.1 Keyboard, 2.5.1 Pointer Gestures",
            url: "https://www.w3.org/WAI/WCAG21/quickref/#keyboard",
            relation: "Supports multiple interaction methods—keyboard, pointer, or touch—to accommodate different skill levels and preferences."
        },
        {
            heuristic: "8. Aesthetic and Minimalist Design",
            wcag_section: "1.4.3 Contrast (Minimum)",
            url: "https://www.w3.org/WAI/WCAG21/quickref/#contrast-minimum",
            relation: "Encourages clarity and simplicity by ensuring only necessary content is shown with sufficient contrast."
        },
        {
            heuristic: "9. Help Users Recognize, Diagnose, and Recover from Errors",
            wcag_section: "3.3.1 Error Identification, 3.3.3 Error Suggestion",
            url: "https://www.w3.org/WAI/WCAG21/quickref/#error-identification",
            relation: "Requires systems to clearly identify input errors and offer helpful recovery suggestions."
        },
        {
            heuristic: "10. Help and Documentation",
            wcag_section: "3.3.5 Help",
            url: "https://www.w3.org/WAI/WCAG21/quickref/#help",
            relation: "Ensures help is available contextually and accessible, aligning with Nielsen's emphasis on providing necessary documentation."
        }
    ]
};

export const nielsenHeuristicLinks = [
    {
        title: "10 Usability Heuristics for User Interface Design — Nielsen Norman Group",
        url: "https://www.nngroup.com/articles/ten-usability-heuristics/"
    },
    {
        title: "Heuristic Evaluations: How to Conduct — Nielsen Norman Group",
        url: "https://www.nngroup.com/articles/how-to-conduct-a-heuristic-evaluation/"
    },
    {
        title: "Usability Heuristic 1: Visibility of System Status (Video) — NN/g",
        url: "https://www.nngroup.com/videos/usability-heuristic-system-status/"
    },
    {
        title: "Usability Heuristic 10: Help and Documentation (Video) — NN/g",
        url: "https://www.nngroup.com/videos/help-and-documentation/"
    },
    {
        title: "Nielsen's 10 Usability Heuristics — Heurio",
        url: "https://www.heurio.co/nielsens-10-usability-heuristics"
    },
    {
        title: "10 Usability Heuristics for UX Design — UXHints",
        url: "https://uxhints.com/usability/10-usability-heuristics/"
    },
    {
        title: "A Guide to Heuristic Website Reviews — Smashing Magazine",
        url: "https://www.smashingmagazine.com/2011/12/a-guide-to-heuristic-website-reviews/"
    },
    {
        title: "10 Usability Heuristics Examples — Principles.design",
        url: "https://principles.design/examples/10-usability-heuristics-for-user-interface-design"
    },
    {
        title: "Nielsen's Heuristics - The Decision Lab (overview)",
        url: "https://thedecisionlab.com/reference-guide/design/nielsens-heuristics"
    },
    {
        title: "Jakob's Ten Usability Heuristics (PDF summary) — NN/g",
        url: "https://media.nngroup.com/media/articles/attachments/Heuristic_Summary1-compressed.pdf"
    }
];

export const uxLaws = [
    {
        law: "Fitts's Law",
        principle: "The time to acquire a target is a function of the distance and size of the target.",
        when_to_recommend: "When interactive elements are too small, far apart, or hard to reach.",
        url: "https://lawsofux.com/fittss-law/"
    },
    {
        law: "Hick's Law",
        principle: "The time it takes to make a decision increases with the number and complexity of choices.",
        when_to_recommend: "When users face cognitive overload due to excessive options or unclear hierarchies.",
        url: "https://lawsofux.com/hicks-law/"
    },
    {
        law: "Law of Proximity",
        principle: "Objects placed near each other are perceived as related.",
        when_to_recommend: "When grouping of UI elements is inconsistent or visually scattered.",
        url: "https://lawsofux.com/law-of-proximity/"
    },
    {
        law: "Law of Similarity",
        principle: "Elements that look alike are perceived as part of the same group or function.",
        when_to_recommend: "When inconsistent styling or iconography confuses user perception.",
        url: "https://lawsofux.com/law-of-similarity/"
    },
    {
        law: "Miller's Law",
        principle: "The average person can only keep 7±2 items in their working memory.",
        when_to_recommend: "When information overload or multi-step workflows burden users.",
        url: "https://lawsofux.com/millers-law/"
    },
    {
        law: "Jakob's Law",
        principle: "Users spend most of their time on other sites, so they expect yours to work the same way.",
        when_to_recommend: "When learners over-innovate UI patterns or break expected conventions.",
        url: "https://lawsofux.com/jakobs-law/"
    },
    {
        law: "Tesler's Law",
        principle: "Every system has inherent complexity that must be managed by either the system or the user.",
        when_to_recommend: "When complexity is offloaded to the user instead of handled by the system.",
        url: "https://lawsofux.com/teslers-law/"
    },
    {
        law: "Pareto Principle",
        principle: "80% of effects come from 20% of causes.",
        when_to_recommend: "When too many features exist without significant value or usage.",
        url: "https://lawsofux.com/pareto-principle/"
    },
    {
        law: "Aesthetic-Usability Effect",
        principle: "Users perceive aesthetically pleasing designs as easier to use.",
        when_to_recommend: "When designs functionally work but lack visual appeal and clarity.",
        url: "https://lawsofux.com/aesthetic-usability-effect/"
    },
    {
        law: "Postel's Law",
        principle: "Be liberal in what you accept and conservative in what you send.",
        when_to_recommend: "When forms or inputs reject minor errors or lack forgiving feedback.",
        url: "https://lawsofux.com/postels-law/"
    }
];