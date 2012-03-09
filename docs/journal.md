## Trying out backbone.js

* First, do things the easy way, with JSON.
* Set up a /grades url (/grades.json?) for a backbone client to fetch from.
* Following examples in Hypermedia book, set up tempates for the server view.

* I could make an alternate template that puts data on page to bootstrap it.

### Using the HTML API

* Let's provide a method to GradeList.parse that takes the table and prepares it for display
  * The models could be much more interesting, more geared to chart display.
  * The collection could represent chart, could contain data table as element.
* Step 1: JS that takes table and makes graph
  * First into JS data structure. 
  * Then, prepare jqlot-ready data (view stage)
  * Then, apply charting method to view data.