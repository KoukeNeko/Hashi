package dev.koukeneko.hashi.service.platform;

/**
 * 偵測目前執行平台的工具類別
 */
public final class PlatformDetector {

    private static final String OS_NAME = System.getProperty("os.name").toLowerCase();

    private PlatformDetector() {
        // Utility class, prevent instantiation
    }

    /**
     * 取得目前平台類型
     */
    public static PlatformType detect() {
        if (isLinux()) {
            return PlatformType.LINUX;
        } else if (isWindows()) {
            return PlatformType.WINDOWS;
        }
        return PlatformType.UNSUPPORTED;
    }

    public static boolean isLinux() {
        return OS_NAME.contains("linux") || OS_NAME.contains("unix");
    }

    public static boolean isWindows() {
        return OS_NAME.contains("windows");
    }

    public static boolean isMac() {
        return OS_NAME.contains("mac");
    }
}
