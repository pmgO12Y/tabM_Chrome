# Chrome Sidepanel Tab Manager v2.3.11

- 版本号：`2.3.11`
- 日期：`2026-03-29`
- 修改类型：`PATCH`

## 修改内容
- 将当前窗口中当前选中的标签文字加粗。
- 仅作用于 `tab-row--current-active`，不影响其他窗口中的活动标签。

## 修改原因
- 用户要求：当前窗口的选中标签字体加粗。
- 当前代码已经区分：
  - `tab-row--current-active`：当前窗口中当前选中的标签
  - `tab-row--window-active`：其他窗口中的活动标签
- 因此本次只需要加强当前选中态，不需要改结构或逻辑。

## 影响范围
- 侧边栏样式：
  - `src/sidepanel/styles.css`
- 版本号：
  - `package.json`
  - `package-lock.json`
  - `public/manifest.json`

## 关联任务 / PR
- 关联任务：当前窗口选中标签字体加粗
- PR：待创建

## 修改记录
### v2.3.11
- `tab-row--current-active` 新增 `font-weight: 600`

## 验证记录
- `npm run typecheck`
- `npm test`
- `npm run build`
