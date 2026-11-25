package com.cpt202.appointment_system.Services;

import java.net.URI;
import java.net.http.*;
import java.time.Duration;
import java.util.*;
import javax.annotation.PreDestroy;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import com.fasterxml.jackson.databind.*;
import com.google.auth.oauth2.*;
import com.google.firebase.*;
import com.google.firebase.auth.*;
import com.cpt202.appointment_system.Common.ApiException;

/** Trusted Firebase I/O. Credentials belong to the server, never to the mobile app. */
@Service
public class FirebaseService {
    private final String project, database;
    private final boolean enabled;
    private final ObjectMapper json;
    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();
    private FirebaseApp app;
    private GoogleCredentials credentials;
    @Value("${pawpal.firebase.credentials-file:}") private String credentialsFile;
    public FirebaseService(@Value("${pawpal.firebase.enabled:false}") boolean enabled,
            @Value("${pawpal.firebase.project-id:}") String project,
            @Value("${pawpal.firebase.database-url:}") String database, ObjectMapper json) {
        this.enabled = enabled; this.project = project; this.database = database.replaceAll("/+$", ""); this.json = json;
    }
    private boolean emulator() { return System.getenv("FIREBASE_AUTH_EMULATOR_HOST") != null; }
    private synchronized FirebaseApp app() {
        if (!enabled) throw new ApiException(503, "Backend chưa bật kết nối Firebase.");
        if (app != null) return app;
        try {
            if (project.isBlank() || database.isBlank()) throw new IllegalStateException();
            if (emulator()) {
                // Unsigned emulator tokens must never grant access to a production database.
                String authHost = System.getenv("FIREBASE_AUTH_EMULATOR_HOST");
                if (!project.startsWith("demo-") || !authHost.matches("(127\\.0\\.0\\.1|localhost):[0-9]+")
                        || !database.matches("http://(127\\.0\\.0\\.1|localhost):[0-9]+")) throw new IllegalStateException();
                credentials = GoogleCredentials.create(new AccessToken("owner", new Date(Long.MAX_VALUE)));
            } else {
                if (!database.startsWith("https://") || System.getenv("FIREBASE_DATABASE_EMULATOR_HOST") != null) throw new IllegalStateException();
                GoogleCredentials source;
                if (credentialsFile == null || credentialsFile.isBlank()) source = GoogleCredentials.getApplicationDefault();
                else try (java.io.InputStream input = java.nio.file.Files.newInputStream(java.nio.file.Path.of(credentialsFile))) {
                    source = GoogleCredentials.fromStream(input);
                }
                if (source instanceof ServiceAccountCredentials && !project.equals(((ServiceAccountCredentials) source).getProjectId())) throw new IllegalStateException();
                credentials = source.createScoped(List.of(
                        "https://www.googleapis.com/auth/firebase.database", "https://www.googleapis.com/auth/userinfo.email"));
            }
            app = FirebaseApp.initializeApp(FirebaseOptions.builder().setProjectId(project).setCredentials(credentials)
                    // Spring Boot 2 manages an older Apache client. Auth needs no HTTP/2 transport.
                    .setHttpTransport(new com.google.api.client.http.javanet.NetHttpTransport())
                    .setConnectTimeout(5000).setReadTimeout(10000).build(), "pawpal-backend");
            return app;
        } catch (Exception e) { throw new ApiException(503, "Chưa cấu hình Firebase Admin hợp lệ trên backend."); }
    }
    public record Identity(String uid, String email) {}
    public Identity verify(String token) {
        FirebaseApp current = app();
        try {
            FirebaseToken decoded = FirebaseAuth.getInstance(current).verifyIdToken(token, true);
            if (decoded.getEmail() == null) throw new ApiException(401, "Tài khoản cần có email.");
            return new Identity(decoded.getUid(), decoded.getEmail());
        } catch (FirebaseAuthException | IllegalArgumentException e) {
            throw new ApiException(401, "Token Firebase không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.");
        }
    }
    public JsonNode read(String path) { return exchange("GET", path, null); }
    public void write(String path, Object value) { exchange("PUT", path, value); }
    public void remove(String path) { exchange("DELETE", path, null); }
    public static String key(String value) {
        if (value == null || !value.matches("[A-Za-z0-9_-]{1,128}")) throw new ApiException(400, "Mã Firebase không hợp lệ.");
        return value;
    }
    private JsonNode exchange(String method, String path, Object value) {
        app();
        try {
            credentials.refreshIfExpired();
            String suffix = emulator() ? "?ns=" + project + "-default-rtdb" : "";
            HttpRequest request = HttpRequest.newBuilder(URI.create(database + "/" + path + ".json" + suffix))
                    .timeout(Duration.ofSeconds(10)).header("Authorization", "Bearer " + credentials.getAccessToken().getTokenValue())
                    .header("Content-Type", "application/json")
                    .method(method, value == null ? HttpRequest.BodyPublishers.noBody() : HttpRequest.BodyPublishers.ofString(json.writeValueAsString(value))).build();
            HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) throw new IllegalStateException();
            return json.readTree(response.body());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt(); throw new ApiException(503, "Yêu cầu Firebase bị gián đoạn. Hãy thử lại.");
        } catch (Exception e) { throw new ApiException(503, "Không đọc/ghi được Firebase. Chưa thể xác nhận thao tác."); }
    }
    @PreDestroy public synchronized void close() { if (app != null) app.delete(); }
}
