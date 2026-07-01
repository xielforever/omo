import * as p from "@clack/prompts"
import color from "picocolors"
import { PLUGIN_NAME } from "../shared"
import type { InstallArgs } from "./types"
import {
  addPluginToOpenCodeConfig,
  isOpenCodeInstalled,
  getOpenCodeVersion,
  writeOmoConfig,
} from "./config-manager"
import { formatConfigSummary } from "./install-validators"
import { getUnsupportedOpenCodeVersionMessage } from "./minimum-opencode-version"
import { promptInstallConfig } from "./tui-install-prompts"
import { runCodexInstaller } from "./install-codex"
import { starGitHubRepositories } from "./star-request"
import { buildOmoConfigFromAssignments } from "./agent-assignment"
import { ensureTuiPluginEntry } from "./config-manager/add-tui-plugin-to-tui-config"
import * as astGrepInstall from "./install-ast-grep-sg"

export async function runTuiInstaller(args: InstallArgs, version: string): Promise<number> {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    console.error("Error: Interactive installer requires a TTY.")
    return 1
  }

  p.intro(color.bgMagenta(color.white(" oMoMoMoMo... ")))

  // OpenCode preflight
  const spinner = p.spinner()
  spinner.start("检查 OpenCode 安装")
  const installed = await isOpenCodeInstalled()
  const openCodeVersion = await getOpenCodeVersion()
  if (!installed) {
    spinner.stop(`OpenCode 未找到 ${color.yellow("[!]")}`)
    p.log.warn("未找到 OpenCode，请先安装。")
  } else {
    spinner.stop(`OpenCode ${openCodeVersion ?? "已安装"} ${color.green("[OK]")}`)
    const unsupportedMsg = getUnsupportedOpenCodeVersionMessage(openCodeVersion)
    if (unsupportedMsg) { p.log.warn(unsupportedMsg); p.outro(color.red("安装被阻止")); return 1 }
  }

  // New 3-stage interactive config
  const config = await promptInstallConfig()
  if (!config) return 1

  if (config.hasOpenCode) {
    // Register plugin
    spinner.start(`注册 ${PLUGIN_NAME} 到 OpenCode`)
    const pluginResult = await addPluginToOpenCodeConfig(version)
    if (!pluginResult.success) {
      spinner.stop(`注册失败: ${pluginResult.error}`)
      p.outro(color.red("安装失败"))
      return 1
    }
    spinner.stop(`插件已注册到 ${color.cyan(pluginResult.configPath)}`)

    try { ensureTuiPluginEntry() }
    catch (e) { p.log.warn(`TUI 配置更新失败: ${e instanceof Error ? e.message : String(e)}`) }

    // Write config from assignments
    spinner.start("写入模型配置")
    const omoConfig = buildOmoConfigFromAssignments(config)
    const omoResult = writeOmoConfig(omoConfig)
    if (!omoResult.success) {
      spinner.stop(`写入失败: ${omoResult.error}`)
      p.outro(color.red("安装失败"))
      return 1
    }
    spinner.stop(`配置已写入 ${color.cyan(omoResult.configPath)}`)
    await astGrepInstall.installAstGrepForOpenCode({ log: p.log.warn })
  }

  // Codex (if selected)
  if (config.hasCodex) {
    spinner.start("安装 Codex 适配器")
    try {
      const codexResult = await runCodexInstaller({ autonomousPermissions: config.codexAutonomous })
      spinner.stop(`Codex 已安装到 ${color.cyan(codexResult.configPath)}`)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      spinner.stop(`Codex 安装失败 ${color.yellow("[!]")}`)
      if (!config.hasOpenCode) { p.log.error(`Codex: ${msg}`); p.outro(color.red("安装失败")); return 1 }
      p.log.warn(`Codex 安装失败: ${msg}`)
    }
  }

  // Summary
  p.note(formatConfigSummary(config), "安装完成")
  p.log.success(color.bold("安装完成!"))
  if (config.hasOpenCode) p.log.message(`运行 ${color.cyan("opencode")} 启动!`)

  p.log.info("遥测默认开启，设置 OMO_DISABLE_POSTHOG=1 关闭。")
  p.note(`在提示中输入 ${color.cyan("ultrawork")} 即可启动全功能模式`, "使用方法")

  // GitHub star
  const shouldStar = await p.confirm({ message: "给仓库点 Star?", initialValue: false })
  if (!p.isCancel(shouldStar) && shouldStar) {
    spinner.start("Starring...")
    const results = await starGitHubRepositories("opencode")
    const failed = results.filter(r => !r.ok)
    spinner.stop(failed.length === 0 ? "已 Star" : "部分 Star 失败")
  }

  p.outro(color.green("oMoMoMoMo... 享受吧!"))
  return 0
}
