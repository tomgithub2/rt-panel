"""软件商店：常用软件检测 / 安装 / 卸载（跨平台命令映射）。"""
import os
import re

from fastapi import APIRouter, Depends, HTTPException, Request

from ..audit import audit
from ..auth import get_client_ip, require_feature, require_perm
from ..database import execute, now, query
from ..utils.exec_utils import IS_WIN, run_cmd

router = APIRouter(prefix='/api/software', tags=['software'],
                   dependencies=[Depends(require_feature('software'))])

# 目录：检测命令、安装命令、卸载命令、版本命令（支持 {} 占位）
CATALOG = {
    'git': {
        'name': 'Git', 'cat': '开发工具',
        'detect': 'git --version',
        'version': 'git --version',
        'install': {
            'win': 'winget install --id Git.Git -e --accept-source-agreements --accept-package-agreements',
            'linux_deb': 'apt-get install -y git',
            'linux_rpm': 'yum install -y git || dnf install -y git',
        },
    },
    'nginx': {
        'name': 'Nginx', 'cat': 'Web服务器',
        'detect': 'nginx -v 2>&1',
        'version': 'nginx -v 2>&1',
        'install': {
            'win': 'winget install --id Tengine.Tengine -e --accept-source-agreements --accept-package-agreements',
            'linux_deb': 'apt-get install -y nginx',
            'linux_rpm': 'yum install -y nginx || dnf install -y nginx',
        },
    },
    'node': {
        'name': 'Node.js', 'cat': '运行时',
        'detect': 'node --version',
        'version': 'node --version',
        'install': {
            'win': 'winget install --id OpenJS.NodeJS.LTS -e --accept-source-agreements --accept-package-agreements',
            'linux_deb': 'curl -fsSL https://deb.nodesource.com/setup_lts.x | bash - && apt-get install -y nodejs',
            'linux_rpm': 'curl -fsSL https://rpm.nodesource.com/setup_lts.x | bash - && yum install -y nodejs',
        },
    },
    'python': {
        'name': 'Python 3', 'cat': '运行时',
        'detect': 'python3 --version || python --version',
        'version': 'python3 --version || python --version',
        'install': {
            'win': 'winget install --id Python.Python.3.13 -e --accept-source-agreements --accept-package-agreements',
            'linux_deb': 'apt-get install -y python3 python3-pip',
            'linux_rpm': 'yum install -y python3 python3-pip',
        },
    },
    'docker': {
        'name': 'Docker', 'cat': '容器',
        'detect': 'docker --version',
        'version': 'docker --version',
        'install': {
            'win': 'winget install --id Docker.DockerDesktop -e --accept-source-agreements --accept-package-agreements',
            'linux_deb': 'curl -fsSL https://get.docker.com | sh',
            'linux_rpm': 'curl -fsSL https://get.docker.com | sh',
        },
    },
    'redis': {
        'name': 'Redis', 'cat': '数据库',
        'detect': 'redis-server --version',
        'version': 'redis-server --version',
        'install': {
            'win': 'winget install --id tporadowski.Redis -e --accept-source-agreements --accept-package-agreements',
            'linux_deb': 'apt-get install -y redis-server',
            'linux_rpm': 'yum install -y redis || dnf install -y redis',
        },
    },
    'mysql': {
        'name': 'MySQL', 'cat': '数据库',
        'detect': 'mysql --version',
        'version': 'mysql --version',
        'install': {
            'win': 'winget install --id Oracle.MySQL -e --accept-source-agreements --accept-package-agreements',
            'linux_deb': 'apt-get install -y mysql-server',
            'linux_rpm': 'yum install -y mysql-server || dnf install -y mysql-server',
        },
    },
    'postgresql': {
        'name': 'PostgreSQL', 'cat': '数据库',
        'detect': 'psql --version',
        'version': 'psql --version',
        'install': {
            'win': 'winget install --id PostgreSQL.PostgreSQL -e --accept-source-agreements --accept-package-agreements',
            'linux_deb': 'apt-get install -y postgresql',
            'linux_rpm': 'yum install -y postgresql-server || dnf install -y postgresql-server',
        },
    },
    'php': {
        'name': 'PHP', 'cat': '运行时',
        'detect': 'php --version',
        'version': 'php --version',
        'install': {
            'win': 'winget install --id PHP.PHP -e --accept-source-agreements --accept-package-agreements',
            'linux_deb': 'apt-get install -y php-fpm php-mysql',
            'linux_rpm': 'yum install -y php-fpm php-mysqlnd || dnf install -y php-fpm php-mysqlnd',
        },
    },
    'phpmyadmin': {
        'name': 'phpMyAdmin', 'cat': '数据库',
        'detect': 'test -f /var/www/html/phpmyadmin/index.php',
        'version': 'grep -o "Version [0-9.]*" /var/www/html/phpmyadmin/README 2>/dev/null | head -n 1',
        'install': {
            'win': 'powershell -NoProfile -Command "New-Item -ItemType Directory -Force -Path C:\\phpmyadmin | Out-Null; Invoke-WebRequest -Uri https://files.phpmyadmin.net/phpMyAdmin/5.2.1/phpMyAdmin-5.2.1-all-languages.zip -OutFile $env:TEMP\\pma.zip; Expand-Archive -Path $env:TEMP\\pma.zip -DestinationPath C:\\ -Force; Copy-Item -Recurse -Force C:\\phpMyAdmin-5.2.1-all-languages\\* C:\\phpmyadmin\\"',
            'linux_deb': 'mkdir -p /var/www/html && curl -fsSL https://files.phpmyadmin.net/phpMyAdmin/5.2.1/phpMyAdmin-5.2.1-all-languages.zip -o /tmp/pma.zip && unzip -o /tmp/pma.zip -d /var/www/html/ && mv /var/www/html/phpMyAdmin-5.2.1-all-languages /var/www/html/phpmyadmin',
            'linux_rpm': 'mkdir -p /var/www/html && curl -fsSL https://files.phpmyadmin.net/phpMyAdmin/5.2.1/phpMyAdmin-5.2.1-all-languages.zip -o /tmp/pma.zip && unzip -o /tmp/pma.zip -d /var/www/html/ && mv /var/www/html/phpMyAdmin-5.2.1-all-languages /var/www/html/phpmyadmin',
        },
        'note': '安装后访问 http://IP/phpmyadmin（需 Nginx/PHP 已安装）',
    },
    'mongodb': {
        'name': 'MongoDB', 'cat': '数据库',
        'detect': 'mongod --version',
        'version': 'mongod --version | head -n 1',
        'install': {
            'win': 'winget install --id MongoDB.Server -e --accept-source-agreements --accept-package-agreements',
            'linux_deb': 'curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg && echo "deb [signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" > /etc/apt/sources.list.d/mongodb-org-7.0.list && apt-get update && apt-get install -y mongodb-org',
            'linux_rpm': 'printf "[mongodb-org-7.0]\\nname=MongoDB Repository\\nbaseurl=https://repo.mongodb.org/yum/redhat/9/mongodb-org/7.0/x86_64/\\ngpgcheck=1\\nenabled=1\\ngpgkey=https://www.mongodb.org/static/pgp/server-7.0.asc\\n" > /etc/yum.repos.d/mongodb-org-7.0.repo && yum install -y mongodb-org || dnf install -y mongodb-org',
        },
        'note': '首次安装需按系统版本选择源（示例为 Ubuntu 22.04 / EL9），详见 MongoDB 官方文档',
    },
    'java': {
        'name': 'Java (OpenJDK 17)', 'cat': '运行时',
        'detect': 'java --version',
        'version': 'java --version',
        'install': {
            'win': 'winget install --id EclipseAdoptium.Temurin.17.JDK -e --accept-source-agreements --accept-package-agreements',
            'linux_deb': 'apt-get install -y openjdk-17-jdk',
            'linux_rpm': 'yum install -y java-17-openjdk || dnf install -y java-17-openjdk',
        },
    },
    'go': {
        'name': 'Go (Golang)', 'cat': '运行时',
        'detect': 'go version',
        'version': 'go version',
        'install': {
            'win': 'winget install --id GoLang.Go -e --accept-source-agreements --accept-package-agreements',
            'linux_deb': 'apt-get install -y golang',
            'linux_rpm': 'yum install -y golang || dnf install -y golang',
        },
    },
    'curl': {
        'name': 'curl', 'cat': '网络工具',
        'detect': 'curl --version',
        'version': 'curl --version',
        'install': {
            'win': 'winget install --id curl.curl -e --accept-source-agreements --accept-package-agreements',
            'linux_deb': 'apt-get install -y curl',
            'linux_rpm': 'yum install -y curl',
        },
    },
    'wget': {
        'name': 'wget', 'cat': '网络工具',
        'detect': 'wget --version',
        'version': 'wget --version',
        'install': {
            'win': 'winget install --id JernejSimoncic.Wget -e --accept-source-agreements --accept-package-agreements',
            'linux_deb': 'apt-get install -y wget',
            'linux_rpm': 'yum install -y wget',
        },
    },
    'vim': {
        'name': 'Vim', 'cat': '编辑器',
        'detect': 'vim --version | head -n 1',
        'version': 'vim --version | head -n 1',
        'install': {
            'win': 'winget install --id vim.vim -e --accept-source-agreements --accept-package-agreements',
            'linux_deb': 'apt-get install -y vim',
            'linux_rpm': 'yum install -y vim-enhanced',
        },
    },
    'certbot': {
        'name': 'Certbot (ACME)', 'cat': 'SSL工具',
        'detect': 'certbot --version',
        'version': 'certbot --version',
        'install': {
            'win': 'pip install certbot',
            'linux_deb': 'apt-get install -y certbot',
            'linux_rpm': 'yum install -y certbot',
        },
    },
}

