# Quy tắc làm việc trong workspace PawPal

## Skill và phạm vi

- Với công việc viết, đánh giá hoặc refactor code, đọc và áp dụng `.agents/skills/karpathy-guidelines/SKILL.md` cùng các quy tắc dự án dưới đây.
- Yêu cầu hiện tại và các lựa chọn đã chốt của người dùng được ưu tiên khi diễn giải quy tắc dự án. Chỉ hỏi khi thông tin còn thiếu ảnh hưởng đến kết quả và không thể xác định từ code/tài liệu; không hỏi lại những lựa chọn đã được chốt.
- Frontend nằm trong `PawPal-develop/`. Backend riêng nằm trong `backend/`; giữ công nghệ và cấu trúc thực tế của từng phần, chỉ sửa phần liên quan đến yêu cầu.
- `_pawpal_audit_tmp/` là dữ liệu kiểm tra và công cụ tạm, không phải mã nguồn ứng dụng.

## Hiểu yêu cầu trước khi sửa

- Đọc code và phần tài liệu liên quan trước khi triển khai. Yêu cầu môn học trong `yc.docx`, cấu trúc trong `gemini-code-1794879301125.txt` và HTML demo do người dùng cung cấp là các tài liệu cần đối chiếu khi làm tính năng/giao diện.
- Xem `PawPal-develop/FIREBASE_SETUP.md` để hiểu cấu hình, phạm vi đã triển khai và các giới hạn kiểm tra hiện tại. Đối chiếu lại code nếu tài liệu có dấu hiệu cũ.
- Nêu ngắn gọn giả định quan trọng. Không tự suy diễn thêm tính năng, đổi công nghệ hoặc mở rộng phạm vi refactor.

## Frontend React Native

- Dùng React Native CLI và TypeScript theo code hiện tại. File logic mới dùng `.ts`; component và màn hình có JSX dùng `.tsx`. Giữ các tên/đuôi file cũ khi không cần đổi.
- Giữ tên file/thư mục và phong cách code sẵn có. Ví dụ các API của phần này là `petApi.ts`, `serviceApi.ts`; các màn hình là `PetListScreen.tsx`, `ServiceListScreen.tsx`, `ManageServicesScreen.tsx`.
- Giữ phân tầng: màn hình dùng hooks/context và components; API là đầu vào cho hooks/context; I/O Firebase và Cloudinary nằm trong `src/services/`.
- Services dùng Firebase JS SDK và mã TypeScript tái sử dụng được, không import `react-native`. Adapter AsyncStorage nằm ở tầng storage; thao tác chọn ảnh native nằm ngoài services.
- Giao diện dùng các thành phần React Native, StyleSheet/Flexbox và token trong `src/theme/`; bám demo được cung cấp. Giữ React Navigation, không chuyển sang Expo hoặc giao diện web. Không thêm UI kit trái yêu cầu môn học.
- Các nút có handler thực; thể hiện trạng thái đang tải, lỗi và danh sách rỗng khi phù hợp.

## Dữ liệu và quyền truy cập

- Các luồng thú cưng/dịch vụ đang được triển khai theo yêu cầu môn học bằng Firebase Auth Email/Password, Realtime Database và Cloudinary unsigned upload. Không tự chuyển các luồng này sang backend Spring/MySQL hoặc dịch vụ khác.
- Code backend/API cũ là phần riêng; không tự xóa hoặc chuyển đổi khi làm frontend thú cưng/dịch vụ.
- Giữ Security Rules kiểm soát chủ sở hữu dữ liệu và quyền manager; không dùng vai trò do client tự khai báo để cấp quyền ghi.
- Tháo listener Auth/RTDB và hủy công việc liên quan khi unmount/đổi tài khoản. Giữ xử lý lỗi mạng, lỗi quyền và lỗi upload thực tế.
- Không nhúng Cloudinary API Secret hoặc service-account key vào app. Cấu hình chưa có phải được báo rõ; dùng Emulator để kiểm tra thay vì đưa dữ liệu giả vào luồng chính.

## Sửa đúng phạm vi và kiểm chứng

- Mỗi thay đổi phải phục vụ yêu cầu đang làm. Không đổi format hàng loạt, nâng dependency, tạo lớp trừu tượng hoặc dọn code ngoài phạm vi khi không cần thiết.
- Giữ các màn hình, tab và chức năng ngoài phạm vi đang sửa. Không gỡ chúng khỏi navigator chỉ để thu hẹp app về phần đang triển khai.
- Chỉ dọn imports/biến/file trở nên thừa do chính thay đổi hiện tại. Code thừa có từ trước thì báo lại, không tự xóa khi chưa nằm trong yêu cầu.
- Chạy kiểm tra tương ứng với thay đổi từ thư mục `PawPal-develop/`: `npx tsc --noEmit`, ESLint trên file thay đổi, và các Jest test liên quan. Với sửa lỗi, ưu tiên test tái hiện lỗi; không tạo test chỉ để lặp lại implementation hoặc cho chỉnh sửa văn bản/giao diện nhỏ có thể kiểm tra trực tiếp.
- Khi sửa dịch vụ dữ liệu hoặc Security Rules, chạy kiểm tra tích hợp Emulator theo `FIREBASE_SETUP.md`. Khi ảnh hưởng native/build, kiểm tra build phù hợp nếu môi trường đáp ứng.
- Báo rõ phần đã đổi, kiểm tra đã chạy và giới hạn còn lại. Phân biệt mock, Emulator, cloud thật, Metro bundle và APK chạy trên thiết bị; chỉ xác nhận mức đã quan sát được.
