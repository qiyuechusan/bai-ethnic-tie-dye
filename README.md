# 蓝白之境

白族扎染非遗数字科普站，包含注册登录、用户数据库、访客漫游与多个非遗交互展区。

## 预览

需要 Node.js 22.5 或更高版本：

```powershell
npm start
```

Windows 也可以直接双击项目根目录的 `start.bat` 启动。此项目使用 Node.js 后端，不需要 `app.py` 或 Python Web 框架。

然后打开 `http://127.0.0.1:4174`。首次使用请先注册，注册完成后使用手机号或邮箱登录；也可以选择“暂不登录，先逛一逛”进入访客模式。

登录与注册依赖本地服务，不能通过直接双击 `index.html` 完成认证。

## 用户数据

- SQLite 数据库：`data/lanbai.sqlite`
- 用户表：`users`，保存昵称、登录账号、密码哈希、注册时间和最近登录时间
- 会话表：`sessions`，只保存会话令牌哈希与过期时间
- 密码使用 Node.js `scrypt` 加盐哈希，不保存明文密码
- 登录状态使用 HttpOnly、SameSite Cookie
- `data/*.sqlite` 已加入 `.gitignore`，不会把用户数据库提交到 Git

## 页面

- `index.html`：沉浸式登录页
- `home.html`：六大展区主页面
- `timeline.html`：独立的线装书式七步工艺长卷
- `map.html`：独立的苍洱水墨非遗地图
- `place.html`：根据 `?place=` 参数展示独立地点手记，包含传承人、纹样、民谣、打卡指南和产业数据
- `styles.css`：全局视觉、动效与响应式样式
- `app.js`：靛蓝晕染背景、登录交互、滚动动效
- `server.js`：静态文件服务、注册登录 API、会话校验与 SQLite 数据库
- `package.json`：服务启动配置
- `db/postgres.sql`：地图点位与产业数据的 PostgreSQL 建表及初始数据脚本
- `assets/indigo-textile.svg`：原创扎染蝴蝶花卉纹样矢量图
- `assets/zhoucheng.jpg`、`xizhou.jpg`、`weishan.jpg`：地图地点实拍图
- `assets/echarts.min.js`：本地 ECharts 运行文件
- `preview-login.png`、`preview-home.png`、`preview-map.png`、`preview-place.png`：桌面端视觉预览

当前已完成用户注册登录、工艺长卷、非遗地图和地图数据接口；其余展区与后台内容管理仍为界面原型。

## 已完成的独立页面

- `timeline.html`：线装书式封面、左右交错的七道工序、随滚动延伸的中线缝线、当前工序的翻页式入场，以及“黄绿 → 深靛”的氧化显色动画。
- `map.html`：离线可运行的水墨风示意地图、染缸式点位、水波强调、地点手记侧栏、手绘与实拍切换、路线生长、ECharts 微看板、人物图鉴弹窗，以及“上一站 / 下一站”镜头联动。

直接打开 `home.html` 后，可从顶部导航或六个展区卡片跳转到这两个独立页面，不需要安装任何依赖。

## 地图接口

- `GET /api/map/places`：返回周城、喜洲、巍山的坐标、简介、传承人、特色纹样、地方民谣、打卡指南、图片和地图定位参数。
- `GET /api/map/stats?place=zhoucheng`：返回指定地点的从业人数、经营作坊数、年产值和统计口径。

本地默认使用 SQLite，服务启动时自动写入演示数据。配置 `DATABASE_URL` 后，两个接口会优先从 PostgreSQL 读取；首次部署可执行：

```powershell
psql "$env:DATABASE_URL" -f db/postgres.sql
```

当前产业统计属于演示口径，页面上已明确标注为“待调研”，正式发布前应替换为经过核实的调研数据。
