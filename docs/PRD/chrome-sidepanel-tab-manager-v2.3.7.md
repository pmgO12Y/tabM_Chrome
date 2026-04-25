# Chrome Sidepanel Tab Manager v2.3.7

- 版本号：`2.3.7`
- 日期：`2026-03-29`
- 修改类型：`PATCH`

## 修改内容
- 修复窗口栏右侧存在明显缝隙的问题。
- 将右侧滚动条安全区从全局滚动容器下放到窗口内容区，只让组标题和标签继续保留右侧保护。
- 让窗口栏在普通状态和 sticky 状态下都贴满右侧边缘。

## 修改原因
- 用户确认希望“只改窗口栏”，不要为了填满窗口栏把组标题和标签再次暴露给滚动条。
- 根因已确认：
  - 当前 `.panel-scroll` 使用了统一的右侧安全区
  - 导致窗口栏、组标题、标签全部一起向左缩进
  - 结果窗口栏右侧出现了不该有的缝

## 影响范围
- 侧边栏样式：
  - `src/sidepanel/styles.css`
- 版本号：
  - `package.json`
  - `package-lock.json`
  - `public/manifest.json`

## 关联任务 / PR
- 关联任务：修复窗口栏右侧缝隙
- PR：待创建

## 修改记录
### v2.3.7
- `panel-scroll` 去掉统一右侧安全区
- `window-section__body` 增加右侧安全区
- 保持 `scrollbar-gutter: stable`
- 窗口栏重新贴满右侧；组标题和标签继续保留右侧保护

## 验证记录
- `npm run typecheck`
- `npm test`
- `npm run build`
