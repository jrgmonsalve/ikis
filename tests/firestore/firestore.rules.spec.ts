import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  RulesTestEnvironment,
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import { Timestamp, deleteDoc, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
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
      activePeriod: {
        periodType: 'monthly',
        month: 6,
        year: 2026,
        customStart: null,
        customEnd: null,
      },
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
    await setDoc(doc(db, 'families/family-a/categories/category-a'), {
      id: 'category-a',
      familyId: 'family-a',
      name: 'Food',
      normalizedName: 'food',
      createdByUserId: 'owner-a',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
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

  it('allows owner to update a valid family active period', async () => {
    const db = environment.authenticatedContext('owner-a').firestore();
    await assertSucceeds(
      updateDoc(doc(db, 'families/family-a'), {
        activePeriod: {
          periodType: 'custom',
          month: null,
          year: null,
          customStart: Timestamp.fromDate(new Date('2026-07-01T00:00:00')),
          customEnd: Timestamp.fromDate(new Date('2026-07-31T23:59:59')),
        },
      }),
    );
  });

  it('denies admin family active period updates', async () => {
    const db = environment.authenticatedContext('admin-a').firestore();
    await assertFails(
      updateDoc(doc(db, 'families/family-a'), {
        activePeriod: {
          periodType: 'monthly',
          month: 7,
          year: 2026,
          customStart: null,
          customEnd: null,
        },
      }),
    );
  });

  it('denies invalid family active period payloads', async () => {
    const db = environment.authenticatedContext('owner-a').firestore();
    await assertFails(
      updateDoc(doc(db, 'families/family-a'), {
        activePeriod: {
          periodType: 'custom',
          month: null,
          year: null,
          customStart: Timestamp.fromDate(new Date('2026-08-31T00:00:00')),
          customEnd: Timestamp.fromDate(new Date('2026-08-01T00:00:00')),
        },
      }),
    );
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
      setDoc(doc(db, 'families/family-a/categories/category-b'), {
        id: 'category-b',
        familyId: 'family-a',
        name: 'Transport',
        normalizedName: 'transport',
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

  it('allows admin to rename and deactivate an account without changing balances', async () => {
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

    const db = environment.authenticatedContext('admin-a').firestore();
    const accountRef = doc(db, 'families/family-a/accounts/account-a');
    await assertSucceeds(updateDoc(accountRef, { name: 'Wallet' }));
    await assertSucceeds(updateDoc(accountRef, { status: 'inactive' }));
  });

  it('denies account balance updates from the client', async () => {
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

    const db = environment.authenticatedContext('admin-a').firestore();
    await assertFails(
      updateDoc(doc(db, 'families/family-a/accounts/account-a'), {
        currentBalance: 1000,
      }),
    );
  });

  it('allows only the owner to create invitations', async () => {
    const invitation = {
      id: 'invitation-a',
      familyId: 'family-a',
      email: 'guest@example.com',
      role: 'member',
      invitedByUserId: 'owner-a',
      status: 'pending',
      createdAt: Timestamp.now(),
      expiresAt: Timestamp.fromMillis(Date.now() + 86_400_000),
      acceptedAt: null,
    };

    const ownerDb = environment.authenticatedContext('owner-a').firestore();
    await assertSucceeds(
      setDoc(doc(ownerDb, 'families/family-a/invitations/invitation-a'), invitation),
    );

    const adminDb = environment.authenticatedContext('admin-a').firestore();
    await assertFails(
      setDoc(doc(adminDb, 'families/family-a/invitations/invitation-b'), {
        ...invitation,
        id: 'invitation-b',
        invitedByUserId: 'admin-a',
      }),
    );
  });

  it('denies members access to invitations', async () => {
    await environment.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'families/family-a/invitations/invitation-a'), {
        id: 'invitation-a',
        familyId: 'family-a',
        email: 'guest@example.com',
        role: 'member',
        invitedByUserId: 'owner-a',
        status: 'pending',
        createdAt: Timestamp.now(),
        expiresAt: Timestamp.fromMillis(Date.now() + 86_400_000),
        acceptedAt: null,
      });
    });

    const db = environment.authenticatedContext('member-a').firestore();
    await assertFails(
      getDoc(doc(db, 'families/family-a/invitations/invitation-a')),
    );
  });

  it('allows owners to cancel but not accept invitations directly', async () => {
    await environment.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'families/family-a/invitations/invitation-a'), {
        id: 'invitation-a',
        familyId: 'family-a',
        email: 'guest@example.com',
        role: 'member',
        invitedByUserId: 'owner-a',
        status: 'pending',
        createdAt: Timestamp.now(),
        expiresAt: Timestamp.fromMillis(Date.now() + 86_400_000),
        acceptedAt: null,
      });
    });

    const db = environment.authenticatedContext('owner-a').firestore();
    const invitationRef = doc(db, 'families/family-a/invitations/invitation-a');
    await assertFails(updateDoc(invitationRef, { status: 'accepted' }));
    await assertSucceeds(updateDoc(invitationRef, { status: 'cancelled' }));
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

    await environment.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'families/family-a/transactions/transaction-a'), {
        id: 'transaction-a',
        familyId: 'family-a',
        type: 'expense',
        amount: 50,
        currency: 'COP',
        accountId: 'account-a',
        categoryId: 'category-a',
        transactionDate: Timestamp.now(),
        createdByUserId: 'owner-a',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        status: 'active',
        source: 'manual',
        recurringPaymentId: null,
      });
    });

    const transactionRef = doc(db, 'families/family-a/transactions/transaction-a');
    await assertFails(updateDoc(transactionRef, { amount: 100 }));
    await assertFails(deleteDoc(transactionRef));
  });

  it('allows owner and admin to manage valid subcategories', async () => {
    const ownerDb = environment.authenticatedContext('owner-a').firestore();
    await assertSucceeds(
      setDoc(doc(ownerDb, 'families/family-a/categories/category-a/subcategories/subcategory-a'), {
        id: 'subcategory-a',
        familyId: 'family-a',
        categoryId: 'category-a',
        name: 'Groceries',
        normalizedName: 'groceries',
        createdByUserId: 'owner-a',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        status: 'active',
      }),
    );

    const adminDb = environment.authenticatedContext('admin-a').firestore();
    await assertSucceeds(
      updateDoc(
        doc(adminDb, 'families/family-a/categories/category-a/subcategories/subcategory-a'),
        {
          name: 'Market',
          normalizedName: 'market',
          updatedAt: Timestamp.now(),
        },
      ),
    );
    await assertSucceeds(
      updateDoc(
        doc(adminDb, 'families/family-a/categories/category-a/subcategories/subcategory-a'),
        {
          status: 'inactive',
          updatedAt: Timestamp.now(),
        },
      ),
    );
  });

  it('denies member subcategory writes but allows reads', async () => {
    await environment.withSecurityRulesDisabled(async (context) => {
      await setDoc(
        doc(context.firestore(), 'families/family-a/categories/category-a/subcategories/subcategory-a'),
        {
          id: 'subcategory-a',
          familyId: 'family-a',
          categoryId: 'category-a',
          name: 'Groceries',
          normalizedName: 'groceries',
          createdByUserId: 'owner-a',
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          status: 'active',
        },
      );
    });

    const db = environment.authenticatedContext('member-a').firestore();
    await assertSucceeds(
      getDoc(doc(db, 'families/family-a/categories/category-a/subcategories/subcategory-a')),
    );
    await assertFails(
      setDoc(doc(db, 'families/family-a/categories/category-a/subcategories/subcategory-b'), {
        id: 'subcategory-b',
        familyId: 'family-a',
        categoryId: 'category-a',
        name: 'Fast food',
        normalizedName: 'fast-food',
        createdByUserId: 'member-a',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        status: 'active',
      }),
    );
    await assertFails(
      updateDoc(
        doc(db, 'families/family-a/categories/category-a/subcategories/subcategory-a'),
        {
          status: 'inactive',
          updatedAt: Timestamp.now(),
        },
      ),
    );
  });

  it('denies invalid subcategory payloads and physical deletes', async () => {
    const db = environment.authenticatedContext('owner-a').firestore();
    await assertFails(
      setDoc(doc(db, 'families/family-a/categories/category-a/subcategories/subcategory-a'), {
        id: 'subcategory-a',
        familyId: 'family-a',
        categoryId: 'other-category',
        name: 'Groceries',
        normalizedName: 'groceries',
        createdByUserId: 'owner-a',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        status: 'active',
      }),
    );

    await assertSucceeds(
      setDoc(doc(db, 'families/family-a/categories/category-a/subcategories/subcategory-b'), {
        id: 'subcategory-b',
        familyId: 'family-a',
        categoryId: 'category-a',
        name: 'Groceries',
        normalizedName: 'groceries',
        createdByUserId: 'owner-a',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        status: 'active',
      }),
    );
    await assertFails(
      deleteDoc(doc(db, 'families/family-a/categories/category-a/subcategories/subcategory-b')),
    );
  });
});
