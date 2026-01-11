import React from 'react';

// Lazy load all tool components for better performance

// Formatters
// Handled by UniversalFormatter


// Converters
export const JsonYamlConverter = React.lazy(() => import('@tools/converters/JsonYamlConverter').then(m => ({ default: m.JsonYamlConverter })));
export const JsonXmlConverter = React.lazy(() => import('@tools/converters/JsonXmlConverter').then(m => ({ default: m.JsonXmlConverter })));
export const JsonToCsv = React.lazy(() => import('@tools/development/JsonToCsv').then(m => ({ default: m.JsonToCsv })));
export const MarkdownHtmlConverter = React.lazy(() => import('@tools/converters/MarkdownHtmlConverter').then(m => ({ default: m.MarkdownHtmlConverter })));
export const Base64Converter = React.lazy(() => import('@tools/converters/Base64Converter').then(m => ({ default: m.Base64Converter })));
export const Base64FileConverter = React.lazy(() => import('@tools/converters/Base64FileConverter').then(m => ({ default: m.Base64FileConverter })));
export const NumberBaseConverter = React.lazy(() => import('@tools/converters/NumberBaseConverter').then(m => ({ default: m.NumberBaseConverter })));
export const CaseConverter = React.lazy(() => import('@tools/converters/CaseConverter').then(m => ({ default: m.CaseConverter })));
export const ColorConverter = React.lazy(() => import('@tools/converters/ColorConverter').then(m => ({ default: m.ColorConverter })));
export const DateConverter = React.lazy(() => import('@tools/converters/DateConverter').then(m => ({ default: m.DateConverter })));
export const CsvExcelConverter = React.lazy(() => import('@tools/converters/CsvExcelConverter').then(m => ({ default: m.CsvExcelConverter })));

// PDF Tools
export const ImagesToPdfConverter = React.lazy(() => import('@tools/pdf/ImagesToPdfConverter').then(m => ({ default: m.ImagesToPdfConverter })));
export const PdfMerger = React.lazy(() => import('@tools/pdf/PdfMerger').then(m => ({ default: m.PdfMerger })));
export const PdfSplitter = React.lazy(() => import('@tools/pdf/PdfSplitter').then(m => ({ default: m.PdfSplitter })));
export const PdfPageExtractor = React.lazy(() => import('@tools/pdf/PdfPageExtractor').then(m => ({ default: m.PdfPageExtractor })));
export const PdfPageRotator = React.lazy(() => import('@tools/pdf/PdfPageRotator').then(m => ({ default: m.PdfPageRotator })));
export const PdfMetadata = React.lazy(() => import('@tools/pdf/PdfMetadata').then(m => ({ default: m.PdfMetadata })));
export const PdfBase64 = React.lazy(() => import('@tools/pdf/PdfBase64').then(m => ({ default: m.PdfBase64 })));
export const PdfCompressor = React.lazy(() => import('@tools/pdf/PdfCompressor').then(m => ({ default: m.PdfCompressor })));
export const PdfValidator = React.lazy(() => import('@tools/pdf/PdfValidator').then(m => ({ default: m.PdfValidator })));
export const PdfPageReorder = React.lazy(() => import('@tools/pdf/PdfPageReorder').then(m => ({ default: m.PdfPageReorder })));
export const PdfWatermarker = React.lazy(() => import('@tools/pdf/PdfWatermarker').then(m => ({ default: m.PdfWatermarker })));
export const PdfPageNumbering = React.lazy(() => import('@tools/pdf/PdfPageNumbering').then(m => ({ default: m.PdfPageNumbering })));
export const HtmlToPdf = React.lazy(() => import('@tools/pdf/HtmlToPdf').then(m => ({ default: m.HtmlToPdf })));
export const MarkdownToPdf = React.lazy(() => import('@tools/pdf/MarkdownToPdf').then(m => ({ default: m.MarkdownToPdf })));
export const PdfMetadataRemover = React.lazy(() => import('@tools/pdf/PdfMetadataRemover').then(m => ({ default: m.PdfMetadataRemover })));

// Crypto
export const HashGenerator = React.lazy(() => import('@tools/crypto/HashGenerator').then(m => ({ default: m.HashGenerator })));
export const UuidGenerator = React.lazy(() => import('@tools/crypto/UuidGenerator').then(m => ({ default: m.UuidGenerator })));
export const TokenGenerator = React.lazy(() => import('@tools/crypto/TokenGenerator').then(m => ({ default: m.TokenGenerator })));
export const HmacGenerator = React.lazy(() => import('@tools/crypto/HmacGenerator').then(m => ({ default: m.HmacGenerator })));
export const AesEncryptor = React.lazy(() => import('@tools/crypto/AesEncryptor').then(m => ({ default: m.AesEncryptor })));
export const BcryptGenerator = React.lazy(() => import('@tools/crypto/BcryptGenerator').then(m => ({ default: m.BcryptGenerator })));

// Web
export const UrlEncoder = React.lazy(() => import('@tools/web/UrlEncoder').then(m => ({ default: m.UrlEncoder })));
export const HtmlEntityEncoder = React.lazy(() => import('@tools/web/HtmlEntityEncoder').then(m => ({ default: m.HtmlEntityEncoder })));
export const UrlParser = React.lazy(() => import('@tools/web/UrlParser').then(m => ({ default: m.UrlParser })));
export const BasicAuthGenerator = React.lazy(() => import('@tools/web/BasicAuthGenerator').then(m => ({ default: m.BasicAuthGenerator })));
export const MimeTypesList = React.lazy(() => import('@tools/web/MimeTypesList').then(m => ({ default: m.MimeTypesList })));
export const SlugGenerator = React.lazy(() => import('@tools/web/SlugGenerator').then(m => ({ default: m.SlugGenerator })));
export const UserAgentParser = React.lazy(() => import('@tools/web/UserAgentParser').then(m => ({ default: m.UserAgentParser })));
export const JwtParser = React.lazy(() => import('@tools/web/JwtParser').then(m => ({ default: m.JwtParser })));
export const HttpStatusCode = React.lazy(() => import('@tools/web/HttpStatusCode').then(m => ({ default: m.HttpStatusCode })));
export const JsonDiff = React.lazy(() => import('@tools/web/JsonDiff').then(m => ({ default: m.JsonDiff })));

