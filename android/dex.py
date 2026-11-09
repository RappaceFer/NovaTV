# NovaTV — © 2026 Rappace — Logiciel libre sous licence MIT — https://github.com/RappaceFer/NovaTV
"""Générateur de classes.dex (format 035) pour la coque NovaTV 4.2.

Classes :
  MainActivity : plein écran ; interface WebView + calque lecteur natif (vidéo LibVLC, sous-titres,
                 image des commandes) qui passe devant l'interface pendant la lecture
  Front, Osd   : petites tâches exécutées sur le fil principal (calque devant / image des commandes)
  Client       : WebViewClient — liens « intent: », page locale https pour les
                 bandes-annonces, blocage des serveurs publicitaires
  Bridge       : interface JavaScript « NV » pilotant le lecteur LibVLC
"""
import struct, zlib, hashlib

def uleb(n):
    out = bytearray()
    while True:
        b = n & 0x7f; n >>= 7
        if n: out.append(b | 0x80)
        else: out.append(b); return bytes(out)

# ---------- types ----------
CLS = 'Lcom/novatv/app/MainActivity;'
CLI = 'Lcom/novatv/app/Client;'
BRG = 'Lcom/novatv/app/Bridge;'
ACT = 'Landroid/app/Activity;'
WVC = 'Landroid/webkit/WebViewClient;'
WV = 'Landroid/webkit/WebView;'
WS = 'Landroid/webkit/WebSettings;'
WRR = 'Landroid/webkit/WebResourceResponse;'
JSI = 'Landroid/webkit/JavascriptInterface;'
WIN = 'Landroid/view/Window;'
CTX = 'Landroid/content/Context;'
INT = 'Landroid/content/Intent;'
TST = 'Landroid/widget/Toast;'
FL = 'Landroid/widget/FrameLayout;'
SV = 'Landroid/view/SurfaceView;'
SH = 'Landroid/view/SurfaceHolder;'
VIEW = 'Landroid/view/View;'
BUN = 'Landroid/os/Bundle;'
RES = 'Landroid/content/res/Resources;'
DM = 'Landroid/util/DisplayMetrics;'
AM = 'Landroid/content/res/AssetManager;'
URI = 'Landroid/net/Uri;'
STR = 'Ljava/lang/String;'
CS = 'Ljava/lang/CharSequence;'
OBJ = 'Ljava/lang/Object;'
SB = 'Ljava/lang/StringBuilder;'
LST = 'Ljava/util/List;'
AL = 'Ljava/util/ArrayList;'
IS = 'Ljava/io/InputStream;'
BAIS = 'Ljava/io/ByteArrayInputStream;'
BARR = '[B'
LIB = 'Lorg/videolan/libvlc/LibVLC;'
ILIB = 'Lorg/videolan/libvlc/interfaces/ILibVLC;'
MED = 'Lorg/videolan/libvlc/Media;'
IMED = 'Lorg/videolan/libvlc/interfaces/IMedia;'
MP = 'Lorg/videolan/libvlc/MediaPlayer;'
VOUT = 'Lorg/videolan/libvlc/interfaces/IVLCVout;'
TD = 'Lorg/videolan/libvlc/MediaPlayer$TrackDescription;'
TDA = '[Lorg/videolan/libvlc/MediaPlayer$TrackDescription;'
LSN = 'Lorg/videolan/libvlc/interfaces/IVLCVout$OnNewVideoLayoutListener;'
RUN = 'Ljava/lang/Runnable;'
VGLP = 'Landroid/view/ViewGroup$LayoutParams;'
FLLP = 'Landroid/widget/FrameLayout$LayoutParams;'
MATHC = 'Ljava/lang/Math;'
TXV = 'Landroid/view/TextureView;'
SP = 'Landroid/content/SharedPreferences;'
SPE = 'Landroid/content/SharedPreferences$Editor;'
UEH = 'Ljava/lang/Thread$UncaughtExceptionHandler;'
THR = 'Ljava/lang/Thread;'
THROW = 'Ljava/lang/Throwable;'
LOGC = 'Landroid/util/Log;'
CRH = 'Lcom/novatv/app/Crash;'
STATS = 'Lorg/videolan/libvlc/interfaces/IMedia$Stats;'
VTRK = 'Lorg/videolan/libvlc/interfaces/IMedia$VideoTrack;'
TRK = 'Lorg/videolan/libvlc/interfaces/IMedia$Track;'
PM = 'Landroid/content/pm/PackageManager;'
IMG = 'Landroid/widget/ImageView;'
SCT = 'Landroid/widget/ImageView$ScaleType;'
BMP = 'Landroid/graphics/Bitmap;'
BMF = 'Landroid/graphics/BitmapFactory;'
B64 = 'Landroid/util/Base64;'
FRT = 'Lcom/novatv/app/Front;'
OSD = 'Lcom/novatv/app/Osd;'
CNV = 'Landroid/graphics/Canvas;'
PNT = 'Landroid/graphics/Paint;'
BMC = 'Landroid/graphics/Bitmap$Config;'
PDX = 'Landroid/graphics/PorterDuffXfermode;'
PDM = 'Landroid/graphics/PorterDuff$Mode;'
XFM = 'Landroid/graphics/Xfermode;'

URL = 'file:///android_asset/index.html'
PFX = 'intent:'
ASSET = 'https://appassets.androidplatform.net/'
MISSING = 'Application introuvable : installez-la depuis le store'
ADS = ['doubleclick.net', 'googlesyndication.com', 'googleadservices.com', 'google-analytics.com', 'googletagservices.com',
       'imasdk.googleapis.com', 'adservice.google', '/pagead/', '/api/stats/ads', '/ptracking', '/get_midroll_', 'youtube.com/generate_204']

def shorty(ret, params):
    s = lambda t: 'L' if t[0] in 'L[' else t
    return s(ret) + ''.join(s(p) for p in params)

