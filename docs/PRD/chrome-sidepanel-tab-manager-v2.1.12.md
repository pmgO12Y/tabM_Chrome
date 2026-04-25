# Chrome 侧边栏标签管理插件 PRD v2.1.12

## Executive Summary
- 本版本在 `v2.1.11` 的基础上，改造组内当前选中态和侧边栏悬浮态。
- 目标是让组内当前选中标签不再出现左竖条与 favicon 打架，同时给非当前 Chrome 窗口的侧边栏悬浮反馈补一层 JS 兜底。

## Problem Statement
- 当前组内当前选中态仍依赖左侧竖条，虽然已从外层绘制，但视觉仍然复杂，不如直接改为不占横向空间的内阴影方案稳。
- 当前侧边栏 hover 主要依赖 CSS `:hover`，在另一个未激活的 Chrome 窗口里可能无法稳定触发，导致窗口行、组行、标签行没有悬浮反馈。

## Target Users
- 所有使用侧边栏在多窗口、多分组间切换标签的用户。

## Solution Overview
- 将组内当前选中态从“左侧独立竖条”改为“蓝底 + 左侧内阴影高亮”。
- 在列表渲染层增加 JS `hoveredRowKey`，通过指针事件手动补 `--hovered` class。
- 所有现有 hover 视觉规则同时支持：
  - 浏览器原生 `:hover`
  - JS 手动补的 hovered class

## Success Metrics
- 组内当前选中态不再与 favicon 抢空间。
- 组内外图标起点继续保持一致。
- 另一个 Chrome 窗口的侧边栏只要还能收到指针事件，就能出现 hover 反馈。

## User Stories / Acceptance Criteria
- 作为用户，我希望组内当前选中标签保留明显高亮，但不要再有竖条和图标互相打架。
- 作为用户，我希望在另一个 Chrome 窗口里移动鼠标时，侧边栏尽量仍能显示 hover 反馈。
- 作为用户，我希望组外普通选中态仍保持原有左竖条表现，不被这次改动带偏。

## Out of Scope
- 本版本不调整分组逻辑。
- 本版本不修改颜色体系和组标题样式。

## Risks / Dependencies
- 对非当前 Chrome 窗口 hover 的修复属于 best effort，只要浏览器仍派发指针事件就能生效；若浏览器/系统完全不派发，则表现退化为当前行为。

## Open Questions
- 当前无新的产品决策问题。

## 修改记录
| 版本号 | 日期 | 修改内容 | 修改原因 | 影响范围 | 关联任务 / PR |
| --- | --- | --- | --- | --- | --- |
| 2.1.12 | 2026-03-28 | 将组内当前选中态改为内阴影高亮，并为窗口行、组行、标签行增加 JS hover 兜底 class | 修复组内选中视觉冲突，并尽量改善非当前 Chrome 窗口中侧边栏 hover 不出现的问题 | `src/sidepanel/components/VirtualizedWindowList.tsx`、`src/sidepanel/styles.css`、`tests/virtualizedWindowList.test.ts`、`package.json`、`package-lock.json`、`public/manifest.json`、`聊天记录.md` | 当前会话 |
