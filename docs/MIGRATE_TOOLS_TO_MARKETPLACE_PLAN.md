# Plan: Chuyển Tools vào Marketplace

## Tổng quan

Mục tiêu: Chuyển các tools không cần thiết trong core app sang plugin marketplace để:
- Giảm kích thước app ban đầu
- Cho phép users tự chọn tools cần thiết
- Dễ dàng maintain và update từng plugin riêng biệt

## Phân loại Tools hiện tại

### ✅ Đã chuyển sang plugins
- ✅ Crypto Advanced (HMAC, Bearer Token)
- ✅ Web Advanced (Cookie Parser, OTP Generator, User Agent Parser, etc.)
- ✅ Developer Tools (Crontab, Chmod, Docker, Mock Data, Code Snippet)
- ✅ Image Tools (QR Code, SVG Placeholder)
- ✅ Math Tools (Math Evaluator, Percentage, Temperature, Chronometer)
- ✅ PDF Tools (PDF Converter, PDF Security)
- ✅ Text Tools (Lorem Ipsum, Slugify, Regex Replace, Text Statistics, etc.)
- ✅ Media Tools (Voice Recorder, Webcam, Video Recorder, Video Compressor)
- ✅ Beautiful Screenshot (Screenshot annotation tool)

### 🔄 Cần chuyển sang plugins

#### 1. **Converters** (20 tools)
**Nhóm 1: Core Converters (GIỮ LẠI - Essential)**
- ✅ Base64 Converter - **GIỮ LẠI** (quá phổ biến)
- ✅ URL Encode/Decode - **GIỮ LẠI** (quá phổ biến)
- ✅ Number Base Converter - **GIỮ LẠI** (quá phổ biến)

**Nhóm 2: Structured Converters (CHUYỂN)**
- 🔄 Universal Converter (JSON/YAML/XML/CSV) → `advanced-converters` plugin (đã có)
- 🔄 Unicode Converter → `advanced-converters` plugin
- 🔄 Binary/Hex to Text → `advanced-converters` plugin
- 🔄 Query String Converter → `advanced-converters` plugin

**Nhóm 3: Utility Converters (CHUYỂN)**
- 🔄 HTML Entity Encode/Decode → `web-utilities` plugin (mới)
- 🔄 Text Case Converter → `text-utilities` plugin (mới)
- 🔄 Color Converter → `design-tools` plugin (mới)
- 🔄 Date Converter → `date-time-tools` plugin (mới)
- 🔄 Code Minifier/Beautifier → `developer-tools` plugin (đã có, merge vào)
- 🔄 IP Address Converter → `network-utilities` plugin (mới)
- 🔄 MAC Address Converter → `network-utilities` plugin (mới)
- 🔄 File Size Converter → `file-utilities` plugin (mới)
- 🔄 Unit Converter → `unit-converter` plugin (mới)
- 🔄 Epoch Timestamp Converter → `date-time-tools` plugin (mới)
- 🔄 Time Zone Converter → `date-time-tools` plugin (mới)
- 🔄 Percentage/Fraction/Decimal → `math-tools` plugin (đã có, merge vào)
- 🔄 Currency Converter → `currency-tools` plugin (mới)

#### 2. **Formatters** (2 tools)
- 🔄 Code Formatter (JSON/XML/YAML/SQL) → `formatters-advanced` plugin (đã có)
- 🔄 JSON Diff → `developer-tools` plugin (đã có, merge vào)

#### 3. **Development** (1 tool)
- 🔄 Regex Tester → `developer-tools` plugin (đã có, merge vào)
- ✅ Settings - **GIỮ LẠI** (core feature)

#### 4. **Data** (1 tool)
- 🔄 Data Parser → `data-tools` plugin (đã có)

#### 5. **Crypto** (3 tools - đang dùng logic từ plugin)
- 🔄 Hash Generator → `crypto-advanced` plugin (đã có logic, cần chuyển component)
- 🔄 UUID Generator → `crypto-advanced` plugin (đã có logic, cần chuyển component)
- 🔄 Token Generator → `crypto-advanced` plugin (đã có logic, cần chuyển component)

