import { DateTimeFormat } from 'main.date';

import { Core } from 'im.v2.application.core';
import { ChatType, Settings } from 'im.v2.const';
import { Utils } from 'im.v2.lib.utils';
import { Parser } from 'im.v2.lib.parser';

import type { JsonObject } from 'main.core';
import type { ImModelUser, ImModelChat, ImModelRecentItem } from 'im.v2.model';

// @vue/component
export const MessageText = {
	props:
	{
		item: {
			type: Object,
			required: true,
		},
	},
	data(): JsonObject
	{
		return {};
	},
	computed:
	{
		recentItem(): ImModelRecentItem
		{
			return this.item;
		},
		dialog(): ImModelChat
		{
			return this.$store.getters['chats/get'](this.recentItem.dialogId, true);
		},
		user(): ImModelUser
		{
			return this.$store.getters['users/get'](this.recentItem.dialogId, true);
		},
		showLastMessage(): boolean
		{
			return this.$store.getters['application/settings/get'](Settings.recent.showLastMessage);
		},
		hiddenMessageText(): string
		{
			return this.$Bitrix.Loc.getMessage('IM_LIST_RECENT_CHAT_TYPE_GROUP_V2');
		},
		isLastMessageAuthor(): boolean
		{
			if (!this.recentItem.message)
			{
				return false;
			}

			return this.recentItem.message.senderId === Core.getUserId();
		},
		lastMessageAuthorAvatar(): string
		{
			const authorDialog = this.$store.getters['chats/get'](this.recentItem.message.senderId);

			if (!authorDialog)
			{
				return '';
			}

			return authorDialog.avatar;
		},
		lastMessageAuthorAvatarStyle(): Object
		{
			return { backgroundImage: `url('${this.lastMessageAuthorAvatar}')` };
		},
		messageText(): string
		{
			const formattedText = Parser.purifyRecent(this.recentItem);
			if (!formattedText)
			{
				return this.hiddenMessageText;
			}

			return formattedText;
		},
		formattedMessageText(): string
		{
			const SPLIT_INDEX = 27;

			return Utils.text.insertUnseenWhitespace(this.messageText, SPLIT_INDEX);
		},
		preparedDraftContent(): string
		{
			const phrase = this.loc('IM_LIST_RECENT_MESSAGE_DRAFT_2');
			const PLACEHOLDER_LENGTH = '#TEXT#'.length;
			const prefix = phrase.slice(0, -PLACEHOLDER_LENGTH);

			return `
				<span class="bx-im-list-copilot-item__message_draft-prefix">${prefix}</span>
				<span class="bx-im-list-copilot-item__message_text_content">${this.formattedDraftText}</span>
			`;
		},
		formattedDraftText(): string
		{
			return Parser.purify({ text: this.recentItem.draft.text, showIconIfEmptyText: false });
		},
	},
	methods:
	{
		loc(phraseCode: string, replacements: {[string]: string} = {}): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
		},
	},
	template: `
		<div class="bx-im-list-copilot-item__message_container">
			<span class="bx-im-list-copilot-item__message_text">
				<span v-if="recentItem.draft.text && dialog.counter === 0" v-html="preparedDraftContent"></span>
				<span v-else-if="!showLastMessage">{{ hiddenMessageText }}</span>
				<template v-else>
					<span v-if="isLastMessageAuthor" class="bx-im-list-copilot-item__message_author-icon --self"></span>
					<template v-else-if="recentItem.message.senderId">
						<span v-if="lastMessageAuthorAvatar" :style="lastMessageAuthorAvatarStyle" class="bx-im-list-copilot-item__message_author-icon --user"></span>
						<span v-else class="bx-im-list-copilot-item__message_author-icon --user --default"></span>
					</template>
					<span class="bx-im-list-copilot-item__message_text_content">{{ formattedMessageText }}</span>
				</template>
			</span>
		</div>
	`,
};
