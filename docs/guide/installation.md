# omo 安装指南 / 给 LLM Agent 使用

> 本指南供 LLM Agent 阅读并执行。如果你是人类，把以下指令粘贴到 LLM 工具里即可。

omo 是 oh-my-openagent 的个人定制 fork，源码方式安装，无需 npm 发布。

## Step 0: 确认用户环境和订阅

先确认前置依赖和用户拥有的 AI 服务商订阅。

### 运行环境

```bash
# 检查 Bun
bun --version || echo "需要安装 Bun: https://bun.sh"

# 检查 OpenCode
opencode --version 2>/dev/null || echo "需要安装 OpenCode: https://opencode.ai/docs"
```

### AI 服务商订阅

询问用户拥有以下哪些订阅（可多选）：

| # | 服务商 | 描述 | 用途 |
|---|--------|------|------|
| 1 | OpenCode Go | 聚合 Kimi/GLM/MiniMax/Qwen | 主力模型 |
| 2 | Z.ai GLM | 智谱编程订阅 ($10/月) | GLM 5.1 旗舰 |
| 3 | Kimi Code | 月之暗面编程订阅 ($19/月) | K2.5 |
| 4 | MiniMax 国内版 | minimaxi.com | MiniMax M3 |
| 5 | ChatGPT Plus | OpenAI ($20/月) | GPT-5.5 旗舰 |
| 6 | DeepSeek | 深度求索 API | V3/R1 |
| 7 | 硅基流动 | SiliconFlow 聚合 API | 多种开源模型 |
| 8 | 自定义 | 手动指定 OpenAI 兼容端点 | 私有部署或其他 |

### 询问方式

```
你有以下哪些 AI 服务商订阅？多选后告诉我：
1. OpenCode Go（Kimi K2.6/GLM 5.1/MiniMax M3/Qwen 3.5+）
2. Z.ai GLM（GLM 5.1/GLM 5）
3. Kimi Code（K2.5）
4. MiniMax 国内版（MiniMax M3）
5. ChatGPT Plus（GPT-5.5）
6. DeepSeek（V3/R1）
7. 硅基流动（DeepSeek V3/Qwen 2.5）
8. 自定义（自填 API 端点）
```

## Step 1: 克隆并安装依赖

```bash
git clone https://github.com/xielforever/omo.git
cd omo
bun install --ignore-scripts
```

## Step 2: 注册插件并创建基础配置

```bash
OMO_DIR=$(pwd)
mkdir -p ~/.config/opencode

# 注册插件（file:// 源码直载，无需构建）
# heredoc 不带引号，bash 会把 ${OMO_DIR} 展开成真实路径
cat > ~/.config/opencode/opencode.json << EOF
{
  "plugin": ["file://${OMO_DIR}/packages/omo-opencode/src/index.ts"]
}
EOF

# 创建基础配置
cat > ~/.config/opencode/oh-my-openagent.jsonc << 'EOF'
{
  "telemetry": false
}
EOF
```

## Step 3: 配置 API Key

```bash
# 方式 1：使用 .env 文件
cp .env.example .env
# 编辑 .env，填入 ANTHROPIC_API_KEY / OPENAI_API_KEY 等

# 方式 2：使用 OpenCode auth login
opencode auth login
```

## Step 4: 运行安装器配置模型

根据 Step 0 中用户的选择，构建命令。

### 交互式模式（推荐，有 TTY 时）

```bash
bun packages/omo-opencode/src/cli/index.ts install
```

安装器会引导：逐轮添加 Provider → 配置 API Key → 选择模型 → 为 Agent 分配模型。

### 非交互模式（无 TTY 时，LLM 直接执行）

根据用户选的服务商和模型，构建参数：

```bash
bun packages/omo-opencode/src/cli/index.ts install --no-tui \
  --providers "<provider>=<model1>,<model2> <provider2>=<model3>" \
  --agent-assignments "<agent>:<provider>/<model> <agent2>:<provider>/<model>"
```

**`--providers` 参数格式：**
- 多个 provider 用空格分隔
- 每个 provider 后跟 `=` 和逗号分隔的模型 ID
- 示例：`"opencode-go=kimi-k2.6,glm-5.1 zai-coding-plan=glm-5.1"`