# 一键部署预设：源码包地址 / 解压方式 / 解压后顶层目录
APP_DEPLOY = {
    'wordpress': {
        'name': 'WordPress', 'desc': '全球最流行的博客 / CMS 建站程序',
        'url': 'https://cn.wordpress.org/latest-zh_CN.tar.gz',
        'ext': 'tar',
    },
    'discuz': {
        'name': 'Discuz! X', 'desc': '经典中文论坛社区程序',
        'url': 'https://codeload.github.com/ComsenzDiscuz/DiscuzX/tar.gz/refs/tags/v3.5',
        'ext': 'tar',
    },
    'typecho': {
        'name': 'Typecho', 'desc': '轻量级开源博客程序',
        'url': 'https://codeload.github.com/typecho/typecho/tar.gz/refs/tags/v1.2.1',
        'ext': 'tar',
    },
    'zblog': {
        'name': 'Z-Blog PHP', 'desc': '国产开源博客系统',
        'url': 'https://update.zblogcn.com/zip/Z-BlogPHP_1_7_3_4070_php7.zip',
        'ext': 'zip',
    },
}


def _platform_key() -> str:
    if IS_WIN:
        return 'win'
    r = run_cmd('cat /etc/os-release 2>/dev/null | grep -E "^(ID|ID_LIKE)="', timeout=10, shell=True)
    text = r['stdout'].lower()
    if 'debian' in text or 'ubuntu' in text:
        return 'linux_deb'
    return 'linux_rpm'


