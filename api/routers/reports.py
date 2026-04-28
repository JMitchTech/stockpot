from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from api.dependencies import get_current_user
from api.database import admin_select
from api.services.forecasting import generate_purchase_forecast
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, Image
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from datetime import datetime
import io
import csv
import os

router = APIRouter(prefix="/reports", tags=["reports"])

# Stockpot brand colors
NAVY = colors.HexColor("#1B2A4A")
TOMATO = colors.HexColor("#C0392B")
LIGHT_GRAY = colors.HexColor("#F5F5F5")
MED_GRAY = colors.HexColor("#888888")
WHITE = colors.white
BLACK = colors.black

# Path to logo — root of project
LOGO_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "logo1.png")


def build_pdf_styles():
    styles = getSampleStyleSheet()
    custom = {
        "report_title": ParagraphStyle(
            "report_title", fontSize=20, textColor=NAVY,
            fontName="Helvetica-Bold", alignment=TA_RIGHT, spaceAfter=0
        ),
        "restaurant_info": ParagraphStyle(
            "restaurant_info", fontSize=10, textColor=NAVY,
            fontName="Helvetica", alignment=TA_CENTER, spaceAfter=0
        ),
        "target_info": ParagraphStyle(
            "target_info", fontSize=10, textColor=NAVY,
            fontName="Helvetica", alignment=TA_CENTER, spaceAfter=0
        ),
        "section": ParagraphStyle(
            "section", fontSize=13, textColor=NAVY,
            fontName="Helvetica-Bold", spaceBefore=18, spaceAfter=6
        ),
        "body": ParagraphStyle(
            "body", fontSize=10, textColor=BLACK,
            fontName="Helvetica", spaceAfter=4
        ),
        "small": ParagraphStyle(
            "small", fontSize=8, textColor=NAVY,
            fontName="Helvetica", spaceAfter=2
        ),
        "footer": ParagraphStyle(
            "footer", fontSize=8, textColor=NAVY,
            fontName="Helvetica", alignment=TA_CENTER
        ),
    }
    return custom


def table_style(header_color=NAVY):
    return TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), header_color),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 10),
        ("ALIGN", (0, 0), (-1, 0), "LEFT"),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
        ("TOPPADDING", (0, 0), (-1, 0), 8),
        ("BACKGROUND", (0, 1), (-1, -1), WHITE),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, LIGHT_GRAY]),
        ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 1), (-1, -1), 9),
        ("ALIGN", (0, 1), (-1, -1), "LEFT"),
        ("TOPPADDING", (0, 1), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 1), (-1, -1), 6),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#DDDDDD")),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ])


def build_report_header(story, styles, restaurant_name, report_title, subtitle=None):
    """
    Two column header:
    Left  — Stockpot logo (small)
    Right — Report title in navy
    Below — Restaurant name and date centered
    Then a navy rule
    """
    page_width = letter[0] - 1.5 * inch  # total usable width

    # Logo on left, title on right
    logo_cell = ""
    if os.path.exists(LOGO_PATH):
        logo = Image(LOGO_PATH, width=1.9*inch, height=0.55*inch)
        logo_cell = logo
    else:
        logo_cell = Paragraph(
            "<font color='#C0392B'><b>STOCKPOT</b></font>",
            ParagraphStyle("fallback", fontSize=14, fontName="Helvetica-Bold", textColor=TOMATO)
        )

    title_cell = Paragraph(report_title, styles["report_title"])

    header_table = Table(
        [[logo_cell, title_cell]],
        colWidths=[3.0*inch, page_width - 3.0*inch]
    )
    header_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))

    story.append(header_table)
    story.append(Spacer(1, 8))

    # Centered restaurant info
    date_str = datetime.utcnow().strftime("%B %d, %Y")
    story.append(Paragraph(
        f"{restaurant_name}  |  Generated {date_str}",
        styles["restaurant_info"]
    ))

    if subtitle:
        story.append(Spacer(1, 4))
        story.append(Paragraph(subtitle, styles["target_info"]))

    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=1.5, color=NAVY, spaceAfter=16))


# ── FOOD COST REPORT ─────────────────────────────────────

