# Chrome Sidepanel Tab Manager v2.4.1

- 版本号：`2.4.1`
- 日期：`2026-03-29`
- 修改类型：`PATCH`

## 修改内容
- 为顶部操作栏按钮新增自定义悬浮提示。
- 鼠标悬浮或键盘聚焦在按钮上时，会在按钮上方显示该按钮名称。

## 修改原因
- 用户希望按钮名称能在鼠标悬浮时直接显示，而不是只依赖浏览器默认的 `title` 提示。
- 采用纯 CSS 提示可以保持实现简单、性能开销低，不需要新增状态逻辑。

## 影响范围
- 侧边栏顶部操作栏：
  - `src/sidepanel/App.tsx`
  - `src/sidepanel/styles.css`
- 版本号：
  - `package.json`
  - `package-lock.json`
  - `public/manifest.json`

## 关联任务 / PR
- 关联任务：顶部操作栏悬浮显示按钮名称
- PR：待创建

## 修改记录
### v2.4.1
- 为顶部操作栏按钮增加 `data-tooltip`
- 新增轻量 tooltip 样式
- tooltip 在 hover / focus-visible 时显示

## 验证记录
- `npm run typecheck`
- `npm test`
- `npm run build`
