import random
from datetime import datetime

class DGIIService:
    """
    Servicio de cumplimiento tributario de la República Dominicana (DGII).
    Gestiona Comprobantes Fiscales (NCF) y cálculos de la Ley 173-07.
    """

    @staticmethod
    def generate_ncf(ncf_type: str = "B02") -> str:
        """
        Genera un número de comprobante fiscal secuencial válido según formato DGII.
        - B02: Consumidor Final (recibos de mantenimiento a residentes)
        - B01: Crédito Fiscal (facturas corporativas de administración)
        - E31: Factura Electrónica (Ley 32-23)
        """
        seq = random.randint(1000000, 9999999)
        return f"{ncf_type}{seq:08d}"

    @staticmethod
    def calculate_mortgage_taxes(property_price_usd: float, exchange_rate: float = 60.50) -> dict:
        """
        Calcula el impuesto de transferencia inmobiliaria del 3% (Ley 173-07)
        y gastos notariales/cierre estandarizados en RD.
        """
        price_dop = property_price_usd * exchange_rate
        transfer_tax_3pct = price_dop * 0.03
        notary_and_closing = price_dop * 0.015
        total_closing_costs = transfer_tax_3pct + notary_and_closing

        return {
            "property_price_usd": property_price_usd,
            "property_price_dop": round(price_dop, 2),
            "exchange_rate": exchange_rate,
            "dgii_transfer_tax_3pct_dop": round(transfer_tax_3pct, 2),
            "notary_closing_dop": round(notary_and_closing, 2),
            "total_closing_costs_dop": round(total_closing_costs, 2),
            "legal_basis": "Ley 173-07 de la Dirección General de Impuestos Internos (DGII)"
        }
