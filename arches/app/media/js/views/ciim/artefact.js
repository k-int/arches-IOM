require([
    'jquery',
    'underscore',
    'knockout',
    'backbone',
    'search-data',
    'uuid',
    'arches',
    'views/base-manager',
    'bindings/chosen'
], function($, _, ko, Backbone, data, uuid, arches, BaseManagerView) {
    /**
    * a BaseManagerView representing the resource listing and recent edits pages
    */
    var ArtefactView = BaseManagerView.extend({
        initialize: function(options){

            var self = this;

            _.defaults(this.viewModel, {
                showFind: ko.observable(false),
                graphId: ko.observable(null),
                arches: arches,
                artefact: ko.observable(),//instantiate observable array
                viewURL: ko.observable(arches.urls.ciim_resource)//this is not being found
            });
            
            this.viewModel.graphId.subscribe(function(graphid) {
                if(graphid && graphid !== ""){
                    self.viewModel.navigate(arches.urls.add_resource(graphid));
                }
            });
            
            this.queryString = ko.computed(function() {
                var params = {};
                return params;
            }, this);
            
            this.getData = function()
            {
                var queryString = this.queryString();
                queryString.uuid = data.resourceid;
                
                $.ajax({
                    url: arches.urls.ciim_lookup,
                    method: 'GET',
                    data: queryString
                }).done(function(data)
                {
                    self.viewModel.artefact(data.hits.hits[0]);
                    console.log(data);
                }, this);
            }
            
            this.getData();

            BaseManagerView.prototype.initialize.call(this, options);
        }
    });
    return new ArtefactView();
});