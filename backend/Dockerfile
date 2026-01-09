FROM python:3.11-slim

# Install system dependencies for yt-dlp
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY main.py .

# Default port
ENV PORT=8080

# Start command - Railway injects PORT
CMD python -c "import os; port=int(os.environ.get('PORT', 8080)); import uvicorn; uvicorn.run('main:app', host='0.0.0.0', port=port)"
