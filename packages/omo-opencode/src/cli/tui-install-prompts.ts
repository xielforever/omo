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
    const catalogEntry = PROVIDER_MODEL_CATALOG[pKey]
    const label = catalogEntry?.label ?? pKey
    const hint = catalogEntry?.description ?? ""
    for (const modelId of models) {
      choices.push({
        value: `${pKey}/${modelId}`,
        label: `${label} / ${modelId}`,
        hint,
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

// ── round 1: select one provider ────────────────────────────────────

/** Step 1: 单选一个尚未选择的 Provider */
export async function promptSelectProvider(
  remaining: string[],
): Promise<string | null> {
  const options = remaining.map((key) => {
    const entry = PROVIDER_MODEL_CATALOG[key]
    return {
      value: key,
      label: entry?.label ?? key,
      hint: entry?.description ?? "",
    }
  })

  const result = await p.select<string>({
    message: "选择 Provider:",
    options,
  })

  if (p.isCancel(result)) {
    p.cancel("取消安装")
    return null
  }
  return result
}

// ── round 2: API key ────────────────────────────────────────────────

/** Step 2: 输入 API Key（可选跳过） */
export async function promptApiKey(
  providerLabel: string,
): Promise<string | null> {
  const result = await p.text({
    message: `${providerLabel} API Key（按回车跳过，后续在 opencode.json 手动配置）:`,
    placeholder: "sk-...",
    defaultValue: "",
  })

  if (p.isCancel(result)) {
    p.cancel("取消安装")
    return null
  }
  // 返回输入内容（空字符串 = 跳过），null 表示取消
  return result
}

// ── round 3: model multi-select per provider ────────────────────────

/** Step 3: 为当前 provider 多选模型（含自定义模型入口） */
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
    message: `${entry.label} 的可用模型 (空格勾选，回车确认):`,
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

// ── round 4: what next? ─────────────────────────────────────────────

/** Step 4: 继续添加 Provider 还是进入 Agent 配置 */
export async function promptNextAction(
  hasMore: boolean,
): Promise<"add_more" | "assign_agents" | null> {
  const options: Array<{ value: string; label: string; hint: string }> = [
    { value: "assign_agents", label: "进入 Agent 模型分配", hint: "下一步" },
  ]
  if (hasMore) {
    options.unshift({ value: "add_more", label: "再添加一个 Provider", hint: "继续选择" })
  }

  const result = await p.select<string>({
    message: "接下来做什么？",
    options,
  })

  if (p.isCancel(result)) {
    p.cancel("取消安装")
    return null
  }
  return result as "add_more" | "assign_agents"
}

// ── agent assignment ────────────────────────────────────────────────

let fallbackHintShown = false

/** 单个 agent 的主模型选择（fallback 通过编辑 config 手动添加） */
export async function promptAgentAssignment(
  agentName: string,
  displayName: string,
  modelChoices: Array<{ value: string; label: string; hint: string }>,
  recommended?: string,
): Promise<{ primary: string; fallbacks: string[] } | null> {
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

  if (!fallbackHintShown) {
    fallbackHintShown = true
    p.log.info("需要 Fallback 模型？稍后编辑 ~/.config/opencode/oh-my-openagent.jsonc")
  }

  return { primary, fallbacks: [] }
}

// ── main orchestrator ───────────────────────────────────────────────

export async function promptInstallConfig(): Promise<InstallConfig | null> {
  const providerModels: Record<string, string[]> = {}
  const remaining = Object.keys(PROVIDER_MODEL_CATALOG)

  p.log.step("欢迎使用 omo 安装向导！我们将逐步完成配置。")
  p.log.info("支持 8 个 Provider：OpenCode Go、Z.ai GLM、Kimi Code、MiniMax、ChatGPT Plus、DeepSeek、硅基流动、自定义 Provider")

  // ── Round loop: add providers one by one ──
  while (true) {
    // Step 1: Select provider
    const originalPKey = await promptSelectProvider(remaining)
    if (!originalPKey) return null

    let pKey: string
    let entry: ProviderEntry

    if (originalPKey === "custom") {
      const vendorName = await p.text({
        message: "厂商名称 (用作 Provider 标识, 不含空格):",
        placeholder: "my-deepseek",
        validate: (v: string) =>
          v.length === 0 ? "名称不能为空" : (v.includes(" ") ? "不能包含空格" : undefined),
      })
      if (p.isCancel(vendorName)) {
        p.cancel("取消安装")
        return null
      }

      pKey = vendorName

      entry = {
        label: vendorName,
        description: "自定义 Provider",
        baseURL: "",
        protocol: "openai" as const,
        models: [],
        allowCustomModel: true,
      }
    } else {
      pKey = originalPKey
      const catalogEntry = PROVIDER_MODEL_CATALOG[originalPKey]
      if (!catalogEntry) {
        p.log.warn(`未知的 Provider: ${originalPKey}`)
        remaining.splice(remaining.indexOf(originalPKey), 1)
        continue
      }
      entry = { ...catalogEntry }
    }

    // Step 2: API Key
    const apiKey = await promptApiKey(entry.label)
    if (apiKey === null) return null

    if (originalPKey === "custom") {
      const baseURL = await p.text({
        message: "API 端点 URL:",
        placeholder: "https://api.example.com/v1",
      })
      if (p.isCancel(baseURL)) {
        p.cancel("取消安装")
        return null
      }
      entry.baseURL = baseURL
      entry.description = `自定义: ${baseURL}`
    }

    if (apiKey) {
      p.log.info(`API Key 已记录: ${entry.label}`)
    } else {
      p.log.info(`跳过 API Key，后续可在 opencode.json 中手动配置`)
    }

    // Step 3: Select models
    const models = await promptProviderModels(pKey, entry)
    if (models === null) return null

    if (models.length > 0) {
      providerModels[pKey] = models
    } else {
      p.log.warn(`未选择任何模型，跳过 ${entry.label}`)
    }

    // Remove selected provider from remaining
    remaining.splice(remaining.indexOf(originalPKey), 1)

    if (remaining.length === 0) {
      p.log.info("所有 Provider 已选择完毕")
      break
    }

    // Step 4: What next?
    const action = await promptNextAction(remaining.length > 0)
    if (action === null) return null
    if (action === "assign_agents") break
    // else "add_more" → continue loop
  }

  if (Object.keys(providerModels).length === 0) {
    p.log.error("至少需要选择一个 Provider 及其模型")
    return null
  }

  // ── Agent assignment ──
  p.log.step("Agent 模型分配 — 为每个 Agent 选择主模型和可选的 fallback")

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

  p.log.success("配置完成！")

  const providersOut: ProviderModelSelection[] = Object.entries(providerModels).map(
    ([key, models]) => ({ key, models }),
  )

  return {
    platform: "opencode",
    hasOpenCode: true,
    hasCodex: false,
    providers: providersOut,
    agentAssignments,
    codexAutonomous: false,
  }
}
