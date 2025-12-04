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
}
