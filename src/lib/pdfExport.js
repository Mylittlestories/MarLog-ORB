import jsPDF from 'jspdf'
import { MARPOL_OPERATIONS } from '@/data/marpolOperations.js'
import { formatDate, formatPosition } from '@/lib/utils.js'

export function generateORBPdf(state) {
  const { vessel, entries } = state
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 15
  const contentWidth = pageWidth - 2 * margin

  let y = 0

  const addPage = () => {
    doc.addPage()
    y = margin
  }

  const checkPage = (needed = 30) => {
    if (y + needed > pageHeight - margin) addPage()
  }

  const setFont = (bold = false, size = 10) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.setFontSize(size)
  }

  const getOperationName = (code, item) => {
    if (!code) return '—'
    const op = MARPOL_OPERATIONS[code]
    if (!op) return `${code}.${item}`
    return `${code}) ${op.items[item] || item}`
  }

  // === COVER PAGE ===
  y = margin + 5
  setFont(true, 20)
  doc.text('OIL RECORD BOOK', pageWidth / 2, y, { align: 'center' })
  y += 12
  setFont(true, 16)
  doc.text(vessel?.vessel_type === 'oil_tanker' ? 'PART I' : 'PART II', pageWidth / 2, y, { align: 'center' })
  y += 10
  setFont(false, 11)
  doc.text('Machinery Space Operations, Loading, Ballasting,', pageWidth / 2, y, { align: 'center' })
  y += 5
  doc.text('Crude Oil Washing, Disposal of Residues, etc.', pageWidth / 2, y, { align: 'center' })
  y += 15

  // Vessel info box
  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(0.5)
  doc.rect(margin, y, contentWidth, 55)

  y += 8
  setFont(true, 12)
  doc.text('VESSEL PARTICULARS', pageWidth / 2, y, { align: 'center' })
  y += 10

  const col1 = margin + 8
  const col2 = margin + contentWidth / 2 + 8
  const infoData = [
    ['Ship Name:', vessel?.vessel_name || 'Not configured', 'IMO Number:', vessel?.imo_number || 'N/A'],
    ['Flag State:', vessel?.flag_state || '', 'Gross Tonnage:', vessel?.gross_tonnage ? String(vessel.gross_tonnage) : ''],
    ['Type:', vessel?.vessel_type === 'oil_tanker' ? 'Oil Tanker' : 'Other Ship', 'OWS Capacity:', vessel?.oily_water_separator_capacity ? `${vessel.oily_water_separator_capacity} m³/h` : ''],
    ['OCM Type:', vessel?.oil_content_monitor_type || '', 'Slop Tank:', vessel?.slop_tank_capacity ? `${vessel.slop_tank_capacity} m³` : ''],
  ]

  infoData.forEach(([l1, v1, l2, v2], i) => {
    setFont(true, 9)
    doc.text(l1, col1, y)
    setFont(false, 9)
    doc.text(v1, col1 + 35, y)
    setFont(true, 9)
    doc.text(l2, col2, y)
    setFont(false, 9)
    doc.text(v2, col2 + 35, y)
    y += 7
  })

  y += 15
  checkPage(40)
  setFont(true, 11)
  doc.text('CERTIFICATE OF COMPLIANCE', pageWidth / 2, y, { align: 'center' })
  y += 8
  setFont(false, 9)
  const declLines = [
    'The oil record book has been duly completed for all operations involving',
    'ballast water, oil residues, bilge water, and other MARPOL Annex I activities.',
    '',
    'This record book is maintained in accordance with MARPOL 73/78, Annex I,',
    'Regulation 17 (Oil Record Book) and MEPC Resolution MEPC.106(49).',
  ]
  declLines.forEach(line => {
    checkPage(5)
    doc.text(line, pageWidth / 2, y, { align: 'center' })
    y += 5
  })

  y += 10
  checkPage(20)
  doc.line(margin + 20, y, margin + 80, y)
  doc.line(pageWidth - margin - 80, y, pageWidth - margin - 20, y)
  y += 4
  setFont(false, 8)
  doc.text('Master Signature', pageWidth / 2 - 30, y, { align: 'center' })
  doc.text('Date', pageWidth / 2 + 30, y, { align: 'center' })

  y += 10
  checkPage(15)
  setFont(false, 8)
  doc.setTextColor(120, 120, 120)
  doc.text(`Generated: ${new Date().toLocaleString()} | MarLog ORB`, pageWidth / 2, y, { align: 'center' })
  doc.setTextColor(0, 0, 0)

  // === ENTRY PAGES ===
  entries.forEach((entry, idx) => {
    addPage()
    checkPage(100)

    setFont(true, 14)
    doc.text('OIL RECORD BOOK — ENTRY', pageWidth / 2, y, { align: 'center' })
    y += 10

    // Entry box
    doc.setDrawColor(100, 100, 100)
    doc.setLineWidth(0.3)
    doc.rect(margin, y, contentWidth, 60)

    const boxY = y + 5
    const entryInfo = [
      ['Entry No.', `#${entry.entry_number}`, 'Date (UTC)', formatDate(entry.date)],
      ['Time (UTC)', entry.time_utc || '', 'Status', entry.status?.toUpperCase()],
      ['Operation', getOperationName(entry.operation_code, entry.item_number), '', ''],
      ['Tank ID', entry.tank_id || '—', 'Quantity (m³)', entry.quantity_m3 ? String(entry.quantity_m3) : '—'],
      ['Position', formatPosition(entry.position_lat, entry.position_lon), 'Speed (kts)', entry.ship_speed_knots ? String(entry.ship_speed_knots) : '—'],
    ]

    entryInfo.forEach(([l1, v1, l2, v2], i) => {
      setFont(true, 8)
      doc.text(l1 + ':', margin + 3, boxY + i * 9)
      setFont(false, 8)
      doc.text(String(v1), margin + 32, boxY + i * 9)
      if (l2) {
        setFont(true, 8)
        doc.text(l2 + ':', margin + contentWidth / 2, boxY + i * 9)
        setFont(false, 8)
        doc.text(String(v2), margin + contentWidth / 2 + 30, boxY + i * 9)
      }
    })

    y += 63

    checkPage(50)
    setFont(true, 9)
    doc.text('RECORD OF OPERATION:', margin, y)
    y += 5

    doc.setDrawColor(200, 200, 200)
    doc.setLineWidth(0.2)
    doc.rect(margin, y, contentWidth, 35)
    y += 3

    setFont(false, 8)
    const recLines = doc.splitTextToSize(entry.record_of_operation || '', contentWidth - 6)
    recLines.slice(0, 7).forEach(line => {
      checkPage(5)
      doc.text(line, margin + 3, y)
      y += 4.5
    })
    y += 5

    checkPage(25)
    setFont(true, 9)
    doc.text('CERTIFIED CORRECT:', margin, y)
    y += 6

    doc.line(margin, y, margin + 60, y)
    doc.line(margin + 75, y, margin + 140, y)
    doc.line(pageWidth - margin - 60, y, pageWidth - margin, y)
    y += 4
    setFont(false, 8)
    doc.text('Signed by:', margin, y)
    doc.text('Rank:', margin + 75, y)
    doc.text('Date:', pageWidth - margin - 60, y)

    y += 8

    if (entry.status === 'corrected' || entry.status === 'void') {
      checkPage(18)
      doc.setFillColor(255, 240, 200)
      doc.rect(margin, y, contentWidth, 14, 'F')
      setFont(true, 8)
      doc.text('CORRECTION APPLIED', margin + 3, y + 6)
      setFont(false, 8)
      const corrText = `By: ${entry.corrected_by || '—'} | Date: ${formatDate(entry.correction_date)} | Note: ${entry.correction_note || '—'}`
      doc.text(corrText, margin + 50, y + 6)
      y += 17
    }

    checkPage(10)
    setFont(false, 7)
    doc.setTextColor(160, 160, 160)
    doc.text(`${vessel?.vessel_name || ''} — Entry ${idx + 1}/${entries.length}`, pageWidth / 2, pageHeight - 8, { align: 'center' })
    doc.setTextColor(0, 0, 0)
  })

  // === SUMMARY PAGE ===
  addPage()
  setFont(true, 16)
  doc.text('SUMMARY', pageWidth / 2, y, { align: 'center' })
  y += 12

  const activeCount = entries.filter(e => e.status === 'active').length
  const correctedCount = entries.filter(e => e.status === 'corrected').length
  const voidCount = entries.filter(e => e.status === 'void').length

  const summary = [
    ['Total Entries:', String(entries.length)],
    ['Active Entries:', String(activeCount)],
    ['Corrected Entries:', String(correctedCount)],
    ['Void Entries:', String(voidCount)],
  ]

  summary.forEach(([label, value]) => {
    checkPage(7)
    setFont(true, 10)
    doc.text(label, margin + 10, y)
    setFont(false, 10)
    doc.text(value, margin + 55, y)
    y += 7
  })

  y += 8
  checkPage(40)
  setFont(true, 10)
  doc.text('Entries by Operation Code:', margin, y)
  y += 7

  const codeCounts = {}
  entries.forEach(e => { codeCounts[e.operation_code] = (codeCounts[e.operation_code] || 0) + 1 })

  Object.entries(codeCounts).sort(([a], [b]) => a.localeCompare(b)).forEach(([code, count]) => {
    checkPage(6)
    const opName = MARPOL_OPERATIONS[code]?.name.split('(')[0].trim() || code
    setFont(false, 9)
    doc.text(`${code}) ${opName}`, margin + 5, y)
    setFont(true, 9)
    doc.text(`${count} entries`, margin + 90, y)
    y += 6
  })

  y += 15
  checkPage(20)
  setFont(true, 12)
  doc.text('— END OF OIL RECORD BOOK —', pageWidth / 2, y, { align: 'center' })
  y += 8
  setFont(false, 8)
  doc.text(`Pages: ${doc.getNumberOfPages()} | ${new Date().toLocaleString()} | MarLog ORB`, pageWidth / 2, y, { align: 'center' })

  const filename = `ORB_${(vessel?.vessel_name || 'Vessel').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
  doc.save(filename)
}
