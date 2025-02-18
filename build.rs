use std::process::Command;
use std::env;
use std::path::Path;

fn main() {
    println!("cargo:rerun-if-changed=src/port_finder.rs");
    println!("cargo:rerun-if-changed=src/health_monitor.rs");

    let out_dir = env::var("OUT_DIR").unwrap_or_else(|_| "target/release".to_string());
    let out_path = Path::new(&out_dir);

    // Build the port finder binary
    if !Command::new("cargo")
        .args(&["build", "--release", "--bin", "port_finder"])
        .status()
        .expect("Failed to build port finder")
        .success()
    {
        panic!("Failed to build port_finder binary");
    }

    // Build the health monitor binary
    if !Command::new("cargo")
        .args(&["build", "--release", "--bin", "health_monitor"])
        .status()
        .expect("Failed to build health monitor")
        .success()
    {
        panic!("Failed to build health_monitor binary");
    }

    // Print the binary locations for debugging
    println!("cargo:warning=Binaries built at: {}", out_path.display());
}