# Chrome Sidepanel Tab Manager v2.4.7

- 版本号：`2.4.7`
- 日期：`2026-03-29`
- 修改类型：`PATCH`

## 修改内容
- 将顶部操作栏按钮颜色调深。
- 将顶部操作栏按钮整体改为靠左对齐。

## 修改原因
- 用户要求顶部操作栏按钮更明显一些，并且按钮位置改为靠左。
- 当前问题属于纯样式层调整，不涉及交互逻辑和后台协议。

## 影响范围
- 侧边栏样式：
  - `src/sidepanel/styles.css`
- 版本号：
  - `package.json`
  - `package-lock.json`
  - `public/manifest.json`

## 关联任务 / PR
- 关联任务：顶部操作栏按钮颜色加深并靠左对齐
- PR：待创建

## 修改记录
### v2.4.7
- `panel-toolbar` 从右对齐改为左对齐
- 顶部操作栏按钮颜色从 `#42506a` 调深到 `#24324a`
- hover / active 背景同时轻微加深

## 验证记录
- `npm run typecheck`
- `npm test`
- `npm run build`
