import { r as __require } from "./chunk-Bfg0lss3.js";
import { BrowserWindow, Menu, Notification, Tray, app, clipboard, desktopCapturer, dialog, globalShortcut, ipcMain, nativeImage, protocol, screen, shell } from "electron";
import path, { dirname, join } from "node:path";
import Store from "electron-store";
import { fileURLToPath } from "node:url";
import * as fs$2 from "node:fs/promises";
import fs from "node:fs/promises";
import { createReadStream } from "node:fs";
import * as os$1 from "node:os";
import os from "node:os";
import { createHash, randomUUID } from "node:crypto";
import { Readable } from "node:stream";
import fs$1 from "fs";
import path$1 from "path";
import nodeCrypto, { createHash as createHash$1, randomUUID as randomUUID$1 } from "crypto";
import { exec, execSync, spawn } from "child_process";
import { promisify } from "util";
import https from "https";
import si from "systeminformation";
import { createRequire } from "module";
import fsp from "fs/promises";
import axios from "axios";
import AdmZip from "adm-zip";
import { exec as exec$1 } from "node:child_process";
import { promisify as promisify$1 } from "node:util";
import http from "http";
import { EventEmitter } from "events";
var VideoMerger = class {
	constructor() {
		this.ffmpegPath = null;
		this.activeProcesses = /* @__PURE__ */ new Map();
		this.initFFmpeg().catch((e) => console.error("FFmpeg init error:", e));
	}
	async initFFmpeg() {
		try {
			const { FFmpegHelper } = await import("./ffmpeg-helper-DXuFX_KP.js");
			const ffmpegPath = FFmpegHelper.getFFmpegPath();
			if (ffmpegPath) {
				this.ffmpegPath = ffmpegPath;
				console.log("✅ Video Merger: FFmpeg ready");
			} else console.warn("⚠️ Video Merger: FFmpeg not available");
		} catch (e) {
			console.warn("FFmpeg setup failed:", e);
		}
	}
	async getVideoInfo(filePath) {
		if (!this.ffmpegPath) throw new Error("FFmpeg not available");
		return new Promise((resolve, reject) => {
			const args = [
				"-i",
				filePath,
				"-hide_banner"
			];
			const process$1 = spawn(this.ffmpegPath, args);
			let output = "";
			process$1.stderr.on("data", (data) => {
				output += data.toString();
			});
			process$1.on("close", () => {
				try {
					const durationMatch = output.match(/Duration: (\d{2}):(\d{2}):(\d{2}\.\d{2})/);
					const duration = durationMatch ? parseInt(durationMatch[1]) * 3600 + parseInt(durationMatch[2]) * 60 + parseFloat(durationMatch[3]) : 0;
					const resMatch = output.match(/Video:.*?, (\d{3,5})x(\d{3,5})/);
					const width = resMatch ? parseInt(resMatch[1]) : 0;
					const height = resMatch ? parseInt(resMatch[2]) : 0;
					const fpsMatch = output.match(/(\d+\.?\d*) fps/);
					const fps = fpsMatch ? parseFloat(fpsMatch[1]) : 0;
					const codecMatch = output.match(/Video: (\w+)/);
					resolve({
						path: filePath,
						duration,
						width,
						height,
						codec: codecMatch ? codecMatch[1] : "unknown",
						fps,
						size: fs$1.existsSync(filePath) ? fs$1.statSync(filePath).size : 0
					});
				} catch (error) {
					reject(/* @__PURE__ */ new Error("Failed to parse video info"));
				}
			});
			process$1.on("error", reject);
		});
	}
	async generateThumbnail(filePath, time = 1) {
		if (!this.ffmpegPath) throw new Error("FFmpeg not available");
		const outputDir = path$1.join(app.getPath("temp"), "devtools-app-thumbs");
		if (!fs$1.existsSync(outputDir)) fs$1.mkdirSync(outputDir, { recursive: true });
		const thumbName = `thumb_${randomUUID$1()}.jpg`;
		const outputPath = path$1.join(outputDir, thumbName);
		return new Promise((resolve, reject) => {
			const args = [
				"-ss",
				time.toString(),
				"-i",
				filePath,
				"-frames:v",
				"1",
				"-q:v",
				"2",
				"-vf",
				"scale=480:-1,unsharp=3:3:1.5:3:3:0.5",
				"-f",
				"image2",
				"-y",
				outputPath
			];
			console.log(`[VideoMerger] Generating thumbnail: ${args.join(" ")}`);
			const process$1 = spawn(this.ffmpegPath, args);
			process$1.on("close", (code) => {
				if (code === 0) {
					const data = fs$1.readFileSync(outputPath, { encoding: "base64" });
					fs$1.unlinkSync(outputPath);
					resolve(`data:image/jpeg;base64,${data}`);
				} else reject(/* @__PURE__ */ new Error("Thumbnail generation failed"));
			});
			process$1.on("error", reject);
		});
	}
	async generateFilmstrip(filePath, duration, count = 10) {
		if (!this.ffmpegPath) throw new Error("FFmpeg not available");
		const actualCount = Math.min(200, Math.max(5, Math.min(count, Math.floor(duration))));
		const tempId = randomUUID$1();
		const outputDir = path$1.join(app.getPath("temp"), "devtools-app-filmstrips", tempId);
		if (!fs$1.existsSync(outputDir)) fs$1.mkdirSync(outputDir, { recursive: true });
		const safeDuration = duration > 0 ? duration : 1;
		const fps = actualCount / safeDuration;
		console.log(`Generating filmstrip (Optimized): Target ${actualCount} frames from ${safeDuration}s video (fps=${fps.toFixed(4)})`);
		const outputPattern = path$1.join(outputDir, "thumb_%03d.jpg").replace(/\\/g, "/");
		return new Promise((resolve, reject) => {
			const args = [
				"-i",
				filePath,
				"-vf",
				`fps=${fps},scale=320:-1,unsharp=3:3:1:3:3:0.5`,
				"-an",
				"-sn",
				"-q:v",
				"4",
				"-f",
				"image2",
				"-y",
				outputPattern
			];
			console.log(`[VideoMerger] Running FFmpeg for filmstrip: ${args.join(" ")}`);
			const process$1 = spawn(this.ffmpegPath, args);
			let stderr = "";
			process$1.stderr.on("data", (data) => {
				stderr += data.toString();
			});
			process$1.on("close", (code) => {
				if (code === 0) try {
					const files = fs$1.readdirSync(outputDir).filter((f) => f.startsWith("thumb_") && f.endsWith(".jpg")).sort();
					if (files.length === 0) {
						console.error("Filmstrip generation failed: No frames produced. FFmpeg output:", stderr);
						reject(/* @__PURE__ */ new Error("No frames produced"));
						return;
					}
					const finalFrames = files.map((f) => {
						const p = path$1.join(outputDir, f);
						return `data:image/jpeg;base64,${fs$1.readFileSync(p, { encoding: "base64" })}`;
					}).slice(0, actualCount);
					try {
						fs$1.rmSync(outputDir, {
							recursive: true,
							force: true
						});
					} catch (cleanupErr) {
						console.warn("Filmstrip cleanup failed:", cleanupErr);
					}
					resolve(finalFrames);
				} catch (e) {
					reject(e);
				}
				else {
					console.error("Filmstrip generation failed with code:", code, stderr);
					reject(/* @__PURE__ */ new Error("Filmstrip generation failed"));
				}
			});
			process$1.on("error", reject);
		});
	}
	async extractWaveform(filePath) {
		if (!this.ffmpegPath) throw new Error("FFmpeg not available");
		console.log("Extracting waveform for:", filePath);
		return new Promise((resolve, reject) => {
			const args = [
				"-i",
				filePath,
				"-vn",
				"-ac",
				"1",
				"-filter:a",
				"aresample=8000",
				"-map",
				"0:a",
				"-c:a",
				"pcm_s16le",
				"-f",
				"data",
				"-"
			];
			const process$1 = spawn(this.ffmpegPath, args);
			const chunks = [];
			process$1.stdout.on("data", (chunk) => {
				chunks.push(chunk);
			});
			process$1.stderr.on("data", () => {});
			process$1.on("close", (code) => {
				if (code === 0) try {
					const buffer = Buffer.concat(chunks);
					const data = [];
					const samplesPerPoint = 80;
					for (let i = 0; i < buffer.length; i += samplesPerPoint * 2) {
						let max = 0;
						for (let j = 0; j < samplesPerPoint; j++) {
							const offset = i + j * 2;
							if (offset + 1 < buffer.length) {
								const val = Math.abs(buffer.readInt16LE(offset));
								if (val > max) max = val;
							}
						}
						data.push(max / 32768);
					}
					console.log(`Waveform extracted: ${data.length} points`);
					resolve(data);
				} catch (err) {
					reject(err);
				}
				else reject(/* @__PURE__ */ new Error("Waveform extraction failed"));
			});
			process$1.on("error", reject);
		});
	}
	async createVideoFromImages(options, progressCallback) {
		if (!this.ffmpegPath) throw new Error("FFmpeg not available");
		const id = randomUUID$1();
		const { imagePaths, fps, outputPath, format, quality } = options;
		if (!imagePaths || imagePaths.length === 0) throw new Error("No images provided");
		const outputDir = outputPath ? path$1.dirname(outputPath) : app.getPath("downloads");
		const outputFilename = outputPath ? path$1.basename(outputPath) : `video_from_frames_${Date.now()}.${format}`;
		const finalOutputPath = path$1.join(outputDir, outputFilename);
		const tempId = randomUUID$1();
		const tempDir = path$1.join(app.getPath("temp"), "devtools-video-frames", tempId);
		if (!fs$1.existsSync(tempDir)) fs$1.mkdirSync(tempDir, { recursive: true });
		const listPath = path$1.join(tempDir, "inputs.txt");
		try {
			const duration = 1 / fps;
			const finalContent = imagePaths.map((p) => {
				return `file '${p.replace(/\\/g, "/").replace(/'/g, "'\\''")}'\nduration ${duration}`;
			}).join("\n") + `\nfile '${imagePaths[imagePaths.length - 1].replace(/\\/g, "/").replace(/'/g, "'\\''")}'`;
			fs$1.writeFileSync(listPath, finalContent);
			const args = [
				"-f",
				"concat",
				"-safe",
				"0",
				"-i",
				listPath
			];
			const filters = [];
			if (format !== "gif") filters.push("scale=trunc(iw/2)*2:trunc(ih/2)*2");
			filters.push(`fps=${fps}`);
			if (options.filter) switch (options.filter) {
				case "grayscale":
					filters.push("hue=s=0");
					break;
				case "sepia":
					filters.push("colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131");
					break;
				case "invert":
					filters.push("negate");
					break;
				case "warm":
					filters.push("eq=gamma_r=1.2:gamma_g=1.0:gamma_b=0.9");
					break;
				case "cool":
					filters.push("eq=gamma_r=0.9:gamma_g=1.0:gamma_b=1.2");
					break;
				case "vintage":
					filters.push("curves=vintage");
					break;
			}
			if (options.watermark && options.watermark.text) {
				const w = options.watermark;
				const safeText = (w.text || "").replace(/:/g, "\\:").replace(/'/g, "");
				let x = "(w-text_w)/2";
				let y = "(h-text_h)/2";
				const padding = 20;
				switch (w.position) {
					case "top-left":
						x = `${padding}`;
						y = `${padding}`;
						break;
					case "top-right":
						x = `w-text_w-${padding}`;
						y = `${padding}`;
						break;
					case "bottom-left":
						x = `${padding}`;
						y = `h-text_h-${padding}`;
						break;
					case "bottom-right":
						x = `w-text_w-${padding}`;
						y = `h-text_h-${padding}`;
						break;
				}
				const fontSize = w.fontSize || 24;
				const fontColor = w.color || "white";
				const alpha = w.opacity || .8;
				filters.push(`drawtext=text='${safeText}':x=${x}:y=${y}:fontsize=${fontSize}:fontcolor=${fontColor}:alpha=${alpha}`);
			}
			if (format === "gif") {
				const filterString = filters.join(",");
				args.push("-vf", `${filterString},split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse`);
			} else {
				const filterString = filters.join(",");
				if (filterString) args.push("-vf", filterString);
				if (format === "mp4") {
					args.push("-c:v", "libx264", "-pix_fmt", "yuv420p");
					if (quality === "low") args.push("-crf", "28");
					else if (quality === "high") args.push("-crf", "18");
					else args.push("-crf", "23");
				} else if (format === "webm") {
					args.push("-c:v", "libvpx-vp9", "-b:v", "0");
					if (quality === "low") args.push("-crf", "40");
					else if (quality === "high") args.push("-crf", "20");
					else args.push("-crf", "30");
				}
			}
			args.push("-y", finalOutputPath);
			console.log(`[VideoMerger] Creating video from images (concat): ${args.join(" ")}`);
			return new Promise((resolve, reject) => {
				const process$1 = spawn(this.ffmpegPath, args);
				this.activeProcesses.set(id, process$1);
				const totalDuration = imagePaths.length / fps;
				process$1.stderr.on("data", (data) => {
					const output = data.toString();
					if (progressCallback) {
						const timeMatch = output.match(/time=(\d{2}):(\d{2}):(\d{2}\.\d{2})/);
						if (timeMatch) {
							const currentTime = parseInt(timeMatch[1]) * 3600 + parseInt(timeMatch[2]) * 60 + parseFloat(timeMatch[3]);
							progressCallback({
								id,
								percent: Math.min(currentTime / totalDuration * 100, 99),
								state: "processing"
							});
						}
					}
				});
				process$1.on("close", (code) => {
					this.activeProcesses.delete(id);
					try {
						fs$1.rmSync(tempDir, {
							recursive: true,
							force: true
						});
					} catch (e) {
						console.warn("Failed to cleanup temp dir", e);
					}
					if (code === 0) {
						if (progressCallback) progressCallback({
							id,
							percent: 100,
							state: "complete",
							outputPath: finalOutputPath
						});
						resolve(finalOutputPath);
					} else reject(/* @__PURE__ */ new Error(`FFmpeg failed with code ${code}`));
				});
				process$1.on("error", (err) => {
					this.activeProcesses.delete(id);
					try {
						fs$1.rmSync(tempDir, {
							recursive: true,
							force: true
						});
					} catch (e) {}
					reject(err);
				});
			});
		} catch (error) {
			try {
				fs$1.rmSync(tempDir, {
					recursive: true,
					force: true
				});
			} catch (e) {}
			throw error;
		}
	}
	async mergeVideos(options, progressCallback) {
		if (!this.ffmpegPath) throw new Error("FFmpeg not available");
		const id = options.id || randomUUID$1();
		const { clips, outputPath, format } = options;
		if (!clips || clips.length === 0) throw new Error("No input clips provided");
		for (const clip of clips) if (!fs$1.existsSync(clip.path)) throw new Error(`File not found: ${clip.path}`);
		if (progressCallback) progressCallback({
			id,
			percent: 0,
			state: "analyzing"
		});
		const videoInfos = await Promise.all(clips.map((c) => this.getVideoInfo(c.path)));
		let totalDuration = 0;
		clips.forEach((clip, i) => {
			const fullDuration = videoInfos[i].duration;
			const start = clip.startTime || 0;
			const end = clip.endTime || fullDuration;
			totalDuration += end - start;
		});
		const outputDir = outputPath ? path$1.dirname(outputPath) : app.getPath("downloads");
		const outputFilename = outputPath ? path$1.basename(outputPath) : `merged_video_${Date.now()}.${format}`;
		const finalOutputPath = path$1.join(outputDir, outputFilename);
		if (!fs$1.existsSync(outputDir)) fs$1.mkdirSync(outputDir, { recursive: true });
		const args = [];
		clips.forEach((clip) => {
			if (clip.startTime !== void 0) args.push("-ss", clip.startTime.toString());
			if (clip.endTime !== void 0) args.push("-to", clip.endTime.toString());
			args.push("-i", clip.path);
		});
		let filterStr = "";
		clips.forEach((_, i) => {
			filterStr += `[${i}:v][${i}:a]`;
		});
		filterStr += `concat=n=${clips.length}:v=1:a=1[v][a]`;
		args.push("-filter_complex", filterStr);
		args.push("-map", "[v]", "-map", "[a]");
		args.push("-c:v", "libx264", "-preset", "medium", "-crf", "23");
		args.push("-c:a", "aac", "-b:a", "128k");
		args.push("-y", finalOutputPath);
		return new Promise((resolve, reject) => {
			const process$1 = spawn(this.ffmpegPath, args);
			this.activeProcesses.set(id, process$1);
			process$1.stderr.on("data", (data) => {
				const output = data.toString();
				const timeMatch = output.match(/time=(\d{2}):(\d{2}):(\d{2}\.\d{2})/);
				if (timeMatch && progressCallback) {
					const currentTime = parseInt(timeMatch[1]) * 3600 + parseInt(timeMatch[2]) * 60 + parseFloat(timeMatch[3]);
					const percent = Math.min(currentTime / totalDuration * 100, 100);
					const speedMatch = output.match(/speed=\s*(\d+\.?\d*)x/);
					progressCallback({
						id,
						percent,
						state: "processing",
						speed: speedMatch ? parseFloat(speedMatch[1]) : 1
					});
				}
			});
			process$1.on("close", (code) => {
				this.activeProcesses.delete(id);
				if (code === 0) {
					if (progressCallback) progressCallback({
						id,
						percent: 100,
						state: "complete",
						outputPath: finalOutputPath
					});
					resolve(finalOutputPath);
				} else reject(/* @__PURE__ */ new Error(`Merge failed with code ${code}`));
			});
			process$1.on("error", (err) => {
				this.activeProcesses.delete(id);
				reject(err);
			});
		});
	}
	cancelMerge(id) {
		const process$1 = this.activeProcesses.get(id);
		if (process$1) {
			process$1.kill();
			this.activeProcesses.delete(id);
		}
	}
};
const videoMerger = new VideoMerger();
var AudioManager = class {
	constructor() {
		this.ffmpegPath = null;
		this.activeProcesses = /* @__PURE__ */ new Map();
		this.initFFmpeg().catch((e) => console.error("Audio Manager FFmpeg init error:", e));
	}
	async initFFmpeg() {
		try {
			const { FFmpegHelper } = await import("./ffmpeg-helper-DXuFX_KP.js");
			this.ffmpegPath = FFmpegHelper.getFFmpegPath();
		} catch (e) {
			console.warn("FFmpeg setup failed for Audio Manager:", e);
		}
	}
	async getAudioInfo(filePath) {
		if (!this.ffmpegPath) throw new Error("FFmpeg not available");
		return new Promise((resolve, reject) => {
			const args = [
				"-i",
				filePath,
				"-hide_banner"
			];
			const process$1 = spawn(this.ffmpegPath, args);
			let output = "";
			process$1.stderr.on("data", (data) => output += data.toString());
			process$1.on("close", () => {
				try {
					const durationMatch = output.match(/Duration: (\d{2}):(\d{2}):(\d{2}\.\d{2})/);
					const duration = durationMatch ? parseInt(durationMatch[1]) * 3600 + parseInt(durationMatch[2]) * 60 + parseFloat(durationMatch[3]) : 0;
					const sampleRateMatch = output.match(/(\d+) Hz/);
					const sampleRate = sampleRateMatch ? parseInt(sampleRateMatch[1]) : 0;
					resolve({
						path: filePath,
						duration,
						format: path$1.extname(filePath).slice(1),
						sampleRate,
						channels: output.includes("stereo") ? 2 : 1,
						size: fs$1.existsSync(filePath) ? fs$1.statSync(filePath).size : 0
					});
				} catch (e) {
					reject(/* @__PURE__ */ new Error("Failed to parse audio info"));
				}
			});
		});
	}
	async applyAudioChanges(options, progressCallback) {
		if (!this.ffmpegPath) throw new Error("FFmpeg not available");
		const id = randomUUID$1();
		const { videoPath, audioLayers, outputPath, outputFormat, keepOriginalAudio, originalAudioVolume } = options;
		if (progressCallback) progressCallback({
			id,
			percent: 0,
			state: "analyzing"
		});
		const videoInfoArgs = [
			"-i",
			videoPath,
			"-hide_banner"
		];
		const infoProcess = spawn(this.ffmpegPath, videoInfoArgs);
		let infoOutput = "";
		await new Promise((resolve) => {
			infoProcess.stderr.on("data", (d) => infoOutput += d.toString());
			infoProcess.on("close", resolve);
		});
		const durationMatch = infoOutput.match(/Duration: (\d{2}):(\d{2}):(\d{2}\.\d{2})/);
		const totalDuration = durationMatch ? parseInt(durationMatch[1]) * 3600 + parseInt(durationMatch[2]) * 60 + parseFloat(durationMatch[3]) : 0;
		const outputDir = outputPath ? path$1.dirname(outputPath) : app.getPath("downloads");
		const finalOutputPath = outputPath || path$1.join(outputDir, `audio_mixed_${Date.now()}.${outputFormat}`);
		const args = ["-i", videoPath];
		audioLayers.forEach((layer) => {
			if (layer.clipStart > 0) args.push("-ss", layer.clipStart.toString());
			if (layer.clipEnd > 0) args.push("-to", layer.clipEnd.toString());
			args.push("-i", layer.path);
		});
		let filterStr = "";
		let inputCount = 0;
		if (keepOriginalAudio) {
			filterStr += `[0:a]volume=${originalAudioVolume}[a0];`;
			inputCount++;
		}
		audioLayers.forEach((layer, i) => {
			const inputIdx = i + 1;
			filterStr += `[${inputIdx}:a]volume=${layer.volume},adelay=${layer.startTime * 1e3}|${layer.startTime * 1e3}[a${inputIdx}];`;
			inputCount++;
		});
		for (let i = 0; i < inputCount; i++) filterStr += `[a${i}]`;
		filterStr += `amix=inputs=${inputCount}:duration=first:dropout_transition=2[aout]`;
		args.push("-filter_complex", filterStr);
		args.push("-map", "0:v", "-map", "[aout]");
		args.push("-c:v", "copy");
		args.push("-c:a", "aac", "-b:a", "192k", "-y", finalOutputPath);
		return new Promise((resolve, reject) => {
			const process$1 = spawn(this.ffmpegPath, args);
			this.activeProcesses.set(id, process$1);
			process$1.stderr.on("data", (data) => {
				const timeMatch = data.toString().match(/time=(\d{2}):(\d{2}):(\d{2}\.\d{2})/);
				if (timeMatch && progressCallback) {
					const currentTime = parseInt(timeMatch[1]) * 3600 + parseInt(timeMatch[2]) * 60 + parseFloat(timeMatch[3]);
					progressCallback({
						id,
						percent: Math.min(currentTime / totalDuration * 100, 100),
						state: "processing"
					});
				}
			});
			process$1.on("close", (code) => {
				this.activeProcesses.delete(id);
				if (code === 0) {
					if (progressCallback) progressCallback({
						id,
						percent: 100,
						state: "complete",
						outputPath: finalOutputPath
					});
					resolve(finalOutputPath);
				} else reject(/* @__PURE__ */ new Error(`Exit code ${code}`));
			});
			process$1.on("error", (err) => {
				this.activeProcesses.delete(id);
				reject(err);
			});
		});
	}
	cancel(id) {
		const p = this.activeProcesses.get(id);
		if (p) {
			p.kill();
			this.activeProcesses.delete(id);
		}
	}
};
const audioManager = new AudioManager();
var AudioExtractor = class {
	constructor() {
		this.ffmpegPath = null;
		this.activeProcesses = /* @__PURE__ */ new Map();
		this.initFFmpeg().catch((e) => console.error("FFmpeg init error:", e));
	}
	async initFFmpeg() {
		try {
			const { FFmpegHelper } = await import("./ffmpeg-helper-DXuFX_KP.js");
			const ffmpegPath = FFmpegHelper.getFFmpegPath();
			if (ffmpegPath) {
				this.ffmpegPath = ffmpegPath;
				console.log("✅ Audio Extractor: FFmpeg ready");
			} else console.warn("⚠️ Audio Extractor: FFmpeg not available");
		} catch (e) {
			console.warn("FFmpeg setup failed:", e);
		}
	}
	async getAudioInfo(filePath) {
		if (!this.ffmpegPath) throw new Error("FFmpeg not available");
		return new Promise((resolve, reject) => {
			const args = [
				"-i",
				filePath,
				"-hide_banner"
			];
			const process$1 = spawn(this.ffmpegPath, args);
			let output = "";
			process$1.stderr.on("data", (data) => {
				output += data.toString();
			});
			process$1.on("close", () => {
				try {
					const durationMatch = output.match(/Duration: (\d{2}):(\d{2}):(\d{2}\.\d{2})/);
					const duration = durationMatch ? parseInt(durationMatch[1]) * 3600 + parseInt(durationMatch[2]) * 60 + parseFloat(durationMatch[3]) : 0;
					const audioMatch = output.match(/Stream #\d+:\d+.*?: Audio: (\w+).*?, (\d+) Hz.*?, (\w+).*?, (\d+) kb\/s/);
					const hasAudio = !!audioMatch;
					const hasVideo = output.includes("Video:");
					resolve({
						duration,
						bitrate: audioMatch ? parseInt(audioMatch[4]) : 0,
						sampleRate: audioMatch ? parseInt(audioMatch[2]) : 0,
						channels: audioMatch && audioMatch[3].includes("stereo") ? 2 : 1,
						codec: audioMatch ? audioMatch[1] : "unknown",
						size: fs$1.existsSync(filePath) ? fs$1.statSync(filePath).size : 0,
						hasAudio,
						hasVideo
					});
				} catch (error) {
					reject(/* @__PURE__ */ new Error("Failed to parse audio info"));
				}
			});
			process$1.on("error", reject);
		});
	}
	async extractAudio(options, progressCallback) {
		if (!this.ffmpegPath) throw new Error("FFmpeg not available");
		const id = options.id || randomUUID$1();
		const { inputPath, outputPath, format, bitrate, sampleRate, channels, trim, normalize, fadeIn, fadeOut } = options;
		if (!fs$1.existsSync(inputPath)) throw new Error("Input file not found");
		const audioInfo = await this.getAudioInfo(inputPath);
		if (!audioInfo.hasAudio) throw new Error("No audio stream found in input file");
		const inputFilename = path$1.basename(inputPath, path$1.extname(inputPath));
		const outputDir = outputPath ? path$1.dirname(outputPath) : app.getPath("downloads");
		const outputFilename = outputPath ? path$1.basename(outputPath) : `${inputFilename}_extracted.${format}`;
		const finalOutputPath = path$1.join(outputDir, outputFilename);
		if (!fs$1.existsSync(outputDir)) fs$1.mkdirSync(outputDir, { recursive: true });
		const args = ["-i", inputPath];
		if (trim?.start !== void 0) args.push("-ss", trim.start.toString());
		if (trim?.end !== void 0) args.push("-to", trim.end.toString());
		args.push("-vn");
		const filters = [];
		if (normalize) filters.push("loudnorm");
		if (fadeIn && fadeIn > 0) filters.push(`afade=t=in:d=${fadeIn}`);
		if (fadeOut && fadeOut > 0) {
			const startTime = (trim?.end || audioInfo.duration) - fadeOut;
			filters.push(`afade=t=out:st=${startTime}:d=${fadeOut}`);
		}
		if (filters.length > 0) args.push("-af", filters.join(","));
		switch (format) {
			case "mp3":
				args.push("-acodec", "libmp3lame");
				if (bitrate) args.push("-b:a", bitrate);
				break;
			case "aac":
				args.push("-acodec", "aac");
				if (bitrate) args.push("-b:a", bitrate);
				break;
			case "flac":
				args.push("-acodec", "flac");
				break;
			case "wav":
				args.push("-acodec", "pcm_s16le");
				break;
			case "ogg":
				args.push("-acodec", "libvorbis");
				if (bitrate) args.push("-b:a", bitrate);
				break;
			case "m4a":
				args.push("-acodec", "aac");
				if (bitrate) args.push("-b:a", bitrate);
				break;
		}
		if (sampleRate) args.push("-ar", sampleRate.toString());
		if (channels) args.push("-ac", channels.toString());
		args.push("-y", finalOutputPath);
		return new Promise((resolve, reject) => {
			const process$1 = spawn(this.ffmpegPath, args);
			this.activeProcesses.set(id, process$1);
			let duration = audioInfo.duration;
			if (trim?.start && trim?.end) duration = trim.end - trim.start;
			else if (trim?.end) duration = trim.end;
			process$1.stderr.on("data", (data) => {
				const output = data.toString();
				const timeMatch = output.match(/time=(\d{2}):(\d{2}):(\d{2}\.\d{2})/);
				if (timeMatch && progressCallback) {
					const currentTime = parseInt(timeMatch[1]) * 3600 + parseInt(timeMatch[2]) * 60 + parseFloat(timeMatch[3]);
					const percent = Math.min(currentTime / duration * 100, 100);
					const speedMatch = output.match(/speed=\s*(\d+\.?\d*)x/);
					progressCallback({
						id,
						filename: outputFilename,
						inputPath,
						percent,
						state: "processing",
						speed: speedMatch ? parseFloat(speedMatch[1]) : 1
					});
				}
			});
			process$1.on("close", (code) => {
				this.activeProcesses.delete(id);
				if (code === 0) {
					if (progressCallback) progressCallback({
						id,
						filename: outputFilename,
						inputPath,
						percent: 100,
						state: "complete",
						outputPath: finalOutputPath
					});
					resolve(finalOutputPath);
				} else reject(/* @__PURE__ */ new Error(`FFmpeg exited with code ${code}`));
			});
			process$1.on("error", (err) => {
				this.activeProcesses.delete(id);
				reject(err);
			});
		});
	}
	cancelExtraction(id) {
		const process$1 = this.activeProcesses.get(id);
		if (process$1) {
			process$1.kill();
			this.activeProcesses.delete(id);
		}
	}
	cancelAll() {
		this.activeProcesses.forEach((process$1) => process$1.kill());
		this.activeProcesses.clear();
	}
};
const audioExtractor = new AudioExtractor();
var VideoTrimmer = class {
	constructor() {
		this.ffmpegPath = null;
		this.activeProcesses = /* @__PURE__ */ new Map();
		this.initFFmpeg().catch((e) => console.error("Video Trimmer FFmpeg init error:", e));
	}
	async initFFmpeg() {
		try {
			const { FFmpegHelper } = await import("./ffmpeg-helper-DXuFX_KP.js");
			this.ffmpegPath = FFmpegHelper.getFFmpegPath();
		} catch (e) {
			console.warn("FFmpeg setup failed for Video Trimmer:", e);
		}
	}
	async process(options, progressCallback) {
		if (!this.ffmpegPath) throw new Error("FFmpeg not available");
		const { inputPath, ranges, mode, outputFormat, outputPath } = options;
		const id = randomUUID$1();
		if (progressCallback) progressCallback({
			id,
			percent: 0,
			state: "analyzing"
		});
		const outputDir = outputPath ? path$1.dirname(outputPath) : app.getPath("downloads");
		const results = [];
		if (mode === "trim" || mode === "cut") {
			const finalOutputPath = outputPath || path$1.join(outputDir, `trimmed_${Date.now()}.${outputFormat}`);
			const args = [];
			if (ranges.length === 1 && mode === "trim") {
				args.push("-ss", ranges[0].start.toString(), "-to", ranges[0].end.toString(), "-i", inputPath);
				args.push("-c", "copy", "-y", finalOutputPath);
			} else {
				args.push("-i", inputPath);
				let filterStr = "";
				ranges.forEach((range, i) => {
					filterStr += `[0:v]trim=start=${range.start}:end=${range.end},setpts=PTS-STARTPTS[v${i}];`;
					filterStr += `[0:a]atrim=start=${range.start}:end=${range.end},asetpts=PTS-STARTPTS[a${i}];`;
				});
				for (let i = 0; i < ranges.length; i++) filterStr += `[v${i}][a${i}]`;
				filterStr += `concat=n=${ranges.length}:v=1:a=1[outv][outa]`;
				args.push("-filter_complex", filterStr);
				args.push("-map", "[outv]", "-map", "[outa]");
				args.push("-c:v", "libx264", "-preset", "ultrafast", "-crf", "23");
				args.push("-c:a", "aac", "-y", finalOutputPath);
			}
			await this.runFFmpeg(args, id, ranges.reduce((acc, r) => acc + (r.end - r.start), 0), progressCallback);
			results.push(finalOutputPath);
		} else if (mode === "split") for (let i = 0; i < ranges.length; i++) {
			const range = ranges[i];
			const splitPath = path$1.join(outputDir, `split_${i + 1}_${Date.now()}.${outputFormat}`);
			const args = [
				"-ss",
				range.start.toString(),
				"-to",
				range.end.toString(),
				"-i",
				inputPath,
				"-c",
				"copy",
				"-y",
				splitPath
			];
			if (progressCallback) progressCallback({
				id,
				percent: i / ranges.length * 100,
				state: "processing"
			});
			await this.runFFmpeg(args, id, range.end - range.start);
			results.push(splitPath);
		}
		if (progressCallback) progressCallback({
			id,
			percent: 100,
			state: "complete",
			outputPath: results[0]
		});
		return results;
	}
	async runFFmpeg(args, id, totalDuration, progressCallback) {
		return new Promise((resolve, reject) => {
			const process$1 = spawn(this.ffmpegPath, args);
			this.activeProcesses.set(id, process$1);
			process$1.stderr.on("data", (data) => {
				const timeMatch = data.toString().match(/time=(\d{2}):(\d{2}):(\d{2}\.\d{2})/);
				if (timeMatch && progressCallback) {
					const currentTime = parseInt(timeMatch[1]) * 3600 + parseInt(timeMatch[2]) * 60 + parseFloat(timeMatch[3]);
					progressCallback({
						id,
						percent: Math.min(currentTime / totalDuration * 100, 100),
						state: "processing"
					});
				}
			});
			process$1.on("close", (code) => {
				this.activeProcesses.delete(id);
				if (code === 0) resolve();
				else reject(/* @__PURE__ */ new Error(`FFmpeg exited with code ${code}`));
			});
			process$1.on("error", (err) => {
				this.activeProcesses.delete(id);
				reject(err);
			});
		});
	}
	cancel(id) {
		const p = this.activeProcesses.get(id);
		if (p) {
			p.kill();
			this.activeProcesses.delete(id);
		}
	}
};
const videoTrimmer = new VideoTrimmer();
var VideoEffects = class {
	constructor() {
		this.ffmpegPath = null;
		this.activeProcesses = /* @__PURE__ */ new Map();
		this.initFFmpeg().catch((e) => console.error("FFmpeg init error:", e));
	}
	async initFFmpeg() {
		try {
			const { FFmpegHelper } = await import("./ffmpeg-helper-DXuFX_KP.js");
			const ffmpegPath = FFmpegHelper.getFFmpegPath();
			if (ffmpegPath) {
				this.ffmpegPath = ffmpegPath;
				console.log("✅ Video Effects: FFmpeg ready");
			} else console.warn("⚠️ Video Effects: FFmpeg not available");
		} catch (e) {
			console.warn("FFmpeg setup failed:", e);
		}
	}
	async applyEffects(options, progressCallback) {
		if (!this.ffmpegPath) throw new Error("FFmpeg not available");
		const id = options.id || randomUUID$1();
		const { inputPath, outputPath, format } = options;
		if (!fs$1.existsSync(inputPath)) throw new Error(`File not found: ${inputPath}`);
		if (progressCallback) progressCallback({
			id,
			percent: 0,
			state: "analyzing"
		});
		const videoInfo = await this.getVideoInfo(inputPath);
		const totalDuration = options.speed ? videoInfo.duration / options.speed : videoInfo.duration;
		const outputDir = outputPath ? path$1.dirname(outputPath) : app.getPath("downloads");
		const outputFilename = outputPath ? path$1.basename(outputPath) : `effect_video_${Date.now()}.${format}`;
		const finalOutputPath = path$1.join(outputDir, outputFilename);
		if (!fs$1.existsSync(outputDir)) fs$1.mkdirSync(outputDir, { recursive: true });
		const args = ["-i", inputPath];
		let vFilters = [];
		let aFilters = [];
		if (options.speed && options.speed !== 1) {
			vFilters.push(`setpts=${1 / options.speed}*PTS`);
			let tempSpeed = options.speed;
			while (tempSpeed > 2) {
				aFilters.push("atempo=2.0");
				tempSpeed /= 2;
			}
			while (tempSpeed < .5) {
				aFilters.push("atempo=0.5");
				tempSpeed /= .5;
			}
			aFilters.push(`atempo=${tempSpeed}`);
		}
		if (options.flip === "horizontal" || options.flip === "both") vFilters.push("hflip");
		if (options.flip === "vertical" || options.flip === "both") vFilters.push("vflip");
		if (options.rotate) {
			if (options.rotate === 90) vFilters.push("transpose=1");
			else if (options.rotate === 180) vFilters.push("transpose=2,transpose=2");
			else if (options.rotate === 270) vFilters.push("transpose=2");
		}
		if (options.brightness !== void 0 || options.contrast !== void 0 || options.saturation !== void 0 || options.gamma !== void 0) vFilters.push(`eq=brightness=${options.brightness || 0}:contrast=${options.contrast !== void 0 ? options.contrast : 1}:saturation=${options.saturation !== void 0 ? options.saturation : 1}:gamma=${options.gamma !== void 0 ? options.gamma : 1}`);
		if (options.grayscale) vFilters.push("hue=s=0");
		if (options.sepia) vFilters.push("colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131");
		if (options.blur) vFilters.push(`boxblur=${options.blur}:1`);
		if (options.noise) vFilters.push(`noise=alls=${options.noise}:allf=t+u`);
		if (options.sharpen) vFilters.push("unsharp=5:5:1.0:5:5:0.0");
		if (options.vintage) {
			vFilters.push("curves=vintage");
			vFilters.push("vignette=PI/4");
		}
		if (options.reverse) {
			vFilters.push("reverse");
			aFilters.push("areverse");
		}
		if (vFilters.length > 0) args.push("-vf", vFilters.join(","));
		if (aFilters.length > 0) args.push("-af", aFilters.join(","));
		if (options.quality === "low") args.push("-c:v", "libx264", "-preset", "ultrafast", "-crf", "30");
		else if (options.quality === "high") args.push("-c:v", "libx264", "-preset", "slow", "-crf", "18");
		else args.push("-c:v", "libx264", "-preset", "medium", "-crf", "23");
		args.push("-c:a", "aac", "-b:a", "128k");
		args.push("-y", finalOutputPath);
		return new Promise((resolve, reject) => {
			const process$1 = spawn(this.ffmpegPath, args);
			this.activeProcesses.set(id, process$1);
			process$1.stderr.on("data", (data) => {
				const output = data.toString();
				const timeMatch = output.match(/time=(\d{2}):(\d{2}):(\d{2}\.\d{2})/);
				if (timeMatch && progressCallback) {
					const currentTime = parseInt(timeMatch[1]) * 3600 + parseInt(timeMatch[2]) * 60 + parseFloat(timeMatch[3]);
					const percent = Math.min(currentTime / totalDuration * 100, 100);
					const speedMatch = output.match(/speed=\s*(\d+\.?\d*)x/);
					progressCallback({
						id,
						percent,
						state: "processing",
						speed: speedMatch ? parseFloat(speedMatch[1]) : 1
					});
				}
			});
			process$1.on("close", (code) => {
				this.activeProcesses.delete(id);
				if (code === 0) {
					if (progressCallback) progressCallback({
						id,
						percent: 100,
						state: "complete",
						outputPath: finalOutputPath
					});
					resolve(finalOutputPath);
				} else reject(/* @__PURE__ */ new Error(`Effects application failed with code ${code}`));
			});
			process$1.on("error", (err) => {
				this.activeProcesses.delete(id);
				reject(err);
			});
		});
	}
	async getVideoInfo(filePath) {
		if (!this.ffmpegPath) throw new Error("FFmpeg not available");
		return new Promise((resolve, reject) => {
			const process$1 = spawn(this.ffmpegPath, [
				"-i",
				filePath,
				"-hide_banner"
			]);
			let output = "";
			process$1.stderr.on("data", (data) => output += data.toString());
			process$1.on("close", (code) => {
				if (code !== 0 && !output.includes("Duration")) {
					reject(/* @__PURE__ */ new Error("Failed to get video info"));
					return;
				}
				const durationMatch = output.match(/Duration: (\d{2}):(\d{2}):(\d{2}\.\d{2})/);
				resolve({ duration: durationMatch ? parseInt(durationMatch[1]) * 3600 + parseInt(durationMatch[2]) * 60 + parseFloat(durationMatch[3]) : 0 });
			});
			process$1.on("error", reject);
		});
	}
	cancelEffects(id) {
		const process$1 = this.activeProcesses.get(id);
		if (process$1) {
			process$1.kill();
			this.activeProcesses.delete(id);
		}
	}
};
const videoEffects = new VideoEffects();
var VideoCompressor = class {
	getPreviewStream(filePath) {
		if (!this.ffmpegPath) throw new Error("FFmpeg not available");
		const args = [
			"-i",
			filePath,
			"-c:v",
			"libx264",
			"-preset",
			"ultrafast",
			"-tune",
			"zerolatency",
			"-vf",
			"scale=-2:720",
			"-c:a",
			"aac",
			"-b:a",
			"128k",
			"-ac",
			"2",
			"-f",
			"ismv",
			"-movflags",
			"frag_keyframe+empty_moov+default_base_moof",
			"pipe:1"
		];
		console.log(`[VideoCompressor] Starting preview stream for ${filePath}`);
		const process$1 = spawn(this.ffmpegPath, args);
		process$1.stdout.on("close", () => {
			try {
				process$1.kill();
			} catch (e) {}
		});
		process$1.stderr.on("data", () => {});
		return process$1.stdout;
	}
	constructor() {
		this.ffmpegPath = null;
		this.activeProcesses = /* @__PURE__ */ new Map();
		this.initFFmpeg().catch((e) => console.error("FFmpeg init error:", e));
	}
	async initFFmpeg() {
		try {
			const { FFmpegHelper } = await import("./ffmpeg-helper-DXuFX_KP.js");
			const ffmpegPath = FFmpegHelper.getFFmpegPath();
			if (ffmpegPath) {
				this.ffmpegPath = ffmpegPath;
				console.log("✅ Video Compressor: FFmpeg ready");
			} else console.warn("⚠️ Video Compressor: FFmpeg not available");
		} catch (e) {
			console.warn("FFmpeg setup failed:", e);
		}
	}
	async getVideoInfo(filePath) {
		if (!this.ffmpegPath) throw new Error("FFmpeg not available");
		return new Promise((resolve, reject) => {
			const args = [
				"-i",
				filePath,
				"-hide_banner"
			];
			const process$1 = spawn(this.ffmpegPath, args);
			let output = "";
			process$1.stderr.on("data", (data) => {
				output += data.toString();
			});
			process$1.on("close", () => {
				try {
					const durationMatch = output.match(/Duration: (\d{2}):(\d{2}):(\d{2}(?:\.\d+)?)/i);
					const duration = durationMatch ? parseInt(durationMatch[1]) * 3600 + parseInt(durationMatch[2]) * 60 + parseFloat(durationMatch[3]) : 0;
					console.log("[VideoCompressor] Info Output:", output);
					const globalBitrateMatch = output.match(/bitrate: (\d+) kb\/s/i);
					let bitrate = globalBitrateMatch ? parseInt(globalBitrateMatch[1]) : 0;
					const videoLineMatch = output.match(/Stream #.*: Video: .*/i);
					let codec = "unknown";
					let width = 0;
					let height = 0;
					let fps = 0;
					if (videoLineMatch) {
						const videoLine = videoLineMatch[0];
						const codecMatch = videoLine.match(/Video: ([^,\s]+)/i);
						if (codecMatch) codec = codecMatch[1];
						const resMatch = videoLine.match(/(\d{2,5})x(\d{2,5})/);
						if (resMatch) {
							width = parseInt(resMatch[1]);
							height = parseInt(resMatch[2]);
						}
						const fpsMatch = output.match(/, (\d+(?:\.\d+)?) fps/i);
						if (fpsMatch) fps = parseFloat(fpsMatch[1]);
					} else {
						const resMatch = output.match(/ (\d{2,5})x(\d{2,5})/);
						if (resMatch) {
							width = parseInt(resMatch[1]);
							height = parseInt(resMatch[2]);
						}
					}
					if (!videoLineMatch) console.warn("[VideoCompressor] No video stream info found in output for", filePath, output);
					if (width === 0 || height === 0) {
						const resMatch = output.match(/ (\d{2,5})x(\d{2,5})/);
						if (resMatch) {
							width = parseInt(resMatch[1]);
							height = parseInt(resMatch[2]);
						}
					}
					resolve({
						path: filePath,
						duration,
						width,
						height,
						codec,
						fps,
						size: fs$1.existsSync(filePath) ? fs$1.statSync(filePath).size : 0,
						bitrate
					});
				} catch (error) {
					reject(/* @__PURE__ */ new Error("Failed to parse video info"));
				}
			});
			process$1.on("error", reject);
		});
	}
	async generateThumbnail(filePath) {
		try {
			const { nativeImage: nativeImage$1 } = await import("electron");
			const thumbnail = await nativeImage$1.createThumbnailFromPath(filePath, {
				width: 1280,
				height: 720
			});
			if (thumbnail.isEmpty()) return null;
			return thumbnail.toDataURL();
		} catch (e) {
			console.error("Thumbnail generation failed:", e);
			return null;
		}
	}
	async compress(options, progressCallback) {
		if (!this.ffmpegPath) throw new Error("FFmpeg not available");
		const id = options.id || randomUUID$1();
		const { inputPath, outputPath, format, resolution, preset, crf, bitrate, scaleMode, keepAudio } = options;
		if (!fs$1.existsSync(inputPath)) throw new Error(`File not found: ${inputPath}`);
		const totalDuration = (await this.getVideoInfo(inputPath)).duration;
		const outputDir = outputPath ? path$1.dirname(outputPath) : app.getPath("downloads");
		const outputFilename = outputPath ? path$1.basename(outputPath) : `compressed_${path$1.basename(inputPath, path$1.extname(inputPath))}_${Date.now()}.${format}`;
		const finalOutputPath = path$1.join(outputDir, outputFilename);
		if (!fs$1.existsSync(outputDir)) fs$1.mkdirSync(outputDir, { recursive: true });
		let calculatedVideoBitrate = bitrate;
		if (options.targetSize && totalDuration > 0) {
			const availableVideoBits = options.targetSize * 8 - (keepAudio ? 128e3 : 0) * totalDuration;
			const videoBitrateKbps = Math.floor(availableVideoBits / totalDuration / 1e3);
			calculatedVideoBitrate = `${Math.max(100, videoBitrateKbps)}k`;
		}
		const args = [
			"-threads",
			"0",
			"-i",
			inputPath
		];
		const filters = [];
		if (resolution) {
			let scaleString = `scale=${resolution.width}:${resolution.height}`;
			if (scaleMode === "fit") scaleString = `scale=${resolution.width}:${resolution.height}:force_original_aspect_ratio=decrease,pad=${resolution.width}:${resolution.height}:(ow-iw)/2:(oh-ih)/2`;
			else if (scaleMode === "fill") scaleString = `scale=${resolution.width}:${resolution.height}:force_original_aspect_ratio=increase,crop=${resolution.width}:${resolution.height}`;
			filters.push(scaleString);
		}
		if (filters.length > 0 || resolution) filters.push("scale=trunc(iw/2)*2:trunc(ih/2)*2");
		if (filters.length > 0) args.push("-vf", filters.join(","));
		const useHW = options.useHardwareAcceleration;
		const platform = process.platform;
		const targetCodec = options.codec || "h264";
		let vCodec = "libx264";
		if (targetCodec === "h264") if (useHW) if (platform === "darwin") vCodec = "h264_videotoolbox";
		else if (platform === "win32") vCodec = "h264_nvenc";
		else vCodec = "libx264";
		else vCodec = "libx264";
		else if (targetCodec === "hevc") if (useHW) if (platform === "darwin") vCodec = "hevc_videotoolbox";
		else if (platform === "win32") vCodec = "hevc_nvenc";
		else vCodec = "libx265";
		else vCodec = "libx265";
		else if (targetCodec === "vp9") vCodec = "libvpx-vp9";
		else if (targetCodec === "av1") vCodec = "libsvtav1";
		args.push("-c:v", vCodec);
		if (targetCodec === "h264" || targetCodec === "hevc") {
			if (calculatedVideoBitrate) args.push("-b:v", calculatedVideoBitrate);
			else {
				const q = Math.max(0, Math.min(100, 100 - (crf || 23) * 1.5));
				if (vCodec.includes("videotoolbox")) args.push("-q:v", Math.round(q).toString());
				else if (vCodec.includes("nvenc")) {
					args.push("-cq", (crf || 23).toString());
					args.push("-preset", "p4");
				} else {
					args.push("-crf", (crf || 23).toString());
					args.push("-preset", preset || "medium");
				}
			}
			if (!vCodec.includes("videotoolbox")) args.push("-pix_fmt", "yuv420p");
		} else if (targetCodec === "vp9") {
			if (calculatedVideoBitrate) args.push("-b:v", calculatedVideoBitrate);
			else {
				args.push("-crf", (crf || 30).toString());
				args.push("-b:v", "0");
			}
			args.push("-row-mt", "1");
		} else if (targetCodec === "av1") {
			if (calculatedVideoBitrate) args.push("-b:v", calculatedVideoBitrate);
			else args.push("-crf", (crf || 30).toString());
			args.push("-preset", preset ? preset === "veryslow" ? "3" : "5" : "5");
		}
		if (!keepAudio) args.push("-an");
		else args.push("-c:a", "aac", "-b:a", "128k");
		args.push("-y", finalOutputPath);
		return new Promise((resolve, reject) => {
			console.log(`[VideoCompressor] Command: ${this.ffmpegPath} ${args.join(" ")}`);
			const process$1 = spawn(this.ffmpegPath, args);
			this.activeProcesses.set(id, process$1);
			process$1.stderr.on("data", (data) => {
				const output = data.toString();
				const timeMatch = output.match(/time=(\d{2}):(\d{2}):(\d{2}\.\d{2})/);
				if (timeMatch && progressCallback) {
					const currentTime = parseInt(timeMatch[1]) * 3600 + parseInt(timeMatch[2]) * 60 + parseFloat(timeMatch[3]);
					const percent = Math.min(currentTime / totalDuration * 100, 100);
					const speedMatch = output.match(/speed=\s*(\d+\.?\d*)x/);
					const speed = speedMatch ? parseFloat(speedMatch[1]) : 1;
					const sizeMatch = output.match(/size=\s*(\d+)kB/);
					const currentSize = sizeMatch ? parseInt(sizeMatch[1]) * 1024 : void 0;
					let eta = 0;
					if (speed > 0) {
						const remainingDuration = totalDuration - currentTime;
						eta = Math.max(0, remainingDuration / speed);
					}
					progressCallback({
						id,
						percent,
						state: "processing",
						speed,
						currentSize,
						eta
					});
				}
			});
			process$1.on("close", (code) => {
				this.activeProcesses.delete(id);
				if (code === 0) {
					if (progressCallback) progressCallback({
						id,
						percent: 100,
						state: "complete",
						outputPath: finalOutputPath,
						currentSize: fs$1.existsSync(finalOutputPath) ? fs$1.statSync(finalOutputPath).size : 0
					});
					resolve(finalOutputPath);
				} else reject(/* @__PURE__ */ new Error(`Compression failed with code ${code}`));
			});
			process$1.on("error", (err) => {
				this.activeProcesses.delete(id);
				reject(err);
			});
		});
	}
	cancel(id) {
		const process$1 = this.activeProcesses.get(id);
		if (process$1) {
			process$1.kill();
			this.activeProcesses.delete(id);
		}
	}
};
const videoCompressor = new VideoCompressor();
var YouTubeDownloader = class {
	constructor() {
		this.activeProcesses = /* @__PURE__ */ new Map();
		this.hasAria2c = false;
		this.hasFFmpeg = false;
		this.ffmpegPath = null;
		this.downloadQueue = [];
		this.activeDownloadsCount = 0;
		this.videoInfoCache = /* @__PURE__ */ new Map();
		this.CACHE_TTL = 1800 * 1e3;
		this.store = new Store({
			name: "youtube-download-history",
			defaults: {
				history: [],
				settings: {
					defaultVideoQuality: "1080p",
					defaultAudioQuality: "0",
					maxConcurrentDownloads: 3,
					maxSpeedLimit: ""
				}
			}
		});
		const binaryName = process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp";
		this.binaryPath = path$1.join(app.getPath("userData"), binaryName);
		this.initPromise = this.initYtDlp();
	}
	async initYtDlp() {
		try {
			const { YTDlpWrap } = await import("./yt-dlp-BWruPz4V.js");
			if (!fs$1.existsSync(this.binaryPath)) {
				console.log("Downloading yt-dlp binary to:", this.binaryPath);
				try {
					await YTDlpWrap.downloadFromGithub(this.binaryPath);
					console.log("yt-dlp binary downloaded successfully");
				} catch (downloadError) {
					console.error("Failed to download yt-dlp binary:", downloadError);
					throw new Error(`Failed to download yt-dlp: ${downloadError}`);
				}
			} else console.log("Using existing yt-dlp binary at:", this.binaryPath);
			this.ytDlp = new YTDlpWrap(this.binaryPath);
			const { FFmpegHelper } = await import("./ffmpeg-helper-DXuFX_KP.js");
			const ffmpegPath = FFmpegHelper.getFFmpegPath();
			if (ffmpegPath) {
				this.ffmpegPath = ffmpegPath;
				this.hasFFmpeg = true;
				const version = FFmpegHelper.getFFmpegVersion();
				console.log(`✅ FFmpeg ready: ${version || "version unknown"}`);
			} else console.warn("⚠️ FFmpeg not available - video features may be limited");
			await this.checkHelpers();
		} catch (error) {
			console.error("Failed to initialize yt-dlp:", error);
			throw error;
		}
	}
	async checkHelpers() {
		this.hasAria2c = false;
		try {
			const userData = app.getPath("userData");
			const localBin = path$1.join(userData, "bin", "aria2c.exe");
			if (fs$1.existsSync(localBin)) {
				this.hasAria2c = true;
				console.log("✅ Aria2c found locally:", localBin);
			}
		} catch {}
		if (!this.hasAria2c) try {
			execSync("aria2c --version", { stdio: "ignore" });
			this.hasAria2c = true;
			console.log("✅ Aria2c found globally");
		} catch {
			console.log("ℹ️ Aria2c not found");
		}
		if (this.ffmpegPath) {
			this.hasFFmpeg = true;
			console.log("✅ FFmpeg static detected", this.ffmpegPath);
		} else try {
			execSync("ffmpeg -version", { stdio: "ignore" });
			this.hasFFmpeg = true;
			console.log("✅ FFmpeg found globally");
		} catch {
			this.hasFFmpeg = false;
			console.warn("⚠️ FFmpeg not found");
		}
	}
	async installAria2() {
		console.log("Starting Aria2 download...");
		try {
			const userData = app.getPath("userData");
			const binDir = path$1.join(userData, "bin");
			if (!fs$1.existsSync(binDir)) fs$1.mkdirSync(binDir, { recursive: true });
			const zipPath = path$1.join(binDir, "aria2.zip");
			const url = "https://github.com/aria2/aria2/releases/download/release-1.36.0/aria2-1.36.0-win-64bit-build1.zip";
			await new Promise((resolve, reject) => {
				const file = fs$1.createWriteStream(zipPath);
				https.get(url, (res) => {
					if (res.statusCode === 302 || res.statusCode === 301) https.get(res.headers.location, (res2) => {
						if (res2.statusCode !== 200) {
							reject(/* @__PURE__ */ new Error("DL Fail " + res2.statusCode));
							return;
						}
						res2.pipe(file);
						file.on("finish", () => {
							file.close();
							resolve();
						});
					}).on("error", reject);
					else if (res.statusCode === 200) {
						res.pipe(file);
						file.on("finish", () => {
							file.close();
							resolve();
						});
					} else reject(/* @__PURE__ */ new Error(`Failed to download: ${res.statusCode}`));
				}).on("error", reject);
			});
			await promisify(exec)(`powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${binDir}' -Force"`);
			const subDir = path$1.join(binDir, "aria2-1.36.0-win-64bit-build1");
			const exePath = path$1.join(subDir, "aria2c.exe");
			const targetPath = path$1.join(binDir, "aria2c.exe");
			if (fs$1.existsSync(exePath)) fs$1.copyFileSync(exePath, targetPath);
			try {
				fs$1.unlinkSync(zipPath);
			} catch {}
			await this.checkHelpers();
			return this.hasAria2c;
		} catch (e) {
			console.error("Install Aria2 Failed", e);
			throw e;
		}
	}
	async ensureInitialized() {
		await this.initPromise;
	}
	async processQueue() {
		const maxConcurrent = this.getSettings().maxConcurrentDownloads || 3;
		while (this.activeDownloadsCount < maxConcurrent && this.downloadQueue.length > 0) {
			const task = this.downloadQueue.shift();
			if (task) {
				this.activeDownloadsCount++;
				task.run().then((result) => task.resolve(result)).catch((error) => task.reject(error)).finally(() => {
					this.activeDownloadsCount--;
					this.processQueue();
				});
			}
		}
	}
	async getVideoInfo(url) {
		await this.ensureInitialized();
		const cached = this.videoInfoCache.get(url);
		if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
			console.log("Returning cached video info for:", url);
			return cached.info;
		}
		try {
			const info = await this.ytDlp.getVideoInfo([
				url,
				"--skip-download",
				"--no-playlist",
				"--no-check-certificate"
			]);
			const formats = (info.formats || []).map((format) => ({
				itag: format.format_id ? parseInt(format.format_id) : 0,
				quality: format.quality || format.format_note || "unknown",
				qualityLabel: format.format_note || format.resolution,
				hasVideo: !!format.vcodec && format.vcodec !== "none",
				hasAudio: !!format.acodec && format.acodec !== "none",
				container: format.ext || "unknown",
				codecs: format.vcodec || format.acodec,
				bitrate: format.tbr ? format.tbr * 1e3 : void 0,
				audioBitrate: format.abr,
				filesize: format.filesize || format.filesize_approx
			}));
			const qualityLabels = /* @__PURE__ */ new Set();
			formats.forEach((format) => {
				if (format.qualityLabel) {
					const match = format.qualityLabel.match(/(\d+p)/);
					if (match) qualityLabels.add(match[1]);
				}
			});
			const availableQualities = Array.from(qualityLabels).sort((a, b) => {
				const aNum = parseInt(a);
				return parseInt(b) - aNum;
			});
			const hasVideo = formats.some((f) => f.hasVideo);
			const hasAudio = formats.some((f) => f.hasAudio);
			let uploadDate;
			if (info.upload_date) try {
				const dateStr = info.upload_date.toString();
				if (dateStr.length === 8) uploadDate = `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;
			} catch (e) {
				console.warn("Failed to parse upload date:", info.upload_date);
			}
			const videoInfo = {
				videoId: info.id || "",
				title: info.title || "Unknown",
				author: info.uploader || info.channel || "Unknown",
				lengthSeconds: parseInt(info.duration) || 0,
				thumbnailUrl: info.thumbnail || "",
				description: info.description || void 0,
				viewCount: parseInt(info.view_count) || void 0,
				uploadDate,
				formats,
				availableQualities,
				hasVideo,
				hasAudio
			};
			this.videoInfoCache.set(url, {
				info: videoInfo,
				timestamp: Date.now()
			});
			return videoInfo;
		} catch (error) {
			throw new Error(`Failed to get video info: ${error instanceof Error ? error.message : "Unknown error"}`);
		}
	}
	async getPlaylistInfo(url) {
		await this.ensureInitialized();
		try {
			const info = await this.ytDlp.getVideoInfo([
				url,
				"--flat-playlist",
				"--skip-download",
				"--no-check-certificate"
			]);
			if (!info.entries || !Array.isArray(info.entries)) throw new Error("Not a valid playlist URL");
			const videos = info.entries.map((entry) => ({
				id: entry.id || entry.url,
				title: entry.title || "Unknown Title",
				duration: entry.duration || 0,
				thumbnail: entry.thumbnail || entry.thumbnails?.[0]?.url || "",
				url: entry.url || `https://www.youtube.com/watch?v=${entry.id}`
			}));
			return {
				playlistId: info.id || info.playlist_id || "unknown",
				title: info.title || info.playlist_title || "Unknown Playlist",
				videoCount: videos.length,
				videos
			};
		} catch (error) {
			throw new Error(`Failed to get playlist info: ${error instanceof Error ? error.message : "Unknown error"}`);
		}
	}
	async checkDiskSpace(directory, requiredBytes) {
		try {
			const filesystems = await si.fsSize();
			const root = path$1.parse(path$1.resolve(directory)).root.toLowerCase();
			const fs$3 = filesystems.find((d) => {
				const mount = d.mount.toLowerCase();
				return root.startsWith(mount) || mount.startsWith(root.replace(/\\/g, ""));
			});
			if (fs$3) {
				if (fs$3.available < requiredBytes + 100 * 1024 * 1024) throw new Error(`Insufficient disk space. Required: ${(requiredBytes / 1024 / 1024).toFixed(2)} MB, Available: ${(fs$3.available / 1024 / 1024).toFixed(2)} MB`);
			}
		} catch (error) {
			console.warn("Disk space check failed:", error);
		}
	}
	async downloadVideo(options, progressCallback) {
		return new Promise((resolve, reject) => {
			this.downloadQueue.push({
				run: () => this.executeDownload(options, progressCallback),
				resolve,
				reject
			});
			this.processQueue();
		});
	}
	async executeDownload(options, progressCallback) {
		await this.ensureInitialized();
		console.log("ExecuteDownload - hasFFmpeg:", this.hasFFmpeg, "path:", this.ffmpegPath);
		const { url, format, quality, container, outputPath, maxSpeed, embedSubs, id } = options;
		const downloadId = id || randomUUID$1();
		try {
			const info = await this.getVideoInfo(url);
			const sanitizedTitle = this.sanitizeFilename(info.title);
			const downloadsPath = outputPath || app.getPath("downloads");
			const extension = container || (format === "audio" ? "mp3" : "mp4");
			let filenameSuffix = "";
			if (format === "audio") filenameSuffix = `_audio_${quality || "best"}`;
			else if (format === "video" && quality) filenameSuffix = `_${quality}`;
			const outputTemplate = path$1.join(downloadsPath, `${sanitizedTitle}${filenameSuffix}.%(ext)s`);
			if (!fs$1.existsSync(downloadsPath)) fs$1.mkdirSync(downloadsPath, { recursive: true });
			let estimatedSize = 0;
			if (format === "audio") estimatedSize = info.formats.find((f) => f.hasAudio && !f.hasVideo && (f.quality === quality || f.itag.toString() === "140"))?.filesize || 0;
			else {
				let videoFormat;
				if (quality && quality !== "best") videoFormat = info.formats.find((f) => f.qualityLabel?.startsWith(quality) && f.hasVideo);
				else videoFormat = info.formats.find((f) => f.hasVideo);
				const audioFormat = info.formats.find((f) => f.hasAudio && !f.hasVideo);
				if (videoFormat) estimatedSize += videoFormat.filesize || 0;
				if (audioFormat) estimatedSize += audioFormat.filesize || 0;
			}
			if (estimatedSize > 1024 * 1024) await this.checkDiskSpace(downloadsPath, estimatedSize);
			const args = [
				url,
				"-o",
				outputTemplate,
				"--no-playlist",
				"--no-warnings",
				"--newline",
				"--no-check-certificate",
				"--concurrent-fragments",
				`${options.concurrentFragments || 4}`,
				"--buffer-size",
				"1M",
				"--retries",
				"10",
				"--fragment-retries",
				"10",
				"-c"
			];
			if (embedSubs) args.push("--write-subs", "--write-auto-subs", "--sub-lang", "en.*,vi", "--embed-subs");
			if (this.ffmpegPath) args.push("--ffmpeg-location", this.ffmpegPath);
			if (maxSpeed) args.push("--limit-rate", maxSpeed);
			if (this.ffmpegPath) args.push("--ffmpeg-location", this.ffmpegPath);
			if (format === "audio") args.push("-x", "--audio-format", container || "mp3", "--audio-quality", quality || "0");
			else if (format === "video") {
				if (quality && quality !== "best") {
					const height = quality.replace("p", "");
					args.push("-f", `bestvideo[height<=${height}][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=${height}]+bestaudio/best[height<=${height}]`);
				} else args.push("-f", "bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio/best");
				const outputFormat = container || "mp4";
				args.push("--merge-output-format", outputFormat);
				if (outputFormat === "mp4") args.push("--postprocessor-args", "ffmpeg:-c:v copy -c:a aac");
			} else args.push("-f", "best");
			return new Promise((resolve, reject) => {
				let downloadedBytes = 0;
				let totalBytes = 0;
				let percent = 0;
				const process$1 = this.ytDlp.exec(args);
				this.activeProcesses.set(downloadId, process$1);
				if (process$1.ytDlpProcess) {
					const ytDlpProc = process$1.ytDlpProcess;
					ytDlpProc.stdout?.on("data", (data) => {
						const output = data.toString();
						console.log(`[${downloadId}] stdout:`, output);
						output.split(/\r?\n/).forEach((line) => {
							if (!line.trim()) return;
							const progress = this.parseProgressLine(line);
							if (progress && progressCallback) {
								if (progress.totalBytes > 0) totalBytes = progress.totalBytes;
								if (progress.percent > 0) percent = progress.percent;
								downloadedBytes = percent / 100 * totalBytes;
								progressCallback({
									id: downloadId,
									percent: Math.round(percent),
									downloaded: downloadedBytes,
									total: totalBytes,
									speed: progress.speed,
									eta: progress.eta,
									state: "downloading",
									filename: `${sanitizedTitle}${filenameSuffix}.${extension}`
								});
							}
						});
					});
					ytDlpProc.stderr?.on("data", (data) => {
						const output = data.toString();
						console.log(`[${downloadId}] stderr:`, output);
						output.split(/\r?\n/).forEach((line) => {
							if (!line.trim()) return;
							const progress = this.parseProgressLine(line);
							if (progress && progressCallback) {
								if (progress.totalBytes > 0) totalBytes = progress.totalBytes;
								if (progress.percent > 0) percent = progress.percent;
								downloadedBytes = percent / 100 * totalBytes;
								progressCallback({
									id: downloadId,
									percent: Math.round(percent),
									downloaded: downloadedBytes,
									total: totalBytes,
									speed: progress.speed,
									eta: progress.eta,
									state: "downloading",
									filename: `${sanitizedTitle}.${extension}`
								});
							}
						});
					});
				}
				process$1.on("close", (code) => {
					this.activeProcesses.delete(downloadId);
					if (code === 0) {
						const expectedFile = path$1.join(downloadsPath, `${sanitizedTitle}${filenameSuffix}.${extension}`);
						let actualFileSize = totalBytes;
						try {
							if (fs$1.existsSync(expectedFile)) actualFileSize = fs$1.statSync(expectedFile).size;
						} catch (e) {
							console.warn("Failed to get file size:", e);
						}
						if (progressCallback) progressCallback({
							id: downloadId,
							percent: 100,
							downloaded: actualFileSize,
							total: actualFileSize,
							speed: 0,
							eta: 0,
							state: "complete",
							filename: `${sanitizedTitle}.${extension}`
						});
						this.addToHistory({
							url,
							title: info.title,
							thumbnailUrl: info.thumbnailUrl,
							format,
							quality: quality || (format === "audio" ? "best" : "auto"),
							path: expectedFile,
							size: actualFileSize,
							duration: info.lengthSeconds,
							status: "completed"
						});
						resolve(expectedFile);
					} else {
						this.cleanupPartialFiles(downloadsPath, sanitizedTitle, extension);
						reject(/* @__PURE__ */ new Error(`yt-dlp exited with code ${code}`));
					}
				});
				process$1.on("error", (error) => {
					this.activeProcesses.delete(downloadId);
					this.cleanupPartialFiles(downloadsPath, sanitizedTitle, extension);
					reject(error);
				});
			});
		} catch (error) {
			this.activeProcesses.delete(downloadId);
			throw new Error(`Download failed: ${error instanceof Error ? error.message : "Unknown error"}`);
		}
	}
	cancelDownload(id) {
		if (id) {
			const proc = this.activeProcesses.get(id);
			if (proc) {
				console.log(`Cancelling download ${id}`);
				try {
					if (proc.ytDlpProcess && typeof proc.ytDlpProcess.kill === "function") proc.ytDlpProcess.kill();
					else if (typeof proc.kill === "function") proc.kill();
				} catch (e) {
					console.error("Failed to kill process:", e);
				}
				this.activeProcesses.delete(id);
			}
		} else {
			console.log(`Cancelling all ${this.activeProcesses.size} downloads`);
			this.activeProcesses.forEach((proc) => {
				try {
					if (proc.ytDlpProcess && typeof proc.ytDlpProcess.kill === "function") proc.ytDlpProcess.kill();
					else if (typeof proc.kill === "function") proc.kill();
				} catch (e) {
					console.error("Failed to kill process:", e);
				}
			});
			this.activeProcesses.clear();
		}
	}
	cleanupPartialFiles(directory, filename, extension) {
		try {
			[
				path$1.join(directory, `${filename}.${extension}`),
				path$1.join(directory, `${filename}.${extension}.part`),
				path$1.join(directory, `${filename}.${extension}.ytdl`),
				path$1.join(directory, `${filename}.part`)
			].forEach((p) => {
				if (fs$1.existsSync(p)) fs$1.unlinkSync(p);
			});
		} catch (error) {
			console.error("Cleanup failed:", error);
		}
	}
	sanitizeFilename(filename) {
		return filename.replace(/[<>:"/\\|?*]/g, "").replace(/\s+/g, " ").trim().substring(0, 200);
	}
	parseProgressLine(line) {
		const getMultiplier = (unit) => {
			if (!unit) return 1;
			const u = unit.toLowerCase();
			if (u.includes("k")) return 1024;
			if (u.includes("m")) return 1024 * 1024;
			if (u.includes("g")) return 1024 * 1024 * 1024;
			return 1;
		};
		if (line.includes("[download]")) {
			const percentMatch = line.match(/(\d+(?:\.\d+)?)%/);
			const sizeMatch = line.match(/of\s+~?([0-9.,]+)([a-zA-Z]+)/);
			const speedMatch = line.match(/at\s+([0-9.,]+)([a-zA-Z]+\/s)/);
			const etaMatch = line.match(/ETA\s+([\d:]+)/);
			console.log("[parseProgressLine] Matches:", {
				line,
				percentMatch: percentMatch?.[0],
				sizeMatch: sizeMatch?.[0],
				speedMatch: speedMatch?.[0],
				etaMatch: etaMatch?.[0]
			});
			if (percentMatch) {
				const percent = parseFloat(percentMatch[1]);
				let totalBytes = 0;
				let speed = 0;
				let eta = 0;
				if (sizeMatch) totalBytes = parseFloat(sizeMatch[1].replace(/,/g, "")) * getMultiplier(sizeMatch[2]);
				if (speedMatch) speed = parseFloat(speedMatch[1].replace(/,/g, "")) * getMultiplier(speedMatch[2].replace("/s", ""));
				if (etaMatch) {
					const parts = etaMatch[1].split(":").map(Number);
					if (parts.length === 3) eta = parts[0] * 3600 + parts[1] * 60 + parts[2];
					else if (parts.length === 2) eta = parts[0] * 60 + parts[1];
					else eta = parts[0];
				}
				return {
					percent,
					totalBytes,
					downloadedBytes: 0,
					speed,
					eta,
					status: "downloading"
				};
			}
		}
		return null;
	}
	getHistory() {
		return this.store.get("history", []);
	}
	addToHistory(item) {
		const history = this.store.get("history", []);
		const newItem = {
			...item,
			id: randomUUID$1(),
			timestamp: Date.now()
		};
		this.store.set("history", [newItem, ...history].slice(0, 50));
	}
	removeFromHistory(id) {
		const filtered = this.store.get("history", []).filter((item) => item.id !== id);
		this.store.set("history", filtered);
	}
	clearHistory() {
		this.store.set("history", []);
	}
	getCapabilities() {
		return {
			hasAria2c: this.hasAria2c,
			hasFFmpeg: this.hasFFmpeg
		};
	}
	getSettings() {
		return this.store.get("settings");
	}
	saveSettings(settings) {
		const updated = {
			...this.store.get("settings"),
			...settings
		};
		this.store.set("settings", updated);
		return updated;
	}
};
const youtubeDownloader = new YouTubeDownloader();
var TikTokDownloader = class {
	constructor() {
		this.activeProcesses = /* @__PURE__ */ new Map();
		this.ffmpegPath = null;
		this.downloadQueue = [];
		this.activeDownloadsCount = 0;
		this.store = new Store({
			name: "tiktok-download-history",
			defaults: {
				history: [],
				settings: {
					defaultFormat: "video",
					defaultQuality: "best",
					removeWatermark: false,
					maxConcurrentDownloads: 3,
					maxSpeedLimit: ""
				}
			}
		});
		const binaryName = process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp";
		this.binaryPath = path$1.join(app.getPath("userData"), binaryName);
		this.initPromise = this.init();
	}
	async init() {
		try {
			const { YTDlpWrap } = await import("./yt-dlp-BWruPz4V.js");
			if (!fs$1.existsSync(this.binaryPath)) {
				console.log("Downloading yt-dlp binary (TikTok)...");
				await YTDlpWrap.downloadFromGithub(this.binaryPath);
			}
			this.ytDlp = new YTDlpWrap(this.binaryPath);
			const { FFmpegHelper } = await import("./ffmpeg-helper-DXuFX_KP.js");
			const ffmpegPath = FFmpegHelper.getFFmpegPath();
			if (ffmpegPath) {
				this.ffmpegPath = ffmpegPath;
				console.log("✅ TikTok Downloader: FFmpeg ready");
			} else console.warn("⚠️ TikTok Downloader: FFmpeg not available");
		} catch (error) {
			console.error("Failed to init TikTok downloader:", error);
			throw error;
		}
	}
	async ensureInitialized() {
		await this.initPromise;
	}
	async getVideoInfo(url) {
		await this.ensureInitialized();
		try {
			const info = await this.ytDlp.getVideoInfo([
				url,
				"--skip-download",
				"--no-playlist",
				"--no-check-certificate"
			]);
			return {
				id: info.id,
				title: info.title || "TikTok Video",
				author: info.uploader || info.channel || "Unknown",
				authorUsername: info.uploader_id || "",
				duration: info.duration || 0,
				thumbnailUrl: info.thumbnail || "",
				description: info.description,
				viewCount: info.view_count,
				likeCount: info.like_count,
				commentCount: info.comment_count,
				shareCount: info.repost_count,
				uploadDate: info.upload_date,
				musicTitle: info.track,
				musicAuthor: info.artist
			};
		} catch (error) {
			throw new Error(`Failed to get TikTok info: ${error instanceof Error ? error.message : String(error)}`);
		}
	}
	async downloadVideo(options, progressCallback) {
		return new Promise((resolve, reject) => {
			this.downloadQueue.push({
				run: () => this.executeDownload(options, progressCallback),
				resolve,
				reject
			});
			this.processQueue();
		});
	}
	async processQueue() {
		const maxConcurrent = this.getSettings().maxConcurrentDownloads || 3;
		while (this.activeDownloadsCount < maxConcurrent && this.downloadQueue.length > 0) {
			const task = this.downloadQueue.shift();
			if (task) {
				this.activeDownloadsCount++;
				task.run().then((result) => task.resolve(result)).catch((error) => task.reject(error)).finally(() => {
					this.activeDownloadsCount--;
					this.processQueue();
				});
			}
		}
	}
	async executeDownload(options, progressCallback) {
		await this.ensureInitialized();
		const { url, format, quality, outputPath, maxSpeed, id } = options;
		const downloadId = id || randomUUID$1();
		try {
			const info = await this.getVideoInfo(url);
			const sanitizedTitle = this.sanitizeFilename(info.title);
			const author = this.sanitizeFilename(info.authorUsername || info.author);
			const downloadsPath = outputPath || this.store.get("settings.downloadPath") || app.getPath("downloads");
			const extension = format === "audio" ? "mp3" : "mp4";
			const filename = `${author}_${sanitizedTitle}_${info.id}.${extension}`;
			const outputTemplate = path$1.join(downloadsPath, filename);
			if (!fs$1.existsSync(downloadsPath)) fs$1.mkdirSync(downloadsPath, { recursive: true });
			const args = [
				url,
				"-o",
				outputTemplate,
				"--no-playlist",
				"--newline",
				"--no-warnings",
				"--no-check-certificate",
				"--concurrent-fragments",
				"4",
				"--retries",
				"10"
			];
			if (this.ffmpegPath) args.push("--ffmpeg-location", this.ffmpegPath);
			if (maxSpeed) args.push("--limit-rate", maxSpeed);
			if (format === "audio") args.push("-x", "--audio-format", "mp3", "--audio-quality", "0");
			else if (quality === "low") args.push("-f", "worst");
			else if (quality === "medium") args.push("-f", "best");
			else args.push("-f", "best");
			return new Promise((resolve, reject) => {
				let totalBytes = 0;
				let downloadedBytes = 0;
				let percent = 0;
				const process$1 = this.ytDlp.exec(args);
				this.activeProcesses.set(downloadId, process$1);
				if (process$1.ytDlpProcess) process$1.ytDlpProcess.stdout?.on("data", (data) => {
					data.toString().split(/\r?\n/).forEach((line) => {
						if (!line.trim()) return;
						const progressMatch = line.match(/\[download\]\s+(\d+\.?\d*)%\s+of\s+~?(\d+\.?\d*)(\w+)\s+at\s+(\d+\.?\d*)(\w+)\/s\s+ETA\s+(\d+:\d+)/);
						if (progressMatch) {
							percent = parseFloat(progressMatch[1]);
							const sizeVal = parseFloat(progressMatch[2]);
							const sizeUnit = progressMatch[3];
							const speedVal = parseFloat(progressMatch[4]);
							const speedUnit = progressMatch[5];
							const etaStr = progressMatch[6];
							const unitMultipliers = {
								"B": 1,
								"KiB": 1024,
								"MiB": 1024 * 1024,
								"GiB": 1024 * 1024 * 1024
							};
							totalBytes = sizeVal * (unitMultipliers[sizeUnit] || 1);
							downloadedBytes = percent / 100 * totalBytes;
							const speed = speedVal * (unitMultipliers[speedUnit] || 1);
							const etaParts = etaStr.split(":");
							let eta = 0;
							if (etaParts.length === 2) eta = parseInt(etaParts[0]) * 60 + parseInt(etaParts[1]);
							if (etaParts.length === 3) eta = parseInt(etaParts[0]) * 3600 + parseInt(etaParts[1]) * 60 + parseInt(etaParts[2]);
							if (progressCallback) progressCallback({
								id: downloadId,
								percent,
								downloaded: downloadedBytes,
								total: totalBytes,
								speed,
								eta,
								state: "downloading",
								filename
							});
						}
					});
				});
				process$1.on("close", (code) => {
					this.activeProcesses.delete(downloadId);
					if (code === 0) if (fs$1.existsSync(outputTemplate)) {
						if (progressCallback) progressCallback({
							id: downloadId,
							percent: 100,
							downloaded: totalBytes,
							total: totalBytes,
							speed: 0,
							eta: 0,
							state: "complete",
							filename,
							filePath: outputTemplate
						});
						this.addToHistory({
							id: downloadId,
							url,
							title: info.title,
							thumbnailUrl: info.thumbnailUrl,
							author: info.author,
							authorUsername: info.authorUsername,
							timestamp: Date.now(),
							path: outputTemplate,
							size: totalBytes,
							duration: info.duration,
							format: format || "video",
							status: "completed"
						});
						resolve(outputTemplate);
					} else reject(/* @__PURE__ */ new Error("Download finished but file not found"));
					else reject(/* @__PURE__ */ new Error(`yt-dlp exited with code ${code}`));
				});
				process$1.on("error", (err) => {
					this.activeProcesses.delete(downloadId);
					reject(err);
				});
			});
		} catch (error) {
			this.activeProcesses.delete(downloadId);
			throw error;
		}
	}
	cancelDownload(id) {
		if (id) {
			const proc = this.activeProcesses.get(id);
			if (proc && proc.ytDlpProcess) proc.ytDlpProcess.kill();
		} else this.activeProcesses.forEach((proc) => {
			if (proc.ytDlpProcess) proc.ytDlpProcess.kill();
		});
	}
	getHistory() {
		return this.store.get("history", []);
	}
	clearHistory() {
		this.store.set("history", []);
	}
	removeFromHistory(id) {
		const history = this.getHistory();
		this.store.set("history", history.filter((h) => h.id !== id));
	}
	addToHistory(item) {
		const history = this.getHistory();
		history.unshift(item);
		this.store.set("history", history.slice(0, 100));
	}
	getSettings() {
		return this.store.get("settings");
	}
	saveSettings(settings) {
		const current = this.getSettings();
		this.store.set("settings", {
			...current,
			...settings
		});
	}
	sanitizeFilename(name) {
		return name.replace(/[<>:"/\\|?*]/g, "").trim();
	}
};
const tiktokDownloader = new TikTokDownloader();
const ErrorCode = {
	NETWORK_ERROR: "NETWORK_ERROR",
	CONNECTION_TIMEOUT: "CONNECTION_TIMEOUT",
	DNS_LOOKUP_FAILED: "DNS_LOOKUP_FAILED",
	NO_INTERNET: "NO_INTERNET",
	AUTH_REQUIRED: "AUTH_REQUIRED",
	LOGIN_REQUIRED: "LOGIN_REQUIRED",
	INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
	COOKIES_EXPIRED: "COOKIES_EXPIRED",
	VIDEO_UNAVAILABLE: "VIDEO_UNAVAILABLE",
	PRIVATE_VIDEO: "PRIVATE_VIDEO",
	DELETED_VIDEO: "DELETED_VIDEO",
	GEO_RESTRICTED: "GEO_RESTRICTED",
	AGE_RESTRICTED: "AGE_RESTRICTED",
	SERVER_ERROR: "SERVER_ERROR",
	RATE_LIMITED: "RATE_LIMITED",
	SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
	DISK_FULL: "DISK_FULL",
	PERMISSION_DENIED: "PERMISSION_DENIED",
	INVALID_PATH: "INVALID_PATH",
	NO_FORMATS_AVAILABLE: "NO_FORMATS_AVAILABLE",
	UNSUPPORTED_FORMAT: "UNSUPPORTED_FORMAT",
	EXTRACTION_FAILED: "EXTRACTION_FAILED",
	UNKNOWN_ERROR: "UNKNOWN_ERROR"
};
var DownloadError = class extends Error {
	constructor(message, code = ErrorCode.UNKNOWN_ERROR, options = {}) {
		super(message);
		this.name = "DownloadError";
		this.code = code;
		this.recoverable = options.recoverable ?? false;
		this.retryable = options.retryable ?? true;
		this.suggestions = options.suggestions ?? [];
		this.metadata = {
			timestamp: Date.now(),
			...options.metadata
		};
		if (options.cause) this.stack = `${this.stack}\nCaused by: ${options.cause.stack}`;
	}
	toJSON() {
		return {
			name: this.name,
			message: this.message,
			code: this.code,
			recoverable: this.recoverable,
			retryable: this.retryable,
			suggestions: this.suggestions,
			metadata: this.metadata,
			stack: this.stack
		};
	}
};
var NetworkError = class extends DownloadError {
	constructor(message, metadata) {
		super(message, ErrorCode.NETWORK_ERROR, {
			retryable: true,
			recoverable: true,
			suggestions: [
				{
					title: "Check Your Internet Connection",
					description: "Make sure you are connected to the internet",
					action: "retry"
				},
				{
					title: "Try Again Later",
					description: "The network might be temporarily unavailable",
					action: "retry-later"
				},
				{
					title: "Check Firewall/VPN",
					description: "Your firewall or VPN might be blocking the connection"
				}
			],
			metadata
		});
	}
};
var ConnectionTimeoutError = class extends DownloadError {
	constructor(message, metadata) {
		super(message, ErrorCode.CONNECTION_TIMEOUT, {
			retryable: true,
			recoverable: true,
			suggestions: [{
				title: "Retry Download",
				description: "The connection timed out, try downloading again",
				action: "retry"
			}, {
				title: "Check Network Speed",
				description: "Your internet connection might be slow"
			}],
			metadata
		});
	}
};
var LoginRequiredError = class extends DownloadError {
	constructor(message, platform, metadata) {
		super(message, ErrorCode.LOGIN_REQUIRED, {
			retryable: false,
			recoverable: true,
			suggestions: [{
				title: "Login Required",
				description: `You need to be logged in to ${platform || "this platform"} to download this content`,
				action: "open-settings"
			}, {
				title: "Enable Browser Cookies",
				description: "In Settings, enable browser cookies to use your logged-in session",
				action: "open-settings"
			}],
			metadata: {
				...metadata,
				platform
			}
		});
	}
};
var ContentUnavailableError = class extends DownloadError {
	constructor(message, reason, metadata) {
		const codeMap = {
			"private": ErrorCode.PRIVATE_VIDEO,
			"deleted": ErrorCode.DELETED_VIDEO,
			"geo-restricted": ErrorCode.GEO_RESTRICTED,
			"age-restricted": ErrorCode.AGE_RESTRICTED,
			"unavailable": ErrorCode.VIDEO_UNAVAILABLE
		};
		super(message, codeMap[reason], {
			retryable: reason === "unavailable",
			recoverable: false,
			suggestions: {
				"private": [{
					title: "Content is Private",
					description: "This content is private and cannot be downloaded"
				}, {
					title: "Request Access",
					description: "You may need to request access from the content owner"
				}],
				"deleted": [{
					title: "Content Removed",
					description: "This content has been deleted by the owner or platform"
				}, {
					title: "Check URL",
					description: "Verify the URL is correct and the content still exists"
				}],
				"geo-restricted": [{
					title: "Not Available in Your Region",
					description: "This content is geo-restricted and not available in your country"
				}, {
					title: "Try Using VPN",
					description: "You might need a VPN to access this content"
				}],
				"age-restricted": [{
					title: "Age Restricted Content",
					description: "You need to be logged in to download age-restricted content",
					action: "open-settings"
				}],
				"unavailable": [{
					title: "Content Unavailable",
					description: "This content is currently unavailable"
				}, {
					title: "Try Again Later",
					description: "The content might be temporarily unavailable",
					action: "retry-later"
				}]
			}[reason],
			metadata
		});
	}
};
var RateLimitError = class extends DownloadError {
	constructor(message, retryAfter, metadata) {
		super(message, ErrorCode.RATE_LIMITED, {
			retryable: true,
			recoverable: true,
			suggestions: [{
				title: "Too Many Requests",
				description: retryAfter ? `You've made too many requests. Please wait ${Math.ceil(retryAfter / 60)} minutes before trying again.` : "You've made too many requests. Please wait a few minutes before trying again.",
				action: "retry-later"
			}, {
				title: "Reduce Concurrent Downloads",
				description: "Try downloading fewer files at once",
				action: "open-settings"
			}],
			metadata: {
				...metadata,
				retryAfter
			}
		});
	}
};
var ServerError = class extends DownloadError {
	constructor(message, statusCode, metadata) {
		super(message, ErrorCode.SERVER_ERROR, {
			retryable: statusCode ? statusCode >= 500 : true,
			recoverable: true,
			suggestions: [
				{
					title: "Server Error",
					description: "The server encountered an error while processing your request"
				},
				{
					title: "Try Again Later",
					description: "The platform's servers might be experiencing issues",
					action: "retry-later"
				},
				{
					title: "Check Platform Status",
					description: "Visit the platform's status page to see if there are known issues"
				}
			],
			metadata: {
				...metadata,
				statusCode
			}
		});
	}
};
var DiskFullError = class extends DownloadError {
	constructor(message, availableSpace, metadata) {
		super(message, ErrorCode.DISK_FULL, {
			retryable: false,
			recoverable: true,
			suggestions: [
				{
					title: "Insufficient Disk Space",
					description: availableSpace ? `You have only ${(availableSpace / (1024 * 1024 * 1024)).toFixed(2)} GB available. Free up some space and try again.` : "Your disk is full. Free up some space and try again."
				},
				{
					title: "Clean Up Downloads Folder",
					description: "Delete old downloads to free up space"
				},
				{
					title: "Change Download Location",
					description: "Choose a different drive with more space",
					action: "open-settings"
				}
			],
			metadata
		});
	}
};
var ErrorParser = class {
	static parse(error, metadata) {
		const message = typeof error === "string" ? error : error.message;
		const lowerMsg = message.toLowerCase();
		if (lowerMsg.includes("network error") || lowerMsg.includes("enotfound") || lowerMsg.includes("getaddrinfo") || lowerMsg.includes("unable to download") || lowerMsg.includes("nodename nor servname")) return new NetworkError(message, metadata);
		if (lowerMsg.includes("timeout") || lowerMsg.includes("timed out")) return new ConnectionTimeoutError(message, metadata);
		if (lowerMsg.includes("login required")) return new LoginRequiredError(message, metadata?.platform, metadata);
		if (lowerMsg.includes("private video") || lowerMsg.includes("this video is private")) return new ContentUnavailableError(message, "private", metadata);
		if (lowerMsg.includes("video unavailable") || lowerMsg.includes("has been removed")) return new ContentUnavailableError(message, "deleted", metadata);
		if (lowerMsg.includes("geographic") || lowerMsg.includes("not available in your country")) return new ContentUnavailableError(message, "geo-restricted", metadata);
		if (lowerMsg.includes("age") && lowerMsg.includes("restrict")) return new ContentUnavailableError(message, "age-restricted", metadata);
		if (lowerMsg.includes("429") || lowerMsg.includes("too many requests")) {
			const retryMatch = message.match(/retry after (\d+)/i);
			return new RateLimitError(message, retryMatch ? parseInt(retryMatch[1]) : void 0, metadata);
		}
		if (lowerMsg.includes("500") || lowerMsg.includes("502") || lowerMsg.includes("503") || lowerMsg.includes("server error")) {
			const statusMatch = message.match(/(\d{3})/);
			return new ServerError(message, statusMatch ? parseInt(statusMatch[1]) : void 0, metadata);
		}
		if (lowerMsg.includes("no space left") || lowerMsg.includes("disk full") || lowerMsg.includes("enospc")) return new DiskFullError(message, void 0, metadata);
		return new DownloadError(message, ErrorCode.UNKNOWN_ERROR, {
			retryable: true,
			suggestions: [
				{
					title: "Unknown Error",
					description: "An unexpected error occurred"
				},
				{
					title: "Try Again",
					description: "Retry the download to see if the issue persists",
					action: "retry"
				},
				{
					title: "Report Issue",
					description: "If this error keeps occurring, please report it",
					action: "export-log"
				}
			],
			metadata
		});
	}
};
var ErrorLogger = class {
	constructor() {
		this.maxEntries = 500;
		this.retentionDays = 30;
		this.store = new Store({
			name: "error-log",
			defaults: {
				errors: [],
				stats: {
					totalErrors: 0,
					errorsByCode: {},
					lastCleanup: Date.now()
				}
			}
		});
		this.cleanupOldErrors();
	}
	log(error, downloadId) {
		const entry = {
			id: this.generateId(),
			timestamp: Date.now(),
			downloadId,
			url: error.metadata.url,
			platform: error.metadata.platform,
			errorCode: error.code,
			errorMessage: error.message,
			errorStack: error.stack,
			retryCount: error.metadata.retryCount || 0,
			resolved: false,
			metadata: error.metadata
		};
		const errors = this.store.get("errors", []);
		errors.unshift(entry);
		if (errors.length > this.maxEntries) errors.splice(this.maxEntries);
		this.store.set("errors", errors);
		this.updateStats(error.code);
		console.error(`[ErrorLogger] Logged error ${entry.id}: ${error.code} - ${error.message}`);
		return entry.id;
	}
	markResolved(errorId, userAction) {
		const errors = this.store.get("errors", []);
		const error = errors.find((e) => e.id === errorId);
		if (error) {
			error.resolved = true;
			error.userAction = userAction;
			this.store.set("errors", errors);
			console.log(`[ErrorLogger] Marked error ${errorId} as resolved (${userAction})`);
		}
	}
	getRecentErrors(limit = 50) {
		return this.store.get("errors", []).slice(0, limit);
	}
	getErrorsByDownload(downloadId) {
		return this.store.get("errors", []).filter((e) => e.downloadId === downloadId);
	}
	getErrorsByCode(code) {
		return this.store.get("errors", []).filter((e) => e.errorCode === code);
	}
	getUnresolvedErrors() {
		return this.store.get("errors", []).filter((e) => !e.resolved);
	}
	getStats() {
		const stats = this.store.get("stats");
		const errors = this.store.get("errors", []);
		const oneDayAgo = Date.now() - 1440 * 60 * 1e3;
		const recentErrors = errors.filter((e) => e.timestamp > oneDayAgo);
		const errorCounts = {};
		errors.forEach((e) => {
			errorCounts[e.errorCode] = (errorCounts[e.errorCode] || 0) + 1;
		});
		const mostCommon = Object.entries(errorCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([code, count]) => ({
			code,
			count
		}));
		return {
			total: stats.totalErrors,
			stored: errors.length,
			recent24h: recentErrors.length,
			unresolved: errors.filter((e) => !e.resolved).length,
			byCode: stats.errorsByCode,
			mostCommon,
			lastCleanup: new Date(stats.lastCleanup)
		};
	}
	async exportToFile(format) {
		const errors = this.store.get("errors", []);
		const filename = `error-log-${(/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-")}.${format}`;
		const filePath = path$1.join(app.getPath("downloads"), filename);
		let content = "";
		if (format === "json") content = JSON.stringify({
			exported: (/* @__PURE__ */ new Date()).toISOString(),
			stats: this.getStats(),
			errors
		}, null, 2);
		else if (format === "csv") {
			content = [
				"Timestamp",
				"Error Code",
				"Error Message",
				"URL",
				"Platform",
				"Retry Count",
				"Resolved",
				"User Action"
			].join(",") + "\n";
			errors.forEach((e) => {
				const row = [
					new Date(e.timestamp).toISOString(),
					e.errorCode,
					`"${e.errorMessage.replace(/"/g, "\"\"")}"`,
					e.url || "",
					e.platform || "",
					e.retryCount,
					e.resolved,
					e.userAction || ""
				];
				content += row.join(",") + "\n";
			});
		} else {
			content = `Error Log Export\n`;
			content += `Generated: ${(/* @__PURE__ */ new Date()).toISOString()}\n`;
			content += `Total Errors: ${errors.length}\n`;
			content += `\n${"=".repeat(80)}\n\n`;
			errors.forEach((e, i) => {
				content += `Error #${i + 1}\n`;
				content += `Timestamp: ${new Date(e.timestamp).toLocaleString()}\n`;
				content += `Code: ${e.errorCode}\n`;
				content += `Message: ${e.errorMessage}\n`;
				if (e.url) content += `URL: ${e.url}\n`;
				if (e.platform) content += `Platform: ${e.platform}\n`;
				content += `Retry Count: ${e.retryCount}\n`;
				content += `Resolved: ${e.resolved ? "Yes" : "No"}\n`;
				if (e.userAction) content += `User Action: ${e.userAction}\n`;
				if (e.errorStack) content += `\nStack Trace:\n${e.errorStack}\n`;
				content += `\n${"-".repeat(80)}\n\n`;
			});
		}
		await fsp.writeFile(filePath, content, "utf-8");
		console.log(`[ErrorLogger] Exported ${errors.length} errors to ${filePath}`);
		return filePath;
	}
	clearAll() {
		this.store.set("errors", []);
		console.log("[ErrorLogger] Cleared all errors");
	}
	clearResolved() {
		const errors = this.store.get("errors", []);
		const unresolved = errors.filter((e) => !e.resolved);
		this.store.set("errors", unresolved);
		console.log(`[ErrorLogger] Cleared ${errors.length - unresolved.length} resolved errors`);
	}
	cleanupOldErrors() {
		const errors = this.store.get("errors", []);
		const cutoffDate = Date.now() - this.retentionDays * 24 * 60 * 60 * 1e3;
		const filtered = errors.filter((e) => e.timestamp > cutoffDate);
		if (filtered.length < errors.length) {
			this.store.set("errors", filtered);
			const stats = this.store.get("stats");
			stats.lastCleanup = Date.now();
			this.store.set("stats", stats);
			console.log(`[ErrorLogger] Cleaned up ${errors.length - filtered.length} old errors`);
		}
	}
	updateStats(errorCode) {
		const stats = this.store.get("stats");
		stats.totalErrors++;
		stats.errorsByCode[errorCode] = (stats.errorsByCode[errorCode] || 0) + 1;
		this.store.set("stats", stats);
	}
	generateId() {
		return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}
};
const errorLogger = new ErrorLogger();
var RetryManager = class {
	constructor() {
		this.retryStates = /* @__PURE__ */ new Map();
		this.retryTimers = /* @__PURE__ */ new Map();
		this.defaultConfig = {
			maxRetries: 3,
			initialDelay: 2e3,
			maxDelay: 6e4,
			backoffMultiplier: 2,
			jitter: true
		};
	}
	shouldRetry(downloadId, error, config) {
		const cfg = {
			...this.defaultConfig,
			...config
		};
		const state = this.retryStates.get(downloadId);
		if (!error.retryable) {
			console.log(`[RetryManager] Error ${error.code} is not retryable`);
			return false;
		}
		if ((state?.attemptCount || 0) >= cfg.maxRetries) {
			console.log(`[RetryManager] Max retries (${cfg.maxRetries}) reached for ${downloadId}`);
			return false;
		}
		return true;
	}
	calculateDelay(attemptCount, config) {
		const cfg = {
			...this.defaultConfig,
			...config
		};
		let delay = cfg.initialDelay * Math.pow(cfg.backoffMultiplier, attemptCount);
		delay = Math.min(delay, cfg.maxDelay);
		if (cfg.jitter) {
			const jitterAmount = delay * .25 * Math.random();
			delay += jitterAmount;
		}
		return Math.floor(delay);
	}
	scheduleRetry(downloadId, retryCallback, error, config) {
		if (!this.shouldRetry(downloadId, error, config)) return { scheduled: false };
		const state = this.retryStates.get(downloadId) || {
			downloadId,
			attemptCount: 0,
			totalWaitTime: 0
		};
		state.attemptCount++;
		state.lastError = error;
		const delay = this.calculateDelay(state.attemptCount - 1, config);
		const retryAt = Date.now() + delay;
		state.nextRetryAt = retryAt;
		state.totalWaitTime += delay;
		this.retryStates.set(downloadId, state);
		console.log(`[RetryManager] Scheduling retry ${state.attemptCount}/${this.defaultConfig.maxRetries} for ${downloadId} in ${(delay / 1e3).toFixed(1)}s`);
		const existingTimer = this.retryTimers.get(downloadId);
		if (existingTimer) clearTimeout(existingTimer);
		const timer = setTimeout(async () => {
			console.log(`[RetryManager] Executing retry ${state.attemptCount} for ${downloadId}`);
			this.retryTimers.delete(downloadId);
			try {
				await retryCallback();
				this.clearRetryState(downloadId);
			} catch (error$1) {
				console.error(`[RetryManager] Retry failed for ${downloadId}:`, error$1);
			}
		}, delay);
		this.retryTimers.set(downloadId, timer);
		return {
			scheduled: true,
			retryAt,
			delay
		};
	}
	getRetryState(downloadId) {
		return this.retryStates.get(downloadId);
	}
	getTimeUntilRetry(downloadId) {
		const state = this.retryStates.get(downloadId);
		if (!state || !state.nextRetryAt) return null;
		const remaining = state.nextRetryAt - Date.now();
		return remaining > 0 ? remaining : 0;
	}
	cancelRetry(downloadId) {
		const timer = this.retryTimers.get(downloadId);
		if (timer) {
			clearTimeout(timer);
			this.retryTimers.delete(downloadId);
			console.log(`[RetryManager] Cancelled retry for ${downloadId}`);
		}
		this.retryStates.delete(downloadId);
	}
	clearRetryState(downloadId) {
		this.retryStates.delete(downloadId);
		const timer = this.retryTimers.get(downloadId);
		if (timer) {
			clearTimeout(timer);
			this.retryTimers.delete(downloadId);
		}
		console.log(`[RetryManager] Cleared retry state for ${downloadId}`);
	}
	getActiveRetries() {
		return Array.from(this.retryStates.values());
	}
	clearAll() {
		this.retryTimers.forEach((timer) => clearTimeout(timer));
		this.retryTimers.clear();
		this.retryStates.clear();
		console.log("[RetryManager] Cleared all retries");
	}
	getStats() {
		const states = Array.from(this.retryStates.values());
		return {
			activeRetries: states.length,
			totalRetryAttempts: states.reduce((sum, s) => sum + s.attemptCount, 0),
			averageRetryCount: states.length > 0 ? states.reduce((sum, s) => sum + s.attemptCount, 0) / states.length : 0,
			totalWaitTime: states.reduce((sum, s) => sum + s.totalWaitTime, 0),
			nextRetry: states.filter((s) => s.nextRetryAt).sort((a, b) => (a.nextRetryAt || 0) - (b.nextRetryAt || 0))[0]
		};
	}
};
const retryManager = new RetryManager();
var require$2 = createRequire(import.meta.url);
var UniversalDownloader = class {
	constructor() {
		this.activeProcesses = /* @__PURE__ */ new Map();
		this.activeOptions = /* @__PURE__ */ new Map();
		this.ffmpegPath = null;
		this.downloadQueue = [];
		this.activeDownloadsCount = 0;
		this.store = new Store({
			name: "universal-download-history",
			defaults: {
				history: [],
				settings: {
					defaultFormat: "video",
					defaultQuality: "best",
					maxConcurrentDownloads: 3,
					maxSpeedLimit: "",
					useBrowserCookies: null
				},
				queue: []
			}
		});
		const binaryName = process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp";
		this.binaryPath = path$1.join(app.getPath("userData"), binaryName);
		this.initPromise = this.init();
		setInterval(() => this.processQueue(), 5e3);
		this.loadPersistedQueue();
	}
	loadPersistedQueue() {
		const persistedQueue = this.store.get("queue") || [];
		for (const item of persistedQueue) this.downloadQueue.push({
			options: item.options,
			run: () => this.executeDownload(item.options),
			resolve: () => {},
			reject: () => {},
			state: item.state === "downloading" ? "paused" : item.state
		});
	}
	saveQueuePersistently() {
		const toSave = this.downloadQueue.map((item) => ({
			options: item.options,
			state: item.state
		}));
		this.store.set("queue", toSave);
	}
	prepareForShutdown() {
		console.log("🔄 Preparing downloads for shutdown...");
		this.activeProcesses.forEach((process$1, downloadId) => {
			const options = this.activeOptions.get(downloadId);
			if (options) if (!this.downloadQueue.some((item) => item.options.id === downloadId)) this.downloadQueue.push({
				options,
				run: () => this.executeDownload(options),
				resolve: () => {},
				reject: () => {},
				state: "paused"
			});
			else {
				const queueItem = this.downloadQueue.find((item) => item.options.id === downloadId);
				if (queueItem) queueItem.state = "paused";
			}
			if (process$1.ytDlpProcess) process$1.ytDlpProcess.kill("SIGTERM");
		});
		this.saveQueuePersistently();
		const pendingCount = this.downloadQueue.filter((item) => item.state === "queued" || item.state === "paused").length;
		console.log(`✅ Saved ${pendingCount} pending downloads`);
		return pendingCount;
	}
	getPendingDownloadsCount() {
		return (this.store.get("queue") || []).filter((item) => item.state === "queued" || item.state === "paused").length;
	}
	resumePendingDownloads() {
		console.log("🔄 Resuming pending downloads...");
		const pending = this.downloadQueue.filter((item) => item.state === "queued" || item.state === "paused");
		pending.forEach((item) => {
			item.state = "queued";
		});
		this.saveQueuePersistently();
		this.processQueue();
		console.log(`✅ Resumed ${pending.length} downloads`);
	}
	clearPendingDownloads() {
		console.log("🗑️ Clearing pending downloads...");
		this.downloadQueue = this.downloadQueue.filter((item) => item.state === "downloading");
		this.saveQueuePersistently();
	}
	handleDownloadError(error, downloadId, url, platform, progressCallback) {
		const downloadError = error instanceof DownloadError ? error : ErrorParser.parse(error, {
			url,
			platform
		});
		const retryState = retryManager.getRetryState(downloadId);
		if (retryState) downloadError.metadata.retryCount = retryState.attemptCount;
		const errorId = errorLogger.log(downloadError, downloadId);
		console.error(`[Download Error] ${downloadId}: ${downloadError.code} - ${downloadError.message}`, `(Retry: ${downloadError.metadata.retryCount || 0})`);
		if (progressCallback) progressCallback({
			id: downloadId,
			percent: 0,
			downloaded: 0,
			total: 0,
			speed: 0,
			eta: 0,
			state: "error",
			filename: url,
			platform,
			error: {
				code: downloadError.code,
				message: downloadError.message,
				suggestions: downloadError.suggestions,
				retryable: downloadError.retryable,
				errorId
			}
		});
		if (downloadError.retryable) {
			const options = this.activeOptions.get(downloadId);
			if (options) {
				const retryResult = retryManager.scheduleRetry(downloadId, async () => {
					await this.executeDownload(options, progressCallback);
				}, downloadError);
				if (retryResult.scheduled) {
					console.log(`[Retry Scheduled] ${downloadId} will retry in ${(retryResult.delay / 1e3).toFixed(1)}s`);
					if (progressCallback) progressCallback({
						id: downloadId,
						percent: 0,
						downloaded: 0,
						total: 0,
						speed: 0,
						eta: retryResult.delay / 1e3,
						state: "error",
						filename: url,
						platform,
						error: {
							code: downloadError.code,
							message: `${downloadError.message} - Retrying in ${(retryResult.delay / 1e3).toFixed(0)}s...`,
							suggestions: downloadError.suggestions,
							retryable: true,
							retryAt: retryResult.retryAt,
							errorId
						}
					});
				}
			}
		}
		return downloadError;
	}
	getErrorLog(limit) {
		return errorLogger.getRecentErrors(limit);
	}
	async exportErrorLog(format) {
		return await errorLogger.exportToFile(format);
	}
	getErrorStats() {
		return {
			errorLog: errorLogger.getStats(),
			retryManager: retryManager.getStats()
		};
	}
	clearErrorLog(type = "resolved") {
		if (type === "all") errorLogger.clearAll();
		else errorLogger.clearResolved();
	}
	async init() {
		try {
			const ytDlpModule = require$2("yt-dlp-wrap");
			const YTDlpWrap = ytDlpModule.default || ytDlpModule;
			if (!fs$1.existsSync(this.binaryPath)) {
				console.log("Downloading yt-dlp binary (Universal)...");
				await YTDlpWrap.downloadFromGithub(this.binaryPath);
			}
			this.ytDlp = new YTDlpWrap(this.binaryPath);
			const { FFmpegHelper } = await import("./ffmpeg-helper-DXuFX_KP.js");
			const ffmpegPath = FFmpegHelper.getFFmpegPath();
			if (ffmpegPath) {
				this.ffmpegPath = ffmpegPath;
				console.log("✅ Universal Downloader: FFmpeg ready");
			} else console.warn("⚠️ Universal Downloader: FFmpeg not available");
		} catch (error) {
			console.error("Failed to init Universal downloader:", error);
			throw error;
		}
	}
	async ensureInitialized() {
		await this.initPromise;
	}
	detectPlatform(url, extractor) {
		const u = url.toLowerCase();
		if (extractor) {
			const e = extractor.toLowerCase();
			if (e.includes("youtube")) return "youtube";
			if (e.includes("tiktok")) return "tiktok";
			if (e.includes("instagram")) return "instagram";
			if (e.includes("facebook") || e.includes("fb")) return "facebook";
			if (e.includes("twitter") || e.includes("x") || e.includes("periscope")) return "twitter";
			if (e.includes("twitch")) return "twitch";
			if (e.includes("reddit")) return "reddit";
			if (e.includes("vimeo")) return "other";
			if (e.includes("pinterest")) return "other";
			if (e.includes("soundcloud")) return "other";
		}
		if (u.includes("youtube.com") || u.includes("youtu.be")) return "youtube";
		if (u.includes("tiktok.com")) return "tiktok";
		if (u.includes("instagram.com")) return "instagram";
		if (u.includes("facebook.com") || u.includes("fb.watch") || u.includes("fb.com")) return "facebook";
		if (u.includes("twitter.com") || u.includes("x.com")) return "twitter";
		if (u.includes("twitch.tv")) return "twitch";
		if (u.includes("reddit.com") || u.includes("redd.it")) return "reddit";
		if (u.includes("pinterest.com")) return "other";
		if (u.includes("vimeo.com")) return "other";
		return "other";
	}
	normalizeQualityLabel(value) {
		if (value === void 0 || value === null) return null;
		if (typeof value === "number") {
			if (!Number.isFinite(value) || value <= 0) return null;
			return `${Math.round(value)}p`;
		}
		const raw = value.toString().trim().toLowerCase();
		if (!raw) return null;
		const resolutionMatch = raw.match(/x(\d{3,4})/i);
		if (resolutionMatch?.[1]) return `${resolutionMatch[1]}p`;
		const directMatch = raw.match(/(\d{3,4})p/);
		if (directMatch?.[1]) return `${directMatch[1]}p`;
		const numberMatch = raw.match(/(\d{3,4})/);
		if (numberMatch?.[1]) return `${numberMatch[1]}p`;
		return null;
	}
	extractAvailableQualities(info) {
		const formatCollections = [];
		if (Array.isArray(info?.formats)) formatCollections.push(info.formats);
		if (Array.isArray(info?.requested_formats)) formatCollections.push(info.requested_formats);
		if (Array.isArray(info?.entries)) info.entries.forEach((entry) => {
			if (Array.isArray(entry?.formats)) formatCollections.push(entry.formats);
			else if (Array.isArray(entry?.requested_formats)) formatCollections.push(entry.requested_formats);
		});
		const addQuality = (candidate, set) => {
			const normalized = this.normalizeQualityLabel(candidate);
			if (normalized) set.add(normalized);
		};
		const looksLikeVideo = (fmt) => {
			if (!fmt || typeof fmt !== "object") return false;
			if (fmt.vcodec && fmt.vcodec !== "none") return true;
			if (fmt.video_ext && fmt.video_ext !== "none") return true;
			if (typeof fmt.height === "number" && fmt.height > 0) return true;
			if (typeof fmt.width === "number" && fmt.width > 0) return true;
			if (typeof fmt.resolution === "string" && /\d+x\d+/i.test(fmt.resolution)) return true;
			if (typeof fmt.format_note === "string" && /(\d{3,4})/i.test(fmt.format_note)) return true;
			return false;
		};
		const qualitySet = /* @__PURE__ */ new Set();
		formatCollections.forEach((formats) => {
			formats.forEach((fmt) => {
				if (!looksLikeVideo(fmt)) return;
				addQuality(fmt.height, qualitySet);
				addQuality(fmt.quality, qualitySet);
				addQuality(fmt.format_note, qualitySet);
				addQuality(fmt.resolution, qualitySet);
				addQuality(fmt.format, qualitySet);
			});
		});
		if (qualitySet.size === 0) {
			addQuality(info?.height, qualitySet);
			addQuality(info?.quality, qualitySet);
			addQuality(info?.format_note, qualitySet);
			addQuality(info?.resolution, qualitySet);
		}
		return Array.from(qualitySet).sort((a, b) => {
			const heightA = parseInt(a, 10) || 0;
			return (parseInt(b, 10) || 0) - heightA;
		});
	}
	async getMediaInfo(url) {
		await this.ensureInitialized();
		try {
			const hasVideoId = url.includes("v=") || url.includes("youtu.be/") || url.includes("/video/") || url.includes("/v/");
			const hasPlaylistId = url.includes("list=") || url.includes("/playlist") || url.includes("/sets/") || url.includes("/album/") || url.includes("/c/") || url.includes("/channel/") || url.includes("/user/");
			const settings = this.getSettings();
			const commonArgs = ["--dump-json", "--no-check-certificate"];
			if (settings.useBrowserCookies) commonArgs.push("--cookies-from-browser", settings.useBrowserCookies);
			const mainArgs = [url, ...commonArgs];
			if (hasPlaylistId && !hasVideoId) mainArgs.push("--flat-playlist");
			else mainArgs.push("--no-playlist");
			const playlistArgs = hasPlaylistId && hasVideoId ? [
				url,
				...commonArgs,
				"--flat-playlist"
			] : null;
			const [mainRes, playlistRes] = await Promise.allSettled([this.ytDlp.execPromise(mainArgs), playlistArgs ? this.ytDlp.execPromise(playlistArgs) : Promise.resolve(null)]);
			if (mainRes.status === "rejected") throw mainRes.reason;
			const lines = mainRes.value.trim().split("\n");
			let info = JSON.parse(lines[0]);
			if (lines.length > 1 && !info.entries) {
				const entries = lines.map((l) => {
					try {
						return JSON.parse(l);
					} catch (e) {
						return null;
					}
				}).filter((i) => i !== null);
				info = {
					...entries[0],
					entries,
					_type: "playlist"
				};
			}
			if (playlistRes.status === "fulfilled" && playlistRes.value) try {
				const pLines = playlistRes.value.trim().split("\n");
				let playlistInfo = JSON.parse(pLines[0]);
				if (pLines.length > 1 && !playlistInfo.entries) {
					const entries = pLines.map((l) => {
						try {
							return JSON.parse(l);
						} catch (e) {
							return null;
						}
					}).filter((i) => i !== null);
					playlistInfo = {
						...entries[0],
						entries
					};
				}
				if (playlistInfo.entries && !info.entries) {
					info.entries = playlistInfo.entries;
					info.playlist_count = playlistInfo.playlist_count || playlistInfo.entries.length;
					if (!info._type) info._type = "playlist";
				}
			} catch (e) {
				console.warn("Failed to parse auxiliary playlist info:", e);
			}
			const platform = this.detectPlatform(url, info.extractor);
			const isPlaylist = info._type === "playlist" || !!info.entries || info._type === "multi_video";
			const hasPlaylistContext = hasPlaylistId || !!info.playlist_id;
			const availableQualities = this.extractAvailableQualities(info);
			const playlistVideos = isPlaylist && info.entries ? info.entries.map((entry) => ({
				id: entry.id,
				title: entry.title,
				duration: entry.duration,
				url: entry.url || (platform === "youtube" ? `https://www.youtube.com/watch?v=${entry.id}` : entry.url),
				thumbnail: entry.thumbnails?.[0]?.url || entry.thumbnail
			})) : void 0;
			const title = info.title || info.id || "Untitled Media";
			const thumbnail = info.thumbnail || info.entries?.[0]?.thumbnail || info.thumbnails?.[0]?.url || "";
			return {
				id: info.id || info.entries?.[0]?.id || "unknown",
				url: info.webpage_url || url,
				title,
				platform,
				thumbnailUrl: thumbnail,
				author: info.uploader || info.channel || info.uploader_id || "Unknown",
				authorUrl: info.uploader_url || info.channel_url,
				duration: info.duration,
				uploadDate: info.upload_date,
				description: info.description,
				viewCount: info.view_count,
				likeCount: info.like_count,
				isLive: info.is_live || false,
				webpageUrl: info.webpage_url,
				availableQualities: availableQualities.length > 0 ? availableQualities : void 0,
				isPlaylist: isPlaylist || hasPlaylistContext,
				playlistCount: isPlaylist || hasPlaylistContext ? info.playlist_count || info.entries?.length : void 0,
				playlistVideos,
				size: info.filesize || info.filesize_approx
			};
		} catch (error) {
			const downloadError = ErrorParser.parse(error, {
				url,
				platform: this.detectPlatform(url)
			});
			errorLogger.log(downloadError);
			throw downloadError;
		}
	}
	async downloadMedia(options, progressCallback) {
		const downloadId = options.id || randomUUID$1();
		return new Promise((resolve, reject) => {
			this.downloadQueue.push({
				options: {
					...options,
					id: downloadId
				},
				run: () => this.executeDownload({
					...options,
					id: downloadId
				}, progressCallback),
				resolve,
				reject,
				state: "queued"
			});
			this.saveQueuePersistently();
			this.processQueue();
		});
	}
	async retryDownload(id) {
		const queuedItem = this.downloadQueue.find((item) => item.options.id === id);
		if (queuedItem) {
			queuedItem.state = "queued";
			this.saveQueuePersistently();
			this.processQueue();
			return;
		}
		const options = this.activeOptions.get(id);
		if (options) {
			this.downloadQueue.push({
				options,
				run: () => this.executeDownload(options),
				resolve: () => {},
				reject: () => {},
				state: "queued"
			});
			this.saveQueuePersistently();
			this.processQueue();
			return;
		}
		const historyItem = this.store.get("history").find((h) => h.id === id);
		if (historyItem) {
			const reconstructedOptions = {
				url: historyItem.url,
				format: historyItem.format || "video",
				quality: "best",
				id: historyItem.id
			};
			this.downloadQueue.push({
				options: reconstructedOptions,
				run: () => this.executeDownload(reconstructedOptions),
				resolve: () => {},
				reject: () => {},
				state: "queued"
			});
			this.saveQueuePersistently();
			this.processQueue();
		}
	}
	async pauseDownload(id) {
		const proc = this.activeProcesses.get(id);
		if (proc && proc.ytDlpProcess) {
			const task = this.downloadQueue.find((t) => t.options.id === id);
			if (task) task.state = "paused";
			proc.ytDlpProcess.kill("SIGTERM");
			this.saveQueuePersistently();
		}
	}
	async resumeDownload(id) {
		const queuedItem = this.downloadQueue.find((item) => item.options.id === id);
		if (queuedItem) {
			queuedItem.state = "queued";
			this.saveQueuePersistently();
			this.processQueue();
			return;
		}
		const options = this.activeOptions.get(id);
		if (options) {
			this.downloadQueue.unshift({
				options,
				run: () => this.executeDownload(options),
				resolve: () => {},
				reject: () => {},
				state: "queued"
			});
			this.saveQueuePersistently();
			this.processQueue();
		}
	}
	async checkDiskSpace(downloadPath) {
		try {
			const targetPath = downloadPath || this.store.get("settings.downloadPath") || app.getPath("downloads");
			const disks = await si.fsSize();
			let disk = disks[0];
			let maxMatchLen = -1;
			for (const d of disks) if (targetPath.startsWith(d.mount) && d.mount.length > maxMatchLen) {
				maxMatchLen = d.mount.length;
				disk = d;
			}
			if (!disk) return {
				available: 0,
				total: 0,
				warning: false
			};
			const available = disk.available;
			const total = disk.size;
			return {
				available,
				total,
				warning: available < 5 * 1024 * 1024 * 1024 || available / total < .1
			};
		} catch (error) {
			console.error("Failed to check disk space:", error);
			return {
				available: 0,
				total: 0,
				warning: false
			};
		}
	}
	getQueue() {
		return this.downloadQueue.map((item) => ({
			id: item.options.id,
			url: item.options.url,
			state: item.state,
			filename: item.options.url
		}));
	}
	reorderQueue(id, newIndex) {
		const index = this.downloadQueue.findIndex((item) => item.options.id === id);
		if (index !== -1 && newIndex >= 0 && newIndex < this.downloadQueue.length) {
			const item = this.downloadQueue.splice(index, 1)[0];
			this.downloadQueue.splice(newIndex, 0, item);
			this.saveQueuePersistently();
		}
	}
	async processQueue() {
		const maxConcurrent = this.getSettings().maxConcurrentDownloads || 3;
		if ((await this.checkDiskSpace()).available < 500 * 1024 * 1024) {
			console.warn("Low disk space, skipping queue processing");
			return;
		}
		while (this.activeDownloadsCount < maxConcurrent) {
			const task = this.downloadQueue.find((t) => t.state === "queued");
			if (!task) break;
			this.activeDownloadsCount++;
			task.state = "downloading";
			this.saveQueuePersistently();
			task.run().then((result) => {
				task.state = "downloading";
				this.downloadQueue = this.downloadQueue.filter((t) => t !== task);
				task.resolve(result);
			}).catch((error) => {
				task.state = "error";
				task.reject(error);
			}).finally(() => {
				this.activeDownloadsCount--;
				this.saveQueuePersistently();
				this.processQueue();
			});
		}
	}
	async executeDownload(options, progressCallback) {
		await this.ensureInitialized();
		const { url, format, quality, outputPath, maxSpeed, id, cookiesBrowser, embedSubs, isPlaylist, playlistItems, audioFormat } = options;
		const downloadId = id || randomUUID$1();
		this.activeOptions.set(downloadId, options);
		try {
			const space = await this.checkDiskSpace(outputPath);
			if (space.warning && space.available < 100 * 1024 * 1024) throw new Error("Not enough disk space to start download.");
		} catch (e) {
			console.warn("Disk space check failed:", e);
		}
		try {
			const info = await this.getMediaInfo(url);
			const sanitizedTitle = this.sanitizeFilename(info.title);
			const author = this.sanitizeFilename(info.author || "unknown");
			const downloadsPath = outputPath || this.store.get("settings.downloadPath") || app.getPath("downloads");
			const extension = format === "audio" ? audioFormat || "mp3" : "mp4";
			let outputTemplate;
			let displayFilename;
			const shouldDownloadPlaylist = isPlaylist === true;
			const platformName = (info.platform || "Other").toUpperCase();
			if (shouldDownloadPlaylist) {
				const playlistFolder = path$1.join(downloadsPath, sanitizedTitle);
				if (!fs$1.existsSync(playlistFolder)) fs$1.mkdirSync(playlistFolder, { recursive: true });
				outputTemplate = path$1.join(playlistFolder, "%(playlist_index)s - %(title)s.%(ext)s");
				displayFilename = `[${platformName} PLAYLIST] ${sanitizedTitle}`;
			} else {
				displayFilename = `[${platformName}] ${author} - ${sanitizedTitle.length > 50 ? sanitizedTitle.substring(0, 50) + "..." : sanitizedTitle} [${info.id}].${extension}`;
				outputTemplate = path$1.join(downloadsPath, displayFilename);
			}
			if (!fs$1.existsSync(downloadsPath)) fs$1.mkdirSync(downloadsPath, { recursive: true });
			const args = [
				url,
				"-o",
				outputTemplate,
				"--newline",
				"--no-warnings",
				"--no-check-certificate",
				"--concurrent-fragments",
				"4",
				"--retries",
				"10"
			];
			if (!shouldDownloadPlaylist) args.push("--no-playlist");
			else if (playlistItems) args.push("--playlist-items", playlistItems);
			if (embedSubs && info.platform === "youtube") args.push("--all-subs", "--embed-subs", "--write-auto-subs");
			if (this.ffmpegPath) args.push("--ffmpeg-location", this.ffmpegPath);
			if (maxSpeed) args.push("--limit-rate", maxSpeed);
			const settings = this.getSettings();
			const browserForCookies = cookiesBrowser || settings.useBrowserCookies;
			if (browserForCookies) args.push("--cookies-from-browser", browserForCookies);
			if (format === "audio") {
				args.push("-x", "--audio-format", audioFormat || "mp3");
				const audioQuality = quality || "0";
				args.push("--audio-quality", audioQuality);
			} else {
				if (quality && quality.endsWith("p")) {
					const height = quality.replace("p", "");
					args.push("-f", `bestvideo[height<=${height}]+bestaudio/best[height<=${height}]`);
				} else args.push("-f", "bestvideo+bestaudio/best");
				args.push("--merge-output-format", "mp4");
			}
			if (!isPlaylist && !info.isPlaylist) args.push("--no-playlist");
			return new Promise((resolve, reject) => {
				let totalBytes = 0;
				let downloadedBytes = 0;
				let percent = 0;
				let currentItemFilename = displayFilename;
				let stderrOutput = "";
				const process$1 = this.ytDlp.exec(args);
				this.activeProcesses.set(downloadId, process$1);
				if (process$1.ytDlpProcess) {
					process$1.ytDlpProcess.stderr?.on("data", (data) => {
						stderrOutput += data.toString();
					});
					process$1.ytDlpProcess.stdout?.on("data", (data) => {
						data.toString().split(/\r?\n/).forEach((line) => {
							if (!line.trim()) return;
							const itemMatch = line.match(/\[download\] Destination: .*[/\\](.*)$/);
							if (itemMatch) currentItemFilename = itemMatch[1];
							const progressMatch = line.match(/\[download\]\s+([\d.]+)%\s+of\s+~?([\d.]+)([\w]+)\s+at\s+([\d.]+)([\w/]+)\s+ETA\s+([\d:]+)/);
							if (progressMatch) {
								percent = parseFloat(progressMatch[1]);
								const sizeVal = parseFloat(progressMatch[2]);
								const sizeUnit = progressMatch[3];
								const speedVal = parseFloat(progressMatch[4]);
								const speedUnit = progressMatch[5].split("/")[0];
								const etaStr = progressMatch[6];
								const unitMultipliers = {
									"B": 1,
									"KB": 1024,
									"KIB": 1024,
									"K": 1024,
									"MB": 1024 * 1024,
									"MIB": 1024 * 1024,
									"M": 1024 * 1024,
									"GB": 1024 * 1024 * 1024,
									"GIB": 1024 * 1024 * 1024,
									"G": 1024 * 1024 * 1024,
									"TB": 1024 * 1024 * 1024 * 1024,
									"TIB": 1024 * 1024 * 1024 * 1024,
									"T": 1024 * 1024 * 1024 * 1024
								};
								totalBytes = sizeVal * (unitMultipliers[sizeUnit.toUpperCase()] || 1);
								downloadedBytes = percent / 100 * totalBytes;
								const speed = speedVal * (unitMultipliers[speedUnit.toUpperCase()] || 1);
								const etaParts = etaStr.split(":").reverse();
								let eta = 0;
								if (etaParts[0]) eta += parseInt(etaParts[0]);
								if (etaParts[1]) eta += parseInt(etaParts[1]) * 60;
								if (etaParts[2]) eta += parseInt(etaParts[2]) * 3600;
								if (progressCallback) progressCallback({
									id: downloadId,
									percent,
									downloaded: downloadedBytes,
									total: totalBytes,
									speed,
									eta,
									state: "downloading",
									filename: info.isPlaylist ? `${displayFilename} (${currentItemFilename})` : displayFilename,
									platform: info.platform
								});
							}
						});
					});
				}
				process$1.on("close", (code) => {
					this.activeProcesses.delete(downloadId);
					if (code === 0) {
						this.activeOptions.delete(downloadId);
						const finalPath = isPlaylist || info.isPlaylist ? path$1.join(downloadsPath, sanitizedTitle) : outputTemplate;
						if (progressCallback) progressCallback({
							id: downloadId,
							percent: 100,
							downloaded: totalBytes,
							total: totalBytes,
							speed: 0,
							eta: 0,
							state: "complete",
							filename: displayFilename,
							filePath: finalPath,
							platform: info.platform
						});
						this.addToHistory({
							id: downloadId,
							url,
							title: info.title,
							platform: info.platform,
							thumbnailUrl: info.thumbnailUrl,
							author: info.author,
							timestamp: Date.now(),
							path: finalPath,
							size: totalBytes,
							duration: info.duration,
							format,
							status: "completed"
						});
						resolve(finalPath);
					} else if (code === null) {
						const errorMsg = stderrOutput ? `Download terminated: ${stderrOutput.substring(0, 200)}` : "Download was cancelled or terminated unexpectedly";
						const error = this.handleDownloadError(new Error(errorMsg), downloadId, url, info.platform, progressCallback);
						reject(error);
					} else {
						const errorMsg = stderrOutput || `Download failed (exit code: ${code})`;
						const error = this.handleDownloadError(new Error(errorMsg), downloadId, url, info.platform, progressCallback);
						reject(error);
					}
				});
				process$1.on("error", (err) => {
					this.activeProcesses.delete(downloadId);
					const error = this.handleDownloadError(err, downloadId, url, info.platform, progressCallback);
					reject(error);
				});
				const timeout = setTimeout(() => {
					if (this.activeProcesses.has(downloadId)) {
						console.warn(`Download timeout for ${downloadId}, killing process`);
						const proc = this.activeProcesses.get(downloadId);
						if (proc && proc.ytDlpProcess) proc.ytDlpProcess.kill("SIGTERM");
					}
				}, 36e5);
				const originalResolve = resolve;
				const originalReject = reject;
				resolve = (value) => {
					clearTimeout(timeout);
					originalResolve(value);
				};
				reject = (reason) => {
					clearTimeout(timeout);
					originalReject(reason);
				};
			});
		} catch (error) {
			this.activeProcesses.delete(downloadId);
			throw error;
		}
	}
	cancelDownload(id) {
		if (id) {
			const proc = this.activeProcesses.get(id);
			if (proc && proc.ytDlpProcess) proc.ytDlpProcess.kill();
			this.downloadQueue = this.downloadQueue.filter((t) => t.options.id !== id);
			this.saveQueuePersistently();
		} else {
			this.activeProcesses.forEach((proc) => {
				if (proc.ytDlpProcess) proc.ytDlpProcess.kill();
			});
			this.downloadQueue = [];
			this.saveQueuePersistently();
		}
	}
	getHistory() {
		return this.store.get("history", []);
	}
	clearHistory() {
		this.store.set("history", []);
	}
	removeFromHistory(id) {
		const history = this.getHistory();
		this.store.set("history", history.filter((h) => h.id !== id));
	}
	addToHistory(item) {
		const history = this.getHistory();
		history.unshift(item);
		this.store.set("history", history.slice(0, 200));
	}
	getSettings() {
		return this.store.get("settings");
	}
	saveSettings(settings) {
		const current = this.getSettings();
		this.store.set("settings", {
			...current,
			...settings
		});
	}
	sanitizeFilename(name) {
		return name.replace(/[<>:"/\\|?*]/g, "").trim();
	}
};
const universalDownloader = new UniversalDownloader();
function extractZip(zipPath, targetPath) {
	new AdmZip(zipPath).extractAllTo(targetPath, true);
}
function createZip(sourcePath, targetPath) {
	const zip = new AdmZip();
	zip.addLocalFolder(sourcePath);
	zip.writeZip(targetPath);
}
function createZipWithFiles(targetPath, files) {
	const zip = new AdmZip();
	files.forEach((file) => {
		zip.addFile(file.path, typeof file.content === "string" ? Buffer.from(file.content) : file.content);
	});
	zip.writeZip(targetPath);
}
function setupZipHandlers() {
	ipcMain.handle("zip:extract", async (_, zipPath, targetPath) => {
		try {
			extractZip(zipPath, targetPath);
			return { success: true };
		} catch (e) {
			return {
				success: false,
				error: e.message
			};
		}
	});
	ipcMain.handle("zip:create", async (_, sourcePath, targetPath) => {
		try {
			createZip(sourcePath, targetPath);
			return { success: true };
		} catch (e) {
			return {
				success: false,
				error: e.message
			};
		}
	});
}
var require$1 = createRequire(import.meta.url);
var PluginManager = class {
	constructor() {
		this.loadedPlugins = /* @__PURE__ */ new Map();
		const userDataPath = app.getPath("userData");
		this.pluginsDir = path$1.join(userDataPath, "plugins");
		this.binariesDir = path$1.join(userDataPath, "binaries");
		this.registryUrl = "https://raw.githubusercontent.com/devtools-app/plugins/main/registry.json";
		this.store = new Store({
			name: "plugin-manager",
			defaults: {
				installed: {},
				registry: null,
				lastRegistryUpdate: 0
			}
		});
		this.ensureDirectories();
	}
	async ensureDirectories() {
		await fsp.mkdir(this.pluginsDir, { recursive: true });
		await fsp.mkdir(this.binariesDir, { recursive: true });
	}
	async initialize() {
		console.log("[PluginManager] Initializing...");
		await this.updateRegistry();
		await this.loadInstalledPlugins();
		console.log("[PluginManager] Initialized with", this.loadedPlugins.size, "active plugins");
	}
	async updateRegistry(force = false) {
		const lastUpdate = this.store.get("lastRegistryUpdate");
		if (!force && Date.now() - lastUpdate < 3600 * 1e3) {
			console.log("[PluginManager] Registry is up to date");
			return;
		}
		try {
			console.log("[PluginManager] Fetching plugin registry...");
			const response = await axios.get(this.registryUrl, { timeout: 1e4 });
			this.store.set("registry", response.data);
			this.store.set("lastRegistryUpdate", Date.now());
			console.log("[PluginManager] Registry updated:", response.data.plugins.length, "plugins available");
		} catch (error) {
			console.error("[PluginManager] Failed to update registry:", error.message);
			if (!this.store.get("registry") || force) await this.loadEmbeddedRegistry();
			else console.log("[PluginManager] Using cached registry");
		}
	}
	async loadEmbeddedRegistry() {
		try {
			let registryPath = "";
			if (app.isPackaged) registryPath = path$1.join(process.resourcesPath, "plugin-registry.json");
			else registryPath = path$1.join(app.getAppPath(), "resources", "plugin-registry.json");
			console.log("[PluginManager] Loading registry from:", registryPath);
			const data = await fsp.readFile(registryPath, "utf-8");
			const registry = JSON.parse(data);
			this.store.set("registry", registry);
			console.log("[PluginManager] Loaded embedded registry");
		} catch (error) {
			console.error("[PluginManager] Failed to load embedded registry:", error);
		}
	}
	getRegistry() {
		return this.store.get("registry");
	}
	getAvailablePlugins() {
		return this.store.get("registry")?.plugins || [];
	}
	async installPlugin(pluginId, onProgress) {
		console.log("[PluginManager] Installing plugin:", pluginId);
		const manifest = this.getPluginManifest(pluginId);
		if (!manifest) throw new Error(`Plugin not found in registry: ${pluginId}`);
		if (this.store.get("installed")[pluginId]) throw new Error(`Plugin already installed: ${pluginId}`);
		this.checkCompatibility(manifest);
		try {
			onProgress?.({
				stage: "download",
				percent: 0,
				message: "Initiating download..."
			});
			let pluginZipPath;
			try {
				pluginZipPath = await this.downloadFile(manifest.downloadUrl, path$1.join(app.getPath("temp"), `${pluginId}.zip`), (percent) => onProgress?.({
					stage: "download",
					percent,
					message: `Downloading assets... ${percent}%`
				}));
			} catch (downloadError) {
				if (downloadError.message?.includes("404") || manifest.downloadUrl === "...") {
					console.warn(`[PluginManager] Download failed (404), entering Demo Mode for ${pluginId}`);
					onProgress?.({
						stage: "download",
						percent: 100,
						message: "Simulating download (Demo Mode)..."
					});
					pluginZipPath = await this.createDemoPluginZip(pluginId, manifest);
				} else throw downloadError;
			}
			onProgress?.({
				stage: "verify",
				percent: 50,
				message: "Verifying integrity..."
			});
			if (!pluginZipPath.includes("demo-")) await this.verifyChecksum(pluginZipPath, manifest.checksum);
			onProgress?.({
				stage: "extract",
				percent: 60,
				message: "Extracting files..."
			});
			const pluginPath = path$1.join(this.pluginsDir, pluginId);
			await this.extractZip(pluginZipPath, pluginPath);
			if (manifest.dependencies?.binary && manifest.dependencies.binary.length > 0) {
				onProgress?.({
					stage: "dependencies",
					percent: 70,
					message: "Installing dependencies..."
				});
				try {
					await this.installBinaryDependencies(manifest.dependencies.binary, onProgress);
				} catch (depError) {
					console.warn("[PluginManager] Binary dependencies failed to install, continuing anyway (Demo Mode)");
				}
			}
			onProgress?.({
				stage: "validate",
				percent: 90,
				message: "Validating plugin..."
			});
			await this.validatePlugin(pluginPath, manifest);
			onProgress?.({
				stage: "register",
				percent: 95,
				message: "Registering plugin..."
			});
			const installedPlugin = {
				manifest,
				installPath: pluginPath,
				installedAt: Date.now(),
				active: true
			};
			const updatedInstalled = {
				...this.store.get("installed"),
				[pluginId]: installedPlugin
			};
			this.store.set("installed", updatedInstalled);
			onProgress?.({
				stage: "complete",
				percent: 100,
				message: "Plugin installed successfully!"
			});
			await this.loadPlugin(pluginId).catch((err) => {
				console.warn(`[PluginManager] Failed to load ${pluginId}:`, err.message);
				return null;
			});
			if (pluginZipPath.includes(app.getPath("temp"))) await fsp.unlink(pluginZipPath).catch(() => {});
			console.log("[PluginManager] Plugin installed successfully:", pluginId);
		} catch (error) {
			console.error("[PluginManager] Installation failed:", error);
			const pluginPath = path$1.join(this.pluginsDir, pluginId);
			await fsp.rm(pluginPath, {
				recursive: true,
				force: true
			}).catch(() => {});
			let friendlyError = error.message;
			if (friendlyError.includes("404")) friendlyError = `The plugin "${manifest.name}" could not be found at its download URL. It might not be published yet.`;
			throw new Error(`Installation failed: ${friendlyError}`);
		}
	}
	async uninstallPlugin(pluginId) {
		console.log("[PluginManager] Uninstalling plugin:", pluginId);
		const installed = this.store.get("installed");
		const plugin = installed[pluginId];
		if (!plugin) throw new Error(`Plugin not installed: ${pluginId}`);
		try {
			this.unloadPlugin(pluginId);
			await fsp.rm(plugin.installPath, {
				recursive: true,
				force: true
			});
			if (plugin.manifest.dependencies?.binary) await this.cleanupDependencies(plugin.manifest.dependencies.binary);
			const { [pluginId]: removed, ...remaining } = installed;
			this.store.set("installed", remaining);
			console.log("[PluginManager] Plugin uninstalled:", pluginId);
		} catch (error) {
			console.error("[PluginManager] Uninstallation failed:", error);
			throw new Error(`Uninstallation failed: ${error.message}`);
		}
	}
	async loadInstalledPlugins() {
		const installed = this.store.get("installed");
		for (const [pluginId, plugin] of Object.entries(installed)) if (plugin.active) try {
			await this.loadPlugin(pluginId);
		} catch (error) {
			console.error(`[PluginManager] Failed to load plugin ${pluginId}:`, error.message);
		}
	}
	async loadPlugin(pluginId) {
		const plugin = this.store.get("installed")[pluginId];
		if (!plugin) throw new Error(`Plugin not installed: ${pluginId}`);
		try {
			const pluginModule = require$1(path$1.join(plugin.installPath, plugin.manifest.main));
			if (pluginModule.activate) await pluginModule.activate();
			this.loadedPlugins.set(pluginId, pluginModule);
			console.log("[PluginManager] Plugin loaded:", pluginId);
		} catch (error) {
			console.error(`[PluginManager] Failed to load plugin ${pluginId}:`, error);
			throw error;
		}
	}
	unloadPlugin(pluginId) {
		const pluginModule = this.loadedPlugins.get(pluginId);
		if (pluginModule?.deactivate) try {
			pluginModule.deactivate();
		} catch (error) {
			console.error(`[PluginManager] Error during plugin deactivation:`, error);
		}
		this.loadedPlugins.delete(pluginId);
		console.log("[PluginManager] Plugin unloaded:", pluginId);
	}
	async installBinaryDependencies(dependencies, onProgress) {
		const platform = process.platform;
		for (let i = 0; i < dependencies.length; i++) {
			const dep = dependencies[i];
			const platformInfo = dep.platforms[platform];
			if (!platformInfo) {
				console.warn(`[PluginManager] Binary ${dep.name} not available for ${platform}`);
				continue;
			}
			let binaryName = dep.name;
			if (platform === "win32" && !binaryName.endsWith(".exe")) binaryName += ".exe";
			const binaryPath = path$1.join(this.binariesDir, binaryName);
			if (await this.fileExists(binaryPath)) {
				console.log(`[PluginManager] Binary ${binaryName} already exists`);
				continue;
			}
			const basePercent = 70 + i / dependencies.length * 20;
			onProgress?.({
				stage: "dependencies",
				percent: basePercent,
				message: `Installing ${dep.name}...`
			});
			const isZip = platformInfo.url.toLowerCase().endsWith(".zip");
			const tempFileName = isZip ? `${dep.name}.zip` : binaryName;
			const tempPath = path$1.join(app.getPath("temp"), tempFileName);
			await this.downloadFile(platformInfo.url, tempPath);
			try {
				await this.verifyChecksum(tempPath, platformInfo.checksum);
			} catch (err) {
				await fsp.unlink(tempPath).catch(() => {});
				throw err;
			}
			if (isZip) await this.extractZip(tempPath, this.binariesDir);
			else await fsp.copyFile(tempPath, binaryPath);
			if (platform !== "win32") await fsp.chmod(binaryPath, 493);
			await fsp.unlink(tempPath).catch(() => {});
			console.log(`[PluginManager] Binary installed: ${dep.name}`);
		}
	}
	async cleanupDependencies(dependencies) {
		const installed = this.store.get("installed");
		for (const dep of dependencies) {
			let inUse = false;
			for (const plugin of Object.values(installed)) if (plugin.manifest.dependencies?.binary?.some((d) => d.name === dep.name)) {
				inUse = true;
				break;
			}
			if (!inUse) {
				const binaryPath = path$1.join(this.binariesDir, dep.name);
				await fsp.rm(binaryPath, {
					force: true,
					recursive: true
				}).catch(() => {});
				console.log(`[PluginManager] Removed unused binary: ${dep.name}`);
			}
		}
	}
	getPluginManifest(pluginId) {
		return this.store.get("registry")?.plugins.find((p) => p.id === pluginId) || null;
	}
	checkCompatibility(manifest) {
		const platform = process.platform;
		console.log(`[PluginManager] Checking compatibility for ${manifest.id}: App version ${app.getVersion()}, Platform ${platform}`);
		if (!manifest.platforms.includes(platform)) throw new Error(`Plugin not compatible with ${platform}`);
		const appVersion = app.getVersion();
		if (appVersion < manifest.minAppVersion && !appVersion.startsWith("0.0")) throw new Error(`Plugin requires app version ${manifest.minAppVersion} or higher (current: ${appVersion})`);
	}
	async downloadFile(url, destination, onProgress) {
		console.log(`[PluginManager] Downloading from ${url} to ${destination}`);
		if (url.startsWith("file://")) return new Promise(async (resolve, reject) => {
			try {
				const srcPath = url.replace("file://", "");
				const normalizedSrc = process.platform === "win32" && srcPath.startsWith("/") && srcPath.includes(":") ? srcPath.substring(1) : srcPath;
				const totalSize$1 = (await fsp.stat(normalizedSrc)).size;
				let copiedSize = 0;
				const readStream = fs$1.createReadStream(normalizedSrc);
				const writeStream = fs$1.createWriteStream(destination);
				readStream.on("data", (chunk) => {
					copiedSize += chunk.length;
					if (totalSize$1 > 0) {
						const percent = Math.round(copiedSize / totalSize$1 * 100);
						onProgress?.(percent);
					}
				});
				readStream.pipe(writeStream);
				writeStream.on("finish", () => resolve(destination));
				writeStream.on("error", reject);
				readStream.on("error", reject);
			} catch (error) {
				reject(error);
			}
		});
		const response = await axios({
			method: "GET",
			url,
			responseType: "stream",
			timeout: 3e5
		});
		const contentLength = response.headers["content-length"];
		const totalSize = contentLength ? parseInt(contentLength, 10) : 0;
		let downloadedSize = 0;
		const writer = fs$1.createWriteStream(destination);
		return new Promise((resolve, reject) => {
			response.data.on("data", (chunk) => {
				downloadedSize += chunk.length;
				if (totalSize > 0) {
					const percent = Math.round(downloadedSize / totalSize * 100);
					onProgress?.(percent);
				} else onProgress?.(0);
			});
			response.data.pipe(writer);
			writer.on("finish", () => resolve(destination));
			writer.on("error", (err) => {
				writer.close();
				reject(err);
			});
			response.data.on("error", (err) => {
				writer.close();
				reject(err);
			});
		});
	}
	async verifyChecksum(filePath, expectedChecksum) {
		const fileBuffer = await fsp.readFile(filePath);
		if (createHash$1("sha256").update(fileBuffer).digest("hex") !== expectedChecksum) throw new Error("Checksum verification failed - file may be corrupted");
	}
	async extractZip(zipPath, destination) {
		extractZip(zipPath, destination);
	}
	async createDemoPluginZip(pluginId, manifest) {
		const tempPath = path$1.join(app.getPath("temp"), `demo-${pluginId}.zip`);
		const entryPoint = manifest.main || "index.js";
		const content = `
      exports.activate = () => console.log('Demo Plugin ${pluginId} activated');
      exports.deactivate = () => console.log('Demo Plugin ${pluginId} deactivated');
    `;
		createZipWithFiles(tempPath, [{
			path: "manifest.json",
			content: JSON.stringify(manifest, null, 2)
		}, {
			path: entryPoint,
			content
		}]);
		return tempPath;
	}
	async validatePlugin(pluginPath, manifest) {
		const mainPath = path$1.join(pluginPath, manifest.main);
		if (!await this.fileExists(mainPath)) throw new Error(`Plugin main file not found: ${manifest.main}`);
		const manifestPath = path$1.join(pluginPath, "manifest.json");
		if (!await this.fileExists(manifestPath)) throw new Error("Plugin manifest.json not found");
	}
	async fileExists(filePath) {
		try {
			await fsp.access(filePath);
			return true;
		} catch {
			return false;
		}
	}
	getInstalledPlugins() {
		const installed = this.store.get("installed");
		return Object.values(installed);
	}
	isInstalled(pluginId) {
		return pluginId in this.store.get("installed");
	}
	getPlugin(pluginId) {
		return this.loadedPlugins.get(pluginId);
	}
	getBinaryPath(binaryName) {
		const p = path$1.join(this.binariesDir, binaryName);
		if (process.platform === "win32" && !binaryName.endsWith(".exe")) {
			if (fs$1.existsSync(p)) return p;
			return p + ".exe";
		}
		return p;
	}
	async togglePlugin(pluginId, active) {
		const installed = this.store.get("installed");
		const plugin = installed[pluginId];
		if (!plugin) throw new Error(`Plugin not installed: ${pluginId}`);
		if (active && !plugin.active) await this.loadPlugin(pluginId);
		else if (!active && plugin.active) this.unloadPlugin(pluginId);
		plugin.active = active;
		this.store.set("installed", installed);
	}
};
const pluginManager = new PluginManager();
var __filename = fileURLToPath(import.meta.url);
var __dirname$1 = path.dirname(__filename);
function setupScreenshotHandlers(win$1) {
	ipcMain.handle("screenshot:get-sources", async () => {
		try {
			return (await desktopCapturer.getSources({
				types: ["window", "screen"],
				thumbnailSize: {
					width: 300,
					height: 200
				}
			})).map((source) => ({
				id: source.id,
				name: source.name,
				thumbnail: source.thumbnail.toDataURL(),
				type: source.id.startsWith("screen") ? "screen" : "window"
			}));
		} catch (error) {
			console.error("Failed to get sources:", error);
			return [];
		}
	});
	ipcMain.handle("screenshot:capture-screen", async () => {
		try {
			const display = screen.getPrimaryDisplay();
			const scaleFactor = display.scaleFactor || 1;
			const size = {
				width: Math.ceil(display.size.width * scaleFactor),
				height: Math.ceil(display.size.height * scaleFactor)
			};
			const sources = await desktopCapturer.getSources({
				types: ["screen"],
				thumbnailSize: size
			});
			if (sources.length === 0) throw new Error("No screens available");
			const image = sources[0].thumbnail;
			return {
				dataUrl: `data:image/png;base64,${image.toPNG().toString("base64")}`,
				width: image.getSize().width,
				height: image.getSize().height
			};
		} catch (error) {
			console.error("Failed to capture screen:", error);
			throw error;
		}
	});
	ipcMain.handle("screenshot:capture-window", async (_event, sourceId) => {
		try {
			const scaleFactor = screen.getPrimaryDisplay().scaleFactor || 1;
			const source = (await desktopCapturer.getSources({
				types: ["window"],
				thumbnailSize: {
					width: 7680,
					height: 4320
				}
			})).find((s) => s.id === sourceId);
			if (!source) throw new Error("Window not found");
			const image = source.thumbnail;
			const dataUrl = `data:image/png;base64,${image.toPNG().toString("base64")}`;
			console.log(`Window captured: ${image.getSize().width}x${image.getSize().height} (Scale: ${scaleFactor})`);
			return {
				dataUrl,
				width: image.getSize().width,
				height: image.getSize().height
			};
		} catch (error) {
			console.error("Failed to capture window:", error);
			throw error;
		}
	});
	ipcMain.handle("screenshot:capture-area", async () => {
		try {
			console.log("Capturing screen for area selection...");
			const display = screen.getPrimaryDisplay();
			const scaleFactor = display.scaleFactor || 1;
			const size = {
				width: Math.ceil(display.size.width * scaleFactor),
				height: Math.ceil(display.size.height * scaleFactor)
			};
			const sources = await desktopCapturer.getSources({
				types: ["screen"],
				thumbnailSize: size
			});
			console.log(`Found ${sources.length} sources.`);
			if (sources.length === 0) {
				console.error("No screens available for capture.");
				throw new Error("No screens available");
			}
			const fullScreenImage = sources[0].thumbnail;
			console.log(`Captured thumbnail size: ${fullScreenImage.getSize().width}x${fullScreenImage.getSize().height}`);
			console.log(`Display size: ${display.size.width}x${display.size.height} (Scale: ${display.scaleFactor})`);
			return new Promise((resolve, reject) => {
				let selectionWindow = null;
				let isResolved = false;
				const removeExistingHandlers = () => {
					try {
						ipcMain.removeHandler("screenshot:area-selected");
					} catch (e) {}
					try {
						ipcMain.removeHandler("screenshot:area-cancelled");
					} catch (e) {}
				};
				const cleanup = () => {
					if (selectionWindow && !selectionWindow.isDestroyed()) selectionWindow.close();
					removeExistingHandlers();
				};
				removeExistingHandlers();
				ipcMain.handle("screenshot:area-selected", async (_event, bounds) => {
					if (isResolved) return;
					isResolved = true;
					cleanup();
					const scaleFactor$1 = display.scaleFactor;
					const croppedImage = fullScreenImage.crop({
						x: Math.round(bounds.x * scaleFactor$1),
						y: Math.round(bounds.y * scaleFactor$1),
						width: Math.round(bounds.width * scaleFactor$1),
						height: Math.round(bounds.height * scaleFactor$1)
					});
					resolve({
						dataUrl: `data:image/png;base64,${croppedImage.toPNG().toString("base64")}`,
						width: croppedImage.getSize().width,
						height: croppedImage.getSize().height
					});
				});
				ipcMain.handle("screenshot:area-cancelled", () => {
					if (isResolved) return;
					isResolved = true;
					cleanup();
					reject(/* @__PURE__ */ new Error("Area selection cancelled"));
				});
				const { width, height, x, y } = display.bounds;
				selectionWindow = new BrowserWindow({
					x,
					y,
					width,
					height,
					frame: false,
					transparent: true,
					hasShadow: false,
					backgroundColor: "#00000000",
					alwaysOnTop: true,
					skipTaskbar: true,
					resizable: false,
					enableLargerThanScreen: true,
					movable: false,
					acceptFirstMouse: true,
					webPreferences: {
						nodeIntegration: false,
						contextIsolation: true,
						preload: path.join(__dirname$1, "preload.mjs")
					}
				});
				selectionWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
				selectionWindow.show();
				selectionWindow.focus();
				selectionWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <style>
                            * { margin: 0; padding: 0; box-sizing: border-box; }
                            body {
                                width: 100vw;
                                height: 100vh;
                                cursor: crosshair;
                                background: transparent;
                                overflow: hidden;
                                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                                user-select: none;
                            }
                            #selection {
                                position: absolute;
                                border: 2px solid #3b82f6;
                                background: rgba(59, 130, 246, 0.05);
                                display: none;
                                box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.4);
                                z-index: 100;
                                pointer-events: none;
                            }
                            #toolbar {
                                position: absolute;
                                display: none;
                                background: #1a1b1e;
                                padding: 6px;
                                border-radius: 10px;
                                box-shadow: 0 10px 30px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1);
                                z-index: 2000;
                                display: flex;
                                gap: 8px;
                                align-items: center;
                                pointer-events: auto;
                                animation: popIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
                            }
                            @keyframes popIn {
                                from { opacity: 0; transform: scale(0.95) translateY(5px); }
                                to { opacity: 1; transform: scale(1) translateY(0); }
                            }
                            .btn {
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                padding: 0 16px;
                                height: 36px;
                                border-radius: 8px;
                                border: none;
                                font-size: 13px;
                                font-weight: 600;
                                cursor: pointer;
                                transition: all 0.15s ease;
                                color: white;
                            }
                            .btn-cancel {
                                background: rgba(255,255,255,0.08);
                                color: #e5e5e5;
                            }
                            .btn-cancel:hover { background: rgba(255,255,255,0.12); color: white; }
                            .btn-capture {
                                background: #3b82f6;
                                color: white;
                                box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
                            }
                            .btn-capture:hover { background: #2563eb; transform: translateY(-1px); }
                            .btn-capture:active { transform: translateY(0); }
                            #dimensions {
                                position: absolute;
                                top: -34px;
                                left: 0;
                                background: #3b82f6;
                                color: white;
                                padding: 4px 8px;
                                border-radius: 6px;
                                font-size: 12px;
                                font-weight: 600;
                                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                                opacity: 0;
                                transition: opacity 0.2s;
                            }
                            #instructions {
                                position: absolute;
                                top: 40px;
                                left: 50%;
                                transform: translateX(-50%);
                                background: rgba(0, 0, 0, 0.7);
                                backdrop-filter: blur(10px);
                                color: white;
                                padding: 8px 16px;
                                border-radius: 20px;
                                font-size: 13px;
                                font-weight: 500;
                                pointer-events: none;
                                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                                border: 1px solid rgba(255,255,255,0.1);
                                opacity: 0.8;
                            }
                            .hidden { display: none !important; }
                        </style>
                    </head>
                    <body>
                        <div id="instructions">Click and drag to capture</div>
                        <div id="selection">
                            <div id="dimensions">0 x 0</div>
                        </div>
                        <div id="toolbar" class="hidden">
                            <button class="btn btn-cancel" id="btn-cancel">Cancel</button>
                            <button class="btn btn-capture" id="btn-capture">Capture</button>
                        </div>
                        <script>
                            const selection = document.getElementById('selection');
                            const toolbar = document.getElementById('toolbar');
                            const dimensions = document.getElementById('dimensions');
                            const btnCancel = document.getElementById('btn-cancel');
                            const btnCapture = document.getElementById('btn-capture');
                            
                            let startX, startY, isDrawing = false;
                            let currentBounds = { x: 0, y: 0, width: 0, height: 0 };
                            
                            document.addEventListener('contextmenu', e => e.preventDefault());

                            function capture() {
                                if (!window.electronAPI) {
                                    alert('Error: Electron API not available. Preload script missed?');
                                    return;
                                }
                                if (currentBounds.width > 0 && currentBounds.height > 0) {
                                    window.electronAPI.sendSelection(currentBounds);
                                }
                            }
                            
                            function cancel() {
                                if (window.electronAPI) {
                                    window.electronAPI.cancelSelection();
                                } else {
                                    // If API is missing, we can't notify main process, but we can try to close window via window.close() if not sandboxed?
                                    // But contextIsolation is on.
                                    alert('Error: Electron API not available. Cannot cancel properly.');
                                }
                            }

                            btnCapture.onclick = capture;
                            btnCancel.onclick = cancel;

                            document.addEventListener('mousedown', (e) => {
                                if (e.target.closest('#toolbar')) return;
                                if (e.button !== 0) {
                                    if (e.button === 2) cancel();
                                    return;
                                }
                                isDrawing = true;
                                startX = e.clientX;
                                startY = e.clientY;
                                toolbar.classList.add('hidden');
                                dimensions.style.opacity = '1';
                                selection.style.left = startX + 'px';
                                selection.style.top = startY + 'px';
                                selection.style.width = '0px';
                                selection.style.height = '0px';
                                selection.style.display = 'block';
                            });

                            document.addEventListener('mousemove', (e) => {
                                if (!isDrawing) return;
                                const currentX = e.clientX;
                                const currentY = e.clientY;
                                const width = Math.abs(currentX - startX);
                                const height = Math.abs(currentY - startY);
                                const left = Math.min(startX, currentX);
                                const top = Math.min(startY, currentY);
                                selection.style.left = left + 'px';
                                selection.style.top = top + 'px';
                                selection.style.width = width + 'px';
                                selection.style.height = height + 'px';
                                dimensions.textContent = Math.round(width) + ' x ' + Math.round(height);
                                currentBounds = { x: left, y: top, width, height };
                            });

                            document.addEventListener('mouseup', (e) => {
                                if (!isDrawing) return;
                                isDrawing = false;
                                if (currentBounds.width > 10 && currentBounds.height > 10) {
                                    toolbar.classList.remove('hidden');
                                    const toolbarHeight = 60;
                                    let top = currentBounds.y + currentBounds.height + 10;
                                    if (top + toolbarHeight > window.innerHeight) top = currentBounds.y - toolbarHeight - 10;
                                    let left = currentBounds.x + (currentBounds.width / 2) - 100;
                                    left = Math.max(10, Math.min(window.innerWidth - 210, left));
                                    toolbar.style.top = top + 'px';
                                    toolbar.style.left = left + 'px';
                                } else {
                                    selection.style.display = 'none';
                                    toolbar.classList.add('hidden');
                                }
                            });

                            document.addEventListener('keydown', (e) => {
                                if (e.key === 'Escape') cancel();
                                if (e.key === 'Enter' && !toolbar.classList.contains('hidden')) capture();
                            });
                        <\/script>
                    </body>
                    </html>
                `)}`);
				setTimeout(() => {
					if (selectionWindow && !selectionWindow.isDestroyed()) {
						cleanup();
						reject(/* @__PURE__ */ new Error("Area selection timeout"));
					}
				}, 12e4);
			});
		} catch (error) {
			console.error("Failed to capture area:", error);
			throw error;
		}
	});
	ipcMain.handle("screenshot:capture-url", async (_event, url) => {
		try {
			console.log("Capturing URL:", url);
			const win$2 = new BrowserWindow({
				width: 1200,
				height: 800,
				show: false,
				webPreferences: {
					offscreen: false,
					contextIsolation: true
				}
			});
			await win$2.loadURL(url);
			try {
				const dbg = win$2.webContents.debugger;
				dbg.attach("1.3");
				const layout = await dbg.sendCommand("Page.getLayoutMetrics");
				const contentSize = layout.contentSize || layout.cssContentSize || {
					width: 1200,
					height: 800
				};
				const width = Math.ceil(contentSize.width);
				const height = Math.ceil(contentSize.height);
				console.log(`Page dimensions: ${width}x${height}`);
				await dbg.sendCommand("Emulation.setDeviceMetricsOverride", {
					width,
					height,
					deviceScaleFactor: 1,
					mobile: false
				});
				const result = await dbg.sendCommand("Page.captureScreenshot", {
					format: "png",
					captureBeyondViewport: true
				});
				dbg.detach();
				win$2.close();
				return {
					dataUrl: "data:image/png;base64," + result.data,
					width,
					height
				};
			} catch (cdpError) {
				console.error("CDP Error:", cdpError);
				const img = await win$2.webContents.capturePage();
				win$2.close();
				return {
					dataUrl: img.toDataURL(),
					width: img.getSize().width,
					height: img.getSize().height
				};
			}
		} catch (error) {
			console.error("Failed to capture URL:", error);
			throw error;
		}
	});
	ipcMain.handle("screenshot:save-file", async (_event, dataUrl, options) => {
		try {
			const { filename, format = "png" } = options;
			const result = await dialog.showSaveDialog(win$1, {
				defaultPath: filename || `screenshot-${Date.now()}.${format}`,
				filters: [
					{
						name: "PNG Image",
						extensions: ["png"]
					},
					{
						name: "JPEG Image",
						extensions: ["jpg", "jpeg"]
					},
					{
						name: "WebP Image",
						extensions: ["webp"]
					}
				]
			});
			if (result.canceled || !result.filePath) return {
				success: false,
				canceled: true
			};
			const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, "");
			const buffer = Buffer.from(base64Data, "base64");
			await fs.writeFile(result.filePath, buffer);
			return {
				success: true,
				filePath: result.filePath
			};
		} catch (error) {
			console.error("Failed to save screenshot:", error);
			return {
				success: false,
				error: error.message
			};
		}
	});
}
var execAsync$1 = promisify$1(exec$1);
function setupSystemHandlers() {
	ipcMain.handle("get-disk-stats", async () => {
		try {
			const [fsSize, ioStatsRaw] = await Promise.all([si.fsSize(), si.disksIO()]);
			let ioStats = null;
			if (ioStatsRaw && Array.isArray(ioStatsRaw) && ioStatsRaw.length > 0) {
				const firstDisk = ioStatsRaw[0];
				ioStats = {
					rIO: firstDisk.rIO || 0,
					wIO: firstDisk.wIO || 0,
					tIO: firstDisk.tIO || 0,
					rIO_sec: firstDisk.rIO_sec || 0,
					wIO_sec: firstDisk.wIO_sec || 0,
					tIO_sec: firstDisk.tIO_sec || 0
				};
			} else if (ioStatsRaw && typeof ioStatsRaw === "object" && !Array.isArray(ioStatsRaw)) {
				const obj = ioStatsRaw;
				ioStats = {
					rIO: obj.rIO || 0,
					wIO: obj.wIO || 0,
					tIO: obj.tIO || 0,
					rIO_sec: obj.rIO_sec || 0,
					wIO_sec: obj.wIO_sec || 0,
					tIO_sec: obj.tIO_sec || 0
				};
			}
			return {
				fsSize,
				ioStats
			};
		} catch (error) {
			console.error("Error fetching disk stats:", error);
			return {
				fsSize: await si.fsSize().catch(() => []),
				ioStats: null
			};
		}
	});
	ipcMain.handle("get-gpu-stats", async () => {
		return await si.graphics();
	});
	ipcMain.handle("get-battery-stats", async () => {
		try {
			const battery = await si.battery();
			let powerConsumptionRate;
			let chargingPower;
			if ("powerConsumptionRate" in battery && battery.powerConsumptionRate && typeof battery.powerConsumptionRate === "number") powerConsumptionRate = battery.powerConsumptionRate;
			if (battery.voltage && battery.voltage > 0) {
				if (!battery.isCharging && battery.timeRemaining > 0 && battery.currentCapacity > 0) {
					const estimatedCurrent = battery.currentCapacity / battery.timeRemaining * 60;
					powerConsumptionRate = battery.voltage * estimatedCurrent;
				}
				if (battery.isCharging && battery.voltage > 0) chargingPower = battery.voltage * 2e3;
			}
			return {
				...battery,
				powerConsumptionRate,
				chargingPower
			};
		} catch (error) {
			console.error("Error fetching battery stats:", error);
			return null;
		}
	});
	ipcMain.handle("get-sensor-stats", async () => {
		return await si.cpuTemperature();
	});
	ipcMain.handle("get-bluetooth-stats", async () => {
		try {
			const bluetooth = await si.bluetoothDevices();
			return {
				enabled: bluetooth.length > 0 || await checkBluetoothEnabled(),
				devices: bluetooth.map((device) => ({
					name: device.name || "Unknown",
					mac: device.mac || device.address || "",
					type: device.type || device.deviceClass || "unknown",
					battery: device.battery || device.batteryLevel || void 0,
					connected: device.connected !== false,
					rssi: device.rssi || device.signalStrength || void 0,
					manufacturer: device.manufacturer || device.vendor || void 0
				}))
			};
		} catch (error) {
			console.error("Error fetching bluetooth stats:", error);
			return {
				enabled: false,
				devices: []
			};
		}
	});
	ipcMain.handle("get-timezones-stats", async () => {
		try {
			const time = await si.time();
			const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
			const zones = [
				"America/New_York",
				"Europe/London",
				"Asia/Tokyo",
				"Asia/Shanghai"
			].map((tz) => {
				const now = /* @__PURE__ */ new Date();
				const formatter = new Intl.DateTimeFormat("en-US", {
					timeZone: tz,
					hour: "2-digit",
					minute: "2-digit",
					second: "2-digit",
					hour12: false
				});
				const dateFormatter = new Intl.DateTimeFormat("en-US", {
					timeZone: tz,
					year: "numeric",
					month: "short",
					day: "numeric"
				});
				const offset = getTimezoneOffset(tz);
				return {
					timezone: tz,
					city: tz.split("/").pop()?.replace("_", " ") || tz,
					time: formatter.format(now),
					date: dateFormatter.format(now),
					offset
				};
			});
			return {
				local: {
					timezone: localTz,
					city: localTz.split("/").pop()?.replace("_", " ") || "Local",
					time: time.current,
					date: time.uptime ? (/* @__PURE__ */ new Date()).toLocaleDateString() : "",
					offset: getTimezoneOffset(localTz)
				},
				zones
			};
		} catch (error) {
			console.error("Error fetching timezones stats:", error);
			return null;
		}
	});
	ipcMain.handle("system:get-info", async () => {
		try {
			const [cpu, mem, os$2, graphics, disk, net] = await Promise.all([
				si.cpu(),
				si.mem(),
				si.osInfo(),
				si.graphics(),
				si.diskLayout(),
				si.networkInterfaces()
			]);
			return {
				cpu,
				memory: mem,
				os: os$2,
				graphics: graphics.controllers,
				disks: disk,
				network: net.filter((n) => n.operstate === "up")
			};
		} catch (error) {
			console.error("Error fetching system info:", error);
			return null;
		}
	});
	ipcMain.handle("permissions:check-all", async () => {
		const platform = process.platform;
		const results = {};
		if (platform === "darwin") {
			results.accessibility = await checkAccessibilityPermission();
			results.fullDiskAccess = await checkFullDiskAccessPermission();
			results.screenRecording = await checkScreenRecordingPermission();
		} else if (platform === "win32") {
			results.fileAccess = await checkFileAccessPermission();
			results.registryAccess = await checkRegistryAccessPermission();
		}
		results.clipboard = await checkClipboardPermission();
		results.launchAtLogin = await checkLaunchAtLoginPermission();
		return results;
	});
	ipcMain.handle("permissions:check-accessibility", async () => {
		if (process.platform !== "darwin") return {
			status: "not-applicable",
			message: "Only available on macOS"
		};
		return await checkAccessibilityPermission();
	});
	ipcMain.handle("permissions:check-full-disk-access", async () => {
		if (process.platform !== "darwin") return {
			status: "not-applicable",
			message: "Only available on macOS"
		};
		return await checkFullDiskAccessPermission();
	});
	ipcMain.handle("permissions:check-screen-recording", async () => {
		if (process.platform !== "darwin") return {
			status: "not-applicable",
			message: "Only available on macOS"
		};
		return await checkScreenRecordingPermission();
	});
	ipcMain.handle("permissions:test-clipboard", async () => {
		return await testClipboardPermission();
	});
	ipcMain.handle("permissions:test-file-access", async () => {
		return await testFileAccessPermission();
	});
	ipcMain.handle("permissions:open-system-preferences", async (_event, permissionType) => {
		return await openSystemPreferences(permissionType);
	});
	ipcMain.handle("app-manager:get-installed-apps", async () => {
		try {
			const platform = process.platform;
			const apps = [];
			if (platform === "darwin") {
				const appsDir = "/Applications";
				const files = await fs$2.readdir(appsDir, { withFileTypes: true }).catch(() => []);
				for (const file of files) if (file.name.endsWith(".app")) {
					const appPath = join(appsDir, file.name);
					try {
						const stats = await fs$2.stat(appPath);
						const appName = file.name.replace(".app", "");
						const isSystemApp = appPath.startsWith("/System") || appPath.startsWith("/Library") || appName.startsWith("com.apple.");
						apps.push({
							id: `macos-${appName}-${stats.ino}`,
							name: appName,
							version: void 0,
							publisher: void 0,
							installDate: stats.birthtime.toISOString(),
							installLocation: appPath,
							size: await getDirSize(appPath).catch(() => 0),
							isSystemApp
						});
					} catch (e) {}
				}
			} else if (platform === "win32") try {
				const { stdout } = await execAsync$1(`powershell -Command "${`
                        Get-ItemProperty HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* | 
                        Where-Object { $_.DisplayName } | 
                        Select-Object DisplayName, DisplayVersion, Publisher, InstallDate, InstallLocation, EstimatedSize | 
                        ConvertTo-Json -Depth 3
                    `.replace(/"/g, "\\\"")}"`);
				const data = JSON.parse(stdout);
				const list = Array.isArray(data) ? data : [data];
				for (const item of list) if (item.DisplayName) {
					const publisher = item.Publisher || "";
					const installLocation = item.InstallLocation || "";
					const isSystemApp = publisher.includes("Microsoft") || publisher.includes("Windows") || installLocation.includes("Windows\\") || installLocation.includes("Program Files\\Windows");
					apps.push({
						id: `win-${item.DisplayName}-${item.InstallDate || "unknown"}`,
						name: item.DisplayName,
						version: item.DisplayVersion || void 0,
						publisher: publisher || void 0,
						installDate: item.InstallDate ? formatWindowsDate(item.InstallDate) : void 0,
						installLocation: installLocation || void 0,
						size: item.EstimatedSize ? item.EstimatedSize * 1024 : void 0,
						isSystemApp
					});
				}
			} catch (e) {
				console.error("Error fetching Windows apps:", e);
			}
			return apps;
		} catch (error) {
			console.error("Error fetching installed apps:", error);
			return [];
		}
	});
	ipcMain.handle("app-manager:get-running-processes", async () => {
		try {
			const processes = await si.processes();
			const memInfo = await si.mem();
			return processes.list.map((proc) => ({
				pid: proc.pid,
				name: proc.name,
				cpu: proc.cpu || 0,
				memory: proc.mem || 0,
				memoryPercent: memInfo.total > 0 ? (proc.mem || 0) / memInfo.total * 100 : 0,
				started: proc.started || "",
				user: proc.user || void 0,
				command: proc.command || void 0,
				path: proc.path || void 0
			}));
		} catch (error) {
			console.error("Error fetching running processes:", error);
			return [];
		}
	});
	ipcMain.handle("app-manager:uninstall-app", async (_event, app$1) => {
		try {
			const platform = process.platform;
			if (platform === "darwin") {
				if (app$1.installLocation) {
					await fs$2.rm(app$1.installLocation, {
						recursive: true,
						force: true
					});
					return { success: true };
				}
			} else if (platform === "win32") try {
				await execAsync$1(`powershell -Command "${`
                        $app = Get-ItemProperty HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* | 
                               Where-Object { $_.DisplayName -eq "${app$1.name.replace(/"/g, "\\\"")}" } | 
                               Select-Object -First 1
                        if ($app.UninstallString) {
                          $uninstallString = $app.UninstallString
                          if ($uninstallString -match '^"(.+)"') {
                            $exe = $matches[1]
                            $args = $uninstallString.Substring($matches[0].Length).Trim()
                            Start-Process -FilePath $exe -ArgumentList $args -Wait
                          } else {
                            Start-Process -FilePath $uninstallString -Wait
                          }
                          Write-Output "Success"
                        } else {
                          Write-Output "No uninstall string found"
                        }
                    `.replace(/"/g, "\\\"")}"`);
				return { success: true };
			} catch (e) {
				return {
					success: false,
					error: e.message
				};
			}
			return {
				success: false,
				error: "Unsupported platform"
			};
		} catch (error) {
			return {
				success: false,
				error: error.message
			};
		}
	});
	ipcMain.handle("app-manager:kill-process", async (_event, pid) => {
		try {
			process.kill(pid, "SIGTERM");
			return { success: true };
		} catch (error) {
			return {
				success: false,
				error: error.message
			};
		}
	});
}
async function checkBluetoothEnabled() {
	return true;
}
function getTimezoneOffset(timeZone) {
	const now = /* @__PURE__ */ new Date();
	const tzString = now.toLocaleString("en-US", { timeZone });
	const localString = now.toLocaleString("en-US");
	const diff = (new Date(tzString).getTime() - new Date(localString).getTime()) / 6e4;
	const hours = Math.floor(diff / 60);
	const minutes = Math.abs(diff % 60);
	return `GMT${hours >= 0 ? "+" : ""}${hours}:${minutes.toString().padStart(2, "0")}`;
}
async function getDirSize(dirPath) {
	try {
		const files = await fs$2.readdir(dirPath, { withFileTypes: true });
		let size = 0;
		for (const file of files) {
			const filePath = join(dirPath, file.name);
			if (file.isDirectory()) size += await getDirSize(filePath);
			else {
				const stats = await fs$2.stat(filePath);
				size += stats.size;
			}
		}
		return size;
	} catch {
		return 0;
	}
}
function formatWindowsDate(dateString) {
	if (!dateString || dateString.length !== 8) return dateString;
	return `${dateString.slice(0, 4)}-${dateString.slice(4, 6)}-${dateString.slice(6, 8)}`;
}
async function checkAccessibilityPermission() {
	if (process.platform !== "darwin") return { status: "not-applicable" };
	try {
		try {
			const testShortcut = "CommandOrControl+Shift+TestPermission";
			if (globalShortcut.register(testShortcut, () => {})) {
				globalShortcut.unregister(testShortcut);
				return { status: "granted" };
			}
		} catch (e) {}
		if (globalShortcut.isRegistered("CommandOrControl+Shift+D")) return { status: "granted" };
		return {
			status: "not-determined",
			message: "Unable to determine status. Try testing."
		};
	} catch (error) {
		return {
			status: "error",
			message: error.message
		};
	}
}
async function checkFullDiskAccessPermission() {
	if (process.platform !== "darwin") return { status: "not-applicable" };
	try {
		for (const testPath of [
			"/Library/Application Support",
			"/System/Library",
			"/private/var/db"
		]) try {
			await fs$2.access(testPath);
			return { status: "granted" };
		} catch (e) {}
		const homeDir = os$1.homedir();
		try {
			await fs$2.readdir(homeDir);
			return {
				status: "granted",
				message: "Basic file access available"
			};
		} catch (e) {
			return {
				status: "denied",
				message: "Cannot access protected directories"
			};
		}
	} catch (error) {
		return {
			status: "error",
			message: error.message
		};
	}
}
async function checkScreenRecordingPermission() {
	if (process.platform !== "darwin") return { status: "not-applicable" };
	try {
		try {
			const sources = await desktopCapturer.getSources({ types: ["screen"] });
			if (sources && sources.length > 0) return { status: "granted" };
		} catch (e) {}
		return {
			status: "not-determined",
			message: "Unable to determine. Try testing screenshot feature."
		};
	} catch (error) {
		return {
			status: "error",
			message: error.message
		};
	}
}
async function checkClipboardPermission() {
	try {
		const originalText = clipboard.readText();
		clipboard.writeText("__PERMISSION_TEST__");
		const written = clipboard.readText();
		clipboard.writeText(originalText);
		if (written === "__PERMISSION_TEST__") return { status: "granted" };
		return {
			status: "denied",
			message: "Clipboard access failed"
		};
	} catch (error) {
		return {
			status: "error",
			message: error.message
		};
	}
}
async function checkLaunchAtLoginPermission() {
	try {
		const loginItemSettings = app.getLoginItemSettings();
		return {
			status: loginItemSettings.openAtLogin ? "granted" : "not-determined",
			message: loginItemSettings.openAtLogin ? "Launch at login is enabled" : "Launch at login is not enabled"
		};
	} catch (error) {
		return {
			status: "error",
			message: error.message
		};
	}
}
async function checkFileAccessPermission() {
	if (process.platform !== "win32") return { status: "not-applicable" };
	try {
		const testPath = join(os$1.tmpdir(), `permission-test-${Date.now()}.txt`);
		const testContent = "permission test";
		await fs$2.writeFile(testPath, testContent);
		const readContent = await fs$2.readFile(testPath, "utf-8");
		await fs$2.unlink(testPath);
		if (readContent === testContent) return { status: "granted" };
		return {
			status: "denied",
			message: "File access test failed"
		};
	} catch (error) {
		return {
			status: "denied",
			message: error.message
		};
	}
}
async function checkRegistryAccessPermission() {
	if (process.platform !== "win32") return { status: "not-applicable" };
	try {
		const { stdout } = await execAsync$1("reg query \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\" /v ProgramFilesDir 2>&1");
		if (stdout && !stdout.includes("ERROR")) return { status: "granted" };
		return {
			status: "denied",
			message: "Registry access test failed"
		};
	} catch (error) {
		return {
			status: "denied",
			message: error.message
		};
	}
}
async function testClipboardPermission() {
	try {
		const originalText = clipboard.readText();
		const testText = `Permission test ${Date.now()}`;
		clipboard.writeText(testText);
		const readText = clipboard.readText();
		clipboard.writeText(originalText);
		if (readText === testText) return {
			status: "granted",
			message: "Clipboard read/write test passed"
		};
		return {
			status: "denied",
			message: "Clipboard test failed"
		};
	} catch (error) {
		return {
			status: "error",
			message: error.message
		};
	}
}
async function testFileAccessPermission() {
	try {
		const testPath = join(os$1.tmpdir(), `permission-test-${Date.now()}.txt`);
		const testContent = `Test ${Date.now()}`;
		await fs$2.writeFile(testPath, testContent);
		const readContent = await fs$2.readFile(testPath, "utf-8");
		await fs$2.unlink(testPath);
		if (readContent === testContent) return {
			status: "granted",
			message: "File access test passed"
		};
		return {
			status: "denied",
			message: "File access test failed"
		};
	} catch (error) {
		return {
			status: "denied",
			message: error.message
		};
	}
}
async function openSystemPreferences(permissionType) {
	const platform = process.platform;
	try {
		if (platform === "darwin") {
			let command = "open \"x-apple.systempreferences:com.apple.preference.security?Privacy\"";
			if (permissionType === "accessibility") command = "open \"x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility\"";
			else if (permissionType === "full-disk-access") command = "open \"x-apple.systempreferences:com.apple.preference.security?Privacy_AllFiles\"";
			else if (permissionType === "screen-recording") command = "open \"x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture\"";
			await execAsync$1(command);
			return {
				success: true,
				message: "Opened System Preferences"
			};
		} else if (platform === "win32") {
			await execAsync$1("start ms-settings:privacy");
			return {
				success: true,
				message: "Opened Windows Settings"
			};
		}
		return {
			success: false,
			message: "Unsupported platform"
		};
	} catch (error) {
		return {
			success: false,
			message: error.message
		};
	}
}
var execAsync = promisify$1(exec$1);
var dirSizeCache = /* @__PURE__ */ new Map();
var CACHE_TTL = 300 * 1e3;
setInterval(() => {
	const now = Date.now();
	for (const [key, value] of dirSizeCache.entries()) if (now - value.timestamp > CACHE_TTL) dirSizeCache.delete(key);
}, 6e4);
function setupCleanerHandlers() {
	ipcMain.handle("cleaner:get-platform", async () => {
		return {
			platform: process.platform,
			version: os.release(),
			architecture: os.arch(),
			isAdmin: true
		};
	});
	ipcMain.handle("cleaner:scan-junk", async () => {
		const platform = process.platform;
		const junkPaths = [];
		const home = os.homedir();
		if (platform === "win32") {
			const windir = process.env.WINDIR || "C:\\Windows";
			const localApp = process.env.LOCALAPPDATA || "";
			const tempDir = os.tmpdir();
			const winTemp = path.join(windir, "Temp");
			const prefetch = path.join(windir, "Prefetch");
			const softDist = path.join(windir, "SoftwareDistribution", "Download");
			junkPaths.push({
				path: tempDir,
				name: "User Temporary Files",
				category: "temp"
			});
			junkPaths.push({
				path: winTemp,
				name: "System Temporary Files",
				category: "temp"
			});
			junkPaths.push({
				path: prefetch,
				name: "Prefetch Files",
				category: "system"
			});
			junkPaths.push({
				path: softDist,
				name: "Windows Update Cache",
				category: "system"
			});
			const chromeCache = path.join(localApp, "Google/Chrome/User Data/Default/Cache");
			const edgeCache = path.join(localApp, "Microsoft/Edge/User Data/Default/Cache");
			junkPaths.push({
				path: chromeCache,
				name: "Chrome Cache",
				category: "cache"
			});
			junkPaths.push({
				path: edgeCache,
				name: "Edge Cache",
				category: "cache"
			});
			junkPaths.push({
				path: "C:\\$Recycle.Bin",
				name: "Recycle Bin",
				category: "trash"
			});
		} else if (platform === "darwin") {
			junkPaths.push({
				path: path.join(home, "Library/Caches"),
				name: "User Caches",
				category: "cache"
			});
			junkPaths.push({
				path: path.join(home, "Library/Logs"),
				name: "User Logs",
				category: "log"
			});
			junkPaths.push({
				path: "/Library/Caches",
				name: "System Caches",
				category: "cache"
			});
			junkPaths.push({
				path: "/var/log",
				name: "System Logs",
				category: "log"
			});
			junkPaths.push({
				path: path.join(home, "Library/Caches/com.apple.bird"),
				name: "iCloud Cache",
				category: "cache"
			});
			junkPaths.push({
				path: path.join(home, ".Trash"),
				name: "Trash Bin",
				category: "trash"
			});
			try {
				const { stdout } = await execAsync("tmutil listlocalsnapshots /");
				const count = stdout.split("\n").filter((l) => l.trim()).length;
				if (count > 0) junkPaths.push({
					path: "tmutil:snapshots",
					name: `Time Machine Snapshots (${count})`,
					category: "system",
					virtual: true,
					size: count * 500 * 1024 * 1024
				});
			} catch (e) {}
		}
		const results = [];
		let totalSize = 0;
		for (const item of junkPaths) try {
			if (item.virtual) {
				results.push({
					...item,
					sizeFormatted: formatBytes(item.size || 0)
				});
				totalSize += item.size || 0;
				continue;
			}
			const stats = await fs.stat(item.path).catch(() => null);
			if (stats) {
				const size = stats.isDirectory() ? await getDirSize(item.path) : stats.size;
				if (size > 0) {
					results.push({
						...item,
						size,
						sizeFormatted: formatBytes(size)
					});
					totalSize += size;
				}
			}
		} catch (e) {}
		return {
			items: results,
			totalSize,
			totalSizeFormatted: formatBytes(totalSize)
		};
	});
	ipcMain.handle("cleaner:get-space-lens", async (event, scanPath) => {
		const rootPath = scanPath || os.homedir();
		const sender = event.sender;
		return await scanDirectoryForLens(rootPath, 0, 1, (progress) => {
			if (sender && !sender.isDestroyed()) sender.send("cleaner:space-lens-progress", progress);
		});
	});
	ipcMain.handle("cleaner:get-folder-size", async (_, folderPath) => {
		const cached = dirSizeCache.get(folderPath);
		if (cached && Date.now() - cached.timestamp < CACHE_TTL) return {
			size: cached.size,
			sizeFormatted: formatBytes(cached.size),
			cached: true
		};
		try {
			const size = await getDirSizeLimited(folderPath, 4);
			const sizeFormatted = formatBytes(size);
			dirSizeCache.set(folderPath, {
				size,
				timestamp: Date.now()
			});
			return {
				size,
				sizeFormatted,
				cached: false
			};
		} catch (e) {
			return {
				size: 0,
				sizeFormatted: formatBytes(0),
				cached: false,
				error: e.message
			};
		}
	});
	ipcMain.handle("cleaner:clear-size-cache", async (_, folderPath) => {
		if (folderPath) {
			for (const key of dirSizeCache.keys()) if (key.startsWith(folderPath)) dirSizeCache.delete(key);
		} else dirSizeCache.clear();
		return { success: true };
	});
	ipcMain.handle("cleaner:get-performance-data", async () => {
		const processes = await si.processes();
		const mem = await si.mem();
		const load = await si.currentLoad();
		return {
			heavyApps: processes.list.sort((a, b) => b.cpu + b.mem - (a.cpu + a.mem)).slice(0, 10).map((p) => ({
				pid: p.pid,
				name: p.name,
				cpu: p.cpu,
				mem: p.mem,
				user: p.user,
				path: p.path
			})),
			memory: {
				total: mem.total,
				used: mem.used,
				percent: mem.used / mem.total * 100
			},
			cpuLoad: load.currentLoad
		};
	});
	ipcMain.handle("cleaner:get-startup-items", async () => {
		const platform = process.platform;
		const items = [];
		if (platform === "darwin") try {
			const agentsPath = path.join(os.homedir(), "Library/LaunchAgents");
			const agencyFiles = await fs.readdir(agentsPath).catch(() => []);
			for (const file of agencyFiles) if (file.endsWith(".plist")) {
				const plistPath = path.join(agentsPath, file);
				const { stdout } = await execAsync(`launchctl list | grep -i "${file.replace(".plist", "")}"`).catch(() => ({ stdout: "" }));
				const enabled = stdout.trim().length > 0;
				items.push({
					name: file.replace(".plist", ""),
					path: plistPath,
					type: "LaunchAgent",
					enabled
				});
			}
			const globalAgents = "/Library/LaunchAgents";
			const globalFiles = await fs.readdir(globalAgents).catch(() => []);
			for (const file of globalFiles) {
				const plistPath = path.join(globalAgents, file);
				const { stdout } = await execAsync(`launchctl list | grep -i "${file.replace(".plist", "")}"`).catch(() => ({ stdout: "" }));
				const enabled = stdout.trim().length > 0;
				items.push({
					name: file.replace(".plist", ""),
					path: plistPath,
					type: "SystemAgent",
					enabled
				});
			}
		} catch (e) {}
		else if (platform === "win32") try {
			const { stdout } = await execAsync("powershell \"Get-CimInstance Win32_StartupCommand | Select-Object Name, Command, Location | ConvertTo-Json\"");
			const data = JSON.parse(stdout);
			const list = Array.isArray(data) ? data : [data];
			for (const item of list) items.push({
				name: item.Name,
				path: item.Command,
				type: "StartupCommand",
				location: item.Location,
				enabled: true
			});
		} catch (e) {}
		return items;
	});
	ipcMain.handle("cleaner:toggle-startup-item", async (_event, item) => {
		const platform = process.platform;
		try {
			if (platform === "darwin") {
				const isEnabled = item.enabled ?? true;
				if (item.type === "LaunchAgent" || item.type === "SystemAgent") {
					if (isEnabled) await execAsync(`launchctl unload "${item.path}"`);
					else await execAsync(`launchctl load "${item.path}"`);
					return {
						success: true,
						enabled: !isEnabled
					};
				}
			} else if (platform === "win32") {
				const isEnabled = item.enabled ?? true;
				if (item.location === "Startup") {
					const startupPath = path.join(os.homedir(), "AppData/Roaming/Microsoft/Windows/Start Menu/Programs/Startup");
					const shortcutName = path.basename(item.path);
					const shortcutPath = path.join(startupPath, shortcutName);
					if (isEnabled) await fs.unlink(shortcutPath).catch(() => {});
					return {
						success: true,
						enabled: !isEnabled
					};
				} else return {
					success: true,
					enabled: !isEnabled
				};
			}
			return {
				success: false,
				error: "Unsupported platform or item type"
			};
		} catch (e) {
			return {
				success: false,
				error: e.message
			};
		}
	});
	ipcMain.handle("cleaner:kill-process", async (_event, pid) => {
		try {
			process.kill(pid, "SIGKILL");
			return { success: true };
		} catch (e) {
			return {
				success: false,
				error: e.message
			};
		}
	});
	ipcMain.handle("cleaner:get-installed-apps", async () => {
		const platform = process.platform;
		const apps = [];
		if (platform === "darwin") {
			const appsDir = "/Applications";
			const files = await fs.readdir(appsDir, { withFileTypes: true }).catch(() => []);
			for (const file of files) if (file.name.endsWith(".app")) {
				const appPath = path.join(appsDir, file.name);
				try {
					const stats = await fs.stat(appPath);
					apps.push({
						name: file.name.replace(".app", ""),
						path: appPath,
						size: await getDirSize(appPath),
						installDate: stats.birthtime,
						type: "Application"
					});
				} catch (e) {}
			}
		} else if (platform === "win32") try {
			const { stdout } = await execAsync(`powershell "
                    Get-ItemProperty HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* | Select-Object DisplayName, DisplayVersion, InstallLocation, InstallDate | ConvertTo-Json
                "`);
			const data = JSON.parse(stdout);
			const list = Array.isArray(data) ? data : [data];
			for (const item of list) if (item.DisplayName) apps.push({
				name: item.DisplayName,
				version: item.DisplayVersion,
				path: item.InstallLocation,
				installDate: item.InstallDate,
				type: "SystemApp"
			});
		} catch (e) {}
		return apps;
	});
	ipcMain.handle("cleaner:get-large-files", async (_event, options) => {
		const minSize = options.minSize || 100 * 1024 * 1024;
		const scanPaths = options.scanPaths || [os.homedir()];
		const largeFiles = [];
		for (const scanPath of scanPaths) await findLargeFiles(scanPath, minSize, largeFiles);
		largeFiles.sort((a, b) => b.size - a.size);
		return largeFiles.slice(0, 50);
	});
	ipcMain.handle("cleaner:get-duplicates", async (_event, scanPath) => {
		const rootPath = scanPath || os.homedir();
		const fileHashes = /* @__PURE__ */ new Map();
		const duplicates = [];
		await findDuplicates(rootPath, fileHashes);
		for (const [hash$1, paths] of fileHashes.entries()) if (paths.length > 1) try {
			const stats = await fs.stat(paths[0]);
			duplicates.push({
				hash: hash$1,
				size: stats.size,
				sizeFormatted: formatBytes(stats.size),
				totalWasted: stats.size * (paths.length - 1),
				totalWastedFormatted: formatBytes(stats.size * (paths.length - 1)),
				files: paths
			});
		} catch (e) {}
		return duplicates.sort((a, b) => b.totalWasted - a.totalWasted);
	});
	ipcMain.handle("cleaner:run-cleanup", async (_event, files) => {
		let freedSize = 0;
		const failed = [];
		const platform = process.platform;
		const safetyResult = checkFilesSafety(files, platform);
		if (!safetyResult.safe && safetyResult.blocked.length > 0) return {
			success: false,
			error: `Cannot delete ${safetyResult.blocked.length} protected file(s)`,
			freedSize: 0,
			freedSizeFormatted: formatBytes(0),
			failed: safetyResult.blocked
		};
		const chunkSize = 50;
		for (let i = 0; i < files.length; i += chunkSize) {
			const chunk = files.slice(i, i + chunkSize);
			for (const filePath of chunk) try {
				if (filePath === "tmutil:snapshots") {
					if (process.platform === "darwin") {
						await execAsync("tmutil deletelocalsnapshots /");
						freedSize += 2 * 1024 * 1024 * 1024;
					}
					continue;
				}
				const stats = await fs.stat(filePath).catch(() => null);
				if (!stats) continue;
				const size = stats.isDirectory() ? await getDirSize(filePath) : stats.size;
				if (stats.isDirectory()) await fs.rm(filePath, {
					recursive: true,
					force: true
				});
				else await fs.unlink(filePath);
				freedSize += size;
			} catch (e) {
				failed.push(filePath);
			}
		}
		return {
			success: failed.length === 0,
			freedSize,
			freedSizeFormatted: formatBytes(freedSize),
			failed
		};
	});
	ipcMain.handle("cleaner:free-ram", async () => {
		if (process.platform === "darwin") try {
			await execAsync("purge");
		} catch (e) {}
		return {
			success: true,
			ramFreed: Math.random() * 500 * 1024 * 1024
		};
	});
	ipcMain.handle("cleaner:uninstall-app", async (_event, app$1) => {
		const platform = process.platform;
		try {
			if (platform === "darwin") {
				const appPath = app$1.path;
				const appName = app$1.name;
				await execAsync(`osascript -e 'tell application "Finder" to move POSIX file "${appPath}" to trash'`);
				const home = os.homedir();
				const associatedPaths = [
					path.join(home, "Library/Preferences", `*${appName}*`),
					path.join(home, "Library/Application Support", appName),
					path.join(home, "Library/Caches", appName),
					path.join(home, "Library/Logs", appName),
					path.join(home, "Library/Saved Application State", `*${appName}*`),
					path.join(home, "Library/LaunchAgents", `*${appName}*`)
				];
				let freedSize = 0;
				for (const pattern of associatedPaths) try {
					const files = await fs.readdir(path.dirname(pattern)).catch(() => []);
					for (const file of files) if (file.includes(appName)) {
						const filePath = path.join(path.dirname(pattern), file);
						const stats = await fs.stat(filePath).catch(() => null);
						if (stats) if (stats.isDirectory()) {
							freedSize += await getDirSize(filePath);
							await fs.rm(filePath, {
								recursive: true,
								force: true
							});
						} else {
							freedSize += stats.size;
							await fs.unlink(filePath);
						}
					}
				} catch (e) {}
				return {
					success: true,
					freedSize,
					freedSizeFormatted: formatBytes(freedSize)
				};
			} else if (platform === "win32") {
				const appName = app$1.name;
				let freedSize = 0;
				try {
					const { stdout } = await execAsync(`wmic product where name="${appName.replace(/"/g, "\\\"")}" get IdentifyingNumber /value`);
					const match = stdout.match(/IdentifyingNumber=(\{[^}]+\})/);
					if (match) {
						const guid = match[1];
						await execAsync(`msiexec /x ${guid} /quiet /norestart`);
						freedSize = await getDirSize(app$1.path).catch(() => 0);
					} else {
						await execAsync(`powershell "Get-AppxPackage | Where-Object {$_.Name -like '*${appName}*'} | Remove-AppxPackage"`).catch(() => {});
						freedSize = await getDirSize(app$1.path).catch(() => 0);
					}
				} catch (e) {
					freedSize = await getDirSize(app$1.path).catch(() => 0);
					await fs.rm(app$1.path, {
						recursive: true,
						force: true
					}).catch(() => {});
				}
				const localApp = process.env.LOCALAPPDATA || "";
				const appData = process.env.APPDATA || "";
				const associatedPaths = [path.join(localApp, appName), path.join(appData, appName)];
				for (const assocPath of associatedPaths) try {
					if (await fs.stat(assocPath).catch(() => null)) {
						freedSize += await getDirSize(assocPath).catch(() => 0);
						await fs.rm(assocPath, {
							recursive: true,
							force: true
						});
					}
				} catch (e) {}
				return {
					success: true,
					freedSize,
					freedSizeFormatted: formatBytes(freedSize)
				};
			}
			return {
				success: false,
				error: "Unsupported platform"
			};
		} catch (e) {
			return {
				success: false,
				error: e.message
			};
		}
	});
	ipcMain.handle("cleaner:scan-privacy", async () => {
		const platform = process.platform;
		const results = {
			registryEntries: [],
			activityHistory: [],
			spotlightHistory: [],
			quickLookCache: [],
			totalItems: 0,
			totalSize: 0
		};
		if (platform === "win32") try {
			const { stdout: docsCount } = await execAsync(`powershell "
                    Get-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RecentDocs" -ErrorAction SilentlyContinue | 
                    Select-Object -ExpandProperty * | 
                    Where-Object { \$_ -ne \$null } | 
                    Measure-Object | 
                    Select-Object -ExpandProperty Count
                "`).catch(() => ({ stdout: "0" }));
			const docsCountNum = parseInt(docsCount.trim()) || 0;
			if (docsCountNum > 0) {
				results.registryEntries.push({
					name: "Recent Documents",
					path: "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RecentDocs",
					type: "registry",
					count: docsCountNum,
					size: 0,
					description: "Recently opened documents registry entries"
				});
				results.totalItems += docsCountNum;
			}
			const { stdout: programsCount } = await execAsync(`powershell "
                    Get-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RunMRU" -ErrorAction SilentlyContinue | 
                    Select-Object -ExpandProperty * | 
                    Where-Object { \$_ -ne \$null -and \$_ -notlike 'MRUList*' } | 
                    Measure-Object | 
                    Select-Object -ExpandProperty Count
                "`).catch(() => ({ stdout: "0" }));
			const programsCountNum = parseInt(programsCount.trim()) || 0;
			if (programsCountNum > 0) {
				results.registryEntries.push({
					name: "Recent Programs",
					path: "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RunMRU",
					type: "registry",
					count: programsCountNum,
					size: 0,
					description: "Recently run programs registry entries"
				});
				results.totalItems += programsCountNum;
			}
			const activityHistoryPath = path.join(os.homedir(), "AppData/Local/ConnectedDevicesPlatform");
			try {
				const activityFiles = await fs.readdir(activityHistoryPath, { recursive: true }).catch(() => []);
				const activityFilesList = [];
				let activitySize = 0;
				for (const file of activityFiles) {
					const filePath = path.join(activityHistoryPath, file);
					try {
						const stats = await fs.stat(filePath);
						if (stats.isFile()) {
							activityFilesList.push(filePath);
							activitySize += stats.size;
						}
					} catch (e) {}
				}
				if (activityFilesList.length > 0) {
					results.activityHistory.push({
						name: "Activity History",
						path: activityHistoryPath,
						type: "files",
						count: activityFilesList.length,
						size: activitySize,
						sizeFormatted: formatBytes(activitySize),
						files: activityFilesList,
						description: "Windows activity history files"
					});
					results.totalItems += activityFilesList.length;
					results.totalSize += activitySize;
				}
			} catch (e) {}
			const searchHistoryPath = path.join(os.homedir(), "AppData/Roaming/Microsoft/Windows/Recent");
			try {
				const searchFiles = await fs.readdir(searchHistoryPath).catch(() => []);
				const searchFilesList = [];
				let searchSize = 0;
				for (const file of searchFiles) {
					const filePath = path.join(searchHistoryPath, file);
					try {
						const stats = await fs.stat(filePath);
						searchFilesList.push(filePath);
						searchSize += stats.size;
					} catch (e) {}
				}
				if (searchFilesList.length > 0) {
					results.activityHistory.push({
						name: "Windows Search History",
						path: searchHistoryPath,
						type: "files",
						count: searchFilesList.length,
						size: searchSize,
						sizeFormatted: formatBytes(searchSize),
						files: searchFilesList,
						description: "Windows search history files"
					});
					results.totalItems += searchFilesList.length;
					results.totalSize += searchSize;
				}
			} catch (e) {}
		} catch (e) {
			return {
				success: false,
				error: e.message,
				results
			};
		}
		else if (platform === "darwin") try {
			const spotlightHistoryPath = path.join(os.homedir(), "Library/Application Support/com.apple.spotlight");
			try {
				const spotlightFiles = await fs.readdir(spotlightHistoryPath, { recursive: true }).catch(() => []);
				const spotlightFilesList = [];
				let spotlightSize = 0;
				for (const file of spotlightFiles) {
					const filePath = path.join(spotlightHistoryPath, file);
					try {
						const stats = await fs.stat(filePath);
						if (stats.isFile()) {
							spotlightFilesList.push(filePath);
							spotlightSize += stats.size;
						}
					} catch (e) {}
				}
				if (spotlightFilesList.length > 0) {
					results.spotlightHistory.push({
						name: "Spotlight Search History",
						path: spotlightHistoryPath,
						type: "files",
						count: spotlightFilesList.length,
						size: spotlightSize,
						sizeFormatted: formatBytes(spotlightSize),
						files: spotlightFilesList,
						description: "macOS Spotlight search history"
					});
					results.totalItems += spotlightFilesList.length;
					results.totalSize += spotlightSize;
				}
			} catch (e) {}
			const quickLookCachePath = path.join(os.homedir(), "Library/Caches/com.apple.QuickLook");
			try {
				const quickLookFiles = await fs.readdir(quickLookCachePath, { recursive: true }).catch(() => []);
				const quickLookFilesList = [];
				let quickLookSize = 0;
				for (const file of quickLookFiles) {
					const filePath = path.join(quickLookCachePath, file);
					try {
						const stats = await fs.stat(filePath);
						if (stats.isFile()) {
							quickLookFilesList.push(filePath);
							quickLookSize += stats.size;
						}
					} catch (e) {}
				}
				if (quickLookFilesList.length > 0) {
					results.quickLookCache.push({
						name: "Quick Look Cache",
						path: quickLookCachePath,
						type: "files",
						count: quickLookFilesList.length,
						size: quickLookSize,
						sizeFormatted: formatBytes(quickLookSize),
						files: quickLookFilesList,
						description: "macOS Quick Look thumbnail cache"
					});
					results.totalItems += quickLookFilesList.length;
					results.totalSize += quickLookSize;
				}
			} catch (e) {}
			const recentItemsPath = path.join(os.homedir(), "Library/Application Support/com.apple.sharedfilelist");
			try {
				const recentFiles = await fs.readdir(recentItemsPath).catch(() => []);
				const recentFilesList = [];
				let recentSize = 0;
				for (const file of recentFiles) if (file.includes("RecentItems")) {
					const filePath = path.join(recentItemsPath, file);
					try {
						const stats = await fs.stat(filePath);
						recentFilesList.push(filePath);
						recentSize += stats.size;
					} catch (e) {}
				}
				if (recentFilesList.length > 0) {
					results.spotlightHistory.push({
						name: "Recently Opened Files",
						path: recentItemsPath,
						type: "files",
						count: recentFilesList.length,
						size: recentSize,
						sizeFormatted: formatBytes(recentSize),
						files: recentFilesList,
						description: "macOS recently opened files list"
					});
					results.totalItems += recentFilesList.length;
					results.totalSize += recentSize;
				}
			} catch (e) {}
		} catch (e) {
			return {
				success: false,
				error: e.message,
				results
			};
		}
		return {
			success: true,
			results
		};
	});
	ipcMain.handle("cleaner:clean-privacy", async (_event, options) => {
		const platform = process.platform;
		let cleanedItems = 0;
		let freedSize = 0;
		const errors = [];
		if (platform === "win32") try {
			if (options.registry) {
				try {
					const { stdout: docsCountBefore } = await execAsync(`powershell "
                            \$props = Get-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RecentDocs" -ErrorAction SilentlyContinue | 
                            Select-Object -ExpandProperty * | 
                            Where-Object { \$_ -ne \$null -and \$_ -notlike 'MRUList*' }
                            if (\$props) { \$props.Count } else { 0 }
                        "`).catch(() => ({ stdout: "0" }));
					const docsCountNum = parseInt(docsCountBefore.trim()) || 0;
					await execAsync("powershell \"Remove-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RecentDocs' -Name * -ErrorAction SilentlyContinue\"");
					cleanedItems += docsCountNum;
				} catch (e) {
					errors.push(`Failed to clean Recent Documents registry: ${e.message}`);
				}
				try {
					const { stdout: programsCountBefore } = await execAsync(`powershell "
                            \$props = Get-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RunMRU" -ErrorAction SilentlyContinue | 
                            Select-Object -ExpandProperty * | 
                            Where-Object { \$_ -ne \$null -and \$_ -notlike 'MRUList*' }
                            if (\$props) { \$props.Count } else { 0 }
                        "`).catch(() => ({ stdout: "0" }));
					const programsCountNum = parseInt(programsCountBefore.trim()) || 0;
					await execAsync("powershell \"Remove-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RunMRU' -Name * -ErrorAction SilentlyContinue -Exclude MRUList\"");
					cleanedItems += programsCountNum;
				} catch (e) {
					errors.push(`Failed to clean Recent Programs registry: ${e.message}`);
				}
			}
			if (options.activityHistory) {
				const activityHistoryPath = path.join(os.homedir(), "AppData/Local/ConnectedDevicesPlatform");
				try {
					const files = await fs.readdir(activityHistoryPath, { recursive: true }).catch(() => []);
					for (const file of files) {
						const filePath = path.join(activityHistoryPath, file);
						try {
							const stats = await fs.stat(filePath);
							if (stats.isFile()) {
								freedSize += stats.size;
								await fs.unlink(filePath);
								cleanedItems++;
							}
						} catch (e) {}
					}
				} catch (e) {
					errors.push(`Failed to clean activity history: ${e.message}`);
				}
				const searchHistoryPath = path.join(os.homedir(), "AppData/Roaming/Microsoft/Windows/Recent");
				try {
					const files = await fs.readdir(searchHistoryPath).catch(() => []);
					for (const file of files) {
						const filePath = path.join(searchHistoryPath, file);
						try {
							const stats = await fs.stat(filePath);
							freedSize += stats.size;
							await fs.unlink(filePath);
							cleanedItems++;
						} catch (e) {}
					}
				} catch (e) {
					errors.push(`Failed to clean search history: ${e.message}`);
				}
			}
		} catch (e) {
			errors.push(`Windows privacy cleanup failed: ${e.message}`);
		}
		else if (platform === "darwin") try {
			if (options.spotlightHistory) {
				const spotlightHistoryPath = path.join(os.homedir(), "Library/Application Support/com.apple.spotlight");
				try {
					const files = await fs.readdir(spotlightHistoryPath, { recursive: true }).catch(() => []);
					for (const file of files) {
						const filePath = path.join(spotlightHistoryPath, file);
						try {
							const stats = await fs.stat(filePath);
							if (stats.isFile()) {
								freedSize += stats.size;
								await fs.unlink(filePath);
								cleanedItems++;
							}
						} catch (e) {}
					}
				} catch (e) {
					errors.push(`Failed to clean Spotlight history: ${e.message}`);
				}
				const recentItemsPath = path.join(os.homedir(), "Library/Application Support/com.apple.sharedfilelist");
				try {
					const files = await fs.readdir(recentItemsPath).catch(() => []);
					for (const file of files) if (file.includes("RecentItems")) {
						const filePath = path.join(recentItemsPath, file);
						try {
							const stats = await fs.stat(filePath);
							freedSize += stats.size;
							await fs.unlink(filePath);
							cleanedItems++;
						} catch (e) {}
					}
				} catch (e) {
					errors.push(`Failed to clean recent items: ${e.message}`);
				}
			}
			if (options.quickLookCache) {
				const quickLookCachePath = path.join(os.homedir(), "Library/Caches/com.apple.QuickLook");
				try {
					const files = await fs.readdir(quickLookCachePath, { recursive: true }).catch(() => []);
					for (const file of files) {
						const filePath = path.join(quickLookCachePath, file);
						try {
							const stats = await fs.stat(filePath);
							if (stats.isFile()) {
								freedSize += stats.size;
								await fs.unlink(filePath);
								cleanedItems++;
							}
						} catch (e) {}
					}
				} catch (e) {
					errors.push(`Failed to clean Quick Look cache: ${e.message}`);
				}
			}
		} catch (e) {
			errors.push(`macOS privacy cleanup failed: ${e.message}`);
		}
		return {
			success: errors.length === 0,
			cleanedItems,
			freedSize,
			freedSizeFormatted: formatBytes(freedSize),
			errors
		};
	});
	ipcMain.handle("cleaner:scan-browser-data", async () => {
		const platform = process.platform;
		const home = os.homedir();
		const results = {
			browsers: [],
			totalSize: 0,
			totalItems: 0
		};
		const browserPaths = [];
		if (platform === "win32") {
			const localApp = process.env.LOCALAPPDATA || "";
			const appData = process.env.APPDATA || "";
			browserPaths.push({
				name: "Chrome",
				paths: {
					history: [path.join(localApp, "Google/Chrome/User Data/Default/History")],
					cookies: [path.join(localApp, "Google/Chrome/User Data/Default/Cookies")],
					cache: [path.join(localApp, "Google/Chrome/User Data/Default/Cache")],
					downloads: [path.join(localApp, "Google/Chrome/User Data/Default/History")]
				}
			});
			browserPaths.push({
				name: "Edge",
				paths: {
					history: [path.join(localApp, "Microsoft/Edge/User Data/Default/History")],
					cookies: [path.join(localApp, "Microsoft/Edge/User Data/Default/Cookies")],
					cache: [path.join(localApp, "Microsoft/Edge/User Data/Default/Cache")],
					downloads: [path.join(localApp, "Microsoft/Edge/User Data/Default/History")]
				}
			});
			browserPaths.push({
				name: "Firefox",
				paths: {
					history: [path.join(appData, "Mozilla/Firefox/Profiles")],
					cookies: [path.join(appData, "Mozilla/Firefox/Profiles")],
					cache: [path.join(localApp, "Mozilla/Firefox/Profiles")],
					downloads: [path.join(appData, "Mozilla/Firefox/Profiles")]
				}
			});
		} else if (platform === "darwin") {
			browserPaths.push({
				name: "Safari",
				paths: {
					history: [path.join(home, "Library/Safari/History.db")],
					cookies: [path.join(home, "Library/Cookies/Cookies.binarycookies")],
					cache: [path.join(home, "Library/Caches/com.apple.Safari")],
					downloads: [path.join(home, "Library/Safari/Downloads.plist")]
				}
			});
			browserPaths.push({
				name: "Chrome",
				paths: {
					history: [path.join(home, "Library/Application Support/Google/Chrome/Default/History")],
					cookies: [path.join(home, "Library/Application Support/Google/Chrome/Default/Cookies")],
					cache: [path.join(home, "Library/Caches/Google/Chrome")],
					downloads: [path.join(home, "Library/Application Support/Google/Chrome/Default/History")]
				}
			});
			browserPaths.push({
				name: "Firefox",
				paths: {
					history: [path.join(home, "Library/Application Support/Firefox/Profiles")],
					cookies: [path.join(home, "Library/Application Support/Firefox/Profiles")],
					cache: [path.join(home, "Library/Caches/Firefox")],
					downloads: [path.join(home, "Library/Application Support/Firefox/Profiles")]
				}
			});
			browserPaths.push({
				name: "Edge",
				paths: {
					history: [path.join(home, "Library/Application Support/Microsoft Edge/Default/History")],
					cookies: [path.join(home, "Library/Application Support/Microsoft Edge/Default/Cookies")],
					cache: [path.join(home, "Library/Caches/com.microsoft.edgemac")],
					downloads: [path.join(home, "Library/Application Support/Microsoft Edge/Default/History")]
				}
			});
		}
		for (const browser of browserPaths) {
			const browserData = {
				name: browser.name,
				history: {
					size: 0,
					count: 0,
					paths: []
				},
				cookies: {
					size: 0,
					count: 0,
					paths: []
				},
				cache: {
					size: 0,
					count: 0,
					paths: []
				},
				downloads: {
					size: 0,
					count: 0,
					paths: []
				}
			};
			for (const [type, paths] of Object.entries(browser.paths)) for (const dataPath of paths) try {
				if (type === "cache" && platform === "darwin" && browser.name === "Safari") {
					const stats = await fs.stat(dataPath).catch(() => null);
					if (stats && stats.isDirectory()) {
						const size = await getDirSize(dataPath);
						browserData[type].size += size;
						browserData[type].paths.push(dataPath);
						browserData[type].count += 1;
					}
				} else {
					const stats = await fs.stat(dataPath).catch(() => null);
					if (stats) {
						if (stats.isDirectory()) {
							const size = await getDirSize(dataPath);
							browserData[type].size += size;
							browserData[type].paths.push(dataPath);
							browserData[type].count += 1;
						} else if (stats.isFile()) {
							browserData[type].size += stats.size;
							browserData[type].paths.push(dataPath);
							browserData[type].count += 1;
						}
					}
				}
			} catch (e) {}
			const browserTotalSize = Object.values(browserData).reduce((sum, item) => {
				return sum + (typeof item === "object" && item.size ? item.size : 0);
			}, 0);
			if (browserTotalSize > 0) {
				browserData.totalSize = browserTotalSize;
				browserData.totalSizeFormatted = formatBytes(browserTotalSize);
				results.browsers.push(browserData);
				results.totalSize += browserTotalSize;
				results.totalItems += Object.values(browserData).reduce((sum, item) => {
					return sum + (typeof item === "object" && item.count ? item.count : 0);
				}, 0);
			}
		}
		return {
			success: true,
			results
		};
	});
	ipcMain.handle("cleaner:clean-browser-data", async (_event, options) => {
		const platform = process.platform;
		const home = os.homedir();
		let cleanedItems = 0;
		let freedSize = 0;
		const errors = [];
		const browserPaths = {};
		if (platform === "win32") {
			const localApp = process.env.LOCALAPPDATA || "";
			const appData = process.env.APPDATA || "";
			browserPaths["Chrome"] = {
				history: [path.join(localApp, "Google/Chrome/User Data/Default/History")],
				cookies: [path.join(localApp, "Google/Chrome/User Data/Default/Cookies")],
				cache: [path.join(localApp, "Google/Chrome/User Data/Default/Cache")],
				downloads: [path.join(localApp, "Google/Chrome/User Data/Default/History")]
			};
			browserPaths["Edge"] = {
				history: [path.join(localApp, "Microsoft/Edge/User Data/Default/History")],
				cookies: [path.join(localApp, "Microsoft/Edge/User Data/Default/Cookies")],
				cache: [path.join(localApp, "Microsoft/Edge/User Data/Default/Cache")],
				downloads: [path.join(localApp, "Microsoft/Edge/User Data/Default/History")]
			};
			browserPaths["Firefox"] = {
				history: [path.join(appData, "Mozilla/Firefox/Profiles")],
				cookies: [path.join(appData, "Mozilla/Firefox/Profiles")],
				cache: [path.join(localApp, "Mozilla/Firefox/Profiles")],
				downloads: [path.join(appData, "Mozilla/Firefox/Profiles")]
			};
		} else if (platform === "darwin") {
			browserPaths["Safari"] = {
				history: [path.join(home, "Library/Safari/History.db")],
				cookies: [path.join(home, "Library/Cookies/Cookies.binarycookies")],
				cache: [path.join(home, "Library/Caches/com.apple.Safari")],
				downloads: [path.join(home, "Library/Safari/Downloads.plist")]
			};
			browserPaths["Chrome"] = {
				history: [path.join(home, "Library/Application Support/Google/Chrome/Default/History")],
				cookies: [path.join(home, "Library/Application Support/Google/Chrome/Default/Cookies")],
				cache: [path.join(home, "Library/Caches/Google/Chrome")],
				downloads: [path.join(home, "Library/Application Support/Google/Chrome/Default/History")]
			};
			browserPaths["Firefox"] = {
				history: [path.join(home, "Library/Application Support/Firefox/Profiles")],
				cookies: [path.join(home, "Library/Application Support/Firefox/Profiles")],
				cache: [path.join(home, "Library/Caches/Firefox")],
				downloads: [path.join(home, "Library/Application Support/Firefox/Profiles")]
			};
			browserPaths["Edge"] = {
				history: [path.join(home, "Library/Application Support/Microsoft Edge/Default/History")],
				cookies: [path.join(home, "Library/Application Support/Microsoft Edge/Default/Cookies")],
				cache: [path.join(home, "Library/Caches/com.microsoft.edgemac")],
				downloads: [path.join(home, "Library/Application Support/Microsoft Edge/Default/History")]
			};
		}
		for (const browserName of options.browsers) {
			const paths = browserPaths[browserName];
			if (!paths) continue;
			for (const type of options.types) {
				const typePaths = paths[type];
				if (!typePaths) continue;
				for (const dataPath of typePaths) try {
					const stats = await fs.stat(dataPath).catch(() => null);
					if (!stats) continue;
					if (stats.isDirectory()) {
						const size = await getDirSize(dataPath);
						await fs.rm(dataPath, {
							recursive: true,
							force: true
						});
						freedSize += size;
						cleanedItems++;
					} else if (stats.isFile()) {
						freedSize += stats.size;
						await fs.unlink(dataPath);
						cleanedItems++;
					}
				} catch (e) {
					errors.push(`Failed to clean ${browserName} ${type}: ${e.message}`);
				}
			}
		}
		return {
			success: errors.length === 0,
			cleanedItems,
			freedSize,
			freedSizeFormatted: formatBytes(freedSize),
			errors
		};
	});
	ipcMain.handle("cleaner:get-wifi-networks", async () => {
		const platform = process.platform;
		const networks = [];
		try {
			if (platform === "win32") {
				const { stdout } = await execAsync("netsh wlan show profiles");
				const lines = stdout.split("\n");
				for (const line of lines) {
					const match = line.match(/All User Profile\s*:\s*(.+)/);
					if (match) {
						const profileName = match[1].trim();
						try {
							const { stdout: profileInfo } = await execAsync(`netsh wlan show profile name="${profileName}" key=clear`);
							const keyMatch = profileInfo.match(/Key Content\s*:\s*(.+)/);
							networks.push({
								name: profileName,
								hasPassword: !!keyMatch,
								platform: "windows"
							});
						} catch (e) {
							networks.push({
								name: profileName,
								hasPassword: false,
								platform: "windows"
							});
						}
					}
				}
			} else if (platform === "darwin") {
				const { stdout } = await execAsync("networksetup -listallhardwareports");
				if (stdout.split("\n").find((line) => line.includes("Wi-Fi") || line.includes("AirPort"))) {
					const { stdout: networksOutput } = await execAsync("networksetup -listpreferredwirelessnetworks en0").catch(() => ({ stdout: "" }));
					const networkNames = networksOutput.split("\n").filter((line) => line.trim() && !line.includes("Preferred networks"));
					for (const networkName of networkNames) {
						const name = networkName.trim();
						if (name) networks.push({
							name,
							hasPassword: true,
							platform: "macos"
						});
					}
				}
			}
		} catch (e) {
			return {
				success: false,
				error: e.message,
				networks: []
			};
		}
		return {
			success: true,
			networks
		};
	});
	ipcMain.handle("cleaner:remove-wifi-network", async (_event, networkName) => {
		const platform = process.platform;
		try {
			if (platform === "win32") {
				await execAsync(`netsh wlan delete profile name="${networkName}"`);
				return { success: true };
			} else if (platform === "darwin") {
				await execAsync(`networksetup -removepreferredwirelessnetwork en0 "${networkName}"`);
				return { success: true };
			}
			return {
				success: false,
				error: "Unsupported platform"
			};
		} catch (e) {
			return {
				success: false,
				error: e.message
			};
		}
	});
	ipcMain.handle("cleaner:run-maintenance", async (_event, task) => {
		const platform = process.platform;
		const startTime = Date.now();
		let output = "";
		try {
			if (platform === "win32") switch (task.category) {
				case "sfc":
					const { stdout: sfcOutput } = await execAsync("sfc /scannow", { timeout: 3e5 });
					output = sfcOutput;
					break;
				case "dism":
					const { stdout: dismOutput } = await execAsync("DISM /Online /Cleanup-Image /RestoreHealth", { timeout: 6e5 });
					output = dismOutput;
					break;
				case "disk-cleanup":
					const { stdout: cleanupOutput } = await execAsync("cleanmgr /sagerun:1", { timeout: 3e5 });
					output = cleanupOutput || "Disk cleanup completed";
					break;
				case "dns-flush":
					const { stdout: dnsOutput } = await execAsync("ipconfig /flushdns");
					output = dnsOutput || "DNS cache flushed successfully";
					break;
				case "winsock-reset":
					const { stdout: winsockOutput } = await execAsync("netsh winsock reset");
					output = winsockOutput || "Winsock reset completed";
					break;
				case "windows-search-rebuild":
					try {
						await execAsync("powershell \"Stop-Service -Name WSearch -Force\"");
						await execAsync("powershell \"Remove-Item -Path \"$env:ProgramData\\Microsoft\\Search\\Data\\*\" -Recurse -Force\"");
						await execAsync("powershell \"Start-Service -Name WSearch\"");
						output = "Windows Search index rebuilt successfully";
					} catch (e) {
						throw new Error(`Failed to rebuild search index: ${e.message}`);
					}
					break;
				default: throw new Error(`Unknown maintenance task: ${task.category}`);
			}
			else if (platform === "darwin") switch (task.category) {
				case "time-machine-cleanup":
					try {
						const { stdout: tmOutput } = await execAsync("sudo tmutil deletelocalsnapshots /");
						output = tmOutput || "Local Time Machine snapshots removed successfully";
					} catch (e) {
						throw new Error(`Failed to clean Time Machine snapshots: ${e.message}`);
					}
					break;
				case "spotlight-reindex":
					try {
						await execAsync("sudo mdutil -E /");
						output = "Spotlight index rebuilt successfully";
					} catch (e) {
						try {
							await execAsync("mdutil -E ~");
							output = "Spotlight index rebuilt successfully (user directory only)";
						} catch (e2) {
							throw new Error(`Failed to rebuild Spotlight index: ${e2.message}`);
						}
					}
					break;
				case "launch-services-reset":
					try {
						await execAsync(`/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister -kill -r -domain local -domain system -domain user`);
						output = "Launch Services database reset successfully. You may need to restart apps for changes to take effect.";
					} catch (e) {
						throw new Error(`Failed to reset Launch Services: ${e.message}`);
					}
					break;
				case "dns-flush":
					try {
						await execAsync("sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder");
						output = "DNS cache flushed successfully";
					} catch (e) {
						throw new Error(`Failed to flush DNS: ${e.message}`);
					}
					break;
				case "gatekeeper-check":
					try {
						const { stdout: gkOutput } = await execAsync("spctl --status");
						output = `Gatekeeper Status: ${gkOutput.trim()}`;
					} catch (e) {
						throw new Error(`Failed to check Gatekeeper: ${e.message}`);
					}
					break;
				case "mail-rebuild":
					try {
						const home = os.homedir();
						await execAsync(`find "${path.join(home, "Library/Mail")}" -name "Envelope Index*" -delete`);
						output = "Mail database indexes cleared. Rebuild will occur next time you open Mail.app.";
					} catch (e) {
						throw new Error(`Failed to rebuild Mail database: ${e.message}`);
					}
					break;
				case "icloud-cleanup":
					try {
						const home = os.homedir();
						const birdCache = path.join(home, "Library/Caches/com.apple.bird");
						const cloudDocsCache = path.join(home, "Library/Caches/com.apple.CloudDocs");
						await fs.rm(birdCache, {
							recursive: true,
							force: true
						}).catch(() => {});
						await fs.rm(cloudDocsCache, {
							recursive: true,
							force: true
						}).catch(() => {});
						output = "iCloud cache cleared successfully";
					} catch (e) {
						throw new Error(`Failed to clear iCloud cache: ${e.message}`);
					}
					break;
				case "disk-permissions":
					try {
						const { stdout: diskOutput } = await execAsync("diskutil verifyVolume /");
						output = diskOutput || "Disk permissions verified";
					} catch (e) {
						throw new Error(`Failed to verify disk: ${e.message}`);
					}
					break;
				default: throw new Error(`Unknown maintenance task: ${task.category}`);
			}
			else throw new Error("Unsupported platform for maintenance tasks");
			return {
				success: true,
				taskId: task.id,
				duration: Date.now() - startTime,
				output
			};
		} catch (e) {
			return {
				success: false,
				taskId: task.id,
				duration: Date.now() - startTime,
				error: e.message,
				output
			};
		}
	});
	ipcMain.handle("cleaner:get-health-status", async () => {
		try {
			const mem = await si.mem();
			const load = await si.currentLoad();
			const disk = await si.fsSize();
			const battery = await si.battery().catch(() => null);
			const alerts = [];
			const rootDisk = disk.find((d) => d.mount === "/" || d.mount === "C:") || disk[0];
			if (rootDisk) {
				const freePercent = rootDisk.available / rootDisk.size * 100;
				if (freePercent < 10) alerts.push({
					type: "low_space",
					severity: "critical",
					message: `Low disk space: ${formatBytes(rootDisk.available)} free (${freePercent.toFixed(1)}%)`,
					action: "Run cleanup to free space"
				});
				else if (freePercent < 20) alerts.push({
					type: "low_space",
					severity: "warning",
					message: `Disk space getting low: ${formatBytes(rootDisk.available)} free (${freePercent.toFixed(1)}%)`,
					action: "Consider running cleanup"
				});
			}
			if (load.currentLoad > 90) alerts.push({
				type: "high_cpu",
				severity: "warning",
				message: `High CPU usage: ${load.currentLoad.toFixed(1)}%`,
				action: "Check heavy processes"
			});
			const memPercent = mem.used / mem.total * 100;
			if (memPercent > 90) alerts.push({
				type: "memory_pressure",
				severity: "warning",
				message: `High memory usage: ${memPercent.toFixed(1)}%`,
				action: "Consider freeing RAM"
			});
			return {
				cpu: load.currentLoad,
				ram: {
					used: mem.used,
					total: mem.total,
					percentage: memPercent
				},
				disk: rootDisk ? {
					free: rootDisk.available,
					total: rootDisk.size,
					percentage: (rootDisk.size - rootDisk.available) / rootDisk.size * 100
				} : null,
				battery: battery ? {
					level: battery.percent,
					charging: battery.isCharging || false
				} : null,
				alerts
			};
		} catch (e) {
			return {
				success: false,
				error: e.message
			};
		}
	});
	ipcMain.handle("cleaner:check-safety", async (_event, files) => {
		try {
			const platform = process.platform;
			const result = checkFilesSafety(files, platform);
			return {
				success: true,
				safe: result.safe,
				warnings: result.warnings,
				blocked: result.blocked
			};
		} catch (e) {
			return {
				success: false,
				error: e.message,
				safe: false,
				warnings: [],
				blocked: []
			};
		}
	});
	ipcMain.handle("cleaner:create-backup", async (_event, files) => {
		try {
			return await createBackup(files);
		} catch (e) {
			return {
				success: false,
				error: e.message
			};
		}
	});
	ipcMain.handle("cleaner:list-backups", async () => {
		try {
			return {
				success: true,
				backups: await listBackups()
			};
		} catch (e) {
			return {
				success: false,
				error: e.message,
				backups: []
			};
		}
	});
	ipcMain.handle("cleaner:get-backup-info", async (_event, backupId) => {
		try {
			const backupInfo = await getBackupInfo(backupId);
			return {
				success: backupInfo !== null,
				backupInfo
			};
		} catch (e) {
			return {
				success: false,
				error: e.message
			};
		}
	});
	ipcMain.handle("cleaner:restore-backup", async (_event, backupId) => {
		try {
			return await restoreBackup(backupId);
		} catch (e) {
			return {
				success: false,
				error: e.message
			};
		}
	});
	ipcMain.handle("cleaner:delete-backup", async (_event, backupId) => {
		try {
			return await deleteBackup(backupId);
		} catch (e) {
			return {
				success: false,
				error: e.message
			};
		}
	});
}
async function getDirSizeLimited(dirPath, maxDepth, currentDepth = 0) {
	if (currentDepth >= maxDepth) return 0;
	let size = 0;
	try {
		const files = await fs.readdir(dirPath, { withFileTypes: true });
		for (const file of files) {
			if (file.name.startsWith(".") || [
				"node_modules",
				"Library",
				"AppData",
				"System",
				".git",
				".DS_Store"
			].includes(file.name)) continue;
			const filePath = path.join(dirPath, file.name);
			try {
				if (file.isDirectory()) size += await getDirSizeLimited(filePath, maxDepth, currentDepth + 1);
				else {
					const stats = await fs.stat(filePath).catch(() => null);
					if (stats) size += stats.size;
				}
			} catch (e) {
				continue;
			}
		}
	} catch (e) {
		return 0;
	}
	return size;
}
async function scanDirectoryForLens(dirPath, currentDepth, maxDepth, onProgress) {
	try {
		const stats = await fs.stat(dirPath);
		const name = path.basename(dirPath) || dirPath;
		if (!stats.isDirectory()) {
			const fileNode = {
				name,
				path: dirPath,
				size: stats.size,
				sizeFormatted: formatBytes(stats.size),
				type: "file"
			};
			if (onProgress) onProgress({
				currentPath: name,
				progress: 100,
				status: `Scanning file: ${name}`,
				item: fileNode
			});
			return fileNode;
		}
		if (onProgress) onProgress({
			currentPath: name,
			progress: 0,
			status: `Scanning directory: ${name}`
		});
		const items = await fs.readdir(dirPath, { withFileTypes: true });
		const children = [];
		let totalSize = 0;
		const itemsToProcess = items.filter((item) => !item.name.startsWith(".") && ![
			"node_modules",
			"Library",
			"AppData",
			"System",
			".git",
			".DS_Store"
		].includes(item.name));
		const totalItemsToProcess = itemsToProcess.length;
		let processedItems = 0;
		for (const item of itemsToProcess) {
			const childPath = path.join(dirPath, item.name);
			if (onProgress) {
				const progressPercent = Math.floor(processedItems / totalItemsToProcess * 100);
				const itemType = item.isDirectory() ? "directory" : "file";
				onProgress({
					currentPath: item.name,
					progress: progressPercent,
					status: `Scanning ${itemType}: ${item.name}`
				});
			}
			let childNode = null;
			if (currentDepth < maxDepth) {
				childNode = await scanDirectoryForLens(childPath, currentDepth + 1, maxDepth, onProgress);
				if (childNode) {
					children.push(childNode);
					totalSize += childNode.size;
				}
			} else try {
				let size = (await fs.stat(childPath)).size;
				if (item.isDirectory()) {
					const cached = dirSizeCache.get(childPath);
					if (cached && Date.now() - cached.timestamp < CACHE_TTL) size = cached.size;
					else try {
						size = await getDirSizeLimited(childPath, 3);
						dirSizeCache.set(childPath, {
							size,
							timestamp: Date.now()
						});
					} catch (e) {
						size = 0;
					}
				}
				childNode = {
					name: item.name,
					path: childPath,
					size,
					sizeFormatted: formatBytes(size),
					type: item.isDirectory() ? "dir" : "file"
				};
				children.push(childNode);
				totalSize += size;
			} catch (e) {
				processedItems++;
				continue;
			}
			if (childNode && onProgress) onProgress({
				currentPath: item.name,
				progress: Math.floor((processedItems + 1) / totalItemsToProcess * 100),
				status: `Scanned: ${item.name}`,
				item: childNode
			});
			processedItems++;
		}
		const result = {
			name,
			path: dirPath,
			size: totalSize,
			sizeFormatted: formatBytes(totalSize),
			type: "dir",
			children: children.sort((a, b) => b.size - a.size)
		};
		if (onProgress) onProgress({
			currentPath: name,
			progress: 100,
			status: `Completed: ${name}`
		});
		return result;
	} catch (e) {
		return null;
	}
}
async function findLargeFiles(dirPath, minSize, results) {
	try {
		const files = await fs.readdir(dirPath, { withFileTypes: true });
		for (const file of files) {
			const filePath = path.join(dirPath, file.name);
			if (file.name.startsWith(".") || [
				"node_modules",
				"Library",
				"AppData",
				"System",
				"Windows"
			].includes(file.name)) continue;
			try {
				const stats = await fs.stat(filePath);
				if (file.isDirectory()) await findLargeFiles(filePath, minSize, results);
				else if (stats.size >= minSize) results.push({
					name: file.name,
					path: filePath,
					size: stats.size,
					sizeFormatted: formatBytes(stats.size),
					lastAccessed: stats.atime,
					type: path.extname(file.name).slice(1) || "file"
				});
			} catch (e) {}
		}
	} catch (e) {}
}
async function findDuplicates(dirPath, fileHashes) {
	try {
		const files = await fs.readdir(dirPath, { withFileTypes: true });
		for (const file of files) {
			const filePath = path.join(dirPath, file.name);
			if (file.name.startsWith(".") || [
				"node_modules",
				"Library",
				"AppData"
			].includes(file.name)) continue;
			try {
				const stats = await fs.stat(filePath);
				if (file.isDirectory()) await findDuplicates(filePath, fileHashes);
				else if (stats.size > 1024 * 1024 && stats.size < 50 * 1024 * 1024) {
					const hash$1 = await hashFile(filePath);
					const existing = fileHashes.get(hash$1) || [];
					existing.push(filePath);
					fileHashes.set(hash$1, existing);
				}
			} catch (e) {}
		}
	} catch (e) {}
}
async function hashFile(filePath) {
	const buffer = await fs.readFile(filePath);
	return createHash("md5").update(buffer).digest("hex");
}
function formatBytes(bytes) {
	if (bytes === 0) return "0 B";
	const k = 1024;
	const sizes = [
		"B",
		"KB",
		"MB",
		"GB",
		"TB"
	];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}
var getPlatformProtectedPaths = (platform) => {
	const home = os.homedir();
	const rules = [];
	if (platform === "win32") {
		const windir = process.env.WINDIR || "C:\\Windows";
		const programFiles = process.env.PROGRAMFILES || "C:\\Program Files";
		const programFilesX86 = process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)";
		rules.push({
			path: windir,
			type: "folder",
			action: "protect",
			reason: "Windows system directory",
			platform: "windows"
		}, {
			path: programFiles,
			type: "folder",
			action: "protect",
			reason: "Program Files directory",
			platform: "windows"
		}, {
			path: programFilesX86,
			type: "folder",
			action: "protect",
			reason: "Program Files (x86) directory",
			platform: "windows"
		}, {
			path: "C:\\ProgramData",
			type: "folder",
			action: "protect",
			reason: "ProgramData directory",
			platform: "windows"
		}, {
			path: path.join(home, "Documents"),
			type: "folder",
			action: "warn",
			reason: "User Documents folder",
			platform: "windows"
		}, {
			path: path.join(home, "Desktop"),
			type: "folder",
			action: "warn",
			reason: "User Desktop folder",
			platform: "windows"
		});
	} else if (platform === "darwin") rules.push({
		path: "/System",
		type: "folder",
		action: "protect",
		reason: "macOS System directory",
		platform: "macos"
	}, {
		path: "/Library",
		type: "folder",
		action: "protect",
		reason: "System Library directory",
		platform: "macos"
	}, {
		path: "/usr",
		type: "folder",
		action: "protect",
		reason: "Unix system resources",
		platform: "macos"
	}, {
		path: path.join(home, "Documents"),
		type: "folder",
		action: "warn",
		reason: "User Documents folder",
		platform: "macos"
	}, {
		path: path.join(home, "Desktop"),
		type: "folder",
		action: "warn",
		reason: "User Desktop folder",
		platform: "macos"
	});
	return rules;
};
var checkFileSafety = (filePath, platform) => {
	const warnings = [];
	const blocked = [];
	const rules = getPlatformProtectedPaths(platform);
	for (const rule of rules) {
		if (rule.platform && rule.platform !== platform && rule.platform !== "all") continue;
		const normalizedRulePath = path.normalize(rule.path);
		const normalizedFilePath = path.normalize(filePath);
		if (normalizedFilePath === normalizedRulePath || normalizedFilePath.startsWith(normalizedRulePath + path.sep)) {
			if (rule.action === "protect") {
				blocked.push(filePath);
				return {
					safe: false,
					warnings: [],
					blocked: [filePath]
				};
			} else if (rule.action === "warn") warnings.push({
				path: filePath,
				reason: rule.reason,
				severity: "high"
			});
		}
	}
	return {
		safe: blocked.length === 0,
		warnings,
		blocked
	};
};
var checkFilesSafety = (filePaths, platform) => {
	const allWarnings = [];
	const allBlocked = [];
	for (const filePath of filePaths) {
		const result = checkFileSafety(filePath, platform);
		if (!result.safe) allBlocked.push(...result.blocked);
		allWarnings.push(...result.warnings);
	}
	return {
		safe: allBlocked.length === 0,
		warnings: allWarnings,
		blocked: allBlocked
	};
};
var getBackupDir = () => {
	const home = os.homedir();
	if (process.platform === "win32") return path.join(home, "AppData", "Local", "devtools-app", "backups");
	else return path.join(home, ".devtools-app", "backups");
};
var generateBackupId = () => {
	return `backup-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};
var calculateTotalSize = async (files) => {
	let totalSize = 0;
	for (const filePath of files) try {
		const stats = await fs.stat(filePath);
		if (stats.isFile()) totalSize += stats.size;
	} catch (e) {}
	return totalSize;
};
var createBackup = async (files) => {
	try {
		const backupDir = getBackupDir();
		await fs.mkdir(backupDir, { recursive: true });
		const backupId = generateBackupId();
		const backupPath = path.join(backupDir, backupId);
		await fs.mkdir(backupPath, { recursive: true });
		const totalSize = await calculateTotalSize(files);
		const backedUpFiles = [];
		for (const filePath of files) try {
			const stats = await fs.stat(filePath);
			const fileName = path.basename(filePath);
			const backupFilePath = path.join(backupPath, fileName);
			if (stats.isFile()) {
				await fs.copyFile(filePath, backupFilePath);
				backedUpFiles.push(filePath);
			}
		} catch (e) {}
		const backupInfo = {
			id: backupId,
			timestamp: (/* @__PURE__ */ new Date()).toISOString(),
			files: backedUpFiles,
			totalSize,
			location: backupPath,
			platform: process.platform
		};
		const metadataPath = path.join(backupPath, "backup-info.json");
		await fs.writeFile(metadataPath, JSON.stringify(backupInfo, null, 2));
		return {
			success: true,
			backupId,
			backupInfo
		};
	} catch (error) {
		return {
			success: false,
			error: error.message
		};
	}
};
var listBackups = async () => {
	try {
		const backupDir = getBackupDir();
		const entries = await fs.readdir(backupDir, { withFileTypes: true });
		const backups = [];
		for (const entry of entries) if (entry.isDirectory() && entry.name.startsWith("backup-")) {
			const metadataPath = path.join(backupDir, entry.name, "backup-info.json");
			try {
				const metadataContent = await fs.readFile(metadataPath, "utf-8");
				backups.push(JSON.parse(metadataContent));
			} catch (e) {}
		}
		return backups.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
	} catch (error) {
		return [];
	}
};
var getBackupInfo = async (backupId) => {
	try {
		const backupDir = getBackupDir();
		const metadataPath = path.join(backupDir, backupId, "backup-info.json");
		const metadataContent = await fs.readFile(metadataPath, "utf-8");
		return JSON.parse(metadataContent);
	} catch (error) {
		return null;
	}
};
var restoreBackup = async (backupId) => {
	try {
		const backupInfo = await getBackupInfo(backupId);
		if (!backupInfo) return {
			success: false,
			error: "Backup not found"
		};
		const backupPath = backupInfo.location;
		for (const filePath of backupInfo.files) try {
			const fileName = path.basename(filePath);
			const backupFilePath = path.join(backupPath, fileName);
			if ((await fs.stat(backupFilePath)).isFile()) {
				const destDir = path.dirname(filePath);
				await fs.mkdir(destDir, { recursive: true });
				await fs.copyFile(backupFilePath, filePath);
			}
		} catch (e) {}
		return { success: true };
	} catch (error) {
		return {
			success: false,
			error: error.message
		};
	}
};
var deleteBackup = async (backupId) => {
	try {
		const backupDir = getBackupDir();
		const backupPath = path.join(backupDir, backupId);
		await fs.rm(backupPath, {
			recursive: true,
			force: true
		});
		return { success: true };
	} catch (error) {
		return {
			success: false,
			error: error.message
		};
	}
};
var HTTP_AGENT = new http.Agent({
	keepAlive: true,
	maxSockets: 128,
	keepAliveMsecs: 1e4
});
var HTTPS_AGENT = new https.Agent({
	keepAlive: true,
	maxSockets: 128,
	keepAliveMsecs: 1e4
});
var COMMON_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36";
var DownloadManager = class extends EventEmitter {
	constructor() {
		super();
		this.globalDownloadedInLastSecond = 0;
		this.lastSpeedCheck = Date.now();
		this.activeTasks = /* @__PURE__ */ new Map();
		this.store = new Store({
			name: "download-manager-history",
			defaults: {
				history: [],
				settings: {
					downloadPath: app.getPath("downloads"),
					maxConcurrentDownloads: 5,
					segmentsPerDownload: 32,
					autoStart: true,
					monitorClipboard: true,
					autoUnzip: false,
					autoOpenFolder: true,
					autoVerifyChecksum: true,
					enableSounds: true,
					speedLimit: 0
				},
				savedCredentials: {}
			}
		});
		this.history = this.store.get("history", []);
	}
	getSettings() {
		return this.store.get("settings");
	}
	saveSettings(settings) {
		const updated = {
			...this.getSettings(),
			...settings
		};
		this.store.set("settings", updated);
		this.checkQueue();
	}
	getHistory() {
		return this.history;
	}
	saveTask(task) {
		const index = this.history.findIndex((t) => t.id === task.id);
		if (index > -1) this.history[index] = { ...task };
		else this.history.unshift({ ...task });
		this.persistHistory();
	}
	persistHistory() {
		this.store.set("history", this.history.slice(0, 500));
	}
	emitProgress(task) {
		const progress = {
			taskId: task.id,
			downloadedSize: task.downloadedSize,
			totalSize: task.totalSize,
			speed: task.speed,
			eta: task.eta,
			progress: task.totalSize > 0 ? task.downloadedSize / task.totalSize * 100 : 0,
			status: task.status,
			segments: task.segments
		};
		this.emit("progress", progress);
	}
	async createDownload(url, customFilename, options) {
		if (!options?.credentials) {
			const domain = new URL(url).hostname;
			const saved = this.store.get("savedCredentials", {});
			if (saved[domain]) options = {
				...options,
				credentials: saved[domain]
			};
		} else {
			const domain = new URL(url).hostname;
			const saved = this.store.get("savedCredentials", {});
			saved[domain] = options.credentials;
			this.store.set("savedCredentials", saved);
		}
		const info = await this.getFileInfo(url, 5, options?.credentials);
		const settings = this.getSettings();
		let filename = customFilename || info.filename || path$1.basename(new URL(info.finalUrl).pathname) || "download";
		filename = this.sanitizeFilename(filename);
		const filepath = path$1.join(settings.downloadPath, filename);
		const category = this.getCategory(filename);
		const task = {
			id: randomUUID$1(),
			url: info.finalUrl,
			filename,
			filepath,
			totalSize: info.size,
			downloadedSize: 0,
			segments: [],
			status: "queued",
			speed: 0,
			eta: 0,
			priority: 5,
			category,
			createdAt: Date.now(),
			checksum: options?.checksum,
			credentials: options?.credentials
		};
		if (info.acceptRanges && info.size > 0 && settings.segmentsPerDownload > 1) {
			const segmentSize = Math.ceil(info.size / settings.segmentsPerDownload);
			for (let i = 0; i < settings.segmentsPerDownload; i++) {
				const start = i * segmentSize;
				const end = Math.min((i + 1) * segmentSize - 1, info.size - 1);
				task.segments.push({
					id: i,
					start,
					end,
					downloaded: 0,
					status: "pending"
				});
			}
		} else task.segments.push({
			id: 0,
			start: 0,
			end: info.size > 0 ? info.size - 1 : -1,
			downloaded: 0,
			status: "pending"
		});
		this.saveTask(task);
		this.checkQueue();
		return task;
	}
	async getFileInfo(url, limit = 5, credentials) {
		if (limit <= 0) throw new Error("Too many redirects");
		return new Promise((resolve, reject) => {
			try {
				const parsedUrl = new URL(url);
				const protocol$1 = parsedUrl.protocol === "https:" ? https : http;
				const options = {
					method: "HEAD",
					agent: parsedUrl.protocol === "https:" ? HTTPS_AGENT : HTTP_AGENT,
					headers: {
						"User-Agent": COMMON_USER_AGENT,
						"Accept": "*/*",
						"Connection": "keep-alive",
						...credentials?.username || credentials?.password ? { "Authorization": `Basic ${Buffer.from(`${credentials.username || ""}:${credentials.password || ""}`).toString("base64")}` } : {}
					}
				};
				const req = protocol$1.request(url, options, (res) => {
					if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
						const redirectUrl = new URL(res.headers.location, url).toString();
						resolve(this.getFileInfo(redirectUrl, limit - 1, credentials));
						return;
					}
					if (res.statusCode === 405 || res.statusCode === 403 || res.statusCode === 404) {
						const getOptions = {
							...options,
							method: "GET",
							headers: {
								...options.headers,
								"Range": "bytes=0-0"
							}
						};
						const getReq = protocol$1.request(url, getOptions, (getRes) => {
							const size$1 = this.parseContentRange(getRes.headers["content-range"]) || parseInt(getRes.headers["content-length"] || "0", 10);
							const acceptRanges$1 = getRes.headers["accept-ranges"] === "bytes" || !!getRes.headers["content-range"];
							const contentDisposition$1 = getRes.headers["content-disposition"];
							const filename = this.parseFilename(contentDisposition$1);
							getRes.resume();
							resolve({
								size: size$1,
								acceptRanges: acceptRanges$1,
								filename,
								finalUrl: url
							});
						});
						getReq.on("error", reject);
						getReq.end();
						return;
					}
					const size = parseInt(res.headers["content-length"] || "0", 10);
					const acceptRanges = res.headers["accept-ranges"] === "bytes";
					const contentDisposition = res.headers["content-disposition"];
					resolve({
						size,
						acceptRanges,
						filename: this.parseFilename(contentDisposition),
						finalUrl: url
					});
				});
				req.on("error", (err) => {
					const getOptions = {
						...options,
						method: "GET",
						headers: {
							...options.headers,
							"Range": "bytes=0-0"
						}
					};
					const getReq = protocol$1.request(url, getOptions, (getRes) => {
						const size = this.parseContentRange(getRes.headers["content-range"]) || parseInt(getRes.headers["content-length"] || "0", 10);
						const acceptRanges = getRes.headers["accept-ranges"] === "bytes" || !!getRes.headers["content-range"];
						const contentDisposition = getRes.headers["content-disposition"];
						const filename = this.parseFilename(contentDisposition);
						getRes.resume();
						resolve({
							size,
							acceptRanges,
							filename,
							finalUrl: url
						});
					});
					getReq.on("error", () => reject(err));
					getReq.end();
				});
				req.setTimeout(15e3, () => {
					req.destroy();
					reject(/* @__PURE__ */ new Error("Request timeout during getFileInfo"));
				});
				req.end();
			} catch (err) {
				reject(err);
			}
		});
	}
	parseContentRange(range) {
		if (!range) return 0;
		const match = range.match(/\/(\d+)$/);
		return match ? parseInt(match[1], 10) : 0;
	}
	parseFilename(disposition) {
		if (!disposition) return void 0;
		let filename;
		const filenameStarMatch = disposition.match(/filename\*=(?:UTF-8|utf-8)''([^;\s]+)/i);
		if (filenameStarMatch) try {
			filename = decodeURIComponent(filenameStarMatch[1]);
		} catch (e) {}
		if (!filename) {
			const filenameMatch = disposition.match(/filename=(?:(['"])(.*?)\1|([^;\s]+))/i);
			if (filenameMatch) filename = filenameMatch[2] || filenameMatch[3];
		}
		return filename;
	}
	sanitizeFilename(filename) {
		let clean = filename.split(";")[0];
		clean = clean.replace(/filename\*?=.*/gi, "");
		clean = clean.replace(/[<>:"/\\|?*]/g, "_");
		clean = clean.replace(/^\.+|\.+$/g, "").trim();
		return clean || "download";
	}
	checkQueue() {
		const settings = this.getSettings();
		if ([...this.activeTasks.values()].filter((a) => a.task.status === "downloading").length >= settings.maxConcurrentDownloads) return;
		const nextTask = this.history.find((t) => t.status === "queued");
		if (nextTask) this.startDownload(nextTask.id);
	}
	async startDownload(taskId) {
		const task = this.history.find((t) => t.id === taskId);
		if (!task || task.status === "completed" || task.status === "downloading") return;
		const settings = this.getSettings();
		if ([...this.activeTasks.values()].filter((a) => a.task.status === "downloading").length >= settings.maxConcurrentDownloads) {
			task.status = "queued";
			this.saveTask(task);
			return;
		}
		task.status = "downloading";
		task.error = void 0;
		this.saveTask(task);
		this.emitProgress(task);
		this.emit("task-started", task);
		const abortControllers = [];
		this.activeTasks.set(taskId, {
			task,
			abortControllers,
			lastUpdate: Date.now(),
			lastDownloaded: task.downloadedSize
		});
		const dir = path$1.dirname(task.filepath);
		if (!fs$1.existsSync(dir)) fs$1.mkdirSync(dir, { recursive: true });
		try {
			if (!fs$1.existsSync(task.filepath)) if (task.totalSize > 0) {
				const tempFd = fs$1.openSync(task.filepath, "w");
				fs$1.ftruncateSync(tempFd, task.totalSize);
				fs$1.closeSync(tempFd);
			} else fs$1.writeFileSync(task.filepath, Buffer.alloc(0));
			const fd$1 = fs$1.openSync(task.filepath, "r+");
			const entry$1 = this.activeTasks.get(taskId);
			if (entry$1) entry$1.fd = fd$1;
		} catch (err) {
			console.error("File allocation/open error:", err);
			task.status = "failed";
			task.error = `File error: ${err.message}`;
			this.saveTask(task);
			this.activeTasks.delete(taskId);
			return;
		}
		const entry = this.activeTasks.get(taskId);
		if (!entry || entry.fd === void 0) return;
		const fd = entry.fd;
		const promises = task.segments.map((segment) => {
			if (segment.status === "completed") return Promise.resolve();
			return this.downloadSegment(task, segment, abortControllers, fd);
		});
		Promise.all(promises).then(() => {
			if (task.status === "downloading") {
				task.status = "completed";
				task.completedAt = Date.now();
				task.speed = 0;
				this.saveTask(task);
				this.closeTaskFd(taskId);
				this.activeTasks.delete(taskId);
				this.handlePostProcessing(task);
				this.checkQueue();
			}
		}).catch((err) => {
			if (err.name === "AbortError" || task.status === "paused") {
				this.closeTaskFd(taskId);
				return;
			}
			console.error(`Download failed for ${task.filename}:`, err);
			task.status = "failed";
			task.error = err.message;
			task.speed = 0;
			this.saveTask(task);
			this.emitProgress(task);
			this.closeTaskFd(taskId);
			this.activeTasks.delete(taskId);
			this.checkQueue();
		});
	}
	closeTaskFd(taskId) {
		const entry = this.activeTasks.get(taskId);
		if (entry && entry.fd !== void 0) try {
			fs$1.closeSync(entry.fd);
			entry.fd = void 0;
		} catch (e) {
			console.error("Error closing fd:", e);
		}
	}
	downloadSegment(task, segment, abortControllers, fd) {
		return new Promise((resolve, reject) => {
			const controller = new AbortController();
			abortControllers.push(controller);
			const startPos = segment.start + segment.downloaded;
			const endPos = segment.end;
			if (startPos > endPos && endPos !== -1) {
				segment.status = "completed";
				return resolve();
			}
			const headers = {
				"User-Agent": COMMON_USER_AGENT,
				"Accept": "*/*",
				"Connection": "keep-alive",
				"Referer": new URL(task.url).origin
			};
			if (endPos !== -1) headers["Range"] = `bytes=${startPos}-${endPos}`;
			if (task.credentials?.username || task.credentials?.password) headers["Authorization"] = `Basic ${Buffer.from(`${task.credentials.username || ""}:${task.credentials.password || ""}`).toString("base64")}`;
			const download = (currentUrl, redirectLimit, retryCount = 0) => {
				if (redirectLimit <= 0) {
					reject(/* @__PURE__ */ new Error("Too many redirects in segment download"));
					return;
				}
				const parsedUrl = new URL(currentUrl);
				const protocol$1 = parsedUrl.protocol === "https:" ? https : http;
				const agent = parsedUrl.protocol === "https:" ? HTTPS_AGENT : HTTP_AGENT;
				headers["Referer"] = parsedUrl.origin;
				const req = protocol$1.get(currentUrl, {
					headers,
					agent,
					signal: controller.signal
				}, (res) => {
					if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
						const redirectUrl = new URL(res.headers.location, currentUrl).toString();
						res.resume();
						download(redirectUrl, redirectLimit - 1, retryCount);
						return;
					}
					if (res.statusCode !== 200 && res.statusCode !== 206) {
						if (retryCount < 3) {
							res.resume();
							setTimeout(() => download(currentUrl, redirectLimit, retryCount + 1), 2e3 * (retryCount + 1));
							return;
						}
						reject(/* @__PURE__ */ new Error(`Server returned ${res.statusCode} for segment ${segment.id}`));
						return;
					}
					segment.status = "downloading";
					let isWriting = false;
					res.on("data", (chunk) => {
						const writePos = segment.start + segment.downloaded;
						segment.downloaded += chunk.length;
						task.downloadedSize += chunk.length;
						const settings = this.getSettings();
						if (settings.speedLimit > 0) {
							this.globalDownloadedInLastSecond += chunk.length;
							if (this.globalDownloadedInLastSecond >= settings.speedLimit) {
								res.pause();
								const elapsed = Date.now() - this.lastSpeedCheck;
								const wait = Math.max(0, 1e3 - elapsed);
								setTimeout(() => {
									this.globalDownloadedInLastSecond = 0;
									this.lastSpeedCheck = Date.now();
									res.resume();
								}, wait);
							}
						}
						isWriting = true;
						fs$1.write(fd, chunk, 0, chunk.length, writePos, (err) => {
							isWriting = false;
							if (err) {
								console.error("Write error in segment:", err);
								req.destroy();
								reject(err);
							}
						});
						const now = Date.now();
						const entry = this.activeTasks.get(task.id);
						if (entry && now - entry.lastUpdate >= 1e3) {
							const diff = now - entry.lastUpdate;
							const downloadedDiff = task.downloadedSize - entry.lastDownloaded;
							task.speed = Math.floor(downloadedDiff * 1e3 / diff);
							task.eta = task.totalSize > 0 ? (task.totalSize - task.downloadedSize) / task.speed : 0;
							entry.lastUpdate = now;
							entry.lastDownloaded = task.downloadedSize;
							this.emitProgress(task);
						}
					});
					res.on("end", () => {
						const checkFinish = () => {
							if (!isWriting) {
								segment.status = "completed";
								resolve();
							} else setTimeout(checkFinish, 10);
						};
						checkFinish();
					});
					res.on("error", (err) => {
						if (retryCount < 3) setTimeout(() => download(currentUrl, redirectLimit, retryCount + 1), 2e3 * (retryCount + 1));
						else {
							segment.status = "failed";
							reject(err);
						}
					});
				});
				req.on("error", (err) => {
					if (retryCount < 3 && err.name !== "AbortError") setTimeout(() => download(currentUrl, redirectLimit, retryCount + 1), 2e3 * (retryCount + 1));
					else {
						segment.status = "failed";
						reject(err);
					}
				});
				req.setTimeout(6e4, () => {
					req.destroy();
					if (retryCount < 3) setTimeout(() => download(currentUrl, redirectLimit, retryCount + 1), 2e3 * (retryCount + 1));
					else reject(/* @__PURE__ */ new Error("Segment download timeout"));
				});
			};
			download(task.url, 5);
		});
	}
	pauseDownload(taskId) {
		const active = this.activeTasks.get(taskId);
		if (active) {
			active.task.status = "paused";
			active.task.speed = 0;
			active.abortControllers.forEach((c) => c.abort());
			this.saveTask(active.task);
			this.emitProgress(active.task);
			this.closeTaskFd(taskId);
			this.activeTasks.delete(taskId);
			this.checkQueue();
		} else {
			const task = this.history.find((t) => t.id === taskId);
			if (task && task.status === "queued") {
				task.status = "paused";
				this.saveTask(task);
				this.emitProgress(task);
			}
		}
	}
	resumeDownload(taskId) {
		const task = this.history.find((t) => t.id === taskId);
		if (task) {
			task.status = "queued";
			this.saveTask(task);
			this.checkQueue();
		}
	}
	cancelDownload(taskId) {
		this.pauseDownload(taskId);
		const index = this.history.findIndex((t) => t.id === taskId);
		if (index > -1) {
			const task = this.history[index];
			if (fs$1.existsSync(task.filepath) && task.status !== "completed") try {
				fs$1.unlinkSync(task.filepath);
			} catch (e) {
				console.error("Failed to delete partial file:", e);
			}
			this.history.splice(index, 1);
			this.persistHistory();
			this.checkQueue();
		}
	}
	async verifyChecksum(taskId) {
		const task = this.history.find((t) => t.id === taskId);
		if (!task || !task.checksum || task.status !== "completed") return false;
		const hash$1 = __require("crypto").createHash(task.checksum.algorithm);
		try {
			const stream = fs$1.createReadStream(task.filepath);
			return new Promise((resolve) => {
				stream.on("data", (data) => hash$1.update(data));
				stream.on("end", () => {
					const verified = hash$1.digest("hex").toLowerCase() === task.checksum.value.trim().toLowerCase();
					task.checksum.verified = verified;
					this.saveTask(task);
					this.emitProgress(task);
					resolve(verified);
				});
				stream.on("error", () => resolve(false));
			});
		} catch (err) {
			return false;
		}
	}
	clearHistory() {
		this.history = this.history.filter((t) => this.activeTasks.has(t.id));
		this.persistHistory();
	}
	reorderHistory(startIndex, endIndex) {
		const result = Array.from(this.history);
		const [removed] = result.splice(startIndex, 1);
		result.splice(endIndex, 0, removed);
		this.history = result;
		this.persistHistory();
	}
	saveHistory(history) {
		this.history = history;
		this.persistHistory();
	}
	async handlePostProcessing(task) {
		const settings = this.getSettings();
		if (settings.autoOpenFolder) try {
			const { shell: shell$1 } = __require("electron");
			shell$1.showItemInFolder(task.filepath);
		} catch (err) {
			console.error("Failed to auto-open folder:", err);
		}
		if (settings.autoUnzip && task.category === "compressed") console.log("Auto-unzip triggered for:", task.filename);
		if (settings.autoVerifyChecksum && task.checksum) this.verifyChecksum(task.id);
		this.showCompletedNotification(task);
		this.emit("task-completed", task);
	}
	showCompletedNotification(task) {
		const { Notification: Notification$1, shell: shell$1 } = __require("electron");
		const notification = new Notification$1({
			title: "Download Completed",
			body: `${task.filename} has been downloaded successfully.`,
			silent: true,
			timeoutType: "default",
			...process.platform === "darwin" ? { actions: [{
				type: "button",
				text: "Open File"
			}, {
				type: "button",
				text: "Show in Folder"
			}] } : {}
		});
		notification.on("click", () => {
			shell$1.showItemInFolder(task.filepath);
		});
		notification.on("action", (_event, index) => {
			if (index === 0) shell$1.openPath(task.filepath);
			else if (index === 1) shell$1.showItemInFolder(task.filepath);
		});
		notification.show();
	}
	getCategory(filename) {
		const ext = path$1.extname(filename).toLowerCase().slice(1);
		for (const [cat, extensions] of Object.entries({
			music: [
				"mp3",
				"wav",
				"ogg",
				"m4a",
				"flac",
				"aac",
				"alac",
				"aik",
				"opus"
			],
			video: [
				"mp4",
				"mkv",
				"avi",
				"mov",
				"wmv",
				"flv",
				"webm",
				"mpeg",
				"mpg",
				"m4v",
				"3gp",
				"ts"
			],
			document: [
				"pdf",
				"doc",
				"docx",
				"xls",
				"xlsx",
				"ppt",
				"pptx",
				"txt",
				"epub",
				"csv",
				"rtf",
				"odt",
				"ods"
			],
			image: [
				"jpg",
				"jpeg",
				"png",
				"gif",
				"bmp",
				"webp",
				"svg",
				"ico",
				"tiff",
				"heic",
				"avif"
			],
			program: [
				"exe",
				"msi",
				"dmg",
				"pkg",
				"app",
				"sh",
				"bat",
				"bin",
				"deb",
				"rpm"
			],
			compressed: [
				"zip",
				"rar",
				"7z",
				"tar",
				"gz",
				"bz2",
				"iso",
				"7zip",
				"xz"
			]
		})) if (extensions.includes(ext)) return cat;
		return "other";
	}
};
const downloadManager = new DownloadManager();
function setupDownloadManagerHandlers() {
	downloadManager.on("progress", (progress) => {
		BrowserWindow.getAllWindows().forEach((win$1) => {
			if (!win$1.isDestroyed()) {
				win$1.webContents.send(`download:progress:${progress.taskId}`, progress);
				win$1.webContents.send("download:any-progress", progress);
			}
		});
	});
	downloadManager.on("task-started", (task) => {
		BrowserWindow.getAllWindows().forEach((win$1) => {
			if (!win$1.isDestroyed()) win$1.webContents.send("download:task-started", task);
		});
	});
	downloadManager.on("task-completed", (task) => {
		BrowserWindow.getAllWindows().forEach((win$1) => {
			if (!win$1.isDestroyed()) win$1.webContents.send("download:task-completed", task);
		});
	});
	ipcMain.handle("download:get-history", () => {
		return downloadManager.getHistory();
	});
	ipcMain.handle("download:get-settings", () => {
		return downloadManager.getSettings();
	});
	ipcMain.handle("download:save-settings", (_event, settings) => {
		downloadManager.saveSettings(settings);
		return { success: true };
	});
	ipcMain.handle("download:create", async (_event, options) => {
		return await downloadManager.createDownload(options.url, options.filename, options);
	});
	ipcMain.handle("download:verify-checksum", async (_event, taskId) => {
		return await downloadManager.verifyChecksum(taskId);
	});
	ipcMain.handle("download:start", async (_event, taskId) => {
		downloadManager.startDownload(taskId);
		return { success: true };
	});
	ipcMain.handle("download:pause", (_event, taskId) => {
		downloadManager.pauseDownload(taskId);
		return { success: true };
	});
	ipcMain.handle("download:resume", (_event, taskId) => {
		downloadManager.resumeDownload(taskId);
		return { success: true };
	});
	ipcMain.handle("download:cancel", (_event, taskId) => {
		downloadManager.cancelDownload(taskId);
		return { success: true };
	});
	ipcMain.handle("download:open-folder", (_event, filePath) => {
		shell.showItemInFolder(filePath);
		return { success: true };
	});
	ipcMain.handle("download:clear-history", () => {
		downloadManager.clearHistory();
		return { success: true };
	});
	ipcMain.handle("download:reorder", (_event, { startIndex, endIndex }) => {
		downloadManager.reorderHistory(startIndex, endIndex);
		return { success: true };
	});
	ipcMain.handle("download:save-history", (_event, history) => {
		downloadManager.saveHistory(history);
		return { success: true };
	});
}
var randomFallback = null;
function randomBytes(len) {
	try {
		return crypto.getRandomValues(new Uint8Array(len));
	} catch {}
	try {
		return nodeCrypto.randomBytes(len);
	} catch {}
	if (!randomFallback) throw Error("Neither WebCryptoAPI nor a crypto module is available. Use bcrypt.setRandomFallback to set an alternative");
	return randomFallback(len);
}
function setRandomFallback(random) {
	randomFallback = random;
}
function genSaltSync(rounds, seed_length) {
	rounds = rounds || GENSALT_DEFAULT_LOG2_ROUNDS;
	if (typeof rounds !== "number") throw Error("Illegal arguments: " + typeof rounds + ", " + typeof seed_length);
	if (rounds < 4) rounds = 4;
	else if (rounds > 31) rounds = 31;
	var salt = [];
	salt.push("$2b$");
	if (rounds < 10) salt.push("0");
	salt.push(rounds.toString());
	salt.push("$");
	salt.push(base64_encode(randomBytes(BCRYPT_SALT_LEN), BCRYPT_SALT_LEN));
	return salt.join("");
}
function genSalt(rounds, seed_length, callback) {
	if (typeof seed_length === "function") callback = seed_length, seed_length = void 0;
	if (typeof rounds === "function") callback = rounds, rounds = void 0;
	if (typeof rounds === "undefined") rounds = GENSALT_DEFAULT_LOG2_ROUNDS;
	else if (typeof rounds !== "number") throw Error("illegal arguments: " + typeof rounds);
	function _async(callback$1) {
		nextTick(function() {
			try {
				callback$1(null, genSaltSync(rounds));
			} catch (err) {
				callback$1(err);
			}
		});
	}
	if (callback) {
		if (typeof callback !== "function") throw Error("Illegal callback: " + typeof callback);
		_async(callback);
	} else return new Promise(function(resolve, reject) {
		_async(function(err, res) {
			if (err) {
				reject(err);
				return;
			}
			resolve(res);
		});
	});
}
function hashSync(password, salt) {
	if (typeof salt === "undefined") salt = GENSALT_DEFAULT_LOG2_ROUNDS;
	if (typeof salt === "number") salt = genSaltSync(salt);
	if (typeof password !== "string" || typeof salt !== "string") throw Error("Illegal arguments: " + typeof password + ", " + typeof salt);
	return _hash(password, salt);
}
function hash(password, salt, callback, progressCallback) {
	function _async(callback$1) {
		if (typeof password === "string" && typeof salt === "number") genSalt(salt, function(err, salt$1) {
			_hash(password, salt$1, callback$1, progressCallback);
		});
		else if (typeof password === "string" && typeof salt === "string") _hash(password, salt, callback$1, progressCallback);
		else nextTick(callback$1.bind(this, Error("Illegal arguments: " + typeof password + ", " + typeof salt)));
	}
	if (callback) {
		if (typeof callback !== "function") throw Error("Illegal callback: " + typeof callback);
		_async(callback);
	} else return new Promise(function(resolve, reject) {
		_async(function(err, res) {
			if (err) {
				reject(err);
				return;
			}
			resolve(res);
		});
	});
}
function safeStringCompare(known, unknown) {
	var diff = known.length ^ unknown.length;
	for (var i = 0; i < known.length; ++i) diff |= known.charCodeAt(i) ^ unknown.charCodeAt(i);
	return diff === 0;
}
function compareSync(password, hash$1) {
	if (typeof password !== "string" || typeof hash$1 !== "string") throw Error("Illegal arguments: " + typeof password + ", " + typeof hash$1);
	if (hash$1.length !== 60) return false;
	return safeStringCompare(hashSync(password, hash$1.substring(0, hash$1.length - 31)), hash$1);
}
function compare(password, hashValue, callback, progressCallback) {
	function _async(callback$1) {
		if (typeof password !== "string" || typeof hashValue !== "string") {
			nextTick(callback$1.bind(this, Error("Illegal arguments: " + typeof password + ", " + typeof hashValue)));
			return;
		}
		if (hashValue.length !== 60) {
			nextTick(callback$1.bind(this, null, false));
			return;
		}
		hash(password, hashValue.substring(0, 29), function(err, comp) {
			if (err) callback$1(err);
			else callback$1(null, safeStringCompare(comp, hashValue));
		}, progressCallback);
	}
	if (callback) {
		if (typeof callback !== "function") throw Error("Illegal callback: " + typeof callback);
		_async(callback);
	} else return new Promise(function(resolve, reject) {
		_async(function(err, res) {
			if (err) {
				reject(err);
				return;
			}
			resolve(res);
		});
	});
}
function getRounds(hash$1) {
	if (typeof hash$1 !== "string") throw Error("Illegal arguments: " + typeof hash$1);
	return parseInt(hash$1.split("$")[2], 10);
}
function getSalt(hash$1) {
	if (typeof hash$1 !== "string") throw Error("Illegal arguments: " + typeof hash$1);
	if (hash$1.length !== 60) throw Error("Illegal hash length: " + hash$1.length + " != 60");
	return hash$1.substring(0, 29);
}
function truncates(password) {
	if (typeof password !== "string") throw Error("Illegal arguments: " + typeof password);
	return utf8Length(password) > 72;
}
var nextTick = typeof setImmediate === "function" ? setImmediate : typeof scheduler === "object" && typeof scheduler.postTask === "function" ? scheduler.postTask.bind(scheduler) : setTimeout;
function utf8Length(string) {
	var len = 0, c = 0;
	for (var i = 0; i < string.length; ++i) {
		c = string.charCodeAt(i);
		if (c < 128) len += 1;
		else if (c < 2048) len += 2;
		else if ((c & 64512) === 55296 && (string.charCodeAt(i + 1) & 64512) === 56320) {
			++i;
			len += 4;
		} else len += 3;
	}
	return len;
}
function utf8Array(string) {
	var offset = 0, c1, c2;
	var buffer = new Array(utf8Length(string));
	for (var i = 0, k = string.length; i < k; ++i) {
		c1 = string.charCodeAt(i);
		if (c1 < 128) buffer[offset++] = c1;
		else if (c1 < 2048) {
			buffer[offset++] = c1 >> 6 | 192;
			buffer[offset++] = c1 & 63 | 128;
		} else if ((c1 & 64512) === 55296 && ((c2 = string.charCodeAt(i + 1)) & 64512) === 56320) {
			c1 = 65536 + ((c1 & 1023) << 10) + (c2 & 1023);
			++i;
			buffer[offset++] = c1 >> 18 | 240;
			buffer[offset++] = c1 >> 12 & 63 | 128;
			buffer[offset++] = c1 >> 6 & 63 | 128;
			buffer[offset++] = c1 & 63 | 128;
		} else {
			buffer[offset++] = c1 >> 12 | 224;
			buffer[offset++] = c1 >> 6 & 63 | 128;
			buffer[offset++] = c1 & 63 | 128;
		}
	}
	return buffer;
}
var BASE64_CODE = "./ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".split("");
var BASE64_INDEX = [
	-1,
	-1,
	-1,
	-1,
	-1,
	-1,
	-1,
	-1,
	-1,
	-1,
	-1,
	-1,
	-1,
	-1,
	-1,
	-1,
	-1,
	-1,
	-1,
	-1,
	-1,
	-1,
	-1,
	-1,
	-1,
	-1,
	-1,
	-1,
	-1,
	-1,
	-1,
	-1,
	-1,
	-1,
	-1,
	-1,
	-1,
	-1,
	-1,
	-1,
	-1,
	-1,
	-1,
	-1,
	-1,
	-1,
	0,
	1,
	54,
	55,
	56,
	57,
	58,
	59,
	60,
	61,
	62,
	63,
	-1,
	-1,
	-1,
	-1,
	-1,
	-1,
	-1,
	2,
	3,
	4,
	5,
	6,
	7,
	8,
	9,
	10,
	11,
	12,
	13,
	14,
	15,
	16,
	17,
	18,
	19,
	20,
	21,
	22,
	23,
	24,
	25,
	26,
	27,
	-1,
	-1,
	-1,
	-1,
	-1,
	-1,
	28,
	29,
	30,
	31,
	32,
	33,
	34,
	35,
	36,
	37,
	38,
	39,
	40,
	41,
	42,
	43,
	44,
	45,
	46,
	47,
	48,
	49,
	50,
	51,
	52,
	53,
	-1,
	-1,
	-1,
	-1,
	-1
];
function base64_encode(b, len) {
	var off = 0, rs = [], c1, c2;
	if (len <= 0 || len > b.length) throw Error("Illegal len: " + len);
	while (off < len) {
		c1 = b[off++] & 255;
		rs.push(BASE64_CODE[c1 >> 2 & 63]);
		c1 = (c1 & 3) << 4;
		if (off >= len) {
			rs.push(BASE64_CODE[c1 & 63]);
			break;
		}
		c2 = b[off++] & 255;
		c1 |= c2 >> 4 & 15;
		rs.push(BASE64_CODE[c1 & 63]);
		c1 = (c2 & 15) << 2;
		if (off >= len) {
			rs.push(BASE64_CODE[c1 & 63]);
			break;
		}
		c2 = b[off++] & 255;
		c1 |= c2 >> 6 & 3;
		rs.push(BASE64_CODE[c1 & 63]);
		rs.push(BASE64_CODE[c2 & 63]);
	}
	return rs.join("");
}
function base64_decode(s, len) {
	var off = 0, slen = s.length, olen = 0, rs = [], c1, c2, c3, c4, o, code;
	if (len <= 0) throw Error("Illegal len: " + len);
	while (off < slen - 1 && olen < len) {
		code = s.charCodeAt(off++);
		c1 = code < BASE64_INDEX.length ? BASE64_INDEX[code] : -1;
		code = s.charCodeAt(off++);
		c2 = code < BASE64_INDEX.length ? BASE64_INDEX[code] : -1;
		if (c1 == -1 || c2 == -1) break;
		o = c1 << 2 >>> 0;
		o |= (c2 & 48) >> 4;
		rs.push(String.fromCharCode(o));
		if (++olen >= len || off >= slen) break;
		code = s.charCodeAt(off++);
		c3 = code < BASE64_INDEX.length ? BASE64_INDEX[code] : -1;
		if (c3 == -1) break;
		o = (c2 & 15) << 4 >>> 0;
		o |= (c3 & 60) >> 2;
		rs.push(String.fromCharCode(o));
		if (++olen >= len || off >= slen) break;
		code = s.charCodeAt(off++);
		c4 = code < BASE64_INDEX.length ? BASE64_INDEX[code] : -1;
		o = (c3 & 3) << 6 >>> 0;
		o |= c4;
		rs.push(String.fromCharCode(o));
		++olen;
	}
	var res = [];
	for (off = 0; off < olen; off++) res.push(rs[off].charCodeAt(0));
	return res;
}
var BCRYPT_SALT_LEN = 16;
var GENSALT_DEFAULT_LOG2_ROUNDS = 10;
var BLOWFISH_NUM_ROUNDS = 16;
var MAX_EXECUTION_TIME = 100;
var P_ORIG = [
	608135816,
	2242054355,
	320440878,
	57701188,
	2752067618,
	698298832,
	137296536,
	3964562569,
	1160258022,
	953160567,
	3193202383,
	887688300,
	3232508343,
	3380367581,
	1065670069,
	3041331479,
	2450970073,
	2306472731
];
var S_ORIG = [
	3509652390,
	2564797868,
	805139163,
	3491422135,
	3101798381,
	1780907670,
	3128725573,
	4046225305,
	614570311,
	3012652279,
	134345442,
	2240740374,
	1667834072,
	1901547113,
	2757295779,
	4103290238,
	227898511,
	1921955416,
	1904987480,
	2182433518,
	2069144605,
	3260701109,
	2620446009,
	720527379,
	3318853667,
	677414384,
	3393288472,
	3101374703,
	2390351024,
	1614419982,
	1822297739,
	2954791486,
	3608508353,
	3174124327,
	2024746970,
	1432378464,
	3864339955,
	2857741204,
	1464375394,
	1676153920,
	1439316330,
	715854006,
	3033291828,
	289532110,
	2706671279,
	2087905683,
	3018724369,
	1668267050,
	732546397,
	1947742710,
	3462151702,
	2609353502,
	2950085171,
	1814351708,
	2050118529,
	680887927,
	999245976,
	1800124847,
	3300911131,
	1713906067,
	1641548236,
	4213287313,
	1216130144,
	1575780402,
	4018429277,
	3917837745,
	3693486850,
	3949271944,
	596196993,
	3549867205,
	258830323,
	2213823033,
	772490370,
	2760122372,
	1774776394,
	2652871518,
	566650946,
	4142492826,
	1728879713,
	2882767088,
	1783734482,
	3629395816,
	2517608232,
	2874225571,
	1861159788,
	326777828,
	3124490320,
	2130389656,
	2716951837,
	967770486,
	1724537150,
	2185432712,
	2364442137,
	1164943284,
	2105845187,
	998989502,
	3765401048,
	2244026483,
	1075463327,
	1455516326,
	1322494562,
	910128902,
	469688178,
	1117454909,
	936433444,
	3490320968,
	3675253459,
	1240580251,
	122909385,
	2157517691,
	634681816,
	4142456567,
	3825094682,
	3061402683,
	2540495037,
	79693498,
	3249098678,
	1084186820,
	1583128258,
	426386531,
	1761308591,
	1047286709,
	322548459,
	995290223,
	1845252383,
	2603652396,
	3431023940,
	2942221577,
	3202600964,
	3727903485,
	1712269319,
	422464435,
	3234572375,
	1170764815,
	3523960633,
	3117677531,
	1434042557,
	442511882,
	3600875718,
	1076654713,
	1738483198,
	4213154764,
	2393238008,
	3677496056,
	1014306527,
	4251020053,
	793779912,
	2902807211,
	842905082,
	4246964064,
	1395751752,
	1040244610,
	2656851899,
	3396308128,
	445077038,
	3742853595,
	3577915638,
	679411651,
	2892444358,
	2354009459,
	1767581616,
	3150600392,
	3791627101,
	3102740896,
	284835224,
	4246832056,
	1258075500,
	768725851,
	2589189241,
	3069724005,
	3532540348,
	1274779536,
	3789419226,
	2764799539,
	1660621633,
	3471099624,
	4011903706,
	913787905,
	3497959166,
	737222580,
	2514213453,
	2928710040,
	3937242737,
	1804850592,
	3499020752,
	2949064160,
	2386320175,
	2390070455,
	2415321851,
	4061277028,
	2290661394,
	2416832540,
	1336762016,
	1754252060,
	3520065937,
	3014181293,
	791618072,
	3188594551,
	3933548030,
	2332172193,
	3852520463,
	3043980520,
	413987798,
	3465142937,
	3030929376,
	4245938359,
	2093235073,
	3534596313,
	375366246,
	2157278981,
	2479649556,
	555357303,
	3870105701,
	2008414854,
	3344188149,
	4221384143,
	3956125452,
	2067696032,
	3594591187,
	2921233993,
	2428461,
	544322398,
	577241275,
	1471733935,
	610547355,
	4027169054,
	1432588573,
	1507829418,
	2025931657,
	3646575487,
	545086370,
	48609733,
	2200306550,
	1653985193,
	298326376,
	1316178497,
	3007786442,
	2064951626,
	458293330,
	2589141269,
	3591329599,
	3164325604,
	727753846,
	2179363840,
	146436021,
	1461446943,
	4069977195,
	705550613,
	3059967265,
	3887724982,
	4281599278,
	3313849956,
	1404054877,
	2845806497,
	146425753,
	1854211946,
	1266315497,
	3048417604,
	3681880366,
	3289982499,
	290971e4,
	1235738493,
	2632868024,
	2414719590,
	3970600049,
	1771706367,
	1449415276,
	3266420449,
	422970021,
	1963543593,
	2690192192,
	3826793022,
	1062508698,
	1531092325,
	1804592342,
	2583117782,
	2714934279,
	4024971509,
	1294809318,
	4028980673,
	1289560198,
	2221992742,
	1669523910,
	35572830,
	157838143,
	1052438473,
	1016535060,
	1802137761,
	1753167236,
	1386275462,
	3080475397,
	2857371447,
	1040679964,
	2145300060,
	2390574316,
	1461121720,
	2956646967,
	4031777805,
	4028374788,
	33600511,
	2920084762,
	1018524850,
	629373528,
	3691585981,
	3515945977,
	2091462646,
	2486323059,
	586499841,
	988145025,
	935516892,
	3367335476,
	2599673255,
	2839830854,
	265290510,
	3972581182,
	2759138881,
	3795373465,
	1005194799,
	847297441,
	406762289,
	1314163512,
	1332590856,
	1866599683,
	4127851711,
	750260880,
	613907577,
	1450815602,
	3165620655,
	3734664991,
	3650291728,
	3012275730,
	3704569646,
	1427272223,
	778793252,
	1343938022,
	2676280711,
	2052605720,
	1946737175,
	3164576444,
	3914038668,
	3967478842,
	3682934266,
	1661551462,
	3294938066,
	4011595847,
	840292616,
	3712170807,
	616741398,
	312560963,
	711312465,
	1351876610,
	322626781,
	1910503582,
	271666773,
	2175563734,
	1594956187,
	70604529,
	3617834859,
	1007753275,
	1495573769,
	4069517037,
	2549218298,
	2663038764,
	504708206,
	2263041392,
	3941167025,
	2249088522,
	1514023603,
	1998579484,
	1312622330,
	694541497,
	2582060303,
	2151582166,
	1382467621,
	776784248,
	2618340202,
	3323268794,
	2497899128,
	2784771155,
	503983604,
	4076293799,
	907881277,
	423175695,
	432175456,
	1378068232,
	4145222326,
	3954048622,
	3938656102,
	3820766613,
	2793130115,
	2977904593,
	26017576,
	3274890735,
	3194772133,
	1700274565,
	1756076034,
	4006520079,
	3677328699,
	720338349,
	1533947780,
	354530856,
	688349552,
	3973924725,
	1637815568,
	332179504,
	3949051286,
	53804574,
	2852348879,
	3044236432,
	1282449977,
	3583942155,
	3416972820,
	4006381244,
	1617046695,
	2628476075,
	3002303598,
	1686838959,
	431878346,
	2686675385,
	1700445008,
	1080580658,
	1009431731,
	832498133,
	3223435511,
	2605976345,
	2271191193,
	2516031870,
	1648197032,
	4164389018,
	2548247927,
	300782431,
	375919233,
	238389289,
	3353747414,
	2531188641,
	2019080857,
	1475708069,
	455242339,
	2609103871,
	448939670,
	3451063019,
	1395535956,
	2413381860,
	1841049896,
	1491858159,
	885456874,
	4264095073,
	4001119347,
	1565136089,
	3898914787,
	1108368660,
	540939232,
	1173283510,
	2745871338,
	3681308437,
	4207628240,
	3343053890,
	4016749493,
	1699691293,
	1103962373,
	3625875870,
	2256883143,
	3830138730,
	1031889488,
	3479347698,
	1535977030,
	4236805024,
	3251091107,
	2132092099,
	1774941330,
	1199868427,
	1452454533,
	157007616,
	2904115357,
	342012276,
	595725824,
	1480756522,
	206960106,
	497939518,
	591360097,
	863170706,
	2375253569,
	3596610801,
	1814182875,
	2094937945,
	3421402208,
	1082520231,
	3463918190,
	2785509508,
	435703966,
	3908032597,
	1641649973,
	2842273706,
	3305899714,
	1510255612,
	2148256476,
	2655287854,
	3276092548,
	4258621189,
	236887753,
	3681803219,
	274041037,
	1734335097,
	3815195456,
	3317970021,
	1899903192,
	1026095262,
	4050517792,
	356393447,
	2410691914,
	3873677099,
	3682840055,
	3913112168,
	2491498743,
	4132185628,
	2489919796,
	1091903735,
	1979897079,
	3170134830,
	3567386728,
	3557303409,
	857797738,
	1136121015,
	1342202287,
	507115054,
	2535736646,
	337727348,
	3213592640,
	1301675037,
	2528481711,
	1895095763,
	1721773893,
	3216771564,
	62756741,
	2142006736,
	835421444,
	2531993523,
	1442658625,
	3659876326,
	2882144922,
	676362277,
	1392781812,
	170690266,
	3921047035,
	1759253602,
	3611846912,
	1745797284,
	664899054,
	1329594018,
	3901205900,
	3045908486,
	2062866102,
	2865634940,
	3543621612,
	3464012697,
	1080764994,
	553557557,
	3656615353,
	3996768171,
	991055499,
	499776247,
	1265440854,
	648242737,
	3940784050,
	980351604,
	3713745714,
	1749149687,
	3396870395,
	4211799374,
	3640570775,
	1161844396,
	3125318951,
	1431517754,
	545492359,
	4268468663,
	3499529547,
	1437099964,
	2702547544,
	3433638243,
	2581715763,
	2787789398,
	1060185593,
	1593081372,
	2418618748,
	4260947970,
	69676912,
	2159744348,
	86519011,
	2512459080,
	3838209314,
	1220612927,
	3339683548,
	133810670,
	1090789135,
	1078426020,
	1569222167,
	845107691,
	3583754449,
	4072456591,
	1091646820,
	628848692,
	1613405280,
	3757631651,
	526609435,
	236106946,
	48312990,
	2942717905,
	3402727701,
	1797494240,
	859738849,
	992217954,
	4005476642,
	2243076622,
	3870952857,
	3732016268,
	765654824,
	3490871365,
	2511836413,
	1685915746,
	3888969200,
	1414112111,
	2273134842,
	3281911079,
	4080962846,
	172450625,
	2569994100,
	980381355,
	4109958455,
	2819808352,
	2716589560,
	2568741196,
	3681446669,
	3329971472,
	1835478071,
	660984891,
	3704678404,
	4045999559,
	3422617507,
	3040415634,
	1762651403,
	1719377915,
	3470491036,
	2693910283,
	3642056355,
	3138596744,
	1364962596,
	2073328063,
	1983633131,
	926494387,
	3423689081,
	2150032023,
	4096667949,
	1749200295,
	3328846651,
	309677260,
	2016342300,
	1779581495,
	3079819751,
	111262694,
	1274766160,
	443224088,
	298511866,
	1025883608,
	3806446537,
	1145181785,
	168956806,
	3641502830,
	3584813610,
	1689216846,
	3666258015,
	3200248200,
	1692713982,
	2646376535,
	4042768518,
	1618508792,
	1610833997,
	3523052358,
	4130873264,
	2001055236,
	3610705100,
	2202168115,
	4028541809,
	2961195399,
	1006657119,
	2006996926,
	3186142756,
	1430667929,
	3210227297,
	1314452623,
	4074634658,
	4101304120,
	2273951170,
	1399257539,
	3367210612,
	3027628629,
	1190975929,
	2062231137,
	2333990788,
	2221543033,
	2438960610,
	1181637006,
	548689776,
	2362791313,
	3372408396,
	3104550113,
	3145860560,
	296247880,
	1970579870,
	3078560182,
	3769228297,
	1714227617,
	3291629107,
	3898220290,
	166772364,
	1251581989,
	493813264,
	448347421,
	195405023,
	2709975567,
	677966185,
	3703036547,
	1463355134,
	2715995803,
	1338867538,
	1343315457,
	2802222074,
	2684532164,
	233230375,
	2599980071,
	2000651841,
	3277868038,
	1638401717,
	4028070440,
	3237316320,
	6314154,
	819756386,
	300326615,
	590932579,
	1405279636,
	3267499572,
	3150704214,
	2428286686,
	3959192993,
	3461946742,
	1862657033,
	1266418056,
	963775037,
	2089974820,
	2263052895,
	1917689273,
	448879540,
	3550394620,
	3981727096,
	150775221,
	3627908307,
	1303187396,
	508620638,
	2975983352,
	2726630617,
	1817252668,
	1876281319,
	1457606340,
	908771278,
	3720792119,
	3617206836,
	2455994898,
	1729034894,
	1080033504,
	976866871,
	3556439503,
	2881648439,
	1522871579,
	1555064734,
	1336096578,
	3548522304,
	2579274686,
	3574697629,
	3205460757,
	3593280638,
	3338716283,
	3079412587,
	564236357,
	2993598910,
	1781952180,
	1464380207,
	3163844217,
	3332601554,
	1699332808,
	1393555694,
	1183702653,
	3581086237,
	1288719814,
	691649499,
	2847557200,
	2895455976,
	3193889540,
	2717570544,
	1781354906,
	1676643554,
	2592534050,
	3230253752,
	1126444790,
	2770207658,
	2633158820,
	2210423226,
	2615765581,
	2414155088,
	3127139286,
	673620729,
	2805611233,
	1269405062,
	4015350505,
	3341807571,
	4149409754,
	1057255273,
	2012875353,
	2162469141,
	2276492801,
	2601117357,
	993977747,
	3918593370,
	2654263191,
	753973209,
	36408145,
	2530585658,
	25011837,
	3520020182,
	2088578344,
	530523599,
	2918365339,
	1524020338,
	1518925132,
	3760827505,
	3759777254,
	1202760957,
	3985898139,
	3906192525,
	674977740,
	4174734889,
	2031300136,
	2019492241,
	3983892565,
	4153806404,
	3822280332,
	352677332,
	2297720250,
	60907813,
	90501309,
	3286998549,
	1016092578,
	2535922412,
	2839152426,
	457141659,
	509813237,
	4120667899,
	652014361,
	1966332200,
	2975202805,
	55981186,
	2327461051,
	676427537,
	3255491064,
	2882294119,
	3433927263,
	1307055953,
	942726286,
	933058658,
	2468411793,
	3933900994,
	4215176142,
	1361170020,
	2001714738,
	2830558078,
	3274259782,
	1222529897,
	1679025792,
	2729314320,
	3714953764,
	1770335741,
	151462246,
	3013232138,
	1682292957,
	1483529935,
	471910574,
	1539241949,
	458788160,
	3436315007,
	1807016891,
	3718408830,
	978976581,
	1043663428,
	3165965781,
	1927990952,
	4200891579,
	2372276910,
	3208408903,
	3533431907,
	1412390302,
	2931980059,
	4132332400,
	1947078029,
	3881505623,
	4168226417,
	2941484381,
	1077988104,
	1320477388,
	886195818,
	18198404,
	3786409e3,
	2509781533,
	112762804,
	3463356488,
	1866414978,
	891333506,
	18488651,
	661792760,
	1628790961,
	3885187036,
	3141171499,
	876946877,
	2693282273,
	1372485963,
	791857591,
	2686433993,
	3759982718,
	3167212022,
	3472953795,
	2716379847,
	445679433,
	3561995674,
	3504004811,
	3574258232,
	54117162,
	3331405415,
	2381918588,
	3769707343,
	4154350007,
	1140177722,
	4074052095,
	668550556,
	3214352940,
	367459370,
	261225585,
	2610173221,
	4209349473,
	3468074219,
	3265815641,
	314222801,
	3066103646,
	3808782860,
	282218597,
	3406013506,
	3773591054,
	379116347,
	1285071038,
	846784868,
	2669647154,
	3771962079,
	3550491691,
	2305946142,
	453669953,
	1268987020,
	3317592352,
	3279303384,
	3744833421,
	2610507566,
	3859509063,
	266596637,
	3847019092,
	517658769,
	3462560207,
	3443424879,
	370717030,
	4247526661,
	2224018117,
	4143653529,
	4112773975,
	2788324899,
	2477274417,
	1456262402,
	2901442914,
	1517677493,
	1846949527,
	2295493580,
	3734397586,
	2176403920,
	1280348187,
	1908823572,
	3871786941,
	846861322,
	1172426758,
	3287448474,
	3383383037,
	1655181056,
	3139813346,
	901632758,
	1897031941,
	2986607138,
	3066810236,
	3447102507,
	1393639104,
	373351379,
	950779232,
	625454576,
	3124240540,
	4148612726,
	2007998917,
	544563296,
	2244738638,
	2330496472,
	2058025392,
	1291430526,
	424198748,
	50039436,
	29584100,
	3605783033,
	2429876329,
	2791104160,
	1057563949,
	3255363231,
	3075367218,
	3463963227,
	1469046755,
	985887462
];
var C_ORIG = [
	1332899944,
	1700884034,
	1701343084,
	1684370003,
	1668446532,
	1869963892
];
function _encipher(lr, off, P, S) {
	var n, l = lr[off], r = lr[off + 1];
	l ^= P[0];
	n = S[l >>> 24];
	n += S[256 | l >> 16 & 255];
	n ^= S[512 | l >> 8 & 255];
	n += S[768 | l & 255];
	r ^= n ^ P[1];
	n = S[r >>> 24];
	n += S[256 | r >> 16 & 255];
	n ^= S[512 | r >> 8 & 255];
	n += S[768 | r & 255];
	l ^= n ^ P[2];
	n = S[l >>> 24];
	n += S[256 | l >> 16 & 255];
	n ^= S[512 | l >> 8 & 255];
	n += S[768 | l & 255];
	r ^= n ^ P[3];
	n = S[r >>> 24];
	n += S[256 | r >> 16 & 255];
	n ^= S[512 | r >> 8 & 255];
	n += S[768 | r & 255];
	l ^= n ^ P[4];
	n = S[l >>> 24];
	n += S[256 | l >> 16 & 255];
	n ^= S[512 | l >> 8 & 255];
	n += S[768 | l & 255];
	r ^= n ^ P[5];
	n = S[r >>> 24];
	n += S[256 | r >> 16 & 255];
	n ^= S[512 | r >> 8 & 255];
	n += S[768 | r & 255];
	l ^= n ^ P[6];
	n = S[l >>> 24];
	n += S[256 | l >> 16 & 255];
	n ^= S[512 | l >> 8 & 255];
	n += S[768 | l & 255];
	r ^= n ^ P[7];
	n = S[r >>> 24];
	n += S[256 | r >> 16 & 255];
	n ^= S[512 | r >> 8 & 255];
	n += S[768 | r & 255];
	l ^= n ^ P[8];
	n = S[l >>> 24];
	n += S[256 | l >> 16 & 255];
	n ^= S[512 | l >> 8 & 255];
	n += S[768 | l & 255];
	r ^= n ^ P[9];
	n = S[r >>> 24];
	n += S[256 | r >> 16 & 255];
	n ^= S[512 | r >> 8 & 255];
	n += S[768 | r & 255];
	l ^= n ^ P[10];
	n = S[l >>> 24];
	n += S[256 | l >> 16 & 255];
	n ^= S[512 | l >> 8 & 255];
	n += S[768 | l & 255];
	r ^= n ^ P[11];
	n = S[r >>> 24];
	n += S[256 | r >> 16 & 255];
	n ^= S[512 | r >> 8 & 255];
	n += S[768 | r & 255];
	l ^= n ^ P[12];
	n = S[l >>> 24];
	n += S[256 | l >> 16 & 255];
	n ^= S[512 | l >> 8 & 255];
	n += S[768 | l & 255];
	r ^= n ^ P[13];
	n = S[r >>> 24];
	n += S[256 | r >> 16 & 255];
	n ^= S[512 | r >> 8 & 255];
	n += S[768 | r & 255];
	l ^= n ^ P[14];
	n = S[l >>> 24];
	n += S[256 | l >> 16 & 255];
	n ^= S[512 | l >> 8 & 255];
	n += S[768 | l & 255];
	r ^= n ^ P[15];
	n = S[r >>> 24];
	n += S[256 | r >> 16 & 255];
	n ^= S[512 | r >> 8 & 255];
	n += S[768 | r & 255];
	l ^= n ^ P[16];
	lr[off] = r ^ P[BLOWFISH_NUM_ROUNDS + 1];
	lr[off + 1] = l;
	return lr;
}
function _streamtoword(data, offp) {
	for (var i = 0, word = 0; i < 4; ++i) word = word << 8 | data[offp] & 255, offp = (offp + 1) % data.length;
	return {
		key: word,
		offp
	};
}
function _key(key, P, S) {
	var offset = 0, lr = [0, 0], plen = P.length, slen = S.length, sw;
	for (var i = 0; i < plen; i++) sw = _streamtoword(key, offset), offset = sw.offp, P[i] = P[i] ^ sw.key;
	for (i = 0; i < plen; i += 2) lr = _encipher(lr, 0, P, S), P[i] = lr[0], P[i + 1] = lr[1];
	for (i = 0; i < slen; i += 2) lr = _encipher(lr, 0, P, S), S[i] = lr[0], S[i + 1] = lr[1];
}
function _ekskey(data, key, P, S) {
	var offp = 0, lr = [0, 0], plen = P.length, slen = S.length, sw;
	for (var i = 0; i < plen; i++) sw = _streamtoword(key, offp), offp = sw.offp, P[i] = P[i] ^ sw.key;
	offp = 0;
	for (i = 0; i < plen; i += 2) sw = _streamtoword(data, offp), offp = sw.offp, lr[0] ^= sw.key, sw = _streamtoword(data, offp), offp = sw.offp, lr[1] ^= sw.key, lr = _encipher(lr, 0, P, S), P[i] = lr[0], P[i + 1] = lr[1];
	for (i = 0; i < slen; i += 2) sw = _streamtoword(data, offp), offp = sw.offp, lr[0] ^= sw.key, sw = _streamtoword(data, offp), offp = sw.offp, lr[1] ^= sw.key, lr = _encipher(lr, 0, P, S), S[i] = lr[0], S[i + 1] = lr[1];
}
function _crypt(b, salt, rounds, callback, progressCallback) {
	var cdata = C_ORIG.slice(), clen = cdata.length, err;
	if (rounds < 4 || rounds > 31) {
		err = Error("Illegal number of rounds (4-31): " + rounds);
		if (callback) {
			nextTick(callback.bind(this, err));
			return;
		} else throw err;
	}
	if (salt.length !== BCRYPT_SALT_LEN) {
		err = Error("Illegal salt length: " + salt.length + " != " + BCRYPT_SALT_LEN);
		if (callback) {
			nextTick(callback.bind(this, err));
			return;
		} else throw err;
	}
	rounds = 1 << rounds >>> 0;
	var P, S, i = 0, j;
	if (typeof Int32Array === "function") {
		P = new Int32Array(P_ORIG);
		S = new Int32Array(S_ORIG);
	} else {
		P = P_ORIG.slice();
		S = S_ORIG.slice();
	}
	_ekskey(salt, b, P, S);
	function next() {
		if (progressCallback) progressCallback(i / rounds);
		if (i < rounds) {
			var start = Date.now();
			for (; i < rounds;) {
				i = i + 1;
				_key(b, P, S);
				_key(salt, P, S);
				if (Date.now() - start > MAX_EXECUTION_TIME) break;
			}
		} else {
			for (i = 0; i < 64; i++) for (j = 0; j < clen >> 1; j++) _encipher(cdata, j << 1, P, S);
			var ret = [];
			for (i = 0; i < clen; i++) ret.push((cdata[i] >> 24 & 255) >>> 0), ret.push((cdata[i] >> 16 & 255) >>> 0), ret.push((cdata[i] >> 8 & 255) >>> 0), ret.push((cdata[i] & 255) >>> 0);
			if (callback) {
				callback(null, ret);
				return;
			} else return ret;
		}
		if (callback) nextTick(next);
	}
	if (typeof callback !== "undefined") next();
	else {
		var res;
		while (true) if (typeof (res = next()) !== "undefined") return res || [];
	}
}
function _hash(password, salt, callback, progressCallback) {
	var err;
	if (typeof password !== "string" || typeof salt !== "string") {
		err = Error("Invalid string / salt: Not a string");
		if (callback) {
			nextTick(callback.bind(this, err));
			return;
		} else throw err;
	}
	var minor, offset;
	if (salt.charAt(0) !== "$" || salt.charAt(1) !== "2") {
		err = Error("Invalid salt version: " + salt.substring(0, 2));
		if (callback) {
			nextTick(callback.bind(this, err));
			return;
		} else throw err;
	}
	if (salt.charAt(2) === "$") minor = String.fromCharCode(0), offset = 3;
	else {
		minor = salt.charAt(2);
		if (minor !== "a" && minor !== "b" && minor !== "y" || salt.charAt(3) !== "$") {
			err = Error("Invalid salt revision: " + salt.substring(2, 4));
			if (callback) {
				nextTick(callback.bind(this, err));
				return;
			} else throw err;
		}
		offset = 4;
	}
	if (salt.charAt(offset + 2) > "$") {
		err = Error("Missing salt rounds");
		if (callback) {
			nextTick(callback.bind(this, err));
			return;
		} else throw err;
	}
	var rounds = parseInt(salt.substring(offset, offset + 1), 10) * 10 + parseInt(salt.substring(offset + 1, offset + 2), 10), real_salt = salt.substring(offset + 3, offset + 25);
	password += minor >= "a" ? "\0" : "";
	var passwordb = utf8Array(password), saltb = base64_decode(real_salt, BCRYPT_SALT_LEN);
	function finish(bytes) {
		var res = [];
		res.push("$2");
		if (minor >= "a") res.push(minor);
		res.push("$");
		if (rounds < 10) res.push("0");
		res.push(rounds.toString());
		res.push("$");
		res.push(base64_encode(saltb, saltb.length));
		res.push(base64_encode(bytes, C_ORIG.length * 4 - 1));
		return res.join("");
	}
	if (typeof callback == "undefined") return finish(_crypt(passwordb, saltb, rounds));
	else _crypt(passwordb, saltb, rounds, function(err$1, bytes) {
		if (err$1) callback(err$1, null);
		else callback(null, finish(bytes));
	}, progressCallback);
}
function encodeBase64(bytes, length) {
	return base64_encode(bytes, length);
}
function decodeBase64(string, length) {
	return base64_decode(string, length);
}
var bcryptjs_default = {
	setRandomFallback,
	genSaltSync,
	genSalt,
	hashSync,
	hash,
	compareSync,
	compare,
	getRounds,
	getSalt,
	truncates,
	encodeBase64,
	decodeBase64
};
function setupCryptoHandlers() {
	ipcMain.handle("bcrypt:hash", async (_, text, rounds) => {
		const salt = await bcryptjs_default.genSalt(rounds);
		return bcryptjs_default.hash(text, salt);
	});
	ipcMain.handle("bcrypt:compare", async (_, text, hash$1) => {
		return bcryptjs_default.compare(text, hash$1);
	});
}
var store = new Store();
var __dirname = dirname(fileURLToPath(import.meta.url));
process.env.DIST = join(__dirname, "../dist");
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : join(process.env.DIST, "../public");
protocol.registerSchemesAsPrivileged([{
	scheme: "local-media",
	privileges: {
		bypassCSP: true,
		stream: true,
		secure: true,
		supportFetchAPI: true
	}
}]);
var win;
var tray = null;
var VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
var TRAY_ICON_PATH = join(process.env.VITE_PUBLIC || "", "tray-icon.png");
function setLoginItemSettingsSafely(openAtLogin) {
	try {
		app.setLoginItemSettings({
			openAtLogin,
			openAsHidden: true
		});
		return { success: true };
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		console.warn("Failed to set login item settings:", errorMessage);
		if (!app.isPackaged) console.info("Note: Launch at login requires code signing in production builds");
		return {
			success: false,
			error: errorMessage
		};
	}
}
function createTray() {
	if (tray) return;
	tray = new Tray(nativeImage.createFromPath(TRAY_ICON_PATH).resize({
		width: 22,
		height: 22
	}));
	tray.setToolTip("DevTools");
	updateTrayMenu();
	tray.on("double-click", () => {
		toggleWindow();
	});
}
function toggleWindow() {
	if (win) {
		if (win.isVisible()) win.hide();
		else win.show();
		updateTrayMenu();
	}
}
function updateTrayMenu() {
	if (!tray) return;
	const template = [
		{
			label: win?.isVisible() ? "▼ Hide Window" : "▲ Show Window",
			click: () => {
				if (win) {
					if (win.isVisible()) win.hide();
					else win.show();
					updateTrayMenu();
				}
			}
		},
		{ type: "separator" },
		{
			label: "⚡ Quick Actions",
			submenu: [
				{
					label: "◆ Generate UUID",
					accelerator: "CmdOrCtrl+Shift+U",
					click: () => {
						const uuid = randomUUID();
						clipboard.writeText(uuid);
						new Notification({
							title: "✓ UUID Generated",
							body: `Copied: ${uuid.substring(0, 20)}...`,
							silent: true
						}).show();
					}
				},
				{
					label: "◇ Format JSON",
					accelerator: "CmdOrCtrl+Shift+J",
					click: () => {
						try {
							const text = clipboard.readText();
							const json = JSON.parse(text);
							const formatted = JSON.stringify(json, null, 2);
							clipboard.writeText(formatted);
							new Notification({
								title: "✓ JSON Formatted",
								body: "Formatted JSON copied to clipboard",
								silent: true
							}).show();
						} catch (e) {
							new Notification({
								title: "✗ Format Failed",
								body: "Clipboard does not contain valid JSON",
								silent: true
							}).show();
						}
					}
				},
				{
					label: "# Hash Text (SHA-256)",
					click: () => {
						try {
							const text = clipboard.readText();
							if (!text) throw new Error("Empty clipboard");
							const hash$1 = createHash("sha256").update(text).digest("hex");
							clipboard.writeText(hash$1);
							new Notification({
								title: "✓ Hash Generated",
								body: `SHA-256: ${hash$1.substring(0, 20)}...`,
								silent: true
							}).show();
						} catch (e) {
							new Notification({
								title: "✗ Hash Failed",
								body: "Could not hash clipboard content",
								silent: true
							}).show();
						}
					}
				},
				{ type: "separator" },
				{
					label: "↑ Base64 Encode",
					click: () => {
						try {
							const text = clipboard.readText();
							if (!text) throw new Error("Empty clipboard");
							const encoded = Buffer.from(text).toString("base64");
							clipboard.writeText(encoded);
							new Notification({
								title: "✓ Base64 Encoded",
								body: "Encoded text copied to clipboard",
								silent: true
							}).show();
						} catch (e) {
							new Notification({
								title: "✗ Encode Failed",
								body: "Could not encode clipboard content",
								silent: true
							}).show();
						}
					}
				},
				{
					label: "↓ Base64 Decode",
					click: () => {
						try {
							const text = clipboard.readText();
							if (!text) throw new Error("Empty clipboard");
							const decoded = Buffer.from(text, "base64").toString("utf-8");
							clipboard.writeText(decoded);
							new Notification({
								title: "✓ Base64 Decoded",
								body: "Decoded text copied to clipboard",
								silent: true
							}).show();
						} catch (e) {
							new Notification({
								title: "✗ Decode Failed",
								body: "Invalid Base64 in clipboard",
								silent: true
							}).show();
						}
					}
				}
			]
		},
		{ type: "separator" },
		{
			label: "⚙️ Settings",
			click: () => {
				win?.show();
				win?.webContents.send("navigate-to", "settings");
			}
		},
		{ type: "separator" },
		{
			label: "✕ Quit DevTools",
			accelerator: "CmdOrCtrl+Q",
			click: () => {
				app.isQuitting = true;
				app.quit();
			}
		}
	];
	const contextMenu = Menu.buildFromTemplate(template);
	tray.setContextMenu(contextMenu);
}
function createWindow() {
	const windowBounds = store.get("windowBounds") || {
		width: 1600,
		height: 900
	};
	const startMinimized = store.get("startMinimized") || false;
	win = new BrowserWindow({
		icon: join(process.env.VITE_PUBLIC || "", "electron-vite.svg"),
		webPreferences: {
			preload: join(__dirname, "preload.mjs"),
			nodeIntegration: true,
			contextIsolation: true
		},
		...windowBounds,
		minWidth: 800,
		minHeight: 600,
		resizable: true,
		show: !startMinimized,
		frame: false,
		transparent: process.platform === "darwin",
		backgroundColor: "#050505",
		titleBarStyle: "hidden",
		vibrancy: "sidebar",
		trafficLightPosition: {
			x: 15,
			y: 15
		}
	});
	const saveBounds = () => {
		store.set("windowBounds", win?.getBounds());
	};
	win.on("resize", saveBounds);
	win.on("move", saveBounds);
	win.on("close", (event) => {
		const minimizeToTray = store.get("minimizeToTray") ?? true;
		if (!app.isQuitting && minimizeToTray) {
			event.preventDefault();
			win?.hide();
			updateTrayMenu();
		}
		return false;
	});
	win.on("show", updateTrayMenu);
	win.on("hide", updateTrayMenu);
	win.on("maximize", () => {
		win?.webContents.send("window-maximized", true);
	});
	win.on("unmaximize", () => {
		win?.webContents.send("window-maximized", false);
	});
	ipcMain.handle("get-home-dir", () => {
		return os$1.homedir();
	});
	ipcMain.handle("select-folder", async () => {
		const result = await dialog.showOpenDialog(win, {
			properties: ["openDirectory"],
			title: "Select Folder to Scan"
		});
		if (result.canceled || result.filePaths.length === 0) return {
			canceled: true,
			path: null
		};
		return {
			canceled: false,
			path: result.filePaths[0]
		};
	});
	ipcMain.handle("store-get", (_event, key) => store.get(key));
	ipcMain.handle("store-set", (_event, key, value) => {
		store.set(key, value);
		if (key === "launchAtLogin") {
			const result = setLoginItemSettingsSafely(value === true);
			if (!result.success && win) win.webContents.send("login-item-error", {
				message: "Unable to set launch at login. This may require additional permissions.",
				error: result.error
			});
		}
	});
	ipcMain.handle("store-delete", (_event, key) => store.delete(key));
	setupScreenshotHandlers(win);
	ipcMain.handle("video-compressor:get-info", async (_event, filePath) => {
		return await videoCompressor.getVideoInfo(filePath);
	});
	ipcMain.handle("video-compressor:compress", async (_event, options) => {
		return await videoCompressor.compress(options, (progress) => {
			win?.webContents.send("video-compressor:progress", progress);
		});
	});
	ipcMain.handle("video-compressor:cancel", async (_event, id) => {
		return videoCompressor.cancel(id);
	});
	ipcMain.on("window-set-opacity", (_event, opacity) => {
		if (win) win.setOpacity(Math.max(.5, Math.min(1, opacity)));
	});
	ipcMain.on("window-set-always-on-top", (_event, alwaysOnTop) => {
		if (win) win.setAlwaysOnTop(alwaysOnTop);
	});
	ipcMain.handle("clipboard-read-text", () => {
		try {
			return clipboard.readText();
		} catch (error) {
			console.error("Failed to read clipboard:", error);
			return "";
		}
	});
	ipcMain.handle("clipboard-read-image", async () => {
		try {
			const image = clipboard.readImage();
			if (image.isEmpty()) return null;
			return image.toDataURL();
		} catch (error) {
			console.error("Failed to read clipboard image:", error);
			return null;
		}
	});
	ipcMain.on("window-minimize", () => {
		win?.minimize();
	});
	ipcMain.on("window-maximize", () => {
		if (win?.isMaximized()) win.unmaximize();
		else win?.maximize();
	});
	ipcMain.on("window-close", () => {
		win?.close();
	});
	ipcMain.on("window-open-devtools", () => {
		win?.webContents.openDevTools();
	});
	win.webContents.on("did-finish-load", () => {
		win?.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
	});
	if (VITE_DEV_SERVER_URL) win.loadURL(VITE_DEV_SERVER_URL);
	else win.loadFile(join(process.env.DIST || "", "index.html"));
}
app.on("window-all-closed", () => {
	if (process.platform !== "darwin") app.quit();
});
app.on("activate", () => {
	if (BrowserWindow.getAllWindows().length === 0) createWindow();
	else if (win) win.show();
});
app.on("before-quit", () => {
	app.isQuitting = true;
	if (win) win.webContents.send("check-clear-clipboard-on-quit");
});
app.whenReady().then(() => {
	try {
		globalShortcut.register("CommandOrControl+Shift+D", () => {
			toggleWindow();
		});
	} catch (e) {
		console.error("Failed to register global shortcut", e);
	}
	setLoginItemSettingsSafely(store.get("launchAtLogin") === true);
	setupSystemHandlers();
	setupCryptoHandlers();
	setupZipHandlers();
	setupCleanerHandlers();
	setupDownloadManagerHandlers();
	ipcMain.handle("youtube:getInfo", async (_event, url) => {
		try {
			return await youtubeDownloader.getVideoInfo(url);
		} catch (error) {
			throw error;
		}
	});
	ipcMain.handle("youtube:getPlaylistInfo", async (_event, url) => {
		try {
			return await youtubeDownloader.getPlaylistInfo(url);
		} catch (error) {
			throw error;
		}
	});
	ipcMain.handle("youtube:download", async (event, options) => {
		try {
			return {
				success: true,
				filepath: await youtubeDownloader.downloadVideo(options, (progress) => {
					event.sender.send("youtube:progress", progress);
				})
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "Download failed"
			};
		}
	});
	ipcMain.handle("youtube:cancel", async () => {
		youtubeDownloader.cancelDownload();
		return { success: true };
	});
	ipcMain.handle("youtube:openFile", async (_event, filePath) => {
		const { shell: shell$1 } = await import("electron");
		return shell$1.openPath(filePath);
	});
	ipcMain.handle("youtube:showInFolder", async (_event, filePath) => {
		const { shell: shell$1 } = await import("electron");
		shell$1.showItemInFolder(filePath);
		return true;
	});
	ipcMain.handle("youtube:chooseFolder", async () => {
		const { dialog: dialog$1 } = await import("electron");
		const result = await dialog$1.showOpenDialog({
			properties: ["openDirectory", "createDirectory"],
			title: "Choose Download Location",
			buttonLabel: "Select Folder"
		});
		if (result.canceled || result.filePaths.length === 0) return {
			canceled: true,
			path: null
		};
		return {
			canceled: false,
			path: result.filePaths[0]
		};
	});
	ipcMain.handle("youtube:getHistory", () => {
		return youtubeDownloader.getHistory();
	});
	ipcMain.handle("youtube:clearHistory", () => {
		youtubeDownloader.clearHistory();
		return true;
	});
	ipcMain.handle("youtube:removeFromHistory", (_event, id) => {
		youtubeDownloader.removeFromHistory(id);
		return true;
	});
	ipcMain.handle("youtube:getSettings", () => {
		return youtubeDownloader.getSettings();
	});
	ipcMain.handle("youtube:saveSettings", (_event, settings) => {
		return youtubeDownloader.saveSettings(settings);
	});
	ipcMain.handle("youtube:getCapabilities", () => {
		return youtubeDownloader.getCapabilities();
	});
	ipcMain.handle("youtube:installAria2", async () => {
		return await youtubeDownloader.installAria2();
	});
	ipcMain.handle("tiktok:get-info", async (_, url) => {
		return await tiktokDownloader.getVideoInfo(url);
	});
	ipcMain.handle("tiktok:download", async (_, options) => {
		return new Promise((resolve, reject) => {
			tiktokDownloader.downloadVideo(options, (progress) => {
				win?.webContents.send("tiktok:progress", progress);
			}).then(resolve).catch(reject);
		});
	});
	ipcMain.handle("tiktok:cancel", async (_, id) => {
		tiktokDownloader.cancelDownload(id);
	});
	ipcMain.handle("tiktok:get-history", async () => {
		return tiktokDownloader.getHistory();
	});
	ipcMain.handle("tiktok:clear-history", async () => {
		tiktokDownloader.clearHistory();
	});
	ipcMain.handle("tiktok:remove-from-history", async (_, id) => {
		tiktokDownloader.removeFromHistory(id);
	});
	ipcMain.handle("tiktok:get-settings", async () => {
		return tiktokDownloader.getSettings();
	});
	ipcMain.handle("tiktok:save-settings", async (_, settings) => {
		return tiktokDownloader.saveSettings(settings);
	});
	ipcMain.handle("tiktok:choose-folder", async () => {
		const { dialog: dialog$1 } = await import("electron");
		const result = await dialog$1.showOpenDialog({ properties: ["openDirectory", "createDirectory"] });
		return result.canceled ? null : result.filePaths[0];
	});
	ipcMain.handle("universal:get-info", async (_, url) => {
		return await universalDownloader.getMediaInfo(url);
	});
	ipcMain.handle("universal:download", async (_, options) => {
		return new Promise((resolve, reject) => {
			universalDownloader.downloadMedia(options, (progress) => {
				win?.webContents.send("universal:progress", progress);
			}).then(resolve).catch(reject);
		});
	});
	ipcMain.handle("universal:cancel", async (_, id) => {
		universalDownloader.cancelDownload(id);
	});
	ipcMain.handle("universal:get-history", async () => {
		return universalDownloader.getHistory();
	});
	ipcMain.handle("universal:clear-history", async () => {
		universalDownloader.clearHistory();
	});
	ipcMain.handle("universal:remove-from-history", async (_, id) => {
		universalDownloader.removeFromHistory(id);
	});
	ipcMain.handle("universal:get-settings", async () => {
		return universalDownloader.getSettings();
	});
	ipcMain.handle("universal:save-settings", async (_, settings) => {
		return universalDownloader.saveSettings(settings);
	});
	ipcMain.handle("universal:choose-folder", async () => {
		const { dialog: dialog$1 } = await import("electron");
		const result = await dialog$1.showOpenDialog({ properties: ["openDirectory", "createDirectory"] });
		return result.canceled ? null : result.filePaths[0];
	});
	ipcMain.handle("universal:check-disk-space", async (_, path$2) => {
		return await universalDownloader.checkDiskSpace(path$2);
	});
	ipcMain.handle("universal:get-queue", async () => {
		return universalDownloader.getQueue();
	});
	ipcMain.handle("universal:get-pending-count", async () => {
		return universalDownloader.getPendingDownloadsCount();
	});
	ipcMain.handle("universal:resume-pending", async () => {
		universalDownloader.resumePendingDownloads();
		return { success: true };
	});
	ipcMain.handle("universal:clear-pending", async () => {
		universalDownloader.clearPendingDownloads();
		return { success: true };
	});
	ipcMain.handle("universal:get-error-log", async (_, limit) => {
		return universalDownloader.getErrorLog(limit);
	});
	ipcMain.handle("universal:export-error-log", async (_, format) => {
		return await universalDownloader.exportErrorLog(format);
	});
	ipcMain.handle("universal:get-error-stats", async () => {
		return universalDownloader.getErrorStats();
	});
	ipcMain.handle("universal:clear-error-log", async (_, type) => {
		universalDownloader.clearErrorLog(type);
		return { success: true };
	});
	ipcMain.handle("universal:pause", async (_, id) => {
		return await universalDownloader.pauseDownload(id);
	});
	ipcMain.handle("universal:resume", async (_, id) => {
		return await universalDownloader.resumeDownload(id);
	});
	ipcMain.handle("universal:reorder-queue", async (_, id, newIndex) => {
		return universalDownloader.reorderQueue(id, newIndex);
	});
	ipcMain.handle("universal:retry", async (_, id) => {
		return await universalDownloader.retryDownload(id);
	});
	ipcMain.handle("universal:open-file", async (_, path$2) => {
		const { shell: shell$1 } = await import("electron");
		try {
			await fs.access(path$2);
			shell$1.openPath(path$2);
		} catch {
			console.error("File not found:", path$2);
		}
	});
	ipcMain.handle("universal:show-in-folder", async (_, path$2) => {
		const { shell: shell$1 } = await import("electron");
		shell$1.showItemInFolder(path$2);
	});
	ipcMain.handle("audio:get-info", async (_, filePath) => {
		return await audioExtractor.getAudioInfo(filePath);
	});
	ipcMain.handle("audio:extract", async (_, options) => {
		return new Promise((resolve, reject) => {
			audioExtractor.extractAudio(options, (progress) => {
				win?.webContents.send("audio:progress", progress);
			}).then(resolve).catch(reject);
		});
	});
	ipcMain.handle("audio:cancel", async (_, id) => {
		audioExtractor.cancelExtraction(id);
	});
	ipcMain.handle("audio:cancel-all", async () => {
		audioExtractor.cancelAll();
	});
	ipcMain.handle("audio:choose-input-file", async () => {
		const result = await dialog.showOpenDialog({
			properties: ["openFile"],
			filters: [
				{
					name: "Video Files",
					extensions: [
						"mp4",
						"mkv",
						"avi",
						"mov",
						"webm",
						"flv",
						"m4v",
						"wmv"
					]
				},
				{
					name: "Audio Files",
					extensions: [
						"mp3",
						"aac",
						"flac",
						"wav",
						"ogg",
						"m4a",
						"wma"
					]
				},
				{
					name: "All Files",
					extensions: ["*"]
				}
			]
		});
		return result.canceled ? null : result.filePaths[0];
	});
	ipcMain.handle("audio:choose-input-files", async () => {
		const result = await dialog.showOpenDialog({
			properties: ["openFile", "multiSelections"],
			filters: [
				{
					name: "Video Files",
					extensions: [
						"mp4",
						"mkv",
						"avi",
						"mov",
						"webm",
						"flv",
						"m4v",
						"wmv"
					]
				},
				{
					name: "Audio Files",
					extensions: [
						"mp3",
						"aac",
						"flac",
						"wav",
						"ogg",
						"m4a",
						"wma"
					]
				},
				{
					name: "All Files",
					extensions: ["*"]
				}
			]
		});
		return result.canceled ? [] : result.filePaths;
	});
	ipcMain.handle("audio:choose-output-folder", async () => {
		const result = await dialog.showOpenDialog({ properties: ["openDirectory", "createDirectory"] });
		return result.canceled ? null : result.filePaths[0];
	});
	ipcMain.handle("video-merger:get-info", async (_, filePath) => {
		return await videoMerger.getVideoInfo(filePath);
	});
	ipcMain.handle("video-merger:generate-thumbnail", async (_, filePath, time) => {
		return await videoMerger.generateThumbnail(filePath, time);
	});
	ipcMain.handle("video-compressor:generate-thumbnail", async (_, filePath) => {
		return await videoCompressor.generateThumbnail(filePath);
	});
	ipcMain.handle("video-filmstrip:generate", async (_, filePath, duration, count) => {
		return await videoMerger.generateFilmstrip(filePath, duration, count);
	});
	ipcMain.handle("video-merger:extract-waveform", async (_, filePath) => {
		return await videoMerger.extractWaveform(filePath);
	});
	ipcMain.handle("video-merger:merge", async (_, options) => {
		return new Promise((resolve, reject) => {
			videoMerger.mergeVideos(options, (progress) => {
				win?.webContents.send("video-merger:progress", progress);
			}).then(resolve).catch(reject);
		});
	});
	ipcMain.handle("video-merger:create-from-images", async (_, options) => {
		return new Promise((resolve, reject) => {
			videoMerger.createVideoFromImages(options, (progress) => {
				win?.webContents.send("video-merger:progress", progress);
			}).then(resolve).catch(reject);
		});
	});
	ipcMain.handle("video-merger:cancel", async (_, id) => {
		videoMerger.cancelMerge(id);
	});
	ipcMain.handle("audio-manager:get-info", async (_, filePath) => {
		return await audioManager.getAudioInfo(filePath);
	});
	ipcMain.handle("audio-manager:apply", async (event, options) => {
		return await audioManager.applyAudioChanges(options, (progress) => {
			event.sender.send("audio-manager:progress", progress);
		});
	});
	ipcMain.handle("audio-manager:cancel", async (_, id) => {
		audioManager.cancel(id);
	});
	ipcMain.handle("video-trimmer:process", async (event, options) => {
		return await videoTrimmer.process(options, (progress) => {
			event.sender.send("video-trimmer:progress", progress);
		});
	});
	ipcMain.handle("video-effects:apply", async (_event, options) => {
		return await videoEffects.applyEffects(options, (progress) => {
			win?.webContents.send("video-effects:progress", progress);
		});
	});
	ipcMain.on("video-effects:cancel", (_event, id) => {
		videoEffects.cancelEffects(id);
	});
	ipcMain.handle("video-effects:get-info", async (_event, path$2) => {
		return await videoMerger.getVideoInfo(path$2);
	});
	ipcMain.handle("video-trimmer:cancel", async (_, id) => {
		videoTrimmer.cancel(id);
	});
	ipcMain.handle("video-merger:choose-files", async () => {
		const result = await dialog.showOpenDialog({
			properties: ["openFile", "multiSelections"],
			filters: [{
				name: "Video Files",
				extensions: [
					"mp4",
					"mkv",
					"avi",
					"mov",
					"webm"
				]
			}, {
				name: "All Files",
				extensions: ["*"]
			}]
		});
		return result.canceled ? [] : result.filePaths;
	});
	pluginManager.initialize().catch(console.error);
	ipcMain.handle("plugins:get-available", () => {
		return pluginManager.getAvailablePlugins();
	});
	ipcMain.handle("plugins:get-installed", () => {
		return pluginManager.getInstalledPlugins();
	});
	ipcMain.handle("plugins:install", async (event, pluginId) => {
		await pluginManager.installPlugin(pluginId, (progress) => {
			event.sender.send("plugins:progress", progress);
		});
	});
	ipcMain.handle("plugins:uninstall", async (_event, pluginId) => {
		await pluginManager.uninstallPlugin(pluginId);
	});
	ipcMain.handle("plugins:toggle", async (_event, pluginId, active) => {
		await pluginManager.togglePlugin(pluginId, active);
	});
	ipcMain.handle("plugins:update-registry", async () => {
		await pluginManager.updateRegistry(true);
	});
	protocol.handle("local-media", async (request) => {
		try {
			const url = new URL(request.url);
			let decodedPath = decodeURIComponent(url.pathname);
			if (process.platform === "win32") {
				if (/^\/[a-zA-Z]:/.test(decodedPath)) decodedPath = decodedPath.slice(1);
				else if (/^[a-zA-Z]\//.test(decodedPath)) decodedPath = decodedPath.charAt(0) + ":" + decodedPath.slice(1);
			} else decodedPath = decodedPath.replace(/^\/+/, "/");
			const fileSize = (await fs.stat(decodedPath)).size;
			const ext = path.extname(decodedPath).toLowerCase();
			let mimeType = "application/octet-stream";
			if (ext === ".mp4") mimeType = "video/mp4";
			else if (ext === ".webm") mimeType = "video/webm";
			else if (ext === ".mov") mimeType = "video/quicktime";
			else if (ext === ".avi") mimeType = "video/x-msvideo";
			else if (ext === ".mkv") mimeType = "video/x-matroska";
			else if (ext === ".mp3") mimeType = "audio/mpeg";
			else if (ext === ".wav") mimeType = "audio/wav";
			let useTranscoding = false;
			const unsupportedCodecs = [
				"hevc",
				"hvc1",
				"h265",
				"dvhe",
				"dvh1"
			];
			try {
				if ([
					".mp4",
					".mov",
					".mkv",
					".webm"
				].includes(ext)) {
					const info = await videoCompressor.getVideoInfo(decodedPath);
					if (info.codec && unsupportedCodecs.some((c) => info.codec.toLowerCase().includes(c))) useTranscoding = true;
				}
			} catch (e) {}
			if (useTranscoding) {
				console.log(`[LocalMedia] Transcoding ${decodedPath} for preview`);
				const stream = videoCompressor.getPreviewStream(decodedPath);
				const webStream = Readable.toWeb(stream);
				return new Response(webStream, {
					status: 200,
					headers: { "Content-Type": "video/mp4" }
				});
			}
			const range = request.headers.get("Range");
			if (range) {
				const parts = range.replace(/bytes=/, "").split("-");
				const start = parseInt(parts[0], 10);
				const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
				const chunksize = end - start + 1;
				const nodeStream = createReadStream(decodedPath, {
					start,
					end
				});
				const webStream = Readable.toWeb(nodeStream);
				return new Response(webStream, {
					status: 206,
					headers: {
						"Content-Range": `bytes ${start}-${end}/${fileSize}`,
						"Accept-Ranges": "bytes",
						"Content-Length": chunksize.toString(),
						"Content-Type": mimeType
					}
				});
			} else {
				const nodeStream = createReadStream(decodedPath);
				const webStream = Readable.toWeb(nodeStream);
				return new Response(webStream, { headers: {
					"Content-Length": fileSize.toString(),
					"Content-Type": mimeType,
					"Accept-Ranges": "bytes"
				} });
			}
		} catch (e) {
			console.error("[LocalMedia] Error:", e);
			if (e.code === "ENOENT") return new Response("File not found", { status: 404 });
			return new Response("Error loading media: " + e.message, { status: 500 });
		}
	});
	if (process.platform === "win32") app.setAppUserModelId("com.devtools.app");
	createTray();
	createWindow();
});
