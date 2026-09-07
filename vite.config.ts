import { copyFileSync, cpSync } from "node:fs"
import { resolve } from "node:path"
import { fileURLToPath } from "node:url"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vitest/config"

const projectRoot = fileURLToPath(new URL(".", import.meta.url))
const teacherWorkbenchFile = resolve(projectRoot, "教师工作台.html")
const pictureDirectory = resolve(projectRoot, "pic")

const copyTeacherWorkbench = {
  name: "copy-teacher-workbench",
  closeBundle() {
    copyFileSync(teacherWorkbenchFile, resolve(projectRoot, "dist", "教师工作台.html"))
    cpSync(pictureDirectory, resolve(projectRoot, "dist", "pic"), { recursive: true })
  },
}

export default defineConfig({
  plugins: [react(), tailwindcss(), copyTeacherWorkbench],
  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname,
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
  },
})
