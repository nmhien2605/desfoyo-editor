# 1. Tổng quan

Hình minh họa có **1 path mở**, chạy từ phía dưới bên trái, đi lên qua phần giữa, tạo thành một đường cong lớn rồi kết thúc ở phía bên phải.

Path được điều khiển bởi:

* **3 anchor point**
* **4 handle point**
* Tổng cộng **7 point hiển thị** trên giao diện.
* Các point được thể hiện bằng vòng tròn nhỏ màu xanh.
* Các handle được nối với anchor bằng đường xanh mảnh.
* Đường path chính cũng có màu xanh và chạy xuyên suốt qua các anchor.

---

# 2. Anchor point

Có **3 anchor point**:

### Anchor 1 — bên trái

* Nằm ở đầu path, phía dưới bên trái.
* Đây là **điểm bắt đầu** của path.
* Từ anchor này, path đi sang phải và hơi cong lên.
* Anchor này có **1 handle** kéo về phía bên phải.
* Vì nằm ở đầu path nên chỉ có một hướng điều khiển path từ anchor này.

### Anchor 2 — ở giữa

* Nằm khoảng giữa hình, tại vị trí path chuyển từ đoạn cong đi lên sang đường cong lớn phía trên.
* Đây là anchor ở giữa path.
* Anchor này có **2 handle**, một ở phía dưới-trái và một ở phía trên-phải.
* Hai handle nằm trên cùng một hướng với anchor.
* Đây là anchor có vai trò chính trong việc tạo và thay đổi độ cong của path ở khu vực giữa.

### Anchor 3 — bên phải

* Nằm ở cuối path, phía bên phải.
* Đây là **điểm kết thúc** của path.
* Path đi từ anchor giữa lên thành một đường cong lớn rồi hạ xuống anchor này.
* Anchor này có **1 handle** kéo về phía trái.
* Vì là điểm cuối nên chỉ có một hướng điều khiển đoạn path đi vào nó.

---

# 3. Handle point

Có **4 handle point**, chia theo vị trí:

| Handle   | Vị trí             | Liên kết với | Tác dụng nhìn thấy trên hình                                    |
| -------- | ------------------ | ------------ | --------------------------------------------------------------- |
| Handle 1 | Bên phải Anchor 1  | Anchor 1     | Điều khiển hướng và độ cong của đoạn path đi ra từ đầu bên trái |
| Handle 2 | Dưới-trái Anchor 2 | Anchor 2     | Điều khiển đoạn cong đi từ bên trái vào Anchor 2                |
| Handle 3 | Trên-phải Anchor 2 | Anchor 2     | Điều khiển đoạn cong đi từ Anchor 2 về phía phải                |
| Handle 4 | Bên trái Anchor 3  | Anchor 3     | Điều khiển hướng và độ cong của đoạn path đi vào điểm cuối      |

Như vậy:

* **Anchor 1 → Handle 1**
* **Anchor 2 → Handle 2 + Handle 3**
* **Anchor 3 → Handle 4**

Các handle không phải là điểm nằm trực tiếp trên path để tạo thêm điểm neo. Chúng là các điểm điều khiển độ cong của path quanh anchor tương ứng.

---

# 4. Liên kết giữa Anchor và Handle

Có thể đọc cấu trúc từ trái sang phải như sau:

**Anchor 1 — Handle 1**

→ đoạn path cong đi lên

→ **Handle 2 — Anchor 2 — Handle 3**

→ đường cong lớn đi sang phải

→ **Handle 4 — Anchor 3**

→ kết thúc path.

Anchor ở giữa có hai handle vì nó nằm giữa hai đoạn path.

Hai anchor ở hai đầu chỉ có một handle vì chúng là điểm bắt đầu và kết thúc của path.

---

# 5. Path

Hình có **1 path duy nhất và là path mở**.

Path bắt đầu:

* ở Anchor 1 phía dưới bên trái.

Path đi qua:

* đoạn cong thứ nhất,
* Anchor 2 ở khu vực giữa,
* sau đó tiếp tục thành một đường cong lớn phía trên.

Path kết thúc:

* tại Anchor 3 phía bên phải.

Path không tạo thành vùng kín và không quay trở lại Anchor 1.

---

# 6. Vị trí và hình dạng của Path

Path có thể chia thành **2 đoạn cong chính**:

### Đoạn 1: Anchor 1 → Anchor 2

