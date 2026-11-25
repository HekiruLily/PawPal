# Chạy và kiểm tra backend PawPal

## Môi trường

- JDK 17 dùng để phát triển/kiểm thử; bytecode dự án giữ Java 16 như cấu trúc gốc.
- Maven 3.9, MySQL 8, database `pet_shop`.
- Spring Boot chuyển từ parent SNAPSHOT không ổn định sang `2.7.18`; dependency JPA/JUnit/Mockito dùng cùng bộ phiên bản của Boot.

Thiết lập `PAWPAL_DB_URL`, `PAWPAL_DB_USER`, `PAWPAL_DB_PASSWORD`. Không đặt thông tin thật trong source. Mặc định URL là `jdbc:mysql://localhost:3306/pet_shop?connectionTimeZone=Asia/Ho_Chi_Minh`.

```powershell
$env:PAWPAL_DB_USER = 'pawpal'
$env:PAWPAL_DB_PASSWORD = 'mat-khau-local'
$env:JAVA_TOOL_OPTIONS = '-Dfile.encoding=UTF-8 -Dsun.jnu.encoding=UTF-8'
mvn spring-boot:run
```

Các biến tùy chọn: `PAWPAL_MAIL_HOST/PORT/USER/PASSWORD/AUTH/TLS`, `PAWPAL_ALLOWED_ORIGINS` (danh sách origin cách nhau bằng dấu phẩy), `PAWPAL_UPLOAD_DIRECTORY`, `PAWPAL_SECURE_COOKIE` và `PAWPAL_DDL_AUTO`.

App mobile dùng cookie session. Trình duyệt chỉ được gửi cookie từ origin đã cấu hình. Môi trường HTTPS đặt `PAWPAL_SECURE_COOKIE=true`. Ảnh mới lưu ở `uploads/`, trả đường dẫn `/uploads/...`; khi chuyển máy chủ cần mang theo thư mục này. Ảnh web cũ dùng `/g-images/` và `/u-images/` cần chuyển sang thư mục upload mới hoặc cấu hình phục vụ đường dẫn cũ phù hợp máy chủ.

## MySQL trên Docker cho máy phát triển

Chạy các lệnh dưới đây từ thư mục `backend/`. Docker Compose chỉ chạy MySQL; backend Spring chạy trên máy Windows với JDK/Maven. Image MySQL 8.0 giữ cùng dòng phiên bản với backend gốc.

### Chuẩn bị lần đầu trên máy mới

Mở Docker Desktop, chờ Docker Engine sẵn sàng, rồi tạo cấu hình riêng:

```powershell
if (!(Test-Path -LiteralPath '.env')) {
    Copy-Item -LiteralPath '.env.example' -Destination '.env'
}
```

Điền `MYSQL_PASSWORD` và `MYSQL_ROOT_PASSWORD` trong `.env` trước lần khởi tạo container đầu tiên. Không ghi đè `.env` đang dùng với một volume đã có dữ liệu. Trên máy được cấu hình trong lượt này, `.env` đã có mật khẩu riêng được tạo ngẫu nhiên; file được Git bỏ qua.

Mặc định kết nối là `127.0.0.1:3306`, database `pet_shop`, user ứng dụng `pawpal`. Nếu cổng 3306 đã có ứng dụng khác dùng, đổi `MYSQL_PORT` trong `.env`; profile Spring đọc cùng giá trị đó. Không cần cài thêm MySQL Server trực tiếp trên Windows.

### Chạy database và backend

```powershell
docker compose up -d --wait mysql
mvn "-Dspring-boot.run.profiles=docker" spring-boot:run
```

Nếu đã build JAR, có thể dùng lệnh sau thay cho Maven để chạy backend, không chạy hai lệnh cùng lúc trên cổng 8080:

```powershell
java -jar target/appointment_system-0.0.1-SNAPSHOT.jar --spring.profiles.active=docker
```

Profile `docker` trong `src/main/resources/application-docker.properties` đọc `.env` qua Spring Config Import. Spring không tự đọc `.env` nếu chạy profile mặc định. Profile này kết nối qua cổng loopback đã publish, dùng `ddl-auto=update`; Hibernate tạo/cập nhật bảng từ Entity hiện có sau khi MySQL tạo database `pet_shop`. Tài khoản `pawpal` dùng cho backend; tài khoản root chỉ dùng để quản trị cục bộ. URL JDBC của profile này cấu hình trao đổi public key và tắt SSL cho kết nối cục bộ qua loopback.

Để khởi tạo **cấu trúc bảng trống**, không cần xin file `.sql`. Dữ liệu người dùng, thú cưng, dịch vụ, nhân viên và lịch hẹn của nhóm cần được nhập/import riêng. Cấu hình này không tự tạo dữ liệu demo hay tài khoản manager.

```powershell
docker compose ps
docker compose logs --tail 50 mysql
docker compose exec mysql mysql -u pawpal -p pet_shop
```

