# Chrome Sidepanel Tab Manager v2.6.0

## 版本信息
- 版本号：`2.6.0`
- 日期：`2026-03-29`
- 类型：`MINOR`

## 修改内容
- 新增标签级多选：
  - `Ctrl/Cmd` 隔行多选
  - `Shift` 区间多选
  - `Ctrl/Cmd + Shift` 追加区间多选
- 新增批量拖拽：
  - 拖动任一已选标签时，按一个连续块一起拖动
  - 可跨组、跨窗口移动
- 新增批量关闭：
  - 顶部工具栏在有选中项时显示“关闭已选”按钮
  - 点击后所有已选标签先变灰，再等待 Chrome 真实关闭后消失
- 新增后台批量命令：
  - `tabs/close`
  - `tabs/move`
- 新增多选纯函数与测试，覆盖区间选择、隐藏选区回收、批量拖拽命令生成

## 修改原因
- 让侧边栏支持更高效的批量整理标签
- 避免用户必须一条一条关闭或拖动
- 保持与 Chrome 原生标签顺序同步，不做侧边栏假排序

## 影响范围
- 侧边栏前端交互层：
  - `src/sidepanel/App.tsx`
  - `src/sidepanel/components/VirtualizedWindowList.tsx`
  - `src/sidepanel/styles.css`
  - `src/sidepanel/tabSelection.ts`
- 后台命令执行层：
  - `src/background/commandExecutor.ts`
- 共享命令类型：
  - `src/shared/types.ts`
- 测试：
  - `tests/tabSelection.test.ts`
  - `tests/commandExecutor.test.ts`
  - `tests/virtualizedWindowList.test.ts`

## 兼容性说明
- 第一版只支持**标签**多选，不支持窗口行和组标题行混选
- 批量固定不在本次范围内
- 选区里只要包含 Chrome 原生 pinned 标签，整次批量拖拽直接禁用
- 行内关闭按钮仍保持单条关闭，不会误关整个选区

## 验证结果
- `npm run typecheck`：通过
- `npm test`：通过，共 15 个测试文件、104 个测试
- `npm run build`：通过

## 关联任务 / PR
- 关联任务：侧边栏多选 + 批量关闭/拖拽
- 关联 PR：未创建
