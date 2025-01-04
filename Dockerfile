FROM node:20.12.2-bullseye-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    python3 \
    python3-pip \
    libc6-dev \
    gcc \
    g++ \
    make && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy application code and .env file
COPY . /app

# Install dependencies and globally required tools
RUN npm install && \
    npm install -g nodemon ts-node better-sqlite3 && \
    npm rebuild better-sqlite3 --build-from-source

# Run post-install scripts
RUN npm run postinstall

# Expose the application port
EXPOSE 5050

# Default command
CMD ["npm", "run", "dev"]