Lệnh cuối hỏi mật khẩu ứng dụng trong `.env`; tại MySQL prompt có thể chạy `SHOW TABLES;` và `SELECT VERSION();`. Nếu đã đổi user hoặc tên database trong `.env`, sửa tương ứng trong lệnh.

### Lưu dữ liệu và dừng

Named volume `pawpal-local_mysql-data` giữ dữ liệu tại `/var/lib/mysql`, kể cả khi container được tạo lại. Dừng bằng `docker compose stop mysql`; chạy lại bằng lệnh `up` ở trên. `docker compose down` gỡ container/network và giữ named volume. Không thêm tùy chọn xóa volume nếu còn cần dữ liệu.

Các biến `MYSQL_DATABASE`, `MYSQL_USER` và mật khẩu chỉ khởi tạo database/user khi volume còn trống. Đổi mật khẩu trong `.env` sau đó không tự đổi mật khẩu đã lưu trong MySQL; phải cập nhật tài khoản MySQL tương ứng. Đổi `MYSQL_PORT` không làm thay đổi dữ liệu trong volume.

Docker MySQL này phục vụ backend Spring. Luồng mobile hiện kết nối qua Firebase ID token như mục dưới; thú cưng/dịch vụ vẫn lấy từ Firebase, lịch và snapshot lưu trong MySQL.

### Kết quả cấu hình trên máy ngày 24/11/2026

- Container `pawpal-local-mysql-1` chạy MySQL **8.0.46**, trạng thái healthy; chỉ publish `127.0.0.1:3306`.
- MySQL tạo database `pet_shop`, charset `utf8mb4`, timezone `+07:00`.
- Backend build thành công, khởi động với profile `docker` và kết nối bằng user ứng dụng từ `.env`.
- Trước khi chạy backend: 0 bảng. Sau khi Hibernate khởi tạo: 9 bảng (`appointment`, `appointment_item`, `groomer`, `notification`, `password_reset`, `pet`, `service_package_item`, `service_type`, `user`) và 7 khóa ngoại.
- Trang `http://127.0.0.1:8080/appointment-system` trả HTTP 200 trong lượt chạy kiểm tra. Tiến trình backend kiểm tra được dừng sau đó; container MySQL được giữ chạy để tiếp tục phát triển.
- Dữ liệu MySQL nằm trong named volume `pawpal-local_mysql-data`; file mật khẩu `.env` không được Git theo dõi.