// Network
export const Ipv4SubnetCalculator = React.lazy(() => import('@tools/network/Ipv4SubnetCalculator').then(m => ({ default: m.Ipv4SubnetCalculator })));
export const Ipv4Converter = React.lazy(() => import('@tools/network/Ipv4Converter').then(m => ({ default: m.Ipv4Converter })));
export const MacGenerator = React.lazy(() => import('@tools/network/MacGenerator').then(m => ({ default: m.MacGenerator })));
export const MacLookup = React.lazy(() => import('@tools/network/MacLookup').then(m => ({ default: m.MacLookup })));

// Development
export const RegexTester = React.lazy(() => import('@tools/development/RegexTester').then(m => ({ default: m.RegexTester })));
export const CrontabGenerator = React.lazy(() => import('@tools/development/CrontabGenerator').then(m => ({ default: m.CrontabGenerator })));
export const ChmodCalculator = React.lazy(() => import('@tools/development/ChmodCalculator').then(m => ({ default: m.ChmodCalculator })));
export const DockerConverter = React.lazy(() => import('@tools/development/DockerConverter').then(m => ({ default: m.DockerConverter })));
export const PipelineDesigner = React.lazy(() => import('@tools/development/PipelineDesigner').then(m => ({ default: m.default })));

// Utilities
export const ClipboardManager = React.lazy(() => import('@tools/utilities/ClipboardManager').then(m => ({ default: m.ClipboardManager })));
export const DeviceInfo = React.lazy(() => import('@tools/utilities/DeviceInfo').then(m => ({ default: m.DeviceInfo })));
export const StatsMonitor = React.lazy(() => import('@tools/utilities/stats-monitor/StatsMonitor').then(m => ({ default: m.default })));
export const ApplicationManager = React.lazy(() => import('@tools/utilities/ApplicationManager').then(m => ({ default: m.default })));
export const SystemCleaner = React.lazy(() => import('@tools/utilities/system-cleaner/SystemCleaner').then(m => ({ default: m.SystemCleaner })));

// Screenshot & Media
export const Xnapper = React.lazy(() => import('@tools/screenshot/Xnapper'));
export const VideoStudio = React.lazy(() => import('@tools/media/VideoStudio'));
export const VoiceRecorder = React.lazy(() => import('@tools/media/VoiceRecorder').then(m => ({ default: m.VoiceRecorder })));
export const Camera = React.lazy(() => import('@tools/media/Camera').then(m => ({ default: m.Camera })));
export const UniversalDownloader = React.lazy(() => import('@tools/media/UniversalDownloader'));
export const AudioExtractor = React.lazy(() => import('@tools/media/AudioExtractor'));

// Image
export const QrCodeGenerator = React.lazy(() => import('@tools/image/QrCodeGenerator').then(m => ({ default: m.QrCodeGenerator })));
export const ImageConverter = React.lazy(() => import('@tools/image/ImageConverter').then(m => ({ default: m.ImageConverter })));
export const ImageMetadata = React.lazy(() => import('@tools/image/ImageMetadata').then(m => ({ default: m.ImageMetadata })));
export const DataUriGenerator = React.lazy(() => import('@tools/image/DataUriGenerator').then(m => ({ default: m.DataUriGenerator })));
export const SvgPlaceholderGenerator = React.lazy(() => import('@tools/image/SvgPlaceholderGenerator').then(m => ({ default: m.SvgPlaceholderGenerator })));
export const ImageToAscii = React.lazy(() => import('@tools/image/ImageToAscii').then(m => ({ default: m.ImageToAscii })));

// Text
export const LoremIpsumGenerator = React.lazy(() => import('@tools/text/LoremIpsumGenerator').then(m => ({ default: m.LoremIpsumGenerator })));
export const TextStatistics = React.lazy(() => import('@tools/text/TextStatistics').then(m => ({ default: m.TextStatistics })));
export const TextDiff = React.lazy(() => import('@tools/text/TextDiff').then(m => ({ default: m.TextDiff })));
export const StringObfuscator = React.lazy(() => import('@tools/text/StringObfuscator').then(m => ({ default: m.StringObfuscator })));
export const AsciiArtGenerator = React.lazy(() => import('@tools/text/AsciiArtGenerator').then(m => ({ default: m.AsciiArtGenerator })));

// Math
export const MathEvaluator = React.lazy(() => import('@tools/math/MathEvaluator').then(m => ({ default: m.MathEvaluator })));
export const PercentageCalculator = React.lazy(() => import('@tools/math/PercentageCalculator').then(m => ({ default: m.PercentageCalculator })));
export const TemperatureConverter = React.lazy(() => import('@tools/math/TemperatureConverter').then(m => ({ default: m.TemperatureConverter })));
export const Chronometer = React.lazy(() => import('@tools/math/Chronometer').then(m => ({ default: m.Chronometer })));

// Pages
// Pages
export const SettingsPage = React.lazy(() => import('@pages/Settings'));

export const UniversalFormatter = React.lazy(() => import('@tools/development/UniversalFormatter').then(m => ({ default: m.UniversalFormatter })));

