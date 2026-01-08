; Custom NSIS installer script for DevTools App
; This file can be included in electron-builder NSIS configuration
; Note: electron-builder handles most installer logic automatically
; This file is optional and can be used for custom installer behavior

; Example: Custom installer behavior
; Uncomment and modify as needed

; !macro customInstall
;   ; Custom installation steps here
;   ; Example: Create additional registry keys
;   WriteRegStr HKLM "Software\DevToolsApp" "InstallPath" "$INSTDIR"
; !macroend

; !macro customUnInstall
;   ; Custom uninstallation steps here
;   ; Example: Remove additional registry keys
;   DeleteRegKey HKLM "Software\DevToolsApp"
; !macroend

