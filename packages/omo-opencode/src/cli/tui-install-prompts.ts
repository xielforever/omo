import * as p from "@clack/prompts"
import type { InstallConfig, ProviderModelSelection } from "./types"
import type { ProviderEntry } from "./provider-model-catalog"
import { PROVIDER_MODEL_CATALOG } from "./provider-model-catalog"

// ── helpers ──────────────────────────────────────────────────────────

function parseModelChoice(choice: string): [string, string] {
  const idx = choice.indexOf("/")
  if (idx === -1) return ["", choice]
  return [choice.slice(0, idx), choice.slice(idx + 1)]
}

/** 根据用户选择的 provider→models 构建 "provider/model" 下拉列表 */
function getModelChoices(
  providerModels: Record<string, string[]>,
): Array<{ value: string; label: string; hint: string }> {
  const choices: Array<{ value: string; label: string; hint: string }> = []
  for (const [pKey, models] of Object.entries(providerModels)) {
    const entry = PROVIDER_MODEL_CATALOG[pKey]
    if (!entry) continue
    for (const modelId of models) {
      choices.push({
        value: `${pKey}/${modelId}`,
        label: `${entry.label} / ${modelId}`,
        hint: entry.description,
      })
    }
  }
  return choices
}

// ── agent definitions ───────────────────────────────────────────────

const AGENT_DEFS = [
  { key: "sisyphus", zh: "大禹", desc: "总指挥" },
  { key: "hephaestus", zh: "鲁班", desc: "工匠" },
  { key: "prometheus", zh: "诸葛亮", desc: "军师" },
  { key: "oracle", zh: "鬼谷子", desc: "神谕" },
  { key: "explore", zh: "千里眼", desc: "探子" },
  { key: "librarian", zh: "太史公", desc: "书虫" },
  { key: "metis", zh: "张良", desc: "预判" },
  { key: "momus", zh: "魏征", desc: "审查" },
  { key: "atlas", zh: "哪吒", desc: "三头六臂" },
  { key: "sisyphus-junior", zh: "精卫", desc: "衔石填海" },
  { key: "multimodal-looker", zh: "二郎神", desc: "天眼" },
]

// ── stage 1: provider multi-select ──────────────────────────────────

/** 多选 AI 服务商 */
export async function promptProviders(): Promise<string[] | null> {
  const options = Object.entries(PROVIDER_MODEL_CATALOG).map(([key, entry]) => ({
    value: key,
    label: entry.label,
    hint: entry.description,
  }))

  const result = await p.multiselect<string>({
    message: "选择你拥有的 AI 服务商 (空格勾选，回车确认):",
    options,
    required: true,
  })

  if (p.isCancel(result)) {
    p.cancel("取消安装")
    return null
  }
  return result
}

// ── stage 2: model multi-select per provider ────────────────────────

/** 为单个 provider 多选模型（含自定义模型入口） */
export async function promptProviderModels(
  providerKey: string,
  entry: ProviderEntry,
): Promise<string[] | null> {
  const options: Array<{ value: string; label: string; hint: string }> = entry.models.map(
    (m) => ({
      value: m.id,
      label: m.recommended ? `${m.label} ★` : m.label,
      hint: m.description ?? "",
    }),
  )

  if (entry.allowCustomModel) {
    options.push({ value: "__custom__", label: "自定义模型 ID", hint: "手动输入" })
  }

  const result = await p.multiselect<string>({
    message: `${entry.label} 的可用模型 (空格勾选):`,
    options,
    required: false,
    initialValues: entry.models.filter((m) => m.recommended).map((m) => m.id),
  })

  if (p.isCancel(result)) {
    p.cancel("取消安装")
    return null
  }

  // 自定义模型 → 弹出文本输入框
  const hasCustom = result.includes("__custom__")
  if (!hasCustom) return result

  const customRaw = await p.text({
    message: `输入 ${entry.label} 的自定义模型 ID (逗号分隔):`,
    placeholder: "my-model-v1,my-model-v2",
  })
  if (p.isCancel(customRaw)) {
    p.cancel("取消安装")
    return null
  }

  const customIds = customRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
  const picked = result.filter((r) => r !== "__custom__")
  return [...picked, ...customIds]
}

// ── stage 3: per-agent primary + fallback ───────────────────────────

export async function promptAgentAssignment(
  agentName: string,
  displayName: string,
  modelChoices: Array<{ value: string; label: string; hint: string }>,
  recommended?: string,
): Promise<{ primary: string; fallbacks: string[] } | null> {
  // 主模型选择
  const primary = await p.select<string>({
    message: `🧠 ${displayName} (${agentName}) — 选择主模型:`,
    options: [
      ...modelChoices.map((c) => ({ ...c })),
      { value: "__skip__", label: "跳过此 Agent", hint: "不在配置中启用" },
    ],
    ...(recommended ? { initialValue: recommended } : {}),
  })

  if (p.isCancel(primary)) {
    p.cancel("取消安装")
    return null
  }
  if (primary === "__skip__") return { primary: "", fallbacks: [] }

  // Fallback 多选（排除已选的 primary）
  const fbChoices = modelChoices.filter((c) => c.value !== primary)
  if (fbChoices.length === 0) return { primary, fallbacks: [] }

  const fallbacks = await p.multiselect<string>({
    message: `  Fallback 模型 (可选，空格勾选):`,
    options: fbChoices,
    required: false,
  })

  if (p.isCancel(fallbacks)) {
    p.cancel("取消安装")
    return null
  }

  return { primary, fallbacks }
}

// ── orchestration ───────────────────────────────────────────────────

export async function promptInstallConfig(): Promise<InstallConfig | null> {
  // stage 1
  const selectedProviders = await promptProviders()
  if (!selectedProviders) return null

  // stage 2 — 为每个 provider 收集模型
  const providerModels: Record<string, string[]> = {}
  for (const pKey of selectedProviders) {
    const entry = PROVIDER_MODEL_CATALOG[pKey]
    if (!entry) continue
    const models = await promptProviderModels(pKey, entry)
    if (models === null) return null
    if (models.length > 0) {
      providerModels[pKey] = models
    }
  }

  if (Object.keys(providerModels).length === 0) {
    p.log.error("至少需要选择一个 provider 及其模型")
    return null
  }

  // stage 3 — 为每个 agent 分派模型
  const modelChoices = getModelChoices(providerModels)
  const agentAssignments: InstallConfig["agentAssignments"] = []

  for (const agent of AGENT_DEFS) {
    const recommended = modelChoices[0]?.value
    const result = await promptAgentAssignment(
      agent.key,
      `${agent.zh} — ${agent.desc}`,
      modelChoices,
      recommended,
    )
    if (result === null) return null
    if (result.primary) {
      const [pProvider, pModel] = parseModelChoice(result.primary)
      agentAssignments.push({
        agentName: agent.key,
        primary: { provider: pProvider, model: pModel },
        fallbacks: result.fallbacks.map((f) => {
          const [fbProvider, fbModel] = parseModelChoice(f)
          return { provider: fbProvider, model: fbModel }
        }),
      })
    }
  }

  // 构建 InstallConfig
  const providers: ProviderModelSelection[] = Object.entries(providerModels).map(
    ([key, models]) => ({ key, models }),
  )

  return {
    platform: "opencode",
    hasOpenCode: true,
    hasCodex: false,
    providers,
    agentAssignments,
    codexAutonomous: false,
  }
}
