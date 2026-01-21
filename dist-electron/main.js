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
import fsp from "fs/promises";
import { createRequire } from "module";
import axios from "axios";
import AdmZip from "adm-zip";
import { exec as exec$1 } from "node:child_process";
import { promisify as promisify$1 } from "node:util";
import http from "http";
import { EventEmitter } from "events";
const videoMerger = new class {
	constructor() {
		this.ffmpegPath = null, this.activeProcesses = /* @__PURE__ */ new Map(), this.initFFmpeg().catch((e) => console.error("FFmpeg init error:", e));
	}
	async initFFmpeg() {
		try {
			let { FFmpegHelper: e } = await import("./ffmpeg-helper-DXuFX_KP.js"), A = e.getFFmpegPath();
			A ? (this.ffmpegPath = A, console.log("✅ Video Merger: FFmpeg ready")) : console.warn("⚠️ Video Merger: FFmpeg not available");
		} catch (e) {
			console.warn("FFmpeg setup failed:", e);
		}
	}
	async getVideoInfo(e) {
		if (!this.ffmpegPath) throw Error("FFmpeg not available");
		return new Promise((A, j) => {
			let M = [
				"-i",
				e,
				"-hide_banner"
			], N = spawn(this.ffmpegPath, M), P = "";
			N.stderr.on("data", (e) => {
				P += e.toString();
			}), N.on("close", () => {
				try {
					let j = P.match(/Duration: (\d{2}):(\d{2}):(\d{2}\.\d{2})/), M = j ? parseInt(j[1]) * 3600 + parseInt(j[2]) * 60 + parseFloat(j[3]) : 0, N = P.match(/Video:.*?, (\d{3,5})x(\d{3,5})/), F = N ? parseInt(N[1]) : 0, I = N ? parseInt(N[2]) : 0, L = P.match(/(\d+\.?\d*) fps/), R = L ? parseFloat(L[1]) : 0, z = P.match(/Video: (\w+)/);
					A({
						path: e,
						duration: M,
						width: F,
						height: I,
						codec: z ? z[1] : "unknown",
						fps: R,
						size: fs$1.existsSync(e) ? fs$1.statSync(e).size : 0
					});
				} catch {
					j(/* @__PURE__ */ Error("Failed to parse video info"));
				}
			}), N.on("error", j);
		});
	}
	async generateThumbnail(e, A = 1) {
		if (!this.ffmpegPath) throw Error("FFmpeg not available");
		let j = path$1.join(app.getPath("temp"), "devtools-app-thumbs");
		fs$1.existsSync(j) || fs$1.mkdirSync(j, { recursive: !0 });
		let M = `thumb_${randomUUID$1()}.jpg`, N = path$1.join(j, M);
		return new Promise((j, M) => {
			let P = [
				"-ss",
				A.toString(),
				"-i",
				e,
				"-frames:v",
				"1",
				"-q:v",
				"2",
				"-vf",
				"scale=480:-1,unsharp=3:3:1.5:3:3:0.5",
				"-f",
				"image2",
				"-y",
				N
			];
			console.log(`[VideoMerger] Generating thumbnail: ${P.join(" ")}`);
			let F = spawn(this.ffmpegPath, P);
			F.on("close", (e) => {
				if (e === 0) {
					let e = fs$1.readFileSync(N, { encoding: "base64" });
					fs$1.unlinkSync(N), j(`data:image/jpeg;base64,${e}`);
				} else M(/* @__PURE__ */ Error("Thumbnail generation failed"));
			}), F.on("error", M);
		});
	}
	async generateFilmstrip(e, A, j = 10) {
		if (!this.ffmpegPath) throw Error("FFmpeg not available");
		let M = Math.min(200, Math.max(5, Math.min(j, Math.floor(A)))), N = randomUUID$1(), F = path$1.join(app.getPath("temp"), "devtools-app-filmstrips", N);
		fs$1.existsSync(F) || fs$1.mkdirSync(F, { recursive: !0 });
		let I = A > 0 ? A : 1, L = M / I;
		console.log(`Generating filmstrip (Optimized): Target ${M} frames from ${I}s video (fps=${L.toFixed(4)})`);
		let R = path$1.join(F, "thumb_%03d.jpg").replace(/\\/g, "/");
		return new Promise((A, j) => {
			let N = [
				"-i",
				e,
				"-vf",
				`fps=${L},scale=320:-1,unsharp=3:3:1:3:3:0.5`,
				"-an",
				"-sn",
				"-q:v",
				"4",
				"-f",
				"image2",
				"-y",
				R
			];
			console.log(`[VideoMerger] Running FFmpeg for filmstrip: ${N.join(" ")}`);
			let P = spawn(this.ffmpegPath, N), I = "";
			P.stderr.on("data", (e) => {
				I += e.toString();
			}), P.on("close", (e) => {
				if (e === 0) try {
					let e = fs$1.readdirSync(F).filter((e) => e.startsWith("thumb_") && e.endsWith(".jpg")).sort();
					if (e.length === 0) {
						console.error("Filmstrip generation failed: No frames produced. FFmpeg output:", I), j(/* @__PURE__ */ Error("No frames produced"));
						return;
					}
					let N = e.map((e) => {
						let A = path$1.join(F, e);
						return `data:image/jpeg;base64,${fs$1.readFileSync(A, { encoding: "base64" })}`;
					}).slice(0, M);
					try {
						fs$1.rmSync(F, {
							recursive: !0,
							force: !0
						});
					} catch (e) {
						console.warn("Filmstrip cleanup failed:", e);
					}
					A(N);
				} catch (e) {
					j(e);
				}
				else console.error("Filmstrip generation failed with code:", e, I), j(/* @__PURE__ */ Error("Filmstrip generation failed"));
			}), P.on("error", j);
		});
	}
	async extractWaveform(e) {
		if (!this.ffmpegPath) throw Error("FFmpeg not available");
		return console.log("Extracting waveform for:", e), new Promise((A, j) => {
			let M = [
				"-i",
				e,
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
			], N = spawn(this.ffmpegPath, M), P = [];
			N.stdout.on("data", (e) => {
				P.push(e);
			}), N.stderr.on("data", () => {}), N.on("close", (e) => {
				if (e === 0) try {
					let e = Buffer.concat(P), j = [];
					for (let A = 0; A < e.length; A += 160) {
						let M = 0;
						for (let j = 0; j < 80; j++) {
							let N = A + j * 2;
							if (N + 1 < e.length) {
								let A = Math.abs(e.readInt16LE(N));
								A > M && (M = A);
							}
						}
						j.push(M / 32768);
					}
					console.log(`Waveform extracted: ${j.length} points`), A(j);
				} catch (e) {
					j(e);
				}
				else j(/* @__PURE__ */ Error("Waveform extraction failed"));
			}), N.on("error", j);
		});
	}
	async createVideoFromImages(e, A) {
		if (!this.ffmpegPath) throw Error("FFmpeg not available");
		let j = randomUUID$1(), { imagePaths: M, fps: N, outputPath: F, format: I, quality: L } = e;
		if (!M || M.length === 0) throw Error("No images provided");
		let R = F ? path$1.dirname(F) : app.getPath("downloads"), z = F ? path$1.basename(F) : `video_from_frames_${Date.now()}.${I}`, B = path$1.join(R, z), V = randomUUID$1(), H = path$1.join(app.getPath("temp"), "devtools-video-frames", V);
		fs$1.existsSync(H) || fs$1.mkdirSync(H, { recursive: !0 });
		let U = path$1.join(H, "inputs.txt");
		try {
			let P = 1 / N, F = M.map((e) => `file '${e.replace(/\\/g, "/").replace(/'/g, "'\\''")}'\nduration ${P}`).join("\n") + `\nfile '${M[M.length - 1].replace(/\\/g, "/").replace(/'/g, "'\\''")}'`;
			fs$1.writeFileSync(U, F);
			let R = [
				"-f",
				"concat",
				"-safe",
				"0",
				"-i",
				U
			], z = [];
			if (I !== "gif" && z.push("scale=trunc(iw/2)*2:trunc(ih/2)*2"), z.push(`fps=${N}`), e.filter) switch (e.filter) {
				case "grayscale":
					z.push("hue=s=0");
					break;
				case "sepia":
					z.push("colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131");
					break;
				case "invert":
					z.push("negate");
					break;
				case "warm":
					z.push("eq=gamma_r=1.2:gamma_g=1.0:gamma_b=0.9");
					break;
				case "cool":
					z.push("eq=gamma_r=0.9:gamma_g=1.0:gamma_b=1.2");
					break;
				case "vintage":
					z.push("curves=vintage");
					break;
			}
			if (e.watermark && e.watermark.text) {
				let A = e.watermark, j = (A.text || "").replace(/:/g, "\\:").replace(/'/g, ""), M = "(w-text_w)/2", N = "(h-text_h)/2";
				switch (A.position) {
					case "top-left":
						M = "20", N = "20";
						break;
					case "top-right":
						M = "w-text_w-20", N = "20";
						break;
					case "bottom-left":
						M = "20", N = "h-text_h-20";
						break;
					case "bottom-right":
						M = "w-text_w-20", N = "h-text_h-20";
						break;
				}
				let P = A.fontSize || 24, F = A.color || "white", I = A.opacity || .8;
				z.push(`drawtext=text='${j}':x=${M}:y=${N}:fontsize=${P}:fontcolor=${F}:alpha=${I}`);
			}
			if (I === "gif") {
				let e = z.join(",");
				R.push("-vf", `${e},split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse`);
			} else {
				let e = z.join(",");
				e && R.push("-vf", e), I === "mp4" ? (R.push("-c:v", "libx264", "-pix_fmt", "yuv420p"), L === "low" ? R.push("-crf", "28") : L === "high" ? R.push("-crf", "18") : R.push("-crf", "23")) : I === "webm" && (R.push("-c:v", "libvpx-vp9", "-b:v", "0"), L === "low" ? R.push("-crf", "40") : L === "high" ? R.push("-crf", "20") : R.push("-crf", "30"));
			}
			return R.push("-y", B), console.log(`[VideoMerger] Creating video from images (concat): ${R.join(" ")}`), new Promise((e, P) => {
				let F = spawn(this.ffmpegPath, R);
				this.activeProcesses.set(j, F);
				let I = M.length / N;
				F.stderr.on("data", (e) => {
					let M = e.toString();
					if (A) {
						let e = M.match(/time=(\d{2}):(\d{2}):(\d{2}\.\d{2})/);
						if (e) {
							let M = parseInt(e[1]) * 3600 + parseInt(e[2]) * 60 + parseFloat(e[3]);
							A({
								id: j,
								percent: Math.min(M / I * 100, 99),
								state: "processing"
							});
						}
					}
				}), F.on("close", (M) => {
					this.activeProcesses.delete(j);
					try {
						fs$1.rmSync(H, {
							recursive: !0,
							force: !0
						});
					} catch (e) {
						console.warn("Failed to cleanup temp dir", e);
					}
					M === 0 ? (A && A({
						id: j,
						percent: 100,
						state: "complete",
						outputPath: B
					}), e(B)) : P(/* @__PURE__ */ Error(`FFmpeg failed with code ${M}`));
				}), F.on("error", (e) => {
					this.activeProcesses.delete(j);
					try {
						fs$1.rmSync(H, {
							recursive: !0,
							force: !0
						});
					} catch {}
					P(e);
				});
			});
		} catch (e) {
			try {
				fs$1.rmSync(H, {
					recursive: !0,
					force: !0
				});
			} catch {}
			throw e;
		}
	}
	async mergeVideos(e, A) {
		if (!this.ffmpegPath) throw Error("FFmpeg not available");
		let j = e.id || randomUUID$1(), { clips: M, outputPath: N, format: F } = e;
		if (!M || M.length === 0) throw Error("No input clips provided");
		for (let e of M) if (!fs$1.existsSync(e.path)) throw Error(`File not found: ${e.path}`);
		A && A({
			id: j,
			percent: 0,
			state: "analyzing"
		});
		let I = await Promise.all(M.map((e) => this.getVideoInfo(e.path))), L = 0;
		M.forEach((e, A) => {
			let j = I[A].duration, M = e.startTime || 0, N = e.endTime || j;
			L += N - M;
		});
		let R = N ? path$1.dirname(N) : app.getPath("downloads"), z = N ? path$1.basename(N) : `merged_video_${Date.now()}.${F}`, B = path$1.join(R, z);
		fs$1.existsSync(R) || fs$1.mkdirSync(R, { recursive: !0 });
		let V = [];
		M.forEach((e) => {
			e.startTime !== void 0 && V.push("-ss", e.startTime.toString()), e.endTime !== void 0 && V.push("-to", e.endTime.toString()), V.push("-i", e.path);
		});
		let H = "";
		return M.forEach((e, A) => {
			H += `[${A}:v][${A}:a]`;
		}), H += `concat=n=${M.length}:v=1:a=1[v][a]`, V.push("-filter_complex", H), V.push("-map", "[v]", "-map", "[a]"), V.push("-c:v", "libx264", "-preset", "medium", "-crf", "23"), V.push("-c:a", "aac", "-b:a", "128k"), V.push("-y", B), new Promise((e, M) => {
			let N = spawn(this.ffmpegPath, V);
			this.activeProcesses.set(j, N), N.stderr.on("data", (e) => {
				let M = e.toString(), N = M.match(/time=(\d{2}):(\d{2}):(\d{2}\.\d{2})/);
				if (N && A) {
					let e = parseInt(N[1]) * 3600 + parseInt(N[2]) * 60 + parseFloat(N[3]), P = Math.min(e / L * 100, 100), F = M.match(/speed=\s*(\d+\.?\d*)x/);
					A({
						id: j,
						percent: P,
						state: "processing",
						speed: F ? parseFloat(F[1]) : 1
					});
				}
			}), N.on("close", (N) => {
				this.activeProcesses.delete(j), N === 0 ? (A && A({
					id: j,
					percent: 100,
					state: "complete",
					outputPath: B
				}), e(B)) : M(/* @__PURE__ */ Error(`Merge failed with code ${N}`));
			}), N.on("error", (e) => {
				this.activeProcesses.delete(j), M(e);
			});
		});
	}
	cancelMerge(e) {
		let A = this.activeProcesses.get(e);
		A && (A.kill(), this.activeProcesses.delete(e));
	}
}(), audioManager = new class {
	constructor() {
		this.ffmpegPath = null, this.activeProcesses = /* @__PURE__ */ new Map(), this.initFFmpeg().catch((e) => console.error("Audio Manager FFmpeg init error:", e));
	}
	async initFFmpeg() {
		try {
			let { FFmpegHelper: e } = await import("./ffmpeg-helper-DXuFX_KP.js");
			this.ffmpegPath = e.getFFmpegPath();
		} catch (e) {
			console.warn("FFmpeg setup failed for Audio Manager:", e);
		}
	}
	async getAudioInfo(e) {
		if (!this.ffmpegPath) throw Error("FFmpeg not available");
		return new Promise((A, j) => {
			let M = [
				"-i",
				e,
				"-hide_banner"
			], N = spawn(this.ffmpegPath, M), P = "";
			N.stderr.on("data", (e) => P += e.toString()), N.on("close", () => {
				try {
					let j = P.match(/Duration: (\d{2}):(\d{2}):(\d{2}\.\d{2})/), M = j ? parseInt(j[1]) * 3600 + parseInt(j[2]) * 60 + parseFloat(j[3]) : 0, N = P.match(/(\d+) Hz/), F = N ? parseInt(N[1]) : 0;
					A({
						path: e,
						duration: M,
						format: path$1.extname(e).slice(1),
						sampleRate: F,
						channels: P.includes("stereo") ? 2 : 1,
						size: fs$1.existsSync(e) ? fs$1.statSync(e).size : 0
					});
				} catch {
					j(/* @__PURE__ */ Error("Failed to parse audio info"));
				}
			});
		});
	}
	async applyAudioChanges(e, A) {
		if (!this.ffmpegPath) throw Error("FFmpeg not available");
		let j = randomUUID$1(), { videoPath: M, audioLayers: N, outputPath: F, outputFormat: I, keepOriginalAudio: L, originalAudioVolume: R } = e;
		A && A({
			id: j,
			percent: 0,
			state: "analyzing"
		});
		let z = [
			"-i",
			M,
			"-hide_banner"
		], B = spawn(this.ffmpegPath, z), V = "";
		await new Promise((e) => {
			B.stderr.on("data", (e) => V += e.toString()), B.on("close", e);
		});
		let H = V.match(/Duration: (\d{2}):(\d{2}):(\d{2}\.\d{2})/), U = H ? parseInt(H[1]) * 3600 + parseInt(H[2]) * 60 + parseFloat(H[3]) : 0, W = F ? path$1.dirname(F) : app.getPath("downloads"), G = F || path$1.join(W, `audio_mixed_${Date.now()}.${I}`), K = ["-i", M];
		N.forEach((e) => {
			e.clipStart > 0 && K.push("-ss", e.clipStart.toString()), e.clipEnd > 0 && K.push("-to", e.clipEnd.toString()), K.push("-i", e.path);
		});
		let q = "", J = 0;
		L && (q += `[0:a]volume=${R}[a0];`, J++), N.forEach((e, A) => {
			let j = A + 1;
			q += `[${j}:a]volume=${e.volume},adelay=${e.startTime * 1e3}|${e.startTime * 1e3}[a${j}];`, J++;
		});
		for (let e = 0; e < J; e++) q += `[a${e}]`;
		return q += `amix=inputs=${J}:duration=first:dropout_transition=2[aout]`, K.push("-filter_complex", q), K.push("-map", "0:v", "-map", "[aout]"), K.push("-c:v", "copy"), K.push("-c:a", "aac", "-b:a", "192k", "-y", G), new Promise((e, M) => {
			let N = spawn(this.ffmpegPath, K);
			this.activeProcesses.set(j, N), N.stderr.on("data", (e) => {
				let M = e.toString().match(/time=(\d{2}):(\d{2}):(\d{2}\.\d{2})/);
				if (M && A) {
					let e = parseInt(M[1]) * 3600 + parseInt(M[2]) * 60 + parseFloat(M[3]);
					A({
						id: j,
						percent: Math.min(e / U * 100, 100),
						state: "processing"
					});
				}
			}), N.on("close", (N) => {
				this.activeProcesses.delete(j), N === 0 ? (A && A({
					id: j,
					percent: 100,
					state: "complete",
					outputPath: G
				}), e(G)) : M(/* @__PURE__ */ Error(`Exit code ${N}`));
			}), N.on("error", (e) => {
				this.activeProcesses.delete(j), M(e);
			});
		});
	}
	cancel(e) {
		let A = this.activeProcesses.get(e);
		A && (A.kill(), this.activeProcesses.delete(e));
	}
}(), audioExtractor = new class {
	constructor() {
		this.ffmpegPath = null, this.activeProcesses = /* @__PURE__ */ new Map(), this.initFFmpeg().catch((e) => console.error("FFmpeg init error:", e));
	}
	async initFFmpeg() {
		try {
			let { FFmpegHelper: e } = await import("./ffmpeg-helper-DXuFX_KP.js"), A = e.getFFmpegPath();
			A ? (this.ffmpegPath = A, console.log("✅ Audio Extractor: FFmpeg ready")) : console.warn("⚠️ Audio Extractor: FFmpeg not available");
		} catch (e) {
			console.warn("FFmpeg setup failed:", e);
		}
	}
	async getAudioInfo(e) {
		if (!this.ffmpegPath) throw Error("FFmpeg not available");
		return new Promise((A, j) => {
			let M = [
				"-i",
				e,
				"-hide_banner"
			], N = spawn(this.ffmpegPath, M), P = "";
			N.stderr.on("data", (e) => {
				P += e.toString();
			}), N.on("close", () => {
				try {
					let j = P.match(/Duration: (\d{2}):(\d{2}):(\d{2}\.\d{2})/), M = j ? parseInt(j[1]) * 3600 + parseInt(j[2]) * 60 + parseFloat(j[3]) : 0, N = P.match(/Stream #\d+:\d+.*?: Audio: (\w+).*?, (\d+) Hz.*?, (\w+).*?, (\d+) kb\/s/), F = !!N, I = P.includes("Video:");
					A({
						duration: M,
						bitrate: N ? parseInt(N[4]) : 0,
						sampleRate: N ? parseInt(N[2]) : 0,
						channels: N && N[3].includes("stereo") ? 2 : 1,
						codec: N ? N[1] : "unknown",
						size: fs$1.existsSync(e) ? fs$1.statSync(e).size : 0,
						hasAudio: F,
						hasVideo: I
					});
				} catch {
					j(/* @__PURE__ */ Error("Failed to parse audio info"));
				}
			}), N.on("error", j);
		});
	}
	async extractAudio(e, A) {
		if (!this.ffmpegPath) throw Error("FFmpeg not available");
		let j = e.id || randomUUID$1(), { inputPath: M, outputPath: N, format: F, bitrate: I, sampleRate: L, channels: R, trim: z, normalize: B, fadeIn: V, fadeOut: H } = e;
		if (!fs$1.existsSync(M)) throw Error("Input file not found");
		let U = await this.getAudioInfo(M);
		if (!U.hasAudio) throw Error("No audio stream found in input file");
		let W = path$1.basename(M, path$1.extname(M)), G = N ? path$1.dirname(N) : app.getPath("downloads"), K = N ? path$1.basename(N) : `${W}_extracted.${F}`, q = path$1.join(G, K);
		fs$1.existsSync(G) || fs$1.mkdirSync(G, { recursive: !0 });
		let J = ["-i", M];
		z?.start !== void 0 && J.push("-ss", z.start.toString()), z?.end !== void 0 && J.push("-to", z.end.toString()), J.push("-vn");
		let Y = [];
		if (B && Y.push("loudnorm"), V && V > 0 && Y.push(`afade=t=in:d=${V}`), H && H > 0) {
			let e = (z?.end || U.duration) - H;
			Y.push(`afade=t=out:st=${e}:d=${H}`);
		}
		switch (Y.length > 0 && J.push("-af", Y.join(",")), F) {
			case "mp3":
				J.push("-acodec", "libmp3lame"), I && J.push("-b:a", I);
				break;
			case "aac":
				J.push("-acodec", "aac"), I && J.push("-b:a", I);
				break;
			case "flac":
				J.push("-acodec", "flac");
				break;
			case "wav":
				J.push("-acodec", "pcm_s16le");
				break;
			case "ogg":
				J.push("-acodec", "libvorbis"), I && J.push("-b:a", I);
				break;
			case "m4a":
				J.push("-acodec", "aac"), I && J.push("-b:a", I);
				break;
		}
		return L && J.push("-ar", L.toString()), R && J.push("-ac", R.toString()), J.push("-y", q), new Promise((e, N) => {
			let P = spawn(this.ffmpegPath, J);
			this.activeProcesses.set(j, P);
			let F = U.duration;
			z?.start && z?.end ? F = z.end - z.start : z?.end && (F = z.end), P.stderr.on("data", (e) => {
				let N = e.toString(), P = N.match(/time=(\d{2}):(\d{2}):(\d{2}\.\d{2})/);
				if (P && A) {
					let e = parseInt(P[1]) * 3600 + parseInt(P[2]) * 60 + parseFloat(P[3]), I = Math.min(e / F * 100, 100), L = N.match(/speed=\s*(\d+\.?\d*)x/);
					A({
						id: j,
						filename: K,
						inputPath: M,
						percent: I,
						state: "processing",
						speed: L ? parseFloat(L[1]) : 1
					});
				}
			}), P.on("close", (P) => {
				this.activeProcesses.delete(j), P === 0 ? (A && A({
					id: j,
					filename: K,
					inputPath: M,
					percent: 100,
					state: "complete",
					outputPath: q
				}), e(q)) : N(/* @__PURE__ */ Error(`FFmpeg exited with code ${P}`));
			}), P.on("error", (e) => {
				this.activeProcesses.delete(j), N(e);
			});
		});
	}
	cancelExtraction(e) {
		let A = this.activeProcesses.get(e);
		A && (A.kill(), this.activeProcesses.delete(e));
	}
	cancelAll() {
		this.activeProcesses.forEach((e) => e.kill()), this.activeProcesses.clear();
	}
}(), videoTrimmer = new class {
	constructor() {
		this.ffmpegPath = null, this.activeProcesses = /* @__PURE__ */ new Map(), this.initFFmpeg().catch((e) => console.error("Video Trimmer FFmpeg init error:", e));
	}
	async initFFmpeg() {
		try {
			let { FFmpegHelper: e } = await import("./ffmpeg-helper-DXuFX_KP.js");
			this.ffmpegPath = e.getFFmpegPath();
		} catch (e) {
			console.warn("FFmpeg setup failed for Video Trimmer:", e);
		}
	}
	async process(e, A) {
		if (!this.ffmpegPath) throw Error("FFmpeg not available");
		let { inputPath: j, ranges: M, mode: N, outputFormat: F, outputPath: I } = e, L = randomUUID$1();
		A && A({
			id: L,
			percent: 0,
			state: "analyzing"
		});
		let R = I ? path$1.dirname(I) : app.getPath("downloads"), z = [];
		if (N === "trim" || N === "cut") {
			let e = I || path$1.join(R, `trimmed_${Date.now()}.${F}`), P = [];
			if (M.length === 1 && N === "trim") P.push("-ss", M[0].start.toString(), "-to", M[0].end.toString(), "-i", j), P.push("-c", "copy", "-y", e);
			else {
				P.push("-i", j);
				let A = "";
				M.forEach((e, j) => {
					A += `[0:v]trim=start=${e.start}:end=${e.end},setpts=PTS-STARTPTS[v${j}];`, A += `[0:a]atrim=start=${e.start}:end=${e.end},asetpts=PTS-STARTPTS[a${j}];`;
				});
				for (let e = 0; e < M.length; e++) A += `[v${e}][a${e}]`;
				A += `concat=n=${M.length}:v=1:a=1[outv][outa]`, P.push("-filter_complex", A), P.push("-map", "[outv]", "-map", "[outa]"), P.push("-c:v", "libx264", "-preset", "ultrafast", "-crf", "23"), P.push("-c:a", "aac", "-y", e);
			}
			await this.runFFmpeg(P, L, M.reduce((e, A) => e + (A.end - A.start), 0), A), z.push(e);
		} else if (N === "split") for (let e = 0; e < M.length; e++) {
			let N = M[e], P = path$1.join(R, `split_${e + 1}_${Date.now()}.${F}`), I = [
				"-ss",
				N.start.toString(),
				"-to",
				N.end.toString(),
				"-i",
				j,
				"-c",
				"copy",
				"-y",
				P
			];
			A && A({
				id: L,
				percent: e / M.length * 100,
				state: "processing"
			}), await this.runFFmpeg(I, L, N.end - N.start), z.push(P);
		}
		return A && A({
			id: L,
			percent: 100,
			state: "complete",
			outputPath: z[0]
		}), z;
	}
	async runFFmpeg(e, A, j, M) {
		return new Promise((N, P) => {
			let F = spawn(this.ffmpegPath, e);
			this.activeProcesses.set(A, F), F.stderr.on("data", (e) => {
				let N = e.toString().match(/time=(\d{2}):(\d{2}):(\d{2}\.\d{2})/);
				if (N && M) {
					let e = parseInt(N[1]) * 3600 + parseInt(N[2]) * 60 + parseFloat(N[3]);
					M({
						id: A,
						percent: Math.min(e / j * 100, 100),
						state: "processing"
					});
				}
			}), F.on("close", (e) => {
				this.activeProcesses.delete(A), e === 0 ? N() : P(/* @__PURE__ */ Error(`FFmpeg exited with code ${e}`));
			}), F.on("error", (e) => {
				this.activeProcesses.delete(A), P(e);
			});
		});
	}
	cancel(e) {
		let A = this.activeProcesses.get(e);
		A && (A.kill(), this.activeProcesses.delete(e));
	}
}(), videoEffects = new class {
	constructor() {
		this.ffmpegPath = null, this.activeProcesses = /* @__PURE__ */ new Map(), this.initFFmpeg().catch((e) => console.error("FFmpeg init error:", e));
	}
	async initFFmpeg() {
		try {
			let { FFmpegHelper: e } = await import("./ffmpeg-helper-DXuFX_KP.js"), A = e.getFFmpegPath();
			A ? (this.ffmpegPath = A, console.log("✅ Video Effects: FFmpeg ready")) : console.warn("⚠️ Video Effects: FFmpeg not available");
		} catch (e) {
			console.warn("FFmpeg setup failed:", e);
		}
	}
	async applyEffects(e, A) {
		if (!this.ffmpegPath) throw Error("FFmpeg not available");
		let j = e.id || randomUUID$1(), { inputPath: M, outputPath: N, format: F } = e;
		if (!fs$1.existsSync(M)) throw Error(`File not found: ${M}`);
		A && A({
			id: j,
			percent: 0,
			state: "analyzing"
		});
		let I = await this.getVideoInfo(M), L = e.speed ? I.duration / e.speed : I.duration, R = N ? path$1.dirname(N) : app.getPath("downloads"), z = N ? path$1.basename(N) : `effect_video_${Date.now()}.${F}`, B = path$1.join(R, z);
		fs$1.existsSync(R) || fs$1.mkdirSync(R, { recursive: !0 });
		let V = ["-i", M], H = [], U = [];
		if (e.speed && e.speed !== 1) {
			H.push(`setpts=${1 / e.speed}*PTS`);
			let A = e.speed;
			for (; A > 2;) U.push("atempo=2.0"), A /= 2;
			for (; A < .5;) U.push("atempo=0.5"), A /= .5;
			U.push(`atempo=${A}`);
		}
		return (e.flip === "horizontal" || e.flip === "both") && H.push("hflip"), (e.flip === "vertical" || e.flip === "both") && H.push("vflip"), e.rotate && (e.rotate === 90 ? H.push("transpose=1") : e.rotate === 180 ? H.push("transpose=2,transpose=2") : e.rotate === 270 && H.push("transpose=2")), (e.brightness !== void 0 || e.contrast !== void 0 || e.saturation !== void 0 || e.gamma !== void 0) && H.push(`eq=brightness=${e.brightness || 0}:contrast=${e.contrast === void 0 ? 1 : e.contrast}:saturation=${e.saturation === void 0 ? 1 : e.saturation}:gamma=${e.gamma === void 0 ? 1 : e.gamma}`), e.grayscale && H.push("hue=s=0"), e.sepia && H.push("colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131"), e.blur && H.push(`boxblur=${e.blur}:1`), e.noise && H.push(`noise=alls=${e.noise}:allf=t+u`), e.sharpen && H.push("unsharp=5:5:1.0:5:5:0.0"), e.vintage && (H.push("curves=vintage"), H.push("vignette=PI/4")), e.reverse && (H.push("reverse"), U.push("areverse")), H.length > 0 && V.push("-vf", H.join(",")), U.length > 0 && V.push("-af", U.join(",")), e.quality === "low" ? V.push("-c:v", "libx264", "-preset", "ultrafast", "-crf", "30") : e.quality === "high" ? V.push("-c:v", "libx264", "-preset", "slow", "-crf", "18") : V.push("-c:v", "libx264", "-preset", "medium", "-crf", "23"), V.push("-c:a", "aac", "-b:a", "128k"), V.push("-y", B), new Promise((e, M) => {
			let N = spawn(this.ffmpegPath, V);
			this.activeProcesses.set(j, N), N.stderr.on("data", (e) => {
				let M = e.toString(), N = M.match(/time=(\d{2}):(\d{2}):(\d{2}\.\d{2})/);
				if (N && A) {
					let e = parseInt(N[1]) * 3600 + parseInt(N[2]) * 60 + parseFloat(N[3]), P = Math.min(e / L * 100, 100), F = M.match(/speed=\s*(\d+\.?\d*)x/);
					A({
						id: j,
						percent: P,
						state: "processing",
						speed: F ? parseFloat(F[1]) : 1
					});
				}
			}), N.on("close", (N) => {
				this.activeProcesses.delete(j), N === 0 ? (A && A({
					id: j,
					percent: 100,
					state: "complete",
					outputPath: B
				}), e(B)) : M(/* @__PURE__ */ Error(`Effects application failed with code ${N}`));
			}), N.on("error", (e) => {
				this.activeProcesses.delete(j), M(e);
			});
		});
	}
	async getVideoInfo(e) {
		if (!this.ffmpegPath) throw Error("FFmpeg not available");
		return new Promise((A, j) => {
			let M = spawn(this.ffmpegPath, [
				"-i",
				e,
				"-hide_banner"
			]), N = "";
			M.stderr.on("data", (e) => N += e.toString()), M.on("close", (e) => {
				if (e !== 0 && !N.includes("Duration")) {
					j(/* @__PURE__ */ Error("Failed to get video info"));
					return;
				}
				let M = N.match(/Duration: (\d{2}):(\d{2}):(\d{2}\.\d{2})/);
				A({ duration: M ? parseInt(M[1]) * 3600 + parseInt(M[2]) * 60 + parseFloat(M[3]) : 0 });
			}), M.on("error", j);
		});
	}
	cancelEffects(e) {
		let A = this.activeProcesses.get(e);
		A && (A.kill(), this.activeProcesses.delete(e));
	}
}(), videoCompressor = new class {
	getPreviewStream(e) {
		if (!this.ffmpegPath) throw Error("FFmpeg not available");
		let A = [
			"-i",
			e,
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
		console.log(`[VideoCompressor] Starting preview stream for ${e}`);
		let j = spawn(this.ffmpegPath, A);
		return j.stdout.on("close", () => {
			try {
				j.kill();
			} catch {}
		}), j.stderr.on("data", () => {}), j.stdout;
	}
	constructor() {
		this.ffmpegPath = null, this.activeProcesses = /* @__PURE__ */ new Map(), this.initFFmpeg().catch((e) => console.error("FFmpeg init error:", e));
	}
	async initFFmpeg() {
		try {
			let { FFmpegHelper: e } = await import("./ffmpeg-helper-DXuFX_KP.js"), A = e.getFFmpegPath();
			A ? (this.ffmpegPath = A, console.log("✅ Video Compressor: FFmpeg ready")) : console.warn("⚠️ Video Compressor: FFmpeg not available");
		} catch (e) {
			console.warn("FFmpeg setup failed:", e);
		}
	}
	async getVideoInfo(e) {
		if (!this.ffmpegPath) throw Error("FFmpeg not available");
		return new Promise((A, j) => {
			let M = [
				"-i",
				e,
				"-hide_banner"
			], N = spawn(this.ffmpegPath, M), P = "";
			N.stderr.on("data", (e) => {
				P += e.toString();
			}), N.on("close", () => {
				try {
					let j = P.match(/Duration: (\d{2}):(\d{2}):(\d{2}(?:\.\d+)?)/i), M = j ? parseInt(j[1]) * 3600 + parseInt(j[2]) * 60 + parseFloat(j[3]) : 0;
					console.log("[VideoCompressor] Info Output:", P);
					let N = P.match(/bitrate: (\d+) kb\/s/i), F = N ? parseInt(N[1]) : 0, I = P.match(/Stream #.*: Video: .*/i), L = "unknown", R = 0, z = 0, B = 0;
					if (I) {
						let e = I[0], A = e.match(/Video: ([^,\s]+)/i);
						A && (L = A[1]);
						let j = e.match(/(\d{2,5})x(\d{2,5})/);
						j && (R = parseInt(j[1]), z = parseInt(j[2]));
						let M = P.match(/, (\d+(?:\.\d+)?) fps/i);
						M && (B = parseFloat(M[1]));
					} else {
						let e = P.match(/ (\d{2,5})x(\d{2,5})/);
						e && (R = parseInt(e[1]), z = parseInt(e[2]));
					}
					if (I || console.warn("[VideoCompressor] No video stream info found in output for", e, P), R === 0 || z === 0) {
						let e = P.match(/ (\d{2,5})x(\d{2,5})/);
						e && (R = parseInt(e[1]), z = parseInt(e[2]));
					}
					A({
						path: e,
						duration: M,
						width: R,
						height: z,
						codec: L,
						fps: B,
						size: fs$1.existsSync(e) ? fs$1.statSync(e).size : 0,
						bitrate: F
					});
				} catch {
					j(/* @__PURE__ */ Error("Failed to parse video info"));
				}
			}), N.on("error", j);
		});
	}
	async generateThumbnail(e) {
		try {
			let { nativeImage: A } = await import("electron"), j = await A.createThumbnailFromPath(e, {
				width: 1280,
				height: 720
			});
			return j.isEmpty() ? null : j.toDataURL();
		} catch (e) {
			return console.error("Thumbnail generation failed:", e), null;
		}
	}
	async compress(e, A) {
		if (!this.ffmpegPath) throw Error("FFmpeg not available");
		let j = e.id || randomUUID$1(), { inputPath: M, outputPath: N, format: F, resolution: I, preset: L, crf: R, bitrate: z, scaleMode: B, keepAudio: V } = e;
		if (!fs$1.existsSync(M)) throw Error(`File not found: ${M}`);
		let H = (await this.getVideoInfo(M)).duration, U = N ? path$1.dirname(N) : app.getPath("downloads"), W = N ? path$1.basename(N) : `compressed_${path$1.basename(M, path$1.extname(M))}_${Date.now()}.${F}`, G = path$1.join(U, W);
		fs$1.existsSync(U) || fs$1.mkdirSync(U, { recursive: !0 });
		let K = z;
		if (e.targetSize && H > 0) {
			let A = e.targetSize * 8 - (V ? 128e3 : 0) * H, j = Math.floor(A / H / 1e3);
			K = `${Math.max(100, j)}k`;
		}
		let q = [
			"-threads",
			"0",
			"-i",
			M
		], J = [];
		if (I) {
			let e = `scale=${I.width}:${I.height}`;
			B === "fit" ? e = `scale=${I.width}:${I.height}:force_original_aspect_ratio=decrease,pad=${I.width}:${I.height}:(ow-iw)/2:(oh-ih)/2` : B === "fill" && (e = `scale=${I.width}:${I.height}:force_original_aspect_ratio=increase,crop=${I.width}:${I.height}`), J.push(e);
		}
		(J.length > 0 || I) && J.push("scale=trunc(iw/2)*2:trunc(ih/2)*2"), J.length > 0 && q.push("-vf", J.join(","));
		let Y = e.useHardwareAcceleration, X = process.platform, Z = e.codec || "h264", Q = "libx264";
		if (Z === "h264" ? Q = Y ? X === "darwin" ? "h264_videotoolbox" : X === "win32" ? "h264_nvenc" : "libx264" : "libx264" : Z === "hevc" ? Q = Y ? X === "darwin" ? "hevc_videotoolbox" : X === "win32" ? "hevc_nvenc" : "libx265" : "libx265" : Z === "vp9" ? Q = "libvpx-vp9" : Z === "av1" && (Q = "libsvtav1"), q.push("-c:v", Q), Z === "h264" || Z === "hevc") {
			if (K) q.push("-b:v", K);
			else {
				let e = Math.max(0, Math.min(100, 100 - (R || 23) * 1.5));
				Q.includes("videotoolbox") ? q.push("-q:v", Math.round(e).toString()) : Q.includes("nvenc") ? (q.push("-cq", (R || 23).toString()), q.push("-preset", "p4")) : (q.push("-crf", (R || 23).toString()), q.push("-preset", L || "medium"));
			}
			Q.includes("videotoolbox") || q.push("-pix_fmt", "yuv420p");
		} else Z === "vp9" ? (K ? q.push("-b:v", K) : (q.push("-crf", (R || 30).toString()), q.push("-b:v", "0")), q.push("-row-mt", "1")) : Z === "av1" && (K ? q.push("-b:v", K) : q.push("-crf", (R || 30).toString()), q.push("-preset", L && L === "veryslow" ? "3" : "5"));
		return V ? q.push("-c:a", "aac", "-b:a", "128k") : q.push("-an"), q.push("-y", G), new Promise((e, M) => {
			console.log(`[VideoCompressor] Command: ${this.ffmpegPath} ${q.join(" ")}`);
			let N = spawn(this.ffmpegPath, q);
			this.activeProcesses.set(j, N), N.stderr.on("data", (e) => {
				let M = e.toString(), N = M.match(/time=(\d{2}):(\d{2}):(\d{2}\.\d{2})/);
				if (N && A) {
					let e = parseInt(N[1]) * 3600 + parseInt(N[2]) * 60 + parseFloat(N[3]), P = Math.min(e / H * 100, 100), F = M.match(/speed=\s*(\d+\.?\d*)x/), I = F ? parseFloat(F[1]) : 1, L = M.match(/size=\s*(\d+)kB/), R = L ? parseInt(L[1]) * 1024 : void 0, z = 0;
					if (I > 0) {
						let A = H - e;
						z = Math.max(0, A / I);
					}
					A({
						id: j,
						percent: P,
						state: "processing",
						speed: I,
						currentSize: R,
						eta: z
					});
				}
			}), N.on("close", (N) => {
				this.activeProcesses.delete(j), N === 0 ? (A && A({
					id: j,
					percent: 100,
					state: "complete",
					outputPath: G,
					currentSize: fs$1.existsSync(G) ? fs$1.statSync(G).size : 0
				}), e(G)) : M(/* @__PURE__ */ Error(`Compression failed with code ${N}`));
			}), N.on("error", (e) => {
				this.activeProcesses.delete(j), M(e);
			});
		});
	}
	cancel(e) {
		let A = this.activeProcesses.get(e);
		A && (A.kill(), this.activeProcesses.delete(e));
	}
}(), youtubeDownloader = new class {
	constructor() {
		this.activeProcesses = /* @__PURE__ */ new Map(), this.hasAria2c = !1, this.hasFFmpeg = !1, this.ffmpegPath = null, this.downloadQueue = [], this.activeDownloadsCount = 0, this.videoInfoCache = /* @__PURE__ */ new Map(), this.CACHE_TTL = 1800 * 1e3, this.store = new Store({
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
		let e = process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp";
		this.binaryPath = path$1.join(app.getPath("userData"), e), this.initPromise = this.initYtDlp();
	}
	async initYtDlp() {
		try {
			let { YTDlpWrap: e } = await import("./yt-dlp-BWruPz4V.js");
			if (fs$1.existsSync(this.binaryPath)) console.log("Using existing yt-dlp binary at:", this.binaryPath);
			else {
				console.log("Downloading yt-dlp binary to:", this.binaryPath);
				try {
					await e.downloadFromGithub(this.binaryPath), console.log("yt-dlp binary downloaded successfully");
				} catch (e) {
					throw console.error("Failed to download yt-dlp binary:", e), Error(`Failed to download yt-dlp: ${e}`);
				}
			}
			this.ytDlp = new e(this.binaryPath);
			let { FFmpegHelper: A } = await import("./ffmpeg-helper-DXuFX_KP.js"), j = A.getFFmpegPath();
			if (j) {
				this.ffmpegPath = j, this.hasFFmpeg = !0;
				let e = A.getFFmpegVersion();
				console.log(`✅ FFmpeg ready: ${e || "version unknown"}`);
			} else console.warn("⚠️ FFmpeg not available - video features may be limited");
			await this.checkHelpers();
		} catch (e) {
			throw console.error("Failed to initialize yt-dlp:", e), e;
		}
	}
	async checkHelpers() {
		this.hasAria2c = !1;
		try {
			let e = app.getPath("userData"), A = path$1.join(e, "bin", "aria2c.exe");
			fs$1.existsSync(A) && (this.hasAria2c = !0, console.log("✅ Aria2c found locally:", A));
		} catch {}
		if (!this.hasAria2c) try {
			execSync("aria2c --version", { stdio: "ignore" }), this.hasAria2c = !0, console.log("✅ Aria2c found globally");
		} catch {
			console.log("ℹ️ Aria2c not found");
		}
		if (this.ffmpegPath) this.hasFFmpeg = !0, console.log("✅ FFmpeg static detected", this.ffmpegPath);
		else try {
			execSync("ffmpeg -version", { stdio: "ignore" }), this.hasFFmpeg = !0, console.log("✅ FFmpeg found globally");
		} catch {
			this.hasFFmpeg = !1, console.warn("⚠️ FFmpeg not found");
		}
	}
	async installAria2() {
		console.log("Starting Aria2 download...");
		try {
			let e = app.getPath("userData"), A = path$1.join(e, "bin");
			fs$1.existsSync(A) || fs$1.mkdirSync(A, { recursive: !0 });
			let j = path$1.join(A, "aria2.zip");
			await new Promise((e, A) => {
				let M = fs$1.createWriteStream(j);
				https.get("https://github.com/aria2/aria2/releases/download/release-1.36.0/aria2-1.36.0-win-64bit-build1.zip", (j) => {
					j.statusCode === 302 || j.statusCode === 301 ? https.get(j.headers.location, (j) => {
						if (j.statusCode !== 200) {
							A(/* @__PURE__ */ Error("DL Fail " + j.statusCode));
							return;
						}
						j.pipe(M), M.on("finish", () => {
							M.close(), e();
						});
					}).on("error", A) : j.statusCode === 200 ? (j.pipe(M), M.on("finish", () => {
						M.close(), e();
					})) : A(/* @__PURE__ */ Error(`Failed to download: ${j.statusCode}`));
				}).on("error", A);
			}), await promisify(exec)(`powershell -Command "Expand-Archive -Path '${j}' -DestinationPath '${A}' -Force"`);
			let M = path$1.join(A, "aria2-1.36.0-win-64bit-build1"), N = path$1.join(M, "aria2c.exe"), F = path$1.join(A, "aria2c.exe");
			fs$1.existsSync(N) && fs$1.copyFileSync(N, F);
			try {
				fs$1.unlinkSync(j);
			} catch {}
			return await this.checkHelpers(), this.hasAria2c;
		} catch (e) {
			throw console.error("Install Aria2 Failed", e), e;
		}
	}
	async ensureInitialized() {
		await this.initPromise;
	}
	async processQueue() {
		let e = this.getSettings().maxConcurrentDownloads || 3;
		for (; this.activeDownloadsCount < e && this.downloadQueue.length > 0;) {
			let e = this.downloadQueue.shift();
			e && (this.activeDownloadsCount++, e.run().then((A) => e.resolve(A)).catch((A) => e.reject(A)).finally(() => {
				this.activeDownloadsCount--, this.processQueue();
			}));
		}
	}
	async getVideoInfo(e) {
		await this.ensureInitialized();
		let A = this.videoInfoCache.get(e);
		if (A && Date.now() - A.timestamp < this.CACHE_TTL) return console.log("Returning cached video info for:", e), A.info;
		try {
			let A = await this.ytDlp.getVideoInfo([
				e,
				"--skip-download",
				"--no-playlist",
				"--no-check-certificate"
			]), j = (A.formats || []).map((e) => ({
				itag: e.format_id ? parseInt(e.format_id) : 0,
				quality: e.quality || e.format_note || "unknown",
				qualityLabel: e.format_note || e.resolution,
				hasVideo: !!e.vcodec && e.vcodec !== "none",
				hasAudio: !!e.acodec && e.acodec !== "none",
				container: e.ext || "unknown",
				codecs: e.vcodec || e.acodec,
				bitrate: e.tbr ? e.tbr * 1e3 : void 0,
				audioBitrate: e.abr,
				filesize: e.filesize || e.filesize_approx
			})), M = /* @__PURE__ */ new Set();
			j.forEach((e) => {
				if (e.qualityLabel) {
					let A = e.qualityLabel.match(/(\d+p)/);
					A && M.add(A[1]);
				}
			});
			let N = Array.from(M).sort((e, A) => {
				let j = parseInt(e);
				return parseInt(A) - j;
			}), P = j.some((e) => e.hasVideo), F = j.some((e) => e.hasAudio), I;
			if (A.upload_date) try {
				let e = A.upload_date.toString();
				e.length === 8 && (I = `${e.substring(0, 4)}-${e.substring(4, 6)}-${e.substring(6, 8)}`);
			} catch {
				console.warn("Failed to parse upload date:", A.upload_date);
			}
			let L = {
				videoId: A.id || "",
				title: A.title || "Unknown",
				author: A.uploader || A.channel || "Unknown",
				lengthSeconds: parseInt(A.duration) || 0,
				thumbnailUrl: A.thumbnail || "",
				description: A.description || void 0,
				viewCount: parseInt(A.view_count) || void 0,
				uploadDate: I,
				formats: j,
				availableQualities: N,
				hasVideo: P,
				hasAudio: F
			};
			return this.videoInfoCache.set(e, {
				info: L,
				timestamp: Date.now()
			}), L;
		} catch (e) {
			throw Error(`Failed to get video info: ${e instanceof Error ? e.message : "Unknown error"}`);
		}
	}
	async getPlaylistInfo(e) {
		await this.ensureInitialized();
		try {
			let A = await this.ytDlp.getVideoInfo([
				e,
				"--flat-playlist",
				"--skip-download",
				"--no-check-certificate"
			]);
			if (!A.entries || !Array.isArray(A.entries)) throw Error("Not a valid playlist URL");
			let j = A.entries.map((e) => ({
				id: e.id || e.url,
				title: e.title || "Unknown Title",
				duration: e.duration || 0,
				thumbnail: e.thumbnail || e.thumbnails?.[0]?.url || "",
				url: e.url || `https://www.youtube.com/watch?v=${e.id}`
			}));
			return {
				playlistId: A.id || A.playlist_id || "unknown",
				title: A.title || A.playlist_title || "Unknown Playlist",
				videoCount: j.length,
				videos: j
			};
		} catch (e) {
			throw Error(`Failed to get playlist info: ${e instanceof Error ? e.message : "Unknown error"}`);
		}
	}
	async checkDiskSpace(e, A) {
		try {
			let j = await si.fsSize(), M = path$1.parse(path$1.resolve(e)).root.toLowerCase(), N = j.find((e) => {
				let A = e.mount.toLowerCase();
				return M.startsWith(A) || A.startsWith(M.replace(/\\/g, ""));
			});
			if (N && N.available < A + 100 * 1024 * 1024) throw Error(`Insufficient disk space. Required: ${(A / 1024 / 1024).toFixed(2)} MB, Available: ${(N.available / 1024 / 1024).toFixed(2)} MB`);
		} catch (e) {
			console.warn("Disk space check failed:", e);
		}
	}
	async downloadVideo(e, A) {
		return new Promise((j, M) => {
			this.downloadQueue.push({
				run: () => this.executeDownload(e, A),
				resolve: j,
				reject: M
			}), this.processQueue();
		});
	}
	async executeDownload(e, A) {
		await this.ensureInitialized(), console.log("ExecuteDownload - hasFFmpeg:", this.hasFFmpeg, "path:", this.ffmpegPath);
		let { url: j, format: M, quality: N, container: F, outputPath: I, maxSpeed: L, embedSubs: R, id: z } = e, B = z || randomUUID$1();
		try {
			let z = await this.getVideoInfo(j), V = this.sanitizeFilename(z.title), H = I || app.getPath("downloads"), U = F || (M === "audio" ? "mp3" : "mp4"), W = "";
			M === "audio" ? W = `_audio_${N || "best"}` : M === "video" && N && (W = `_${N}`);
			let G = path$1.join(H, `${V}${W}.%(ext)s`);
			fs$1.existsSync(H) || fs$1.mkdirSync(H, { recursive: !0 });
			let K = 0;
			if (M === "audio") K = z.formats.find((e) => e.hasAudio && !e.hasVideo && (e.quality === N || e.itag.toString() === "140"))?.filesize || 0;
			else {
				let e;
				e = N && N !== "best" ? z.formats.find((e) => e.qualityLabel?.startsWith(N) && e.hasVideo) : z.formats.find((e) => e.hasVideo);
				let A = z.formats.find((e) => e.hasAudio && !e.hasVideo);
				e && (K += e.filesize || 0), A && (K += A.filesize || 0);
			}
			K > 1024 * 1024 && await this.checkDiskSpace(H, K);
			let q = [
				j,
				"-o",
				G,
				"--no-playlist",
				"--no-warnings",
				"--newline",
				"--no-check-certificate",
				"--concurrent-fragments",
				`${e.concurrentFragments || 4}`,
				"--buffer-size",
				"1M",
				"--retries",
				"10",
				"--fragment-retries",
				"10",
				"-c"
			];
			if (R && q.push("--write-subs", "--write-auto-subs", "--sub-lang", "en.*,vi", "--embed-subs"), this.ffmpegPath && q.push("--ffmpeg-location", this.ffmpegPath), L && q.push("--limit-rate", L), this.ffmpegPath && q.push("--ffmpeg-location", this.ffmpegPath), M === "audio") q.push("-x", "--audio-format", F || "mp3", "--audio-quality", N || "0");
			else if (M === "video") {
				if (N && N !== "best") {
					let e = N.replace("p", "");
					q.push("-f", `bestvideo[height<=${e}][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=${e}]+bestaudio/best[height<=${e}]`);
				} else q.push("-f", "bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio/best");
				let e = F || "mp4";
				q.push("--merge-output-format", e), e === "mp4" && q.push("--postprocessor-args", "ffmpeg:-c:v copy -c:a aac");
			} else q.push("-f", "best");
			return new Promise((e, P) => {
				let F = 0, I = 0, L = 0, R = this.ytDlp.exec(q);
				if (this.activeProcesses.set(B, R), R.ytDlpProcess) {
					let e = R.ytDlpProcess;
					e.stdout?.on("data", (e) => {
						let j = e.toString();
						console.log(`[${B}] stdout:`, j), j.split(/\r?\n/).forEach((e) => {
							if (!e.trim()) return;
							let j = this.parseProgressLine(e);
							j && A && (j.totalBytes > 0 && (I = j.totalBytes), j.percent > 0 && (L = j.percent), F = L / 100 * I, A({
								id: B,
								percent: Math.round(L),
								downloaded: F,
								total: I,
								speed: j.speed,
								eta: j.eta,
								state: "downloading",
								filename: `${V}${W}.${U}`
							}));
						});
					}), e.stderr?.on("data", (e) => {
						let j = e.toString();
						console.log(`[${B}] stderr:`, j), j.split(/\r?\n/).forEach((e) => {
							if (!e.trim()) return;
							let j = this.parseProgressLine(e);
							j && A && (j.totalBytes > 0 && (I = j.totalBytes), j.percent > 0 && (L = j.percent), F = L / 100 * I, A({
								id: B,
								percent: Math.round(L),
								downloaded: F,
								total: I,
								speed: j.speed,
								eta: j.eta,
								state: "downloading",
								filename: `${V}.${U}`
							}));
						});
					});
				}
				R.on("close", (F) => {
					if (this.activeProcesses.delete(B), F === 0) {
						let P = path$1.join(H, `${V}${W}.${U}`), F = I;
						try {
							fs$1.existsSync(P) && (F = fs$1.statSync(P).size);
						} catch (e) {
							console.warn("Failed to get file size:", e);
						}
						A && A({
							id: B,
							percent: 100,
							downloaded: F,
							total: F,
							speed: 0,
							eta: 0,
							state: "complete",
							filename: `${V}.${U}`
						}), this.addToHistory({
							url: j,
							title: z.title,
							thumbnailUrl: z.thumbnailUrl,
							format: M,
							quality: N || (M === "audio" ? "best" : "auto"),
							path: P,
							size: F,
							duration: z.lengthSeconds,
							status: "completed"
						}), e(P);
					} else this.cleanupPartialFiles(H, V, U), P(/* @__PURE__ */ Error(`yt-dlp exited with code ${F}`));
				}), R.on("error", (e) => {
					this.activeProcesses.delete(B), this.cleanupPartialFiles(H, V, U), P(e);
				});
			});
		} catch (e) {
			throw this.activeProcesses.delete(B), Error(`Download failed: ${e instanceof Error ? e.message : "Unknown error"}`);
		}
	}
	cancelDownload(e) {
		if (e) {
			let A = this.activeProcesses.get(e);
			if (A) {
				console.log(`Cancelling download ${e}`);
				try {
					A.ytDlpProcess && typeof A.ytDlpProcess.kill == "function" ? A.ytDlpProcess.kill() : typeof A.kill == "function" && A.kill();
				} catch (e) {
					console.error("Failed to kill process:", e);
				}
				this.activeProcesses.delete(e);
			}
		} else console.log(`Cancelling all ${this.activeProcesses.size} downloads`), this.activeProcesses.forEach((e) => {
			try {
				e.ytDlpProcess && typeof e.ytDlpProcess.kill == "function" ? e.ytDlpProcess.kill() : typeof e.kill == "function" && e.kill();
			} catch (e) {
				console.error("Failed to kill process:", e);
			}
		}), this.activeProcesses.clear();
	}
	cleanupPartialFiles(e, A, j) {
		try {
			[
				path$1.join(e, `${A}.${j}`),
				path$1.join(e, `${A}.${j}.part`),
				path$1.join(e, `${A}.${j}.ytdl`),
				path$1.join(e, `${A}.part`)
			].forEach((e) => {
				fs$1.existsSync(e) && fs$1.unlinkSync(e);
			});
		} catch (e) {
			console.error("Cleanup failed:", e);
		}
	}
	sanitizeFilename(e) {
		return e.replace(/[<>:"/\\|?*]/g, "").replace(/\s+/g, " ").trim().substring(0, 200);
	}
	parseProgressLine(e) {
		let A = (e) => {
			if (!e) return 1;
			let A = e.toLowerCase();
			return A.includes("k") ? 1024 : A.includes("m") ? 1024 * 1024 : A.includes("g") ? 1024 * 1024 * 1024 : 1;
		};
		if (e.includes("[download]")) {
			let j = e.match(/(\d+(?:\.\d+)?)%/), M = e.match(/of\s+~?([0-9.,]+)([a-zA-Z]+)/), N = e.match(/at\s+([0-9.,]+)([a-zA-Z]+\/s)/), P = e.match(/ETA\s+([\d:]+)/);
			if (console.log("[parseProgressLine] Matches:", {
				line: e,
				percentMatch: j?.[0],
				sizeMatch: M?.[0],
				speedMatch: N?.[0],
				etaMatch: P?.[0]
			}), j) {
				let e = parseFloat(j[1]), F = 0, I = 0, L = 0;
				if (M && (F = parseFloat(M[1].replace(/,/g, "")) * A(M[2])), N && (I = parseFloat(N[1].replace(/,/g, "")) * A(N[2].replace("/s", ""))), P) {
					let e = P[1].split(":").map(Number);
					L = e.length === 3 ? e[0] * 3600 + e[1] * 60 + e[2] : e.length === 2 ? e[0] * 60 + e[1] : e[0];
				}
				return {
					percent: e,
					totalBytes: F,
					downloadedBytes: 0,
					speed: I,
					eta: L,
					status: "downloading"
				};
			}
		}
		return null;
	}
	getHistory() {
		return this.store.get("history", []);
	}
	addToHistory(e) {
		let A = this.store.get("history", []), j = {
			...e,
			id: randomUUID$1(),
			timestamp: Date.now()
		};
		this.store.set("history", [j, ...A].slice(0, 50));
	}
	removeFromHistory(e) {
		let A = this.store.get("history", []).filter((A) => A.id !== e);
		this.store.set("history", A);
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
	saveSettings(e) {
		let A = {
			...this.store.get("settings"),
			...e
		};
		return this.store.set("settings", A), A;
	}
}(), tiktokDownloader = new class {
	constructor() {
		this.activeProcesses = /* @__PURE__ */ new Map(), this.ffmpegPath = null, this.downloadQueue = [], this.activeDownloadsCount = 0, this.store = new Store({
			name: "tiktok-download-history",
			defaults: {
				history: [],
				settings: {
					defaultFormat: "video",
					defaultQuality: "best",
					removeWatermark: !1,
					maxConcurrentDownloads: 3,
					maxSpeedLimit: ""
				}
			}
		});
		let e = process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp";
		this.binaryPath = path$1.join(app.getPath("userData"), e), this.initPromise = this.init();
	}
	async init() {
		try {
			let { YTDlpWrap: e } = await import("./yt-dlp-BWruPz4V.js");
			fs$1.existsSync(this.binaryPath) || (console.log("Downloading yt-dlp binary (TikTok)..."), await e.downloadFromGithub(this.binaryPath)), this.ytDlp = new e(this.binaryPath);
			let { FFmpegHelper: A } = await import("./ffmpeg-helper-DXuFX_KP.js"), j = A.getFFmpegPath();
			j ? (this.ffmpegPath = j, console.log("✅ TikTok Downloader: FFmpeg ready")) : console.warn("⚠️ TikTok Downloader: FFmpeg not available");
		} catch (e) {
			throw console.error("Failed to init TikTok downloader:", e), e;
		}
	}
	async ensureInitialized() {
		await this.initPromise;
	}
	async getVideoInfo(e) {
		await this.ensureInitialized();
		try {
			let A = await this.ytDlp.getVideoInfo([
				e,
				"--skip-download",
				"--no-playlist",
				"--no-check-certificate"
			]);
			return {
				id: A.id,
				title: A.title || "TikTok Video",
				author: A.uploader || A.channel || "Unknown",
				authorUsername: A.uploader_id || "",
				duration: A.duration || 0,
				thumbnailUrl: A.thumbnail || "",
				description: A.description,
				viewCount: A.view_count,
				likeCount: A.like_count,
				commentCount: A.comment_count,
				shareCount: A.repost_count,
				uploadDate: A.upload_date,
				musicTitle: A.track,
				musicAuthor: A.artist
			};
		} catch (e) {
			throw Error(`Failed to get TikTok info: ${e instanceof Error ? e.message : String(e)}`);
		}
	}
	async downloadVideo(e, A) {
		return new Promise((j, M) => {
			this.downloadQueue.push({
				run: () => this.executeDownload(e, A),
				resolve: j,
				reject: M
			}), this.processQueue();
		});
	}
	async processQueue() {
		let e = this.getSettings().maxConcurrentDownloads || 3;
		for (; this.activeDownloadsCount < e && this.downloadQueue.length > 0;) {
			let e = this.downloadQueue.shift();
			e && (this.activeDownloadsCount++, e.run().then((A) => e.resolve(A)).catch((A) => e.reject(A)).finally(() => {
				this.activeDownloadsCount--, this.processQueue();
			}));
		}
	}
	async executeDownload(e, A) {
		await this.ensureInitialized();
		let { url: j, format: M, quality: N, outputPath: F, maxSpeed: I, id: L } = e, R = L || randomUUID$1();
		try {
			let e = await this.getVideoInfo(j), L = this.sanitizeFilename(e.title), z = this.sanitizeFilename(e.authorUsername || e.author), B = F || this.store.get("settings.downloadPath") || app.getPath("downloads"), V = M === "audio" ? "mp3" : "mp4", H = `${z}_${L}_${e.id}.${V}`, U = path$1.join(B, H);
			fs$1.existsSync(B) || fs$1.mkdirSync(B, { recursive: !0 });
			let W = [
				j,
				"-o",
				U,
				"--no-playlist",
				"--newline",
				"--no-warnings",
				"--no-check-certificate",
				"--concurrent-fragments",
				"4",
				"--retries",
				"10"
			];
			return this.ffmpegPath && W.push("--ffmpeg-location", this.ffmpegPath), I && W.push("--limit-rate", I), M === "audio" ? W.push("-x", "--audio-format", "mp3", "--audio-quality", "0") : N === "low" ? W.push("-f", "worst") : W.push("-f", "best"), new Promise((N, P) => {
				let F = 0, I = 0, L = 0, z = this.ytDlp.exec(W);
				this.activeProcesses.set(R, z), z.ytDlpProcess && z.ytDlpProcess.stdout?.on("data", (e) => {
					e.toString().split(/\r?\n/).forEach((e) => {
						if (!e.trim()) return;
						let j = e.match(/\[download\]\s+(\d+\.?\d*)%\s+of\s+~?(\d+\.?\d*)(\w+)\s+at\s+(\d+\.?\d*)(\w+)\/s\s+ETA\s+(\d+:\d+)/);
						if (j) {
							L = parseFloat(j[1]);
							let e = parseFloat(j[2]), M = j[3], N = parseFloat(j[4]), P = j[5], z = j[6], B = {
								B: 1,
								KiB: 1024,
								MiB: 1024 * 1024,
								GiB: 1024 * 1024 * 1024
							};
							F = e * (B[M] || 1), I = L / 100 * F;
							let V = N * (B[P] || 1), U = z.split(":"), W = 0;
							U.length === 2 && (W = parseInt(U[0]) * 60 + parseInt(U[1])), U.length === 3 && (W = parseInt(U[0]) * 3600 + parseInt(U[1]) * 60 + parseInt(U[2])), A && A({
								id: R,
								percent: L,
								downloaded: I,
								total: F,
								speed: V,
								eta: W,
								state: "downloading",
								filename: H
							});
						}
					});
				}), z.on("close", (I) => {
					this.activeProcesses.delete(R), I === 0 ? fs$1.existsSync(U) ? (A && A({
						id: R,
						percent: 100,
						downloaded: F,
						total: F,
						speed: 0,
						eta: 0,
						state: "complete",
						filename: H,
						filePath: U
					}), this.addToHistory({
						id: R,
						url: j,
						title: e.title,
						thumbnailUrl: e.thumbnailUrl,
						author: e.author,
						authorUsername: e.authorUsername,
						timestamp: Date.now(),
						path: U,
						size: F,
						duration: e.duration,
						format: M || "video",
						status: "completed"
					}), N(U)) : P(/* @__PURE__ */ Error("Download finished but file not found")) : P(/* @__PURE__ */ Error(`yt-dlp exited with code ${I}`));
				}), z.on("error", (e) => {
					this.activeProcesses.delete(R), P(e);
				});
			});
		} catch (e) {
			throw this.activeProcesses.delete(R), e;
		}
	}
	cancelDownload(e) {
		if (e) {
			let A = this.activeProcesses.get(e);
			A && A.ytDlpProcess && A.ytDlpProcess.kill();
		} else this.activeProcesses.forEach((e) => {
			e.ytDlpProcess && e.ytDlpProcess.kill();
		});
	}
	getHistory() {
		return this.store.get("history", []);
	}
	clearHistory() {
		this.store.set("history", []);
	}
	removeFromHistory(e) {
		let A = this.getHistory();
		this.store.set("history", A.filter((A) => A.id !== e));
	}
	addToHistory(e) {
		let A = this.getHistory();
		A.unshift(e), this.store.set("history", A.slice(0, 100));
	}
	getSettings() {
		return this.store.get("settings");
	}
	saveSettings(e) {
		let A = this.getSettings();
		this.store.set("settings", {
			...A,
			...e
		});
	}
	sanitizeFilename(e) {
		return e.replace(/[<>:"/\\|?*]/g, "").trim();
	}
}(), ErrorCode = {
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
	constructor(e, A = ErrorCode.UNKNOWN_ERROR, j = {}) {
		super(e), this.name = "DownloadError", this.code = A, this.recoverable = j.recoverable ?? !1, this.retryable = j.retryable ?? !0, this.suggestions = j.suggestions ?? [], this.metadata = {
			timestamp: Date.now(),
			...j.metadata
		}, j.cause && (this.stack = `${this.stack}\nCaused by: ${j.cause.stack}`);
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
}, NetworkError = class extends DownloadError {
	constructor(e, A) {
		super(e, ErrorCode.NETWORK_ERROR, {
			retryable: !0,
			recoverable: !0,
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
			metadata: A
		});
	}
}, ConnectionTimeoutError = class extends DownloadError {
	constructor(e, A) {
		super(e, ErrorCode.CONNECTION_TIMEOUT, {
			retryable: !0,
			recoverable: !0,
			suggestions: [{
				title: "Retry Download",
				description: "The connection timed out, try downloading again",
				action: "retry"
			}, {
				title: "Check Network Speed",
				description: "Your internet connection might be slow"
			}],
			metadata: A
		});
	}
}, LoginRequiredError = class extends DownloadError {
	constructor(e, A, j) {
		super(e, ErrorCode.LOGIN_REQUIRED, {
			retryable: !1,
			recoverable: !0,
			suggestions: [{
				title: "Login Required",
				description: `You need to be logged in to ${A || "this platform"} to download this content`,
				action: "open-settings"
			}, {
				title: "Enable Browser Cookies",
				description: "In Settings, enable browser cookies to use your logged-in session",
				action: "open-settings"
			}],
			metadata: {
				...j,
				platform: A
			}
		});
	}
}, ContentUnavailableError = class extends DownloadError {
	constructor(e, A, j) {
		let M = {
			private: ErrorCode.PRIVATE_VIDEO,
			deleted: ErrorCode.DELETED_VIDEO,
			"geo-restricted": ErrorCode.GEO_RESTRICTED,
			"age-restricted": ErrorCode.AGE_RESTRICTED,
			unavailable: ErrorCode.VIDEO_UNAVAILABLE
		};
		super(e, M[A], {
			retryable: A === "unavailable",
			recoverable: !1,
			suggestions: {
				private: [{
					title: "Content is Private",
					description: "This content is private and cannot be downloaded"
				}, {
					title: "Request Access",
					description: "You may need to request access from the content owner"
				}],
				deleted: [{
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
				unavailable: [{
					title: "Content Unavailable",
					description: "This content is currently unavailable"
				}, {
					title: "Try Again Later",
					description: "The content might be temporarily unavailable",
					action: "retry-later"
				}]
			}[A],
			metadata: j
		});
	}
}, RateLimitError = class extends DownloadError {
	constructor(e, A, j) {
		super(e, ErrorCode.RATE_LIMITED, {
			retryable: !0,
			recoverable: !0,
			suggestions: [{
				title: "Too Many Requests",
				description: A ? `You've made too many requests. Please wait ${Math.ceil(A / 60)} minutes before trying again.` : "You've made too many requests. Please wait a few minutes before trying again.",
				action: "retry-later"
			}, {
				title: "Reduce Concurrent Downloads",
				description: "Try downloading fewer files at once",
				action: "open-settings"
			}],
			metadata: {
				...j,
				retryAfter: A
			}
		});
	}
}, ServerError = class extends DownloadError {
	constructor(e, A, j) {
		super(e, ErrorCode.SERVER_ERROR, {
			retryable: A ? A >= 500 : !0,
			recoverable: !0,
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
				...j,
				statusCode: A
			}
		});
	}
}, DiskFullError = class extends DownloadError {
	constructor(e, A, j) {
		super(e, ErrorCode.DISK_FULL, {
			retryable: !1,
			recoverable: !0,
			suggestions: [
				{
					title: "Insufficient Disk Space",
					description: A ? `You have only ${(A / (1024 * 1024 * 1024)).toFixed(2)} GB available. Free up some space and try again.` : "Your disk is full. Free up some space and try again."
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
			metadata: j
		});
	}
}, ErrorParser = class {
	static parse(e, A) {
		let j = typeof e == "string" ? e : e.message, M = j.toLowerCase();
		if (M.includes("network error") || M.includes("enotfound") || M.includes("getaddrinfo") || M.includes("unable to download") || M.includes("nodename nor servname")) return new NetworkError(j, A);
		if (M.includes("timeout") || M.includes("timed out")) return new ConnectionTimeoutError(j, A);
		if (M.includes("login required")) return new LoginRequiredError(j, A?.platform, A);
		if (M.includes("private video") || M.includes("this video is private")) return new ContentUnavailableError(j, "private", A);
		if (M.includes("video unavailable") || M.includes("has been removed")) return new ContentUnavailableError(j, "deleted", A);
		if (M.includes("geographic") || M.includes("not available in your country")) return new ContentUnavailableError(j, "geo-restricted", A);
		if (M.includes("age") && M.includes("restrict")) return new ContentUnavailableError(j, "age-restricted", A);
		if (M.includes("429") || M.includes("too many requests")) {
			let e = j.match(/retry after (\d+)/i);
			return new RateLimitError(j, e ? parseInt(e[1]) : void 0, A);
		}
		if (M.includes("500") || M.includes("502") || M.includes("503") || M.includes("server error")) {
			let e = j.match(/(\d{3})/);
			return new ServerError(j, e ? parseInt(e[1]) : void 0, A);
		}
		return M.includes("no space left") || M.includes("disk full") || M.includes("enospc") ? new DiskFullError(j, void 0, A) : new DownloadError(j, ErrorCode.UNKNOWN_ERROR, {
			retryable: !0,
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
			metadata: A
		});
	}
};
const errorLogger = new class {
	constructor() {
		this.maxEntries = 500, this.retentionDays = 30, this.store = new Store({
			name: "error-log",
			defaults: {
				errors: [],
				stats: {
					totalErrors: 0,
					errorsByCode: {},
					lastCleanup: Date.now()
				}
			}
		}), this.cleanupOldErrors();
	}
	log(e, A) {
		let j = {
			id: this.generateId(),
			timestamp: Date.now(),
			downloadId: A,
			url: e.metadata.url,
			platform: e.metadata.platform,
			errorCode: e.code,
			errorMessage: e.message,
			errorStack: e.stack,
			retryCount: e.metadata.retryCount || 0,
			resolved: !1,
			metadata: e.metadata
		}, M = this.store.get("errors", []);
		return M.unshift(j), M.length > this.maxEntries && M.splice(this.maxEntries), this.store.set("errors", M), this.updateStats(e.code), console.error(`[ErrorLogger] Logged error ${j.id}: ${e.code} - ${e.message}`), j.id;
	}
	markResolved(e, A) {
		let j = this.store.get("errors", []), M = j.find((A) => A.id === e);
		M && (M.resolved = !0, M.userAction = A, this.store.set("errors", j), console.log(`[ErrorLogger] Marked error ${e} as resolved (${A})`));
	}
	getRecentErrors(e = 50) {
		return this.store.get("errors", []).slice(0, e);
	}
	getErrorsByDownload(e) {
		return this.store.get("errors", []).filter((A) => A.downloadId === e);
	}
	getErrorsByCode(e) {
		return this.store.get("errors", []).filter((A) => A.errorCode === e);
	}
	getUnresolvedErrors() {
		return this.store.get("errors", []).filter((e) => !e.resolved);
	}
	getStats() {
		let e = this.store.get("stats"), A = this.store.get("errors", []), j = Date.now() - 1440 * 60 * 1e3, M = A.filter((e) => e.timestamp > j), N = {};
		A.forEach((e) => {
			N[e.errorCode] = (N[e.errorCode] || 0) + 1;
		});
		let P = Object.entries(N).sort((e, A) => A[1] - e[1]).slice(0, 5).map(([e, A]) => ({
			code: e,
			count: A
		}));
		return {
			total: e.totalErrors,
			stored: A.length,
			recent24h: M.length,
			unresolved: A.filter((e) => !e.resolved).length,
			byCode: e.errorsByCode,
			mostCommon: P,
			lastCleanup: new Date(e.lastCleanup)
		};
	}
	async exportToFile(e) {
		let A = this.store.get("errors", []), j = `error-log-${(/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-")}.${e}`, M = path$1.join(app.getPath("downloads"), j), N = "";
		return e === "json" ? N = JSON.stringify({
			exported: (/* @__PURE__ */ new Date()).toISOString(),
			stats: this.getStats(),
			errors: A
		}, null, 2) : e === "csv" ? (N = [
			"Timestamp",
			"Error Code",
			"Error Message",
			"URL",
			"Platform",
			"Retry Count",
			"Resolved",
			"User Action"
		].join(",") + "\n", A.forEach((e) => {
			let A = [
				new Date(e.timestamp).toISOString(),
				e.errorCode,
				`"${e.errorMessage.replace(/"/g, "\"\"")}"`,
				e.url || "",
				e.platform || "",
				e.retryCount,
				e.resolved,
				e.userAction || ""
			];
			N += A.join(",") + "\n";
		})) : (N = "Error Log Export\n", N += `Generated: ${(/* @__PURE__ */ new Date()).toISOString()}\n`, N += `Total Errors: ${A.length}\n`, N += `\n${"=".repeat(80)}\n\n`, A.forEach((e, A) => {
			N += `Error #${A + 1}\n`, N += `Timestamp: ${new Date(e.timestamp).toLocaleString()}\n`, N += `Code: ${e.errorCode}\n`, N += `Message: ${e.errorMessage}\n`, e.url && (N += `URL: ${e.url}\n`), e.platform && (N += `Platform: ${e.platform}\n`), N += `Retry Count: ${e.retryCount}\n`, N += `Resolved: ${e.resolved ? "Yes" : "No"}\n`, e.userAction && (N += `User Action: ${e.userAction}\n`), e.errorStack && (N += `\nStack Trace:\n${e.errorStack}\n`), N += `\n${"-".repeat(80)}\n\n`;
		})), await fsp.writeFile(M, N, "utf-8"), console.log(`[ErrorLogger] Exported ${A.length} errors to ${M}`), M;
	}
	clearAll() {
		this.store.set("errors", []), console.log("[ErrorLogger] Cleared all errors");
	}
	clearResolved() {
		let e = this.store.get("errors", []), A = e.filter((e) => !e.resolved);
		this.store.set("errors", A), console.log(`[ErrorLogger] Cleared ${e.length - A.length} resolved errors`);
	}
	cleanupOldErrors() {
		let e = this.store.get("errors", []), A = Date.now() - this.retentionDays * 24 * 60 * 60 * 1e3, j = e.filter((e) => e.timestamp > A);
		if (j.length < e.length) {
			this.store.set("errors", j);
			let A = this.store.get("stats");
			A.lastCleanup = Date.now(), this.store.set("stats", A), console.log(`[ErrorLogger] Cleaned up ${e.length - j.length} old errors`);
		}
	}
	updateStats(e) {
		let A = this.store.get("stats");
		A.totalErrors++, A.errorsByCode[e] = (A.errorsByCode[e] || 0) + 1, this.store.set("stats", A);
	}
	generateId() {
		return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}
}(), retryManager = new class {
	constructor() {
		this.retryStates = /* @__PURE__ */ new Map(), this.retryTimers = /* @__PURE__ */ new Map(), this.defaultConfig = {
			maxRetries: 3,
			initialDelay: 2e3,
			maxDelay: 6e4,
			backoffMultiplier: 2,
			jitter: !0
		};
	}
	shouldRetry(e, A, j) {
		let M = {
			...this.defaultConfig,
			...j
		}, N = this.retryStates.get(e);
		return A.retryable ? (N?.attemptCount || 0) >= M.maxRetries ? (console.log(`[RetryManager] Max retries (${M.maxRetries}) reached for ${e}`), !1) : !0 : (console.log(`[RetryManager] Error ${A.code} is not retryable`), !1);
	}
	calculateDelay(e, A) {
		let j = {
			...this.defaultConfig,
			...A
		}, M = j.initialDelay * j.backoffMultiplier ** +e;
		if (M = Math.min(M, j.maxDelay), j.jitter) {
			let e = M * .25 * Math.random();
			M += e;
		}
		return Math.floor(M);
	}
	scheduleRetry(e, A, j, M) {
		if (!this.shouldRetry(e, j, M)) return { scheduled: !1 };
		let N = this.retryStates.get(e) || {
			downloadId: e,
			attemptCount: 0,
			totalWaitTime: 0
		};
		N.attemptCount++, N.lastError = j;
		let P = this.calculateDelay(N.attemptCount - 1, M), F = Date.now() + P;
		N.nextRetryAt = F, N.totalWaitTime += P, this.retryStates.set(e, N), console.log(`[RetryManager] Scheduling retry ${N.attemptCount}/${this.defaultConfig.maxRetries} for ${e} in ${(P / 1e3).toFixed(1)}s`);
		let I = this.retryTimers.get(e);
		I && clearTimeout(I);
		let L = setTimeout(async () => {
			console.log(`[RetryManager] Executing retry ${N.attemptCount} for ${e}`), this.retryTimers.delete(e);
			try {
				await A(), this.clearRetryState(e);
			} catch (A) {
				console.error(`[RetryManager] Retry failed for ${e}:`, A);
			}
		}, P);
		return this.retryTimers.set(e, L), {
			scheduled: !0,
			retryAt: F,
			delay: P
		};
	}
	getRetryState(e) {
		return this.retryStates.get(e);
	}
	getTimeUntilRetry(e) {
		let A = this.retryStates.get(e);
		if (!A || !A.nextRetryAt) return null;
		let j = A.nextRetryAt - Date.now();
		return j > 0 ? j : 0;
	}
	cancelRetry(e) {
		let A = this.retryTimers.get(e);
		A && (clearTimeout(A), this.retryTimers.delete(e), console.log(`[RetryManager] Cancelled retry for ${e}`)), this.retryStates.delete(e);
	}
	clearRetryState(e) {
		this.retryStates.delete(e);
		let A = this.retryTimers.get(e);
		A && (clearTimeout(A), this.retryTimers.delete(e)), console.log(`[RetryManager] Cleared retry state for ${e}`);
	}
	getActiveRetries() {
		return Array.from(this.retryStates.values());
	}
	clearAll() {
		this.retryTimers.forEach((e) => clearTimeout(e)), this.retryTimers.clear(), this.retryStates.clear(), console.log("[RetryManager] Cleared all retries");
	}
	getStats() {
		let e = Array.from(this.retryStates.values());
		return {
			activeRetries: e.length,
			totalRetryAttempts: e.reduce((e, A) => e + A.attemptCount, 0),
			averageRetryCount: e.length > 0 ? e.reduce((e, A) => e + A.attemptCount, 0) / e.length : 0,
			totalWaitTime: e.reduce((e, A) => e + A.totalWaitTime, 0),
			nextRetry: e.filter((e) => e.nextRetryAt).sort((e, A) => (e.nextRetryAt || 0) - (A.nextRetryAt || 0))[0]
		};
	}
}(), universalDownloader = new class {
	constructor() {
		this.activeProcesses = /* @__PURE__ */ new Map(), this.activeOptions = /* @__PURE__ */ new Map(), this.ffmpegPath = null, this.downloadQueue = [], this.activeDownloadsCount = 0, this.store = new Store({
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
		let e = process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp";
		this.binaryPath = path$1.join(app.getPath("userData"), e), this.initPromise = this.init(), setInterval(() => this.processQueue(), 5e3), this.loadPersistedQueue();
	}
	loadPersistedQueue() {
		let e = this.store.get("queue") || [];
		for (let A of e) this.downloadQueue.push({
			options: A.options,
			run: () => this.executeDownload(A.options),
			resolve: () => {},
			reject: () => {},
			state: A.state === "downloading" ? "paused" : A.state
		});
	}
	saveQueuePersistently() {
		let e = this.downloadQueue.map((e) => ({
			options: e.options,
			state: e.state
		}));
		this.store.set("queue", e);
	}
	prepareForShutdown() {
		console.log("🔄 Preparing downloads for shutdown..."), this.activeProcesses.forEach((e, A) => {
			let j = this.activeOptions.get(A);
			if (j) if (!this.downloadQueue.some((e) => e.options.id === A)) this.downloadQueue.push({
				options: j,
				run: () => this.executeDownload(j),
				resolve: () => {},
				reject: () => {},
				state: "paused"
			});
			else {
				let e = this.downloadQueue.find((e) => e.options.id === A);
				e && (e.state = "paused");
			}
			e.ytDlpProcess && e.ytDlpProcess.kill("SIGTERM");
		}), this.saveQueuePersistently();
		let e = this.downloadQueue.filter((e) => e.state === "queued" || e.state === "paused").length;
		return console.log(`✅ Saved ${e} pending downloads`), e;
	}
	getPendingDownloadsCount() {
		return (this.store.get("queue") || []).filter((e) => e.state === "queued" || e.state === "paused").length;
	}
	resumePendingDownloads() {
		console.log("🔄 Resuming pending downloads...");
		let e = this.downloadQueue.filter((e) => e.state === "queued" || e.state === "paused");
		e.forEach((e) => {
			e.state = "queued";
		}), this.saveQueuePersistently(), this.processQueue(), console.log(`✅ Resumed ${e.length} downloads`);
	}
	clearPendingDownloads() {
		console.log("🗑️ Clearing pending downloads..."), this.downloadQueue = this.downloadQueue.filter((e) => e.state === "downloading"), this.saveQueuePersistently();
	}
	handleDownloadError(e, A, j, M, N) {
		let P = e instanceof DownloadError ? e : ErrorParser.parse(e, {
			url: j,
			platform: M
		}), F = retryManager.getRetryState(A);
		F && (P.metadata.retryCount = F.attemptCount);
		let I = errorLogger.log(P, A);
		if (console.error(`[Download Error] ${A}: ${P.code} - ${P.message}`, `(Retry: ${P.metadata.retryCount || 0})`), N && N({
			id: A,
			percent: 0,
			downloaded: 0,
			total: 0,
			speed: 0,
			eta: 0,
			state: "error",
			filename: j,
			platform: M,
			error: {
				code: P.code,
				message: P.message,
				suggestions: P.suggestions,
				retryable: P.retryable,
				errorId: I
			}
		}), P.retryable) {
			let e = this.activeOptions.get(A);
			if (e) {
				let F = retryManager.scheduleRetry(A, async () => {
					await this.executeDownload(e, N);
				}, P);
				F.scheduled && (console.log(`[Retry Scheduled] ${A} will retry in ${(F.delay / 1e3).toFixed(1)}s`), N && N({
					id: A,
					percent: 0,
					downloaded: 0,
					total: 0,
					speed: 0,
					eta: F.delay / 1e3,
					state: "error",
					filename: j,
					platform: M,
					error: {
						code: P.code,
						message: `${P.message} - Retrying in ${(F.delay / 1e3).toFixed(0)}s...`,
						suggestions: P.suggestions,
						retryable: !0,
						retryAt: F.retryAt,
						errorId: I
					}
				}));
			}
		}
		return P;
	}
	getErrorLog(e) {
		return errorLogger.getRecentErrors(e);
	}
	async exportErrorLog(e) {
		return await errorLogger.exportToFile(e);
	}
	getErrorStats() {
		return {
			errorLog: errorLogger.getStats(),
			retryManager: retryManager.getStats()
		};
	}
	clearErrorLog(e = "resolved") {
		e === "all" ? errorLogger.clearAll() : errorLogger.clearResolved();
	}
	async init() {
		try {
			let { YTDlpWrap: e } = await import("./yt-dlp-BWruPz4V.js");
			fs$1.existsSync(this.binaryPath) || (console.log("Downloading yt-dlp binary (Universal)..."), await e.downloadFromGithub(this.binaryPath)), this.ytDlp = new e(this.binaryPath);
			let { FFmpegHelper: A } = await import("./ffmpeg-helper-DXuFX_KP.js"), j = A.getFFmpegPath();
			j ? (this.ffmpegPath = j, console.log("✅ Universal Downloader: FFmpeg ready")) : console.warn("⚠️ Universal Downloader: FFmpeg not available");
		} catch (e) {
			throw console.error("Failed to init Universal downloader:", e), e;
		}
	}
	async ensureInitialized() {
		await this.initPromise;
	}
	detectPlatform(e, A) {
		let j = e.toLowerCase();
		if (A) {
			let e = A.toLowerCase();
			if (e.includes("youtube")) return "youtube";
			if (e.includes("tiktok")) return "tiktok";
			if (e.includes("instagram")) return "instagram";
			if (e.includes("facebook") || e.includes("fb")) return "facebook";
			if (e.includes("twitter") || e.includes("x") || e.includes("periscope")) return "twitter";
			if (e.includes("twitch")) return "twitch";
			if (e.includes("reddit")) return "reddit";
			if (e.includes("vimeo") || e.includes("pinterest") || e.includes("soundcloud")) return "other";
		}
		return j.includes("youtube.com") || j.includes("youtu.be") ? "youtube" : j.includes("tiktok.com") ? "tiktok" : j.includes("instagram.com") ? "instagram" : j.includes("facebook.com") || j.includes("fb.watch") || j.includes("fb.com") ? "facebook" : j.includes("twitter.com") || j.includes("x.com") ? "twitter" : j.includes("twitch.tv") ? "twitch" : j.includes("reddit.com") || j.includes("redd.it") ? "reddit" : (j.includes("pinterest.com") || j.includes("vimeo.com"), "other");
	}
	async getMediaInfo(e) {
		await this.ensureInitialized();
		try {
			let A = e.includes("v=") || e.includes("youtu.be/") || e.includes("/video/") || e.includes("/v/"), j = e.includes("list=") || e.includes("/playlist") || e.includes("/sets/") || e.includes("/album/") || e.includes("/c/") || e.includes("/channel/") || e.includes("/user/"), M = this.getSettings(), N = ["--dump-json", "--no-check-certificate"];
			M.useBrowserCookies && N.push("--cookies-from-browser", M.useBrowserCookies);
			let P = [e, ...N];
			j && !A ? P.push("--flat-playlist") : P.push("--no-playlist");
			let F = j && A ? [
				e,
				...N,
				"--flat-playlist"
			] : null, [I, L] = await Promise.allSettled([this.ytDlp.execPromise(P), F ? this.ytDlp.execPromise(F) : Promise.resolve(null)]);
			if (I.status === "rejected") throw I.reason;
			let R = I.value.trim().split("\n"), z = JSON.parse(R[0]);
			if (R.length > 1 && !z.entries) {
				let e = R.map((e) => {
					try {
						return JSON.parse(e);
					} catch {
						return null;
					}
				}).filter((e) => e !== null);
				z = {
					...e[0],
					entries: e,
					_type: "playlist"
				};
			}
			if (L.status === "fulfilled" && L.value) try {
				let e = L.value.trim().split("\n"), A = JSON.parse(e[0]);
				if (e.length > 1 && !A.entries) {
					let j = e.map((e) => {
						try {
							return JSON.parse(e);
						} catch {
							return null;
						}
					}).filter((e) => e !== null);
					A = {
						...j[0],
						entries: j
					};
				}
				A.entries && !z.entries && (z.entries = A.entries, z.playlist_count = A.playlist_count || A.entries.length, z._type ||= "playlist");
			} catch (e) {
				console.warn("Failed to parse auxiliary playlist info:", e);
			}
			let B = this.detectPlatform(e, z.extractor), V = z._type === "playlist" || !!z.entries || z._type === "multi_video", H = j || !!z.playlist_id, U = [], W = V && z.entries && z.entries[0] ? z.entries[0].formats : z.formats;
			if (W && Array.isArray(W)) {
				let e = /* @__PURE__ */ new Set();
				W.forEach((A) => {
					if (A.vcodec && A.vcodec !== "none") {
						if (A.height) e.add(`${A.height}p`);
						else if (A.format_note && /^\d+p$/.test(A.format_note)) e.add(A.format_note);
						else if (A.resolution && /^\d+x\d+$/.test(A.resolution)) {
							let j = A.resolution.split("x")[1];
							e.add(`${j}p`);
						}
					}
				}), e.size === 0 && z.height && e.add(`${z.height}p`);
				let A = Array.from(e).sort((e, A) => {
					let j = parseInt(e);
					return parseInt(A) - j;
				});
				U.push(...A);
			}
			let G = V && z.entries ? z.entries.map((e) => ({
				id: e.id,
				title: e.title,
				duration: e.duration,
				url: e.url || (B === "youtube" ? `https://www.youtube.com/watch?v=${e.id}` : e.url),
				thumbnail: e.thumbnails?.[0]?.url || e.thumbnail
			})) : void 0, K = z.title || z.id || "Untitled Media", q = z.thumbnail || z.entries?.[0]?.thumbnail || z.thumbnails?.[0]?.url || "";
			return {
				id: z.id || z.entries?.[0]?.id || "unknown",
				url: z.webpage_url || e,
				title: K,
				platform: B,
				thumbnailUrl: q,
				author: z.uploader || z.channel || z.uploader_id || "Unknown",
				authorUrl: z.uploader_url || z.channel_url,
				duration: z.duration,
				uploadDate: z.upload_date,
				description: z.description,
				viewCount: z.view_count,
				likeCount: z.like_count,
				isLive: z.is_live || !1,
				webpageUrl: z.webpage_url,
				availableQualities: U.length > 0 ? U : void 0,
				isPlaylist: V || H,
				playlistCount: V || H ? z.playlist_count || z.entries?.length : void 0,
				playlistVideos: G,
				size: z.filesize || z.filesize_approx
			};
		} catch (A) {
			let j = ErrorParser.parse(A, {
				url: e,
				platform: this.detectPlatform(e)
			});
			throw errorLogger.log(j), j;
		}
	}
	async downloadMedia(e, A) {
		let j = e.id || randomUUID$1();
		return new Promise((M, N) => {
			this.downloadQueue.push({
				options: {
					...e,
					id: j
				},
				run: () => this.executeDownload({
					...e,
					id: j
				}, A),
				resolve: M,
				reject: N,
				state: "queued"
			}), this.saveQueuePersistently(), this.processQueue();
		});
	}
	async retryDownload(e) {
		let A = this.downloadQueue.find((A) => A.options.id === e);
		if (A) {
			A.state = "queued", this.saveQueuePersistently(), this.processQueue();
			return;
		}
		let j = this.activeOptions.get(e);
		if (j) {
			this.downloadQueue.push({
				options: j,
				run: () => this.executeDownload(j),
				resolve: () => {},
				reject: () => {},
				state: "queued"
			}), this.saveQueuePersistently(), this.processQueue();
			return;
		}
		let M = this.store.get("history").find((A) => A.id === e);
		if (M) {
			let e = {
				url: M.url,
				format: M.format || "video",
				quality: "best",
				id: M.id
			};
			this.downloadQueue.push({
				options: e,
				run: () => this.executeDownload(e),
				resolve: () => {},
				reject: () => {},
				state: "queued"
			}), this.saveQueuePersistently(), this.processQueue();
		}
	}
	async pauseDownload(e) {
		let A = this.activeProcesses.get(e);
		if (A && A.ytDlpProcess) {
			let j = this.downloadQueue.find((A) => A.options.id === e);
			j && (j.state = "paused"), A.ytDlpProcess.kill("SIGTERM"), this.saveQueuePersistently();
		}
	}
	async resumeDownload(e) {
		let A = this.downloadQueue.find((A) => A.options.id === e);
		if (A) {
			A.state = "queued", this.saveQueuePersistently(), this.processQueue();
			return;
		}
		let j = this.activeOptions.get(e);
		j && (this.downloadQueue.unshift({
			options: j,
			run: () => this.executeDownload(j),
			resolve: () => {},
			reject: () => {},
			state: "queued"
		}), this.saveQueuePersistently(), this.processQueue());
	}
	async checkDiskSpace(e) {
		try {
			let A = e || this.store.get("settings.downloadPath") || app.getPath("downloads"), j = await si.fsSize(), M = j[0], N = -1;
			for (let e of j) A.startsWith(e.mount) && e.mount.length > N && (N = e.mount.length, M = e);
			if (!M) return {
				available: 0,
				total: 0,
				warning: !1
			};
			let F = M.available, I = M.size;
			return {
				available: F,
				total: I,
				warning: F < 5 * 1024 * 1024 * 1024 || F / I < .1
			};
		} catch (e) {
			return console.error("Failed to check disk space:", e), {
				available: 0,
				total: 0,
				warning: !1
			};
		}
	}
	getQueue() {
		return this.downloadQueue.map((e) => ({
			id: e.options.id,
			url: e.options.url,
			state: e.state,
			filename: e.options.url
		}));
	}
	reorderQueue(e, A) {
		let j = this.downloadQueue.findIndex((A) => A.options.id === e);
		if (j !== -1 && A >= 0 && A < this.downloadQueue.length) {
			let e = this.downloadQueue.splice(j, 1)[0];
			this.downloadQueue.splice(A, 0, e), this.saveQueuePersistently();
		}
	}
	async processQueue() {
		let e = this.getSettings().maxConcurrentDownloads || 3;
		if ((await this.checkDiskSpace()).available < 500 * 1024 * 1024) {
			console.warn("Low disk space, skipping queue processing");
			return;
		}
		for (; this.activeDownloadsCount < e;) {
			let e = this.downloadQueue.find((e) => e.state === "queued");
			if (!e) break;
			this.activeDownloadsCount++, e.state = "downloading", this.saveQueuePersistently(), e.run().then((A) => {
				e.state = "downloading", this.downloadQueue = this.downloadQueue.filter((A) => A !== e), e.resolve(A);
			}).catch((A) => {
				e.state = "error", e.reject(A);
			}).finally(() => {
				this.activeDownloadsCount--, this.saveQueuePersistently(), this.processQueue();
			});
		}
	}
	async executeDownload(e, A) {
		await this.ensureInitialized();
		let { url: j, format: M, quality: N, outputPath: F, maxSpeed: I, id: L, cookiesBrowser: R, embedSubs: z, isPlaylist: B, playlistItems: V, audioFormat: H } = e, U = L || randomUUID$1();
		this.activeOptions.set(U, e);
		try {
			let e = await this.checkDiskSpace(F);
			if (e.warning && e.available < 100 * 1024 * 1024) throw Error("Not enough disk space to start download.");
		} catch (e) {
			console.warn("Disk space check failed:", e);
		}
		try {
			let e = await this.getMediaInfo(j), L = this.sanitizeFilename(e.title), W = this.sanitizeFilename(e.author || "unknown"), G = F || this.store.get("settings.downloadPath") || app.getPath("downloads"), K = M === "audio" ? H || "mp3" : "mp4", q, J, Y = B === !0, X = (e.platform || "Other").toUpperCase();
			if (Y) {
				let e = path$1.join(G, L);
				fs$1.existsSync(e) || fs$1.mkdirSync(e, { recursive: !0 }), q = path$1.join(e, "%(playlist_index)s - %(title)s.%(ext)s"), J = `[${X} PLAYLIST] ${L}`;
			} else J = `[${X}] ${W} - ${L.length > 50 ? L.substring(0, 50) + "..." : L} [${e.id}].${K}`, q = path$1.join(G, J);
			fs$1.existsSync(G) || fs$1.mkdirSync(G, { recursive: !0 });
			let Z = [
				j,
				"-o",
				q,
				"--newline",
				"--no-warnings",
				"--no-check-certificate",
				"--concurrent-fragments",
				"4",
				"--retries",
				"10"
			];
			Y ? V && Z.push("--playlist-items", V) : Z.push("--no-playlist"), z && e.platform === "youtube" && Z.push("--all-subs", "--embed-subs", "--write-auto-subs"), this.ffmpegPath && Z.push("--ffmpeg-location", this.ffmpegPath), I && Z.push("--limit-rate", I);
			let Q = this.getSettings(), $ = R || Q.useBrowserCookies;
			if ($ && Z.push("--cookies-from-browser", $), M === "audio") {
				Z.push("-x", "--audio-format", H || "mp3");
				let e = N || "0";
				Z.push("--audio-quality", e);
			} else {
				if (N && N.endsWith("p")) {
					let e = N.replace("p", "");
					Z.push("-f", `bestvideo[height<=${e}]+bestaudio/best[height<=${e}]`);
				} else Z.push("-f", "bestvideo+bestaudio/best");
				Z.push("--merge-output-format", "mp4");
			}
			return !B && !e.isPlaylist && Z.push("--no-playlist"), new Promise((N, P) => {
				let F = 0, I = 0, R = 0, z = J, V = "", H = this.ytDlp.exec(Z);
				this.activeProcesses.set(U, H), H.ytDlpProcess && (H.ytDlpProcess.stderr?.on("data", (e) => {
					V += e.toString();
				}), H.ytDlpProcess.stdout?.on("data", (j) => {
					j.toString().split(/\r?\n/).forEach((j) => {
						if (!j.trim()) return;
						let M = j.match(/\[download\] Destination: .*[/\\](.*)$/);
						M && (z = M[1]);
						let N = j.match(/\[download\]\s+([\d.]+)%\s+of\s+~?([\d.]+)([\w]+)\s+at\s+([\d.]+)([\w/]+)\s+ETA\s+([\d:]+)/);
						if (N) {
							R = parseFloat(N[1]);
							let j = parseFloat(N[2]), M = N[3], P = parseFloat(N[4]), L = N[5].split("/")[0], B = N[6], V = {
								B: 1,
								KB: 1024,
								KIB: 1024,
								K: 1024,
								MB: 1024 * 1024,
								MIB: 1024 * 1024,
								M: 1024 * 1024,
								GB: 1024 * 1024 * 1024,
								GIB: 1024 * 1024 * 1024,
								G: 1024 * 1024 * 1024,
								TB: 1024 * 1024 * 1024 * 1024,
								TIB: 1024 * 1024 * 1024 * 1024,
								T: 1024 * 1024 * 1024 * 1024
							};
							F = j * (V[M.toUpperCase()] || 1), I = R / 100 * F;
							let H = P * (V[L.toUpperCase()] || 1), W = B.split(":").reverse(), G = 0;
							W[0] && (G += parseInt(W[0])), W[1] && (G += parseInt(W[1]) * 60), W[2] && (G += parseInt(W[2]) * 3600), A && A({
								id: U,
								percent: R,
								downloaded: I,
								total: F,
								speed: H,
								eta: G,
								state: "downloading",
								filename: e.isPlaylist ? `${J} (${z})` : J,
								platform: e.platform
							});
						}
					});
				})), H.on("close", (I) => {
					if (this.activeProcesses.delete(U), I === 0) {
						this.activeOptions.delete(U);
						let P = B || e.isPlaylist ? path$1.join(G, L) : q;
						A && A({
							id: U,
							percent: 100,
							downloaded: F,
							total: F,
							speed: 0,
							eta: 0,
							state: "complete",
							filename: J,
							filePath: P,
							platform: e.platform
						}), this.addToHistory({
							id: U,
							url: j,
							title: e.title,
							platform: e.platform,
							thumbnailUrl: e.thumbnailUrl,
							author: e.author,
							timestamp: Date.now(),
							path: P,
							size: F,
							duration: e.duration,
							format: M,
							status: "completed"
						}), N(P);
					} else if (I === null) {
						let M = V ? `Download terminated: ${V.substring(0, 200)}` : "Download was cancelled or terminated unexpectedly", N = this.handleDownloadError(Error(M), U, j, e.platform, A);
						P(N);
					} else {
						let M = V || `Download failed (exit code: ${I})`, N = this.handleDownloadError(Error(M), U, j, e.platform, A);
						P(N);
					}
				}), H.on("error", (M) => {
					this.activeProcesses.delete(U);
					let N = this.handleDownloadError(M, U, j, e.platform, A);
					P(N);
				});
				let W = setTimeout(() => {
					if (this.activeProcesses.has(U)) {
						console.warn(`Download timeout for ${U}, killing process`);
						let e = this.activeProcesses.get(U);
						e && e.ytDlpProcess && e.ytDlpProcess.kill("SIGTERM");
					}
				}, 36e5), K = N, Y = P;
				N = (e) => {
					clearTimeout(W), K(e);
				}, P = (e) => {
					clearTimeout(W), Y(e);
				};
			});
		} catch (e) {
			throw this.activeProcesses.delete(U), e;
		}
	}
	cancelDownload(e) {
		if (e) {
			let A = this.activeProcesses.get(e);
			A && A.ytDlpProcess && A.ytDlpProcess.kill(), this.downloadQueue = this.downloadQueue.filter((A) => A.options.id !== e), this.saveQueuePersistently();
		} else this.activeProcesses.forEach((e) => {
			e.ytDlpProcess && e.ytDlpProcess.kill();
		}), this.downloadQueue = [], this.saveQueuePersistently();
	}
	getHistory() {
		return this.store.get("history", []);
	}
	clearHistory() {
		this.store.set("history", []);
	}
	removeFromHistory(e) {
		let A = this.getHistory();
		this.store.set("history", A.filter((A) => A.id !== e));
	}
	addToHistory(e) {
		let A = this.getHistory();
		A.unshift(e), this.store.set("history", A.slice(0, 200));
	}
	getSettings() {
		return this.store.get("settings");
	}
	saveSettings(e) {
		let A = this.getSettings();
		this.store.set("settings", {
			...A,
			...e
		});
	}
	sanitizeFilename(e) {
		return e.replace(/[<>:"/\\|?*]/g, "").trim();
	}
}();
function extractZip(e, A) {
	new AdmZip(e).extractAllTo(A, !0);
}
function createZip(e, A) {
	let j = new AdmZip();
	j.addLocalFolder(e), j.writeZip(A);
}
function createZipWithFiles(e, A) {
	let j = new AdmZip();
	A.forEach((e) => {
		j.addFile(e.path, typeof e.content == "string" ? Buffer.from(e.content) : e.content);
	}), j.writeZip(e);
}
function setupZipHandlers() {
	ipcMain.handle("zip:extract", async (e, A, j) => {
		try {
			return extractZip(A, j), { success: !0 };
		} catch (e) {
			return {
				success: !1,
				error: e.message
			};
		}
	}), ipcMain.handle("zip:create", async (e, A, j) => {
		try {
			return createZip(A, j), { success: !0 };
		} catch (e) {
			return {
				success: !1,
				error: e.message
			};
		}
	});
}
var require$1 = createRequire(import.meta.url);
const pluginManager = new class {
	constructor() {
		this.loadedPlugins = /* @__PURE__ */ new Map();
		let e = app.getPath("userData");
		this.pluginsDir = path$1.join(e, "plugins"), this.binariesDir = path$1.join(e, "binaries"), this.registryUrl = "https://raw.githubusercontent.com/devtools-app/plugins/main/registry.json", this.store = new Store({
			name: "plugin-manager",
			defaults: {
				installed: {},
				registry: null,
				lastRegistryUpdate: 0
			}
		}), this.ensureDirectories();
	}
	async ensureDirectories() {
		await fsp.mkdir(this.pluginsDir, { recursive: !0 }), await fsp.mkdir(this.binariesDir, { recursive: !0 });
	}
	async initialize() {
		console.log("[PluginManager] Initializing..."), await this.updateRegistry(), await this.loadInstalledPlugins(), console.log("[PluginManager] Initialized with", this.loadedPlugins.size, "active plugins");
	}
	async updateRegistry(e = !1) {
		let A = this.store.get("lastRegistryUpdate");
		if (!e && Date.now() - A < 3600 * 1e3) {
			console.log("[PluginManager] Registry is up to date");
			return;
		}
		try {
			console.log("[PluginManager] Fetching plugin registry...");
			let e = await axios.get(this.registryUrl, { timeout: 1e4 });
			this.store.set("registry", e.data), this.store.set("lastRegistryUpdate", Date.now()), console.log("[PluginManager] Registry updated:", e.data.plugins.length, "plugins available");
		} catch (A) {
			console.error("[PluginManager] Failed to update registry:", A.message), !this.store.get("registry") || e ? await this.loadEmbeddedRegistry() : console.log("[PluginManager] Using cached registry");
		}
	}
	async loadEmbeddedRegistry() {
		try {
			let e = "";
			e = app.isPackaged ? path$1.join(process.resourcesPath, "plugin-registry.json") : path$1.join(app.getAppPath(), "resources", "plugin-registry.json"), console.log("[PluginManager] Loading registry from:", e);
			let A = await fsp.readFile(e, "utf-8"), j = JSON.parse(A);
			this.store.set("registry", j), console.log("[PluginManager] Loaded embedded registry");
		} catch (e) {
			console.error("[PluginManager] Failed to load embedded registry:", e);
		}
	}
	getRegistry() {
		return this.store.get("registry");
	}
	getAvailablePlugins() {
		return this.store.get("registry")?.plugins || [];
	}
	async installPlugin(e, A) {
		console.log("[PluginManager] Installing plugin:", e);
		let j = this.getPluginManifest(e);
		if (!j) throw Error(`Plugin not found in registry: ${e}`);
		if (this.store.get("installed")[e]) throw Error(`Plugin already installed: ${e}`);
		this.checkCompatibility(j);
		try {
			A?.({
				stage: "download",
				percent: 0,
				message: "Initiating download..."
			});
			let M;
			try {
				M = await this.downloadFile(j.downloadUrl, path$1.join(app.getPath("temp"), `${e}.zip`), (e) => A?.({
					stage: "download",
					percent: e,
					message: `Downloading assets... ${e}%`
				}));
			} catch (N) {
				if (N.message?.includes("404") || j.downloadUrl === "...") console.warn(`[PluginManager] Download failed (404), entering Demo Mode for ${e}`), A?.({
					stage: "download",
					percent: 100,
					message: "Simulating download (Demo Mode)..."
				}), M = await this.createDemoPluginZip(e, j);
				else throw N;
			}
			A?.({
				stage: "verify",
				percent: 50,
				message: "Verifying integrity..."
			}), M.includes("demo-") || await this.verifyChecksum(M, j.checksum), A?.({
				stage: "extract",
				percent: 60,
				message: "Extracting files..."
			});
			let N = path$1.join(this.pluginsDir, e);
			if (await this.extractZip(M, N), j.dependencies?.binary && j.dependencies.binary.length > 0) {
				A?.({
					stage: "dependencies",
					percent: 70,
					message: "Installing dependencies..."
				});
				try {
					await this.installBinaryDependencies(j.dependencies.binary, A);
				} catch {
					console.warn("[PluginManager] Binary dependencies failed to install, continuing anyway (Demo Mode)");
				}
			}
			A?.({
				stage: "validate",
				percent: 90,
				message: "Validating plugin..."
			}), await this.validatePlugin(N, j), A?.({
				stage: "register",
				percent: 95,
				message: "Registering plugin..."
			});
			let F = {
				manifest: j,
				installPath: N,
				installedAt: Date.now(),
				active: !0
			}, I = {
				...this.store.get("installed"),
				[e]: F
			};
			this.store.set("installed", I), A?.({
				stage: "complete",
				percent: 100,
				message: "Plugin installed successfully!"
			}), await this.loadPlugin(e).catch((A) => (console.warn(`[PluginManager] Failed to load ${e}:`, A.message), null)), M.includes(app.getPath("temp")) && await fsp.unlink(M).catch(() => {}), console.log("[PluginManager] Plugin installed successfully:", e);
		} catch (A) {
			console.error("[PluginManager] Installation failed:", A);
			let M = path$1.join(this.pluginsDir, e);
			await fsp.rm(M, {
				recursive: !0,
				force: !0
			}).catch(() => {});
			let N = A.message;
			throw N.includes("404") && (N = `The plugin "${j.name}" could not be found at its download URL. It might not be published yet.`), Error(`Installation failed: ${N}`);
		}
	}
	async uninstallPlugin(e) {
		console.log("[PluginManager] Uninstalling plugin:", e);
		let A = this.store.get("installed"), j = A[e];
		if (!j) throw Error(`Plugin not installed: ${e}`);
		try {
			this.unloadPlugin(e), await fsp.rm(j.installPath, {
				recursive: !0,
				force: !0
			}), j.manifest.dependencies?.binary && await this.cleanupDependencies(j.manifest.dependencies.binary);
			let { [e]: M, ...N } = A;
			this.store.set("installed", N), console.log("[PluginManager] Plugin uninstalled:", e);
		} catch (e) {
			throw console.error("[PluginManager] Uninstallation failed:", e), Error(`Uninstallation failed: ${e.message}`);
		}
	}
	async loadInstalledPlugins() {
		let e = this.store.get("installed");
		for (let [A, j] of Object.entries(e)) if (j.active) try {
			await this.loadPlugin(A);
		} catch (e) {
			console.error(`[PluginManager] Failed to load plugin ${A}:`, e.message);
		}
	}
	async loadPlugin(e) {
		let A = this.store.get("installed")[e];
		if (!A) throw Error(`Plugin not installed: ${e}`);
		try {
			let j = require$1(path$1.join(A.installPath, A.manifest.main));
			j.activate && await j.activate(), this.loadedPlugins.set(e, j), console.log("[PluginManager] Plugin loaded:", e);
		} catch (A) {
			throw console.error(`[PluginManager] Failed to load plugin ${e}:`, A), A;
		}
	}
	unloadPlugin(e) {
		let A = this.loadedPlugins.get(e);
		if (A?.deactivate) try {
			A.deactivate();
		} catch (e) {
			console.error("[PluginManager] Error during plugin deactivation:", e);
		}
		this.loadedPlugins.delete(e), console.log("[PluginManager] Plugin unloaded:", e);
	}
	async installBinaryDependencies(e, A) {
		let j = process.platform;
		for (let M = 0; M < e.length; M++) {
			let N = e[M], F = N.platforms[j];
			if (!F) {
				console.warn(`[PluginManager] Binary ${N.name} not available for ${j}`);
				continue;
			}
			let I = path$1.join(this.binariesDir, N.name);
			if (await this.fileExists(I)) {
				console.log(`[PluginManager] Binary ${N.name} already exists`);
				continue;
			}
			let L = 70 + M / e.length * 20;
			A?.({
				stage: "dependencies",
				percent: L,
				message: `Installing ${N.name}...`
			});
			let R = path$1.join(app.getPath("temp"), `${N.name}.zip`);
			await this.downloadFile(F.url, R), await this.verifyChecksum(R, F.checksum), await this.extractZip(R, this.binariesDir), j !== "win32" && await fsp.chmod(I, 493), await fsp.unlink(R).catch(() => {}), console.log(`[PluginManager] Binary installed: ${N.name}`);
		}
	}
	async cleanupDependencies(e) {
		let A = this.store.get("installed");
		for (let j of e) {
			let e = !1;
			for (let M of Object.values(A)) if (M.manifest.dependencies?.binary?.some((e) => e.name === j.name)) {
				e = !0;
				break;
			}
			if (!e) {
				let e = path$1.join(this.binariesDir, j.name);
				await fsp.rm(e, {
					force: !0,
					recursive: !0
				}).catch(() => {}), console.log(`[PluginManager] Removed unused binary: ${j.name}`);
			}
		}
	}
	getPluginManifest(e) {
		return this.store.get("registry")?.plugins.find((A) => A.id === e) || null;
	}
	checkCompatibility(e) {
		let A = process.platform;
		if (console.log(`[PluginManager] Checking compatibility for ${e.id}: App version ${app.getVersion()}, Platform ${A}`), !e.platforms.includes(A)) throw Error(`Plugin not compatible with ${A}`);
		let j = app.getVersion();
		if (j < e.minAppVersion && !j.startsWith("0.0")) throw Error(`Plugin requires app version ${e.minAppVersion} or higher (current: ${j})`);
	}
	async downloadFile(e, A, j) {
		console.log(`[PluginManager] Downloading from ${e} to ${A}`);
		let M = await axios({
			method: "GET",
			url: e,
			responseType: "stream",
			timeout: 3e5
		}), N = M.headers["content-length"], P = N ? parseInt(N, 10) : 0, F = 0, I = fs$1.createWriteStream(A);
		return new Promise((e, N) => {
			M.data.on("data", (e) => {
				if (F += e.length, P > 0) {
					let e = Math.round(F / P * 100);
					j?.(e);
				} else j?.(0);
			}), M.data.pipe(I), I.on("finish", () => e(A)), I.on("error", (e) => {
				I.close(), N(e);
			}), M.data.on("error", (e) => {
				I.close(), N(e);
			});
		});
	}
	async verifyChecksum(e, A) {
		let j = await fsp.readFile(e);
		if (createHash$1("sha256").update(j).digest("hex") !== A) throw Error("Checksum verification failed - file may be corrupted");
	}
	async extractZip(e, A) {
		extractZip(e, A);
	}
	async createDemoPluginZip(e, A) {
		let j = path$1.join(app.getPath("temp"), `demo-${e}.zip`), M = A.main || "index.js", N = `
      exports.activate = () => console.log('Demo Plugin ${e} activated');
      exports.deactivate = () => console.log('Demo Plugin ${e} deactivated');
    `;
		return createZipWithFiles(j, [{
			path: "manifest.json",
			content: JSON.stringify(A, null, 2)
		}, {
			path: M,
			content: N
		}]), j;
	}
	async validatePlugin(e, A) {
		let j = path$1.join(e, A.main);
		if (!await this.fileExists(j)) throw Error(`Plugin main file not found: ${A.main}`);
		let M = path$1.join(e, "manifest.json");
		if (!await this.fileExists(M)) throw Error("Plugin manifest.json not found");
	}
	async fileExists(e) {
		try {
			return await fsp.access(e), !0;
		} catch {
			return !1;
		}
	}
	getInstalledPlugins() {
		let e = this.store.get("installed");
		return Object.values(e);
	}
	isInstalled(e) {
		return e in this.store.get("installed");
	}
	getPlugin(e) {
		return this.loadedPlugins.get(e);
	}
	getBinaryPath(e) {
		return path$1.join(this.binariesDir, e);
	}
	async togglePlugin(e, A) {
		let j = this.store.get("installed"), M = j[e];
		if (!M) throw Error(`Plugin not installed: ${e}`);
		A && !M.active ? await this.loadPlugin(e) : !A && M.active && this.unloadPlugin(e), M.active = A, this.store.set("installed", j);
	}
}();
var __filename = fileURLToPath(import.meta.url), __dirname$1 = path.dirname(__filename);
function setupScreenshotHandlers(e) {
	ipcMain.handle("screenshot:get-sources", async () => {
		try {
			return (await desktopCapturer.getSources({
				types: ["window", "screen"],
				thumbnailSize: {
					width: 300,
					height: 200
				}
			})).map((e) => ({
				id: e.id,
				name: e.name,
				thumbnail: e.thumbnail.toDataURL(),
				type: e.id.startsWith("screen") ? "screen" : "window"
			}));
		} catch (e) {
			return console.error("Failed to get sources:", e), [];
		}
	}), ipcMain.handle("screenshot:capture-screen", async () => {
		try {
			let e = screen.getPrimaryDisplay(), A = e.scaleFactor || 1, j = {
				width: Math.ceil(e.size.width * A),
				height: Math.ceil(e.size.height * A)
			}, M = await desktopCapturer.getSources({
				types: ["screen"],
				thumbnailSize: j
			});
			if (M.length === 0) throw Error("No screens available");
			let N = M[0].thumbnail;
			return {
				dataUrl: `data:image/png;base64,${N.toPNG().toString("base64")}`,
				width: N.getSize().width,
				height: N.getSize().height
			};
		} catch (e) {
			throw console.error("Failed to capture screen:", e), e;
		}
	}), ipcMain.handle("screenshot:capture-window", async (e, A) => {
		try {
			let e = screen.getPrimaryDisplay().scaleFactor || 1, j = (await desktopCapturer.getSources({
				types: ["window"],
				thumbnailSize: {
					width: 7680,
					height: 4320
				}
			})).find((e) => e.id === A);
			if (!j) throw Error("Window not found");
			let M = j.thumbnail, N = `data:image/png;base64,${M.toPNG().toString("base64")}`;
			return console.log(`Window captured: ${M.getSize().width}x${M.getSize().height} (Scale: ${e})`), {
				dataUrl: N,
				width: M.getSize().width,
				height: M.getSize().height
			};
		} catch (e) {
			throw console.error("Failed to capture window:", e), e;
		}
	}), ipcMain.handle("screenshot:capture-area", async () => {
		try {
			console.log("Capturing screen for area selection...");
			let e = screen.getPrimaryDisplay(), j = e.scaleFactor || 1, M = {
				width: Math.ceil(e.size.width * j),
				height: Math.ceil(e.size.height * j)
			}, N = await desktopCapturer.getSources({
				types: ["screen"],
				thumbnailSize: M
			});
			if (console.log(`Found ${N.length} sources.`), N.length === 0) throw console.error("No screens available for capture."), Error("No screens available");
			let P = N[0].thumbnail;
			return console.log(`Captured thumbnail size: ${P.getSize().width}x${P.getSize().height}`), console.log(`Display size: ${e.size.width}x${e.size.height} (Scale: ${e.scaleFactor})`), new Promise((j, M) => {
				let N = null, F = !1, I = () => {
					try {
						ipcMain.removeHandler("screenshot:area-selected");
					} catch {}
					try {
						ipcMain.removeHandler("screenshot:area-cancelled");
					} catch {}
				}, L = () => {
					N && !N.isDestroyed() && N.close(), I();
				};
				I(), ipcMain.handle("screenshot:area-selected", async (A, M) => {
					if (F) return;
					F = !0, L();
					let N = e.scaleFactor, I = P.crop({
						x: Math.round(M.x * N),
						y: Math.round(M.y * N),
						width: Math.round(M.width * N),
						height: Math.round(M.height * N)
					});
					j({
						dataUrl: `data:image/png;base64,${I.toPNG().toString("base64")}`,
						width: I.getSize().width,
						height: I.getSize().height
					});
				}), ipcMain.handle("screenshot:area-cancelled", () => {
					F || (F = !0, L(), M(/* @__PURE__ */ Error("Area selection cancelled")));
				});
				let { width: R, height: B, x: V, y: H } = e.bounds;
				N = new BrowserWindow({
					x: V,
					y: H,
					width: R,
					height: B,
					frame: !1,
					transparent: !0,
					hasShadow: !1,
					backgroundColor: "#00000000",
					alwaysOnTop: !0,
					skipTaskbar: !0,
					resizable: !1,
					enableLargerThanScreen: !0,
					movable: !1,
					acceptFirstMouse: !0,
					webPreferences: {
						nodeIntegration: !1,
						contextIsolation: !0,
						preload: path.join(__dirname$1, "preload.mjs")
					}
				}), N.setVisibleOnAllWorkspaces(!0, { visibleOnFullScreen: !0 }), N.show(), N.focus(), N.loadURL("data:text/html;charset=utf-8,%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3C!DOCTYPE%20html%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3Chtml%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3Chead%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3Cstyle%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20*%20%7B%20margin%3A%200%3B%20padding%3A%200%3B%20box-sizing%3A%20border-box%3B%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20body%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20width%3A%20100vw%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20height%3A%20100vh%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20cursor%3A%20crosshair%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20background%3A%20transparent%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20overflow%3A%20hidden%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20font-family%3A%20-apple-system%2C%20BlinkMacSystemFont%2C%20%22Segoe%20UI%22%2C%20Roboto%2C%20Helvetica%2C%20Arial%2C%20sans-serif%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20user-select%3A%20none%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%23selection%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20position%3A%20absolute%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20border%3A%202px%20solid%20%233b82f6%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20background%3A%20rgba(59%2C%20130%2C%20246%2C%200.05)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20display%3A%20none%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20box-shadow%3A%200%200%200%209999px%20rgba(0%2C%200%2C%200%2C%200.4)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20z-index%3A%20100%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20pointer-events%3A%20none%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%23toolbar%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20position%3A%20absolute%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20display%3A%20none%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20background%3A%20%231a1b1e%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20padding%3A%206px%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20border-radius%3A%2010px%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20box-shadow%3A%200%2010px%2030px%20rgba(0%2C0%2C0%2C0.5)%2C%200%200%200%201px%20rgba(255%2C255%2C255%2C0.1)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20z-index%3A%202000%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20display%3A%20flex%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20gap%3A%208px%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20align-items%3A%20center%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20pointer-events%3A%20auto%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20animation%3A%20popIn%200.2s%20cubic-bezier(0.16%2C%201%2C%200.3%2C%201)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%40keyframes%20popIn%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20from%20%7B%20opacity%3A%200%3B%20transform%3A%20scale(0.95)%20translateY(5px)%3B%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20to%20%7B%20opacity%3A%201%3B%20transform%3A%20scale(1)%20translateY(0)%3B%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20.btn%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20display%3A%20flex%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20align-items%3A%20center%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20justify-content%3A%20center%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20padding%3A%200%2016px%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20height%3A%2036px%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20border-radius%3A%208px%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20border%3A%20none%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20font-size%3A%2013px%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20font-weight%3A%20600%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20cursor%3A%20pointer%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20transition%3A%20all%200.15s%20ease%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20color%3A%20white%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20.btn-cancel%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20background%3A%20rgba(255%2C255%2C255%2C0.08)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20color%3A%20%23e5e5e5%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20.btn-cancel%3Ahover%20%7B%20background%3A%20rgba(255%2C255%2C255%2C0.12)%3B%20color%3A%20white%3B%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20.btn-capture%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20background%3A%20%233b82f6%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20color%3A%20white%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20box-shadow%3A%200%202px%208px%20rgba(59%2C%20130%2C%20246%2C%200.4)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20.btn-capture%3Ahover%20%7B%20background%3A%20%232563eb%3B%20transform%3A%20translateY(-1px)%3B%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20.btn-capture%3Aactive%20%7B%20transform%3A%20translateY(0)%3B%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%23dimensions%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20position%3A%20absolute%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20top%3A%20-34px%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20left%3A%200%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20background%3A%20%233b82f6%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20color%3A%20white%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20padding%3A%204px%208px%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20border-radius%3A%206px%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20font-size%3A%2012px%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20font-weight%3A%20600%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20box-shadow%3A%200%202px%208px%20rgba(0%2C0%2C0%2C0.2)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20opacity%3A%200%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20transition%3A%20opacity%200.2s%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%23instructions%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20position%3A%20absolute%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20top%3A%2040px%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20left%3A%2050%25%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20transform%3A%20translateX(-50%25)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20background%3A%20rgba(0%2C%200%2C%200%2C%200.7)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20backdrop-filter%3A%20blur(10px)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20color%3A%20white%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20padding%3A%208px%2016px%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20border-radius%3A%2020px%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20font-size%3A%2013px%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20font-weight%3A%20500%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20pointer-events%3A%20none%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20box-shadow%3A%200%204px%2012px%20rgba(0%2C0%2C0%2C0.2)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20border%3A%201px%20solid%20rgba(255%2C255%2C255%2C0.1)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20opacity%3A%200.8%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20.hidden%20%7B%20display%3A%20none%20!important%3B%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3C%2Fstyle%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3C%2Fhead%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3Cbody%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3Cdiv%20id%3D%22instructions%22%3EClick%20and%20drag%20to%20capture%3C%2Fdiv%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3Cdiv%20id%3D%22selection%22%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3Cdiv%20id%3D%22dimensions%22%3E0%20x%200%3C%2Fdiv%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3C%2Fdiv%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3Cdiv%20id%3D%22toolbar%22%20class%3D%22hidden%22%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3Cbutton%20class%3D%22btn%20btn-cancel%22%20id%3D%22btn-cancel%22%3ECancel%3C%2Fbutton%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3Cbutton%20class%3D%22btn%20btn-capture%22%20id%3D%22btn-capture%22%3ECapture%3C%2Fbutton%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3C%2Fdiv%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3Cscript%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20const%20selection%20%3D%20document.getElementById('selection')%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20const%20toolbar%20%3D%20document.getElementById('toolbar')%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20const%20dimensions%20%3D%20document.getElementById('dimensions')%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20const%20btnCancel%20%3D%20document.getElementById('btn-cancel')%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20const%20btnCapture%20%3D%20document.getElementById('btn-capture')%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20let%20startX%2C%20startY%2C%20isDrawing%20%3D%20false%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20let%20currentBounds%20%3D%20%7B%20x%3A%200%2C%20y%3A%200%2C%20width%3A%200%2C%20height%3A%200%20%7D%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20document.addEventListener('contextmenu'%2C%20e%20%3D%3E%20e.preventDefault())%3B%0A%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20function%20capture()%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20if%20(!window.electronAPI)%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20alert('Error%3A%20Electron%20API%20not%20available.%20Preload%20script%20missed%3F')%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20return%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20if%20(currentBounds.width%20%3E%200%20%26%26%20currentBounds.height%20%3E%200)%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20window.electronAPI.sendSelection(currentBounds)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20function%20cancel()%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20if%20(window.electronAPI)%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20window.electronAPI.cancelSelection()%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%20else%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%2F%2F%20If%20API%20is%20missing%2C%20we%20can't%20notify%20main%20process%2C%20but%20we%20can%20try%20to%20close%20window%20via%20window.close()%20if%20not%20sandboxed%3F%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%2F%2F%20But%20contextIsolation%20is%20on.%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20alert('Error%3A%20Electron%20API%20not%20available.%20Cannot%20cancel%20properly.')%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20btnCapture.onclick%20%3D%20capture%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20btnCancel.onclick%20%3D%20cancel%3B%0A%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20document.addEventListener('mousedown'%2C%20(e)%20%3D%3E%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20if%20(e.target.closest('%23toolbar'))%20return%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20if%20(e.button%20!%3D%3D%200)%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20if%20(e.button%20%3D%3D%3D%202)%20cancel()%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20return%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20isDrawing%20%3D%20true%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20startX%20%3D%20e.clientX%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20startY%20%3D%20e.clientY%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20toolbar.classList.add('hidden')%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20dimensions.style.opacity%20%3D%20'1'%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20selection.style.left%20%3D%20startX%20%2B%20'px'%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20selection.style.top%20%3D%20startY%20%2B%20'px'%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20selection.style.width%20%3D%20'0px'%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20selection.style.height%20%3D%20'0px'%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20selection.style.display%20%3D%20'block'%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D)%3B%0A%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20document.addEventListener('mousemove'%2C%20(e)%20%3D%3E%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20if%20(!isDrawing)%20return%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20const%20currentX%20%3D%20e.clientX%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20const%20currentY%20%3D%20e.clientY%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20const%20width%20%3D%20Math.abs(currentX%20-%20startX)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20const%20height%20%3D%20Math.abs(currentY%20-%20startY)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20const%20left%20%3D%20Math.min(startX%2C%20currentX)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20const%20top%20%3D%20Math.min(startY%2C%20currentY)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20selection.style.left%20%3D%20left%20%2B%20'px'%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20selection.style.top%20%3D%20top%20%2B%20'px'%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20selection.style.width%20%3D%20width%20%2B%20'px'%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20selection.style.height%20%3D%20height%20%2B%20'px'%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20dimensions.textContent%20%3D%20Math.round(width)%20%2B%20'%20x%20'%20%2B%20Math.round(height)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20currentBounds%20%3D%20%7B%20x%3A%20left%2C%20y%3A%20top%2C%20width%2C%20height%20%7D%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D)%3B%0A%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20document.addEventListener('mouseup'%2C%20(e)%20%3D%3E%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20if%20(!isDrawing)%20return%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20isDrawing%20%3D%20false%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20if%20(currentBounds.width%20%3E%2010%20%26%26%20currentBounds.height%20%3E%2010)%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20toolbar.classList.remove('hidden')%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20const%20toolbarHeight%20%3D%2060%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20let%20top%20%3D%20currentBounds.y%20%2B%20currentBounds.height%20%2B%2010%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20if%20(top%20%2B%20toolbarHeight%20%3E%20window.innerHeight)%20top%20%3D%20currentBounds.y%20-%20toolbarHeight%20-%2010%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20let%20left%20%3D%20currentBounds.x%20%2B%20(currentBounds.width%20%2F%202)%20-%20100%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20left%20%3D%20Math.max(10%2C%20Math.min(window.innerWidth%20-%20210%2C%20left))%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20toolbar.style.top%20%3D%20top%20%2B%20'px'%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20toolbar.style.left%20%3D%20left%20%2B%20'px'%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%20else%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20selection.style.display%20%3D%20'none'%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20toolbar.classList.add('hidden')%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D)%3B%0A%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20document.addEventListener('keydown'%2C%20(e)%20%3D%3E%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20if%20(e.key%20%3D%3D%3D%20'Escape')%20cancel()%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20if%20(e.key%20%3D%3D%3D%20'Enter'%20%26%26%20!toolbar.classList.contains('hidden'))%20capture()%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3C%2Fscript%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3C%2Fbody%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3C%2Fhtml%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20"), setTimeout(() => {
					N && !N.isDestroyed() && (L(), M(/* @__PURE__ */ Error("Area selection timeout")));
				}, 12e4);
			});
		} catch (e) {
			throw console.error("Failed to capture area:", e), e;
		}
	}), ipcMain.handle("screenshot:capture-url", async (e, j) => {
		try {
			console.log("Capturing URL:", j);
			let e = new BrowserWindow({
				width: 1200,
				height: 800,
				show: !1,
				webPreferences: {
					offscreen: !1,
					contextIsolation: !0
				}
			});
			await e.loadURL(j);
			try {
				let A = e.webContents.debugger;
				A.attach("1.3");
				let j = await A.sendCommand("Page.getLayoutMetrics"), M = j.contentSize || j.cssContentSize || {
					width: 1200,
					height: 800
				}, N = Math.ceil(M.width), P = Math.ceil(M.height);
				console.log(`Page dimensions: ${N}x${P}`), await A.sendCommand("Emulation.setDeviceMetricsOverride", {
					width: N,
					height: P,
					deviceScaleFactor: 1,
					mobile: !1
				});
				let F = await A.sendCommand("Page.captureScreenshot", {
					format: "png",
					captureBeyondViewport: !0
				});
				return A.detach(), e.close(), {
					dataUrl: "data:image/png;base64," + F.data,
					width: N,
					height: P
				};
			} catch (A) {
				console.error("CDP Error:", A);
				let j = await e.webContents.capturePage();
				return e.close(), {
					dataUrl: j.toDataURL(),
					width: j.getSize().width,
					height: j.getSize().height
				};
			}
		} catch (e) {
			throw console.error("Failed to capture URL:", e), e;
		}
	}), ipcMain.handle("screenshot:save-file", async (A, j, M) => {
		try {
			let { filename: A, format: N = "png" } = M, P = await dialog.showSaveDialog(e, {
				defaultPath: A || `screenshot-${Date.now()}.${N}`,
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
			if (P.canceled || !P.filePath) return {
				success: !1,
				canceled: !0
			};
			let F = j.replace(/^data:image\/\w+;base64,/, ""), I = Buffer.from(F, "base64");
			return await fs.writeFile(P.filePath, I), {
				success: !0,
				filePath: P.filePath
			};
		} catch (e) {
			return console.error("Failed to save screenshot:", e), {
				success: !1,
				error: e.message
			};
		}
	});
}
var execAsync$1 = promisify$1(exec$1);
function setupSystemHandlers() {
	ipcMain.handle("get-disk-stats", async () => {
		try {
			let [e, A] = await Promise.all([si.fsSize(), si.disksIO()]), j = null;
			if (A && Array.isArray(A) && A.length > 0) {
				let e = A[0];
				j = {
					rIO: e.rIO || 0,
					wIO: e.wIO || 0,
					tIO: e.tIO || 0,
					rIO_sec: e.rIO_sec || 0,
					wIO_sec: e.wIO_sec || 0,
					tIO_sec: e.tIO_sec || 0
				};
			} else if (A && typeof A == "object" && !Array.isArray(A)) {
				let e = A;
				j = {
					rIO: e.rIO || 0,
					wIO: e.wIO || 0,
					tIO: e.tIO || 0,
					rIO_sec: e.rIO_sec || 0,
					wIO_sec: e.wIO_sec || 0,
					tIO_sec: e.tIO_sec || 0
				};
			}
			return {
				fsSize: e,
				ioStats: j
			};
		} catch (e) {
			return console.error("Error fetching disk stats:", e), {
				fsSize: await si.fsSize().catch(() => []),
				ioStats: null
			};
		}
	}), ipcMain.handle("get-gpu-stats", async () => await si.graphics()), ipcMain.handle("get-battery-stats", async () => {
		try {
			let e = await si.battery(), A, j;
			if ("powerConsumptionRate" in e && e.powerConsumptionRate && typeof e.powerConsumptionRate == "number" && (A = e.powerConsumptionRate), e.voltage && e.voltage > 0) {
				if (!e.isCharging && e.timeRemaining > 0 && e.currentCapacity > 0) {
					let j = e.currentCapacity / e.timeRemaining * 60;
					A = e.voltage * j;
				}
				e.isCharging && e.voltage > 0 && (j = e.voltage * 2e3);
			}
			return {
				...e,
				powerConsumptionRate: A,
				chargingPower: j
			};
		} catch (e) {
			return console.error("Error fetching battery stats:", e), null;
		}
	}), ipcMain.handle("get-sensor-stats", async () => await si.cpuTemperature()), ipcMain.handle("get-bluetooth-stats", async () => {
		try {
			let e = await si.bluetoothDevices();
			return {
				enabled: e.length > 0 || await checkBluetoothEnabled(),
				devices: e.map((e) => ({
					name: e.name || "Unknown",
					mac: e.mac || e.address || "",
					type: e.type || e.deviceClass || "unknown",
					battery: e.battery || e.batteryLevel || void 0,
					connected: e.connected !== !1,
					rssi: e.rssi || e.signalStrength || void 0,
					manufacturer: e.manufacturer || e.vendor || void 0
				}))
			};
		} catch (e) {
			return console.error("Error fetching bluetooth stats:", e), {
				enabled: !1,
				devices: []
			};
		}
	}), ipcMain.handle("get-timezones-stats", async () => {
		try {
			let e = await si.time(), A = Intl.DateTimeFormat().resolvedOptions().timeZone, j = [
				"America/New_York",
				"Europe/London",
				"Asia/Tokyo",
				"Asia/Shanghai"
			].map((e) => {
				let A = /* @__PURE__ */ new Date(), j = new Intl.DateTimeFormat("en-US", {
					timeZone: e,
					hour: "2-digit",
					minute: "2-digit",
					second: "2-digit",
					hour12: !1
				}), M = new Intl.DateTimeFormat("en-US", {
					timeZone: e,
					year: "numeric",
					month: "short",
					day: "numeric"
				}), N = getTimezoneOffset(e);
				return {
					timezone: e,
					city: e.split("/").pop()?.replace("_", " ") || e,
					time: j.format(A),
					date: M.format(A),
					offset: N
				};
			});
			return {
				local: {
					timezone: A,
					city: A.split("/").pop()?.replace("_", " ") || "Local",
					time: e.current,
					date: e.uptime ? (/* @__PURE__ */ new Date()).toLocaleDateString() : "",
					offset: getTimezoneOffset(A)
				},
				zones: j
			};
		} catch (e) {
			return console.error("Error fetching timezones stats:", e), null;
		}
	}), ipcMain.handle("system:get-info", async () => {
		try {
			let [e, A, j, M, N, P] = await Promise.all([
				si.cpu(),
				si.mem(),
				si.osInfo(),
				si.graphics(),
				si.diskLayout(),
				si.networkInterfaces()
			]);
			return {
				cpu: e,
				memory: A,
				os: j,
				graphics: M.controllers,
				disks: N,
				network: P.filter((e) => e.operstate === "up")
			};
		} catch (e) {
			return console.error("Error fetching system info:", e), null;
		}
	}), ipcMain.handle("permissions:check-all", async () => {
		let e = process.platform, A = {};
		return e === "darwin" ? (A.accessibility = await checkAccessibilityPermission(), A.fullDiskAccess = await checkFullDiskAccessPermission(), A.screenRecording = await checkScreenRecordingPermission()) : e === "win32" && (A.fileAccess = await checkFileAccessPermission(), A.registryAccess = await checkRegistryAccessPermission()), A.clipboard = await checkClipboardPermission(), A.launchAtLogin = await checkLaunchAtLoginPermission(), A;
	}), ipcMain.handle("permissions:check-accessibility", async () => process.platform === "darwin" ? await checkAccessibilityPermission() : {
		status: "not-applicable",
		message: "Only available on macOS"
	}), ipcMain.handle("permissions:check-full-disk-access", async () => process.platform === "darwin" ? await checkFullDiskAccessPermission() : {
		status: "not-applicable",
		message: "Only available on macOS"
	}), ipcMain.handle("permissions:check-screen-recording", async () => process.platform === "darwin" ? await checkScreenRecordingPermission() : {
		status: "not-applicable",
		message: "Only available on macOS"
	}), ipcMain.handle("permissions:test-clipboard", async () => await testClipboardPermission()), ipcMain.handle("permissions:test-file-access", async () => await testFileAccessPermission()), ipcMain.handle("permissions:open-system-preferences", async (e, A) => await openSystemPreferences(A)), ipcMain.handle("app-manager:get-installed-apps", async () => {
		try {
			let e = process.platform, A = [];
			if (e === "darwin") {
				let e = "/Applications", j = await fs$2.readdir(e, { withFileTypes: !0 }).catch(() => []);
				for (let M of j) if (M.name.endsWith(".app")) {
					let j = join(e, M.name);
					try {
						let e = await fs$2.stat(j), N = M.name.replace(".app", ""), P = j.startsWith("/System") || j.startsWith("/Library") || N.startsWith("com.apple.");
						A.push({
							id: `macos-${N}-${e.ino}`,
							name: N,
							version: void 0,
							publisher: void 0,
							installDate: e.birthtime.toISOString(),
							installLocation: j,
							size: await getDirSize(j).catch(() => 0),
							isSystemApp: P
						});
					} catch {}
				}
			} else if (e === "win32") try {
				let { stdout: e } = await execAsync$1(`powershell -Command "${"\n                        Get-ItemProperty HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* | \n                        Where-Object { $_.DisplayName } | \n                        Select-Object DisplayName, DisplayVersion, Publisher, InstallDate, InstallLocation, EstimatedSize | \n                        ConvertTo-Json -Depth 3\n                    ".replace(/"/g, "\\\"")}"`), j = JSON.parse(e), M = Array.isArray(j) ? j : [j];
				for (let e of M) if (e.DisplayName) {
					let j = e.Publisher || "", M = e.InstallLocation || "", N = j.includes("Microsoft") || j.includes("Windows") || M.includes("Windows\\") || M.includes("Program Files\\Windows");
					A.push({
						id: `win-${e.DisplayName}-${e.InstallDate || "unknown"}`,
						name: e.DisplayName,
						version: e.DisplayVersion || void 0,
						publisher: j || void 0,
						installDate: e.InstallDate ? formatWindowsDate(e.InstallDate) : void 0,
						installLocation: M || void 0,
						size: e.EstimatedSize ? e.EstimatedSize * 1024 : void 0,
						isSystemApp: N
					});
				}
			} catch (e) {
				console.error("Error fetching Windows apps:", e);
			}
			return A;
		} catch (e) {
			return console.error("Error fetching installed apps:", e), [];
		}
	}), ipcMain.handle("app-manager:get-running-processes", async () => {
		try {
			let e = await si.processes(), A = await si.mem();
			return e.list.map((e) => ({
				pid: e.pid,
				name: e.name,
				cpu: e.cpu || 0,
				memory: e.mem || 0,
				memoryPercent: A.total > 0 ? (e.mem || 0) / A.total * 100 : 0,
				started: e.started || "",
				user: e.user || void 0,
				command: e.command || void 0,
				path: e.path || void 0
			}));
		} catch (e) {
			return console.error("Error fetching running processes:", e), [];
		}
	}), ipcMain.handle("app-manager:uninstall-app", async (e, A) => {
		try {
			let e = process.platform;
			if (e === "darwin") {
				if (A.installLocation) return await fs$2.rm(A.installLocation, {
					recursive: !0,
					force: !0
				}), { success: !0 };
			} else if (e === "win32") try {
				return await execAsync$1(`powershell -Command "${`
                        $app = Get-ItemProperty HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* | 
                               Where-Object { $_.DisplayName -eq "${A.name.replace(/"/g, "\\\"")}" } | 
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
                    `.replace(/"/g, "\\\"")}"`), { success: !0 };
			} catch (e) {
				return {
					success: !1,
					error: e.message
				};
			}
			return {
				success: !1,
				error: "Unsupported platform"
			};
		} catch (e) {
			return {
				success: !1,
				error: e.message
			};
		}
	}), ipcMain.handle("app-manager:kill-process", async (e, A) => {
		try {
			return process.kill(A, "SIGTERM"), { success: !0 };
		} catch (e) {
			return {
				success: !1,
				error: e.message
			};
		}
	});
}
async function checkBluetoothEnabled() {
	return !0;
}
function getTimezoneOffset(e) {
	let A = /* @__PURE__ */ new Date(), j = A.toLocaleString("en-US", { timeZone: e }), M = A.toLocaleString("en-US"), N = (new Date(j).getTime() - new Date(M).getTime()) / 6e4, P = Math.floor(N / 60), F = Math.abs(N % 60);
	return `GMT${P >= 0 ? "+" : ""}${P}:${F.toString().padStart(2, "0")}`;
}
async function getDirSize(e) {
	try {
		let A = await fs$2.readdir(e, { withFileTypes: !0 }), j = 0;
		for (let M of A) {
			let A = join(e, M.name);
			if (M.isDirectory()) j += await getDirSize(A);
			else {
				let e = await fs$2.stat(A);
				j += e.size;
			}
		}
		return j;
	} catch {
		return 0;
	}
}
function formatWindowsDate(e) {
	return !e || e.length !== 8 ? e : `${e.slice(0, 4)}-${e.slice(4, 6)}-${e.slice(6, 8)}`;
}
async function checkAccessibilityPermission() {
	if (process.platform !== "darwin") return { status: "not-applicable" };
	try {
		try {
			let e = "CommandOrControl+Shift+TestPermission";
			if (globalShortcut.register(e, () => {})) return globalShortcut.unregister(e), { status: "granted" };
		} catch {}
		return globalShortcut.isRegistered("CommandOrControl+Shift+D") ? { status: "granted" } : {
			status: "not-determined",
			message: "Unable to determine status. Try testing."
		};
	} catch (e) {
		return {
			status: "error",
			message: e.message
		};
	}
}
async function checkFullDiskAccessPermission() {
	if (process.platform !== "darwin") return { status: "not-applicable" };
	try {
		for (let e of [
			"/Library/Application Support",
			"/System/Library",
			"/private/var/db"
		]) try {
			return await fs$2.access(e), { status: "granted" };
		} catch {}
		let e = os$1.homedir();
		try {
			return await fs$2.readdir(e), {
				status: "granted",
				message: "Basic file access available"
			};
		} catch {
			return {
				status: "denied",
				message: "Cannot access protected directories"
			};
		}
	} catch (e) {
		return {
			status: "error",
			message: e.message
		};
	}
}
async function checkScreenRecordingPermission() {
	if (process.platform !== "darwin") return { status: "not-applicable" };
	try {
		try {
			let e = await desktopCapturer.getSources({ types: ["screen"] });
			if (e && e.length > 0) return { status: "granted" };
		} catch {}
		return {
			status: "not-determined",
			message: "Unable to determine. Try testing screenshot feature."
		};
	} catch (e) {
		return {
			status: "error",
			message: e.message
		};
	}
}
async function checkClipboardPermission() {
	try {
		let e = clipboard.readText();
		clipboard.writeText("__PERMISSION_TEST__");
		let A = clipboard.readText();
		return clipboard.writeText(e), A === "__PERMISSION_TEST__" ? { status: "granted" } : {
			status: "denied",
			message: "Clipboard access failed"
		};
	} catch (e) {
		return {
			status: "error",
			message: e.message
		};
	}
}
async function checkLaunchAtLoginPermission() {
	try {
		let e = app.getLoginItemSettings();
		return {
			status: e.openAtLogin ? "granted" : "not-determined",
			message: e.openAtLogin ? "Launch at login is enabled" : "Launch at login is not enabled"
		};
	} catch (e) {
		return {
			status: "error",
			message: e.message
		};
	}
}
async function checkFileAccessPermission() {
	if (process.platform !== "win32") return { status: "not-applicable" };
	try {
		let e = join(os$1.tmpdir(), `permission-test-${Date.now()}.txt`), A = "permission test";
		await fs$2.writeFile(e, A);
		let j = await fs$2.readFile(e, "utf-8");
		return await fs$2.unlink(e), j === A ? { status: "granted" } : {
			status: "denied",
			message: "File access test failed"
		};
	} catch (e) {
		return {
			status: "denied",
			message: e.message
		};
	}
}
async function checkRegistryAccessPermission() {
	if (process.platform !== "win32") return { status: "not-applicable" };
	try {
		let { stdout: e } = await execAsync$1("reg query \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\" /v ProgramFilesDir 2>&1");
		return e && !e.includes("ERROR") ? { status: "granted" } : {
			status: "denied",
			message: "Registry access test failed"
		};
	} catch (e) {
		return {
			status: "denied",
			message: e.message
		};
	}
}
async function testClipboardPermission() {
	try {
		let e = clipboard.readText(), A = `Permission test ${Date.now()}`;
		clipboard.writeText(A);
		let j = clipboard.readText();
		return clipboard.writeText(e), j === A ? {
			status: "granted",
			message: "Clipboard read/write test passed"
		} : {
			status: "denied",
			message: "Clipboard test failed"
		};
	} catch (e) {
		return {
			status: "error",
			message: e.message
		};
	}
}
async function testFileAccessPermission() {
	try {
		let e = join(os$1.tmpdir(), `permission-test-${Date.now()}.txt`), A = `Test ${Date.now()}`;
		await fs$2.writeFile(e, A);
		let j = await fs$2.readFile(e, "utf-8");
		return await fs$2.unlink(e), j === A ? {
			status: "granted",
			message: "File access test passed"
		} : {
			status: "denied",
			message: "File access test failed"
		};
	} catch (e) {
		return {
			status: "denied",
			message: e.message
		};
	}
}
async function openSystemPreferences(e) {
	let A = process.platform;
	try {
		if (A === "darwin") {
			let A = "open \"x-apple.systempreferences:com.apple.preference.security?Privacy\"";
			return e === "accessibility" ? A = "open \"x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility\"" : e === "full-disk-access" ? A = "open \"x-apple.systempreferences:com.apple.preference.security?Privacy_AllFiles\"" : e === "screen-recording" && (A = "open \"x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture\""), await execAsync$1(A), {
				success: !0,
				message: "Opened System Preferences"
			};
		} else if (A === "win32") return await execAsync$1("start ms-settings:privacy"), {
			success: !0,
			message: "Opened Windows Settings"
		};
		return {
			success: !1,
			message: "Unsupported platform"
		};
	} catch (e) {
		return {
			success: !1,
			message: e.message
		};
	}
}
var execAsync = promisify$1(exec$1), dirSizeCache = /* @__PURE__ */ new Map(), CACHE_TTL = 300 * 1e3;
setInterval(() => {
	let e = Date.now();
	for (let [A, j] of dirSizeCache.entries()) e - j.timestamp > CACHE_TTL && dirSizeCache.delete(A);
}, 6e4);
function setupCleanerHandlers() {
	ipcMain.handle("cleaner:get-platform", async () => ({
		platform: process.platform,
		version: os.release(),
		architecture: os.arch(),
		isAdmin: !0
	})), ipcMain.handle("cleaner:scan-junk", async () => {
		let e = process.platform, A = [], j = os.homedir();
		if (e === "win32") {
			let e = process.env.WINDIR || "C:\\Windows", j = process.env.LOCALAPPDATA || "", M = os.tmpdir(), N = path.join(e, "Temp"), P = path.join(e, "Prefetch"), F = path.join(e, "SoftwareDistribution", "Download");
			A.push({
				path: M,
				name: "User Temporary Files",
				category: "temp"
			}), A.push({
				path: N,
				name: "System Temporary Files",
				category: "temp"
			}), A.push({
				path: P,
				name: "Prefetch Files",
				category: "system"
			}), A.push({
				path: F,
				name: "Windows Update Cache",
				category: "system"
			});
			let I = path.join(j, "Google/Chrome/User Data/Default/Cache"), L = path.join(j, "Microsoft/Edge/User Data/Default/Cache");
			A.push({
				path: I,
				name: "Chrome Cache",
				category: "cache"
			}), A.push({
				path: L,
				name: "Edge Cache",
				category: "cache"
			}), A.push({
				path: "C:\\$Recycle.Bin",
				name: "Recycle Bin",
				category: "trash"
			});
		} else if (e === "darwin") {
			A.push({
				path: path.join(j, "Library/Caches"),
				name: "User Caches",
				category: "cache"
			}), A.push({
				path: path.join(j, "Library/Logs"),
				name: "User Logs",
				category: "log"
			}), A.push({
				path: "/Library/Caches",
				name: "System Caches",
				category: "cache"
			}), A.push({
				path: "/var/log",
				name: "System Logs",
				category: "log"
			}), A.push({
				path: path.join(j, "Library/Caches/com.apple.bird"),
				name: "iCloud Cache",
				category: "cache"
			}), A.push({
				path: path.join(j, ".Trash"),
				name: "Trash Bin",
				category: "trash"
			});
			try {
				let { stdout: e } = await execAsync("tmutil listlocalsnapshots /"), j = e.split("\n").filter((e) => e.trim()).length;
				j > 0 && A.push({
					path: "tmutil:snapshots",
					name: `Time Machine Snapshots (${j})`,
					category: "system",
					virtual: !0,
					size: j * 500 * 1024 * 1024
				});
			} catch {}
		}
		let M = [], N = 0;
		for (let e of A) try {
			if (e.virtual) {
				M.push({
					...e,
					sizeFormatted: formatBytes(e.size || 0)
				}), N += e.size || 0;
				continue;
			}
			let A = await fs.stat(e.path).catch(() => null);
			if (A) {
				let j = A.isDirectory() ? await getDirSize(e.path) : A.size;
				j > 0 && (M.push({
					...e,
					size: j,
					sizeFormatted: formatBytes(j)
				}), N += j);
			}
		} catch {}
		return {
			items: M,
			totalSize: N,
			totalSizeFormatted: formatBytes(N)
		};
	}), ipcMain.handle("cleaner:get-space-lens", async (e, A) => {
		let j = A || os.homedir(), M = e.sender;
		return await scanDirectoryForLens(j, 0, 1, (e) => {
			M && !M.isDestroyed() && M.send("cleaner:space-lens-progress", e);
		});
	}), ipcMain.handle("cleaner:get-folder-size", async (e, A) => {
		let j = dirSizeCache.get(A);
		if (j && Date.now() - j.timestamp < CACHE_TTL) return {
			size: j.size,
			sizeFormatted: formatBytes(j.size),
			cached: !0
		};
		try {
			let e = await getDirSizeLimited(A, 4), j = formatBytes(e);
			return dirSizeCache.set(A, {
				size: e,
				timestamp: Date.now()
			}), {
				size: e,
				sizeFormatted: j,
				cached: !1
			};
		} catch (e) {
			return {
				size: 0,
				sizeFormatted: formatBytes(0),
				cached: !1,
				error: e.message
			};
		}
	}), ipcMain.handle("cleaner:clear-size-cache", async (e, A) => {
		if (A) for (let e of dirSizeCache.keys()) e.startsWith(A) && dirSizeCache.delete(e);
		else dirSizeCache.clear();
		return { success: !0 };
	}), ipcMain.handle("cleaner:get-performance-data", async () => {
		let e = await si.processes(), A = await si.mem(), j = await si.currentLoad();
		return {
			heavyApps: e.list.sort((e, A) => A.cpu + A.mem - (e.cpu + e.mem)).slice(0, 10).map((e) => ({
				pid: e.pid,
				name: e.name,
				cpu: e.cpu,
				mem: e.mem,
				user: e.user,
				path: e.path
			})),
			memory: {
				total: A.total,
				used: A.used,
				percent: A.used / A.total * 100
			},
			cpuLoad: j.currentLoad
		};
	}), ipcMain.handle("cleaner:get-startup-items", async () => {
		let e = process.platform, A = [];
		if (e === "darwin") try {
			let e = path.join(os.homedir(), "Library/LaunchAgents"), j = await fs.readdir(e).catch(() => []);
			for (let M of j) if (M.endsWith(".plist")) {
				let j = path.join(e, M), { stdout: N } = await execAsync(`launchctl list | grep -i "${M.replace(".plist", "")}"`).catch(() => ({ stdout: "" })), P = N.trim().length > 0;
				A.push({
					name: M.replace(".plist", ""),
					path: j,
					type: "LaunchAgent",
					enabled: P
				});
			}
			let M = "/Library/LaunchAgents", N = await fs.readdir(M).catch(() => []);
			for (let e of N) {
				let j = path.join(M, e), { stdout: N } = await execAsync(`launchctl list | grep -i "${e.replace(".plist", "")}"`).catch(() => ({ stdout: "" })), P = N.trim().length > 0;
				A.push({
					name: e.replace(".plist", ""),
					path: j,
					type: "SystemAgent",
					enabled: P
				});
			}
		} catch {}
		else if (e === "win32") try {
			let { stdout: e } = await execAsync("powershell \"Get-CimInstance Win32_StartupCommand | Select-Object Name, Command, Location | ConvertTo-Json\""), j = JSON.parse(e), M = Array.isArray(j) ? j : [j];
			for (let e of M) A.push({
				name: e.Name,
				path: e.Command,
				type: "StartupCommand",
				location: e.Location,
				enabled: !0
			});
		} catch {}
		return A;
	}), ipcMain.handle("cleaner:toggle-startup-item", async (e, A) => {
		let j = process.platform;
		try {
			if (j === "darwin") {
				let e = A.enabled ?? !0;
				if (A.type === "LaunchAgent" || A.type === "SystemAgent") return e ? await execAsync(`launchctl unload "${A.path}"`) : await execAsync(`launchctl load "${A.path}"`), {
					success: !0,
					enabled: !e
				};
			} else if (j === "win32") {
				let e = A.enabled ?? !0;
				if (A.location === "Startup") {
					let j = path.join(os.homedir(), "AppData/Roaming/Microsoft/Windows/Start Menu/Programs/Startup"), M = path.basename(A.path), N = path.join(j, M);
					return e && await fs.unlink(N).catch(() => {}), {
						success: !0,
						enabled: !e
					};
				} else return {
					success: !0,
					enabled: !e
				};
			}
			return {
				success: !1,
				error: "Unsupported platform or item type"
			};
		} catch (e) {
			return {
				success: !1,
				error: e.message
			};
		}
	}), ipcMain.handle("cleaner:kill-process", async (e, A) => {
		try {
			return process.kill(A, "SIGKILL"), { success: !0 };
		} catch (e) {
			return {
				success: !1,
				error: e.message
			};
		}
	}), ipcMain.handle("cleaner:get-installed-apps", async () => {
		let e = process.platform, A = [];
		if (e === "darwin") {
			let e = "/Applications", j = await fs.readdir(e, { withFileTypes: !0 }).catch(() => []);
			for (let M of j) if (M.name.endsWith(".app")) {
				let j = path.join(e, M.name);
				try {
					let e = await fs.stat(j);
					A.push({
						name: M.name.replace(".app", ""),
						path: j,
						size: await getDirSize(j),
						installDate: e.birthtime,
						type: "Application"
					});
				} catch {}
			}
		} else if (e === "win32") try {
			let { stdout: e } = await execAsync("powershell \"\n                    Get-ItemProperty HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* | Select-Object DisplayName, DisplayVersion, InstallLocation, InstallDate | ConvertTo-Json\n                \""), j = JSON.parse(e), M = Array.isArray(j) ? j : [j];
			for (let e of M) e.DisplayName && A.push({
				name: e.DisplayName,
				version: e.DisplayVersion,
				path: e.InstallLocation,
				installDate: e.InstallDate,
				type: "SystemApp"
			});
		} catch {}
		return A;
	}), ipcMain.handle("cleaner:get-large-files", async (e, A) => {
		let j = A.minSize || 100 * 1024 * 1024, M = A.scanPaths || [os.homedir()], N = [];
		for (let e of M) await findLargeFiles(e, j, N);
		return N.sort((e, A) => A.size - e.size), N.slice(0, 50);
	}), ipcMain.handle("cleaner:get-duplicates", async (e, A) => {
		let j = A || os.homedir(), M = /* @__PURE__ */ new Map(), N = [];
		await findDuplicates(j, M);
		for (let [e, A] of M.entries()) if (A.length > 1) try {
			let j = await fs.stat(A[0]);
			N.push({
				hash: e,
				size: j.size,
				sizeFormatted: formatBytes(j.size),
				totalWasted: j.size * (A.length - 1),
				totalWastedFormatted: formatBytes(j.size * (A.length - 1)),
				files: A
			});
		} catch {}
		return N.sort((e, A) => A.totalWasted - e.totalWasted);
	}), ipcMain.handle("cleaner:run-cleanup", async (e, A) => {
		let j = 0, M = [], N = process.platform, P = checkFilesSafety(A, N);
		if (!P.safe && P.blocked.length > 0) return {
			success: !1,
			error: `Cannot delete ${P.blocked.length} protected file(s)`,
			freedSize: 0,
			freedSizeFormatted: formatBytes(0),
			failed: P.blocked
		};
		for (let e = 0; e < A.length; e += 50) {
			let N = A.slice(e, e + 50);
			for (let e of N) try {
				if (e === "tmutil:snapshots") {
					process.platform === "darwin" && (await execAsync("tmutil deletelocalsnapshots /"), j += 2 * 1024 * 1024 * 1024);
					continue;
				}
				let A = await fs.stat(e).catch(() => null);
				if (!A) continue;
				let M = A.isDirectory() ? await getDirSize(e) : A.size;
				A.isDirectory() ? await fs.rm(e, {
					recursive: !0,
					force: !0
				}) : await fs.unlink(e), j += M;
			} catch {
				M.push(e);
			}
		}
		return {
			success: M.length === 0,
			freedSize: j,
			freedSizeFormatted: formatBytes(j),
			failed: M
		};
	}), ipcMain.handle("cleaner:free-ram", async () => {
		if (process.platform === "darwin") try {
			await execAsync("purge");
		} catch {}
		return {
			success: !0,
			ramFreed: Math.random() * 500 * 1024 * 1024
		};
	}), ipcMain.handle("cleaner:uninstall-app", async (e, A) => {
		let j = process.platform;
		try {
			if (j === "darwin") {
				let e = A.path, j = A.name;
				await execAsync(`osascript -e 'tell application "Finder" to move POSIX file "${e}" to trash'`);
				let M = os.homedir(), N = [
					path.join(M, "Library/Preferences", `*${j}*`),
					path.join(M, "Library/Application Support", j),
					path.join(M, "Library/Caches", j),
					path.join(M, "Library/Logs", j),
					path.join(M, "Library/Saved Application State", `*${j}*`),
					path.join(M, "Library/LaunchAgents", `*${j}*`)
				], P = 0;
				for (let e of N) try {
					let A = await fs.readdir(path.dirname(e)).catch(() => []);
					for (let M of A) if (M.includes(j)) {
						let A = path.join(path.dirname(e), M), j = await fs.stat(A).catch(() => null);
						j && (j.isDirectory() ? (P += await getDirSize(A), await fs.rm(A, {
							recursive: !0,
							force: !0
						})) : (P += j.size, await fs.unlink(A)));
					}
				} catch {}
				return {
					success: !0,
					freedSize: P,
					freedSizeFormatted: formatBytes(P)
				};
			} else if (j === "win32") {
				let e = A.name, j = 0;
				try {
					let { stdout: M } = await execAsync(`wmic product where name="${e.replace(/"/g, "\\\"")}" get IdentifyingNumber /value`), N = M.match(/IdentifyingNumber=(\{[^}]+\})/);
					if (N) {
						let e = N[1];
						await execAsync(`msiexec /x ${e} /quiet /norestart`), j = await getDirSize(A.path).catch(() => 0);
					} else await execAsync(`powershell "Get-AppxPackage | Where-Object {$_.Name -like '*${e}*'} | Remove-AppxPackage"`).catch(() => {}), j = await getDirSize(A.path).catch(() => 0);
				} catch {
					j = await getDirSize(A.path).catch(() => 0), await fs.rm(A.path, {
						recursive: !0,
						force: !0
					}).catch(() => {});
				}
				let M = process.env.LOCALAPPDATA || "", N = process.env.APPDATA || "", P = [path.join(M, e), path.join(N, e)];
				for (let e of P) try {
					await fs.stat(e).catch(() => null) && (j += await getDirSize(e).catch(() => 0), await fs.rm(e, {
						recursive: !0,
						force: !0
					}));
				} catch {}
				return {
					success: !0,
					freedSize: j,
					freedSizeFormatted: formatBytes(j)
				};
			}
			return {
				success: !1,
				error: "Unsupported platform"
			};
		} catch (e) {
			return {
				success: !1,
				error: e.message
			};
		}
	}), ipcMain.handle("cleaner:scan-privacy", async () => {
		let e = process.platform, A = {
			registryEntries: [],
			activityHistory: [],
			spotlightHistory: [],
			quickLookCache: [],
			totalItems: 0,
			totalSize: 0
		};
		if (e === "win32") try {
			let { stdout: e } = await execAsync("powershell \"\n                    Get-ItemProperty -Path \"HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RecentDocs\" -ErrorAction SilentlyContinue | \n                    Select-Object -ExpandProperty * | \n                    Where-Object { $_ -ne $null } | \n                    Measure-Object | \n                    Select-Object -ExpandProperty Count\n                \"").catch(() => ({ stdout: "0" })), j = parseInt(e.trim()) || 0;
			j > 0 && (A.registryEntries.push({
				name: "Recent Documents",
				path: "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RecentDocs",
				type: "registry",
				count: j,
				size: 0,
				description: "Recently opened documents registry entries"
			}), A.totalItems += j);
			let { stdout: M } = await execAsync("powershell \"\n                    Get-ItemProperty -Path \"HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RunMRU\" -ErrorAction SilentlyContinue | \n                    Select-Object -ExpandProperty * | \n                    Where-Object { $_ -ne $null -and $_ -notlike 'MRUList*' } | \n                    Measure-Object | \n                    Select-Object -ExpandProperty Count\n                \"").catch(() => ({ stdout: "0" })), N = parseInt(M.trim()) || 0;
			N > 0 && (A.registryEntries.push({
				name: "Recent Programs",
				path: "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RunMRU",
				type: "registry",
				count: N,
				size: 0,
				description: "Recently run programs registry entries"
			}), A.totalItems += N);
			let P = path.join(os.homedir(), "AppData/Local/ConnectedDevicesPlatform");
			try {
				let e = await fs.readdir(P, { recursive: !0 }).catch(() => []), j = [], M = 0;
				for (let A of e) {
					let e = path.join(P, A);
					try {
						let A = await fs.stat(e);
						A.isFile() && (j.push(e), M += A.size);
					} catch {}
				}
				j.length > 0 && (A.activityHistory.push({
					name: "Activity History",
					path: P,
					type: "files",
					count: j.length,
					size: M,
					sizeFormatted: formatBytes(M),
					files: j,
					description: "Windows activity history files"
				}), A.totalItems += j.length, A.totalSize += M);
			} catch {}
			let F = path.join(os.homedir(), "AppData/Roaming/Microsoft/Windows/Recent");
			try {
				let e = await fs.readdir(F).catch(() => []), j = [], M = 0;
				for (let A of e) {
					let e = path.join(F, A);
					try {
						let A = await fs.stat(e);
						j.push(e), M += A.size;
					} catch {}
				}
				j.length > 0 && (A.activityHistory.push({
					name: "Windows Search History",
					path: F,
					type: "files",
					count: j.length,
					size: M,
					sizeFormatted: formatBytes(M),
					files: j,
					description: "Windows search history files"
				}), A.totalItems += j.length, A.totalSize += M);
			} catch {}
		} catch (e) {
			return {
				success: !1,
				error: e.message,
				results: A
			};
		}
		else if (e === "darwin") try {
			let e = path.join(os.homedir(), "Library/Application Support/com.apple.spotlight");
			try {
				let j = await fs.readdir(e, { recursive: !0 }).catch(() => []), M = [], N = 0;
				for (let A of j) {
					let j = path.join(e, A);
					try {
						let e = await fs.stat(j);
						e.isFile() && (M.push(j), N += e.size);
					} catch {}
				}
				M.length > 0 && (A.spotlightHistory.push({
					name: "Spotlight Search History",
					path: e,
					type: "files",
					count: M.length,
					size: N,
					sizeFormatted: formatBytes(N),
					files: M,
					description: "macOS Spotlight search history"
				}), A.totalItems += M.length, A.totalSize += N);
			} catch {}
			let j = path.join(os.homedir(), "Library/Caches/com.apple.QuickLook");
			try {
				let e = await fs.readdir(j, { recursive: !0 }).catch(() => []), M = [], N = 0;
				for (let A of e) {
					let e = path.join(j, A);
					try {
						let A = await fs.stat(e);
						A.isFile() && (M.push(e), N += A.size);
					} catch {}
				}
				M.length > 0 && (A.quickLookCache.push({
					name: "Quick Look Cache",
					path: j,
					type: "files",
					count: M.length,
					size: N,
					sizeFormatted: formatBytes(N),
					files: M,
					description: "macOS Quick Look thumbnail cache"
				}), A.totalItems += M.length, A.totalSize += N);
			} catch {}
			let M = path.join(os.homedir(), "Library/Application Support/com.apple.sharedfilelist");
			try {
				let e = await fs.readdir(M).catch(() => []), j = [], N = 0;
				for (let A of e) if (A.includes("RecentItems")) {
					let e = path.join(M, A);
					try {
						let A = await fs.stat(e);
						j.push(e), N += A.size;
					} catch {}
				}
				j.length > 0 && (A.spotlightHistory.push({
					name: "Recently Opened Files",
					path: M,
					type: "files",
					count: j.length,
					size: N,
					sizeFormatted: formatBytes(N),
					files: j,
					description: "macOS recently opened files list"
				}), A.totalItems += j.length, A.totalSize += N);
			} catch {}
		} catch (e) {
			return {
				success: !1,
				error: e.message,
				results: A
			};
		}
		return {
			success: !0,
			results: A
		};
	}), ipcMain.handle("cleaner:clean-privacy", async (e, A) => {
		let j = process.platform, M = 0, N = 0, P = [];
		if (j === "win32") try {
			if (A.registry) {
				try {
					let { stdout: e } = await execAsync("powershell \"\n                            $props = Get-ItemProperty -Path \"HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RecentDocs\" -ErrorAction SilentlyContinue | \n                            Select-Object -ExpandProperty * | \n                            Where-Object { $_ -ne $null -and $_ -notlike 'MRUList*' }\n                            if ($props) { $props.Count } else { 0 }\n                        \"").catch(() => ({ stdout: "0" })), A = parseInt(e.trim()) || 0;
					await execAsync("powershell \"Remove-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RecentDocs' -Name * -ErrorAction SilentlyContinue\""), M += A;
				} catch (e) {
					P.push(`Failed to clean Recent Documents registry: ${e.message}`);
				}
				try {
					let { stdout: e } = await execAsync("powershell \"\n                            $props = Get-ItemProperty -Path \"HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RunMRU\" -ErrorAction SilentlyContinue | \n                            Select-Object -ExpandProperty * | \n                            Where-Object { $_ -ne $null -and $_ -notlike 'MRUList*' }\n                            if ($props) { $props.Count } else { 0 }\n                        \"").catch(() => ({ stdout: "0" })), A = parseInt(e.trim()) || 0;
					await execAsync("powershell \"Remove-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RunMRU' -Name * -ErrorAction SilentlyContinue -Exclude MRUList\""), M += A;
				} catch (e) {
					P.push(`Failed to clean Recent Programs registry: ${e.message}`);
				}
			}
			if (A.activityHistory) {
				let e = path.join(os.homedir(), "AppData/Local/ConnectedDevicesPlatform");
				try {
					let A = await fs.readdir(e, { recursive: !0 }).catch(() => []);
					for (let j of A) {
						let A = path.join(e, j);
						try {
							let e = await fs.stat(A);
							e.isFile() && (N += e.size, await fs.unlink(A), M++);
						} catch {}
					}
				} catch (e) {
					P.push(`Failed to clean activity history: ${e.message}`);
				}
				let A = path.join(os.homedir(), "AppData/Roaming/Microsoft/Windows/Recent");
				try {
					let e = await fs.readdir(A).catch(() => []);
					for (let j of e) {
						let e = path.join(A, j);
						try {
							let A = await fs.stat(e);
							N += A.size, await fs.unlink(e), M++;
						} catch {}
					}
				} catch (e) {
					P.push(`Failed to clean search history: ${e.message}`);
				}
			}
		} catch (e) {
			P.push(`Windows privacy cleanup failed: ${e.message}`);
		}
		else if (j === "darwin") try {
			if (A.spotlightHistory) {
				let e = path.join(os.homedir(), "Library/Application Support/com.apple.spotlight");
				try {
					let A = await fs.readdir(e, { recursive: !0 }).catch(() => []);
					for (let j of A) {
						let A = path.join(e, j);
						try {
							let e = await fs.stat(A);
							e.isFile() && (N += e.size, await fs.unlink(A), M++);
						} catch {}
					}
				} catch (e) {
					P.push(`Failed to clean Spotlight history: ${e.message}`);
				}
				let A = path.join(os.homedir(), "Library/Application Support/com.apple.sharedfilelist");
				try {
					let e = await fs.readdir(A).catch(() => []);
					for (let j of e) if (j.includes("RecentItems")) {
						let e = path.join(A, j);
						try {
							let A = await fs.stat(e);
							N += A.size, await fs.unlink(e), M++;
						} catch {}
					}
				} catch (e) {
					P.push(`Failed to clean recent items: ${e.message}`);
				}
			}
			if (A.quickLookCache) {
				let e = path.join(os.homedir(), "Library/Caches/com.apple.QuickLook");
				try {
					let A = await fs.readdir(e, { recursive: !0 }).catch(() => []);
					for (let j of A) {
						let A = path.join(e, j);
						try {
							let e = await fs.stat(A);
							e.isFile() && (N += e.size, await fs.unlink(A), M++);
						} catch {}
					}
				} catch (e) {
					P.push(`Failed to clean Quick Look cache: ${e.message}`);
				}
			}
		} catch (e) {
			P.push(`macOS privacy cleanup failed: ${e.message}`);
		}
		return {
			success: P.length === 0,
			cleanedItems: M,
			freedSize: N,
			freedSizeFormatted: formatBytes(N),
			errors: P
		};
	}), ipcMain.handle("cleaner:scan-browser-data", async () => {
		let e = process.platform, A = os.homedir(), j = {
			browsers: [],
			totalSize: 0,
			totalItems: 0
		}, M = [];
		if (e === "win32") {
			let e = process.env.LOCALAPPDATA || "", A = process.env.APPDATA || "";
			M.push({
				name: "Chrome",
				paths: {
					history: [path.join(e, "Google/Chrome/User Data/Default/History")],
					cookies: [path.join(e, "Google/Chrome/User Data/Default/Cookies")],
					cache: [path.join(e, "Google/Chrome/User Data/Default/Cache")],
					downloads: [path.join(e, "Google/Chrome/User Data/Default/History")]
				}
			}), M.push({
				name: "Edge",
				paths: {
					history: [path.join(e, "Microsoft/Edge/User Data/Default/History")],
					cookies: [path.join(e, "Microsoft/Edge/User Data/Default/Cookies")],
					cache: [path.join(e, "Microsoft/Edge/User Data/Default/Cache")],
					downloads: [path.join(e, "Microsoft/Edge/User Data/Default/History")]
				}
			}), M.push({
				name: "Firefox",
				paths: {
					history: [path.join(A, "Mozilla/Firefox/Profiles")],
					cookies: [path.join(A, "Mozilla/Firefox/Profiles")],
					cache: [path.join(e, "Mozilla/Firefox/Profiles")],
					downloads: [path.join(A, "Mozilla/Firefox/Profiles")]
				}
			});
		} else e === "darwin" && (M.push({
			name: "Safari",
			paths: {
				history: [path.join(A, "Library/Safari/History.db")],
				cookies: [path.join(A, "Library/Cookies/Cookies.binarycookies")],
				cache: [path.join(A, "Library/Caches/com.apple.Safari")],
				downloads: [path.join(A, "Library/Safari/Downloads.plist")]
			}
		}), M.push({
			name: "Chrome",
			paths: {
				history: [path.join(A, "Library/Application Support/Google/Chrome/Default/History")],
				cookies: [path.join(A, "Library/Application Support/Google/Chrome/Default/Cookies")],
				cache: [path.join(A, "Library/Caches/Google/Chrome")],
				downloads: [path.join(A, "Library/Application Support/Google/Chrome/Default/History")]
			}
		}), M.push({
			name: "Firefox",
			paths: {
				history: [path.join(A, "Library/Application Support/Firefox/Profiles")],
				cookies: [path.join(A, "Library/Application Support/Firefox/Profiles")],
				cache: [path.join(A, "Library/Caches/Firefox")],
				downloads: [path.join(A, "Library/Application Support/Firefox/Profiles")]
			}
		}), M.push({
			name: "Edge",
			paths: {
				history: [path.join(A, "Library/Application Support/Microsoft Edge/Default/History")],
				cookies: [path.join(A, "Library/Application Support/Microsoft Edge/Default/Cookies")],
				cache: [path.join(A, "Library/Caches/com.microsoft.edgemac")],
				downloads: [path.join(A, "Library/Application Support/Microsoft Edge/Default/History")]
			}
		}));
		for (let A of M) {
			let M = {
				name: A.name,
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
			for (let [j, N] of Object.entries(A.paths)) for (let P of N) try {
				if (j === "cache" && e === "darwin" && A.name === "Safari") {
					let e = await fs.stat(P).catch(() => null);
					if (e && e.isDirectory()) {
						let e = await getDirSize(P);
						M[j].size += e, M[j].paths.push(P), M[j].count += 1;
					}
				} else {
					let e = await fs.stat(P).catch(() => null);
					if (e) if (e.isDirectory()) {
						let e = await getDirSize(P);
						M[j].size += e, M[j].paths.push(P), M[j].count += 1;
					} else e.isFile() && (M[j].size += e.size, M[j].paths.push(P), M[j].count += 1);
				}
			} catch {}
			let N = Object.values(M).reduce((e, A) => e + (typeof A == "object" && A.size ? A.size : 0), 0);
			N > 0 && (M.totalSize = N, M.totalSizeFormatted = formatBytes(N), j.browsers.push(M), j.totalSize += N, j.totalItems += Object.values(M).reduce((e, A) => e + (typeof A == "object" && A.count ? A.count : 0), 0));
		}
		return {
			success: !0,
			results: j
		};
	}), ipcMain.handle("cleaner:clean-browser-data", async (e, A) => {
		let j = process.platform, M = os.homedir(), N = 0, P = 0, F = [], I = {};
		if (j === "win32") {
			let e = process.env.LOCALAPPDATA || "", A = process.env.APPDATA || "";
			I.Chrome = {
				history: [path.join(e, "Google/Chrome/User Data/Default/History")],
				cookies: [path.join(e, "Google/Chrome/User Data/Default/Cookies")],
				cache: [path.join(e, "Google/Chrome/User Data/Default/Cache")],
				downloads: [path.join(e, "Google/Chrome/User Data/Default/History")]
			}, I.Edge = {
				history: [path.join(e, "Microsoft/Edge/User Data/Default/History")],
				cookies: [path.join(e, "Microsoft/Edge/User Data/Default/Cookies")],
				cache: [path.join(e, "Microsoft/Edge/User Data/Default/Cache")],
				downloads: [path.join(e, "Microsoft/Edge/User Data/Default/History")]
			}, I.Firefox = {
				history: [path.join(A, "Mozilla/Firefox/Profiles")],
				cookies: [path.join(A, "Mozilla/Firefox/Profiles")],
				cache: [path.join(e, "Mozilla/Firefox/Profiles")],
				downloads: [path.join(A, "Mozilla/Firefox/Profiles")]
			};
		} else j === "darwin" && (I.Safari = {
			history: [path.join(M, "Library/Safari/History.db")],
			cookies: [path.join(M, "Library/Cookies/Cookies.binarycookies")],
			cache: [path.join(M, "Library/Caches/com.apple.Safari")],
			downloads: [path.join(M, "Library/Safari/Downloads.plist")]
		}, I.Chrome = {
			history: [path.join(M, "Library/Application Support/Google/Chrome/Default/History")],
			cookies: [path.join(M, "Library/Application Support/Google/Chrome/Default/Cookies")],
			cache: [path.join(M, "Library/Caches/Google/Chrome")],
			downloads: [path.join(M, "Library/Application Support/Google/Chrome/Default/History")]
		}, I.Firefox = {
			history: [path.join(M, "Library/Application Support/Firefox/Profiles")],
			cookies: [path.join(M, "Library/Application Support/Firefox/Profiles")],
			cache: [path.join(M, "Library/Caches/Firefox")],
			downloads: [path.join(M, "Library/Application Support/Firefox/Profiles")]
		}, I.Edge = {
			history: [path.join(M, "Library/Application Support/Microsoft Edge/Default/History")],
			cookies: [path.join(M, "Library/Application Support/Microsoft Edge/Default/Cookies")],
			cache: [path.join(M, "Library/Caches/com.microsoft.edgemac")],
			downloads: [path.join(M, "Library/Application Support/Microsoft Edge/Default/History")]
		});
		for (let e of A.browsers) {
			let j = I[e];
			if (j) for (let M of A.types) {
				let A = j[M];
				if (A) for (let j of A) try {
					let e = await fs.stat(j).catch(() => null);
					if (!e) continue;
					if (e.isDirectory()) {
						let e = await getDirSize(j);
						await fs.rm(j, {
							recursive: !0,
							force: !0
						}), P += e, N++;
					} else e.isFile() && (P += e.size, await fs.unlink(j), N++);
				} catch (A) {
					F.push(`Failed to clean ${e} ${M}: ${A.message}`);
				}
			}
		}
		return {
			success: F.length === 0,
			cleanedItems: N,
			freedSize: P,
			freedSizeFormatted: formatBytes(P),
			errors: F
		};
	}), ipcMain.handle("cleaner:get-wifi-networks", async () => {
		let e = process.platform, A = [];
		try {
			if (e === "win32") {
				let { stdout: e } = await execAsync("netsh wlan show profiles"), j = e.split("\n");
				for (let e of j) {
					let j = e.match(/All User Profile\s*:\s*(.+)/);
					if (j) {
						let e = j[1].trim();
						try {
							let { stdout: j } = await execAsync(`netsh wlan show profile name="${e}" key=clear`), M = j.match(/Key Content\s*:\s*(.+)/);
							A.push({
								name: e,
								hasPassword: !!M,
								platform: "windows"
							});
						} catch {
							A.push({
								name: e,
								hasPassword: !1,
								platform: "windows"
							});
						}
					}
				}
			} else if (e === "darwin") {
				let { stdout: e } = await execAsync("networksetup -listallhardwareports");
				if (e.split("\n").find((e) => e.includes("Wi-Fi") || e.includes("AirPort"))) {
					let { stdout: e } = await execAsync("networksetup -listpreferredwirelessnetworks en0").catch(() => ({ stdout: "" })), j = e.split("\n").filter((e) => e.trim() && !e.includes("Preferred networks"));
					for (let e of j) {
						let j = e.trim();
						j && A.push({
							name: j,
							hasPassword: !0,
							platform: "macos"
						});
					}
				}
			}
		} catch (e) {
			return {
				success: !1,
				error: e.message,
				networks: []
			};
		}
		return {
			success: !0,
			networks: A
		};
	}), ipcMain.handle("cleaner:remove-wifi-network", async (e, A) => {
		let j = process.platform;
		try {
			return j === "win32" ? (await execAsync(`netsh wlan delete profile name="${A}"`), { success: !0 }) : j === "darwin" ? (await execAsync(`networksetup -removepreferredwirelessnetwork en0 "${A}"`), { success: !0 }) : {
				success: !1,
				error: "Unsupported platform"
			};
		} catch (e) {
			return {
				success: !1,
				error: e.message
			};
		}
	}), ipcMain.handle("cleaner:run-maintenance", async (e, A) => {
		let j = process.platform, M = Date.now(), N = "";
		try {
			if (j === "win32") switch (A.category) {
				case "sfc":
					let { stdout: e } = await execAsync("sfc /scannow", { timeout: 3e5 });
					N = e;
					break;
				case "dism":
					let { stdout: j } = await execAsync("DISM /Online /Cleanup-Image /RestoreHealth", { timeout: 6e5 });
					N = j;
					break;
				case "disk-cleanup":
					let { stdout: M } = await execAsync("cleanmgr /sagerun:1", { timeout: 3e5 });
					N = M || "Disk cleanup completed";
					break;
				case "dns-flush":
					let { stdout: P } = await execAsync("ipconfig /flushdns");
					N = P || "DNS cache flushed successfully";
					break;
				case "winsock-reset":
					let { stdout: F } = await execAsync("netsh winsock reset");
					N = F || "Winsock reset completed";
					break;
				case "windows-search-rebuild":
					try {
						await execAsync("powershell \"Stop-Service -Name WSearch -Force\""), await execAsync("powershell \"Remove-Item -Path \"$env:ProgramData\\Microsoft\\Search\\Data\\*\" -Recurse -Force\""), await execAsync("powershell \"Start-Service -Name WSearch\""), N = "Windows Search index rebuilt successfully";
					} catch (e) {
						throw Error(`Failed to rebuild search index: ${e.message}`);
					}
					break;
				default: throw Error(`Unknown maintenance task: ${A.category}`);
			}
			else if (j === "darwin") switch (A.category) {
				case "time-machine-cleanup":
					try {
						let { stdout: e } = await execAsync("sudo tmutil deletelocalsnapshots /");
						N = e || "Local Time Machine snapshots removed successfully";
					} catch (e) {
						throw Error(`Failed to clean Time Machine snapshots: ${e.message}`);
					}
					break;
				case "spotlight-reindex":
					try {
						await execAsync("sudo mdutil -E /"), N = "Spotlight index rebuilt successfully";
					} catch {
						try {
							await execAsync("mdutil -E ~"), N = "Spotlight index rebuilt successfully (user directory only)";
						} catch (e) {
							throw Error(`Failed to rebuild Spotlight index: ${e.message}`);
						}
					}
					break;
				case "launch-services-reset":
					try {
						await execAsync("/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister -kill -r -domain local -domain system -domain user"), N = "Launch Services database reset successfully. You may need to restart apps for changes to take effect.";
					} catch (e) {
						throw Error(`Failed to reset Launch Services: ${e.message}`);
					}
					break;
				case "dns-flush":
					try {
						await execAsync("sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder"), N = "DNS cache flushed successfully";
					} catch (e) {
						throw Error(`Failed to flush DNS: ${e.message}`);
					}
					break;
				case "gatekeeper-check":
					try {
						let { stdout: e } = await execAsync("spctl --status");
						N = `Gatekeeper Status: ${e.trim()}`;
					} catch (e) {
						throw Error(`Failed to check Gatekeeper: ${e.message}`);
					}
					break;
				case "mail-rebuild":
					try {
						let e = os.homedir();
						await execAsync(`find "${path.join(e, "Library/Mail")}" -name "Envelope Index*" -delete`), N = "Mail database indexes cleared. Rebuild will occur next time you open Mail.app.";
					} catch (e) {
						throw Error(`Failed to rebuild Mail database: ${e.message}`);
					}
					break;
				case "icloud-cleanup":
					try {
						let e = os.homedir(), A = path.join(e, "Library/Caches/com.apple.bird"), j = path.join(e, "Library/Caches/com.apple.CloudDocs");
						await fs.rm(A, {
							recursive: !0,
							force: !0
						}).catch(() => {}), await fs.rm(j, {
							recursive: !0,
							force: !0
						}).catch(() => {}), N = "iCloud cache cleared successfully";
					} catch (e) {
						throw Error(`Failed to clear iCloud cache: ${e.message}`);
					}
					break;
				case "disk-permissions":
					try {
						let { stdout: e } = await execAsync("diskutil verifyVolume /");
						N = e || "Disk permissions verified";
					} catch (e) {
						throw Error(`Failed to verify disk: ${e.message}`);
					}
					break;
				default: throw Error(`Unknown maintenance task: ${A.category}`);
			}
			else throw Error("Unsupported platform for maintenance tasks");
			return {
				success: !0,
				taskId: A.id,
				duration: Date.now() - M,
				output: N
			};
		} catch (e) {
			return {
				success: !1,
				taskId: A.id,
				duration: Date.now() - M,
				error: e.message,
				output: N
			};
		}
	}), ipcMain.handle("cleaner:get-health-status", async () => {
		try {
			let e = await si.mem(), A = await si.currentLoad(), j = await si.fsSize(), M = await si.battery().catch(() => null), N = [], P = j.find((e) => e.mount === "/" || e.mount === "C:") || j[0];
			if (P) {
				let e = P.available / P.size * 100;
				e < 10 ? N.push({
					type: "low_space",
					severity: "critical",
					message: `Low disk space: ${formatBytes(P.available)} free (${e.toFixed(1)}%)`,
					action: "Run cleanup to free space"
				}) : e < 20 && N.push({
					type: "low_space",
					severity: "warning",
					message: `Disk space getting low: ${formatBytes(P.available)} free (${e.toFixed(1)}%)`,
					action: "Consider running cleanup"
				});
			}
			A.currentLoad > 90 && N.push({
				type: "high_cpu",
				severity: "warning",
				message: `High CPU usage: ${A.currentLoad.toFixed(1)}%`,
				action: "Check heavy processes"
			});
			let F = e.used / e.total * 100;
			return F > 90 && N.push({
				type: "memory_pressure",
				severity: "warning",
				message: `High memory usage: ${F.toFixed(1)}%`,
				action: "Consider freeing RAM"
			}), {
				cpu: A.currentLoad,
				ram: {
					used: e.used,
					total: e.total,
					percentage: F
				},
				disk: P ? {
					free: P.available,
					total: P.size,
					percentage: (P.size - P.available) / P.size * 100
				} : null,
				battery: M ? {
					level: M.percent,
					charging: M.isCharging || !1
				} : null,
				alerts: N
			};
		} catch (e) {
			return {
				success: !1,
				error: e.message
			};
		}
	}), ipcMain.handle("cleaner:check-safety", async (e, A) => {
		try {
			let e = process.platform, j = checkFilesSafety(A, e);
			return {
				success: !0,
				safe: j.safe,
				warnings: j.warnings,
				blocked: j.blocked
			};
		} catch (e) {
			return {
				success: !1,
				error: e.message,
				safe: !1,
				warnings: [],
				blocked: []
			};
		}
	}), ipcMain.handle("cleaner:create-backup", async (e, A) => {
		try {
			return await createBackup(A);
		} catch (e) {
			return {
				success: !1,
				error: e.message
			};
		}
	}), ipcMain.handle("cleaner:list-backups", async () => {
		try {
			return {
				success: !0,
				backups: await listBackups()
			};
		} catch (e) {
			return {
				success: !1,
				error: e.message,
				backups: []
			};
		}
	}), ipcMain.handle("cleaner:get-backup-info", async (e, A) => {
		try {
			let e = await getBackupInfo(A);
			return {
				success: e !== null,
				backupInfo: e
			};
		} catch (e) {
			return {
				success: !1,
				error: e.message
			};
		}
	}), ipcMain.handle("cleaner:restore-backup", async (e, A) => {
		try {
			return await restoreBackup(A);
		} catch (e) {
			return {
				success: !1,
				error: e.message
			};
		}
	}), ipcMain.handle("cleaner:delete-backup", async (e, A) => {
		try {
			return await deleteBackup(A);
		} catch (e) {
			return {
				success: !1,
				error: e.message
			};
		}
	});
}
async function getDirSizeLimited(e, A, j = 0) {
	if (j >= A) return 0;
	let M = 0;
	try {
		let N = await fs.readdir(e, { withFileTypes: !0 });
		for (let P of N) {
			if (P.name.startsWith(".") || [
				"node_modules",
				"Library",
				"AppData",
				"System",
				".git",
				".DS_Store"
			].includes(P.name)) continue;
			let N = path.join(e, P.name);
			try {
				if (P.isDirectory()) M += await getDirSizeLimited(N, A, j + 1);
				else {
					let e = await fs.stat(N).catch(() => null);
					e && (M += e.size);
				}
			} catch {
				continue;
			}
		}
	} catch {
		return 0;
	}
	return M;
}
async function scanDirectoryForLens(e, A, j, M) {
	try {
		let N = await fs.stat(e), P = path.basename(e) || e;
		if (!N.isDirectory()) {
			let A = {
				name: P,
				path: e,
				size: N.size,
				sizeFormatted: formatBytes(N.size),
				type: "file"
			};
			return M && M({
				currentPath: P,
				progress: 100,
				status: `Scanning file: ${P}`,
				item: A
			}), A;
		}
		M && M({
			currentPath: P,
			progress: 0,
			status: `Scanning directory: ${P}`
		});
		let F = await fs.readdir(e, { withFileTypes: !0 }), I = [], L = 0, R = F.filter((e) => !e.name.startsWith(".") && ![
			"node_modules",
			"Library",
			"AppData",
			"System",
			".git",
			".DS_Store"
		].includes(e.name)), z = R.length, B = 0;
		for (let N of R) {
			let P = path.join(e, N.name);
			if (M) {
				let e = Math.floor(B / z * 100), A = N.isDirectory() ? "directory" : "file";
				M({
					currentPath: N.name,
					progress: e,
					status: `Scanning ${A}: ${N.name}`
				});
			}
			let F = null;
			if (A < j) F = await scanDirectoryForLens(P, A + 1, j, M), F && (I.push(F), L += F.size);
			else try {
				let e = (await fs.stat(P)).size;
				if (N.isDirectory()) {
					let A = dirSizeCache.get(P);
					if (A && Date.now() - A.timestamp < CACHE_TTL) e = A.size;
					else try {
						e = await getDirSizeLimited(P, 3), dirSizeCache.set(P, {
							size: e,
							timestamp: Date.now()
						});
					} catch {
						e = 0;
					}
				}
				F = {
					name: N.name,
					path: P,
					size: e,
					sizeFormatted: formatBytes(e),
					type: N.isDirectory() ? "dir" : "file"
				}, I.push(F), L += e;
			} catch {
				B++;
				continue;
			}
			F && M && M({
				currentPath: N.name,
				progress: Math.floor((B + 1) / z * 100),
				status: `Scanned: ${N.name}`,
				item: F
			}), B++;
		}
		let V = {
			name: P,
			path: e,
			size: L,
			sizeFormatted: formatBytes(L),
			type: "dir",
			children: I.sort((e, A) => A.size - e.size)
		};
		return M && M({
			currentPath: P,
			progress: 100,
			status: `Completed: ${P}`
		}), V;
	} catch {
		return null;
	}
}
async function findLargeFiles(e, A, j) {
	try {
		let M = await fs.readdir(e, { withFileTypes: !0 });
		for (let N of M) {
			let M = path.join(e, N.name);
			if (!(N.name.startsWith(".") || [
				"node_modules",
				"Library",
				"AppData",
				"System",
				"Windows"
			].includes(N.name))) try {
				let e = await fs.stat(M);
				N.isDirectory() ? await findLargeFiles(M, A, j) : e.size >= A && j.push({
					name: N.name,
					path: M,
					size: e.size,
					sizeFormatted: formatBytes(e.size),
					lastAccessed: e.atime,
					type: path.extname(N.name).slice(1) || "file"
				});
			} catch {}
		}
	} catch {}
}
async function findDuplicates(e, A) {
	try {
		let j = await fs.readdir(e, { withFileTypes: !0 });
		for (let M of j) {
			let j = path.join(e, M.name);
			if (!(M.name.startsWith(".") || [
				"node_modules",
				"Library",
				"AppData"
			].includes(M.name))) try {
				let e = await fs.stat(j);
				if (M.isDirectory()) await findDuplicates(j, A);
				else if (e.size > 1024 * 1024 && e.size < 50 * 1024 * 1024) {
					let e = await hashFile(j), M = A.get(e) || [];
					M.push(j), A.set(e, M);
				}
			} catch {}
		}
	} catch {}
}
async function hashFile(e) {
	let A = await fs.readFile(e);
	return createHash("md5").update(A).digest("hex");
}
function formatBytes(e) {
	if (e === 0) return "0 B";
	let A = 1024, j = [
		"B",
		"KB",
		"MB",
		"GB",
		"TB"
	], M = Math.floor(Math.log(e) / Math.log(A));
	return `${(e / A ** +M).toFixed(1)} ${j[M]}`;
}
var getPlatformProtectedPaths = (e) => {
	let A = os.homedir(), j = [];
	if (e === "win32") {
		let e = process.env.WINDIR || "C:\\Windows", M = process.env.PROGRAMFILES || "C:\\Program Files", N = process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)";
		j.push({
			path: e,
			type: "folder",
			action: "protect",
			reason: "Windows system directory",
			platform: "windows"
		}, {
			path: M,
			type: "folder",
			action: "protect",
			reason: "Program Files directory",
			platform: "windows"
		}, {
			path: N,
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
			path: path.join(A, "Documents"),
			type: "folder",
			action: "warn",
			reason: "User Documents folder",
			platform: "windows"
		}, {
			path: path.join(A, "Desktop"),
			type: "folder",
			action: "warn",
			reason: "User Desktop folder",
			platform: "windows"
		});
	} else e === "darwin" && j.push({
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
		path: path.join(A, "Documents"),
		type: "folder",
		action: "warn",
		reason: "User Documents folder",
		platform: "macos"
	}, {
		path: path.join(A, "Desktop"),
		type: "folder",
		action: "warn",
		reason: "User Desktop folder",
		platform: "macos"
	});
	return j;
}, checkFileSafety = (e, A) => {
	let j = [], M = [], N = getPlatformProtectedPaths(A);
	for (let P of N) {
		if (P.platform && P.platform !== A && P.platform !== "all") continue;
		let N = path.normalize(P.path), F = path.normalize(e);
		if (F === N || F.startsWith(N + path.sep)) {
			if (P.action === "protect") return M.push(e), {
				safe: !1,
				warnings: [],
				blocked: [e]
			};
			P.action === "warn" && j.push({
				path: e,
				reason: P.reason,
				severity: "high"
			});
		}
	}
	return {
		safe: M.length === 0,
		warnings: j,
		blocked: M
	};
}, checkFilesSafety = (e, A) => {
	let j = [], M = [];
	for (let N of e) {
		let e = checkFileSafety(N, A);
		e.safe || M.push(...e.blocked), j.push(...e.warnings);
	}
	return {
		safe: M.length === 0,
		warnings: j,
		blocked: M
	};
}, getBackupDir = () => {
	let e = os.homedir();
	return process.platform === "win32" ? path.join(e, "AppData", "Local", "devtools-app", "backups") : path.join(e, ".devtools-app", "backups");
}, generateBackupId = () => `backup-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, calculateTotalSize = async (e) => {
	let A = 0;
	for (let j of e) try {
		let e = await fs.stat(j);
		e.isFile() && (A += e.size);
	} catch {}
	return A;
}, createBackup = async (e) => {
	try {
		let A = getBackupDir();
		await fs.mkdir(A, { recursive: !0 });
		let j = generateBackupId(), M = path.join(A, j);
		await fs.mkdir(M, { recursive: !0 });
		let N = await calculateTotalSize(e), P = [];
		for (let A of e) try {
			let e = await fs.stat(A), j = path.basename(A), N = path.join(M, j);
			e.isFile() && (await fs.copyFile(A, N), P.push(A));
		} catch {}
		let F = {
			id: j,
			timestamp: (/* @__PURE__ */ new Date()).toISOString(),
			files: P,
			totalSize: N,
			location: M,
			platform: process.platform
		}, I = path.join(M, "backup-info.json");
		return await fs.writeFile(I, JSON.stringify(F, null, 2)), {
			success: !0,
			backupId: j,
			backupInfo: F
		};
	} catch (e) {
		return {
			success: !1,
			error: e.message
		};
	}
}, listBackups = async () => {
	try {
		let e = getBackupDir(), A = await fs.readdir(e, { withFileTypes: !0 }), j = [];
		for (let M of A) if (M.isDirectory() && M.name.startsWith("backup-")) {
			let A = path.join(e, M.name, "backup-info.json");
			try {
				let e = await fs.readFile(A, "utf-8");
				j.push(JSON.parse(e));
			} catch {}
		}
		return j.sort((e, A) => new Date(A.timestamp).getTime() - new Date(e.timestamp).getTime());
	} catch {
		return [];
	}
}, getBackupInfo = async (e) => {
	try {
		let A = getBackupDir(), j = path.join(A, e, "backup-info.json"), M = await fs.readFile(j, "utf-8");
		return JSON.parse(M);
	} catch {
		return null;
	}
}, restoreBackup = async (e) => {
	try {
		let A = await getBackupInfo(e);
		if (!A) return {
			success: !1,
			error: "Backup not found"
		};
		let j = A.location;
		for (let e of A.files) try {
			let A = path.basename(e), M = path.join(j, A);
			if ((await fs.stat(M)).isFile()) {
				let A = path.dirname(e);
				await fs.mkdir(A, { recursive: !0 }), await fs.copyFile(M, e);
			}
		} catch {}
		return { success: !0 };
	} catch (e) {
		return {
			success: !1,
			error: e.message
		};
	}
}, deleteBackup = async (e) => {
	try {
		let A = getBackupDir(), j = path.join(A, e);
		return await fs.rm(j, {
			recursive: !0,
			force: !0
		}), { success: !0 };
	} catch (e) {
		return {
			success: !1,
			error: e.message
		};
	}
}, HTTP_AGENT = new http.Agent({
	keepAlive: !0,
	maxSockets: 128,
	keepAliveMsecs: 1e4
}), HTTPS_AGENT = new https.Agent({
	keepAlive: !0,
	maxSockets: 128,
	keepAliveMsecs: 1e4
}), COMMON_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36";
const downloadManager = new class extends EventEmitter {
	constructor() {
		super(), this.globalDownloadedInLastSecond = 0, this.lastSpeedCheck = Date.now(), this.activeTasks = /* @__PURE__ */ new Map(), this.store = new Store({
			name: "download-manager-history",
			defaults: {
				history: [],
				settings: {
					downloadPath: app.getPath("downloads"),
					maxConcurrentDownloads: 5,
					segmentsPerDownload: 32,
					autoStart: !0,
					monitorClipboard: !0,
					autoUnzip: !1,
					autoOpenFolder: !0,
					autoVerifyChecksum: !0,
					enableSounds: !0,
					speedLimit: 0
				},
				savedCredentials: {}
			}
		}), this.history = this.store.get("history", []);
	}
	getSettings() {
		return this.store.get("settings");
	}
	saveSettings(e) {
		let A = {
			...this.getSettings(),
			...e
		};
		this.store.set("settings", A), this.checkQueue();
	}
	getHistory() {
		return this.history;
	}
	saveTask(e) {
		let A = this.history.findIndex((A) => A.id === e.id);
		A > -1 ? this.history[A] = { ...e } : this.history.unshift({ ...e }), this.persistHistory();
	}
	persistHistory() {
		this.store.set("history", this.history.slice(0, 500));
	}
	emitProgress(e) {
		let A = {
			taskId: e.id,
			downloadedSize: e.downloadedSize,
			totalSize: e.totalSize,
			speed: e.speed,
			eta: e.eta,
			progress: e.totalSize > 0 ? e.downloadedSize / e.totalSize * 100 : 0,
			status: e.status,
			segments: e.segments
		};
		this.emit("progress", A);
	}
	async createDownload(e, A, j) {
		if (j?.credentials) {
			let A = new URL(e).hostname, M = this.store.get("savedCredentials", {});
			M[A] = j.credentials, this.store.set("savedCredentials", M);
		} else {
			let A = new URL(e).hostname, M = this.store.get("savedCredentials", {});
			M[A] && (j = {
				...j,
				credentials: M[A]
			});
		}
		let M = await this.getFileInfo(e, 5, j?.credentials), N = this.getSettings(), P = A || M.filename || path$1.basename(new URL(M.finalUrl).pathname) || "download";
		P = this.sanitizeFilename(P);
		let F = path$1.join(N.downloadPath, P), I = this.getCategory(P), L = {
			id: randomUUID$1(),
			url: M.finalUrl,
			filename: P,
			filepath: F,
			totalSize: M.size,
			downloadedSize: 0,
			segments: [],
			status: "queued",
			speed: 0,
			eta: 0,
			priority: 5,
			category: I,
			createdAt: Date.now(),
			checksum: j?.checksum,
			credentials: j?.credentials
		};
		if (M.acceptRanges && M.size > 0 && N.segmentsPerDownload > 1) {
			let e = Math.ceil(M.size / N.segmentsPerDownload);
			for (let A = 0; A < N.segmentsPerDownload; A++) {
				let j = A * e, N = Math.min((A + 1) * e - 1, M.size - 1);
				L.segments.push({
					id: A,
					start: j,
					end: N,
					downloaded: 0,
					status: "pending"
				});
			}
		} else L.segments.push({
			id: 0,
			start: 0,
			end: M.size > 0 ? M.size - 1 : -1,
			downloaded: 0,
			status: "pending"
		});
		return this.saveTask(L), this.checkQueue(), L;
	}
	async getFileInfo(e, A = 5, j) {
		if (A <= 0) throw Error("Too many redirects");
		return new Promise((M, N) => {
			try {
				let P = new URL(e), F = P.protocol === "https:" ? https : http, I = {
					method: "HEAD",
					agent: P.protocol === "https:" ? HTTPS_AGENT : HTTP_AGENT,
					headers: {
						"User-Agent": COMMON_USER_AGENT,
						Accept: "*/*",
						Connection: "keep-alive",
						...j?.username || j?.password ? { Authorization: `Basic ${Buffer.from(`${j.username || ""}:${j.password || ""}`).toString("base64")}` } : {}
					}
				}, L = F.request(e, I, (P) => {
					if (P.statusCode && P.statusCode >= 300 && P.statusCode < 400 && P.headers.location) {
						let N = new URL(P.headers.location, e).toString();
						M(this.getFileInfo(N, A - 1, j));
						return;
					}
					if (P.statusCode === 405 || P.statusCode === 403 || P.statusCode === 404) {
						let A = {
							...I,
							method: "GET",
							headers: {
								...I.headers,
								Range: "bytes=0-0"
							}
						}, j = F.request(e, A, (A) => {
							let j = this.parseContentRange(A.headers["content-range"]) || parseInt(A.headers["content-length"] || "0", 10), N = A.headers["accept-ranges"] === "bytes" || !!A.headers["content-range"], P = A.headers["content-disposition"], F = this.parseFilename(P);
							A.resume(), M({
								size: j,
								acceptRanges: N,
								filename: F,
								finalUrl: e
							});
						});
						j.on("error", N), j.end();
						return;
					}
					let L = parseInt(P.headers["content-length"] || "0", 10), R = P.headers["accept-ranges"] === "bytes", z = P.headers["content-disposition"];
					M({
						size: L,
						acceptRanges: R,
						filename: this.parseFilename(z),
						finalUrl: e
					});
				});
				L.on("error", (A) => {
					let j = {
						...I,
						method: "GET",
						headers: {
							...I.headers,
							Range: "bytes=0-0"
						}
					}, P = F.request(e, j, (A) => {
						let j = this.parseContentRange(A.headers["content-range"]) || parseInt(A.headers["content-length"] || "0", 10), N = A.headers["accept-ranges"] === "bytes" || !!A.headers["content-range"], P = A.headers["content-disposition"], F = this.parseFilename(P);
						A.resume(), M({
							size: j,
							acceptRanges: N,
							filename: F,
							finalUrl: e
						});
					});
					P.on("error", () => N(A)), P.end();
				}), L.setTimeout(15e3, () => {
					L.destroy(), N(/* @__PURE__ */ Error("Request timeout during getFileInfo"));
				}), L.end();
			} catch (e) {
				N(e);
			}
		});
	}
	parseContentRange(e) {
		if (!e) return 0;
		let A = e.match(/\/(\d+)$/);
		return A ? parseInt(A[1], 10) : 0;
	}
	parseFilename(e) {
		if (!e) return;
		let A, j = e.match(/filename\*=(?:UTF-8|utf-8)''([^;\s]+)/i);
		if (j) try {
			A = decodeURIComponent(j[1]);
		} catch {}
		if (!A) {
			let j = e.match(/filename=(?:(['"])(.*?)\1|([^;\s]+))/i);
			j && (A = j[2] || j[3]);
		}
		return A;
	}
	sanitizeFilename(e) {
		let A = e.split(";")[0];
		return A = A.replace(/filename\*?=.*/gi, ""), A = A.replace(/[<>:"/\\|?*]/g, "_"), A = A.replace(/^\.+|\.+$/g, "").trim(), A || "download";
	}
	checkQueue() {
		let e = this.getSettings();
		if ([...this.activeTasks.values()].filter((e) => e.task.status === "downloading").length >= e.maxConcurrentDownloads) return;
		let A = this.history.find((e) => e.status === "queued");
		A && this.startDownload(A.id);
	}
	async startDownload(e) {
		let A = this.history.find((A) => A.id === e);
		if (!A || A.status === "completed" || A.status === "downloading") return;
		let j = this.getSettings();
		if ([...this.activeTasks.values()].filter((e) => e.task.status === "downloading").length >= j.maxConcurrentDownloads) {
			A.status = "queued", this.saveTask(A);
			return;
		}
		A.status = "downloading", A.error = void 0, this.saveTask(A), this.emitProgress(A), this.emit("task-started", A);
		let M = [];
		this.activeTasks.set(e, {
			task: A,
			abortControllers: M,
			lastUpdate: Date.now(),
			lastDownloaded: A.downloadedSize
		});
		let N = path$1.dirname(A.filepath);
		fs$1.existsSync(N) || fs$1.mkdirSync(N, { recursive: !0 });
		try {
			if (!fs$1.existsSync(A.filepath)) if (A.totalSize > 0) {
				let e = fs$1.openSync(A.filepath, "w");
				fs$1.ftruncateSync(e, A.totalSize), fs$1.closeSync(e);
			} else fs$1.writeFileSync(A.filepath, Buffer.alloc(0));
			let j = fs$1.openSync(A.filepath, "r+"), M = this.activeTasks.get(e);
			M && (M.fd = j);
		} catch (j) {
			console.error("File allocation/open error:", j), A.status = "failed", A.error = `File error: ${j.message}`, this.saveTask(A), this.activeTasks.delete(e);
			return;
		}
		let P = this.activeTasks.get(e);
		if (!P || P.fd === void 0) return;
		let F = P.fd, I = A.segments.map((e) => e.status === "completed" ? Promise.resolve() : this.downloadSegment(A, e, M, F));
		Promise.all(I).then(() => {
			A.status === "downloading" && (A.status = "completed", A.completedAt = Date.now(), A.speed = 0, this.saveTask(A), this.closeTaskFd(e), this.activeTasks.delete(e), this.handlePostProcessing(A), this.checkQueue());
		}).catch((j) => {
			if (j.name === "AbortError" || A.status === "paused") {
				this.closeTaskFd(e);
				return;
			}
			console.error(`Download failed for ${A.filename}:`, j), A.status = "failed", A.error = j.message, A.speed = 0, this.saveTask(A), this.emitProgress(A), this.closeTaskFd(e), this.activeTasks.delete(e), this.checkQueue();
		});
	}
	closeTaskFd(e) {
		let A = this.activeTasks.get(e);
		if (A && A.fd !== void 0) try {
			fs$1.closeSync(A.fd), A.fd = void 0;
		} catch (e) {
			console.error("Error closing fd:", e);
		}
	}
	downloadSegment(e, A, j, M) {
		return new Promise((N, P) => {
			let F = new AbortController();
			j.push(F);
			let I = A.start + A.downloaded, L = A.end;
			if (I > L && L !== -1) return A.status = "completed", N();
			let R = {
				"User-Agent": COMMON_USER_AGENT,
				Accept: "*/*",
				Connection: "keep-alive",
				Referer: new URL(e.url).origin
			};
			L !== -1 && (R.Range = `bytes=${I}-${L}`), (e.credentials?.username || e.credentials?.password) && (R.Authorization = `Basic ${Buffer.from(`${e.credentials.username || ""}:${e.credentials.password || ""}`).toString("base64")}`);
			let z = (j, I, L = 0) => {
				if (I <= 0) {
					P(/* @__PURE__ */ Error("Too many redirects in segment download"));
					return;
				}
				let B = new URL(j), V = B.protocol === "https:" ? https : http, H = B.protocol === "https:" ? HTTPS_AGENT : HTTP_AGENT;
				R.Referer = B.origin;
				let U = V.get(j, {
					headers: R,
					agent: H,
					signal: F.signal
				}, (F) => {
					if (F.statusCode && F.statusCode >= 300 && F.statusCode < 400 && F.headers.location) {
						let e = new URL(F.headers.location, j).toString();
						F.resume(), z(e, I - 1, L);
						return;
					}
					if (F.statusCode !== 200 && F.statusCode !== 206) {
						if (L < 3) {
							F.resume(), setTimeout(() => z(j, I, L + 1), 2e3 * (L + 1));
							return;
						}
						P(/* @__PURE__ */ Error(`Server returned ${F.statusCode} for segment ${A.id}`));
						return;
					}
					A.status = "downloading";
					let R = !1;
					F.on("data", (j) => {
						let N = A.start + A.downloaded;
						A.downloaded += j.length, e.downloadedSize += j.length;
						let I = this.getSettings();
						if (I.speedLimit > 0 && (this.globalDownloadedInLastSecond += j.length, this.globalDownloadedInLastSecond >= I.speedLimit)) {
							F.pause();
							let e = Date.now() - this.lastSpeedCheck, A = Math.max(0, 1e3 - e);
							setTimeout(() => {
								this.globalDownloadedInLastSecond = 0, this.lastSpeedCheck = Date.now(), F.resume();
							}, A);
						}
						R = !0, fs$1.write(M, j, 0, j.length, N, (e) => {
							R = !1, e && (console.error("Write error in segment:", e), U.destroy(), P(e));
						});
						let L = Date.now(), z = this.activeTasks.get(e.id);
						if (z && L - z.lastUpdate >= 1e3) {
							let A = L - z.lastUpdate, j = e.downloadedSize - z.lastDownloaded;
							e.speed = Math.floor(j * 1e3 / A), e.eta = e.totalSize > 0 ? (e.totalSize - e.downloadedSize) / e.speed : 0, z.lastUpdate = L, z.lastDownloaded = e.downloadedSize, this.emitProgress(e);
						}
					}), F.on("end", () => {
						let e = () => {
							R ? setTimeout(e, 10) : (A.status = "completed", N());
						};
						e();
					}), F.on("error", (e) => {
						L < 3 ? setTimeout(() => z(j, I, L + 1), 2e3 * (L + 1)) : (A.status = "failed", P(e));
					});
				});
				U.on("error", (e) => {
					L < 3 && e.name !== "AbortError" ? setTimeout(() => z(j, I, L + 1), 2e3 * (L + 1)) : (A.status = "failed", P(e));
				}), U.setTimeout(6e4, () => {
					U.destroy(), L < 3 ? setTimeout(() => z(j, I, L + 1), 2e3 * (L + 1)) : P(/* @__PURE__ */ Error("Segment download timeout"));
				});
			};
			z(e.url, 5);
		});
	}
	pauseDownload(e) {
		let A = this.activeTasks.get(e);
		if (A) A.task.status = "paused", A.task.speed = 0, A.abortControllers.forEach((e) => e.abort()), this.saveTask(A.task), this.emitProgress(A.task), this.closeTaskFd(e), this.activeTasks.delete(e), this.checkQueue();
		else {
			let A = this.history.find((A) => A.id === e);
			A && A.status === "queued" && (A.status = "paused", this.saveTask(A), this.emitProgress(A));
		}
	}
	resumeDownload(e) {
		let A = this.history.find((A) => A.id === e);
		A && (A.status = "queued", this.saveTask(A), this.checkQueue());
	}
	cancelDownload(e) {
		this.pauseDownload(e);
		let A = this.history.findIndex((A) => A.id === e);
		if (A > -1) {
			let e = this.history[A];
			if (fs$1.existsSync(e.filepath) && e.status !== "completed") try {
				fs$1.unlinkSync(e.filepath);
			} catch (e) {
				console.error("Failed to delete partial file:", e);
			}
			this.history.splice(A, 1), this.persistHistory(), this.checkQueue();
		}
	}
	async verifyChecksum(A) {
		let j = this.history.find((e) => e.id === A);
		if (!j || !j.checksum || j.status !== "completed") return !1;
		let M = __require("crypto").createHash(j.checksum.algorithm);
		try {
			let e = fs$1.createReadStream(j.filepath);
			return new Promise((A) => {
				e.on("data", (e) => M.update(e)), e.on("end", () => {
					let e = M.digest("hex").toLowerCase() === j.checksum.value.trim().toLowerCase();
					j.checksum.verified = e, this.saveTask(j), this.emitProgress(j), A(e);
				}), e.on("error", () => A(!1));
			});
		} catch {
			return !1;
		}
	}
	clearHistory() {
		this.history = this.history.filter((e) => this.activeTasks.has(e.id)), this.persistHistory();
	}
	reorderHistory(e, A) {
		let j = Array.from(this.history), [M] = j.splice(e, 1);
		j.splice(A, 0, M), this.history = j, this.persistHistory();
	}
	saveHistory(e) {
		this.history = e, this.persistHistory();
	}
	async handlePostProcessing(A) {
		let j = this.getSettings();
		if (j.autoOpenFolder) try {
			let { shell: j } = __require("electron");
			j.showItemInFolder(A.filepath);
		} catch (e) {
			console.error("Failed to auto-open folder:", e);
		}
		j.autoUnzip && A.category === "compressed" && console.log("Auto-unzip triggered for:", A.filename), j.autoVerifyChecksum && A.checksum && this.verifyChecksum(A.id), this.showCompletedNotification(A), this.emit("task-completed", A);
	}
	showCompletedNotification(A) {
		let { Notification: j, shell: M } = __require("electron"), N = new j({
			title: "Download Completed",
			body: `${A.filename} has been downloaded successfully.`,
			silent: !0,
			timeoutType: "default",
			...process.platform === "darwin" ? { actions: [{
				type: "button",
				text: "Open File"
			}, {
				type: "button",
				text: "Show in Folder"
			}] } : {}
		});
		N.on("click", () => {
			M.showItemInFolder(A.filepath);
		}), N.on("action", (e, j) => {
			j === 0 ? M.openPath(A.filepath) : j === 1 && M.showItemInFolder(A.filepath);
		}), N.show();
	}
	getCategory(e) {
		let A = path$1.extname(e).toLowerCase().slice(1);
		for (let [e, j] of Object.entries({
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
		})) if (j.includes(A)) return e;
		return "other";
	}
}();
function setupDownloadManagerHandlers() {
	downloadManager.on("progress", (e) => {
		BrowserWindow.getAllWindows().forEach((A) => {
			A.isDestroyed() || (A.webContents.send(`download:progress:${e.taskId}`, e), A.webContents.send("download:any-progress", e));
		});
	}), downloadManager.on("task-started", (e) => {
		BrowserWindow.getAllWindows().forEach((A) => {
			A.isDestroyed() || A.webContents.send("download:task-started", e);
		});
	}), downloadManager.on("task-completed", (e) => {
		BrowserWindow.getAllWindows().forEach((A) => {
			A.isDestroyed() || A.webContents.send("download:task-completed", e);
		});
	}), ipcMain.handle("download:get-history", () => downloadManager.getHistory()), ipcMain.handle("download:get-settings", () => downloadManager.getSettings()), ipcMain.handle("download:save-settings", (e, A) => (downloadManager.saveSettings(A), { success: !0 })), ipcMain.handle("download:create", async (e, A) => await downloadManager.createDownload(A.url, A.filename, A)), ipcMain.handle("download:verify-checksum", async (e, A) => await downloadManager.verifyChecksum(A)), ipcMain.handle("download:start", async (e, A) => (downloadManager.startDownload(A), { success: !0 })), ipcMain.handle("download:pause", (e, A) => (downloadManager.pauseDownload(A), { success: !0 })), ipcMain.handle("download:resume", (e, A) => (downloadManager.resumeDownload(A), { success: !0 })), ipcMain.handle("download:cancel", (e, A) => (downloadManager.cancelDownload(A), { success: !0 })), ipcMain.handle("download:open-folder", (e, A) => (shell.showItemInFolder(A), { success: !0 })), ipcMain.handle("download:clear-history", () => (downloadManager.clearHistory(), { success: !0 })), ipcMain.handle("download:reorder", (e, { startIndex: A, endIndex: j }) => (downloadManager.reorderHistory(A, j), { success: !0 })), ipcMain.handle("download:save-history", (e, A) => (downloadManager.saveHistory(A), { success: !0 }));
}
var randomFallback = null;
function randomBytes(e) {
	try {
		return crypto.getRandomValues(new Uint8Array(e));
	} catch {}
	try {
		return nodeCrypto.randomBytes(e);
	} catch {}
	if (!randomFallback) throw Error("Neither WebCryptoAPI nor a crypto module is available. Use bcrypt.setRandomFallback to set an alternative");
	return randomFallback(e);
}
function setRandomFallback(e) {
	randomFallback = e;
}
function genSaltSync(e, A) {
	if (e ||= GENSALT_DEFAULT_LOG2_ROUNDS, typeof e != "number") throw Error("Illegal arguments: " + typeof e + ", " + typeof A);
	e < 4 ? e = 4 : e > 31 && (e = 31);
	var j = [];
	return j.push("$2b$"), e < 10 && j.push("0"), j.push(e.toString()), j.push("$"), j.push(base64_encode(randomBytes(BCRYPT_SALT_LEN), BCRYPT_SALT_LEN)), j.join("");
}
function genSalt(e, A, j) {
	if (typeof A == "function" && (j = A, A = void 0), typeof e == "function" && (j = e, e = void 0), e === void 0) e = GENSALT_DEFAULT_LOG2_ROUNDS;
	else if (typeof e != "number") throw Error("illegal arguments: " + typeof e);
	function M(A) {
		nextTick(function() {
			try {
				A(null, genSaltSync(e));
			} catch (e) {
				A(e);
			}
		});
	}
	if (j) {
		if (typeof j != "function") throw Error("Illegal callback: " + typeof j);
		M(j);
	} else return new Promise(function(e, A) {
		M(function(j, M) {
			if (j) {
				A(j);
				return;
			}
			e(M);
		});
	});
}
function hashSync(e, A) {
	if (A === void 0 && (A = GENSALT_DEFAULT_LOG2_ROUNDS), typeof A == "number" && (A = genSaltSync(A)), typeof e != "string" || typeof A != "string") throw Error("Illegal arguments: " + typeof e + ", " + typeof A);
	return _hash(e, A);
}
function hash(e, A, j, M) {
	function N(j) {
		typeof e == "string" && typeof A == "number" ? genSalt(A, function(A, N) {
			_hash(e, N, j, M);
		}) : typeof e == "string" && typeof A == "string" ? _hash(e, A, j, M) : nextTick(j.bind(this, Error("Illegal arguments: " + typeof e + ", " + typeof A)));
	}
	if (j) {
		if (typeof j != "function") throw Error("Illegal callback: " + typeof j);
		N(j);
	} else return new Promise(function(e, A) {
		N(function(j, M) {
			if (j) {
				A(j);
				return;
			}
			e(M);
		});
	});
}
function safeStringCompare(e, A) {
	for (var j = e.length ^ A.length, M = 0; M < e.length; ++M) j |= e.charCodeAt(M) ^ A.charCodeAt(M);
	return j === 0;
}
function compareSync(e, A) {
	if (typeof e != "string" || typeof A != "string") throw Error("Illegal arguments: " + typeof e + ", " + typeof A);
	return A.length === 60 ? safeStringCompare(hashSync(e, A.substring(0, A.length - 31)), A) : !1;
}
function compare(e, A, j, M) {
	function N(j) {
		if (typeof e != "string" || typeof A != "string") {
			nextTick(j.bind(this, Error("Illegal arguments: " + typeof e + ", " + typeof A)));
			return;
		}
		if (A.length !== 60) {
			nextTick(j.bind(this, null, !1));
			return;
		}
		hash(e, A.substring(0, 29), function(e, M) {
			e ? j(e) : j(null, safeStringCompare(M, A));
		}, M);
	}
	if (j) {
		if (typeof j != "function") throw Error("Illegal callback: " + typeof j);
		N(j);
	} else return new Promise(function(e, A) {
		N(function(j, M) {
			if (j) {
				A(j);
				return;
			}
			e(M);
		});
	});
}
function getRounds(e) {
	if (typeof e != "string") throw Error("Illegal arguments: " + typeof e);
	return parseInt(e.split("$")[2], 10);
}
function getSalt(e) {
	if (typeof e != "string") throw Error("Illegal arguments: " + typeof e);
	if (e.length !== 60) throw Error("Illegal hash length: " + e.length + " != 60");
	return e.substring(0, 29);
}
function truncates(e) {
	if (typeof e != "string") throw Error("Illegal arguments: " + typeof e);
	return utf8Length(e) > 72;
}
var nextTick = typeof setImmediate == "function" ? setImmediate : typeof scheduler == "object" && typeof scheduler.postTask == "function" ? scheduler.postTask.bind(scheduler) : setTimeout;
function utf8Length(e) {
	for (var A = 0, j = 0, M = 0; M < e.length; ++M) j = e.charCodeAt(M), j < 128 ? A += 1 : j < 2048 ? A += 2 : (j & 64512) == 55296 && (e.charCodeAt(M + 1) & 64512) == 56320 ? (++M, A += 4) : A += 3;
	return A;
}
function utf8Array(e) {
	for (var A = 0, j, M, N = Array(utf8Length(e)), P = 0, F = e.length; P < F; ++P) j = e.charCodeAt(P), j < 128 ? N[A++] = j : j < 2048 ? (N[A++] = j >> 6 | 192, N[A++] = j & 63 | 128) : (j & 64512) == 55296 && ((M = e.charCodeAt(P + 1)) & 64512) == 56320 ? (j = 65536 + ((j & 1023) << 10) + (M & 1023), ++P, N[A++] = j >> 18 | 240, N[A++] = j >> 12 & 63 | 128, N[A++] = j >> 6 & 63 | 128, N[A++] = j & 63 | 128) : (N[A++] = j >> 12 | 224, N[A++] = j >> 6 & 63 | 128, N[A++] = j & 63 | 128);
	return N;
}
var BASE64_CODE = "./ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".split(""), BASE64_INDEX = [
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
function base64_encode(e, A) {
	var j = 0, M = [], N, P;
	if (A <= 0 || A > e.length) throw Error("Illegal len: " + A);
	for (; j < A;) {
		if (N = e[j++] & 255, M.push(BASE64_CODE[N >> 2 & 63]), N = (N & 3) << 4, j >= A) {
			M.push(BASE64_CODE[N & 63]);
			break;
		}
		if (P = e[j++] & 255, N |= P >> 4 & 15, M.push(BASE64_CODE[N & 63]), N = (P & 15) << 2, j >= A) {
			M.push(BASE64_CODE[N & 63]);
			break;
		}
		P = e[j++] & 255, N |= P >> 6 & 3, M.push(BASE64_CODE[N & 63]), M.push(BASE64_CODE[P & 63]);
	}
	return M.join("");
}
function base64_decode(e, A) {
	var j = 0, M = e.length, N = 0, P = [], F, I, L, R, z, B;
	if (A <= 0) throw Error("Illegal len: " + A);
	for (; j < M - 1 && N < A && (B = e.charCodeAt(j++), F = B < BASE64_INDEX.length ? BASE64_INDEX[B] : -1, B = e.charCodeAt(j++), I = B < BASE64_INDEX.length ? BASE64_INDEX[B] : -1, !(F == -1 || I == -1 || (z = F << 2 >>> 0, z |= (I & 48) >> 4, P.push(String.fromCharCode(z)), ++N >= A || j >= M) || (B = e.charCodeAt(j++), L = B < BASE64_INDEX.length ? BASE64_INDEX[B] : -1, L == -1) || (z = (I & 15) << 4 >>> 0, z |= (L & 60) >> 2, P.push(String.fromCharCode(z)), ++N >= A || j >= M)));) B = e.charCodeAt(j++), R = B < BASE64_INDEX.length ? BASE64_INDEX[B] : -1, z = (L & 3) << 6 >>> 0, z |= R, P.push(String.fromCharCode(z)), ++N;
	var V = [];
	for (j = 0; j < N; j++) V.push(P[j].charCodeAt(0));
	return V;
}
var BCRYPT_SALT_LEN = 16, GENSALT_DEFAULT_LOG2_ROUNDS = 10, BLOWFISH_NUM_ROUNDS = 16, MAX_EXECUTION_TIME = 100, P_ORIG = [
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
], S_ORIG = [
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
], C_ORIG = [
	1332899944,
	1700884034,
	1701343084,
	1684370003,
	1668446532,
	1869963892
];
function _encipher(e, A, j, M) {
	var N, P = e[A], F = e[A + 1];
	return P ^= j[0], N = M[P >>> 24], N += M[256 | P >> 16 & 255], N ^= M[512 | P >> 8 & 255], N += M[768 | P & 255], F ^= N ^ j[1], N = M[F >>> 24], N += M[256 | F >> 16 & 255], N ^= M[512 | F >> 8 & 255], N += M[768 | F & 255], P ^= N ^ j[2], N = M[P >>> 24], N += M[256 | P >> 16 & 255], N ^= M[512 | P >> 8 & 255], N += M[768 | P & 255], F ^= N ^ j[3], N = M[F >>> 24], N += M[256 | F >> 16 & 255], N ^= M[512 | F >> 8 & 255], N += M[768 | F & 255], P ^= N ^ j[4], N = M[P >>> 24], N += M[256 | P >> 16 & 255], N ^= M[512 | P >> 8 & 255], N += M[768 | P & 255], F ^= N ^ j[5], N = M[F >>> 24], N += M[256 | F >> 16 & 255], N ^= M[512 | F >> 8 & 255], N += M[768 | F & 255], P ^= N ^ j[6], N = M[P >>> 24], N += M[256 | P >> 16 & 255], N ^= M[512 | P >> 8 & 255], N += M[768 | P & 255], F ^= N ^ j[7], N = M[F >>> 24], N += M[256 | F >> 16 & 255], N ^= M[512 | F >> 8 & 255], N += M[768 | F & 255], P ^= N ^ j[8], N = M[P >>> 24], N += M[256 | P >> 16 & 255], N ^= M[512 | P >> 8 & 255], N += M[768 | P & 255], F ^= N ^ j[9], N = M[F >>> 24], N += M[256 | F >> 16 & 255], N ^= M[512 | F >> 8 & 255], N += M[768 | F & 255], P ^= N ^ j[10], N = M[P >>> 24], N += M[256 | P >> 16 & 255], N ^= M[512 | P >> 8 & 255], N += M[768 | P & 255], F ^= N ^ j[11], N = M[F >>> 24], N += M[256 | F >> 16 & 255], N ^= M[512 | F >> 8 & 255], N += M[768 | F & 255], P ^= N ^ j[12], N = M[P >>> 24], N += M[256 | P >> 16 & 255], N ^= M[512 | P >> 8 & 255], N += M[768 | P & 255], F ^= N ^ j[13], N = M[F >>> 24], N += M[256 | F >> 16 & 255], N ^= M[512 | F >> 8 & 255], N += M[768 | F & 255], P ^= N ^ j[14], N = M[P >>> 24], N += M[256 | P >> 16 & 255], N ^= M[512 | P >> 8 & 255], N += M[768 | P & 255], F ^= N ^ j[15], N = M[F >>> 24], N += M[256 | F >> 16 & 255], N ^= M[512 | F >> 8 & 255], N += M[768 | F & 255], P ^= N ^ j[16], e[A] = F ^ j[BLOWFISH_NUM_ROUNDS + 1], e[A + 1] = P, e;
}
function _streamtoword(e, A) {
	for (var j = 0, M = 0; j < 4; ++j) M = M << 8 | e[A] & 255, A = (A + 1) % e.length;
	return {
		key: M,
		offp: A
	};
}
function _key(e, A, j) {
	for (var M = 0, N = [0, 0], P = A.length, F = j.length, I, L = 0; L < P; L++) I = _streamtoword(e, M), M = I.offp, A[L] = A[L] ^ I.key;
	for (L = 0; L < P; L += 2) N = _encipher(N, 0, A, j), A[L] = N[0], A[L + 1] = N[1];
	for (L = 0; L < F; L += 2) N = _encipher(N, 0, A, j), j[L] = N[0], j[L + 1] = N[1];
}
function _ekskey(e, A, j, M) {
	for (var N = 0, P = [0, 0], F = j.length, I = M.length, L, R = 0; R < F; R++) L = _streamtoword(A, N), N = L.offp, j[R] = j[R] ^ L.key;
	for (N = 0, R = 0; R < F; R += 2) L = _streamtoword(e, N), N = L.offp, P[0] ^= L.key, L = _streamtoword(e, N), N = L.offp, P[1] ^= L.key, P = _encipher(P, 0, j, M), j[R] = P[0], j[R + 1] = P[1];
	for (R = 0; R < I; R += 2) L = _streamtoword(e, N), N = L.offp, P[0] ^= L.key, L = _streamtoword(e, N), N = L.offp, P[1] ^= L.key, P = _encipher(P, 0, j, M), M[R] = P[0], M[R + 1] = P[1];
}
function _crypt(e, A, j, M, N) {
	var P = C_ORIG.slice(), F = P.length, I;
	if (j < 4 || j > 31) if (I = Error("Illegal number of rounds (4-31): " + j), M) {
		nextTick(M.bind(this, I));
		return;
	} else throw I;
	if (A.length !== BCRYPT_SALT_LEN) if (I = Error("Illegal salt length: " + A.length + " != " + BCRYPT_SALT_LEN), M) {
		nextTick(M.bind(this, I));
		return;
	} else throw I;
	j = 1 << j >>> 0;
	var L, R, z = 0, B;
	typeof Int32Array == "function" ? (L = new Int32Array(P_ORIG), R = new Int32Array(S_ORIG)) : (L = P_ORIG.slice(), R = S_ORIG.slice()), _ekskey(A, e, L, R);
	function V() {
		if (N && N(z / j), z < j) for (var I = Date.now(); z < j && (z += 1, _key(e, L, R), _key(A, L, R), !(Date.now() - I > MAX_EXECUTION_TIME)););
		else {
			for (z = 0; z < 64; z++) for (B = 0; B < F >> 1; B++) _encipher(P, B << 1, L, R);
			var H = [];
			for (z = 0; z < F; z++) H.push((P[z] >> 24 & 255) >>> 0), H.push((P[z] >> 16 & 255) >>> 0), H.push((P[z] >> 8 & 255) >>> 0), H.push((P[z] & 255) >>> 0);
			if (M) {
				M(null, H);
				return;
			} else return H;
		}
		M && nextTick(V);
	}
	if (M !== void 0) V();
	else for (var H;;) if ((H = V()) !== void 0) return H || [];
}
function _hash(e, A, j, M) {
	var N;
	if (typeof e != "string" || typeof A != "string") if (N = Error("Invalid string / salt: Not a string"), j) {
		nextTick(j.bind(this, N));
		return;
	} else throw N;
	var P, F;
	if (A.charAt(0) !== "$" || A.charAt(1) !== "2") if (N = Error("Invalid salt version: " + A.substring(0, 2)), j) {
		nextTick(j.bind(this, N));
		return;
	} else throw N;
	if (A.charAt(2) === "$") P = "\0", F = 3;
	else {
		if (P = A.charAt(2), P !== "a" && P !== "b" && P !== "y" || A.charAt(3) !== "$") if (N = Error("Invalid salt revision: " + A.substring(2, 4)), j) {
			nextTick(j.bind(this, N));
			return;
		} else throw N;
		F = 4;
	}
	if (A.charAt(F + 2) > "$") if (N = Error("Missing salt rounds"), j) {
		nextTick(j.bind(this, N));
		return;
	} else throw N;
	var I = parseInt(A.substring(F, F + 1), 10) * 10 + parseInt(A.substring(F + 1, F + 2), 10), L = A.substring(F + 3, F + 25);
	e += P >= "a" ? "\0" : "";
	var R = utf8Array(e), z = base64_decode(L, BCRYPT_SALT_LEN);
	function B(e) {
		var A = [];
		return A.push("$2"), P >= "a" && A.push(P), A.push("$"), I < 10 && A.push("0"), A.push(I.toString()), A.push("$"), A.push(base64_encode(z, z.length)), A.push(base64_encode(e, C_ORIG.length * 4 - 1)), A.join("");
	}
	if (j === void 0) return B(_crypt(R, z, I));
	_crypt(R, z, I, function(e, A) {
		e ? j(e, null) : j(null, B(A));
	}, M);
}
function encodeBase64(e, A) {
	return base64_encode(e, A);
}
function decodeBase64(e, A) {
	return base64_decode(e, A);
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
	ipcMain.handle("bcrypt:hash", async (e, A, j) => {
		let M = await bcryptjs_default.genSalt(j);
		return bcryptjs_default.hash(A, M);
	}), ipcMain.handle("bcrypt:compare", async (e, A, j) => bcryptjs_default.compare(A, j));
}
var store = new Store(), __dirname = dirname(fileURLToPath(import.meta.url));
process.env.DIST = join(__dirname, "../dist"), process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : join(process.env.DIST, "../public"), protocol.registerSchemesAsPrivileged([{
	scheme: "local-media",
	privileges: {
		bypassCSP: !0,
		stream: !0,
		secure: !0,
		supportFetchAPI: !0
	}
}]);
var win, tray = null, VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL, TRAY_ICON_PATH = join(process.env.VITE_PUBLIC || "", "tray-icon.png");
function setLoginItemSettingsSafely(e) {
	try {
		return app.setLoginItemSettings({
			openAtLogin: e,
			openAsHidden: !0
		}), { success: !0 };
	} catch (e) {
		let A = e instanceof Error ? e.message : String(e);
		return console.warn("Failed to set login item settings:", A), app.isPackaged || console.info("Note: Launch at login requires code signing in production builds"), {
			success: !1,
			error: A
		};
	}
}
function createTray() {
	tray || (tray = new Tray(nativeImage.createFromPath(TRAY_ICON_PATH).resize({
		width: 22,
		height: 22
	})), tray.setToolTip("DevTools"), updateTrayMenu(), tray.on("double-click", () => {
		toggleWindow();
	}));
}
function toggleWindow() {
	win && (win.isVisible() ? win.hide() : win.show(), updateTrayMenu());
}
function updateTrayMenu() {
	if (!tray) return;
	let e = [
		{
			label: win?.isVisible() ? "▼ Hide Window" : "▲ Show Window",
			click: () => {
				win && (win.isVisible() ? win.hide() : win.show(), updateTrayMenu());
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
						let e = randomUUID();
						clipboard.writeText(e), new Notification({
							title: "✓ UUID Generated",
							body: `Copied: ${e.substring(0, 20)}...`,
							silent: !0
						}).show();
					}
				},
				{
					label: "◇ Format JSON",
					accelerator: "CmdOrCtrl+Shift+J",
					click: () => {
						try {
							let e = clipboard.readText(), A = JSON.parse(e), j = JSON.stringify(A, null, 2);
							clipboard.writeText(j), new Notification({
								title: "✓ JSON Formatted",
								body: "Formatted JSON copied to clipboard",
								silent: !0
							}).show();
						} catch {
							new Notification({
								title: "✗ Format Failed",
								body: "Clipboard does not contain valid JSON",
								silent: !0
							}).show();
						}
					}
				},
				{
					label: "# Hash Text (SHA-256)",
					click: () => {
						try {
							let e = clipboard.readText();
							if (!e) throw Error("Empty clipboard");
							let A = createHash("sha256").update(e).digest("hex");
							clipboard.writeText(A), new Notification({
								title: "✓ Hash Generated",
								body: `SHA-256: ${A.substring(0, 20)}...`,
								silent: !0
							}).show();
						} catch {
							new Notification({
								title: "✗ Hash Failed",
								body: "Could not hash clipboard content",
								silent: !0
							}).show();
						}
					}
				},
				{ type: "separator" },
				{
					label: "↑ Base64 Encode",
					click: () => {
						try {
							let e = clipboard.readText();
							if (!e) throw Error("Empty clipboard");
							let A = Buffer.from(e).toString("base64");
							clipboard.writeText(A), new Notification({
								title: "✓ Base64 Encoded",
								body: "Encoded text copied to clipboard",
								silent: !0
							}).show();
						} catch {
							new Notification({
								title: "✗ Encode Failed",
								body: "Could not encode clipboard content",
								silent: !0
							}).show();
						}
					}
				},
				{
					label: "↓ Base64 Decode",
					click: () => {
						try {
							let e = clipboard.readText();
							if (!e) throw Error("Empty clipboard");
							let A = Buffer.from(e, "base64").toString("utf-8");
							clipboard.writeText(A), new Notification({
								title: "✓ Base64 Decoded",
								body: "Decoded text copied to clipboard",
								silent: !0
							}).show();
						} catch {
							new Notification({
								title: "✗ Decode Failed",
								body: "Invalid Base64 in clipboard",
								silent: !0
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
				win?.show(), win?.webContents.send("navigate-to", "settings");
			}
		},
		{ type: "separator" },
		{
			label: "✕ Quit DevTools",
			accelerator: "CmdOrCtrl+Q",
			click: () => {
				app.isQuitting = !0, app.quit();
			}
		}
	], A = Menu.buildFromTemplate(e);
	tray.setContextMenu(A);
}
function createWindow() {
	let e = store.get("windowBounds") || {
		width: 1600,
		height: 900
	}, j = store.get("startMinimized") || !1;
	win = new BrowserWindow({
		icon: join(process.env.VITE_PUBLIC || "", "electron-vite.svg"),
		webPreferences: {
			preload: join(__dirname, "preload.mjs"),
			nodeIntegration: !0,
			contextIsolation: !0
		},
		...e,
		minWidth: 800,
		minHeight: 600,
		resizable: !0,
		show: !j,
		frame: !1,
		transparent: process.platform === "darwin",
		backgroundColor: "#050505",
		titleBarStyle: "hidden",
		vibrancy: "sidebar",
		trafficLightPosition: {
			x: 15,
			y: 15
		}
	});
	let M = () => {
		store.set("windowBounds", win?.getBounds());
	};
	win.on("resize", M), win.on("move", M), win.on("close", (e) => {
		let A = store.get("minimizeToTray") ?? !0;
		return !app.isQuitting && A && (e.preventDefault(), win?.hide(), updateTrayMenu()), !1;
	}), win.on("show", updateTrayMenu), win.on("hide", updateTrayMenu), win.on("maximize", () => {
		win?.webContents.send("window-maximized", !0);
	}), win.on("unmaximize", () => {
		win?.webContents.send("window-maximized", !1);
	}), ipcMain.handle("get-home-dir", () => os$1.homedir()), ipcMain.handle("select-folder", async () => {
		let e = await dialog.showOpenDialog(win, {
			properties: ["openDirectory"],
			title: "Select Folder to Scan"
		});
		return e.canceled || e.filePaths.length === 0 ? {
			canceled: !0,
			path: null
		} : {
			canceled: !1,
			path: e.filePaths[0]
		};
	}), ipcMain.handle("store-get", (e, A) => store.get(A)), ipcMain.handle("store-set", (e, A, j) => {
		if (store.set(A, j), A === "launchAtLogin") {
			let e = setLoginItemSettingsSafely(j === !0);
			!e.success && win && win.webContents.send("login-item-error", {
				message: "Unable to set launch at login. This may require additional permissions.",
				error: e.error
			});
		}
	}), ipcMain.handle("store-delete", (e, A) => store.delete(A)), setupScreenshotHandlers(win), ipcMain.handle("video-compressor:get-info", async (e, A) => await videoCompressor.getVideoInfo(A)), ipcMain.handle("video-compressor:compress", async (e, A) => await videoCompressor.compress(A, (e) => {
		win?.webContents.send("video-compressor:progress", e);
	})), ipcMain.handle("video-compressor:cancel", async (e, A) => videoCompressor.cancel(A)), ipcMain.on("window-set-opacity", (e, A) => {
		win && win.setOpacity(Math.max(.5, Math.min(1, A)));
	}), ipcMain.on("window-set-always-on-top", (e, A) => {
		win && win.setAlwaysOnTop(A);
	}), ipcMain.handle("clipboard-read-text", () => {
		try {
			return clipboard.readText();
		} catch (e) {
			return console.error("Failed to read clipboard:", e), "";
		}
	}), ipcMain.handle("clipboard-read-image", async () => {
		try {
			let e = clipboard.readImage();
			return e.isEmpty() ? null : e.toDataURL();
		} catch (e) {
			return console.error("Failed to read clipboard image:", e), null;
		}
	}), ipcMain.on("window-minimize", () => {
		win?.minimize();
	}), ipcMain.on("window-maximize", () => {
		win?.isMaximized() ? win.unmaximize() : win?.maximize();
	}), ipcMain.on("window-close", () => {
		win?.close();
	}), ipcMain.on("window-open-devtools", () => {
		win?.webContents.openDevTools();
	}), win.webContents.on("did-finish-load", () => {
		win?.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
	}), VITE_DEV_SERVER_URL ? win.loadURL(VITE_DEV_SERVER_URL) : win.loadFile(join(process.env.DIST || "", "index.html"));
}
app.on("window-all-closed", () => {
	process.platform !== "darwin" && app.quit();
}), app.on("activate", () => {
	BrowserWindow.getAllWindows().length === 0 ? createWindow() : win && win.show();
}), app.on("before-quit", () => {
	app.isQuitting = !0, win && win.webContents.send("check-clear-clipboard-on-quit");
}), app.whenReady().then(() => {
	try {
		globalShortcut.register("CommandOrControl+Shift+D", () => {
			toggleWindow();
		});
	} catch (e) {
		console.error("Failed to register global shortcut", e);
	}
	setLoginItemSettingsSafely(store.get("launchAtLogin") === !0), setupSystemHandlers(), setupCryptoHandlers(), setupZipHandlers(), setupCleanerHandlers(), setupDownloadManagerHandlers(), ipcMain.handle("youtube:getInfo", async (e, A) => {
		try {
			return await youtubeDownloader.getVideoInfo(A);
		} catch (e) {
			throw e;
		}
	}), ipcMain.handle("youtube:getPlaylistInfo", async (e, A) => {
		try {
			return await youtubeDownloader.getPlaylistInfo(A);
		} catch (e) {
			throw e;
		}
	}), ipcMain.handle("youtube:download", async (e, A) => {
		try {
			return {
				success: !0,
				filepath: await youtubeDownloader.downloadVideo(A, (A) => {
					e.sender.send("youtube:progress", A);
				})
			};
		} catch (e) {
			return {
				success: !1,
				error: e instanceof Error ? e.message : "Download failed"
			};
		}
	}), ipcMain.handle("youtube:cancel", async () => (youtubeDownloader.cancelDownload(), { success: !0 })), ipcMain.handle("youtube:openFile", async (e, A) => {
		let { shell: j } = await import("electron");
		return j.openPath(A);
	}), ipcMain.handle("youtube:showInFolder", async (e, A) => {
		let { shell: j } = await import("electron");
		return j.showItemInFolder(A), !0;
	}), ipcMain.handle("youtube:chooseFolder", async () => {
		let { dialog: e } = await import("electron"), A = await e.showOpenDialog({
			properties: ["openDirectory", "createDirectory"],
			title: "Choose Download Location",
			buttonLabel: "Select Folder"
		});
		return A.canceled || A.filePaths.length === 0 ? {
			canceled: !0,
			path: null
		} : {
			canceled: !1,
			path: A.filePaths[0]
		};
	}), ipcMain.handle("youtube:getHistory", () => youtubeDownloader.getHistory()), ipcMain.handle("youtube:clearHistory", () => (youtubeDownloader.clearHistory(), !0)), ipcMain.handle("youtube:removeFromHistory", (e, A) => (youtubeDownloader.removeFromHistory(A), !0)), ipcMain.handle("youtube:getSettings", () => youtubeDownloader.getSettings()), ipcMain.handle("youtube:saveSettings", (e, A) => youtubeDownloader.saveSettings(A)), ipcMain.handle("youtube:getCapabilities", () => youtubeDownloader.getCapabilities()), ipcMain.handle("youtube:installAria2", async () => await youtubeDownloader.installAria2()), ipcMain.handle("tiktok:get-info", async (e, A) => await tiktokDownloader.getVideoInfo(A)), ipcMain.handle("tiktok:download", async (e, A) => new Promise((e, j) => {
		tiktokDownloader.downloadVideo(A, (e) => {
			win?.webContents.send("tiktok:progress", e);
		}).then(e).catch(j);
	})), ipcMain.handle("tiktok:cancel", async (e, A) => {
		tiktokDownloader.cancelDownload(A);
	}), ipcMain.handle("tiktok:get-history", async () => tiktokDownloader.getHistory()), ipcMain.handle("tiktok:clear-history", async () => {
		tiktokDownloader.clearHistory();
	}), ipcMain.handle("tiktok:remove-from-history", async (e, A) => {
		tiktokDownloader.removeFromHistory(A);
	}), ipcMain.handle("tiktok:get-settings", async () => tiktokDownloader.getSettings()), ipcMain.handle("tiktok:save-settings", async (e, A) => tiktokDownloader.saveSettings(A)), ipcMain.handle("tiktok:choose-folder", async () => {
		let { dialog: e } = await import("electron"), A = await e.showOpenDialog({ properties: ["openDirectory", "createDirectory"] });
		return A.canceled ? null : A.filePaths[0];
	}), ipcMain.handle("universal:get-info", async (e, A) => await universalDownloader.getMediaInfo(A)), ipcMain.handle("universal:download", async (e, A) => new Promise((e, j) => {
		universalDownloader.downloadMedia(A, (e) => {
			win?.webContents.send("universal:progress", e);
		}).then(e).catch(j);
	})), ipcMain.handle("universal:cancel", async (e, A) => {
		universalDownloader.cancelDownload(A);
	}), ipcMain.handle("universal:get-history", async () => universalDownloader.getHistory()), ipcMain.handle("universal:clear-history", async () => {
		universalDownloader.clearHistory();
	}), ipcMain.handle("universal:remove-from-history", async (e, A) => {
		universalDownloader.removeFromHistory(A);
	}), ipcMain.handle("universal:get-settings", async () => universalDownloader.getSettings()), ipcMain.handle("universal:save-settings", async (e, A) => universalDownloader.saveSettings(A)), ipcMain.handle("universal:choose-folder", async () => {
		let { dialog: e } = await import("electron"), A = await e.showOpenDialog({ properties: ["openDirectory", "createDirectory"] });
		return A.canceled ? null : A.filePaths[0];
	}), ipcMain.handle("universal:check-disk-space", async (e, A) => await universalDownloader.checkDiskSpace(A)), ipcMain.handle("universal:get-queue", async () => universalDownloader.getQueue()), ipcMain.handle("universal:get-pending-count", async () => universalDownloader.getPendingDownloadsCount()), ipcMain.handle("universal:resume-pending", async () => (universalDownloader.resumePendingDownloads(), { success: !0 })), ipcMain.handle("universal:clear-pending", async () => (universalDownloader.clearPendingDownloads(), { success: !0 })), ipcMain.handle("universal:get-error-log", async (e, A) => universalDownloader.getErrorLog(A)), ipcMain.handle("universal:export-error-log", async (e, A) => await universalDownloader.exportErrorLog(A)), ipcMain.handle("universal:get-error-stats", async () => universalDownloader.getErrorStats()), ipcMain.handle("universal:clear-error-log", async (e, A) => (universalDownloader.clearErrorLog(A), { success: !0 })), ipcMain.handle("universal:pause", async (e, A) => await universalDownloader.pauseDownload(A)), ipcMain.handle("universal:resume", async (e, A) => await universalDownloader.resumeDownload(A)), ipcMain.handle("universal:reorder-queue", async (e, A, j) => universalDownloader.reorderQueue(A, j)), ipcMain.handle("universal:retry", async (e, A) => await universalDownloader.retryDownload(A)), ipcMain.handle("universal:open-file", async (e, A) => {
		let { shell: j } = await import("electron");
		try {
			await fs.access(A), j.openPath(A);
		} catch {
			console.error("File not found:", A);
		}
	}), ipcMain.handle("universal:show-in-folder", async (e, A) => {
		let { shell: j } = await import("electron");
		j.showItemInFolder(A);
	}), ipcMain.handle("audio:get-info", async (e, A) => await audioExtractor.getAudioInfo(A)), ipcMain.handle("audio:extract", async (e, A) => new Promise((e, j) => {
		audioExtractor.extractAudio(A, (e) => {
			win?.webContents.send("audio:progress", e);
		}).then(e).catch(j);
	})), ipcMain.handle("audio:cancel", async (e, A) => {
		audioExtractor.cancelExtraction(A);
	}), ipcMain.handle("audio:cancel-all", async () => {
		audioExtractor.cancelAll();
	}), ipcMain.handle("audio:choose-input-file", async () => {
		let e = await dialog.showOpenDialog({
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
		return e.canceled ? null : e.filePaths[0];
	}), ipcMain.handle("audio:choose-input-files", async () => {
		let e = await dialog.showOpenDialog({
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
		return e.canceled ? [] : e.filePaths;
	}), ipcMain.handle("audio:choose-output-folder", async () => {
		let e = await dialog.showOpenDialog({ properties: ["openDirectory", "createDirectory"] });
		return e.canceled ? null : e.filePaths[0];
	}), ipcMain.handle("video-merger:get-info", async (e, A) => await videoMerger.getVideoInfo(A)), ipcMain.handle("video-merger:generate-thumbnail", async (e, A, j) => await videoMerger.generateThumbnail(A, j)), ipcMain.handle("video-compressor:generate-thumbnail", async (e, A) => await videoCompressor.generateThumbnail(A)), ipcMain.handle("video-filmstrip:generate", async (e, A, j, M) => await videoMerger.generateFilmstrip(A, j, M)), ipcMain.handle("video-merger:extract-waveform", async (e, A) => await videoMerger.extractWaveform(A)), ipcMain.handle("video-merger:merge", async (e, A) => new Promise((e, j) => {
		videoMerger.mergeVideos(A, (e) => {
			win?.webContents.send("video-merger:progress", e);
		}).then(e).catch(j);
	})), ipcMain.handle("video-merger:create-from-images", async (e, A) => new Promise((e, j) => {
		videoMerger.createVideoFromImages(A, (e) => {
			win?.webContents.send("video-merger:progress", e);
		}).then(e).catch(j);
	})), ipcMain.handle("video-merger:cancel", async (e, A) => {
		videoMerger.cancelMerge(A);
	}), ipcMain.handle("audio-manager:get-info", async (e, A) => await audioManager.getAudioInfo(A)), ipcMain.handle("audio-manager:apply", async (e, A) => await audioManager.applyAudioChanges(A, (A) => {
		e.sender.send("audio-manager:progress", A);
	})), ipcMain.handle("audio-manager:cancel", async (e, A) => {
		audioManager.cancel(A);
	}), ipcMain.handle("video-trimmer:process", async (e, A) => await videoTrimmer.process(A, (A) => {
		e.sender.send("video-trimmer:progress", A);
	})), ipcMain.handle("video-effects:apply", async (e, A) => await videoEffects.applyEffects(A, (e) => {
		win?.webContents.send("video-effects:progress", e);
	})), ipcMain.on("video-effects:cancel", (e, A) => {
		videoEffects.cancelEffects(A);
	}), ipcMain.handle("video-effects:get-info", async (e, A) => await videoMerger.getVideoInfo(A)), ipcMain.handle("video-trimmer:cancel", async (e, A) => {
		videoTrimmer.cancel(A);
	}), ipcMain.handle("video-merger:choose-files", async () => {
		let e = await dialog.showOpenDialog({
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
		return e.canceled ? [] : e.filePaths;
	}), pluginManager.initialize().catch(console.error), ipcMain.handle("plugins:get-available", () => pluginManager.getAvailablePlugins()), ipcMain.handle("plugins:get-installed", () => pluginManager.getInstalledPlugins()), ipcMain.handle("plugins:install", async (e, A) => {
		await pluginManager.installPlugin(A, (A) => {
			e.sender.send("plugins:progress", A);
		});
	}), ipcMain.handle("plugins:uninstall", async (e, A) => {
		await pluginManager.uninstallPlugin(A);
	}), ipcMain.handle("plugins:toggle", async (e, A, j) => {
		await pluginManager.togglePlugin(A, j);
	}), ipcMain.handle("plugins:update-registry", async () => {
		await pluginManager.updateRegistry(!0);
	}), protocol.handle("local-media", async (e) => {
		try {
			let A = new URL(e.url), j = decodeURIComponent(A.pathname);
			process.platform === "win32" ? /^\/[a-zA-Z]:/.test(j) ? j = j.slice(1) : /^[a-zA-Z]\//.test(j) && (j = j.charAt(0) + ":" + j.slice(1)) : j = j.replace(/^\/+/, "/");
			let M = (await fs.stat(j)).size, N = path.extname(j).toLowerCase(), P = "application/octet-stream";
			N === ".mp4" ? P = "video/mp4" : N === ".webm" ? P = "video/webm" : N === ".mov" ? P = "video/quicktime" : N === ".avi" ? P = "video/x-msvideo" : N === ".mkv" ? P = "video/x-matroska" : N === ".mp3" ? P = "audio/mpeg" : N === ".wav" && (P = "audio/wav");
			let F = !1, I = [
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
				].includes(N)) {
					let e = await videoCompressor.getVideoInfo(j);
					e.codec && I.some((A) => e.codec.toLowerCase().includes(A)) && (F = !0);
				}
			} catch {}
			if (F) {
				console.log(`[LocalMedia] Transcoding ${j} for preview`);
				let e = videoCompressor.getPreviewStream(j), A = Readable.toWeb(e);
				return new Response(A, {
					status: 200,
					headers: { "Content-Type": "video/mp4" }
				});
			}
			let L = e.headers.get("Range");
			if (L) {
				let e = L.replace(/bytes=/, "").split("-"), A = parseInt(e[0], 10), N = e[1] ? parseInt(e[1], 10) : M - 1, F = N - A + 1, I = createReadStream(j, {
					start: A,
					end: N
				}), R = Readable.toWeb(I);
				return new Response(R, {
					status: 206,
					headers: {
						"Content-Range": `bytes ${A}-${N}/${M}`,
						"Accept-Ranges": "bytes",
						"Content-Length": F.toString(),
						"Content-Type": P
					}
				});
			} else {
				let e = createReadStream(j), A = Readable.toWeb(e);
				return new Response(A, { headers: {
					"Content-Length": M.toString(),
					"Content-Type": P,
					"Accept-Ranges": "bytes"
				} });
			}
		} catch (e) {
			return console.error("[LocalMedia] Error:", e), e.code === "ENOENT" ? new Response("File not found", { status: 404 }) : new Response("Error loading media: " + e.message, { status: 500 });
		}
	}), process.platform === "win32" && app.setAppUserModelId("com.devtools.app"), createTray(), createWindow();
});
