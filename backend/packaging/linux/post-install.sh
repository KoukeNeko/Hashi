#!/bin/bash

# 1. 建立專用使用者 (如果不存在)
if ! id "hashi" &>/dev/null; then
    useradd -r -s /bin/bash -m -d /opt/hashi-home hashi
fi

# 2. 將使用者加入必要的群組 (Docker, Libvirt)
# 這樣程式才能透過 Unix Socket 存取 Docker 和 Libvirt
usermod -aG docker hashi || true
usermod -aG libvirt hashi || true
usermod -aG kvm hashi || true

# 3. 設定 sudo 權限
cp /opt/hashi-backend/lib/sudoers /etc/sudoers.d/hashi-backend
chmod 0440 /etc/sudoers.d/hashi-backend

# 4. 重新載入 Systemd 並啟動
systemctl daemon-reload
systemctl enable hashi-backend
systemctl restart hashi-backend

# 5. 顯示安裝完成資訊
echo ""
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║                                                                  ║"
echo "║   🎉  Hashi Backend 安裝完成！                                   ║"
echo "║                                                                  ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""
echo "📦 服務資訊："
echo "   • 服務名稱：hashi-backend"
echo "   • 安裝路徑：/opt/hashi-backend"
echo "   • 執行使用者：hashi"
echo ""
echo "🔧 常用指令："
echo "   • 查看狀態：sudo systemctl status hashi-backend"
echo "   • 停止服務：sudo systemctl stop hashi-backend"
echo "   • 重啟服務：sudo systemctl restart hashi-backend"
echo "   • 查看日誌：sudo journalctl -u hashi-backend -f"
echo ""
echo "🌐 存取方式："
echo "   • API 端點：http://localhost:8080"
echo "   • 健康檢查：http://localhost:8080/actuator/health"
echo ""

# 顯示服務狀態
echo "📊 目前服務狀態："
systemctl status hashi-backend --no-pager -l 2>/dev/null || echo "   ⚠️ 服務可能尚在啟動中，請稍後再確認"
echo ""