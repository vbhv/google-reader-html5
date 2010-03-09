GoogleReaderConst = {
		URI_LOGIN: 'https://www.google.com/accounts/ClientLogin',
		URI_PREFIXE_READER: 'http://www.google.com/reader/',

		ATOM_GET_FEED: 'feed/',

		ATOM_PREFIXE_USER: 'user/-/',
		ATOM_PREFIXE_USER_NUMBER: 'user/'+'0'*20+'/',

		API_EDIT_SUBSCRIPTION: 'subscription/edit',
		API_EDIT_TAG: 'edit-tag',

		API_LIST_PREFERENCE: 'preference/list',
		API_LIST_SUBSCRIPTION: 'subscription/list',
		API_LIST_TAG: 'tag/list',
		API_LIST_UNREAD_COUNT: 'unread-count',
		API_TOKEN: 'token',
		ITEMS_PER_REQUEST: 100, // just a default

		OUTPUT_XML: 'xml',
		OUTPUT_JSON: 'json',

		AGENT:'js-googlereader',

		ATOM_ARGS: {
				'startTime' : 'ot',
				'order' : 'r',
				'excludeTarget' : 'xt',
				'count' : 'n',
				'continuation' : 'c',
				'client' : 'client',
				'timestamp' : 'ck',
				'feed' : 'feed',
				},

		EDIT_TAG_ARGS: {
				'feed' : 's',
				'entry' : 'i',
				'add' : 'a',
				'remove' : 'r',
				'action' : 'ac',
				'token' : 'T',
				},

		EDIT_SUBSCRIPTION_ARGS: {
				'feed' : 's',
				'entry' : 'i',
				'title' : 't',
				'add' : 'a',
				'remove' : 'r',
				'action' : 'ac',
				'token' : 'T',
				},

		LIST_ARGS: {
				'output' : 'output',
				'client' : 'client',
				'timestamp' : 'ck',
				'all' : 'all',
				},

		QUICKADD_ARGS: {
				'url' : 'quickadd',
				'token' : 'T',
		},

		ORDER_REVERSE: 'o',
		ACTION_REVERSE: 'o',

		GOOGLE_SCHEME: 'http://www.google.com/reader/',
}


GoogleReaderConst['URI_PREFIXE_ATOM'] = GoogleReaderConst.URI_PREFIXE_READER + 'atom/';
GoogleReaderConst['URI_PREFIXE_API'] = GoogleReaderConst.URI_PREFIXE_READER + 'api/0/';
GoogleReaderConst['URI_PREFIXE_VIEW'] = GoogleReaderConst.URI_PREFIXE_READER + 'view/';
GoogleReaderConst['ATOM_PREFIXE_LABEL'] = GoogleReaderConst.ATOM_PREFIXE_USER + 'label/';
GoogleReaderConst['ATOM_PREFIXE_STATE_GOOGLE'] = GoogleReaderConst.ATOM_PREFIXE_USER + 'state/com.google/';
GoogleReaderConst['ATOM_STATE_READ'] = GoogleReaderConst.ATOM_PREFIXE_STATE_GOOGLE + 'read';
GoogleReaderConst['ATOM_STATE_UNREAD'] = GoogleReaderConst.ATOM_PREFIXE_STATE_GOOGLE + 'kept-unread';
GoogleReaderConst['ATOM_STATE_FRESH'] = GoogleReaderConst.ATOM_PREFIXE_STATE_GOOGLE + 'fresh';
GoogleReaderConst['ATOM_STATE_READING_LIST'] = GoogleReaderConst.ATOM_PREFIXE_STATE_GOOGLE + 'reading-list';
GoogleReaderConst['ATOM_STATE_BROADCAST'] = GoogleReaderConst.ATOM_PREFIXE_STATE_GOOGLE + 'broadcast';
GoogleReaderConst['ATOM_STATE_STARRED'] = GoogleReaderConst.ATOM_PREFIXE_STATE_GOOGLE + 'starred';
GoogleReaderConst['ATOM_SUBSCRIPTIONS'] = GoogleReaderConst.ATOM_PREFIXE_STATE_GOOGLE + 'subscriptions';
GoogleReaderConst['URI_QUICKADD'] = GoogleReaderConst.URI_PREFIXE_READER + 'quickadd';
GoogleReaderConst['URI_PING'] = GoogleReaderConst.URI_PREFIXE_READER + 'user-info';

