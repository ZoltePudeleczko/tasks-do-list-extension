import React, { useState, useEffect } from 'react';
import { GoogleTask } from '../types';
import { useTranslation } from '../i18n/TranslationContext';
import './TaskItem.css';

interface TaskItemProps {
  task: GoogleTask;
  onToggleComplete: (taskId: string, completed: boolean) => void;
  onEdit: (taskId: string, updates: Partial<GoogleTask>, closeEditView?: boolean) => void;
  onDelete: (taskId: string) => void;
  onMoveToTop?: (taskId: string) => void;
  isRecentlyCompleted?: boolean; // New prop to indicate recently completed tasks
  isEditing?: boolean;
  onStartEdit?: () => void;
  onCancelEdit?: () => void;
  isFirstTask?: boolean;
  sortBy?: 'myOrder' | 'date' | 'title';
}

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  onToggleComplete,
  onEdit,
  onDelete,
  onMoveToTop,
  isRecentlyCompleted = false,
  isEditing = false,
  onStartEdit,
  onCancelEdit,
  isFirstTask = false,
  sortBy = 'myOrder',
}) => {
  const { t } = useTranslation();
  const [editTitle, setEditTitle] = useState(task.title);
  const [editNotes, setEditNotes] = useState(task.notes || '');
  const [editDue, setEditDue] = useState(task.due ? task.due.split('T')[0] : '');
  const [validationError, setValidationError] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customDate, setCustomDate] = useState('');

  // Sync edit mode with isEditing prop
  useEffect(() => {
    if (isEditing) {
      setEditTitle(task.title);
      setEditNotes(task.notes || '');
      setEditDue(task.due ? task.due.split('T')[0] : '');
      setValidationError('');
      setHasChanges(false);
    }
  }, [isEditing, task.title, task.notes, task.due]);

  // Check for changes
  useEffect(() => {
    if (isEditing) {
      const originalDue = task.due ? task.due.split('T')[0] : '';
      const hasTitleChanged = editTitle !== task.title;
      const hasNotesChanged = editNotes !== (task.notes || '');
      const hasDueChanged = editDue !== originalDue;
      
      setHasChanges(hasTitleChanged || hasNotesChanged || hasDueChanged);
    }
  }, [isEditing, editTitle, editNotes, editDue, task.title, task.notes, task.due]);

  // Clear save timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
    };
  }, [saveTimeout]);





  const handleToggleComplete = () => {
    onToggleComplete(task.id, task.status !== 'completed');
  };



  const handleSave = async () => {
    if (!editTitle.trim()) {
      setValidationError(t('validation.taskTitleRequired'));
      return;
    }
    
    if (isSaving) return; // Prevent multiple saves
    
    setIsSaving(true);
    setValidationError('');
    
    try {
      const updates: Partial<GoogleTask> = {
        title: editTitle.trim(),
        notes: editNotes.trim() || undefined,
      };

      // Handle due date - Google Tasks API expects ISO datetime string
      if (editDue) {
        // Convert date-only to ISO datetime string (midnight local time)
        // Use a timezone-aware approach to avoid UTC conversion issues
        const [year, month, day] = editDue.split('-').map(Number);
        // Create date in local timezone and format as YYYY-MM-DDTHH:mm:ss.sssZ
        const localDate = new Date(year, month - 1, day, 0, 0, 0, 0);
        const offset = localDate.getTimezoneOffset() * 60000; // Convert to milliseconds
        const localISOString = new Date(localDate.getTime() - offset).toISOString();
        updates.due = localISOString;
      } else {
        updates.due = ''; // Send empty string instead of undefined
      }

      await onEdit(task.id, updates);
      
      // Exit editing mode after successful save
      onCancelEdit?.();
    } catch (error) {
      setValidationError(t('validation.failedToSaveTask'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelayedSave = () => {
    // Clear any existing timeout
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    
    // Set a new timeout for delayed save
    const timeout = setTimeout(() => {
      if (hasChanges) {
        handleSave();
      }
    }, 500); // 500ms delay
    
    setSaveTimeout(timeout);
  };

  const handleCancel = () => {
    if (hasChanges) {
      const confirmed = confirm(t('validation.unsavedChangesConfirm'));
      if (!confirmed) return;
    }
    
    setEditTitle(task.title);
    setEditNotes(task.notes || '');
    setEditDue(task.due ? task.due.split('T')[0] : '');
    setValidationError('');
    setHasChanges(false);
    
    // Notify parent to stop editing
    onCancelEdit?.();
  };



  const formatDueDate = (dueDate: string) => {
    const date = new Date(dueDate);
    
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return t('dateGroups.today');
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return t('dateGroups.tomorrow');
    } else {
      // Use the same format as formatCustomDate
      const nextYear = new Date(today.getFullYear() + 1, 0, 1); // January 1st of next year
      
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      
      // If the date is in the next year, include the year
      if (date >= nextYear) {
        return `${day}.${month}.${year}`;
      } else {
        return `${day}.${month}`;
      }
    }
  };

  const formatCompletedDate = (completedDate: string) => {
    const date = new Date(completedDate);
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const dayName = dayNames[date.getDay()];
    const day = date.getDate();
    const month = monthNames[date.getMonth()];
    
    const dateString = `${dayName}, ${day} ${month}`;
    return `${t('tasks.completed')}: ${dateString}`;
  };

  const isCompleted = task.status === 'completed';

  // Helper functions for date selection
  const getTodayDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatCustomDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const nextYear = new Date(today.getFullYear() + 1, 0, 1); // January 1st of next year
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    // If the date is in the next year, include the year
    if (date >= nextYear) {
      return `${day}.${month}.${year}`;
    } else {
      return `${day}.${month}`;
    }
  };

  const isCustomDate = (dateString: string) => {
    const today = getTodayDate();
    const tomorrow = getTomorrowDate();
    return dateString && dateString !== today && dateString !== tomorrow;
  };





  if (isEditing) {
    return (
      <div className="task-item editing">
        <div className="task-content">
          <button
            onClick={handleToggleComplete}
            className={`task-checkbox ${isCompleted ? 'checked' : ''}`}
            aria-label={isCompleted ? t('tasks.markAsIncomplete') : t('tasks.markAsComplete')}
          >
            {isCompleted && <span className="checkmark">✓</span>}
          </button>
          
          <div 
            className="task-edit-inline"
            onClick={(e) => {
              // If clicking on the container but not on inputs, exit editing
              if (e.target === e.currentTarget) {
                if (hasChanges) {
                  handleSave();
                }
                onCancelEdit?.();
              }
            }}
          >
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleDelayedSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSave();
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  handleCancel();
                }
              }}
              placeholder={t('tasks.taskTitle')}
              className="task-title-input-inline"
              autoFocus
            />
            
            <textarea
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              onBlur={handleDelayedSave}
              placeholder={t('tasks.addNotes')}
              className="task-notes-input-inline"
              rows={2}
            />
            
            <div className="task-due-inline">
              <div className="due-pills-inline">
                <button 
                  className={`due-pill-inline ${editDue === getTodayDate() ? 'selected' : ''}`}
                  onClick={() => {
                    const todayDate = getTodayDate();
                    setEditDue(todayDate);
                    // Immediate visual feedback - update local state right away
                    const [year, month, day] = todayDate.split('-').map(Number);
                    const localDate = new Date(year, month - 1, day, 0, 0, 0, 0);
                    const offset = localDate.getTimezoneOffset() * 60000;
                    const localISOString = new Date(localDate.getTime() - offset).toISOString();
                    const updates: Partial<GoogleTask> = {
                      title: editTitle.trim(),
                      notes: editNotes.trim() || undefined,
                      due: localISOString
                    };
                    onEdit(task.id, updates, false);
                  }}
                >
                  {t('dateGroups.today')}
                </button>
                <button 
                  className={`due-pill-inline ${editDue === getTomorrowDate() ? 'selected' : ''}`}
                  onClick={() => {
                    const tomorrowDate = getTomorrowDate();
                    setEditDue(tomorrowDate);
                    // Immediate visual feedback - update local state right away
                    const [year, month, day] = tomorrowDate.split('-').map(Number);
                    const localDate = new Date(year, month - 1, day, 0, 0, 0, 0);
                    const offset = localDate.getTimezoneOffset() * 60000;
                    const localISOString = new Date(localDate.getTime() - offset).toISOString();
                    const updates: Partial<GoogleTask> = {
                      title: editTitle.trim(),
                      notes: editNotes.trim() || undefined,
                      due: localISOString
                    };
                    onEdit(task.id, updates, false);
                  }}
                >
                  {t('dateGroups.tomorrow')}
                </button>

                {showDatePicker && (
                  <input
                    type="date"
                    value={customDate}
                    onChange={(e) => {
                      const selectedDate = e.target.value;
                      setCustomDate(selectedDate);
                      if (selectedDate) {
                        setEditDue(selectedDate);
                        // Immediate visual feedback - update local state right away
                        const [year, month, day] = selectedDate.split('-').map(Number);
                        const localDate = new Date(year, month - 1, day, 0, 0, 0, 0);
                        const offset = localDate.getTimezoneOffset() * 60000;
                        const localISOString = new Date(localDate.getTime() - offset).toISOString();
                        const updates: Partial<GoogleTask> = {
                          title: editTitle.trim(),
                          notes: editNotes.trim() || undefined,
                          due: localISOString
                        };
                        onEdit(task.id, updates, false);
                        setShowDatePicker(false);
                      }
                    }}
                    className="date-picker-input"
                    min={getTodayDate()}
                  />
                )}

                {isCustomDate(editDue) && (
                  <button 
                    className="due-pill-inline custom-date"
                    onClick={() => setShowDatePicker(!showDatePicker)}
                    title={t('tasks.selectDate')}
                  >
                    {formatCustomDate(editDue)}
                  </button>
                )}

                {!isCustomDate(editDue) && (
                  <button 
                    className="due-pill-inline calendar"
                    onClick={() => setShowDatePicker(!showDatePicker)}
                    title={t('tasks.selectDate')}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                  </button>
                )}

                
                {editDue && (
                  <button 
                    className="due-pill-inline clear"
                    onClick={() => {
                      setEditDue('');
                      // Immediate visual feedback - update local state right away
                      const updates: Partial<GoogleTask> = {
                        title: editTitle.trim(),
                        notes: editNotes.trim() || undefined,
                        due: '' // Send empty string instead of undefined
                      };
                      onEdit(task.id, updates, false);
                    }}
                    title={t('tasks.clearDueDate')}
                  >
                    ×
                  </button>
                )}
              </div>
              
            </div>
            
            {validationError && (
              <div className="validation-error-inline">{validationError}</div>
            )}
            
            <div className="task-edit-actions">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="task-save-btn"
                title={t('common.save')}
              >
                {isSaving ? t('common.loading') : t('common.save')}
              </button>
              <button
                onClick={() => onDelete(task.id)}
                className="task-delete-btn-inline"
                title={t('tasks.removeTask')}
              >
                {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
        


      </div>
    );
  }

  return (
    <div 
      className={`task-item ${isCompleted ? 'completed' : ''} ${isRecentlyCompleted ? 'recently-completed' : ''}`} 
    >
      <div className="task-content">
        <button
          onClick={handleToggleComplete}
          className={`task-checkbox ${isCompleted ? 'checked' : ''}`}
          aria-label={isCompleted ? t('tasks.markAsIncomplete') : t('tasks.markAsComplete')}
        >
          {isCompleted && <span className="checkmark">✓</span>}
        </button>
        
        <div 
          className="task-details" 
          onClick={onStartEdit}
          onDoubleClick={onStartEdit}
          title={t('tasks.clickToEdit')}
        >
          <div className="task-title">
            {task.title}
          </div>
          {task.notes && <div className="task-notes">{task.notes}</div>}
          {isCompleted && task.completed && (
            <div className="task-completed">
              {formatCompletedDate(task.completed)}
            </div>
          )}
          {!isCompleted && task.due && sortBy !== 'date' && (
            <div className={`task-due ${new Date(task.due) < new Date() ? 'overdue' : ''}`}>
              {formatDueDate(task.due)}
            </div>
          )}
          {isCompleted && task.due && sortBy !== 'date' && (
            <div className="task-due task-due-completed">
              {formatDueDate(task.due)}
            </div>
          )}
        </div>
        
        <div className="task-actions">
          {isCompleted ? (
            // For completed tasks, show the delete button
            <button
              onClick={() => onDelete(task.id)}
              className="task-delete-btn"
              aria-label={t('tasks.removeTask')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3,6 5,6 21,6"></polyline>
                <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
              </svg>
            </button>
          ) : (
            // For incomplete tasks, show move to top and remove buttons directly
            <div className="task-action-buttons">
              {onMoveToTop && sortBy === 'myOrder' && !isFirstTask && (
                <button
                  onClick={() => onMoveToTop(task.id)}
                  className="task-move-to-top-btn"
                  aria-label={t('tasks.moveToTop')}
                  title={t('tasks.moveToTop')}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 15l-6-6-6 6"/>
                  </svg>
                </button>
              )}
              <button
                onClick={() => onDelete(task.id)}
                className="task-delete-btn"
                aria-label={t('tasks.removeTask')}
                title={t('tasks.removeTask')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3,6 5,6 21,6"></polyline>
                  <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 