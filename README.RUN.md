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
- 地图（高德地图）
  - 在“设置”页填写 JS SDK Key（仅存储在浏览器）或设置环境变量 `NEXT_PUBLIC_AMAP_JS_SDK_KEY`
- Supabase（可选，用于保存计划）
  - 设置 `NEXT_PUBLIC_SUPABASE_URL` 与 `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Docker 运行
```bash
docker build -t ai-travel-planner-web:latest .
docker run -p 3000:3000 \
  -e LLM_DASHSCOPE_API_KEY=your_key \
  -e NEXT_PUBLIC_AMAP_JS_SDK_KEY=your_amap_key \
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


