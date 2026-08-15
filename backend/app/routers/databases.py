"""数据库管理：检测 MySQL/PostgreSQL/SQLite，建库建用户、查询、备份。"""
import os

from fastapi import APIRouter, Depends, HTTPException, Request

from ..audit import audit
from ..auth import get_client_ip, require_feature, require_perm
from ..config import BACKUP_DIR
from ..utils.exec_utils import run_cmd

router = APIRouter(prefix='/api/databases', tags=['databases'],
                   dependencies=[Depends(require_feature('databases'))])


def _mysql_cmd(args: str, root_pwd: str = '') -> str:
    base = 'mysql --connect-timeout=10'
    if root_pwd:
        base += f' -uroot -p{root_pwd}'
    else:
        base += ' -uroot'
    return f'{base} {args}'


def _psql_cmd(args: str) -> str:
    return f'psql -U postgres {args}'


@router.get('/servers')
def servers(user: dict = Depends(require_perm('databases:view'))):
    out = []
    r = run_cmd('mysql --version', timeout=10)
    if r['code'] == 0:
        try:
            run_cmd(_mysql_cmd('-e "SELECT VERSION();"'), timeout=10)
            out.append({'type': 'mysql', 'name': 'MySQL/MariaDB', 'version': r['stdout'].strip(),
                        'connected': True})
        except Exception:
            out.append({'type': 'mysql', 'name': 'MySQL/MariaDB', 'version': r['stdout'].strip(),
                        'connected': False, 'error': '无法以 root 免密连接，请在连接管理配置密码'})
    r = run_cmd('psql --version', timeout=10)
    if r['code'] == 0:
        try:
            c = run_cmd(_psql_cmd('-c "SELECT version();"'), timeout=10)
            out.append({'type': 'postgresql', 'name': 'PostgreSQL',
                        'version': r['stdout'].strip(), 'connected': c['code'] == 0})
        except Exception:
            out.append({'type': 'postgresql', 'name': 'PostgreSQL', 'version': r['stdout'].strip(),
                        'connected': False})
    out.append({'type': 'sqlite', 'name': 'SQLite（内置）', 'version': '', 'connected': True})
    # Redis 状态：redis-cli ping 检测 + INFO 取版本/内存/键数（未安装也展示，便于引导到软件商店）
    rr = run_cmd('redis-cli ping', timeout=10)
    redis = {'type': 'redis', 'name': 'Redis', 'connected': rr['code'] == 0,
             'version': '', 'memory': '', 'keys': ''}
    if rr['code'] == 0:
        info = run_cmd('redis-cli INFO', timeout=10)
        for line in info['stdout'].splitlines():
            kv = line.split(':', 1)
            if len(kv) != 2:
                continue
            k, v = kv[0].strip(), kv[1].strip()
            if k == 'redis_version':
                redis['version'] = v
            elif k == 'used_memory_human':
                redis['memory'] = v
        ks = run_cmd('redis-cli DBSIZE', timeout=10)
        if ks['code'] == 0 and ks['stdout'].strip().isdigit():
            redis['keys'] = ks['stdout'].strip()
    else:
        redis['error'] = 'Redis 未安装（请在「软件商店」安装）'
    out.append(redis)
    return {'list': out}


@router.get('/{kind}/databases')
def db_list(kind: str, user: dict = Depends(require_perm('databases:view'))):
    if kind == 'mysql':
        r = run_cmd(_mysql_cmd('-N -e "SHOW DATABASES;"'), timeout=30)
        if r['code'] != 0:
            raise HTTPException(status_code=500, detail=(r['stderr'] or '连接失败')[:300])
        names = [l.strip() for l in r['stdout'].splitlines() if l.strip()
                 and l.strip() not in ('information_schema', 'performance_schema', 'mysql', 'sys')]
        out = []
        for n in names:
            size = run_cmd(_mysql_cmd(
                f'-N -e "SELECT ROUND(SUM(data_length+index_length)/1024/1024,1) FROM information_schema.tables WHERE table_schema=\'{n}\';"'),
                timeout=30)
            out.append({'name': n, 'size_mb': size['stdout'].strip() or '0'})
        return {'list': out}
    if kind == 'postgresql':
        r = run_cmd(_psql_cmd('-tAc "SELECT datname FROM pg_database WHERE datistemplate=false;"'),
                    timeout=30)
        if r['code'] != 0:
            raise HTTPException(status_code=500, detail=(r['stderr'] or '连接失败')[:300])
        return {'list': [{'name': l.strip()} for l in r['stdout'].splitlines() if l.strip()]}
    if kind == 'sqlite':
        from ..config import DATA_DIR
        files = [f for f in os.listdir(DATA_DIR) if f.endswith('.db')]
        return {'list': [{'name': f[:-3], 'file': os.path.join(DATA_DIR, f)} for f in files]}
    if kind == 'redis':
        # Redis：列出键名（前 200），展示内存/键数（自研管理视图）
        r = run_cmd('redis-cli ping', timeout=10)
        if r['code'] != 0:
            raise HTTPException(status_code=500, detail='Redis 未安装或未运行（请在软件商店安装并启动）')
        keys = run_cmd('redis-cli --scan --count 200', timeout=15)
        info = run_cmd('redis-cli INFO', timeout=10)
        memory = ''
        for line in info['stdout'].splitlines():
            if line.startswith('used_memory_human:'):
                memory = line.split(':', 1)[1].strip()
                break
        return {'list': [{'name': k.strip()} for k in keys['stdout'].splitlines() if k.strip()],
                'meta': {'memory': memory}}
    raise HTTPException(status_code=404, detail='未知数据库类型')


