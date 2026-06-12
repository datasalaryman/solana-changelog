import { defineConfig, type PluginOption } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'

const config = defineConfig(async ({ command }) => {
  const plugins: PluginOption[] = [
    tsconfigPaths({ projects: ['./tsconfig.json'] }),
    tailwindcss(),
    tanstackStart(),
    nitro({
      preset: 'vercel',
    }),
    viteReact(),
  ]

  if (command === 'serve') {
    const { devtools } = await import('@tanstack/devtools-vite')
    plugins.unshift(devtools())
  }

  return { plugins }
})

export default config
