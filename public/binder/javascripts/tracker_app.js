var originalSync = Backbone.sync;

Backbone.sync = function(method, model, options) {

   // Override JSON-request options.
   var extensions = {
       dataType:     'html',
   };
   if (method !== "read") {
        extensions.data = $.param(model.toJSON());
   }
   var params = _.extend(options, extensions);
   
   originalSync.apply(Backbone, [ method, model, params ]);
};

Backbone.emulateJSON = true;

var today = function() {
    var d = new Date();
    var curr_date = d.getDate();
    if (curr_date < 10) {
        curr_date = "0" + curr_date;
    }
    var curr_month = d.getMonth() + 1;
    if (curr_month < 10) {
        curr_month = "0" + curr_month;
    }
    var curr_year = d.getFullYear();
    var date_string = "" + curr_year + "-" + curr_month + "-" + curr_date;
    return function() { return date_string };
}();

function processGrades(tracker, grades, chart_el_id) {
    
    var start_date = tracker.start_date + " 12:00 PM";
    var end_date   = tracker.end_date + " 12:00 PM";
    var goal_score = parseInt(tracker.goal, 10);
    
    var ms_per_week = 1000 * 3600 * 24 * 7;
    var weeks = (new Date(end_date) - new Date(start_date)) / ms_per_week;
    var week_scale = parseInt(weeks/6) + 1;
    
    var gradesline = _.map(grades, function(grade) {
        return [grade.date + " 12:00PM", parseInt(grade.score, 10)];
    });
           
    var targetline = [[start_date, goal_score],[end_date, goal_score]];

    var running_avg_points = _.reduce(grades, function(memo, grade, i) {
        var d = grade.date + " 12:00PM";
        var p = parseInt(grade.weighted_score,10);
        var w = parseInt(grade.weight,10);
        if (i===0) return [{"date": d, "points": p, "weight": w}];
        var last = memo[i-1];
        memo.push({"date": d, "points": p + last.points, "weight": w + last.weight});
        return memo;
    }, []);
    var running_avg_line = _.map(running_avg_points, function(point) {
        return [point.date, point.points/point.weight];
    });
    
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
            min: labelDate(tracker.start_date),
            max: labelDate(tracker.end_date),
            tickInterval: week_scale + ' week'
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
            $("#primary_data").html($("div.tracker-grades-block", $(response)));
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
        
        defaults:{
            "id":null,
            "date":today(),
            "assessment":"homework",
            "score":null,
            "topic":"",
            "notes":""
        }
    });
   
    window.GradeList = Backbone.Collection.extend({
       
        model: Grade,

        initialize: function(attributes) {
            this.tracker = attributes.tracker;
        },

        // comparator function for auto-sorting?

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
           return this.tracker.url() + "/grades";
       }
   });

    window.GradeListView = Backbone.View.extend({
 
        tagName: "ul",
        className: "grade_view_list",
 
        initialize:function (opts) {
            this.model = opts.model;
            this.tracker = opts.tracker;
            this.model.bind("reset", this.render, this);
            var view = this;
            this.model.bind("add", function (grade) {
                $(view.el).prepend(new GradeListItemView({model:grade}).render().el);
                $("#modal").hide();
                view.drawChart();
            });
        }, 
 
        drawChart: function() {
            processGrades(this.tracker.toJSON(), this.model.toJSON(), "grades_chart");
        },
 
        render:function (eventName) {
            this.drawChart();
            var el = this.$el;
            var display_grades = this.model.models.slice().reverse();
            _.each(display_grades, function (grade) {
                el.append(new GradeListItemView({
                    model: grade,
                    id: grade.attributes.id
                }).render().el);
            }, this);
            return this;
        }
        
    });
    
    function setScoreBackground(jqel) {
        var score_el = $(".score", jqel);
        var score_num = parseInt(score_el.text(),10);
        var range = 40,
            halfrange = range/2;
        var short = Math.min(100 - score_num, range);
        var red = parseInt( (255/halfrange) * Math.min(20, short), 10);
        var green = parseInt( 255 - (255/halfrange) * Math.max(0, short-halfrange), 10);
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
    
    window.GradeFormView = Backbone.View.extend({
       
        form_data_sel: "form.grade_post",
        className: "controls",
       
        render: function(eventName) {
            
            var model_json = this.model.toJSON();
            var form = $(this.form_data_sel);
            this.$el.html(form.html());
            $('[name]', this.$el).each(function(index,control) {
                var control_name = control.name;
                $(control).val(model_json[control_name]);
            });
            return this;
        },
        
        
        events:{
            "click .save":"saveGrade",
        },

        saveGrade:function () {
            this.model.set({
                date:$('#grade_date').val(),
                assessment:$('#grade_assessment').val(),
                score:$('#grade_score').val(),
                topic:$('#grade_topic').val(),
                notes:$('#grade_notes').val()
                }, {silent: true}
            );
            if (this.model.isNew()) {
                app.grades.create(this.model, {
                    wait: true,
                    success: function(model, response) {
                        var weighted_score = model.attributes.score; // will come from response
                        model.set({weighted_score: model.attributes.score});
                    }
                });
            } else {
                this.model.save();
            }
            return false;
        },
        
        close:function () {
            this.$el.unbind();
            this.$el.empty();
        }
    });
   
    window.AddView = Backbone.View.extend({

        template:_.template($('#tpl_add_view').html()),
        
        tagName: "div",
        id: "add_grade",

        initialize:function () {
            this.render();
        },

        render:function (eventName) {
            this.$el.html(this.template());
            return this;
        },

        events:{
            "click .new":"newGrade"
        },

        newGrade:function (event) {
            if (app.gradeView) app.gradeView.close();
            app.gradeView = new GradeFormView({model:new Grade()});
            $("#modal").html(app.gradeView.render().el);
            $("#modal").show();
            return false;
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
            var details_column = $(".details", $("#binder_app"));
            details_column.append(trackerView.render().el);
            var add_view = new AddView();
            details_column.append(add_view.render().el);
            app.grades = new GradeList({tracker:app.tracker});
            app.grades.reset().setModels('div#grades');
            app.gradeListView = new GradeListView({
                model:app.grades,
                tracker:model    
            });
            details_column.append(app.gradeListView.render().el);
//            model.grades = app.gradeListView.model.toJSON();
//            processGrades(model, "grades_chart");
        }});
    }
});
 
    var app = new AppRouter();
    Backbone.history.start();

});