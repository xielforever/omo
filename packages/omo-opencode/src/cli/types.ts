export type InstallPlatform = "opencode" | "codex" | "both"

/** 用户对单个 provider 的模型选择 */
export interface ProviderModelSelection {
  key: string       // provider ID, e.g. "opencode-go"
  models: string[]  // selected model IDs, e.g. ["kimi-k2.6", "glm-5.1"]
}

/** 单个 agent 的模型分配 */
export interface AgentModelAssignment {
  agentName: string  // "sisyphus"
  primary: {
    provider: string // "opencode-go"
    model: string    // "kimi-k2.6"
  }
  fallbacks: Array<{
    provider: string
    model: string
  }>
}

export interface InstallArgs {
  tui: boolean
  platform?: InstallPlatform
  providers?: string        // format: "opencode-go=kimi-k2.6,glm-5.1 zai-coding-plan=glm-5.1"
  agentAssignments?: string // format: "sisyphus:opencode-go/kimi-k2.6,fb:zai/glm-5.1"
  codexAutonomous?: boolean
  skipAuth?: boolean
}

export interface InstallConfig {
  platform: InstallPlatform
  hasOpenCode: boolean
  hasCodex: boolean
  providers: ProviderModelSelection[]       // 用户选择的 provider 及模型
  agentAssignments: AgentModelAssignment[]  // 每个 agent 的主模型 + fallback
  codexAutonomous: boolean
}

export interface ConfigMergeResult {
  success: boolean
  configPath: string
  error?: string
}
