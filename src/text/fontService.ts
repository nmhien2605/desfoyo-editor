import opentype from 'opentype.js';

export type FontStyle = 'normal' | 'italic';

export interface FontVariant {
  weight?: number; // mặc định 400
  style?: FontStyle; // mặc định 'normal'
}

export interface LoadedFont {
  family: string;
  font: opentype.Font;
  // Biến thể của FILE đã nạp (theo registerFont), không phải biến thể được hỏi.
  weight: number;
  style: FontStyle;
}

type Source = { kind: 'url'; url: string } | { kind: 'buffer'; buffer: ArrayBuffer };
interface Registered {
  weight: number;
  style: FontStyle;
  source: Source;
}

// family -> (variantKey -> file)
const sources = new Map<string, Map<string, Registered>>();
const loaded = new Map<string, LoadedFont>(); // key: fileKey(family, variant)
const pending = new Map<string, Promise<LoadedFont | null>>();
const listeners = new Set<(family: string) => void>();
const fontVariants = new WeakMap<opentype.Font, { weight: number; style: FontStyle }>();

const variantKey = (weight: number, style: FontStyle) => `${weight}-${style}`;
const fileKey = (family: string, file: Registered) => `${family}|${variantKey(file.weight, file.style)}`;

// Thư viện không ship font nào. Ứng dụng nhúng editor (và demo/main.tsx) tự
// khai báo font của mình ở đây — `source` là URL (Vite `?url` import) hoặc
// ArrayBuffer sẵn có (test đọc thẳng từ đĩa). Mỗi file là MỘT biến thể
// (weight/style) của family; gọi 2 tham số = bản thường 400/normal.
export function registerFont(family: string, source: string | ArrayBuffer, variant: FontVariant = {}): void {
  const weight = variant.weight ?? 400;
  const style = variant.style ?? 'normal';
  let files = sources.get(family);
  if (!files) sources.set(family, (files = new Map()));
  files.set(variantKey(weight, style), {
    weight,
    style,
    source: typeof source === 'string' ? { kind: 'url', url: source } : { kind: 'buffer', buffer: source },
  });
}

export function registeredFamilies(): string[] {
  return [...sources.keys()];
}

// Chọn file khớp nhất theo tinh thần CSS font matching (rút gọn): ưu tiên
// đúng style (italic thiếu thì lùi về normal và ngược lại), rồi weight gần
// nhất; hoà thì lấy file đậm hơn khi hỏi >= 400, nhạt hơn khi hỏi < 400.
function bestFile(family: string, variant: FontVariant = {}): Registered | null {
  const files = sources.get(family);
  if (!files || files.size === 0) return null;
  const weight = variant.weight ?? 400;
  const style = variant.style ?? 'normal';
  const all = [...files.values()];
  const sameStyle = all.filter((file) => file.style === style);
  const pool = sameStyle.length > 0 ? sameStyle : all;
  let best = pool[0];
  for (const file of pool.slice(1)) {
    const d = Math.abs(file.weight - weight);
    const bestD = Math.abs(best.weight - weight);
    const heavierWins = weight >= 400 ? file.weight > best.weight : file.weight < best.weight;
    if (d < bestD || (d === bestD && heavierWins)) best = file;
  }
  return best;
}

// Bản đồng bộ cho render path: renderer chạy trong vòng vẽ, không await được.
// Trả file khớp nhất với `variant` nếu file ĐÓ đã nạp, ngược lại null.
export function getLoadedFont(family: string, variant?: FontVariant): LoadedFont | null {
  const file = bestFile(family, variant);
  return file ? (loaded.get(fileKey(family, file)) ?? null) : null;
}

// Biến thể mà `font` được đăng ký dưới đó; Font không qua loadFont (test tự
// parse) coi là 400/normal.
export function fontVariantOf(font: opentype.Font): { weight: number; style: FontStyle } {
  return fontVariants.get(font) ?? { weight: 400, style: 'normal' };
}

// Font thật sẽ dùng cho `spec` + cờ giả lập khi không có file khớp. `fallback`
// là Font caller đang cầm (thường là getLoadedFont(family) = bản thường):
// - 400/normal: giữ nguyên fallback — tài liệu cũ đo/vẽ y như trước.
// - còn lại: dùng file biến thể khớp nhất NẾU đã nạp, không thì fallback.
// Faux bold khi hỏi >= 600 mà file < 600; faux italic khi hỏi italic mà file normal.
export function resolveFontVariant(
  spec: { family: string; weight: number; style: FontStyle },
  fallback: opentype.Font,
): { font: opentype.Font; fauxBold: boolean; fauxItalic: boolean } {
  const isDefault = spec.weight === 400 && spec.style === 'normal';
  const font = isDefault ? fallback : (getLoadedFont(spec.family, spec)?.font ?? fallback);
  const actual = fontVariantOf(font);
  return {
    font,
    fauxBold: spec.weight >= 600 && actual.weight < 600,
    fauxItalic: spec.style === 'italic' && actual.style !== 'italic',
  };
}

export function onFontLoaded(cb: (family: string) => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

// Nạp file khớp nhất với `variant` (mặc định 400/normal — giữ hành vi cũ của
// loadFont(family)). Host muốn đo/export chữ đậm/nghiêng bằng file thật thì
// gọi thêm loadFont(family, node.font) cho từng biến thể đang dùng.
export async function loadFont(family: string, variant?: FontVariant): Promise<LoadedFont | null> {
  const file = bestFile(family, variant);
  if (!file) return null;
  const key = fileKey(family, file);
  const cached = loaded.get(key);
  if (cached) return cached;
  const inflight = pending.get(key);
  if (inflight) return inflight;
  const { source } = file;

  const promise = (async (): Promise<LoadedFont | null> => {
    try {
      const buffer = source.kind === 'buffer' ? source.buffer : await fetchBuffer(source.url);
      const entry: LoadedFont = { family, font: opentype.parse(buffer), weight: file.weight, style: file.style };
      fontVariants.set(entry.font, { weight: file.weight, style: file.style });
      loaded.set(key, entry);
      registerFontFace(family, buffer, file);
      for (const cb of [...listeners]) cb(family);
      return entry;
    } catch (error) {
      // Không ném vào render loop — font hỏng chỉ khiến node không vẽ ra gì,
      // đúng quy ước "silently inert" mà buildFilters.ts dùng cho shaderId lạ.
      console.error(`[desfoyo] khong nap duoc font "${family}"`, error);
      return null;
    } finally {
      pending.delete(key);
    }
  })();

  pending.set(key, promise);
  return promise;
}

async function fetchBuffer(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status} khi tai ${url}`);
  return response.arrayBuffer();
}

// TextEditOverlay.tsx dùng <textarea> DOM thật, nên cần đúng font đó ở phía
// CSS dưới cùng tên family. Bọc guard vì môi trường test mặc định là 'node',
// không có FontFace lẫn document.
function registerFontFace(family: string, buffer: ArrayBuffer, file: Registered): void {
  if (typeof FontFace === 'undefined' || typeof document === 'undefined') return;
  const face = new FontFace(family, buffer, { weight: String(file.weight), style: file.style });
  void face
    .load()
    .then((ready) => document.fonts.add(ready))
    .catch(() => {});
}

export function resetFontsForTest(): void {
  sources.clear();
  loaded.clear();
  pending.clear();
  listeners.clear();
}
