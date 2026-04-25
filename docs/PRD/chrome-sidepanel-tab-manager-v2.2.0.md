# Chrome Sidepanel Tab Manager v2.2.0

- 版本号：`2.2.0`
- 日期：`2026-03-28`
- 修改类型：`MINOR`

## 修改内容
- 新增侧边栏拖拽能力，支持拖拽单个网页标签。
- 新增侧边栏拖拽能力，支持拖拽整个网页组。
- 拖拽结果改为真正调用 Chrome 原生标签 API，改变顶部标签顺序。
- 支持跨窗口拖拽单页标签。
- 支持跨窗口拖拽整个网页组，并在目标窗口中重建编组，恢复原标题、颜色和折叠状态。
- 新增组头、标签行的拖拽落点计算和轻量占位提示线。
- 第一版明确禁止拖拽 `pinned` 置顶标签。

## 修改原因
- 用户希望侧边栏不只是查看和点击跳转，还能直接承担标签重排入口。
- 现有插件只能联动定位，无法在侧边栏中直接调整 Chrome 原生标签顺序。
- 网页组和窗口较多时，用户希望通过侧边栏完成跨窗口整理，而不是回到顶部标签栏手动拖动。

## 影响范围
- 后台命令执行层：
  - `src/background/commandExecutor.ts`
- 侧边栏交互层：
  - `src/sidepanel/components/VirtualizedWindowList.tsx`
  - `src/sidepanel/App.tsx`
  - `src/sidepanel/styles.css`
- 共享类型与选择器：
  - `src/shared/types.ts`
  - `src/shared/domain/selectors.ts`
- 测试：
  - `tests/commandExecutor.test.ts`
  - `tests/virtualizedWindowList.test.ts`

## 关联任务 / PR
- 关联任务：侧边栏拖拽改 Chrome 原生标签顺序方案 v2.2.0
- PR：待创建

## 修改记录
### v2.2.0
- 扩展 `TabCommand`，新增 `tab/move` 和 `group/move`。
- 后台支持 `tabs.move`、`tabs.group`、`tabs.ungroup` 组合执行拖拽命令。
- 单页拖进组时自动加入目标组，拖出组时自动取消编组。
- 整组跨窗口移动时在目标窗口中重建组，并恢复组标题、组颜色、折叠状态。
- 侧边栏新增拖拽源、落点、命令构建逻辑。
- 侧边栏新增轻量拖拽占位线和拖拽中透明度反馈。
- 补充单元测试，覆盖拖拽命令执行与落点规则。

## 验证记录
- `npm run typecheck`
- `npm test`
- `npm run build`
