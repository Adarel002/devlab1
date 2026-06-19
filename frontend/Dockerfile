FROM node:18-alpine AS builder

WORKDIR /app
COPY package.json ./
RUN npm install --legacy-peer-deps && npm install ajv@^8.12.0

COPY public/ ./public/
COPY src/ ./src/

ARG REACT_APP_API_URL=http://localhost:8000
ENV REACT_APP_API_URL=$REACT_APP_API_URL

RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
RUN echo 'server { listen 80; root /usr/share/nginx/html; index index.html; location / { try_files $uri $uri/ /index.html; } }' > /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]