**`--agent-assignments` 参数格式：**
- 多个 agent 用空格分隔
- 每个 agent 用 `:` 连接 agent 名和 `provider/model`
- 示例：`"sisyphus:opencode-go/kimi-k2.6 hephaestus:zai-coding-plan/glm-5.1"`

**可用 Provider 及其模型：**

| Provider Key | 可用模型 |
|-------------|---------|
| opencode-go | kimi-k2.6, glm-5.1, minimax-m3, qwen3.5-plus, minimax-m2.7 |
| zai-coding-plan | glm-5.1, glm-5, glm-4.6v |
| kimi-for-coding | k2p5 |
| minimax-cn-coding-plan | MiniMax-M3 |
| openai | gpt-5.5, gpt-5.4-mini-fast, gpt-5.4-nano |
| deepseek | deepseek-chat, deepseek-reasoner |
| siliconflow | Pro/deepseek-ai/DeepSeek-V3, Qwen/Qwen2.5-72B-Instruct |
| custom | 用户自行指定（模型 ID 由用户提供） |

**11 个 Agent（显示名 + 角色）：**

| Agent Key | 显示名 | 角色 | 推荐模型类型 |
|-----------|--------|------|-------------|
| sisyphus | 大禹 | 总指挥 | Kimi K2.6 / GPT-5.5 |
| hephaestus | 鲁班 | 工匠 | GPT-5.5 / Kimi K2.6 |
| prometheus | 诸葛亮 | 军师 | GLM 5.1 / GPT-5.5 |
| oracle | 鬼谷子 | 神谕 | GPT-5.5 / GLM 5.1 |
| explore | 千里眼 | 探子 | Qwen 3.5+ / MiniMax M3 |
| librarian | 太史公 | 书虫 | Qwen 3.5+ / MiniMax M3 |
| metis | 张良 | 预判 | Kimi K2.6 / GLM 5.1 |
| momus | 魏征 | 审查 | GPT-5.5 / GLM 5.1 |
| atlas | 哪吒 | 三头六臂 | Kimi K2.6 / MiniMax M3 |
| sisyphus-junior | 精卫 | 衔石填海 | Kimi K2.6 / MiniMax M3 |
| multimodal-looker | 二郎神 | 天眼 | GPT-5.5 / GLM 4.6V |

**完整命令示例（用户有 OpenCode Go + Z.ai GLM）：**

```bash
bun packages/omo-opencode/src/cli/index.ts install --no-tui \
  --providers "opencode-go=kimi-k2.6,glm-5.1,qwen3.5-plus zai-coding-plan=glm-5.1,glm-5" \
  --agent-assignments "sisyphus:opencode-go/kimi-k2.6 hephaestus:opencode-go/kimi-k2.6 prometheus:zai-coding-plan/glm-5.1 oracle:opencode-go/glm-5.1 explore:opencode-go/qwen3.5-plus librarian:opencode-go/qwen3.5-plus atlas:opencode-go/kimi-k2.6 sisyphus-junior:opencode-go/kimi-k2.6 metis:zai-coding-plan/glm-5.1 momus:zai-coding-plan/glm-5.1 multimodal-looker:zai-coding-plan/glm-5.1"
```

> fallback 模型不在此配置中设置。需要时手动编辑 `~/.config/opencode/oh-my-openagent.jsonc`。

## Step 5: 验证

```bash
# 检查插件注册
cat ~/.config/opencode/opencode.json

# 检查模型配置
cat ~/.config/opencode/oh-my-openagent.jsonc

# 启动 OpenCode
opencode
```

在 OpenCode 中输入 `ultrawork` 启动全功能模式。

## 配置参考

- 调整 Agent 模型：编辑 `~/.config/opencode/oh-my-openagent.jsonc` 的 `agents` 字段
- 添加 Fallback 模型：在 `agents.<name>.fallback_models` 数组中添加
- 自定义 Provider：在 `~/.config/opencode/opencode.json` 的 `provider` 段配置 `baseURL` 和 `apiKey`