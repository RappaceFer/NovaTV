# NovaTV — © 2026 Rappace — Logiciel libre sous licence MIT — https://github.com/RappaceFer/NovaTV
import zipfile,struct,zlib,hashlib,sys
src,dst=sys.argv[1],sys.argv[2]
z=zipfile.ZipFile(src)
def patch_manifest(d):
    d=bytearray(d)
    # debuggable attr value at 4420 (data), type byte at 4415
    assert d[4419]==0x12 and struct.unpack_from('<I',d,4420)[0]==0xffffffff
    struct.pack_into('<I',d,4420,0)
    return bytes(d)
def patch_dex(d):
    d=bytearray(d)
    old=b'--network-caching=1500\0'; new=b'--network-caching=3000\0'
    assert d.count(old)==1; i=d.index(old); d[i:i+len(old)]=new
    d[12:32]=hashlib.sha1(d[32:]).digest()
    struct.pack_into('<I',d,8,zlib.adler32(bytes(d[12:])))
    return bytes(d)
out=zipfile.ZipFile(dst,'w')
ALIGN_SO=4
for i in z.infolist():
    n=i.filename
    if n.startswith(('lib/x86/','lib/x86_64/')): continue
    data=z.read(n)
    zi=zipfile.ZipInfo(n,date_time=(1981,1,1,1,1,2))
    zi.compress_type=i.compress_type; zi.external_attr=i.external_attr
    if i.compress_type==0:
        al=ALIGN_SO if n.endswith('.so') else 4
        off=out.fp.tell()+30+len(n.encode())
        pad=(-off)%al
        if 0<pad<4 and al>4: pad+=al  # extra field needs >=4 bytes for header
        zi.extra=(struct.pack('<HH',0xD935,pad-4)+b'\0'*(pad-4)) if pad>=4 else b'\0'*pad
    out.writestr(zi,data,compresslevel=9 if i.compress_type==8 else None)
out.close()
# verify alignment
v=zipfile.ZipFile(dst)
with open(dst,'rb') as f:
  for i in v.infolist():
    if i.compress_type==0:
        f.seek(i.header_offset); h=f.read(30); nl,el=struct.unpack_from('<HH',h,26)
        s=i.header_offset+30+nl+el; al=ALIGN_SO if i.filename.endswith('.so') else 4
        assert s%al==0,(i.filename,s%al)
print('ok',len(v.infolist()))
