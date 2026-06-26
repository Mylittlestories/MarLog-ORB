import { useApp } from '@/context/AppContext.jsx'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog.jsx'
import { ClipboardList, Plus, Trash2, Edit2, Search } from 'lucide-react'
import { useState } from 'react'
import { MARPOL_OPERATIONS, OPERATION_CODES, RANKS } from '@/data/marpolOperations.js'

const emptyTemplate = { name: '', description: '', operation_code: '', item_number: '', record_of_operation: '', tank_id: '', rank: 'Chief Engineer' }

export function Templates() {
  const { state, dispatch } = useApp()
  const { templates } = state

  const [showForm, setShowForm] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [formData, setFormData] = useState(emptyTemplate)
  const [errors, setErrors] = useState({})
  const [searchTerm, setSearchTerm] = useState('')

  const filteredTemplates = templates.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.operation_code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleOpenForm = (template = null) => {
    if (template) { setEditingTemplate(template); setFormData({ ...template }) }
    else { setEditingTemplate(null); setFormData(emptyTemplate) }
    setErrors({}); setShowForm(true)
  }

  const handleCloseForm = () => { setShowForm(false); setEditingTemplate(null); setFormData(emptyTemplate) }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: null }))
    if (field === 'operation_code') setFormData(prev => ({ ...prev, item_number: '' }))
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.name.trim()) newErrors.name = 'Name is required'
    if (!formData.operation_code) newErrors.operation_code = 'Operation code is required'
    if (!formData.item_number) newErrors.item_number = 'Item number is required'
    if (!formData.record_of_operation.trim()) newErrors.record_of_operation = 'Record text is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    if (editingTemplate) dispatch({ type: 'UPDATE_TEMPLATE', payload: { id: editingTemplate.id, ...formData } })
    else dispatch({ type: 'ADD_TEMPLATE', payload: formData })
    handleCloseForm()
  }

  const handleDelete = (templateId) => { if (confirm('Delete this template?')) dispatch({ type: 'DELETE_TEMPLATE', payload: templateId }) }

  const currentOperation = formData.operation_code ? MARPOL_OPERATIONS[formData.operation_code] : null

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><ClipboardList className="w-6 h-6" /> Entry Templates</h1>
          <p className="text-slate-500 mt-1">Pre-configured templates for common MARPOL operations</p>
        </div>
        <Button onClick={() => handleOpenForm()}><Plus className="w-4 h-4 mr-2" /> New Template</Button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input placeholder="Search templates..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 max-w-md" />
      </div>

      {filteredTemplates.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">No templates found</p>
          <Button className="mt-4" onClick={() => handleOpenForm()}><Plus className="w-4 h-4 mr-2" /> Create First Template</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 text-blue-700 rounded-lg w-10 h-10 flex items-center justify-center font-bold text-sm">{template.operation_code}</div>
                    <div><CardTitle className="text-sm">{template.name}</CardTitle><p className="text-xs text-slate-500 mt-0.5">Item {template.item_number}</p></div>
                  </div>
                  <Badge variant="secondary">{template.use_count || 0} uses</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-slate-500 mb-3">{template.description}</p>
                <p className="text-xs text-slate-700 line-clamp-3 bg-slate-50 rounded p-2">{template.record_of_operation}</p>
              </CardContent>
              <CardFooter className="pt-0 gap-1">
                <Button variant="ghost" size="sm" onClick={() => handleOpenForm(template)} className="h-7 text-xs"><Edit2 className="w-3 h-3 mr-1" /> Edit</Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(template.id)} className="h-7 text-xs text-red-500 hover:text-red-600"><Trash2 className="w-3 h-3 mr-1" /> Delete</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={handleCloseForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingTemplate ? 'Edit Template' : 'New Template'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Template Name *</Label>
              <Input id="name" value={formData.name} onChange={(e) => handleChange('name', e.target.value)} placeholder="e.g. Routine Bilge Discharge" className={errors.name ? 'border-red-500' : ''} />
              {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
            </div>
            <div className="space-y-2"><Label htmlFor="description">Description</Label><Input id="description" value={formData.description} onChange={(e) => handleChange('description', e.target.value)} placeholder="Brief description of when to use this template" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Operation Code *</Label>
                <Select value={formData.operation_code} onValueChange={(v) => handleChange('operation_code', v)}>
                  <SelectTrigger className={errors.operation_code ? 'border-red-500' : ''}><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>{OPERATION_CODES.map(code => <SelectItem key={code} value={code}>{code}) {MARPOL_OPERATIONS[code].name.split('(')[0].trim()}</SelectItem>)}</SelectContent>
                </Select>
                {errors.operation_code && <p className="text-xs text-red-500">{errors.operation_code}</p>}
              </div>
              <div className="space-y-2">
                <Label>Item Number *</Label>
                <Select value={formData.item_number} onValueChange={(v) => handleChange('item_number', v)} disabled={!formData.operation_code}>
                  <SelectTrigger className={errors.item_number ? 'border-red-500' : ''}><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>{currentOperation && Object.entries(currentOperation.items).map(([num, text]) => <SelectItem key={num} value={num}>{num}. {text}</SelectItem>)}</SelectContent>
                </Select>
                {errors.item_number && <p className="text-xs text-red-500">{errors.item_number}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="record_of_operation">Record Text (with placeholders) *</Label>
              <Textarea id="record_of_operation" value={formData.record_of_operation} onChange={(e) => handleChange('record_of_operation', e.target.value)} placeholder='Use [PLACEHOLDER] for fields to be filled in at entry time. Example: "Bilge water discharged via OWS. Reading: [READING] ppm. Quantity: [QUANTITY] m³"' rows={4} className={errors.record_of_operation ? 'border-red-500' : ''} />
              {errors.record_of_operation && <p className="text-xs text-red-500">{errors.record_of_operation}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label htmlFor="tank_id">Default Tank ID</Label><Input id="tank_id" value={formData.tank_id} onChange={(e) => handleChange('tank_id', e.target.value)} /></div>
              <div className="space-y-2">
                <Label>Default Rank</Label>
                <Select value={formData.rank} onValueChange={(v) => handleChange('rank', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{RANKS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseForm}>Cancel</Button>
              <Button type="submit">{editingTemplate ? 'Update' : 'Create'} Template</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
