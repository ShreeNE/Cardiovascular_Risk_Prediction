# Stage 1: Build the Next.js Frontend
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# Stage 2: Final Production Container (Python + Node.js)
FROM python:3.11-slim

# Install system dependencies, Node.js 20, and curl
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python ML inference dependencies
COPY model/requirements.txt ./model/requirements.txt
RUN pip install --no-cache-dir -r model/requirements.txt

# Copy model application code and trained artifacts
COPY model/ ./model/

# Copy built frontend application and node_modules from builder
COPY --from=frontend-builder /app/frontend /app/frontend

# Copy startup orchestration script
COPY run.sh /app/run.sh
RUN chmod +x /app/run.sh

# Render injects PORT (defaults to 10000)
ENV PORT=10000
EXPOSE 10000

CMD ["/app/run.sh"]
