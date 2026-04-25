# Chrome 侧边栏标签管理插件 PRD v2.1.13

## Executive Summary
- 本版本在 `v2.1.12` 的基础上，继续修正组内当前选中态和非当前 Chrome 窗口的 hover 兜底。
- 目标是彻底去掉组内当前选中态的左侧线感，并把 hover 兜底从 pointer 扩展到 pointer + mouse 双通道。

## Problem Statement
- `v2.1.12` 中，组内当前选中态虽然不再用独立竖条，但左侧内阴影仍然在视觉上像一根竖线，不符合“去掉左竖条”的目标。
- `v2.1.12` 中，hover 兜底只依赖 pointer 事件；用户反馈在另一个 Chrome 窗口里仍无悬浮反馈，说明仅靠 pointer 兜底不够。

## Target Users
- 所有在多窗口、多分组场景下使用侧边栏的用户。

## Solution Overview
- 将组内当前选中态进一步收敛为“只保留蓝底，不再额外画左侧线感”。
- 将 hover 兜底从 pointer-only 扩展为 pointer + mouse 双通道：
  - `onPointerEnter / Move / Leave`
  - `onMouseEnter / Move / Leave`
- 保持现有 `hoveredRowKey` 和 `--hovered` class 方案不变，只扩大触发来源。

## Success Metrics
- 组内当前选中态不再出现任何左侧竖条/线感。
- 如果另一个 Chrome 窗口的侧边栏还能收到 mouse 事件但收不到 pointer 事件，悬浮反馈也能显示。

## User Stories / Acceptance Criteria
- 作为用户，我希望组内当前选中项只靠底色高亮，不再看到左侧那条线。
- 作为用户，我希望另一个 Chrome 窗口里的侧边栏只要还能收到鼠标事件，就能尽量出现悬浮反馈。

## Out of Scope
- 本版本不修改组外普通当前选中态。
- 本版本不承诺绕过 Chrome / 系统完全不派发任何指针或鼠标事件的原生限制。

## Risks / Dependencies
- 对非当前窗口 hover 的改进仍属于 best effort；若浏览器既不派发 pointer 也不派发 mouse，则无法由扩展侧代码修复。

## Open Questions
- 当前无新的产品决策问题。

## 修改记录
| 版本号 | 日期 | 修改内容 | 修改原因 | 影响范围 | 关联任务 / PR |
| --- | --- | --- | --- | --- | --- |
| 2.1.13 | 2026-03-28 | 去掉组内当前选中态左侧线感，并将 hover 兜底从 pointer-only 扩展为 pointer + mouse 双通道 | 响应用户反馈，进一步消除组内当前选中态的左线视觉，并提升非当前 Chrome 窗口 hover 触发概率 | `src/sidepanel/components/VirtualizedWindowList.tsx`、`src/sidepanel/styles.css`、`package.json`、`package-lock.json`、`public/manifest.json`、`聊天记录.md` | 当前会话 |
