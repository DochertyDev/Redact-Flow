# RedactFlow Style Guide

This document outlines the coding style, conventions, and best practices for the RedactFlow project. Adhering to these guidelines ensures code consistency, readability, and maintainability.

## General Principles

-   **Language:** All code, comments, and documentation should be in American English.
-   **Formatting:** Code should be formatted automatically using the project's configured tools (ESLint/Prettier for frontend, Black/Ruff for backend, if configured).
-   **Naming:** Use clear, descriptive, and self-documenting names for variables, functions, and classes. Avoid abbreviations.
-   **Docker-centric Deployment:** The application is designed for deployment within Docker containers, ensuring consistent environments across development and production.
-   **Local-only Operation:** Emphasize that all PII processing and token mapping occurs locally and in-memory, reinforcing privacy and security.
-   **Extension Points:** The architecture is designed to be extensible, allowing for the addition of new entity types, file formats, and processing capabilities.

---

## Frontend (TypeScript & React)

The frontend is built with React, TypeScript, and Vite, and styled with Tailwind CSS.

### 1. File and Folder Structure

-   **Components:** All React components are located in `src/components/`.
    -   **Common/Reusable:** `src/components/common/` (e.g., `Button.tsx`, `Card.tsx`).
    -   **Feature-Specific:** Grouped by feature/view (e.g., `src/components/Sanitize/`, `src/components/Upload/`).
-   **State Management:** Global state is managed with Zustand in `src/store/`. The main store is `useAppStore.ts`.
-   **Services:** API interaction logic resides in `src/services/` (e.ts., `api.ts`).
-   **Types:** Shared TypeScript types and interfaces are in `src/types/index.ts`.
-   **Utilities:** Helper functions are placed in `src/utils/`.

### 2. Component Design

-   **Functional Components:** Always use functional components with hooks.
-   **Naming:** Component files and functions should use **PascalCase** (e.g., `StepNavigator.tsx`).
-   **Props:**
    -   Define props using a TypeScript `interface`.
    -   Props interfaces should be co-located with the component or in `src/types/index.ts` if widely shared.
    -   Example:
        ```typescript
        interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
          variant?: 'primary' | 'secondary' | 'danger';
          children: React.ReactNode;
          icon?: React.ReactNode; // For lucide-react icons
          isLoading?: boolean; // For Loader2 loading state
        }

        export const Button: React.FC<ButtonProps> = ({...}) => { ... };
        ```
-   **Styling:**
    -   Combine **Tailwind CSS** utility classes for atomic styling with custom `@layer components` CSS classes defined in `frontend/src/index.css` for glassmorphism effects (e.g., `glass-card`, `glass-button`).
    -   For minimized panel views, use `writing-mode-vertical-lr` and `rotate-180` classes for vertical text display.
    -   **`lucide-react`** is the designated icon library.

### 3. State Management (Zustand)

-   **Store Structure:** The global store (`useAppStore.ts`) defines the application's central state.
    ```typescript
    interface AppStore {
      currentStep: number;
      popupState: { isOpen: boolean; type: 'manualTokenization' | 'confirmation' | null; data: any };
      selectionRange: { start: number; end: number } | null;
      // ... other state properties
      goToNextStep: () => void;
      goToPreviousStep: () => void;
      // ... other actions
    }
    ```
-   **Actions:** All state modifications must be done through actions defined in the store using `set` and `get`.
-   **Naming:** Action names should be descriptive verbs (e.g., `setCurrentStep`, `setTokens`).
-   **Immutability:** When updating state, always create new objects or arrays rather than mutating the existing state. The spread syntax (`...`) is preferred.
    ```typescript
    // Good
    set(state => ({ tokens: [...state.tokens, newToken] }));

    // Bad
    const state = get();
    state.tokens.push(newToken);
    ```

### 4. TypeScript & Typing

-   **Strict Typing:** Provide explicit types for all function parameters, return values, and state objects.
-   **Interfaces over Types:** Prefer `interface` for defining object shapes, especially for component props.
-   **Shared Types:** Centralize types used across multiple components or between the store and components in `frontend/src/types/index.ts`.
-   **Property Naming:** Use `camelCase` for all property names within interfaces and objects.
-   **Frontend-Backend Mapping:** Clearly define types that map to backend Pydantic models, ensuring consistency in data structures exchanged between frontend and backend.

