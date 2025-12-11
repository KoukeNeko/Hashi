package dev.koukeneko.hashi.controller;

import dev.koukeneko.hashi.model.dto.FileItemDTO;
import dev.koukeneko.hashi.service.FileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 檔案管理 Controller 提供基本的檔案瀏覽、讀取、寫入與刪除功能
 */
@RestController
@RequestMapping("/api/v1/files")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class FileController {

    private final FileService fileService;

    /**
     * 列出指定目錄下的檔案與資料夾
     *
     * @param path
     *            目錄路徑 (預設為根目錄 "/")
     * @return 檔案項目列表
     */
    @GetMapping("/list")
    public ResponseEntity<List<FileItemDTO>> listFiles(@RequestParam(defaultValue = "/") String path) {
        // 這裡未來可以加入安全檢查，防止列出不該看的目錄 (雖然我們現在是 Root 權限 XD)
        return ResponseEntity.ok(fileService.listFiles(path));
    }

    /**
     * 讀取檔案內容 (純文字)
     *
     * @param path
     *            檔案路徑
     * @return 檔案內容字串
     */
    @GetMapping("/content")
    public ResponseEntity<String> getFileContent(@RequestParam String path) {
        try {
            return ResponseEntity.ok(fileService.getFileContent(path));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * 儲存檔案內容
     *
     * @param request
     *            包含路徑與新內容的請求物件
     * @return 成功或失敗訊息
     */
    @PostMapping("/content")
    public ResponseEntity<String> saveFileContent(@RequestBody SaveFileRequest request) {
        try {
            fileService.saveFileContent(request.path(), request.content());
            return ResponseEntity.ok("Saved");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    /**
     * 刪除指定檔案或目錄
     *
     * @param path
     *            檔案或目錄路徑
     * @return 成功或失敗訊息 (包含 403, 404 等狀態碼)
     */
    @DeleteMapping("/delete")
    public ResponseEntity<String> deleteFile(@RequestParam String path) {
        try {
            fileService.deleteFile(path);
            return ResponseEntity.ok("Deleted");
        } catch (RuntimeException e) {
            String message = e.getMessage();
            if (message != null && message.contains("Permission denied")) {
                return ResponseEntity.status(403).body("Permission denied");
            } else if (message != null && message.contains("system directories")) {
                return ResponseEntity.status(403).body("Cannot delete system directories");
            } else if (message != null && message.contains("does not exist")) {
                return ResponseEntity.status(404).body("File not found");
            }
            return ResponseEntity.internalServerError().body(message != null ? message : "Failed to delete");
        }
    }

    /**
     * 儲存檔案請求 DTO
     *
     * @param path
     *            檔案路徑
     * @param content
     *            檔案內容
     */
    public record SaveFileRequest(String path, String content) {
    }
}
