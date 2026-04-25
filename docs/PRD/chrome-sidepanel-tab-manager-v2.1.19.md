# Chrome 侧边栏标签管理插件 PRD v2.1.19

## Executive Summary
- 本版本在 `v2.1.18` 的基础上，为网页组标题按钮增加了轻量缩放按压动画。
- 目标是在点击网页组时提供一点明确的交互反馈，同时尽量不影响性能。

## Problem Statement
- 当前网页组标题点击时几乎只有状态变化，没有明确的按压反馈。
- 用户希望加入简单缩放动画，但要求尽量轻量，不引入明显性能负担。

## Target Users
- 需要通过侧边栏高频点击网页组进行展开/收起的用户。

## Solution Overview
- 仅在 `group-row` 上加入轻量的 `transform: scale(...)` 按压动画：
  - hover 继续沿用现有的亮度变化
  - active 状态增加很小幅度的缩放
- 动画只使用 `transform` 和现有 `filter` 过渡，不引入阴影、模糊、布局变化或 JS 控制状态。
- 增加 `prefers-reduced-motion` 兼容：
  - 当系统偏好减少动画时，关闭该缩放效果

## Success Metrics
- 点击网页组标题时，用户能感知到轻量的按压反馈。
- 展开/收起逻辑、滚动锚定、组头布局和性能表现不受明显影响。

## User Stories / Acceptance Criteria
- 作为用户，我希望点击网页组时有一点明确的反馈，不像现在这么“木”。
- 作为用户，我不希望这个反馈变成拖沓或卡顿的大动画。

## Out of Scope
- 本版本不为窗口行和普通标签行增加同类缩放动画。
- 本版本不引入 JS 动画状态，不改组联动逻辑。

## Risks / Dependencies
- 缩放动画会轻微改变组头按钮的视觉边界，因此幅度必须保持很小。
- 为了控制性能，本次只采用 `transform`，不叠加更重的视觉效果。

## Open Questions
- 当前无新的产品决策问题。

## 修改记录
| 版本号 | 日期 | 修改内容 | 修改原因 | 影响范围 | 关联任务 / PR |
| --- | --- | --- | --- | --- | --- |
| 2.1.19 | 2026-03-28 | 为网页组标题按钮增加轻量缩放按压动画，并补充 reduced motion 兼容与记录文档 | 响应用户对点击反馈的要求，在尽量不影响性能的前提下增强交互感 | `src/sidepanel/styles.css`、`package.json`、`package-lock.json`、`public/manifest.json`、`聊天记录.md` | 当前会话 |
