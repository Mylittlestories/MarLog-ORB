import { useApp } from '@/context/AppContext.jsx'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { ArrowLeft, Save, BookOpen, Clock, MapPin, FileText, Check } from 'lucide-react'
import { useState, useEffect } from 'react'
import { MARPOL_OPERATIONS, OPERATION_CODES, RANKS } from '@/data/marpolOperations.js'
import { getUTCDateInputValue, getUTCTimeInputValue, isNonNegativeNumber } from '@/lib/utils.js'

const emptyEntry = {
  date: getUTCDateInputValue(),
  time_utc: getUTCTimeInputValue(),
  operation_code: '', item_number: '', operation_description: '',
  record_of_operation: '', tank_id: '', quantity_m3: '',
  position_lat: '', position_lon: '', ship_speed_knots: '',
  signed_by: '', rank: 'Chief Engineer'
}

export function EntryForm({ entry, onClose, onNavigate }) {
  const { state, dispatch } = useApp()
  const { vessel, templates } = state
  const isEditing = !!entry

  const [formData, setFormData] = useState(emptyEntry)
  const [errors, setErrors] = useState({})
  const [saved, setSaved] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState(null)

  useEffect(() => {
    if (entry) {
      setFormData({
        date: entry.date || '', time_utc: entry.time_utc || '',
        operation_code: entry.operation_code || '', item_number: entry.item_number || '',
        operation_description: entry.operation_description || '',
        record_of_operation: entry.record_of_operation || '',
        tank_id: entry.tank_id || '', quantity_m3: entry.quantity_m3 || '',
        position_lat: entry.position_lat || '', position_lon: entry.position_lon || '',
        ship_speed_knots: entry.ship_speed_knots || '',
        signed_by: entry.signed_by || '', rank: entry.rank || 'Chief Engineer'
      })
    }
  }, [entry])

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: null }))
    if (field === 'operation_code') setFormData(prev => ({ ...prev, item_number: '', record_of_operation: '' }))
  }

  const handleTemplateSelect = (templateId) => {
    const template = templates.find(t => t.id === templateId)
    if (!template) return
    setSelectedTemplate(template)
    setFormData(prev => ({
      ...prev, operation_code: template.operation_code, item_number: template.item_number,
      record_of_operation: template.record_of_operation, tank_id: template.tank_id || prev.tank_id, rank: template.rank || prev.rank
    }))
    dispatch({ type: 'INCREMENT_TEMPLATE_USAGE', payload: templateId })
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.date) newErrors.date = 'Date is required'
    if (!formData.time_utc) newErrors.time_utc = 'Time is required'
    if (!formData.operation_code) newErrors.operation_code = 'Operation code is required'
    if (!formData.item_number) newErrors.item_number = 'Item number is required'
    if (!formData.record_of_operation.trim()) newErrors.record_of_operation = 'Record of operation is required'
    if (!isNonNegativeNumber(formData.quantity_m3)) newErrors.quantity_m3 = 'Quantity must be zero or greater'
    if (!isNonNegativeNumber(formData.ship_speed_knots)) newErrors.ship_speed_knots = 'Speed must be zero or greater'

    const positionCriticalOperation = ['C', 'D'].includes(formData.operation_code) || (formData.operation_code === 'G' && ['3', '4'].includes(formData.item_number))
    if (positionCriticalOperation && (!formData.position_lat.trim() || !formData.position_lon.trim())) {
      newErrors.position = 'Latitude and longitude are required for discharge operations'
    }
    if (['C', 'D', 'E', 'F', 'G'].includes(formData.operation_code) && formData.quantity_m3 === '') {
      newErrors.quantity_m3 = 'Quantity is required for transfer/discharge operations'
    }
    if (!formData.signed_by.trim()) newErrors.signed_by = 'Signed by is required'
    if (!formData.rank) newErrors.rank = 'Rank is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    const entryData = {
      ...formData,
      quantity_m3: formData.quantity_m3 ? Number(formData.quantity_m3) : null,
      ship_speed_knots: formData.ship_speed_knots ? Number(formData.ship_speed_knots) : null,
      vessel_name: vessel.vessel_name
    }
    if (isEditing) dispatch({ type: 'UPDATE_ENTRY', payload: { id: entry.id, ...entryData } })
    else dispatch({ type: 'ADD_ENTRY', payload: entryData })
    setSaved(true)
    setTimeout(() => { setSaved(false); onClose() }, 1500)
  }

  const currentOperation = formData.operation_code ? MARPOL_OPERATIONS[formData.operation_code] : null

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={onClose}><ArrowLeft className="w-4 h-4" /></Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><FileText className="w-6 h-6" />{isEditing ? `Edit Entry #${entry.entry_number}` : 'New Oil Record Entry'}</h1>
          <p className="text-slate-500 mt-1">{vessel?.vessel_name} — {vessel?.vessel_type === 'oil_tanker' ? 'Part I ORB' : 'Part II ORB'}</p>
        </div>
        {saved && <Badge variant="success" className="ml-auto"><Check className="w-3 h-3 mr-1" />Saved!</Badge>}
      </div>

      <Tabs defaultValue="entry" className="space-y-4">
        <TabsList>
          <TabsTrigger value="entry">Entry Details</TabsTrigger>
          <TabsTrigger value="templates">Use Template</TabsTrigger>
          <TabsTrigger value="location">Location & Speed</TabsTrigger>
        </TabsList>

        <form onSubmit={handleSubmit}>
          <TabsContent value="entry" className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Clock className="w-4 h-4" />Date and Time (UTC)</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date *</Label>
                    <Input id="date" type="date" value={formData.date} onChange={(e) => handleChange('date', e.target.value)} className={errors.date ? 'border-red-500' : ''} />
                    {errors.date && <p className="text-xs text-red-500">{errors.date}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time_utc">Time (UTC) *</Label>
                    <Input id="time_utc" type="time" value={formData.time_utc} onChange={(e) => handleChange('time_utc', e.target.value)} className={errors.time_utc ? 'border-red-500' : ''} />
                    {errors.time_utc && <p className="text-xs text-red-500">{errors.time_utc}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><BookOpen className="w-4 h-4" />MARPOL Operation</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Operation Code *</Label>
                    <Select value={formData.operation_code} onValueChange={(v) => handleChange('operation_code', v)}>
                      <SelectTrigger className={errors.operation_code ? 'border-red-500' : ''}><SelectValue placeholder="Select operation..." /></SelectTrigger>
                      <SelectContent>
                        {OPERATION_CODES.map(code => <SelectItem key={code} value={code}>{code}) {MARPOL_OPERATIONS[code].name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {errors.operation_code && <p className="text-xs text-red-500">{errors.operation_code}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Item Number *</Label>
                    <Select value={formData.item_number} onValueChange={(v) => handleChange('item_number', v)} disabled={!formData.operation_code}>
                      <SelectTrigger className={errors.item_number ? 'border-red-500' : ''}><SelectValue placeholder="Select item..." /></SelectTrigger>
                      <SelectContent>
                        {currentOperation && Object.entries(currentOperation.items).map(([num, text]) => (
                          <SelectItem key={num} value={num}>{num}. {text}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.item_number && <p className="text-xs text-red-500">{errors.item_number}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label htmlFor="tank_id">Tank / Space ID</Label><Input id="tank_id" value={formData.tank_id} onChange={(e) => handleChange('tank_id', e.target.value)} placeholder="e.g. No. 1 Slop Tank" /></div>
                  <div className="space-y-2"><Label htmlFor="quantity_m3">Quantity (m³)</Label><Input id="quantity_m3" type="number" min="0" step="0.001" value={formData.quantity_m3} onChange={(e) => handleChange('quantity_m3', e.target.value)} placeholder="e.g. 15.5" className={errors.quantity_m3 ? 'border-red-500' : ''} />{errors.quantity_m3 && <p className="text-xs text-red-500">{errors.quantity_m3}</p>}</div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="record_of_operation">Record of Operation *</Label>
                  <Textarea id="record_of_operation" value={formData.record_of_operation} onChange={(e) => handleChange('record_of_operation', e.target.value)} placeholder="Describe the operation in detail per MARPOL requirements. Include tank IDs, quantities, times, and positions where applicable." rows={5} className={errors.record_of_operation ? 'border-red-500' : ''} />
                  {errors.record_of_operation && <p className="text-xs text-red-500">{errors.record_of_operation}</p>}
                  {formData.operation_code && formData.item_number && <p className="text-xs text-slate-500">Item {formData.item_number}: {currentOperation?.items[formData.item_number]}</p>}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Certification</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="signed_by">Signed By *</Label>
                    <Input id="signed_by" value={formData.signed_by} onChange={(e) => handleChange('signed_by', e.target.value)} placeholder="Officer name" className={errors.signed_by ? 'border-red-500' : ''} />
                    {errors.signed_by && <p className="text-xs text-red-500">{errors.signed_by}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Rank *</Label>
                    <Select value={formData.rank} onValueChange={(v) => handleChange('rank', v)}>
                      <SelectTrigger className={errors.rank ? 'border-red-500' : ''}><SelectValue /></SelectTrigger>
                      <SelectContent>{RANKS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                    </Select>
                    {errors.rank && <p className="text-xs text-red-500">{errors.rank}</p>}
                  </div>
                </div>
                <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-600">
                  <p className="font-medium text-slate-900 mb-1">MARPOL Declaration</p>
                  <p>I confirm that this entry accurately records the operation performed on the date and time stated, and that all particulars are correct to the best of my knowledge.</p>
                </div>
              </CardContent>
              <CardFooter className="gap-2">
                <Button type="submit"><Save className="w-4 h-4 mr-2" />{isEditing ? 'Update Entry' : 'Save Entry'}</Button>
                <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="templates">
            <Card>
              <CardHeader><CardTitle className="text-base">Quick Entry Templates</CardTitle></CardHeader>
              <CardContent>
                {templates.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <p>No templates available. Create templates from the Templates page.</p>
                    <Button variant="outline" className="mt-3" onClick={() => onNavigate('templates')}>Go to Templates</Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {templates.map((template) => (
                      <button key={template.id} type="button" onClick={() => handleTemplateSelect(template.id)} className={`text-left p-4 rounded-lg border transition-colors hover:border-blue-400 hover:bg-blue-50 ${selectedTemplate?.id === template.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200'}`}>
                        <div className="flex items-start gap-3">
                          <div className="bg-blue-100 text-blue-700 rounded-lg w-10 h-10 flex items-center justify-center font-bold flex-shrink-0">{template.operation_code}</div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{template.name}</p>
                            <p className="text-xs text-slate-500 mt-1">{template.description}</p>
                            <p className="text-xs text-slate-400 mt-1">Used {template.use_count || 0} times</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="location">
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><MapPin className="w-4 h-4" />Position and Speed</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label htmlFor="position_lat">Latitude</Label><Input id="position_lat" value={formData.position_lat} onChange={(e) => handleChange('position_lat', e.target.value)} placeholder="e.g. 35°27.5' N" /></div>
                  <div className="space-y-2"><Label htmlFor="position_lon">Longitude</Label><Input id="position_lon" value={formData.position_lon} onChange={(e) => handleChange('position_lon', e.target.value)} placeholder="e.g. 140°58.6' E" /></div>
                </div>
                <div className="space-y-2"><Label htmlFor="ship_speed_knots">Ship Speed (knots)</Label><Input id="ship_speed_knots" type="number" min="0" step="0.1" value={formData.ship_speed_knots} onChange={(e) => handleChange('ship_speed_knots', e.target.value)} placeholder="e.g. 12.5" className={errors.ship_speed_knots ? 'border-red-500' : ''} />{errors.ship_speed_knots && <p className="text-xs text-red-500">{errors.ship_speed_knots}</p>}</div>
              </CardContent>
              <CardFooter className="block"><p className="text-xs text-slate-500">Position and speed are required for certain MARPOL operations (e.g., discharge of ballast).</p>{errors.position && <p className="text-xs text-red-500 mt-2">{errors.position}</p>}</CardFooter>
            </Card>
          </TabsContent>
        </form>
      </Tabs>
    </div>
  )
}
