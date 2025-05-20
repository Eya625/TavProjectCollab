#!/usr/bin/env python3
import json
import sys
import os
from datetime import datetime

# Chemins
BASE_DIR     = os.path.dirname(os.path.abspath(__file__))
EXTRACTOR_PY = os.path.join(BASE_DIR, "extractor.py")
EXTRACTOR2_PY= os.path.join(BASE_DIR, "extractor2.py")

def load_func(path, name):
    if not os.path.exists(path):
        sys.stderr.write(f"[loader] Fichier non trouvé : {path}\n")
        return None
    import importlib.util
    spec = importlib.util.spec_from_file_location("", path)
    mod  = importlib.util.module_from_spec(spec)
    try:
        spec.loader.exec_module(mod)
        return getattr(mod, name)
    except Exception as e:
        sys.stderr.write(f"[loader] Erreur chargement {name} : {e}\n")
        return None

def to_iso(date_str):
    for fmt in ("%d-%b-%Y", "%d/%m/%Y"):
        try:
            return datetime.strptime(date_str, fmt).isoformat()
        except:
            pass
    return None

def main(pdf_path):
    sys.stderr.write(f"[master] Chemin reçu : {pdf_path}\n")
    if not os.path.exists(pdf_path):
        print(json.dumps({"success": False, "error": "Fichier PDF introuvable"}))
        sys.exit(1)

    parse_inv = load_func(EXTRACTOR_PY, "parse_invoice")
    parse_tyr = load_func(EXTRACTOR2_PY, "main")

    inv = {}
    if parse_inv:
        try:
            inv = parse_inv(pdf_path) or {}
        except Exception as e:
            sys.stderr.write(f"[master] Erreur parse_invoice : {e}\n")

    if not inv.get("immatriculation") and parse_tyr:
        try:
            inv.update(parse_tyr(pdf_path) or {})
        except Exception as e:
            sys.stderr.write(f"[master] Erreur parse_tyre : {e}\n")

    now_iso = datetime.utcnow().isoformat() + "Z"

    data = {
        "Ref":             inv.get("ref", ""),
        "Date":            now_iso,
        "Immatriculation": inv.get("immatriculation", ""),
        "Type":            inv.get("vehicule", ""),
        "Montant":         inv.get("total_ttc", 0),
        "statut":          "non payé"
    }

    print(json.dumps({"success": True, "data": data}, ensure_ascii=False, indent=4))

if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.stderr.write("Usage: extractor_master.py <file.pdf>\n")
        sys.exit(1)
    main(sys.argv[1])