M = {
 'act_init': (ACT, '<init>', 'V', ()), 'act_onCreate': (ACT, 'onCreate', 'V', (BUN,)),
 'act_onBack': (ACT, 'onBackPressed', 'V', ()), 'act_onPause': (ACT, 'onPause', 'V', ()), 'act_onResume': (ACT, 'onResume', 'V', ()),
 'act_getWindow': (ACT, 'getWindow', WIN, ()), 'act_setContent': (ACT, 'setContentView', 'V', (VIEW,)),
 'act_getRes': (ACT, 'getResources', RES, ()),
 'res_dm': (RES, 'getDisplayMetrics', DM, ()),
 'win_addFlags': (WIN, 'addFlags', 'V', ('I',)),
 'wv_init': (WV, '<init>', 'V', (CTX,)), 'wv_getSettings': (WV, 'getSettings', WS, ()),
 'wv_setBg': (WV, 'setBackgroundColor', 'V', ('I',)), 'wv_loadUrl': (WV, 'loadUrl', 'V', (STR,)),
 'wv_canGoBack': (WV, 'canGoBack', 'Z', ()), 'wv_goBack': (WV, 'goBack', 'V', ()),
 'wv_onPause': (WV, 'onPause', 'V', ()), 'wv_onResume': (WV, 'onResume', 'V', ()),
 'wv_requestFocus': (WV, 'requestFocus', 'Z', ()), 'wv_setClient': (WV, 'setWebViewClient', 'V', (WVC,)),
 'wv_getContext': (WV, 'getContext', CTX, ()), 'wv_addJs': (WV, 'addJavascriptInterface', 'V', (OBJ, STR)),
 'ws_js': (WS, 'setJavaScriptEnabled', 'V', ('Z',)), 'ws_dom': (WS, 'setDomStorageEnabled', 'V', ('Z',)),
 'ws_univ': (WS, 'setAllowUniversalAccessFromFileURLs', 'V', ('Z',)),
 'ws_file': (WS, 'setAllowFileAccess', 'V', ('Z',)), 'ws_ffile': (WS, 'setAllowFileAccessFromFileURLs', 'V', ('Z',)),
 'ws_gesture': (WS, 'setMediaPlaybackRequiresUserGesture', 'V', ('Z',)), 'ws_zoom': (WS, 'setTextZoom', 'V', ('I',)),
 'wvc_init': (WVC, '<init>', 'V', ()),
 'wrr_init': (WRR, '<init>', 'V', (STR, STR, IS)),
 'str_starts': (STR, 'startsWith', 'Z', (STR,)), 'str_len': (STR, 'length', 'I', ()),
 'str_sub1': (STR, 'substring', STR, ('I',)), 'str_sub2': (STR, 'substring', STR, ('I', 'I')),
 'str_idx': (STR, 'indexOf', 'I', ('I',)), 'str_contains': (STR, 'contains', 'Z', (CS,)),
 'int_parse': (INT, 'parseUri', INT, (STR, 'I')), 'ctx_start': (CTX, 'startActivity', 'V', (INT,)),
 'ctx_assets': (CTX, 'getAssets', AM, ()), 'am_open': (AM, 'open', IS, (STR,)),
 'bais_init': (BAIS, '<init>', 'V', (BARR,)),
 'tst_make': (TST, 'makeText', TST, (CTX, CS, 'I')), 'tst_show': (TST, 'show', 'V', ()),
 'fl_init': (FL, '<init>', 'V', (CTX,)), 'fl_add': (FL, 'addView', 'V', (VIEW,)),
 'sv_init': (SV, '<init>', 'V', (CTX,)), 'sv_zmedia': (SV, 'setZOrderMediaOverlay', 'V', ('Z',)),
 'sv_holder': (SV, 'getHolder', SH, ()), 'sh_format': (SH, 'setFormat', 'V', ('I',)),
 'al_init': (AL, '<init>', 'V', ()), 'al_add': (AL, 'add', 'Z', (OBJ,)),
 'obj_init': (OBJ, '<init>', 'V', ()),
 'sb_init': (SB, '<init>', 'V', ()), 'sb_J': (SB, 'append', SB, ('J',)), 'sb_I': (SB, 'append', SB, ('I',)),
 'sb_C': (SB, 'append', SB, ('C',)), 'sb_S': (SB, 'append', SB, (STR,)), 'sb_str': (SB, 'toString', STR, ()),
 'uri_parse': (URI, 'parse', URI, (STR,)),
 'lib_init': (LIB, '<init>', 'V', (CTX, LST)),
 'med_init': (MED, '<init>', 'V', (ILIB, URI)), 'med_hw': (MED, 'setHWDecoderEnabled', 'V', ('Z', 'Z')),
 'med_opt': (MED, 'addOption', 'V', (STR,)), 'med_rel': (MED, 'release', 'V', ()),
 'mp_init': (MP, '<init>', 'V', (ILIB,)), 'mp_vout': (MP, 'getVLCVout', VOUT, ()),
 'mp_setMedia': (MP, 'setMedia', 'V', (IMED,)), 'mp_play': (MP, 'play', 'V', ()), 'mp_pause': (MP, 'pause', 'V', ()),
 'mp_stop': (MP, 'stop', 'V', ()), 'mp_setTime': (MP, 'setTime', 'J', ('J',)),
 'mp_time': (MP, 'getTime', 'J', ()), 'mp_len': (MP, 'getLength', 'J', ()), 'mp_state': (MP, 'getPlayerState', 'I', ()),
 'mp_aT': (MP, 'getAudioTrack', 'I', ()), 'mp_sT': (MP, 'getSpuTrack', 'I', ()),
 'mp_aTs': (MP, 'getAudioTracks', TDA, ()), 'mp_sTs': (MP, 'getSpuTracks', TDA, ()),
 'mp_setA': (MP, 'setAudioTrack', 'Z', ('I',)), 'mp_setS': (MP, 'setSpuTrack', 'Z', ('I',)),
 'vo_view': (VOUT, 'setVideoView', 'V', (SV,)), 'vo_sub': (VOUT, 'setSubtitlesView', 'V', (SV,)),
 'vo_viewT': (VOUT, 'setVideoView', 'V', (TXV,)), 'vo_subT': (VOUT, 'setSubtitlesView', 'V', (TXV,)),
 'tv_init': (TXV, '<init>', 'V', (CTX,)), 'tv_opaque': (TXV, 'setOpaque', 'V', ('Z',)),
 'act_pm': (ACT, 'getPackageManager', PM, ()),
 'act_prefs': (ACT, 'getSharedPreferences', SP, (STR, 'I')),
 'sp_getInt': (SP, 'getInt', 'I', (STR, 'I')), 'sp_getStr': (SP, 'getString', STR, (STR, STR)), 'sp_edit': (SP, 'edit', SPE, ()),
 'spe_putInt': (SPE, 'putInt', SPE, (STR, 'I')), 'spe_putStr': (SPE, 'putString', SPE, (STR, STR)),
 'spe_rm': (SPE, 'remove', SPE, (STR,)), 'spe_commit': (SPE, 'commit', 'Z', ()),
 'thr_getDef': (THR, 'getDefaultUncaughtExceptionHandler', UEH, ()), 'thr_setDef': (THR, 'setDefaultUncaughtExceptionHandler', 'V', (UEH,)),
 'ueh_call': (UEH, 'uncaughtException', 'V', (THR, THROW)), 'log_trace': (LOGC, 'getStackTraceString', STR, (THROW,)),
 'crh_init': (CRH, '<init>', 'V', (SP, UEH)), 'crh_call': (CRH, 'uncaughtException', 'V', (THR, THROW)),
 'br_setMode': (BRG, 'setVideoMode', 'V', ('I',)), 'br_stats': (BRG, 'stats', STR, ()), 'br_vinfo': (BRG, 'videoInfo', STR, ()),
 'mp_getMedia': (MP, 'getMedia', IMED, ()), 'imed_stats': (IMED, 'getStats', STATS, ()), 'imed_rel': (IMED, 'release', 'V', ()),
 'mp_curVT': (MP, 'getCurrentVideoTrack', VTRK, ()), 'br_activeMode': (BRG, 'activeMode', 'I', ()), 'br_crash': (BRG, 'crash', STR, ()), 'pm_feat': (PM, 'hasSystemFeature', 'Z', (STR,)),
 'vo_size': (VOUT, 'setWindowSize', 'V', ('I', 'I')), 'vo_attach': (VOUT, 'attachViews', 'V', ()),
 # nos classes
 'my_init': (CLS, '<init>', 'V', ()), 'my_onCreate': (CLS, 'onCreate', 'V', (BUN,)),
 'my_onBack': (CLS, 'onBackPressed', 'V', ()), 'my_onPause': (CLS, 'onPause', 'V', ()), 'my_onResume': (CLS, 'onResume', 'V', ()),
 'cli_init': (CLI, '<init>', 'V', ()), 'cli_override': (CLI, 'shouldOverrideUrlLoading', 'Z', (WV, STR)),
 'cli_intercept': (CLI, 'shouldInterceptRequest', WRR, (WV, STR)),
 'br_init': (BRG, '<init>', 'V', (LIB, MP, VOUT, FL, VIEW, VIEW)),
 'br_run': (BRG, 'run', 'V', ()), 'br_layout': (BRG, 'onNewVideoLayout', 'V', (VOUT, 'I', 'I', 'I', 'I', 'I', 'I')),
 'view_w': (VIEW, 'getWidth', 'I', ()), 'view_h': (VIEW, 'getHeight', 'I', ()), 'view_post': (VIEW, 'post', 'Z', (RUN,)),
 'view_glp': (VIEW, 'getLayoutParams', VGLP, ()), 'view_slp': (VIEW, 'setLayoutParams', 'V', (VGLP,)),
 'fllp_init': (FLLP, '<init>', 'V', ('I', 'I', 'I')), 'fl_add2': (FL, 'addView', 'V', (VIEW, VGLP)),
 'vo_attachL': (VOUT, 'attachViews', 'V', (LSN,)),
 'clk': ('Landroid/os/SystemClock;', 'uptimeMillis', 'J', ()),
 'br_play': (BRG, 'play', 'V', (STR, STR, STR, STR, STR, STR)), 'br_pause': (BRG, 'pause', 'V', ()),
 'br_resume': (BRG, 'resume', 'V', ()), 'br_stop': (BRG, 'stop', 'V', ()), 'br_seek': (BRG, 'seek', 'V', ('J',)),
 'br_size': (BRG, 'size', 'V', ('I', 'I')), 'br_state': (BRG, 'state', STR, ()), 'br_tracks': (BRG, 'tracks', STR, ('I',)),
 'br_setA': (BRG, 'setAudio', 'V', ('I',)), 'br_setS': (BRG, 'setSpu', 'V', ('I',)),
 'br_front': (BRG, 'front', 'V', ('I',)), 'br_osd': (BRG, 'osd', 'V', (STR, 'I', 'I', 'I', 'I')),
 'img_init': (IMG, '<init>', 'V', (CTX,)), 'img_setBm': (IMG, 'setImageBitmap', 'V', (BMP,)), 'img_scale': (IMG, 'setScaleType', 'V', (SCT,)),
 'view_front': (VIEW, 'bringToFront', 'V', ()), 'view_bg': (VIEW, 'setBackgroundColor', 'V', ('I',)),
 'b64_dec': (B64, 'decode', BARR, (STR, 'I')), 'bmf_dec': (BMF, 'decodeByteArray', BMP, (BARR, 'I', 'I')),
 'frt_init': (FRT, '<init>', 'V', (VIEW,)), 'frt_run': (FRT, 'run', 'V', ()),
 'osd_init': (OSD, '<init>', 'V', (BRG, BMP, 'I', 'I', 'I', 'I')), 'osd_run': (OSD, 'run', 'V', ()),
 'bmp_create': (BMP, 'createBitmap', BMP, ('I', 'I', BMC)), 'bmp_w': (BMP, 'getWidth', 'I', ()), 'bmp_h': (BMP, 'getHeight', 'I', ()),
 'cv_init': (CNV, '<init>', 'V', (BMP,)), 'cv_drawBm': (CNV, 'drawBitmap', 'V', (BMP, 'F', 'F', PNT)),
 'paint_init': (PNT, '<init>', 'V', ()), 'paint_xfer': (PNT, 'setXfermode', XFM, (XFM,)), 'pdx_init': (PDX, '<init>', 'V', (PDM,)),
 'view_inval': (VIEW, 'invalidate', 'V', ()),
}
FLD = {'w': (CLS, WV, 'w'), 'lastBack': (CLS, 'J', 'lastBack'), 'my_prefs': (CLS, SP, 'prefs'),
       'st_dec': (STATS, 'I', 'decodedVideo'), 'st_disp': (STATS, 'I', 'displayedPictures'), 'st_lost': (STATS, 'I', 'lostPictures'),
       'vt_codec': (TRK, STR, 'codec'), 'vt_w': (VTRK, 'I', 'width'), 'vt_h': (VTRK, 'I', 'height'),
       'prefs': (BRG, SP, 'prefs'), 'amode': (BRG, 'I', 'amode'), 'cr_prefs': (CRH, SP, 'prefs'), 'cr_prev': (CRH, UEH, 'prev'), 'lib': (BRG, LIB, 'lib'), 'mp': (BRG, MP, 'mp'), 'vout': (BRG, VOUT, 'vout'),
       'td_id': (TD, 'I', 'id'), 'td_name': (TD, STR, 'name'),
       'dm_w': (DM, 'I', 'widthPixels'), 'dm_h': (DM, 'I', 'heightPixels'),
       'root': (BRG, FL, 'root'), 'sv': (BRG, VIEW, 'sv'), 'sub': (BRG, VIEW, 'sub'),
       'vw': (BRG, 'I', 'vw'), 'vh': (BRG, 'I', 'vh'), 'sn': (BRG, 'I', 'sn'), 'sd': (BRG, 'I', 'sd'),
       'lp_w': (VGLP, 'I', 'width'), 'lp_h': (VGLP, 'I', 'height'),
       'web': (BRG, VIEW, 'web'), 'layer': (BRG, VIEW, 'layer'), 'osdv': (BRG, IMG, 'osdv'),
       'fr_v': (FRT, VIEW, 'v'), 'os_bm': (OSD, BMP, 'bm'), 'os_b': (OSD, BRG, 'b'), 'os_x': (OSD, 'I', 'x'), 'os_y': (OSD, 'I', 'y'), 'os_w': (OSD, 'I', 'w'), 'os_h': (OSD, 'I', 'h'),
       'full': (BRG, BMP, 'full'), 'bmc_argb': (BMC, BMC, 'ARGB_8888'), 'pdm_src': (PDM, PDM, 'SRC'), 'sct_fit': (SCT, SCT, 'FIT_XY')}