@router.get("/food-cost/pdf")
def food_cost_pdf(current_user: dict = Depends(get_current_user)):
    """
    Generates a branded PDF food cost report for all active menu items.
    Shows food cost, margin, and margin indicator per dish.
    Ready to hand to an accountant.
    """
    restaurant_id = current_user["restaurant_id"]
    restaurants = admin_select("restaurants", "*", {"id": restaurant_id})
    restaurant = restaurants[0] if restaurants else {}
    restaurant_name = restaurant.get("name", "Restaurant")
    target_pct = restaurant.get("food_cost_target_pct", 30.0)

    menu_items = admin_select("menu_items", "*", {"restaurant_id": restaurant_id})
    active_items = [m for m in menu_items if m.get("active")]

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=letter,
        leftMargin=0.75*inch, rightMargin=0.75*inch,
        topMargin=0.75*inch, bottomMargin=0.75*inch
    )
    styles = build_pdf_styles()
    story = []

    build_report_header(
        story, styles, restaurant_name,
        "Food Cost Report",
        subtitle=f"Food Cost Target: {target_pct}%"
    )

    # Summary stats
    total_revenue = sum(i.get("sale_price", 0) for i in active_items)
    total_food_cost = sum(i.get("food_cost_cached", 0) or 0 for i in active_items)
    overall_pct = round((total_food_cost / total_revenue * 100) if total_revenue > 0 else 0, 2)

    summary_data = [
        ["Active Menu Items", "Total Menu Revenue", "Total Food Cost", "Overall Food Cost %"],
        [
            str(len(active_items)),
            f"${total_revenue:,.2f}",
            f"${total_food_cost:,.2f}",
            f"{overall_pct}%"
        ]
    ]
    summary_table = Table(summary_data, colWidths=[1.75*inch, 1.75*inch, 1.75*inch, 1.75*inch])
    summary_table.setStyle(table_style(NAVY))
    story.append(summary_table)
    story.append(Spacer(1, 16))

    # Per dish breakdown
    story.append(Paragraph("Dish Breakdown", styles["section"]))

    dish_data = [["Dish", "Sale Price", "Food Cost", "Food Cost %", "Margin %", "Status"]]
    for item in sorted(active_items, key=lambda x: x.get("margin_cached", 0) or 0):
        food_cost = item.get("food_cost_cached") or 0
        sale_price = item.get("sale_price") or 0
        margin = item.get("margin_cached") or 0
        food_cost_pct = round((food_cost / sale_price * 100) if sale_price > 0 else 0, 1)

        if food_cost_pct <= 30:
            status = "Good"
        elif food_cost_pct <= 38:
            status = "Watch"
        else:
            status = "Review"

        dish_data.append([
            item.get("name", ""),
            f"${sale_price:.2f}",
            f"${food_cost:.2f}",
            f"{food_cost_pct}%",
            f"{margin}%",
            status
        ])

    dish_table = Table(dish_data, colWidths=[2.4*inch, 1.0*inch, 1.0*inch, 1.0*inch, 1.0*inch, 0.8*inch])
    dish_table.setStyle(table_style())
    story.append(dish_table)

    story.append(Spacer(1, 24))
    story.append(Paragraph(
        "This report was generated by Stockpot.",
        styles["footer"]
    ))

    doc.build(story)
    buffer.seek(0)

    filename = f"stockpot_food_cost_{datetime.utcnow().strftime('%Y%m%d')}.pdf"
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


# ── WASTE REPORT ─────────────────────────────────────────

