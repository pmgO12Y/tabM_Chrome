# Chrome Sidepanel Tab Manager v2.3.5

- 版本号：`2.3.5`
- 日期：`2026-03-28`
- 修改类型：`PATCH`

## 修改内容
- 修复侧边栏缩到最窄时，右侧文字被滚动条遮挡的问题。
- 为侧边栏滚动区域增加右侧安全区，避免滚动条直接压住窗口标题、组标题和标签标题。
- 增强标题文本在极窄宽度下的压缩与省略行为，确保更早进入 `ellipsis` 显示。

## 修改原因
- 用户反馈：侧边栏缩到最窄时，右侧文字又被挡住了。
- 根因不是标题字符串过长本身，而是两件事叠在一起：
  - 滚动条直接覆盖在内容右边缘上
  - 标题元素在极窄宽度下没有足够稳定地进入收缩 / 省略状态

## 影响范围
- 侧边栏样式：
  - `src/sidepanel/styles.css`
- 版本号：
  - `package.json`
  - `package-lock.json`
  - `public/manifest.json`

## 关联任务 / PR
- 关联任务：修复最窄侧边栏时右侧文字被挡住
- PR：待创建

## 修改记录
### v2.3.5
- 新增 `--scrollbar-safe-inline-end` 变量，统一管理滚动条右侧安全区
- `panel-scroll` 增加右侧 padding，并补充 `scrollbar-gutter: stable`
- `window-row__title` 改为 `display: block`，并增加 `max-width: 100%`
- `group-row__title` 改为 `display: block`、`flex: 1 1 auto`，并增加 `max-width: 100%`
- `tab-row__title` 改为 `display: block`，并增加 `max-width: 100%`

## 验证记录
- `npm run typecheck`
- `npm test`
- `npm run build`
