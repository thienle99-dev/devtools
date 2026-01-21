import React from 'react';

// Lazy load all tool components for better performance

// Formatters
// Handled by UniversalFormatter

// Converters
export const Base64FileConverter = React.lazy(() => import('@tools/converters/Base64FileConverter').then(m => ({ default: m.Base64FileConverter })));
export const ColorConverter = React.lazy(() => import('@tools/converters/ColorConverter').then(m => ({ default: m.ColorConverter })));
export const DateConverter = React.lazy(() => import('@tools/converters/DateConverter').then(m => ({ default: m.DateConverter })));

// Crypto
export const HashGenerator = React.lazy(() => import('@tools/crypto/HashGenerator').then(m => ({ default: m.HashGenerator })));
export const UuidGenerator = React.lazy(() => import('@tools/crypto/UuidGenerator').then(m => ({ default: m.UuidGenerator })));
export const TokenGenerator = React.lazy(() => import('@tools/crypto/TokenGenerator').then(m => ({ default: m.TokenGenerator })));
export const HmacGenerator = React.lazy(() => import('@tools/crypto/HmacGenerator').then(m => ({ default: m.HmacGenerator })));
export const BearerTokenGenerator = React.lazy(() => import('@tools/crypto/BearerTokenGenerator').then(m => ({ default: m.BearerTokenGenerator })));

// Web
export const UrlParser = React.lazy(() => import('@tools/web/UrlParser').then(m => ({ default: m.UrlParser })));
export const BasicAuthGenerator = React.lazy(() => import('@tools/web/BasicAuthGenerator').then(m => ({ default: m.BasicAuthGenerator })));
export const MimeTypesList = React.lazy(() => import('@tools/web/MimeTypesList').then(m => ({ default: m.MimeTypesList })));
export const SlugGenerator = React.lazy(() => import('@tools/web/SlugGenerator').then(m => ({ default: m.SlugGenerator })));
export const UserAgentParser = React.lazy(() => import('@tools/web/UserAgentParser').then(m => ({ default: m.UserAgentParser })));
export const JwtParser = React.lazy(() => import('@tools/web/JwtParser').then(m => ({ default: m.JwtParser })));
export const HttpStatusCode = React.lazy(() => import('@tools/web/HttpStatusCode').then(m => ({ default: m.HttpStatusCode })));
export const KeycodeInfo = React.lazy(() => import('@tools/web/KeycodeInfo').then(m => ({ default: m.KeycodeInfo })));
export const OtpGenerator = React.lazy(() => import('@tools/web/OtpGenerator').then(m => ({ default: m.OtpGenerator })));
export const SafelinkDecoder = React.lazy(() => import('@tools/web/SafelinkDecoder').then(m => ({ default: m.SafelinkDecoder })));
export const Base64UrlConverter = React.lazy(() => import('@tools/web/Base64UrlConverter').then(m => ({ default: m.Base64UrlConverter })));
export const HttpHeaderParser = React.lazy(() => import('@tools/web/HttpHeaderParser').then(m => ({ default: m.HttpHeaderParser })));
export const CookieParser = React.lazy(() => import('@tools/web/CookieParser').then(m => ({ default: m.CookieParser })));
export const SetCookieGenerator = React.lazy(() => import('@tools/web/SetCookieGenerator').then(m => ({ default: m.SetCookieGenerator })));
export const ContentTypeParser = React.lazy(() => import('@tools/web/ContentTypeParser').then(m => ({ default: m.ContentTypeParser })));

// Development
export const RegexTester = React.lazy(() => import('@tools/development/RegexTester').then(m => ({ default: m.RegexTester })));
export const CrontabGenerator = React.lazy(() => import('@tools/development/CrontabGenerator').then(m => ({ default: m.CrontabGenerator })));
export const ChmodCalculator = React.lazy(() => import('@tools/development/ChmodCalculator').then(m => ({ default: m.ChmodCalculator })));
export const DockerConverter = React.lazy(() => import('@tools/development/DockerConverter').then(m => ({ default: m.DockerConverter })));
export const MockDataGenerator = React.lazy(() => import('@tools/development/MockDataGenerator').then(m => ({ default: m.MockDataGenerator })));
export const CodeSnippetGenerator = React.lazy(() => import('@tools/development/CodeSnippetGenerator').then(m => ({ default: m.CodeSnippetGenerator })));
export const JsonDiff = React.lazy(() => import('@tools/json/JsonDiff').then(m => ({ default: m.JsonDiff })));

// Screenshot & Media
export const Xnapper = React.lazy(() => import('../../../plugins/beautiful-screenshot/src/Xnapper').then(m => ({ default: m.Xnapper })));
export const VoiceRecorder = React.lazy(() => import('@tools/media/VoiceRecorder').then(m => ({ default: m.VoiceRecorder })));
export const Camera = React.lazy(() => import('@tools/media/Camera').then(m => ({ default: m.Camera })));

// Image
export const QrCodeGenerator = React.lazy(() => import('@tools/image/QrCodeGenerator').then(m => ({ default: m.QrCodeGenerator })));
export const SvgPlaceholderGenerator = React.lazy(() => import('@tools/image/SvgPlaceholderGenerator').then(m => ({ default: m.SvgPlaceholderGenerator })));

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
export const SettingsPage = React.lazy(() => import('@pages/Settings'));
export const DashboardPage = React.lazy(() => import('@pages/Dashboard').then(m => ({ default: m.Dashboard })));

export const UniversalFormatter = React.lazy(() => import('@tools/development/UniversalFormatter').then(m => ({ default: m.UniversalFormatter })));
export const Converter = React.lazy(() => import('@tools/converters/Converter').then(m => ({ default: m.Converter })));

export const VideoCompressor = React.lazy(() => import('@tools/media/VideoCompressor'));

export const PluginMarketplace = React.lazy(() => import('@tools/plugins/PluginMarketplace').then(m => ({ default: m.default })));


// PDF
export const PdfConverter = React.lazy(() => import('@tools/pdf/PdfConverter'));
export const PdfSecurity = React.lazy(() => import('@tools/pdf/PdfSecurity'));

// Data
export const DataParser = React.lazy(() => import('@tools/data/DataParser'));
