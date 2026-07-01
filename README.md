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
mkdir -p ~/.config/opencode
cat > ~/.config/opencode/opencode.json << 'EOF'
{
  "plugin": ["file:///data/omo/packages/omo-opencode/src/index.ts"]
}
EOF
```

> 注意：`file://` 路径需替换为你的实际 clone 路径。OpenCode 运行在 Bun 上，原生支持 TypeScript 源码直载，无需构建。

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

## 使用

在 OpenCode 中输入 `ultrawork` 即可启动全功能模式。

详见 [docs/guide/installation.md](docs/guide/installation.md)。

## 定制

插件配置位于 `~/.config/opencode/oh-my-openagent.jsonc`，支持：
- 模型选择：`"agents": { "sisyphus": { "model": "kimi-k2.6" } }`
- 中文名称：`"displayName": "大禹"`（可选，见 `docs/guide/agent-model-matching.md`）
- 功能开关：`"disabled_hooks": [...]`

## 上游

基于 [oh-my-openagent](https://github.com/code-yeongyu/oh-my-openagent) v4.14.2，由 [code-yeongyu](https://github.com/code-yeongyu) 维护。

## 许可证

SUL-1.0 (Sustainable Use License)
