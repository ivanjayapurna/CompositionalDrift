function simulate() {
	//Get all relevant inputs
	numUniqueMonomers = 2
	var totalNumMonomers = parseInt(document.getElementById("totalNumMonomers").value);
	var mRatio = parseInt(document.getElementById("mRatio").value);
	var conversion = parseInt(document.getElementById("conversion").value);
	var numRowsToShow = parseInt(document.getElementById("numRowsToShow").value);
	var graphTypeObj = document.getElementById("graph1Type");
	var graphType = graphTypeObj.options[graphTypeObj.selectedIndex].value;
	var hist1Monomer = parseInt(document.getElementById("hist1Monomer").value);
	var monomer1Ratio = parseFloat(document.getElementById("monomer1Ratio").value);
	var monomer2Ratio = parseFloat(document.getElementById("monomer2Ratio").value);
	var monomer1RR = parseFloat(document.getElementById("monomer1RR").value);
	var monomer2RR = parseFloat(document.getElementById("monomer2RR").value);
	//Initial variable calculations
	console.log("Type of monomer1Ratio: ", typeof(monomer1Ratio));
	polymerLength = Math.floor(mRatio * conversion / 100);
	var numPolymers = Math.floor(totalNumMonomers / mRatio);
	var monomerRatioList = [monomer1Ratio, monomer2Ratio];
	var rrList = [[monomer1RR, 1], [1, monomer2RR]];
	var monomerAmountsList = getMonomerAmounts(monomerRatioList, totalNumMonomers);
	initialMonomerAmountList = getMonomerAmounts(monomerRatioList, totalNumMonomers);
	console.log("initialMonomerAmountList1: ", initialMonomerAmountList);
	//console.log(monomerAmountsList);
	//Initiate chains, all polymer chains are represented as arrays and stored in another array, polymerArray
	polymerArray = [];
	var currNumPolymers;
	for (currNumPolymers = 0; currNumPolymers < numPolymers; currNumPolymers++) {
		var initChoices = [];
		var initWeightList = [];
		//if it is a 2-monomer system, use the Mayo Lewis Equation to Determine Starting Monomers
		//Weights that determine probabilty of monomer starting the chain are calculated
		if (numUniqueMonomers == 2) {
			var f1 = monomerAmountsList[0];
			var f2 = monomerAmountsList[1];
			var r1 = rrList[0][0];
			var r2 = rrList[1][1];
			var initWeight = (r1*f1**2 + f1*f2) / (r1*f1**2 + 2*f1*f2 + r2*f2**2);
			initChoices.push(1);
			initChoices.push(2);
			initWeightList.push(initWeight);
			initWeightList.push(1 - initWeight);
		} 
		//Use a weighted random selector to choose the starting monomer
		var startingMonomer = parseInt(weightedRand(initChoices, initWeightList));
		//console.log("typeof startingMonomer: ", typeof(startingMonomer));
		//console.log("startingMonomer: ", startingMonomer);
		//Create a new polymer chain with the selected starting monomer
		polymerArray.push([startingMonomer]);
		//Remove one of that monomer from the pool
		monomerAmountsList[startingMonomer - 1] --;
	}
	//console.log("polymerArray: ", polymerArray);
	//Propogate chains
	//First loop: propagate until the polymer length reaches expected value
	for (var currLength = 1; currLength < polymerLength; currLength++) {
		//Second loop: during each cycle of propagation, add one monomer to each of the polymer chains
		for (var i = 0; i < polymerArray.length; i++) {
			//console.log("polymerArray: ", polymerArray);
			var polymer = polymerArray[i];
			var propagationChoices = [];
			var propagationWeightList = [];
			//Third loop: cycle through each unique monomer and calculate probability weight of the monomer to be added to 
			// the growing polymer chain
			for (var monomerID = 1; monomerID < numUniqueMonomers + 1; monomerID++) {
				//console.log("rrList: ", rrList);
				//console.log("polymer: ", polymer);
				//console.log("last monomer: ", polymer[polymer.length - 1] - 1);
				var reactivityRatio = rrList[polymer[polymer.length - 1] - 1][monomerID - 1];
				var propWeight = monomerAmountsList[monomerID - 1] * reactivityRatio;
				//console.log("monomerID: ",monomerID, "propWeight: ", propWeight);
				propagationChoices.push(monomerID);
				propagationWeightList.push(propWeight);
			}
			//Using weights, randomly select propagating monomer and add it to the polymer chain array
			//console.log("propagationSpec:", propagationSpec);
			var nextMonomer = parseInt(weightedRand(propagationChoices, propagationWeightList));
			polymer.push(nextMonomer);
			//Remove that monomer from the reactant pool
			monomerAmountsList[nextMonomer - 1]--;
		}
	}
	setGraph(graphType);
}
function updateChart(chartData) {
	chart.dataProvider = chartData;
	chart.validateData();
}
function getMonomerAmounts(monomerRatioList, totalNumMonomers) {
	var monomerAmountsList = [];
	var totalWeight = sumArray(monomerRatioList);
	for (var i = 0; i < monomerRatioList.length; i++) {
		var monomerRatio = monomerRatioList[i];
		var weight = monomerRatio / totalWeight;
		var monomerAmount = Math.ceil(totalNumMonomers * weight);
		//console.log("monomerRatio: ", monomerRatio);
		monomerAmountsList.push(monomerAmount);
	}
	return monomerAmountsList;
}
//Returns chartData formatted information for percent composition of each unique monomer at each index.
function getMonomerComposition(polymerArray, numUniqueMonomers, polymerLength) {
	var fullCompositionList = [];
	for (var monomerID = 1; monomerID <= numUniqueMonomers; monomerID++) {
		var singleCompositionList = [];
		for (var positionIndex = 0; positionIndex < polymerLength; positionIndex++) {
			var monomerCount = 0;
			for (var i = 0; i < polymerArray.length; i++) {
				polymer = polymerArray[i];
				if (polymer[positionIndex] == monomerID) {
					monomerCount++;
				}
			}
			var monomerRatio = monomerCount / polymerArray.length;
			singleCompositionList.push(monomerRatio);
		}
		var xyDataPair = [createRangeArray(polymerLength), singleCompositionList];
		fullCompositionList.push(xyDataPair);
	}
	chartData = convertToChartData(fullCompositionList, numUniqueMonomers, polymerLength);
	return chartData;
}
function getPercentageMonomer(polymerArray, numUniqueMonomers, polymerLength, initialMonomerAmountList) {
	var fullPercentageList = [];
	for (var monomerID = 1; monomerID <= numUniqueMonomers; monomerID++) {
		var singlePercentageList = [];
		var monomerRemaining = initialMonomerAmountList[monomerID -1];
		for (var positionIndex = 0; positionIndex < polymerLength; positionIndex++) {
			for (var i = 0; i < polymerArray.length; i++) {
				polymer = polymerArray[i];
				if (polymer[positionIndex] == monomerID) {
					monomerRemaining--;
				}
			}
			//console.log("initialMonomerAmountList: ", initialMonomerAmountList);
			var monomerPercentage = monomerRemaining / initialMonomerAmountList[monomerID -1];
			singlePercentageList.push(monomerPercentage);
		}
		var xyDataPair = [createRangeArray(polymerLength), singlePercentageList];
		fullPercentageList.push(xyDataPair);
	}
	chartData = convertToChartData(fullPercentageList, numUniqueMonomers, polymerLength);
	return chartData;
}
function getMonomerSeparation(polymerArray, numUniqueMonomers, polymerLength, monomerID){
	//console.log("monomerID: ", monomerID);
	//console.log("typeof monomerID: ", typeof(monomerID));
	var fullSeparationData = new Array(polymerLength + 1).fill(0)
	var largestBlock = 0;
	for (var i = 0; i < polymerArray.length; i++) {
		polymer = polymerArray[i];
		var numConsecutive = 0;
		for (var positionIndex = 0; positionIndex < polymerLength; positionIndex++) {
			//console.log("numConsecutive: ", numConsecutive);
			currMonomerID = polymer[positionIndex];
			//console.log("currMonomerID: ", currMonomerID);
			if (currMonomerID != monomerID && numConsecutive > 0) {
				fullSeparationData[numConsecutive] += numConsecutive;
				if (numConsecutive > largestBlock) {
					largestBlock = numConsecutive;
				}
				numConsecutive = 0;
			}
			if (currMonomerID == monomerID) {
				numConsecutive += 1;
			}
			if (positionIndex == polymerLength - 1) {
				if (numConsecutive != 0) {
					fullSeparationData[numConsecutive] += numConsecutive;
				}
			}
		}
	}
	console.log("largestBlock: ", largestBlock);
	fullSeparationData = fullSeparationData.slice(0, largestBlock + 2);
	var chartData = [];
	for (var blockSize = 0; blockSize < fullSeparationData.length; blockSize++) {
		var obj = {};
		var xID = "blockSize" + monomerID;
		var xCounts = "counts" + monomerID;
		obj[xID] = blockSize;
		obj[xCounts] = fullSeparationData[blockSize];
		chartData.push(obj);
	}
	return chartData;		
}
function getPolymerCompostion(polymerArray, numUniqueMonomers, polymerLength) {
	var fullCompositionList = [];
	for (var monomerID = 1; monomerID <= numUniqueMonomers; monomerID++) {
		var singleCompositionList = [];
		var totalMonomerCount = 0;
		for (var positionIndex = 0; positionIndex < polymerLength; positionIndex++) {
			for (var i = 0; i < polymerArray.length; i++) {
				polymer = polymerArray[i];
				if (polymer[positionIndex] == monomerID) {
					totalMonomerCount++;
				}
			}
			var polymerComposition = totalMonomerCount / (polymerArray.length * (positionIndex + 1));
			singleCompositionList.push(polymerComposition);
		}
		var xyDataPair = [createRangeArray(polymerLength), singleCompositionList];
		fullCompositionList.push(xyDataPair);
	}
	chartData = convertToChartData(fullCompositionList, numUniqueMonomers, polymerLength);
	return chartData;
}
function convertToChartData(fullList, numUniqueMonomers, polymerLength) {
	chartData = [];
	for (var i = 0; i <= polymerLength; i++) {
		var obj = {};
		for (var monomerID = 1; monomerID <= numUniqueMonomers; monomerID++) {
			var xID = "x" + monomerID;
			var yID = "y" + monomerID;
			//console.log("xID: ", xID);
			obj[xID] = fullList[monomerID - 1][0][i];
			obj[yID] = fullList[monomerID - 1][1][i];
		}
		chartData.push(obj);
	}
	return chartData;
}
function show() {
  var chartData = [{
    "x1": 1,
    "y1": 0.5,
    "x2": 1,
    "y2": 2.2
  }, {
    "x1": 2,
    "y1": 1.3,
    "x2": 2,
    "y2": 4.9
  }, {
    "x1": 3,
    "y1": 2.3,
    "x2": 3,
    "y2": 5.1
  }, {
    "x1": 4,
    "y1": 2.8,
    "x2": 4,
    "y2": 5.3
  }, {
    "x1": 5,
    "y1": 3.5,
    "x2": 5,
    "y2": 6.1
  }, {
    "x1": 6,
    "y1": 5.1,
    "x2": 6,
    "y2": 8.3
  }, {
    "x1": 7,
    "y1": 6.7,
    "x2": 7,
    "y2": 10.5
  }, {
    "x1": 8,
    "y1": 8,
    "x2": 8,
    "y2": 12.3
  }, {
    "x1": 9,
    "y1": 8.9,
    "x2": 9,
    "y2": 14.5
  }, {
    "x1": 10,
    "y1": 9.7,
    "x2": 10,
    "y2": 15
  }, {
    "x1": 11,
    "y1": 10.4,
    "x2": 11,
    "y2": 18.8
  }, {
    "x1": 12,
    "y1": 11.7,
    "x2": 12,
    "y2": 19
  }];
  //console.log("Original chartData: ", chartData);

  // XY CHART
  chart = new AmCharts.AmXYChart();

  chart.dataProvider = chartData;
  chart.startDuration = 1;

  // AXES
  // X
  var xAxis = new AmCharts.ValueAxis();
  xAxis.title = "X Axis";
  xAxis.position = "bottom";
  xAxis.dashLength = 1;
  xAxis.axisAlpha = 0;
  xAxis.autoGridCount = true;
  chart.addValueAxis(xAxis);

  // Y
  var yAxis = new AmCharts.ValueAxis();
  yAxis.position = "left";
  yAxis.title = "Y Axis";
  yAxis.dashLength = 1;
  yAxis.axisAlpha = 0;
  yAxis.autoGridCount = true;
  chart.addValueAxis(yAxis);

  // GRAPHS
  // triangles up
  var graph1 = new AmCharts.AmGraph();
  graph1.lineColor = "#FF6600";
  graph1.balloonText = "x:[[x]] y:[[y]]";
  graph1.xField = "x1";
  graph1.yField = "y1";
  graph1.lineAlpha = 0;
  graph1.bullet = "triangleUp";
  chart.addGraph(graph1);

  // triangles down
  var graph2 = new AmCharts.AmGraph();
  graph2.lineColor = "#FCD202";
  graph2.balloonText = "x:[[x]] y:[[y]]";
  graph2.xField = "x2";
  graph2.yField = "y2";
  graph2.lineAlpha = 0;
  graph2.bullet = "triangleDown";
  chart.addGraph(graph2);

  // CURSOR
  var chartCursor = new AmCharts.ChartCursor();
  chart.addChartCursor(chartCursor);

  // SCROLLBAR

  var chartScrollbar = new AmCharts.ChartScrollbar();
  chartScrollbar.scrollbarHeight = 5;
  chartScrollbar.offset = 15
  chart.addChartScrollbar(chartScrollbar);
  // WRITE
  chart.write("chartdiv");
}
function switchCharts(chart) {
	document.getElementById("chartdiv").style.display = "none";
	document.getElementById("chartdiv2").style.display = "block";
	chart.invalidateSize();
	chart.animateAgain();
}
function createHistChart(chartData) {
	var chart = new AmCharts.AmSerialChart();
	var obj = chartData[0];
	keyList = Object.keys(obj);
	console.log("keyList: ", keyList);
	//Histogram
	chart.dataProvider = chartData;
	chart.categoryField = keyList[0];
	chart.startDuration = 1;
	chart.sequencedAnimation = false; 

	//Value Axis
	var valueAxis = new AmCharts.ValueAxis();
	valueAxis.minimum = 0;
	chart.addValueAxis(valueAxis);

	//Graph
	var graph = new AmCharts.AmGraph();
	graph.type = "column";
	graph.fillAlphas = 1;
	graph.valueField = keyList[1];
	graph.balloonText = "[[value]]";
	chart.addGraph(graph);
	chart.write("chartdiv2");
	return chart;
}
function setGraph(type) {
	//console.log("type: ", type);
	var chartData;
	switch (type) {
		case "Monomer Occurences":
			console.log("got here 3");
			chartData = getMonomerComposition(polymerArray, numUniqueMonomers, polymerLength);
			chart.dataProvider = chartData;
			chart.validateData();
			break;
		case "Percentage Monomer":
			chartData = getPercentageMonomer(polymerArray, numUniqueMonomers, polymerLength, initialMonomerAmountList);
			chart.dataProvider = chartData;
			chart.validateData();
			break;
		case "Polymer Compositions":
			chartData = getPolymerCompostion(polymerArray, numUniqueMonomers, polymerLength);
			chart.dataProvider = chartData;
			chart.validateData();
			break;
		case "Monomer Separation":
			chartData = getMonomerSeparation(polymerArray, numUniqueMonomers, polymerLength, 1);
			var chart2 = createHistChart(chartData);
			document.getElementById("chartdiv").style.display = "none";
			document.getElementById("chartdiv2").style.display = "block";
			chart2.invalidateSize();
			chart2.animateAgain();
			console.log("got here2");
			return;
	}
	document.getElementById("chartdiv2").style.display = "none";
	document.getElementById("chartdiv").style.display = "block";
	console.log("got here");
	chart.invalidateSize();
}
//Creates an array from [1, 2, 3,......, N]
function createRangeArray(length) {
	var array = [];
	for (var i = 1; i <= length; i++) {
		array.push(i);
	}
	return array;
}
//Sums the numerical contents of an array
function sumArray(array) {
	return array.reduce(sum, 0)
}
function sum(a, b) {
	return a + b;
}
function rand(min, max) {
    return Math.random() * (max - min) + min;
};
 
function weightedRand(list, weight) {
    var total_weight = weight.reduce(function (prev, cur, i, arr) {
        return prev + cur;
    });
     
    var random_num = rand(0, total_weight);
    var weight_sum = 0;
    //console.log(random_num)
     
    for (var i = 0; i < list.length; i++) {
        weight_sum += weight[i];
        weight_sum = +weight_sum.toFixed(2);
         
        if (random_num <= weight_sum) {
            return list[i];
        }
    }
     
    // end of function
};