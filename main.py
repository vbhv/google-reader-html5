#!/usr/bin/env python

from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
import proxy
from auth import AuthHandler

class ProxyHandler(webapp.RequestHandler):
	def post(self):
		params = {}
		for param in self.request.arguments():
			params[param] = self.request.get(param)
		result = proxy.handle(params, appengine=True)
		import logging
		self.response.headers['Content-Type'] = result.headers['Content-Type']
		if result.status_code != 200:
			self.error(result.status_code)
		self.response.out.write(result.content)

def main():
	application = webapp.WSGIApplication([
		('/proxy*', ProxyHandler),
		('/auth/?', AuthHandler)
		], debug=True)
	util.run_wsgi_app(application)

if __name__ == '__main__':
	main()
