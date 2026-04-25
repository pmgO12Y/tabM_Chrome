# Chrome 侧边栏标签管理插件 PRD v2.0.20

## Executive Summary
- 本版本微调网页图标尺寸。
- 目标是将网页图标从 `16px` 调整为 `20px`，让图标更明显。

## Problem Statement
- 当前网页图标尺寸为 `16px`，用户要求改成 `20px`。

## Target Users
- 希望网页图标更醒目、更容易快速识别的用户。

## Solution Overview
- 将 `.tab-row__favicon` 容器尺寸改为 `20px × 20px`。
- 将图标图片本身改为 `20px × 20px`。
- 将占位块尺寸同步改为 `20px × 20px`，保持图标缺失时的视觉一致性。

## Success Metrics
- 网页图标显示为 `20px`。
- 图标缺失时占位块也同步为 `20px`。
- 不影响列表交互和构建链路。

## User Stories / Acceptance Criteria
- 作为用户，我希望网页图标更大一些，改成 `20px`。
- 作为用户，我希望真实图标和占位图标尺寸一致。

## Out of Scope
- 本版本不改文字字号、不改布局逻辑、不改交互逻辑。

## Risks / Dependencies
- 图标变大后，若后续还要继续调紧列表密度，可能需要再一起调整行高和间距。

## Open Questions
- 当前无新的产品决策问题。

## 修改记录
| 版本号 | 日期 | 修改内容 | 修改原因 | 影响范围 | 关联任务 / PR |
| --- | --- | --- | --- | --- | --- |
| 2.0.20 | 2026-03-27 | 将网页图标及占位块尺寸从 `16px` 调整为 `20px` | 用户要求网页图标改成 `20px` | `src/sidepanel/styles.css`、`public/manifest.json`、`package.json` | 当前会话 |
