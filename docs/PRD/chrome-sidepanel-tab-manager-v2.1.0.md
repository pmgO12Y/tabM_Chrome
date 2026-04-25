# Chrome 侧边栏标签管理插件 PRD v2.1.0

## Executive Summary
- 本版本在现有按窗口分组的基础上，增加 Chrome 原生标签编组显示与折叠联动。
- 目标是让已编组标签在侧边栏中按 Chrome 原生编组颜色和标题显示，并与 Chrome 顶部编组的折叠状态双向同步。

## Problem Statement
- 当前侧边栏只支持按窗口分组，不识别 Chrome 原生标签编组。
- 用户希望已编组标签能显示成接近 Chrome 原生编组的样式，并且在侧边栏里展开/收起编组时同步影响 Chrome 顶部真实编组状态。

## Target Users
- 依赖 Chrome 原生标签编组整理大量网页标签的用户。
- 希望在侧边栏中也保留 Chrome 编组心智模型的用户。

## Solution Overview
- 扩展 `TabRecord`、状态快照和 patch/command 协议，正式纳入 `groupId` 与编组实体。
- 后台初始化时同步 tab groups，并监听编组创建、更新、删除及折叠状态变化。
- 侧边栏窗口内标签拆分为“未编组标签”和“已编组块”两类：
  - 未编组标签继续保持原样
  - 已编组标签显示为带 Chrome 原生颜色的编组标题条和内部标签列表
- 点击编组标题条只做展开/收起，并调用 Chrome 原生编组 API 双向同步真实状态。
- 如果当前网页位于折叠编组内，启动定位时会先展开对应编组再滚动到当前网页。

## Success Metrics
- 已编组标签能在侧边栏中显示对应标题、颜色和折叠状态。
- Chrome 顶部折叠/展开编组时，侧边栏同步变化。
- 侧边栏折叠/展开编组时，Chrome 顶部真实编组同步变化。
- 未编组标签继续保持原样，不被强行包进额外分组。

## User Stories / Acceptance Criteria
- 作为用户，我希望已编组标签在侧边栏中按 Chrome 原生编组显示。
- 作为用户，我希望未编组标签继续保持原来的普通列表样式。
- 作为用户，我在侧边栏点编组标题条时，只展开/收起，不跳网页。
- 作为用户，我希望当前网页在编组里时，打开侧边栏能自动展开该编组并定位到当前网页。

## Out of Scope
- 本版本不支持在侧边栏中创建编组、改编组名或改编组颜色。
- 本版本不改变窗口排序规则和现有标签激活逻辑。

## Risks / Dependencies
- 编组联动依赖 Chrome `tabGroups` API 和对应权限。
- 当前采用颜色名到 CSS 变量的静态映射，若未来 Chrome 增加新颜色，需要补充映射。

## Open Questions
- 当前无新的产品决策问题。

## 修改记录
| 版本号 | 日期 | 修改内容 | 修改原因 | 影响范围 | 关联任务 / PR |
| --- | --- | --- | --- | --- | --- |
| 2.1.0 | 2026-03-27 | 增加 Chrome 原生标签编组显示、原生颜色映射、折叠状态双向联动、当前网页所在编组自动展开，并补充对应测试与权限 | 用户要求加入 Chrome 原生编组显示功能并与顶部真实编组联动 | `src/shared/types.ts`、`src/shared/domain/tabState.ts`、`src/shared/domain/selectors.ts`、`src/background/index.ts`、`src/sidepanel/App.tsx`、`src/sidepanel/components/VirtualizedWindowList.tsx`、`src/sidepanel/styles.css`、`tests/*.ts`、`public/manifest.json` | 当前会话 |
