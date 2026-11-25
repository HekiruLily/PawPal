# PawPal — bản đầy đủ cho nhóm

Nhánh `feature/pet-service-management` chứa frontend React Native CLI/TypeScript và backend Spring/MySQL trong cùng repository. Giữ cấu trúc workspace: `PawPal-develop/` là frontend, `backend/` là backend. Chi tiết Firebase và các luồng đã kiểm tra xem [FIREBASE_SETUP.md](PawPal-develop/FIREBASE_SETUP.md); backend xem tài liệu trong `backend/`.

## Tải và chạy trên Windows

```powershell
git clone --branch feature/pet-service-management https://github.com/HekiruLily/PawPal.git
cd PawPal
```

Nên đặt tại đường dẫn ngắn, không dấu như `C:\Projects\PawPal`. Cần Node.js >=22.11, JDK 17, Docker Desktop đang chạy, Android Studio với Android SDK; mở giả lập hoặc kết nối điện thoại USB trước khi chạy Android. Lần đầu cần Internet để tải dependency và image MySQL.

Frontend đã có cấu hình Firebase công khai của project `pawpal-e40a5`; nhóm dùng chung project này, không tạo lại. Backend cần khóa Firebase Admin JSON được chủ project cấp riêng qua kênh bảo mật, lưu ngoài repository. Không đưa khóa vào Git hoặc app. Nếu chưa được cấp khóa thì chưa chạy được đầy đủ luồng backend.

```powershell
powershell -ExecutionPolicy Bypass -File .\Start-PawPal.ps1 -FirebaseCredentialsFile "C:\Firebase\admin.json" -Android
```

Script tạo `backend/.env` với mật khẩu MySQL ngẫu nhiên, khởi động MySQL Docker, cài frontend bằng `npm ci`, build backend, mở backend và Metro, cài/chạy Android. Firebase Admin được đọc từ đường dẫn riêng, không sao chép khóa vào repo. Lần sau dùng `-Android -SkipInstall` và không cần nhập lại đường dẫn khóa. Log nằm trong `.pawpal-runtime/`. Các cổng 3306, 8080, 8081 cần khả dụng. Nếu đã có MySQL PawPal cũ, phải giữ đúng file `.env` của database đó, không tự tạo mật khẩu mới cho volume cũ.

Kiểm tra điều kiện trước khi chạy bằng `-CheckOnly -FirebaseCredentialsFile "C:\Firebase\admin.json"`. Dừng backend và Metro bằng `Stop-PawPal.ps1`; dừng MySQL bằng `docker compose stop mysql` trong `backend/`. Không xóa volume nếu muốn giữ dữ liệu. Script có thể bị chính sách máy trường chặn; khi đó dùng các lệnh cài/chạy thủ công trong tài liệu từng phần.

## Dữ liệu và tài khoản

Firebase Auth và Realtime Database dùng chung cho đăng nhập, thú cưng và dịch vụ. Tự đăng ký tài khoản trong app; quyền manager phải do người quản trị project cấp trong Rules/roles, client không tự cấp quyền. Không phát hành mật khẩu tài khoản thử trong repository.

MySQL chạy riêng trên mỗi máy; bảng được backend tạo/cập nhật qua JPA nên không cần file SQL để khởi tạo. Lịch hẹn, nhân viên và dữ liệu nghiệp vụ MySQL của từng máy độc lập. Manager cần thêm nhân viên trước khi đặt lịch nếu database mới chưa có nhân viên. Muốn mọi người thấy cùng dữ liệu MySQL thì phải dùng một backend/database chung luôn hoạt động và cấu hình địa chỉ API của app; Firebase chung không tự đồng bộ các MySQL cục bộ.

`PAWPAL_FIREBASE_BOOKING_SCOPE` được script tạo riêng cho mỗi database MySQL để các máy không dọn nhầm chỉ mục bảo vệ thú cưng đang có lịch của nhau. Giữ giá trị này cùng database; các backend dùng chung một MySQL phải dùng cùng scope.

Không đưa `.env`, khóa Admin, dữ liệu database, build cache hoặc `node_modules` lên Git. Cloudinary unsigned preset chưa được cấu hình nên upload ảnh cần bổ sung trong cấu hình frontend trước khi thử. Cấu hình Firebase hiện tại trỏ cloud thật; thao tác app sẽ ảnh hưởng dữ liệu của project nhóm.

## Kiểm tra

```powershell
cd PawPal-develop
npm ci
npx tsc --noEmit
npm test -- --runInBand
cd ../backend
.\mvnw.cmd verify
```

Đợt đóng gói này backend có 77 test chạy thành công. Script khởi động đã kiểm tra cú pháp; kiểm tra điều kiện môi trường dừng ở Docker Engine đang tắt, chưa thử khởi động trọn bộ hoặc tải mới/cài từ đầu trên máy thành viên khác. Không kèm sẵn APK, Android SDK, Docker hoặc khóa riêng. Hướng dẫn hiện tại dành cho Windows/Android; build iOS cần macOS.
