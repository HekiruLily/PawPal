# PawPal — API cho ứng dụng

Backend giữ cấu trúc Java hiện hữu: `Common/`, `Config/`, `Controllers/`, `intercepter/`, `Models/`, `Repositories/`, `Services/`, `Utils/`. Controller hiện hữu giữ route web và bổ sung route JSON. Không cần đổi cấu trúc frontend trong TXT để dùng API này.

## Quy ước

- Mobile gửi `Authorization: Bearer <Firebase ID token>` và `credentials: 'omit'`; backend xác minh token và đọc role từ Firebase. Cookie `JSESSIONID`/`credentials: 'include'` giữ riêng cho client SQL cũ. Bearer không hợp lệ không được rơi về cookie. `GET /appointment-system/api/auth/me` trả danh tính đã xác minh, gồm `firebaseUid` nếu liên kết.
- Thành công: `{ "code": "0", "msg": "OK", "data": ... }`. HTTP 400: đầu vào/nghiệp vụ; 401: chưa đăng nhập; 403: sai quyền; 404: không tìm thấy hoặc không sở hữu; 409: lịch/giá/phiên bản thay đổi; 429: khóa đăng nhập.
- Ngoại lệ tương thích: `GET /maintain/api/groomers` trả mảng trực tiếp; POST trạng thái nhận lịch trả object trực tiếp. CSV trả file UTF-8 có BOM.
- Ngày `yyyy-MM-dd`. Giờ đặt truyền ISO 8601 có offset: `2026-12-01T10:00:00+07:00`. Cửa hàng sử dụng `Asia/Ho_Chi_Minh`; không suy luận múi giờ điện thoại.
- Các trường JSON kiểu số nguyên như tuổi, giá và thời lượng từ chối số thập phân với HTTP 400; không tự cắt phần lẻ khi đọc request.
- Tiền là VND nguyên; giá từng dịch vụ 1–999999999. Tổng do server tính. Route web cũ cũng áp dụng công thức mới, không còn phụ thu theo hạng/kích cỡ.
- Mã SQL giữ tên `uid`, `pid`, `gid`, `sid`, `aid`. Mobile dùng `firebasePetId`, `firebaseServiceIds` (chuỗi nguyên gốc), `groomerId` (số SQL); backend tự tạo liên kết, không ép khóa push thành số. Client SQL cũ dùng `petId`, `serviceIds`.

## Tài khoản

| Method | Route | Body / kết quả |
|---|---|---|
| POST | `/appointment-system/api/auth/register` | `username, password, email, name?, phoneNumber?`; luôn tạo customer |
| POST | `/appointment-system/api/auth/login` | `username, password`; username nhận tên tài khoản hoặc email; trả role thật |
| GET | `/appointment-system/api/auth/me` | Thông tin phiên hiện tại, không có password |
| POST | `/appointment-system/api/auth/logout` | Hủy phiên máy chủ |
| POST | `/appointment-system/api/auth/reset-code` | `username`; gửi mã email |
| POST | `/appointment-system/api/auth/reset-password` | `username, code, password` |

Các API mật khẩu ở bảng này dành cho tài khoản SQL cũ. Mobile đăng ký/đăng nhập/reset bằng Firebase SDK; không cần gọi login SQL trước khi đặt lịch. Client không thể tự ghi `firebaseUid` qua register. Nếu email SQL đã tồn tại nhưng chưa có UID, liên kết tự động bị chặn (409), cần quy trình quản trị.

Mật khẩu mới tối thiểu 8 ký tự và tối đa 72 byte UTF-8; lưu BCrypt. Tài khoản cũ được nâng từ mật khẩu rõ sang BCrypt khi đăng nhập đúng. Ba lần sai khóa 15 phút. Mã reset tồn tại 10 phút, dùng một lần, tối đa 5 lần thử và gửi cách nhau ít nhất 60 giây. Cần cấu hình SMTP để dùng chức năng gửi mã.

## Khách hàng

| Method | Route | Body / query |
|---|---|---|
| GET / PUT | `/customer/api/profile` | PUT: `name, phoneNumber, address?, imageURL?` |
| GET / POST | `/customer/api/pets` | POST: `name, type, size, age, breed?, gender?, notes?, imageURL?` |
| PUT / DELETE | `/customer/api/pets/{pid}` | PUT cùng body POST; DELETE xóa mềm, chặn khi còn lịch đang mở |
| GET | `/appointment-system/api/services?q=` | Dịch vụ đang mở, giá/thời lượng, ưu đãi, thành phần gói |
| GET | `/appointment-system/api/groomers?q=` | Nhân viên đang nhận lịch, chuyên môn; không lộ địa chỉ/số điện thoại cá nhân |
| POST | `/customer/api/uploads` | Multipart `file` (khách hoặc quản lý); ảnh PNG/JPEG ≤5 MB và ≤20 triệu pixel; trả `imageURL` |
| GET | `/customer/api/notifications` | Danh sách mới nhất trước, `readAt` null là chưa đọc |
| POST | `/customer/api/notifications/{id}/read` | Chỉ đánh dấu thông báo thuộc mình |

