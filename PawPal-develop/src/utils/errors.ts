export function errorMessage(error: unknown): string {
  const value = error as { code?: string; message?: string };
  switch (value?.code) {
    case 'auth/invalid-email':
      return 'Địa chỉ email chưa đúng định dạng.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Email hoặc mật khẩu chưa đúng.';
    case 'auth/email-already-in-use':
      return 'Email này đã có tài khoản.';
    case 'auth/weak-password':
      return 'Mật khẩu phải có ít nhất 6 ký tự.';
    case 'auth/too-many-requests':
      return 'Bạn đã thử quá nhiều lần. Vui lòng thử lại sau.';
    case 'auth/network-request-failed':
      return 'Không thể kết nối. Kiểm tra mạng rồi thử lại.';
    case 'PERMISSION_DENIED':
    case 'permission-denied':
      return 'Bạn không có quyền thao tác hoặc dữ liệu đang được sử dụng trong lịch hẹn.';
    default:
      return value?.message || 'Có lỗi xảy ra. Vui lòng thử lại.';
  }
}
