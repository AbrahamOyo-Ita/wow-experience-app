from __future__ import annotations

from datetime import datetime
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile
import html


OUT = Path("reports/wow_backend_readiness_report.docx")
NOW = datetime.utcnow().replace(microsecond=0).isoformat() + "Z"


def esc(text: str) -> str:
    return html.escape(text, quote=True)


def run(text: str, bold: bool = False, color: str | None = None, size_half_points: int = 22) -> str:
    props = [f'<w:sz w:val="{size_half_points}"/>', f'<w:szCs w:val="{size_half_points}"/>']
    if bold:
        props.append("<w:b/>")
    if color:
        props.append(f'<w:color w:val="{color}"/>')
    return (
        "<w:r><w:rPr>"
        + "".join(props)
        + f'</w:rPr><w:t xml:space="preserve">{esc(text)}</w:t></w:r>'
    )


def para(text: str = "", style: str | None = None, runs: list[str] | None = None) -> str:
    ppr = f'<w:pPr><w:pStyle w:val="{style}"/></w:pPr>' if style else ""
    content = "".join(runs) if runs is not None else run(text)
    return f"<w:p>{ppr}{content}</w:p>"


def bullet(text: str) -> str:
    return (
        '<w:p><w:pPr><w:pStyle w:val="ListParagraph"/>'
        '<w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr>'
        "</w:pPr>"
        + run(text)
        + "</w:p>"
    )


def cell(text: str, width: int, bold: bool = False, fill: str | None = None) -> str:
    shading = f'<w:shd w:fill="{fill}"/>' if fill else ""
    return (
        f'<w:tc><w:tcPr><w:tcW w:w="{width}" w:type="dxa"/>{shading}</w:tcPr>'
        f"<w:p>{run(text, bold=bold)}</w:p></w:tc>"
    )


def table(rows: list[tuple[str, str, str]]) -> str:
    widths = [720, 2880, 5760]
    grid = "".join(f'<w:gridCol w:w="{w}"/>' for w in widths)
    tbl_pr = (
        '<w:tblPr><w:tblW w:w="9360" w:type="dxa"/>'
        '<w:tblBorders>'
        '<w:top w:val="single" w:sz="4" w:space="0" w:color="D9E2EC"/>'
        '<w:left w:val="single" w:sz="4" w:space="0" w:color="D9E2EC"/>'
        '<w:bottom w:val="single" w:sz="4" w:space="0" w:color="D9E2EC"/>'
        '<w:right w:val="single" w:sz="4" w:space="0" w:color="D9E2EC"/>'
        '<w:insideH w:val="single" w:sz="4" w:space="0" w:color="D9E2EC"/>'
        '<w:insideV w:val="single" w:sz="4" w:space="0" w:color="D9E2EC"/>'
        "</w:tblBorders>"
        '<w:tblCellMar><w:top w:w="80" w:type="dxa"/><w:left w:w="120" w:type="dxa"/>'
        '<w:bottom w:w="80" w:type="dxa"/><w:right w:w="120" w:type="dxa"/></w:tblCellMar>'
        "</w:tblPr>"
    )
    header = '<w:tr>' + "".join(
        cell(text, widths[i], bold=True, fill="F2F4F7")
        for i, text in enumerate(("No.", "Area", "What remains"))
    ) + "</w:tr>"
    body = ""
    for row in rows:
        body += "<w:tr>" + "".join(cell(row[i], widths[i]) for i in range(3)) + "</w:tr>"
    return f"<w:tbl>{tbl_pr}<w:tblGrid>{grid}</w:tblGrid>{header}{body}</w:tbl>"


CONTENT_TYPES = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>"""

ROOT_RELS = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>"""

DOC_RELS = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>
</Relationships>"""

STYLES = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:pPr><w:spacing w:after="120" w:line="264" w:lineRule="auto"/></w:pPr>
    <w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="22"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="TitleReport">
    <w:name w:val="Report Title"/><w:basedOn w:val="Normal"/>
    <w:pPr><w:spacing w:after="80"/></w:pPr>
    <w:rPr><w:b/><w:color w:val="0B2545"/><w:sz w:val="40"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="SubtitleReport">
    <w:name w:val="Report Subtitle"/><w:basedOn w:val="Normal"/>
    <w:pPr><w:spacing w:after="200"/></w:pPr>
    <w:rPr><w:color w:val="555555"/><w:sz w:val="20"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/><w:basedOn w:val="Normal"/>
    <w:pPr><w:keepNext/><w:spacing w:before="320" w:after="160"/></w:pPr>
    <w:rPr><w:b/><w:color w:val="2E74B5"/><w:sz w:val="32"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="ListParagraph">
    <w:name w:val="List Paragraph"/><w:basedOn w:val="Normal"/>
    <w:pPr><w:spacing w:after="80" w:line="280" w:lineRule="auto"/><w:ind w:left="720"/></w:pPr>
  </w:style>
</w:styles>"""

