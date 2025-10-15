import { Generation, Occupation } from "@/lib/scoringMethod/evaluationWeights";

interface BusinessGoalPrompt {
    generation: Generation;
    occupation: Occupation;
    engagementGoals: string[];
    errorReductionGoals: string[];
    growthGoals: string[];
    dataDrivenGoals: string[];
    toneGuidance: string;
}

export const businessGoalsMap: Record<Generation, Record<Occupation, BusinessGoalPrompt>> = {
    "Gen Z": {
        Student: {
            generation: "Gen Z",
            occupation: "Student",
            engagementGoals: [
                "Streamline learning interfaces for mobile devices",
                "Use playful microinteractions to maintain focus",
                "Make navigation intuitive with progressive disclosure"
            ],
            errorReductionGoals: [
                "Implement clear inline feedback on learning tasks",
                "Offer contextual help popups and voice tips",
                "Ensure accessibility for assistive technologies"
            ],
            growthGoals: [
                "Boost platform retention through gamified UX",
                "Support inclusive learning accessibility",
                "Enable easy account progression across devices"
            ],
            dataDrivenGoals: [
                "Track learning session lengths and completion rates",
                "Analyze engagement patterns by device",
                "Capture sentiment feedback through quick prompts"
            ],
            toneGuidance: "Use clear, energetic, and supportive language."
        },
        Freelancer: {
            generation: "Gen Z",
            occupation: "Freelancer",
            engagementGoals: [
                "Design flexible dashboards for multitasking",
                "Highlight productivity shortcuts and quick actions",
                "Enable seamless transitions between tools"
            ],
            errorReductionGoals: [
                "Provide smart validation in forms and contracts",
                "Add guided tooltips for critical workflows",
                "Ensure accessibility for remote work setups"
            ],
            growthGoals: [
                "Increase client retention by improving freelancer experience",
                "Support flexible schedules and remote collaboration",
                "Enhance perceived reliability of the platform"
            ],
            dataDrivenGoals: [
                "Capture task completion time and frequency",
                "Analyze tool usage heatmaps",
                "Collect feedback on pain points in real time"
            ],
            toneGuidance: "Use concise, productive, and empowering language."
        },
        Designer: {
            generation: "Gen Z",
            occupation: "Designer",
            engagementGoals: [
                "Offer a minimal UI with room for creative exploration",
                "Use real-time previews to enhance visual feedback",
                "Support touch and pen inputs for accessibility"
            ],
            errorReductionGoals: [
                "Implement auto-save and rollback features",
                "Show clear error states for design conflicts",
                "Offer accessible design guidelines"
            ],
            growthGoals: [
                "Encourage collaborative design workflows",
                "Foster brand loyalty through accessible creativity",
                "Scale with community-driven features"
            ],
            dataDrivenGoals: [
                "Capture creative flow patterns and interactions",
                "Analyze feature usage",
                "Collect accessibility compliance rates"
            ],
            toneGuidance: "Use creative and empowering language."
        },
        Developer: {
            generation: "Gen Z",
            occupation: "Developer",
            engagementGoals: [
                "Offer fast and predictable developer flows",
                "Make navigation keyboard-friendly",
                "Provide accessible CLI and GUI modes"
            ],
            errorReductionGoals: [
                "Integrate robust linting and validation",
                "Display precise and contextual error messages",
                "Support screen readers in IDE integrations"
            ],
            growthGoals: [
                "Boost retention through frictionless development",
                "Support modern dev stacks and accessibility APIs",
                "Scale through community-driven plugin ecosystems"
            ],
            dataDrivenGoals: [
                "Log build and commit activity trends",
                "Analyze API usage",
                "Capture developer pain points through inline surveys"
            ],
            toneGuidance: "Use technical and direct language."
        },
        Educator: {
            generation: "Gen Z",
            occupation: "Educator",
            engagementGoals: [
                "Simplify access to course materials",
                "Offer real-time feedback on student engagement",
                "Use clear navigation with minimal cognitive load"
            ],
            errorReductionGoals: [
                "Provide accessible documentation for instruction",
                "Enable clear error recovery paths",
                "Support multiple assistive tools"
            ],
            growthGoals: [
                "Improve teaching retention through easy-to-use tools",
                "Increase class participation rates",
                "Support hybrid learning accessibility"
            ],
            dataDrivenGoals: [
                "Capture teaching activity analytics",
                "Analyze engagement per session",
                "Collect feedback for curriculum improvement"
            ],
            toneGuidance: "Use clear and instructive language."
        }
    },
    "Millennial": {
        Student: {
            generation: "Millennial",
            occupation: "Student",
            engagementGoals: [
                "Optimize navigation across devices",
                "Ensure fast load times",
                "Offer personalized learning dashboards"
            ],
            errorReductionGoals: [
                "Provide robust validation on forms",
                "Enable clear retry and undo flows",
                "Support accessibility features"
            ],
            growthGoals: [
                "Increase course completion rates",
                "Promote long-term platform trust",
                "Support flexible study schedules"
            ],
            dataDrivenGoals: [
                "Track engagement duration and task completion",
                "Analyze cross-device behavior",
                "Collect structured feedback"
            ],
            toneGuidance: "Use professional and structured language."
        },
        Freelancer: {
            generation: "Millennial",
            occupation: "Freelancer",
            engagementGoals: [
                "Enable efficient project management across devices",
                "Highlight networking and collaboration features",
                "Support flexible workspaces and schedules"
            ],
            errorReductionGoals: [
                "Implement clear contract and payment validation",
                "Provide actionable error messages",
                "Ensure accessibility for remote work tools"
            ],
            growthGoals: [
                "Increase client acquisition and retention",
                "Promote platform reliability and trust",
                "Support scalable freelance opportunities"
            ],
            dataDrivenGoals: [
                "Track project completion rates and feedback",
                "Analyze collaboration patterns",
                "Monitor payment and contract success metrics"
            ],
            toneGuidance: "Use confident and practical language."
        },
        Designer: {
            generation: "Millennial",
            occupation: "Designer",
            engagementGoals: [
                "Provide customizable design environments",
                "Support multi-device creative workflows",
                "Enable real-time collaboration and feedback"
            ],
            errorReductionGoals: [
                "Offer undo/redo and version control",
                "Display clear error states for design conflicts",
                "Ensure accessibility in design previews"
            ],
            growthGoals: [
                "Foster community-driven design sharing",
                "Promote brand loyalty through creative empowerment",
                "Scale with advanced design tools"
            ],
            dataDrivenGoals: [
                "Analyze feature usage and creative trends",
                "Track collaborative project metrics",
                "Collect accessibility compliance rates"
            ],
            toneGuidance: "Use creative and empowering language."
        },
        Developer: {
            generation: "Millennial",
            occupation: "Developer",
            engagementGoals: [
                "Support seamless integration with modern dev stacks",
                "Enable fast and reliable deployment flows",
                "Provide accessible documentation and tools"
            ],
            errorReductionGoals: [
                "Integrate robust code validation and error reporting",
                "Offer clear debugging and troubleshooting guides",
                "Ensure accessibility in developer interfaces"
            ],
            growthGoals: [
                "Increase developer retention through efficient workflows",
                "Promote open-source collaboration",
                "Scale with plugin and API ecosystems"
            ],
            dataDrivenGoals: [
                "Track build and deployment success rates",
                "Analyze API and tool usage",
                "Monitor developer feedback and pain points"
            ],
            toneGuidance: "Use technical and direct language."
        },
        Educator: {
            generation: "Millennial",
            occupation: "Educator",
            engagementGoals: [
                "Provide intuitive access to teaching resources",
                "Enable interactive and multimedia learning experiences",
                "Support flexible course management"
            ],
            errorReductionGoals: [
                "Implement clear grading and feedback systems",
                "Offer accessible documentation for instruction",
                "Enable error recovery for assignment submissions"
            ],
            growthGoals: [
                "Increase student engagement and participation",
                "Promote long-term platform trust for educators",
                "Support hybrid and remote teaching models"
            ],
            dataDrivenGoals: [
                "Track teaching activity and student progress",
                "Analyze engagement per session",
                "Collect feedback for curriculum improvement"
            ],
            toneGuidance: "Use clear and instructive language."
        }
    },
    "Gen Alpha": {
        Student: {
            generation: "Gen Alpha",
            occupation: "Student",
            engagementGoals: [
                "Gamify interaction loops to sustain focus",
                "Use playful and voice-driven UI",
                "Ensure instant feedback on actions"
            ],
            errorReductionGoals: [
                "Minimize cognitive load through guided flows",
                "Use visuals and audio cues for errors",
                "Support gesture and voice recovery paths"
            ],
            growthGoals: [
                "Build trust through fun and safe interaction",
                "Expand engagement via personalized avatars",
                "Support seamless use across touch devices"
            ],
            dataDrivenGoals: [
                "Track engagement streaks and patterns",
                "Analyze interaction response times",
                "Capture feedback through simplified prompts"
            ],
            toneGuidance: "Use playful and intuitive language."
        },
        Freelancer: {
            generation: "Gen Alpha",
            occupation: "Freelancer",
            engagementGoals: [
                "Enable adaptive dashboards for emerging devices",
                "Gamify productivity milestones",
                "Support voice and gesture-based task management"
            ],
            errorReductionGoals: [
                "Provide visual and audio cues for errors",
                "Implement guided correction flows",
                "Support multi-modal error recovery"
            ],
            growthGoals: [
                "Expand freelance opportunities through interactive portfolios",
                "Build trust with transparent feedback systems",
                "Support collaboration via playful team features"
            ],
            dataDrivenGoals: [
                "Track project streaks and completion rates",
                "Analyze engagement across devices",
                "Capture feedback with interactive prompts"
            ],
            toneGuidance: "Use energetic and encouraging language."
        },
        Designer: {
            generation: "Gen Alpha",
            occupation: "Designer",
            engagementGoals: [
                "Provide intuitive, touch-friendly creative tools",
                "Enable real-time, playful design previews",
                "Support voice and gesture input for design actions"
            ],
            errorReductionGoals: [
                "Offer instant undo and visual error feedback",
                "Use animated cues for design conflicts",
                "Support accessible design guidelines for new devices"
            ],
            growthGoals: [
                "Foster creativity through gamified design challenges",
                "Build community with interactive sharing features",
                "Scale with adaptive design environments"
            ],
            dataDrivenGoals: [
                "Track creative session streaks",
                "Analyze tool usage and interaction patterns",
                "Collect feedback via playful surveys"
            ],
            toneGuidance: "Use creative and playful language."
        },
        Developer: {
            generation: "Gen Alpha",
            occupation: "Developer",
            engagementGoals: [
                "Support coding on touch and voice-enabled devices",
                "Gamify learning and development milestones",
                "Enable instant feedback for code actions"
            ],
            errorReductionGoals: [
                "Provide visual and audio error notifications",
                "Implement guided troubleshooting flows",
                "Support gesture-based debugging"
            ],
            growthGoals: [
                "Expand learning through interactive coding challenges",
                "Build trust with transparent progress tracking",
                "Support collaboration with playful team coding features"
            ],
            dataDrivenGoals: [
                "Track coding streaks and achievement badges",
                "Analyze engagement across platforms",
                "Capture developer feedback with interactive prompts"
            ],
            toneGuidance: "Use clear, supportive, and playful language."
        },
        Educator: {
            generation: "Gen Alpha",
            occupation: "Educator",
            engagementGoals: [
                "Gamify lesson delivery to boost engagement",
                "Use voice and gesture controls for teaching tools",
                "Provide instant feedback on student interactions"
            ],
            errorReductionGoals: [
                "Minimize errors with guided teaching flows",
                "Use visual and audio cues for instructional mistakes",
                "Support multi-modal error recovery for assignments"
            ],
            growthGoals: [
                "Increase class participation through interactive features",
                "Build trust with transparent grading systems",
                "Support hybrid and remote teaching with adaptive tools"
            ],
            dataDrivenGoals: [
                "Track teaching streaks and student engagement",
                "Analyze lesson interaction patterns",
                "Collect feedback via playful and intuitive surveys"
            ],
            toneGuidance: "Use instructive and playful language."
        }
    },
};
