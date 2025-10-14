# RedactFlow UX & UI Rules

This document defines the core principles, visual identity, and interaction patterns for the RedactFlow user experience. The goal is to create an interface that is intuitive, efficient, and visually clear, helping users feel confident as they handle sensitive data.

## 1. Core UX Principles

- **Clarity and Guidance:** The user should always know where they are in the process, what they need to do next, and what the system is doing. The multi-step navigator is central to this principle.
- **Confidence and Trust:** The interface must feel professional and secure. All processing is local, and the UI should reinforce this sense of privacy and control. Visual feedback (loading states, success messages) is critical.
- **Efficiency:** The workflow should be streamlined, minimizing clicks and cognitive load. Users should be able to move from upload to final download with minimal friction.
- **Control and Flexibility:** While the guided path is primary, users must have the ability to review and manually override automated processes (e.g., editing tokens).

---

## 2. Visual Identity (The "Glassmorphism" Theme)

The UI is built on a light-themed, "glassmorphism" aesthetic. This is characterized by frosted-glass effects, subtle gradients, and soft shadows to create a sense of depth and modernity.

### Color Palette

- **Primary:** `#10B981` (Tailwind `emerald-500`). Used for primary actions and key interactive elements.
- **Success:** Documented as `#10B981` in Tailwind config (e.g., for `text-green-800` context) and `#059669` in `index.css` for specific success-related UI components.
- **Warning:** `#F59E0B` (Tailwind `amber-500`). Used for cautionary messages or actions.
- **Danger:** `#EF4444` (Tailwind `red-500`). Used for critical errors or destructive actions.
- **Accent:** A cyan/teal (`#06B6D4`), used for highlighting active steps or elements.
- **Text Colors:**
  - `text-gray-800`: Primary dark text for high readability.
  - `text-gray-700`: Secondary dark text.
  - `text-gray-600`: Tertiary dark text, often for less prominent information.
  - `text-green-800`: Used in conjunction with success states.
  - `text-red-800`: Used in conjunction with danger/error states.
- **Body Background:** A subtle gradient from `rgba(243, 244, 246, 0.7)` to `rgba(229, 231, 235, 0.7)` provides a soft, layered base for the glassmorphism elements.

### Typography

- **Font:** The application uses the system's default sans-serif font (`font-sans`).
- **Sizing:**
  - **Base:** `text-base` (16px) for standard body text and buttons.
  - **Small:** `text-sm` (14px) for secondary text or smaller buttons.
  - Headings should follow a clear hierarchy (e.g., `text-xl`, `text-2xl`).

### Spacing & Layout

- **Consistency:** Use Tailwind's spacing scale for all padding and margins to ensure a consistent rhythm.
- **Containers:** Main content is held within a central `container` with `mx-auto` and horizontal padding (`p-4`).
- **Cards (`glass-card`):** Key content areas are presented in `glass-card` components, which have a standard internal padding of `p-6`.

### Custom Visual Elements

- **Glassmorphism Classes:**
  - `glass-card`: `background: rgba(255, 255, 255, 0.2); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.3); box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);`
  - `glass-button`: Similar to `glass-card` but with specific padding and hover effects.
  - `token-highlight`: Used for highlighting PII tokens, featuring a distinct background and border.
  - `selection-highlight`: Applied to user-selected text, providing visual feedback.
  - `glass-panel`: A variant of `glass-card` for side panels or distinct content blocks.
  - `glass-input`: Input fields with a glassmorphic style.
  - `popup-arrow-left`, `popup-arrow-right`: Custom CSS for styling popup pointers.
- **Custom Scrollbar:** Defined in `index.css` for a consistent look across browsers.
- **`fadeIn` Animation:** A subtle animation applied to elements for smooth appearance transitions.

---

## 3. Interaction Patterns & Components

### Buttons (`Button.tsx`)

- **State:** Buttons must visually represent their current state:
  - `disabled`: Reduced opacity (`opacity-50`) and a `cursor-not-allowed` pointer.
  - `loading`: Display a spinning `Loader2` icon (from `lucide-react`) to provide immediate feedback for an ongoing action.
  - `hover`: A subtle change in shadow or background opacity to indicate interactivity.
- **Hierarchy:** Use the `variant` prop (`primary`, `secondary`, `success`, `danger`) to match the button's visual weight to its importance in the user flow.
  - `secondary`: Typically a light gray (`bg-gray-200`) with transparency.
  - `danger`: Styled with the `#EF4444` color for critical actions.

### Navigation (`StepNavigator.tsx`)

- The 5-step navigator at the top of the page is the primary orientation tool.
- **Visual Styling:**
  - **Completed Steps:** Indicated by a checkmark icon (from `lucide-react`) and a distinct background.
  - **Active Step:** Clearly marked with the `accent` color and a unique icon.
  - **Inactive Steps:** Grayed out with a default icon.
- Steps should be sequentially enabled as the user completes the previous one.
- The `Tooltip` component is used to provide additional information on hover for navigation steps.

### State Management (Global UI Interactions)

- **`popupState`:** Globally managed via Zustand to control the visibility and content of various popups, ensuring only one critical popup is active at a time.
- **`selectionRange`:** Manages the currently selected text range in the UI, enabling consistent interaction for tokenization or other text-based actions.

### User Workflow

The application guides users through a clear 5-step process:

1. **Upload:** User uploads the document containing PII.
2. **Sanitize:** The system automatically detects and anonymizes PII.
3. **Review:** User reviews the anonymized document, making manual adjustments or corrections.
4. **LLM Processing:** (Conceptual step, external to RedactFlow) The anonymized document is sent to an LLM.
5. **Detokenize & Download:** The processed document is detokenized, restoring original PII, and made available for download.

### Review Panel Enlarge/Minimize

- **Dynamic Layout:** The Review Panel allows users to enlarge either the original or sanitized document view. When one panel is enlarged (`flex-1`), the other minimizes to a narrow strip (`w-16`). Smooth transitions (`transition-all duration-300 ease-in-out`) are used for a fluid user experience.
- **Minimized Panel View:** Minimized panels display their title vertically using `writing-mode-vertical-lr rotate-180` classes, mimicking the `TokenSidebar`'s minimized state, and feature a prominent maximize button.
- **Button Labels & Tooltips:** Buttons for enlarging/restoring views dynamically update their tooltip text to provide clear guidance (e.g., "Enlarge [Panel Name]", "Restore View").

### User Feedback

- **Loading:** For global actions (like sanitizing a document), a loading state should be set in the global store, which can be used to disable UI elements and show loading indicators.
- **Errors:** Errors should be displayed clearly to the user, ideally near the element that caused the error. The global store has an `error` state for this purpose.
- **Popups (`ManualTokenizationPopup.tsx`):** Use popups for actions that require focused user input and temporarily interrupt the main flow. The background should be dimmed to draw attention to the popup.

### File Upload (`FileUpload.tsx`)

- The dropzone should clearly indicate its active state (e.g., when a file is dragged over it).
- Provide immediate feedback on file selection, showing the document name.
- Clearly state the accepted file formats.
