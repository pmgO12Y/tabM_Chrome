# Chrome 侧边栏标签管理插件 PRD v1.0.13

## 1. Executive Summary
开发一款运行在 Chrome 侧边栏中的标签管理插件，面向 300+ 标签页的重度用户场景，提供按窗口浏览、快速搜索、切换、关闭和固定等基础能力。首版以高性能、低内存、模块化扩展为核心，优先解决“浏览器标签过多导致定位和切换效率下降”的问题，并将图标策略重新收敛到“只优化网页 favicon”。

## 2. Problem Statement
- 多窗口、多任务并行的 Chrome 重度用户，需要在大量标签中快速定位目标页面。
- 原生横向标签栏难以同时表达窗口上下文和标签层级，切换成本高。
- 将扩展页图标和网页 favicon 混在同一套增强逻辑里，会引入无效代码和额外复杂度，反而干扰真正的网页图标显示问题。

## 3. Target Users
- 主用户：100-300+ 标签的重度用户。
- 次用户：希望通过侧边栏获得更稳定浏览体验的普通用户。
- 典型任务：按窗口浏览、搜索定位、快速切换、关闭、固定标签。

## 4. Strategic Context
- Chrome Side Panel 已提供稳定承载容器。
- 首版聚焦高频操作和真实体感性能，而不是复杂整理能力。
- 图标策略应明确区分“网页标签”和“非网页标签”，本轮只处理网页 favicon，不再引入扩展页图标专项能力。

## 5. Solution Overview
### 产品边界
- 平台：Chrome Desktop。
- 技术基线：Manifest V3 + Side Panel API。
- 不兼容 Firefox / Edge，不提供 popup 或 new tab 版本。

### MVP 能力
- 按窗口展示标签列表，支持展开/折叠。
- 搜索标题与 URL。
- 切换标签、关闭标签、固定/取消固定。
- 查看当前窗口或全部窗口。
- 首屏未就绪时展示加载动画和标签加载进度。
- 浏览器当前激活标签变化时，侧边栏自动滚动定位到对应项。
- favicon 逻辑只针对普通网页 `http/https/file` 做优化。

### 网页图标展示约束
- 普通 `http/https/file` 标签优先使用 Chrome `_favicon` 代理。
- 若 `_favicon` 代理失败，则回退到当前标签对象上的 `favIconUrl`。
- 若两者都不可用，则回退为标题首字母。
- `chrome-extension://...`、`chrome://...` 等非网页标签不再走专门增强逻辑，只保留已有安全 favicon 或首字母降级。
- 该策略只影响左侧图标，不改变标题和 URL 文本。

## 6. Success Metrics
- 300+ 标签场景下首次可交互渲染不高于 500ms。
- 1000 标签场景下若首屏尚未可见，必须显示加载状态与进度。
- 搜索输入到结果刷新不高于 100ms。
- 单个标签事件到 UI 反映不高于 50ms。
- 普通网页标签在侧边栏中应稳定显示网页 favicon，不因扩展页增强逻辑受到干扰。

## 7. User Stories / Acceptance Criteria
- 作为用户，我可以按窗口查看标签，以理解当前工作上下文。
- 作为用户，我可以搜索标题或 URL，以更快定位目标标签。
- 作为用户，我可以直接切换、关闭或固定一个标签，而不必回到顶部标签栏。
- 作为用户，普通网页标签在侧边栏中应优先显示网页 favicon；而扩展页不再混入额外图标实验逻辑。
- 验收标准：
  - `https`、`http`、`file` 标签按 `_favicon -> favIconUrl -> 首字母` 顺序显示。
  - `chrome-extension://...` 标签不再请求 `management` 或扩展页专属图标源。
  - 删除所有扩展页图标专项代码和测试。
  - 标题和 URL 文本不因该策略发生变化。

## 8. Out of Scope
- 保存和恢复整组标签页。
- 多选和批量整理。
- 智能分类、规则引擎或 AI 功能。
- 账号同步与跨设备同步。
- 通过 `management` 读取已安装扩展图标。

## 9. Risks / Dependencies
- 依赖 Chrome Side Panel API、Manifest V3 service worker、`chrome.tabs`、`chrome.storage` 和 `chrome.favicon`。
- 非网页标签的图标一致性不是本轮目标，相关行为会保持简单降级策略。

## 10. Open Questions
- 后续是否需要为“非网页标签”设计单独的视觉表示，而不是继续依赖首字母。
- 是否需要为网页 favicon 失败场景增加更明确的占位样式。

## 11. Verification Plan
- 自动验证：
  - 单元测试覆盖网页 `_favicon` 代理、网页原始 favicon 回退、非网页协议不走代理。
  - 类型检查确保 favicon 候选逻辑保持兼容。
  - 构建产物必须可生成 `background` 与 `sidepanel` 两个入口。
- 手工验证：
  - 验证正常网页标签的图标稳定显示。
  - 验证非网页标签不再触发扩展图标专项逻辑。
  - 验证标题和 URL 文本保持不变。

