#!/usr/bin/env python3
import json
import sys
import os
from datetime import datetime

# Chemins
BASE_DIR      = os.path.dirname(os.path.abspath(__file__))
EXTRACTOR_PY  = os.path.join(BASE_DIR, "extractor.py")
EXTRACTOR2_PY = os.path.join(BASE_DIR, "extractor2.py")

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
    for fmt in ("%d-%b-%Y", "%d/%m/%Y", "%d-%m-%Y"):
        try:
            return datetime.strptime(date_str, fmt).isoformat() + 'Z'
        except:
            continue
    return None

def main(pdf_path):
    sys.stderr.write(f"[master] Chemin reçu : {pdf_path}\n")
    if not os.path.exists(pdf_path):
        print(json.dumps({
            "success": False,
            "error": "Fichier PDF introuvable"
        }, ensure_ascii=False))
        return

    # Charger les extracteurs
    parse_inv = load_func(EXTRACTOR_PY,  "parse_invoice")
    parse_tyr = load_func(EXTRACTOR2_PY, "main")

    inv = {}
    extractor_used = None

    # 1) Tentative avec extractor.py
    if parse_inv:
        try:
            result_inv = parse_inv(pdf_path) or {}
            # a) Nettoyage des "N/A"
            for field in ("Ref", "immatriculation", "total_ttc"):
                if isinstance(result_inv.get(field), str) and result_inv[field].strip().upper() == "N/A":
                    result_inv[field] = ""
            # b) Vérification stricte des trois champs
            has_ref   = bool((result_inv.get("Ref") or result_inv.get("ref")) and (result_inv.get("Ref") or result_inv.get("ref")).strip())
            has_immat = bool(result_inv.get("immatriculation") and result_inv["immatriculation"].strip())
            has_ttc   = bool(result_inv.get("total_ttc"))
            if has_ref and has_immat and has_ttc:
                inv = {
                    "ref":             (result_inv.get("Ref") or result_inv.get("ref")).strip(),
                    "immatriculation": result_inv["immatriculation"].strip(),
                    "total_ttc":       result_inv["total_ttc"],
                    "date":            result_inv.get("date") or result_inv.get("Date"),
                    "vehicule":        result_inv.get("vehicule") or result_inv.get("Type"),
                    "statut":          result_inv.get("statut")
                }
                extractor_used = os.path.basename(EXTRACTOR_PY)
        except Exception as e:
            sys.stderr.write(f"[master] Erreur parse_invoice : {e}\n")

    # 2) Fallback vers extractor2.py si nécessaire
    if not extractor_used and parse_tyr:
        try:
            result_tyr = parse_tyr(pdf_path) or {}
            # Nettoyage ds "N/A"
            for field in ("ref", "Ref", "immatriculation", "total_ttc", "Montant"):
                if isinstance(result_tyr.get(field), str) and result_tyr[field].strip().upper() == "N/A":
                    result_tyr[field] = ""
            # On accepte le fallback si on a au moins ref et montant
            raw_ref_t = (result_tyr.get("ref") or result_tyr.get("Ref") or "").strip()
            raw_ttc_t = result_tyr.get("total_ttc") or result_tyr.get("Montant") or result_tyr.get("montant")
            if raw_ref_t and raw_ttc_t:
                inv = {
                    "ref":             raw_ref_t,
                    "immatriculation": (result_tyr.get("immatriculation") or "").strip(),
                    "total_ttc":       raw_ttc_t,
                    "date":            result_tyr.get("date") or result_tyr.get("Date"),
                    "vehicule":        result_tyr.get("vehicule") or result_tyr.get("Type"),
                    "statut":          result_tyr.get("statut")
                }
                extractor_used = os.path.basename(EXTRACTOR2_PY)
        except Exception as e:
            sys.stderr.write(f"[master] Erreur parse_tyr : {e}\n")

    # 3) Validation finale (seulement ref + montant)
    ref_raw = inv.get("ref", "").strip()
    montant_raw = inv.get("total_ttc") if inv.get("total_ttc") is not None else inv.get("montant", 0)
    try:
        montant = float(str(montant_raw).replace(" ", "").replace(",", "."))
    except:
        montant = 0

    if not ref_raw or montant <= 0:
        print(json.dumps({
            "success": False,
            "error": "Impossible d'extraire les champs essentiels (ref ou montant)."
        }, ensure_ascii=False))
        return

    # 4) On reconstitue immatriculation pour le payload
    immat = inv.get("immatriculation", "").strip()

    # 5) Conversion de la date en ISO
    date_iso = None
    if inv.get("date"):
        date_iso = to_iso(inv.get("date"))
    date_iso = date_iso or (datetime.utcnow().isoformat() + "Z")

    # 6) Construction du payload final
    data = {
        "Ref":             ref_raw,
        "Date":            date_iso,
        "Immatriculation": immat,
        "Type":            (inv.get("vehicule") or inv.get("type") or "").strip(),
        "Montant":         montant,
        "statut":          inv.get("statut", "non payé")
    }

    output = {
        "success":   True,
        "data":      data,
        "extractor": extractor_used
    }
    print(json.dumps(output, ensure_ascii=False, indent=4))


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.stderr.write("Usage: extractor_master.py <file.pdf>\n")
        sys.exit(1)
    main(sys.argv[1])
