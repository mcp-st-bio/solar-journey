import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const sessions = sqliteTable('sessions', {
  code: text('code').primaryKey(),
  teacherToken: text('teacher_token').notNull(),
  state: text('state').notNull(),
  updatedAt: integer('updated_at').notNull(),
});
