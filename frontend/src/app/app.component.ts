import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService, Task } from './services/task.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'IKIS Task Manager';
  tasks: Task[] = [];
  filteredTasks: Task[] = [];
  filter: 'all' | 'todo' | 'in_progress' | 'done' = 'all';

  // Form Model
  newTaskTitle = '';
  newTaskDescription = '';
  newTaskPriority: 'low' | 'medium' | 'high' = 'medium';
  newTaskDueDate = '';

  // Loading & Error states
  loading = false;
  errorMessage = '';

  // Success message state
  toastMessage = '';
  showToast = false;

  constructor(private taskService: TaskService) {}

  ngOnInit(): void {
    this.loadTasks();
  }

  loadTasks(): void {
    this.loading = true;
    this.errorMessage = '';
    this.taskService.getTasks().subscribe({
      next: (data) => {
        this.tasks = data;
        this.applyFilter();
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'No se pudo cargar las tareas. Asegúrate de que el backend está corriendo y configurado.';
        this.loading = false;
      }
    });
  }

  applyFilter(): void {
    if (this.filter === 'all') {
      this.filteredTasks = [...this.tasks];
    } else {
      this.filteredTasks = this.tasks.filter(t => t.status === this.filter);
    }
  }

  setFilter(filter: 'all' | 'todo' | 'in_progress' | 'done'): void {
    this.filter = filter;
    this.applyFilter();
  }

  addTask(): void {
    if (!this.newTaskTitle.trim()) return;

    const task: Task = {
      title: this.newTaskTitle,
      description: this.newTaskDescription || undefined,
      status: 'todo',
      priority: this.newTaskPriority,
      dueDate: this.newTaskDueDate || undefined
    };

    this.taskService.createTask(task).subscribe({
      next: (created) => {
        this.tasks.unshift(created);
        this.applyFilter();
        this.triggerToast('¡Tarea creada exitosamente!');
        this.resetForm();
      },
      error: (err) => {
        console.error(err);
        this.triggerToast('Error al crear la tarea');
      }
    });
  }

  updateTaskStatus(task: Task, newStatus: 'todo' | 'in_progress' | 'done'): void {
    if (!task.id) return;
    this.taskService.updateTask(task.id, { status: newStatus }).subscribe({
      next: (updated) => {
        task.status = updated.status;
        task.updatedAt = updated.updatedAt;
        this.applyFilter();
        this.triggerToast(`Tarea marcada como: ${newStatus.replace('_', ' ')}`);
      },
      error: (err) => {
        console.error(err);
        this.triggerToast('Error al actualizar el estado');
      }
    });
  }

  deleteTask(task: Task): void {
    if (!task.id) return;
    if (!confirm('¿Estás seguro de eliminar esta tarea?')) return;

    this.taskService.deleteTask(task.id).subscribe({
      next: () => {
        this.tasks = this.tasks.filter(t => t.id !== task.id);
        this.applyFilter();
        this.triggerToast('Tarea eliminada con éxito');
      },
      error: (err) => {
        console.error(err);
        this.triggerToast('Error al eliminar la tarea');
      }
    });
  }

  getCompletedPercentage(): number {
    if (this.tasks.length === 0) return 0;
    const completed = this.tasks.filter(t => t.status === 'done').length;
    return Math.round((completed / this.tasks.length) * 100);
  }

  getTaskCountByStatus(status: 'todo' | 'in_progress' | 'done'): number {
    return this.tasks.filter(t => t.status === status).length;
  }

  triggerToast(message: string): void {
    this.toastMessage = message;
    this.showToast = true;
    setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }

  resetForm(): void {
    this.newTaskTitle = '';
    this.newTaskDescription = '';
    this.newTaskPriority = 'medium';
    this.newTaskDueDate = '';
  }
}
