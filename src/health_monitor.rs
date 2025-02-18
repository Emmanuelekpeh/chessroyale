use std::time::{SystemTime, UNIX_EPOCH};
use serde::{Deserialize, Serialize};
use std::process::Command;
use std::env;

#[derive(Serialize, Deserialize)]
pub struct HealthStatus {
    status: String,
    timestamp: u64,
    version: String,
    services: Services,
    uptime: f64,
}

#[derive(Serialize, Deserialize)]
pub struct Services {
    database: bool,
    api: bool,
    storage: bool,
}

pub fn check_health() -> HealthStatus {
    let start = SystemTime::now();
    let timestamp = start
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs();

    // Check database connection
    let db_url = env::var("DATABASE_URL").unwrap_or_default();
    let db_healthy = !db_url.is_empty() && check_postgres(&db_url);

    // Get uptime
    let uptime = match sys_info::boottime() {
        Ok(boot_time) => SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs() as f64
            - boot_time as f64,
        Err(_) => 0.0,
    };

    HealthStatus {
        status: if db_healthy { "healthy" } else { "degraded" }.to_string(),
        timestamp,
        version: env::var("npm_package_version").unwrap_or("1.0.0".to_string()),
        services: Services {
            database: db_healthy,
            api: true,
            storage: db_healthy,
        },
        uptime,
    }
}

fn check_postgres(url: &str) -> bool {
    Command::new("pg_isready")
        .arg("-U")
        .arg(env::var("PGUSER").unwrap_or_default())
        .arg("-h")
        .arg(env::var("PGHOST").unwrap_or_default())
        .arg("-p")
        .arg(env::var("PGPORT").unwrap_or_default())
        .status()
        .map(|status| status.success())
        .unwrap_or(false)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_health_check_structure() {
        let health = check_health();
        assert!(health.timestamp > 0);
        assert!(!health.version.is_empty());
    }
}
