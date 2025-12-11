package dev.koukeneko.hashi.service.platform;

import dev.koukeneko.hashi.service.platform.auth.LinuxPamAuthProvider;
import dev.koukeneko.hashi.service.platform.firewall.IptablesManager;
import dev.koukeneko.hashi.service.platform.firewall.LinuxIptablesManager;
import dev.koukeneko.hashi.service.platform.firewall.LinuxUfwFirewallManager;
import dev.koukeneko.hashi.service.platform.firewall.UfwFirewallManager;
import dev.koukeneko.hashi.service.platform.log.LinuxJournalctlLogProvider;
import dev.koukeneko.hashi.service.platform.log.LogStreamProvider;
import dev.koukeneko.hashi.service.platform.scheduler.LinuxCronManager;
import dev.koukeneko.hashi.service.platform.scheduler.SchedulerManager;
import dev.koukeneko.hashi.service.platform.service.LinuxServiceManager;
import dev.koukeneko.hashi.service.platform.service.ServiceManager;
import dev.koukeneko.hashi.service.platform.terminal.LinuxTerminalManager;
import dev.koukeneko.hashi.service.platform.terminal.TerminalManager;
import dev.koukeneko.hashi.service.platform.user.LinuxUserManager;
import dev.koukeneko.hashi.service.AuthService;
import dev.koukeneko.hashi.service.UserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * 平台特定服務的 Spring 設定 根據目前平台自動註冊對應的實作
 */
@Configuration
@Slf4j
public class PlatformConfiguration {

    @Bean
    public PlatformType platformType() {
        PlatformType type = PlatformDetector.detect();
        log.info("Detected platform: {}", type);
        return type;
    }

    // ==================== Linux Beans ====================

    @Bean
    @ConditionalOnProperty(name = "platform.type", havingValue = "linux", matchIfMissing = true)
    public ServiceManager linuxServiceManager() {
        if (!PlatformDetector.isLinux()) {
            log.warn("LinuxServiceManager is being loaded on non-Linux platform. Some features may not work.");
        }
        return new LinuxServiceManager();
    }

    @Bean
    @ConditionalOnProperty(name = "platform.type", havingValue = "linux", matchIfMissing = true)
    public UfwFirewallManager linuxUfwFirewallManager() {
        return new LinuxUfwFirewallManager();
    }

    @Bean
    @ConditionalOnProperty(name = "platform.type", havingValue = "linux", matchIfMissing = true)
    public IptablesManager linuxIptablesManager() {
        return new LinuxIptablesManager();
    }

    @Bean
    @ConditionalOnProperty(name = "platform.type", havingValue = "linux", matchIfMissing = true)
    public SchedulerManager linuxCronManager() {
        return new LinuxCronManager();
    }

    @Bean
    @ConditionalOnProperty(name = "platform.type", havingValue = "linux", matchIfMissing = true)
    public TerminalManager linuxTerminalManager() {
        return new LinuxTerminalManager();
    }

    @Bean
    @ConditionalOnProperty(name = "platform.type", havingValue = "linux", matchIfMissing = true)
    public LogStreamProvider linuxLogStreamProvider() {
        return new LinuxJournalctlLogProvider();
    }

    @Bean
    @ConditionalOnProperty(name = "platform.type", havingValue = "linux", matchIfMissing = true)
    public AuthService linuxAuthService() {
        return new LinuxPamAuthProvider();
    }

    @Bean
    @ConditionalOnProperty(name = "platform.type", havingValue = "linux", matchIfMissing = true)
    public UserService linuxUserService() {
        return new LinuxUserManager();
    }

    // ==================== Windows Beans ====================
    // (for future implementation)
}
