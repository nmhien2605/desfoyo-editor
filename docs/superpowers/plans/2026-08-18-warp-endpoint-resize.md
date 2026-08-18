# Warp Endpoint Resize Implementation Plan

> **Kết quả thực tế (2026-08-18):** Task 1 đã triển khai và giữ lại. Task 2
> (dispatch thêm `size`/`transform` qua `computeResize` khi kéo anchor
> đầu/cuối) đã bị **revert** sau final whole-branch review — review phát
> hiện lỗi Critical: `computeResize`'s pivot math giả định local frame co
> giãn theo `node.size.width`, nhưng path ở đây chuẩn hoá theo `box.width`
> (từ `textGeometry()`, cố ý độc lập với `node.size`) — nên `transform.x`
> (từ `computeResize`) và `anchor.x` (theo `box.width` không đổi) cộng dồn
> delta thay vì bù trừ, khiến handle di chuyển ~2x tốc độ con trỏ và lệch xa
> dần khi kéo tiếp. Verify độc lập bằng số cụ thể xác nhận đúng lỗi này.
> Also found: zero `worldDelta.y` trước khi vào `computeResize` sai với node
> đã xoay (hàm tự unrotate bên trong).
>
> Quan trọng hơn: verify riêng cho thấy **chỉ Task 1** đã cho đúng hành vi
> mong muốn (kéo dài path, mép trái bám cursor, mép phải đứng yên) — vì
> `node.size` không hề chi phối việc render text (`buildWarpMap` dùng
> `box.width` từ layout, độc lập `node.size`). Task 2 vừa thừa vừa gây lỗi.
> Người dùng chọn bỏ hẳn Task 2 (revert commit `2d8ab4a`, xem `112b6fc`).

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cho phép kéo tự do 2 anchor đầu/cuối của wave warp path theo trục x (hiện bị `clampPathX` ghim cứng về 0/1), và khi kéo thì `node.size`/`node.transform` của text node resize theo — neo mép đối diện đứng yên trong world space, dùng đúng cơ chế `computeResize` đã có cho các resize handle khác trong app.

**Architecture:** Hai thay đổi độc lập, tách biệt rõ ràng:
1. `clampPathX` (src/text/warp.ts) bỏ việc ghim cứng `anchors[0].x=0`/`anchors[last].x=1`, chỉ còn giữ ràng buộc đơn điệu (anchor giữa không vượt qua anchor hai đầu) — phần này đã verify bằng thực nghiệm là an toàn về mặt toán học cho `buildWarpMap` (arc-length model không đòi hỏi path phủ đúng [0,1]).
2. `WarpHandlesOverlay` khi kéo đúng anchor đầu (index 0) hoặc anchor cuối (index cuối) theo x, coi đó như kéo resize handle `'w'`/`'e'` của node — tái dùng nguyên `computeResize()` (đã có, dùng chung cho SelectionOverlay) để tính `size`/`transform` mới, dispatch thêm `UpdateProps`(size)/`UpdateTransform`(transform) cạnh `UpdateProps`(warp) đang có. **Không đổi gì ở `box.width`/`box.height`** dùng để chuẩn hoá path (`geometry.width/height` từ `textGeometry.ts`, độc lập với `node.size` — giữ nguyên bất biến đã có, tránh vòng lặp phản hồi).

**Tech Stack:** TypeScript, React (component thuần, không thêm dependency), Vitest.

## Global Constraints

- Không đổi `box.width`/`box.height` dùng để chuẩn hoá `warp.paths` — nguồn của nó vẫn là `textGeometry()`/layout chữ, độc lập `node.size` (đúng bất biến ghi ở `src/text/textGeometry.ts:8-14`).
- Chỉ 2 anchor đầu/cuối (index 0 và index cuối) kích hoạt resize khi kéo theo x. Anchor giữa và mọi handle (`in`/`out`) giữ nguyên hành vi cũ (không resize).
- Kéo theo y ở anchor đầu/cuối không đổi gì về resize — vẫn là chỉnh hình path thuần tuý như hiện tại.
- Neo resize theo đúng công thức `computeResize` hiện có (`src/render/interactions/resizeMath.ts`) — không viết lại công thức pivot/world-anchor mới.
- `pnpm test && pnpm exec tsc --noEmit -p tsconfig.build.json && pnpm lint` phải xanh sau mỗi task.

