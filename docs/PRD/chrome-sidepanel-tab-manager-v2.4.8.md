# Chrome Sidepanel Tab Manager v2.4.8

- 版本号：`2.4.8`
- 日期：`2026-03-29`
- 修改类型：`PATCH`

## 修改内容
- 修复点击 Chrome 原生标签后，侧边栏自动定位在顶部区域不准确的问题。
- 自动定位不再直接依赖 `scrollIntoView({ block: "nearest" })`，改为按顶部真实遮挡区计算滚动量。

## 修改原因
- 用户反馈：当当前标签出现在侧边栏最上方附近时，侧边栏自动定位不准确，无法真正对准当前标签。
- 根因是顶部实际存在：
  - 窗口吸顶头
  - 组吸顶头
- 旧逻辑只知道“滚进可视区”，不知道顶部还有这些遮挡层。

## 影响范围
- 侧边栏列表定位逻辑：
  - `src/sidepanel/components/VirtualizedWindowList.tsx`
- 测试：
  - `tests/virtualizedWindowList.test.ts`
- 版本号：
  - `package.json`
  - `package-lock.json`
  - `public/manifest.json`

## 关联任务 / PR
- 关联任务：修复顶部区域自动定位不准
- PR：待创建

## 修改记录
### v2.4.8
- 新增顶部遮挡区计算：
  - `calculateStickyHeaderObstruction(...)`
- 新增自动定位滚动补偿计算：
  - `calculateActiveRowScrollAdjustment(...)`
- 自动定位时按窗口吸顶头和组吸顶头的真实遮挡高度修正目标位置

## 验证记录
- `npm run typecheck`
- `npm test`
- `npm run build`
