# NovaTV — © 2026 Rappace — Logiciel libre sous licence MIT — https://github.com/RappaceFer/NovaTV
"""Manifeste binaire (AXML) et resources.arsc minimal."""
import struct

def pool(strings):
    offs, data = [], bytearray()
    for s in strings:
        offs.append(len(data)); e = s.encode('utf-16le')
        data += struct.pack('<H', len(s)) + e + b'\0\0'
    while len(data) % 4: data += b'\0'
    hdr = 28; start = hdr + 4 * len(strings)
    body = b''.join(struct.pack('<I', o) for o in offs) + data
    return struct.pack('<HHIIIIII', 0x0001, hdr, hdr + len(body), len(strings), 0, 0, start, 0) + body

NS = 'http://schemas.android.com/apk/res/android'
ATTR = {'theme': 0x01010000, 'label': 0x01010001, 'icon': 0x01010002, 'name': 0x01010003, 'exported': 0x01010010,
        'configChanges': 0x0101001f, 'minSdkVersion': 0x0101020c, 'versionCode': 0x0101021b, 'versionName': 0x0101021c,
        'targetSdkVersion': 0x01010270, 'allowBackup': 0x01010280, 'required': 0x0101028e, 'banner': 0x010103f2,
        'usesCleartextTraffic': 0x010104ec}
T_REF, T_STR, T_DEC, T_HEX, T_BOOL = 0x01, 0x03, 0x10, 0x11, 0x12

def axml(tree):
    # tree: (tag, [(android?, name, type, value)], [children])
    names = []
    def walk(n):
        tag, attrs, kids = n
        for a in attrs:
            if a[0] and a[1] not in names: names.append(a[1])
        for k in kids: walk(k)
    walk(tree)
    names.sort(key=lambda x: ATTR[x])
    strings = list(names)
    def S(s):
        if s not in strings: strings.append(s)
        return strings.index(s)
    S('android'); S(NS)
    chunks = []
    line = [1]
    def el(n):
        tag, attrs, kids = n
        enc = []
        for andr, name, typ, val in sorted(attrs, key=lambda a: ATTR.get(a[1], 0) if a[0] else 0):
            ns = S(NS) if andr else 0xffffffff
            nm = S(name)
            if typ == T_STR: raw = S(val); data = raw
            else: raw = 0xffffffff; data = val & 0xffffffff
            enc.append(struct.pack('<IIIHBBI', ns, nm, raw, 8, 0, typ, data))
        body = struct.pack('<IIHHHHHH', 0xffffffff, S(tag), 0x14, 0x14, len(enc), 0, 0, 0) + b''.join(enc)
        chunks.append(struct.pack('<HHIII', 0x0102, 16, 16 + len(body), line[0], 0xffffffff) + body); line[0] += 1
        for k in kids: el(k)
        chunks.append(struct.pack('<HHIIIII', 0x0103, 16, 24, line[0], 0xffffffff, 0xffffffff, S(tag))); line[0] += 1
    el(tree)
    nsb = struct.pack('<HHIIIII', 0x0100, 16, 24, 1, 0xffffffff, S('android'), S(NS))
    nse = struct.pack('<HHIIIII', 0x0101, 16, 24, line[0], 0xffffffff, S('android'), S(NS))
    sp = pool(strings)
    rm = struct.pack('<HHI', 0x0180, 8, 8 + 4 * len(names)) + b''.join(struct.pack('<I', ATTR[n]) for n in names)
    body = sp + rm + nsb + b''.join(chunks) + nse
    return struct.pack('<HHI', 0x0003, 8, 8 + len(body)) + body

def manifest(pkg, label, vcode, vname, icon, banner, target=34):
    A = lambda n, t, v: (True, n, t, v)
    return axml(('manifest', [A('versionCode', T_DEC, vcode), A('versionName', T_STR, vname), (False, 'package', T_STR, pkg)], [
        ('uses-sdk', [A('minSdkVersion', T_DEC, 26), A('targetSdkVersion', T_DEC, target)], []),
        ('uses-permission', [A('name', T_STR, 'android.permission.INTERNET')], []),
        ('uses-feature', [A('name', T_STR, 'android.hardware.touchscreen'), A('required', T_BOOL, 0)], []),
        ('uses-feature', [A('name', T_STR, 'android.software.leanback'), A('required', T_BOOL, 0)], []),
        ('application', [A('theme', T_REF, 0x0103000a), A('label', T_STR, label), A('icon', T_REF, icon),
                         A('allowBackup', T_BOOL, 0), A('banner', T_REF, banner), A('usesCleartextTraffic', T_BOOL, 0xffffffff)], [
            ('activity', [A('name', T_STR, pkg + '.MainActivity'), A('exported', T_BOOL, 0xffffffff),
                          A('configChanges', T_HEX, 0x0ff0), A('label', T_STR, label)], [
                ('intent-filter', [], [
                    ('action', [A('name', T_STR, 'android.intent.action.MAIN')], []),
                    ('category', [A('name', T_STR, 'android.intent.category.LAUNCHER')], []),
                    ('category', [A('name', T_STR, 'android.intent.category.LEANBACK_LAUNCHER')], [])])])])]))

def arsc(pkg, entries, density=640):
    """entries: liste (clé, chemin) dans le type drawable ; ids 0x7f010000 + i"""
    gpool = pool([p for k, p in entries])
    tpool = pool(['drawable'])
    kpool = pool([k for k, p in entries])
    n = len(entries)
    spec = struct.pack('<HHIBBHI', 0x0202, 16, 16 + 4 * n, 1, 0, 0, n) + b'\0' * (4 * n)
    cfg = bytearray(64); struct.pack_into('<I', cfg, 0, 64); struct.pack_into('<H', cfg, 14, density)
    hs = 20 + 64
    ents = b''.join(struct.pack('<HHIHBBI', 8, 0, i, 8, 0, 0x03, i) for i in range(n))
    offs = b''.join(struct.pack('<I', 16 * i) for i in range(n))
    start = hs + len(offs)
    typ = struct.pack('<HHIBBHII', 0x0201, hs, start + len(ents), 1, 0, 0, n, start) + bytes(cfg) + offs + ents
    name = pkg.encode('utf-16le').ljust(256, b'\0')
    ph = 288
    pbody = tpool + kpool + spec + typ
    pk = struct.pack('<HHII', 0x0200, ph, ph + len(pbody), 0x7f) + name + struct.pack('<IIIII', ph, 1, ph + len(tpool), n, 0) + pbody
    body = gpool + pk
    return struct.pack('<HHII', 0x0002, 12, 12 + len(body), 1) + body

if __name__ == '__main__':
    import sys
    code, ver = int(sys.argv[1]), sys.argv[2]
    target = int(sys.argv[3]) if len(sys.argv) > 3 else 34
    open('AndroidManifest.xml', 'wb').write(manifest('com.novatv.app', 'NovaTV', code, ver, 0x7f010001, 0x7f010000, target))
    open('resources.arsc', 'wb').write(arsc('com.novatv.app', [('banner', 'res/drawable/banner.png'), ('icon', 'res/drawable/icon.png')]))