## 12. 修改记录
| 版本号 | 日期 | 修改内容 | 修改原因 | 影响范围 | 关联任务 / PR |
| --- | --- | --- | --- | --- | --- |
| 1.0.13 | 2026-03-26 | 删除扩展页图标专项逻辑与 `management` 权限，重新收敛为仅优化网页 favicon 的简单链路。 | 响应“清除扩展页图标相关无效代码，只解决网页图标问题”的明确要求。 | manifest 权限、favicon 候选逻辑、侧边栏渲染、单元测试。 | Task: chrome-sidepanel-web-favicon-only / PR: N/A |
| 1.0.12 | 2026-03-26 | 为扩展页标签新增 `chrome://favicon/size/16@2x/chrome-extension://扩展ID/` 候选源，并将其置于 `management` icon 之前。 | 响应真实使用中 `management` 返回 icon URL 仍可能无法直接渲染的问题。 | favicon 候选链路、单元测试、手工验收标准。 | Task: chrome-sidepanel-chrome-extension-favicon / PR: N/A |
| 1.0.11 | 2026-03-26 | 新增 `management` 权限，并为扩展页标签引入“扩展声明 icon -> `_favicon` -> `favIconUrl` -> 首字母”的图标回退链路。 | 响应真实使用中扩展页顶部标签已有 icon、侧边栏却仍显示首字母的问题。 | manifest 权限、侧边栏 favicon 逻辑、扩展 icon 缓存、单元测试。 | Task: chrome-sidepanel-management-icons / PR: N/A |
| 1.0.10 | 2026-03-26 | 为标签 favicon 增加“Chrome `_favicon` 代理优先、`favIconUrl` 次之、首字母兜底”的多候选回退链路，并将该链路扩展到 `chrome-extension://...` 标签。 | 响应真实使用中顶部标签已有 icon、侧边栏却退回首字母的明显不一致问题。 | favicon 渲染策略、组件回退逻辑、单元测试、手工验收标准。 | Task: chrome-sidepanel-favicon-candidates / PR: N/A |
| 1.0.9 | 2026-03-26 | 将休眠标签图标策略从“原网页 favicon 优先”调整为“Chrome 顶部标签栏当前图标一致优先”，不再强行还原原网页图标。 | 响应真实使用中“侧边栏 icon 必须与顶部标签当前显示一致”的更明确要求。 | favicon 归一化逻辑、单元测试、手工验收标准。 | Task: chrome-sidepanel-current-favicon / PR: N/A |
| 1.0.8 | 2026-03-26 | 为休眠类插件替换页新增“原网页 favicon 优先，插件页 favicon 降级”的通用保守还原策略。 | 响应真实使用中休眠标签图标与 Chrome 标签栏识别不一致的问题。 | favicon 归一化逻辑、单元测试、手工验收标准。 | Task: chrome-sidepanel-suspended-favicon / PR: N/A |
| 1.0.7 | 2026-03-23 | 将固定和关闭操作替换为 IconPark React 图标，并统一图标风格。 | 响应采用可免费商用的统一图标库需求。 | 图标体系、依赖项、列表操作区。 | Task: chrome-sidepanel-iconpark / PR: N/A |
| 1.0.6 | 2026-03-23 | 将固定/关闭操作改为 hover icon-only，并确保窄侧栏下关键操作不被裁切，固定图钉常驻显示。 | 响应窄宽度场景下按钮消失和操作区挤压正文的问题。 | 列表布局、操作按钮形态、窄宽度验收标准。 | Task: chrome-sidepanel-icon-actions / PR: N/A |
| 1.0.5 | 2026-03-23 | 修复标签行 hover 出现双层底色、外层高亮不可点击的问题，明确整行点击与操作按钮冒泡隔离。 | 响应真实使用中热区视觉与交互不一致的问题。 | 列表交互结构、hover 行为、手工验收标准。 | Task: chrome-sidepanel-row-hitarea / PR: N/A |
| 1.0.4 | 2026-03-23 | 修正启动 loading 的显示时机到 HTML 壳层，明确悬浮浅灰、选中浅黄两套状态色，并补充自动滚动定位要求。 | 响应真实使用中“启动仍见空白”和“交互状态色需对齐参考图”的问题。 | 启动壳层、列表交互颜色、手工验收标准。 | Task: chrome-sidepanel-loading-colors / PR: N/A |
| 1.0.3 | 2026-03-23 | 将侧边栏视觉调整为无边界风格，弱化卡片、边框、阴影，改用留白与分隔线组织层级。 | 响应新的 UI 风格要求，并同步降低 resize 路径上的视觉开销。 | 视觉样式、启动壳层、手工验收标准。 | Task: chrome-sidepanel-borderless-ui / PR: N/A |
| 1.0.2 | 2026-03-23 | 新增首屏加载动画与进度反馈要求，补充侧边栏宽度拖拽性能约束，并明确首屏优先由 side panel 本地读取完成。 | 响应真实使用中“首屏等待感明显”和“拉伸侧边栏卡顿”的体验问题。 | 首屏加载链路、UI 反馈、性能约束、手工验收。 | Task: chrome-sidepanel-loading-and-resize / PR: N/A |
| 1.0.1 | 2026-03-23 | 补充验证计划、明确搜索结果可见性、断连反馈、favicon 安全约束，并收紧验收表述。 | 对齐当前实现收敛后的验收口径，提升 PRD 可验证性。 | 验收标准、测试策略、风险约束。 | Task: chrome-sidepanel-mvp-hardening / PR: N/A |
| 1.0.0 | 2026-03-23 | 首次创建 Chrome 侧边栏标签管理插件 PRD，定义 MVP 范围、性能目标、权限边界和架构原则。 | 将原始一句话需求转为可实施文档。 | 产品范围、技术架构、测试基线。 | Task: chrome-sidepanel-mvp-bootstrap / PR: N/A |
