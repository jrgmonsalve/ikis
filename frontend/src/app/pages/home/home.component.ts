import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import {
  AccountDto,
  AccountInputDto,
  AccountType,
  ApiService,
  CategoryDto,
  CategoryInputDto,
  CategoryKind,
  TransactionDto,
  TransactionInputDto,
  TransactionType
} from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

type ActivePanel = 'dashboard' | 'transaction' | 'account' | 'category';

interface AccountForm {
  id?: string;
  name: string;
  type: AccountType;
  currency: string;
  balance: number;
}

interface CategoryForm {
  id?: string;
  name: string;
  kind: CategoryKind;
  color: string;
}

interface TransactionForm {
  type: TransactionType;
  amount: number;
  categoryId: string;
  fromAccountId: string;
  toAccountId: string;
  transactionDate: string;
  description: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <main class="min-h-screen bg-slate-50 pb-28 text-slate-900">
      <header class="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur">
        <div class="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-700 text-white shadow-sm">
              <i class="fa-solid fa-wallet text-base"></i>
            </div>
            <div>
              <p class="text-[10px] font-bold uppercase tracking-wider text-teal-700 leading-none">Ikis Control</p>
              <h1 class="text-base font-bold text-slate-800 mt-1">Dashboard</h1>
            </div>
          </div>
          <button
            type="button"
            class="rounded-xl border border-slate-250 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
            (click)="auth.isAuthenticated() ? signOut() : signIn()"
          >
            <i class="fa-solid" [ngClass]="auth.isAuthenticated() ? 'fa-right-from-bracket mr-1.5' : 'fa-right-to-bracket mr-1.5'"></i>
            {{ auth.isAuthenticated() ? 'Cerrar Sesión' : 'Iniciar Sesión' }}
          </button>
        </div>
      </header>

      <section class="mx-auto max-w-6xl px-4 py-6">
        @if (message()) {
          <div class="mb-5 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-xs font-semibold text-teal-900 flex items-center gap-2">
            <i class="fa-solid fa-circle-check text-base text-teal-600"></i>
            <span>{{ message() }}</span>
          </div>
        }

        @if (error()) {
          <div class="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-900 flex items-center gap-2">
            <i class="fa-solid fa-circle-exclamation text-base text-rose-600"></i>
            <span>{{ error() }}</span>
          </div>
        }

        @if (activePanel() === 'dashboard') {
          <section class="grid gap-6 lg:grid-cols-[1fr_360px]">
            <div class="space-y-6">
              <!-- Available Balance Banner -->
              <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-900 via-teal-800 to-teal-700 px-6 py-6 text-white shadow-md">
                <div class="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-teal-600/20 blur-xl"></div>
                <div class="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-emerald-500/10 blur-xl"></div>
                
                <div class="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <span class="text-xs font-semibold uppercase tracking-wider text-teal-200">Balance total disponible</span>
                    <h2 class="mt-1.5 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
                      {{ formatMoney(totalBalance()) }}
                    </h2>
                    <div class="mt-3 flex items-center gap-2 text-sm text-teal-100">
                      <span class="inline-flex h-2.5 w-2.5 items-center justify-center rounded-full bg-emerald-400"></span>
                      <span>{{ accounts().length }} {{ accounts().length === 1 ? 'cuenta activa' : 'cuentas activas' }}</span>
                    </div>
                  </div>
                  
                  <div class="flex items-center gap-3 self-start sm:self-center">
                    <button 
                      type="button" 
                      class="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur hover:bg-white/20 transition-all shadow-sm"
                      (click)="openTransactionPanel()"
                    >
                      <i class="fa-solid fa-circle-plus"></i>
                      <span>Registrar Movimiento</span>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Accounts Section -->
              <section>
                <div class="mb-4">
                  <h2 class="text-lg font-bold text-slate-800">Tus Cuentas</h2>
                  <p class="text-xs text-slate-400">Listado completo de saldos disponibles</p>
                </div>
                
                <div class="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                  @for (account of accounts(); track account.id) {
                    <article class="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
                      <div class="absolute top-0 left-0 right-0 h-1" [ngClass]="{
                        'bg-emerald-500': account.type === 'cash',
                        'bg-blue-500': account.type === 'checking',
                        'bg-pink-500': account.type === 'savings',
                        'bg-indigo-500': account.type === 'credit'
                      }"></div>
                      