IFACES = {BRG: [RUN, LSN], CRH: [UEH], FRT: [RUN], OSD: [RUN]}
CONSTS = ['android.software.leanback', 'nv', 'vm12', 'crash', URL, PFX, ASSET, MISSING, 'text/html', 'text/plain', 'utf-8', 'NV', '--no-video-title-show', '--http-reconnect', ''] + ADS

types = set([CLS, ACT, CLI, WVC, BRG, OBJ, JSI, BAIS, BARR, SB, AL, WRR, SV, FL, MED, RUN, LSN, FLLP, TXV, PM, CRH, UEH, STATS, VTRK, TRK, FRT, OSD])
for c, n, r, p in M.values(): types.add(c); types.add(r); types.update(p)
for c, t, n in FLD.values(): types.add(c); types.add(t)
strings = set(types) | set(CONSTS)
protos = set()
for c, n, r, p in M.values():
    strings.add(n); strings.add(shorty(r, p)); protos.add((r, p))
for c, t, n in FLD.values(): strings.add(n)
strings = sorted(strings)
assert all(s.isascii() for s in strings)
sidx = {s: i for i, s in enumerate(strings)}
types = sorted(types, key=lambda t: sidx[t])
tidx = {t: i for i, t in enumerate(types)}
protos = sorted(protos, key=lambda pr: (tidx[pr[0]], [tidx[x] for x in pr[1]]))
pidx = {pr: i for i, pr in enumerate(protos)}
fl = sorted(FLD.items(), key=lambda kv: (tidx[kv[1][0]], sidx[kv[1][2]], tidx[kv[1][1]]))
fidx = {k: i for i, (k, v) in enumerate(fl)}
ml = sorted(M.items(), key=lambda kv: (tidx[kv[1][0]], sidx[kv[1][1]], pidx[(kv[1][2], kv[1][3])]))
midx = {k: i for i, (k, v) in enumerate(ml)}

