#!/usr/bin/env python3
import json
import sys
import importlib

# --- CONFIG ENCODAGE UTF-8 ---
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# --- CHARGEMENT DYNAMIQUE DES PARSERS ---
def load_func(module_name, func_name):
    try:
        mod = importlib.import_module(module_name)
        return getattr(mod, func_name)
    except (ImportError, AttributeError):
        return None

# parser "véhicule" dans extractor.py
parse_vehicle = load_func('extractor', 'parse_invoice')
# parser "tyre" dans extractor2.py
parse_tyre    = load_func('extractor2',  'main')

# --- EXECUTION PRINCIPALE ---
if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: extractor_master.py <file.pdf>", file=sys.stderr)
        sys.exit(1)

    pdf_path = sys.argv[1]
    result = None

    # 1) Tentative avec le parser véhicule
    if parse_vehicle:
        try:
            result = parse_vehicle(pdf_path)
        except Exception:
            result = None

    # 2) Détection d’un résultat véhicule invalide → fallback pneu
    need_fallback = (
        result is None or
        not result.get("immatriculation") or
        result.get("immatriculation") in ("", "N/A") or
        not result.get("vehicule")
    )
    if need_fallback and parse_tyre:
        try:
            result = parse_tyre(pdf_path)
        except Exception:
            # si échec, on conserve result tel quel (None ou dict partiel)
            pass

    # 3) On s’assure d’avoir toujours un dict en sortie
    if not isinstance(result, dict):
        result = {}

    # 4) Impression du JSON final
    sys.stdout.write(json.dumps(result, ensure_ascii=False, indent=4))
