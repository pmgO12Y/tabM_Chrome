# Chrome 侧边栏标签管理插件 PRD v2.1.22

## Executive Summary
- 本版本在 `v2.1.21` 的基础上，将网页组标题条圆角从 `2px` 调整为 `8px`。
- 目标是让组标题条比 `2px` 更柔和，但仍然比最早的大圆角更克制。

## Problem Statement
- `v2.1.21` 的 `2px` 圆角过于接近直角，不符合用户新的视觉偏好。

## Target Users
- 希望网页组标题条圆角适中、既不太尖也不太圆的用户。

## Solution Overview
- 在 `styles.css` 中将网页组标题条圆角调整为：
  - 展开态：`8px 8px 0 0`
  - 折叠态：`8px`
- 仅修改标题条圆角，不改组内容区、动画和交互逻辑。

## Success Metrics
- 网页组标题条圆角变为 `8px`。
- 展开态和折叠态保持一致的圆角风格。

## User Stories / Acceptance Criteria
- 作为用户，我希望网页组标题条圆角改为 `8px`，视觉上更自然。

## Out of Scope
- 本版本不改组内容区底部圆角。
- 本版本不调整任何其他布局、颜色或动画。

## Risks / Dependencies
- 本次仅改圆角数值，风险极低。

## Open Questions
- 当前无新的产品决策问题。

## 修改记录
| 版本号 | 日期 | 修改内容 | 修改原因 | 影响范围 | 关联任务 / PR |
| --- | --- | --- | --- | --- | --- |
| 2.1.22 | 2026-03-28 | 将网页组标题条圆角从 2px 调整为 8px，并同步更新折叠态圆角与版本记录 | 响应用户对标题条圆角数值的再次微调要求 | `src/sidepanel/styles.css`、`package.json`、`package-lock.json`、`public/manifest.json`、`聊天记录.md` | 当前会话 |
