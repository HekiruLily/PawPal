# Thiết lập phần Thú cưng và Dịch vụ

Phần này dùng **React Native CLI + TypeScript**, Firebase JS SDK (`firebase/auth`, `firebase/database`) và Cloudinary unsigned upload theo `yc.docx`. Đã điền cấu hình Firebase project `pawpal-e40a5` và URL Realtime Database vùng Singapore từ Console của người dùng; Emulator đang tắt. Đã kiểm chứng đăng ký qua APK Pixel_7 với Email/Password trên Firebase thật và đọc lại hồ sơ chính chủ trong Realtime Database (25/11/2026). Cloudinary chưa được cấu hình. Không có tài khoản quản lý, danh sách thú cưng hoặc danh sách dịch vụ giả được đưa vào luồng chính.

## 1. Firebase của nhóm

1. Tạo project trong [Firebase Console](https://console.firebase.google.com/), đăng ký một **Web app** để lấy cấu hình Firebase JS SDK. Dự án vẫn là React Native CLI; không chuyển sang web hay Expo.
2. Trong Authentication → Sign-in method, bật **Email/Password**.
3. Tạo **Realtime Database**, chọn vị trí rồi sao chép đúng URL của database. Không chọn Cloud Firestore thay cho Realtime Database.
4. Điền cấu hình công khai vào `src/services/firebaseConfig.ts`:

```ts
export const firebaseConfig = {
  apiKey: 'giá trị từ Firebase Console',
  authDomain: 'project-id.firebaseapp.com',
  databaseURL: 'URL Realtime Database thực tế của nhóm',
  projectId: 'project-id',
  appId: 'giá trị từ Firebase Console',
};
```

5. Đăng nhập Firebase CLI và triển khai **file `database.rules.json` đi kèm** vào đúng project:

```powershell
npx --yes firebase-tools@15.37.0 login
npx --yes firebase-tools@15.37.0 deploy --only database --project PROJECT_ID_CUA_NHOM
```

Thay `PROJECT_ID_CUA_NHOM` bằng ID thực tế. Không mở quyền `.read/.write: true` để bỏ qua lỗi cấu hình. Cấu hình Web xác định project; Security Rules mới là nơi kiểm soát quyền dữ liệu.

Sau khi thay cấu hình, Reload toàn bộ hoặc khởi động lại ứng dụng để khởi tạo lại Firebase; không chỉ dùng Fast Refresh.

## 2. Khách hàng và quản lý

- Người đăng ký Email/Password mặc định là **customer**, tự quản lý thú cưng của mình và xem dịch vụ đang mở.
- Để cấp quyền quản lý, tạo tài khoản bằng ứng dụng, lấy UID trong Authentication → Users. Thành viên có quyền Firebase Console tạo giá trị chuỗi `"manager"` tại `/roles/UID_DO` trong Realtime Database. Đăng xuất/đăng nhập lại để kiểm tra.
- Ứng dụng không có nút tự cấp quyền. Rules cấm mọi client sửa `/roles` và cấm nhét `role` vào hồ sơ người dùng.
- Quản lý vào tab Dịch vụ để tạo dịch vụ đầu tiên. Không cần nhập seed giả để ứng dụng hoạt động.

Schema đang sử dụng:

```text
roles/{uid}                         → "manager" (chỉ Console/Admin cấp)
users/{uid}                         → name, email, phoneNumber?, address?
pets/{uid}/{petId}                  → ownerId, name, species, breed, age,
                                      size, gender, notes, imageURL
services/{serviceId}                → name, category, description, price,
                                      duration, active, imageURL, revision,
                                      discountPercent?, promotionStart?, promotionEnd?
petBookings/{uid}/{petId}/{bookingId} → true (dành cho module đặt lịch)
```

Khách chỉ đọc/ghi `pets/{uid}` của mình. Người đã đăng nhập đọc được danh mục dịch vụ; giao diện khách chỉ hiển thị dịch vụ `active: true`. Chỉ manager sửa dịch vụ. Giá là số nguyên đồng từ 1 đến 999999999; thời lượng 5–600 phút; tuổi thú cưng là số nguyên 0–30. Ảnh có thể để trống. Manager tạm ngưng dịch vụ bằng Switch, không xóa cứng. `revision` và transaction phát hiện form cũ khi có người khác sửa cùng lúc.

## 3. Cloudinary

1. Tạo tài khoản Cloudinary, lấy **Cloud name** trong Dashboard.
2. Trong Settings → Upload → Upload presets, tạo preset với **Signing mode: Unsigned**. Thiết lập giới hạn JPEG/PNG/WebP, dung lượng tối đa 5 MB và thư mục ảnh của nhóm theo tùy chọn preset hỗ trợ. Ứng dụng cũng kiểm tra định dạng/dung lượng trước khi tải.
3. Điền `cloudName` và `unsignedPreset` vào `cloudinaryConfig` trong cùng file cấu hình.

```ts
export const cloudinaryConfig = {
  cloudName: 'cloud-name-cua-nhom',
  unsignedPreset: 'ten-preset-unsigned',
};
```

**Không đưa Cloudinary API Secret hoặc Firebase service-account key vào ứng dụng.** Upload chỉ gửi `file` và `upload_preset`. Thành công mới lưu `secure_url` vào Realtime Database. Không có Cloudinary vẫn thêm/sửa được hồ sơ và dịch vụ không kèm ảnh.

Nếu upload thành công nhưng người dùng hủy form hoặc lưu dữ liệu thất bại, ảnh có thể còn trên Cloudinary. Việc dọn ảnh mồ côi cần công cụ quản trị hoặc mã tin cậy phía server; client unsigned không được giữ API Secret để xóa ảnh.

## 4. Kiểm tra cục bộ bằng Emulator

Kiểm tra rules không cần project cloud hay đăng nhập Firebase. Cài Node theo `package.json` và Java 21 trở lên, sau đó chạy:

```powershell
npm ci
npx tsc --noEmit
npm test -- --runInBand
npx --yes firebase-tools@15.37.0 emulators:exec --only database --project demo-pawpal "node --test tests/database.rules.mjs"
```

Các dữ liệu thử trong `tests/` chỉ chạy trên emulator của project `demo-pawpal`; không tự seed vào ứng dụng hoặc database của nhóm.

Để tự thử giao diện với Auth và Database Emulator:

1. Chạy `npx --yes firebase-tools@15.37.0 emulators:start --only auth,database --project demo-pawpal`.
2. Tạm điền cấu hình demo trong `firebaseConfig.ts`: `apiKey: 'demo-key'`, `projectId: 'demo-pawpal'`, `appId: 'demo-pawpal-app'`, `authDomain: 'demo-pawpal.firebaseapp.com'`, `databaseURL: 'https://demo-pawpal-default-rtdb.firebaseio.com'`.
3. Đặt `firebaseEmulators.enabled: true`. Android Emulator dùng host `10.0.2.2`; iOS simulator/Web dùng `127.0.0.1`. Điện thoại thật cần địa chỉ LAN và cấu hình emulator lắng nghe trên LAN; `firebase.json` mặc định chỉ mở localhost cho kiểm tra trên máy.
4. Chạy app bằng `npm run android`, đăng ký tài khoản thử. Mở Emulator UI theo địa chỉ CLI in ra để xem dữ liệu và cấp `/roles/{uid}: "manager"` cho tài khoản quản lý thử. Email reset mật khẩu của Auth Emulator được in trong terminal, không gửi email thật.
5. Khi chuyển sang project thật, khôi phục cấu hình thật và **tắt `firebaseEmulators.enabled`**. Cloudinary vẫn cần cấu hình riêng nếu muốn thử tải ảnh thật.

Trên Windows, `gradlew.bat` có thể lỗi khi đường dẫn dự án chứa dấu. Có thể gọi Java trực tiếp từ thư mục `android`:

```powershell
& "$env:JAVA_HOME\bin\java.exe" -classpath '.\gradle\wrapper\gradle-wrapper.jar' org.gradle.wrapper.GradleWrapperMain assembleDebug '-Pandroid.overridePathCheck=true'
```

Tùy chọn `android.overridePathCheck` ở đây chỉ áp dụng cho lần gọi lệnh, để vượt kiểm tra đường dẫn có dấu của AGP; không sửa `gradle.properties`. Nếu công cụ native khác vẫn lỗi đường dẫn, cần chạy dự án từ đường dẫn không dấu.

Firebase CLI cũng có thể gặp lỗi đường dẫn có dấu khi gọi Java. Khi gặp `Unable to access jarfile`, đặt cache emulator vào thư mục tạm không dấu rồi chạy lại lệnh kiểm tra:

```powershell
$env:FIREBASE_EMULATORS_PATH = Join-Path $env:TEMP 'pawpal-firebase-emulators'
```

## 5. Cấu trúc và phạm vi bàn giao

```text
src/services/    Firebase Auth, RTDB, upload Cloudinary và cấu hình
src/api/         authApi, petApi, serviceApi: đầu vào cho hooks/context
src/hooks/       useAuth, usePets, useServices, useImageUpload
src/context/     AuthContext, ToastContext
src/components/  PetCard, PetForm, ServiceCard, ServiceForm, PhotoPicker,
                 BottomSheetModal, ChipFilterBar, ActionButton…
src/screens/     PetListScreen, ServiceListScreen, ManageServicesScreen,
                 LoginScreen, RegisterScreen, ResetPasswordScreen
src/navigation/  AppNavigator, routes
src/theme/       colors, typography, spacing, layout
src/utils/       validators, errors, currency, date
src/storage/     adapter AsyncStorage để giữ phiên Firebase Auth
assets/images/   ảnh minh họa dịch vụ lấy từ HTML demo được cung cấp
assets/fonts/    font Inter trích từ HTML, kèm thông tin giấy phép
```

Logic dùng `.ts`, thành phần JSX dùng `.tsx`. Services không import `react-native`; adapter storage và thao tác chọn ảnh đặt ở tầng native bên ngoài services. Listener Auth/RTDB được tháo khi đổi tài khoản, retry hoặc unmount. Giao diện dùng component React Native và token kem–vàng–đỏ sẵn có, không dùng UI kit.

Navigator hiện có đủ 5 tab khách (Trang chủ, Dịch vụ, Đặt lịch, Lịch hẹn, Thú cưng) và 5 tab quản lý (Tổng quan, Lịch hẹn, Dịch vụ, Nhân viên, Tài khoản). Giới thiệu, hồ sơ, thông báo, kết quả đặt lịch và báo cáo là các màn stack. Đăng ký/quên mật khẩu, thú cưng/dịch vụ và hồ sơ liên hệ dùng Firebase; lịch hẹn/nhân viên/báo cáo dùng API Spring/MySQL. Cầu nối danh tính và mã dữ liệu đã được triển khai, kiểm tra thật trong lượt mục 12; backend không thay đổi trong lượt giao diện ban đầu.

Màn đặt lịch có 4 bước. Backend hiện tạo/dọn chỉ mục `petBookings` cho lịch liên kết như mục 12; rules cấm xóa thú cưng khi chỉ mục còn tồn tại. Giá/thời lượng/ưu đãi tại thời điểm đặt lưu riêng trong MySQL; màn dịch vụ cập nhật danh mục Firebase, backend đọc lại khi báo giá và gửi lịch.

Tài liệu chính thức: [Firebase Auth](https://firebase.google.com/docs/auth/web/start), [Realtime Database và listener](https://firebase.google.com/docs/database/web/read-and-write), [Security Rules](https://firebase.google.com/docs/database/security), [Cloudinary upload presets](https://cloudinary.com/documentation/upload_presets).

## 6. Kết quả kiểm tra ngày 24/11/2026

- TypeScript `tsc --noEmit` và ESLint trên các file thay đổi: đạt, không có warning lint.
- Jest: **34/34** kiểm tra đạt, gồm nhập liệu, phiên/quyền, gỡ listener, lọc danh mục, cập nhật có xung đột, form thú cưng, sửa giá trực tiếp, ngày kết thúc ưu đãi và hợp đồng unsigned upload.
- Database Emulator: **11/11** kiểm tra đạt. Có kiểm tra quyền đọc/ghi, chống tự nâng quyền, dữ liệu không hợp lệ, bảo vệ chỉ mục lịch, ưu đãi hợp lệ/không hợp lệ và gọi trực tiếp module pet/service thật với database cục bộ, gồm thứ tự danh mục và transaction trên client chưa có cache.
- Metro đóng gói JavaScript và asset cho Android thành công.
- APK debug **x86_64 đã build thành công và chạy trên Android Emulator Pixel_7**. Đã xem trực tiếp danh sách dịch vụ, danh sách thú cưng, form sửa thú cưng và màn quản lý giá; xác nhận sửa hồ sơ, lưu giá/thời lượng, tạm ngưng/mở lại qua giao diện thực sự ghi vào RTDB Emulator và giữ ưu đãi. APK debug dùng Metro; chưa kiểm tra điện thoại ARM hoặc iOS.
- Cấu hình Emulator dùng khi chụp ảnh đã được khôi phục về cấu hình gốc; các tiến trình/máy ảo thử và ánh xạ ổ đĩa tạm đã được dọn. Dữ liệu mẫu chỉ nằm trong Emulator riêng.
- Chưa kiểm tra Firebase/Cloudinary cloud thật vì nhóm chưa có cấu hình. Upload được kiểm tra bằng request giả trong test; database được kiểm tra bằng emulator, không phải database cloud của nhóm.

## 7. Giao diện theo HTML Nắng Mật Ong

Đợt cập nhật này lấy `PawPal-Nang-Mat-Ong.html` làm mẫu cho danh sách thú cưng, form thêm/sửa thú cưng, danh sách dịch vụ và chỉnh giá dịch vụ của manager. Giữ các tên `PetListScreen.tsx`, `PetForm.tsx`, `ServiceListScreen.tsx`, `ManageServicesScreen.tsx`, `petApi.ts`, `serviceApi.ts` và cách phân tầng sẵn có.

- Thẻ thú cưng dùng ảnh 84 px bên trái, nhãn thông tin và nút sửa/xóa; form chia cột Loài/Tuổi và Kích cỡ/Giới tính, có Hủy và Thêm/Lưu. Tùy chọn ảnh Cloudinary nằm trong mục mở rộng để giữ bố cục gần mẫu.
- Danh sách dịch vụ dùng thẻ ngang, tìm kiếm và lọc loại; quản lý sửa giá/thời lượng ngay trong thẻ, có Tạm ngưng/Mở lại và Lưu thay đổi. Vẫn giữ tạo dịch vụ và sửa thông tin/ảnh qua nút Thêm/Sửa.
- Font Inter được trích từ font nhúng trong HTML, đặt tại `assets/fonts/`; đã cấu hình đóng gói Android và tài nguyên iOS. Ảnh minh họa hiện có trùng với dữ liệu ảnh của HTML.
- Nếu danh mục có ưu đãi, thành viên quản trị có thể cấu hình `discountPercent` (số nguyên 0–100), `promotionStart`, `promotionEnd` (ngày `yyyy-MM-dd`) trong dữ liệu dịch vụ. Giá hiển thị tính theo ngày Việt Nam, bao gồm ngày cuối; sửa giá hoặc tạm ngưng không làm mất cấu hình ưu đãi. Các trường này tùy chọn, không tự thêm ưu đãi vào dữ liệu thật.

Phạm vi của lượt 24/11 ban đầu là thú cưng/dịch vụ. Lượt 25/11 đã bổ sung đầy đủ màn hình và điều hướng như mục 9. Nút Đặt lịch trong danh mục đưa dịch vụ sang bước chọn lịch; nhấn tên dịch vụ vẫn xem chi tiết. Các luồng Firebase được giữ nguyên. Sau bước thiết lập Firebase, cấu hình cloud đã được điền cho project `pawpal-e40a5`; Emulator vẫn tắt.

Khi dùng Firebase Emulator trên Windows, Firebase CLI gọi `java` trên PATH. Nếu máy có nhiều JDK, cần đặt cả `JAVA_HOME` và đưa thư mục `bin` của JDK 21 trở lên lên đầu PATH trong phiên PowerShell trước khi chạy lệnh kiểm tra.

## 8. Build Android trong thư mục Windows có dấu

`-Dfile.encoding=UTF-8` đã được thêm vào cấu hình JVM Gradle. Tuy nhiên, Ninja đi kèm CMake 3.22.1 trên máy kiểm tra vẫn lỗi với đường dẫn có dấu. Lượt APK thành công dùng ánh xạ ổ `Q:` tạm trỏ vào chính `PawPal-develop`, rồi tạo lại autolinking từ đường dẫn đó; không đổi tên hoặc di chuyển thư mục dự án.

Khi thực hiện cách này, chọn ổ đĩa đang trống, làm việc từ thư mục đã ánh xạ và tạo lại JSON bằng lệnh `node node_modules/@react-native-community/cli/build/bin.js config` trước khi build. Cache autolinking tạo từ đường dẫn cũ phải được cập nhật; chỉ đổi ổ đĩa rồi giữ cache cũ vẫn có thể làm Ninja đọc lại đường dẫn có dấu. Sau khi xong, trở về thư mục gốc và gỡ ánh xạ bằng `subst Q: /D`.

Lượt kiểm tra dùng Java đi kèm Android Studio và các tham số sau khi gọi `org.gradle.wrapper.GradleWrapperMain` từ thư mục `android`:

```text
assembleDebug
-Pandroid.overridePathCheck=true
-PreactNativeArchitectures=x86_64
-Pkotlin.compiler.execution.strategy=in-process
-Dorg.gradle.jvmargs=-Xmx1024m -XX:MaxMetaspaceSize=512m -Dfile.encoding=UTF-8
--max-workers=2 --no-daemon
```

Trong PowerShell, đặt toàn bộ tham số `-Dorg.gradle.jvmargs=...` trong một chuỗi có dấu nháy. `x86_64` là bản kiểm tra máy ảo; cấu hình kiến trúc mặc định trong dự án vẫn giữ nguyên cho các bản build khác.


## 9. Toàn bộ màn hình theo HTML — 25/11/2026

- Khách hàng: `HomeScreen.tsx`, `ServiceListScreen.tsx`, `BookingScreen.tsx` (4 bước), `BookingSuccessScreen.tsx`, `AppointmentListScreen.tsx`, `PetListScreen.tsx`, `ProfileScreen.tsx`, `NotificationsScreen.tsx`.
- Quản lý: `ManagerDashboardScreen.tsx`, `ManageAppointmentsScreen.tsx`, `ManageServicesScreen.tsx`, `ManageGroomersScreen.tsx`, `ManagerAccountScreen.tsx`, `ReportsScreen.tsx`. Giữ màn Khách hàng/Phản hồi cũ có đường quay lại; phản hồi vẫn chưa có API nghiệp vụ.
- Tài khoản: `OnboardingScreen.tsx` (3 trang giới thiệu), `LoginScreen.tsx`, `RegisterScreen.tsx`, `ResetPasswordScreen.tsx`.
- Dùng màu kem/vàng/đỏ, ảnh HTML và font Inter; thêm Noto Serif Display Regular trích từ HTML cho tiêu đề trang chủ. Không thêm thư viện UI hoặc đổi React Native CLI.
- Đặt lịch ẩn thanh tab, có kiểm tra chọn hồ sơ/dịch vụ, ngày ở múi giờ Việt Nam, báo giá/giờ trống từ server, giữ `expectedTotal`, `expectedDuration`, `expectedDiscount` và nhân viên của slot khi gửi. Chỉ chuyển màn thành công sau phản hồi API thành công. Sửa/hủy/phân công/trạng thái đều gửi version.
- Hồ sơ liên hệ lưu `name`, `email`, `phoneNumber`, `address` trong RTDB của chính chủ; client không ghi được role hoặc email khác. Email tài khoản lấy từ Firebase Auth, không cho sửa tại hồ sơ.

**Trạng thái dữ liệu cập nhật:** Lượt giao diện ban đầu còn tách Firebase Auth và cookie Spring/MySQL. Lượt mục 12 đã thay mobile bằng Firebase Bearer token, backend xác minh danh tính/quyền và ánh xạ khóa Firebase sang SQL; đã kiểm tra đặt lịch cloud → MySQL thật. Cookie cũ chỉ phục vụ tài khoản SQL cũ. Cloudinary thật vẫn chưa kiểm tra. CSV hiện chia sẻ nội dung qua bảng chia sẻ native, không tự lưu file vào Downloads.

Dữ liệu mẫu của lượt giao diện ban đầu chỉ nạp vào Emulator riêng. Sau đó, theo yêu cầu bổ sung dữ liệu thật để thử, lượt mục 10–12 tạo các bản ghi QA được nêu rõ; không import seed vào mã ứng dụng.


Kiểm chứng lượt giao diện 25/11:

- TypeScript `npx tsc --noEmit`: đạt. ESLint trên các file thay đổi: 0 lỗi, 0 cảnh báo.
- Jest: 46/46 kiểm tra đạt (10 suite); sau sửa điều hướng bộ lọc đã chạy lại 2 kiểm tra điều hướng khách/quản lý và đều đạt. Bao gồm chống nhầm phiên, phản hồi API đến muộn, phiên bản khi sửa lịch, giữ báo giá và ưu đãi, hủy/expiry theo thời gian, xuất CSV và đường đi tới các tab.
- Realtime Database Emulator: 12/12 kiểm tra đạt, bổ sung quyền và kiểm tra dữ liệu liên hệ hồ sơ; đây là máy chủ Emulator, không phải Firebase cloud của nhóm.
- Metro bundle Android: đạt, đóng gói 28 asset. APK debug x86_64: build thành công, có 8 font, đã mở trên Pixel_7 với Metro. Đã xem trang chủ, bước chọn thú cưng/dịch vụ/ngày giờ, hồ sơ, tổng quan, quản lý lịch hẹn/nhân viên, tài khoản, báo cáo và giới thiệu. Thay số điện thoại qua màn hồ sơ đã được đối chiếu là ghi vào RTDB Emulator.
- Màn quản lý và bước lấy giờ hiển thị đúng giới hạn chưa có phiên/mã dữ liệu backend tương ứng. Luồng gửi lịch thành công được kiểm tra bằng Jest với API mock; chưa xác nhận đặt lịch thực tế xuyên Firebase–Spring. Chưa build iOS hoặc kiểm tra điện thoại ARM.
- Sau kiểm tra đã phục hồi đúng hash cấu hình Firebase gốc, tắt Emulator trong mã bàn giao và dọn tiến trình/máy giả lập/ánh xạ ổ Q tạm.


## 10. Menu, chuyển động và dữ liệu thử Firebase — 25/11/2026

- `BottomTabBar.tsx`: 5 tab được giữ nguyên; vùng chọn màu #FFDCC1, icon 19 px, nút đặt lịch 37×29 px bo 10 px, chữ 11 px. Trạng thái tab chuyển opacity 200 ms, không thêm hiệu ứng bật nảy hoặc trượt trang ngoài HTML. Hỗ trợ tabPress/tabLongPress và tùy chọn Reduce Motion của hệ điều hành.
- `BottomSheetModal.tsx`: nền mờ 220 ms, panel trượt 280 ms theo cubic-bezier(.2,.8,.2,1), panel tối đa 88%, bo góc 28 px. Giữ form trong lúc đóng và chặn tương tác khi đang đóng; vẫn chặn đóng lúc đang lưu/upload.
- Thú cưng: nhãn nền vàng/màu chữ theo theme cuối của HTML, bỏ nhãn giống chưa rõ tự thêm; khoảng cách banner/nút/thẻ khớp cấu trúc mẫu. Đăng xuất vẫn có tại Hồ sơ. Form giữ chọn ảnh và xử lý lỗi thật.
- Dịch vụ: chỉnh khoảng cách tên/mô tả/giá/CTA, icon nút nhỏ 19 px. Quản lý có ô giá/thời lượng 44 px, nút chữ 12 px, trạng thái đang lưu theo từng thao tác. Các trường nhập hiển thị viền focus theo theme.
- Theo yêu cầu thêm dữ liệu để thử, đã tạo bản ghi trên **Firebase cloud thật** project pawpal-e40a5: `pets/aG7YZuuKEWNxWMBdJ6US0C0B1RG2/qa1125_pet_1` (Bơ) và `qa1125_pet_2` (Miu); `services/qa1125_s01` đến `qa1125_s07` lấy nội dung từ HTML. Không thay dữ liệu đã có; không nhúng seed vào luồng ứng dụng.
- Chủ project đã cấp role manager từ Console cho tài khoản thử riêng `pawpal.manager.1125.c7e8@example.com`, UID `j0y4wkePSIfuID3D9CtHYFCbayp1`. App không tự cấp vai trò. Thông tin xác thực không ghi vào mã nguồn hoặc các báo cáo kiểm tra.
- Đã kiểm tra qua UI Android trên cloud thật: thêm Paw QA, sửa tuổi Bơ thành 4, xóa riêng Paw QA; tìm kiếm `cat tia` trả các dịch vụ có nội dung phù hợp. Bơ/Miu được giữ lại để thử tiếp.
- Module `serviceService.ts` thật đã chạy với Firebase cloud: đổi giá/thời lượng, tạm ngưng/mở lại, sau đó khôi phục giá/thời lượng ban đầu; bản ghi qa1125_s01 có revision tăng theo transaction. Kết quả chi tiết ở `_pawpal_audit_tmp/pet-service-cloud-integration-result.json`. Phân biệt kiểm tra module dữ liệu với thao tác UI.
- TypeScript và ESLint các file thay đổi đều đạt; Jest 48/48 (11 suite), có kiểm tra giữ nội dung khi sheet đóng, không cho đóng khi đang lưu và tháo listener Reduce Motion. Không thay Security Rules hoặc dịch vụ dữ liệu trong lượt chỉnh giao diện.

Giới hạn lượt kiểm tra menu: trình duyệt nhúng không truy cập được qua công cụ; đối chiếu HTML bằng CSS/JS nguồn và ảnh người dùng cung cấp, rồi kiểm tra ảnh thực tế từ Android. UI manager chưa kiểm tra xong trong lượt này do Pixel_7 mất kết nối/thoát khi máy thiếu RAM; kiểm tra module manager với Firebase thật đã đạt như trên. Lượt bundle bổ sung đã dừng để giảm tải; không có APK mới được xác nhận.

## 11. Kiểm tra tiếp quản lý dịch vụ trên Android — 25/11/2026

- Đã khởi động lại Pixel_7 bằng đồ họa phần mềm, tắt Vulkan, không nạp snapshot và chạy ẩn cửa sổ để giảm tải. Dùng APK debug x86_64 hiện có với Metro, không build APK mới. Lần máy ảo bị thoát trước đó chưa đủ bằng chứng để kết luận do Docker hoặc lỗi PawPal.
- Đăng nhập tài khoản manager và thao tác trực tiếp qua giao diện Android với Firebase cloud thật: giá `0` và thời lượng `4` bị chặn, dữ liệu không đổi; lưu `195000`/`65`, tạm ngưng rồi mở lại dịch vụ thành công. Đã đối chiếu từng bước bằng cách đọc RTDB độc lập.
- Qua form Thêm, tạo dịch vụ QA giá `123000`, thời lượng `30`, trạng thái tạm ngưng; qua form Sửa đổi tên thành `QA UI updated`, loại `Móng`, mô tả `QA edited on Android`. Firebase xác nhận đúng nội dung và revision tăng từ 0 lên 1. Bản ghi thử `services/-P7DzL6OUDQ55QEzd3RF` được giữ ở trạng thái tạm ngưng để không xuất hiện trong danh mục đặt mới.
- Đã khôi phục `services/qa1125_s01` về giá `180000`, thời lượng `60`, đang mở qua giao diện; Firebase xác nhận revision 8. Các dịch vụ khác không thay đổi trong lượt kiểm tra này.
- Đã force-stop rồi mở lại app: phiên manager được giữ, vào lại tab Dịch vụ thấy bản ghi QA đã sửa và giá/thời lượng gốc của dịch vụ mẫu. Ảnh kiểm chứng: `_pawpal_audit_tmp/manager-ui-after-app-restart.png`.
- Bằng chứng: `_pawpal_audit_tmp/manager-ui-cloud-checkpoints.json`, ảnh `manager-ui-services-invalid.png`, `manager-ui-services-saved.png`, `manager-ui-services-paused.png`, `manager-ui-edited-service.png` và `manager-ui-restored-service.png`. Đây là kiểm tra giao diện thật, bổ sung cho kiểm tra module ở mục 10.
- Chưa phát hiện lỗi ứng dụng trong các thao tác trên nên không sửa mã nguồn ứng dụng hoặc Security Rules. Không chạy lại bộ kiểm tra code vì lượt này chỉ thao tác UI và cập nhật tài liệu. Cloudinary chưa có cấu hình nên chưa kiểm tra upload cloud thật; chưa kiểm tra iOS hoặc điện thoại ARM.

## 12. Firebase → Spring → MySQL thật — 25/11/2026

Đã nối luồng đặt lịch, giữ React Native CLI/TypeScript và cấu trúc cũ. Firebase tiếp tục là nguồn Auth, thú cưng, danh mục dịch vụ và hồ sơ; MySQL lưu nhân viên, lịch, snapshot giá/thời lượng/ưu đãi, trạng thái và thông báo. `petApi.ts`/`serviceApi.ts` tiếp tục dùng Firebase, không chuyển CRUD của phần môn học sang SQL.

- `backendAuthService.ts` lấy ID token hiện tại; `backendSession.ts` gửi Bearer và bỏ cookie, loại phản hồi khi đổi tài khoản. Backend dùng Firebase Admin kiểm tra chữ ký, project, hạn và thu hồi token; quyền lấy từ `/roles/{uid}`, không lấy từ client. Có xử lý tranh chấp tạo liên kết UID ở các yêu cầu đầu đồng thời.
- Backend liên kết UID vào `user.firebase_uid`, không tự nhập chung tài khoản có cùng email. Các model Pet/ServiceType giữ khóa Firebase duy nhất để cập nhật đúng bản liên kết. Quote/slots/create/edit gửi chuỗi `firebasePetId`/`firebaseServiceIds`, không ép sang số. Backend tự đọc dữ liệu chính chủ và giá/trạng thái mới nhất từ RTDB. Lịch trả ID Firebase để form sửa chọn lại đúng hồ sơ/dịch vụ.
- Chốt lịch lưu snapshot vào `appointment_item`. Thay giá Firebase không sửa giá lịch đã đặt; báo giá cũ trả 409. Đăng ký SQL không tự gắn được Firebase UID và tài khoản liên kết không đăng nhập/reset bằng mật khẩu SQL cũ. Số điện thoại hồ sơ là điều kiện tạo lịch của mobile và backend.
- Chỉ mục bảo vệ thú cưng được ghi trước khi đọc/lưu lịch, dọn khi rollback hoặc sau commit hủy/kết thúc. Tác vụ định kỳ phục hồi dọn khóa lỗi mạng và reservation mồ côi quá 10 phút, giữ khóa lịch mở. Không nới Security Rules hoặc cho client ghi chỉ mục.
- Firebase Admin đã cấu hình trong `.env` riêng của backend bằng đường dẫn khóa ngoài workspace do người dùng cung cấp. Không đưa private key/token/password vào mã nguồn hay báo cáo. Backend dùng profile `docker`, MySQL container hiện có và database `pet_shop`; có bản sao lưu trước thay đổi schema.

**Kiểm tra tự động:** `mvn verify`: 73/73 đạt, gồm 7 kiểm tra cầu nối với MVC/JPA thật và Firebase gateway mock; frontend Jest 50/50 (12 suite), TypeScript và ESLint trên file thay đổi đạt. RTDB Emulator 12/12 đạt. Build JAR đạt; dùng NetHttpTransport cho Firebase Auth để tương thích Spring Boot 2, không nâng dependency HTTP toàn dự án.

**Kiểm tra cloud/MySQL thật:** 11 checkpoint qua chính các module API/services frontend, Firebase Auth/RTDB project `pawpal-e40a5`, Spring và Docker MySQL. Bao gồm chặn token sai/khách vào quyền manager; quote/slots; tạo/sửa lịch; manager xác nhận; thông báo; giá mới áp dụng cho báo giá mới và giữ snapshot cũ; hủy lịch và dọn chỉ mục. Xóa thú cưng qua Firebase SDK bị rules từ chối lúc lịch mở, thành công sau khi hủy. Chi tiết: `../_pawpal_audit_tmp/firebase-mysql-live-result.json`.

**Kiểm tra giao diện Android thật:** APK debug x86_64 hiện có chạy với Metro trên Pixel_7, chọn Bơ + Tắm & sấy khô, 28/11/2026 lúc 10:00, 180000 đồng/60 phút. Màn thành công trả mã `PP-0D804E3746FF` (SQL aid 2); truy vấn trực tiếp MySQL khớp mã/giá. Hủy qua app chuyển lịch vào Lịch sử và SQL thành `cancelled`, version 1. Ảnh trong `../_pawpal_audit_tmp/`: `manager-ui-firebase-mysql-success.png`, `manager-ui-firebase-mysql-list.png`, `manager-ui-firebase-mysql-cancelled.png`; truy vấn đối chiếu tại `firebase-mysql-direct-query.tsv`. Không build APK mới vì không đổi native.

**Dữ liệu QA và giới hạn:** Lịch thử đã hủy, thú cưng QA tạm đã xóa, dịch vụ QA đã trả lại giá/trạng thái tạm ngưng. Tài khoản thử có số liên hệ thử để qua bước xác nhận. Nhân viên `QA Firebase-MySQL 25-11` là dữ liệu nghiệm thu tạo riêng, không đại diện nhân viên thật. Liên kết SQL được tạo khi sử dụng backend/đặt lịch, không quét nhập toàn bộ dữ liệu Firebase cũ; các số đếm/danh sách khách thú cưng SQL chỉ tính bản ghi SQL đã có. Chưa kiểm tra Cloudinary thật, iOS, điện thoại ARM hoặc triển khai server Internet. Máy ảo ẩn đã dừng sau kiểm tra để giảm RAM.

Chạy lại backend từ `backend/`: `mvn "-Dspring-boot.run.profiles=docker" spring-boot:run` hoặc `java -jar target/appointment_system-0.0.1-SNAPSHOT.jar --spring.profiles.active=docker`. Cấu hình server chi tiết trong `../backend/docs/SETUP.md`, hợp đồng mới trong `../backend/docs/API.md`. Android dùng địa chỉ host phù hợp/ADB reverse cổng 8080 và 8081; backend và Metro phải đang chạy khi thử APK debug.

## 13. Kiểm tra lại toàn bộ chức năng — 25/11/2026

Lượt này kiểm tra lại mã hiện có và các màn khách/quản lý, dùng tài khoản QA riêng. Không sửa lịch có sẵn của người dùng. Thử luồng cloud trên Firebase thật và `pet_shop` MySQL Docker; luồng đăng ký/reset mật khẩu dùng project Emulator `demo-pawpal`, không gửi email thật hoặc đổi mật khẩu hai tài khoản QA cloud.

Các lỗi đã phát hiện và sửa:

- Form nhân viên gửi số điện thoại/ảnh rỗng nhưng backend từ chối. Backend chuẩn hóa hai trường tùy chọn thành null, hỗ trợ số liên hệ định dạng 7–20 ký tự; mở rộng `groomer.phone_number` lên 20 bằng migration idempotent. Đã tái hiện bằng test HTTP/JPA thất bại trước sửa và xác nhận lại trên MySQL thật.
- Giới hạn nhập liệu của form nhân viên chưa khớp backend. Giữ cấu trúc/tên `ManageGroomersScreen.tsx`, đồng nhất tên/chức danh 50 ký tự, mô tả 255, chuyên môn 500 và kinh nghiệm 0–80 năm.
- API tìm khách hàng chỉ tìm username SQL, bỏ sót tên hiển thị của tài khoản Firebase. Đã tìm không phân biệt dấu theo tên hiển thị/username/email/số điện thoại và có test hồi quy.
- Giờ hẹn ở thẻ tổng quan quản lý bị xuống dòng (ví dụ `11:30` tách chữ số cuối). Đã bỏ chiều rộng cố định, giữ giờ trên một dòng; xem ảnh `recheck-ui-dashboard-time-fixed.png`. TypeScript/ESLint và hai test điều hướng được chạy lại sau sửa nhỏ này.

Kết quả đã chốt:

| Phạm vi | Kết quả và bằng chứng |
|---|---|
| Backend tự động | `mvn verify`: 75/75 đạt, 0 lỗi, build JAR thành công; H2 riêng. Bao gồm lịch nhiều dịch vụ, ưu đãi/gói/khám, tranh chấp slot, quyền, version, hoàn thành/hết hạn, doanh thu và CSV. Log `../_pawpal_audit_tmp/recheck-all-backend-final.log`. |
| Frontend tự động | TypeScript, ESLint toàn `src`/`__tests__` đạt; Jest 50/50, 12 suite. Log `recheck-all-tsc-final.log`, `recheck-all-eslint-final.log`, `recheck-all-jest-final.log` trong thư mục audit. |
| Firebase Rules | RTDB Emulator 12/12 đạt; đăng ký/đăng nhập/đăng xuất/reset mật khẩu 9/9 trên Auth + RTDB Emulator qua `authService.ts` thật. Mã reset dùng một lần được kiểm tra; không phải email cloud thật. |
| API/services với dữ liệu thật | 46/46 checkpoint đạt. CRUD nhân viên, hồ sơ/thú cưng, giá/thời lượng/trạng thái dịch vụ, chặn quyền, quote/slots, tạo/sửa/xác nhận/phân công/từ chối/hủy lịch, xung đột/giá cũ/version cũ, thông báo/đánh dấu đã đọc, danh sách khách, dashboard/report và CSV. File `../_pawpal_audit_tmp/recheck-all-live-result.json`. |
| Android — khách hàng | Đã xem trang chủ/hồ sơ/thông báo, tìm dịch vụ không dấu và xem chi tiết, thêm/sửa/xóa thú cưng QA; tạo/sửa/hủy lịch qua UI. Lịch QA aid 9, mã `PP-3E18848A4069`, 180000 đồng/60 phút; MySQL xác nhận `cancelled`, version 3. |
| Android — quản lý | Đã tải tổng quan/lịch, thêm/sửa/tạm ngưng/mở lại/xóa nhân viên QA; tạo/sửa thông tin, giá/thời lượng và trạng thái dịch vụ Firebase; lọc kỳ báo cáo, xem CSV và mở bảng chia sẻ Android mà không gửi; mở danh sách khách, kiểm tra giới hạn màn phản hồi và đủ ba trang giới thiệu. Form đăng ký/reset mật khẩu chặn dữ liệu thiếu/không hợp lệ trước khi gọi cloud. |

Ảnh và checkpoint Android được ghi tại `../_pawpal_audit_tmp/recheck-ui-result.json` và `recheck-ui-*.png`. Đây là APK debug x86_64 hiện có với JavaScript từ Metro; không build APK mới vì chỉ thay logic/form TypeScript và backend Java. Các lỗi chọn nhầm phần tử trong helper QA được phân biệt với lỗi ứng dụng và không được tính là chức năng hỏng.

Đã hoàn tất 35 checkpoint UI (bao gồm kiểm tra màn/chức năng còn giới hạn), đăng xuất manager rồi đăng nhập customer: không giữ tab/quyền quản lý. Ảnh cuối `recheck-ui-final-customer.png`. Báo cáo tổng hợp có số kiểm tra và trạng thái runtime: `../_pawpal_audit_tmp/recheck-final-report.json`. App được để lại tại tab Thú cưng, tài khoản khách QA; backend, MySQL và Metro tiếp tục chạy để người dùng thử tiếp.

Lượt build đầu bị Windows khóa JAR đang chạy; đã dừng tiến trình, build lại và chuyển runtime sang bản sao JAR riêng trong thư mục audit để không đụng file đang phục vụ. Có sao lưu MySQL `recheck-all-before.sql`. Các lịch/nhân viên QA có lịch sử được giữ ở trạng thái kết thúc/tạm ngưng; thú cưng QA tạm được xóa và dữ liệu dịch vụ/hồ sơ đã sửa để kiểm tra được khôi phục.

Dịch vụ tạo riêng qua UI được giữ tạm ngưng: `services/-P7FthHrtXvja9U8Sqkh` (`QA UI service edited`, 127000 đồng/40 phút). Dịch vụ mẫu `qa1125_s01` vẫn 180000 đồng/60 phút, đang mở; `QA UI updated` được khôi phục 123000 đồng/30 phút và tạm ngưng. Firebase được đọc lại độc lập tại checkpoint `full-recheck-final` trong `manager-ui-cloud-checkpoints.json`. Lịch có sẵn ngoài QA không bị sửa/hủy.

Giới hạn: Cloudinary còn thiếu cấu hình nên chưa kiểm tra upload thật; phản hồi bình luận chưa có backend nghiệp vụ; CSV chỉ nghiệm thu mở bảng chia sẻ native/xem dữ liệu, không gửi sang ứng dụng hay người nhận bên ngoài. Hoàn thành/hết hạn và doanh thu khi hoàn thành được kiểm tra trong database test, không tự lùi thời gian hoặc tạo doanh thu QA giả trên database thật. Chưa kiểm tra iOS, thiết bị ARM, mất mạng lâu dài hoặc triển khai Internet. Dữ liệu Firebase cũ vẫn liên kết khi sử dụng backend, chưa nhập hàng loạt.