@router.get("/waste/pdf")
def waste_pdf(current_user: dict = Depends(get_current_user)):
    """
    Generates a branded PDF waste report showing total waste cost
    and breakdown by ingredient. For accountant review.
    """
    restaurant_id = current_user["restaurant_id"]
    restaurants = admin_select("restaurants", "*", {"id": restaurant_id})
    restaurant = restaurants[0] if restaurants else {}
    restaurant_name = restaurant.get("name", "Restaurant")

    waste_logs = admin_select("waste_logs", "*", {"restaurant_id": restaurant_id})

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=letter,
        leftMargin=0.75*inch, rightMargin=0.75*inch,
        topMargin=0.75*inch, bottomMargin=0.75*inch
    )
    styles = build_pdf_styles()
    story = []

    build_report_header(story, styles, restaurant_name, "Waste Log Report")

    # Build waste summary
    ingredient_waste = {}
    total_cost = 0.0

    for log in waste_logs:
        if log.get("ingredient_id"):
            ings = admin_select("ingredients", "name,cost_per_unit,unit", {"id": log["ingredient_id"]})
            if ings:
                ing = ings[0]
                cost = ing["cost_per_unit"] * log["quantity"]
                total_cost += cost
                name = ing["name"]
                if name not in ingredient_waste:
                    ingredient_waste[name] = {
                        "name": name,
                        "unit": ing["unit"],
                        "total_qty": 0.0,
                        "total_cost": 0.0,
                        "entries": 0
                    }
                ingredient_waste[name]["total_qty"] += log["quantity"]
                ingredient_waste[name]["total_cost"] += cost
                ingredient_waste[name]["entries"] += 1

    # Summary
    summary_data = [
        ["Total Waste Entries", "Total Waste Cost"],
        [str(len(waste_logs)), f"${total_cost:,.2f}"]
    ]
    summary_table = Table(summary_data, colWidths=[3.5*inch, 3.5*inch])
    summary_table.setStyle(table_style(NAVY))
    story.append(summary_table)
    story.append(Spacer(1, 16))

    # By ingredient
    story.append(Paragraph("Waste by Ingredient", styles["section"]))

    waste_data = [["Ingredient", "Unit", "Total Quantity Wasted", "Total Cost", "Log Entries"]]
    for item in sorted(ingredient_waste.values(), key=lambda x: x["total_cost"], reverse=True):
        waste_data.append([
            item["name"],
            item["unit"],
            f"{item['total_qty']:.2f}",
            f"${item['total_cost']:.2f}",
            str(item["entries"])
        ])

    waste_table = Table(waste_data, colWidths=[2.0*inch, 0.8*inch, 1.8*inch, 1.4*inch, 1.2*inch])
    waste_table.setStyle(table_style())
    story.append(waste_table)

    # Detail log
    story.append(Spacer(1, 16))
    story.append(Paragraph("Full Waste Log", styles["section"]))

    log_data = [["Date", "Ingredient", "Quantity", "Reason", "Notes"]]
    for log in sorted(waste_logs, key=lambda x: x.get("logged_at", ""), reverse=True):
        ing_name = ""
        if log.get("ingredient_id"):
            ings = admin_select("ingredients", "name", {"id": log["ingredient_id"]})
            if ings:
                ing_name = ings[0]["name"]

        date_str = log.get("logged_at", "")[:10] if log.get("logged_at") else ""
        log_data.append([
            date_str,
            ing_name,
            f"{log.get('quantity', 0)} {log.get('unit', '')}",
            log.get("reason", "") or "",
            log.get("notes", "") or ""
        ])

    log_table = Table(log_data, colWidths=[1.0*inch, 1.5*inch, 1.2*inch, 1.3*inch, 2.2*inch])
    log_table.setStyle(table_style())
    story.append(log_table)

    story.append(Spacer(1, 24))
    story.append(Paragraph(
        "This report was generated by Stockpot. Cook with passion. Manage with clarity.",
        styles["footer"]
    ))

    doc.build(story)
    buffer.seek(0)

    filename = f"stockpot_waste_{datetime.utcnow().strftime('%Y%m%d')}.pdf"
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


# ── PURCHASING REPORT ────────────────────────────────────

