package dev.koukeneko.hashi.service;

import dev.koukeneko.hashi.model.dto.FileItemDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
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
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@Slf4j
public class FileService {

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
}