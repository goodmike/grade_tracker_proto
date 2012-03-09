originalSync = Backbone.sync

// Our new overriding sync with dataType and ContentType
// that override the default JSON configurations.
/*
Backbone.sync = function (method, model, options) {

  var options = _.extend(options,
    { dataType: 'xml',
      contentType: 'application/xml',
      processData: false
    }
  );

  originalSync.apply(Backbone, [ method, model, options ])
};
*/

var tableHeaders = function() {
    var headers = [].slice.apply(arguments);
    return "<tr>" + 
        headers.map(function(hdr) { 
            return "<th>" + hdr + "</th>"
        }).join("\n") + 
    "</tr>";
};

$(function() {
   
   console.log("beginning on-ready JS");
   
   window.Grade = Backbone.Model.extend({
       
   });
   
    window.GradeList = Backbone.Collection.extend({
       
        model: Grade,
        url: "/tracker",
        
        parse: function(response) {
           var items = new Backbone.Collection(response.collection.items);
           this.items_length = items.length;
           return items.pluck("data");
       }
        
/*         parse: function(resp) {
            console.log("GradeList#begin");
            return [
                {"_id":"68ed2c9f8457e4054ac82f756d5ea541","_rev":"1-f1bd42e707e23ad4563cca8481f15e7c","type":"score","topic":"Section 8.1","assessment":"homework","weight":"1","score":"100","notes":"","date":"2012-02-01"},
                {"_id":"68ed2c9f8457e4054ac82f756d5eb039","_rev":"1-cbdd9fa46959755f015e873f9113cc52","type":"score","topic":"Section 8.2","assessment":"homework","weight":"1","score":"100","notes":"","date":"2012-02-03"}
            ];   
        }
*/
/*
        parse: function(response) {
            console.log("GradeList#begin");
            var data = $("table.all", response);
            var cols = _.pluck($("col", data), 'className');
            var models = _.map($("tr", data), function(tr, key) {
                var table_cells = $("td", $(tr))
                return _.reduce(table_cells, function(memo, td, key) {
                    memo[cols[key]] = $(td).html();
                    return memo;
                }, {});
            });
            console.log("I have " + models.length + " models.");
            return models;
        }
*/
   });

    window.GradeListView = Backbone.View.extend({
 
        tagName:'table',
 
        initialize:function () {
            this.model.bind("reset", this.render, this);
        },
 
        render:function (eventName) {
            if (this.model.items_length) {
                $("#specialoutput").html("" + this.model.items_length + " records");
            }
            $(this.el).html(tableHeaders("Date","Assessment","Score","Weighted Score"));
            _.each(this.model.models, function (grade) {
                $(this.el).append(new GradeView({model:grade}).render().el);
            }, this);
            $.event.trigger('gradesRedraw');
            return this;
        }
        
    });
   
   window.GradeView = Backbone.View.extend({
      
      tagName: 'tr',
      template: _.template("<td><%= score %></td><td><%= assessment %></td><td><%= score %></td><td><%= weighted_score %></td>"),
      
      render: function() {
        console.log("GradeView render");
        $(this.el).html(this.template(this.model.toJSON()));
        return this;
      }
   });
   
   window.AppView = Backbone.View.extend({
      
        el: $("#grades_table"),
        initialize: function() {
            
            this.grades = new GradeList();
            this.gradeListView = new GradeListView({model:this.grades});
            this.grades.fetch();
            $(this.el).html(this.gradeListView.render().el);
        },
      
    });
    
    window.App = new AppView;
   
});