---

### Task 1: `clampPathX` — bỏ ghim x=0/1, chỉ giữ ràng buộc đơn điệu

**Files:**
- Modify: `src/text/warp.ts:118-135` (hàm `clampPathX`)
- Test: `src/ui/__tests__/warpHandles.test.ts:172-252` (block `describe('clampPathX', ...)`)

**Interfaces:**
- Consumes: không có gì mới — `clampPathX(path: WarpPath): WarpPath` giữ nguyên chữ ký.
- Produces: hành vi mới — `anchors[0].x`/`anchors[last].x` không còn bị ép về đúng 0/1; property duy nhất được đảm bảo là đơn điệu (`anchors[i].x` không giảm theo i) và handle mỗi segment bị kẹp trong đoạn `[anchors[i].x, anchors[i+1].x]` như cũ.

- [ ] **Step 1: Đọc hàm hiện tại để đối chiếu**

Nội dung hiện tại của `clampPathX` (`src/text/warp.ts:118-135`):

```ts
export function clampPathX(path: WarpPath): WarpPath {
  const anchors = path.anchors.map((anchor): WarpAnchor => ({ ...anchor }));
  const last = anchors.length - 1;
  if (last < 1) return path;

  // Hai mep ghim o 0 va 1 de f phu tron [0, width].
  anchors[0].x = 0;
  for (let i = 1; i <= last; i++) anchors[i].x = Math.max(anchors[i].x, anchors[i - 1].x);
  anchors[last].x = 1;
  for (let i = last - 1; i >= 1; i--) anchors[i].x = Math.min(anchors[i].x, anchors[i + 1].x);

  for (let i = 0; i < last; i++) {
    const lo = anchors[i].x;
    const hi = anchors[i + 1].x;
    const clamp = (v: number) => Math.min(Math.max(v, lo), hi);
    const out = anchors[i].out;
    if (out) anchors[i].out = { ...out, x: clamp(out.x) };
    const into = anchors[i + 1].in;
    if (into) anchors[i + 1].in = { ...into, x: clamp(into.x) };
  }

  return { ...path, anchors };
}
```

- [ ] **Step 2: Sửa 2 test đầu trong `describe('clampPathX', ...)` để phản ánh hành vi MỚI (test phải fail trên code cũ trước khi sửa code)**

Trong `src/ui/__tests__/warpHandles.test.ts`, thay toàn bộ test `'ghim hai mep o 0 va 1'` (dòng 173-185) bằng:

```ts
  it('anchor dau di chuyen tu do theo x, khong con bi ghim ve 0', () => {
    const moved = movePathPoint(buildWavePath(0.5, 0.8), { anchor: 0, kind: 'anchor' }, {
      x: 0.3,
      y: 0,
    });
    const clamped = clampPathX(moved);
    expect(clamped.anchors[0].x).toBeCloseTo(0.3, 10);
  });

  it('anchor cuoi di chuyen tu do theo x, khong con bi ghim ve 1', () => {
    const moved = movePathPoint(buildWavePath(0.5, 0.8), { anchor: 2, kind: 'anchor' }, {
      x: 0.4,
      y: 0,
    });
    const clamped = clampPathX(moved);
    expect(clamped.anchors[2].x).toBeCloseTo(1.4, 10);
  });

  it('anchor dau khong duoc vuot qua anchor giua (van giu don dieu)', () => {
    const moved = movePathPoint(buildWavePath(0.5, 0.8), { anchor: 0, kind: 'anchor' }, {
      x: 0.9,
      y: 0,
    });
    const clamped = clampPathX(moved);
    expect(clamped.anchors[0].x).toBeLessThanOrEqual(clamped.anchors[1].x);
  });

  it('anchor cuoi khong duoc lui qua anchor giua (van giu don dieu)', () => {
    const moved = movePathPoint(buildWavePath(0.5, 0.8), { anchor: 2, kind: 'anchor' }, {
      x: -0.9,
      y: 0,
    });
    const clamped = clampPathX(moved);
    expect(clamped.anchors[2].x).toBeGreaterThanOrEqual(clamped.anchors[1].x);
  });
```

