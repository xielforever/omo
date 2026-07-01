# omo — Personal Fork of oh-my-openagent

> 基于 [oh-my-openagent](https://github.com/code-yeongyu/oh-my-openagent) v4.14.2 的个人定制分支

oh-my-openagent 的 fork，用于个人用途定制化。

## 安装（源码方式）

```bash
git clone https://github.com/xielforever/omo.git
cd omo
bun install --ignore-scripts
```
然后配置 OpenCode 加载本地插件：

```bash
Omo_DIR=$(pwd)
mkdir -p ~/.config/opencode
cat > ~/.config/opencode/opencode.json << EOF
{
  "plugin": ["file://${Omo_DIR}/packages/omo-opencode/src/index.ts"]
}
EOF
```

> 注意：OpenCode 运行在 Bun 上，原生支持 TypeScript 源码直载，无需构建。

```bash
# 创建插件配置
cat > ~/.config/opencode/oh-my-openagent.jsonc << 'EOF'
{
  "telemetry": false
}
EOF

# 启动 OpenCode
opencode
```

## 配置 AI 模型

首先配置 API Key：

```bash
# 方式1: 使用 .env 文件
cp .env.example .env
# 编辑 .env，填入 ANTHROPIC_API_KEY / OPENAI_API_KEY 等

# 方式2: 使用 OpenCode auth
opencode auth login
```

然后运行交互式安装器，选择 Provider 并分配 Agent 模型：

```bash
bun run omo install
```

安装器会引导你完成三个阶段：
1. 选择拥有的 AI 服务商（16 个可选，多选）
2. 选择每个服务商的可用模型（多选）
3. 为 11 个 Agent 分配主模型和 fallback

配置写入 `~/.config/opencode/oh-my-openagent.jsonc`。

## 使用

在 OpenCode 中输入 `ultrawork` 即可启动全功能模式。

详见 [docs/guide/installation.md](docs/guide/installation.md)。

## 定制

插件配置位于 `~/.config/opencode/oh-my-openagent.jsonc`，支持：
- Agent 模型分配：安装时 TUI 交互选择，或手动编辑 `"agents"` 字段
- Provider 配置：在 `~/.config/opencode/opencode.json` 的 `provider` 段配置 API 端点
- 中文名称：`"displayName": "大禹"`（可选，见 `docs/guide/agent-model-matching.md`）
- 功能开关：`"disabled_hooks": [...]`

## 给 LLM 使用

在任意 LLM 工具中粘贴以下指令：

> 按照 https://raw.githubusercontent.com/xielforever/omo/refs/heads/main/README.md 的源码安装指引，克隆、安装依赖、配置 OpenCode 插件并启动。

## 上游

基于 [oh-my-openagent](https://github.com/code-yeongyu/oh-my-openagent) v4.14.2，由 [code-yeongyu](https://github.com/code-yeongyu) 维护。

## 许可证

SUL-1.0 (Sustainable Use License)
