export type Category = {
  id: string;
  familyId: string;
  parentId: string | null;
  name: string;
  createdAt: Date;
};

export const assertCanBeParent = (parent: Category): void => {
  if (parent.parentId !== null) {
    throw new Error("A subcategory cannot have children");
  }
};
