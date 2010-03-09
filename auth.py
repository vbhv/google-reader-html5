from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
import sys
import urllib
import gdata.service
import gdata.alt.appengine

def auth(email, passwd, captcha_token=None, captcha_response=None):
	client = gdata.service.GDataService()
	gdata.alt.appengine.run_on_appengine(client, store_tokens=False, single_user_mode=True)
	client.email = email
	client.password = passwd
	client.service = 'reader'
	kw = {}
	if captcha_token and captcha_response:
		kw['captcha_token'] = captcha_token
		kw['captcha_response'] = captcha_response
	try:
		client.ProgrammaticLogin(**kw)
	except gdata.service.CaptchaRequired, e:
		return "{error:\"captcha\", captcha_image: \"%s\", captcha_token: \"%s\"}" % (
			urllib.quote(client.captcha_url),
			urllib.quote(client.captcha_token))
	return client.current_token

class AuthHandler(webapp.RequestHandler):
	def post(self):
		p = self.request.get
		try:
			token = auth(p("user"), p("pass"), captcha_token=p("captcha_token"), captcha_response=p("captcha_esponse"))
			if not token:
				raise RuntimeError("empty token!")
			self.response.out.write(token)
			import logging
			logging.info(token)
		except gdata.service.BadAuthentication, e:
			self.error(401)
			self.response.out.write("ERROR: %s" % (e,))
		except Exception, e:
			self.error(500)
			self.response.out.write("ERROR: %s" % (e,))
			raise

