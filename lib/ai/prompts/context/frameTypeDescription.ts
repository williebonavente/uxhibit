export const frameTypeDescriptions: Record<string, string> = {
  login: `
    The provided frame represents a static **Login Page UI**.
    Common visible elements:
    - A prominent form section with a labeled "Email" or "Username" text input field.
    - A password input field, often with an icon or toggle to reveal or hide the password.
    - A clearly visible primary button labeled “Log In” or “Sign In” that anchors the main action.
    - Secondary text links such as “Forgot Password?” or “Create Account” placed below or beside the primary CTA.
    - Branding elements such as a company logo or application name at the top of the page to establish trust and identity.
    - Optional additional information such as “Keep me signed in” checkboxes, legal disclaimers (e.g., Terms of Service), or security badges.
    - Minimal distractions to keep user focus on the form itself.

    Only evaluate what is visible in the static UI and metadata. Ignore authentication flow or backend logic.
  `,

  signup: `
    The provided frame represents a static **Signup Page UI**.
    Common visible elements:
    - A structured registration form with fields typically labeled “Full Name”, “Email Address”, and “Password”.
    - A confirm password input field, often paired with visibility toggles or strength indicators.
    - A primary action button labeled “Sign Up” or “Create Account”, positioned clearly after the form inputs.
    - A checkbox or consent section for agreeing to Terms of Service and Privacy Policy, usually linked for reference.
    - A secondary text link for existing users, such as “Already have an account? Log In”, typically positioned below the primary CTA.
    - Branding elements (e.g., logo or tagline) that reinforce platform identity at the top or side of the page.
    - Optional trust-building visuals like lock icons, disclaimers, or third-party authentication options (e.g., “Sign up with Google”).
    - Clean, focused layout to reduce friction during account creation.

    Only evaluate visible UI and metadata. Exclude dynamic validations and backend registration flow.
  `,

  landing: `
    The provided frame represents a static **Landing Page UI**.
    Common visible elements:
    - A visually dominant hero section featuring a clear headline and subheadline that communicate the product value proposition.
    - A prominent primary CTA button (e.g., “Get Started”, “Sign Up Now”) and a secondary CTA (e.g., “Learn More”).
    - A navigation bar with a logo, menu items, and possibly a “Log In” or “Sign Up” button.
    - Illustrations, hero images, or product mockups that visually support the messaging.
    - Supporting content sections below the hero such as feature highlights, customer testimonials, pricing blocks, or trust badges.
    - A structured footer with essential links (Docs, Terms, Privacy, Contact, Social Media).
    - Clear content hierarchy designed to guide users toward the main conversion goal.
    - Minimal forms, usually limited to newsletter signups or CTAs leading to signup/login flows.

    Only evaluate visible layout and metadata. Exclude dynamic animations, scrolling effects, or personalization logic.
  `,

  dashboard: `
    The provided frame represents a static **Dashboard Page UI**.
    Common visible elements:
    - A sidebar navigation with labeled menu items (e.g., “Home”, “Reports”, “Settings”) to structure key sections.
    - A top navigation bar containing user avatar, notification icons, search input, and possibly quick-access actions.
    - Data visualization elements such as KPI cards, line or bar charts, tables, and progress summaries.
    - Quick-action buttons like “New Entry”, “Add Record”, or “Export” for immediate interactions.
    - Status indicators such as badges, alerts, or banners that reflect system state.
    - Widgets arranged in a grid or column layout to present key data at a glance.
    - Minimal decorative elements; focus is on clarity, scannability, and information density.
    - Consistent use of icons and labels to support navigation and quick comprehension.

    Only evaluate visible dashboard UI and metadata. Ignore real-time data or backend API integrations.
  `,

  profile: `
    The provided frame represents a static **User Profile Page UI**.
    Common visible elements:
    - A circular or rounded user avatar at the top, often with a small “Edit” icon overlay.
    - Key user information fields like “Full Name”, “Email”, “Phone Number”, or “Username”.
    - An “Edit Profile” button, or inline edit icons adjacent to each field.
    - A primary “Save Changes” button and secondary “Cancel” or “Back” button positioned clearly near form elements.
    - Section headers dividing content into areas such as “Personal Information”, “Account Settings”, or “Security”.
    - Optional account management options such as “Change Password” or “Delete Account”.
    - A clean and consistent layout designed to make personal information easy to read and update.
    - Clear labels and well-spaced input elements to reduce form fatigue.

    Only evaluate static UI and metadata. Exclude backend update logic and API calls.
  `,

  settings: `
    The provided frame represents a static **Settings Page UI**.
    Common visible elements:
    - A series of toggle switches for features like “Dark Mode” or “Email Notifications”.
    - Dropdown menus or radio button groups for language, region, or preference selection.
    - Checkboxes for permissions, subscription preferences, or feature opt-ins.
    - Grouped sections with descriptive headers and short explanations for each setting.
    - A prominent “Save” or “Apply Changes” button, often placed at the bottom or fixed in view.
    - Optional “Reset to Default” or “Revert Changes” link for restoring initial states.
    - Hierarchical grouping of settings to support quick scanning and efficient customization.
    - Minimal decorative visuals, prioritizing clarity and function.

    Only evaluate visible settings UI and metadata. Ignore live state changes or backend persistence.
  `,

  error: `
    The provided frame represents a static **Error or Empty State Page UI**.
    Common visible elements:
    - A clear, bold error headline such as “Page Not Found” or “Something Went Wrong”.
    - Supporting message text providing context, instructions, or reassurance.
    - A primary button for recovery actions (e.g., “Try Again”, “Go to Homepage”).
    - Secondary navigation or help links such as “Contact Support” or “Report Issue”.
    - An expressive illustration or icon visually representing the error state.
    - Optional navigation bar or footer elements consistent with the rest of the application.
    - Simple, focused design with minimal distractions to direct the user toward the recovery action.
    - Friendly tone or visual cues to reduce user frustration and maintain brand personality.

    Only evaluate visible error state UI and metadata. Ignore server-side or dynamic error handling.
  `
};
