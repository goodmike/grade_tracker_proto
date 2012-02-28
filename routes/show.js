
/*
 * GET tracker display.
 */

exports.index = function(db) {
    return function(req,res) {
        db.get('_design/basic/_view/scores', function(err,doc) {
            for (var key in err) {
                console.log("err[" + key + "]: " + err[key]);
            }
           res.render('show', {
              title: 'Grade Tracker',
              items: doc
            });
        });
    };
};