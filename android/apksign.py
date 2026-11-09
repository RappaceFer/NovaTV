# NovaTV — © 2026 Rappace — Logiciel libre sous licence MIT — https://github.com/RappaceFer/NovaTV
"""Signature APK « v2 » (APK Signature Scheme v2) sans outils Android.

  python3 apksign.py sign   entree.apk sortie.apk cle.p12 MOTDEPASSE
  python3 apksign.py verify fichier.apk

Android exige la signature v2 pour les applis qui visent Android 11 (API 30) et plus.
Algorithme : RSASSA-PKCS1-v1_5 + SHA-256 (identifiant 0x0103).
"""
import struct, sys, hashlib
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.primitives.serialization import pkcs12
from cryptography import x509

MAGIC = b'APK Sig Block 42'
V2_ID = 0x7109871a
ALG = 0x0103
CHUNK = 1 << 20

lp = lambda b: struct.pack('<I', len(b)) + b

def eocd_info(d):
    i = d.rfind(b'PK\x05\x06', max(0, len(d) - 65557))
    if i < 0: raise ValueError('EOCD introuvable')
    cd_size, cd_off = struct.unpack_from('<II', d, i + 12)
    return i, cd_off, cd_size

def content_digest(entries, cd, eocd):
    ds = []
    for sec in (entries, cd, eocd):
        for k in range(0, len(sec), CHUNK):
            c = sec[k:k + CHUNK]
            ds.append(hashlib.sha256(b'\xa5' + struct.pack('<I', len(c)) + c).digest())
    return hashlib.sha256(b'\x5a' + struct.pack('<I', len(ds)) + b''.join(ds)).digest()

def sign(src, dst, p12, password):
    d = open(src, 'rb').read()
    eo, cd_off, cd_size = eocd_info(d)
    assert cd_off + cd_size == eo, 'archive inattendue'
    assert d[cd_off - 16:cd_off] != MAGIC, 'déjà signée en v2'
    key, cert, _ = pkcs12.load_key_and_certificates(open(p12, 'rb').read(), password.encode())
    entries, cd, eocd = d[:cd_off], d[cd_off:eo], d[eo:]
    digest = content_digest(entries, cd, eocd)
    cert_der = cert.public_bytes(serialization.Encoding.DER)
    pub_der = key.public_key().public_bytes(serialization.Encoding.DER, serialization.PublicFormat.SubjectPublicKeyInfo)
    signed_data = lp(lp(struct.pack('<I', ALG) + lp(digest))) + lp(lp(cert_der)) + lp(b'')
    sig = key.sign(signed_data, padding.PKCS1v15(), hashes.SHA256())
    signer = lp(signed_data) + lp(lp(struct.pack('<I', ALG) + lp(sig))) + lp(pub_der)
    value = lp(lp(signer))
    pairs = struct.pack('<Q', 4 + len(value)) + struct.pack('<I', V2_ID) + value
    size = len(pairs) + 8 + 16
    block = struct.pack('<Q', size) + pairs + struct.pack('<Q', size) + MAGIC
    new_eocd = bytearray(eocd)
    struct.pack_into('<I', new_eocd, 16, cd_off + len(block))   # le répertoire central est décalé
    open(dst, 'wb').write(entries + block + cd + bytes(new_eocd))

def verify(path):
    d = open(path, 'rb').read()
    eo, cd_off, cd_size = eocd_info(d)
    assert d[cd_off - 16:cd_off] == MAGIC, 'pas de bloc de signature'
    size2 = struct.unpack_from('<Q', d, cd_off - 24)[0]
    bstart = cd_off - size2 - 8
    assert struct.unpack_from('<Q', d, bstart)[0] == size2, 'tailles du bloc incohérentes'
    p, end = bstart + 8, cd_off - 24
    v2 = None
    while p < end:
        ln, pid = struct.unpack_from('<QI', d, p)
        if pid == V2_ID: v2 = d[p + 12:p + 8 + ln]
        p += 8 + ln
    assert v2, 'bloc v2 absent'
    rd = lambda b, o: (b[o + 4:o + 4 + struct.unpack_from('<I', b, o)[0]], o + 4 + struct.unpack_from('<I', b, o)[0])
    signers, _ = rd(v2, 0)
    signer, _ = rd(signers, 0)
    sd, o = rd(signer, 0); sigs, o = rd(signer, o); pub, o = rd(signer, o)
    digs, q = rd(sd, 0); certs, q = rd(sd, q)
    dig_entry, _ = rd(digs, 0); alg = struct.unpack_from('<I', dig_entry, 0)[0]; digest, _ = rd(dig_entry, 4)
    sig_entry, _ = rd(sigs, 0); salg = struct.unpack_from('<I', sig_entry, 0)[0]; sig, _ = rd(sig_entry, 4)
    cert_der, _ = rd(certs, 0)
    assert alg == ALG == salg, 'algorithme inattendu'
    pk = serialization.load_der_public_key(pub)
    pk.verify(sig, sd, padding.PKCS1v15(), hashes.SHA256())                     # lève une exception si faux
    cert = x509.load_der_x509_certificate(cert_der)
    assert cert.public_key().public_bytes(serialization.Encoding.DER, serialization.PublicFormat.SubjectPublicKeyInfo) == pub, 'clé ≠ certificat'
    eocd = bytearray(d[eo:]); struct.pack_into('<I', eocd, 16, bstart)          # comme Android : offset du bloc
    assert content_digest(d[:bstart], d[cd_off:eo], bytes(eocd)) == digest, 'empreinte du contenu fausse'
    return cert.subject.rfc4514_string(), hashlib.sha256(cert_der).hexdigest()

if __name__ == '__main__':
    if sys.argv[1] == 'sign': sign(*sys.argv[2:6]); print('signé v2 :', sys.argv[3])
    else: print('v2 OK —', *verify(sys.argv[2]))
