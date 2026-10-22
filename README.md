# 蓝白之境

白族扎染非遗数字科普站。当前分支完成了 **模块 5（在线蓝染纹样 DIY 模拟器）** 与 **模块 6（RAG 非遗智能问答轻量版）**，并包含一个可独立运行的 Spring Boot 后端底座。

## 页面

- `index.html`：沉浸式登录页
- `home.html`：六大展区主页面
- `diy.html`：模块 5 · 扎染实验室
- `quiz.html`：模块 6 · 问蓝知染
- `styles.css`：全局视觉、动效与响应式样式
- `lab.css`：模块 5 / 6 的实验室页面样式
- `app.js`：靛蓝晕染背景、登录交互、滚动动效
- `js/`：原生 ES Module（接口封装、Canvas 渲染器、页面逻辑、演示数据）
- `backend/`：Spring Boot 3.5 + JPA + MySQL 8

## 运行

### 1. 启动后端（MySQL）

需要本机已安装 MySQL 8，并知道 root（或其他有建库权限账号）的密码。**不要把密码写进代码。**

```bash
cd backend
DB_PASSWORD=你的MySQL密码 ./mvnw spring-boot:run
```

Windows CMD / PowerShell：

```bat
cd backend
set DB_PASSWORD=你的MySQL密码
mvnw.cmd spring-boot:run
```

默认连接 `localhost:3306`，JDBC URL 带 `createDatabaseIfNotExist=true`，首次启动会自动创建 `baizu_tiedye` 数据库、建表并写入模块 5/6 的种子数据。

打开 <http://localhost:8080/home.html>，从「展区 01」或「展区 04」进入即可。

### 2. 前后端分离调试

后端仍按上面的方式启动在 8080；前端在仓库根目录启动静态服务器：

```bash
npx serve . -l 5500
```

然后访问 <http://localhost:5500/home.html>。`js/config.js` 会自动把 5500 端口的接口指向 `http://localhost:8080/api`，后端已配置 CORS。

> `diy.html` / `quiz.html` 使用 ES Module，不能直接双击 `file://` 打开，必须通过静态服务器或 Spring Boot 访问。

## 接口

- `GET /api/diy/methods`：扎结方式列表
- `GET /api/quiz/questions?limit=8&category=`：答题列表（不含正确答案与解析）
- `POST /api/quiz/answer`：提交答案，返回判定、解析、来源与知识块

统一返回 `{ code, message, data }`，`code = 0` 表示成功。

## 数据库说明

模块 5 / 6 只创建自己使用的表：

- `dye_tie_method`
- `knowledge_chunk`
- `quiz_question`
- `quiz_option`

表由 JPA `ddl-auto=update` 在启动时创建；种子数据由 `DataInitializer` 在表为空时写入。没有创建用户、纹样、步骤等其他组员的表。
