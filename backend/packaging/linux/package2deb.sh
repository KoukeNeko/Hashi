#!/bin/bash
set -e

# ==============================================================================
# Hashi Backend 除錯打包腳本 (含環境檢查)
# ==============================================================================

echo "🔍 [1/6] 檢查系統環境..."

# --- 新增：關鍵依賴檢查 ---
MISSING_TOOLS=()

if ! command -v objcopy &> /dev/null; then
    MISSING_TOOLS+=("binutils (提供 objcopy)")
fi

if ! command -v fakeroot &> /dev/null; then
    MISSING_TOOLS+=("fakeroot")
fi

if [ ${#MISSING_TOOLS[@]} -ne 0 ]; then
    echo "❌ 嚴重錯誤：您的系統缺少打包 .deb 必要的工具！"
    echo "   缺少項目: ${MISSING_TOOLS[*]}"
    echo ""
    echo "   請立即執行以下指令進行安裝："
    echo "   👉 sudo apt-get update && sudo apt-get install binutils fakeroot"
    echo ""
    exit 1
else
    echo "✅ 環境檢查通過：binutils 與 fakeroot 已安裝。"
fi
# ------------------------

# 2. 路徑設定
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# 假設腳本在 packaging/linux/，往上兩層是專案根目錄
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
# 使用 realpath 確保路徑乾淨 (如果系統沒裝 realpath，回退到 readlink 或 pwd)
if command -v realpath &> /dev/null; then
    PROJECT_ROOT=$(realpath "$PROJECT_ROOT")
else
    PROJECT_ROOT=$(cd "$PROJECT_ROOT" && pwd)
fi

BACKEND_DIR="$PROJECT_ROOT"
BUILD_OUTPUT_DIR="$BACKEND_DIR/build/libs"
RESOURCE_DIR="$PROJECT_ROOT/packaging/linux"
OUTPUT_DIR="$PROJECT_ROOT/output"
APP_VERSION="0.0.1"

echo "🔍 [2/6] 路徑確認"
echo "   專案路徑: $PROJECT_ROOT"
echo "   資源路徑: $RESOURCE_DIR"
echo "   輸出路徑: $OUTPUT_DIR"

# 3. 建置 JAR
echo "🚀 [3/6] 開始 Gradle 建置..."
if [ ! -f "$BACKEND_DIR/gradlew" ]; then
    echo "❌ 錯誤：找不到 $BACKEND_DIR/gradlew"
    exit 1
fi

cd "$BACKEND_DIR"
chmod +x gradlew
./gradlew clean bootJar

# 4. 鎖定 JAR 檔
echo "🔍 [4/6] 搜尋 JAR 檔..."
# 重新切換回變數指定的目錄，確保路徑正確
MAIN_JAR_PATH=$(ls "$BUILD_OUTPUT_DIR"/hashi-*.jar 2>/dev/null | head -n 1 || true)

if [ -z "$MAIN_JAR_PATH" ]; then
    echo "❌ 錯誤：建置後找不到 JAR 檔於 $BUILD_OUTPUT_DIR"
    exit 1
fi
MAIN_JAR_NAME=$(basename "$MAIN_JAR_PATH")
echo "✅ 鎖定 JAR: $MAIN_JAR_NAME"

# 5. 準備輸出目錄
echo "🧹 [5/6] 清理舊檔案..."
mkdir -p "$OUTPUT_DIR"
rm -f "$OUTPUT_DIR"/*.deb

# 6. 執行 jpackage
echo "📦 [6/6] 執行 jpackage 打包 (Verbose Mode)..."

# 檢查 JAVA_HOME 裡的 jpackage
if [ -z "$JAVA_HOME" ]; then
    # 嘗試找 java 指令的位置並回推
    JAVA_BIN=$(readlink -f $(which java) 2>/dev/null)
    if [ -n "$JAVA_BIN" ]; then
        export JAVA_HOME=$(dirname $(dirname "$JAVA_BIN"))
    else
        echo "❌ 錯誤：找不到 JAVA_HOME，無法執行 jpackage"
        exit 1
    fi
fi
JPACKAGE_BIN="$JAVA_HOME/bin/jpackage"

if [ ! -f "$JPACKAGE_BIN" ]; then
    echo "❌ 錯誤：在 $JPACKAGE_BIN 找不到 jpackage"
    exit 1
fi

"$JPACKAGE_BIN" \
  --verbose \
  --name hashi \
  --app-version "$APP_VERSION" \
  --type deb \
  --input "$BUILD_OUTPUT_DIR" \
  --main-jar "$MAIN_JAR_NAME" \
  --main-class "org.springframework.boot.loader.launch.JarLauncher" \
  --java-options "-Djava.library.path=/usr/lib/jni" \
  --arguments "--spring.profiles.active=prod" \
  --linux-deb-maintainer "koukeneko@dev" \
  --linux-package-deps "libvirt-clients, libvirt-daemon-system, iptables, sudo" \
  --resource-dir "$RESOURCE_DIR" \
  --dest "$OUTPUT_DIR"

echo "------------------------------------------------"
echo "🎉 打包程序結束！請檢查下方是否有 .deb 檔案："
ls -lh "$OUTPUT_DIR"