# Chrome 侧边栏标签管理插件 PRD v2.1.3

## Executive Summary
- 本版本在 `v2.1.2` 的基础上，继续修复侧边栏真实使用中的启动竞态、错误恢复和后台顺序一致性问题。
- 目标是让侧边栏首屏更快可用、活动编组自动展开更稳定、单次命令失败不再把整页锁死。

## Problem Statement
- 当前侧边栏连接后台时会等待后台整条同步队列空闲，首屏快照可能被拖慢。
- 当前用户点击命令与后台同步事件不在同一条顺序线上，容易出现旧状态晚到覆盖新操作。
- 当前本地 bootstrap 快照缺少编组实体，启动阶段可能先渲染错结构，并错过活动折叠组自动展开。
- 当前 `panel/error` 会直接把整页置成不可交互，单次命令失败会被放大成整页故障。

## Target Users
- 依赖 Chrome 原生标签编组进行重度网页整理，并要求侧边栏定位与折叠联动稳定的用户。

## Solution Overview
- 后台引入显式任务队列，统一串行管理事件同步与用户命令，减少异步顺序打架。
- 新连接的侧边栏不再等待后台队列完全清空后才拿首屏快照，而是先立即获取当前 store 快照。
- 侧边栏本地 bootstrap 补查 `tabGroups`，让首屏结构与后台真实快照更接近。
- `panel/error` 改为提示态，不再直接禁用整个列表；下一次成功 patch/snapshot 会自动恢复正常提示状态。
- 整组同步容错改为“组信息失败才删组，标签查询失败先保留组”，避免临时异常被放大成整组消失。

## Success Metrics
- 打开侧边栏时，首个可用快照明显更快到达。
- 用户点击折叠/激活后，旧同步结果不再轻易把新操作短暂盖回去。
- 当前网页所在折叠组在启动时能更稳定地自动展开。
- 某次命令失败后，侧边栏不会长期置灰。

## User Stories / Acceptance Criteria
- 作为用户，我希望侧边栏刚打开时尽快显示真实结构，而不是长时间卡在等待后台。
- 作为用户，我希望自己刚点击的折叠或激活动作，不会被后到的旧状态短暂顶回去。
- 作为用户，我希望偶发一次命令失败时，侧边栏仍然可以继续操作。

## Out of Scope
- 本版本不新增任何新的用户可见功能。
- 本版本不调整当前编组视觉样式。

## Risks / Dependencies
- 顺序统一后，后台所有命令也会走同一条队列，极端高频事件下会更依赖队列正确排空。
- 侧边栏本地 bootstrap 新增一次编组查询，启动时会多一次轻量 API 查询。

## Open Questions
- 当前无新的产品决策问题。

## 修改记录
| 版本号 | 日期 | 修改内容 | 修改原因 | 影响范围 | 关联任务 / PR |
| --- | --- | --- | --- | --- | --- |
| 2.1.3 | 2026-03-28 | 引入后台任务队列、让用户命令串行执行、首屏快照不再等待队列空闲、本地 bootstrap 补查编组、将 `panel/error` 改为非锁死提示态，并补充对应测试 | 修复评审中确认的启动竞态、顺序抖动和错误恢复过猛问题 | `src/background/index.ts`、`src/background/taskQueue.ts`、`src/background/groupSync.ts`、`src/shared/domain/normalizeGroup.ts`、`src/shared/domain/selectors.ts`、`src/sidepanel/App.tsx`、`src/sidepanel/usePanelController.ts`、`tests/*.ts`、`public/manifest.json`、`package.json`、`聊天记录.md` | 当前会话 |
