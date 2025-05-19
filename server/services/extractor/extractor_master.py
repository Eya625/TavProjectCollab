#!/usr/bin/env python3
import json
import sys
import os
import importlib.util
from datetime import datetime

# 0) Résolution des chemins absolus des parsers
BASE_DIR        = os.path.dirname(os.path.abspath(__file__))
EXTRACTOR_PY    = os.path.join(BASE_DIR, "extractor.py")
EXTRACTOR2_PY   = os.path.join(BASE_DIR, "extractor2.py")
EXTRACTOR_PO_PY = os.path.join(BASE_DIR, "extractor_po.py")

def load_func_from_path(path, func_name):
    """
    Charge un module depuis `path` et renvoie sa fonction `func_name`.
    """
    if not os.path.exists(path):
        sys.stderr.write(f"[loader] KO  Fichier non trouvé : {path}\n")
        return None
    spec = importlib.util.spec_from_file_location(os.path.basename(path), path)
    module = importlib.util.module_from_spec(spec)
    try:
        spec.loader.exec_module(module)
        func = getattr(module, func_name, None)
        if not callable(func):
            raise AttributeError(f"{func_name} n’est pas une fonction dans {path}")
        sys.stderr.write(f"[loader] OK  {path} → {func_name}\n")
        return func
    except Exception as e:
        sys.stderr.write(f"[loader] KO  {path} → {func_name} : {e}\n")
        return None

# 1) Chargement des fonctions d’extraction
parse_invoice = load_func_from_path(EXTRACTOR_PY,    "parse_invoice")
parse_tyre    = load_func_from_path(EXTRACTOR2_PY,   "main")
parse_po      = load_func_from_path(EXTRACTOR_PO_PY, "parse_po")

# 2) Utilitaire de conversion “DD-MMM-YYYY” ou “DD/MM/YYYY” → ISO
def to_iso(date_str):
    for fmt in ("%d-%b-%Y", "%d/%m/%Y"):
        try:
            return datetime.strptime(date_str, fmt).isoformat()
        except:
            pass
    return None

# 3) Fonction principale
def main(pdf_path):
    # 3.0) Vérifier que le fichier existe
    sys.stderr.write(f"[master] Chemin reçu : {pdf_path}\n")
    if not os.path.exists(pdf_path):
        sys.stderr.write(f"[master] ERREUR : Le fichier n’existe pas → {pdf_path}\n")
        print(json.dumps({"success": False, "error": "Fichier PDF introuvable"}))
        sys.exit(1)

    # 3.1) Extraction brute du PO
    if parse_po:
        try:
            po_raw = parse_po(pdf_path) or {}
        except Exception as e:
            sys.stderr.write(f"[master] Erreur dans parse_po : {e}\n")
            po_raw = {}
    else:
        sys.stderr.write("[master] parse_po non chargé, on skip PO\n")
        po_raw = {}

    # 3.2) Extraction de la facture
    if parse_invoice:
        try:
            inv = parse_invoice(pdf_path) or {}
        except Exception as e:
            sys.stderr.write(f"[master] Erreur dans parse_invoice : {e}\n")
            inv = {}
    else:
        sys.stderr.write("[master] parse_invoice non chargé, on skip invoice\n")
        inv = {}

    # 3.3) Fallback pneu si pas d’immatriculation
    if not inv.get("immatriculation") and parse_tyre:
        try:
            tyre = parse_tyre(pdf_path) or {}
            inv.update(tyre)
        except Exception as e:
            sys.stderr.write(f"[master] Erreur dans parse_tyre : {e}\n")

    # 3.4) Date courante
    now_iso = datetime.utcnow().isoformat() + "Z"

    # 3.5) Assemblage du payload
    data = {
        "Ref":             inv.get("ref", ""),
        "Date":            now_iso,
        "Immatriculation": inv.get("immatriculation", ""),
        "Type":            inv.get("vehicule", ""),
        "Montant":         inv.get("total_ttc", 0),
        "statut":          "non payé",

        # DEBUG : montrer ce que le PO a réellement vu
        "debug_po_raw_text": po_raw.get("raw_text", ""),
        "debug_po_raw":      {k: v for k, v in po_raw.items() if k != "raw_text"},

        # Bloc PO formaté pour votre schema BillingVehicle.po
        "po": {
            "poNumber":         po_raw.get("poNumber", "") or "",
            "createdDate":      to_iso(po_raw.get("poDate", "")),
            "supplier":         po_raw.get("supplierCode", "") or "",
            "destinataire":     po_raw.get("destinataire", "") or "",
            "poInternalNumber": po_raw.get("poInternalNumber", "") or "",
            "demandeNumber":    po_raw.get("demandeNumber", "") or "",
            "deliveryDate":     to_iso(po_raw.get("deliveryDate", "")),
            "totalEstimated":   0,
            "status":           "open"
        }
    }

    # 3.6) Sortie JSON
    print(json.dumps({"success": True, "data": data}, ensure_ascii=False, indent=4))

# 4) Entrée CLI
if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.stderr.write("Usage: extractor_master.py <file.pdf>\n")
        sys.exit(1)
    main(sys.argv[1])
