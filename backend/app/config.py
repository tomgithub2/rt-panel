"""RT面板 全局配置（JSON 持久化）。"""
import json
import os
import secrets
import threading

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # backend/
# 数据目录：支持 RT_DATA_DIR 环境变量迁移（默认 backend/data）
DATA_DIR = os.environ.get('RT_DATA_DIR') or os.path.join(BASE_DIR, 'data')
CERT_DIR = os.path.join(DATA_DIR, 'certs')
BACKUP_DIR = os.path.join(DATA_DIR, 'backups')
WWWROOT_DIR = os.path.join(DATA_DIR, 'wwwroot')
LOG_DIR = os.path.join(DATA_DIR, 'logs')
TMP_DIR = os.path.join(DATA_DIR, 'tmp')

for d in (DATA_DIR, CERT_DIR, BACKUP_DIR, WWWROOT_DIR, LOG_DIR, TMP_DIR):
    os.makedirs(d, exist_ok=True)

CONFIG_FILE = os.path.join(DATA_DIR, 'config.json')
SECRET_FILE = os.path.join(DATA_DIR, 'secret.key')

_lock = threading.RLock()

DEFAULTS = {
    'port': 8000,
    'bind_host': '0.0.0.0',
    'site_name': 'RT面板',
    'account_server': 'https://www.rt888.icu',
    'language': 'zh-CN',
    'theme': 'blackgold',
    'session_hours': 24,
    'max_login_fails': 5,
    'lock_minutes': 10,
    'sample_interval': 5,
    'keep_raw_hours': 24,
    'keep_history_days': 90,
    'cpu_alert': 90,
    'mem_alert': 90,
    'disk_alert': 90,
    'allow_registration': False,
    'login_ip_whitelist': '',
    'login_notify': 0,
    'hidden_menus': '',
    'security_entrance': '',
    'ssl_cert': '',
    'ssl_key': '',
    'initialized': False,
}


def get_config() -> dict:
    with _lock:
        cfg = dict(DEFAULTS)
        if os.path.exists(CONFIG_FILE):
            try:
                with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
                    cfg.update(json.load(f))
            except Exception:
                pass
        # 官网地址/更新源锁定为官方域名（www.rt888.icu），面板内禁止修改；
        # 忽略配置文件中的旧值，仅厂商内部可用 RT_ACCOUNT_SERVER 环境变量覆盖（开发联调）
        cfg['account_server'] = os.environ.get(
            'RT_ACCOUNT_SERVER', DEFAULTS['account_server']).rstrip('/')
        return cfg


def save_config(updates: dict) -> dict:
    with _lock:
        cfg = get_config()
        cfg.update({k: v for k, v in updates.items() if k in DEFAULTS})
        with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
            json.dump(cfg, f, ensure_ascii=False, indent=2)
        return cfg


def get_jwt_secret() -> str:
    with _lock:
        if not os.path.exists(SECRET_FILE):
            with open(SECRET_FILE, 'w', encoding='utf-8') as f:
                f.write(secrets.token_hex(32))
        with open(SECRET_FILE, 'r', encoding='utf-8') as f:
            return f.read().strip()


PANEL_VERSION = '1.0.0'
