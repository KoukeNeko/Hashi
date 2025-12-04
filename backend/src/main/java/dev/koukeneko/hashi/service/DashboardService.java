package dev.koukeneko.hashi.service;

import dev.koukeneko.hashi.model.dto.SystemStatusDTO;

public interface DashboardService {
    SystemStatusDTO getSystemStatus();
}
