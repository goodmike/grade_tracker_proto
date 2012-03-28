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

function processGrades(grades, chart_el_id) {
    
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
    
    function labelDate(grade_date) {
        var m_names = new Array("Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec");

        var d = new Date(grade_date);
        var curr_date = d.getDate();
        var curr_month = d.getMonth();
        var curr_year = d.getFullYear();

        return m_names[curr_month] + " " + curr_date + " " + curr_year;
    }
    
    $.jqplot(chart_el_id, [targetline, running_avg_line, gradesline], {
    title:'Scores, Running Average versus Goal',
    axes:{
        yaxis: {min:50, max:104, tickInterval:10},
        xaxis:{
            renderer:$.jqplot.DateAxisRenderer,
            tickOptions:{formatString:"%b %#d '12"},
            min: labelDate(grades[0].date),
            max: labelDate(grades[grades.length-1].date),
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

var binderUrl = "/binder/";
var httpAPIUrl = "/html/";

$(function() {
   
    window.Tracker = Backbone.Model.extend({
        
        initialize: function(attributes) {
            this.data_url = attributes.data_url;
        },
        
        parse: function(response) {
            if (!this.fetch_details) {
                return response;
            }
            $("#primary_data").html($("div#tracker", $(response)));
            $("#primary_data").append($("div#grades", $(response)));
            var tracker_el = $("li", $("div#tracker ul.single"));
            var new_model = {
                data_url: $("a[rel=tracker]", tracker_el).attr("href"),
                subject: $(".subject", tracker_el).text(),
                start_date: $(".start_date", tracker_el).text(),
                end_date: $(".end_date", tracker_el).text(),
                goal: $(".goal", tracker_el).text(),
                id: tracker_el[0].id
            };
            return new_model;
        },
      
        url: function() {
            return this.data_url; 
        }

    });
   
    window.TrackerList = Backbone.Collection.extend({
        model: window.Tracker,
        
        parse: function(response) {
            $("#primary_data").html($("div#trackers ul.all", $(response)));
            var data = $("#primary_data ul.all");

            var records = $("li", data);
            var models = _.map(records, function(li, k) {
                return {
                    data_url: $("a[rel=tracker]", $(li)).attr("href"),
                    subject: $(".subject", $(li)).text(),
                    start_date: $(".start_date", $(li)).text(),
                    end_date: $(".end_date", $(li)).text(),
                    goal: $(".goal", $(li)).text(),
                    id: li.id,
                    details_fetched: false
                };
            });
            return models;
        },
        
        url: httpAPIUrl + "trackers"
    });
    
    
    window.TrackerListView = Backbone.View.extend({
 
        tagName:'div',
 
        initialize:function () {
            this.model.bind("reset", this.render, this);
        },
 
        render:function (eventName) {
            
            $(this.el).html('<ul class="trackers">');
            var ul = $("ul.trackers", $(this.el));
            _.each(this.model.models, function (tracker) {
                $(ul).append(new TrackerListItemView({model:tracker}).render().el);
            }, this);
            $(this.el).append('</ul>');
            return this;
        }
        
    });
    
    window.TrackerListItemView = Backbone.View.extend({
 
        tagName:"li",
        template: _.template('<a href="#trackers/<%= id %>"><%= subject %></a>'),
 
        render:function (eventName) {
            $(this.el).html(this.template(this.model.toJSON()));
            return this;
        }
 
    });
   
    window.TrackerView = Backbone.View.extend({
      
        tagName: "div",
        className: "tracker summary",
        
        render: function() {
            $(this.el).html(this.template(this.model.toJSON()));
            return this;
        },
        template: _.template($('#tpl_tracker_details').html())
      
    });
        
    window.Grade = Backbone.Model.extend({

    });
   
    window.GradeList = Backbone.Collection.extend({
       
        model: Grade,

        modelsFromTable: function(data) {
            var cols = _.pluck($("col", data), 'className');
            var rows = $("tr", data).slice(1);
            var models = _.map(rows, function(tr, key) {
                var table_cells = $("td", $(tr))
                var model = _.reduce(table_cells, function(memo, td, key) {
                    if ($(td).has("a[rel=grade]").length) {
                        memo["link"] = $("a[rel=grade]",$(td)).attr("href");
                        memo[cols[key]] = $("span."+cols[key], $(td)).html();
                    } else {
                        memo[cols[key]] = $(td).html();
                    }
                    return memo;
                }, {id: tr.id});
                return model;
            });
            return models;
        },

        parse: function(response) {
            $("#grades").html($("table.all", $(response)));
            return this.modelsFromTable($("#grades"));
        },
        
        setModels: function(data_element_sel) {
            this.add(this.modelsFromTable($(data_element_sel)));
       },
       
       url: function() {
           return this.tracker.url + "/grades";
       }
   });

    window.GradeListView = Backbone.View.extend({
 
        tagName: "ul",
        className: "grade_view_list",
 
        initialize:function () {
            this.model.bind("reset", this.render, this);
        },
 
        render:function (eventName) {
            var el = this.$el;
            _.each(this.model.models, function (grade) {
                el.append(new GradeListItemView({
                    model: grade,
                    id: grade.attributes.id
                }).render().el);
            }, this);
            return this;
        }
        
    });
    
    function setScoreBackground(jqel) {
        // console.log($(".score", jqel));
        var score_el = $(".score", jqel);
        var score_num = parseInt(score_el.text(),10);
        var range = 40,
            halfrange = range/2;
        var short = Math.min(100 - score_num, range);
        var red = parseInt( (255/halfrange) * Math.min(20, short), 10);
        var green = parseInt( 255 - (255/halfrange) * Math.max(0, short-halfrange), 10);
        console.log("short: " + short + ", rgb("+ red + "," + green + ",0)");
        score_el[0].style.cssText="background-color:rgb("+ red + "," + green + ",0)";
    }
    
    window.GradeListItemView = Backbone.View.extend({
 
        tagName: 'li',
 
        template: _.template($('#tpl_grade_listing').html()),
        render:function (eventName) {
            $(this.el).html(this.template(this.model.toJSON()));
            setScoreBackground(this.$el);
            return this;
        }
 
    });
    
   
   window.GradeView = Backbone.View.extend({
      
      tagName: 'tr',
      template: _.template("<td><%= date %></td><td><%= assessment %></td><td><%= score %></td><td><%= weighted_score %></td>" + 
                           '<td><a href="<%= link %>">More Info</a></td>'),
      
      render: function() {
        $(this.el).html(this.template(this.model.toJSON()));
        return this;
      }
   });
   
    window.AppView = Backbone.View.extend({
        
        el: $('#binder_app'),
        initialize: function() {
            
            this.trackers = new TrackerList();
            this.trackerListView = new TrackerListView({model:this.trackers});
            this.trackers.fetch();
            $(this.el).html(this.trackerListView.render().el);
        },
    });    

// Router
var AppRouter = Backbone.Router.extend({
 
    routes:{
        "":"trackersList",
        "trackers/:id":"trackerDetails"
    },
 
    trackersList:function() {
        this.trackers = new TrackerList();
        this.trackerListView = new TrackerListView({model:this.trackers});
        this.trackers.fetch();
        $("#binder_app").html(this.trackerListView.render().el);
    },
 
    trackerDetails:function(id) {
        this.tracker = this.trackers.get(id);
        this.tracker.fetch_details = true;
        this.trackerView = new TrackerView({model:this.tracker});
        var trackerView = this.trackerView;
        $(".details", $("#binder_app")).remove();
        $("#grades_chart", $("#binder_app")).remove();
        $("#binder_app").append($('<div class="details tracker"></div>'));
        $("#binder_app").append($('<div id="grades_chart"></div>'));
        
        this.tracker.fetch({success: function(model, response) {
            var details_column = $(".details", $("#binder_app"))
            details_column.append(trackerView.render().el);
            model.grades = new GradeList();
            model.gradeListView = new GradeListView({model:model.grades});
            model.grades.setModels('div#grades');
            details_column.append(model.gradeListView.render().el);
            var grades = model.gradeListView.model.toJSON();
            processGrades(grades, "grades_chart");
        }});
    }
});
 
    var app = new AppRouter();
    Backbone.history.start();

});