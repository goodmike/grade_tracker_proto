/*
 * GET tracker display.
 */

exports.show = function(db) {
    return function(req,res) {
        db.get('_design/basic/_view/scores', function(err,doc) {
           res.render('show', {
              title: 'Grade Tracker',
              items: doc
            });
        });
    };
};