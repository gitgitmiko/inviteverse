import { isSupabaseConfigured, requireSupabase } from './supabase'

/** Ubah link Google Drive /view menjadi URL gambar langsung. */
export function toDirectImageUrl(input: string): string {
  const raw = input.trim()
  if (!raw) return raw

  const driveFile =
    raw.match(/drive\.google\.com\/file\/d\/([^/]+)/i) ||
    raw.match(/[?&]id=([^&]+)/i)

  if (driveFile?.[1]) {
    return `https://lh3.googleusercontent.com/d/${driveFile[1]}`
  }

  return raw
}

/** Fallback lokal (tanpa Supabase) — batasi ukuran agar browser tidak penuh */
export function readImageAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('File harus berupa gambar'))
      return
    }
    if (file.size > 1.5 * 1024 * 1024) {
      reject(new Error('Ukuran maksimal 1.5MB untuk upload lokal'))
      return
    }
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Gagal membaca file'))
    reader.readAsDataURL(file)
  })
}

async function uploadToBucket(file: File, path: string): Promise<string> {
  const client = requireSupabase()
  if (!file.type.startsWith('image/')) {
    throw new Error('File harus berupa gambar')
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Ukuran maksimal 5MB')
  }

  const { error } = await client.storage
    .from('invitation-assets')
    .upload(path, file, { cacheControl: '3600', upsert: false })

  if (error) throw error

  const { data } = client.storage.from('invitation-assets').getPublicUrl(path)
  return data.publicUrl
}

function fileExt(file: File) {
  return (file.name.split('.').pop() || 'jpg')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '') || 'jpg'
}

/** Upload aset undangan user: `{userId}/{invitationId}/...` */
export async function uploadInvitationAsset(
  file: File,
  invitationId: string,
): Promise<string> {
  const client = requireSupabase()
  const {
    data: { user },
  } = await client.auth.getUser()
  if (!user) throw new Error('Belum login')

  const path = `${user.id}/${invitationId}/${crypto.randomUUID()}.${fileExt(file)}`
  return uploadToBucket(file, path)
}

/** Upload ornamen/aset template tema (admin): `themes/{themeId}/...` */
export async function uploadThemeAsset(
  file: File,
  themeId: string,
): Promise<string> {
  const client = requireSupabase()
  const {
    data: { user },
  } = await client.auth.getUser()
  if (!user) throw new Error('Belum login')

  const path = `themes/${themeId}/${crypto.randomUUID()}.${fileExt(file)}`
  return uploadToBucket(file, path)
}

export type ImageUploadTarget =
  | { kind: 'invitation'; invitationId: string }
  | { kind: 'theme'; themeId: string }

export async function resolveImageUpload(
  file: File,
  target?: ImageUploadTarget | null,
): Promise<string> {
  if (target && isSupabaseConfigured) {
    if (target.kind === 'theme') {
      return uploadThemeAsset(file, target.themeId)
    }
    return uploadInvitationAsset(file, target.invitationId)
  }
  return readImageAsDataUrl(file)
}
