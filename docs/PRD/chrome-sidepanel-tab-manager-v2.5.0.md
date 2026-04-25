# Chrome Sidepanel Tab Manager v2.5.0

- 版本号：`2.5.0`
- 日期：`2026-03-29`
- 修改类型：`MINOR`

## 修改内容
- 在侧边栏标签行右侧新增悬浮操作区：
  - `固定`
  - `关闭`
- 新增后台命令：
  - `tab/set-pinned`
  - `tab/close`
- 新增本地“乐观关闭”投影视图：
  - 点击关闭后，标签先立即从侧边栏隐藏
  - 等待 Chrome 真正关闭完成后再确认
  - 如果关闭失败或超时未生效，则恢复显示

## 修改原因
- 用户希望标签行在鼠标悬浮时，右侧能直接出现“固定”和“关闭”两个快捷操作。
- 用户特别强调关闭动作必须流畅，不能有明显卡顿。
- 旧结构中标签行本身就是整行按钮，无法安全地直接往里面再塞两个按钮，需要重构为：
  - 左侧主点击区
  - 右侧操作区

## 影响范围
- 侧边栏标签行渲染：
  - `src/sidepanel/components/VirtualizedWindowList.tsx`
- 侧边栏本地乐观关闭逻辑：
  - `src/sidepanel/App.tsx`
  - `src/sidepanel/closingTabs.ts`
- 样式：
  - `src/sidepanel/styles.css`
- 命令类型：
  - `src/shared/types.ts`
- 后台命令执行：
  - `src/background/commandExecutor.ts`
- 测试：
  - `tests/commandExecutor.test.ts`
  - `tests/closingTabs.test.ts`
- 版本号：
  - `package.json`
  - `package-lock.json`
  - `public/manifest.json`

## 关联任务 / PR
- 关联任务：标签行悬浮增加“固定 + 关闭”，并保证关闭流畅度
- PR：待创建

## 修改记录
### v2.5.0
- 将标签行从“整行一个按钮”重构为：
  - 行容器
  - 左侧主点击按钮
  - 右侧固定宽度操作区
- 右侧操作区默认隐藏，仅在 hover 或 `focus-within` 时显示
- 固定按钮接入 Chrome 原生 pinned tab 能力
- 关闭按钮接入 Chrome 原生关闭标签能力
- 新增本地 closingTabIds 投影视图，保证关闭后立即消失、减少等待 Chrome 回传时的迟滞感
- 投影视图会同步隐藏：
  - 被关闭中的标签
  - 被关闭到暂时空掉的组
  - 被关闭到暂时空掉的窗口

## 验证记录
- `npm run typecheck`
- `npm test`
- `npm run build`
