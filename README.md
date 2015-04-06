# Data Globe
A more generic version of https://github.com/dataarts/armsglobe for visualizing source/destination data.

This fork attempts to make the globe data-agnostic so that users can simply provide source/destination data and have it graphed.

## Building

To build this application you'll need an up-to-date copy of [Node.js](http://nodejs.org/), [Grunt CLI](http://gruntjs.com/), [Bower](http://bower.io/), and [CoffeeScript](http://coffeescript.org/). Once all these are installed, simply run the following from within the `dataglobe` directory:

```bash
$ npm install
$ bower install
$ grunt
```
And everything will be built for you.

## Running

To run this application, ensure Node.js has been installed along with all the dataglobe dependencies (see "Building"). Once the application has been built, run:

```bash
$ node app.js
```
And it will start a development server for you to view your work. In addition, you can also run

```bash
$ grunt watch
```
To have it watch for changes and automatically rebuild.

## Data Format

The visualization expects data to be of the following format:

```
[
  {
    "src": <country name>,
    "dest": <country name>,
    "colour": ["r"|"o"|"b"|"g"|"p"],
    "time": <timestamp>
  },
  // ... etc.
]
```

Acceptable country names can be found in `country_iso3166.json`. Timestamps can be anything that is convertable to a [JavaScript Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date).

Data does not need to be in any particular order; the visualization takes care of sorting the data by date for you.

## TODOs

* [ ] Allow source/destination data to be specified as lat/long, rather than country names
* [x] Highlight the destination country when the particle "hits" it
* [x] Create subtle trail effect for particles

## Notes

* Data is currently fed into the visualization via `main.js:startDataPump()`. Eventually we'll want to replace that with a RESTful endpoint that is periodically polled for new data
* `visualize.js:selectVisualization()` is the current entry point to add new lines to the visualization, while `visualize.js:getVisualizedMesh()` is the method that actually does the heavy lifting (current call stack is `main.js:startDataPump()` -> `visualize.js:selectVisualization()` -> `visualize.js:getVisualizedMesh()`)
