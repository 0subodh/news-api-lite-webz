FROM node:22-alpine

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Set environment variables
ENV NODE_ENV=production

# Command to run the application
CMD ["node", "dist/index.js"]