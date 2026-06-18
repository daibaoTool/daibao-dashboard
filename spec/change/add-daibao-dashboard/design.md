# daibao-dashboard 技术设计

## 1. 功能概述

新建 `daibao-dashboard` 前端仓库，作为 CoWatch 体系的内部运营大盘网。消费 `monitor-backend`（监控数据）和 `CoWatch-backend`（业务数据 + Admin 操作），提供 Monitor / Business / Admin 三合一运营工具，支持以 `appKey` 为维度管理多个子产品。

---

## 2. 涉及仓库与模块

| 仓库 | 变更类型 | 内容 |
|------|---------|------|
| `daibao-dashboard`（新建） | 🆕 全量实现 | 登录、三模块九个页面、公共框架 |
| `CoWatch-backend` | 🔄 迭代 | 新增 `admin_users` 表、`/api/admin/*` 路由组、`adminMiddleware` |

---

## 3. 技术选型

| 项目 | 选型 |
|------|------|
| 构建 | Webpack + React + TypeScript（与 CoWatch 完全一致） |
| UI 组件库 | Ant Design |
| 图表库 | ECharts（通过 `echarts-for-react` 封装） |
| CSS | SCSS Modules |
| 状态管理 | React Context（AdminContext：登录态 + permissions + 当前 appKey） |
| HTTP 请求 | axios（封装 monitorRequest / cowatchRequest 两个实例） |
| 路由 | React Router v6 |

---

## 4. 项目结构

```
daibao-dashboard/
  src/
    api/
      monitor.ts          → 调 monitor-backend（/monitor/stats/*）
      cowatch.ts          → 调 CoWatch-backend（/api/admin/*、/api/rooms、/api/auth/admin）
    components/
      AppLayout/          → 整体布局（左侧产品列表 + 右侧三 tab + 内容区）
      PermissionGuard/    → 路由权限守卫
      EChartsWrapper/     → ECharts 通用封装组件
    context/
      AdminContext.tsx    → 登录态、permissions、当前 appKey
    pages/
      Login/              → 登录页
      Monitor/
        Perf/             → 性能指标页
        Errors/           → 错误列表页
      Business/
        Users/            → 用户增长页
        Rooms/            → 房间统计页
        Traffic/          → 流量成本页
      Admin/
        Users/            → 用户管理页
        InviteCodes/      → 邀请码管理页
    router/
      index.tsx           → 路由配置（含 PermissionGuard 嵌套）
    styles/
      _variables.scss
      index.scss
    utils/
      request.ts          → axios 实例封装（monitorRequest / cowatchRequest）
      token.ts            → accessToken 存取（localStorage）
    index.tsx
    App.tsx
```

---

## 5. 路由设计

```
/login                              → 登录页（无需鉴权）

/:appKey                            → 产品首页（重定向到 /:appKey/business/users）
  /:appKey/monitor/perf             → Monitor：性能指标
  /:appKey/monitor/errors           → Monitor：错误列表
  /:appKey/business/users           → Business：用户增长
  /:appKey/business/rooms           → Business：房间统计
  /:appKey/business/traffic         → Business：流量成本
  /:appKey/admin/users              → Admin：用户管理
  /:appKey/admin/invite-codes       → Admin：邀请码管理
```

路由守卫层级：
```
<AdminContext.Provider>
  └── <PermissionGuard>（校验登录态）
        ├── AppLayout（左侧产品列表 + 右侧三 tab）
        │     └── <PermissionGuard require={`admin:${appKey}`}>
        │           └── Admin 页面
        └── /login（不需要 guard）
```

---

## 6. 页面设计

### 6.1 登录页（`/login`）

#### 功能描述
Admin 账号登录，获取 accessToken，refreshToken 写入 HttpOnly Cookie。

#### 交互流程
- When 用户提交用户名+密码，the system shall 调 `POST /api/auth/admin/login`，成功后将 accessToken 存入 localStorage，跳转到 `/cowatch/business/users`。
- When accessToken 过期，the system shall 自动调 `POST /api/auth/admin/refresh`（Cookie 携带 refreshToken），刷新成功后重试原请求，无需用户感知。
- When refresh 也失败，the system shall 清除登录态，跳转 `/login`。

