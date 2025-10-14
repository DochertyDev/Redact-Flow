# Security Analysis Report for Redact-Flow

  Date: 2025/10/10

## Executive Summary

  The security analysis of the Redact-Flow application identified 13 vulnerabilities and misconfigurations ranging from "Low" to "High" severity. The most critical issues involve the application's architecture and runtime environment, including a
  High-severity Insecure Direct Object Reference (IDOR) vulnerability, High-severity logging of sensitive data, and High-severity misconfigurations allowing containers to run with root privileges.

  While the application is intended for "local-only" use, which mitigates the immediate risk of some findings, the architectural and configuration flaws are significant and
  should be remediated to adhere to security best practices and prevent future vulnerabilities.

## High-Severity Findings

  **Finding 1: Insecure Direct Object Reference (IDOR)**

* Vulnerability: Insecure Direct Object Reference (IDOR)
* Severity: High
* Location: backend/app/services/tokenmap_service.py, backend/app/routes/detokenize.py  
* Description: The TokenMapService manages access to sensitive token maps using only a token_map_id. The /detokenize endpoint exposes this flaw by allowing any user to retrieve the original PII from a token map if they can guess a valid token_map_id. There are no additional checks (e.g., session ownership) to verify that the user is the legitimate owner of the map.
* Recommendation: The service methods should be refactored to require an ownership token(e.g., a session ID) in addition to the token_map_id. The service should maintain a mapping of which session owns which token map and enforce this check on every request.

  **Finding 2: Logging of Sensitive Information**

* Vulnerability: Logging of Sensitive Information
* Severity: High
* Location: backend/app/services/presidio_service.py
* Description: The anonymize_text function logs the tokens_info object, which is constructed with the original_value of the PII that was detected. This results in sensitive, unredacted data being written directly to the application's logs.
* Recommendation: Remove this logging statement entirely. If debugging is necessary, log only non-sensitive parts of the object, such as the token, entity type, and character offsets, but explicitly exclude the original_value.

  **Finding 3: Container Runs as Root**

* Vulnerability: Container Runs as Root
* Severity: High
* Location: backend/Dockerfile, frontend/Dockerfile
* Description: Neither Dockerfile creates a dedicated non-root user. The application and all its processes are run as the root user inside the container. If an attacker finds an exploit, they will gain root privileges within the container, increasing the impact of the breach.
* Recommendation: In both Dockerfiles, create a dedicated, non-root user and switch to that user with the USER instruction before the final CMD is executed.

## Medium-Severity Findings

  **Finding 4: Verbose Error Messages**

* Vulnerability: Verbose Error Messages
* Severity: Medium
* Location: backend/app/routes/sanitize.py, backend/app/routes/detokenize.py
* Description: The main exception handlers in the API routes include the raw string representation of exceptions in the JSON response, which can leak internal application details.
* Recommendation: Replace the detailed error with a generic error message. A unique correlation ID should be logged on the server and returned to the client for tracking.

  **Finding 5: Sensitive Data Exposure**

* Vulnerability: Sensitive Data Exposure
* Severity: Medium
* Location: backend/app/models/responses.py
* Description: The /sanitize API endpoint returns the original, unredacted PII in its response body, violating the principle of least privilege.
* Recommendation: Remove the original_value field from the TokenInfo model in the SanitizeResponse.

  **Finding 6: Insecure Network Configuration**

* Vulnerability: Insecure Network Configuration (Unintended Exposure)
* Severity: Medium
* Location: docker-compose.yml
* Description: The backend service is configured to listen on all network interfaces (0.0.0.0), which could expose the API to the local network.
* Recommendation: Document this behavior and advise users to ensure their host firewall blocks the exposed port (8000).

  **Finding 7: Dangerous Volume Mounting for Production**

* Vulnerability: Dangerous Volume Mounting for Production
* Severity: Medium
* Location: docker-compose.yml
* Description: The docker-compose.yml file mounts the host's source code directly into the containers, which is insecure for production.
* Recommendation: Create a separate, production-ready Docker Compose file that does not use host-mounted volumes.

  **Finding 8: Insecure Dockerfile Practices (Backend)**

* Vulnerability: Insecure Dockerfile Practices
* Severity: Medium
* Location: backend/Dockerfile
* Description: The backend Dockerfile uses an older base image and includes unnecessary build-time dependencies (gcc, etc.) in the final image.
* Recommendation: Update to a more recent base image (e.g., python:3.11-slim-bookworm) and use a multi-stage build to create a minimal final image.

  **Finding 9: Insecure Development Configuration in Dockerfile (Frontend)**

* Vulnerability: Insecure Development Configuration in Dockerfile
* Severity: Medium
* Location: frontend/Dockerfile
* Description: The frontend Dockerfile is configured for a development environment, running the Vite dev server.
* Recommendation: Create a multi-stage Dockerfile that builds the static assets and serves them from a minimal web server like Nginx.

## Low-Severity Findings

  **Finding 10: Insufficient PBKDF2 Iteration Count**

* Vulnerability: Insufficient PBKDF2 Iteration Count
* Severity: Low
* Location: backend/app/services/encryption_service.py
* Description: The iteration count for PBKDF2 is 100,000, which is lower than current recommendations.
* Recommendation: Increase the iteration count to a modern value, such as the OWASP recommendation of 210,000.

  **Finding 11: Missing Input Validation (Max Length)**

* Vulnerability: Missing Input Validation (Max Length)
* Severity: Low
* Location: backend/app/models/requests.py
* Description: String fields in the request models lack a max_length constraint, posing a potential DoS risk.
* Recommendation: Add a reasonable max_length constraint to all user-provided string fields.

  **Finding 12: Potentially Unsafe Dependency (PyYAML)**

* Vulnerability: Potentially Unsafe Dependency (PyYAML)
* Severity: Low
* Location: backend/requirements.txt
* Description: The project uses PyYAML, which can be unsafe if yaml.load() is used without the SafeLoader.
* Recommendation: Audit the codebase for any usage of yaml.load() and ensure it uses the safe loader. If unused, remove the dependency.

  **Finding 13: Misconfigured Production Dependency**

* Vulnerability: Misconfigured Production Dependency
* Severity: Low
* Location: frontend/package.json
* Description: The @playwright/test testing library is listed as a production dependency.
* Recommendation: Move @playwright/test to devDependencies.
