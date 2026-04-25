# Chrome 侧边栏标签管理插件 PRD v2.1.14

## Executive Summary
- 本版本在 `v2.1.13` 的基础上，撤回对非当前 Chrome 窗口 hover 的 JS 兜底方案，并将组容器外框改细。
- 目标是减少无效复杂度，同时保留分组边界感但降低左侧竖线的视觉重量。

## Problem Statement
- `v2.1.13` 中的 `hoveredRowKey`、`pointer + mouse` 事件监听和 `--hovered` class 分支，只有在浏览器愿意派发事件时才可能生效；如果未激活 Chrome 窗口根本不派发事件，这套代码就不会产生真实收益。
- 用户当前看到的“左竖条”主要来自组容器边框，而不是组选中态本身，因此需要单独调整组边框粗细。

## Target Users
- 所有使用 Chrome 侧边栏管理标签页、并开启网页组展示的用户。

## Solution Overview
- 删除 `VirtualizedWindowList` 中的 JS hover 兜底：
  - 移除 `hoveredRowKey`
  - 移除窗口行、组行、标签行上的 `pointer` / `mouse` 监听
  - 移除样式里的 `--hovered` class 分支
- 保留浏览器原生 `:hover` 行为，不再为非激活窗口额外堆叠无效逻辑。
- 将组容器外框从 `3px` 收细到 `2px`，并同步微调组内标签左内边距，避免图标对齐被破坏。

## Success Metrics
- 代码层不再保留对非激活窗口 hover 的无效 JS 兜底实现。
- 组左侧外框明显比 `v2.1.13` 更轻，不再显得过粗。
- 组内图标与组外图标仍保持现有对齐。

## User Stories / Acceptance Criteria
- 作为用户，我希望去掉修不好的 hover 补丁，让代码回到更简单、更稳定的原生行为。
- 作为用户，我希望组左边那条线仍能表示“这是一个组”，但不要像之前那么粗重。

## Out of Scope
- 本版本不尝试绕过 Chrome 未激活窗口不派发鼠标事件的原生限制。
- 本版本不删除组边框，只做“改细”而不是“去掉”。

## Risks / Dependencies
- 如果 Chrome 原生行为未来变化，非当前窗口 hover 是否可见仍完全由浏览器决定。
- 组边框变细后，组块存在感会略微减弱，但仍保留颜色边界。

## Open Questions
- 当前无新的产品决策问题。

## 修改记录
| 版本号 | 日期 | 修改内容 | 修改原因 | 影响范围 | 关联任务 / PR |
| --- | --- | --- | --- | --- | --- |
| 2.1.14 | 2026-03-28 | 撤回非当前窗口 hover 的 JS 兜底方案，并将组容器外框从 3px 调整为 2px，同时补偿组内标签内边距 | 用户确认该 hover 方案在目标场景下无效，希望代码回归简洁并减轻组左边框视觉重量 | `src/sidepanel/components/VirtualizedWindowList.tsx`、`src/sidepanel/styles.css`、`tests/virtualizedWindowList.test.ts`、`package.json`、`package-lock.json`、`public/manifest.json`、`聊天记录.md` | 当前会话 |