#### 组件结构
```
LoginPage
  └── Ant Design Form（用户名 + 密码 + 登录按钮）
```

---

### 6.2 整体布局（AppLayout）

#### 功能描述
所有登录后页面的外层容器。左侧为产品列表（当前只有 cowatch），点击后切换 appKey；右侧顶部为 Monitor / Business / Admin 三个 tab，内容区根据当前路由渲染对应页面。

#### 组件结构
```
AppLayout
  ├── Sider（Ant Design Layout.Sider）
  │     └── 产品列表（Menu，当前仅 cowatch）
  └── Content
        ├── TabBar（Monitor / Business / Admin 三 tab，Ant Design Tabs）
        └── Outlet（子路由内容区）
```

#### 交互流程
- When 用户点击左侧产品，the system shall 切换 appKey，路由跳转至 `/:appKey/business/users`（默认落 Business tab）。
- When 用户点击三 tab，the system shall 路由跳转至该 tab 的默认子页面。
- When 当前用户无 `admin:${appKey}` 权限，the system shall 隐藏 Admin tab（不显示，而非禁用）。

---

### 6.3 Monitor - 性能指标（`/:appKey/monitor/perf`）

#### 功能描述
展示当前 appKey 下的 Web Vitals 性能指标均值（FCP / LCP / CLS / TTFB / INP），支持时间范围筛选。

#### 交互流程
- When 页面加载，the system shall 调 `GET /monitor/stats?appKey=xxx` 获取性能聚合数据，用折线图/卡片展示各指标均值。
- When 用户切换时间范围，the system shall 重新请求并刷新图表。

#### 组件结构
```
PerfPage
  ├── TimeRangePicker（Ant Design RangePicker）
  ├── MetricCards（5张卡片：FCP / LCP / CLS / TTFB / INP 均值）
  └── PerfTrendChart（ECharts 折线图，多指标趋势）
```

---

### 6.4 Monitor - 错误列表（`/:appKey/monitor/errors`）

#### 功能描述
展示当前 appKey 下的错误事件列表（js_error / promise_rejection / resource_error），支持按类型筛选和时间范围筛选。

#### 交互流程
- When 页面加载，the system shall 调 `GET /monitor/stats/events?appKey=xxx&type=error` 获取错误事件列表。
- When 用户筛选错误类型或时间范围，the system shall 重新请求并刷新列表。
- When 用户点击某条错误，the system shall 展开 props（message / stack / url 等）详情。

#### 组件结构
```
ErrorsPage
  ├── FilterBar（类型 Select + 时间 RangePicker）
  ├── ErrorCountChart（ECharts 柱状图，各类型错误数量）
  └── ErrorTable（Ant Design Table，含展开行显示 props 详情）
```

---

### 6.5 Business - 用户增长（`/:appKey/business/users`）

#### 功能描述
展示当前 appKey 注册用户总量、近期注册趋势、订阅分布（普通用户 vs vip:basic）。

#### 交互流程
- When 页面加载，the system shall 调 `GET /api/admin/users` 获取用户列表，前端聚合计算趋势和分布数据。

#### 组件结构
```
UsersBusinessPage
  ├── StatCards（总用户数 / 本周新增 / VIP 数量）
  ├── RegisterTrendChart（ECharts 折线图，按日注册量）
  └── PlanDistributionChart（ECharts 饼图，普通 vs VIP）
```

---

### 6.6 Business - 房间统计（`/:appKey/business/rooms`）

#### 功能描述
展示房间总量、活跃房间数（近 7 天有人进入）、每个房间的视频数和成员数。

#### 交互流程
- When 页面加载，the system shall 调 `GET /api/admin/rooms` 获取房间列表，含视频数、成员数、最近活跃时间。

#### 组件结构
```
RoomsBusinessPage
  ├── StatCards（总房间数 / 活跃房间数）
  ├── RoomActivityChart（ECharts 柱状图，近 14 天活跃房间数趋势）
  └── RoomTable（Ant Design Table：房间名 / 成员数 / 视频数 / 创建时间）
```

---

### 6.7 Business - 流量成本（`/:appKey/business/traffic`）

#### 功能描述
展示视频上传总量（GB）、视频切片总数，辅助内测阶段分析存储和带宽成本。

