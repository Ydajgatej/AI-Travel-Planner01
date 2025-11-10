# 运行说明（AI 旅行规划师 Web）

## 本地开发
1. 安装依赖
   ```bash
   npm i
   npm run dev
   ```
2. 浏览器打开 `http://localhost:3000`

## 必要配置
- LLM（阿里百炼 DashScope）
  - 在“设置”页填写 API Key（仅存储在浏览器）或在服务器设置环境变量 `LLM_DASHSCOPE_API_KEY`
  - 可选：设置模型名 `LLM_DASHSCOPE_MODEL`（默认 `qwen-plus`；前端也会传 `X-LLM-Model`）
- 地图（高德地图）
  - 在“设置”页填写 JS SDK Key（仅存储在浏览器）或设置环境变量 `NEXT_PUBLIC_AMAP_JS_SDK_KEY`
  - 地理编码使用“Web 服务”Key：优先用服务端环境变量 `AMAP_WEB_SERVICE_KEY`（推荐），不要在前端暴露
- Supabase（可选，用于保存计划）
  - 设置 `NEXT_PUBLIC_SUPABASE_URL` 与 `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Docker 运行
```bash
docker build -t ai-travel-planner-web:latest .
docker run -p 3000:3000 \
  -e LLM_DASHSCOPE_API_KEY=your_key \
  -e LLM_DASHSCOPE_MODEL=qwen-plus \
  -e NEXT_PUBLIC_AMAP_JS_SDK_KEY=your_amap_key \
  -e AMAP_WEB_SERVICE_KEY=your_amap_web_service_key \
  -e NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key \
  ai-travel-planner-web:latest
```

## 直接下载镜像并运行（三种方式）

### 方式 A：Docker Hub（示例占位）
维护者将镜像上传到 Docker Hub 后，可直接：
```bash
docker pull your-dockerhub-username/ai-travel-planner-web:latest
docker run -p 3000:3000 \
  -e LLM_DASHSCOPE_API_KEY=your_key \
  -e LLM_DASHSCOPE_MODEL=qwen-plus \
  -e NEXT_PUBLIC_AMAP_JS_SDK_KEY=your_amap_js_key \
  -e AMAP_WEB_SERVICE_KEY=your_amap_web_service_key \
  -e NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key \
  your-dockerhub-username/ai-travel-planner-web:latest
```

### 方式 B：阿里云 ACR（示例）
```bash
docker login registry.cn-hangzhou.aliyuncs.com
docker pull registry.cn-hangzhou.aliyuncs.com/your-namespace/ai-travel-planner-web:latest
docker run -p 3000:3000 \
  -e LLM_DASHSCOPE_API_KEY=your_key \
  -e LLM_DASHSCOPE_MODEL=qwen-plus \
  -e NEXT_PUBLIC_AMAP_JS_SDK_KEY=your_amap_js_key \
  -e AMAP_WEB_SERVICE_KEY=your_amap_web_service_key \
  -e NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key \
  registry.cn-hangzhou.aliyuncs.com/your-namespace/ai-travel-planner-web:latest
```

### 方式 C：镜像文件（.tar）离线运行
维护者在构建后将镜像导出为 .tar 并发布到 Release：
```bash
# 维护者执行（生成 tar）
docker build -t ai-travel-planner-web:latest .
docker save -o ai-travel-planner-web.tar ai-travel-planner-web:latest
```
下载 `ai-travel-planner-web.tar` 后，用户执行：
```bash
docker load -i ai-travel-planner-web.tar
docker run -p 3000:3000 \
  -e LLM_DASHSCOPE_API_KEY=your_key \
  -e LLM_DASHSCOPE_MODEL=qwen-plus \
  -e NEXT_PUBLIC_AMAP_JS_SDK_KEY=your_amap_js_key \
  -e AMAP_WEB_SERVICE_KEY=your_amap_web_service_key \
  -e NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key \
  ai-travel-planner-web:latest
```

## GitHub Actions 推送到阿里云 ACR
在仓库 Secrets 配置：
- `ACR_REGISTRY`: 例如 `registry.cn-hangzhou.aliyuncs.com`
- `ACR_USERNAME`: ACR 用户名
- `ACR_PASSWORD`: ACR 密码/令牌
- `ACR_NAMESPACE`: 命名空间

推送到 `main` 分支会自动构建并推送镜像：`${ACR_REGISTRY}/${ACR_NAMESPACE}/ai-travel-planner-web:latest`

## 注意
- 不要将任何真实 API Key 写入代码库。请通过环境变量或设置页输入。


