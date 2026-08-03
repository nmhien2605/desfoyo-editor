// wawoff2@2.0.1's Emscripten glue only assigns `module.exports = Module` inside
// its `if (ENVIRONMENT_IS_NODE)` branch (see node_modules/wawoff2/build/decompress_binding.js).
// In a browser, `require('./build/decompress_binding.js')` (what wawoff2's own
// decompress.js does) therefore returns a disconnected empty object: the real
// internal Emscripten `Module` — the one the WASM runtime actually calls
// `Module.onRuntimeInitialized()` on — is never wired up as the CJS export.
// The result is that `wawoff2.decompress()` hangs forever in any browser
// (verified directly against the raw, unbundled glue file, independent of Vite/
// esbuild — this is an upstream wawoff2 bug, not a bundler artifact).
//
// Workaround: pull in the glue file as raw source text (so no bundler ever
// executes it as a CJS/ESM module) and eval it ourselves, capturing the
// internal `Module` object directly via a `return Module` appended to the
// function body — same scope as the glue's own top-level `var Module`.
import decompressBindingSrc from 'wawoff2/build/decompress_binding.js?raw';

interface EmscriptenModule {
  onRuntimeInitialized?: () => void;
  decompress(buffer: Uint8Array): Uint8Array | false;
}

let modulePromise: Promise<EmscriptenModule> | null = null;

function loadModule(): Promise<EmscriptenModule> {
  if (!modulePromise) {
    modulePromise = new Promise((resolve, reject) => {
      try {
        // eslint-disable-next-line no-new-func -- see file-level comment: this is
        // how we recover the Module reference the glue file never exports.
        const factory = new Function(`${decompressBindingSrc}\nreturn Module;`) as () => EmscriptenModule;
        const mod = factory();
        mod.onRuntimeInitialized = () => resolve(mod);
      } catch (err) {
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    });
  }
  return modulePromise;
}

export async function decompress(buffer: Uint8Array): Promise<Uint8Array> {
  const mod = await loadModule();
  const result = mod.decompress(buffer);
  if (result === false) throw new Error('ConvertWOFF2ToTTF failed');
  return result;
}
