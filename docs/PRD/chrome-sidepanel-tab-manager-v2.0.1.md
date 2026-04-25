# Chrome 侧边栏标签管理插件 PRD v2.0.1

## Executive Summary
- 本版本继续在 `v2.0.0` 的极简定位器基础上，修正侧边栏图标策略。
- 目标是彻底移除“文字图标”兜底，让侧边栏图标尽量与 Chrome 顶部标签栏保持一致。

## Problem Statement
- `v2.0.0` 虽然已经精简为极简定位器，但在网页图标加载失败时，仍会退回到首字母文字图标。
- 这种文字兜底与 Chrome 顶部标签栏的真实 favicon 表现不一致，也会破坏界面统一性。
- 需要把图标来源进一步收敛为 Chrome 原生图标链路，不再由前端生成文字假图标。

## Target Users
- 希望侧边栏视觉结果尽量贴近 Chrome 原生标签栏的用户。
- 对网页图标一致性要求更高的用户。

## Solution Overview
- 删除侧边栏组件中的首字母文字图标兜底逻辑。
- 保留并强化 Chrome 原生图标链路：
  - 优先使用 `tab.favIconUrl`
  - 再回退到扩展 `_favicon` 代理
- 放宽 `_favicon` 代理适用范围，除了普通网页外，也尝试支持 `chrome://` 与 `chrome-extension://` 页面。
- 当 Chrome 原生图标链路仍无法提供图标时，只显示一个中性占位块，不再显示文字。

## Success Metrics
- 侧边栏不再出现首字母文字图标。
- 普通网页、Chrome 内部页、扩展页在可获取图标时，尽量显示与顶部标签栏一致的图标。
- 不影响现有极简定位功能、单测和构建流程。

## User Stories / Acceptance Criteria
- 作为用户，我在侧边栏中看到的网页图标，不应再是首字母文字。
- 作为用户，普通网页图标应优先与 Chrome 顶部标签栏保持一致。
- 作为用户，Chrome 内部页或扩展页如果浏览器能提供图标，侧边栏也应尽量显示该图标。
- 作为用户，当浏览器确实拿不到图标时，侧边栏也不应再显示文字兜底。

## Out of Scope
- 本版本不改动网页标题、窗口分组、点击跳转和自动定位逻辑。
- 本版本不承诺所有特殊协议页面都一定能拿到图标，是否能显示仍受 Chrome 原生能力限制。

## Risks / Dependencies
- 某些极少数页面如果 Chrome 本身不暴露图标，侧边栏只能显示中性占位块，无法凭空恢复真实 favicon。
- `_favicon` 对部分特殊协议的支持程度取决于 Chrome 本身实现。

## Open Questions
- 如果后续仍有少量特殊页面图标与顶部栏不一致，需要基于真实页面类型逐项验证，而不是重新引入文字兜底。

## 修改记录
| 版本号 | 日期 | 修改内容 | 修改原因 | 影响范围 | 关联任务 / PR |
| --- | --- | --- | --- | --- | --- |
| 2.0.1 | 2026-03-27 | 删除文字图标兜底，放宽 Chrome `_favicon` 代理范围，改为只使用 Chrome 原生图标链路和中性占位块 | 用户要求侧边栏图标不要显示文字，并尽量与 Chrome 顶部标签图标一致 | `src/shared/domain/favicon.ts`、`src/sidepanel/components/VirtualizedWindowList.tsx`、`src/sidepanel/styles.css`、`tests/favicon.test.ts`、`public/manifest.json`、`package.json` | 当前会话 |