#### 6. **Web** (2 tools - đang dùng logic từ plugin)
- 🔄 URL Parser → `web-advanced` plugin (đã có logic, cần chuyển component)
- 🔄 JWT Parser → `web-advanced` plugin (đã có logic, cần chuyển component)

## Chiến lược Migration

### Phase 1: Tạo plugins mới cần thiết

#### 1.1. Network Utilities Plugin
**Tools:**
- IP Address Converter
- MAC Address Converter

**Dependencies:** Minimal (chỉ logic conversion)

#### 1.2. Date/Time Tools Plugin
**Tools:**
- Date Converter
- Epoch Timestamp Converter
- Time Zone Converter

**Dependencies:** 
- `date-fns` hoặc `dayjs` (lightweight)
- Timezone data

#### 1.3. File Utilities Plugin
**Tools:**
- File Size Converter

**Dependencies:** Minimal

#### 1.4. Unit Converter Plugin
**Tools:**
- Unit Converter (length, weight, volume, speed)

**Dependencies:** Minimal (chỉ conversion logic)

#### 1.5. Currency Tools Plugin
**Tools:**
- Currency Converter

**Dependencies:**
- API để lấy exchange rates (có thể dùng free API như exchangerate-api.com)
- Cache rates locally

#### 1.6. Design Tools Plugin
**Tools:**
- Color Converter

**Dependencies:** Minimal

#### 1.7. Text Utilities Plugin
**Tools:**
- Text Case Converter

**Dependencies:** Minimal

#### 1.8. Web Utilities Plugin
**Tools:**
- HTML Entity Encode/Decode

**Dependencies:** Minimal

### Phase 2: Merge tools vào plugins hiện có

#### 2.1. Developer Tools Plugin
**Thêm:**
- Regex Tester (đã có component)
- Code Minifier/Beautifier (đã có component)
- JSON Diff (đã có component)

#### 2.2. Math Tools Plugin
**Thêm:**
- Percentage/Fraction/Decimal Converter (đã có component)

#### 2.3. Advanced Converters Plugin
**Thêm:**
- Unicode Converter (đã có component)
- Binary/Hex to Text Converter (đã có component)
- Query String Converter (đã có component)

#### 2.4. Formatters Advanced Plugin
**Thêm:**
- Code Formatter (đã có component)

#### 2.5. Crypto Advanced Plugin
**Thêm components:**
- Hash Generator component (logic đã có)
- UUID Generator component (logic đã có)
- Token Generator component (logic đã có)

#### 2.6. Web Advanced Plugin
**Thêm components:**
- URL Parser component (logic đã có)
- JWT Parser component (logic đã có)

#### 2.7. Data Tools Plugin
**Thêm:**
- Data Parser (đã có component)

## Implementation Steps

### Step 1: Tạo plugin structure mới

```bash
# Tạo các plugins mới
plugins/
  network-utilities/
  date-time-tools/
  file-utilities/
  unit-converter/
  currency-tools/
  design-tools/
  text-utilities/
  web-utilities/
```

### Step 2: Di chuyển components và logic

1. **Copy components** từ `src/tools/` sang `plugins/[plugin-name]/src/`
2. **Copy logic** nếu cần (hoặc tạo mới trong plugin)
3. **Update imports** trong components
4. **Tạo manifest.json** cho mỗi plugin

### Step 3: Update registry

1. **Remove tools** từ `src/tools/registry/data/*.ts`
2. **Add comments** ghi chú tools đã chuyển
3. **Update lazy-tools.ts** để remove imports cũ

### Step 4: Update plugin registry

1. **Add entries** vào `resources/plugin-registry.json`
2. **Set verified: true** cho official plugins
3. **Add download URLs** (GitHub Releases)

### Step 5: Testing