@router.get('/catalog')
def catalog(user: dict = Depends(require_perm('software:view'))):
    out = []
    for key, item in CATALOG.items():
        r = run_cmd(item['detect'], timeout=20, shell=True)
        installed = r['code'] == 0
        version = ''
        if installed:
            v = run_cmd(item['version'], timeout=20, shell=True)
            version = (v['stdout'] or v['stderr']).strip().splitlines()[0][:100] \
                if (v['stdout'] or v['stderr']).strip() else ''
        out.append({
            'key': key, 'name': item['name'], 'cat': item['cat'],
            'installed': installed, 'version': version,
            'installable': _platform_key() in item['install'],
            'note': item.get('note', ''),
        })
    return {'list': out, 'platform': _platform_key()}


@router.post('/install')
def install(body: dict, request: Request, user: dict = Depends(require_perm('software:manage'))):
    key = str(body.get('key', ''))
    if key not in CATALOG:
        raise HTTPException(status_code=404, detail='未知软件')
    pk = _platform_key()
    cmd = CATALOG[key]['install'].get(pk)
    if not cmd:
        raise HTTPException(status_code=400, detail='当前平台暂不支持自动安装，请手动安装')
    audit(user['username'], get_client_ip(request), 'software_install',
          f'安装软件 {CATALOG[key]["name"]}', 'warning')
    import threading
    result = {}

    def _do():
        r = run_cmd(cmd, timeout=1800, shell=True)
        result['code'] = r['code']
        result['output'] = (r['stdout'] + r['stderr'])[-2000:]
        execute('INSERT INTO software_installs (name,action,ts,exit_code,output) VALUES (?,?,?,?,?)',
                (key, 'install', now(), r['code'], result['output']))

    t = threading.Thread(target=_do, daemon=True)
    t.start()
    return {'ok': True, 'msg': '安装任务已在后台启动', 'async': True}


@router.get('/install-status')
def install_status(user: dict = Depends(require_perm('software:view'))):
    rows = query('SELECT * FROM software_installs ORDER BY id DESC LIMIT 10')
    return {'list': rows}


def _move_extracted(tmp_dir: str, root: str):
    """把解压结果移动到站点根目录；若解压出单一子目录则移动其内容。"""
    import shutil
    entries = os.listdir(tmp_dir)
    if len(entries) == 1 and os.path.isdir(os.path.join(tmp_dir, entries[0])):
        src = os.path.join(tmp_dir, entries[0])
    else:
        src = tmp_dir
    for name in os.listdir(src):
        sp = os.path.join(src, name)
        dp = os.path.join(root, name)
        if os.path.isdir(sp):
            shutil.copytree(sp, dp, dirs_exist_ok=True)
        else:
            shutil.copy2(sp, dp)


