# Chrome Sidepanel Tab Manager v2.4.2

- 版本号：`2.4.2`
- 日期：`2026-03-29`
- 修改类型：`PATCH`

## 修改内容
- 将顶部操作栏按钮的名称提示从按钮上方改为按钮下方显示。

## 修改原因
- 用户反馈原先上方 tooltip 没有正常显示，判断为顶部空间不足或被宿主边界裁切。
- 将 tooltip 改到按钮下方后，更符合当前侧边栏顶部布局，可见性更稳定。

## 影响范围
- 侧边栏样式：
  - `src/sidepanel/styles.css`
- 版本号：
  - `package.json`
  - `package-lock.json`
  - `public/manifest.json`

## 关联任务 / PR
- 关联任务：顶部操作栏按钮名称提示改为下方显示
- PR：待创建

## 修改记录
### v2.4.2
- tooltip 定位从按钮上方切换到按钮下方
- tooltip 过渡方向同步调整

## 验证记录
- `npm run typecheck`
- `npm test`
- `npm run build`
