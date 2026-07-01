import { createInterface } from "node:readline/promises"
import color from "picocolors"
import { PLUGIN_NAME } from "../shared"
import type { InstallArgs, InstallPlatform } from "./types"
import {
  addPluginToOpenCodeConfig,
  getOpenCodeVersion,
  isOpenCodeInstalled,
  writeOmoConfig,
} from "./config-manager"
import { generateOmoConfig } from "./config-manager/generate-omo-config"
import {
  SYMBOLS,
  argsToConfig,
  formatConfigSummary,
  printBox,
  printError,
  printHeader,
  printInfo,
  printStep,
  printSuccess,
  printWarning,
} from "./install-validators"
import { getUnsupportedOpenCodeVersionMessage } from "./minimum-opencode-version"
import { runCodexInstaller } from "./install-codex"
import { starGitHubRepositories } from "./star-request"
import { ensureTuiPluginEntry } from "./config-manager/add-tui-plugin-to-tui-config"
import * as astGrepInstall from "./install-ast-grep-sg"

export async function runCliInstaller(args: InstallArgs, version: string): Promise<number> {
  const config = argsToConfig(args)
  const hasOpenCode = config.hasOpenCode

  printHeader(false)

  const totalSteps = hasOpenCode ? 4 : 2
  let step = 1

  if (hasOpenCode) {
    printStep(step++, totalSteps, "Checking OpenCode installation...")
    const installed = await isOpenCodeInstalled()
    const openCodeVersion = await getOpenCodeVersion()
    if (!installed) {
      printWarning(
        "OpenCode binary not found. Plugin will be configured, but you'll need to install OpenCode to use it.",
      )
      printInfo("Visit https://opencode.ai/docs for installation instructions")
    } else {
      printSuccess(`OpenCode ${openCodeVersion ?? ""} detected`)

      const unsupportedVersionMessage = getUnsupportedOpenCodeVersionMessage(openCodeVersion)
      if (unsupportedVersionMessage) {
        printWarning(unsupportedVersionMessage)
        return 1
      }
    }
  }

  if (hasOpenCode) {
    printStep(step++, totalSteps, `Adding ${PLUGIN_NAME} plugin...`)
    const pluginResult = await addPluginToOpenCodeConfig(version)
    if (!pluginResult.success) {
      printError(`Failed: ${pluginResult.error}`)
      return 1
    }
    printSuccess(
      `Plugin verified ${SYMBOLS.arrow} ${color.dim(pluginResult.configPath)}`,
    )
    try {
      ensureTuiPluginEntry()
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      printWarning(`Could not update OpenCode TUI config: ${message}`)
    }

    printStep(step++, totalSteps, `Writing ${PLUGIN_NAME} configuration...`)
    const omoConfig = generateOmoConfig(config)
    const omoResult = writeOmoConfig(omoConfig)
    if (!omoResult.success) {
      printError(`Failed: ${omoResult.error}`)
      return 1
    }
    printSuccess(`Config written ${SYMBOLS.arrow} ${color.dim(omoResult.configPath)}`)
    await astGrepInstall.installAstGrepForOpenCode({ log: printWarning })
  }

  printBox(formatConfigSummary(config), "Installation Complete")

  console.log(`${SYMBOLS.star} ${color.bold(color.green("Installation complete!"))}`)
  if (hasOpenCode) {
    console.log(`  Run ${color.cyan("opencode")} to start!`)
  }
  console.log()

  if (config.hasCodex) {
    printInfo("Installing Codex harness adapter...")
    try {
      const codexResult = await runCodexInstaller({ autonomousPermissions: config.codexAutonomous })
      printSuccess(`Codex plugin installed ${SYMBOLS.arrow} ${color.dim(codexResult.configPath)}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      if (!config.hasOpenCode) {
        printError(`Codex install failed: ${message}`)
        return 1
      }
      printWarning(`Codex install failed (OpenCode install is still complete): ${message}`)
    }
    console.log()
  }

  printInfo(
    "Anonymous telemetry is enabled by default. Disable it with OMO_SEND_ANONYMOUS_TELEMETRY=0 or OMO_DISABLE_POSTHOG=1.",
  )
  printInfo("Docs: docs/legal/privacy-policy.md and docs/legal/terms-of-service.md")
  console.log()

  printBox(
    `${color.bold("Pro Tip:")} Include ${color.cyan("ultrawork")} (or ${color.cyan("ulw")}) in your prompt.\n` +
      `All features work like magic-parallel agents, background tasks,\n` +
      `deep exploration, and relentless execution until completion.`,
    "The Magic Word",
  )

  if (args.tui) {
    await maybePromptForGitHubStars(config.platform)
  }
  console.log(color.dim("oMoMoMoMo... Enjoy!"))
  console.log()

  return 0
}

async function maybePromptForGitHubStars(platform: InstallPlatform): Promise<void> {
  if (!process.stdin.isTTY || !process.stdout.isTTY) return

  const readline = createInterface({ input: process.stdin, output: process.stdout })
  try {
    const answer = await readline.question(`${SYMBOLS.star} ${color.yellow("Star the repos on GitHub?")} ${color.dim("[y/N]")} `)
    if (!isYes(answer)) return
  } finally {
    readline.close()
  }

  const results = await starGitHubRepositories(platform)
  const failed = results.filter((result) => !result.ok)
  if (failed.length === 0) {
    printSuccess("Starred GitHub repositories")
    console.log()
    return
  }

  printWarning("Could not star every repository. Make sure GitHub CLI is installed and authenticated.")
  for (const result of failed) {
    console.log(`  ${SYMBOLS.bullet} ${result.repository}`)
  }
  console.log()
}

function isYes(value: string): boolean {
  const normalized = value.trim().toLowerCase()
  return normalized === "y" || normalized === "yes"
}
