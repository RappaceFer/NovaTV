# NovaTV — © 2026 Rappace — Logiciel libre sous licence MIT — https://github.com/RappaceFer/NovaTV
import zipfile, struct, os, sys
out = sys.argv[1]; www = sys.argv[2]
z = zipfile.ZipFile(out, 'w')
def add(name, data, store=False):
    zi = zipfile.ZipInfo(name, date_time=(2026, 11, 9, 12, 0, 0))
    zi.compress_type = zipfile.ZIP_STORED if store else zipfile.ZIP_DEFLATED
    zi.external_attr = 0o644 << 16
    if store:
        off = z.fp.tell() + 30 + len(name.encode())
        pad = (-off) % 4
        zi.extra = b'\0' * pad
    z.writestr(zi, data, compresslevel=9)
add('AndroidManifest.xml', open('AndroidManifest.xml', 'rb').read())
add('classes.dex', open('classes.dex', 'rb').read())
# moteur LibVLC repris de l'APK d'origine : classes Java (multidex) + bibliothèques natives ARM
orig = zipfile.ZipFile(sys.argv[3])
for i, n in enumerate(['classes.dex', 'classes2.dex', 'classes3.dex', 'classes4.dex']):
    add('classes%d.dex' % (i + 2), orig.read(n))
for abi in ('arm64-v8a', 'armeabi-v7a'):
    for lib in ('libc++_shared.so', 'libvlc.so', 'libvlcjni.so'):
        add('lib/%s/%s' % (abi, lib), orig.read('lib/%s/%s' % (abi, lib)))
add('resources.arsc', open('resources.arsc', 'rb').read(), store=True)
add('res/drawable/icon.png', open('icon.png', 'rb').read(), store=True)
add('res/drawable/banner.png', open('banner.png', 'rb').read(), store=True)
for root, ds, fs in os.walk(www):
    ds.sort()
    for f in sorted(fs):
        p = os.path.join(root, f)
        add('assets/' + os.path.relpath(p, www), open(p, 'rb').read())
z.close()
print('packed', out)
