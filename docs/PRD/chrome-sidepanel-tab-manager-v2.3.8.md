# Chrome Sidepanel Tab Manager v2.3.8

- 版本号：`2.3.8`
- 日期：`2026-03-29`
- 修改类型：`PATCH`

## 修改内容
- 统一侧边栏窗口栏、组标题、组内容、标签行的横向外轮廓。
- 将横向布局改为统一基准，不再让窗口内容区、组卡片、组内标签分别吃不同层级的左右缩进。
- 保留组的边框和圆角感，但组不再单独使用一套 `calc(...) + margin` 宽度算法。

## 修改原因
- 用户明确要求不要继续“头痛医头、脚痛医脚”。
- 根因已确认：
  - 窗口栏、窗口内容区、组卡片、组内标签当前分别由不同规则控制宽度
  - `panel-scroll`、`window-section__body`、`group-block` 都在参与横向排版
  - 导致窗口栏、悬浮态、选中态、组、组内标签看起来像几套宽度体系

## 影响范围
- 侧边栏样式：
  - `src/sidepanel/styles.css`
- 版本号：
  - `package.json`
  - `package-lock.json`
  - `public/manifest.json`

## 关联任务 / PR
- 关联任务：统一侧边栏横向宽度模型
- PR：待创建

## 修改记录
### v2.3.8
- 新增统一横向边界变量 `--panel-inline-gap`
- `panel-scroll` 改为统一左右内边距
- 删除 `window-section__body` 的单独右侧安全区
- `group-block` 改为 `width: 100%`，去掉单独的 `calc(...) + 8px` 外边距算法
- `group-block__header` 去掉负外边距与额外左右补偿
- 删除组内 tab 单独横向 padding 补丁，回归统一外宽模型

## 验证记录
- `npm run typecheck`
- `npm test`
- `npm run build`
