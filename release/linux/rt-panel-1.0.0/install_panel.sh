#!/bin/bash
# ============================================================
#  RT面板 RT Panel - Linux 一键安装脚本（命令式）
#
#  用户安装命令（复制整条到服务器终端执行即可）:
#    if [ -f /usr/bin/curl ];then curl -sSO https://你的域名/install_panel.sh;else wget -O install_panel.sh https://你的域名/install_panel.sh;fi;bash install_panel.sh 验证码
#
#  脚本自动完成:
#   1. 校验安装验证码
#   2. 自动安装 Python3 / 编译工具链 / curl / wget 等全部运行环境
#   3. 自动下载面板安装包（无需用户手动下载任何文件）
#   4. 部署面板到 /opt/rt-panel 并安装 Python 依赖
#   5. 注册 systemd 开机自启 + 放行防火墙
#   6. 安装过程提示输入自定义端口（40 秒未输入默认 8000）
# ============================================================
set -e

PANEL_NAME="RT面板"
INSTALL_DIR="/opt/rt-panel"
VERSION="1.0.0"
# ★ 发布前修改：安装验证码（官网下载页的命令需与之一致）
INSTALL_CODE="${RT_INSTALL_CODE:-rtpanel2025}"
# ★ 发布前修改：安装包下载地址（你的官网域名）
DOWNLOAD_BASE="${RT_DOWNLOAD_BASE:-https://www.rt888.icu}"
PKG_URL="$DOWNLOAD_BASE/rt-panel-$VERSION.tar.gz"
ACCOUNT_SERVER="${RT_ACCOUNT_SERVER:-https://www.rt888.icu}"
SRC_DIR="$(cd "$(dirname "$0")" 2>/dev/null && pwd || echo '')"

# ---------- 黑金主题输出 ----------
GOLD=$'\033[38;2;212;175;55m'
GOLD_L=$'\033[38;2;245;208;97m'
GREY=$'\033[38;2;140;134;120m'
GREEN=$'\033[38;2;103;194;58m'
RED=$'\033[38;2;245;108;108m'
RESET=$'\033[0m'
BOLD=$'\033[1m'

ok()   { printf "${GREEN}${BOLD}  ✔${RESET} ${GREY}%s${RESET}\n" "$1"; }
step() { printf "\n${GOLD_L}${BOLD} ▶ %s${RESET}\n" "$1"; }
info() { printf "   ${GREY}%s${RESET}\n" "$1"; }
err()  { printf "${RED}${BOLD}  ✘ %s${RESET}\n" "$1"; }
warn() { printf "${RED}  !${RESET} ${GREY}%s${RESET}\n" "$1"; }

banner() {
cat <<EOF

${GOLD}  ██████╗  ██╗ █████╗  ██████╗ ██████╗ ██╗   ██╗${RESET}
${GOLD}  ╚════██╗ ██║██╔══██╗██╔═══██╗██╔══██╗██║   ██║${RESET}
${GOLD_L}   █████╔╝ ██║███████║██║   ██║██║  ██║██║   ██║${RESET}
${GOLD_L}  ██╔═══╝  ██║██╔══██║██║   ██║██║  ██║██║   ██║${RESET}
${GOLD}  ███████╗ ██║██║  ██║╚██████╔╝██████╔╝╚██████╔╝${RESET}
${GOLD}  ╚══════╝ ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚═════╝  ╚═════╝${RESET}

${GOLD_L}${BOLD}           R T 面 板 · 一 键 安 装 向 导${RESET}
${GREY}        RT Panel - High-end Server Control Panel${RESET}
${GREY}        免费 · 安全 · 高端  |  跨平台服务器运维面板${RESET}

EOF
}

banner

# ---------- 0. root 检查 ----------
if [ "$(id -u)" -ne 0 ]; then
    err "请使用 root 运行: sudo bash install_panel.sh"
    exit 1
fi

# ---------- 0.1 安装验证码校验 ----------
step "校验安装验证码"
CODE_ARG="${1:-}"
if [ "$CODE_ARG" = "$INSTALL_CODE" ]; then
    ok "验证码校验通过"
elif [ -n "$CODE_ARG" ]; then
    err "安装验证码不正确！"
    info "请到官网「下载安装」页面复制最新的安装命令（命令中已包含验证码）"
    info "官网地址: $DOWNLOAD_BASE"
    exit 1
