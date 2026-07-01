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
  "minimax-cn-coding-plan": {
    label: "MiniMax 国内版",
    description: "MiniMax 国内编程订阅 (minimaxi.com)",
    baseURL: "https://api.minimax.chat/v1",
    protocol: "openai",
    models: [
      { id: "MiniMax-M3", label: "MiniMax M3", description: "旗舰模型", recommended: true },
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
  custom: {
    label: "自定义 Provider",
    description: "手动指定 OpenAI 兼容的 API 端点",
    baseURL: "", // user fills in
    protocol: "openai",
    models: [],
    allowCustomModel: true,
  },
} as const satisfies ProviderModelCatalog