# ---------- assembleur avec étiquettes ----------
class Asm:
    def __init__(s): s.ins = []; s.labels = {}; s.pc = 0; s.tries = []; s.maxargs = 0
    def L(s, name): s.labels[name] = s.pc; return s
    def _e(s, size, fn): s.ins.append((s.pc, fn)); s.pc += size; return s
    def raw(s, *u): return s._e(len(u), lambda pc, lb: list(u))
    def inv(s, op, regs, m):
        a = len(regs); r = list(regs) + [0] * (5 - a); assert a <= 5 and max(regs + [0]) < 16
        s.maxargs = max(s.maxargs, a)
        return s.raw(op | (a << 12) | (r[4] << 8), midx[m], r[0] | (r[1] << 4) | (r[2] << 8) | (r[3] << 12))
    def vir(s, r, m): return s.inv(0x6e, r, m)
    def sup(s, r, m): return s.inv(0x6f, r, m)
    def dir(s, r, m): return s.inv(0x70, r, m)
    def sta(s, r, m): return s.inv(0x71, r, m)
    def itf(s, r, m): return s.inv(0x72, r, m)
    def mr(s, a): return s.raw(0x0a | (a << 8))
    def mrw(s, a): return s.raw(0x0b | (a << 8))
    def mro(s, a): return s.raw(0x0c | (a << 8))
    def mex(s, a): return s.raw(0x0d | (a << 8))
    def ret(s, a): return s.raw(0x0f | (a << 8))
    def reto(s, a): return s.raw(0x11 | (a << 8))
    def rv(s): return s.raw(0x0e)
    def c4(s, a, v): assert a < 16 and -8 <= v < 8; return s.raw(0x12 | (a << 8) | ((v & 0xf) << 12))
    def c16(s, a, v): return s.raw(0x13 | (a << 8), v & 0xffff)
    def c32(s, a, v): return s.raw(0x14 | (a << 8), v & 0xffff, (v >> 16) & 0xffff)
    def cs(s, a, st): return s.raw(0x1a | (a << 8), sidx[st])
    def new(s, a, t): return s.raw(0x22 | (a << 8), tidx[t])
    def newarr(s, a, b, t): return s.raw(0x23 | (a << 8) | (b << 12), tidx[t])
    def alen(s, a, b): return s.raw(0x21 | (a << 8) | (b << 12))
    def ageto(s, a, b, c): return s.raw(0x46 | (a << 8), b | (c << 8))
    def iget(s, a, b, f): return s.raw(0x52 | (a << 8) | (b << 12), fidx[f])
    def igeto(s, a, b, f): return s.raw(0x54 | (a << 8) | (b << 12), fidx[f])
    def iputo(s, a, b, f): return s.raw(0x5b | (a << 8) | (b << 12), fidx[f])
    def addl8(s, a, b, lit): return s.raw(0xd8 | (a << 8), b | ((lit & 0xff) << 8))
    def _br(s, op, a, lab, size=2):
        return s._e(size, lambda pc, lb: [op | (a << 8), (lb[lab] - pc) & 0xffff])
    def ifeqz(s, a, lab): return s._br(0x38, a, lab)
    def ifnez(s, a, lab): return s._br(0x39, a, lab)
    def ifltz(s, a, lab): return s._br(0x3a, a, lab)
    def igetw(s, a, b, f): return s.raw(0x53 | (a << 8) | (b << 12), fidx[f])
    def iputw(s, a, b, f): return s.raw(0x5a | (a << 8) | (b << 12), fidx[f])
    def subl(s, a, b, c): return s.raw(0x9c | (a << 8), b | (c << 8))
    def cmpl_(s, a, b, c): return s.raw(0x31 | (a << 8), b | (c << 8))
    def cw16(s, a, v): return s.raw(0x16 | (a << 8), v & 0xffff)
    def mvo(s, a, b): return s.raw(0x07 | (a << 8) | (b << 12))
    def iput(s, a, b, f): return s.raw(0x59 | (a << 8) | (b << 12), fidx[f])
    def sgeto(s, a, f): return s.raw(0x62 | (a << 8), fidx[f])
    def i2f(s, a, b): return s.raw(0x82 | (a << 8) | (b << 12))
    def i2d(s, a, b): return s.raw(0x83 | (a << 8) | (b << 12))
    def d2i(s, a, b): return s.raw(0x8a | (a << 8) | (b << 12))
    def muld(s, a, b, c): return s.raw(0xad | (a << 8), b | (c << 8))
    def divd(s, a, b, c): return s.raw(0xae | (a << 8), b | (c << 8))
    def cmpld(s, a, b, c): return s.raw(0x2f | (a << 8), b | (c << 8))
    def ifgez(s, a, lab): return s._br(0x3b, a, lab)
    def iflez(s, a, lab): return s._br(0x3c, a, lab)
    def dirr(s, first, n, m): s.maxargs = max(s.maxargs, n); return s.raw(0x76 | (n << 8), midx[m], first)
    def ifne(s, a, b, lab): return s._e(2, lambda pc, lb: [0x33 | (a << 8) | (b << 12), (lb[lab] - pc) & 0xffff])
    def ifge(s, a, b, lab): return s._e(2, lambda pc, lb: [0x35 | (a << 8) | (b << 12), (lb[lab] - pc) & 0xffff])
    def goto(s, lab): return s._e(2, lambda pc, lb: [0x29, (lb[lab] - pc) & 0xffff])
    def tryall(s, start, end, handler): s.tries.append((start, end, handler)); return s
    def code(s, regs, ins, outs):
        u = []
        for pc, fn in s.ins:
            assert len(u) == pc; u += fn(pc, s.labels)
        tr = [(s.labels[a], s.labels[b] - s.labels[a], s.labels[h]) for a, b, h in s.tries]
        # règle du vérificateur Android : outs_size >= nombre d'arguments de chaque appel
        assert ins <= regs
        return (regs, ins, max(outs, s.maxargs), u, tr)

def lifecycle(superm, wvm):
    a = Asm(); a.sup([1], superm).igeto(0, 1, 'w').ifeqz(0, 'r').vir([0], wvm).L('r').rv()
    return a.code(2, 1, 1)

