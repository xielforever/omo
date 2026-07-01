import color from "picocolors"
import type { InstallConfig, InstallArgs } from "./types"
import { PROVIDER_MODEL_CATALOG } from "./provider-model-catalog"
import {
  AGENT_DISPLAY_NAMES_ZH,
  parseProviderSelections,
  parseAgentAssignments,
} from "./agent-assignment"

export const SYMBOLS = {
  check: color.green("[OK]"),
  cross: color.red("[X]"),
  arrow: color.cyan("->"),
  bullet: color.dim("*"),
  info: color.blue("[i]"),
  warn: color.yellow("[!]"),
  star: color.yellow("*"),
}

const ANSI_COLOR_PATTERN = new RegExp("\u001b\\[[0-9;]*m", "g")

export function formatConfigSummary(config: InstallConfig): string {
  const lines: string[] = []
  lines.push(color.bold(color.white("安装摘要")))
  lines.push("")

  lines.push(`  ${SYMBOLS.info} 平台: ${config.platform}`)
  if (config.hasCodex) {
    lines.push(`  ${SYMBOLS.info} Codex 自主模式: ${config.codexAutonomous ? "已启用" : "已禁用"}`)
  }
  lines.push("")

  // Provider selections
  lines.push(color.bold("AI 服务商"))
  for (const ps of config.providers) {
    const entry = PROVIDER_MODEL_CATALOG[ps.key]
    const label = entry?.label ?? ps.key
    lines.push(`  ${SYMBOLS.check} ${label}: ${ps.models.join(", ")}`)
  }
  lines.push("")

  // Agent assignments
  lines.push(color.bold("Agent 模型分配"))
  for (const a of config.agentAssignments) {
    const zh = AGENT_DISPLAY_NAMES_ZH[a.agentName] ?? a.agentName
    const fb = a.fallbacks.length > 0
      ? ` -> fallback: ${a.fallbacks.map((f) => `${f.provider}/${f.model}`).join(", ")}`
      : ""
    lines.push(`  ${SYMBOLS.arrow} ${zh}: ${a.primary.provider}/${a.primary.model}${fb}`)
  }

  return lines.join("\n")
}

export function argsToConfig(args: InstallArgs): InstallConfig {
  const platform = args.platform ?? "opencode"
  return {
    platform,
    hasOpenCode: platform === "opencode" || platform === "both",
    hasCodex: platform === "codex" || platform === "both",
    providers: parseProviderSelections(args.providers),
    agentAssignments: parseAgentAssignments(args.agentAssignments),
    codexAutonomous: args.codexAutonomous ?? false,
  }
}

export function printHeader(isUpdate: boolean): void {
  const mode = isUpdate ? "Update" : "Install"
  console.log()
  console.log(color.bgMagenta(color.white(` oMoMoMoMo... ${mode} `)))
  console.log()
}

export function printStep(step: number, total: number, message: string): void {
  const progress = color.dim(`[${step}/${total}]`)
  console.log(`${progress} ${message}`)
}

export function printSuccess(message: string): void {
  console.log(`${SYMBOLS.check} ${message}`)
}

export function printError(message: string): void {
  console.log(`${SYMBOLS.cross} ${color.red(message)}`)
}

export function printInfo(message: string): void {
  console.log(`${SYMBOLS.info} ${message}`)
}

export function printWarning(message: string): void {
  console.log(`${SYMBOLS.warn} ${color.yellow(message)}`)
}

export function printBox(content: string, title?: string): void {
  const lines = content.split("\n")
  const maxWidth =
    Math.max(
      ...lines.map((line) => line.replace(ANSI_COLOR_PATTERN, "").length),
      title?.length ?? 0,
    ) + 4
  const border = color.dim("─".repeat(maxWidth))

  console.log()
  if (title) {
    console.log(
      color.dim("┌─") +
        color.bold(` ${title} `) +
        color.dim("─".repeat(maxWidth - title.length - 4)) +
        color.dim("┐"),
    )
  } else {
    console.log(color.dim("┌") + border + color.dim("┐"))
  }

  for (const line of lines) {
    const stripped = line.replace(ANSI_COLOR_PATTERN, "")
    const padding = maxWidth - stripped.length
    console.log(color.dim("│") + ` ${line}${" ".repeat(padding - 1)}` + color.dim("│"))
  }

  console.log(color.dim("└") + border + color.dim("┘"))
  console.log()
}
