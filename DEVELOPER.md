# RedactFlow Developer Documentation

This document provides an in-depth guide for developers looking to understand, modify, or extend the RedactFlow application.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Directory Structure](#directory-structure)
3. [Backend API Documentation](#backend-api-documentation)
    * [Health Check](#health-check)
    * [Sanitize Text](#sanitize-text)
    * [Detokenize Text](#detokenize-text)
    * [Update Tokens](#update-tokens)
    * [Delete Token Map](#delete-token-map)
4. [State Management (Frontend)](#state-management-frontend)
5. [How to Extend](#how-to-extend)
    * [Adding New Entity Types](#adding-new-entity-types)
    * [Supporting New File Formats](#supporting-new-file-formats)
6. [Testing Guidelines](#testing-guidelines)
7. [Contributing Guidelines](#contributing-guidelines)

## 1. Architecture Overview

RedactFlow follows a client-server architecture, with a clear separation of concerns between the frontend and backend:

* **Frontend (React/TypeScript):** A single-page application (SPA) built with React and TypeScript, using Vite for tooling, Tailwind CSS for styling, and Zustand for state management. It provides the user interface for interacting with the RedactFlow workflow.
* **Backend (Python/FastAPI):** A RESTful API built with FastAPI, running on Python 3.11. It handles the core logic for PII detection (using Microsoft Presidio), anonymization, token mapping, and detokenization. It also manages temporary, in-memory token maps.

Communication between the frontend and backend occurs via HTTP requests. During web development, this is handled by Vite's proxy. In the packaged Electron application, the main process starts the backend on an available port and informs the frontend of the correct address via IPC, ensuring seamless communication.

## 2. Directory Structure

```
redactflow/
├── backend/
│   ├── app/                    # FastAPI application source code
│   ├── Dockerfile              # Docker build instructions for backend
│   ├── requirements.txt        # Python dependencies
│   ├── .env.example            # Example environment variables
│   └── tests/                  # Backend unit and integration tests
├── frontend/
│   ├── src/                    # React application source code
│   ├── Dockerfile              # Docker build instructions for frontend
│   ├── package.json            # Frontend dependencies and scripts
│   ├── tsconfig.json           # TypeScript configuration
│   ├── vite.config.ts          # Vite build configuration
│   ├── tailwind.config.js      # Tailwind CSS configuration
│   └── ... (other config files)
├── desktop/                    # Electron desktop application source and build artifacts
│   ├── main.js                 # Electron main process (handles app lifecycle, backend spawning)
│   ├── preload.js              # Electron preload script (securely exposes Node.js APIs to renderer)
│   ├── package.json            # Electron app dependencies and build configuration (electron-builder)
│   ├── build.js                # Script for building the Electron app (if any custom build steps)
│   ├── assets/                 # Application assets (icons, etc.)
│   ├── dist/                   # Output directory for packaged installers (e.g., RedactFlow Setup 1.0.0.exe)
│   └── renderer/               # Copied frontend build (from frontend/dist)
│   └── backend/                # Copied backend build (from backend/dist/redactflow-backend)
├── docker-compose.yml          # Defines and runs multi-container Docker application
└── README.md                   # Project overview and running instructions
```

## 3. Backend API Documentation

The backend exposes the following RESTful API endpoints:

### Health Check

* **Endpoint:** `GET /api/health`
* **Description:** Checks the health status of the backend service and its dependencies (e.g., Presidio Analyzer).
* **Response:** `200 OK` with a JSON object indicating service status, version, and Presidio model status.

### Sanitize Text

* **Endpoint:** `POST /api/sanitize`
* **Description:** Analyzes the provided text for PII using Presidio and replaces detected entities with unique tokens.
* **Request Body (`application/json`):**

    ```json
    {
      "text": "string",
      "presidio_config": {
        "entity_types": ["PERSON", "EMAIL_ADDRESS"]
      } // Optional: Custom Presidio configuration
    }
    ```

- **Response (`200 OK`, `application/json`):**

    ```json
    {
      "sanitized_text": "string",
      "token_map_id": "string" (UUID),
      "tokens": [
        {
          "token": "string",
          "entity_type": "string",
          "start": 0,
          "end": 0,
          "score": 0.0
        }
      ],
      "processing_time_ms": 0.0
    }
    ```

### Detokenize Text

* **Endpoint:** `POST /api/detokenize`
* **Description:** Replaces tokens in the provided text with their original PII values using a previously generated token map.
* **Request Body (`application/json`):**

    ```json
    {
      "token_map_id": "string" (UUID),
      "text": "string"
    }
    ```

- **Response (`200 OK`, `application/json`):**

    ```json
    {
      "detokenized_text": "string",
      "processing_time_ms": 0.0
    }
    ```

### Update Tokens

* **Endpoint:** `POST /api/tokens/update`
* **Description:** Allows manual updates to specific token mappings within an existing token map.
* **Request Body (`application/json`):**

    ```json
    {
      "token_map_id": "string" (UUID),
      "updates": [
        {
          "token": "string",
          "original_value": "string",
          "entity_type": "string"
        }
      ]
    }
    ```

- **Response:** `200 OK` (or appropriate error response)

### Delete Token Map

* **Endpoint:** `DELETE /api/tokens/{token_map_id}`
* **Description:** Manually deletes a specific token map from memory.
* **Response:** `200 OK` (or appropriate error response)

## 4. State Management (Frontend)

The frontend uses **Zustand** for global state management. The main store is defined in `frontend/src/store/useAppStore.ts` and includes:

* `currentDocument`: The currently uploaded document.
* `sanitizedText`: The text after PII anonymization.
* `tokenMapId`: The ID of the token map generated by the backend.
* `tokens`: A list of detected tokens and their metadata.
* `llmOutput`: The text output from the external LLM.
* `detokenizedText`: The text after PII restoration.
* `currentStep`: The current step in the RedactFlow workflow.
* `isLoading`: Boolean to indicate loading states.
* `error`: Stores any error messages.

Actions are provided to update each piece of state, ensuring a centralized and predictable state flow.

## 5. How to Extend

### Adding New Entity Types

To add support for new PII entity types (e.g., custom identifiers):

1. **Backend (`backend/app/config.py`):**
    * Update the `SUPPORTED_ENTITY_TYPES` list in the `Settings` class to include the new entity type.
    * If it's a custom entity not recognized by Presidio out-of-the-box, you might need to implement a custom `Recognizer` in `backend/app/services/presidio_service.py` and add it to the `AnalyzerEngine`.

2. **Frontend (`frontend/src/types/index.ts`):**
    * If the new entity type requires specific handling or display, update the `TokenInfo` or related interfaces.

### Supporting New File Formats

Currently, RedactFlow primarily supports `.txt` files. To add support for other formats (e.g., `.docx`, `.pdf`):

1. **Frontend (`frontend/src/utils/fileReader.ts` & `frontend/src/components/Upload/FileUpload.tsx`):**
    * Modify `FileUpload.tsx` to accept the new file types (e.g., update `accept` prop for `react-dropzone`).
    * Implement a new function in `fileReader.ts` (or extend `readTextFile`) to parse the content of the new file type into plain text. Libraries like `mammoth.js` (for `.docx`) or `pdf.js` (for `.pdf`) might be useful.

2. **Backend (Optional):**
    * If the new file format requires server-side parsing or specific handling, you might need to extend the backend to accept and process these files. This could involve adding new endpoints or modifying existing ones to handle different `Content-Type` headers and use Python libraries like `python-docx` or `PyPDF2`.

## 6. Testing Guidelines

### Backend Testing

* **Location:** `backend/tests/`
* **Framework:** `pytest`
* **To Run:**
  * **With Docker:** From the project root, run `docker compose exec backend pytest`.
  * **Without Docker (Local venv):** If you have a local virtual environment set up (see `README.md` for instructions), navigate to the `backend` directory, activate your virtual environment, and run `pytest`.
* **Focus:** Unit tests for services (`presidio_service.py`, `tokenmap_service.py`) and integration tests for API endpoints.

### Frontend Testing

* **Manual Testing:** This is crucial for verifying the end-to-end user workflow and UI responsiveness.
* **Automated Testing (Future):** Consider adding unit tests for React components (e.g., using `@testing-library/react` and `Jest`) and end-to-end tests (e.g., using Cypress or Playwright) for critical user flows.

### Desktop Application Testing

After packaging the application (see `README.md` for packaging steps):

* **Installation Verification:** Run the generated installer (`RedactFlow Setup X.Y.Z.exe` from `desktop/dist`) and ensure the application installs correctly.
* **End-to-End Functional Testing:** Launch the installed application and perform the full workflow (upload text with PII, sanitize, review, detokenize) to verify that the bundled frontend and backend communicate and function as expected.
* **Backend Process Management:** Verify that the Python backend process (`redactflow-backend.exe`) starts automatically when the Electron app launches and terminates correctly when the Electron app is closed (check Task Manager).

## 7. Contributing Guidelines

We welcome contributions to RedactFlow! Please follow these guidelines:

1. **Fork the repository** and create your branch from `main`.
2. **Ensure code quality:** Adhere to existing coding styles, use clear variable names, and comment complex logic.
3. **Write tests:** If you add new features or fix bugs, please add corresponding tests.
4. **Update documentation:** Ensure `README.md` and `DEVELOPER.md` are updated with any changes to features, installation, or API.
5. **Understand the Packaging Process:** Familiarize yourself with the application packaging steps outlined in `README.md` if your changes impact the build or deployment.
6. **Create a Pull Request:** Provide a clear description of your changes and their purpose.

Thank you for contributing to RedactFlow!
