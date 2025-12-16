import oshi.SystemInfo;
import oshi.hardware.HardwareAbstractionLayer;
import oshi.hardware.NetworkIF;
import java.util.List;
import java.util.concurrent.TimeUnit;

public class NetworkDiag {
    public static void main(String[] args) throws InterruptedException {
        SystemInfo si = new SystemInfo();
        HardwareAbstractionLayer hal = si.getHardware();
        List<NetworkIF> networkIFs = hal.getNetworkIFs();

        System.out.println("--- Snapshot 1 ---");
        for (NetworkIF net : networkIFs) {
            net.updateAttributes();
            System.out.println(
                    "Name: " + net.getName() + " | Recv: " + net.getBytesRecv() + " | Sent: " + net.getBytesSent());
        }

        System.out.println("Sleeping 1s...");
        TimeUnit.SECONDS.sleep(1);

        System.out.println("--- Snapshot 2 ---");
        for (NetworkIF net : networkIFs) {
            net.updateAttributes();
            System.out.println(
                    "Name: " + net.getName() + " | Recv: " + net.getBytesRecv() + " | Sent: " + net.getBytesSent());
        }
    }
}
