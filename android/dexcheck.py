# NovaTV — © 2026 Rappace — Logiciel libre sous licence MIT — https://github.com/RappaceFer/NovaTV
import struct, zlib, hashlib, sys
d = open(sys.argv[1], 'rb').read()
u16 = lambda o: struct.unpack_from('<H', d, o)[0]; u32 = lambda o: struct.unpack_from('<I', d, o)[0]
def uleb(p):
    r = s = 0
    while True:
        b = d[p]; p += 1; r |= (b & 0x7f) << s; s += 7
        if b < 0x80: return r, p
assert d[:8] == b'dex\n035\0'
assert u32(8) == zlib.adler32(d[12:]) & 0xffffffff, 'checksum'
assert d[12:32] == hashlib.sha1(d[32:]).digest(), 'sha1'
assert u32(0x20) == len(d) and u32(0x24) == 0x70 and u32(0x28) == 0x12345678
ns, so, nt, to, np_, po, nf, fo, nm, mo, nc, co, ds, do = [u32(0x38 + 4 * i) for i in range(14)]
assert do + ds == len(d), (do, ds, len(d))
S = []
for i in range(ns):
    l, p = uleb(u32(so + 4 * i)); e = d.index(b'\0', p); S.append(d[p:e].decode()); assert e - p == l
assert S == sorted(S) and len(set(S)) == ns, 'strings sorted/unique'
T = [S[u32(to + 4 * i)] for i in range(nt)]
assert [u32(to + 4 * i) for i in range(nt)] == sorted(u32(to + 4 * i) for i in range(nt))
def tl(o):
    if not o: return []
    assert o % 4 == 0
    return [u16(o + 4 + 2 * i) for i in range(u32(o))]
P = []
for i in range(np_):
    sh, rt, pa = u32(po + 12 * i), u32(po + 12 * i + 4), u32(po + 12 * i + 8)
    P.append((rt, tl(pa)))
    sig = T[rt]; ps = [T[x] for x in tl(pa)]
    exp = ('L' if sig[0] in 'L[' else sig) + ''.join('L' if x[0] in 'L[' else x for x in ps)
    assert S[sh] == exp, (S[sh], exp)
assert P == sorted(P) and len(set(map(str, P))) == np_, 'protos sorted'
Fk = [(u16(fo + 8 * i), u32(fo + 8 * i + 4), u16(fo + 8 * i + 2)) for i in range(nf)]
assert Fk == sorted(Fk)
Mk = [(u16(mo + 8 * i), u32(mo + 8 * i + 4), u16(mo + 8 * i + 2)) for i in range(nm)]
assert Mk == sorted(Mk) and len(set(Mk)) == nm, 'methods sorted'
mname = lambda i: T[Mk[i][0]] + '->' + S[Mk[i][1]] + '(' + ''.join(T[x] for x in P[Mk[i][2]][1]) + ')' + T[P[Mk[i][2]][0]]
fname = lambda i: T[Fk[i][0]] + '->' + S[Fk[i][1]] + ':' + T[Fk[i][2]]
# map
mp = u32(0x34); n = u32(mp); prev = -1
for i in range(n):
    t, _, c, o = struct.unpack_from('<HHII', d, mp + 4 + 12 * i); assert o > prev or i == 0; prev = o
