# Chrome Sidepanel Tab Manager v2.4.4

- 版本号：`2.4.4`
- 日期：`2026-03-29`
- 修改类型：`PATCH`

## 修改内容
- 将顶部操作栏按钮名称提示从纯 CSS 伪元素重做为独立动态 tooltip。
- tooltip 默认显示在按钮下方，并支持左右避让与空间不足时自动翻到上方。
- tooltip 字号从 `11px` 提升到 `14px`。

## 修改原因
- 用户要求 tooltip 更大，并且在碰到边界时能自动调整位置，不被边界挡住。
- 纯 CSS 伪元素方案无法真正做“智能避让”，只能固定在某个位置。
- 需要改成独立 tooltip 元素 + 动态位置计算，才能稳定处理左右边界和上下空间问题。

## 影响范围
- 侧边栏顶部操作栏：
  - `src/sidepanel/App.tsx`
  - `src/sidepanel/styles.css`
  - `src/sidepanel/toolbarTooltip.ts`
- 测试：
  - `tests/toolbarTooltip.test.ts`
- 版本号：
  - `package.json`
  - `package-lock.json`
  - `public/manifest.json`

## 关联任务 / PR
- 关联任务：顶部操作栏智能悬浮提示
- PR：待创建

## 修改记录
### v2.4.4
- 废弃按钮伪元素 tooltip
- 新增共享动态 tooltip
- 新增 `calculateToolbarTooltipPlacement(...)`
- 新增左右边界钳制与下方优先、空间不足时翻转到上方
- tooltip 字号提升到 `14px`

## 验证记录
- `npm run typecheck`
- `npm test`
- `npm run build`
