# Chrome Sidepanel Tab Manager v2.6.2

- 版本号：`2.6.2`
- 日期：`2026-04-22`
- 修改类型：`PATCH`

## 修改内容
- 在 Chrome 工具栏扩展图标上显示数字徽标（badge），实时显示当前标签页总数。
  - 统计范围：所有窗口
  - 计数口径：所有标签页（包含 chrome://、chrome-extension:// 等）
  - 展示口径：精确数字，始终显示

## 修改原因
- 让用户无需打开侧边栏，也能快速感知当前标签规模。

## 影响范围
- 后台：
  - `src/background/index.ts`

## 兼容性说明
- 不改变侧边栏结构与交互，仅新增工具栏徽标显示。

## 验证记录
- `npm run typecheck:app`
- `npm test`
- `npm run build`

## 关联任务 / PR
- 关联任务：工具栏徽标显示当前总标签数
- PR：未创建
