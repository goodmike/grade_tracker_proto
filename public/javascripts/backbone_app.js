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
       url: "/grades",
       parse: function(response) {
           var items = new Backbone.Collection(response.collection.items);
           this.items_length = items.length;
           return items.pluck("data");
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