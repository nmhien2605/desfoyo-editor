// Public API of the library.
export * from './schema';
export { Editor } from './ui/Editor';
export type { EditorProps, EditorHandle } from './ui/Editor';
export {
  registerFont,
  loadFont,
  getLoadedFont,
  registeredFamilies,
  onFontLoaded,
} from './text/fontService';
export type { LoadedFont } from './text/fontService';
