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

            console.log("resource id is" + data.resourceid);
            
            _.defaults(this.viewModel, {
                showFind: ko.observable(false),
                graphId: ko.observable(null),
                arches: arches,
                artefacts: ko.observableArray(),//instantiate observable array
                total: ko.observable(),
                searchResults: ko.observable(),
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
                var queryString = this.queryString();
                queryString.page = this.viewModel.page();
                queryString.uuid = data.resourceid;
                
                $.ajax({
                    url: arches.urls.ciim_search,
                    method: 'GET',
                    data: queryString
                }).done(function(data){
                  
                    self.updateResults(data);
                    self.viewModel.total(data.results.hits.total);
                    self.viewModel.searchResults = data;
                    console.log(data);
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
            
            console.log(response);
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