else
    # 未带验证码：交互式输入（3 次机会）
    for i in 1 2 3; do
        printf "${GREY}  请输入安装验证码（官网下载页获取）: ${RESET}"
        if [ -t 0 ]; then
            read -r input_code
        else
            input_code=""
        fi
        if [ "$input_code" = "$INSTALL_CODE" ]; then
            ok "验证码校验通过"
            break
        fi
        if [ "$i" -lt 3 ]; then
            err "验证码不正确，还可尝试 $((3 - i)) 次"
        else
            err "验证码错误次数过多，安装终止。请到官网复制最新安装命令"
            exit 1
        fi
    done
fi

# ---------- 0.2 配置面板端口（40 秒未输入使用默认 8000） ----------
step "配置面板端口"
PORT="${RT_PORT:-8000}"
if [ -t 0 ]; then
    printf "${GREY}  请输入自定义端口号（回车或 %s40 秒%s 未输入将使用默认 ${GOLD_L}8000${GREY}）: ${RESET}" "$GOLD_L" "$GREY"
    if read -t 40 -r input_port 2>/dev/null && [ -n "$input_port" ]; then
        case "$input_port" in
            ''|*[!0-9]*) err "输入无效，使用默认端口 8000"; PORT=8000 ;;
            *)
                if [ "$input_port" -ge 1 ] && [ "$input_port" -le 65535 ]; then
                    PORT="$input_port"
                    ok "已设置自定义端口 $PORT"
                else
                    err "端口超出范围(1-65535)，使用默认端口 8000"
                    PORT=8000
                fi ;;
        esac
    else
        printf "\n${GREY}  已超时，使用默认端口 ${GOLD_L}8000${RESET}\n"
        PORT=8000
    fi
else
    info "非交互模式（管道安装），使用端口 $PORT"
fi

# ---------- 0.3 域名与 HTTPS：有没有域名？ ----------
DOMAIN="${RT_DOMAIN:-}"
HTTPS_OK=""
HTTPS_ADDR=""
if [ -t 0 ]; then
    printf "${GREY}  是否有域名用于面板访问？（回车=没有，直接用 IP 访问；有则输入 y）: ${RESET}"
    if read -t 40 -r has_domain 2>/dev/null; then
        case "$has_domain" in
            y|Y|yes|YES|是|有)
                printf "${GREY}  请输入面板域名（如 panel.example.com）: ${RESET}"
                read -r DOMAIN || DOMAIN=""
                ;;
            *) info "未使用域名，面板将以 http://IP:$PORT 访问" ;;
        esac
    else
        info "已超时，视为无域名，面板将以 http://IP:$PORT 访问"
    fi
else
    [ -n "$DOMAIN" ] && info "非交互模式，使用域名 $DOMAIN" || info "非交互模式，使用 IP 访问"
fi

# ---------- 1. 自动安装运行环境 ----------
step "自动安装运行环境（Python3 / 编译工具 / 网络组件）"
if [ -f /etc/os-release ]; then
    . /etc/os-release
    case "$ID_LIKE|$ID" in
        *debian*|*ubuntu*|debian|ubuntu)
            DEBIAN_FRONTEND=noninteractive apt-get update -y >/dev/null 2>&1 || true
            DEBIAN_FRONTEND=noninteractive apt-get install -y \
                python3 python3-venv python3-pip build-essential \
                curl wget ca-certificates openssl git unzip tzdata cron >/dev/null 2>&1
            ;;
        *rhel*|*centos*|*fedora*|centos|rhel|fedora|rocky|almalinux)
            (yum groupinstall -y "Development Tools" >/dev/null 2>&1 || \
             dnf groupinstall -y "Development Tools" >/dev/null 2>&1 || true)
            (yum install -y python3 python3-pip curl wget ca-certificates openssl git unzip crontabs || \
             dnf install -y python3 python3-pip curl wget ca-certificates openssl git unzip crontabs) >/dev/null 2>&1
            ;;
        *)
            err "无法识别发行版（$ID），请手动安装 Python 3.8+ 后重试"
            exit 1
            ;;
    esac
else
    err "无法识别系统"; exit 1
