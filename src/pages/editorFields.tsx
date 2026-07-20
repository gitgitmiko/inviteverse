import { useState, type ReactNode } from 'react'
import {
  resolveImageUpload,
  toDirectImageUrl,
  type ImageUploadTarget,
} from '../lib/imageUrl'
import {
  createOrnament,
  duplicateOrnament,
  emptyTransform,
} from '../lib/themeDefaults'
import type { FreeOrnament, OrnamentAnim, SlotTransform } from '../lib/themeTypes'

export function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label className="ed-field">
      <span>{label}</span>
      {children}
    </label>
  )
}

export function ImageField({
  label,
  value,
  onChange,
  hint,
  invitationId,
  uploadTarget,
}: {
  label: string
  value: string
  onChange: (url: string) => void
  hint?: string
  /** @deprecated pakai uploadTarget */
  invitationId?: string | null
  uploadTarget?: ImageUploadTarget | null
}) {
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const target: ImageUploadTarget | null =
    uploadTarget ??
    (invitationId
      ? { kind: 'invitation', invitationId }
      : null)

  const onUrlChange = (raw: string) => {
    setError(null)
    onChange(toDirectImageUrl(raw))
  }

  const onFile = async (file: File | null) => {
    if (!file) return
    setError(null)
    setUploading(true)
    try {
      const url = await resolveImageUpload(file, target)
      onChange(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload gagal')
    } finally {
      setUploading(false)
    }
  }

  const isDataUrl = value.startsWith('data:')
  const isRemote = /^https?:\/\//i.test(value)

  return (
    <div className="ed-image-field">
      <Field label={label}>
        {isDataUrl ? (
          <input
            readOnly
            value="Gambar lokal (simpan agar tidak hilang)"
          />
        ) : (
          <input
            value={value}
            onChange={(e) => onUrlChange(e.target.value)}
            placeholder="URL / upload / kosongkan"
          />
        )}
      </Field>
      <div className="ed-image-field__row">
        <label className={`ed-upload ${uploading ? 'is-busy' : ''}`}>
          {uploading ? 'Mengunggah…' : 'Upload'}
          <input
            type="file"
            accept="image/*"
            hidden
            disabled={uploading}
            onChange={(e) => {
              void onFile(e.target.files?.[0] ?? null)
              e.target.value = ''
            }}
          />
        </label>
        {value ? (
          <>
            <div className="ed-image-field__preview" title="Preview">
              <img src={value} alt="" referrerPolicy="no-referrer" />
            </div>
            <button
              type="button"
              className="ed__ghost"
              onClick={() => onChange('')}
            >
              Hapus
            </button>
          </>
        ) : null}
      </div>
      <p className="ed-image-field__hint">
        {hint ??
          (target?.kind === 'theme'
            ? 'Ornamen template tema — tersimpan di Storage (maks 5MB).'
            : target
              ? 'Upload disimpan ke cloud Storage (maks 5MB).'
              : 'Belum punya gambar? Boleh dikosongkan, atau upload PNG transparan.')}
        {isRemote ? ' URL publik tersimpan.' : null}
      </p>
      {error && <p className="ed-image-field__error">{error}</p>}
    </div>
  )
}

export function ColorField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <label className="ed-field ed-field--color">
      <span>{label}</span>
      <div className="ed-color-row">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
        />
      </div>
    </label>
  )
}

/** Geser posisi (X/Y %) dan ubah ukuran (scale) aset ornamen/bingkai */
export function TransformField({
  label,
  value,
  onChange,
}: {
  label: string
  value?: SlotTransform | null
  onChange: (v: SlotTransform) => void
}) {
  const t = { ...emptyTransform(), ...(value ?? {}) }

  const patch = (partial: Partial<SlotTransform>) => {
    onChange({ ...t, ...partial })
  }

  return (
    <div className="ed-transform">
      <p className="ed-transform__label">{label}</p>
      <label className="ed-transform__row">
        <span>Geser X ({t.offsetX}%)</span>
        <input
          type="range"
          min={-50}
          max={50}
          step={1}
          value={t.offsetX}
          onChange={(e) => patch({ offsetX: Number(e.target.value) })}
        />
      </label>
      <label className="ed-transform__row">
        <span>Geser Y ({t.offsetY}%)</span>
        <input
          type="range"
          min={-50}
          max={50}
          step={1}
          value={t.offsetY}
          onChange={(e) => patch({ offsetY: Number(e.target.value) })}
        />
      </label>
      <label className="ed-transform__row">
        <span>Ukuran ({Math.round(t.scale * 100)}%)</span>
        <input
          type="range"
          min={40}
          max={200}
          step={5}
          value={Math.round(t.scale * 100)}
          onChange={(e) => patch({ scale: Number(e.target.value) / 100 })}
        />
      </label>
      <label className="ed-transform__row">
        <span>Putar ({t.rotate}°)</span>
        <input
          type="range"
          min={-180}
          max={180}
          step={1}
          value={t.rotate}
          onChange={(e) => patch({ rotate: Number(e.target.value) })}
        />
      </label>
      <button
        type="button"
        className="ed__ghost"
        onClick={() => onChange(emptyTransform())}
      >
        Reset posisi & ukuran
      </button>
    </div>
  )
}

