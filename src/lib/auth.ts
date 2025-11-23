"use only-server";

import { db } from "~/server/db";
import { items_roles_users } from "~/server/db/schema";
import { eq, and } from "drizzle-orm";

// type Permissions = {
//   file: {
//     dataType: Item;
//     action: "view" | "edit" | "delete" | "invite";
//   };
//   folder: {
//     dataType: Item;
//     action: "view" | "edit" | "delete" | "invite";
//   };
// };

type ResourceType = "file" | "folder";

interface Resource {
  id: number;
  type: ResourceType;
  ownerId?: string;
  parentId?: number;
}

type ItemRole = "admin" | "editor" | "viewer";
type Role = "admin" | "editor" | "viewer";
type Action = "view" | "edit" | "delete" | "invite";

const ID_ROLES_MAP: Record<number, ItemRole> = {
  1: "admin",
  2: "editor",
  3: "viewer",
};

export const ID_ROLES = {
  ADMIN: 1,
  EDITOR: 2,
  VIEWER: 3,
};

const ITEMS_ROLES: Record<ItemRole, Record<Action, boolean>> = {
  admin: {
    view: true,
    edit: true,
    delete: true,
    invite: true,
  },
  editor: {
    view: true,
    edit: true,
    delete: false,
    invite: false,
  },
  viewer: {
    view: true,
    edit: false,
    delete: false,
    invite: false,
  },
};
export async function hasPermission(
  userId: string,
  resource: Resource,
  action: Action,
) {
  const [resourceRole] = await db
    .select()
    .from(items_roles_users)
    .where(
      and(
        eq(items_roles_users.itemId, resource.id),
        eq(items_roles_users.userId, userId),
      ),
    );

  if (!resourceRole) {
    return false;
  }

  const role = ID_ROLES_MAP[resourceRole.role];
  if (!role) {
    return false;
  }

  return ITEMS_ROLES[role][action];
}
