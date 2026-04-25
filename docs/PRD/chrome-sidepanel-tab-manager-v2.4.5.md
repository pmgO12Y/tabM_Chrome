# Chrome Sidepanel Tab Manager v2.4.5

- 版本号：`2.4.5`
- 日期：`2026-03-29`
- 修改类型：`PATCH`

## 修改内容
- 将顶部操作栏中的 `全部展开` 和 `全部收起` 合并为 1 个动态按钮。
- 动态按钮采用“优先全部展开”规则：
  - 只要还有任何窗口或组处于收起状态，就显示 `全部展开`
  - 只有当所有窗口和组都展开时，才切换为 `全部收起`
- 图标、tooltip 和 `aria-label` 全部随当前动作同步切换。

## 修改原因
- 用户希望简化顶部操作栏，减少按钮数量。
- 当前代码已经可以同时拿到：
  - 本地收起窗口状态 `collapsedWindowIds`
  - 后台同步回来的组收起状态 `group.collapsed`
- 因此可以稳定判断当前应该显示“全部展开”还是“全部收起”。

## 影响范围
- 侧边栏顶部操作栏：
  - `src/sidepanel/App.tsx`
  - `src/sidepanel/toolbarActions.ts`
- 测试：
  - `tests/toolbarActions.test.ts`
- 版本号：
  - `package.json`
  - `package-lock.json`
  - `public/manifest.json`

## 关联任务 / PR
- 关联任务：顶部操作栏展开收起合并按钮
- PR：待创建

## 修改记录
### v2.4.5
- 顶部操作栏从 3 个按钮改为 2 个按钮
- 新增 `resolveBulkToggleToolbarAction(...)`
- 动态按钮根据窗口/组收起状态切换图标、名称和点击行为
- 动态 tooltip 与 `aria-label` 跟随当前动作同步更新

## 验证记录
- `npm run typecheck`
- `npm test`
- `npm run build`
