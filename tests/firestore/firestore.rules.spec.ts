import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  RulesTestEnvironment,
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';

const projectId = 'ikis-rules-tests';
let environment: RulesTestEnvironment;

beforeAll(async () => {
  environment = await initializeTestEnvironment({
    projectId,
    firestore: {
      host: '127.0.0.1',
      port: 8081,
      rules: readFileSync(
        resolve(process.cwd(), '../../firebase/firestore.rules'),
        'utf8',
      ),
    },
  });
});

beforeEach(async () => {
  await environment.clearFirestore();
  await environment.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, 'families/family-a'), {
      id: 'family-a',
      name: 'Family A',
      mainCurrency: 'COP',
      ownerUserId: 'owner-a',
      status: 'active',
    });
    await setDoc(doc(db, 'families/family-a/members/owner-a'), {
      id: 'owner-a',
      familyId: 'family-a',
      userId: 'owner-a',
      email: 'owner@example.com',
      displayName: 'Owner',
      role: 'owner',
      status: 'active',
    });
    await setDoc(doc(db, 'families/family-a/members/member-a'), {
      id: 'member-a',
      familyId: 'family-a',
      userId: 'member-a',
      email: 'member@example.com',
      displayName: 'Member',
      role: 'member',
      status: 'active',
    });
    await setDoc(doc(db, 'families/family-a/members/admin-a'), {
      id: 'admin-a',
      familyId: 'family-a',
      userId: 'admin-a',
      email: 'admin@example.com',
      displayName: 'Admin',
      role: 'admin',
      status: 'active',
    });
  });
});

afterAll(async () => {
  await environment.cleanup();
});

describe('Firestore family security', () => {
  it('denies unauthenticated reads', async () => {
    const db = environment.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, 'families/family-a')));
  });

  it('allows owner to create a valid account', async () => {
    const db = environment.authenticatedContext('owner-a').firestore();
    await assertSucceeds(
      setDoc(doc(db, 'families/family-a/accounts/account-a'), {
        id: 'account-a',
        familyId: 'family-a',
        name: 'Cash',
        type: 'cash',
        initialBalance: 100,
        currentBalance: 100,
        currency: 'COP',
        createdByUserId: 'owner-a',
        status: 'active',
      }),
    );
  });

  it('denies member account creation', async () => {
    const db = environment.authenticatedContext('member-a').firestore();
    await assertFails(
      setDoc(doc(db, 'families/family-a/accounts/account-a'), {
        id: 'account-a',
        familyId: 'family-a',
        name: 'Cash',
        type: 'cash',
        initialBalance: 100,
        currentBalance: 100,
        currency: 'COP',
        createdByUserId: 'member-a',
        status: 'active',
      }),
    );
  });

  it('denies cross-family reads', async () => {
    const db = environment.authenticatedContext('outside-user').firestore();
    await assertFails(getDoc(doc(db, 'families/family-a')));
  });

  it('denies an account with a manipulated current balance', async () => {
    const db = environment.authenticatedContext('owner-a').firestore();
    await assertFails(
      setDoc(doc(db, 'families/family-a/accounts/account-a'), {
        id: 'account-a',
        familyId: 'family-a',
        name: 'Cash',
        type: 'cash',
        initialBalance: 100,
        currentBalance: 10_000,
        currency: 'COP',
        createdByUserId: 'owner-a',
        status: 'active',
      }),
    );
  });

  it('allows admin to create a valid category', async () => {
    const db = environment.authenticatedContext('admin-a').firestore();
    await assertSucceeds(
      setDoc(doc(db, 'families/family-a/categories/category-a'), {
        id: 'category-a',
        familyId: 'family-a',
        name: 'Food',
        normalizedName: 'food',
        color: '#16a34a',
        icon: 'utensils',
        createdByUserId: 'admin-a',
        status: 'active',
      }),
    );
  });

  it('allows a member to read family accounts', async () => {
    await environment.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'families/family-a/accounts/account-a'), {
        id: 'account-a',
        familyId: 'family-a',
        name: 'Cash',
        type: 'cash',
        initialBalance: 100,
        currentBalance: 100,
        currency: 'COP',
        createdByUserId: 'owner-a',
        status: 'active',
      });
    });
    const db = environment.authenticatedContext('member-a').firestore();
    await assertSucceeds(getDoc(doc(db, 'families/family-a/accounts/account-a')));
  });

  it('denies direct transaction writes for an owner', async () => {
    const db = environment.authenticatedContext('owner-a').firestore();
    await assertFails(
      setDoc(doc(db, 'families/family-a/transactions/transaction-a'), {
        id: 'transaction-a',
        familyId: 'family-a',
        type: 'expense',
        amount: 50,
        currency: 'COP',
        accountId: 'account-a',
        categoryId: 'category-a',
        transactionDate: new Date(),
        createdByUserId: 'owner-a',
        status: 'active',
      }),
    );
  });
});
