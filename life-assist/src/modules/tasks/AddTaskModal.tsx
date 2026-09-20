import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Field, inputClass } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { useTasksStore } from '@/store/useTasksStore';
import { useRemindersStore } from '@/store/useRemindersStore';
import { useUIStore } from '@/store/useUIStore';
import type { Priority, TaskRepeat } from '@/types';

export function AddTaskModal() {
  const isOpen = useUIStore((s) => s.activeModal === 'addTask');
  const modalPayload = useUIStore((s) => s.modalPayload);
  const closeModal = useUIStore((s) => s.closeModal);
  const showToast = useUIStore((s) => s.showToast);
  
  const tasks = useTasksStore((s) => s.tasks);
  const addTask = useTasksStore((s) => s.addTask);
  const updateTask = useTasksStore((s) => s.updateTask);
  const addAlarm = useRemindersStore((s) => s.addAlarm);

  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [repeat, setRepeat] = useState<TaskRepeat>('none');
  const [reminder, setReminder] = useState(false);

  const editMode = typeof modalPayload === 'string';
  const taskToEdit = editMode ? tasks.find(t => t.id === modalPayload) : null;

  useEffect(() => {
    if (isOpen) {
      if (taskToEdit) {
        setTitle(taskToEdit.title);
        setDate(taskToEdit.dueDate || '');
        setTime(taskToEdit.dueTime || '');
        setPriority(taskToEdit.priority);
        setRepeat(taskToEdit.repeat || 'none');
        setReminder(false);
      } else {
        reset();
      }
    }
  }, [isOpen, taskToEdit]);

  function reset() {
    setTitle('');
    setDate('');
    setTime('');
    setPriority('medium');
    setRepeat('none');
    setReminder(false);
  }

  function handleSubmit() {
    if (!title.trim()) return;
    
    if (editMode && taskToEdit) {
      updateTask(taskToEdit.id, { 
        title, 
        dueDate: date || null, 
        dueTime: time || null, 
        priority, 
        repeat 
      });
      showToast('Task updated.', 'success');
    } else {
      const task = addTask({ title, dueDate: date || null, dueTime: time || null, priority, repeat });
      if (reminder && date && time) {
        addAlarm({ title: `Task reminder: ${title}`, time, repeat: 'once', linkedTaskId: task.id });
      }
      showToast('Task added.', 'success');
    }

    reset();
    closeModal();
  }

  return (
    <Modal
      title={editMode ? "Edit task" : "Add task"}
      isOpen={isOpen}
      onClose={() => {
        reset();
        closeModal();
      }}
      footer={
        <>
          <Button variant="secondary" onClick={closeModal}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!title.trim()}>
            {editMode ? "Save changes" : "Add task"}
          </Button>
        </>
      }
    >
      <Field label="Title" htmlFor="task-title">
        <input
          id="task-title"
          className={inputClass}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          autoFocus
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Due date" htmlFor="task-date">
          <input
            id="task-date"
            type="date"
            className={inputClass}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </Field>
        <Field label="Due time" htmlFor="task-time">
          <input
            id="task-time"
            type="time"
            className={inputClass}
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Priority" htmlFor="task-priority">
          <select
            id="task-priority"
            className={inputClass}
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </Field>
        <Field label="Repeat" htmlFor="task-repeat">
          <select
            id="task-repeat"
            className={inputClass}
            value={repeat}
            onChange={(e) => setRepeat(e.target.value as TaskRepeat)}
          >
            <option value="none">Does not repeat</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </Field>
      </div>
      {!editMode && (
        <label className="flex items-center gap-2 text-sm text-ink-muted">
          <input
            type="checkbox"
            checked={reminder}
            onChange={(e) => setReminder(e.target.checked)}
            disabled={!date || !time}
            className="h-4 w-4 accent-accent-cyan"
          />
          Also set a reminder for the due date/time
        </label>
      )}
    </Modal>
  );
}
