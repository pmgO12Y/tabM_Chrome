# Chrome Sidepanel Tab Manager v2.3.10

- 版本号：`2.3.10`
- 日期：`2026-03-29`
- 修改类型：`PATCH`

## 修改内容
- 将统一横向边界从左右各 `4px` 调整为左右各 `2px`。
- 保持当前统一宽度模型不变，只进一步缩小整体内容与侧边栏边缘之间的留白。

## 修改原因
- 用户继续要求整体更贴边。
- 当前统一边界为左右各 `4px`，在统一模型已成立的前提下，再下调到 `2px` 即可满足需求，不需要再改结构。

## 影响范围
- 侧边栏样式变量：
  - `src/sidepanel/styles.css`
- 版本号：
  - `package.json`
  - `package-lock.json`
  - `public/manifest.json`

## 关联任务 / PR
- 关联任务：统一宽度边界从左右各 4px 调整到 2px
- PR：待创建

## 修改记录
### v2.3.10
- `--panel-inline-gap` 从 `4px` 改为 `2px`
- 保持窗口栏、组标题、组内容、标签共用同一套横向宽度模型

## 验证记录
- `npm run typecheck`
- `npm test`
- `npm run build`
