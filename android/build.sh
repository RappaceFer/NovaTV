#!/usr/bin/env bash
# NovaTV — © 2026 Rappace — Logiciel libre sous licence MIT
# Construit NovaTV.apk sans SDK Android (Python 3, Java pour keytool/jarsigner).
#
# Variables :
#   NOVATV_VENDOR_APK  APK contenant LibVLC (classes*.dex + lib/<abi>/libvlc*.so)  [obligatoire]
#   NOVATV_KEYSTORE    keystore de signature (créé s'il n'existe pas)              [défaut : ./novatv.jks]
#   NOVATV_KS_PASS     mot de passe du keystore                                    [obligatoire]
#   NOVATV_VERSION     ex. 1.0   ;   NOVATV_CODE   ex. 100
#   NOVATV_TARGET      34 (défaut)
#   NOVATV_ALIAS       alias de la clé dans le keystore                      [défaut : novatv]
set -euo pipefail
cd "$(dirname "$0")"
: "${NOVATV_VENDOR_APK:?indiquez le chemin de l APK fournissant LibVLC}"
: "${NOVATV_KS_PASS:?indiquez le mot de passe du keystore}"
KS="${NOVATV_KEYSTORE:-novatv.jks}"; ALIAS="${NOVATV_ALIAS:-novatv}"; VER="${NOVATV_VERSION:-2.0.1}"; CODE="${NOVATV_CODE:-201}"; TARGET="${NOVATV_TARGET:-34}"; SUFFIX="${NOVATV_SUFFIX:-}"
mkdir -p out
python3 dex.py classes.dex >/dev/null && python3 dexcheck.py classes.dex >/dev/null
python3 res.py "$CODE" "$VER" "$TARGET"
python3 pack.py out/unsigned.apk ../app "$NOVATV_VENDOR_APK"
[ -f "$KS" ] || keytool -genkeypair -storetype PKCS12 -keystore "$KS" -storepass "$NOVATV_KS_PASS" -keypass "$NOVATV_KS_PASS" -alias "$ALIAS" -keyalg RSA -keysize 2048 -validity 12000 -dname "CN=NovaTV, O=NovaTV, C=FR"
cp out/unsigned.apk out/tmp.apk
jarsigner -keystore "$KS" -storepass "$NOVATV_KS_PASS" -sigalg SHA256withRSA -digestalg SHA-256 out/tmp.apk "$ALIAS" >/dev/null
python3 align4.py out/tmp.apk out/aligned.apk
python3 apksign.py sign out/aligned.apk "out/NovaTV-v$VER$SUFFIX.apk" "$KS" "$NOVATV_KS_PASS"   # signature v2 (obligatoire pour Android 11+)
rm -f out/tmp.apk out/aligned.apk out/unsigned.apk classes.dex AndroidManifest.xml resources.arsc
jarsigner -verify "out/NovaTV-v$VER$SUFFIX.apk" | grep -q "jar verified" && python3 apksign.py verify "out/NovaTV-v$VER$SUFFIX.apk" && echo "OK : android/out/NovaTV-v$VER$SUFFIX.apk"
