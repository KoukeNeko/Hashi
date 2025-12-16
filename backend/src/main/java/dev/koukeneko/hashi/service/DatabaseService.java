package dev.koukeneko.hashi.service;

import dev.koukeneko.hashi.model.dto.DatabaseDTO;
import java.util.List;

public interface DatabaseService {
    List<DatabaseDTO> listDatabases();

    void createDatabase(String name, String type);

    void removeDatabase(String name, String type);
}
