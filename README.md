<div align="center">

# Hashi 🌉
### A Modern, Lightweight Linux Server Management Dashboard

![Java](https://img.shields.io/badge/Java-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-6DB33F?style=for-the-badge&logo=spring-boot&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![KVM](https://img.shields.io/badge/KVM-Libvirt-orange?style=for-the-badge)

<p align="center">
  <strong>Manage your Docker containers, KVM Virtual Machines, and System Files within a single, reactive Web UI.</strong>
</p>

</div>

---

## 📋 System Requirements

- **OS**: Ubuntu 20.04+, Debian 11+, Fedora 36+, or Arch Linux
- **Java**: JDK 25+
- **Node.js**: 22+
- **Docker**: 20.10+ (optional)
- **KVM/Libvirt**: (optional, for VM management)

## 🚀 Quick Start

### Option 1: Install via Package Manager (Recommended)

**Debian / Ubuntu:**
```bash
curl -fsSL https://koukeneko.github.io/pkg-repo/apt/install.sh | sudo bash

sudo apt install hashi        # stable
sudo apt install hashi-beta   # beta
sudo apt install hashi-dev    # dev
```

**RHEL / CentOS / Fedora:**
```bash
curl -fsSL https://koukeneko.github.io/pkg-repo/rpm/install.sh | sudo bash

sudo dnf install hashi        # stable
sudo dnf install hashi-beta   # beta
sudo dnf install hashi-dev    # dev
```

**Access:** http://localhost:3847

### Option 2: Development Setup

```bash
# Clone the repository
git clone https://github.com/KoukeNeko/Hashi.git
cd Hashi

# Setup sudo permissions (one-time)
sudo ./scripts/setup-permissions.sh
```

The script will:
- Configure passwordless sudo for `ufw` (firewall management)
- Configure passwordless sudo for `systemctl` (service management)
- Add your user to `docker` and `libvirt` groups

### 2. Start Development Servers

```bash
# Backend (Spring Boot)
cd backend
./gradlew bootRun

# Frontend (in another terminal)
cd frontend
npm install
npm run dev
```

### 3. Access the Dashboard

Open [http://localhost:3847](http://localhost:3847) in your browser.

## 🛠️ Permission Script Options

```bash
sudo ./scripts/setup-permissions.sh --setup   # Setup (default)
sudo ./scripts/setup-permissions.sh --remove  # Remove permissions
sudo ./scripts/setup-permissions.sh --help    # Show help
```

## 📦 Package Channels

| Package | Channel | Description | Trigger |
|---------|---------|-------------|---------|
| `hashi` | stable | Production release | `git tag v*` |
| `hashi-beta` | beta | Pre-release testing | Push to `beta` branch |
| `hashi-dev` | dev | Development builds | Push to other branches |

All packages support architectures: `amd64`, `arm64`

### Switch Channels

```bash
# Remove current version
sudo apt remove hashi hashi-beta hashi-dev

# Install desired channel
sudo apt install hashi-dev
```
