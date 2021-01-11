import psycopg2 
import datetime
import pandas as pd 
import os
import csv
import json
import uuid
import psycopg2
from mimetypes import MimeTypes
from rdflib import Graph as RDFGraph, Namespace, RDF, URIRef, Literal
from rdflib.namespace import DCTERMS, SKOS, FOAF, NamespaceManager
from django.db.utils import OperationalError
from django.contrib.gis.geos import GEOSGeometry
from django.contrib.gis.db.models.functions import MakeValid
from arches.app.models.graph import Graph
from arches.app.models.models import Node, File, NodeGroup
from arches.app.models.tile import Tile
from arches.app.utils import v3utils
from arches.app.utils.betterJSONSerializer import JSONSerializer, JSONDeserializer
from arches.app.models.system_settings import settings

ARCHES = Namespace(settings.ARCHES_NAMESPACE_FOR_DATA_EXPORT)

hostname = 'localhost'
username =  'postgres'
password = 'postgis'
database = 'eamenadev'

myConnection = psycopg2.connect(host=hostname, user=username, password=password, dbname=database)
crsr = myConnection.cursor() 


fromdate= input("Input date with format YYYY-MM-DD: ")
fromdate=fromdate.split("-")
this = datetime.datetime(int(fromdate[0]), int(fromdate[1]), int(fromdate[-1]))

sql_command = f"SELECT resourceinstanceid FROM edit_log WHERE timestamp > '{this}';"

crsr.execute(sql_command) 

ans = crsr.fetchall()  

id_list = []

for _id in ans:
	id_list.append((str(_id).split(",")[0]).split("'")[1])

df = pd.DataFrame(id_list, columns=["resourceinstanceid"])
print(df.drop_duplicates())

for _id in df.resourceinstanceid: 
	resourceinstanceid = uuid.UUID(str(_id))
	a = ResourceInstance.objects.get(ResourceInstanceid=resourceinstanceid)
	print(a)
	break
myConnection.close() 



