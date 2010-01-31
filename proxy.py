#!/usr/bin/env python

import cgi
import cgitb
import urllib2
import urllib
import cookielib
cgitb.enable()

params = cgi.FieldStorage()

params = dict((p.name, p.value) for p in params.list)

url = params.pop('url')
method = params.pop('method') if 'method' in params else 'GET'
param_str = urllib.urlencode(params)

if 'FAKE' in params:
	import fake_cache
	print fake_cache.respond(url, params)
	import sys
	sys.exit(0)

args = (url, param_str)
if method == 'GET':
	args = (("%s?%s" % args),)

if 'SID' in params:
	cookie = cookielib.Cookie(version=0, name='SID', value=params.pop('SID'), port=None, port_specified=False, domain='.google.com', domain_specified=True, domain_initial_dot=True, path='/', path_specified=True, secure=False, expires='1600000000', discard=False, comment=None, comment_url=None, rest={})
	handler = urllib2.HTTPCookieProcessor()
	handler.cookiejar.set_cookie(cookie)
	urllib2.install_opener(urllib2.build_opener(handler))

stream = urllib2.urlopen(*args)
content_type = stream.info().type
print "Content-Type: %s" % (content_type,)
print
print stream.read()
