package dev.koukeneko.hashi.service.k8s;

import lombok.Getter;

@Getter
public class K8sException extends RuntimeException {

    private final int statusCode;

    public K8sException(int statusCode, String message) {
        super(message);
        this.statusCode = statusCode;
    }

    public K8sException(int statusCode, String message, Throwable cause) {
        super(message, cause);
        this.statusCode = statusCode;
    }
}
