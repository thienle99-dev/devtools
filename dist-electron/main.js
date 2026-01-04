import electron, { BrowserWindow, Menu, Notification, Tray, app, clipboard, globalShortcut, ipcMain, nativeImage } from "electron";
import path, { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import crypto, { randomUUID } from "node:crypto";
import process$1 from "node:process";
import { isDeepStrictEqual, promisify } from "node:util";
import fs from "node:fs";
import assert from "node:assert";
import os from "node:os";
import "node:events";
import "node:stream";
var __create = Object.create, __defProp = Object.defineProperty, __getOwnPropDesc = Object.getOwnPropertyDescriptor, __getOwnPropNames = Object.getOwnPropertyNames, __getProtoOf = Object.getPrototypeOf, __hasOwnProp = Object.prototype.hasOwnProperty, __esmMin = (e, s) => () => (e && (s = e(e = 0)), s), __commonJSMin = (e, s) => () => (s || e((s = { exports: {} }).exports, s), s.exports), __export = (e) => {
	let s = {};
	for (var c in e) __defProp(s, c, {
		get: e[c],
		enumerable: !0
	});
	return s;
}, __copyProps = (e, s, c, l) => {
	if (s && typeof s == "object" || typeof s == "function") for (var u = __getOwnPropNames(s), d = 0, f = u.length, p; d < f; d++) p = u[d], !__hasOwnProp.call(e, p) && p !== c && __defProp(e, p, {
		get: ((e) => s[e]).bind(null, p),
		enumerable: !(l = __getOwnPropDesc(s, p)) || l.enumerable
	});
	return e;
}, __toESM = (e, s, c) => (c = e == null ? {} : __create(__getProtoOf(e)), __copyProps(s || !e || !e.__esModule ? __defProp(c, "default", {
	value: e,
	enumerable: !0
}) : c, e)), __toCommonJS = (e) => __copyProps(__defProp({}, "__esModule", { value: !0 }), e), isObject = (e) => {
	let s = typeof e;
	return e !== null && (s === "object" || s === "function");
}, disallowedKeys = new Set([
	"__proto__",
	"prototype",
	"constructor"
]), digits = /* @__PURE__ */ new Set("0123456789");
function getPathSegments(e) {
	let s = [], c = "", l = "start", u = !1;
	for (let d of e) switch (d) {
		case "\\":
			if (l === "index") throw Error("Invalid character in an index");
			if (l === "indexEnd") throw Error("Invalid character after an index");
			u && (c += d), l = "property", u = !u;
			break;
		case ".":
			if (l === "index") throw Error("Invalid character in an index");
			if (l === "indexEnd") {
				l = "property";
				break;
			}
			if (u) {
				u = !1, c += d;
				break;
			}
			if (disallowedKeys.has(c)) return [];
			s.push(c), c = "", l = "property";
			break;
		case "[":
			if (l === "index") throw Error("Invalid character in an index");
			if (l === "indexEnd") {
				l = "index";
				break;
			}
			if (u) {
				u = !1, c += d;
				break;
			}
			if (l === "property") {
				if (disallowedKeys.has(c)) return [];
				s.push(c), c = "";
			}
			l = "index";
			break;
		case "]":
			if (l === "index") {
				s.push(Number.parseInt(c, 10)), c = "", l = "indexEnd";
				break;
			}
			if (l === "indexEnd") throw Error("Invalid character after an index");
		default:
			if (l === "index" && !digits.has(d)) throw Error("Invalid character in an index");
			if (l === "indexEnd") throw Error("Invalid character after an index");
			l === "start" && (l = "property"), u && (u = !1, c += "\\"), c += d;
	}
	switch (u && (c += "\\"), l) {
		case "property":
			if (disallowedKeys.has(c)) return [];
			s.push(c);
			break;
		case "index": throw Error("Index was not closed");
		case "start":
			s.push("");
			break;
	}
	return s;
}
function isStringIndex(e, s) {
	if (typeof s != "number" && Array.isArray(e)) {
		let c = Number.parseInt(s, 10);
		return Number.isInteger(c) && e[c] === e[s];
	}
	return !1;
}
function assertNotStringIndex(e, s) {
	if (isStringIndex(e, s)) throw Error("Cannot use string index");
}
function getProperty(e, s, c) {
	if (!isObject(e) || typeof s != "string") return c === void 0 ? e : c;
	let l = getPathSegments(s);
	if (l.length === 0) return c;
	for (let s = 0; s < l.length; s++) {
		let u = l[s];
		if (e = isStringIndex(e, u) ? s === l.length - 1 ? void 0 : null : e[u], e == null) {
			if (s !== l.length - 1) return c;
			break;
		}
	}
	return e === void 0 ? c : e;
}
function setProperty(e, s, c) {
	if (!isObject(e) || typeof s != "string") return e;
	let l = e, u = getPathSegments(s);
	for (let s = 0; s < u.length; s++) {
		let l = u[s];
		assertNotStringIndex(e, l), s === u.length - 1 ? e[l] = c : isObject(e[l]) || (e[l] = typeof u[s + 1] == "number" ? [] : {}), e = e[l];
	}
	return l;
}
function deleteProperty(e, s) {
	if (!isObject(e) || typeof s != "string") return !1;
	let c = getPathSegments(s);
	for (let s = 0; s < c.length; s++) {
		let l = c[s];
		if (assertNotStringIndex(e, l), s === c.length - 1) return delete e[l], !0;
		if (e = e[l], !isObject(e)) return !1;
	}
}
function hasProperty(e, s) {
	if (!isObject(e) || typeof s != "string") return !1;
	let c = getPathSegments(s);
	if (c.length === 0) return !1;
	for (let s of c) {
		if (!isObject(e) || !(s in e) || isStringIndex(e, s)) return !1;
		e = e[s];
	}
	return !0;
}
var homedir = os.homedir(), tmpdir = os.tmpdir(), { env } = process$1, macos = (e) => {
	let s = path.join(homedir, "Library");
	return {
		data: path.join(s, "Application Support", e),
		config: path.join(s, "Preferences", e),
		cache: path.join(s, "Caches", e),
		log: path.join(s, "Logs", e),
		temp: path.join(tmpdir, e)
	};
}, windows = (e) => {
	let s = env.APPDATA || path.join(homedir, "AppData", "Roaming"), c = env.LOCALAPPDATA || path.join(homedir, "AppData", "Local");
	return {
		data: path.join(c, e, "Data"),
		config: path.join(s, e, "Config"),
		cache: path.join(c, e, "Cache"),
		log: path.join(c, e, "Log"),
		temp: path.join(tmpdir, e)
	};
}, linux = (e) => {
	let s = path.basename(homedir);
	return {
		data: path.join(env.XDG_DATA_HOME || path.join(homedir, ".local", "share"), e),
		config: path.join(env.XDG_CONFIG_HOME || path.join(homedir, ".config"), e),
		cache: path.join(env.XDG_CACHE_HOME || path.join(homedir, ".cache"), e),
		log: path.join(env.XDG_STATE_HOME || path.join(homedir, ".local", "state"), e),
		temp: path.join(tmpdir, s, e)
	};
};
function envPaths(e, { suffix: s = "nodejs" } = {}) {
	if (typeof e != "string") throw TypeError(`Expected a string, got ${typeof e}`);
	return s && (e += `-${s}`), process$1.platform === "darwin" ? macos(e) : process$1.platform === "win32" ? windows(e) : linux(e);
}
var attemptify_async_default = (e, s) => {
	let { onError: c } = s;
	return function(...s) {
		return e.apply(void 0, s).catch(c);
	};
}, attemptify_sync_default = (e, s) => {
	let { onError: c } = s;
	return function(...s) {
		try {
			return e.apply(void 0, s);
		} catch (e) {
			return c(e);
		}
	};
}, retryify_async_default = (e, s) => {
	let { isRetriable: c } = s;
	return function(s) {
		let { timeout: l } = s, u = s.interval ?? 250, d = Date.now() + l;
		return function s(...l) {
			return e.apply(void 0, l).catch((e) => {
				if (!c(e) || Date.now() >= d) throw e;
				let f = Math.round(u * Math.random());
				return f > 0 ? new Promise((e) => setTimeout(e, f)).then(() => s.apply(void 0, l)) : s.apply(void 0, l);
			});
		};
	};
}, retryify_sync_default = (e, s) => {
	let { isRetriable: c } = s;
	return function(s) {
		let { timeout: l } = s, u = Date.now() + l;
		return function(...s) {
			for (;;) try {
				return e.apply(void 0, s);
			} catch (e) {
				if (!c(e) || Date.now() >= u) throw e;
				continue;
			}
		};
	};
}, Handlers = {
	isChangeErrorOk: (e) => {
		if (!Handlers.isNodeError(e)) return !1;
		let { code: s } = e;
		return s === "ENOSYS" || !IS_USER_ROOT$1 && (s === "EINVAL" || s === "EPERM");
	},
	isNodeError: (e) => e instanceof Error,
	isRetriableError: (e) => {
		if (!Handlers.isNodeError(e)) return !1;
		let { code: s } = e;
		return s === "EMFILE" || s === "ENFILE" || s === "EAGAIN" || s === "EBUSY" || s === "EACCESS" || s === "EACCES" || s === "EACCS" || s === "EPERM";
	},
	onChangeError: (e) => {
		if (!Handlers.isNodeError(e) || !Handlers.isChangeErrorOk(e)) throw e;
	}
}, handlers_default = Handlers, ATTEMPTIFY_CHANGE_ERROR_OPTIONS = { onError: handlers_default.onChangeError }, ATTEMPTIFY_NOOP_OPTIONS = { onError: () => void 0 }, IS_USER_ROOT$1 = process$1.getuid ? !process$1.getuid() : !1, RETRYIFY_OPTIONS = { isRetriable: handlers_default.isRetriableError }, dist_default = {
	attempt: {
		chmod: attemptify_async_default(promisify(fs.chmod), ATTEMPTIFY_CHANGE_ERROR_OPTIONS),
		chown: attemptify_async_default(promisify(fs.chown), ATTEMPTIFY_CHANGE_ERROR_OPTIONS),
		close: attemptify_async_default(promisify(fs.close), ATTEMPTIFY_NOOP_OPTIONS),
		fsync: attemptify_async_default(promisify(fs.fsync), ATTEMPTIFY_NOOP_OPTIONS),
		mkdir: attemptify_async_default(promisify(fs.mkdir), ATTEMPTIFY_NOOP_OPTIONS),
		realpath: attemptify_async_default(promisify(fs.realpath), ATTEMPTIFY_NOOP_OPTIONS),
		stat: attemptify_async_default(promisify(fs.stat), ATTEMPTIFY_NOOP_OPTIONS),
		unlink: attemptify_async_default(promisify(fs.unlink), ATTEMPTIFY_NOOP_OPTIONS),
		chmodSync: attemptify_sync_default(fs.chmodSync, ATTEMPTIFY_CHANGE_ERROR_OPTIONS),
		chownSync: attemptify_sync_default(fs.chownSync, ATTEMPTIFY_CHANGE_ERROR_OPTIONS),
		closeSync: attemptify_sync_default(fs.closeSync, ATTEMPTIFY_NOOP_OPTIONS),
		existsSync: attemptify_sync_default(fs.existsSync, ATTEMPTIFY_NOOP_OPTIONS),
		fsyncSync: attemptify_sync_default(fs.fsync, ATTEMPTIFY_NOOP_OPTIONS),
		mkdirSync: attemptify_sync_default(fs.mkdirSync, ATTEMPTIFY_NOOP_OPTIONS),
		realpathSync: attemptify_sync_default(fs.realpathSync, ATTEMPTIFY_NOOP_OPTIONS),
		statSync: attemptify_sync_default(fs.statSync, ATTEMPTIFY_NOOP_OPTIONS),
		unlinkSync: attemptify_sync_default(fs.unlinkSync, ATTEMPTIFY_NOOP_OPTIONS)
	},
	retry: {
		close: retryify_async_default(promisify(fs.close), RETRYIFY_OPTIONS),
		fsync: retryify_async_default(promisify(fs.fsync), RETRYIFY_OPTIONS),
		open: retryify_async_default(promisify(fs.open), RETRYIFY_OPTIONS),
		readFile: retryify_async_default(promisify(fs.readFile), RETRYIFY_OPTIONS),
		rename: retryify_async_default(promisify(fs.rename), RETRYIFY_OPTIONS),
		stat: retryify_async_default(promisify(fs.stat), RETRYIFY_OPTIONS),
		write: retryify_async_default(promisify(fs.write), RETRYIFY_OPTIONS),
		writeFile: retryify_async_default(promisify(fs.writeFile), RETRYIFY_OPTIONS),
		closeSync: retryify_sync_default(fs.closeSync, RETRYIFY_OPTIONS),
		fsyncSync: retryify_sync_default(fs.fsyncSync, RETRYIFY_OPTIONS),
		openSync: retryify_sync_default(fs.openSync, RETRYIFY_OPTIONS),
		readFileSync: retryify_sync_default(fs.readFileSync, RETRYIFY_OPTIONS),
		renameSync: retryify_sync_default(fs.renameSync, RETRYIFY_OPTIONS),
		statSync: retryify_sync_default(fs.statSync, RETRYIFY_OPTIONS),
		writeSync: retryify_sync_default(fs.writeSync, RETRYIFY_OPTIONS),
		writeFileSync: retryify_sync_default(fs.writeFileSync, RETRYIFY_OPTIONS)
	}
}, DEFAULT_WRITE_OPTIONS = {}, DEFAULT_USER_UID = process$1.geteuid ? process$1.geteuid() : -1, DEFAULT_USER_GID = process$1.getegid ? process$1.getegid() : -1, IS_POSIX = !!process$1.getuid;
process$1.getuid && process$1.getuid();
var isException = (e) => e instanceof Error && "code" in e, isString = (e) => typeof e == "string", isUndefined = (e) => e === void 0, IS_LINUX = process$1.platform === "linux", IS_WINDOWS = process$1.platform === "win32", Signals = [
	"SIGHUP",
	"SIGINT",
	"SIGTERM"
];
IS_WINDOWS || Signals.push("SIGALRM", "SIGABRT", "SIGVTALRM", "SIGXCPU", "SIGXFSZ", "SIGUSR2", "SIGTRAP", "SIGSYS", "SIGQUIT", "SIGIOT"), IS_LINUX && Signals.push("SIGIO", "SIGPOLL", "SIGPWR", "SIGSTKFLT");
var signals_default = Signals, node_default = new class {
	constructor() {
		this.callbacks = /* @__PURE__ */ new Set(), this.exited = !1, this.exit = (e) => {
			if (!this.exited) {
				this.exited = !0;
				for (let e of this.callbacks) e();
				e && (IS_WINDOWS && e !== "SIGINT" && e !== "SIGTERM" && e !== "SIGKILL" ? process$1.kill(process$1.pid, "SIGTERM") : process$1.kill(process$1.pid, e));
			}
		}, this.hook = () => {
			process$1.once("exit", () => this.exit());
			for (let e of signals_default) try {
				process$1.once(e, () => this.exit(e));
			} catch {}
		}, this.register = (e) => (this.callbacks.add(e), () => {
			this.callbacks.delete(e);
		}), this.hook();
	}
}().register, Temp = {
	store: {},
	create: (e) => {
		let s = `000000${Math.floor(Math.random() * 16777215).toString(16)}`.slice(-6);
		return `${e}${`.tmp-${Date.now().toString().slice(-10)}${s}`}`;
	},
	get: (e, s, c = !0) => {
		let l = Temp.truncate(s(e));
		return l in Temp.store ? Temp.get(e, s, c) : (Temp.store[l] = c, [l, () => delete Temp.store[l]]);
	},
	purge: (e) => {
		Temp.store[e] && (delete Temp.store[e], dist_default.attempt.unlink(e));
	},
	purgeSync: (e) => {
		Temp.store[e] && (delete Temp.store[e], dist_default.attempt.unlinkSync(e));
	},
	purgeSyncAll: () => {
		for (let e in Temp.store) Temp.purgeSync(e);
	},
	truncate: (e) => {
		let s = path.basename(e);
		if (s.length <= 128) return e;
		let c = /^(\.?)(.*?)((?:\.[^.]+)?(?:\.tmp-\d{10}[a-f0-9]{6})?)$/.exec(s);
		if (!c) return e;
		let l = s.length - 128;
		return `${e.slice(0, -s.length)}${c[1]}${c[2].slice(0, -l)}${c[3]}`;
	}
};
node_default(Temp.purgeSyncAll);
var temp_default = Temp;
function writeFileSync(e, s, c = DEFAULT_WRITE_OPTIONS) {
	if (isString(c)) return writeFileSync(e, s, { encoding: c });
	let l = { timeout: c.timeout ?? 1e3 }, u = null, d = null, f = null;
	try {
		let p = dist_default.attempt.realpathSync(e), m = !!p;
		e = p || e, [d, u] = temp_default.get(e, c.tmpCreate || temp_default.create, c.tmpPurge !== !1);
		let h = IS_POSIX && isUndefined(c.chown), _ = isUndefined(c.mode);
		if (m && (h || _)) {
			let s = dist_default.attempt.statSync(e);
			s && (c = { ...c }, h && (c.chown = {
				uid: s.uid,
				gid: s.gid
			}), _ && (c.mode = s.mode));
		}
		if (!m) {
			let s = path.dirname(e);
			dist_default.attempt.mkdirSync(s, {
				mode: 511,
				recursive: !0
			});
		}
		f = dist_default.retry.openSync(l)(d, "w", c.mode || 438), c.tmpCreated && c.tmpCreated(d), isString(s) ? dist_default.retry.writeSync(l)(f, s, 0, c.encoding || "utf8") : isUndefined(s) || dist_default.retry.writeSync(l)(f, s, 0, s.length, 0), c.fsync !== !1 && (c.fsyncWait === !1 ? dist_default.attempt.fsync(f) : dist_default.retry.fsyncSync(l)(f)), dist_default.retry.closeSync(l)(f), f = null, c.chown && (c.chown.uid !== DEFAULT_USER_UID || c.chown.gid !== DEFAULT_USER_GID) && dist_default.attempt.chownSync(d, c.chown.uid, c.chown.gid), c.mode && c.mode !== 438 && dist_default.attempt.chmodSync(d, c.mode);
		try {
			dist_default.retry.renameSync(l)(d, e);
		} catch (s) {
			if (!isException(s) || s.code !== "ENAMETOOLONG") throw s;
			dist_default.retry.renameSync(l)(d, temp_default.truncate(e));
		}
		u(), d = null;
	} finally {
		f && dist_default.attempt.closeSync(f), d && temp_default.purge(d);
	}
}
var require_code$1 = /* @__PURE__ */ __commonJSMin(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.regexpCode = e.getEsmExportName = e.getProperty = e.safeStringify = e.stringify = e.strConcat = e.addCodeArg = e.str = e._ = e.nil = e._Code = e.Name = e.IDENTIFIER = e._CodeOrName = void 0;
	var s = class {};
	e._CodeOrName = s, e.IDENTIFIER = /^[a-z$_][a-z$_0-9]*$/i;
	var c = class extends s {
		constructor(s) {
			if (super(), !e.IDENTIFIER.test(s)) throw Error("CodeGen: name must be a valid identifier");
			this.str = s;
		}
		toString() {
			return this.str;
		}
		emptyStr() {
			return !1;
		}
		get names() {
			return { [this.str]: 1 };
		}
	};
	e.Name = c;
	var l = class extends s {
		constructor(e) {
			super(), this._items = typeof e == "string" ? [e] : e;
		}
		toString() {
			return this.str;
		}
		emptyStr() {
			if (this._items.length > 1) return !1;
			let e = this._items[0];
			return e === "" || e === "\"\"";
		}
		get str() {
			return this._str ??= this._items.reduce((e, s) => `${e}${s}`, "");
		}
		get names() {
			return this._names ??= this._items.reduce((e, s) => (s instanceof c && (e[s.str] = (e[s.str] || 0) + 1), e), {});
		}
	};
	e._Code = l, e.nil = new l("");
	function u(e, ...s) {
		let c = [e[0]], u = 0;
		for (; u < s.length;) p(c, s[u]), c.push(e[++u]);
		return new l(c);
	}
	e._ = u;
	var d = new l("+");
	function f(e, ...s) {
		let c = [y(e[0])], u = 0;
		for (; u < s.length;) c.push(d), p(c, s[u]), c.push(d, y(e[++u]));
		return m(c), new l(c);
	}
	e.str = f;
	function p(e, s) {
		s instanceof l ? e.push(...s._items) : s instanceof c ? e.push(s) : e.push(_(s));
	}
	e.addCodeArg = p;
	function m(e) {
		let s = 1;
		for (; s < e.length - 1;) {
			if (e[s] === d) {
				let c = h(e[s - 1], e[s + 1]);
				if (c !== void 0) {
					e.splice(s - 1, 3, c);
					continue;
				}
				e[s++] = "+";
			}
			s++;
		}
	}
	function h(e, s) {
		if (s === "\"\"") return e;
		if (e === "\"\"") return s;
		if (typeof e == "string") return s instanceof c || e[e.length - 1] !== "\"" ? void 0 : typeof s == "string" ? s[0] === "\"" ? e.slice(0, -1) + s.slice(1) : void 0 : `${e.slice(0, -1)}${s}"`;
		if (typeof s == "string" && s[0] === "\"" && !(e instanceof c)) return `"${e}${s.slice(1)}`;
	}
	function g(e, s) {
		return s.emptyStr() ? e : e.emptyStr() ? s : f`${e}${s}`;
	}
	e.strConcat = g;
	function _(e) {
		return typeof e == "number" || typeof e == "boolean" || e === null ? e : y(Array.isArray(e) ? e.join(",") : e);
	}
	function v(e) {
		return new l(y(e));
	}
	e.stringify = v;
	function y(e) {
		return JSON.stringify(e).replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
	}
	e.safeStringify = y;
	function b(s) {
		return typeof s == "string" && e.IDENTIFIER.test(s) ? new l(`.${s}`) : u`[${s}]`;
	}
	e.getProperty = b;
	function x(s) {
		if (typeof s == "string" && e.IDENTIFIER.test(s)) return new l(`${s}`);
		throw Error(`CodeGen: invalid export name: ${s}, use explicit $id name mapping`);
	}
	e.getEsmExportName = x;
	function S(e) {
		return new l(e.toString());
	}
	e.regexpCode = S;
})), require_scope = /* @__PURE__ */ __commonJSMin(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.ValueScope = e.ValueScopeName = e.Scope = e.varKinds = e.UsedValueState = void 0;
	var s = require_code$1(), c = class extends Error {
		constructor(e) {
			super(`CodeGen: "code" for ${e} not defined`), this.value = e.value;
		}
	}, l;
	(function(e) {
		e[e.Started = 0] = "Started", e[e.Completed = 1] = "Completed";
	})(l || (e.UsedValueState = l = {})), e.varKinds = {
		const: new s.Name("const"),
		let: new s.Name("let"),
		var: new s.Name("var")
	};
	var u = class {
		constructor({ prefixes: e, parent: s } = {}) {
			this._names = {}, this._prefixes = e, this._parent = s;
		}
		toName(e) {
			return e instanceof s.Name ? e : this.name(e);
		}
		name(e) {
			return new s.Name(this._newName(e));
		}
		_newName(e) {
			let s = this._names[e] || this._nameGroup(e);
			return `${e}${s.index++}`;
		}
		_nameGroup(e) {
			if ((this._parent?._prefixes)?.has(e) || this._prefixes && !this._prefixes.has(e)) throw Error(`CodeGen: prefix "${e}" is not allowed in this scope`);
			return this._names[e] = {
				prefix: e,
				index: 0
			};
		}
	};
	e.Scope = u;
	var d = class extends s.Name {
		constructor(e, s) {
			super(s), this.prefix = e;
		}
		setValue(e, { property: c, itemIndex: l }) {
			this.value = e, this.scopePath = (0, s._)`.${new s.Name(c)}[${l}]`;
		}
	};
	e.ValueScopeName = d;
	var f = (0, s._)`\n`;
	e.ValueScope = class extends u {
		constructor(e) {
			super(e), this._values = {}, this._scope = e.scope, this.opts = {
				...e,
				_n: e.lines ? f : s.nil
			};
		}
		get() {
			return this._scope;
		}
		name(e) {
			return new d(e, this._newName(e));
		}
		value(e, s) {
			if (s.ref === void 0) throw Error("CodeGen: ref must be passed in value");
			let c = this.toName(e), { prefix: l } = c, u = s.key ?? s.ref, d = this._values[l];
			if (d) {
				let e = d.get(u);
				if (e) return e;
			} else d = this._values[l] = /* @__PURE__ */ new Map();
			d.set(u, c);
			let f = this._scope[l] || (this._scope[l] = []), p = f.length;
			return f[p] = s.ref, c.setValue(s, {
				property: l,
				itemIndex: p
			}), c;
		}
		getValue(e, s) {
			let c = this._values[e];
			if (c) return c.get(s);
		}
		scopeRefs(e, c = this._values) {
			return this._reduceValues(c, (c) => {
				if (c.scopePath === void 0) throw Error(`CodeGen: name "${c}" has no value`);
				return (0, s._)`${e}${c.scopePath}`;
			});
		}
		scopeCode(e = this._values, s, c) {
			return this._reduceValues(e, (e) => {
				if (e.value === void 0) throw Error(`CodeGen: name "${e}" has no value`);
				return e.value.code;
			}, s, c);
		}
		_reduceValues(u, d, f = {}, p) {
			let m = s.nil;
			for (let h in u) {
				let g = u[h];
				if (!g) continue;
				let _ = f[h] = f[h] || /* @__PURE__ */ new Map();
				g.forEach((u) => {
					if (_.has(u)) return;
					_.set(u, l.Started);
					let f = d(u);
					if (f) {
						let c = this.opts.es5 ? e.varKinds.var : e.varKinds.const;
						m = (0, s._)`${m}${c} ${u} = ${f};${this.opts._n}`;
					} else if (f = p?.(u)) m = (0, s._)`${m}${f}${this.opts._n}`;
					else throw new c(u);
					_.set(u, l.Completed);
				});
			}
			return m;
		}
	};
})), require_codegen = /* @__PURE__ */ __commonJSMin(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.or = e.and = e.not = e.CodeGen = e.operators = e.varKinds = e.ValueScopeName = e.ValueScope = e.Scope = e.Name = e.regexpCode = e.stringify = e.getProperty = e.nil = e.strConcat = e.str = e._ = void 0;
	var s = require_code$1(), c = require_scope(), l = require_code$1();
	Object.defineProperty(e, "_", {
		enumerable: !0,
		get: function() {
			return l._;
		}
	}), Object.defineProperty(e, "str", {
		enumerable: !0,
		get: function() {
			return l.str;
		}
	}), Object.defineProperty(e, "strConcat", {
		enumerable: !0,
		get: function() {
			return l.strConcat;
		}
	}), Object.defineProperty(e, "nil", {
		enumerable: !0,
		get: function() {
			return l.nil;
		}
	}), Object.defineProperty(e, "getProperty", {
		enumerable: !0,
		get: function() {
			return l.getProperty;
		}
	}), Object.defineProperty(e, "stringify", {
		enumerable: !0,
		get: function() {
			return l.stringify;
		}
	}), Object.defineProperty(e, "regexpCode", {
		enumerable: !0,
		get: function() {
			return l.regexpCode;
		}
	}), Object.defineProperty(e, "Name", {
		enumerable: !0,
		get: function() {
			return l.Name;
		}
	});
	var u = require_scope();
	Object.defineProperty(e, "Scope", {
		enumerable: !0,
		get: function() {
			return u.Scope;
		}
	}), Object.defineProperty(e, "ValueScope", {
		enumerable: !0,
		get: function() {
			return u.ValueScope;
		}
	}), Object.defineProperty(e, "ValueScopeName", {
		enumerable: !0,
		get: function() {
			return u.ValueScopeName;
		}
	}), Object.defineProperty(e, "varKinds", {
		enumerable: !0,
		get: function() {
			return u.varKinds;
		}
	}), e.operators = {
		GT: new s._Code(">"),
		GTE: new s._Code(">="),
		LT: new s._Code("<"),
		LTE: new s._Code("<="),
		EQ: new s._Code("==="),
		NEQ: new s._Code("!=="),
		NOT: new s._Code("!"),
		OR: new s._Code("||"),
		AND: new s._Code("&&"),
		ADD: new s._Code("+")
	};
	var d = class {
		optimizeNodes() {
			return this;
		}
		optimizeNames(e, s) {
			return this;
		}
	}, f = class extends d {
		constructor(e, s, c) {
			super(), this.varKind = e, this.name = s, this.rhs = c;
		}
		render({ es5: e, _n: s }) {
			let l = e ? c.varKinds.var : this.varKind, u = this.rhs === void 0 ? "" : ` = ${this.rhs}`;
			return `${l} ${this.name}${u};` + s;
		}
		optimizeNames(e, s) {
			if (e[this.name.str]) return this.rhs &&= F(this.rhs, e, s), this;
		}
		get names() {
			return this.rhs instanceof s._CodeOrName ? this.rhs.names : {};
		}
	}, p = class extends d {
		constructor(e, s, c) {
			super(), this.lhs = e, this.rhs = s, this.sideEffects = c;
		}
		render({ _n: e }) {
			return `${this.lhs} = ${this.rhs};` + e;
		}
		optimizeNames(e, c) {
			if (!(this.lhs instanceof s.Name && !e[this.lhs.str] && !this.sideEffects)) return this.rhs = F(this.rhs, e, c), this;
		}
		get names() {
			return P(this.lhs instanceof s.Name ? {} : { ...this.lhs.names }, this.rhs);
		}
	}, m = class extends p {
		constructor(e, s, c, l) {
			super(e, c, l), this.op = s;
		}
		render({ _n: e }) {
			return `${this.lhs} ${this.op}= ${this.rhs};` + e;
		}
	}, h = class extends d {
		constructor(e) {
			super(), this.label = e, this.names = {};
		}
		render({ _n: e }) {
			return `${this.label}:` + e;
		}
	}, g = class extends d {
		constructor(e) {
			super(), this.label = e, this.names = {};
		}
		render({ _n: e }) {
			return `break${this.label ? ` ${this.label}` : ""};` + e;
		}
	}, _ = class extends d {
		constructor(e) {
			super(), this.error = e;
		}
		render({ _n: e }) {
			return `throw ${this.error};` + e;
		}
		get names() {
			return this.error.names;
		}
	}, v = class extends d {
		constructor(e) {
			super(), this.code = e;
		}
		render({ _n: e }) {
			return `${this.code};` + e;
		}
		optimizeNodes() {
			return `${this.code}` ? this : void 0;
		}
		optimizeNames(e, s) {
			return this.code = F(this.code, e, s), this;
		}
		get names() {
			return this.code instanceof s._CodeOrName ? this.code.names : {};
		}
	}, y = class extends d {
		constructor(e = []) {
			super(), this.nodes = e;
		}
		render(e) {
			return this.nodes.reduce((s, c) => s + c.render(e), "");
		}
		optimizeNodes() {
			let { nodes: e } = this, s = e.length;
			for (; s--;) {
				let c = e[s].optimizeNodes();
				Array.isArray(c) ? e.splice(s, 1, ...c) : c ? e[s] = c : e.splice(s, 1);
			}
			return e.length > 0 ? this : void 0;
		}
		optimizeNames(e, s) {
			let { nodes: c } = this, l = c.length;
			for (; l--;) {
				let u = c[l];
				u.optimizeNames(e, s) || (I(e, u.names), c.splice(l, 1));
			}
			return c.length > 0 ? this : void 0;
		}
		get names() {
			return this.nodes.reduce((e, s) => N(e, s.names), {});
		}
	}, b = class extends y {
		render(e) {
			return "{" + e._n + super.render(e) + "}" + e._n;
		}
	}, x = class extends y {}, S = class extends b {};
	S.kind = "else";
	var C = class e extends b {
		constructor(e, s) {
			super(s), this.condition = e;
		}
		render(e) {
			let s = `if(${this.condition})` + super.render(e);
			return this.else && (s += "else " + this.else.render(e)), s;
		}
		optimizeNodes() {
			super.optimizeNodes();
			let s = this.condition;
			if (s === !0) return this.nodes;
			let c = this.else;
			if (c) {
				let e = c.optimizeNodes();
				c = this.else = Array.isArray(e) ? new S(e) : e;
			}
			if (c) return s === !1 ? c instanceof e ? c : c.nodes : this.nodes.length ? this : new e(L(s), c instanceof e ? [c] : c.nodes);
			if (!(s === !1 || !this.nodes.length)) return this;
		}
		optimizeNames(e, s) {
			if (this.else = this.else?.optimizeNames(e, s), super.optimizeNames(e, s) || this.else) return this.condition = F(this.condition, e, s), this;
		}
		get names() {
			let e = super.names;
			return P(e, this.condition), this.else && N(e, this.else.names), e;
		}
	};
	C.kind = "if";
	var w = class extends b {};
	w.kind = "for";
	var T = class extends w {
		constructor(e) {
			super(), this.iteration = e;
		}
		render(e) {
			return `for(${this.iteration})` + super.render(e);
		}
		optimizeNames(e, s) {
			if (super.optimizeNames(e, s)) return this.iteration = F(this.iteration, e, s), this;
		}
		get names() {
			return N(super.names, this.iteration.names);
		}
	}, E = class extends w {
		constructor(e, s, c, l) {
			super(), this.varKind = e, this.name = s, this.from = c, this.to = l;
		}
		render(e) {
			let s = e.es5 ? c.varKinds.var : this.varKind, { name: l, from: u, to: d } = this;
			return `for(${s} ${l}=${u}; ${l}<${d}; ${l}++)` + super.render(e);
		}
		get names() {
			return P(P(super.names, this.from), this.to);
		}
	}, D = class extends w {
		constructor(e, s, c, l) {
			super(), this.loop = e, this.varKind = s, this.name = c, this.iterable = l;
		}
		render(e) {
			return `for(${this.varKind} ${this.name} ${this.loop} ${this.iterable})` + super.render(e);
		}
		optimizeNames(e, s) {
			if (super.optimizeNames(e, s)) return this.iterable = F(this.iterable, e, s), this;
		}
		get names() {
			return N(super.names, this.iterable.names);
		}
	}, O = class extends b {
		constructor(e, s, c) {
			super(), this.name = e, this.args = s, this.async = c;
		}
		render(e) {
			return `${this.async ? "async " : ""}function ${this.name}(${this.args})` + super.render(e);
		}
	};
	O.kind = "func";
	var k = class extends y {
		render(e) {
			return "return " + super.render(e);
		}
	};
	k.kind = "return";
	var A = class extends b {
		render(e) {
			let s = "try" + super.render(e);
			return this.catch && (s += this.catch.render(e)), this.finally && (s += this.finally.render(e)), s;
		}
		optimizeNodes() {
			var e, s;
			return super.optimizeNodes(), (e = this.catch) == null || e.optimizeNodes(), (s = this.finally) == null || s.optimizeNodes(), this;
		}
		optimizeNames(e, s) {
			var c, l;
			return super.optimizeNames(e, s), (c = this.catch) == null || c.optimizeNames(e, s), (l = this.finally) == null || l.optimizeNames(e, s), this;
		}
		get names() {
			let e = super.names;
			return this.catch && N(e, this.catch.names), this.finally && N(e, this.finally.names), e;
		}
	}, j = class extends b {
		constructor(e) {
			super(), this.error = e;
		}
		render(e) {
			return `catch(${this.error})` + super.render(e);
		}
	};
	j.kind = "catch";
	var M = class extends b {
		render(e) {
			return "finally" + super.render(e);
		}
	};
	M.kind = "finally", e.CodeGen = class {
		constructor(e, s = {}) {
			this._values = {}, this._blockStarts = [], this._constants = {}, this.opts = {
				...s,
				_n: s.lines ? "\n" : ""
			}, this._extScope = e, this._scope = new c.Scope({ parent: e }), this._nodes = [new x()];
		}
		toString() {
			return this._root.render(this.opts);
		}
		name(e) {
			return this._scope.name(e);
		}
		scopeName(e) {
			return this._extScope.name(e);
		}
		scopeValue(e, s) {
			let c = this._extScope.value(e, s);
			return (this._values[c.prefix] || (this._values[c.prefix] = /* @__PURE__ */ new Set())).add(c), c;
		}
		getScopeValue(e, s) {
			return this._extScope.getValue(e, s);
		}
		scopeRefs(e) {
			return this._extScope.scopeRefs(e, this._values);
		}
		scopeCode() {
			return this._extScope.scopeCode(this._values);
		}
		_def(e, s, c, l) {
			let u = this._scope.toName(s);
			return c !== void 0 && l && (this._constants[u.str] = c), this._leafNode(new f(e, u, c)), u;
		}
		const(e, s, l) {
			return this._def(c.varKinds.const, e, s, l);
		}
		let(e, s, l) {
			return this._def(c.varKinds.let, e, s, l);
		}
		var(e, s, l) {
			return this._def(c.varKinds.var, e, s, l);
		}
		assign(e, s, c) {
			return this._leafNode(new p(e, s, c));
		}
		add(s, c) {
			return this._leafNode(new m(s, e.operators.ADD, c));
		}
		code(e) {
			return typeof e == "function" ? e() : e !== s.nil && this._leafNode(new v(e)), this;
		}
		object(...e) {
			let c = ["{"];
			for (let [l, u] of e) c.length > 1 && c.push(","), c.push(l), (l !== u || this.opts.es5) && (c.push(":"), (0, s.addCodeArg)(c, u));
			return c.push("}"), new s._Code(c);
		}
		if(e, s, c) {
			if (this._blockNode(new C(e)), s && c) this.code(s).else().code(c).endIf();
			else if (s) this.code(s).endIf();
			else if (c) throw Error("CodeGen: \"else\" body without \"then\" body");
			return this;
		}
		elseIf(e) {
			return this._elseNode(new C(e));
		}
		else() {
			return this._elseNode(new S());
		}
		endIf() {
			return this._endBlockNode(C, S);
		}
		_for(e, s) {
			return this._blockNode(e), s && this.code(s).endFor(), this;
		}
		for(e, s) {
			return this._for(new T(e), s);
		}
		forRange(e, s, l, u, d = this.opts.es5 ? c.varKinds.var : c.varKinds.let) {
			let f = this._scope.toName(e);
			return this._for(new E(d, f, s, l), () => u(f));
		}
		forOf(e, l, u, d = c.varKinds.const) {
			let f = this._scope.toName(e);
			if (this.opts.es5) {
				let e = l instanceof s.Name ? l : this.var("_arr", l);
				return this.forRange("_i", 0, (0, s._)`${e}.length`, (c) => {
					this.var(f, (0, s._)`${e}[${c}]`), u(f);
				});
			}
			return this._for(new D("of", d, f, l), () => u(f));
		}
		forIn(e, l, u, d = this.opts.es5 ? c.varKinds.var : c.varKinds.const) {
			if (this.opts.ownProperties) return this.forOf(e, (0, s._)`Object.keys(${l})`, u);
			let f = this._scope.toName(e);
			return this._for(new D("in", d, f, l), () => u(f));
		}
		endFor() {
			return this._endBlockNode(w);
		}
		label(e) {
			return this._leafNode(new h(e));
		}
		break(e) {
			return this._leafNode(new g(e));
		}
		return(e) {
			let s = new k();
			if (this._blockNode(s), this.code(e), s.nodes.length !== 1) throw Error("CodeGen: \"return\" should have one node");
			return this._endBlockNode(k);
		}
		try(e, s, c) {
			if (!s && !c) throw Error("CodeGen: \"try\" without \"catch\" and \"finally\"");
			let l = new A();
			if (this._blockNode(l), this.code(e), s) {
				let e = this.name("e");
				this._currNode = l.catch = new j(e), s(e);
			}
			return c && (this._currNode = l.finally = new M(), this.code(c)), this._endBlockNode(j, M);
		}
		throw(e) {
			return this._leafNode(new _(e));
		}
		block(e, s) {
			return this._blockStarts.push(this._nodes.length), e && this.code(e).endBlock(s), this;
		}
		endBlock(e) {
			let s = this._blockStarts.pop();
			if (s === void 0) throw Error("CodeGen: not in self-balancing block");
			let c = this._nodes.length - s;
			if (c < 0 || e !== void 0 && c !== e) throw Error(`CodeGen: wrong number of nodes: ${c} vs ${e} expected`);
			return this._nodes.length = s, this;
		}
		func(e, c = s.nil, l, u) {
			return this._blockNode(new O(e, c, l)), u && this.code(u).endFunc(), this;
		}
		endFunc() {
			return this._endBlockNode(O);
		}
		optimize(e = 1) {
			for (; e-- > 0;) this._root.optimizeNodes(), this._root.optimizeNames(this._root.names, this._constants);
		}
		_leafNode(e) {
			return this._currNode.nodes.push(e), this;
		}
		_blockNode(e) {
			this._currNode.nodes.push(e), this._nodes.push(e);
		}
		_endBlockNode(e, s) {
			let c = this._currNode;
			if (c instanceof e || s && c instanceof s) return this._nodes.pop(), this;
			throw Error(`CodeGen: not in block "${s ? `${e.kind}/${s.kind}` : e.kind}"`);
		}
		_elseNode(e) {
			let s = this._currNode;
			if (!(s instanceof C)) throw Error("CodeGen: \"else\" without \"if\"");
			return this._currNode = s.else = e, this;
		}
		get _root() {
			return this._nodes[0];
		}
		get _currNode() {
			let e = this._nodes;
			return e[e.length - 1];
		}
		set _currNode(e) {
			let s = this._nodes;
			s[s.length - 1] = e;
		}
	};
	function N(e, s) {
		for (let c in s) e[c] = (e[c] || 0) + (s[c] || 0);
		return e;
	}
	function P(e, c) {
		return c instanceof s._CodeOrName ? N(e, c.names) : e;
	}
	function F(e, c, l) {
		if (e instanceof s.Name) return u(e);
		if (!d(e)) return e;
		return new s._Code(e._items.reduce((e, c) => (c instanceof s.Name && (c = u(c)), c instanceof s._Code ? e.push(...c._items) : e.push(c), e), []));
		function u(e) {
			let s = l[e.str];
			return s === void 0 || c[e.str] !== 1 ? e : (delete c[e.str], s);
		}
		function d(e) {
			return e instanceof s._Code && e._items.some((e) => e instanceof s.Name && c[e.str] === 1 && l[e.str] !== void 0);
		}
	}
	function I(e, s) {
		for (let c in s) e[c] = (e[c] || 0) - (s[c] || 0);
	}
	function L(e) {
		return typeof e == "boolean" || typeof e == "number" || e === null ? !e : (0, s._)`!${U(e)}`;
	}
	e.not = L;
	var R = H(e.operators.AND);
	function z(...e) {
		return e.reduce(R);
	}
	e.and = z;
	var B = H(e.operators.OR);
	function V(...e) {
		return e.reduce(B);
	}
	e.or = V;
	function H(e) {
		return (c, l) => c === s.nil ? l : l === s.nil ? c : (0, s._)`${U(c)} ${e} ${U(l)}`;
	}
	function U(e) {
		return e instanceof s.Name ? e : (0, s._)`(${e})`;
	}
})), require_util = /* @__PURE__ */ __commonJSMin(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.checkStrictMode = e.getErrorPath = e.Type = e.useFunc = e.setEvaluated = e.evaluatedPropsToName = e.mergeEvaluated = e.eachItem = e.unescapeJsonPointer = e.escapeJsonPointer = e.escapeFragment = e.unescapeFragment = e.schemaRefOrVal = e.schemaHasRulesButRef = e.schemaHasRules = e.checkUnknownRules = e.alwaysValidSchema = e.toHash = void 0;
	var s = require_codegen(), c = require_code$1();
	function l(e) {
		let s = {};
		for (let c of e) s[c] = !0;
		return s;
	}
	e.toHash = l;
	function u(e, s) {
		return typeof s == "boolean" ? s : Object.keys(s).length === 0 ? !0 : (d(e, s), !f(s, e.self.RULES.all));
	}
	e.alwaysValidSchema = u;
	function d(e, s = e.schema) {
		let { opts: c, self: l } = e;
		if (!c.strictSchema || typeof s == "boolean") return;
		let u = l.RULES.keywords;
		for (let c in s) u[c] || D(e, `unknown keyword: "${c}"`);
	}
	e.checkUnknownRules = d;
	function f(e, s) {
		if (typeof e == "boolean") return !e;
		for (let c in e) if (s[c]) return !0;
		return !1;
	}
	e.schemaHasRules = f;
	function p(e, s) {
		if (typeof e == "boolean") return !e;
		for (let c in e) if (c !== "$ref" && s.all[c]) return !0;
		return !1;
	}
	e.schemaHasRulesButRef = p;
	function m({ topSchemaRef: e, schemaPath: c }, l, u, d) {
		if (!d) {
			if (typeof l == "number" || typeof l == "boolean") return l;
			if (typeof l == "string") return (0, s._)`${l}`;
		}
		return (0, s._)`${e}${c}${(0, s.getProperty)(u)}`;
	}
	e.schemaRefOrVal = m;
	function h(e) {
		return v(decodeURIComponent(e));
	}
	e.unescapeFragment = h;
	function g(e) {
		return encodeURIComponent(_(e));
	}
	e.escapeFragment = g;
	function _(e) {
		return typeof e == "number" ? `${e}` : e.replace(/~/g, "~0").replace(/\//g, "~1");
	}
	e.escapeJsonPointer = _;
	function v(e) {
		return e.replace(/~1/g, "/").replace(/~0/g, "~");
	}
	e.unescapeJsonPointer = v;
	function y(e, s) {
		if (Array.isArray(e)) for (let c of e) s(c);
		else s(e);
	}
	e.eachItem = y;
	function b({ mergeNames: e, mergeToName: c, mergeValues: l, resultToName: u }) {
		return (d, f, p, m) => {
			let h = p === void 0 ? f : p instanceof s.Name ? (f instanceof s.Name ? e(d, f, p) : c(d, f, p), p) : f instanceof s.Name ? (c(d, p, f), f) : l(f, p);
			return m === s.Name && !(h instanceof s.Name) ? u(d, h) : h;
		};
	}
	e.mergeEvaluated = {
		props: b({
			mergeNames: (e, c, l) => e.if((0, s._)`${l} !== true && ${c} !== undefined`, () => {
				e.if((0, s._)`${c} === true`, () => e.assign(l, !0), () => e.assign(l, (0, s._)`${l} || {}`).code((0, s._)`Object.assign(${l}, ${c})`));
			}),
			mergeToName: (e, c, l) => e.if((0, s._)`${l} !== true`, () => {
				c === !0 ? e.assign(l, !0) : (e.assign(l, (0, s._)`${l} || {}`), S(e, l, c));
			}),
			mergeValues: (e, s) => e === !0 ? !0 : {
				...e,
				...s
			},
			resultToName: x
		}),
		items: b({
			mergeNames: (e, c, l) => e.if((0, s._)`${l} !== true && ${c} !== undefined`, () => e.assign(l, (0, s._)`${c} === true ? true : ${l} > ${c} ? ${l} : ${c}`)),
			mergeToName: (e, c, l) => e.if((0, s._)`${l} !== true`, () => e.assign(l, c === !0 ? !0 : (0, s._)`${l} > ${c} ? ${l} : ${c}`)),
			mergeValues: (e, s) => e === !0 ? !0 : Math.max(e, s),
			resultToName: (e, s) => e.var("items", s)
		})
	};
	function x(e, c) {
		if (c === !0) return e.var("props", !0);
		let l = e.var("props", (0, s._)`{}`);
		return c !== void 0 && S(e, l, c), l;
	}
	e.evaluatedPropsToName = x;
	function S(e, c, l) {
		Object.keys(l).forEach((l) => e.assign((0, s._)`${c}${(0, s.getProperty)(l)}`, !0));
	}
	e.setEvaluated = S;
	var C = {};
	function w(e, s) {
		return e.scopeValue("func", {
			ref: s,
			code: C[s.code] || (C[s.code] = new c._Code(s.code))
		});
	}
	e.useFunc = w;
	var T;
	(function(e) {
		e[e.Num = 0] = "Num", e[e.Str = 1] = "Str";
	})(T || (e.Type = T = {}));
	function E(e, c, l) {
		if (e instanceof s.Name) {
			let u = c === T.Num;
			return l ? u ? (0, s._)`"[" + ${e} + "]"` : (0, s._)`"['" + ${e} + "']"` : u ? (0, s._)`"/" + ${e}` : (0, s._)`"/" + ${e}.replace(/~/g, "~0").replace(/\\//g, "~1")`;
		}
		return l ? (0, s.getProperty)(e).toString() : "/" + _(e);
	}
	e.getErrorPath = E;
	function D(e, s, c = e.opts.strictSchema) {
		if (c) {
			if (s = `strict mode: ${s}`, c === !0) throw Error(s);
			e.self.logger.warn(s);
		}
	}
	e.checkStrictMode = D;
})), require_names = /* @__PURE__ */ __commonJSMin(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 });
	var s = require_codegen();
	e.default = {
		data: new s.Name("data"),
		valCxt: new s.Name("valCxt"),
		instancePath: new s.Name("instancePath"),
		parentData: new s.Name("parentData"),
		parentDataProperty: new s.Name("parentDataProperty"),
		rootData: new s.Name("rootData"),
		dynamicAnchors: new s.Name("dynamicAnchors"),
		vErrors: new s.Name("vErrors"),
		errors: new s.Name("errors"),
		this: new s.Name("this"),
		self: new s.Name("self"),
		scope: new s.Name("scope"),
		json: new s.Name("json"),
		jsonPos: new s.Name("jsonPos"),
		jsonLen: new s.Name("jsonLen"),
		jsonPart: new s.Name("jsonPart")
	};
})), require_errors = /* @__PURE__ */ __commonJSMin(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.extendErrors = e.resetErrorsCount = e.reportExtraError = e.reportError = e.keyword$DataError = e.keywordError = void 0;
	var s = require_codegen(), c = require_util(), l = require_names();
	e.keywordError = { message: ({ keyword: e }) => (0, s.str)`must pass "${e}" keyword validation` }, e.keyword$DataError = { message: ({ keyword: e, schemaType: c }) => c ? (0, s.str)`"${e}" keyword must be ${c} ($data)` : (0, s.str)`"${e}" keyword is invalid ($data)` };
	function u(c, l = e.keywordError, u, d) {
		let { it: f } = c, { gen: p, compositeRule: g, allErrors: v } = f, y = _(c, l, u);
		d ?? (g || v) ? m(p, y) : h(f, (0, s._)`[${y}]`);
	}
	e.reportError = u;
	function d(s, c = e.keywordError, u) {
		let { it: d } = s, { gen: f, compositeRule: p, allErrors: g } = d;
		m(f, _(s, c, u)), p || g || h(d, l.default.vErrors);
	}
	e.reportExtraError = d;
	function f(e, c) {
		e.assign(l.default.errors, c), e.if((0, s._)`${l.default.vErrors} !== null`, () => e.if(c, () => e.assign((0, s._)`${l.default.vErrors}.length`, c), () => e.assign(l.default.vErrors, null)));
	}
	e.resetErrorsCount = f;
	function p({ gen: e, keyword: c, schemaValue: u, data: d, errsCount: f, it: p }) {
		/* istanbul ignore if */
		if (f === void 0) throw Error("ajv implementation error");
		let m = e.name("err");
		e.forRange("i", f, l.default.errors, (f) => {
			e.const(m, (0, s._)`${l.default.vErrors}[${f}]`), e.if((0, s._)`${m}.instancePath === undefined`, () => e.assign((0, s._)`${m}.instancePath`, (0, s.strConcat)(l.default.instancePath, p.errorPath))), e.assign((0, s._)`${m}.schemaPath`, (0, s.str)`${p.errSchemaPath}/${c}`), p.opts.verbose && (e.assign((0, s._)`${m}.schema`, u), e.assign((0, s._)`${m}.data`, d));
		});
	}
	e.extendErrors = p;
	function m(e, c) {
		let u = e.const("err", c);
		e.if((0, s._)`${l.default.vErrors} === null`, () => e.assign(l.default.vErrors, (0, s._)`[${u}]`), (0, s._)`${l.default.vErrors}.push(${u})`), e.code((0, s._)`${l.default.errors}++`);
	}
	function h(e, c) {
		let { gen: l, validateName: u, schemaEnv: d } = e;
		d.$async ? l.throw((0, s._)`new ${e.ValidationError}(${c})`) : (l.assign((0, s._)`${u}.errors`, c), l.return(!1));
	}
	var g = {
		keyword: new s.Name("keyword"),
		schemaPath: new s.Name("schemaPath"),
		params: new s.Name("params"),
		propertyName: new s.Name("propertyName"),
		message: new s.Name("message"),
		schema: new s.Name("schema"),
		parentSchema: new s.Name("parentSchema")
	};
	function _(e, c, l) {
		let { createErrors: u } = e.it;
		return u === !1 ? (0, s._)`{}` : v(e, c, l);
	}
	function v(e, s, c = {}) {
		let { gen: l, it: u } = e, d = [y(u, c), b(e, c)];
		return x(e, s, d), l.object(...d);
	}
	function y({ errorPath: e }, { instancePath: u }) {
		let d = u ? (0, s.str)`${e}${(0, c.getErrorPath)(u, c.Type.Str)}` : e;
		return [l.default.instancePath, (0, s.strConcat)(l.default.instancePath, d)];
	}
	function b({ keyword: e, it: { errSchemaPath: l } }, { schemaPath: u, parentSchema: d }) {
		let f = d ? l : (0, s.str)`${l}/${e}`;
		return u && (f = (0, s.str)`${f}${(0, c.getErrorPath)(u, c.Type.Str)}`), [g.schemaPath, f];
	}
	function x(e, { params: c, message: u }, d) {
		let { keyword: f, data: p, schemaValue: m, it: h } = e, { opts: _, propertyName: v, topSchemaRef: y, schemaPath: b } = h;
		d.push([g.keyword, f], [g.params, typeof c == "function" ? c(e) : c || (0, s._)`{}`]), _.messages && d.push([g.message, typeof u == "function" ? u(e) : u]), _.verbose && d.push([g.schema, m], [g.parentSchema, (0, s._)`${y}${b}`], [l.default.data, p]), v && d.push([g.propertyName, v]);
	}
})), require_boolSchema = /* @__PURE__ */ __commonJSMin(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.boolOrEmptySchema = e.topBoolOrEmptySchema = void 0;
	var s = require_errors(), c = require_codegen(), l = require_names(), u = { message: "boolean schema is false" };
	function d(e) {
		let { gen: s, schema: u, validateName: d } = e;
		u === !1 ? p(e, !1) : typeof u == "object" && u.$async === !0 ? s.return(l.default.data) : (s.assign((0, c._)`${d}.errors`, null), s.return(!0));
	}
	e.topBoolOrEmptySchema = d;
	function f(e, s) {
		let { gen: c, schema: l } = e;
		l === !1 ? (c.var(s, !1), p(e)) : c.var(s, !0);
	}
	e.boolOrEmptySchema = f;
	function p(e, c) {
		let { gen: l, data: d } = e, f = {
			gen: l,
			keyword: "false schema",
			data: d,
			schema: !1,
			schemaCode: !1,
			schemaValue: !1,
			params: {},
			it: e
		};
		(0, s.reportError)(f, u, void 0, c);
	}
})), require_rules = /* @__PURE__ */ __commonJSMin(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.getRules = e.isJSONType = void 0;
	var s = new Set([
		"string",
		"number",
		"integer",
		"boolean",
		"null",
		"object",
		"array"
	]);
	function c(e) {
		return typeof e == "string" && s.has(e);
	}
	e.isJSONType = c;
	function l() {
		let e = {
			number: {
				type: "number",
				rules: []
			},
			string: {
				type: "string",
				rules: []
			},
			array: {
				type: "array",
				rules: []
			},
			object: {
				type: "object",
				rules: []
			}
		};
		return {
			types: {
				...e,
				integer: !0,
				boolean: !0,
				null: !0
			},
			rules: [
				{ rules: [] },
				e.number,
				e.string,
				e.array,
				e.object
			],
			post: { rules: [] },
			all: {},
			keywords: {}
		};
	}
	e.getRules = l;
})), require_applicability = /* @__PURE__ */ __commonJSMin(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.shouldUseRule = e.shouldUseGroup = e.schemaHasRulesForType = void 0;
	function s({ schema: e, self: s }, l) {
		let u = s.RULES.types[l];
		return u && u !== !0 && c(e, u);
	}
	e.schemaHasRulesForType = s;
	function c(e, s) {
		return s.rules.some((s) => l(e, s));
	}
	e.shouldUseGroup = c;
	function l(e, s) {
		return e[s.keyword] !== void 0 || s.definition.implements?.some((s) => e[s] !== void 0);
	}
	e.shouldUseRule = l;
})), require_dataType = /* @__PURE__ */ __commonJSMin(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.reportTypeError = e.checkDataTypes = e.checkDataType = e.coerceAndCheckDataType = e.getJSONTypes = e.getSchemaTypes = e.DataType = void 0;
	var s = require_rules(), c = require_applicability(), l = require_errors(), u = require_codegen(), d = require_util(), f;
	(function(e) {
		e[e.Correct = 0] = "Correct", e[e.Wrong = 1] = "Wrong";
	})(f || (e.DataType = f = {}));
	function p(e) {
		let s = m(e.type);
		if (s.includes("null")) {
			if (e.nullable === !1) throw Error("type: null contradicts nullable: false");
		} else {
			if (!s.length && e.nullable !== void 0) throw Error("\"nullable\" cannot be used without \"type\"");
			e.nullable === !0 && s.push("null");
		}
		return s;
	}
	e.getSchemaTypes = p;
	function m(e) {
		let c = Array.isArray(e) ? e : e ? [e] : [];
		if (c.every(s.isJSONType)) return c;
		throw Error("type must be JSONType or JSONType[]: " + c.join(","));
	}
	e.getJSONTypes = m;
	function h(e, s) {
		let { gen: l, data: u, opts: d } = e, p = _(s, d.coerceTypes), m = s.length > 0 && !(p.length === 0 && s.length === 1 && (0, c.schemaHasRulesForType)(e, s[0]));
		if (m) {
			let c = x(s, u, d.strictNumbers, f.Wrong);
			l.if(c, () => {
				p.length ? v(e, s, p) : C(e);
			});
		}
		return m;
	}
	e.coerceAndCheckDataType = h;
	var g = new Set([
		"string",
		"number",
		"integer",
		"boolean",
		"null"
	]);
	function _(e, s) {
		return s ? e.filter((e) => g.has(e) || s === "array" && e === "array") : [];
	}
	function v(e, s, c) {
		let { gen: l, data: d, opts: f } = e, p = l.let("dataType", (0, u._)`typeof ${d}`), m = l.let("coerced", (0, u._)`undefined`);
		f.coerceTypes === "array" && l.if((0, u._)`${p} == 'object' && Array.isArray(${d}) && ${d}.length == 1`, () => l.assign(d, (0, u._)`${d}[0]`).assign(p, (0, u._)`typeof ${d}`).if(x(s, d, f.strictNumbers), () => l.assign(m, d))), l.if((0, u._)`${m} !== undefined`);
		for (let e of c) (g.has(e) || e === "array" && f.coerceTypes === "array") && h(e);
		l.else(), C(e), l.endIf(), l.if((0, u._)`${m} !== undefined`, () => {
			l.assign(d, m), y(e, m);
		});
		function h(e) {
			switch (e) {
				case "string":
					l.elseIf((0, u._)`${p} == "number" || ${p} == "boolean"`).assign(m, (0, u._)`"" + ${d}`).elseIf((0, u._)`${d} === null`).assign(m, (0, u._)`""`);
					return;
				case "number":
					l.elseIf((0, u._)`${p} == "boolean" || ${d} === null
              || (${p} == "string" && ${d} && ${d} == +${d})`).assign(m, (0, u._)`+${d}`);
					return;
				case "integer":
					l.elseIf((0, u._)`${p} === "boolean" || ${d} === null
              || (${p} === "string" && ${d} && ${d} == +${d} && !(${d} % 1))`).assign(m, (0, u._)`+${d}`);
					return;
				case "boolean":
					l.elseIf((0, u._)`${d} === "false" || ${d} === 0 || ${d} === null`).assign(m, !1).elseIf((0, u._)`${d} === "true" || ${d} === 1`).assign(m, !0);
					return;
				case "null":
					l.elseIf((0, u._)`${d} === "" || ${d} === 0 || ${d} === false`), l.assign(m, null);
					return;
				case "array": l.elseIf((0, u._)`${p} === "string" || ${p} === "number"
              || ${p} === "boolean" || ${d} === null`).assign(m, (0, u._)`[${d}]`);
			}
		}
	}
	function y({ gen: e, parentData: s, parentDataProperty: c }, l) {
		e.if((0, u._)`${s} !== undefined`, () => e.assign((0, u._)`${s}[${c}]`, l));
	}
	function b(e, s, c, l = f.Correct) {
		let d = l === f.Correct ? u.operators.EQ : u.operators.NEQ, p;
		switch (e) {
			case "null": return (0, u._)`${s} ${d} null`;
			case "array":
				p = (0, u._)`Array.isArray(${s})`;
				break;
			case "object":
				p = (0, u._)`${s} && typeof ${s} == "object" && !Array.isArray(${s})`;
				break;
			case "integer":
				p = m((0, u._)`!(${s} % 1) && !isNaN(${s})`);
				break;
			case "number":
				p = m();
				break;
			default: return (0, u._)`typeof ${s} ${d} ${e}`;
		}
		return l === f.Correct ? p : (0, u.not)(p);
		function m(e = u.nil) {
			return (0, u.and)((0, u._)`typeof ${s} == "number"`, e, c ? (0, u._)`isFinite(${s})` : u.nil);
		}
	}
	e.checkDataType = b;
	function x(e, s, c, l) {
		if (e.length === 1) return b(e[0], s, c, l);
		let f, p = (0, d.toHash)(e);
		if (p.array && p.object) {
			let e = (0, u._)`typeof ${s} != "object"`;
			f = p.null ? e : (0, u._)`!${s} || ${e}`, delete p.null, delete p.array, delete p.object;
		} else f = u.nil;
		for (let e in p.number && delete p.integer, p) f = (0, u.and)(f, b(e, s, c, l));
		return f;
	}
	e.checkDataTypes = x;
	var S = {
		message: ({ schema: e }) => `must be ${e}`,
		params: ({ schema: e, schemaValue: s }) => typeof e == "string" ? (0, u._)`{type: ${e}}` : (0, u._)`{type: ${s}}`
	};
	function C(e) {
		let s = w(e);
		(0, l.reportError)(s, S);
	}
	e.reportTypeError = C;
	function w(e) {
		let { gen: s, data: c, schema: l } = e, u = (0, d.schemaRefOrVal)(e, l, "type");
		return {
			gen: s,
			keyword: "type",
			data: c,
			schema: l.type,
			schemaCode: u,
			schemaValue: u,
			parentSchema: l,
			params: {},
			it: e
		};
	}
})), require_defaults = /* @__PURE__ */ __commonJSMin(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.assignDefaults = void 0;
	var s = require_codegen(), c = require_util();
	function l(e, s) {
		let { properties: c, items: l } = e.schema;
		if (s === "object" && c) for (let s in c) u(e, s, c[s].default);
		else s === "array" && Array.isArray(l) && l.forEach((s, c) => u(e, c, s.default));
	}
	e.assignDefaults = l;
	function u(e, l, u) {
		let { gen: d, compositeRule: f, data: p, opts: m } = e;
		if (u === void 0) return;
		let h = (0, s._)`${p}${(0, s.getProperty)(l)}`;
		if (f) {
			(0, c.checkStrictMode)(e, `default is ignored for: ${h}`);
			return;
		}
		let g = (0, s._)`${h} === undefined`;
		m.useDefaults === "empty" && (g = (0, s._)`${g} || ${h} === null || ${h} === ""`), d.if(g, (0, s._)`${h} = ${(0, s.stringify)(u)}`);
	}
})), require_code = /* @__PURE__ */ __commonJSMin(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.validateUnion = e.validateArray = e.usePattern = e.callValidateCode = e.schemaProperties = e.allSchemaProperties = e.noPropertyInData = e.propertyInData = e.isOwnProperty = e.hasPropFunc = e.reportMissingProp = e.checkMissingProp = e.checkReportMissingProp = void 0;
	var s = require_codegen(), c = require_util(), l = require_names(), u = require_util();
	function d(e, c) {
		let { gen: l, data: u, it: d } = e;
		l.if(_(l, u, c, d.opts.ownProperties), () => {
			e.setParams({ missingProperty: (0, s._)`${c}` }, !0), e.error();
		});
	}
	e.checkReportMissingProp = d;
	function f({ gen: e, data: c, it: { opts: l } }, u, d) {
		return (0, s.or)(...u.map((u) => (0, s.and)(_(e, c, u, l.ownProperties), (0, s._)`${d} = ${u}`)));
	}
	e.checkMissingProp = f;
	function p(e, s) {
		e.setParams({ missingProperty: s }, !0), e.error();
	}
	e.reportMissingProp = p;
	function m(e) {
		return e.scopeValue("func", {
			ref: Object.prototype.hasOwnProperty,
			code: (0, s._)`Object.prototype.hasOwnProperty`
		});
	}
	e.hasPropFunc = m;
	function h(e, c, l) {
		return (0, s._)`${m(e)}.call(${c}, ${l})`;
	}
	e.isOwnProperty = h;
	function g(e, c, l, u) {
		let d = (0, s._)`${c}${(0, s.getProperty)(l)} !== undefined`;
		return u ? (0, s._)`${d} && ${h(e, c, l)}` : d;
	}
	e.propertyInData = g;
	function _(e, c, l, u) {
		let d = (0, s._)`${c}${(0, s.getProperty)(l)} === undefined`;
		return u ? (0, s.or)(d, (0, s.not)(h(e, c, l))) : d;
	}
	e.noPropertyInData = _;
	function v(e) {
		return e ? Object.keys(e).filter((e) => e !== "__proto__") : [];
	}
	e.allSchemaProperties = v;
	function y(e, s) {
		return v(s).filter((l) => !(0, c.alwaysValidSchema)(e, s[l]));
	}
	e.schemaProperties = y;
	function b({ schemaCode: e, data: c, it: { gen: u, topSchemaRef: d, schemaPath: f, errorPath: p }, it: m }, h, g, _) {
		let v = _ ? (0, s._)`${e}, ${c}, ${d}${f}` : c, y = [
			[l.default.instancePath, (0, s.strConcat)(l.default.instancePath, p)],
			[l.default.parentData, m.parentData],
			[l.default.parentDataProperty, m.parentDataProperty],
			[l.default.rootData, l.default.rootData]
		];
		m.opts.dynamicRef && y.push([l.default.dynamicAnchors, l.default.dynamicAnchors]);
		let b = (0, s._)`${v}, ${u.object(...y)}`;
		return g === s.nil ? (0, s._)`${h}(${b})` : (0, s._)`${h}.call(${g}, ${b})`;
	}
	e.callValidateCode = b;
	var x = (0, s._)`new RegExp`;
	function S({ gen: e, it: { opts: c } }, l) {
		let d = c.unicodeRegExp ? "u" : "", { regExp: f } = c.code, p = f(l, d);
		return e.scopeValue("pattern", {
			key: p.toString(),
			ref: p,
			code: (0, s._)`${f.code === "new RegExp" ? x : (0, u.useFunc)(e, f)}(${l}, ${d})`
		});
	}
	e.usePattern = S;
	function C(e) {
		let { gen: l, data: u, keyword: d, it: f } = e, p = l.name("valid");
		if (f.allErrors) {
			let e = l.let("valid", !0);
			return m(() => l.assign(e, !1)), e;
		}
		return l.var(p, !0), m(() => l.break()), p;
		function m(f) {
			let m = l.const("len", (0, s._)`${u}.length`);
			l.forRange("i", 0, m, (u) => {
				e.subschema({
					keyword: d,
					dataProp: u,
					dataPropType: c.Type.Num
				}, p), l.if((0, s.not)(p), f);
			});
		}
	}
	e.validateArray = C;
	function w(e) {
		let { gen: l, schema: u, keyword: d, it: f } = e;
		/* istanbul ignore if */
		if (!Array.isArray(u)) throw Error("ajv implementation error");
		if (u.some((e) => (0, c.alwaysValidSchema)(f, e)) && !f.opts.unevaluated) return;
		let p = l.let("valid", !1), m = l.name("_valid");
		l.block(() => u.forEach((c, u) => {
			let f = e.subschema({
				keyword: d,
				schemaProp: u,
				compositeRule: !0
			}, m);
			l.assign(p, (0, s._)`${p} || ${m}`), e.mergeValidEvaluated(f, m) || l.if((0, s.not)(p));
		})), e.result(p, () => e.reset(), () => e.error(!0));
	}
	e.validateUnion = w;
})), require_keyword = /* @__PURE__ */ __commonJSMin(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.validateKeywordUsage = e.validSchemaType = e.funcKeywordCode = e.macroKeywordCode = void 0;
	var s = require_codegen(), c = require_names(), l = require_code(), u = require_errors();
	function d(e, c) {
		let { gen: l, keyword: u, schema: d, parentSchema: f, it: p } = e, m = c.macro.call(p.self, d, f, p), h = g(l, u, m);
		p.opts.validateSchema !== !1 && p.self.validateSchema(m, !0);
		let _ = l.name("valid");
		e.subschema({
			schema: m,
			schemaPath: s.nil,
			errSchemaPath: `${p.errSchemaPath}/${u}`,
			topSchemaRef: h,
			compositeRule: !0
		}, _), e.pass(_, () => e.error(!0));
	}
	e.macroKeywordCode = d;
	function f(e, u) {
		let { gen: d, keyword: f, schema: _, parentSchema: v, $data: y, it: b } = e;
		h(b, u);
		let x = g(d, f, !y && u.compile ? u.compile.call(b.self, _, v, b) : u.validate), S = d.let("valid");
		e.block$data(S, C), e.ok(u.valid ?? S);
		function C() {
			if (u.errors === !1) E(), u.modifying && p(e), D(() => e.error());
			else {
				let s = u.async ? w() : T();
				u.modifying && p(e), D(() => m(e, s));
			}
		}
		function w() {
			let e = d.let("ruleErrs", null);
			return d.try(() => E((0, s._)`await `), (c) => d.assign(S, !1).if((0, s._)`${c} instanceof ${b.ValidationError}`, () => d.assign(e, (0, s._)`${c}.errors`), () => d.throw(c))), e;
		}
		function T() {
			let e = (0, s._)`${x}.errors`;
			return d.assign(e, null), E(s.nil), e;
		}
		function E(f = u.async ? (0, s._)`await ` : s.nil) {
			let p = b.opts.passContext ? c.default.this : c.default.self, m = !("compile" in u && !y || u.schema === !1);
			d.assign(S, (0, s._)`${f}${(0, l.callValidateCode)(e, x, p, m)}`, u.modifying);
		}
		function D(e) {
			d.if((0, s.not)(u.valid ?? S), e);
		}
	}
	e.funcKeywordCode = f;
	function p(e) {
		let { gen: c, data: l, it: u } = e;
		c.if(u.parentData, () => c.assign(l, (0, s._)`${u.parentData}[${u.parentDataProperty}]`));
	}
	function m(e, l) {
		let { gen: d } = e;
		d.if((0, s._)`Array.isArray(${l})`, () => {
			d.assign(c.default.vErrors, (0, s._)`${c.default.vErrors} === null ? ${l} : ${c.default.vErrors}.concat(${l})`).assign(c.default.errors, (0, s._)`${c.default.vErrors}.length`), (0, u.extendErrors)(e);
		}, () => e.error());
	}
	function h({ schemaEnv: e }, s) {
		if (s.async && !e.$async) throw Error("async keyword in sync schema");
	}
	function g(e, c, l) {
		if (l === void 0) throw Error(`keyword "${c}" failed to compile`);
		return e.scopeValue("keyword", typeof l == "function" ? { ref: l } : {
			ref: l,
			code: (0, s.stringify)(l)
		});
	}
	function _(e, s, c = !1) {
		return !s.length || s.some((s) => s === "array" ? Array.isArray(e) : s === "object" ? e && typeof e == "object" && !Array.isArray(e) : typeof e == s || c && e === void 0);
	}
	e.validSchemaType = _;
	function v({ schema: e, opts: s, self: c, errSchemaPath: l }, u, d) {
		/* istanbul ignore if */
		if (Array.isArray(u.keyword) ? !u.keyword.includes(d) : u.keyword !== d) throw Error("ajv implementation error");
		let f = u.dependencies;
		if (f?.some((s) => !Object.prototype.hasOwnProperty.call(e, s))) throw Error(`parent schema must have dependencies of ${d}: ${f.join(",")}`);
		if (u.validateSchema && !u.validateSchema(e[d])) {
			let e = `keyword "${d}" value is invalid at path "${l}": ` + c.errorsText(u.validateSchema.errors);
			if (s.validateSchema === "log") c.logger.error(e);
			else throw Error(e);
		}
	}
	e.validateKeywordUsage = v;
})), require_subschema = /* @__PURE__ */ __commonJSMin(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.extendSubschemaMode = e.extendSubschemaData = e.getSubschema = void 0;
	var s = require_codegen(), c = require_util();
	function l(e, { keyword: l, schemaProp: u, schema: d, schemaPath: f, errSchemaPath: p, topSchemaRef: m }) {
		if (l !== void 0 && d !== void 0) throw Error("both \"keyword\" and \"schema\" passed, only one allowed");
		if (l !== void 0) {
			let d = e.schema[l];
			return u === void 0 ? {
				schema: d,
				schemaPath: (0, s._)`${e.schemaPath}${(0, s.getProperty)(l)}`,
				errSchemaPath: `${e.errSchemaPath}/${l}`
			} : {
				schema: d[u],
				schemaPath: (0, s._)`${e.schemaPath}${(0, s.getProperty)(l)}${(0, s.getProperty)(u)}`,
				errSchemaPath: `${e.errSchemaPath}/${l}/${(0, c.escapeFragment)(u)}`
			};
		}
		if (d !== void 0) {
			if (f === void 0 || p === void 0 || m === void 0) throw Error("\"schemaPath\", \"errSchemaPath\" and \"topSchemaRef\" are required with \"schema\"");
			return {
				schema: d,
				schemaPath: f,
				topSchemaRef: m,
				errSchemaPath: p
			};
		}
		throw Error("either \"keyword\" or \"schema\" must be passed");
	}
	e.getSubschema = l;
	function u(e, l, { dataProp: u, dataPropType: d, data: f, dataTypes: p, propertyName: m }) {
		if (f !== void 0 && u !== void 0) throw Error("both \"data\" and \"dataProp\" passed, only one allowed");
		let { gen: h } = l;
		if (u !== void 0) {
			let { errorPath: f, dataPathArr: p, opts: m } = l;
			g(h.let("data", (0, s._)`${l.data}${(0, s.getProperty)(u)}`, !0)), e.errorPath = (0, s.str)`${f}${(0, c.getErrorPath)(u, d, m.jsPropertySyntax)}`, e.parentDataProperty = (0, s._)`${u}`, e.dataPathArr = [...p, e.parentDataProperty];
		}
		f !== void 0 && (g(f instanceof s.Name ? f : h.let("data", f, !0)), m !== void 0 && (e.propertyName = m)), p && (e.dataTypes = p);
		function g(s) {
			e.data = s, e.dataLevel = l.dataLevel + 1, e.dataTypes = [], l.definedProperties = /* @__PURE__ */ new Set(), e.parentData = l.data, e.dataNames = [...l.dataNames, s];
		}
	}
	e.extendSubschemaData = u;
	function d(e, { jtdDiscriminator: s, jtdMetadata: c, compositeRule: l, createErrors: u, allErrors: d }) {
		l !== void 0 && (e.compositeRule = l), u !== void 0 && (e.createErrors = u), d !== void 0 && (e.allErrors = d), e.jtdDiscriminator = s, e.jtdMetadata = c;
	}
	e.extendSubschemaMode = d;
})), require_fast_deep_equal = /* @__PURE__ */ __commonJSMin(((e, s) => {
	s.exports = function e(s, c) {
		if (s === c) return !0;
		if (s && c && typeof s == "object" && typeof c == "object") {
			if (s.constructor !== c.constructor) return !1;
			var l, u, d;
			if (Array.isArray(s)) {
				if (l = s.length, l != c.length) return !1;
				for (u = l; u-- !== 0;) if (!e(s[u], c[u])) return !1;
				return !0;
			}
			if (s.constructor === RegExp) return s.source === c.source && s.flags === c.flags;
			if (s.valueOf !== Object.prototype.valueOf) return s.valueOf() === c.valueOf();
			if (s.toString !== Object.prototype.toString) return s.toString() === c.toString();
			if (d = Object.keys(s), l = d.length, l !== Object.keys(c).length) return !1;
			for (u = l; u-- !== 0;) if (!Object.prototype.hasOwnProperty.call(c, d[u])) return !1;
			for (u = l; u-- !== 0;) {
				var f = d[u];
				if (!e(s[f], c[f])) return !1;
			}
			return !0;
		}
		return s !== s && c !== c;
	};
})), require_json_schema_traverse = /* @__PURE__ */ __commonJSMin(((e, s) => {
	var c = s.exports = function(e, s, c) {
		typeof s == "function" && (c = s, s = {}), c = s.cb || c;
		var u = typeof c == "function" ? c : c.pre || function() {}, d = c.post || function() {};
		l(s, u, d, e, "", e);
	};
	c.keywords = {
		additionalItems: !0,
		items: !0,
		contains: !0,
		additionalProperties: !0,
		propertyNames: !0,
		not: !0,
		if: !0,
		then: !0,
		else: !0
	}, c.arrayKeywords = {
		items: !0,
		allOf: !0,
		anyOf: !0,
		oneOf: !0
	}, c.propsKeywords = {
		$defs: !0,
		definitions: !0,
		properties: !0,
		patternProperties: !0,
		dependencies: !0
	}, c.skipKeywords = {
		default: !0,
		enum: !0,
		const: !0,
		required: !0,
		maximum: !0,
		minimum: !0,
		exclusiveMaximum: !0,
		exclusiveMinimum: !0,
		multipleOf: !0,
		maxLength: !0,
		minLength: !0,
		pattern: !0,
		format: !0,
		maxItems: !0,
		minItems: !0,
		uniqueItems: !0,
		maxProperties: !0,
		minProperties: !0
	};
	function l(e, s, d, f, p, m, h, g, _, v) {
		if (f && typeof f == "object" && !Array.isArray(f)) {
			for (var y in s(f, p, m, h, g, _, v), f) {
				var b = f[y];
				if (Array.isArray(b)) {
					if (y in c.arrayKeywords) for (var x = 0; x < b.length; x++) l(e, s, d, b[x], p + "/" + y + "/" + x, m, p, y, f, x);
				} else if (y in c.propsKeywords) {
					if (b && typeof b == "object") for (var S in b) l(e, s, d, b[S], p + "/" + y + "/" + u(S), m, p, y, f, S);
				} else (y in c.keywords || e.allKeys && !(y in c.skipKeywords)) && l(e, s, d, b, p + "/" + y, m, p, y, f);
			}
			d(f, p, m, h, g, _, v);
		}
	}
	function u(e) {
		return e.replace(/~/g, "~0").replace(/\//g, "~1");
	}
})), require_resolve = /* @__PURE__ */ __commonJSMin(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.getSchemaRefs = e.resolveUrl = e.normalizeId = e._getFullPath = e.getFullPath = e.inlineRef = void 0;
	var s = require_util(), c = require_fast_deep_equal(), l = require_json_schema_traverse(), u = new Set([
		"type",
		"format",
		"pattern",
		"maxLength",
		"minLength",
		"maxProperties",
		"minProperties",
		"maxItems",
		"minItems",
		"maximum",
		"minimum",
		"uniqueItems",
		"multipleOf",
		"required",
		"enum",
		"const"
	]);
	function d(e, s = !0) {
		return typeof e == "boolean" ? !0 : s === !0 ? !p(e) : s ? m(e) <= s : !1;
	}
	e.inlineRef = d;
	var f = new Set([
		"$ref",
		"$recursiveRef",
		"$recursiveAnchor",
		"$dynamicRef",
		"$dynamicAnchor"
	]);
	function p(e) {
		for (let s in e) {
			if (f.has(s)) return !0;
			let c = e[s];
			if (Array.isArray(c) && c.some(p) || typeof c == "object" && p(c)) return !0;
		}
		return !1;
	}
	function m(e) {
		let c = 0;
		for (let l in e) if (l === "$ref" || (c++, !u.has(l) && (typeof e[l] == "object" && (0, s.eachItem)(e[l], (e) => c += m(e)), c === Infinity))) return Infinity;
		return c;
	}
	function h(e, s = "", c) {
		return c !== !1 && (s = v(s)), g(e, e.parse(s));
	}
	e.getFullPath = h;
	function g(e, s) {
		return e.serialize(s).split("#")[0] + "#";
	}
	e._getFullPath = g;
	var _ = /#\/?$/;
	function v(e) {
		return e ? e.replace(_, "") : "";
	}
	e.normalizeId = v;
	function y(e, s, c) {
		return c = v(c), e.resolve(s, c);
	}
	e.resolveUrl = y;
	var b = /^[a-z_][-a-z0-9._]*$/i;
	function x(e, s) {
		if (typeof e == "boolean") return {};
		let { schemaId: u, uriResolver: d } = this.opts, f = v(e[u] || s), p = { "": f }, m = h(d, f, !1), g = {}, _ = /* @__PURE__ */ new Set();
		return l(e, { allKeys: !0 }, (e, s, c, l) => {
			if (l === void 0) return;
			let d = m + s, f = p[l];
			typeof e[u] == "string" && (f = h.call(this, e[u])), S.call(this, e.$anchor), S.call(this, e.$dynamicAnchor), p[s] = f;
			function h(s) {
				let c = this.opts.uriResolver.resolve;
				if (s = v(f ? c(f, s) : s), _.has(s)) throw x(s);
				_.add(s);
				let l = this.refs[s];
				return typeof l == "string" && (l = this.refs[l]), typeof l == "object" ? y(e, l.schema, s) : s !== v(d) && (s[0] === "#" ? (y(e, g[s], s), g[s] = e) : this.refs[s] = d), s;
			}
			function S(e) {
				if (typeof e == "string") {
					if (!b.test(e)) throw Error(`invalid anchor "${e}"`);
					h.call(this, `#${e}`);
				}
			}
		}), g;
		function y(e, s, l) {
			if (s !== void 0 && !c(e, s)) throw x(l);
		}
		function x(e) {
			return /* @__PURE__ */ Error(`reference "${e}" resolves to more than one schema`);
		}
	}
	e.getSchemaRefs = x;
})), require_validate = /* @__PURE__ */ __commonJSMin(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.getData = e.KeywordCxt = e.validateFunctionCode = void 0;
	var s = require_boolSchema(), c = require_dataType(), l = require_applicability(), u = require_dataType(), d = require_defaults(), f = require_keyword(), p = require_subschema(), m = require_codegen(), h = require_names(), g = require_resolve(), _ = require_util(), v = require_errors();
	function y(e) {
		if (O(e) && (A(e), D(e))) {
			C(e);
			return;
		}
		b(e, () => (0, s.topBoolOrEmptySchema)(e));
	}
	e.validateFunctionCode = y;
	function b({ gen: e, validateName: s, schema: c, schemaEnv: l, opts: u }, d) {
		u.code.es5 ? e.func(s, (0, m._)`${h.default.data}, ${h.default.valCxt}`, l.$async, () => {
			e.code((0, m._)`"use strict"; ${T(c, u)}`), S(e, u), e.code(d);
		}) : e.func(s, (0, m._)`${h.default.data}, ${x(u)}`, l.$async, () => e.code(T(c, u)).code(d));
	}
	function x(e) {
		return (0, m._)`{${h.default.instancePath}="", ${h.default.parentData}, ${h.default.parentDataProperty}, ${h.default.rootData}=${h.default.data}${e.dynamicRef ? (0, m._)`, ${h.default.dynamicAnchors}={}` : m.nil}}={}`;
	}
	function S(e, s) {
		e.if(h.default.valCxt, () => {
			e.var(h.default.instancePath, (0, m._)`${h.default.valCxt}.${h.default.instancePath}`), e.var(h.default.parentData, (0, m._)`${h.default.valCxt}.${h.default.parentData}`), e.var(h.default.parentDataProperty, (0, m._)`${h.default.valCxt}.${h.default.parentDataProperty}`), e.var(h.default.rootData, (0, m._)`${h.default.valCxt}.${h.default.rootData}`), s.dynamicRef && e.var(h.default.dynamicAnchors, (0, m._)`${h.default.valCxt}.${h.default.dynamicAnchors}`);
		}, () => {
			e.var(h.default.instancePath, (0, m._)`""`), e.var(h.default.parentData, (0, m._)`undefined`), e.var(h.default.parentDataProperty, (0, m._)`undefined`), e.var(h.default.rootData, h.default.data), s.dynamicRef && e.var(h.default.dynamicAnchors, (0, m._)`{}`);
		});
	}
	function C(e) {
		let { schema: s, opts: c, gen: l } = e;
		b(e, () => {
			c.$comment && s.$comment && I(e), N(e), l.let(h.default.vErrors, null), l.let(h.default.errors, 0), c.unevaluated && w(e), j(e), L(e);
		});
	}
	function w(e) {
		let { gen: s, validateName: c } = e;
		e.evaluated = s.const("evaluated", (0, m._)`${c}.evaluated`), s.if((0, m._)`${e.evaluated}.dynamicProps`, () => s.assign((0, m._)`${e.evaluated}.props`, (0, m._)`undefined`)), s.if((0, m._)`${e.evaluated}.dynamicItems`, () => s.assign((0, m._)`${e.evaluated}.items`, (0, m._)`undefined`));
	}
	function T(e, s) {
		let c = typeof e == "object" && e[s.schemaId];
		return c && (s.code.source || s.code.process) ? (0, m._)`/*# sourceURL=${c} */` : m.nil;
	}
	function E(e, c) {
		if (O(e) && (A(e), D(e))) {
			k(e, c);
			return;
		}
		(0, s.boolOrEmptySchema)(e, c);
	}
	function D({ schema: e, self: s }) {
		if (typeof e == "boolean") return !e;
		for (let c in e) if (s.RULES.all[c]) return !0;
		return !1;
	}
	function O(e) {
		return typeof e.schema != "boolean";
	}
	function k(e, s) {
		let { schema: c, gen: l, opts: u } = e;
		u.$comment && c.$comment && I(e), P(e), F(e);
		let d = l.const("_errs", h.default.errors);
		j(e, d), l.var(s, (0, m._)`${d} === ${h.default.errors}`);
	}
	function A(e) {
		(0, _.checkUnknownRules)(e), M(e);
	}
	function j(e, s) {
		if (e.opts.jtd) return z(e, [], !1, s);
		let l = (0, c.getSchemaTypes)(e.schema);
		z(e, l, !(0, c.coerceAndCheckDataType)(e, l), s);
	}
	function M(e) {
		let { schema: s, errSchemaPath: c, opts: l, self: u } = e;
		s.$ref && l.ignoreKeywordsWithRef && (0, _.schemaHasRulesButRef)(s, u.RULES) && u.logger.warn(`$ref: keywords ignored in schema at path "${c}"`);
	}
	function N(e) {
		let { schema: s, opts: c } = e;
		s.default !== void 0 && c.useDefaults && c.strictSchema && (0, _.checkStrictMode)(e, "default is ignored in the schema root");
	}
	function P(e) {
		let s = e.schema[e.opts.schemaId];
		s && (e.baseId = (0, g.resolveUrl)(e.opts.uriResolver, e.baseId, s));
	}
	function F(e) {
		if (e.schema.$async && !e.schemaEnv.$async) throw Error("async schema in sync schema");
	}
	function I({ gen: e, schemaEnv: s, schema: c, errSchemaPath: l, opts: u }) {
		let d = c.$comment;
		if (u.$comment === !0) e.code((0, m._)`${h.default.self}.logger.log(${d})`);
		else if (typeof u.$comment == "function") {
			let c = (0, m.str)`${l}/$comment`, u = e.scopeValue("root", { ref: s.root });
			e.code((0, m._)`${h.default.self}.opts.$comment(${d}, ${c}, ${u}.schema)`);
		}
	}
	function L(e) {
		let { gen: s, schemaEnv: c, validateName: l, ValidationError: u, opts: d } = e;
		c.$async ? s.if((0, m._)`${h.default.errors} === 0`, () => s.return(h.default.data), () => s.throw((0, m._)`new ${u}(${h.default.vErrors})`)) : (s.assign((0, m._)`${l}.errors`, h.default.vErrors), d.unevaluated && R(e), s.return((0, m._)`${h.default.errors} === 0`));
	}
	function R({ gen: e, evaluated: s, props: c, items: l }) {
		c instanceof m.Name && e.assign((0, m._)`${s}.props`, c), l instanceof m.Name && e.assign((0, m._)`${s}.items`, l);
	}
	function z(e, s, c, d) {
		let { gen: f, schema: p, data: g, allErrors: v, opts: y, self: b } = e, { RULES: x } = b;
		if (p.$ref && (y.ignoreKeywordsWithRef || !(0, _.schemaHasRulesButRef)(p, x))) {
			f.block(() => X(e, "$ref", x.all.$ref.definition));
			return;
		}
		y.jtd || V(e, s), f.block(() => {
			for (let e of x.rules) S(e);
			S(x.post);
		});
		function S(_) {
			(0, l.shouldUseGroup)(p, _) && (_.type ? (f.if((0, u.checkDataType)(_.type, g, y.strictNumbers)), B(e, _), s.length === 1 && s[0] === _.type && c && (f.else(), (0, u.reportTypeError)(e)), f.endIf()) : B(e, _), v || f.if((0, m._)`${h.default.errors} === ${d || 0}`));
		}
	}
	function B(e, s) {
		let { gen: c, schema: u, opts: { useDefaults: f } } = e;
		f && (0, d.assignDefaults)(e, s.type), c.block(() => {
			for (let c of s.rules) (0, l.shouldUseRule)(u, c) && X(e, c.keyword, c.definition, s.type);
		});
	}
	function V(e, s) {
		e.schemaEnv.meta || !e.opts.strictTypes || (H(e, s), e.opts.allowUnionTypes || U(e, s), W(e, e.dataTypes));
	}
	function H(e, s) {
		if (s.length) {
			if (!e.dataTypes.length) {
				e.dataTypes = s;
				return;
			}
			s.forEach((s) => {
				K(e.dataTypes, s) || J(e, `type "${s}" not allowed by context "${e.dataTypes.join(",")}"`);
			}), q(e, s);
		}
	}
	function U(e, s) {
		s.length > 1 && !(s.length === 2 && s.includes("null")) && J(e, "use allowUnionTypes to allow union type keyword");
	}
	function W(e, s) {
		let c = e.self.RULES.all;
		for (let u in c) {
			let d = c[u];
			if (typeof d == "object" && (0, l.shouldUseRule)(e.schema, d)) {
				let { type: c } = d.definition;
				c.length && !c.some((e) => G(s, e)) && J(e, `missing type "${c.join(",")}" for keyword "${u}"`);
			}
		}
	}
	function G(e, s) {
		return e.includes(s) || s === "number" && e.includes("integer");
	}
	function K(e, s) {
		return e.includes(s) || s === "integer" && e.includes("number");
	}
	function q(e, s) {
		let c = [];
		for (let l of e.dataTypes) K(s, l) ? c.push(l) : s.includes("integer") && l === "number" && c.push("integer");
		e.dataTypes = c;
	}
	function J(e, s) {
		let c = e.schemaEnv.baseId + e.errSchemaPath;
		s += ` at "${c}" (strictTypes)`, (0, _.checkStrictMode)(e, s, e.opts.strictTypes);
	}
	var Y = class {
		constructor(e, s, c) {
			if ((0, f.validateKeywordUsage)(e, s, c), this.gen = e.gen, this.allErrors = e.allErrors, this.keyword = c, this.data = e.data, this.schema = e.schema[c], this.$data = s.$data && e.opts.$data && this.schema && this.schema.$data, this.schemaValue = (0, _.schemaRefOrVal)(e, this.schema, c, this.$data), this.schemaType = s.schemaType, this.parentSchema = e.schema, this.params = {}, this.it = e, this.def = s, this.$data) this.schemaCode = e.gen.const("vSchema", $(this.$data, e));
			else if (this.schemaCode = this.schemaValue, !(0, f.validSchemaType)(this.schema, s.schemaType, s.allowUndefined)) throw Error(`${c} value must be ${JSON.stringify(s.schemaType)}`);
			("code" in s ? s.trackErrors : s.errors !== !1) && (this.errsCount = e.gen.const("_errs", h.default.errors));
		}
		result(e, s, c) {
			this.failResult((0, m.not)(e), s, c);
		}
		failResult(e, s, c) {
			this.gen.if(e), c ? c() : this.error(), s ? (this.gen.else(), s(), this.allErrors && this.gen.endIf()) : this.allErrors ? this.gen.endIf() : this.gen.else();
		}
		pass(e, s) {
			this.failResult((0, m.not)(e), void 0, s);
		}
		fail(e) {
			if (e === void 0) {
				this.error(), this.allErrors || this.gen.if(!1);
				return;
			}
			this.gen.if(e), this.error(), this.allErrors ? this.gen.endIf() : this.gen.else();
		}
		fail$data(e) {
			if (!this.$data) return this.fail(e);
			let { schemaCode: s } = this;
			this.fail((0, m._)`${s} !== undefined && (${(0, m.or)(this.invalid$data(), e)})`);
		}
		error(e, s, c) {
			if (s) {
				this.setParams(s), this._error(e, c), this.setParams({});
				return;
			}
			this._error(e, c);
		}
		_error(e, s) {
			(e ? v.reportExtraError : v.reportError)(this, this.def.error, s);
		}
		$dataError() {
			(0, v.reportError)(this, this.def.$dataError || v.keyword$DataError);
		}
		reset() {
			if (this.errsCount === void 0) throw Error("add \"trackErrors\" to keyword definition");
			(0, v.resetErrorsCount)(this.gen, this.errsCount);
		}
		ok(e) {
			this.allErrors || this.gen.if(e);
		}
		setParams(e, s) {
			s ? Object.assign(this.params, e) : this.params = e;
		}
		block$data(e, s, c = m.nil) {
			this.gen.block(() => {
				this.check$data(e, c), s();
			});
		}
		check$data(e = m.nil, s = m.nil) {
			if (!this.$data) return;
			let { gen: c, schemaCode: l, schemaType: u, def: d } = this;
			c.if((0, m.or)((0, m._)`${l} === undefined`, s)), e !== m.nil && c.assign(e, !0), (u.length || d.validateSchema) && (c.elseIf(this.invalid$data()), this.$dataError(), e !== m.nil && c.assign(e, !1)), c.else();
		}
		invalid$data() {
			let { gen: e, schemaCode: s, schemaType: c, def: l, it: d } = this;
			return (0, m.or)(f(), p());
			function f() {
				if (c.length) {
					/* istanbul ignore if */
					if (!(s instanceof m.Name)) throw Error("ajv implementation error");
					let e = Array.isArray(c) ? c : [c];
					return (0, m._)`${(0, u.checkDataTypes)(e, s, d.opts.strictNumbers, u.DataType.Wrong)}`;
				}
				return m.nil;
			}
			function p() {
				if (l.validateSchema) {
					let c = e.scopeValue("validate$data", { ref: l.validateSchema });
					return (0, m._)`!${c}(${s})`;
				}
				return m.nil;
			}
		}
		subschema(e, s) {
			let c = (0, p.getSubschema)(this.it, e);
			(0, p.extendSubschemaData)(c, this.it, e), (0, p.extendSubschemaMode)(c, e);
			let l = {
				...this.it,
				...c,
				items: void 0,
				props: void 0
			};
			return E(l, s), l;
		}
		mergeEvaluated(e, s) {
			let { it: c, gen: l } = this;
			c.opts.unevaluated && (c.props !== !0 && e.props !== void 0 && (c.props = _.mergeEvaluated.props(l, e.props, c.props, s)), c.items !== !0 && e.items !== void 0 && (c.items = _.mergeEvaluated.items(l, e.items, c.items, s)));
		}
		mergeValidEvaluated(e, s) {
			let { it: c, gen: l } = this;
			if (c.opts.unevaluated && (c.props !== !0 || c.items !== !0)) return l.if(s, () => this.mergeEvaluated(e, m.Name)), !0;
		}
	};
	e.KeywordCxt = Y;
	function X(e, s, c, l) {
		let u = new Y(e, c, s);
		"code" in c ? c.code(u, l) : u.$data && c.validate ? (0, f.funcKeywordCode)(u, c) : "macro" in c ? (0, f.macroKeywordCode)(u, c) : (c.compile || c.validate) && (0, f.funcKeywordCode)(u, c);
	}
	var Z = /^\/(?:[^~]|~0|~1)*$/, Q = /^([0-9]+)(#|\/(?:[^~]|~0|~1)*)?$/;
	function $(e, { dataLevel: s, dataNames: c, dataPathArr: l }) {
		let u, d;
		if (e === "") return h.default.rootData;
		if (e[0] === "/") {
			if (!Z.test(e)) throw Error(`Invalid JSON-pointer: ${e}`);
			u = e, d = h.default.rootData;
		} else {
			let f = Q.exec(e);
			if (!f) throw Error(`Invalid JSON-pointer: ${e}`);
			let p = +f[1];
			if (u = f[2], u === "#") {
				if (p >= s) throw Error(g("property/index", p));
				return l[s - p];
			}
			if (p > s) throw Error(g("data", p));
			if (d = c[s - p], !u) return d;
		}
		let f = d, p = u.split("/");
		for (let e of p) e && (d = (0, m._)`${d}${(0, m.getProperty)((0, _.unescapeJsonPointer)(e))}`, f = (0, m._)`${f} && ${d}`);
		return f;
		function g(e, c) {
			return `Cannot access ${e} ${c} levels up, current level is ${s}`;
		}
	}
	e.getData = $;
})), require_validation_error = /* @__PURE__ */ __commonJSMin(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.default = class extends Error {
		constructor(e) {
			super("validation failed"), this.errors = e, this.ajv = this.validation = !0;
		}
	};
})), require_ref_error = /* @__PURE__ */ __commonJSMin(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 });
	var s = require_resolve();
	e.default = class extends Error {
		constructor(e, c, l, u) {
			super(u || `can't resolve reference ${l} from id ${c}`), this.missingRef = (0, s.resolveUrl)(e, c, l), this.missingSchema = (0, s.normalizeId)((0, s.getFullPath)(e, this.missingRef));
		}
	};
})), require_compile = /* @__PURE__ */ __commonJSMin(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.resolveSchema = e.getCompilingSchema = e.resolveRef = e.compileSchema = e.SchemaEnv = void 0;
	var s = require_codegen(), c = require_validation_error(), l = require_names(), u = require_resolve(), d = require_util(), f = require_validate(), p = class {
		constructor(e) {
			this.refs = {}, this.dynamicAnchors = {};
			let s;
			typeof e.schema == "object" && (s = e.schema), this.schema = e.schema, this.schemaId = e.schemaId, this.root = e.root || this, this.baseId = e.baseId ?? (0, u.normalizeId)(s?.[e.schemaId || "$id"]), this.schemaPath = e.schemaPath, this.localRefs = e.localRefs, this.meta = e.meta, this.$async = s?.$async, this.refs = {};
		}
	};
	e.SchemaEnv = p;
	function m(e) {
		let d = _.call(this, e);
		if (d) return d;
		let p = (0, u.getFullPath)(this.opts.uriResolver, e.root.baseId), { es5: m, lines: h } = this.opts.code, { ownProperties: g } = this.opts, v = new s.CodeGen(this.scope, {
			es5: m,
			lines: h,
			ownProperties: g
		}), y;
		e.$async && (y = v.scopeValue("Error", {
			ref: c.default,
			code: (0, s._)`require("ajv/dist/runtime/validation_error").default`
		}));
		let b = v.scopeName("validate");
		e.validateName = b;
		let x = {
			gen: v,
			allErrors: this.opts.allErrors,
			data: l.default.data,
			parentData: l.default.parentData,
			parentDataProperty: l.default.parentDataProperty,
			dataNames: [l.default.data],
			dataPathArr: [s.nil],
			dataLevel: 0,
			dataTypes: [],
			definedProperties: /* @__PURE__ */ new Set(),
			topSchemaRef: v.scopeValue("schema", this.opts.code.source === !0 ? {
				ref: e.schema,
				code: (0, s.stringify)(e.schema)
			} : { ref: e.schema }),
			validateName: b,
			ValidationError: y,
			schema: e.schema,
			schemaEnv: e,
			rootId: p,
			baseId: e.baseId || p,
			schemaPath: s.nil,
			errSchemaPath: e.schemaPath || (this.opts.jtd ? "" : "#"),
			errorPath: (0, s._)`""`,
			opts: this.opts,
			self: this
		}, S;
		try {
			this._compilations.add(e), (0, f.validateFunctionCode)(x), v.optimize(this.opts.code.optimize);
			let c = v.toString();
			S = `${v.scopeRefs(l.default.scope)}return ${c}`, this.opts.code.process && (S = this.opts.code.process(S, e));
			let u = Function(`${l.default.self}`, `${l.default.scope}`, S)(this, this.scope.get());
			if (this.scope.value(b, { ref: u }), u.errors = null, u.schema = e.schema, u.schemaEnv = e, e.$async && (u.$async = !0), this.opts.code.source === !0 && (u.source = {
				validateName: b,
				validateCode: c,
				scopeValues: v._values
			}), this.opts.unevaluated) {
				let { props: e, items: c } = x;
				u.evaluated = {
					props: e instanceof s.Name ? void 0 : e,
					items: c instanceof s.Name ? void 0 : c,
					dynamicProps: e instanceof s.Name,
					dynamicItems: c instanceof s.Name
				}, u.source && (u.source.evaluated = (0, s.stringify)(u.evaluated));
			}
			return e.validate = u, e;
		} catch (s) {
			throw delete e.validate, delete e.validateName, S && this.logger.error("Error compiling schema, function code:", S), s;
		} finally {
			this._compilations.delete(e);
		}
	}
	e.compileSchema = m;
	function h(e, s, c) {
		c = (0, u.resolveUrl)(this.opts.uriResolver, s, c);
		let l = e.refs[c];
		if (l) return l;
		let d = y.call(this, e, c);
		if (d === void 0) {
			let l = e.localRefs?.[c], { schemaId: u } = this.opts;
			l && (d = new p({
				schema: l,
				schemaId: u,
				root: e,
				baseId: s
			}));
		}
		if (d !== void 0) return e.refs[c] = g.call(this, d);
	}
	e.resolveRef = h;
	function g(e) {
		return (0, u.inlineRef)(e.schema, this.opts.inlineRefs) ? e.schema : e.validate ? e : m.call(this, e);
	}
	function _(e) {
		for (let s of this._compilations) if (v(s, e)) return s;
	}
	e.getCompilingSchema = _;
	function v(e, s) {
		return e.schema === s.schema && e.root === s.root && e.baseId === s.baseId;
	}
	function y(e, s) {
		let c;
		for (; typeof (c = this.refs[s]) == "string";) s = c;
		return c || this.schemas[s] || b.call(this, e, s);
	}
	function b(e, s) {
		let c = this.opts.uriResolver.parse(s), l = (0, u._getFullPath)(this.opts.uriResolver, c), d = (0, u.getFullPath)(this.opts.uriResolver, e.baseId, void 0);
		if (Object.keys(e.schema).length > 0 && l === d) return S.call(this, c, e);
		let f = (0, u.normalizeId)(l), h = this.refs[f] || this.schemas[f];
		if (typeof h == "string") {
			let s = b.call(this, e, h);
			return typeof s?.schema == "object" ? S.call(this, c, s) : void 0;
		}
		if (typeof h?.schema == "object") {
			if (h.validate || m.call(this, h), f === (0, u.normalizeId)(s)) {
				let { schema: s } = h, { schemaId: c } = this.opts, l = s[c];
				return l && (d = (0, u.resolveUrl)(this.opts.uriResolver, d, l)), new p({
					schema: s,
					schemaId: c,
					root: e,
					baseId: d
				});
			}
			return S.call(this, c, h);
		}
	}
	e.resolveSchema = b;
	var x = new Set([
		"properties",
		"patternProperties",
		"enum",
		"dependencies",
		"definitions"
	]);
	function S(e, { baseId: s, schema: c, root: l }) {
		if (e.fragment?.[0] !== "/") return;
		for (let l of e.fragment.slice(1).split("/")) {
			if (typeof c == "boolean") return;
			let e = c[(0, d.unescapeFragment)(l)];
			if (e === void 0) return;
			c = e;
			let f = typeof c == "object" && c[this.opts.schemaId];
			!x.has(l) && f && (s = (0, u.resolveUrl)(this.opts.uriResolver, s, f));
		}
		let f;
		if (typeof c != "boolean" && c.$ref && !(0, d.schemaHasRulesButRef)(c, this.RULES)) {
			let e = (0, u.resolveUrl)(this.opts.uriResolver, s, c.$ref);
			f = b.call(this, l, e);
		}
		let { schemaId: m } = this.opts;
		if (f ||= new p({
			schema: c,
			schemaId: m,
			root: l,
			baseId: s
		}), f.schema !== f.root.schema) return f;
	}
})), data_exports = /* @__PURE__ */ __export({
	$id: () => $id$9,
	additionalProperties: () => !1,
	default: () => data_default,
	description: () => description,
	properties: () => properties$9,
	required: () => required,
	type: () => type$9
}), $id$9, description, type$9, required, properties$9, data_default, init_data = __esmMin((() => {
	$id$9 = "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#", description = "Meta-schema for $data reference (JSON AnySchema extension proposal)", type$9 = "object", required = ["$data"], properties$9 = { $data: {
		type: "string",
		anyOf: [{ format: "relative-json-pointer" }, { format: "json-pointer" }]
	} }, data_default = {
		$id: $id$9,
		description,
		type: type$9,
		required,
		properties: properties$9,
		additionalProperties: !1
	};
})), require_utils = /* @__PURE__ */ __commonJSMin(((e, s) => {
	var c = RegExp.prototype.test.bind(/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/iu), l = RegExp.prototype.test.bind(/^(?:(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]\d|\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]\d|\d)$/u);
	function u(e) {
		let s = "", c = 0, l = 0;
		for (l = 0; l < e.length; l++) if (c = e[l].charCodeAt(0), c !== 48) {
			if (!(c >= 48 && c <= 57 || c >= 65 && c <= 70 || c >= 97 && c <= 102)) return "";
			s += e[l];
			break;
		}
		for (l += 1; l < e.length; l++) {
			if (c = e[l].charCodeAt(0), !(c >= 48 && c <= 57 || c >= 65 && c <= 70 || c >= 97 && c <= 102)) return "";
			s += e[l];
		}
		return s;
	}
	var d = RegExp.prototype.test.bind(/[^!"$&'()*+,\-.;=_`a-z{}~]/u);
	function f(e) {
		return e.length = 0, !0;
	}
	function p(e, s, c) {
		if (e.length) {
			let l = u(e);
			if (l !== "") s.push(l);
			else return c.error = !0, !1;
			e.length = 0;
		}
		return !0;
	}
	function m(e) {
		let s = 0, c = {
			error: !1,
			address: "",
			zone: ""
		}, l = [], d = [], m = !1, h = !1, g = p;
		for (let u = 0; u < e.length; u++) {
			let p = e[u];
			if (!(p === "[" || p === "]")) if (p === ":") {
				if (m === !0 && (h = !0), !g(d, l, c)) break;
				if (++s > 7) {
					c.error = !0;
					break;
				}
				u > 0 && e[u - 1] === ":" && (m = !0), l.push(":");
				continue;
			} else if (p === "%") {
				if (!g(d, l, c)) break;
				g = f;
			} else {
				d.push(p);
				continue;
			}
		}
		return d.length && (g === f ? c.zone = d.join("") : h ? l.push(d.join("")) : l.push(u(d))), c.address = l.join(""), c;
	}
	function h(e) {
		if (g(e, ":") < 2) return {
			host: e,
			isIPV6: !1
		};
		let s = m(e);
		if (s.error) return {
			host: e,
			isIPV6: !1
		};
		{
			let e = s.address, c = s.address;
			return s.zone && (e += "%" + s.zone, c += "%25" + s.zone), {
				host: e,
				isIPV6: !0,
				escapedHost: c
			};
		}
	}
	function g(e, s) {
		let c = 0;
		for (let l = 0; l < e.length; l++) e[l] === s && c++;
		return c;
	}
	function _(e) {
		let s = e, c = [], l = -1, u = 0;
		for (; u = s.length;) {
			if (u === 1) {
				if (s === ".") break;
				if (s === "/") {
					c.push("/");
					break;
				} else {
					c.push(s);
					break;
				}
			} else if (u === 2) {
				if (s[0] === ".") {
					if (s[1] === ".") break;
					if (s[1] === "/") {
						s = s.slice(2);
						continue;
					}
				} else if (s[0] === "/" && (s[1] === "." || s[1] === "/")) {
					c.push("/");
					break;
				}
			} else if (u === 3 && s === "/..") {
				c.length !== 0 && c.pop(), c.push("/");
				break;
			}
			if (s[0] === ".") {
				if (s[1] === ".") {
					if (s[2] === "/") {
						s = s.slice(3);
						continue;
					}
				} else if (s[1] === "/") {
					s = s.slice(2);
					continue;
				}
			} else if (s[0] === "/" && s[1] === ".") {
				if (s[2] === "/") {
					s = s.slice(2);
					continue;
				} else if (s[2] === "." && s[3] === "/") {
					s = s.slice(3), c.length !== 0 && c.pop();
					continue;
				}
			}
			if ((l = s.indexOf("/", 1)) === -1) {
				c.push(s);
				break;
			} else c.push(s.slice(0, l)), s = s.slice(l);
		}
		return c.join("");
	}
	function v(e, s) {
		let c = s === !0 ? unescape : escape;
		return e.scheme !== void 0 && (e.scheme = c(e.scheme)), e.userinfo !== void 0 && (e.userinfo = c(e.userinfo)), e.host !== void 0 && (e.host = c(e.host)), e.path !== void 0 && (e.path = c(e.path)), e.query !== void 0 && (e.query = c(e.query)), e.fragment !== void 0 && (e.fragment = c(e.fragment)), e;
	}
	function y(e) {
		let s = [];
		if (e.userinfo !== void 0 && (s.push(e.userinfo), s.push("@")), e.host !== void 0) {
			let c = unescape(e.host);
			if (!l(c)) {
				let s = h(c);
				c = s.isIPV6 === !0 ? `[${s.escapedHost}]` : e.host;
			}
			s.push(c);
		}
		return (typeof e.port == "number" || typeof e.port == "string") && (s.push(":"), s.push(String(e.port))), s.length ? s.join("") : void 0;
	}
	s.exports = {
		nonSimpleDomain: d,
		recomposeAuthority: y,
		normalizeComponentEncoding: v,
		removeDotSegments: _,
		isIPv4: l,
		isUUID: c,
		normalizeIPv6: h,
		stringArrayToHexStripped: u
	};
})), require_schemes = /* @__PURE__ */ __commonJSMin(((e, s) => {
	var { isUUID: c } = require_utils(), l = /([\da-z][\d\-a-z]{0,31}):((?:[\w!$'()*+,\-.:;=@]|%[\da-f]{2})+)/iu, u = [
		"http",
		"https",
		"ws",
		"wss",
		"urn",
		"urn:uuid"
	];
	function d(e) {
		return u.indexOf(e) !== -1;
	}
	function f(e) {
		return e.secure === !0 ? !0 : e.secure === !1 ? !1 : e.scheme ? e.scheme.length === 3 && (e.scheme[0] === "w" || e.scheme[0] === "W") && (e.scheme[1] === "s" || e.scheme[1] === "S") && (e.scheme[2] === "s" || e.scheme[2] === "S") : !1;
	}
	function p(e) {
		return e.host || (e.error = e.error || "HTTP URIs must have a host."), e;
	}
	function m(e) {
		let s = String(e.scheme).toLowerCase() === "https";
		return (e.port === (s ? 443 : 80) || e.port === "") && (e.port = void 0), e.path ||= "/", e;
	}
	function h(e) {
		return e.secure = f(e), e.resourceName = (e.path || "/") + (e.query ? "?" + e.query : ""), e.path = void 0, e.query = void 0, e;
	}
	function g(e) {
		if ((e.port === (f(e) ? 443 : 80) || e.port === "") && (e.port = void 0), typeof e.secure == "boolean" && (e.scheme = e.secure ? "wss" : "ws", e.secure = void 0), e.resourceName) {
			let [s, c] = e.resourceName.split("?");
			e.path = s && s !== "/" ? s : void 0, e.query = c, e.resourceName = void 0;
		}
		return e.fragment = void 0, e;
	}
	function _(e, s) {
		if (!e.path) return e.error = "URN can not be parsed", e;
		let c = e.path.match(l);
		if (c) {
			let l = s.scheme || e.scheme || "urn";
			e.nid = c[1].toLowerCase(), e.nss = c[2];
			let u = O(`${l}:${s.nid || e.nid}`);
			e.path = void 0, u && (e = u.parse(e, s));
		} else e.error = e.error || "URN can not be parsed.";
		return e;
	}
	function v(e, s) {
		if (e.nid === void 0) throw Error("URN without nid cannot be serialized");
		let c = s.scheme || e.scheme || "urn", l = e.nid.toLowerCase(), u = O(`${c}:${s.nid || l}`);
		u && (e = u.serialize(e, s));
		let d = e, f = e.nss;
		return d.path = `${l || s.nid}:${f}`, s.skipEscape = !0, d;
	}
	function y(e, s) {
		let l = e;
		return l.uuid = l.nss, l.nss = void 0, !s.tolerant && (!l.uuid || !c(l.uuid)) && (l.error = l.error || "UUID is not valid."), l;
	}
	function b(e) {
		let s = e;
		return s.nss = (e.uuid || "").toLowerCase(), s;
	}
	var x = {
		scheme: "http",
		domainHost: !0,
		parse: p,
		serialize: m
	}, S = {
		scheme: "https",
		domainHost: x.domainHost,
		parse: p,
		serialize: m
	}, C = {
		scheme: "ws",
		domainHost: !0,
		parse: h,
		serialize: g
	}, w = {
		scheme: "wss",
		domainHost: C.domainHost,
		parse: C.parse,
		serialize: C.serialize
	}, T = {
		scheme: "urn",
		parse: _,
		serialize: v,
		skipNormalize: !0
	}, E = {
		scheme: "urn:uuid",
		parse: y,
		serialize: b,
		skipNormalize: !0
	}, D = {
		http: x,
		https: S,
		ws: C,
		wss: w,
		urn: T,
		"urn:uuid": E
	};
	Object.setPrototypeOf(D, null);
	function O(e) {
		return e && (D[e] || D[e.toLowerCase()]) || void 0;
	}
	s.exports = {
		wsIsSecure: f,
		SCHEMES: D,
		isValidSchemeName: d,
		getSchemeHandler: O
	};
})), require_fast_uri = /* @__PURE__ */ __commonJSMin(((e, s) => {
	var { normalizeIPv6: c, removeDotSegments: l, recomposeAuthority: u, normalizeComponentEncoding: d, isIPv4: f, nonSimpleDomain: p } = require_utils(), { SCHEMES: m, getSchemeHandler: h } = require_schemes();
	function g(e, s) {
		return typeof e == "string" ? e = b(S(e, s), s) : typeof e == "object" && (e = S(b(e, s), s)), e;
	}
	function _(e, s, c) {
		let l = c ? Object.assign({ scheme: "null" }, c) : { scheme: "null" }, u = v(S(e, l), S(s, l), l, !0);
		return l.skipEscape = !0, b(u, l);
	}
	function v(e, s, c, u) {
		let d = {};
		return u || (e = S(b(e, c), c), s = S(b(s, c), c)), c ||= {}, !c.tolerant && s.scheme ? (d.scheme = s.scheme, d.userinfo = s.userinfo, d.host = s.host, d.port = s.port, d.path = l(s.path || ""), d.query = s.query) : (s.userinfo !== void 0 || s.host !== void 0 || s.port !== void 0 ? (d.userinfo = s.userinfo, d.host = s.host, d.port = s.port, d.path = l(s.path || ""), d.query = s.query) : (s.path ? (s.path[0] === "/" ? d.path = l(s.path) : ((e.userinfo !== void 0 || e.host !== void 0 || e.port !== void 0) && !e.path ? d.path = "/" + s.path : e.path ? d.path = e.path.slice(0, e.path.lastIndexOf("/") + 1) + s.path : d.path = s.path, d.path = l(d.path)), d.query = s.query) : (d.path = e.path, s.query === void 0 ? d.query = e.query : d.query = s.query), d.userinfo = e.userinfo, d.host = e.host, d.port = e.port), d.scheme = e.scheme), d.fragment = s.fragment, d;
	}
	function y(e, s, c) {
		return typeof e == "string" ? (e = unescape(e), e = b(d(S(e, c), !0), {
			...c,
			skipEscape: !0
		})) : typeof e == "object" && (e = b(d(e, !0), {
			...c,
			skipEscape: !0
		})), typeof s == "string" ? (s = unescape(s), s = b(d(S(s, c), !0), {
			...c,
			skipEscape: !0
		})) : typeof s == "object" && (s = b(d(s, !0), {
			...c,
			skipEscape: !0
		})), e.toLowerCase() === s.toLowerCase();
	}
	function b(e, s) {
		let c = {
			host: e.host,
			scheme: e.scheme,
			userinfo: e.userinfo,
			port: e.port,
			path: e.path,
			query: e.query,
			nid: e.nid,
			nss: e.nss,
			uuid: e.uuid,
			fragment: e.fragment,
			reference: e.reference,
			resourceName: e.resourceName,
			secure: e.secure,
			error: ""
		}, d = Object.assign({}, s), f = [], p = h(d.scheme || c.scheme);
		p && p.serialize && p.serialize(c, d), c.path !== void 0 && (d.skipEscape ? c.path = unescape(c.path) : (c.path = escape(c.path), c.scheme !== void 0 && (c.path = c.path.split("%3A").join(":")))), d.reference !== "suffix" && c.scheme && f.push(c.scheme, ":");
		let m = u(c);
		if (m !== void 0 && (d.reference !== "suffix" && f.push("//"), f.push(m), c.path && c.path[0] !== "/" && f.push("/")), c.path !== void 0) {
			let e = c.path;
			!d.absolutePath && (!p || !p.absolutePath) && (e = l(e)), m === void 0 && e[0] === "/" && e[1] === "/" && (e = "/%2F" + e.slice(2)), f.push(e);
		}
		return c.query !== void 0 && f.push("?", c.query), c.fragment !== void 0 && f.push("#", c.fragment), f.join("");
	}
	var x = /^(?:([^#/:?]+):)?(?:\/\/((?:([^#/?@]*)@)?(\[[^#/?\]]+\]|[^#/:?]*)(?::(\d*))?))?([^#?]*)(?:\?([^#]*))?(?:#((?:.|[\n\r])*))?/u;
	function S(e, s) {
		let l = Object.assign({}, s), u = {
			scheme: void 0,
			userinfo: void 0,
			host: "",
			port: void 0,
			path: "",
			query: void 0,
			fragment: void 0
		}, d = !1;
		l.reference === "suffix" && (e = l.scheme ? l.scheme + ":" + e : "//" + e);
		let m = e.match(x);
		if (m) {
			if (u.scheme = m[1], u.userinfo = m[3], u.host = m[4], u.port = parseInt(m[5], 10), u.path = m[6] || "", u.query = m[7], u.fragment = m[8], isNaN(u.port) && (u.port = m[5]), u.host) if (f(u.host) === !1) {
				let e = c(u.host);
				u.host = e.host.toLowerCase(), d = e.isIPV6;
			} else d = !0;
			u.scheme === void 0 && u.userinfo === void 0 && u.host === void 0 && u.port === void 0 && u.query === void 0 && !u.path ? u.reference = "same-document" : u.scheme === void 0 ? u.reference = "relative" : u.fragment === void 0 ? u.reference = "absolute" : u.reference = "uri", l.reference && l.reference !== "suffix" && l.reference !== u.reference && (u.error = u.error || "URI is not a " + l.reference + " reference.");
			let s = h(l.scheme || u.scheme);
			if (!l.unicodeSupport && (!s || !s.unicodeSupport) && u.host && (l.domainHost || s && s.domainHost) && d === !1 && p(u.host)) try {
				u.host = URL.domainToASCII(u.host.toLowerCase());
			} catch (e) {
				u.error = u.error || "Host's domain name can not be converted to ASCII: " + e;
			}
			(!s || s && !s.skipNormalize) && (e.indexOf("%") !== -1 && (u.scheme !== void 0 && (u.scheme = unescape(u.scheme)), u.host !== void 0 && (u.host = unescape(u.host))), u.path &&= escape(unescape(u.path)), u.fragment &&= encodeURI(decodeURIComponent(u.fragment))), s && s.parse && s.parse(u, l);
		} else u.error = u.error || "URI can not be parsed.";
		return u;
	}
	var C = {
		SCHEMES: m,
		normalize: g,
		resolve: _,
		resolveComponent: v,
		equal: y,
		serialize: b,
		parse: S
	};
	s.exports = C, s.exports.default = C, s.exports.fastUri = C;
})), require_uri = /* @__PURE__ */ __commonJSMin(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 });
	var s = require_fast_uri();
	s.code = "require(\"ajv/dist/runtime/uri\").default", e.default = s;
})), require_core$1 = /* @__PURE__ */ __commonJSMin(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.CodeGen = e.Name = e.nil = e.stringify = e.str = e._ = e.KeywordCxt = void 0;
	var s = require_validate();
	Object.defineProperty(e, "KeywordCxt", {
		enumerable: !0,
		get: function() {
			return s.KeywordCxt;
		}
	});
	var c = require_codegen();
	Object.defineProperty(e, "_", {
		enumerable: !0,
		get: function() {
			return c._;
		}
	}), Object.defineProperty(e, "str", {
		enumerable: !0,
		get: function() {
			return c.str;
		}
	}), Object.defineProperty(e, "stringify", {
		enumerable: !0,
		get: function() {
			return c.stringify;
		}
	}), Object.defineProperty(e, "nil", {
		enumerable: !0,
		get: function() {
			return c.nil;
		}
	}), Object.defineProperty(e, "Name", {
		enumerable: !0,
		get: function() {
			return c.Name;
		}
	}), Object.defineProperty(e, "CodeGen", {
		enumerable: !0,
		get: function() {
			return c.CodeGen;
		}
	});
	var l = require_validation_error(), u = require_ref_error(), d = require_rules(), f = require_compile(), p = require_codegen(), m = require_resolve(), h = require_dataType(), g = require_util(), _ = (init_data(), __toCommonJS(data_exports).default), v = require_uri(), y = (e, s) => new RegExp(e, s);
	y.code = "new RegExp";
	var b = [
		"removeAdditional",
		"useDefaults",
		"coerceTypes"
	], x = new Set([
		"validate",
		"serialize",
		"parse",
		"wrapper",
		"root",
		"schema",
		"keyword",
		"pattern",
		"formats",
		"validate$data",
		"func",
		"obj",
		"Error"
	]), S = {
		errorDataPath: "",
		format: "`validateFormats: false` can be used instead.",
		nullable: "\"nullable\" keyword is supported by default.",
		jsonPointers: "Deprecated jsPropertySyntax can be used instead.",
		extendRefs: "Deprecated ignoreKeywordsWithRef can be used instead.",
		missingRefs: "Pass empty schema with $id that should be ignored to ajv.addSchema.",
		processCode: "Use option `code: {process: (code, schemaEnv: object) => string}`",
		sourceCode: "Use option `code: {source: true}`",
		strictDefaults: "It is default now, see option `strict`.",
		strictKeywords: "It is default now, see option `strict`.",
		uniqueItems: "\"uniqueItems\" keyword is always validated.",
		unknownFormats: "Disable strict mode or pass `true` to `ajv.addFormat` (or `formats` option).",
		cache: "Map is used as cache, schema object as key.",
		serialize: "Map is used as cache, schema object as key.",
		ajvErrors: "It is default now."
	}, C = {
		ignoreKeywordsWithRef: "",
		jsPropertySyntax: "",
		unicode: "\"minLength\"/\"maxLength\" account for unicode characters by default."
	}, w = 200;
	function T(e) {
		let s = e.strict, c = e.code?.optimize, l = c === !0 || c === void 0 ? 1 : c || 0, u = e.code?.regExp ?? y, d = e.uriResolver ?? v.default;
		return {
			strictSchema: e.strictSchema ?? s ?? !0,
			strictNumbers: e.strictNumbers ?? s ?? !0,
			strictTypes: e.strictTypes ?? s ?? "log",
			strictTuples: e.strictTuples ?? s ?? "log",
			strictRequired: e.strictRequired ?? s ?? !1,
			code: e.code ? {
				...e.code,
				optimize: l,
				regExp: u
			} : {
				optimize: l,
				regExp: u
			},
			loopRequired: e.loopRequired ?? w,
			loopEnum: e.loopEnum ?? w,
			meta: e.meta ?? !0,
			messages: e.messages ?? !0,
			inlineRefs: e.inlineRefs ?? !0,
			schemaId: e.schemaId ?? "$id",
			addUsedSchema: e.addUsedSchema ?? !0,
			validateSchema: e.validateSchema ?? !0,
			validateFormats: e.validateFormats ?? !0,
			unicodeRegExp: e.unicodeRegExp ?? !0,
			int32range: e.int32range ?? !0,
			uriResolver: d
		};
	}
	var E = class {
		constructor(e = {}) {
			this.schemas = {}, this.refs = {}, this.formats = {}, this._compilations = /* @__PURE__ */ new Set(), this._loading = {}, this._cache = /* @__PURE__ */ new Map(), e = this.opts = {
				...e,
				...T(e)
			};
			let { es5: s, lines: c } = this.opts.code;
			this.scope = new p.ValueScope({
				scope: {},
				prefixes: x,
				es5: s,
				lines: c
			}), this.logger = P(e.logger);
			let l = e.validateFormats;
			e.validateFormats = !1, this.RULES = (0, d.getRules)(), D.call(this, S, e, "NOT SUPPORTED"), D.call(this, C, e, "DEPRECATED", "warn"), this._metaOpts = M.call(this), e.formats && A.call(this), this._addVocabularies(), this._addDefaultMetaSchema(), e.keywords && j.call(this, e.keywords), typeof e.meta == "object" && this.addMetaSchema(e.meta), k.call(this), e.validateFormats = l;
		}
		_addVocabularies() {
			this.addKeyword("$async");
		}
		_addDefaultMetaSchema() {
			let { $data: e, meta: s, schemaId: c } = this.opts, l = _;
			c === "id" && (l = { ..._ }, l.id = l.$id, delete l.$id), s && e && this.addMetaSchema(l, l[c], !1);
		}
		defaultMeta() {
			let { meta: e, schemaId: s } = this.opts;
			return this.opts.defaultMeta = typeof e == "object" ? e[s] || e : void 0;
		}
		validate(e, s) {
			let c;
			if (typeof e == "string") {
				if (c = this.getSchema(e), !c) throw Error(`no schema with key or ref "${e}"`);
			} else c = this.compile(e);
			let l = c(s);
			return "$async" in c || (this.errors = c.errors), l;
		}
		compile(e, s) {
			let c = this._addSchema(e, s);
			return c.validate || this._compileSchemaEnv(c);
		}
		compileAsync(e, s) {
			if (typeof this.opts.loadSchema != "function") throw Error("options.loadSchema should be a function");
			let { loadSchema: c } = this.opts;
			return l.call(this, e, s);
			async function l(e, s) {
				await d.call(this, e.$schema);
				let c = this._addSchema(e, s);
				return c.validate || f.call(this, c);
			}
			async function d(e) {
				e && !this.getSchema(e) && await l.call(this, { $ref: e }, !0);
			}
			async function f(e) {
				try {
					return this._compileSchemaEnv(e);
				} catch (s) {
					if (!(s instanceof u.default)) throw s;
					return p.call(this, s), await m.call(this, s.missingSchema), f.call(this, e);
				}
			}
			function p({ missingSchema: e, missingRef: s }) {
				if (this.refs[e]) throw Error(`AnySchema ${e} is loaded but ${s} cannot be resolved`);
			}
			async function m(e) {
				let c = await h.call(this, e);
				this.refs[e] || await d.call(this, c.$schema), this.refs[e] || this.addSchema(c, e, s);
			}
			async function h(e) {
				let s = this._loading[e];
				if (s) return s;
				try {
					return await (this._loading[e] = c(e));
				} finally {
					delete this._loading[e];
				}
			}
		}
		addSchema(e, s, c, l = this.opts.validateSchema) {
			if (Array.isArray(e)) {
				for (let s of e) this.addSchema(s, void 0, c, l);
				return this;
			}
			let u;
			if (typeof e == "object") {
				let { schemaId: s } = this.opts;
				if (u = e[s], u !== void 0 && typeof u != "string") throw Error(`schema ${s} must be string`);
			}
			return s = (0, m.normalizeId)(s || u), this._checkUnique(s), this.schemas[s] = this._addSchema(e, c, s, l, !0), this;
		}
		addMetaSchema(e, s, c = this.opts.validateSchema) {
			return this.addSchema(e, s, !0, c), this;
		}
		validateSchema(e, s) {
			if (typeof e == "boolean") return !0;
			let c;
			if (c = e.$schema, c !== void 0 && typeof c != "string") throw Error("$schema must be a string");
			if (c = c || this.opts.defaultMeta || this.defaultMeta(), !c) return this.logger.warn("meta-schema not available"), this.errors = null, !0;
			let l = this.validate(c, e);
			if (!l && s) {
				let e = "schema is invalid: " + this.errorsText();
				if (this.opts.validateSchema === "log") this.logger.error(e);
				else throw Error(e);
			}
			return l;
		}
		getSchema(e) {
			let s;
			for (; typeof (s = O.call(this, e)) == "string";) e = s;
			if (s === void 0) {
				let { schemaId: c } = this.opts, l = new f.SchemaEnv({
					schema: {},
					schemaId: c
				});
				if (s = f.resolveSchema.call(this, l, e), !s) return;
				this.refs[e] = s;
			}
			return s.validate || this._compileSchemaEnv(s);
		}
		removeSchema(e) {
			if (e instanceof RegExp) return this._removeAllSchemas(this.schemas, e), this._removeAllSchemas(this.refs, e), this;
			switch (typeof e) {
				case "undefined": return this._removeAllSchemas(this.schemas), this._removeAllSchemas(this.refs), this._cache.clear(), this;
				case "string": {
					let s = O.call(this, e);
					return typeof s == "object" && this._cache.delete(s.schema), delete this.schemas[e], delete this.refs[e], this;
				}
				case "object": {
					let s = e;
					this._cache.delete(s);
					let c = e[this.opts.schemaId];
					return c && (c = (0, m.normalizeId)(c), delete this.schemas[c], delete this.refs[c]), this;
				}
				default: throw Error("ajv.removeSchema: invalid parameter");
			}
		}
		addVocabulary(e) {
			for (let s of e) this.addKeyword(s);
			return this;
		}
		addKeyword(e, s) {
			let c;
			if (typeof e == "string") c = e, typeof s == "object" && (this.logger.warn("these parameters are deprecated, see docs for addKeyword"), s.keyword = c);
			else if (typeof e == "object" && s === void 0) {
				if (s = e, c = s.keyword, Array.isArray(c) && !c.length) throw Error("addKeywords: keyword must be string or non-empty array");
			} else throw Error("invalid addKeywords parameters");
			if (I.call(this, c, s), !s) return (0, g.eachItem)(c, (e) => L.call(this, e)), this;
			B.call(this, s);
			let l = {
				...s,
				type: (0, h.getJSONTypes)(s.type),
				schemaType: (0, h.getJSONTypes)(s.schemaType)
			};
			return (0, g.eachItem)(c, l.type.length === 0 ? (e) => L.call(this, e, l) : (e) => l.type.forEach((s) => L.call(this, e, l, s))), this;
		}
		getKeyword(e) {
			let s = this.RULES.all[e];
			return typeof s == "object" ? s.definition : !!s;
		}
		removeKeyword(e) {
			let { RULES: s } = this;
			delete s.keywords[e], delete s.all[e];
			for (let c of s.rules) {
				let s = c.rules.findIndex((s) => s.keyword === e);
				s >= 0 && c.rules.splice(s, 1);
			}
			return this;
		}
		addFormat(e, s) {
			return typeof s == "string" && (s = new RegExp(s)), this.formats[e] = s, this;
		}
		errorsText(e = this.errors, { separator: s = ", ", dataVar: c = "data" } = {}) {
			return !e || e.length === 0 ? "No errors" : e.map((e) => `${c}${e.instancePath} ${e.message}`).reduce((e, c) => e + s + c);
		}
		$dataMetaSchema(e, s) {
			let c = this.RULES.all;
			e = JSON.parse(JSON.stringify(e));
			for (let l of s) {
				let s = l.split("/").slice(1), u = e;
				for (let e of s) u = u[e];
				for (let e in c) {
					let s = c[e];
					if (typeof s != "object") continue;
					let { $data: l } = s.definition, d = u[e];
					l && d && (u[e] = H(d));
				}
			}
			return e;
		}
		_removeAllSchemas(e, s) {
			for (let c in e) {
				let l = e[c];
				(!s || s.test(c)) && (typeof l == "string" ? delete e[c] : l && !l.meta && (this._cache.delete(l.schema), delete e[c]));
			}
		}
		_addSchema(e, s, c, l = this.opts.validateSchema, u = this.opts.addUsedSchema) {
			let d, { schemaId: p } = this.opts;
			if (typeof e == "object") d = e[p];
			else if (this.opts.jtd) throw Error("schema must be object");
			else if (typeof e != "boolean") throw Error("schema must be object or boolean");
			let h = this._cache.get(e);
			if (h !== void 0) return h;
			c = (0, m.normalizeId)(d || c);
			let g = m.getSchemaRefs.call(this, e, c);
			return h = new f.SchemaEnv({
				schema: e,
				schemaId: p,
				meta: s,
				baseId: c,
				localRefs: g
			}), this._cache.set(h.schema, h), u && !c.startsWith("#") && (c && this._checkUnique(c), this.refs[c] = h), l && this.validateSchema(e, !0), h;
		}
		_checkUnique(e) {
			if (this.schemas[e] || this.refs[e]) throw Error(`schema with key or id "${e}" already exists`);
		}
		_compileSchemaEnv(e) {
			/* istanbul ignore if */
			if (e.meta ? this._compileMetaSchema(e) : f.compileSchema.call(this, e), !e.validate) throw Error("ajv implementation error");
			return e.validate;
		}
		_compileMetaSchema(e) {
			let s = this.opts;
			this.opts = this._metaOpts;
			try {
				f.compileSchema.call(this, e);
			} finally {
				this.opts = s;
			}
		}
	};
	E.ValidationError = l.default, E.MissingRefError = u.default, e.default = E;
	function D(e, s, c, l = "error") {
		for (let u in e) {
			let d = u;
			d in s && this.logger[l](`${c}: option ${u}. ${e[d]}`);
		}
	}
	function O(e) {
		return e = (0, m.normalizeId)(e), this.schemas[e] || this.refs[e];
	}
	function k() {
		let e = this.opts.schemas;
		if (e) if (Array.isArray(e)) this.addSchema(e);
		else for (let s in e) this.addSchema(e[s], s);
	}
	function A() {
		for (let e in this.opts.formats) {
			let s = this.opts.formats[e];
			s && this.addFormat(e, s);
		}
	}
	function j(e) {
		if (Array.isArray(e)) {
			this.addVocabulary(e);
			return;
		}
		for (let s in this.logger.warn("keywords option as map is deprecated, pass array"), e) {
			let c = e[s];
			c.keyword ||= s, this.addKeyword(c);
		}
	}
	function M() {
		let e = { ...this.opts };
		for (let s of b) delete e[s];
		return e;
	}
	var N = {
		log() {},
		warn() {},
		error() {}
	};
	function P(e) {
		if (e === !1) return N;
		if (e === void 0) return console;
		if (e.log && e.warn && e.error) return e;
		throw Error("logger must implement log, warn and error methods");
	}
	var F = /^[a-z_$][a-z0-9_$:-]*$/i;
	function I(e, s) {
		let { RULES: c } = this;
		if ((0, g.eachItem)(e, (e) => {
			if (c.keywords[e]) throw Error(`Keyword ${e} is already defined`);
			if (!F.test(e)) throw Error(`Keyword ${e} has invalid name`);
		}), s && s.$data && !("code" in s || "validate" in s)) throw Error("$data keyword must have \"code\" or \"validate\" function");
	}
	function L(e, s, c) {
		var l;
		let u = s?.post;
		if (c && u) throw Error("keyword with \"post\" flag cannot have \"type\"");
		let { RULES: d } = this, f = u ? d.post : d.rules.find(({ type: e }) => e === c);
		if (f || (f = {
			type: c,
			rules: []
		}, d.rules.push(f)), d.keywords[e] = !0, !s) return;
		let p = {
			keyword: e,
			definition: {
				...s,
				type: (0, h.getJSONTypes)(s.type),
				schemaType: (0, h.getJSONTypes)(s.schemaType)
			}
		};
		s.before ? R.call(this, f, p, s.before) : f.rules.push(p), d.all[e] = p, (l = s.implements) == null || l.forEach((e) => this.addKeyword(e));
	}
	function R(e, s, c) {
		let l = e.rules.findIndex((e) => e.keyword === c);
		l >= 0 ? e.rules.splice(l, 0, s) : (e.rules.push(s), this.logger.warn(`rule ${c} is not defined`));
	}
	function B(e) {
		let { metaSchema: s } = e;
		s !== void 0 && (e.$data && this.opts.$data && (s = H(s)), e.validateSchema = this.compile(s, !0));
	}
	var V = { $ref: "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#" };
	function H(e) {
		return { anyOf: [e, V] };
	}
})), require_id = /* @__PURE__ */ __commonJSMin(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.default = {
		keyword: "id",
		code() {
			throw Error("NOT SUPPORTED: keyword \"id\", use \"$id\" for schema ID");
		}
	};
})), require_ref = /* @__PURE__ */ __commonJSMin(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.callRef = e.getValidate = void 0;
	var s = require_ref_error(), c = require_code(), l = require_codegen(), u = require_names(), d = require_compile(), f = require_util(), p = {
		keyword: "$ref",
		schemaType: "string",
		code(e) {
			let { gen: c, schema: u, it: f } = e, { baseId: p, schemaEnv: g, validateName: _, opts: v, self: y } = f, { root: b } = g;
			if ((u === "#" || u === "#/") && p === b.baseId) return S();
			let x = d.resolveRef.call(y, b, p, u);
			if (x === void 0) throw new s.default(f.opts.uriResolver, p, u);
			if (x instanceof d.SchemaEnv) return C(x);
			return w(x);
			function S() {
				if (g === b) return h(e, _, g, g.$async);
				let s = c.scopeValue("root", { ref: b });
				return h(e, (0, l._)`${s}.validate`, b, b.$async);
			}
			function C(s) {
				h(e, m(e, s), s, s.$async);
			}
			function w(s) {
				let d = c.scopeValue("schema", v.code.source === !0 ? {
					ref: s,
					code: (0, l.stringify)(s)
				} : { ref: s }), f = c.name("valid"), p = e.subschema({
					schema: s,
					dataTypes: [],
					schemaPath: l.nil,
					topSchemaRef: d,
					errSchemaPath: u
				}, f);
				e.mergeEvaluated(p), e.ok(f);
			}
		}
	};
	function m(e, s) {
		let { gen: c } = e;
		return s.validate ? c.scopeValue("validate", { ref: s.validate }) : (0, l._)`${c.scopeValue("wrapper", { ref: s })}.validate`;
	}
	e.getValidate = m;
	function h(e, s, d, p) {
		let { gen: m, it: h } = e, { allErrors: g, schemaEnv: _, opts: v } = h, y = v.passContext ? u.default.this : l.nil;
		p ? b() : x();
		function b() {
			if (!_.$async) throw Error("async schema referenced by sync schema");
			let u = m.let("valid");
			m.try(() => {
				m.code((0, l._)`await ${(0, c.callValidateCode)(e, s, y)}`), C(s), g || m.assign(u, !0);
			}, (e) => {
				m.if((0, l._)`!(${e} instanceof ${h.ValidationError})`, () => m.throw(e)), S(e), g || m.assign(u, !1);
			}), e.ok(u);
		}
		function x() {
			e.result((0, c.callValidateCode)(e, s, y), () => C(s), () => S(s));
		}
		function S(e) {
			let s = (0, l._)`${e}.errors`;
			m.assign(u.default.vErrors, (0, l._)`${u.default.vErrors} === null ? ${s} : ${u.default.vErrors}.concat(${s})`), m.assign(u.default.errors, (0, l._)`${u.default.vErrors}.length`);
		}
		function C(e) {
			if (!h.opts.unevaluated) return;
			let s = d?.validate?.evaluated;
			if (h.props !== !0) if (s && !s.dynamicProps) s.props !== void 0 && (h.props = f.mergeEvaluated.props(m, s.props, h.props));
			else {
				let s = m.var("props", (0, l._)`${e}.evaluated.props`);
				h.props = f.mergeEvaluated.props(m, s, h.props, l.Name);
			}
			if (h.items !== !0) if (s && !s.dynamicItems) s.items !== void 0 && (h.items = f.mergeEvaluated.items(m, s.items, h.items));
			else {
				let s = m.var("items", (0, l._)`${e}.evaluated.items`);
				h.items = f.mergeEvaluated.items(m, s, h.items, l.Name);
			}
		}
	}
	e.callRef = h, e.default = p;
})), require_core = /* @__PURE__ */ __commonJSMin(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 });
	var s = require_id(), c = require_ref();
	e.default = [
		"$schema",
		"$id",
		"$defs",
		"$vocabulary",
		{ keyword: "$comment" },
		"definitions",
		s.default,
		c.default
	];
})), require_limitNumber = /* @__PURE__ */ __commonJSMin(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 });
	var s = require_codegen(), c = s.operators, l = {
		maximum: {
			okStr: "<=",
			ok: c.LTE,
			fail: c.GT
		},
		minimum: {
			okStr: ">=",
			ok: c.GTE,
			fail: c.LT
		},
		exclusiveMaximum: {
			okStr: "<",
			ok: c.LT,
			fail: c.GTE
		},
		exclusiveMinimum: {
			okStr: ">",
			ok: c.GT,
			fail: c.LTE
		}
	};
	e.default = {
		keyword: Object.keys(l),
		type: "number",
		schemaType: "number",
		$data: !0,
		error: {
			message: ({ keyword: e, schemaCode: c }) => (0, s.str)`must be ${l[e].okStr} ${c}`,
			params: ({ keyword: e, schemaCode: c }) => (0, s._)`{comparison: ${l[e].okStr}, limit: ${c}}`
		},
		code(e) {
			let { keyword: c, data: u, schemaCode: d } = e;
			e.fail$data((0, s._)`${u} ${l[c].fail} ${d} || isNaN(${u})`);
		}
	};
})), require_multipleOf = /* @__PURE__ */ __commonJSMin(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 });
	var s = require_codegen();
	e.default = {
		keyword: "multipleOf",
		type: "number",
		schemaType: "number",
		$data: !0,
		error: {
			message: ({ schemaCode: e }) => (0, s.str)`must be multiple of ${e}`,
			params: ({ schemaCode: e }) => (0, s._)`{multipleOf: ${e}}`
		},
		code(e) {
			let { gen: c, data: l, schemaCode: u, it: d } = e, f = d.opts.multipleOfPrecision, p = c.let("res"), m = f ? (0, s._)`Math.abs(Math.round(${p}) - ${p}) > 1e-${f}` : (0, s._)`${p} !== parseInt(${p})`;
			e.fail$data((0, s._)`(${u} === 0 || (${p} = ${l}/${u}, ${m}))`);
		}
	};
})), require_ucs2length = /* @__PURE__ */ __commonJSMin(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 });
	function s(e) {
		let s = e.length, c = 0, l = 0, u;
		for (; l < s;) c++, u = e.charCodeAt(l++), u >= 55296 && u <= 56319 && l < s && (u = e.charCodeAt(l), (u & 64512) == 56320 && l++);
		return c;
	}
	e.default = s, s.code = "require(\"ajv/dist/runtime/ucs2length\").default";
})), require_limitLength = /* @__PURE__ */ __commonJSMin(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 });
	var s = require_codegen(), c = require_util(), l = require_ucs2length();
	e.default = {
		keyword: ["maxLength", "minLength"],
		type: "string",
		schemaType: "number",
		$data: !0,
		error: {
			message({ keyword: e, schemaCode: c }) {
				let l = e === "maxLength" ? "more" : "fewer";
				return (0, s.str)`must NOT have ${l} than ${c} characters`;
			},
			params: ({ schemaCode: e }) => (0, s._)`{limit: ${e}}`
		},
		code(e) {
			let { keyword: u, data: d, schemaCode: f, it: p } = e, m = u === "maxLength" ? s.operators.GT : s.operators.LT, h = p.opts.unicode === !1 ? (0, s._)`${d}.length` : (0, s._)`${(0, c.useFunc)(e.gen, l.default)}(${d})`;
			e.fail$data((0, s._)`${h} ${m} ${f}`);
		}
	};
})), require_pattern = /* @__PURE__ */ __commonJSMin(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 });
	var s = require_code(), c = require_codegen();
	e.default = {
		keyword: "pattern",
		type: "string",
		schemaType: "string",
		$data: !0,
		error: {
			message: ({ schemaCode: e }) => (0, c.str)`must match pattern "${e}"`,
			params: ({ schemaCode: e }) => (0, c._)`{pattern: ${e}}`
		},
		code(e) {
			let { data: l, $data: u, schema: d, schemaCode: f, it: p } = e, m = p.opts.unicodeRegExp ? "u" : "", h = u ? (0, c._)`(new RegExp(${f}, ${m}))` : (0, s.usePattern)(e, d);
			e.fail$data((0, c._)`!${h}.test(${l})`);
		}
	};
})), require_limitProperties = /* @__PURE__ */ __commonJSMin(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 });
	var s = require_codegen();
	e.default = {
		keyword: ["maxProperties", "minProperties"],
		type: "object",
		schemaType: "number",
		$data: !0,
		error: {
			message({ keyword: e, schemaCode: c }) {
				let l = e === "maxProperties" ? "more" : "fewer";
				return (0, s.str)`must NOT have ${l} than ${c} properties`;
			},
			params: ({ schemaCode: e }) => (0, s._)`{limit: ${e}}`
		},
		code(e) {
			let { keyword: c, data: l, schemaCode: u } = e, d = c === "maxProperties" ? s.operators.GT : s.operators.LT;
			e.fail$data((0, s._)`Object.keys(${l}).length ${d} ${u}`);
		}
	};
})), require_required = /* @__PURE__ */ __commonJSMin(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 });
	var s = require_code(), c = require_codegen(), l = require_util();
	e.default = {
		keyword: "required",
		type: "object",
		schemaType: "array",
		$data: !0,
		error: {
			message: ({ params: { missingProperty: e } }) => (0, c.str)`must have required property '${e}'`,
			params: ({ params: { missingProperty: e } }) => (0, c._)`{missingProperty: ${e}}`
		},
		code(e) {
			let { gen: u, schema: d, schemaCode: f, data: p, $data: m, it: h } = e, { opts: g } = h;
			if (!m && d.length === 0) return;
			let _ = d.length >= g.loopRequired;
			if (h.allErrors ? v() : y(), g.strictRequired) {
				let s = e.parentSchema.properties, { definedProperties: c } = e.it;
				for (let e of d) if (s?.[e] === void 0 && !c.has(e)) {
					let s = `required property "${e}" is not defined at "${h.schemaEnv.baseId + h.errSchemaPath}" (strictRequired)`;
					(0, l.checkStrictMode)(h, s, h.opts.strictRequired);
				}
			}
			function v() {
				if (_ || m) e.block$data(c.nil, b);
				else for (let c of d) (0, s.checkReportMissingProp)(e, c);
			}
			function y() {
				let c = u.let("missing");
				if (_ || m) {
					let s = u.let("valid", !0);
					e.block$data(s, () => x(c, s)), e.ok(s);
				} else u.if((0, s.checkMissingProp)(e, d, c)), (0, s.reportMissingProp)(e, c), u.else();
			}
			function b() {
				u.forOf("prop", f, (c) => {
					e.setParams({ missingProperty: c }), u.if((0, s.noPropertyInData)(u, p, c, g.ownProperties), () => e.error());
				});
			}
			function x(l, d) {
				e.setParams({ missingProperty: l }), u.forOf(l, f, () => {
					u.assign(d, (0, s.propertyInData)(u, p, l, g.ownProperties)), u.if((0, c.not)(d), () => {
						e.error(), u.break();
					});
				}, c.nil);
			}
		}
	};
})), require_limitItems = /* @__PURE__ */ __commonJSMin(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 });
	var s = require_codegen();
	e.default = {
		keyword: ["maxItems", "minItems"],
		type: "array",
		schemaType: "number",
		$data: !0,
		error: {
			message({ keyword: e, schemaCode: c }) {
				let l = e === "maxItems" ? "more" : "fewer";
				return (0, s.str)`must NOT have ${l} than ${c} items`;
			},
			params: ({ schemaCode: e }) => (0, s._)`{limit: ${e}}`
		},
		code(e) {
			let { keyword: c, data: l, schemaCode: u } = e, d = c === "maxItems" ? s.operators.GT : s.operators.LT;
			e.fail$data((0, s._)`${l}.length ${d} ${u}`);
		}
	};
})), require_equal = /* @__PURE__ */ __commonJSMin(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 });
	var s = require_fast_deep_equal();
	s.code = "require(\"ajv/dist/runtime/equal\").default", e.default = s;
})), require_uniqueItems = /* @__PURE__ */ __commonJSMin(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 });
	var s = require_dataType(), c = require_codegen(), l = require_util(), u = require_equal();
	e.default = {
		keyword: "uniqueItems",
		type: "array",
		schemaType: "boolean",
		$data: !0,
		error: {
			message: ({ params: { i: e, j: s } }) => (0, c.str)`must NOT have duplicate items (items ## ${s} and ${e} are identical)`,
			params: ({ params: { i: e, j: s } }) => (0, c._)`{i: ${e}, j: ${s}}`
		},
		code(e) {
			let { gen: d, data: f, $data: p, schema: m, parentSchema: h, schemaCode: g, it: _ } = e;
			if (!p && !m) return;
			let v = d.let("valid"), y = h.items ? (0, s.getSchemaTypes)(h.items) : [];
			e.block$data(v, b, (0, c._)`${g} === false`), e.ok(v);
			function b() {
				let s = d.let("i", (0, c._)`${f}.length`), l = d.let("j");
				e.setParams({
					i: s,
					j: l
				}), d.assign(v, !0), d.if((0, c._)`${s} > 1`, () => (x() ? S : C)(s, l));
			}
			function x() {
				return y.length > 0 && !y.some((e) => e === "object" || e === "array");
			}
			function S(l, u) {
				let p = d.name("item"), m = (0, s.checkDataTypes)(y, p, _.opts.strictNumbers, s.DataType.Wrong), h = d.const("indices", (0, c._)`{}`);
				d.for((0, c._)`;${l}--;`, () => {
					d.let(p, (0, c._)`${f}[${l}]`), d.if(m, (0, c._)`continue`), y.length > 1 && d.if((0, c._)`typeof ${p} == "string"`, (0, c._)`${p} += "_"`), d.if((0, c._)`typeof ${h}[${p}] == "number"`, () => {
						d.assign(u, (0, c._)`${h}[${p}]`), e.error(), d.assign(v, !1).break();
					}).code((0, c._)`${h}[${p}] = ${l}`);
				});
			}
			function C(s, p) {
				let m = (0, l.useFunc)(d, u.default), h = d.name("outer");
				d.label(h).for((0, c._)`;${s}--;`, () => d.for((0, c._)`${p} = ${s}; ${p}--;`, () => d.if((0, c._)`${m}(${f}[${s}], ${f}[${p}])`, () => {
					e.error(), d.assign(v, !1).break(h);
				})));
			}
		}
	};
})), require_const = /* @__PURE__ */ __commonJSMin(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 });
	var s = require_codegen(), c = require_util(), l = require_equal();
	e.default = {
		keyword: "const",
		$data: !0,
		error: {
			message: "must be equal to constant",
			params: ({ schemaCode: e }) => (0, s._)`{allowedValue: ${e}}`
		},
		code(e) {
			let { gen: u, data: d, $data: f, schemaCode: p, schema: m } = e;
			f || m && typeof m == "object" ? e.fail$data((0, s._)`!${(0, c.useFunc)(u, l.default)}(${d}, ${p})`) : e.fail((0, s._)`${m} !== ${d}`);
		}
	};
})), require_enum = /* @__PURE__ */ __commonJSMin(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 });
	var s = require_codegen(), c = require_util(), l = require_equal();
	e.default = {
		keyword: "enum",
		schemaType: "array",
		$data: !0,
		error: {
			message: "must be equal to one of the allowed values",
			params: ({ schemaCode: e }) => (0, s._)`{allowedValues: ${e}}`
		},
		code(e) {
			let { gen: u, data: d, $data: f, schema: p, schemaCode: m, it: h } = e;
			if (!f && p.length === 0) throw Error("enum must have non-empty array");
			let g = p.length >= h.opts.loopEnum, _, v = () => _ ??= (0, c.useFunc)(u, l.default), y;
			if (g || f) y = u.let("valid"), e.block$data(y, b);
			else {
				/* istanbul ignore if */
				if (!Array.isArray(p)) throw Error("ajv implementation error");
				let e = u.const("vSchema", m);
				y = (0, s.or)(...p.map((s, c) => x(e, c)));
			}
			e.pass(y);
			function b() {
				u.assign(y, !1), u.forOf("v", m, (e) => u.if((0, s._)`${v()}(${d}, ${e})`, () => u.assign(y, !0).break()));
			}
			function x(e, c) {
				let l = p[c];
				return typeof l == "object" && l ? (0, s._)`${v()}(${d}, ${e}[${c}])` : (0, s._)`${d} === ${l}`;
			}
		}
	};
})), require_validation = /* @__PURE__ */ __commonJSMin(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 });
	var s = require_limitNumber(), c = require_multipleOf(), l = require_limitLength(), u = require_pattern(), d = require_limitProperties(), f = require_required(), p = require_limitItems(), m = require_uniqueItems(), h = require_const(), g = require_enum();
	e.default = [
		s.default,
		c.default,
		l.default,
		u.default,
		d.default,
		f.default,
		p.default,
		m.default,
		{
			keyword: "type",
			schemaType: ["string", "array"]
		},
		{
			keyword: "nullable",
			schemaType: "boolean"
		},
		h.default,
		g.default
	];
})), require_additionalItems = /* @__PURE__ */ __commonJSMin(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.validateAdditionalItems = void 0;
	var s = require_codegen(), c = require_util(), l = {
		keyword: "additionalItems",
		type: "array",
		schemaType: ["boolean", "object"],
		before: "uniqueItems",
		error: {
			message: ({ params: { len: e } }) => (0, s.str)`must NOT have more than ${e} items`,
			params: ({ params: { len: e } }) => (0, s._)`{limit: ${e}}`
		},
		code(e) {
			let { parentSchema: s, it: l } = e, { items: d } = s;
			if (!Array.isArray(d)) {
				(0, c.checkStrictMode)(l, "\"additionalItems\" is ignored when \"items\" is not an array of schemas");
				return;
			}
			u(e, d);
		}
	};
	function u(e, l) {
		let { gen: u, schema: d, data: f, keyword: p, it: m } = e;
		m.items = !0;
		let h = u.const("len", (0, s._)`${f}.length`);
		if (d === !1) e.setParams({ len: l.length }), e.pass((0, s._)`${h} <= ${l.length}`);
		else if (typeof d == "object" && !(0, c.alwaysValidSchema)(m, d)) {
			let c = u.var("valid", (0, s._)`${h} <= ${l.length}`);
			u.if((0, s.not)(c), () => g(c)), e.ok(c);
		}
		function g(d) {
			u.forRange("i", l.length, h, (l) => {
				e.subschema({
					keyword: p,
					dataProp: l,
					dataPropType: c.Type.Num
				}, d), m.allErrors || u.if((0, s.not)(d), () => u.break());
			});
		}
	}
	e.validateAdditionalItems = u, e.default = l;
})), require_items = /* @__PURE__ */ __commonJSMin(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.validateTuple = void 0;
	var s = require_codegen(), c = require_util(), l = require_code(), u = {
		keyword: "items",
		type: "array",
		schemaType: [
			"object",
			"array",
			"boolean"
		],
		before: "uniqueItems",
		code(e) {
			let { schema: s, it: u } = e;
			if (Array.isArray(s)) return d(e, "additionalItems", s);
			u.items = !0, !(0, c.alwaysValidSchema)(u, s) && e.ok((0, l.validateArray)(e));
		}
	};
	function d(e, l, u = e.schema) {
		let { gen: d, parentSchema: f, data: p, keyword: m, it: h } = e;
		v(f), h.opts.unevaluated && u.length && h.items !== !0 && (h.items = c.mergeEvaluated.items(d, u.length, h.items));
		let g = d.name("valid"), _ = d.const("len", (0, s._)`${p}.length`);
		u.forEach((l, u) => {
			(0, c.alwaysValidSchema)(h, l) || (d.if((0, s._)`${_} > ${u}`, () => e.subschema({
				keyword: m,
				schemaProp: u,
				dataProp: u
			}, g)), e.ok(g));
		});
		function v(e) {
			let { opts: s, errSchemaPath: d } = h, f = u.length, p = f === e.minItems && (f === e.maxItems || e[l] === !1);
			if (s.strictTuples && !p) {
				let e = `"${m}" is ${f}-tuple, but minItems or maxItems/${l} are not specified or different at path "${d}"`;
				(0, c.checkStrictMode)(h, e, s.strictTuples);
			}
		}
	}
	e.validateTuple = d, e.default = u;
})), require_prefixItems = /* @__PURE__ */ __commonJSMin(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 });
	var s = require_items();
	e.default = {
		keyword: "prefixItems",
		type: "array",
		schemaType: ["array"],
		before: "uniqueItems",
		code: (e) => (0, s.validateTuple)(e, "items")
	};
})), require_items2020 = /* @__PURE__ */ __commonJSMin(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 });
	var s = require_codegen(), c = require_util(), l = require_code(), u = require_additionalItems();
	e.default = {
		keyword: "items",
		type: "array",
		schemaType: ["object", "boolean"],
		before: "uniqueItems",
		error: {
			message: ({ params: { len: e } }) => (0, s.str)`must NOT have more than ${e} items`,
			params: ({ params: { len: e } }) => (0, s._)`{limit: ${e}}`
		},
		code(e) {
			let { schema: s, parentSchema: d, it: f } = e, { prefixItems: p } = d;
			f.items = !0, !(0, c.alwaysValidSchema)(f, s) && (p ? (0, u.validateAdditionalItems)(e, p) : e.ok((0, l.validateArray)(e)));
		}
	};
})), require_contains = /* @__PURE__ */ __commonJSMin(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 });
	var s = require_codegen(), c = require_util();
	e.default = {
		keyword: "contains",
		type: "array",
		schemaType: ["object", "boolean"],
		before: "uniqueItems",
		trackErrors: !0,
		error: {
			message: ({ params: { min: e, max: c } }) => c === void 0 ? (0, s.str)`must contain at least ${e} valid item(s)` : (0, s.str)`must contain at least ${e} and no more than ${c} valid item(s)`,
			params: ({ params: { min: e, max: c } }) => c === void 0 ? (0, s._)`{minContains: ${e}}` : (0, s._)`{minContains: ${e}, maxContains: ${c}}`
		},
		code(e) {
			let { gen: l, schema: u, parentSchema: d, data: f, it: p } = e, m, h, { minContains: g, maxContains: _ } = d;
			p.opts.next ? (m = g === void 0 ? 1 : g, h = _) : m = 1;
			let v = l.const("len", (0, s._)`${f}.length`);
			if (e.setParams({
				min: m,
				max: h
			}), h === void 0 && m === 0) {
				(0, c.checkStrictMode)(p, "\"minContains\" == 0 without \"maxContains\": \"contains\" keyword ignored");
				return;
			}
			if (h !== void 0 && m > h) {
				(0, c.checkStrictMode)(p, "\"minContains\" > \"maxContains\" is always invalid"), e.fail();
				return;
			}
			if ((0, c.alwaysValidSchema)(p, u)) {
				let c = (0, s._)`${v} >= ${m}`;
				h !== void 0 && (c = (0, s._)`${c} && ${v} <= ${h}`), e.pass(c);
				return;
			}
			p.items = !0;
			let y = l.name("valid");
			h === void 0 && m === 1 ? x(y, () => l.if(y, () => l.break())) : m === 0 ? (l.let(y, !0), h !== void 0 && l.if((0, s._)`${f}.length > 0`, b)) : (l.let(y, !1), b()), e.result(y, () => e.reset());
			function b() {
				let e = l.name("_valid"), s = l.let("count", 0);
				x(e, () => l.if(e, () => S(s)));
			}
			function x(s, u) {
				l.forRange("i", 0, v, (l) => {
					e.subschema({
						keyword: "contains",
						dataProp: l,
						dataPropType: c.Type.Num,
						compositeRule: !0
					}, s), u();
				});
			}
			function S(e) {
				l.code((0, s._)`${e}++`), h === void 0 ? l.if((0, s._)`${e} >= ${m}`, () => l.assign(y, !0).break()) : (l.if((0, s._)`${e} > ${h}`, () => l.assign(y, !1).break()), m === 1 ? l.assign(y, !0) : l.if((0, s._)`${e} >= ${m}`, () => l.assign(y, !0)));
			}
		}
	};
})), require_dependencies = /* @__PURE__ */ __commonJSMin(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.validateSchemaDeps = e.validatePropertyDeps = e.error = void 0;
	var s = require_codegen(), c = require_util(), l = require_code();
	e.error = {
		message: ({ params: { property: e, depsCount: c, deps: l } }) => {
			let u = c === 1 ? "property" : "properties";
			return (0, s.str)`must have ${u} ${l} when property ${e} is present`;
		},
		params: ({ params: { property: e, depsCount: c, deps: l, missingProperty: u } }) => (0, s._)`{property: ${e},
    missingProperty: ${u},
    depsCount: ${c},
    deps: ${l}}`
	};
	var u = {
		keyword: "dependencies",
		type: "object",
		schemaType: "object",
		error: e.error,
		code(e) {
			let [s, c] = d(e);
			f(e, s), p(e, c);
		}
	};
	function d({ schema: e }) {
		let s = {}, c = {};
		for (let l in e) {
			if (l === "__proto__") continue;
			let u = Array.isArray(e[l]) ? s : c;
			u[l] = e[l];
		}
		return [s, c];
	}
	function f(e, c = e.schema) {
		let { gen: u, data: d, it: f } = e;
		if (Object.keys(c).length === 0) return;
		let p = u.let("missing");
		for (let m in c) {
			let h = c[m];
			if (h.length === 0) continue;
			let g = (0, l.propertyInData)(u, d, m, f.opts.ownProperties);
			e.setParams({
				property: m,
				depsCount: h.length,
				deps: h.join(", ")
			}), f.allErrors ? u.if(g, () => {
				for (let s of h) (0, l.checkReportMissingProp)(e, s);
			}) : (u.if((0, s._)`${g} && (${(0, l.checkMissingProp)(e, h, p)})`), (0, l.reportMissingProp)(e, p), u.else());
		}
	}
	e.validatePropertyDeps = f;
	function p(e, s = e.schema) {
		let { gen: u, data: d, keyword: f, it: p } = e, m = u.name("valid");
		for (let h in s) (0, c.alwaysValidSchema)(p, s[h]) || (u.if((0, l.propertyInData)(u, d, h, p.opts.ownProperties), () => {
			let s = e.subschema({
				keyword: f,
				schemaProp: h
			}, m);
			e.mergeValidEvaluated(s, m);
		}, () => u.var(m, !0)), e.ok(m));
	}
	e.validateSchemaDeps = p, e.default = u;
})), require_propertyNames = /* @__PURE__ */ __commonJSMin(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 });
	var s = require_codegen(), c = require_util();
	e.default = {
		keyword: "propertyNames",
		type: "object",
		schemaType: ["object", "boolean"],
		error: {
			message: "property name must be valid",
			params: ({ params: e }) => (0, s._)`{propertyName: ${e.propertyName}}`
		},
		code(e) {
			let { gen: l, schema: u, data: d, it: f } = e;
			if ((0, c.alwaysValidSchema)(f, u)) return;
			let p = l.name("valid");
			l.forIn("key", d, (c) => {
				e.setParams({ propertyName: c }), e.subschema({
					keyword: "propertyNames",
					data: c,
					dataTypes: ["string"],
					propertyName: c,
					compositeRule: !0
				}, p), l.if((0, s.not)(p), () => {
					e.error(!0), f.allErrors || l.break();
				});
			}), e.ok(p);
		}
	};
})), require_additionalProperties = /* @__PURE__ */ __commonJSMin(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 });
	var s = require_code(), c = require_codegen(), l = require_names(), u = require_util();
	e.default = {
		keyword: "additionalProperties",
		type: ["object"],
		schemaType: ["boolean", "object"],
		allowUndefined: !0,
		trackErrors: !0,
		error: {
			message: "must NOT have additional properties",
			params: ({ params: e }) => (0, c._)`{additionalProperty: ${e.additionalProperty}}`
		},
		code(e) {
			let { gen: d, schema: f, parentSchema: p, data: m, errsCount: h, it: g } = e;
			/* istanbul ignore if */
			if (!h) throw Error("ajv implementation error");
			let { allErrors: _, opts: v } = g;
			if (g.props = !0, v.removeAdditional !== "all" && (0, u.alwaysValidSchema)(g, f)) return;
			let y = (0, s.allSchemaProperties)(p.properties), b = (0, s.allSchemaProperties)(p.patternProperties);
			x(), e.ok((0, c._)`${h} === ${l.default.errors}`);
			function x() {
				d.forIn("key", m, (e) => {
					!y.length && !b.length ? w(e) : d.if(S(e), () => w(e));
				});
			}
			function S(l) {
				let f;
				if (y.length > 8) {
					let e = (0, u.schemaRefOrVal)(g, p.properties, "properties");
					f = (0, s.isOwnProperty)(d, e, l);
				} else f = y.length ? (0, c.or)(...y.map((e) => (0, c._)`${l} === ${e}`)) : c.nil;
				return b.length && (f = (0, c.or)(f, ...b.map((u) => (0, c._)`${(0, s.usePattern)(e, u)}.test(${l})`))), (0, c.not)(f);
			}
			function C(e) {
				d.code((0, c._)`delete ${m}[${e}]`);
			}
			function w(s) {
				if (v.removeAdditional === "all" || v.removeAdditional && f === !1) {
					C(s);
					return;
				}
				if (f === !1) {
					e.setParams({ additionalProperty: s }), e.error(), _ || d.break();
					return;
				}
				if (typeof f == "object" && !(0, u.alwaysValidSchema)(g, f)) {
					let l = d.name("valid");
					v.removeAdditional === "failing" ? (T(s, l, !1), d.if((0, c.not)(l), () => {
						e.reset(), C(s);
					})) : (T(s, l), _ || d.if((0, c.not)(l), () => d.break()));
				}
			}
			function T(s, c, l) {
				let d = {
					keyword: "additionalProperties",
					dataProp: s,
					dataPropType: u.Type.Str
				};
				l === !1 && Object.assign(d, {
					compositeRule: !0,
					createErrors: !1,
					allErrors: !1
				}), e.subschema(d, c);
			}
		}
	};
})), require_properties = /* @__PURE__ */ __commonJSMin(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 });
	var s = require_validate(), c = require_code(), l = require_util(), u = require_additionalProperties();
	e.default = {
		keyword: "properties",
		type: "object",
		schemaType: "object",
		code(e) {
			let { gen: d, schema: f, parentSchema: p, data: m, it: h } = e;
			h.opts.removeAdditional === "all" && p.additionalProperties === void 0 && u.default.code(new s.KeywordCxt(h, u.default, "additionalProperties"));
			let g = (0, c.allSchemaProperties)(f);
			for (let e of g) h.definedProperties.add(e);
			h.opts.unevaluated && g.length && h.props !== !0 && (h.props = l.mergeEvaluated.props(d, (0, l.toHash)(g), h.props));
			let _ = g.filter((e) => !(0, l.alwaysValidSchema)(h, f[e]));
			if (_.length === 0) return;
			let v = d.name("valid");
			for (let s of _) y(s) ? b(s) : (d.if((0, c.propertyInData)(d, m, s, h.opts.ownProperties)), b(s), h.allErrors || d.else().var(v, !0), d.endIf()), e.it.definedProperties.add(s), e.ok(v);
			function y(e) {
				return h.opts.useDefaults && !h.compositeRule && f[e].default !== void 0;
			}
			function b(s) {
				e.subschema({
					keyword: "properties",
					schemaProp: s,
					dataProp: s
				}, v);
			}
		}
	};
})), require_patternProperties = /* @__PURE__ */ __commonJSMin(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 });
	var s = require_code(), c = require_codegen(), l = require_util(), u = require_util();
	e.default = {
		keyword: "patternProperties",
		type: "object",
		schemaType: "object",
		code(e) {
			let { gen: d, schema: f, data: p, parentSchema: m, it: h } = e, { opts: g } = h, _ = (0, s.allSchemaProperties)(f), v = _.filter((e) => (0, l.alwaysValidSchema)(h, f[e]));
			if (_.length === 0 || v.length === _.length && (!h.opts.unevaluated || h.props === !0)) return;
			let y = g.strictSchema && !g.allowMatchingProperties && m.properties, b = d.name("valid");
			h.props !== !0 && !(h.props instanceof c.Name) && (h.props = (0, u.evaluatedPropsToName)(d, h.props));
			let { props: x } = h;
			S();
			function S() {
				for (let e of _) y && C(e), h.allErrors ? w(e) : (d.var(b, !0), w(e), d.if(b));
			}
			function C(e) {
				for (let s in y) new RegExp(e).test(s) && (0, l.checkStrictMode)(h, `property ${s} matches pattern ${e} (use allowMatchingProperties)`);
			}
			function w(l) {
				d.forIn("key", p, (f) => {
					d.if((0, c._)`${(0, s.usePattern)(e, l)}.test(${f})`, () => {
						let s = v.includes(l);
						s || e.subschema({
							keyword: "patternProperties",
							schemaProp: l,
							dataProp: f,
							dataPropType: u.Type.Str
						}, b), h.opts.unevaluated && x !== !0 ? d.assign((0, c._)`${x}[${f}]`, !0) : !s && !h.allErrors && d.if((0, c.not)(b), () => d.break());
					});
				});
			}
		}
	};
})), require_not = /* @__PURE__ */ __commonJSMin(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 });
	var s = require_util();
	e.default = {
		keyword: "not",
		schemaType: ["object", "boolean"],
		trackErrors: !0,
		code(e) {
			let { gen: c, schema: l, it: u } = e;
			if ((0, s.alwaysValidSchema)(u, l)) {
				e.fail();
				return;
			}
			let d = c.name("valid");
			e.subschema({
				keyword: "not",
				compositeRule: !0,
				createErrors: !1,
				allErrors: !1
			}, d), e.failResult(d, () => e.reset(), () => e.error());
		},
		error: { message: "must NOT be valid" }
	};
})), require_anyOf = /* @__PURE__ */ __commonJSMin(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.default = {
		keyword: "anyOf",
		schemaType: "array",
		trackErrors: !0,
		code: require_code().validateUnion,
		error: { message: "must match a schema in anyOf" }
	};
})), require_oneOf = /* @__PURE__ */ __commonJSMin(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 });
	var s = require_codegen(), c = require_util();
	e.default = {
		keyword: "oneOf",
		schemaType: "array",
		trackErrors: !0,
		error: {
			message: "must match exactly one schema in oneOf",
			params: ({ params: e }) => (0, s._)`{passingSchemas: ${e.passing}}`
		},
		code(e) {
			let { gen: l, schema: u, parentSchema: d, it: f } = e;
			/* istanbul ignore if */
			if (!Array.isArray(u)) throw Error("ajv implementation error");
			if (f.opts.discriminator && d.discriminator) return;
			let p = u, m = l.let("valid", !1), h = l.let("passing", null), g = l.name("_valid");
			e.setParams({ passing: h }), l.block(_), e.result(m, () => e.reset(), () => e.error(!0));
			function _() {
				p.forEach((u, d) => {
					let p;
					(0, c.alwaysValidSchema)(f, u) ? l.var(g, !0) : p = e.subschema({
						keyword: "oneOf",
						schemaProp: d,
						compositeRule: !0
					}, g), d > 0 && l.if((0, s._)`${g} && ${m}`).assign(m, !1).assign(h, (0, s._)`[${h}, ${d}]`).else(), l.if(g, () => {
						l.assign(m, !0), l.assign(h, d), p && e.mergeEvaluated(p, s.Name);
					});
				});
			}
		}
	};
})), require_allOf = /* @__PURE__ */ __commonJSMin(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 });
	var s = require_util();
	e.default = {
		keyword: "allOf",
		schemaType: "array",
		code(e) {
			let { gen: c, schema: l, it: u } = e;
			/* istanbul ignore if */
			if (!Array.isArray(l)) throw Error("ajv implementation error");
			let d = c.name("valid");
			l.forEach((c, l) => {
				if ((0, s.alwaysValidSchema)(u, c)) return;
				let f = e.subschema({
					keyword: "allOf",
					schemaProp: l
				}, d);
				e.ok(d), e.mergeEvaluated(f);
			});
		}
	};
})), require_if = /* @__PURE__ */ __commonJSMin(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 });
	var s = require_codegen(), c = require_util(), l = {
		keyword: "if",
		schemaType: ["object", "boolean"],
		trackErrors: !0,
		error: {
			message: ({ params: e }) => (0, s.str)`must match "${e.ifClause}" schema`,
			params: ({ params: e }) => (0, s._)`{failingKeyword: ${e.ifClause}}`
		},
		code(e) {
			let { gen: l, parentSchema: d, it: f } = e;
			d.then === void 0 && d.else === void 0 && (0, c.checkStrictMode)(f, "\"if\" without \"then\" and \"else\" is ignored");
			let p = u(f, "then"), m = u(f, "else");
			if (!p && !m) return;
			let h = l.let("valid", !0), g = l.name("_valid");
			if (_(), e.reset(), p && m) {
				let s = l.let("ifClause");
				e.setParams({ ifClause: s }), l.if(g, v("then", s), v("else", s));
			} else p ? l.if(g, v("then")) : l.if((0, s.not)(g), v("else"));
			e.pass(h, () => e.error(!0));
			function _() {
				let s = e.subschema({
					keyword: "if",
					compositeRule: !0,
					createErrors: !1,
					allErrors: !1
				}, g);
				e.mergeEvaluated(s);
			}
			function v(c, u) {
				return () => {
					let d = e.subschema({ keyword: c }, g);
					l.assign(h, g), e.mergeValidEvaluated(d, h), u ? l.assign(u, (0, s._)`${c}`) : e.setParams({ ifClause: c });
				};
			}
		}
	};
	function u(e, s) {
		let l = e.schema[s];
		return l !== void 0 && !(0, c.alwaysValidSchema)(e, l);
	}
	e.default = l;
})), require_thenElse = /* @__PURE__ */ __commonJSMin(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 });
	var s = require_util();
	e.default = {
		keyword: ["then", "else"],
		schemaType: ["object", "boolean"],
		code({ keyword: e, parentSchema: c, it: l }) {
			c.if === void 0 && (0, s.checkStrictMode)(l, `"${e}" without "if" is ignored`);
		}
	};
})), require_applicator = /* @__PURE__ */ __commonJSMin(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 });
	var s = require_additionalItems(), c = require_prefixItems(), l = require_items(), u = require_items2020(), d = require_contains(), f = require_dependencies(), p = require_propertyNames(), m = require_additionalProperties(), h = require_properties(), g = require_patternProperties(), _ = require_not(), v = require_anyOf(), y = require_oneOf(), b = require_allOf(), x = require_if(), S = require_thenElse();
	function C(e = !1) {
		let C = [
			_.default,
			v.default,
			y.default,
			b.default,
			x.default,
			S.default,
			p.default,
			m.default,
			f.default,
			h.default,
			g.default
		];
		return e ? C.push(c.default, u.default) : C.push(s.default, l.default), C.push(d.default), C;
	}
	e.default = C;
})), require_dynamicAnchor = /* @__PURE__ */ __commonJSMin(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.dynamicAnchor = void 0;
	var s = require_codegen(), c = require_names(), l = require_compile(), u = require_ref(), d = {
		keyword: "$dynamicAnchor",
		schemaType: "string",
		code: (e) => f(e, e.schema)
	};
	function f(e, l) {
		let { gen: u, it: d } = e;
		d.schemaEnv.root.dynamicAnchors[l] = !0;
		let f = (0, s._)`${c.default.dynamicAnchors}${(0, s.getProperty)(l)}`, m = d.errSchemaPath === "#" ? d.validateName : p(e);
		u.if((0, s._)`!${f}`, () => u.assign(f, m));
	}
	e.dynamicAnchor = f;
	function p(e) {
		let { schemaEnv: s, schema: c, self: d } = e.it, { root: f, baseId: p, localRefs: m, meta: h } = s.root, { schemaId: g } = d.opts, _ = new l.SchemaEnv({
			schema: c,
			schemaId: g,
			root: f,
			baseId: p,
			localRefs: m,
			meta: h
		});
		return l.compileSchema.call(d, _), (0, u.getValidate)(e, _);
	}
	e.default = d;
})), require_dynamicRef = /* @__PURE__ */ __commonJSMin(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.dynamicRef = void 0;
	var s = require_codegen(), c = require_names(), l = require_ref(), u = {
		keyword: "$dynamicRef",
		schemaType: "string",
		code: (e) => d(e, e.schema)
	};
	function d(e, u) {
		let { gen: d, keyword: f, it: p } = e;
		if (u[0] !== "#") throw Error(`"${f}" only supports hash fragment reference`);
		let m = u.slice(1);
		if (p.allErrors) h();
		else {
			let s = d.let("valid", !1);
			h(s), e.ok(s);
		}
		function h(e) {
			if (p.schemaEnv.root.dynamicAnchors[m]) {
				let l = d.let("_v", (0, s._)`${c.default.dynamicAnchors}${(0, s.getProperty)(m)}`);
				d.if(l, g(l, e), g(p.validateName, e));
			} else g(p.validateName, e)();
		}
		function g(s, c) {
			return c ? () => d.block(() => {
				(0, l.callRef)(e, s), d.let(c, !0);
			}) : () => (0, l.callRef)(e, s);
		}
	}
	e.dynamicRef = d, e.default = u;
})), require_recursiveAnchor = /* @__PURE__ */ __commonJSMin(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 });
	var s = require_dynamicAnchor(), c = require_util();
	e.default = {
		keyword: "$recursiveAnchor",
		schemaType: "boolean",
		code(e) {
			e.schema ? (0, s.dynamicAnchor)(e, "") : (0, c.checkStrictMode)(e.it, "$recursiveAnchor: false is ignored");
		}
	};
})), require_recursiveRef = /* @__PURE__ */ __commonJSMin(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 });
	var s = require_dynamicRef();
	e.default = {
		keyword: "$recursiveRef",
		schemaType: "string",
		code: (e) => (0, s.dynamicRef)(e, e.schema)
	};
})), require_dynamic = /* @__PURE__ */ __commonJSMin(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 });
	var s = require_dynamicAnchor(), c = require_dynamicRef(), l = require_recursiveAnchor(), u = require_recursiveRef();
	e.default = [
		s.default,
		c.default,
		l.default,
		u.default
	];
})), require_dependentRequired = /* @__PURE__ */ __commonJSMin(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 });
	var s = require_dependencies();
	e.default = {
		keyword: "dependentRequired",
		type: "object",
		schemaType: "object",
		error: s.error,
		code: (e) => (0, s.validatePropertyDeps)(e)
	};
})), require_dependentSchemas = /* @__PURE__ */ __commonJSMin(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 });
	var s = require_dependencies();
	e.default = {
		keyword: "dependentSchemas",
		type: "object",
		schemaType: "object",
		code: (e) => (0, s.validateSchemaDeps)(e)
	};
})), require_limitContains = /* @__PURE__ */ __commonJSMin(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 });
	var s = require_util();
	e.default = {
		keyword: ["maxContains", "minContains"],
		type: "array",
		schemaType: "number",
		code({ keyword: e, parentSchema: c, it: l }) {
			c.contains === void 0 && (0, s.checkStrictMode)(l, `"${e}" without "contains" is ignored`);
		}
	};
})), require_next = /* @__PURE__ */ __commonJSMin(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 });
	var s = require_dependentRequired(), c = require_dependentSchemas(), l = require_limitContains();
	e.default = [
		s.default,
		c.default,
		l.default
	];
})), require_unevaluatedProperties = /* @__PURE__ */ __commonJSMin(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 });
	var s = require_codegen(), c = require_util(), l = require_names();
	e.default = {
		keyword: "unevaluatedProperties",
		type: "object",
		schemaType: ["boolean", "object"],
		trackErrors: !0,
		error: {
			message: "must NOT have unevaluated properties",
			params: ({ params: e }) => (0, s._)`{unevaluatedProperty: ${e.unevaluatedProperty}}`
		},
		code(e) {
			let { gen: u, schema: d, data: f, errsCount: p, it: m } = e;
			/* istanbul ignore if */
			if (!p) throw Error("ajv implementation error");
			let { allErrors: h, props: g } = m;
			g instanceof s.Name ? u.if((0, s._)`${g} !== true`, () => u.forIn("key", f, (e) => u.if(v(g, e), () => _(e)))) : g !== !0 && u.forIn("key", f, (e) => g === void 0 ? _(e) : u.if(y(g, e), () => _(e))), m.props = !0, e.ok((0, s._)`${p} === ${l.default.errors}`);
			function _(l) {
				if (d === !1) {
					e.setParams({ unevaluatedProperty: l }), e.error(), h || u.break();
					return;
				}
				if (!(0, c.alwaysValidSchema)(m, d)) {
					let d = u.name("valid");
					e.subschema({
						keyword: "unevaluatedProperties",
						dataProp: l,
						dataPropType: c.Type.Str
					}, d), h || u.if((0, s.not)(d), () => u.break());
				}
			}
			function v(e, c) {
				return (0, s._)`!${e} || !${e}[${c}]`;
			}
			function y(e, c) {
				let l = [];
				for (let u in e) e[u] === !0 && l.push((0, s._)`${c} !== ${u}`);
				return (0, s.and)(...l);
			}
		}
	};
})), require_unevaluatedItems = /* @__PURE__ */ __commonJSMin(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 });
	var s = require_codegen(), c = require_util();
	e.default = {
		keyword: "unevaluatedItems",
		type: "array",
		schemaType: ["boolean", "object"],
		error: {
			message: ({ params: { len: e } }) => (0, s.str)`must NOT have more than ${e} items`,
			params: ({ params: { len: e } }) => (0, s._)`{limit: ${e}}`
		},
		code(e) {
			let { gen: l, schema: u, data: d, it: f } = e, p = f.items || 0;
			if (p === !0) return;
			let m = l.const("len", (0, s._)`${d}.length`);
			if (u === !1) e.setParams({ len: p }), e.fail((0, s._)`${m} > ${p}`);
			else if (typeof u == "object" && !(0, c.alwaysValidSchema)(f, u)) {
				let c = l.var("valid", (0, s._)`${m} <= ${p}`);
				l.if((0, s.not)(c), () => h(c, p)), e.ok(c);
			}
			f.items = !0;
			function h(u, d) {
				l.forRange("i", d, m, (d) => {
					e.subschema({
						keyword: "unevaluatedItems",
						dataProp: d,
						dataPropType: c.Type.Num
					}, u), f.allErrors || l.if((0, s.not)(u), () => l.break());
				});
			}
		}
	};
})), require_unevaluated = /* @__PURE__ */ __commonJSMin(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 });
	var s = require_unevaluatedProperties(), c = require_unevaluatedItems();
	e.default = [s.default, c.default];
})), require_format$1 = /* @__PURE__ */ __commonJSMin(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 });
	var s = require_codegen();
	e.default = {
		keyword: "format",
		type: ["number", "string"],
		schemaType: "string",
		$data: !0,
		error: {
			message: ({ schemaCode: e }) => (0, s.str)`must match format "${e}"`,
			params: ({ schemaCode: e }) => (0, s._)`{format: ${e}}`
		},
		code(e, c) {
			let { gen: l, data: u, $data: d, schema: f, schemaCode: p, it: m } = e, { opts: h, errSchemaPath: g, schemaEnv: _, self: v } = m;
			if (!h.validateFormats) return;
			d ? y() : b();
			function y() {
				let d = l.scopeValue("formats", {
					ref: v.formats,
					code: h.code.formats
				}), f = l.const("fDef", (0, s._)`${d}[${p}]`), m = l.let("fType"), g = l.let("format");
				l.if((0, s._)`typeof ${f} == "object" && !(${f} instanceof RegExp)`, () => l.assign(m, (0, s._)`${f}.type || "string"`).assign(g, (0, s._)`${f}.validate`), () => l.assign(m, (0, s._)`"string"`).assign(g, f)), e.fail$data((0, s.or)(y(), b()));
				function y() {
					return h.strictSchema === !1 ? s.nil : (0, s._)`${p} && !${g}`;
				}
				function b() {
					let e = _.$async ? (0, s._)`(${f}.async ? await ${g}(${u}) : ${g}(${u}))` : (0, s._)`${g}(${u})`, l = (0, s._)`(typeof ${g} == "function" ? ${e} : ${g}.test(${u}))`;
					return (0, s._)`${g} && ${g} !== true && ${m} === ${c} && !${l}`;
				}
			}
			function b() {
				let d = v.formats[f];
				if (!d) {
					b();
					return;
				}
				if (d === !0) return;
				let [p, m, y] = x(d);
				p === c && e.pass(S());
				function b() {
					if (h.strictSchema === !1) {
						v.logger.warn(e());
						return;
					}
					throw Error(e());
					function e() {
						return `unknown format "${f}" ignored in schema at path "${g}"`;
					}
				}
				function x(e) {
					let c = e instanceof RegExp ? (0, s.regexpCode)(e) : h.code.formats ? (0, s._)`${h.code.formats}${(0, s.getProperty)(f)}` : void 0, u = l.scopeValue("formats", {
						key: f,
						ref: e,
						code: c
					});
					return typeof e == "object" && !(e instanceof RegExp) ? [
						e.type || "string",
						e.validate,
						(0, s._)`${u}.validate`
					] : [
						"string",
						e,
						u
					];
				}
				function S() {
					if (typeof d == "object" && !(d instanceof RegExp) && d.async) {
						if (!_.$async) throw Error("async format in sync schema");
						return (0, s._)`await ${y}(${u})`;
					}
					return typeof m == "function" ? (0, s._)`${y}(${u})` : (0, s._)`${y}.test(${u})`;
				}
			}
		}
	};
})), require_format = /* @__PURE__ */ __commonJSMin(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.default = [require_format$1().default];
})), require_metadata = /* @__PURE__ */ __commonJSMin(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.contentVocabulary = e.metadataVocabulary = void 0, e.metadataVocabulary = [
		"title",
		"description",
		"default",
		"deprecated",
		"readOnly",
		"writeOnly",
		"examples"
	], e.contentVocabulary = [
		"contentMediaType",
		"contentEncoding",
		"contentSchema"
	];
})), require_draft2020 = /* @__PURE__ */ __commonJSMin(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 });
	var s = require_core(), c = require_validation(), l = require_applicator(), u = require_dynamic(), d = require_next(), f = require_unevaluated(), p = require_format(), m = require_metadata();
	e.default = [
		u.default,
		s.default,
		c.default,
		(0, l.default)(!0),
		p.default,
		m.metadataVocabulary,
		m.contentVocabulary,
		d.default,
		f.default
	];
})), require_types = /* @__PURE__ */ __commonJSMin(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.DiscrError = void 0;
	var s;
	(function(e) {
		e.Tag = "tag", e.Mapping = "mapping";
	})(s || (e.DiscrError = s = {}));
})), require_discriminator = /* @__PURE__ */ __commonJSMin(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 });
	var s = require_codegen(), c = require_types(), l = require_compile(), u = require_ref_error(), d = require_util();
	e.default = {
		keyword: "discriminator",
		type: "object",
		schemaType: "object",
		error: {
			message: ({ params: { discrError: e, tagName: s } }) => e === c.DiscrError.Tag ? `tag "${s}" must be string` : `value of tag "${s}" must be in oneOf`,
			params: ({ params: { discrError: e, tag: c, tagName: l } }) => (0, s._)`{error: ${e}, tag: ${l}, tagValue: ${c}}`
		},
		code(e) {
			let { gen: f, data: p, schema: m, parentSchema: h, it: g } = e, { oneOf: _ } = h;
			if (!g.opts.discriminator) throw Error("discriminator: requires discriminator option");
			let v = m.propertyName;
			if (typeof v != "string") throw Error("discriminator: requires propertyName");
			if (m.mapping) throw Error("discriminator: mapping is not supported");
			if (!_) throw Error("discriminator: requires oneOf keyword");
			let y = f.let("valid", !1), b = f.const("tag", (0, s._)`${p}${(0, s.getProperty)(v)}`);
			f.if((0, s._)`typeof ${b} == "string"`, () => x(), () => e.error(!1, {
				discrError: c.DiscrError.Tag,
				tag: b,
				tagName: v
			})), e.ok(y);
			function x() {
				let l = C();
				for (let e in f.if(!1), l) f.elseIf((0, s._)`${b} === ${e}`), f.assign(y, S(l[e]));
				f.else(), e.error(!1, {
					discrError: c.DiscrError.Mapping,
					tag: b,
					tagName: v
				}), f.endIf();
			}
			function S(c) {
				let l = f.name("valid"), u = e.subschema({
					keyword: "oneOf",
					schemaProp: c
				}, l);
				return e.mergeEvaluated(u, s.Name), l;
			}
			function C() {
				let e = {}, s = f(h), c = !0;
				for (let e = 0; e < _.length; e++) {
					let m = _[e];
					if (m?.$ref && !(0, d.schemaHasRulesButRef)(m, g.self.RULES)) {
						let e = m.$ref;
						if (m = l.resolveRef.call(g.self, g.schemaEnv.root, g.baseId, e), m instanceof l.SchemaEnv && (m = m.schema), m === void 0) throw new u.default(g.opts.uriResolver, g.baseId, e);
					}
					let h = m?.properties?.[v];
					if (typeof h != "object") throw Error(`discriminator: oneOf subschemas (or referenced schemas) must have "properties/${v}"`);
					c &&= s || f(m), p(h, e);
				}
				if (!c) throw Error(`discriminator: "${v}" must be required`);
				return e;
				function f({ required: e }) {
					return Array.isArray(e) && e.includes(v);
				}
				function p(e, s) {
					if (e.const) m(e.const, s);
					else if (e.enum) for (let c of e.enum) m(c, s);
					else throw Error(`discriminator: "properties/${v}" must have "const" or "enum"`);
				}
				function m(s, c) {
					if (typeof s != "string" || s in e) throw Error(`discriminator: "${v}" values must be unique strings`);
					e[s] = c;
				}
			}
		}
	};
})), schema_exports = /* @__PURE__ */ __export({
	$comment: () => $comment,
	$dynamicAnchor: () => $dynamicAnchor$7,
	$id: () => $id$8,
	$schema: () => $schema$8,
	$vocabulary: () => $vocabulary$7,
	allOf: () => allOf,
	default: () => schema_default,
	properties: () => properties$8,
	title: () => title$8,
	type: () => type$8
}), $schema$8, $id$8, $vocabulary$7, $dynamicAnchor$7, title$8, allOf, type$8, $comment, properties$8, schema_default, init_schema = __esmMin((() => {
	$schema$8 = "https://json-schema.org/draft/2020-12/schema", $id$8 = "https://json-schema.org/draft/2020-12/schema", $vocabulary$7 = {
		"https://json-schema.org/draft/2020-12/vocab/core": !0,
		"https://json-schema.org/draft/2020-12/vocab/applicator": !0,
		"https://json-schema.org/draft/2020-12/vocab/unevaluated": !0,
		"https://json-schema.org/draft/2020-12/vocab/validation": !0,
		"https://json-schema.org/draft/2020-12/vocab/meta-data": !0,
		"https://json-schema.org/draft/2020-12/vocab/format-annotation": !0,
		"https://json-schema.org/draft/2020-12/vocab/content": !0
	}, $dynamicAnchor$7 = "meta", title$8 = "Core and Validation specifications meta-schema", allOf = [
		{ $ref: "meta/core" },
		{ $ref: "meta/applicator" },
		{ $ref: "meta/unevaluated" },
		{ $ref: "meta/validation" },
		{ $ref: "meta/meta-data" },
		{ $ref: "meta/format-annotation" },
		{ $ref: "meta/content" }
	], type$8 = ["object", "boolean"], $comment = "This meta-schema also defines keywords that have appeared in previous drafts in order to prevent incompatible extensions as they remain in common use.", properties$8 = {
		definitions: {
			$comment: "\"definitions\" has been replaced by \"$defs\".",
			type: "object",
			additionalProperties: { $dynamicRef: "#meta" },
			deprecated: !0,
			default: {}
		},
		dependencies: {
			$comment: "\"dependencies\" has been split and replaced by \"dependentSchemas\" and \"dependentRequired\" in order to serve their differing semantics.",
			type: "object",
			additionalProperties: { anyOf: [{ $dynamicRef: "#meta" }, { $ref: "meta/validation#/$defs/stringArray" }] },
			deprecated: !0,
			default: {}
		},
		$recursiveAnchor: {
			$comment: "\"$recursiveAnchor\" has been replaced by \"$dynamicAnchor\".",
			$ref: "meta/core#/$defs/anchorString",
			deprecated: !0
		},
		$recursiveRef: {
			$comment: "\"$recursiveRef\" has been replaced by \"$dynamicRef\".",
			$ref: "meta/core#/$defs/uriReferenceString",
			deprecated: !0
		}
	}, schema_default = {
		$schema: $schema$8,
		$id: $id$8,
		$vocabulary: $vocabulary$7,
		$dynamicAnchor: $dynamicAnchor$7,
		title: title$8,
		allOf,
		type: type$8,
		$comment,
		properties: properties$8
	};
})), applicator_exports = /* @__PURE__ */ __export({
	$defs: () => $defs$2,
	$dynamicAnchor: () => $dynamicAnchor$6,
	$id: () => $id$7,
	$schema: () => $schema$7,
	$vocabulary: () => $vocabulary$6,
	default: () => applicator_default,
	properties: () => properties$7,
	title: () => title$7,
	type: () => type$7
}), $schema$7, $id$7, $vocabulary$6, $dynamicAnchor$6, title$7, type$7, properties$7, $defs$2, applicator_default, init_applicator = __esmMin((() => {
	$schema$7 = "https://json-schema.org/draft/2020-12/schema", $id$7 = "https://json-schema.org/draft/2020-12/meta/applicator", $vocabulary$6 = { "https://json-schema.org/draft/2020-12/vocab/applicator": !0 }, $dynamicAnchor$6 = "meta", title$7 = "Applicator vocabulary meta-schema", type$7 = ["object", "boolean"], properties$7 = {
		prefixItems: { $ref: "#/$defs/schemaArray" },
		items: { $dynamicRef: "#meta" },
		contains: { $dynamicRef: "#meta" },
		additionalProperties: { $dynamicRef: "#meta" },
		properties: {
			type: "object",
			additionalProperties: { $dynamicRef: "#meta" },
			default: {}
		},
		patternProperties: {
			type: "object",
			additionalProperties: { $dynamicRef: "#meta" },
			propertyNames: { format: "regex" },
			default: {}
		},
		dependentSchemas: {
			type: "object",
			additionalProperties: { $dynamicRef: "#meta" },
			default: {}
		},
		propertyNames: { $dynamicRef: "#meta" },
		if: { $dynamicRef: "#meta" },
		then: { $dynamicRef: "#meta" },
		else: { $dynamicRef: "#meta" },
		allOf: { $ref: "#/$defs/schemaArray" },
		anyOf: { $ref: "#/$defs/schemaArray" },
		oneOf: { $ref: "#/$defs/schemaArray" },
		not: { $dynamicRef: "#meta" }
	}, $defs$2 = { schemaArray: {
		type: "array",
		minItems: 1,
		items: { $dynamicRef: "#meta" }
	} }, applicator_default = {
		$schema: $schema$7,
		$id: $id$7,
		$vocabulary: $vocabulary$6,
		$dynamicAnchor: $dynamicAnchor$6,
		title: title$7,
		type: type$7,
		properties: properties$7,
		$defs: $defs$2
	};
})), unevaluated_exports = /* @__PURE__ */ __export({
	$dynamicAnchor: () => $dynamicAnchor$5,
	$id: () => $id$6,
	$schema: () => $schema$6,
	$vocabulary: () => $vocabulary$5,
	default: () => unevaluated_default,
	properties: () => properties$6,
	title: () => title$6,
	type: () => type$6
}), $schema$6, $id$6, $vocabulary$5, $dynamicAnchor$5, title$6, type$6, properties$6, unevaluated_default, init_unevaluated = __esmMin((() => {
	$schema$6 = "https://json-schema.org/draft/2020-12/schema", $id$6 = "https://json-schema.org/draft/2020-12/meta/unevaluated", $vocabulary$5 = { "https://json-schema.org/draft/2020-12/vocab/unevaluated": !0 }, $dynamicAnchor$5 = "meta", title$6 = "Unevaluated applicator vocabulary meta-schema", type$6 = ["object", "boolean"], properties$6 = {
		unevaluatedItems: { $dynamicRef: "#meta" },
		unevaluatedProperties: { $dynamicRef: "#meta" }
	}, unevaluated_default = {
		$schema: $schema$6,
		$id: $id$6,
		$vocabulary: $vocabulary$5,
		$dynamicAnchor: $dynamicAnchor$5,
		title: title$6,
		type: type$6,
		properties: properties$6
	};
})), content_exports = /* @__PURE__ */ __export({
	$dynamicAnchor: () => $dynamicAnchor$4,
	$id: () => $id$5,
	$schema: () => $schema$5,
	$vocabulary: () => $vocabulary$4,
	default: () => content_default,
	properties: () => properties$5,
	title: () => title$5,
	type: () => type$5
}), $schema$5, $id$5, $vocabulary$4, $dynamicAnchor$4, title$5, type$5, properties$5, content_default, init_content = __esmMin((() => {
	$schema$5 = "https://json-schema.org/draft/2020-12/schema", $id$5 = "https://json-schema.org/draft/2020-12/meta/content", $vocabulary$4 = { "https://json-schema.org/draft/2020-12/vocab/content": !0 }, $dynamicAnchor$4 = "meta", title$5 = "Content vocabulary meta-schema", type$5 = ["object", "boolean"], properties$5 = {
		contentEncoding: { type: "string" },
		contentMediaType: { type: "string" },
		contentSchema: { $dynamicRef: "#meta" }
	}, content_default = {
		$schema: $schema$5,
		$id: $id$5,
		$vocabulary: $vocabulary$4,
		$dynamicAnchor: $dynamicAnchor$4,
		title: title$5,
		type: type$5,
		properties: properties$5
	};
})), core_exports = /* @__PURE__ */ __export({
	$defs: () => $defs$1,
	$dynamicAnchor: () => $dynamicAnchor$3,
	$id: () => $id$4,
	$schema: () => $schema$4,
	$vocabulary: () => $vocabulary$3,
	default: () => core_default,
	properties: () => properties$4,
	title: () => title$4,
	type: () => type$4
}), $schema$4, $id$4, $vocabulary$3, $dynamicAnchor$3, title$4, type$4, properties$4, $defs$1, core_default, init_core = __esmMin((() => {
	$schema$4 = "https://json-schema.org/draft/2020-12/schema", $id$4 = "https://json-schema.org/draft/2020-12/meta/core", $vocabulary$3 = { "https://json-schema.org/draft/2020-12/vocab/core": !0 }, $dynamicAnchor$3 = "meta", title$4 = "Core vocabulary meta-schema", type$4 = ["object", "boolean"], properties$4 = {
		$id: {
			$ref: "#/$defs/uriReferenceString",
			$comment: "Non-empty fragments not allowed.",
			pattern: "^[^#]*#?$"
		},
		$schema: { $ref: "#/$defs/uriString" },
		$ref: { $ref: "#/$defs/uriReferenceString" },
		$anchor: { $ref: "#/$defs/anchorString" },
		$dynamicRef: { $ref: "#/$defs/uriReferenceString" },
		$dynamicAnchor: { $ref: "#/$defs/anchorString" },
		$vocabulary: {
			type: "object",
			propertyNames: { $ref: "#/$defs/uriString" },
			additionalProperties: { type: "boolean" }
		},
		$comment: { type: "string" },
		$defs: {
			type: "object",
			additionalProperties: { $dynamicRef: "#meta" }
		}
	}, $defs$1 = {
		anchorString: {
			type: "string",
			pattern: "^[A-Za-z_][-A-Za-z0-9._]*$"
		},
		uriString: {
			type: "string",
			format: "uri"
		},
		uriReferenceString: {
			type: "string",
			format: "uri-reference"
		}
	}, core_default = {
		$schema: $schema$4,
		$id: $id$4,
		$vocabulary: $vocabulary$3,
		$dynamicAnchor: $dynamicAnchor$3,
		title: title$4,
		type: type$4,
		properties: properties$4,
		$defs: $defs$1
	};
})), format_annotation_exports = /* @__PURE__ */ __export({
	$dynamicAnchor: () => $dynamicAnchor$2,
	$id: () => $id$3,
	$schema: () => $schema$3,
	$vocabulary: () => $vocabulary$2,
	default: () => format_annotation_default,
	properties: () => properties$3,
	title: () => title$3,
	type: () => type$3
}), $schema$3, $id$3, $vocabulary$2, $dynamicAnchor$2, title$3, type$3, properties$3, format_annotation_default, init_format_annotation = __esmMin((() => {
	$schema$3 = "https://json-schema.org/draft/2020-12/schema", $id$3 = "https://json-schema.org/draft/2020-12/meta/format-annotation", $vocabulary$2 = { "https://json-schema.org/draft/2020-12/vocab/format-annotation": !0 }, $dynamicAnchor$2 = "meta", title$3 = "Format vocabulary meta-schema for annotation results", type$3 = ["object", "boolean"], properties$3 = { format: { type: "string" } }, format_annotation_default = {
		$schema: $schema$3,
		$id: $id$3,
		$vocabulary: $vocabulary$2,
		$dynamicAnchor: $dynamicAnchor$2,
		title: title$3,
		type: type$3,
		properties: properties$3
	};
})), meta_data_exports = /* @__PURE__ */ __export({
	$dynamicAnchor: () => $dynamicAnchor$1,
	$id: () => $id$2,
	$schema: () => $schema$2,
	$vocabulary: () => $vocabulary$1,
	default: () => meta_data_default,
	properties: () => properties$2,
	title: () => title$2,
	type: () => type$2
}), $schema$2, $id$2, $vocabulary$1, $dynamicAnchor$1, title$2, type$2, properties$2, meta_data_default, init_meta_data = __esmMin((() => {
	$schema$2 = "https://json-schema.org/draft/2020-12/schema", $id$2 = "https://json-schema.org/draft/2020-12/meta/meta-data", $vocabulary$1 = { "https://json-schema.org/draft/2020-12/vocab/meta-data": !0 }, $dynamicAnchor$1 = "meta", title$2 = "Meta-data vocabulary meta-schema", type$2 = ["object", "boolean"], properties$2 = {
		title: { type: "string" },
		description: { type: "string" },
		default: !0,
		deprecated: {
			type: "boolean",
			default: !1
		},
		readOnly: {
			type: "boolean",
			default: !1
		},
		writeOnly: {
			type: "boolean",
			default: !1
		},
		examples: {
			type: "array",
			items: !0
		}
	}, meta_data_default = {
		$schema: $schema$2,
		$id: $id$2,
		$vocabulary: $vocabulary$1,
		$dynamicAnchor: $dynamicAnchor$1,
		title: title$2,
		type: type$2,
		properties: properties$2
	};
})), validation_exports = /* @__PURE__ */ __export({
	$defs: () => $defs,
	$dynamicAnchor: () => $dynamicAnchor,
	$id: () => $id$1,
	$schema: () => $schema$1,
	$vocabulary: () => $vocabulary,
	default: () => validation_default,
	properties: () => properties$1,
	title: () => title$1,
	type: () => type$1
}), $schema$1, $id$1, $vocabulary, $dynamicAnchor, title$1, type$1, properties$1, $defs, validation_default, init_validation = __esmMin((() => {
	$schema$1 = "https://json-schema.org/draft/2020-12/schema", $id$1 = "https://json-schema.org/draft/2020-12/meta/validation", $vocabulary = { "https://json-schema.org/draft/2020-12/vocab/validation": !0 }, $dynamicAnchor = "meta", title$1 = "Validation vocabulary meta-schema", type$1 = ["object", "boolean"], properties$1 = {
		type: { anyOf: [{ $ref: "#/$defs/simpleTypes" }, {
			type: "array",
			items: { $ref: "#/$defs/simpleTypes" },
			minItems: 1,
			uniqueItems: !0
		}] },
		const: !0,
		enum: {
			type: "array",
			items: !0
		},
		multipleOf: {
			type: "number",
			exclusiveMinimum: 0
		},
		maximum: { type: "number" },
		exclusiveMaximum: { type: "number" },
		minimum: { type: "number" },
		exclusiveMinimum: { type: "number" },
		maxLength: { $ref: "#/$defs/nonNegativeInteger" },
		minLength: { $ref: "#/$defs/nonNegativeIntegerDefault0" },
		pattern: {
			type: "string",
			format: "regex"
		},
		maxItems: { $ref: "#/$defs/nonNegativeInteger" },
		minItems: { $ref: "#/$defs/nonNegativeIntegerDefault0" },
		uniqueItems: {
			type: "boolean",
			default: !1
		},
		maxContains: { $ref: "#/$defs/nonNegativeInteger" },
		minContains: {
			$ref: "#/$defs/nonNegativeInteger",
			default: 1
		},
		maxProperties: { $ref: "#/$defs/nonNegativeInteger" },
		minProperties: { $ref: "#/$defs/nonNegativeIntegerDefault0" },
		required: { $ref: "#/$defs/stringArray" },
		dependentRequired: {
			type: "object",
			additionalProperties: { $ref: "#/$defs/stringArray" }
		}
	}, $defs = {
		nonNegativeInteger: {
			type: "integer",
			minimum: 0
		},
		nonNegativeIntegerDefault0: {
			$ref: "#/$defs/nonNegativeInteger",
			default: 0
		},
		simpleTypes: { enum: [
			"array",
			"boolean",
			"integer",
			"null",
			"number",
			"object",
			"string"
		] },
		stringArray: {
			type: "array",
			items: { type: "string" },
			uniqueItems: !0,
			default: []
		}
	}, validation_default = {
		$schema: $schema$1,
		$id: $id$1,
		$vocabulary,
		$dynamicAnchor,
		title: title$1,
		type: type$1,
		properties: properties$1,
		$defs
	};
})), require_json_schema_2020_12 = /* @__PURE__ */ __commonJSMin(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 });
	var s = (init_schema(), __toCommonJS(schema_exports).default), c = (init_applicator(), __toCommonJS(applicator_exports).default), l = (init_unevaluated(), __toCommonJS(unevaluated_exports).default), u = (init_content(), __toCommonJS(content_exports).default), d = (init_core(), __toCommonJS(core_exports).default), f = (init_format_annotation(), __toCommonJS(format_annotation_exports).default), p = (init_meta_data(), __toCommonJS(meta_data_exports).default), m = (init_validation(), __toCommonJS(validation_exports).default), h = ["/properties"];
	function g(e) {
		return [
			s,
			c,
			l,
			u,
			d,
			g(this, f),
			p,
			g(this, m)
		].forEach((e) => this.addMetaSchema(e, void 0, !1)), this;
		function g(s, c) {
			return e ? s.$dataMetaSchema(c, h) : c;
		}
	}
	e.default = g;
})), require__2020 = /* @__PURE__ */ __commonJSMin(((e, s) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.MissingRefError = e.ValidationError = e.CodeGen = e.Name = e.nil = e.stringify = e.str = e._ = e.KeywordCxt = e.Ajv2020 = void 0;
	var c = require_core$1(), l = require_draft2020(), u = require_discriminator(), d = require_json_schema_2020_12(), f = "https://json-schema.org/draft/2020-12/schema", p = class extends c.default {
		constructor(e = {}) {
			super({
				...e,
				dynamicRef: !0,
				next: !0,
				unevaluated: !0
			});
		}
		_addVocabularies() {
			super._addVocabularies(), l.default.forEach((e) => this.addVocabulary(e)), this.opts.discriminator && this.addKeyword(u.default);
		}
		_addDefaultMetaSchema() {
			super._addDefaultMetaSchema();
			let { $data: e, meta: s } = this.opts;
			s && (d.default.call(this, e), this.refs["http://json-schema.org/schema"] = f);
		}
		defaultMeta() {
			return this.opts.defaultMeta = super.defaultMeta() || (this.getSchema(f) ? f : void 0);
		}
	};
	e.Ajv2020 = p, s.exports = e = p, s.exports.Ajv2020 = p, Object.defineProperty(e, "__esModule", { value: !0 }), e.default = p;
	var m = require_validate();
	Object.defineProperty(e, "KeywordCxt", {
		enumerable: !0,
		get: function() {
			return m.KeywordCxt;
		}
	});
	var h = require_codegen();
	Object.defineProperty(e, "_", {
		enumerable: !0,
		get: function() {
			return h._;
		}
	}), Object.defineProperty(e, "str", {
		enumerable: !0,
		get: function() {
			return h.str;
		}
	}), Object.defineProperty(e, "stringify", {
		enumerable: !0,
		get: function() {
			return h.stringify;
		}
	}), Object.defineProperty(e, "nil", {
		enumerable: !0,
		get: function() {
			return h.nil;
		}
	}), Object.defineProperty(e, "Name", {
		enumerable: !0,
		get: function() {
			return h.Name;
		}
	}), Object.defineProperty(e, "CodeGen", {
		enumerable: !0,
		get: function() {
			return h.CodeGen;
		}
	});
	var g = require_validation_error();
	Object.defineProperty(e, "ValidationError", {
		enumerable: !0,
		get: function() {
			return g.default;
		}
	});
	var _ = require_ref_error();
	Object.defineProperty(e, "MissingRefError", {
		enumerable: !0,
		get: function() {
			return _.default;
		}
	});
})), require_formats = /* @__PURE__ */ __commonJSMin(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.formatNames = e.fastFormats = e.fullFormats = void 0;
	function s(e, s) {
		return {
			validate: e,
			compare: s
		};
	}
	e.fullFormats = {
		date: s(d, f),
		time: s(m(!0), h),
		"date-time": s(v(!0), y),
		"iso-time": s(m(), g),
		"iso-date-time": s(v(), b),
		duration: /^P(?!$)((\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+S)?)?|(\d+W)?)$/,
		uri: C,
		"uri-reference": /^(?:[a-z][a-z0-9+\-.]*:)?(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'"()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?(?:\?(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i,
		"uri-template": /^(?:(?:[^\x00-\x20"'<>%\\^`{|}]|%[0-9a-f]{2})|\{[+#./;?&=,!@|]?(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?(?:,(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?)*\})*$/i,
		url: /^(?:https?|ftp):\/\/(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u{00a1}-\u{ffff}]+-)*[a-z0-9\u{00a1}-\u{ffff}]+)(?:\.(?:[a-z0-9\u{00a1}-\u{ffff}]+-)*[a-z0-9\u{00a1}-\u{ffff}]+)*(?:\.(?:[a-z\u{00a1}-\u{ffff}]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/iu,
		email: /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i,
		hostname: /^(?=.{1,253}\.?$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[-0-9a-z]{0,61}[0-9a-z])?)*\.?$/i,
		ipv4: /^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/,
		ipv6: /^((([0-9a-f]{1,4}:){7}([0-9a-f]{1,4}|:))|(([0-9a-f]{1,4}:){6}(:[0-9a-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){5}(((:[0-9a-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){4}(((:[0-9a-f]{1,4}){1,3})|((:[0-9a-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){3}(((:[0-9a-f]{1,4}){1,4})|((:[0-9a-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){2}(((:[0-9a-f]{1,4}){1,5})|((:[0-9a-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){1}(((:[0-9a-f]{1,4}){1,6})|((:[0-9a-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9a-f]{1,4}){1,7})|((:[0-9a-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))$/i,
		regex: M,
		uuid: /^(?:urn:uuid:)?[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i,
		"json-pointer": /^(?:\/(?:[^~/]|~0|~1)*)*$/,
		"json-pointer-uri-fragment": /^#(?:\/(?:[a-z0-9_\-.!$&'()*+,;:=@]|%[0-9a-f]{2}|~0|~1)*)*$/i,
		"relative-json-pointer": /^(?:0|[1-9][0-9]*)(?:#|(?:\/(?:[^~/]|~0|~1)*)*)$/,
		byte: T,
		int32: {
			type: "number",
			validate: O
		},
		int64: {
			type: "number",
			validate: k
		},
		float: {
			type: "number",
			validate: A
		},
		double: {
			type: "number",
			validate: A
		},
		password: !0,
		binary: !0
	}, e.fastFormats = {
		...e.fullFormats,
		date: s(/^\d\d\d\d-[0-1]\d-[0-3]\d$/, f),
		time: s(/^(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)$/i, h),
		"date-time": s(/^\d\d\d\d-[0-1]\d-[0-3]\dt(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)$/i, y),
		"iso-time": s(/^(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)?$/i, g),
		"iso-date-time": s(/^\d\d\d\d-[0-1]\d-[0-3]\d[t\s](?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)?$/i, b),
		uri: /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/)?[^\s]*$/i,
		"uri-reference": /^(?:(?:[a-z][a-z0-9+\-.]*:)?\/?\/)?(?:[^\\\s#][^\s#]*)?(?:#[^\\\s]*)?$/i,
		email: /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/i
	}, e.formatNames = Object.keys(e.fullFormats);
	function c(e) {
		return e % 4 == 0 && (e % 100 != 0 || e % 400 == 0);
	}
	var l = /^(\d\d\d\d)-(\d\d)-(\d\d)$/, u = [
		0,
		31,
		28,
		31,
		30,
		31,
		30,
		31,
		31,
		30,
		31,
		30,
		31
	];
	function d(e) {
		let s = l.exec(e);
		if (!s) return !1;
		let d = +s[1], f = +s[2], p = +s[3];
		return f >= 1 && f <= 12 && p >= 1 && p <= (f === 2 && c(d) ? 29 : u[f]);
	}
	function f(e, s) {
		if (e && s) return e > s ? 1 : e < s ? -1 : 0;
	}
	var p = /^(\d\d):(\d\d):(\d\d(?:\.\d+)?)(z|([+-])(\d\d)(?::?(\d\d))?)?$/i;
	function m(e) {
		return function(s) {
			let c = p.exec(s);
			if (!c) return !1;
			let l = +c[1], u = +c[2], d = +c[3], f = c[4], m = c[5] === "-" ? -1 : 1, h = +(c[6] || 0), g = +(c[7] || 0);
			if (h > 23 || g > 59 || e && !f) return !1;
			if (l <= 23 && u <= 59 && d < 60) return !0;
			let _ = u - g * m, v = l - h * m - (_ < 0 ? 1 : 0);
			return (v === 23 || v === -1) && (_ === 59 || _ === -1) && d < 61;
		};
	}
	function h(e, s) {
		if (!(e && s)) return;
		let c = (/* @__PURE__ */ new Date("2020-01-01T" + e)).valueOf(), l = (/* @__PURE__ */ new Date("2020-01-01T" + s)).valueOf();
		if (c && l) return c - l;
	}
	function g(e, s) {
		if (!(e && s)) return;
		let c = p.exec(e), l = p.exec(s);
		if (c && l) return e = c[1] + c[2] + c[3], s = l[1] + l[2] + l[3], e > s ? 1 : e < s ? -1 : 0;
	}
	var _ = /t|\s/i;
	function v(e) {
		let s = m(e);
		return function(e) {
			let c = e.split(_);
			return c.length === 2 && d(c[0]) && s(c[1]);
		};
	}
	function y(e, s) {
		if (!(e && s)) return;
		let c = new Date(e).valueOf(), l = new Date(s).valueOf();
		if (c && l) return c - l;
	}
	function b(e, s) {
		if (!(e && s)) return;
		let [c, l] = e.split(_), [u, d] = s.split(_), p = f(c, u);
		if (p !== void 0) return p || h(l, d);
	}
	var x = /\/|:/, S = /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)(?:\?(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i;
	function C(e) {
		return x.test(e) && S.test(e);
	}
	var w = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/gm;
	function T(e) {
		return w.lastIndex = 0, w.test(e);
	}
	var E = -(2 ** 31), D = 2 ** 31 - 1;
	function O(e) {
		return Number.isInteger(e) && e <= D && e >= E;
	}
	function k(e) {
		return Number.isInteger(e);
	}
	function A() {
		return !0;
	}
	var j = /[^\\]\\Z/;
	function M(e) {
		if (j.test(e)) return !1;
		try {
			return new RegExp(e), !0;
		} catch {
			return !1;
		}
	}
})), require_draft7 = /* @__PURE__ */ __commonJSMin(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 });
	var s = require_core(), c = require_validation(), l = require_applicator(), u = require_format(), d = require_metadata();
	e.default = [
		s.default,
		c.default,
		(0, l.default)(),
		u.default,
		d.metadataVocabulary,
		d.contentVocabulary
	];
})), json_schema_draft_07_exports = /* @__PURE__ */ __export({
	$id: () => $id,
	$schema: () => $schema,
	default: () => json_schema_draft_07_default,
	definitions: () => definitions,
	properties: () => properties,
	title: () => title,
	type: () => type
}), $schema, $id, title, definitions, type, properties, json_schema_draft_07_default, init_json_schema_draft_07 = __esmMin((() => {
	$schema = "http://json-schema.org/draft-07/schema#", $id = "http://json-schema.org/draft-07/schema#", title = "Core schema meta-schema", definitions = {
		schemaArray: {
			type: "array",
			minItems: 1,
			items: { $ref: "#" }
		},
		nonNegativeInteger: {
			type: "integer",
			minimum: 0
		},
		nonNegativeIntegerDefault0: { allOf: [{ $ref: "#/definitions/nonNegativeInteger" }, { default: 0 }] },
		simpleTypes: { enum: [
			"array",
			"boolean",
			"integer",
			"null",
			"number",
			"object",
			"string"
		] },
		stringArray: {
			type: "array",
			items: { type: "string" },
			uniqueItems: !0,
			default: []
		}
	}, type = ["object", "boolean"], properties = {
		$id: {
			type: "string",
			format: "uri-reference"
		},
		$schema: {
			type: "string",
			format: "uri"
		},
		$ref: {
			type: "string",
			format: "uri-reference"
		},
		$comment: { type: "string" },
		title: { type: "string" },
		description: { type: "string" },
		default: !0,
		readOnly: {
			type: "boolean",
			default: !1
		},
		examples: {
			type: "array",
			items: !0
		},
		multipleOf: {
			type: "number",
			exclusiveMinimum: 0
		},
		maximum: { type: "number" },
		exclusiveMaximum: { type: "number" },
		minimum: { type: "number" },
		exclusiveMinimum: { type: "number" },
		maxLength: { $ref: "#/definitions/nonNegativeInteger" },
		minLength: { $ref: "#/definitions/nonNegativeIntegerDefault0" },
		pattern: {
			type: "string",
			format: "regex"
		},
		additionalItems: { $ref: "#" },
		items: {
			anyOf: [{ $ref: "#" }, { $ref: "#/definitions/schemaArray" }],
			default: !0
		},
		maxItems: { $ref: "#/definitions/nonNegativeInteger" },
		minItems: { $ref: "#/definitions/nonNegativeIntegerDefault0" },
		uniqueItems: {
			type: "boolean",
			default: !1
		},
		contains: { $ref: "#" },
		maxProperties: { $ref: "#/definitions/nonNegativeInteger" },
		minProperties: { $ref: "#/definitions/nonNegativeIntegerDefault0" },
		required: { $ref: "#/definitions/stringArray" },
		additionalProperties: { $ref: "#" },
		definitions: {
			type: "object",
			additionalProperties: { $ref: "#" },
			default: {}
		},
		properties: {
			type: "object",
			additionalProperties: { $ref: "#" },
			default: {}
		},
		patternProperties: {
			type: "object",
			additionalProperties: { $ref: "#" },
			propertyNames: { format: "regex" },
			default: {}
		},
		dependencies: {
			type: "object",
			additionalProperties: { anyOf: [{ $ref: "#" }, { $ref: "#/definitions/stringArray" }] }
		},
		propertyNames: { $ref: "#" },
		const: !0,
		enum: {
			type: "array",
			items: !0,
			minItems: 1,
			uniqueItems: !0
		},
		type: { anyOf: [{ $ref: "#/definitions/simpleTypes" }, {
			type: "array",
			items: { $ref: "#/definitions/simpleTypes" },
			minItems: 1,
			uniqueItems: !0
		}] },
		format: { type: "string" },
		contentMediaType: { type: "string" },
		contentEncoding: { type: "string" },
		if: { $ref: "#" },
		then: { $ref: "#" },
		else: { $ref: "#" },
		allOf: { $ref: "#/definitions/schemaArray" },
		anyOf: { $ref: "#/definitions/schemaArray" },
		oneOf: { $ref: "#/definitions/schemaArray" },
		not: { $ref: "#" }
	}, json_schema_draft_07_default = {
		$schema,
		$id,
		title,
		definitions,
		type,
		properties,
		default: !0
	};
})), require_ajv = /* @__PURE__ */ __commonJSMin(((e, s) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.MissingRefError = e.ValidationError = e.CodeGen = e.Name = e.nil = e.stringify = e.str = e._ = e.KeywordCxt = e.Ajv = void 0;
	var c = require_core$1(), l = require_draft7(), u = require_discriminator(), d = (init_json_schema_draft_07(), __toCommonJS(json_schema_draft_07_exports).default), f = ["/properties"], p = "http://json-schema.org/draft-07/schema", m = class extends c.default {
		_addVocabularies() {
			super._addVocabularies(), l.default.forEach((e) => this.addVocabulary(e)), this.opts.discriminator && this.addKeyword(u.default);
		}
		_addDefaultMetaSchema() {
			if (super._addDefaultMetaSchema(), !this.opts.meta) return;
			let e = this.opts.$data ? this.$dataMetaSchema(d, f) : d;
			this.addMetaSchema(e, p, !1), this.refs["http://json-schema.org/schema"] = p;
		}
		defaultMeta() {
			return this.opts.defaultMeta = super.defaultMeta() || (this.getSchema(p) ? p : void 0);
		}
	};
	e.Ajv = m, s.exports = e = m, s.exports.Ajv = m, Object.defineProperty(e, "__esModule", { value: !0 }), e.default = m;
	var h = require_validate();
	Object.defineProperty(e, "KeywordCxt", {
		enumerable: !0,
		get: function() {
			return h.KeywordCxt;
		}
	});
	var g = require_codegen();
	Object.defineProperty(e, "_", {
		enumerable: !0,
		get: function() {
			return g._;
		}
	}), Object.defineProperty(e, "str", {
		enumerable: !0,
		get: function() {
			return g.str;
		}
	}), Object.defineProperty(e, "stringify", {
		enumerable: !0,
		get: function() {
			return g.stringify;
		}
	}), Object.defineProperty(e, "nil", {
		enumerable: !0,
		get: function() {
			return g.nil;
		}
	}), Object.defineProperty(e, "Name", {
		enumerable: !0,
		get: function() {
			return g.Name;
		}
	}), Object.defineProperty(e, "CodeGen", {
		enumerable: !0,
		get: function() {
			return g.CodeGen;
		}
	});
	var _ = require_validation_error();
	Object.defineProperty(e, "ValidationError", {
		enumerable: !0,
		get: function() {
			return _.default;
		}
	});
	var v = require_ref_error();
	Object.defineProperty(e, "MissingRefError", {
		enumerable: !0,
		get: function() {
			return v.default;
		}
	});
})), require_limit = /* @__PURE__ */ __commonJSMin(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.formatLimitDefinition = void 0;
	var s = require_ajv(), c = require_codegen(), l = c.operators, u = {
		formatMaximum: {
			okStr: "<=",
			ok: l.LTE,
			fail: l.GT
		},
		formatMinimum: {
			okStr: ">=",
			ok: l.GTE,
			fail: l.LT
		},
		formatExclusiveMaximum: {
			okStr: "<",
			ok: l.LT,
			fail: l.GTE
		},
		formatExclusiveMinimum: {
			okStr: ">",
			ok: l.GT,
			fail: l.LTE
		}
	};
	e.formatLimitDefinition = {
		keyword: Object.keys(u),
		type: "string",
		schemaType: "string",
		$data: !0,
		error: {
			message: ({ keyword: e, schemaCode: s }) => (0, c.str)`should be ${u[e].okStr} ${s}`,
			params: ({ keyword: e, schemaCode: s }) => (0, c._)`{comparison: ${u[e].okStr}, limit: ${s}}`
		},
		code(e) {
			let { gen: l, data: d, schemaCode: f, keyword: p, it: m } = e, { opts: h, self: g } = m;
			if (!h.validateFormats) return;
			let _ = new s.KeywordCxt(m, g.RULES.all.format.definition, "format");
			_.$data ? v() : y();
			function v() {
				let s = l.scopeValue("formats", {
					ref: g.formats,
					code: h.code.formats
				}), u = l.const("fmt", (0, c._)`${s}[${_.schemaCode}]`);
				e.fail$data((0, c.or)((0, c._)`typeof ${u} != "object"`, (0, c._)`${u} instanceof RegExp`, (0, c._)`typeof ${u}.compare != "function"`, b(u)));
			}
			function y() {
				let s = _.schema, u = g.formats[s];
				if (!u || u === !0) return;
				if (typeof u != "object" || u instanceof RegExp || typeof u.compare != "function") throw Error(`"${p}": format "${s}" does not define "compare" function`);
				let d = l.scopeValue("formats", {
					key: s,
					ref: u,
					code: h.code.formats ? (0, c._)`${h.code.formats}${(0, c.getProperty)(s)}` : void 0
				});
				e.fail$data(b(d));
			}
			function b(e) {
				return (0, c._)`${e}.compare(${d}, ${f}) ${u[p].fail} 0`;
			}
		},
		dependencies: ["format"]
	}, e.default = (s) => (s.addKeyword(e.formatLimitDefinition), s);
})), import_dist = /* @__PURE__ */ __toESM((/* @__PURE__ */ __commonJSMin(((e, s) => {
	Object.defineProperty(e, "__esModule", { value: !0 });
	var c = require_formats(), l = require_limit(), u = require_codegen(), d = new u.Name("fullFormats"), f = new u.Name("fastFormats"), p = (e, s = { keywords: !0 }) => {
		if (Array.isArray(s)) return m(e, s, c.fullFormats, d), e;
		let [u, p] = s.mode === "fast" ? [c.fastFormats, f] : [c.fullFormats, d];
		return m(e, s.formats || c.formatNames, u, p), s.keywords && (0, l.default)(e), e;
	};
	p.get = (e, s = "full") => {
		let l = (s === "fast" ? c.fastFormats : c.fullFormats)[e];
		if (!l) throw Error(`Unknown format "${e}"`);
		return l;
	};
	function m(e, s, c, l) {
		var d;
		(d = e.opts.code).formats ?? (d.formats = (0, u._)`require("ajv-formats/dist/formats").${l}`);
		for (let l of s) e.addFormat(l, c[l]);
	}
	s.exports = e = p, Object.defineProperty(e, "__esModule", { value: !0 }), e.default = p;
})))(), 1), import__2020 = require__2020(), copyProperty = (e, s, c, l) => {
	if (c === "length" || c === "prototype" || c === "arguments" || c === "caller") return;
	let u = Object.getOwnPropertyDescriptor(e, c), d = Object.getOwnPropertyDescriptor(s, c);
	!canCopyProperty(u, d) && l || Object.defineProperty(e, c, d);
}, canCopyProperty = function(e, s) {
	return e === void 0 || e.configurable || e.writable === s.writable && e.enumerable === s.enumerable && e.configurable === s.configurable && (e.writable || e.value === s.value);
}, changePrototype = (e, s) => {
	let c = Object.getPrototypeOf(s);
	c !== Object.getPrototypeOf(e) && Object.setPrototypeOf(e, c);
}, wrappedToString = (e, s) => `/* Wrapped ${e}*/\n${s}`, toStringDescriptor = Object.getOwnPropertyDescriptor(Function.prototype, "toString"), toStringName = Object.getOwnPropertyDescriptor(Function.prototype.toString, "name"), changeToString = (e, s, c) => {
	let l = c === "" ? "" : `with ${c.trim()}() `, u = wrappedToString.bind(null, l, s.toString());
	Object.defineProperty(u, "name", toStringName);
	let { writable: d, enumerable: f, configurable: p } = toStringDescriptor;
	Object.defineProperty(e, "toString", {
		value: u,
		writable: d,
		enumerable: f,
		configurable: p
	});
};
function mimicFunction(e, s, { ignoreNonConfigurable: c = !1 } = {}) {
	let { name: l } = e;
	for (let l of Reflect.ownKeys(s)) copyProperty(e, s, l, c);
	return changePrototype(e, s), changeToString(e, s, l), e;
}
var debounce_fn_default = (e, s = {}) => {
	if (typeof e != "function") throw TypeError(`Expected the first argument to be a function, got \`${typeof e}\``);
	let { wait: c = 0, maxWait: l = Infinity, before: u = !1, after: d = !0 } = s;
	if (c < 0 || l < 0) throw RangeError("`wait` and `maxWait` must not be negative.");
	if (!u && !d) throw Error("Both `before` and `after` are false, function wouldn't be called.");
	let f, p, m, h = function(...s) {
		let h = this, g = () => {
			f = void 0, p &&= (clearTimeout(p), void 0), d && (m = e.apply(h, s));
		}, _ = () => {
			p = void 0, f &&= (clearTimeout(f), void 0), d && (m = e.apply(h, s));
		}, v = u && !f;
		return clearTimeout(f), f = setTimeout(g, c), l > 0 && l !== Infinity && !p && (p = setTimeout(_, l)), v && (m = e.apply(h, s)), m;
	};
	return mimicFunction(h, e), h.cancel = () => {
		f &&= (clearTimeout(f), void 0), p &&= (clearTimeout(p), void 0);
	}, h;
}, require_constants = /* @__PURE__ */ __commonJSMin(((e, s) => {
	var c = "2.0.0", l = 256;
	s.exports = {
		MAX_LENGTH: l,
		MAX_SAFE_COMPONENT_LENGTH: 16,
		MAX_SAFE_BUILD_LENGTH: l - 6,
		MAX_SAFE_INTEGER: 2 ** 53 - 1 || 9007199254740991,
		RELEASE_TYPES: [
			"major",
			"premajor",
			"minor",
			"preminor",
			"patch",
			"prepatch",
			"prerelease"
		],
		SEMVER_SPEC_VERSION: c,
		FLAG_INCLUDE_PRERELEASE: 1,
		FLAG_LOOSE: 2
	};
})), require_debug = /* @__PURE__ */ __commonJSMin(((e, s) => {
	s.exports = typeof process == "object" && process.env && process.env.NODE_DEBUG && /\bsemver\b/i.test(process.env.NODE_DEBUG) ? (...e) => console.error("SEMVER", ...e) : () => {};
})), require_re = /* @__PURE__ */ __commonJSMin(((e, s) => {
	var { MAX_SAFE_COMPONENT_LENGTH: c, MAX_SAFE_BUILD_LENGTH: l, MAX_LENGTH: u } = require_constants(), d = require_debug();
	e = s.exports = {};
	var f = e.re = [], p = e.safeRe = [], m = e.src = [], h = e.safeSrc = [], g = e.t = {}, _ = 0, v = "[a-zA-Z0-9-]", y = [
		["\\s", 1],
		["\\d", u],
		[v, l]
	], b = (e) => {
		for (let [s, c] of y) e = e.split(`${s}*`).join(`${s}{0,${c}}`).split(`${s}+`).join(`${s}{1,${c}}`);
		return e;
	}, x = (e, s, c) => {
		let l = b(s), u = _++;
		d(e, u, s), g[e] = u, m[u] = s, h[u] = l, f[u] = new RegExp(s, c ? "g" : void 0), p[u] = new RegExp(l, c ? "g" : void 0);
	};
	x("NUMERICIDENTIFIER", "0|[1-9]\\d*"), x("NUMERICIDENTIFIERLOOSE", "\\d+"), x("NONNUMERICIDENTIFIER", `\\d*[a-zA-Z-]${v}*`), x("MAINVERSION", `(${m[g.NUMERICIDENTIFIER]})\\.(${m[g.NUMERICIDENTIFIER]})\\.(${m[g.NUMERICIDENTIFIER]})`), x("MAINVERSIONLOOSE", `(${m[g.NUMERICIDENTIFIERLOOSE]})\\.(${m[g.NUMERICIDENTIFIERLOOSE]})\\.(${m[g.NUMERICIDENTIFIERLOOSE]})`), x("PRERELEASEIDENTIFIER", `(?:${m[g.NONNUMERICIDENTIFIER]}|${m[g.NUMERICIDENTIFIER]})`), x("PRERELEASEIDENTIFIERLOOSE", `(?:${m[g.NONNUMERICIDENTIFIER]}|${m[g.NUMERICIDENTIFIERLOOSE]})`), x("PRERELEASE", `(?:-(${m[g.PRERELEASEIDENTIFIER]}(?:\\.${m[g.PRERELEASEIDENTIFIER]})*))`), x("PRERELEASELOOSE", `(?:-?(${m[g.PRERELEASEIDENTIFIERLOOSE]}(?:\\.${m[g.PRERELEASEIDENTIFIERLOOSE]})*))`), x("BUILDIDENTIFIER", `${v}+`), x("BUILD", `(?:\\+(${m[g.BUILDIDENTIFIER]}(?:\\.${m[g.BUILDIDENTIFIER]})*))`), x("FULLPLAIN", `v?${m[g.MAINVERSION]}${m[g.PRERELEASE]}?${m[g.BUILD]}?`), x("FULL", `^${m[g.FULLPLAIN]}$`), x("LOOSEPLAIN", `[v=\\s]*${m[g.MAINVERSIONLOOSE]}${m[g.PRERELEASELOOSE]}?${m[g.BUILD]}?`), x("LOOSE", `^${m[g.LOOSEPLAIN]}$`), x("GTLT", "((?:<|>)?=?)"), x("XRANGEIDENTIFIERLOOSE", `${m[g.NUMERICIDENTIFIERLOOSE]}|x|X|\\*`), x("XRANGEIDENTIFIER", `${m[g.NUMERICIDENTIFIER]}|x|X|\\*`), x("XRANGEPLAIN", `[v=\\s]*(${m[g.XRANGEIDENTIFIER]})(?:\\.(${m[g.XRANGEIDENTIFIER]})(?:\\.(${m[g.XRANGEIDENTIFIER]})(?:${m[g.PRERELEASE]})?${m[g.BUILD]}?)?)?`), x("XRANGEPLAINLOOSE", `[v=\\s]*(${m[g.XRANGEIDENTIFIERLOOSE]})(?:\\.(${m[g.XRANGEIDENTIFIERLOOSE]})(?:\\.(${m[g.XRANGEIDENTIFIERLOOSE]})(?:${m[g.PRERELEASELOOSE]})?${m[g.BUILD]}?)?)?`), x("XRANGE", `^${m[g.GTLT]}\\s*${m[g.XRANGEPLAIN]}$`), x("XRANGELOOSE", `^${m[g.GTLT]}\\s*${m[g.XRANGEPLAINLOOSE]}$`), x("COERCEPLAIN", `(^|[^\\d])(\\d{1,${c}})(?:\\.(\\d{1,${c}}))?(?:\\.(\\d{1,${c}}))?`), x("COERCE", `${m[g.COERCEPLAIN]}(?:$|[^\\d])`), x("COERCEFULL", m[g.COERCEPLAIN] + `(?:${m[g.PRERELEASE]})?(?:${m[g.BUILD]})?(?:$|[^\\d])`), x("COERCERTL", m[g.COERCE], !0), x("COERCERTLFULL", m[g.COERCEFULL], !0), x("LONETILDE", "(?:~>?)"), x("TILDETRIM", `(\\s*)${m[g.LONETILDE]}\\s+`, !0), e.tildeTrimReplace = "$1~", x("TILDE", `^${m[g.LONETILDE]}${m[g.XRANGEPLAIN]}$`), x("TILDELOOSE", `^${m[g.LONETILDE]}${m[g.XRANGEPLAINLOOSE]}$`), x("LONECARET", "(?:\\^)"), x("CARETTRIM", `(\\s*)${m[g.LONECARET]}\\s+`, !0), e.caretTrimReplace = "$1^", x("CARET", `^${m[g.LONECARET]}${m[g.XRANGEPLAIN]}$`), x("CARETLOOSE", `^${m[g.LONECARET]}${m[g.XRANGEPLAINLOOSE]}$`), x("COMPARATORLOOSE", `^${m[g.GTLT]}\\s*(${m[g.LOOSEPLAIN]})$|^$`), x("COMPARATOR", `^${m[g.GTLT]}\\s*(${m[g.FULLPLAIN]})$|^$`), x("COMPARATORTRIM", `(\\s*)${m[g.GTLT]}\\s*(${m[g.LOOSEPLAIN]}|${m[g.XRANGEPLAIN]})`, !0), e.comparatorTrimReplace = "$1$2$3", x("HYPHENRANGE", `^\\s*(${m[g.XRANGEPLAIN]})\\s+-\\s+(${m[g.XRANGEPLAIN]})\\s*$`), x("HYPHENRANGELOOSE", `^\\s*(${m[g.XRANGEPLAINLOOSE]})\\s+-\\s+(${m[g.XRANGEPLAINLOOSE]})\\s*$`), x("STAR", "(<|>)?=?\\s*\\*"), x("GTE0", "^\\s*>=\\s*0\\.0\\.0\\s*$"), x("GTE0PRE", "^\\s*>=\\s*0\\.0\\.0-0\\s*$");
})), require_parse_options = /* @__PURE__ */ __commonJSMin(((e, s) => {
	var c = Object.freeze({ loose: !0 }), l = Object.freeze({});
	s.exports = (e) => e ? typeof e == "object" ? e : c : l;
})), require_identifiers = /* @__PURE__ */ __commonJSMin(((e, s) => {
	var c = /^[0-9]+$/, l = (e, s) => {
		if (typeof e == "number" && typeof s == "number") return e === s ? 0 : e < s ? -1 : 1;
		let l = c.test(e), u = c.test(s);
		return l && u && (e = +e, s = +s), e === s ? 0 : l && !u ? -1 : u && !l ? 1 : e < s ? -1 : 1;
	};
	s.exports = {
		compareIdentifiers: l,
		rcompareIdentifiers: (e, s) => l(s, e)
	};
})), require_semver$1 = /* @__PURE__ */ __commonJSMin(((e, s) => {
	var c = require_debug(), { MAX_LENGTH: l, MAX_SAFE_INTEGER: u } = require_constants(), { safeRe: d, t: f } = require_re(), p = require_parse_options(), { compareIdentifiers: m } = require_identifiers();
	s.exports = class e {
		constructor(s, m) {
			if (m = p(m), s instanceof e) {
				if (s.loose === !!m.loose && s.includePrerelease === !!m.includePrerelease) return s;
				s = s.version;
			} else if (typeof s != "string") throw TypeError(`Invalid version. Must be a string. Got type "${typeof s}".`);
			if (s.length > l) throw TypeError(`version is longer than ${l} characters`);
			c("SemVer", s, m), this.options = m, this.loose = !!m.loose, this.includePrerelease = !!m.includePrerelease;
			let h = s.trim().match(m.loose ? d[f.LOOSE] : d[f.FULL]);
			if (!h) throw TypeError(`Invalid Version: ${s}`);
			if (this.raw = s, this.major = +h[1], this.minor = +h[2], this.patch = +h[3], this.major > u || this.major < 0) throw TypeError("Invalid major version");
			if (this.minor > u || this.minor < 0) throw TypeError("Invalid minor version");
			if (this.patch > u || this.patch < 0) throw TypeError("Invalid patch version");
			h[4] ? this.prerelease = h[4].split(".").map((e) => {
				if (/^[0-9]+$/.test(e)) {
					let s = +e;
					if (s >= 0 && s < u) return s;
				}
				return e;
			}) : this.prerelease = [], this.build = h[5] ? h[5].split(".") : [], this.format();
		}
		format() {
			return this.version = `${this.major}.${this.minor}.${this.patch}`, this.prerelease.length && (this.version += `-${this.prerelease.join(".")}`), this.version;
		}
		toString() {
			return this.version;
		}
		compare(s) {
			if (c("SemVer.compare", this.version, this.options, s), !(s instanceof e)) {
				if (typeof s == "string" && s === this.version) return 0;
				s = new e(s, this.options);
			}
			return s.version === this.version ? 0 : this.compareMain(s) || this.comparePre(s);
		}
		compareMain(s) {
			return s instanceof e || (s = new e(s, this.options)), this.major < s.major ? -1 : this.major > s.major ? 1 : this.minor < s.minor ? -1 : this.minor > s.minor ? 1 : this.patch < s.patch ? -1 : this.patch > s.patch ? 1 : 0;
		}
		comparePre(s) {
			if (s instanceof e || (s = new e(s, this.options)), this.prerelease.length && !s.prerelease.length) return -1;
			if (!this.prerelease.length && s.prerelease.length) return 1;
			if (!this.prerelease.length && !s.prerelease.length) return 0;
			let l = 0;
			do {
				let e = this.prerelease[l], u = s.prerelease[l];
				if (c("prerelease compare", l, e, u), e === void 0 && u === void 0) return 0;
				if (u === void 0) return 1;
				if (e === void 0) return -1;
				if (e === u) continue;
				return m(e, u);
			} while (++l);
		}
		compareBuild(s) {
			s instanceof e || (s = new e(s, this.options));
			let l = 0;
			do {
				let e = this.build[l], u = s.build[l];
				if (c("build compare", l, e, u), e === void 0 && u === void 0) return 0;
				if (u === void 0) return 1;
				if (e === void 0) return -1;
				if (e === u) continue;
				return m(e, u);
			} while (++l);
		}
		inc(e, s, c) {
			if (e.startsWith("pre")) {
				if (!s && c === !1) throw Error("invalid increment argument: identifier is empty");
				if (s) {
					let e = `-${s}`.match(this.options.loose ? d[f.PRERELEASELOOSE] : d[f.PRERELEASE]);
					if (!e || e[1] !== s) throw Error(`invalid identifier: ${s}`);
				}
			}
			switch (e) {
				case "premajor":
					this.prerelease.length = 0, this.patch = 0, this.minor = 0, this.major++, this.inc("pre", s, c);
					break;
				case "preminor":
					this.prerelease.length = 0, this.patch = 0, this.minor++, this.inc("pre", s, c);
					break;
				case "prepatch":
					this.prerelease.length = 0, this.inc("patch", s, c), this.inc("pre", s, c);
					break;
				case "prerelease":
					this.prerelease.length === 0 && this.inc("patch", s, c), this.inc("pre", s, c);
					break;
				case "release":
					if (this.prerelease.length === 0) throw Error(`version ${this.raw} is not a prerelease`);
					this.prerelease.length = 0;
					break;
				case "major":
					(this.minor !== 0 || this.patch !== 0 || this.prerelease.length === 0) && this.major++, this.minor = 0, this.patch = 0, this.prerelease = [];
					break;
				case "minor":
					(this.patch !== 0 || this.prerelease.length === 0) && this.minor++, this.patch = 0, this.prerelease = [];
					break;
				case "patch":
					this.prerelease.length === 0 && this.patch++, this.prerelease = [];
					break;
				case "pre": {
					let e = Number(c) ? 1 : 0;
					if (this.prerelease.length === 0) this.prerelease = [e];
					else {
						let l = this.prerelease.length;
						for (; --l >= 0;) typeof this.prerelease[l] == "number" && (this.prerelease[l]++, l = -2);
						if (l === -1) {
							if (s === this.prerelease.join(".") && c === !1) throw Error("invalid increment argument: identifier already exists");
							this.prerelease.push(e);
						}
					}
					if (s) {
						let l = [s, e];
						c === !1 && (l = [s]), m(this.prerelease[0], s) === 0 ? isNaN(this.prerelease[1]) && (this.prerelease = l) : this.prerelease = l;
					}
					break;
				}
				default: throw Error(`invalid increment argument: ${e}`);
			}
			return this.raw = this.format(), this.build.length && (this.raw += `+${this.build.join(".")}`), this;
		}
	};
})), require_parse = /* @__PURE__ */ __commonJSMin(((e, s) => {
	var c = require_semver$1();
	s.exports = (e, s, l = !1) => {
		if (e instanceof c) return e;
		try {
			return new c(e, s);
		} catch (e) {
			if (!l) return null;
			throw e;
		}
	};
})), require_valid$1 = /* @__PURE__ */ __commonJSMin(((e, s) => {
	var c = require_parse();
	s.exports = (e, s) => {
		let l = c(e, s);
		return l ? l.version : null;
	};
})), require_clean = /* @__PURE__ */ __commonJSMin(((e, s) => {
	var c = require_parse();
	s.exports = (e, s) => {
		let l = c(e.trim().replace(/^[=v]+/, ""), s);
		return l ? l.version : null;
	};
})), require_inc = /* @__PURE__ */ __commonJSMin(((e, s) => {
	var c = require_semver$1();
	s.exports = (e, s, l, u, d) => {
		typeof l == "string" && (d = u, u = l, l = void 0);
		try {
			return new c(e instanceof c ? e.version : e, l).inc(s, u, d).version;
		} catch {
			return null;
		}
	};
})), require_diff = /* @__PURE__ */ __commonJSMin(((e, s) => {
	var c = require_parse();
	s.exports = (e, s) => {
		let l = c(e, null, !0), u = c(s, null, !0), d = l.compare(u);
		if (d === 0) return null;
		let f = d > 0, p = f ? l : u, m = f ? u : l, h = !!p.prerelease.length;
		if (m.prerelease.length && !h) {
			if (!m.patch && !m.minor) return "major";
			if (m.compareMain(p) === 0) return m.minor && !m.patch ? "minor" : "patch";
		}
		let g = h ? "pre" : "";
		return l.major === u.major ? l.minor === u.minor ? l.patch === u.patch ? "prerelease" : g + "patch" : g + "minor" : g + "major";
	};
})), require_major = /* @__PURE__ */ __commonJSMin(((e, s) => {
	var c = require_semver$1();
	s.exports = (e, s) => new c(e, s).major;
})), require_minor = /* @__PURE__ */ __commonJSMin(((e, s) => {
	var c = require_semver$1();
	s.exports = (e, s) => new c(e, s).minor;
})), require_patch = /* @__PURE__ */ __commonJSMin(((e, s) => {
	var c = require_semver$1();
	s.exports = (e, s) => new c(e, s).patch;
})), require_prerelease = /* @__PURE__ */ __commonJSMin(((e, s) => {
	var c = require_parse();
	s.exports = (e, s) => {
		let l = c(e, s);
		return l && l.prerelease.length ? l.prerelease : null;
	};
})), require_compare = /* @__PURE__ */ __commonJSMin(((e, s) => {
	var c = require_semver$1();
	s.exports = (e, s, l) => new c(e, l).compare(new c(s, l));
})), require_rcompare = /* @__PURE__ */ __commonJSMin(((e, s) => {
	var c = require_compare();
	s.exports = (e, s, l) => c(s, e, l);
})), require_compare_loose = /* @__PURE__ */ __commonJSMin(((e, s) => {
	var c = require_compare();
	s.exports = (e, s) => c(e, s, !0);
})), require_compare_build = /* @__PURE__ */ __commonJSMin(((e, s) => {
	var c = require_semver$1();
	s.exports = (e, s, l) => {
		let u = new c(e, l), d = new c(s, l);
		return u.compare(d) || u.compareBuild(d);
	};
})), require_sort = /* @__PURE__ */ __commonJSMin(((e, s) => {
	var c = require_compare_build();
	s.exports = (e, s) => e.sort((e, l) => c(e, l, s));
})), require_rsort = /* @__PURE__ */ __commonJSMin(((e, s) => {
	var c = require_compare_build();
	s.exports = (e, s) => e.sort((e, l) => c(l, e, s));
})), require_gt = /* @__PURE__ */ __commonJSMin(((e, s) => {
	var c = require_compare();
	s.exports = (e, s, l) => c(e, s, l) > 0;
})), require_lt = /* @__PURE__ */ __commonJSMin(((e, s) => {
	var c = require_compare();
	s.exports = (e, s, l) => c(e, s, l) < 0;
})), require_eq = /* @__PURE__ */ __commonJSMin(((e, s) => {
	var c = require_compare();
	s.exports = (e, s, l) => c(e, s, l) === 0;
})), require_neq = /* @__PURE__ */ __commonJSMin(((e, s) => {
	var c = require_compare();
	s.exports = (e, s, l) => c(e, s, l) !== 0;
})), require_gte = /* @__PURE__ */ __commonJSMin(((e, s) => {
	var c = require_compare();
	s.exports = (e, s, l) => c(e, s, l) >= 0;
})), require_lte = /* @__PURE__ */ __commonJSMin(((e, s) => {
	var c = require_compare();
	s.exports = (e, s, l) => c(e, s, l) <= 0;
})), require_cmp = /* @__PURE__ */ __commonJSMin(((e, s) => {
	var c = require_eq(), l = require_neq(), u = require_gt(), d = require_gte(), f = require_lt(), p = require_lte();
	s.exports = (e, s, m, h) => {
		switch (s) {
			case "===": return typeof e == "object" && (e = e.version), typeof m == "object" && (m = m.version), e === m;
			case "!==": return typeof e == "object" && (e = e.version), typeof m == "object" && (m = m.version), e !== m;
			case "":
			case "=":
			case "==": return c(e, m, h);
			case "!=": return l(e, m, h);
			case ">": return u(e, m, h);
			case ">=": return d(e, m, h);
			case "<": return f(e, m, h);
			case "<=": return p(e, m, h);
			default: throw TypeError(`Invalid operator: ${s}`);
		}
	};
})), require_coerce = /* @__PURE__ */ __commonJSMin(((e, s) => {
	var c = require_semver$1(), l = require_parse(), { safeRe: u, t: d } = require_re();
	s.exports = (e, s) => {
		if (e instanceof c) return e;
		if (typeof e == "number" && (e = String(e)), typeof e != "string") return null;
		s ||= {};
		let f = null;
		if (!s.rtl) f = e.match(s.includePrerelease ? u[d.COERCEFULL] : u[d.COERCE]);
		else {
			let c = s.includePrerelease ? u[d.COERCERTLFULL] : u[d.COERCERTL], l;
			for (; (l = c.exec(e)) && (!f || f.index + f[0].length !== e.length);) (!f || l.index + l[0].length !== f.index + f[0].length) && (f = l), c.lastIndex = l.index + l[1].length + l[2].length;
			c.lastIndex = -1;
		}
		if (f === null) return null;
		let p = f[2];
		return l(`${p}.${f[3] || "0"}.${f[4] || "0"}${s.includePrerelease && f[5] ? `-${f[5]}` : ""}${s.includePrerelease && f[6] ? `+${f[6]}` : ""}`, s);
	};
})), require_lrucache = /* @__PURE__ */ __commonJSMin(((e, s) => {
	s.exports = class {
		constructor() {
			this.max = 1e3, this.map = /* @__PURE__ */ new Map();
		}
		get(e) {
			let s = this.map.get(e);
			if (s !== void 0) return this.map.delete(e), this.map.set(e, s), s;
		}
		delete(e) {
			return this.map.delete(e);
		}
		set(e, s) {
			if (!this.delete(e) && s !== void 0) {
				if (this.map.size >= this.max) {
					let e = this.map.keys().next().value;
					this.delete(e);
				}
				this.map.set(e, s);
			}
			return this;
		}
	};
})), require_range = /* @__PURE__ */ __commonJSMin(((e, s) => {
	var c = /\s+/g;
	s.exports = class e {
		constructor(s, l) {
			if (l = u(l), s instanceof e) return s.loose === !!l.loose && s.includePrerelease === !!l.includePrerelease ? s : new e(s.raw, l);
			if (s instanceof d) return this.raw = s.value, this.set = [[s]], this.formatted = void 0, this;
			if (this.options = l, this.loose = !!l.loose, this.includePrerelease = !!l.includePrerelease, this.raw = s.trim().replace(c, " "), this.set = this.raw.split("||").map((e) => this.parseRange(e.trim())).filter((e) => e.length), !this.set.length) throw TypeError(`Invalid SemVer Range: ${this.raw}`);
			if (this.set.length > 1) {
				let e = this.set[0];
				if (this.set = this.set.filter((e) => !x(e[0])), this.set.length === 0) this.set = [e];
				else if (this.set.length > 1) {
					for (let e of this.set) if (e.length === 1 && S(e[0])) {
						this.set = [e];
						break;
					}
				}
			}
			this.formatted = void 0;
		}
		get range() {
			if (this.formatted === void 0) {
				this.formatted = "";
				for (let e = 0; e < this.set.length; e++) {
					e > 0 && (this.formatted += "||");
					let s = this.set[e];
					for (let e = 0; e < s.length; e++) e > 0 && (this.formatted += " "), this.formatted += s[e].toString().trim();
				}
			}
			return this.formatted;
		}
		format() {
			return this.range;
		}
		toString() {
			return this.range;
		}
		parseRange(e) {
			let s = ((this.options.includePrerelease && y) | (this.options.loose && b)) + ":" + e, c = l.get(s);
			if (c) return c;
			let u = this.options.loose, p = u ? m[h.HYPHENRANGELOOSE] : m[h.HYPHENRANGE];
			e = e.replace(p, P(this.options.includePrerelease)), f("hyphen replace", e), e = e.replace(m[h.COMPARATORTRIM], g), f("comparator trim", e), e = e.replace(m[h.TILDETRIM], _), f("tilde trim", e), e = e.replace(m[h.CARETTRIM], v), f("caret trim", e);
			let S = e.split(" ").map((e) => w(e, this.options)).join(" ").split(/\s+/).map((e) => N(e, this.options));
			u && (S = S.filter((e) => (f("loose invalid filter", e, this.options), !!e.match(m[h.COMPARATORLOOSE])))), f("range list", S);
			let C = /* @__PURE__ */ new Map(), T = S.map((e) => new d(e, this.options));
			for (let e of T) {
				if (x(e)) return [e];
				C.set(e.value, e);
			}
			C.size > 1 && C.has("") && C.delete("");
			let E = [...C.values()];
			return l.set(s, E), E;
		}
		intersects(s, c) {
			if (!(s instanceof e)) throw TypeError("a Range is required");
			return this.set.some((e) => C(e, c) && s.set.some((s) => C(s, c) && e.every((e) => s.every((s) => e.intersects(s, c)))));
		}
		test(e) {
			if (!e) return !1;
			if (typeof e == "string") try {
				e = new p(e, this.options);
			} catch {
				return !1;
			}
			for (let s = 0; s < this.set.length; s++) if (F(this.set[s], e, this.options)) return !0;
			return !1;
		}
	};
	var l = new (require_lrucache())(), u = require_parse_options(), d = require_comparator(), f = require_debug(), p = require_semver$1(), { safeRe: m, t: h, comparatorTrimReplace: g, tildeTrimReplace: _, caretTrimReplace: v } = require_re(), { FLAG_INCLUDE_PRERELEASE: y, FLAG_LOOSE: b } = require_constants(), x = (e) => e.value === "<0.0.0-0", S = (e) => e.value === "", C = (e, s) => {
		let c = !0, l = e.slice(), u = l.pop();
		for (; c && l.length;) c = l.every((e) => u.intersects(e, s)), u = l.pop();
		return c;
	}, w = (e, s) => (e = e.replace(m[h.BUILD], ""), f("comp", e, s), e = O(e, s), f("caret", e), e = E(e, s), f("tildes", e), e = A(e, s), f("xrange", e), e = M(e, s), f("stars", e), e), T = (e) => !e || e.toLowerCase() === "x" || e === "*", E = (e, s) => e.trim().split(/\s+/).map((e) => D(e, s)).join(" "), D = (e, s) => {
		let c = s.loose ? m[h.TILDELOOSE] : m[h.TILDE];
		return e.replace(c, (s, c, l, u, d) => {
			f("tilde", e, s, c, l, u, d);
			let p;
			return T(c) ? p = "" : T(l) ? p = `>=${c}.0.0 <${+c + 1}.0.0-0` : T(u) ? p = `>=${c}.${l}.0 <${c}.${+l + 1}.0-0` : d ? (f("replaceTilde pr", d), p = `>=${c}.${l}.${u}-${d} <${c}.${+l + 1}.0-0`) : p = `>=${c}.${l}.${u} <${c}.${+l + 1}.0-0`, f("tilde return", p), p;
		});
	}, O = (e, s) => e.trim().split(/\s+/).map((e) => k(e, s)).join(" "), k = (e, s) => {
		f("caret", e, s);
		let c = s.loose ? m[h.CARETLOOSE] : m[h.CARET], l = s.includePrerelease ? "-0" : "";
		return e.replace(c, (s, c, u, d, p) => {
			f("caret", e, s, c, u, d, p);
			let m;
			return T(c) ? m = "" : T(u) ? m = `>=${c}.0.0${l} <${+c + 1}.0.0-0` : T(d) ? m = c === "0" ? `>=${c}.${u}.0${l} <${c}.${+u + 1}.0-0` : `>=${c}.${u}.0${l} <${+c + 1}.0.0-0` : p ? (f("replaceCaret pr", p), m = c === "0" ? u === "0" ? `>=${c}.${u}.${d}-${p} <${c}.${u}.${+d + 1}-0` : `>=${c}.${u}.${d}-${p} <${c}.${+u + 1}.0-0` : `>=${c}.${u}.${d}-${p} <${+c + 1}.0.0-0`) : (f("no pr"), m = c === "0" ? u === "0" ? `>=${c}.${u}.${d}${l} <${c}.${u}.${+d + 1}-0` : `>=${c}.${u}.${d}${l} <${c}.${+u + 1}.0-0` : `>=${c}.${u}.${d} <${+c + 1}.0.0-0`), f("caret return", m), m;
		});
	}, A = (e, s) => (f("replaceXRanges", e, s), e.split(/\s+/).map((e) => j(e, s)).join(" ")), j = (e, s) => {
		e = e.trim();
		let c = s.loose ? m[h.XRANGELOOSE] : m[h.XRANGE];
		return e.replace(c, (c, l, u, d, p, m) => {
			f("xRange", e, c, l, u, d, p, m);
			let h = T(u), g = h || T(d), _ = g || T(p), v = _;
			return l === "=" && v && (l = ""), m = s.includePrerelease ? "-0" : "", h ? c = l === ">" || l === "<" ? "<0.0.0-0" : "*" : l && v ? (g && (d = 0), p = 0, l === ">" ? (l = ">=", g ? (u = +u + 1, d = 0, p = 0) : (d = +d + 1, p = 0)) : l === "<=" && (l = "<", g ? u = +u + 1 : d = +d + 1), l === "<" && (m = "-0"), c = `${l + u}.${d}.${p}${m}`) : g ? c = `>=${u}.0.0${m} <${+u + 1}.0.0-0` : _ && (c = `>=${u}.${d}.0${m} <${u}.${+d + 1}.0-0`), f("xRange return", c), c;
		});
	}, M = (e, s) => (f("replaceStars", e, s), e.trim().replace(m[h.STAR], "")), N = (e, s) => (f("replaceGTE0", e, s), e.trim().replace(m[s.includePrerelease ? h.GTE0PRE : h.GTE0], "")), P = (e) => (s, c, l, u, d, f, p, m, h, g, _, v) => (c = T(l) ? "" : T(u) ? `>=${l}.0.0${e ? "-0" : ""}` : T(d) ? `>=${l}.${u}.0${e ? "-0" : ""}` : f ? `>=${c}` : `>=${c}${e ? "-0" : ""}`, m = T(h) ? "" : T(g) ? `<${+h + 1}.0.0-0` : T(_) ? `<${h}.${+g + 1}.0-0` : v ? `<=${h}.${g}.${_}-${v}` : e ? `<${h}.${g}.${+_ + 1}-0` : `<=${m}`, `${c} ${m}`.trim()), F = (e, s, c) => {
		for (let c = 0; c < e.length; c++) if (!e[c].test(s)) return !1;
		if (s.prerelease.length && !c.includePrerelease) {
			for (let c = 0; c < e.length; c++) if (f(e[c].semver), e[c].semver !== d.ANY && e[c].semver.prerelease.length > 0) {
				let l = e[c].semver;
				if (l.major === s.major && l.minor === s.minor && l.patch === s.patch) return !0;
			}
			return !1;
		}
		return !0;
	};
})), require_comparator = /* @__PURE__ */ __commonJSMin(((e, s) => {
	var c = Symbol("SemVer ANY");
	s.exports = class e {
		static get ANY() {
			return c;
		}
		constructor(s, u) {
			if (u = l(u), s instanceof e) {
				if (s.loose === !!u.loose) return s;
				s = s.value;
			}
			s = s.trim().split(/\s+/).join(" "), p("comparator", s, u), this.options = u, this.loose = !!u.loose, this.parse(s), this.semver === c ? this.value = "" : this.value = this.operator + this.semver.version, p("comp", this);
		}
		parse(e) {
			let s = this.options.loose ? u[d.COMPARATORLOOSE] : u[d.COMPARATOR], l = e.match(s);
			if (!l) throw TypeError(`Invalid comparator: ${e}`);
			this.operator = l[1] === void 0 ? "" : l[1], this.operator === "=" && (this.operator = ""), l[2] ? this.semver = new m(l[2], this.options.loose) : this.semver = c;
		}
		toString() {
			return this.value;
		}
		test(e) {
			if (p("Comparator.test", e, this.options.loose), this.semver === c || e === c) return !0;
			if (typeof e == "string") try {
				e = new m(e, this.options);
			} catch {
				return !1;
			}
			return f(e, this.operator, this.semver, this.options);
		}
		intersects(s, c) {
			if (!(s instanceof e)) throw TypeError("a Comparator is required");
			return this.operator === "" ? this.value === "" ? !0 : new h(s.value, c).test(this.value) : s.operator === "" ? s.value === "" ? !0 : new h(this.value, c).test(s.semver) : (c = l(c), c.includePrerelease && (this.value === "<0.0.0-0" || s.value === "<0.0.0-0") || !c.includePrerelease && (this.value.startsWith("<0.0.0") || s.value.startsWith("<0.0.0")) ? !1 : !!(this.operator.startsWith(">") && s.operator.startsWith(">") || this.operator.startsWith("<") && s.operator.startsWith("<") || this.semver.version === s.semver.version && this.operator.includes("=") && s.operator.includes("=") || f(this.semver, "<", s.semver, c) && this.operator.startsWith(">") && s.operator.startsWith("<") || f(this.semver, ">", s.semver, c) && this.operator.startsWith("<") && s.operator.startsWith(">")));
		}
	};
	var l = require_parse_options(), { safeRe: u, t: d } = require_re(), f = require_cmp(), p = require_debug(), m = require_semver$1(), h = require_range();
})), require_satisfies = /* @__PURE__ */ __commonJSMin(((e, s) => {
	var c = require_range();
	s.exports = (e, s, l) => {
		try {
			s = new c(s, l);
		} catch {
			return !1;
		}
		return s.test(e);
	};
})), require_to_comparators = /* @__PURE__ */ __commonJSMin(((e, s) => {
	var c = require_range();
	s.exports = (e, s) => new c(e, s).set.map((e) => e.map((e) => e.value).join(" ").trim().split(" "));
})), require_max_satisfying = /* @__PURE__ */ __commonJSMin(((e, s) => {
	var c = require_semver$1(), l = require_range();
	s.exports = (e, s, u) => {
		let d = null, f = null, p = null;
		try {
			p = new l(s, u);
		} catch {
			return null;
		}
		return e.forEach((e) => {
			p.test(e) && (!d || f.compare(e) === -1) && (d = e, f = new c(d, u));
		}), d;
	};
})), require_min_satisfying = /* @__PURE__ */ __commonJSMin(((e, s) => {
	var c = require_semver$1(), l = require_range();
	s.exports = (e, s, u) => {
		let d = null, f = null, p = null;
		try {
			p = new l(s, u);
		} catch {
			return null;
		}
		return e.forEach((e) => {
			p.test(e) && (!d || f.compare(e) === 1) && (d = e, f = new c(d, u));
		}), d;
	};
})), require_min_version = /* @__PURE__ */ __commonJSMin(((e, s) => {
	var c = require_semver$1(), l = require_range(), u = require_gt();
	s.exports = (e, s) => {
		e = new l(e, s);
		let d = new c("0.0.0");
		if (e.test(d) || (d = new c("0.0.0-0"), e.test(d))) return d;
		d = null;
		for (let s = 0; s < e.set.length; ++s) {
			let l = e.set[s], f = null;
			l.forEach((e) => {
				let s = new c(e.semver.version);
				switch (e.operator) {
					case ">": s.prerelease.length === 0 ? s.patch++ : s.prerelease.push(0), s.raw = s.format();
					case "":
					case ">=":
						(!f || u(s, f)) && (f = s);
						break;
					case "<":
					case "<=": break;
					default: throw Error(`Unexpected operation: ${e.operator}`);
				}
			}), f && (!d || u(d, f)) && (d = f);
		}
		return d && e.test(d) ? d : null;
	};
})), require_valid = /* @__PURE__ */ __commonJSMin(((e, s) => {
	var c = require_range();
	s.exports = (e, s) => {
		try {
			return new c(e, s).range || "*";
		} catch {
			return null;
		}
	};
})), require_outside = /* @__PURE__ */ __commonJSMin(((e, s) => {
	var c = require_semver$1(), l = require_comparator(), { ANY: u } = l, d = require_range(), f = require_satisfies(), p = require_gt(), m = require_lt(), h = require_lte(), g = require_gte();
	s.exports = (e, s, _, v) => {
		e = new c(e, v), s = new d(s, v);
		let y, b, x, S, C;
		switch (_) {
			case ">":
				y = p, b = h, x = m, S = ">", C = ">=";
				break;
			case "<":
				y = m, b = g, x = p, S = "<", C = "<=";
				break;
			default: throw TypeError("Must provide a hilo val of \"<\" or \">\"");
		}
		if (f(e, s, v)) return !1;
		for (let c = 0; c < s.set.length; ++c) {
			let d = s.set[c], f = null, p = null;
			if (d.forEach((e) => {
				e.semver === u && (e = new l(">=0.0.0")), f ||= e, p ||= e, y(e.semver, f.semver, v) ? f = e : x(e.semver, p.semver, v) && (p = e);
			}), f.operator === S || f.operator === C || (!p.operator || p.operator === S) && b(e, p.semver) || p.operator === C && x(e, p.semver)) return !1;
		}
		return !0;
	};
})), require_gtr = /* @__PURE__ */ __commonJSMin(((e, s) => {
	var c = require_outside();
	s.exports = (e, s, l) => c(e, s, ">", l);
})), require_ltr = /* @__PURE__ */ __commonJSMin(((e, s) => {
	var c = require_outside();
	s.exports = (e, s, l) => c(e, s, "<", l);
})), require_intersects = /* @__PURE__ */ __commonJSMin(((e, s) => {
	var c = require_range();
	s.exports = (e, s, l) => (e = new c(e, l), s = new c(s, l), e.intersects(s, l));
})), require_simplify = /* @__PURE__ */ __commonJSMin(((e, s) => {
	var c = require_satisfies(), l = require_compare();
	s.exports = (e, s, u) => {
		let d = [], f = null, p = null, m = e.sort((e, s) => l(e, s, u));
		for (let e of m) c(e, s, u) ? (p = e, f ||= e) : (p && d.push([f, p]), p = null, f = null);
		f && d.push([f, null]);
		let h = [];
		for (let [e, s] of d) e === s ? h.push(e) : !s && e === m[0] ? h.push("*") : s ? e === m[0] ? h.push(`<=${s}`) : h.push(`${e} - ${s}`) : h.push(`>=${e}`);
		let g = h.join(" || "), _ = typeof s.raw == "string" ? s.raw : String(s);
		return g.length < _.length ? g : s;
	};
})), require_subset = /* @__PURE__ */ __commonJSMin(((e, s) => {
	var c = require_range(), l = require_comparator(), { ANY: u } = l, d = require_satisfies(), f = require_compare(), p = (e, s, l = {}) => {
		if (e === s) return !0;
		e = new c(e, l), s = new c(s, l);
		let u = !1;
		OUTER: for (let c of e.set) {
			for (let e of s.set) {
				let s = g(c, e, l);
				if (u ||= s !== null, s) continue OUTER;
			}
			if (u) return !1;
		}
		return !0;
	}, m = [new l(">=0.0.0-0")], h = [new l(">=0.0.0")], g = (e, s, c) => {
		if (e === s) return !0;
		if (e.length === 1 && e[0].semver === u) {
			if (s.length === 1 && s[0].semver === u) return !0;
			e = c.includePrerelease ? m : h;
		}
		if (s.length === 1 && s[0].semver === u) {
			if (c.includePrerelease) return !0;
			s = h;
		}
		let l = /* @__PURE__ */ new Set(), p, g;
		for (let s of e) s.operator === ">" || s.operator === ">=" ? p = _(p, s, c) : s.operator === "<" || s.operator === "<=" ? g = v(g, s, c) : l.add(s.semver);
		if (l.size > 1) return null;
		let y;
		if (p && g && (y = f(p.semver, g.semver, c), y > 0 || y === 0 && (p.operator !== ">=" || g.operator !== "<="))) return null;
		for (let e of l) {
			if (p && !d(e, String(p), c) || g && !d(e, String(g), c)) return null;
			for (let l of s) if (!d(e, String(l), c)) return !1;
			return !0;
		}
		let b, x, S, C, w = g && !c.includePrerelease && g.semver.prerelease.length ? g.semver : !1, T = p && !c.includePrerelease && p.semver.prerelease.length ? p.semver : !1;
		w && w.prerelease.length === 1 && g.operator === "<" && w.prerelease[0] === 0 && (w = !1);
		for (let e of s) {
			if (C = C || e.operator === ">" || e.operator === ">=", S = S || e.operator === "<" || e.operator === "<=", p) {
				if (T && e.semver.prerelease && e.semver.prerelease.length && e.semver.major === T.major && e.semver.minor === T.minor && e.semver.patch === T.patch && (T = !1), e.operator === ">" || e.operator === ">=") {
					if (b = _(p, e, c), b === e && b !== p) return !1;
				} else if (p.operator === ">=" && !d(p.semver, String(e), c)) return !1;
			}
			if (g) {
				if (w && e.semver.prerelease && e.semver.prerelease.length && e.semver.major === w.major && e.semver.minor === w.minor && e.semver.patch === w.patch && (w = !1), e.operator === "<" || e.operator === "<=") {
					if (x = v(g, e, c), x === e && x !== g) return !1;
				} else if (g.operator === "<=" && !d(g.semver, String(e), c)) return !1;
			}
			if (!e.operator && (g || p) && y !== 0) return !1;
		}
		return !(p && S && !g && y !== 0 || g && C && !p && y !== 0 || T || w);
	}, _ = (e, s, c) => {
		if (!e) return s;
		let l = f(e.semver, s.semver, c);
		return l > 0 ? e : l < 0 || s.operator === ">" && e.operator === ">=" ? s : e;
	}, v = (e, s, c) => {
		if (!e) return s;
		let l = f(e.semver, s.semver, c);
		return l < 0 ? e : l > 0 || s.operator === "<" && e.operator === "<=" ? s : e;
	};
	s.exports = p;
})), import_semver = /* @__PURE__ */ __toESM((/* @__PURE__ */ __commonJSMin(((e, s) => {
	var c = require_re(), l = require_constants(), u = require_semver$1(), d = require_identifiers();
	s.exports = {
		parse: require_parse(),
		valid: require_valid$1(),
		clean: require_clean(),
		inc: require_inc(),
		diff: require_diff(),
		major: require_major(),
		minor: require_minor(),
		patch: require_patch(),
		prerelease: require_prerelease(),
		compare: require_compare(),
		rcompare: require_rcompare(),
		compareLoose: require_compare_loose(),
		compareBuild: require_compare_build(),
		sort: require_sort(),
		rsort: require_rsort(),
		gt: require_gt(),
		lt: require_lt(),
		eq: require_eq(),
		neq: require_neq(),
		gte: require_gte(),
		lte: require_lte(),
		cmp: require_cmp(),
		coerce: require_coerce(),
		Comparator: require_comparator(),
		Range: require_range(),
		satisfies: require_satisfies(),
		toComparators: require_to_comparators(),
		maxSatisfying: require_max_satisfying(),
		minSatisfying: require_min_satisfying(),
		minVersion: require_min_version(),
		validRange: require_valid(),
		outside: require_outside(),
		gtr: require_gtr(),
		ltr: require_ltr(),
		intersects: require_intersects(),
		simplifyRange: require_simplify(),
		subset: require_subset(),
		SemVer: u,
		re: c.re,
		src: c.src,
		tokens: c.t,
		SEMVER_SPEC_VERSION: l.SEMVER_SPEC_VERSION,
		RELEASE_TYPES: l.RELEASE_TYPES,
		compareIdentifiers: d.compareIdentifiers,
		rcompareIdentifiers: d.rcompareIdentifiers
	};
})))(), 1), objectToString = Object.prototype.toString, uint8ArrayStringified = "[object Uint8Array]", arrayBufferStringified = "[object ArrayBuffer]";
function isType(e, s, c) {
	return e ? e.constructor === s ? !0 : objectToString.call(e) === c : !1;
}
function isUint8Array(e) {
	return isType(e, Uint8Array, uint8ArrayStringified);
}
function isArrayBuffer(e) {
	return isType(e, ArrayBuffer, arrayBufferStringified);
}
function isUint8ArrayOrArrayBuffer(e) {
	return isUint8Array(e) || isArrayBuffer(e);
}
function assertUint8Array(e) {
	if (!isUint8Array(e)) throw TypeError(`Expected \`Uint8Array\`, got \`${typeof e}\``);
}
function assertUint8ArrayOrArrayBuffer(e) {
	if (!isUint8ArrayOrArrayBuffer(e)) throw TypeError(`Expected \`Uint8Array\` or \`ArrayBuffer\`, got \`${typeof e}\``);
}
function concatUint8Arrays(e, s) {
	if (e.length === 0) return new Uint8Array();
	s ??= e.reduce((e, s) => e + s.length, 0);
	let c = new Uint8Array(s), l = 0;
	for (let s of e) assertUint8Array(s), c.set(s, l), l += s.length;
	return c;
}
var cachedDecoders = { utf8: new globalThis.TextDecoder("utf8") };
function uint8ArrayToString(e, s = "utf8") {
	return assertUint8ArrayOrArrayBuffer(e), cachedDecoders[s] ??= new globalThis.TextDecoder(s), cachedDecoders[s].decode(e);
}
function assertString(e) {
	if (typeof e != "string") throw TypeError(`Expected \`string\`, got \`${typeof e}\``);
}
var cachedEncoder = new globalThis.TextEncoder();
function stringToUint8Array(e) {
	return assertString(e), cachedEncoder.encode(e);
}
Array.from({ length: 256 }, (e, s) => s.toString(16).padStart(2, "0"));
var ajvFormats = import_dist.default.default, encryptionAlgorithm = "aes-256-cbc", createPlainObject = () => Object.create(null), isExist = (e) => e != null, checkValueType = (e, s) => {
	let c = new Set([
		"undefined",
		"symbol",
		"function"
	]), l = typeof s;
	if (c.has(l)) throw TypeError(`Setting a value of type \`${l}\` for key \`${e}\` is not allowed as it's not supported by JSON`);
}, INTERNAL_KEY = "__internal__", MIGRATION_KEY = `${INTERNAL_KEY}.migrations.version`, Conf = class {
	path;
	events;
	#e;
	#t;
	#n;
	#r = {};
	constructor(e = {}) {
		let s = {
			configName: "config",
			fileExtension: "json",
			projectSuffix: "nodejs",
			clearInvalidConfig: !1,
			accessPropertiesByDotNotation: !0,
			configFileMode: 438,
			...e
		};
		if (!s.cwd) {
			if (!s.projectName) throw Error("Please specify the `projectName` option.");
			s.cwd = envPaths(s.projectName, { suffix: s.projectSuffix }).config;
		}
		if (this.#n = s, s.schema ?? s.ajvOptions ?? s.rootSchema) {
			if (s.schema && typeof s.schema != "object") throw TypeError("The `schema` option must be an object.");
			let e = new import__2020.Ajv2020({
				allErrors: !0,
				useDefaults: !0,
				...s.ajvOptions
			});
			ajvFormats(e);
			let c = {
				...s.rootSchema,
				type: "object",
				properties: s.schema
			};
			this.#e = e.compile(c);
			for (let [e, c] of Object.entries(s.schema ?? {})) c?.default && (this.#r[e] = c.default);
		}
		s.defaults && (this.#r = {
			...this.#r,
			...s.defaults
		}), s.serialize && (this._serialize = s.serialize), s.deserialize && (this._deserialize = s.deserialize), this.events = new EventTarget(), this.#t = s.encryptionKey;
		let c = s.fileExtension ? `.${s.fileExtension}` : "";
		this.path = path.resolve(s.cwd, `${s.configName ?? "config"}${c}`);
		let l = this.store, u = Object.assign(createPlainObject(), s.defaults, l);
		if (s.migrations) {
			if (!s.projectVersion) throw Error("Please specify the `projectVersion` option.");
			this._migrate(s.migrations, s.projectVersion, s.beforeEachMigration);
		}
		this._validate(u);
		try {
			assert.deepEqual(l, u);
		} catch {
			this.store = u;
		}
		s.watch && this._watch();
	}
	get(e, s) {
		if (this.#n.accessPropertiesByDotNotation) return this._get(e, s);
		let { store: c } = this;
		return e in c ? c[e] : s;
	}
	set(e, s) {
		if (typeof e != "string" && typeof e != "object") throw TypeError(`Expected \`key\` to be of type \`string\` or \`object\`, got ${typeof e}`);
		if (typeof e != "object" && s === void 0) throw TypeError("Use `delete()` to clear values");
		if (this._containsReservedKey(e)) throw TypeError(`Please don't use the ${INTERNAL_KEY} key, as it's used to manage this module internal operations.`);
		let { store: c } = this, l = (e, s) => {
			checkValueType(e, s), this.#n.accessPropertiesByDotNotation ? setProperty(c, e, s) : c[e] = s;
		};
		if (typeof e == "object") {
			let s = e;
			for (let [e, c] of Object.entries(s)) l(e, c);
		} else l(e, s);
		this.store = c;
	}
	has(e) {
		return this.#n.accessPropertiesByDotNotation ? hasProperty(this.store, e) : e in this.store;
	}
	reset(...e) {
		for (let s of e) isExist(this.#r[s]) && this.set(s, this.#r[s]);
	}
	delete(e) {
		let { store: s } = this;
		this.#n.accessPropertiesByDotNotation ? deleteProperty(s, e) : delete s[e], this.store = s;
	}
	clear() {
		this.store = createPlainObject();
		for (let e of Object.keys(this.#r)) this.reset(e);
	}
	onDidChange(e, s) {
		if (typeof e != "string") throw TypeError(`Expected \`key\` to be of type \`string\`, got ${typeof e}`);
		if (typeof s != "function") throw TypeError(`Expected \`callback\` to be of type \`function\`, got ${typeof s}`);
		return this._handleChange(() => this.get(e), s);
	}
	onDidAnyChange(e) {
		if (typeof e != "function") throw TypeError(`Expected \`callback\` to be of type \`function\`, got ${typeof e}`);
		return this._handleChange(() => this.store, e);
	}
	get size() {
		return Object.keys(this.store).length;
	}
	get store() {
		try {
			let e = fs.readFileSync(this.path, this.#t ? null : "utf8"), s = this._encryptData(e), c = this._deserialize(s);
			return this._validate(c), Object.assign(createPlainObject(), c);
		} catch (e) {
			if (e?.code === "ENOENT") return this._ensureDirectory(), createPlainObject();
			if (this.#n.clearInvalidConfig && e.name === "SyntaxError") return createPlainObject();
			throw e;
		}
	}
	set store(e) {
		this._ensureDirectory(), this._validate(e), this._write(e), this.events.dispatchEvent(new Event("change"));
	}
	*[Symbol.iterator]() {
		for (let [e, s] of Object.entries(this.store)) yield [e, s];
	}
	_encryptData(e) {
		if (!this.#t) return typeof e == "string" ? e : uint8ArrayToString(e);
		try {
			let s = e.slice(0, 16), c = crypto.pbkdf2Sync(this.#t, s.toString(), 1e4, 32, "sha512"), l = crypto.createDecipheriv(encryptionAlgorithm, c, s), u = e.slice(17), d = typeof u == "string" ? stringToUint8Array(u) : u;
			return uint8ArrayToString(concatUint8Arrays([l.update(d), l.final()]));
		} catch {}
		return e.toString();
	}
	_handleChange(e, s) {
		let c = e(), l = () => {
			let l = c, u = e();
			isDeepStrictEqual(u, l) || (c = u, s.call(this, u, l));
		};
		return this.events.addEventListener("change", l), () => {
			this.events.removeEventListener("change", l);
		};
	}
	_deserialize = (e) => JSON.parse(e);
	_serialize = (e) => JSON.stringify(e, void 0, "	");
	_validate(e) {
		if (!this.#e || this.#e(e) || !this.#e.errors) return;
		let s = this.#e.errors.map(({ instancePath: e, message: s = "" }) => `\`${e.slice(1)}\` ${s}`);
		throw Error("Config schema violation: " + s.join("; "));
	}
	_ensureDirectory() {
		fs.mkdirSync(path.dirname(this.path), { recursive: !0 });
	}
	_write(e) {
		let s = this._serialize(e);
		if (this.#t) {
			let e = crypto.randomBytes(16), c = crypto.pbkdf2Sync(this.#t, e.toString(), 1e4, 32, "sha512"), l = crypto.createCipheriv(encryptionAlgorithm, c, e);
			s = concatUint8Arrays([
				e,
				stringToUint8Array(":"),
				l.update(stringToUint8Array(s)),
				l.final()
			]);
		}
		if (process$1.env.SNAP) fs.writeFileSync(this.path, s, { mode: this.#n.configFileMode });
		else try {
			writeFileSync(this.path, s, { mode: this.#n.configFileMode });
		} catch (e) {
			if (e?.code === "EXDEV") {
				fs.writeFileSync(this.path, s, { mode: this.#n.configFileMode });
				return;
			}
			throw e;
		}
	}
	_watch() {
		this._ensureDirectory(), fs.existsSync(this.path) || this._write(createPlainObject()), process$1.platform === "win32" ? fs.watch(this.path, { persistent: !1 }, debounce_fn_default(() => {
			this.events.dispatchEvent(new Event("change"));
		}, { wait: 100 })) : fs.watchFile(this.path, { persistent: !1 }, debounce_fn_default(() => {
			this.events.dispatchEvent(new Event("change"));
		}, { wait: 5e3 }));
	}
	_migrate(e, s, c) {
		let l = this._get(MIGRATION_KEY, "0.0.0"), u = Object.keys(e).filter((e) => this._shouldPerformMigration(e, l, s)), d = { ...this.store };
		for (let f of u) try {
			c && c(this, {
				fromVersion: l,
				toVersion: f,
				finalVersion: s,
				versions: u
			});
			let p = e[f];
			p?.(this), this._set(MIGRATION_KEY, f), l = f, d = { ...this.store };
		} catch (e) {
			throw this.store = d, Error(`Something went wrong during the migration! Changes applied to the store until this failed migration will be restored. ${e}`);
		}
		(this._isVersionInRangeFormat(l) || !import_semver.default.eq(l, s)) && this._set(MIGRATION_KEY, s);
	}
	_containsReservedKey(e) {
		return typeof e == "object" && Object.keys(e)[0] === INTERNAL_KEY ? !0 : typeof e == "string" && this.#n.accessPropertiesByDotNotation ? !!e.startsWith(`${INTERNAL_KEY}.`) : !1;
	}
	_isVersionInRangeFormat(e) {
		return import_semver.default.clean(e) === null;
	}
	_shouldPerformMigration(e, s, c) {
		return this._isVersionInRangeFormat(e) ? s !== "0.0.0" && import_semver.default.satisfies(s, e) ? !1 : import_semver.default.satisfies(c, e) : !(import_semver.default.lte(e, s) || import_semver.default.gt(e, c));
	}
	_get(e, s) {
		return getProperty(this.store, e, s);
	}
	_set(e, s) {
		let { store: c } = this;
		setProperty(c, e, s), this.store = c;
	}
}, { app: app$1, ipcMain: ipcMain$1, shell } = electron, isInitialized = !1, initDataListener = () => {
	if (!ipcMain$1 || !app$1) throw Error("Electron Store: You need to call `.initRenderer()` from the main process.");
	let e = {
		defaultCwd: app$1.getPath("userData"),
		appVersion: app$1.getVersion()
	};
	return isInitialized ? e : (ipcMain$1.on("electron-store-get-data", (s) => {
		s.returnValue = e;
	}), isInitialized = !0, e);
}, store = new class extends Conf {
	constructor(s) {
		let c, l;
		if (process$1.type === "renderer") {
			let s = electron.ipcRenderer.sendSync("electron-store-get-data");
			if (!s) throw Error("Electron Store: You need to call `.initRenderer()` from the main process.");
			({defaultCwd: c, appVersion: l} = s);
		} else ipcMain$1 && app$1 && ({defaultCwd: c, appVersion: l} = initDataListener());
		s = {
			name: "config",
			...s
		}, s.projectVersion ||= l, s.cwd ? s.cwd = path.isAbsolute(s.cwd) ? s.cwd : path.join(c, s.cwd) : s.cwd = c, s.configName = s.name, delete s.name, super(s);
	}
	static initRenderer() {
		initDataListener();
	}
	async openInEditor() {
		let e = await shell.openPath(this.path);
		if (e) throw Error(e);
	}
}(), __dirname = dirname(fileURLToPath(import.meta.url));
process.env.DIST = join(__dirname, "../dist"), process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : join(process.env.DIST, "../public");
var win, tray = null, VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL, TRAY_ICON_PATH = join(process.env.VITE_PUBLIC || "", "tray-icon.png");
function createTray() {
	tray || (tray = new Tray(nativeImage.createFromPath(TRAY_ICON_PATH).resize({
		width: 22,
		height: 22
	})), tray.setToolTip("DevTools 2"), updateTrayMenu(), tray.on("double-click", () => {
		toggleWindow();
	}));
}
function toggleWindow() {
	win && (win.isVisible() ? win.hide() : win.show(), updateTrayMenu());
}
var recentTools = [];
function updateTrayMenu() {
	if (!tray) return;
	let e = [{
		label: win?.isVisible() ? "Hide Window" : "Show Window",
		click: () => {
			win && (win.isVisible() ? win.hide() : win.show(), updateTrayMenu());
		}
	}, { type: "separator" }];
	e.push({
		label: "Quick Actions",
		submenu: [{
			label: "Generate UUID",
			click: () => {
				let e = randomUUID();
				clipboard.writeText(e), new Notification({
					title: "UUID Generated",
					body: "Copied to clipboard"
				}).show();
			}
		}, {
			label: "Format JSON from Clipboard",
			click: () => {
				try {
					let e = clipboard.readText(), s = JSON.parse(e), c = JSON.stringify(s, null, 2);
					clipboard.writeText(c), new Notification({
						title: "JSON Formatted",
						body: "Formatted JSON copied to clipboard"
					}).show();
				} catch {
					new Notification({
						title: "JSON Format Failed",
						body: "Clipboard does not contain valid JSON"
					}).show();
				}
			}
		}]
	}), e.push({ type: "separator" }), recentTools.length > 0 && (e.push({
		label: "Recent Tools",
		enabled: !1
	}), recentTools.forEach((s) => {
		e.push({
			label: s.name,
			click: () => {
				win?.show(), win?.webContents.send("navigate-to", s.id);
			}
		});
	}), e.push({ type: "separator" })), e.push({
		label: "Quit",
		click: () => {
			app.isQuitting = !0, app.quit();
		}
	});
	let s = Menu.buildFromTemplate(e);
	tray.setContextMenu(s);
}
function createWindow() {
	let e = store.get("windowBounds") || {
		width: 1200,
		height: 800
	}, c = store.get("startMinimized") || !1;
	win = new BrowserWindow({
		icon: join(process.env.VITE_PUBLIC || "", "electron-vite.svg"),
		webPreferences: {
			preload: join(__dirname, "preload.mjs"),
			nodeIntegration: !0,
			contextIsolation: !0
		},
		...e,
		minWidth: 900,
		minHeight: 600,
		show: !c,
		frame: !1,
		transparent: !0,
		titleBarStyle: "hidden",
		vibrancy: "sidebar",
		trafficLightPosition: {
			x: 15,
			y: 15
		}
	});
	let l = () => {
		store.set("windowBounds", win?.getBounds());
	};
	win.on("resize", l), win.on("move", l), win.on("close", (e) => {
		let s = store.get("minimizeToTray") ?? !0;
		return !app.isQuitting && s && (e.preventDefault(), win?.hide(), updateTrayMenu()), !1;
	}), win.on("show", updateTrayMenu), win.on("hide", updateTrayMenu), ipcMain.handle("store-get", (e, s) => store.get(s)), ipcMain.handle("store-set", (e, s, c) => {
		store.set(s, c), s === "launchAtLogin" && app.setLoginItemSettings({
			openAtLogin: c === !0,
			openAsHidden: !0
		});
	}), ipcMain.handle("store-delete", (e, s) => store.delete(s)), ipcMain.on("tray-update-menu", (e, s) => {
		recentTools = s || [], updateTrayMenu();
	}), win.webContents.on("did-finish-load", () => {
		win?.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
	}), VITE_DEV_SERVER_URL ? win.loadURL(VITE_DEV_SERVER_URL) : win.loadFile(join(process.env.DIST || "", "index.html"));
}
app.on("window-all-closed", () => {
	process.platform !== "darwin" && app.quit();
}), app.on("activate", () => {
	BrowserWindow.getAllWindows().length === 0 ? createWindow() : win && win.show();
}), app.on("before-quit", () => {
	app.isQuitting = !0;
}), app.whenReady().then(() => {
	try {
		globalShortcut.register("CommandOrControl+Shift+D", () => {
			toggleWindow();
		});
	} catch (e) {
		console.error("Failed to register global shortcut", e);
	}
	let e = store.get("launchAtLogin");
	app.setLoginItemSettings({
		openAtLogin: e === !0,
		openAsHidden: !0
	}), createTray(), createWindow();
});
