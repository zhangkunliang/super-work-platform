import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"

describe("family communication copy", () => {
  it("does not install a global text replacement that duplicates enterprise wording", () => {
    const workbench = readFileSync(resolve(process.cwd(), "教师工作台.html"), "utf8")

    expect(workbench).not.toContain("replaceWechatCopy")
    expect(workbench).not.toContain('replaceAll("微信群消息", "企业微信群消息")')
  })
})