#### 交互流程
- When 页面加载，the system shall 调 `GET /api/admin/rooms` + `GET /api/admin/videos`（待新增），聚合展示流量数据。

#### 组件结构
```
TrafficPage
  ├── StatCards（视频总数 / 总存储量 / 总切片数）
  └── UploadTrendChart（ECharts 折线图，按日上传量趋势）
```

---

### 6.8 Admin - 用户管理（`/:appKey/admin/users`）

#### 功能描述
查看全部用户，支持封号/解封、手动设置会员等级、删除用户。

#### 交互流程
- When 页面加载，the system shall 调 `GET /api/admin/users` 获取用户列表。
- When 管理员点击封号，the system shall 弹出确认框，确认后调 `PATCH /api/admin/users/:id/ban`，刷新列表。
- When 管理员点击设置权益，the system shall 弹出 Modal 选择 plan，调 `PATCH /api/admin/users/:id/plan`。
- When 管理员点击删除，the system shall 弹出二次确认框，确认后调 `DELETE /api/admin/users/:id`，刷新列表。

#### 组件结构
```
AdminUsersPage
  ├── SearchBar（用户名搜索）
  └── UserTable（Ant Design Table）
        └── 操作列：封号/解封 | 设置权益 | 删除
              ├── BanConfirmModal
              ├── SetPlanModal（Select 选择 plan）
              └── DeleteConfirmModal
```

---

### 6.9 Admin - 邀请码管理（`/:appKey/admin/invite-codes`）

#### 功能描述
查看所有邀请码的使用情况，生成新邀请码（指定类型和可用次数）。

#### 交互流程
- When 页面加载，the system shall 调 `GET /api/admin/invite-codes` 获取邀请码列表。
- When 管理员点击生成邀请码，the system shall 弹出 Modal 填写配置，调 `POST /api/admin/invite-codes`，刷新列表。

#### 组件结构
```
InviteCodesPage
  ├── 生成邀请码按钮
  │     └── CreateInviteModal（code / max_count / grant_plan）
  └── InviteTable（Ant Design Table：code / used_count / max_count / grant_plan）
```

---

## 7. 接口设计

### 7.1 daibao-dashboard 消费的接口

#### monitor-backend（现有，无需新增）
```typescript
// 性能聚合统计
GET /monitor/stats?appKey=cowatch&startTime=xxx&endTime=xxx
// 响应
interface StatsResponse {
  perf: Array<{ name: string; count: number; avg_value: number }>;
  counts: Array<{ type: string; name: string; count: number }>;
}

// 原始事件列表（错误列表用）
GET /monitor/stats/events?appKey=cowatch&type=error&limit=50&offset=0
// 响应：EventRow[]
```

#### CoWatch-backend（需新增 Admin 路由组）
```typescript
// Admin 登录（新增）
POST /api/auth/admin/login
Body: { username: string; password: string }
Response: { accessToken: string; userInfo: { username: string; permissions: string[] } }

// Admin 刷新 Token（新增，复用 Cookie 体系）
POST /api/auth/admin/refresh
Cookie: refresh_token
Response: { accessToken: string }

// 用户列表（新增）
GET /api/admin/users
Response: Array<{
  id: string; username: string; nickname: string;
  plans: string[]; isBanned: boolean;
  createdAt: number; avatarUrl: string;
}>

// 封号/解封（新增）
PATCH /api/admin/users/:id/ban
Body: { banned: boolean }

// 设置权益（新增）
PATCH /api/admin/users/:id/plan
Body: { plan: string }  // 'vip:basic' | ''（空字符串表示移除）

// 删除用户（新增）
DELETE /api/admin/users/:id

// 房间列表（新增）
GET /api/admin/rooms
Response: Array<{
  id: string; name: string; memberCount: number;
  videoCount: number; createdAt: number;
}>

// 删除房间（新增）
DELETE /api/admin/rooms/:id

// 邀请码列表（新增）
GET /api/admin/invite-codes
Response: Array<{ code: string; used_count: number; max_count: number; grant_plan: string | null }>

// 生成邀请码（新增）
POST /api/admin/invite-codes
Body: { code: string; max_count: number; grant_plan?: string }
```

> ⚠️ 缺少接口：`GET /api/admin/videos`（视频列表，含文件大小，用于流量成本统计）—— 当前 room_videos 表无文件大小字段，流量成本页第一期可用视频数量 + 切片数量近似替代，后续补充。

