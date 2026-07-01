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

运行交互式安装器，完成 Provider、API Key、模型和 Agent 的全套配置：

```bash
bun packages/omo-opencode/src/cli/index.ts install
```

安装器会引导你完成：
1. 选择 AI 服务商（8 个可选，多选）
2. 配置 API Key（通过 .env 或 opencode auth）
3. 选择每个服务商的可用模型（多选）
4. 为 11 个 Agent 分配主模型和 fallback

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

完整安装指令（包含 8 个 Provider、11 个 Agent 的非交互配置）见：

> https://raw.githubusercontent.com/xielforever/omo/refs/heads/main/docs/guide/installation.md

把上面的链接喂给任意 LLM 工具，让它按 Step 0 到 Step 5 执行即可。

## 上游

基于 [oh-my-openagent](https://github.com/code-yeongyu/oh-my-openagent) v4.14.2，由 [code-yeongyu](https://github.com/code-yeongyu) 维护。

## 许可证

SUL-1.0 (Sustainable Use License)