                      <div class="flex items-start justify-between gap-3">
                        <div class="flex items-center gap-3">
                          <div class="flex h-10 w-10 items-center justify-center rounded-lg" [ngClass]="{
                            'bg-emerald-50 text-emerald-700': account.type === 'cash',
                            'bg-blue-50 text-blue-700': account.type === 'checking',
                            'bg-pink-50 text-pink-700': account.type === 'savings',
                            'bg-indigo-50 text-indigo-700': account.type === 'credit'
                          }">
                            @switch (account.type) {
                              @case ('cash') { <i class="fa-solid fa-money-bill-wave text-lg"></i> }
                              @case ('checking') { <i class="fa-solid fa-building-columns text-lg"></i> }
                              @case ('savings') { <i class="fa-solid fa-piggy-bank text-lg"></i> }
                              @case ('credit') { <i class="fa-solid fa-credit-card text-lg"></i> }
                            }
                          </div>
                          <div>
                            <h3 class="font-semibold text-slate-800">{{ account.name }}</h3>
                            <p class="text-[10px] uppercase tracking-wider text-slate-400 font-bold">{{ account.type }}</p>
                          </div>
                        </div>
                        <span class="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                          {{ account.currency }}
                        </span>
                      </div>
                      
                      <div class="mt-5">
                        <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400 leading-none">Saldo</p>
                        <p class="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
                          {{ formatMoney(account.balance, account.currency) }}
                        </p>
                      </div>
                    </article>
                  } @empty {
                    <div class="col-span-full rounded-xl border border-dashed border-slate-350 bg-white p-6 text-center">
                      <i class="fa-solid fa-wallet text-slate-300 text-3xl mb-2"></i>
                      <p class="text-sm text-slate-500 font-medium">No has configurado ninguna cuenta.</p>
                      <button class="mt-3 text-xs font-bold text-teal-700 hover:text-teal-900" type="button" (click)="setPanel('account')">
                        Ir a Cuentas para crear una
                      </button>
                    </div>
                  }
                </div>
              </section>
            </div>

            <aside class="space-y-6">
              <!-- Recent Transactions -->
              <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div class="mb-4 flex items-center justify-between">
                  <h2 class="font-bold text-slate-800">Transacciones Recientes</h2>
                  <button class="text-xs font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-1.5" type="button" (click)="openTransactionPanel()">
                    <i class="fa-solid fa-circle-plus"></i>
                    <span>Nueva</span>
                  </button>
                </div>
                <div class="space-y-4">
                  @for (transaction of transactions().slice(0, 8); track transaction.id) {
                    <div class="flex items-center justify-between gap-3 border-b border-slate-50 pb-3.5 last:border-0 last:pb-0">
                      <div class="flex items-center gap-3">
                        <div class="flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold" [ngClass]="{
                          'bg-emerald-50 text-emerald-700': transaction.type === 'income',
                          'bg-rose-50 text-rose-700': transaction.type === 'expense',
                          'bg-blue-50 text-blue-700': transaction.type === 'transfer'
                        }">
                          @switch (transaction.type) {
                            @case ('income') { <i class="fa-solid fa-arrow-down"></i> }
                            @case ('expense') { <i class="fa-solid fa-arrow-up"></i> }
                            @case ('transfer') { <i class="fa-solid fa-arrow-right-arrow-left"></i> }
                          }
                        </div>
                        <div>
                          <p class="text-sm font-semibold text-slate-800">{{ transaction.description || 'Movimiento' }}</p>
                          <p class="text-[10px] text-slate-400 mt-0.5">
                            {{ transaction.transactionDate }} · {{ describeTransaction(transaction) }}
                          </p>
                        </div>
                      </div>
                      <p [ngClass]="{
                        'text-emerald-600': transaction.type === 'income',
                        'text-rose-600': transaction.type === 'expense',
                        'text-slate-600': transaction.type === 'transfer'
                      }" class="text-sm font-bold tracking-tight">
                        {{ transaction.type === 'income' ? '+' : transaction.type === 'expense' ? '-' : '' }}{{ formatMoney(transaction.amount) }}
                      </p>
                    </div>
                  } @empty {
                    <div class="flex flex-col items-center justify-center py-6 text-center">
                      <i class="fa-solid fa-receipt text-slate-300 text-3xl mb-2"></i>
                      <p class="text-xs text-slate-450 font-medium">Sin transacciones registradas.</p>
                    </div>
                  }
                </div>
              </section>

              <!-- Categories -->
              <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div class="mb-4 flex items-center justify-between">
                  <h2 class="font-bold text-slate-800">Categorías</h2>
                  <button class="text-xs font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-1.5" type="button" (click)="openCategoryPanel()">
                    <i class="fa-solid fa-circle-plus"></i>
                    <span>Agregar</span>
                  </button>
                </div>
                <div class="flex flex-wrap gap-2">
                  @for (category of categories(); track category.id) {
                    <span class="inline-flex items-center gap-2 rounded-full border border-slate-100 bg-slate-50/50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
                      <span class="h-2 w-2 rounded-full" [style.background]="category.color"></span>
                      <span>{{ category.name }}</span>
                    </span>
                  } @empty {
                    <div class="flex flex-col items-center justify-center py-4 text-center w-full">
                      <i class="fa-solid fa-tags text-slate-300 text-2xl mb-2"></i>
                      <p class="text-xs text-slate-450 font-medium">Crea categorías para clasificar tus movimientos.</p>
                    </div>
                  }
                </div>
              </section>
            </aside>
          </section>
        }

        @if (activePanel() === 'transaction') {
          <section class="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 class="text-lg font-bold text-slate-800">Registrar Movimiento</h2>
            <p class="text-xs text-slate-450 mt-1">Añade un ingreso, gasto o transferencia entre cuentas</p>
            <form class="mt-5 grid gap-4" (ngSubmit)="submitTransaction()">
              <label class="grid gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                Tipo
                <select class="rounded-xl border border-slate-250 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-teal-500" name="transactionType" [(ngModel)]="transactionForm.type">
                  <option value="expense">Gasto</option>
                  <option value="income">Ingreso</option>
                  <option value="transfer">Transferencia</option>
                </select>
              </label>

              <div class="grid gap-4 sm:grid-cols-2">
                <label class="grid gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Monto
                  <input class="rounded-xl border border-slate-250 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-teal-500" name="amount" type="number" min="0.01" step="0.01" [(ngModel)]="transactionForm.amount" required>
                </label>
                <label class="grid gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Fecha
                  <input class="rounded-xl border border-slate-250 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-teal-500" name="transactionDate" type="date" [(ngModel)]="transactionForm.transactionDate" required>
                </label>
              </div>

              @if (transactionForm.type !== 'income') {
                <label class="grid gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Cuenta Origen
                  <select class="rounded-xl border border-slate-250 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-teal-500" name="fromAccountId" [(ngModel)]="transactionForm.fromAccountId">
                    <option value="">Selecciona una cuenta</option>
                    @for (account of accounts(); track account.id) {
                      <option [value]="account.id">{{ account.name }} · {{ formatMoney(account.balance, account.currency) }}</option>
                    }
                  </select>
                </label>
              }

              @if (transactionForm.type !== 'expense') {
                <label class="grid gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Cuenta Destino
                  <select class="rounded-xl border border-slate-250 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-teal-500" name="toAccountId" [(ngModel)]="transactionForm.toAccountId">
                    <option value="">Selecciona una cuenta</option>
                    @for (account of accounts(); track account.id) {
                      <option [value]="account.id">{{ account.name }} · {{ formatMoney(account.balance, account.currency) }}</option>
                    }
                  </select>
                </label>
              }

              @if (transactionForm.type !== 'transfer') {
                <label class="grid gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Categoría
                  <select class="rounded-xl border border-slate-250 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-teal-500" name="categoryId" [(ngModel)]="transactionForm.categoryId">
                    <option value="">Selecciona una categoría</option>
                    @for (category of filteredCategories(transactionForm.type); track category.id) {
                      <option [value]="category.id">{{ category.name }}</option>
                    }
                  </select>
                </label>
              }

              <label class="grid gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                Descripción
                <textarea class="min-h-24 rounded-xl border border-slate-250 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-teal-500" name="description" [(ngModel)]="transactionForm.description"></textarea>
              </label>

              <button class="rounded-xl bg-teal-700 px-4 py-3 text-sm font-bold text-white hover:bg-teal-800 transition-colors shadow-sm mt-2" type="submit">
                Guardar Movimiento
              </button>
            </form>
          </section>
        }

        @if (activePanel() === 'account') {
          <section class="grid gap-6 lg:grid-cols-[400px_1fr]">
            <form class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm h-fit" (ngSubmit)="submitAccount()">
              <h2 class="text-lg font-bold text-slate-800">{{ accountForm.id ? 'Editar Cuenta' : 'Nueva Cuenta' }}</h2>
              <p class="text-xs text-slate-450 mt-1">Configura los detalles de tu cuenta de dinero</p>
              
              <div class="mt-5 grid gap-4">
                <label class="grid gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Nombre de la Cuenta
                  <input class="rounded-xl border border-slate-250 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-teal-500" name="accountName" [(ngModel)]="accountForm.name" required>
                </label>
                <label class="grid gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Tipo de Cuenta
                  <select class="rounded-xl border border-slate-250 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-teal-500" name="accountType" [(ngModel)]="accountForm.type">
                    <option value="cash">Efectivo</option>
                    <option value="checking">Cuenta Corriente</option>
                    <option value="savings">Cuenta de Ahorros</option>
                    <option value="credit">Tarjeta de Crédito</option>
                  </select>
                </label>
                <div class="grid gap-4 sm:grid-cols-2">
                  <label class="grid gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Moneda
                    <input class="rounded-xl border border-slate-250 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 uppercase outline-none focus:border-teal-500" name="currency" maxlength="3" [(ngModel)]="accountForm.currency" required>
                  </label>
                  <label class="grid gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Saldo Inicial
                    <input class="rounded-xl border border-slate-250 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-teal-500" name="balance" type="number" step="0.01" [(ngModel)]="accountForm.balance" required>
                  </label>
                </div>
                <div class="flex gap-2.5 mt-2">
                  <button class="flex-1 rounded-xl bg-teal-700 px-4 py-3 text-sm font-bold text-white hover:bg-teal-800 transition-colors shadow-sm" type="submit">
                    {{ accountForm.id ? 'Actualizar' : 'Crear' }}
                  </button>
                  <button class="rounded-xl border border-slate-250 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors" type="button" (click)="resetAccountForm()">
                    Limpiar
                  </button>
                </div>
              </div>
            </form>

            <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 class="text-lg font-bold text-slate-800">Gestionar Cuentas</h2>
              <p class="text-xs text-slate-450 mt-1">Crea, edita o elimina las cuentas configuradas en tu sistema</p>
              
              <div class="mt-5 space-y-3.5">
                @for (account of accounts(); track account.id) {
                  <div class="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 p-4 bg-slate-50/30 hover:bg-slate-50/80 transition-colors">
                    <div class="flex items-center gap-3">
                      <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-600 shadow-sm">
                        @switch (account.type) {
                          @case ('cash') { <i class="fa-solid fa-money-bill-wave text-emerald-600"></i> }
                          @case ('checking') { <i class="fa-solid fa-building-columns text-blue-600"></i> }
                          @case ('savings') { <i class="fa-solid fa-piggy-bank text-pink-600"></i> }
                          @case ('credit') { <i class="fa-solid fa-credit-card text-indigo-600"></i> }
                        }
                      </div>
                      <div>
                        <p class="font-bold text-slate-800">{{ account.name }}</p>
                        <p class="text-xs capitalize text-slate-400 font-medium">{{ account.type }} · {{ formatMoney(account.balance, account.currency) }}</p>
                      </div>
                    </div>
                    <div class="flex gap-2">
                      <button class="rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1" type="button" (click)="editAccount(account)">
                        <i class="fa-solid fa-pen-to-square"></i>
                        <span>Editar</span>
                      </button>
                      <button class="rounded-lg border border-rose-250 bg-white px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-1" type="button" (click)="deleteAccount(account.id)">
                        <i class="fa-solid fa-trash-can"></i>
                        <span>Eliminar</span>
                      </button>
                    </div>
                  </div>
                } @empty {
                  <div class="flex flex-col items-center justify-center py-8 text-center">
                    <i class="fa-solid fa-wallet text-slate-300 text-4xl mb-2.5"></i>
                    <p class="text-xs text-slate-500 font-medium">No has creado cuentas de dinero aún.</p>
                  </div>
                }
              </div>
            </section>
          </section>
        }

        @if (activePanel() === 'category') {
          <section class="grid gap-6 lg:grid-cols-[400px_1fr]">
            <form class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm h-fit" (ngSubmit)="submitCategory()">
              <h2 class="text-lg font-bold text-slate-800">{{ categoryForm.id ? 'Editar Categoría' : 'Nueva Categoría' }}</h2>
              <p class="text-xs text-slate-450 mt-1">Configura las categorías de clasificación de movimientos</p>
              
              <div class="mt-5 grid gap-4">
                <label class="grid gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Nombre de la Categoría
                  <input class="rounded-xl border border-slate-250 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-teal-500" name="categoryName" [(ngModel)]="categoryForm.name" required>
                </label>
                <label class="grid gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Tipo de Categoría
                  <select class="rounded-xl border border-slate-250 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-teal-500" name="categoryKind" [(ngModel)]="categoryForm.kind">
                    <option value="expense">Gasto</option>
                    <option value="income">Ingreso</option>
                  </select>
                </label>
                <label class="grid gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Color
                  <div class="flex gap-2">
                    <input class="h-11 w-16 rounded-xl border border-slate-250 bg-white px-2 py-2 cursor-pointer" name="categoryColor" type="color" [(ngModel)]="categoryForm.color">
                    <input class="flex-1 rounded-xl border border-slate-250 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 outline-none uppercase focus:border-teal-500" name="categoryColorHex" [(ngModel)]="categoryForm.color" placeholder="#000000">
                  </div>
                </label>
                <div class="flex gap-2.5 mt-2">
                  <button class="flex-1 rounded-xl bg-teal-700 px-4 py-3 text-sm font-bold text-white hover:bg-teal-800 transition-colors shadow-sm" type="submit">
                    {{ categoryForm.id ? 'Actualizar' : 'Crear' }}
                  </button>
                  <button class="rounded-xl border border-slate-250 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors" type="button" (click)="resetCategoryForm()">
                    Limpiar
                  </button>
                </div>
              </div>
            </form>

            <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 class="text-lg font-bold text-slate-800">Gestionar Categorías</h2>
              <p class="text-xs text-slate-450 mt-1">Crea, edita o elimina las categorías de clasificación de dinero</p>
              
              <div class="mt-5 space-y-3">
                @for (category of categories(); track category.id) {
                  <div class="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 p-4 bg-slate-50/30 hover:bg-slate-50/80 transition-colors">
                    <div class="flex items-center gap-3">
                      <span class="h-5 w-5 rounded-full shadow-inner border border-white" [style.background]="category.color"></span>
                      <div>
                        <p class="font-bold text-slate-800">{{ category.name }}</p>
                        <p class="text-xs capitalize text-slate-450 font-medium">{{ category.kind === 'expense' ? 'Gasto' : 'Ingreso' }}</p>
                      </div>
                    </div>
                    <div class="flex gap-2">
                      <button class="rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1" type="button" (click)="editCategory(category)">
                        <i class="fa-solid fa-pen-to-square"></i>
                        <span>Editar</span>
                      </button>
                      <button class="rounded-lg border border-rose-250 bg-white px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-1" type="button" (click)="deleteCategory(category.id)">
                        <i class="fa-solid fa-trash-can"></i>
                        <span>Eliminar</span>
                      </button>
                    </div>
                  </div>
                } @empty {
                  <div class="flex flex-col items-center justify-center py-8 text-center">
                    <i class="fa-solid fa-tags text-slate-300 text-4xl mb-2.5"></i>
                    <p class="text-xs text-slate-500 font-medium">No has creado categorías todavía.</p>
                  </div>
                }
              </div>
            </section>
          </section>
        }
      </section>

      <nav class="fixed inset-x-0 bottom-0 z-30 border-t border-slate-150 bg-white/95 backdrop-blur px-3 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
        <div class="mx-auto grid max-w-lg grid-cols-4 gap-1">
          @for (item of menuItems; track item.panel) {
            <button
              type="button"
              class="flex flex-col items-center justify-center rounded-xl py-2 text-xs font-medium transition-all duration-150"
              [ngClass]="activePanel() === item.panel ? 'text-teal-700 scale-105 font-semibold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'"
              (click)="setPanel(item.panel)"
            >
              <span class="text-xl"><i [class]="item.icon"></i></span>
              <span class="mt-1.5 text-[10px] tracking-wide">{{ item.label }}</span>
            </button>
          }
        </div>
      </nav>
    </main>
  `
})
export class HomeComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);

  accounts = signal<AccountDto[]>([]);
  categories = signal<CategoryDto[]>([]);
  transactions = signal<TransactionDto[]>([]);
  activePanel = signal<ActivePanel>('dashboard');
  message = signal('');
  error = signal('');

  totalBalance = computed(() => this.accounts().reduce((total, account) => total + account.balance, 0));

  menuItems: Array<{ panel: ActivePanel; label: string; icon: string }> = [
    { panel: 'dashboard', label: 'Inicio', icon: 'fa-solid fa-chart-pie' },
    { panel: 'transaction', label: 'Movimiento', icon: 'fa-solid fa-circle-plus' },
    { panel: 'account', label: 'Cuentas', icon: 'fa-solid fa-wallet' },
    { panel: 'category', label: 'Categorías', icon: 'fa-solid fa-tags' }
  ];

  accountForm: AccountForm = this.createEmptyAccountForm();
  categoryForm: CategoryForm = this.createEmptyCategoryForm();
  transactionForm: TransactionForm = this.createEmptyTransactionForm();

  async ngOnInit(): Promise<void> {
    await this.initializeAuth();
    this.loadDashboard();
  }

  signIn(): void {
    void this.auth.login().then(() => {
      if (this.auth.isAuthenticated()) {
        this.message.set('Signed in locally.');
      }
    });
  }

  signOut(): void {
    this.auth.logout();
    this.message.set('Signed out.');
  }

  setPanel(panel: ActivePanel): void {
    this.activePanel.set(panel);
    this.clearAlerts();
  }

  openTransactionPanel(): void {
    this.setPanel('transaction');
  }

  openAccountPanel(): void {
    this.resetAccountForm();
    this.setPanel('account');
  }

  openCategoryPanel(): void {
    this.resetCategoryForm();
    this.setPanel('category');
  }

  submitAccount(): void {
    this.clearAlerts();
    const input: AccountInputDto = {
      name: this.accountForm.name,
      type: this.accountForm.type,
      currency: this.accountForm.currency,
      balance: Number(this.accountForm.balance)
    };

    const request = this.accountForm.id
      ? this.api.updateAccount(this.accountForm.id, input)
      : this.api.createAccount(input);

    request.subscribe({
      next: () => {
        this.message.set(this.accountForm.id ? 'Account updated.' : 'Account created.');
        this.resetAccountForm();
        this.loadDashboard();
      },
      error: (error: unknown) => this.showRequestError(error)
    });
  }

  editAccount(account: AccountDto): void {
    this.accountForm = {
      id: account.id,
      name: account.name,
      type: account.type,
      currency: account.currency,
      balance: account.balance
    };
    this.setPanel('account');
  }

  deleteAccount(id: string): void {
    this.clearAlerts();
    this.api.deleteAccount(id).subscribe({
      next: () => {
        this.message.set('Account deleted.');
        this.loadDashboard();
      },
      error: (error: unknown) => this.showRequestError(error)
    });
  }

  resetAccountForm(): void {
    this.accountForm = this.createEmptyAccountForm();
  }

  submitCategory(): void {
    this.clearAlerts();
    const input: CategoryInputDto = {
      name: this.categoryForm.name,
      kind: this.categoryForm.kind,
      color: this.categoryForm.color
    };

    const request = this.categoryForm.id
      ? this.api.updateCategory(this.categoryForm.id, input)
      : this.api.createCategory(input);

    request.subscribe({
      next: () => {
        this.message.set(this.categoryForm.id ? 'Category updated.' : 'Category created.');
        this.resetCategoryForm();
        this.loadDashboard();
      },
      error: (error: unknown) => this.showRequestError(error)
    });
  }

  editCategory(category: CategoryDto): void {
    this.categoryForm = {
      id: category.id,
      name: category.name,
      kind: category.kind,
      color: category.color
    };
    this.setPanel('category');
  }

  deleteCategory(id: string): void {
    this.clearAlerts();
    this.api.deleteCategory(id).subscribe({
      next: () => {
        this.message.set('Category deleted.');
        this.loadDashboard();
      },
      error: (error: unknown) => this.showRequestError(error)
    });
  }

  resetCategoryForm(): void {
    this.categoryForm = this.createEmptyCategoryForm();
  }

  submitTransaction(): void {
    this.clearAlerts();
    const input: TransactionInputDto = {
      type: this.transactionForm.type,
      amount: Number(this.transactionForm.amount),
      transactionDate: this.transactionForm.transactionDate,
      description: this.transactionForm.description || undefined,
      categoryId: this.transactionForm.type === 'transfer' ? undefined : this.transactionForm.categoryId,
      fromAccountId: this.transactionForm.type === 'income' ? undefined : this.transactionForm.fromAccountId,
      toAccountId: this.transactionForm.type === 'expense' ? undefined : this.transactionForm.toAccountId
    };

    this.api.createTransaction(input).subscribe({
      next: () => {
        this.message.set('Transaction registered.');
        this.transactionForm = this.createEmptyTransactionForm();
        this.activePanel.set('dashboard');
        this.loadDashboard();
      },
      error: (error: unknown) => this.showRequestError(error)
    });
  }

  filteredCategories(type: TransactionType): CategoryDto[] {
    if (type === 'transfer') {
      return [];
    }

    return this.categories().filter((category) => category.kind === type);
  }

  describeTransaction(transaction: TransactionDto): string {
    if (transaction.type === 'transfer') {
      return `${this.accountName(transaction.fromAccountId)} → ${this.accountName(transaction.toAccountId)}`;
    }

    return this.categoryName(transaction.categoryId);
  }

  formatMoney(value: number, currency = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(value);
  }

  private async initializeAuth(): Promise<void> {
    try {
      const handledCallback = await this.auth.handleRedirectCallback();
      if (handledCallback || this.auth.isAuthenticated()) {
        this.message.set('Signed in successfully.');
      }
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Sign-in callback failed.');
    }
  }

  private loadDashboard(): void {
    forkJoin({
      accounts: this.api.listAccounts(),
      categories: this.api.listCategories(),
      transactions: this.api.listTransactions()
    }).subscribe({
      next: ({ accounts, categories, transactions }) => {
        this.accounts.set(accounts);
        this.categories.set(categories);
        this.transactions.set(transactions);
      },
      error: (error: unknown) => this.showRequestError(error)
    });
  }

  private accountName(id: string | undefined): string {
    return this.accounts().find((account) => account.id === id)?.name ?? 'Account';
  }

  private categoryName(id: string | undefined): string {
    return this.categories().find((category) => category.id === id)?.name ?? 'Category';
  }

  private createEmptyAccountForm(): AccountForm {
    return {
      name: '',
      type: 'checking',
      currency: 'USD',
      balance: 0
    };
  }

  private createEmptyCategoryForm(): CategoryForm {
    return {
      name: '',
      kind: 'expense',
      color: '#0f766e'
    };
  }

  private createEmptyTransactionForm(): TransactionForm {
    return {
      type: 'expense',
      amount: 0,
      categoryId: '',
      fromAccountId: '',
      toAccountId: '',
      transactionDate: new Date().toISOString().slice(0, 10),
      description: ''
    };
  }

  private showRequestError(error: unknown): void {
    const requestError = error as { error?: { message?: string }; message?: string };
    this.error.set(requestError.error?.message ?? requestError.message ?? 'Request failed.');
  }

  private clearAlerts(): void {
    this.message.set('');
    this.error.set('');
  }
}