# ---------- MainActivity ----------
a = Asm(); a.dir([0], 'act_init').rv(); c_init = a.code(1, 1, 1)
# onCreate : v0..v13 locaux, v14 = this, v15 = bundle
T, B = 14, 15
a = Asm()
a.sup([T, B], 'act_onCreate')
a.vir([T], 'act_getWindow').mro(10).c16(11, 0x80).vir([10, 11], 'win_addFlags')       # écran toujours allumé
a.new(9, FL).dir([9, T], 'fl_init')                                                     # v9 = racine
a.new(8, WV).dir([8, T], 'wv_init').iputo(8, T, 'w')                                    # v8 = WebView
a.vir([8], 'wv_getSettings').mro(10).c4(11, 1)
a.vir([10, 11], 'ws_js').vir([10, 11], 'ws_dom').vir([10, 11], 'ws_univ').vir([10, 11], 'ws_file').vir([10, 11], 'ws_ffile')   # explicite : Android 11+ les désactive par défaut
a.c4(11, 0).vir([10, 11], 'ws_gesture').c16(11, 100).vir([10, 11], 'ws_zoom')
a.c4(11, 0).vir([8, 11], 'wv_setBg')                                                    # WebView transparente
a.new(10, CLI).dir([10], 'cli_init').vir([8, 10], 'wv_setClient')
# préférences natives + rapport de plantage (affiché par l'interface au lancement suivant)
a.cs(10, 'nv').c4(11, 0).vir([T, 10, 11], 'act_prefs').mro(13).iputo(13, T, 'my_prefs')
a.sta([], 'thr_getDef').mro(11).new(12, CRH).dir([12, 13, 11], 'crh_init').sta([12], 'thr_setDef')
a.L('t0')
a.new(12, AL).dir([12], 'al_init')
a.cs(13, '--no-video-title-show').vir([12, 13], 'al_add')
a.cs(13, '--http-reconnect').vir([12, 13], 'al_add')
a.new(1, LIB).dir([1, T, 12], 'lib_init')                                               # v1 = LibVLC
a.new(2, MP).dir([2, 1], 'mp_init')                                                     # v2 = MediaPlayer
a.vir([2], 'mp_vout').mro(3)                                                            # v3 = IVLCVout
# Calque lecteur (fond noir) : vidéo + sous-titres centrés (Gravity.CENTER = 17) + image des commandes.
# Il est placé SOUS l'interface ; pendant la lecture, l'interface le fait passer DEVANT (NV.front(1)) :
# la vidéo n'est alors recouverte par aucune page web, seulement par l'image des commandes.
a.new(7, FL).dir([7, T], 'fl_init').c32(11, -16777216).vir([7, 11], 'view_bg')          # v7 = calque, noir opaque
a.new(5, SV).dir([5, T], 'sv_init')
a.new(10, FLLP).c4(11, -1).c16(12, 17).dir([10, 11, 11, 12], 'fllp_init').vir([7, 5, 10], 'fl_add2')
a.new(6, SV).dir([6, T], 'sv_init').c4(11, 1).vir([6, 11], 'sv_zmedia')
a.vir([6], 'sv_holder').mro(12).c4(11, -3).itf([12, 11], 'sh_format')                 # PixelFormat.TRANSLUCENT
a.new(10, FLLP).c4(11, -1).c16(12, 17).dir([10, 11, 11, 12], 'fllp_init').vir([7, 6, 10], 'fl_add2')
a.itf([3, 5], 'vo_view').itf([3, 6], 'vo_sub')
a.L('views')
a.vir([T], 'act_getRes').mro(10).vir([10], 'res_dm').mro(10).iget(11, 10, 'dm_w').iget(12, 10, 'dm_h')
a.itf([3, 11, 12], 'vo_size')
a.mvo(4, 9)
a.new(0, BRG).dirr(0, 7, 'br_init')                                                     # Bridge(lib, mp, vout, racine, vidéo, sous-titres)
a.igeto(13, T, 'my_prefs').iputo(13, 0, 'prefs').c4(13, 0).iput(13, 0, 'amode')
a.new(10, IMG).dir([10, T], 'img_init').sgeto(11, 'sct_fit').vir([10, 11], 'img_scale')  # image des commandes, plein écran
a.new(11, FLLP).c4(12, -1).c16(13, 17).dir([11, 12, 12, 13], 'fllp_init').vir([7, 10, 11], 'fl_add2')
a.iputo(10, 0, 'osdv').iputo(7, 0, 'layer').iputo(8, 0, 'web')
a.vir([9, 7], 'fl_add')                                                                 # calque d'abord, l'interface ensuite (devant)
a.itf([3, 0], 'vo_attachL')                                                             # VLC nous donne le format de chaque vidéo
a.cs(13, 'NV').vir([8, 0, 13], 'wv_addJs')
a.L('t1')
a.goto('go')
a.L('h').mex(10)                                                                        # LibVLC indisponible : lecteur HTML5
a.L('go')
a.vir([9, 8], 'fl_add').vir([T, 9], 'act_setContent')
a.vir([8], 'wv_requestFocus')
a.cs(10, URL).vir([8, 10], 'wv_loadUrl').rv()
a.tryall('t0', 't1', 'h')
c_create = a.code(16, 2, 4)

# onBackPressed : la télécommande Fire TV peut envoyer Retour deux fois ; un 2e appui à moins de 400 ms est ignoré
a = Asm()   # v0..v8 locaux, v9 this
a.sta([], 'clk').mrw(0).igetw(2, 9, 'lastBack').subl(4, 0, 2).cw16(6, 400).cmpl_(8, 4, 6).ifgez(8, 'ok').rv()
a.L('ok').iputw(0, 9, 'lastBack')
a.igeto(0, 9, 'w').ifeqz(0, 's').vir([0], 'wv_canGoBack').mr(0).ifeqz(0, 's')
a.igeto(0, 9, 'w').vir([0], 'wv_goBack').rv().L('s').sup([9], 'act_onBack').rv()
c_back = a.code(10, 1, 1)
c_pause = lifecycle('act_onPause', 'wv_onPause')
c_resume = lifecycle('act_onResume', 'wv_onResume')

# ---------- Client ----------
a = Asm(); a.dir([0], 'wvc_init').rv(); c_cinit = a.code(1, 1, 1)
a = Asm()   # shouldOverrideUrlLoading : v4 this, v5 view, v6 url
a.cs(0, PFX).vir([6, 0], 'str_starts').mr(0).ifnez(0, 'go').c4(0, 0).ret(0)
a.L('go').L('t0').c4(0, 1).sta([6, 0], 'int_parse').mro(0).vir([5], 'wv_getContext').mro(1).vir([1, 0], 'ctx_start').L('t1')
a.c4(0, 1).ret(0)
a.L('h').mex(0).vir([5], 'wv_getContext').mro(1).cs(2, MISSING).c4(3, 1).sta([1, 2, 3], 'tst_make').mro(1).vir([1], 'tst_show').c4(0, 1).ret(0)
a.tryall('t0', 't1', 'h')
c_over = a.code(7, 3, 3)
a = Asm()   # shouldInterceptRequest : v4 this, v5 view, v6 url
a.L('t0')
a.cs(0, ASSET).vir([6, 0], 'str_starts').mr(1).ifeqz(1, 'ads')
a.vir([0], 'str_len').mr(1).vir([6, 1], 'str_sub1').mro(2)
a.c16(1, 63).vir([2, 1], 'str_idx').mr(1).ifltz(1, 'nq').c4(3, 0).vir([2, 3, 1], 'str_sub2').mro(2)
a.L('nq').vir([5], 'wv_getContext').mro(3).vir([3], 'ctx_assets').mro(3).vir([3, 2], 'am_open').mro(3)
a.new(0, WRR).cs(1, 'text/html').cs(2, 'utf-8').dir([0, 1, 2, 3], 'wrr_init').reto(0)
a.L('ads')
for pat in ADS:
    a.cs(0, pat).vir([6, 0], 'str_contains').mr(1).ifnez(1, 'block')
a.c4(0, 0).reto(0)
a.L('block')
a.new(0, BAIS).c4(1, 0).newarr(1, 1, BARR).dir([0, 1], 'bais_init')
a.new(1, WRR).cs(2, 'text/plain').cs(3, 'utf-8').dir([1, 2, 3, 0], 'wrr_init').reto(1)
a.L('t1')
a.L('h').mex(0).c4(0, 0).reto(0)
a.tryall('t0', 't1', 'h')
c_intercept = a.code(7, 3, 4)

