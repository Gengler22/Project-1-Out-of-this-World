class DiscoveryYearLinechart {

    /**
     * Class constructor with basic chart configuration
     * @param {Object}
     * @param {Array}
     */
    constructor(_config, _data) {
      this.config = {
        parentElement: _config.parentElement,
        width: 800,
        height:  300,
        margin:  {top: 30, right: 10, bottom: 105, left: 55},
        contextHeight: 45,
        contextMargin: {top: 350, right: 10, bottom: 40, left: 45}
      }
      this.data = _data;
      this.initVis();
    }
    
    /**
     * Initialize scales/axes and append static chart elements
     */
    initVis() {
      let vis = this;
      console.log(vis.data);
      vis.data.sort();
  
      const containerWidth = vis.config.width + vis.config.margin.left + vis.config.margin.right;
      const containerHeight = vis.config.height + vis.config.margin.top + vis.config.margin.bottom;
  
      vis.xScaleFocus = d3.scaleTime()
          .range([0, vis.config.width])
          

      vis.xScaleContext = d3.scaleTime()
          .range([0, vis.config.width]);
  
      vis.yScaleFocus = d3.scaleLinear()
          .range([vis.config.height, 0])
          .nice();
  
      vis.yScaleContext = d3.scaleLinear()
          .range([vis.config.contextHeight, 0])
          .nice();
  
      // Initialize axes
      vis.xAxisFocus = d3.axisBottom(vis.xScaleFocus).tickSizeOuter(0).tickFormat(d3.format("d"));
      vis.xAxisContext = d3.axisBottom(vis.xScaleContext).tickSizeOuter(0).tickFormat(d3.format("d"));
      vis.yAxisFocus = d3.axisLeft(vis.yScaleFocus);
  
      // Define size of SVG drawing area
      vis.svg = d3.select(vis.config.parentElement)
          .attr('width', containerWidth)
          .attr('height', containerHeight);
  
      // Append focus group with x- and y-axes
      vis.focus = vis.svg.append('g')
          .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);
  
      vis.focus.append('defs').append('clipPath')
          .attr('id', 'clip')
        .append('rect')
          .attr('width', vis.config.width)
          .attr('height', vis.config.height);
      
      vis.focusLinePath = vis.focus.append('path')
          .attr('class', 'chart-line');
  
      vis.xAxisFocusG = vis.focus.append('g')
          .attr('class', 'axis x-axis')
          .attr('transform', `translate(0,${vis.config.height})`);
  
      vis.yAxisFocusG = vis.focus.append('g')
          .attr('class', 'axis y-axis');
  
      vis.tooltipTrackingArea = vis.focus.append('rect')
          .attr('width', vis.config.width)
          .attr('height', vis.config.height)
          .attr('fill', 'none')
          .attr('pointer-events', 'all');
  
      // Empty tooltip group (hidden by default)
      vis.tooltip = vis.focus.append('g')
          .attr('class', 'tooltip')
          .style('display', 'none');
  
      vis.tooltip.append('circle')
          .attr('r', 4);
  
      vis.tooltip.append('text');
  
  // 
      // Append context group with x- and y-axes
      vis.context = vis.svg.append('g')
          .attr('transform', `translate(${vis.config.contextMargin.left},${vis.config.contextMargin.top})`);
  
      vis.contextAreaPath = vis.context.append('path')
          .attr('class', 'chart-area');
  
      vis.xAxisContextG = vis.context.append('g')
          .attr('class', 'axis x-axis')
          .attr('transform', `translate(0,${vis.config.contextHeight})`);
  
      vis.brushG = vis.context.append('g')
          .attr('class', 'brush x-brush');
  
  
      // Initialize brush component
      vis.brush = d3.brushX()
          .extent([[0, 0], [vis.config.width, vis.config.contextHeight]])
          .on('brush', function({selection}) {
            if (selection) vis.brushed(selection);
          })
          .on('end', function({selection}) {
            if (!selection) vis.brushed(null);
          });
      
    }
  
    /**
     * Prepare the data and scales before we render it.
     */
    updateVis() {
      let vis = this;
 
      vis.xAxisFocusG.append('text')
        .attr("transform", "translate(0,0)")
        .attr("y", vis.config.height - 202)
        .attr("x", vis.config.width - 400)
        .attr("font-size", "12px")
        .attr("stroke", "black")
        .text("Year of Exoplanet Discovery");
          

      vis.yAxisFocusG.append('text')
        .attr("transform", "rotate(-90)")
        .attr("dy", "-13.5em")
        .attr("y", vis.config.height -200)
        .attr("x", vis.config.width - 860)
        .attr("font-size", "12px")
        .attr("stroke", "black")
        .text("Number of Exoplanets per Year")

      vis.xValue = d => d[0];
      vis.yValue = d => d[1];
  
      vis.line = d3.line()
        .x(d => vis.xScaleFocus(vis.xValue(d)))
        .y(d => vis.yScaleFocus(vis.yValue(d)));

      vis.area = d3.area()
        .x(d => vis.xScaleContext(vis.xValue(d)))
        .y1(d => vis.yScaleContext(vis.yValue(d)))
        .y0(vis.config.contextHeight);

  // Set the scale input domains
      vis.xScaleFocus.domain(d3.extent(vis.data, vis.xValue));
      vis.yScaleFocus.domain(d3.extent(vis.data, vis.yValue));
      vis.xScaleContext.domain(vis.xScaleFocus.domain());
      vis.yScaleContext.domain(vis.yScaleFocus.domain());

      vis.bisectDate = d3.bisector(vis.xValue).left;

      vis.renderVis();
    }
  
    /**
     * Bind data to visual elements
     */
    renderVis() {
      let vis = this;
  
      vis.focusLinePath
        .datum(vis.data)
        .attr('d', vis.line);

      vis.contextAreaPath
        .datum(vis.data)
        .attr('d', vis.area);

  
      vis.tooltipTrackingArea
          .on('mouseenter', () => {
            vis.tooltip.style('display', 'block');
          })
          .on('mouseleave', () => {
            vis.tooltip.style('display', 'none');
          })
          .on('mousemove', function(event) {
            // Get date that corresponds to current mouse x-coordinate
            const xPos = d3.pointer(event, this)[0]; // First array element is x, second is y
            const date = vis.xScaleFocus.invert(xPos);
  
            // Find nearest data point
            const index = vis.bisectDate(vis.data, date, 1);
            const a = vis.data[index - 1];
            const b = vis.data[index];
            const d = b && (date - a[0] > b[0] - date) ? b : a; 
  
            // Update tooltip
            vis.tooltip.select('circle')
                .attr('transform', `translate(${vis.xScaleFocus(d[0])},${vis.yScaleFocus(d[1])})`);
            
            vis.tooltip.select('text')
                .attr('transform', `translate(${vis.xScaleFocus(d[0])},${(vis.yScaleFocus(d[1]) - 15)})`)
                .text(Math.round(d[1]));
          });
      
      // Update the axes
      vis.xAxisFocusG.call(vis.xAxisFocus);
      vis.yAxisFocusG.call(vis.yAxisFocus);
      vis.xAxisContextG.call(vis.xAxisContext);

      const defaultBrushSelection = [vis.xScaleFocus(new Date(2000)), vis.xScaleContext.range()[1]];
      vis.brushG
        .call(vis.brush)
        .call(vis.brush.move, defaultBrushSelection);
  
    }

    brushed(selection) {
      let vis = this;
  
      // Check if the brush is still active or if it has been removed
      if (selection) {
        // Convert given pixel coordinates (range: [x0,x1]) into a time period (domain: [Date, Date])
        const selectedDomain = selection.map(vis.xScaleContext.invert, vis.xScaleContext);
  
        // Update x-scale of the focus view accordingly
        vis.xScaleFocus.domain(selectedDomain);
      } else {
        // Reset x-scale of the focus view (full time period)
        vis.xScaleFocus.domain(vis.xScaleContext.domain());
      }
  
      // Redraw line and update x-axis labels in focus view
      vis.focusLinePath.attr('d', vis.line);
      vis.xAxisFocusG.call(vis.xAxisFocus);
    }
  }