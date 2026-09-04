// lib/pdfExport.js — generate the printed Oil Record Book PDF.
import jsPDF from 'jspdf'
import { OPERATIONS } from '@/data/catalog.js'
import { formatDate, formatPosition } from '@/lib/utils.js'
import { currentVessel, entriesFor } from '@/lib/store.js'

function opLabel(code, item) {
  const op = OPERATIONS[code]
  if (!op) return `${code || '—'}${item ? `.${item}` : ''}`
  return `${code}) ${op.items[item] || item || ''}`
}

export function generateORBPdf(state) {
  const vessel = currentVessel(state)
  const entries = entriesFor(state, vessel?.id)
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 15
  const contentWidth = pageWidth - 2 * margin
  let y = 0

  const addPage = () => { doc.addPage(); y = margin }
  const checkPage = (needed = 30) => { if (y + needed > pageHeight - margin) addPage() }
  const setFont = (bold = false, size = 10) => { doc.setFont('helvetica', bold ? 'bold' : 'normal'); doc.setFontSize(size) }

  // --- cover ---
  y = margin + 5
  setFont(true, 20); doc.text('OIL RECORD BOOK', pageWidth / 2, y, { align: 'center' }); y += 12
  setFont(true, 16); doc.text(vessel?.vesselType === 'oilTanker' ? 'PART I' : 'PART II', pageWidth / 2, y, { align: 'center' }); y += 10
  setFont(false, 11)
  doc.text('Machinery Space Operations, Loading, Ballasting,', pageWidth / 2, y, { align: 'center' }); y += 5
  doc.text('Crude Oil Washing, Disposal of Residues, etc.', pageWidth / 2, y, { align: 'center' }); y += 15

  doc.setDrawColor(0, 0, 0); doc.setLineWidth(0.5); doc.rect(margin, y, contentWidth, 55); y += 8
  setFont(true, 12); doc.text('VESSEL PARTICULARS', pageWidth / 2, y, { align: 'center' }); y += 10
  const col1 = margin + 8, col2 = margin + contentWidth / 2 + 8
  const info = [
    ['Ship Name:', vessel?.name || 'Not configured', 'IMO Number:', vessel?.imo || 'N/A'],
    ['Flag State:', vessel?.flagState || '', 'Gross Tonnage:', vessel?.grossTonnage ? String(vessel.grossTonnage) : ''],
    ['Type:', vessel?.vesselType === 'oilTanker' ? 'Oil Tanker' : 'Other Ship', 'Vessel Type:', vessel?.vesselType || ''],
  ]
  info.forEach(([l1, v1, l2, v2], i) => {
    setFont(true, 9); doc.text(l1, col1, y); setFont(false, 9); doc.text(v1, col1 + 35, y)
    setFont(true, 9); doc.text(l2, col2, y); setFont(false, 9); doc.text(v2, col2 + 35, y); y += 7
  })

  y += 15; checkPage(40); setFont(true, 11)
  doc.text('CERTIFICATE OF COMPLIANCE', pageWidth / 2, y, { align: 'center' }); y += 8
  setFont(false, 9)
  const decl = [
    'The oil record book has been duly completed for all operations involving',
    'ballast water, oil residues, bilge water, and other MARPOL Annex I activities.',
    '',
    'This record book is maintained in accordance with MARPOL 73/78, Annex I,',
    'Regulation 17 (Oil Record Book) and MEPC Resolution MEPC.106(49).',
  ]
  decl.forEach((line) => { checkPage(5); doc.text(line, pageWidth / 2, y, { align: 'center' }); y += 5 })

  y += 10; checkPage(20)
  doc.line(margin + 20, y, margin + 80, y); doc.line(pageWidth - margin - 80, y, pageWidth - margin - 20, y); y += 4
  setFont(false, 8); doc.text('Master Signature', pageWidth / 2 - 30, y, { align: 'center' }); doc.text('Date', pageWidth / 2 + 30, y, { align: 'center' })

  y += 10; checkPage(15); setFont(false, 8); doc.setTextColor(120, 120, 120)
  doc.text(`Generated: ${new Date().toLocaleString()} | MarLog ORB`, pageWidth / 2, y, { align: 'center' }); doc.setTextColor(0, 0, 0)

  // --- entries ---
  entries.forEach((entry, idx) => {
    addPage(); checkPage(100)
    setFont(true, 14); doc.text('OIL RECORD BOOK — ENTRY', pageWidth / 2, y, { align: 'center' }); y += 10
    doc.setDrawColor(100, 100, 100); doc.setLineWidth(0.3); doc.rect(margin, y, contentWidth, 60)
    const boxY = y + 5
    const eInfo = [
      ['Entry No.', `#${entry.entryNumber}`, 'Date (UTC)', formatDate(entry.date)],
      ['Time (UTC)', entry.timeUtc || '', 'Status', entry.status?.toUpperCase()],
      ['Operation', opLabel(entry.operationCode, entry.itemNumber), '', ''],
      ['Tank ID', entry.tankId || (entry.tankIds?.[0] || '—'), 'Quantity (m³)', entry.quantityM3 != null ? String(entry.quantityM3) : '—'],
      ['Position', entry.position?.lat && entry.position?.lon ? formatPosition(entry.position.lat, entry.position.lon) : '—', 'Speed (kts)', entry.speedKnots != null ? String(entry.speedKnots) : '—'],
    ]
    eInfo.forEach(([l1, v1, l2, v2], i) => {
      setFont(true, 8); doc.text(l1 + ':', margin + 3, boxY + i * 9); setFont(false, 8); doc.text(String(v1), margin + 32, boxY + i * 9)
      if (l2) { setFont(true, 8); doc.text(l2 + ':', margin + contentWidth / 2, boxY + i * 9); setFont(false, 8); doc.text(String(v2), margin + contentWidth / 2 + 30, boxY + i * 9) }
    })

    y += 63; checkPage(50); setFont(true, 9); doc.text('RECORD OF OPERATION:', margin, y); y += 5
    doc.setDrawColor(200, 200, 200); doc.setLineWidth(0.2); doc.rect(margin, y, contentWidth, 35); y += 3
    setFont(false, 8)
    doc.splitTextToSize(entry.recordOfOperation || '', contentWidth - 6).slice(0, 8).forEach((line) => { checkPage(5); doc.text(line, margin + 3, y); y += 4.5 })
    y += 5

    checkPage(25); setFont(true, 9); doc.text('CERTIFIED CORRECT:', margin, y); y += 6
    doc.line(margin, y, margin + 60, y); doc.line(margin + 75, y, margin + 140, y); doc.line(pageWidth - margin - 60, y, pageWidth - margin, y); y += 4
    setFont(false, 8); doc.text('Signed by:', margin, y); doc.text('Rank:', margin + 75, y); doc.text('Date:', pageWidth - margin - 60, y); y += 8

    if (entry.status === 'corrected' || entry.status === 'void') {
      checkPage(18); doc.setFillColor(255, 240, 200); doc.rect(margin, y, contentWidth, 14, 'F')
      setFont(true, 8); doc.text(entry.status === 'void' ? 'ORIGINAL ENTRY VOIDED' : 'CORRECTION APPLIED', margin + 3, y + 6)
      setFont(false, 8)
      const note = entry.status === 'void'
        ? `Reason: ${entry.voidReason || '—'} | By: ${entry.voidedBy || '—'} | ${formatDate(entry.voidedAt?.slice(0, 10))}`
        : `Corrected from original entry.`
      doc.text(note, margin + 50, y + 6); y += 17
    }

    setFont(false, 7); doc.setTextColor(160, 160, 160)
    doc.text(`${vessel?.name || ''} — Entry ${idx + 1}/${entries.length}`, pageWidth / 2, pageHeight - 8, { align: 'center' }); doc.setTextColor(0, 0, 0)
  })

  // --- summary ---
  addPage(); setFont(true, 16); doc.text('SUMMARY', pageWidth / 2, y, { align: 'center' }); y += 12
  const active = entries.filter((e) => e.status === 'active').length
  const corrected = entries.filter((e) => e.status === 'corrected').length
  const voided = entries.filter((e) => e.status === 'void').length
  ;[['Total Entries:', String(entries.length)], ['Active Entries:', String(active)], ['Corrected Entries:', String(corrected)], ['Void Entries:', String(voided)]]
    .forEach(([l, v]) => { checkPage(7); setFont(true, 10); doc.text(l, margin + 10, y); setFont(false, 10); doc.text(v, margin + 55, y); y += 7 })

  y += 8; checkPage(40); setFont(true, 10); doc.text('Entries by Operation Code:', margin, y); y += 7
  const counts = {}
  entries.forEach((e) => { counts[e.operationCode] = (counts[e.operationCode] || 0) + 1 })
  Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)).forEach(([code, count]) => {
    checkPage(6); setFont(false, 9); doc.text(`${opLabel(code, '').split(')')[0]}) ${OPERATIONS[code]?.title || code}`, margin + 5, y)
    setFont(true, 9); doc.text(`${count} entries`, margin + 90, y); y += 6
  })

  y += 15; checkPage(20); setFont(true, 12); doc.text('— END OF OIL RECORD BOOK —', pageWidth / 2, y, { align: 'center' }); y += 8
  setFont(false, 8); doc.text(`Pages: ${doc.getNumberOfPages()} | ${new Date().toLocaleString()} | MarLog ORB`, pageWidth / 2, y, { align: 'center' })

  const filename = `ORB_${(vessel?.name || 'Vessel').replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`
  doc.save(filename)
}
