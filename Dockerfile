# ==================== 第一阶段：构建 ====================
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

ARG DEPLOY_ENV
ENV DEPLOY_ENV=$DEPLOY_ENV

COPY . .
RUN npm run build

# ==================== 第二阶段：运行 ====================
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

# 配置模板含 ${COWATCH_BACKEND_URL} / ${MONITOR_BACKEND_URL} 占位符
# nginx 官方镜像启动时自动 envsubst 替换
COPY nginx.conf /etc/nginx/templates/default.conf.template

EXPOSE 80