fi
PYVER=$(python3 -c 'import sys; print("%d.%d" % sys.version_info[:2])' 2>/dev/null || echo '?')
ok "运行环境就绪（Python $PYVER + 编译工具链 + curl/wget/openssl 等）"

# ---------- 2. 自动下载面板安装包 ----------
step "自动下载面板安装包"
if [ -n "$SRC_DIR" ] && [ -d "$SRC_DIR/panel" ]; then
    PANEL_SRC="$SRC_DIR/panel"
    ok "使用本地安装文件（离线模式）"
else
    TMP_PKG="/tmp/rt-panel-$VERSION.tar.gz"
    TMP_EXT="/tmp/rt-panel-extract"
    rm -rf "$TMP_PKG" "$TMP_EXT"
    info "从 $PKG_URL 下载..."
    if [ -f /usr/bin/curl ]; then
        curl -fsSL --connect-timeout 15 "$PKG_URL" -o "$TMP_PKG"
    else
        wget -q --timeout=15 "$PKG_URL" -O "$TMP_PKG"
    fi
    mkdir -p "$TMP_EXT"
    tar -xzf "$TMP_PKG" -C "$TMP_EXT"
    PANEL_SRC="$TMP_EXT/panel"
    if [ ! -d "$PANEL_SRC" ]; then
        err "安装包内容异常，请检查下载地址或联系客服"
        exit 1
    fi
    ok "安装包下载完成"
fi

# ---------- 3. 部署文件 ----------
step "部署面板文件"
mkdir -p "$INSTALL_DIR"
cp -rf "$PANEL_SRC/." "$INSTALL_DIR/"
# 安装 rt 命令行管理工具（类宝塔 bt 命令：rt status/restart/port/entrance/ssl 等）
if [ -f "$INSTALL_DIR/backend/rt.sh" ]; then
    cp -f "$INSTALL_DIR/backend/rt.sh" /usr/bin/rt
    chmod +x /usr/bin/rt
    ok "rt 命令行工具已安装（服务器终端输入 rt 即可管理面板）"
fi
ok "已部署到 $INSTALL_DIR"

# ---------- 4. 安装面板依赖 ----------
step "安装面板依赖（首次约 1 分钟）"
cd "$INSTALL_DIR/backend"
# 固定解释器：与 systemd 服务保持一致（避免 PATH 里出现其它版本 Python 导致 .so 不匹配）
PY="/usr/bin/python3"
[ -x "$PY" ] || PY="$(command -v python3)"
# .deps 存在但缺少 OK 标记（上次安装不完整）→ 强制重装
if [ ! -f .deps/OK ]; then
    rm -rf .deps
    $PY -m pip install --upgrade pip >/dev/null 2>&1 || true
    # 首选清华镜像，失败自动回退官方 PyPI
    $PY -m pip install -r requirements.txt --target .deps \
        -i https://pypi.tuna.tsinghua.edu.cn/simple || \
    $PY -m pip install -r requirements.txt --target .deps || {
        err "依赖安装失败，请检查网络后重试"
        exit 1
    }
    # 用运行服务同一个解释器做导入验证（防镜像/平台错包）
    if ! $PY -c "import sys; sys.path.insert(0,'.deps'); import fastapi, uvicorn, psutil, jwt, multipart, cryptography, pydantic_core; print('OK')" >/dev/null 2>&1; then
        err "依赖校验失败（疑似镜像坏包），清除后改用官方 PyPI 重装"
        rm -rf .deps
        $PY -m pip install -r requirements.txt --target .deps || {
            err "官方源重装仍失败，请检查网络后重试"
            exit 1
        }
        $PY -c "import sys; sys.path.insert(0,'.deps'); import fastapi, uvicorn, psutil, jwt, multipart, cryptography, pydantic_core" || {
            err "依赖最终校验失败，请联系客服"
            exit 1
        }
    fi
    echo "$($PY --version 2>&1) OK" > .deps/OK
fi
ok "依赖就绪"

