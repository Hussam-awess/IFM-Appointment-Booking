"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Settings, Plus, Trash2 } from "lucide-react"

interface AvailabilitySlot {
  id: string
  day_of_week: number
  start_time: string
  end_time: string
  is_active: boolean
}

interface ManageAvailabilityDialogProps {
  lecturerId: string
  onUpdate: () => void
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

export function ManageAvailabilityDialog({ lecturerId, onUpdate }: ManageAvailabilityDialogProps) {
  const [open, setOpen] = useState(false)
  const [slots, setSlots] = useState<AvailabilitySlot[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const fetchSlots = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("availability_slots")
      .select("*")
      .eq("lecturer_id", lecturerId)
      .order("day_of_week", { ascending: true })
      .order("start_time", { ascending: true })

    if (!error && data) {
      setSlots(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (open) {
      fetchSlots()
    }
  }, [open, lecturerId])

  const addSlot = async (dayOfWeek: number) => {
    setSaving(true)
    const { data, error } = await supabase
      .from("availability_slots")
      .insert({
        lecturer_id: lecturerId,
        day_of_week: dayOfWeek,
        start_time: "09:00",
        end_time: "10:00",
        is_active: true
      })
      .select()
      .single()

    if (!error && data) {
      setSlots([...slots, data])
    }
    setSaving(false)
  }

  const updateSlot = async (slotId: string, updates: Partial<AvailabilitySlot>) => {
    const { error } = await supabase
      .from("availability_slots")
      .update(updates)
      .eq("id", slotId)

    if (!error) {
      setSlots(slots.map(s => s.id === slotId ? { ...s, ...updates } : s))
    }
  }

  const deleteSlot = async (slotId: string) => {
    const { error } = await supabase
      .from("availability_slots")
      .delete()
      .eq("id", slotId)

    if (!error) {
      setSlots(slots.filter(s => s.id !== slotId))
    }
  }

  const handleClose = () => {
    setOpen(false)
    onUpdate()
  }

  const slotsByDay = DAYS.map((day, index) => ({
    day,
    dayIndex: index,
    slots: slots.filter(s => s.day_of_week === index)
  }))

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Settings className="h-4 w-4" />
          Manage Availability
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Your Availability</DialogTitle>
          <DialogDescription>
            Set your weekly schedule for student appointments. Students can only book during these times.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {slotsByDay.map(({ day, dayIndex, slots: daySlots }) => (
              <div key={day} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">{day}</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => addSlot(dayIndex)}
                    disabled={saving}
                    className="gap-1 text-xs"
                  >
                    <Plus className="h-3 w-3" />
                    Add Slot
                  </Button>
                </div>
                
                {daySlots.length === 0 ? (
                  <p className="text-sm text-muted-foreground pl-2">No availability set</p>
                ) : (
                  <div className="space-y-2">
                    {daySlots.map(slot => (
                      <div
                        key={slot.id}
                        className="flex items-center gap-3 p-3 border rounded-lg bg-card"
                      >
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={slot.is_active}
                            onCheckedChange={(checked) => updateSlot(slot.id, { is_active: checked })}
                          />
                        </div>
                        <div className="flex items-center gap-2 flex-1">
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Start</Label>
                            <Input
                              type="time"
                              value={slot.start_time.slice(0, 5)}
                              onChange={(e) => updateSlot(slot.id, { start_time: e.target.value })}
                              className="w-28 h-8 text-sm"
                            />
                          </div>
                          <span className="text-muted-foreground mt-5">to</span>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">End</Label>
                            <Input
                              type="time"
                              value={slot.end_time.slice(0, 5)}
                              onChange={(e) => updateSlot(slot.id, { end_time: e.target.value })}
                              className="w-28 h-8 text-sm"
                            />
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteSlot(slot.id)}
                          className="text-destructive hover:text-destructive h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end">
          <Button onClick={handleClose}>Done</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
