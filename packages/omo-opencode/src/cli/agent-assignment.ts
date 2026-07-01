import type { GeneratedOmoConfig, AgentConfig, CategoryConfig } from "./model-fallback-types"
import type { InstallConfig, AgentModelAssignment, ProviderModelSelection } from "./types"
import { PROVIDER_MODEL_CATALOG } from "./provider-model-catalog"
import {
  CLI_AGENT_MODEL_REQUIREMENTS,
} from "./model-fallback-requirements"

const SCHEMA_URL = "https://raw.githubusercontent.com/xielforever/omo/dev/assets/oh-my-opencode.schema.json"

/** 中文显示名称映射 */
export const AGENT_DISPLAY_NAMES_ZH: Record<string, string> = {
  sisyphus: "大禹",
  hephaestus: "鲁班",
  prometheus: "诸葛亮",
  oracle: "鬼谷子",
  metis: "张良",
  momus: "魏征",
  atlas: "哪吒",
  "sisyphus-junior": "精卫",
  explore: "千里眼",
  "multimodal-looker": "二郎神",
  librarian: "太史公",
}

/** 获取中文 agent 显示名称映射 */
export function getAgentDisplayNames(): Record<string, string> {
  return AGENT_DISPLAY_NAMES_ZH
}

/**
 * 获取用户所选 providers 中适合指定 agent 的模型列表，用于 TUI 推荐。
 * 返回结果按推荐度排序：显式匹配的模型 > 兼容 provider 的其他模型。
 */
export function getAvailableModelsForAgent(
  agentName: string,
  providerSelections: ProviderModelSelection[],
): Array<{ provider: string; model: string; label: string; recommended: boolean }> {
  const req = CLI_AGENT_MODEL_REQUIREMENTS[agentName]
  const compatibleProviders = new Set(req?.fallbackChain?.flatMap((e) => e.providers) ?? [])

  const results: Array<{ provider: string; model: string; label: string; recommended: boolean }> = []

  for (const sel of providerSelections) {
    const catalog = PROVIDER_MODEL_CATALOG[sel.key]
    if (!catalog) continue

    const providerInChain = compatibleProviders.has(sel.key) || compatibleProviders.size === 0

    for (const modelId of sel.models) {
      const modelEntry = catalog.models.find((m) => m.id === modelId)
      if (!modelEntry) continue

      const explicitMatch = req?.fallbackChain?.some(
        (e) => e.providers.includes(sel.key) && e.model === modelId,
      ) ?? false

      results.push({
        provider: sel.key,
        model: modelId,
        label: modelEntry.label,
        recommended: explicitMatch || (providerInChain && (modelEntry.recommended === true)),
      })
    }
  }

  // 排序：显式推荐优先
  results.sort((a, b) => (b.recommended ? 1 : 0) - (a.recommended ? 1 : 0))

  return results
}

/** 从 CLI provider 字符串解析 ProviderModelSelection[] */
export function parseProviderSelections(raw?: string): ProviderModelSelection[] {
  if (!raw) return []

  const selections: ProviderModelSelection[] = []
  const parts = raw.split(/\s+/)
  for (const part of parts) {
    const eqIdx = part.indexOf("=")
    if (eqIdx === -1) continue
    const key = part.slice(0, eqIdx)
    const models = part.slice(eqIdx + 1).split(",").filter(Boolean)
    if (key && models.length > 0) {
      selections.push({ key, models })
    }
  }
  return selections
}

/** 从 CLI agentAssignments 字符串解析 AgentModelAssignment[] */
export function parseAgentAssignments(raw?: string): AgentModelAssignment[] {
  if (!raw) return []

  const assignments: AgentModelAssignment[] = []
  const parts = raw.split(/\s+/)
  for (const part of parts) {
    const [agentRaw, ...modelRaws] = part.split(",")
    if (!agentRaw) continue
    const [agentName, primaryRaw] = agentRaw.split(":")
    if (!agentName || !primaryRaw) continue
    const [primaryProvider, primaryModel] = primaryRaw.split("/")
    if (!primaryProvider || !primaryModel) continue

    const fallbacks: Array<{ provider: string; model: string }> = []
    for (const m of modelRaws) {
      const fbMatch = m.match(/^fb:(.+)\/(.+)$/)
      if (fbMatch) {
        fallbacks.push({ provider: fbMatch[1], model: fbMatch[2] })
      }
    }

    assignments.push({
      agentName,
      primary: { provider: primaryProvider, model: primaryModel },
      fallbacks,
    })
  }
  return assignments
}

/** 根据用户选择直接构建 oh-my-openagent.jsonc 内容 */
export function buildOmoConfigFromAssignments(config: InstallConfig): GeneratedOmoConfig {
  const agents: Record<string, AgentConfig> = {}

  for (const a of config.agentAssignments) {
    agents[a.agentName] = {
      model: `${a.primary.provider}/${a.primary.model}`,
      ...(a.fallbacks.length > 0
        ? {
            fallback_models: a.fallbacks.map((f) => ({
              model: `${f.provider}/${f.model}`,
            })),
          }
        : {}),
    }
  }

  // 从 agent 配置推导 category 默认值
  const categories: Record<string, CategoryConfig> = {}
  const sisyphusModel = agents.sisyphus?.model
  if (sisyphusModel) {
    categories["unspecified-high"] = { model: sisyphusModel }
    categories["unspecified-low"] = { model: sisyphusModel }
    categories["deep"] = { model: sisyphusModel }
    categories["ultrabrain"] = { model: sisyphusModel }
    categories["writing"] = { model: sisyphusModel }
    categories["artistry"] = { model: sisyphusModel }
    categories["visual-engineering"] = { model: sisyphusModel }
  }

  const exploreModel = agents.explore?.model ?? sisyphusModel
  if (exploreModel) {
    categories["quick"] = { model: exploreModel }
    // ponytail: 如果 librarian 未单独配置，跟随 explore 模型
    categories["librarian"] = { model: exploreModel }
  }

  return {
    $schema: SCHEMA_URL,
    agents,
    categories,
  }
}
