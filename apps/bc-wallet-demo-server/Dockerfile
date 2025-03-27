FROM node:18-alpine as base

WORKDIR /app

# Copy all files
COPY . .

# Install dependencies
RUN npm install -g typescript ts-node
RUN npm install --legacy-peer-deps

EXPOSE 3000

# Run the application
CMD ["npm", "start"]
