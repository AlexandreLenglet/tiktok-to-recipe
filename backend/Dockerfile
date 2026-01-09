FROM python:3.11-slim

# Install system dependencies for yt-dlp
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port (will be overridden by Render)
EXPOSE 10000

# Run the application with dynamic port
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-10000}
