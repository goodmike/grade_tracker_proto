var originalSync = Backbone.sync;

Backbone.sync = function(method, model, options) {

   // Default JSON-request options.
   var params = _.extend({
     contentType:  'application/xml',
     dataType:     'xml',
     processData:  false
   }, options);
   
   originalSync(method, model, params);
};



$("#grades_chart").on('gradesRedraw', function() {
   alert("Redraw!"); 
});

var tableHeaders = function() {
    var headers = [].slice.apply(arguments);
    return "<tr>" + 
        headers.map(function(hdr) { 
            return "<th>" + hdr + "</th>"
        }).join("\n") + 
    "</tr>";
};

$(function() {
   
   window.Grade = Backbone.Model.extend({

   });
   
   window.GradeList = Backbone.Collection.extend({
       
       model: Grade,
//       url: "/grades",
//       parse: function(response) {
//           console.log("GradeList#parse");
//           var items = new Backbone.Collection(response.collection.items);
//           this.items_length = items.length;
//           return items.pluck("data");
//      },
        url: "/tracker",
        parse: function(response) {
            console.log("GradeList#parse");
/*
            var data = $("table.all", response);
            var cols = _.pluck($("col", data), 'className');
            var rows = $("tr", data).slice(1);
            var models = _.map(rows, function(tr, key) {
                var table_cells = $("td", $(tr))
                var model = _.reduce(table_cells, function(memo, td, key) {
                    memo[cols[key]] = $(td).html();
                    return memo;
                }, {});
                return model;
            });
            return models;
*/
            return [{date: "2012-02-01", assessment: "homework", 
                     details_link: "<a href=\"/grades/68ed2c9f8457e4054ac82f756d5ea541\">Details</a>",
                     score: "100", weight: "1", weighted_score: "100"}];
        },
        resetFromGradesTable: function() {
            var data = $("table.all");
            var cols = _.pluck($("col", data), 'className');
            var rows = $("tr", data).slice(1);
            var models = _.map(rows, function(tr, key) {
                var table_cells = $("td", $(tr))
                var model = _.reduce(table_cells, function(memo, td, key) {
                    memo[cols[key]] = $(td).html();
                    return memo;
                }, {});
                return model;
            });
            this.reset(models);
       }
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
          console.log("Examining Model");
          console.log(this.model);
          console.log(this.model.toJSON());
          console.log(this.model.score);
        $(this.el).html(this.template(this.model.toJSON()));
        return this;
      }
   });
   
   window.AppView = Backbone.View.extend({
      
        el: $("#grades_table"),
        initialize: function() {
            
            this.grades = new GradeList();
            // this.grades.resetFromGradesTable();
            this.gradeListView = new GradeListView({model:this.grades});
            this.grades.fetch();
            $(this.el).html(this.gradeListView.render().el);
        },
      
    });
    
    window.App = new AppView;
   
});