`type` chấp nhận `Dog/Cat/Other` hoặc `Chó/Mèo/Khác`; JSON cũng nhận alias `species`. `size` nhận `Small/Medium/Large` hoặc `Nhỏ/Vừa/Lớn`. Tuổi 0–30, tên tối đa 40, giống 40, ghi chú 300 ký tự. Ảnh phải là URL upload, tài nguyên `/assets/` hoặc HTTPS, không lưu URI cục bộ của điện thoại.

## Báo giá và đặt lịch

| Method | Route | Mục đích |
|---|---|---|
| POST | `/Appointment/api/quote` | Body `petId, serviceIds`; trả `items, subtotal, discount, totalPrice, durationMinutes` |
| POST | `/Appointment/api/slots?date=yyyy-MM-dd` | Body `petId, serviceIds, groomerId?`; trả `startTime, groomerId` còn trống |
| POST | `/Appointment/api/appointments` | Gửi yêu cầu đặt lịch |
| GET | `/Appointment/api/appointments?status=&q=` | Lịch của mình; status có thể `all` |
| GET | `/Appointment/api/appointments/{aid}` | Chi tiết có version |
| PUT | `/Appointment/api/appointments/{aid}` | Sửa một lần, khi pending; gửi booking body và version |
| POST | `/Appointment/api/appointments/{aid}/cancel?version=0` | Hủy lịch theo điều kiện thời gian |

Với Bearer Firebase, body quote/slots/create/edit thay `petId, serviceIds` bằng `firebasePetId, firebaseServiceIds`. Backend đọc dữ liệu chính chủ và danh mục mới nhất từ RTDB cho từng lần báo giá/gửi lịch; không nhận snapshot do client tự khai báo. Hồ sơ cần có số điện thoại hợp lệ trước khi tạo lịch, cùng điều kiện trên form mobile. Phản hồi lịch gồm `firebasePetId`, mỗi `items[]` có `firebaseServiceId`, phục vụ chọn lại khi sửa. API thú cưng/dịch vụ SQL cũ không được dùng để sửa bản liên kết Firebase.

Ví dụ body đặt lịch sau khi đã xem báo giá:

```json
{
  "firebasePetId": "-FirebasePetKey",
  "firebaseServiceIds": ["-FirebaseServiceKey1", "-FirebaseServiceKey3"],
  "groomerId": null,
  "startTime": "2026-12-01T10:00:00+07:00",
  "expectedTotal": 230000,
  "expectedDuration": 90,
  "expectedDiscount": 0
}
```

`groomerId: null` nghĩa là bất kỳ nhân viên phù hợp. Khi gửi, backend tính lại báo giá; nếu khác giá/thời lượng đã xem thì trả 409 để frontend hiển thị lại. Client không được quyết định user, trạng thái, tổng tiền hoặc snapshot.

Để khớp bước kiểm tra trong `PawPal-Nang-Mat-Ong.html`, frontend gửi thêm `expectedDiscount` từ báo giá khi tạo/sửa lịch. Backend trả 409 nếu ưu đãi thay đổi, kể cả khi tổng tiền cuối cùng vẫn bằng nhau. Trường này tùy chọn để giữ tương thích các client cũ chỉ gửi tổng tiền/thời lượng; không dùng nó để tính tiền. Nếu màn kiểm tra đã hiện một nhân viên dự kiến, gửi `groomerId` nhận từ slot đó để không tự chọn sang nhân viên khác.

- Chỉ đặt cho thú cưng của mình. Chỉ tương lai, giờ bắt đầu cách 30 phút, toàn bộ dịch vụ nằm trong 08:00–18:00.
- Khám thú y tách lịch với chăm sóc khác. Nhân viên phải đang nhận lịch và thuộc loại chuyên môn phù hợp. Dùng `veterinary: true` hoặc chức danh `Bác sĩ thú y`; đây là phân loại khám/chăm sóc, chưa phải hệ thống kỹ năng chi tiết theo từng giống.
- Chặn trùng khoảng thời gian của nhân viên và thú cưng. Lịch kết thúc đúng lúc lịch tiếp theo bắt đầu được phép.
- Khóa các hàng nhân viên theo thứ tự ID trong cùng transaction, rồi kiểm tra lịch bằng locking read trước khi ghi. Cả đặt mới, sửa, phân công và hủy dùng cùng thứ tự khóa. Cách này phù hợp một cửa hàng; cần tối ưu khi mở rộng quy mô.
- Pending quá giờ bắt đầu có trạng thái hiệu lực `expired`; tác vụ định kỳ lưu trạng thái và thông báo trong tối đa khoảng 60 giây.
- Khách hủy pending khi chưa bắt đầu; confirmed cần trước ít nhất 24 giờ. Sửa chỉ một lần khi pending.
- Tên/giá/thời lượng/giảm giá của dịch vụ được chụp vào `appointment_item`. Đổi danh mục không sửa giá lịch đã chốt.

## Quản lý

