# Chrome 侧边栏标签管理插件 PRD v2.1.11

## Executive Summary
- 本版本在 `v2.1.10` 的基础上，修复组内当前选中标签时左侧竖条与 favicon 挤在一起的问题。
- 目标是在不破坏组内外图标对齐的前提下，让组内选中态继续保留左侧高亮竖条。

## Problem Statement
- 当前组内标签为了和组外对齐，左内边距被压缩到很小。
- 在这种布局下，组选中态仍沿用按钮本体的 `::before` 左竖条方案，会和 favicon 争抢同一块空间，造成“竖条和图标折叠/重叠”的视觉问题。

## Target Users
- 所有在侧边栏中使用网页组并切换当前活动标签的用户。

## Solution Overview
- 将“组内当前选中态”的左侧竖条从 `.tab-row` 本体移到外层包装层 `.group-block__item` 绘制。
- 为“组内当前选中项”增加明确的专用 class，用于只在该场景启用独立前导槽样式。
- 普通标签和组外标签继续沿用现有按钮本体的竖条方案，不改变其它选中态逻辑。

## Success Metrics
- 组内当前选中标签仍保留左侧蓝色竖条。
- 竖条不再压到 favicon 上。
- 组内图标与组外图标横向起点继续保持一致。

## User Stories / Acceptance Criteria
- 作为用户，我希望组内标签被选中时，左侧仍有明显高亮提示。
- 作为用户，我希望高亮竖条不要和 favicon 重叠，也不要让图标左右跳动。
- 作为用户，我希望组外普通标签的选中样式不受影响。

## Out of Scope
- 本版本不修改组外选中态样式。
- 本版本不调整分组逻辑和颜色逻辑。

## Risks / Dependencies
- 本版本属于渲染层 patch，需要通过类型检查、测试和构建确认未引入样式分支回归。

## Open Questions
- 当前无新的产品决策问题。

## 修改记录
| 版本号 | 日期 | 修改内容 | 修改原因 | 影响范围 | 关联任务 / PR |
| --- | --- | --- | --- | --- | --- |
| 2.1.11 | 2026-03-28 | 将组内当前选中标签的左侧竖条改由外层容器绘制，并新增对应 class 与测试 | 修复组内当前选中态下竖条与 favicon 重叠的问题，同时保持组内外图标对齐 | `src/sidepanel/components/VirtualizedWindowList.tsx`、`src/sidepanel/styles.css`、`tests/virtualizedWindowList.test.ts`、`package.json`、`package-lock.json`、`public/manifest.json`、`聊天记录.md` | 当前会话 |
