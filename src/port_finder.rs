use std::net::{TcpListener};
use serde_json::json;

use std::net::{TcpListener, SocketAddrV4, Ipv4Addr};
use std::env;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
struct PortResult {
    port: u16,
    success: bool,
    error: Option<String>,
}

fn find_free_port(start_port: u16, end_port: u16) -> PortResult {
    for port in start_port..=end_port {
        let addr = SocketAddrV4::new(Ipv4Addr::new(0, 0, 0, 0), port);
        if TcpListener::bind(addr).is_ok() {
            return PortResult {
                port,
                success: true,
                error: None,
            };
        }
    }

    PortResult {
        port: start_port,
        success: false,
        error: Some("No free port found in range".to_string()),
    }
}

fn find_port(start: u16, end: u16) -> Option<u16> {
    (start..=end).find(|port| {
        TcpListener::bind(("0.0.0.0", *port)).is_ok()
    })
}

fn main() {
    let args: Vec<String> = env::args().collect();
    let start_port = args.get(1).and_then(|s| s.parse().ok()).unwrap_or(3000);
    let end_port = args.get(2).and_then(|s| s.parse().ok()).unwrap_or(65535);

    let port = find_port(start_port, end_port).unwrap_or(3000);
    println!("{}", json!({
        "port": port,
        "status": "success"
    }));
}