# Chrome 侧边栏标签管理插件 PRD v2.0.18

## Executive Summary
- 本版本修正插件刚打开时的首次自动定位链路。
- 目标是确保侧边栏面板启动后，会自动平滑定位到当前窗口里的当前网页，即使目标行是在初次渲染后才真正出现在列表里。

## Problem Statement
- 当前实现只在 `currentActiveTabId` 变化时触发滚动。
- 如果插件刚打开时当前网页目标已知，但目标行要等列表真正渲染后才挂到 DOM，上述条件不会再次触发，导致用户体感上像“启动时没有自动定位”。

## Target Users
- 希望插件一打开就自动对准当前网页的用户。

## Solution Overview
- 在 `VirtualizedWindowList` 中新增“首次启动定位是否完成”的本地引用。
- 滚动触发条件不再只看 `currentActiveTabId`，还要看目标行是否已真实进入 `rows` 并挂到 DOM。
- 当目标行第一次真正出现时，即使 `currentActiveTabId` 没变，也补做一次平滑滚动。
- 增加针对“目标行后出现”的组件测试。

## Success Metrics
- 打开侧边栏后，自动平滑滚到当前窗口里的当前网页。
- 目标行若稍后才渲染出来，也仍能补做首次定位。
- 不影响后续顶部标签切换时的自动定位能力。

## User Stories / Acceptance Criteria
- 作为用户，我刚打开侧边栏时，希望它自动滑到我当前正在看的网页。
- 作为用户，即使列表稍后才渲染完成，首次定位也不能丢。
- 作为用户，后续切换 Chrome 顶部标签时，自动定位仍应正常工作。

## Out of Scope
- 本版本不改窗口排序、窗口标题命名和高亮逻辑。
- 本版本不改后台消息协议和数据结构。

## Risks / Dependencies
- 新增组件测试依赖 DOM 环境中的 `scrollIntoView` mock。

## Open Questions
- 当前无新的产品决策问题。

## 修改记录
| 版本号 | 日期 | 修改内容 | 修改原因 | 影响范围 | 关联任务 / PR |
| --- | --- | --- | --- | --- | --- |
| 2.0.18 | 2026-03-27 | 修正首次自动定位判定，补充目标行后出现时的滚动逻辑，并新增组件测试覆盖 | 用户要求插件刚启动时自动定位到当前窗口当前网页 | `src/sidepanel/components/VirtualizedWindowList.tsx`、`tests/virtualizedWindowList.test.tsx`、`public/manifest.json`、`package.json` | 当前会话 |
