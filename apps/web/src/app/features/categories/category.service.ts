import { Injectable, inject } from '@angular/core';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';

import { AuthService } from '../../core/auth/auth.service';
import { FamilyContextService } from '../../core/family-context/family-context.service';
import { firestore } from '../../core/firebase/firebase';
import { Category } from '../../shared/models/domain.models';
import { normalizeName } from '../../shared/utils/formatters';

export interface CreateCategoryInput {
  name: string;
  color?: string;
  icon?: string;
}

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly auth = inject(AuthService);
  private readonly familyContext = inject(FamilyContextService);

  async listActive(): Promise<Category[]> {
    const familyId = this.requireFamilyId();
    const snapshot = await getDocs(
      query(collection(firestore, `families/${familyId}/categories`), where('status', '==', 'active')),
    );

    return snapshot.docs
      .map((category) => category.data() as Category)
      .sort((left, right) => left.name.localeCompare(right.name));
  }

  async create(input: CreateCategoryInput): Promise<string> {
    const user = this.auth.currentUser();
    const familyId = this.requireFamilyId();

    if (!user) {
      throw new Error('Debes iniciar sesion para crear una categoria.');
    }

    const normalizedName = normalizeName(input.name);
    const duplicates = await getDocs(
      query(
        collection(firestore, `families/${familyId}/categories`),
        where('normalizedName', '==', normalizedName),
        where('status', '==', 'active'),
      ),
    );

    if (!duplicates.empty) {
      throw new Error('Ya existe una categoria activa con ese nombre.');
    }

    const categoryRef = doc(collection(firestore, `families/${familyId}/categories`));
    await setDoc(categoryRef, {
      id: categoryRef.id,
      familyId,
      name: input.name.trim(),
      normalizedName,
      color: input.color || null,
      icon: input.icon || null,
      createdByUserId: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: 'active',
    });

    return categoryRef.id;
  }

  async getById(categoryId: string): Promise<Category> {
    const familyId = this.requireFamilyId();
    const docRef = doc(firestore, `families/${familyId}/categories/${categoryId}`);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      throw new Error('Categoria no encontrada.');
    }
    return snap.data() as Category;
  }

  async update(categoryId: string, input: CreateCategoryInput): Promise<void> {
    const user = this.auth.currentUser();
    const familyId = this.requireFamilyId();

    if (!user) {
      throw new Error('Debes iniciar sesion para actualizar una categoria.');
    }

    const normalizedName = normalizeName(input.name);
    const duplicates = await getDocs(
      query(
        collection(firestore, `families/${familyId}/categories`),
        where('normalizedName', '==', normalizedName),
        where('status', '==', 'active'),
      ),
    );

    const hasDuplicate = duplicates.docs.some((doc) => doc.id !== categoryId);
    if (hasDuplicate) {
      throw new Error('Ya existe otra categoria activa con ese nombre.');
    }

    const categoryRef = doc(firestore, `families/${familyId}/categories/${categoryId}`);
    await updateDoc(categoryRef, {
      name: input.name.trim(),
      normalizedName,
      color: input.color || null,
      icon: input.icon || null,
      updatedAt: serverTimestamp(),
    });
  }

  private requireFamilyId(): string {
    const familyId = this.familyContext.selectedFamilyId();
    if (!familyId) {
      throw new Error('Selecciona una familia para continuar.');
    }
    return familyId;
  }
}