@router.get("/purchasing/pdf")
def purchasing_pdf(current_user: dict = Depends(get_current_user)):
    """
    Generates a branded PDF purchasing forecast report.
    Shows recommended order quantities and estimated costs.
    """
    restaurant_id = current_user["restaurant_id"]
    restaurants = admin_select("restaurants", "*", {"id": restaurant_id})
    restaurant = restaurants[0] if restaurants else {}
    restaurant_name = restaurant.get("name", "Restaurant")

    forecast = generate_purchase_forecast(restaurant_id)

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=letter,
        leftMargin=0.75*inch, rightMargin=0.75*inch,
        topMargin=0.75*inch, bottomMargin=0.75*inch
    )
    styles = build_pdf_styles()
    story = []

    build_report_header(story, styles, restaurant_name, "Purchasing Forecast Report")

    if forecast["upcoming_events"]:
        event_names = ", ".join([e["name"] for e in forecast["upcoming_events"]])
        story.append(Paragraph(
            f"Upcoming events factored in: {event_names}",
            styles["body"]
        ))
        story.append(Spacer(1, 8))

    # Summary
    summary_data = [
        ["Items to Order", "Total Estimated Cost"],
        [str(forecast["item_count"]), f"${forecast['total_estimated_cost']:,.2f}"]
    ]
    summary_table = Table(summary_data, colWidths=[3.5*inch, 3.5*inch])
    summary_table.setStyle(table_style(NAVY))
    story.append(summary_table)
    story.append(Spacer(1, 16))

    # Order list
    story.append(Paragraph("Recommended Order List", styles["section"]))

    order_data = [["Ingredient", "Unit", "Current Stock", "Par Level", "Order Qty", "Waste Buffer", "Est. Cost"]]
    for item in forecast["order_items"]:
        order_data.append([
            item["ingredient_name"],
            item["unit"],
            str(item["current_stock"]),
            str(item["par_level"]),
            str(item["recommended_order_quantity"]),
            str(item["waste_buffer_included"]),
            f"${item['estimated_cost']:.2f}"
        ])

    order_table = Table(
        order_data,
        colWidths=[1.6*inch, 0.6*inch, 0.9*inch, 0.8*inch, 0.8*inch, 0.9*inch, 0.9*inch]
    )
    order_table.setStyle(table_style())
    story.append(order_table)

    story.append(Spacer(1, 24))
    story.append(Paragraph(
        "This report was generated by Stockpot. Cook with passion. Manage with clarity.",
        styles["footer"]
    ))

    doc.build(story)
    buffer.seek(0)

    filename = f"stockpot_purchasing_{datetime.utcnow().strftime('%Y%m%d')}.pdf"
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


# ── CSV EXPORTS ──────────────────────────────────────────

@router.get("/food-cost/csv")
def food_cost_csv(current_user: dict = Depends(get_current_user)):
    """CSV export of food cost data for spreadsheet use."""
    restaurant_id = current_user["restaurant_id"]
    menu_items = admin_select("menu_items", "*", {"restaurant_id": restaurant_id})
    active_items = [m for m in menu_items if m.get("active")]

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Dish", "Category", "Sale Price", "Food Cost", "Food Cost %", "Margin %"])

    for item in active_items:
        food_cost = item.get("food_cost_cached") or 0
        sale_price = item.get("sale_price") or 0
        margin = item.get("margin_cached") or 0
        food_cost_pct = round((food_cost / sale_price * 100) if sale_price > 0 else 0, 2)
        writer.writerow([
            item.get("name"), item.get("category"),
            sale_price, food_cost, food_cost_pct, margin
        ])

    output.seek(0)
    filename = f"stockpot_food_cost_{datetime.utcnow().strftime('%Y%m%d')}.csv"
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/waste/csv")
def waste_csv(current_user: dict = Depends(get_current_user)):
    """CSV export of waste log for spreadsheet use."""
    restaurant_id = current_user["restaurant_id"]
    waste_logs = admin_select("waste_logs", "*", {"restaurant_id": restaurant_id})

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Date", "Ingredient", "Quantity", "Unit", "Reason", "Notes"])

    for log in sorted(waste_logs, key=lambda x: x.get("logged_at", ""), reverse=True):
        ing_name = ""
        if log.get("ingredient_id"):
            ings = admin_select("ingredients", "name", {"id": log["ingredient_id"]})
            if ings:
                ing_name = ings[0]["name"]

        writer.writerow([
            log.get("logged_at", "")[:10],
            ing_name,
            log.get("quantity"),
            log.get("unit"),
            log.get("reason", ""),
            log.get("notes", "")
        ])

    output.seek(0)
    filename = f"stockpot_waste_{datetime.utcnow().strftime('%Y%m%d')}.csv"
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )