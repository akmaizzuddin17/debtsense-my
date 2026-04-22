FROM node:20-alpine

WORKDIR /app

COPY . .

RUN cd backend && npm install
RUN cd frontend && npm install && npm run build

EXPOSE 8080
ENV PORT=8080

CMD ["node", "backend/server.js"]
