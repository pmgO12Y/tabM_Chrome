# Chrome Sidepanel Tab Manager v2.4.3

- 版本号：`2.4.3`
- 日期：`2026-03-29`
- 修改类型：`PATCH`

## 修改内容
- 修复顶部操作栏按钮名称提示被下方窗口栏遮挡的问题。
- 修复顶部操作栏最右侧按钮过于贴边、容易被宿主边界裁切的问题。

## 修改原因
- 用户反馈：
  - tooltip 虽然改到了下方，但仍像是被下方窗口栏挡住
  - 最右侧按钮靠右太紧，出现被屏幕切掉的现象
- 根因是：
  - 工具栏整体层级低于下方 sticky 窗口栏
  - 工具栏右侧继续沿用内容区的极小边距，不适合按钮热区

## 影响范围
- 侧边栏样式：
  - `src/sidepanel/styles.css`
- 版本号：
  - `package.json`
  - `package-lock.json`
  - `public/manifest.json`

## 关联任务 / PR
- 关联任务：修复顶部操作栏 tooltip 遮挡和右侧按钮裁切
- PR：待创建

## 修改记录
### v2.4.3
- 提升 `panel-toolbar` 层级，使其位于窗口栏和组标题吸顶层之上
- 允许工具栏可见溢出内容
- 为工具栏右侧增加独立安全边距
- 为滚动内容区补充较低层级，避免与工具栏争抢覆盖顺序

## 验证记录
- `npm run typecheck`
- `npm test`
- `npm run build`
