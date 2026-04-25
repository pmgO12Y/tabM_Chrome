# Chrome 侧边栏标签管理插件 PRD v1.0.18

## Executive Summary
- 本版本修复侧边栏启动遮罩长期不消失的问题。
- 根因是启动控制脚本放在 `sidepanel.html` 内联执行，而 Chrome 扩展页默认会拦截内联脚本。

## Problem Statement
- 近期侧边栏加入了启动桥接层，用于控制加载动画、超时提示和启动失败提示。
- 该逻辑最初写在 `sidepanel.html` 的内联脚本中，导致在扩展页环境下无法执行。
- 结果是应用即使正常加载，启动遮罩也可能一直停留，看起来像“永远转圈”。

## Target Users
- 使用 Chrome Side Panel 的重度标签用户。
- 需要明确启动状态反馈的用户。

## Solution Overview
- 将启动桥接层从 `sidepanel.html` 内联脚本迁移到外部脚本 `public/sidepanel-boot.js`。
- 保留原有三类能力：
  - 启动成功时移除遮罩
  - 启动报错时显示失败文案
  - 启动超时时显示超时文案
- 增加全局类型声明，避免 React 侧访问 `window.__sidepanelBoot` 时重复写本地类型。

## Success Metrics
- 扩展页环境下启动遮罩可正常消失。
- 启动失败或超时时仍能显示明确反馈。
- 不再因扩展 CSP 限制导致“无限转圈”。

## User Stories / Acceptance Criteria
- 作为用户，当侧边栏正常启动时，我能直接看到应用内容，启动动画会消失。
- 作为用户，当侧边栏启动失败时，我能看到明确失败提示，而不是一直转圈。
- 作为用户，当初始化超时时，我能看到超时提示，而不是无限等待。

## Out of Scope
- 本版本不修改标签同步、搜索、图标策略等业务逻辑。
- 本版本不调整 Side Panel UI 风格。

## Risks / Dependencies
- 若主应用脚本完全无法加载，仍需依赖 `sidepanel-boot.js` 自身稳定执行。
- 外部启动脚本必须保持极简，避免再次引入初始化失败点。

## Open Questions
- 若修复后仍存在启动失败，下一步需继续定位是主应用模块报错，还是浏览器 API 调用卡住。

## 修改记录
| 版本号 | 日期 | 修改内容 | 修改原因 | 影响范围 | 关联任务 / PR |
| --- | --- | --- | --- | --- | --- |
| 1.0.18 | 2026-03-26 | 将启动桥接层迁移为外部脚本，补充全局类型声明 | 修复扩展页内联脚本被 CSP 拦截导致的无限转圈 | `sidepanel.html`、`public/sidepanel-boot.js`、`src/shared/types/window.d.ts` | 当前会话 |
