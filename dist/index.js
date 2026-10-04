import e, { createContext as t, createElement as n, forwardRef as r, useContext as i, useEffect as a, useImperativeHandle as o, useRef as s, useState as c } from "react";
import { Application as l, BlurFilter as u, Color as d, Container as f, DEG_TO_RAD as p, FillGradient as m, Filter as h, GlProgram as g, GpuProgram as _, Graphics as v, Matrix as y, Rectangle as b, Sprite as ee, Texture as x, TexturePool as S, defaultFilterVert as C, deprecation as te } from "pixi.js";
import { Fragment as w, jsx as T, jsxs as E } from "react/jsx-runtime";
//#region \0rolldown/runtime.js
var ne = Object.create, re = Object.defineProperty, ie = Object.getOwnPropertyDescriptor, ae = Object.getOwnPropertyNames, oe = Object.getPrototypeOf, se = Object.prototype.hasOwnProperty, D = (e, t) => () => (t || (e((t = { exports: {} }).exports, t), e = null), t.exports), O = (e, t, n, r) => {
	if (t && typeof t == "object" || typeof t == "function") for (var i = ae(t), a = 0, o = i.length, s; a < o; a++) s = i[a], !se.call(e, s) && s !== n && re(e, s, {
		get: ((e) => t[e]).bind(null, s),
		enumerable: !(r = ie(t, s)) || r.enumerable
	});
	return e;
}, ce = (e, t, n) => (n = e == null ? {} : ne(oe(e)), O(t || !e || !e.__esModule ? re(n, "default", {
	value: e,
	enumerable: !0
}) : n, e)), le;
function k(e, t, n) {
	function r(n, r) {
		if (n._zod || Object.defineProperty(n, "_zod", {
			value: {
				def: r,
				constr: o,
				traits: /* @__PURE__ */ new Set()
			},
			enumerable: !1
		}), n._zod.traits.has(e)) return;
		n._zod.traits.add(e), t(n, r);
		let i = o.prototype, a = Object.keys(i);
		for (let e = 0; e < a.length; e++) {
			let t = a[e];
			t in n || (n[t] = i[t].bind(n));
		}
	}
	let i = n?.Parent ?? Object;
	class a extends i {}
	Object.defineProperty(a, "name", { value: e });
	function o(e) {
		var t;
		let i = n?.Parent ? new a() : this;
		r(i, e), (t = i._zod).deferred ?? (t.deferred = []);
		for (let e of i._zod.deferred) e();
		return i;
	}
	return Object.defineProperty(o, "init", { value: r }), Object.defineProperty(o, Symbol.hasInstance, { value: (t) => n?.Parent && t instanceof n.Parent ? !0 : t?._zod?.traits?.has(e) }), Object.defineProperty(o, "name", { value: e }), o;
}
var A = class extends Error {
	constructor() {
		super("Encountered Promise during synchronous parse. Use .parseAsync() instead.");
	}
}, ue = class extends Error {
	constructor(e) {
		super(`Encountered unidirectional transform during encode: ${e}`), this.name = "ZodEncodeError";
	}
};
(le = globalThis).__zod_globalConfig ?? (le.__zod_globalConfig = {});
var de = globalThis.__zod_globalConfig;
function fe(e) {
	return e && Object.assign(de, e), de;
}
//#endregion
//#region node_modules/.pnpm/zod@4.4.3/node_modules/zod/v4/core/util.js
function j(e) {
	let t = Object.values(e).filter((e) => typeof e == "number");
	return Object.entries(e).filter(([e, n]) => t.indexOf(+e) === -1).map(([e, t]) => t);
}
function pe(e, t) {
	return typeof t == "bigint" ? t.toString() : t;
}
function me(e) {
	return { get value() {
		{
			let t = e();
			return Object.defineProperty(this, "value", { value: t }), t;
		}
		throw Error("cached value already set");
	} };
}
function he(e) {
	return e == null;
}
function ge(e) {
	let t = +!!e.startsWith("^"), n = e.endsWith("$") ? e.length - 1 : e.length;
	return e.slice(t, n);
}
function _e(e, t) {
	let n = e / t, r = Math.round(n), i = 2 ** -52 * Math.max(Math.abs(n), 1);
	return Math.abs(n - r) < i ? 0 : n - r;
}
var M = /* @__PURE__*/ Symbol("evaluating");
function N(e, t, n) {
	let r;
	Object.defineProperty(e, t, {
		get() {
			if (r !== M) return r === void 0 && (r = M, r = n()), r;
		},
		set(n) {
			Object.defineProperty(e, t, { value: n });
		},
		configurable: !0
	});
}
function ve(e, t, n) {
	Object.defineProperty(e, t, {
		value: n,
		writable: !0,
		enumerable: !0,
		configurable: !0
	});
}
function ye(...e) {
	let t = {};
	for (let n of e) {
		let e = Object.getOwnPropertyDescriptors(n);
		Object.assign(t, e);
	}
	return Object.defineProperties({}, t);
}
function be(e) {
	return JSON.stringify(e);
}
function xe(e) {
	return e.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
}
var Se = "captureStackTrace" in Error ? Error.captureStackTrace : (...e) => {};
function Ce(e) {
	return typeof e == "object" && !!e && !Array.isArray(e);
}
var we = /* @__PURE__*/ me(() => {
	if (de.jitless || typeof navigator < "u" && navigator?.userAgent?.includes("Cloudflare")) return !1;
	try {
		return Function(""), !0;
	} catch {
		return !1;
	}
});
function Te(e) {
	if (Ce(e) === !1) return !1;
	let t = e.constructor;
	if (t === void 0 || typeof t != "function") return !0;
	let n = t.prototype;
	return !(Ce(n) === !1 || Object.prototype.hasOwnProperty.call(n, "isPrototypeOf") === !1);
}
function Ee(e) {
	return Te(e) ? { ...e } : Array.isArray(e) ? [...e] : e instanceof Map ? new Map(e) : e instanceof Set ? new Set(e) : e;
}
var De = /* @__PURE__*/ new Set([
	"string",
	"number",
	"symbol"
]);
function P(e) {
	return e.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function Oe(e, t, n) {
	let r = new e._zod.constr(t ?? e._zod.def);
	return (!t || n?.parent) && (r._zod.parent = e), r;
}
function F(e) {
	let t = e;
	if (!t) return {};
	if (typeof t == "string") return { error: () => t };
	if (t?.message !== void 0) {
		if (t?.error !== void 0) throw Error("Cannot specify both `message` and `error` params");
		t.error = t.message;
	}
	return delete t.message, typeof t.error == "string" ? {
		...t,
		error: () => t.error
	} : t;
}
function ke(e) {
	return Object.keys(e).filter((t) => e[t]._zod.optin === "optional" && e[t]._zod.optout === "optional");
}
var Ae = {
	safeint: [-(2 ** 53 - 1), 2 ** 53 - 1],
	int32: [-2147483648, 2147483647],
	uint32: [0, 4294967295],
	float32: [-34028234663852886e22, 34028234663852886e22],
	float64: [-Number.MAX_VALUE, Number.MAX_VALUE]
};
function je(e, t) {
	let n = e._zod.def, r = n.checks;
	if (r && r.length > 0) throw Error(".pick() cannot be used on object schemas containing refinements");
	return Oe(e, ye(e._zod.def, {
		get shape() {
			let e = {};
			for (let r in t) {
				if (!(r in n.shape)) throw Error(`Unrecognized key: "${r}"`);
				t[r] && (e[r] = n.shape[r]);
			}
			return ve(this, "shape", e), e;
		},
		checks: []
	}));
}
function Me(e, t) {
	let n = e._zod.def, r = n.checks;
	if (r && r.length > 0) throw Error(".omit() cannot be used on object schemas containing refinements");
	return Oe(e, ye(e._zod.def, {
		get shape() {
			let r = { ...e._zod.def.shape };
			for (let e in t) {
				if (!(e in n.shape)) throw Error(`Unrecognized key: "${e}"`);
				t[e] && delete r[e];
			}
			return ve(this, "shape", r), r;
		},
		checks: []
	}));
}
function Ne(e, t) {
	if (!Te(t)) throw Error("Invalid input to extend: expected a plain object");
	let n = e._zod.def.checks;
	if (n && n.length > 0) {
		let n = e._zod.def.shape;
		for (let e in t) if (Object.getOwnPropertyDescriptor(n, e) !== void 0) throw Error("Cannot overwrite keys on object schemas containing refinements. Use `.safeExtend()` instead.");
	}
	return Oe(e, ye(e._zod.def, { get shape() {
		let n = {
			...e._zod.def.shape,
			...t
		};
		return ve(this, "shape", n), n;
	} }));
}
function Pe(e, t) {
	if (!Te(t)) throw Error("Invalid input to safeExtend: expected a plain object");
	return Oe(e, ye(e._zod.def, { get shape() {
		let n = {
			...e._zod.def.shape,
			...t
		};
		return ve(this, "shape", n), n;
	} }));
}
function I(e, t) {
	if (e._zod.def.checks?.length) throw Error(".merge() cannot be used on object schemas containing refinements. Use .safeExtend() instead.");
	return Oe(e, ye(e._zod.def, {
		get shape() {
			let n = {
				...e._zod.def.shape,
				...t._zod.def.shape
			};
			return ve(this, "shape", n), n;
		},
		get catchall() {
			return t._zod.def.catchall;
		},
		checks: t._zod.def.checks ?? []
	}));
}
function Fe(e, t, n) {
	let r = t._zod.def.checks;
	if (r && r.length > 0) throw Error(".partial() cannot be used on object schemas containing refinements");
	return Oe(t, ye(t._zod.def, {
		get shape() {
			let r = t._zod.def.shape, i = { ...r };
			if (n) for (let t in n) {
				if (!(t in r)) throw Error(`Unrecognized key: "${t}"`);
				n[t] && (i[t] = e ? new e({
					type: "optional",
					innerType: r[t]
				}) : r[t]);
			}
			else for (let t in r) i[t] = e ? new e({
				type: "optional",
				innerType: r[t]
			}) : r[t];
			return ve(this, "shape", i), i;
		},
		checks: []
	}));
}
function Ie(e, t, n) {
	return Oe(t, ye(t._zod.def, { get shape() {
		let r = t._zod.def.shape, i = { ...r };
		if (n) for (let t in n) {
			if (!(t in i)) throw Error(`Unrecognized key: "${t}"`);
			n[t] && (i[t] = new e({
				type: "nonoptional",
				innerType: r[t]
			}));
		}
		else for (let t in r) i[t] = new e({
			type: "nonoptional",
			innerType: r[t]
		});
		return ve(this, "shape", i), i;
	} }));
}
function Le(e, t = 0) {
	if (e.aborted === !0) return !0;
	for (let n = t; n < e.issues.length; n++) if (e.issues[n]?.continue !== !0) return !0;
	return !1;
}
function Re(e, t = 0) {
	if (e.aborted === !0) return !0;
	for (let n = t; n < e.issues.length; n++) if (e.issues[n]?.continue === !1) return !0;
	return !1;
}
function ze(e, t) {
	return t.map((t) => {
		var n;
		return (n = t).path ?? (n.path = []), t.path.unshift(e), t;
	});
}
function Be(e) {
	return typeof e == "string" ? e : e?.message;
}
function Ve(e, t, n) {
	let r = e.message ? e.message : Be(e.inst?._zod.def?.error?.(e)) ?? Be(t?.error?.(e)) ?? Be(n.customError?.(e)) ?? Be(n.localeError?.(e)) ?? "Invalid input", { inst: i, continue: a, input: o, ...s } = e;
	return s.path ??= [], s.message = r, t?.reportInput && (s.input = o), s;
}
function He(e) {
	return Array.isArray(e) ? "array" : typeof e == "string" ? "string" : "unknown";
}
function Ue(...e) {
	let [t, n, r] = e;
	return typeof t == "string" ? {
		message: t,
		code: "custom",
		input: n,
		inst: r
	} : { ...t };
}
//#endregion
//#region node_modules/.pnpm/zod@4.4.3/node_modules/zod/v4/core/errors.js
var We = (e, t) => {
	e.name = "$ZodError", Object.defineProperty(e, "_zod", {
		value: e._zod,
		enumerable: !1
	}), Object.defineProperty(e, "issues", {
		value: t,
		enumerable: !1
	}), e.message = JSON.stringify(t, pe, 2), Object.defineProperty(e, "toString", {
		value: () => e.message,
		enumerable: !1
	});
}, Ge = k("$ZodError", We), Ke = k("$ZodError", We, { Parent: Error });
function qe(e, t = (e) => e.message) {
	let n = {}, r = [];
	for (let i of e.issues) i.path.length > 0 ? (n[i.path[0]] = n[i.path[0]] || [], n[i.path[0]].push(t(i))) : r.push(t(i));
	return {
		formErrors: r,
		fieldErrors: n
	};
}
function L(e, t = (e) => e.message) {
	let n = { _errors: [] }, r = (e, i = []) => {
		for (let a of e.issues) if (a.code === "invalid_union" && a.errors.length) a.errors.map((e) => r({ issues: e }, [...i, ...a.path]));
		else if (a.code === "invalid_key") r({ issues: a.issues }, [...i, ...a.path]);
		else if (a.code === "invalid_element") r({ issues: a.issues }, [...i, ...a.path]);
		else {
			let e = [...i, ...a.path];
			if (e.length === 0) n._errors.push(t(a));
			else {
				let r = n, i = 0;
				for (; i < e.length;) {
					let n = e[i];
					i === e.length - 1 ? (r[n] = r[n] || { _errors: [] }, r[n]._errors.push(t(a))) : r[n] = r[n] || { _errors: [] }, r = r[n], i++;
				}
			}
		}
	};
	return r(e), n;
}
//#endregion
//#region node_modules/.pnpm/zod@4.4.3/node_modules/zod/v4/core/parse.js
var Je = (e) => (t, n, r, i) => {
	let a = r ? {
		...r,
		async: !1
	} : { async: !1 }, o = t._zod.run({
		value: n,
		issues: []
	}, a);
	if (o instanceof Promise) throw new A();
	if (o.issues.length) {
		let t = new ((i?.Err) ?? e)(o.issues.map((e) => Ve(e, a, fe())));
		throw Se(t, i?.callee), t;
	}
	return o.value;
}, R = (e) => async (t, n, r, i) => {
	let a = r ? {
		...r,
		async: !0
	} : { async: !0 }, o = t._zod.run({
		value: n,
		issues: []
	}, a);
	if (o instanceof Promise && (o = await o), o.issues.length) {
		let t = new ((i?.Err) ?? e)(o.issues.map((e) => Ve(e, a, fe())));
		throw Se(t, i?.callee), t;
	}
	return o.value;
}, Ye = (e) => (t, n, r) => {
	let i = r ? {
		...r,
		async: !1
	} : { async: !1 }, a = t._zod.run({
		value: n,
		issues: []
	}, i);
	if (a instanceof Promise) throw new A();
	return a.issues.length ? {
		success: !1,
		error: new (e ?? Ge)(a.issues.map((e) => Ve(e, i, fe())))
	} : {
		success: !0,
		data: a.value
	};
}, Xe = /* @__PURE__*/ Ye(Ke), Ze = (e) => async (t, n, r) => {
	let i = r ? {
		...r,
		async: !0
	} : { async: !0 }, a = t._zod.run({
		value: n,
		issues: []
	}, i);
	return a instanceof Promise && (a = await a), a.issues.length ? {
		success: !1,
		error: new e(a.issues.map((e) => Ve(e, i, fe())))
	} : {
		success: !0,
		data: a.value
	};
}, Qe = /* @__PURE__*/ Ze(Ke), $e = (e) => (t, n, r) => {
	let i = r ? {
		...r,
		direction: "backward"
	} : { direction: "backward" };
	return Je(e)(t, n, i);
}, et = (e) => (t, n, r) => Je(e)(t, n, r), tt = (e) => async (t, n, r) => {
	let i = r ? {
		...r,
		direction: "backward"
	} : { direction: "backward" };
	return R(e)(t, n, i);
}, nt = (e) => async (t, n, r) => R(e)(t, n, r), rt = (e) => (t, n, r) => {
	let i = r ? {
		...r,
		direction: "backward"
	} : { direction: "backward" };
	return Ye(e)(t, n, i);
}, it = (e) => (t, n, r) => Ye(e)(t, n, r), at = (e) => async (t, n, r) => {
	let i = r ? {
		...r,
		direction: "backward"
	} : { direction: "backward" };
	return Ze(e)(t, n, i);
}, ot = (e) => async (t, n, r) => Ze(e)(t, n, r), st = /^[cC][0-9a-z]{6,}$/, ct = /^[0-9a-z]+$/, lt = /^[0-9A-HJKMNP-TV-Za-hjkmnp-tv-z]{26}$/, ut = /^[0-9a-vA-V]{20}$/, dt = /^[A-Za-z0-9]{27}$/, ft = /^[a-zA-Z0-9_-]{21}$/, pt = /^P(?:(\d+W)|(?!.*W)(?=\d|T\d)(\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+([.,]\d+)?S)?)?)$/, mt = /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/, ht = (e) => e ? RegExp(`^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-${e}[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})$`) : /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/, gt = /^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-\.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$/, _t = "^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$";
function vt() {
	return new RegExp(_t, "u");
}
var yt = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/, bt = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$/, xt = /^((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/([0-9]|[1-2][0-9]|3[0-2])$/, St = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|::|([0-9a-fA-F]{1,4})?::([0-9a-fA-F]{1,4}:?){0,6})\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/, Ct = /^$|^(?:[0-9a-zA-Z+/]{4})*(?:(?:[0-9a-zA-Z+/]{2}==)|(?:[0-9a-zA-Z+/]{3}=))?$/, wt = /^[A-Za-z0-9_-]*$/, Tt = /^https?$/, Et = /^\+[1-9]\d{6,14}$/, Dt = "(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))", Ot = /*@__PURE__*/ RegExp(`^${Dt}$`);
function kt(e) {
	let t = "(?:[01]\\d|2[0-3]):[0-5]\\d";
	return typeof e.precision == "number" ? e.precision === -1 ? `${t}` : e.precision === 0 ? `${t}:[0-5]\\d` : `${t}:[0-5]\\d\\.\\d{${e.precision}}` : `${t}(?::[0-5]\\d(?:\\.\\d+)?)?`;
}
function At(e) {
	return RegExp(`^${kt(e)}$`);
}
function jt(e) {
	let t = kt({ precision: e.precision }), n = ["Z"];
	e.local && n.push(""), e.offset && n.push("([+-](?:[01]\\d|2[0-3]):[0-5]\\d)");
	let r = `${t}(?:${n.join("|")})`;
	return RegExp(`^${Dt}T(?:${r})$`);
}
var Mt = (e) => {
	let t = e ? `[\\s\\S]{${e?.minimum ?? 0},${e?.maximum ?? ""}}` : "[\\s\\S]*";
	return RegExp(`^${t}$`);
}, Nt = /^-?\d+$/, Pt = /^-?\d+(?:\.\d+)?$/, Ft = /^(?:true|false)$/i, It = /^[^A-Z]*$/, Lt = /^[^a-z]*$/, Rt = /*@__PURE__*/ k("$ZodCheck", (e, t) => {
	var n;
	e._zod ??= {}, e._zod.def = t, (n = e._zod).onattach ?? (n.onattach = []);
}), zt = {
	number: "number",
	bigint: "bigint",
	object: "date"
}, Bt = /*@__PURE__*/ k("$ZodCheckLessThan", (e, t) => {
	Rt.init(e, t);
	let n = zt[typeof t.value];
	e._zod.onattach.push((e) => {
		let n = e._zod.bag, r = (t.inclusive ? n.maximum : n.exclusiveMaximum) ?? Infinity;
		t.value < r && (t.inclusive ? n.maximum = t.value : n.exclusiveMaximum = t.value);
	}), e._zod.check = (r) => {
		(t.inclusive ? r.value <= t.value : r.value < t.value) || r.issues.push({
			origin: n,
			code: "too_big",
			maximum: typeof t.value == "object" ? t.value.getTime() : t.value,
			input: r.value,
			inclusive: t.inclusive,
			inst: e,
			continue: !t.abort
		});
	};
}), Vt = /*@__PURE__*/ k("$ZodCheckGreaterThan", (e, t) => {
	Rt.init(e, t);
	let n = zt[typeof t.value];
	e._zod.onattach.push((e) => {
		let n = e._zod.bag, r = (t.inclusive ? n.minimum : n.exclusiveMinimum) ?? -Infinity;
		t.value > r && (t.inclusive ? n.minimum = t.value : n.exclusiveMinimum = t.value);
	}), e._zod.check = (r) => {
		(t.inclusive ? r.value >= t.value : r.value > t.value) || r.issues.push({
			origin: n,
			code: "too_small",
			minimum: typeof t.value == "object" ? t.value.getTime() : t.value,
			input: r.value,
			inclusive: t.inclusive,
			inst: e,
			continue: !t.abort
		});
	};
}), Ht = /*@__PURE__*/ k("$ZodCheckMultipleOf", (e, t) => {
	Rt.init(e, t), e._zod.onattach.push((e) => {
		var n;
		(n = e._zod.bag).multipleOf ?? (n.multipleOf = t.value);
	}), e._zod.check = (n) => {
		if (typeof n.value != typeof t.value) throw Error("Cannot mix number and bigint in multiple_of check.");
		(typeof n.value == "bigint" ? n.value % t.value === BigInt(0) : _e(n.value, t.value) === 0) || n.issues.push({
			origin: typeof n.value,
			code: "not_multiple_of",
			divisor: t.value,
			input: n.value,
			inst: e,
			continue: !t.abort
		});
	};
}), Ut = /*@__PURE__*/ k("$ZodCheckNumberFormat", (e, t) => {
	Rt.init(e, t), t.format = t.format || "float64";
	let n = t.format?.includes("int"), r = n ? "int" : "number", [i, a] = Ae[t.format];
	e._zod.onattach.push((e) => {
		let r = e._zod.bag;
		r.format = t.format, r.minimum = i, r.maximum = a, n && (r.pattern = Nt);
	}), e._zod.check = (o) => {
		let s = o.value;
		if (n) {
			if (!Number.isInteger(s)) {
				o.issues.push({
					expected: r,
					format: t.format,
					code: "invalid_type",
					continue: !1,
					input: s,
					inst: e
				});
				return;
			}
			if (!Number.isSafeInteger(s)) {
				s > 0 ? o.issues.push({
					input: s,
					code: "too_big",
					maximum: 2 ** 53 - 1,
					note: "Integers must be within the safe integer range.",
					inst: e,
					origin: r,
					inclusive: !0,
					continue: !t.abort
				}) : o.issues.push({
					input: s,
					code: "too_small",
					minimum: -(2 ** 53 - 1),
					note: "Integers must be within the safe integer range.",
					inst: e,
					origin: r,
					inclusive: !0,
					continue: !t.abort
				});
				return;
			}
		}
		s < i && o.issues.push({
			origin: "number",
			input: s,
			code: "too_small",
			minimum: i,
			inclusive: !0,
			inst: e,
			continue: !t.abort
		}), s > a && o.issues.push({
			origin: "number",
			input: s,
			code: "too_big",
			maximum: a,
			inclusive: !0,
			inst: e,
			continue: !t.abort
		});
	};
}), Wt = /*@__PURE__*/ k("$ZodCheckMaxLength", (e, t) => {
	var n;
	Rt.init(e, t), (n = e._zod.def).when ?? (n.when = (e) => {
		let t = e.value;
		return !he(t) && t.length !== void 0;
	}), e._zod.onattach.push((e) => {
		let n = e._zod.bag.maximum ?? Infinity;
		t.maximum < n && (e._zod.bag.maximum = t.maximum);
	}), e._zod.check = (n) => {
		let r = n.value;
		if (r.length <= t.maximum) return;
		let i = He(r);
		n.issues.push({
			origin: i,
			code: "too_big",
			maximum: t.maximum,
			inclusive: !0,
			input: r,
			inst: e,
			continue: !t.abort
		});
	};
}), Gt = /*@__PURE__*/ k("$ZodCheckMinLength", (e, t) => {
	var n;
	Rt.init(e, t), (n = e._zod.def).when ?? (n.when = (e) => {
		let t = e.value;
		return !he(t) && t.length !== void 0;
	}), e._zod.onattach.push((e) => {
		let n = e._zod.bag.minimum ?? -Infinity;
		t.minimum > n && (e._zod.bag.minimum = t.minimum);
	}), e._zod.check = (n) => {
		let r = n.value;
		if (r.length >= t.minimum) return;
		let i = He(r);
		n.issues.push({
			origin: i,
			code: "too_small",
			minimum: t.minimum,
			inclusive: !0,
			input: r,
			inst: e,
			continue: !t.abort
		});
	};
}), Kt = /*@__PURE__*/ k("$ZodCheckLengthEquals", (e, t) => {
	var n;
	Rt.init(e, t), (n = e._zod.def).when ?? (n.when = (e) => {
		let t = e.value;
		return !he(t) && t.length !== void 0;
	}), e._zod.onattach.push((e) => {
		let n = e._zod.bag;
		n.minimum = t.length, n.maximum = t.length, n.length = t.length;
	}), e._zod.check = (n) => {
		let r = n.value, i = r.length;
		if (i === t.length) return;
		let a = He(r), o = i > t.length;
		n.issues.push({
			origin: a,
			...o ? {
				code: "too_big",
				maximum: t.length
			} : {
				code: "too_small",
				minimum: t.length
			},
			inclusive: !0,
			exact: !0,
			input: n.value,
			inst: e,
			continue: !t.abort
		});
	};
}), qt = /*@__PURE__*/ k("$ZodCheckStringFormat", (e, t) => {
	var n, r;
	Rt.init(e, t), e._zod.onattach.push((e) => {
		let n = e._zod.bag;
		n.format = t.format, t.pattern && (n.patterns ??= /* @__PURE__ */ new Set(), n.patterns.add(t.pattern));
	}), t.pattern ? (n = e._zod).check ?? (n.check = (n) => {
		t.pattern.lastIndex = 0, !t.pattern.test(n.value) && n.issues.push({
			origin: "string",
			code: "invalid_format",
			format: t.format,
			input: n.value,
			...t.pattern ? { pattern: t.pattern.toString() } : {},
			inst: e,
			continue: !t.abort
		});
	}) : (r = e._zod).check ?? (r.check = () => {});
}), Jt = /*@__PURE__*/ k("$ZodCheckRegex", (e, t) => {
	qt.init(e, t), e._zod.check = (n) => {
		t.pattern.lastIndex = 0, !t.pattern.test(n.value) && n.issues.push({
			origin: "string",
			code: "invalid_format",
			format: "regex",
			input: n.value,
			pattern: t.pattern.toString(),
			inst: e,
			continue: !t.abort
		});
	};
}), Yt = /*@__PURE__*/ k("$ZodCheckLowerCase", (e, t) => {
	t.pattern ??= It, qt.init(e, t);
}), Xt = /*@__PURE__*/ k("$ZodCheckUpperCase", (e, t) => {
	t.pattern ??= Lt, qt.init(e, t);
}), Zt = /*@__PURE__*/ k("$ZodCheckIncludes", (e, t) => {
	Rt.init(e, t);
	let n = P(t.includes), r = new RegExp(typeof t.position == "number" ? `^.{${t.position}}${n}` : n);
	t.pattern = r, e._zod.onattach.push((e) => {
		let t = e._zod.bag;
		t.patterns ??= /* @__PURE__ */ new Set(), t.patterns.add(r);
	}), e._zod.check = (n) => {
		n.value.includes(t.includes, t.position) || n.issues.push({
			origin: "string",
			code: "invalid_format",
			format: "includes",
			includes: t.includes,
			input: n.value,
			inst: e,
			continue: !t.abort
		});
	};
}), Qt = /*@__PURE__*/ k("$ZodCheckStartsWith", (e, t) => {
	Rt.init(e, t);
	let n = RegExp(`^${P(t.prefix)}.*`);
	t.pattern ??= n, e._zod.onattach.push((e) => {
		let t = e._zod.bag;
		t.patterns ??= /* @__PURE__ */ new Set(), t.patterns.add(n);
	}), e._zod.check = (n) => {
		n.value.startsWith(t.prefix) || n.issues.push({
			origin: "string",
			code: "invalid_format",
			format: "starts_with",
			prefix: t.prefix,
			input: n.value,
			inst: e,
			continue: !t.abort
		});
	};
}), $t = /*@__PURE__*/ k("$ZodCheckEndsWith", (e, t) => {
	Rt.init(e, t);
	let n = RegExp(`.*${P(t.suffix)}$`);
	t.pattern ??= n, e._zod.onattach.push((e) => {
		let t = e._zod.bag;
		t.patterns ??= /* @__PURE__ */ new Set(), t.patterns.add(n);
	}), e._zod.check = (n) => {
		n.value.endsWith(t.suffix) || n.issues.push({
			origin: "string",
			code: "invalid_format",
			format: "ends_with",
			suffix: t.suffix,
			input: n.value,
			inst: e,
			continue: !t.abort
		});
	};
}), en = /*@__PURE__*/ k("$ZodCheckOverwrite", (e, t) => {
	Rt.init(e, t), e._zod.check = (e) => {
		e.value = t.tx(e.value);
	};
}), tn = class {
	constructor(e = []) {
		this.content = [], this.indent = 0, this && (this.args = e);
	}
	indented(e) {
		this.indent += 1, e(this), --this.indent;
	}
	write(e) {
		if (typeof e == "function") {
			e(this, { execution: "sync" }), e(this, { execution: "async" });
			return;
		}
		let t = e.split("\n").filter((e) => e), n = Math.min(...t.map((e) => e.length - e.trimStart().length)), r = t.map((e) => e.slice(n)).map((e) => " ".repeat(this.indent * 2) + e);
		for (let e of r) this.content.push(e);
	}
	compile() {
		let e = Function, t = this?.args, n = [...(this?.content ?? [""]).map((e) => `  ${e}`)];
		return new e(...t, n.join("\n"));
	}
}, nn = {
	major: 4,
	minor: 4,
	patch: 3
}, z = /*@__PURE__*/ k("$ZodType", (e, t) => {
	var n;
	e ??= {}, e._zod.def = t, e._zod.bag = e._zod.bag || {}, e._zod.version = nn;
	let r = [...e._zod.def.checks ?? []];
	e._zod.traits.has("$ZodCheck") && r.unshift(e);
	for (let t of r) for (let n of t._zod.onattach) n(e);
	if (r.length === 0) (n = e._zod).deferred ?? (n.deferred = []), e._zod.deferred?.push(() => {
		e._zod.run = e._zod.parse;
	});
	else {
		let t = (e, t, n) => {
			let r = Le(e), i;
			for (let a of t) {
				if (a._zod.def.when) {
					if (Re(e) || !a._zod.def.when(e)) continue;
				} else if (r) continue;
				let t = e.issues.length, o = a._zod.check(e);
				if (o instanceof Promise && n?.async === !1) throw new A();
				if (i || o instanceof Promise) i = (i ?? Promise.resolve()).then(async () => {
					await o, e.issues.length !== t && (r ||= Le(e, t));
				});
				else {
					if (e.issues.length === t) continue;
					r ||= Le(e, t);
				}
			}
			return i ? i.then(() => e) : e;
		}, n = (n, i, a) => {
			if (Le(n)) return n.aborted = !0, n;
			let o = t(i, r, a);
			if (o instanceof Promise) {
				if (a.async === !1) throw new A();
				return o.then((t) => e._zod.parse(t, a));
			}
			return e._zod.parse(o, a);
		};
		e._zod.run = (i, a) => {
			if (a.skipChecks) return e._zod.parse(i, a);
			if (a.direction === "backward") {
				let t = e._zod.parse({
					value: i.value,
					issues: []
				}, {
					...a,
					skipChecks: !0
				});
				return t instanceof Promise ? t.then((e) => n(e, i, a)) : n(t, i, a);
			}
			let o = e._zod.parse(i, a);
			if (o instanceof Promise) {
				if (a.async === !1) throw new A();
				return o.then((e) => t(e, r, a));
			}
			return t(o, r, a);
		};
	}
	N(e, "~standard", () => ({
		validate: (t) => {
			try {
				let n = Xe(e, t);
				return n.success ? { value: n.data } : { issues: n.error?.issues };
			} catch {
				return Qe(e, t).then((e) => e.success ? { value: e.data } : { issues: e.error?.issues });
			}
		},
		vendor: "zod",
		version: 1
	}));
}), rn = /*@__PURE__*/ k("$ZodString", (e, t) => {
	z.init(e, t), e._zod.pattern = [...e?._zod.bag?.patterns ?? []].pop() ?? Mt(e._zod.bag), e._zod.parse = (n, r) => {
		if (t.coerce) try {
			n.value = String(n.value);
		} catch {}
		return typeof n.value == "string" || n.issues.push({
			expected: "string",
			code: "invalid_type",
			input: n.value,
			inst: e
		}), n;
	};
}), B = /*@__PURE__*/ k("$ZodStringFormat", (e, t) => {
	qt.init(e, t), rn.init(e, t);
}), an = /*@__PURE__*/ k("$ZodGUID", (e, t) => {
	t.pattern ??= mt, B.init(e, t);
}), on = /*@__PURE__*/ k("$ZodUUID", (e, t) => {
	if (t.version) {
		let e = {
			v1: 1,
			v2: 2,
			v3: 3,
			v4: 4,
			v5: 5,
			v6: 6,
			v7: 7,
			v8: 8
		}[t.version];
		if (e === void 0) throw Error(`Invalid UUID version: "${t.version}"`);
		t.pattern ??= ht(e);
	} else t.pattern ??= ht();
	B.init(e, t);
}), sn = /*@__PURE__*/ k("$ZodEmail", (e, t) => {
	t.pattern ??= gt, B.init(e, t);
}), cn = /*@__PURE__*/ k("$ZodURL", (e, t) => {
	B.init(e, t), e._zod.check = (n) => {
		try {
			let r = n.value.trim();
			if (!t.normalize && t.protocol?.source === Tt.source && !/^https?:\/\//i.test(r)) {
				n.issues.push({
					code: "invalid_format",
					format: "url",
					note: "Invalid URL format",
					input: n.value,
					inst: e,
					continue: !t.abort
				});
				return;
			}
			let i = new URL(r);
			t.hostname && (t.hostname.lastIndex = 0, t.hostname.test(i.hostname) || n.issues.push({
				code: "invalid_format",
				format: "url",
				note: "Invalid hostname",
				pattern: t.hostname.source,
				input: n.value,
				inst: e,
				continue: !t.abort
			})), t.protocol && (t.protocol.lastIndex = 0, t.protocol.test(i.protocol.endsWith(":") ? i.protocol.slice(0, -1) : i.protocol) || n.issues.push({
				code: "invalid_format",
				format: "url",
				note: "Invalid protocol",
				pattern: t.protocol.source,
				input: n.value,
				inst: e,
				continue: !t.abort
			})), t.normalize ? n.value = i.href : n.value = r;
			return;
		} catch {
			n.issues.push({
				code: "invalid_format",
				format: "url",
				input: n.value,
				inst: e,
				continue: !t.abort
			});
		}
	};
}), ln = /*@__PURE__*/ k("$ZodEmoji", (e, t) => {
	t.pattern ??= vt(), B.init(e, t);
}), un = /*@__PURE__*/ k("$ZodNanoID", (e, t) => {
	t.pattern ??= ft, B.init(e, t);
}), dn = /*@__PURE__*/ k("$ZodCUID", (e, t) => {
	t.pattern ??= st, B.init(e, t);
}), fn = /*@__PURE__*/ k("$ZodCUID2", (e, t) => {
	t.pattern ??= ct, B.init(e, t);
}), pn = /*@__PURE__*/ k("$ZodULID", (e, t) => {
	t.pattern ??= lt, B.init(e, t);
}), mn = /*@__PURE__*/ k("$ZodXID", (e, t) => {
	t.pattern ??= ut, B.init(e, t);
}), hn = /*@__PURE__*/ k("$ZodKSUID", (e, t) => {
	t.pattern ??= dt, B.init(e, t);
}), gn = /*@__PURE__*/ k("$ZodISODateTime", (e, t) => {
	t.pattern ??= jt(t), B.init(e, t);
}), _n = /*@__PURE__*/ k("$ZodISODate", (e, t) => {
	t.pattern ??= Ot, B.init(e, t);
}), vn = /*@__PURE__*/ k("$ZodISOTime", (e, t) => {
	t.pattern ??= At(t), B.init(e, t);
}), yn = /*@__PURE__*/ k("$ZodISODuration", (e, t) => {
	t.pattern ??= pt, B.init(e, t);
}), bn = /*@__PURE__*/ k("$ZodIPv4", (e, t) => {
	t.pattern ??= yt, B.init(e, t), e._zod.bag.format = "ipv4";
}), xn = /*@__PURE__*/ k("$ZodIPv6", (e, t) => {
	t.pattern ??= bt, B.init(e, t), e._zod.bag.format = "ipv6", e._zod.check = (n) => {
		try {
			new URL(`http://[${n.value}]`);
		} catch {
			n.issues.push({
				code: "invalid_format",
				format: "ipv6",
				input: n.value,
				inst: e,
				continue: !t.abort
			});
		}
	};
}), Sn = /*@__PURE__*/ k("$ZodCIDRv4", (e, t) => {
	t.pattern ??= xt, B.init(e, t);
}), Cn = /*@__PURE__*/ k("$ZodCIDRv6", (e, t) => {
	t.pattern ??= St, B.init(e, t), e._zod.check = (n) => {
		let r = n.value.split("/");
		try {
			if (r.length !== 2) throw Error();
			let [e, t] = r;
			if (!t) throw Error();
			let n = Number(t);
			if (`${n}` !== t || n < 0 || n > 128) throw Error();
			new URL(`http://[${e}]`);
		} catch {
			n.issues.push({
				code: "invalid_format",
				format: "cidrv6",
				input: n.value,
				inst: e,
				continue: !t.abort
			});
		}
	};
});
function wn(e) {
	if (e === "") return !0;
	if (/\s/.test(e) || e.length % 4 != 0) return !1;
	try {
		return atob(e), !0;
	} catch {
		return !1;
	}
}
var Tn = /*@__PURE__*/ k("$ZodBase64", (e, t) => {
	t.pattern ??= Ct, B.init(e, t), e._zod.bag.contentEncoding = "base64", e._zod.check = (n) => {
		wn(n.value) || n.issues.push({
			code: "invalid_format",
			format: "base64",
			input: n.value,
			inst: e,
			continue: !t.abort
		});
	};
});
function En(e) {
	if (!wt.test(e)) return !1;
	let t = e.replace(/[-_]/g, (e) => e === "-" ? "+" : "/");
	return wn(t.padEnd(Math.ceil(t.length / 4) * 4, "="));
}
var Dn = /*@__PURE__*/ k("$ZodBase64URL", (e, t) => {
	t.pattern ??= wt, B.init(e, t), e._zod.bag.contentEncoding = "base64url", e._zod.check = (n) => {
		En(n.value) || n.issues.push({
			code: "invalid_format",
			format: "base64url",
			input: n.value,
			inst: e,
			continue: !t.abort
		});
	};
}), On = /*@__PURE__*/ k("$ZodE164", (e, t) => {
	t.pattern ??= Et, B.init(e, t);
});
function kn(e, t = null) {
	try {
		let n = e.split(".");
		if (n.length !== 3) return !1;
		let [r] = n;
		if (!r) return !1;
		let i = JSON.parse(atob(r));
		return !("typ" in i && i?.typ !== "JWT" || !i.alg || t && (!("alg" in i) || i.alg !== t));
	} catch {
		return !1;
	}
}
var An = /*@__PURE__*/ k("$ZodJWT", (e, t) => {
	B.init(e, t), e._zod.check = (n) => {
		kn(n.value, t.alg) || n.issues.push({
			code: "invalid_format",
			format: "jwt",
			input: n.value,
			inst: e,
			continue: !t.abort
		});
	};
}), jn = /*@__PURE__*/ k("$ZodNumber", (e, t) => {
	z.init(e, t), e._zod.pattern = e._zod.bag.pattern ?? Pt, e._zod.parse = (n, r) => {
		if (t.coerce) try {
			n.value = Number(n.value);
		} catch {}
		let i = n.value;
		if (typeof i == "number" && !Number.isNaN(i) && Number.isFinite(i)) return n;
		let a = typeof i == "number" ? Number.isNaN(i) ? "NaN" : Number.isFinite(i) ? void 0 : "Infinity" : void 0;
		return n.issues.push({
			expected: "number",
			code: "invalid_type",
			input: i,
			inst: e,
			...a ? { received: a } : {}
		}), n;
	};
}), Mn = /*@__PURE__*/ k("$ZodNumberFormat", (e, t) => {
	Ut.init(e, t), jn.init(e, t);
}), Nn = /*@__PURE__*/ k("$ZodBoolean", (e, t) => {
	z.init(e, t), e._zod.pattern = Ft, e._zod.parse = (n, r) => {
		if (t.coerce) try {
			n.value = !!n.value;
		} catch {}
		let i = n.value;
		return typeof i == "boolean" || n.issues.push({
			expected: "boolean",
			code: "invalid_type",
			input: i,
			inst: e
		}), n;
	};
}), Pn = /*@__PURE__*/ k("$ZodUnknown", (e, t) => {
	z.init(e, t), e._zod.parse = (e) => e;
}), Fn = /*@__PURE__*/ k("$ZodNever", (e, t) => {
	z.init(e, t), e._zod.parse = (t, n) => (t.issues.push({
		expected: "never",
		code: "invalid_type",
		input: t.value,
		inst: e
	}), t);
});
function In(e, t, n) {
	e.issues.length && t.issues.push(...ze(n, e.issues)), t.value[n] = e.value;
}
var Ln = /*@__PURE__*/ k("$ZodArray", (e, t) => {
	z.init(e, t), e._zod.parse = (n, r) => {
		let i = n.value;
		if (!Array.isArray(i)) return n.issues.push({
			expected: "array",
			code: "invalid_type",
			input: i,
			inst: e
		}), n;
		n.value = Array(i.length);
		let a = [];
		for (let e = 0; e < i.length; e++) {
			let o = i[e], s = t.element._zod.run({
				value: o,
				issues: []
			}, r);
			s instanceof Promise ? a.push(s.then((t) => In(t, n, e))) : In(s, n, e);
		}
		return a.length ? Promise.all(a).then(() => n) : n;
	};
});
function Rn(e, t, n, r, i, a) {
	let o = n in r;
	if (e.issues.length) {
		if (i && a && !o) return;
		t.issues.push(...ze(n, e.issues));
	}
	if (!o && !i) {
		e.issues.length || t.issues.push({
			code: "invalid_type",
			expected: "nonoptional",
			input: void 0,
			path: [n]
		});
		return;
	}
	e.value === void 0 ? o && (t.value[n] = void 0) : t.value[n] = e.value;
}
function zn(e) {
	let t = Object.keys(e.shape);
	for (let n of t) if (!e.shape?.[n]?._zod?.traits?.has("$ZodType")) throw Error(`Invalid element at key "${n}": expected a Zod schema`);
	let n = ke(e.shape);
	return {
		...e,
		keys: t,
		keySet: new Set(t),
		numKeys: t.length,
		optionalKeys: new Set(n)
	};
}
function Bn(e, t, n, r, i, a) {
	let o = [], s = i.keySet, c = i.catchall._zod, l = c.def.type, u = c.optin === "optional", d = c.optout === "optional";
	for (let i in t) {
		if (i === "__proto__" || s.has(i)) continue;
		if (l === "never") {
			o.push(i);
			continue;
		}
		let a = c.run({
			value: t[i],
			issues: []
		}, r);
		a instanceof Promise ? e.push(a.then((e) => Rn(e, n, i, t, u, d))) : Rn(a, n, i, t, u, d);
	}
	return o.length && n.issues.push({
		code: "unrecognized_keys",
		keys: o,
		input: t,
		inst: a
	}), e.length ? Promise.all(e).then(() => n) : n;
}
var Vn = /*@__PURE__*/ k("$ZodObject", (e, t) => {
	if (z.init(e, t), !Object.getOwnPropertyDescriptor(t, "shape")?.get) {
		let e = t.shape;
		Object.defineProperty(t, "shape", { get: () => {
			let n = { ...e };
			return Object.defineProperty(t, "shape", { value: n }), n;
		} });
	}
	let n = me(() => zn(t));
	N(e._zod, "propValues", () => {
		let e = t.shape, n = {};
		for (let t in e) {
			let r = e[t]._zod;
			if (r.values) {
				n[t] ?? (n[t] = /* @__PURE__ */ new Set());
				for (let e of r.values) n[t].add(e);
			}
		}
		return n;
	});
	let r = Ce, i = t.catchall, a;
	e._zod.parse = (t, o) => {
		a ??= n.value;
		let s = t.value;
		if (!r(s)) return t.issues.push({
			expected: "object",
			code: "invalid_type",
			input: s,
			inst: e
		}), t;
		t.value = {};
		let c = [], l = a.shape;
		for (let e of a.keys) {
			let n = l[e], r = n._zod.optin === "optional", i = n._zod.optout === "optional", a = n._zod.run({
				value: s[e],
				issues: []
			}, o);
			a instanceof Promise ? c.push(a.then((n) => Rn(n, t, e, s, r, i))) : Rn(a, t, e, s, r, i);
		}
		return i ? Bn(c, s, t, o, n.value, e) : c.length ? Promise.all(c).then(() => t) : t;
	};
}), Hn = /*@__PURE__*/ k("$ZodObjectJIT", (e, t) => {
	Vn.init(e, t);
	let n = e._zod.parse, r = me(() => zn(t)), i = (e) => {
		let t = new tn([
			"shape",
			"payload",
			"ctx"
		]), n = r.value, i = (e) => {
			let t = be(e);
			return `shape[${t}]._zod.run({ value: input[${t}], issues: [] }, ctx)`;
		};
		t.write("const input = payload.value;");
		let a = Object.create(null), o = 0;
		for (let e of n.keys) a[e] = `key_${o++}`;
		t.write("const newResult = {};");
		for (let r of n.keys) {
			let n = a[r], o = be(r), s = e[r], c = s?._zod?.optin === "optional", l = s?._zod?.optout === "optional";
			t.write(`const ${n} = ${i(r)};`), c && l ? t.write(`
        if (${n}.issues.length) {
          if (${o} in input) {
            payload.issues = payload.issues.concat(${n}.issues.map(iss => ({
              ...iss,
              path: iss.path ? [${o}, ...iss.path] : [${o}]
            })));
          }
        }
        
        if (${n}.value === undefined) {
          if (${o} in input) {
            newResult[${o}] = undefined;
          }
        } else {
          newResult[${o}] = ${n}.value;
        }
        
      `) : c ? t.write(`
        if (${n}.issues.length) {
          payload.issues = payload.issues.concat(${n}.issues.map(iss => ({
            ...iss,
            path: iss.path ? [${o}, ...iss.path] : [${o}]
          })));
        }
        
        if (${n}.value === undefined) {
          if (${o} in input) {
            newResult[${o}] = undefined;
          }
        } else {
          newResult[${o}] = ${n}.value;
        }
        
      `) : t.write(`
        const ${n}_present = ${o} in input;
        if (${n}.issues.length) {
          payload.issues = payload.issues.concat(${n}.issues.map(iss => ({
            ...iss,
            path: iss.path ? [${o}, ...iss.path] : [${o}]
          })));
        }
        if (!${n}_present && !${n}.issues.length) {
          payload.issues.push({
            code: "invalid_type",
            expected: "nonoptional",
            input: undefined,
            path: [${o}]
          });
        }

        if (${n}_present) {
          if (${n}.value === undefined) {
            newResult[${o}] = undefined;
          } else {
            newResult[${o}] = ${n}.value;
          }
        }

      `);
		}
		t.write("payload.value = newResult;"), t.write("return payload;");
		let s = t.compile();
		return (t, n) => s(e, t, n);
	}, a, o = Ce, s = !de.jitless, c = s && we.value, l = t.catchall, u;
	e._zod.parse = (d, f) => {
		u ??= r.value;
		let p = d.value;
		return o(p) ? s && c && f?.async === !1 && f.jitless !== !0 ? (a ||= i(t.shape), d = a(d, f), l ? Bn([], p, d, f, u, e) : d) : n(d, f) : (d.issues.push({
			expected: "object",
			code: "invalid_type",
			input: p,
			inst: e
		}), d);
	};
});
function Un(e, t, n, r) {
	for (let n of e) if (n.issues.length === 0) return t.value = n.value, t;
	let i = e.filter((e) => !Le(e));
	return i.length === 1 ? (t.value = i[0].value, i[0]) : (t.issues.push({
		code: "invalid_union",
		input: t.value,
		inst: n,
		errors: e.map((e) => e.issues.map((e) => Ve(e, r, fe())))
	}), t);
}
var Wn = /*@__PURE__*/ k("$ZodUnion", (e, t) => {
	z.init(e, t), N(e._zod, "optin", () => t.options.some((e) => e._zod.optin === "optional") ? "optional" : void 0), N(e._zod, "optout", () => t.options.some((e) => e._zod.optout === "optional") ? "optional" : void 0), N(e._zod, "values", () => {
		if (t.options.every((e) => e._zod.values)) return new Set(t.options.flatMap((e) => Array.from(e._zod.values)));
	}), N(e._zod, "pattern", () => {
		if (t.options.every((e) => e._zod.pattern)) {
			let e = t.options.map((e) => e._zod.pattern);
			return RegExp(`^(${e.map((e) => ge(e.source)).join("|")})$`);
		}
	});
	let n = t.options.length === 1 ? t.options[0]._zod.run : null;
	e._zod.parse = (r, i) => {
		if (n) return n(r, i);
		let a = !1, o = [];
		for (let e of t.options) {
			let t = e._zod.run({
				value: r.value,
				issues: []
			}, i);
			if (t instanceof Promise) o.push(t), a = !0;
			else {
				if (t.issues.length === 0) return t;
				o.push(t);
			}
		}
		return a ? Promise.all(o).then((t) => Un(t, r, e, i)) : Un(o, r, e, i);
	};
}), Gn = /*@__PURE__*/ k("$ZodDiscriminatedUnion", (e, t) => {
	t.inclusive = !1, Wn.init(e, t);
	let n = e._zod.parse;
	N(e._zod, "propValues", () => {
		let e = {};
		for (let n of t.options) {
			let r = n._zod.propValues;
			if (!r || Object.keys(r).length === 0) throw Error(`Invalid discriminated union option at index "${t.options.indexOf(n)}"`);
			for (let [t, n] of Object.entries(r)) {
				e[t] || (e[t] = /* @__PURE__ */ new Set());
				for (let r of n) e[t].add(r);
			}
		}
		return e;
	});
	let r = me(() => {
		let e = t.options, n = /* @__PURE__ */ new Map();
		for (let r of e) {
			let e = r._zod.propValues?.[t.discriminator];
			if (!e || e.size === 0) throw Error(`Invalid discriminated union option at index "${t.options.indexOf(r)}"`);
			for (let t of e) {
				if (n.has(t)) throw Error(`Duplicate discriminator value "${String(t)}"`);
				n.set(t, r);
			}
		}
		return n;
	});
	e._zod.parse = (i, a) => {
		let o = i.value;
		if (!Ce(o)) return i.issues.push({
			code: "invalid_type",
			expected: "object",
			input: o,
			inst: e
		}), i;
		let s = r.value.get(o?.[t.discriminator]);
		return s ? s._zod.run(i, a) : t.unionFallback || a.direction === "backward" ? n(i, a) : (i.issues.push({
			code: "invalid_union",
			errors: [],
			note: "No matching discriminator",
			discriminator: t.discriminator,
			options: Array.from(r.value.keys()),
			input: o,
			path: [t.discriminator],
			inst: e
		}), i);
	};
}), Kn = /*@__PURE__*/ k("$ZodIntersection", (e, t) => {
	z.init(e, t), e._zod.parse = (e, n) => {
		let r = e.value, i = t.left._zod.run({
			value: r,
			issues: []
		}, n), a = t.right._zod.run({
			value: r,
			issues: []
		}, n);
		return i instanceof Promise || a instanceof Promise ? Promise.all([i, a]).then(([t, n]) => Jn(e, t, n)) : Jn(e, i, a);
	};
});
function qn(e, t) {
	if (e === t || e instanceof Date && t instanceof Date && +e == +t) return {
		valid: !0,
		data: e
	};
	if (Te(e) && Te(t)) {
		let n = Object.keys(t), r = Object.keys(e).filter((e) => n.indexOf(e) !== -1), i = {
			...e,
			...t
		};
		for (let n of r) {
			let r = qn(e[n], t[n]);
			if (!r.valid) return {
				valid: !1,
				mergeErrorPath: [n, ...r.mergeErrorPath]
			};
			i[n] = r.data;
		}
		return {
			valid: !0,
			data: i
		};
	}
	if (Array.isArray(e) && Array.isArray(t)) {
		if (e.length !== t.length) return {
			valid: !1,
			mergeErrorPath: []
		};
		let n = [];
		for (let r = 0; r < e.length; r++) {
			let i = e[r], a = t[r], o = qn(i, a);
			if (!o.valid) return {
				valid: !1,
				mergeErrorPath: [r, ...o.mergeErrorPath]
			};
			n.push(o.data);
		}
		return {
			valid: !0,
			data: n
		};
	}
	return {
		valid: !1,
		mergeErrorPath: []
	};
}
function Jn(e, t, n) {
	let r = /* @__PURE__ */ new Map(), i;
	for (let n of t.issues) if (n.code === "unrecognized_keys") {
		i ??= n;
		for (let e of n.keys) r.has(e) || r.set(e, {}), r.get(e).l = !0;
	} else e.issues.push(n);
	for (let t of n.issues) if (t.code === "unrecognized_keys") for (let e of t.keys) r.has(e) || r.set(e, {}), r.get(e).r = !0;
	else e.issues.push(t);
	let a = [...r].filter(([, e]) => e.l && e.r).map(([e]) => e);
	if (a.length && i && e.issues.push({
		...i,
		keys: a
	}), Le(e)) return e;
	let o = qn(t.value, n.value);
	if (!o.valid) throw Error(`Unmergable intersection. Error path: ${JSON.stringify(o.mergeErrorPath)}`);
	return e.value = o.data, e;
}
var Yn = /*@__PURE__*/ k("$ZodTuple", (e, t) => {
	z.init(e, t);
	let n = t.items;
	e._zod.parse = (r, i) => {
		let a = r.value;
		if (!Array.isArray(a)) return r.issues.push({
			input: a,
			inst: e,
			expected: "tuple",
			code: "invalid_type"
		}), r;
		r.value = [];
		let o = [], s = Xn(n, "optin"), c = Xn(n, "optout");
		if (!t.rest) {
			if (a.length < s) return r.issues.push({
				code: "too_small",
				minimum: s,
				inclusive: !0,
				input: a,
				inst: e,
				origin: "array"
			}), r;
			a.length > n.length && r.issues.push({
				code: "too_big",
				maximum: n.length,
				inclusive: !0,
				input: a,
				inst: e,
				origin: "array"
			});
		}
		let l = Array(n.length);
		for (let e = 0; e < n.length; e++) {
			let t = n[e]._zod.run({
				value: a[e],
				issues: []
			}, i);
			t instanceof Promise ? o.push(t.then((t) => {
				l[e] = t;
			})) : l[e] = t;
		}
		if (t.rest) {
			let e = n.length - 1, s = a.slice(n.length);
			for (let n of s) {
				e++;
				let a = t.rest._zod.run({
					value: n,
					issues: []
				}, i);
				a instanceof Promise ? o.push(a.then((t) => Zn(t, r, e))) : Zn(a, r, e);
			}
		}
		return o.length ? Promise.all(o).then(() => Qn(l, r, n, a, c)) : Qn(l, r, n, a, c);
	};
});
function Xn(e, t) {
	for (let n = e.length - 1; n >= 0; n--) if (e[n]._zod[t] !== "optional") return n + 1;
	return 0;
}
function Zn(e, t, n) {
	e.issues.length && t.issues.push(...ze(n, e.issues)), t.value[n] = e.value;
}
function Qn(e, t, n, r, i) {
	for (let a = 0; a < n.length; a++) {
		let n = e[a], o = a < r.length;
		if (n.issues.length) {
			if (!o && a >= i) {
				t.value.length = a;
				break;
			}
			t.issues.push(...ze(a, n.issues));
		}
		t.value[a] = n.value;
	}
	for (let e = t.value.length - 1; e >= r.length && n[e]._zod.optout === "optional" && t.value[e] === void 0; e--) t.value.length = e;
	return t;
}
var $n = /*@__PURE__*/ k("$ZodRecord", (e, t) => {
	z.init(e, t), e._zod.parse = (n, r) => {
		let i = n.value;
		if (!Te(i)) return n.issues.push({
			expected: "record",
			code: "invalid_type",
			input: i,
			inst: e
		}), n;
		let a = [], o = t.keyType._zod.values;
		if (o) {
			n.value = {};
			let s = /* @__PURE__ */ new Set();
			for (let c of o) if (typeof c == "string" || typeof c == "number" || typeof c == "symbol") {
				s.add(typeof c == "number" ? c.toString() : c);
				let o = t.keyType._zod.run({
					value: c,
					issues: []
				}, r);
				if (o instanceof Promise) throw Error("Async schemas not supported in object keys currently");
				if (o.issues.length) {
					n.issues.push({
						code: "invalid_key",
						origin: "record",
						issues: o.issues.map((e) => Ve(e, r, fe())),
						input: c,
						path: [c],
						inst: e
					});
					continue;
				}
				let l = o.value, u = t.valueType._zod.run({
					value: i[c],
					issues: []
				}, r);
				u instanceof Promise ? a.push(u.then((e) => {
					e.issues.length && n.issues.push(...ze(c, e.issues)), n.value[l] = e.value;
				})) : (u.issues.length && n.issues.push(...ze(c, u.issues)), n.value[l] = u.value);
			}
			let c;
			for (let e in i) s.has(e) || (c ??= [], c.push(e));
			c && c.length > 0 && n.issues.push({
				code: "unrecognized_keys",
				input: i,
				inst: e,
				keys: c
			});
		} else {
			n.value = {};
			for (let o of Reflect.ownKeys(i)) {
				if (o === "__proto__" || !Object.prototype.propertyIsEnumerable.call(i, o)) continue;
				let s = t.keyType._zod.run({
					value: o,
					issues: []
				}, r);
				if (s instanceof Promise) throw Error("Async schemas not supported in object keys currently");
				if (typeof o == "string" && Pt.test(o) && s.issues.length) {
					let e = t.keyType._zod.run({
						value: Number(o),
						issues: []
					}, r);
					if (e instanceof Promise) throw Error("Async schemas not supported in object keys currently");
					e.issues.length === 0 && (s = e);
				}
				if (s.issues.length) {
					t.mode === "loose" ? n.value[o] = i[o] : n.issues.push({
						code: "invalid_key",
						origin: "record",
						issues: s.issues.map((e) => Ve(e, r, fe())),
						input: o,
						path: [o],
						inst: e
					});
					continue;
				}
				let c = t.valueType._zod.run({
					value: i[o],
					issues: []
				}, r);
				c instanceof Promise ? a.push(c.then((e) => {
					e.issues.length && n.issues.push(...ze(o, e.issues)), n.value[s.value] = e.value;
				})) : (c.issues.length && n.issues.push(...ze(o, c.issues)), n.value[s.value] = c.value);
			}
		}
		return a.length ? Promise.all(a).then(() => n) : n;
	};
}), er = /*@__PURE__*/ k("$ZodEnum", (e, t) => {
	z.init(e, t);
	let n = j(t.entries), r = new Set(n);
	e._zod.values = r, e._zod.pattern = RegExp(`^(${n.filter((e) => De.has(typeof e)).map((e) => typeof e == "string" ? P(e) : e.toString()).join("|")})$`), e._zod.parse = (t, i) => {
		let a = t.value;
		return r.has(a) || t.issues.push({
			code: "invalid_value",
			values: n,
			input: a,
			inst: e
		}), t;
	};
}), tr = /*@__PURE__*/ k("$ZodLiteral", (e, t) => {
	if (z.init(e, t), t.values.length === 0) throw Error("Cannot create literal schema with no valid values");
	let n = new Set(t.values);
	e._zod.values = n, e._zod.pattern = RegExp(`^(${t.values.map((e) => typeof e == "string" ? P(e) : e ? P(e.toString()) : String(e)).join("|")})$`), e._zod.parse = (r, i) => {
		let a = r.value;
		return n.has(a) || r.issues.push({
			code: "invalid_value",
			values: t.values,
			input: a,
			inst: e
		}), r;
	};
}), nr = /*@__PURE__*/ k("$ZodTransform", (e, t) => {
	z.init(e, t), e._zod.optin = "optional", e._zod.parse = (n, r) => {
		if (r.direction === "backward") throw new ue(e.constructor.name);
		let i = t.transform(n.value, n);
		if (r.async) return (i instanceof Promise ? i : Promise.resolve(i)).then((e) => (n.value = e, n.fallback = !0, n));
		if (i instanceof Promise) throw new A();
		return n.value = i, n.fallback = !0, n;
	};
});
function rr(e, t) {
	return t === void 0 && (e.issues.length || e.fallback) ? {
		issues: [],
		value: void 0
	} : e;
}
var ir = /*@__PURE__*/ k("$ZodOptional", (e, t) => {
	z.init(e, t), e._zod.optin = "optional", e._zod.optout = "optional", N(e._zod, "values", () => t.innerType._zod.values ? /* @__PURE__ */ new Set([...t.innerType._zod.values, void 0]) : void 0), N(e._zod, "pattern", () => {
		let e = t.innerType._zod.pattern;
		return e ? RegExp(`^(${ge(e.source)})?$`) : void 0;
	}), e._zod.parse = (e, n) => {
		if (t.innerType._zod.optin === "optional") {
			let r = e.value, i = t.innerType._zod.run(e, n);
			return i instanceof Promise ? i.then((e) => rr(e, r)) : rr(i, r);
		}
		return e.value === void 0 ? e : t.innerType._zod.run(e, n);
	};
}), ar = /*@__PURE__*/ k("$ZodExactOptional", (e, t) => {
	ir.init(e, t), N(e._zod, "values", () => t.innerType._zod.values), N(e._zod, "pattern", () => t.innerType._zod.pattern), e._zod.parse = (e, n) => t.innerType._zod.run(e, n);
}), or = /*@__PURE__*/ k("$ZodNullable", (e, t) => {
	z.init(e, t), N(e._zod, "optin", () => t.innerType._zod.optin), N(e._zod, "optout", () => t.innerType._zod.optout), N(e._zod, "pattern", () => {
		let e = t.innerType._zod.pattern;
		return e ? RegExp(`^(${ge(e.source)}|null)$`) : void 0;
	}), N(e._zod, "values", () => t.innerType._zod.values ? /* @__PURE__ */ new Set([...t.innerType._zod.values, null]) : void 0), e._zod.parse = (e, n) => e.value === null ? e : t.innerType._zod.run(e, n);
}), sr = /*@__PURE__*/ k("$ZodDefault", (e, t) => {
	z.init(e, t), e._zod.optin = "optional", N(e._zod, "values", () => t.innerType._zod.values), e._zod.parse = (e, n) => {
		if (n.direction === "backward") return t.innerType._zod.run(e, n);
		if (e.value === void 0) return e.value = t.defaultValue, e;
		let r = t.innerType._zod.run(e, n);
		return r instanceof Promise ? r.then((e) => cr(e, t)) : cr(r, t);
	};
});
function cr(e, t) {
	return e.value === void 0 && (e.value = t.defaultValue), e;
}
var lr = /*@__PURE__*/ k("$ZodPrefault", (e, t) => {
	z.init(e, t), e._zod.optin = "optional", N(e._zod, "values", () => t.innerType._zod.values), e._zod.parse = (e, n) => (n.direction === "backward" || e.value === void 0 && (e.value = t.defaultValue), t.innerType._zod.run(e, n));
}), ur = /*@__PURE__*/ k("$ZodNonOptional", (e, t) => {
	z.init(e, t), N(e._zod, "values", () => {
		let e = t.innerType._zod.values;
		return e ? new Set([...e].filter((e) => e !== void 0)) : void 0;
	}), e._zod.parse = (n, r) => {
		let i = t.innerType._zod.run(n, r);
		return i instanceof Promise ? i.then((t) => dr(t, e)) : dr(i, e);
	};
});
function dr(e, t) {
	return !e.issues.length && e.value === void 0 && e.issues.push({
		code: "invalid_type",
		expected: "nonoptional",
		input: e.value,
		inst: t
	}), e;
}
var fr = /*@__PURE__*/ k("$ZodCatch", (e, t) => {
	z.init(e, t), e._zod.optin = "optional", N(e._zod, "optout", () => t.innerType._zod.optout), N(e._zod, "values", () => t.innerType._zod.values), e._zod.parse = (e, n) => {
		if (n.direction === "backward") return t.innerType._zod.run(e, n);
		let r = t.innerType._zod.run(e, n);
		return r instanceof Promise ? r.then((r) => (e.value = r.value, r.issues.length && (e.value = t.catchValue({
			...e,
			error: { issues: r.issues.map((e) => Ve(e, n, fe())) },
			input: e.value
		}), e.issues = [], e.fallback = !0), e)) : (e.value = r.value, r.issues.length && (e.value = t.catchValue({
			...e,
			error: { issues: r.issues.map((e) => Ve(e, n, fe())) },
			input: e.value
		}), e.issues = [], e.fallback = !0), e);
	};
}), pr = /*@__PURE__*/ k("$ZodPipe", (e, t) => {
	z.init(e, t), N(e._zod, "values", () => t.in._zod.values), N(e._zod, "optin", () => t.in._zod.optin), N(e._zod, "optout", () => t.out._zod.optout), N(e._zod, "propValues", () => t.in._zod.propValues), e._zod.parse = (e, n) => {
		if (n.direction === "backward") {
			let r = t.out._zod.run(e, n);
			return r instanceof Promise ? r.then((e) => mr(e, t.in, n)) : mr(r, t.in, n);
		}
		let r = t.in._zod.run(e, n);
		return r instanceof Promise ? r.then((e) => mr(e, t.out, n)) : mr(r, t.out, n);
	};
});
function mr(e, t, n) {
	return e.issues.length ? (e.aborted = !0, e) : t._zod.run({
		value: e.value,
		issues: e.issues,
		fallback: e.fallback
	}, n);
}
var hr = /*@__PURE__*/ k("$ZodPreprocess", (e, t) => {
	pr.init(e, t);
}), gr = /*@__PURE__*/ k("$ZodReadonly", (e, t) => {
	z.init(e, t), N(e._zod, "propValues", () => t.innerType._zod.propValues), N(e._zod, "values", () => t.innerType._zod.values), N(e._zod, "optin", () => t.innerType?._zod?.optin), N(e._zod, "optout", () => t.innerType?._zod?.optout), e._zod.parse = (e, n) => {
		if (n.direction === "backward") return t.innerType._zod.run(e, n);
		let r = t.innerType._zod.run(e, n);
		return r instanceof Promise ? r.then(_r) : _r(r);
	};
});
function _r(e) {
	return e.value = Object.freeze(e.value), e;
}
var vr = /*@__PURE__*/ k("$ZodLazy", (e, t) => {
	z.init(e, t), N(e._zod, "innerType", () => {
		let e = t;
		return e._cachedInner ||= t.getter(), e._cachedInner;
	}), N(e._zod, "pattern", () => e._zod.innerType?._zod?.pattern), N(e._zod, "propValues", () => e._zod.innerType?._zod?.propValues), N(e._zod, "optin", () => e._zod.innerType?._zod?.optin ?? void 0), N(e._zod, "optout", () => e._zod.innerType?._zod?.optout ?? void 0), e._zod.parse = (t, n) => e._zod.innerType._zod.run(t, n);
}), yr = /*@__PURE__*/ k("$ZodCustom", (e, t) => {
	Rt.init(e, t), z.init(e, t), e._zod.parse = (e, t) => e, e._zod.check = (n) => {
		let r = n.value, i = t.fn(r);
		if (i instanceof Promise) return i.then((t) => br(t, n, r, e));
		br(i, n, r, e);
	};
});
function br(e, t, n, r) {
	if (!e) {
		let e = {
			code: "custom",
			input: n,
			inst: r,
			path: [...r._zod.def.path ?? []],
			continue: !r._zod.def.abort
		};
		r._zod.def.params && (e.params = r._zod.def.params), t.issues.push(Ue(e));
	}
}
//#endregion
//#region node_modules/.pnpm/zod@4.4.3/node_modules/zod/v4/core/registries.js
var xr, Sr = class {
	constructor() {
		this._map = /* @__PURE__ */ new WeakMap(), this._idmap = /* @__PURE__ */ new Map();
	}
	add(e, ...t) {
		let n = t[0];
		return this._map.set(e, n), n && typeof n == "object" && "id" in n && this._idmap.set(n.id, e), this;
	}
	clear() {
		return this._map = /* @__PURE__ */ new WeakMap(), this._idmap = /* @__PURE__ */ new Map(), this;
	}
	remove(e) {
		let t = this._map.get(e);
		return t && typeof t == "object" && "id" in t && this._idmap.delete(t.id), this._map.delete(e), this;
	}
	get(e) {
		let t = e._zod.parent;
		if (t) {
			let n = { ...this.get(t) ?? {} };
			delete n.id;
			let r = {
				...n,
				...this._map.get(e)
			};
			return Object.keys(r).length ? r : void 0;
		}
		return this._map.get(e);
	}
	has(e) {
		return this._map.has(e);
	}
};
function Cr() {
	return new Sr();
}
(xr = globalThis).__zod_globalRegistry ?? (xr.__zod_globalRegistry = Cr());
var wr = globalThis.__zod_globalRegistry;
//#endregion
//#region node_modules/.pnpm/zod@4.4.3/node_modules/zod/v4/core/api.js
// @__NO_SIDE_EFFECTS__
function Tr(e, t) {
	return new e({
		type: "string",
		...F(t)
	});
}
// @__NO_SIDE_EFFECTS__
function Er(e, t) {
	return new e({
		type: "string",
		format: "email",
		check: "string_format",
		abort: !1,
		...F(t)
	});
}
// @__NO_SIDE_EFFECTS__
function Dr(e, t) {
	return new e({
		type: "string",
		format: "guid",
		check: "string_format",
		abort: !1,
		...F(t)
	});
}
// @__NO_SIDE_EFFECTS__
function Or(e, t) {
	return new e({
		type: "string",
		format: "uuid",
		check: "string_format",
		abort: !1,
		...F(t)
	});
}
// @__NO_SIDE_EFFECTS__
function kr(e, t) {
	return new e({
		type: "string",
		format: "uuid",
		check: "string_format",
		abort: !1,
		version: "v4",
		...F(t)
	});
}
// @__NO_SIDE_EFFECTS__
function Ar(e, t) {
	return new e({
		type: "string",
		format: "uuid",
		check: "string_format",
		abort: !1,
		version: "v6",
		...F(t)
	});
}
// @__NO_SIDE_EFFECTS__
function jr(e, t) {
	return new e({
		type: "string",
		format: "uuid",
		check: "string_format",
		abort: !1,
		version: "v7",
		...F(t)
	});
}
// @__NO_SIDE_EFFECTS__
function Mr(e, t) {
	return new e({
		type: "string",
		format: "url",
		check: "string_format",
		abort: !1,
		...F(t)
	});
}
// @__NO_SIDE_EFFECTS__
function Nr(e, t) {
	return new e({
		type: "string",
		format: "emoji",
		check: "string_format",
		abort: !1,
		...F(t)
	});
}
// @__NO_SIDE_EFFECTS__
function Pr(e, t) {
	return new e({
		type: "string",
		format: "nanoid",
		check: "string_format",
		abort: !1,
		...F(t)
	});
}
// @__NO_SIDE_EFFECTS__
function Fr(e, t) {
	return new e({
		type: "string",
		format: "cuid",
		check: "string_format",
		abort: !1,
		...F(t)
	});
}
// @__NO_SIDE_EFFECTS__
function Ir(e, t) {
	return new e({
		type: "string",
		format: "cuid2",
		check: "string_format",
		abort: !1,
		...F(t)
	});
}
// @__NO_SIDE_EFFECTS__
function Lr(e, t) {
	return new e({
		type: "string",
		format: "ulid",
		check: "string_format",
		abort: !1,
		...F(t)
	});
}
// @__NO_SIDE_EFFECTS__
function Rr(e, t) {
	return new e({
		type: "string",
		format: "xid",
		check: "string_format",
		abort: !1,
		...F(t)
	});
}
// @__NO_SIDE_EFFECTS__
function zr(e, t) {
	return new e({
		type: "string",
		format: "ksuid",
		check: "string_format",
		abort: !1,
		...F(t)
	});
}
// @__NO_SIDE_EFFECTS__
function Br(e, t) {
	return new e({
		type: "string",
		format: "ipv4",
		check: "string_format",
		abort: !1,
		...F(t)
	});
}
// @__NO_SIDE_EFFECTS__
function Vr(e, t) {
	return new e({
		type: "string",
		format: "ipv6",
		check: "string_format",
		abort: !1,
		...F(t)
	});
}
// @__NO_SIDE_EFFECTS__
function Hr(e, t) {
	return new e({
		type: "string",
		format: "cidrv4",
		check: "string_format",
		abort: !1,
		...F(t)
	});
}
// @__NO_SIDE_EFFECTS__
function Ur(e, t) {
	return new e({
		type: "string",
		format: "cidrv6",
		check: "string_format",
		abort: !1,
		...F(t)
	});
}
// @__NO_SIDE_EFFECTS__
function Wr(e, t) {
	return new e({
		type: "string",
		format: "base64",
		check: "string_format",
		abort: !1,
		...F(t)
	});
}
// @__NO_SIDE_EFFECTS__
function Gr(e, t) {
	return new e({
		type: "string",
		format: "base64url",
		check: "string_format",
		abort: !1,
		...F(t)
	});
}
// @__NO_SIDE_EFFECTS__
function Kr(e, t) {
	return new e({
		type: "string",
		format: "e164",
		check: "string_format",
		abort: !1,
		...F(t)
	});
}
// @__NO_SIDE_EFFECTS__
function qr(e, t) {
	return new e({
		type: "string",
		format: "jwt",
		check: "string_format",
		abort: !1,
		...F(t)
	});
}
// @__NO_SIDE_EFFECTS__
function Jr(e, t) {
	return new e({
		type: "string",
		format: "datetime",
		check: "string_format",
		offset: !1,
		local: !1,
		precision: null,
		...F(t)
	});
}
// @__NO_SIDE_EFFECTS__
function Yr(e, t) {
	return new e({
		type: "string",
		format: "date",
		check: "string_format",
		...F(t)
	});
}
// @__NO_SIDE_EFFECTS__
function Xr(e, t) {
	return new e({
		type: "string",
		format: "time",
		check: "string_format",
		precision: null,
		...F(t)
	});
}
// @__NO_SIDE_EFFECTS__
function Zr(e, t) {
	return new e({
		type: "string",
		format: "duration",
		check: "string_format",
		...F(t)
	});
}
// @__NO_SIDE_EFFECTS__
function Qr(e, t) {
	return new e({
		type: "number",
		checks: [],
		...F(t)
	});
}
// @__NO_SIDE_EFFECTS__
function $r(e, t) {
	return new e({
		type: "number",
		check: "number_format",
		abort: !1,
		format: "safeint",
		...F(t)
	});
}
// @__NO_SIDE_EFFECTS__
function ei(e, t) {
	return new e({
		type: "boolean",
		...F(t)
	});
}
// @__NO_SIDE_EFFECTS__
function ti(e) {
	return new e({ type: "unknown" });
}
// @__NO_SIDE_EFFECTS__
function ni(e, t) {
	return new e({
		type: "never",
		...F(t)
	});
}
// @__NO_SIDE_EFFECTS__
function ri(e, t) {
	return new Bt({
		check: "less_than",
		...F(t),
		value: e,
		inclusive: !1
	});
}
// @__NO_SIDE_EFFECTS__
function ii(e, t) {
	return new Bt({
		check: "less_than",
		...F(t),
		value: e,
		inclusive: !0
	});
}
// @__NO_SIDE_EFFECTS__
function ai(e, t) {
	return new Vt({
		check: "greater_than",
		...F(t),
		value: e,
		inclusive: !1
	});
}
// @__NO_SIDE_EFFECTS__
function oi(e, t) {
	return new Vt({
		check: "greater_than",
		...F(t),
		value: e,
		inclusive: !0
	});
}
// @__NO_SIDE_EFFECTS__
function si(e, t) {
	return new Ht({
		check: "multiple_of",
		...F(t),
		value: e
	});
}
// @__NO_SIDE_EFFECTS__
function ci(e, t) {
	return new Wt({
		check: "max_length",
		...F(t),
		maximum: e
	});
}
// @__NO_SIDE_EFFECTS__
function li(e, t) {
	return new Gt({
		check: "min_length",
		...F(t),
		minimum: e
	});
}
// @__NO_SIDE_EFFECTS__
function ui(e, t) {
	return new Kt({
		check: "length_equals",
		...F(t),
		length: e
	});
}
// @__NO_SIDE_EFFECTS__
function di(e, t) {
	return new Jt({
		check: "string_format",
		format: "regex",
		...F(t),
		pattern: e
	});
}
// @__NO_SIDE_EFFECTS__
function fi(e) {
	return new Yt({
		check: "string_format",
		format: "lowercase",
		...F(e)
	});
}
// @__NO_SIDE_EFFECTS__
function pi(e) {
	return new Xt({
		check: "string_format",
		format: "uppercase",
		...F(e)
	});
}
// @__NO_SIDE_EFFECTS__
function mi(e, t) {
	return new Zt({
		check: "string_format",
		format: "includes",
		...F(t),
		includes: e
	});
}
// @__NO_SIDE_EFFECTS__
function hi(e, t) {
	return new Qt({
		check: "string_format",
		format: "starts_with",
		...F(t),
		prefix: e
	});
}
// @__NO_SIDE_EFFECTS__
function gi(e, t) {
	return new $t({
		check: "string_format",
		format: "ends_with",
		...F(t),
		suffix: e
	});
}
// @__NO_SIDE_EFFECTS__
function _i(e) {
	return new en({
		check: "overwrite",
		tx: e
	});
}
// @__NO_SIDE_EFFECTS__
function vi(e) {
	return /* @__PURE__ */ _i((t) => t.normalize(e));
}
// @__NO_SIDE_EFFECTS__
function yi() {
	return /* @__PURE__ */ _i((e) => e.trim());
}
// @__NO_SIDE_EFFECTS__
function bi() {
	return /* @__PURE__ */ _i((e) => e.toLowerCase());
}
// @__NO_SIDE_EFFECTS__
function xi() {
	return /* @__PURE__ */ _i((e) => e.toUpperCase());
}
// @__NO_SIDE_EFFECTS__
function Si() {
	return /* @__PURE__ */ _i((e) => xe(e));
}
// @__NO_SIDE_EFFECTS__
function Ci(e, t, n) {
	return new e({
		type: "array",
		element: t,
		...F(n)
	});
}
// @__NO_SIDE_EFFECTS__
function wi(e, t, n) {
	return new e({
		type: "custom",
		check: "custom",
		fn: t,
		...F(n)
	});
}
// @__NO_SIDE_EFFECTS__
function Ti(e, t) {
	let n = /* @__PURE__ */ Ei((t) => (t.addIssue = (e) => {
		if (typeof e == "string") t.issues.push(Ue(e, t.value, n._zod.def));
		else {
			let r = e;
			r.fatal && (r.continue = !1), r.code ??= "custom", r.input ??= t.value, r.inst ??= n, r.continue ??= !n._zod.def.abort, t.issues.push(Ue(r));
		}
	}, e(t.value, t)), t);
	return n;
}
// @__NO_SIDE_EFFECTS__
function Ei(e, t) {
	let n = new Rt({
		check: "custom",
		...F(t)
	});
	return n._zod.check = e, n;
}
//#endregion
//#region node_modules/.pnpm/zod@4.4.3/node_modules/zod/v4/core/to-json-schema.js
function Di(e) {
	let t = e?.target ?? "draft-2020-12";
	return t === "draft-4" && (t = "draft-04"), t === "draft-7" && (t = "draft-07"), {
		processors: e.processors ?? {},
		metadataRegistry: e?.metadata ?? wr,
		target: t,
		unrepresentable: e?.unrepresentable ?? "throw",
		override: e?.override ?? (() => {}),
		io: e?.io ?? "output",
		counter: 0,
		seen: /* @__PURE__ */ new Map(),
		cycles: e?.cycles ?? "ref",
		reused: e?.reused ?? "inline",
		external: e?.external ?? void 0
	};
}
function V(e, t, n = {
	path: [],
	schemaPath: []
}) {
	var r;
	let i = e._zod.def, a = t.seen.get(e);
	if (a) return a.count++, n.schemaPath.includes(e) && (a.cycle = n.path), a.schema;
	let o = {
		schema: {},
		count: 1,
		cycle: void 0,
		path: n.path
	};
	t.seen.set(e, o);
	let s = e._zod.toJSONSchema?.();
	if (s) o.schema = s;
	else {
		let r = {
			...n,
			schemaPath: [...n.schemaPath, e],
			path: n.path
		};
		if (e._zod.processJSONSchema) e._zod.processJSONSchema(t, o.schema, r);
		else {
			let n = o.schema, a = t.processors[i.type];
			if (!a) throw Error(`[toJSONSchema]: Non-representable type encountered: ${i.type}`);
			a(e, t, n, r);
		}
		let a = e._zod.parent;
		a && (o.ref ||= a, V(a, t, r), t.seen.get(a).isParent = !0);
	}
	let c = t.metadataRegistry.get(e);
	return c && Object.assign(o.schema, c), t.io === "input" && Ai(e) && (delete o.schema.examples, delete o.schema.default), t.io === "input" && "_prefault" in o.schema && ((r = o.schema).default ?? (r.default = o.schema._prefault)), delete o.schema._prefault, t.seen.get(e).schema;
}
function Oi(e, t) {
	let n = e.seen.get(t);
	if (!n) throw Error("Unprocessed schema. This is a bug in Zod.");
	let r = /* @__PURE__ */ new Map();
	for (let t of e.seen.entries()) {
		let n = e.metadataRegistry.get(t[0])?.id;
		if (n) {
			let e = r.get(n);
			if (e && e !== t[0]) throw Error(`Duplicate schema id "${n}" detected during JSON Schema conversion. Two different schemas cannot share the same id when converted together.`);
			r.set(n, t[0]);
		}
	}
	let i = (t) => {
		let r = e.target === "draft-2020-12" ? "$defs" : "definitions";
		if (e.external) {
			let n = e.external.registry.get(t[0])?.id, i = e.external.uri ?? ((e) => e);
			if (n) return { ref: i(n) };
			let a = t[1].defId ?? t[1].schema.id ?? `schema${e.counter++}`;
			return t[1].defId = a, {
				defId: a,
				ref: `${i("__shared")}#/${r}/${a}`
			};
		}
		if (t[1] === n) return { ref: "#" };
		let i = `#/${r}/`, a = t[1].schema.id ?? `__schema${e.counter++}`;
		return {
			defId: a,
			ref: i + a
		};
	}, a = (e) => {
		if (e[1].schema.$ref) return;
		let t = e[1], { ref: n, defId: r } = i(e);
		t.def = { ...t.schema }, r && (t.defId = r);
		let a = t.schema;
		for (let e in a) delete a[e];
		a.$ref = n;
	};
	if (e.cycles === "throw") for (let t of e.seen.entries()) {
		let e = t[1];
		if (e.cycle) throw Error(`Cycle detected: #/${e.cycle?.join("/")}/<root>

Set the \`cycles\` parameter to \`"ref"\` to resolve cyclical schemas with defs.`);
	}
	for (let n of e.seen.entries()) {
		let r = n[1];
		if (t === n[0]) {
			a(n);
			continue;
		}
		if (e.external) {
			let r = e.external.registry.get(n[0])?.id;
			if (t !== n[0] && r) {
				a(n);
				continue;
			}
		}
		if (e.metadataRegistry.get(n[0])?.id) {
			a(n);
			continue;
		}
		if (r.cycle) {
			a(n);
			continue;
		}
		if (r.count > 1 && e.reused === "ref") {
			a(n);
			continue;
		}
	}
}
function ki(e, t) {
	let n = e.seen.get(t);
	if (!n) throw Error("Unprocessed schema. This is a bug in Zod.");
	let r = (t) => {
		let n = e.seen.get(t);
		if (n.ref === null) return;
		let i = n.def ?? n.schema, a = { ...i }, o = n.ref;
		if (n.ref = null, o) {
			r(o);
			let n = e.seen.get(o), s = n.schema;
			if (s.$ref && (e.target === "draft-07" || e.target === "draft-04" || e.target === "openapi-3.0") ? (i.allOf = i.allOf ?? [], i.allOf.push(s)) : Object.assign(i, s), Object.assign(i, a), t._zod.parent === o) for (let e in i) e === "$ref" || e === "allOf" || e in a || delete i[e];
			if (s.$ref && n.def) for (let e in i) e === "$ref" || e === "allOf" || e in n.def && JSON.stringify(i[e]) === JSON.stringify(n.def[e]) && delete i[e];
		}
		let s = t._zod.parent;
		if (s && s !== o) {
			r(s);
			let t = e.seen.get(s);
			if (t?.schema.$ref && (i.$ref = t.schema.$ref, t.def)) for (let e in i) e === "$ref" || e === "allOf" || e in t.def && JSON.stringify(i[e]) === JSON.stringify(t.def[e]) && delete i[e];
		}
		e.override({
			zodSchema: t,
			jsonSchema: i,
			path: n.path ?? []
		});
	};
	for (let t of [...e.seen.entries()].reverse()) r(t[0]);
	let i = {};
	if (e.target === "draft-2020-12" ? i.$schema = "https://json-schema.org/draft/2020-12/schema" : e.target === "draft-07" ? i.$schema = "http://json-schema.org/draft-07/schema#" : e.target === "draft-04" ? i.$schema = "http://json-schema.org/draft-04/schema#" : e.target, e.external?.uri) {
		let n = e.external.registry.get(t)?.id;
		if (!n) throw Error("Schema is missing an `id` property");
		i.$id = e.external.uri(n);
	}
	Object.assign(i, n.def ?? n.schema);
	let a = e.metadataRegistry.get(t)?.id;
	a !== void 0 && i.id === a && delete i.id;
	let o = e.external?.defs ?? {};
	for (let t of e.seen.entries()) {
		let e = t[1];
		e.def && e.defId && (e.def.id === e.defId && delete e.def.id, o[e.defId] = e.def);
	}
	e.external || Object.keys(o).length > 0 && (e.target === "draft-2020-12" ? i.$defs = o : i.definitions = o);
	try {
		let n = JSON.parse(JSON.stringify(i));
		return Object.defineProperty(n, "~standard", {
			value: {
				...t["~standard"],
				jsonSchema: {
					input: Mi(t, "input", e.processors),
					output: Mi(t, "output", e.processors)
				}
			},
			enumerable: !1,
			writable: !1
		}), n;
	} catch {
		throw Error("Error converting schema to JSON.");
	}
}
function Ai(e, t) {
	let n = t ?? { seen: /* @__PURE__ */ new Set() };
	if (n.seen.has(e)) return !1;
	n.seen.add(e);
	let r = e._zod.def;
	if (r.type === "transform") return !0;
	if (r.type === "array") return Ai(r.element, n);
	if (r.type === "set") return Ai(r.valueType, n);
	if (r.type === "lazy") return Ai(r.getter(), n);
	if (r.type === "promise" || r.type === "optional" || r.type === "nonoptional" || r.type === "nullable" || r.type === "readonly" || r.type === "default" || r.type === "prefault") return Ai(r.innerType, n);
	if (r.type === "intersection") return Ai(r.left, n) || Ai(r.right, n);
	if (r.type === "record" || r.type === "map") return Ai(r.keyType, n) || Ai(r.valueType, n);
	if (r.type === "pipe") return e._zod.traits.has("$ZodCodec") ? !0 : Ai(r.in, n) || Ai(r.out, n);
	if (r.type === "object") {
		for (let e in r.shape) if (Ai(r.shape[e], n)) return !0;
		return !1;
	}
	if (r.type === "union") {
		for (let e of r.options) if (Ai(e, n)) return !0;
		return !1;
	}
	if (r.type === "tuple") {
		for (let e of r.items) if (Ai(e, n)) return !0;
		return !!(r.rest && Ai(r.rest, n));
	}
	return !1;
}
var ji = (e, t = {}) => (n) => {
	let r = Di({
		...n,
		processors: t
	});
	return V(e, r), Oi(r, e), ki(r, e);
}, Mi = (e, t, n = {}) => (r) => {
	let { libraryOptions: i, target: a } = r ?? {}, o = Di({
		...i ?? {},
		target: a,
		io: t,
		processors: n
	});
	return V(e, o), Oi(o, e), ki(o, e);
}, Ni = {
	guid: "uuid",
	url: "uri",
	datetime: "date-time",
	json_string: "json-string",
	regex: ""
}, Pi = (e, t, n, r) => {
	let i = n;
	i.type = "string";
	let { minimum: a, maximum: o, format: s, patterns: c, contentEncoding: l } = e._zod.bag;
	if (typeof a == "number" && (i.minLength = a), typeof o == "number" && (i.maxLength = o), s && (i.format = Ni[s] ?? s, i.format === "" && delete i.format, s === "time" && delete i.format), l && (i.contentEncoding = l), c && c.size > 0) {
		let e = [...c];
		e.length === 1 ? i.pattern = e[0].source : e.length > 1 && (i.allOf = [...e.map((e) => ({
			...t.target === "draft-07" || t.target === "draft-04" || t.target === "openapi-3.0" ? { type: "string" } : {},
			pattern: e.source
		}))]);
	}
}, Fi = (e, t, n, r) => {
	let i = n, { minimum: a, maximum: o, format: s, multipleOf: c, exclusiveMaximum: l, exclusiveMinimum: u } = e._zod.bag;
	typeof s == "string" && s.includes("int") ? i.type = "integer" : i.type = "number";
	let d = typeof u == "number" && u >= (a ?? -Infinity), f = typeof l == "number" && l <= (o ?? Infinity), p = t.target === "draft-04" || t.target === "openapi-3.0";
	d ? p ? (i.minimum = u, i.exclusiveMinimum = !0) : i.exclusiveMinimum = u : typeof a == "number" && (i.minimum = a), f ? p ? (i.maximum = l, i.exclusiveMaximum = !0) : i.exclusiveMaximum = l : typeof o == "number" && (i.maximum = o), typeof c == "number" && (i.multipleOf = c);
}, Ii = (e, t, n, r) => {
	n.type = "boolean";
}, Li = (e, t, n, r) => {
	n.not = {};
}, Ri = (e, t, n, r) => {
	let i = e._zod.def, a = j(i.entries);
	a.every((e) => typeof e == "number") && (n.type = "number"), a.every((e) => typeof e == "string") && (n.type = "string"), n.enum = a;
}, zi = (e, t, n, r) => {
	let i = e._zod.def, a = [];
	for (let e of i.values) if (e === void 0) {
		if (t.unrepresentable === "throw") throw Error("Literal `undefined` cannot be represented in JSON Schema");
	} else if (typeof e == "bigint") {
		if (t.unrepresentable === "throw") throw Error("BigInt literals cannot be represented in JSON Schema");
		a.push(Number(e));
	} else a.push(e);
	if (a.length !== 0) if (a.length === 1) {
		let e = a[0];
		n.type = e === null ? "null" : typeof e, t.target === "draft-04" || t.target === "openapi-3.0" ? n.enum = [e] : n.const = e;
	} else a.every((e) => typeof e == "number") && (n.type = "number"), a.every((e) => typeof e == "string") && (n.type = "string"), a.every((e) => typeof e == "boolean") && (n.type = "boolean"), a.every((e) => e === null) && (n.type = "null"), n.enum = a;
}, Bi = (e, t, n, r) => {
	if (t.unrepresentable === "throw") throw Error("Custom types cannot be represented in JSON Schema");
}, Vi = (e, t, n, r) => {
	if (t.unrepresentable === "throw") throw Error("Transforms cannot be represented in JSON Schema");
}, Hi = (e, t, n, r) => {
	let i = n, a = e._zod.def, { minimum: o, maximum: s } = e._zod.bag;
	typeof o == "number" && (i.minItems = o), typeof s == "number" && (i.maxItems = s), i.type = "array", i.items = V(a.element, t, {
		...r,
		path: [...r.path, "items"]
	});
}, Ui = (e, t, n, r) => {
	let i = n, a = e._zod.def;
	i.type = "object", i.properties = {};
	let o = a.shape;
	for (let e in o) i.properties[e] = V(o[e], t, {
		...r,
		path: [
			...r.path,
			"properties",
			e
		]
	});
	let s = new Set(Object.keys(o)), c = new Set([...s].filter((e) => {
		let n = a.shape[e]._zod;
		return t.io === "input" ? n.optin === void 0 : n.optout === void 0;
	}));
	c.size > 0 && (i.required = Array.from(c)), a.catchall?._zod.def.type === "never" ? i.additionalProperties = !1 : a.catchall ? a.catchall && (i.additionalProperties = V(a.catchall, t, {
		...r,
		path: [...r.path, "additionalProperties"]
	})) : t.io === "output" && (i.additionalProperties = !1);
}, Wi = (e, t, n, r) => {
	let i = e._zod.def, a = i.inclusive === !1, o = i.options.map((e, n) => V(e, t, {
		...r,
		path: [
			...r.path,
			a ? "oneOf" : "anyOf",
			n
		]
	}));
	a ? n.oneOf = o : n.anyOf = o;
}, Gi = (e, t, n, r) => {
	let i = e._zod.def, a = V(i.left, t, {
		...r,
		path: [
			...r.path,
			"allOf",
			0
		]
	}), o = V(i.right, t, {
		...r,
		path: [
			...r.path,
			"allOf",
			1
		]
	}), s = (e) => "allOf" in e && Object.keys(e).length === 1;
	n.allOf = [...s(a) ? a.allOf : [a], ...s(o) ? o.allOf : [o]];
}, Ki = (e, t, n, r) => {
	let i = n, a = e._zod.def;
	i.type = "array";
	let o = t.target === "draft-2020-12" ? "prefixItems" : "items", s = t.target === "draft-2020-12" || t.target === "openapi-3.0" ? "items" : "additionalItems", c = a.items.map((e, n) => V(e, t, {
		...r,
		path: [
			...r.path,
			o,
			n
		]
	})), l = a.rest ? V(a.rest, t, {
		...r,
		path: [
			...r.path,
			s,
			...t.target === "openapi-3.0" ? [a.items.length] : []
		]
	}) : null;
	t.target === "draft-2020-12" ? (i.prefixItems = c, l && (i.items = l)) : t.target === "openapi-3.0" ? (i.items = { anyOf: c }, l && i.items.anyOf.push(l), i.minItems = c.length, l || (i.maxItems = c.length)) : (i.items = c, l && (i.additionalItems = l));
	let { minimum: u, maximum: d } = e._zod.bag;
	typeof u == "number" && (i.minItems = u), typeof d == "number" && (i.maxItems = d);
}, qi = (e, t, n, r) => {
	let i = n, a = e._zod.def;
	i.type = "object";
	let o = a.keyType, s = o._zod.bag?.patterns;
	if (a.mode === "loose" && s && s.size > 0) {
		let e = V(a.valueType, t, {
			...r,
			path: [
				...r.path,
				"patternProperties",
				"*"
			]
		});
		i.patternProperties = {};
		for (let t of s) i.patternProperties[t.source] = e;
	} else (t.target === "draft-07" || t.target === "draft-2020-12") && (i.propertyNames = V(a.keyType, t, {
		...r,
		path: [...r.path, "propertyNames"]
	})), i.additionalProperties = V(a.valueType, t, {
		...r,
		path: [...r.path, "additionalProperties"]
	});
	let c = o._zod.values;
	if (c) {
		let e = [...c].filter((e) => typeof e == "string" || typeof e == "number");
		e.length > 0 && (i.required = e);
	}
}, Ji = (e, t, n, r) => {
	let i = e._zod.def, a = V(i.innerType, t, r), o = t.seen.get(e);
	t.target === "openapi-3.0" ? (o.ref = i.innerType, n.nullable = !0) : n.anyOf = [a, { type: "null" }];
}, Yi = (e, t, n, r) => {
	let i = e._zod.def;
	V(i.innerType, t, r);
	let a = t.seen.get(e);
	a.ref = i.innerType;
}, Xi = (e, t, n, r) => {
	let i = e._zod.def;
	V(i.innerType, t, r);
	let a = t.seen.get(e);
	a.ref = i.innerType, n.default = JSON.parse(JSON.stringify(i.defaultValue));
}, Zi = (e, t, n, r) => {
	let i = e._zod.def;
	V(i.innerType, t, r);
	let a = t.seen.get(e);
	a.ref = i.innerType, t.io === "input" && (n._prefault = JSON.parse(JSON.stringify(i.defaultValue)));
}, Qi = (e, t, n, r) => {
	let i = e._zod.def;
	V(i.innerType, t, r);
	let a = t.seen.get(e);
	a.ref = i.innerType;
	let o;
	try {
		o = i.catchValue(void 0);
	} catch {
		throw Error("Dynamic catch values are not supported in JSON Schema");
	}
	n.default = o;
}, $i = (e, t, n, r) => {
	let i = e._zod.def, a = i.in._zod.traits.has("$ZodTransform"), o = t.io === "input" ? a ? i.out : i.in : i.out;
	V(o, t, r);
	let s = t.seen.get(e);
	s.ref = o;
}, ea = (e, t, n, r) => {
	let i = e._zod.def;
	V(i.innerType, t, r);
	let a = t.seen.get(e);
	a.ref = i.innerType, n.readOnly = !0;
}, ta = (e, t, n, r) => {
	let i = e._zod.def;
	V(i.innerType, t, r);
	let a = t.seen.get(e);
	a.ref = i.innerType;
}, na = (e, t, n, r) => {
	let i = e._zod.innerType;
	V(i, t, r);
	let a = t.seen.get(e);
	a.ref = i;
}, ra = /*@__PURE__*/ k("ZodISODateTime", (e, t) => {
	gn.init(e, t), W.init(e, t);
});
function ia(e) {
	return /* @__PURE__ */ Jr(ra, e);
}
var aa = /*@__PURE__*/ k("ZodISODate", (e, t) => {
	_n.init(e, t), W.init(e, t);
});
function oa(e) {
	return /* @__PURE__ */ Yr(aa, e);
}
var sa = /*@__PURE__*/ k("ZodISOTime", (e, t) => {
	vn.init(e, t), W.init(e, t);
});
function ca(e) {
	return /* @__PURE__ */ Xr(sa, e);
}
var la = /*@__PURE__*/ k("ZodISODuration", (e, t) => {
	yn.init(e, t), W.init(e, t);
});
function ua(e) {
	return /* @__PURE__ */ Zr(la, e);
}
var da = /*@__PURE__*/ k("ZodError", (e, t) => {
	Ge.init(e, t), e.name = "ZodError", Object.defineProperties(e, {
		format: { value: (t) => L(e, t) },
		flatten: { value: (t) => qe(e, t) },
		addIssue: { value: (t) => {
			e.issues.push(t), e.message = JSON.stringify(e.issues, pe, 2);
		} },
		addIssues: { value: (t) => {
			e.issues.push(...t), e.message = JSON.stringify(e.issues, pe, 2);
		} },
		isEmpty: { get() {
			return e.issues.length === 0;
		} }
	});
}, { Parent: Error }), fa = /* @__PURE__ */ Je(da), pa = /* @__PURE__ */ R(da), ma = /* @__PURE__ */ Ye(da), ha = /* @__PURE__ */ Ze(da), ga = /* @__PURE__ */ $e(da), _a = /* @__PURE__ */ et(da), va = /* @__PURE__ */ tt(da), ya = /* @__PURE__ */ nt(da), ba = /* @__PURE__ */ rt(da), xa = /* @__PURE__ */ it(da), Sa = /* @__PURE__ */ at(da), Ca = /* @__PURE__ */ ot(da), wa = /* @__PURE__ */ new WeakMap();
function Ta(e, t, n) {
	let r = Object.getPrototypeOf(e), i = wa.get(r);
	if (i || (i = /* @__PURE__ */ new Set(), wa.set(r, i)), !i.has(t)) {
		i.add(t);
		for (let e in n) {
			let t = n[e];
			Object.defineProperty(r, e, {
				configurable: !0,
				enumerable: !1,
				get() {
					let n = t.bind(this);
					return Object.defineProperty(this, e, {
						configurable: !0,
						writable: !0,
						enumerable: !0,
						value: n
					}), n;
				},
				set(t) {
					Object.defineProperty(this, e, {
						configurable: !0,
						writable: !0,
						enumerable: !0,
						value: t
					});
				}
			});
		}
	}
}
var H = /*@__PURE__*/ k("ZodType", (e, t) => (z.init(e, t), Object.assign(e["~standard"], { jsonSchema: {
	input: Mi(e, "input"),
	output: Mi(e, "output")
} }), e.toJSONSchema = ji(e, {}), e.def = t, e.type = t.type, Object.defineProperty(e, "_def", { value: t }), e.parse = (t, n) => fa(e, t, n, { callee: e.parse }), e.safeParse = (t, n) => ma(e, t, n), e.parseAsync = async (t, n) => pa(e, t, n, { callee: e.parseAsync }), e.safeParseAsync = async (t, n) => ha(e, t, n), e.spa = e.safeParseAsync, e.encode = (t, n) => ga(e, t, n), e.decode = (t, n) => _a(e, t, n), e.encodeAsync = async (t, n) => va(e, t, n), e.decodeAsync = async (t, n) => ya(e, t, n), e.safeEncode = (t, n) => ba(e, t, n), e.safeDecode = (t, n) => xa(e, t, n), e.safeEncodeAsync = async (t, n) => Sa(e, t, n), e.safeDecodeAsync = async (t, n) => Ca(e, t, n), Ta(e, "ZodType", {
	check(...e) {
		let t = this.def;
		return this.clone(ye(t, { checks: [...t.checks ?? [], ...e.map((e) => typeof e == "function" ? { _zod: {
			check: e,
			def: { check: "custom" },
			onattach: []
		} } : e)] }), { parent: !0 });
	},
	with(...e) {
		return this.check(...e);
	},
	clone(e, t) {
		return Oe(this, e, t);
	},
	brand() {
		return this;
	},
	register(e, t) {
		return e.add(this, t), this;
	},
	refine(e, t) {
		return this.check(Uo(e, t));
	},
	superRefine(e, t) {
		return this.check(Wo(e, t));
	},
	overwrite(e) {
		return this.check(/* @__PURE__ */ _i(e));
	},
	optional() {
		return So(this);
	},
	exactOptional() {
		return wo(this);
	},
	nullable() {
		return Eo(this);
	},
	nullish() {
		return So(Eo(this));
	},
	nonoptional(e) {
		return Mo(this, e);
	},
	array() {
		return ro(this);
	},
	or(e) {
		return oo([this, e]);
	},
	and(e) {
		return uo(this, e);
	},
	transform(e) {
		return Io(this, bo(e));
	},
	default(e) {
		return Oo(this, e);
	},
	prefault(e) {
		return Ao(this, e);
	},
	catch(e) {
		return Po(this, e);
	},
	pipe(e) {
		return Io(this, e);
	},
	readonly() {
		return zo(this);
	},
	describe(e) {
		let t = this.clone();
		return wr.add(t, { description: e }), t;
	},
	meta(...e) {
		if (e.length === 0) return wr.get(this);
		let t = this.clone();
		return wr.add(t, e[0]), t;
	},
	isOptional() {
		return this.safeParse(void 0).success;
	},
	isNullable() {
		return this.safeParse(null).success;
	},
	apply(e) {
		return e(this);
	}
}), Object.defineProperty(e, "description", {
	get() {
		return wr.get(e)?.description;
	},
	configurable: !0
}), e)), Ea = /*@__PURE__*/ k("_ZodString", (e, t) => {
	rn.init(e, t), H.init(e, t), e._zod.processJSONSchema = (t, n, r) => Pi(e, t, n, r);
	let n = e._zod.bag;
	e.format = n.format ?? null, e.minLength = n.minimum ?? null, e.maxLength = n.maximum ?? null, Ta(e, "_ZodString", {
		regex(...e) {
			return this.check(/* @__PURE__ */ di(...e));
		},
		includes(...e) {
			return this.check(/* @__PURE__ */ mi(...e));
		},
		startsWith(...e) {
			return this.check(/* @__PURE__ */ hi(...e));
		},
		endsWith(...e) {
			return this.check(/* @__PURE__ */ gi(...e));
		},
		min(...e) {
			return this.check(/* @__PURE__ */ li(...e));
		},
		max(...e) {
			return this.check(/* @__PURE__ */ ci(...e));
		},
		length(...e) {
			return this.check(/* @__PURE__ */ ui(...e));
		},
		nonempty(...e) {
			return this.check(/* @__PURE__ */ li(1, ...e));
		},
		lowercase(e) {
			return this.check(/* @__PURE__ */ fi(e));
		},
		uppercase(e) {
			return this.check(/* @__PURE__ */ pi(e));
		},
		trim() {
			return this.check(/* @__PURE__ */ yi());
		},
		normalize(...e) {
			return this.check(/* @__PURE__ */ vi(...e));
		},
		toLowerCase() {
			return this.check(/* @__PURE__ */ bi());
		},
		toUpperCase() {
			return this.check(/* @__PURE__ */ xi());
		},
		slugify() {
			return this.check(/* @__PURE__ */ Si());
		}
	});
}), Da = /*@__PURE__*/ k("ZodString", (e, t) => {
	rn.init(e, t), Ea.init(e, t), e.email = (t) => e.check(/* @__PURE__ */ Er(Oa, t)), e.url = (t) => e.check(/* @__PURE__ */ Mr(ja, t)), e.jwt = (t) => e.check(/* @__PURE__ */ qr(Ka, t)), e.emoji = (t) => e.check(/* @__PURE__ */ Nr(Ma, t)), e.guid = (t) => e.check(/* @__PURE__ */ Dr(ka, t)), e.uuid = (t) => e.check(/* @__PURE__ */ Or(Aa, t)), e.uuidv4 = (t) => e.check(/* @__PURE__ */ kr(Aa, t)), e.uuidv6 = (t) => e.check(/* @__PURE__ */ Ar(Aa, t)), e.uuidv7 = (t) => e.check(/* @__PURE__ */ jr(Aa, t)), e.nanoid = (t) => e.check(/* @__PURE__ */ Pr(Na, t)), e.guid = (t) => e.check(/* @__PURE__ */ Dr(ka, t)), e.cuid = (t) => e.check(/* @__PURE__ */ Fr(Pa, t)), e.cuid2 = (t) => e.check(/* @__PURE__ */ Ir(Fa, t)), e.ulid = (t) => e.check(/* @__PURE__ */ Lr(Ia, t)), e.base64 = (t) => e.check(/* @__PURE__ */ Wr(Ua, t)), e.base64url = (t) => e.check(/* @__PURE__ */ Gr(Wa, t)), e.xid = (t) => e.check(/* @__PURE__ */ Rr(La, t)), e.ksuid = (t) => e.check(/* @__PURE__ */ zr(Ra, t)), e.ipv4 = (t) => e.check(/* @__PURE__ */ Br(za, t)), e.ipv6 = (t) => e.check(/* @__PURE__ */ Vr(Ba, t)), e.cidrv4 = (t) => e.check(/* @__PURE__ */ Hr(Va, t)), e.cidrv6 = (t) => e.check(/* @__PURE__ */ Ur(Ha, t)), e.e164 = (t) => e.check(/* @__PURE__ */ Kr(Ga, t)), e.datetime = (t) => e.check(ia(t)), e.date = (t) => e.check(oa(t)), e.time = (t) => e.check(ca(t)), e.duration = (t) => e.check(ua(t));
});
function U(e) {
	return /* @__PURE__ */ Tr(Da, e);
}
var W = /*@__PURE__*/ k("ZodStringFormat", (e, t) => {
	B.init(e, t), Ea.init(e, t);
}), Oa = /*@__PURE__*/ k("ZodEmail", (e, t) => {
	sn.init(e, t), W.init(e, t);
}), ka = /*@__PURE__*/ k("ZodGUID", (e, t) => {
	an.init(e, t), W.init(e, t);
}), Aa = /*@__PURE__*/ k("ZodUUID", (e, t) => {
	on.init(e, t), W.init(e, t);
}), ja = /*@__PURE__*/ k("ZodURL", (e, t) => {
	cn.init(e, t), W.init(e, t);
}), Ma = /*@__PURE__*/ k("ZodEmoji", (e, t) => {
	ln.init(e, t), W.init(e, t);
}), Na = /*@__PURE__*/ k("ZodNanoID", (e, t) => {
	un.init(e, t), W.init(e, t);
}), Pa = /*@__PURE__*/ k("ZodCUID", (e, t) => {
	dn.init(e, t), W.init(e, t);
}), Fa = /*@__PURE__*/ k("ZodCUID2", (e, t) => {
	fn.init(e, t), W.init(e, t);
}), Ia = /*@__PURE__*/ k("ZodULID", (e, t) => {
	pn.init(e, t), W.init(e, t);
}), La = /*@__PURE__*/ k("ZodXID", (e, t) => {
	mn.init(e, t), W.init(e, t);
}), Ra = /*@__PURE__*/ k("ZodKSUID", (e, t) => {
	hn.init(e, t), W.init(e, t);
}), za = /*@__PURE__*/ k("ZodIPv4", (e, t) => {
	bn.init(e, t), W.init(e, t);
}), Ba = /*@__PURE__*/ k("ZodIPv6", (e, t) => {
	xn.init(e, t), W.init(e, t);
}), Va = /*@__PURE__*/ k("ZodCIDRv4", (e, t) => {
	Sn.init(e, t), W.init(e, t);
}), Ha = /*@__PURE__*/ k("ZodCIDRv6", (e, t) => {
	Cn.init(e, t), W.init(e, t);
}), Ua = /*@__PURE__*/ k("ZodBase64", (e, t) => {
	Tn.init(e, t), W.init(e, t);
}), Wa = /*@__PURE__*/ k("ZodBase64URL", (e, t) => {
	Dn.init(e, t), W.init(e, t);
}), Ga = /*@__PURE__*/ k("ZodE164", (e, t) => {
	On.init(e, t), W.init(e, t);
}), Ka = /*@__PURE__*/ k("ZodJWT", (e, t) => {
	An.init(e, t), W.init(e, t);
}), qa = /*@__PURE__*/ k("ZodNumber", (e, t) => {
	jn.init(e, t), H.init(e, t), e._zod.processJSONSchema = (t, n, r) => Fi(e, t, n, r), Ta(e, "ZodNumber", {
		gt(e, t) {
			return this.check(/* @__PURE__ */ ai(e, t));
		},
		gte(e, t) {
			return this.check(/* @__PURE__ */ oi(e, t));
		},
		min(e, t) {
			return this.check(/* @__PURE__ */ oi(e, t));
		},
		lt(e, t) {
			return this.check(/* @__PURE__ */ ri(e, t));
		},
		lte(e, t) {
			return this.check(/* @__PURE__ */ ii(e, t));
		},
		max(e, t) {
			return this.check(/* @__PURE__ */ ii(e, t));
		},
		int(e) {
			return this.check(Ya(e));
		},
		safe(e) {
			return this.check(Ya(e));
		},
		positive(e) {
			return this.check(/* @__PURE__ */ ai(0, e));
		},
		nonnegative(e) {
			return this.check(/* @__PURE__ */ oi(0, e));
		},
		negative(e) {
			return this.check(/* @__PURE__ */ ri(0, e));
		},
		nonpositive(e) {
			return this.check(/* @__PURE__ */ ii(0, e));
		},
		multipleOf(e, t) {
			return this.check(/* @__PURE__ */ si(e, t));
		},
		step(e, t) {
			return this.check(/* @__PURE__ */ si(e, t));
		},
		finite() {
			return this;
		}
	});
	let n = e._zod.bag;
	e.minValue = Math.max(n.minimum ?? -Infinity, n.exclusiveMinimum ?? -Infinity) ?? null, e.maxValue = Math.min(n.maximum ?? Infinity, n.exclusiveMaximum ?? Infinity) ?? null, e.isInt = (n.format ?? "").includes("int") || Number.isSafeInteger(n.multipleOf ?? .5), e.isFinite = !0, e.format = n.format ?? null;
});
function G(e) {
	return /* @__PURE__ */ Qr(qa, e);
}
var Ja = /*@__PURE__*/ k("ZodNumberFormat", (e, t) => {
	Mn.init(e, t), qa.init(e, t);
});
function Ya(e) {
	return /* @__PURE__ */ $r(Ja, e);
}
var Xa = /*@__PURE__*/ k("ZodBoolean", (e, t) => {
	Nn.init(e, t), H.init(e, t), e._zod.processJSONSchema = (t, n, r) => Ii(e, t, n, r);
});
function Za(e) {
	return /* @__PURE__ */ ei(Xa, e);
}
var Qa = /*@__PURE__*/ k("ZodUnknown", (e, t) => {
	Pn.init(e, t), H.init(e, t), e._zod.processJSONSchema = (e, t, n) => void 0;
});
function $a() {
	return /* @__PURE__ */ ti(Qa);
}
var eo = /*@__PURE__*/ k("ZodNever", (e, t) => {
	Fn.init(e, t), H.init(e, t), e._zod.processJSONSchema = (t, n, r) => Li(e, t, n, r);
});
function to(e) {
	return /* @__PURE__ */ ni(eo, e);
}
var no = /*@__PURE__*/ k("ZodArray", (e, t) => {
	Ln.init(e, t), H.init(e, t), e._zod.processJSONSchema = (t, n, r) => Hi(e, t, n, r), e.element = t.element, Ta(e, "ZodArray", {
		min(e, t) {
			return this.check(/* @__PURE__ */ li(e, t));
		},
		nonempty(e) {
			return this.check(/* @__PURE__ */ li(1, e));
		},
		max(e, t) {
			return this.check(/* @__PURE__ */ ci(e, t));
		},
		length(e, t) {
			return this.check(/* @__PURE__ */ ui(e, t));
		},
		unwrap() {
			return this.element;
		}
	});
});
function ro(e, t) {
	return /* @__PURE__ */ Ci(no, e, t);
}
var io = /*@__PURE__*/ k("ZodObject", (e, t) => {
	Hn.init(e, t), H.init(e, t), e._zod.processJSONSchema = (t, n, r) => Ui(e, t, n, r), N(e, "shape", () => t.shape), Ta(e, "ZodObject", {
		keyof() {
			return _o(Object.keys(this._zod.def.shape));
		},
		catchall(e) {
			return this.clone({
				...this._zod.def,
				catchall: e
			});
		},
		passthrough() {
			return this.clone({
				...this._zod.def,
				catchall: $a()
			});
		},
		loose() {
			return this.clone({
				...this._zod.def,
				catchall: $a()
			});
		},
		strict() {
			return this.clone({
				...this._zod.def,
				catchall: to()
			});
		},
		strip() {
			return this.clone({
				...this._zod.def,
				catchall: void 0
			});
		},
		extend(e) {
			return Ne(this, e);
		},
		safeExtend(e) {
			return Pe(this, e);
		},
		merge(e) {
			return I(this, e);
		},
		pick(e) {
			return je(this, e);
		},
		omit(e) {
			return Me(this, e);
		},
		partial(...e) {
			return Fe(xo, this, e[0]);
		},
		required(...e) {
			return Ie(jo, this, e[0]);
		}
	});
});
function K(e, t) {
	return new io({
		type: "object",
		shape: e ?? {},
		...F(t)
	});
}
var ao = /*@__PURE__*/ k("ZodUnion", (e, t) => {
	Wn.init(e, t), H.init(e, t), e._zod.processJSONSchema = (t, n, r) => Wi(e, t, n, r), e.options = t.options;
});
function oo(e, t) {
	return new ao({
		type: "union",
		options: e,
		...F(t)
	});
}
var so = /*@__PURE__*/ k("ZodDiscriminatedUnion", (e, t) => {
	ao.init(e, t), Gn.init(e, t);
});
function co(e, t, n) {
	return new so({
		type: "union",
		options: t,
		discriminator: e,
		...F(n)
	});
}
var lo = /*@__PURE__*/ k("ZodIntersection", (e, t) => {
	Kn.init(e, t), H.init(e, t), e._zod.processJSONSchema = (t, n, r) => Gi(e, t, n, r);
});
function uo(e, t) {
	return new lo({
		type: "intersection",
		left: e,
		right: t
	});
}
var fo = /*@__PURE__*/ k("ZodTuple", (e, t) => {
	Yn.init(e, t), H.init(e, t), e._zod.processJSONSchema = (t, n, r) => Ki(e, t, n, r), e.rest = (t) => e.clone({
		...e._zod.def,
		rest: t
	});
});
function po(e, t, n) {
	let r = t instanceof z;
	return new fo({
		type: "tuple",
		items: e,
		rest: r ? t : null,
		...F(r ? n : t)
	});
}
var mo = /*@__PURE__*/ k("ZodRecord", (e, t) => {
	$n.init(e, t), H.init(e, t), e._zod.processJSONSchema = (t, n, r) => qi(e, t, n, r), e.keyType = t.keyType, e.valueType = t.valueType;
});
function ho(e, t, n) {
	return !t || !t._zod ? new mo({
		type: "record",
		keyType: U(),
		valueType: e,
		...F(t)
	}) : new mo({
		type: "record",
		keyType: e,
		valueType: t,
		...F(n)
	});
}
var go = /*@__PURE__*/ k("ZodEnum", (e, t) => {
	er.init(e, t), H.init(e, t), e._zod.processJSONSchema = (t, n, r) => Ri(e, t, n, r), e.enum = t.entries, e.options = Object.values(t.entries);
	let n = new Set(Object.keys(t.entries));
	e.extract = (e, r) => {
		let i = {};
		for (let r of e) if (n.has(r)) i[r] = t.entries[r];
		else throw Error(`Key ${r} not found in enum`);
		return new go({
			...t,
			checks: [],
			...F(r),
			entries: i
		});
	}, e.exclude = (e, r) => {
		let i = { ...t.entries };
		for (let t of e) if (n.has(t)) delete i[t];
		else throw Error(`Key ${t} not found in enum`);
		return new go({
			...t,
			checks: [],
			...F(r),
			entries: i
		});
	};
});
function _o(e, t) {
	return new go({
		type: "enum",
		entries: Array.isArray(e) ? Object.fromEntries(e.map((e) => [e, e])) : e,
		...F(t)
	});
}
var vo = /*@__PURE__*/ k("ZodLiteral", (e, t) => {
	tr.init(e, t), H.init(e, t), e._zod.processJSONSchema = (t, n, r) => zi(e, t, n, r), e.values = new Set(t.values), Object.defineProperty(e, "value", { get() {
		if (t.values.length > 1) throw Error("This schema contains multiple valid literal values. Use `.values` instead.");
		return t.values[0];
	} });
});
function q(e, t) {
	return new vo({
		type: "literal",
		values: Array.isArray(e) ? e : [e],
		...F(t)
	});
}
var yo = /*@__PURE__*/ k("ZodTransform", (e, t) => {
	nr.init(e, t), H.init(e, t), e._zod.processJSONSchema = (t, n, r) => Vi(e, t, n, r), e._zod.parse = (n, r) => {
		if (r.direction === "backward") throw new ue(e.constructor.name);
		n.addIssue = (r) => {
			if (typeof r == "string") n.issues.push(Ue(r, n.value, t));
			else {
				let t = r;
				t.fatal && (t.continue = !1), t.code ??= "custom", t.input ??= n.value, t.inst ??= e, n.issues.push(Ue(t));
			}
		};
		let i = t.transform(n.value, n);
		return i instanceof Promise ? i.then((e) => (n.value = e, n.fallback = !0, n)) : (n.value = i, n.fallback = !0, n);
	};
});
function bo(e) {
	return new yo({
		type: "transform",
		transform: e
	});
}
var xo = /*@__PURE__*/ k("ZodOptional", (e, t) => {
	ir.init(e, t), H.init(e, t), e._zod.processJSONSchema = (t, n, r) => ta(e, t, n, r), e.unwrap = () => e._zod.def.innerType;
});
function So(e) {
	return new xo({
		type: "optional",
		innerType: e
	});
}
var Co = /*@__PURE__*/ k("ZodExactOptional", (e, t) => {
	ar.init(e, t), H.init(e, t), e._zod.processJSONSchema = (t, n, r) => ta(e, t, n, r), e.unwrap = () => e._zod.def.innerType;
});
function wo(e) {
	return new Co({
		type: "optional",
		innerType: e
	});
}
var To = /*@__PURE__*/ k("ZodNullable", (e, t) => {
	or.init(e, t), H.init(e, t), e._zod.processJSONSchema = (t, n, r) => Ji(e, t, n, r), e.unwrap = () => e._zod.def.innerType;
});
function Eo(e) {
	return new To({
		type: "nullable",
		innerType: e
	});
}
var Do = /*@__PURE__*/ k("ZodDefault", (e, t) => {
	sr.init(e, t), H.init(e, t), e._zod.processJSONSchema = (t, n, r) => Xi(e, t, n, r), e.unwrap = () => e._zod.def.innerType, e.removeDefault = e.unwrap;
});
function Oo(e, t) {
	return new Do({
		type: "default",
		innerType: e,
		get defaultValue() {
			return typeof t == "function" ? t() : Ee(t);
		}
	});
}
var ko = /*@__PURE__*/ k("ZodPrefault", (e, t) => {
	lr.init(e, t), H.init(e, t), e._zod.processJSONSchema = (t, n, r) => Zi(e, t, n, r), e.unwrap = () => e._zod.def.innerType;
});
function Ao(e, t) {
	return new ko({
		type: "prefault",
		innerType: e,
		get defaultValue() {
			return typeof t == "function" ? t() : Ee(t);
		}
	});
}
var jo = /*@__PURE__*/ k("ZodNonOptional", (e, t) => {
	ur.init(e, t), H.init(e, t), e._zod.processJSONSchema = (t, n, r) => Yi(e, t, n, r), e.unwrap = () => e._zod.def.innerType;
});
function Mo(e, t) {
	return new jo({
		type: "nonoptional",
		innerType: e,
		...F(t)
	});
}
var No = /*@__PURE__*/ k("ZodCatch", (e, t) => {
	fr.init(e, t), H.init(e, t), e._zod.processJSONSchema = (t, n, r) => Qi(e, t, n, r), e.unwrap = () => e._zod.def.innerType, e.removeCatch = e.unwrap;
});
function Po(e, t) {
	return new No({
		type: "catch",
		innerType: e,
		catchValue: typeof t == "function" ? t : () => t
	});
}
var Fo = /*@__PURE__*/ k("ZodPipe", (e, t) => {
	pr.init(e, t), H.init(e, t), e._zod.processJSONSchema = (t, n, r) => $i(e, t, n, r), e.in = t.in, e.out = t.out;
});
function Io(e, t) {
	return new Fo({
		type: "pipe",
		in: e,
		out: t
	});
}
var Lo = /*@__PURE__*/ k("ZodPreprocess", (e, t) => {
	Fo.init(e, t), hr.init(e, t);
}), Ro = /*@__PURE__*/ k("ZodReadonly", (e, t) => {
	gr.init(e, t), H.init(e, t), e._zod.processJSONSchema = (t, n, r) => ea(e, t, n, r), e.unwrap = () => e._zod.def.innerType;
});
function zo(e) {
	return new Ro({
		type: "readonly",
		innerType: e
	});
}
var Bo = /*@__PURE__*/ k("ZodLazy", (e, t) => {
	vr.init(e, t), H.init(e, t), e._zod.processJSONSchema = (t, n, r) => na(e, t, n, r), e.unwrap = () => e._zod.def.getter();
});
function Vo(e) {
	return new Bo({
		type: "lazy",
		getter: e
	});
}
var Ho = /*@__PURE__*/ k("ZodCustom", (e, t) => {
	yr.init(e, t), H.init(e, t), e._zod.processJSONSchema = (t, n, r) => Bi(e, t, n, r);
});
function Uo(e, t = {}) {
	return /* @__PURE__ */ wi(Ho, e, t);
}
function Wo(e, t) {
	return /* @__PURE__ */ Ti(e, t);
}
function Go(e, t) {
	return new Lo({
		type: "pipe",
		in: bo(e),
		out: t
	});
}
//#endregion
//#region src/schema/effect.ts
var Ko = co("type", [
	K({
		type: q("shadow"),
		color: U(),
		blur: G(),
		offset: po([G(), G()]),
		alpha: G().min(0).max(1)
	}),
	K({
		type: q("text-shadow"),
		style: _o([
			"drop",
			"line",
			"block",
			"3d"
		]),
		color: U(),
		angle: G(),
		distance: G(),
		blur: G().optional(),
		thickness: G().optional()
	}),
	K({
		type: q("glow"),
		color: U(),
		strength: G(),
		outer: Za()
	}),
	K({
		type: q("outline"),
		color: U(),
		thickness: G()
	}),
	K({
		type: q("extrude3d"),
		depth: G(),
		angle: G(),
		color: U()
	}),
	K({
		type: q("blur"),
		amount: G()
	}),
	K({
		type: q("custom"),
		shaderId: U(),
		uniforms: ho(U(), oo([G(), ro(G())]))
	})
]), qo = _o([
	"normal",
	"multiply",
	"screen",
	"overlay",
	"darken",
	"lighten"
]), Jo = K({
	x: G(),
	y: G(),
	scaleX: G(),
	scaleY: G(),
	rotation: G(),
	skewX: G().optional(),
	skewY: G().optional(),
	originX: G().min(0).max(1).optional(),
	originY: G().min(0).max(1).optional()
}), Yo = K({
	width: G(),
	height: G()
}), Xo = {
	id: U(),
	name: U().optional(),
	transform: Jo,
	size: Yo,
	opacity: G().min(0).max(1),
	visible: Za(),
	locked: Za(),
	blendMode: qo.optional(),
	effects: ro(Ko).optional()
}, Zo = K(Xo), Qo = K({
	offset: G().min(0).max(1),
	color: U(),
	alpha: G().min(0).max(1).optional()
}), $o = co("type", [
	K({
		type: q("solid"),
		color: U(),
		alpha: G().min(0).max(1).optional()
	}),
	K({
		type: q("linear-gradient"),
		stops: ro(Qo),
		angle: G()
	}),
	K({
		type: q("radial-gradient"),
		stops: ro(Qo)
	}),
	K({
		type: q("texture"),
		assetId: U(),
		scale: G().optional(),
		offset: po([G(), G()]).optional()
	})
]), es = K({
	fill: $o,
	width: G(),
	align: _o([
		"inside",
		"center",
		"outside"
	]),
	layers: ro(K({
		width: G(),
		fill: $o,
		offset: po([G(), G()]).optional()
	})).optional()
}), ts = K({
	x: G(),
	y: G()
}), ns = K({
	x: G(),
	y: G(),
	in: ts.optional(),
	out: ts.optional()
}), rs = K({
	role: _o([
		"baseline",
		"top",
		"bottom"
	]),
	closed: Za(),
	anchors: ro(ns)
}), is = _o([
	"none",
	"wave",
	"arch",
	"rise",
	"flag",
	"circle",
	"angle",
	"distort",
	"custom"
]), as = K({
	centerX: G(),
	centerY: G(),
	radius: G()
}), os = Go((e) => {
	if (e && typeof e == "object" && !("curveHeight" in e) && "intensity" in e) {
		let { intensity: t, ...n } = e;
		return {
			...n,
			curveHeight: t
		};
	}
	return e;
}, K({
	type: is,
	curveHeight: G().min(-1).max(4),
	paths: ro(rs).optional(),
	circle: as.optional(),
	directionInverted: Za().default(!1)
})), ss = K({
	...Xo,
	type: q("shape"),
	shape: _o([
		"rect",
		"ellipse",
		"line",
		"polygon",
		"star",
		"path"
	]),
	cornerRadius: G().optional(),
	points: ro(G()).optional(),
	fill: $o,
	stroke: es.optional()
}), cs = K({
	...Xo,
	type: q("image"),
	assetId: U(),
	crop: K({
		x: G(),
		y: G(),
		width: G(),
		height: G()
	}).optional(),
	mask: K({
		type: q("shape"),
		ref: U()
	}).optional(),
	filters: K({
		brightness: G().optional(),
		contrast: G().optional(),
		blur: G().optional(),
		saturation: G().optional()
	}).optional()
}), ls = K({
	...Xo,
	type: q("svg"),
	assetId: U(),
	overrides: ho(U(), $o).optional()
}), us = K({
	...Xo,
	type: q("text"),
	text: U(),
	font: K({
		family: U(),
		weight: G(),
		style: _o(["normal", "italic"]),
		size: G().positive()
	}),
	align: _o([
		"left",
		"center",
		"right"
	]),
	letterSpacing: G(),
	lineHeight: G().positive(),
	fill: $o,
	warp: os.optional()
}), ds = K({
	...Xo,
	type: q("group"),
	children: Vo(() => ro(fs))
}), fs = co("type", [
	ss,
	cs,
	ls,
	us,
	ds
]), ps = co("type", [K({
	type: q("color"),
	value: U()
}), K({
	type: q("fill"),
	value: $o
})]), ms = K({
	id: U(),
	name: U(),
	size: K({
		width: G(),
		height: G()
	}),
	background: ps,
	children: ro(fs)
}), J = co("type", [
	K({
		type: q("image"),
		dataUri: U()
	}),
	K({
		type: q("svg"),
		dataUri: U()
	}),
	K({
		type: q("image-url"),
		src: U().url()
	})
]), hs = K({
	title: U(),
	createdAt: G(),
	updatedAt: G()
}), gs = K({
	version: q(1),
	id: U(),
	meta: hs,
	pages: ro(ms),
	assets: ho(U(), J)
}), _s = (e) => {
	let t, n = /* @__PURE__ */ new Set(), r = (e, r) => {
		let i = typeof e == "function" ? e(t) : e;
		if (!Object.is(i, t)) {
			let e = t;
			t = r ?? (typeof i != "object" || !i) ? i : Object.assign({}, t, i), n.forEach((n) => n(t, e));
		}
	}, i = () => t, a = {
		setState: r,
		getState: i,
		getInitialState: () => o,
		subscribe: (e) => (n.add(e), () => n.delete(e))
	}, o = t = e(r, i, a);
	return a;
}, vs = ((e) => e ? _s(e) : _s), ys = (e) => e;
function bs(t, n = ys) {
	let r = e.useSyncExternalStore(t.subscribe, e.useCallback(() => n(t.getState()), [t, n]), e.useCallback(() => n(t.getInitialState()), [t, n]));
	return e.useDebugValue(r), r;
}
var xs = (e) => {
	let t = vs(e), n = (e) => bs(t, e);
	return Object.assign(n, t), n;
}, Y = ((e) => e ? xs(e) : xs), Ss = Symbol.for("immer-nothing"), Cs = Symbol.for("immer-draftable"), ws = Symbol.for("immer-state"), Ts = process.env.NODE_ENV === "production" ? [] : [
	function(e) {
		return `The plugin for '${e}' has not been loaded into Immer. To enable the plugin, import and call \`enable${e}()\` when initializing your application.`;
	},
	function(e) {
		return `produce can only be called on things that are draftable: plain objects, arrays, Map, Set or classes that are marked with '[immerable]: true'. Got '${e}'`;
	},
	"This object has been frozen and should not be mutated",
	function(e) {
		return "Cannot use a proxy that has been revoked. Did you pass an object from inside an immer function to an async process? " + e;
	},
	"An immer producer returned a new value *and* modified its draft. Either return a new value *or* modify the draft.",
	"Immer forbids circular references",
	"The first or second argument to `produce` must be a function",
	"The third argument to `produce` must be a function or undefined",
	"First argument to `createDraft` must be a plain object, an array, or an immerable object",
	"First argument to `finishDraft` must be a draft returned by `createDraft`",
	function(e) {
		return `'current' expects a draft, got: ${e}`;
	},
	"Object.defineProperty() cannot be used on an Immer draft",
	"Object.setPrototypeOf() cannot be used on an Immer draft",
	"Immer only supports deleting array indices",
	"Immer only supports setting array indices and the 'length' property",
	function(e) {
		return `'original' expects a draft, got: ${e}`;
	}
];
function X(e, ...t) {
	if (process.env.NODE_ENV !== "production") {
		let n = Ts[e], r = Ys(n) ? n.apply(null, t) : n;
		throw Error(`[Immer] ${r}`);
	}
	throw Error(`[Immer] minified error nr: ${e}. Full error at: https://bit.ly/3cXEKWf`);
}
var Es = Object, Ds = Es.getPrototypeOf, Os = "constructor", ks = "prototype", As = "configurable", js = "enumerable", Ms = "writable", Ns = "value", Ps = (e) => !!e && !!e[ws];
function Fs(e) {
	return e ? Rs(e) || Gs(e) || !!e[Cs] || !!e[Os]?.[Cs] || Ks(e) || qs(e) : !1;
}
var Is = Es[ks][Os].toString(), Ls = /* @__PURE__ */ new WeakMap();
function Rs(e) {
	if (!e || !Js(e)) return !1;
	let t = Ds(e);
	if (t === null || t === Es[ks]) return !0;
	let n = Es.hasOwnProperty.call(t, Os) && t[Os];
	if (n === Object) return !0;
	if (!Ys(n)) return !1;
	let r = Ls.get(n);
	return r === void 0 && (r = Function.toString.call(n), Ls.set(n, r)), r === Is;
}
function zs(e, t, n = !0) {
	Bs(e) === 0 ? (n ? Reflect.ownKeys(e) : Es.keys(e)).forEach((n) => {
		t(n, e[n], e);
	}) : e.forEach((n, r) => t(r, n, e));
}
function Bs(e) {
	let t = e[ws];
	return t ? t.type_ : Gs(e) ? 1 : Ks(e) ? 2 : qs(e) ? 3 : 0;
}
var Vs = (e, t, n = Bs(e)) => n === 2 ? e.has(t) : Es[ks].hasOwnProperty.call(e, t), Hs = (e, t, n = Bs(e)) => n === 2 ? e.get(t) : e[t], Us = (e, t, n, r = Bs(e)) => {
	r === 2 ? e.set(t, n) : r === 3 ? e.add(n) : e[t] = n;
};
function Ws(e, t) {
	return e === t ? e !== 0 || 1 / e == 1 / t : e !== e && t !== t;
}
var Gs = Array.isArray, Ks = (e) => e instanceof Map, qs = (e) => e instanceof Set, Js = (e) => typeof e == "object", Ys = (e) => typeof e == "function", Xs = (e) => typeof e == "boolean";
function Zs(e) {
	let t = +e;
	return Number.isInteger(t) && String(t) === e;
}
var Qs = (e) => Js(e) ? e?.[ws] : null, $s = (e) => e.copy_ || e.base_, ec = (e) => e.modified_ ? e.copy_ : e.base_;
function tc(e, t) {
	if (Ks(e)) return new Map(e);
	if (qs(e)) return new Set(e);
	if (Gs(e)) return Array[ks].slice.call(e);
	let n = Rs(e);
	if (t === !0 || t === "class_only" && !n) {
		let t = Es.getOwnPropertyDescriptors(e);
		delete t[ws];
		let n = Reflect.ownKeys(t);
		for (let r = 0; r < n.length; r++) {
			let i = n[r], a = t[i];
			a[Ms] === !1 && (a[Ms] = !0, a[As] = !0), (a.get || a.set) && (t[i] = {
				[As]: !0,
				[Ms]: !0,
				[js]: a[js],
				[Ns]: e[i]
			});
		}
		return Es.create(Ds(e), t);
	} else {
		let t = Ds(e);
		if (t !== null && n) return { ...e };
		let r = Es.create(t);
		return Es.assign(r, e);
	}
}
function nc(e, t = !1) {
	return ac(e) || Ps(e) || !Fs(e) ? e : (Bs(e) > 1 && Es.defineProperties(e, {
		set: ic,
		add: ic,
		clear: ic,
		delete: ic
	}), Es.freeze(e), t && zs(e, (e, t) => {
		nc(t, !0);
	}, !1), e);
}
function rc() {
	X(2);
}
var ic = { [Ns]: rc };
function ac(e) {
	return e === null || !Js(e) || Es.isFrozen(e);
}
var oc = "MapSet", sc = "Patches", cc = "ArrayMethods", lc = {};
function uc(e) {
	let t = lc[e];
	return t || X(0, e), t;
}
var dc = (e) => !!lc[e];
function fc(e, t) {
	lc[e] || (lc[e] = t);
}
var pc, mc = () => pc, hc = (e, t) => ({
	drafts_: [],
	parent_: e,
	immer_: t,
	canAutoFreeze_: !0,
	unfinalizedDrafts_: 0,
	handledSet_: /* @__PURE__ */ new Set(),
	processedForPatches_: /* @__PURE__ */ new Set(),
	mapSetPlugin_: dc(oc) ? uc(oc) : void 0,
	arrayMethodsPlugin_: dc(cc) ? uc(cc) : void 0
});
function gc(e, t) {
	t && (e.patchPlugin_ = uc(sc), e.patches_ = [], e.inversePatches_ = [], e.patchListener_ = t);
}
function _c(e) {
	vc(e), e.drafts_.forEach(bc), e.drafts_ = null;
}
function vc(e) {
	e === pc && (pc = e.parent_);
}
var yc = (e) => pc = hc(pc, e);
function bc(e) {
	let t = e[ws];
	t.type_ === 0 || t.type_ === 1 ? t.revoke_() : t.revoked_ = !0;
}
function xc(e, t) {
	t.unfinalizedDrafts_ = t.drafts_.length;
	let n = t.drafts_[0];
	if (e !== void 0 && e !== n) {
		n[ws].modified_ && (_c(t), X(4)), Fs(e) && (e = Sc(t, e));
		let { patchPlugin_: r } = t;
		r && r.generateReplacementPatches_(n[ws].base_, e, t);
	} else e = Sc(t, n);
	return Cc(t, e, !0), _c(t), t.patches_ && t.patchListener_(t.patches_, t.inversePatches_), e === Ss ? void 0 : e;
}
function Sc(e, t) {
	if (ac(t)) return t;
	let n = t[ws];
	if (!n) return jc(t, e.handledSet_, e);
	if (!Tc(n, e)) return t;
	if (!n.modified_) return n.base_;
	if (!n.finalized_) {
		let { callbacks_: t } = n;
		if (t) for (; t.length > 0;) t.pop()(e);
		kc(n, e);
	}
	return n.copy_;
}
function Cc(e, t, n = !1) {
	!e.parent_ && e.immer_.autoFreeze_ && e.canAutoFreeze_ && nc(t, n);
}
function wc(e) {
	e.finalized_ = !0, e.scope_.unfinalizedDrafts_--;
}
var Tc = (e, t) => e.scope_ === t, Ec = [];
function Dc(e, t, n, r) {
	let i = $s(e), a = e.type_;
	if (r !== void 0 && Hs(i, r, a) === t) {
		Us(i, r, n, a);
		return;
	}
	if (!e.draftLocations_) {
		let t = e.draftLocations_ = /* @__PURE__ */ new Map();
		zs(i, (e, n) => {
			if (Ps(n)) {
				let r = t.get(n) || [];
				r.push(e), t.set(n, r);
			}
		});
	}
	let o = e.draftLocations_.get(t) ?? Ec;
	for (let e of o) Us(i, e, n, a);
}
function Oc(e, t, n) {
	e.callbacks_.push(function(r) {
		let i = t;
		if (!i || !Tc(i, r)) return;
		r.mapSetPlugin_?.fixSetContents(i);
		let a = ec(i);
		Dc(e, i.draft_ ?? i, a, n), kc(i, r);
	});
}
function kc(e, t) {
	if (e.modified_ && !e.finalized_ && (e.type_ === 3 || e.type_ === 1 && e.allIndicesReassigned_ || (e.assigned_?.size ?? 0) > 0)) {
		let { patchPlugin_: n } = t;
		if (n) {
			let r = n.getPath(e);
			r && n.generatePatches_(e, r, t);
		}
		wc(e);
	}
}
function Ac(e, t, n) {
	let { scope_: r } = e;
	if (Ps(n)) {
		let i = n[ws];
		Tc(i, r) && i.callbacks_.push(function() {
			zc(e), Dc(e, n, ec(i), t);
		});
	} else Fs(n) && e.callbacks_.push(function() {
		let i = $s(e);
		e.type_ === 3 ? i.has(n) && jc(n, r.handledSet_, r) : Hs(i, t, e.type_) === n && r.drafts_.length > 1 && (e.assigned_.get(t) ?? !1) === !0 && e.copy_ && jc(Hs(e.copy_, t, e.type_), r.handledSet_, r);
	});
}
function jc(e, t, n) {
	return !n.immer_.autoFreeze_ && n.unfinalizedDrafts_ < 1 || Ps(e) || t.has(e) || !Fs(e) || ac(e) ? e : (t.add(e), zs(e, (r, i) => {
		if (Ps(i)) {
			let t = i[ws];
			Tc(t, n) && (Us(e, r, ec(t), e.type_), wc(t));
		} else Fs(i) && jc(i, t, n);
	}), e);
}
function Mc(e, t) {
	let n = Gs(e), r = {
		type_: +!!n,
		scope_: t ? t.scope_ : mc(),
		modified_: !1,
		finalized_: !1,
		assigned_: void 0,
		parent_: t,
		base_: e,
		draft_: null,
		copy_: null,
		revoke_: null,
		isManual_: !1,
		callbacks_: void 0
	}, i = r, a = Nc;
	n && (i = [r], a = Pc);
	let { revoke: o, proxy: s } = Proxy.revocable(i, a);
	return r.draft_ = s, r.revoke_ = o, [s, r];
}
var Nc = {
	get(e, t) {
		if (t === ws) return e;
		if (t === "constructor" || t === "__proto__") {
			let n = $s(e)[t];
			return new Proxy(n || {}, {
				get: (e, t) => t === "__proto__" || t === "prototype" ? Object.freeze(/* @__PURE__ */ Object.create(null)) : Reflect.get(e, t),
				set: () => !0,
				apply: (e, t, n) => Reflect.apply(e, t, n)
			});
		}
		let n = e.scope_.arrayMethodsPlugin_, r = e.type_ === 1 && typeof t == "string";
		if (r && n?.isArrayOperationMethod(t)) return n.createMethodInterceptor(e, t);
		let i = $s(e);
		if (!Vs(i, t, e.type_)) return Ic(e, i, t);
		let a = i[t];
		if (e.finalized_ || !Fs(a) || r && e.operationMethod && n?.isMutatingArrayMethod(e.operationMethod) && Zs(t)) return a;
		if (a === Fc(e.base_, t)) {
			zc(e);
			let n = e.type_ === 1 ? +t : t, r = Vc(e.scope_, a, e, n);
			return e.copy_[n] = r;
		}
		return a;
	},
	has(e, t) {
		return t === "constructor" || t === "__proto__" || t === "prototype" ? !1 : t in $s(e);
	},
	ownKeys(e) {
		return Reflect.ownKeys($s(e));
	},
	set(e, t, n) {
		if (t === "constructor" || t === "__proto__" || t === "prototype") return !0;
		let r = Lc($s(e), t);
		if (r?.set) return r.set.call(e.draft_, n), !0;
		if (!e.modified_) {
			let r = Fc($s(e), t), i = r?.[ws];
			if (i && i.base_ === n) return e.copy_[t] = n, e.assigned_.set(t, !1), !0;
			if (Ws(n, r) && (n !== void 0 || Vs(e.base_, t, e.type_))) return !0;
			zc(e), Rc(e);
		}
		return e.copy_[t] === n && (n !== void 0 || Vs(e.copy_, t, e.type_)) || Number.isNaN(n) && Number.isNaN(e.copy_[t]) ? !0 : (e.copy_[t] = n, e.assigned_.set(t, !0), Ac(e, t, n), !0);
	},
	deleteProperty(e, t) {
		return zc(e), Fc(e.base_, t) !== void 0 || t in e.base_ ? (e.assigned_.set(t, !1), Rc(e)) : e.assigned_.delete(t), e.copy_ && delete e.copy_[t], !0;
	},
	getOwnPropertyDescriptor(e, t) {
		let n = $s(e), r = Reflect.getOwnPropertyDescriptor(n, t);
		return r && {
			[Ms]: !0,
			[As]: e.type_ !== 1 || t !== "length",
			[js]: r[js],
			[Ns]: n[t]
		};
	},
	defineProperty() {
		X(11);
	},
	getPrototypeOf(e) {
		return Ds(e.base_);
	},
	setPrototypeOf() {
		X(12);
	}
}, Pc = {};
for (let e in Nc) {
	let t = Nc[e];
	Pc[e] = function() {
		let e = arguments;
		return e[0] = e[0][0], t.apply(this, e);
	};
}
Pc.deleteProperty = function(e, t) {
	return process.env.NODE_ENV !== "production" && isNaN(parseInt(t)) && X(13), Pc.set.call(this, e, t, void 0);
}, Pc.set = function(e, t, n) {
	return process.env.NODE_ENV !== "production" && t !== "length" && isNaN(parseInt(t)) && X(14), Nc.set.call(this, e[0], t, n, e[0]);
};
function Fc(e, t) {
	let n = e[ws];
	return (n ? $s(n) : e)[t];
}
function Ic(e, t, n) {
	let r = Lc(t, n);
	return r ? Ns in r ? r[Ns] : r.get?.call(e.draft_) : void 0;
}
function Lc(e, t) {
	if (!(t in e)) return;
	let n = Ds(e);
	for (; n;) {
		let e = Object.getOwnPropertyDescriptor(n, t);
		if (e) return e;
		n = Ds(n);
	}
}
function Rc(e) {
	e.modified_ || (e.modified_ = !0, e.parent_ && Rc(e.parent_));
}
function zc(e) {
	e.copy_ ||= (e.assigned_ = /* @__PURE__ */ new Map(), tc(e.base_, e.scope_.immer_.useStrictShallowCopy_));
}
var Bc = class {
	constructor(e) {
		this.autoFreeze_ = !0, this.useStrictShallowCopy_ = !1, this.useStrictIteration_ = !1, this.produce = (e, t, n) => {
			if (Ys(e) && !Ys(t)) {
				let n = t;
				t = e;
				let r = this;
				return function(e = n, ...i) {
					return r.produce(e, (e) => t.call(this, e, ...i));
				};
			}
			Ys(t) || X(6), n !== void 0 && !Ys(n) && X(7);
			let r;
			if (Fs(e)) {
				let i = yc(this), a = Vc(i, e, void 0), o = !0;
				try {
					r = t(a), o = !1;
				} finally {
					o ? _c(i) : vc(i);
				}
				return gc(i, n), xc(r, i);
			} else if (!e || !Js(e)) {
				if (r = t(e), r === void 0 && (r = e), r === Ss && (r = void 0), this.autoFreeze_ && nc(r, !0), n) {
					let t = [], i = [];
					uc(sc).generateReplacementPatches_(e, r, {
						patches_: t,
						inversePatches_: i
					}), n(t, i);
				}
				return r;
			} else X(1, e);
		}, this.produceWithPatches = (e, t) => {
			if (Ys(e)) return (t, ...n) => this.produceWithPatches(t, (t) => e(t, ...n));
			let n, r;
			return [
				this.produce(e, t, (e, t) => {
					n = e, r = t;
				}),
				n,
				r
			];
		}, Xs(e?.autoFreeze) && this.setAutoFreeze(e.autoFreeze), Xs(e?.useStrictShallowCopy) && this.setUseStrictShallowCopy(e.useStrictShallowCopy), Xs(e?.useStrictIteration) && this.setUseStrictIteration(e.useStrictIteration);
	}
	createDraft(e) {
		Fs(e) || X(8), Ps(e) && (e = Hc(e));
		let t = yc(this), n = Vc(t, e, void 0);
		return n[ws].isManual_ = !0, vc(t), n;
	}
	finishDraft(e, t) {
		let n = e && e[ws];
		(!n || !n.isManual_) && X(9);
		let { scope_: r } = n;
		return gc(r, t), xc(void 0, r);
	}
	setAutoFreeze(e) {
		this.autoFreeze_ = e;
	}
	setUseStrictShallowCopy(e) {
		this.useStrictShallowCopy_ = e;
	}
	setUseStrictIteration(e) {
		this.useStrictIteration_ = e;
	}
	shouldUseStrictIteration() {
		return this.useStrictIteration_;
	}
	applyPatches(e, t) {
		let n;
		for (n = t.length - 1; n >= 0; n--) {
			let r = t[n];
			if (r.path.length === 0 && r.op === "replace") {
				e = r.value;
				break;
			}
		}
		n > -1 && (t = t.slice(n + 1));
		let r = uc(sc).applyPatches_;
		return Ps(e) ? r(e, t) : this.produce(e, (e) => r(e, t));
	}
};
function Vc(e, t, n, r) {
	let [i, a] = Ks(t) ? uc(oc).proxyMap_(t, n) : qs(t) ? uc(oc).proxySet_(t, n) : Mc(t, n);
	return (n?.scope_ ?? mc()).drafts_.push(i), a.callbacks_ = n?.callbacks_ ?? [], a.key_ = r, n && r !== void 0 ? Oc(n, a, r) : a.callbacks_.push(function(e) {
		e.mapSetPlugin_?.fixSetContents(a);
		let { patchPlugin_: t } = e;
		a.modified_ && t && t.generatePatches_(a, [], e);
	}), i;
}
function Hc(e) {
	return Ps(e) || X(10, e), Uc(e);
}
function Uc(e) {
	if (!Fs(e) || ac(e)) return e;
	let t = e[ws], n, r = !0;
	if (t) {
		if (!t.modified_) return t.base_;
		t.finalized_ = !0, n = tc(e, t.scope_.immer_.useStrictShallowCopy_), r = t.scope_.immer_.shouldUseStrictIteration();
	} else n = tc(e, !0);
	return zs(n, (e, t) => {
		Us(n, e, Uc(t));
	}, r), t && (t.finalized_ = !1), n;
}
function Wc() {
	process.env.NODE_ENV !== "production" && Ts.push("Sets cannot have \"replace\" patches.", function(e) {
		return "Unsupported patch operation: " + e;
	}, function(e) {
		return "Cannot apply patch, path doesn't resolve: " + e;
	}, "Patching reserved attributes like __proto__, prototype and constructor is not allowed");
	function e(n, r = []) {
		if (n.key_ !== void 0) {
			let e = n.parent_.copy_ ?? n.parent_.base_, t = Qs(Hs(e, n.key_)), i = Hs(e, n.key_);
			if (i === void 0 || i !== n.draft_ && i !== n.base_ && i !== n.copy_ || t != null && t.base_ !== n.base_) return null;
			let a = n.parent_.type_ === 3, o;
			if (a) {
				let e = n.parent_;
				o = Array.from(e.drafts_.keys()).indexOf(n.key_);
			} else o = n.key_;
			if (!(a && e.size > o || Vs(e, o))) return null;
			r.push(o);
		}
		if (n.parent_) return e(n.parent_, r);
		r.reverse();
		try {
			t(n.copy_, r);
		} catch {
			return null;
		}
		return r;
	}
	function t(e, t) {
		let n = e;
		for (let e = 0; e < t.length - 1; e++) {
			let r = t[e];
			if (n = Hs(n, r), !Js(n) || n === null) throw Error(`Cannot resolve path at '${t.join("/")}'`);
		}
		return n;
	}
	let n = "replace", r = "remove";
	function i(e, t, n) {
		if (e.scope_.processedForPatches_.has(e)) return;
		e.scope_.processedForPatches_.add(e);
		let { patches_: r, inversePatches_: i } = n;
		switch (e.type_) {
			case 0:
			case 2: return o(e, t, r, i);
			case 1: return a(e, t, r, i);
			case 3: return s(e, t, r, i);
		}
	}
	function a(e, t, i, a) {
		let { base_: o, assigned_: s } = e, c = e.copy_;
		c.length < o.length && ([o, c] = [c, o], [i, a] = [a, i]);
		let l = e.allIndicesReassigned_ === !0;
		for (let e = 0; e < o.length; e++) {
			let r = c[e], u = o[e];
			if ((l || s?.get(e.toString())) && r !== u) {
				let o = r?.[ws];
				if (o && o.modified_) continue;
				let s = t.concat([e]);
				i.push({
					op: n,
					path: s,
					value: d(r)
				}), a.push({
					op: n,
					path: s,
					value: d(u)
				});
			}
		}
		for (let e = o.length; e < c.length; e++) {
			let n = t.concat([e]);
			i.push({
				op: "add",
				path: n,
				value: d(c[e])
			});
		}
		for (let e = c.length - 1; o.length <= e; --e) {
			let n = t.concat([e]);
			a.push({
				op: r,
				path: n
			});
		}
	}
	function o(e, t, i, a) {
		let { base_: o, copy_: s, type_: c } = e;
		zs(e.assigned_, (e, l) => {
			let u = Hs(o, e, c), f = Hs(s, e, c), p = l ? Vs(o, e) ? n : "add" : r;
			if (u === f && p === n) return;
			let m = t.concat(e);
			i.push(p === r ? {
				op: p,
				path: m
			} : {
				op: p,
				path: m,
				value: d(f)
			}), a.push(p === "add" ? {
				op: r,
				path: m
			} : p === r ? {
				op: "add",
				path: m,
				value: d(u)
			} : {
				op: n,
				path: m,
				value: d(u)
			});
		});
	}
	function s(e, t, n, i) {
		let { base_: a, copy_: o } = e, s = 0;
		a.forEach((e) => {
			if (!o.has(e)) {
				let a = t.concat([s]);
				n.push({
					op: r,
					path: a,
					value: e
				}), i.unshift({
					op: "add",
					path: a,
					value: e
				});
			}
			s++;
		}), s = 0, o.forEach((e) => {
			if (!a.has(e)) {
				let a = t.concat([s]);
				n.push({
					op: "add",
					path: a,
					value: e
				}), i.unshift({
					op: r,
					path: a,
					value: e
				});
			}
			s++;
		});
	}
	function c(e, t, r) {
		let { patches_: i, inversePatches_: a } = r;
		i.push({
			op: n,
			path: [],
			value: t === Ss ? void 0 : t
		}), a.push({
			op: n,
			path: [],
			value: e
		});
	}
	function l(e, t) {
		return t.forEach((t) => {
			let { path: i, op: a } = t, o = e;
			for (let e = 0; e < i.length - 1; e++) {
				let t = Bs(o), n = i[e];
				typeof n != "string" && typeof n != "number" && (n = "" + n), (t === 0 || t === 1) && (n === "__proto__" || n === Os) && X(19), Ys(o) && n === ks && X(19), o = Hs(o, n), Js(o) || X(18, i.join("/"));
			}
			let s = Bs(o), c = u(t.value), l = i[i.length - 1];
			switch (a) {
				case n: switch (s) {
					case 2: return o.set(l, c);
					case 3: X(16);
					default: return o[l] = c;
				}
				case "add": switch (s) {
					case 1: return l === "-" ? o.push(c) : o.splice(l, 0, c);
					case 2: return o.set(l, c);
					case 3: return o.add(c);
					default: return o[l] = c;
				}
				case r: switch (s) {
					case 1: return o.splice(l, 1);
					case 2: return o.delete(l);
					case 3: return o.delete(t.value);
					default: return delete o[l];
				}
				default: X(17, a);
			}
		}), e;
	}
	function u(e) {
		if (!Fs(e)) return e;
		if (Gs(e)) return e.map(u);
		if (Ks(e)) return new Map(Array.from(e.entries()).map(([e, t]) => [e, u(t)]));
		if (qs(e)) return new Set(Array.from(e).map(u));
		let t = Object.create(Ds(e));
		for (let n in e) t[n] = u(e[n]);
		return Vs(e, Cs) && (t[Cs] = e[Cs]), t;
	}
	function d(e) {
		return Ps(e) ? u(e) : e;
	}
	fc(sc, {
		applyPatches_: l,
		generatePatches_: i,
		generateReplacementPatches_: c,
		getPath: e
	});
}
var Gc = new Bc();
Gc.produce;
var Kc = /* @__PURE__ */ Gc.produceWithPatches.bind(Gc), qc = /* @__PURE__ */ Gc.applyPatches.bind(Gc);
//#endregion
//#region src/core/commands.ts
function Jc(e) {
	return e.type === "AddPage" || e.type === "RemovePage" || e.type === "ReorderPage" || e.type === "DuplicatePage";
}
//#endregion
//#region node_modules/.pnpm/nanoid@6.0.0/node_modules/nanoid/url-alphabet/index.js
var Z = "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict", Yc = (e = 21) => {
	let t = "", n = crypto.getRandomValues(new Uint8Array(e |= 0));
	for (; e--;) t += Z[n[e] & 63];
	return t;
};
//#endregion
//#region src/core/tree.ts
function Xc(e, t, n = null) {
	let r = e.findIndex((e) => e.id === t);
	if (r !== -1) return {
		node: e[r],
		parent: e,
		index: r,
		ownerGroupId: n
	};
	for (let n of e) if (n.type === "group") {
		let e = Xc(n.children, t, n.id);
		if (e) return e;
	}
}
function Zc(e, t) {
	return Xc(e.children, t);
}
function Qc(e, t) {
	let n = Zc(e, t);
	if (!n) throw Error(`Unknown nodeId: ${t}`);
	return n;
}
function $c(e, t) {
	e.forEach((n, r) => {
		t(n, e, r), n.type === "group" && $c(n.children, t);
	});
}
function el(e) {
	return e.type === "group" ? {
		...e,
		id: Yc(),
		children: e.children.map(el)
	} : {
		...e,
		id: Yc()
	};
}
//#endregion
//#region node_modules/.pnpm/pixi-filters@6.1.5_pixi.js@8.19.0/node_modules/pixi-filters/lib/defaults/default2.mjs
var tl = "in vec2 aPosition;\nout vec2 vTextureCoord;\n\nuniform vec4 uInputSize;\nuniform vec4 uOutputFrame;\nuniform vec4 uOutputTexture;\n\nvec4 filterVertexPosition( void )\n{\n    vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;\n    \n    position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;\n    position.y = position.y * (2.0*uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;\n\n    return vec4(position, 0.0, 1.0);\n}\n\nvec2 filterTextureCoord( void )\n{\n    return aPosition * (uOutputFrame.zw * uInputSize.zw);\n}\n\nvoid main(void)\n{\n    gl_Position = filterVertexPosition();\n    vTextureCoord = filterTextureCoord();\n}\n", nl = "struct GlobalFilterUniforms {\n  uInputSize:vec4<f32>,\n  uInputPixel:vec4<f32>,\n  uInputClamp:vec4<f32>,\n  uOutputFrame:vec4<f32>,\n  uGlobalFrame:vec4<f32>,\n  uOutputTexture:vec4<f32>,\n};\n\n@group(0) @binding(0) var<uniform> gfu: GlobalFilterUniforms;\n\nstruct VSOutput {\n    @builtin(position) position: vec4<f32>,\n    @location(0) uv : vec2<f32>\n  };\n\nfn filterVertexPosition(aPosition:vec2<f32>) -> vec4<f32>\n{\n    var position = aPosition * gfu.uOutputFrame.zw + gfu.uOutputFrame.xy;\n\n    position.x = position.x * (2.0 / gfu.uOutputTexture.x) - 1.0;\n    position.y = position.y * (2.0*gfu.uOutputTexture.z / gfu.uOutputTexture.y) - gfu.uOutputTexture.z;\n\n    return vec4(position, 0.0, 1.0);\n}\n\nfn filterTextureCoord( aPosition:vec2<f32> ) -> vec2<f32>\n{\n    return aPosition * (gfu.uOutputFrame.zw * gfu.uInputSize.zw);\n}\n\nfn globalTextureCoord( aPosition:vec2<f32> ) -> vec2<f32>\n{\n  return  (aPosition.xy / gfu.uGlobalFrame.zw) + (gfu.uGlobalFrame.xy / gfu.uGlobalFrame.zw);  \n}\n\nfn getSize() -> vec2<f32>\n{\n  return gfu.uGlobalFrame.zw;\n}\n  \n@vertex\nfn mainVertex(\n  @location(0) aPosition : vec2<f32>, \n) -> VSOutput {\n  return VSOutput(\n   filterVertexPosition(aPosition),\n   filterTextureCoord(aPosition)\n  );\n}", rl = "in vec2 vTextureCoord;\nout vec4 finalColor;\n\nuniform sampler2D uTexture;\nuniform float uGamma;\nuniform float uContrast;\nuniform float uSaturation;\nuniform float uBrightness;\nuniform vec4 uColor;\n\nvoid main()\n{\n    vec4 c = texture(uTexture, vTextureCoord);\n\n    if (c.a > 0.0) {\n        c.rgb /= c.a;\n\n        vec3 rgb = pow(c.rgb, vec3(1. / uGamma));\n        rgb = mix(vec3(.5), mix(vec3(dot(vec3(.2125, .7154, .0721), rgb)), rgb, uSaturation), uContrast);\n        rgb.r *= uColor.r;\n        rgb.g *= uColor.g;\n        rgb.b *= uColor.b;\n        c.rgb = rgb * uBrightness;\n\n        c.rgb *= c.a;\n    }\n\n    finalColor = c * uColor.a;\n}\n", il = "struct AdjustmentUniforms {\n  uGamma: f32,\n  uContrast: f32,\n  uSaturation: f32,\n  uBrightness: f32,\n  uColor: vec4<f32>,\n};\n\n@group(0) @binding(1) var uTexture: texture_2d<f32>; \n@group(0) @binding(2) var uSampler: sampler;\n@group(1) @binding(0) var<uniform> adjustmentUniforms : AdjustmentUniforms;\n\n@fragment\nfn mainFragment(\n  @location(0) uv: vec2<f32>,\n  @builtin(position) position: vec4<f32>\n) -> @location(0) vec4<f32> {\n  var sample = textureSample(uTexture, uSampler, uv);\n  let color = adjustmentUniforms.uColor;\n\n  if (sample.a > 0.0) \n  {\n    sample = vec4<f32>(sample.rgb / sample.a, sample.a);\n    var rgb: vec3<f32> = pow(sample.rgb, vec3<f32>(1. / adjustmentUniforms.uGamma));\n    rgb = mix(vec3<f32>(.5), mix(vec3<f32>(dot(vec3<f32>(.2125, .7154, .0721), rgb)), rgb, adjustmentUniforms.uSaturation), adjustmentUniforms.uContrast);\n    rgb.r *= color.r;\n    rgb.g *= color.g;\n    rgb.b *= color.b;\n    sample = vec4<f32>(rgb.rgb * adjustmentUniforms.uBrightness, sample.a);\n    sample = vec4<f32>(sample.rgb * sample.a, sample.a);\n  }\n\n  return sample * color.a;\n}", al = Object.defineProperty, ol = (e, t, n) => t in e ? al(e, t, {
	enumerable: !0,
	configurable: !0,
	writable: !0,
	value: n
}) : e[t] = n, sl = (e, t, n) => (ol(e, typeof t == "symbol" ? t : t + "", n), n), cl = class e extends h {
	constructor(t) {
		t = {
			...e.DEFAULT_OPTIONS,
			...t
		};
		let n = _.from({
			vertex: {
				source: nl,
				entryPoint: "mainVertex"
			},
			fragment: {
				source: il,
				entryPoint: "mainFragment"
			}
		}), r = g.from({
			vertex: tl,
			fragment: rl,
			name: "adjustment-filter"
		});
		super({
			gpuProgram: n,
			glProgram: r,
			resources: { adjustmentUniforms: {
				uGamma: {
					value: t.gamma,
					type: "f32"
				},
				uContrast: {
					value: t.contrast,
					type: "f32"
				},
				uSaturation: {
					value: t.saturation,
					type: "f32"
				},
				uBrightness: {
					value: t.brightness,
					type: "f32"
				},
				uColor: {
					value: [
						t.red,
						t.green,
						t.blue,
						t.alpha
					],
					type: "vec4<f32>"
				}
			} }
		}), sl(this, "uniforms"), this.uniforms = this.resources.adjustmentUniforms.uniforms;
	}
	get gamma() {
		return this.uniforms.uGamma;
	}
	set gamma(e) {
		this.uniforms.uGamma = e;
	}
	get contrast() {
		return this.uniforms.uContrast;
	}
	set contrast(e) {
		this.uniforms.uContrast = e;
	}
	get saturation() {
		return this.uniforms.uSaturation;
	}
	set saturation(e) {
		this.uniforms.uSaturation = e;
	}
	get brightness() {
		return this.uniforms.uBrightness;
	}
	set brightness(e) {
		this.uniforms.uBrightness = e;
	}
	get red() {
		return this.uniforms.uColor[0];
	}
	set red(e) {
		this.uniforms.uColor[0] = e;
	}
	get green() {
		return this.uniforms.uColor[1];
	}
	set green(e) {
		this.uniforms.uColor[1] = e;
	}
	get blue() {
		return this.uniforms.uColor[2];
	}
	set blue(e) {
		this.uniforms.uColor[2] = e;
	}
	get alpha() {
		return this.uniforms.uColor[3];
	}
	set alpha(e) {
		this.uniforms.uColor[3] = e;
	}
};
sl(cl, "DEFAULT_OPTIONS", {
	gamma: 1,
	contrast: 1,
	saturation: 1,
	brightness: 1,
	red: 1,
	green: 1,
	blue: 1,
	alpha: 1
});
var ll = cl, ul = "\nin vec2 vTextureCoord;\nout vec4 finalColor;\n\nuniform sampler2D uTexture;\nuniform vec2 uOffset;\n\nvoid main(void)\n{\n    vec4 color = vec4(0.0);\n\n    // Sample top left pixel\n    color += texture(uTexture, vec2(vTextureCoord.x - uOffset.x, vTextureCoord.y + uOffset.y));\n\n    // Sample top right pixel\n    color += texture(uTexture, vec2(vTextureCoord.x + uOffset.x, vTextureCoord.y + uOffset.y));\n\n    // Sample bottom right pixel\n    color += texture(uTexture, vec2(vTextureCoord.x + uOffset.x, vTextureCoord.y - uOffset.y));\n\n    // Sample bottom left pixel\n    color += texture(uTexture, vec2(vTextureCoord.x - uOffset.x, vTextureCoord.y - uOffset.y));\n\n    // Average\n    color *= 0.25;\n\n    finalColor = color;\n}", dl = "struct KawaseBlurUniforms {\n  uOffset:vec2<f32>,\n};\n\n@group(0) @binding(1) var uTexture: texture_2d<f32>; \n@group(0) @binding(2) var uSampler: sampler;\n@group(1) @binding(0) var<uniform> kawaseBlurUniforms : KawaseBlurUniforms;\n\n@fragment\nfn mainFragment(\n  @builtin(position) position: vec4<f32>,\n  @location(0) uv : vec2<f32>\n) -> @location(0) vec4<f32> {\n  let uOffset = kawaseBlurUniforms.uOffset;\n  var color: vec4<f32> = vec4<f32>(0.0);\n\n  // Sample top left pixel\n  color += textureSample(uTexture, uSampler, vec2<f32>(uv.x - uOffset.x, uv.y + uOffset.y));\n  // Sample top right pixel\n  color += textureSample(uTexture, uSampler, vec2<f32>(uv.x + uOffset.x, uv.y + uOffset.y));\n  // Sample bottom right pixel\n  color += textureSample(uTexture, uSampler, vec2<f32>(uv.x + uOffset.x, uv.y - uOffset.y));\n  // Sample bottom left pixel\n  color += textureSample(uTexture, uSampler, vec2<f32>(uv.x - uOffset.x, uv.y - uOffset.y));\n  // Average\n  color *= 0.25;\n\n  return color;\n}", fl = "\nprecision highp float;\nin vec2 vTextureCoord;\nout vec4 finalColor;\n\nuniform sampler2D uTexture;\nuniform vec2 uOffset;\n\nuniform vec4 uInputClamp;\n\nvoid main(void)\n{\n    vec4 color = vec4(0.0);\n\n    // Sample top left pixel\n    color += texture(uTexture, clamp(vec2(vTextureCoord.x - uOffset.x, vTextureCoord.y + uOffset.y), uInputClamp.xy, uInputClamp.zw));\n\n    // Sample top right pixel\n    color += texture(uTexture, clamp(vec2(vTextureCoord.x + uOffset.x, vTextureCoord.y + uOffset.y), uInputClamp.xy, uInputClamp.zw));\n\n    // Sample bottom right pixel\n    color += texture(uTexture, clamp(vec2(vTextureCoord.x + uOffset.x, vTextureCoord.y - uOffset.y), uInputClamp.xy, uInputClamp.zw));\n\n    // Sample bottom left pixel\n    color += texture(uTexture, clamp(vec2(vTextureCoord.x - uOffset.x, vTextureCoord.y - uOffset.y), uInputClamp.xy, uInputClamp.zw));\n\n    // Average\n    color *= 0.25;\n\n    finalColor = color;\n}\n", pl = "struct KawaseBlurUniforms {\n  uOffset:vec2<f32>,\n};\n\nstruct GlobalFilterUniforms {\n  uInputSize:vec4<f32>,\n  uInputPixel:vec4<f32>,\n  uInputClamp:vec4<f32>,\n  uOutputFrame:vec4<f32>,\n  uGlobalFrame:vec4<f32>,\n  uOutputTexture:vec4<f32>,\n};\n\n@group(0) @binding(0) var<uniform> gfu: GlobalFilterUniforms;\n\n@group(0) @binding(1) var uTexture: texture_2d<f32>; \n@group(0) @binding(2) var uSampler: sampler;\n@group(1) @binding(0) var<uniform> kawaseBlurUniforms : KawaseBlurUniforms;\n\n@fragment\nfn mainFragment(\n  @builtin(position) position: vec4<f32>,\n  @location(0) uv : vec2<f32>\n) -> @location(0) vec4<f32> {\n  let uOffset = kawaseBlurUniforms.uOffset;\n  var color: vec4<f32> = vec4(0.0);\n\n  // Sample top left pixel\n  color += textureSample(uTexture, uSampler, clamp(vec2<f32>(uv.x - uOffset.x, uv.y + uOffset.y), gfu.uInputClamp.xy, gfu.uInputClamp.zw));\n  // Sample top right pixel\n  color += textureSample(uTexture, uSampler, clamp(vec2<f32>(uv.x + uOffset.x, uv.y + uOffset.y), gfu.uInputClamp.xy, gfu.uInputClamp.zw));\n  // Sample bottom right pixel\n  color += textureSample(uTexture, uSampler, clamp(vec2<f32>(uv.x + uOffset.x, uv.y - uOffset.y), gfu.uInputClamp.xy, gfu.uInputClamp.zw));\n  // Sample bottom left pixel\n  color += textureSample(uTexture, uSampler, clamp(vec2<f32>(uv.x - uOffset.x, uv.y - uOffset.y), gfu.uInputClamp.xy, gfu.uInputClamp.zw));\n  // Average\n  color *= 0.25;\n    \n  return color;\n}", ml = Object.defineProperty, hl = (e, t, n) => t in e ? ml(e, t, {
	enumerable: !0,
	configurable: !0,
	writable: !0,
	value: n
}) : e[t] = n, gl = (e, t, n) => (hl(e, typeof t == "symbol" ? t : t + "", n), n), _l = class e extends h {
	constructor(...t) {
		let n = t[0] ?? {};
		(typeof n == "number" || Array.isArray(n)) && (te("6.0.0", "KawaseBlurFilter constructor params are now options object. See params: { strength, quality, clamp, pixelSize }"), n = { strength: n }, t[1] !== void 0 && (n.quality = t[1]), t[2] !== void 0 && (n.clamp = t[2])), n = {
			...e.DEFAULT_OPTIONS,
			...n
		};
		let r = _.from({
			vertex: {
				source: nl,
				entryPoint: "mainVertex"
			},
			fragment: {
				source: n?.clamp ? pl : dl,
				entryPoint: "mainFragment"
			}
		}), i = g.from({
			vertex: tl,
			fragment: n?.clamp ? fl : ul,
			name: "kawase-blur-filter"
		});
		super({
			gpuProgram: r,
			glProgram: i,
			resources: { kawaseBlurUniforms: { uOffset: {
				value: /* @__PURE__ */ new Float32Array(2),
				type: "vec2<f32>"
			} } }
		}), gl(this, "uniforms"), gl(this, "_pixelSize", {
			x: 0,
			y: 0
		}), gl(this, "_clamp"), gl(this, "_kernels", []), gl(this, "_blur"), gl(this, "_quality"), this.uniforms = this.resources.kawaseBlurUniforms.uniforms, this.pixelSize = n.pixelSize ?? {
			x: 1,
			y: 1
		}, Array.isArray(n.strength) ? this.kernels = n.strength : typeof n.strength == "number" && (this._blur = n.strength, this.quality = n.quality ?? 3), this._clamp = !!n.clamp;
	}
	apply(e, t, n, r) {
		let i = this.pixelSizeX / t.source.width, a = this.pixelSizeY / t.source.height, o;
		if (this._quality === 1 || this._blur === 0) o = this._kernels[0] + .5, this.uniforms.uOffset[0] = o * i, this.uniforms.uOffset[1] = o * a, e.applyFilter(this, t, n, r);
		else {
			let s = S.getSameSizeTexture(t), c = t, l = s, u, d = this._quality - 1;
			for (let t = 0; t < d; t++) o = this._kernels[t] + .5, this.uniforms.uOffset[0] = o * i, this.uniforms.uOffset[1] = o * a, e.applyFilter(this, c, l, !0), u = c, c = l, l = u;
			o = this._kernels[d] + .5, this.uniforms.uOffset[0] = o * i, this.uniforms.uOffset[1] = o * a, e.applyFilter(this, c, n, r), S.returnTexture(s);
		}
	}
	get strength() {
		return this._blur;
	}
	set strength(e) {
		this._blur = e, this._generateKernels();
	}
	get quality() {
		return this._quality;
	}
	set quality(e) {
		this._quality = Math.max(1, Math.round(e)), this._generateKernels();
	}
	get kernels() {
		return this._kernels;
	}
	set kernels(e) {
		Array.isArray(e) && e.length > 0 ? (this._kernels = e, this._quality = e.length, this._blur = Math.max(...e)) : (this._kernels = [0], this._quality = 1);
	}
	get pixelSize() {
		return this._pixelSize;
	}
	set pixelSize(e) {
		if (typeof e == "number") {
			this.pixelSizeX = this.pixelSizeY = e;
			return;
		}
		if (Array.isArray(e)) {
			this.pixelSizeX = e[0], this.pixelSizeY = e[1];
			return;
		}
		this._pixelSize = e;
	}
	get pixelSizeX() {
		return this.pixelSize.x;
	}
	set pixelSizeX(e) {
		this.pixelSize.x = e;
	}
	get pixelSizeY() {
		return this.pixelSize.y;
	}
	set pixelSizeY(e) {
		this.pixelSize.y = e;
	}
	get clamp() {
		return this._clamp;
	}
	_updatePadding() {
		this.padding = Math.ceil(this._kernels.reduce((e, t) => e + t + .5, 0));
	}
	_generateKernels() {
		let e = this._blur, t = this._quality, n = [e];
		if (e > 0) {
			let r = e, i = e / t;
			for (let e = 1; e < t; e++) r -= i, n.push(r);
		}
		this._kernels = n, this._updatePadding();
	}
};
gl(_l, "DEFAULT_OPTIONS", {
	strength: 4,
	quality: 3,
	clamp: !1,
	pixelSize: {
		x: 1,
		y: 1
	}
});
var vl = _l, Q = "precision highp float;\nin vec2 vTextureCoord;\nout vec4 finalColor;\n\nuniform sampler2D uTexture;\nuniform vec2 uTransform;\nuniform vec3 uLightColor;\nuniform float uLightAlpha;\nuniform vec3 uShadowColor;\nuniform float uShadowAlpha;\n\nuniform vec4 uInputSize;\n\nvoid main(void) {\n    vec2 transform = vec2(1.0 / uInputSize) * vec2(uTransform.x, uTransform.y);\n    vec4 color = texture(uTexture, vTextureCoord);\n    float light = texture(uTexture, vTextureCoord - transform).a;\n    float shadow = texture(uTexture, vTextureCoord + transform).a;\n\n    color.rgb = mix(color.rgb, uLightColor, clamp((color.a - light) * uLightAlpha, 0.0, 1.0));\n    color.rgb = mix(color.rgb, uShadowColor, clamp((color.a - shadow) * uShadowAlpha, 0.0, 1.0));\n    finalColor = vec4(color.rgb * color.a, color.a);\n}\n", yl = "struct BevelUniforms {\n  uLightColor: vec3<f32>,\n  uLightAlpha: f32,\n  uShadowColor: vec3<f32>,\n  uShadowAlpha: f32,\n  uTransform: vec2<f32>,\n};\n\nstruct GlobalFilterUniforms {\n  uInputSize:vec4<f32>,\n  uInputPixel:vec4<f32>,\n  uInputClamp:vec4<f32>,\n  uOutputFrame:vec4<f32>,\n  uGlobalFrame:vec4<f32>,\n  uOutputTexture:vec4<f32>,\n};\n\n@group(0) @binding(0) var<uniform> gfu: GlobalFilterUniforms;\n\n@group(0) @binding(1) var uTexture: texture_2d<f32>; \n@group(0) @binding(2) var uSampler: sampler;\n@group(1) @binding(0) var<uniform> bevelUniforms : BevelUniforms;\n\n@fragment\nfn mainFragment(\n  @builtin(position) position: vec4<f32>,\n  @location(0) uv : vec2<f32>\n) -> @location(0) vec4<f32> {\n  let transform = vec2<f32>(1.0 / gfu.uInputSize.xy) * vec2<f32>(bevelUniforms.uTransform.x, bevelUniforms.uTransform.y);\n  var color: vec4<f32> = textureSample(uTexture, uSampler, uv);\n  let lightSample: f32 = textureSample(uTexture, uSampler, uv - transform).a;\n  let shadowSample: f32 = textureSample(uTexture, uSampler, uv + transform).a;\n\n  let light = vec4<f32>(bevelUniforms.uLightColor, bevelUniforms.uLightAlpha);\n  let shadow = vec4<f32>(bevelUniforms.uShadowColor, bevelUniforms.uShadowAlpha);\n\n  color = vec4<f32>(mix(color.rgb, light.rgb, clamp((color.a - lightSample) * light.a, 0.0, 1.0)), color.a);\n  color = vec4<f32>(mix(color.rgb, shadow.rgb, clamp((color.a - shadowSample) * shadow.a, 0.0, 1.0)), color.a);\n  \n  return vec4<f32>(color.rgb * color.a, color.a);\n}", bl = Object.defineProperty, xl = (e, t, n) => t in e ? bl(e, t, {
	enumerable: !0,
	configurable: !0,
	writable: !0,
	value: n
}) : e[t] = n, Sl = (e, t, n) => (xl(e, typeof t == "symbol" ? t : t + "", n), n), Cl = class e extends h {
	constructor(t) {
		t = {
			...e.DEFAULT_OPTIONS,
			...t
		};
		let n = _.from({
			vertex: {
				source: nl,
				entryPoint: "mainVertex"
			},
			fragment: {
				source: yl,
				entryPoint: "mainFragment"
			}
		}), r = g.from({
			vertex: tl,
			fragment: Q,
			name: "bevel-filter"
		});
		super({
			gpuProgram: n,
			glProgram: r,
			resources: { bevelUniforms: {
				uLightColor: {
					value: /* @__PURE__ */ new Float32Array(3),
					type: "vec3<f32>"
				},
				uLightAlpha: {
					value: t.lightAlpha,
					type: "f32"
				},
				uShadowColor: {
					value: /* @__PURE__ */ new Float32Array(3),
					type: "vec3<f32>"
				},
				uShadowAlpha: {
					value: t.shadowAlpha,
					type: "f32"
				},
				uTransform: {
					value: /* @__PURE__ */ new Float32Array(2),
					type: "vec2<f32>"
				}
			} },
			padding: 1
		}), Sl(this, "uniforms"), Sl(this, "_thickness"), Sl(this, "_rotation"), Sl(this, "_lightColor"), Sl(this, "_shadowColor"), this.uniforms = this.resources.bevelUniforms.uniforms, this._lightColor = new d(), this._shadowColor = new d(), this.lightColor = t.lightColor ?? 16777215, this.shadowColor = t.shadowColor ?? 0, Object.assign(this, t);
	}
	get rotation() {
		return this._rotation / p;
	}
	set rotation(e) {
		this._rotation = e * p, this._updateTransform();
	}
	get thickness() {
		return this._thickness;
	}
	set thickness(e) {
		this._thickness = e, this._updateTransform();
	}
	get lightColor() {
		return this._lightColor.value;
	}
	set lightColor(e) {
		this._lightColor.setValue(e);
		let [t, n, r] = this._lightColor.toArray();
		this.uniforms.uLightColor[0] = t, this.uniforms.uLightColor[1] = n, this.uniforms.uLightColor[2] = r;
	}
	get lightAlpha() {
		return this.uniforms.uLightAlpha;
	}
	set lightAlpha(e) {
		this.uniforms.uLightAlpha = e;
	}
	get shadowColor() {
		return this._shadowColor.value;
	}
	set shadowColor(e) {
		this._shadowColor.setValue(e);
		let [t, n, r] = this._shadowColor.toArray();
		this.uniforms.uShadowColor[0] = t, this.uniforms.uShadowColor[1] = n, this.uniforms.uShadowColor[2] = r;
	}
	get shadowAlpha() {
		return this.uniforms.uShadowAlpha;
	}
	set shadowAlpha(e) {
		this.uniforms.uShadowAlpha = e;
	}
	_updateTransform() {
		this.uniforms.uTransform[0] = this.thickness * Math.cos(this._rotation), this.uniforms.uTransform[1] = this.thickness * Math.sin(this._rotation);
	}
};
Sl(Cl, "DEFAULT_OPTIONS", {
	rotation: 45,
	thickness: 2,
	lightColor: 16777215,
	lightAlpha: .7,
	shadowColor: 0,
	shadowAlpha: .7
});
var wl = Cl, Tl = "precision highp float;\nin vec2 vTextureCoord;\nout vec4 finalColor;\n\nuniform sampler2D uTexture;\nuniform float uAlpha;\nuniform vec3 uColor;\nuniform vec2 uOffset;\n\nuniform vec4 uInputSize;\n\nvoid main(void){\n    vec4 sample = texture(uTexture, vTextureCoord - uOffset * uInputSize.zw);\n\n    // Premultiply alpha\n    sample.rgb = uColor.rgb * sample.a;\n\n    // alpha user alpha\n    sample *= uAlpha;\n\n    finalColor = sample;\n}", El = "struct DropShadowUniforms {\n  uAlpha: f32,\n  uColor: vec3<f32>,\n  uOffset: vec2<f32>,\n};\n\nstruct GlobalFilterUniforms {\n  uInputSize:vec4<f32>,\n  uInputPixel:vec4<f32>,\n  uInputClamp:vec4<f32>,\n  uOutputFrame:vec4<f32>,\n  uGlobalFrame:vec4<f32>,\n  uOutputTexture:vec4<f32>,\n};\n\n@group(0) @binding(0) var<uniform> gfu: GlobalFilterUniforms;\n\n@group(0) @binding(1) var uTexture: texture_2d<f32>; \n@group(0) @binding(2) var uSampler: sampler;\n@group(1) @binding(0) var<uniform> dropShadowUniforms : DropShadowUniforms;\n\n@fragment\nfn mainFragment(\n  @builtin(position) position: vec4<f32>,\n  @location(0) uv : vec2<f32>\n) -> @location(0) vec4<f32> {\n  var color: vec4<f32> = textureSample(uTexture, uSampler, uv - dropShadowUniforms.uOffset * gfu.uInputSize.zw);\n\n  // Premultiply alpha\n  color = vec4<f32>(vec3<f32>(dropShadowUniforms.uColor.rgb * color.a), color.a);\n  // alpha user alpha\n  color *= dropShadowUniforms.uAlpha;\n\n  return color;\n}", Dl = Object.defineProperty, Ol = (e, t, n) => t in e ? Dl(e, t, {
	enumerable: !0,
	configurable: !0,
	writable: !0,
	value: n
}) : e[t] = n, kl = (e, t, n) => (Ol(e, typeof t == "symbol" ? t : t + "", n), n), Al = class e extends h {
	constructor(t) {
		t = {
			...e.DEFAULT_OPTIONS,
			...t
		};
		let n = _.from({
			vertex: {
				source: nl,
				entryPoint: "mainVertex"
			},
			fragment: {
				source: El,
				entryPoint: "mainFragment"
			}
		}), r = g.from({
			vertex: tl,
			fragment: Tl,
			name: "drop-shadow-filter"
		});
		super({
			gpuProgram: n,
			glProgram: r,
			resources: { dropShadowUniforms: {
				uAlpha: {
					value: t.alpha,
					type: "f32"
				},
				uColor: {
					value: /* @__PURE__ */ new Float32Array(3),
					type: "vec3<f32>"
				},
				uOffset: {
					value: t.offset,
					type: "vec2<f32>"
				}
			} },
			resolution: t.resolution
		}), kl(this, "uniforms"), kl(this, "shadowOnly", !1), kl(this, "_color"), kl(this, "_blurFilter"), kl(this, "_basePass"), this.uniforms = this.resources.dropShadowUniforms.uniforms, this._color = new d(), this.color = t.color ?? 0, this._blurFilter = new vl({
			strength: t.kernels ?? t.blur,
			quality: t.kernels ? void 0 : t.quality
		}), this._basePass = new h({
			gpuProgram: _.from({
				vertex: {
					source: nl,
					entryPoint: "mainVertex"
				},
				fragment: {
					source: "\n                    @group(0) @binding(1) var uTexture: texture_2d<f32>; \n                    @group(0) @binding(2) var uSampler: sampler;\n                    @fragment\n                    fn mainFragment(\n                        @builtin(position) position: vec4<f32>,\n                        @location(0) uv : vec2<f32>\n                    ) -> @location(0) vec4<f32> {\n                        return textureSample(uTexture, uSampler, uv);\n                    }\n                    ",
					entryPoint: "mainFragment"
				}
			}),
			glProgram: g.from({
				vertex: tl,
				fragment: "\n                in vec2 vTextureCoord;\n                out vec4 finalColor;\n                uniform sampler2D uTexture;\n\n                void main(void){\n                    finalColor = texture(uTexture, vTextureCoord);\n                }\n                ",
				name: "drop-shadow-filter"
			}),
			resources: {}
		}), Object.assign(this, t);
	}
	apply(e, t, n, r) {
		let i = S.getSameSizeTexture(t);
		e.applyFilter(this, t, i, !0), this._blurFilter.apply(e, i, n, r), this.shadowOnly || e.applyFilter(this._basePass, t, n, !1), S.returnTexture(i);
	}
	get offset() {
		return this.uniforms.uOffset;
	}
	set offset(e) {
		this.uniforms.uOffset = e, this._updatePadding();
	}
	get offsetX() {
		return this.offset.x;
	}
	set offsetX(e) {
		this.offset.x = e, this._updatePadding();
	}
	get offsetY() {
		return this.offset.y;
	}
	set offsetY(e) {
		this.offset.y = e, this._updatePadding();
	}
	get color() {
		return this._color.value;
	}
	set color(e) {
		this._color.setValue(e);
		let [t, n, r] = this._color.toArray();
		this.uniforms.uColor[0] = t, this.uniforms.uColor[1] = n, this.uniforms.uColor[2] = r;
	}
	get alpha() {
		return this.uniforms.uAlpha;
	}
	set alpha(e) {
		this.uniforms.uAlpha = e;
	}
	get blur() {
		return this._blurFilter.strength;
	}
	set blur(e) {
		this._blurFilter.strength = e, this._updatePadding();
	}
	get quality() {
		return this._blurFilter.quality;
	}
	set quality(e) {
		this._blurFilter.quality = e, this._updatePadding();
	}
	get kernels() {
		return this._blurFilter.kernels;
	}
	set kernels(e) {
		this._blurFilter.kernels = e;
	}
	get pixelSize() {
		return this._blurFilter.pixelSize;
	}
	set pixelSize(e) {
		typeof e == "number" && (e = {
			x: e,
			y: e
		}), Array.isArray(e) && (e = {
			x: e[0],
			y: e[1]
		}), this._blurFilter.pixelSize = e;
	}
	get pixelSizeX() {
		return this._blurFilter.pixelSizeX;
	}
	set pixelSizeX(e) {
		this._blurFilter.pixelSizeX = e;
	}
	get pixelSizeY() {
		return this._blurFilter.pixelSizeY;
	}
	set pixelSizeY(e) {
		this._blurFilter.pixelSizeY = e;
	}
	_updatePadding() {
		let e = Math.max(Math.abs(this.offsetX), Math.abs(this.offsetY));
		this.padding = e + this.blur * 2 + this.quality * 4;
	}
};
kl(Al, "DEFAULT_OPTIONS", {
	offset: {
		x: 4,
		y: 4
	},
	color: 0,
	alpha: .5,
	shadowOnly: !1,
	kernels: void 0,
	blur: 2,
	quality: 3,
	pixelSize: {
		x: 1,
		y: 1
	},
	resolution: 1
});
var jl = Al, Ml = "precision highp float;\nin vec2 vTextureCoord;\nout vec4 finalColor;\n\nuniform sampler2D uTexture;\nuniform vec2 uStrength;\nuniform vec3 uColor;\nuniform float uKnockout;\nuniform float uAlpha;\n\nuniform vec4 uInputSize;\nuniform vec4 uInputClamp;\n\nconst float PI = 3.14159265358979323846264;\n\n// Hard-assignment of DIST and ANGLE_STEP_SIZE instead of using uDistance and uQuality to allow them to be use on GLSL loop conditions\nconst float DIST = __DIST__;\nconst float ANGLE_STEP_SIZE = min(__ANGLE_STEP_SIZE__, PI * 2.);\nconst float ANGLE_STEP_NUM = ceil(PI * 2. / ANGLE_STEP_SIZE);\nconst float MAX_TOTAL_ALPHA = ANGLE_STEP_NUM * DIST * (DIST + 1.) / 2.;\n\nvoid main(void) {\n    vec2 px = vec2(1.) / uInputSize.xy;\n\n    float totalAlpha = 0.;\n\n    vec2 direction;\n    vec2 displaced;\n    vec4 curColor;\n\n    for (float angle = 0.; angle < PI * 2.; angle += ANGLE_STEP_SIZE) {\n      direction = vec2(cos(angle), sin(angle)) * px;\n\n      for (float curDistance = 0.; curDistance < DIST; curDistance++) {\n          displaced = clamp(vTextureCoord + direction * (curDistance + 1.), uInputClamp.xy, uInputClamp.zw);\n          curColor = texture(uTexture, displaced);\n          totalAlpha += (DIST - curDistance) * curColor.a;\n      }\n    }\n    \n    curColor = texture(uTexture, vTextureCoord);\n\n    vec4 glowColor = vec4(uColor, uAlpha);\n    bool knockout = uKnockout > .5;\n    float innerStrength = uStrength[0];\n    float outerStrength = uStrength[1];\n\n    float alphaRatio = totalAlpha / MAX_TOTAL_ALPHA;\n    float innerGlowAlpha = (1. - alphaRatio) * innerStrength * curColor.a * uAlpha;\n    float innerGlowStrength = min(1., innerGlowAlpha);\n    \n    vec4 innerColor = mix(curColor, glowColor, innerGlowStrength);\n    float outerGlowAlpha = alphaRatio * outerStrength * (1. - curColor.a) * uAlpha;\n    float outerGlowStrength = min(1. - innerColor.a, outerGlowAlpha);\n    vec4 outerGlowColor = outerGlowStrength * glowColor.rgba;\n\n    if (knockout) {\n      float resultAlpha = outerGlowAlpha + innerGlowAlpha;\n      finalColor = vec4(glowColor.rgb * resultAlpha, resultAlpha);\n    }\n    else {\n      finalColor = innerColor + outerGlowColor;\n    }\n}\n", Nl = "struct GlowUniforms {\n  uDistance: f32,\n  uStrength: vec2<f32>,\n  uColor: vec3<f32>,\n  uAlpha: f32,\n  uQuality: f32,\n  uKnockout: f32,\n};\n\nstruct GlobalFilterUniforms {\n  uInputSize:vec4<f32>,\n  uInputPixel:vec4<f32>,\n  uInputClamp:vec4<f32>,\n  uOutputFrame:vec4<f32>,\n  uGlobalFrame:vec4<f32>,\n  uOutputTexture:vec4<f32>,\n};\n\n@group(0) @binding(0) var<uniform> gfu: GlobalFilterUniforms;\n\n@group(0) @binding(1) var uTexture: texture_2d<f32>; \n@group(0) @binding(2) var uSampler: sampler;\n@group(1) @binding(0) var<uniform> glowUniforms : GlowUniforms;\n\n@fragment\nfn mainFragment(\n  @builtin(position) position: vec4<f32>,\n  @location(0) uv : vec2<f32>\n) -> @location(0) vec4<f32> {\n  let quality = glowUniforms.uQuality;\n  let distance = glowUniforms.uDistance;\n\n  let dist: f32 = glowUniforms.uDistance;\n  let angleStepSize: f32 = min(1. / quality / distance, PI * 2.0);\n  let angleStepNum: f32 = ceil(PI * 2.0 / angleStepSize);\n\n  let px: vec2<f32> = vec2<f32>(1.0 / gfu.uInputSize.xy);\n\n  var totalAlpha: f32 = 0.0;\n\n  var direction: vec2<f32>;\n  var displaced: vec2<f32>;\n  var curColor: vec4<f32>;\n\n  for (var angle = 0.0; angle < PI * 2.0; angle += angleStepSize) {\n    direction = vec2<f32>(cos(angle), sin(angle)) * px;\n    for (var curDistance = 0.0; curDistance < dist; curDistance+=1) {\n      displaced = vec2<f32>(clamp(uv + direction * (curDistance + 1.0), gfu.uInputClamp.xy, gfu.uInputClamp.zw));\n      curColor = textureSample(uTexture, uSampler, displaced);\n      totalAlpha += (dist - curDistance) * curColor.a;\n    }\n  }\n    \n  curColor = textureSample(uTexture, uSampler, uv);\n\n  let glowColorRGB = glowUniforms.uColor;\n  let glowAlpha = glowUniforms.uAlpha;\n  let glowColor = vec4<f32>(glowColorRGB, glowAlpha);\n  let knockout: bool = glowUniforms.uKnockout > 0.5;\n  let innerStrength = glowUniforms.uStrength[0];\n  let outerStrength = glowUniforms.uStrength[1];\n\n  let alphaRatio: f32 = (totalAlpha / (angleStepNum * dist * (dist + 1.0) / 2.0));\n  let innerGlowAlpha: f32 = (1.0 - alphaRatio) * innerStrength * curColor.a * glowAlpha;\n  let innerGlowStrength: f32 = min(1.0, innerGlowAlpha);\n  \n  let innerColor: vec4<f32> = mix(curColor, glowColor, innerGlowStrength);\n  let outerGlowAlpha: f32 = alphaRatio * outerStrength * (1. - curColor.a) * glowAlpha;\n  let outerGlowStrength: f32 = min(1.0 - innerColor.a, outerGlowAlpha);\n  let outerGlowColor: vec4<f32> = outerGlowStrength * glowColor.rgba;\n  \n  if (knockout) {\n    let resultAlpha: f32 = outerGlowAlpha + innerGlowAlpha;\n    return vec4<f32>(glowColor.rgb * resultAlpha, resultAlpha);\n  }\n  else {\n    return innerColor + outerGlowColor;\n  }\n}\n\nconst PI: f32 = 3.14159265358979323846264;", Pl = Object.defineProperty, Fl = (e, t, n) => t in e ? Pl(e, t, {
	enumerable: !0,
	configurable: !0,
	writable: !0,
	value: n
}) : e[t] = n, Il = (e, t, n) => (Fl(e, typeof t == "symbol" ? t : t + "", n), n), Ll = class e extends h {
	constructor(t) {
		t = {
			...e.DEFAULT_OPTIONS,
			...t
		};
		let n = t.distance ?? 10, r = t.quality ?? .1, i = _.from({
			vertex: {
				source: nl,
				entryPoint: "mainVertex"
			},
			fragment: {
				source: Nl,
				entryPoint: "mainFragment"
			}
		}), a = g.from({
			vertex: tl,
			fragment: Ml.replace(/__ANGLE_STEP_SIZE__/gi, `${(1 / r / n).toFixed(7)}`).replace(/__DIST__/gi, `${n.toFixed(0)}.0`),
			name: "glow-filter"
		});
		super({
			gpuProgram: i,
			glProgram: a,
			resources: { glowUniforms: {
				uDistance: {
					value: n,
					type: "f32"
				},
				uStrength: {
					value: [t.innerStrength, t.outerStrength],
					type: "vec2<f32>"
				},
				uColor: {
					value: /* @__PURE__ */ new Float32Array(3),
					type: "vec3<f32>"
				},
				uAlpha: {
					value: t.alpha,
					type: "f32"
				},
				uQuality: {
					value: r,
					type: "f32"
				},
				uKnockout: {
					value: t?.knockout ?? !1 ? 1 : 0,
					type: "f32"
				}
			} },
			padding: n
		}), Il(this, "uniforms"), Il(this, "_color"), this.uniforms = this.resources.glowUniforms.uniforms, this._color = new d(), this.color = t.color ?? 16777215;
	}
	get distance() {
		return this.uniforms.uDistance;
	}
	set distance(e) {
		this.uniforms.uDistance = this.padding = e;
	}
	get innerStrength() {
		return this.uniforms.uStrength[0];
	}
	set innerStrength(e) {
		this.uniforms.uStrength[0] = e;
	}
	get outerStrength() {
		return this.uniforms.uStrength[1];
	}
	set outerStrength(e) {
		this.uniforms.uStrength[1] = e;
	}
	get color() {
		return this._color.value;
	}
	set color(e) {
		this._color.setValue(e);
		let [t, n, r] = this._color.toArray();
		this.uniforms.uColor[0] = t, this.uniforms.uColor[1] = n, this.uniforms.uColor[2] = r;
	}
	get alpha() {
		return this.uniforms.uAlpha;
	}
	set alpha(e) {
		this.uniforms.uAlpha = e;
	}
	get quality() {
		return this.uniforms.uQuality;
	}
	set quality(e) {
		this.uniforms.uQuality = e;
	}
	get knockout() {
		return this.uniforms.uKnockout === 1;
	}
	set knockout(e) {
		this.uniforms.uKnockout = +!!e;
	}
};
Il(Ll, "DEFAULT_OPTIONS", {
	distance: 10,
	outerStrength: 4,
	innerStrength: 0,
	color: 16777215,
	alpha: 1,
	quality: .1,
	knockout: !1
});
var Rl = Ll, zl = "precision highp float;\nin vec2 vTextureCoord;\nout vec4 finalColor;\n\nuniform sampler2D uTexture;\nuniform vec2 uThickness;\nuniform vec3 uColor;\nuniform float uAlpha;\nuniform float uKnockout;\n\nuniform vec4 uInputClamp;\n\nconst float DOUBLE_PI = 2. * 3.14159265358979323846264;\nconst float ANGLE_STEP = ${ANGLE_STEP};\n\nfloat outlineMaxAlphaAtPos(vec2 pos) {\n    if (uThickness.x == 0. || uThickness.y == 0.) {\n        return 0.;\n    }\n\n    vec4 displacedColor;\n    vec2 displacedPos;\n    float maxAlpha = 0.;\n\n    for (float angle = 0.; angle <= DOUBLE_PI; angle += ANGLE_STEP) {\n        displacedPos.x = vTextureCoord.x + uThickness.x * cos(angle);\n        displacedPos.y = vTextureCoord.y + uThickness.y * sin(angle);\n        displacedColor = texture(uTexture, clamp(displacedPos, uInputClamp.xy, uInputClamp.zw));\n        maxAlpha = max(maxAlpha, displacedColor.a);\n    }\n\n    return maxAlpha;\n}\n\nvoid main(void) {\n    vec4 sourceColor = texture(uTexture, vTextureCoord);\n    vec4 contentColor = sourceColor * float(uKnockout < 0.5);\n    float outlineAlpha = uAlpha * outlineMaxAlphaAtPos(vTextureCoord.xy) * (1.-sourceColor.a);\n    vec4 outlineColor = vec4(vec3(uColor) * outlineAlpha, outlineAlpha);\n    finalColor = contentColor + outlineColor;\n}\n", Bl = "struct OutlineUniforms {\n  uThickness:vec2<f32>,\n  uColor:vec3<f32>,\n  uAlpha:f32,\n  uAngleStep:f32,\n  uKnockout:f32,\n};\n\nstruct GlobalFilterUniforms {\n  uInputSize:vec4<f32>,\n  uInputPixel:vec4<f32>,\n  uInputClamp:vec4<f32>,\n  uOutputFrame:vec4<f32>,\n  uGlobalFrame:vec4<f32>,\n  uOutputTexture:vec4<f32>,\n};\n\n@group(0) @binding(0) var<uniform> gfu: GlobalFilterUniforms;\n\n@group(0) @binding(1) var uTexture: texture_2d<f32>; \n@group(0) @binding(2) var uSampler: sampler;\n@group(1) @binding(0) var<uniform> outlineUniforms : OutlineUniforms;\n\n@fragment\nfn mainFragment(\n  @builtin(position) position: vec4<f32>,\n  @location(0) uv : vec2<f32>\n) -> @location(0) vec4<f32> {\n  let sourceColor: vec4<f32> = textureSample(uTexture, uSampler, uv);\n  let contentColor: vec4<f32> = sourceColor * (1. - outlineUniforms.uKnockout);\n  \n  let outlineAlpha: f32 = outlineUniforms.uAlpha * outlineMaxAlphaAtPos(uv) * (1. - sourceColor.a);\n  let outlineColor: vec4<f32> = vec4<f32>(vec3<f32>(outlineUniforms.uColor) * outlineAlpha, outlineAlpha);\n  \n  return contentColor + outlineColor;\n}\n\nfn outlineMaxAlphaAtPos(uv: vec2<f32>) -> f32 {\n  let thickness = outlineUniforms.uThickness;\n\n  if (thickness.x == 0. || thickness.y == 0.) {\n    return 0.;\n  }\n  \n  let angleStep = outlineUniforms.uAngleStep;\n\n  var displacedColor: vec4<f32>;\n  var displacedPos: vec2<f32>;\n\n  var maxAlpha: f32 = 0.;\n  var displaced: vec2<f32>;\n  var curColor: vec4<f32>;\n\n  for (var angle = 0.; angle <= DOUBLE_PI; angle += angleStep)\n  {\n    displaced.x = uv.x + thickness.x * cos(angle);\n    displaced.y = uv.y + thickness.y * sin(angle);\n    curColor = textureSample(uTexture, uSampler, clamp(displaced, gfu.uInputClamp.xy, gfu.uInputClamp.zw));\n    maxAlpha = max(maxAlpha, curColor.a);\n  }\n\n  return maxAlpha;\n}\n\nconst DOUBLE_PI: f32 = 3.14159265358979323846264 * 2.;", Vl = Object.defineProperty, Hl = (e, t, n) => t in e ? Vl(e, t, {
	enumerable: !0,
	configurable: !0,
	writable: !0,
	value: n
}) : e[t] = n, Ul = (e, t, n) => (Hl(e, typeof t == "symbol" ? t : t + "", n), n), Wl = class e extends h {
	constructor(...t) {
		let n = t[0] ?? {};
		typeof n == "number" && (te("6.0.0", "OutlineFilter constructor params are now options object. See params: { thickness, color, quality, alpha, knockout }"), n = { thickness: n }, t[1] !== void 0 && (n.color = t[1]), t[2] !== void 0 && (n.quality = t[2]), t[3] !== void 0 && (n.alpha = t[3]), t[4] !== void 0 && (n.knockout = t[4])), n = {
			...e.DEFAULT_OPTIONS,
			...n
		};
		let r = n.quality ?? .1, i = _.from({
			vertex: {
				source: nl,
				entryPoint: "mainVertex"
			},
			fragment: {
				source: Bl,
				entryPoint: "mainFragment"
			}
		}), a = g.from({
			vertex: tl,
			fragment: zl.replace(/\$\{ANGLE_STEP\}/, e.getAngleStep(r).toFixed(7)),
			name: "outline-filter"
		});
		super({
			gpuProgram: i,
			glProgram: a,
			resources: { outlineUniforms: {
				uThickness: {
					value: /* @__PURE__ */ new Float32Array(2),
					type: "vec2<f32>"
				},
				uColor: {
					value: /* @__PURE__ */ new Float32Array(3),
					type: "vec3<f32>"
				},
				uAlpha: {
					value: n.alpha,
					type: "f32"
				},
				uAngleStep: {
					value: 0,
					type: "f32"
				},
				uKnockout: {
					value: +!!n.knockout,
					type: "f32"
				}
			} }
		}), Ul(this, "uniforms"), Ul(this, "_thickness"), Ul(this, "_quality"), Ul(this, "_color"), this.uniforms = this.resources.outlineUniforms.uniforms, this.uniforms.uAngleStep = e.getAngleStep(r), this._color = new d(), this.color = n.color ?? 0, Object.assign(this, n);
	}
	apply(e, t, n, r) {
		this.uniforms.uThickness[0] = this.thickness / t.source.width, this.uniforms.uThickness[1] = this.thickness / t.source.height, e.applyFilter(this, t, n, r);
	}
	static getAngleStep(t) {
		return parseFloat((Math.PI * 2 / Math.max(t * e.MAX_SAMPLES, e.MIN_SAMPLES)).toFixed(7));
	}
	get thickness() {
		return this._thickness;
	}
	set thickness(e) {
		this._thickness = this.padding = e;
	}
	get color() {
		return this._color.value;
	}
	set color(e) {
		this._color.setValue(e);
		let [t, n, r] = this._color.toArray();
		this.uniforms.uColor[0] = t, this.uniforms.uColor[1] = n, this.uniforms.uColor[2] = r;
	}
	get alpha() {
		return this.uniforms.uAlpha;
	}
	set alpha(e) {
		this.uniforms.uAlpha = e;
	}
	get quality() {
		return this._quality;
	}
	set quality(t) {
		this._quality = t, this.uniforms.uAngleStep = e.getAngleStep(t);
	}
	get knockout() {
		return this.uniforms.uKnockout === 1;
	}
	set knockout(e) {
		this.uniforms.uKnockout = +!!e;
	}
};
Ul(Wl, "DEFAULT_OPTIONS", {
	thickness: 1,
	color: 0,
	alpha: 1,
	quality: .1,
	knockout: !1
}), Ul(Wl, "MIN_SAMPLES", 1), Ul(Wl, "MAX_SAMPLES", 100);
var Gl = Wl, Kl = { "chromatic-aberration": "\nprecision highp float;\nin vec2 vTextureCoord;\nout vec4 finalColor;\n\nuniform sampler2D uTexture;\nuniform vec4 uInputSize;\nuniform float u_strength;\n\nvoid main(void) {\n  vec2 texel = uInputSize.zw;\n  vec2 offset = vec2(u_strength, 0.0) * texel;\n  float r = texture(uTexture, vTextureCoord - offset).r;\n  float g = texture(uTexture, vTextureCoord).g;\n  float b = texture(uTexture, vTextureCoord + offset).b;\n  float a = texture(uTexture, vTextureCoord).a;\n  finalColor = vec4(r, g, b, a);\n}\n" };
//#endregion
//#region src/effects/buildFilters.ts
function ql(e) {
	let t = {};
	for (let [n, r] of Object.entries(e)) t[`u_${n}`] = Array.isArray(r) ? {
		value: new Float32Array(r),
		type: `vec${r.length}<f32>`
	} : {
		value: r,
		type: "f32"
	};
	return t;
}
function Jl(e, t) {
	if (!e) return [];
	let n = [];
	for (let r of e) switch (r.type) {
		case "shadow":
			n.push(new jl({
				color: r.color,
				blur: r.blur,
				offset: {
					x: r.offset[0],
					y: r.offset[1]
				},
				alpha: r.alpha
			}));
			break;
		case "text-shadow": {
			if (r.style !== "drop" || !t) break;
			let e = r.distance * t, i = new jl({
				color: r.color,
				blur: r.blur ?? 4,
				offset: {
					x: Math.cos(r.angle) * e,
					y: Math.sin(r.angle) * e
				},
				alpha: 1,
				quality: 12
			});
			i.antialias = "inherit", i.resolution = "inherit", n.push(i);
			break;
		}
		case "glow":
			n.push(new Rl({
				color: r.color,
				outerStrength: r.strength,
				innerStrength: r.outer ? 0 : r.strength
			}));
			break;
		case "outline":
			n.push(new Gl({
				thickness: r.thickness,
				color: r.color
			}));
			break;
		case "blur":
			n.push(new u({ strength: r.amount }));
			break;
		case "extrude3d":
			n.push(new wl({
				thickness: r.depth,
				rotation: r.angle * 180 / Math.PI,
				lightColor: r.color,
				shadowColor: r.color
			}));
			break;
		case "custom": {
			let e = Kl[r.shaderId];
			if (!e) break;
			n.push(new h({
				glProgram: new g({
					vertex: C,
					fragment: e,
					name: `custom-${r.shaderId}-filter`
				}),
				resources: { customUniforms: ql(r.uniforms) }
			}));
			break;
		}
	}
	return n;
}
//#endregion
//#region src/render/applyTransform.ts
function Yl(e, t) {
	let { transform: n, size: r } = t, i = n.originX ?? 0, a = n.originY ?? 0;
	e.pivot.set(i * r.width, a * r.height), e.position.set(n.x, n.y), e.scale.set(n.scaleX, n.scaleY), e.rotation = n.rotation, e.skew.set(n.skewX ?? 0, n.skewY ?? 0), e.alpha = t.opacity, e.visible = t.visible, e.blendMode = t.blendMode ?? "normal", e.filters = Jl(t.effects, t.type === "text" ? t.font.size : void 0);
}
function Xl(e, t) {
	let n = (e.originX ?? 0) * t.width, r = (e.originY ?? 0) * t.height;
	return new y().setTransform(e.x, e.y, n, r, e.scaleX, e.scaleY, e.rotation, e.skewX ?? 0, e.skewY ?? 0);
}
function Zl(e, t, n, r) {
	let i = Xl(e, t), a = Xl(n, r);
	return $l(new y().appendFrom(a, i), n, r);
}
function Ql(e, t, n, r) {
	let i = Xl(e, t), a = Xl(n, r), o = i.clone().invert();
	return $l(new y().appendFrom(a, o), n, r);
}
function $l(e, t, n) {
	let r = {
		position: {
			x: 0,
			y: 0
		},
		scale: {
			x: 1,
			y: 1
		},
		pivot: {
			x: (t.originX ?? 0) * n.width,
			y: (t.originY ?? 0) * n.height
		},
		skew: {
			x: 0,
			y: 0
		},
		rotation: 0
	};
	return e.decompose(r), {
		x: r.position.x,
		y: r.position.y,
		scaleX: r.scale.x,
		scaleY: r.scale.y,
		rotation: r.rotation,
		skewX: r.skew.x,
		skewY: r.skew.y,
		originX: t.originX,
		originY: t.originY
	};
}
//#endregion
//#region src/render/interactions/resizeMath.ts
var eu = 2;
function tu(e, t, n) {
	switch (e) {
		case "nw": return {
			x: 1,
			y: 1
		};
		case "ne": return {
			x: 0,
			y: 1
		};
		case "sw": return {
			x: 1,
			y: 0
		};
		case "se": return {
			x: 0,
			y: 0
		};
		case "n": return {
			x: t,
			y: 1
		};
		case "s": return {
			x: t,
			y: 0
		};
		case "e": return {
			x: 0,
			y: n
		};
		case "w": return {
			x: 1,
			y: n
		};
	}
}
function nu(e, t) {
	let n = Math.cos(t), r = Math.sin(t);
	return {
		x: e.x * n - e.y * r,
		y: e.x * r + e.y * n
	};
}
function ru(e, t, n) {
	let { transform: r, size: i } = e, a = r.originX ?? 0, o = r.originY ?? 0, s = r.scaleX || 1, c = r.scaleY || 1, l = nu(n, -r.rotation), u = {
		x: l.x / s,
		y: l.y / c
	}, d = t.includes("e") ? 1 : t.includes("w") ? -1 : 0, f = t.includes("s") ? 1 : t.includes("n") ? -1 : 0, p = Math.max(eu, i.width + d * u.x), m = Math.max(eu, i.height + f * u.y), h = tu(t, a, o), g = {
		x: a * i.width,
		y: o * i.height
	}, _ = {
		x: a * p,
		y: o * m
	}, v = {
		x: h.x * i.width,
		y: h.y * i.height
	}, y = {
		x: h.x * p,
		y: h.y * m
	}, b = nu({
		x: (v.x - g.x) * s,
		y: (v.y - g.y) * c
	}, r.rotation), ee = {
		x: r.x + b.x,
		y: r.y + b.y
	}, x = nu({
		x: (y.x - _.x) * s,
		y: (y.y - _.y) * c
	}, r.rotation);
	return {
		size: {
			width: p,
			height: m
		},
		transform: {
			x: ee.x - x.x,
			y: ee.y - x.y
		}
	};
}
var iu = .01;
function au(e, t, n, r) {
	let { transform: i, size: a } = e, { scaleX: o, scaleY: s, rotation: c } = i, l = {
		x: (i.originX ?? 0) * a.width,
		y: (i.originY ?? 0) * a.height
	}, u = t.includes("e") ? 1 : t.includes("w") ? 0 : .5, d = t.includes("s") ? 1 : t.includes("n") ? 0 : .5, f = {
		x: r.x + (1 - u) * r.width,
		y: r.y + (1 - d) * r.height
	}, p = {
		x: (2 * u - 1) * r.width * o,
		y: (2 * d - 1) * r.height * s
	}, m = nu(n, -c), h = {
		x: p.x + m.x,
		y: p.y + m.y
	}, g = (e, t) => Number.isFinite(e) ? Math.max(iu / Math.abs(t), e) : 1, _ = 1, v = 1;
	if (u !== .5 && d !== .5) {
		let e = Math.min(Math.abs(o), Math.abs(s));
		_ = v = g((h.x * p.x + h.y * p.y) / (p.x * p.x + p.y * p.y), e);
	} else u === .5 ? v = g(h.y / p.y, s) : _ = g(h.x / p.x, o);
	let y = nu({
		x: (f.x - l.x) * o,
		y: (f.y - l.y) * s
	}, c), b = nu({
		x: (f.x - l.x) * o * _,
		y: (f.y - l.y) * s * v
	}, c);
	return {
		scaleX: o * _,
		scaleY: s * v,
		x: i.x + y.x - b.x,
		y: i.y + y.y - b.y
	};
}
//#endregion
//#region src/render/interactions/groupTransformMath.ts
function ou(e) {
	let t = e.flatMap((e) => cu(e)), n = {
		x: Math.min(...t.map((e) => e.x)),
		y: Math.min(...t.map((e) => e.y))
	}, r = {
		x: Math.max(...t.map((e) => e.x)),
		y: Math.max(...t.map((e) => e.y))
	};
	return {
		pivot: {
			x: (n.x + r.x) / 2,
			y: (n.y + r.y) / 2
		},
		min: n,
		max: r
	};
}
function su(e) {
	return ou([e]);
}
function cu(e) {
	let { transform: t, size: n } = e, r = t.originX ?? 0, i = t.originY ?? 0, a = {
		x: r * n.width,
		y: i * n.height
	};
	return [
		{
			x: 0,
			y: 0
		},
		{
			x: n.width,
			y: 0
		},
		{
			x: 0,
			y: n.height
		},
		{
			x: n.width,
			y: n.height
		}
	].map((e) => {
		let n = nu({
			x: (e.x - a.x) * t.scaleX,
			y: (e.y - a.y) * t.scaleY
		}, t.rotation);
		return {
			x: t.x + n.x,
			y: t.y + n.y
		};
	});
}
function lu(e, t) {
	return e.map((e) => ({
		nodeId: e.id,
		transform: {
			x: e.transform.x + t.x,
			y: e.transform.y + t.y
		}
	}));
}
function uu(e, t, n) {
	return e.map((e) => {
		let r = nu({
			x: e.transform.x - t.x,
			y: e.transform.y - t.y
		}, n);
		return {
			nodeId: e.id,
			transform: {
				x: t.x + r.x,
				y: t.y + r.y,
				rotation: e.transform.rotation + n
			}
		};
	});
}
//#endregion
//#region src/core/store.ts
Wc();
var du = 100, fu = .05;
function pu(e, t) {
	let n = e.pages.findIndex((e) => e.id === t);
	if (n === -1) throw Error(`Unknown pageId: ${t}`);
	return n;
}
function mu(e, t) {
	if (!t) return e.children;
	let n = Xc(e.children, t);
	if (!n || n.node.type !== "group") throw Error(`Unknown group parentId: ${t}`);
	return n.node.children;
}
function hu(e, t, n) {
	switch (n) {
		case "up": return Math.min(t + 1, e.length);
		case "down": return Math.max(t - 1, 0);
		case "top": return e.length;
		case "bottom": return 0;
	}
}
function gu(e, t) {
	return {
		...e,
		id: t,
		children: e.children.map(el)
	};
}
function _u(e, t) {
	switch (t.type) {
		case "AddPage": {
			let n = t.index ?? e.pages.length;
			e.pages.splice(n, 0, t.page);
			break;
		}
		case "RemovePage": {
			if (e.pages.length <= 1) break;
			let n = e.pages.findIndex((e) => e.id === t.pageId);
			n !== -1 && e.pages.splice(n, 1);
			break;
		}
		case "ReorderPage": {
			let n = e.pages.findIndex((e) => e.id === t.pageId);
			if (n === -1) break;
			let r = t.to === "up" ? Math.min(n + 1, e.pages.length - 1) : Math.max(n - 1, 0), [i] = e.pages.splice(n, 1);
			e.pages.splice(r, 0, i);
			break;
		}
		case "DuplicatePage": {
			let n = e.pages.findIndex((e) => e.id === t.pageId);
			n !== -1 && e.pages.splice(n + 1, 0, gu(e.pages[n], t.newPageId));
			break;
		}
	}
}
function vu(e, t) {
	if (Jc(t)) {
		_u(e, t);
		return;
	}
	let n = e.pages[pu(e, t.pageId)];
	switch (t.type) {
		case "AddNode": {
			let e = mu(n, t.parentId), r = t.index ?? e.length;
			e.splice(r, 0, t.node);
			break;
		}
		case "RemoveNode": {
			let e = Qc(n, t.nodeId);
			e.parent.splice(e.index, 1);
			break;
		}
		case "UpdateProps": {
			let e = Qc(n, t.nodeId);
			Object.assign(e.node, t.patch);
			break;
		}
		case "UpdateTransform": {
			let e = Qc(n, t.nodeId);
			Object.assign(e.node.transform, t.patch);
			break;
		}
		case "Reorder": {
			let e = Qc(n, t.nodeId), [r] = e.parent.splice(e.index, 1), i = hu(e.parent, e.index, t.to);
			e.parent.splice(i, 0, r);
			break;
		}
		case "GroupNodes": {
			let e = t.nodeIds.map((e) => Qc(n, e)), r = e[0].parent;
			if (!e.every((e) => e.parent === r)) break;
			let i = ou(e.map((e) => e.node)), a = {
				x: i.pivot.x,
				y: i.pivot.y,
				scaleX: 1,
				scaleY: 1,
				rotation: 0,
				originX: .5,
				originY: .5
			}, o = {
				width: i.max.x - i.min.x,
				height: i.max.y - i.min.y
			}, s = [...e].sort((e, t) => e.index - t.index), c = s.map((e) => ({
				...e.node,
				transform: Ql(a, o, e.node.transform, e.node.size)
			})), l = s[s.length - 1].index, u = s.map((e) => e.index).sort((e, t) => t - e);
			for (let e of u) r.splice(e, 1);
			let d = l - u.filter((e) => e < l).length, f = {
				id: t.groupId,
				type: "group",
				transform: a,
				size: o,
				opacity: 1,
				visible: !0,
				locked: !1,
				children: c
			};
			r.splice(d, 0, f);
			break;
		}
		case "UngroupNode": {
			let e = Qc(n, t.groupId);
			if (e.node.type !== "group") break;
			let r = e.node, i = r.children.map((e) => ({
				...e,
				transform: Zl(r.transform, r.size, e.transform, e.size)
			}));
			e.parent.splice(e.index, 1, ...i);
			break;
		}
	}
}
function yu(e, t) {
	let n = [...e, t];
	return n.length > du ? n.slice(n.length - du) : n;
}
function bu(e) {
	return Math.min(8, Math.max(fu, e));
}
function xu(e) {
	return Y()((t, n) => ({
		document: e,
		lastCommand: null,
		dispatch: (e) => {
			let [r, i, a] = Kc(n().document, (t) => {
				vu(t, e);
			});
			t((t) => {
				let n = new Set(t.selectedNodeIds);
				e.type === "RemoveNode" && n.delete(e.nodeId), e.type === "UngroupNode" && n.delete(e.groupId);
				let o = r.pages.some((e) => e.id === t.activePageId) ? t.activePageId : r.pages[0].id;
				return t.activeGestureId ? {
					document: r,
					lastCommand: e,
					selectedNodeIds: n,
					activePageId: o
				} : {
					document: r,
					lastCommand: e,
					selectedNodeIds: n,
					activePageId: o,
					past: yu(t.past, {
						patches: i,
						inversePatches: a
					}),
					future: [],
					lastHistoryAction: "push"
				};
			});
		},
		addAssetRef: (e, n) => t((t) => ({ document: {
			...t.document,
			assets: {
				...t.document.assets,
				[e]: n
			}
		} })),
		past: [],
		future: [],
		lastHistoryAction: null,
		undo: () => t((e) => {
			if (e.past.length === 0) return {};
			let t = e.past[e.past.length - 1];
			return {
				document: qc(e.document, t.inversePatches),
				lastCommand: null,
				past: e.past.slice(0, -1),
				future: [...e.future, t],
				lastHistoryAction: "undo"
			};
		}),
		redo: () => t((e) => {
			if (e.future.length === 0) return {};
			let t = e.future[e.future.length - 1];
			return {
				document: qc(e.document, t.patches),
				lastCommand: null,
				past: [...e.past, t],
				future: e.future.slice(0, -1),
				lastHistoryAction: "redo"
			};
		}),
		activeGestureId: null,
		gestureStartDocument: null,
		beginGesture: (e) => t((t) => t.activeGestureId ? {} : {
			activeGestureId: e,
			gestureStartDocument: t.document
		}),
		endGesture: () => t((e) => {
			if (!e.activeGestureId || !e.gestureStartDocument) return {};
			if (e.gestureStartDocument === e.document) return {
				activeGestureId: null,
				gestureStartDocument: null
			};
			let t = e.gestureStartDocument, n = e.document, [, r, i] = Kc(t, () => n);
			return {
				activeGestureId: null,
				gestureStartDocument: null,
				past: yu(e.past, {
					patches: r,
					inversePatches: i
				}),
				future: [],
				lastHistoryAction: "push"
			};
		}),
		selectedNodeIds: /* @__PURE__ */ new Set(),
		activePageId: e.pages[0]?.id ?? "",
		dragState: null,
		camera: {
			zoom: 1,
			panX: 0,
			panY: 0
		},
		viewScale: null,
		marqueeRect: null,
		activeGuides: [],
		grid: {
			enabled: !1,
			size: 20,
			snap: !1
		},
		setMarqueeRect: (e) => t({ marqueeRect: e }),
		setActiveGuides: (e) => t({ activeGuides: e }),
		setGrid: (e) => t((t) => ({ grid: {
			...t.grid,
			...e
		} })),
		select: (e, n = "replace") => t((t) => {
			if (e === null) return { selectedNodeIds: /* @__PURE__ */ new Set() };
			let r = new Set(t.selectedNodeIds);
			return n === "toggle" ? r.has(e) ? r.delete(e) : r.add(e) : (r.clear(), r.add(e)), { selectedNodeIds: r };
		}),
		setActivePage: (e) => t({ activePageId: e }),
		setDragState: (e) => t({ dragState: e }),
		setCamera: (e) => t((t) => t.viewScale == null ? { camera: {
			...t.camera,
			...e,
			...e.zoom === void 0 ? {} : { zoom: bu(e.zoom) }
		} } : {}),
		setViewScale: (e) => t(e == null ? { viewScale: null } : {
			viewScale: e,
			camera: {
				zoom: e,
				panX: 0,
				panY: 0
			}
		})
	}));
}
function Su(e) {
	return e.document.pages.find((t) => t.id === e.activePageId);
}
function Cu(e, t) {
	if (e === t) return !0;
	if (e.size !== t.size) return !1;
	for (let n of e) if (!t.has(n)) return !1;
	return !0;
}
//#endregion
//#region src/ui/EditorContext.tsx
var wu = t(null), Tu = wu.Provider;
function Eu() {
	let e = i(wu);
	if (!e) throw Error("useEditorStoreApi must be used within <Editor>");
	return e;
}
function $(e) {
	return Eu()(e);
}
var Du = t({
	app: null,
	pageContainer: null,
	canvas: null
}), Ou = Du.Provider;
function ku() {
	return i(Du);
}
//#endregion
//#region src/ui/EditorUIContext.tsx
var Au = t(null);
function ju({ children: e, devMenu: t = null, onExport: n = null, onNodeDoubleClick: r = null }) {
	let [i, a] = c(null), [o, s] = c("select");
	return /* @__PURE__ */ T(Au.Provider, {
		value: {
			drawer: i,
			setDrawer: a,
			toggleDrawer: (e) => {
				a((t) => t === e ? null : e);
			},
			activeTool: o,
			setActiveTool: s,
			devMenu: t,
			onExport: n ?? null,
			onNodeDoubleClick: r
		},
		children: e
	});
}
function Mu() {
	let e = i(Au);
	if (!e) throw Error("useEditorUI must be used within EditorUIProvider");
	return e;
}
//#endregion
//#region src/render/fillToColor.ts
function Nu(e) {
	switch (e.type) {
		case "solid": return e.color;
		case "linear-gradient":
		case "radial-gradient": return e.stops[0]?.color ?? "#000000";
		case "texture": return "#808080";
	}
}
function Pu(e) {
	switch (e.type) {
		case "solid": return e.color;
		case "linear-gradient": {
			let t = Math.cos(e.angle) * .5, n = Math.sin(e.angle) * .5, r = new m({
				type: "linear",
				start: {
					x: .5 - t,
					y: .5 - n
				},
				end: {
					x: .5 + t,
					y: .5 + n
				},
				textureSpace: "local"
			});
			for (let t of e.stops) r.addColorStop(t.offset, t.color);
			return r;
		}
		case "radial-gradient": {
			let t = new m({
				type: "radial",
				center: {
					x: .5,
					y: .5
				},
				innerRadius: 0,
				outerCenter: {
					x: .5,
					y: .5
				},
				outerRadius: .5,
				textureSpace: "local"
			});
			for (let n of e.stops) t.addColorStop(n.offset, n.color);
			return t;
		}
		case "texture": return "#808080";
	}
}
function Fu(e) {
	let t = Pu(e);
	return t instanceof m ? { fill: t } : { color: t };
}
//#endregion
//#region src/render/renderers/shapeRenderer.ts
var Iu = {
	inside: 1,
	center: .5,
	outside: 0
};
function Lu(e, t, [n, r]) {
	let { width: i, height: a } = t.size;
	switch (t.shape) {
		case "rect":
			t.cornerRadius ? e.roundRect(n, r, i, a, t.cornerRadius) : e.rect(n, r, i, a);
			break;
		case "ellipse":
			e.ellipse(n + i / 2, r + a / 2, i / 2, a / 2);
			break;
		case "polygon":
			e.poly((t.points ?? [
				0,
				0,
				i,
				0,
				i / 2,
				a
			]).map((e, t) => e + (t % 2 == 0 ? n : r)), !0);
			break;
		case "star":
			e.star(n + i / 2, r + a / 2, 5, Math.min(i, a) / 2);
			break;
		case "line":
			e.moveTo(n, r).lineTo(n + i, r + a);
			break;
		case "path":
			e.rect(n, r, i, a);
			break;
	}
}
function Ru(e, t) {
	e.clear();
	let n = t.stroke?.layers ?? (t.stroke ? [{
		width: t.stroke.width,
		fill: t.stroke.fill
	}] : []);
	for (let r of n) Lu(e, t, r.offset ?? [0, 0]), e.stroke({
		width: r.width,
		alignment: t.stroke ? Iu[t.stroke.align] : .5,
		...Fu(r.fill)
	});
	Lu(e, t, [0, 0]), t.shape === "line" ? n.length === 0 && e.stroke({
		width: 1,
		...Fu(t.fill)
	}) : e.fill(Pu(t.fill));
}
var zu = {
	create(e) {
		let t = new v();
		return this.update(t, e), t;
	},
	update(e, t) {
		Ru(e, t), Yl(e, t);
	}
};
//#endregion
//#region src/services/assetResolver.ts
function Bu(e, t) {
	let n = t.assets[e];
	if (!n) throw Error(`Unknown assetId: ${e}`);
	return n.type === "image-url" ? n.src : n.dataUri;
}
//#endregion
//#region src/render/pendingLoads.ts
var Vu = /* @__PURE__ */ new Set(), Hu = /* @__PURE__ */ new Set();
function Uu(e) {
	Vu.add(e), e.finally(() => {
		Vu.delete(e);
		for (let e of [...Hu]) e();
	}).catch(() => {});
}
function Wu(e) {
	return Hu.add(e), () => {
		Hu.delete(e);
	};
}
async function Gu() {
	for (; Vu.size > 0;) await Promise.allSettled([...Vu]);
}
//#endregion
//#region src/render/renderers/imageRenderer.ts
function Ku(e) {
	return e.children[0];
}
var qu = /* @__PURE__ */ new WeakMap(), Ju = /* @__PURE__ */ new WeakMap(), Yu = /^data:image\/svg\+xml|\.svg([?#]|$)/i, Xu = 2, Zu = 4096, Qu = /* @__PURE__ */ new Map();
async function $u(e) {
	let t = new Image();
	if (t.crossOrigin = "anonymous", t.src = e, await t.decode(), !Yu.test(e)) return x.from(t);
	let n = t.naturalWidth || 512, r = t.naturalHeight || 512, i = Math.min(Xu, Zu / Math.max(n, r)), a = document.createElement("canvas");
	return a.width = Math.round(n * i), a.height = Math.round(r * i), a.getContext("2d").drawImage(t, 0, 0, a.width, a.height), x.from(a);
}
function ed(e) {
	let t = Qu.get(e);
	return t || (t = $u(e), Qu.set(e, t), t.catch(() => Qu.delete(e))), t;
}
function td(e, t, n) {
	qu.set(e, t.assetId), Uu(ed(Bu(t.assetId, n)).then((n) => {
		e.destroyed || (e.texture = new x({ source: n.source }), nd(e, t), id(e, t));
	}).catch((e) => {
		console.error(`Failed to load image asset ${t.assetId}:`, e);
	}));
}
function nd(e, t) {
	if (e.texture === x.EMPTY) return;
	let { source: n } = e.texture, { frame: r } = e.texture, i = t.crop;
	r.x = i ? i.x * n.width : 0, r.y = i ? i.y * n.height : 0, r.width = i ? i.width * n.width : n.width, r.height = i ? i.height * n.height : n.height, e.texture.updateUvs(), e.onViewUpdate();
}
function rd(e) {
	if (!e) return [];
	let t = [], { brightness: n, contrast: r, saturation: i, blur: a } = e;
	if (n !== void 0 || r !== void 0 || i !== void 0) {
		let e = {};
		n !== void 0 && (e.brightness = n), r !== void 0 && (e.contrast = r), i !== void 0 && (e.saturation = i), t.push(new ll(e));
	}
	return a !== void 0 && t.push(new u({ strength: a })), t;
}
function id(e, t) {
	if (e.texture === x.EMPTY) return;
	let { width: n, height: r } = e.texture.source;
	if (n === 0 || r === 0) return;
	e.scale.set(t.size.width / n, t.size.height / r);
	let i = t.crop;
	e.position.set((i?.x ?? 0) * t.size.width, (i?.y ?? 0) * t.size.height);
}
function ad(e, t) {
	for (let n of e.pages) {
		let e = Zc(n, t);
		if (e) return e.node;
	}
}
function od(e, t) {
	if (e.type === "shape") {
		let n = new v();
		return Lu(n, e, [0, 0]), n.fill("#ffffff"), n.width = t.width, n.height = t.height, n;
	}
}
function sd(e, t, n) {
	let r = Ju.get(e);
	if (r && (e.removeChild(r), r.destroy(), Ju.delete(e), e.mask = null), !t.mask) return;
	let i = ad(n, t.mask.ref), a = i && od(i, t.size);
	a && (e.addChild(a), e.mask = a, Ju.set(e, a));
}
var cd = {
	create(e, t) {
		let n = new f(), r = new ee(x.EMPTY);
		return n.addChild(r), td(r, e, t), this.update(n, e, t), n;
	},
	update(e, t, n) {
		let r = Ku(e);
		qu.get(r) !== t.assetId && td(r, t, n), nd(r, t), sd(e, t, n), Yl(e, t), e.filters = [...Jl(t.effects), ...rd(t.filters)], id(r, t);
	}
};
//#endregion
//#region src/render/renderers/svgRenderer.ts
async function ld(e) {
	return (await fetch(e)).text();
}
function ud(e, t) {
	if (!t || Object.keys(t).length === 0) return e;
	let n = new DOMParser().parseFromString(e, "image/svg+xml");
	for (let [e, r] of Object.entries(t)) r.type === "solid" && n.getElementById(e)?.setAttribute("fill", r.color);
	return new XMLSerializer().serializeToString(n);
}
var dd = /* @__PURE__ */ new Set([
	"path",
	"rect",
	"circle",
	"ellipse",
	"polygon",
	"polyline",
	"line"
]);
function fd(e) {
	let t = new DOMParser().parseFromString(e, "image/svg+xml"), n = [];
	for (let e of t.querySelectorAll("[id]")) dd.has(e.tagName.toLowerCase()) && e.id && n.push(e.id);
	return n;
}
function pd(e, t) {
	let n = e.getLocalBounds();
	if (n.width === 0 || n.height === 0) return;
	e.scale.set(t.size.width / n.width * t.transform.scaleX, t.size.height / n.height * t.transform.scaleY);
	let r = t.transform.originX ?? 0, i = t.transform.originY ?? 0;
	e.pivot.set(n.x + r * n.width, n.y + i * n.height);
}
var md = {
	create(e, t) {
		let n = new v();
		return this.update(n, e, t), n;
	},
	update(e, t, n) {
		Uu(ld(Bu(t.assetId, n)).then((n) => {
			e.destroyed || (e.clear(), e.svg(ud(n, t.overrides)), Yl(e, t), pd(e, t));
		})), Yl(e, t);
	}
}, hd = {
	create(e) {
		let t = new f();
		return this.update(t, e), t;
	},
	update(e, t) {
		Yl(e, t);
	}
}, gd = /* @__PURE__ */ ce((/* @__PURE__ */ D(((e, t) => {
	var n = (() => {
		var e = Object.defineProperty, t = Object.getOwnPropertyDescriptor, n = Object.getOwnPropertyNames, r = Object.prototype.hasOwnProperty, i = (t, n) => {
			for (var r in n) e(t, r, {
				get: n[r],
				enumerable: !0
			});
		}, a = (i, a, o, s) => {
			if (a && typeof a == "object" || typeof a == "function") for (let c of n(a)) !r.call(i, c) && c !== o && e(i, c, {
				get: () => a[c],
				enumerable: !(s = t(a, c)) || s.enumerable
			});
			return i;
		}, o = (t) => a(e({}, "__esModule", { value: !0 }), t), s = {};
		i(s, {
			BoundingBox: () => se,
			Font: () => Yc,
			Glyph: () => $t,
			Path: () => ue,
			_parse: () => R,
			load: () => bl,
			loadSync: () => xl,
			parse: () => yl
		});
		var c = 0, l = -3;
		function u() {
			this.table = /* @__PURE__ */ new Uint16Array(16), this.trans = /* @__PURE__ */ new Uint16Array(288);
		}
		function d(e, t) {
			this.source = e, this.sourceIndex = 0, this.tag = 0, this.bitcount = 0, this.dest = t, this.destLen = 0, this.ltree = new u(), this.dtree = new u();
		}
		var f = new u(), p = new u(), m = /* @__PURE__ */ new Uint8Array(30), h = /* @__PURE__ */ new Uint16Array(30), g = /* @__PURE__ */ new Uint8Array(30), _ = /* @__PURE__ */ new Uint16Array(30), v = new Uint8Array([
			16,
			17,
			18,
			0,
			8,
			7,
			9,
			6,
			10,
			5,
			11,
			4,
			12,
			3,
			13,
			2,
			14,
			1,
			15
		]), y = new u(), b = /* @__PURE__ */ new Uint8Array(320);
		function ee(e, t, n, r) {
			var i, a;
			for (i = 0; i < n; ++i) e[i] = 0;
			for (i = 0; i < 30 - n; ++i) e[i + n] = i / n | 0;
			for (a = r, i = 0; i < 30; ++i) t[i] = a, a += 1 << e[i];
		}
		function x(e, t) {
			var n;
			for (n = 0; n < 7; ++n) e.table[n] = 0;
			for (e.table[7] = 24, e.table[8] = 152, e.table[9] = 112, n = 0; n < 24; ++n) e.trans[n] = 256 + n;
			for (n = 0; n < 144; ++n) e.trans[24 + n] = n;
			for (n = 0; n < 8; ++n) e.trans[168 + n] = 280 + n;
			for (n = 0; n < 112; ++n) e.trans[176 + n] = 144 + n;
			for (n = 0; n < 5; ++n) t.table[n] = 0;
			for (t.table[5] = 32, n = 0; n < 32; ++n) t.trans[n] = n;
		}
		var S = /* @__PURE__ */ new Uint16Array(16);
		function C(e, t, n, r) {
			var i, a;
			for (i = 0; i < 16; ++i) e.table[i] = 0;
			for (i = 0; i < r; ++i) e.table[t[n + i]]++;
			for (e.table[0] = 0, a = 0, i = 0; i < 16; ++i) S[i] = a, a += e.table[i];
			for (i = 0; i < r; ++i) t[n + i] && (e.trans[S[t[n + i]]++] = i);
		}
		function te(e) {
			e.bitcount-- || (e.tag = e.source[e.sourceIndex++], e.bitcount = 7);
			var t = e.tag & 1;
			return e.tag >>>= 1, t;
		}
		function w(e, t, n) {
			if (!t) return n;
			for (; e.bitcount < 24;) e.tag |= e.source[e.sourceIndex++] << e.bitcount, e.bitcount += 8;
			var r = e.tag & 65535 >>> 16 - t;
			return e.tag >>>= t, e.bitcount -= t, r + n;
		}
		function T(e, t) {
			for (; e.bitcount < 24;) e.tag |= e.source[e.sourceIndex++] << e.bitcount, e.bitcount += 8;
			var n = 0, r = 0, i = 0, a = e.tag;
			do
				r = 2 * r + (a & 1), a >>>= 1, ++i, n += t.table[i], r -= t.table[i];
			while (r >= 0);
			return e.tag = a, e.bitcount -= i, t.trans[n + r];
		}
		function E(e, t, n) {
			var r = w(e, 5, 257), i = w(e, 5, 1), a = w(e, 4, 4), o, s, c;
			for (o = 0; o < 19; ++o) b[o] = 0;
			for (o = 0; o < a; ++o) {
				var l = w(e, 3, 0);
				b[v[o]] = l;
			}
			for (C(y, b, 0, 19), s = 0; s < r + i;) {
				var u = T(e, y);
				switch (u) {
					case 16:
						var d = b[s - 1];
						for (c = w(e, 2, 3); c; --c) b[s++] = d;
						break;
					case 17:
						for (c = w(e, 3, 3); c; --c) b[s++] = 0;
						break;
					case 18:
						for (c = w(e, 7, 11); c; --c) b[s++] = 0;
						break;
					default:
						b[s++] = u;
						break;
				}
			}
			C(t, b, 0, r), C(n, b, r, i);
		}
		function ne(e, t, n) {
			for (;;) {
				var r = T(e, t);
				if (r === 256) return c;
				if (r < 256) e.dest[e.destLen++] = r;
				else {
					var i, a, o, s;
					for (r -= 257, i = w(e, m[r], h[r]), a = T(e, n), o = e.destLen - w(e, g[a], _[a]), s = o; s < o + i; ++s) e.dest[e.destLen++] = e.dest[s];
				}
			}
		}
		function re(e) {
			for (var t, n, r; e.bitcount > 8;) e.sourceIndex--, e.bitcount -= 8;
			if (t = e.source[e.sourceIndex + 1], t = 256 * t + e.source[e.sourceIndex], n = e.source[e.sourceIndex + 3], n = 256 * n + e.source[e.sourceIndex + 2], t !== (~n & 65535)) return l;
			for (e.sourceIndex += 4, r = t; r; --r) e.dest[e.destLen++] = e.source[e.sourceIndex++];
			return e.bitcount = 0, c;
		}
		function ie(e, t) {
			var n = new d(e, t), r, i, a;
			do {
				switch (r = te(n), i = w(n, 2, 0), i) {
					case 0:
						a = re(n);
						break;
					case 1:
						a = ne(n, f, p);
						break;
					case 2:
						E(n, n.ltree, n.dtree), a = ne(n, n.ltree, n.dtree);
						break;
					default: a = l;
				}
				if (a !== c) throw Error("Data error");
			} while (!r);
			return n.destLen < n.dest.length ? typeof n.dest.slice == "function" ? n.dest.slice(0, n.destLen) : n.dest.subarray(0, n.destLen) : n.dest;
		}
		x(f, p), ee(m, h, 4, 3), ee(g, _, 2, 1), m[28] = 0, h[28] = 258;
		function ae(e, t, n, r, i) {
			return (1 - i) ** 3 * e + 3 * (1 - i) ** 2 * i * t + 3 * (1 - i) * i ** 2 * n + i ** 3 * r;
		}
		function oe() {
			this.x1 = NaN, this.y1 = NaN, this.x2 = NaN, this.y2 = NaN;
		}
		oe.prototype.isEmpty = function() {
			return isNaN(this.x1) || isNaN(this.y1) || isNaN(this.x2) || isNaN(this.y2);
		}, oe.prototype.addPoint = function(e, t) {
			typeof e == "number" && ((isNaN(this.x1) || isNaN(this.x2)) && (this.x1 = e, this.x2 = e), e < this.x1 && (this.x1 = e), e > this.x2 && (this.x2 = e)), typeof t == "number" && ((isNaN(this.y1) || isNaN(this.y2)) && (this.y1 = t, this.y2 = t), t < this.y1 && (this.y1 = t), t > this.y2 && (this.y2 = t));
		}, oe.prototype.addX = function(e) {
			this.addPoint(e, null);
		}, oe.prototype.addY = function(e) {
			this.addPoint(null, e);
		}, oe.prototype.addBezier = function(e, t, n, r, i, a, o, s) {
			let c = [e, t], l = [n, r], u = [i, a], d = [o, s];
			this.addPoint(e, t), this.addPoint(o, s);
			for (let e = 0; e <= 1; e++) {
				let t = 6 * c[e] - 12 * l[e] + 6 * u[e], n = -3 * c[e] + 9 * l[e] - 9 * u[e] + 3 * d[e], r = 3 * l[e] - 3 * c[e];
				if (n === 0) {
					if (t === 0) continue;
					let n = -r / t;
					0 < n && n < 1 && (e === 0 && this.addX(ae(c[e], l[e], u[e], d[e], n)), e === 1 && this.addY(ae(c[e], l[e], u[e], d[e], n)));
					continue;
				}
				let i = t ** 2 - 4 * r * n;
				if (i < 0) continue;
				let a = (-t + Math.sqrt(i)) / (2 * n);
				0 < a && a < 1 && (e === 0 && this.addX(ae(c[e], l[e], u[e], d[e], a)), e === 1 && this.addY(ae(c[e], l[e], u[e], d[e], a)));
				let o = (-t - Math.sqrt(i)) / (2 * n);
				0 < o && o < 1 && (e === 0 && this.addX(ae(c[e], l[e], u[e], d[e], o)), e === 1 && this.addY(ae(c[e], l[e], u[e], d[e], o)));
			}
		}, oe.prototype.addQuad = function(e, t, n, r, i, a) {
			let o = e + 2 / 3 * (n - e), s = t + 2 / 3 * (r - t), c = o + 1 / 3 * (i - e), l = s + 1 / 3 * (a - t);
			this.addBezier(e, t, o, s, c, l, i, a);
		};
		var se = oe;
		function D() {
			this.commands = [], this.fill = "black", this.stroke = null, this.strokeWidth = 1;
		}
		var O = {};
		function ce(e, t) {
			let n = Math.floor(e), r = e - n;
			if (O[t] || (O[t] = {}), O[t][r] !== void 0) return n + O[t][r];
			let i = +(Math.round(r + "e+" + t) + "e-" + t);
			return O[t][r] = i, n + i;
		}
		function le(e) {
			let t = [[]], n = 0, r = 0;
			for (let i = 0; i < e.length; i += 1) {
				let a = t[t.length - 1], o = e[i], s = a[0], c = a[1], l = a[a.length - 1], u = e[i + 1];
				a.push(o), o.type === "M" ? (n = o.x, r = o.y) : o.type === "L" && (!u || u.type === "Z") ? Math.abs(o.x - n) > 1 || Math.abs(o.y - r) > 1 || a.pop() : o.type === "L" && l && l.x === o.x && l.y === o.y ? a.pop() : o.type === "Z" && (s && c && l && s.type === "M" && c.type === "L" && l.type === "L" && l.x === s.x && l.y === s.y && (a.shift(), a[0].type = "M"), i + 1 < e.length && t.push([]));
			}
			return e = [].concat.apply([], t), e;
		}
		function k(e) {
			return Object.assign({}, {
				decimalPlaces: 2,
				optimize: !0,
				flipY: !0,
				flipYBase: void 0,
				scale: 1,
				x: 0,
				y: 0
			}, e);
		}
		function A(e) {
			return parseInt(e) === e && (e = {
				decimalPlaces: e,
				flipY: !1
			}), Object.assign({}, {
				decimalPlaces: 2,
				optimize: !0,
				flipY: !0,
				flipYBase: void 0
			}, e);
		}
		D.prototype.fromSVG = function(e, t = {}) {
			typeof SVGPathElement < "u" && e instanceof SVGPathElement && (e = e.getAttribute("d")), t = k(t), this.commands = [];
			let n = "MmLlQqCcZzHhVv", r = {}, i = [""], a = !1;
			function o(e) {
				return e.filter((e) => e.length).map((e) => {
					let n = parseFloat(e);
					return (t.decimalPlaces || t.decimalPlaces === 0) && (n = ce(n, t.decimalPlaces)), n;
				});
			}
			function s(e) {
				if (!this.commands.length) return e;
				let t = this.commands[this.commands.length - 1];
				for (let n = 0; n < e.length; n++) e[n] += t[n & 1 ? "y" : "x"];
				return e;
			}
			function c() {
				if (r.type === void 0) return;
				let e = r.type.toUpperCase(), t = e !== "Z" && r.type.toUpperCase() !== r.type, n = o(i);
				if (i = [""], !n.length && e !== "Z") return;
				t && e !== "H" && e !== "V" && (n = s.apply(this, [n]));
				let a = this.commands.length && this.commands[this.commands.length - 1].x || 0, c = this.commands.length && this.commands[this.commands.length - 1].y || 0;
				switch (e) {
					case "M":
						this.moveTo(...n);
						break;
					case "L":
						this.lineTo(...n);
						break;
					case "V":
						for (let e = 0; e < n.length; e++) {
							let r = 0;
							t && (r = this.commands.length && this.commands[this.commands.length - 1].y || 0), this.lineTo(a, n[e] + r);
						}
						break;
					case "H":
						for (let e = 0; e < n.length; e++) {
							let r = 0;
							t && (r = this.commands.length && this.commands[this.commands.length - 1].x || 0), this.lineTo(n[e] + r, c);
						}
						break;
					case "C":
						this.bezierCurveTo(...n);
						break;
					case "Q":
						this.quadraticCurveTo(...n);
						break;
					case "Z":
						(this.commands.length < 1 || this.commands[this.commands.length - 1].type !== "Z") && this.close();
						break;
				}
				if (this.commands.length) for (let e in this.commands[this.commands.length - 1]) this.commands[this.commands.length - 1][e] === void 0 && (this.commands[this.commands.length - 1][e] = 0);
			}
			for (let t = 0; t < e.length; t++) {
				let o = e.charAt(t), s = i[i.length - 1];
				if ("0123456789".indexOf(o) > -1) i[i.length - 1] += o;
				else if ("-+".indexOf(o) > -1) if (!r.type && !this.commands.length && (r.type = "L"), o === "-") !r.type || s.indexOf("-") > 0 ? a = !0 : s.length ? i.push("-") : i[i.length - 1] = o;
				else if (!r.type || s.length > 0) a = !0;
				else continue;
				else if (n.indexOf(o) > -1) r.type ? (c.apply(this), r = { type: o }) : r.type = o;
				else if ("SsTtAa".indexOf(o) > -1) throw Error("Unsupported path command: " + o + ". Currently supported commands are " + n.split("").join(", ") + ".");
				else " ,	\n\r\f\v".indexOf(o) > -1 ? i.push("") : o === "." ? !r.type || s.indexOf(o) > -1 ? a = !0 : i[i.length - 1] += o : a = !0;
				if (a) throw Error("Unexpected character: " + o + " at offset " + t);
			}
			c.apply(this), t.optimize && (this.commands = le(this.commands));
			let l = t.flipY, u = t.flipYBase;
			if (l === !0 && t.flipYBase === void 0) {
				let e = this.getBoundingBox();
				u = e.y1 + e.y2;
			}
			for (let e in this.commands) {
				let n = this.commands[e];
				for (let r in n) [
					"x",
					"x1",
					"x2"
				].includes(r) ? this.commands[e][r] = t.x + n[r] * t.scale : [
					"y",
					"y1",
					"y2"
				].includes(r) && (this.commands[e][r] = t.y + (l ? u - n[r] : n[r]) * t.scale);
			}
			return this;
		}, D.fromSVG = function(e, t) {
			return new D().fromSVG(e, t);
		}, D.prototype.moveTo = function(e, t) {
			this.commands.push({
				type: "M",
				x: e,
				y: t
			});
		}, D.prototype.lineTo = function(e, t) {
			this.commands.push({
				type: "L",
				x: e,
				y: t
			});
		}, D.prototype.curveTo = D.prototype.bezierCurveTo = function(e, t, n, r, i, a) {
			this.commands.push({
				type: "C",
				x1: e,
				y1: t,
				x2: n,
				y2: r,
				x: i,
				y: a
			});
		}, D.prototype.quadTo = D.prototype.quadraticCurveTo = function(e, t, n, r) {
			this.commands.push({
				type: "Q",
				x1: e,
				y1: t,
				x: n,
				y: r
			});
		}, D.prototype.close = D.prototype.closePath = function() {
			this.commands.push({ type: "Z" });
		}, D.prototype.extend = function(e) {
			if (e.commands) e = e.commands;
			else if (e instanceof se) {
				let t = e;
				this.moveTo(t.x1, t.y1), this.lineTo(t.x2, t.y1), this.lineTo(t.x2, t.y2), this.lineTo(t.x1, t.y2), this.close();
				return;
			}
			Array.prototype.push.apply(this.commands, e);
		}, D.prototype.getBoundingBox = function() {
			let e = new se(), t = 0, n = 0, r = 0, i = 0;
			for (let a = 0; a < this.commands.length; a++) {
				let o = this.commands[a];
				switch (o.type) {
					case "M":
						e.addPoint(o.x, o.y), t = r = o.x, n = i = o.y;
						break;
					case "L":
						e.addPoint(o.x, o.y), r = o.x, i = o.y;
						break;
					case "Q":
						e.addQuad(r, i, o.x1, o.y1, o.x, o.y), r = o.x, i = o.y;
						break;
					case "C":
						e.addBezier(r, i, o.x1, o.y1, o.x2, o.y2, o.x, o.y), r = o.x, i = o.y;
						break;
					case "Z":
						r = t, i = n;
						break;
					default: throw Error("Unexpected path command " + o.type);
				}
			}
			return e.isEmpty() && e.addPoint(0, 0), e;
		}, D.prototype.draw = function(e) {
			let t = this._layers;
			if (t && t.length) {
				for (let n = 0; n < t.length; n++) this.draw.call(t[n], e);
				return;
			}
			let n = this._image;
			if (n) {
				e.drawImage(n.image, n.x, n.y, n.width, n.height);
				return;
			}
			e.beginPath();
			for (let t = 0; t < this.commands.length; t += 1) {
				let n = this.commands[t];
				n.type === "M" ? e.moveTo(n.x, n.y) : n.type === "L" ? e.lineTo(n.x, n.y) : n.type === "C" ? e.bezierCurveTo(n.x1, n.y1, n.x2, n.y2, n.x, n.y) : n.type === "Q" ? e.quadraticCurveTo(n.x1, n.y1, n.x, n.y) : n.type === "Z" && this.stroke && this.strokeWidth && e.closePath();
			}
			this.fill && (e.fillStyle = this.fill, e.fill()), this.stroke && (e.strokeStyle = this.stroke, e.lineWidth = this.strokeWidth, e.stroke());
		}, D.prototype.toPathData = function(e) {
			e = A(e);
			function t(t) {
				let n = ce(t, e.decimalPlaces);
				return Math.round(t) === n ? "" + n : n.toFixed(e.decimalPlaces);
			}
			function n() {
				let e = "";
				for (let n = 0; n < arguments.length; n += 1) {
					let r = arguments[n];
					r >= 0 && n > 0 && (e += " "), e += t(r);
				}
				return e;
			}
			let r = this.commands;
			e.optimize && (r = JSON.parse(JSON.stringify(this.commands)), r = le(r));
			let i = e.flipY, a = e.flipYBase;
			if (i === !0 && a === void 0) {
				let e = new D();
				e.extend(r);
				let t = e.getBoundingBox();
				a = t.y1 + t.y2;
			}
			let o = "";
			for (let e = 0; e < r.length; e += 1) {
				let t = r[e];
				t.type === "M" ? o += "M" + n(t.x, i ? a - t.y : t.y) : t.type === "L" ? o += "L" + n(t.x, i ? a - t.y : t.y) : t.type === "C" ? o += "C" + n(t.x1, i ? a - t.y1 : t.y1, t.x2, i ? a - t.y2 : t.y2, t.x, i ? a - t.y : t.y) : t.type === "Q" ? o += "Q" + n(t.x1, i ? a - t.y1 : t.y1, t.x, i ? a - t.y : t.y) : t.type === "Z" && (o += "Z");
			}
			return o;
		}, D.prototype.toSVG = function(e, t) {
			this._layers && this._layers.length && console.warn("toSVG() does not support colr font layers yet"), this._image && console.warn("toSVG() does not support SVG glyphs yet"), t ||= this.toPathData(e);
			let n = "<path d=\"";
			return n += t, n += "\"", this.fill !== void 0 && this.fill !== "black" && (this.fill === null ? n += " fill=\"none\"" : n += " fill=\"" + this.fill + "\""), this.stroke && (n += " stroke=\"" + this.stroke + "\" stroke-width=\"" + this.strokeWidth + "\""), n += "/>", n;
		}, D.prototype.toDOMElement = function(e, t) {
			this._layers && this._layers.length && console.warn("toDOMElement() does not support colr font layers yet"), t ||= this.toPathData(e);
			let n = document.createElementNS("http://www.w3.org/2000/svg", "path");
			return n.setAttribute("d", t), this.fill !== void 0 && this.fill !== "black" && (this.fill === null ? n.setAttribute("fill", "none") : n.setAttribute("fill", this.fill)), this.stroke && (n.setAttribute("stroke", this.stroke), n.setAttribute("stroke-width", this.strokeWidth)), n;
		};
		var ue = D;
		function de(e) {
			throw Error(e);
		}
		function fe(e, t) {
			e || de(t);
		}
		var j = {
			fail: de,
			argument: fe,
			assert: fe
		}, pe = 32768, me = 2147483648, he = -32768, ge = 32767.00001525879, _e = {}, M = {}, N = {};
		function ve(e) {
			return function() {
				return e;
			};
		}
		M.BYTE = function(e) {
			return j.argument(e >= 0 && e <= 255, "Byte value should be between 0 and 255."), [e];
		}, N.BYTE = ve(1), M.CHAR = function(e) {
			return [e.charCodeAt(0)];
		}, N.CHAR = ve(1), M.CHARARRAY = function(e) {
			e ?? (e = "", console.warn("CHARARRAY with undefined or null value encountered and treated as an empty string. This is probably caused by a missing glyph name."));
			let t = [];
			for (let n = 0; n < e.length; n += 1) t[n] = e.charCodeAt(n);
			return t;
		}, N.CHARARRAY = function(e) {
			return e === void 0 ? 0 : e.length;
		}, M.USHORT = function(e) {
			return [e >> 8 & 255, e & 255];
		}, N.USHORT = ve(2), M.SHORT = function(e) {
			return e >= pe && (e = -(2 * pe - e)), [e >> 8 & 255, e & 255];
		}, N.SHORT = ve(2), M.UINT24 = function(e) {
			return [
				e >> 16 & 255,
				e >> 8 & 255,
				e & 255
			];
		}, N.UINT24 = ve(3), M.ULONG = function(e) {
			return [
				e >> 24 & 255,
				e >> 16 & 255,
				e >> 8 & 255,
				e & 255
			];
		}, N.ULONG = ve(4), M.LONG = function(e) {
			return e >= me && (e = -(2 * me - e)), [
				e >> 24 & 255,
				e >> 16 & 255,
				e >> 8 & 255,
				e & 255
			];
		}, N.LONG = ve(4), M.FLOAT = function(e) {
			if (e > ge || e < he) throw Error(`Value ${e} is outside the range of representable values in 16.16 format`);
			let t = Math.round(e * 65536) << 0;
			return M.ULONG(t);
		}, N.FLOAT = N.ULONG, M.FIXED = M.ULONG, N.FIXED = N.ULONG, M.FWORD = M.SHORT, N.FWORD = N.SHORT, M.UFWORD = M.USHORT, N.UFWORD = N.USHORT, M.F2DOT14 = function(e) {
			return M.USHORT(e * 16384);
		}, N.F2DOT14 = N.USHORT, M.LONGDATETIME = function(e) {
			return [
				0,
				0,
				0,
				0,
				e >> 24 & 255,
				e >> 16 & 255,
				e >> 8 & 255,
				e & 255
			];
		}, N.LONGDATETIME = ve(8), M.TAG = function(e) {
			return j.argument(e.length === 4, "Tag should be exactly 4 ASCII characters."), [
				e.charCodeAt(0),
				e.charCodeAt(1),
				e.charCodeAt(2),
				e.charCodeAt(3)
			];
		}, N.TAG = ve(4), M.Card8 = M.BYTE, N.Card8 = N.BYTE, M.Card16 = M.USHORT, N.Card16 = N.USHORT, M.OffSize = M.BYTE, N.OffSize = N.BYTE, M.SID = M.USHORT, N.SID = N.USHORT, M.NUMBER = function(e) {
			return e >= -107 && e <= 107 ? [e + 139] : e >= 108 && e <= 1131 ? (e -= 108, [(e >> 8) + 247, e & 255]) : e >= -1131 && e <= -108 ? (e = -e - 108, [(e >> 8) + 251, e & 255]) : e >= -32768 && e <= 32767 ? M.NUMBER16(e) : M.NUMBER32(e);
		}, N.NUMBER = function(e) {
			return M.NUMBER(e).length;
		}, M.NUMBER16 = function(e) {
			return [
				28,
				e >> 8 & 255,
				e & 255
			];
		}, N.NUMBER16 = ve(3), M.NUMBER32 = function(e) {
			return [
				29,
				e >> 24 & 255,
				e >> 16 & 255,
				e >> 8 & 255,
				e & 255
			];
		}, N.NUMBER32 = ve(5), M.REAL = function(e) {
			let t = e.toString(), n = /\.(\d*?)(?:9{5,20}|0{5,20})\d{0,2}(?:e(.+)|$)/.exec(t);
			if (n) {
				let r = parseFloat("1e" + ((n[2] ? +n[2] : 0) + n[1].length));
				t = (Math.round(e * r) / r).toString();
			}
			let r = "";
			for (let e = 0, n = t.length; e < n; e += 1) {
				let n = t[e];
				n === "e" ? r += t[++e] === "-" ? "c" : "b" : n === "." ? r += "a" : n === "-" ? r += "e" : r += n;
			}
			r += r.length & 1 ? "f" : "ff";
			let i = [30];
			for (let e = 0, t = r.length; e < t; e += 2) i.push(parseInt(r.substr(e, 2), 16));
			return i;
		}, N.REAL = function(e) {
			return M.REAL(e).length;
		}, M.NAME = M.CHARARRAY, N.NAME = N.CHARARRAY, M.STRING = M.CHARARRAY, N.STRING = N.CHARARRAY, _e.UTF8 = function(e, t, n) {
			let r = [], i = n;
			for (let n = 0; n < i; n++, t += 1) r[n] = e.getUint8(t);
			return String.fromCharCode.apply(null, r);
		}, _e.UTF16 = function(e, t, n) {
			let r = [], i = n / 2;
			for (let n = 0; n < i; n++, t += 2) r[n] = e.getUint16(t);
			return String.fromCharCode.apply(null, r);
		}, M.UTF16 = function(e) {
			let t = [];
			for (let n = 0; n < e.length; n += 1) {
				let r = e.charCodeAt(n);
				t[t.length] = r >> 8 & 255, t[t.length] = r & 255;
			}
			return t;
		}, N.UTF16 = function(e) {
			return e.length * 2;
		};
		var ye = {
			"x-mac-croatian": "ÄÅÇÉÑÖÜáàâäãåçéèêëíìîïñóòôöõúùûü†°¢£§•¶ß®Š™´¨≠ŽØ∞±≤≥∆µ∂∑∏š∫ªºΩžø¿¡¬√ƒ≈Ć«Č…\xA0ÀÃÕŒœĐ—“”‘’÷◊©⁄€‹›Æ»–·‚„‰ÂćÁčÈÍÎÏÌÓÔđÒÚÛÙıˆ˜¯πË˚¸Êæˇ",
			"x-mac-cyrillic": "АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ†°Ґ£§•¶І®©™Ђђ≠Ѓѓ∞±≤≥іµґЈЄєЇїЉљЊњјЅ¬√ƒ≈∆«»…\xA0ЋћЌќѕ–—“”‘’÷„ЎўЏџ№Ёёяабвгдежзийклмнопрстуфхцчшщъыьэю",
			"x-mac-gaelic": "ÄÅÇÉÑÖÜáàâäãåçéèêëíìîïñóòôöõúùûü†°¢£§•¶ß®©™´¨≠ÆØḂ±≤≥ḃĊċḊḋḞḟĠġṀæøṁṖṗɼƒſṠ«»…\xA0ÀÃÕŒœ–—“”‘’ṡẛÿŸṪ€‹›Ŷŷṫ·Ỳỳ⁊ÂÊÁËÈÍÎÏÌÓÔ♣ÒÚÛÙıÝýŴŵẄẅẀẁẂẃ",
			"x-mac-greek": "Ä¹²É³ÖÜ΅àâä΄¨çéèêë£™îï•½‰ôö¦€ùûü†ΓΔΘΛΞΠß®©ΣΪ§≠°·Α±≤≥¥ΒΕΖΗΙΚΜΦΫΨΩάΝ¬ΟΡ≈Τ«»…\xA0ΥΧΆΈœ–―“”‘’÷ΉΊΌΎέήίόΏύαβψδεφγηιξκλμνοπώρστθωςχυζϊϋΐΰ­",
			"x-mac-icelandic": "ÄÅÇÉÑÖÜáàâäãåçéèêëíìîïñóòôöõúùûüÝ°¢£§•¶ß®©™´¨≠ÆØ∞±≤≥¥µ∂∑∏π∫ªºΩæø¿¡¬√ƒ≈∆«»…\xA0ÀÃÕŒœ–—“”‘’÷◊ÿŸ⁄€ÐðÞþý·‚„‰ÂÊÁËÈÍÎÏÌÓÔÒÚÛÙıˆ˜¯˘˙˚¸˝˛ˇ",
			"x-mac-inuit": "ᐃᐄᐅᐆᐊᐋᐱᐲᐳᐴᐸᐹᑉᑎᑏᑐᑑᑕᑖᑦᑭᑮᑯᑰᑲᑳᒃᒋᒌᒍᒎᒐᒑ°ᒡᒥᒦ•¶ᒧ®©™ᒨᒪᒫᒻᓂᓃᓄᓅᓇᓈᓐᓯᓰᓱᓲᓴᓵᔅᓕᓖᓗᓘᓚᓛᓪᔨᔩᔪᔫᔭ…\xA0ᔮᔾᕕᕖᕗ–—“”‘’ᕘᕙᕚᕝᕆᕇᕈᕉᕋᕌᕐᕿᖀᖁᖂᖃᖄᖅᖏᖐᖑᖒᖓᖔᖕᙱᙲᙳᙴᙵᙶᖖᖠᖡᖢᖣᖤᖥᖦᕼŁł",
			"x-mac-ce": "ÄĀāÉĄÖÜáąČäčĆćéŹźĎíďĒēĖóėôöõúĚěü†°Ę£§•¶ß®©™ę¨≠ģĮįĪ≤≥īĶ∂∑łĻļĽľĹĺŅņŃ¬√ńŇ∆«»…\xA0ňŐÕőŌ–—“”‘’÷◊ōŔŕŘ‹›řŖŗŠ‚„šŚśÁŤťÍŽžŪÓÔūŮÚůŰűŲųÝýķŻŁżĢˇ",
			macintosh: "ÄÅÇÉÑÖÜáàâäãåçéèêëíìîïñóòôöõúùûü†°¢£§•¶ß®©™´¨≠ÆØ∞±≤≥¥µ∂∑∏π∫ªºΩæø¿¡¬√ƒ≈∆«»…\xA0ÀÃÕŒœ–—“”‘’÷◊ÿŸ⁄€‹›ﬁﬂ‡·‚„‰ÂÊÁËÈÍÎÏÌÓÔÒÚÛÙıˆ˜¯˘˙˚¸˝˛ˇ",
			"x-mac-romanian": "ÄÅÇÉÑÖÜáàâäãåçéèêëíìîïñóòôöõúùûü†°¢£§•¶ß®©™´¨≠ĂȘ∞±≤≥¥µ∂∑∏π∫ªºΩăș¿¡¬√ƒ≈∆«»…\xA0ÀÃÕŒœ–—“”‘’÷◊ÿŸ⁄€‹›Țț‡·‚„‰ÂÊÁËÈÍÎÏÌÓÔÒÚÛÙıˆ˜¯˘˙˚¸˝˛ˇ",
			"x-mac-turkish": "ÄÅÇÉÑÖÜáàâäãåçéèêëíìîïñóòôöõúùûü†°¢£§•¶ß®©™´¨≠ÆØ∞±≤≥¥µ∂∑∏π∫ªºΩæø¿¡¬√ƒ≈∆«»…\xA0ÀÃÕŒœ–—“”‘’÷◊ÿŸĞğİıŞş‡·‚„‰ÂÊÁËÈÍÎÏÌÓÔÒÚÛÙˆ˜¯˘˙˚¸˝˛ˇ"
		};
		_e.MACSTRING = function(e, t, n, r) {
			let i = ye[r];
			if (i === void 0) return;
			let a = "";
			for (let r = 0; r < n; r++) {
				let n = e.getUint8(t + r);
				n <= 127 ? a += String.fromCharCode(n) : a += i[n & 127];
			}
			return a;
		};
		var be = typeof WeakMap == "function" && /* @__PURE__ */ new WeakMap(), xe, Se = function(e) {
			if (!xe) {
				xe = {};
				for (let e in ye) xe[e] = new String(e);
			}
			let t = xe[e];
			if (t === void 0) return;
			if (be) {
				let e = be.get(t);
				if (e !== void 0) return e;
			}
			let n = ye[e];
			if (n === void 0) return;
			let r = {};
			for (let e = 0; e < n.length; e++) r[n.charCodeAt(e)] = e + 128;
			return be && be.set(t, r), r;
		};
		M.MACSTRING = function(e, t) {
			let n = Se(t);
			if (n === void 0) return;
			let r = [];
			for (let t = 0; t < e.length; t++) {
				let i = e.charCodeAt(t);
				if (i >= 128 && (i = n[i], i === void 0)) return;
				r[t] = i;
			}
			return r;
		}, N.MACSTRING = function(e, t) {
			let n = M.MACSTRING(e, t);
			return n === void 0 ? 0 : n.length;
		};
		function Ce(e) {
			return e >= -128 && e <= 127;
		}
		function we(e, t, n) {
			let r = 0, i = e.length;
			for (; t < i && r < 64 && e[t] === 0;) ++t, ++r;
			return n.push(128 | r - 1), t;
		}
		function Te(e, t, n) {
			let r = 0, i = e.length, a = t;
			for (; a < i && r < 64;) {
				let t = e[a];
				if (!Ce(t) || t === 0 && a + 1 < i && e[a + 1] === 0) break;
				++a, ++r;
			}
			n.push(r - 1);
			for (let r = t; r < a; ++r) n.push(e[r] + 256 & 255);
			return a;
		}
		function Ee(e, t, n) {
			let r = 0, i = e.length, a = t;
			for (; a < i && r < 64;) {
				let t = e[a];
				if (t === 0 || Ce(t) && a + 1 < i && Ce(e[a + 1])) break;
				++a, ++r;
			}
			n.push(64 | r - 1);
			for (let r = t; r < a; ++r) {
				let t = e[r];
				n.push(t + 65536 >> 8 & 255, t + 256 & 255);
			}
			return a;
		}
		M.VARDELTAS = function(e) {
			let t = 0, n = [];
			for (; t < e.length;) {
				let r = e[t];
				t = r === 0 ? we(e, t, n) : r >= -128 && r <= 127 ? Te(e, t, n) : Ee(e, t, n);
			}
			return n;
		}, M.INDEX = function(e) {
			let t = 1, n = [t], r = [];
			for (let i = 0; i < e.length; i += 1) {
				let a = M.OBJECT(e[i]);
				Array.prototype.push.apply(r, a), t += a.length, n.push(t);
			}
			if (r.length === 0) return [0, 0];
			let i = [], a = 1 + Math.floor(Math.log(t) / Math.log(2)) / 8 | 0, o = [
				void 0,
				M.BYTE,
				M.USHORT,
				M.UINT24,
				M.ULONG
			][a];
			for (let e = 0; e < n.length; e += 1) {
				let t = o(n[e]);
				Array.prototype.push.apply(i, t);
			}
			return Array.prototype.concat(M.Card16(e.length), M.OffSize(a), i, r);
		}, N.INDEX = function(e) {
			return M.INDEX(e).length;
		}, M.DICT = function(e) {
			let t = [], n = Object.keys(e), r = n.length;
			for (let i = 0; i < r; i += 1) {
				let r = parseInt(n[i], 0), a = e[r], o = M.OPERAND(a.value, a.type), s = M.OPERATOR(r);
				for (let e = 0; e < o.length; e++) t.push(o[e]);
				for (let e = 0; e < s.length; e++) t.push(s[e]);
			}
			return t;
		}, N.DICT = function(e) {
			return M.DICT(e).length;
		}, M.OPERATOR = function(e) {
			return e < 1200 ? [e] : [12, e - 1200];
		}, M.OPERAND = function(e, t) {
			let n = [];
			if (Array.isArray(t)) for (let r = 0; r < t.length; r += 1) {
				j.argument(e.length === t.length, "Not enough arguments given for type" + t);
				let i = M.OPERAND(e[r], t[r]);
				for (let e = 0; e < i.length; e++) n.push(i[e]);
			}
			else if (t === "SID") {
				let t = M.NUMBER(e);
				for (let e = 0; e < t.length; e++) n.push(t[e]);
			} else if (t === "offset") {
				let t = M.NUMBER32(e);
				for (let e = 0; e < t.length; e++) n.push(t[e]);
			} else if (t === "number") {
				let t = M.NUMBER(e);
				for (let e = 0; e < t.length; e++) n.push(t[e]);
			} else if (t === "real") {
				let t = M.REAL(e);
				for (let e = 0; e < t.length; e++) n.push(t[e]);
			} else throw Error("Unknown operand type " + t);
			return n;
		}, M.OP = M.BYTE, N.OP = N.BYTE;
		var De = typeof WeakMap == "function" && /* @__PURE__ */ new WeakMap();
		M.CHARSTRING = function(e) {
			if (De) {
				let t = De.get(e);
				if (t !== void 0) return t;
			}
			let t = [], n = e.length;
			for (let r = 0; r < n; r += 1) {
				let n = e[r], i = M[n.type](n.value);
				for (let e = 0; e < i.length; e++) t.push(i[e]);
			}
			return De && De.set(e, t), t;
		}, N.CHARSTRING = function(e) {
			return M.CHARSTRING(e).length;
		}, M.OBJECT = function(e) {
			let t = M[e.type];
			return j.argument(t !== void 0, "No encoding function for type " + e.type), t(e.value);
		}, N.OBJECT = function(e) {
			let t = N[e.type];
			return j.argument(t !== void 0, "No sizeOf function for type " + e.type), t(e.value);
		}, M.TABLE = function(e) {
			let t = [], n = (e.fields || []).length, r = [], i = [];
			for (let a = 0; a < n; a += 1) {
				let n = e.fields[a], o = M[n.type];
				j.argument(o !== void 0, "No encoding function for field type " + n.type + " (" + n.name + ")");
				let s = e[n.name];
				s === void 0 && (s = n.value);
				let c = o(s);
				if (n.type === "TABLE") s.fields !== null && (i.push(t.length), r.push(c)), t.push(0, 0);
				else for (let e = 0; e < c.length; e++) t.push(c[e]);
			}
			for (let n = 0; n < r.length; n += 1) {
				let a = i[n], o = t.length;
				j.argument(o < 65536, "Table " + e.tableName + " too big."), t[a] = o >> 8, t[a + 1] = o & 255;
				for (let e = 0; e < r[n].length; e++) t.push(r[n][e]);
			}
			return t;
		}, N.TABLE = function(e) {
			let t = 0, n = (e.fields || []).length;
			for (let r = 0; r < n; r += 1) {
				let n = e.fields[r], i = N[n.type];
				j.argument(i !== void 0, "No sizeOf function for field type " + n.type + " (" + n.name + ")");
				let a = e[n.name];
				a === void 0 && (a = n.value), t += i(a), n.type === "TABLE" && (t += 2);
			}
			return t;
		}, M.RECORD = M.TABLE, N.RECORD = N.TABLE, M.LITERAL = function(e) {
			return e;
		}, N.LITERAL = function(e) {
			return e.length;
		};
		function P(e, t, n) {
			if (t && t.length) for (let e = 0; e < t.length; e += 1) {
				let n = t[e];
				this[n.name] = n.value;
			}
			if (this.tableName = e, this.fields = t, n) {
				let e = Object.keys(n);
				for (let t = 0; t < e.length; t += 1) {
					let r = e[t], i = n[r];
					this[r] !== void 0 && (this[r] = i);
				}
			}
		}
		P.prototype.encode = function() {
			return M.TABLE(this);
		}, P.prototype.sizeOf = function() {
			return N.TABLE(this);
		};
		function Oe(e, t, n) {
			n === void 0 && (n = t.length);
			let r = Array(t.length + 1);
			r[0] = {
				name: e + "Count",
				type: "USHORT",
				value: n
			};
			for (let n = 0; n < t.length; n++) r[n + 1] = {
				name: e + n,
				type: "USHORT",
				value: t[n]
			};
			return r;
		}
		function F(e, t, n) {
			let r = t.length, i = Array(r + 1);
			i[0] = {
				name: e + "Count",
				type: "USHORT",
				value: r
			};
			for (let a = 0; a < r; a++) i[a + 1] = {
				name: e + a,
				type: "TABLE",
				value: n(t[a], a)
			};
			return i;
		}
		function ke(e, t, n) {
			let r = t.length, i = [];
			i[0] = {
				name: e + "Count",
				type: "USHORT",
				value: r
			};
			for (let e = 0; e < r; e++) i = i.concat(n(t[e], e));
			return i;
		}
		function Ae(e) {
			e.format === 1 ? P.call(this, "coverageTable", [{
				name: "coverageFormat",
				type: "USHORT",
				value: 1
			}].concat(Oe("glyph", e.glyphs))) : e.format === 2 ? P.call(this, "coverageTable", [{
				name: "coverageFormat",
				type: "USHORT",
				value: 2
			}].concat(ke("rangeRecord", e.ranges, function(e, t) {
				return [
					{
						name: "startGlyphID" + t,
						type: "USHORT",
						value: e.start
					},
					{
						name: "endGlyphID" + t,
						type: "USHORT",
						value: e.end
					},
					{
						name: "startCoverageIndex" + t,
						type: "USHORT",
						value: e.index
					}
				];
			}))) : j.assert(!1, "Coverage format must be 1 or 2.");
		}
		Ae.prototype = Object.create(P.prototype), Ae.prototype.constructor = Ae;
		function je(e) {
			P.call(this, "scriptListTable", ke("scriptRecord", e, function(e, t) {
				let n = e.script, r = n.defaultLangSys;
				return j.assert(!!r, "Unable to write GSUB: script " + e.tag + " has no default language system."), [{
					name: "scriptTag" + t,
					type: "TAG",
					value: e.tag
				}, {
					name: "script" + t,
					type: "TABLE",
					value: new P("scriptTable", [{
						name: "defaultLangSys",
						type: "TABLE",
						value: new P("defaultLangSys", [{
							name: "lookupOrder",
							type: "USHORT",
							value: 0
						}, {
							name: "reqFeatureIndex",
							type: "USHORT",
							value: r.reqFeatureIndex
						}].concat(Oe("featureIndex", r.featureIndexes)))
					}].concat(ke("langSys", n.langSysRecords, function(e, t) {
						let n = e.langSys;
						return [{
							name: "langSysTag" + t,
							type: "TAG",
							value: e.tag
						}, {
							name: "langSys" + t,
							type: "TABLE",
							value: new P("langSys", [{
								name: "lookupOrder",
								type: "USHORT",
								value: 0
							}, {
								name: "reqFeatureIndex",
								type: "USHORT",
								value: n.reqFeatureIndex
							}].concat(Oe("featureIndex", n.featureIndexes)))
						}];
					})))
				}];
			}));
		}
		je.prototype = Object.create(P.prototype), je.prototype.constructor = je;
		function Me(e) {
			P.call(this, "featureListTable", ke("featureRecord", e, function(e, t) {
				let n = e.feature;
				return [{
					name: "featureTag" + t,
					type: "TAG",
					value: e.tag
				}, {
					name: "feature" + t,
					type: "TABLE",
					value: new P("featureTable", [{
						name: "featureParams",
						type: "USHORT",
						value: n.featureParams
					}].concat(Oe("lookupListIndex", n.lookupListIndexes)))
				}];
			}));
		}
		Me.prototype = Object.create(P.prototype), Me.prototype.constructor = Me;
		function Ne(e, t) {
			P.call(this, "lookupListTable", F("lookup", e, function(e) {
				let n = t[e.lookupType];
				return j.assert(!!n, "Unable to write GSUB lookup type " + e.lookupType + " tables."), new P("lookupTable", [{
					name: "lookupType",
					type: "USHORT",
					value: e.lookupType
				}, {
					name: "lookupFlag",
					type: "USHORT",
					value: e.lookupFlag
				}].concat(F("subtable", e.subtables, n)));
			}));
		}
		Ne.prototype = Object.create(P.prototype), Ne.prototype.constructor = Ne;
		function Pe(e) {
			e.format === 1 ? P.call(this, "classDefTable", [{
				name: "classFormat",
				type: "USHORT",
				value: 1
			}, {
				name: "startGlyphID",
				type: "USHORT",
				value: e.startGlyph
			}].concat(Oe("glyph", e.classes))) : e.format === 2 ? P.call(this, "classDefTable", [{
				name: "classFormat",
				type: "USHORT",
				value: 2
			}].concat(ke("rangeRecord", e.ranges, function(e, t) {
				return [
					{
						name: "startGlyphID" + t,
						type: "USHORT",
						value: e.start
					},
					{
						name: "endGlyphID" + t,
						type: "USHORT",
						value: e.end
					},
					{
						name: "class" + t,
						type: "USHORT",
						value: e.classId
					}
				];
			}))) : j.assert(!1, "Class format must be 1 or 2.");
		}
		Pe.prototype = Object.create(P.prototype), Pe.prototype.constructor = Pe;
		var I = {
			Table: P,
			Record: P,
			Coverage: Ae,
			ClassDef: Pe,
			ScriptList: je,
			FeatureList: Me,
			LookupList: Ne,
			ushortList: Oe,
			tableList: F,
			recordList: ke
		};
		function Fe(e, t) {
			return e.getUint8(t);
		}
		function Ie(e, t) {
			return e.getUint16(t, !1);
		}
		function Le(e, t) {
			return e.getInt16(t, !1);
		}
		function Re(e, t) {
			return (e.getUint16(t) << 8) + e.getUint8(t + 2);
		}
		function ze(e, t) {
			return e.getUint32(t, !1);
		}
		function Be(e, t) {
			return e.getInt32(t, !1);
		}
		function Ve(e, t) {
			return e.getInt16(t, !1) + e.getUint16(t + 2, !1) / 65535;
		}
		function He(e, t) {
			let n = "";
			for (let r = t; r < t + 4; r += 1) n += String.fromCharCode(e.getInt8(r));
			return n;
		}
		function Ue(e, t, n) {
			let r = 0;
			for (let i = 0; i < n; i += 1) r <<= 8, r += e.getUint8(t + i);
			return r;
		}
		function We(e, t, n) {
			let r = [];
			for (let i = t; i < n; i += 1) r.push(e.getUint8(i));
			return r;
		}
		function Ge(e) {
			let t = "";
			for (let n = 0; n < e.length; n += 1) t += String.fromCharCode(e[n]);
			return t;
		}
		var Ke = {
			byte: 1,
			uShort: 2,
			f2dot14: 2,
			short: 2,
			uInt24: 3,
			uLong: 4,
			fixed: 4,
			longDateTime: 8,
			tag: 4
		}, qe = {
			LONG_WORDS: 32768,
			WORD_DELTA_COUNT_MASK: 32767,
			SHARED_POINT_NUMBERS: 32768,
			COUNT_MASK: 4095,
			EMBEDDED_PEAK_TUPLE: 32768,
			INTERMEDIATE_REGION: 16384,
			PRIVATE_POINT_NUMBERS: 8192,
			TUPLE_INDEX_MASK: 4095,
			POINTS_ARE_WORDS: 128,
			POINT_RUN_COUNT_MASK: 127,
			DELTAS_ARE_ZERO: 128,
			DELTAS_ARE_WORDS: 64,
			DELTA_RUN_COUNT_MASK: 63,
			INNER_INDEX_BIT_COUNT_MASK: 15,
			MAP_ENTRY_SIZE_MASK: 48
		};
		function L(e, t) {
			this.data = e, this.offset = t, this.relativeOffset = 0;
		}
		L.prototype.parseByte = function() {
			let e = this.data.getUint8(this.offset + this.relativeOffset);
			return this.relativeOffset += 1, e;
		}, L.prototype.parseChar = function() {
			let e = this.data.getInt8(this.offset + this.relativeOffset);
			return this.relativeOffset += 1, e;
		}, L.prototype.parseCard8 = L.prototype.parseByte, L.prototype.parseUShort = function() {
			let e = this.data.getUint16(this.offset + this.relativeOffset);
			return this.relativeOffset += 2, e;
		}, L.prototype.parseCard16 = L.prototype.parseUShort, L.prototype.parseSID = L.prototype.parseUShort, L.prototype.parseOffset16 = L.prototype.parseUShort, L.prototype.parseShort = function() {
			let e = this.data.getInt16(this.offset + this.relativeOffset);
			return this.relativeOffset += 2, e;
		}, L.prototype.parseF2Dot14 = function() {
			let e = this.data.getInt16(this.offset + this.relativeOffset) / 16384;
			return this.relativeOffset += 2, e;
		}, L.prototype.parseUInt24 = function() {
			let e = Re(this.data, this.offset + this.relativeOffset);
			return this.relativeOffset += 3, e;
		}, L.prototype.parseULong = function() {
			let e = ze(this.data, this.offset + this.relativeOffset);
			return this.relativeOffset += 4, e;
		}, L.prototype.parseLong = function() {
			let e = Be(this.data, this.offset + this.relativeOffset);
			return this.relativeOffset += 4, e;
		}, L.prototype.parseOffset32 = L.prototype.parseULong, L.prototype.parseFixed = function() {
			let e = Ve(this.data, this.offset + this.relativeOffset);
			return this.relativeOffset += 4, e;
		}, L.prototype.parseString = function(e) {
			let t = this.data, n = this.offset + this.relativeOffset, r = "";
			this.relativeOffset += e;
			for (let i = 0; i < e; i++) r += String.fromCharCode(t.getUint8(n + i));
			return r;
		}, L.prototype.parseTag = function() {
			return this.parseString(4);
		}, L.prototype.parseLongDateTime = function() {
			let e = ze(this.data, this.offset + this.relativeOffset + 4);
			return e -= 2082844800, this.relativeOffset += 8, e;
		}, L.prototype.parseVersion = function(e) {
			let t = Ie(this.data, this.offset + this.relativeOffset), n = Ie(this.data, this.offset + this.relativeOffset + 2);
			return this.relativeOffset += 4, e === void 0 && (e = 4096), t + n / e / 10;
		}, L.prototype.skip = function(e, t) {
			t === void 0 && (t = 1), this.relativeOffset += Ke[e] * t;
		}, L.prototype.parseULongList = function(e) {
			e === void 0 && (e = this.parseULong());
			let t = Array(e), n = this.data, r = this.offset + this.relativeOffset;
			for (let i = 0; i < e; i++) t[i] = n.getUint32(r), r += 4;
			return this.relativeOffset += e * 4, t;
		}, L.prototype.parseOffset16List = L.prototype.parseUShortList = function(e) {
			e === void 0 && (e = this.parseUShort());
			let t = Array(e), n = this.data, r = this.offset + this.relativeOffset;
			for (let i = 0; i < e; i++) t[i] = n.getUint16(r), r += 2;
			return this.relativeOffset += e * 2, t;
		}, L.prototype.parseShortList = function(e) {
			let t = Array(e), n = this.data, r = this.offset + this.relativeOffset;
			for (let i = 0; i < e; i++) t[i] = n.getInt16(r), r += 2;
			return this.relativeOffset += e * 2, t;
		}, L.prototype.parseByteList = function(e) {
			let t = Array(e), n = this.data, r = this.offset + this.relativeOffset;
			for (let i = 0; i < e; i++) t[i] = n.getUint8(r++);
			return this.relativeOffset += e, t;
		}, L.prototype.parseList = function(e, t) {
			t || (t = e, e = this.parseUShort());
			let n = Array(e);
			for (let r = 0; r < e; r++) n[r] = t.call(this);
			return n;
		}, L.prototype.parseList32 = function(e, t) {
			t || (t = e, e = this.parseULong());
			let n = Array(e);
			for (let r = 0; r < e; r++) n[r] = t.call(this);
			return n;
		}, L.prototype.parseRecordList = function(e, t) {
			t || (t = e, e = this.parseUShort());
			let n = Array(e), r = Object.keys(t);
			for (let i = 0; i < e; i++) {
				let e = {};
				for (let n = 0; n < r.length; n++) {
					let i = r[n];
					e[i] = t[i].call(this);
				}
				n[i] = e;
			}
			return n;
		}, L.prototype.parseRecordList32 = function(e, t) {
			t || (t = e, e = this.parseULong());
			let n = Array(e), r = Object.keys(t);
			for (let i = 0; i < e; i++) {
				let e = {};
				for (let n = 0; n < r.length; n++) {
					let i = r[n];
					e[i] = t[i].call(this);
				}
				n[i] = e;
			}
			return n;
		}, L.prototype.parseTupleRecords = function(e, t) {
			let n = [];
			for (let r = 0; r < e; r++) {
				let e = [];
				for (let n = 0; n < t; n++) e.push(this.parseF2Dot14());
				n.push(e);
			}
			return n;
		}, L.prototype.parseStruct = function(e) {
			if (typeof e == "function") return e.call(this);
			{
				let t = Object.keys(e), n = {};
				for (let r = 0; r < t.length; r++) {
					let i = t[r];
					n[i] = e[i].call(this);
				}
				return n;
			}
		}, L.prototype.parseValueRecord = function(e) {
			if (e === void 0 && (e = this.parseUShort()), e === 0) return;
			let t = {};
			return e & 1 && (t.xPlacement = this.parseShort()), e & 2 && (t.yPlacement = this.parseShort()), e & 4 && (t.xAdvance = this.parseShort()), e & 8 && (t.yAdvance = this.parseShort()), e & 16 && (t.xPlaDevice = void 0, this.parseShort()), e & 32 && (t.yPlaDevice = void 0, this.parseShort()), e & 64 && (t.xAdvDevice = void 0, this.parseShort()), e & 128 && (t.yAdvDevice = void 0, this.parseShort()), t;
		}, L.prototype.parseValueRecordList = function() {
			let e = this.parseUShort(), t = this.parseUShort(), n = Array(t);
			for (let r = 0; r < t; r++) n[r] = this.parseValueRecord(e);
			return n;
		}, L.prototype.parsePointer = function(e) {
			let t = this.parseOffset16();
			if (t > 0) return new L(this.data, this.offset + t).parseStruct(e);
		}, L.prototype.parsePointer32 = function(e) {
			let t = this.parseOffset32();
			if (t > 0) return new L(this.data, this.offset + t).parseStruct(e);
		}, L.prototype.parseListOfLists = function(e) {
			let t = this.parseOffset16List(), n = t.length, r = this.relativeOffset, i = Array(n);
			for (let r = 0; r < n; r++) {
				let n = t[r];
				if (n === 0) {
					i[r] = void 0;
					continue;
				}
				if (this.relativeOffset = n, e) {
					let t = this.parseOffset16List(), a = Array(t.length);
					for (let r = 0; r < t.length; r++) this.relativeOffset = n + t[r], a[r] = e.call(this);
					i[r] = a;
				} else i[r] = this.parseUShortList();
			}
			return this.relativeOffset = r, i;
		}, L.prototype.parseCoverage = function() {
			let e = this.offset + this.relativeOffset, t = this.parseUShort(), n = this.parseUShort();
			if (t === 1) return {
				format: 1,
				glyphs: this.parseUShortList(n)
			};
			if (t === 2) {
				let e = Array(n);
				for (let t = 0; t < n; t++) e[t] = {
					start: this.parseUShort(),
					end: this.parseUShort(),
					index: this.parseUShort()
				};
				return {
					format: 2,
					ranges: e
				};
			}
			throw Error("0x" + e.toString(16) + ": Coverage format must be 1 or 2.");
		}, L.prototype.parseClassDef = function() {
			let e = this.offset + this.relativeOffset, t = this.parseUShort();
			return t === 1 ? {
				format: 1,
				startGlyph: this.parseUShort(),
				classes: this.parseUShortList()
			} : t === 2 ? {
				format: 2,
				ranges: this.parseRecordList({
					start: L.uShort,
					end: L.uShort,
					classId: L.uShort
				})
			} : (console.warn(`0x${e.toString(16)}: This font file uses an invalid ClassDef format of ${t}. It might be corrupted and should be reacquired if it doesn't display as intended.`), { format: t });
		}, L.list = function(e, t) {
			return function() {
				return this.parseList(e, t);
			};
		}, L.list32 = function(e, t) {
			return function() {
				return this.parseList32(e, t);
			};
		}, L.recordList = function(e, t) {
			return function() {
				return this.parseRecordList(e, t);
			};
		}, L.recordList32 = function(e, t) {
			return function() {
				return this.parseRecordList32(e, t);
			};
		}, L.pointer = function(e) {
			return function() {
				return this.parsePointer(e);
			};
		}, L.pointer32 = function(e) {
			return function() {
				return this.parsePointer32(e);
			};
		}, L.tag = L.prototype.parseTag, L.byte = L.prototype.parseByte, L.uShort = L.offset16 = L.prototype.parseUShort, L.uShortList = L.prototype.parseUShortList, L.uInt24 = L.prototype.parseUInt24, L.uLong = L.offset32 = L.prototype.parseULong, L.uLongList = L.prototype.parseULongList, L.fixed = L.prototype.parseFixed, L.f2Dot14 = L.prototype.parseF2Dot14, L.struct = L.prototype.parseStruct, L.coverage = L.prototype.parseCoverage, L.classDef = L.prototype.parseClassDef;
		var Je = {
			reserved: L.uShort,
			reqFeatureIndex: L.uShort,
			featureIndexes: L.uShortList
		};
		L.prototype.parseScriptList = function() {
			return this.parsePointer(L.recordList({
				tag: L.tag,
				script: L.pointer({
					defaultLangSys: L.pointer(Je),
					langSysRecords: L.recordList({
						tag: L.tag,
						langSys: L.pointer(Je)
					})
				})
			})) || [];
		}, L.prototype.parseFeatureList = function() {
			return this.parsePointer(L.recordList({
				tag: L.tag,
				feature: L.pointer({
					featureParams: L.offset16,
					lookupListIndexes: L.uShortList
				})
			})) || [];
		}, L.prototype.parseLookupList = function(e) {
			return this.parsePointer(L.list(L.pointer(function() {
				let t = this.parseUShort();
				j.argument(1 <= t && t <= 9, "GPOS/GSUB lookup type " + t + " unknown.");
				let n = this.parseUShort(), r = n & 16;
				return {
					lookupType: t,
					lookupFlag: n,
					subtables: this.parseList(L.pointer(e[t])),
					markFilteringSet: r ? this.parseUShort() : void 0
				};
			}))) || [];
		}, L.prototype.parseFeatureVariationsList = function() {
			return this.parsePointer32(function() {
				let e = this.parseUShort(), t = this.parseUShort();
				return j.argument(e === 1 && t < 1, "GPOS/GSUB feature variations table unknown."), this.parseRecordList32({
					conditionSetOffset: L.offset32,
					featureTableSubstitutionOffset: L.offset32
				});
			}) || [];
		}, L.prototype.parseVariationStore = function() {
			let e = this.relativeOffset, t = this.parseUShort(), n = { itemVariationStore: this.parseItemVariationStore() };
			return this.relativeOffset = e + t + 2, n;
		}, L.prototype.parseItemVariationStore = function() {
			let e = this.relativeOffset, t = {
				format: this.parseUShort(),
				variationRegions: [],
				itemVariationSubtables: []
			}, n = this.parseOffset32(), r = this.parseUShort(), i = this.parseULongList(r);
			this.relativeOffset = e + n, t.variationRegions = this.parseVariationRegionList();
			for (let n = 0; n < r; n++) {
				let r = i[n];
				this.relativeOffset = e + r, t.itemVariationSubtables.push(this.parseItemVariationSubtable());
			}
			return t;
		}, L.prototype.parseVariationRegionList = function() {
			let e = this.parseUShort(), t = this.parseUShort();
			return this.parseRecordList(t, { regionAxes: L.recordList(e, {
				startCoord: L.f2Dot14,
				peakCoord: L.f2Dot14,
				endCoord: L.f2Dot14
			}) });
		}, L.prototype.parseItemVariationSubtable = function() {
			let e = this.parseUShort(), t = this.parseUShort(), n = this.parseUShortList(), r = n.length;
			return {
				regionIndexes: n,
				deltaSets: e && r ? this.parseDeltaSets(e, t, r) : []
			};
		}, L.prototype.parseDeltaSetIndexMap = function() {
			let e = this.parseByte(), t = this.parseByte(), n = [], r = 0;
			switch (e) {
				case 0:
					r = this.parseUShort();
					break;
				case 1:
					r = this.parseULong();
					break;
				default: console.error(`unsupported DeltaSetIndexMap format ${e}`);
			}
			if (!r) return {
				format: e,
				entryFormat: t
			};
			let i = (t & qe.INNER_INDEX_BIT_COUNT_MASK) + 1, a = ((t & qe.MAP_ENTRY_SIZE_MASK) >> 4) + 1;
			for (let e = 0; e < r; e++) {
				let e;
				if (a === 1) e = this.parseByte();
				else if (a === 2) e = this.parseUShort();
				else if (a === 3) e = this.parseUInt24();
				else if (a === 4) e = this.parseULong();
				else throw Error(`Invalid entry size of ${a}`);
				let t = e >> i, r = e & (1 << i) - 1;
				n.push({
					outerIndex: t,
					innerIndex: r
				});
			}
			return {
				format: e,
				entryFormat: t,
				map: n
			};
		}, L.prototype.parseDeltaSets = function(e, t, n) {
			let r = Array.from({ length: e }, () => []), i = t & qe.LONG_WORDS, a = t & qe.WORD_DELTA_COUNT_MASK;
			if (a > n) throw Error("wordCount must be less than or equal to regionIndexCount");
			let o = (i ? this.parseLong : this.parseShort).bind(this), s = (i ? this.parseShort : this.parseChar).bind(this);
			for (let t = 0; t < e; t++) for (let e = 0; e < n; e++) e < a ? r[t].push(o()) : r[t].push(s());
			return r;
		}, L.prototype.parseTupleVariationStoreList = function(e, t, n) {
			let r = this.parseUShort(), i = this.parseUShort() & 1, a = this.parseOffset32(), o = (i ? this.parseULong : this.parseUShort).bind(this), s = {}, c = o();
			i || (c *= 2);
			let l;
			for (let u = 0; u < r; u++) l = o(), i || (l *= 2), s[u] = l - c ? this.parseTupleVariationStore(a + c, e, t, n, u) : void 0, c = l;
			return s;
		}, L.prototype.parseTupleVariationStore = function(e, t, n, r, i) {
			let a = this.relativeOffset;
			this.relativeOffset = e, n === "cvar" && (this.relativeOffset += 4);
			let o = this.parseUShort(), s = !!(o & qe.SHARED_POINT_NUMBERS), c = o & qe.COUNT_MASK, l = this.parseOffset16(), u = [], d = [];
			for (let e = 0; e < c; e++) {
				let e = this.parseTupleVariationHeader(t, n);
				u.push(e);
			}
			this.relativeOffset !== e + l && (console.warn(`Unexpected offset after parsing tuple variation headers! Expected ${e + l}, actually ${this.relativeOffset}`), this.relativeOffset = e + l), s && (d = this.parsePackedPointNumbers());
			let f = this.relativeOffset;
			for (let e = 0; e < c; e++) {
				let t = u[e];
				t.privatePoints = [], this.relativeOffset = f, n === "cvar" && !t.peakTuple && console.warn("An embedded peak tuple is required in TupleVariationHeaders for the cvar table."), t.flags.privatePointNumbers && (t.privatePoints = this.parsePackedPointNumbers()), delete t.flags;
				let a = this.offset, o = this.relativeOffset, s = (e) => {
					let s, c, l = () => {
						let e = 0;
						if (n === "gvar") {
							if (e = t.privatePoints.length || d.length, !e) {
								let t = r.get(i);
								t.path, e = t.points.length, e += 4;
							}
						} else n === "cvar" && (e = r.length);
						this.offset = a, this.relativeOffset = o, s = this.parsePackedDeltas(e), n === "gvar" && (c = this.parsePackedDeltas(e));
					};
					return {
						configurable: !0,
						get: function() {
							return s === void 0 && l(), e === "deltasY" ? c : s;
						},
						set: function(t) {
							s === void 0 && l(), e === "deltasY" ? c = t : s = t;
						}
					};
				};
				Object.defineProperty(t, "deltas", s.call(this, "deltas")), n === "gvar" && Object.defineProperty(t, "deltasY", s.call(this, "deltasY")), f += t.variationDataSize, delete t.variationDataSize;
			}
			this.relativeOffset = a;
			let p = { headers: u };
			return p.sharedPoints = d, p;
		}, L.prototype.parseTupleVariationHeader = function(e, t) {
			let n = this.parseUShort(), r = this.parseUShort(), i = !!(r & qe.EMBEDDED_PEAK_TUPLE), a = !!(r & qe.INTERMEDIATE_REGION), o = !!(r & qe.PRIVATE_POINT_NUMBERS), s = i ? void 0 : r & qe.TUPLE_INDEX_MASK, c = {
				variationDataSize: n,
				peakTuple: i ? this.parseTupleRecords(1, e)[0] : void 0,
				intermediateStartTuple: a ? this.parseTupleRecords(1, e)[0] : void 0,
				intermediateEndTuple: a ? this.parseTupleRecords(1, e)[0] : void 0,
				flags: {
					embeddedPeakTuple: i,
					intermediateRegion: a,
					privatePointNumbers: o
				}
			};
			return t === "gvar" && (c.sharedTupleRecordsIndex = s), c;
		}, L.prototype.parsePackedPointNumbers = function() {
			let e = this.parseByte(), t = [], n = e;
			if (e >= 128) {
				let t = this.parseByte();
				n = (e & qe.POINT_RUN_COUNT_MASK) << 8 | t;
			}
			let r = 0;
			for (; t.length < n;) {
				let e = this.parseByte(), i = !!(e & qe.POINTS_ARE_WORDS), a = (e & qe.POINT_RUN_COUNT_MASK) + 1;
				for (let e = 0; e < a && t.length < n; e++) {
					let e;
					e = i ? this.parseUShort() : this.parseByte(), r += e, t.push(r);
				}
			}
			return t;
		}, L.prototype.parsePackedDeltas = function(e) {
			let t = [];
			for (; t.length < e;) {
				let n = this.parseByte(), r = !!(n & qe.DELTAS_ARE_ZERO), i = !!(n & qe.DELTAS_ARE_WORDS), a = (n & qe.DELTA_RUN_COUNT_MASK) + 1;
				for (let n = 0; n < a && t.length < e; n++) r ? t.push(0) : i ? t.push(this.parseShort()) : t.push(this.parseChar());
			}
			return t;
		};
		var R = {
			getByte: Fe,
			getCard8: Fe,
			getUShort: Ie,
			getCard16: Ie,
			getShort: Le,
			getUInt24: Re,
			getULong: ze,
			getFixed: Ve,
			getTag: He,
			getOffset: Ue,
			getBytes: We,
			bytesToString: Ge,
			Parser: L
		}, Ye = [
			"copyright",
			"fontFamily",
			"fontSubfamily",
			"uniqueID",
			"fullName",
			"version",
			"postScriptName",
			"trademark",
			"manufacturer",
			"designer",
			"description",
			"manufacturerURL",
			"designerURL",
			"license",
			"licenseURL",
			"reserved",
			"preferredFamily",
			"preferredSubfamily",
			"compatibleFullName",
			"sampleText",
			"postScriptFindFontName",
			"wwsFamily",
			"wwsSubfamily"
		], Xe = {
			0: "en",
			1: "fr",
			2: "de",
			3: "it",
			4: "nl",
			5: "sv",
			6: "es",
			7: "da",
			8: "pt",
			9: "no",
			10: "he",
			11: "ja",
			12: "ar",
			13: "fi",
			14: "el",
			15: "is",
			16: "mt",
			17: "tr",
			18: "hr",
			19: "zh-Hant",
			20: "ur",
			21: "hi",
			22: "th",
			23: "ko",
			24: "lt",
			25: "pl",
			26: "hu",
			27: "es",
			28: "lv",
			29: "se",
			30: "fo",
			31: "fa",
			32: "ru",
			33: "zh",
			34: "nl-BE",
			35: "ga",
			36: "sq",
			37: "ro",
			38: "cz",
			39: "sk",
			40: "si",
			41: "yi",
			42: "sr",
			43: "mk",
			44: "bg",
			45: "uk",
			46: "be",
			47: "uz",
			48: "kk",
			49: "az-Cyrl",
			50: "az-Arab",
			51: "hy",
			52: "ka",
			53: "mo",
			54: "ky",
			55: "tg",
			56: "tk",
			57: "mn-CN",
			58: "mn",
			59: "ps",
			60: "ks",
			61: "ku",
			62: "sd",
			63: "bo",
			64: "ne",
			65: "sa",
			66: "mr",
			67: "bn",
			68: "as",
			69: "gu",
			70: "pa",
			71: "or",
			72: "ml",
			73: "kn",
			74: "ta",
			75: "te",
			76: "si",
			77: "my",
			78: "km",
			79: "lo",
			80: "vi",
			81: "id",
			82: "tl",
			83: "ms",
			84: "ms-Arab",
			85: "am",
			86: "ti",
			87: "om",
			88: "so",
			89: "sw",
			90: "rw",
			91: "rn",
			92: "ny",
			93: "mg",
			94: "eo",
			128: "cy",
			129: "eu",
			130: "ca",
			131: "la",
			132: "qu",
			133: "gn",
			134: "ay",
			135: "tt",
			136: "ug",
			137: "dz",
			138: "jv",
			139: "su",
			140: "gl",
			141: "af",
			142: "br",
			143: "iu",
			144: "gd",
			145: "gv",
			146: "ga",
			147: "to",
			148: "el-polyton",
			149: "kl",
			150: "az",
			151: "nn"
		}, Ze = {
			0: 0,
			1: 0,
			2: 0,
			3: 0,
			4: 0,
			5: 0,
			6: 0,
			7: 0,
			8: 0,
			9: 0,
			10: 5,
			11: 1,
			12: 4,
			13: 0,
			14: 6,
			15: 0,
			16: 0,
			17: 0,
			18: 0,
			19: 2,
			20: 4,
			21: 9,
			22: 21,
			23: 3,
			24: 29,
			25: 29,
			26: 29,
			27: 29,
			28: 29,
			29: 0,
			30: 0,
			31: 4,
			32: 7,
			33: 25,
			34: 0,
			35: 0,
			36: 0,
			37: 0,
			38: 29,
			39: 29,
			40: 0,
			41: 5,
			42: 7,
			43: 7,
			44: 7,
			45: 7,
			46: 7,
			47: 7,
			48: 7,
			49: 7,
			50: 4,
			51: 24,
			52: 23,
			53: 7,
			54: 7,
			55: 7,
			56: 7,
			57: 27,
			58: 7,
			59: 4,
			60: 4,
			61: 4,
			62: 4,
			63: 26,
			64: 9,
			65: 9,
			66: 9,
			67: 13,
			68: 13,
			69: 11,
			70: 10,
			71: 12,
			72: 17,
			73: 16,
			74: 14,
			75: 15,
			76: 18,
			77: 19,
			78: 20,
			79: 22,
			80: 30,
			81: 0,
			82: 0,
			83: 0,
			84: 4,
			85: 28,
			86: 28,
			87: 28,
			88: 0,
			89: 0,
			90: 0,
			91: 0,
			92: 0,
			93: 0,
			94: 0,
			128: 0,
			129: 0,
			130: 0,
			131: 0,
			132: 0,
			133: 0,
			134: 0,
			135: 7,
			136: 4,
			137: 26,
			138: 0,
			139: 0,
			140: 0,
			141: 0,
			142: 0,
			143: 28,
			144: 0,
			145: 0,
			146: 0,
			147: 0,
			148: 6,
			149: 0,
			150: 0,
			151: 0
		}, Qe = {
			1078: "af",
			1052: "sq",
			1156: "gsw",
			1118: "am",
			5121: "ar-DZ",
			15361: "ar-BH",
			3073: "ar",
			2049: "ar-IQ",
			11265: "ar-JO",
			13313: "ar-KW",
			12289: "ar-LB",
			4097: "ar-LY",
			6145: "ary",
			8193: "ar-OM",
			16385: "ar-QA",
			1025: "ar-SA",
			10241: "ar-SY",
			7169: "aeb",
			14337: "ar-AE",
			9217: "ar-YE",
			1067: "hy",
			1101: "as",
			2092: "az-Cyrl",
			1068: "az",
			1133: "ba",
			1069: "eu",
			1059: "be",
			2117: "bn",
			1093: "bn-IN",
			8218: "bs-Cyrl",
			5146: "bs",
			1150: "br",
			1026: "bg",
			1027: "ca",
			3076: "zh-HK",
			5124: "zh-MO",
			2052: "zh",
			4100: "zh-SG",
			1028: "zh-TW",
			1155: "co",
			1050: "hr",
			4122: "hr-BA",
			1029: "cs",
			1030: "da",
			1164: "prs",
			1125: "dv",
			2067: "nl-BE",
			1043: "nl",
			3081: "en-AU",
			10249: "en-BZ",
			4105: "en-CA",
			9225: "en-029",
			16393: "en-IN",
			6153: "en-IE",
			8201: "en-JM",
			17417: "en-MY",
			5129: "en-NZ",
			13321: "en-PH",
			18441: "en-SG",
			7177: "en-ZA",
			11273: "en-TT",
			2057: "en-GB",
			1033: "en",
			12297: "en-ZW",
			1061: "et",
			1080: "fo",
			1124: "fil",
			1035: "fi",
			2060: "fr-BE",
			3084: "fr-CA",
			1036: "fr",
			5132: "fr-LU",
			6156: "fr-MC",
			4108: "fr-CH",
			1122: "fy",
			1110: "gl",
			1079: "ka",
			3079: "de-AT",
			1031: "de",
			5127: "de-LI",
			4103: "de-LU",
			2055: "de-CH",
			1032: "el",
			1135: "kl",
			1095: "gu",
			1128: "ha",
			1037: "he",
			1081: "hi",
			1038: "hu",
			1039: "is",
			1136: "ig",
			1057: "id",
			1117: "iu",
			2141: "iu-Latn",
			2108: "ga",
			1076: "xh",
			1077: "zu",
			1040: "it",
			2064: "it-CH",
			1041: "ja",
			1099: "kn",
			1087: "kk",
			1107: "km",
			1158: "quc",
			1159: "rw",
			1089: "sw",
			1111: "kok",
			1042: "ko",
			1088: "ky",
			1108: "lo",
			1062: "lv",
			1063: "lt",
			2094: "dsb",
			1134: "lb",
			1071: "mk",
			2110: "ms-BN",
			1086: "ms",
			1100: "ml",
			1082: "mt",
			1153: "mi",
			1146: "arn",
			1102: "mr",
			1148: "moh",
			1104: "mn",
			2128: "mn-CN",
			1121: "ne",
			1044: "nb",
			2068: "nn",
			1154: "oc",
			1096: "or",
			1123: "ps",
			1045: "pl",
			1046: "pt",
			2070: "pt-PT",
			1094: "pa",
			1131: "qu-BO",
			2155: "qu-EC",
			3179: "qu",
			1048: "ro",
			1047: "rm",
			1049: "ru",
			9275: "smn",
			4155: "smj-NO",
			5179: "smj",
			3131: "se-FI",
			1083: "se",
			2107: "se-SE",
			8251: "sms",
			6203: "sma-NO",
			7227: "sms",
			1103: "sa",
			7194: "sr-Cyrl-BA",
			3098: "sr",
			6170: "sr-Latn-BA",
			2074: "sr-Latn",
			1132: "nso",
			1074: "tn",
			1115: "si",
			1051: "sk",
			1060: "sl",
			11274: "es-AR",
			16394: "es-BO",
			13322: "es-CL",
			9226: "es-CO",
			5130: "es-CR",
			7178: "es-DO",
			12298: "es-EC",
			17418: "es-SV",
			4106: "es-GT",
			18442: "es-HN",
			2058: "es-MX",
			19466: "es-NI",
			6154: "es-PA",
			15370: "es-PY",
			10250: "es-PE",
			20490: "es-PR",
			3082: "es",
			1034: "es",
			21514: "es-US",
			14346: "es-UY",
			8202: "es-VE",
			2077: "sv-FI",
			1053: "sv",
			1114: "syr",
			1064: "tg",
			2143: "tzm",
			1097: "ta",
			1092: "tt",
			1098: "te",
			1054: "th",
			1105: "bo",
			1055: "tr",
			1090: "tk",
			1152: "ug",
			1058: "uk",
			1070: "hsb",
			1056: "ur",
			2115: "uz-Cyrl",
			1091: "uz",
			1066: "vi",
			1106: "cy",
			1160: "wo",
			1157: "sah",
			1144: "ii",
			1130: "yo"
		};
		function $e(e, t, n) {
			switch (e) {
				case 0:
					if (t === 65535) return "und";
					if (n) return n[t];
					break;
				case 1: return Xe[t];
				case 3: return Qe[t];
			}
		}
		var et = "utf-16", tt = {
			0: "macintosh",
			1: "x-mac-japanese",
			2: "x-mac-chinesetrad",
			3: "x-mac-korean",
			6: "x-mac-greek",
			7: "x-mac-cyrillic",
			9: "x-mac-devanagai",
			10: "x-mac-gurmukhi",
			11: "x-mac-gujarati",
			12: "x-mac-oriya",
			13: "x-mac-bengali",
			14: "x-mac-tamil",
			15: "x-mac-telugu",
			16: "x-mac-kannada",
			17: "x-mac-malayalam",
			18: "x-mac-sinhalese",
			19: "x-mac-burmese",
			20: "x-mac-khmer",
			21: "x-mac-thai",
			22: "x-mac-lao",
			23: "x-mac-georgian",
			24: "x-mac-armenian",
			25: "x-mac-chinesesimp",
			26: "x-mac-tibetan",
			27: "x-mac-mongolian",
			28: "x-mac-ethiopic",
			29: "x-mac-ce",
			30: "x-mac-vietnamese",
			31: "x-mac-extarabic"
		}, nt = {
			15: "x-mac-icelandic",
			17: "x-mac-turkish",
			18: "x-mac-croatian",
			24: "x-mac-ce",
			25: "x-mac-ce",
			26: "x-mac-ce",
			27: "x-mac-ce",
			28: "x-mac-ce",
			30: "x-mac-icelandic",
			37: "x-mac-romanian",
			38: "x-mac-ce",
			39: "x-mac-ce",
			40: "x-mac-ce",
			143: "x-mac-inuit",
			146: "x-mac-gaelic"
		};
		function rt(e, t, n) {
			switch (e) {
				case 0: return et;
				case 1: return nt[n] || tt[t];
				case 3:
					if (t === 1 || t === 10) return et;
					break;
			}
		}
		var it = {
			0: "unicode",
			1: "macintosh",
			2: "reserved",
			3: "windows"
		};
		function at(e) {
			return it[e];
		}
		function ot(e, t, n) {
			let r = {}, i = new R.Parser(e, t), a = i.parseUShort(), o = i.parseUShort(), s = i.offset + i.parseUShort();
			for (let t = 0; t < o; t++) {
				let t = i.parseUShort(), a = i.parseUShort(), o = i.parseUShort(), c = i.parseUShort(), l = Ye[c] || c, u = i.parseUShort(), d = i.parseUShort(), f = $e(t, o, n), p = rt(t, a, o), m = at(t);
				if (p !== void 0 && f !== void 0 && m !== void 0) {
					let t;
					if (t = p === et ? _e.UTF16(e, s + d, u) : _e.MACSTRING(e, s + d, u, p), t) {
						let e = r[m];
						e === void 0 && (e = r[m] = {});
						let n = e[l];
						n === void 0 && (n = e[l] = {}), n[f] = t;
					}
				}
			}
			return a === 1 && i.parseUShort(), r;
		}
		function st(e) {
			let t = {};
			for (let n in e) t[e[n]] = parseInt(n);
			return t;
		}
		function ct(e, t, n, r, i, a) {
			return new I.Record("NameRecord", [
				{
					name: "platformID",
					type: "USHORT",
					value: e
				},
				{
					name: "encodingID",
					type: "USHORT",
					value: t
				},
				{
					name: "languageID",
					type: "USHORT",
					value: n
				},
				{
					name: "nameID",
					type: "USHORT",
					value: r
				},
				{
					name: "length",
					type: "USHORT",
					value: i
				},
				{
					name: "offset",
					type: "USHORT",
					value: a
				}
			]);
		}
		function lt(e, t) {
			let n = e.length, r = t.length - n + 1;
			loop: for (let i = 0; i < r; i++) for (; i < r; i++) {
				for (let r = 0; r < n; r++) if (t[i + r] !== e[r]) continue loop;
				return i;
			}
			return -1;
		}
		function ut(e, t) {
			let n = lt(e, t);
			if (n < 0) {
				n = t.length;
				let r = 0, i = e.length;
				for (; r < i; ++r) t.push(e[r]);
			}
			return n;
		}
		function dt(e, t) {
			let n = st(it), r = st(Xe), i = st(Qe), a = [], o = [];
			for (let s in e) {
				let c, l = [], u = {}, d = st(Ye), f = n[s];
				for (let t in e[s]) {
					let n = d[t];
					if (n === void 0 && (n = t), c = parseInt(n), isNaN(c)) throw Error("Name table entry \"" + t + "\" does not exist, see nameTableNames for complete list.");
					u[c] = e[s][t], l.push(c);
				}
				for (let e = 0; e < l.length; e++) {
					c = l[e];
					let n = u[c];
					for (let e in n) {
						let s = n[e];
						if (f === 1 || f === 0) {
							let n = r[e], i = Ze[n], l = rt(f, i, n), u = M.MACSTRING(s, l);
							if (f === 0 && (n = t.indexOf(e), n < 0 && (n = t.length, t.push(e)), i = 4, u = M.UTF16(s)), u !== void 0) {
								let e = ut(u, o);
								a.push(ct(f, i, n, c, u.length, e));
							}
						}
						if (f === 3) {
							let t = i[e];
							if (t !== void 0) {
								let e = M.UTF16(s), n = ut(e, o);
								a.push(ct(3, 1, t, c, e.length, n));
							}
						}
					}
				}
			}
			a.sort(function(e, t) {
				return e.platformID - t.platformID || e.encodingID - t.encodingID || e.languageID - t.languageID || e.nameID - t.nameID;
			});
			let s = new I.Table("name", [
				{
					name: "format",
					type: "USHORT",
					value: 0
				},
				{
					name: "count",
					type: "USHORT",
					value: a.length
				},
				{
					name: "stringOffset",
					type: "USHORT",
					value: 6 + a.length * 12
				}
			]);
			for (let e = 0; e < a.length; e++) s.fields.push({
				name: "record_" + e,
				type: "RECORD",
				value: a[e]
			});
			return s.fields.push({
				name: "strings",
				type: "LITERAL",
				value: o
			}), s;
		}
		function ft(e, t, n = []) {
			if (t < 256 && t in Ye) {
				if (n.length && !n.includes(parseInt(t))) return;
				t = Ye[t];
			}
			for (let n in e) for (let r in e[n]) if (r === t || parseInt(r) === t) return e[n][r];
		}
		var pt = {
			parse: ot,
			make: dt,
			getNameByID: ft
		};
		function mt(e, t, n, r) {
			e.length = t.parseUShort(), e.language = t.parseUShort() - 1;
			let i = t.parseByteList(e.length), a = Object.assign({}, i), o = ye[rt(n, r, e.language)];
			for (let e = 0; e < o.length; e++) a[o.charCodeAt(e)] = i[128 + e];
			e.glyphIndexMap = a;
		}
		function ht(e, t, n) {
			t.parseUShort(), e.length = t.parseULong(), e.language = t.parseULong();
			let r;
			e.groupCount = r = t.parseULong(), e.glyphIndexMap = {};
			for (let i = 0; i < r; i += 1) {
				let r = t.parseULong(), i = t.parseULong(), a = t.parseULong();
				for (let t = r; t <= i; t += 1) e.glyphIndexMap[t] = a, n === 12 && a++;
			}
		}
		function gt(e, t, n, r, i) {
			e.length = t.parseUShort(), e.language = t.parseUShort();
			let a;
			e.segCount = a = t.parseUShort() >> 1, t.skip("uShort", 3), e.glyphIndexMap = {};
			let o = new R.Parser(n, r + i + 14), s = new R.Parser(n, r + i + 16 + a * 2), c = new R.Parser(n, r + i + 16 + a * 4), l = new R.Parser(n, r + i + 16 + a * 6), u = r + i + 16 + a * 8;
			for (let t = 0; t < a - 1; t += 1) {
				let t, r = o.parseUShort(), i = s.parseUShort(), a = c.parseShort(), d = l.parseUShort();
				for (let o = i; o <= r; o += 1) d === 0 ? t = o + a & 65535 : (u = l.offset + l.relativeOffset - 2, u += d, u += (o - i) * 2, t = R.getUShort(n, u), t !== 0 && (t = t + a & 65535)), e.glyphIndexMap[o] = t;
			}
		}
		function _t(e, t) {
			let n = {};
			t.skip("uLong");
			let r = t.parseULong();
			for (let e = 0; e < r; e += 1) {
				let e = t.parseUInt24(), r = { varSelector: e }, i = t.parseOffset32(), a = t.parseOffset32(), o = t.relativeOffset;
				i && (t.relativeOffset = i, r.defaultUVS = t.parseStruct({ ranges: function() {
					return t.parseRecordList32({
						startUnicodeValue: t.parseUInt24,
						additionalCount: t.parseByte
					});
				} })), a && (t.relativeOffset = a, r.nonDefaultUVS = t.parseStruct({ uvsMappings: function() {
					let e = {}, n = t.parseRecordList32({
						unicodeValue: t.parseUInt24,
						glyphID: t.parseUShort
					});
					for (let t = 0; t < n.length; t += 1) e[n[t].unicodeValue] = n[t];
					return e;
				} })), n[e] = r, t.relativeOffset = o;
			}
			e.varSelectorList = n;
		}
		function vt(e, t) {
			let n = {};
			n.version = R.getUShort(e, t), j.argument(n.version === 0, "cmap table version should be 0."), n.numTables = R.getUShort(e, t + 2);
			let r = null, i = -1, a = -1, o = null, s = null, c = [
				0,
				1,
				2,
				3,
				4,
				6
			], l = [
				0,
				1,
				10
			];
			for (let u = n.numTables - 1; u >= 0; --u) if (o = R.getUShort(e, t + 4 + u * 8), s = R.getUShort(e, t + 4 + u * 8 + 2), o === 3 && l.includes(s) || o === 0 && c.includes(s) || o === 1 && s === 0) {
				if (a > 0) continue;
				if (a = R.getULong(e, t + 4 + u * 8 + 4), r) break;
			} else if (o === 0 && s === 5) {
				if (i = R.getULong(e, t + 4 + u * 8 + 4), r = new R.Parser(e, t + i), r.parseUShort() !== 14) i = -1, r = null;
				else if (a > 0) break;
			}
			if (a === -1) throw Error("No valid cmap sub-tables found.");
			let u = new R.Parser(e, t + a);
			if (n.format = u.parseUShort(), n.format === 0) mt(n, u, o, s);
			else if (n.format === 12 || n.format === 13) ht(n, u, n.format);
			else if (n.format === 4) gt(n, u, e, t, a);
			else throw Error("Only format 0 (platformId 1, encodingId 0), 4, 12 and 14 cmap tables are supported (found format " + n.format + ", platformId " + o + ", encodingId " + s + ").");
			return r && _t(n, r), n;
		}
		function yt(e, t, n) {
			e.segments.push({
				end: t,
				start: t,
				delta: -(t - n),
				offset: 0,
				glyphIndex: n
			});
		}
		function bt(e) {
			e.segments.push({
				end: 65535,
				start: 65535,
				delta: 1,
				offset: 0
			});
		}
		function xt(e) {
			if (e.length === 0) return e;
			let t = [e[0]];
			for (let n = 1; n < e.length; n++) {
				let r = t[t.length - 1], i = e[n];
				r.end + 1 === i.start && r.delta === i.delta && i.end !== 65535 ? r.end = i.end : t.push(i);
			}
			return t;
		}
		function St(e) {
			let t = !0, n;
			for (n = e.length - 1; n > 0; --n) if (e.get(n).unicode > 65535) {
				t = !1;
				break;
			}
			let r = [
				{
					name: "version",
					type: "USHORT",
					value: 0
				},
				{
					name: "numTables",
					type: "USHORT",
					value: t ? 1 : 2
				},
				{
					name: "platformID",
					type: "USHORT",
					value: 3
				},
				{
					name: "encodingID",
					type: "USHORT",
					value: 1
				},
				{
					name: "offset",
					type: "ULONG",
					value: t ? 12 : 20
				}
			];
			t || r.push({
				name: "cmap12PlatformID",
				type: "USHORT",
				value: 3
			}, {
				name: "cmap12EncodingID",
				type: "USHORT",
				value: 10
			}, {
				name: "cmap12Offset",
				type: "ULONG",
				value: 0
			}), r.push({
				name: "format",
				type: "USHORT",
				value: 4
			}, {
				name: "cmap4Length",
				type: "USHORT",
				value: 0
			}, {
				name: "language",
				type: "USHORT",
				value: 0
			}, {
				name: "segCountX2",
				type: "USHORT",
				value: 0
			}, {
				name: "searchRange",
				type: "USHORT",
				value: 0
			}, {
				name: "entrySelector",
				type: "USHORT",
				value: 0
			}, {
				name: "rangeShift",
				type: "USHORT",
				value: 0
			});
			let i = new I.Table("cmap", r);
			for (i.segments = [], n = 0; n < e.length; n += 1) {
				let t = e.get(n);
				for (let e = 0; e < t.unicodes.length; e += 1) yt(i, t.unicodes[e], n);
			}
			i.segments.sort(function(e, t) {
				return e.start - t.start;
			}), i.segments = xt(i.segments), bt(i);
			let a = i.segments.length, o = 0, s = [], c = [], l = [], u = [], d = [], f = [];
			for (n = 0; n < a; n += 1) {
				let e = i.segments[n];
				e.end <= 65535 && e.start <= 65535 ? (s.push({
					name: "end_" + n,
					type: "USHORT",
					value: e.end
				}), c.push({
					name: "start_" + n,
					type: "USHORT",
					value: e.start
				}), l.push({
					name: "idDelta_" + n,
					type: "SHORT",
					value: e.delta
				}), u.push({
					name: "idRangeOffset_" + n,
					type: "USHORT",
					value: e.offset
				}), e.glyphId !== void 0 && d.push({
					name: "glyph_" + n,
					type: "USHORT",
					value: e.glyphId
				})) : o += 1, !t && e.glyphIndex !== void 0 && (f.push({
					name: "cmap12Start_" + n,
					type: "ULONG",
					value: e.start
				}), f.push({
					name: "cmap12End_" + n,
					type: "ULONG",
					value: e.end
				}), f.push({
					name: "cmap12Glyph_" + n,
					type: "ULONG",
					value: e.glyphIndex
				}));
			}
			i.segCountX2 = (a - o) * 2, i.searchRange = 2 ** Math.floor(Math.log(a - o) / Math.log(2)) * 2, i.entrySelector = Math.log(i.searchRange / 2) / Math.log(2), i.rangeShift = i.segCountX2 - i.searchRange;
			for (let e = 0; e < s.length; e++) i.fields.push(s[e]);
			i.fields.push({
				name: "reservedPad",
				type: "USHORT",
				value: 0
			});
			for (let e = 0; e < c.length; e++) i.fields.push(c[e]);
			for (let e = 0; e < l.length; e++) i.fields.push(l[e]);
			for (let e = 0; e < u.length; e++) i.fields.push(u[e]);
			for (let e = 0; e < d.length; e++) i.fields.push(d[e]);
			if (i.cmap4Length = 14 + s.length * 2 + 2 + c.length * 2 + l.length * 2 + u.length * 2 + d.length * 2, !t) {
				let e = 16 + f.length * 4;
				i.cmap12Offset = 20 + i.cmap4Length, i.fields.push({
					name: "cmap12Format",
					type: "USHORT",
					value: 12
				}, {
					name: "cmap12Reserved",
					type: "USHORT",
					value: 0
				}, {
					name: "cmap12Length",
					type: "ULONG",
					value: e
				}, {
					name: "cmap12Language",
					type: "ULONG",
					value: 0
				}, {
					name: "cmap12nGroups",
					type: "ULONG",
					value: f.length / 3
				});
				for (let e = 0; e < f.length; e++) i.fields.push(f[e]);
			}
			return i;
		}
		var Ct = {
			parse: vt,
			make: St
		}, wt = /* @__PURE__ */ ".notdef,space,exclam,quotedbl,numbersign,dollar,percent,ampersand,quoteright,parenleft,parenright,asterisk,plus,comma,hyphen,period,slash,zero,one,two,three,four,five,six,seven,eight,nine,colon,semicolon,less,equal,greater,question,at,A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z,bracketleft,backslash,bracketright,asciicircum,underscore,quoteleft,a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z,braceleft,bar,braceright,asciitilde,exclamdown,cent,sterling,fraction,yen,florin,section,currency,quotesingle,quotedblleft,guillemotleft,guilsinglleft,guilsinglright,fi,fl,endash,dagger,daggerdbl,periodcentered,paragraph,bullet,quotesinglbase,quotedblbase,quotedblright,guillemotright,ellipsis,perthousand,questiondown,grave,acute,circumflex,tilde,macron,breve,dotaccent,dieresis,ring,cedilla,hungarumlaut,ogonek,caron,emdash,AE,ordfeminine,Lslash,Oslash,OE,ordmasculine,ae,dotlessi,lslash,oslash,oe,germandbls,onesuperior,logicalnot,mu,trademark,Eth,onehalf,plusminus,Thorn,onequarter,divide,brokenbar,degree,thorn,threequarters,twosuperior,registered,minus,eth,multiply,threesuperior,copyright,Aacute,Acircumflex,Adieresis,Agrave,Aring,Atilde,Ccedilla,Eacute,Ecircumflex,Edieresis,Egrave,Iacute,Icircumflex,Idieresis,Igrave,Ntilde,Oacute,Ocircumflex,Odieresis,Ograve,Otilde,Scaron,Uacute,Ucircumflex,Udieresis,Ugrave,Yacute,Ydieresis,Zcaron,aacute,acircumflex,adieresis,agrave,aring,atilde,ccedilla,eacute,ecircumflex,edieresis,egrave,iacute,icircumflex,idieresis,igrave,ntilde,oacute,ocircumflex,odieresis,ograve,otilde,scaron,uacute,ucircumflex,udieresis,ugrave,yacute,ydieresis,zcaron,exclamsmall,Hungarumlautsmall,dollaroldstyle,dollarsuperior,ampersandsmall,Acutesmall,parenleftsuperior,parenrightsuperior,266 ff,onedotenleader,zerooldstyle,oneoldstyle,twooldstyle,threeoldstyle,fouroldstyle,fiveoldstyle,sixoldstyle,sevenoldstyle,eightoldstyle,nineoldstyle,commasuperior,threequartersemdash,periodsuperior,questionsmall,asuperior,bsuperior,centsuperior,dsuperior,esuperior,isuperior,lsuperior,msuperior,nsuperior,osuperior,rsuperior,ssuperior,tsuperior,ff,ffi,ffl,parenleftinferior,parenrightinferior,Circumflexsmall,hyphensuperior,Gravesmall,Asmall,Bsmall,Csmall,Dsmall,Esmall,Fsmall,Gsmall,Hsmall,Ismall,Jsmall,Ksmall,Lsmall,Msmall,Nsmall,Osmall,Psmall,Qsmall,Rsmall,Ssmall,Tsmall,Usmall,Vsmall,Wsmall,Xsmall,Ysmall,Zsmall,colonmonetary,onefitted,rupiah,Tildesmall,exclamdownsmall,centoldstyle,Lslashsmall,Scaronsmall,Zcaronsmall,Dieresissmall,Brevesmall,Caronsmall,Dotaccentsmall,Macronsmall,figuredash,hypheninferior,Ogoneksmall,Ringsmall,Cedillasmall,questiondownsmall,oneeighth,threeeighths,fiveeighths,seveneighths,onethird,twothirds,zerosuperior,foursuperior,fivesuperior,sixsuperior,sevensuperior,eightsuperior,ninesuperior,zeroinferior,oneinferior,twoinferior,threeinferior,fourinferior,fiveinferior,sixinferior,seveninferior,eightinferior,nineinferior,centinferior,dollarinferior,periodinferior,commainferior,Agravesmall,Aacutesmall,Acircumflexsmall,Atildesmall,Adieresissmall,Aringsmall,AEsmall,Ccedillasmall,Egravesmall,Eacutesmall,Ecircumflexsmall,Edieresissmall,Igravesmall,Iacutesmall,Icircumflexsmall,Idieresissmall,Ethsmall,Ntildesmall,Ogravesmall,Oacutesmall,Ocircumflexsmall,Otildesmall,Odieresissmall,OEsmall,Oslashsmall,Ugravesmall,Uacutesmall,Ucircumflexsmall,Udieresissmall,Yacutesmall,Thornsmall,Ydieresissmall,001.000,001.001,001.002,001.003,Black,Bold,Book,Light,Medium,Regular,Roman,Semibold".split(","), Tt = /* @__PURE__ */ ".notdef,space,exclam,quotedbl,numbersign,dollar,percent,ampersand,quoteright,parenleft,parenright,asterisk,plus,comma,hyphen,period,slash,zero,one,two,three,four,five,six,seven,eight,nine,colon,semicolon,less,equal,greater,question,at,A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z,bracketleft,backslash,bracketright,asciicircum,underscore,quoteleft,a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z,braceleft,bar,braceright,asciitilde,exclamdown,cent,sterling,fraction,yen,florin,section,currency,quotesingle,quotedblleft,guillemotleft,guilsinglleft,guilsinglright,fi,fl,endash,dagger,daggerdbl,periodcentered,paragraph,bullet,quotesinglbase,quotedblbase,quotedblright,guillemotright,ellipsis,perthousand,questiondown,grave,acute,circumflex,tilde,macron,breve,dotaccent,dieresis,ring,cedilla,hungarumlaut,ogonek,caron,emdash,AE,ordfeminine,Lslash,Oslash,OE,ordmasculine,ae,dotlessi,lslash,oslash,oe,germandbls,onesuperior,logicalnot,mu,trademark,Eth,onehalf,plusminus,Thorn,onequarter,divide,brokenbar,degree,thorn,threequarters,twosuperior,registered,minus,eth,multiply,threesuperior,copyright,Aacute,Acircumflex,Adieresis,Agrave,Aring,Atilde,Ccedilla,Eacute,Ecircumflex,Edieresis,Egrave,Iacute,Icircumflex,Idieresis,Igrave,Ntilde,Oacute,Ocircumflex,Odieresis,Ograve,Otilde,Scaron,Uacute,Ucircumflex,Udieresis,Ugrave,Yacute,Ydieresis,Zcaron,aacute,acircumflex,adieresis,agrave,aring,atilde,ccedilla,eacute,ecircumflex,edieresis,egrave,iacute,icircumflex,idieresis,igrave,ntilde,oacute,ocircumflex,odieresis,ograve,otilde,scaron,uacute,ucircumflex,udieresis,ugrave,yacute,ydieresis,zcaron".split(","), Et = /* @__PURE__ */ ".notdef,space,exclamsmall,Hungarumlautsmall,dollaroldstyle,dollarsuperior,ampersandsmall,Acutesmall,parenleftsuperior,parenrightsuperior,twodotenleader,onedotenleader,comma,hyphen,period,fraction,zerooldstyle,oneoldstyle,twooldstyle,threeoldstyle,fouroldstyle,fiveoldstyle,sixoldstyle,sevenoldstyle,eightoldstyle,nineoldstyle,colon,semicolon,commasuperior,threequartersemdash,periodsuperior,questionsmall,asuperior,bsuperior,centsuperior,dsuperior,esuperior,isuperior,lsuperior,msuperior,nsuperior,osuperior,rsuperior,ssuperior,tsuperior,ff,fi,fl,ffi,ffl,parenleftinferior,parenrightinferior,Circumflexsmall,hyphensuperior,Gravesmall,Asmall,Bsmall,Csmall,Dsmall,Esmall,Fsmall,Gsmall,Hsmall,Ismall,Jsmall,Ksmall,Lsmall,Msmall,Nsmall,Osmall,Psmall,Qsmall,Rsmall,Ssmall,Tsmall,Usmall,Vsmall,Wsmall,Xsmall,Ysmall,Zsmall,colonmonetary,onefitted,rupiah,Tildesmall,exclamdownsmall,centoldstyle,Lslashsmall,Scaronsmall,Zcaronsmall,Dieresissmall,Brevesmall,Caronsmall,Dotaccentsmall,Macronsmall,figuredash,hypheninferior,Ogoneksmall,Ringsmall,Cedillasmall,onequarter,onehalf,threequarters,questiondownsmall,oneeighth,threeeighths,fiveeighths,seveneighths,onethird,twothirds,zerosuperior,onesuperior,twosuperior,threesuperior,foursuperior,fivesuperior,sixsuperior,sevensuperior,eightsuperior,ninesuperior,zeroinferior,oneinferior,twoinferior,threeinferior,fourinferior,fiveinferior,sixinferior,seveninferior,eightinferior,nineinferior,centinferior,dollarinferior,periodinferior,commainferior,Agravesmall,Aacutesmall,Acircumflexsmall,Atildesmall,Adieresissmall,Aringsmall,AEsmall,Ccedillasmall,Egravesmall,Eacutesmall,Ecircumflexsmall,Edieresissmall,Igravesmall,Iacutesmall,Icircumflexsmall,Idieresissmall,Ethsmall,Ntildesmall,Ogravesmall,Oacutesmall,Ocircumflexsmall,Otildesmall,Odieresissmall,OEsmall,Oslashsmall,Ugravesmall,Uacutesmall,Ucircumflexsmall,Udieresissmall,Yacutesmall,Thornsmall,Ydieresissmall".split(","), Dt = /* @__PURE__ */ ".notdef,space,dollaroldstyle,dollarsuperior,parenleftsuperior,parenrightsuperior,twodotenleader,onedotenleader,comma,hyphen,period,fraction,zerooldstyle,oneoldstyle,twooldstyle,threeoldstyle,fouroldstyle,fiveoldstyle,sixoldstyle,sevenoldstyle,eightoldstyle,nineoldstyle,colon,semicolon,commasuperior,threequartersemdash,periodsuperior,asuperior,bsuperior,centsuperior,dsuperior,esuperior,isuperior,lsuperior,msuperior,nsuperior,osuperior,rsuperior,ssuperior,tsuperior,ff,fi,fl,ffi,ffl,parenleftinferior,parenrightinferior,hyphensuperior,colonmonetary,onefitted,rupiah,centoldstyle,figuredash,hypheninferior,onequarter,onehalf,threequarters,oneeighth,threeeighths,fiveeighths,seveneighths,onethird,twothirds,zerosuperior,onesuperior,twosuperior,threesuperior,foursuperior,fivesuperior,sixsuperior,sevensuperior,eightsuperior,ninesuperior,zeroinferior,oneinferior,twoinferior,threeinferior,fourinferior,fiveinferior,sixinferior,seveninferior,eightinferior,nineinferior,centinferior,dollarinferior,periodinferior,commainferior".split(","), Ot = /* @__PURE__ */ "................................space.exclam.quotedbl.numbersign.dollar.percent.ampersand.quoteright.parenleft.parenright.asterisk.plus.comma.hyphen.period.slash.zero.one.two.three.four.five.six.seven.eight.nine.colon.semicolon.less.equal.greater.question.at.A.B.C.D.E.F.G.H.I.J.K.L.M.N.O.P.Q.R.S.T.U.V.W.X.Y.Z.bracketleft.backslash.bracketright.asciicircum.underscore.quoteleft.a.b.c.d.e.f.g.h.i.j.k.l.m.n.o.p.q.r.s.t.u.v.w.x.y.z.braceleft.bar.braceright.asciitilde...................................exclamdown.cent.sterling.fraction.yen.florin.section.currency.quotesingle.quotedblleft.guillemotleft.guilsinglleft.guilsinglright.fi.fl..endash.dagger.daggerdbl.periodcentered..paragraph.bullet.quotesinglbase.quotedblbase.quotedblright.guillemotright.ellipsis.perthousand..questiondown..grave.acute.circumflex.tilde.macron.breve.dotaccent.dieresis..ring.cedilla..hungarumlaut.ogonek.caron.emdash.................AE..ordfeminine.....Lslash.Oslash.OE.ordmasculine......ae....dotlessi...lslash.oslash.oe.germandbls".split("."), kt = /* @__PURE__ */ "................................space.exclamsmall.Hungarumlautsmall..dollaroldstyle.dollarsuperior.ampersandsmall.Acutesmall.parenleftsuperior.parenrightsuperior.twodotenleader.onedotenleader.comma.hyphen.period.fraction.zerooldstyle.oneoldstyle.twooldstyle.threeoldstyle.fouroldstyle.fiveoldstyle.sixoldstyle.sevenoldstyle.eightoldstyle.nineoldstyle.colon.semicolon.commasuperior.threequartersemdash.periodsuperior.questionsmall..asuperior.bsuperior.centsuperior.dsuperior.esuperior...isuperior...lsuperior.msuperior.nsuperior.osuperior...rsuperior.ssuperior.tsuperior..ff.fi.fl.ffi.ffl.parenleftinferior..parenrightinferior.Circumflexsmall.hyphensuperior.Gravesmall.Asmall.Bsmall.Csmall.Dsmall.Esmall.Fsmall.Gsmall.Hsmall.Ismall.Jsmall.Ksmall.Lsmall.Msmall.Nsmall.Osmall.Psmall.Qsmall.Rsmall.Ssmall.Tsmall.Usmall.Vsmall.Wsmall.Xsmall.Ysmall.Zsmall.colonmonetary.onefitted.rupiah.Tildesmall...................................exclamdownsmall.centoldstyle.Lslashsmall...Scaronsmall.Zcaronsmall.Dieresissmall.Brevesmall.Caronsmall..Dotaccentsmall...Macronsmall...figuredash.hypheninferior...Ogoneksmall.Ringsmall.Cedillasmall....onequarter.onehalf.threequarters.questiondownsmall.oneeighth.threeeighths.fiveeighths.seveneighths.onethird.twothirds...zerosuperior.onesuperior.twosuperior.threesuperior.foursuperior.fivesuperior.sixsuperior.sevensuperior.eightsuperior.ninesuperior.zeroinferior.oneinferior.twoinferior.threeinferior.fourinferior.fiveinferior.sixinferior.seveninferior.eightinferior.nineinferior.centinferior.dollarinferior.periodinferior.commainferior.Agravesmall.Aacutesmall.Acircumflexsmall.Atildesmall.Adieresissmall.Aringsmall.AEsmall.Ccedillasmall.Egravesmall.Eacutesmall.Ecircumflexsmall.Edieresissmall.Igravesmall.Iacutesmall.Icircumflexsmall.Idieresissmall.Ethsmall.Ntildesmall.Ogravesmall.Oacutesmall.Ocircumflexsmall.Otildesmall.Odieresissmall.OEsmall.Oslashsmall.Ugravesmall.Uacutesmall.Ucircumflexsmall.Udieresissmall.Yacutesmall.Thornsmall.Ydieresissmall".split("."), At = /* @__PURE__ */ ".notdef,.null,nonmarkingreturn,space,exclam,quotedbl,numbersign,dollar,percent,ampersand,quotesingle,parenleft,parenright,asterisk,plus,comma,hyphen,period,slash,zero,one,two,three,four,five,six,seven,eight,nine,colon,semicolon,less,equal,greater,question,at,A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z,bracketleft,backslash,bracketright,asciicircum,underscore,grave,a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z,braceleft,bar,braceright,asciitilde,Adieresis,Aring,Ccedilla,Eacute,Ntilde,Odieresis,Udieresis,aacute,agrave,acircumflex,adieresis,atilde,aring,ccedilla,eacute,egrave,ecircumflex,edieresis,iacute,igrave,icircumflex,idieresis,ntilde,oacute,ograve,ocircumflex,odieresis,otilde,uacute,ugrave,ucircumflex,udieresis,dagger,degree,cent,sterling,section,bullet,paragraph,germandbls,registered,copyright,trademark,acute,dieresis,notequal,AE,Oslash,infinity,plusminus,lessequal,greaterequal,yen,mu,partialdiff,summation,product,pi,integral,ordfeminine,ordmasculine,Omega,ae,oslash,questiondown,exclamdown,logicalnot,radical,florin,approxequal,Delta,guillemotleft,guillemotright,ellipsis,nonbreakingspace,Agrave,Atilde,Otilde,OE,oe,endash,emdash,quotedblleft,quotedblright,quoteleft,quoteright,divide,lozenge,ydieresis,Ydieresis,fraction,currency,guilsinglleft,guilsinglright,fi,fl,daggerdbl,periodcentered,quotesinglbase,quotedblbase,perthousand,Acircumflex,Ecircumflex,Aacute,Edieresis,Egrave,Iacute,Icircumflex,Idieresis,Igrave,Oacute,Ocircumflex,apple,Ograve,Uacute,Ucircumflex,Ugrave,dotlessi,circumflex,tilde,macron,breve,dotaccent,ring,cedilla,hungarumlaut,ogonek,caron,Lslash,lslash,Scaron,scaron,Zcaron,zcaron,brokenbar,Eth,eth,Yacute,yacute,Thorn,thorn,minus,multiply,onesuperior,twosuperior,threesuperior,onehalf,onequarter,threequarters,franc,Gbreve,gbreve,Idotaccent,Scedilla,scedilla,Cacute,cacute,Ccaron,ccaron,dcroat".split(",");
		function jt(e) {
			this.font = e;
		}
		jt.prototype.charToGlyphIndex = function(e) {
			let t = e.codePointAt(0), n = this.font.glyphs;
			if (n) for (let e = 0; e < n.length; e += 1) {
				let r = n.get(e);
				for (let n = 0; n < r.unicodes.length; n += 1) if (r.unicodes[n] === t) return e;
			}
			return null;
		};
		function Mt(e) {
			this.cmap = e;
		}
		Mt.prototype.charToGlyphIndex = function(e) {
			return this.cmap.glyphIndexMap[e.codePointAt(0)] || 0;
		};
		function Nt(e, t) {
			this.encoding = e, this.charset = t;
		}
		Nt.prototype.charToGlyphIndex = function(e) {
			let t = e.codePointAt(0), n = this.encoding[t];
			return this.charset.indexOf(n);
		};
		function Pt(e) {
			switch (e.version) {
				case 1:
					this.names = At.slice();
					break;
				case 2:
					this.names = Array(e.numberOfGlyphs);
					for (let t = 0; t < e.numberOfGlyphs; t++) e.glyphNameIndex[t] < At.length ? this.names[t] = At[e.glyphNameIndex[t]] : this.names[t] = e.names[e.glyphNameIndex[t] - At.length];
					break;
				case 2.5:
					this.names = Array(e.numberOfGlyphs);
					for (let t = 0; t < e.numberOfGlyphs; t++) this.names[t] = At[t + e.glyphNameIndex[t]];
					break;
				case 3:
					this.names = [];
					break;
				default:
					this.names = [];
					break;
			}
		}
		Pt.prototype.nameToGlyphIndex = function(e) {
			return this.names.indexOf(e);
		}, Pt.prototype.glyphIndexToName = function(e) {
			return this.names[e];
		};
		function Ft(e) {
			let t, n = e.tables.cmap.glyphIndexMap, r = Object.keys(n);
			for (let i = 0; i < r.length; i += 1) {
				let a = r[i], o = n[a];
				t = e.glyphs.get(o), t.addUnicode(parseInt(a));
			}
			for (let n = 0; n < e.glyphs.length; n += 1) t = e.glyphs.get(n), e.cffEncoding ? t.name = e.cffEncoding.charset[n] : e.glyphNames.names && (t.name = e.glyphNames.glyphIndexToName(n));
		}
		function It(e) {
			e._IndexToUnicodeMap = {};
			let t = e.tables.cmap.glyphIndexMap, n = Object.keys(t);
			for (let r = 0; r < n.length; r += 1) {
				let i = n[r], a = t[i];
				e._IndexToUnicodeMap[a] === void 0 ? e._IndexToUnicodeMap[a] = { unicodes: [parseInt(i)] } : e._IndexToUnicodeMap[a].unicodes.push(parseInt(i));
			}
		}
		function Lt(e, t) {
			t.lowMemory ? It(e) : Ft(e);
		}
		function Rt(e, t, n, r, i) {
			e.beginPath(), e.moveTo(t, n), e.lineTo(r, i), e.stroke();
		}
		var zt = { line: Rt };
		function Bt(e, t) {
			let n = new L(e, t), r = n.parseShort();
			r !== 0 && console.warn("Only CPALv0 is currently fully supported.");
			let i = n.parseShort(), a = n.parseShort(), o = n.parseShort(), s = n.parseOffset32(), c = n.parseUShortList(a);
			n.relativeOffset = s;
			let l = n.parseULongList(o);
			return n.relativeOffset = s, {
				version: r,
				numPaletteEntries: i,
				colorRecords: l,
				colorRecordIndices: c
			};
		}
		function Vt({ version: e = 0, numPaletteEntries: t = 0, colorRecords: n = [], colorRecordIndices: r = [0] }) {
			return j.argument(e === 0, "Only CPALv0 are supported."), j.argument(n.length, "No colorRecords given."), j.argument(r.length, "No colorRecordIndices given."), r.length > 1 && j.argument(t, "Can't infer numPaletteEntries on multiple colorRecordIndices"), new I.Table("CPAL", [
				{
					name: "version",
					type: "USHORT",
					value: e
				},
				{
					name: "numPaletteEntries",
					type: "USHORT",
					value: t || n.length
				},
				{
					name: "numPalettes",
					type: "USHORT",
					value: r.length
				},
				{
					name: "numColorRecords",
					type: "USHORT",
					value: n.length
				},
				{
					name: "colorRecordsArrayOffset",
					type: "ULONG",
					value: 12 + 2 * r.length
				},
				...r.map((e, t) => ({
					name: "colorRecordIndices_" + t,
					type: "USHORT",
					value: e
				})),
				...n.map((e, t) => ({
					name: "colorRecords_" + t,
					type: "ULONG",
					value: e
				}))
			]);
		}
		function Ht(e) {
			var t = (e & 4278190080) >> 24, n = (e & 16711680) >> 16, r = (e & 65280) >> 8, i = e & 255;
			return t = t + 256 & 255, n = n + 256 & 255, r = r + 256 & 255, i = (i + 256 & 255) / 255, {
				b: t,
				g: n,
				r,
				a: i
			};
		}
		function Ut(e, t, n = 0, r = "hexa") {
			if (t == 65535) return "currentColor";
			let i = e && e.tables && e.tables.cpal;
			if (!i) return "currentColor";
			if (n > i.colorRecordIndices.length - 1) throw Error(`Palette index out of range (colorRecordIndices.length: ${i.colorRecordIndices.length}, index: ${t})`);
			if (t > i.numPaletteEntries) throw Error(`Color index out of range (numPaletteEntries: ${i.numPaletteEntries}, index: ${t})`);
			let a = i.colorRecordIndices[n] + t;
			if (a > i.colorRecords) throw Error(`Color index out of range (colorRecords.length: ${i.colorRecords.length}, lookupIndex: ${a})`);
			let o = Ht(i.colorRecords[a]);
			return r === "bgra" ? o : Yt(o, r);
		}
		function Wt(e) {
			return ("0" + parseInt(e).toString(16)).slice(-2);
		}
		function Gt(e) {
			let t = e.r / 255, n = e.g / 255, r = e.b / 255, i = Math.max(t, n, r), a = Math.min(t, n, r), o, s, c = (i + a) / 2;
			if (i === a) o = s = 0;
			else {
				let e = i - a;
				switch (s = c > .5 ? e / (2 - i - a) : e / (i + a), i) {
					case t:
						o = (n - r) / e + (n < r ? 6 : 0);
						break;
					case n:
						o = (r - t) / e + 2;
						break;
					case r:
						o = (t - n) / e + 4;
						break;
				}
				o /= 6;
			}
			return {
				h: o * 360,
				s: s * 100,
				l: c * 100
			};
		}
		function Kt(e) {
			let { h: t, s: n, l: r, a: i } = e;
			t %= 360, n /= 100, r /= 100;
			let a = (1 - Math.abs(2 * r - 1)) * n, o = a * (1 - Math.abs(t / 60 % 2 - 1)), s = r - a / 2, c = 0, l = 0, u = 0;
			return 0 <= t && t < 60 ? (c = a, l = o, u = 0) : 60 <= t && t < 120 ? (c = o, l = a, u = 0) : 120 <= t && t < 180 ? (c = 0, l = a, u = o) : 180 <= t && t < 240 ? (c = 0, l = o, u = a) : 240 <= t && t < 300 ? (c = o, l = 0, u = a) : 300 <= t && t <= 360 && (c = a, l = 0, u = o), {
				r: Math.round((c + s) * 255),
				g: Math.round((l + s) * 255),
				b: Math.round((u + s) * 255),
				a: i
			};
		}
		function qt(e) {
			return parseInt(`0x${Wt(e.b)}${Wt(e.g)}${Wt(e.r)}${Wt(e.a * 255)}`, 16);
		}
		function Jt(e, t = "hexa") {
			let n = t == "raw" || t == "cpal", r = Number.isInteger(e), i = !0;
			if (r && n || e === "currentColor") return e;
			if (typeof e == "object") {
				if (t == "bgra") return e;
				if (n) return qt(e);
			} else if (!r && /^#([a-f0-9]{3}|[a-f0-9]{4}|[a-f0-9]{6}|[a-f0-9]{8})$/i.test(e.trim())) {
				switch (e = e.trim().substring(1), e.length) {
					case 3:
						e = {
							r: parseInt(e[0].repeat(2), 16),
							g: parseInt(e[1].repeat(2), 16),
							b: parseInt(e[2].repeat(2), 16),
							a: 1
						};
						break;
					case 4:
						e = {
							r: parseInt(e[0].repeat(2), 16),
							g: parseInt(e[1].repeat(2), 16),
							b: parseInt(e[2].repeat(2), 16),
							a: parseInt(e[3].repeat(2), 16) / 255
						};
						break;
					case 6:
						e = {
							r: parseInt(e[0] + e[1], 16),
							g: parseInt(e[2] + e[3], 16),
							b: parseInt(e[4] + e[5], 16),
							a: 1
						};
						break;
					case 8:
						e = {
							r: parseInt(e[0] + e[1], 16),
							g: parseInt(e[2] + e[3], 16),
							b: parseInt(e[4] + e[5], 16),
							a: parseInt(e[6] + e[7], 16) / 255
						};
						break;
				}
				if (t == "bgra") return e;
			} else if (typeof document < "u" && /^[a-z]+$/i.test(e)) {
				let t = document.createElement("canvas").getContext("2d");
				t.fillStyle = e;
				let n = Yt(t.fillStyle, "hexa");
				n === "#000000ff" && e.toLowerCase() !== "black" ? i = !1 : e = n;
			} else {
				e = e.trim();
				let t = /rgba?\(\s*(?:(\d*\.\d+)(%?)|(\d+)(%?))\s*(?:,|\s*)\s*(?:(\d*\.\d+)(%?)|(\d+)(%?))\s*(?:,|\s*)\s*(?:(\d*\.\d+)(%?)|(\d+)(%?))\s*(?:(?:,|\s|\/)\s*(?:(0*(?:\.\d+)?()|0*1(?:\.0+)?())|(?:\.\d+)|(\d+)(%)|(\d*\.\d+)(%)))?\s*\)/;
				if (t.test(e)) {
					let n = e.match(t).filter((e) => e !== void 0);
					e = {
						r: Math.round(parseFloat(n[1]) / (n[2] ? 100 / 255 : 1)),
						g: Math.round(parseFloat(n[3]) / (n[4] ? 100 / 255 : 1)),
						b: Math.round(parseFloat(n[5]) / (n[6] ? 100 / 255 : 1)),
						a: n[7] ? parseFloat(n[7]) / (n[8] ? 100 : 1) : 1
					};
				} else {
					let t = /hsla?\(\s*(?:(\d*\.\d+|\d+)(deg|turn|))\s*(?:,|\s*)\s*(?:(\d*\.\d+)%?|(\d+)%?)\s*(?:,|\s*)\s*(?:(\d*\.\d+)%?|(\d+)%?)\s*(?:(?:,|\s|\/)\s*(?:(0*(?:\.\d+)?()|0*1(?:\.0+)?())|(?:\.\d+)|(\d+)(%)|(\d*\.\d+)(%)))?\s*\)/;
					if (t.test(e)) {
						let n = e.match(t).filter((e) => e !== void 0);
						e = Kt({
							h: parseFloat(n[1]) * (n[2] === "turn" ? 360 : 1),
							s: parseFloat(n[3]),
							l: parseFloat(n[4]),
							a: n[5] ? parseFloat(n[5]) / (n[6] ? 100 : 1) : 1
						});
					} else i = !1;
				}
			}
			if (!i) throw Error(`Invalid color format: ${e}`);
			return Yt(e, t);
		}
		function Yt(e, t = "hexa") {
			if (e === "currentColor") return e;
			if (Number.isInteger(e)) {
				if (t == "raw" || t == "cpal") return e;
				e = Ht(e);
			} else typeof e != "object" && (e = Jt(e, "bgra"));
			let n = ["hsl", "hsla"].includes(t) ? Gt(e) : null;
			switch (t) {
				case "rgba": return `rgba(${e.r}, ${e.g}, ${e.b}, ${parseFloat(e.a.toFixed(3))})`;
				case "rgb": return `rgb(${e.r}, ${e.g}, ${e.b})`;
				case "hex":
				case "hex6":
				case "hex-6": return `#${Wt(e.r)}${Wt(e.g)}${Wt(e.b)}`;
				case "hexa":
				case "hex8":
				case "hex-8": return `#${Wt(e.r)}${Wt(e.g)}${Wt(e.b)}${Wt(e.a * 255)}`;
				case "hsl": return `hsl(${n.h.toFixed(2)}, ${n.s.toFixed(2)}%, ${n.l.toFixed(2)}%)`;
				case "hsla": return `hsla(${n.h.toFixed(2)}, ${n.s.toFixed(2)}%, ${n.l.toFixed(2)}%, ${parseFloat(e.a.toFixed(3))})`;
				case "bgra": return e;
				case "raw":
				case "cpal": return qt(e);
				default: throw Error("Unknown color format: " + t);
			}
		}
		var Xt = {
			parse: Bt,
			make: Vt,
			getPaletteColor: Ut,
			parseColor: Jt,
			formatColor: Yt
		};
		function Zt(e, t) {
			let n = t || new ue();
			return {
				configurable: !0,
				get: function() {
					return typeof n == "function" && (n = n()), n;
				},
				set: function(e) {
					n = e;
				}
			};
		}
		function Qt(e) {
			this.bindConstructorValues(e);
		}
		Qt.prototype.bindConstructorValues = function(e) {
			if (this.index = e.index || 0, e.name === ".notdef" ? e.unicode = void 0 : e.name === ".null" && (e.unicode = 0), e.unicode === 0 && e.name !== ".null") throw Error("The unicode value \"0\" is reserved for the glyph name \".null\" and cannot be used by any other glyph.");
			this.name = e.name || null, this.unicode = e.unicode, this.unicodes = e.unicodes || (e.unicode === void 0 ? [] : [e.unicode]), "xMin" in e && (this.xMin = e.xMin), "yMin" in e && (this.yMin = e.yMin), "xMax" in e && (this.xMax = e.xMax), "yMax" in e && (this.yMax = e.yMax), "advanceWidth" in e && (this.advanceWidth = e.advanceWidth), "leftSideBearing" in e && (this.leftSideBearing = e.leftSideBearing), "points" in e && (this.points = e.points), Object.defineProperty(this, "path", Zt(this, e.path));
		}, Qt.prototype.addUnicode = function(e) {
			this.unicodes.length === 0 && (this.unicode = e), this.unicodes.push(e);
		}, Qt.prototype.getBoundingBox = function() {
			return this.path.getBoundingBox();
		}, Qt.prototype.getPath = function(e, t, n, r, i) {
			e = e === void 0 ? 0 : e, t = t === void 0 ? 0 : t, n = n === void 0 ? 72 : n, r = Object.assign({}, i && i.defaultRenderOptions, r);
			let a, o, s = r.xScale, c = r.yScale, l = 1 / (this.path.unitsPerEm || 1e3) * n, u = this;
			i && i.variation && (u = i.variation.getTransform(this, r.variation), a = u.path.commands), r.hinting && i && i.hinting && (o = u.path && i.hinting.exec(u, n, r)), o ? (a = i.hinting.getCommands(o), e = Math.round(e), t = Math.round(t), s = c = 1) : (a = u.path.commands, s === void 0 && (s = l), c === void 0 && (c = l));
			let d = new ue();
			if (r.drawSVG) {
				let n = this.getSvgImage(i);
				if (n) {
					let r = new ue();
					return r._image = {
						image: n.image,
						x: e + n.leftSideBearing * l,
						y: t - n.baseline * l,
						width: n.image.width * l,
						height: n.image.height * l
					}, d._layers = [r], d;
				}
			}
			if (r.drawLayers) {
				let a = this.getLayers(i);
				if (a && a.length) {
					d._layers = [];
					for (let o = 0; o < a.length; o += 1) {
						let s = a[o], c = Ut(i, s.paletteIndex, r.usePalette);
						c = c === "currentColor" ? r.fill || "black" : Yt(c, r.colorFormat || "rgba"), r = Object.assign({}, r, { fill: c }), d._layers.push(this.getPath.call(s.glyph, e, t, n, r, i));
					}
					return d;
				}
			}
			d.fill = r.fill || this.path.fill, d.stroke = this.path.stroke, d.strokeWidth = this.path.strokeWidth * l;
			for (let n = 0; n < a.length; n += 1) {
				let r = a[n];
				r.type === "M" ? d.moveTo(e + r.x * s, t + -r.y * c) : r.type === "L" ? d.lineTo(e + r.x * s, t + -r.y * c) : r.type === "Q" ? d.quadraticCurveTo(e + r.x1 * s, t + -r.y1 * c, e + r.x * s, t + -r.y * c) : r.type === "C" ? d.curveTo(e + r.x1 * s, t + -r.y1 * c, e + r.x2 * s, t + -r.y2 * c, e + r.x * s, t + -r.y * c) : r.type === "Z" && d.stroke && d.strokeWidth && d.closePath();
			}
			return d;
		}, Qt.prototype.getLayers = function(e) {
			if (!e) throw Error("The font object is required to read the colr/cpal tables in order to get the layers.");
			return e.layers.get(this.index);
		}, Qt.prototype.getSvgImage = function(e) {
			if (!e) throw Error("The font object is required to read the svg table in order to get the image.");
			return e.svgImages.get(this.index);
		}, Qt.prototype.getContours = function(e = null) {
			if (this.points === void 0 && !e) return [];
			let t = [], n = [], r = e || this.points;
			for (let e = 0; e < r.length; e += 1) {
				let i = r[e];
				n.push(i), i.lastPointOfContour && (t.push(n), n = []);
			}
			return j.argument(n.length === 0, "There are still points left in the current contour."), t;
		}, Qt.prototype.getMetrics = function() {
			let e = this.path.commands, t = [], n = [];
			for (let r = 0; r < e.length; r += 1) {
				let i = e[r];
				i.type !== "Z" && (t.push(i.x), n.push(i.y)), (i.type === "Q" || i.type === "C") && (t.push(i.x1), n.push(i.y1)), i.type === "C" && (t.push(i.x2), n.push(i.y2));
			}
			let r = {
				xMin: Math.min.apply(null, t),
				yMin: Math.min.apply(null, n),
				xMax: Math.max.apply(null, t),
				yMax: Math.max.apply(null, n),
				leftSideBearing: this.leftSideBearing
			};
			return isFinite(r.xMin) || (r.xMin = 0), isFinite(r.xMax) || (r.xMax = this.advanceWidth), isFinite(r.yMin) || (r.yMin = 0), isFinite(r.yMax) || (r.yMax = 0), r.rightSideBearing = this.advanceWidth - r.leftSideBearing - (r.xMax - r.xMin), r;
		}, Qt.prototype.draw = function(e, t, n, r, i, a) {
			i = Object.assign({}, a && a.defaultRenderOptions, i), this.getPath(t, n, r, i, a).draw(e);
		}, Qt.prototype.drawPoints = function(e, t, n, r, i, a) {
			if (i = Object.assign({}, a && a.defaultRenderOptions, i), i.drawLayers) {
				let i = this.getLayers(a);
				if (i && i.length) {
					for (let a = 0; a < i.length; a += 1) i[a].glyph.index !== this.index && this.drawPoints.call(i[a].glyph, e, t, n, r);
					return;
				}
			}
			function o(t, n, r, i) {
				e.beginPath();
				for (let a = 0; a < t.length; a += 1) e.moveTo(n + t[a].x * i, r + t[a].y * i), e.arc(n + t[a].x * i, r + t[a].y * i, 2, 0, Math.PI * 2, !1);
				e.fill();
			}
			t = t === void 0 ? 0 : t, n = n === void 0 ? 0 : n, r = r === void 0 ? 24 : r;
			let s = 1 / this.path.unitsPerEm * r, c = [], l = [], u = this.path.commands;
			a && a.variation && (u = a.variation.getTransform(this, i.variation).path.commands);
			for (let e = 0; e < u.length; e += 1) {
				let t = u[e];
				t.x !== void 0 && c.push({
					x: t.x,
					y: -t.y
				}), t.x1 !== void 0 && l.push({
					x: t.x1,
					y: -t.y1
				}), t.x2 !== void 0 && l.push({
					x: t.x2,
					y: -t.y2
				});
			}
			e.fillStyle = "blue", o(c, t, n, s), e.fillStyle = "red", o(l, t, n, s);
		}, Qt.prototype.drawMetrics = function(e, t, n, r) {
			let i;
			t = t === void 0 ? 0 : t, n = n === void 0 ? 0 : n, r = r === void 0 ? 24 : r, i = 1 / this.path.unitsPerEm * r, e.lineWidth = 1, e.strokeStyle = "black", zt.line(e, t, -1e4, t, 1e4), zt.line(e, -1e4, n, 1e4, n);
			let a = this.xMin || 0, o = this.yMin || 0, s = this.xMax || 0, c = this.yMax || 0, l = this.advanceWidth || 0;
			e.strokeStyle = "blue", zt.line(e, t + a * i, -1e4, t + a * i, 1e4), zt.line(e, t + s * i, -1e4, t + s * i, 1e4), zt.line(e, -1e4, n + -o * i, 1e4, n + -o * i), zt.line(e, -1e4, n + -c * i, 1e4, n + -c * i), e.strokeStyle = "green", zt.line(e, t + l * i, -1e4, t + l * i, 1e4);
		}, Qt.prototype.toPathData = function(e, t) {
			e = Object.assign({}, { variation: t && t.defaultRenderOptions.variation }, e);
			let n = this;
			t && t.variation && (n = t.variation.getTransform(this, e.variation));
			let r = n.points && e.pointsTransform ? e.pointsTransform(n.points) : n.path;
			return e.pathTransform && (r = e.pathTransform(r)), r.toPathData(e);
		}, Qt.prototype.fromSVG = function(e, t = {}) {
			return this.path.fromSVG(e, t);
		}, Qt.prototype.toSVG = function(e, t) {
			let n = this.toPathData.apply(this, [e, t]);
			return this.path.toSVG(e, n);
		}, Qt.prototype.toDOMElement = function(e, t) {
			e = Object.assign({}, { variation: t && t.defaultRenderOptions.variation }, e);
			let n = this.path;
			return t && t.variation && (n = t.variation.getTransform(this, e.variation).path), n.toDOMElement(e);
		};
		var $t = Qt;
		function en(e, t, n) {
			Object.defineProperty(e, t, {
				get: function() {
					return e[n] === void 0 && e.path, e[n];
				},
				set: function(t) {
					e[n] = t;
				},
				enumerable: !0,
				configurable: !0
			});
		}
		function tn(e, t) {
			if (this.font = e, this.glyphs = {}, Array.isArray(t)) for (let n = 0; n < t.length; n++) {
				let r = t[n];
				r.path.unitsPerEm = e.unitsPerEm, this.glyphs[n] = r;
			}
			this.length = t && t.length || 0;
		}
		typeof Symbol < "u" && Symbol.iterator && (tn.prototype[Symbol.iterator] = function() {
			let e = -1;
			return { next: function() {
				e++;
				let t = e >= this.length - 1;
				return {
					value: this.get(e),
					done: t
				};
			}.bind(this) };
		}), tn.prototype.get = function(e) {
			if (this.font._push && this.glyphs[e] === void 0) {
				this.font._push(e), typeof this.glyphs[e] == "function" && (this.glyphs[e] = this.glyphs[e]());
				let t = this.glyphs[e], n = this.font._IndexToUnicodeMap[e];
				if (n) for (let e = 0; e < n.unicodes.length; e++) t.addUnicode(n.unicodes[e]);
				this.font.cffEncoding ? t.name = this.font.cffEncoding.charset[e] : this.font.glyphNames.names && (t.name = this.font.glyphNames.glyphIndexToName(e)), this.glyphs[e].advanceWidth = this.font._hmtxTableData[e].advanceWidth, this.glyphs[e].leftSideBearing = this.font._hmtxTableData[e].leftSideBearing;
			} else typeof this.glyphs[e] == "function" && (this.glyphs[e] = this.glyphs[e]());
			return this.glyphs[e];
		}, tn.prototype.push = function(e, t) {
			this.glyphs[e] = t, this.length++;
		};
		function nn(e, t) {
			return new $t({
				index: t,
				font: e
			});
		}
		function z(e, t, n, r, i, a) {
			return function() {
				let o = new $t({
					index: t,
					font: e
				});
				return o.path = function() {
					n(o, r, i);
					let t = a(e.glyphs, o);
					return t.unitsPerEm = e.unitsPerEm, t;
				}, en(o, "numberOfContours", "_numberOfContours"), en(o, "xMin", "_xMin"), en(o, "xMax", "_xMax"), en(o, "yMin", "_yMin"), en(o, "yMax", "_yMax"), en(o, "points", "_points"), o;
			};
		}
		function rn(e, t, n, r, i) {
			return function() {
				let a = new $t({
					index: t,
					font: e
				});
				return a.path = function() {
					let t = n(e, a, r, i);
					return t.unitsPerEm = e.unitsPerEm, t;
				}, a;
			};
		}
		var B = {
			GlyphSet: tn,
			glyphLoader: nn,
			ttfGlyphLoader: z,
			cffGlyphLoader: rn
		};
		function an(e, t) {
			if (e === t) return !0;
			if (Array.isArray(e) && Array.isArray(t)) {
				if (e.length !== t.length) return !1;
				for (let n = 0; n < e.length; n += 1) if (!an(e[n], t[n])) return !1;
				return !0;
			} else return !1;
		}
		var on = 10;
		function sn(e) {
			let t;
			return t = e.length < 1240 ? 107 : e.length < 33900 ? 1131 : 32768, t;
		}
		function cn(e, t, n, r) {
			let i = [], a = [], o = r > 1 ? R.getULong(e, t) : R.getCard16(e, t), s = r > 1 ? 4 : 2, c, l;
			if (o !== 0) {
				let n = R.getByte(e, t + s);
				c = t + (o + 1) * n + s;
				let r = t + s + 1;
				for (let t = 0; t < o + 1; t += 1) i.push(R.getOffset(e, r, n)), r += n;
				l = c + i[o];
			} else l = t + s;
			for (let o = 0; o < i.length - 1; o += 1) {
				let s = R.getBytes(e, c + i[o], c + i[o + 1]);
				n && (s = n(s, e, t, r)), a.push(s);
			}
			return {
				objects: a,
				startOffset: t,
				endOffset: l
			};
		}
		function ln(e, t, n) {
			let r = [], i = n > 1 ? R.getULong(e, t) : R.getCard16(e, t), a = n > 1 ? 4 : 2, o, s;
			if (i !== 0) {
				let n = R.getByte(e, t + a);
				o = t + (i + 1) * n + a;
				let c = t + a + 1;
				for (let t = 0; t < i + 1; t += 1) r.push(R.getOffset(e, c, n)), c += n;
				s = o + r[i];
			} else s = t + a;
			return {
				offsets: r,
				startOffset: t,
				endOffset: s
			};
		}
		function un(e, t, n, r, i, a) {
			let o = a > 1 ? R.getULong(n, r) : R.getCard16(n, r), s = a > 1 ? 4 : 2, c = 0;
			if (o !== 0) {
				let e = R.getByte(n, r + s);
				c = r + (o + 1) * e + s;
			}
			let l = R.getBytes(n, c + t[e], c + t[e + 1]);
			return i && (l = i(l)), l;
		}
		function dn(e) {
			let t = "", n = [
				"0",
				"1",
				"2",
				"3",
				"4",
				"5",
				"6",
				"7",
				"8",
				"9",
				".",
				"E",
				"E-",
				null,
				"-"
			];
			for (;;) {
				let r = e.parseByte(), i = r >> 4, a = r & 15;
				if (i === 15 || (t += n[i], a === 15)) break;
				t += n[a];
			}
			return parseFloat(t);
		}
		function fn(e, t) {
			let n, r, i, a;
			if (t === 28) return n = e.parseByte(), r = e.parseByte(), n << 8 | r;
			if (t === 29) return n = e.parseByte(), r = e.parseByte(), i = e.parseByte(), a = e.parseByte(), n << 24 | r << 16 | i << 8 | a;
			if (t === 30) return dn(e);
			if (t >= 32 && t <= 246) return t - 139;
			if (t >= 247 && t <= 250) return n = e.parseByte(), (t - 247) * 256 + n + 108;
			if (t >= 251 && t <= 254) return n = e.parseByte(), -(t - 251) * 256 - n - 108;
			throw Error("Invalid b0 " + t);
		}
		function pn(e) {
			let t = {};
			for (let n = 0; n < e.length; n += 1) {
				let r = e[n][0], i = e[n][1], a;
				if (a = i.length === 1 ? i[0] : i, Object.prototype.hasOwnProperty.call(t, r) && !isNaN(t[r])) throw Error("Object " + t + " already has key " + r);
				t[r] = a;
			}
			return t;
		}
		function mn(e, t, n, r) {
			t = t === void 0 ? 0 : t;
			let i = new R.Parser(e, t), a = [], o = [];
			n = n === void 0 ? e.byteLength : n;
			let s = r < 2 ? 22 : 28;
			for (; i.relativeOffset < n;) {
				let e = i.parseByte();
				if (e < s) {
					if (e === 12 && (e = 1200 + i.parseByte()), r > 1 && e === 23) {
						An(o);
						continue;
					}
					a.push([e, o]), o = [];
				} else o.push(fn(i, e, r));
			}
			return pn(a);
		}
		function hn(e, t) {
			return t = t <= 390 ? wt[t] : e ? e[t - 391] : void 0, t;
		}
		function gn(e, t, n) {
			let r = {}, i;
			for (let a = 0; a < t.length; a += 1) {
				let o = t[a];
				if (Array.isArray(o.type)) {
					let t = [];
					t.length = o.type.length;
					for (let r = 0; r < o.type.length; r++) i = e[o.op] === void 0 ? void 0 : e[o.op][r], i === void 0 && (i = o.value !== void 0 && o.value[r] !== void 0 ? o.value[r] : null), o.type[r] === "SID" && (i = hn(n, i)), t[r] = i;
					r[o.name] = t;
				} else i = e[o.op], i === void 0 && (i = o.value === void 0 ? null : o.value), o.type === "SID" && (i = hn(n, i)), r[o.name] = i;
			}
			return r;
		}
		function _n(e, t) {
			let n = {};
			if (n.formatMajor = R.getCard8(e, t), n.formatMinor = R.getCard8(e, t + 1), n.formatMajor > 2) throw Error(`Unsupported CFF table version ${n.formatMajor}.${n.formatMinor}`);
			return n.size = R.getCard8(e, t + 2), n.formatMajor < 2 ? (n.offsetSize = R.getCard8(e, t + 3), n.startOffset = t, n.endOffset = t + 4) : (n.topDictLength = R.getCard16(e, t + 3), n.endOffset = t + 8), n;
		}
		var vn = [
			{
				name: "version",
				op: 0,
				type: "SID"
			},
			{
				name: "notice",
				op: 1,
				type: "SID"
			},
			{
				name: "copyright",
				op: 1200,
				type: "SID"
			},
			{
				name: "fullName",
				op: 2,
				type: "SID"
			},
			{
				name: "familyName",
				op: 3,
				type: "SID"
			},
			{
				name: "weight",
				op: 4,
				type: "SID"
			},
			{
				name: "isFixedPitch",
				op: 1201,
				type: "number",
				value: 0
			},
			{
				name: "italicAngle",
				op: 1202,
				type: "number",
				value: 0
			},
			{
				name: "underlinePosition",
				op: 1203,
				type: "number",
				value: -100
			},
			{
				name: "underlineThickness",
				op: 1204,
				type: "number",
				value: 50
			},
			{
				name: "paintType",
				op: 1205,
				type: "number",
				value: 0
			},
			{
				name: "charstringType",
				op: 1206,
				type: "number",
				value: 2
			},
			{
				name: "fontMatrix",
				op: 1207,
				type: [
					"real",
					"real",
					"real",
					"real",
					"real",
					"real"
				],
				value: [
					.001,
					0,
					0,
					.001,
					0,
					0
				]
			},
			{
				name: "uniqueId",
				op: 13,
				type: "number"
			},
			{
				name: "fontBBox",
				op: 5,
				type: [
					"number",
					"number",
					"number",
					"number"
				],
				value: [
					0,
					0,
					0,
					0
				]
			},
			{
				name: "strokeWidth",
				op: 1208,
				type: "number",
				value: 0
			},
			{
				name: "xuid",
				op: 14,
				type: [],
				value: null
			},
			{
				name: "charset",
				op: 15,
				type: "offset",
				value: 0
			},
			{
				name: "encoding",
				op: 16,
				type: "offset",
				value: 0
			},
			{
				name: "charStrings",
				op: 17,
				type: "offset",
				value: 0
			},
			{
				name: "private",
				op: 18,
				type: ["number", "offset"],
				value: [0, 0]
			},
			{
				name: "ros",
				op: 1230,
				type: [
					"SID",
					"SID",
					"number"
				]
			},
			{
				name: "cidFontVersion",
				op: 1231,
				type: "number",
				value: 0
			},
			{
				name: "cidFontRevision",
				op: 1232,
				type: "number",
				value: 0
			},
			{
				name: "cidFontType",
				op: 1233,
				type: "number",
				value: 0
			},
			{
				name: "cidCount",
				op: 1234,
				type: "number",
				value: 8720
			},
			{
				name: "uidBase",
				op: 1235,
				type: "number"
			},
			{
				name: "fdArray",
				op: 1236,
				type: "offset"
			},
			{
				name: "fdSelect",
				op: 1237,
				type: "offset"
			},
			{
				name: "fontName",
				op: 1238,
				type: "SID"
			}
		], yn = [
			{
				name: "fontMatrix",
				op: 1207,
				type: [
					"real",
					"real",
					"real",
					"real",
					"real",
					"real"
				],
				value: [
					.001,
					0,
					0,
					.001,
					0,
					0
				]
			},
			{
				name: "charStrings",
				op: 17,
				type: "offset"
			},
			{
				name: "fdArray",
				op: 1236,
				type: "offset"
			},
			{
				name: "fdSelect",
				op: 1237,
				type: "offset"
			},
			{
				name: "vstore",
				op: 24,
				type: "offset"
			}
		], bn = [
			{
				name: "subrs",
				op: 19,
				type: "offset",
				value: 0
			},
			{
				name: "defaultWidthX",
				op: 20,
				type: "number",
				value: 0
			},
			{
				name: "nominalWidthX",
				op: 21,
				type: "number",
				value: 0
			}
		], xn = [
			{
				name: "blueValues",
				op: 6,
				type: "delta"
			},
			{
				name: "otherBlues",
				op: 7,
				type: "delta"
			},
			{
				name: "familyBlues",
				op: 7,
				type: "delta"
			},
			{
				name: "familyBlues",
				op: 8,
				type: "delta"
			},
			{
				name: "familyOtherBlues",
				op: 9,
				type: "delta"
			},
			{
				name: "blueScale",
				op: 1209,
				type: "number",
				value: .039625
			},
			{
				name: "blueShift",
				op: 1210,
				type: "number",
				value: 7
			},
			{
				name: "blueFuzz",
				op: 1211,
				type: "number",
				value: 1
			},
			{
				name: "stdHW",
				op: 10,
				type: "number"
			},
			{
				name: "stdVW",
				op: 11,
				type: "number"
			},
			{
				name: "stemSnapH",
				op: 1212,
				type: "number"
			},
			{
				name: "stemSnapV",
				op: 1213,
				type: "number"
			},
			{
				name: "languageGroup",
				op: 1217,
				type: "number",
				value: 0
			},
			{
				name: "expansionFactor",
				op: 1218,
				type: "number",
				value: .06
			},
			{
				name: "vsindex",
				op: 22,
				type: "number",
				value: 0
			},
			{
				name: "subrs",
				op: 19,
				type: "offset"
			}
		], Sn = [{
			name: "private",
			op: 18,
			type: ["number", "offset"],
			value: [0, 0]
		}];
		function Cn(e, t, n, r) {
			return gn(mn(e, t, e.byteLength, r), r > 1 ? yn : vn, n);
		}
		function wn(e, t, n, r, i) {
			return gn(mn(e, t, n, i), i > 1 ? xn : bn, r);
		}
		function Tn(e, t, n) {
			return gn(mn(e, t, void 0, n), Sn);
		}
		function En(e, t, n) {
			let r = [];
			for (let i = 0; i < n.length; i++) {
				let a = Tn(new DataView(new Uint8Array(n[i]).buffer), 0, 2), o = a.private[0], s = a.private[1];
				if (o !== 0 && s !== 0) {
					let n = wn(e, s + t, o, [], 2);
					n.subrs && (a._subrs = cn(e, s + n.subrs + t, void 0, 2).objects, a._subrsBias = sn(a._subrs)), a._privateDict = n;
				}
				r.push(a);
			}
			return r;
		}
		function Dn(e, t, n, r, i) {
			let a = [];
			for (let o = 0; o < n.length; o += 1) {
				let s = Cn(new DataView(new Uint8Array(n[o]).buffer), 0, r, i);
				s._subrs = [], s._subrsBias = 0, s._defaultWidthX = 0, s._nominalWidthX = 0;
				let c = i < 2 ? s.private[0] : 0, l = i < 2 ? s.private[1] : 0;
				if (c !== 0 && l !== 0) {
					let n = wn(e, l + t, c, r, i);
					s._defaultWidthX = n.defaultWidthX, s._nominalWidthX = n.nominalWidthX, n.subrs !== 0 && (s._subrs = cn(e, l + n.subrs + t, void 0, i).objects, s._subrsBias = sn(s._subrs)), s._privateDict = n;
				}
				a.push(s);
			}
			return a;
		}
		function On(e, t, n, r, i) {
			let a, o, s = new R.Parser(e, t);
			--n;
			let c = [".notdef"], l = s.parseCard8();
			if (l === 0) for (let e = 0; e < n; e += 1) a = s.parseSID(), i ? c.push(a) : c.push(hn(r, a) || a);
			else if (l === 1) for (; c.length <= n;) {
				a = s.parseSID(), o = s.parseCard8();
				for (let e = 0; e <= o; e += 1) i ? c.push("cid" + ("00000" + a).slice(-5)) : c.push(hn(r, a) || a), a += 1;
			}
			else if (l === 2) for (; c.length <= n;) {
				a = s.parseSID(), o = s.parseCard16();
				for (let e = 0; e <= o; e += 1) i ? c.push("cid" + ("00000" + a).slice(-5)) : c.push(hn(r, a) || a), a += 1;
			}
			else throw Error("Unknown charset format " + l);
			return c;
		}
		function kn(e, t) {
			let n, r = {}, i = new R.Parser(e, t), a = i.parseCard8();
			if (a === 0) {
				let e = i.parseCard8();
				for (let t = 0; t < e; t += 1) n = i.parseCard8(), r[n] = t;
			} else if (a === 1) {
				let e = i.parseCard8();
				n = 1;
				for (let t = 0; t < e; t += 1) {
					let e = i.parseCard8(), t = i.parseCard8();
					for (let i = e; i <= e + t; i += 1) r[i] = n, n += 1;
				}
			} else throw Error("Unknown encoding format " + a);
			return r;
		}
		function An(e) {
			let t = e.pop();
			for (; e.length > t;) e.pop();
		}
		function jn(e, t) {
			let n = e.tables.cff && e.tables.cff.topDict && e.tables.cff.topDict.paintType || 0;
			return n === 2 && (t.fill = null, t.stroke = "black", t.strokeWidth = e.tables.cff.topDict.strokeWidth || 0), n;
		}
		function Mn(e, t, n, r, i) {
			let a, o, s, c, l = new ue(), u = [], d = 0, f = !1, p = !1, m = 0, h = 0, g, _, v, y, b = 0, ee = [], x, S = 0, C = e.tables.cff2 || e.tables.cff;
			if (v = C.topDict._defaultWidthX, y = C.topDict._nominalWidthX, i ||= e.variation && e.variation.get(), t.getBlendPath ||= function(i) {
				return Mn(e, t, n, r, i);
			}, e.isCIDFont || r > 1) {
				let e = C.topDict._fdSelect ? C.topDict._fdSelect[t.index] : 0, n = C.topDict._fdArray[e];
				g = n._subrs, _ = n._subrsBias, r > 1 ? (ee = C.topDict._vstore.itemVariationStore, b = n._privateDict.vsindex) : (v = n._defaultWidthX, y = n._nominalWidthX);
			} else g = C.topDict._subrs, _ = C.topDict._subrsBias;
			let te = jn(e, l), w = v;
			function T(e, t) {
				p && te !== 2 && l.closePath(), l.moveTo(e, t), p = !0;
			}
			function E() {
				let e;
				e = (u.length & 1) != 0, e && !f && (w = u.shift() + y), d += u.length >> 1, u.length = 0, f = !0;
			}
			function ne(n) {
				let v, C, re, ie, ae, oe, se, D, O, ce, le, k, A = 0;
				for (; A < n.length;) {
					let he = n[A];
					switch (A += 1, he) {
						case 1:
							E();
							break;
						case 3:
							E();
							break;
						case 4:
							u.length > 1 && !f && (w = u.shift() + y, f = !0), h += u.pop(), T(m, h);
							break;
						case 5:
							for (; u.length > 0;) m += u.shift(), h += u.shift(), l.lineTo(m, h);
							break;
						case 6:
							for (; u.length > 0 && (m += u.shift(), l.lineTo(m, h), u.length !== 0);) h += u.shift(), l.lineTo(m, h);
							break;
						case 7:
							for (; u.length > 0 && (h += u.shift(), l.lineTo(m, h), u.length !== 0);) m += u.shift(), l.lineTo(m, h);
							break;
						case 8:
							for (; u.length > 0;) a = m + u.shift(), o = h + u.shift(), s = a + u.shift(), c = o + u.shift(), m = s + u.shift(), h = c + u.shift(), l.curveTo(a, o, s, c, m, h);
							break;
						case 10:
							if (ae = u.pop() + _, oe = g[ae], oe) {
								if (S >= on) {
									console.warn("CFF charstring subroutine call depth exceeded, skipping callsubr");
									break;
								}
								S++, ne(oe), S--;
							}
							break;
						case 11:
							if (r > 1) {
								console.error("CFF CharString operator return (11) is not supported in CFF2");
								break;
							}
							return;
						case 12:
							switch (he = n[A], A += 1, he) {
								case 35:
									a = m + u.shift(), o = h + u.shift(), s = a + u.shift(), c = o + u.shift(), se = s + u.shift(), D = c + u.shift(), O = se + u.shift(), ce = D + u.shift(), le = O + u.shift(), k = ce + u.shift(), m = le + u.shift(), h = k + u.shift(), u.shift(), l.curveTo(a, o, s, c, se, D), l.curveTo(O, ce, le, k, m, h);
									break;
								case 34:
									a = m + u.shift(), o = h, s = a + u.shift(), c = o + u.shift(), se = s + u.shift(), D = c, O = se + u.shift(), ce = c, le = O + u.shift(), k = h, m = le + u.shift(), l.curveTo(a, o, s, c, se, D), l.curveTo(O, ce, le, k, m, h);
									break;
								case 36:
									a = m + u.shift(), o = h + u.shift(), s = a + u.shift(), c = o + u.shift(), se = s + u.shift(), D = c, O = se + u.shift(), ce = c, le = O + u.shift(), k = ce + u.shift(), m = le + u.shift(), l.curveTo(a, o, s, c, se, D), l.curveTo(O, ce, le, k, m, h);
									break;
								case 37:
									a = m + u.shift(), o = h + u.shift(), s = a + u.shift(), c = o + u.shift(), se = s + u.shift(), D = c + u.shift(), O = se + u.shift(), ce = D + u.shift(), le = O + u.shift(), k = ce + u.shift(), Math.abs(le - m) > Math.abs(k - h) ? m = le + u.shift() : h = k + u.shift(), l.curveTo(a, o, s, c, se, D), l.curveTo(O, ce, le, k, m, h);
									break;
								default: console.log("Glyph " + t.index + ": unknown operator 1200" + he), u.length = 0;
							}
							break;
						case 14:
							if (r > 1) {
								console.error("CFF CharString operator endchar (14) is not supported in CFF2");
								break;
							}
							if (u.length >= 4) {
								let n = Ot[u.pop()], r = Ot[u.pop()], i = u.pop(), a = u.pop();
								if (n && r) {
									t.isComposite = !0, t.components = [];
									let o = e.cffEncoding.charset.indexOf(n), s = e.cffEncoding.charset.indexOf(r);
									t.components.push({
										glyphIndex: s,
										dx: 0,
										dy: 0
									}), t.components.push({
										glyphIndex: o,
										dx: a,
										dy: i
									}), l.extend(e.glyphs.get(s).path);
									let c = e.glyphs.get(o), u = JSON.parse(JSON.stringify(c.path.commands));
									for (let e = 0; e < u.length; e += 1) {
										let t = u[e];
										t.type !== "Z" && (t.x += a, t.y += i), (t.type === "Q" || t.type === "C") && (t.x1 += a, t.y1 += i), t.type === "C" && (t.x2 += a, t.y2 += i);
									}
									l.extend(u);
								}
							} else u.length > 0 && !f && (w = u.shift() + y, f = !0);
							p && te !== 2 && (l.closePath(), p = !1);
							break;
						case 15:
							if (r < 2) {
								console.error("CFF2 CharString operator vsindex (15) is not supported in CFF");
								break;
							}
							b = u.pop();
							break;
						case 16:
							if (r < 2) {
								console.error("CFF2 CharString operator blend (16) is not supported in CFF");
								break;
							}
							x ||= e.variation && i && e.variation.process.getBlendVector(ee, b, i);
							var ue = u.pop(), de = x ? x.length : ee.itemVariationSubtables[b].regionIndexes.length, fe = ue * de, j = u.length - fe, pe = j - ue;
							if (x) for (let e = 0; e < ue; e++) {
								var me = u[pe + e];
								for (let e = 0; e < de; e++) me += x[e] * u[j++];
								u[pe + e] = me;
							}
							for (; fe--;) u.pop();
							break;
						case 18:
							E();
							break;
						case 19:
						case 20:
							E(), A += d + 7 >> 3;
							break;
						case 21:
							u.length > 2 && !f && (w = u.shift() + y, f = !0), h += u.pop(), m += u.pop(), T(m, h);
							break;
						case 22:
							u.length > 1 && !f && (w = u.shift() + y, f = !0), m += u.pop(), T(m, h);
							break;
						case 23:
							E();
							break;
						case 24:
							for (; u.length > 2;) a = m + u.shift(), o = h + u.shift(), s = a + u.shift(), c = o + u.shift(), m = s + u.shift(), h = c + u.shift(), l.curveTo(a, o, s, c, m, h);
							m += u.shift(), h += u.shift(), l.lineTo(m, h);
							break;
						case 25:
							for (; u.length > 6;) m += u.shift(), h += u.shift(), l.lineTo(m, h);
							a = m + u.shift(), o = h + u.shift(), s = a + u.shift(), c = o + u.shift(), m = s + u.shift(), h = c + u.shift(), l.curveTo(a, o, s, c, m, h);
							break;
						case 26:
							for (u.length & 1 && (m += u.shift()); u.length > 0;) a = m, o = h + u.shift(), s = a + u.shift(), c = o + u.shift(), m = s, h = c + u.shift(), l.curveTo(a, o, s, c, m, h);
							break;
						case 27:
							for (u.length & 1 && (h += u.shift()); u.length > 0;) a = m + u.shift(), o = h, s = a + u.shift(), c = o + u.shift(), m = s + u.shift(), h = c, l.curveTo(a, o, s, c, m, h);
							break;
						case 28:
							v = n[A], C = n[A + 1], u.push((v << 24 | C << 16) >> 16), A += 2;
							break;
						case 29:
							if (ae = u.pop() + e.gsubrsBias, oe = e.gsubrs[ae], oe) {
								if (S >= on) {
									console.warn("CFF charstring subroutine call depth exceeded, skipping callgsubr");
									break;
								}
								S++, ne(oe), S--;
							}
							break;
						case 30:
							for (; u.length > 0 && (a = m, o = h + u.shift(), s = a + u.shift(), c = o + u.shift(), m = s + u.shift(), h = c + (u.length === 1 ? u.shift() : 0), l.curveTo(a, o, s, c, m, h), u.length !== 0);) a = m + u.shift(), o = h, s = a + u.shift(), c = o + u.shift(), h = c + u.shift(), m = s + (u.length === 1 ? u.shift() : 0), l.curveTo(a, o, s, c, m, h);
							break;
						case 31:
							for (; u.length > 0 && (a = m + u.shift(), o = h, s = a + u.shift(), c = o + u.shift(), h = c + u.shift(), m = s + (u.length === 1 ? u.shift() : 0), l.curveTo(a, o, s, c, m, h), u.length !== 0);) a = m, o = h + u.shift(), s = a + u.shift(), c = o + u.shift(), m = s + u.shift(), h = c + (u.length === 1 ? u.shift() : 0), l.curveTo(a, o, s, c, m, h);
							break;
						default: he < 32 ? console.log("Glyph " + t.index + ": unknown operator " + he) : he < 247 ? u.push(he - 139) : he < 251 ? (v = n[A], A += 1, u.push((he - 247) * 256 + v + 108)) : he < 255 ? (v = n[A], A += 1, u.push(-(he - 251) * 256 - v - 108)) : (v = n[A], C = n[A + 1], re = n[A + 2], ie = n[A + 3], A += 4, u.push((v << 24 | C << 16 | re << 8 | ie) / 65536));
					}
				}
			}
			return ne(n), e.variation && i && (l.commands = l.commands.map((e) => {
				let t = Object.keys(e);
				for (let n = 0; n < t.length; n++) {
					let r = t[n];
					r !== "type" && (e[r] = Math.round(e[r]));
				}
				return e;
			})), f && (t.advanceWidth = w), l;
		}
		function Nn(e, t, n, r, i) {
			let a = [], o, s = new R.Parser(e, t), c = s.parseCard8();
			if (c === 0) for (let e = 0; e < n; e++) {
				if (o = s.parseCard8(), o >= r) throw Error("CFF table CID Font FDSelect has bad FD index value " + o + " (FD count " + r + ")");
				a.push(o);
			}
			else if (c === 3 || i > 1 && c === 4) {
				let e = c === 4 ? s.parseULong() : s.parseCard16(), t = c === 4 ? s.parseULong() : s.parseCard16();
				if (t !== 0) throw Error(`CFF Table CID Font FDSelect format ${c} range has bad initial GID ${t}`);
				let l;
				for (let u = 0; u < e; u++) {
					if (o = c === 4 ? s.parseUShort() : s.parseCard8(), l = c === 4 ? s.parseULong() : s.parseCard16(), o >= r) throw Error("CFF table CID Font FDSelect has bad FD index value " + o + " (FD count " + r + ")");
					if (l > n) throw Error(`CFF Table CID Font FDSelect format ${i} range has bad GID ${l}`);
					for (; t < l; t++) a.push(o);
					t = l;
				}
				if (l !== n) throw Error("CFF Table CID Font FDSelect format 3 range has bad final (Sentinal) GID " + l);
			} else throw Error("CFF Table CID Font FDSelect table has unsupported format " + c);
			return a;
		}
		function Pn(e, t, n, r) {
			let i, a = _n(e, t);
			i = a.formatMajor === 2 ? n.tables.cff2 = {} : n.tables.cff = {};
			let o = a.formatMajor > 1 ? null : cn(e, a.endOffset, R.bytesToString), s = a.formatMajor > 1 ? null : cn(e, o.endOffset), c = a.formatMajor > 1 ? null : cn(e, s.endOffset, R.bytesToString);
			n.gsubrs = cn(e, a.formatMajor > 1 ? t + a.size + a.topDictLength : c.endOffset, void 0, a.formatMajor).objects, n.gsubrsBias = sn(n.gsubrs);
			let l;
			if (a.formatMajor > 1) {
				let n = t + a.size;
				l = Dn(e, 0, [R.getBytes(e, n, n + a.topDictLength)], void 0, a.formatMajor)[0];
			} else {
				let n = Dn(e, t, s.objects, c.objects, a.formatMajor);
				if (n.length !== 1) throw Error("CFF table has too many fonts in 'FontSet' - count of fonts NameIndex.length = " + n.length);
				l = n[0];
			}
			if (i.topDict = l, l._privateDict && (n.defaultWidthX = l._privateDict.defaultWidthX, n.nominalWidthX = l._privateDict.nominalWidthX), a.formatMajor < 2 && l.ros[0] !== void 0 && l.ros[1] !== void 0 && (n.isCIDFont = !0), a.formatMajor > 1) {
				let r = l.fdArray, i = l.fdSelect;
				if (!r) throw Error("This is a CFF2 font, but FDArray information is missing");
				let o = En(e, t, cn(e, t + r, null, a.formatMajor).objects);
				l._fdArray = o, i && (l._fdSelect = Nn(e, t + i, n.numGlyphs, o.length, a.formatMajor));
			} else if (n.isCIDFont) {
				let r = l.fdArray, i = l.fdSelect;
				if (r === 0 || i === 0) throw Error("Font is marked as a CID font, but FDArray and/or FDSelect information is missing");
				r += t;
				let o = Dn(e, t, cn(e, r).objects, c.objects, a.formatMajor);
				l._fdArray = o, i += t, l._fdSelect = Nn(e, i, n.numGlyphs, o.length, a.formatMajor);
			}
			if (a.formatMajor < 2) {
				let r = t + l.private[1], i = wn(e, r, l.private[0], c.objects, a.formatMajor);
				n.defaultWidthX = i.defaultWidthX, n.nominalWidthX = i.nominalWidthX, i.subrs === 0 ? (n.subrs = [], n.subrsBias = 0) : (n.subrs = cn(e, r + i.subrs).objects, n.subrsBias = sn(n.subrs));
			}
			let u;
			if (r.lowMemory ? (u = ln(e, t + l.charStrings, a.formatMajor), n.nGlyphs = u.offsets.length - +(a.formatMajor > 1)) : (u = cn(e, t + l.charStrings, null, a.formatMajor), n.nGlyphs = u.objects.length), a.formatMajor > 1 && n.tables.maxp && n.nGlyphs !== n.tables.maxp.numGlyphs && console.error(`Glyph count in the CFF2 table (${n.nGlyphs}) must correspond to the glyph count in the maxp table (${n.tables.maxp.numGlyphs})`), a.formatMajor < 2) {
				let r = [], i = [];
				r = l.charset === 0 ? Tt : l.charset === 1 ? Et : l.charset === 2 ? Dt : On(e, t + l.charset, n.nGlyphs, c.objects, n.isCIDFont), i = l.encoding === 0 ? Ot : l.encoding === 1 ? kt : kn(e, t + l.encoding), n.cffEncoding = new Nt(i, r), n.encoding = n.encoding || n.cffEncoding;
			}
			if (n.glyphs = new B.GlyphSet(n), r.lowMemory) n._push = function(r) {
				let i = un(r, u.offsets, e, t + l.charStrings, void 0, a.formatMajor);
				n.glyphs.push(r, B.cffGlyphLoader(n, r, Mn, i, a.formatMajor));
			};
			else for (let e = 0; e < n.nGlyphs; e += 1) {
				let t = u.objects[e];
				n.glyphs.push(e, B.cffGlyphLoader(n, e, Mn, t, a.formatMajor));
			}
			if (l.vstore) {
				let n = new R.Parser(e, t + l.vstore);
				l._vstore = n.parseVariationStore();
			}
		}
		function Fn(e, t) {
			let n, r = wt.indexOf(e);
			return r >= 0 && (n = r), r = t.indexOf(e), r >= 0 ? n = r + wt.length : (n = wt.length + t.length, t.push(e)), n;
		}
		function In() {
			return new I.Record("Header", [
				{
					name: "major",
					type: "Card8",
					value: 1
				},
				{
					name: "minor",
					type: "Card8",
					value: 0
				},
				{
					name: "hdrSize",
					type: "Card8",
					value: 4
				},
				{
					name: "major",
					type: "Card8",
					value: 1
				}
			]);
		}
		function Ln(e) {
			let t = new I.Record("Name INDEX", [{
				name: "names",
				type: "INDEX",
				value: []
			}]);
			t.names = [];
			for (let n = 0; n < e.length; n += 1) t.names.push({
				name: "name_" + n,
				type: "NAME",
				value: e[n]
			});
			return t;
		}
		function Rn(e, t, n) {
			let r = {};
			for (let i = 0; i < e.length; i += 1) {
				let a = e[i], o = t[a.name];
				o !== void 0 && !an(o, a.value) && (a.type === "SID" && (o = Fn(o, n)), r[a.op] = {
					name: a.name,
					type: a.type,
					value: o
				});
			}
			return r;
		}
		function zn(e, t, n) {
			let r = new I.Record("Top DICT", [{
				name: "dict",
				type: "DICT",
				value: {}
			}]);
			return r.dict = Rn(n > 1 ? yn : vn, e, t), r;
		}
		function Bn(e) {
			let t = new I.Record("Top DICT INDEX", [{
				name: "topDicts",
				type: "INDEX",
				value: []
			}]);
			return t.topDicts = [{
				name: "topDict_0",
				type: "TABLE",
				value: e
			}], t;
		}
		function Vn(e) {
			let t = new I.Record("String INDEX", [{
				name: "strings",
				type: "INDEX",
				value: []
			}]);
			t.strings = [];
			for (let n = 0; n < e.length; n += 1) t.strings.push({
				name: "string_" + n,
				type: "STRING",
				value: e[n]
			});
			return t;
		}
		function Hn() {
			return new I.Record("Global Subr INDEX", [{
				name: "subrs",
				type: "INDEX",
				value: []
			}]);
		}
		function Un(e, t) {
			let n = new I.Record("Charsets", [{
				name: "format",
				type: "Card8",
				value: 0
			}]);
			for (let r = 0; r < e.length; r += 1) {
				let i = e[r], a = Fn(i, t);
				n.fields.push({
					name: "glyph_" + r,
					type: "SID",
					value: a
				});
			}
			return n;
		}
		function Wn(e, t) {
			let n = [], r = e.path;
			t < 2 && n.push({
				name: "width",
				type: "NUMBER",
				value: e.advanceWidth
			});
			let i = 0, a = 0;
			for (let e = 0; e < r.commands.length; e += 1) {
				let t, o, s = r.commands[e];
				if (s.type === "Q") {
					let e = 1 / 3, t = 2 / 3;
					s = {
						type: "C",
						x: s.x,
						y: s.y,
						x1: Math.round(e * i + t * s.x1),
						y1: Math.round(e * a + t * s.y1),
						x2: Math.round(e * s.x + t * s.x1),
						y2: Math.round(e * s.y + t * s.y1)
					};
				}
				if (s.type === "M") t = Math.round(s.x - i), o = Math.round(s.y - a), n.push({
					name: "dx",
					type: "NUMBER",
					value: t
				}), n.push({
					name: "dy",
					type: "NUMBER",
					value: o
				}), n.push({
					name: "rmoveto",
					type: "OP",
					value: 21
				}), i = Math.round(s.x), a = Math.round(s.y);
				else if (s.type === "L") t = Math.round(s.x - i), o = Math.round(s.y - a), n.push({
					name: "dx",
					type: "NUMBER",
					value: t
				}), n.push({
					name: "dy",
					type: "NUMBER",
					value: o
				}), n.push({
					name: "rlineto",
					type: "OP",
					value: 5
				}), i = Math.round(s.x), a = Math.round(s.y);
				else if (s.type === "C") {
					let e = Math.round(s.x1 - i), r = Math.round(s.y1 - a), c = Math.round(s.x2 - s.x1), l = Math.round(s.y2 - s.y1);
					t = Math.round(s.x - s.x2), o = Math.round(s.y - s.y2), n.push({
						name: "dx1",
						type: "NUMBER",
						value: e
					}), n.push({
						name: "dy1",
						type: "NUMBER",
						value: r
					}), n.push({
						name: "dx2",
						type: "NUMBER",
						value: c
					}), n.push({
						name: "dy2",
						type: "NUMBER",
						value: l
					}), n.push({
						name: "dx",
						type: "NUMBER",
						value: t
					}), n.push({
						name: "dy",
						type: "NUMBER",
						value: o
					}), n.push({
						name: "rrcurveto",
						type: "OP",
						value: 8
					}), i = Math.round(s.x), a = Math.round(s.y);
				}
			}
			return t < 2 && n.push({
				name: "endchar",
				type: "OP",
				value: 14
			}), n;
		}
		function Gn(e, t) {
			let n = new I.Record("CharStrings INDEX", [{
				name: "charStrings",
				type: "INDEX",
				value: []
			}]);
			for (let r = 0; r < e.length; r += 1) {
				let i = e.get(r), a = Wn(i, t);
				n.charStrings.push({
					name: i.name,
					type: "CHARSTRING",
					value: a
				});
			}
			return n;
		}
		function Kn(e, t, n) {
			let r = new I.Record("Private DICT", [{
				name: "dict",
				type: "DICT",
				value: {}
			}]);
			return r.dict = Rn(n > 1 ? xn : bn, e, t), r;
		}
		function qn(e, t) {
			let n = new I.Table("CFF ", [
				{
					name: "header",
					type: "RECORD"
				},
				{
					name: "nameIndex",
					type: "RECORD"
				},
				{
					name: "topDictIndex",
					type: "RECORD"
				},
				{
					name: "stringIndex",
					type: "RECORD"
				},
				{
					name: "globalSubrIndex",
					type: "RECORD"
				},
				{
					name: "charsets",
					type: "RECORD"
				},
				{
					name: "charStringsIndex",
					type: "RECORD"
				},
				{
					name: "privateDict",
					type: "RECORD"
				}
			]), r = 1 / t.unitsPerEm, i = {
				version: t.version,
				fullName: t.fullName,
				familyName: t.familyName,
				weight: t.weightName,
				fontBBox: t.fontBBox || [
					0,
					0,
					0,
					0
				],
				fontMatrix: [
					r,
					0,
					0,
					r,
					0,
					0
				],
				charset: 999,
				encoding: 0,
				charStrings: 999,
				private: [0, 999]
			}, a = t && t.topDict || {};
			a.paintType && (i.paintType = a.paintType, i.strokeWidth = a.strokeWidth || 0);
			let o = {}, s = [], c;
			for (let t = 1; t < e.length; t += 1) c = e.get(t), s.push(c.name);
			let l = [];
			n.header = In(), n.nameIndex = Ln([t.postScriptName]);
			let u = zn(i, l);
			return n.topDictIndex = Bn(u), n.globalSubrIndex = Hn(), n.charsets = Un(s, l), n.charStringsIndex = Gn(e, 1), n.privateDict = Kn(o, l), n.stringIndex = Vn(l), i.charset = n.header.sizeOf() + n.nameIndex.sizeOf() + n.topDictIndex.sizeOf() + n.stringIndex.sizeOf() + n.globalSubrIndex.sizeOf(), i.encoding = 0, i.charStrings = i.charset + n.charsets.sizeOf(), i.private[1] = i.charStrings + n.charStringsIndex.sizeOf(), u = zn(i, l), n.topDictIndex = Bn(u), n;
		}
		var Jn = {
			parse: Pn,
			make: qn
		};
		function Yn(e, t) {
			let n = {}, r = new R.Parser(e, t);
			return n.version = r.parseVersion(), n.fontRevision = Math.round(r.parseFixed() * 1e3) / 1e3, n.checkSumAdjustment = r.parseULong(), n.magicNumber = r.parseULong(), j.argument(n.magicNumber === 1594834165, "Font header has wrong magic number."), n.flags = r.parseUShort(), n.unitsPerEm = r.parseUShort(), n.created = r.parseLongDateTime(), n.modified = r.parseLongDateTime(), n.xMin = r.parseShort(), n.yMin = r.parseShort(), n.xMax = r.parseShort(), n.yMax = r.parseShort(), n.macStyle = r.parseUShort(), n.lowestRecPPEM = r.parseUShort(), n.fontDirectionHint = r.parseShort(), n.indexToLocFormat = r.parseShort(), n.glyphDataFormat = r.parseShort(), n;
		}
		function Xn(e) {
			let t = Math.round((/* @__PURE__ */ new Date()).getTime() / 1e3) + 2082844800, n = t, r = e.macStyle || 0;
			return e.createdTimestamp && (n = e.createdTimestamp + 2082844800), new I.Table("head", [
				{
					name: "version",
					type: "FIXED",
					value: 65536
				},
				{
					name: "fontRevision",
					type: "FIXED",
					value: 65536
				},
				{
					name: "checkSumAdjustment",
					type: "ULONG",
					value: 0
				},
				{
					name: "magicNumber",
					type: "ULONG",
					value: 1594834165
				},
				{
					name: "flags",
					type: "USHORT",
					value: 0
				},
				{
					name: "unitsPerEm",
					type: "USHORT",
					value: 1e3
				},
				{
					name: "created",
					type: "LONGDATETIME",
					value: n
				},
				{
					name: "modified",
					type: "LONGDATETIME",
					value: t
				},
				{
					name: "xMin",
					type: "SHORT",
					value: 0
				},
				{
					name: "yMin",
					type: "SHORT",
					value: 0
				},
				{
					name: "xMax",
					type: "SHORT",
					value: 0
				},
				{
					name: "yMax",
					type: "SHORT",
					value: 0
				},
				{
					name: "macStyle",
					type: "USHORT",
					value: r
				},
				{
					name: "lowestRecPPEM",
					type: "USHORT",
					value: 0
				},
				{
					name: "fontDirectionHint",
					type: "SHORT",
					value: 2
				},
				{
					name: "indexToLocFormat",
					type: "SHORT",
					value: 0
				},
				{
					name: "glyphDataFormat",
					type: "SHORT",
					value: 0
				}
			], e);
		}
		var Zn = {
			parse: Yn,
			make: Xn
		};
		function Qn(e, t) {
			let n = {}, r = new R.Parser(e, t);
			return n.version = r.parseVersion(), n.ascender = r.parseShort(), n.descender = r.parseShort(), n.lineGap = r.parseShort(), n.advanceWidthMax = r.parseUShort(), n.minLeftSideBearing = r.parseShort(), n.minRightSideBearing = r.parseShort(), n.xMaxExtent = r.parseShort(), n.caretSlopeRise = r.parseShort(), n.caretSlopeRun = r.parseShort(), n.caretOffset = r.parseShort(), r.relativeOffset += 8, n.metricDataFormat = r.parseShort(), n.numberOfHMetrics = r.parseUShort(), n;
		}
		function $n(e) {
			return new I.Table("hhea", [
				{
					name: "version",
					type: "FIXED",
					value: 65536
				},
				{
					name: "ascender",
					type: "FWORD",
					value: 0
				},
				{
					name: "descender",
					type: "FWORD",
					value: 0
				},
				{
					name: "lineGap",
					type: "FWORD",
					value: 0
				},
				{
					name: "advanceWidthMax",
					type: "UFWORD",
					value: 0
				},
				{
					name: "minLeftSideBearing",
					type: "FWORD",
					value: 0
				},
				{
					name: "minRightSideBearing",
					type: "FWORD",
					value: 0
				},
				{
					name: "xMaxExtent",
					type: "FWORD",
					value: 0
				},
				{
					name: "caretSlopeRise",
					type: "SHORT",
					value: 1
				},
				{
					name: "caretSlopeRun",
					type: "SHORT",
					value: 0
				},
				{
					name: "caretOffset",
					type: "SHORT",
					value: 0
				},
				{
					name: "reserved1",
					type: "SHORT",
					value: 0
				},
				{
					name: "reserved2",
					type: "SHORT",
					value: 0
				},
				{
					name: "reserved3",
					type: "SHORT",
					value: 0
				},
				{
					name: "reserved4",
					type: "SHORT",
					value: 0
				},
				{
					name: "metricDataFormat",
					type: "SHORT",
					value: 0
				},
				{
					name: "numberOfHMetrics",
					type: "USHORT",
					value: 0
				}
			], e);
		}
		var er = {
			parse: Qn,
			make: $n
		};
		function tr(e, t, n, r, i) {
			let a, o, s = new R.Parser(e, t);
			for (let e = 0; e < r; e += 1) {
				e < n && (a = s.parseUShort(), o = s.parseShort());
				let t = i.get(e);
				t.advanceWidth = a, t.leftSideBearing = o;
			}
		}
		function nr(e, t, n, r, i) {
			e._hmtxTableData = {};
			let a, o, s = new R.Parser(t, n);
			for (let t = 0; t < i; t += 1) t < r && (a = s.parseUShort(), o = s.parseShort()), e._hmtxTableData[t] = {
				advanceWidth: a,
				leftSideBearing: o
			};
		}
		function rr(e, t, n, r, i, a, o) {
			o.lowMemory ? nr(e, t, n, r, i) : tr(t, n, r, i, a);
		}
		function ir(e) {
			let t = new I.Table("hmtx", []);
			for (let n = 0; n < e.length; n += 1) {
				let r = e.get(n), i = r.advanceWidth || 0, a = r.leftSideBearing || 0;
				t.fields.push({
					name: "advanceWidth_" + n,
					type: "USHORT",
					value: i
				}), t.fields.push({
					name: "leftSideBearing_" + n,
					type: "SHORT",
					value: a
				});
			}
			return t;
		}
		var ar = {
			parse: rr,
			make: ir
		};
		function or(e) {
			let t = new I.Table("ltag", [
				{
					name: "version",
					type: "ULONG",
					value: 1
				},
				{
					name: "flags",
					type: "ULONG",
					value: 0
				},
				{
					name: "numTags",
					type: "ULONG",
					value: e.length
				}
			]), n = "", r = 12 + e.length * 4;
			for (let i = 0; i < e.length; ++i) {
				let a = n.indexOf(e[i]);
				a < 0 && (a = n.length, n += e[i]), t.fields.push({
					name: "offset " + i,
					type: "USHORT",
					value: r + a
				}), t.fields.push({
					name: "length " + i,
					type: "USHORT",
					value: e[i].length
				});
			}
			return t.fields.push({
				name: "stringPool",
				type: "CHARARRAY",
				value: n
			}), t;
		}
		function sr(e, t) {
			let n = new R.Parser(e, t), r = n.parseULong();
			j.argument(r === 1, "Unsupported ltag table version."), n.skip("uLong", 1);
			let i = n.parseULong(), a = [];
			for (let r = 0; r < i; r++) {
				let r = "", i = t + n.parseUShort(), o = n.parseUShort();
				for (let t = i; t < i + o; ++t) r += String.fromCharCode(e.getInt8(t));
				a.push(r);
			}
			return a;
		}
		var cr = {
			make: or,
			parse: sr
		};
		function lr(e, t) {
			let n = {}, r = new R.Parser(e, t);
			return n.version = r.parseVersion(), n.numGlyphs = r.parseUShort(), n.version === 1 && (n.maxPoints = r.parseUShort(), n.maxContours = r.parseUShort(), n.maxCompositePoints = r.parseUShort(), n.maxCompositeContours = r.parseUShort(), n.maxZones = r.parseUShort(), n.maxTwilightPoints = r.parseUShort(), n.maxStorage = r.parseUShort(), n.maxFunctionDefs = r.parseUShort(), n.maxInstructionDefs = r.parseUShort(), n.maxStackElements = r.parseUShort(), n.maxSizeOfInstructions = r.parseUShort(), n.maxComponentElements = r.parseUShort(), n.maxComponentDepth = r.parseUShort()), n;
		}
		function ur(e) {
			return new I.Table("maxp", [{
				name: "version",
				type: "FIXED",
				value: 20480
			}, {
				name: "numGlyphs",
				type: "USHORT",
				value: e
			}]);
		}
		var dr = {
			parse: lr,
			make: ur
		}, fr = [
			{
				begin: 0,
				end: 127
			},
			{
				begin: 128,
				end: 255
			},
			{
				begin: 256,
				end: 383
			},
			{
				begin: 384,
				end: 591
			},
			{
				begin: 592,
				end: 687
			},
			{
				begin: 688,
				end: 767
			},
			{
				begin: 768,
				end: 879
			},
			{
				begin: 880,
				end: 1023
			},
			{
				begin: 11392,
				end: 11519
			},
			{
				begin: 1024,
				end: 1279
			},
			{
				begin: 1328,
				end: 1423
			},
			{
				begin: 1424,
				end: 1535
			},
			{
				begin: 42240,
				end: 42559
			},
			{
				begin: 1536,
				end: 1791
			},
			{
				begin: 1984,
				end: 2047
			},
			{
				begin: 2304,
				end: 2431
			},
			{
				begin: 2432,
				end: 2559
			},
			{
				begin: 2560,
				end: 2687
			},
			{
				begin: 2688,
				end: 2815
			},
			{
				begin: 2816,
				end: 2943
			},
			{
				begin: 2944,
				end: 3071
			},
			{
				begin: 3072,
				end: 3199
			},
			{
				begin: 3200,
				end: 3327
			},
			{
				begin: 3328,
				end: 3455
			},
			{
				begin: 3584,
				end: 3711
			},
			{
				begin: 3712,
				end: 3839
			},
			{
				begin: 4256,
				end: 4351
			},
			{
				begin: 6912,
				end: 7039
			},
			{
				begin: 4352,
				end: 4607
			},
			{
				begin: 7680,
				end: 7935
			},
			{
				begin: 7936,
				end: 8191
			},
			{
				begin: 8192,
				end: 8303
			},
			{
				begin: 8304,
				end: 8351
			},
			{
				begin: 8352,
				end: 8399
			},
			{
				begin: 8400,
				end: 8447
			},
			{
				begin: 8448,
				end: 8527
			},
			{
				begin: 8528,
				end: 8591
			},
			{
				begin: 8592,
				end: 8703
			},
			{
				begin: 8704,
				end: 8959
			},
			{
				begin: 8960,
				end: 9215
			},
			{
				begin: 9216,
				end: 9279
			},
			{
				begin: 9280,
				end: 9311
			},
			{
				begin: 9312,
				end: 9471
			},
			{
				begin: 9472,
				end: 9599
			},
			{
				begin: 9600,
				end: 9631
			},
			{
				begin: 9632,
				end: 9727
			},
			{
				begin: 9728,
				end: 9983
			},
			{
				begin: 9984,
				end: 10175
			},
			{
				begin: 12288,
				end: 12351
			},
			{
				begin: 12352,
				end: 12447
			},
			{
				begin: 12448,
				end: 12543
			},
			{
				begin: 12544,
				end: 12591
			},
			{
				begin: 12592,
				end: 12687
			},
			{
				begin: 43072,
				end: 43135
			},
			{
				begin: 12800,
				end: 13055
			},
			{
				begin: 13056,
				end: 13311
			},
			{
				begin: 44032,
				end: 55215
			},
			{
				begin: 55296,
				end: 57343
			},
			{
				begin: 67840,
				end: 67871
			},
			{
				begin: 19968,
				end: 40959
			},
			{
				begin: 57344,
				end: 63743
			},
			{
				begin: 12736,
				end: 12783
			},
			{
				begin: 64256,
				end: 64335
			},
			{
				begin: 64336,
				end: 65023
			},
			{
				begin: 65056,
				end: 65071
			},
			{
				begin: 65040,
				end: 65055
			},
			{
				begin: 65104,
				end: 65135
			},
			{
				begin: 65136,
				end: 65279
			},
			{
				begin: 65280,
				end: 65519
			},
			{
				begin: 65520,
				end: 65535
			},
			{
				begin: 3840,
				end: 4095
			},
			{
				begin: 1792,
				end: 1871
			},
			{
				begin: 1920,
				end: 1983
			},
			{
				begin: 3456,
				end: 3583
			},
			{
				begin: 4096,
				end: 4255
			},
			{
				begin: 4608,
				end: 4991
			},
			{
				begin: 5024,
				end: 5119
			},
			{
				begin: 5120,
				end: 5759
			},
			{
				begin: 5760,
				end: 5791
			},
			{
				begin: 5792,
				end: 5887
			},
			{
				begin: 6016,
				end: 6143
			},
			{
				begin: 6144,
				end: 6319
			},
			{
				begin: 10240,
				end: 10495
			},
			{
				begin: 40960,
				end: 42127
			},
			{
				begin: 5888,
				end: 5919
			},
			{
				begin: 66304,
				end: 66351
			},
			{
				begin: 66352,
				end: 66383
			},
			{
				begin: 66560,
				end: 66639
			},
			{
				begin: 118784,
				end: 119039
			},
			{
				begin: 119808,
				end: 120831
			},
			{
				begin: 1044480,
				end: 1048573
			},
			{
				begin: 65024,
				end: 65039
			},
			{
				begin: 917504,
				end: 917631
			},
			{
				begin: 6400,
				end: 6479
			},
			{
				begin: 6480,
				end: 6527
			},
			{
				begin: 6528,
				end: 6623
			},
			{
				begin: 6656,
				end: 6687
			},
			{
				begin: 11264,
				end: 11359
			},
			{
				begin: 11568,
				end: 11647
			},
			{
				begin: 19904,
				end: 19967
			},
			{
				begin: 43008,
				end: 43055
			},
			{
				begin: 65536,
				end: 65663
			},
			{
				begin: 65856,
				end: 65935
			},
			{
				begin: 66432,
				end: 66463
			},
			{
				begin: 66464,
				end: 66527
			},
			{
				begin: 66640,
				end: 66687
			},
			{
				begin: 66688,
				end: 66735
			},
			{
				begin: 67584,
				end: 67647
			},
			{
				begin: 68096,
				end: 68191
			},
			{
				begin: 119552,
				end: 119647
			},
			{
				begin: 73728,
				end: 74751
			},
			{
				begin: 119648,
				end: 119679
			},
			{
				begin: 7040,
				end: 7103
			},
			{
				begin: 7168,
				end: 7247
			},
			{
				begin: 7248,
				end: 7295
			},
			{
				begin: 43136,
				end: 43231
			},
			{
				begin: 43264,
				end: 43311
			},
			{
				begin: 43312,
				end: 43359
			},
			{
				begin: 43520,
				end: 43615
			},
			{
				begin: 65936,
				end: 65999
			},
			{
				begin: 66e3,
				end: 66047
			},
			{
				begin: 66208,
				end: 66271
			},
			{
				begin: 127024,
				end: 127135
			}
		];
		function pr(e) {
			for (let t = 0; t < fr.length; t += 1) {
				let n = fr[t];
				if (e >= n.begin && e < n.end) return t;
			}
			return -1;
		}
		function mr(e, t) {
			let n = {}, r = new R.Parser(e, t);
			n.version = r.parseUShort(), n.xAvgCharWidth = r.parseShort(), n.usWeightClass = r.parseUShort(), n.usWidthClass = r.parseUShort(), n.fsType = r.parseUShort(), n.ySubscriptXSize = r.parseShort(), n.ySubscriptYSize = r.parseShort(), n.ySubscriptXOffset = r.parseShort(), n.ySubscriptYOffset = r.parseShort(), n.ySuperscriptXSize = r.parseShort(), n.ySuperscriptYSize = r.parseShort(), n.ySuperscriptXOffset = r.parseShort(), n.ySuperscriptYOffset = r.parseShort(), n.yStrikeoutSize = r.parseShort(), n.yStrikeoutPosition = r.parseShort(), n.sFamilyClass = r.parseShort(), n.panose = [];
			for (let e = 0; e < 10; e++) n.panose[e] = r.parseByte();
			return n.ulUnicodeRange1 = r.parseULong(), n.ulUnicodeRange2 = r.parseULong(), n.ulUnicodeRange3 = r.parseULong(), n.ulUnicodeRange4 = r.parseULong(), n.achVendID = String.fromCharCode(r.parseByte(), r.parseByte(), r.parseByte(), r.parseByte()), n.fsSelection = r.parseUShort(), n.usFirstCharIndex = r.parseUShort(), n.usLastCharIndex = r.parseUShort(), n.sTypoAscender = r.parseShort(), n.sTypoDescender = r.parseShort(), n.sTypoLineGap = r.parseShort(), n.usWinAscent = r.parseUShort(), n.usWinDescent = r.parseUShort(), n.version >= 1 && (n.ulCodePageRange1 = r.parseULong(), n.ulCodePageRange2 = r.parseULong()), n.version >= 2 && (n.sxHeight = r.parseShort(), n.sCapHeight = r.parseShort(), n.usDefaultChar = r.parseUShort(), n.usBreakChar = r.parseUShort(), n.usMaxContent = r.parseUShort()), n;
		}
		function hr(e) {
			return new I.Table("OS/2", [
				{
					name: "version",
					type: "USHORT",
					value: 3
				},
				{
					name: "xAvgCharWidth",
					type: "SHORT",
					value: 0
				},
				{
					name: "usWeightClass",
					type: "USHORT",
					value: 0
				},
				{
					name: "usWidthClass",
					type: "USHORT",
					value: 0
				},
				{
					name: "fsType",
					type: "USHORT",
					value: 0
				},
				{
					name: "ySubscriptXSize",
					type: "SHORT",
					value: 650
				},
				{
					name: "ySubscriptYSize",
					type: "SHORT",
					value: 699
				},
				{
					name: "ySubscriptXOffset",
					type: "SHORT",
					value: 0
				},
				{
					name: "ySubscriptYOffset",
					type: "SHORT",
					value: 140
				},
				{
					name: "ySuperscriptXSize",
					type: "SHORT",
					value: 650
				},
				{
					name: "ySuperscriptYSize",
					type: "SHORT",
					value: 699
				},
				{
					name: "ySuperscriptXOffset",
					type: "SHORT",
					value: 0
				},
				{
					name: "ySuperscriptYOffset",
					type: "SHORT",
					value: 479
				},
				{
					name: "yStrikeoutSize",
					type: "SHORT",
					value: 49
				},
				{
					name: "yStrikeoutPosition",
					type: "SHORT",
					value: 258
				},
				{
					name: "sFamilyClass",
					type: "SHORT",
					value: 0
				},
				{
					name: "bFamilyType",
					type: "BYTE",
					value: 0
				},
				{
					name: "bSerifStyle",
					type: "BYTE",
					value: 0
				},
				{
					name: "bWeight",
					type: "BYTE",
					value: 0
				},
				{
					name: "bProportion",
					type: "BYTE",
					value: 0
				},
				{
					name: "bContrast",
					type: "BYTE",
					value: 0
				},
				{
					name: "bStrokeVariation",
					type: "BYTE",
					value: 0
				},
				{
					name: "bArmStyle",
					type: "BYTE",
					value: 0
				},
				{
					name: "bLetterform",
					type: "BYTE",
					value: 0
				},
				{
					name: "bMidline",
					type: "BYTE",
					value: 0
				},
				{
					name: "bXHeight",
					type: "BYTE",
					value: 0
				},
				{
					name: "ulUnicodeRange1",
					type: "ULONG",
					value: 0
				},
				{
					name: "ulUnicodeRange2",
					type: "ULONG",
					value: 0
				},
				{
					name: "ulUnicodeRange3",
					type: "ULONG",
					value: 0
				},
				{
					name: "ulUnicodeRange4",
					type: "ULONG",
					value: 0
				},
				{
					name: "achVendID",
					type: "CHARARRAY",
					value: "XXXX"
				},
				{
					name: "fsSelection",
					type: "USHORT",
					value: 0
				},
				{
					name: "usFirstCharIndex",
					type: "USHORT",
					value: 0
				},
				{
					name: "usLastCharIndex",
					type: "USHORT",
					value: 0
				},
				{
					name: "sTypoAscender",
					type: "SHORT",
					value: 0
				},
				{
					name: "sTypoDescender",
					type: "SHORT",
					value: 0
				},
				{
					name: "sTypoLineGap",
					type: "SHORT",
					value: 0
				},
				{
					name: "usWinAscent",
					type: "USHORT",
					value: 0
				},
				{
					name: "usWinDescent",
					type: "USHORT",
					value: 0
				},
				{
					name: "ulCodePageRange1",
					type: "ULONG",
					value: 0
				},
				{
					name: "ulCodePageRange2",
					type: "ULONG",
					value: 0
				},
				{
					name: "sxHeight",
					type: "SHORT",
					value: 0
				},
				{
					name: "sCapHeight",
					type: "SHORT",
					value: 0
				},
				{
					name: "usDefaultChar",
					type: "USHORT",
					value: 0
				},
				{
					name: "usBreakChar",
					type: "USHORT",
					value: 0
				},
				{
					name: "usMaxContext",
					type: "USHORT",
					value: 0
				}
			], e);
		}
		var gr = {
			parse: mr,
			make: hr,
			unicodeRanges: fr,
			getUnicodeRange: pr
		};
		function _r(e, t) {
			let n = {}, r = new R.Parser(e, t);
			switch (n.version = r.parseVersion(), n.italicAngle = r.parseFixed(), n.underlinePosition = r.parseShort(), n.underlineThickness = r.parseShort(), n.isFixedPitch = r.parseULong(), n.minMemType42 = r.parseULong(), n.maxMemType42 = r.parseULong(), n.minMemType1 = r.parseULong(), n.maxMemType1 = r.parseULong(), n.version) {
				case 1:
					n.names = At.slice();
					break;
				case 2:
					n.numberOfGlyphs = r.parseUShort(), n.glyphNameIndex = Array(n.numberOfGlyphs);
					for (let e = 0; e < n.numberOfGlyphs; e++) n.glyphNameIndex[e] = r.parseUShort();
					n.names = [];
					for (let e = 0; e < n.numberOfGlyphs; e++) if (n.glyphNameIndex[e] >= At.length) {
						let e = r.parseChar();
						n.names.push(r.parseString(e));
					}
					break;
				case 2.5:
					n.numberOfGlyphs = r.parseUShort(), n.offset = Array(n.numberOfGlyphs);
					for (let e = 0; e < n.numberOfGlyphs; e++) n.offset[e] = r.parseChar();
					break;
			}
			return n;
		}
		function vr(e) {
			let { italicAngle: t = Math.round((e.italicAngle || 0) * 65536), underlinePosition: n = 0, underlineThickness: r = 0, isFixedPitch: i = 0, minMemType42: a = 0, maxMemType42: o = 0, minMemType1: s = 0, maxMemType1: c = 0 } = e.tables.post || {};
			return new I.Table("post", [
				{
					name: "version",
					type: "FIXED",
					value: 196608
				},
				{
					name: "italicAngle",
					type: "FIXED",
					value: t
				},
				{
					name: "underlinePosition",
					type: "FWORD",
					value: n
				},
				{
					name: "underlineThickness",
					type: "FWORD",
					value: r
				},
				{
					name: "isFixedPitch",
					type: "ULONG",
					value: i
				},
				{
					name: "minMemType42",
					type: "ULONG",
					value: a
				},
				{
					name: "maxMemType42",
					type: "ULONG",
					value: o
				},
				{
					name: "minMemType1",
					type: "ULONG",
					value: s
				},
				{
					name: "maxMemType1",
					type: "ULONG",
					value: c
				}
			]);
		}
		var yr = {
			parse: _r,
			make: vr
		}, br = Array(9);
		br[1] = function() {
			let e = this.offset + this.relativeOffset, t = this.parseUShort();
			if (t === 1) return {
				substFormat: 1,
				coverage: this.parsePointer(L.coverage),
				deltaGlyphId: this.parseShort()
			};
			if (t === 2) return {
				substFormat: 2,
				coverage: this.parsePointer(L.coverage),
				substitute: this.parseOffset16List()
			};
			j.assert(!1, "0x" + e.toString(16) + ": lookup type 1 format must be 1 or 2.");
		}, br[2] = function() {
			let e = this.parseUShort();
			return j.argument(e === 1, "GSUB Multiple Substitution Subtable identifier-format must be 1"), {
				substFormat: e,
				coverage: this.parsePointer(L.coverage),
				sequences: this.parseListOfLists()
			};
		}, br[3] = function() {
			let e = this.parseUShort();
			return j.argument(e === 1, "GSUB Alternate Substitution Subtable identifier-format must be 1"), {
				substFormat: e,
				coverage: this.parsePointer(L.coverage),
				alternateSets: this.parseListOfLists()
			};
		}, br[4] = function() {
			let e = this.parseUShort();
			return j.argument(e === 1, "GSUB ligature table identifier-format must be 1"), {
				substFormat: e,
				coverage: this.parsePointer(L.coverage),
				ligatureSets: this.parseListOfLists(function() {
					return {
						ligGlyph: this.parseUShort(),
						components: this.parseUShortList(this.parseUShort() - 1)
					};
				})
			};
		};
		var xr = {
			sequenceIndex: L.uShort,
			lookupListIndex: L.uShort
		};
		br[5] = function() {
			let e = this.offset + this.relativeOffset, t = this.parseUShort();
			if (t === 1) return {
				substFormat: t,
				coverage: this.parsePointer(L.coverage),
				ruleSets: this.parseListOfLists(function() {
					let e = this.parseUShort(), t = this.parseUShort();
					return {
						input: this.parseUShortList(e - 1),
						lookupRecords: this.parseRecordList(t, xr)
					};
				})
			};
			if (t === 2) return {
				substFormat: t,
				coverage: this.parsePointer(L.coverage),
				classDef: this.parsePointer(L.classDef),
				classSets: this.parseListOfLists(function() {
					let e = this.parseUShort(), t = this.parseUShort();
					return {
						classes: this.parseUShortList(e - 1),
						lookupRecords: this.parseRecordList(t, xr)
					};
				})
			};
			if (t === 3) {
				let e = this.parseUShort(), n = this.parseUShort();
				return {
					substFormat: t,
					coverages: this.parseList(e, L.pointer(L.coverage)),
					lookupRecords: this.parseRecordList(n, xr)
				};
			}
			j.assert(!1, "0x" + e.toString(16) + ": lookup type 5 format must be 1, 2 or 3.");
		}, br[6] = function() {
			let e = this.offset + this.relativeOffset, t = this.parseUShort();
			if (t === 1) return {
				substFormat: 1,
				coverage: this.parsePointer(L.coverage),
				chainRuleSets: this.parseListOfLists(function() {
					return {
						backtrack: this.parseUShortList(),
						input: this.parseUShortList(this.parseShort() - 1),
						lookahead: this.parseUShortList(),
						lookupRecords: this.parseRecordList(xr)
					};
				})
			};
			if (t === 2) return {
				substFormat: 2,
				coverage: this.parsePointer(L.coverage),
				backtrackClassDef: this.parsePointer(L.classDef),
				inputClassDef: this.parsePointer(L.classDef),
				lookaheadClassDef: this.parsePointer(L.classDef),
				chainClassSet: this.parseListOfLists(function() {
					return {
						backtrack: this.parseUShortList(),
						input: this.parseUShortList(this.parseShort() - 1),
						lookahead: this.parseUShortList(),
						lookupRecords: this.parseRecordList(xr)
					};
				})
			};
			if (t === 3) return {
				substFormat: 3,
				backtrackCoverage: this.parseList(L.pointer(L.coverage)),
				inputCoverage: this.parseList(L.pointer(L.coverage)),
				lookaheadCoverage: this.parseList(L.pointer(L.coverage)),
				lookupRecords: this.parseRecordList(xr)
			};
			j.assert(!1, "0x" + e.toString(16) + ": lookup type 6 format must be 1, 2 or 3.");
		}, br[7] = function() {
			let e = this.parseUShort();
			j.argument(e === 1, "GSUB Extension Substitution subtable identifier-format must be 1");
			let t = this.parseUShort(), n = new L(this.data, this.offset + this.parseULong());
			return {
				substFormat: 1,
				lookupType: t,
				extension: br[t].call(n)
			};
		}, br[8] = function() {
			let e = this.parseUShort();
			return j.argument(e === 1, "GSUB Reverse Chaining Contextual Single Substitution Subtable identifier-format must be 1"), {
				substFormat: e,
				coverage: this.parsePointer(L.coverage),
				backtrackCoverage: this.parseList(L.pointer(L.coverage)),
				lookaheadCoverage: this.parseList(L.pointer(L.coverage)),
				substitutes: this.parseUShortList()
			};
		};
		function Sr(e, t) {
			t ||= 0;
			let n = new L(e, t), r = n.parseVersion(1);
			return j.argument(r === 1 || r === 1.1, "Unsupported GSUB table version."), r === 1 ? {
				version: r,
				scripts: n.parseScriptList(),
				features: n.parseFeatureList(),
				lookups: n.parseLookupList(br)
			} : {
				version: r,
				scripts: n.parseScriptList(),
				features: n.parseFeatureList(),
				lookups: n.parseLookupList(br),
				variations: n.parseFeatureVariationsList()
			};
		}
		var Cr = Array(9);
		Cr[1] = function(e) {
			if (e.substFormat === 1) return new I.Table("substitutionTable", [
				{
					name: "substFormat",
					type: "USHORT",
					value: 1
				},
				{
					name: "coverage",
					type: "TABLE",
					value: new I.Coverage(e.coverage)
				},
				{
					name: "deltaGlyphID",
					type: "SHORT",
					value: e.deltaGlyphId
				}
			]);
			if (e.substFormat === 2) return new I.Table("substitutionTable", [{
				name: "substFormat",
				type: "USHORT",
				value: 2
			}, {
				name: "coverage",
				type: "TABLE",
				value: new I.Coverage(e.coverage)
			}].concat(I.ushortList("substitute", e.substitute)));
			j.fail("Lookup type 1 substFormat must be 1 or 2.");
		}, Cr[2] = function(e) {
			return j.assert(e.substFormat === 1, "Lookup type 2 substFormat must be 1."), new I.Table("substitutionTable", [{
				name: "substFormat",
				type: "USHORT",
				value: 1
			}, {
				name: "coverage",
				type: "TABLE",
				value: new I.Coverage(e.coverage)
			}].concat(I.tableList("seqSet", e.sequences, function(e) {
				return new I.Table("sequenceSetTable", I.ushortList("sequence", e));
			})));
		}, Cr[3] = function(e) {
			return j.assert(e.substFormat === 1, "Lookup type 3 substFormat must be 1."), new I.Table("substitutionTable", [{
				name: "substFormat",
				type: "USHORT",
				value: 1
			}, {
				name: "coverage",
				type: "TABLE",
				value: new I.Coverage(e.coverage)
			}].concat(I.tableList("altSet", e.alternateSets, function(e) {
				return new I.Table("alternateSetTable", I.ushortList("alternate", e));
			})));
		}, Cr[4] = function(e) {
			return j.assert(e.substFormat === 1, "Lookup type 4 substFormat must be 1."), new I.Table("substitutionTable", [{
				name: "substFormat",
				type: "USHORT",
				value: 1
			}, {
				name: "coverage",
				type: "TABLE",
				value: new I.Coverage(e.coverage)
			}].concat(I.tableList("ligSet", e.ligatureSets, function(e) {
				return new I.Table("ligatureSetTable", I.tableList("ligature", e, function(e) {
					return new I.Table("ligatureTable", [{
						name: "ligGlyph",
						type: "USHORT",
						value: e.ligGlyph
					}].concat(I.ushortList("component", e.components, e.components.length + 1)));
				}));
			})));
		}, Cr[5] = function(e) {
			if (e.substFormat === 1) return new I.Table("contextualSubstitutionTable", [{
				name: "substFormat",
				type: "USHORT",
				value: e.substFormat
			}, {
				name: "coverage",
				type: "TABLE",
				value: new I.Coverage(e.coverage)
			}].concat(I.tableList("sequenceRuleSet", e.ruleSets, function(e) {
				return e ? new I.Table("sequenceRuleSetTable", I.tableList("sequenceRule", e, function(e) {
					let t = I.ushortList("seqLookup", [], e.lookupRecords.length).concat(I.ushortList("inputSequence", e.input, e.input.length + 1));
					[t[0], t[1]] = [t[1], t[0]];
					for (let n = 0; n < e.lookupRecords.length; n++) {
						let r = e.lookupRecords[n];
						t = t.concat({
							name: "sequenceIndex" + n,
							type: "USHORT",
							value: r.sequenceIndex
						}).concat({
							name: "lookupListIndex" + n,
							type: "USHORT",
							value: r.lookupListIndex
						});
					}
					return new I.Table("sequenceRuleTable", t);
				})) : new I.Table("NULL", null);
			})));
			if (e.substFormat === 2) return new I.Table("contextualSubstitutionTable", [
				{
					name: "substFormat",
					type: "USHORT",
					value: e.substFormat
				},
				{
					name: "coverage",
					type: "TABLE",
					value: new I.Coverage(e.coverage)
				},
				{
					name: "classDef",
					type: "TABLE",
					value: new I.ClassDef(e.classDef)
				}
			].concat(I.tableList("classSeqRuleSet", e.classSets, function(e) {
				return e ? new I.Table("classSeqRuleSetTable", I.tableList("classSeqRule", e, function(e) {
					let t = I.ushortList("classes", e.classes, e.classes.length + 1).concat(I.ushortList("seqLookupCount", [], e.lookupRecords.length));
					for (let n = 0; n < e.lookupRecords.length; n++) {
						let r = e.lookupRecords[n];
						t = t.concat({
							name: "sequenceIndex" + n,
							type: "USHORT",
							value: r.sequenceIndex
						}).concat({
							name: "lookupListIndex" + n,
							type: "USHORT",
							value: r.lookupListIndex
						});
					}
					return new I.Table("classSeqRuleTable", t);
				})) : new I.Table("NULL", null);
			})));
			if (e.substFormat === 3) {
				let t = [{
					name: "substFormat",
					type: "USHORT",
					value: e.substFormat
				}];
				t.push({
					name: "inputGlyphCount",
					type: "USHORT",
					value: e.coverages.length
				}), t.push({
					name: "substitutionCount",
					type: "USHORT",
					value: e.lookupRecords.length
				});
				for (let n = 0; n < e.coverages.length; n++) {
					let r = e.coverages[n];
					t.push({
						name: "inputCoverage" + n,
						type: "TABLE",
						value: new I.Coverage(r)
					});
				}
				for (let n = 0; n < e.lookupRecords.length; n++) {
					let r = e.lookupRecords[n];
					t = t.concat({
						name: "sequenceIndex" + n,
						type: "USHORT",
						value: r.sequenceIndex
					}).concat({
						name: "lookupListIndex" + n,
						type: "USHORT",
						value: r.lookupListIndex
					});
				}
				return new I.Table("contextualSubstitutionTable", t);
			}
			j.assert(!1, "lookup type 5 format must be 1, 2 or 3.");
		}, Cr[6] = function(e) {
			if (e.substFormat === 1) return new I.Table("chainContextTable", [{
				name: "substFormat",
				type: "USHORT",
				value: e.substFormat
			}, {
				name: "coverage",
				type: "TABLE",
				value: new I.Coverage(e.coverage)
			}].concat(I.tableList("chainRuleSet", e.chainRuleSets, function(e) {
				return new I.Table("chainRuleSetTable", I.tableList("chainRule", e, function(e) {
					let t = I.ushortList("backtrackGlyph", e.backtrack, e.backtrack.length).concat(I.ushortList("inputGlyph", e.input, e.input.length + 1)).concat(I.ushortList("lookaheadGlyph", e.lookahead, e.lookahead.length)).concat(I.ushortList("substitution", [], e.lookupRecords.length));
					for (let n = 0; n < e.lookupRecords.length; n++) {
						let r = e.lookupRecords[n];
						t = t.concat({
							name: "sequenceIndex" + n,
							type: "USHORT",
							value: r.sequenceIndex
						}).concat({
							name: "lookupListIndex" + n,
							type: "USHORT",
							value: r.lookupListIndex
						});
					}
					return new I.Table("chainRuleTable", t);
				}));
			})));
			if (e.substFormat === 2) j.assert(!1, "lookup type 6 format 2 is not yet supported.");
			else if (e.substFormat === 3) {
				let t = [{
					name: "substFormat",
					type: "USHORT",
					value: e.substFormat
				}];
				t.push({
					name: "backtrackGlyphCount",
					type: "USHORT",
					value: e.backtrackCoverage.length
				});
				for (let n = 0; n < e.backtrackCoverage.length; n++) {
					let r = e.backtrackCoverage[n];
					t.push({
						name: "backtrackCoverage" + n,
						type: "TABLE",
						value: new I.Coverage(r)
					});
				}
				t.push({
					name: "inputGlyphCount",
					type: "USHORT",
					value: e.inputCoverage.length
				});
				for (let n = 0; n < e.inputCoverage.length; n++) {
					let r = e.inputCoverage[n];
					t.push({
						name: "inputCoverage" + n,
						type: "TABLE",
						value: new I.Coverage(r)
					});
				}
				t.push({
					name: "lookaheadGlyphCount",
					type: "USHORT",
					value: e.lookaheadCoverage.length
				});
				for (let n = 0; n < e.lookaheadCoverage.length; n++) {
					let r = e.lookaheadCoverage[n];
					t.push({
						name: "lookaheadCoverage" + n,
						type: "TABLE",
						value: new I.Coverage(r)
					});
				}
				t.push({
					name: "substitutionCount",
					type: "USHORT",
					value: e.lookupRecords.length
				});
				for (let n = 0; n < e.lookupRecords.length; n++) {
					let r = e.lookupRecords[n];
					t = t.concat({
						name: "sequenceIndex" + n,
						type: "USHORT",
						value: r.sequenceIndex
					}).concat({
						name: "lookupListIndex" + n,
						type: "USHORT",
						value: r.lookupListIndex
					});
				}
				return new I.Table("chainContextTable", t);
			}
			j.assert(!1, "lookup type 6 format must be 1, 2 or 3.");
		};
		function wr(e) {
			return new I.Table("GSUB", [
				{
					name: "version",
					type: "ULONG",
					value: 65536
				},
				{
					name: "scripts",
					type: "TABLE",
					value: new I.ScriptList(e.scripts)
				},
				{
					name: "features",
					type: "TABLE",
					value: new I.FeatureList(e.features)
				},
				{
					name: "lookups",
					type: "TABLE",
					value: new I.LookupList(e.lookups, Cr)
				}
			]);
		}
		var Tr = {
			parse: Sr,
			make: wr
		};
		function Er(e, t) {
			let n = new R.Parser(e, t), r = n.parseULong();
			j.argument(r === 1, "Unsupported META table version."), n.parseULong(), n.parseULong();
			let i = n.parseULong(), a = {};
			for (let r = 0; r < i; r++) {
				let r = n.parseTag(), i = n.parseULong(), o = n.parseULong();
				r === "appl" || r === "bild" || (a[r] = _e.UTF8(e, t + i, o));
			}
			return a;
		}
		function Dr(e) {
			let t = Object.keys(e).length, n = "", r = 16 + t * 12, i = new I.Table("meta", [
				{
					name: "version",
					type: "ULONG",
					value: 1
				},
				{
					name: "flags",
					type: "ULONG",
					value: 0
				},
				{
					name: "offset",
					type: "ULONG",
					value: r
				},
				{
					name: "numTags",
					type: "ULONG",
					value: t
				}
			]);
			for (let t in e) {
				let a = n.length;
				n += e[t], i.fields.push({
					name: "tag " + t,
					type: "TAG",
					value: t
				}), i.fields.push({
					name: "offset " + t,
					type: "ULONG",
					value: r + a
				}), i.fields.push({
					name: "length " + t,
					type: "ULONG",
					value: e[t].length
				});
			}
			return i.fields.push({
				name: "stringPool",
				type: "CHARARRAY",
				value: n
			}), i;
		}
		var Or = {
			parse: Er,
			make: Dr
		};
		function kr(e, t) {
			let n = new L(e, t), r = n.parseUShort();
			r !== 0 && console.warn("Only COLRv0 is currently fully supported. A subset of color glyphs might be available in this font if provided in the v0 format.");
			let i = n.parseUShort(), a = n.parseOffset32(), o = n.parseOffset32(), s = n.parseUShort();
			n.relativeOffset = a;
			let c = n.parseRecordList(i, {
				glyphID: L.uShort,
				firstLayerIndex: L.uShort,
				numLayers: L.uShort
			});
			return n.relativeOffset = o, {
				version: r,
				baseGlyphRecords: c,
				layerRecords: n.parseRecordList(s, {
					glyphID: L.uShort,
					paletteIndex: L.uShort
				})
			};
		}
		function Ar({ version: e = 0, baseGlyphRecords: t = [], layerRecords: n = [] }) {
			j.argument(e === 0, "Only COLRv0 supported.");
			let r = 14 + t.length * 6;
			return new I.Table("COLR", [
				{
					name: "version",
					type: "USHORT",
					value: e
				},
				{
					name: "numBaseGlyphRecords",
					type: "USHORT",
					value: t.length
				},
				{
					name: "baseGlyphRecordsOffset",
					type: "ULONG",
					value: 14
				},
				{
					name: "layerRecordsOffset",
					type: "ULONG",
					value: r
				},
				{
					name: "numLayerRecords",
					type: "USHORT",
					value: n.length
				},
				...t.map((e, t) => [
					{
						name: "glyphID_" + t,
						type: "USHORT",
						value: e.glyphID
					},
					{
						name: "firstLayerIndex_" + t,
						type: "USHORT",
						value: e.firstLayerIndex
					},
					{
						name: "numLayers_" + t,
						type: "USHORT",
						value: e.numLayers
					}
				]).flat(),
				...n.map((e, t) => [{
					name: "LayerGlyphID_" + t,
					type: "USHORT",
					value: e.glyphID
				}, {
					name: "paletteIndex_" + t,
					type: "USHORT",
					value: e.paletteIndex
				}]).flat()
			]);
		}
		var jr = {
			parse: kr,
			make: Ar
		};
		function Mr(e, t) {
			return [
				{
					name: "tag_" + e,
					type: "TAG",
					value: t.tag
				},
				{
					name: "minValue_" + e,
					type: "FIXED",
					value: t.minValue << 16
				},
				{
					name: "defaultValue_" + e,
					type: "FIXED",
					value: t.defaultValue << 16
				},
				{
					name: "maxValue_" + e,
					type: "FIXED",
					value: t.maxValue << 16
				},
				{
					name: "flags_" + e,
					type: "USHORT",
					value: 0
				},
				{
					name: "nameID_" + e,
					type: "USHORT",
					value: t.axisNameID
				}
			];
		}
		function Nr(e, t, n) {
			let r = {}, i = new R.Parser(e, t);
			r.tag = i.parseTag(), r.minValue = i.parseFixed(), r.defaultValue = i.parseFixed(), r.maxValue = i.parseFixed(), i.skip("uShort", 1);
			let a = i.parseUShort();
			return r.axisNameID = a, r.name = ft(n, a), r;
		}
		function Pr(e, t, n, r = {}) {
			let i = [{
				name: "nameID_" + e,
				type: "USHORT",
				value: t.subfamilyNameID
			}, {
				name: "flags_" + e,
				type: "USHORT",
				value: 0
			}];
			for (let r = 0; r < n.length; ++r) {
				let a = n[r].tag;
				i.push({
					name: "axis_" + e + " " + a,
					type: "FIXED",
					value: t.coordinates[a] << 16
				});
			}
			return r && r.postScriptNameID && i.push({
				name: "postScriptNameID_",
				type: "USHORT",
				value: t.postScriptNameID === void 0 ? 65535 : t.postScriptNameID
			}), i;
		}
		function Fr(e, t, n, r, i) {
			let a = {}, o = new R.Parser(e, t), s = o.parseUShort();
			a.subfamilyNameID = s, a.name = ft(r, s, [2, 17]), o.skip("uShort", 1), a.coordinates = {};
			for (let e = 0; e < n.length; ++e) a.coordinates[n[e].tag] = o.parseFixed();
			if (o.relativeOffset === i) return a.postScriptNameID = void 0, a.postScriptName = void 0, a;
			let c = o.parseUShort();
			return a.postScriptNameID = c == 65535 ? void 0 : c, a.postScriptName = a.postScriptNameID === void 0 ? "" : ft(r, c, [6]), a;
		}
		function Ir(e, t) {
			let n = new I.Table("fvar", [
				{
					name: "version",
					type: "ULONG",
					value: 65536
				},
				{
					name: "offsetToData",
					type: "USHORT",
					value: 0
				},
				{
					name: "countSizePairs",
					type: "USHORT",
					value: 2
				},
				{
					name: "axisCount",
					type: "USHORT",
					value: e.axes.length
				},
				{
					name: "axisSize",
					type: "USHORT",
					value: 20
				},
				{
					name: "instanceCount",
					type: "USHORT",
					value: e.instances.length
				},
				{
					name: "instanceSize",
					type: "USHORT",
					value: 4 + e.axes.length * 4
				}
			]);
			n.offsetToData = n.sizeOf();
			for (let r = 0; r < e.axes.length; r++) n.fields = n.fields.concat(Mr(r, e.axes[r], t));
			let r = {};
			for (let t = 0; t < e.instances.length; t++) if (e.instances[t].postScriptNameID !== void 0) {
				n.instanceSize += 2, r.postScriptNameID = !0;
				break;
			}
			for (let t = 0; t < e.instances.length; t++) n.fields = n.fields.concat(Pr(t, e.instances[t], e.axes, r));
			return n;
		}
		function Lr(e, t, n) {
			let r = new R.Parser(e, t), i = r.parseULong();
			j.argument(i === 65536, "Unsupported fvar table version.");
			let a = r.parseOffset16();
			r.skip("uShort", 1);
			let o = r.parseUShort(), s = r.parseUShort(), c = r.parseUShort(), l = r.parseUShort(), u = [];
			for (let r = 0; r < o; r++) u.push(Nr(e, t + a + r * s, n));
			let d = [], f = t + a + o * s;
			for (let t = 0; t < c; t++) d.push(Fr(e, f + t * l, u, n, l));
			return {
				axes: u,
				instances: d
			};
		}
		var Rr = {
			make: Ir,
			parse: Lr
		}, zr = {
			tag: L.tag,
			nameID: L.uShort,
			ordering: L.uShort
		}, Br = [
			,
			,
			,
			,
			,
		];
		Br[1] = function() {
			return {
				axisIndex: this.parseUShort(),
				flags: this.parseUShort(),
				valueNameID: this.parseUShort(),
				value: this.parseFixed()
			};
		}, Br[2] = function() {
			return {
				axisIndex: this.parseUShort(),
				flags: this.parseUShort(),
				valueNameID: this.parseUShort(),
				nominalValue: this.parseFixed(),
				rangeMinValue: this.parseFixed(),
				rangeMaxValue: this.parseFixed()
			};
		}, Br[3] = function() {
			return {
				axisIndex: this.parseUShort(),
				flags: this.parseUShort(),
				valueNameID: this.parseUShort(),
				value: this.parseFixed(),
				linkedValue: this.parseFixed()
			};
		}, Br[4] = function() {
			let e = this.parseUShort();
			return {
				flags: this.parseUShort(),
				valueNameID: this.parseUShort(),
				axisValues: this.parseList(e, function() {
					return {
						axisIndex: this.parseUShort(),
						value: this.parseFixed()
					};
				})
			};
		};
		function Vr() {
			let e = this.parseUShort(), t = Br[e], n = { format: e };
			return t === void 0 ? (console.warn(`Unknown axis value table format ${e}`), n) : Object.assign(n, this.parseStruct(t.bind(this)));
		}
		function Hr(e, t, n) {
			t ||= 0;
			let r = new R.Parser(e, t), i = r.parseUShort(), a = r.parseUShort();
			i !== 1 && console.warn(`Unsupported STAT table version ${i}.${a}`);
			let o = [i, a], s = r.parseUShort(), c = r.parseUShort(), l = r.parseOffset32(), u = r.parseUShort(), d = r.parseOffset32(), f = i > 1 || a > 0 ? r.parseUShort() : void 0;
			n !== void 0 && j.argument(c >= n.axes.length, "STAT axis count must be greater than or equal to fvar axis count"), u > 0 && j.argument(c >= 0, "STAT axis count must be greater than 0 if STAT axis value count is greater than 0");
			let p = [];
			for (let e = 0; e < c; e++) r.offset = t + l, r.relativeOffset = e * s, p.push(r.parseStruct(zr));
			r.offset = t, r.relativeOffset = d;
			let m = r.parseUShortList(u), h = [];
			for (let e = 0; e < u; e++) r.offset = t + d, r.relativeOffset = m[e], h.push(Vr.apply(r));
			return {
				version: o,
				axes: p,
				values: h,
				elidedFallbackNameID: f
			};
		}
		var Ur = [
			,
			,
			,
			,
			,
		];
		Ur[1] = function(e, t) {
			return [
				{
					name: `format${e}`,
					type: "USHORT",
					value: 1
				},
				{
					name: `axisIndex${e}`,
					type: "USHORT",
					value: t.axisIndex
				},
				{
					name: `flags${e}`,
					type: "USHORT",
					value: t.flags
				},
				{
					name: `valueNameID${e}`,
					type: "USHORT",
					value: t.valueNameID
				},
				{
					name: `value${e}`,
					type: "FLOAT",
					value: t.value
				}
			];
		}, Ur[2] = function(e, t) {
			return [
				{
					name: `format${e}`,
					type: "USHORT",
					value: 2
				},
				{
					name: `axisIndex${e}`,
					type: "USHORT",
					value: t.axisIndex
				},
				{
					name: `flags${e}`,
					type: "USHORT",
					value: t.flags
				},
				{
					name: `valueNameID${e}`,
					type: "USHORT",
					value: t.valueNameID
				},
				{
					name: `nominalValue${e}`,
					type: "FLOAT",
					value: t.nominalValue
				},
				{
					name: `rangeMinValue${e}`,
					type: "FLOAT",
					value: t.rangeMinValue
				},
				{
					name: `rangeMaxValue${e}`,
					type: "FLOAT",
					value: t.rangeMaxValue
				}
			];
		}, Ur[3] = function(e, t) {
			return [
				{
					name: `format${e}`,
					type: "USHORT",
					value: 3
				},
				{
					name: `axisIndex${e}`,
					type: "USHORT",
					value: t.axisIndex
				},
				{
					name: `flags${e}`,
					type: "USHORT",
					value: t.flags
				},
				{
					name: `valueNameID${e}`,
					type: "USHORT",
					value: t.valueNameID
				},
				{
					name: `value${e}`,
					type: "FLOAT",
					value: t.value
				},
				{
					name: `linkedValue${e}`,
					type: "FLOAT",
					value: t.linkedValue
				}
			];
		}, Ur[4] = function(e, t) {
			let n = [
				{
					name: `format${e}`,
					type: "USHORT",
					value: 4
				},
				{
					name: `axisCount${e}`,
					type: "USHORT",
					value: t.axisValues.length
				},
				{
					name: `flags${e}`,
					type: "USHORT",
					value: t.flags
				},
				{
					name: `valueNameID${e}`,
					type: "USHORT",
					value: t.valueNameID
				}
			];
			for (let r = 0; r < t.axisValues.length; r++) n = n.concat([{
				name: `format${e}axisIndex${r}`,
				type: "USHORT",
				value: t.axisValues[r].axisIndex
			}, {
				name: `format${e}value${r}`,
				type: "FLOAT",
				value: t.axisValues[r].value
			}]);
			return n;
		};
		function Wr(e, t) {
			return new I.Record("axisRecord_" + e, [
				{
					name: "axisTag_" + e,
					type: "TAG",
					value: t.tag
				},
				{
					name: "axisNameID_" + e,
					type: "USHORT",
					value: t.nameID
				},
				{
					name: "axisOrdering_" + e,
					type: "USHORT",
					value: t.ordering
				}
			]);
		}
		function Gr(e, t) {
			let n = t.format, r = Ur[n];
			j.argument(r !== void 0, `Unknown axis value table format ${n}`);
			let i = r(e, t);
			return new I.Table("axisValueTable_" + e, i);
		}
		function Kr(e) {
			let t = new I.Table("STAT", [
				{
					name: "majorVersion",
					type: "USHORT",
					value: 1
				},
				{
					name: "minorVersion",
					type: "USHORT",
					value: 2
				},
				{
					name: "designAxisSize",
					type: "USHORT",
					value: 8
				},
				{
					name: "designAxisCount",
					type: "USHORT",
					value: e.axes.length
				},
				{
					name: "designAxesOffset",
					type: "ULONG",
					value: 0
				},
				{
					name: "axisValueCount",
					type: "USHORT",
					value: e.values.length
				},
				{
					name: "offsetToAxisValueOffsets",
					type: "ULONG",
					value: 0
				},
				{
					name: "elidedFallbackNameID",
					type: "USHORT",
					value: e.elidedFallbackNameID
				}
			]);
			t.designAxesOffset = t.offsetToAxisValueOffsets = t.sizeOf();
			for (let n = 0; n < e.axes.length; n++) {
				let r = Wr(n, e.axes[n]);
				t.offsetToAxisValueOffsets += r.sizeOf(), t.fields = t.fields.concat(r.fields);
			}
			let n = [], r = [], i = e.values.length * 2;
			for (let t = 0; t < e.values.length; t++) {
				let a = Gr(t, e.values[t]);
				n.push({
					name: "offset_" + t,
					type: "USHORT",
					value: i
				}), i += a.sizeOf(), r = r.concat(a.fields);
			}
			return t.fields = t.fields.concat(n), t.fields = t.fields.concat(r), t;
		}
		var qr = {
			make: Kr,
			parse: Hr
		};
		function Jr(e, t) {
			return new I.Record("axisValueMap_" + e, [{
				name: "fromCoordinate_" + e,
				type: "F2DOT14",
				value: t.fromCoordinate
			}, {
				name: "toCoordinate_" + e,
				type: "F2DOT14",
				value: t.toCoordinate
			}]);
		}
		function Yr(e, t) {
			let n = new I.Record("segmentMap_" + e, [{
				name: "positionMapCount_" + e,
				type: "USHORT",
				value: t.axisValueMaps.length
			}]), r = [];
			for (let n = 0; n < t.axisValueMaps.length; n++) {
				let i = Jr(`${e}_${n}`, t.axisValueMaps[n]);
				r = r.concat(i.fields);
			}
			return n.fields = n.fields.concat(r), n;
		}
		function Xr(e, t) {
			j.argument(e.axisSegmentMaps.length === t.axes.length, "avar axis count must correspond to fvar axis count");
			let n = new I.Table("avar", [
				{
					name: "majorVersion",
					type: "USHORT",
					value: 1
				},
				{
					name: "minorVersion",
					type: "USHORT",
					value: 0
				},
				{
					name: "reserved",
					type: "USHORT",
					value: 0
				},
				{
					name: "axisCount",
					type: "USHORT",
					value: e.axisSegmentMaps.length
				}
			]);
			for (let t = 0; t < e.axisSegmentMaps.length; t++) {
				let r = Yr(t, e.axisSegmentMaps[t]);
				n.fields = n.fields.concat(r.fields);
			}
			return n;
		}
		function Zr(e, t, n) {
			t ||= 0;
			let r = new L(e, t), i = r.parseUShort(), a = r.parseUShort();
			i !== 1 && console.warn(`Unsupported avar table version ${i}.${a}`), r.skip("uShort", 1);
			let o = r.parseUShort();
			j.argument(o === n.axes.length, "avar axis count must correspond to fvar axis count");
			let s = [];
			for (let e = 0; e < o; e++) {
				let e = [], t = r.parseUShort();
				for (let n = 0; n < t; n++) {
					let t = r.parseF2Dot14(), n = r.parseF2Dot14();
					e.push({
						fromCoordinate: t,
						toCoordinate: n
					});
				}
				s.push({ axisValueMaps: e });
			}
			return {
				version: [i, a],
				axisSegmentMaps: s
			};
		}
		var Qr = {
			make: Xr,
			parse: Zr
		};
		function $r(e, t, n, r) {
			let i = new R.Parser(e, t), a = i.parseTupleVariationStore(i.relativeOffset, n.axes.length, "cvar", r), o = i.parseUShort(), s = i.parseUShort();
			return o !== 1 && console.warn(`Unsupported cvar table version ${o}.${s}`), {
				version: [o, s],
				...a
			};
		}
		function ei() {
			console.warn("Writing of cvar tables is not yet supported.");
		}
		var ti = {
			make: ei,
			parse: $r
		};
		function ni(e, t, n, r) {
			let i = new R.Parser(e, t), a = i.parseUShort(), o = i.parseUShort();
			a !== 1 && console.warn(`Unsupported gvar table version ${a}.${o}`);
			let s = i.parseUShort();
			s !== n.axes.length && console.warn(`axisCount ${s} in gvar table does not match the number of axes ${n.axes.length} in the fvar table!`);
			let c = i.parseUShort(), l = i.parsePointer32(function() {
				return this.parseTupleRecords(c, s);
			}), u = i.parseTupleVariationStoreList(s, "gvar", r);
			return {
				version: [a, o],
				sharedTuples: l,
				glyphVariations: u
			};
		}
		function ri() {
			console.warn("Writing of gvar tables is not yet supported.");
		}
		var ii = {
			make: ri,
			parse: ni
		};
		function ai(e, t) {
			let n = {}, r = new R.Parser(e, t);
			n.version = r.parseUShort(), j.argument(n.version <= 1, "Unsupported gasp table version."), n.numRanges = r.parseUShort(), n.gaspRanges = [];
			for (let e = 0; e < n.numRanges; e++) n.gaspRanges[e] = {
				rangeMaxPPEM: r.parseUShort(),
				rangeGaspBehavior: r.parseUShort()
			};
			return n;
		}
		function oi(e) {
			let t = new I.Table("gasp", [{
				name: "version",
				type: "USHORT",
				value: 1
			}, {
				name: "numRanges",
				type: "USHORT",
				value: e.numRanges
			}]);
			for (let n in e.gaspRanges) t.fields.push({
				name: "rangeMaxPPEM",
				type: "USHORT",
				value: e.gaspRanges[n].rangeMaxPPEM
			}), t.fields.push({
				name: "rangeGaspBehavior",
				type: "USHORT",
				value: e.gaspRanges[n].rangeGaspBehavior
			});
			return t;
		}
		var si = {
			parse: ai,
			make: oi
		};
		function ci(e, t) {
			let n = /* @__PURE__ */ new Map(), r = e.buffer, i = new L(e, t);
			if (i.parseUShort() !== 0) return n;
			i.relativeOffset = i.parseOffset32();
			let a = e.byteOffset + t + i.relativeOffset, o = i.parseUShort(), s = /* @__PURE__ */ new Map();
			for (let e = 0; e < o; e++) {
				let e = i.parseUShort(), t = i.parseUShort(), o = a + i.parseOffset32(), c = i.parseULong(), l = s.get(o);
				l === void 0 && (l = new Uint8Array(r, o, c), s.set(o, l));
				for (let r = e; r <= t; r++) n.set(r, l);
			}
			return n;
		}
		function li(e) {
			let t = Array.from(e.keys()).sort(), n = [], r = [], i = /* @__PURE__ */ new Map(), a = 0, o = { endGlyphID: null };
			for (let s = 0, c = t.length; s < c; s++) {
				let c = t[s], l = e.get(c), u = i.get(l);
				u === void 0 && (u = a, r.push(l), i.set(l, u), a += l.byteLength), c - 1 === o.endGlyphID && u === o.svgDocOffset ? o.endGlyphID = c : (o = {
					startGlyphID: c,
					endGlyphID: c,
					svgDocOffset: u,
					svgDocLength: l.byteLength
				}, n.push(o));
			}
			let s = n.length, c = r.length, l = 2 + s * 12, u = Array(4 + s * 4 + c), d = 0;
			u[d++] = {
				name: "version",
				type: "USHORT",
				value: 0
			}, u[d++] = {
				name: "svgDocumentListOffset",
				type: "ULONG",
				value: 10
			}, u[d++] = {
				name: "reserved",
				type: "ULONG",
				value: 0
			}, u[d++] = {
				name: "numEntries",
				type: "USHORT",
				value: s
			};
			for (let e = 0; e < s; e++) {
				let t = "documentRecord_" + e, { startGlyphID: r, endGlyphID: i, svgDocOffset: a, svgDocLength: o } = n[e];
				u[d++] = {
					name: t + "_startGlyphID",
					type: "USHORT",
					value: r
				}, u[d++] = {
					name: t + "_endGlyphID",
					type: "USHORT",
					value: i
				}, u[d++] = {
					name: t + "_svgDocOffset",
					type: "ULONG",
					value: l + a
				}, u[d++] = {
					name: t + "_svgDocLength",
					type: "ULONG",
					value: o
				};
			}
			for (let e = 0; e < c; e++) u[d++] = {
				name: "svgDoc_" + e,
				type: "LITERAL",
				value: r[e]
			};
			return new I.Table("SVG ", u);
		}
		var ui = {
			make: li,
			parse: ci
		};
		function di(e) {
			return Math.log(e) / Math.log(2) | 0;
		}
		function fi(e) {
			for (; e.length % 4 != 0;) e.push(0);
			let t = 0;
			for (let n = 0; n < e.length; n += 4) t += (e[n] << 24) + (e[n + 1] << 16) + (e[n + 2] << 8) + e[n + 3];
			return t %= 2 ** 32, t;
		}
		function pi(e, t, n, r) {
			return new I.Record("Table Record", [
				{
					name: "tag",
					type: "TAG",
					value: e === void 0 ? "" : e
				},
				{
					name: "checkSum",
					type: "ULONG",
					value: t === void 0 ? 0 : t
				},
				{
					name: "offset",
					type: "ULONG",
					value: n === void 0 ? 0 : n
				},
				{
					name: "length",
					type: "ULONG",
					value: r === void 0 ? 0 : r
				}
			]);
		}
		function mi(e) {
			let t = new I.Table("sfnt", [
				{
					name: "version",
					type: "TAG",
					value: "OTTO"
				},
				{
					name: "numTables",
					type: "USHORT",
					value: 0
				},
				{
					name: "searchRange",
					type: "USHORT",
					value: 0
				},
				{
					name: "entrySelector",
					type: "USHORT",
					value: 0
				},
				{
					name: "rangeShift",
					type: "USHORT",
					value: 0
				}
			]);
			t.tables = e, t.numTables = e.length;
			let n = 2 ** di(t.numTables);
			t.searchRange = 16 * n, t.entrySelector = di(n), t.rangeShift = t.numTables * 16 - t.searchRange;
			let r = [], i = [], a = t.sizeOf() + pi().sizeOf() * t.numTables;
			for (; a % 4 != 0;) a += 1, i.push({
				name: "padding",
				type: "BYTE",
				value: 0
			});
			for (let t = 0; t < e.length; t += 1) {
				let n = e[t];
				j.argument(n.tableName.length === 4, "Table name" + n.tableName + " is invalid.");
				let o = n.sizeOf(), s = pi(n.tableName, fi(n.encode()), a, o);
				for (r.push({
					name: s.tag + " Table Record",
					type: "RECORD",
					value: s
				}), i.push({
					name: n.tableName + " table",
					type: "RECORD",
					value: n
				}), a += o, j.argument(!isNaN(a), "Something went wrong calculating the offset."); a % 4 != 0;) a += 1, i.push({
					name: "padding",
					type: "BYTE",
					value: 0
				});
			}
			return r.sort(function(e, t) {
				return e.value.tag > t.value.tag ? 1 : -1;
			}), t.fields = t.fields.concat(r), t.fields = t.fields.concat(i), t;
		}
		function hi(e, t, n) {
			for (let n = 0; n < t.length; n += 1) {
				let r = e.charToGlyphIndex(t[n]);
				if (r > 0) return e.glyphs.get(r).getMetrics();
			}
			return n;
		}
		function gi(e) {
			let t = 0;
			for (let n = 0; n < e.length; n += 1) t += e[n];
			return t / e.length;
		}
		function _i(e) {
			let t = [], n = [], r = [], i = [], a = [], o = [], s = [], c, l = 0, u = 0, d = 0, f = 0, p = 0;
			for (let m = 0; m < e.glyphs.length; m += 1) {
				let h = e.glyphs.get(m), g = h.unicode | 0;
				if (isNaN(h.advanceWidth)) throw Error("Glyph " + h.name + " (" + m + "): advanceWidth is not a number.");
				(c > g || c === void 0) && g > 0 && (c = g), l < g && (l = g);
				let _ = gr.getUnicodeRange(g);
				if (_ < 32) u |= 1 << _;
				else if (_ < 64) d |= 1 << _ - 32;
				else if (_ < 96) f |= 1 << _ - 64;
				else if (_ < 123) p |= 1 << _ - 96;
				else throw Error("Unicode ranges bits > 123 are reserved for internal usage");
				if (h.name === ".notdef") continue;
				let v = h.getMetrics();
				t.push(v.xMin), n.push(v.yMin), r.push(v.xMax), i.push(v.yMax), o.push(v.leftSideBearing), s.push(v.rightSideBearing), a.push(h.advanceWidth);
			}
			let m = {
				xMin: Math.min.apply(null, t),
				yMin: Math.min.apply(null, n),
				xMax: Math.max.apply(null, r),
				yMax: Math.max.apply(null, i),
				advanceWidthMax: Math.max.apply(null, a),
				advanceWidthAvg: gi(a),
				minLeftSideBearing: Math.min.apply(null, o),
				maxLeftSideBearing: Math.max.apply(null, o),
				minRightSideBearing: Math.min.apply(null, s)
			};
			m.ascender = e.ascender, m.descender = e.descender;
			let h = 0;
			e.weightClass >= 600 && (h |= e.macStyleValues.BOLD), e.italicAngle < 0 && (h |= e.macStyleValues.ITALIC);
			let g = Zn.make({
				flags: 3,
				unitsPerEm: e.unitsPerEm,
				xMin: m.xMin,
				yMin: m.yMin,
				xMax: m.xMax,
				yMax: m.yMax,
				lowestRecPPEM: 3,
				macStyle: h,
				createdTimestamp: e.createdTimestamp
			}), _ = er.make({
				ascender: m.ascender,
				descender: m.descender,
				advanceWidthMax: m.advanceWidthMax,
				minLeftSideBearing: m.minLeftSideBearing,
				minRightSideBearing: m.minRightSideBearing,
				xMaxExtent: m.maxLeftSideBearing + (m.xMax - m.xMin),
				numberOfHMetrics: e.glyphs.length
			}), v = dr.make(e.glyphs.length), y = gr.make(Object.assign({
				xAvgCharWidth: Math.round(m.advanceWidthAvg),
				usFirstCharIndex: c,
				usLastCharIndex: l,
				ulUnicodeRange1: u,
				ulUnicodeRange2: d,
				ulUnicodeRange3: f,
				ulUnicodeRange4: p,
				sTypoAscender: m.ascender,
				sTypoDescender: m.descender,
				sTypoLineGap: 0,
				usWinAscent: m.yMax,
				usWinDescent: Math.abs(m.yMin),
				ulCodePageRange1: 1,
				sxHeight: hi(e, "xyvw", { yMax: Math.round(m.ascender / 2) }).yMax,
				sCapHeight: hi(e, "HIKLEFJMNTZBDPRAGOQSUVWXY", m).yMax,
				usDefaultChar: e.hasChar(" ") ? 32 : 0,
				usBreakChar: e.hasChar(" ") ? 32 : 0
			}, e.tables.os2)), b = ar.make(e.glyphs), ee = Ct.make(e.glyphs), x = e.getEnglishName("fontFamily"), S = e.getEnglishName("fontSubfamily"), C = x + " " + S, te = e.getEnglishName("postScriptName");
			te ||= x.replace(/\s/g, "") + "-" + S;
			let w = {};
			for (let t in e.names) w[t] = e.names[t];
			w.unicode = w.unicode || {}, w.macintosh = w.macintosh || {}, w.windows = w.windows || {};
			let T = e.names.unicode || {}, E = e.names.macintosh || {}, ne = e.names.windows || {};
			for (let t in w) {
				if (w[t] = w[t] || {}, !w[t].uniqueID) {
					let n = e.getEnglishName("manufacturer") || "";
					w[t].uniqueID = { en: `${n}: ${C}` };
				}
				w[t].postScriptName || (w[t].postScriptName = { en: te });
			}
			w.unicode.preferredFamily || (w.unicode.preferredFamily = T.fontFamily || E.fontFamily || ne.fontFamily), w.macintosh.preferredFamily || (w.macintosh.preferredFamily = E.fontFamily || T.fontFamily || ne.fontFamily), w.windows.preferredFamily || (w.windows.preferredFamily = ne.fontFamily || T.fontFamily || E.fontFamily), w.unicode.preferredSubfamily || (w.unicode.preferredSubfamily = T.fontSubfamily || E.fontSubfamily || ne.fontSubfamily), w.macintosh.preferredSubfamily || (w.macintosh.preferredSubfamily = E.fontSubfamily || T.fontSubfamily || ne.fontSubfamily), w.windows.preferredSubfamily || (w.windows.preferredSubfamily = ne.fontSubfamily || T.fontSubfamily || E.fontSubfamily);
			let re = [], ie = pt.make(w, re), ae = re.length > 0 ? cr.make(re) : void 0, oe = yr.make(e), se = Jn.make(e.glyphs, {
				version: e.getEnglishName("version"),
				fullName: C,
				familyName: x,
				weightName: S,
				postScriptName: te,
				unitsPerEm: e.unitsPerEm,
				fontBBox: [
					0,
					m.yMin,
					m.ascender,
					m.advanceWidthMax
				],
				topDict: e.tables.cff && e.tables.cff.topDict || {}
			}), D = e.metas && Object.keys(e.metas).length > 0 ? Or.make(e.metas) : void 0, O = [
				g,
				_,
				v,
				y,
				ie,
				ee,
				oe,
				se,
				b
			];
			ae && O.push(ae);
			let ce = {
				gsub: Tr,
				cpal: Xt,
				colr: jr,
				stat: qr,
				avar: Qr,
				cvar: ti,
				fvar: Rr,
				gvar: ii,
				gasp: si,
				svg: ui
			}, le = {
				avar: [e.tables.fvar],
				fvar: [e.names]
			};
			for (let t in ce) {
				let n = e.tables[t];
				if (n) {
					let r = ce[t].make.call(e, n, ...le[t] || []);
					r && O.push(r);
				}
			}
			D && O.push(D);
			let k = mi(O), A = fi(k.encode()), ue = k.fields, de = !1;
			for (let e = 0; e < ue.length; e += 1) if (ue[e].name === "head table") {
				ue[e].value.checkSumAdjustment = 2981146554 - A, de = !0;
				break;
			}
			if (!de) throw Error("Could not find head table with checkSum to adjust.");
			return k;
		}
		var vi = {
			make: mi,
			fontToTable: _i,
			computeCheckSum: fi
		};
		function yi(e, t) {
			let n = 0, r = e.length - 1;
			for (; n <= r;) {
				let i = n + r >>> 1, a = e[i].tag;
				if (a === t) return i;
				a < t ? n = i + 1 : r = i - 1;
			}
			return -n - 1;
		}
		function bi(e, t) {
			let n = 0, r = e.length - 1;
			for (; n <= r;) {
				let i = n + r >>> 1, a = e[i];
				if (a === t) return i;
				a < t ? n = i + 1 : r = i - 1;
			}
			return -n - 1;
		}
		function xi(e, t) {
			let n, r = 0, i = e.length - 1;
			for (; r <= i;) {
				let a = r + i >>> 1;
				n = e[a];
				let o = n.start;
				if (o === t) return n;
				o < t ? r = a + 1 : i = a - 1;
			}
			if (r > 0) return n = e[r - 1], t > n.end ? 0 : n;
		}
		function Si(e, t) {
			this.font = e, this.tableName = t;
		}
		Si.prototype = {
			searchTag: yi,
			binSearch: bi,
			getTable: function(e) {
				let t = this.font.tables[this.tableName];
				return !t && e && (t = this.font.tables[this.tableName] = this.createDefaultTable()), t;
			},
			getScriptNames: function() {
				let e = this.getTable();
				return e ? e.scripts.map(function(e) {
					return e.tag;
				}) : [];
			},
			getDefaultScriptName: function() {
				let e = this.getTable();
				if (!e) return;
				let t = !1;
				for (let n = 0; n < e.scripts.length; n++) {
					let r = e.scripts[n].tag;
					if (r === "DFLT") return r;
					r === "latn" && (t = !0);
				}
				if (t) return "latn";
			},
			getScriptTable: function(e, t) {
				let n = this.getTable(t);
				if (n) {
					e ||= "DFLT";
					let r = n.scripts, i = yi(n.scripts, e);
					if (i >= 0) return r[i].script;
					if (t) {
						let t = {
							tag: e,
							script: {
								defaultLangSys: {
									reserved: 0,
									reqFeatureIndex: 65535,
									featureIndexes: []
								},
								langSysRecords: []
							}
						};
						return r.splice(-1 - i, 0, t), t.script;
					}
				}
			},
			getLangSysTable: function(e, t, n) {
				let r = this.getScriptTable(e, n);
				if (r) {
					if (!t || t === "dflt" || t === "DFLT") return r.defaultLangSys;
					let e = yi(r.langSysRecords, t);
					if (e >= 0) return r.langSysRecords[e].langSys;
					if (n) {
						let n = {
							tag: t,
							langSys: {
								reserved: 0,
								reqFeatureIndex: 65535,
								featureIndexes: []
							}
						};
						return r.langSysRecords.splice(-1 - e, 0, n), n.langSys;
					}
				}
			},
			getFeatureTable: function(e, t, n, r) {
				let i = this.getLangSysTable(e, t, r);
				if (i) {
					let e, t = i.featureIndexes, a = this.font.tables[this.tableName].features;
					for (let r = 0; r < t.length; r++) if (e = a[t[r]], e.tag === n) return e.feature;
					if (r) {
						let r = a.length;
						return j.assert(r === 0 || n >= a[r - 1].tag, "Features must be added in alphabetical order."), e = {
							tag: n,
							feature: {
								params: 0,
								lookupListIndexes: []
							}
						}, a.push(e), t.push(r), e.feature;
					}
				}
			},
			getLookupTables: function(e, t, n, r, i) {
				let a = this.getFeatureTable(e, t, n, i), o = [];
				if (a) {
					let e, t = a.lookupListIndexes, n = this.font.tables[this.tableName].lookups;
					for (let i = 0; i < t.length; i++) e = n[t[i]], e.lookupType === r && o.push(e);
					if (o.length === 0 && i) {
						e = {
							lookupType: r,
							lookupFlag: 0,
							subtables: [],
							markFilteringSet: void 0
						};
						let i = n.length;
						return n.push(e), t.push(i), [e];
					}
				}
				return o;
			},
			getGlyphClass: function(e, t) {
				switch (e.format) {
					case 1: return e.startGlyph <= t && t < e.startGlyph + e.classes.length ? e.classes[t - e.startGlyph] : 0;
					case 2: {
						let n = xi(e.ranges, t);
						return n ? n.classId : 0;
					}
				}
			},
			getCoverageIndex: function(e, t) {
				switch (e.format) {
					case 1: {
						let n = bi(e.glyphs, t);
						return n >= 0 ? n : -1;
					}
					case 2: {
						let n = xi(e.ranges, t);
						return n ? n.index + t - n.start : -1;
					}
				}
			},
			expandCoverage: function(e) {
				if (e.format === 1) return e.glyphs;
				{
					let t = [], n = e.ranges;
					for (let e = 0; e < n.length; e++) {
						let r = n[e], i = r.start, a = r.end;
						for (let e = i; e <= a; e++) t.push(e);
					}
					return t;
				}
			}
		};
		var Ci = Si;
		function wi(e) {
			Ci.call(this, e, "gpos");
		}
		wi.prototype = Ci.prototype, wi.prototype.init = function() {
			let e = this.getDefaultScriptName();
			this.defaultKerningTables = this.getKerningTables(e);
		}, wi.prototype.getKerningValue = function(e, t, n) {
			for (let r = 0; r < e.length; r++) {
				let i = e[r].subtables;
				for (let e = 0; e < i.length; e++) {
					let r = i[e], a = this.getCoverageIndex(r.coverage, t);
					if (!(a < 0)) switch (r.posFormat) {
						case 1: {
							let e = r.pairSets[a];
							for (let t = 0; t < e.length; t++) {
								let r = e[t];
								if (r.secondGlyph === n) return r.value1 && r.value1.xAdvance || 0;
							}
							break;
						}
						case 2: {
							let e = this.getGlyphClass(r.classDef1, t), i = this.getGlyphClass(r.classDef2, n), a = r.classRecords[e][i];
							return a.value1 && a.value1.xAdvance || 0;
						}
					}
				}
			}
			return 0;
		}, wi.prototype.getKerningTables = function(e, t) {
			if (this.font.tables.gpos) return this.getLookupTables(e, t, "kern", 2);
		};
		var Ti = wi;
		function Ei(e, t) {
			let n = e.length;
			if (n !== t.length) return !1;
			for (let r = 0; r < n; r++) if (e[r] !== t[r]) return !1;
			return !0;
		}
		function Di(e, t, n) {
			let r = 0, i = e.length - 1, a = null;
			for (; r <= i;) {
				let o = Math.floor((r + i) / 2), s = e[o], c = s[t];
				if (c < n) r = o + 1;
				else if (c > n) i = o - 1;
				else {
					a = s;
					break;
				}
			}
			return a;
		}
		function V(e, t, n) {
			let r = 0, i = e.length - 1;
			for (; r <= i;) {
				let a = Math.floor((r + i) / 2), o = e[a];
				if (o[t] < n) r = a + 1;
				else if (o[t] > n) i = a - 1;
				else return a;
			}
			return -1;
		}
		function Oi(e, t, n) {
			let r = 0, i = e.length, a = (e, n) => e[t] - n[t];
			for (; r < i;) {
				let t = r + i >>> 1;
				a(e[t], n) < 0 ? r = t + 1 : i = t;
			}
			return e.splice(r, 0, n), r;
		}
		function ki(e) {
			return e[0] === 31 && e[1] === 139 && e[2] === 8;
		}
		function Ai(e) {
			let t = new DataView(e.buffer, e.byteOffset, e.byteLength), n = 10, r = e.byteLength - 8, i = t.getInt8(3);
			if (i & 4 && (n += 2 + t.getUint16(n, !0)), i & 8) for (; n < r && e[n++] !== 0;);
			if (i & 16) for (; n < r && e[n++] !== 0;);
			if (i & 2 && (n += 2), n >= r) throw Error("Can't find compressed blocks");
			let a = t.getUint32(t.byteLength - 4, !0);
			return ie(e.subarray(n, r), new Uint8Array(a));
		}
		function ji(e) {
			return {
				x: e.x,
				y: e.y,
				onCurve: e.onCurve,
				lastPointOfContour: e.lastPointOfContour
			};
		}
		function Mi(e) {
			return {
				glyphIndex: e.glyphIndex,
				xScale: e.xScale,
				scale01: e.scale01,
				scale10: e.scale10,
				yScale: e.yScale,
				dx: e.dx,
				dy: e.dy
			};
		}
		function Ni(e) {
			Ci.call(this, e, "gsub");
		}
		function Pi(e, t, n) {
			let r = e.subtables;
			for (let e = 0; e < r.length; e++) {
				let n = r[e];
				if (n.substFormat === t) return n;
			}
			if (n) return r.push(n), n;
		}
		Ni.prototype = Ci.prototype, Ni.prototype.createDefaultTable = function() {
			return {
				version: 1,
				scripts: [{
					tag: "DFLT",
					script: {
						defaultLangSys: {
							reserved: 0,
							reqFeatureIndex: 65535,
							featureIndexes: []
						},
						langSysRecords: []
					}
				}],
				features: [],
				lookups: []
			};
		}, Ni.prototype.getSingle = function(e, t, n) {
			let r = [], i = this.getLookupTables(t, n, e, 1);
			for (let e = 0; e < i.length; e++) {
				let t = i[e].subtables;
				for (let e = 0; e < t.length; e++) {
					let n = t[e], i = this.expandCoverage(n.coverage), a;
					if (n.substFormat === 1) {
						let e = n.deltaGlyphId;
						for (a = 0; a < i.length; a++) {
							let t = i[a];
							r.push({
								sub: t,
								by: t + e
							});
						}
					} else {
						let e = n.substitute;
						for (a = 0; a < i.length; a++) r.push({
							sub: i[a],
							by: e[a]
						});
					}
				}
			}
			return r;
		}, Ni.prototype.getMultiple = function(e, t, n) {
			let r = [], i = this.getLookupTables(t, n, e, 2);
			for (let e = 0; e < i.length; e++) {
				let t = i[e].subtables;
				for (let e = 0; e < t.length; e++) {
					let n = t[e], i = this.expandCoverage(n.coverage), a;
					for (a = 0; a < i.length; a++) {
						let e = i[a], t = n.sequences[a];
						r.push({
							sub: e,
							by: t
						});
					}
				}
			}
			return r;
		}, Ni.prototype.getAlternates = function(e, t, n) {
			let r = [], i = this.getLookupTables(t, n, e, 3);
			for (let e = 0; e < i.length; e++) {
				let t = i[e].subtables;
				for (let e = 0; e < t.length; e++) {
					let n = t[e], i = this.expandCoverage(n.coverage), a = n.alternateSets;
					for (let e = 0; e < i.length; e++) r.push({
						sub: i[e],
						by: a[e]
					});
				}
			}
			return r;
		}, Ni.prototype.getLigatures = function(e, t, n) {
			let r = [], i = this.getLookupTables(t, n, e, 4);
			for (let e = 0; e < i.length; e++) {
				let t = i[e].subtables;
				for (let e = 0; e < t.length; e++) {
					let n = t[e], i = this.expandCoverage(n.coverage), a = n.ligatureSets;
					for (let e = 0; e < i.length; e++) {
						let t = i[e], n = a[e];
						for (let e = 0; e < n.length; e++) {
							let i = n[e];
							r.push({
								sub: [t].concat(i.components),
								by: i.ligGlyph
							});
						}
					}
				}
			}
			return r;
		}, Ni.prototype.addSingle = function(e, t, n, r) {
			let i = this.getLookupTables(n, r, e, 1, !0)[0], a = Pi(i, 2, {
				substFormat: 2,
				coverage: {
					format: 1,
					glyphs: []
				},
				substitute: []
			});
			j.assert(a.coverage.format === 1, "Single: unable to modify coverage table format " + a.coverage.format);
			let o = t.sub, s = this.binSearch(a.coverage.glyphs, o);
			s < 0 && (s = -1 - s, a.coverage.glyphs.splice(s, 0, o), a.substitute.splice(s, 0, 0)), a.substitute[s] = t.by;
		}, Ni.prototype.addMultiple = function(e, t, n, r) {
			j.assert(t.by instanceof Array && t.by.length > 1, "Multiple: \"by\" must be an array of two or more ids");
			let i = this.getLookupTables(n, r, e, 2, !0)[0], a = Pi(i, 1, {
				substFormat: 1,
				coverage: {
					format: 1,
					glyphs: []
				},
				sequences: []
			});
			j.assert(a.coverage.format === 1, "Multiple: unable to modify coverage table format " + a.coverage.format);
			let o = t.sub, s = this.binSearch(a.coverage.glyphs, o);
			s < 0 && (s = -1 - s, a.coverage.glyphs.splice(s, 0, o), a.sequences.splice(s, 0, 0)), a.sequences[s] = t.by;
		}, Ni.prototype.addAlternate = function(e, t, n, r) {
			let i = this.getLookupTables(n, r, e, 3, !0)[0], a = Pi(i, 1, {
				substFormat: 1,
				coverage: {
					format: 1,
					glyphs: []
				},
				alternateSets: []
			});
			j.assert(a.coverage.format === 1, "Alternate: unable to modify coverage table format " + a.coverage.format);
			let o = t.sub, s = this.binSearch(a.coverage.glyphs, o);
			s < 0 && (s = -1 - s, a.coverage.glyphs.splice(s, 0, o), a.alternateSets.splice(s, 0, 0)), a.alternateSets[s] = t.by;
		}, Ni.prototype.addLigature = function(e, t, n, r) {
			let i = this.getLookupTables(n, r, e, 4, !0)[0], a = i.subtables[0];
			a || (a = {
				substFormat: 1,
				coverage: {
					format: 1,
					glyphs: []
				},
				ligatureSets: []
			}, i.subtables[0] = a), j.assert(a.coverage.format === 1, "Ligature: unable to modify coverage table format " + a.coverage.format);
			let o = t.sub[0], s = t.sub.slice(1), c = {
				ligGlyph: t.by,
				components: s
			}, l = this.binSearch(a.coverage.glyphs, o);
			if (l >= 0) {
				let e = a.ligatureSets[l];
				for (let t = 0; t < e.length; t++) if (Ei(e[t].components, s)) return;
				e.push(c);
			} else l = -1 - l, a.coverage.glyphs.splice(l, 0, o), a.ligatureSets.splice(l, 0, [c]);
		}, Ni.prototype.getFeature = function(e, t, n) {
			if (/ss\d\d/.test(e)) return this.getSingle(e, t, n);
			switch (e) {
				case "aalt":
				case "salt": return this.getSingle(e, t, n).concat(this.getAlternates(e, t, n));
				case "dlig":
				case "liga":
				case "rlig": return this.getLigatures(e, t, n);
				case "ccmp": return this.getMultiple(e, t, n).concat(this.getLigatures(e, t, n));
				case "stch": return this.getMultiple(e, t, n);
			}
		}, Ni.prototype.add = function(e, t, n, r) {
			if (/ss\d\d/.test(e)) return this.addSingle(e, t, n, r);
			switch (e) {
				case "aalt":
				case "salt": return typeof t.by == "number" ? this.addSingle(e, t, n, r) : this.addAlternate(e, t, n, r);
				case "dlig":
				case "liga":
				case "rlig": return this.addLigature(e, t, n, r);
				case "ccmp": return t.by instanceof Array ? this.addMultiple(e, t, n, r) : this.addLigature(e, t, n, r);
			}
		};
		var Fi = Ni, Ii = class {
			constructor(e) {
				this.defaultValue = 255, this.font = e;
			}
			cpal() {
				return this.font.tables && this.font.tables.cpal ? this.font.tables.cpal : !1;
			}
			getAll(e) {
				let t = [], n = this.cpal();
				if (!n) return t;
				for (let r = 0; r < n.colorRecordIndices.length; r++) {
					let i = n.colorRecordIndices[r], a = [];
					for (let t = i; t < i + n.numPaletteEntries; t++) a.push(Yt(n.colorRecords[t], e || "hexa"));
					t.push(a);
				}
				return t;
			}
			toCPALcolor(e) {
				return Array.isArray(e) ? e.map((e) => Jt(e, "raw")) : Jt(e, "raw");
			}
			fillPalette(e, t = [], n = this.cpal().numPaletteEntries) {
				return e = Number.isInteger(e) ? this.get(e, "raw") : e, Object.assign(Array(n).fill(this.defaultValue), this.toCPALcolor(e).concat(this.toCPALcolor(t)));
			}
			extend(e) {
				if (this.ensureCPAL(Array(e).fill(this.defaultValue))) return;
				let t = this.cpal(), n = t.numPaletteEntries + e, r = this.getAll().map((e) => this.fillPalette(e, [], n));
				t.numPaletteEntries = n, t.colorRecords = this.toCPALcolor(r.flat()), this.updateIndices();
			}
			get(e, t = "hexa") {
				return this.getAll(t)[e] || null;
			}
			getColor(e, t = 0, n = "hexa") {
				return Ut(this.font, e, t, n);
			}
			setColor(e, t, n = 0) {
				e = parseInt(e), n = parseInt(n);
				let r = this.getAll("raw"), i = r[n];
				if (!i) throw Error(`paletteIndex ${n} out of range`);
				let a = this.cpal(), o = a.numPaletteEntries;
				Array.isArray(t) || (t = [t]), t.length + e > o && (this.extend(t.length + e - o), r = this.getAll("raw"), i = r[n]);
				for (let n = 0; n < t.length; n++) i[n + e] = this.toCPALcolor(t[n]);
				a.colorRecords = r.flat(), this.updateIndices();
			}
			add(e) {
				if (this.ensureCPAL(e)) return;
				let t = this.cpal(), n = t.numPaletteEntries;
				e && e.length ? (e = this.toCPALcolor(e), e.length > n ? this.extend(e.length - n) : e.length < n && (e = this.fillPalette(e)), t.colorRecordIndices.push(t.colorRecords.length), t.colorRecords.push(...e)) : (t.colorRecordIndices.push(t.colorRecords.length), t.colorRecords.push(...Array(n).fill(this.defaultValue)));
			}
			delete(e) {
				let t = this.getAll("raw");
				delete t[e];
				let n = this.cpal();
				n.colorRecordIndices.pop(), n.colorRecords = t.flat();
			}
			deleteColor(e, t) {
				if (e === t) throw Error("replacementIndex cannot be the same as colorIndex");
				let n = this.cpal(), r = this.getAll("raw"), i = [];
				if (t > n.numPaletteEntries - 1) throw Error(`Replacement index out of range: numPaletteEntries after deletion: ${n.numPaletteEntries - 1}, replacementIndex: ${t})`);
				for (let t = 0; t < r.length; t++) {
					let n = r[t].filter((t, n) => n !== e);
					i.push(n);
				}
				let a = this.font.tables.colr;
				if (a) {
					let n = a.layerRecords;
					for (let i = 0; i < n.length; i++) {
						let a = n[i].paletteIndex;
						if (a > e) --n[i].paletteIndex;
						else if (a === e) {
							let a = 0;
							for (let n = 0; n < r.length; n++) if (t > e && t <= e + r[n].length) {
								a++;
								break;
							}
							n[i].paletteIndex = t - a;
						}
					}
					this.font.tables.colr = {
						...a,
						layerRecords: n
					};
				}
				let o = i.flat();
				for (let e = 0; e < r.length; e++) n.colorRecordIndices[e] -= e;
				n.numPaletteEntries = Math.max(0, n.numPaletteEntries - 1), n.colorRecords = this.toCPALcolor(o);
			}
			ensureCPAL(e) {
				return this.cpal() ? !1 : (e = !e || !e.length ? [this.defaultValue] : this.toCPALcolor(e), this.font.tables.cpal = {
					version: 0,
					numPaletteEntries: e.length,
					colorRecords: e,
					colorRecordIndices: [0]
				}, !0);
			}
			updateIndices() {
				let e = this.cpal(), t = Math.ceil(e.colorRecords.length / e.numPaletteEntries);
				e.colorRecordIndices = [];
				for (let n = 0; n < t; n++) e.colorRecordIndices.push(n * e.numPaletteEntries);
			}
		}, Li = class {
			constructor(e) {
				this.font = e;
			}
			ensureCOLR() {
				return this.font.tables.colr || (this.font.tables.colr = {
					version: 0,
					baseGlyphRecords: [],
					layerRecords: []
				}), this.font;
			}
			get(e) {
				let t = this.font, n = [], r = t.tables.colr, i = t.tables.cpal;
				if (!r || !i) return n;
				let a = Di(r.baseGlyphRecords, "glyphID", e);
				if (!a) return n;
				let o = a.firstLayerIndex, s = a.numLayers;
				for (let e = 0; e < s; e++) {
					let i = r.layerRecords[o + e];
					n.push({
						glyph: t.glyphs.get(i.glyphID),
						paletteIndex: i.paletteIndex
					});
				}
				return n;
			}
			add(e, t, n) {
				let r = this.get(e);
				t = Array.isArray(t) ? t : [t], n === void 0 || n === Infinity || n > r.length ? n = r.length : n < 0 && (n = r.length + 1 + n % (r.length + 1), n >= r.length + 1 && (n -= r.length + 1));
				let i = [];
				for (let e = 0; e < n; e++) {
					let t = Number.isInteger(r[e].glyph) ? r[e].glyph : r[e].glyph.index;
					i.push({
						glyphID: t,
						paletteIndex: r[e].paletteIndex
					});
				}
				for (let e of t) {
					let t = Number.isInteger(e.glyph) ? e.glyph : e.glyph.index;
					i.push({
						glyphID: t,
						paletteIndex: e.paletteIndex
					});
				}
				for (let e = n; e < r.length; e++) {
					let t = Number.isInteger(r[e].glyph) ? r[e].glyph : r[e].glyph.index;
					i.push({
						glyphID: t,
						paletteIndex: r[e].paletteIndex
					});
				}
				this.updateColrTable(e, i);
			}
			setPaletteIndex(e, t, n) {
				let r = this.get(e);
				r[t] ? (r = r.map((e, r) => ({
					glyphID: e.glyph.index,
					paletteIndex: r === t ? n : e.paletteIndex
				})), this.updateColrTable(e, r)) : console.error("Invalid layer index");
			}
			remove(e, t, n = t) {
				let r = this.get(e);
				r = r.map((e) => ({
					glyphID: e.glyph.index,
					paletteIndex: e.paletteIndex
				})), r.splice(t, n - t + 1), this.updateColrTable(e, r);
			}
			updateColrTable(e, t) {
				this.ensureCOLR();
				let n = this.font.tables.colr, r = V(n.baseGlyphRecords, "glyphID", e);
				if (r === -1) {
					let t = {
						glyphID: e,
						firstLayerIndex: n.layerRecords.length,
						numLayers: 0
					};
					r = Oi(n.baseGlyphRecords, "glyphID", t);
				}
				let i = n.baseGlyphRecords[r], a = i.numLayers, o = t.length, s = o - a;
				if (s > 0) {
					let e = t.slice(a).map((e) => ({
						glyphID: e.glyphID,
						paletteIndex: e.paletteIndex
					}));
					n.layerRecords.splice(i.firstLayerIndex + a, 0, ...e);
				} else s < 0 && n.layerRecords.splice(i.firstLayerIndex + o, -s);
				for (let e = 0; e < Math.min(a, o); e++) n.layerRecords[i.firstLayerIndex + e] = {
					glyphID: t[e].glyphID,
					paletteIndex: t[e].paletteIndex
				};
				if (i.numLayers = o, s !== 0) for (let e = 0; e < n.baseGlyphRecords.length; e++) {
					let t = n.baseGlyphRecords[e];
					e === r || t.firstLayerIndex < i.firstLayerIndex || (n.baseGlyphRecords[e].firstLayerIndex += s);
				}
			}
		}, Ri = class {
			constructor(e) {
				this.font = e, this.cache = /* @__PURE__ */ new WeakMap();
			}
			get(e) {
				let t = this.getOrCreateSvgImageCacheEntry(e);
				return t && t.image;
			}
			getAsync(e) {
				let t = this.getOrCreateSvgImageCacheEntry(e);
				return t && t.promise;
			}
			getOrCreateSvgImageCacheEntry(e) {
				let t = this.font.tables.svg;
				if (t === void 0) return;
				let n = t.get(e);
				if (n === void 0) return;
				let r = this.cache.get(n);
				r === void 0 && (r = zi(n), this.cache.set(n, r));
				let i = r.images.get(e);
				return i === void 0 && (i = Bi(this.font, r.template, e), i.promise.then((t) => {
					if (i.image = t, typeof this.font.onGlyphUpdated == "function") try {
						this.font.onGlyphUpdated(e);
					} catch (t) {
						console.error("font.onGlyphUpdated", e, t);
					}
				}), r.images.set(e, i)), i;
			}
		};
		function zi(e) {
			return {
				template: Vi(e).then(Wi),
				images: /* @__PURE__ */ new Map()
			};
		}
		function Bi(e, t, n) {
			return {
				promise: t.then((t) => {
					let r;
					typeof t == "string" ? r = t : (t[4] = n, r = t.join(""));
					let i = Gi(r, e.unitsPerEm);
					return i.image.decode().then(() => i);
				}),
				image: void 0
			};
		}
		var Vi = typeof DecompressionStream == "function" ? Ui : Hi;
		function Hi(e) {
			try {
				return Promise.resolve(new TextDecoder().decode(ki(e) ? Ai(e) : e));
			} catch (e) {
				return Promise.reject(e);
			}
		}
		function Ui(e) {
			if (ki(e)) return new Response(new Response(e).body.pipeThrough(new DecompressionStream("gzip"))).text();
			try {
				return Promise.resolve(new TextDecoder().decode(e));
			} catch (e) {
				return Promise.reject(e);
			}
		}
		function Wi(e) {
			let t = e.indexOf("<svg"), n = e.indexOf(">", t + 4) + 1;
			if (/ id=['"]glyph\d+['"]/.test(e.substring(t, n))) return e;
			let r = e.lastIndexOf("</svg>");
			return [
				e.substring(0, n),
				"<defs>",
				e.substring(n, r),
				"</defs><use href=\"#glyph",
				"",
				"\"/>",
				e.substring(r)
			];
		}
		function Gi(e, t) {
			let n = new DOMParser().parseFromString(e, "image/svg+xml").documentElement, r = n.viewBox.baseVal, i = n.width.baseVal, a = n.height.baseVal, o = 1, s = 1;
			r.width > 0 && r.height > 0 && (i.unitType === 1 ? (o = i.valueInSpecifiedUnits / r.width, s = a.unitType === 1 ? a.valueInSpecifiedUnits / r.height : o) : a.unitType === 1 ? (s = a.valueInSpecifiedUnits / r.height, o = s) : t && (o = t / r.width, s = t / r.height));
			let c = document.createElement("div");
			c.style.position = "fixed", c.style.visibility = "hidden", c.appendChild(n), document.body.appendChild(c);
			let l = n.getBBox();
			document.body.removeChild(c);
			let u = (l.x - r.x) * o, d = (r.y - l.y) * s, f = l.width * o, p = l.height * s;
			n.setAttribute("viewBox", [
				l.x,
				l.y,
				l.width,
				l.height
			].join(" ")), o !== 1 && n.setAttribute("width", f), s !== 1 && n.setAttribute("height", p);
			let m = new Image(f, p);
			return m.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(n.outerHTML), {
				leftSideBearing: u,
				baseline: d,
				image: m
			};
		}
		var Ki = /* @__PURE__ */ new WeakMap();
		function qi(e, t, n, r, i) {
			let a;
			return (t & r) > 0 ? (a = e.parseByte(), (t & i) === 0 && (a = -a), a = n + a) : a = (t & i) > 0 ? n : n + e.parseShort(), a;
		}
		function Ji(e, t, n) {
			let r = new R.Parser(t, n);
			e._numberOfContours = r.parseShort(), e._xMin = r.parseShort(), e._yMin = r.parseShort(), e._xMax = r.parseShort(), e._yMax = r.parseShort();
			let i, a;
			if (e._numberOfContours > 0) {
				let t = e.endPointIndices = [];
				for (let n = 0; n < e._numberOfContours; n += 1) t.push(r.parseUShort());
				e.instructionLength = r.parseUShort(), e.instructions = [];
				for (let t = 0; t < e.instructionLength; t += 1) e.instructions.push(r.parseByte());
				let n = t[t.length - 1] + 1;
				i = [];
				for (let e = 0; e < n; e += 1) if (a = r.parseByte(), i.push(a), (a & 8) > 0) {
					let t = r.parseByte();
					for (let n = 0; n < t; n += 1) i.push(a), e += 1;
				}
				if (j.argument(i.length === n, "Bad flags."), t.length > 0) {
					let o = [], s;
					if (n > 0) {
						for (let e = 0; e < n; e += 1) a = i[e], s = {}, s.onCurve = !!(a & 1), s.lastPointOfContour = t.indexOf(e) >= 0, o.push(s);
						let e = 0;
						for (let t = 0; t < n; t += 1) a = i[t], s = o[t], s.x = qi(r, a, e, 2, 16), e = s.x;
						let c = 0;
						for (let e = 0; e < n; e += 1) a = i[e], s = o[e], s.y = qi(r, a, c, 4, 32), c = s.y;
					}
					e.points = o;
				} else e.points = [];
			} else if (e._numberOfContours === 0) e.points = [];
			else {
				e.isComposite = !0, e.points = [], e.components = [];
				let t = !0;
				for (; t;) {
					i = r.parseUShort();
					let n = {
						glyphIndex: r.parseUShort(),
						xScale: 1,
						scale01: 0,
						scale10: 0,
						yScale: 1,
						dx: 0,
						dy: 0
					};
					(i & 1) > 0 ? (i & 2) > 0 ? (n.dx = r.parseShort(), n.dy = r.parseShort()) : n.matchedPoints = [r.parseUShort(), r.parseUShort()] : (i & 2) > 0 ? (n.dx = r.parseChar(), n.dy = r.parseChar()) : n.matchedPoints = [r.parseByte(), r.parseByte()], (i & 8) > 0 ? n.xScale = n.yScale = r.parseF2Dot14() : (i & 64) > 0 ? (n.xScale = r.parseF2Dot14(), n.yScale = r.parseF2Dot14()) : (i & 128) > 0 && (n.xScale = r.parseF2Dot14(), n.scale01 = r.parseF2Dot14(), n.scale10 = r.parseF2Dot14(), n.yScale = r.parseF2Dot14()), e.components.push(n), t = !!(i & 32);
				}
				if (i & 256) {
					e.instructionLength = r.parseUShort(), e.instructions = [];
					for (let t = 0; t < e.instructionLength; t += 1) e.instructions.push(r.parseByte());
				}
			}
		}
		function Yi(e, t) {
			let n = [];
			for (let r = 0; r < e.length; r += 1) {
				let i = e[r], a = {
					x: t.xScale * i.x + t.scale10 * i.y + t.dx,
					y: t.scale01 * i.x + t.yScale * i.y + t.dy,
					onCurve: i.onCurve,
					lastPointOfContour: i.lastPointOfContour
				};
				n.push(a);
			}
			return n;
		}
		function Xi(e) {
			let t = [], n = [];
			for (let r = 0; r < e.length; r += 1) {
				let i = e[r];
				n.push(i), i.lastPointOfContour && (t.push(n), n = []);
			}
			return j.argument(n.length === 0, "There are still points left in the current contour."), t;
		}
		function Zi(e) {
			let t = new ue();
			if (!e) return t;
			let n = Xi(e);
			for (let e = 0; e < n.length; ++e) {
				let r = n[e], i = r[r.length - 1], a = r[0];
				if (i.onCurve) t.moveTo(i.x, i.y);
				else if (a.onCurve) t.moveTo(a.x, a.y);
				else {
					let e = {
						x: (i.x + a.x) * .5,
						y: (i.y + a.y) * .5
					};
					t.moveTo(e.x, e.y);
				}
				for (let e = 0; e < r.length; ++e) if (i = a, a = r[(e + 1) % r.length], i.onCurve) t.lineTo(i.x, i.y);
				else {
					let e = a;
					a.onCurve || (e = {
						x: (i.x + a.x) * .5,
						y: (i.y + a.y) * .5
					}), t.quadraticCurveTo(i.x, i.y, e.x, e.y);
				}
				t.closePath();
			}
			return t;
		}
		function Qi(e, t) {
			if (t.isComposite) {
				Ki.has(e) || Ki.set(e, /* @__PURE__ */ new Set());
				let n = Ki.get(e);
				n.add(t.index);
				try {
					for (let r = 0; r < t.components.length; r += 1) {
						let i = t.components[r];
						if (n.has(i.glyphIndex)) continue;
						let a = e.get(i.glyphIndex);
						if (a.getPath(), a.points) {
							let e;
							if (i.matchedPoints === void 0) e = Yi(a.points, i);
							else {
								if (i.matchedPoints[0] > t.points.length - 1 || i.matchedPoints[1] > a.points.length - 1) throw Error("Matched points out of range in " + t.name);
								let n = t.points[i.matchedPoints[0]], r = a.points[i.matchedPoints[1]], o = {
									xScale: i.xScale,
									scale01: i.scale01,
									scale10: i.scale10,
									yScale: i.yScale,
									dx: 0,
									dy: 0
								};
								r = Yi([r], o)[0], o.dx = n.x - r.x, o.dy = n.y - r.y, e = Yi(a.points, o);
							}
							t.points = t.points.concat(e);
						}
					}
				} finally {
					n.delete(t.index);
				}
			}
			return Zi(t.points);
		}
		function $i(e, t, n, r) {
			let i = new B.GlyphSet(r);
			for (let a = 0; a < n.length - 1; a += 1) {
				let o = n[a];
				o === n[a + 1] ? i.push(a, B.glyphLoader(r, a)) : i.push(a, B.ttfGlyphLoader(r, a, Ji, e, t + o, Qi));
			}
			return i;
		}
		function ea(e, t, n, r) {
			let i = new B.GlyphSet(r);
			return r._push = function(a) {
				let o = n[a];
				o === n[a + 1] ? i.push(a, B.glyphLoader(r, a)) : i.push(a, B.ttfGlyphLoader(r, a, Ji, e, t + o, Qi));
			}, i;
		}
		function ta(e, t, n, r, i) {
			return i.lowMemory ? ea(e, t, n, r) : $i(e, t, n, r);
		}
		var na = {
			getPath: Zi,
			parse: ta
		}, ra = class {
			constructor(e) {
				this.font = e;
			}
			normalizeCoordTags(e) {
				for (let t in e) if (t.length < 4) {
					let n = t.padEnd(4, " ");
					e[n] === void 0 && (e[n] = e[t]), delete e[t];
				}
			}
			getNormalizedCoords(e) {
				e ||= this.font.variation.get();
				let t = [];
				this.normalizeCoordTags(e);
				for (let n = 0; n < this.fvar().axes.length; n++) {
					let r = this.fvar().axes[n], i = e[r.tag];
					i === void 0 && (i = r.defaultValue), i < r.defaultValue ? t.push((i - r.defaultValue + 2 ** -52) / (r.defaultValue - r.minValue + 2 ** -52)) : t.push((i - r.defaultValue + 2 ** -52) / (r.maxValue - r.defaultValue + 2 ** -52));
				}
				if (this.avar()) for (let e = 0; e < this.avar().axisSegmentMaps.length; e++) {
					let n = this.avar().axisSegmentMaps[e];
					for (let r = 0; r < n.axisValueMaps.length; r++) {
						let i = n.axisValueMaps[r];
						if (r >= 1 && t[e] < i.fromCoordinate) {
							let a = n.axisValueMaps[r - 1];
							t[e] = ((t[e] - a.fromCoordinate) * (i.toCoordinate - a.toCoordinate) + 2 ** -52) / (i.fromCoordinate - a.fromCoordinate + 2 ** -52) + a.toCoordinate;
							break;
						}
					}
				}
				return t;
			}
			interpolatePoints(e, t, n) {
				if (e.length === 0) return;
				let r = 0;
				for (; r < e.length;) {
					let i = r, a = r, o = e[a];
					for (; !o.lastPointOfContour;) o = e[++a];
					for (; r <= a && !n[r];) r++;
					if (r > a) continue;
					let s = r, c = r;
					for (r++; r <= a;) n[r] && (this.deltaInterpolate(c + 1, r - 1, c, r, t, e), c = r), r++;
					c === s ? this.deltaShift(i, a, c, t, e) : (this.deltaInterpolate(c + 1, a, c, s, t, e), s > 0 && this.deltaInterpolate(i, s - 1, c, s, t, e)), r = a + 1;
				}
			}
			deltaInterpolate(e, t, n, r, i, a) {
				if (e > t) return;
				let o = ["x", "y"];
				for (let c = 0; c < o.length; c++) {
					let l = o[c];
					if (i[n][l] > i[r][l]) {
						var s = n;
						n = r, r = s;
					}
					let u = i[n][l], d = i[r][l], f = a[n][l], p = a[r][l];
					if (u !== d || f === p) {
						let n = u === d ? 0 : (p - f) / (d - u);
						for (let r = e; r <= t; r++) {
							let e = i[r][l];
							e <= u ? e += f - u : e >= d ? e += p - d : e = f + (e - u) * n, a[r][l] = e;
						}
					}
				}
			}
			deltaShift(e, t, n, r, i) {
				let a = i[n].x - r[n].x, o = i[n].y - r[n].y;
				if (!(a === 0 && o === 0)) for (let r = e; r <= t; r++) r !== n && (i[r].x += a, i[r].y += o);
			}
			transformComponents(e, t, n, r, i, a) {
				let o = 0;
				for (let s = 0; s < e.components.length; s++) {
					let c = e.components[s], l = this.font.glyphs.get(c.glyphIndex), u = Mi(c), d = r.indexOf(s);
					d > -1 && (u.dx += Math.round(i.deltas[d] * a), u.dy += Math.round(i.deltasY[d] * a));
					let f = Yi(this.getTransform(l, n).points, u);
					t.splice(o, f.length, ...f), o += l.points.length;
				}
			}
			applyTupleVariationStore(e, t, n, r = "gvar", i = {}) {
				n ||= this.font.variation.get();
				let a = this.getNormalizedCoords(n), { headers: o, sharedPoints: s } = e, c = this.fvar().axes.length, l;
				r === "gvar" ? l = t.map(ji) : r === "cvar" && (l = [...t]);
				for (let e = 0; e < o.length; e++) {
					let u = o[e], d = 1;
					for (let e = 0; e < c; e++) {
						let t = [0];
						switch (r) {
							case "gvar":
								t = u.peakTuple ? u.peakTuple : this.gvar().sharedTuples[u.sharedTupleRecordsIndex];
								break;
							case "cvar":
								t = u.peakTuple;
								break;
						}
						if (t[e] !== 0) {
							if (a[e] === 0) {
								d = 0;
								break;
							}
							if (!u.intermediateStartTuple) {
								if (a[e] < Math.min(0, t[e]) || a[e] > Math.max(0, t[e])) {
									d = 0;
									break;
								}
								d = (d * a[e] + 2 ** -52) / (t[e] + 2 ** -52);
							} else if (a[e] < u.intermediateStartTuple[e] || a[e] > u.intermediateEndTuple[e]) {
								d = 0;
								break;
							} else d = a[e] < t[e] ? d * (a[e] - u.intermediateStartTuple[e] + 2 ** -52) / (t[e] - u.intermediateStartTuple[e] + 2 ** -52) : d * (u.intermediateEndTuple[e] - a[e] + 2 ** -52) / (u.intermediateEndTuple[e] - t[e] + 2 ** -52);
						}
					}
					if (d === 0) continue;
					let f = u.privatePoints.length ? u.privatePoints : s;
					if (r === "gvar" && i.glyph && i.glyph.isComposite) this.transformComponents(i.glyph, l, n, f, u, d);
					else if (f.length === 0) for (let e = 0; e < l.length; e++) {
						let t = l[e];
						r === "gvar" ? l[e] = {
							x: Math.round(t.x + u.deltas[e] * d),
							y: Math.round(t.y + u.deltasY[e] * d),
							onCurve: t.onCurve,
							lastPointOfContour: t.lastPointOfContour
						} : r === "cvar" && (l[e] = Math.round(t + u.deltas[e] * d));
					}
					else {
						let e;
						r === "gvar" ? e = l.map(ji) : r === "cvar" && (e = l);
						let n = Array(t.length).fill(!1);
						for (let i = 0; i < f.length; i++) {
							let a = f[i];
							if (a < t.length) {
								let t = e[a];
								r === "gvar" ? (n[a] = !0, t.x += u.deltas[i] * d, t.y += u.deltasY[i] * d) : r === "cvar" && (l[a] = Math.round(t + u.deltas[i] * d));
							}
						}
						if (r === "gvar") {
							this.interpolatePoints(e, l, n);
							for (let n = 0; n < t.length; n++) {
								let t = e[n].x - l[n].x, r = e[n].y - l[n].y;
								l[n].x = Math.round(l[n].x + t), l[n].y = Math.round(l[n].y + r);
							}
						}
					}
				}
				return l;
			}
			getTransform(e, t) {
				Number.isInteger(e) && (e = this.font.glyphs.get(e));
				let n = e.getBlendPath, r = !!(e.points && e.points.length), i = e;
				if (n || r) {
					if (t ||= this.font.variation.get(), r) {
						let n = this.gvar() && this.gvar().glyphVariations[e.index];
						if (n) {
							let r = e.points, a = this.applyTupleVariationStore(n, r, t, "gvar", { glyph: e });
							i = new $t(Object.assign({}, e, {
								points: a,
								path: Zi(a)
							}));
						}
					} else if (n) {
						let n = e.getBlendPath(t);
						i = new $t(Object.assign({}, e, { path: n }));
					}
				}
				return this.font.tables.hvar && (e._advanceWidth = e._advanceWidth === void 0 ? e.advanceWidth : e._advanceWidth, e.advanceWidth = i.advanceWidth = Math.round(e._advanceWidth + this.getVariableAdjustment(i.index, "hvar", "advanceWidth", t)), e._leftSideBearing = e._leftSideBearing === void 0 ? e.leftSideBearing : e._leftSideBearing, e.leftSideBearing = i.leftSideBearing = Math.round(e._leftSideBearing + this.getVariableAdjustment(i.index, "hvar", "lsb", t))), i;
			}
			getCvarTransform(e) {
				let t = this.font.tables.cvt, n = this.cvar();
				return !t || !t.length || !n || !n.headers.length ? t : this.applyTupleVariationStore(n, t, e, "cvar");
			}
			getVariableAdjustment(e, t, n, r) {
				r ||= this.font.variation.get();
				let i, a, o = this.font.tables[t];
				if (!o) throw Error(`trying to get variation adjustment from non-existent table "${o}"`);
				if (!o.itemVariationStore) throw Error(`trying to get variation adjustment from table "${o}" which does not have an itemVariationStore`);
				let s = o[n] && o[n].map.length;
				if (s) {
					let t = e;
					t >= s && (t = s - 1), {outerIndex: i, innerIndex: a} = o[n].map[t];
				} else i = 0, a = e;
				return this.getDelta(o.itemVariationStore, i, a, r);
			}
			getDelta(e, t, n, r) {
				if (t >= e.itemVariationSubtables.length) return 0;
				let i = e.itemVariationSubtables[t];
				if (n >= i.deltaSets.length) return 0;
				let a = i.deltaSets[n], o = this.getBlendVector(e, t, r), s = 0;
				for (let e = 0; e < i.regionIndexes.length; e++) s += a[e] * o[e];
				return s;
			}
			getBlendVector(e, t, n) {
				n ||= this.font.variation.get();
				let r = e.itemVariationSubtables[t], i = this.getNormalizedCoords(n), a = [];
				for (let t = 0; t < r.regionIndexes.length; t++) {
					let n = 1, o = r.regionIndexes[t], s = e.variationRegions[o].regionAxes;
					for (let e = 0; e < s.length; e++) {
						let t = s[e], r;
						r = t.startCoord > t.peakCoord || t.peakCoord > t.endCoord || t.startCoord < 0 && t.endCoord > 0 && t.peakCoord !== 0 || t.peakCoord === 0 ? 1 : i[e] < t.startCoord || i[e] > t.endCoord ? 0 : i[e] === t.peakCoord ? 1 : i[e] < t.peakCoord ? (i[e] - t.startCoord + 2 ** -52) / (t.peakCoord - t.startCoord + 2 ** -52) : (t.endCoord - i[e] + 2 ** -52) / (t.endCoord - t.peakCoord + 2 ** -52), n *= r;
					}
					a[t] = n;
				}
				return a;
			}
			avar() {
				return this.font.tables.avar;
			}
			cvar() {
				return this.font.tables.cvar;
			}
			fvar() {
				return this.font.tables.fvar;
			}
			gvar() {
				return this.font.tables.gvar;
			}
			hvar() {
				return this.font.tables.hvar;
			}
		}, ia = class {
			constructor(e) {
				this.font = e, this.process = new ra(this.font), this.activateDefaultVariation(), this.getTransform = this.process.getTransform.bind(this.process);
			}
			activateDefaultVariation() {
				let e = this.getDefaultInstanceIndex();
				e > -1 ? this.set(e) : this.set(this.getDefaultCoordinates());
			}
			getDefaultCoordinates() {
				return this.fvar().axes.reduce((e, t) => (e[t.tag] = t.defaultValue, e), {});
			}
			getDefaultInstanceIndex() {
				let e = this.getDefaultCoordinates(), t = this.getInstanceIndex(e);
				return t < 0 && (t = this.fvar().instances.findIndex((e) => e.name && e.name.en === "Regular")), t;
			}
			getInstanceIndex(e) {
				return this.fvar().instances.findIndex((t) => Object.keys(e).every((n) => t.coordinates[n] === e[n]));
			}
			getInstance(e) {
				return this.fvar().instances && this.fvar().instances[e];
			}
			set(e) {
				let t;
				if (Number.isInteger(e)) {
					let n = this.getInstance(e);
					if (!n) throw Error(`Invalid instance index ${e}`);
					t = { ...n.coordinates };
				} else t = e, this.process.normalizeCoordTags(t);
				t = Object.assign({}, this.font.defaultRenderOptions.variation, t), this.font.defaultRenderOptions = Object.assign({}, this.font.defaultRenderOptions, { variation: t });
			}
			get() {
				return Object.assign({}, this.font.defaultRenderOptions.variation);
			}
			avar() {
				return this.font.tables.avar;
			}
			cvar() {
				return this.font.tables.cvar;
			}
			fvar() {
				return this.font.tables.fvar;
			}
			gvar() {
				return this.font.tables.gvar;
			}
			hvar() {
				return this.font.tables.hvar;
			}
		}, aa = 1e6, oa = 64, sa = 1e4, ca, la, ua, da;
		function fa(e) {
			this.font = e, this.getCommands = function(e) {
				return na.getPath(e).commands;
			}, this._fpgmState = this._prepState = void 0, this._errorState = 0;
		}
		function pa(e) {
			return e;
		}
		function ma(e) {
			return Math.sign(e) * Math.round(Math.abs(e));
		}
		function ha(e) {
			return Math.sign(e) * Math.round(Math.abs(e * 2)) / 2;
		}
		function ga(e) {
			return Math.sign(e) * (Math.round(Math.abs(e) + .5) - .5);
		}
		function _a(e) {
			return Math.sign(e) * Math.ceil(Math.abs(e));
		}
		function va(e) {
			return Math.sign(e) * Math.floor(Math.abs(e));
		}
		var ya = function(e) {
			let t = this.srPeriod, n = this.srPhase, r = this.srThreshold, i = 1;
			return e < 0 && (e = -e, i = -1), e += r - n, e = Math.trunc(e / t) * t, e += n, e < 0 ? n * i : e * i;
		}, ba = {
			x: 1,
			y: 0,
			axis: "x",
			distance: function(e, t, n, r) {
				return (n ? e.xo : e.x) - (r ? t.xo : t.x);
			},
			interpolate: function(e, t, n, r) {
				let i, a, o, s, c, l, u;
				if (!r || r === this) {
					if (i = e.xo - t.xo, a = e.xo - n.xo, c = t.x - t.xo, l = n.x - n.xo, o = Math.abs(i), s = Math.abs(a), u = o + s, u === 0) {
						e.x = e.xo + (c + l) / 2;
						return;
					}
					e.x = e.xo + (c * s + l * o) / u;
					return;
				}
				if (i = r.distance(e, t, !0, !0), a = r.distance(e, n, !0, !0), c = r.distance(t, t, !1, !0), l = r.distance(n, n, !1, !0), o = Math.abs(i), s = Math.abs(a), u = o + s, u === 0) {
					ba.setRelative(e, e, (c + l) / 2, r, !0);
					return;
				}
				ba.setRelative(e, e, (c * s + l * o) / u, r, !0);
			},
			normalSlope: -Infinity,
			setRelative: function(e, t, n, r, i) {
				if (!r || r === this) {
					e.x = (i ? t.xo : t.x) + n;
					return;
				}
				let a = i ? t.xo : t.x, o = i ? t.yo : t.y, s = a + n * r.x, c = o + n * r.y;
				e.x = s + (e.y - c) / r.normalSlope;
			},
			slope: 0,
			touch: function(e) {
				e.xTouched = !0;
			},
			touched: function(e) {
				return e.xTouched;
			},
			untouch: function(e) {
				e.xTouched = !1;
			}
		}, xa = {
			x: 0,
			y: 1,
			axis: "y",
			distance: function(e, t, n, r) {
				return (n ? e.yo : e.y) - (r ? t.yo : t.y);
			},
			interpolate: function(e, t, n, r) {
				let i, a, o, s, c, l, u;
				if (!r || r === this) {
					if (i = e.yo - t.yo, a = e.yo - n.yo, c = t.y - t.yo, l = n.y - n.yo, o = Math.abs(i), s = Math.abs(a), u = o + s, u === 0) {
						e.y = e.yo + (c + l) / 2;
						return;
					}
					e.y = e.yo + (c * s + l * o) / u;
					return;
				}
				if (i = r.distance(e, t, !0, !0), a = r.distance(e, n, !0, !0), c = r.distance(t, t, !1, !0), l = r.distance(n, n, !1, !0), o = Math.abs(i), s = Math.abs(a), u = o + s, u === 0) {
					xa.setRelative(e, e, (c + l) / 2, r, !0);
					return;
				}
				xa.setRelative(e, e, (c * s + l * o) / u, r, !0);
			},
			normalSlope: 0,
			setRelative: function(e, t, n, r, i) {
				if (!r || r === this) {
					e.y = (i ? t.yo : t.y) + n;
					return;
				}
				let a = i ? t.xo : t.x, o = i ? t.yo : t.y, s = a + n * r.x;
				e.y = o + n * r.y + r.normalSlope * (e.x - s);
			},
			slope: Infinity,
			touch: function(e) {
				e.yTouched = !0;
			},
			touched: function(e) {
				return e.yTouched;
			},
			untouch: function(e) {
				e.yTouched = !1;
			}
		};
		Object.freeze(ba), Object.freeze(xa);
		function Sa(e, t) {
			this.x = e, this.y = t, this.axis = void 0, this.slope = t / e, this.normalSlope = -e / t, Object.freeze(this);
		}
		Sa.prototype.distance = function(e, t, n, r) {
			return this.x * ba.distance(e, t, n, r) + this.y * xa.distance(e, t, n, r);
		}, Sa.prototype.interpolate = function(e, t, n, r) {
			let i, a, o, s, c, l, u;
			if (o = r.distance(e, t, !0, !0), s = r.distance(e, n, !0, !0), i = r.distance(t, t, !1, !0), a = r.distance(n, n, !1, !0), c = Math.abs(o), l = Math.abs(s), u = c + l, u === 0) {
				this.setRelative(e, e, (i + a) / 2, r, !0);
				return;
			}
			this.setRelative(e, e, (i * l + a * c) / u, r, !0);
		}, Sa.prototype.setRelative = function(e, t, n, r, i) {
			r ||= this;
			let a = i ? t.xo : t.x, o = i ? t.yo : t.y, s = a + n * r.x, c = o + n * r.y, l = r.normalSlope, u = this.slope, d = e.x, f = e.y;
			e.x = (u * d - l * s + c - f) / (u - l), e.y = u * (e.x - d) + f;
		}, Sa.prototype.touch = function(e) {
			e.xTouched = !0, e.yTouched = !0;
		};
		function Ca(e, t) {
			let n = Math.sqrt(e * e + t * t);
			return e /= n, t /= n, e === 1 && t === 0 ? ba : e === 0 && t === 1 ? xa : new Sa(e, t);
		}
		function wa(e, t, n, r) {
			this.x = this.xo = Math.round(e * 64) / 64, this.y = this.yo = Math.round(t * 64) / 64, this.lastPointOfContour = n, this.onCurve = r, this.prevPointOnContour = void 0, this.nextPointOnContour = void 0, this.xTouched = !1, this.yTouched = !1, Object.preventExtensions(this);
		}
		wa.prototype.nextTouched = function(e) {
			let t = this.nextPointOnContour;
			for (; !e.touched(t) && t !== this;) t = t.nextPointOnContour;
			return t;
		}, wa.prototype.prevTouched = function(e) {
			let t = this.prevPointOnContour;
			for (; !e.touched(t) && t !== this;) t = t.prevPointOnContour;
			return t;
		};
		var Ta = Object.freeze(new wa(0, 0)), H = {
			cvCutIn: 17 / 16,
			deltaBase: 9,
			deltaShift: .125,
			loop: 1,
			minDis: 1,
			autoFlip: !0
		};
		function Ea(e, t) {
			switch (this.env = e, this.stack = [], this.prog = t, e) {
				case "glyf": this.zp0 = this.zp1 = this.zp2 = 1, this.rp0 = this.rp1 = this.rp2 = 0;
				case "prep": this.fv = this.pv = this.dpv = ba, this.round = ma;
			}
		}
		fa.prototype.exec = function(e, t) {
			if (typeof t != "number") throw Error("Point size is not a number!");
			if (this._errorState > 2) return;
			let n = this.font, r = this._prepState;
			if (!r || r.ppem !== t) {
				let e = this._fpgmState;
				if (!e) {
					Ea.prototype = H, e = this._fpgmState = new Ea("fpgm", n.tables.fpgm), e.funcs = [], e.font = n, e.instructionCount = 0, e.callDepth = 0;
					try {
						la(e);
					} catch (e) {
						console.log("Hinting error in FPGM:" + e), this._errorState = 3;
						return;
					}
				}
				Ea.prototype = e, r = this._prepState = new Ea("prep", n.tables.prep), r.ppem = t, r.instructionCount = 0, r.callDepth = 0;
				let i = n.variation && n.variation.process.getCvarTransform() || n.tables.cvt;
				if (i) {
					let e = r.cvt = Array(i.length), a = t / n.unitsPerEm;
					for (let t = 0; t < i.length; t++) e[t] = i[t] * a;
				} else r.cvt = [];
				try {
					la(r);
				} catch (e) {
					this._errorState < 2 && console.log("Hinting error in PREP:" + e), this._errorState = 2;
				}
			}
			if (!(this._errorState > 1)) try {
				return ua(e, r);
			} catch (e) {
				this._errorState < 1 && (console.log("Hinting error:" + e), console.log("Note: further hinting errors are silenced")), this._errorState = 1;
				return;
			}
		}, ua = function(e, t) {
			let n = t.ppem / t.font.unitsPerEm, r = n, i = e.components, a, o, s;
			if (Ea.prototype = t, !i) s = new Ea("glyf", e.instructions), s.instructionCount = 0, s.callDepth = 0, da(e, s, n, r), o = s.gZone;
			else {
				let c = t.font;
				o = [], a = [];
				for (let e = 0; e < i.length; e++) {
					let t = i[e], l = c.glyphs.get(t.glyphIndex);
					s = new Ea("glyf", l.instructions), s.instructionCount = 0, s.callDepth = 0, da(l, s, n, r);
					let u = Math.round(t.dx * n), d = Math.round(t.dy * r), f = s.gZone, p = s.contours;
					for (let e = 0; e < f.length; e++) {
						let t = f[e];
						t.xTouched = t.yTouched = !1, t.xo = t.x += u, t.yo = t.y += d;
					}
					let m = o.length;
					o.push.apply(o, f);
					for (let e = 0; e < p.length; e++) a.push(p[e] + m);
				}
				e.instructions && !s.inhibitGridFit && (s = new Ea("glyf", e.instructions), s.gZone = s.z0 = s.z1 = s.z2 = o, s.contours = a, o.push(new wa(0, 0), new wa(Math.round(e.advanceWidth * n), 0)), la(s), o.length -= 2);
			}
			return o;
		}, da = function(e, t, n, r) {
			let i = e.points || [], a = i.length, o = t.gZone = t.z0 = t.z1 = t.z2 = [], s = t.contours = [], c;
			for (let e = 0; e < a; e++) c = i[e], o[e] = new wa(c.x * n, c.y * r, c.lastPointOfContour, c.onCurve);
			let l, u;
			for (let e = 0; e < a; e++) c = o[e], l || (l = c, s.push(e)), c.lastPointOfContour ? (c.nextPointOnContour = l, l.prevPointOnContour = c, l = void 0) : (u = o[e + 1], c.nextPointOnContour = u, u.prevPointOnContour = c);
			t.inhibitGridFit || (o.push(new wa(0, 0), new wa(Math.round(e.advanceWidth * n), 0)), la(t), o.length -= 2);
		}, la = function(e) {
			let t = e.prog;
			if (!t) return;
			let n = t.length, r;
			for (e.ip = 0; e.ip < n; e.ip++) {
				if (++e.instructionCount > aa) throw Error("Hinting instructions exceeded maximum of " + aa);
				if (r = ca[t[e.ip]], !r) throw Error("unknown instruction: 0x" + Number(t[e.ip]).toString(16));
				r(e);
			}
		};
		function Da(e) {
			let t = e.tZone = Array(e.gZone.length);
			for (let e = 0; e < t.length; e++) t[e] = new wa(0, 0);
		}
		function U(e, t) {
			let n = e.prog, r = e.ip, i = 1, a;
			do
				if (a = n[++r], a === 88) i++;
				else if (a === 89) i--;
				else if (a === 64) r += n[r + 1] + 1;
				else if (a === 65) r += 2 * n[r + 1] + 1;
				else if (a >= 176 && a <= 183) r += a - 176 + 1;
				else if (a >= 184 && a <= 191) r += (a - 184 + 1) * 2;
				else if (t && i === 1 && a === 27) break;
			while (i > 0);
			e.ip = r;
		}
		function W(e, t) {
			t.fv = t.pv = t.dpv = e;
		}
		function Oa(e, t) {
			t.pv = t.dpv = e;
		}
		function ka(e, t) {
			t.fv = e;
		}
		function Aa(e, t) {
			let n = t.stack, r = n.pop(), i = n.pop(), a = t.z2[r], o = t.z1[i], s, c;
			e ? (s = a.y - o.y, c = o.x - a.x) : (s = o.x - a.x, c = o.y - a.y), t.pv = t.dpv = Ca(s, c);
		}
		function ja(e, t) {
			let n = t.stack, r = n.pop(), i = n.pop(), a = t.z2[r], o = t.z1[i], s, c;
			e ? (s = a.y - o.y, c = o.x - a.x) : (s = o.x - a.x, c = o.y - a.y), t.fv = Ca(s, c);
		}
		function Ma(e) {
			let t = e.stack, n = t.pop();
			e.pv = e.dpv = Ca(t.pop(), n);
		}
		function Na(e) {
			let t = e.stack, n = t.pop();
			e.fv = Ca(t.pop(), n);
		}
		function Pa(e) {
			let t = e.stack, n = e.pv;
			t.push(n.x * 16384), t.push(n.y * 16384);
		}
		function Fa(e) {
			let t = e.stack, n = e.fv;
			t.push(n.x * 16384), t.push(n.y * 16384);
		}
		function Ia(e) {
			e.fv = e.pv;
		}
		function La(e) {
			let t = e.stack, n = t.pop(), r = t.pop(), i = t.pop(), a = t.pop(), o = t.pop(), s = e.z0, c = e.z1, l = s[n], u = s[r], d = c[i], f = c[a], p = e.z2[o], m = l.x, h = l.y, g = u.x, _ = u.y, v = d.x, y = d.y, b = f.x, ee = f.y, x = (m - g) * (y - ee) - (h - _) * (v - b), S = m * _ - h * g, C = v * ee - y * b;
			p.x = (S * (v - b) - C * (m - g)) / x, p.y = (S * (y - ee) - C * (h - _)) / x;
		}
		function Ra(e) {
			e.rp0 = e.stack.pop();
		}
		function za(e) {
			e.rp1 = e.stack.pop();
		}
		function Ba(e) {
			e.rp2 = e.stack.pop();
		}
		function Va(e) {
			let t = e.stack.pop();
			switch (e.zp0 = t, t) {
				case 0:
					e.tZone || Da(e), e.z0 = e.tZone;
					break;
				case 1:
					e.z0 = e.gZone;
					break;
				default: throw Error("Invalid zone pointer");
			}
		}
		function Ha(e) {
			let t = e.stack.pop();
			switch (e.zp1 = t, t) {
				case 0:
					e.tZone || Da(e), e.z1 = e.tZone;
					break;
				case 1:
					e.z1 = e.gZone;
					break;
				default: throw Error("Invalid zone pointer");
			}
		}
		function Ua(e) {
			let t = e.stack.pop();
			switch (e.zp2 = t, t) {
				case 0:
					e.tZone || Da(e), e.z2 = e.tZone;
					break;
				case 1:
					e.z2 = e.gZone;
					break;
				default: throw Error("Invalid zone pointer");
			}
		}
		function Wa(e) {
			let t = e.stack.pop();
			switch (e.zp0 = e.zp1 = e.zp2 = t, t) {
				case 0:
					e.tZone || Da(e), e.z0 = e.z1 = e.z2 = e.tZone;
					break;
				case 1:
					e.z0 = e.z1 = e.z2 = e.gZone;
					break;
				default: throw Error("Invalid zone pointer");
			}
		}
		function Ga(e) {
			e.loop = e.stack.pop(), e.loop > sa && (e.loop = sa);
		}
		function Ka(e) {
			e.round = ma;
		}
		function qa(e) {
			e.round = ga;
		}
		function G(e) {
			e.minDis = e.stack.pop() / 64;
		}
		function Ja(e) {
			U(e, !1);
		}
		function Ya(e) {
			let t = e.stack.pop();
			e.ip += t - 1;
		}
		function Xa(e) {
			e.cvCutIn = e.stack.pop() / 64;
		}
		function Za(e) {
			let t = e.stack;
			t.push(t[t.length - 1]);
		}
		function Qa(e) {
			e.stack.pop();
		}
		function $a(e) {
			e.stack.length = 0;
		}
		function eo(e) {
			let t = e.stack, n = t.pop(), r = t.pop();
			t.push(n), t.push(r);
		}
		function to(e) {
			let t = e.stack;
			t.push(t.length);
		}
		function no(e) {
			let t = e.stack, n = t.pop(), r = t.pop();
			if (r > sa && (r = sa), ++e.callDepth > oa) throw Error("Hinting call depth exceeded maximum of " + oa);
			let i = e.ip, a = e.prog;
			e.prog = e.funcs[n];
			for (let t = 0; t < r; t++) la(e);
			e.ip = i, e.prog = a, e.callDepth--;
		}
		function ro(e) {
			let t = e.stack.pop();
			if (++e.callDepth > oa) throw Error("Hinting call depth exceeded maximum of " + oa);
			let n = e.ip, r = e.prog;
			e.prog = e.funcs[t], la(e), e.ip = n, e.prog = r, e.callDepth--;
		}
		function io(e) {
			let t = e.stack, n = t.pop();
			t.push(t[t.length - n]);
		}
		function K(e) {
			let t = e.stack, n = t.pop();
			t.push(t.splice(t.length - n, 1)[0]);
		}
		function ao(e) {
			if (e.env !== "fpgm") throw Error("FDEF not allowed here");
			let t = e.stack, n = e.prog, r = e.ip, i = t.pop(), a = r;
			for (; n[++r] !== 45;);
			e.ip = r, e.funcs[i] = n.slice(a + 1, r);
		}
		function oo(e, t) {
			let n = t.stack.pop(), r = t.z0[n], i = t.fv, a = t.pv, o = a.distance(r, Ta);
			e && (o = t.round(o)), i.setRelative(r, Ta, o, a), i.touch(r), t.rp0 = t.rp1 = n;
		}
		function so(e, t) {
			let n = t.z2, r = n.length - 2, i, a, o;
			for (let t = 0; t < r; t++) i = n[t], !e.touched(i) && (a = i.prevTouched(e), a !== i && (o = i.nextTouched(e), a === o && e.setRelative(i, i, e.distance(a, a, !1, !0), e, !0), e.interpolate(i, a, o, e)));
		}
		function co(e, t) {
			let n = t.stack, r = e ? t.rp1 : t.rp2, i = (e ? t.z0 : t.z1)[r], a = t.fv, o = t.pv, s = t.loop, c = t.z2;
			for (; s--;) {
				let e = c[n.pop()], t = o.distance(i, i, !1, !0);
				a.setRelative(e, e, t, o), a.touch(e);
			}
			t.loop = 1;
		}
		function lo(e, t) {
			let n = t.stack, r = e ? t.rp1 : t.rp2, i = (e ? t.z0 : t.z1)[r], a = t.fv, o = t.pv, s = n.pop(), c = t.z2[t.contours[s]], l = c, u = o.distance(i, i, !1, !0);
			do
				l !== i && a.setRelative(l, l, u, o), l = l.nextPointOnContour;
			while (l !== c);
		}
		function uo(e, t) {
			let n = t.stack, r = e ? t.rp1 : t.rp2, i = (e ? t.z0 : t.z1)[r], a = t.fv, o = t.pv, s = n.pop(), c;
			switch (s) {
				case 0:
					c = t.tZone;
					break;
				case 1:
					c = t.gZone;
					break;
				default: throw Error("Invalid zone");
			}
			let l, u = o.distance(i, i, !1, !0), d = c.length - 2;
			for (let e = 0; e < d; e++) l = c[e], a.setRelative(l, l, u, o);
		}
		function fo(e) {
			let t = e.stack, n = e.loop, r = e.fv, i = t.pop() / 64, a = e.z2;
			for (; n--;) {
				let e = a[t.pop()];
				r.setRelative(e, e, i), r.touch(e);
			}
			e.loop = 1;
		}
		function po(e) {
			let t = e.stack, n = e.rp1, r = e.rp2, i = e.loop, a = e.z0[n], o = e.z1[r], s = e.fv, c = e.dpv, l = e.z2;
			for (; i--;) {
				let e = l[t.pop()];
				s.interpolate(e, a, o, c), s.touch(e);
			}
			e.loop = 1;
		}
		function mo(e, t) {
			let n = t.stack, r = n.pop() / 64, i = n.pop(), a = t.z1[i], o = t.z0[t.rp0], s = t.fv, c = t.pv;
			s.setRelative(a, o, r, c), s.touch(a), t.rp1 = t.rp0, t.rp2 = i, e && (t.rp0 = i);
		}
		function ho(e) {
			let t = e.stack, n = e.rp0, r = e.z0[n], i = e.loop, a = e.fv, o = e.pv, s = e.z1;
			for (; i--;) {
				let e = s[t.pop()];
				a.setRelative(e, r, 0, o), a.touch(e);
			}
			e.loop = 1;
		}
		function go(e) {
			e.round = ha;
		}
		function _o(e, t) {
			let n = t.stack, r = n.pop(), i = n.pop(), a = t.z0[i], o = t.fv, s = t.pv, c = t.cvt[r], l = s.distance(a, Ta);
			e && (Math.abs(l - c) < t.cvCutIn && (l = c), l = t.round(l)), o.setRelative(a, Ta, l, s), t.zp0 === 0 && (a.xo = a.x, a.yo = a.y), o.touch(a), t.rp0 = t.rp1 = i;
		}
		function vo(e) {
			let t = e.prog, n = e.ip, r = e.stack, i = t[++n];
			for (let e = 0; e < i; e++) r.push(t[++n]);
			e.ip = n;
		}
		function q(e) {
			let t = e.ip, n = e.prog, r = e.stack, i = n[++t];
			for (let e = 0; e < i; e++) {
				let e = n[++t] << 8 | n[++t];
				e & 32768 && (e = -((e ^ 65535) + 1)), r.push(e);
			}
			e.ip = t;
		}
		function yo(e) {
			let t = e.stack, n = e.store;
			n ||= e.store = [];
			let r = t.pop(), i = t.pop();
			n[i] = r;
		}
		function bo(e) {
			let t = e.stack, n = e.store, r = t.pop(), i = n && n[r] || 0;
			t.push(i);
		}
		function xo(e) {
			let t = e.stack, n = t.pop(), r = t.pop();
			e.cvt[r] = n / 64;
		}
		function So(e) {
			let t = e.stack, n = t.pop();
			t.push(e.cvt[n] * 64);
		}
		function Co(e, t) {
			let n = t.stack, r = n.pop(), i = t.z2[r];
			n.push(t.dpv.distance(i, Ta, e, !1) * 64);
		}
		function wo(e, t) {
			let n = t.stack, r = n.pop(), i = n.pop(), a = t.z1[r], o = t.z0[i], s = t.dpv.distance(o, a, e, e);
			t.stack.push(Math.round(s * 64));
		}
		function To(e) {
			e.stack.push(e.ppem);
		}
		function Eo(e) {
			e.autoFlip = !0;
		}
		function Do(e) {
			let t = e.stack, n = t.pop(), r = t.pop();
			t.push(+(r < n));
		}
		function Oo(e) {
			let t = e.stack, n = t.pop(), r = t.pop();
			t.push(+(r <= n));
		}
		function ko(e) {
			let t = e.stack, n = t.pop(), r = t.pop();
			t.push(+(r > n));
		}
		function Ao(e) {
			let t = e.stack, n = t.pop(), r = t.pop();
			t.push(+(r >= n));
		}
		function jo(e) {
			let t = e.stack, n = t.pop(), r = t.pop();
			t.push(+(n === r));
		}
		function Mo(e) {
			let t = e.stack, n = t.pop(), r = t.pop();
			t.push(n === r ? 0 : 1);
		}
		function No(e) {
			let t = e.stack, n = t.pop();
			t.push(Math.trunc(n) & 1 ? 1 : 0);
		}
		function Po(e) {
			let t = e.stack, n = t.pop();
			t.push(Math.trunc(n) & 1 ? 0 : 1);
		}
		function Fo(e) {
			e.stack.pop() || U(e, !0);
		}
		function Io(e) {}
		function Lo(e) {
			let t = e.stack, n = t.pop(), r = t.pop();
			t.push(n && r ? 1 : 0);
		}
		function Ro(e) {
			let t = e.stack, n = t.pop(), r = t.pop();
			t.push(n || r ? 1 : 0);
		}
		function zo(e) {
			let t = e.stack, n = t.pop();
			t.push(+!n);
		}
		function Bo(e, t) {
			let n = t.stack, r = n.pop(), i = t.fv, a = t.pv, o = t.ppem, s = t.deltaBase + (e - 1) * 16, c = t.deltaShift, l = t.z0;
			for (let e = 0; e < r; e++) {
				let e = n.pop(), t = n.pop();
				if (s + ((t & 240) >> 4) !== o) continue;
				let r = (t & 15) - 8;
				r >= 0 && r++;
				let u = l[e];
				i.setRelative(u, u, r * c, a);
			}
		}
		function Vo(e) {
			e.deltaBase = e.stack.pop();
		}
		function Ho(e) {
			e.deltaShift = .5 ** e.stack.pop();
		}
		function Uo(e) {
			let t = e.stack, n = t.pop(), r = t.pop();
			t.push(r + n);
		}
		function Wo(e) {
			let t = e.stack, n = t.pop(), r = t.pop();
			t.push(r - n);
		}
		function Go(e) {
			let t = e.stack, n = t.pop(), r = t.pop();
			t.push(r * 64 / n);
		}
		function Ko(e) {
			let t = e.stack, n = t.pop(), r = t.pop();
			t.push(r * n / 64);
		}
		function qo(e) {
			let t = e.stack, n = t.pop();
			t.push(Math.abs(n));
		}
		function Jo(e) {
			let t = e.stack, n = t.pop();
			t.push(-n);
		}
		function Yo(e) {
			let t = e.stack, n = t.pop();
			t.push(Math.floor(n / 64) * 64);
		}
		function Xo(e) {
			let t = e.stack, n = t.pop();
			t.push(Math.ceil(n / 64) * 64);
		}
		function Zo(e, t) {
			let n = t.stack, r = n.pop();
			n.push(t.round(r / 64) * 64);
		}
		function Qo(e) {
			let t = e.stack, n = t.pop(), r = t.pop();
			e.cvt[r] = n * e.ppem / e.font.unitsPerEm;
		}
		function $o(e, t) {
			let n = t.stack, r = n.pop(), i = t.ppem, a = t.deltaBase + (e - 1) * 16, o = t.deltaShift;
			for (let e = 0; e < r; e++) {
				let e = n.pop(), r = n.pop();
				if (a + ((r & 240) >> 4) !== i) continue;
				let s = (r & 15) - 8;
				s >= 0 && s++;
				let c = s * o;
				t.cvt[e] += c;
			}
		}
		function es(e) {
			let t = e.stack.pop();
			e.round = ya;
			let n;
			switch (t & 192) {
				case 0:
					n = .5;
					break;
				case 64:
					n = 1;
					break;
				case 128:
					n = 2;
					break;
				default: throw Error("invalid SROUND value");
			}
			switch (e.srPeriod = n, t & 48) {
				case 0:
					e.srPhase = 0;
					break;
				case 16:
					e.srPhase = .25 * n;
					break;
				case 32:
					e.srPhase = .5 * n;
					break;
				case 48:
					e.srPhase = .75 * n;
					break;
				default: throw Error("invalid SROUND value");
			}
			t &= 15, t === 0 ? e.srThreshold = 0 : e.srThreshold = (t / 8 - .5) * n;
		}
		function ts(e) {
			let t = e.stack.pop();
			e.round = ya;
			let n;
			switch (t & 192) {
				case 0:
					n = Math.sqrt(2) / 2;
					break;
				case 64:
					n = Math.sqrt(2);
					break;
				case 128:
					n = 2 * Math.sqrt(2);
					break;
				default: throw Error("invalid S45ROUND value");
			}
			switch (e.srPeriod = n, t & 48) {
				case 0:
					e.srPhase = 0;
					break;
				case 16:
					e.srPhase = .25 * n;
					break;
				case 32:
					e.srPhase = .5 * n;
					break;
				case 48:
					e.srPhase = .75 * n;
					break;
				default: throw Error("invalid S45ROUND value");
			}
			t &= 15, t === 0 ? e.srThreshold = 0 : e.srThreshold = (t / 8 - .5) * n;
		}
		function ns(e) {
			e.round = pa;
		}
		function rs(e) {
			e.round = _a;
		}
		function is(e) {
			e.round = va;
		}
		function as(e) {
			e.stack.pop();
		}
		function os(e, t) {
			let n = t.stack, r = n.pop(), i = n.pop(), a = t.z2[r], o = t.z1[i], s, c;
			e ? (s = a.y - o.y, c = o.x - a.x) : (s = o.x - a.x, c = o.y - a.y), t.dpv = Ca(s, c);
		}
		function ss(e) {
			let t = e.stack, n = t.pop(), r = 0;
			n & 1 && (r = 35), n & 32 && (r |= 4096), t.push(r);
		}
		function cs(e) {
			let t = e.stack, n = t.pop(), r = t.pop(), i = t.pop();
			t.push(r), t.push(n), t.push(i);
		}
		function ls(e) {
			let t = e.stack, n = t.pop(), r = t.pop();
			t.push(Math.max(r, n));
		}
		function us(e) {
			let t = e.stack, n = t.pop(), r = t.pop();
			t.push(Math.min(r, n));
		}
		function ds(e) {
			e.stack.pop();
		}
		function fs(e) {
			let t = e.stack.pop(), n = e.stack.pop();
			switch (t) {
				case 1:
					e.inhibitGridFit = !!n;
					return;
				case 2:
					e.ignoreCvt = !!n;
					return;
				default: throw Error("invalid INSTCTRL[] selector");
			}
		}
		function ps(e, t) {
			let n = t.stack, r = t.prog, i = t.ip;
			for (let t = 0; t < e; t++) n.push(r[++i]);
			t.ip = i;
		}
		function ms(e, t) {
			let n = t.ip, r = t.prog, i = t.stack;
			for (let t = 0; t < e; t++) {
				let e = r[++n] << 8 | r[++n];
				e & 32768 && (e = -((e ^ 65535) + 1)), i.push(e);
			}
			t.ip = n;
		}
		function J(e, t, n, r, i, a) {
			let o = a.stack, s = e && o.pop(), c = o.pop(), l = a.rp0, u = a.z0[l], d = a.z1[c], f = a.minDis, p = a.fv, m = a.dpv, h, g, _;
			h = m.distance(d, u, !0, !0), g = h >= 0 ? 1 : -1, h = Math.abs(h), e && (_ = a.cvt[s], r && Math.abs(h - _) < a.cvCutIn && (h = _)), n && h < f && (h = f), r && (h = a.round(h)), p.setRelative(d, u, g * h, m), p.touch(d), a.rp1 = a.rp0, a.rp2 = c, t && (a.rp0 = c);
		}
		ca = [
			W.bind(void 0, xa),
			W.bind(void 0, ba),
			Oa.bind(void 0, xa),
			Oa.bind(void 0, ba),
			ka.bind(void 0, xa),
			ka.bind(void 0, ba),
			Aa.bind(void 0, 0),
			Aa.bind(void 0, 1),
			ja.bind(void 0, 0),
			ja.bind(void 0, 1),
			Ma,
			Na,
			Pa,
			Fa,
			Ia,
			La,
			Ra,
			za,
			Ba,
			Va,
			Ha,
			Ua,
			Wa,
			Ga,
			Ka,
			qa,
			G,
			Ja,
			Ya,
			Xa,
			void 0,
			void 0,
			Za,
			Qa,
			$a,
			eo,
			to,
			io,
			K,
			void 0,
			void 0,
			void 0,
			no,
			ro,
			ao,
			void 0,
			oo.bind(void 0, 0),
			oo.bind(void 0, 1),
			so.bind(void 0, xa),
			so.bind(void 0, ba),
			co.bind(void 0, 0),
			co.bind(void 0, 1),
			lo.bind(void 0, 0),
			lo.bind(void 0, 1),
			uo.bind(void 0, 0),
			uo.bind(void 0, 1),
			fo,
			po,
			mo.bind(void 0, 0),
			mo.bind(void 0, 1),
			ho,
			go,
			_o.bind(void 0, 0),
			_o.bind(void 0, 1),
			vo,
			q,
			yo,
			bo,
			xo,
			So,
			Co.bind(void 0, 0),
			Co.bind(void 0, 1),
			void 0,
			wo.bind(void 0, 0),
			wo.bind(void 0, 1),
			To,
			void 0,
			Eo,
			void 0,
			void 0,
			Do,
			Oo,
			ko,
			Ao,
			jo,
			Mo,
			No,
			Po,
			Fo,
			Io,
			Lo,
			Ro,
			zo,
			Bo.bind(void 0, 1),
			Vo,
			Ho,
			Uo,
			Wo,
			Go,
			Ko,
			qo,
			Jo,
			Yo,
			Xo,
			Zo.bind(void 0, 0),
			Zo.bind(void 0, 1),
			Zo.bind(void 0, 2),
			Zo.bind(void 0, 3),
			void 0,
			void 0,
			void 0,
			void 0,
			Qo,
			Bo.bind(void 0, 2),
			Bo.bind(void 0, 3),
			$o.bind(void 0, 1),
			$o.bind(void 0, 2),
			$o.bind(void 0, 3),
			es,
			ts,
			void 0,
			void 0,
			ns,
			void 0,
			rs,
			is,
			Qa,
			Qa,
			void 0,
			void 0,
			void 0,
			void 0,
			void 0,
			as,
			os.bind(void 0, 0),
			os.bind(void 0, 1),
			ss,
			void 0,
			cs,
			ls,
			us,
			ds,
			fs,
			void 0,
			void 0,
			void 0,
			void 0,
			void 0,
			void 0,
			void 0,
			void 0,
			void 0,
			void 0,
			void 0,
			void 0,
			void 0,
			void 0,
			void 0,
			void 0,
			void 0,
			void 0,
			void 0,
			void 0,
			void 0,
			void 0,
			void 0,
			void 0,
			void 0,
			void 0,
			void 0,
			void 0,
			void 0,
			void 0,
			void 0,
			void 0,
			void 0,
			ps.bind(void 0, 1),
			ps.bind(void 0, 2),
			ps.bind(void 0, 3),
			ps.bind(void 0, 4),
			ps.bind(void 0, 5),
			ps.bind(void 0, 6),
			ps.bind(void 0, 7),
			ps.bind(void 0, 8),
			ms.bind(void 0, 1),
			ms.bind(void 0, 2),
			ms.bind(void 0, 3),
			ms.bind(void 0, 4),
			ms.bind(void 0, 5),
			ms.bind(void 0, 6),
			ms.bind(void 0, 7),
			ms.bind(void 0, 8),
			J.bind(void 0, 0, 0, 0, 0, 0),
			J.bind(void 0, 0, 0, 0, 0, 1),
			J.bind(void 0, 0, 0, 0, 0, 2),
			J.bind(void 0, 0, 0, 0, 0, 3),
			J.bind(void 0, 0, 0, 0, 1, 0),
			J.bind(void 0, 0, 0, 0, 1, 1),
			J.bind(void 0, 0, 0, 0, 1, 2),
			J.bind(void 0, 0, 0, 0, 1, 3),
			J.bind(void 0, 0, 0, 1, 0, 0),
			J.bind(void 0, 0, 0, 1, 0, 1),
			J.bind(void 0, 0, 0, 1, 0, 2),
			J.bind(void 0, 0, 0, 1, 0, 3),
			J.bind(void 0, 0, 0, 1, 1, 0),
			J.bind(void 0, 0, 0, 1, 1, 1),
			J.bind(void 0, 0, 0, 1, 1, 2),
			J.bind(void 0, 0, 0, 1, 1, 3),
			J.bind(void 0, 0, 1, 0, 0, 0),
			J.bind(void 0, 0, 1, 0, 0, 1),
			J.bind(void 0, 0, 1, 0, 0, 2),
			J.bind(void 0, 0, 1, 0, 0, 3),
			J.bind(void 0, 0, 1, 0, 1, 0),
			J.bind(void 0, 0, 1, 0, 1, 1),
			J.bind(void 0, 0, 1, 0, 1, 2),
			J.bind(void 0, 0, 1, 0, 1, 3),
			J.bind(void 0, 0, 1, 1, 0, 0),
			J.bind(void 0, 0, 1, 1, 0, 1),
			J.bind(void 0, 0, 1, 1, 0, 2),
			J.bind(void 0, 0, 1, 1, 0, 3),
			J.bind(void 0, 0, 1, 1, 1, 0),
			J.bind(void 0, 0, 1, 1, 1, 1),
			J.bind(void 0, 0, 1, 1, 1, 2),
			J.bind(void 0, 0, 1, 1, 1, 3),
			J.bind(void 0, 1, 0, 0, 0, 0),
			J.bind(void 0, 1, 0, 0, 0, 1),
			J.bind(void 0, 1, 0, 0, 0, 2),
			J.bind(void 0, 1, 0, 0, 0, 3),
			J.bind(void 0, 1, 0, 0, 1, 0),
			J.bind(void 0, 1, 0, 0, 1, 1),
			J.bind(void 0, 1, 0, 0, 1, 2),
			J.bind(void 0, 1, 0, 0, 1, 3),
			J.bind(void 0, 1, 0, 1, 0, 0),
			J.bind(void 0, 1, 0, 1, 0, 1),
			J.bind(void 0, 1, 0, 1, 0, 2),
			J.bind(void 0, 1, 0, 1, 0, 3),
			J.bind(void 0, 1, 0, 1, 1, 0),
			J.bind(void 0, 1, 0, 1, 1, 1),
			J.bind(void 0, 1, 0, 1, 1, 2),
			J.bind(void 0, 1, 0, 1, 1, 3),
			J.bind(void 0, 1, 1, 0, 0, 0),
			J.bind(void 0, 1, 1, 0, 0, 1),
			J.bind(void 0, 1, 1, 0, 0, 2),
			J.bind(void 0, 1, 1, 0, 0, 3),
			J.bind(void 0, 1, 1, 0, 1, 0),
			J.bind(void 0, 1, 1, 0, 1, 1),
			J.bind(void 0, 1, 1, 0, 1, 2),
			J.bind(void 0, 1, 1, 0, 1, 3),
			J.bind(void 0, 1, 1, 1, 0, 0),
			J.bind(void 0, 1, 1, 1, 0, 1),
			J.bind(void 0, 1, 1, 1, 0, 2),
			J.bind(void 0, 1, 1, 1, 0, 3),
			J.bind(void 0, 1, 1, 1, 1, 0),
			J.bind(void 0, 1, 1, 1, 1, 1),
			J.bind(void 0, 1, 1, 1, 1, 2),
			J.bind(void 0, 1, 1, 1, 1, 3)
		];
		var hs = fa;
		function gs(e) {
			this.char = e, this.state = {}, this.activeState = null;
		}
		function _s(e, t, n) {
			this.contextName = n, this.startIndex = e, this.endOffset = t;
		}
		function vs(e, t, n) {
			this.contextName = e, this.openRange = null, this.ranges = [], this.checkStart = t, this.checkEnd = n;
		}
		function ys(e, t) {
			this.context = e, this.index = t, this.length = e.length, this.current = e[t], this.backtrack = e.slice(0, t), this.lookahead = e.slice(t + 1);
		}
		function bs(e) {
			this.eventId = e, this.subscribers = [];
		}
		function xs(e) {
			let t = [
				"start",
				"end",
				"next",
				"newToken",
				"contextStart",
				"contextEnd",
				"insertToken",
				"removeToken",
				"removeRange",
				"replaceToken",
				"replaceRange",
				"composeRUD",
				"updateContextsRanges"
			];
			for (let e = 0; e < t.length; e++) {
				let n = t[e];
				Object.defineProperty(this.events, n, { value: new bs(n) });
			}
			if (e) for (let n = 0; n < t.length; n++) {
				let r = t[n], i = e[r];
				typeof i == "function" && this.events[r].subscribe(i);
			}
			let n = [
				"insertToken",
				"removeToken",
				"removeRange",
				"replaceToken",
				"replaceRange",
				"composeRUD"
			];
			for (let e = 0; e < n.length; e++) {
				let t = n[e];
				this.events[t].subscribe(this.updateContextsRanges);
			}
		}
		function Y(e) {
			this.tokens = [], this.registeredContexts = {}, this.contextCheckers = [], this.events = {}, this.registeredModifiers = [], xs.call(this, e);
		}
		gs.prototype.setState = function(e, t) {
			return this.state[e] = t, this.activeState = {
				key: e,
				value: this.state[e]
			}, this.activeState;
		}, gs.prototype.getState = function(e) {
			return this.state[e] || null;
		}, Y.prototype.inboundIndex = function(e) {
			return e >= 0 && e < this.tokens.length;
		}, Y.prototype.composeRUD = function(e) {
			let t = e.map((e) => this[e[0]].apply(this, e.slice(1).concat(!0))), n = (e) => typeof e == "object" && Object.prototype.hasOwnProperty.call(e, "FAIL");
			if (t.every(n)) return {
				FAIL: "composeRUD: one or more operations hasn't completed successfully",
				report: t.filter(n)
			};
			this.dispatch("composeRUD", [t.filter((e) => !n(e))]);
		}, Y.prototype.replaceRange = function(e, t, n, r) {
			t = t === null ? this.tokens.length : t;
			let i = n.every((e) => e instanceof gs);
			if (!isNaN(e) && this.inboundIndex(e) && i) {
				let i = this.tokens.splice.apply(this.tokens, [e, t].concat(n));
				return r || this.dispatch("replaceToken", [
					e,
					t,
					n
				]), [i, n];
			} else return { FAIL: "replaceRange: invalid tokens or startIndex." };
		}, Y.prototype.replaceToken = function(e, t, n) {
			if (!isNaN(e) && this.inboundIndex(e) && t instanceof gs) {
				let r = this.tokens.splice(e, 1, t);
				return n || this.dispatch("replaceToken", [e, t]), [r[0], t];
			} else return { FAIL: "replaceToken: invalid token or index." };
		}, Y.prototype.removeRange = function(e, t, n) {
			t = isNaN(t) ? this.tokens.length : t;
			let r = this.tokens.splice(e, t);
			return n || this.dispatch("removeRange", [
				r,
				e,
				t
			]), r;
		}, Y.prototype.removeToken = function(e, t) {
			if (!isNaN(e) && this.inboundIndex(e)) {
				let n = this.tokens.splice(e, 1);
				return t || this.dispatch("removeToken", [n, e]), n;
			} else return { FAIL: "removeToken: invalid token index." };
		}, Y.prototype.insertToken = function(e, t, n) {
			return e.every((e) => e instanceof gs) ? (this.tokens.splice.apply(this.tokens, [t, 0].concat(e)), n || this.dispatch("insertToken", [e, t]), e) : { FAIL: "insertToken: invalid token(s)." };
		}, Y.prototype.registerModifier = function(e, t, n) {
			this.events.newToken.subscribe(function(r, i) {
				let a = [r, i], o = t === null || t.apply(this, a) === !0, s = [r, i];
				if (o) {
					let t = n.apply(this, s);
					r.setState(e, t);
				}
			}), this.registeredModifiers.push(e);
		}, bs.prototype.subscribe = function(e) {
			return typeof e == "function" ? this.subscribers.push(e) - 1 : { FAIL: `invalid '${this.eventId}' event handler` };
		}, bs.prototype.unsubscribe = function(e) {
			this.subscribers.splice(e, 1);
		}, ys.prototype.setCurrentIndex = function(e) {
			this.index = e, this.current = this.context[e], this.backtrack = this.context.slice(0, e), this.lookahead = this.context.slice(e + 1);
		}, ys.prototype.get = function(e) {
			switch (!0) {
				case e === 0: return this.current;
				case e < 0 && Math.abs(e) <= this.backtrack.length: return this.backtrack.slice(e)[0];
				case e > 0 && e <= this.lookahead.length: return this.lookahead[e - 1];
				default: return null;
			}
		}, Y.prototype.rangeToText = function(e) {
			if (e instanceof _s) return this.getRangeTokens(e).map((e) => e.char).join("");
		}, Y.prototype.getText = function() {
			return this.tokens.map((e) => e.char).join("");
		}, Y.prototype.getContext = function(e) {
			return this.registeredContexts[e] || null;
		}, Y.prototype.on = function(e, t) {
			let n = this.events[e];
			return n ? n.subscribe(t) : null;
		}, Y.prototype.dispatch = function(e, t) {
			let n = this.events[e];
			if (n instanceof bs) for (let e = 0; e < n.subscribers.length; e++) n.subscribers[e].apply(this, t || []);
		}, Y.prototype.registerContextChecker = function(e, t, n) {
			if (this.getContext(e)) return { FAIL: `context name '${e}' is already registered.` };
			if (typeof t != "function") return { FAIL: "missing context start check." };
			if (typeof n != "function") return { FAIL: "missing context end check." };
			let r = new vs(e, t, n);
			return this.registeredContexts[e] = r, this.contextCheckers.push(r), r;
		}, Y.prototype.getRangeTokens = function(e) {
			let t = e.startIndex + e.endOffset;
			return [].concat(this.tokens.slice(e.startIndex, t));
		}, Y.prototype.getContextRanges = function(e) {
			let t = this.getContext(e);
			return t ? t.ranges : { FAIL: `context checker '${e}' is not registered.` };
		}, Y.prototype.resetContextsRanges = function() {
			let e = this.registeredContexts;
			for (let t in e) if (Object.prototype.hasOwnProperty.call(e, t)) {
				let n = e[t];
				n.ranges = [];
			}
		}, Y.prototype.updateContextsRanges = function() {
			this.resetContextsRanges();
			let e = this.tokens.map((e) => e.char);
			for (let t = 0; t < e.length; t++) {
				let n = new ys(e, t);
				this.runContextCheck(n);
			}
			this.dispatch("updateContextsRanges", [this.registeredContexts]);
		}, Y.prototype.setEndOffset = function(e, t) {
			let n = this.getContext(t).openRange.startIndex, r = new _s(n, e, t), i = this.getContext(t).ranges;
			return r.rangeId = `${t}.${i.length}`, i.push(r), this.getContext(t).openRange = null, r;
		}, Y.prototype.runContextCheck = function(e) {
			let t = e.index;
			for (let n = 0; n < this.contextCheckers.length; n++) {
				let r = this.contextCheckers[n], i = r.contextName, a = this.getContext(i).openRange;
				if (!a && r.checkStart(e) && (a = new _s(t, null, i), this.getContext(i).openRange = a, this.dispatch("contextStart", [i, t])), a && r.checkEnd(e)) {
					let e = t - a.startIndex + 1, n = this.setEndOffset(e, i);
					this.dispatch("contextEnd", [i, n]);
				}
			}
		}, Y.prototype.tokenize = function(e) {
			this.tokens = [], this.resetContextsRanges();
			let t = Array.from(e);
			this.dispatch("start");
			for (let e = 0; e < t.length; e++) {
				let n = t[e], r = new ys(t, e);
				this.dispatch("next", [r]), this.runContextCheck(r);
				let i = new gs(n);
				this.tokens.push(i), this.dispatch("newToken", [i, r]);
			}
			return this.dispatch("end", [this.tokens]), this.tokens;
		};
		var Ss = Y;
		function Cs(e) {
			return /[\u0600-\u065F\u066A-\u06D2\u06FA-\u06FF]/.test(e);
		}
		function ws(e) {
			return /[\u0630\u0690\u0621\u0631\u0661\u0671\u0622\u0632\u0672\u0692\u06C2\u0623\u0673\u0693\u06C3\u0624\u0694\u06C4\u0625\u0675\u0695\u06C5\u06E5\u0676\u0696\u06C6\u0627\u0677\u0697\u06C7\u0648\u0688\u0698\u06C8\u0689\u0699\u06C9\u068A\u06CA\u066B\u068B\u06CB\u068C\u068D\u06CD\u06FD\u068E\u06EE\u06FE\u062F\u068F\u06CF\u06EF]/.test(e);
		}
		function Ts(e) {
			return /[\u0600-\u0605\u060C-\u060E\u0610-\u061B\u061E\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED]/.test(e);
		}
		function X(e) {
			return /[\u0E00-\u0E7F]/.test(e);
		}
		function Es(e) {
			return /[A-z]/.test(e);
		}
		function Ds(e) {
			return /\s/.test(e);
		}
		function Os(e) {
			this.font = e, this.features = {};
		}
		function ks(e) {
			this.id = e.id, this.tag = e.tag, this.substitution = e.substitution;
		}
		function As(e, t) {
			if (!e) return -1;
			switch (t.format) {
				case 1: return t.glyphs.indexOf(e);
				case 2: {
					let n = t.ranges;
					for (let t = 0; t < n.length; t++) {
						let r = n[t];
						if (e >= r.start && e <= r.end) {
							let t = e - r.start;
							return r.index + t;
						}
					}
					break;
				}
				default: return -1;
			}
			return -1;
		}
		function js(e, t) {
			return As(e, t.coverage) === -1 ? null : e + t.deltaGlyphId;
		}
		function Ms(e, t) {
			let n = As(e, t.coverage);
			return n === -1 ? null : t.substitute[n];
		}
		function Ns(e, t) {
			let n = [];
			for (let r = 0; r < e.length; r++) {
				let i = e[r], a = t.current;
				a = Array.isArray(a) ? a[0] : a;
				let o = As(a, i);
				o !== -1 && n.push(o);
			}
			return n.length === e.length ? n : -1;
		}
		function Ps(e, t) {
			let n = t.inputCoverage.length + t.lookaheadCoverage.length + t.backtrackCoverage.length;
			if (e.context.length < n) return [];
			let r = Ns(t.inputCoverage, e);
			if (r === -1) return [];
			let i = t.inputCoverage.length - 1;
			if (e.lookahead.length < t.lookaheadCoverage.length) return [];
			let a = e.lookahead.slice(i);
			for (; a.length && Ts(a[0].char);) a.shift();
			let o = new ys(a, 0), s = Ns(t.lookaheadCoverage, o), c = [].concat(e.backtrack);
			for (c.reverse(); c.length && Ts(c[0].char);) c.shift();
			if (c.length < t.backtrackCoverage.length) return [];
			let l = new ys(c, 0), u = Ns(t.backtrackCoverage, l), d = r.length === t.inputCoverage.length && s.length === t.lookaheadCoverage.length && u.length === t.backtrackCoverage.length, f = [];
			if (d) for (let n = 0; n < t.lookupRecords.length; n++) {
				let r = t.lookupRecords[n], i = r.lookupListIndex, a = this.getLookupByIndex(i);
				for (let t = 0; t < a.subtables.length; t++) {
					let n = a.subtables[t], i, o = this.getSubstitutionType(a, n);
					if (o === "71" ? (o = this.getSubstitutionType(n, n.extension), i = this.getLookupMethod(n, n.extension), n = n.extension) : i = this.getLookupMethod(a, n), o === "12") {
						let t = e.get(r.sequenceIndex), n = i(t);
						n && f.push(n);
					} else if (o === "21") {
						let t = e.get(r.sequenceIndex), n = i(t);
						n && f.push(n);
					} else throw Error(`Substitution type ${o} is not supported in chaining substitution`);
				}
			}
			return f;
		}
		function Fs(e, t) {
			let n = e.current, r = As(n, t.coverage);
			if (r === -1) return null;
			let i, a = t.ligatureSets[r];
			for (let t = 0; t < a.length; t++) {
				i = a[t];
				for (let t = 0; t < i.components.length && e.lookahead[t] === i.components[t]; t++) if (t === i.components.length - 1) return i;
			}
			return null;
		}
		function Is(e, t) {
			let n = e.current;
			if (As(n, t.coverage) === -1) return null;
			for (let r of t.ruleSets) for (let t of r) {
				let r = !0;
				for (let n = 0; n < t.input.length; n++) if (e.lookahead[n] !== t.input[n]) {
					r = !1;
					break;
				}
				if (r) {
					let e = [];
					e.push(n);
					for (let n = 0; n < t.input.length; n++) e.push(t.input[n]);
					let r = (e, t) => {
						let { lookupListIndex: n, sequenceIndex: r } = t, { subtables: i } = this.getLookupByIndex(n);
						for (let t of i) As(e[r], t.coverage) !== -1 && (e[r] = t.deltaGlyphId);
					};
					for (let n = 0; n < t.lookupRecords.length; n++) {
						let i = t.lookupRecords[n];
						r(e, i);
					}
					return e;
				}
			}
			return null;
		}
		function Ls(e, t) {
			if (e.context.length < t.coverages.length) return [];
			for (let n = 0; n < t.coverages.length; n++) {
				let r = e.get(n);
				if (r = Array.isArray(r) ? r[0] : r, As(r, t.coverages[n]) === -1) return [];
			}
			let n = [];
			for (let r = 0; r < t.lookupRecords.length; r++) {
				let i = t.lookupRecords[r], a = i.lookupListIndex, o = this.getLookupByIndex(a);
				for (let t = 0; t < o.subtables.length; t++) {
					let r = o.subtables[t], a, s = this.getSubstitutionType(o, r);
					if (s === "71" ? (s = this.getSubstitutionType(r, r.extension), a = this.getLookupMethod(r, r.extension), r = r.extension) : a = this.getLookupMethod(o, r), s === "12") {
						let t = e.get(i.sequenceIndex), r = a(t);
						r && n.push(r);
					} else if (s === "21") {
						let t = e.get(i.sequenceIndex), r = a(t);
						r && n.push(r);
					}
				}
			}
			return n;
		}
		function Rs(e, t) {
			let n = As(e, t.coverage);
			return n === -1 ? null : t.sequences[n];
		}
		Os.prototype.getDefaultScriptFeaturesIndexes = function() {
			let e = this.font.tables.gsub.scripts;
			for (let t = 0; t < e.length; t++) {
				let n = e[t];
				if (n.tag === "DFLT") return n.script.defaultLangSys.featureIndexes;
			}
			return [];
		}, Os.prototype.getScriptFeaturesIndexes = function(e) {
			if (!this.font.tables.gsub) return [];
			if (!e) return this.getDefaultScriptFeaturesIndexes();
			let t = this.font.tables.gsub.scripts;
			for (let n = 0; n < t.length; n++) {
				let r = t[n];
				if (r.tag === e && r.script.defaultLangSys) return r.script.defaultLangSys.featureIndexes;
				{
					let t = r.langSysRecords;
					if (t) for (let n = 0; n < t.length; n++) {
						let r = t[n];
						if (r.tag === e) return r.langSys.featureIndexes;
					}
				}
			}
			return this.getDefaultScriptFeaturesIndexes();
		}, Os.prototype.mapTagsToFeatures = function(e, t) {
			let n = {};
			for (let t = 0; t < e.length; t++) {
				let r = e[t].tag;
				n[r] = e[t].feature;
			}
			this.features[t].tags = n;
		}, Os.prototype.getScriptFeatures = function(e) {
			let t = this.features[e];
			if (Object.prototype.hasOwnProperty.call(this.features, e)) return t;
			let n = this.getScriptFeaturesIndexes(e);
			if (!n) return null;
			let r = this.font.tables.gsub;
			return t = n.map((e) => r.features[e]), this.features[e] = t, this.mapTagsToFeatures(t, e), t;
		}, Os.prototype.getSubstitutionType = function(e, t) {
			return e.lookupType.toString() + t.substFormat.toString();
		}, Os.prototype.getLookupMethod = function(e, t) {
			let n = this.getSubstitutionType(e, t);
			switch (n) {
				case "11": return (e) => js.apply(this, [e, t]);
				case "12": return (e) => Ms.apply(this, [e, t]);
				case "63": return (e) => Ps.apply(this, [e, t]);
				case "41": return (e) => Fs.apply(this, [e, t]);
				case "21": return (e) => Rs.apply(this, [e, t]);
				case "51": return (e) => Is.apply(this, [e, t]);
				case "53": return (e) => Ls.apply(this, [e, t]);
				default: throw Error(`substitutionType : ${n} lookupType: ${e.lookupType} - substFormat: ${t.substFormat} is not yet supported`);
			}
		}, Os.prototype.lookupFeature = function(e) {
			let t = e.contextParams, n = t.index, r = this.getFeature({
				tag: e.tag,
				script: e.script
			});
			if (!r) return /* @__PURE__ */ Error(`font '${(this.font.names.unicode || this.font.names.windows || this.font.names.macintosh).fullName.en}' doesn't support feature '${e.tag}' for script '${e.script}'.`);
			let i = this.getFeatureLookups(r), a = [].concat(t.context);
			for (let r = 0; r < i.length; r++) {
				let o = i[r], s = this.getLookupSubtables(o);
				for (let r = 0; r < s.length; r++) {
					let i = s[r], c = this.getSubstitutionType(o, i), l;
					c === "71" ? (c = this.getSubstitutionType(i, i.extension), l = this.getLookupMethod(i, i.extension), i = i.extension) : l = this.getLookupMethod(o, i);
					let u;
					switch (c) {
						case "11":
							u = l(t.current), u && a.splice(n, 1, new ks({
								id: 11,
								tag: e.tag,
								substitution: u
							}));
							break;
						case "12":
							u = l(t.current), u && a.splice(n, 1, new ks({
								id: 12,
								tag: e.tag,
								substitution: u
							}));
							break;
						case "63":
							u = l(t), Array.isArray(u) && u.length && a.splice(n, 1, new ks({
								id: 63,
								tag: e.tag,
								substitution: u
							}));
							break;
						case "41":
							u = l(t), u && a.splice(n, 1, new ks({
								id: 41,
								tag: e.tag,
								substitution: u
							}));
							break;
						case "21":
							u = l(t.current), u && a.splice(n, 1, new ks({
								id: 21,
								tag: e.tag,
								substitution: u
							}));
							break;
						case "51":
						case "53":
							u = l(t), Array.isArray(u) && u.length && a.splice(n, 1, new ks({
								id: parseInt(c),
								tag: e.tag,
								substitution: u
							}));
							break;
					}
					t = new ys(a, n), !(Array.isArray(u) && !u.length) && (u = null);
				}
			}
			return a.length ? a : null;
		}, Os.prototype.supports = function(e) {
			if (!e.script) return !1;
			this.getScriptFeatures(e.script);
			let t = Object.prototype.hasOwnProperty.call(this.features, e.script);
			if (!e.tag) return t;
			let n = this.features[e.script].some((t) => t.tag === e.tag);
			return t && n;
		}, Os.prototype.getLookupSubtables = function(e) {
			return e.subtables || null;
		}, Os.prototype.getLookupByIndex = function(e) {
			return this.font.tables.gsub.lookups[e] || null;
		}, Os.prototype.getFeatureLookups = function(e) {
			return e.lookupListIndexes.map(this.getLookupByIndex.bind(this));
		}, Os.prototype.getFeature = function(e) {
			if (!this.font) return { FAIL: "No font was found" };
			Object.prototype.hasOwnProperty.call(this.features, e.script) || this.getScriptFeatures(e.script);
			let t = this.features[e.script];
			return t ? t.tags[e.tag] ? this.features[e.script].tags[e.tag] : null : { FAIL: `No feature for script ${e.script}` };
		};
		var zs = Os;
		function Bs(e) {
			let t = e.current, n = e.get(-1);
			return n === null && Cs(t) || !Cs(n) && Cs(t);
		}
		function Vs(e) {
			let t = e.get(1);
			return t === null || !Cs(t);
		}
		var Hs = {
			startCheck: Bs,
			endCheck: Vs
		};
		function Us(e) {
			let t = e.current, n = e.get(-1);
			return (Cs(t) || Ts(t)) && !Cs(n);
		}
		function Ws(e) {
			let t = e.get(1);
			switch (!0) {
				case t === null: return !0;
				case !Cs(t) && !Ts(t): {
					let n = Ds(t);
					if (!n) return !0;
					if (n) {
						let t = !1;
						if (t = e.lookahead.some((e) => Cs(e) || Ts(e)), !t) return !0;
					}
					break;
				}
				default: return !1;
			}
		}
		var Gs = {
			startCheck: Us,
			endCheck: Ws
		};
		function Ks(e, t, n) {
			t[n].setState(e.tag, e.substitution);
		}
		function qs(e, t, n) {
			t[n].setState(e.tag, e.substitution);
		}
		function Js(e, t, n) {
			for (let r = 0; r < e.substitution.length; r++) {
				let i = e.substitution[r], a = t[n + r];
				if (Array.isArray(i)) {
					i.length ? a.setState(e.tag, i[0]) : a.setState("deleted", !0);
					continue;
				}
				a.setState(e.tag, i);
			}
		}
		function Ys(e, t, n) {
			let r = t[n];
			r.setState(e.tag, e.substitution.ligGlyph);
			let i = e.substitution.components.length;
			for (let e = 0; e < i; e++) r = t[n + e + 1], r.setState("deleted", !0);
		}
		var Xs = {
			11: Ks,
			12: qs,
			63: Js,
			41: Ys,
			51: Js,
			53: Js
		};
		function Zs(e, t, n) {
			e instanceof ks && Xs[e.id] && Xs[e.id](e, t, n);
		}
		var Qs = Zs;
		function $s(e) {
			let t = [].concat(e.backtrack);
			for (let e = t.length - 1; e >= 0; e--) {
				let n = t[e], r = ws(n), i = Ts(n);
				if (!r && !i) return !0;
				if (r) return !1;
			}
			return !1;
		}
		function ec(e) {
			if (ws(e.current)) return !1;
			for (let t = 0; t < e.lookahead.length; t++) {
				let n = e.lookahead[t];
				if (!Ts(n)) return !0;
			}
			return !1;
		}
		function tc(e) {
			let t = "arab", n = this.featuresTags[t], r = this.tokenizer.getRangeTokens(e);
			if (r.length === 1) return;
			let i = new ys(r.map((e) => e.getState("glyphIndex")), 0), a = new ys(r.map((e) => e.char), 0);
			for (let e = 0; e < r.length; e++) {
				let o = r[e];
				if (Ts(o.char)) continue;
				i.setCurrentIndex(e), a.setCurrentIndex(e);
				let s = 0;
				$s(a) && (s |= 1), ec(a) && (s |= 2);
				let c;
				switch (s) {
					case 1:
						c = "fina";
						break;
					case 2:
						c = "init";
						break;
					case 3:
						c = "medi";
						break;
				}
				if (n.indexOf(c) === -1) continue;
				let l = this.query.lookupFeature({
					tag: c,
					script: t,
					contextParams: i
				});
				if (l instanceof Error) {
					console.info(l.message);
					continue;
				}
				for (let e = 0; e < l.length; e++) {
					let t = l[e];
					t instanceof ks && (Qs(t, r, e), i.context[e] = t.substitution);
				}
			}
		}
		var nc = tc;
		function rc(e, t) {
			return new ys(e.map((e) => e.activeState.value), t || 0);
		}
		function ic(e) {
			let t = this.tokenizer.getRangeTokens(e), n = rc(t);
			for (let e = 0; e < n.context.length; e++) {
				n.setCurrentIndex(e);
				let r = this.query.lookupFeature({
					tag: "rlig",
					script: "arab",
					contextParams: n
				});
				if (r.length) {
					for (let n = 0; n < r.length; n++) {
						let i = r[n];
						Qs(i, t, e);
					}
					n = rc(t);
				}
			}
		}
		var ac = ic;
		function oc(e) {
			return e.index === 0 && e.context.length > 1;
		}
		function sc(e) {
			return e.index === e.context.length - 1;
		}
		var cc = {
			startCheck: oc,
			endCheck: sc
		};
		function lc(e, t) {
			return new ys(e.map((e) => e.activeState.value), t || 0);
		}
		function uc(e) {
			let t = "delf", n = "ccmp", r = this.tokenizer.getRangeTokens(e), i = lc(r);
			for (let e = 0; e < i.context.length; e++) {
				if (!this.query.getFeature({
					tag: n,
					script: t,
					contextParams: i
				})) continue;
				i.setCurrentIndex(e);
				let a = this.query.lookupFeature({
					tag: n,
					script: t,
					contextParams: i
				});
				if (a.length) {
					for (let t = 0; t < a.length; t++) {
						let n = a[t];
						Qs(n, r, e);
					}
					i = lc(r);
				}
			}
		}
		var dc = uc;
		function fc(e) {
			let t = e.current, n = e.get(-1);
			return n === null && Es(t) || !Es(n) && Es(t);
		}
		function pc(e) {
			let t = e.get(1);
			return t === null || !Es(t);
		}
		var mc = {
			startCheck: fc,
			endCheck: pc
		};
		function hc(e, t) {
			return new ys(e.map((e) => e.activeState.value), t || 0);
		}
		function gc(e) {
			let t = this.tokenizer.getRangeTokens(e), n = hc(t);
			for (let e = 0; e < n.context.length; e++) {
				n.setCurrentIndex(e);
				let r = this.query.lookupFeature({
					tag: "liga",
					script: "latn",
					contextParams: n
				});
				if (r.length) {
					for (let n = 0; n < r.length; n++) {
						let i = r[n];
						Qs(i, t, e);
					}
					n = hc(t);
				}
			}
		}
		var _c = gc;
		function vc(e) {
			let t = e.current, n = e.get(-1);
			return n === null && X(t) || !X(n) && X(t);
		}
		function yc(e) {
			let t = e.get(1);
			return t === null || !X(t);
		}
		var bc = {
			startCheck: vc,
			endCheck: yc
		};
		function xc(e, t) {
			return new ys(e.map((e) => e.activeState.value), t || 0);
		}
		function Sc(e) {
			let t = this.tokenizer.getRangeTokens(e), n = xc(t, 0);
			for (let e = 0; e < n.context.length; e++) {
				n.setCurrentIndex(e);
				let r = this.query.lookupFeature({
					tag: "ccmp",
					script: "thai",
					contextParams: n
				});
				if (r.length) {
					for (let n = 0; n < r.length; n++) {
						let i = r[n];
						Qs(i, t, e);
					}
					n = xc(t, e);
				}
			}
		}
		var Cc = Sc;
		function wc(e, t) {
			return new ys(e.map((e) => e.activeState.value), t || 0);
		}
		function Tc(e) {
			let t = this.tokenizer.getRangeTokens(e), n = wc(t, 0);
			for (let e = 0; e < n.context.length; e++) {
				n.setCurrentIndex(e);
				let r = this.query.lookupFeature({
					tag: "liga",
					script: "thai",
					contextParams: n
				});
				if (r.length) {
					for (let n = 0; n < r.length; n++) {
						let i = r[n];
						Qs(i, t, e);
					}
					n = wc(t, e);
				}
			}
		}
		var Ec = Tc;
		function Dc(e, t) {
			return new ys(e.map((e) => e.activeState.value), t || 0);
		}
		function Oc(e) {
			let t = this.tokenizer.getRangeTokens(e), n = Dc(t, 0);
			for (let e = 0; e < n.context.length; e++) {
				n.setCurrentIndex(e);
				let r = this.query.lookupFeature({
					tag: "rlig",
					script: "thai",
					contextParams: n
				});
				if (r.length) {
					for (let n = 0; n < r.length; n++) {
						let i = r[n];
						Qs(i, t, e);
					}
					n = Dc(t, e);
				}
			}
		}
		var kc = Oc;
		function Ac(e) {
			if (e === null) return !1;
			let t = e.codePointAt(0);
			return t >= 6155 && t <= 6157 || t >= 65024 && t <= 65039 || t >= 917760 && t <= 917999;
		}
		function jc(e) {
			let t = e.current, n = e.get(1);
			return n === null && Ac(t) || Ac(n);
		}
		function Mc(e) {
			let t = e.get(1);
			return t === null || !Ac(t);
		}
		var Nc = {
			startCheck: jc,
			endCheck: Mc
		};
		function Pc(e) {
			let t = this.query.font, n = this.tokenizer.getRangeTokens(e);
			if (n[1].setState("deleted", !0), t.tables.cmap && t.tables.cmap.varSelectorList) {
				let e = n[0].char.codePointAt(0), r = n[1].char.codePointAt(0), i = t.tables.cmap.varSelectorList[r];
				if (i !== void 0 && i.nonDefaultUVS) {
					let r = i.nonDefaultUVS.uvsMappings;
					if (r[e]) {
						let i = r[e].glyphID;
						t.glyphs.glyphs[i] !== void 0 && n[0].setState("glyphIndex", i);
					}
				}
			}
		}
		var Fc = Pc;
		function Ic(e) {
			this.baseDir = e || "ltr", this.tokenizer = new Ss(), this.featuresTags = {};
		}
		Ic.prototype.setText = function(e) {
			this.text = e;
		}, Ic.prototype.contextChecks = {
			ccmpReplacementCheck: cc,
			latinWordCheck: mc,
			arabicWordCheck: Hs,
			arabicSentenceCheck: Gs,
			thaiWordCheck: bc,
			unicodeVariationSequenceCheck: Nc
		};
		function Lc(e) {
			let t = this.contextChecks[`${e}Check`];
			return this.tokenizer.registerContextChecker(e, t.startCheck, t.endCheck);
		}
		function Rc() {
			return Lc.call(this, "ccmpReplacement"), Lc.call(this, "latinWord"), Lc.call(this, "arabicWord"), Lc.call(this, "arabicSentence"), Lc.call(this, "thaiWord"), Lc.call(this, "unicodeVariationSequence"), this.tokenizer.tokenize(this.text);
		}
		function zc() {
			let e = this.tokenizer.getContextRanges("arabicSentence");
			for (let t = 0; t < e.length; t++) {
				let n = e[t], r = this.tokenizer.getRangeTokens(n);
				this.tokenizer.replaceRange(n.startIndex, n.endOffset, r.reverse());
			}
		}
		Ic.prototype.registerFeatures = function(e, t) {
			let n = t.filter((t) => this.query.supports({
				script: e,
				tag: t
			}));
			Object.prototype.hasOwnProperty.call(this.featuresTags, e) ? this.featuresTags[e] = this.featuresTags[e].concat(n) : this.featuresTags[e] = n;
		}, Ic.prototype.applyFeatures = function(e, t) {
			if (!e) throw Error("No valid font was provided to apply features");
			this.query ||= new zs(e);
			for (let e = 0; e < t.length; e++) {
				let n = t[e];
				this.query.supports({ script: n.script }) && this.registerFeatures(n.script, n.tags);
			}
		}, Ic.prototype.registerModifier = function(e, t, n) {
			this.tokenizer.registerModifier(e, t, n);
		};
		function Bc() {
			if (this.tokenizer.registeredModifiers.indexOf("glyphIndex") === -1) throw Error("glyphIndex modifier is required to apply arabic presentation features.");
		}
		function Vc() {
			if (!Object.prototype.hasOwnProperty.call(this.featuresTags, "arab")) return;
			Bc.call(this);
			let e = this.tokenizer.getContextRanges("arabicWord");
			for (let t = 0; t < e.length; t++) {
				let n = e[t];
				nc.call(this, n);
			}
		}
		function Hc() {
			Bc.call(this);
			let e = this.tokenizer.getContextRanges("ccmpReplacement");
			for (let t = 0; t < e.length; t++) {
				let n = e[t];
				dc.call(this, n);
			}
		}
		function Uc() {
			if (!this.hasFeatureEnabled("arab", "rlig")) return;
			Bc.call(this);
			let e = this.tokenizer.getContextRanges("arabicWord");
			for (let t = 0; t < e.length; t++) {
				let n = e[t];
				ac.call(this, n);
			}
		}
		function Wc() {
			if (!this.hasFeatureEnabled("latn", "liga")) return;
			Bc.call(this);
			let e = this.tokenizer.getContextRanges("latinWord");
			for (let t = 0; t < e.length; t++) {
				let n = e[t];
				_c.call(this, n);
			}
		}
		function Gc() {
			let e = this.tokenizer.getContextRanges("unicodeVariationSequence");
			for (let t = 0; t < e.length; t++) {
				let n = e[t];
				Fc.call(this, n);
			}
		}
		function Kc() {
			Bc.call(this);
			let e = this.tokenizer.getContextRanges("thaiWord");
			for (let t = 0; t < e.length; t++) {
				let n = e[t];
				this.hasFeatureEnabled("thai", "liga") && Ec.call(this, n), this.hasFeatureEnabled("thai", "rlig") && kc.call(this, n), this.hasFeatureEnabled("thai", "ccmp") && Cc.call(this, n);
			}
		}
		Ic.prototype.checkContextReady = function(e) {
			return !!this.tokenizer.getContext(e);
		}, Ic.prototype.applyFeaturesToContexts = function() {
			this.checkContextReady("ccmpReplacement") && Hc.call(this), this.checkContextReady("arabicWord") && (Vc.call(this), Uc.call(this)), this.checkContextReady("latinWord") && Wc.call(this), this.checkContextReady("arabicSentence") && zc.call(this), this.checkContextReady("thaiWord") && Kc.call(this), this.checkContextReady("unicodeVariationSequence") && Gc.call(this);
		}, Ic.prototype.hasFeatureEnabled = function(e, t) {
			return (this.featuresTags[e] || []).indexOf(t) !== -1;
		}, Ic.prototype.processText = function(e) {
			(!this.text || this.text !== e) && (this.setText(e), Rc.call(this), this.applyFeaturesToContexts());
		}, Ic.prototype.getBidiText = function(e) {
			return this.processText(e), this.tokenizer.getText();
		}, Ic.prototype.getTextGlyphs = function(e) {
			this.processText(e);
			let t = [];
			for (let e = 0; e < this.tokenizer.tokens.length; e++) {
				let n = this.tokenizer.tokens[e];
				if (n.state.deleted) continue;
				let r = n.activeState.value;
				t.push(Array.isArray(r) ? r[0] : r);
			}
			return t;
		};
		var qc = Ic;
		function Jc(e) {
			return {
				fontFamily: { en: e.familyName || " " },
				fontSubfamily: { en: e.styleName || " " },
				fullName: { en: e.fullName || e.familyName + " " + e.styleName },
				postScriptName: { en: e.postScriptName || (e.familyName + e.styleName).replace(/\s/g, "") },
				designer: { en: e.designer || " " },
				designerURL: { en: e.designerURL || " " },
				manufacturer: { en: e.manufacturer || " " },
				manufacturerURL: { en: e.manufacturerURL || " " },
				license: { en: e.license || " " },
				licenseURL: { en: e.licenseURL || " " },
				version: { en: e.version || "Version 0.1" },
				description: { en: e.description || " " },
				copyright: { en: e.copyright || " " },
				trademark: { en: e.trademark || " " }
			};
		}
		function Z(e) {
			if (e ||= {}, e.tables = e.tables || {}, !e.empty) {
				if (!e.familyName) throw Error("When creating a new Font object, familyName is required.");
				if (!e.styleName) throw Error("When creating a new Font object, styleName is required.");
				if (!e.unitsPerEm) throw Error("When creating a new Font object, unitsPerEm is required.");
				if (!e.ascender) throw Error("When creating a new Font object, ascender is required.");
				if (e.descender > 0) throw Error("When creating a new Font object, negative descender value is required.");
				this.names = {}, this.names.unicode = Jc(e), this.names.macintosh = Jc(e), this.names.windows = Jc(e), this.unitsPerEm = e.unitsPerEm || 1e3, this.ascender = e.ascender, this.descender = e.descender, this.createdTimestamp = e.createdTimestamp, this.italicAngle = e.italicAngle || 0, this.weightClass = e.weightClass || 0;
				let t = 0;
				e.fsSelection ? t = e.fsSelection : (this.italicAngle < 0 ? t |= this.fsSelectionValues.ITALIC : this.italicAngle > 0 && (t |= this.fsSelectionValues.OBLIQUE), this.weightClass >= 600 && (t |= this.fsSelectionValues.BOLD), t === 0 && (t = this.fsSelectionValues.REGULAR)), (!e.panose || !Array.isArray(e.panose)) && (e.panose = [
					0,
					0,
					0,
					0,
					0,
					0,
					0,
					0,
					0
				]), this.tables = Object.assign(e.tables, { os2: Object.assign({
					usWeightClass: e.weightClass || this.usWeightClasses.MEDIUM,
					usWidthClass: e.widthClass || this.usWidthClasses.MEDIUM,
					bFamilyType: e.panose[0] || 0,
					bSerifStyle: e.panose[1] || 0,
					bWeight: e.panose[2] || 0,
					bProportion: e.panose[3] || 0,
					bContrast: e.panose[4] || 0,
					bStrokeVariation: e.panose[5] || 0,
					bArmStyle: e.panose[6] || 0,
					bLetterform: e.panose[7] || 0,
					bMidline: e.panose[8] || 0,
					bXHeight: e.panose[9] || 0,
					fsSelection: t
				}, e.tables.os2) });
			}
			this.supported = !0, this.glyphs = new B.GlyphSet(this, e.glyphs || []), this.encoding = new jt(this), this.position = new Ti(this), this.substitution = new Fi(this), this.tables = this.tables || {}, this.tables = new Proxy(this.tables, { set: (e, t, n) => (e[t] = n, e.fvar && (e.gvar || e.cff2) && !this.variation && (this.variation = new ia(this)), !0) }), this.palettes = new Ii(this), this.layers = new Li(this), this.svgImages = new Ri(this), this._push = null, this._hmtxTableData = {}, Object.defineProperty(this, "hinting", { get: function() {
				return this._hinting ? this._hinting : this.outlinesFormat === "truetype" ? this._hinting = new hs(this) : null;
			} });
		}
		Z.prototype.hasChar = function(e) {
			return this.encoding.charToGlyphIndex(e) > 0;
		}, Z.prototype.charToGlyphIndex = function(e) {
			return this.encoding.charToGlyphIndex(e);
		}, Z.prototype.charToGlyph = function(e) {
			let t = this.charToGlyphIndex(e), n = this.glyphs.get(t);
			return n ||= this.glyphs.get(0), n;
		}, Z.prototype.updateFeatures = function(e) {
			return this.defaultRenderOptions.features.map((t) => t.script === "latn" ? {
				script: "latn",
				tags: t.tags.filter((t) => e[t])
			} : t);
		}, Z.prototype.stringToGlyphIndexes = function(e, t) {
			let n = new qc();
			n.registerModifier("glyphIndex", null, (e) => this.charToGlyphIndex(e.char));
			let r = t ? this.updateFeatures(t.features) : this.defaultRenderOptions.features;
			return n.applyFeatures(this, r), n.getTextGlyphs(e);
		}, Z.prototype.stringToGlyphs = function(e, t) {
			let n = this.stringToGlyphIndexes(e, t), r = n.length, i = Array(r), a = this.glyphs.get(0);
			for (let e = 0; e < r; e += 1) i[e] = this.glyphs.get(n[e]) || a;
			return i;
		}, Z.prototype.nameToGlyphIndex = function(e) {
			return this.glyphNames.nameToGlyphIndex(e);
		}, Z.prototype.nameToGlyph = function(e) {
			let t = this.nameToGlyphIndex(e), n = this.glyphs.get(t);
			return n ||= this.glyphs.get(0), n;
		}, Z.prototype.glyphIndexToName = function(e) {
			return this.glyphNames.glyphIndexToName ? this.glyphNames.glyphIndexToName(e) : "";
		}, Z.prototype.getKerningValue = function(e, t) {
			e = e.index || e, t = t.index || t;
			let n = this.position.defaultKerningTables;
			return n ? this.position.getKerningValue(n, e, t) : this.kerningPairs[e + "," + t] || 0;
		}, Z.prototype.defaultRenderOptions = {
			kerning: !0,
			features: [
				{
					script: "arab",
					tags: [
						"init",
						"medi",
						"fina",
						"rlig"
					]
				},
				{
					script: "latn",
					tags: ["liga", "rlig"]
				},
				{
					script: "thai",
					tags: [
						"liga",
						"rlig",
						"ccmp"
					]
				}
			],
			hinting: !1,
			usePalette: 0,
			drawLayers: !0,
			drawSVG: !0
		}, Z.prototype.forEachGlyph = function(e, t, n, r, i, a) {
			t = t === void 0 ? 0 : t, n = n === void 0 ? 0 : n, r = r === void 0 ? 72 : r, i = Object.assign({}, this.defaultRenderOptions, i);
			let o = 1 / this.unitsPerEm * r, s = this.stringToGlyphs(e, i), c;
			if (i.kerning) {
				let e = i.script || this.position.getDefaultScriptName();
				c = this.position.getKerningTables(e, i.language);
			}
			for (let e = 0; e < s.length; e += 1) {
				let l = s[e];
				if (a.call(this, l, t, n, r, i), l.advanceWidth && (t += l.advanceWidth * o), i.kerning && e < s.length - 1) {
					let n = c ? this.position.getKerningValue(c, l.index, s[e + 1].index) : this.getKerningValue(l, s[e + 1]);
					t += n * o;
				}
				i.letterSpacing ? t += i.letterSpacing * r : i.tracking && (t += i.tracking / 1e3 * r);
			}
			return t;
		}, Z.prototype.getPath = function(e, t, n, r, i) {
			i = Object.assign({}, this.defaultRenderOptions, i);
			let a = new ue();
			if (a._layers = [], jn(this, a, r), a.stroke) {
				let e = 1 / (a.unitsPerEm || 1e3) * r;
				a.strokeWidth *= e;
			}
			return this.forEachGlyph(e, t, n, r, i, (e, t, n, r) => {
				let o = e.getPath(t, n, r, i, this);
				if (i.drawSVG || i.drawLayers) {
					let e = o._layers;
					if (e && e.length) {
						for (let t = 0; t < e.length; t++) {
							let n = e[t];
							a._layers.push(n);
						}
						return;
					}
				}
				a.extend(o);
			}), a;
		}, Z.prototype.getPaths = function(e, t, n, r, i) {
			i = Object.assign({}, this.defaultRenderOptions, i);
			let a = [];
			return this.forEachGlyph(e, t, n, r, i, function(e, t, n, r) {
				let o = e.getPath(t, n, r, i, this);
				a.push(o);
			}), a;
		}, Z.prototype.getAdvanceWidth = function(e, t, n) {
			return n = Object.assign({}, this.defaultRenderOptions, n), this.forEachGlyph(e, 0, 0, t, n, function() {});
		}, Z.prototype.draw = function(e, t, n, r, i, a) {
			this.getPath(t, n, r, i, a).draw(e);
		}, Z.prototype.drawPoints = function(e, t, n, r, i, a) {
			a = Object.assign({}, this.defaultRenderOptions, a), this.forEachGlyph(t, n, r, i, a, function(t, n, r, i) {
				t.drawPoints(e, n, r, i, a, this);
			});
		}, Z.prototype.drawMetrics = function(e, t, n, r, i, a) {
			a = Object.assign({}, this.defaultRenderOptions, a), this.forEachGlyph(t, n, r, i, a, function(t, n, r, i) {
				t.drawMetrics(e, n, r, i);
			});
		}, Z.prototype.getEnglishName = function(e) {
			let t = (this.names.unicode || this.names.macintosh || this.names.windows)[e];
			if (t) return t.en;
		}, Z.prototype.validate = function() {
			let e = [], t = this;
			function n(t, n) {
				t || (console.warn(`[opentype.js] ${n}`), e.push(n));
			}
			function r(e) {
				let r = t.getEnglishName(e);
				n(r && r.trim().length > 0, "No English " + e + " specified.");
			}
			if (r("fontFamily"), r("weightName"), r("manufacturer"), r("copyright"), r("version"), n(this.unitsPerEm > 0, "No unitsPerEm specified."), this.tables.colr) {
				let e = this.tables.colr.baseGlyphRecords, t = -1;
				for (let r = 0; r < e.length; r++) {
					let i = e[r].glyphID;
					if (n(t < e[r].glyphID, `baseGlyphs must be sorted by GlyphID in ascending order, but glyphID ${i} comes after ${t}`), t > e[r].glyphID) break;
					t = i;
				}
			}
			return e;
		}, Z.prototype.toTables = function() {
			return vi.fontToTable(this);
		}, Z.prototype.toBuffer = function() {
			return console.warn("Font.toBuffer is deprecated. Use Font.toArrayBuffer instead."), this.toArrayBuffer();
		}, Z.prototype.toArrayBuffer = function() {
			let e = this.toTables().encode(), t = new ArrayBuffer(e.length), n = new Uint8Array(t);
			for (let t = 0; t < e.length; t++) n[t] = e[t];
			return t;
		}, Z.prototype.download = function() {
			console.error("DEPRECATED: platform-specific actions are to be implemented on user-side");
		}, Z.prototype.fsSelectionValues = {
			ITALIC: 1,
			UNDERSCORE: 2,
			NEGATIVE: 4,
			OUTLINED: 8,
			STRIKEOUT: 16,
			BOLD: 32,
			REGULAR: 64,
			USER_TYPO_METRICS: 128,
			WWS: 256,
			OBLIQUE: 512
		}, Z.prototype.macStyleValues = {
			BOLD: 1,
			ITALIC: 2,
			UNDERLINE: 4,
			OUTLINED: 8,
			SHADOW: 16,
			CONDENSED: 32,
			EXTENDED: 64
		}, Z.prototype.usWidthClasses = {
			ULTRA_CONDENSED: 1,
			EXTRA_CONDENSED: 2,
			CONDENSED: 3,
			SEMI_CONDENSED: 4,
			MEDIUM: 5,
			SEMI_EXPANDED: 6,
			EXPANDED: 7,
			EXTRA_EXPANDED: 8,
			ULTRA_EXPANDED: 9
		}, Z.prototype.usWeightClasses = {
			THIN: 100,
			EXTRA_LIGHT: 200,
			LIGHT: 300,
			NORMAL: 400,
			MEDIUM: 500,
			SEMI_BOLD: 600,
			BOLD: 700,
			EXTRA_BOLD: 800,
			BLACK: 900
		};
		var Yc = Z;
		function Xc(e, t) {
			let n = new R.Parser(e, t), r = n.parseUShort(), i = n.parseUShort();
			return r !== 1 && console.warn(`Unsupported hvar table version ${r}.${i}`), {
				version: [r, i],
				itemVariationStore: n.parsePointer32(function() {
					return this.parseItemVariationStore();
				}),
				advanceWidth: n.parsePointer32(function() {
					return this.parseDeltaSetIndexMap();
				}),
				lsb: n.parsePointer32(function() {
					return this.parseDeltaSetIndexMap();
				}),
				rsb: n.parsePointer32(function() {
					return this.parseDeltaSetIndexMap();
				})
			};
		}
		function Zc() {
			console.warn("Writing of hvar tables is not yet supported.");
		}
		var Qc = {
			make: Zc,
			parse: Xc
		}, $c = function() {
			return {
				coverage: this.parsePointer(L.coverage),
				attachPoints: this.parseList(L.pointer(L.uShortList))
			};
		}, el = function() {
			var e = this.parseUShort();
			if (j.argument(e === 1 || e === 2 || e === 3, "Unsupported CaretValue table version."), e === 1) return { coordinate: this.parseShort() };
			if (e === 2) return { pointindex: this.parseShort() };
			if (e === 3) return { coordinate: this.parseShort() };
		}, tl = function() {
			return this.parseList(L.pointer(el));
		}, nl = function() {
			return {
				coverage: this.parsePointer(L.coverage),
				ligGlyphs: this.parseList(L.pointer(tl))
			};
		}, rl = function() {
			return this.parseUShort(), this.parseList(L.pointer(L.coverage));
		};
		function il(e, t) {
			t ||= 0;
			let n = new L(e, t), r = n.parseVersion(1);
			j.argument(r === 1 || r === 1.2 || r === 1.3, "Unsupported GDEF table version.");
			var i = {
				version: r,
				classDef: n.parsePointer(L.classDef),
				attachList: n.parsePointer($c),
				ligCaretList: n.parsePointer(nl),
				markAttachClassDef: n.parsePointer(L.classDef)
			};
			return r >= 1.2 && (i.markGlyphSets = n.parsePointer(rl)), i;
		}
		var al = { parse: il }, ol = Array(10);
		ol[1] = function() {
			let e = this.offset + this.relativeOffset, t = this.parseUShort();
			if (t === 1) return {
				posFormat: 1,
				coverage: this.parsePointer(L.coverage),
				value: this.parseValueRecord()
			};
			if (t === 2) return {
				posFormat: 2,
				coverage: this.parsePointer(L.coverage),
				values: this.parseValueRecordList()
			};
			j.assert(!1, "0x" + e.toString(16) + ": GPOS lookup type 1 format must be 1 or 2.");
		}, ol[2] = function() {
			let e = this.offset + this.relativeOffset, t = this.parseUShort();
			j.assert(t === 1 || t === 2, "0x" + e.toString(16) + ": GPOS lookup type 2 format must be 1 or 2.");
			let n = this.parsePointer(L.coverage), r = this.parseUShort(), i = this.parseUShort();
			if (t === 1) return {
				posFormat: t,
				coverage: n,
				valueFormat1: r,
				valueFormat2: i,
				pairSets: this.parseList(L.pointer(L.list(function() {
					return {
						secondGlyph: this.parseUShort(),
						value1: this.parseValueRecord(r),
						value2: this.parseValueRecord(i)
					};
				})))
			};
			if (t === 2) {
				let e = this.parsePointer(L.classDef), a = this.parsePointer(L.classDef), o = this.parseUShort(), s = this.parseUShort();
				return {
					posFormat: t,
					coverage: n,
					valueFormat1: r,
					valueFormat2: i,
					classDef1: e,
					classDef2: a,
					class1Count: o,
					class2Count: s,
					classRecords: this.parseList(o, L.list(s, function() {
						return {
							value1: this.parseValueRecord(r),
							value2: this.parseValueRecord(i)
						};
					}))
				};
			}
		}, ol[3] = function() {
			return { error: "GPOS Lookup 3 not supported" };
		}, ol[4] = function() {
			return { error: "GPOS Lookup 4 not supported" };
		}, ol[5] = function() {
			return { error: "GPOS Lookup 5 not supported" };
		}, ol[6] = function() {
			return { error: "GPOS Lookup 6 not supported" };
		}, ol[7] = function() {
			return { error: "GPOS Lookup 7 not supported" };
		}, ol[8] = function() {
			return { error: "GPOS Lookup 8 not supported" };
		}, ol[9] = function() {
			return { error: "GPOS Lookup 9 not supported" };
		};
		function sl(e, t) {
			t ||= 0;
			let n = new L(e, t), r = n.parseVersion(1);
			return j.argument(r === 1 || r === 1.1, "Unsupported GPOS table version " + r), r === 1 ? {
				version: r,
				scripts: n.parseScriptList(),
				features: n.parseFeatureList(),
				lookups: n.parseLookupList(ol)
			} : {
				version: r,
				scripts: n.parseScriptList(),
				features: n.parseFeatureList(),
				lookups: n.parseLookupList(ol),
				variations: n.parseFeatureVariationsList()
			};
		}
		var cl = Array(10);
		function ll(e) {
			return new I.Table("GPOS", [
				{
					name: "version",
					type: "ULONG",
					value: 65536
				},
				{
					name: "scripts",
					type: "TABLE",
					value: new I.ScriptList(e.scripts)
				},
				{
					name: "features",
					type: "TABLE",
					value: new I.FeatureList(e.features)
				},
				{
					name: "lookups",
					type: "TABLE",
					value: new I.LookupList(e.lookups, cl)
				}
			]);
		}
		var ul = {
			parse: sl,
			make: ll
		};
		function dl(e) {
			let t = {};
			e.skip("uShort");
			let n = e.parseUShort();
			j.argument(n === 0, "Unsupported kern sub-table version."), e.skip("uShort", 2);
			let r = e.parseUShort();
			e.skip("uShort", 3);
			for (let n = 0; n < r; n += 1) {
				let n = e.parseUShort(), r = e.parseUShort(), i = e.parseShort();
				t[n + "," + r] = i;
			}
			return t;
		}
		function fl(e) {
			let t = {};
			e.skip("uShort"), e.parseULong() > 1 && console.warn("Only the first kern subtable is supported."), e.skip("uLong");
			let n = e.parseUShort() & 255;
			if (e.skip("uShort"), n === 0) {
				let n = e.parseUShort();
				e.skip("uShort", 3);
				for (let r = 0; r < n; r += 1) {
					let n = e.parseUShort(), r = e.parseUShort(), i = e.parseShort();
					t[n + "," + r] = i;
				}
			}
			return t;
		}
		function pl(e, t) {
			let n = new R.Parser(e, t), r = n.parseUShort();
			if (r === 0) return dl(n);
			if (r === 1) return fl(n);
			throw Error("Unsupported kern table version (" + r + ").");
		}
		var ml = { parse: pl };
		function hl(e, t, n, r) {
			let i = new R.Parser(e, t), a = r ? i.parseUShort : i.parseULong, o = [];
			for (let e = 0; e < n + 1; e += 1) {
				let e = a.call(i);
				r && (e *= 2), o.push(e);
			}
			return o;
		}
		var gl = { parse: hl };
		function _l(e, t) {
			let n = [], r = 12;
			for (let i = 0; i < t; i += 1) {
				let t = R.getTag(e, r), i = R.getULong(e, r + 4), a = R.getULong(e, r + 8), o = R.getULong(e, r + 12);
				n.push({
					tag: t,
					checksum: i,
					offset: a,
					length: o,
					compression: !1
				}), r += 16;
			}
			return n;
		}
		function vl(e, t) {
			let n = [], r = 44;
			for (let i = 0; i < t; i += 1) {
				let t = R.getTag(e, r), i = R.getULong(e, r + 4), a = R.getULong(e, r + 8), o = R.getULong(e, r + 12), s;
				s = a < o && "WOFF", n.push({
					tag: t,
					offset: i,
					compression: s,
					compressedLength: a,
					length: o
				}), r += 20;
			}
			return n;
		}
		function Q(e, t) {
			if (t.compression === "WOFF") {
				let n = new Uint8Array(e.buffer, t.offset + 2, t.compressedLength - 2), r = new Uint8Array(t.length);
				if (ie(n, r), r.byteLength !== t.length) throw Error("Decompression error: " + t.tag + " decompressed length doesn't match recorded length");
				return {
					data: new DataView(r.buffer, 0),
					offset: 0
				};
			} else return {
				data: e,
				offset: t.offset
			};
		}
		function yl(e, t = {}) {
			let n, r, i = new Yc({ empty: !0 });
			e.constructor !== ArrayBuffer && (e = new Uint8Array(e).buffer);
			let a = new DataView(e, 0), o, s = [], c = R.getTag(a, 0);
			if (c === "\0\0\0" || c === "true" || c === "typ1") i.outlinesFormat = "truetype", o = R.getUShort(a, 4), s = _l(a, o);
			else if (c === "OTTO") i.outlinesFormat = "cff", o = R.getUShort(a, 4), s = _l(a, o);
			else if (c === "wOFF") {
				let e = R.getTag(a, 4);
				if (e === "\0\0\0") i.outlinesFormat = "truetype";
				else if (e === "OTTO") i.outlinesFormat = "cff";
				else throw Error("Unsupported OpenType flavor " + c);
				o = R.getUShort(a, 12), s = vl(a, o);
			} else if (c === "wOF2") throw Error("WOFF2 require an external decompressor library, see examples at: https://github.com/opentypejs/opentype.js/issues/183#issuecomment-1147228025");
			else throw Error("Unsupported OpenType signature " + c);
			let l, u, d, f, p, m, h, g, _, v, y, b, ee, x, S, C, te, w;
			for (let e = 0; e < o; e += 1) {
				let t = s[e], o;
				switch (t.tag) {
					case "avar":
						h = t;
						break;
					case "cmap":
						o = Q(a, t), i.tables.cmap = Ct.parse(o.data, o.offset), i.encoding = new Mt(i.tables.cmap);
						break;
					case "cvt ":
						o = Q(a, t), w = new R.Parser(o.data, o.offset), i.tables.cvt = w.parseShortList(t.length / 2);
						break;
					case "fvar":
						d = t;
						break;
					case "STAT":
						f = t;
						break;
					case "gvar":
						p = t;
						break;
					case "cvar":
						m = t;
						break;
					case "fpgm":
						o = Q(a, t), w = new R.Parser(o.data, o.offset), i.tables.fpgm = w.parseByteList(t.length);
						break;
					case "head":
						o = Q(a, t), i.tables.head = Zn.parse(o.data, o.offset), i.unitsPerEm = i.tables.head.unitsPerEm, n = i.tables.head.indexToLocFormat;
						break;
					case "hhea":
						o = Q(a, t), i.tables.hhea = er.parse(o.data, o.offset), i.ascender = i.tables.hhea.ascender, i.descender = i.tables.hhea.descender, i.numberOfHMetrics = i.tables.hhea.numberOfHMetrics;
						break;
					case "HVAR":
						ee = t;
						break;
					case "hmtx":
						b = t;
						break;
					case "ltag":
						o = Q(a, t), r = cr.parse(o.data, o.offset);
						break;
					case "COLR":
						o = Q(a, t), i.tables.colr = jr.parse(o.data, o.offset);
						break;
					case "CPAL":
						o = Q(a, t), i.tables.cpal = Xt.parse(o.data, o.offset);
						break;
					case "maxp":
						o = Q(a, t), i.tables.maxp = dr.parse(o.data, o.offset), i.numGlyphs = i.tables.maxp.numGlyphs;
						break;
					case "name":
						C = t;
						break;
					case "OS/2":
						o = Q(a, t), i.tables.os2 = gr.parse(o.data, o.offset);
						break;
					case "post":
						o = Q(a, t), i.tables.post = yr.parse(o.data, o.offset), i.glyphNames = new Pt(i.tables.post);
						break;
					case "prep":
						o = Q(a, t), w = new R.Parser(o.data, o.offset), i.tables.prep = w.parseByteList(t.length);
						break;
					case "glyf":
						g = t;
						break;
					case "loca":
						S = t;
						break;
					case "CFF ":
						l = t;
						break;
					case "CFF2":
						u = t;
						break;
					case "kern":
						x = t;
						break;
					case "GDEF":
						_ = t;
						break;
					case "GPOS":
						v = t;
						break;
					case "GSUB":
						y = t;
						break;
					case "meta":
						te = t;
						break;
					case "gasp":
						try {
							o = Q(a, t), i.tables.gasp = si.parse(o.data, o.offset);
						} catch (e) {
							console.warn("Failed to parse gasp table, skipping."), console.warn(e);
						}
						break;
					case "SVG ":
						o = Q(a, t), i.tables.svg = ui.parse(o.data, o.offset);
						break;
					default: break;
				}
			}
			let T = Q(a, C);
			if (i.tables.name = pt.parse(T.data, T.offset, r), i.names = i.tables.name, g && S) {
				let e = n === 0, r = Q(a, S), o = gl.parse(r.data, r.offset, i.numGlyphs, e), s = Q(a, g);
				i.glyphs = na.parse(s.data, s.offset, o, i, t);
			} else if (l) {
				let e = Q(a, l);
				Jn.parse(e.data, e.offset, i, t);
			} else if (u) {
				let e = Q(a, u);
				Jn.parse(e.data, e.offset, i, t);
			} else throw Error("Font doesn't contain TrueType, CFF or CFF2 outlines.");
			let E = Q(a, b);
			if (ar.parse(i, E.data, E.offset, i.numberOfHMetrics, i.numGlyphs, i.glyphs, t), Lt(i, t), x) {
				let e = Q(a, x);
				i.kerningPairs = ml.parse(e.data, e.offset);
			} else i.kerningPairs = {};
			if (_) {
				let e = Q(a, _);
				i.tables.gdef = al.parse(e.data, e.offset);
			}
			if (v) {
				let e = Q(a, v);
				i.tables.gpos = ul.parse(e.data, e.offset), i.position.init();
			}
			if (y) {
				let e = Q(a, y);
				i.tables.gsub = Tr.parse(e.data, e.offset);
			}
			if (d) {
				let e = Q(a, d);
				i.tables.fvar = Rr.parse(e.data, e.offset, i.names);
			}
			if (f) {
				let e = Q(a, f);
				i.tables.stat = qr.parse(e.data, e.offset, i.tables.fvar);
			}
			if (p) {
				d || console.warn("This font provides a gvar table, but no fvar table, which is required for variable fonts."), g || console.warn("This font provides a gvar table, but no glyf table. Glyph variation only works with TrueType outlines.");
				let e = Q(a, p);
				i.tables.gvar = ii.parse(e.data, e.offset, i.tables.fvar, i.glyphs);
			}
			if (m) {
				d || console.warn("This font provides a cvar table, but no fvar table, which is required for variable fonts."), i.tables.cvt || console.warn("This font provides a cvar table, but no cvt table which could be made variable."), g || console.warn("This font provides a gvar table, but no glyf table. Glyph variation only works with TrueType outlines.");
				let e = Q(a, m);
				i.tables.cvar = ti.parse(e.data, e.offset, i.tables.fvar, i.tables.cvt || []);
			}
			if (h) {
				d || console.warn("This font provides an avar table, but no fvar table, which is required for variable fonts.");
				let e = Q(a, h);
				i.tables.avar = Qr.parse(e.data, e.offset, i.tables.fvar);
			}
			if (ee) {
				d || console.warn("This font provides an HVAR table, but no fvar table, which is required for variable fonts."), b || console.warn("This font provides an HVAR table, but no hmtx table to vary.");
				let e = Q(a, ee);
				i.tables.hvar = Qc.parse(e.data, e.offset, i.tables.fvar);
			}
			if (te) {
				let e = Q(a, te);
				i.tables.meta = Or.parse(e.data, e.offset), i.metas = i.tables.meta;
			}
			return i.palettes = new Ii(i), i;
		}
		function bl() {
			console.error("DEPRECATED! migrate to: opentype.parse(buffer, opt) See: https://github.com/opentypejs/opentype.js/issues/675");
		}
		function xl() {
			console.error("DEPRECATED! migrate to: opentype.parse(require(\"fs\").readFileSync(url), opt)");
		}
		return o(s);
	})();
	(function(e, n) {
		typeof define == "function" && define.amd ? define(n) : typeof t == "object" && t.exports ? t.exports = n() : e.opentype = n();
	})(typeof self < "u" ? self : e, () => ({
		...n,
		default: n
	}));
})))(), 1), _d = /* @__PURE__ */ new Map(), vd = /* @__PURE__ */ new Map(), yd = /* @__PURE__ */ new Map(), bd = /* @__PURE__ */ new Set();
function xd(e, t) {
	_d.set(e, typeof t == "string" ? {
		kind: "url",
		url: t
	} : {
		kind: "buffer",
		buffer: t
	});
}
function Sd() {
	return [..._d.keys()];
}
function Cd(e) {
	return vd.get(e) ?? null;
}
function wd(e) {
	return bd.add(e), () => {
		bd.delete(e);
	};
}
async function Td(e) {
	let t = vd.get(e);
	if (t) return t;
	let n = yd.get(e);
	if (n) return n;
	let r = _d.get(e);
	if (!r) return null;
	let i = (async () => {
		try {
			let t = r.kind === "buffer" ? r.buffer : await Ed(r.url), n = {
				family: e,
				font: gd.default.parse(t)
			};
			vd.set(e, n), Dd(e, t);
			for (let t of [...bd]) t(e);
			return n;
		} catch (t) {
			return console.error(`[desfoyo] khong nap duoc font "${e}"`, t), null;
		} finally {
			yd.delete(e);
		}
	})();
	return yd.set(e, i), i;
}
async function Ed(e) {
	let t = await fetch(e);
	if (!t.ok) throw Error(`HTTP ${t.status} khi tai ${e}`);
	return t.arrayBuffer();
}
function Dd(e, t) {
	typeof FontFace > "u" || typeof document > "u" || new FontFace(e, t).load().then((e) => document.fonts.add(e)).catch(() => {});
}
//#endregion
//#region src/text/bezier.ts
function Od(e, t, n, r, i) {
	let a = 1 - i;
	return a * a * a * e + 3 * a * a * i * t + 3 * a * i * i * n + i * i * i * r;
}
function kd(e, t, n, r, i) {
	let a = 1 - i;
	return 3 * (a * a * (t - e) + 2 * a * i * (n - t) + i * i * (r - n));
}
function Ad(e, t, n, r) {
	let i = -e + 3 * t - 3 * n + r, a = 2 * (e - 2 * t + n), o = t - e, s = [];
	if (Math.abs(i) < 1e-12) Math.abs(a) > 1e-12 && s.push(-o / a);
	else {
		let e = a * a - 4 * i * o;
		if (e >= 0) {
			let t = Math.sqrt(e);
			s.push((-a + t) / (2 * i), (-a - t) / (2 * i));
		}
	}
	return s.filter((e) => e > 0 && e < 1);
}
function jd(e, t, n, r, i) {
	let a = e + (t - e) * i, o = t + (n - t) * i, s = n + (r - n) * i, c = a + (o - a) * i, l = o + (s - o) * i, u = c + (l - c) * i;
	return {
		left: [
			e,
			a,
			c,
			u
		],
		right: [
			u,
			l,
			s,
			r
		]
	};
}
//#endregion
//#region src/text/circleWarp.ts
function Md(e, t, n, r, i, a, o) {
	let s = Array(e.length);
	for (let c = 0; c < e.length; c += 2) {
		let l = e[c] - r, u = e[c + 1] - i;
		s[c] = a + t * l - n * u, s[c + 1] = o + n * l + t * u;
	}
	return s;
}
function Nd(e, t, n, r) {
	let i = r.directionInverted ? -1 : 1;
	return e.map((e, a) => {
		let o = t[a], s = i * (Math.PI / 2 + o / r.r), c = s + Math.PI / 2 * i, l = Math.cos(c), u = Math.sin(c), d = r.cx + r.r * Math.cos(s), f = r.cy + r.r * Math.sin(s), p = (e) => Md(e, l, u, o, n, d, f);
		return {
			outer: p(e.outer),
			holes: e.holes.map(p)
		};
	});
}
//#endregion
//#region src/text/customWarp.ts
function Pd(e, t, n, r) {
	let i = [];
	return e.forEach((e, a) => {
		let o = t[a];
		if (o < 0 || o > r.L) return;
		let s = r.angle(o), c = Math.cos(s), l = Math.sin(s), u = r.X(o), d = r.Y(o), f = (e) => Md(e, c, l, o, n, u, d);
		i.push({
			outer: f(e.outer),
			holes: e.holes.map(f)
		});
	}), i;
}
//#endregion
//#region src/text/glyphOutlines.ts
var Fd = [
	.5 - Math.sqrt(.6) / 2,
	.5,
	.5 + Math.sqrt(.6) / 2
], Id = [
	5 / 18,
	4 / 9,
	5 / 18
];
function Ld(e) {
	let t = 0;
	for (let n = 0; n + 7 < e.length; n += 6) {
		let r = e[n], i = e[n + 1], a = e[n + 2], o = e[n + 3], s = e[n + 4], c = e[n + 5], l = e[n + 6], u = e[n + 7];
		for (let e = 0; e < 3; e++) {
			let n = Fd[e];
			t += Id[e] * (Od(r, a, s, l, n) * kd(i, o, c, u, n) - Od(i, o, c, u, n) * kd(r, a, s, l, n));
		}
	}
	return t / 2;
}
function Rd(e, t, n) {
	let r = Array(e.length);
	for (let i = 0; i < e.length; i += 2) r[i] = e[i] + t, r[i + 1] = e[i + 1] + n;
	return r;
}
function zd(e) {
	let t = [], n = [], r = 0, i = 0, a = 0, o = 0, s = (e, t, a, o, s, c) => {
		n.push(e, t, a, o, s, c), r = s, i = c;
	}, c = (e, t) => s(r + (e - r) / 3, i + (t - i) / 3, r + 2 * (e - r) / 3, i + 2 * (t - i) / 3, e, t), l = () => {
		n.length >= 8 && ((r !== a || i !== o) && c(a, o), t.push(n)), n = [];
	};
	for (let t of e) switch (t.type) {
		case "M":
			l(), n = [t.x, t.y], r = a = t.x, i = o = t.y;
			break;
		case "L":
			c(t.x, t.y);
			break;
		case "C":
			s(t.x1, t.y1, t.x2, t.y2, t.x, t.y);
			break;
		case "Q":
			s(r + 2 / 3 * (t.x1 - r), i + 2 / 3 * (t.y1 - i), t.x + 2 / 3 * (t.x1 - t.x), t.y + 2 / 3 * (t.y1 - t.y), t.x, t.y);
			break;
		case "Z":
			l();
			break;
	}
	return l(), t;
}
function Bd(e, t, n) {
	let r = !1, i = (e.length - 2) / 6;
	for (let a = 0; a < i; a++) {
		let o = a * 6, s = (a + i - 1) % i * 6, c = e[o], l = e[o + 1], u = e[s], d = e[s + 1];
		l > n != d > n && t < (u - c) * (n - l) / (d - l) + c && (r = !r);
	}
	return r;
}
function Vd(e) {
	if (e.length === 0) return [];
	let t = e.map(Ld), n = 0;
	for (let e = 1; e < t.length; e++) Math.abs(t[e]) > Math.abs(t[n]) && (n = e);
	let r = Math.sign(t[n]), i = [], a = [];
	e.forEach((e, n) => {
		Math.sign(t[n]) === r ? i.push({
			outer: e,
			holes: []
		}) : a.push(e);
	});
	for (let e of a) (i.find((t) => Bd(t.outer, e[0], e[1])) ?? i[0]).holes.push(e);
	return i;
}
function Hd(e, t, n) {
	let r = n / t.unitsPerEm, i = t.stringToGlyphs(e), a = i.map((e) => ({
		advance: (e.advanceWidth ?? 0) * r,
		shapes: Vd(zd(e.getPath(0, 0, n).commands))
	}));
	for (let e = 0; e < i.length - 1; e++) {
		let n = t.getKerningValue(i[e], i[e + 1]);
		n && (a[e].advance += n * r);
	}
	return a;
}
//#endregion
//#region src/text/layout.ts
function Ud(e) {
	let { text: t, font: n, fontSize: r, letterSpacing: i, lineHeight: a, align: o } = e, s = r / n.unitsPerEm, c = n.ascender * s, l = -n.descender * s, u = r * a, d = t.split("\n"), f = d.map((e) => {
		let t = Hd(e, n, r), a = t.reduce((e, t) => e + t.advance, 0);
		return {
			glyphs: t,
			width: a + Math.max(0, t.length - 1) * i,
			advanceWidth: a
		};
	}), p = f.reduce((e, t) => Math.max(e, t.width), 0), m = f.reduce((e, t) => Math.max(e, t.advanceWidth), 0), h = c + l + (d.length - 1) * u, g = [], _ = [];
	return f.forEach((e, t) => {
		let n = p - e.width, r = o === "center" ? n / 2 : o === "right" ? n : 0, a = c + t * u, s = r;
		for (let t of e.glyphs) {
			let e = t.shapes.map((e) => ({
				outer: Rd(e.outer, s, a),
				holes: e.holes.map((e) => Rd(e, s, a))
			})), n = Infinity, r = -Infinity;
			for (let t of e) for (let e = 0; e < t.outer.length; e += 2) t.outer[e] < n && (n = t.outer[e]), t.outer[e] > r && (r = t.outer[e]);
			let o = (n + r) / 2;
			for (let t of e) g.push(t), _.push(o);
			s += t.advance + i;
		}
	}), {
		shapes: g,
		shapePivotX: _,
		width: p,
		advanceWidth: m,
		height: h,
		baselineY: c,
		centerY: (c + l) / 2
	};
}
//#endregion
//#region src/text/warp.ts
var Wd = 1e-6;
function Gd(e, t) {
	let n = (e) => ({
		x: e.x * t.width,
		y: e.y * t.height
	}), r = [];
	for (let t = 0; t < e.anchors.length - 1; t++) {
		let i = e.anchors[t], a = e.anchors[t + 1], o = n(i), s = n(a);
		r.push({
			p0: o,
			c1: i.out ? n(i.out) : o,
			c2: a.in ? n(a.in) : s,
			p3: s
		});
	}
	return r;
}
function Kd(e, t) {
	let n = Infinity, r = -Infinity;
	for (let i of Gd(e, t)) {
		let e = [
			i.p0.y,
			i.c1.y,
			i.c2.y,
			i.p3.y
		], t = [
			e[0],
			e[3],
			...Ad(...e).map((t) => Od(...e, t))
		];
		for (let e of t) e < n && (n = e), e > r && (r = e);
	}
	return {
		lo: n,
		hi: r
	};
}
function qd(e, t) {
	return [
		{
			x: 0,
			y: t + e,
			out: {
				x: .2,
				y: t + e
			}
		},
		{
			x: .5,
			y: t,
			in: {
				x: .35,
				y: t + .15 * e
			},
			out: {
				x: .65,
				y: t - .15 * e
			}
		},
		{
			x: 1,
			y: t + .6 * e,
			in: {
				x: .75,
				y: t - .4 * e
			}
		}
	];
}
var Jd = Kd({
	role: "baseline",
	closed: !1,
	anchors: qd(1, 0)
}, {
	width: 1,
	height: 1
});
function Yd(e, t, n, r, i, a) {
	let o = t.hi - t.lo, s = (t.hi + t.lo) / 2, c = a > 0 ? n * i / a / o : 0;
	return {
		role: "baseline",
		closed: !1,
		anchors: e(c, r - s * c)
	};
}
function Xd(e, t, n, r) {
	return Yd(qd, Jd, e, t, n, r);
}
function Zd(e, t) {
	return [
		{
			x: 0,
			y: t + e,
			out: {
				x: .2,
				y: t + .7 * e
			}
		},
		{
			x: .5,
			y: t + .65 * e,
			in: {
				x: .33,
				y: t + .65 * e
			},
			out: {
				x: .67,
				y: t + .65 * e
			}
		},
		{
			x: 1,
			y: t + e,
			in: {
				x: .8,
				y: t + .7 * e
			}
		}
	];
}
var Qd = Kd({
	role: "baseline",
	closed: !1,
	anchors: Zd(1, 0)
}, {
	width: 1,
	height: 1
});
function $d(e, t, n, r) {
	return Yd(Zd, Qd, e, t, n, r);
}
function ef(e, t) {
	return [
		{
			x: 0,
			y: t + e,
			out: {
				x: .25,
				y: t + .95 * e
			}
		},
		{
			x: .6,
			y: t + .6 * e,
			in: {
				x: .4,
				y: t + .75 * e
			},
			out: {
				x: .75,
				y: t + .5 * e
			}
		},
		{
			x: 1,
			y: t + .5 * e,
			in: {
				x: .8,
				y: t + .45 * e
			}
		}
	];
}
var tf = Kd({
	role: "baseline",
	closed: !1,
	anchors: ef(1, 0)
}, {
	width: 1,
	height: 1
});
function nf(e, t, n, r) {
	return Yd(ef, tf, e, t, n, r);
}
function rf(e, t) {
	return [
		{
			x: 0,
			y: t + .85 * e,
			out: {
				x: .2,
				y: t + e
			}
		},
		{
			x: .5,
			y: t + .85 * e,
			in: {
				x: .35,
				y: t + e
			},
			out: {
				x: .65,
				y: t + .7 * e
			}
		},
		{
			x: 1,
			y: t + .85 * e,
			in: {
				x: .8,
				y: t + .7 * e
			}
		}
	];
}
var af = Kd({
	role: "baseline",
	closed: !1,
	anchors: rf(1, 0)
}, {
	width: 1,
	height: 1
});
function of(e, t, n, r) {
	return Yd(rf, af, e, t, n, r);
}
function sf(e, t) {
	return [{
		x: 0,
		y: t + e
	}, {
		x: 1,
		y: t + .4 * e
	}];
}
var cf = Kd({
	role: "baseline",
	closed: !1,
	anchors: sf(1, 0)
}, {
	width: 1,
	height: 1
});
function lf(e, t, n, r) {
	return Yd(sf, cf, e, t, n, r);
}
function uf(e, t, n) {
	if (n <= 0 || e.anchors.length < 2) return 0;
	let { lo: r, hi: i } = Kd(e, {
		width: 1,
		height: 1
	}), a = (i - r) * t / n, o = (r + i) / 2, s = e.anchors[0].y >= o ? a : -a;
	return Math.min(4, Math.max(-1, s));
}
function df(e) {
	let t = e.anchors.map((e) => ({ ...e })), n = t.length - 1;
	if (n < 1) return e;
	for (let e = 1; e <= n; e++) t[e].x = Math.max(t[e].x, t[e - 1].x);
	for (let e = n - 1; e >= 1; e--) t[e].x = Math.min(t[e].x, t[e + 1].x);
	for (let e = 0; e < n; e++) {
		let n = t[e].x, r = t[e + 1].x, i = (e) => Math.min(Math.max(e, n), r), a = t[e].out;
		a && (t[e].out = {
			...a,
			x: i(a.x)
		});
		let o = t[e + 1].in;
		o && (t[e + 1].in = {
			...o,
			x: i(o.x)
		});
	}
	return {
		...e,
		anchors: t
	};
}
function ff(e, t, n, r, i, a) {
	let o = i - n, s = a - r, c = Math.hypot(o, s);
	return c < Wd ? Math.hypot(e - n, t - r) : Math.abs((e - n) * s - (t - r) * o) / c;
}
function pf(e, t, n, r, i, a) {
	let o = !0;
	if (a < Pf) for (let e = 1; e < 4 && o; e++) {
		let t = e / 4;
		ff(Od(r[0], r[1], r[2], r[3], t), Od(i[0], i[1], i[2], i[3], t), r[0], i[0], r[3], i[3]) > Nf && (o = !1);
	}
	if (o) {
		let a = e[e.length - 1], o = t[t.length - 1], s = Math.hypot(r[3] - a, i[3] - o);
		if (s < Wd) return;
		e.push(r[3]), t.push(i[3]), n.push(n[n.length - 1] + s);
		return;
	}
	let s = jd(r[0], r[1], r[2], r[3], .5), c = jd(i[0], i[1], i[2], i[3], .5);
	pf(e, t, n, s.left, c.left, a + 1), pf(e, t, n, s.right, c.right, a + 1);
}
function mf(e, t, n) {
	let r = (e) => Math.abs(e.y * t.height - n) <= Wd;
	return e.anchors.every((e) => r(e) && (!e.in || r(e.in)) && (!e.out || r(e.out)));
}
function hf(e, t) {
	let n = [], r = [], i = [];
	Gd(e, t).forEach((e, t) => {
		t === 0 && (n.push(e.p0.x), r.push(e.p0.y), i.push(0)), pf(n, r, i, [
			e.p0.x,
			e.c1.x,
			e.c2.x,
			e.p3.x
		], [
			e.p0.y,
			e.c1.y,
			e.c2.y,
			e.p3.y
		], 0);
	});
	let a = i[i.length - 1];
	return a > Wd ? {
		xs: n,
		ys: r,
		us: i,
		L: a
	} : null;
}
function gf(e, t) {
	let n = Math.min(Math.max(t, 0), e.L);
	if (n <= 0) return {
		x: e.xs[0],
		y: e.ys[0],
		low: 0,
		high: Math.min(1, e.xs.length - 1)
	};
	if (n >= e.L) {
		let t = e.xs.length - 1;
		return {
			x: e.xs[t],
			y: e.ys[t],
			low: Math.max(0, t - 1),
			high: t
		};
	}
	let r = 0, i = e.us.length - 1;
	for (; i - r > 1;) {
		let t = r + i >> 1;
		e.us[t] <= n ? r = t : i = t;
	}
	let a = e.us[i] - e.us[r], o = a < Wd ? 0 : (n - e.us[r]) / a;
	return {
		x: e.xs[r] + (e.xs[i] - e.xs[r]) * o,
		y: e.ys[r] + (e.ys[i] - e.ys[r]) * o,
		low: r,
		high: i
	};
}
function _f(e, t, n) {
	if (t.width <= 0 || t.height <= 0 || e.anchors.length < 2 || mf(e, t, n)) return null;
	let r = hf(e, t);
	return r ? {
		L: r.L,
		X: (e) => gf(r, e).x,
		Y: (e) => gf(r, e).y,
		angle: (e) => {
			let { low: t, high: n } = gf(r, e);
			return Math.atan2(r.ys[n] - r.ys[t], r.xs[n] - r.xs[t]);
		}
	} : null;
}
function vf(e, t, n) {
	if (t.width <= 0 || t.height <= 0 || e.anchors.length < 2 || mf(e, t, n)) return null;
	let r = hf(e, t);
	return r ? {
		L: r.L,
		X: (e) => gf(r, e).x,
		D: (e) => gf(r, e).y - n
	} : null;
}
var yf = .05;
function bf(e, t, n, r, i, a, o) {
	for (let s = 1; s < 4; s++) e.push(r + i * t[s], n[s] + a + o * t[s]);
}
function xf(e, t, n, r, i) {
	let a = Math.min(t[0], t[3]), o = Math.max(t[0], t[3]);
	for (let e of Ad(t[0], t[1], t[2], t[3])) {
		let n = Od(t[0], t[1], t[2], t[3], e);
		n < a && (a = n), n > o && (o = n);
	}
	let s = t[3] - t[0], c, l, u, d;
	if (Math.abs(s) < Ff ? (c = 0, l = r.X(t[0]), u = 0, d = r.D(t[0])) : (c = (r.X(t[3]) - r.X(t[0])) / s, l = r.X(t[0]) - c * t[0], u = (r.D(t[3]) - r.D(t[0])) / s, d = r.D(t[0]) - u * t[0]), i < Pf) {
		let s = 0;
		for (let e = 0; e <= 4; e++) {
			let t = a + (o - a) * e / 4, n = Math.abs(r.X(t) - (l + c * t)), i = Math.abs(r.D(t) - (d + u * t));
			n > s && (s = n), i > s && (s = i);
		}
		if (s > yf) {
			let a = jd(t[0], t[1], t[2], t[3], .5), o = jd(n[0], n[1], n[2], n[3], .5);
			xf(e, a.left, o.left, r, i + 1), xf(e, a.right, o.right, r, i + 1);
			return;
		}
	}
	bf(e, t, n, l, c, d, u);
}
var Sf = 1e-9;
function Cf(e, t, n) {
	if (t <= 0 && n >= 1) return e;
	let r = t > 0 ? jd(e[0], e[1], e[2], e[3], t).right : e;
	if (n >= 1) return r;
	let i = (n - t) / (1 - t);
	return jd(r[0], r[1], r[2], r[3], i).left;
}
function wf(e, t) {
	let n = [
		0,
		...Ad(e[0], e[1], e[2], e[3]),
		1
	].sort((e, t) => e - t), r = [];
	for (let i = 0; i < n.length - 1; i++) {
		let a = n[i], o = n[i + 1];
		if (o - a < Sf) continue;
		let s = Od(e[0], e[1], e[2], e[3], a) - t;
		if (Math.abs(s) < Wd) {
			r.push(a);
			continue;
		}
		let c = Od(e[0], e[1], e[2], e[3], o) - t;
		if (s < 0 == c < 0) continue;
		let l = a, u = o, d = s;
		for (let n = 0; n < 50; n++) {
			let n = (l + u) / 2, r = Od(e[0], e[1], e[2], e[3], n) - t;
			r < 0 == d < 0 ? (l = n, d = r) : u = n;
		}
		r.push((l + u) / 2);
	}
	return r;
}
function Tf(e) {
	let t = e[0], n = e[1], r = e[e.length - 2], i = e[e.length - 1];
	Math.abs(r - t) < Wd && Math.abs(i - n) < Wd || e.push(r + (t - r) / 3, i + (n - i) / 3, r + 2 * (t - r) / 3, i + 2 * (n - i) / 3, t, n);
}
function Ef(e, t) {
	let n = (e.length - 2) / 6;
	if (n === 0) return [];
	let r = Infinity, i = -Infinity;
	for (let t = 0; t < e.length; t += 2) e[t] < r && (r = e[t]), e[t] > i && (i = e[t]);
	if (i <= t + Wd) return [e];
	if (r > t + Wd) return [];
	let a = [];
	for (let r = 0; r < n; r++) {
		let n = r * 6, i = [
			e[n],
			e[n + 2],
			e[n + 4],
			e[n + 6]
		], o = [
			e[n + 1],
			e[n + 3],
			e[n + 5],
			e[n + 7]
		], s = [
			0,
			...wf(i, t),
			1
		];
		for (let e = 0; e < s.length - 1; e++) {
			let n = s[e], r = s[e + 1];
			if (r - n < Sf) continue;
			let c = (n + r) / 2, l = Od(i[0], i[1], i[2], i[3], c) <= t;
			a.push({
				bx: Cf(i, n, r),
				by: Cf(o, n, r),
				inside: l
			});
		}
	}
	let o = a.findIndex((e) => !e.inside);
	if (o === -1) return [e];
	let s = [...a.slice(o + 1), ...a.slice(0, o + 1)], c = [], l = null;
	for (let e of s) {
		if (!e.inside) {
			l &&= (Tf(l), c.push(l), null);
			continue;
		}
		l ||= [e.bx[0], e.by[0]], l.push(e.bx[1], e.by[1], e.bx[2], e.by[2], e.bx[3], e.by[3]);
	}
	return l && (Tf(l), c.push(l)), c;
}
function Df(e, t) {
	let n = [t.X(e[0]), e[1] + t.D(e[0])];
	for (let r = 0; r + 7 < e.length; r += 6) xf(n, [
		e[r],
		e[r + 2],
		e[r + 4],
		e[r + 6]
	], [
		e[r + 1],
		e[r + 3],
		e[r + 5],
		e[r + 7]
	], t, 0);
	return n;
}
function Of(e, t) {
	return {
		role: e,
		closed: !1,
		anchors: [
			{
				x: 0,
				y: t
			},
			{
				x: .5,
				y: t,
				in: {
					x: .25,
					y: t
				},
				out: {
					x: .75,
					y: t
				}
			},
			{
				x: 1,
				y: t
			}
		]
	};
}
function kf(e, t, n) {
	let { top: r, bottom: i, topFlatY: a, bottomFlatY: o, advanceWidth: s } = n, c = s > 0 ? e / s : 0, l = r ? {
		x: r.X(c * r.L),
		y: r.Y(c * r.L)
	} : {
		x: e,
		y: a
	}, u = i ? {
		x: i.X(c * i.L),
		y: i.Y(c * i.L)
	} : {
		x: e,
		y: o
	}, d = o - a, f = d === 0 ? 0 : (t - a) / d;
	return {
		x: l.x + (u.x - l.x) * f,
		y: l.y + (u.y - l.y) * f
	};
}
function Af(e, t) {
	let n = [];
	for (let r = 0; r < e.length; r += 2) {
		let i = kf(e[r], e[r + 1], t);
		n.push(i.x, i.y);
	}
	return n;
}
function jf(e, t) {
	return e.map((e) => ({
		outer: Af(e.outer, t),
		holes: e.holes.map((e) => Af(e, t))
	}));
}
function Mf(e, t) {
	let n = [];
	for (let r of e) {
		let e = Ef(r.outer, t.L);
		if (e.length === 0) continue;
		let i = r.holes.flatMap((e) => Ef(e, t.L));
		if (e.length === 1) {
			n.push({
				outer: Df(e[0], t),
				holes: i.map((e) => Df(e, t))
			});
			continue;
		}
		for (let r of e) {
			let e = i.filter((e) => Bd(r, e[0], e[1]));
			n.push({
				outer: Df(r, t),
				holes: e.map((e) => Df(e, t))
			});
		}
	}
	return n;
}
var Nf = .01, Pf = 9, Ff = 1e-6, If = .5;
function Lf(e) {
	let t = Infinity, n = Infinity, r = -Infinity, i = -Infinity;
	for (let a of e) {
		let e = a.outer;
		for (let a = 0; a + 7 < e.length; a += 6) {
			let o = [e[a], e[a + 6]], s = [e[a + 1], e[a + 7]];
			for (let t of Ad(e[a], e[a + 2], e[a + 4], e[a + 6])) o.push(Od(e[a], e[a + 2], e[a + 4], e[a + 6], t));
			for (let t of Ad(e[a + 1], e[a + 3], e[a + 5], e[a + 7])) s.push(Od(e[a + 1], e[a + 3], e[a + 5], e[a + 7], t));
			for (let e of o) e < t && (t = e), e > r && (r = e);
			for (let e of s) e < n && (n = e), e > i && (i = e);
		}
	}
	return Number.isFinite(t) ? {
		minX: t,
		minY: n,
		maxX: r,
		maxY: i
	} : {
		minX: 0,
		minY: 0,
		maxX: 0,
		maxY: 0
	};
}
function Rf(e, t, n, r) {
	let i = e.warp;
	if (!i || i.type === "none") return null;
	let a = i.paths?.find((e) => e.role === "baseline");
	if (a) return a.anchors.length >= 2 ? df(a) : null;
	let o = e.font.size;
	if (i.type === "custom") {
		let e = r - (n > 0 ? If * o / n : 0);
		return df({
			role: "baseline",
			closed: !1,
			anchors: [
				{
					x: 0,
					y: r,
					out: {
						x: .25,
						y: r
					}
				},
				{
					x: .5,
					y: e,
					in: {
						x: .35,
						y: e
					},
					out: {
						x: .65,
						y: e
					}
				},
				{
					x: 1,
					y: r,
					in: {
						x: .75,
						y: r
					}
				}
			]
		});
	}
	let { curveHeight: s } = i;
	return i.type === "wave" ? df(Xd(s, t, o, n)) : i.type === "arch" ? df($d(s, t, o, n)) : i.type === "rise" ? df(nf(s, t, o, n)) : i.type === "flag" ? df(of(s, t, o, n)) : i.type === "angle" ? df(lf(s, t, o, n)) : null;
}
function zf(e, t) {
	let n = e.warp;
	if (!n || n.type !== "circle" || e.text.includes("\n")) return null;
	if (n.circle) return n.circle;
	let r = e.font.size;
	return r <= 0 ? null : {
		centerX: .5 * t.advanceWidth / r,
		centerY: .5 * t.height / r,
		radius: t.advanceWidth / Math.PI / r
	};
}
function Bf(e, t, n) {
	let r = e.warp;
	if (!r || r.type !== "distort") return null;
	let i = r.paths?.find((e) => e.role === "top"), a = r.paths?.find((e) => e.role === "bottom");
	return i && a ? {
		top: df(i),
		bottom: df(a)
	} : t.height <= 0 ? null : {
		top: Of("top", n.minY / t.height),
		bottom: Of("bottom", n.maxY / t.height)
	};
}
function Vf(e, t) {
	let n = Ud({
		text: e.text,
		font: t,
		fontSize: e.font.size,
		letterSpacing: e.letterSpacing,
		lineHeight: e.lineHeight,
		align: e.align
	}), r = Lf(n.shapes), i = zf(e, n), a, o;
	if (i) a = Nd(n.shapes, n.shapePivotX, n.baselineY, {
		cx: i.centerX * e.font.size,
		cy: i.centerY * e.font.size,
		r: i.radius * e.font.size,
		directionInverted: e.warp?.directionInverted ?? !1
	}), o = !0;
	else if (e.warp?.type === "distort") {
		let t = Uf(e, n, r);
		a = t.shapes, o = t.warped;
	} else if (e.warp?.type === "custom") {
		let t = Wf(e, n);
		a = t.shapes, o = t.warped;
	} else {
		let t = Hf(e, n);
		a = t.shapes, o = t.warped;
	}
	let s = o ? n.advanceWidth : n.width;
	return {
		...n,
		shapes: a,
		pivotWidth: s,
		bounds: Lf(a),
		flatBounds: r
	};
}
function Hf(e, t) {
	let n = t.height > 0 ? Rf(e, t.baselineY / t.height, t.height, t.centerY / t.height) : null, r = n ? vf(n, {
		width: t.advanceWidth,
		height: t.height
	}, t.baselineY) : null;
	return r ? {
		shapes: Mf(t.shapes, r),
		warped: !0
	} : {
		shapes: t.shapes,
		warped: !1
	};
}
function Uf(e, t, n) {
	let r = Bf(e, t, n);
	if (!r) return {
		shapes: t.shapes,
		warped: !1
	};
	let i = {
		width: t.advanceWidth,
		height: t.height
	}, a = {
		top: _f(r.top, i, n.minY),
		bottom: _f(r.bottom, i, n.maxY),
		topFlatY: n.minY,
		bottomFlatY: n.maxY,
		advanceWidth: t.advanceWidth
	};
	return {
		shapes: jf(t.shapes, a),
		warped: !0
	};
}
function Wf(e, t) {
	let n = t.height > 0 ? Rf(e, t.baselineY / t.height, t.height, t.centerY / t.height) : null, r = n ? _f(n, {
		width: t.advanceWidth,
		height: t.height
	}, t.centerY) : null;
	return r ? {
		shapes: Pd(t.shapes, t.shapePivotX, t.centerY, r),
		warped: !0
	} : {
		shapes: t.shapes,
		warped: !1
	};
}
function Gf(e, t) {
	let { pivotWidth: n, height: r } = Vf(e, t);
	return {
		width: Math.max(n, e.font.size * .5),
		height: r
	};
}
//#endregion
//#region src/text/textShadow.ts
function Kf(e) {
	return e?.find((e) => e.type === "text-shadow");
}
function qf(e, t, n) {
	return e.map((e) => ({
		outer: Rd(e.outer, t, n),
		holes: e.holes.map((e) => Rd(e, t, n))
	}));
}
function Jf(e, t, n) {
	if (t.style === "drop") return [];
	let r = t.distance * n, i = Math.cos(t.angle), a = Math.sin(t.angle);
	return t.style === "block" || t.style === "line" ? [{
		shapes: qf(e, i * r, a * r),
		mode: t.style === "line" ? "stroke" : "fill"
	}] : r === 0 ? [] : [{
		shapes: qf(e, i * r, a * r),
		mode: "fill"
	}, {
		shapes: Yf(e, i * r, a * r),
		mode: "fill"
	}];
}
function Yf(e, t, n) {
	let r = [], i = (e) => {
		let i = (e.length - 2) / 6;
		for (let a = 0; a < i; a++) {
			let i = a * 6, o = [
				e[i],
				e[i + 2],
				e[i + 4],
				e[i + 6]
			], s = [
				e[i + 1],
				e[i + 3],
				e[i + 5],
				e[i + 7]
			];
			for (let [e, i] of Zf(o, s, t, n)) {
				let a = (e[3] - e[0]) * n - (i[3] - i[0]) * t;
				Math.abs(a) < 1e-9 || r.push({
					outer: Xf(e, i, t, n),
					holes: []
				});
			}
		}
	};
	for (let t of e) {
		i(t.outer);
		for (let e of t.holes) i(e);
	}
	return r;
}
function Xf(e, t, n, r) {
	let i = (e[3] - e[0]) * r - (t[3] - t[0]) * n, [a, o, s, c] = e, [l, u, d, f] = t;
	return i >= 0 ? [
		a,
		l,
		o,
		u,
		s,
		d,
		c,
		f,
		c,
		f,
		c + n,
		f + r,
		c + n,
		f + r,
		s + n,
		d + r,
		o + n,
		u + r,
		a + n,
		l + r,
		a + n,
		l + r,
		a,
		l,
		a,
		l
	] : [
		a + n,
		l + r,
		o + n,
		u + r,
		s + n,
		d + r,
		c + n,
		f + r,
		c + n,
		f + r,
		c,
		f,
		c,
		f,
		s,
		d,
		o,
		u,
		a,
		l,
		a,
		l,
		a + n,
		l + r,
		a + n,
		l + r
	];
}
function Zf(e, t, n, r) {
	let i = [
		e[0] * r - t[0] * n,
		e[1] * r - t[1] * n,
		e[2] * r - t[2] * n,
		e[3] * r - t[3] * n
	], a = Ad(i[0], i[1], i[2], i[3]).sort((e, t) => e - t);
	if (a.length === 0) return [[e, t]];
	let o = [], s = e, c = t, l = 0;
	for (let e of a) {
		let t = (e - l) / (1 - l), n = jd(s[0], s[1], s[2], s[3], t), r = jd(c[0], c[1], c[2], c[3], t);
		o.push([n.left, r.left]), s = n.right, c = r.right, l = e;
	}
	return o.push([s, c]), o;
}
//#endregion
//#region src/render/renderers/textRenderer.ts
function Qf(e, t) {
	e.moveTo(t[0], t[1]);
	for (let n = 2; n + 5 < t.length; n += 6) e.bezierCurveTo(t[n], t[n + 1], t[n + 2], t[n + 3], t[n + 4], t[n + 5]);
	e.closePath();
}
function $f(e, t, n) {
	let r = Pu(n);
	for (let n of t) {
		Qf(e, n.outer), e.fill(r);
		for (let t of n.holes) Qf(e, t), e.cut();
	}
}
function ep(e, t, n, r) {
	for (let i of t) for (let t of i.shapes) {
		Qf(e, t.outer), i.mode === "stroke" ? e.stroke({
			width: r ?? 2,
			color: n
		}) : e.fill(n);
		for (let a of t.holes) Qf(e, a), i.mode === "stroke" ? e.stroke({
			width: r ?? 2,
			color: n
		}) : e.cut();
	}
}
function tp(e, t) {
	e.clear();
	let n = Cd(t.font.family);
	if (!n) {
		e.hitArea = null, Td(t.font.family);
		return;
	}
	let r = Vf(t, n.font), i = Kf(t.effects);
	i && ep(e, Jf(r.shapes, i, t.font.size), i.color, i.thickness), $f(e, r.shapes, t.fill);
	let { minX: a, minY: o, maxX: s, maxY: c } = r.bounds;
	e.hitArea = new b(a, o, s - a, c - o);
}
var np = {
	create(e) {
		let t = new v();
		return t.offFontLoaded = wd((e) => {
			!t.destroyed && t.textNode && e === t.textNode.font.family && tp(t, t.textNode);
		}), t.once("destroyed", () => t.offFontLoaded?.()), this.update(t, e), t;
	},
	update(e, t) {
		let n = e;
		n.textNode = t, tp(n, t), Yl(e, t);
	}
};
//#endregion
//#region src/render/SceneReconciler.ts
function rp(e, t) {
	switch (e.type) {
		case "shape": return zu.create(e);
		case "image": return cd.create(e, t);
		case "svg": return md.create(e, t);
		case "text": return np.create(e);
		case "group": return hd.create(e);
	}
}
function ip(e, t, n) {
	switch (t.type) {
		case "shape":
			zu.update(e, t);
			break;
		case "image":
			cd.update(e, t, n);
			break;
		case "svg":
			md.update(e, t, n);
			break;
		case "text":
			np.update(e, t);
			break;
		case "group":
			hd.update(e, t);
			break;
	}
}
function ap(e, t) {
	return e.pages.find((e) => e.id === t);
}
var op = class {
	displayObjects = /* @__PURE__ */ new Map();
	layer;
	onNodeMounted;
	constructor(e, t) {
		this.layer = e, this.onNodeMounted = t;
	}
	mount(e, t) {
		this.mountChildren(e.children, this.layer, t);
	}
	mountChildren(e, t, n) {
		for (let r of e) {
			let e = rp(r, n);
			e.label = r.id, this.displayObjects.set(r.id, e), t.addChild(e), this.onNodeMounted?.(e, r), r.type === "group" && this.mountChildren(r.children, e, n);
		}
	}
	rebuildFromPage(e, t) {
		for (let e of this.displayObjects.values()) e.destroy();
		this.displayObjects.clear(), this.layer.removeChildren(), this.mountChildren(e.children, this.layer, t);
	}
	destroySubtree(e) {
		for (let t of [...e.children]) this.destroySubtree(t);
		e.label && this.displayObjects.delete(e.label), e.destroy();
	}
	apply(e, t) {
		if (Jc(e)) return;
		let n = ap(t, e.pageId);
		if (n) switch (e.type) {
			case "AddNode": {
				let r = Xc(n.children, e.node.id);
				if (!r) return;
				let i = e.parentId ? this.displayObjects.get(e.parentId) : this.layer;
				if (!i) return;
				let a = rp(r.node, t);
				a.label = r.node.id, this.displayObjects.set(r.node.id, a), i.addChildAt(a, r.index), this.onNodeMounted?.(a, r.node), r.node.type === "group" && this.mountChildren(r.node.children, a, t);
				break;
			}
			case "RemoveNode": {
				let t = this.displayObjects.get(e.nodeId);
				if (!t) return;
				t.parent?.removeChild(t), this.destroySubtree(t);
				break;
			}
			case "UpdateProps":
			case "UpdateTransform": {
				let r = this.displayObjects.get(e.nodeId), i = Xc(n.children, e.nodeId);
				if (!r || !i) return;
				ip(r, i.node, t);
				break;
			}
			case "Reorder": {
				let t = this.displayObjects.get(e.nodeId), r = Xc(n.children, e.nodeId);
				if (!t || !r || !t.parent) return;
				t.parent.setChildIndex(t, r.index);
				break;
			}
			case "GroupNodes":
			case "UngroupNode":
				this.rebuildFromPage(n, t);
				break;
		}
	}
	getDisplayObject(e) {
		return this.displayObjects.get(e);
	}
	destroy() {
		for (let e of this.displayObjects.values()) e.destroy();
		this.displayObjects.clear();
	}
};
//#endregion
//#region src/render/interactions/snapping.ts
function sp(e) {
	return [
		e.min.x,
		e.pivot.x,
		e.max.x
	];
}
function cp(e) {
	return [
		e.min.y,
		e.pivot.y,
		e.max.y
	];
}
function lp(e, t, n) {
	let r = t.flatMap(sp), i = t.flatMap(cp), a = (e, t) => {
		let r = null;
		for (let i of e) for (let e of t) {
			let t = Math.abs(e - i);
			t <= n && (!r || t < r.dist) && (r = {
				offset: e - i,
				guide: e,
				dist: t
			});
		}
		return r ? {
			offset: r.offset,
			guide: r.guide
		} : null;
	}, o = [], s = a(sp(e), r), c = a(cp(e), i);
	return s && o.push({
		axis: "x",
		value: s.guide
	}), c && o.push({
		axis: "y",
		value: c.guide
	}), {
		delta: {
			x: s?.offset ?? 0,
			y: c?.offset ?? 0
		},
		guides: o
	};
}
//#endregion
//#region src/render/interactions/drag.ts
var up = 6;
function dp(e, t, n, r, i) {
	e.eventMode = "static", e.cursor = t.locked ? "default" : "move", e.on("pointerdown", (e) => {
		e.stopPropagation();
		let a = n.getState().selectedNodeIds;
		if (e.shiftKey ? n.getState().select(t.id, "toggle") : a.has(t.id) || n.getState().select(t.id, "replace"), t.locked) return;
		let o = n.getState(), s = o.activePageId, c = Su(o), l = Array.from(n.getState().selectedNodeIds), u = c ? l.map((e) => Xc(c.children, e)?.node).filter((e) => !!e) : [];
		u.length === 0 && u.push(t);
		let d = e.getLocalPosition(i), f = new Set(u.map((e) => e.id)), p = (c?.children ?? []).filter((e) => !f.has(e.id)).map((e) => su(e));
		c && p.push({
			min: {
				x: 0,
				y: 0
			},
			max: {
				x: c.size.width,
				y: c.size.height
			},
			pivot: {
				x: c.size.width / 2,
				y: c.size.height / 2
			}
		}), n.getState().beginGesture(`drag:${t.id}`);
		let m = (e) => {
			let t = e.getLocalPosition(i), r = {
				x: t.x - d.x,
				y: t.y - d.y
			}, a = ou(u);
			a.min.x += r.x, a.max.x += r.x, a.pivot.x += r.x, a.min.y += r.y, a.max.y += r.y, a.pivot.y += r.y;
			let o = up / n.getState().camera.zoom, { delta: c, guides: l } = lp(a, p, o), f = {
				x: r.x + c.x,
				y: r.y + c.y
			}, m = n.getState().grid;
			m.enabled && m.snap && (c.x === 0 && (f.x += Math.round(a.min.x / m.size) * m.size - a.min.x), c.y === 0 && (f.y += Math.round(a.min.y / m.size) * m.size - a.min.y)), n.getState().setActiveGuides(l);
			for (let e of lu(u, f)) n.getState().dispatch({
				type: "UpdateTransform",
				pageId: s,
				nodeId: e.nodeId,
				patch: e.transform
			});
		}, h = () => {
			r.off("pointermove", m), r.off("pointerup", h), r.off("pointerupoutside", h), n.getState().setActiveGuides([]), n.getState().endGesture();
		};
		r.on("pointermove", m), r.on("pointerup", h), r.on("pointerupoutside", h);
	});
}
//#endregion
//#region src/render/interactions/viewportControls.ts
function fp(e) {
	return Math.min(8, Math.max(fu, e));
}
function pp(e, t) {
	let n = (n) => {
		if (t.getState().viewScale != null) return;
		n.preventDefault();
		let { camera: r } = t.getState(), i = e.getBoundingClientRect(), a = {
			x: n.clientX - i.left,
			y: n.clientY - i.top
		}, o = fp(r.zoom * Math.exp(-n.deltaY * .001));
		if (o === r.zoom) return;
		let s = o / r.zoom, c = a.x - (a.x - r.panX) * s, l = a.y - (a.y - r.panY) * s;
		t.getState().setCamera({
			zoom: o,
			panX: c,
			panY: l
		});
	};
	return e.addEventListener("wheel", n, { passive: !1 }), () => e.removeEventListener("wheel", n);
}
function mp(e, t) {
	let n = !1, r = !1, i = {
		x: 0,
		y: 0
	}, a = () => {
		e.style.cursor = n || r ? "grab" : "";
	}, o = (e) => {
		e.code === "Space" && (n = !0, a());
	}, s = (e) => {
		e.code === "Space" && (n = !1, a());
	}, c = (e) => {
		e.button !== 1 && !(e.button === 0 && n) || (t.getState().viewScale ?? (e.preventDefault(), r = !0, i = {
			x: e.clientX,
			y: e.clientY
		}, a(), window.addEventListener("pointermove", l), window.addEventListener("pointerup", u)));
	}, l = (e) => {
		let n = {
			x: e.clientX - i.x,
			y: e.clientY - i.y
		};
		i = {
			x: e.clientX,
			y: e.clientY
		};
		let { camera: r } = t.getState();
		t.getState().setCamera({
			panX: r.panX + n.x,
			panY: r.panY + n.y
		});
	}, u = () => {
		r = !1, a(), window.removeEventListener("pointermove", l), window.removeEventListener("pointerup", u);
	};
	return window.addEventListener("keydown", o), window.addEventListener("keyup", s), e.addEventListener("pointerdown", c), () => {
		window.removeEventListener("keydown", o), window.removeEventListener("keyup", s), e.removeEventListener("pointerdown", c), window.removeEventListener("pointermove", l), window.removeEventListener("pointerup", u);
	};
}
function hp(e, t, n) {
	let r = fp(Math.min(t.width / n.width, t.height / n.height) * .9), i = (t.width - n.width * r) / 2, a = (t.height - n.height * r) / 2;
	e.getState().setCamera({
		zoom: r,
		panX: i,
		panY: a
	});
}
//#endregion
//#region src/render/interactions/marquee.ts
function gp(e, t) {
	return {
		x: Math.min(e.x, t.x),
		y: Math.min(e.y, t.y),
		width: Math.abs(t.x - e.x),
		height: Math.abs(t.y - e.y)
	};
}
function _p(e, t) {
	return e.x <= t.max.x && e.x + e.width >= t.min.x && e.y <= t.max.y && e.y + e.height >= t.min.y;
}
function vp(e, t, n) {
	e.on("pointerdown", (r) => {
		if (r.target !== e) return;
		let i = r.getLocalPosition(t);
		r.shiftKey || n.getState().select(null);
		let a = (e) => {
			let r = e.getLocalPosition(t);
			n.getState().setMarqueeRect(gp(i, r));
		}, o = () => {
			e.off("pointermove", a), e.off("pointerup", o), e.off("pointerupoutside", o);
			let t = n.getState().marqueeRect;
			if (n.getState().setMarqueeRect(null), !t) return;
			let r = Su(n.getState());
			if (r) for (let e of r.children) _p(t, su(e)) && n.getState().select(e.id, "toggle");
		};
		e.on("pointermove", a), e.on("pointerup", o), e.on("pointerupoutside", o);
	});
}
//#endregion
//#region src/render/backgroundColor.ts
function yp(e) {
	return e.type === "color" && e.value === "transparent" ? 0 : e.type === "color" ? e.value : Nu(e.value);
}
function bp(e) {
	return e.type === "color" && e.value === "transparent" ? 0 : 1;
}
//#endregion
//#region src/ui/CanvasHost.tsx
function xp(e, t, n) {
	if (e.clear(), !(!n.enabled || n.size <= 0)) {
		for (let r = 0; r <= t.width; r += n.size) e.moveTo(r, 0).lineTo(r, t.height);
		for (let r = 0; r <= t.height; r += n.size) e.moveTo(0, r).lineTo(t.width, r);
		e.stroke({
			width: 1,
			color: "#000000",
			alpha: .08
		});
	}
}
function Sp({ onReady: e, reconcilerRef: t }) {
	let n = s(null), r = Eu();
	return a(() => {
		let i = !1, a = new l(), o = new f(), s = null, c = null, u = null, d = null, p = null, m = null, h = 0, g = [];
		return (async () => {
			let l = r.getState(), f = Su(l) ?? l.document.pages[0], _ = (e) => {
				let t = r.getState().viewScale ?? 1;
				return {
					width: e.width * t,
					height: e.height * t
				};
			}, y = _(f.size);
			if (await a.init({
				width: y.width,
				height: y.height,
				background: yp(f.background),
				backgroundAlpha: 0,
				antialias: !0,
				resolution: window.devicePixelRatio || 1,
				autoDensity: !0
			}), i) {
				a.destroy(!0);
				return;
			}
			n.current?.appendChild(a.canvas), a.ticker.stop();
			let b = () => {
				h ||= requestAnimationFrame(() => {
					h = 0, a.render();
				});
			};
			g = [
				r.subscribe(b),
				Wu(b),
				wd(b)
			], a.stage.addChild(o), a.stage.eventMode = "static", a.stage.hitArea = a.screen;
			let ee = () => {
				let { camera: e } = r.getState();
				o.scale.set(e.zoom), o.position.set(e.panX, e.panY);
			};
			ee(), u = r.subscribe((e, t) => {
				if (e.camera !== t.camera && ee(), e.viewScale !== t.viewScale) {
					let t = Su(e) ?? e.document.pages[0], { width: n, height: r } = _(t.size);
					a.renderer.resize(n, r);
				}
			}), p = pp(a.canvas, r), m = mp(a.canvas, r), vp(a.stage, o, r);
			let x = new v();
			x.eventMode = "none", d = r.subscribe((e, t) => {
				e.grid !== t.grid && xp(x, (Su(e) ?? e.document.pages[0]).size, e.grid);
			});
			let S = (e, n) => {
				s?.destroy(), o.removeChildren();
				let i = _(e.size);
				(a.renderer.width !== i.width || a.renderer.height !== i.height) && a.renderer.resize(i.width, i.height), a.renderer.background.color = yp(e.background), a.renderer.background.alpha = bp(e.background), o.addChild(x), xp(x, e.size, r.getState().grid), s = new op(o, (e, t) => {
					dp(e, t, r, a.stage, o);
				}), s.mount(e, n), t && (t.current = s);
			}, C = r.getState();
			S(Su(C) ?? C.document.pages[0], C.document), b(), c = r.subscribe((e, t) => {
				if (e.document !== t.document && e.lastCommand === null) {
					let t = Su(e) ?? e.document.pages[0];
					S(t, e.document);
					return;
				}
				if (e.activePageId !== t.activePageId) {
					let t = Su(e) ?? e.document.pages[0];
					S(t, e.document);
					return;
				}
				e.lastCommand && e.lastCommand !== t.lastCommand && s?.apply(e.lastCommand, e.document);
			}), e?.(a, o);
		})(), () => {
			i = !0, c?.(), u?.(), d?.(), p?.(), m?.(), cancelAnimationFrame(h);
			for (let e of g) e();
			s?.destroy(), t && (t.current = null), a.renderer && a.destroy(!0);
		};
	}, []), /* @__PURE__ */ T("div", {
		ref: n,
		className: "relative inline-block"
	});
}
//#endregion
//#region node_modules/.pnpm/zustand@5.0.14_@types+react@19.2.17_immer@11.1.11_react@19.2.7/node_modules/zustand/esm/vanilla/shallow.mjs
var Cp = (e) => Symbol.iterator in e, wp = (e) => "entries" in e, Tp = (e, t) => {
	let n = e instanceof Map ? e : new Map(e.entries()), r = t instanceof Map ? t : new Map(t.entries());
	if (n.size !== r.size) return !1;
	for (let [e, t] of n) if (!r.has(e) || !Object.is(t, r.get(e))) return !1;
	return !0;
}, Ep = (e, t) => {
	let n = e[Symbol.iterator](), r = t[Symbol.iterator](), i = n.next(), a = r.next();
	for (; !i.done && !a.done;) {
		if (!Object.is(i.value, a.value)) return !1;
		i = n.next(), a = r.next();
	}
	return !!i.done && !!a.done;
};
function Dp(e, t) {
	return Object.is(e, t) ? !0 : typeof e != "object" || !e || typeof t != "object" || !t || Object.getPrototypeOf(e) !== Object.getPrototypeOf(t) ? !1 : Cp(e) && Cp(t) ? wp(e) && wp(t) ? Tp(e, t) : Ep(e, t) : Tp({ entries: () => Object.entries(e) }, { entries: () => Object.entries(t) });
}
//#endregion
//#region node_modules/.pnpm/zustand@5.0.14_@types+react@19.2.17_immer@11.1.11_react@19.2.7/node_modules/zustand/esm/react/shallow.mjs
function Op(t) {
	let n = e.useRef(void 0);
	return (e) => {
		let r = t(e);
		return Dp(n.current, r) ? n.current : n.current = r;
	};
}
//#endregion
//#region src/render/viewport.ts
function kp(e, t) {
	return {
		toWorld(n) {
			let r = e.getBoundingClientRect(), i = t(), a = {
				x: n.x - r.left,
				y: n.y - r.top
			};
			return {
				x: (a.x - i.panX) / i.zoom,
				y: (a.y - i.panY) / i.zoom
			};
		},
		toScreen(e) {
			let n = t();
			return {
				x: e.x * n.zoom + n.panX,
				y: e.y * n.zoom + n.panY
			};
		}
	};
}
//#endregion
//#region src/render/interactions/rotate.ts
function Ap(e, t) {
	return Math.atan2(t.y - e.y, t.x - e.x);
}
function jp(e, t, n) {
	return Ap(e, t) - n;
}
//#endregion
//#region src/render/interactions/pointerGesture.ts
function Mp(e, t, n) {
	e.getState().beginGesture(t);
	let r = () => {
		window.removeEventListener("pointermove", n), window.removeEventListener("pointerup", r), e.getState().endGesture();
	};
	window.addEventListener("pointermove", n), window.addEventListener("pointerup", r);
}
//#endregion
//#region src/ui/TextEditOverlay.tsx
function Np(e, t, n) {
	return n ? {
		text: t,
		size: Gf({
			...e,
			text: t
		}, n)
	} : { text: t };
}
function Pp(e, t) {
	return !(e instanceof Node && t?.contains(e));
}
function Fp({ node: e, viewport: t, activePageId: n, onClose: r }) {
	let i = Eu(), [o, l] = c(e.text), u = s(null), d = s(!1);
	a(() => {
		u.current?.focus(), u.current?.select();
	}, []);
	let f = () => {
		if (!d.current) {
			if (d.current = !0, o !== e.text) {
				let t = Cd(e.font.family)?.font ?? null;
				i.getState().dispatch({
					type: "UpdateProps",
					pageId: n,
					nodeId: e.id,
					patch: Np(e, o, t)
				});
			}
			r();
		}
	}, p = s(f);
	a(() => {
		p.current = f;
	}), a(() => {
		let e = (e) => {
			Pp(e.target, u.current) && p.current();
		};
		return document.addEventListener("pointerdown", e, !0), () => document.removeEventListener("pointerdown", e, !0);
	}, []);
	let m = e.transform.originX ?? 0, h = e.transform.originY ?? 0, g = t.toScreen({
		x: e.transform.x - m * e.size.width,
		y: e.transform.y - h * e.size.height
	}), _ = t.toScreen({
		x: 1,
		y: 0
	}).x - t.toScreen({
		x: 0,
		y: 0
	}).x;
	return /* @__PURE__ */ T("textarea", {
		ref: u,
		value: o,
		onChange: (e) => l(e.target.value),
		onBlur: f,
		onKeyDown: (e) => {
			e.stopPropagation(), e.key === "Escape" && f();
		},
		className: "pointer-events-auto absolute resize-none select-text overflow-hidden border-2 border-blue-500 bg-white/90 p-0 outline-none",
		style: {
			left: g.x,
			top: g.y,
			width: e.size.width * _,
			height: e.size.height * _,
			fontFamily: `"${e.font.family}", sans-serif`,
			fontSize: e.font.size * _,
			lineHeight: e.lineHeight,
			letterSpacing: e.letterSpacing * _,
			textAlign: e.align,
			color: e.fill.type === "solid" ? e.fill.color : "#000000",
			transformOrigin: `${m * 100}% ${h * 100}%`,
			transform: `rotate(${e.transform.rotation * 180 / Math.PI}deg)`
		}
	});
}
//#endregion
//#region src/ui/WarpHandlesOverlay.tsx
function Ip(e, t, n, r) {
	let i = nu({
		x: (e.x - t.x) * n.scaleX,
		y: (e.y - t.y) * n.scaleY
	}, n.rotation);
	return r.toScreen({
		x: n.x + i.x,
		y: n.y + i.y
	});
}
function Lp(e) {
	let t = [];
	return e.anchors.forEach((e, n) => {
		t.push({
			anchor: n,
			kind: "anchor"
		}), e.in && t.push({
			anchor: n,
			kind: "in"
		}), e.out && t.push({
			anchor: n,
			kind: "out"
		});
	}), t;
}
function Rp(e, t) {
	return {
		x: e.x + t.x,
		y: e.y + t.y
	};
}
var zp = 1e-9;
function Bp(e, t, n) {
	if (!n) return n;
	let r = Math.hypot(n.x - e.x, n.y - e.y), i = e.x - t.x, a = e.y - t.y, o = Math.hypot(i, a);
	return r < zp || o < zp ? n : {
		x: e.x + i / o * r,
		y: e.y + a / o * r
	};
}
function Vp(e, t, n) {
	let r = e.anchors.map((e, r) => {
		if (r !== t.anchor) return e;
		if (t.kind === "anchor") return {
			...Rp(e, n),
			in: e.in ? Rp(e.in, n) : void 0,
			out: e.out ? Rp(e.out, n) : void 0
		};
		if (t.kind === "in") {
			if (!e.in) return e;
			let t = Rp(e.in, n);
			return {
				...e,
				in: t,
				out: Bp(e, t, e.out)
			};
		}
		if (!e.out) return e;
		let i = Rp(e.out, n);
		return {
			...e,
			out: i,
			in: Bp(e, i, e.in)
		};
	});
	return {
		...e,
		anchors: r
	};
}
function Hp({ node: e, activePageId: t, viewport: n }) {
	let r = Eu(), i = Cd(e.font.family)?.font;
	if (!i) return null;
	let a = Vf(e, i);
	if (a.height <= 0) return null;
	let o = e.warp?.type === "distort" ? Bf(e, a, a.flatBounds) : null, s = o ? [{
		role: "top",
		path: o.top
	}, {
		role: "bottom",
		path: o.bottom
	}] : (() => {
		let t = Rf(e, a.baselineY / a.height, a.height, a.centerY / a.height);
		return t ? [{
			role: "baseline",
			path: t
		}] : [];
	})();
	if (s.length === 0) return null;
	let c = {
		width: a.advanceWidth,
		height: a.height
	}, l = e.transform.originX ?? 0, u = e.transform.originY ?? 0, d = (t) => Ip({
		x: t.x * c.width,
		y: t.y * c.height
	}, {
		x: l * e.size.width,
		y: u * e.size.height
	}, e.transform, n), f = (i, a, s) => (l) => {
		l.stopPropagation();
		let u = n.toWorld({
			x: l.clientX,
			y: l.clientY
		});
		Mp(r, `warp-handle:${e.id}`, (l) => {
			let d = n.toWorld({
				x: l.clientX,
				y: l.clientY
			}), f = nu({
				x: d.x - u.x,
				y: d.y - u.y
			}, -e.transform.rotation), p = df(Vp(s, a, {
				x: f.x / (e.transform.scaleX || 1) / c.width,
				y: f.y / (e.transform.scaleY || 1) / c.height
			})), m = o ? {
				type: e.warp?.type ?? "distort",
				curveHeight: e.warp?.curveHeight ?? .5,
				directionInverted: e.warp?.directionInverted ?? !1,
				paths: i === "top" ? [p, o.bottom] : [o.top, p]
			} : {
				type: e.warp?.type ?? "wave",
				curveHeight: uf(p, c.height, e.font.size),
				directionInverted: e.warp?.directionInverted ?? !1,
				paths: [p]
			};
			r.getState().dispatch({
				type: "UpdateProps",
				pageId: t,
				nodeId: e.id,
				patch: { warp: m }
			});
		});
	};
	return /* @__PURE__ */ E(w, { children: [/* @__PURE__ */ T("svg", {
		className: "pointer-events-none absolute inset-0 h-full w-full",
		children: s.map(({ role: e, path: t }) => /* @__PURE__ */ E("g", { children: [/* @__PURE__ */ T("path", {
			d: t.anchors.flatMap((e, n) => {
				let r = t.anchors[n + 1];
				if (!r) return [];
				let i = d(e), a = d(e.out ?? e), o = d(r.in ?? r), s = d(r);
				return [`M ${i.x} ${i.y} C ${a.x} ${a.y}, ${o.x} ${o.y}, ${s.x} ${s.y}`];
			}).join(" "),
			fill: "none",
			stroke: "#8ec9f2",
			strokeWidth: 1.5
		}), t.anchors.map((e, t) => {
			let n = d(e);
			return /* @__PURE__ */ E("g", { children: [e.in && /* @__PURE__ */ T("line", {
				x1: n.x,
				y1: n.y,
				x2: d(e.in).x,
				y2: d(e.in).y,
				stroke: "#8ec9f2",
				strokeWidth: 1
			}), e.out && /* @__PURE__ */ T("line", {
				x1: n.x,
				y1: n.y,
				x2: d(e.out).x,
				y2: d(e.out).y,
				stroke: "#8ec9f2",
				strokeWidth: 1
			})] }, t);
		})] }, e))
	}), s.flatMap(({ role: e, path: t }) => Lp(t).map((n) => {
		let r = t.anchors[n.anchor], i = n.kind === "anchor" ? r : n.kind === "in" ? r.in : r.out, a = d(i);
		return /* @__PURE__ */ T("div", {
			onPointerDown: f(e, n, t),
			className: `pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full border-2 bg-white ${n.kind === "anchor" ? "h-[7px] w-[7px]" : "h-2.5 w-2.5"}`,
			style: {
				left: a.x,
				top: a.y,
				borderColor: "#78bde8"
			}
		}, `${e}-${n.anchor}-${n.kind}`);
	}))] });
}
//#endregion
//#region src/ui/CircleHandlesOverlay.tsx
var Up = {
	N: "S",
	S: "N",
	W: "E",
	E: "W"
};
function Wp(e, t, n) {
	let r = (e.x + t.x) / 2, i = (e.y + t.y) / 2, a = Math.hypot(t.x - e.x, t.y - e.y) / 2;
	return {
		centerX: r / n,
		centerY: i / n,
		radius: a / n
	};
}
function Gp(e, t) {
	let n = e.centerX * t, r = e.centerY * t, i = e.radius * t;
	return {
		N: {
			x: n,
			y: r - i
		},
		S: {
			x: n,
			y: r + i
		},
		W: {
			x: n - i,
			y: r
		},
		E: {
			x: n + i,
			y: r
		}
	};
}
function Kp({ node: e, activePageId: t, viewport: n }) {
	let r = Eu(), i = Cd(e.font.family)?.font;
	if (!i) return null;
	let a = Vf(e, i);
	if (a.height <= 0) return null;
	let o = zf(e, a);
	if (!o) return null;
	let s = e.font.size, c = e.transform.originX ?? 0, l = e.transform.originY ?? 0, u = {
		x: c * e.size.width,
		y: l * e.size.height
	}, d = (t) => Ip(t, u, e.transform, n), f = Gp(o, s), p = (i) => (a) => {
		a.stopPropagation();
		let o = n.toWorld({
			x: a.clientX,
			y: a.clientY
		}), c = f[i], l = f[Up[i]];
		Mp(r, `circle-handle:${e.id}`, (i) => {
			let a = n.toWorld({
				x: i.clientX,
				y: i.clientY
			}), u = nu({
				x: a.x - o.x,
				y: a.y - o.y
			}, -e.transform.rotation), d = {
				x: u.x / (e.transform.scaleX || 1),
				y: u.y / (e.transform.scaleY || 1)
			}, f = {
				x: c.x + d.x,
				y: c.y + d.y
			}, p = Wp(l, f, s);
			r.getState().dispatch({
				type: "UpdateProps",
				pageId: t,
				nodeId: e.id,
				patch: { warp: {
					type: e.warp?.type ?? "circle",
					curveHeight: e.warp?.curveHeight ?? 0,
					directionInverted: e.warp?.directionInverted ?? !1,
					circle: p
				} }
			});
		});
	}, m = o.centerX * s, h = o.centerY * s, g = o.radius * s, _ = d({
		x: m,
		y: h
	}), v = d({
		x: m + g,
		y: h
	}), y = Math.hypot(v.x - _.x, v.y - _.y);
	return /* @__PURE__ */ E(w, { children: [/* @__PURE__ */ T("svg", {
		className: "pointer-events-none absolute inset-0 h-full w-full",
		children: /* @__PURE__ */ T("circle", {
			cx: _.x,
			cy: _.y,
			r: y,
			fill: "none",
			stroke: "#8ec9f2",
			strokeWidth: 1.5
		})
	}), Object.keys(f).map((e) => {
		let t = d(f[e]);
		return /* @__PURE__ */ T("div", {
			onPointerDown: p(e),
			className: "pointer-events-auto absolute h-[7px] w-[7px] -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full border-2 bg-white",
			style: {
				left: t.x,
				top: t.y,
				borderColor: "#78bde8"
			}
		}, e);
	})] });
}
//#endregion
//#region src/ui/SelectionOverlay.tsx
var qp = [
	"nw",
	"n",
	"ne",
	"e",
	"se",
	"s",
	"sw",
	"w"
];
function Jp(e, t, n) {
	return {
		x: e.includes("e") ? t : e.includes("w") ? 0 : t / 2,
		y: e.includes("s") ? n : e.includes("n") ? 0 : n / 2
	};
}
function Yp(e) {
	if (e.type === "text") {
		let t = Cd(e.font.family)?.font;
		if (t) {
			let { bounds: n } = Vf(e, t);
			if (n.maxX > n.minX) return {
				x: n.minX,
				y: n.minY,
				width: n.maxX - n.minX,
				height: n.maxY - n.minY
			};
		}
	}
	return {
		x: 0,
		y: 0,
		width: e.size.width,
		height: e.size.height
	};
}
function Xp(e, t) {
	let { transform: n, size: r } = e, i = {
		x: (n.originX ?? 0) * r.width,
		y: (n.originY ?? 0) * r.height
	}, a = nu({
		x: (t.x - i.x) * n.scaleX,
		y: (t.y - i.y) * n.scaleY
	}, n.rotation);
	return {
		x: n.x + a.x,
		y: n.y + a.y
	};
}
function Zp(e) {
	let t = Su(e);
	return t ? Array.from(e.selectedNodeIds).map((e) => Xc(t.children, e)?.node).filter((e) => !!e) : [];
}
function Qp() {
	let { canvas: e } = ku(), t = $((e) => e.activePageId), n = $((e) => e.camera), r = $((e) => e.marqueeRect), i = $((e) => e.activeGuides), a = $(Op(Zp));
	if (!e) return null;
	let o = kp(e, () => n), s = /* @__PURE__ */ E(w, { children: [r && /* @__PURE__ */ T(am, {
		rect: r,
		viewport: o
	}), i.length > 0 && /* @__PURE__ */ T(om, {
		guides: i,
		viewport: o
	})] });
	if (a.length === 0) return /* @__PURE__ */ T("div", {
		className: "pointer-events-none absolute inset-0",
		children: s
	});
	if (a.length > 1) return /* @__PURE__ */ E(w, { children: [/* @__PURE__ */ T(im, {
		nodes: a,
		activePageId: t
	}), /* @__PURE__ */ T("div", {
		className: "pointer-events-none absolute inset-0",
		children: s
	})] });
	let c = a[0];
	return c.locked ? /* @__PURE__ */ T("div", {
		className: "pointer-events-none absolute inset-0",
		children: s
	}) : /* @__PURE__ */ T($p, {
		node: c,
		activePageId: t,
		camera: n,
		viewport: o,
		extras: s
	});
}
function $p({ node: e, activePageId: t, camera: n, viewport: r, extras: i }) {
	let a = Eu(), { canvas: o } = ku(), { onNodeDoubleClick: s } = Mu(), [l, u] = c(null), d = e.type === "image" && l === e.id, [f, p] = c(null), m = e.type === "text" && f === e.id, h = e.transform.originX ?? 0, g = e.transform.originY ?? 0, { scaleX: _, scaleY: v } = e.transform, y = Yp(e), b = r.toScreen({
		x: e.transform.x + (y.x - h * e.size.width) * _,
		y: e.transform.y + (y.y - g * e.size.height) * v
	}), ee = e.transform.rotation * 180 / Math.PI, x = (n) => (i) => {
		i.stopPropagation();
		let o = r.toWorld({
			x: i.clientX,
			y: i.clientY
		});
		Mp(a, `resize:${e.id}`, (i) => {
			let s = r.toWorld({
				x: i.clientX,
				y: i.clientY
			}), c = {
				x: s.x - o.x,
				y: s.y - o.y
			};
			if (e.type === "text") {
				a.getState().dispatch({
					type: "UpdateTransform",
					pageId: t,
					nodeId: e.id,
					patch: au(e, n, c, y)
				});
				return;
			}
			let l = ru(e, n, c);
			a.getState().dispatch({
				type: "UpdateProps",
				pageId: t,
				nodeId: e.id,
				patch: { size: l.size }
			}), a.getState().dispatch({
				type: "UpdateTransform",
				pageId: t,
				nodeId: e.id,
				patch: {
					x: l.transform.x,
					y: l.transform.y
				}
			});
		});
	}, S = (n) => {
		n.stopPropagation();
		let i = {
			x: e.transform.x,
			y: e.transform.y
		}, o = Ap(i, r.toWorld({
			x: n.clientX,
			y: n.clientY
		})) - e.transform.rotation;
		Mp(a, `rotate:${e.id}`, (n) => {
			let s = r.toWorld({
				x: n.clientX,
				y: n.clientY
			}), c = jp(i, s, o);
			a.getState().dispatch({
				type: "UpdateTransform",
				pageId: t,
				nodeId: e.id,
				patch: { rotation: c }
			});
		});
	}, C = {
		x: e.size.width / 2,
		y: -24 / (n.zoom * v)
	}, te = r.toScreen(Xp(e, C));
	return /* @__PURE__ */ E("div", {
		className: "pointer-events-none absolute inset-0",
		children: [
			/* @__PURE__ */ T("div", {
				onDoubleClick: () => {
					s && !s(e.id, e.type) || (e.type === "image" && u(d ? null : e.id), e.type === "text" && p(m ? null : e.id));
				},
				onPointerDown: (t) => {
					e.type !== "image" && e.type !== "text" || !o || o.dispatchEvent(new PointerEvent("pointerdown", {
						bubbles: !0,
						cancelable: !0,
						clientX: t.clientX,
						clientY: t.clientY,
						pointerId: t.pointerId,
						pointerType: t.pointerType,
						button: t.button,
						buttons: t.buttons,
						isPrimary: t.isPrimary
					}));
				},
				className: `df-sel-box absolute ${e.type === "image" || e.type === "text" ? "pointer-events-auto" : ""}`,
				style: {
					left: b.x,
					top: b.y,
					width: y.width * _ * n.zoom,
					height: y.height * v * n.zoom,
					transformOrigin: `${(h * e.size.width - y.x) * _ * n.zoom}px ${(g * e.size.height - y.y) * v * n.zoom}px`,
					transform: `rotate(${ee}deg)`
				}
			}),
			!d && !m && qp.map((t) => {
				let n = e.type === "text", i = n ? Jp(t, y.width, y.height) : Jp(t, e.size.width, e.size.height), a = r.toScreen(Xp(e, n ? {
					x: y.x + i.x,
					y: y.y + i.y
				} : i));
				return /* @__PURE__ */ T("div", {
					onPointerDown: x(t),
					className: "pointer-events-auto absolute df-handle -translate-x-1/2 -translate-y-1/2",
					style: {
						left: a.x,
						top: a.y,
						cursor: `${t}-resize`
					}
				}, t);
			}),
			!d && !m && /* @__PURE__ */ T("div", {
				onPointerDown: S,
				className: "pointer-events-auto absolute df-handle -translate-x-1/2 -translate-y-1/2 cursor-grab",
				style: {
					left: te.x,
					top: te.y
				}
			}),
			d && e.type === "image" && /* @__PURE__ */ T(rm, {
				node: e,
				activePageId: t,
				viewport: r
			}),
			m && e.type === "text" && /* @__PURE__ */ T(Fp, {
				node: e,
				viewport: r,
				activePageId: t,
				onClose: () => p(null)
			}),
			!m && e.type === "text" && e.warp?.type === "circle" && /* @__PURE__ */ T(Kp, {
				node: e,
				activePageId: t,
				viewport: r
			}),
			!m && e.type === "text" && e.warp && e.warp.type !== "none" && e.warp.type !== "circle" && /* @__PURE__ */ T(Hp, {
				node: e,
				activePageId: t,
				viewport: r
			}),
			i
		]
	});
}
var em = [
	"nw",
	"ne",
	"se",
	"sw"
], tm = {
	x: 0,
	y: 0,
	width: 1,
	height: 1
};
function nm(e, t, n) {
	let { x: r, y: i, width: a, height: o } = e;
	return t.includes("w") ? (r += n.x, a -= n.x) : a += n.x, t.includes("n") ? (i += n.y, o -= n.y) : o += n.y, r = Math.max(0, Math.min(1, r)), i = Math.max(0, Math.min(1, i)), a = Math.max(.01, Math.min(1 - r, a)), o = Math.max(.01, Math.min(1 - i, o)), {
		x: r,
		y: i,
		width: a,
		height: o
	};
}
function rm({ node: e, activePageId: t, viewport: n }) {
	let r = Eu(), i = e.crop ?? tm, a = (a) => (o) => {
		o.stopPropagation();
		let s = n.toWorld({
			x: o.clientX,
			y: o.clientY
		}), c = i;
		Mp(r, `crop:${e.id}:${a}`, (i) => {
			let o = n.toWorld({
				x: i.clientX,
				y: i.clientY
			}), l = nu({
				x: o.x - s.x,
				y: o.y - s.y
			}, -e.transform.rotation), u = e.transform.scaleX || 1, d = e.transform.scaleY || 1, f = {
				x: l.x / u / e.size.width,
				y: l.y / d / e.size.height
			}, p = nm(c, a, f);
			r.getState().dispatch({
				type: "UpdateProps",
				pageId: t,
				nodeId: e.id,
				patch: { crop: p }
			});
		});
	};
	return /* @__PURE__ */ T(w, { children: em.map((t) => {
		let r = {
			x: (t.includes("w") ? i.x : i.x + i.width) * e.size.width,
			y: (t.includes("n") ? i.y : i.y + i.height) * e.size.height
		}, o = n.toScreen(Xp(e, r));
		return /* @__PURE__ */ T("div", {
			onPointerDown: a(t),
			className: "pointer-events-auto absolute df-handle -translate-x-1/2 -translate-y-1/2",
			style: {
				left: o.x,
				top: o.y,
				cursor: `${t}-resize`
			}
		}, t);
	}) });
}
function im({ nodes: e, activePageId: t }) {
	let n = Eu(), { canvas: r } = ku(), i = $((e) => e.camera);
	if (!r) return null;
	let a = kp(r, () => i), o = ou(e), s = a.toScreen(o.min), c = (r) => {
		r.stopPropagation();
		let i = o.pivot, s = Ap(i, a.toWorld({
			x: r.clientX,
			y: r.clientY
		}));
		Mp(n, "group-rotate", (r) => {
			let o = a.toWorld({
				x: r.clientX,
				y: r.clientY
			}), c = Ap(i, o), l = c - s;
			s = c;
			for (let r of uu(e, i, l)) n.getState().dispatch({
				type: "UpdateTransform",
				pageId: t,
				nodeId: r.nodeId,
				patch: r.transform
			});
		});
	}, l = a.toScreen({
		x: o.pivot.x,
		y: o.min.y - 24 / i.zoom
	});
	return /* @__PURE__ */ E("div", {
		className: "pointer-events-none absolute inset-0",
		children: [/* @__PURE__ */ T("div", {
			className: "df-sel-box absolute",
			style: {
				left: s.x,
				top: s.y,
				width: (o.max.x - o.min.x) * i.zoom,
				height: (o.max.y - o.min.y) * i.zoom,
				borderStyle: "dashed"
			}
		}), /* @__PURE__ */ T("div", {
			onPointerDown: c,
			className: "pointer-events-auto absolute df-handle -translate-x-1/2 -translate-y-1/2 cursor-grab",
			style: {
				left: l.x,
				top: l.y
			}
		})]
	});
}
function am({ rect: e, viewport: t }) {
	let n = t.toScreen({
		x: e.x,
		y: e.y
	}), r = t.toScreen({
		x: e.x + e.width,
		y: e.y + e.height
	});
	return /* @__PURE__ */ T("div", {
		className: "df-marquee absolute",
		style: {
			left: n.x,
			top: n.y,
			width: r.x - n.x,
			height: r.y - n.y
		}
	});
}
function om({ guides: e, viewport: t }) {
	return /* @__PURE__ */ T(w, { children: e.map((e, n) => {
		let r = t.toScreen(e.axis === "x" ? {
			x: e.value,
			y: 0
		} : {
			x: 0,
			y: e.value
		});
		return /* @__PURE__ */ T("div", {
			className: "absolute bg-pink-500",
			style: e.axis === "x" ? {
				left: r.x,
				top: 0,
				width: 1,
				height: "100%"
			} : {
				left: 0,
				top: r.y,
				width: "100%",
				height: 1
			}
		}, n);
	}) });
}
//#endregion
//#region node_modules/.pnpm/lucide-react@1.33.0_react@19.2.7/node_modules/lucide-react/dist/esm/shared/src/utils/mergeClasses.mjs
var sm = (...e) => e.filter((e, t, n) => !!e && e.trim() !== "" && n.indexOf(e) === t).join(" ").trim(), cm = (e) => e.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase(), lm = (e) => e.replace(/^([A-Z])|[\s-_]+(\w)/g, (e, t, n) => n ? n.toUpperCase() : t.toLowerCase()), um = (e) => {
	let t = lm(e);
	return t.charAt(0).toUpperCase() + t.slice(1);
}, dm = {
	xmlns: "http://www.w3.org/2000/svg",
	width: 24,
	height: 24,
	viewBox: "0 0 24 24",
	fill: "none",
	stroke: "currentColor",
	strokeWidth: 2,
	strokeLinecap: "round",
	strokeLinejoin: "round"
}, fm = (e) => {
	for (let t in e) if (t.startsWith("aria-") || t === "role" || t === "title") return !0;
	return !1;
}, pm = t({}), mm = () => i(pm), hm = r(({ color: e, size: t, strokeWidth: r, absoluteStrokeWidth: i, className: a = "", children: o, iconNode: s, ...c }, l) => {
	let { size: u = 24, strokeWidth: d = 2, absoluteStrokeWidth: f = !1, color: p = "currentColor", className: m = "" } = mm() ?? {}, h = i ?? f ? Number(r ?? d) * 24 / Number(t ?? u) : r ?? d;
	return n("svg", {
		ref: l,
		...dm,
		width: t ?? u ?? dm.width,
		height: t ?? u ?? dm.height,
		stroke: e ?? p,
		strokeWidth: h,
		className: sm("lucide", m, a),
		...!o && !fm(c) && { "aria-hidden": "true" },
		...c
	}, [...s.map(([e, t]) => n(e, t)), ...Array.isArray(o) ? o : [o]]);
}), gm = (e, t) => {
	let i = r(({ className: r, ...i }, a) => n(hm, {
		ref: a,
		iconNode: t,
		className: sm(`lucide-${cm(um(e))}`, `lucide-${e}`, r),
		...i
	}));
	return i.displayName = um(e), i;
}, _m = gm("align-end-horizontal", [
	["rect", {
		width: "6",
		height: "16",
		x: "4",
		y: "2",
		rx: "2",
		key: "z5wdxg"
	}],
	["rect", {
		width: "6",
		height: "9",
		x: "14",
		y: "9",
		rx: "2",
		key: "um7a8w"
	}],
	["path", {
		d: "M22 22H2",
		key: "19qnx5"
	}]
]), vm = gm("align-end-vertical", [
	["rect", {
		width: "16",
		height: "6",
		x: "2",
		y: "4",
		rx: "2",
		key: "10wcwx"
	}],
	["rect", {
		width: "9",
		height: "6",
		x: "9",
		y: "14",
		rx: "2",
		key: "4p5bwg"
	}],
	["path", {
		d: "M22 22V2",
		key: "12ipfv"
	}]
]), ym = gm("align-start-horizontal", [
	["rect", {
		width: "6",
		height: "16",
		x: "4",
		y: "6",
		rx: "2",
		key: "1n4dg1"
	}],
	["rect", {
		width: "6",
		height: "9",
		x: "14",
		y: "6",
		rx: "2",
		key: "17khns"
	}],
	["path", {
		d: "M22 2H2",
		key: "fhrpnj"
	}]
]), bm = gm("align-start-vertical", [
	["rect", {
		width: "9",
		height: "6",
		x: "6",
		y: "14",
		rx: "2",
		key: "lpm2y7"
	}],
	["rect", {
		width: "16",
		height: "6",
		x: "6",
		y: "4",
		rx: "2",
		key: "rdj6ps"
	}],
	["path", {
		d: "M2 2v20",
		key: "1ivd8o"
	}]
]), xm = gm("align-vertical-justify-center", [
	["rect", {
		width: "14",
		height: "6",
		x: "5",
		y: "16",
		rx: "2",
		key: "1i8z2d"
	}],
	["rect", {
		width: "10",
		height: "6",
		x: "7",
		y: "2",
		rx: "2",
		key: "ypihtt"
	}],
	["path", {
		d: "M2 12h20",
		key: "9i4pu4"
	}]
]), Sm = gm("copy", [["rect", {
	width: "14",
	height: "14",
	x: "8",
	y: "8",
	rx: "2",
	ry: "2",
	key: "17jyea"
}], ["path", {
	d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2",
	key: "zix9uf"
}]]), Cm = gm("grid-3x3", [
	["rect", {
		width: "18",
		height: "18",
		x: "3",
		y: "3",
		rx: "2",
		key: "afitv7"
	}],
	["path", {
		d: "M3 9h18",
		key: "1pudct"
	}],
	["path", {
		d: "M3 15h18",
		key: "5xshup"
	}],
	["path", {
		d: "M9 3v18",
		key: "fh3hqa"
	}],
	["path", {
		d: "M15 3v18",
		key: "14nvp0"
	}]
]), wm = gm("image", [
	["rect", {
		width: "18",
		height: "18",
		x: "3",
		y: "3",
		rx: "2",
		ry: "2",
		key: "1m3agn"
	}],
	["circle", {
		cx: "9",
		cy: "9",
		r: "2",
		key: "af1f0g"
	}],
	["path", {
		d: "m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21",
		key: "1xmnt7"
	}]
]), Tm = gm("layers", [
	["path", {
		d: "M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z",
		key: "zw3jo"
	}],
	["path", {
		d: "M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12",
		key: "1wduqc"
	}],
	["path", {
		d: "M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17",
		key: "kqbvx6"
	}]
]), Em = gm("menu", [
	["path", {
		d: "M4 5h16",
		key: "1tepv9"
	}],
	["path", {
		d: "M4 12h16",
		key: "1lakjw"
	}],
	["path", {
		d: "M4 19h16",
		key: "1djgab"
	}]
]), Dm = gm("minus", [["path", {
	d: "M5 12h14",
	key: "1ays0h"
}]]), Om = gm("plus", [["path", {
	d: "M5 12h14",
	key: "1ays0h"
}], ["path", {
	d: "M12 5v14",
	key: "s699le"
}]]), km = gm("redo-2", [["path", {
	d: "m15 14 5-5-5-5",
	key: "12vg1m"
}], ["path", {
	d: "M20 9H9.5A5.5 5.5 0 0 0 4 14.5A5.5 5.5 0 0 0 9.5 20H13",
	key: "6uklza"
}]]), Am = gm("square", [["rect", {
	width: "18",
	height: "18",
	x: "3",
	y: "3",
	rx: "2",
	key: "afitv7"
}]]), jm = gm("text-align-center", [
	["path", {
		d: "M21 5H3",
		key: "1fi0y6"
	}],
	["path", {
		d: "M17 12H7",
		key: "16if0g"
	}],
	["path", {
		d: "M19 19H5",
		key: "vjpgq2"
	}]
]), Mm = gm("trash-2", [
	["path", {
		d: "M10 11v6",
		key: "nco0om"
	}],
	["path", {
		d: "M14 11v6",
		key: "outv1u"
	}],
	["path", {
		d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6",
		key: "miytrc"
	}],
	["path", {
		d: "M3 6h18",
		key: "d0wm0j"
	}],
	["path", {
		d: "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",
		key: "e791ji"
	}]
]), Nm = gm("type", [
	["path", {
		d: "M12 4v16",
		key: "1654pz"
	}],
	["path", {
		d: "M4 7V5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2",
		key: "e0r10z"
	}],
	["path", {
		d: "M9 20h6",
		key: "s66wpe"
	}]
]), Pm = gm("undo-2", [["path", {
	d: "M9 14 4 9l5-5",
	key: "102s5s"
}], ["path", {
	d: "M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11",
	key: "f3b9sd"
}]]), Fm = gm("upload", [
	["path", {
		d: "M12 3v12",
		key: "1x0j5s"
	}],
	["path", {
		d: "m17 8-5-5-5 5",
		key: "7q97r8"
	}],
	["path", {
		d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",
		key: "ih7n3h"
	}]
]), Im = 10, Lm = [];
function Rm(e) {
	let t = e.getState(), { selectedNodeIds: n } = t, r = Su(t);
	return r ? Array.from(n).map((e) => Xc(r.children, e)?.node).filter((e) => !!e) : [];
}
function zm(e, t) {
	if (t.length === 0) return;
	let n = e.getState().activePageId, r = t.map((e) => {
		let t = el(e);
		return t.transform = {
			...t.transform,
			x: t.transform.x + Im,
			y: t.transform.y + Im
		}, t;
	});
	e.getState().beginGesture("paste");
	for (let t of r) e.getState().dispatch({
		type: "AddNode",
		pageId: n,
		node: t
	});
	e.getState().endGesture(), e.getState().select(r[0]?.id ?? null);
	for (let t = 1; t < r.length; t++) e.getState().select(r[t].id, "toggle");
}
function Bm(e) {
	zm(e, Rm(e));
}
function Vm(e) {
	let t = Rm(e);
	t.length > 0 && (Lm = t);
}
function Hm(e) {
	Vm(e);
	let t = Array.from(e.getState().selectedNodeIds);
	if (t.length === 0) return;
	let n = e.getState().activePageId;
	e.getState().beginGesture("cut");
	for (let r of t) e.getState().dispatch({
		type: "RemoveNode",
		pageId: n,
		nodeId: r
	});
	e.getState().endGesture();
}
function Um(e) {
	zm(e, Lm);
}
//#endregion
//#region src/core/actions.ts
function Wm(e, t) {
	switch (t) {
		case "left": return e.min.x;
		case "center": return e.pivot.x;
		case "right": return e.max.x;
		case "top": return e.min.y;
		case "middle": return e.pivot.y;
		case "bottom": return e.max.y;
	}
}
function Gm(e) {
	let t = e.getState(), { selectedNodeIds: n } = t, r = Su(t);
	return r ? Array.from(n).map((e) => Xc(r.children, e)?.node).filter((e) => !!e) : [];
}
function Km(e, t) {
	let n = Gm(e);
	if (n.length < 2) return;
	let r = e.getState().activePageId, i = t === "left" || t === "center" || t === "right" ? "x" : "y", a = Wm(ou(n), t);
	e.getState().beginGesture("align");
	for (let o of n) {
		let n = a - Wm(su(o), t);
		e.getState().dispatch({
			type: "UpdateTransform",
			pageId: r,
			nodeId: o.id,
			patch: i === "x" ? { x: o.transform.x + n } : { y: o.transform.y + n }
		});
	}
	e.getState().endGesture();
}
function qm(e, t) {
	let n = Gm(e);
	if (n.length < 3) return;
	let r = e.getState().activePageId, i = n.map((e) => ({
		node: e,
		bounds: su(e)
	})).sort((e, n) => Wm(e.bounds, t === "horizontal" ? "center" : "middle") - Wm(n.bounds, t === "horizontal" ? "center" : "middle")), a = (e) => t === "horizontal" ? e.max.x - e.min.x : e.max.y - e.min.y, o = (e) => t === "horizontal" ? e.min.x : e.min.y, s = o(i[0].bounds), c = o(i[i.length - 1].bounds) + a(i[i.length - 1].bounds), l = i.reduce((e, t) => e + a(t.bounds), 0), u = (c - s - l) / (i.length - 1);
	e.getState().beginGesture("distribute");
	let d = s + a(i[0].bounds) + u;
	for (let n = 1; n < i.length - 1; n++) {
		let { node: s, bounds: c } = i[n], l = d - o(c);
		e.getState().dispatch({
			type: "UpdateTransform",
			pageId: r,
			nodeId: s.id,
			patch: t === "horizontal" ? { x: s.transform.x + l } : { y: s.transform.y + l }
		}), d += a(c) + u;
	}
	e.getState().endGesture();
}
function Jm(e) {
	let { selectedNodeIds: t, activePageId: n } = e.getState();
	if (t.size !== 0) {
		e.getState().beginGesture("multi-delete");
		for (let r of t) e.getState().dispatch({
			type: "RemoveNode",
			pageId: n,
			nodeId: r
		});
		e.getState().endGesture();
	}
}
function Ym(e) {
	let { selectedNodeIds: t, activePageId: n } = e.getState();
	if (t.size < 2) return;
	let r = Yc();
	e.getState().dispatch({
		type: "GroupNodes",
		pageId: n,
		nodeIds: Array.from(t),
		groupId: r
	}), e.getState().select(r);
}
function Xm(e) {
	let t = e.getState(), { selectedNodeIds: n } = t;
	if (n.size !== 1) return null;
	let r = Su(t), [i] = n;
	return !r || Xc(r.children, i)?.node.type !== "group" ? null : i;
}
function Zm(e) {
	let t = Xm(e);
	t && (e.getState().dispatch({
		type: "UngroupNode",
		pageId: e.getState().activePageId,
		groupId: t
	}), e.getState().select(null));
}
function Qm(e) {
	let t = Su(e.getState());
	if (!(!t || t.children.length === 0)) {
		e.getState().select(t.children[0].id, "replace");
		for (let n = 1; n < t.children.length; n++) e.getState().select(t.children[n].id, "toggle");
	}
}
function $m(e, t) {
	e.getState().select(t[0] ?? null, "replace");
	for (let n of t.slice(1)) e.getState().select(n, "toggle");
}
function eh(e, t, n) {
	let r = e.getState(), { selectedNodeIds: i } = r;
	if (i.size === 0) return;
	let a = Su(r);
	if (a) {
		e.getState().beginGesture("nudge");
		for (let r of i) {
			let i = Xc(a.children, r);
			i && e.getState().dispatch({
				type: "UpdateTransform",
				pageId: a.id,
				nodeId: r,
				patch: {
					x: i.node.transform.x + t,
					y: i.node.transform.y + n
				}
			});
		}
		e.getState().endGesture();
	}
}
//#endregion
//#region src/ui/toolActions.ts
var th = {
	x: 100,
	y: 100,
	scaleX: 1,
	scaleY: 1,
	rotation: 0,
	originX: .5,
	originY: .5
};
function nh() {
	return {
		id: Yc(),
		transform: { ...th },
		size: {
			width: 150,
			height: 150
		},
		opacity: 1,
		visible: !0,
		locked: !1,
		type: "shape",
		shape: "rect",
		fill: {
			type: "solid",
			color: "#3b82f6"
		}
	};
}
function rh(e, t, n) {
	return {
		id: Yc(),
		transform: { ...th },
		size: {
			width: t,
			height: n
		},
		opacity: 1,
		visible: !0,
		locked: !1,
		type: "image",
		assetId: e
	};
}
function ih(e) {
	return new Promise((t, n) => {
		let r = new FileReader();
		r.onload = () => t(r.result), r.onerror = () => n(r.error), r.readAsDataURL(e);
	});
}
function ah(e) {
	return new Promise((t) => {
		let n = new Image();
		n.onload = () => t({
			width: n.naturalWidth,
			height: n.naturalHeight
		}), n.onerror = () => t({
			width: 200,
			height: 200
		}), n.src = e;
	});
}
function oh(e, t, n) {
	return {
		id: Yc(),
		transform: { ...th },
		size: {
			width: t,
			height: n
		},
		opacity: 1,
		visible: !0,
		locked: !1,
		type: "svg",
		assetId: e
	};
}
function sh(e) {
	let t = new DOMParser().parseFromString(e, "image/svg+xml").documentElement, n = t.getAttribute("viewBox");
	if (n) {
		let e = n.trim().split(/[\s,]+/).map(Number);
		if (e.length === 4 && e[2] > 0 && e[3] > 0) return {
			width: e[2],
			height: e[3]
		};
	}
	let r = parseFloat(t.getAttribute("width") ?? ""), i = parseFloat(t.getAttribute("height") ?? "");
	return r > 0 && i > 0 ? {
		width: r,
		height: i
	} : {
		width: 200,
		height: 200
	};
}
function ch(e, t) {
	return {
		id: Yc(),
		transform: { ...th },
		size: t,
		opacity: 1,
		visible: !0,
		locked: !1,
		type: "text",
		text: "Your text",
		font: {
			family: e,
			weight: 400,
			style: "normal",
			size: 96
		},
		align: "left",
		letterSpacing: 0,
		lineHeight: 1.2,
		fill: {
			type: "solid",
			color: "#111827"
		}
	};
}
function lh(e, t) {
	let n = (t) => {
		let n = e.getState().activePageId;
		e.getState().dispatch({
			type: "AddNode",
			pageId: n,
			node: t
		}), e.getState().select(t.id);
	};
	return {
		addNode: n,
		addShape: () => n(nh()),
		handleAddText: async () => {
			let e = Sd()[0];
			if (!e) return;
			let t = Cd(e) ?? await Td(e);
			if (!t) return;
			let r = ch(e, {
				width: 1,
				height: 1
			});
			n({
				...r,
				size: Gf(r, t.font)
			});
		},
		handleImageFile: async (t) => {
			let r = await ih(t), { width: i, height: a } = await ah(r), o = Yc();
			e.getState().addAssetRef(o, {
				type: "image",
				dataUri: r
			}), n(rh(o, i, a));
		},
		handleSvgFile: async (t) => {
			let r = await ih(t), { width: i, height: a } = sh(await ld(r)), o = Yc();
			e.getState().addAssetRef(o, {
				type: "svg",
				dataUri: r
			}), n(oh(o, i, a));
		},
		handleFitToScreen: () => {
			if (!t) return;
			let n = Su(e.getState());
			n && hp(e, {
				width: t.screen.width,
				height: t.screen.height
			}, n.size);
		},
		zoomBy: (t) => {
			let { camera: n } = e.getState();
			e.getState().setCamera({ zoom: n.zoom * t });
		},
		undo: () => e.getState().undo(),
		redo: () => e.getState().redo(),
		deleteSelection: () => Jm(e),
		groupSelection: () => Ym(e),
		ungroupSelection: () => Zm(e),
		isSingleGroup: () => Xm(e) !== null,
		alignSelection: (t) => Km(e, t),
		distributeSelection: (t) => qm(e, t),
		toggleGrid: () => {
			let t = e.getState().grid;
			e.getState().setGrid({ enabled: !t.enabled });
		},
		toggleSnap: () => {
			let t = e.getState().grid;
			e.getState().setGrid({ snap: !t.snap });
		}
	};
}
//#endregion
//#region src/ui/selectionScreenBounds.ts
function uh() {
	let { canvas: e } = ku(), t = $((e) => e.camera), n = $(Op(Zp));
	if (!e || n.length !== 1) return null;
	let r = n[0], i = kp(e, () => t), a = r.transform.originX ?? 0, o = r.transform.originY ?? 0, s = Yp(r), c = i.toScreen({
		x: r.transform.x - a * r.size.width + s.x,
		y: r.transform.y - o * r.size.height + s.y
	});
	return {
		left: c.x,
		top: c.y,
		width: s.width * t.zoom,
		height: s.height * t.zoom
	};
}
//#endregion
//#region src/ui/FloatingContextToolbar.tsx
function dh() {
	let e = Eu(), t = $((e) => e.selectedNodeIds), n = uh(), r = lh(e, null);
	return !n || t.size !== 1 ? null : /* @__PURE__ */ E("div", {
		className: "pointer-events-auto absolute z-20 flex items-center gap-1 px-2",
		style: {
			left: n.left + n.width / 2,
			top: Math.max(8, n.top - 52),
			transform: "translateX(-50%)",
			height: 44,
			background: "#171d27",
			border: "1px solid #2a313d",
			borderRadius: 14,
			boxShadow: "0 8px 30px rgba(0,0,0,.25)",
			color: "#d8dde6"
		},
		children: [/* @__PURE__ */ T("button", {
			type: "button",
			className: "kittl-pill-btn",
			title: "Duplicate",
			onClick: () => Bm(e),
			children: /* @__PURE__ */ T(Sm, {
				size: 16,
				strokeWidth: 1.5
			})
		}), /* @__PURE__ */ T("button", {
			type: "button",
			className: "kittl-pill-btn",
			title: "Delete",
			onClick: () => r.deleteSelection(),
			children: /* @__PURE__ */ T(Mm, {
				size: 16,
				strokeWidth: 1.5
			})
		})]
	});
}
//#endregion
//#region src/ui/LeftSidebar.tsx
function fh() {
	let e = Eu(), { app: t } = ku(), { drawer: n, toggleDrawer: r, activeTool: i, setActiveTool: a } = Mu(), o = lh(e, t), c = s(null), l = (e, t) => {
		a(e), t();
	};
	return /* @__PURE__ */ E("aside", {
		className: "flex flex-col border-r",
		style: {
			background: "var(--sidebar-bg)",
			borderColor: "var(--panel-border)"
		},
		children: [
			/* @__PURE__ */ T("div", {
				className: "mt-2 flex h-9 items-center justify-center text-lg font-bold text-white/90",
				children: "K"
			}),
			/* @__PURE__ */ T("button", {
				type: "button",
				className: "kittl-sidebar-btn",
				title: "Menu",
				onClick: () => r("dev"),
				children: /* @__PURE__ */ T(Em, {
					size: 18,
					strokeWidth: 1.5
				})
			}),
			/* @__PURE__ */ E("div", {
				className: "mt-1 flex flex-col",
				style: { gap: "6px" },
				children: [
					/* @__PURE__ */ T("button", {
						type: "button",
						className: `kittl-sidebar-btn ${i === "text" ? "active" : ""}`,
						title: "Text",
						onClick: () => void l("text", () => o.handleAddText()),
						children: /* @__PURE__ */ T(Nm, {
							size: 18,
							strokeWidth: 1.5
						})
					}),
					/* @__PURE__ */ T("button", {
						type: "button",
						className: `kittl-sidebar-btn ${i === "shape" ? "active" : ""}`,
						title: "Shape",
						onClick: () => l("shape", () => o.addShape()),
						children: /* @__PURE__ */ T(Am, {
							size: 18,
							strokeWidth: 1.5
						})
					}),
					/* @__PURE__ */ T("button", {
						type: "button",
						className: `kittl-sidebar-btn ${i === "image" ? "active" : ""}`,
						title: "Image",
						onClick: () => c.current?.click(),
						children: /* @__PURE__ */ T(wm, {
							size: 18,
							strokeWidth: 1.5
						})
					}),
					/* @__PURE__ */ T("button", {
						type: "button",
						className: `kittl-sidebar-btn ${n === "assets" ? "active" : ""}`,
						title: "Upload / Assets",
						onClick: () => r("assets"),
						children: /* @__PURE__ */ T(Fm, {
							size: 18,
							strokeWidth: 1.5
						})
					}),
					/* @__PURE__ */ T("button", {
						type: "button",
						className: "kittl-sidebar-btn",
						title: "Grid",
						onClick: () => o.toggleGrid(),
						children: /* @__PURE__ */ T(Cm, {
							size: 18,
							strokeWidth: 1.5
						})
					})
				]
			}),
			/* @__PURE__ */ T("div", {
				className: "mt-auto flex flex-col pb-2",
				children: /* @__PURE__ */ T("button", {
					type: "button",
					className: `kittl-sidebar-btn ${n === "layers" ? "active" : ""}`,
					title: "Layers",
					onClick: () => r("layers"),
					children: /* @__PURE__ */ T(Tm, {
						size: 18,
						strokeWidth: 1.5
					})
				})
			}),
			/* @__PURE__ */ T("input", {
				ref: c,
				type: "file",
				accept: "image/*",
				className: "hidden",
				onChange: (e) => {
					let t = e.target.files?.[0];
					t && o.handleImageFile(t), e.target.value = "";
				}
			})
		]
	});
}
//#endregion
//#region src/ui/FloatingBottomBar.tsx
var ph = .1, mh = 8;
function hh() {
	let e = Eu(), { app: t } = ku(), n = lh(e, t), r = $((e) => e.past.length > 0), i = $((e) => e.future.length > 0), a = $((e) => e.camera.zoom), { activeTool: o, setActiveTool: s } = Mu(), c = Math.round(a * 100);
	return /* @__PURE__ */ E("div", {
		className: "flex items-center gap-2",
		children: [
			/* @__PURE__ */ E("div", {
				className: "kittl-pill px-1",
				children: [
					/* @__PURE__ */ T("button", {
						type: "button",
						className: "kittl-pill-btn",
						title: "Grid",
						onClick: () => n.toggleGrid(),
						children: /* @__PURE__ */ T(Cm, {
							size: 16,
							strokeWidth: 1.5
						})
					}),
					/* @__PURE__ */ T("button", {
						type: "button",
						className: `kittl-pill-btn ${o === "shape" ? "active" : ""}`,
						title: "Rectangle",
						onClick: () => {
							s("shape"), n.addShape();
						},
						children: /* @__PURE__ */ T(Am, {
							size: 16,
							strokeWidth: 1.5
						})
					}),
					/* @__PURE__ */ T("button", {
						type: "button",
						className: `kittl-pill-btn ${o === "text" ? "active" : ""}`,
						title: "Text",
						onClick: () => {
							s("text"), n.handleAddText();
						},
						children: /* @__PURE__ */ T(Nm, {
							size: 16,
							strokeWidth: 1.5
						})
					})
				]
			}),
			/* @__PURE__ */ E("div", {
				className: "kittl-pill px-1",
				children: [/* @__PURE__ */ T("button", {
					type: "button",
					className: "kittl-pill-btn",
					title: "Undo",
					disabled: !r,
					onClick: () => n.undo(),
					children: /* @__PURE__ */ T(Pm, {
						size: 16,
						strokeWidth: 1.5
					})
				}), /* @__PURE__ */ T("button", {
					type: "button",
					className: "kittl-pill-btn",
					title: "Redo",
					disabled: !i,
					onClick: () => n.redo(),
					children: /* @__PURE__ */ T(km, {
						size: 16,
						strokeWidth: 1.5
					})
				})]
			}),
			/* @__PURE__ */ E("div", {
				className: "kittl-pill px-2",
				style: { width: 120 },
				children: [
					/* @__PURE__ */ T("button", {
						type: "button",
						className: "kittl-pill-btn",
						title: "Zoom out",
						disabled: a <= ph,
						onClick: () => n.zoomBy(1 / 1.2),
						children: /* @__PURE__ */ T(Dm, {
							size: 16,
							strokeWidth: 1.5
						})
					}),
					/* @__PURE__ */ E("span", {
						className: "flex-1 text-center text-xs",
						style: { color: "var(--text-muted)" },
						children: [c, "%"]
					}),
					/* @__PURE__ */ T("button", {
						type: "button",
						className: "kittl-pill-btn",
						title: "Zoom in",
						disabled: a >= mh,
						onClick: () => n.zoomBy(1.2),
						children: /* @__PURE__ */ T(Om, {
							size: 16,
							strokeWidth: 1.5
						})
					})
				]
			}),
			/* @__PURE__ */ T("button", {
				type: "button",
				className: "kittl-pill px-3 text-xs",
				style: { color: "var(--text-muted)" },
				title: "Fit to screen",
				onClick: () => n.handleFitToScreen(),
				children: "⊕ Fit"
			})
		]
	});
}
//#endregion
//#region src/ui/WorkspacePageLabel.tsx
var gh = {
	Standard: {
		width: 940,
		height: 960
	},
	"Social Post": {
		width: 1080,
		height: 1080
	},
	Story: {
		width: 1080,
		height: 1920
	},
	A4: {
		width: 2480,
		height: 3508
	},
	Poster: {
		width: 3e3,
		height: 4500
	}
};
function _h(e, t) {
	return {
		id: Yc(),
		name: e,
		size: t,
		background: {
			type: "color",
			value: "#f8f8f7"
		},
		children: []
	};
}
function vh() {
	let e = Eu(), t = $((e) => e.document.pages), n = $((e) => e.activePageId), r = t.find((e) => e.id === n), i = (n) => {
		let r = _h(`Page ${t.length + 1}`, gh[n] ?? gh.Standard);
		e.getState().dispatch({
			type: "AddPage",
			page: r
		}), e.getState().setActivePage(r.id);
	};
	return /* @__PURE__ */ E("div", {
		className: "absolute left-4 top-1.5 z-10 flex items-center gap-2 text-xs",
		style: { color: "var(--text-muted)" },
		children: [
			/* @__PURE__ */ E("span", { children: ["▣ ", r?.name ?? "Standard"] }),
			/* @__PURE__ */ T("select", {
				value: n,
				onChange: (t) => e.getState().setActivePage(t.target.value),
				className: "rounded border px-1 py-0.5 text-xs",
				style: {
					background: "#151b25",
					borderColor: "var(--panel-border)",
					color: "var(--text-muted)"
				},
				children: t.map((e) => /* @__PURE__ */ T("option", {
					value: e.id,
					children: e.name
				}, e.id))
			}),
			/* @__PURE__ */ E("select", {
				defaultValue: "",
				onChange: (e) => {
					e.target.value && i(e.target.value), e.target.value = "";
				},
				className: "rounded border px-1 py-0.5 text-xs",
				style: {
					background: "#151b25",
					borderColor: "var(--panel-border)",
					color: "var(--text-muted)"
				},
				children: [/* @__PURE__ */ T("option", {
					value: "",
					children: "+ Page"
				}), Object.keys(gh).map((e) => /* @__PURE__ */ T("option", {
					value: e,
					children: e
				}, e))]
			})
		]
	});
}
//#endregion
//#region src/ui/LayersPanel.tsx
function yh(e) {
	return e.name ? e.name : `${e.type[0].toUpperCase()}${e.type.slice(1)}`;
}
function bh({ onClose: e }) {
	let t = $((e) => e.activePageId), n = $((e) => Su(e)?.children ?? []);
	return /* @__PURE__ */ E("div", {
		className: "flex h-full flex-col p-3 text-sm",
		children: [/* @__PURE__ */ E("div", {
			className: "mb-3 flex items-center justify-between",
			children: [/* @__PURE__ */ T("span", {
				className: "font-medium",
				style: { color: "var(--text-primary)" },
				children: "Layers"
			}), e && /* @__PURE__ */ T("button", {
				type: "button",
				onClick: e,
				className: "text-xs",
				style: { color: "var(--text-muted)" },
				children: "Close"
			})]
		}), /* @__PURE__ */ T("ul", {
			className: "flex flex-col gap-1",
			children: [...n].reverse().map((e) => /* @__PURE__ */ T(xh, {
				node: e,
				depth: 0,
				pageId: t
			}, e.id))
		})]
	});
}
function xh({ node: e, depth: t, pageId: n }) {
	let r = Eu(), i = $((e) => e.selectedNodeIds).has(e.id), a = (t) => {
		r.getState().dispatch({
			type: "Reorder",
			pageId: n,
			nodeId: e.id,
			to: t
		});
	};
	return /* @__PURE__ */ E("li", { children: [/* @__PURE__ */ E("div", {
		className: "flex items-center justify-between gap-1 rounded px-2 py-1 text-sm",
		style: {
			paddingLeft: 8 + t * 12,
			background: i ? "#29313f" : "#151b25",
			color: i ? "var(--text-primary)" : "var(--text-muted)"
		},
		onClick: (t) => {
			r.getState().select(e.id, t.shiftKey ? "toggle" : "replace");
		},
		children: [/* @__PURE__ */ T("span", {
			className: "truncate",
			children: yh(e)
		}), /* @__PURE__ */ E("span", {
			className: "flex gap-1 text-xs",
			children: [
				/* @__PURE__ */ T("button", {
					type: "button",
					onClick: () => a("top"),
					title: "Bring to front",
					children: "⤒"
				}),
				/* @__PURE__ */ T("button", {
					type: "button",
					onClick: () => a("up"),
					title: "Bring forward",
					children: "↑"
				}),
				/* @__PURE__ */ T("button", {
					type: "button",
					onClick: () => a("down"),
					title: "Send backward",
					children: "↓"
				}),
				/* @__PURE__ */ T("button", {
					type: "button",
					onClick: () => a("bottom"),
					title: "Send to back",
					children: "⤓"
				}),
				/* @__PURE__ */ T("button", {
					type: "button",
					title: e.visible ? "Hide" : "Show",
					onClick: () => r.getState().dispatch({
						type: "UpdateProps",
						pageId: n,
						nodeId: e.id,
						patch: { visible: !e.visible }
					}),
					children: e.visible ? "👁" : "🚫"
				})
			]
		})]
	}), e.type === "group" && e.children.length > 0 && /* @__PURE__ */ T("ul", {
		className: "flex flex-col gap-1",
		children: [...e.children].reverse().map((e) => /* @__PURE__ */ T(xh, {
			node: e,
			depth: t + 1,
			pageId: n
		}, e.id))
	})] });
}
//#endregion
//#region src/ui/AssetPanel.tsx
function Sh(e) {
	return e.type === "image" || e.type === "svg";
}
var Ch = "text/desfoyo-asset-id";
function wh(e) {
	return [e.width, e.height];
}
function Th({ onClose: e }) {
	let t = Eu(), n = $((e) => e.activePageId), r = $((e) => e.document.assets), i = Object.entries(r).filter((e) => Sh(e[1])), a = async (e, r, i) => {
		let a = i === "svg" ? oh(e, ...wh(sh(await ld(r)))) : rh(e, ...wh(await ah(r)));
		t.getState().dispatch({
			type: "AddNode",
			pageId: n,
			node: a
		}), t.getState().select(a.id);
	};
	return /* @__PURE__ */ E("div", {
		className: "flex h-full flex-col p-3",
		children: [/* @__PURE__ */ E("div", {
			className: "mb-3 flex items-center justify-between",
			children: [/* @__PURE__ */ T("span", {
				className: "text-sm font-medium",
				style: { color: "var(--text-primary)" },
				children: "Assets"
			}), e && /* @__PURE__ */ T("button", {
				type: "button",
				onClick: e,
				className: "text-xs",
				style: { color: "var(--text-muted)" },
				children: "Close"
			})]
		}), /* @__PURE__ */ T("div", {
			className: "grid grid-cols-3 gap-1",
			children: i.map(([e, t]) => /* @__PURE__ */ T("img", {
				src: t.dataUri,
				draggable: !0,
				onDragStart: (t) => t.dataTransfer.setData(Ch, e),
				onClick: () => void a(e, t.dataUri, t.type),
				className: "h-16 w-16 cursor-pointer rounded object-cover",
				style: { border: "1px solid var(--panel-border)" }
			}, e))
		})]
	});
}
//#endregion
//#region src/ui/DevMenuPanel.tsx
function Eh({ onClose: e, sampleNames: t, activeSample: n, onSampleChange: r, onExport: i }) {
	return /* @__PURE__ */ E("div", {
		className: "flex h-full flex-col p-3 text-sm",
		style: { color: "var(--text-primary)" },
		children: [
			/* @__PURE__ */ E("div", {
				className: "mb-3 flex items-center justify-between",
				children: [/* @__PURE__ */ T("span", {
					className: "font-medium",
					children: "Dev menu"
				}), /* @__PURE__ */ T("button", {
					type: "button",
					onClick: e,
					className: "text-xs",
					style: { color: "var(--text-muted)" },
					children: "Close"
				})]
			}),
			/* @__PURE__ */ T(Dh, {
				title: "Samples",
				children: /* @__PURE__ */ T("div", {
					className: "flex flex-col gap-1",
					children: t.map((e) => /* @__PURE__ */ T("button", {
						type: "button",
						onClick: () => r(e),
						className: "rounded px-2 py-1 text-left text-xs",
						style: {
							background: e === n ? "#29313f" : "transparent",
							color: e === n ? "var(--text-primary)" : "var(--text-muted)"
						},
						children: e
					}, e))
				})
			}),
			/* @__PURE__ */ T(Dh, {
				title: "Export",
				children: /* @__PURE__ */ E("div", {
					className: "flex gap-2",
					children: [/* @__PURE__ */ T("button", {
						type: "button",
						className: "kittl-input px-2 text-xs",
						onClick: () => i("png"),
						children: "PNG"
					}), /* @__PURE__ */ T("button", {
						type: "button",
						className: "kittl-input px-2 text-xs",
						onClick: () => i("svg"),
						children: "SVG"
					})]
				})
			})
		]
	});
}
function Dh({ title: e, children: t }) {
	return /* @__PURE__ */ E("div", {
		className: "mb-4",
		children: [/* @__PURE__ */ T("div", {
			className: "mb-2 text-xs uppercase",
			style: { color: "var(--text-muted)" },
			children: e
		}), t]
	});
}
//#endregion
//#region src/ui/DrawerPanel.tsx
function Oh() {
	let { drawer: e, setDrawer: t, devMenu: n, onExport: r } = Mu();
	return e ? /* @__PURE__ */ E(w, { children: [/* @__PURE__ */ T("button", {
		type: "button",
		"aria-label": "Close panel",
		className: "absolute inset-0 z-20 bg-black/30",
		onClick: () => t(null)
	}), /* @__PURE__ */ E("div", {
		className: "kittl-drawer",
		children: [
			e === "layers" && /* @__PURE__ */ T(bh, { onClose: () => t(null) }),
			e === "assets" && /* @__PURE__ */ T(Th, { onClose: () => t(null) }),
			e === "dev" && n && r && /* @__PURE__ */ T(Eh, {
				onClose: () => t(null),
				sampleNames: n.sampleNames,
				activeSample: n.activeSample,
				onSampleChange: n.onSampleChange,
				onExport: r
			})
		]
	})] }) : null;
}
//#endregion
//#region src/ui/Workspace.tsx
function kh({ children: e }) {
	return /* @__PURE__ */ E("main", {
		className: "relative flex min-w-0 flex-col overflow-hidden",
		style: { background: "var(--workspace-bg)" },
		children: [
			/* @__PURE__ */ T(vh, {}),
			/* @__PURE__ */ T("div", {
				className: "relative flex min-h-0 flex-1 items-start justify-center overflow-auto pt-6",
				children: /* @__PURE__ */ T("div", {
					className: "relative shrink-0",
					style: { boxShadow: "0 0 0 1px rgba(255,255,255,.08)" },
					children: e
				})
			}),
			/* @__PURE__ */ T("div", {
				className: "pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center pb-3",
				children: /* @__PURE__ */ T("div", {
					className: "pointer-events-auto",
					children: /* @__PURE__ */ T(hh, {})
				})
			}),
			/* @__PURE__ */ T(Oh, {})
		]
	});
}
//#endregion
//#region src/ui/TransformationControls.tsx
var Ah = .5, jh = [
	"wave",
	"arch",
	"rise",
	"flag",
	"angle",
	"circle",
	"distort",
	"custom"
];
function Mh(e, t) {
	return {
		type: t,
		curveHeight: e?.curveHeight ?? .5,
		directionInverted: e?.directionInverted ?? !1
	};
}
function Nh(e, t) {
	return {
		type: e?.type ?? "wave",
		curveHeight: Math.min(4, Math.max(-1, t)),
		directionInverted: e?.directionInverted ?? !1
	};
}
function Ph(e) {
	return {
		type: e?.type ?? "none",
		curveHeight: Ah,
		directionInverted: !1
	};
}
function Fh(e) {
	return {
		type: e?.type ?? "circle",
		curveHeight: e?.curveHeight ?? .5,
		paths: e?.paths,
		circle: e?.circle,
		directionInverted: !(e?.directionInverted ?? !1)
	};
}
function Ih(e, t, n) {
	let r = t ? Gf({
		...e,
		warp: n
	}, t) : void 0;
	return r ? {
		warp: n,
		size: r
	} : { warp: n };
}
function Lh({ node: e, activePageId: t }) {
	let n = Eu(), r = e.warp, i = r?.type ?? "none", a = (r) => {
		let i = Cd(e.font.family)?.font ?? null;
		n.getState().dispatch({
			type: "UpdateProps",
			pageId: t,
			nodeId: e.id,
			patch: Ih(e, i, r)
		});
	};
	return /* @__PURE__ */ E("section", {
		className: "kittl-section",
		children: [
			/* @__PURE__ */ T("div", {
				className: "kittl-section-title",
				children: "Transformation"
			}),
			/* @__PURE__ */ T("div", {
				className: "grid grid-cols-4 gap-1.5",
				children: jh.map((e) => {
					let t = i === e;
					return /* @__PURE__ */ T("button", {
						type: "button",
						title: e,
						onClick: () => a(Mh(r, e)),
						className: "flex flex-col items-center justify-center rounded-lg text-[11px] font-semibold uppercase",
						style: {
							width: 50,
							height: 52,
							background: t ? "#263442" : "#252c37",
							border: t ? "2px solid #58a8de" : "1px solid #303846",
							color: "var(--text-muted)"
						},
						children: e
					}, e);
				})
			}),
			i !== "none" && i !== "circle" && i !== "custom" && i !== "distort" && /* @__PURE__ */ T(w, { children: /* @__PURE__ */ E("label", {
				className: "mt-3 flex flex-col gap-1 capitalize text-xs",
				style: { color: "var(--text-muted)" },
				children: [
					i,
					" Curve — ",
					Math.round((r?.curveHeight ?? 0) * 100),
					"%",
					/* @__PURE__ */ T("input", {
						type: "range",
						min: -1,
						max: 4,
						step: .01,
						value: r?.curveHeight ?? 0,
						className: "kittl-range",
						onPointerDown: () => n.getState().beginGesture(`warp-curve:${e.id}`),
						onPointerUp: () => n.getState().endGesture(),
						onChange: (e) => a(Nh(r, Number(e.target.value)))
					})
				]
			}) }),
			i === "circle" && /* @__PURE__ */ E("label", {
				className: "mt-3 flex items-center gap-2 text-xs",
				style: { color: "var(--text-muted)" },
				children: [/* @__PURE__ */ T("input", {
					type: "checkbox",
					checked: r?.directionInverted ?? !1,
					onChange: () => a(Fh(r))
				}), "Direction Inverted"]
			}),
			(i !== "none" || r) && /* @__PURE__ */ T("button", {
				type: "button",
				onClick: () => a(Ph(r)),
				className: "mt-3 w-full rounded-lg px-3 py-2 text-xs",
				style: {
					background: "#252c37",
					border: "1px solid #303846",
					color: "var(--text-muted)"
				},
				children: "Reset"
			})
		]
	});
}
//#endregion
//#region src/ui/TextShadowControls.tsx
var Rh = {
	type: "text-shadow",
	style: "drop",
	color: "#000000",
	angle: Math.PI / 4,
	distance: .06,
	blur: 4
};
function zh(e, t) {
	let n = (e ?? []).filter((e) => e.type !== "text-shadow");
	return t ? [...n, t] : n;
}
var Bh = [
	"drop",
	"line",
	"block",
	"3d"
];
function Vh({ node: e, onChange: t }) {
	let n = Kf(e.effects), r = (r) => {
		let i = {
			...n ?? Rh,
			...r
		};
		t(zh(e.effects, i));
	};
	return /* @__PURE__ */ E("div", {
		className: "flex flex-col gap-2",
		children: [/* @__PURE__ */ E("label", {
			className: "flex items-center gap-2 text-xs",
			style: { color: "var(--text-muted)" },
			children: [/* @__PURE__ */ T("input", {
				type: "checkbox",
				checked: !!n,
				onChange: (n) => t(zh(e.effects, n.target.checked ? Rh : null))
			}), "Enable Shadow"]
		}), n && /* @__PURE__ */ E(w, { children: [
			/* @__PURE__ */ T("div", {
				className: "grid grid-cols-4 gap-1.5",
				children: Bh.map((e) => /* @__PURE__ */ T("button", {
					type: "button",
					onClick: () => r({ style: e }),
					className: "rounded-lg px-2 py-1.5 text-[11px] font-semibold uppercase",
					style: {
						background: n.style === e ? "#263442" : "#252c37",
						border: n.style === e ? "2px solid #58a8de" : "1px solid #303846",
						color: "var(--text-muted)"
					},
					children: e
				}, e))
			}),
			/* @__PURE__ */ T("input", {
				type: "color",
				value: n.color,
				onChange: (e) => r({ color: e.target.value })
			}),
			/* @__PURE__ */ E("label", {
				className: "flex flex-col gap-1 text-xs",
				style: { color: "var(--text-muted)" },
				children: [
					"Angle — ",
					Math.round(n.angle * 180 / Math.PI),
					"°",
					/* @__PURE__ */ T("input", {
						type: "range",
						min: 0,
						max: 2 * Math.PI,
						step: .01,
						value: n.angle,
						className: "kittl-range",
						onChange: (e) => r({ angle: Number(e.target.value) })
					})
				]
			}),
			/* @__PURE__ */ E("label", {
				className: "flex flex-col gap-1 text-xs",
				style: { color: "var(--text-muted)" },
				children: [
					"Distance — ",
					Math.round(n.distance * 100),
					"%",
					/* @__PURE__ */ T("input", {
						type: "range",
						min: 0,
						max: .5,
						step: .005,
						value: n.distance,
						className: "kittl-range",
						onChange: (e) => r({ distance: Number(e.target.value) })
					})
				]
			}),
			n.style === "drop" && /* @__PURE__ */ E("label", {
				className: "flex flex-col gap-1 text-xs",
				style: { color: "var(--text-muted)" },
				children: ["Blur", /* @__PURE__ */ T("input", {
					type: "number",
					min: 0,
					value: n.blur ?? 4,
					onChange: (e) => r({ blur: Number(e.target.value) }),
					className: "kittl-input"
				})]
			}),
			n.style === "line" && /* @__PURE__ */ E("label", {
				className: "flex flex-col gap-1 text-xs",
				style: { color: "var(--text-muted)" },
				children: ["Thickness", /* @__PURE__ */ T("input", {
					type: "number",
					min: 0,
					value: n.thickness ?? 2,
					onChange: (e) => r({ thickness: Number(e.target.value) }),
					className: "kittl-input"
				})]
			})
		] })]
	});
}
//#endregion
//#region src/ui/PropertiesPanel.tsx
var Hh = [
	"normal",
	"multiply",
	"screen",
	"overlay",
	"darken",
	"lighten"
], Uh = [
	"inside",
	"center",
	"outside"
], Wh = [
	"shadow",
	"glow",
	"outline",
	"blur",
	"extrude3d",
	"custom"
], Gh = Object.keys(Kl);
function Kh(e) {
	switch (e) {
		case "shadow": return {
			type: e,
			color: "#000000",
			blur: 4,
			offset: [2, 2],
			alpha: .5
		};
		case "text-shadow": return Rh;
		case "glow": return {
			type: "glow",
			color: "#ffffff",
			strength: 2,
			outer: !0
		};
		case "outline": return {
			type: "outline",
			color: "#000000",
			thickness: 2
		};
		case "blur": return {
			type: "blur",
			amount: 4
		};
		case "extrude3d": return {
			type: "extrude3d",
			depth: 4,
			angle: Math.PI / 4,
			color: "#000000"
		};
		case "custom": return {
			type: "custom",
			shaderId: Gh[0] ?? "",
			uniforms: { strength: 2 }
		};
	}
}
function qh(e) {
	return e.type === "shape" || e.type === "text";
}
function Jh(e, t) {
	return e.type === "solid" ? e.color : e.type === "texture" ? "#000000" : e.stops[t]?.color ?? "#000000";
}
function Yh(e, t, n) {
	if (e.type !== "linear-gradient" && e.type !== "radial-gradient") return e;
	let r = [...e.stops];
	return r[t] = {
		...r[t] ?? { offset: t },
		color: n
	}, {
		...e,
		stops: r
	};
}
function Xh(e) {
	if (e.selectedNodeIds.size !== 1) return null;
	let [t] = e.selectedNodeIds, n = Su(e);
	return n ? Xc(n.children, t)?.node ?? null : null;
}
function Zh() {
	let e = Eu(), t = $((e) => e.activePageId), n = $((e) => e.selectedNodeIds), r = $(Xh);
	if (n.size !== 1 || !r) return null;
	let i = (n) => {
		e.getState().dispatch({
			type: "UpdateProps",
			pageId: t,
			nodeId: r.id,
			patch: n
		});
	};
	return /* @__PURE__ */ E(w, { children: [
		/* @__PURE__ */ E("section", {
			className: "kittl-section",
			children: [/* @__PURE__ */ E("div", {
				className: "mb-2 flex items-center justify-between",
				children: [/* @__PURE__ */ T("span", {
					className: "kittl-section-title mb-0",
					children: "Layer"
				}), /* @__PURE__ */ E("span", {
					className: "text-xs",
					style: { color: "var(--text-muted)" },
					children: [Math.round(r.opacity * 100), "%"]
				})]
			}), /* @__PURE__ */ T("input", {
				type: "range",
				min: 0,
				max: 1,
				step: .01,
				value: r.opacity,
				className: "kittl-range w-full",
				onPointerDown: () => e.getState().beginGesture("opacity"),
				onPointerUp: () => e.getState().endGesture(),
				onChange: (e) => i({ opacity: Number(e.target.value) })
			})]
		}),
		qh(r) && /* @__PURE__ */ E("section", {
			className: "kittl-section",
			children: [/* @__PURE__ */ T("div", {
				className: "kittl-section-title",
				children: "Text Colors"
			}), /* @__PURE__ */ T(ig, {
				fill: r.fill,
				onChange: (e) => i({ fill: e })
			})]
		}),
		r.type === "shape" && /* @__PURE__ */ T(Qh, {
			title: "Border",
			children: /* @__PURE__ */ T(ag, {
				stroke: r.stroke,
				onChange: (e) => i({ stroke: e })
			})
		}),
		r.type === "text" && /* @__PURE__ */ T(cg, {
			node: r,
			onChange: (e) => i(e)
		}),
		r.type === "text" && /* @__PURE__ */ T(Lh, {
			node: r,
			activePageId: t
		}),
		r.type === "image" && /* @__PURE__ */ T(Qh, {
			title: "Image",
			children: /* @__PURE__ */ T(ng, {
				node: r,
				onChange: (e) => i(e)
			})
		}),
		r.type === "svg" && /* @__PURE__ */ T(Qh, {
			title: "Recolor",
			children: /* @__PURE__ */ T(rg, {
				node: r,
				onChange: (e) => i(e)
			})
		}),
		r.type === "text" && /* @__PURE__ */ T(Qh, {
			title: "Text Shadow",
			children: /* @__PURE__ */ T(Vh, {
				node: r,
				onChange: (e) => i({ effects: e })
			})
		}),
		/* @__PURE__ */ T(Qh, {
			title: "Effects",
			children: /* @__PURE__ */ T(eg, {
				effects: r.effects,
				onChange: (e) => i({ effects: e }),
				excludeShadow: r.type === "text"
			})
		}),
		/* @__PURE__ */ T("section", {
			className: "kittl-section",
			children: /* @__PURE__ */ E("label", {
				className: "flex flex-col gap-1",
				children: [/* @__PURE__ */ T("span", {
					className: "kittl-section-title",
					children: "Blend Mode"
				}), /* @__PURE__ */ T("select", {
					value: r.blendMode ?? "normal",
					onChange: (e) => i({ blendMode: e.target.value }),
					className: "kittl-input w-full",
					children: Hh.map((e) => /* @__PURE__ */ T("option", {
						value: e,
						children: e
					}, e))
				})]
			})
		})
	] });
}
function Qh({ title: e, children: t }) {
	let [n, r] = c(!1);
	return /* @__PURE__ */ E("section", {
		className: "kittl-section",
		children: [/* @__PURE__ */ E("button", {
			type: "button",
			className: "flex w-full items-center justify-between text-left",
			onClick: () => r((e) => !e),
			children: [/* @__PURE__ */ T("span", {
				className: "kittl-section-title mb-0",
				children: e
			}), /* @__PURE__ */ T("span", {
				style: { color: "var(--text-muted)" },
				children: n ? "−" : "+"
			})]
		}), n && /* @__PURE__ */ T("div", {
			className: "mt-3",
			children: t
		})]
	});
}
function $h(e) {
	return (e ?? []).filter((e) => e.type !== "text-shadow");
}
function eg({ effects: e, onChange: t, excludeShadow: n }) {
	let r = e ?? [], i = $h(r), a = n ? Wh.filter((e) => e !== "shadow") : Wh;
	return /* @__PURE__ */ E("fieldset", {
		className: "flex flex-col gap-1",
		children: [
			/* @__PURE__ */ T("legend", {
				className: "font-medium",
				children: "Effects"
			}),
			i.map((e, n) => /* @__PURE__ */ E("div", {
				className: "flex flex-col gap-1 border-t border-gray-200 pt-1",
				children: [/* @__PURE__ */ E("div", {
					className: "flex items-center justify-between",
					children: [/* @__PURE__ */ T("span", { children: e.type }), /* @__PURE__ */ T("button", {
						type: "button",
						onClick: () => t(r.filter((t) => t !== e)),
						className: "text-xs text-gray-500",
						children: "Remove"
					})]
				}), /* @__PURE__ */ T(tg, {
					effect: e,
					onChange: (n) => t(r.map((t) => t === e ? n : t))
				})]
			}, n)),
			/* @__PURE__ */ E("select", {
				value: "",
				onChange: (e) => {
					e.target.value && t([...r, Kh(e.target.value)]);
				},
				className: "rounded border border-gray-300 px-1 py-0.5",
				children: [/* @__PURE__ */ T("option", {
					value: "",
					children: "+ Add Effect"
				}), a.map((e) => /* @__PURE__ */ T("option", {
					value: e,
					children: e
				}, e))]
			})
		]
	});
}
function tg({ effect: e, onChange: t }) {
	switch (e.type) {
		case "shadow": return /* @__PURE__ */ E(w, { children: [/* @__PURE__ */ T("input", {
			type: "color",
			value: e.color,
			onChange: (n) => t({
				...e,
				color: n.target.value
			})
		}), /* @__PURE__ */ T("input", {
			type: "number",
			min: 0,
			value: e.blur,
			onChange: (n) => t({
				...e,
				blur: Number(n.target.value)
			}),
			placeholder: "blur",
			className: "rounded border border-gray-300 px-1 py-0.5"
		})] });
		case "glow": return /* @__PURE__ */ E(w, { children: [
			/* @__PURE__ */ T("input", {
				type: "color",
				value: e.color,
				onChange: (n) => t({
					...e,
					color: n.target.value
				})
			}),
			/* @__PURE__ */ T("input", {
				type: "number",
				min: 0,
				value: e.strength,
				onChange: (n) => t({
					...e,
					strength: Number(n.target.value)
				}),
				placeholder: "strength",
				className: "rounded border border-gray-300 px-1 py-0.5"
			}),
			/* @__PURE__ */ E("label", {
				className: "flex items-center gap-1",
				children: [/* @__PURE__ */ T("input", {
					type: "checkbox",
					checked: e.outer,
					onChange: (n) => t({
						...e,
						outer: n.target.checked
					})
				}), "Outer"]
			})
		] });
		case "outline": return /* @__PURE__ */ E(w, { children: [/* @__PURE__ */ T("input", {
			type: "color",
			value: e.color,
			onChange: (n) => t({
				...e,
				color: n.target.value
			})
		}), /* @__PURE__ */ T("input", {
			type: "number",
			min: 0,
			value: e.thickness,
			onChange: (n) => t({
				...e,
				thickness: Number(n.target.value)
			}),
			placeholder: "thickness",
			className: "rounded border border-gray-300 px-1 py-0.5"
		})] });
		case "blur": return /* @__PURE__ */ T("input", {
			type: "number",
			min: 0,
			value: e.amount,
			onChange: (n) => t({
				...e,
				amount: Number(n.target.value)
			}),
			placeholder: "amount",
			className: "rounded border border-gray-300 px-1 py-0.5"
		});
		case "extrude3d": return /* @__PURE__ */ E(w, { children: [/* @__PURE__ */ T("input", {
			type: "color",
			value: e.color,
			onChange: (n) => t({
				...e,
				color: n.target.value
			})
		}), /* @__PURE__ */ T("input", {
			type: "number",
			min: 0,
			value: e.depth,
			onChange: (n) => t({
				...e,
				depth: Number(n.target.value)
			}),
			placeholder: "depth",
			className: "rounded border border-gray-300 px-1 py-0.5"
		})] });
		case "custom": return /* @__PURE__ */ E(w, { children: [/* @__PURE__ */ T("select", {
			value: e.shaderId,
			onChange: (n) => t({
				...e,
				shaderId: n.target.value
			}),
			className: "rounded border border-gray-300 px-1 py-0.5",
			children: Gh.map((e) => /* @__PURE__ */ T("option", {
				value: e,
				children: e
			}, e))
		}), Object.entries(e.uniforms).map(([n, r]) => /* @__PURE__ */ T("input", {
			type: "number",
			value: Array.isArray(r) ? r[0] : r,
			onChange: (r) => t({
				...e,
				uniforms: {
					...e.uniforms,
					[n]: Number(r.target.value)
				}
			}),
			placeholder: n,
			className: "rounded border border-gray-300 px-1 py-0.5"
		}, n))] });
	}
}
function ng({ node: e, onChange: t }) {
	let n = e.filters ?? {}, r = (e, r) => {
		t({ filters: {
			...n,
			[e]: r
		} });
	};
	return /* @__PURE__ */ E("fieldset", {
		className: "flex flex-col gap-1",
		children: [
			/* @__PURE__ */ T("legend", {
				className: "font-medium",
				children: "Image"
			}),
			/* @__PURE__ */ E("label", {
				className: "flex flex-col gap-1",
				children: ["Brightness", /* @__PURE__ */ T("input", {
					type: "range",
					min: 0,
					max: 2,
					step: .01,
					value: n.brightness ?? 1,
					onChange: (e) => r("brightness", Number(e.target.value))
				})]
			}),
			/* @__PURE__ */ E("label", {
				className: "flex flex-col gap-1",
				children: ["Contrast", /* @__PURE__ */ T("input", {
					type: "range",
					min: 0,
					max: 2,
					step: .01,
					value: n.contrast ?? 1,
					onChange: (e) => r("contrast", Number(e.target.value))
				})]
			}),
			/* @__PURE__ */ E("label", {
				className: "flex flex-col gap-1",
				children: ["Saturation", /* @__PURE__ */ T("input", {
					type: "range",
					min: 0,
					max: 2,
					step: .01,
					value: n.saturation ?? 1,
					onChange: (e) => r("saturation", Number(e.target.value))
				})]
			}),
			/* @__PURE__ */ E("label", {
				className: "flex flex-col gap-1",
				children: ["Blur", /* @__PURE__ */ T("input", {
					type: "range",
					min: 0,
					max: 20,
					step: .5,
					value: n.blur ?? 0,
					onChange: (e) => r("blur", Number(e.target.value))
				})]
			}),
			e.mask ? /* @__PURE__ */ E("div", {
				className: "flex flex-col gap-1 border-t border-gray-200 pt-1",
				children: [/* @__PURE__ */ E("div", {
					className: "flex items-center justify-between",
					children: [/* @__PURE__ */ T("span", { children: "Mask" }), /* @__PURE__ */ T("button", {
						type: "button",
						onClick: () => t({ mask: void 0 }),
						className: "text-xs text-gray-500",
						children: "Remove"
					})]
				}), /* @__PURE__ */ T("input", {
					type: "text",
					placeholder: "node id",
					value: e.mask.ref,
					onChange: (n) => t({ mask: {
						...e.mask,
						ref: n.target.value
					} }),
					className: "rounded border border-gray-300 px-1 py-0.5"
				})]
			}) : /* @__PURE__ */ T("button", {
				type: "button",
				onClick: () => t({ mask: {
					type: "shape",
					ref: ""
				} }),
				className: "rounded bg-gray-100 px-2 py-1",
				children: "Add Mask"
			})
		]
	});
}
function rg({ node: e, onChange: t }) {
	let n = $((t) => {
		let n = t.document.assets[e.assetId];
		return n?.type === "svg" ? n.dataUri : void 0;
	}), [r, i] = c([]);
	a(() => {
		if (!n) return;
		let e = !1;
		return ld(n).then((t) => {
			e || i(fd(t));
		}), () => {
			e = !0;
		};
	}, [n]);
	let o = (n, r) => {
		t({ overrides: {
			...e.overrides,
			[n]: {
				type: "solid",
				color: r
			}
		} });
	};
	return /* @__PURE__ */ E("fieldset", {
		className: "flex flex-col gap-1",
		children: [
			/* @__PURE__ */ T("legend", {
				className: "font-medium",
				children: "Recolor"
			}),
			r.length === 0 && /* @__PURE__ */ T("span", {
				className: "text-xs text-gray-400",
				children: "No labeled (id) elements found"
			}),
			r.map((t) => {
				let n = e.overrides?.[t], r = n?.type === "solid" ? n.color : "#000000";
				return /* @__PURE__ */ E("label", {
					className: "flex items-center justify-between gap-1",
					children: [/* @__PURE__ */ T("span", {
						className: "truncate text-xs",
						title: t,
						children: t
					}), /* @__PURE__ */ T("input", {
						type: "color",
						value: r,
						onChange: (e) => o(t, e.target.value)
					})]
				}, t);
			})
		]
	});
}
function ig({ fill: e, onChange: t }) {
	let n = (n) => {
		n === "solid" ? t({
			type: "solid",
			color: Jh(e, 0)
		}) : n === "linear-gradient" ? t({
			type: "linear-gradient",
			angle: 0,
			stops: [{
				offset: 0,
				color: Jh(e, 0)
			}, {
				offset: 1,
				color: Jh(e, 1)
			}]
		}) : n === "radial-gradient" && t({
			type: "radial-gradient",
			stops: [{
				offset: 0,
				color: Jh(e, 0)
			}, {
				offset: 1,
				color: Jh(e, 1)
			}]
		});
	};
	return /* @__PURE__ */ E("fieldset", {
		className: "flex flex-col gap-2",
		children: [
			/* @__PURE__ */ E("select", {
				value: e.type,
				onChange: (e) => n(e.target.value),
				className: "kittl-input w-full",
				children: [
					/* @__PURE__ */ T("option", {
						value: "solid",
						children: "Solid"
					}),
					/* @__PURE__ */ T("option", {
						value: "linear-gradient",
						children: "Linear Gradient"
					}),
					/* @__PURE__ */ T("option", {
						value: "radial-gradient",
						children: "Radial Gradient"
					})
				]
			}),
			e.type === "solid" && /* @__PURE__ */ E("div", {
				className: "flex items-center gap-2",
				children: [
					/* @__PURE__ */ T("input", {
						type: "color",
						value: e.color,
						onChange: (n) => t({
							...e,
							color: n.target.value
						})
					}),
					/* @__PURE__ */ T("span", {
						className: "text-xs uppercase",
						style: { color: "var(--text-muted)" },
						children: e.color.replace("#", "")
					}),
					/* @__PURE__ */ T("span", {
						className: "text-xs",
						style: { color: "var(--text-muted)" },
						children: "100%"
					})
				]
			}),
			(e.type === "linear-gradient" || e.type === "radial-gradient") && /* @__PURE__ */ E(w, { children: [/* @__PURE__ */ E("div", {
				className: "flex gap-1",
				children: [/* @__PURE__ */ T("input", {
					type: "color",
					value: Jh(e, 0),
					onChange: (n) => t(Yh(e, 0, n.target.value))
				}), /* @__PURE__ */ T("input", {
					type: "color",
					value: Jh(e, 1),
					onChange: (n) => t(Yh(e, 1, n.target.value))
				})]
			}), e.type === "linear-gradient" && /* @__PURE__ */ E("label", {
				className: "flex flex-col gap-1",
				children: ["Angle", /* @__PURE__ */ T("input", {
					type: "number",
					value: Math.round(e.angle * 180 / Math.PI),
					onChange: (n) => t({
						...e,
						angle: Number(n.target.value) * Math.PI / 180
					}),
					className: "rounded border border-gray-300 px-1 py-0.5"
				})]
			})] })
		]
	});
}
function ag({ stroke: e, onChange: t }) {
	return e ? /* @__PURE__ */ E("fieldset", {
		className: "flex flex-col gap-1",
		children: [
			/* @__PURE__ */ E("legend", {
				className: "flex items-center justify-between font-medium",
				children: ["Stroke", /* @__PURE__ */ T("button", {
					type: "button",
					onClick: () => t(void 0),
					className: "text-xs text-gray-500",
					children: "Remove"
				})]
			}),
			/* @__PURE__ */ E("label", {
				className: "flex flex-col gap-1",
				children: ["Width", /* @__PURE__ */ T("input", {
					type: "number",
					min: 0,
					value: e.width,
					onChange: (n) => t({
						...e,
						width: Number(n.target.value)
					}),
					className: "rounded border border-gray-300 px-1 py-0.5"
				})]
			}),
			/* @__PURE__ */ T("input", {
				type: "color",
				value: e.fill.type === "solid" ? e.fill.color : "#000000",
				onChange: (n) => t({
					...e,
					fill: {
						type: "solid",
						color: n.target.value
					}
				})
			}),
			/* @__PURE__ */ E("label", {
				className: "flex flex-col gap-1",
				children: ["Align", /* @__PURE__ */ T("select", {
					value: e.align,
					onChange: (n) => t({
						...e,
						align: n.target.value
					}),
					className: "rounded border border-gray-300 px-1 py-0.5",
					children: Uh.map((e) => /* @__PURE__ */ T("option", {
						value: e,
						children: e
					}, e))
				})]
			}),
			(e.layers ?? []).map((n, r) => /* @__PURE__ */ E("div", {
				className: "flex flex-col gap-1 border-t border-gray-200 pt-1",
				children: [
					/* @__PURE__ */ E("div", {
						className: "flex items-center justify-between",
						children: [/* @__PURE__ */ E("span", { children: ["Layer ", r + 2] }), /* @__PURE__ */ T("button", {
							type: "button",
							onClick: () => t({
								...e,
								layers: e.layers?.filter((e, t) => t !== r)
							}),
							className: "text-xs text-gray-500",
							children: "Remove"
						})]
					}),
					/* @__PURE__ */ T("input", {
						type: "number",
						min: 0,
						value: n.width,
						onChange: (n) => t({
							...e,
							layers: e.layers?.map((e, t) => t === r ? {
								...e,
								width: Number(n.target.value)
							} : e)
						}),
						className: "rounded border border-gray-300 px-1 py-0.5"
					}),
					/* @__PURE__ */ T("input", {
						type: "color",
						value: n.fill.type === "solid" ? n.fill.color : "#000000",
						onChange: (n) => t({
							...e,
							layers: e.layers?.map((e, t) => t === r ? {
								...e,
								fill: {
									type: "solid",
									color: n.target.value
								}
							} : e)
						})
					}),
					/* @__PURE__ */ E("div", {
						className: "flex gap-1",
						children: [/* @__PURE__ */ T("input", {
							type: "number",
							placeholder: "offset x",
							value: n.offset?.[0] ?? 0,
							onChange: (n) => t({
								...e,
								layers: e.layers?.map((e, t) => t === r ? {
									...e,
									offset: [Number(n.target.value), e.offset?.[1] ?? 0]
								} : e)
							}),
							className: "w-1/2 rounded border border-gray-300 px-1 py-0.5"
						}), /* @__PURE__ */ T("input", {
							type: "number",
							placeholder: "offset y",
							value: n.offset?.[1] ?? 0,
							onChange: (n) => t({
								...e,
								layers: e.layers?.map((e, t) => t === r ? {
									...e,
									offset: [e.offset?.[0] ?? 0, Number(n.target.value)]
								} : e)
							}),
							className: "w-1/2 rounded border border-gray-300 px-1 py-0.5"
						})]
					})
				]
			}, r)),
			/* @__PURE__ */ T("button", {
				type: "button",
				onClick: () => t({
					...e,
					layers: [...e.layers ?? [], {
						width: e.width,
						fill: {
							type: "solid",
							color: "#000000"
						},
						offset: [0, 0]
					}]
				}),
				className: "rounded bg-gray-100 px-2 py-1 text-xs",
				children: "+ Layer"
			})
		]
	}) : /* @__PURE__ */ T("button", {
		type: "button",
		onClick: () => t({
			fill: {
				type: "solid",
				color: "#000000"
			},
			width: 1,
			align: "center"
		}),
		className: "rounded bg-gray-100 px-2 py-1",
		children: "Add Stroke"
	});
}
var og = .01;
function sg(e, t) {
	if (!t) return null;
	let n = Gf(e, t);
	return Math.abs(n.width - e.size.width) < og && Math.abs(n.height - e.size.height) < og ? null : n;
}
function cg({ node: e, onChange: t }) {
	let n = Eu(), r = Sd(), i = (n) => {
		let r = {
			...e,
			...n
		}, i = Cd(r.font.family)?.font;
		t(i ? {
			...n,
			size: Gf(r, i)
		} : n);
	};
	return a(() => {
		let t = e.id;
		return wd((e) => {
			let r = n.getState(), i = Xc(Su(r)?.children ?? [], t)?.node;
			if (!i || i.type !== "text" || i.font.family !== e) return;
			let a = Cd(e)?.font;
			a && r.dispatch({
				type: "UpdateProps",
				pageId: r.activePageId,
				nodeId: t,
				patch: { size: Gf(i, a) }
			});
		});
	}, [e.id, n]), a(() => {
		let t = sg(e, Cd(e.font.family)?.font ?? null);
		if (!t) return;
		let r = n.getState();
		r.dispatch({
			type: "UpdateProps",
			pageId: r.activePageId,
			nodeId: e.id,
			patch: { size: t }
		});
	}, [e.id]), /* @__PURE__ */ E("section", {
		className: "kittl-section",
		children: [
			/* @__PURE__ */ T("div", {
				className: "kittl-section-title",
				children: "Text Style"
			}),
			/* @__PURE__ */ T("label", {
				className: "mb-2 flex flex-col gap-1",
				children: /* @__PURE__ */ T("textarea", {
					value: e.text,
					rows: 2,
					onChange: (e) => i({ text: e.target.value }),
					className: "kittl-input-sm resize-none"
				})
			}),
			/* @__PURE__ */ T("label", {
				className: "mb-2 flex flex-col gap-1",
				children: /* @__PURE__ */ T("select", {
					value: e.font.family,
					onChange: (t) => i({ font: {
						...e.font,
						family: t.target.value
					} }),
					className: "kittl-input w-full",
					children: r.map((e) => /* @__PURE__ */ T("option", {
						value: e,
						children: e
					}, e))
				})
			}),
			/* @__PURE__ */ T("label", {
				className: "mb-2 flex flex-col gap-1",
				children: /* @__PURE__ */ E("select", {
					value: e.font.weight,
					onChange: (t) => i({ font: {
						...e.font,
						weight: Number(t.target.value)
					} }),
					className: "kittl-input w-full",
					children: [/* @__PURE__ */ T("option", {
						value: 400,
						children: "Regular"
					}), /* @__PURE__ */ T("option", {
						value: 700,
						children: "Bold"
					})]
				})
			}),
			/* @__PURE__ */ E("div", {
				className: "mb-2 grid grid-cols-3 gap-2",
				children: [
					/* @__PURE__ */ E("label", {
						className: "flex flex-col gap-1 text-xs",
						style: { color: "var(--text-muted)" },
						children: ["Tt", /* @__PURE__ */ T("input", {
							type: "number",
							min: 1,
							value: e.font.size,
							onChange: (t) => i({ font: {
								...e.font,
								size: Math.max(1, Number(t.target.value))
							} }),
							className: "kittl-input-sm w-full"
						})]
					}),
					/* @__PURE__ */ E("label", {
						className: "flex flex-col gap-1 text-xs",
						style: { color: "var(--text-muted)" },
						children: ["AV", /* @__PURE__ */ T("input", {
							type: "number",
							step: .5,
							value: e.letterSpacing,
							onChange: (e) => i({ letterSpacing: Number(e.target.value) }),
							className: "kittl-input-sm w-full"
						})]
					}),
					/* @__PURE__ */ E("label", {
						className: "flex flex-col gap-1 text-xs",
						style: { color: "var(--text-muted)" },
						children: ["↕", /* @__PURE__ */ T("input", {
							type: "number",
							min: .1,
							step: .1,
							value: Math.round(e.lineHeight * 100),
							onChange: (e) => i({ lineHeight: Math.max(.1, Number(e.target.value) / 100) }),
							className: "kittl-input-sm w-full"
						})]
					})
				]
			}),
			/* @__PURE__ */ T("div", {
				className: "flex gap-1",
				children: [
					"left",
					"center",
					"right"
				].map((t) => /* @__PURE__ */ T("button", {
					type: "button",
					className: `kittl-inspector-btn flex-1 ${e.align === t ? "active" : ""}`,
					onClick: () => i({ align: t }),
					children: t[0].toUpperCase()
				}, t))
			})
		]
	});
}
//#endregion
//#region src/ui/InspectorPanel.tsx
var lg = [
	1,
	2,
	3,
	4
];
function ug() {
	let e = Eu(), t = $((e) => e.selectedNodeIds.size), n = $(Xh), r = $((e) => e.document.meta.title), i = lh(e, null), { onExport: a } = Mu(), [o, s] = c(1);
	return /* @__PURE__ */ E("aside", {
		className: "flex min-h-0 flex-col overflow-y-auto border-l text-sm",
		style: {
			background: "var(--inspector-bg)",
			borderColor: "#252d38"
		},
		children: [
			/* @__PURE__ */ E("div", {
				className: "p-3",
				children: [/* @__PURE__ */ E("div", {
					className: "mb-3 flex items-center gap-2",
					children: [
						/* @__PURE__ */ T("div", {
							className: "h-6 w-6 rounded-full",
							style: { background: "#4ba3df" }
						}),
						/* @__PURE__ */ T("select", {
							value: o,
							onChange: (e) => s(Number(e.target.value)),
							className: "kittl-input ml-auto w-14 text-xs",
							children: lg.map((e) => /* @__PURE__ */ E("option", {
								value: e,
								children: [e, "×"]
							}, e))
						}),
						/* @__PURE__ */ T("button", {
							type: "button",
							className: "rounded-md px-3 py-1 text-xs font-medium",
							style: {
								background: "#f2f2f2",
								color: "#20242b"
							},
							onClick: () => a?.("png", o),
							children: "Export"
						})
					]
				}), /* @__PURE__ */ T("input", {
					type: "text",
					value: r,
					readOnly: !0,
					className: "kittl-input w-full",
					style: { background: "#1a202a" }
				})]
			}),
			t >= 2 && /* @__PURE__ */ E("section", {
				className: "kittl-section",
				children: [/* @__PURE__ */ T("div", {
					className: "kittl-section-title",
					children: "Alignment"
				}), /* @__PURE__ */ T("div", {
					className: "flex flex-wrap gap-1",
					children: [
						["left", ym],
						["center", jm],
						["right", _m],
						["top", bm],
						["middle", xm],
						["bottom", vm]
					].map(([e, t]) => /* @__PURE__ */ T("button", {
						type: "button",
						className: "kittl-inspector-btn",
						title: e,
						onClick: () => i.alignSelection(e),
						children: /* @__PURE__ */ T(t, { size: 14 })
					}, e))
				})]
			}),
			t === 1 && n && /* @__PURE__ */ E("section", {
				className: "kittl-section",
				children: [/* @__PURE__ */ T("div", {
					className: "kittl-section-title",
					children: "Transform px"
				}), /* @__PURE__ */ E("div", {
					className: "flex gap-2",
					children: [/* @__PURE__ */ E("label", {
						className: "flex flex-1 items-center gap-2",
						children: [/* @__PURE__ */ T("span", {
							style: { color: "var(--text-muted)" },
							children: "W"
						}), /* @__PURE__ */ T("input", {
							type: "number",
							readOnly: !0,
							value: Math.round(n.size.width),
							className: "kittl-input w-full"
						})]
					}), /* @__PURE__ */ E("label", {
						className: "flex flex-1 items-center gap-2",
						children: [/* @__PURE__ */ T("span", {
							style: { color: "var(--text-muted)" },
							children: "H"
						}), /* @__PURE__ */ T("input", {
							type: "number",
							readOnly: !0,
							value: Math.round(n.size.height),
							className: "kittl-input w-full"
						})]
					})]
				})]
			}),
			/* @__PURE__ */ T(Zh, {}),
			t === 0 && /* @__PURE__ */ T("div", {
				className: "p-4 text-xs",
				style: { color: "var(--text-muted)" },
				children: "Select an object to edit properties"
			})
		]
	});
}
//#endregion
//#region src/services/svgSerializer.ts
var dg = 0;
function fg(e, t) {
	if (e.type === "solid") {
		let t = e.alpha === void 0 ? "" : ` fill-opacity="${e.alpha}"`;
		return `fill="${e.color}"${t}`;
	}
	if (e.type === "texture") return "fill=\"#888888\"";
	let n = `grad-${dg++}`, r = e.stops.map((e) => `<stop offset="${e.offset}" stop-color="${e.color}"${e.alpha === void 0 ? "" : ` stop-opacity="${e.alpha}"`}/>`).join("");
	if (e.type === "linear-gradient") {
		let i = e.angle, a = .5 + Math.cos(i) * .5, o = .5 + Math.sin(i) * .5, s = .5 - Math.cos(i) * .5, c = .5 - Math.sin(i) * .5;
		t.push(`<linearGradient id="${n}" x1="${s}" y1="${c}" x2="${a}" y2="${o}">${r}</linearGradient>`);
	} else t.push(`<radialGradient id="${n}">${r}</radialGradient>`);
	return `fill="url(#${n})"`;
}
function pg(e, t, n, r) {
	let i = r / 2, a = [];
	for (let o = 0; o < n * 2; o++) {
		let s = o % 2 == 0 ? r : i, c = Math.PI * o / n - Math.PI / 2;
		a.push(`${e + Math.cos(c) * s},${t + Math.sin(c) * s}`);
	}
	return a.join(" ");
}
function mg(e, t) {
	let { width: n, height: r } = e.size, i = fg(e.fill, t);
	switch (e.shape) {
		case "rect": return e.cornerRadius ? `<rect width="${n}" height="${r}" rx="${e.cornerRadius}" ${i}/>` : `<rect width="${n}" height="${r}" ${i}/>`;
		case "ellipse": return `<ellipse cx="${n / 2}" cy="${r / 2}" rx="${n / 2}" ry="${r / 2}" ${i}/>`;
		case "polygon": return `<polygon points="${(e.points ?? [
			0,
			0,
			n,
			0,
			n / 2,
			r
		]).reduce((e, t, n) => (n % 2 == 0 ? e.push(`${t}`) : e[e.length - 1] += `,${t}`, e), []).join(" ")}" ${i}/>`;
		case "star": return `<polygon points="${pg(n / 2, r / 2, 5, Math.min(n, r) / 2)}" ${i}/>`;
		case "line": return `<line x1="0" y1="0" x2="${n}" y2="${r}" stroke="${e.fill.type === "solid" ? e.fill.color : "#000000"}"/>`;
		case "path": return `<rect width="${n}" height="${r}" ${i}/>`;
	}
}
function hg(e) {
	let { transform: t, size: n } = e, r = t.originX ?? 0, i = t.originY ?? 0, a = r * n.width, o = i * n.height, s = t.rotation * 180 / Math.PI;
	return `translate(${t.x} ${t.y}) rotate(${s}) scale(${t.scaleX} ${t.scaleY}) translate(${-a} ${-o})`;
}
function gg(e) {
	let t = e.opacity === 1 ? "" : ` opacity="${e.opacity}"`, n = e.blendMode && e.blendMode !== "normal" ? ` style="mix-blend-mode:${e.blendMode}"` : "";
	return ` transform="${hg(e)}"${t}${n}`;
}
function _g(e) {
	let t = [`M ${e[0]} ${e[1]}`];
	for (let n = 2; n + 5 < e.length; n += 6) t.push(`C ${e[n]} ${e[n + 1]} ${e[n + 2]} ${e[n + 3]} ${e[n + 4]} ${e[n + 5]}`);
	return t.push("Z"), t.join(" ");
}
var vg = 0;
function yg(e, t, n) {
	let r = `text-shadow-${vg++}`, i = e.distance * t, a = Math.cos(e.angle) * i, o = Math.sin(e.angle) * i, s = e.blur ?? 4;
	return n.push(`<filter id="${r}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur in="SourceAlpha" stdDeviation="${s / 2}"/><feOffset dx="${a}" dy="${o}" result="offsetblur"/><feFlood flood-color="${e.color}"/><feComposite in2="offsetblur" operator="in"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>`), r;
}
function bg(e, t, n) {
	return Jf(t, e, n).map((t) => {
		let n = t.shapes.map((e) => [e.outer, ...e.holes].map(_g).join(" ")).join(" ");
		return t.mode === "stroke" ? `<path d="${n}" fill="none" stroke="${e.color}" stroke-width="${e.thickness ?? 2}"/>` : `<path d="${n}" fill="${e.color}" fill-rule="nonzero"/>`;
	}).join("");
}
function xg(e, t) {
	let n = Cd(e.font.family);
	if (!n) return "";
	let r = Vf(e, n.font).shapes;
	if (r.length === 0) return "";
	let i = r.map((e) => [e.outer, ...e.holes].map(_g).join(" ")).join(" "), a = Kf(e.effects), o = "", s = "";
	return a?.style === "drop" ? s = ` filter="url(#${yg(a, e.font.size, t)})"` : a && (o = bg(a, r, e.font.size)), `${o}<path d="${i}" fill-rule="nonzero" ${fg(e.fill, t)}${s}/>`;
}
function Sg(e, t, n, r) {
	if (!e.visible) return "";
	if (e.type === "svg") {
		let t = r?.[e.id];
		return t ? `<image${gg(e)} width="${e.size.width}" height="${e.size.height}" href="${t}"/>` : "";
	}
	if (e.type === "image") {
		let n = Bu(e.assetId, t);
		return `<image${gg(e)} width="${e.size.width}" height="${e.size.height}" href="${n}"/>`;
	}
	if (e.type === "text") {
		let t = xg(e, n);
		return t ? `<g${gg(e)}>${t}</g>` : "";
	}
	if (e.type === "group") {
		let i = e.children.map((e) => Sg(e, t, n, r)).join("");
		return `<g${gg(e)}>${i}</g>`;
	}
	return `<g${gg(e)}>${mg(e, n)}</g>`;
}
//#endregion
//#region src/services/exportService.ts
async function Cg(e, t, n, r = 1) {
	return await Gu(), e.renderer.extract.canvas({
		target: t,
		frame: new b(0, 0, n.width, n.height),
		resolution: r
	});
}
async function wg(e, t, n, r = 1) {
	let i = await Cg(e, t, n, r);
	return new Promise((e, t) => {
		i.toBlob((n) => {
			n ? e(n) : t(/* @__PURE__ */ Error("Failed to export PNG"));
		}, "image/png");
	});
}
async function Tg(e, t, n) {
	let r = {}, i = [];
	return $c(t.children, (t) => {
		if (t.type !== "svg") return;
		let a = n.getDisplayObject(t.id);
		a && i.push(e.renderer.extract.base64({
			target: a,
			resolution: 1
		}).then((e) => {
			r[t.id] = e;
		}));
	}), await Promise.all(i), r;
}
async function Eg(e, t, n, r) {
	await Gu();
	let i = await Tg(e, t, r), a = [], o = t.children.map((e) => Sg(e, n, a, i)).join(""), s = a.length > 0 ? `<defs>${a.join("")}</defs>` : "";
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${t.size.width} ${t.size.height}" width="${t.size.width}" height="${t.size.height}">${s}${o}</svg>`;
}
//#endregion
//#region src/services/shortcuts.ts
var Dg = 1, Og = 10, kg = 1.2, Ag = {
	"mod+z": (e) => e.getState().undo(),
	"mod+shift+z": (e) => e.getState().redo(),
	"mod+y": (e) => e.getState().redo(),
	"mod+d": (e) => Bm(e),
	"mod+c": (e) => Vm(e),
	"mod+x": (e) => Hm(e),
	"mod+v": (e) => Um(e),
	delete: (e) => Jm(e),
	backspace: (e) => Jm(e),
	"mod+a": (e) => Qm(e),
	"mod+g": (e) => Ym(e),
	"mod+shift+g": (e) => Zm(e),
	arrowup: (e) => eh(e, 0, -1),
	arrowdown: (e) => eh(e, 0, Dg),
	arrowleft: (e) => eh(e, -1, 0),
	arrowright: (e) => eh(e, Dg, 0),
	"shift+arrowup": (e) => eh(e, 0, -10),
	"shift+arrowdown": (e) => eh(e, 0, Og),
	"shift+arrowleft": (e) => eh(e, -10, 0),
	"shift+arrowright": (e) => eh(e, Og, 0),
	"mod+=": (e) => jg(e, kg),
	"mod++": (e) => jg(e, kg),
	"mod+-": (e) => jg(e, 1 / kg)
};
function jg(e, t) {
	let { camera: n } = e.getState();
	e.getState().setCamera({ zoom: n.zoom * t });
}
function Mg(e) {
	return e instanceof HTMLElement ? e.tagName === "INPUT" || e.tagName === "TEXTAREA" || e.isContentEditable : !1;
}
function Ng(e) {
	let t = [];
	return (e.metaKey || e.ctrlKey) && t.push("mod"), e.shiftKey && t.push("shift"), e.altKey && t.push("alt"), t.push(e.key.toLowerCase()), t.join("+");
}
function Pg(e, t) {
	if (t === !1) return () => {};
	let n = t ? new Set(t) : null, r = (t) => {
		if (Mg(t.target)) return;
		let r = Ng(t);
		if (n && !n.has(r)) return;
		let i = Ag[r];
		i && (t.preventDefault(), i(e));
	};
	return window.addEventListener("keydown", r), () => window.removeEventListener("keydown", r);
}
//#endregion
//#region src/ui/Editor.tsx
function Fg(e) {
	return [e.width, e.height];
}
var Ig = r(function(e, t) {
	let [n] = c(() => {
		let t = xu(gs.parse(e.document));
		return e.viewScale != null && t.getState().setViewScale(e.viewScale), e.initialSelectedNodeIds?.length && $m(t, e.initialSelectedNodeIds), t;
	}), r = s({
		app: null,
		pageContainer: null,
		canvas: null
	}), [i, l] = c(r.current), u = s(null), d = s(e);
	d.current = e, a(() => Pg(n, e.shortcuts), [n, e.shortcuts]), a(() => {
		n.getState().setViewScale(e.viewScale ?? null);
	}, [n, e.viewScale]), a(() => n.subscribe((e, t) => {
		let { onChange: n, onSelectionChange: r, onHistoryChange: i } = d.current;
		e.document !== t.document && n?.(e.document), Cu(e.selectedNodeIds, t.selectedNodeIds) || r?.(Array.from(e.selectedNodeIds)), (e.past !== t.past || e.future !== t.future) && e.lastHistoryAction && i?.({
			canUndo: e.past.length > 0,
			canRedo: e.future.length > 0,
			pastLength: e.past.length,
			reason: e.lastHistoryAction
		});
	}), [n]), o(t, () => ({
		getDocument: () => n.getState().document,
		loadDocument: (e) => {
			let t = gs.parse(e);
			n.setState({
				document: t,
				activePageId: t.pages[0]?.id ?? "",
				selectedNodeIds: /* @__PURE__ */ new Set(),
				lastCommand: null,
				past: [],
				future: [],
				lastHistoryAction: "reset"
			});
		},
		exportCanvas: async (e = 1) => {
			let { app: t, pageContainer: i } = r.current;
			if (!t || !i) throw Error("Editor is not mounted yet");
			let a = n.getState();
			return Cg(t, i, (Su(a) ?? a.document.pages[0]).size, e);
		},
		export: async (e, t = 1) => {
			let { app: i, pageContainer: a } = r.current;
			if (!i || !a) throw Error("Editor is not mounted yet");
			let o = n.getState(), s = o.document, c = Su(o) ?? s.pages[0];
			if (e === "png") return wg(i, a, c.size, t);
			let l = u.current;
			if (!l) throw Error("Editor is not mounted yet");
			let d = await Eg(i, c, s, l);
			return new Blob([d], { type: "image/svg+xml" });
		},
		undo: () => n.getState().undo(),
		redo: () => n.getState().redo(),
		canUndo: () => n.getState().past.length > 0,
		canRedo: () => n.getState().future.length > 0,
		addAsset: (e, t) => n.getState().addAssetRef(e, J.parse(t)),
		addNode: (e, t) => n.getState().dispatch({
			type: "AddNode",
			pageId: t?.pageId ?? n.getState().activePageId,
			node: e,
			parentId: t?.parentId,
			index: t?.index
		}),
		removeNode: (e, t) => n.getState().dispatch({
			type: "RemoveNode",
			pageId: t?.pageId ?? n.getState().activePageId,
			nodeId: e,
			parentId: t?.parentId
		}),
		updateNodeProps: (e, t, r) => n.getState().dispatch({
			type: "UpdateProps",
			pageId: r?.pageId ?? n.getState().activePageId,
			nodeId: e,
			patch: t
		}),
		updateNodeTransform: (e, t, r) => n.getState().dispatch({
			type: "UpdateTransform",
			pageId: r?.pageId ?? n.getState().activePageId,
			nodeId: e,
			patch: t
		}),
		reorderNode: (e, t, r) => n.getState().dispatch({
			type: "Reorder",
			pageId: r?.pageId ?? n.getState().activePageId,
			nodeId: e,
			to: t,
			parentId: r?.parentId
		}),
		selectNode: (e) => $m(n, e),
		groupSelection: () => Ym(n),
		ungroupSelection: () => Zm(n),
		deleteSelection: () => Jm(n),
		duplicateSelection: () => Bm(n),
		copySelection: () => Vm(n),
		cutSelection: () => Hm(n),
		pasteClipboard: () => Um(n)
	}), [n]);
	let f = async (e) => {
		e.preventDefault();
		let t = e.dataTransfer.getData(Ch), { canvas: i } = r.current, a = n.getState().document.assets[t];
		if (!t || !i || !a || a.type !== "image" && a.type !== "svg") return;
		let o = kp(i, () => n.getState().camera).toWorld({
			x: e.clientX,
			y: e.clientY
		}), s = a.type === "svg" ? oh(t, ...Fg(sh(await ld(a.dataUri)))) : rh(t, ...Fg(await ah(a.dataUri)));
		s.transform.x = o.x, s.transform.y = o.y, n.getState().dispatch({
			type: "AddNode",
			pageId: n.getState().activePageId,
			node: s
		}), n.getState().select(s.id);
	}, p = e.chrome !== !1, m = /* @__PURE__ */ E("div", {
		className: "relative select-none",
		onDragOver: (e) => e.preventDefault(),
		onDrop: (e) => void f(e),
		children: [
			/* @__PURE__ */ T(Sp, {
				reconcilerRef: u,
				onReady: (e, t) => {
					let n = {
						app: e,
						pageContainer: t,
						canvas: e.canvas
					};
					r.current = n, l(n);
				}
			}),
			/* @__PURE__ */ T(Qp, {}),
			p && /* @__PURE__ */ T(dh, {})
		]
	});
	return /* @__PURE__ */ T(Tu, {
		value: n,
		children: /* @__PURE__ */ T(ju, {
			devMenu: e.devMenu ?? null,
			onExport: e.onExport ?? null,
			onNodeDoubleClick: e.onNodeDoubleClick ?? null,
			children: /* @__PURE__ */ T(Ou, {
				value: i,
				children: p ? /* @__PURE__ */ E("div", {
					className: `df-editor grid h-full w-full overflow-hidden ${e.className ?? ""}`,
					style: {
						gridTemplateColumns: "44px minmax(0, 1fr) 250px",
						background: "var(--app-bg)"
					},
					children: [
						/* @__PURE__ */ T(fh, {}),
						/* @__PURE__ */ T(kh, { children: m }),
						/* @__PURE__ */ T(ug, {})
					]
				}) : /* @__PURE__ */ T("div", {
					className: `df-editor relative inline-block align-top ${e.className ?? ""}`,
					children: m
				})
			})
		})
	});
});
//#endregion
//#region src/services/headlessRender.ts
async function Lg(e, t, n) {
	let r = new l();
	await r.init({
		width: e.size.width,
		height: e.size.height,
		background: yp(e.background),
		backgroundAlpha: bp(e.background),
		antialias: !0
	});
	let i = new f();
	r.stage.addChild(i);
	let a = new op(i);
	a.mount(e, t);
	try {
		return await n(r, i, a);
	} finally {
		a.destroy(), r.destroy(!0);
	}
}
function Rg(e, t, n = 1) {
	return Lg(e, t, (t, r) => wg(t, r, e.size, n));
}
function zg(e, t) {
	return Lg(e, t, (n, r, i) => Eg(n, e, t, i));
}
//#endregion
export { J as AssetRefSchema, Zo as BaseNodeSchema, Xo as BaseNodeShape, qo as BlendModeSchema, as as CircleParamsSchema, hs as DocumentMetaSchema, gs as DocumentSchema, Ig as Editor, Ko as EffectSchema, $o as FillSchema, Qo as GradientStopSchema, ds as GroupNodeSchema, cs as ImageNodeSchema, fs as NodeSchema, ps as PageBackgroundSchema, ms as PageSchema, ss as ShapeNodeSchema, Yo as SizeSchema, es as StrokeSchema, ls as SvgNodeSchema, us as TextNodeSchema, Jo as TransformSchema, ns as WarpAnchorSchema, rs as WarpPathSchema, os as WarpSchema, is as WarpTypeSchema, Cd as getLoadedFont, Td as loadFont, Gf as measureText, wd as onFontLoaded, xd as registerFont, Sd as registeredFamilies, Rg as renderPageToPng, zg as renderPageToSvg };
