
FROM node:21-alpine

WORKDIR /app

# Install serve globally
RUN npm install -g serve

# Copy all files
COPY . .

# Expose port
EXPOSE 3000

# Start the server
CMD ["serve", ".", "-p", "3000"]
