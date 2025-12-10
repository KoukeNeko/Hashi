#!/bin/bash
# ============================================================================
# Hashi - Development Server Script
# ============================================================================
# Starts both frontend and backend development servers in parallel.
# ============================================================================

set -e

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

readonly COLOR_GREEN='\033[0;32m'
readonly COLOR_CYAN='\033[0;36m'
readonly COLOR_YELLOW='\033[1;33m'
readonly COLOR_RESET='\033[0m'

log_info() { echo -e "${COLOR_CYAN}[HASHI]${COLOR_RESET} $1"; }

cleanup() {
    log_info "Shutting down servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    exit 0
}

trap cleanup SIGINT SIGTERM

start_backend() {
    log_info "Starting backend (Spring Boot)..."
    cd "$PROJECT_ROOT/backend"
    ./gradlew bootRun &
    BACKEND_PID=$!
}

start_frontend() {
    log_info "Starting frontend (Vite)..."
    cd "$PROJECT_ROOT/frontend"
    npm run dev &
    FRONTEND_PID=$!
}

show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --backend   Start backend only"
    echo "  --frontend  Start frontend only"
    echo "  --help      Show this help"
    echo ""
    echo "Default: Starts both frontend and backend"
}

main() {
    local run_backend=false
    local run_frontend=false
    
    if [[ $# -eq 0 ]]; then
        run_backend=true
        run_frontend=true
    fi
    
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --backend)  run_backend=true ;;
            --frontend) run_frontend=true ;;
            --help|-h)  show_help; exit 0 ;;
            *)          echo "Unknown: $1"; show_help; exit 1 ;;
        esac
        shift
    done
    
    echo -e "${COLOR_GREEN}"
    echo "╔═══════════════════════════════════════╗"
    echo "║        Hashi Development Server       ║"
    echo "╚═══════════════════════════════════════╝"
    echo -e "${COLOR_RESET}"
    
    $run_backend && start_backend
    $run_frontend && start_frontend
    
    echo ""
    log_info "Servers starting..."
    echo -e "${COLOR_YELLOW}  Frontend: http://localhost:5173${COLOR_RESET}"
    echo -e "${COLOR_YELLOW}  Backend:  http://localhost:8080${COLOR_RESET}"
    echo ""
    log_info "Press Ctrl+C to stop all servers"
    
    wait
}

main "$@"
