FROM node:18-alpine

WORKDIR /app

# 개발 의존성까지 설치 (vite 포함)
ENV NODE_ENV=development

COPY . .
RUN npm install

# 빌드 실행
RUN npm run build

EXPOSE 4173

# preview 모드로 실행 (빌드된 파일 서빙)
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "4173"]