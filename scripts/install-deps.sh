#!/bin/bash
# ============================================================================
# Hashi - Dependency Installation Script (Interactive)
# ============================================================================
# Installs system dependencies required for Hashi server management panel.
# ============================================================================

set -e

readonly COLOR_GREEN='\033[0;32m'
readonly COLOR_YELLOW='\033[1;33m'
readonly COLOR_RED='\033[0;31m'
readonly COLOR_BLUE='\033[0;34m'
readonly COLOR_CYAN='\033[0;36m'
readonly COLOR_BOLD='\033[1m'
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
}

check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "Please run with sudo: sudo $0"
        exit 1
    fi
}

# ============================================================================
# Interactive Prompt
# ============================================================================

ask_yes_no() {
    local prompt="$1"
    local default="${2:-n}"
    local answer
    
    if [[ "$default" == "y" ]]; then
        prompt="${prompt} [Y/n]: "
    else
        prompt="${prompt} [y/N]: "
    fi
    
    read -rp "$prompt" answer
    answer="${answer:-$default}"
    
    [[ "${answer,,}" == "y" || "${answer,,}" == "yes" ]]
}

print_header() {
    echo ""
    echo -e "${COLOR_CYAN}╔════════════════════════════════════════════════════════════╗${COLOR_RESET}"
    echo -e "${COLOR_CYAN}║${COLOR_RESET}  ${COLOR_BOLD}Hashi - Server Management Panel${COLOR_RESET}                           ${COLOR_CYAN}║${COLOR_RESET}"
    echo -e "${COLOR_CYAN}║${COLOR_RESET}  Dependency Installation Script                             ${COLOR_CYAN}║${COLOR_RESET}"
    echo -e "${COLOR_CYAN}╚════════════════════════════════════════════════════════════╝${COLOR_RESET}"
    echo ""
}

# ============================================================================
# Core Dependencies
# ============================================================================

install_java() {
    log_info "Installing Java 25..."
    case $PACKAGE_MANAGER in
        apt)    apt-get install -y openjdk-25-jdk || apt-get install -y openjdk-21-jdk ;;
        dnf)    dnf install -y java-25-openjdk-devel || dnf install -y java-21-openjdk-devel ;;
        pacman) pacman -S --noconfirm jdk-openjdk ;;
    esac
    log_success "Java installed: $(java -version 2>&1 | head -1)"
}

install_nodejs() {
    log_info "Installing Node.js 22..."
    case $PACKAGE_MANAGER in
        apt)
            curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
            apt-get install -y nodejs
            ;;
        dnf)
            dnf module install -y nodejs:22 || dnf install -y nodejs
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

install_ftp() {
    log_info "Installing vsftpd (FTP server)..."
    case $PACKAGE_MANAGER in
        apt)    apt-get install -y vsftpd ;;
        dnf)    dnf install -y vsftpd ;;
        pacman) pacman -S --noconfirm vsftpd ;;
    esac
    systemctl enable vsftpd
    log_success "vsftpd installed"
}

# ============================================================================
# Main Interactive Mode
# ============================================================================

run_interactive() {
    print_header
    
    detect_package_manager
    log_info "Detected package manager: ${COLOR_BOLD}$PACKAGE_MANAGER${COLOR_RESET}"
    echo ""
    
    echo -e "${COLOR_BOLD}Core Dependencies (Required):${COLOR_RESET}"
    echo "  • Java 25       - Backend runtime"
    echo "  • Node.js 22    - Frontend build"
    echo "  • UFW           - Firewall management"
    echo ""
    
    if ! ask_yes_no "Install core dependencies?" "y"; then
        log_warning "Core dependencies are required for Hashi to function."
        exit 1
    fi
    
    echo ""
    echo -e "${COLOR_BOLD}Optional Dependencies:${COLOR_RESET}"
    echo ""
    
    local install_docker_flag=false
    local install_libvirt_flag=false
    local install_nginx_flag=false
    local install_ftp_flag=false
    
    if ask_yes_no "  [Docker] Container management"; then
        install_docker_flag=true
    fi
    
    if ask_yes_no "  [Libvirt/KVM] Virtual machine management"; then
        install_libvirt_flag=true
    fi
    
    if ask_yes_no "  [Nginx] Web server / reverse proxy"; then
        install_nginx_flag=true
    fi
    
    if ask_yes_no "  [vsftpd] FTP server"; then
        install_ftp_flag=true
    fi
    
    echo ""
    echo -e "${COLOR_BOLD}Summary:${COLOR_RESET}"
    echo "  Core:    Java, Node.js, UFW"
    echo -n "  Optional:"
    $install_docker_flag && echo -n " Docker"
    $install_libvirt_flag && echo -n " Libvirt"
    $install_nginx_flag && echo -n " Nginx"
    $install_ftp_flag && echo -n " vsftpd"
    echo ""
    echo ""
    
    if ! ask_yes_no "Proceed with installation?" "y"; then
        log_info "Installation cancelled."
        exit 0
    fi
    
    echo ""
    log_info "Starting installation..."
    echo ""
    
    # Update package lists
    case $PACKAGE_MANAGER in
        apt)    apt-get update ;;
        dnf)    dnf check-update || true ;;
        pacman) pacman -Sy ;;
    esac
    
    # Install core
    install_java
    install_nodejs
    install_ufw
    
    # Install optional
    $install_docker_flag && install_docker
    $install_libvirt_flag && install_libvirt
    $install_nginx_flag && install_nginx
    $install_ftp_flag && install_ftp
    
    echo ""
    log_success "Installation complete!"
    echo ""
    log_info "Next steps:"
    echo "  1. Run: sudo ./scripts/setup-permissions.sh"
    echo "  2. Run: ./scripts/dev.sh"
    echo ""
}

# ============================================================================
# CLI Mode (Backward Compatible)
# ============================================================================

show_help() {
    echo "Usage: sudo $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  (no args)    Interactive mode (recommended)"
    echo "  --all        Install all dependencies"
    echo "  --core       Install core dependencies only"
    echo "  --docker     Install Docker"
    echo "  --libvirt    Install Libvirt/KVM"
    echo "  --nginx      Install Nginx"
    echo "  --ftp        Install vsftpd"
    echo "  --help       Show this help"
}

run_cli() {
    local install_core=false
    local install_docker_flag=false
    local install_libvirt_flag=false
    local install_nginx_flag=false
    local install_ftp_flag=false
    
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --all)
                install_core=true
                install_docker_flag=true
                install_libvirt_flag=true
                install_nginx_flag=true
                install_ftp_flag=true
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
            --ftp)
                install_ftp_flag=true
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
    
    detect_package_manager
    log_info "Detected package manager: $PACKAGE_MANAGER"
    
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
    $install_ftp_flag && install_ftp
    
    echo ""
    log_success "Installation complete!"
    log_info "Next step: Run 'sudo ./scripts/setup-permissions.sh'"
}

# ============================================================================
# Entry Point
# ============================================================================

main() {
    check_root
    
    if [[ $# -eq 0 ]]; then
        # No arguments = interactive mode
        run_interactive
    else
        # With arguments = CLI mode
        run_cli "$@"
    fi
}

main "$@"
