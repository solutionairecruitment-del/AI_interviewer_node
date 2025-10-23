FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
RUN npm install
COPY . .

# Expose the port your app runs on (adjust if different)
EXPOSE 5000

# Start the application
CMD ["node", "server.js"]
