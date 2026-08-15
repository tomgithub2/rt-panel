# Created by 小杜 on 2026/08

"""RBAC 角色与权限定义。"""

# 权限标识：模块:动作
ALL_PERMISSIONS = {
    # 概览/监控
    'dashboard:view', 'monitor:view', 'monitor:alert',
    # 文件
    'files:read', 'files:write', 'files:download',
    # 终端/进程
    'terminal:use', 'processes:view', 'processes:kill',
    # 服务/计划任务
    'services:view', 'services:manage',
    'cron:view', 'cron:manage',
    # 防火墙/网络
    'firewall:view', 'firewall:manage',
    'network:view', 'network:tools',
    # WAF（VIP 专属）
    'waf:view', 'waf:manage',
    # FTP/SSH/DNS（自研模块）
    'ftp:view', 'ftp:manage',
    'ssh:view', 'ssh:manage',
    'dns:view', 'dns:manage',
    # 软件/网站/SSL/数据库
    'software:view', 'software:manage',
    'websites:view', 'websites:manage',
    'ssl:view', 'ssl:manage',
    'databases:view', 'databases:manage',
    # 备份/Docker
    'backups:view', 'backups:manage',
    'docker:view', 'docker:manage',
    # 日志/安全
    'logs:view', 'logs:clear',
    'security:view', 'security:manage',
    # 用户/设置
    'users:view', 'users:manage',
    'settings:view', 'settings:manage',
    'system:view', 'system:manage',
    # AI 助手
    'ai:use',
}

ROLES = {
    'admin': {
        'name': '管理员',
        'desc': '拥有面板全部权限',
        'perms': set(ALL_PERMISSIONS),
    },
    'operator': {
        'name': '运维人员',
        'desc': '日常运维操作权限，不含用户管理与面板设置',
        'perms': set(ALL_PERMISSIONS) - {
            'users:manage', 'settings:manage', 'system:manage', 'security:manage',
        },
    },
    'viewer': {
        'name': '只读访客',
        'desc': '仅可查看信息，不能执行任何变更操作',
        'perms': {
            'dashboard:view', 'monitor:view',
            'files:read', 'files:download',
            'processes:view', 'services:view', 'cron:view',
            'firewall:view', 'network:view',
            'software:view', 'websites:view', 'ssl:view', 'databases:view',
            'backups:view', 'docker:view', 'waf:view',
            'logs:view', 'security:view',
        },
    },
}


def role_permissions(role: str) -> set:
    return ROLES.get(role, {}).get('perms', set())
