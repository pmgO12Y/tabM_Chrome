# Chrome Sidepanel Tab Manager v2.6.1

## 版本信息
- 版本号：`2.6.1`
- 日期：`2026-03-29`
- 类型：`PATCH`

## 修改内容
- 修复多选标签在跨组 / 跨窗口批量拖拽时不稳定的问题
- 将批量拖拽的后台移动方式从“一次性整包移动”改成“按顺序逐条移动，再统一 regroup / ungroup”
- 在顶部工具栏新增当前多选状态显示：
  - `已选 N 项`

## 修改原因
- 用户反馈：跨组多选后，拖拽经常不成功
- 用户还需要一个稳定、常显的当前选中数量提示，而不是只靠按钮 tooltip

## 影响范围
- 后台命令执行：
  - `src/background/commandExecutor.ts`
- 侧边栏顶部工具栏显示：
  - `src/sidepanel/App.tsx`
  - `src/sidepanel/styles.css`
- 测试：
  - `tests/commandExecutor.test.ts`

## 兼容性说明
- 多选规则本身不变
- 批量关闭逻辑不变
- 行内关闭、固定、单条拖拽逻辑不变
- 本次只加强批量拖拽稳定性和选中状态显示

## 验证结果
- `npm run typecheck`：通过
- `npm test`：通过，共 15 个测试文件、104 个测试
- `npm run build`：通过

## 关联任务 / PR
- 关联任务：多选拖拽稳定性 + 已选数量显示
- 关联 PR：未创建
