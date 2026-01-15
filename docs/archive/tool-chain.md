## Tool Chaining – Full Tool Compatibility List

**Status:** Implementation established via `PipelineDesigner.tsx`. Tools marked with [x] are "Chain-Ready".

---

## 1. Text-based Chain (text → text)

### Inputs / Generators

- [x] Text Input (Integrated in Designer)
- [x] Lorem Ipsum Generator (Chain-Ready)
- [x] UUID/ULID Generator (Chain-Ready)
- [x] QR Code Generator (Chain-Ready: Text → Image)

### Text Transforms

- [x] Case Converter (Chain-Ready via Universal Converter)
- [x] Slugify (Chain-Ready)
- [x] String Obfuscator (Chain-Ready)
- [x] Regex Replace (Chain-Ready)
- [x] Text Diff (Chain-Ready)
- [x] Text Statistics (Chain-Ready)
- [x] Safelink Decoder (Chain-Ready)

### Conversions

- [x] Base64 / Hex / URL / HTML Encode/Decode (Chain-Ready)
- [x] Base64 URL (Chain-Ready)
- [x] Color Converter (Chain-Ready: Hex/RGB/HSL)
- [x] Date Converter (Chain-Ready: ISO/Unix/Human)
- [x] JSON ⇄ YAML ⇄ XML ⇄ CSV (Chain-Ready)

### Crypto (Text)

- [x] Hash Generator (Chain-Ready)
- [x] HMAC Generator (Chain-Ready)
- [x] AES Encrypt (Chain-Ready)
- [x] AES Decrypt (Chain-Ready)
- [x] Bcrypt Hash (Chain-Ready)

### Math

- [x] Math Evaluator (Chain-Ready)
- [x] Temperature Converter (Chain-Ready)
- [ ] Percentage Calculator

### Output

- [x] Copy to Clipboard (End-Node)
- [x] Save as File (End-Node)

---

## 2. JSON / Data Chain (json / file → json / text)

### Parse / Format

- [x] JSON Formatter / Minifier (Chain-Ready)
- [ ] JSON Validator
- [ ] JSON Diff

### Web Parsers

- [x] URL Parser (Chain-Ready)
- [x] JWT Parser (Chain-Ready)
- [x] User-Agent Parser (Chain-Ready)
- [x] Cookie Parser (Chain-Ready)
- [x] HTTP Header Parser (Chain-Ready)

### Image / File

- [x] Image Metadata (Chain-Ready: File → JSON)
- [x] Data URI Generator (Chain-Ready: File → Text)
- [x] QR Code Generator (Chain-Ready: Text → Image)

---

## 11. System / Diagnostics Chain

- [x] System Info (Available)
- [x] CPU / Memory Snapshot (Available)
- [x] Disk Usage Analyzer (Available)
- [x] Network Snapshot (Available)

---

## 12. Universal Export / End Nodes

- [x] Copy to Clipboard
- [x] Save to File
- [x] Export JSON (End-Node)
- [x] Export CSV (End-Node)
- [ ] Share (OS)
