'''
ARCHES - a program developed to inventory and manage immovable cultural heritage.
Copyright (C) 2013 J. Paul Getty Trust and World Monuments Fund
This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.
This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.
You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <http://www.gnu.org/licenses/>.
'''

#import urllib2
import json
import requests
import logging
#from urlparse import urlparse
from django.shortcuts import render
from arches.app.models.system_settings import settings
from django.http import HttpResponseNotFound, HttpResponse,JsonResponse
from arches.app.models.system_settings import settings
from arches.app.utils.pagination import get_paginator
from arches.app.utils.betterJSONSerializer import JSONSerializer, JSONDeserializer
from datetime import datetime

logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger()
# logger.addHandler(logging.FileHandler('C:/Arches/iom5/iom5/ciim.log', 'a'))
print = logger.info

print('-------------------CIIM PY FILE-----------------')

def get_count(request):
	print("Get count function")
	user = request.user
	# if the user is in the private es group, use the private url. Else use public 
	if user.groups.filter(name=settings.CIIM_PRIVATE_ES_GROUPS).exists(): 
		url = settings.CIIM_ELASTICSEARCH_PRIVATE['url'] + "/_search"
	else: 
		url = settings.CIIM_ELASTICSEARCH_PUBLIC['url'] + "/_search"
	#print("User private?")
	#print(user.groups.filter(name=settings.CIIM_PRIVATE_ES_GROUPS).exists())
	#print(datetime.now())
	#print(url)
	uuid = request.GET.get('uuid')
	print(uuid)
	#uuid =f'"{uuid}"'
	print(uuid)	
	json_q = json.dumps({"query":{"bool":{"must":[{"match":{"arches.sites.keyword":uuid}}],"must_not":[{"term":{"type.base":"site"}}, {"term": {"admin.status":"invalid"}}],"should":[]}},"from":0,"size":10,"sort":[],"aggs":{"type":{"terms":{"field":"type.base"}}}}) 
	headers = {'Content-Type' : 'application/json'}
	#print("Query:")
	print(json_q)
	ret=requests.get(url, headers=headers,  data = json_q)  
	#print("Response:")
	#print(ret.json())
	return JsonResponse(ret.json(), safe=False) 

def search(request):
	user = request.user
	if user.groups.filter(name=settings.CIIM_PRIVATE_ES_GROUPS).exists(): 
		url = settings.CIIM_ELASTICSEARCH_PRIVATE['url'] + "/_search"
	else: 
		url = settings.CIIM_ELASTICSEARCH_PUBLIC['url'] + "/_search"
	print(url)
	#get page param from originating request
	#page = 1 if request.GET.get('page') == '' else int(request.GET.get('page', 1))
	if request.GET.get('page') == '':
		page = 1
	else:
		page = int(request.GET.get('page', 1))

	uuid = request.GET.get('uuid')
	primaryFilter = request.GET.get('primaryFilter')
	secondaryFilter = request.GET.get('secondaryFilter')

	sortOrder = request.GET.get('sortOrder')

	if primaryFilter is None:
		primaryFilter = '*'

	if sortOrder is None:
		sortOrder = 'asc'
	
    #"889c3f25-7f14-37dc-aab4-48a674a5920b"
	#json_q = json.dumps({"query":{"bool":{"must":[{"match":{"arches.sites":uuid}},{"match":{"base.type":primaryFilter}}],"must_not":[],"should":[]}},"from":(settings.SEARCH_ITEMS_PER_PAGE * (page - 1)),"size":settings.SEARCH_ITEMS_PER_PAGE,"sort":[],"aggs":{"type":{"terms":{"field":"type.base"}}}}) 
	if primaryFilter == '*':
		json_q = json.dumps({"query":{"bool":{"must":[{"match":{"arches.sites.keyword":uuid}}],"must_not":[{"term":{"type.base":"site"}}, {"term": {"admin.status":"invalid"}}],"should":[]}},"from":(settings.SEARCH_ITEMS_PER_PAGE * (page - 1)),"size":settings.SEARCH_ITEMS_PER_PAGE,"sort":[{"arches.primarySort.keyword":{"order":sortOrder}}],"aggs":{"type":{"terms":{"field":"type.base"}},"primaryFilter":{"terms":{"field":"arches.primaryFilter.keyword"}}}}) 
	else:
		json_q = json.dumps({"query":{"bool":{"must":[{"match":{"arches.sites.keyword":uuid}},{"match":{"arches.primaryFilter":primaryFilter}}],"must_not":[{"term":{"type.base":"site"}}, {"term": {"admin.status":"invalid"}}],"should":[]}},"from":(settings.SEARCH_ITEMS_PER_PAGE * (page - 1)),"size":settings.SEARCH_ITEMS_PER_PAGE,"sort":[{"arches.primarySort.keyword":{"order":sortOrder}}],"aggs":{"type":{"terms":{"field":"type.base"}},"primaryFilter":{"terms":{"field":"arches.primaryFilter.keyword"}}}}) 
	
	headers = {'Content-Type' : 'application/json'}
	results=requests.get(url, headers=headers,  data = json_q).json()

	
	if results is not None:

		total = results['hits']['total']

		ret = {}
		ret['results'] = results
		
		if primaryFilter is not None:
			ret['primaryFilter'] = primaryFilter
		if secondaryFilter is not None:
			ret['secondaryFilter'] = secondaryFilter

		if sortOrder is not None:
			ret['sortOrder'] = sortOrder
			
		paginator, pages = get_paginator(request, results, total, page, settings.SEARCH_ITEMS_PER_PAGE)
		
		page = paginator.page(page)

		ret['paginator'] = {}
		ret['paginator']['current_page'] = page.number
		ret['paginator']['has_next'] = page.has_next()
		ret['paginator']['has_previous'] = page.has_previous()
		ret['paginator']['has_other_pages'] = page.has_other_pages()
		ret['paginator']['next_page_number'] = page.next_page_number() if page.has_next() else None
		ret['paginator']['previous_page_number'] = page.previous_page_number() if page.has_previous() else None
		ret['paginator']['start_index'] = page.start_index()
		ret['paginator']['end_index'] = page.end_index()
		ret['paginator']['per_page'] = settings.SEARCH_ITEMS_PER_PAGE
		ret['paginator']['pages'] = pages

	return JsonResponse(ret, safe=False) 

def lookup(request):
	user = request.user
	if user.groups.filter(name=settings.CIIM_PRIVATE_ES_GROUPS).exists(): 
		url = settings.CIIM_ELASTICSEARCH_PRIVATE['url']+ "/_search"
	else: 
		url = settings.CIIM_ELASTICSEARCH_PUBLIC['url'] + "/_search"
	print(url)
	uuid = request.GET.get('uuid')
	json_q = json.dumps({"query":{"bool":{"must":[{"match":{"admin.uuid":uuid}}],"must_not":[],"should":[]}},"from":0,"size":1,"sort":[]}) 
	headers = {'Content-Type' : 'application/json'}
	ret=requests.get(url, headers=headers,  data = json_q)  

	#logger.warning('response is ' %)
	return JsonResponse(ret.json(), safe=False) 