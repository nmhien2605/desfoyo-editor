# 03 — Tech Stack

Canvas engine đã chốt: **PixiJS (WebGL)**. Dưới đây là stack chi tiết cho từng phần.

## Nền tảng

| Hạng mục            | Lựa chọn                                 | Ghi chú                            |
| ------------------- | ---------------------------------------- | ---------------------------------- |
| Ngôn ngữ            | **TypeScript**                           | Bắt buộc, type-safe toàn bộ model  |
| Build/dev           | **Vite**                                 | Nhanh, hỗ trợ lib mode để đóng gói |
| UI framework        | **React 18+**                            | Yêu cầu của dự án                  |
| Đóng gói lib        | **Vite library mode** + **tsup** (types) | Xuất ESM + type declarations       |
| Monorepo             | **Không dùng** (quyết định)               | Single package, tách theo folder; chỉ tách monorepo khi có nhu cầu thực sự |

## Render engine

| Hạng mục        | Lựa chọn                        | Ghi chú                                                                  |
| --------------- | ------------------------------- | ------------------------------------------------------------------------ |
| Canvas engine   | **PixiJS v8**                   | WebGL/WebGPU, filter/shader mạnh, hiệu năng cao                          |
| React binding   | **binding tự viết** quanh Pixi  | Quyết định: không dùng `@pixi/react` — reconciler tự viết là điểm diff duy nhất (model → Pixi), giữ render layer độc lập React |
| Filters có sẵn  | **pixi-filters**                | Glow, drop-shadow, outline, blur… làm nền cho effect                     |
| Shader tùy biến | **GLSL** (WGSL nếu dùng WebGPU) | Cho warp, 3D extrude, gradient/texture map                               |

> **Lưu ý:** PixiJS v8 hỗ trợ cả WebGL và WebGPU. Bắt đầu với WebGL (tương thích rộng), giữ shader tách biệt để có thể port WGSL sau.

## State & logic core

| Hạng mục          | Lựa chọn                               | Ghi chú                                  |
| ----------------- | -------------------------------------- | ---------------------------------------- |
| State store       | **Zustand**                            | Nhẹ, phù hợp editor, dễ tách slice       |
| Immutable update  | **Immer**                              | `produceWithPatches` → nền cho undo/redo |
| Undo/redo         | **zundo** hoặc command pattern tự viết | Patch-based history + coalesce           |
| Schema/validation | **Zod**                                | Validate + infer type từ schema document |
| ID                | **nanoid**                             | Sinh id node                             |

## Text & font

| Hạng mục       | Lựa chọn                             | Ghi chú                                   |
| -------------- | ------------------------------------ | ----------------------------------------- |
| Đo/parse glyph | **opentype.js**                      | Text-on-path, curved, warp, glyph outline |
| Font metadata  | **fontkit** (tùy chọn)               | Xử lý font nâng cao, subsetting           |
| Nguồn font     | **Google Fonts API** + upload        | Cache qua FontService                     |
| Load runtime   | **FontFace API** / **webfontloader** | Đảm bảo font sẵn trước khi render         |

## Hiệu ứng (Effects)

| Loại                       | Cách làm                                       |
| -------------------------- | ---------------------------------------------- |
| Stroke, shadow, glow, blur | pixi-filters + shader tinh chỉnh               |
| Gradient fill              | Shader gradient (linear/radial/conic)          |
| Texture / image-in-text    | Dùng chữ làm mask, sample texture trong shader |
| Curved / arc / warp        | opentype.js path → deform geometry (mesh)      |
| 3D extrude                 | Sinh mesh nhiều lớp + shading trong shader     |
| Preset                     | Registry JSON mô tả chuỗi filter + params      |

## UI

| Hạng mục                 | Lựa chọn                     | Ghi chú                                  |
| ------------------------ | ---------------------------- | ---------------------------------------- |
| CSS                      | **Tailwind CSS**             | Tiện dựng panel/toolbar                  |
| Component primitives     | **Radix UI** / **shadcn/ui** | Dialog, popover, slider, tabs accessible |
| Kéo-thả (layers, upload) | **dnd-kit**                  | Sắp xếp layer, kéo asset vào canvas      |
| Color picker             | **react-colorful**           | Nhẹ, hỗ trợ gradient stops               |
| Icon                     | **lucide-react**             |                                          |

## Import / Export

| Định dạng        | Công cụ                                        |
| ---------------- | ---------------------------------------------- |
| PNG/JPG          | Pixi `extract` / render offscreen scale cao    |
| SVG (export)     | Serializer riêng từ model → SVG (vector thuần) |
| SVG (import)     | **svgson** parse → map sang node model         |
| PDF              | **pdf-lib** (ghép ảnh/vector, multi-page)      |
| Document (.json) | Serialize model + version                      |

## Backend & hạ tầng (khi cần cloud)

| Hạng mục        | Lựa chọn                                       | Ghi chú                      |
| --------------- | ---------------------------------------------- | ---------------------------- |
| API             | **Node + NestJS** / Fastify                    | Auth, project, template CRUD |
| DB              | **PostgreSQL** + Prisma                        | Metadata, project, user      |
| Lưu asset       | **S3 / Cloudflare R2** + CDN                   | Ảnh, font, thumbnail         |
| Realtime collab | **Yjs** + **y-websocket**, hoặc **Liveblocks** | CRDT, multi-cursor           |
| Auth            | **Auth.js** / Clerk                            | Tùy nhu cầu                  |

## Chất lượng & DevOps

| Hạng mục           | Lựa chọn                                |
| ------------------ | --------------------------------------- |
| Unit test          | **Vitest**                              |
| E2E                | **Playwright**                          |
| Component workshop | **Storybook**                           |
| Lint/format        | **ESLint** + **Prettier**               |
| CI                 | **GitHub Actions**                      |
| Đo hiệu năng       | Pixi devtools + custom FPS/mem profiler |
