"""厂商工具：生成 RSA 密钥对。

用法:
    python tools/gen_keys.py

产出:
    keys/ops_private.pem    （私钥，务必保密，绝不随发行包分发）
    backend/app/license_public.pem   （公钥，随面板发行）
"""
import os
import sys

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(BASE, 'backend', '.deps'))

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa


def main():
    keys_dir = os.path.join(BASE, 'keys')
    os.makedirs(keys_dir, exist_ok=True)
    priv_path = os.path.join(keys_dir, 'ops_private.pem')
    pub_path = os.path.join(BASE, 'backend', 'app', 'license_public.pem')

    if os.path.exists(priv_path):
        print(f'[!] 私钥已存在: {priv_path}（如需更换密钥请先删除）')
        return

    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    with open(priv_path, 'wb') as f:
        f.write(key.private_bytes(
            serialization.Encoding.PEM,
            serialization.PrivateFormat.PKCS8,
            serialization.NoEncryption()))
    with open(pub_path, 'wb') as f:
        f.write(key.public_key().public_bytes(
            serialization.Encoding.PEM,
            serialization.PublicFormat.SubjectPublicKeyInfo))
    print(f'[OK] 私钥已生成: {priv_path}  ← 严格保密！')
    print(f'[OK] 公钥已写入: {pub_path}  ← 随面板分发')


if __name__ == '__main__':
    main()