print('map ok', n, 'items')
BODY = r'''
sf, p = uleb(p); inf, p = uleb(p); dm, p = uleb(p); vm, p = uleb(p)
fi = 0
for i in range(inf):
    x, p = uleb(p); fi += x; a, p = uleb(p); print(' field', fname(fi), hex(a))
OPS = {0x53: ('iget-wide', 2), 0x5a: ('iput-wide', 2), 0x9c: ('sub-long', 2), 0x31: ('cmp-long', 2), 0x16: ('const-wide/16', 2), 0x07: ('move-object', 1), 0x59: ('iput', 2), 0x83: ('int-to-double', 1), 0x8a: ('double-to-int', 1), 0xad: ('mul-double', 2), 0xae: ('div-double', 2), 0x2f: ('cmpl-double', 2), 0x3b: ('if-gez', 2), 0x3c: ('if-lez', 2), 0x76: ('invoke-direct/range', 3), 0x0b: ('move-result-wide', 1), 0x11: ('return-object', 1), 0x3a: ('if-ltz', 2), 0x35: ('if-ge', 2), 0x33: ('if-ne', 2), 0x82: ('int-to-float', 1), 0x21: ('array-length', 1), 0x23: ('new-array', 2), 0x46: ('aget-object', 2), 0x52: ('iget', 2), 0xd8: ('add-int/lit8', 2), 0x29: ('goto/16', 2), 0x72: ('invoke-interface', 3), 0x0e: ('return-void', 1), 0x0f: ('return', 1), 0x0d: ('move-exception', 1), 0x39: ('if-nez', 2), 0x71: ('invoke-static', 3), 0x0a: ('move-result', 1), 0x0c: ('move-result-object', 1), 0x12: ('const/4', 1), 0x13: ('const/16', 2), 0x14: ('const', 3),
       0x1a: ('const-string', 2), 0x22: ('new-instance', 2), 0x38: ('if-eqz', 2), 0x54: ('iget-object', 2), 0x5b: ('iput-object', 2), 0x62: ('sget-object', 2),
       0x6e: ('invoke-virtual', 3), 0x6f: ('invoke-super', 3), 0x70: ('invoke-direct', 3)}
for kind, cnt in (('direct', dm), ('virtual', vm)):
    mi = 0
    for i in range(cnt):
        x, p = uleb(p); mi += x; a, p = uleb(p); c, p = uleb(p)
        regs, ins, outs, tries, dbg, isz = struct.unpack_from('<HHHHII', d, c)
        assert c % 4 == 0
        print(f' {kind} {mname(mi)} access={hex(a)} regs={regs} ins={ins} outs={outs}')
        u = [u16(c + 16 + 2 * k) for k in range(isz)]; k = 0
        assert ins <= regs, 'ins > registers'
        while k < len(u):
            op = u[k] & 0xff; nm_, ln = OPS[op]; A = (u[k] >> 8) & 0xff
            if op in (0x6e, 0x6f, 0x70, 0x71, 0x72):
                n_ = u[k] >> 12; w = u[k + 2]; rr = [(w >> (4 * j)) & 0xf for j in range(4)][:n_] + ([(u[k] >> 8) & 0xf] if n_ == 5 else [])
                assert n_ <= outs, 'appel à %d arguments mais outs=%d' % (n_, outs)
                assert max(rr + [0]) < regs; arg = '{' + ','.join('v%d' % r for r in rr) + '} ' + mname(u[k + 1])
            elif op == 0x12: arg = 'v%d, %d' % (A & 0xf, A >> 4)
            elif op in (0x13, 0x16): arg = 'v%d, %d' % (A, u[k + 1])
            elif op == 0x14: arg = 'v%d, 0x%08x' % (A, u[k + 1] | (u[k + 2] << 16))
            elif op == 0x1a: arg = 'v%d, "%s"' % (A, S[u[k + 1]])
            elif op == 0x22: arg = 'v%d, %s' % (A, T[u[k + 1]])
            elif op == 0x76 and not (A <= outs and u[k + 2] + A <= regs): raise AssertionError('range: %d args, outs=%d' % (A, outs))
            elif op == 0x76: arg = '{v%d .. v%d} %s' % (u[k + 2], u[k + 2] + A - 1, mname(u[k + 1]))
            elif op in (0x07, 0x83, 0x8a, 0x82): arg = 'v%d, v%d' % (A & 0xf, A >> 4)
            elif op in (0xad, 0xae, 0x2f, 0x9c, 0x31): arg = 'v%d, v%d, v%d' % (A, u[k + 1] & 0xff, u[k + 1] >> 8)
            elif op in (0x38, 0x39, 0x3a, 0x3b, 0x3c): arg = 'v%d, -> %d' % (A, k + struct.unpack('<h', struct.pack('<H', u[k + 1]))[0])
            elif op in (0x35, 0x33): arg = 'v%d, v%d -> %d' % (A & 0xf, A >> 4, k + struct.unpack('<h', struct.pack('<H', u[k + 1]))[0])
            elif op == 0x29: arg = '-> %d' % (k + struct.unpack('<h', struct.pack('<H', u[k + 1]))[0])
            elif op == 0x21: arg = 'v%d, v%d' % (A & 0xf, A >> 4)
            elif op == 0x23: arg = 'v%d, v%d, %s' % (A & 0xf, A >> 4, T[u[k + 1]])
            elif op in (0x46, 0xd8): arg = 'v%d, v%d, %s%d' % (A, u[k + 1] & 0xff, '' if op == 0x46 else '#', u[k + 1] >> 8)
            elif op == 0x62: arg = 'v%d, %s' % (A, fname(u[k + 1]))
            elif op in (0x52, 0x54, 0x5b, 0x59, 0x53, 0x5a): arg = 'v%d, v%d, %s' % (A & 0xf, A >> 4, fname(u[k + 1]))
            else: arg = ('v%d' % A) if op in (0x0a, 0x0b, 0x0c, 0x0d, 0x0f, 0x11) else ''
            # registres utilisés < registers_size (paires « wide » comprises)
            used = []
            if op in (0x0a, 0x0c, 0x0d, 0x0f, 0x11, 0x1a, 0x22, 0x38, 0x39, 0x3a, 0x3b, 0x3c, 0x13, 0x14, 0x62): used = [A]
            elif op in (0x0b, 0x16): used = [A, A + 1]
            elif op in (0x53, 0x5a): used = [A & 0xf, (A & 0xf) + 1, A >> 4]
            elif op == 0x9c: used = [A, A + 1, u[k + 1] & 0xff, (u[k + 1] & 0xff) + 1, u[k + 1] >> 8, (u[k + 1] >> 8) + 1]
            elif op == 0x31: used = [A, u[k + 1] & 0xff, (u[k + 1] & 0xff) + 1, u[k + 1] >> 8, (u[k + 1] >> 8) + 1]
            elif op in (0x12, 0x21, 0x07, 0x23, 0x52, 0x54, 0x59, 0x5b, 0x35, 0x33, 0x82): used = [A & 0xf, A >> 4]
            elif op == 0x83: used = [A & 0xf, (A & 0xf) + 1, A >> 4]
            elif op == 0x8a: used = [A & 0xf, A >> 4, (A >> 4) + 1]
            elif op in (0xad, 0xae): used = [A, A + 1, u[k + 1] & 0xff, (u[k + 1] & 0xff) + 1, u[k + 1] >> 8, (u[k + 1] >> 8) + 1]
            elif op == 0x2f: used = [A, u[k + 1] & 0xff, (u[k + 1] & 0xff) + 1, u[k + 1] >> 8, (u[k + 1] >> 8) + 1]
            elif op in (0x46, 0xd8): used = [A, u[k + 1] & 0xff] + ([u[k + 1] >> 8] if op == 0x46 else [])
            assert all(x < regs for x in used), f'registre hors limite à {k}: {used} (regs={regs})'
            print(f'   {k:3d}: {nm_} {arg}'); k += ln
        assert k == len(u)
        if tries:
            q = c + 16 + 2 * isz + (2 if isz % 2 else 0)
            hl = q + 8 * tries
            for t_ in range(tries):
                st_, cnt_, ho_ = struct.unpack_from('<IHH', d, q + 8 * t_)
                sz_ = d[hl + ho_]; assert sz_ == 0
                addr_, _ = uleb(hl + ho_ + 1)
                print(f'   try {st_}..{st_+cnt_-1} catch-all -> {addr_}')
                assert st_ + cnt_ <= isz and addr_ < isz and (u[addr_] & 0xff) == 0x0d
'''
for ci in range(nc):
  cls, acc, sup, ifs, src, ann, cdo, sv = struct.unpack_from('<IIIIIIII', d, co + 32 * ci)
  print('class', T[cls], 'extends', T[sup], 'access', hex(acc), 'implements', [T[x] for x in tl(ifs)])
  if ann:
    assert ann % 4 == 0
    ca, nf_, nm_, np__ = struct.unpack_from('<IIII', d, ann)
    for j in range(nm_):
      mi_, so_ = struct.unpack_from('<II', d, ann + 16 + 8 * j)
      assert so_ % 4 == 0 and u32(so_) == 1
      ai = u32(so_ + 4); vis = d[ai]; ti, q = uleb(ai + 1); sz, q = uleb(q)
      assert vis == 1 and sz == 0
      print('  @' + T[ti], mname(mi_))
  p = cdo
  exec(BODY)
print('OK')
