# Chrome Sidepanel Tab Manager v2.3.6

- 版本号：`2.3.6`
- 日期：`2026-03-28`
- 修改类型：`PATCH`

## 修改内容
- 修复“有些标签标题会正常显示 `...`，有些却继续往右顶”的不一致问题。
- 强化组标题与标签标题在 `flex` 布局下的收缩规则，确保窄宽度时更稳定地进入省略态。
- 为组标题按钮和标签按钮增加 `overflow: hidden`，防止内容在极窄宽度下继续向右溢出。

## 修改原因
- 用户补充了一个关键事实：并不是所有标题都会被挡住，而是只有一部分标题没有进入 `...` 省略态。
- 这说明问题不只是“滚动条盖住了文字”，而是不同布局分支里，标题文字的收缩约束不一致。
- 特别是组内标签和组标题所在的 `flex` 容器中，单靠 `min-width: 0` 和 `max-width: 100%` 还不够稳，浏览器有时仍会让文字继续往右顶。

## 影响范围
- 侧边栏样式：
  - `src/sidepanel/styles.css`
- 版本号：
  - `package.json`
  - `package-lock.json`
  - `public/manifest.json`

## 关联任务 / PR
- 关联任务：修复最窄侧边栏下标题省略不一致
- PR：待创建

## 修改记录
### v2.3.6
- `group-row` 增加 `overflow: hidden`
- `group-row__title` 改为 `flex: 1 1 0` 并增加 `width: 0`
- `tab-row` 增加 `overflow: hidden`
- `tab-row__title` 改为 `flex: 1 1 0` 并增加 `width: 0`

## 验证记录
- `npm run typecheck`
- `npm test`
- `npm run build`
