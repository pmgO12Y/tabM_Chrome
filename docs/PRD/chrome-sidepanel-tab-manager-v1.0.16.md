# Chrome 侧边栏标签管理插件 PRD v1.0.16

## 1. Executive Summary
开发一款运行在 Chrome 侧边栏中的标签管理插件，面向 300+ 标签页的重度用户场景，提供按窗口浏览、快速搜索、切换、关闭和固定等基础能力。首版以高性能、低内存、模块化扩展为核心，优先解决“浏览器标签过多导致定位和切换效率下降”的问题，并补齐侧边栏启动失败时的可见错误反馈。

## 2. Problem Statement
- 多窗口、多任务并行的 Chrome 重度用户，需要在大量标签中快速定位目标页面。
- 原生横向标签栏难以同时表达窗口上下文和标签层级，切换成本高。
- 当侧边栏在真实浏览器环境中启动失败时，用户当前只能看到空白页或长期转圈，无法知道是“还在加载”还是“已经报错”。

## 3. Target Users
- 主用户：100-300+ 标签的重度用户。
- 次用户：希望通过侧边栏获得更稳定浏览体验的普通用户。
- 典型任务：按窗口浏览、搜索定位、快速切换、关闭、固定标签。

## 4. Strategic Context
- Chrome Side Panel 已提供稳定承载容器。
- 首版聚焦高频操作和真实体感性能，而不是复杂整理能力。
- 真实浏览器环境中的启动错误必须可见，否则无法继续定位 favicon、休眠标签等问题。

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
- 当 React 启动阶段发生异常时，直接展示致命错误面板，而不是空白。

### 启动错误反馈约束
- 在 side panel 根节点增加 Error Boundary。
- 若渲染阶段抛异常：
  - 立即移除启动壳层。
  - 展示“侧边栏启动失败”错误面板。
  - 显示简短错误信息和重载指引。
- 不改变正常启动路径和正常交互行为。

## 6. Success Metrics
- 300+ 标签场景下首次可交互渲染不高于 500ms。
- 1000 标签场景下若首屏尚未可见，必须显示加载状态与进度。
- 搜索输入到结果刷新不高于 100ms。
- 单个标签事件到 UI 反映不高于 50ms。
- 启动失败时用户不再看到无限转圈或纯白页，而能看到明确错误提示。

## 7. User Stories / Acceptance Criteria
- 作为用户，我可以按窗口查看标签，以理解当前工作上下文。
- 作为用户，我可以搜索标题或 URL，以更快定位目标标签。
- 作为用户，当侧边栏启动失败时，我应直接看到错误提示，而不是一直转圈。
- 验收标准：
  - React 渲染异常时显示致命错误面板。
  - 启动壳层在错误态不会继续遮罩界面。
  - 错误态包含重载扩展的明确提示。

## 8. Out of Scope
- 保存和恢复整组标签页。
- 多选和批量整理。
- 智能分类、规则引擎或 AI 功能。
- 账号同步与跨设备同步。
- 后台脚本所有异步异常的统一可视化。

## 9. Risks / Dependencies
- 依赖 Chrome Side Panel API、Manifest V3 service worker、`chrome.tabs`、`chrome.storage` 和 React 渲染链路。
- Error Boundary 只能捕获渲染/生命周期错误，不能替代所有异步错误处理。

## 10. Open Questions
- 后续是否要把异步启动错误也统一映射到同一个错误面板。
- 是否需要增加一键复制错误信息，方便继续排查。

## 11. Verification Plan
- 自动验证：
  - 类型检查确保 Error Boundary 与现有 side panel 挂载逻辑兼容。
  - 构建产物必须可生成 `background` 与 `sidepanel` 两个入口。
- 手工验证：
  - 验证正常启动路径不受影响。
  - 验证渲染异常时能看到错误面板，而不是白屏或无限转圈。

## 12. 修改记录
| 版本号 | 日期 | 修改内容 | 修改原因 | 影响范围 | 关联任务 / PR |
| --- | --- | --- | --- | --- | --- |
| 1.0.16 | 2026-03-26 | 为 side panel 启动路径增加 Error Boundary 和致命错误面板，避免启动失败时只显示空白或转圈。 | 响应真实浏览器环境中“彻底不显示了”的排查需求。 | side panel 挂载逻辑、错误反馈 UI、启动调试路径。 | Task: chrome-sidepanel-startup-error-surface / PR: N/A |
| 1.0.15 | 2026-03-26 | 为 `suspended.html` 休眠页新增原网页标题、URL 与 favicon 恢复逻辑。 | 响应“像 The Marvellous Suspender 这种休眠标签，如何显示原网页标签”的实现需求。 | 标签归一化逻辑、favicon 生成、单元测试。 | Task: chrome-sidepanel-suspended-original-page / PR: N/A |
| 1.0.14 | 2026-03-26 | 将普通网页 favicon 策略调整为“保留原始 `tab.favIconUrl`，渲染时原始 favicon 优先、`_favicon` 兜底”。 | 响应普通网页在侧边栏中图标与 Chrome 顶部标签栏不一致的问题。 | favicon 归一化逻辑、渲染候选顺序、单元测试。 | Task: chrome-sidepanel-raw-favicon-first / PR: N/A |
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
