# Chrome Sidepanel Tab Manager v2.4.6

- 版本号：`2.4.6`
- 日期：`2026-03-29`
- 修改类型：`PATCH`

## 修改内容
- 将顶部操作栏中合并后的展开/收起动态按钮图标替换为：
  - `ExpandDownOne`
  - `FoldUpOne`

## 修改原因
- 用户希望动态按钮使用更贴近“展开下拉 / 收起上折”的 IconPark 图标。
- 当前逻辑已经稳定，只需要替换图标，不需要改行为。

## 影响范围
- 顶部操作栏：
  - `src/sidepanel/App.tsx`
- 版本号：
  - `package.json`
  - `package-lock.json`
  - `public/manifest.json`

## 关联任务 / PR
- 关联任务：顶部操作栏合并按钮图标替换
- PR：待创建

## 修改记录
### v2.4.6
- 将 `MenuUnfold` 替换为 `ExpandDownOne`
- 将 `MenuFold` 替换为 `FoldUpOne`
- `重新同步` 继续保留 `Refresh`

## 验证记录
- `npm run typecheck`
- `npm test`
- `npm run build`