# ---------- Bridge (interface JavaScript « NV ») ----------
a = Asm()   # <init>(lib, mp, vout, root, sv, sub) : v0 this, v1..v6
a.dir([0], 'obj_init').iputo(1, 0, 'lib').iputo(2, 0, 'mp').iputo(3, 0, 'vout')
a.iputo(4, 0, 'root').iputo(5, 0, 'sv').iputo(6, 0, 'sub').rv()
c_binit = a.code(7, 7, 1)
# onNewVideoLayout(vout, largeur, hauteur, visible L, visible H, sarNum, sarDen) : v0 this, v1..v7
a = Asm()
a.iput(4, 0, 'vw').iput(5, 0, 'vh').iput(6, 0, 'sn').iput(7, 0, 'sd').vir([0], 'br_run').rv()
c_blayout = a.code(8, 8, 1)
# run() — sur le fil principal : adapte les surfaces au format de la vidéo (« ajuster à l'écran »)
def b_run(a):   # v0..v12 locaux, v13 this
    a.igeto(0, 13, 'root').vir([0], 'view_w').mr(1).vir([0], 'view_h').mr(2)
    a.iflez(1, 'r').iflez(2, 'r')
    a.igeto(0, 13, 'vout').itf([0, 1, 2], 'vo_size')
    a.iget(3, 13, 'vw').iflez(3, 'r').iget(4, 13, 'vh').iflez(4, 'r')
    a.i2d(5, 1).i2d(7, 2)                       # v5:v6 = largeur écran, v7:v8 = hauteur écran
    a.i2d(9, 3).i2d(11, 4).divd(9, 9, 11)       # v9:v10 = format de la vidéo
    a.iget(3, 13, 'sn').iget(4, 13, 'sd').iflez(3, 'nosar').iflez(4, 'nosar')
    a.i2d(11, 3).muld(9, 9, 11).i2d(11, 4).divd(9, 9, 11)
    a.L('nosar')
    a.divd(11, 5, 7).cmpld(3, 11, 9).ifgez(3, 'wide')
    a.divd(7, 5, 9).goto('set')                 # écran plus étroit que la vidéo : bandes en haut et en bas
    a.L('wide').muld(5, 7, 9)                   # écran plus large : bandes sur les côtés
    a.L('set').d2i(3, 5).d2i(4, 7)
    for f in ('sv', 'sub'):
        a.igeto(0, 13, f).vir([0], 'view_glp').mro(1).iput(3, 1, 'lp_w').iput(4, 1, 'lp_h').vir([0, 1], 'view_slp')
    a.L('r').rv()


def guarded(body, regs, ins, outs, ret_obj=False):
    a = Asm(); a.L('t0'); body(a); a.L('t1')
    a.L('h').mex(0)
    if ret_obj: a.cs(0, '').reto(0)
    else: a.rv()
    a.tryall('t0', 't1', 'h')
    return a.code(regs, ins, outs)

def b_play(a):   # v0..v3 locaux ; v4 this ; v5 url ; v6..v9 options
    a.igeto(0, 4, 'lib').sta([5], 'uri_parse').mro(1)
    a.new(2, MED).dir([2, 0, 1], 'med_init')
    a.c4(0, 1).c4(1, 0).vir([2, 0, 1], 'med_hw')
    for r in (6, 7, 8, 9, 10): a.vir([2, r], 'med_opt')   # la 5e option peut forcer le décodage logiciel
    a.igeto(0, 4, 'mp').vir([0, 2], 'mp_setMedia').vir([2], 'med_rel').vir([0], 'mp_play').rv()
c_bplay = guarded(b_play, 11, 7, 3)
def b_stats(a):  # « images décodées;images affichées;images perdues » ; v4 this
    a.cs(3, '').igeto(0, 4, 'mp').vir([0], 'mp_getMedia').mro(1).ifeqz(1, 'none')
    a.itf([1], 'imed_stats').mro(2).itf([1], 'imed_rel').ifeqz(2, 'none')
    a.new(0, SB).dir([0], 'sb_init')
    a.iget(3, 2, 'st_dec').vir([0, 3], 'sb_I').c16(3, 59).vir([0, 3], 'sb_C')
    a.iget(3, 2, 'st_disp').vir([0, 3], 'sb_I').c16(3, 59).vir([0, 3], 'sb_C')
    a.iget(3, 2, 'st_lost').vir([0, 3], 'sb_I')
    a.vir([0], 'sb_str').mro(3)
    a.L('none').reto(3)
c_bstats = guarded(b_stats, 5, 1, 2, True)
def b_vinfo(a):  # « codec;largeur;hauteur » de la vidéo en cours ; v4 this
    a.cs(3, '').igeto(0, 4, 'mp').vir([0], 'mp_curVT').mro(1).ifeqz(1, 'none')
    a.new(0, SB).dir([0], 'sb_init')
    a.igeto(2, 1, 'vt_codec').vir([0, 2], 'sb_S').c16(3, 59).vir([0, 3], 'sb_C')
    a.iget(3, 1, 'vt_w').vir([0, 3], 'sb_I').c16(3, 59).vir([0, 3], 'sb_C')
    a.iget(3, 1, 'vt_h').vir([0, 3], 'sb_I')
    a.vir([0], 'sb_str').mro(3)
    a.L('none').reto(3)
c_bvinfo = guarded(b_vinfo, 5, 1, 2, True)
def b_front(a):   # v2 this, v3 : 1 = calque lecteur devant, 0 = interface devant
    a.igeto(0, 2, 'web').ifeqz(3, 'p').igeto(0, 2, 'layer')
    a.L('p').new(1, FRT).dir([1, 0], 'frt_init').igeto(0, 2, 'root').vir([0, 1], 'view_post').rv()
c_bfront = guarded(b_front, 4, 2, 2)
def b_osd(a):     # v4 this, v5 morceau PNG en base64 ('' = plus rien), v6 x, v7 y, v8 largeur, v9 hauteur de l'image entière
    # la page n'envoie que la partie qui a changé (bouton en surbrillance, temps…) : petit, donc décodé tout de suite, dans l'ordre
    a.c4(1, 0).vir([5], 'str_len').mr(0).ifeqz(0, 'set')
    a.c4(0, 0).sta([5, 0], 'b64_dec').mro(0)
    a.alen(2, 0).c4(3, 0).sta([0, 3, 2], 'bmf_dec').mro(1)
    a.L('set').mvo(5, 1).new(3, OSD).dirr(3, 7, 'osd_init')
    a.igeto(0, 4, 'root').vir([0, 3], 'view_post').rv()
c_bosd = guarded(b_osd, 10, 6, 7)
# Front et Osd : exécutés sur le fil principal
a = Asm(); a.dir([0], 'obj_init').iputo(1, 0, 'fr_v').rv(); c_frinit = a.code(2, 2, 1)
a = Asm(); a.igeto(0, 1, 'fr_v').vir([0], 'view_front').rv(); c_frrun = a.code(2, 1, 1)
a = Asm(); a.dir([0], 'obj_init').iputo(1, 0, 'os_b').iputo(2, 0, 'os_bm').iput(3, 0, 'os_x').iput(4, 0, 'os_y').iput(5, 0, 'os_w').iput(6, 0, 'os_h').rv(); c_osinit = a.code(7, 7, 1)
def o_run(a):     # fil principal ; v8 this : colle le morceau dans l'image entière (gardée en mémoire) puis rafraîchit
    a.igeto(0, 8, 'os_bm').igeto(1, 8, 'os_b').igeto(2, 1, 'osdv').ifnez(0, 'draw')
    a.c4(3, 0).iputo(3, 1, 'full').vir([2, 3], 'img_setBm').rv()
    a.L('draw').igeto(3, 1, 'full').iget(4, 8, 'os_w').iget(5, 8, 'os_h').ifeqz(3, 'mk')
    a.vir([3], 'bmp_w').mr(6).ifne(6, 4, 'mk').vir([3], 'bmp_h').mr(6).ifne(6, 5, 'mk').goto('have')
    a.L('mk').sgeto(6, 'bmc_argb').sta([4, 5, 6], 'bmp_create').mro(3).iputo(3, 1, 'full').vir([2, 3], 'img_setBm')
    a.L('have').new(4, CNV).dir([4, 3], 'cv_init')
    a.new(5, PNT).dir([5], 'paint_init').sgeto(6, 'pdm_src').new(7, PDX).dir([7, 6], 'pdx_init').vir([5, 7], 'paint_xfer')
    a.iget(6, 8, 'os_x').i2f(6, 6).iget(7, 8, 'os_y').i2f(7, 7)
    a.vir([4, 0, 6, 7, 5], 'cv_drawBm')
    a.vir([2], 'view_inval').rv()
