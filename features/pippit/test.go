//go:build ignore

package main

import (
	"main/lib"
)

func main() {
	browser := lib.GetBrowser()
	browser = browser.MustIncognito()

	page := browser.MustPage("https://www.pippit.ai/agent-chat")
	page.MustWaitDOMStable()

	page.MustElementR("span", "Continue with email").MustClick()

	page.MustElement(`input[type="text"]`).MustWaitVisible().MustInput("me@ozan.my.id")
	page.MustElement(`input[type="password"]`).MustInput("Akhmad6825")

	wait := page.MustWaitNavigation()
	page.MustElementR("span", "Continue").MustClick()
	wait()

	page.MustElement(".ag-ui-history-panel-create-button").MustWaitVisible().MustClick()

	setFiles := page.MustHandleFileDialog()
	page.MustElement(`div[class^="upload-media"]`).MustClick()
	page.MustElement(`.lv-dropdown-menu-inner > div:nth-child(2)`).MustWaitVisible().MustClick()
	setFiles("Kanaria.jpg", "Kanaria.jpg")

	for _, e := range page.MustElements(`.lv-icon-spin-loading`) {
		e.MustWaitInvisible()
	}

	page.MustElement(".tiptap > p").MustClick().MustInput(`Saya ingin Anda membuat video promosi siap upload dari gambar produk yang saya berikan. Berikut yang harus dilakukan:

1. **Video dari gambar produk**:
   - Gunakan gambar produk sebagai fokus utama.
   - Tambahkan animasi, efek transisi, atau background musik yang menarik.
   - Video durasi 15-30 detik untuk TikTok, format vertikal (9:16) jika memungkinkan.
   - AI boleh menambahkan teks overlay atau highlight fitur produk secara kreatif.

2. **Deskripsi video**:
   - Buat deskripsi menarik untuk TikTok dan Shopee.
   - Gunakan bahasa persuasif, mengundang klik/engagement.
   - Cantumkan fitur utama produk, manfaat, dan call-to-action.

3. **Tag / Hashtag**:
   - Buat daftar tag relevan untuk TikTok dan Shopee.
   - Gunakan kombinasi tag populer dan spesifik produk.

4. **Kreasi AI bebas**:
   - Jangan bertanya lagi; gunakan kreativitas AI untuk animasi, teks, musik, atau efek visual.
   - Pastikan hasil akhir siap upload langsung.

**Format output yang diinginkan**:
- File video: MP4 atau format standar TikTok/Shopee.
- Deskripsi: teks siap copy-paste.
- Tag/Hashtag: daftar siap copy-paste.

Gunakan gambar produk ini sebagai input utama: [Sisipkan gambar produk]

Buat video, deskripsi, dan tag yang menarik serta kreatif, siap upload tanpa pertanyaan tambahan.`)

	select {}
}
