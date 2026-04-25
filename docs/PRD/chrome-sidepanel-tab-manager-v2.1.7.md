# Chrome 侧边栏标签管理插件 PRD v2.1.7

## Executive Summary
- 本版本在 `v2.1.6` 的基础上，继续做后台总控层的低风险整理。
- 目标是让后台 `index.ts` 更聚焦于调度，把“侧边栏消息发送”和“用户命令执行”拆成独立模块，并补上对应测试。

## Problem Statement
- 当前后台 `src/background/index.ts` 仍同时承载端口管理、消息发送、安全发送失败处理、命令执行和同步编排，职责边界偏宽。
- 这会导致两个问题：
  - 后续继续修改后台联动时，很容易在同一个文件里同时碰到通讯和命令细节。
  - 缺少对“消息广播”和“命令执行”这两块的直接测试，只能通过更高层流程间接覆盖。

## Target Users
- 当前版本主要面向后续维护者和稳定性迭代，不新增直接面向终端用户的新功能入口。

## Solution Overview
- 抽出后台命令执行模块 `src/background/commandExecutor.ts`，统一负责：
  - 激活标签页
  - 聚焦对应窗口
  - 更新网页组折叠状态
- 抽出侧边栏端口通讯模块 `src/background/panelPortHub.ts`，统一负责：
  - 注册 / 解绑侧边栏端口
  - 发送全量快照
  - 广播增量 patch
  - 处理发送失败并移除失效端口
- 让 `src/background/index.ts` 回到“连接监听 + 调度同步 + 调用模块”的角色。
- 新增后台级测试，直接覆盖命令执行和端口广播行为。

## Success Metrics
- 不改变现有用户点击标签、折叠组、接收侧边栏同步结果的行为。
- `src/background/index.ts` 的职责更清晰，后续继续修后台逻辑时更容易定位修改点。
- 新增测试可以稳定覆盖后台消息广播和命令执行这两块基础能力。

## User Stories / Acceptance Criteria
- 作为维护者，我希望后台总控文件不要同时塞满“命令细节”和“消息发送细节”。
- 作为维护者，我希望失效端口在广播失败后能被自动剔除，而这件事有独立测试覆盖。
- 作为维护者，我希望标签激活和编组折叠命令有独立测试，而不是只能靠手点验证。

## Out of Scope
- 本版本不修改后台同步协议。
- 本版本不新增 UI 视觉变化。
- 本版本不改变既有联动策略。

## Risks / Dependencies
- 本版本属于内部重构型 patch，需要依赖类型检查、测试和构建验证行为未回退。

## Open Questions
- 当前无新的产品决策问题。

## 修改记录
| 版本号 | 日期 | 修改内容 | 修改原因 | 影响范围 | 关联任务 / PR |
| --- | --- | --- | --- | --- | --- |
| 2.1.7 | 2026-03-28 | 抽出后台命令执行模块和侧边栏端口通讯模块，并新增对应单元测试 | 降低后台总控文件复杂度，提升后台基础能力的可测试性与可维护性 | `src/background/index.ts`、`src/background/commandExecutor.ts`、`src/background/panelPortHub.ts`、`tests/commandExecutor.test.ts`、`tests/panelPortHub.test.ts`、`package.json`、`package-lock.json`、`public/manifest.json`、`聊天记录.md` | 当前会话 |
