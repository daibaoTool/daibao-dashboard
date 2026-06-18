# daibao-dashboard 实现任务

## 一、CoWatch-backend 迭代

### 1. 数据库 & 鉴权

- [ ] 在 `src/database/schema.ts` 新增 `admin_users` 表（id / username / password_hash / permissions / created_at）
- [ ] 新增 `src/database/adminUser/index.ts`（createAdminUser / getAdminUserByUsername / getAdminUserById）
- [ ] 新增 `src/middleware/adminMiddleware.ts`（校验 admin token + permissions 粒度：`admin` 或 `admin:${appKey}`）
- [ ] 新增 `src/utils/jwt.ts` 扩展：`generateAdminTokens` / `verifyAdminToken`（或复用现有 generateTokens，payload 增加 permissions 字段）

### 2. Admin 登录接口

- [ ] 新增 `src/controllers/admin/auth.ts`（adminLogin / adminRefresh）
- [ ] 新增 `src/routes/admin/auth.ts`
  - `POST /api/auth/admin/login`
  - `POST /api/auth/admin/refresh`
- [ ] 在 `src/routes/index.ts` 注册 admin auth 路由

### 3. Admin 业务接口

- [ ] 新增 `src/controllers/admin/users.ts`
  - `GET /api/admin/users`（用户列表，含 plans / isBanned）
  - `PATCH /api/admin/users/:id/ban`（封号/解封）
  - `PATCH /api/admin/users/:id/plan`（设置权益）
  - `DELETE /api/admin/users/:id`（删除用户）
- [ ] 新增 `src/controllers/admin/rooms.ts`
  - `GET /api/admin/rooms`（房间列表，含 memberCount / videoCount）
  - `DELETE /api/admin/rooms/:id`（删除房间）
- [ ] 新增 `src/controllers/admin/inviteCodes.ts`
  - `GET /api/admin/invite-codes`
  - `POST /api/admin/invite-codes`
- [ ] 新增 `src/routes/admin/index.ts`（统一注册 adminMiddleware + 子路由）
- [ ] 在 `src/routes/index.ts` 挂载 `/admin` 路由

### 4. users 表补充 is_banned 字段

- [ ] 在 `src/database/schema.ts` `runMigrations` 中追加迁移：`ALTER TABLE users ADD COLUMN is_banned INTEGER NOT NULL DEFAULT 0`
- [ ] 在 `src/database/user/index.ts` 新增 `banUser(userId, banned)` 方法

---

## 二、daibao-dashboard 新建仓库

### 1. 工程初始化

- [ ] 初始化项目（package.json / tsconfig.json / babel.config.json）
- [ ] 配置 `webpack.common.js` / `webpack.dev.js` / `webpack.prod.js`（参考 CoWatch webpack 配置）
- [ ] 配置 `public/index.html`
- [ ] 配置 `src/index.tsx` 入口 + `src/App.tsx`
- [ ] 配置 SCSS 支持（sass-loader / css-modules）
- [ ] 安装依赖：react / react-dom / react-router-dom / axios / antd / echarts / echarts-for-react / sass

### 2. 基础工具层

- [ ] 实现 `src/utils/token.ts`（accessToken 存取，key: `admin_access_token`）
- [ ] 实现 `src/utils/request.ts`
  - `monitorRequest`：baseURL 指向 monitor-backend，自动携带 Authorization header
  - `cowatchRequest`：baseURL 指向 CoWatch-backend，自动携带 Authorization header
  - 响应拦截器：401 时自动调 refresh，刷新失败跳 `/login`
- [ ] 实现 `src/styles/_variables.scss`（颜色 / 间距变量）
- [ ] 实现 `src/styles/index.scss`（全局 reset + antd 主题覆盖）

### 3. 类型定义

- [ ] 新增 `src/types/admin.ts`（AdminUser / AdminRoom / InviteCode / AdminPermissions）
- [ ] 新增 `src/types/monitor.ts`（PerfStat / EventRow / StatsQuery）
- [ ] 新增 `src/types/api.ts`（统一响应结构 ApiResponse\<T>）

### 4. API 层

- [ ] 实现 `src/api/monitor.ts`
  - `getStats(query)` → `GET /monitor/stats`
  - `getEvents(query)` → `GET /monitor/stats/events`
- [ ] 实现 `src/api/cowatch.ts`
  - `adminLogin(username, password)` → `POST /api/auth/admin/login`
  - `adminRefresh()` → `POST /api/auth/admin/refresh`
  - `getAdminUsers()` → `GET /api/admin/users`
  - `banUser(id, banned)` → `PATCH /api/admin/users/:id/ban`
  - `setUserPlan(id, plan)` → `PATCH /api/admin/users/:id/plan`
  - `deleteUser(id)` → `DELETE /api/admin/users/:id`
  - `getAdminRooms()` → `GET /api/admin/rooms`
  - `deleteRoom(id)` → `DELETE /api/admin/rooms/:id`
  - `getInviteCodes()` → `GET /api/admin/invite-codes`
  - `createInviteCode(data)` → `POST /api/admin/invite-codes`

