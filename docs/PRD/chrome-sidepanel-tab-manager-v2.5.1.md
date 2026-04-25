# Chrome Sidepanel Tab Manager v2.5.1

- 版本号：`2.5.1`
- 日期：`2026-03-29`
- 修改类型：`PATCH`

## 修改内容
- 将标签关闭交互从“先立即消失”调整为：
  - 点击关闭后标签先留在原位
  - 整条标签进入灰色待关闭状态
  - 等 Chrome 原生标签真正关闭并回传同步后，侧边栏再真正移除该行
- 待关闭中的灰色标签采用整条禁用：
  - 不可点击
  - 不可拖拽
  - 不可再次固定或关闭

## 修改原因
- 用户希望关闭时保留一个更自然的反馈过程，不要点完就瞬间从侧边栏消失。
- 旧方案虽然流畅，但视觉上像“本地先删掉了”，不够贴近真实的 Chrome 关闭过程。
- 本次改成“先灰掉，再等 Chrome 真删除”，能更直观地表达当前状态。

## 影响范围
- 侧边栏本地关闭状态模型：
  - `src/sidepanel/App.tsx`
  - `src/sidepanel/closingTabs.ts`
- 侧边栏标签行渲染：
  - `src/sidepanel/components/VirtualizedWindowList.tsx`
- 样式：
  - `src/sidepanel/styles.css`
- 测试：
  - `tests/closingTabs.test.ts`
  - `tests/virtualizedWindowList.test.ts`
- 版本号：
  - `package.json`
  - `package-lock.json`
  - `public/manifest.json`

## 关联任务 / PR
- 关联任务：点击关闭时先变灰，再等待 Chrome 原生标签真正关闭后消失
- PR：待创建

## 修改记录
### v2.5.1
- 去掉“关闭时先用投影视图直接删除标签”的前端策略
- 侧边栏列表重新基于真实 `snapshot` 渲染
- 保留 `closingTabIds`，但只用于标记待关闭状态
- 标签行新增灰色待关闭样式 `tab-row--closing`
- 待关闭态优先级高于当前激活态和窗口激活态
- 待关闭中的标签整条禁用，不再响应 hover 操作区

## 验证记录
- `npm run typecheck`
- `npm test`
- `npm run build`
