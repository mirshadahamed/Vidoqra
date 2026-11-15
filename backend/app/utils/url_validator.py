import ipaddress
import socket
from urllib.parse import urlparse
from typing import Tuple, Optional, List

# Blocked IP networks for SSRF protection
BLOCKED_NETWORKS = [
    ipaddress.ip_network("0.0.0.0/8"),
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("169.254.0.0/16"),  # Link-local & cloud metadata
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("224.0.0.0/4"),     # Multicast
    ipaddress.ip_network("240.0.0.0/4"),     # Reserved
    ipaddress.ip_network("::1/128"),         # IPv6 loopback
    ipaddress.ip_network("fc00::/7"),        # IPv6 unique local
    ipaddress.ip_network("fe80::/10"),       # IPv6 link-local
    ipaddress.ip_network("::/128"),          # IPv6 unspecified
]

BLOCKED_HOSTNAMES = {
    "localhost",
    "metadata.google.internal",
    "metadata.internal",
    "169.254.169.254",
    "instance-data",
}

ALLOWED_SCHEMES = {"http", "https"}


class SecurityValidationError(Exception):
    """Raised when URL or access fails security validation."""
    pass


def is_ip_blocked(ip: ipaddress.IPv4Address | ipaddress.IPv6Address) -> bool:
    """Check if an IP address belongs to private, loopback, or reserved ranges."""
    for network in BLOCKED_NETWORKS:
        if ip in network:
            return True
    return False


def validate_url_security(url: str, allow_custom_ports: bool = False) -> Tuple[bool, Optional[str]]:
    """
    Strict URL validation for SSRF, DNS rebinding, and scheme security.
    Returns (True, None) if safe, or (False, error_reason).
    """
    if not url or not isinstance(url, str):
        return False, "URL must be a non-empty string."

    url = url.strip()

    try:
        parsed = urlparse(url)
    except Exception as e:
        return False, f"Malformed URL: {str(e)}"

    if not parsed.scheme or parsed.scheme.lower() not in ALLOWED_SCHEMES:
        return False, f"Scheme '{parsed.scheme}' not allowed. Only HTTP and HTTPS are permitted."

    hostname = parsed.hostname
    if not hostname:
        return False, "URL must include a valid hostname."

    hostname_lower = hostname.lower()

    if hostname_lower in BLOCKED_HOSTNAMES or hostname_lower.endswith(".local") or hostname_lower.endswith(".internal"):
        return False, f"Access to host '{hostname}' is restricted for security."

    # Port checking: prevent scanning internal services unless specifically allowed
    if parsed.port:
        if not allow_custom_ports and parsed.port not in (80, 443, 8080, 8443):
            return False, f"Port {parsed.port} is not permitted."

    # DNS Resolution and IP checking to prevent SSRF and DNS Rebinding
    try:
        # Resolve hostname to all addresses
        addr_info = socket.getaddrinfo(hostname, parsed.port or (443 if parsed.scheme == "https" else 80))
        resolved_ips: List[ipaddress.IPv4Address | ipaddress.IPv6Address] = []
        for info in addr_info:
            sockaddr = info[4]
            ip_str = sockaddr[0]
            ip_obj = ipaddress.ip_address(ip_str)
            resolved_ips.append(ip_obj)

        if not resolved_ips:
            return False, f"Hostname '{hostname}' could not be resolved."

        for ip in resolved_ips:
            if is_ip_blocked(ip):
                return False, f"URL resolves to restricted IP ({ip}). Access denied."

    except socket.gaierror:
        return False, f"Could not resolve host '{hostname}'."
    except Exception as e:
        return False, f"Security verification failed: {str(e)}"

    return True, None


def sanitize_filename(filename: str) -> str:
    """Sanitize filename to prevent directory traversal or malicious characters."""
    import re
    cleaned = re.sub(r'[^a-zA-Z0-9_\-\. ]', '_', filename)
    cleaned = re.sub(r'\.+', '.', cleaned)
    cleaned = cleaned.strip('. ')
    if not cleaned:
        cleaned = "download"
    return cleaned[:120]

