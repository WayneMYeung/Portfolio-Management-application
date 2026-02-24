#!/usr/bin/env node
// scripts/generate-icons.js
// Generates PWA icons using Canvas API
// Run: node scripts/generate-icons.js

const { createCanvas } = require('canvas')
const fs = require('fs')
const path = require('path')

const sizes = [72, 96, 128, 144, 152, 192, 384, 512]
const iconsDir = path.join(__dirname, '../public/icons')

if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true })

for (const size of sizes) {
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')

  // Background
  const gradient = ctx.createLinearGradient(0, 0, size, size)
  gradient.addColorStop(0, '#1e40af')
  gradient.addColorStop(1, '#1e3a8a')
  ctx.fillStyle = gradient

  // Rounded rect
  const r = size * 0.2
  ctx.beginPath()
  ctx.moveTo(r, 0)
  ctx.lineTo(size - r, 0)
  ctx.quadraticCurveTo(size, 0, size, r)
  ctx.lineTo(size, size - r)
  ctx.quadraticCurveTo(size, size, size - r, size)
  ctx.lineTo(r, size)
  ctx.quadraticCurveTo(0, size, 0, size - r)
  ctx.lineTo(0, r)
  ctx.quadraticCurveTo(0, 0, r, 0)
  ctx.closePath()
  ctx.fill()

  // Simple trending-up icon
  ctx.strokeStyle = 'rgba(255,255,255,0.9)'
  ctx.lineWidth = size * 0.07
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  const pad = size * 0.2
  ctx.beginPath()
  ctx.moveTo(pad, size - pad)
  ctx.lineTo(size * 0.4, size * 0.55)
  ctx.lineTo(size * 0.6, size * 0.65)
  ctx.lineTo(size - pad, pad)
  ctx.stroke()

  // Arrow
  ctx.beginPath()
  ctx.moveTo(size - pad, pad)
  ctx.lineTo(size - pad - size * 0.15, pad)
  ctx.moveTo(size - pad, pad)
  ctx.lineTo(size - pad, pad + size * 0.15)
  ctx.stroke()

  const buffer = canvas.toBuffer('image/png')
  fs.writeFileSync(path.join(iconsDir, `icon-${size}.png`), buffer)
  console.log(`✅ Generated icon-${size}.png`)
}

console.log('\n✅ All icons generated in public/icons/')
console.log('Note: Install canvas package to use this script: npm i -D canvas')
