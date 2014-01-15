
nv.models.line = function() {
//  "use strict";
  //============================================================
  // Public Variables with Default Settings
  //------------------------------------------------------------

  var  scatter = nv.models.scatter()
    ;

  var margin = {top: 0, right: 0, bottom: 0, left: 0}
    , width = 960
    , height = 500
    , color = nv.utils.defaultColor() // a function that returns a color
    , getX = function(d) { return d.x; } // accessor to get the x value from a data point
    , getY = function(d) { return d.y; } // accessor to get the y value from a data point
    , getBox = function(d) { return d.box; } // accessor 
    , getErrorBar = function(d) { return d.y_err; } // accessor 
    , defined = function(d,i) { return !isNaN(getY(d,i)) && getY(d,i) !== null } // allows a line to be not continuous when it is not defined
    , isArea = function(d) { return d.area } // decides if a line is an area or just a line
    , hasErrorBars = function(d) { return d.errorBars? d.errorBars : false; } // boolean error bars 
    , hasBoundingBox = function(d) { return d.box? d.box : false; } // boolean box points
    , clipEdge = false // if true, masks lines within x and y scale
    , x //can be accessed via chart.xScale()
    , y //can be accessed via chart.yScale()
    , interpolate = "linear" // controls the line interpolation
    ;

  scatter
    .size(16) // default size
    .sizeDomain([16,256]) //set to speed up calculation, needs to be unset if there is a custom size accessor
    ;

  //============================================================


  //============================================================
  // Private Variables
  //------------------------------------------------------------

  var x0, y0 //used to store previous scales
      ;

  //============================================================


  function chart(selection) {
    selection.each(function(data) {
      var availableWidth = width - margin.left - margin.right,
          availableHeight = height - margin.top - margin.bottom,
          container = d3.select(this);

      //------------------------------------------------------------
      // Setup Scales

      x = scatter.xScale();
      y = scatter.yScale();

      x0 = x0 || x;
      y0 = y0 || y;
      
      //------------------------------------------------------------

      //------------------------------------------------------------
      // Setup containers and skeleton of chart

      var wrap = container.selectAll('g.nv-wrap.nv-line').data([data]);
      var wrapEnter = wrap.enter().append('g').attr('class', 'nvd3 nv-wrap nv-line');
      var defsEnter = wrapEnter.append('defs');
      var gEnter = wrapEnter.append('g');
      var g = wrap.select('g')

      gEnter.append('g').attr('class', 'nv-groups');
      gEnter.append('g').attr('class', 'nv-scatterWrap');

      wrap.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

      //------------------------------------------------------------




      scatter
        .width(availableWidth)
        .height(availableHeight);

      var scatterWrap = wrap.select('.nv-scatterWrap');
          //.datum(data); // Data automatically trickles down from the wrap

      scatterWrap.transition().call(scatter);



      defsEnter.append('clipPath')
          .attr('id', 'nv-edge-clip-' + scatter.id())
        .append('rect');

      wrap.select('#nv-edge-clip-' + scatter.id() + ' rect')
          .attr('width', availableWidth)
          .attr('height', (availableHeight > 0) ? availableHeight : 0);

      g   .attr('clip-path', clipEdge ? 'url(#nv-edge-clip-' + scatter.id() + ')' : '');
      scatterWrap
          .attr('clip-path', clipEdge ? 'url(#nv-edge-clip-' + scatter.id() + ')' : '');




      var groups = wrap.select('.nv-groups').selectAll('.nv-group')
          .data(function(d) { return d }, function(d) { return d.key });
      groups.enter().append('g')
          .style('stroke-opacity', 1e-6)
          .style('fill-opacity', 1e-6);

      groups.exit().remove();

      groups
          .attr('class', function(d,i) { return 'nv-group nv-series-' + i })
          .classed('hover', function(d) { return d.hover })
          .style('fill', function(d,i){ return color(d, i) })
          .style('stroke', function(d,i){ return color(d, i)});
      groups
          .transition()
          .style('stroke-opacity', 1)
          .style('fill-opacity', .5);

      var areaPaths = groups.selectAll('path.nv-area')
          .data(function(d) {
        	  return isArea(d) ? [d] : [] }); // this is done differently than lines because I need to check if series is an area
      areaPaths.enter().append('path')
          .attr('class', 'nv-area')
          .attr('d', function(d) {
            return d3.svg.area()
                .interpolate(interpolate)
                .defined(defined)
                .x(function(d,i) { return nv.utils.NaNtoZero(x0(getX(d,i))) })
                .y0(function(d,i) { return nv.utils.NaNtoZero(y0(getY(d,i))) })
                .y1(function(d,i) { return y0( y.domain()[0] <= 0 ? y.domain()[1] >= 0 ? 0 : y.domain()[1] : y.domain()[0] ) })
                //.y1(function(d,i) { return y0(0) }) //assuming 0 is within y domain.. may need to tweak this
                .apply(this, [d.values])
          });
      groups.exit().selectAll('path.nv-area')
           .remove();

      areaPaths
          .transition()
          .attr('d', function(d) {
            return d3.svg.area()
                .interpolate(interpolate)
                .defined(defined)
                .x(function(d,i) { return nv.utils.NaNtoZero(x(getX(d,i))) })
                .y0(function(d,i) { return nv.utils.NaNtoZero(y(getY(d,i))) })
                .y1(function(d,i) { return y( y.domain()[0] <= 0 ? y.domain()[1] >= 0 ? 0 : y.domain()[1] : y.domain()[0] ) })
                //.y1(function(d,i) { return y0(0) }) //assuming 0 is within y domain.. may need to tweak this
                .apply(this, [d.values])
          });



      var linePaths = groups.selectAll('path.nv-line')
          .data(function(d) {
        	  return [d.values]; });
      
      linePaths.enter().append('path')
          .attr('class', 'nv-line')
          .attr('d',
            d3.svg.line()
              .interpolate(interpolate)
              .defined(defined)
              .x(function(d,i) { return nv.utils.NaNtoZero(x0(getX(d,i))); })
              .y(function(d,i) { return nv.utils.NaNtoZero(y0(getY(d,i))); })
          );
      linePaths
          .transition()
          .attr('d',
            d3.svg.line()
              .interpolate(interpolate)
              .defined(defined)
              .x(function(d,i) { return nv.utils.NaNtoZero(x(getX(d,i))); })
              .y(function(d,i) { return nv.utils.NaNtoZero(y(getY(d,i))); })
          );

    // add an SVG group element errorbar for each point
    var errorbar = groups.selectAll('.errorbar')
      .data(function(d) {
      	if (!hasErrorBars(d)) {
    		return [];
    	} else {
        	// add a value to the data object for a line at each +/- value
        	return d.values.map(function(o, i) {
        		// Max width of crosshairs is 20 pixels, otherwise use the scaled values 
        		var width = Math.min(availableWidth / d.values.length, 20);
                // yerr values are ordered as [+.-]
                var yerr = getErrorBar(o);
                if (!yerr || yerr.length != 2) {
                	return;
                }
                var y1 = getY(o,i) + Math.abs(yerr[0]);
                var y2 = getY(o,i) - Math.abs(yerr[1]);
                return {x:getX(o,i), y:getY(o), y1:y1, y2:y2, width:width};
        	}).filter(function(e) { return e; });
        }
      });
    
    var ebenter = errorbar.enter()
      .append('g')
      .attr('class', 'errorbar');
   
    groups.exit().selectAll('.errorbar').remove();

    // update changing elements with new percentage and bar width
    errorbar.each(function(d, i) {
    	// Note that something is wrong with the order of the transitions... sometimes
    	//  they get called out of order which causes the errorbars to be drawn on a 
    	//  different scale
        var single = d3.select(this);
        
        single.selectAll(".ycenterline")
        .transition()
         .attr("x1", function(d,i) { return x(d.x); })
         .attr("y1", function(d,i) { return y(d.y1); })
         .attr("x2", function(d,i) { return x(d.x); })
         .attr("y2", function(d,i) { return y(d.y2); });
        
         // whisker bars
         single.selectAll(".whisker-top")
        .transition()
         .attr("x1", function(d,i) { return x(d.x)-d.width/2.0; })
         .attr("y1", function(d,i) { return y(d.y1); })
         .attr("x2", function(d,i) { return x(d.x)+d.width/2.0; })
         .attr("y2", function(d,i) { return y(d.y1); });

         single.selectAll(".whisker-bottom")
        .transition()
         .attr("x1", function(d,i) { return x(d.x)-d.width/2.0; })
         .attr("y1", function(d,i) { return y(d.y2); })
         .attr("x2", function(d,i) { return x(d.x)+d.width/2.0; })
         .attr("y2", function(d,i) { return y(d.y2); });
    });    
    ebenter.append("line")
      .attr("class", "ycenterline")
      .attr("shape-rendering", "crispEdges")
      .attr("x1", function(d,i) { return x0(d.x); })
      .attr("y1", function(d,i) { return y0(d.y1); })
      .attr("x2", function(d,i) { return x0(d.x); })
      .attr("y2", function(d,i) { return y0(d.y2); })
      .style("opacity", 1e-6)
     .transition()
       .style("opacity", 1)
       .attr("y1", function(d,i) { return y0(d.y1); })
       .attr("y2", function(d,i) { return y0(d.y2); });

    errorbar.exit().selectAll('.ycenterline').remove();
    errorbar.exit().selectAll('.whisker-top').remove();
    errorbar.exit().selectAll('.whisker-bottom').remove();
    errorbar.exit().remove();
    
    //top crossbar / whisker
    ebenter.append("line")
    .attr('class', 'whisker-top')
    .attr("shape-rendering", "crispEdges")
    .attr("x1", function(d,i) { return x0(d.x)-d.width/2.0; })
    .attr("y1", function(d,i) { return y0(d.y1); })
    .attr("x2", function(d,i) { return x0(d.x)+d.width/2.0; })
    .attr("y2", function(d,i) { return y0(d.y1); })
    .style("opacity", 1e-6)
     .transition()
     .style("opacity", 1)
    
    // bottom bar
    ebenter.append("line")
    .attr('class', 'whisker-bottom')
    .attr("shape-rendering", "crispEdges")
    .attr("x1", function(d,i) { return x0(d.x)-d.width/2.0; })
    .attr("y1", function(d,i) { return y0(d.y2); })
    .attr("x2", function(d,i) { return x0(d.x)+d.width/2.0; })
    .attr("y2", function(d,i) { return y0(d.y2); })
    .style("opacity", 1e-6)
     .transition()
     .style("opacity", 1)
   
    // List of boxes appended to the series group element
    var box = groups.selectAll('.box')
      .data(function(d) {
      	if (!hasBoundingBox(d)) {
    		return [];
    	} else {
    		// Calculate the box dimensions
        	var values = d.values.map(function(o, i) {
                var width = Math.min(availableWidth / d.values.length, 20);
                var rx = getX(o,i);
                var box = getBox(o);
                
        		if (!box || !box[0] || !box[1]) {
        			return;
        		}
                // add some error checking
                var height = Math.abs(y(box[1])-y(box[0]));
                var ry = box[1]>box[0]?box[1]:box[0];
                // Fill the box if the second value is smaller than the first
                var fill = (box[0] > box[1]? true: false);
                var recval = {rx:rx, ry:ry, width:width, height:height, fill: fill};
                return recval;
        	}); 
        	// The filter removes all false values
        	return values.filter(function(e) { return e; });
        }
      });
    box.enter()
    .append("rect")
      .attr("class", "box")
      .attr('style', function(d,i) {
    	  if (!d.fill) { return 'fill:none'; }
      })
      .attr("x", function(d) { return x0(d.rx) - d.width/2.0; })
      .attr("y", function(d) { return y0(d.ry); })
      .attr('width', function(d) { return d.width; })
      .attr("height", function(d) { return d.height; })
    .transition()
      .duration(200)
      .attr("y", function(d) { return y0(d.ry); })
      .attr("x", function(d) { return x0(d.rx) - d.width/2.0; })
      .attr('width', function(d) { return d.width; })

    box.transition()
    	.duration(200)
      .attr("x", function(d) { return x(d.rx) - d.width/2.0; })
      .attr("y", function(d) { return y(d.ry); })
      .attr("height", function(d) { return d.height; });
    
    box.exit().remove();
//  box.enter().append("rect")
//      .attr("class", "box")
//      .attr("x", 0)
//      .attr("y", function(d) { return x0(d[2]); })
//      .attr("width", width)
//      .attr("height", function(d) { return x0(d[0]) - x0(d[2]); })
//    .transition()
//      .duration(duration)
//      .attr("y", function(d) { return x1(d[2]); })
//      .attr("height", function(d) { return x1(d[0]) - x1(d[2]); });
//
//  box.transition()
//      .duration(duration)
//      .attr("y", function(d) { return x1(d[2]); })
//      .attr("height", function(d) { return x1(d[0]) - x1(d[2]); });
      
      
      //store old scales for use in transitions on update
      x0 = x.copy();
      y0 = y.copy();

    });

    return chart;
  }


  //============================================================
  // Expose Public Variables
  //------------------------------------------------------------

  chart.dispatch = scatter.dispatch;
  chart.scatter = scatter;

  d3.rebind(chart, scatter, 'id', 'interactive', 'size', 'xScale', 'yScale', 'zScale', 'xDomain', 'yDomain', 'xRange', 'yRange',
    'sizeDomain', 'forceX', 'forceY', 'forceSize', 'clipVoronoi', 'useVoronoi', 'clipRadius', 'padData','highlightPoint','clearHighlights');

  chart.options = nv.utils.optionsFunc.bind(chart);

  chart.margin = function(_) {
    if (!arguments.length) return margin;
    margin.top    = typeof _.top    != 'undefined' ? _.top    : margin.top;
    margin.right  = typeof _.right  != 'undefined' ? _.right  : margin.right;
    margin.bottom = typeof _.bottom != 'undefined' ? _.bottom : margin.bottom;
    margin.left   = typeof _.left   != 'undefined' ? _.left   : margin.left;
    return chart;
  };

  chart.width = function(_) {
    if (!arguments.length) return width;
    width = _;
    return chart;
  };

  chart.height = function(_) {
    if (!arguments.length) return height;
    height = _;
    return chart;
  };

  chart.x = function(_) {
    if (!arguments.length) return getX;
    getX = _;
    scatter.x(_);
    return chart;
  };

  chart.y = function(_) {
    if (!arguments.length) return getY;
    getY = _;
    scatter.y(_);
    return chart;
  };

  chart.clipEdge = function(_) {
    if (!arguments.length) return clipEdge;
    clipEdge = _;
    return chart;
  };

  chart.color = function(_) {
    if (!arguments.length) return color;
    color = nv.utils.getColor(_);
    scatter.color(color);
    return chart;
  };

  chart.interpolate = function(_) {
    if (!arguments.length) return interpolate;
    interpolate = _;
    return chart;
  };

  chart.defined = function(_) {
    if (!arguments.length) return defined;
    defined = _;
    return chart;
  };

  chart.isArea = function(_) {
    if (!arguments.length) return isArea;
    isArea = d3.functor(_);
    return chart;
  };
  
  chart.getErrorBar = function(_) {
	  if (!arguments.length) {
		  return getErrorBar;
	  }
	  getErrorBar=d3.functor(_);
	  return chart;
  }
  
  chart.hasErrorBars = function(_) {
	  if (!arguments.length) {
		  return hasErrorBars;
	  }
	  hasErrorBars=d3.functor(_);
	  return chart;
  };
  
  
  
  chart.getBox = function(_) {
	  if (!arguments.length) {
		  return getBox;
	  }
	  getBox=d3.functor(_);
	  return chart;
  }

  chart.hasBoundingBox = function(_) {
	  if (!arguments.length) return hasBoundingBox;
	  hasBoundingBox=d3.functor(_);
	  return chart;
  };

  //============================================================


  return chart;
}
