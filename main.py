#!/usr/bin/env python

from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
import proxy

class MainHandler(webapp.RequestHandler):
	def post(self):
		params = {}
		for param in self.request.arguments():
			params[param] = self.request.get(param)
		result = proxy.handle(params, appengine=True)
		self.response.headers['Content-Type'] = result.headers['Content-Type']
		self.response.out.write(result.content)

def main():
	application = webapp.WSGIApplication([('/.*', MainHandler)], debug=True)
	util.run_wsgi_app(application)

if __name__ == '__main__':
	main()