### 5. Context & 路由

- [ ] 实现 `src/context/AdminContext.tsx`
  - 状态：userInfo / accessToken / permissions（AdminPermissions）/ currentAppKey
  - 方法：login / logout / setAppKey
  - `parsePermissions` 工具函数
- [ ] 实现 `src/components/PermissionGuard/index.tsx`
  - props：`require: 'canViewMonitor' | 'canViewBusiness' | 'canAccessAdmin'`，可选 `appKey`
  - 无权限时重定向 `/login` 或渲染 403 提示
- [ ] 实现 `src/router/index.tsx`（React Router v6，含 PermissionGuard 嵌套）

### 6. AppLayout 组件

- [ ] 实现 `src/components/AppLayout/index.tsx`
  - Ant Design Layout：Sider（产品列表）+ Header（三 tab）+ Content（Outlet）
  - 产品列表当前硬编码 `['cowatch']`，点击切换 appKey 并跳转
  - 三 tab（Monitor / Business / Admin）根据当前路由高亮，无权限的 tab 隐藏
- [ ] 实现 `src/components/AppLayout/index.module.scss`

### 7. ECharts 通用封装

- [ ] 实现 `src/components/EChartsWrapper/index.tsx`（封装 echarts-for-react，统一 loading / empty / resize 处理）

### 8. 登录页

- [ ] 实现 `src/pages/Login/index.tsx`（Ant Design Form，调 adminLogin，成功后跳转）
- [ ] 实现 `src/pages/Login/index.module.scss`

### 9. Monitor 模块

- [ ] 实现 `src/pages/Monitor/Perf/index.tsx`
  - Ant Design RangePicker 时间筛选
  - 5 张指标卡片（FCP / LCP / CLS / TTFB / INP 均值）
  - ECharts 折线图展示各指标趋势
- [ ] 实现 `src/pages/Monitor/Perf/index.module.scss`
- [ ] 实现 `src/pages/Monitor/Errors/index.tsx`
  - 类型筛选 Select + 时间 RangePicker
  - ECharts 柱状图（各类型错误数量）
  - Ant Design Table（含展开行显示 props 详情）
- [ ] 实现 `src/pages/Monitor/Errors/index.module.scss`

### 10. Business 模块

- [ ] 实现 `src/pages/Business/Users/index.tsx`
  - 3 张统计卡片（总用户数 / 本周新增 / VIP 数量）
  - ECharts 折线图（按日注册量趋势，前端从列表数据聚合）
  - ECharts 饼图（普通 vs VIP 分布）
- [ ] 实现 `src/pages/Business/Users/index.module.scss`
- [ ] 实现 `src/pages/Business/Rooms/index.tsx`
  - 2 张统计卡片（总房间数 / 活跃房间数）
  - ECharts 柱状图（近 14 天活跃趋势）
  - Ant Design Table（房间列表）
- [ ] 实现 `src/pages/Business/Rooms/index.module.scss`
- [ ] 实现 `src/pages/Business/Traffic/index.tsx`
  - 3 张统计卡片（视频总数 / 已完成切片数 / 切片中数量）
  - ECharts 折线图（按日上传量趋势，前端从列表数据聚合）
- [ ] 实现 `src/pages/Business/Traffic/index.module.scss`

### 11. Admin 模块

- [ ] 实现 `src/pages/Admin/Users/index.tsx`
  - 用户名搜索框
  - Ant Design Table（含封号/解封、设置权益、删除操作列）
  - BanConfirmModal（二次确认）
  - SetPlanModal（Select 选择 plan：vip:basic / 无）
  - DeleteConfirmModal（二次确认）
- [ ] 实现 `src/pages/Admin/Users/index.module.scss`
- [ ] 实现 `src/pages/Admin/InviteCodes/index.tsx`
  - 生成邀请码按钮 + CreateInviteModal（code / max_count / grant_plan）
  - Ant Design Table（邀请码列表）
- [ ] 实现 `src/pages/Admin/InviteCodes/index.module.scss`

---

## 三、完成标准

- [ ] CoWatch-backend Admin 接口联调通过
- [ ] daibao-dashboard 登录 → 三模块九页面全部可正常访问
- [ ] PermissionGuard 权限隔离生效（无权限路由正确重定向）
- [ ] ECharts 图表正常渲染，含空态处理
- [ ] Admin 操作（封号/改权益/删除/生成邀请码）均有二次确认且操作后刷新列表

---

完成所有任务后将 `- [ ]` 改为 `- [x]`
