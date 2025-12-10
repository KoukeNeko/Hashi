#!/bin/bash
# ============================================================================
# Hashi - Uninstall / Cleanup Script
# ============================================================================
# Removes Hashi application files. Does NOT remove system dependencies
# (Java, Node.js, Docker, etc.) as they may be used by other applications.
# ============================================================================

set -e

readonly COLOR_GREEN='\033[0;32m'
readonly COLOR_YELLOW='\033[1;33m'
readonly COLOR_RED='\033[0;31m'
readonly COLOR_BLUE='\033[0;34m'
readonly COLOR_BOLD='\033[1m'
readonly COLOR_RESET='\033[0m'

log_info()    { echo -e "${COLOR_BLUE}[INFO]${COLOR_RESET} $1"; }
log_success() { echo -e "${COLOR_GREEN}[OK]${COLOR_RESET} $1"; }
log_warning() { echo -e "${COLOR_YELLOW}[WARN]${COLOR_RESET} $1"; }
log_error()   { echo -e "${COLOR_RED}[ERROR]${COLOR_RESET} $1"; }

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

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo ""
echo -e "${COLOR_RED}╔════════════════════════════════════════════════════════════╗${COLOR_RESET}"
echo -e "${COLOR_RED}║${COLOR_RESET}  ${COLOR_BOLD}Hashi - Uninstall Script${COLOR_RESET}                                  ${COLOR_RED}║${COLOR_RESET}"
echo -e "${COLOR_RED}╚════════════════════════════════════════════════════════════╝${COLOR_RESET}"
echo ""

log_warning "This will remove Hashi application files."
log_info "System dependencies (Java, Node.js, Docker, etc.) will NOT be removed."
echo ""

echo -e "${COLOR_BOLD}The following will be removed:${COLOR_RESET}"
echo "  • Backend build:  backend/build/"
echo "  • Frontend build: frontend/dist/, frontend/node_modules/"
echo "  • Hashi systemd service (if installed)"
echo ""

if ! ask_yes_no "Continue with cleanup?"; then
    log_info "Cancelled."
    exit 0
fi

echo ""

# Stop service if running
if systemctl is-active --quiet hashi 2>/dev/null; then
    log_info "Stopping Hashi service..."
    sudo systemctl stop hashi
    log_success "Service stopped"
fi

# Remove systemd service
if [[ -f /etc/systemd/system/hashi.service ]]; then
    log_info "Removing systemd service..."
    sudo systemctl disable hashi 2>/dev/null || true
    sudo rm -f /etc/systemd/system/hashi.service
    sudo systemctl daemon-reload
    log_success "Systemd service removed"
fi

# Clean backend build
if [[ -d "$PROJECT_DIR/backend/build" ]]; then
    log_info "Removing backend build..."
    rm -rf "$PROJECT_DIR/backend/build"
    log_success "Backend build removed"
fi

# Clean frontend
if [[ -d "$PROJECT_DIR/frontend/dist" ]]; then
    log_info "Removing frontend dist..."
    rm -rf "$PROJECT_DIR/frontend/dist"
    log_success "Frontend dist removed"
fi

if [[ -d "$PROJECT_DIR/frontend/node_modules" ]]; then
    if ask_yes_no "Remove node_modules? (can be reinstalled with npm install)"; then
        log_info "Removing node_modules..."
        rm -rf "$PROJECT_DIR/frontend/node_modules"
        log_success "node_modules removed"
    fi
fi

echo ""
log_success "Cleanup complete!"
echo ""
log_info "To completely remove Hashi, delete the project directory:"
echo "  rm -rf $PROJECT_DIR"
echo ""
log_info "System dependencies were NOT removed. To remove them manually:"
echo "  sudo apt remove openjdk-25-jdk nodejs docker-ce vsftpd nginx"
echo ""
