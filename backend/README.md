# PawPal Backend

Backend đặt lịch chăm sóc thú cưng, phát triển từ Pet-Shop-Grooming-Appointment-System. Giữ Spring MVC/Thymeleaf hiện hữu và bổ sung JSON API cho ứng dụng React Native.

- Java 16 (kiểm thử bằng JDK 17), Spring Boot 2.7.18, JPA, MySQL 8.
- Đặt lịch nhiều dịch vụ, báo giá/ưu đãi, khung giờ trống, phân công, trạng thái và thông báo.
- Kiểm tra quyền sở hữu, chống trùng lịch trong transaction, giữ giá và thông tin đã chốt.
- Báo cáo và CSV dùng cùng nguồn dữ liệu, chỉ ghi doanh thu lịch hoàn thành.

Đọc [hướng dẫn chạy và dữ liệu cũ](docs/SETUP.md), [hợp đồng API](docs/API.md). Có thể chạy MySQL bằng `docker compose up -d --wait mysql` rồi chạy backend với profile `docker` như hướng dẫn. Biến kết nối database/SMTP nằm trong môi trường hoặc file `.env` cục bộ; không có tài khoản quản lý dùng chung được tạo tự động.

```powershell
mvn test
mvn spring-boot:run
```

Cấu trúc: `src/main/java/com/cpt202/appointment_system/{Common,Config,Controllers,intercepter,Models,Repositories,Services,Utils}`; tài nguyên tại `resources/`; kiểm thử tại `src/test/`.

Nguồn gốc và tài liệu bài tập ban đầu giữ tại `Reference_Source.md`, `Ass1/`, `Final product/` và LICENSE. Frontend ở thư mục `../PawPal-develop`. Luồng mobile dùng Firebase ID token để gọi API; backend liên kết Firebase UID với tài khoản SQL, tự đọc thú cưng/dịch vụ từ Firebase và lưu lịch cùng snapshot vào MySQL. Xem mục kết nối Firebase trong `docs/SETUP.md`; đăng nhập cookie cũ vẫn dành riêng cho dữ liệu SQL cũ.
