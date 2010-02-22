#!/usr/bin/env python

import urllib
def main():
	import cgi
	import cgitb
	cgitb.enable()

	params = cgi.FieldStorage()

	params = dict((p.name, p.value) for p in params.list)
	print handle(params)


def handle(params, appengine=False):
	url = params.pop('url')
	method = params.pop('method') if 'method' in params else 'GET'
	param_str = urllib.urlencode(params)

	if 'FAKE' in params:
		import fake_cache
		return fake_cache.respond(url, params)

	if method == 'GET':
		url = "%s?%s" % (url, param_str)
		urlargs = (url,)
	else:
		urlargs = (url, param_str)

	if not appengine:
		import urllib2
		if 'SID' in params:
			import cookielib
			cookie = cookielib.Cookie(version=0, name='SID', value=params.pop('SID'), port=None, port_specified=False, domain='.google.com', domain_specified=True, domain_initial_dot=True, path='/', path_specified=True, secure=False, expires='1600000000', discard=False, comment=None, comment_url=None, rest={})
			handler = urllib2.HTTPCookieProcessor()
			handler.cookiejar.set_cookie(cookie)
			urllib2.install_opener(urllib2.build_opener(handler))

		stream = urllib2.urlopen(*urlargs)
		content_type = stream.info().type
		return "Content-Type: %s" % (content_type,) + "\n\n" + stream.read()
	else:
		from google.appengine.api.urlfetch import fetch
		headers = {}
		if 'SID' in params:
			headers['Cookie'] = 'SID=%s' % (params.pop('SID'),)
		response = fetch(*urlargs, method=method, headers=headers, follow_redirects=False, deadline=10)
		return response

if __name__ == '__main__':
	main()

