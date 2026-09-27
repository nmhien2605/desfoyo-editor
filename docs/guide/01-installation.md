# Cài đặt

## Yêu cầu

- React 19 + ReactDOM 19 (`peerDependencies`).
- `pixi.js` ^8.0.0 (`peerDependency`) — editor render bằng WebGL qua PixiJS, project của bạn phải tự cài package này.
- Node đủ mới để chạy npm/pnpm/yarn hiện đại (package build ESM-only, không có CJS fallback).
- SSH key đã add vào GitHub account có quyền đọc repo `nmhien2605/desfoyo-editor` (repo private).

## 1. Cài package + peer deps

Repo chưa publish lên npm registry — cài trực tiếp từ GitHub repo (private) qua git URL. `npm install`/`pnpm add` sẽ tự chạy script `prepare` trong package để build `dist/` ngay trong `node_modules`, nên không cần bước publish riêng.

```bash
npm install git+ssh://git@github.com/nmhien2605/desfoyo-editor.git pixi.js
```

Dùng pnpm:

```bash
pnpm add git+ssh://git@github.com/nmhien2605/desfoyo-editor.git pixi.js
```

Muốn pin theo tag/commit cụ thể (khuyến nghị cho production, tránh breaking change bất ngờ):

```bash
npm install git+ssh://git@github.com/nmhien2605/desfoyo-editor.git#v0.1.0
```

Không có SSH key setup, dùng HTTPS + Personal Access Token:

```bash
npm install git+https://<token>@github.com/nmhien2605/desfoyo-editor.git
```

## 2. Import CSS

Editor cần một file CSS đi kèm (theme màu, layout panel). Import 1 lần ở entry point của app:

```ts
import '@desfoyo/editor/styles.css';
```

Thiếu bước này thì `<Editor />` vẫn chạy nhưng UI sẽ vỡ layout / không có màu.

File CSS này **không đụng tới phần còn lại của trang**: không có Tailwind preflight, không có rule `body`, mọi biến màu và reset đều nằm dưới class `.df-editor` (container gốc của `Editor`). Chỉ còn các biến nội bộ của Tailwind (`--tw-*`, `--color-*`, `--spacing`…) trên `:root` — giống hệt giá trị mặc định mà Tailwind của host cũng sinh ra, chỉ xung đột nếu host đã tuỳ biến theme Tailwind.

## 3. Verify

```bash
npm ls @desfoyo/editor
```

Import thử trong 1 component để chắc types hoạt động:

```tsx
import { Editor } from '@desfoyo/editor';
```

Nếu editor không mở được / lỗi lúc `npm install`, xem trước [02-usage.md](./02-usage.md) để chắc đang dùng đúng API — các lỗi cài đặt thường gặp:

- **`permission denied (publickey)`** — máy chưa có SSH key add vào GitHub, hoặc account chưa được thêm làm collaborator vào repo private.
- **Peer dependency warning cho `react`/`react-dom`/`pixi.js`** — project host phải tự cài version khớp range trong `peerDependencies` (xem `package.json` của editor), package không tự bundle các lib này.
