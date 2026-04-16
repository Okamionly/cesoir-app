#!/usr/bin/env node
/**
 * Vérifie que les variables d'environnement Supabase sont configurées.
 * Usage: node scripts/check-supabase-env.mjs
 */

import { existsSync, readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

// Parse .env.local if it exists
const envPath = resolve(root, '.env.local')
const env = {}

if (existsSync(envPath)) {
  const lines = readFileSync(envPath, 'utf-8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const [key, ...rest] = trimmed.split('=')
    if (key) env[key.trim()] = rest.join('=').trim()
  }
}

const required = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
]

let allOk = true

console.log('\n🔍 Vérification de la configuration Supabase...\n')

for (const key of required) {
  const value = env[key] || process.env[key]
  const isPlaceholder = value && (value.includes('your-') || value === 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...')

  if (!value || isPlaceholder) {
    console.log(`  ❌ ${key} — ${!value ? 'manquant' : 'valeur placeholder, à remplacer'}`)
    allOk = false
  } else {
    const preview = key.includes('KEY') ? `${value.slice(0, 20)}...` : value
    console.log(`  ✅ ${key} = ${preview}`)
  }
}

console.log()

if (!allOk) {
  console.log('⚠️  Configuration incomplète.')
  console.log('   → Suivre supabase/SETUP.md pour créer le projet et remplir .env.local\n')
  process.exit(1)
} else {
  console.log('✅ Configuration Supabase complète !\n')
}