@router.post('/{kind}/database')
def db_create(kind: str, body: dict, request: Request,
              user: dict = Depends(require_perm('databases:manage'))):
    name = str(body.get('name', '')).strip()
    if not name or not name.replace('_', '').isalnum():
        raise HTTPException(status_code=400, detail='数据库名无效（仅字母数字下划线）')
    if kind == 'mysql':
        charset = body.get('charset', 'utf8mb4')
        r = run_cmd(_mysql_cmd(
            f'-e "CREATE DATABASE IF NOT EXISTS `{name}` CHARACTER SET {charset};"'), timeout=30)
    elif kind == 'postgresql':
        r = run_cmd(_psql_cmd(f'-c "CREATE DATABASE \\"{name}\\";"'), timeout=30)
    elif kind == 'sqlite':
        from ..config import DATA_DIR
        import sqlite3
        fp = os.path.join(DATA_DIR, name + '.db')
        sqlite3.connect(fp).close()
        r = {'code': 0, 'stderr': ''}
    else:
        raise HTTPException(status_code=404, detail='未知数据库类型')
    if r['code'] != 0:
        raise HTTPException(status_code=500, detail=(r['stderr'] or '')[:300] or '创建失败')
    audit(user['username'], get_client_ip(request), 'db_create', f'创建数据库 {name} ({kind})')
    return {'ok': True}


@router.delete('/{kind}/database')
def db_drop(kind: str, body: dict, request: Request,
            user: dict = Depends(require_perm('databases:manage'))):
    name = str(body.get('name', ''))
    if not name:
        raise HTTPException(status_code=400, detail='数据库名不能为空')
    if kind == 'mysql':
        r = run_cmd(_mysql_cmd(f'-e "DROP DATABASE `{name}`;"'), timeout=30)
    elif kind == 'postgresql':
        r = run_cmd(_psql_cmd(f'-c "DROP DATABASE \\"{name}\\";"'), timeout=30)
    elif kind == 'sqlite':
        from ..config import DATA_DIR
        fp = os.path.join(DATA_DIR, name + '.db')
        if not fp.endswith('.db') or not os.path.isfile(fp):
            raise HTTPException(status_code=400, detail='无效的 SQLite 文件')
        os.remove(fp)
        r = {'code': 0, 'stderr': ''}
    else:
        raise HTTPException(status_code=404, detail='未知数据库类型')
    if r['code'] != 0:
        raise HTTPException(status_code=500, detail=(r['stderr'] or '')[:300] or '删除失败')
    audit(user['username'], get_client_ip(request), 'db_drop', f'删除数据库 {name} ({kind})', 'warning')
    return {'ok': True}


@router.get('/{kind}/{db}/tables')
def db_tables(kind: str, db: str, user: dict = Depends(require_perm('databases:view'))):
    if kind == 'mysql':
        r = run_cmd(_mysql_cmd(f'-N -e "SHOW TABLE STATUS FROM `{db}`;"'), timeout=30)
        out = []
        for line in r['stdout'].splitlines():
            parts = line.split('\t')
            if len(parts) >= 3:
                out.append({'name': parts[0], 'engine': parts[1], 'rows': parts[4] if len(parts) > 4 else ''})
        return {'list': out}
    if kind == 'postgresql':
        r = run_cmd(_psql_cmd(f'-d {db} -tAc "SELECT tablename FROM pg_tables WHERE schemaname=\'public\';"'),
                    timeout=30)
        return {'list': [{'name': l.strip()} for l in r['stdout'].splitlines() if l.strip()]}
    if kind == 'sqlite':
        import sqlite3
        from ..config import DATA_DIR
        fp = os.path.join(DATA_DIR, db + '.db')
        if not os.path.isfile(fp):
            raise HTTPException(status_code=404, detail='文件不存在')
        conn = sqlite3.connect(fp)
        try:
            rows = conn.execute(
                "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").fetchall()
            return {'list': [{'name': r[0]} for r in rows]}
        finally:
            conn.close()
    raise HTTPException(status_code=404, detail='未知数据库类型')


