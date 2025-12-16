#!/bin/bash
# ============================================================================
# Hashi - Permission Setup Script
# ============================================================================
# This script configures sudo permissions required for Hashi to manage
# system services without password prompts.
# ============================================================================

set -e

readonly COLOR_GREEN='\033[0;32m'
readonly COLOR_YELLOW='\033[1;33m'
readonly COLOR_RED='\033[0;31m'
readonly COLOR_RESET='\033[0m'

readonly HASHI_USER="${SUDO_USER:-$USER}"
readonly SUDOERS_FILE="/etc/sudoers.d/hashi"

log_info()    { echo -e "[INFO] $1"; }
log_success() { echo -e "${COLOR_GREEN}[OK]${COLOR_RESET} $1"; }
log_warning() { echo -e "${COLOR_YELLOW}[WARN]${COLOR_RESET} $1"; }
log_error()   { echo -e "${COLOR_RED}[ERROR]${COLOR_RESET} $1"; }

check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "Please run with sudo: sudo $0"
        exit 1
    fi
}

setup_sudoers() {
    log_info "Creating sudoers configuration for user: $HASHI_USER"
    
    cat > "$SUDOERS_FILE" << EOF
# Hashi Server Management Panel - Sudo Permissions
# Generated on $(date)

# ==================== Systemd Services ====================
$HASHI_USER ALL=(ALL) NOPASSWD: /bin/systemctl
$HASHI_USER ALL=(ALL) NOPASSWD: /usr/bin/systemctl

# ==================== UFW Firewall ====================
$HASHI_USER ALL=(ALL) NOPASSWD: /usr/sbin/ufw

# ==================== iptables ====================
$HASHI_USER ALL=(ALL) NOPASSWD: /usr/sbin/iptables
$HASHI_USER ALL=(ALL) NOPASSWD: /usr/sbin/iptables-save
$HASHI_USER ALL=(ALL) NOPASSWD: /usr/sbin/iptables-restore

# ==================== Nginx ====================
$HASHI_USER ALL=(ALL) NOPASSWD: /usr/sbin/nginx
$HASHI_USER ALL=(ALL) NOPASSWD: /usr/bin/nginx

# ==================== SSL Certificates ====================
$HASHI_USER ALL=(ALL) NOPASSWD: /usr/bin/certbot
$HASHI_USER ALL=(ALL) NOPASSWD: /usr/local/bin/certbot
$HASHI_USER ALL=(ALL) NOPASSWD: /root/.acme.sh/acme.sh
$HASHI_USER ALL=(ALL) NOPASSWD: /usr/local/bin/acme.sh

# ==================== File Operations (Nginx sites) ====================
$HASHI_USER ALL=(ALL) NOPASSWD: /usr/bin/ln
$HASHI_USER ALL=(ALL) NOPASSWD: /bin/ln
$HASHI_USER ALL=(ALL) NOPASSWD: /usr/bin/rm
$HASHI_USER ALL=(ALL) NOPASSWD: /bin/rm
$HASHI_USER ALL=(ALL) NOPASSWD: /usr/bin/tee
$HASHI_USER ALL=(ALL) NOPASSWD: /usr/bin/cat

# ==================== User Management ====================
$HASHI_USER ALL=(ALL) NOPASSWD: /usr/sbin/useradd
$HASHI_USER ALL=(ALL) NOPASSWD: /usr/sbin/userdel
$HASHI_USER ALL=(ALL) NOPASSWD: /usr/sbin/usermod
$HASHI_USER ALL=(ALL) NOPASSWD: /usr/sbin/groupadd
$HASHI_USER ALL=(ALL) NOPASSWD: /usr/sbin/groupdel
$HASHI_USER ALL=(ALL) NOPASSWD: /usr/sbin/groupmod
$HASHI_USER ALL=(ALL) NOPASSWD: /usr/bin/passwd
$HASHI_USER ALL=(ALL) NOPASSWD: /usr/bin/chage
$HASHI_USER ALL=(ALL) NOPASSWD: /usr/bin/gpasswd

# ==================== Cron Management ====================
$HASHI_USER ALL=(ALL) NOPASSWD: /usr/bin/crontab

# ==================== FTP Management ====================
$HASHI_USER ALL=(ALL) NOPASSWD: /usr/sbin/vsftpd
$HASHI_USER ALL=(ALL) NOPASSWD: /usr/sbin/proftpd
$HASHI_USER ALL=(ALL) NOPASSWD: /usr/sbin/pure-ftpd

# ==================== Update Check ====================
$HASHI_USER ALL=(ALL) NOPASSWD: /usr/bin/apt-get update

# ==================== Package Management ====================
$HASHI_USER ALL=(ALL) NOPASSWD: /usr/bin/apt-get, /usr/bin/apt, /usr/bin/dpkg

# ==================== Disk & Network Management ====================
$HASHI_USER ALL=(ALL) NOPASSWD: /usr/bin/lsblk, /usr/bin/mount, /usr/bin/umount, /usr/sbin/mkfs*, /usr/sbin/parted, /usr/sbin/resize2fs
$HASHI_USER ALL=(ALL) NOPASSWD: /usr/bin/nmcli
EOF

    chmod 440 "$SUDOERS_FILE"
    
    if visudo -c -f "$SUDOERS_FILE" &> /dev/null; then
        log_success "Sudoers file created: $SUDOERS_FILE"
    else
        log_error "Invalid sudoers syntax! Removing..."
        rm -f "$SUDOERS_FILE"
        exit 1
    fi
}

setup_groups() {
    # Docker group
    if getent group docker &> /dev/null; then
        if ! groups "$HASHI_USER" | grep -q '\bdocker\b'; then
            usermod -aG docker "$HASHI_USER"
            log_success "Added $HASHI_USER to docker group"
        else
            log_info "User already in docker group"
        fi
    fi
    
    # Libvirt group
    if getent group libvirt &> /dev/null; then
        if ! groups "$HASHI_USER" | grep -q '\blibvirt\b'; then
            usermod -aG libvirt "$HASHI_USER"
            log_success "Added $HASHI_USER to libvirt group"
        else
            log_info "User already in libvirt group"
        fi
    fi
}

remove_permissions() {
    if [[ -f "$SUDOERS_FILE" ]]; then
        rm -f "$SUDOERS_FILE"
        log_success "Removed $SUDOERS_FILE"
    else
        log_info "Sudoers file not found"
    fi
}

show_help() {
    echo "Usage: sudo $0 [OPTION]"
    echo ""
    echo "  --setup     Configure sudo permissions (default)"
    echo "  --remove    Remove sudo permissions"
    echo "  --help      Show this help"
}

main() {
    local action="setup"
    
    case "${1:-}" in
        --remove)   action="remove" ;;
        --help|-h)  show_help; exit 0 ;;
        --setup|"") action="setup" ;;
        *)          log_error "Unknown: $1"; show_help; exit 1 ;;
    esac
    
    check_root
    
    if [[ "$action" == "setup" ]]; then
        setup_sudoers
        setup_groups
        echo ""
        log_success "Permission setup complete!"
        log_warning "Please log out and log back in for group changes."
    else
        remove_permissions
    fi
}

main "$@"
