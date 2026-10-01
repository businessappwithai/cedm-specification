//! `checkDataSourceHost` (`src/lib/security/network-target.ts`): refuse a
//! data-source host that resolves to a private, loopback or link-local
//! address, unless `ALLOW_PRIVATE_DATA_SOURCES=1` or the hostname is listed
//! in `DATA_SOURCE_HOST_ALLOWLIST`.
use std::net::IpAddr;

/// The same ranges as Node's `isPrivateAddress`.
#[must_use]
pub fn is_private_address(ip: IpAddr) -> bool {
    match ip {
        IpAddr::V4(v4) => {
            let [a, b, ..] = v4.octets();
            a == 0
                || a == 10
                || a == 127
                || (a == 169 && b == 254)
                || (a == 172 && (16..=31).contains(&b))
                || (a == 192 && b == 168)
                || (a == 100 && (64..=127).contains(&b))
                || a >= 224
        }
        IpAddr::V6(v6) => {
            if v6.is_unspecified() || v6.is_loopback() {
                return true;
            }
            let first = v6.segments()[0];
            if (first & 0xffc0) == 0xfe80 || (first & 0xfe00) == 0xfc00 {
                return true;
            }
            v6.to_ipv4_mapped()
                .is_some_and(|m| is_private_address(IpAddr::V4(m)))
        }
    }
}

fn allowlist() -> Vec<String> {
    std::env::var("DATA_SOURCE_HOST_ALLOWLIST")
        .unwrap_or_default()
        .split(',')
        .map(|e| e.trim().to_lowercase())
        .filter(|e| !e.is_empty())
        .collect()
}

/// `Ok(())` to allow, `Err(reason)` with Node's message to refuse.
///
/// # Errors
/// The refusal reason.
pub async fn check_data_source_host(host: Option<&str>) -> Result<(), String> {
    let Some(raw) = host.map(str::trim).filter(|h| !h.is_empty()) else {
        // A file or a connection string; Node does not judge those here.
        return Ok(());
    };
    let hostname = raw.to_lowercase();
    if std::env::var("ALLOW_PRIVATE_DATA_SOURCES").is_ok_and(|v| v == "1") || allowlist().contains(&hostname)
    {
        return Ok(());
    }
    let candidates: Vec<IpAddr> = if let Ok(ip) = hostname.parse::<IpAddr>() {
        vec![ip]
    } else {
        match tokio::net::lookup_host((hostname.as_str(), 0)).await {
            Ok(addrs) => addrs.map(|a| a.ip()).collect(),
            // Node: a lookup failure is allowed (the connection will fail anyway).
            Err(_) => return Ok(()),
        }
    };
    if let Some(blocked) = candidates.into_iter().find(|ip| is_private_address(*ip)) {
        return Err(format!(
            "\"{raw}\" resolves to a private or loopback address ({blocked}), which this server will not connect to. \
             If the database really is on the internal network, add its hostname to DATA_SOURCE_HOST_ALLOWLIST, \
             or set ALLOW_PRIVATE_DATA_SOURCES=1 when every user of this installation is trusted with its network position."
        ));
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::is_private_address;

    #[test]
    fn ranges_match_node() {
        for ip in [
            "10.0.0.1",
            "127.0.0.1",
            "169.254.169.254",
            "172.16.5.4",
            "192.168.1.1",
            "100.64.0.1",
            "0.0.0.0",
            "224.0.0.1",
            "::1",
            "fe80::1",
            "fd00::1",
            "::ffff:10.0.0.1",
        ] {
            assert!(is_private_address(ip.parse().unwrap()), "{ip}");
        }
        for ip in ["8.8.8.8", "172.32.0.1", "100.128.0.1", "2606:4700::1111"] {
            assert!(!is_private_address(ip.parse().unwrap()), "{ip}");
        }
    }
}