# ---------- 4.5 域名与 HTTPS 证书（仅当提供了域名） ----------
if [ -n "$DOMAIN" ]; then
    step "域名与 HTTPS 证书"
    LOCAL_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
    DNS_IP=$(getent ahostsv4 "$DOMAIN" 2>/dev/null | awk 'NR==1{print $1}')
    gen_self_cert() {
        SELF_CERT_DIR="$INSTALL_DIR/backend/data/certs/panel"
        mkdir -p "$SELF_CERT_DIR"
        openssl req -x509 -nodes -newkey rsa:2048 -days 3650 \
            -keyout "$SELF_CERT_DIR/panel.key" -out "$SELF_CERT_DIR/panel.crt" \
            -subj "/CN=RT面板/O=RT Panel/C=CN" \
            -addext "subjectAltName=IP:$LOCAL_IP${DOMAIN:+,DNS:$DOMAIN}" >/dev/null 2>&1 \
            && SSL_CERT="$SELF_CERT_DIR/panel.crt" && SSL_KEY="$SELF_CERT_DIR/panel.key"
    }
    if [ -z "$DNS_IP" ] || [ "$DNS_IP" != "$LOCAL_IP" ]; then
        # 域名记录不在本机 → 告知，证书申请到 IP（自签），之后用 IP+端口访问
        warn "域名 $DOMAIN 的记录不在本机（当前解析：${DNS_IP:-无记录}，本机：$LOCAL_IP）"
        if gen_self_cert; then
            HTTPS_OK=1
            HTTPS_ADDR="$LOCAL_IP"
            ok "已为 IP $LOCAL_IP 生成自签证书，面板将以 https://$LOCAL_IP:$PORT 访问"
            info "（Let's Encrypt 不支持裸 IP 证书；待域名解析到本机后，可在面板 设置→域名与 HTTPS 重新绑定换正式证书）"
        else
            warn "自签证书生成失败（需 openssl），面板保持 HTTP"
        fi
    elif ss -tln 2>/dev/null | grep -q ':80 '; then
        warn "端口 80 被占用，无法自动签发免费证书，改为 IP 自签证书"
        if gen_self_cert; then
            HTTPS_OK=1
            HTTPS_ADDR="$LOCAL_IP"
            ok "已生成自签证书（含域名与 IP），面板将以 https://$DOMAIN:$PORT 或 https://$LOCAL_IP:$PORT 访问"
            info "（自签证书浏览器会提示不受信任，属正常现象；80 空闲后可到面板 设置→域名与 HTTPS 重新绑定换正式证书）"
        else
            warn "自签证书生成失败（需 openssl），面板保持 HTTP"
        fi
    else
        # 域名记录在本机 + 80 空闲 → Let's Encrypt 正式证书 → 域名访问
        (DEBIAN_FRONTEND=noninteractive apt-get install -y certbot >/dev/null 2>&1 || \
         yum install -y certbot >/dev/null 2>&1 || \
         dnf install -y certbot >/dev/null 2>&1 || true)
        if command -v certbot >/dev/null 2>&1; then
            if certbot certonly --standalone --non-interactive --agree-tos \
                 --register-unsafely-without-email -d "$DOMAIN" \
                 --deploy-hook "systemctl restart rt-panel 2>/dev/null || true" >/dev/null 2>&1; then
                SSL_CERT="/etc/letsencrypt/live/$DOMAIN/fullchain.pem"
                SSL_KEY="/etc/letsencrypt/live/$DOMAIN/privkey.pem"
                HTTPS_OK=1
                HTTPS_ADDR="$DOMAIN"
                ok "证书签发成功，面板将以 https://$DOMAIN:$PORT 访问（到期自动续期）"
            else
                warn "免费证书签发失败，改为 IP 自签证书"
                if gen_self_cert; then
                    HTTPS_OK=1
                    HTTPS_ADDR="$LOCAL_IP"
                    ok "已为 IP $LOCAL_IP 生成自签证书，面板将以 https://$LOCAL_IP:$PORT 访问"
                else
                    warn "自签证书生成失败（需 openssl），面板保持 HTTP"
                fi
            fi
        else
            warn "certbot 安装失败，改为 IP 自签证书"
            if gen_self_cert; then
                HTTPS_OK=1
                HTTPS_ADDR="$LOCAL_IP"
                ok "已为 IP $LOCAL_IP 生成自签证书，面板将以 https://$LOCAL_IP:$PORT 访问"
            else
                warn "自签证书生成失败（需 openssl），面板保持 HTTP"
            fi
        fi
    fi
fi

