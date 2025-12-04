package dev.koukeneko.hashi.controller;

import dev.koukeneko.hashi.model.dto.FileItemDTO;
import dev.koukeneko.hashi.service.FileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/files")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class FileController {

    private final FileService fileService;

    @GetMapping("/list")
    public ResponseEntity<List<FileItemDTO>> listFiles(@RequestParam(defaultValue = "/") String path) {
        // 這裡未來可以加入安全檢查，防止列出不該看的目錄 (雖然我們現在是 Root 權限 XD)
        return ResponseEntity.ok(fileService.listFiles(path));
    }

    // 讀取
    @GetMapping("/content")
    public ResponseEntity<String> getFileContent(@RequestParam String path) {
        try {
            return ResponseEntity.ok(fileService.getFileContent(path));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 儲存 (使用 @RequestBody 接收內容)
    @PostMapping("/content")
    public ResponseEntity<String> saveFileContent(@RequestBody SaveFileRequest request) {
        try {
            fileService.saveFileContent(request.path(), request.content());
            return ResponseEntity.ok("Saved");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    // 刪除
    @DeleteMapping("/delete")
    public ResponseEntity<String> deleteFile(@RequestParam String path) {
        try {
            fileService.deleteFile(path);
            return ResponseEntity.ok("Deleted");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    // 簡單的 DTO，也可以寫在外面
    public record SaveFileRequest(String path, String content) {}
}
