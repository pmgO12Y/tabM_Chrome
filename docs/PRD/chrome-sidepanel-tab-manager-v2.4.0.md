# Chrome Sidepanel Tab Manager v2.4.0

- 版本号：`2.4.0`
- 日期：`2026-03-29`
- 修改类型：`MINOR`

## 修改内容
- 在侧边栏顶部新增固定操作栏。
- 第一版提供 3 个纯图标全局操作：
  - `重新同步`
  - `全部展开`
  - `全部收起`
- `重新同步` 采用面板级重连和重新拉快照的方式实现，不刷新网页本身。
- `全部展开 / 全部收起` 同时作用于窗口和网页组。

## 修改原因
- 用户需要在侧边栏顶部增加常用全局操作，减少频繁滚动和逐个点击。
- 当前项目已经安装 `@icon-park/react`，可以直接复用现有图标体系，不需要新增依赖。
- 后台没有单独的“刷新面板”命令，因此最稳的做法是让侧边栏自己断开当前连接并重新走 bootstrap 与后台重连流程。

## 影响范围
- 侧边栏界面结构：
  - `src/sidepanel/App.tsx`
- 面板连接与状态流：
  - `src/sidepanel/usePanelController.ts`
  - `src/sidepanel/panelControllerState.ts`
- 侧边栏样式：
  - `src/sidepanel/styles.css`
- 测试：
  - `tests/panelControllerState.test.ts`
- 版本号：
  - `package.json`
  - `package-lock.json`
  - `public/manifest.json`

## 关联任务 / PR
- 关联任务：顶部操作栏方案 v2.4.0
- PR：待创建

## 修改记录
### v2.4.0
- 新增固定顶部工具栏，不随列表一起滚动。
- 新增 `重新同步` 按钮：
  - 触发面板级重同步
  - 重同步期间按钮禁用
- 新增 `全部展开` 按钮：
  - 清空本地折叠窗口状态
  - 对当前所有已折叠组批量发送 `group/set-collapsed: false`
- 新增 `全部收起` 按钮：
  - 将当前所有窗口写入折叠状态
  - 对当前所有已展开组批量发送 `group/set-collapsed: true`
- `panelControllerState` 新增 `resync/requested` 事件，用于保留当前快照并进入重同步状态。

## 验证记录
- `npm run typecheck`
- `npm test`
- `npm run build`