Form nhân viên chấp nhận số điện thoại tùy chọn: chuỗi rỗng lưu thành null; khi nhập dùng 7–20 ký tự gồm số và dấu định dạng. Ảnh tùy chọn có thể gửi chuỗi rỗng. Giới hạn còn lại: tên/chức danh 50 ký tự, mô tả 255, chuyên môn 500, kinh nghiệm 0–80 năm. API tìm khách hàng (`q`) tìm không phân biệt dấu theo tên hiển thị, username, email và số điện thoại, kể cả tài khoản liên kết Firebase.

| Method | Route | Body / query |
|---|---|---|
| GET / POST | `/maintain/api/services` | GET `q?`; POST ServiceType |
| PUT | `/maintain/api/services/{sid}` | ServiceType đầy đủ |
| POST | `/maintain/api/services/{sid}/active?active=false` | Tạm ngưng/mở dịch vụ |
| GET / POST | `/maintain/api/groomers` | GET trả mảng; POST Groomer |
| PUT / DELETE | `/maintain/api/groomers/{gid}` | PUT Groomer; chặn DELETE nếu có lịch sử |
| POST | `/maintain/api/groomers/{gid}/accepting?accepting=false` | Tạm ngưng/mở nhân viên |
| GET | `/maintain/api/users?q=` | Chỉ khách hàng, không có mật khẩu |
| GET | `/maintain/api/appointments?status=&q=` | Tìm theo mã/khách/thú cưng/dịch vụ |
| GET | `/maintain/api/appointments/{aid}` | Chi tiết |
| POST | `/maintain/api/appointments/{aid}/assign` | `{ "groomerId": 2, "version": 0 }` |
| POST | `/maintain/api/appointments/{aid}/status` | `{ "status": "confirmed", "groomerId": 2, "version": 0 }` |
| GET | `/maintain/api/dashboard?period=7` | Tổng quan cùng nguồn báo cáo |
| GET | `/maintain/api/reports?period=7` | `7`, `30`, `all`; hoặc `from=...&to=...` |
| GET | `/maintain/api/reports.csv?period=7` | CSV chi tiết, cùng bộ lọc báo cáo |

ServiceType: `serviceName, basicPrice, serviceTime, active, category, veterinary, description, imageURL, packageItems, discountPercent, promotionStart, promotionEnd`. `packageItems` là mảng ID dịch vụ đơn; không lồng gói hoặc chọn gói cùng thành phần trùng. Thời lượng 5–600 phút; ưu đãi 0–99%, bắt buộc khoảng ngày khi >0, làm tròn xuống VND.

Groomer: `name, gender, rank, phoneNumber, address, description, title, experienceYears, specialties, veterinary, acceptingAppointments, imageURL`. `specialties` giữ chuỗi theo frontend hiện tại. `address` là trường riêng; API đọc dữ liệu cũ có thể tách từ dòng `Địa chỉ:` nhưng không trả dòng đó lặp lại trong description. Khi sửa phải dùng ID trên URL; không dùng POST tạo mới để sửa.

`gender` của nhân viên bắt buộc có nội dung, tối đa 20 ký tự; `null`, chuỗi rỗng và chuỗi chỉ có khoảng trắng đều trả HTTP 400 khi thêm hoặc sửa.

Trạng thái: `pending → confirmed/rejected`; `confirmed → completed/cancelled`. Chỉ completed sau giờ kết thúc. Phân công lại pending/confirmed trước giờ bắt đầu; không tính lại giá lịch đã chốt. Mọi thay đổi dùng version mới nhất, trả 409 khi cũ. Dữ liệu web cũ `Accepted/Finished` được đọc thành `confirmed/completed`.

Báo cáo lọc theo ngày bắt đầu lịch ở Việt Nam (từ đầu ngày đến hết ngày), doanh thu chỉ lịch completed; dịch vụ phổ biến loại cancelled/rejected/expired. CSV có từng lịch, escape dấu phẩy/nháy/xuống dòng và xử lý ô có thể bị phần mềm bảng tính hiểu là công thức.

`GET /maintain/api/dashboard` có `petCount`: tổng hồ sơ thú cưng chưa xóa, bao gồm bản ghi cũ có cờ `deleted` null. `daily[].appointments` chỉ đếm lịch còn được tính trong biểu đồ (pending, confirmed, completed), loại cancelled/rejected/expired như HTML Nắng Mật Ong. `totalAppointments` và `statusCounts` vẫn bao gồm các trạng thái để thống kê/xuất CSV đầy đủ.

## Frontend cần nối tiếp

Giữ đúng `src/api/`, `hooks/`, `context/`, `screens/`, `components/`, `theme/`, `storage/` theo TXT. Nối các route mới trong `authApi`, `appointmentApi`, `petApi`, `serviceApi`, `groomerApi`, `managerApi`; bỏ phân tích HTML trong API mobile. Hook điều phối tải/ghi; screen dùng hook/context. Backend không tự sửa các file frontend.

File TXT mô tả `.js`; frontend đang là TypeScript `.tsx`. Việc đổi đuôi và cú pháp thuộc đợt frontend, không thay đổi trong backend này. Bình luận/phản hồi chỉ có trong TXT, không có luồng thực tế ở demo HTML, nên chưa thêm module bình luận trong phạm vi khớp demo.
