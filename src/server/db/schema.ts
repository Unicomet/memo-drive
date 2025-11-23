import {
  bigint,
  text,
  singlestoreTableCreator,
  index,
  timestamp,
} from "drizzle-orm/singlestore-core";

export const createTable = singlestoreTableCreator(
  (name) => `drive_tutorial_${name}`,
);

export const files_table = createTable(
  "files",
  {
    id: bigint("id", { mode: "number", unsigned: true })
      .primaryKey()
      .autoincrement(),
    name: text("name").notNull(),
    fileType: text("file_type").notNull(),
    size: bigint("size", { mode: "number", unsigned: true }).notNull(),
    url: text("url").notNull(),
    parent: bigint("parent", { mode: "number", unsigned: true }).notNull(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    ownerId: text("owner_id").notNull(),
  },
  (t) => {
    return [
      index("parent_index").on(t.parent),
      index("owner_index").on(t.ownerId),
    ];
  },
);

export const folders_table = createTable(
  "folders",
  {
    id: bigint("id", { mode: "number", unsigned: true })
      .primaryKey()
      .autoincrement(),
    name: text("name").notNull(),
    parent: bigint("parent", { mode: "number", unsigned: true }),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    ownerId: text("owner_id").notNull(),
  },
  (t) => {
    return [
      index("parent_index").on(t.parent),
      index("owner_index").on(t.ownerId),
    ];
  },
);

export const items_roles = createTable("items_roles", {
  id: bigint("id", { mode: "number", unsigned: true })
    .primaryKey()
    .autoincrement(),
  role: text("role").notNull(),
  roleDescription: text("role_description").notNull(),
});

export const items_roles_users = createTable("items_roles_users", {
  id: bigint("id", { mode: "number", unsigned: true })
    .primaryKey()
    .autoincrement(),
  itemId: bigint("item_id", { mode: "number", unsigned: true }).notNull(),
  role: bigint("role_id", { mode: "number", unsigned: true }).notNull(),
  userId: text("user_id").notNull(),
});

// export const items_roles_permissions = createTable("items_roles_permissions", {
//   id: bigint("id", { mode: "number", unsigned: true })
//     .primaryKey()
//     .autoincrement(),
//   roleId: bigint("role_id", { mode: "number", unsigned: true }).notNull(),
//   permissionId: bigint("permission_id", { mode: "number", unsigned: true }),
// });

// export const permissions = createTable("permissions", {
//   id: bigint("id", { mode: "number", unsigned: true })
//     .primaryKey()
//     .autoincrement(),
//   name: text("name").notNull(),
//   description: text("description").notNull(),
// });