export const ORNAMENT_ANIM_OPTIONS: { value: OrnamentAnim; label: string }[] = [
  { value: 'none', label: 'Tanpa animasi' },
  { value: 'pulse', label: 'Zoom in / out' },
  { value: 'sway', label: 'Geser kiri-kanan' },
  { value: 'float', label: 'Naik-turun lembut' },
]

/** Admin: tambah / hapus / atur beberapa ornamen bebas */
export function OrnamentListEditor({
  ornaments,
  onChange,
  invitationId,
  uploadTarget,
}: {
  ornaments: FreeOrnament[]
  onChange: (next: FreeOrnament[]) => void
  invitationId?: string | null
  uploadTarget?: ImageUploadTarget | null
}) {
  const list = ornaments ?? []

  const updateAt = (index: number, patch: Partial<FreeOrnament>) => {
    onChange(
      list.map((item, i) =>
        i === index
          ? {
              ...item,
              ...patch,
              transform: {
                ...emptyTransform(),
                ...item.transform,
                ...(patch.transform ?? {}),
              },
            }
          : item,
      ),
    )
  }

  const removeAt = (index: number) => {
    onChange(list.filter((_, i) => i !== index))
  }

  const duplicateAt = (index: number) => {
    const copy = duplicateOrnament(list[index])
    const next = [...list]
    next.splice(index + 1, 0, copy)
    onChange(next)
  }

  return (
    <div className="ed-ornament-list">
      <div className="ed-ornament-list__head">
        <p className="ed-transform__label">Ornamen bebas</p>
        <button
          type="button"
          className="ed__ghost"
          onClick={() => onChange([...list, createOrnament()])}
        >
          + Tambah ornamen
        </button>
      </div>
      <p className="ed__hint">
        Atur posisi, putar, lalu Duplikasi + Flip horizontal untuk pasangan
        kiri-kanan.
      </p>
      {list.length === 0 ? (
        <p className="ed-image-field__hint">Belum ada ornamen.</p>
      ) : (
        list.map((item, index) => (
          <div key={item.id} className="ed-ornament-card">
            <div className="ed-ornament-card__top">
              <strong>Ornamen {index + 1}</strong>
              <div className="ed-ornament-card__actions">
                <button
                  type="button"
                  className="ed__ghost"
                  onClick={() => duplicateAt(index)}
                  title="Salin ornamen beserta setting-nya"
                >
                  Duplikasi
                </button>
                <button
                  type="button"
                  className="ed__ghost"
                  onClick={() => removeAt(index)}
                >
                  Hapus
                </button>
              </div>
            </div>
            <ImageField
              label="Gambar ornamen"
              value={item.src}
              onChange={(src) => updateAt(index, { src })}
              invitationId={invitationId}
              uploadTarget={uploadTarget}
            />
            {item.src ? (
              <>
                <Field label="Animasi">
                  <select
                    value={item.anim ?? 'none'}
                    onChange={(e) =>
                      updateAt(index, {
                        anim: e.target.value as OrnamentAnim,
                      })
                    }
                  >
                    {ORNAMENT_ANIM_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <div className="ed-flip-row">
                  <label className="ed-check">
                    <input
                      type="checkbox"
                      checked={item.flipX ?? false}
                      onChange={(e) =>
                        updateAt(index, { flipX: e.target.checked })
                      }
                    />
                    Flip horizontal (kiri ↔ kanan)
                  </label>
                  <label className="ed-check">
                    <input
                      type="checkbox"
                      checked={item.flipY ?? false}
                      onChange={(e) =>
                        updateAt(index, { flipY: e.target.checked })
                      }
                    />
                    Flip vertikal
                  </label>
                </div>
                <TransformField
                  label="Posisi, ukuran & putar"
                  value={item.transform}
                  onChange={(transform) => updateAt(index, { transform })}
                />
              </>
            ) : null}
          </div>
        ))
      )}
    </div>
  )
}
