package com.cpt202.appointment_system.Config;

import com.cpt202.appointment_system.Common.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.ConcurrencyFailureException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@RestControllerAdvice
public class ApiExceptionHandler {
    @ExceptionHandler(ApiException.class)
    public ResponseEntity<Result<?>> business(ApiException e) {
        return ResponseEntity.status(e.getStatus()).body(Result.error(String.valueOf(e.getStatus()), e.getMessage()));
    }
    @ExceptionHandler({DataIntegrityViolationException.class, ConcurrencyFailureException.class})
    public ResponseEntity<Result<?>> conflict(RuntimeException e) {
        return ResponseEntity.status(409).body(Result.error("409", "Dữ liệu vừa thay đổi hoặc đã được sử dụng. Hãy tải lại."));
    }
    @ExceptionHandler({HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class})
    public ResponseEntity<Result<?>> invalid(Exception e) {
        return ResponseEntity.badRequest().body(Result.error("400", "Dữ liệu hoặc định dạng ngày giờ không hợp lệ."));
    }
    @ExceptionHandler({org.springframework.web.bind.MissingServletRequestParameterException.class,
            org.springframework.web.multipart.support.MissingServletRequestPartException.class})
    public ResponseEntity<Result<?>> missing(Exception e) {
        return ResponseEntity.badRequest().body(Result.error("400", "Thiếu tham số hoặc tệp bắt buộc."));
    }
    @ExceptionHandler(org.springframework.web.multipart.MaxUploadSizeExceededException.class)
    public ResponseEntity<Result<?>> uploadTooLarge(Exception e) {
        return ResponseEntity.status(413).body(Result.error("413", "Ảnh vượt giới hạn 5 MB."));
    }
    @ExceptionHandler(org.springframework.mail.MailException.class)
    public ResponseEntity<Result<?>> mailUnavailable(Exception e) {
        return ResponseEntity.status(503).body(Result.error("503", "Chưa gửi được email. Vui lòng thử lại sau."));
    }
}