# ---------- 5. 写入面板配置 ----------
step "写入面板配置"
mkdir -p "$INSTALL_DIR/backend/data"
if [ -n "$HTTPS_OK" ]; then
    cat > "$INSTALL_DIR/backend/data/config.json" <<EOF
{
  "port": $PORT,
  "bind_host": "0.0.0.0",
  "site_name": "RT面板",
  "account_server": "$ACCOUNT_SERVER",
  "theme": "blackgold",
  "ssl_cert": "$SSL_CERT",
  "ssl_key": "$SSL_KEY"
}
EOF
else
    cat > "$INSTALL_DIR/backend/data/config.json" <<EOF
{
  "port": $PORT,
  "bind_host": "0.0.0.0",
  "site_name": "RT面板",
  "account_server": "$ACCOUNT_SERVER",
  "theme": "blackgold"
}
EOF
fi
# 生成网页初始化令牌（安装完成后在浏览器完成管理员账号 + 官网账户配置）
SETUP_TOKEN=$(head -c 8 /dev/urandom | od -An -tx1 | tr -d ' \n')
printf '%s\n' "$SETUP_TOKEN" > "$INSTALL_DIR/backend/data/setup_token.txt"
ok "端口 $PORT · 官网 $ACCOUNT_SERVER · 初始化令牌已生成"

# ---------- 6. systemd 服务 ----------
step "注册 systemd 开机自启服务"
cat > /etc/systemd/system/rt-panel.service <<EOF
[Unit]
Description=RT Panel - High-end Server Control Panel
After=network.target

[Service]
Type=simple
WorkingDirectory=$INSTALL_DIR/backend
ExecStart=/usr/bin/python3 run.py
Restart=always
RestartSec=5
Environment=PYTHONUNBUFFERED=1

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable rt-panel >/dev/null 2>&1
systemctl restart rt-panel >/dev/null 2>&1
sleep 3
if systemctl is-active --quiet rt-panel; then
    ok "服务运行中（已注册开机自启）"
else
    err "服务未正常启动，请查看日志: journalctl -u rt-panel -n 50"
fi

# ---------- 7. 防火墙 ----------
IP=$(hostname -I 2>/dev/null | awk '{print $1}')
if command -v firewall-cmd >/dev/null 2>&1; then
    firewall-cmd --add-port=$PORT/tcp --permanent >/dev/null 2>&1 && firewall-cmd --reload >/dev/null 2>&1
    ok "已放行防火墙端口 $PORT/tcp"
elif command -v ufw >/dev/null 2>&1; then
    ufw allow $PORT/tcp >/dev/null 2>&1
    ok "已放行 UFW 端口 $PORT/tcp"
fi

# ---------- 8. 完成 ----------
echo ""
printf "${GOLD}%s${RESET}\n" "  ┌────────────────────────────────────────────┐"
printf "${GOLD}%s${RESET}\n" "  │         ${GOLD_L}${BOLD}R T 面 板 安 装 完 成${RESET}${GOLD}         │"
printf "${GOLD}%s${RESET}\n" "  └────────────────────────────────────────────┘"
echo ""
info "  访问地址:  ${GOLD_L}http://${IP:-服务器IP}:$PORT${RESET}"
if [ -n "$HTTPS_OK" ]; then
    info "  HTTPS 地址: ${GOLD_L}https://$HTTPS_ADDR:$PORT${RESET}"
    info "  （后续修改/换绑域名：面板 设置→域名与 HTTPS）"
fi
info "  初始化令牌: ${GOLD_L}${BOLD}$SETUP_TOKEN${RESET}（仅用于首次初始化，用完即焚）"
echo ""
info "  下一步:    浏览器打开访问地址 → 输入初始化令牌 →"
info "             在网页上设置管理员用户名/密码，并可绑定官网账户"
info "             免费版可绑 2 台 / 付费版可绑 10 台"
echo ""
info "  重新查看令牌: cat $INSTALL_DIR/backend/data/setup_token.txt"
info "  修改端口:  面板 设置→面板配置→访问端口 修改后重启面板生效"
info "  服务管理:  systemctl start|stop|restart rt-panel"
info "  命令行:    服务器终端输入 rt 管理面板（改端口/安全入口/HTTPS/重启等）"
info "  查看日志:  journalctl -u rt-panel -f"
echo ""
