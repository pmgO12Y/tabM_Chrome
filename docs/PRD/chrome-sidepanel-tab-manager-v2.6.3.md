# Chrome Sidepanel Tab Manager v2.6.3

- 版本号：`2.6.3`
- 日期：`2026-04-23`
- 修改类型：`PATCH`

## 修改内容
- 新增独立设置页：
  - 支持从 Chrome 扩展图标右键原生“选项”进入
  - 支持从侧边栏顶部工具栏“设置”按钮进入
- 设置页首版采用单页分组结构：
  - 徽标显示
  - 界面显示（即将支持）
  - 搜索交互（即将支持）
  - 调试选项（即将支持）
- 首版新增可用设置项：
  - `显示工具栏数字徽标`
- 新增“恢复默认设置”按钮
- 工具栏数字徽标改为受设置控制：
  - 开启时显示当前所有窗口的标签总数
  - 关闭时隐藏徽标

## 修改原因
- 用户需要一个正式、可持续扩展的设置入口，而不是把配置散落在侧边栏交互中。
- 用户希望同时支持：
  - 在侧边栏里快速进入设置
  - 从 Chrome 扩展原生“选项”入口进入设置
- 用户还需要能直接控制工具栏徽标是否显示。

## 影响范围
- 扩展入口与构建：
  - `public/manifest.json`
  - `vite.config.ts`
  - `options.html`
- 共享设置模型：
  - `src/shared/settings.ts`
  - `src/shared/types.ts`
  - `src/shared/index.ts`
- 后台徽标联动：
  - `src/background/index.ts`
- 侧边栏工具栏入口：
  - `src/sidepanel/App.tsx`
  - `src/sidepanel/SidepanelToolbar.tsx`
- 设置页前端：
  - `src/options/main.tsx`
  - `src/options/App.tsx`
  - `src/options/styles.css`
- 测试：
  - `tests/settings.test.ts`
  - `tests/e2e/options.spec.ts`

## 兼容性说明
- 不改变现有侧边栏列表结构与交互。
- 不改变现有搜索、拖拽、多选、调试能力。
- 首版仅开放“徽标显示开关”；其它设置分区先展示为“即将支持”。

## 关联任务 / PR
- 关联任务：新增独立设置页与工具栏徽标显示开关
- PR：未创建

## 修改记录
### v2.6.3
- 新增原生 options 设置页入口
- 侧边栏顶部工具栏新增“设置”按钮
- 新增共享设置存储模型，设置保存在 `chrome.storage.local`
- 后台监听设置变化并立即更新 badge
- 设置页新增“恢复默认设置”

## 验证记录
- `npm run typecheck`
- `npm test`
- `npm run build`