@router.get('/{kind}/{db}/schema')
def db_schema(kind: str, db: str, table: str,
              user: dict = Depends(require_perm('databases:view'))):
    """表结构（列名/类型/主键）。"""
    if kind == 'sqlite':
        import sqlite3
        from ..config import DATA_DIR
        fp = os.path.join(DATA_DIR, db + '.db')
        if not os.path.isfile(fp):
            raise HTTPException(status_code=404, detail='数据库文件不存在')
        conn = sqlite3.connect(fp)
        try:
            rows = conn.execute(f'PRAGMA table_info("{table}")').fetchall()
            return {'list': [{'name': r[1], 'type': r[2], 'notnull': bool(r[3]),
                              'default': r[4], 'pk': bool(r[5])} for r in rows]}
        finally:
            conn.close()
    if kind == 'mysql':
        r = run_cmd(_mysql_cmd(f'--batch --raw -e "DESCRIBE `{table}`;" {db}'), timeout=30, shell=True)
        if r['code'] != 0:
            raise HTTPException(status_code=500, detail=(r['stderr'] or '')[:200])
        lines = [l.split('\t') for l in r['stdout'].strip().splitlines()]
        return {'list': [{'name': x[0], 'type': x[1], 'notnull': x[2] == 'NO',
                          'default': x[4] if len(x) > 4 else '', 'pk': 'PRI' in (x[3] if len(x) > 3 else '')}
                         for x in lines]}
    if kind == 'postgresql':
        r = run_cmd(_psql_cmd(f'-d {db} -tAc "SELECT column_name,data_type,is_nullable '
                              f'FROM information_schema.columns WHERE table_name=\'{table}\'"'),
                    timeout=30, shell=True)
        return {'list': [{'name': l.split('|')[0], 'type': l.split('|')[1],
                          'notnull': l.split('|')[2] == 'NO', 'default': '', 'pk': False}
                         for l in r['stdout'].strip().splitlines() if l.strip()]}
    raise HTTPException(status_code=404, detail='未知数据库类型')


@router.get('/{kind}/{db}/rows')
def db_rows(kind: str, db: str, table: str, limit: int = 100,
            user: dict = Depends(require_perm('databases:view'))):
    """浏览表数据（SELECT * LIMIT）。"""
    limit = min(max(limit, 1), 500)
    if kind == 'sqlite':
        import sqlite3
        from ..config import DATA_DIR
        fp = os.path.join(DATA_DIR, db + '.db')
        if not os.path.isfile(fp):
            raise HTTPException(status_code=404, detail='数据库文件不存在')
        conn = sqlite3.connect(fp)
        conn.row_factory = sqlite3.Row
        try:
            rows = [dict(r) for r in conn.execute(
                f'SELECT * FROM "{table}" LIMIT {limit}').fetchall()]
            total = conn.execute(f'SELECT COUNT(*) FROM "{table}"').fetchone()[0]
            cols = [d[0] for d in conn.execute(f'SELECT * FROM "{table}" LIMIT 1').description] \
                if rows else []
            return {'cols': cols, 'rows': rows, 'total': total, 'limit': limit}
        finally:
            conn.close()
    if kind in ('mysql', 'postgresql'):
        cmd = (_mysql_cmd(f'--batch --raw -e "SELECT * FROM `{table}` LIMIT {limit};" {db}')
               if kind == 'mysql' else
               _psql_cmd(f'-d {db} -c "SELECT * FROM \\"{table}\\" LIMIT {limit};"'))
        r = run_cmd(cmd, timeout=60, shell=True)
        if r['code'] != 0:
            raise HTTPException(status_code=500, detail=(r['stderr'] or '')[:200])
        lines = [l for l in r['stdout'].splitlines() if l.strip()]
        if not lines:
            return {'cols': [], 'rows': [], 'total': 0, 'limit': limit}
        cols = [c.strip() for c in lines[0].split('\t')]
        rows = []
        for line in lines[1:]:
            vals = line.split('\t')
            rows.append({cols[i]: vals[i] for i in range(min(len(cols), len(vals)))})
        return {'cols': cols, 'rows': rows[:limit], 'total': len(rows), 'limit': limit}
    raise HTTPException(status_code=404, detail='未知数据库类型')


