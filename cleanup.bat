@echo off
echo Cleaning up...
rmdir /S /Q "src\tools\media\components"
rmdir /S /Q "src\tools\media\utils"
rmdir /S /Q "src\tools\pdf"
rmdir /S /Q "src\tools\utilities"
rmdir /S /Q "src\tools\network"
del /F /Q "src\tools\media\AudioExtractor.tsx"
del /F /Q "src\tools\media\TiktokDownloader.tsx"
del /F /Q "src\tools\media\UniversalDownloader.tsx"
del /F /Q "src\tools\media\VideoFrames.tsx"
del /F /Q "src\tools\media\VideoMerger.tsx"
del /F /Q "src\tools\media\VideoStudio.tsx"
del /F /Q "src\tools\media\YoutubeDownloader.tsx"
del /F /Q "src\tools\registry\data\pdf.ts"
del /F /Q "src\tools\registry\data\network.ts"
del /F /Q "src\tools\registry\data\utilities.ts"
del /F /Q "src\tools\registry\data\security.ts"
echo Done.