---

## 8. CoWatch-backend 迭代内容

### 8.1 新增 admin_users 表

```sql
CREATE TABLE IF NOT EXISTS admin_users (
  id           TEXT PRIMARY KEY,
  username     TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  permissions  TEXT NOT NULL DEFAULT '["admin"]',  -- JSON 数组
  created_at   INTEGER NOT NULL
);
```

### 8.2 新增路由结构

```
src/routes/
  admin/
    index.ts         ← 注册 adminMiddleware，子路由自动继承
    users.ts
    rooms.ts
    inviteCodes.ts
src/middleware/
  adminMiddleware.ts ← 校验 admin token + permissions
src/controllers/
  admin/
    users.ts
    rooms.ts
    inviteCodes.ts
```

### 8.3 adminMiddleware 逻辑

```
1. 从 Authorization: Bearer <token> 提取 token
2. verifyToken(token) 得到 { adminId, permissions }
3. 校验 permissions 是否包含 'admin' 或 'admin:${req.params.appKey}'
4. 挂载 req.adminId 和 req.permissions，调用 next()
5. 失败返回 401 / 403
```

---

## 9. 类型定义

```typescript
// src/types/admin.ts（daibao-dashboard）

export interface AdminUser {
  id: string;
  username: string;
  nickname: string;
  plans: string[];
  isBanned: boolean;
  createdAt: number;
  avatarUrl: string;
}

export interface AdminRoom {
  id: string;
  name: string;
  memberCount: number;
  videoCount: number;
  createdAt: number;
}

export interface InviteCode {
  code: string;
  used_count: number;
  max_count: number;
  grant_plan: string | null;
}

export interface AdminPermissions {
  canViewMonitor: boolean;
  canViewBusiness: boolean;
  canAccessAdmin: boolean;
  adminAppKeys: string[];  // [] 表示无限制（全产品 admin）
}
```

---

## 10. 权限模型

```typescript
// AdminContext 提供的 permissions 解析规则
// token payload 中 permissions 字段示例：["admin", "can_view_monitor"]

function parsePermissions(permissions: string[]): AdminPermissions {
  return {
    canViewMonitor: permissions.includes('admin') || permissions.includes('can_view_monitor'),
    canViewBusiness: permissions.includes('admin') || permissions.includes('can_view_business'),
    canAccessAdmin: permissions.some(p => p === 'admin' || p.startsWith('admin:')),
    // 'admin' → [] 表示不限制；'admin:cowatch' → ['cowatch']
    adminAppKeys: permissions.includes('admin')
      ? []
      : permissions.filter(p => p.startsWith('admin:')).map(p => p.split(':')[1]),
  };
}
```

PermissionGuard 使用：

```tsx
// Monitor / Business：校验 canViewMonitor / canViewBusiness
<PermissionGuard require="canViewMonitor"><PerfPage /></PermissionGuard>

// Admin：校验 canAccessAdmin + appKey 是否在 adminAppKeys 内
<PermissionGuard require="admin" appKey={appKey}><AdminUsersPage /></PermissionGuard>
```

---

## 11. 关键决策记录

| 决策点 | 结论 | 原因 |
|--------|------|------|
| 构建方式 | Webpack + React + TypeScript | 与 CoWatch 完全一致，配置可复用 |
| 图表库 | ECharts | 大盘类产品标配，功能全，中文文档好 |
| UI 组件库 | Ant Design | 后台管理标配，Table/Form/Modal 开箱即用 |
| 鉴权方案 | 独立 admin_users 表 + JWT | 与 CoWatch 用户体系隔离，更安全 |
| 无感刷新 | 复用 CoWatch 双 token 体系 | accessToken localStorage + refreshToken HttpOnly Cookie |
| CSS 方案 | SCSS Modules | 与 CoWatch 一致，Ant Design 兜底基础样式 |
| 状态管理 | React Context | 规模匹配，无需引入额外依赖 |
| Admin 路由 | 带 /:appKey 前缀 | 三模块完全对称，心智模型统一，权限粒度更细 |
| 不新建 admin-backend | Admin 接口加在 CoWatch-backend | SQLite 进程模型决定数据库归属，避免跨容器文件共享风险 |
