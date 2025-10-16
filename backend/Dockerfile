# Backend Cloud API bridge
FROM node:20-alpine
WORKDIR /srv
ENV NODE_ENV=production
COPY package.json ./
RUN npm install --omit=dev
COPY server.js ./
COPY data ./data
EXPOSE 8080
CMD ["npm","start"]
