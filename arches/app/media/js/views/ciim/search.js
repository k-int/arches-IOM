require([
    'jquery',
    'underscore',
    'knockout',
    'backbone',
    'knockout-mapping',
    'uuid',
    'search-data',
    'arches',
    'views/base-manager',
    'bindings/chosen',
    'core-js',
    'dom-4'
], function($, _, ko, Backbone, koMapping, uuid, data, arches, BaseManagerView) {
    /**
    * a BaseManagerView representing the resource listing and recent edits pages
    */
    var ArtefactsView = BaseManagerView.extend({
        initialize: function(options){

            var self = this;
            
            ko.subscribable.fn.subscribeChanged = function (callback) {
                var oldValue;
                this.subscribe(function (_oldValue) {
                    oldValue = _oldValue;
                }, this, 'beforeChange');

                this.subscribe(function (newValue) {
                    callback(newValue, oldValue);
                });
            };

            console.log("resource id is" + data.resourceid);
            
            _.defaults(this.viewModel, {
                showFind: ko.observable(false),
                graphId: ko.observable(null),
                arches: arches,
                artefacts: ko.observableArray(),//instantiate observable array
                total: ko.observable(),
                filter: function (filter_val)
                {
                    self.viewModel.page(1)
                	if(filter_val != self.viewModel.primaryFilter())
                	{
                		console.log("filter called : " + filter_val);
                		self.viewModel.primaryFilter(filter_val);
                	}
                	else
                	{
                		self.viewModel.primaryFilter("*");
                	}      
                },
                reload: function (obj, event)
                {
                    console.log(obj + " reload");
                    self.getLinkedRecords();
                },
                sort: function (sort_val)
                {
                    if(sort_val != self.viewModel.sortOrder())
                    {
                        console.log("sort called : " + sort_val);
                        self.viewModel.sortOrder(sort_val);
                    }
                    else
                    {
                        self.viewModel.sortOrder("asc");
                    }      
                },
                reload: function (obj, event)
                {
                    console.log(obj + " reload");
                    self.getLinkedRecords();
                },
                primaryFilter: ko.observable("*"),
                sortOrder: ko.observable("asc"),
                searchResults: ko.observable(),
                searchFilters: ko.observable(),
                searchSort: ko.observable(),
                page: ko.observable(1),
                paginator: koMapping.fromJS({}),
                showPaginator: ko.observable(false),
                userRequestedNewPage: ko.observable(false),
                viewURL: ko.observable(arches.urls.ciim_resource),//this is not being found
                newPage: function(page){
                    if(page){
                        self.viewModel.userRequestedNewPage(true);
                        self.viewModel.page(page);
                    }
                }
            });
            
            this.viewModel.primaryFilter.subscribeChanged(function (newValue, oldValue) {
            	if(newValue != oldValue)
            	{
            		console.log(newValue + " " + oldValue);
            		self.getLinkedRecords();
            	}
            });
            this.viewModel.sortOrder.subscribeChanged(function (newValue, oldValue) {
                if(newValue != oldValue)
                {
                    console.log(newValue + " " + oldValue);
                   
                    self.getLinkedRecords();
                }
            });

            //maybe we can get rid of this?
            this.viewModel.graphId.subscribe(function(graphid) {
                if(graphid && graphid !== ""){
                    self.viewModel.navigate(arches.urls.add_resource(graphid));
                }
            });
            
            this.queryString = ko.computed(function() {
                var params = {};
                return params;
            }, this);
            
            this.viewModel.page.subscribe(function(){
                if(this.viewModel.userRequestedNewPage()){
                    this.viewModel.userRequestedNewPage(false);
                    this.getLinkedRecords();
                }
            }, this);
            
            this.getLinkedRecords = function()
            {
            	console.log("get linked records called ");
                var queryString = this.queryString();
                queryString.page = this.viewModel.page();
                queryString.uuid = data.resourceid;
                queryString.primaryFilter = self.viewModel.primaryFilter();
                queryString.sortOrder = self.viewModel.sortOrder();
                
                $.ajax({
                    url: arches.urls.ciim_search,
                    method: 'GET',
                    data: queryString
                }).done(function(data){
                  
                    console.log(data);
                    self.updateResults(data);
                    self.viewModel.total(data.results.hits.total);
                    self.viewModel.searchResults = data;
                    
                    data.results.aggregations.type.buckets.push({ doc_count: 0, key: "object"});
                    
                    self.viewModel.searchFilters({"type":data.results.aggregations.type.buckets,"primaryFilter":data.results.aggregations.primaryFilter.buckets});
                    //self.viewModel.searchFilters({"type":data.results.aggregations.type.buckets,"sortOrder":data.results.aggregations.sortOrder.buckets});
                    //add results to my observable array
                    data.results.hits.hits.forEach(hit => self.viewModel.artefacts.push(hit));
                    
                    //clear the uuid
                    delete queryString.uuid;
                    //update url in browser with page number etc
                    window.history.pushState({}, '', '?' + $.param(queryString).split('+').join('%20'));
                     
                }, this);
            }
            
            this.getLinkedRecords();

            BaseManagerView.prototype.initialize.call(this, options);
        },
        updateResults: function(response){
            var self = this;
            
            koMapping.fromJS(response.paginator, self.viewModel.paginator);
            
            if(response.results.hits.total <= self.viewModel.paginator.per_page())
            {
                self.viewModel.showPaginator(false);
            }
            else
            {
                self.viewModel.showPaginator(true);
            }
            
            self.viewModel.total(response.results.hits.total);
            self.viewModel.artefacts.removeAll();
            self.viewModel.userRequestedNewPage(false);
           
            //need?
            //self.viewModel.userIsReviewer = response.reviewer;
            
            //need to do anything here?
            response.results.hits.hits.forEach(function(result){
             
            }, this);

            return response;
        },
        newPage: function(page){
            if(page){
                self.viewModel.userRequestedNewPage(true);
                self.viewModel.page(page);
            }
        }
    });
    return new ArtefactsView();
});