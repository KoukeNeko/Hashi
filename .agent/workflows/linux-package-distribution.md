---
description: 設定 Linux 套件自動化建置與多 Suite 發布系統
---

# Linux Package Build & Distribution

以下是可重用的提示詞，用於快速建立 Linux 套件自動化建置與發布系統。

---

## 🎯 Prompt Template

```
我需要為我的 [專案名稱] 建立完整的 Linux 套件自動化建置與發布系統。

### 專案資訊
- 程式類型：[Java/Go/Rust/Node.js/etc.]
- 建置工具：[Gradle/Maven/Cargo/npm/etc.]
- 主要執行檔或產出物：[JAR/Binary/etc.]
- 是否包含前端：[是/否]

### 需求

1. **GitHub Actions CI/CD**：
   - 觸發條件：push 到 backend/**、tag push (v*)、手動觸發
   - 建置 DEB 套件 (Debian/Ubuntu)
   - 建置 RPM 套件 (RHEL/CentOS/Fedora)
   - 支援架構：amd64 + arm64

2. **多 Suite 支援**：
   - stable (tag push)
   - beta (beta branch push)
   - dev (其他 branch push)

3. **套件倉庫托管 (GitHub Pages)**：
   - 倉庫名稱：pkg-repo
   - 結構：apt/ (DEB) + rpm/ (RPM)
   - 按專案分類：pool/$SUITE/PROJECT_NAME/
   - GPG 簽署套件
   - 一鍵安裝腳本

4. **用戶安裝方式**：
   ```bash
   # Debian/Ubuntu (選擇 suite)
   curl -fsSL https://[username].github.io/pkg-repo/apt/install.sh | sudo bash -s [stable|beta|dev]
   sudo apt install [package-name]

   # RHEL/CentOS/Fedora
   curl -fsSL https://[username].github.io/pkg-repo/rpm/install.sh | sudo bash
   sudo dnf install [package-name]
   ```

5. **版本發布流程**：
   - git tag vX.Y.Z && git push origin vX.Y.Z
   - CI 自動建置 4 個套件 (deb-amd64, deb-arm64, rpm-amd64, rpm-arm64)
   - 自動推送至 pkg-repo/$SUITE/PROJECT_NAME/ 並更新索引

### 注意事項
- 避免寫死 docker.io 依賴（與 docker-ce 衝突）
- ARM64 建置使用 QEMU 模擬，較慢
- jpackage 的 postinst 腳本需直接內嵌 sudoers 和 systemd 配置
- RPM 版本號不能包含 `-`，需替換為 `~`
- PORT 避免使用 8080（太常用），建議使用 3847 等較少用的
```

---

## 📁 最終目錄結構

```
[project]/
├── .github/workflows/
│   └── build-packages.yml     # 建置 DEB + RPM + 發布
├── backend/
│   ├── src/main/resources/
│   │   ├── application.properties  # server.port=3847
│   │   └── static/                  # 前端 build 產物
│   └── packaging/linux/
│       └── postinst                 # 安裝後腳本（內嵌配置）

pkg-repo/
├── apt/
│   ├── pool/
│   │   ├── stable/[project]/       # 正式版套件
│   │   ├── beta/[project]/         # 測試版套件
│   │   └── dev/[project]/          # 開發版套件
│   ├── dists/
│   │   ├── stable/main/binary-{amd64,arm64}/
│   │   ├── beta/main/binary-{amd64,arm64}/
│   │   └── dev/main/binary-{amd64,arm64}/
│   └── install.sh                  # 一鍵安裝（支援 suite 參數）
├── rpm/
│   ├── packages/[project]/
│   ├── repodata/
│   └── install.sh
├── scripts/
│   └── update-repo.sh
├── .github/workflows/
│   └── pages.yml
└── KEY.gpg
```

---

## 🔑 必要的 GitHub Secrets

| Repo | Secret | 用途 |
|------|--------|------|
| 專案 repo | `GPG_PRIVATE_KEY` | 簽署套件 |
| 專案 repo | `APT_REPO_TOKEN` | 推送至 pkg-repo (PAT with repo scope) |
| pkg-repo | `GPG_PRIVATE_KEY` | 簽署 Release 檔 |

---

## 🔧 關鍵技術決策

| 決策點 | 選擇 | 原因 |
|--------|------|------|
| 套件工具 | jpackage | JDK 內建，無需額外依賴 |
| ARM64 建置 | QEMU + Docker | GitHub 免費 runner 不支援原生 ARM64 |
| 倉庫托管 | GitHub Pages | 免費、與 GitHub 整合 |
| RPM 索引 | createrepo_c | 標準工具，CI 可安裝 |
| GPG 簽署 | RSA 4096 | 安全性 + 相容性 |
| 多 Suite | stable/beta/dev | 區分正式版、測試版、開發版 |
| 專案分類 | pool/$SUITE/PROJECT/ | 避免多專案套件混在一起 |

---

## 🚀 Suite 觸發規則

| 觸發來源 | Suite | 說明 |
|---------|-------|------|
| `tag` push (v*) | stable | 正式版發布 |
| `beta` branch push | beta | 測試版 |
| 其他 branch push | dev | 開發版 |
