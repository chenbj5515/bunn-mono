import { relations } from "drizzle-orm/relations";
import { memoCard, wordCard, user, account, session, userSubscription } from "./schema";

export const wordCardRelations = relations(wordCard, ({one}) => ({
	memoCard: one(memoCard, {
		fields: [wordCard.memoCardId],
		references: [memoCard.id]
	}),
}));

export const memoCardRelations = relations(memoCard, ({many}) => ({
	wordCards: many(wordCard),
}));

export const accountRelations = relations(account, ({one}) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	}),
}));

export const userRelations = relations(user, ({many}) => ({
	accounts: many(account),
	sessions: many(session),
	userSubscriptions: many(userSubscription),
}));

export const sessionRelations = relations(session, ({one}) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	}),
}));

export const userSubscriptionRelations = relations(userSubscription, ({one}) => ({
	user: one(user, {
		fields: [userSubscription.userId],
		references: [user.id]
	}),
}));