Tài liệu: [image MySQL](https://hub.docker.com/_/mysql), [Docker volumes](https://docs.docker.com/engine/storage/volumes/), [Spring Config Import](https://docs.spring.io/spring-boot/docs/2.7.18/reference/html/features.html#features.external-config.files.importing).

## Kết nối Firebase với MySQL — 25/11/2026

Firebase Auth là danh tính của mobile. Thú cưng, hồ sơ liên hệ và danh mục dịch vụ có nguồn chính ở RTDB. Spring xác minh ID token bằng Firebase Admin (`checkRevoked=true`), đọc role từ `/roles/{uid}` mỗi yêu cầu, liên kết UID với `user.firebase_uid`, rồi dùng nghiệp vụ đặt lịch hiện có để lưu MySQL. Cookie cũ không được dùng thay token của mobile.

Trong `.env` của backend (đã được Git bỏ qua), đặt `PAWPAL_FIREBASE_ENABLED=true`, project ID và database URL tương ứng, cùng `PAWPAL_FIREBASE_CREDENTIALS_FILE` là đường dẫn tuyệt đối tới service-account JSON **bên ngoài mã nguồn**. Có thể dùng `GOOGLE_APPLICATION_CREDENTIALS`/ADC thay cho đường dẫn này. Không đưa file JSON vào frontend, Git hoặc báo cáo. Chạy profile `docker` để Spring đọc `.env`; không cần thêm service account vào app React Native.

Tài khoản SQL mới được tạo theo Firebase UID, không có mật khẩu đăng nhập SQL. Nếu email đã tồn tại trong dữ liệu SQL nhưng chưa có UID, backend trả 409; quản trị viên cần xác minh và gắn UID vào tài khoản đúng. Không tự nhập hai tài khoản dựa trên email. Người dùng chỉ mang token customer không thể dùng cookie manager để nâng quyền.

Các form quote/slots/create/edit của mobile gửi `firebasePetId` và `firebaseServiceIds`. Backend tự đọc `pets/{uid}/{petId}` và `services/{serviceId}`, tạo/cập nhật bản liên kết SQL theo khóa duy nhất; client không gửi giá làm nguồn tin cậy. Khi tạo/sửa lịch, backend đọc lại giá, thời lượng, ưu đãi và trạng thái dịch vụ; báo giá cũ trả 409. Bản ghi lịch giữ snapshot, bao gồm `firebaseServiceId` cho từng item, `firebasePetId` trong phản hồi để chọn lại đúng khi sửa. Bản liên kết SQL không được chỉnh qua API catalog SQL cũ.

Backend ghi khóa `petBookings/{uid}/{petId}/spring_{uuid}` trước khi đọc thú cưng và lưu lịch. Rules hiện có chặn xóa hồ sơ khi khóa tồn tại. Nếu transaction SQL thất bại, backend dọn khóa; nếu hủy/kết thúc lịch thành công thì dọn sau commit. Nếu Firebase mất mạng khi dọn, khóa được giữ để an toàn. Tác vụ định kỳ thử lại, giữ khóa của lịch mở và chỉ xóa reservation mồ côi do backend tạo khi đã quá 10 phút. Không giả định MySQL và RTDB có một transaction chung.

MySQL dùng `ddl-auto=update` bổ sung cột liên kết, không xóa/import lại database. Cần sao lưu trước khi cập nhật database có dữ liệu. Trên máy này đã sao lưu tại `../_pawpal_audit_tmp/firebase-bridge-before.sql`; khóa riêng nằm ngoài workspace và chỉ đường dẫn được lưu trong `.env`.

Lượt kiểm tra toàn bộ tiếp theo bổ sung mở rộng `groomer.phone_number` lên 20 ký tự bằng migration idempotent để nhận định dạng quốc tế giống form mobile. Chuỗi số điện thoại/ảnh trống được chuẩn hóa thành null; không bắt buộc nhập hai trường này khi thêm nhân viên. Có bản sao lưu riêng `../_pawpal_audit_tmp/recheck-all-before.sql` trước lượt sửa.

Trên Windows, dừng backend trước khi đóng gói lại nếu nó chạy trực tiếp từ JAR trong `target/`; file đang mở có thể bị khóa hoặc bị ghi lại không hoàn chỉnh. Lượt nghiệm thu hiện chạy bản sao JAR riêng trong `_pawpal_audit_tmp/` để việc build không đụng tiến trình đang phục vụ.

Kiểm tra cục bộ với Firebase Auth/Database Emulator: đặt project `demo-pawpal`, URL database `http://127.0.0.1:9000`, `FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099`. Backend chỉ chấp nhận chế độ token không ký của Emulator khi project bắt đầu bằng `demo-`, Auth/Database đều ở loopback; không dùng biến Emulator với project thật. Rules vẫn triển khai theo file frontend.

Tài liệu chính thức: [Admin setup](https://firebase.google.com/docs/admin/setup), [Verify ID tokens](https://firebase.google.com/docs/auth/admin/verify-id-tokens), [Database REST authentication](https://firebase.google.com/docs/database/rest/auth).

## Dữ liệu SQL cũ

Trước lần chạy đầu trên database có dữ liệu, tạo bản sao lưu. Mặc định Hibernate `update` bổ sung các cột/bảng mới: snapshot lịch, thông báo, reset mật khẩu, thành phần gói, thông tin hồ sơ, version và trạng thái danh mục.

`LegacyDataMigration` chạy idempotent sau khi schema sẵn sàng: mở rộng cột password/phone_number cũ trên MySQL để lưu BCrypt và số điện thoại, khởi tạo version còn null, mã lịch, tên thú cưng và snapshot dịch vụ từ giá/tổng/thời lượng cũ. Không quy đổi giá cũ sang VND và không thay tổng đã lưu. Dữ liệu giá cũ từng dùng ký hiệu `$` phải được nhóm rà soát đơn vị trước khi đưa vào báo cáo VND; backend không tự đoán tỷ giá. Các mốc thời gian cũ cũng cần kiểm tra nếu máy chủ trước đây chạy GMT+8.

Email có ràng buộc duy nhất cho đăng nhập bằng email. Database cũ cần xử lý email trùng trước khi nâng cấp.

Các tên `Accepted/Finished` được chuẩn hóa khi đọc và dùng trong nghiệp vụ. Mật khẩu cũ nâng lên BCrypt sau lần đăng nhập đúng. Không ghi đè danh mục bằng dữ liệu demo và không tự tạo tài khoản quản lý chung; dùng tài khoản quản lý hiện hữu hoặc tạo bản ghi quản lý qua quy trình quản trị database.

## Kiểm thử

```powershell
$env:JAVA_TOOL_OPTIONS = '-Dfile.encoding=UTF-8 -Dsun.jnu.encoding=UTF-8'
mvn test
mvn -DskipTests package
```

Test dùng H2 ở MySQL mode riêng biệt, không kết nối MySQL hoặc SMTP thật. Phủ các luồng đăng nhập → quote → đặt lịch, nhiều dịch vụ/snapshot, quyền sở hữu, xung đột gói/khám, giờ làm, thay giá, version, hủy/hoàn thành, doanh thu/CSV và hai thread tranh cùng slot. H2 kiểm tra cơ chế transaction/locking trong bộ test; vẫn cần nghiệm thu MySQL thực tế và app mobile trước khi triển khai.
