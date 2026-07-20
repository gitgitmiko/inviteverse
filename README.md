# Invitation Wedding v2 — Super-Classic

Duplikasi tema undangan Super-Classic dalam dua versi untuk perbandingan.

## Jalankan

```bash
npm install
npm run dev
```

## Route

| Path | Isi |
|------|-----|
| `/` | Halaman pembanding A vs B + editor |
| `/a` | Versi A — rekreasi React |
| `/a?kpd=Nama%20Tamu` | Versi A dengan nama tamu custom |
| `/b` | Versi B — mirror HTML lokal |
| `/edit` | Editor realtime (panel + preview live) |

## Catatan

- **Versi A**: kode & ornamen sendiri, data di `src/data/invitation.json` (atau localStorage setelah diedit).
- **Versi B**: mirror dari halaman publik Indoinvite di `public/mirror/super-classic/`. Tidak untuk produksi.
- **Editor**: hasil scrape struktur Indoinvite edit page; data tersimpan di `localStorage` browser.
- Jangan simpan password akun pihak ketiga di repo.