c_osrun = guarded(o_run, 9, 1, 5)
def simple(m):
    return guarded(lambda a: a.igeto(0, 1, 'mp').vir([0], m).rv(), 2, 1, 1)
c_bpause, c_bresume, c_bstop = simple('mp_pause'), simple('mp_play'), simple('mp_stop')
c_bseek = guarded(lambda a: a.igeto(0, 1, 'mp').vir([0, 2, 3], 'mp_setTime').rv(), 4, 3, 3)       # v1 this, v2:v3 ms
c_bsize = guarded(lambda a: a.igeto(0, 1, 'root').vir([0, 1], 'view_post').rv(), 4, 3, 2)   # relance run() sur le fil principal
c_brun = guarded(b_run, 14, 1, 3)
c_bsetA = guarded(lambda a: a.igeto(0, 1, 'mp').vir([0, 2], 'mp_setA').rv(), 3, 2, 2)
c_bsetS = guarded(lambda a: a.igeto(0, 1, 'mp').vir([0, 2], 'mp_setS').rv(), 3, 2, 2)
def b_state(a):  # « temps;durée;état;piste audio;piste sous-titres » ; v5 this
    a.new(0, SB).dir([0], 'sb_init').igeto(1, 5, 'mp')
    a.vir([1], 'mp_time').mrw(2).vir([0, 2, 3], 'sb_J').c16(2, 59).vir([0, 2], 'sb_C')
    a.vir([1], 'mp_len').mrw(2).vir([0, 2, 3], 'sb_J').c16(2, 59).vir([0, 2], 'sb_C')
    a.vir([1], 'mp_state').mr(2).vir([0, 2], 'sb_I').c16(2, 59).vir([0, 2], 'sb_C')
    a.vir([1], 'mp_aT').mr(2).vir([0, 2], 'sb_I').c16(2, 59).vir([0, 2], 'sb_C')
    a.vir([1], 'mp_sT').mr(2).vir([0, 2], 'sb_I')
    a.vir([0], 'sb_str').mro(0).reto(0)
c_bstate = guarded(b_state, 6, 1, 3, True)
def b_tracks(a):  # « id<TAB>nom<LF>… » ; v7 this ; v8 type (0 audio, 1 sous-titres)
    a.igeto(0, 7, 'mp').ifnez(8, 'spu').vir([0], 'mp_aTs').mro(1).goto('have')
    a.L('spu').vir([0], 'mp_sTs').mro(1)
    a.L('have').new(2, SB).dir([2], 'sb_init').ifeqz(1, 'done')
    a.alen(3, 1).c4(4, 0)
    a.L('loop').ifge(4, 3, 'done').ageto(5, 1, 4)
    a.iget(6, 5, 'td_id').vir([2, 6], 'sb_I').c16(6, 9).vir([2, 6], 'sb_C')
    a.igeto(6, 5, 'td_name').vir([2, 6], 'sb_S').c16(6, 10).vir([2, 6], 'sb_C')
    a.addl8(4, 4, 1).goto('loop')
    a.L('done').vir([2], 'sb_str').mro(0).reto(0)
c_btracks = guarded(b_tracks, 9, 2, 3, True)
def b_setmode(a):   # v3 this, v4 mode
    a.igeto(0, 3, 'prefs').itf([0], 'sp_edit').mro(0).cs(1, 'vm12').itf([0, 1, 4], 'spe_putInt').mro(0).itf([0], 'spe_commit').rv()
c_bsetmode = guarded(b_setmode, 5, 2, 3)
a = Asm(); a.iget(0, 1, 'amode').ret(0); c_bamode = a.code(2, 1, 0)
def b_crash(a):     # v3 this : renvoie puis efface le dernier rapport de plantage
    a.igeto(0, 3, 'prefs').cs(1, 'crash').cs(2, '').itf([0, 1, 2], 'sp_getStr').mro(1)
    a.itf([0], 'sp_edit').mro(0).cs(2, 'crash').itf([0, 2], 'spe_rm').mro(0).itf([0], 'spe_commit').reto(1)
c_bcrash = guarded(b_crash, 4, 1, 3, True)
# Crash : enregistre la trace de l'erreur et remet l'affichage standard, puis laisse Android fermer l'app
a = Asm(); a.dir([0], 'obj_init').iputo(1, 0, 'cr_prefs').iputo(2, 0, 'cr_prev').rv(); c_crinit = a.code(3, 3, 1)
a = Asm()   # v0..v3 locaux, v4 this, v5 thread, v6 exception
a.L('t0').sta([6], 'log_trace').mro(0).igeto(1, 4, 'cr_prefs').itf([1], 'sp_edit').mro(1)
a.cs(2, 'crash').itf([1, 2, 0], 'spe_putStr').mro(1).cs(2, 'vm12').c4(3, 0).itf([1, 2, 3], 'spe_putInt').mro(1).itf([1], 'spe_commit').L('t1')
a.goto('call')
a.L('h').mex(0)
a.L('call').igeto(0, 4, 'cr_prev').ifeqz(0, 'r').itf([0, 5, 6], 'ueh_call').L('r').rv()
a.tryall('t0', 't1', 'h')
c_crcall = a.code(7, 3, 3)

CLASSES = [
    (CLS, ACT, [('w', 0x2), ('lastBack', 0x2), ('my_prefs', 0x2)], [('my_init', 0x10001, c_init)],
     [('my_onBack', 0x1, c_back), ('my_onCreate', 0x4, c_create), ('my_onPause', 0x4, c_pause), ('my_onResume', 0x4, c_resume)], []),
    (CLI, WVC, [], [('cli_init', 0x10001, c_cinit)], [('cli_override', 0x1, c_over), ('cli_intercept', 0x1, c_intercept)], []),
    (BRG, OBJ, [('lib', 0x12), ('mp', 0x12), ('vout', 0x12), ('root', 0x12), ('sv', 0x12), ('sub', 0x12), ('vw', 0x2), ('vh', 0x2), ('sn', 0x2), ('sd', 0x2), ('prefs', 0x1), ('amode', 0x1),
                ('web', 0x1), ('layer', 0x1), ('osdv', 0x1), ('full', 0x1)],
     [('br_init', 0x10001, c_binit)],
     [('br_run', 0x1, c_brun), ('br_layout', 0x1, c_blayout), ('br_play', 0x1, c_bplay), ('br_pause', 0x1, c_bpause), ('br_resume', 0x1, c_bresume), ('br_stop', 0x1, c_bstop),
      ('br_seek', 0x1, c_bseek), ('br_size', 0x1, c_bsize), ('br_state', 0x1, c_bstate), ('br_tracks', 0x1, c_btracks),
      ('br_setA', 0x1, c_bsetA), ('br_setS', 0x1, c_bsetS), ('br_setMode', 0x1, c_bsetmode), ('br_activeMode', 0x1, c_bamode), ('br_crash', 0x1, c_bcrash), ('br_stats', 0x1, c_bstats), ('br_vinfo', 0x1, c_bvinfo),
      ('br_front', 0x1, c_bfront), ('br_osd', 0x1, c_bosd)],
     ['br_play', 'br_pause', 'br_resume', 'br_stop', 'br_seek', 'br_size', 'br_state', 'br_tracks', 'br_setA', 'br_setS', 'br_setMode', 'br_activeMode', 'br_crash', 'br_stats', 'br_vinfo', 'br_front', 'br_osd']),
    (CRH, OBJ, [('cr_prefs', 0x12), ('cr_prev', 0x12)], [('crh_init', 0x10001, c_crinit)], [('crh_call', 0x1, c_crcall)], []),
    (FRT, OBJ, [('fr_v', 0x12)], [('frt_init', 0x10001, c_frinit)], [('frt_run', 0x1, c_frrun)], []),
    (OSD, OBJ, [('os_b', 0x12), ('os_bm', 0x12), ('os_x', 0x12), ('os_y', 0x12), ('os_w', 0x12), ('os_h', 0x12)], [('osd_init', 0x10001, c_osinit)], [('osd_run', 0x1, c_osrun)], []),
]