---

## Backend (Python & FastAPI)

The backend is a Python application built with the FastAPI framework.

### 1. File and Folder Structure

-   **Entrypoint:** The main application is configured in `app/main.py`.
-   **Routes:** API endpoints are defined in the `app/routes/` directory. Each file corresponds to a logical grouping of endpoints (e.g., `sanitize.py`, `detokenize.py`).
-   **Services:** Business logic is encapsulated within service classes in the `app/services/` directory (e.g., `presidio_service.py`).
-   **Models:** Pydantic models for request and response data structures are defined in `app/models/`.
-   **Configuration:** Application settings are managed in `app/config.py`.

### 2. Naming Conventions

-   **Files:** `snake_case` (e.g., `presidio_service.py`).
-   **Variables & Functions:** `snake_case` (e.g., `def sanitize_text_endpoint(...)`).
-   **Classes:** `PascalCase` (e.g., `class PresidioService:`).
-   **Constants:** `UPPER_SNAKE_CASE` (e.g., `CORS_ORIGINS`).

### 3. API Design (FastAPI)

-   **Routers:** Use `APIRouter` to group related endpoints. Include routers in the main `FastAPI` app instance in `main.py` with appropriate `prefix` and `tags`.
-   **Pydantic Models:**
    -   All request and response bodies **must** be defined using Pydantic `BaseModel` and `Field` for robust schema validation and automatic documentation.
    -   Use `snake_case` for field names in Pydantic models to align with Python conventions.
    -   Provide clear descriptions using `Field(..., description="...")`.
-   **Lifespan Context Manager:** Utilize FastAPI's `lifespan` context manager in `main.py` for efficient application startup and shutdown, including service initialization and warm-up procedures.
-   **Dependency Injection:** Leverage FastAPI's dependency injection system to provide services (e.g., `request.app.state.presidio_service`, `request.app.state.token_map_service`) to endpoint functions, promoting testability and modularity.
-   **CORS Configuration:** `CORSMiddleware` is configured in `main.py` to handle cross-origin requests, specifying allowed origins, methods, and headers.
-   **Global Exception Handling:** Implement global exception handling using `@app.exception_handler` to catch unexpected errors and return consistent `ErrorResponse` models.
-   **Custom Middleware:** A custom middleware is used to add an `X-Process-Time` header to responses, providing insights into request processing duration.
-   **Structured Logging:** Implement structured logging across the application for better observability and debugging.
-   **Example Endpoint (`app/routes/sanitize.py`):
    ```python
    @router.post("/text", response_model=SanitizeTextResponse)
    async def sanitize_text_endpoint(
        request: SanitizeTextRequest,
        presidio_service: PresidioService = Depends(get_presidio_service),
    ):
        # ... endpoint logic ...
    ```

### 4. Typing

-   **Type Hints:** All function signatures (parameters and return values) **must** include Python type hints.
-   **Clarity:** Use types from the `typing` module (`List`, `Dict`, `Optional`, etc.) to clearly define data structures.

---

## Testing Guidelines

-   **Backend (`pytest`):**
    -   Unit and integration tests for backend services and API endpoints are written using `pytest`.
    -   Tests are located in the `backend/tests/` directory.
    -   Aim for comprehensive test coverage, especially for core logic and API contract adherence.
-   **Frontend:**
    -   Future frontend testing will focus on component rendering, user interactions, and state management.
    -   Consider using testing libraries like React Testing Library and Vitest.

## How to Extend

-   **New Entity Types:** To add support for new PII entity types, extend the Presidio configuration within `PresidioService`.
-   **New File Formats:** To support additional file formats for upload and download, modify the `fileReader.ts` utility in the frontend and potentially the backend's file handling logic.
-   **New API Endpoints:** Create new files within `app/routes/` and define corresponding Pydantic models in `app/models/`.
-   **New UI Components:** Follow the component design guidelines and integrate new components into the existing file structure.