1. **Test install/uninstall** từng plugin
2. **Test tools** hoạt động đúng sau khi install
3. **Test backward compatibility** (users cũ có thể update)

## Core Tools (GIỮ LẠI)

Các tools sau sẽ **GIỮ LẠI** trong core app vì quá essential:

1. ✅ **Base64 Converter** - Quá phổ biến, mọi developer cần
2. ✅ **URL Encode/Decode** - Quá phổ biến, mọi developer cần
3. ✅ **Number Base Converter** - Quá phổ biến, mọi developer cần
4. ✅ **Settings** - Core feature, không thể tách

## Plugin Registry Structure

```json
{
  "plugins": [
    {
      "id": "network-utilities",
      "name": "Network Utilities",
      "version": "1.0.0",
      "category": "utility",
      "tools": [
        "ip-address-converter",
        "mac-address-converter"
      ]
    },
    {
      "id": "date-time-tools",
      "name": "Date & Time Tools",
      "version": "1.0.0",
      "category": "utility",
      "tools": [
        "date-converter",
        "epoch-timestamp-converter",
        "timezone-converter"
      ]
    },
    // ... các plugins khác
  ]
}
```

## Migration Checklist

### Phase 1: Preparation
- [ ] Review tất cả tools hiện tại
- [ ] Xác định tools nào giữ lại (core)
- [ ] Tạo list plugins cần tạo mới
- [ ] Tạo list tools cần merge vào plugins hiện có

### Phase 2: Create New Plugins
- [ ] Network Utilities Plugin
- [ ] Date/Time Tools Plugin
- [ ] File Utilities Plugin
- [ ] Unit Converter Plugin
- [ ] Currency Tools Plugin
- [ ] Design Tools Plugin
- [ ] Text Utilities Plugin
- [ ] Web Utilities Plugin

### Phase 3: Merge into Existing Plugins
- [ ] Developer Tools Plugin (Regex, Code Minifier, JSON Diff)
- [ ] Math Tools Plugin (Percentage/Fraction)
- [ ] Advanced Converters Plugin (Unicode, Binary/Hex, Query String)
- [ ] Formatters Advanced Plugin (Code Formatter)
- [ ] Crypto Advanced Plugin (Hash, UUID, Token components)
- [ ] Web Advanced Plugin (URL Parser, JWT Parser components)
- [ ] Data Tools Plugin (Data Parser)

### Phase 4: Update Core
- [ ] Remove tools từ registry
- [ ] Update lazy-tools.ts
- [ ] Update imports
- [ ] Test core app vẫn hoạt động

### Phase 5: Update Plugin Registry
- [ ] Add all new plugins vào registry.json
- [ ] Set download URLs
- [ ] Generate checksums
- [ ] Test install/uninstall flow

### Phase 6: Documentation
- [ ] Update README với plugin system
- [ ] Create migration guide cho users
- [ ] Document plugin development

## Estimated Impact

### Before Migration
- Core app size: ~XX MB
- Number of tools: ~60+ tools
- Load time: ~X seconds

### After Migration
- Core app size: ~XX MB (giảm ~30-40%)
- Core tools: ~4 tools (Base64, URL Encode, Number Base, Settings)
- Load time: ~X seconds (nhanh hơn ~20-30%)
- Plugin marketplace: ~20+ plugins available

## Notes

1. **Backward Compatibility**: Users đã install app cũ sẽ cần update và install plugins để có đầy đủ tools
2. **Migration Path**: Có thể tạo migration script để tự động install các plugins tương ứng với tools cũ
3. **Default Plugins**: Có thể suggest users install một số "essential" plugins khi first launch
4. **Bundle Size**: Mỗi plugin sẽ có size riêng, users chỉ download những gì cần

## Next Steps

1. Bắt đầu với Phase 1: Tạo các plugins mới đơn giản nhất (Network Utilities, File Utilities)
2. Sau đó merge tools vào plugins hiện có
3. Cuối cùng update core và registry
