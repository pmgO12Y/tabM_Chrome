# Chrome Sidepanel Tab Manager v2.3.1

- 版本号：`2.3.1`
- 日期：`2026-03-28`
- 修改类型：`PATCH`

## 修改内容
- 修复窗口头和组头双吸顶的提前触发问题。
- 修复列表刚好滚到边界时，原位标题和吸顶标题同时出现、彼此重叠的问题。
- 补充吸顶边界测试，确保“还在原位时不应提前吸顶”。

## 修改原因
- 用户反馈双吸顶上线后出现明显重叠异常。
- 根因是吸顶条件写得过早：
  - 窗口头 `top <= 0` 就吸顶
  - 组头 `top <= 窗口高度` 就吸顶
- 这会导致标题刚好还停在原位时，就已经进入顶部镜像层，形成双份显示。

## 影响范围
- 吸顶计算逻辑：
  - `src/sidepanel/components/VirtualizedWindowList.tsx`
- 测试：
  - `tests/virtualizedWindowList.test.ts`

## 关联任务 / PR
- 关联任务：修复双吸顶触发边界错误
- PR：待创建

## 修改记录
### v2.3.1
- 将窗口吸顶触发条件从 `top <= 0` 改为 `top < 0`
- 将组吸顶触发条件从 `top <= windowHeight` 改为 `top < windowHeight`
- 新增测试覆盖“标题仍在原位时不应吸顶”

## 验证记录
- `npm run typecheck`
- `npm test`
- `npm run build`
