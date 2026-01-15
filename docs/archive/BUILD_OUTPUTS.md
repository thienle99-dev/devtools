# 📦 Build Output Formats

DevTools App supports multiple build output formats for Windows to suit different deployment needs.

## 🎯 Available Formats

### 1. **NSIS Installer (EXE)** 
**Format:** `.exe` installer  
**Command:** `npm run build:win:exe`  
**Output:** `DevTools App-{version}-Setup-x64.exe`

**Features:**
- ✅ Full installer with setup wizard
- ✅ Desktop shortcut creation
- ✅ Start menu integration
- ✅ Uninstaller included
- ✅ Registry entries
- ✅ Custom installation directory

**Best for:**
- Standard installations
- Users who want traditional install experience
- Enterprise deployments

---

### 2. **Portable Executable**
**Format:** Single `.exe` file  
**Command:** `npm run build:win:portable`  
**Output:** `DevTools App-{version}-Portable-x64.exe`

**Features:**
- ✅ Single executable file
- ✅ No installation required
- ✅ No registry entries
- ✅ No admin rights needed
- ✅ Portable - run from USB/external drive
- ✅ Settings stored in app directory

**Best for:**
- Portable usage
- USB drives
- No-install scenarios
- Testing/development

---

### 3. **ZIP Archive**
**Format:** `.zip` archive  
**Command:** `npm run build:win:zip`  
**Output:** `DevTools App-{version}-Portable-x64.zip`

**Features:**
- ✅ Unpacked application folder
- ✅ No installation required
- ✅ Extract and run
- ✅ Multiple files (not single exe)
- ✅ Easy to inspect contents

**Best for:**
- Distribution via download
- Manual extraction
- Custom deployment
- Development/testing

---

## 🚀 Build Commands

### Build All Formats
```bash
npm run build:win
```
Builds all three formats: EXE installer, Portable EXE, and ZIP.

### Build Specific Format
```bash
# NSIS Installer (EXE)
npm run build:win:exe

# Portable Executable
npm run build:win:portable

# ZIP Archive
npm run build:win:zip
```

### Build for All Platforms
```bash
npm run build:all
```

---

## 📊 Format Comparison

| Feature | NSIS (EXE) | Portable (EXE) | ZIP |
|---------|-----------|----------------|-----|
| Installation Required | ✅ Yes | ❌ No | ❌ No |
| Single File | ❌ No | ✅ Yes | ❌ No |
| Registry Entries | ✅ Yes | ❌ No | ❌ No |
| Admin Rights | ⚠️ Optional | ❌ No | ❌ No |
| Desktop Shortcut | ✅ Auto | ❌ Manual | ❌ Manual |
| Portable | ❌ No | ✅ Yes | ✅ Yes |
| File Size | Medium | Smallest | Medium |
| Uninstaller | ✅ Yes | ❌ No | ❌ No |

---

## 📁 Output Location

All builds are output to:
```
dist-electron/pack/
```

Files are named with pattern:
- `DevTools App-{version}-Setup-x64.exe` (NSIS)
- `DevTools App-{version}-Portable-x64.exe` (Portable)
- `DevTools App-{version}-Portable-x64.zip` (ZIP)

---

## ⚙️ Configuration

Build formats are configured in `electron-builder.yml`:

```yaml
win:
  target:
    - target: nsis      # EXE installer
    - target: portable  # Portable EXE
    - target: zip       # ZIP archive
```

---

## 💡 Recommendations

### For End Users
- **Use NSIS (EXE)** for standard installations
- **Use Portable (EXE)** if you want no-install experience

### For Developers
- **Use ZIP** for easy inspection and testing
- **Use Portable** for quick testing without installation

### For Distribution
- **Use NSIS (EXE)** for official releases
- **Use ZIP** for alternative download option
- **Use Portable** for portable app directories

---

## 🔧 Advanced Options

### Custom Artifact Names
Edit `electron-builder.yml` to customize output filenames:

```yaml
nsis:
  artifactName: ${productName}-${version}-Setup-${arch}.${ext}

portable:
  artifactName: ${productName}-${version}-Portable-${arch}.${ext}

zip:
  artifactName: ${productName}-${version}-Portable-${arch}.zip
```

---

## 📝 Notes

- All formats are built for **x64 architecture only** (smaller builds)
- Maximum compression is enabled for all formats
- ASAR packaging is used for all formats
- FFmpeg binaries are unpacked from ASAR for all formats
