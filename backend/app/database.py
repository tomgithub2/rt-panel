"""SQLite 数据层：连接、建表、通用查询辅助。"""
import os
import sqlite3
import threading
import time

from .config import DATA_DIR

DB_FILE = os.path.join(DATA_DIR, 'rtpanel.db')

_write_lock = threading.RLock()

SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'operator',
    email TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    remark TEXT DEFAULT '',
    status INTEGER NOT NULL DEFAULT 1,
    two_fa INTEGER NOT NULL DEFAULT 0,
    created_at REAL NOT NULL,
    last_login REAL
);
CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ts REAL NOT NULL,
    user TEXT DEFAULT '',
    ip TEXT DEFAULT '',
    action TEXT NOT NULL,
    detail TEXT DEFAULT '',
    level TEXT DEFAULT 'info'
);
CREATE TABLE IF NOT EXISTS login_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ts REAL NOT NULL,
    username TEXT DEFAULT '',
    ip TEXT DEFAULT '',
    ua TEXT DEFAULT '',
    success INTEGER NOT NULL,
    reason TEXT DEFAULT ''
);
CREATE TABLE IF NOT EXISTS cron_jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    schedule TEXT NOT NULL,
    command TEXT NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 1,
    notify INTEGER NOT NULL DEFAULT 0,
    timeout INTEGER NOT NULL DEFAULT 3600,
    created_at REAL NOT NULL,
    last_run REAL,
    last_status TEXT DEFAULT '',
    last_output TEXT DEFAULT ''
);
CREATE TABLE IF NOT EXISTS cron_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER NOT NULL,
    ts REAL NOT NULL,
    exit_code INTEGER,
    output TEXT DEFAULT '',
    duration REAL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS metric_raw (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ts REAL NOT NULL,
    cpu REAL, mem REAL, mem_used REAL, mem_total REAL,
    net_rx REAL, net_tx REAL, disk_read REAL, disk_write REAL,
    load1 REAL, load5 REAL, load15 REAL, proc_count INTEGER
);
CREATE INDEX IF NOT EXISTS idx_metric_raw_ts ON metric_raw(ts);
CREATE TABLE IF NOT EXISTS metric_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ts REAL NOT NULL,
    cpu REAL, mem REAL, net_rx REAL, net_tx REAL,
    disk_read REAL, disk_write REAL, load1 REAL
);
CREATE INDEX IF NOT EXISTS idx_metric_hist_ts ON metric_history(ts);
CREATE TABLE IF NOT EXISTS backup_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    source TEXT NOT NULL,
    dest TEXT NOT NULL,
    schedule TEXT DEFAULT '',
    keep INTEGER NOT NULL DEFAULT 7,
    enabled INTEGER NOT NULL DEFAULT 1,
    notify INTEGER NOT NULL DEFAULT 0,
    exclude TEXT DEFAULT '',
    created_at REAL NOT NULL,
    last_run REAL,
    last_status TEXT DEFAULT ''
);
CREATE TABLE IF NOT EXISTS websites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    domain TEXT UNIQUE NOT NULL,
    root TEXT NOT NULL,
    port INTEGER NOT NULL DEFAULT 80,
    type TEXT NOT NULL DEFAULT 'static',
    engine TEXT NOT NULL DEFAULT 'nginx',
    config TEXT DEFAULT '',
    status INTEGER NOT NULL DEFAULT 0,
    created_at REAL NOT NULL
);
CREATE TABLE IF NOT EXISTS ssl_certs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    domain TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL DEFAULT 'selfsigned',
    cert_path TEXT DEFAULT '',
    key_path TEXT DEFAULT '',
    expires REAL,
    auto_renew INTEGER NOT NULL DEFAULT 0,
    created_at REAL NOT NULL
);
CREATE TABLE IF NOT EXISTS ip_blocks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ip TEXT UNIQUE NOT NULL,
    reason TEXT DEFAULT '',
    blocked_at REAL NOT NULL,
    expires_at REAL
);
CREATE TABLE IF NOT EXISTS notifications (
    channel TEXT PRIMARY KEY,
    enabled INTEGER NOT NULL DEFAULT 0,
    config TEXT DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT DEFAULT ''
);
CREATE TABLE IF NOT EXISTS alert_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    metric TEXT NOT NULL,
    operator TEXT NOT NULL,
    threshold REAL NOT NULL,
    duration INTEGER NOT NULL DEFAULT 60,
    enabled INTEGER NOT NULL DEFAULT 1,
    channels TEXT DEFAULT '',
    last_fired REAL
);
CREATE TABLE IF NOT EXISTS alert_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ts REAL NOT NULL,
    metric TEXT NOT NULL,
    level TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'fired'
);
CREATE TABLE IF NOT EXISTS docker_containers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    container_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    image TEXT DEFAULT '',
    ports TEXT DEFAULT '',
    env TEXT DEFAULT '',
    volumes TEXT DEFAULT '',
    restart_policy TEXT DEFAULT 'unless-stopped',
    created_at REAL NOT NULL
);
CREATE TABLE IF NOT EXISTS software_installs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    action TEXT NOT NULL,
    ts REAL NOT NULL,
    exit_code INTEGER,
    output TEXT DEFAULT ''
);
CREATE TABLE IF NOT EXISTS guardians (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    process TEXT NOT NULL,
    cmd TEXT NOT NULL,
    max_restarts INTEGER NOT NULL DEFAULT 10,
    enabled INTEGER NOT NULL DEFAULT 1,
    created_at REAL NOT NULL,
    last_restart REAL
);
CREATE TABLE IF NOT EXISTS guardian_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guardian_id INTEGER NOT NULL,
    ts REAL NOT NULL,
    action TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS ai_conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    ts REAL NOT NULL
);
CREATE TABLE IF NOT EXISTS ai_knowledge (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    entry TEXT NOT NULL,
    created_at REAL NOT NULL
);
CREATE TABLE IF NOT EXISTS waf_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kind TEXT NOT NULL,
    pattern TEXT NOT NULL,
    note TEXT DEFAULT '',
    preset TEXT DEFAULT '',
    enabled INTEGER NOT NULL DEFAULT 1,
    created_at REAL NOT NULL
);
CREATE TABLE IF NOT EXISTS waf_hits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kind TEXT NOT NULL,
    ip TEXT NOT NULL,
    domain TEXT DEFAULT '',
    detail TEXT DEFAULT '',
    ts REAL NOT NULL
);
CREATE TABLE IF NOT EXISTS site_settings (
    site_id INTEGER PRIMARY KEY,
    pseudo TEXT DEFAULT '',
    redirect TEXT DEFAULT '',
    auth_user TEXT DEFAULT '',
    auth_hash TEXT DEFAULT '',
    hotlink TEXT DEFAULT '',
    domains TEXT DEFAULT '',
    force_https INTEGER NOT NULL DEFAULT 0,
    index_doc TEXT DEFAULT ''
);
CREATE TABLE IF NOT EXISTS ftp_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    dir TEXT NOT NULL,
    note TEXT DEFAULT '',
    created_at REAL NOT NULL
);
"""


def _connect() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_FILE, timeout=30)
    conn.row_factory = sqlite3.Row
    conn.execute('PRAGMA journal_mode=WAL')
    conn.execute('PRAGMA foreign_keys=ON')
    return conn


def init_db():
    with _write_lock:
        conn = _connect()
        try:
            conn.executescript(SCHEMA)
            _migrate(conn)
            conn.commit()
        finally:
            conn.close()


def _migrate(conn: sqlite3.Connection):
    """轻量迁移：为旧库补充新列。"""
    cols = {r[1] for r in conn.execute('PRAGMA table_info(users)')}
    if 'totp_secret' not in cols:
        conn.execute('ALTER TABLE users ADD COLUMN totp_secret TEXT')
    try:
        waf_cols = {r[1] for r in conn.execute('PRAGMA table_info(waf_rules)')}
        if 'preset' not in waf_cols:
            conn.execute('ALTER TABLE waf_rules ADD COLUMN preset TEXT DEFAULT ""')
    except Exception:
        pass
    try:
        ss_cols = {r[1] for r in conn.execute('PRAGMA table_info(site_settings)')}
        for col, ddl in (('domains', 'TEXT DEFAULT ""'), ('force_https', 'INTEGER NOT NULL DEFAULT 0'),
                         ('index_doc', 'TEXT DEFAULT ""')):
            if col not in ss_cols:
                conn.execute(f'ALTER TABLE site_settings ADD COLUMN {col} {ddl}')
    except Exception:
        pass


def query(sql: str, params=(), one: bool = False):
    conn = _connect()
    try:
        cur = conn.execute(sql, params)
        rows = cur.fetchall()
        if one:
            return dict(rows[0]) if rows else None
        return [dict(r) for r in rows]
    finally:
        conn.close()


def execute(sql: str, params=()) -> int:
    """执行写操作，返回 lastrowid。"""
    with _write_lock:
        conn = _connect()
        try:
            cur = conn.execute(sql, params)
            conn.commit()
            return cur.lastrowid
        finally:
            conn.close()


def executemany(sql: str, seq):
    with _write_lock:
        conn = _connect()
        try:
            conn.executemany(sql, seq)
            conn.commit()
        finally:
            conn.close()


def now() -> float:
    return time.time()
