package dev.koukeneko.hashi.service;

import dev.koukeneko.hashi.model.dto.FileItemDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.AccessDeniedException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.attribute.PosixFileAttributeView;
import java.nio.file.attribute.PosixFileAttributes;
import java.nio.file.attribute.PosixFilePermissions;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.Date;
import java.util.List;

@Service
@Slf4j
public class FileService {

    // 禁止刪除的系統關鍵目錄
    private static final List<String> PROTECTED_PATHS = List.of(
            "/", "/home", "/root", "/etc", "/var", "/usr",
            "/bin", "/sbin", "/boot", "/lib", "/lib64",
            "/proc", "/sys", "/dev", "/run", "/tmp");

    // 列出指定路徑下的檔案
    public List<FileItemDTO> listFiles(String pathString) {
        Path path = Paths.get(pathString);

        // 防呆：如果路徑不存在或不是資料夾，回傳空列表 (或丟出 Exception)
        if (!Files.exists(path) || !Files.isDirectory(path)) {
            return Collections.emptyList();
        }

        // 檢查是否有讀取權限
        if (!Files.isReadable(path)) {
            log.warn("No read permission for directory: {}", pathString);
            return Collections.emptyList();
        }

        // 使用 File.listFiles() 替代 Files.list()，更能處理權限問題
        File dir = path.toFile();
        File[] files = dir.listFiles();

        if (files == null) {
            log.warn("Cannot list files in directory (permission denied or I/O error): {}", pathString);
            return Collections.emptyList();
        }

        List<FileItemDTO> result = new ArrayList<>();
        for (File file : files) {
            try {
                FileItemDTO dto = mapToDTO(file.toPath());
                if (dto != null) {
                    result.add(dto);
                }
            } catch (Exception e) {
                log.warn("Skipping file due to error: {}", file.getAbsolutePath());
            }
        }

        // 排序：資料夾在前面，然後依檔名排序
        result.sort(Comparator.comparing(FileItemDTO::isDirectory).reversed()
                .thenComparing(FileItemDTO::name));

        return result;
    }

    private FileItemDTO mapToDTO(Path path) {
        try {
            File file = path.toFile();
            String perms = "-";

            // 嘗試獲取 Linux 權限 (rwx)
            try {
                PosixFileAttributeView view = Files.getFileAttributeView(path, PosixFileAttributeView.class);
                if (view != null) {
                    PosixFileAttributes attrs = view.readAttributes();
                    perms = PosixFilePermissions.toString(attrs.permissions());
                }
            } catch (IOException ignored) {
                // 無法讀取權限時使用預設值
            }

            return FileItemDTO.builder()
                    .name(file.getName())
                    .path(file.getAbsolutePath())
                    .isDirectory(file.isDirectory())
                    .size(file.length()) // 注意：資料夾的大小通常是 4096，這不是內容大小
                    .permissions(perms)
                    .lastModified(new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new Date(file.lastModified())))
                    .build();
        } catch (Exception e) {
            log.warn("Failed to read file info: {}", path, e);
            return null; // 回傳 null，之後會被 filter 過濾掉
        }
    }

    // 讀取檔案內容
    public String getFileContent(String pathString) {
        Path path = Paths.get(pathString);

        if (!Files.exists(path) || Files.isDirectory(path)) {
            throw new RuntimeException("File not found or is a directory");
        }

        try {
            // 防呆：超過 1MB 的檔案不給編輯，避免 OOM
            if (Files.size(path) > 1024 * 1024) {
                throw new RuntimeException("File is too large to edit (Max 1MB)");
            }
            // 讀取字串 (假設是 UTF-8)
            return Files.readString(path, StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new RuntimeException("Failed to read file", e);
        }
    }

    // 儲存檔案內容
    public void saveFileContent(String pathString, String content) {
        Path path = Paths.get(pathString);

        // TODO: 這裡可以加一些安全檢查，例如禁止寫入 /proc 或 /sys
        try {
            Files.writeString(path, content, StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new RuntimeException("Failed to save file", e);
        }
    }

    // 刪除檔案或資料夾
    public void deleteFile(String pathString) {
        Path path = Paths.get(pathString);

        // 安全檢查：不允許刪除根目錄或系統關鍵目錄
        String absPath = path.toAbsolutePath().toString();
        if (PROTECTED_PATHS.contains(absPath)) {
            throw new RuntimeException("Cannot delete system directories");
        }

        if (!Files.exists(path)) {
            throw new RuntimeException("File or directory does not exist");
        }

        try {
            if (Files.isDirectory(path)) {
                // 遞迴刪除資料夾及其內容
                deleteDirectoryRecursively(path);
            } else {
                Files.delete(path);
            }
            log.info("Deleted: {}", pathString);
        } catch (AccessDeniedException e) {
            log.error("Permission denied when deleting: {}", pathString);
            throw new RuntimeException("Permission denied", e);
        } catch (IOException e) {
            log.error("Failed to delete: {}", pathString, e);
            throw new RuntimeException("Failed to delete file", e);
        }
    }

    // 遞迴刪除資料夾
    private void deleteDirectoryRecursively(Path directory) throws IOException {
        File dir = directory.toFile();
        File[] files = dir.listFiles();

        if (files != null) {
            for (File file : files) {
                if (file.isDirectory()) {
                    deleteDirectoryRecursively(file.toPath());
                } else {
                    if (!file.delete()) {
                        throw new IOException("Failed to delete file: " + file.getAbsolutePath());
                    }
                }
            }
        }

        // 刪除空資料夾
        if (!dir.delete()) {
            throw new IOException("Failed to delete directory: " + directory);
        }
    }
}