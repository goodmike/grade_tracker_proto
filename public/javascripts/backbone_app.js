var originalSync = Backbone.sync;

Backbone.sync = function(method, model, options) {

   // Default JSON-request options.
   var params = _.extend(options, {
     contentType:  'text/html',
     dataType:     'html',
     processData:  false
   });
   
   originalSync.apply(Backbone, [ method, model, options ]);
};

var tableHeaders = function() {
    var headers = [].slice.apply(arguments);
    return "<tr>" + 
        headers.map(function(hdr) { 
            return "<th>" + hdr + "</th>"
        }).join("\n") + 
    "</tr>";
};

function processGrades(grades) {
    
    var gradesline = _.map(grades, function(grade) {
        return [grade.date + " 12:00PM", parseInt(grade.score, 10)];
    });
           
    var targetline = [["2012-01-23 12:00AM", 88],['2012-03-12 12:00AM', 88]];

    var running_avg_points = _.reduce(grades, function(memo, grade, i) {
        var d = grade.date + " 12:00PM";
        var p = parseInt(grade.weighted_score,10);
        var w = parseInt(grade.weight,10);
        if (i===0) return [{"date": d, "points": p, "weight": w}];
        var last = memo[i-1];
        console.log(last);
        memo.push({"date": d, "points": p + last.points, "weight": w + last.weight});
        return memo;
    }, []);
    var running_avg_line = _.map(running_avg_points, function(point) {
        return [point.date, point.points/point.weight];
    });

    console.log(running_avg_line);
    
    $.jqplot('grades_chart', [targetline, running_avg_line, gradesline], {
    title:'Time Series with default date axis',
    axes:{
        yaxis: {min:50, max:105, tickInterval:10},
        xaxis:{
            renderer:$.jqplot.DateAxisRenderer,
            tickOptions:{formatString:"%b %#d '12"},
            min:'January 23, 2012',
            max:'March 12, 2012',
            tickInterval:'1 week'
        }
    },
    fillBetween: {
      series1: 1,
      series2: 0,
      color: "rgba(227, 167, 111, 0.5)"
    },
    series: [
    {
      // showLine: false
      lineWidth: 1
    },
    {
      rendererOptions: {
        smooth: true
      },
      markerOptions: {
        show: false
      }
    },
    {}]
});
}


$(function() {
   
   window.Grade = Backbone.Model.extend({

   });
   
    window.GradeList = Backbone.Collection.extend({
       
       model: Grade,

        url: "/tracker",
        parse: function(response) {
            $("#grades").html($("table.all", $(response)));
            var data = $("#grades");
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
/*
            return [{date: "2012-02-01", assessment: "homework", 
                     details_link: "<a href=\"/grades/68ed2c9f8457e4054ac82f756d5ea541\">Details</a>",
                     score: "100", weight: "1", weighted_score: "100"}];
*/
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
            processGrades(this.model.toJSON());
            return this;
        }
        
    });
   
   window.GradeView = Backbone.View.extend({
      
      tagName: 'tr',
      template: _.template("<td><%= score %></td><td><%= assessment %></td><td><%= score %></td><td><%= weighted_score %></td>"),
      
      render: function() {
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