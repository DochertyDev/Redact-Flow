<p align="center">
  <a href="https://github.com/DochertyDev/Redact-Flow">
    <img src="frontend/public/apple-touch-icon.png" width="150" alt="RedactFlow">
  </a>
</p>

<h1 align="center">
RedactFlow
</h1>

<h2 align="center">A local-only web application for PII detection, anonymization, and detokenization, ensuring data privacy for LLM usage.</h2>

<div align="center">

[![Release](https://img.shields.io/github/release/DochertyDev/Redact-Flow)](https://github.com/DochertyDev/Redact-Flow/releases) [![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE) [![GitHub Stars](https://img.shields.io/github/stars/DochertyDev/Redact-Flow)](https://github.com/DochertyDev/Redact-Flow)

</div>

:star: _Love RedactFlow? Give us a star to help other developers discover it!_

<br />

<div>
<img src="images/RedactFlowscreenshot.JPG" alt="RedactFlow Screenshot" width="800" style="border-radius: 16px; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2); transform: perspective(1000px) rotateX(2deg); transition: transform 0.3s ease;">
</div>

---

## Table of Contents

- [Overview](#-overview)
  - [Features](#features)
  - [Architecture and Data Flow](#architecture-and-data-flow)
- [Quick Start Local Development](#-quick-start-local-development)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Usage](#️-usage)
  - [Running the Desktop Application](#running-the-desktop-application)
  - [Running in Development Docker](#running-in-development-docker)
  - [Running in Development Local](#running-in-development-local)
  - [Building the Desktop Installer](#building-the-desktop-installer)
- [Technologies Used](#️-technologies-used)
  - [Tech Stack Diagram](#tech-stack-diagram)
- [Security Notes](#-security-notes)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [Support the Project](#-support-the-project)
- [Disclaimer](#️-disclaimer)

## 📄 Overview

RedactFlow is a local-only web application designed to help users safely process sensitive documents with external Large Language Models (LLMs) and then restore the original Personally Identifiable Information (PII). It achieves this by leveraging Microsoft Presidio for PII detection and anonymization, replacing sensitive data with unique tokens. After LLM processing, the original PII can be restored using a secure token map.

This application consists of two main parts:

- A **React/TypeScript frontend** for an intuitive user interface.
- A **Python/FastAPI backend** that handles PII detection, anonymization, and token management.

Both components are designed to run locally on your machine, ensuring that sensitive data never leaves your environment.

### Features

-   **PII Detection & Anonymization:** Utilizes Microsoft Presidio to identify and replace sensitive information (e.g., names, emails, phone numbers, credit card numbers) with unique, reversible tokens.
-   **Secure Token Mapping:** Maintains a temporary, in-memory map of tokens to original PII values, ensuring data privacy.
-   **Guided Workflow:** A step-by-step interface guides users through document upload, sanitization, review, LLM output processing, and detokenization.
-   **Local-Only Operation:** All processing occurs on your local machine, providing maximum control over your data.
-   **Modern Glassmorphism UI:** A sleek, light-themed user interface featuring frosted glass effects, subtle gradients, and smooth animations for an intuitive and visually appealing experience.

### Architecture and Data Flow

#### High-Level Architecture Diagram

```mermaid
graph TD;
    subgraph User Interaction
        User([User]);
        WebApp[Frontend - React/Vite];
    end

    subgraph Backend Services
        FastAPI[Backend - FastAPI];
        PresidioSvc[PII Analysis Service];
        TokenMapSvc[Token Management Service];
        EncryptionSvc[Encryption Service];
    end

    subgraph Application Packaging
        Electron[Electron Wrapper];
        Docker[Docker Compose];
    end

    subgraph Frontend Internals
        direction LR
        Components[UI & View Components];
        StateMgmt[State Management - Zustand];
        APICalls[API Service];
    end

    User --> WebApp;
    User --> Electron;
    Electron --> WebApp;

    WebApp --> Components;
    WebApp --> StateMgmt;
    WebApp --> APICalls;
    
    APICalls ==> FastAPI;
    
    FastAPI --> PresidioSvc;
    FastAPI --> TokenMapSvc;
    TokenMapSvc --> EncryptionSvc;

    Docker -.-> FastAPI;
    Docker -.-> WebApp;

    style WebApp fill:#61DAFB,stroke:#000,stroke-width:2px;
    style FastAPI fill:#009688,stroke:#000,stroke-width:2px,color:#fff;
    style Electron fill:#9FEAF9,stroke:#000,stroke-width:2px;
    style PresidioSvc fill:#f0ad4e;
    style TokenMapSvc fill:#f0ad4e;
    style EncryptionSvc fill:#f0ad4e;
    style Docker fill:#2496ED,stroke:#000,stroke-width:2px,color:#fff;

```

#### Data Model ERD

```mermaid
erDiagram
    SANITIZE_REQUEST ||--|{ SANITIZE_RESPONSE : "generates"
    SANITIZE_RESPONSE ||--o{ TOKEN_INFO : "contains"
    SANITIZE_RESPONSE }|..|{ TOKEN_MAP_DATA : "creates"
    TOKEN_MAP_DATA ||--o{ TOKEN_MAPPING : "has"
    DETOKENIZE_REQUEST }|..|{ TOKEN_MAP_DATA : "uses"
    DETOKENIZE_REQUEST ||--|{ DETOKENIZE_RESPONSE : "generates"
    TOKEN_UPDATE_REQUEST }|..|{ TOKEN_MAP_DATA : "updates"
    MANUAL_TOKEN_REQUEST }|..|{ TOKEN_MAP_DATA : "updates"
    REVERT_TOKEN_REQUEST }|..|{ TOKEN_MAP_DATA : "updates"

    SANITIZE_REQUEST {
        string text
        dict presidio_config
    }

    SANITIZE_RESPONSE {
        string sanitized_text
        uuid token_map_id PK
        float processing_time_ms
        int additional_occurrences
    }

    TOKEN_INFO {
        string token
        string original_value
        string entity_type
        int start
        int end
        float score
    }

    TOKEN_MAP_DATA {
        uuid id PK
        string original_text
        datetime created_at
        datetime expires_at
    }

    TOKEN_MAPPING {
        string token PK
        uuid token_map_id FK
        string original_value
        string entity_type
        float score
    }

    DETOKENIZE_REQUEST {
        uuid token_map_id FK
        string text
    }

    DETOKENIZE_RESPONSE {
        string detokenized_text
        float processing_time_ms
    }

    TOKEN_UPDATE_REQUEST {
        uuid token_map_id FK
        list updates
    }

    MANUAL_TOKEN_REQUEST {
        uuid token_map_id FK
        string text_to_tokenize
        string entity_type
        int start
        int end
    }

    REVERT_TOKEN_REQUEST {
        uuid token_map_id FK
        string token
    }
```

## 🚀 Quick Start (Local Development)

If you prefer to run the application without Docker, directly managing Python and Node.js environments and dependencies, follow these steps.

### Prerequisites

Before you begin, ensure you have the following installed:

-   **Python 3.11:** [Download Python](https://www.python.org/downloads/)
-   **Node.js 18+ & npm:** [Download Node.js](https://nodejs.org/en/download/)

### Backend Setup

1.  **Navigate to the `backend` directory:**

    ```bash
    cd Redact-Flow/backend
    ```

2.  **Create and activate a Python virtual environment:**

    ```bash
    python -m venv venv
    # On Windows:
    # .\venv\Scripts\activate
    # On macOS/Linux:
    # source venv/bin/activate
    ```

3.  **Install backend dependencies:**

    ```bash
    pip install -r requirements.txt
    ```

4.  **Install spaCy language model (required for Presidio):**

    ```bash
    python -m spacy download en_core_web_lg
    ```

5.  **Create a `.env` file:**
    Copy the contents of `.env.example` to a new file named `.env` in the `backend` directory. You can modify the values if needed, but the defaults should work for local development.

    ```bash
    cp .env.example .env
    ```

### Frontend Setup

1.  **Navigate to the `frontend` directory:**

    ```bash
    cd Redact-Flow/frontend
    ```

2.  **Install frontend dependencies:**

    ```bash
    npm install
    ```

## ⚙️ Usage

This section outlines how to install, build, and run the RedactFlow application in its various forms.

### Running the Desktop Application

For the easiest way to run RedactFlow, download and install the pre-built desktop application from the project's official GitHub Releases. This version is self-contained and does not require Docker, Python, or Node.js to be installed on your system.

#### Prerequisites

-   Windows 10 or newer (64-bit)

#### Steps

1.  **Navigate to Releases:**
    -   Go to the [**Releases**](https://github.com/DochertyDev/Redact-Flow/releases) page for this repository.

2.  **Download the Installer:**
    -   On the latest release, look under the **Assets** section.
    -   Click on the `RedactFlow.Setup.X.Y.Z.exe` file to download it.

3.  **Run the Installer:**
    -   Double-click the downloaded `.exe` file.
    -   Follow the on-screen instructions. It's generally safe to accept the default installation options.

4.  **Launch RedactFlow:**
    -   Once the installation is complete, you can launch RedactFlow from your Windows Start Menu or via the desktop shortcut that may have been created.

### Running in Development (Docker)

If you wish to contribute to RedactFlow or run it in a Dockerized development environment, follow these steps.

#### Prerequisites

Before you begin, ensure you have the following installed:

-   **Docker Desktop:** Ensure Docker Desktop is installed and running on your system. You can download it from the official Docker website.

#### Setup

1.  **Navigate to the Project Root Directory:**
    Open your terminal (e.g., PowerShell, Command Prompt, Git Bash) and navigate to the main `Redact-Flow` directory where the `docker-compose.yml` file is located.

    ```bash
    cd ~\Redact-Flow
    ```

2.  **Build the Docker Images:**
    This command reads the `Dockerfile`s for both the backend and frontend services and creates the necessary Docker images. You only need to run this command once, or whenever you make changes to the `Dockerfile`s or the `requirements.txt`/`package.json` files.

    ```bash
    docker compose build
    ```

#### Running the Application

To start both the backend and frontend services using Docker Compose for development, navigate to the root `Redact-Flow` directory and use:

```bash
docker compose up -d
```

Once started, the application will typically be accessible in your web browser at `http://localhost:5173`.

To stop the application, run:

```bash
docker compose down
```

### Running in Development (Local)

1.  **Start the Backend:**
    In a terminal, navigate to the `backend` directory, activate its virtual environment, and run:

    ```bash
    # Activate venv first (see Quick Start (Local Development))
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
    ```

2.  **Start the Frontend:**
    In a *separate* terminal, navigate to the `frontend` directory and run:

    ```bash
    npm run dev
    ```

Once both are running, the application will typically be accessible in your web browser at `http://localhost:5173`.

### Building the Desktop Installer

If you have made changes to the application and want to create a new distributable installer for Windows, follow these steps:

1.  **Navigate to the `desktop` directory:**

    ```bash
    cd Redact-Flow/desktop
    ```

2.  **Run the distribution command:**

    ```bash
    npm run dist
    ```

    This command will automatically build the frontend, copy the necessary files, and create a new installer in the `desktop/dist` directory.

## 🛠️ Technologies Used

#### Tech Stack Diagram

```mermaid
graph TD;
    subgraph Frontend
        React[React];
        Tailwind[Tailwind CSS];
        Zustand[Zustand];
        Axios[Axios];
    end

    subgraph Backend
        FastAPI[FastAPI];
        Python[Python];
        Presidio[Microsoft Presidio];
        Uvicorn[Uvicorn];
    end

    subgraph Desktop
        Electron[Electron];
    end

    subgraph Infrastructure
        Docker[Docker];
    end

    subgraph Testing
        Playwright[Playwright];
        Pytest[Pytest];
    end

    subgraph BuildTools
        Vite[Vite];
        NodeJS[Node.js];
    end

    React --> Vite;
    FastAPI --> Python;
    Uvicorn -- Serves --> FastAPI;
    Electron -- Packages --> Frontend;
    Electron -- Packages --> Backend;
    
    style Frontend fill:#e1f5ff;
    style Backend fill:#fff4e1;
    style Desktop fill:#f3e5f5;
    style Infrastructure fill:#e8f5e9;
    style Testing fill:#fff3e0;
    style BuildTools fill:#fce4ec;
```

-   **Frontend:** React, Tailwind CSS, Zustand, Axios
-   **Backend:** FastAPI, Python, Microsoft Presidio, Uvicorn
-   **Desktop:** Electron
-   **Infrastructure:** Docker
-   **Testing:** Playwright, Pytest
-   **Build Tools:** Vite, Node.js

## 🔒 Security Notes

RedactFlow is designed with privacy and security in mind, operating entirely locally to ensure sensitive data never leaves your environment.

-   **Local-Only Operation:** All PII detection, anonymization, and detokenization processes occur on your local machine. Data is not transmitted to external servers or cloud services.
-   **In-Memory Token Mapping:** Token maps, which store the relationship between tokens and original PII, are kept in-memory and are temporary. They are not persisted to disk, further reducing the risk of data exposure.
-   **Microsoft Presidio:** Leverages Microsoft Presidio, an industry-standard library for PII detection and anonymization, providing robust and configurable PII handling capabilities.
-   **No External Data Storage:** RedactFlow does not store any user data or PII externally. All processing is ephemeral and confined to the application's runtime.

## ❓ Troubleshooting

Currently, there are no specific troubleshooting steps documented. If you encounter issues, please refer to the "Contributing" section to open an issue on the GitHub repository.

## 🤝 Contributing

<div align="center">
<a href="https://github.com/DochertyDev/Redact-Flow/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=DochertyDev/Redact-Flow&max=400&columns=20"  width="100"/>
</a>
</div>

We welcome contributions from the community! If you have suggestions for improvements or new features, feel free to open an issue or submit a pull request. Please refer to **[DEVELOPER.md](DEVELOPER.md)** for more detailed contribution guidelines.

## 🌟 Support the Project

**Love RedactFlow?** Give us a ⭐ on GitHub!

<div align="center">
  <p>
      <img width="800" src="https://api.star-history.com/svg?repos=DochertyDev/Redact-Flow&type=Date" alt="Star-history">
  </p>
</div>

## ⚠️ Disclaimer

This software is provided "as is," without warranty of any kind, express or implied, including but not limited to the warranties of merchantability, fitness for a particular purpose, and non-infringement. In no event shall the authors or copyright holders be liable for any claim, damages, or other liability, whether in an action of contract, tort, or otherwise, arising from, out of, or in connection with the software or the use or other dealings in the software. Users are responsible for ensuring compliance with all applicable data privacy regulations when using RedactFlow.