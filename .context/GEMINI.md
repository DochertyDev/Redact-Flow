# RedactFlow Project Context for Gemini

## Project Overview

RedactFlow is a local-only web application designed for PII detection, anonymization, and detokenization. It uses Microsoft Presidio for PII handling and a token mapping system to restore original PII after processing by external LLMs.

## Architecture

- **Frontend:** React/TypeScript (Vite, Tailwind CSS, Zustand)
- **Backend:** Python/FastAPI (Uvicorn, Presidio Analyzer/Anonymizer, Pydantic, python-dotenv, cryptography)

## Current Project Status

The user has indicated that the project setup (backend and frontend dependencies) is already complete.

## Gemini's Operational Guidelines for RedactFlow

### Core Mandates

- **Adhere to Conventions:** Strictly follow existing project conventions (code style, structure, framework choices, typing).
- **Verify Libraries/Frameworks:** Never assume availability; verify usage within the project.
- **Idiomatic Changes:** Ensure changes integrate naturally and idiomatically with existing code.
- **Minimal Comments:** Add comments sparingly, focusing on *why* rather than *what*.
- **Proactive Assistance:** Fulfill requests thoroughly, including implied follow-up actions.
- **Confirm Ambiguity:** Seek clarification for significant actions beyond the clear scope of a request.
- **Path Construction:** Always use absolute paths for file operations, resolving relative paths against the project root.
- **Do Not Revert Changes:** Unless explicitly asked or due to an error.

### Workflow

1. **Understand:** Analyze requests, use `search_file_content`, `glob`, `read_file`, `read_many_files` to gather context.
2. **Plan:** Formulate a coherent plan, share concisely if helpful.
3. **Implement:** Use tools (`replace`, `write_file`, `run_shell_command`) adhering to conventions.
4. **Verify (Tests):** Run existing tests if applicable and feasible.
5. **Verify (Standards):** Execute project-specific build, linting, and type-checking commands.

### Key Files for Context

- `README.md`: Project overview, installation, running instructions.
- `DEVELOPER.md`: Developer documentation, architecture, API.
- `backend/requirements.txt`: Backend Python dependencies.
- `frontend/package.json`: Frontend Node.js dependencies.
- `frontend/src/constants.ts`: Shared constants for the frontend, such as file size limits.
- `.context/implementationPlan.md`: Detailed implementation plan for RedactFlow features.

### Important Notes

- All processing is local-only.
- Token maps are in-memory and temporary.
- Prioritize security and privacy in all modifications.
- Explain critical shell commands before execution.

## Rules

- Never delete the `.context` directory or the files stored in it
- Whenever you make significant changes to the project, ensure to update this `GEMINI.md` file to keep things up-to-date
- Never try to delete the `newTaskInstructions.md` file
- When you make changes to the project, once finished reference the `currentProjectStatus.md` file. If the content there differs from the current status of the project, then update this file to reflect the current state (always keep the output for this file under 100 words, contain it in a single paragraph, and timestamp it with the date)
- When asked to create a `README.md` file or modify an existing `README.md` file, ensure it follows a format acceptable for a public GitHub repo. You must include a little section that outlines that the `.context` directory mentions something along the lines of "*.context contains LLM/dev notes, not required for contributors...*"
- This app is run using Docker images and a container. Keep this in mind when making changes to ensure they align with this method of running the app
- After making code changes to the frontend, if relevant, run the `npm run lint` then `npm run build` commands to test the changes
- Use the Context7 MCP any time you need documentation for external services (if the MCP is disconnected, ask to run the `npx -y @upstash/context7-mcp@latest` command in the terminal or at least tell me this command is needed)
- Use the Playwright MCP any time you need to test the UI of the web app (if the MCP is disconnected, ask to run the `npx @playwright/mcp@latest` command in the terminal or at least tell me this command is needed). The local host server to access for testing is <http://localhost:5173/>
