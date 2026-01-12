import React from 'react';

// Lazy load all tool components for better performance

// Formatters
// Handled by UniversalFormatter


// Converters
// Converters
export const Base64FileConverter = React.lazy(() => import('@tools/converters/Base64FileConverter').then(m => ({ default: m.Base64FileConverter })));
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
export const SymmetricEncryptor = React.lazy(() => import('@tools/crypto/SymmetricEncryptor').then(m => ({ default: m.SymmetricEncryptor })));
export const RsaGenerator = React.lazy(() => import('@tools/crypto/RsaGenerator').then(m => ({ default: m.RsaGenerator })));
export const BcryptGenerator = React.lazy(() => import('@tools/crypto/BcryptGenerator').then(m => ({ default: m.BcryptGenerator })));
export const BearerTokenGenerator = React.lazy(() => import('@tools/crypto/BearerTokenGenerator').then(m => ({ default: m.BearerTokenGenerator })));
export const SecretsScanner = React.lazy(() => import('@tools/security/SecretsScanner').then(m => ({ default: m.SecretsScanner })));
export const DataMasking = React.lazy(() => import('@tools/security/DataMasking').then(m => ({ default: m.DataMasking })));
export const CertificateTools = React.lazy(() => import('@tools/security/CertificateTools').then(m => ({ default: m.CertificateTools })));
export const PasswordPolicyTester = React.lazy(() => import('@tools/security/PasswordPolicyTester').then(m => ({ default: m.PasswordPolicyTester })));
export const CsrGenerator = React.lazy(() => import('@tools/security/CsrGenerator').then(m => ({ default: m.CsrGenerator })));

// Web
export const UrlParser = React.lazy(() => import('@tools/web/UrlParser').then(m => ({ default: m.UrlParser })));
export const BasicAuthGenerator = React.lazy(() => import('@tools/web/BasicAuthGenerator').then(m => ({ default: m.BasicAuthGenerator })));
export const MimeTypesList = React.lazy(() => import('@tools/web/MimeTypesList').then(m => ({ default: m.MimeTypesList })));
export const SlugGenerator = React.lazy(() => import('@tools/web/SlugGenerator').then(m => ({ default: m.SlugGenerator })));
export const UserAgentParser = React.lazy(() => import('@tools/web/UserAgentParser').then(m => ({ default: m.UserAgentParser })));
export const JwtParser = React.lazy(() => import('@tools/web/JwtParser').then(m => ({ default: m.JwtParser })));
export const HttpStatusCode = React.lazy(() => import('@tools/web/HttpStatusCode').then(m => ({ default: m.HttpStatusCode })));
export const MetaTagsGenerator = React.lazy(() => import('@tools/web/MetaTagsGenerator').then(m => ({ default: m.MetaTagsGenerator })));
export const OpenGraphGenerator = React.lazy(() => import('@tools/web/OpenGraphGenerator').then(m => ({ default: m.OpenGraphGenerator })));
export const UtmBuilder = React.lazy(() => import('@tools/web/UtmBuilder').then(m => ({ default: m.UtmBuilder })));
export const KeycodeInfo = React.lazy(() => import('@tools/web/KeycodeInfo').then(m => ({ default: m.KeycodeInfo })));
export const RobotsTxtGenerator = React.lazy(() => import('@tools/web/RobotsTxtGenerator').then(m => ({ default: m.RobotsTxtGenerator })));
export const OtpGenerator = React.lazy(() => import('@tools/web/OtpGenerator').then(m => ({ default: m.OtpGenerator })));
export const HtmlWysiwyg = React.lazy(() => import('@tools/web/HtmlWysiwyg').then(m => ({ default: m.HtmlWysiwyg })));
export const SafelinkDecoder = React.lazy(() => import('@tools/web/SafelinkDecoder').then(m => ({ default: m.SafelinkDecoder })));
export const Base64UrlConverter = React.lazy(() => import('@tools/web/Base64UrlConverter').then(m => ({ default: m.Base64UrlConverter })));
export const HttpHeaderParser = React.lazy(() => import('@tools/web/HttpHeaderParser').then(m => ({ default: m.HttpHeaderParser })));
export const CspGenerator = React.lazy(() => import('@tools/web/CspGenerator').then(m => ({ default: m.CspGenerator })));
export const StructuredDataGenerator = React.lazy(() => import('@tools/web/StructuredDataGenerator').then(m => ({ default: m.StructuredDataGenerator })));
export const ManifestGenerator = React.lazy(() => import('@tools/web/ManifestGenerator').then(m => ({ default: m.ManifestGenerator })));
export const SitemapGenerator = React.lazy(() => import('@tools/web/SitemapGenerator').then(m => ({ default: m.SitemapGenerator })));
export const ServiceWorkerGenerator = React.lazy(() => import('@tools/web/ServiceWorkerGenerator').then(m => ({ default: m.ServiceWorkerGenerator })));
export const CookieParser = React.lazy(() => import('@tools/web/CookieParser').then(m => ({ default: m.CookieParser })));
export const SetCookieGenerator = React.lazy(() => import('@tools/web/SetCookieGenerator').then(m => ({ default: m.SetCookieGenerator })));
export const CanonicalUrlGenerator = React.lazy(() => import('@tools/web/CanonicalUrlGenerator').then(m => ({ default: m.CanonicalUrlGenerator })));
export const ContentTypeParser = React.lazy(() => import('@tools/web/ContentTypeParser').then(m => ({ default: m.ContentTypeParser })));

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
export const MockDataGenerator = React.lazy(() => import('@tools/development/MockDataGenerator').then(m => ({ default: m.MockDataGenerator })));

export const CodeSnippetGenerator = React.lazy(() => import('@tools/development/CodeSnippetGenerator').then(m => ({ default: m.CodeSnippetGenerator })));
export const LogAnalyzer = React.lazy(() => import('@tools/development/LogAnalyzer').then(m => ({ default: m.LogAnalyzer })));
export const JsonDiff = React.lazy(() => import('@tools/json/JsonDiff').then(m => ({ default: m.JsonDiff })));

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
export const Slugify = React.lazy(() => import('@tools/text/Slugify').then(m => ({ default: m.Slugify })));
export const RegexReplace = React.lazy(() => import('@tools/text/RegexReplace').then(m => ({ default: m.RegexReplace })));

// Math
export const MathEvaluator = React.lazy(() => import('@tools/math/MathEvaluator').then(m => ({ default: m.MathEvaluator })));
export const PercentageCalculator = React.lazy(() => import('@tools/math/PercentageCalculator').then(m => ({ default: m.PercentageCalculator })));
export const TemperatureConverter = React.lazy(() => import('@tools/math/TemperatureConverter').then(m => ({ default: m.TemperatureConverter })));
export const Chronometer = React.lazy(() => import('@tools/math/Chronometer').then(m => ({ default: m.Chronometer })));

// Pages
// Pages
export const SettingsPage = React.lazy(() => import('@pages/Settings'));
export const DashboardPage = React.lazy(() => import('@pages/Dashboard').then(m => ({ default: m.Dashboard })));

export const UniversalFormatter = React.lazy(() => import('@tools/development/UniversalFormatter').then(m => ({ default: m.UniversalFormatter })));
export const Converter = React.lazy(() => import('@tools/converters/Converter').then(m => ({ default: m.Converter })));

