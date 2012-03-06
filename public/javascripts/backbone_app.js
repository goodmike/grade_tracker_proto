$(function() {
   
   window.Grade = Backbone.Model.extend({
       
   });
   
   window.GradeList = Backbone.Collection.extend({
       
       model: Grade,
       url: "/grades",
       parse: function(response) {
           var items = new Backbone.Collection(response.collection.items);
           return items.pluck("data");
       }
   });
//   window.Grades = new GradeList;

    window.GradeListView = Backbone.View.extend({
 
        tagName:'div',
 
        initialize:function () {
            this.model.bind("reset", this.render, this);
        },
 
        render:function (eventName) {
            _.each(this.model.models, function (grade) {
                $(this.el).append(new GradeView({model:grade}).render().el);
            }, this);
            return this;
        }
    });
   
   window.GradeView = Backbone.View.extend({
      
      tagName: 'p',
      template: _.template("score: <%= score %>; assessment: <%= assessment %>"),
      
      render: function() {
        console.log("GradeView render");
        $(this.el).html(this.template(this.model.toJSON()));
        return this;
      }
   });
   
   window.AppView = Backbone.View.extend({
      
        el: $("body"),
        initialize: function() {
            
            this.grades = new GradeList();
            this.gradeListView = new GradeListView({model:this.grades});
            this.grades.fetch();
            $(this.el).html(this.gradeListView.render().el);
        },
      
    });
    
    window.App = new AppView;
   
});