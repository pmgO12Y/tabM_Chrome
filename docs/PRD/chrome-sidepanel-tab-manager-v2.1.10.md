# Chrome 侧边栏标签管理插件 PRD v2.1.10

## Executive Summary
- 本版本在 `v2.1.9` 的基础上，修复同一个 Chrome 网页组在侧边栏中被错误拆成多个组块的问题。
- 目标是保证同一个 `groupId` 在侧边栏中只渲染成一个组标题块，即使状态顺序暂时不完美，也不出现多个同名组。

## Problem Statement
- 当前侧边栏分组逻辑依赖“同组标签在状态数组里必须连续”这个前提。
- 一旦同一个 `groupId` 的标签在状态顺序里被临时拆成多段，侧边栏就会把它渲染成多个同名组块，导致用户明明只有一个组，却看到多个相同标题的组。

## Target Users
- 所有在侧边栏中查看和操作 Chrome 网页组的用户。

## Solution Overview
- 调整 `src/shared/domain/selectors.ts` 中的分组规则：
  - 从“只合并连续同组标签”改为“同一个 `groupId` 只生成一个组项”
  - 后续再次遇到相同 `groupId` 的标签时，追加到已存在的组项中
- 新增测试覆盖“同一个组在状态里被拆成多段时，侧边栏仍只显示一个组”的场景。

## Success Metrics
- 同一个 Chrome 网页组在侧边栏中不再重复出现多个同名组块。
- 组内标签数量统计正确。
- 不影响未分组标签和普通窗口行的渲染。

## User Stories / Acceptance Criteria
- 作为用户，我希望一个真实存在的 Chrome 网页组在侧边栏里只显示一次。
- 作为用户，我希望即使后台状态同步有瞬时抖动，侧边栏也不要把同一个组拆成多个“66”。

## Out of Scope
- 本版本不调整网页组颜色策略。
- 本版本不修改组折叠交互逻辑。

## Risks / Dependencies
- 本版本属于选择器层 patch，需要通过类型检查、测试和构建验证未引入回归。

## Open Questions
- 当前无新的产品决策问题。

## 修改记录
| 版本号 | 日期 | 修改内容 | 修改原因 | 影响范围 | 关联任务 / PR |
| --- | --- | --- | --- | --- | --- |
| 2.1.10 | 2026-03-28 | 修复同一 `groupId` 在状态中被拆段时侧边栏重复渲染多个组块的问题，并新增对应测试 | 避免用户明明只有一个 Chrome 网页组，却在侧边栏看到多个同名组标题 | `src/shared/domain/selectors.ts`、`tests/selectors.test.ts`、`package.json`、`package-lock.json`、`public/manifest.json`、`聊天记录.md` | 当前会话 |
