# Chrome 侧边栏标签管理插件 PRD v1.0.19

## Executive Summary
- 本版本将网页图标策略回退到 `v1.0.14` 的实现方向。
- 目标是撤销后续“休眠标签还原原网页信息”的复杂逻辑，回到更直接、更稳定的网页 favicon 显示规则。

## Problem Statement
- 后续版本为了兼容休眠标签，引入了从 `chrome-extension://.../suspended.html` 中解析原网页标题、URL 和图标的逻辑。
- 这条链路增加了显示规则复杂度，也偏离了 `v1.0.14` 时“普通网页尽量跟随当前标签原始 favicon、内部页不做额外猜测”的策略。
- 当前需要明确回退到 `v1.0.14` 的网页图标行为，降低复杂度，避免后续误判。

## Target Users
- 重度标签用户。
- 更关注稳定显示、而不是对休眠标签做额外还原处理的用户。

## Solution Overview
- 删除 `normalizeTab` 中针对休眠标签的原网页信息提取逻辑。
- 恢复 `v1.0.14` 方案：
  - 普通网页保留原始 `tab.favIconUrl`
  - 侧边栏渲染阶段按 `原始 favicon -> Chrome _favicon -> 首字母` 顺序尝试
  - 内部页仅保留安全协议 favicon，不做原网页还原
- 补测试，确保休眠扩展页不再被改写成原网页显示。

## Success Metrics
- 普通网页标签继续优先显示原始 favicon。
- `chrome-extension://...` 休眠页不再还原成原网页标题、URL 或图标。
- 网页图标渲染链路回到简单且可预测的状态。

## User Stories / Acceptance Criteria
- 作为用户，普通网页标签在侧边栏中应优先显示浏览器提供的原始 favicon。
- 作为用户，休眠扩展页在侧边栏中应保持扩展页当前标题、URL 和图标，不再自动改写成原网页信息。
- 作为用户，网页 favicon 加载失败时，仍可回退到 Chrome `_favicon` 或首字母。

## Out of Scope
- 本版本不处理扩展页图标与顶部标签完全一致的问题。
- 本版本不继续支持休眠标签“显示原网页标签”的还原能力。

## Risks / Dependencies
- 回退后，像 The Marvellous Suspender 这类休眠页将恢复显示扩展页自身信息，而不是原网页信息。
- 这次回退只针对网页图标策略，不涉及 side panel 启动链路修复。

## Open Questions
- 若后续仍需要兼容休眠标签原网页展示，应单独设计一套可开关、可配置的策略，而不是混入当前默认网页图标链路。

## 修改记录
| 版本号 | 日期 | 修改内容 | 修改原因 | 影响范围 | 关联任务 / PR |
| --- | --- | --- | --- | --- | --- |
| 1.0.19 | 2026-03-26 | 将网页图标策略回退到 v1.0.14，移除休眠标签原网页还原逻辑 | 按用户要求恢复到 v1.0.14 方案，降低显示规则复杂度 | `src/shared/domain/normalizeTab.ts`、`src/shared/domain/favicon.ts`、`tests/favicon.test.ts`、`tests/normalizeTab.test.ts` | 当前会话 |
