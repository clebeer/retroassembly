import { capitalize, trim } from 'es-toolkit'
import { parse } from 'goodcodes-parser'
import { Nostalgist } from 'nostalgist'
import { isArcadePlatform, platformMap } from '../../constants/platform.ts'
import { getCDNUrl, libretroThumbnailsHost } from '../isomorphic/cdn.ts'

type LibretroThumbnailType = 'boxart' | 'logo' | 'snap' | 'title'

const { path } = Nostalgist.vendors

export function getDemoRomThumbnail(rom) {
  const platform = { genesis: 'md' }[rom.platform] || rom.platform
  const repo = `retrobrews/${platform}-games`
  // @ts-expect-error we know this is a valid call
  return getCDNUrl(repo, `${path.parse(rom.fileName).name}.png`)
}

export function getLibretroThumbnail({
  host = 'jsdelivr',
  platform,
  name,
  type = 'boxart',
}: {
  host?: 'jsdelivr' | 'libretro'
  name: string
  platform: string
  type?: LibretroThumbnailType
}) {
  if (!name || !platform) {
    return ''
  }
  let platformFullName = platformMap[platform]?.libretroName || platform
  if (!platformFullName) {
    return ''
  }
  if (platformFullName.includes('MAME')) {
    platformFullName = 'MAME'
  }

  const normalizedPlatformFullName = platformFullName.replaceAll(' ', '_')
  const repo = path.join('libretro-thumbnails', trim(normalizedPlatformFullName, '+'))

  const fileDirectory = `Named_${capitalize(type)}s`
  const normalizedFileName = `${name.replaceAll(/[&*/:`<>?\\]|\|"/gu, '_')}.png`
  const filePath = path.join(fileDirectory, normalizedFileName)

  if (host === 'jsdelivr') {
    // @ts-expect-error we know this is a valid call
    return getCDNUrl(repo, filePath)
  }

  const result = new URL([platformFullName, fileDirectory, normalizedFileName].join('/'), libretroThumbnailsHost).href

  return result
}

export function getRomLibretroThumbnail(
  rom: {
    platform?: string
    rawGameMetadata?: {
      libretro?: { name?: null | string; platform?: null | string } | null
    } | null
  },
  type: LibretroThumbnailType = 'boxart',
  host: 'jsdelivr' | 'libretro' = 'libretro',
) {
  const libretroGame = rom.rawGameMetadata?.libretro
  const name = libretroGame?.name
  if (!name || !rom.platform) {
    return ''
  }
  const platform = libretroGame?.platform || platformMap[rom.platform].libretroName || rom.platform
  return getLibretroThumbnail({ host, name, platform, type })
}

// retroassembly-assets has no files for the platforms added in this fork: their icon and logo are served from public/,
// and the other images are borrowed from a similar platform
const forkPlatformAssets: Record<string, { banner: string; icon: string; imagesFrom: string }> = {
  neogeo: {
    banner: '/assets/platforms/neogeo/logo.svg',
    icon: '/assets/platforms/neogeo/icon.svg',
    imagesFrom: 'arcade',
  },
}

function getAssetsPlatform(platform: string) {
  return forkPlatformAssets[platform]?.imagesFrom ?? platform
}

export function getPlatformIcon(platform: string) {
  return (
    forkPlatformAssets[platform]?.icon ??
    getCDNUrl('arianrhodsandlot/retroassembly-assets', `platforms/icons/${platform}.png`)
  )
}

export function getPlatformGameIcon(platform: string) {
  return getCDNUrl('arianrhodsandlot/retroassembly-assets', `platforms/contents/${getAssetsPlatform(platform)}.svg`)
}

export function getPlatformBanner(platform: string) {
  return (
    forkPlatformAssets[platform]?.banner ??
    getCDNUrl('arianrhodsandlot/retroassembly-assets', `platforms/logos/${platform}.svg`)
  )
}

export function getPlatformDevicePhoto(platform: string) {
  return getCDNUrl('arianrhodsandlot/retroassembly-assets', `platforms/photos/${getAssetsPlatform(platform)}.png`)
}

export function getPlatformDeviceBackground(platform: string) {
  return getCDNUrl('arianrhodsandlot/retroassembly-assets', `platforms/backgrounds/${getAssetsPlatform(platform)}.png`)
}

export function getPlatformBluredBackground(platform: string) {
  return getCDNUrl(
    'arianrhodsandlot/retroassembly-assets',
    `platforms/blured-backgrounds/${getAssetsPlatform(platform)}.jpg`,
  )
}

export function getRomGoodcodes(rom: { fileName?: string; rawGameMetadata?: any; name?: string; platform?: string }) {
  let { name } = path.parse(rom?.fileName || '')

  if ('name' in rom) {
    name = rom.name ?? ''
  }

  if (isArcadePlatform(rom.platform) && rom.rawGameMetadata?.libretro?.name) {
    name = rom.rawGameMetadata.libretro.name
  }
  return parse(`0 - ${name}`)
}

export function getCompactName(name: string) {
  return name.replaceAll(/[^\p{Letter}\p{Mark}\p{Number}]/gu, '').toLowerCase()
}
