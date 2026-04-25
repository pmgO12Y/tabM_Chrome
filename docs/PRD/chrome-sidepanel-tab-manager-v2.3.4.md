# Chrome Sidepanel Tab Manager v2.3.4

- 版本号：`2.3.4`
- 日期：`2026-03-28`
- 修改类型：`PATCH`

## 修改内容
- 修复原位 sticky 滚动时，窗口标题与组标题之间仍然出现可见白缝的问题。
- 去掉滚动容器顶部留白，避免窗口标题吸顶后顶部仍保留一条空白带。
- 将窗口内容区的间距改为“只作用于后续兄弟项”，避免窗口标题下面的第一项在吸顶场景下留下额外缝隙。
- 将组头上方的 `6px` 留白从 `group-block` 父容器挪到 `group-block__header` 自身，并在 sticky 时向上抵消。

## 修改原因
- 用户反馈：改成真正 Sticky Scroll 后，顶部吸顶方向已经对了，但窗口标题和组标题之间依然能看到明显缝隙。
- 根因不是 sticky 算法错误，而是旧布局中为普通滚动状态预留的空白还残留在错误位置：
  - `panel-scroll` 顶部 padding 会让窗口头吸顶后仍离顶部留白
  - `window-section__body` 的统一 gap 会让窗口头下面第一项多出一段缝
  - `group-block` 的顶部留白放在父容器上，组头 sticky 后这段空白会暴露出来

## 影响范围
- 吸顶相关样式：
  - `src/sidepanel/styles.css`
- 版本号：
  - `package.json`
  - `package-lock.json`
  - `public/manifest.json`

## 关联任务 / PR
- 关联任务：修复真正 Sticky Scroll 下仍可见的缝隙
- PR：待创建

## 修改记录
### v2.3.4
- `panel-scroll` 顶部 padding 从 `8px` 改为 `0`
- `window-section__body` 的 gap 改为 `0`
- 新增 `window-section__body > * + *` 间距规则，仅对后续兄弟项保留间距
- 删除 `group-block` 顶部 padding
- `group-block__header` 增加 `padding-top: 6px`
- `group-block__header` 的 sticky `top` 改为 `calc(var(--window-sticky-offset, 0px) - 6px)`，吸顶时向上抵消留白

## 验证记录
- `npm run typecheck`
- `npm test`
- `npm run build`
