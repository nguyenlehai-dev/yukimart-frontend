// Resolve raw filename → bundled asset URL via Vite glob import
const productImageMap = import.meta.glob('@/assets/images/products/**/*.{jpg,jpeg,png,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

const brandImageMap = import.meta.glob('@/assets/images/{logo,trademark}/**/*.{jpg,jpeg,png,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

function indexByFilename(map: Record<string, string>) {
  const indexed: Record<string, string> = {}
  for (const path in map) {
    const filename = path.split('/').pop()
    if (filename) indexed[filename] = map[path]
  }
  return indexed
}

const productFilenameToUrl = indexByFilename(productImageMap)
const brandFilenameToUrl = indexByFilename(brandImageMap)

function resolveAsset(filename: string | null | undefined, lookup: Record<string, string>): string {
  if (!filename) return ''
  if (filename.startsWith('http') || filename.startsWith('/')) return filename
  return lookup[filename] || filename
}

export function resolveProductImage(filename: string | null | undefined): string {
  return resolveAsset(filename, productFilenameToUrl)
}

export function resolveBrandLogo(filename: string | null | undefined): string {
  return resolveAsset(filename, brandFilenameToUrl)
}