NUMBERING = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:abstractNum w:abstractNumId="1">
    <w:lvl w:ilvl="0">
      <w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="&#8226;"/>
      <w:lvlJc w:val="left"/>
      <w:pPr><w:tabs><w:tab w:val="num" w:pos="720"/></w:tabs><w:ind w:left="720" w:hanging="360"/></w:pPr>
      <w:rPr><w:rFonts w:ascii="Symbol" w:hAnsi="Symbol"/></w:rPr>
    </w:lvl>
  </w:abstractNum>
  <w:num w:numId="1"><w:abstractNumId w:val="1"/></w:num>
</w:numbering>"""


def document_xml() -> str:
    checklist = [
        ("1", "Migrations", "Apply all Supabase migrations to the real linked project: init, functions, seed, and backend hardening."),
        ("2", "Secrets", "Add missing production secrets: SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, OPENWA_BASE_URL, and OPENWA_API_KEY."),
        ("3", "Delivery", "Connect and test Resend for email and a persistent OpenWA host for WhatsApp."),
        ("4", "Cron", "Configure the production cron job to call /api/cron/notifications with Authorization: Bearer <CRON_SECRET>."),
        ("5", "Admin auth", "Make the login action explicitly reject users who are not listed in profile_roles; the UI already has a forbidden message."),
        ("6", "Verification", "Run Supabase advisors or lint against the linked project, then test RSVP, volunteer, attendance, enquiry, unsubscribe, admin reads, and campaign scheduling."),
        ("7", "Launch data", "Replace placeholders for venue, event window, APP_URL, QR target URL, Resend sender domain, and WhatsApp session details."),
    ]
    body = [
        para("WOW Experience Backend Readiness Report", "TitleReport"),
        para(
            "Codex account check and remaining production-readiness items for C:\\Users\\HomePC\\WOWExperience\\wow-experience.",
            "SubtitleReport",
        ),
        para("Codex Account Result", "Heading1"),
        para(
            runs=[
                run("Logged-in Codex account: ", bold=True),
                run("oyoitaabraham@gmail.com", bold=True, color="2E74B5"),
            ]
        ),
        bullet("Confirmed from the local Codex auth payload."),
        bullet("It is not logged in as kanuamani@gmail.com."),
        bullet("No access tokens or secret values are included in this report."),
        para("Backend Status Observed", "Heading1"),
        bullet("The app is no longer just a frontend demonstration."),
        bullet("Supabase SSR clients, server actions, public RPC calls, admin reads, and a notification cron route are present."),
        bullet("The README still contains stale text saying there is no live backend."),
        bullet("This folder is not currently a Git worktree, so branch and commit status could not be verified with Git."),
        para("Production Readiness Checklist", "Heading1"),
        table(checklist),
        para("Local Environment Note", "Heading1"),
        bullet(".env.local currently has public Supabase variables and CRON_SECRET."),
        bullet("It does not currently list SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, OPENWA_BASE_URL, or OPENWA_API_KEY."),
        bullet("That means form submissions may work if Supabase is live, but queued notification sending will not run from this checkout until those production values are configured."),
    ]
    sect = (
        '<w:sectPr><w:pgSz w:w="12240" w:h="15840"/>'
        '<w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="708" w:footer="708" w:gutter="0"/>'
        "</w:sectPr>"
    )
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas" '
        'xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" '
        'xmlns:o="urn:schemas-microsoft-com:office:office" '
        'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" '
        'xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" '
        'xmlns:v="urn:schemas-microsoft-com:vml" '
        'xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing" '
        'xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" '
        'xmlns:w10="urn:schemas-microsoft-com:office:word" '
        'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" '
        'xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml" '
        'xmlns:w15="http://schemas.microsoft.com/office/word/2012/wordml" '
        'xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup" '
        'xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk" '
        'xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml" '
        'xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape" '
        'mc:Ignorable="w14 w15 wp14"><w:body>'
        + "".join(body)
        + sect
        + "</w:body></w:document>"
    )


def main() -> None:
    OUT.parent.mkdir(parents=True, exist_ok=True)
    with ZipFile(OUT, "w", ZIP_DEFLATED) as z:
        z.writestr("[Content_Types].xml", CONTENT_TYPES)
        z.writestr("_rels/.rels", ROOT_RELS)
        z.writestr("word/_rels/document.xml.rels", DOC_RELS)
        z.writestr("word/document.xml", document_xml())
        z.writestr("word/styles.xml", STYLES)
        z.writestr("word/numbering.xml", NUMBERING)
        z.writestr(
            "docProps/core.xml",
            f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>WOW Experience Backend Readiness Report</dc:title>
  <dc:creator>Codex</dc:creator>
  <cp:lastModifiedBy>Codex</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">{NOW}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">{NOW}</dcterms:modified>
</cp:coreProperties>""",
        )
        z.writestr(
            "docProps/app.xml",
            """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>Codex</Application>
</Properties>""",
        )


if __name__ == "__main__":
    main()
