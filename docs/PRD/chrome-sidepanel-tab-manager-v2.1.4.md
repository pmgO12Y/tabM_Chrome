# Chrome 侧边栏标签管理插件 PRD v2.1.4

## Executive Summary
- 本版本在 `v2.1.3` 稳定性修复基础上，继续收紧扩展资源暴露范围，并优化错误提示文案。
- 目标是在不改变核心功能的前提下，降低不必要的暴露面，并让用户在异常恢复期间更容易理解当前状态。

## Problem Statement
- 当前 `manifest` 将 `sidepanel.html` 和 `assets/*` 通过 `web_accessible_resources` 暴露给 `<all_urls>`，但项目里没有明确需要由外部网页直接访问这些资源的场景。
- 当前侧边栏虽然已经不会因单次错误整页锁死，但用户只看到“同步异常”，仍然容易误判为插件坏掉。

## Target Users
- 依赖插件稳定定位网页标签，同时希望异常提示更清楚、扩展暴露面更小的用户。

## Solution Overview
- 移除不必要的 `web_accessible_resources` 声明，让侧边栏页面与打包资源只服务于扩展自身。
- 在错误提示区域增加“自动恢复中”文案：
  - 若页面仍可交互，提示正在自动恢复
  - 若当前处于断连重连阶段，提示正在尝试重连

## Success Metrics
- `manifest` 不再向任意网页公开 `sidepanel.html` 和 `assets/*`。
- 用户在出现同步异常时，能明确知道插件在自动恢复，而不是误判为彻底失效。

## User Stories / Acceptance Criteria
- 作为用户，我希望扩展只暴露真正必要的资源，不做无意义的公开。
- 作为用户，我希望看到异常提示时，能直接知道当前是“正在恢复”还是“正在重连”。

## Out of Scope
- 本版本不改动后台联动逻辑。
- 本版本不新增任何新的标签管理功能。

## Risks / Dependencies
- 需要确认当前没有页面侧直接依赖 `web_accessible_resources` 中的资源；本项目现状下未发现该依赖。

## Open Questions
- 当前无新的产品决策问题。

## 修改记录
| 版本号 | 日期 | 修改内容 | 修改原因 | 影响范围 | 关联任务 / PR |
| --- | --- | --- | --- | --- | --- |
| 2.1.4 | 2026-03-28 | 移除不必要的 `web_accessible_resources` 暴露，并补充错误态自动恢复提示文案 | 收紧扩展资源暴露范围，并让异常恢复提示更容易理解 | `public/manifest.json`、`src/sidepanel/App.tsx`、`src/sidepanel/styles.css`、`package.json`、`聊天记录.md` | 当前会话 |
