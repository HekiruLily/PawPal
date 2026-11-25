package com.cpt202.appointment_system.Services;

import java.io.*;
import java.nio.file.*;
import java.util.UUID;
import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import com.cpt202.appointment_system.Common.ApiException;
import static com.cpt202.appointment_system.Common.ApiException.require;

@Service
public class UploadService {
    private final Path root;
    public UploadService(@Value("${pawpal.upload-directory:./uploads}") String directory) { root = Paths.get(directory).toAbsolutePath().normalize(); }
    public String save(MultipartFile file) {
        require(file != null && !file.isEmpty() && file.getSize() <= 5 * 1024 * 1024, "Ảnh phải từ 1 byte đến 5 MB.");
        try (InputStream stream = file.getInputStream(); javax.imageio.stream.ImageInputStream input = ImageIO.createImageInputStream(stream)) {
            java.util.Iterator<javax.imageio.ImageReader> readers = ImageIO.getImageReaders(input);
            require(readers.hasNext(), "Chỉ chấp nhận ảnh PNG hoặc JPEG.");
            javax.imageio.ImageReader reader = readers.next();
            try {
                String format = reader.getFormatName();
                require("png".equalsIgnoreCase(format) || "jpeg".equalsIgnoreCase(format), "Chỉ chấp nhận ảnh PNG hoặc JPEG.");
                reader.setInput(input);
                require((long) reader.getWidth(0) * reader.getHeight(0) <= 20_000_000, "Ảnh tối đa 20 triệu điểm ảnh.");
                BufferedImage image = reader.read(0);
                Files.createDirectories(root);
                String name = UUID.randomUUID() + ".png";
                require(ImageIO.write(image, "png", root.resolve(name).toFile()), "Không thể lưu ảnh.");
                return "/uploads/" + name;
            } finally { reader.dispose(); }
        } catch (IOException e) { throw new ApiException(400, "Không thể đọc hoặc lưu ảnh."); }
    }
}
