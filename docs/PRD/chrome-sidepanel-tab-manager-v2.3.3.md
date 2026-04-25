# Chrome Sidepanel Tab Manager v2.3.3

- 版本号：`2.3.3`
- 日期：`2026-03-28`
- 修改类型：`PATCH`

## 修改内容
- 推翻原先“顶部复制一份镜像头部”的双吸顶实现，改为真正的原位 `position: sticky`。
- 将侧边栏列表重构为按窗口分段渲染：
  - `window-section`
  - `window-section__header`
  - `window-section__body`
- 窗口标题改为原来的那一行自己吸顶，不再渲染 sticky 克隆版。
- 组标题改为原来的那一行自己吸顶，并停留在窗口标题下方。
- 使用真实窗口标题高度测量值作为组标题的 sticky 偏移量，不再硬编码固定像素。
- 删除 sticky 专用颜色与 sticky 镜像层相关逻辑，保证吸顶前后样式、功能、颜色一致。

## 修改原因
- 用户明确指出当前实现不是想要的 “Sticky Scroll” 感觉。
- 旧方案的问题不是单点样式，而是方案方向本身错误：
  - 顶部是额外复制出来的一层，不是原行自己停住
  - 容易出现透明感、重叠感和不自然停留
  - sticky 时的样式和未 sticky 时不完全一致
- 因此这次不继续修补镜像层，而是直接重做为真正的原位 sticky。

## 影响范围
- 侧边栏列表渲染结构：
  - `src/sidepanel/components/VirtualizedWindowList.tsx`
- 侧边栏 sticky 样式：
  - `src/sidepanel/styles.css`
- 测试：
  - `tests/virtualizedWindowList.test.ts`
- 版本号：
  - `package.json`
  - `package-lock.json`
  - `public/manifest.json`

## 关联任务 / PR
- 关联任务：重做双吸顶为“真正 Sticky Scroll”
- PR：待创建

## 修改记录
### v2.3.3
- 删除 sticky 镜像层、sticky 克隆版窗口头、sticky 克隆版组头
- 删除基于滚动位置推导“当前应该复制谁”的 JS 吸顶逻辑
- 新增 `buildWindowRenderSections(...)`，按窗口拆分渲染区块
- 新增原位 `window-section__header` sticky 结构
- 新增原位 `group-block__header` sticky 结构
- 新增真实窗口标题高度测量，并通过 `--window-sticky-offset` 提供给组标题 sticky 定位
- 删除 sticky 专用颜色覆盖，回归窗口头与组头原样式
- 调整测试，验证窗口分段结构与 sticky wrapper 元数据

## 验证记录
- `npm run typecheck`
- `npm test`
- `npm run build`
