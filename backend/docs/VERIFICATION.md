# Kết quả kiểm tra backend

Ngày kiểm tra: 23/11/2026. Mã nền: `75f1b0c628c6ff1e07f812848206a87e8a386863`, nhánh làm việc local `feature/demo-backend`.

## Đã thực hiện

- Biên dịch bằng JDK 17, giữ target Java 16; đóng gói Spring Boot JAR.
- Bộ test đầy đủ dùng H2 MySQL mode: 56 test, không lỗi và không bỏ qua.
- Chạy riêng `BookingIntegrationTest` và `LoginThenMakeAppointmentTest` trên MySQL 8.0.46 trong container độc lập: 20 test, không lỗi và không bỏ qua. Có kiểm tra hai thread tranh cùng slot chỉ tạo một lịch, nhiều dịch vụ, snapshot, version, chuyển trạng thái, quyền sở hữu, slot, upload, thông báo, hết hạn và báo cáo/CSV.
- Smoke test JAR thật qua HTTP với cookie session, kết nối database MySQL thử mang schema cũ.
- Xác nhận nâng cấp cột password từ 15 lên 100 ký tự và mật khẩu rõ được chuyển thành BCrypt dài 60 ký tự sau đăng nhập.
- Xác nhận dữ liệu cũ `Accepted` được trả thành `confirmed`; lịch có giá cũ 777 giữ nguyên snapshot `Original bath`, dù dịch vụ hiện tại đã đổi tên và giá thành 999999.
- Đăng xuất hủy phiên; yêu cầu lấy phiên sau đó trả HTTP 401.
- Container/database và server thử được dừng sau kiểm tra. Không sử dụng database dự án thật, không gửi email thật và không thay frontend.

## Giới hạn nghiệm thu

- Chưa nối app React Native với các API mới hoặc build app Android/iOS.
- SMTP thật cần được cấu hình và nghiệm thu việc nhận email; test không gửi thư ra ngoài.
- Đơn vị tiền và múi giờ của dữ liệu lịch sử thực tế cần được nhóm xác nhận. Không tự đổi số tiền cũ bằng tỷ giá suy đoán.
- Ảnh `/g-images/`, `/u-images/` của web cũ cần chuyển hoặc cấu hình theo hướng dẫn SETUP; ảnh upload mới dùng `/uploads/`.

Hướng dẫn chạy ở [SETUP.md](SETUP.md), hợp đồng frontend–backend ở [API.md](API.md). Chưa commit/push thay đổi lên GitHub.