* Bắt đầu thấp ở bên trái.
* Ban đầu path gần như nằm ngang.
* Sau đó từ từ cong lên.
* Càng gần Anchor 2, path càng đi lên rõ rệt.
* Đoạn này tạo phần cong nằm phía dưới chữ.

Độ cong của đoạn này chịu ảnh hưởng bởi:

* Handle 1 của Anchor 1.
* Handle 2 của Anchor 2.

### Đoạn 2: Anchor 2 → Anchor 3

* Bắt đầu tại Anchor 2.
* Path tiếp tục đi lên.
* Sau đó tạo thành một đường cong lớn, tròn và tương đối mềm.
* Đường cong đạt vùng cao nhất ở khoảng giữa bên phải.
* Cuối cùng path cong xuống và kết thúc tại Anchor 3.

Độ cong của đoạn này chịu ảnh hưởng bởi:

* Handle 3 của Anchor 2.
* Handle 4 của Anchor 3.

---

# 7. Cách path bị uốn cong

Path không bị uốn trực tiếp bằng cách kéo đường path ở bất kỳ vị trí nào.

Thao tác uốn chủ yếu được thực hiện thông qua **handle của anchor**.

## Kéo Handle 1

Nếu user kéo handle nằm bên phải Anchor 1:

* hướng đi ra của path tại đầu bên trái thay đổi;
* đoạn path ngay sau Anchor 1 sẽ thay đổi hướng;
* kéo handle dài hơn sẽ làm đoạn path có xu hướng cong mềm và kéo dài hơn theo hướng của handle;
* kéo handle về gần Anchor 1 sẽ làm ảnh hưởng của handle ngắn lại, khiến đoạn path gần anchor ít bị kéo theo hướng đó hơn.

## Kéo Handle 2

Nếu user kéo handle nằm dưới-trái Anchor 2:

* phần path từ bên trái tiến vào Anchor 2 thay đổi;
* có thể làm đoạn cong bên trái cao hơn, thấp hơn hoặc đổi hướng tiếp cận Anchor 2;
* ảnh hưởng chủ yếu nằm ở **đoạn Anchor 1 → Anchor 2**.

## Kéo Handle 3

Nếu user kéo handle nằm trên-phải Anchor 2:

* phần path bắt đầu rời Anchor 2 về phía phải thay đổi;
* đường cong lớn phía trên sẽ thay đổi hướng và độ mở;
* kéo handle lên hoặc xuống sẽ làm phần cong phía trên thay đổi tương ứng;
* kéo handle xa Anchor 2 làm ảnh hưởng lên đoạn cong rõ hơn.

## Kéo Handle 4

Nếu user kéo handle nằm bên trái Anchor 3:

* phần cuối của path thay đổi;
* hướng path tiến vào Anchor 3 thay đổi;
* đường cong phía bên phải có thể trở nên cao hơn, thấp hơn hoặc thay đổi độ mềm trước khi chạm Anchor 3.

---

# 8. Di chuyển Anchor

Nếu user kéo **chính anchor point**, thay vì kéo handle:

* vị trí của anchor thay đổi;
* vị trí mà path đi qua cũng thay đổi;
* các đoạn path nối với anchor sẽ được kéo theo;
* với Anchor 2, vì đây là anchor ở giữa nên cả đoạn bên trái và đoạn bên phải đều bị ảnh hưởng.

Ví dụ:

* Kéo Anchor 1 sang phải → điểm bắt đầu path sang phải.
* Kéo Anchor 2 lên → vùng nối giữa hai đoạn path được đưa lên.
* Kéo Anchor 3 sang phải → điểm kết thúc path sang phải.

---

# 9. Tóm tắt cấu trúc

**Số lượng:**

* Path: **1**
* Anchor: **3**

  * 2 anchor ở hai đầu
  * 1 anchor ở giữa
* Handle: **4**

  * 1 handle của Anchor 1
  * 2 handle của Anchor 2
  * 1 handle của Anchor 3
* Tổng số point hiển thị: **7**

**Cấu trúc:**

`Anchor 1 — Handle 1`

`Anchor 2 — Handle 2 + Handle 3`

`Anchor 3 — Handle 4`

**Path:**

`Anchor 1 → đoạn cong → Anchor 2 → đường cong lớn → Anchor 3`

Đây là **một path mở gồm hai đoạn cong liên tiếp**, trong đó Anchor 2 là điểm trung gian có hai handle để điều khiển sự chuyển tiếp giữa hai đoạn cong.
