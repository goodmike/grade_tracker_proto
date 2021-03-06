var _design_basic = 
{
    "_id": "_design/basic",
    "views" : 
    {
        "ping": {
            "map": "function(doc) { if (doc._id === 'ping') { emit(doc._id, doc); } }"
        },
        "scores": {
            "map": "function(doc) { if (doc.type === 'score') {emit(doc.date, doc); } }"
        },
        "grades": {
            "map": "function(doc) { if (doc.type === 'score') {emit(doc._id, parseInt(doc.score, 10)); } }"
        },
        "avg": {
            "map": "function(doc) { if (doc.type === 'score') {emit(doc.score, parseInt(doc.score, 10)); } }"
        },
        "weights": {
            "map": "function(doc) { if (doc.type === 'assessment_weight') {emit(doc.assessment, parseInt(doc.weight, 10));} }"
        },
        "tracker_by_id": {
            "map": "function(doc) { if (doc.type === 'score') { emit([doc.tracker_id, doc.date], doc); } else if (doc.type === 'assessment_weight') { emit([doc.tracker_id,'weight'],doc); } else if (doc.type === 'tracker') { emit([doc._id,'tracker'], doc); } }"
        }
    }
}
;

_design_basic = "_design/basic";