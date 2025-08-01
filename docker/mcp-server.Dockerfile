FROM node:18-alpine

WORKDIR /app

# 개발 의존성까지 설치
ENV NODE_ENV=development

COPY . .
RUN npm install

# 실행 시에는 production 환경
ENV NODE_ENV=production

CMD ["npm", "start"]