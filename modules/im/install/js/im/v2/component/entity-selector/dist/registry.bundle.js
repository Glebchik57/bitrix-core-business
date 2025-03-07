/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports,ui_entitySelector,im_v2_application_core,im_v2_provider_service,im_v2_component_search_searchResult,main_popup,im_v2_component_elements,main_core_events,im_public,im_v2_const,im_v2_component_search_chatSearchInput,im_v2_component_search_searchExperimental) {
	'use strict';

	const searchConfig = {
	  currentUser: false,
	  chats: false,
	  network: false
	};

	// @vue/component
	const AddToChatContent = {
	  name: 'AddToChatContent',
	  components: {
	    SearchResult: im_v2_component_search_searchResult.SearchResult,
	    MessengerButton: im_v2_component_elements.Button,
	    ScrollWithGradient: im_v2_component_elements.ScrollWithGradient
	  },
	  props: {
	    dialogId: {
	      type: String,
	      required: true
	    }
	  },
	  data() {
	    return {
	      searchQuery: '',
	      showHistory: true,
	      isLoading: false,
	      selectedItems: new Set(),
	      needTopShadow: false,
	      needBottomShadow: true
	    };
	  },
	  computed: {
	    ButtonSize: () => im_v2_component_elements.ButtonSize,
	    ButtonColor: () => im_v2_component_elements.ButtonColor,
	    searchConfig: () => searchConfig,
	    dialog() {
	      return this.$store.getters['chats/get'](this.dialogId, true);
	    },
	    chatId() {
	      return this.dialog.chatId;
	    },
	    isChat() {
	      return this.dialog.type !== im_v2_const.ChatType.user;
	    }
	  },
	  created() {
	    this.chatService = new im_v2_provider_service.ChatService();
	    this.membersSelector = this.getTagSelector();
	  },
	  mounted() {
	    this.membersSelector.renderTo(this.$refs['tag-selector']);
	    this.membersSelector.focusTextBox();
	  },
	  methods: {
	    getTagSelector() {
	      let timeoutId = null;
	      return new ui_entitySelector.TagSelector({
	        maxHeight: 111,
	        showAddButton: false,
	        showTextBox: true,
	        addButtonCaption: this.$Bitrix.Loc.getMessage('IM_ENTITY_SELECTOR_ADD_TO_CHAT_ADD'),
	        addButtonCaptionMore: this.$Bitrix.Loc.getMessage('IM_ENTITY_SELECTOR_ADD_TO_CHAT_ADD_MORE'),
	        showCreateButton: false,
	        events: {
	          onBeforeTagAdd: () => {
	            clearTimeout(timeoutId);
	          },
	          onAfterTagAdd: event => {
	            const {
	              tag
	            } = event.getData();
	            const itemUniqId = `${tag.entityId}|${tag.id}`;
	            this.selectedItems.add(itemUniqId);
	            this.focusSelector();
	          },
	          onBeforeTagRemove: () => {
	            clearTimeout(timeoutId);
	          },
	          onAfterTagRemove: event => {
	            const {
	              tag
	            } = event.getData();
	            const itemUniqId = `${tag.entityId}|${tag.id}`;
	            this.selectedItems.delete(itemUniqId);
	            this.focusSelector();
	          },
	          onInput: () => {
	            this.searchQuery = this.membersSelector.getTextBoxValue();
	          },
	          onBlur: event => {
	            const inputText = this.membersSelector.getTextBoxValue();
	            if (inputText.length > 0) {
	              return;
	            }
	            timeoutId = setTimeout(() => {
	              this.membersSelector.hideTextBox();
	              this.membersSelector.showAddButton();
	            }, 200);
	          },
	          onContainerClick: () => {
	            this.focusSelector();
	          }
	        }
	      });
	    },
	    focusSelector() {
	      this.membersSelector.hideAddButton();
	      this.membersSelector.showTextBox();
	      this.membersSelector.focusTextBox();
	    },
	    prepareMembers(members) {
	      const preparedMembers = [];
	      [...members].forEach(item => {
	        const [type, id] = item.split('|');
	        if (type === im_v2_const.SearchEntityIdTypes.user || type === im_v2_const.SearchEntityIdTypes.bot) {
	          preparedMembers.push(id);
	        } else if (type === im_v2_const.SearchEntityIdTypes.department) {
	          preparedMembers.push(`${type}${id}`);
	        }
	      });
	      return preparedMembers;
	    },
	    onSelectItem(event) {
	      const {
	        selectedItem,
	        selectedStatus,
	        nativeEvent
	      } = event;
	      if (selectedStatus) {
	        this.membersSelector.addTag({
	          id: selectedItem.getId(),
	          entityId: selectedItem.getEntityId(),
	          entityType: selectedItem.getEntityType(),
	          title: selectedItem.getTitle(),
	          avatar: selectedItem.getAvatar()
	        });
	      } else {
	        this.membersSelector.removeTag({
	          id: selectedItem.getId(),
	          entityId: selectedItem.getEntityId()
	        });
	      }
	      this.membersSelector.clearTextBox();
	      if (!nativeEvent.altKey) {
	        this.searchQuery = '';
	      }
	    },
	    onInviteClick() {
	      const members = this.prepareMembers(this.selectedItems);
	      if (this.isChat) {
	        this.extendChat(members);
	      } else {
	        members.push(this.dialogId, im_v2_application_core.Core.getUserId());
	        this.createChat(members);
	      }
	    },
	    extendChat(members) {
	      this.isLoading = true;
	      this.chatService.addToChat({
	        chatId: this.chatId,
	        members,
	        showHistory: this.showHistory
	      }).then(() => {
	        this.isLoading = false;
	        this.$emit('close');
	      }).catch(error => {
	        console.error(error);
	        this.isLoading = false;
	        this.$emit('close');
	      });
	    },
	    createChat(members) {
	      this.isLoading = true;
	      this.chatService.createChat({
	        title: null,
	        description: null,
	        members,
	        ownerId: im_v2_application_core.Core.getUserId(),
	        isPrivate: true
	      }).then(newDialogId => {
	        this.isLoading = false;
	        im_public.Messenger.openChat(newDialogId);
	      }).catch(error => {
	        console.error(error);
	        this.isLoading = false;
	      });
	    },
	    onListScroll(event) {
	      this.needBottomShadow = event.target.scrollTop + event.target.clientHeight !== event.target.scrollHeight;
	      if (event.target.scrollTop === 0) {
	        this.needTopShadow = false;
	        return;
	      }
	      this.needTopShadow = true;
	    }
	  },
	  template: `
		<div class="bx-im-entity-selector-add-to-chat__container bx-im-entity-selector-add-to-chat__scope">
			<div class="bx-im-entity-selector-add-to-chat__input" ref="tag-selector"></div>
			<div v-if="isChat" class="bx-im-entity-selector-add-to-chat__show-history">
				<input type="checkbox" id="bx-im-entity-selector-add-to-chat-show-history" v-model="showHistory">
				<label for="bx-im-entity-selector-add-to-chat-show-history">
					{{ $Bitrix.Loc.getMessage('IM_ENTITY_SELECTOR_ADD_TO_CHAT_SHOW_HISTORY')}}
				</label>
			</div>
			<div class="bx-im-entity-selector-add-to-chat__search-result-container">
				<ScrollWithGradient :gradientHeight="28">
					<SearchResult
						:searchMode="true"
						:searchQuery="searchQuery"
						:searchConfig="searchConfig"
						:selectMode="true"
						:selectedItems="[...selectedItems]"
						@selectItem="onSelectItem"
						@scroll="onListScroll"
					/>
				</ScrollWithGradient>
			</div>
			<div class="bx-im-entity-selector-add-to-chat__buttons">
				<MessengerButton
					:size="ButtonSize.L"
					:color="ButtonColor.Primary"
					:isRounded="true"
					:isLoading="isLoading"
					:text="$Bitrix.Loc.getMessage('IM_ENTITY_SELECTOR_ADD_TO_CHAT_INVITE_BUTTON')"
					:isDisabled="selectedItems.size === 0"
					@click="onInviteClick"
				/>
				<MessengerButton
					:size="ButtonSize.L"
					:color="ButtonColor.LightBorder"
					:isRounded="true"
					:text="$Bitrix.Loc.getMessage('IM_ENTITY_SELECTOR_ADD_TO_CHAT_CANCEL_BUTTON')"
					@click="$emit('close')"
				/>
			</div>
		</div>
	`
	};

	const POPUP_ID = 'im-add-to-chat-popup';

	// @vue/component
	const AddToChat = {
	  name: 'AddToChat',
	  components: {
	    MessengerPopup: im_v2_component_elements.MessengerPopup,
	    AddToChatContent
	  },
	  props: {
	    showPopup: {
	      type: Boolean,
	      required: true
	    },
	    bindElement: {
	      type: Object,
	      required: true
	    },
	    dialogId: {
	      type: String,
	      required: true
	    },
	    popupConfig: {
	      type: Object,
	      required: true
	    }
	  },
	  emits: ['close'],
	  computed: {
	    POPUP_ID: () => POPUP_ID,
	    config() {
	      return {
	        titleBar: this.$Bitrix.Loc.getMessage('IM_ENTITY_SELECTOR_ADD_TO_CHAT_INVITE_MEMBERS_TITLE'),
	        closeIcon: true,
	        bindElement: this.bindElement,
	        offsetTop: this.popupConfig.offsetTop,
	        offsetLeft: this.popupConfig.offsetLeft,
	        padding: 0,
	        contentPadding: 0,
	        contentBackground: '#fff',
	        className: 'bx-im-entity-selector-add-to-chat__scope'
	      };
	    }
	  },
	  template: `
		<MessengerPopup
			v-if="showPopup"
			v-slot="{enableAutoHide, disableAutoHide}"
			:config="config"
			@close="$emit('close')"
			:id="POPUP_ID"
		>
			<AddToChatContent :dialogId="dialogId" @close="$emit('close')"/>
		</MessengerPopup>
	`
	};

	// @vue/component
	const ForwardContent = {
	  name: 'ForwardContent',
	  components: {
	    SearchExperimental: im_v2_component_search_searchExperimental.SearchExperimental,
	    ChatSearchInput: im_v2_component_search_chatSearchInput.ChatSearchInput
	  },
	  props: {
	    messageId: {
	      type: [Number, String],
	      required: true
	    }
	  },
	  emits: ['close'],
	  data() {
	    return {
	      searchQuery: '',
	      isLoading: false
	    };
	  },
	  methods: {
	    onLoading(value) {
	      this.isLoading = value;
	    },
	    onUpdateSearch(query) {
	      this.searchQuery = query;
	    },
	    async onSelectItem(event) {
	      const {
	        dialogId
	      } = event;
	      await im_public.Messenger.openChat(dialogId);
	      main_core_events.EventEmitter.emit(im_v2_const.EventType.textarea.insertForward, {
	        messageId: this.messageId
	      });
	      this.$emit('close');
	    }
	  },
	  template: `
		<div class="bx-im-entity-selector-forward__container">
			<div class="bx-im-entity-selector-forward__input">
				<ChatSearchInput 
					:searchMode="true" 
					:isLoading="isLoading" 
					:withIcon="false" 
					:delayForFocusOnStart="1"
					@updateSearch="onUpdateSearch"
				/>
			</div>
			<div class="bx-im-entity-selector-forward__search-result-container">
				<SearchExperimental
					:searchMode="true"
					:searchQuery="searchQuery"
					:selectMode="true"
					:withMyNotes="true"
					:handleClickItem="false"
					@clickItem="onSelectItem"
					@loading="onLoading"
				/>
			</div>
		</div>
	`
	};

	const POPUP_ID$1 = 'im-forward-popup';

	// @vue/component
	const ForwardPopup = {
	  name: 'ForwardPopup',
	  components: {
	    MessengerPopup: im_v2_component_elements.MessengerPopup,
	    ForwardContent
	  },
	  props: {
	    showPopup: {
	      type: Boolean,
	      required: true
	    },
	    messageId: {
	      type: [Number, String],
	      required: true
	    }
	  },
	  emits: ['close'],
	  computed: {
	    POPUP_ID: () => POPUP_ID$1,
	    config() {
	      return {
	        titleBar: this.$Bitrix.Loc.getMessage('IM_ENTITY_SELECTOR_ADD_TO_CHAT_FORWARD_TITLE'),
	        closeIcon: true,
	        targetContainer: document.body,
	        fixed: true,
	        draggable: true,
	        padding: 0,
	        autoHide: false,
	        contentPadding: 0,
	        contentBackground: '#fff',
	        className: 'bx-im-entity-selector-forward__scope'
	      };
	    }
	  },
	  template: `
		<MessengerPopup
			v-if="showPopup"
			:id="POPUP_ID"
			:config="config"
			@close="$emit('close')"
		>
			<ForwardContent :messageId="messageId" @close="$emit('close')" />
		</MessengerPopup>
	`
	};

	exports.AddToChat = AddToChat;
	exports.ForwardPopup = ForwardPopup;

}((this.BX.Messenger.v2.Component.EntitySelector = this.BX.Messenger.v2.Component.EntitySelector || {}),BX.UI.EntitySelector,BX.Messenger.v2.Application,BX.Messenger.v2.Provider.Service,BX.Messenger.v2.Component,BX.Main,BX.Messenger.v2.Component.Elements,BX.Event,BX.Messenger.v2.Lib,BX.Messenger.v2.Const,BX.Messenger.v2.Component,BX.Messenger.v2.Component));
//# sourceMappingURL=registry.bundle.js.map
