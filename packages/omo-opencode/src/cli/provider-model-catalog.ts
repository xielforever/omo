export interface ModelEntry {
  id: string // model ID as used in provider/model string
  label: string // human-readable label
  description?: string
  recommended?: boolean
}

export interface ProviderEntry {
  label: string
  description: string
  baseURL: string // API endpoint URL for OpenAI-compatible protocol
  protocol: "openai" | "anthropic" | "google" // API protocol type
  models: ModelEntry[]
  allowCustomModel?: boolean // whether user can add custom model IDs
}

export type ProviderModelCatalog = Record<string, ProviderEntry>

export const PROVIDER_MODEL_CATALOG = {
  "opencode-go": {
    label: "OpenCode Go",
    description: "OpenCode Go 订阅",
    baseURL: "https://api.opencode.ai/v1",
    protocol: "openai",
    models: [
      { id: "kimi-k2.6", label: "Kimi K2.6", recommended: true },
      { id: "glm-5.1", label: "GLM 5.1" },
      { id: "minimax-m3", label: "MiniMax M3" },
      { id: "qwen3.5-plus", label: "Qwen 3.5+" },
      { id: "minimax-m2.7", label: "MiniMax M2.7" },
    ],
  },
  "zai-coding-plan": {
    label: "Z.ai GLM",
    description: "Z.ai 编程订阅 ($10/月)",
    baseURL: "https://api.z.ai/v1",
    protocol: "openai",
    models: [
      { id: "glm-5.1", label: "GLM 5.1", description: "最新旗舰", recommended: true },
      { id: "glm-5", label: "GLM 5", description: "综合旗舰" },
      { id: "glm-4.6v", label: "GLM 4.6V", description: "多模态视觉" },
    ],
  },
  "kimi-for-coding": {
    label: "Kimi Code",
    description: "月之暗面 Kimi 编程订阅 ($19/月)",
    baseURL: "https://api.moonshot.cn/v1",
    protocol: "openai",
    models: [
      { id: "k2p5", label: "K2.5", description: "综合能力强", recommended: true },
    ],
  },
  "bailian-coding-plan": {
    label: "百炼 Coding Plan",
    description: "阿里百炼编程订阅",
    baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    protocol: "openai",
    models: [
      { id: "qwen3.5-plus", label: "Qwen 3.5+", recommended: true },
      { id: "kimi-k2.5", label: "Kimi K2.5" },
      { id: "glm-5", label: "GLM 5" },
    ],
  },
  "minimax-cn-coding-plan": {
    label: "MiniMax 国内版",
    description: "MiniMax 国内编程订阅 (minimaxi.com)",
    baseURL: "https://api.minimax.chat/v1",
    protocol: "openai",
    models: [
      { id: "MiniMax-M3", label: "MiniMax M3", description: "旗舰模型", recommended: true },
    ],
  },
  "minimax-coding-plan": {
    label: "MiniMax 国际版",
    description: "MiniMax 国际编程订阅 (minimax.io)",
    baseURL: "https://api.minimax.io/v1",
    protocol: "openai",
    models: [
      { id: "MiniMax-M3", label: "MiniMax M3", recommended: true },
    ],
  },
  openai: {
    label: "ChatGPT Plus",
    description: "OpenAI ChatGPT 订阅 ($20/月)",
    baseURL: "https://api.openai.com/v1",
    protocol: "openai",
    models: [
      { id: "gpt-5.5", label: "GPT-5.5", description: "旗舰模型", recommended: true },
      { id: "gpt-5.4-mini-fast", label: "GPT-5.4 Mini Fast", description: "快速轻量" },
      { id: "gpt-5.4-nano", label: "GPT-5.4 Nano", description: "极速微型" },
    ],
  },
  anthropic: {
    label: "Claude Pro/Max",
    description: "Anthropic Claude 订阅 ($20/月)",
    baseURL: "https://api.anthropic.com/v1",
    protocol: "anthropic",
    models: [
      { id: "claude-opus-4-7", label: "Claude Opus 4.7", description: "最强旗舰", recommended: true },
      { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6", description: "平衡之选" },
      { id: "claude-haiku-4-5", label: "Claude Haiku 4.5", description: "轻量快速" },
    ],
  },
  google: {
    label: "Google Gemini",
    description: "Google Gemini API",
    baseURL: "https://generativelanguage.googleapis.com/v1beta",
    protocol: "google",
    models: [
      { id: "gemini-3.1-pro", label: "Gemini 3.1 Pro", description: "旗舰模型", recommended: true },
      { id: "gemini-3-flash", label: "Gemini 3 Flash", description: "快速轻量" },
    ],
  },
  "github-copilot": {
    label: "GitHub Copilot",
    description: "GitHub Copilot 订阅",
    baseURL: "", // Copilot uses its own auth flow, no baseURL needed
    protocol: "openai",
    models: [
      { id: "gpt-5.5", label: "GPT-5.5", recommended: true },
      { id: "gpt-5-mini", label: "GPT-5 Mini" },
      { id: "gpt-5.4-mini", label: "GPT-5.4 Mini" },
    ],
  },
  opencode: {
    label: "OpenCode Zen",
    description: "OpenCode Zen 内置模型",
    baseURL: "",
    protocol: "openai",
    models: [
      { id: "gpt-5-nano", label: "GPT-5 Nano" },
      { id: "gpt-5.5", label: "GPT-5.5" },
      { id: "big-pickle", label: "Big Pickle" },
    ],
  },
  vercel: {
    label: "Vercel AI Gateway",
    description: "Vercel AI Gateway (通用代理)",
    baseURL: "",
    protocol: "openai",
    models: [
      { id: "gpt-5.5", label: "GPT-5.5" },
      { id: "claude-opus-4-7", label: "Claude Opus 4.7" },
      { id: "gemini-3.1-pro", label: "Gemini 3.1 Pro" },
      { id: "kimi-k2.6", label: "Kimi K2.6" },
      { id: "glm-5.1", label: "GLM 5.1" },
      { id: "minimax-m3", label: "MiniMax M3" },
    ],
    allowCustomModel: true,
  },
  deepseek: {
    label: "DeepSeek",
    description: "DeepSeek API",
    baseURL: "https://api.deepseek.com/v1",
    protocol: "openai",
    models: [
      { id: "deepseek-chat", label: "DeepSeek V3", recommended: true },
      { id: "deepseek-reasoner", label: "DeepSeek R1", description: "推理增强" },
    ],
  },
  siliconflow: {
    label: "硅基流动 (SiliconFlow)",
    description: "硅基流动 API — 聚合多种开源模型",
    baseURL: "https://api.siliconflow.cn/v1",
    protocol: "openai",
    models: [
      { id: "Pro/deepseek-ai/DeepSeek-V3", label: "DeepSeek V3", recommended: true },
      { id: "Qwen/Qwen2.5-72B-Instruct", label: "Qwen 2.5 72B" },
    ],
    allowCustomModel: true,
  },
  ollama: {
    label: "Ollama (本地)",
    description: "本地 Ollama 服务器",
    baseURL: "http://localhost:11434/v1",
    protocol: "openai",
    models: [],
    allowCustomModel: true,
  },
  custom: {
    label: "自定义 Provider",
    description: "手动指定 OpenAI 兼容的 API 端点",
    baseURL: "", // user fills in
    protocol: "openai",
    models: [],
    allowCustomModel: true,
  },
} as const satisfies ProviderModelCatalog
