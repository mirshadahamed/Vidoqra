import pytest
from backend.app.utils.url_validator import validate_url_security, is_ip_blocked
import ipaddress

def test_blocked_ip_ranges():
    # Loopback
    assert is_ip_blocked(ipaddress.ip_address("127.0.0.1")) is True
    assert is_ip_blocked(ipaddress.ip_address("127.0.1.1")) is True
    assert is_ip_blocked(ipaddress.ip_address("::1")) is True

    # Private RFC 1918
    assert is_ip_blocked(ipaddress.ip_address("10.0.0.1")) is True
    assert is_ip_blocked(ipaddress.ip_address("172.16.0.1")) is True
    assert is_ip_blocked(ipaddress.ip_address("192.168.1.1")) is True

    # Cloud metadata / link-local
    assert is_ip_blocked(ipaddress.ip_address("169.254.169.254")) is True
    assert is_ip_blocked(ipaddress.ip_address("169.254.1.1")) is True

    # Public IP
    assert is_ip_blocked(ipaddress.ip_address("8.8.8.8")) is False
    assert is_ip_blocked(ipaddress.ip_address("1.1.1.1")) is False

def test_ssrf_hostname_validation():
    # Localhost
    safe, err = validate_url_security("http://localhost/video.mp4")
    assert safe is False
    assert "restricted" in err.lower()

    safe, err = validate_url_security("http://127.0.0.1:8080/test.mp4")
    assert safe is False

    # Cloud metadata
    safe, err = validate_url_security("http://metadata.google.internal/computeMetadata/v1/")
    assert safe is False

    safe, err = validate_url_security("http://169.254.169.254/latest/meta-data/")
    assert safe is False

    # Disallowed scheme
    safe, err = validate_url_security("file:///etc/passwd")
    assert safe is False
    assert "scheme" in err.lower()

    safe, err = validate_url_security("ftp://example.com/video.mp4")
    assert safe is False

def test_public_url_validation():
    safe, err = validate_url_security("https://archive.org/details/test")
    assert safe is True
    assert err is None