Các test còn lại trong block này (`'anchor giua khong vuot qua anchor phai'`, `'handle bi keo vuot ra ngoai segment thi bi kep ve bien'`, `'keo anchor xong thi handle KE cua anchor lan can cung duoc kep lai'`, `'B10 — path sau khi kep luon don dieu theo x'`, `'khong dung toi tung do'`) giữ nguyên — chúng không phụ thuộc vào việc endpoint bị ghim ở đúng 0/1, chỉ phụ thuộc tính đơn điệu, nên không đổi.

- [ ] **Step 3: Chạy test để xác nhận 2 test mới FAIL trên code hiện tại**

```bash
pnpm exec vitest run src/ui/__tests__/warpHandles.test.ts
```

Kỳ vọng: 2 test mới (`'anchor dau di chuyen tu do...'`, `'anchor cuoi di chuyen tu do...'`) FAIL — vì code hiện tại vẫn ghim `anchors[0].x=0`/`anchors[last].x=1` nên kết quả là `0`/`1`, không phải `0.3`/`1.4`. 2 test "không vượt qua" cũng sẽ pass vô nghĩa (vì bị ghim sẵn) — không sao, mục đích chính là 2 test đầu.

- [ ] **Step 4: Sửa `clampPathX`**

Thay `src/text/warp.ts:118-135` bằng:

```ts
export function clampPathX(path: WarpPath): WarpPath {
  const anchors = path.anchors.map((anchor): WarpAnchor => ({ ...anchor }));
  const last = anchors.length - 1;
  if (last < 1) return path;

  // Anchor dau/cuoi tu do theo x — khong con ghim 0/1 (spec
  // docs/superpowers/specs/2026-08-18-warp-endpoint-resize-design.md), keo
  // dai/ngan duoc path. Chi con dam bao DON DIEU: anchor giua khong duoc
  // vuot qua 2 anchor dau, giu f(x) la ham cua x (spec §2.3 cua tai lieu
  // arclength). Vong lap forward/backward chi so sanh voi gia tri THAT cua
  // anchors[0]/anchors[last] (khong con la hang so 0/1 co dinh), nen van
  // dung dan voi bat ky vi tri nao cua 2 dau mut.
  for (let i = 1; i <= last; i++) anchors[i].x = Math.max(anchors[i].x, anchors[i - 1].x);
  for (let i = last - 1; i >= 1; i--) anchors[i].x = Math.min(anchors[i].x, anchors[i + 1].x);

  for (let i = 0; i < last; i++) {
    const lo = anchors[i].x;
    const hi = anchors[i + 1].x;
    const clamp = (v: number) => Math.min(Math.max(v, lo), hi);
    const out = anchors[i].out;
    if (out) anchors[i].out = { ...out, x: clamp(out.x) };
    const into = anchors[i + 1].in;
    if (into) anchors[i + 1].in = { ...into, x: clamp(into.x) };
  }

  return { ...path, anchors };
}
```

- [ ] **Step 5: Chạy lại toàn bộ test suite liên quan, xác nhận xanh**

```bash
pnpm exec vitest run src/ui/__tests__/warpHandles.test.ts src/text/__tests__/warp.test.ts src/text/__tests__/textGeometry.test.ts
```

Kỳ vọng: tất cả PASS. `warp.test.ts`/`textGeometry.test.ts` không cần sửa gì — mọi lời gọi `clampPathX` ở đó đều xuất phát từ `buildWavePath` (anchor đầu/cuối vốn đã đúng 0/1), nên hành vi giữ nguyên y hệt (2 dòng bị xoá chỉ là no-op khi input đã ở đúng 0/1).

