@echo off
echo Executing Comprehensive Plugin Migration Cleanup...

:: 1. Media Tools Cleanup (already done mostly, but ensuring)
rmdir /S /Q "src\tools\media\components"
rmdir /S /Q "src\tools\media\utils"
rmdir /S /Q "src\tools\media\hooks"
del /F /Q "src\tools\media\AudioExtractor.tsx"
del /F /Q "src\tools\media\TiktokDownloader.tsx"
del /F /Q "src\tools\media\UniversalDownloader.tsx"
del /F /Q "src\tools\media\VideoFrames.tsx"
del /F /Q "src\tools\media\VideoMerger.tsx"
del /F /Q "src\tools\media\VideoStudio.tsx"
del /F /Q "src\tools\media\VideoTrimmer.tsx"
del /F /Q "src\tools\media\YoutubeDownloader.tsx"

:: 2. PDF Tools Cleanup
rmdir /S /Q "src\tools\pdf"

:: 3. Security Tools Cleanup
rmdir /S /Q "src\tools\security"

:: 4. Utilities Tools Cleanup
rmdir /S /Q "src\tools\utilities"

:: 5. Network Tools Cleanup
rmdir /S /Q "src\tools\network"

:: 6. Advanced Web Tools Cleanup
del /F /Q "src\tools\web\CanonicalUrlGenerator.tsx"
del /F /Q "src\tools\web\CspGenerator.tsx"
del /F /Q "src\tools\web\HtmlWysiwyg.tsx"
del /F /Q "src\tools\web\ManifestGenerator.tsx"
del /F /Q "src\tools\web\MetaTagsGenerator.tsx"
del /F /Q "src\tools\web\OpenGraphGenerator.tsx"
del /F /Q "src\tools\web\RobotsTxtGenerator.tsx"
del /F /Q "src\tools\web\ServiceWorkerGenerator.tsx"
del /F /Q "src\tools\web\SitemapGenerator.tsx"
del /F /Q "src\tools\web\StructuredDataGenerator.tsx"

:: 7. Development/Pipeline Tools Cleanup
del /F /Q "src\tools\development\PipelineDesigner.tsx"
del /F /Q "src\tools\development\VisualPipelineDesigner.tsx"
del /F /Q "src\tools\development\LogAnalyzer.tsx"

:: 8. Converters Cleanup
del /F /Q "src\tools\converters\CsvExcelConverter.tsx"

:: 9. Registry Data Cleanup
del /F /Q "src\tools\registry\data\pdf.ts"
del /F /Q "src\tools\registry\data\network.ts"
del /F /Q "src\tools\registry\data\utilities.ts"
del /F /Q "src\tools\registry\data\security.ts"
del /F /Q "src\tools\registry\data\media.ts"

echo Done. Core app is now lightweight.
