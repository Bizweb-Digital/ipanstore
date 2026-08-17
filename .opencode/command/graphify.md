---
description: Buat knowledge graph codebase (graphify)
---

Gunakan skill `graphify` untuk menganalisis folder/codebase menjadi knowledge graph.

Target: $ARGUMENTS (default: folder saat ini)

Langkah:
1. Jalankan graphify pada target folder.
2. Interpretasikan GRAPH_REPORT.md / graph.json.
3. Jelaskan struktur, hubungan, dan konsep utama.
4. Jawab pertanyaan berdasarkan graph.

CLI: & "$env:APPDATA\Python\Python312\Scripts\graphify.exe" .