def build():
    HDR = 0x70
    off = HDR
    sid_off = off; off += 4 * len(strings)
    tid_off = off; off += 4 * len(types)
    pid_off = off; off += 12 * len(protos)
    fid_off = off; off += 8 * len(fl)
    mid_off = off; off += 8 * len(ml)
    cdef_off = off; off += 32 * len(CLASSES)
    data_off = off
    data = bytearray()
    pos = lambda: data_off + len(data)
    def align4():
        while pos() % 4: data.append(0)
    code_offs = {}
    for cls in CLASSES:
        for name, acc, c in cls[3] + cls[4]:
            align4(); code_offs[name] = pos()
            regs, ins, outs, u, tries = c
            data += struct.pack('<HHHHII', regs, ins, outs, len(tries), 0, len(u))
            data += struct.pack('<%dH' % len(u), *u)
            if tries:
                if len(u) % 2: data += b'\0\0'
                handlers = bytearray(uleb(len(tries))); hoffs = []
                for st, cnt, addr in tries:
                    hoffs.append(len(handlers)); handlers += b'\x00' + uleb(addr)
                for (st, cnt, addr), ho in zip(tries, hoffs):
                    data += struct.pack('<IHH', st, cnt, ho)
                data += handlers
    code_start = min(code_offs.values())
    align4(); tl_start = pos(); tl_offs = {}
    for r, p in protos + [(None, tuple(v)) for v in IFACES.values()]:
        if p and p not in tl_offs:
            align4(); tl_offs[p] = pos()
            data += struct.pack('<I', len(p)) + b''.join(struct.pack('<H', tidx[t]) for t in p)
    # annotations : un seul @JavascriptInterface partagé
    sd_start = pos(); sd_offs = []
    for s in strings:
        sd_offs.append(pos()); data += uleb(len(s)) + s.encode('ascii') + b'\0'
    ann_item = pos(); data += b'\x01' + uleb(tidx[JSI]) + uleb(0)
    align4(); ann_set = pos(); data += struct.pack('<II', 1, ann_item)
    dir_offs = {}
    dir_start = None
    for i, cls in enumerate(CLASSES):
        if cls[5]:
            align4(); dir_offs[i] = pos(); dir_start = dir_start or pos()
            ms = sorted(midx[m] for m in cls[5])
            data += struct.pack('<IIII', 0, 0, len(ms), 0)
            for m in ms: data += struct.pack('<II', m, ann_set)
    cd_offs = []; cd_start = pos()
    for cname, sup_, fields, direct, virtual, _ in CLASSES:
        cd_offs.append(pos())
        virtual = sorted(virtual, key=lambda x: midx[x[0]])
        direct = sorted(direct, key=lambda x: midx[x[0]])
        fields = sorted(fields, key=lambda x: fidx[x[0]])
        cd = bytearray(uleb(0) + uleb(len(fields)) + uleb(len(direct)) + uleb(len(virtual)))
        prev = 0
        for fname, facc in fields: cd += uleb(fidx[fname] - prev) + uleb(facc); prev = fidx[fname]
        for group in (direct, virtual):
            prev = 0
            for name, acc, c in group: cd += uleb(midx[name] - prev) + uleb(acc) + uleb(code_offs[name]); prev = midx[name]
        data += cd
    align4(); map_off = pos()
    items = [
        (0x0000, 1, 0), (0x0001, len(strings), sid_off), (0x0002, len(types), tid_off),
        (0x0003, len(protos), pid_off), (0x0004, len(fl), fid_off), (0x0005, len(ml), mid_off),
        (0x0006, len(CLASSES), cdef_off), (0x2001, len(code_offs), code_start), (0x1001, len(tl_offs), tl_start),
        (0x2002, len(strings), sd_start), (0x2004, 1, ann_item), (0x1003, 1, ann_set),
        (0x2006, len(dir_offs), dir_start), (0x2000, len(CLASSES), cd_start), (0x1000, 1, map_off)]
    items.sort(key=lambda x: x[2])
    data += struct.pack('<I', len(items))
    for t, n, o in items: data += struct.pack('<HHII', t, 0, n, o)
    align4()
    total = pos()
    f = bytearray(total)
    struct.pack_into('<8s', f, 0, b'dex\n035\0')
    struct.pack_into('<IIIIII', f, 0x20, total, HDR, 0x12345678, 0, 0, map_off)
    struct.pack_into('<IIIIIIIIIIII', f, 0x38, len(strings), sid_off, len(types), tid_off, len(protos), pid_off,
                     len(fl), fid_off, len(ml), mid_off, len(CLASSES), cdef_off)
    struct.pack_into('<II', f, 0x68, len(data), data_off)
    for i, o in enumerate(sd_offs): struct.pack_into('<I', f, sid_off + 4 * i, o)
    for i, t in enumerate(types): struct.pack_into('<I', f, tid_off + 4 * i, sidx[t])
    for i, (r, p) in enumerate(protos):
        struct.pack_into('<III', f, pid_off + 12 * i, sidx[shorty(r, p)], tidx[r], tl_offs[p] if p else 0)
    for i, (k, (c, t, n)) in enumerate(fl): struct.pack_into('<HHI', f, fid_off + 8 * i, tidx[c], tidx[t], sidx[n])
    for i, (k, (c, n, r, p)) in enumerate(ml): struct.pack_into('<HHI', f, mid_off + 8 * i, tidx[c], pidx[(r, p)], sidx[n])
    NO = 0xffffffff
    for i, (cname, sup_, *_r) in enumerate(CLASSES):
        struct.pack_into('<IIIIIIII', f, cdef_off + 32 * i, tidx[cname], 0x1, tidx[sup_], tl_offs[tuple(IFACES[cname])] if cname in IFACES else 0, NO, dir_offs.get(i, 0), cd_offs[i], 0)
    f[data_off:] = data
    f[12:32] = hashlib.sha1(bytes(f[32:])).digest()
    struct.pack_into('<I', f, 8, zlib.adler32(bytes(f[12:])) & 0xffffffff)
    return bytes(f)

if __name__ == '__main__':
    import sys
    d = build()
    open(sys.argv[1], 'wb').write(d)
    print('dex', len(d), 'bytes;', len(strings), 'strings', len(types), 'types', len(protos), 'protos', len(ml), 'methods')
