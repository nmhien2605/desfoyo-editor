import opentype from 'opentype.js';

export interface LoadedFont {
  family: string;
  font: opentype.Font;
}

type Source = { kind: 'url'; url: string } | { kind: 'buffer'; buffer: ArrayBuffer };

const sources = new Map<string, Source>();
const loaded = new Map<string, LoadedFont>();
const pending = new Map<string, Promise<LoadedFont | null>>();
const listeners = new Set<(family: string) => void>();

// Thư viện không ship font nào. Ứng dụng nhúng editor (và demo/main.tsx) tự
// khai báo font của mình ở đây — `source` là URL (Vite `?url` import) hoặc
// ArrayBuffer sẵn có (test đọc thẳng từ đĩa).
export function registerFont(family: string, source: string | ArrayBuffer): void {
  sources.set(
    family,
    typeof source === 'string' ? { kind: 'url', url: source } : { kind: 'buffer', buffer: source },
  );
}

export function registeredFamilies(): string[] {
  return [...sources.keys()];
}

// Bản đồng bộ cho render path: renderer chạy trong vòng vẽ, không await được.
export function getLoadedFont(family: string): LoadedFont | null {
  return loaded.get(family) ?? null;
}

export function onFontLoaded(cb: (family: string) => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export async function loadFont(family: string): Promise<LoadedFont | null> {
  const cached = loaded.get(family);
  if (cached) return cached;
  const inflight = pending.get(family);
  if (inflight) return inflight;
  const source = sources.get(family);
  if (!source) return null;

  const promise = (async (): Promise<LoadedFont | null> => {
    try {
      const buffer = source.kind === 'buffer' ? source.buffer : await fetchBuffer(source.url);
      const entry: LoadedFont = { family, font: opentype.parse(buffer) };
      loaded.set(family, entry);
      registerFontFace(family, buffer);
      for (const cb of [...listeners]) cb(family);
      return entry;
    } catch (error) {
      // Không ném vào render loop — font hỏng chỉ khiến node không vẽ ra gì,
      // đúng quy ước "silently inert" mà buildFilters.ts dùng cho shaderId lạ.
      console.error(`[desfoyo] khong nap duoc font "${family}"`, error);
      return null;
    } finally {
      pending.delete(family);
    }
  })();

  pending.set(family, promise);
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
function registerFontFace(family: string, buffer: ArrayBuffer): void {
  if (typeof FontFace === 'undefined' || typeof document === 'undefined') return;
  const face = new FontFace(family, buffer);
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
