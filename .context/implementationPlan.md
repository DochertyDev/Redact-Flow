# Implementation Plan: Fix Manual Tokenization 500 Error

## 1. The Goal

Resolve the `500 Internal Server Error` that occurs during manual tokenization while preserving the new auto-detection functionality for repeated text.

## 2. The Problem

The error is caused by a data type mismatch within the backend's manual tokenization workflow.

- The `presidio_service.integrate_manual_token` function returns a list of `RecognizerResult` objects.
- The subsequent function, `presidio_service.anonymize_text`, now incorrectly expects a list of simple dictionaries (`Dict`) and fails when it receives the `RecognizerResult` objects, leading to the 500 error.

## 3. The Solution

The solution is to convert the data back to the expected format at the correct step. I will modify the `manual_tokenization_endpoint` in `backend/app/routes/tokenmap.py` to convert the `List[RecognizerResult]` back into a `List[Dict]` before passing it to the `anonymize_text` function.

This ensures data consistency throughout the process without altering the core logic of the Presidio services.

## 4. Step-by-Step Plan

### Step 1: Modify `backend/app/routes/tokenmap.py`

I will insert a conversion step directly after the `integrate_manual_token` function is called.

- **File to Edit:** `backend/app/routes/tokenmap.py`
- **Location:** Inside the `manual_tokenization_endpoint` function.
- **Change:**
  - After the line `updated_results, additional_occurrences = presidio_service.integrate_manual_token(...)`, I will add code to iterate through `updated_results` and create a new list of dictionaries, `updated_results_dict`, containing the necessary fields (`entity_type`, `start`, `end`, `score`).
  - I will then pass this new `updated_results_dict` to the `presidio_service.anonymize_text` function instead of the original `updated_results`.

### Step 2: Verification

- After applying the fix, the manual tokenization feature should work as intended.
- When a user manually tokenizes a piece of text (e.g., "Jane Doe"), the backend will find all other occurrences, tokenize them, and return a `200 OK` response.
- The frontend will receive the `additional_occurrences` count and display the success toast notification.
- All other application functionalities (initial sanitization, detokenization, etc.) will remain unaffected.