- [ ] **Step 6: Chạy full gate rồi commit**

```bash
pnpm test && pnpm exec tsc --noEmit -p tsconfig.build.json && pnpm lint
git add src/text/warp.ts src/ui/__tests__/warpHandles.test.ts
git commit -m "fix(text): anchor dau/cuoi cua warp path di chuyen tu do theo x"
```

---

### Task 2: `WarpHandlesOverlay` — kéo anchor đầu/cuối theo x thì resize node

**Files:**
- Modify: `src/ui/WarpHandlesOverlay.tsx` (thêm hàm thuần `endpointResize`, sửa `onMove` trong `startDrag`)
- Test: `src/ui/__tests__/warpHandles.test.ts` (thêm `describe('endpointResize', ...)`)

**Interfaces:**
- Consumes: `computeResize(node: Node, handle: ResizeHandle, worldDelta: {x,y}): {size, transform}` từ `src/render/interactions/resizeMath.ts` (đã có, không đổi). `HandleRef` (`{anchor: number; kind: 'anchor'|'in'|'out'}`) đã export sẵn trong `WarpHandlesOverlay.tsx`.
- Produces: hàm thuần mới `endpointResize(node: Node, ref: HandleRef, lastAnchorIndex: number, worldDelta: {x:number;y:number}): {size:{width:number;height:number}; transform:{x:number;y:number}} | null` — export từ `WarpHandlesOverlay.tsx`, dùng trong `onMove` và test độc lập được.

- [ ] **Step 1: Đọc `onMove`/`startDrag` hiện tại để đối chiếu**

Nội dung hiện tại (`src/ui/WarpHandlesOverlay.tsx`, trong hàm `WarpHandlesOverlay`, phần `startDrag`):

```tsx
  const startDrag = (ref: HandleRef) => (downEvent: ReactPointerEvent) => {
    downEvent.stopPropagation();
    const startWorld = viewport.toWorld({ x: downEvent.clientX, y: downEvent.clientY });
    // Chốt path tại thời điểm bắt đầu kéo. Path hiển thị chính là path được
    // lưu — không còn khái niệm bake/fit, nên khi ghi vào warp.paths, hình
    // hiển thị không đổi — điều user thấy lúc thả tay chính là điều được lưu.
    const startPath = path;

    const onMove = (moveEvent: PointerEvent) => {
      const currentWorld = viewport.toWorld({ x: moveEvent.clientX, y: moveEvent.clientY });
      const worldDelta = { x: currentWorld.x - startWorld.x, y: currentWorld.y - startWorld.y };
      const local = rotateVector(worldDelta, -node.transform.rotation);
      const delta = {
        x: local.x / (node.transform.scaleX || 1) / box.width,
        y: local.y / (node.transform.scaleY || 1) / box.height,
      };
      const nextPath = clampPathX(movePathPoint(startPath, ref, delta));
      store.getState().dispatch({
        type: 'UpdateProps',
        pageId: activePageId,
        nodeId: node.id,
        patch: {
          warp: {
            type: node.warp?.type ?? 'wave',
            // Slider phai theo kip path vua keo, neu khong lan keo slider ke
            // tiep se sinh lai preset tu con so cu va hinh nhay.
            curveHeight: curveHeightOf(nextPath, box.height, node.font.size),
            paths: [nextPath],
          },
        } as Partial<Node>,
      });
    };
    startPointerGesture(store, `warp-handle:${node.id}`, onMove);
  };
```

- [ ] **Step 2: Viết test cho `endpointResize` trước (test phải fail vì hàm chưa tồn tại)**

Sửa dòng import đầu file `src/ui/__tests__/warpHandles.test.ts` (hiện là `import type { WarpPath } from '../../schema';`) thành:

```ts
import type { Node, TextNode, WarpPath } from '../../schema';
```

Rồi thêm 2 import mới ngay dưới các import hiện có ở đầu file:

