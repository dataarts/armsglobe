# Data Globe
A more generic version of https://github.com/dataarts/armsglobe for visualizing source/destination data.

This fork attempts to make the globe data-agnostic so that users can simply provide source/destination data and have it graphed. If timestamp information is provided, this globe can act as a semi-real-time visualization.

## TODOs

* ~~Get rid of the memory leak caused by adding new visualized meshes constantly without ever deleting them~~
* Highlight the destination country when the particle "hits" it
* Allow particle colour to be set via the data
* Clean up sample data to remove unneeded fields

## Notes

* Data is currently fed into the visualization via `main.js:startDataPump()`. Eventually we'll want to replace that with a RESTful endpoint that is periodically polled for new data
* `visualize.js:selectVisualization()` is the current entry point to add new lines to the visualization, while `visualize.js:getVisualizedMesh()` is the method that actually does the heavy lifting (current call stack is `main.js:startDataPump()` -> `visualize.js:selectVisualization()` -> `visualize.js:getVisualizedMesh()`)
