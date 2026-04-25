# Chrome Sidepanel Tab Manager v2.3.9

- 版本号：`2.3.9`
- 日期：`2026-03-29`
- 修改类型：`PATCH`

## 修改内容
- 将统一横向边界从左右各 `8px` 调整为左右各 `4px`。
- 保持当前统一宽度模型不变，只缩小整体内容与侧边栏边缘之间的留白。

## 修改原因
- 用户确认当前统一宽度方向已经对，但希望整体再更贴边一些。
- 当前统一边界为左右各 `8px`，视觉上仍偏保守，因此下调为左右各 `4px`。

## 影响范围
- 侧边栏样式变量：
  - `src/sidepanel/styles.css`
- 版本号：
  - `package.json`
  - `package-lock.json`
  - `public/manifest.json`

## 关联任务 / PR
- 关联任务：统一宽度边界从左右各 8px 调整到 4px
- PR：待创建

## 修改记录
### v2.3.9
- `--panel-inline-gap` 从 `8px` 改为 `4px`
- 保持窗口栏、组标题、组内容、标签共用同一套横向宽度模型

## 验证记录
- `npm run typecheck`
- `npm test`
- `npm run build`
