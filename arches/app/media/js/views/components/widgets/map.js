define([
    'arches',
    'underscore',
    'knockout',
    'knockout-mapping',
    'viewmodels/widget',
    'viewmodels/map-editor',
    'bindings/chosen',
    'bindings/codemirror',
    'codemirror/mode/javascript/javascript',
    'select2',
    'bindings/select2v4',
    'bindings/fadeVisible',
    'bindings/mapbox-gl',
    'bindings/chosen',
    'bindings/color-picker',
    'geocoder-templates'
], function(arches, _, ko, koMapping, WidgetViewModel, MapEditorViewModel) {
    var viewModel = function(params) {
        this.context = params.type;
        this.summaryDetails = [];
        this.defaultValueOptions = [
            {
                "name": "",
                "defaultOptionid": 0,
                "value": ""
            },
            {
                "name": "Drawn Location",
                "defaultOptionid": 1,
                "value": "Drawn Location"
            },
            {
                "name": "Current Device Location",
                "defaultOptionid": 2,
                "value": "Current Device Location"
            }
        ];

        params.configKeys = [
            'zoom',
            'centerX',
            'centerY',
            'geometryTypes',
            'defaultValueType',
            'defaultValue'
        ];


        WidgetViewModel.apply(this, [params]);

        this.geometryTypeList = ko.computed({
            read: function() {
                var geometryTypes = this.geometryTypes() || [];
                return geometryTypes.map(function(type) {
                    return ko.unwrap(type.id);
                });
            },
            write: function(value) {
                this.geometryTypes(value.map(function(type) {
                    return {
                        id: type,
                        text: type
                    };
                }));
            },
            owner: this
        });

        this.displayValue = ko.computed(function() {
            var value = koMapping.toJS(this.value);
            if (!value || !value.features) {
                return 0;
            }
            return value.features.length;
        }, this);
        self.linkedTotalCount = 0;//MJ ADD

        this.queryString = ko.computed(function() {
            var params = {};
            return params;
        }, this);

        this.getLinkedRecordsCount = function(data)
        {
          // var request_json = {"query":{"bool":{"must":[{"match":{"reference_links":"1e9dfdd2-2042-37ed-9720-1a3a9f917018"}}],"must_not":[],"should":[]}},"from":0,"size":10,"sort":[],"aggs":{"type":{"terms":{"field":"type.base"}}}};
        /*  var request_json = {"query":{"bool":{"must":[{"match":{"reference_links":"245cfdbd-c47a-381f-93cd-0ea58d24c3f9"}}],"must_not":[],"should":[]}},"from":0,"size":10,"sort":[],"aggs":{"type":{"terms":{"field":"type.base"}}}};
          
          $.ajax({
                //url: "http://imuseum.im/es/_search",//arches.urls.feature_popup_content,
                url: "http://localhost:9200/_search",//arches.urls.feature_popup_content,
                data: JSON.stringify(request_json),
                method: 'POST',
                contentType: "application/json",
          }).done(function(data)
          {
                self.linkedTotalCount = 0;
     
                console.log(data);
                 
                if(data.aggregations.type.buckets)
                {
                    data.aggregations.type.buckets.forEach(bucket => self.linkedTotalCount += bucket.doc_count);
                }
                 
                console.log("total count :" +self.linkedTotalCount); 
          }, 
          this);*/



         // console.log("1 "+self.popupData());
          //console.log("2 "+ko.unwrap(self.popupData()).resourceinstanceid);
         // console.log("3 "+self.hoverData());
        // console.log("4 "+ self.clickData());

        if(self.activeresource == data.resourceinstanceid && (self.activeresource != null && data.resourceinstanceid != null))
        {
              //do nothing as we have already loaded 
        }
        else
        {
              //update active resource uuid
              self.activeresource = data.resourceinstanceid;
              //and load linked resources
            var queryString = this.queryString();
            queryString.uuid = data.resourceinstanceid;

            $.ajax({
                url: arches.urls.ciim_count,
                method: 'GET',
                data: queryString               
            }).done(function(data)
            {
                self.linkedTotalCount = 0;

                //console.log(data);

                if(data.aggregations.type.buckets)
                {
                    data.aggregations.type.buckets.forEach(bucket => self.linkedTotalCount += bucket.doc_count);
                }
            }, this);
        }
    }
         

        if (params.widget) params.widgets = [params.widget];

        if (ko.unwrap(this.value) !== null) {
            this.summaryDetails = koMapping.toJS(this.value).features || [];
        }

        if (this.centerX() == 0 && this.centerY() == 0 && this.zoom() == 0) {
            this.centerX(arches.mapDefaultX);
            this.centerY(arches.mapDefaultY);
            this.zoom(arches.mapDefaultZoom);
        }
        params.zoom = this.zoom;
        params.x = this.centerX;
        params.y = this.centerY;
        params.usePosition = true;

        MapEditorViewModel.apply(this, [params]);
    };
    ko.components.register('map-widget', {
        viewModel: viewModel,
        template: {
            require: 'text!templates/views/components/widgets/map.htm'
        }
    });
    return viewModel;
});
