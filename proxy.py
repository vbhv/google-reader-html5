#!/usr/bin/env python

import cgi
import cgitb
import urllib2
import urllib
import cookielib
cgitb.enable()

print "Content-Type: text/html"
print

params = cgi.FieldStorage()

params = dict((p.name, p.value) for p in params.list)

url = params.pop('url')
method = 'GET' if not 'method' in params else params.pop('method')
param_str = urllib.urlencode(params)

args = (url, param_str)
if method == 'GET':
	args = (("%s?%s" % args),)

if 'SID' in params:
	cookie = cookielib.Cookie(version=0, name='SID', value=params.pop('SID'), port=None, port_specified=False, domain='.google.com', domain_specified=True, domain_initial_dot=True, path='/', path_specified=True, secure=False, expires='1600000000', discard=False, comment=None, comment_url=None, rest={})
	handler = urllib2.HTTPCookieProcessor()
	handler.cookiejar.set_cookie(cookie)
	urllib2.install_opener(urllib2.build_opener(handler))

stream = urllib2.urlopen(*args)
print stream.read()