@router.post('/query')
def db_query(body: dict, request: Request, user: dict = Depends(require_perm('databases:manage'))):
    kind = str(body.get('kind', ''))
    db = str(body.get('db', ''))
    sql = str(body.get('sql', '')).strip()
    if not sql:
        raise HTTPException(status_code=400, detail='SQL 不能为空')
    if len(sql) > 20000:
        raise HTTPException(status_code=400, detail='SQL 过长')
    audit(user['username'], get_client_ip(request), 'db_query', f'{kind}/{db}: {sql[:200]}')
    if kind == 'sqlite':
        import sqlite3
        from ..config import DATA_DIR
        fp = os.path.join(DATA_DIR, db + '.db')
        if not os.path.isfile(fp):
            raise HTTPException(status_code=404, detail='文件不存在')
        conn = sqlite3.connect(fp)
        try:
            conn.row_factory = sqlite3.Row
            cur = conn.execute(sql)
            if sql.lstrip().lower().startswith(('select', 'pragma', 'explain', 'with')):
                rows = [dict(r) for r in cur.fetchall()[:500]]
                cols = [d[0] for d in cur.description] if cur.description else []
                return {'cols': cols, 'rows': rows, 'count': len(rows)}
            conn.commit()
            return {'cols': [], 'rows': [], 'affected': cur.rowcount}
        except Exception as e:
            return {'error': str(e)}
        finally:
            conn.close()
    if kind == 'mysql':
        r = run_cmd(_mysql_cmd(f'--batch --raw -e "{sql.replace(chr(34), chr(92) + chr(34))}" {db}'),
                    timeout=120, shell=True)
        return _parse_cli_result(r)
    if kind == 'postgresql':
        r = run_cmd(_psql_cmd(f'-d {db} -c "{sql}"'), timeout=120, shell=True)
        return _parse_cli_result(r)
    raise HTTPException(status_code=404, detail='未知数据库类型')


def _parse_cli_result(r: dict):
    if r['code'] != 0:
        return {'error': (r['stderr'] or r['stdout'])[:2000]}
    lines = [l for l in r['stdout'].splitlines() if l.strip() and not l.startswith('+--')]
    if not lines:
        return {'cols': [], 'rows': [], 'count': 0}
    cols = [c.strip() for c in lines[0].split('\t')]
    rows = []
    for line in lines[1:]:
        vals = line.split('\t')
        rows.append({cols[i]: vals[i] for i in range(min(len(cols), len(vals)))})
    return {'cols': cols, 'rows': rows[:500], 'count': len(rows)}


@router.get('/{kind}/{db}/backup')
def db_backup(kind: str, db: str, request: Request,
              user: dict = Depends(require_perm('databases:manage'))):
    import datetime
    stamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
    dest_dir = os.path.join(BACKUP_DIR, 'database')
    r = dump_database(kind, db, dest_dir, f'{db}_{stamp}')
    if not r.get('ok'):
        raise HTTPException(status_code=500, detail=r.get('error', '备份失败')[:300])
    audit(user['username'], get_client_ip(request), 'db_backup', f'备份数据库 {db} ({kind})')
    return r


def dump_database(kind: str, db: str, dest_dir: str, base_name: str) -> dict:
    """供备份任务与手动备份共用。"""
    os.makedirs(dest_dir, exist_ok=True)
    if kind == 'mysql':
        path = os.path.join(dest_dir, base_name + '.sql.gz')
        r = run_cmd(f'mysqldump -uroot {db} | gzip > "{path}"', timeout=3600, shell=True)
        if r['code'] != 0 or not os.path.isfile(path):
            return {'ok': False, 'error': r['stderr'][:300] or 'mysqldump 失败'}
        return {'ok': True, 'path': path, 'size': os.path.getsize(path)}
    if kind == 'postgresql':
        path = os.path.join(dest_dir, base_name + '.sql.gz')
        r = run_cmd(f'pg_dump -U postgres {db} | gzip > "{path}"', timeout=3600, shell=True)
        if r['code'] != 0 or not os.path.isfile(path):
            return {'ok': False, 'error': r['stderr'][:300] or 'pg_dump 失败'}
        return {'ok': True, 'path': path, 'size': os.path.getsize(path)}
    if kind == 'sqlite':
        import shutil
        from ..config import DATA_DIR
        src = os.path.join(DATA_DIR, db + '.db')
        if not os.path.isfile(src):
            return {'ok': False, 'error': 'SQLite 文件不存在'}
        path = os.path.join(dest_dir, base_name + '.db')
        shutil.copy2(src, path)
        return {'ok': True, 'path': path, 'size': os.path.getsize(path)}
    return {'ok': False, 'error': '未知数据库类型'}
