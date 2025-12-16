package dev.koukeneko.hashi.service.platform.database;

import dev.koukeneko.hashi.model.dto.DatabaseDTO;
import dev.koukeneko.hashi.service.DatabaseService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Service
@Slf4j
public class LinuxDatabaseService implements DatabaseService {

    @Override
    public List<DatabaseDTO> listDatabases() {
        List<DatabaseDTO> databases = new ArrayList<>();

        // List MySQL
        if (isCommandAvailable("mysql")) {
            try {
                databases.addAll(listMySQLDatabases());
            } catch (Exception e) {
                log.error("Failed to list MySQL databases", e);
            }
        }

        // List PostgreSQL
        if (isCommandAvailable("psql")) {
            try {
                databases.addAll(listPostgresDatabases());
            } catch (Exception e) {
                log.error("Failed to list PostgreSQL databases", e);
            }
        }

        return databases;
    }

    @Override
    public void createDatabase(String name, String type) {
        try {
            if ("MySQL".equalsIgnoreCase(type)) {
                if (!isCommandAvailable("mysqladmin")) {
                    throw new RuntimeException("mysqladmin is not installed");
                }
                runCommand("mysqladmin", "create", name);
            } else if ("PostgreSQL".equalsIgnoreCase(type)) {
                if (!isCommandAvailable("createdb")) {
                    throw new RuntimeException("createdb is not installed");
                }
                runCommand("createdb", name);
            } else {
                throw new IllegalArgumentException("Unsupported database type: " + type);
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to create database: " + e.getMessage(), e);
        }
    }

    @Override
    public void removeDatabase(String name, String type) {
        try {
            if ("MySQL".equalsIgnoreCase(type)) {
                if (!isCommandAvailable("mysqladmin")) {
                    throw new RuntimeException("mysqladmin is not installed");
                }
                runCommand("mysqladmin", "-f", "drop", name);
            } else if ("PostgreSQL".equalsIgnoreCase(type)) {
                if (!isCommandAvailable("dropdb")) {
                    throw new RuntimeException("dropdb is not installed");
                }
                runCommand("dropdb", name);
            } else {
                throw new IllegalArgumentException("Unsupported database type: " + type);
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to remove database: " + e.getMessage(), e);
        }
    }

    private List<DatabaseDTO> listMySQLDatabases() throws IOException, InterruptedException {
        List<DatabaseDTO> list = new ArrayList<>();
        // Query to get schema name and size (approximate)
        // Note: Without proper privileges, accessing information_schema might fail or
        // allow-lists only.
        // Simple 'SHOW DATABASES' is safer for basic listing.
        String output = runCommand("mysql", "-N", "-e", "SHOW DATABASES");
        for (String line : output.split("\n")) {
            if (line.isBlank() ||
                    line.equals("information_schema") ||
                    line.equals("mysql") ||
                    line.equals("performance_schema") ||
                    line.equals("sys"))
                continue;

            list.add(DatabaseDTO.builder()
                    .id(line)
                    .name(line)
                    .type("MySQL")
                    .username("root") // Assuming root executed it
                    .size("-") // Can't easily get size without complex query
                    .status("online")
                    .backup("-")
                    .build());
        }
        return list;
    }

    private List<DatabaseDTO> listPostgresDatabases() throws IOException, InterruptedException {
        List<DatabaseDTO> list = new ArrayList<>();
        // -t: tuples only (no header/footer), -A: unaligned, -F,: comma separator
        String output = runCommand("psql", "-t", "-A", "-F,", "-c",
                "SELECT datname, pg_catalog.pg_get_userbyid(datdba), pg_size_pretty(pg_database_size(datname)) FROM pg_database WHERE datistemplate = false;");

        for (String line : output.split("\n")) {
            if (line.isBlank())
                continue;
            String[] parts = line.split(",");
            if (parts.length >= 3) {
                list.add(DatabaseDTO.builder()
                        .id(parts[0])
                        .name(parts[0])
                        .type("PostgreSQL")
                        .username(parts[1])
                        .size(parts[2])
                        .status("online")
                        .backup("-")
                        .build());
            }
        }
        return list;
    }

    private boolean isCommandAvailable(String cmd) {
        try {
            Process p = new ProcessBuilder("which", cmd).start();
            return p.waitFor() == 0;
        } catch (Exception e) {
            return false;
        }
    }

    private String runCommand(String... command) throws IOException, InterruptedException {
        ProcessBuilder pb = new ProcessBuilder(command);
        Process p = pb.start();

        StringBuilder output = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(p.getInputStream()))) {
            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line).append("\n");
            }
        }

        StringBuilder error = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(p.getErrorStream()))) {
            String line;
            while ((line = reader.readLine()) != null) {
                error.append(line).append("\n");
            }
        }

        int exitCode = p.waitFor();
        if (exitCode != 0) {
            throw new IOException("Command failed with exit code " + exitCode + ": " + error.toString());
        }

        return output.toString();
    }
}
