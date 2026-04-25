# Chrome 侧边栏标签管理插件 PRD v2.1.6

## Executive Summary
- 本版本在 `v2.1.5` 的基础上，继续做不改变主要用户操作方式的内部稳定性增强。
- 目标是把侧边栏连接后台后的状态变化收成可测试规则，并补上对关键时序场景的覆盖。

## Problem Statement
- 当前侧边栏 `usePanelController.ts` 中，启动本地快照、接收后台快照、接收后台 patch、报错提示、断线重连等逻辑混在同一个 hook 里，时序规则不够集中。
- 存在一个隐蔽风险：如果后台先发来 `panel/patch`，而本地启动快照稍后才完成，本地快照可能把刚收到的远端状态重新盖掉。

## Target Users
- 当前版本主要面向后续维护和稳定性提升，不新增直接面向终端用户的新功能入口。

## Solution Overview
- 抽出侧边栏运行态状态机到独立模块 `src/sidepanel/panelControllerState.ts`，统一管理：
  - 本地启动进度
  - 后台快照
  - 后台 patch
  - 错误提示
  - 断线与连接失败
- 将“是否已经收到远端状态”的判断从仅识别 `panel/snapshot` 扩展为识别 `panel/snapshot` 与 `panel/patch`，避免远端 patch 先到时被本地旧快照覆盖。
- 新增时序测试，覆盖启动、本地快照、远端 patch、远端 snapshot、错误恢复和断线场景。

## Success Metrics
- 不改变现有正常联动、启动恢复和错误提示的主流程行为。
- `usePanelController.ts` 中的状态流转逻辑更集中、更容易维护。
- 新增测试可以稳定覆盖关键时序分支，降低后续修改时引入回归的概率。

## User Stories / Acceptance Criteria
- 作为维护者，我希望侧边栏“收到什么消息就进入什么状态”的规则集中在一个地方，而不是散落在多个 `setState` 调用里。
- 作为维护者，我希望当后台 patch 先于完整 snapshot 到达时，本地启动快照不会把远端最新状态再覆盖回去。
- 作为维护者，我希望错误提示、恢复、断线和本地启动的时序能被测试直接覆盖。

## Out of Scope
- 本版本不新增 UI 视觉改动。
- 本版本不调整后台同步协议和外部消息结构。

## Risks / Dependencies
- 本版本属于内部重构型 patch，需要依赖类型检查、单元测试和构建验证行为未回退。

## Open Questions
- 当前无新的产品决策问题。

## 修改记录
| 版本号 | 日期 | 修改内容 | 修改原因 | 影响范围 | 关联任务 / PR |
| --- | --- | --- | --- | --- | --- |
| 2.1.6 | 2026-03-28 | 抽出侧边栏运行态状态机模块，避免远端 patch 被晚到的本地快照覆盖，并新增时序测试 | 降低连接与同步时序逻辑复杂度，补足关键恢复场景测试覆盖 | `src/sidepanel/usePanelController.ts`、`src/sidepanel/panelControllerState.ts`、`tests/panelControllerState.test.ts`、`package.json`、`package-lock.json`、`public/manifest.json`、`聊天记录.md` | 当前会话 |
