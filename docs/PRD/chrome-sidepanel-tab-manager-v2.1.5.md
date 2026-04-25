# Chrome 侧边栏标签管理插件 PRD v2.1.5

## Executive Summary
- 本版本在 `v2.1.4` 的基础上，继续做不改变用户行为的内部整理。
- 目标是让侧边栏页面组件更轻、后台总控文件更聚焦，降低后续继续迭代时的维护成本。

## Problem Statement
- 当前 `App.tsx` 既负责渲染，又内嵌当前活动编组自动展开的状态机逻辑，页面组件承担了过多行为细节。
- 当前后台 `index.ts` 仍然混着事件注册、同步编排和 Chrome 查询工具函数，文件职责边界还不够清楚。

## Target Users
- 当前版本主要面向后续维护与迭代，不新增直接面向终端用户的新功能。

## Solution Overview
- 将“当前活动编组自动展开”逻辑抽成独立的 `useActiveGroupAutoExpand` hook，页面组件只负责组合数据和渲染。
- 将后台里与 Chrome 查询相关的纯工具逻辑抽到 `chromeQueries.ts`，让 `index.ts` 更聚焦于调度和同步流程。

## Success Metrics
- 不改变现有标签定位、编组联动、错误提示与启动恢复行为。
- `App.tsx` 和后台 `index.ts` 的职责更清楚，后续改动更容易定位。

## User Stories / Acceptance Criteria
- 作为维护者，我希望页面层不要同时承载渲染和复杂副作用状态机。
- 作为维护者，我希望后台总控文件更像调度器，而不是把查询细节也全塞在一起。

## Out of Scope
- 本版本不新增用户可见功能。
- 本版本不改变现有视觉样式和后台联动策略。

## Risks / Dependencies
- 本版本主要是重构型 patch，需要通过现有类型检查、测试和构建来确认行为未变。

## Open Questions
- 当前无新的产品决策问题。

## 修改记录
| 版本号 | 日期 | 修改内容 | 修改原因 | 影响范围 | 关联任务 / PR |
| --- | --- | --- | --- | --- | --- |
| 2.1.5 | 2026-03-28 | 抽出当前活动编组自动展开 hook，并将后台 Chrome 查询工具迁移到独立模块 | 降低页面组件和后台总控文件复杂度，便于后续维护和继续迭代 | `src/sidepanel/App.tsx`、`src/sidepanel/useActiveGroupAutoExpand.ts`、`src/background/index.ts`、`src/background/chromeQueries.ts`、`package.json`、`public/manifest.json`、`聊天记录.md` | 当前会话 |
