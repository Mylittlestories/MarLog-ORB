import { useApp } from '@/context/AppContext.jsx'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Save, Ship } from 'lucide-react'
import { useState, useEffect } from 'react'
import { validateIMO } from '@/lib/utils.js'
import { VESSEL_TYPES } from '@/data/marpolOperations.js'

export function VesselProfile() {
  const { state, dispatch } = useApp()
  const { vessel } = state

  const [formData, setFormData] = useState({
    vessel_name: '', imo_number: '', flag_state: '', gross_tonnage: '',
    vessel_type: 'oil_tanker',
    oily_water_separator_capacity: '', oil_content_monitor_type: '',
    incinerator_capacity: '', slop_tank_capacity: '', sludge_tank_capacity: '', bilge_tank_capacity: ''
  })
  const [errors, setErrors] = useState({})
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (vessel) {
      setFormData({
        vessel_name: vessel.vessel_name || '',
        imo_number: vessel.imo_number || '',
        flag_state: vessel.flag_state || '',
        gross_tonnage: vessel.gross_tonnage || '',
        vessel_type: vessel.vessel_type || 'oil_tanker',
        oily_water_separator_capacity: vessel.oily_water_separator_capacity || '',
        oil_content_monitor_type: vessel.oil_content_monitor_type || '',
        incinerator_capacity: vessel.incinerator_capacity || '',
        slop_tank_capacity: vessel.slop_tank_capacity || '',
        sludge_tank_capacity: vessel.sludge_tank_capacity || '',
        bilge_tank_capacity: vessel.bilge_tank_capacity || ''
      })
    }
  }, [vessel])

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: null }))
    setSaved(false)
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.vessel_name.trim()) newErrors.vessel_name = 'Vessel name is required'
    if (formData.imo_number && !validateIMO(formData.imo_number)) newErrors.imo_number = 'IMO number must be 7 digits with a valid check digit'
    if (formData.gross_tonnage && isNaN(Number(formData.gross_tonnage))) newErrors.gross_tonnage = 'Must be a number'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    dispatch({
      type: 'SET_VESSEL',
      payload: {
        ...formData,
        gross_tonnage: formData.gross_tonnage ? Number(formData.gross_tonnage) : 0,
        oily_water_separator_capacity: formData.oily_water_separator_capacity ? Number(formData.oily_water_separator_capacity) : 0,
        incinerator_capacity: formData.incinerator_capacity ? Number(formData.incinerator_capacity) : 0,
        slop_tank_capacity: formData.slop_tank_capacity ? Number(formData.slop_tank_capacity) : 0,
        sludge_tank_capacity: formData.sludge_tank_capacity ? Number(formData.sludge_tank_capacity) : 0,
        bilge_tank_capacity: formData.bilge_tank_capacity ? Number(formData.bilge_tank_capacity) : 0
      }
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Ship className="w-6 h-6" /> Vessel Profile</h1>
        <p className="text-slate-500 mt-1">Configure your vessel details for MARPOL compliance records</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vessel_name">Vessel Name *</Label>
                <Input id="vessel_name" value={formData.vessel_name} onChange={(e) => handleChange('vessel_name', e.target.value)} placeholder="e.g. MT Ocean Pioneer" className={errors.vessel_name ? 'border-red-500' : ''} />
                {errors.vessel_name && <p className="text-xs text-red-500">{errors.vessel_name}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="imo_number">IMO Number</Label>
                <Input id="imo_number" value={formData.imo_number} onChange={(e) => handleChange('imo_number', e.target.value)} placeholder="e.g. 9212345" maxLength={7} className={errors.imo_number ? 'border-red-500' : ''} />
                {errors.imo_number && <p className="text-xs text-red-500">{errors.imo_number}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="flag_state">Flag State</Label>
                <Input id="flag_state" value={formData.flag_state} onChange={(e) => handleChange('flag_state', e.target.value)} placeholder="e.g. Panama" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gross_tonnage">Gross Tonnage</Label>
                <Input id="gross_tonnage" type="number" value={formData.gross_tonnage} onChange={(e) => handleChange('gross_tonnage', e.target.value)} placeholder="e.g. 15000" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="vessel_type">Vessel Type *</Label>
              <Select value={formData.vessel_type} onValueChange={(v) => handleChange('vessel_type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {VESSEL_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader><CardTitle>Equipment Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="oil_content_monitor_type">Oil Content Monitor Type</Label>
                <Input id="oil_content_monitor_type" value={formData.oil_content_monitor_type} onChange={(e) => handleChange('oil_content_monitor_type', e.target.value)} placeholder="e.g. Yokogawa OCM II" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="oily_water_separator_capacity">OWS Capacity (m³/h)</Label>
                <Input id="oily_water_separator_capacity" type="number" value={formData.oily_water_separator_capacity} onChange={(e) => handleChange('oily_water_separator_capacity', e.target.value)} placeholder="e.g. 10" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label htmlFor="slop_tank_capacity">Slop Tank (m³)</Label><Input id="slop_tank_capacity" type="number" value={formData.slop_tank_capacity} onChange={(e) => handleChange('slop_tank_capacity', e.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="sludge_tank_capacity">Sludge Tank (m³)</Label><Input id="sludge_tank_capacity" type="number" value={formData.sludge_tank_capacity} onChange={(e) => handleChange('sludge_tank_capacity', e.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="bilge_tank_capacity">Bilge Holding Tank (m³)</Label><Input id="bilge_tank_capacity" type="number" value={formData.bilge_tank_capacity} onChange={(e) => handleChange('bilge_tank_capacity', e.target.value)} /></div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="incinerator_capacity">Incinerator Capacity (m³/h)</Label>
              <Input id="incinerator_capacity" type="number" value={formData.incinerator_capacity} onChange={(e) => handleChange('incinerator_capacity', e.target.value)} />
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button type="submit"><Save className="w-4 h-4 mr-2" />{saved ? 'Saved!' : 'Save Profile'}</Button>
            {saved && <span className="text-sm text-green-600 flex items-center">✓ Profile updated</span>}
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
