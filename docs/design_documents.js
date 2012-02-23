{
    "_id": "_design/microblog",
    "views" : { 
        "ping": {
            "map": function(doc) {
                if (doc._id == 'ping') { emit(doc._id, doc); } 
            }
        }
    }
}