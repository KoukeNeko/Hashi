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

echo "Hashi Backend installed successfully!"