#!/bin/bash
# ============================================================================
# Hashi - Dependency Installation Script
# ============================================================================
# Installs system dependencies required for Hashi server management panel.
# ============================================================================

set -e

readonly COLOR_GREEN='\033[0;32m'
readonly COLOR_YELLOW='\033[1;33m'
readonly COLOR_RED='\033[0;31m'
readonly COLOR_BLUE='\033[0;34m'
readonly COLOR_RESET='\033[0m'

log_info()    { echo -e "${COLOR_BLUE}[INFO]${COLOR_RESET} $1"; }
log_success() { echo -e "${COLOR_GREEN}[OK]${COLOR_RESET} $1"; }
log_warning() { echo -e "${COLOR_YELLOW}[WARN]${COLOR_RESET} $1"; }
log_error()   { echo -e "${COLOR_RED}[ERROR]${COLOR_RESET} $1"; }

PACKAGE_MANAGER=""

detect_package_manager() {
    if command -v apt-get &> /dev/null; then
        PACKAGE_MANAGER="apt"
    elif command -v dnf &> /dev/null; then
        PACKAGE_MANAGER="dnf"
    elif command -v pacman &> /dev/null; then
        PACKAGE_MANAGER="pacman"
    else
        log_error "Unsupported package manager. Please install dependencies manually."
        exit 1
    fi
    log_info "Detected package manager: $PACKAGE_MANAGER"
}

check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "Please run with sudo: sudo $0"
        exit 1
    fi
}

# ============================================================================
# Core Dependencies
# ============================================================================

install_java() {
    log_info "Installing Java 17..."
    case $PACKAGE_MANAGER in
        apt)    apt-get install -y openjdk-17-jdk ;;
        dnf)    dnf install -y java-17-openjdk-devel ;;
        pacman) pacman -S --noconfirm jdk17-openjdk ;;
    esac
    log_success "Java installed: $(java -version 2>&1 | head -1)"
}

install_nodejs() {
    log_info "Installing Node.js 18..."
    case $PACKAGE_MANAGER in
        apt)
            curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
            apt-get install -y nodejs
            ;;
        dnf)
            dnf module install -y nodejs:18
            ;;
        pacman)
            pacman -S --noconfirm nodejs npm
            ;;
    esac
    log_success "Node.js installed: $(node --version)"
}

install_ufw() {
    log_info "Installing UFW..."
    case $PACKAGE_MANAGER in
        apt)    apt-get install -y ufw ;;
        dnf)    dnf install -y ufw ;;
        pacman) pacman -S --noconfirm ufw ;;
    esac
    log_success "UFW installed"
}

# ============================================================================
# Optional Dependencies
# ============================================================================

install_docker() {
    log_info "Installing Docker..."
    case $PACKAGE_MANAGER in
        apt)
            apt-get install -y ca-certificates curl gnupg
            install -m 0755 -d /etc/apt/keyrings
            curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg 2>/dev/null || true
            chmod a+r /etc/apt/keyrings/docker.gpg
            echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
            apt-get update
            apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
            ;;
        dnf)
            dnf install -y dnf-plugins-core
            dnf config-manager --add-repo https://download.docker.com/linux/fedora/docker-ce.repo
            dnf install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
            ;;
        pacman)
            pacman -S --noconfirm docker docker-compose
            ;;
    esac
    systemctl enable --now docker
    log_success "Docker installed: $(docker --version)"
}

install_libvirt() {
    log_info "Installing Libvirt/KVM..."
    case $PACKAGE_MANAGER in
        apt)
            apt-get install -y qemu-kvm libvirt-daemon-system libvirt-clients bridge-utils libvirt-dev
            ;;
        dnf)
            dnf install -y @virtualization libvirt-devel
            ;;
        pacman)
            pacman -S --noconfirm qemu-full libvirt virt-manager dnsmasq
            ;;
    esac
    systemctl enable --now libvirtd
    log_success "Libvirt installed"
}

install_nginx() {
    log_info "Installing Nginx..."
    case $PACKAGE_MANAGER in
        apt)    apt-get install -y nginx ;;
        dnf)    dnf install -y nginx ;;
        pacman) pacman -S --noconfirm nginx ;;
    esac
    log_success "Nginx installed"
}

# ============================================================================
# Main
# ============================================================================

show_help() {
    echo "Usage: sudo $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --all        Install all dependencies (core + optional)"
    echo "  --core       Install core dependencies only (Java, Node.js, UFW)"
    echo "  --docker     Install Docker"
    echo "  --libvirt    Install Libvirt/KVM"
    echo "  --nginx      Install Nginx"
    echo "  --help       Show this help"
    echo ""
    echo "Examples:"
    echo "  sudo $0 --core              # Install Java, Node.js, UFW"
    echo "  sudo $0 --core --docker     # Install core + Docker"
    echo "  sudo $0 --all               # Install everything"
}

main() {
    if [[ $# -eq 0 ]]; then
        show_help
        exit 0
    fi
    
    check_root
    detect_package_manager
    
    local install_core=false
    local install_docker_flag=false
    local install_libvirt_flag=false
    local install_nginx_flag=false
    
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --all)
                install_core=true
                install_docker_flag=true
                install_libvirt_flag=true
                install_nginx_flag=true
                ;;
            --core)
                install_core=true
                ;;
            --docker)
                install_docker_flag=true
                ;;
            --libvirt)
                install_libvirt_flag=true
                ;;
            --nginx)
                install_nginx_flag=true
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
        shift
    done
    
    echo ""
    log_info "Starting dependency installation..."
    echo ""
    
    # Update package lists
    case $PACKAGE_MANAGER in
        apt)    apt-get update ;;
        dnf)    dnf check-update || true ;;
        pacman) pacman -Sy ;;
    esac
    
    # Install selected components
    if $install_core; then
        install_java
        install_nodejs
        install_ufw
    fi
    
    $install_docker_flag && install_docker
    $install_libvirt_flag && install_libvirt
    $install_nginx_flag && install_nginx
    
    echo ""
    log_success "Installation complete!"
    log_info "Next step: Run 'sudo ./scripts/setup-permissions.sh' to configure permissions."
}

main "$@"
