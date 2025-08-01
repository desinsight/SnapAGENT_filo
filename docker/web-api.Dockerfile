FROM node:18-alpine

WORKDIR /app

# package.json과 package-lock.json을 먼저 복사 (캐싱 최적화)
COPY package*.json ./

# 개발 의존성 포함 설치
ENV NODE_ENV=development
RUN npm install

# 모든 소스 코드 복사
COPY . .

EXPOSE 5000

# nodemon으로 개발 모드 실행 (코드 변경시 자동 재시작)
CMD ["npm", "run", "dev"]