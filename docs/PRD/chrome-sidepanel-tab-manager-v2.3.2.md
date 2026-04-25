# Chrome Sidepanel Tab Manager v2.3.2

- 版本号：`2.3.2`
- 日期：`2026-03-28`
- 修改类型：`PATCH`

## 修改内容
- 修复双吸顶层发透明、透出底下内容的问题。
- 为 sticky 窗口层和 sticky 组层分别补充不透明底板。
- 为 sticky 窗口头补充专用实色背景，不再沿用普通列表中的半透明背景。
- 为 sticky 组层左右留白区补充实心遮挡，避免两侧透出下面内容。
- 增加 sticky 专用 class 分支，避免影响普通列表中的窗口头和组标题条配色。

## 修改原因
- 用户反馈双吸顶虽然触发时机已修正，但顶部仍然“透明、发灰、能看到下面内容”。
- 根因不是单独的层级问题，而是 sticky 克隆层本身没有真正形成不透明遮挡：
  - 窗口头沿用了半透明背景
  - sticky 容器没有独立底板
  - 组吸顶层两侧留白没有单独遮挡

## 影响范围
- 吸顶层渲染与 class 分支：
  - `src/sidepanel/components/VirtualizedWindowList.tsx`
- 吸顶层样式：
  - `src/sidepanel/styles.css`
- 测试：
  - `tests/virtualizedWindowList.test.ts`

## 关联任务 / PR
- 关联任务：修复双吸顶“发透明、透出底下内容”
- PR：待创建

## 修改记录
### v2.3.2
- 新增 `getStickyWindowRowClassName(...)`
- 新增 `getStickyGroupRowClassName(...)`
- sticky 窗口头改为不透明实色背景
- sticky 聚焦窗口头改为不透明实色背景
- sticky 窗口层、组层增加独立白色底板
- sticky 组层左右留白区由组层容器本身负责遮挡
- 新增测试覆盖 sticky 专用 class 分支

## 验证记录
- `npm run typecheck`
- `npm test`
- `npm run build`
