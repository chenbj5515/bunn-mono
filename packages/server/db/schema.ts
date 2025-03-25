import { pgTable, text, timestamp, foreignKey, uuid, integer, boolean, uniqueIndex, varchar, unique, serial, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const actionTypeEnum = pgEnum("action_type_enum", ['COMPLETE_SENTENCE_REVIEW', 'COMPLETE_WORD_REVIEW', 'COMPLETE_EXAM', 'FORGOT_WORD_MEANING', 'FORGOT_WORD_PRONUNCIATION', 'UNKNOWN_PHRASE_EXPRESSION', 'UNABLE_TO_UNDERSTAND_AUDIO', 'CREATE_MEMO', 'CREATE_WORD', 'COMPLETE_IMAGE_OCR', 'COMPLETE_TEXT_TRANSLATION_BY_EXTENSION'])
export const examStatusEnum = pgEnum("exam_status_enum", ['initial', 'in_progress', 'completed'])
export const membershipPlanEnum = pgEnum("membership_plan_enum", ['MONTHLY'])
export const questionTypeEnum = pgEnum("question_type_enum", ['kana_from_japanese', 'translation_from_japanese', 'japanese_from_chinese', 'transcription_from_audio'])
export const relatedTypeEnum = pgEnum("related_type_enum", ['word_card', 'memo_card', 'exam'])


export const verification = pgTable("verification", {
	id: text().primaryKey().notNull(),
	identifier: text().notNull(),
	value: text().notNull(),
	expiresAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }),
	updatedAt: timestamp({ precision: 3, mode: 'string' }),
});

export const wordCard = pgTable("word_card", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	word: text().notNull(),
	meaning: text().notNull(),
	createTime: timestamp("create_time", { precision: 6, withTimezone: true, mode: 'string' }).notNull(),
	userId: text("user_id").notNull(),
	reviewTimes: integer("review_times").default(0).notNull(),
	forgetCount: integer("forget_count").default(0).notNull(),
	memoCardId: uuid("memo_card_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.memoCardId],
			foreignColumns: [memoCard.id],
			name: "fk_memo_card"
		}),
]);

export const account = pgTable("account", {
	id: text().primaryKey().notNull(),
	accountId: text().notNull(),
	providerId: text().notNull(),
	userId: text().notNull(),
	accessToken: text(),
	refreshToken: text(),
	idToken: text(),
	accessTokenExpiresAt: timestamp({ precision: 3, mode: 'string' }),
	refreshTokenExpiresAt: timestamp({ precision: 3, mode: 'string' }),
	scope: text(),
	password: text(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "account_userId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const examResults = pgTable("exam_results", {
	resultId: uuid("result_id").defaultRandom().primaryKey().notNull(),
	examId: uuid("exam_id").notNull(),
	question: text().notNull(),
	questionType: questionTypeEnum("question_type").notNull(),
	questionRef: uuid("question_ref").notNull(),
	userAnswer: text("user_answer").notNull(),
	referenceAnswer: text("reference_answer").notNull(),
	isCorrect: boolean("is_correct").default(false).notNull(),
	questionScore: integer("question_score").default(0).notNull(),
	createTime: timestamp("create_time", { precision: 6, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const articles = pgTable("articles", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	content: text().notNull(),
	createTime: timestamp("create_time", { precision: 6, withTimezone: true, mode: 'string' }).notNull(),
	userId: text("user_id"),
	tags: text(),
	title: text(),
});

export const user = pgTable("user", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	email: text().notNull(),
	emailVerified: boolean().notNull(),
	image: text(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
}, (table) => [
	uniqueIndex("user_email_key").using("btree", table.email.asc().nullsLast().op("text_ops")),
]);

export const session = pgTable("session", {
	id: text().primaryKey().notNull(),
	expiresAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
	token: text().notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
	ipAddress: text(),
	userAgent: text(),
	userId: text().notNull(),
}, (table) => [
	uniqueIndex("session_token_key").using("btree", table.token.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "session_userId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const memoCard = pgTable("memo_card", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	translation: text().notNull(),
	createTime: timestamp("create_time", { precision: 6, withTimezone: true, mode: 'string' }).notNull(),
	updateTime: timestamp("update_time", { precision: 6, withTimezone: true, mode: 'string' }).notNull(),
	recordFilePath: text("record_file_path"),
	originalText: text("original_text"),
	reviewTimes: integer("review_times").default(0),
	forgetCount: integer("forget_count").default(0).notNull(),
	userId: text("user_id").default('chenbj').notNull(),
	kanaPronunciation: text("kana_pronunciation"),
	contextUrl: text("context_url"),
});

export const userSubscription = pgTable("user_subscription", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	startTime: timestamp("start_time", { precision: 6, withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	endTime: timestamp("end_time", { precision: 6, withTimezone: true, mode: 'string' }).notNull(),
	active: boolean().default(true).notNull(),
	openaiApiKey: text("openai_api_key"),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "user_subscription_user_id_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
]);

export const exams = pgTable("exams", {
	examId: uuid("exam_id").defaultRandom().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	examName: varchar("exam_name", { length: 255 }).notNull(),
	totalScore: integer("total_score").default(0).notNull(),
	status: examStatusEnum().default('initial').notNull(),
	durationSeconds: integer("duration_seconds"),
	createTime: timestamp("create_time", { precision: 6, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const userActionLogs = pgTable("user_action_logs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	actionType: actionTypeEnum("action_type").notNull(),
	relatedId: uuid("related_id"),
	relatedType: relatedTypeEnum("related_type"),
	createTime: timestamp("create_time", { precision: 6, withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const users = pgTable("users", {
	id: serial().primaryKey().notNull(),
	name: text(),
	email: varchar({ length: 255 }).notNull(),
	password: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	emailVerified: boolean("email_verified").default(false),
	image: text(),
}, (table) => [
	unique("users_email_unique").on(table.email),
]);
