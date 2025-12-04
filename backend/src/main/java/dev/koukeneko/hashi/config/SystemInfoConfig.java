package dev.koukeneko.hashi.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import oshi.SystemInfo;

@Configuration
public class SystemInfoConfig {

    @Bean
    public SystemInfo systemInfo() {
        // First Principle: OSHI 的 SystemInfo 初始化很重，
        // 透過 @Bean 我們保證它只會被 new 一次，然後被 Spring 容器管理。
        return new SystemInfo();
    }
}

