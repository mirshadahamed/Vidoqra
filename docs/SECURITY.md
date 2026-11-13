# Vidoqra Security Architecture & Policies

Security is a foundational pillar of Vidoqra. The application processes external media URLs and therefore implements rigorous defense-in-depth measures against Server-Side Request Forgery (SSRF), Denial of Service (DoS), unauthorized media access, and path traversal.

---

## 1. SSRF & DNS Rebinding Defenses

Every user-submitted media URL passes through `validate_url_security()` prior to network activity:

1. **Protocol Whitelisting**: Only `http://` and `https://` schemes are allowed. Schemes such as `file://`, `ftp://`, `gopher://`, or `data://` are unconditionally rejected.
2. **Blocked Hostnames**: Requests to `localhost`, `127.0.0.1`, `metadata.google.internal`, `169.254.169.254`, and any domain ending in `.local` or `.internal` are dropped immediately.
3. **Socket DNS Pre-Resolution**: Hostnames are resolved to their target IPv4 and IPv6 addresses. If any resolved IP falls within blocked CIDR blocks, the request is rejected:
   - `0.0.0.0/8`
   - `10.0.0.0/8` (RFC 1918 Private)
   - `127.0.0.0/8` (Loopback)
   - `169.254.0.0/16` (Link-local & Cloud Metadata)
   - `172.16.0.0/12` (RFC 1918 Private)
   - `192.168.0.0/16` (RFC 1918 Private)
   - `224.0.0.0/4` (Multicast)
   - `240.0.0.0/4` (Reserved)
   - `::1/128`, `fc00::/7`, `fe80::/10` (IPv6 Private/Link-Local)
4. **Permitted Ports**: Outbound connections are restricted to ports `80`, `443`, `8080`, and `8443` to prevent internal service port scanning.

---

## 2. Platform Compliance & Copyright Protection

Vidoqra strictly adheres to technical and legal compliance guidelines:
- **Zero DRM Circumvention**: Vidoqra rejects DRM-encrypted streams (e.g. Widevine, PlayReady, FairPlay).
- **No Cookie Harvesting**: The backend does not accept, store, or scrape external session cookies or user login credentials.
- **No Private Paywall Bypass**: Content requiring private account credentials or authentication is denied.
- **Genuine Quality Reporting**: Vidoqra never upscales low-resolution content to claim fake 4K or 1080p quality.

---

## 3. Subprocess & Command Execution Security

Media operations utilizing FFmpeg never use shell string formatting (`shell=True`):
```python
# SECURE (Used throughout Vidoqra)
cmd = [settings.FFMPEG_PATH, "-y", "-i", input_file, "-vn", "-c:a", "libmp3lame", output_file]
subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
```
User-controlled values are never interpolated into shell command strings.

---

## 4. File Storage & Secret Isolation

- File downloads are placed in an isolated temporary media directory.
- Public download URLs use cryptographically random 32-byte tokens (`secrets.token_urlsafe(32)`).
- MongoDB IDs (`_id`) and internal directory paths are never exposed to clients.
- Automated file expiry cleans up downloaded files after 24 hours.

