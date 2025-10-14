# How to Run RedactFlow with Docker

This guide provides instructions on how to build and run the RedactFlow application using Docker and Docker Compose. This method encapsulates all dependencies and provides a consistent environment for running the application.

---

## Understanding Docker and Docker Compose

*   **Docker:** Docker allows you to package applications and their dependencies into isolated units called **containers**. These containers are lightweight, portable, and ensure that your application runs consistently across different environments.
*   **Docker Compose:** Docker Compose is a tool for defining and running multi-container Docker applications. With a single `docker-compose.yml` file, you can configure all your application's services (like our backend and frontend), networks, and volumes.
*   **Images vs. Containers:**
    *   A **Docker Image** is a read-only template (a blueprint) that contains the application code, libraries, dependencies, and configuration needed to run an application. The `docker compose build` command creates these images.
    *   A **Docker Container** is a runnable instance of a Docker image. When you run `docker compose up`, Docker creates and starts containers based on your images.

NOTE: You can make things even easier and take care of these two steps in a single command using `docker-compose up --build -d`.

---

## Prerequisites

*   **Docker Desktop:** Ensure Docker Desktop is installed and running on your system. You can download it from the official Docker website.

---

## Step-by-Step Instructions

1.  **Navigate to the Project Root Directory:**
    Open your terminal (e.g., PowerShell, Command Prompt, Git Bash) and navigate to the main `Redact-Flow` directory where the `docker-compose.yml` file is located.

    ```bash
    cd C:\Users\Sean\Projects\Redact-Flow
    ```

2.  **Build the Docker Images (First Time Setup & Updates):**
    This command reads the `Dockerfile`s for both the backend and frontend services and creates the necessary Docker images.

    ```bash
    docker compose build
    ```
    *   **When to run this:**
        *   The very first time you set up the project.
        *   Whenever you modify a `Dockerfile` (e.g., changing the base image, adding system packages).
        *   Whenever you change `backend/requirements.txt` (Python dependencies).
        *   Whenever you change `frontend/package.json` or `package-lock.json` (Node.js dependencies).
        *   If you encounter issues that suggest an image might be corrupted or outdated.

3.  **Run the Application (Daily Use):**
    This command starts both the backend and frontend services in detached mode (in the background).

    ```bash
    docker compose up -d
    ```
    *   **When to run this:**
        *   After `docker compose build`.
        *   Every time you restart your computer or close Docker Desktop.
        *   After you've stopped the application using `docker compose down`.
        *   To apply certain code changes (though many frontend/backend code changes will hot-reload automatically).

4.  **Access the Application:**
    Once both services are up and running, open your web browser and navigate to:

    ```
    http://localhost:5173
    ```

5.  **View Logs (Optional):**
    If you need to see the real-time output (logs) from both services for debugging or monitoring, run:

    ```bash
    docker compose logs -f
    ```
    (Press `Ctrl+C` to stop viewing logs.)

6.  **Stop the Application:**
    To stop and remove the running Docker containers, run this command in your project's root directory:

    ```bash
    docker compose down
    ```
    *   **When to run this:**
        *   When you are finished working on the project for a while.
        *   Before rebuilding images if you want a clean slate.
        *   To free up system resources.

---

## Running the App in the Future

*   **After a computer restart or closing Docker Desktop:** Your Docker containers will be stopped. Simply navigate to the project root directory in your terminal and run `docker compose up -d` to start them again.
*   **Applying code changes:**
    *   **Frontend (React/Vite):** Most changes to your frontend code (`.tsx`, `.ts`, `.css`) will be automatically detected and hot-reloaded by Vite, so you usually don't need to restart the containers.
    *   **Backend (Python/FastAPI):** The backend is running with `--reload`, so most changes to Python files (`.py`) will also trigger an automatic reload of the backend service.
    *   **For dependency changes (Python or Node.js) or Dockerfile changes:** You *must* run `docker compose build` again, followed by `docker compose up -d`.

---

This Docker setup provides a streamlined way to manage and run your RedactFlow application, ensuring consistency and ease of use.