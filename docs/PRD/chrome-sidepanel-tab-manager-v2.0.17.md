# Chrome 侧边栏标签管理插件 PRD v2.0.17

## Executive Summary
- 本版本继续微调网页行左侧对齐距离。
- 目标是将网页图标和标题与左侧的距离从 `16px` 调整为 `12px`，并保持选中竖条同步对齐。

## Problem Statement
- 上一版将网页内容左侧距离调整为 `16px`，用户继续要求改为 `12px`。

## Target Users
- 对列表左侧留白和对齐精度有明确要求的用户。

## Solution Overview
- 将 `.tab-row` 左内边距改为 `12px`。
- 将当前选中竖条的 `left` 同步改为 `4px`，保持与内容起点的相对位置协调。

## Success Metrics
- 网页图标和标题与左侧边缘距离为 `12px`。
- 当前选中竖条不出现错位。

## User Stories / Acceptance Criteria
- 作为用户，我希望网页图标和标题离左侧边缘为 `12px`。
- 作为用户，我希望选中竖条继续与网页内容保持协调对齐。

## Out of Scope
- 本版本不改窗口标题行样式和功能逻辑。

## Risks / Dependencies
- 当前无额外风险，本次是单点样式微调。

## Open Questions
- 当前无新的产品决策问题。

## 修改记录
| 版本号 | 日期 | 修改内容 | 修改原因 | 影响范围 | 关联任务 / PR |
| --- | --- | --- | --- | --- | --- |
| 2.0.17 | 2026-03-27 | 将网页行左内边距从 `16px` 调整为 `12px`，并同步调整选中竖条位置 | 用户要求改成 `12px` | `src/sidepanel/styles.css`、`public/manifest.json`、`package.json` | 当前会话 |
