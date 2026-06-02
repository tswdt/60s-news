# CloudBase 部署指南

本文档说明如何将 AI 智学助手部署到微信云开发（CloudBase）环境。

---

## 目录

1. [创建微信云开发环境](#1-创建微信云开发环境)
2. [部署云函数 tutor](#2-部署云函数-tutor)
3. [配置环境变量](#3-配置环境变量)
4. [部署 Web 到静态网站托管](#4-部署-web-到静态网站托管)
5. [小程序调用云函数](#5-小程序调用云函数)
6. [为什么不能暴露模型 API Key](#6-为什么不能暴露模型-api-key)

---

## 1. 创建微信云开发环境

### 前置条件

- 已注册微信小程序账号，获得 AppID
- 已安装[微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)

### 步骤

1. 打开微信开发者工具，新建项目，填入 AppID
2. 点击工具栏 **云开发** 按钮
3. 点击 **开通**，输入环境名称（如 `edu-ai-prod`）
4. 选择按量付费或套餐，确认创建
5. 等待环境初始化完成（约 1-2 分钟）

### 记录环境 ID

创建完成后，在云开发控制台首页可以看到 **环境 ID**（格式如 `edu-ai-prod-xxxxx`），后续部署需要用到。

---

## 2. 部署云函数 tutor

### 项目结构

```
cloudfunctions/
├── tutor/                    # AI 辅导主云函数
│   ├── index.ts              # 入口（exports.main）
│   ├── llmRouter.ts          # LLM 路由
│   ├── providers/
│   │   ├── deepseek.ts       # DeepSeek 调用
│   │   └── qwen.ts           # 通义千问调用
│   ├── prompts/
│   │   └── tutorSystemPrompt.ts
│   ├── config.json           # 云函数配置 + 环境变量声明
│   ├── package.json
│   └── tsconfig.json
├── detect-subject/           # 学科识别云函数
│   ├── index.js
│   ├── config.json
│   └── package.json
└── upload-question-image/    # 图片上传云函数
    ├── index.js
    ├── config.json
    └── package.json
```

### 部署步骤

#### 方式一：微信开发者工具部署（推荐）

1. 在微信开发者工具中，找到左侧文件树的 `cloudfunctions` 目录
2. 右键点击 `tutor` 文件夹
3. 选择 **上传并部署：云端安装依赖**
4. 等待部署完成（首次约 1-3 分钟）

#### 方式二：命令行部署

```bash
# 安装微信云开发 CLI
npm install -g @cloudbase/cli

# 登录
tcb login

# 部署云函数
tcb fn deploy tutor --envId 你的环境ID
```

### 注意事项

- `tutor` 云函数使用 TypeScript，部署时会自动编译
- 云函数运行时为 Node.js，`wx-server-sdk` 版本 `~2.6.3`
- 云函数超时时间默认 3 秒，AI 调用需要更长，建议设为 **20 秒**
- 在 `config.json` 中已声明所需环境变量

---

## 3. 配置环境变量

### 云函数环境变量

在云开发控制台 → 云函数 → tutor → 配置 中设置：

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `DEEPSEEK_API_KEY` | DeepSeek API 密钥 | `sk-xxxxxxxx` |
| `DEEPSEEK_BASE_URL` | DeepSeek API 地址 | `https://api.deepseek.com/v1` |
| `DEEPSEEK_MODEL` | DeepSeek 模型名 | `deepseek-chat` |
| `QWEN_API_KEY` | 通义千问 API 密钥 | `sk-xxxxxxxx` |
| `QWEN_BASE_URL` | 通义千问 API 地址 | `https://dashscope.aliyuncs.com/compatible-mode/v1` |
| `QWEN_MODEL` | 通义千问模型名 | `qwen-plus` |
| `QWEN_VL_MODEL` | 通义千问视觉模型名 | `qwen-vl-plus` |
| `DEFAULT_MODEL_PROVIDER` | 默认模型提供商 | `deepseek` |

### 配置步骤

1. 打开云开发控制台
2. 点击 **云函数** → 选择 `tutor`
3. 点击 **函数配置** → **编辑**
4. 在 **环境变量** 中逐条添加上表中的变量
5. 点击 **保存**，等待函数配置更新

### Web 前端环境变量

| 变量名 | 本地开发 | 线上部署 |
|--------|----------|----------|
| `VITE_API_BASE_URL` | `http://localhost:3000/api` | CloudBase HTTP API 地址 |

#### 本地开发

```bash
# apps/web/.env
VITE_API_BASE_URL=http://localhost:3000/api
```

#### 线上部署

```bash
# apps/web/.env.production
VITE_API_BASE_URL=/api
```

部署到 CloudBase 静态托管后，通过云接入（HTTP 触发器）配置路由，`/api` 路径会自动转发到云函数。

---

## 4. 部署 Web 到静态网站托管

### 方式一：CloudBase 静态网站托管

#### 1. 构建 Web 前端

```bash
cd apps/web
npm install
npm run build
```

构建产物在 `apps/web/dist/` 目录。

#### 2. 上传到静态托管

**通过控制台：**

1. 打开云开发控制台 → **静态网站托管**
2. 点击 **上传文件**
3. 选择 `dist/` 目录下的所有文件
4. 上传完成后，访问控制台提供的域名即可

**通过 CLI：**

```bash
tcb hosting deploy dist/ -e 你的环境ID
```

#### 3. 配置云接入（HTTP 触发器）

为了让 Web 前端的 `/api/tutor` 请求能调用云函数：

1. 打开云开发控制台 → **云接入**
2. 点击 **新建规则**
3. 路径填 `/api/tutor`，方法选 `POST`
4. 关联云函数选择 `tutor`
5. 保存

### 方式二：Webify（CloudBase Webify）

Webify 适合 Git 仓库自动部署：

1. 登录 [CloudBase Webify 控制台](https://webify.cloudbase.net/)
2. 点击 **新建应用** → **从 Git 仓库导入**
3. 选择你的仓库，配置：
   - 构建命令：`cd apps/web && npm install && npm run build`
   - 输出目录：`apps/web/dist`
4. 添加环境变量：`VITE_API_BASE_URL` = 你的 CloudBase HTTP API 地址
5. 点击 **部署**

---

## 5. 小程序调用云函数

### 初始化云开发

小程序 `app.js` 中已初始化：

```javascript
App({
  onLaunch: function () {
    wx.cloud.init({
      traceUser: true
    })
  }
})
```

### 调用云函数

小程序通过 `wx.cloud.callFunction` 调用云函数，**不直接调用任何模型 API**：

```javascript
wx.cloud.callFunction({
  name: 'tutor',
  data: {
    userMessage: '三角形内角和为什么是180度？',
    selectedSubject: 'math',
    selectedGrade: '7',
    conversationHistory: [],
    currentStep: 1,
    modelProvider: 'deepseek'
  },
  success: function (res) {
    // res.result = { success: true, parsed: TutoringResponse }
    console.log(res.result.parsed.reply)
    console.log(res.result.parsed.question_to_student)
    console.log(res.result.parsed.visual)
  },
  fail: function (err) {
    console.error('云函数调用失败', err)
  }
})
```

### 封装调用

项目已封装 `utils/tutorApi.js`：

```javascript
var tutorApi = require('../../utils/tutorApi.js')

tutorApi.callTutor({
  userMessage: '三角形内角和为什么是180度？',
  subject: 'math',
  grade: '7',
  conversationHistory: [],
  currentStep: 1,
  model: 'deepseek'
}).then(function (result) {
  // result = TutoringResponse
  console.log(result.reply)
  console.log(result.question_to_student)
})
```

### 数据流

```
小程序端                    云端                        模型服务
   │                         │                            │
   │  wx.cloud.callFunction  │                            │
   │ ──────────────────────> │                            │
   │     name: 'tutor'       │                            │
   │     data: {...}         │                            │
   │                         │  读取 process.env.API_KEY  │
   │                         │  调用 DeepSeek / Qwen API  │
   │                         │ ─────────────────────────> │
   │                         │                            │
   │                         │  <── JSON 响应 ──────────  │
   │                         │                            │
   │  <── TutorCloudResult ─ │                            │
   │     { success, parsed } │                            │
```

---

## 6. 为什么不能暴露模型 API Key

### 安全风险

| 风险 | 说明 |
|------|------|
| **密钥泄露** | API Key 写在小程序或前端代码中，任何人反编译即可获取 |
| **费用盗用** | 攻击者拿到 Key 后可无限调用模型 API，产生高额账单 |
| **数据泄露** | 部分 API Key 有数据访问权限，泄露可能导致训练数据泄露 |
| **合规违规** | 违反模型服务商的使用条款，可能导致账号被封 |

### 小程序代码可被反编译

微信小程序的 `.wxapkg` 包可以被解包，所有 JavaScript 代码（包括字符串常量）都是明文可见的。即使做了代码混淆，API Key 这样的高熵字符串也很容易被提取。

### 前端代码完全公开

Web 前端的 JavaScript 代码在浏览器中运行，用户可以直接查看源码或 Network 面板，任何硬编码的密钥都会暴露。

### 正确做法

```
✅ API Key 存储在云函数环境变量中（服务端）
✅ 小程序/Web 只调用云函数，不接触 API Key
✅ 云函数作为中间层，负责鉴权和调用模型 API
✅ 环境变量在云开发控制台配置，不进入代码仓库
```

### 架构对比

```
❌ 错误：前端直接调用模型 API

  小程序 ──API Key──> DeepSeek / Qwen
           ↑ 密钥暴露在前端代码中


✅ 正确：前端调用云函数，云函数调用模型 API

  小程序 ──callFunction──> 云函数 ──API Key──> DeepSeek / Qwen
                            ↑ 密钥只在服务端环境变量中
```

---

## 附录：环境变量速查

### 云函数环境变量（在云开发控制台配置）

```env
DEEPSEEK_API_KEY=sk-xxxxxxxx
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
DEEPSEEK_MODEL=deepseek-chat
QWEN_API_KEY=sk-xxxxxxxx
QWEN_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
QWEN_MODEL=qwen-plus
QWEN_VL_MODEL=qwen-vl-plus
DEFAULT_MODEL_PROVIDER=deepseek
```

### Web 前端环境变量

```env
# 本地开发 (apps/web/.env)
VITE_API_BASE_URL=http://localhost:3000/api

# 线上部署 (apps/web/.env.production)
VITE_API_BASE_URL=/api
```

### 本地开发服务器环境变量

```env
# 项目根目录 .env（仅本地开发使用，不提交到 Git）
DEEPSEEK_API_KEY=你的密钥
QWEN_API_KEY=你的密钥
DEFAULT_MODEL_PROVIDER=deepseek
PORT=3000
```
