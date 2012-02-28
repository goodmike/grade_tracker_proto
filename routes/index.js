/*
 * GET home page.
 */

exports.index = function(db) {
    return function(req,res) {
    //    var options = {
    //        descending: true
    //    };
        db.get('_design/basic/_view/ping', function(err,doc) {
            for (var key in err) {
                console.log("err[" + key + "]: " + err[key]);
            }
           res.render('index', {
              title: 'Express deployed from Could9',
              items: doc
            });
        });
    };
};