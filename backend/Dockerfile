# Use an official Python runtime as a parent image
FROM python:3.15-rc-slim-trixie

# Set the working directory in the container
WORKDIR /app

# Install system dependencies required for spaCy and other packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy the requirements file and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Download the spaCy language model
RUN python -m spacy download en_core_web_lg

# Copy the rest of the application code
COPY app/ app/

# Expose the port the app runs on
EXPOSE 8000

# Command to run the application
# Using --host 0.0.0.0 to make it accessible from outside the container
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