```ts
import { computeResize } from '../../render/interactions/resizeMath';
import { endpointResize } from '../WarpHandlesOverlay';
```

Thêm vào cuối `src/ui/__tests__/warpHandles.test.ts`:

```ts
const resizeTestNode: TextNode = {
  id: 'text-1',
  type: 'text',
  transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 },
  size: { width: 200, height: 80 },
  opacity: 1,
  visible: true,
  locked: false,
  text: 'abc',
  font: { family: 'Poppins', weight: 400, style: 'normal', size: 100 },
  align: 'left',
  letterSpacing: 0,
  lineHeight: 1.2,
  fill: { type: 'solid', color: '#000000' },
};

describe('endpointResize', () => {
  const lastIndex = 2; // path wave chuan co 3 anchor: index 0, 1, 2

  it('keo anchor dau (index 0) tra ve dung computeResize voi handle w, worldDelta.y bi zero', () => {
    const result = endpointResize(resizeTestNode, { anchor: 0, kind: 'anchor' }, lastIndex, {
      x: -30,
      y: 12,
    });
    expect(result).toEqual(computeResize(resizeTestNode, 'w', { x: -30, y: 0 }));
  });

  it('keo anchor cuoi (index lastIndex) tra ve dung computeResize voi handle e', () => {
    const result = endpointResize(resizeTestNode, { anchor: lastIndex, kind: 'anchor' }, lastIndex, {
      x: 45,
      y: -5,
    });
    expect(result).toEqual(computeResize(resizeTestNode, 'e', { x: 45, y: 0 }));
  });

  it('keo anchor giua thi khong resize', () => {
    const result = endpointResize(resizeTestNode, { anchor: 1, kind: 'anchor' }, lastIndex, {
      x: 100,
      y: 0,
    });
    expect(result).toBeNull();
  });

  it('keo handle (in/out) o dau/cuoi thi khong resize', () => {
    const result = endpointResize(resizeTestNode, { anchor: 0, kind: 'out' }, lastIndex, {
      x: 100,
      y: 0,
    });
    expect(result).toBeNull();
  });

  it('regression cu the: keo anchor cuoi sang phai 50px thi box rong them dung 50, mep trai dung yen', () => {
    const result = endpointResize(resizeTestNode, { anchor: lastIndex, kind: 'anchor' }, lastIndex, {
      x: 50,
      y: 0,
    })!;
    expect(result.size.width).toBeCloseTo(250, 6);
    expect(result.size.height).toBeCloseTo(80, 6);
    expect(result.transform.x).toBeCloseTo(0, 6);
  });
});
```

- [ ] **Step 3: Chạy test để xác nhận fail (hàm `endpointResize` chưa được export)**

```bash
pnpm exec vitest run src/ui/__tests__/warpHandles.test.ts
```

Kỳ vọng: FAIL với lỗi import — `endpointResize` không tồn tại trong `WarpHandlesOverlay.tsx`.

- [ ] **Step 4: Thêm `endpointResize` và sửa `onMove`**

Trong `src/ui/WarpHandlesOverlay.tsx`:

1. Sửa dòng import từ `resizeMath`:

```tsx
import { rotateVector, computeResize } from '../render/interactions/resizeMath';
```

2. Sửa dòng import type từ `../schema` để thêm `Transform`:

```tsx
import type { Node, TextNode, Transform, WarpAnchor, WarpPath } from '../schema';
```

3. Thêm hàm thuần `endpointResize` — đặt ngay trước hàm `WarpHandlesOverlay` (sau `movePathPoint`, cạnh các hàm thuần khác của file):