@router.post('/deploy')
def deploy(body: dict, request: Request, user: dict = Depends(require_perm('software:manage'))):
    """源码一键部署路由。"""
    r = deploy_core(str(body.get('app', '')), str(body.get('domain', '')),
                    int(body.get('port', 80)))
    if not r.get('ok') and r.get('status'):
        raise HTTPException(status_code=r['status'], detail=r.get('error', '部署失败'))
    if r.get('ok'):
        audit(user['username'], get_client_ip(request), 'app_deploy',
              f"一键部署 {r.get('app')} 到 {body.get('domain')} (port {body.get('port', 80)})",
              'warning')
    return r


def deploy_core(app_key: str, domain: str, port: int = 80) -> dict:
    """源码一键部署核心（AI 智能体与路由共用）：建库 → 建站 → 下载源码 → 解压。"""
    import shutil
    from ..config import TMP_DIR, WWWROOT_DIR
    app_key = str(app_key).strip().lower()
    domain = str(domain).strip().lower()
    if app_key not in APP_DEPLOY:
        return {'ok': False, 'status': 404, 'error': '未知应用'}
    if not re.match(r'^[a-z0-9\.\-]+$', domain) or '*' in domain:
        return {'ok': False, 'status': 400, 'error': '域名格式无效（仅小写字母数字、点、横线）'}
    if not 0 < port < 65536:
        return {'ok': False, 'status': 400, 'error': '端口无效'}
    if query('SELECT id FROM websites WHERE domain=?', (domain,), one=True):
        return {'ok': False, 'status': 409, 'error': '该域名已存在，请先删除或更换域名'}
    app = APP_DEPLOY[app_key]
    # 1. 检测 MySQL 并自动创建同名数据库（复用网站模块）
    from . import websites as _websites
    db_info = _websites._auto_create_db(domain)
    if not db_info.get('ok'):
        return {'ok': False, 'status': 400,
                'error': 'MySQL 不可用：' + db_info.get('error', '未检测到 MySQL（请在「软件商店」安装）')}
    # 2. 调用网站模块建站（静态 + 端口）
    root = os.path.join(WWWROOT_DIR, domain)
    os.makedirs(root, exist_ok=True)
    sid = execute(
        'INSERT INTO websites (domain,root,port,type,engine,config,status,created_at) '
        'VALUES (?,?,?,?,?,?,?,?)',
        (domain, root, port, 'static', 'nginx', '', 1, now()))
    _websites._render_nginx()
    # 3. 下载源码包（curl 优先，wget 兜底）
    suffix = 'zip' if app['ext'] == 'zip' else 'tar.gz'
    tmp_archive = os.path.join(TMP_DIR, f'deploy-{app_key}-{int(now())}.{suffix}')
    r = run_cmd(f'curl -fsSL -o "{tmp_archive}" "{app["url"]}" '
                f'|| wget -q -O "{tmp_archive}" "{app["url"]}"', timeout=900, shell=True)
    if r['code'] != 0 or not os.path.isfile(tmp_archive) or os.path.getsize(tmp_archive) < 1000:
        return {'ok': False, 'site_id': sid, 'db': db_info,
                'error': '源站不可达，请稍后重试或手动部署'}
    # 4. 解压
    tmp_dir = os.path.join(TMP_DIR, f'deploy-{app_key}-{sid}')
    os.makedirs(tmp_dir, exist_ok=True)
    if app['ext'] == 'zip':
        er = run_cmd(f'unzip -o "{tmp_archive}" -d "{tmp_dir}"', timeout=300, shell=True)
    else:
        er = run_cmd(f'tar -xzf "{tmp_archive}" -C "{tmp_dir}"', timeout=300, shell=True)
    if er['code'] != 0:
        return {'ok': False, 'site_id': sid, 'db': db_info,
                'error': '解压失败：' + (er['stderr'] or '')[:150]}
    # 5. 移动到站点根 + 6. 权限
    _move_extracted(tmp_dir, root)
    if not IS_WIN:
        run_cmd(f'chmod -R 755 "{root}" && '
                f'chown -R www-data:www-data "{root}" 2>/dev/null || true', timeout=120, shell=True)
    # 清理临时文件
    try:
        os.remove(tmp_archive)
        shutil.rmtree(tmp_dir, ignore_errors=True)
    except Exception:
        pass
    return {'ok': True, 'site_id': sid, 'db': db_info, 'app': app['name'],
            'url': f'http://{domain}' + ('' if port == 80 else f':{port}')}