```tsx
// Keo anchor DAU hoac CUOI theo x = keo mep node giong het 1 resize handle
// thuong ('w'/'e') — tai dung computeResize (dung chung voi SelectionOverlay)
// thay vi tu viet lai cong thuc pivot/world-anchor. worldDelta.y luon bi bo
// qua: 'w'/'e' khong doi height (computeResize.growY = 0 cho hai handle nay),
// truyen 0 cho ro rang thay vi phu thuoc vao chi tiet noi bo do. Anchor giua
// va moi handle (in/out) khong resize — chi 2 dau mut cua path moi la mep
// node (docs/superpowers/specs/2026-08-18-warp-endpoint-resize-design.md).
export function endpointResize(
  node: Node,
  ref: HandleRef,
  lastAnchorIndex: number,
  worldDelta: { x: number; y: number },
): { size: { width: number; height: number }; transform: { x: number; y: number } } | null {
  if (ref.kind !== 'anchor') return null;
  if (ref.anchor === 0) return computeResize(node, 'w', { x: worldDelta.x, y: 0 });
  if (ref.anchor === lastAnchorIndex) return computeResize(node, 'e', { x: worldDelta.x, y: 0 });
  return null;
}
```

4. Sửa `onMove` bên trong `startDrag` thành:

```tsx
    const onMove = (moveEvent: PointerEvent) => {
      const currentWorld = viewport.toWorld({ x: moveEvent.clientX, y: moveEvent.clientY });
      const worldDelta = { x: currentWorld.x - startWorld.x, y: currentWorld.y - startWorld.y };
      const local = rotateVector(worldDelta, -node.transform.rotation);
      const delta = {
        x: local.x / (node.transform.scaleX || 1) / box.width,
        y: local.y / (node.transform.scaleY || 1) / box.height,
      };
      const nextPath = clampPathX(movePathPoint(startPath, ref, delta));
      const resize = endpointResize(node, ref, startPath.anchors.length - 1, worldDelta);
      store.getState().dispatch({
        type: 'UpdateProps',
        pageId: activePageId,
        nodeId: node.id,
        patch: {
          ...(resize ? { size: resize.size } : {}),
          warp: {
            type: node.warp?.type ?? 'wave',
            // Slider phai theo kip path vua keo, neu khong lan keo slider ke
            // tiep se sinh lai preset tu con so cu va hinh nhay.
            curveHeight: curveHeightOf(nextPath, box.height, node.font.size),
            paths: [nextPath],
          },
        } as Partial<Node>,
      });
      if (resize) {
        store.getState().dispatch({
          type: 'UpdateTransform',
          pageId: activePageId,
          nodeId: node.id,
          patch: { x: resize.transform.x, y: resize.transform.y } as Partial<Transform>,
        });
      }
    };
```

- [ ] **Step 5: Chạy test, xác nhận pass**

```bash
pnpm exec vitest run src/ui/__tests__/warpHandles.test.ts
```

Kỳ vọng: tất cả PASS, kể cả 5 test mới trong `describe('endpointResize', ...)`.

- [ ] **Step 6: Chạy full gate rồi commit**

```bash
pnpm test && pnpm exec tsc --noEmit -p tsconfig.build.json && pnpm lint
git add src/ui/WarpHandlesOverlay.tsx src/ui/__tests__/warpHandles.test.ts
git commit -m "feat(text): keo anchor dau/cuoi cua warp path resize node theo mep doi dien"
```

---

## Xác minh cuối (browser)

Sau khi cả 2 task xong, dùng dev server sẵn có trong worktree này (`localhost:5174`) để xác nhận trực quan:

1. Chọn text node có warp `wave`, kéo handle ở đầu path (index 0) sang trái — xác nhận: node rộng ra bên trái, mép phải (đầu path bên kia) đứng yên trên canvas, Properties panel cập nhật `size.width` mới.
2. Kéo handle ở cuối path (index cuối) sang phải — xác nhận: node rộng ra bên phải, mép trái đứng yên.
3. Kéo anchor giữa — xác nhận: hành vi không đổi so với trước (không resize node, chỉ đổi hình path).
4. Undo sau mỗi bước — xác nhận cả `size`/`transform`/`warp` đều được undo cùng lúc (2 dispatch trong cùng 1 lần kéo có gộp đúng vào lịch sử theo cơ chế gesture hiện có, giống hệt cách `SelectionOverlay`'s resize handle đang hoạt động).
